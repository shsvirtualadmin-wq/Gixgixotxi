import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import type {
  UserProfile,
  Question,
  QuestionKey,
  QuestionReport,
  AuditLog,
  PaymentRequest,
  StudentReview,
  CaptainApplication,
  CrewApplication,
  Timestamp,
} from '@/types';
import {
  findSubjectSlug,
  findChapterSlug,
} from '@/constants/taxonomy';
import { normalizeCorrectAnswer } from './testEngine';
import { recordCrewPaymentActionServer } from './crewBackend';
import {
  clearMultiSourceCache,
  getMultiSourceQuestionCounts,
  fetchMultiSourceSubjectTopics,
  fetchMultiSourceQuestionsPaginated,
  saveMultiSourceQuestion,
  deleteMultiSourceQuestion,
  moveMultiSourceQuestionsToTopic,
  batchImportMultiSourceQuestions,
  fetchMultiSourceQuestionKey,
  parseQuestionCompoundId,
  rebuildCountsAndIndex,
  type RebuildCountsResult,
  scanMisfiledQuestions,
  fixMisfiledQuestions,
  type MisfiledQuestionCandidate,
  type FixMisfiledResult,
} from './multiSourceQuestionBank';
export {
  rebuildCountsAndIndex,
  type RebuildCountsResult,
  scanMisfiledQuestions,
  fixMisfiledQuestions,
  type MisfiledQuestionCandidate,
  type FixMisfiledResult,
};
import { getDefaultWriteSource } from '@/config/questionBankSources';

export class AdminFirestoreError extends Error {
  code: string;
  collection: string;
  operation: string;

  constructor(message: string, code: string, collection: string, operation: string) {
    super(message);
    this.name = 'AdminFirestoreError';
    this.code = code;
    this.collection = collection;
    this.operation = operation;
  }
}

export async function logAdminAction(
  adminEmail: string,
  action: string,
  details?: Record<string, unknown> | string,
  targetUid?: string,
  targetEmail?: string
): Promise<void> {
  try {
    await api.post('/api/admin/audit-logs', {
      adminEmail: adminEmail.toLowerCase(),
      action,
      targetUid: targetUid ?? null,
      targetEmail: targetEmail ?? null,
      details: details ?? {},
    });
  } catch (err) {
    console.warn('[AdminService] Audit log note:', err);
  }
}

export function getUserDisplayName(
  profile?: Partial<UserProfile> | null,
  fallbackAuthUser?: { displayName?: string | null; email?: string | null } | null
): string {
  if (profile?.displayName && profile.displayName.trim() && profile.displayName !== 'Unnamed Student') {
    return profile.displayName.trim();
  }
  if (profile?.name && profile.name.trim() && profile.name !== 'Unnamed Student') {
    return profile.name.trim();
  }
  if (fallbackAuthUser?.displayName && fallbackAuthUser.displayName.trim()) {
    return fallbackAuthUser.displayName.trim();
  }
  const email = profile?.email || fallbackAuthUser?.email;
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    return prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Student';
}

export interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalAttempts: number;
  totalQuestionsSolved: number;
  totalActiveCrews: number;
  totalAmbassadors: number;
  pendingCaptains: number;
  pendingCrew: number;
  pendingPayments: number;
  pendingReviews: number;
  subjectCounts: Record<string, number>;
}

export interface AdminAmbassadorItem {
  uid: string;
  name: string;
  shortId: string;
  email: string;
  totalReferrals: number;
  bonusWeeks: number;
  referredStudents: Array<{
    name: string;
    shortId: string;
    joinedDate: string;
    track: string;
  }>;
}

export const CORE_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Biology',
  'Analytical Reasoning',
] as const;

let cachedAdminStats: AdminStats | null = null;

export function getCachedAdminStats(): AdminStats | null {
  return cachedAdminStats;
}

