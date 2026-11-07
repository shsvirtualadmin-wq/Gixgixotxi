/**
 * Boardly Non-Blocking Transactional Email Dispatcher (`/src/services/emailNotificationService.ts`)
 *
 * All outbound emails go strictly through the server-side `/api/send-email` endpoint,
 * which calls `https://api.resend.com/emails` using the server-side `RESEND_API_KEY`.
 *
 * HARD RULE: Email sending MUST NEVER block or break the main user/admin action.
 * Every helper is fire-and-forget, wrapped in try/catch, and retries once on transient failure.
 */

import { doc, setDoc, collection, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type {
  TransactionalEmailEventType,
  KobanReceiptSubType,
  SubjectBreakdownRow,
} from '@/lib/emailTemplates';
import type { AttemptQuestion } from '@/types';

export interface EmailNotificationPreferences {
  testStarted: boolean;
  smallKobanReceipts: boolean;
}

export interface AdminEmailLogItem {
  id: string;
  idempotencyKey: string;
  eventType: TransactionalEmailEventType;
  recipientRole: 'student' | 'admin' | 'referrer' | 'friend';
  recipientHash: string;
  recipientMasked: string;
  subject: string;
  status: 'sent' | 'failed' | 'skipped';
  resendMessageId: string | null;
  error: string | null;
  createdAt: string;
  canRetry?: boolean;
}

export interface AdminEmailConfigInfo {
  hasResendKey: boolean;
  emailFrom: string;
  adminEmails: string[];
  appUrl: string;
  kobanAlertThreshold: number;
  enableTestStartEmail: boolean;
}

const PREFS_LS_PREFIX = 'boardly_email_prefs_';

export function getEmailNotificationPreferences(
  uid?: string | null,
  profilePrefs?: Partial<EmailNotificationPreferences> | null
): EmailNotificationPreferences {
  const defaults: EmailNotificationPreferences = {
    testStarted: false,
    smallKobanReceipts: true,
  };
  if (profilePrefs && typeof profilePrefs === 'object') {
    return {
      testStarted:
        typeof profilePrefs.testStarted === 'boolean'
          ? profilePrefs.testStarted
          : defaults.testStarted,
      smallKobanReceipts:
        typeof profilePrefs.smallKobanReceipts === 'boolean'
          ? profilePrefs.smallKobanReceipts
          : defaults.smallKobanReceipts,
    };
  }
  if (!uid || typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(`${PREFS_LS_PREFIX}${uid}`);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      testStarted: Boolean(parsed.testStarted),
      smallKobanReceipts: parsed.smallKobanReceipts !== false,
    };
  } catch {
    return defaults;
  }
}

