import {
  verifyFirebaseIdToken,
  DEFAULT_SUPERADMIN_UIDS,
  DEFAULT_SUPERADMIN_EMAILS,
  parseServiceAccountFromEnv,
  getServiceAccountAccessToken,
  resolveTargetFirestoreProjectId,
  resolveTargetFirestoreDatabaseId,
  fromFirestoreDocument,
  toFirestoreValue,
  type RewardsEnv,
} from '../_utils/firestoreRestAdmin';
import {
  buildKobanPurchaseRequestStudentEmail,
  buildKobanPurchaseRequestAdminEmail,
  buildKobanPurchaseApprovedStudentEmail,
  buildKobanPurchaseRejectedStudentEmail,
  buildKobanPurchaseDecisionAdminCopyEmail,
  buildKobanReceiptStudentEmail,
  buildKobanActivityAdminAlertEmail,
  buildTestStartedStudentEmail,
  buildTestCompletedStudentEmail,
  buildDailyAdminDigestEmail,
  buildApplicationSubmittedApplicantEmail,
  buildApplicationSubmittedAdminEmail,
  buildApplicationDecisionApplicantEmail,
  buildReferralEventEmail,
  buildProRequestReceivedStudentEmail,
  buildProRequestReceivedAdminEmail,
  buildProActivatedStudentEmail,
  buildProActivatedAdminEmail,
  buildProRequestRejectedStudentEmail,
  buildAdminSampleTestEmail,
  verifyEmailBalanceSanity,
  type TransactionalEmailEventType,
  type KobanReceiptSubType,
  type SubjectBreakdownRow,
  type RenderedEmailTemplate,
} from '../../src/lib/emailTemplates';

export interface SendEmailEnv extends RewardsEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAILS?: string;
  APP_URL?: string;
  KOBAN_ALERT_THRESHOLD?: string;
  ENABLE_TEST_START_EMAIL?: string;
  INTERNAL_EMAIL_SECRET?: string;
  DB?: any; // Optional Cloudflare D1 binding
}

function getTargetFirebaseProjectId(env: SendEmailEnv): string {
  return resolveTargetFirestoreProjectId(env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID);
}

function getTargetFirestoreDatabaseId(env: SendEmailEnv): string {
  return resolveTargetFirestoreDatabaseId(
    env.FIREBASE_DATABASE_ID || env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.VITE_FIREBASE_DATABASE_ID
  );
}

async function getFirestoreAdminAccessToken(env: SendEmailEnv): Promise<string | null> {
  const sa = parseServiceAccountFromEnv(env);
  if (!sa) return null;
  try {
    return await getServiceAccountAccessToken(sa);
  } catch {
    return null;
  }
}

function fromFirestoreFields(fields?: Record<string, any>): Record<string, any> {
  return fromFirestoreDocument(fields ? { fields } : null) || {};
}