export async function fetchAdminAmbassadorsList(): Promise<AdminAmbassadorItem[]> {
  try {
    const res = await api.get<{
      captains?: any[];
      referrals?: any[];
      crews?: any[];
    }>('/api/admin/captains-referrals');

    const referralsByAmbassador: Record<
      string,
      Array<{ name: string; shortId: string; joinedDate: string; track: string }>
    > = {};

    (res.referrals || []).forEach((data: any) => {
      const ambUid = data.referrer_uid || data.referrerUid || data.referrer_code || data.referrerCode;
      if (!ambUid) return;

      if (!referralsByAmbassador[ambUid]) {
        referralsByAmbassador[ambUid] = [];
      }

      const ts = Number(data.signed_up_at || data.signedUpAt || Date.now());
      const dateStr = new Date(ts).toLocaleDateString('en-GB');

      referralsByAmbassador[ambUid].push({
        name: data.referred_name || data.referredName || (data.referred_email || '').split('@')[0] || 'Student',
        shortId: String(data.referred_uid || data.id || '').slice(0, 5),
        joinedDate: dateStr,
        track: data.track || 'FAST / NUST Prep',
      });
    });

    const ambassadorsMap = new Map<string, AdminAmbassadorItem>();
    for (const c of res.captains || []) {
      const uid = String(c.user_id || c.uid || '');
      if (!uid || uid.startsWith('bot_')) continue;
      const code = String(c.referral_code || c.captain_code || '');
      const brought = referralsByAmbassador[uid] || (code ? referralsByAmbassador[code] : []) || [];
      ambassadorsMap.set(uid, {
        uid,
        name: c.name || 'Captain',
        shortId: code || uid.slice(0, 5),
        email: c.email || '',
        totalReferrals: Math.max(brought.length, Number(c.activated_referrals || 0)),
        bonusWeeks: Math.max(brought.length, Number(c.activated_referrals || 0)),
        referredStudents: brought,
      });
    }

    return Array.from(ambassadorsMap.values()).sort((a, b) => b.totalReferrals - a.totalReferrals);
  } catch (err) {
    console.warn('[adminService] fetchAdminAmbassadorsList error:', err);
    return [];
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [statsRes, msCounts] = await Promise.all([
      api.get<{ stats: Record<string, number> }>('/api/admin/stats').catch(() => ({ stats: {} })),
      getMultiSourceQuestionCounts(),
    ]);

    const s = statsRes?.stats || {};
    const msSubjects = msCounts?.subjectCounts || {};
    const subjectCounts: Record<string, number> = {};

    for (const subj of CORE_SUBJECTS) {
      const slug = findSubjectSlug(subj) || subj.toLowerCase().trim();
      const count = (msSubjects[slug] || 0) + (msSubjects[subj] || 0);
      subjectCounts[subj] = count;
      subjectCounts[slug] = count;
    }

    const multiSourceTotal = Object.values(msSubjects).reduce((a, b) => a + Number(b || 0), 0);
    const totalUsers = Number(s.totalUsers || 0);
    const totalAttempts = Number(s.totalAttempts || 0);
    const totalQuestions = Math.max(Number(s.totalQuestions || 0), multiSourceTotal);

    const result: AdminStats = {
      totalUsers,
      totalQuestions,
      totalAttempts,
      totalQuestionsSolved: Math.max(totalAttempts * 15, totalUsers * 12),
      totalActiveCrews: Math.max(Number(s.activeCrews || 0), 1),
      totalAmbassadors: Math.max(Number(s.totalCaptains || 0), 1),
      pendingCaptains: Number(s.pendingCaptainApps || 0),
      pendingCrew: Number(s.pendingCrewApps || 0),
      pendingPayments: Number(s.pendingPayments || 0),
      pendingReviews: 0,
      subjectCounts,
    };

    cachedAdminStats = result;
    return result;
  } catch (err) {
    console.warn('[AdminService] stats fetch failed, returning zeroed stats:', err);
    return {
      totalUsers: 0,
      totalQuestions: 0,
      totalAttempts: 0,
      totalQuestionsSolved: 0,
      totalActiveCrews: 0,
      totalAmbassadors: 0,
      pendingCaptains: 0,
      pendingCrew: 0,
      pendingPayments: 0,
      pendingReviews: 0,
      subjectCounts: {},
    };
  }
}

export async function seedBalancedMCQPool(
  _adminEmail: string,
  _onProgress?: (done: number, total: number) => void
): Promise<{ seeded: number; total: number }> {
  return { seeded: 0, total: 0 };
}

export interface PaginatedUsersResult {
  users: UserProfile[];
  lastDoc: any | null;
  hasMore: boolean;
  queryTimeMs: number;
}

export async function fetchUsersPaginated(options?: {
  limitCount?: number;
  startAfterDoc?: any | null;
  role?: string;
  plan?: string;
  searchQuery?: string;
}): Promise<PaginatedUsersResult> {
  const startTime = performance.now();
  const count = options?.limitCount ?? 50;
  const params = new URLSearchParams();
  params.set('limit', String(count));
  if (options?.role && options.role !== 'all') params.set('role', options.role);
  if (options?.plan && options.plan !== 'all') params.set('plan', options.plan);
  if (options?.searchQuery) params.set('q', options.searchQuery);

  const res = await api.get<{ users: UserProfile[] }>(`/api/admin/users?${params.toString()}`);
  const users = (res.users || []).filter(
    (u) => !u.uid.startsWith('bot_') && (u as any).role !== 'bot'
  );
  const queryTimeMs = Math.round(performance.now() - startTime);

  return {
    users,
    lastDoc: null,
    hasMore: false,
    queryTimeMs,
  };
}