export async function saveEmailNotificationPreferences(
  uid: string,
  prefs: EmailNotificationPreferences
): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${PREFS_LS_PREFIX}${uid}`, JSON.stringify(prefs));
    }
  } catch {
    // Ignore storage quota errors
  }

  if (!uid) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      emailPreferences: {
        testStarted: Boolean(prefs.testStarted),
        smallKobanReceipts: Boolean(prefs.smallKobanReceipts),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function getBearerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore token error
  }
  return headers;
}

/**
 * Core non-blocking dispatcher to `/api/send-email`.
 * Never throws; retries once on network or 5xx failure.
 */
export function triggerTransactionalEmail(
  eventType: TransactionalEmailEventType,
  recordId: string,
  data: Record<string, any>
): void {
  void (async () => {
    try {
      const currentUser = auth.currentUser;
      const emailPreferences = getEmailNotificationPreferences(currentUser?.uid);
      const headers = await getBearerHeaders();

      const payload = {
        eventType,
        recordId,
        data: {
          ...data,
          emailPreferences,
        },
      };

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 800));
          }
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
            break;
          }
        } catch (err) {
          if (attempt === 1) {
            console.warn(`[emailNotificationService] Transient error sending ${eventType}:`, err);
          }
        }
      }
    } catch (outerErr) {
      console.warn(`[emailNotificationService] Non-blocking email hook warning (${eventType}):`, outerErr);
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPED EVENT HELPERS (Non-blocking, safe to call after any action succeeds)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Koban purchase request submitted (sends to Student with masked ref + Admins with full ref)
 */
export function notifyKobanPurchaseRequestSubmitted(params: {
  requestId: string;
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  kobansAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  transactionId: string;
  packageName?: string;
  note?: string;
}): void {
  triggerTransactionalEmail('koban_purchase_request', params.requestId, params);
}

/**
 * 2A. Koban purchase approved by admin (sends to Student + Admin copy)
 */
export function notifyKobanPurchaseApproved(params: {
  requestId: string;
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  kobansAmount: number;
  balanceBefore?: number;
  newBalance: number;
  transactionId?: string;
  ledgerId?: string;
  adminEmail: string;
}): void {
  triggerTransactionalEmail('koban_purchase_approved', params.requestId, params);
}

/**
 * 2B. Koban purchase rejected by admin (sends to Student + Admin copy)
 */
export function notifyKobanPurchaseRejected(params: {
  requestId: string;
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  kobansAmount: number;
  reason: string;
  transactionId?: string;
  adminEmail: string;
}): void {
  triggerTransactionalEmail('koban_purchase_rejected', params.requestId, params);
}

/**
 * 3. Kobans received or spent for any reason (daily claim, milestone, referral reward, store purchase, admin grant)
 */
export function notifyKobanReceipt(params: {
  recordId: string;
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  deltaAmount: number; // +X received or -X spent
  balanceBefore?: number;
  newBalance: number;
  reason: string;
  subType: KobanReceiptSubType;
  itemName?: string;
  items?: Array<{ id?: string; name: string; category?: string; priceKobans: number }>;
  transactionId?: string;
  adminEmail?: string;
}): void {
  triggerTransactionalEmail('koban_receipt', params.recordId, params);
}

/**
 * 4A. Test started (optional — controlled by ENABLE_TEST_START_EMAIL & student preference)
 */
export function notifyTestStarted(params: {
  attemptId: string;
  studentName?: string;
  testName: string;
  universityPattern: string;
  subjectScope: string;
  totalQuestions: number;
  durationMinutes?: number;
}): void {
  triggerTransactionalEmail('test_started', params.attemptId, params);
}

/**
 * Helper to compute a compact per-subject breakdown table from graded questions.
 */
export function computeSubjectBreakdownFromQuestions(
  questions: Array<Partial<AttemptQuestion> & { selectedIndex?: number }>,
  userAnswers?: Record<string, number>
): SubjectBreakdownRow[] {
  const bySubject = new Map<
    string,
    { total: number; attempted: number; correct: number; wrong: number }
  >();

  questions.forEach((q, idx) => {
    const rawSub = String(q.subject || 'General').trim() || 'General';
    const subKey = rawSub.toLowerCase();
    if (!bySubject.has(subKey)) {
      bySubject.set(subKey, { total: 0, attempted: 0, correct: 0, wrong: 0 });
    }
    const stat = bySubject.get(subKey)!;
    stat.total += 1;

    const answered =
      userAnswers !== undefined
        ? userAnswers[String(idx)] !== undefined && userAnswers[String(idx)] !== null
        : typeof q.selectedIndex === 'number'
        ? q.selectedIndex >= 0
        : typeof q.isCorrect === 'boolean';

    if (answered) {
      stat.attempted += 1;
      if (q.isCorrect) {
        stat.correct += 1;
      } else {
        stat.wrong += 1;
      }
    }
  });

  return Array.from(bySubject.entries()).map(([sub, st]) => ({
    subject: sub.replace(/_/g, ' '),
    total: st.total,
    attempted: st.attempted,
    correct: st.correct,
    wrong: st.wrong,
    accuracyPercent: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0,
  }));
}

/**
 * 4B. Test submitted / completed (always sends result email to student)
 */
export function notifyTestCompleted(params: {
  attemptId: string;
  studentName?: string;
  testName: string;
  universityPattern: string;
  subjectScope: string;
  durationSeconds: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  score: number;
  maxMarks?: number;
  percentage: number;
  subjectBreakdown?: SubjectBreakdownRow[];
  reviewPath?: string;
}): void {
  triggerTransactionalEmail('test_completed', params.attemptId, params);
}

/**
 * 5A. Application submitted (Campus Captain, Crew, Ambassador, Reserved Name Request)
 */
export function notifyApplicationSubmitted(params: {
  applicationId: string;
  programName: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  institution?: string;
  city?: string;
  statement?: string;
  reviewPath?: string;
}): void {
  triggerTransactionalEmail('application_submitted', params.applicationId, params);
}

/**
 * 5B. Application approved or rejected by admin
 */
export function notifyApplicationDecision(params: {
  applicationId: string;
  studentUid: string;
  applicantName: string;
  studentEmail?: string;
  programName: string;
  decision: 'approved' | 'rejected';
  codeOrBadge?: string;
  reason?: string;
  ctaPath?: string;
}): void {
  triggerTransactionalEmail('application_decision', params.applicationId, params);
}

/**
 * 6A. Referral confirmed (notifies both referrer and friend)
 */
export function notifyReferralConfirmed(params: {
  referralId: string;
  referrerUid?: string;
  referrerName?: string;
  friendUid?: string;
  friendName?: string;
  referralCode?: string;
}): void {
  triggerTransactionalEmail('referral_confirmed', params.referralId, params);
}

/**
 * 6B. Referral Kobans credited (notifies both referrer and friend)
 */
export function notifyReferralRewardCredited(params: {
  referralId: string;
  referrerUid?: string;
  referrerName?: string;
  friendUid?: string;
  friendName?: string;
  referrerKobans?: number;
  referrerBalanceBefore?: number;
  referrerNewBalance?: number;
  friendKobans?: number;
  friendBalanceBefore?: number;
  friendNewBalance?: number;
  referralCode?: string;
  transactionId?: string;
}): void {
  triggerTransactionalEmail('referral_reward_credited', params.referralId, params);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL EMAIL LOGS, RETRY, SAMPLE TEST & DAILY DIGEST API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminEmailLogs(): Promise<{
  ok: boolean;
  config?: AdminEmailConfigInfo;
  logs: AdminEmailLogItem[];
  error?: string;
}> {
  try {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/send-email', {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      const serverLogs: AdminEmailLogItem[] = Array.isArray(data.logs)
        ? data.logs.map((l: any) => ({
            ...l,
            canRetry: l.status === 'failed',
          }))
        : [];

      // Merge any Firestore email_logs if server memory was freshly restarted
      if (serverLogs.length === 0) {
        try {
          const snap = await getDocs(
            query(collection(db, 'email_logs'), orderBy('createdAt', 'desc'), limit(50))
          );
          const fsLogs: AdminEmailLogItem[] = snap.docs.map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              idempotencyKey: raw.idempotencyKey || d.id,
              eventType: raw.eventType || 'admin_test_email',
              recipientRole: raw.recipientRole || 'student',
              recipientHash: raw.recipientHash || '',
              recipientMasked: raw.recipientMasked || '***',
              subject: raw.subject || 'Transactional Email',
              status: raw.status || 'sent',
              resendMessageId: raw.resendMessageId || null,
              error: raw.error || null,
              createdAt: raw.createdAt || new Date().toISOString(),
              canRetry: raw.status === 'failed',
            };
          });
          return { ok: true, config: data.config, logs: fsLogs };
        } catch {
          // Return empty serverLogs
        }
      }

      return {
        ok: true,
        config: data.config,
        logs: serverLogs,
      };
    }
    return {
      ok: false,
      logs: [],
      error: data?.error || `Failed to load email logs (${res.status})`,
    };
  } catch (err: any) {
    return {
      ok: false,
      logs: [],
      error: err?.message || 'Network error fetching email logs',
    };
  }
}

export async function retryFailedEmailLog(logId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'retry', logId }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true };
    }
    return {
      ok: false,
      error: data?.error || data?.results?.[0]?.error || 'Retry failed',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error retrying email',
    };
  }
}

export async function sendAdminSampleTestEmail(): Promise<{
  ok: boolean;
  messageId?: string | null;
  error?: string;
}> {
  try {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'test_email' }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true, messageId: data.messageId };
    }
    return {
      ok: false,
      error: data?.error || 'Could not send test email. Verify RESEND_API_KEY in server secrets.',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error sending test email',
    };
  }
}

export async function triggerDailyAdminDigestNow(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    // Gather today's quick summary from recent attempts in Firestore (non-blocking fallback if empty)
    let testsTakenCount = 0;
    const topScorers: Array<{
      studentName: string;
      testName: string;
      percentage: number;
      scoreText: string;
    }> = [];

    try {
      const attSnap = await getDocs(query(collection(db, 'attempts'), limit(50)));
      const completed = attSnap.docs
        .map((d) => d.data())
        .filter((a) => a.status === 'completed');
      testsTakenCount = completed.length;
      completed
        .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
        .slice(0, 5)
        .forEach((a) => {
          topScorers.push({
            studentName: a.userName || a.studentName || 'Student',
            testName: a.title || a.subject || 'Practice Test',
            percentage: Number(a.percentage || 0),
            scoreText: `${a.score ?? 0}/${a.totalQuestions ?? 10}`,
          });
        });
    } catch {
      // Ignore
    }

    const pktDateLabel = new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headers = await getBearerHeaders();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventType: 'daily_admin_digest',
        recordId: `${pktDateLabel}_${Date.now()}`,
        data: {
          pktDateLabel,
          testsTakenCount,
          topScorers,
          totalKobansEarned: 0,
          totalKobansSpent: 0,
        },
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true };
    }
    return {
      ok: false,
      error: data?.error || data?.results?.[0]?.error || 'Could not dispatch daily digest.',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error dispatching daily digest',
    };
  }
}