function isSuperAdminIdentity(uid?: string | null, email?: string | null, env?: SendEmailEnv): boolean {
  const cleanUid = String(uid || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const superUids = new Set(
    (env?.SUPERADMIN_UIDS || [...DEFAULT_SUPERADMIN_UIDS, 'jJfb1nThG1X9phL8fFDZ0G0J7m33'].join(','))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const superEmails = new Set(
    (env?.SUPERADMIN_EMAILS || [...DEFAULT_SUPERADMIN_EMAILS, 'shs.academy.virtual@gmail.com'].join(','))
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return (cleanUid.length > 0 && superUids.has(cleanUid)) || (cleanEmail.length > 0 && superEmails.has(cleanEmail));
}

export interface EmailLogEntry {
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
  retryPayload?: {
    eventType: TransactionalEmailEventType;
    recordId: string;
    recipientEmail: string;
    recipientRole: 'student' | 'admin' | 'referrer' | 'friend';
    data: Record<string, any>;
  };
}

const VALID_EVENT_TYPES = new Set<TransactionalEmailEventType>([
  'koban_purchase_request',
  'koban_purchase_approved',
  'koban_purchase_rejected',
  'koban_receipt',
  'test_started',
  'test_completed',
  'daily_admin_digest',
  'application_submitted',
  'application_decision',
  'referral_confirmed',
  'referral_reward_credited',
  'pro_request_received',
  'pro_activated',
  'pro_request_rejected',
  'admin_test_email',
]);

// In-memory rate limiting, idempotency deduplication, and recent logs cache
const rateLimitBuckets = new Map<string, { count: number; resetAtMs: number }>();
const sentIdempotencyKeys = new Map<string, { status: 'sent' | 'failed'; messageId: string | null; atMs: number }>();
const memoryEmailLogs: EmailLogEntry[] = [];
const MAX_MEMORY_LOGS = 250;

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_PER_USER = 25;

function checkRateLimit(actorKey: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(actorKey);
  if (!bucket || now >= bucket.resetAtMs) {
    rateLimitBuckets.set(actorKey, { count: 1, resetAtMs: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX_PER_USER) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function maskEmailAddress(email: string): string {
  const clean = String(email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '***';
  const local = clean.slice(0, atIdx);
  const domain = clean.slice(atIdx + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function hashRecipientEmail(email: string): Promise<string> {
  const clean = String(email || '').trim().toLowerCase();
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
      return Array.from(new Uint8Array(buf))
        .slice(0, 8)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below
  }
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function parseAdminEmails(env: SendEmailEnv): string[] {
  const raw =
    env.ADMIN_EMAILS ||
    'admin@boardly.cfd,superadmin@boardly.cfd,shsvirtualadmin@gmail.com';
  const emails = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return Array.from(new Set(emails.length > 0 ? emails : ['admin@boardly.cfd']));
}

async function ensureD1EmailLogsTable(db: any): Promise<void> {
  if (!db || typeof db.prepare !== 'function') return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS email_logs (
          id TEXT PRIMARY KEY,
          idempotency_key TEXT UNIQUE,
          event_type TEXT NOT NULL,
          recipient_role TEXT NOT NULL,
          recipient_hash TEXT NOT NULL,
          recipient_masked TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL,
          resend_message_id TEXT,
          error TEXT,
          retry_payload_json TEXT,
          created_at TEXT NOT NULL
        )`
      )
      .run();
  } catch {
    // Non-fatal
  }
}

async function recordEmailLog(env: SendEmailEnv, entry: EmailLogEntry): Promise<void> {
  // 1. Update in-memory list (replace existing if retry of same idempotencyKey)
  const existingIdx = memoryEmailLogs.findIndex(
    (l) => l.id === entry.id || l.idempotencyKey === entry.idempotencyKey
  );
  if (existingIdx >= 0) {
    memoryEmailLogs[existingIdx] = entry;
  } else {
    memoryEmailLogs.unshift(entry);
    if (memoryEmailLogs.length > MAX_MEMORY_LOGS) {
      memoryEmailLogs.pop();
    }
  }

  // 2. Persist to Cloudflare D1 if available
  if (env.DB && typeof env.DB.prepare === 'function') {
    try {
      await ensureD1EmailLogsTable(env.DB);
      await env.DB.prepare(
        `INSERT INTO email_logs (
          id, idempotency_key, event_type, recipient_role, recipient_hash,
          recipient_masked, subject, status, resend_message_id, error, retry_payload_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(idempotency_key) DO UPDATE SET
          status = excluded.status,
          resend_message_id = excluded.resend_message_id,
          error = excluded.error,
          created_at = excluded.created_at`
      )
        .bind(
          entry.id,
          entry.idempotencyKey,
          entry.eventType,
          entry.recipientRole,
          entry.recipientHash,
          entry.recipientMasked,
          entry.subject,
          entry.status,
          entry.resendMessageId,
          entry.error,
          entry.retryPayload ? JSON.stringify(entry.retryPayload) : null,
          entry.createdAt
        )
        .run();
    } catch (d1Err) {
      console.warn('[send-email] D1 log write notice:', d1Err);
    }
  }

  // 3. Best-effort write to Firestore `email_logs/{id}` if service account is configured (never store raw HTML body)
  try {
    const token = await getFirestoreAdminAccessToken(env);
    if (token) {
      const projectId = getTargetFirebaseProjectId(env);
      const databaseId = getTargetFirestoreDatabaseId(env);
      const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        projectId
      )}/databases/${encodeURIComponent(databaseId)}/documents/email_logs/${encodeURIComponent(
        entry.id
      )}`;
      const firestoreFields: Record<string, any> = {
        id: toFirestoreValue(entry.id),
        idempotencyKey: toFirestoreValue(entry.idempotencyKey),
        eventType: toFirestoreValue(entry.eventType),
        recipientRole: toFirestoreValue(entry.recipientRole),
        recipientHash: toFirestoreValue(entry.recipientHash),
        recipientMasked: toFirestoreValue(entry.recipientMasked),
        subject: toFirestoreValue(entry.subject),
        status: toFirestoreValue(entry.status),
        resendMessageId: toFirestoreValue(entry.resendMessageId),
        error: toFirestoreValue(entry.error),
        createdAt: toFirestoreValue(entry.createdAt),
      };
      await fetch(docUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: firestoreFields }),
      });
    }
  } catch {
    // Non-blocking
  }
}

async function fetchServerUserInfo(
  env: SendEmailEnv,
  uid: string
): Promise<{
  email: string | null;
  displayName: string | null;
  emailPreferences?: {
    testStarted?: boolean;
    smallKobanReceipts?: boolean;
  };
} | null> {
  if (!uid) return null;
  try {
    const token = await getFirestoreAdminAccessToken(env);
    if (!token) return null;
    const projectId = getTargetFirebaseProjectId(env);
    const databaseId = getTargetFirestoreDatabaseId(env);
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/users/${encodeURIComponent(
      uid
    )}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = fromFirestoreFields(json.fields);
    return {
      email: typeof data.email === 'string' && data.email.includes('@') ? data.email.trim().toLowerCase() : null,
      displayName: data.displayName || data.name || data.nickname || null,
      emailPreferences: data.emailPreferences || undefined,
    };
  } catch {
    return null;
  }
}

async function fetchCommittedLedgerBalances(
  env: SendEmailEnv,
  uid: string,
  ledgerId: string
): Promise<{ balanceBefore?: number; amount?: number; balanceAfter?: number } | null> {
  if (!uid || !ledgerId) return null;
  try {
    const token = await getFirestoreAdminAccessToken(env);
    if (!token) return null;
    const projectId = getTargetFirebaseProjectId(env);
    const databaseId = getTargetFirestoreDatabaseId(env);
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/wallets/${encodeURIComponent(
      uid
    )}/ledger/${encodeURIComponent(ledgerId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = fromFirestoreFields(json.fields);
    const bBefore = data.balanceBefore ?? data.balance_before;
    const bAfter = data.balanceAfter ?? data.balance_after;
    return {
      balanceBefore: typeof bBefore === 'number' && Number.isFinite(bBefore) ? Math.floor(bBefore) : undefined,
      amount: typeof data.amount === 'number' && Number.isFinite(data.amount) ? Math.floor(data.amount) : undefined,
      balanceAfter: typeof bAfter === 'number' && Number.isFinite(bAfter) ? Math.floor(bAfter) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Dispatches a single email through `https://api.resend.com/emails` with 1 automatic retry
 * on transient HTTP 429 or 5xx errors.
 */
async function dispatchViaResendWithRetry(params: {
  env: SendEmailEnv;
  to: string | string[];
  template: RenderedEmailTemplate;
  idempotencyKey: string;
  eventType: TransactionalEmailEventType;
  recipientRole: 'student' | 'admin' | 'referrer' | 'friend';
  recordId: string;
  rawEventData: Record<string, any>;
  forceResend?: boolean;
}): Promise<{
  ok: boolean;
  status: 'sent' | 'failed' | 'skipped';
  messageId: string | null;
  error?: string;
  logEntry: EmailLogEntry;
}> {
  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => String(e || '').trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const primaryRecipient = recipients[0] || 'unknown@boardly.cfd';
  const recipientHash = await hashRecipientEmail(primaryRecipient);
  const recipientMasked =
    recipients.length > 1
      ? `${maskEmailAddress(primaryRecipient)} (+${recipients.length - 1})`
      : maskEmailAddress(primaryRecipient);

  const logId = `em_${params.idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 68)}`;

  // 1. Deduplication check unless forceResend is true
  const existingSent = sentIdempotencyKeys.get(params.idempotencyKey);
  if (!params.forceResend && existingSent && existingSent.status === 'sent') {
    const skippedEntry: EmailLogEntry = {
      id: logId,
      idempotencyKey: params.idempotencyKey,
      eventType: params.eventType,
      recipientRole: params.recipientRole,
      recipientHash,
      recipientMasked,
      subject: params.template.subject,
      status: 'sent',
      resendMessageId: existingSent.messageId,
      error: null,
      createdAt: new Date(existingSent.atMs).toISOString(),
    };
    return {
      ok: true,
      status: 'sent',
      messageId: existingSent.messageId,
      logEntry: skippedEntry,
    };
  }

  if (recipients.length === 0) {
    const failedNoRecip: EmailLogEntry = {
      id: logId,
      idempotencyKey: params.idempotencyKey,
      eventType: params.eventType,
      recipientRole: params.recipientRole,
      recipientHash,
      recipientMasked: 'none',
      subject: params.template.subject,
      status: 'failed',
      resendMessageId: null,
      error: 'No valid verified recipient email address found.',
      createdAt: new Date().toISOString(),
    };
    await recordEmailLog(params.env, failedNoRecip);
    return {
      ok: false,
      status: 'failed',
      messageId: null,
      error: failedNoRecip.error!,
      logEntry: failedNoRecip,
    };
  }

  const resendApiKey = (params.env.RESEND_API_KEY || '').trim();
  const emailFrom = (params.env.EMAIL_FROM || 'Boardly <no-reply@boardly.cfd>').trim();

  if (!resendApiKey) {
    const errMsg = 'RESEND_API_KEY is not configured in server environment secrets.';
    const failedEntry: EmailLogEntry = {
      id: logId,
      idempotencyKey: params.idempotencyKey,
      eventType: params.eventType,
      recipientRole: params.recipientRole,
      recipientHash,
      recipientMasked,
      subject: params.template.subject,
      status: 'failed',
      resendMessageId: null,
      error: errMsg,
      createdAt: new Date().toISOString(),
      retryPayload: {
        eventType: params.eventType,
        recordId: params.recordId,
        recipientEmail: recipients.join(','),
        recipientRole: params.recipientRole,
        data: params.rawEventData,
      },
    };
    sentIdempotencyKeys.set(params.idempotencyKey, {
      status: 'failed',
      messageId: null,
      atMs: Date.now(),
    });
    await recordEmailLog(params.env, failedEntry);
    return {
      ok: false,
      status: 'failed',
      messageId: null,
      error: errMsg,
      logEntry: failedEntry,
    };
  }

  let lastError = 'Resend API request failed';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 600));
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': params.forceResend
            ? `${params.idempotencyKey}_retry_${Date.now()}`
            : params.idempotencyKey.slice(0, 250),
        },
        body: JSON.stringify({
          from: emailFrom,
          to: recipients,
          subject: params.template.subject,
          html: params.template.html,
          text: params.template.text,
          reply_to: 'admin@boardly.cfd',
        }),
      });

      const resJson = (await res.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };

      if (res.ok && resJson.id) {
        const sentEntry: EmailLogEntry = {
          id: logId,
          idempotencyKey: params.idempotencyKey,
          eventType: params.eventType,
          recipientRole: params.recipientRole,
          recipientHash,
          recipientMasked,
          subject: params.template.subject,
          status: 'sent',
          resendMessageId: resJson.id,
          error: null,
          createdAt: new Date().toISOString(),
        };
        sentIdempotencyKeys.set(params.idempotencyKey, {
          status: 'sent',
          messageId: resJson.id,
          atMs: Date.now(),
        });
        await recordEmailLog(params.env, sentEntry);
        return {
          ok: true,
          status: 'sent',
          messageId: resJson.id,
          logEntry: sentEntry,
        };
      }

      lastError = resJson.message || `Resend HTTP ${res.status}`;
      // Retry only on transient 429 or 5xx errors
      if (res.status !== 429 && res.status < 500) {
        break;
      }
    } catch (netErr: any) {
      lastError = netErr?.message || 'Transient network error contacting Resend API';
    }
  }

  const failedEntry: EmailLogEntry = {
    id: logId,
    idempotencyKey: params.idempotencyKey,
    eventType: params.eventType,
    recipientRole: params.recipientRole,
    recipientHash,
    recipientMasked,
    subject: params.template.subject,
    status: 'failed',
    resendMessageId: null,
    error: lastError,
    createdAt: new Date().toISOString(),
    retryPayload: {
      eventType: params.eventType,
      recordId: params.recordId,
      recipientEmail: recipients.join(','),
      recipientRole: params.recipientRole,
      data: params.rawEventData,
    },
  };
  sentIdempotencyKeys.set(params.idempotencyKey, {
    status: 'failed',
    messageId: null,
    atMs: Date.now(),
  });
  await recordEmailLog(params.env, failedEntry);

  return {
    ok: false,
    status: 'failed',
    messageId: null,
    error: lastError,
    logEntry: failedEntry,
  };
}

/**
 * Core handler for `/api/send-email` (supports GET for Admin Logs and POST for Event Dispatch / Retry / Test).
 */
export async function handleSendEmailRequest(
  request: Request,
  env: SendEmailEnv
): Promise<Response> {
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  // 1. Authenticate caller via Firebase ID Token OR Internal Secret Header
  const authHeader = request.headers.get('Authorization');
  const internalSecretHeader = request.headers.get('X-Internal-Email-Secret');
  const configuredInternalSecret = (env.INTERNAL_EMAIL_SECRET || '').trim();
  const isInternalCall = Boolean(
    configuredInternalSecret &&
      internalSecretHeader &&
      internalSecretHeader.trim() === configuredInternalSecret
  );

  const projectId = getTargetFirebaseProjectId(env);
  const verifiedUser = authHeader ? await verifyFirebaseIdToken(authHeader, projectId) : null;

  if (!verifiedUser && !isInternalCall) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Unauthorized: Valid signed-in user session or internal secret required.',
      }),
      { status: 401, headers: jsonHeaders }
    );
  }

  const callerIsAdmin =
    isInternalCall ||
    (verifiedUser ? isSuperAdminIdentity(verifiedUser.uid, verifiedUser.email) : false);

  const appUrl = (env.APP_URL || 'https://boardly.cfd').replace(/\/+$/, '');
  const adminEmails = parseAdminEmails(env);
  const kobanAlertThreshold = Math.max(100, Number(env.KOBAN_ALERT_THRESHOLD || 1000));
  const enableTestStartEmail =
    String(env.ENABLE_TEST_START_EMAIL || 'false').toLowerCase() === 'true';

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/send-email — Admin Email Logs & Config Health
  // ───────────────────────────────────────────────────────────────────────────
  if (request.method === 'GET') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required to view email logs.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    let logs: EmailLogEntry[] = [...memoryEmailLogs];
    if (env.DB && typeof env.DB.prepare === 'function') {
      try {
        await ensureD1EmailLogsTable(env.DB);
        const d1Res = await env.DB.prepare(
          `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 100`
        ).all();
        if (Array.isArray(d1Res?.results) && d1Res.results.length > 0) {
          logs = d1Res.results.map((r: any) => ({
            id: r.id,
            idempotencyKey: r.idempotency_key,
            eventType: r.event_type,
            recipientRole: r.recipient_role,
            recipientHash: r.recipient_hash,
            recipientMasked: r.recipient_masked,
            subject: r.subject,
            status: r.status,
            resendMessageId: r.resend_message_id || null,
            error: r.error || null,
            createdAt: r.created_at,
            retryPayload: r.retry_payload_json ? JSON.parse(r.retry_payload_json) : undefined,
          }));
        }
      } catch {
        // Fallback to memoryEmailLogs
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        config: {
          hasResendKey: Boolean((env.RESEND_API_KEY || '').trim()),
          emailFrom: env.EMAIL_FROM || 'Boardly <no-reply@boardly.cfd>',
          adminEmails,
          appUrl,
          kobanAlertThreshold,
          enableTestStartEmail,
        },
        logs,
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: jsonHeaders }
    );
  }

  // 2. Per-user rate limit
  const actorKey = verifiedUser?.uid || 'internal';
  const rateCheck = checkRateLimit(actorKey);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before sending more notifications.`,
      }),
      { status: 429, headers: jsonHeaders }
    );
  }

  let body: Record<string, any>;
  try {
    body = (await request.json()) as Record<string, any>;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid JSON request body.' }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADMIN ACTION: RETRY FAILED EMAIL LOG
  // ───────────────────────────────────────────────────────────────────────────
  if (body.action === 'retry' && typeof body.logId === 'string') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required to retry failed emails.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    let targetLog = memoryEmailLogs.find((l) => l.id === body.logId);
    if (!targetLog && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const row = await env.DB.prepare(`SELECT * FROM email_logs WHERE id = ?`)
          .bind(body.logId)
          .first();
        if (row && row.retry_payload_json) {
          targetLog = {
            id: row.id,
            idempotencyKey: row.idempotency_key,
            eventType: row.event_type,
            recipientRole: row.recipient_role,
            recipientHash: row.recipient_hash,
            recipientMasked: row.recipient_masked,
            subject: row.subject,
            status: row.status,
            resendMessageId: row.resend_message_id,
            error: row.error,
            createdAt: row.created_at,
            retryPayload: JSON.parse(row.retry_payload_json),
          };
        }
      } catch {
        // Ignore
      }
    }

    if (!targetLog || !targetLog.retryPayload) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Log entry or retry metadata not found.' }),
        { status: 404, headers: jsonHeaders }
      );
    }

    // Re-invoke with forceResend = true
    body = {
      eventType: targetLog.retryPayload.eventType,
      recordId: targetLog.retryPayload.recordId,
      data: targetLog.retryPayload.data,
      forceResend: true,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADMIN ACTION: SEND SAMPLE TEST EMAIL
  // ───────────────────────────────────────────────────────────────────────────
  if (body.action === 'test_email' || body.eventType === 'admin_test_email') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required to send test email.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const adminTarget = verifiedUser?.email || adminEmails[0];
    const recordId = `test_${Date.now()}`;
    const tpl = buildAdminSampleTestEmail({
      adminEmail: adminTarget,
      emailFrom: env.EMAIL_FROM || 'Boardly <no-reply@boardly.cfd>',
      adminRecipientsList: adminEmails,
      appUrl,
    });

    const res = await dispatchViaResendWithRetry({
      env,
      to: [adminTarget, ...adminEmails],
      template: tpl,
      idempotencyKey: `admin_test_email:${recordId}:admin`,
      eventType: 'admin_test_email',
      recipientRole: 'admin',
      recordId,
      rawEventData: { adminEmail: adminTarget },
      forceResend: true,
    });

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        messageId: res.messageId,
        error: res.error,
        log: res.logEntry,
      }),
      { status: res.ok ? 200 : 502, headers: jsonHeaders }
    );
  }

  // 3. Validate Event Type
  const eventType = String(body.eventType || '') as TransactionalEmailEventType;
  if (!VALID_EVENT_TYPES.has(eventType)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Invalid eventType "${eventType}".`,
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const recordId = String(body.recordId || `${Date.now()}`).trim();
  const data = (body.data && typeof body.data === 'object' ? body.data : {}) as Record<string, any>;
  const forceResend = Boolean(body.forceResend && callerIsAdmin);

  // Resolve student's verified email strictly from their token (or server lookup when admin acts on a student)
  const targetStudentUid = callerIsAdmin
    ? String(data.studentUid || data.userId || verifiedUser?.uid || '')
    : String(verifiedUser?.uid || '');

  const serverStudentProfile = targetStudentUid
    ? await fetchServerUserInfo(env, targetStudentUid)
    : null;

  const verifiedStudentEmail = callerIsAdmin
    ? serverStudentProfile?.email ||
      (typeof data.studentEmail === 'string' && data.studentEmail.includes('@')
        ? data.studentEmail.trim().toLowerCase()
        : verifiedUser?.email || null)
    : verifiedUser?.email || serverStudentProfile?.email || null;

  const studentDisplayName =
    data.studentName ||
    serverStudentProfile?.displayName ||
    (verifiedStudentEmail ? verifiedStudentEmail.split('@')[0] : 'Student');

  // Check student's optional email preferences (stored on users/{uid}.emailPreferences or passed from client profile)
  const emailPrefs = {
    testStarted:
      typeof data.emailPreferences?.testStarted === 'boolean'
        ? data.emailPreferences.testStarted
        : Boolean(serverStudentProfile?.emailPreferences?.testStarted),
    smallKobanReceipts:
      typeof data.emailPreferences?.smallKobanReceipts === 'boolean'
        ? data.emailPreferences.smallKobanReceipts
        : serverStudentProfile?.emailPreferences?.smallKobanReceipts !== false,
  };

  const results: Array<{
    role: string;
    ok: boolean;
    status: string;
    messageId: string | null;
    error?: string;
  }> = [];

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 1: KOBAN PURCHASE REQUEST SUBMITTED
  // ───────────────────────────────────────────────────────────────────────────
  if (eventType === 'koban_purchase_request') {
    const kobansAmount = Math.max(0, Number(data.kobansAmount || data.amount || 0));
    const pkrAmount = Math.max(0, Number(data.pkrAmount || Math.floor(kobansAmount / 10)));
    const paymentMethod = String(data.paymentMethod || data.method || 'mobile_banking');
    const transactionId = String(data.transactionId || '');
    const packageName = data.packageName ? String(data.packageName) : undefined;

    // 1A. To Student (always uses masked payment reference)
    if (verifiedStudentEmail) {
      const studentTpl = buildKobanPurchaseRequestStudentEmail({
        studentName: studentDisplayName,
        kobansAmount,
        pkrAmount,
        paymentMethod,
        transactionId,
        packageName,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: studentTpl,
        idempotencyKey: `koban_purchase_request:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }

    // 1B. To Admins (includes full transaction ID & Review link)
    const adminTpl = buildKobanPurchaseRequestAdminEmail({
      requestId: recordId,
      studentName: studentDisplayName,
      studentEmail: verifiedStudentEmail || 'Not linked',
      studentUid: targetStudentUid,
      kobansAmount,
      pkrAmount,
      paymentMethod,
      transactionId,
      packageName,
      note: data.note ? String(data.note) : undefined,
      appUrl,
    });
    const rAdmin = await dispatchViaResendWithRetry({
      env,
      to: adminEmails,
      template: adminTpl,
      idempotencyKey: `koban_purchase_request:${recordId}:admin`,
      eventType,
      recipientRole: 'admin',
      recordId,
      rawEventData: data,
      forceResend,
    });
    results.push({ role: 'admin', ...rAdmin });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 2: KOBAN PURCHASE APPROVED OR REJECTED BY ADMIN
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'koban_purchase_approved' || eventType === 'koban_purchase_rejected') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Only admins can trigger purchase approval/rejection emails.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const isApproved = eventType === 'koban_purchase_approved';
    const kobansAmount = Math.max(0, Math.floor(Number(data.kobansAmount ?? data.delta ?? data.amount ?? 0)));
    const transactionId = data.transactionId ? String(data.transactionId) : undefined;
    const ledgerId = data.ledgerId ? String(data.ledgerId) : `koban_req_${recordId}`;
    const reason = data.reason ? String(data.reason) : 'Transaction could not be verified.';
    const adminActorEmail = verifiedUser?.email || String(data.adminEmail || 'admin@boardly.cfd');

    let rawBalanceBefore = data.balanceBefore ?? data.balance_before;
    let rawBalanceAfter = data.newBalance ?? data.balanceAfter ?? data.balance_after;

    if (isApproved && (rawBalanceBefore === undefined || rawBalanceAfter === undefined)) {
      const committedLedger = await fetchCommittedLedgerBalances(env, targetStudentUid, ledgerId);
      if (committedLedger) {
        if (rawBalanceBefore === undefined && committedLedger.balanceBefore !== undefined) {
          rawBalanceBefore = committedLedger.balanceBefore;
        }
        if (rawBalanceAfter === undefined && committedLedger.balanceAfter !== undefined) {
          rawBalanceAfter = committedLedger.balanceAfter;
        }
      }
    }

    if (isApproved) {
      const sanity = verifyEmailBalanceSanity({
        balanceBefore: rawBalanceBefore,
        delta: kobansAmount,
        balanceAfter: rawBalanceAfter,
        context: `koban_purchase_approved:${recordId}`,
      });

      if (!sanity.valid) {
        return new Response(
          JSON.stringify({
            ok: false,
            status: 'skipped',
            eventType,
            recordId,
            error: sanity.error,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 2A. To Student (Approved)
      if (verifiedStudentEmail) {
        const studentTpl = buildKobanPurchaseApprovedStudentEmail({
          studentName: studentDisplayName,
          kobansCredited: sanity.delta,
          balanceBefore: sanity.balanceBefore,
          newBalance: sanity.balanceAfter,
          transactionId,
          appUrl,
        });

        const rStudent = await dispatchViaResendWithRetry({
          env,
          to: verifiedStudentEmail,
          template: studentTpl,
          idempotencyKey: `${eventType}:${recordId}:student`,
          eventType,
          recipientRole: 'student',
          recordId,
          rawEventData: data,
          forceResend,
        });
        results.push({ role: 'student', ...rStudent });
      }

      // 2B. To Admins (Approved copy summary)
      const adminCopyTpl = buildKobanPurchaseDecisionAdminCopyEmail({
        decision: 'approved',
        adminEmail: adminActorEmail,
        studentUid: targetStudentUid,
        studentName: studentDisplayName,
        studentEmail: verifiedStudentEmail || undefined,
        kobansAmount: sanity.delta,
        balanceBefore: sanity.balanceBefore,
        newBalance: sanity.balanceAfter,
        transactionId,
        ledgerId,
        appUrl,
      });
      const rAdmin = await dispatchViaResendWithRetry({
        env,
        to: adminEmails,
        template: adminCopyTpl,
        idempotencyKey: `${eventType}:${recordId}:admin`,
        eventType,
        recipientRole: 'admin',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'admin', ...rAdmin });
    } else {
      // Rejected flow (no balance change)
      if (verifiedStudentEmail) {
        const studentTpl = buildKobanPurchaseRejectedStudentEmail({
          studentName: studentDisplayName,
          requestedKobans: kobansAmount,
          reason,
          transactionId,
          appUrl,
        });

        const rStudent = await dispatchViaResendWithRetry({
          env,
          to: verifiedStudentEmail,
          template: studentTpl,
          idempotencyKey: `${eventType}:${recordId}:student`,
          eventType,
          recipientRole: 'student',
          recordId,
          rawEventData: data,
          forceResend,
        });
        results.push({ role: 'student', ...rStudent });
      }

      const adminCopyTpl = buildKobanPurchaseDecisionAdminCopyEmail({
        decision: 'rejected',
        adminEmail: adminActorEmail,
        studentUid: targetStudentUid,
        studentName: studentDisplayName,
        studentEmail: verifiedStudentEmail || undefined,
        kobansAmount,
        transactionId,
        ledgerId: recordId,
        reason,
        appUrl,
      });
      const rAdmin = await dispatchViaResendWithRetry({
        env,
        to: adminEmails,
        template: adminCopyTpl,
        idempotencyKey: `${eventType}:${recordId}:admin`,
        eventType,
        recipientRole: 'admin',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'admin', ...rAdmin });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 3: KOBANS RECEIVED OR SPENT FOR ANY REASON
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'koban_receipt') {
    const deltaAmount = Math.floor(Number(data.deltaAmount ?? data.delta ?? data.amount ?? 0));
    const subType = (data.subType || 'daily_claim') as KobanReceiptSubType;
    const reason = String(data.reason || 'Wallet activity');
    const txId = String(data.transactionId || data.ledgerId || recordId);
    const isSmallClaim =
      subType === 'daily_claim' || subType === 'daily_checkin' || subType === 'milestone_claim';
    const items = Array.isArray(data.items)
      ? data.items.map((it: any) => ({
          id: it?.id ? String(it.id) : undefined,
          name: String(it?.name || 'Cosmetic Item'),
          category: it?.category ? String(it.category) : undefined,
          priceKobans: Math.max(0, Math.floor(Number(it?.priceKobans) || 0)),
        }))
      : undefined;

    let rawBalanceBefore = data.balanceBefore ?? data.balance_before;
    let rawBalanceAfter = data.newBalance ?? data.balanceAfter ?? data.balance_after;

    if (rawBalanceBefore === undefined || rawBalanceAfter === undefined) {
      const committedLedger = await fetchCommittedLedgerBalances(env, targetStudentUid, txId);
      if (committedLedger) {
        if (rawBalanceBefore === undefined && committedLedger.balanceBefore !== undefined) {
          rawBalanceBefore = committedLedger.balanceBefore;
        }
        if (rawBalanceAfter === undefined && committedLedger.balanceAfter !== undefined) {
          rawBalanceAfter = committedLedger.balanceAfter;
        }
      }
    }

    const sanity = verifyEmailBalanceSanity({
      balanceBefore: rawBalanceBefore,
      delta: deltaAmount,
      balanceAfter: rawBalanceAfter,
      context: `koban_receipt:${subType}:${recordId}`,
    });

    if (!sanity.valid) {
      return new Response(
        JSON.stringify({
          ok: false,
          status: 'skipped',
          eventType,
          recordId,
          error: sanity.error,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 3A. To Student (respects smallKobanReceipts preference for daily/milestone claims)
    if (verifiedStudentEmail && (!isSmallClaim || emailPrefs.smallKobanReceipts)) {
      const studentTpl = buildKobanReceiptStudentEmail({
        studentName: studentDisplayName,
        deltaAmount: sanity.delta,
        balanceBefore: sanity.balanceBefore,
        newBalance: sanity.balanceAfter,
        reason,
        subType,
        itemName: data.itemName ? String(data.itemName) : undefined,
        items,
        transactionId: txId,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: studentTpl,
        idempotencyKey: `koban_receipt:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }

    // 3B. To Admins ONLY for store_purchase, admin_grant, captain_allotment, or |delta| >= KOBAN_ALERT_THRESHOLD
    // NEVER email admins for daily check-in claims
    const shouldAlertAdmin =
      subType !== 'daily_claim' &&
      subType !== 'daily_checkin' &&
      (subType === 'store_purchase' ||
        subType === 'admin_grant' ||
        subType === 'captain_allotment' ||
        Math.abs(sanity.delta) >= kobanAlertThreshold);

    if (shouldAlertAdmin) {
      const adminAlertTpl = buildKobanActivityAdminAlertEmail({
        studentName: studentDisplayName,
        studentEmail: verifiedStudentEmail || undefined,
        studentUid: targetStudentUid,
        deltaAmount: sanity.delta,
        balanceBefore: sanity.balanceBefore,
        newBalance: sanity.balanceAfter,
        reason,
        subType,
        itemName: data.itemName ? String(data.itemName) : undefined,
        items,
        transactionId: txId,
        adminEmail: data.adminEmail ? String(data.adminEmail) : undefined,
        appUrl,
      });
      const rAdmin = await dispatchViaResendWithRetry({
        env,
        to: adminEmails,
        template: adminAlertTpl,
        idempotencyKey: `koban_receipt:${recordId}:admin`,
        eventType,
        recipientRole: 'admin',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'admin', ...rAdmin });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 4A: TEST STARTED (Optional — behind ENABLE_TEST_START_EMAIL flag)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'test_started') {
    if (!enableTestStartEmail || !emailPrefs.testStarted) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'skipped',
          reason: 'Test start email is disabled via ENABLE_TEST_START_EMAIL or user preference.',
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (verifiedStudentEmail) {
      const tpl = buildTestStartedStudentEmail({
        studentName: studentDisplayName,
        attemptId: recordId,
        testName: String(data.testName || 'Boardly Practice Test'),
        universityPattern: String(data.universityPattern || 'Standard Drill'),
        subjectScope: String(data.subjectScope || 'General'),
        totalQuestions: Math.max(1, Number(data.totalQuestions || 10)),
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: tpl,
        idempotencyKey: `test_started:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 4B: TEST COMPLETED RESULT (Always sent to student; never spams admin per test)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'test_completed') {
    if (verifiedStudentEmail) {
      const breakdown = Array.isArray(data.subjectBreakdown)
        ? (data.subjectBreakdown as SubjectBreakdownRow[])
        : undefined;

      const tpl = buildTestCompletedStudentEmail({
        studentName: studentDisplayName,
        attemptId: recordId,
        testName: String(data.testName || 'Boardly Practice Test'),
        universityPattern: String(data.universityPattern || 'Standard Drill'),
        subjectScope: String(data.subjectScope || 'All Subjects'),
        durationSeconds: Math.max(1, Number(data.durationSeconds || 60)),
        totalQuestions: Math.max(1, Number(data.totalQuestions || 10)),
        attempted: Math.max(0, Number(data.attempted ?? 0)),
        correct: Math.max(0, Number(data.correct ?? 0)),
        wrong: Math.max(0, Number(data.wrong ?? 0)),
        score: Number(data.score ?? 0),
        maxMarks: data.maxMarks ? Number(data.maxMarks) : undefined,
        percentage: Math.max(0, Math.min(100, Number(data.percentage ?? 0))),
        subjectBreakdown: breakdown,
        reviewPath: data.reviewPath ? String(data.reviewPath) : undefined,
        appUrl,
      });

      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: tpl,
        idempotencyKey: `test_completed:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 4C: DAILY ADMIN DIGEST (00:00 PKT Summary)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'daily_admin_digest') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Only admins or scheduled workers can trigger the daily digest.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const pktDateLabel =
      String(data.pktDateLabel || '') ||
      new Date().toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium' });

    const tpl = buildDailyAdminDigestEmail({
      pktDateLabel,
      testsTakenCount: Number(data.testsTakenCount || 0),
      topScorers: Array.isArray(data.topScorers) ? data.topScorers : [],
      totalKobansEarned: Number(data.totalKobansEarned || 0),
      totalKobansSpent: Number(data.totalKobansSpent || 0),
      appUrl,
    });

    const rAdmin = await dispatchViaResendWithRetry({
      env,
      to: adminEmails,
      template: tpl,
      idempotencyKey: `daily_admin_digest:${pktDateLabel}:admin`,
      eventType,
      recipientRole: 'admin',
      recordId: pktDateLabel,
      rawEventData: data,
      forceResend,
    });
    results.push({ role: 'admin', ...rAdmin });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 5A: APPLICATION SUBMITTED (Applicant confirmation + Admin alert)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'application_submitted') {
    const programName = String(data.programName || 'Nakama Campus Captain');
    const applicantName = String(data.applicantName || studentDisplayName);

    if (verifiedStudentEmail) {
      const applicantTpl = buildApplicationSubmittedApplicantEmail({
        applicantName,
        programName,
        institution: data.institution ? String(data.institution) : undefined,
        city: data.city ? String(data.city) : undefined,
        appUrl,
      });
      const rApplicant = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: applicantTpl,
        idempotencyKey: `application_submitted:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rApplicant });
    }

    const adminTpl = buildApplicationSubmittedAdminEmail({
      applicationId: recordId,
      programName,
      applicantName,
      applicantEmail: verifiedStudentEmail || String(data.applicantEmail || 'Not linked'),
      applicantPhone: data.applicantPhone ? String(data.applicantPhone) : undefined,
      institution: data.institution ? String(data.institution) : undefined,
      city: data.city ? String(data.city) : undefined,
      statement: data.statement ? String(data.statement) : undefined,
      reviewPath: data.reviewPath ? String(data.reviewPath) : '/admin/applications',
      appUrl,
    });
    const rAdmin = await dispatchViaResendWithRetry({
      env,
      to: adminEmails,
      template: adminTpl,
      idempotencyKey: `application_submitted:${recordId}:admin`,
      eventType,
      recipientRole: 'admin',
      recordId,
      rawEventData: data,
      forceResend,
    });
    results.push({ role: 'admin', ...rAdmin });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 5B: APPLICATION APPROVED OR REJECTED BY ADMIN
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'application_decision') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Only admins can send application decision emails.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const decision = data.decision === 'rejected' ? 'rejected' : 'approved';
    const programName = String(data.programName || 'Nakama Campus Captain');
    const applicantName = String(data.applicantName || studentDisplayName);

    if (verifiedStudentEmail) {
      const applicantTpl = buildApplicationDecisionApplicantEmail({
        applicantName,
        programName,
        decision,
        codeOrBadge: data.codeOrBadge ? String(data.codeOrBadge) : undefined,
        reason: data.reason ? String(data.reason) : undefined,
        ctaPath: data.ctaPath ? String(data.ctaPath) : undefined,
        appUrl,
      });
      const rApplicant = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: applicantTpl,
        idempotencyKey: `application_decision:${recordId}_${decision}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rApplicant });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 6: REFERRAL CONFIRMED OR REWARD CREDITED (To Referrer & Friend + Admin)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'referral_confirmed' || eventType === 'referral_reward_credited') {
    const stage = eventType === 'referral_reward_credited' ? 'credited' : 'confirmed';
    const referrerUid = String(data.referrerUid || '');
    const friendUid = String(data.friendUid || verifiedUser?.uid || '');
    const referrerKobans = Math.max(0, Math.floor(Number(data.referrerKobans || 5000)));
    const friendKobans = Math.max(0, Math.floor(Number(data.friendKobans || 1000)));

    const [referrerProfile, friendProfile] = await Promise.all([
      referrerUid ? fetchServerUserInfo(env, referrerUid) : Promise.resolve(null),
      friendUid ? fetchServerUserInfo(env, friendUid) : Promise.resolve(null),
    ]);

    const referrerEmail =
      referrerProfile?.email ||
      (referrerUid === verifiedUser?.uid ? verifiedUser?.email : null);
    const friendEmail =
      friendProfile?.email ||
      (friendUid === verifiedUser?.uid ? verifiedUser?.email : verifiedStudentEmail);

    const referrerName =
      String(data.referrerName || referrerProfile?.displayName || 'Boardly Classmate');
    const friendName =
      String(data.friendName || friendProfile?.displayName || studentDisplayName);

    let refBalBefore = data.referrerBalanceBefore ?? data.balanceBefore;
    let refBalAfter = data.referrerNewBalance ?? data.newBalance;
    if (stage === 'credited' && (refBalBefore === undefined || refBalAfter === undefined) && referrerUid) {
      const refLedger = await fetchCommittedLedgerBalances(
        env,
        referrerUid,
        `reward_ref_inviter_${recordId}`
      );
      if (refLedger) {
        if (refBalBefore === undefined) refBalBefore = refLedger.balanceBefore;
        if (refBalAfter === undefined) refBalAfter = refLedger.balanceAfter;
      }
    }

    let friendBalBefore = data.friendBalanceBefore;
    let friendBalAfter = data.friendNewBalance;
    if (stage === 'credited' && (friendBalBefore === undefined || friendBalAfter === undefined) && friendUid) {
      const friendLedger = await fetchCommittedLedgerBalances(
        env,
        friendUid,
        `reward_ref_invitee_${recordId}`
      );
      if (friendLedger) {
        if (friendBalBefore === undefined) friendBalBefore = friendLedger.balanceBefore;
        if (friendBalAfter === undefined) friendBalAfter = friendLedger.balanceAfter;
      }
    }

    if (stage === 'credited' && (refBalBefore !== undefined || refBalAfter !== undefined)) {
      const refSanity = verifyEmailBalanceSanity({
        balanceBefore: refBalBefore,
        delta: referrerKobans,
        balanceAfter: refBalAfter,
        context: `referral_reward_credited:referrer:${recordId}`,
      });
      if (!refSanity.valid) {
        return new Response(
          JSON.stringify({
            ok: false,
            status: 'skipped',
            eventType,
            recordId,
            error: refSanity.error,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      refBalBefore = refSanity.balanceBefore;
      refBalAfter = refSanity.balanceAfter;
    }

    if (stage === 'credited' && (friendBalBefore !== undefined || friendBalAfter !== undefined)) {
      const friendSanity = verifyEmailBalanceSanity({
        balanceBefore: friendBalBefore,
        delta: friendKobans,
        balanceAfter: friendBalAfter,
        context: `referral_reward_credited:friend:${recordId}`,
      });
      if (!friendSanity.valid) {
        return new Response(
          JSON.stringify({
            ok: false,
            status: 'skipped',
            eventType,
            recordId,
            error: friendSanity.error,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      friendBalBefore = friendSanity.balanceBefore;
      friendBalAfter = friendSanity.balanceAfter;
    }

    if (referrerEmail) {
      const refTpl = buildReferralEventEmail({
        recipientRole: 'referrer',
        recipientName: referrerName,
        counterpartyName: friendName,
        stage,
        kobansCredited: referrerKobans,
        balanceBefore: typeof refBalBefore === 'number' ? refBalBefore : undefined,
        newBalance: typeof refBalAfter === 'number' ? refBalAfter : undefined,
        referralCode: data.referralCode ? String(data.referralCode) : undefined,
        transactionId: `reward_ref_inviter_${recordId}`,
        appUrl,
      });
      const rRef = await dispatchViaResendWithRetry({
        env,
        to: referrerEmail,
        template: refTpl,
        idempotencyKey: `${eventType}:${recordId}:referrer`,
        eventType,
        recipientRole: 'referrer',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'referrer', ...rRef });
    }

    if (friendEmail) {
      const friendTpl = buildReferralEventEmail({
        recipientRole: 'friend',
        recipientName: friendName,
        counterpartyName: referrerName,
        stage,
        kobansCredited: friendKobans,
        balanceBefore: typeof friendBalBefore === 'number' ? friendBalBefore : undefined,
        newBalance: typeof friendBalAfter === 'number' ? friendBalAfter : undefined,
        referralCode: data.referralCode ? String(data.referralCode) : undefined,
        transactionId: `reward_ref_invitee_${recordId}`,
        appUrl,
      });
      const rFriend = await dispatchViaResendWithRetry({
        env,
        to: friendEmail,
        template: friendTpl,
        idempotencyKey: `${eventType}:${recordId}:friend`,
        eventType,
        recipientRole: 'friend',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'friend', ...rFriend });
    }

    // Admin copy for referral reward / confirmation
    if (stage === 'credited' && typeof refBalBefore === 'number' && typeof refBalAfter === 'number') {
      const adminRefTpl = buildKobanActivityAdminAlertEmail({
        studentName: referrerName,
        studentEmail: referrerEmail || undefined,
        studentUid: referrerUid || friendUid || 'referral',
        deltaAmount: referrerKobans,
        balanceBefore: refBalBefore,
        newBalance: refBalAfter,
        reason: `Referral reward with ${friendName}`,
        subType: 'referral_reward',
        transactionId: `reward_ref_inviter_${recordId}`,
        appUrl,
      });
      const rAdminRef = await dispatchViaResendWithRetry({
        env,
        to: adminEmails,
        template: adminRefTpl,
        idempotencyKey: `${eventType}:${recordId}:admin`,
        eventType,
        recipientRole: 'admin',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'admin', ...rAdminRef });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 7A: PRO PAYMENT REQUEST RECEIVED (PKR via JazzCash / Opay)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'pro_request_received') {
    const planName = String(data.planName || 'Boardly Pro Pass');
    const durationDays = Math.max(1, Number(data.durationDays || 30));
    const pkrAmount = Math.max(1, Number(data.pkrAmount || 199));
    const paymentMethod = String(data.paymentMethod || data.method || 'jazzcash');
    const transactionId = String(data.transactionId || data.TID || '');

    if (verifiedStudentEmail) {
      const studentTpl = buildProRequestReceivedStudentEmail({
        studentName: studentDisplayName,
        planName,
        durationDays,
        pkrAmount,
        paymentMethod,
        transactionId,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: studentTpl,
        idempotencyKey: `pro_request_received:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }

    const adminTpl = buildProRequestReceivedAdminEmail({
      requestId: recordId,
      studentName: studentDisplayName,
      studentEmail: verifiedStudentEmail || 'Not linked',
      studentUid: targetStudentUid,
      planName,
      durationDays,
      pkrAmount,
      paymentMethod,
      transactionId,
      appUrl,
    });
    const rAdmin = await dispatchViaResendWithRetry({
      env,
      to: adminEmails,
      template: adminTpl,
      idempotencyKey: `pro_request_received:${recordId}:admin`,
      eventType,
      recipientRole: 'admin',
      recordId,
      rawEventData: data,
      forceResend,
    });
    results.push({ role: 'admin', ...rAdmin });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 7B: PRO ACTIVATED OR EXTENDED (Kobans instant checkout OR Admin PKR approval)
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'pro_activated') {
    const planName = String(data.planName || 'Boardly Pro Pass');
    const durationDays = Math.max(1, Number(data.durationDays || 30));
    const expiresAtLabel = String(data.expiresAtLabel || 'Active');
    const wasExtension = Boolean(data.wasExtension);
    const previousExpiryLabel = data.previousExpiryLabel ? String(data.previousExpiryLabel) : null;
    const paidWith: 'kobans' | 'pkr' = data.paidWith === 'pkr' ? 'pkr' : 'kobans';
    const kobansSpent = data.kobansSpent !== undefined ? Math.max(0, Math.floor(Number(data.kobansSpent))) : undefined;
    const pkrAmount = data.pkrAmount !== undefined ? Math.max(0, Number(data.pkrAmount)) : undefined;
    const transactionId = data.transactionId ? String(data.transactionId) : recordId;

    let balanceBefore = data.balanceBefore ?? data.balance_before;
    let newBalance = data.newBalance ?? data.balanceAfter ?? data.balance_after;

    if (paidWith === 'kobans' && kobansSpent !== undefined && kobansSpent > 0) {
      if (balanceBefore === undefined || newBalance === undefined) {
        const committedLedger = await fetchCommittedLedgerBalances(env, targetStudentUid, transactionId);
        if (committedLedger) {
          if (balanceBefore === undefined) balanceBefore = committedLedger.balanceBefore;
          if (newBalance === undefined) newBalance = committedLedger.balanceAfter;
        }
      }
      const sanity = verifyEmailBalanceSanity({
        balanceBefore,
        delta: -kobansSpent,
        balanceAfter: newBalance,
        context: `pro_activated:${recordId}`,
      });
      if (!sanity.valid) {
        return new Response(
          JSON.stringify({
            ok: false,
            status: 'skipped',
            eventType,
            recordId,
            error: sanity.error,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      balanceBefore = sanity.balanceBefore;
      newBalance = sanity.balanceAfter;
    }

    if (verifiedStudentEmail) {
      const studentTpl = buildProActivatedStudentEmail({
        studentName: studentDisplayName,
        planName,
        durationDays,
        expiresAtLabel,
        wasExtension,
        previousExpiryLabel,
        paidWith,
        kobansSpent,
        balanceBefore: typeof balanceBefore === 'number' ? balanceBefore : undefined,
        newBalance: typeof newBalance === 'number' ? newBalance : undefined,
        pkrAmount,
        transactionId,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: studentTpl,
        idempotencyKey: `pro_activated:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }

    const adminTpl = buildProActivatedAdminEmail({
      studentName: studentDisplayName,
      studentEmail: verifiedStudentEmail || undefined,
      studentUid: targetStudentUid,
      planName,
      durationDays,
      expiresAtLabel,
      paidWith,
      kobansSpent,
      balanceBefore: typeof balanceBefore === 'number' ? balanceBefore : undefined,
      newBalance: typeof newBalance === 'number' ? newBalance : undefined,
      pkrAmount,
      transactionId,
      adminEmail: data.adminEmail ? String(data.adminEmail) : verifiedUser?.email || undefined,
      appUrl,
    });
    const rAdmin = await dispatchViaResendWithRetry({
      env,
      to: adminEmails,
      template: adminTpl,
      idempotencyKey: `pro_activated:${recordId}:admin`,
      eventType,
      recipientRole: 'admin',
      recordId,
      rawEventData: data,
      forceResend,
    });
    results.push({ role: 'admin', ...rAdmin });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 7C: PRO PAYMENT REQUEST REJECTED BY ADMIN
  // ───────────────────────────────────────────────────────────────────────────
  else if (eventType === 'pro_request_rejected') {
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Only admins can send Pro request rejection emails.' }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const planName = String(data.planName || 'Boardly Pro Pass');
    const pkrAmount = Math.max(1, Number(data.pkrAmount || 199));
    const reason = String(data.reason || 'Transaction ID could not be verified.');
    const transactionId = data.transactionId ? String(data.transactionId) : undefined;

    if (verifiedStudentEmail) {
      const studentTpl = buildProRequestRejectedStudentEmail({
        studentName: studentDisplayName,
        planName,
        pkrAmount,
        reason,
        transactionId,
        appUrl,
      });
      const rStudent = await dispatchViaResendWithRetry({
        env,
        to: verifiedStudentEmail,
        template: studentTpl,
        idempotencyKey: `pro_request_rejected:${recordId}:student`,
        eventType,
        recipientRole: 'student',
        recordId,
        rawEventData: data,
        forceResend,
      });
      results.push({ role: 'student', ...rStudent });
    }
  }

  return new Response(
    JSON.stringify({
      ok: results.every((r) => r.ok),
      eventType,
      recordId,
      results,
    }),
    { status: 200, headers: jsonHeaders }
  );
}

// Cloudflare Pages Function export for `/functions/api/send-email.ts`
export const onRequest = async (context: { request: Request; env: SendEmailEnv }) => {
  return handleSendEmailRequest(context.request, context.env);
};