export function isProtectedSuperAdmin(
  userOrProfile: { email?: string | null; role?: string | null; uid?: string | null } | null | undefined
): boolean {
  if (!userOrProfile) return false;
  const email = userOrProfile.email?.toLowerCase().trim();
  const role = userOrProfile.role;
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    email === 'shsvirtualadmin@gmail.com' ||
    email === 'support@boardly.cfd' ||
    userOrProfile.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
  );
}

export interface UserResetPreview {
  totalUsers: number;
  usersToDelete: { uid: string; email: string; displayName?: string | null }[];
  superadminsKept: { uid: string; email: string; role?: string }[];
}

export async function previewResetUsers(): Promise<UserResetPreview> {
  const res = await api.get<{ users: UserProfile[] }>('/api/admin/users?limit=500');
  const all = res.users || [];
  const usersToDelete: { uid: string; email: string; displayName?: string | null }[] = [];
  const superadminsKept: { uid: string; email: string; role?: string }[] = [];

  for (const data of all) {
    const item = {
      uid: data.uid,
      email: data.email || 'no-email',
      displayName: data.displayName || data.name,
      role: data.role,
    };
    if (isProtectedSuperAdmin(item)) {
      superadminsKept.push(item);
    } else {
      usersToDelete.push(item);
    }
  }

  return {
    totalUsers: all.length,
    usersToDelete,
    superadminsKept,
  };
}

export async function executeResetAllUsers(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ deletedUsersCount: number; deletedRecordsCount: number; keptSuperadmins: string[] }> {
  const preview = await previewResetUsers();
  if (onProgress) onProgress(preview.usersToDelete.length, preview.usersToDelete.length);
  await logAdminAction(adminEmail, 'reset_users_noop_safe', {
    keptSuperadmins: preview.superadminsKept.map((s) => s.email),
  });
  return {
    deletedUsersCount: 0,
    deletedRecordsCount: 0,
    keptSuperadmins: preview.superadminsKept.map((s) => s.email),
  };
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await fetchUsersPaginated({ limitCount: 150 });
  return res.users;
}

export async function updateUserOverride(
  adminEmail: string,
  targetUid: string,
  targetEmail: string,
  updates: Partial<UserProfile>,
  previous: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await api.post<{ user?: UserProfile }>(
    `/api/admin/users/${encodeURIComponent(targetUid)}/override`,
    updates
  );

  await logAdminAction(
    adminEmail,
    'user_override',
    { updates, previous },
    targetUid,
    targetEmail
  );

  return res.user || ({ ...previous, ...updates, uid: targetUid } as UserProfile);
}

export interface DeleteUserAccountResult {
  firebaseAuthDeleted: boolean;
  firestoreDeleted: boolean;
  cloudflareD1Deleted: boolean;
  warning?: string;
}

export async function deleteUserAccount(
  adminEmail: string,
  targetUid: string,
  targetEmail: string
): Promise<DeleteUserAccountResult> {
  const cleanAdmin = (adminEmail || '').trim().toLowerCase();
  if (
    cleanAdmin !== 'shsvirtualadmin@gmail.com' &&
    cleanAdmin !== 'support@boardly.cfd'
  ) {
    throw new Error('Only Superadmin (shsvirtualadmin@gmail.com) can permanently delete users.');
  }

  const cleanUid = (targetUid || '').trim();
  const cleanEmail = (targetEmail || '').trim().toLowerCase();
  if (!cleanUid) {
    throw new Error('Missing target user UID for deletion.');
  }

  await api.post('/api/admin/users/delete', {
    targetUid: cleanUid,
    targetEmail: cleanEmail,
  });

  return {
    firebaseAuthDeleted: false,
    firestoreDeleted: false,
    cloudflareD1Deleted: true,
  };
}

export async function cleanupOrphanUserProfiles(
  adminEmail: string
): Promise<{ scanned: number; removed: number; removedUids: string[] }> {
  await logAdminAction(adminEmail, 'cleanup_orphan_profiles_d1', {});
  return { scanned: 0, removed: 0, removedUids: [] };
}

export async function backfillMissingDisplayNames(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ updated: number; total: number }> {
  const res = await api.post<{ synced?: number }>('/api/admin/backfill-public-profiles', {});
  const count = Number(res.synced || 0);
  if (onProgress) onProgress(count, count);
  await logAdminAction(adminEmail, 'backfill_missing_display_names', { updatedCount: count });
  return { updated: count, total: count };
}

export async function fetchUserRecentAttempts(
  userId: string,
  limitCount = 5
): Promise<
  Array<{
    id: string;
    subject?: string;
    score?: number;
    totalQuestions?: number;
    percentage?: number;
    createdAt?: Timestamp | { seconds: number } | string | null;
  }>
> {
  try {
    const res = await api.get<{ attempts: any[] }>(
      `/api/practice-attempts?uid=${encodeURIComponent(userId)}&limit=${limitCount}`
    );
    return Array.isArray(res.attempts) ? res.attempts.slice(0, limitCount) : [];
  } catch (err) {
    console.warn('[AdminService] fetchUserRecentAttempts error:', err);
    return [];
  }
}

export interface PaginatedQuestionsResult {
  questions: Question[];
  lastDoc: any | null;
  hasMore: boolean;
}

export async function fetchQuestionsPaginated(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
  startAfterDoc?: any | null;
}): Promise<PaginatedQuestionsResult> {
  const res = await fetchMultiSourceQuestionsPaginated({
    subject: filters.subject || 'mathematics',
    search: filters.search,
    difficulty: filters.difficulty,
    pageIndex: 0,
    pageSize: filters.limitCount ?? 50,
  });

  return {
    questions: res.questions,
    lastDoc: null,
    hasMore: res.hasMore,
  };
}

export async function fetchQuestions(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
}): Promise<Question[]> {
  const res = await fetchQuestionsPaginated(filters);
  return res.questions;
}

export async function fetchQuestionKey(questionId: string): Promise<QuestionKey | null> {
  try {
    const msKey = await fetchMultiSourceQuestionKey(questionId);
    if (msKey) {
      return {
        id: questionId,
        correct: typeof msKey.correct === 'number' ? msKey.correct : 0,
        explain: msKey.explain || '',
      } as QuestionKey;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveQuestion(
  adminEmail: string,
  question: Partial<Question> & {
    correct?: number;
    correctAnswer?: number;
    explain?: string;
    explanation?: string;
  }
): Promise<string> {
  const qText = (question.q || question.question || '').trim();
  const rawOpts = question.options && question.options.length >= 4 ? question.options : ['', '', '', ''];
  const options: [string, string, string, string] = [
    rawOpts[0] || '',
    rawOpts[1] || '',
    rawOpts[2] || '',
    rawOpts[3] || '',
  ];

  const subjectSlug = findSubjectSlug(question.subject || 'mathematics') || 'mathematics';
  const chapterSlug = findChapterSlug(subjectSlug, question.chapter || '') || question.chapter || 'General';
  const difficulty = (question.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';
  const status = (question.status || 'published') as 'draft' | 'reviewed' | 'published';

  const rawKey = question.correct !== undefined ? question.correct : question.correctAnswer;
  const resolvedKey = normalizeCorrectAnswer(rawKey, options);
  if (!resolvedKey) {
    throw new Error('Validation failed: A valid correct answer matching one of the options is required.');
  }

  const res = await saveMultiSourceQuestion(adminEmail, getDefaultWriteSource().id, {
    id: question.id,
    subject: subjectSlug,
    topic: chapterSlug,
    text: qText,
    options,
    correct: resolvedKey.correctIndex,
    explain: (question.explain || question.explanation || '').trim(),
    difficulty,
    status,
  });

  return res.compoundId;
}

export async function deleteQuestion(adminEmail: string, questionId: string): Promise<void> {
  await deleteMultiSourceQuestion(adminEmail, 'mathematics', questionId);
}

export interface BankHealthStats {
  totalQuestions: number;
  bySubject: Record<string, number>;
  byChapter: Record<string, number>;
  byDifficulty: { easy: number; medium: number; hard: number };
  byStatus: { draft: number; reviewed: number; published: number };
  activeCount: number;
  inactiveCount: number;
  openReportsCount: number;
  duplicatesDetected: number;
  invalidCorrectCount: number;
  needsReviewCount?: number;
  lastImportAt?: string | null;
  banks?: Record<
    string,
    {
      bankId: string;
      label: string;
      total: number;
      published: number;
      needsReview: number;
      bySubject: Record<string, number>;
      lastImportAt: string | null;
    }
  >;
}

export async function fetchBankHealth(): Promise<BankHealthStats> {
  const result: BankHealthStats = {
    totalQuestions: 0,
    bySubject: {},
    byChapter: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byStatus: { draft: 0, reviewed: 0, published: 0 },
    activeCount: 0,
    inactiveCount: 0,
    openReportsCount: 0,
    duplicatesDetected: 0,
    invalidCorrectCount: 0,
    needsReviewCount: 0,
    lastImportAt: null,
    banks: {},
  };

  try {
    const [healthResp, listResp] = await Promise.all([
      fetch('/api/questions/health'),
      fetch('/api/questions?limit=1000'),
    ]);
    if (healthResp.ok) {
      const hData = await healthResp.json();
      result.totalQuestions = Number(hData?.totalQuestions ?? 0);
      result.bySubject = hData?.bySubject || {};
      result.needsReviewCount = Number(hData?.totalNeedsReview ?? 0);
      result.lastImportAt = hData?.lastImportAt || null;
      result.banks = hData?.banks || {};
    }
    if (listResp.ok) {
      const lData = await listResp.json();
      const qList = Array.isArray(lData?.questions) ? lData.questions : [];
      for (const q of qList) {
        const ch = String(q.topic || 'General');
        const diff = String(q.difficulty || 'medium').toLowerCase();
        const st = String(q.status || 'published').toLowerCase();
        result.byChapter[ch] = (result.byChapter[ch] || 0) + 1;
        if (diff === 'easy') result.byDifficulty.easy++;
        else if (diff === 'hard') result.byDifficulty.hard++;
        else result.byDifficulty.medium++;

        if (st === 'draft') result.byStatus.draft++;
        else if (st === 'reviewed') result.byStatus.reviewed++;
        else result.byStatus.published++;

        if (st !== 'archived') result.activeCount++;
        else result.inactiveCount++;
      }
    }
  } catch (err) {
    console.warn('[AdminService] fetchBankHealth D1 error:', err);
  }
  return result;
}

export async function batchUpdateQuestions(
  _adminEmail: string,
  questionIds: string[],
  updates: { status?: 'draft' | 'reviewed' | 'published'; active?: boolean; chapter?: string }
): Promise<number> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const resp = await fetch('/api/questions/batch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      ids: questionIds,
      updates: {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.chapter ? { topic: updates.chapter } : {}),
      },
    }),
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error || `Failed to batch update questions in D1 (HTTP ${resp.status})`);
  }
  const data = await resp.json();
  clearMultiSourceCache();
  clearQuestionsCache();
  return Number(data?.updatedCount ?? questionIds.length);
}

export interface ImportCandidate {
  question: Partial<Question>;
  key: { correct: number; explain: string };
}

export interface ImportResult {
  imported: number;
  duplicatesSkipped: number;
  errors: string[];
}

export async function batchImportQuestions(
  adminEmail: string,
  candidates: ImportCandidate[],
  onProgress?: (done: number, total: number) => void
): Promise<ImportResult> {
  const rows = candidates.map((c) => ({
    subject: c.question.subject || 'mathematics',
    topic: c.question.chapter || 'General',
    text: c.question.q || c.question.question || '',
    options: c.question.options || ['', '', '', ''],
    correct: c.key.correct,
    explain: c.key.explain,
    difficulty: c.question.difficulty || 'medium',
    status: c.question.status || 'published',
  }));
  return batchImportMultiSourceQuestions(
    adminEmail,
    getDefaultWriteSource().id,
    'mathematics',
    'General',
    rows,
    onProgress
  );
}

export async function fetchQuestionReports(): Promise<QuestionReport[]> {
  try {
    const res = await api.get<{ reports: any[] }>('/api/admin/question-reports');
    return (res.reports || []).map((r: any) => ({
      id: String(r.id),
      questionId: String(r.question_id || r.questionId || ''),
      reason: String(r.reason || 'other'),
      comment: String(r.comment || ''),
      userId: String(r.user_id || r.userId || ''),
      userEmail: String(r.user_email || r.userEmail || ''),
      status: (r.status || 'open') as 'open' | 'resolved' | 'dismissed',
      createdAt: r.created_at || r.createdAt || Date.now(),
    })) as QuestionReport[];
  } catch (err) {
    console.warn('[AdminService] fetchQuestionReports error:', err);
    return [];
  }
}

export async function updateQuestionReportStatus(
  adminEmail: string,
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<void> {
  await api.post(`/api/admin/question-reports/${encodeURIComponent(reportId)}/resolve`, {
    status,
    resolvedBy: adminEmail,
  });
}

// ─── APPLICATION REVIEWS (CAPTAINS & CREW) ───────────────────────────────────
export async function fetchCaptainApplications(statusFilter = 'all'): Promise<CaptainApplication[]> {
  try {
    const res = await api.get<{ applications: any[] }>('/api/admin/applications/captain');
    const list = (res.applications || []).map((d: any) => ({
      id: String(d.id),
      userId: String(d.user_id || d.userId || ''),
      name: String(d.name || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      whatsapp: d.whatsapp || undefined,
      university: String(d.university || ''),
      city: String(d.city || ''),
      motivation: String(d.motivation || ''),
      status: (d.status || 'pending') as 'pending' | 'approved' | 'rejected',
      createdAt: d.created_at || d.createdAt || Date.now(),
    })) as CaptainApplication[];

    if (statusFilter !== 'all') {
      return list.filter((a) => a.status === statusFilter);
    }
    return list;
  } catch (err) {
    console.error('[AdminService] fetchCaptainApplications error:', err);
    return [];
  }
}

export async function fetchCrewApplications(statusFilter = 'all'): Promise<CrewApplication[]> {
  try {
    const res = await api.get<{ applications: any[] }>('/api/admin/applications/crew');
    const list = (res.applications || []).map((d: any) => ({
      id: String(d.id),
      userId: String(d.user_id || d.userId || ''),
      name: String(d.name || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      city: String(d.city || ''),
      college: String(d.college || ''),
      whyJoin: String(d.why_join || d.whyJoin || ''),
      status: (d.status || 'pending') as 'pending' | 'approved' | 'rejected',
      createdAt: d.created_at || d.createdAt || Date.now(),
    })) as CrewApplication[];

    if (statusFilter !== 'all') {
      return list.filter((a) => a.status === statusFilter);
    }
    return list;
  } catch (err) {
    console.error('[AdminService] fetchCrewApplications error:', err);
    return [];
  }
}

export async function approveCaptainApplication(
  _adminEmail: string,
  app: CaptainApplication
): Promise<void> {
  await api.post(`/api/admin/applications/captain/${encodeURIComponent(app.id)}/review`, {
    status: 'approved',
  });
}

export async function approveCrewApplication(
  _adminEmail: string,
  app: CrewApplication
): Promise<void> {
  await api.post(`/api/admin/applications/crew/${encodeURIComponent(app.id)}/review`, {
    status: 'approved',
  });
}

export async function rejectApplication(
  _adminEmail: string,
  type: 'captain' | 'crew',
  appId: string,
  _targetUid: string,
  _targetEmail: string,
  reason?: string
): Promise<void> {
  await api.post(`/api/admin/applications/${type}/${encodeURIComponent(appId)}/review`, {
    status: 'rejected',
    rejectionReason: reason || 'Application criteria not met at this time.',
  });
}

// ─── PAYMENT UPGRADE REQUESTS ────────────────────────────────────────────────
export async function fetchPaymentRequests(statusFilter = 'all'): Promise<PaymentRequest[]> {
  try {
    const res = await api.get<{ payments: any[] }>('/api/admin/payments');
    const list = (res.payments || []).map((d: any) => ({
      id: String(d.id),
      userId: String(d.user_id || d.userId || ''),
      userEmail: String(d.user_email || d.userEmail || ''),
      userName: String(d.user_name || d.userName || ''),
      plan: String(d.plan || 'pro'),
      crewId: d.crew_id || d.crewId || undefined,
      amount: Number(d.amount || 0),
      durationMonths: Number(d.duration_months || d.durationMonths || 1),
      method: String(d.method || ''),
      transactionId: String(d.transaction_id || d.transactionId || ''),
      status: (d.status || 'pending') as 'pending' | 'approved' | 'rejected',
      createdAt: d.created_at || d.createdAt || Date.now(),
    })) as PaymentRequest[];

    if (statusFilter !== 'all') {
      return list.filter((p) => p.status === statusFilter);
    }
    return list;
  } catch (err) {
    console.error('[AdminService] fetchPaymentRequests error:', err);
    return [];
  }
}

export async function approvePaymentRequest(
  adminEmail: string,
  req: PaymentRequest
): Promise<void> {
  if ((req.plan === 'large_crew' || req.crewId) && req.crewId) {
    await recordCrewPaymentActionServer({
      crewId: req.crewId,
      action: 'extend_month',
      adminEmail,
      reason: `Verified ${req.method} transaction ${req.transactionId}`,
      amount: req.amount,
      transactionId: req.transactionId,
    }).catch(() => {});
  }

  await api.post(`/api/admin/payments/${encodeURIComponent(req.id)}/review`, {
    status: 'approved',
    durationMonths: req.durationMonths ?? 1,
  });
}

export async function rejectPaymentRequest(
  _adminEmail: string,
  reqId: string,
  _targetUid: string,
  _targetEmail: string,
  reason?: string
): Promise<void> {
  await api.post(`/api/admin/payments/${encodeURIComponent(reqId)}/review`, {
    status: 'rejected',
    rejectionReason: reason || 'Invalid transaction ID or payment not received.',
  });
}

// ─── REVIEW MODERATION ───────────────────────────────────────────────────────
export async function fetchReviews(statusFilter = 'all'): Promise<StudentReview[]> {
  try {
    const res = await api.get<{ reviews: any[] }>('/api/admin/reviews');
    const list = (res.reviews || []).map((d: any) => ({
      id: String(d.id),
      userId: String(d.user_id || d.userId || ''),
      userName: String(d.user_name || d.userName || 'Student'),
      userEmail: d.user_email || d.userEmail || '',
      university: d.university || '',
      rating: Number(d.rating || 5),
      comment: String(d.comment || ''),
      status: (d.status || 'pending') as 'pending' | 'approved' | 'rejected',
      createdAt: d.created_at || d.createdAt || Date.now(),
    })) as StudentReview[];

    if (statusFilter !== 'all') {
      return list.filter((r) => r.status === statusFilter);
    }
    return list;
  } catch (err) {
    console.error('[AdminService] fetchReviews error:', err);
    return [];
  }
}

export async function approveReview(_adminEmail: string, reviewId: string): Promise<void> {
  await api.post(`/api/admin/reviews/${encodeURIComponent(reviewId)}/status`, {
    status: 'approved',
  });
}

export async function rejectReview(_adminEmail: string, reviewId: string): Promise<void> {
  await api.post(`/api/admin/reviews/${encodeURIComponent(reviewId)}/status`, {
    status: 'rejected',
  });
}

export async function deleteReview(_adminEmail: string, reviewId: string): Promise<void> {
  await api.post(`/api/admin/reviews/${encodeURIComponent(reviewId)}/status`, {
    status: 'rejected',
  });
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export async function fetchAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  try {
    const res = await api.get<{ logs: AuditLog[] }>(`/api/admin/audit-logs?limit=${limitCount}`);
    return Array.isArray(res.logs) ? res.logs : [];
  } catch (err) {
    console.warn('[AdminService] fetchAuditLogs warning:', err);
    return [];
  }
}

export async function fetchUserAttempts(targetUid: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await api.get<{ attempts: Record<string, unknown>[] }>(
      `/api/practice-attempts?uid=${encodeURIComponent(targetUid)}&limit=20`
    );
    return Array.isArray(res.attempts) ? res.attempts : [];
  } catch (err) {
    console.warn('[AdminService] fetchUserAttempts error:', err);
    return [];
  }
}

// ─── DEDICATED SUBJECT QUESTION POOLS ────────────────────────────────────────
export function getSubjectPoolCollection(subject: string): string {
  const norm = (subject || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `questions_${norm}`;
}

export function isSubjectPoolSupported(subject: string): boolean {
  const norm = (subject || '').trim().toLowerCase();
  return norm === 'mathematics' || norm === 'math' || norm === 'maths';
}

export interface PoolTopicCount {
  name: string;
  count: number;
}

export interface SubjectCardInfo {
  slug: string;
  name: string;
  isPool: boolean;
  poolCollection: string;
  count: number;
}

export async function seedInitialMathPool(_adminEmail: string): Promise<number> {
  return 0;
}

export interface QuestionCountsDoc {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
  updatedAt?: unknown;
}

const questionsPageCache = new Map<string, PaginatedQuestionsResult>();

export function clearQuestionsCache(): void {
  questionsPageCache.clear();
}

export async function getQuestionCountsDoc(): Promise<QuestionCountsDoc> {
  return getMultiSourceQuestionCounts();
}

export async function getSubjectQuestionIds(_subject: string): Promise<string[]> {
  return [];
}

export async function addIdToSubjectIndex(_subject: string, _id: string | string[]): Promise<void> {}

export async function removeIdFromSubjectIndex(_subject: string, _id: string): Promise<void> {}

export async function fetchSubjectPoolCounts(): Promise<Record<string, number>> {
  const docData = await getMultiSourceQuestionCounts();
  return docData.subjectCounts;
}

export async function fetchSubjectTopics(subject: string): Promise<PoolTopicCount[]> {
  return fetchMultiSourceSubjectTopics(subject);
}

export async function fetchPoolQuestionsPaginated(filters: {
  subject: string;
  topic?: string;
  search?: string;
  difficulty?: string;
  status?: string;
  bank?: string;
  needsReview?: boolean;
  limitCount?: number;
  startAfterDoc?: any | null;
  pageIndex?: number;
}): Promise<PaginatedQuestionsResult> {
  const count = filters.limitCount ?? 20;
  const isFirstPage = !filters.startAfterDoc && !filters.pageIndex;
  const cacheKey = `${filters.subject}__${filters.topic || 'all'}__${filters.difficulty || 'all'}__${filters.status || 'all'}__${filters.bank || 'all'}__${filters.needsReview === undefined ? 'all' : filters.needsReview ? '1' : '0'}__${(filters.search || '').trim().toLowerCase()}__p${filters.pageIndex || 0}`;

  if (isFirstPage && questionsPageCache.has(cacheKey)) {
    return questionsPageCache.get(cacheKey)!;
  }

  const res = await fetchMultiSourceQuestionsPaginated({
    subject: filters.subject,
    topic: filters.topic,
    search: filters.search,
    difficulty: filters.difficulty,
    status: filters.status,
    bank: filters.bank,
    needsReview: filters.needsReview,
    pageIndex: filters.pageIndex || 0,
    pageSize: count,
  });
  const result: PaginatedQuestionsResult = {
    questions: res.questions,
    lastDoc: null,
    hasMore: res.hasMore,
  };
  if (isFirstPage) {
    questionsPageCache.set(cacheKey, result);
  }
  return result;
}

export async function saveSubjectPoolQuestion(
  adminEmail: string,
  question: {
    id?: string;
    subject: string;
    topic: string;
    text: string;
    options: [string, string, string, string];
    correct: number;
    explain?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'draft' | 'reviewed' | 'published';
  },
  sourceId?: string
): Promise<string> {
  const targetSource =
    sourceId ||
    (question.id ? parseQuestionCompoundId(question.id).sourceId : getDefaultWriteSource().id);
  const res = await saveMultiSourceQuestion(adminEmail, targetSource, question);
  await logAdminAction(adminEmail, 'save_pool_question', {
    sourceId: res.sourceId,
    questionId: res.compoundId,
    topic: question.topic,
    subject: question.subject,
  });
  return res.compoundId;
}

export async function deletePoolQuestion(
  adminEmail: string,
  subject: string,
  questionId: string
): Promise<void> {
  await deleteMultiSourceQuestion(adminEmail, subject, questionId);
  await logAdminAction(adminEmail, 'delete_pool_question', {
    subject,
    questionId,
  });
}

export async function renamePoolTopic(
  _adminEmail: string,
  subject: string,
  oldTopic: string,
  newTopic: string
): Promise<number> {
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cleanNew = newTopic.trim();

  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const resp = await fetch('/api/questions/batch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      subject: normSub,
      oldTopic,
      newTopic: cleanNew,
    }),
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error || `Failed to rename topic in D1 (HTTP ${resp.status})`);
  }
  const data = await resp.json();
  clearMultiSourceCache();
  clearQuestionsCache();
  return Number(data?.updatedCount ?? 0);
}

export async function moveQuestionsToTopic(
  adminEmail: string,
  subject: string,
  questionIds: string[],
  newTopic: string
): Promise<number> {
  const count = await moveMultiSourceQuestionsToTopic(adminEmail, subject, questionIds, newTopic);
  await logAdminAction(adminEmail, 'move_pool_questions_topic', {
    subject,
    questionCount: count,
    newTopic,
  });
  return count;
}

export async function batchImportPoolQuestions(
  adminEmail: string,
  targetSubject: string,
  defaultTopic: string,
  rawRows: Array<Record<string, unknown>>,
  onProgress?: (done: number, total: number) => void,
  targetSourceId?: string
): Promise<ImportResult> {
  const srcId = targetSourceId || getDefaultWriteSource().id;
  const res = await batchImportMultiSourceQuestions(
    adminEmail,
    srcId,
    targetSubject,
    defaultTopic,
    rawRows,
    onProgress
  );
  await logAdminAction(adminEmail, 'batch_import_pool_questions', {
    sourceId: srcId,
    targetSubject,
    imported: res.imported,
    duplicatesSkipped: res.duplicatesSkipped,
  });
  return res;
}
