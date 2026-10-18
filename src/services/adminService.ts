import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  getDocFromServer,
  addDoc,
  startAfter,
  arrayUnion,
  arrayRemove,
  increment,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
} from '@/types';
import {
  findSubjectSlug,
  findChapterSlug,
  computeContentHash,
  getChaptersForSubject,
} from '@/constants/taxonomy';
import { normalizeCorrectAnswer } from './testEngine';
import { recordCrewPaymentActionServer } from './crewBackend';

// ─── DIAGNOSTIC FIRESTORE ERROR ──────────────────────────────────────────────
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

// ─── AUDIT LOGGING HELPER ────────────────────────────────────────────────────
export async function logAdminAction(
  adminEmail: string,
  action: string,
  details?: Record<string, unknown> | string,
  targetUid?: string,
  targetEmail?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      adminEmail: adminEmail.toLowerCase(),
      action,
      targetUid: targetUid ?? null,
      targetEmail: targetEmail ?? null,
      details: details ?? {},
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('[AdminService] Failed to record audit log:', err);
  }
}

// ─── USER DISPLAY NAME HELPER ───────────────────────────────────────────────
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
    return prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'Student';
}

// ─── ADMIN OVERVIEW STATS ────────────────────────────────────────────────────
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
    // 1. Fetch all referrals
    const refSnap = await getDocs(collection(db, 'referrals'));
    const referralsByAmbassador: Record<string, Array<{ name: string; shortId: string; joinedDate: string; track: string }>> = {};

    refSnap.docs.forEach((d) => {
      const data = d.data();
      const ambUid = data.referrerUid || data.referrerCode;
      if (!ambUid) return;

      if (!referralsByAmbassador[ambUid]) {
        referralsByAmbassador[ambUid] = [];
      }

      let dateStr = 'Recent';
      if (data.signedUpAt?.toDate) {
        dateStr = data.signedUpAt.toDate().toLocaleDateString('en-GB');
      } else if (data.signedUpAt?.seconds) {
        dateStr = new Date(data.signedUpAt.seconds * 1000).toLocaleDateString('en-GB');
      }

      referralsByAmbassador[ambUid].push({
        name: data.referredName || data.referredEmail?.split('@')[0] || 'Student',
        shortId: data.referredShortId || d.id.slice(0, 5),
        joinedDate: dateStr,
        track: data.track || 'FAST / NUST Prep',
      });
    });

    // 2. Fetch users with role 'crew', 'ambassador' or who have referrals
    const ambassadorsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['crew', 'ambassador'])
    );
    const ambSnap = await getDocs(ambassadorsQuery);
    const ambassadorsMap = new Map<string, AdminAmbassadorItem>();

    ambSnap.docs.forEach((d) => {
      const u = d.data() as UserProfile;
      const uid = d.id;
      const shortId = u.shortId || uid.slice(0, 5);
      const brought = referralsByAmbassador[uid] || referralsByAmbassador[shortId] || [];

      ambassadorsMap.set(uid, {
        uid,
        name: getUserDisplayName(u),
        shortId,
        email: u.email || '',
        totalReferrals: Math.max(brought.length, Number(u.ambassadorBonusWeeks || 0)),
        bonusWeeks: Number(u.ambassadorBonusWeeks || brought.length),
        referredStudents: brought,
      });
    });

    // Also include anyone who has referrals in referralsByAmbassador but might have role 'student'
    for (const [key, list] of Object.entries(referralsByAmbassador)) {
      if (!ambassadorsMap.has(key)) {
        try {
          const userDoc = await getDoc(doc(db, 'users', key));
          if (userDoc.exists()) {
            const u = userDoc.data() as UserProfile;
            ambassadorsMap.set(key, {
              uid: key,
              name: getUserDisplayName(u),
              shortId: u.shortId || key.slice(0, 5),
              email: u.email || '',
              totalReferrals: list.length,
              bonusWeeks: Number(u.ambassadorBonusWeeks || list.length),
              referredStudents: list,
            });
          }
        } catch {
          // ignore
        }
      }
    }

    return Array.from(ambassadorsMap.values()).sort((a, b) => b.totalReferrals - a.totalReferrals);
  } catch (err) {
    console.warn('[adminService] fetchAdminAmbassadorsList error:', err);
    return [];
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const startTime = performance.now();
  const questionsCol = collection(db, 'questions');
  const usersCol = collection(db, 'users');
  const attemptsCol = collection(db, 'attempts');
  const crewsCol = collection(db, 'crews');

  // Fast 3.5-second timeout helper for individual queries to eliminate infinite hangs
  const withTimeout = <T>(p: Promise<T>, fallback: T, ms = 3500): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);

  const safeCount = async (targetQuery: Parameters<typeof getCountFromServer>[0]): Promise<number> => {
    try {
      const snap = await withTimeout(getCountFromServer(targetQuery), null);
      if (snap && typeof snap.data === 'function') {
        return snap.data().count;
      }
      return 0;
    } catch (err) {
      console.warn('[AdminService] safeCount query fallback:', err);
      return 0;
    }
  };

  try {
    // 1. Run all aggregate count queries IN PARALLEL with Promise.all
    const [
      usersTotal,
      questionsTotal,
      attemptsTotal,
      crewsTotal,
      ambassadorsTotal,
      pendingCaptainsCount,
      pendingCrewCount,
      pendingPaymentsCount,
      pendingReviewsCount,
      ...subjectCountsList
    ] = await Promise.all([
      safeCount(usersCol),
      safeCount(questionsCol),
      safeCount(attemptsCol),
      safeCount(crewsCol),
      safeCount(query(usersCol, where('role', 'in', ['crew', 'ambassador']))),
      safeCount(query(collection(db, 'captainApplications'), where('status', '==', 'pending'))),
      safeCount(query(collection(db, 'crewApplications'), where('status', '==', 'pending'))),
      safeCount(query(collection(db, 'paymentRequests'), where('status', '==', 'pending'))),
      safeCount(query(collection(db, 'reviews'), where('status', '==', 'pending'))),
      ...CORE_SUBJECTS.map((subj) => safeCount(query(questionsCol, where('subject', '==', subj)))),
    ]);

    const subjectCounts: Record<string, number> = {};
    CORE_SUBJECTS.forEach((subj, idx) => {
      subjectCounts[subj] = subjectCountsList[idx] ?? 0;
    });

    let totalQ = questionsTotal;
    const subjectSum = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
    if (totalQ === 0 && subjectSum > 0) {
      totalQ = subjectSum;
    }

    // Questions solved estimate based on recorded attempts and active streaks
    const totalQuestionsSolved = Math.max(attemptsTotal * 15, usersTotal * 12);

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`%c[AdminService] fetchAdminStats completed in ${elapsed}ms`, 'color: #10b981; font-weight: bold;');

    const result: AdminStats = {
      totalUsers: usersTotal,
      totalQuestions: totalQ,
      totalAttempts: attemptsTotal,
      totalQuestionsSolved,
      totalActiveCrews: Math.max(crewsTotal, 1),
      totalAmbassadors: Math.max(ambassadorsTotal, 1),
      pendingCaptains: pendingCaptainsCount,
      pendingCrew: pendingCrewCount,
      pendingPayments: pendingPaymentsCount,
      pendingReviews: pendingReviewsCount,
      subjectCounts,
    };

    cachedAdminStats = result;
    return result;
  } catch (err) {
    console.warn('[AdminService] Parallel stats fetch failed, returning zeroed stats:', err);
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

// ─── 500+ BALANCED MCQ POOL SEEDER ───────────────────────────────────────────
export async function seedBalancedMCQPool(
  _adminEmail: string,
  _onProgress?: (done: number, total: number) => void
): Promise<{ seeded: number; total: number }> {
  // Questions are seeded/managed in Firestore
  return { seeded: 0, total: 0 };
}

// ─── USER MANAGEMENT & OVERRIDES ─────────────────────────────────────────────
export interface PaginatedUsersResult {
  users: UserProfile[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  queryTimeMs: number;
}

export async function fetchUsersPaginated(options?: {
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  role?: string;
  plan?: string;
}): Promise<PaginatedUsersResult> {
  const startTime = performance.now();
  const ref = collection(db, 'users');
  const count = options?.limitCount ?? 20;
  const queryConstraints: QueryConstraint[] = [];

  if (options?.role && options.role !== 'all') {
    queryConstraints.push(where('role', '==', options.role));
  } else if (options?.plan && options.plan !== 'all') {
    queryConstraints.push(where('plan', '==', options.plan));
  }

  if (options?.startAfterDoc) {
    queryConstraints.push(startAfter(options.startAfterDoc));
  }

  queryConstraints.push(limit(count));

  try {
    const q = query(ref, ...queryConstraints);
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Users list query timed out after 8 seconds')), 8000)
      ),
    ]);

    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;
    const queryTimeMs = Math.round(performance.now() - startTime);

    console.log(`%c[AdminService] fetchUsersPaginated (${users.length} users) in ${queryTimeMs}ms`, 'color: #10b981;');

    return { users, lastDoc, hasMore, queryTimeMs };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    throw new AdminFirestoreError(
      e?.message || 'Failed to fetch users from collection "users". Check Firestore permissions.',
      e?.code || 'users-fetch-error',
      'users',
      'fetchUsersPaginated'
    );
  }
}

// ─── SUPERADMIN CHECK & RESET ALL USERS ──────────────────────────────────────
export function isProtectedSuperAdmin(userOrProfile: { email?: string | null; role?: string | null; uid?: string | null } | null | undefined): boolean {
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
  const usersSnap = await getDocs(collection(db, 'users'));
  const usersToDelete: { uid: string; email: string; displayName?: string | null }[] = [];
  const superadminsKept: { uid: string; email: string; role?: string }[] = [];

  usersSnap.docs.forEach((d) => {
    const data = d.data() as UserProfile;
    const item = {
      uid: d.id,
      email: data.email || 'no-email',
      displayName: data.displayName || data.name,
      role: data.role,
    };

    if (isProtectedSuperAdmin(item)) {
      superadminsKept.push(item);
    } else {
      usersToDelete.push(item);
    }
  });

  return {
    totalUsers: usersSnap.size,
    usersToDelete,
    superadminsKept,
  };
}

export async function executeResetAllUsers(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ deletedUsersCount: number; deletedRecordsCount: number; keptSuperadmins: string[] }> {
  const emailLower = adminEmail.toLowerCase().trim();
  if (emailLower !== 'shsvirtualadmin@gmail.com' && emailLower !== 'support@boardly.cfd') {
    throw new Error('Unauthorized: Only platform superadmin can perform a user reset.');
  }

  const preview = await previewResetUsers();
  const targetUsers = preview.usersToDelete;
  const total = targetUsers.length;

  if (total === 0) {
    return {
      deletedUsersCount: 0,
      deletedRecordsCount: 0,
      keptSuperadmins: preview.superadminsKept.map((s) => s.email),
    };
  }

  let totalDeletedRecords = 0;
  let processedUsers = 0;

  // Process deletions in batches of 400 operations using writeBatch
  let currentBatch = writeBatch(db);
  let batchOps = 0;

  const commitBatchIfNeeded = async (force = false) => {
    if (batchOps >= 400 || (force && batchOps > 0)) {
      await currentBatch.commit();
      totalDeletedRecords += batchOps;
      currentBatch = writeBatch(db);
      batchOps = 0;
    }
  };

  for (const u of targetUsers) {
    const uid = u.uid;

    // 1. Delete users/{uid}
    currentBatch.delete(doc(db, 'users', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 2. Delete streaks/{uid}
    currentBatch.delete(doc(db, 'streaks', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 3. Delete referrals/{uid}
    currentBatch.delete(doc(db, 'referrals', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 4. Delete leaderboard/{uid}
    currentBatch.delete(doc(db, 'leaderboard', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 5. Delete captainApplications/{uid} & crewApplications/{uid}
    currentBatch.delete(doc(db, 'captainApplications', uid));
    batchOps++;
    await commitBatchIfNeeded();

    currentBatch.delete(doc(db, 'crewApplications', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 6. Delete related attempts for this user
    try {
      const attemptsSnap = await getDocs(
        query(collection(db, 'attempts'), where('userId', '==', uid), limit(40))
      );
      for (const aDoc of attemptsSnap.docs) {
        currentBatch.delete(aDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping attempts cleanup for ${uid}:`, e);
    }

    // 7. Delete related paymentRequests for this user
    try {
      const paymentsSnap = await getDocs(
        query(collection(db, 'paymentRequests'), where('userId', '==', uid), limit(20))
      );
      for (const pDoc of paymentsSnap.docs) {
        currentBatch.delete(pDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping payments cleanup for ${uid}:`, e);
    }

    // 8. Delete related reviews for this user
    try {
      const reviewsSnap = await getDocs(
        query(collection(db, 'reviews'), where('userId', '==', uid), limit(20))
      );
      for (const rDoc of reviewsSnap.docs) {
        currentBatch.delete(rDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping reviews cleanup for ${uid}:`, e);
    }

    processedUsers++;
    if (onProgress) {
      onProgress(processedUsers, total);
    }
  }

  // Final batch commit
  await commitBatchIfNeeded(true);

  // Single entry to admin audit trail
  await logAdminAction(
    adminEmail,
    'reset_all_users',
    {
      deletedUsersCount: targetUsers.length,
      deletedRecordsCount: totalDeletedRecords,
      keptSuperadmins: preview.superadminsKept.map((s) => s.email),
    }
  );

  return {
    deletedUsersCount: targetUsers.length,
    deletedRecordsCount: totalDeletedRecords,
    keptSuperadmins: preview.superadminsKept.map((s) => s.email),
  };
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await fetchUsersPaginated({ limitCount: 50 });
  return res.users;
}

export async function updateUserOverride(
  adminEmail: string,
  targetUid: string,
  targetEmail: string,
  updates: Partial<UserProfile>,
  previous: Partial<UserProfile>
): Promise<UserProfile> {
  const ref = doc(db, 'users', targetUid);
  // Ensure no unsupported undefined values reach setDoc
  const safeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      safeUpdates[key] = value;
    }
  }
  await setDoc(ref, safeUpdates, { merge: true });

  // Verify write immediately directly from the server
  let verifiedProfile: UserProfile | null = null;
  try {
    const verifiedSnap = await getDocFromServer(ref);
    if (verifiedSnap.exists()) {
      verifiedProfile = verifiedSnap.data() as UserProfile;
    }
  } catch (verifyErr) {
    console.warn('[AdminService] getDocFromServer verification fallback:', verifyErr);
  }

  await logAdminAction(
    adminEmail,
    'user_override',
    { updates, previous, verified: Boolean(verifiedProfile) },
    targetUid,
    targetEmail
  );

  return verifiedProfile || ({ ...previous, ...updates, uid: targetUid } as UserProfile);
}

export async function deleteUserAccount(
  adminEmail: string,
  targetUid: string,
  targetEmail: string
): Promise<void> {
  if (adminEmail.toLowerCase() !== 'shsvirtualadmin@gmail.com') {
    throw new Error('Only Superadmin (shsvirtualadmin@gmail.com) can delete users.');
  }
  await deleteDoc(doc(db, 'users', targetUid));
  await logAdminAction(adminEmail, 'delete_user_account', { targetUid, targetEmail }, targetUid, targetEmail);
}

export async function backfillMissingDisplayNames(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ updated: number; total: number }> {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(query(usersRef, limit(300)));
  const toUpdate: { uid: string; displayName: string }[] = [];

  for (const d of snap.docs) {
    const data = d.data() as UserProfile;
    const currentName = data.displayName?.trim();
    if (!currentName || currentName === 'Unnamed Student') {
      const derived = getUserDisplayName(data);
      toUpdate.push({ uid: d.id, displayName: derived });
    }
  }

  const batchSize = 50;
  let done = 0;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const chunk = toUpdate.slice(i, i + batchSize);
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.update(doc(db, 'users', item.uid), { displayName: item.displayName });
    }
    await batch.commit();
    done += chunk.length;
    if (onProgress) onProgress(done, toUpdate.length);
  }

  await logAdminAction(adminEmail, 'backfill_missing_display_names', { updatedCount: done });
  return { updated: done, total: toUpdate.length };
}

export async function fetchUserRecentAttempts(
  userId: string,
  limitCount = 5
): Promise<Array<{ id: string; subject?: string; score?: number; totalQuestions?: number; percentage?: number; createdAt?: Timestamp | { seconds: number } | string | null }>> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[AdminService] fetchUserRecentAttempts error:', err);
    return [];
  }
}

export interface PaginatedQuestionsResult {
  questions: Question[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchQuestionsPaginated(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<PaginatedQuestionsResult> {
  const ref = collection(db, 'questions');
  const count = filters.limitCount ?? 50;

  // IMPORTANT: Do NOT combine where('subject', ...) with orderBy(...) to prevent missing composite index failures.
  const queryConstraints: QueryConstraint[] = [];
  if (filters.subject && filters.subject !== 'all') {
    queryConstraints.push(where('subject', '==', filters.subject));
  } else if (filters.university && filters.university !== 'all') {
    queryConstraints.push(where('university', '==', filters.university));
  } else if (filters.difficulty && filters.difficulty !== 'all') {
    queryConstraints.push(where('difficulty', '==', filters.difficulty));
  }

  if (filters.startAfterDoc) {
    queryConstraints.push(startAfter(filters.startAfterDoc));
  }

  queryConstraints.push(limit(count));

  try {
    const q = query(ref, ...queryConstraints);
    const snap = await getDocs(q);
    let questions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));

    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      questions = questions.filter(q =>
        (q.question ?? q.q ?? '').toLowerCase().includes(term) ||
        (q.chapter ?? '').toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term)
      );
    }

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;

    return {
      questions,
      lastDoc: last,
      hasMore,
    };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    throw new AdminFirestoreError(
      e?.message || 'Failed to fetch questions from Firestore collection "questions". Check permissions and indexes.',
      e?.code || 'questions-fetch-error',
      'questions',
      'fetchQuestionsPaginated'
    );
  }
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
    const snap = await getDocFromServer(doc(db, 'questionKeys', questionId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as QuestionKey;
    }
    return null;
  } catch (err) {
    console.warn('[AdminService] fetchQuestionKey warning:', err);
    return null;
  }
}

/**
 * Saves MCQ strictly separating public `questions/{id}` and secret `questionKeys/{id}`.
 * NEVER stores the answer key inside the `questions` collection!
 */
export async function saveQuestion(
  adminEmail: string,
  question: Partial<Question> & {
    correct?: number;
    correctAnswer?: number;
    explain?: string;
    explanation?: string;
  }
): Promise<string> {
  const qId = question.id && !question.id.startsWith('q_custom') ? question.id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const qText = (question.q || question.question || '').trim();
  const rawOpts = question.options && question.options.length >= 4 ? question.options : ['', '', '', ''];
  const options: [string, string, string, string] = [
    rawOpts[0] || '',
    rawOpts[1] || '',
    rawOpts[2] || '',
    rawOpts[3] || '',
  ];

  const subjectSlug = findSubjectSlug(question.subject || 'mathematics') || 'mathematics';
  const chapterSlug = findChapterSlug(subjectSlug, question.chapter || '') || '';
  const difficulty = (question.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';
  const status = (question.status || 'published') as 'draft' | 'reviewed' | 'published';
  const active = question.active !== undefined ? Boolean(question.active) : true;
  const rand = typeof question.rand === 'number' ? question.rand : Math.random();
  const contentHash = await computeContentHash(qText, options);

  // 2. Validate and standardize correct answer
  const rawKey = question.correct !== undefined ? question.correct : question.correctAnswer;
  const resolvedKey = normalizeCorrectAnswer(rawKey, options);
  if (!resolvedKey) {
    throw new Error('Validation failed: A valid correct answer matching one of the options is required.');
  }

  // 1. Public question doc in `questions/{qId}` — strictly NO correct or explain!
  const publicDoc: Record<string, unknown> = {
    id: qId,
    subject: subjectSlug,
    chapter: chapterSlug,
    difficulty,
    q: qText,
    options,
    tags: Array.isArray(question.tags) ? question.tags : ['entrance'],
    status,
    active,
    rand,
    schemaVersion: 1,
    contentHash,
    updatedAt: serverTimestamp(),
    createdBy: adminEmail,
  };

  if (question.source) publicDoc.source = question.source;
  if (question.year) publicDoc.year = question.year;
  if (question.createdAt) publicDoc.createdAt = question.createdAt;
  else publicDoc.createdAt = serverTimestamp();

  await setDoc(doc(db, 'questions', qId), publicDoc, { merge: true });

  // 2. Secret key doc in `questionKeys/{qId}`
  const explainVal = (question.explain || question.explanation || '').trim();

  await setDoc(
    doc(db, 'questionKeys', qId),
    {
      id: qId,
      correct: resolvedKey.correctIndex,
      correctOptionText: resolvedKey.correctText,
      explain: explainVal,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await logAdminAction(adminEmail, 'save_question', {
    questionId: qId,
    subject: subjectSlug,
    chapter: chapterSlug,
  });

  return qId;
}

export async function deleteQuestion(adminEmail: string, questionId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'questions', questionId));
  batch.delete(doc(db, 'questionKeys', questionId));
  await batch.commit();
  await logAdminAction(adminEmail, 'delete_question', { questionId });
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
  };

  try {
    const questionsSnap = await getDocs(query(collection(db, 'questions'), limit(2500)));
    result.totalQuestions = questionsSnap.size;

    const seenHashes = new Set<string>();

    for (const d of questionsSnap.docs) {
      const data = d.data();
      const s = data.subject || 'unknown';
      const c = data.chapter || 'unknown';
      const diff = (data.difficulty || 'medium').toLowerCase();
      const st = (data.status || 'published').toLowerCase();
      const act = data.active !== false;

      result.bySubject[s] = (result.bySubject[s] || 0) + 1;
      result.byChapter[c] = (result.byChapter[c] || 0) + 1;

      if (diff === 'easy') result.byDifficulty.easy++;
      else if (diff === 'hard') result.byDifficulty.hard++;
      else result.byDifficulty.medium++;

      if (st === 'draft') result.byStatus.draft++;
      else if (st === 'reviewed') result.byStatus.reviewed++;
      else result.byStatus.published++;

      if (act) result.activeCount++;
      else result.inactiveCount++;

      // Check if options are valid array
      const opts = Array.isArray(data.options) ? data.options : [];
      if (opts.length < 2) {
        result.invalidCorrectCount++;
      } else if (data.correct === undefined && data.correctAnswer === undefined) {
        // If neither on doc, check if flagged or empty
        if (data.needs_repair) {
          result.invalidCorrectCount++;
        }
      }

      if (data.contentHash) {
        if (seenHashes.has(data.contentHash)) {
          result.duplicatesDetected++;
        } else {
          seenHashes.add(data.contentHash);
        }
      }
    }
  } catch (err) {
    console.warn('[AdminService] fetchBankHealth questions error:', err);
  }

  try {
    const repSnap = await getDocs(
      query(collection(db, 'questionReports'), where('status', '==', 'open'), limit(200))
    );
    result.openReportsCount = repSnap.size;
  } catch (err) {
    console.warn('[AdminService] fetchBankHealth reports error:', err);
  }

  return result;
}

export async function batchUpdateQuestions(
  adminEmail: string,
  questionIds: string[],
  updates: { status?: 'draft' | 'reviewed' | 'published'; active?: boolean; chapter?: string }
): Promise<number> {
  const chunkSize = 400;
  let updated = 0;

  for (let i = 0; i < questionIds.length; i += chunkSize) {
    const chunk = questionIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const qId of chunk) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.active !== undefined) payload.active = updates.active;
      if (updates.chapter !== undefined) payload.chapter = updates.chapter;

      batch.update(doc(db, 'questions', qId), payload);
    }

    await batch.commit();
    updated += chunk.length;
  }

  await logAdminAction(adminEmail, 'batch_update_questions', {
    count: updated,
    updates,
  });

  return updated;
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
  const result: ImportResult = {
    imported: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  // 1. Gather all existing content hashes to prevent duplicates
  const existingHashes = new Set<string>();
  try {
    const existingSnap = await getDocs(query(collection(db, 'questions'), limit(3000)));
    for (const d of existingSnap.docs) {
      const h = d.data().contentHash;
      if (h) existingHashes.add(h);
    }
  } catch (hErr) {
    console.warn('[AdminService] Existing hash gathering notice:', hErr);
  }

  const validItems: Array<{ qId: string; publicDoc: Record<string, unknown>; keyDoc: Record<string, unknown> }> = [];

  for (const item of candidates) {
    const qText = (item.question.q || item.question.question || '').trim();
    const rawOpts = item.question.options || [];
    const options: [string, string, string, string] = [
      rawOpts[0] || '',
      rawOpts[1] || '',
      rawOpts[2] || '',
      rawOpts[3] || '',
    ];

    if (!qText || options.some(o => !o.trim())) {
      result.errors.push(`Row with empty stem or options skipped`);
      continue;
    }

    const cHash = item.question.contentHash || (await computeContentHash(qText, options));

    if (existingHashes.has(cHash)) {
      result.duplicatesSkipped++;
      continue;
    }
    existingHashes.add(cHash);

    const qId = item.question.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subjectSlug = findSubjectSlug(item.question.subject || 'mathematics') || 'mathematics';
    const chapterSlug = findChapterSlug(subjectSlug, item.question.chapter || '') || '';

    const publicDoc: Record<string, unknown> = {
      id: qId,
      subject: subjectSlug,
      chapter: chapterSlug,
      difficulty: (item.question.difficulty || 'medium').toLowerCase(),
      q: qText,
      options,
      tags: Array.isArray(item.question.tags) && item.question.tags.length > 0 ? item.question.tags : ['entrance'],
      status: item.question.status || 'published',
      active: item.question.active !== undefined ? Boolean(item.question.active) : true,
      rand: typeof item.question.rand === 'number' ? item.question.rand : Math.random(),
      schemaVersion: 1,
      contentHash: cHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminEmail,
    };
    if (item.question.source) publicDoc.source = item.question.source;
    if (item.question.year) publicDoc.year = item.question.year;

    const keyDoc: Record<string, unknown> = {
      id: qId,
      correct: typeof item.key.correct === 'number' ? item.key.correct : 0,
      explain: (item.key.explain || '').trim(),
      updatedAt: serverTimestamp(),
    };

    validItems.push({ qId, publicDoc, keyDoc });
  }

  // 2. Commit in batches of 200 items (400 ops: questions + questionKeys)
  const chunkSize = 200;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const entry of chunk) {
      batch.set(doc(db, 'questions', entry.qId), entry.publicDoc);
      batch.set(doc(db, 'questionKeys', entry.qId), entry.keyDoc);
    }

    await batch.commit();
    result.imported += chunk.length;
    if (onProgress) {
      onProgress(result.imported, validItems.length);
    }
  }

  await logAdminAction(adminEmail, 'batch_import_questions', {
    imported: result.imported,
    duplicatesSkipped: result.duplicatesSkipped,
    errorsCount: result.errors.length,
  });

  return result;
}

export async function fetchQuestionReports(): Promise<QuestionReport[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'questionReports'), orderBy('createdAt', 'desc'), limit(100))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionReport));
  } catch (err) {
    console.warn('[AdminService] fetchQuestionReports fallback without orderBy:', err);
    const fallbackSnap = await getDocs(query(collection(db, 'questionReports'), limit(100)));
    return fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionReport));
  }
}

export async function updateQuestionReportStatus(
  adminEmail: string,
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<void> {
  await updateDoc(doc(db, 'questionReports', reportId), {
    status,
    resolvedBy: adminEmail,
    resolvedAt: serverTimestamp(),
  });
  await logAdminAction(adminEmail, 'update_question_report', { reportId, status });
}

// ─── APPLICATION REVIEWS (CAPTAINS & CREW) ───────────────────────────────────
export async function fetchCaptainApplications(statusFilter = 'all'): Promise<CaptainApplication[]> {
  try {
    const ref = collection(db, 'captainApplications');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CaptainApplication));
  } catch (err) {
    console.error('[AdminService] fetchCaptainApplications error:', err);
    return [];
  }
}

export async function fetchCrewApplications(statusFilter = 'all'): Promise<CrewApplication[]> {
  try {
    const ref = collection(db, 'crewApplications');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrewApplication));
  } catch (err) {
    console.error('[AdminService] fetchCrewApplications error:', err);
    return [];
  }
}

export async function approveCaptainApplication(
  adminEmail: string,
  app: CaptainApplication
): Promise<void> {
  const captainCode = `CAP-${app.university.slice(0, 4).toUpperCase()}-${app.userId.slice(0, 4).toUpperCase()}`;

  // 1. Update application doc
  await updateDoc(doc(db, 'captainApplications', app.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });

  // 2. Update user profile
  await setDoc(
    doc(db, 'users', app.userId),
    {
      role: 'captain',
      plan: 'pro',
      isPremium: true,
      premiumSource: 'captain_grant',
    },
    { merge: true }
  );

  // 3. Create or update captain hub record
  await setDoc(
    doc(db, 'captains', app.userId),
    {
      userId: app.userId,
      name: app.name,
      email: app.email,
      university: app.university,
      city: app.city,
      referralCode: captainCode,
      captainCode,
      points: 100,
      activatedReferrals: 0,
      tier: 'Bronze',
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 4. Send notification to user
  await addDoc(collection(db, 'notifications'), {
    userId: app.userId,
    title: 'Campus Captain Approved! 🏆',
    message: `Congratulations ${app.name}! Your application to represent ${app.university} has been approved. Your code is ${captainCode}.`,
    read: false,
    createdAt: serverTimestamp(),
  });

  await logAdminAction(adminEmail, 'approve_captain_application', { appId: app.id, captainCode }, app.userId, app.email);
}

export async function approveCrewApplication(
  adminEmail: string,
  app: CrewApplication
): Promise<void> {
  const crewCode = `CREW-${app.userId.slice(0, 6).toUpperCase()}`;

  // 1. Update application doc
  await updateDoc(doc(db, 'crewApplications', app.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });

  // 2. Update user profile
  await setDoc(
    doc(db, 'users', app.userId),
    {
      role: 'crew',
      plan: 'pro',
      isPremium: true,
      premiumSource: 'crew_grant',
      isCrewMember: true,
      crewStatus: 'active',
      crewReferralCode: crewCode,
      crewStartDate: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Send notification to user
  await addDoc(collection(db, 'notifications'), {
    userId: app.userId,
    title: 'Welcome to Boardly Crew! 🚀',
    message: `Congratulations ${app.name}! You are now an official Boardly Crew Ambassador. Your referral code is ${crewCode}.`,
    read: false,
    createdAt: serverTimestamp(),
  });

  await logAdminAction(adminEmail, 'approve_crew_application', { appId: app.id, crewCode }, app.userId, app.email);
}

export async function rejectApplication(
  adminEmail: string,
  type: 'captain' | 'crew',
  appId: string,
  targetUid: string,
  targetEmail: string,
  reason?: string
): Promise<void> {
  const collectionName = type === 'captain' ? 'captainApplications' : 'crewApplications';
  await updateDoc(doc(db, collectionName, appId), {
    status: 'rejected',
    rejectionReason: reason || 'Application criteria not met at this time.',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  await logAdminAction(
    adminEmail,
    `reject_${type}_application`,
    { appId, reason },
    targetUid,
    targetEmail
  );
}

// ─── PAYMENT UPGRADE REQUESTS ────────────────────────────────────────────────
export async function fetchPaymentRequests(statusFilter = 'all'): Promise<PaymentRequest[]> {
  try {
    const ref = collection(db, 'paymentRequests');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRequest));
  } catch (err) {
    console.error('[AdminService] fetchPaymentRequests error:', err);
    return [];
  }
}

export async function approvePaymentRequest(
  adminEmail: string,
  req: PaymentRequest
): Promise<void> {
  // 1. Update payment request
  await updateDoc(doc(db, 'paymentRequests', req.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });

  // If this is a Large Crew upgrade request, update crew record (never write crew Pro into user's personal subscription)
  if ((req.plan === 'large_crew' || req.crewId) && req.crewId) {
    await recordCrewPaymentActionServer({
      crewId: req.crewId,
      action: 'extend_month',
      adminEmail,
      reason: `Verified ${req.method} transaction ${req.transactionId}`,
      amount: req.amount,
      transactionId: req.transactionId,
    });

    await addDoc(collection(db, 'notifications'), {
      userId: req.userId,
      title: 'Squad Upgraded to Large Crew! 🎉',
      message: `Your payment of PKR ${req.amount} via ${req.method} (TRX: ${req.transactionId}) was verified. Your study squad now has Large Crew status with up to 30 members and Pro sharing for all squad members!`,
      read: false,
      createdAt: serverTimestamp(),
    });

    await logAdminAction(
      adminEmail,
      'approve_crew_payment_request',
      { reqId: req.id, crewId: req.crewId, amount: req.amount, method: req.method, transactionId: req.transactionId },
      req.userId,
      req.userEmail
    );
    return;
  }

  // Otherwise, personal Pro account upgrade: 30 days of Pro access from today
  const durationDays = (req.durationMonths ?? 1) * 30;
  const expiresAt = Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // 2. Upgrade student account
  await setDoc(
    doc(db, 'users', req.userId),
    {
      plan: 'pro',
      isPremium: true,
      premiumSource: req.method || 'payment_request',
      premiumExpiresAt: expiresAt,
      planExpiresAt: expiresAt,
    },
    { merge: true }
  );

  // 3. Send notification
  await addDoc(collection(db, 'notifications'), {
    userId: req.userId,
    title: 'Boardly Pro Activated! 🎉',
    message: `Your payment of PKR ${req.amount} via ${req.method} (TRX: ${req.transactionId}) was verified. You have full access until ${expiresAt.toDate().toLocaleDateString()}.`,
    read: false,
    createdAt: serverTimestamp(),
  });

  await logAdminAction(
    adminEmail,
    'approve_payment_request',
    { reqId: req.id, amount: req.amount, method: req.method, transactionId: req.transactionId },
    req.userId,
    req.userEmail
  );
}

export async function rejectPaymentRequest(
  adminEmail: string,
  reqId: string,
  targetUid: string,
  targetEmail: string,
  reason?: string
): Promise<void> {
  await updateDoc(doc(db, 'paymentRequests', reqId), {
    status: 'rejected',
    rejectionReason: reason || 'Invalid transaction ID or payment not received.',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  await logAdminAction(
    adminEmail,
    'reject_payment_request',
    { reqId, reason },
    targetUid,
    targetEmail
  );
}

// ─── REVIEW MODERATION ───────────────────────────────────────────────────────
export async function fetchReviews(statusFilter = 'all'): Promise<StudentReview[]> {
  try {
    const ref = collection(db, 'reviews');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentReview));
  } catch (err) {
    console.error('[AdminService] fetchReviews error:', err);
    return [];
  }
}

export async function approveReview(adminEmail: string, reviewId: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });
  await logAdminAction(adminEmail, 'approve_review', { reviewId });
}

export async function rejectReview(adminEmail: string, reviewId: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });
  await logAdminAction(adminEmail, 'reject_review', { reviewId });
}

export async function deleteReview(adminEmail: string, reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', reviewId));
  await logAdminAction(adminEmail, 'delete_review', { reviewId });
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export async function fetchAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  try {
    const ref = collection(db, 'auditLogs');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  } catch (err) {
    // If index is not yet built, fall back to simple limit without order
    console.warn('[AdminService] fetchAuditLogs fallback:', err);
    try {
      const snap = await getDocs(query(collection(db, 'auditLogs'), limit(limitCount)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (fallbackErr) {
      console.warn('[AdminService] fetchAuditLogs secondary fallback warning:', fallbackErr);
      return [];
    }
  }
}


export async function fetchUserAttempts(targetUid: string): Promise<Record<string, unknown>[]> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', targetUid),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[AdminService] fetchUserAttempts error:', err);
    return [];
  }
}

// ─── DEDICATED SUBJECT QUESTION POOLS ────────────────────────────────────────
// Generic structure supporting dedicated collections per subject, starting with Mathematics.

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

export const INITIAL_MATHEMATICS_MCQS = [
  {
    topic: 'Calculus & Differentiation',
    text: 'What is the derivative of $f(x) = \\ln(\\sin(x))$ with respect to $x$ for $\\sin(x) > 0$?',
    options: ['$\\cot(x)$', '$\\tan(x)$', '$-\\cot(x)$', '$\\frac{1}{\\sin(x)}$'] as [string, string, string, string],
    correct: 0,
    explain: 'By the chain rule, $\\frac{d}{dx}[\\ln(\\sin(x))] = \\frac{1}{\\sin(x)} \\cdot \\cos(x) = \\cot(x)$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Calculus & Differentiation',
    text: 'The function $f(x) = 2x^3 - 9x^2 + 12x + 5$ has a local maximum at $x$ equal to:',
    options: ['$x = 1$', '$x = 2$', '$x = 3$', '$x = 0$'] as [string, string, string, string],
    correct: 0,
    explain: '$f\'(x) = 6x^2 - 18x + 12 = 6(x-1)(x-2) = 0$. $f\'\'(x) = 12x - 18$. At $x = 1$, $f\'\'(1) = -6 < 0$ (local maximum).',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Integration by Parts & Definite Integrals',
    text: 'Evaluate the definite integral $\\int_{0}^{1} x e^x \\, dx$:',
    options: ['$1$', '$e - 1$', '$e - 2$', '$2$'] as [string, string, string, string],
    correct: 0,
    explain: 'Using integration by parts $\\int u v\' = uv - \\int u\' v$: with $u = x, v = e^x$, $\\int x e^x dx = [x e^x - e^x]_0^1 = (e - e) - (0 - 1) = 1$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Integration by Parts & Definite Integrals',
    text: 'The value of $\\int_{0}^{\\pi/2} \\sin^2(x) \\, dx$ is equal to:',
    options: ['$\\frac{\\pi}{4}$', '$\\frac{\\pi}{2}$', '$1$', '$\\frac{\\pi}{8}$'] as [string, string, string, string],
    correct: 0,
    explain: 'Using $\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}$, $\\int_{0}^{\\pi/2} \\frac{1 - \\cos(2x)}{2} dx = [\\frac{x}{2} - \\frac{\\sin(2x)}{4}]_0^{\\pi/2} = \\frac{\\pi}{4}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Matrices & Determinants',
    text: 'If $A$ is a non-singular square matrix of order $3 \\times 3$ and $|A| = 4$, then $|\\text{adj}(A)|$ is:',
    options: ['$16$', '$64$', '$4$', '$12$'] as [string, string, string, string],
    correct: 0,
    explain: 'For an $n \\times n$ matrix, $|\\text{adj}(A)| = |A|^{n-1}$. Here $n = 3$, so $|\\text{adj}(A)| = 4^{3-1} = 4^2 = 16$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Matrices & Determinants',
    text: 'A square matrix $A$ is called skew-symmetric if and only if:',
    options: ['$A^T = -A$', '$A^T = A$', '$A^{-1} = A^T$', '$A^2 = I$'] as [string, string, string, string],
    correct: 0,
    explain: 'By definition, a matrix $A$ is skew-symmetric if its transpose equals its negative, $A^T = -A$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Trigonometry & Complex Numbers',
    text: 'The modulus and principal argument of the complex number $z = 1 + i\\sqrt{3}$ are:',
    options: ['$r = 2, \\theta = \\frac{\\pi}{3}$', '$r = 4, \\theta = \\frac{\\pi}{6}$', '$r = 2, \\theta = \\frac{\\pi}{6}$', '$r = \\sqrt{2}, \\theta = \\frac{\\pi}{4}$'] as [string, string, string, string],
    correct: 0,
    explain: '$r = \\sqrt{1^2 + (\\sqrt{3})^2} = \\sqrt{4} = 2$. $\\tan(\\theta) = \\frac{\\sqrt{3}}{1} \\implies \\theta = \\frac{\\pi}{3}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Trigonometry & Complex Numbers',
    text: 'The period of the trigonometric function $f(x) = \\tan(3x)$ is:',
    options: ['$\\frac{\\pi}{3}$', '$\\frac{2\\pi}{3}$', '$\\pi$', '$3\\pi$'] as [string, string, string, string],
    correct: 0,
    explain: 'The fundamental period of $\\tan(x)$ is $\\pi$. For $\\tan(kx)$, the period is $\\frac{\\pi}{|k|} = \\frac{\\pi}{3}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Analytic Geometry & Conic Sections',
    text: 'The equation of the tangent to the parabola $y^2 = 4ax$ at the point $(x_1, y_1)$ is:',
    options: ['$y y_1 = 2a(x + x_1)$', '$y y_1 = 4a(x + x_1)$', '$x x_1 + y y_1 = a^2$', '$y - y_1 = 4a(x - x_1)$'] as [string, string, string, string],
    correct: 0,
    explain: 'Differentiating $y^2 = 4ax$ gives $2y \\frac{dy}{dx} = 4a \\implies m = \\frac{2a}{y_1}$. The point-slope form gives $y - y_1 = \\frac{2a}{y_1}(x - x_1) \\implies y y_1 = 2a(x + x_1)$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Analytic Geometry & Conic Sections',
    text: 'The eccentricity $e$ of an ellipse satisfies which of the following conditions?',
    options: ['$0 < e < 1$', '$e = 1$', '$e > 1$', '$e = 0$'] as [string, string, string, string],
    correct: 0,
    explain: 'For an ellipse, the eccentricity strictly satisfies $0 < e < 1$. ($e = 1$ is a parabola, $e > 1$ is a hyperbola, $e = 0$ is a circle).',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Vectors & 3D Geometry',
    text: 'The angle between two vectors $\\vec{a} = 2\\hat{i} + \\hat{j} - \\hat{k}$ and $\\vec{b} = \\hat{i} - \\hat{j} + \\hat{k}$ is:',
    options: ['$\\frac{\\pi}{2}$', '$\\frac{\\pi}{4}$', '$\\frac{\\pi}{3}$', '$0$'] as [string, string, string, string],
    correct: 0,
    explain: '$\\vec{a} \\cdot \\vec{b} = (2)(1) + (1)(-1) + (-1)(1) = 2 - 1 - 1 = 0$. Since dot product is zero, $\\theta = 90^\\circ = \\frac{\\pi}{2}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Vectors & 3D Geometry',
    text: 'If three vectors $\\vec{a}, \\vec{b}, \\vec{c}$ are coplanar, their scalar triple product $[\\vec{a} \\, \\vec{b} \\, \\vec{c}]$ is equal to:',
    options: ['$0$', '$1$', '$\\vec{a} \\times (\\vec{b} \\times \\vec{c})$', 'Non-zero scalar'] as [string, string, string, string],
    correct: 0,
    explain: 'Vectors are coplanar if and only if the volume of the parallelepiped formed by them is zero, so $[\\vec{a} \\, \\vec{b} \\, \\vec{c}] = \\vec{a} \\cdot (\\vec{b} \\times \\vec{c}) = 0$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Sequences, Series & Binomial Theorem',
    text: 'The sum to infinity of the geometric progression $4, \\frac{4}{3}, \\frac{4}{9}, \\frac{4}{27}, \\dots$ is:',
    options: ['$6$', '$8$', '$4$', '$12$'] as [string, string, string, string],
    correct: 0,
    explain: '$a = 4$ and $r = \\frac{1}{3}$. Since $|r| < 1$, $S_\\infty = \\frac{a}{1 - r} = \\frac{4}{1 - 1/3} = \\frac{4}{2/3} = 6$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Sequences, Series & Binomial Theorem',
    text: 'The number of terms in the expansion of $(2x + 3y)^{10}$ is:',
    options: ['$11$', '$10$', '$9$', '$21$'] as [string, string, string, string],
    correct: 0,
    explain: 'The number of terms in the binomial expansion of $(a + b)^n$ is always $n + 1$. For $n = 10$, there are $10 + 1 = 11$ terms.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
];

export async function seedInitialMathPool(adminEmail: string): Promise<number> {
  const collName = getSubjectPoolCollection('mathematics');
  const snap = await getDocs(query(collection(db, collName), limit(5)));
  if (!snap.empty) {
    return 0; // Already seeded
  }

  const batch = writeBatch(db);
  let count = 0;
  for (const item of INITIAL_MATHEMATICS_MCQS) {
    const qId = `math_${Date.now()}_${count}_${Math.random().toString(36).substring(2, 6)}`;
    const cHash = await computeContentHash(item.text, item.options);
    batch.set(doc(db, collName, qId), {
      id: qId,
      subject: 'mathematics',
      topic: item.topic,
      chapter: item.topic,
      text: item.text,
      q: item.text,
      question: item.text,
      options: item.options,
      correct: item.correct,
      correctAnswer: item.correct,
      explain: item.explain,
      explanation: item.explain,
      difficulty: item.difficulty,
      status: item.status,
      active: true,
      rand: Math.random(),
      contentHash: cHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminEmail,
    });
    count++;
  }
  await batch.commit();
  await logAdminAction(adminEmail, 'seed_math_pool', { count });
  return count;
}

// ─── ULTRA-LOW-READ STATS & INDEX SYSTEM ────────────────────────────────────
export interface QuestionCountsDoc {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
  updatedAt?: unknown;
}

// In-memory session caches to eliminate repeated Firestore reads
let cachedQuestionCountsDoc: QuestionCountsDoc | null = null;
let countsDocFetchPromise: Promise<QuestionCountsDoc> | null = null;
const subjectQuestionIndexCache = new Map<string, string[]>();
const questionsPageCache = new Map<string, PaginatedQuestionsResult>();

export function clearQuestionsCache(): void {
  questionsPageCache.clear();
}

/**
 * Fetches or initializes the single lightweight stats document `stats/questionCounts`.
 * Requires exactly ONE document read for the entire session.
 */
export async function getQuestionCountsDoc(): Promise<QuestionCountsDoc> {
  if (cachedQuestionCountsDoc) {
    return cachedQuestionCountsDoc;
  }
  if (countsDocFetchPromise) {
    return countsDocFetchPromise;
  }

  countsDocFetchPromise = (async () => {
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const data = snap.data() as QuestionCountsDoc;
        cachedQuestionCountsDoc = {
          subjectCounts: data.subjectCounts || {},
          topicCounts: data.topicCounts || {},
        };
        return cachedQuestionCountsDoc;
      }

      // Initialize default counts document without reading any questions
      const initSubjects: Record<string, number> = {
        mathematics: 10,
        physics: 0,
        chemistry: 0,
        'computer-science': 0,
        english: 0,
        biology: 0,
        'analytical-reasoning': 0,
      };
      const initTopics: Record<string, Record<string, number>> = {
        mathematics: {
          'Calculus & Differentiation': 4,
          'Integration by Parts & Definite Integrals': 2,
          'Analytic Geometry & Conic Sections': 1,
          'Vectors & 3D Geometry': 2,
          'Sequences, Series & Binomial Theorem': 2,
        },
      };

      const newDoc: QuestionCountsDoc = {
        subjectCounts: initSubjects,
        topicCounts: initTopics,
      };

      cachedQuestionCountsDoc = newDoc;
      setDoc(statsRef, { ...newDoc, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      return cachedQuestionCountsDoc;
    } catch (err) {
      console.warn('[AdminService] getQuestionCountsDoc notice:', err);
      cachedQuestionCountsDoc = {
        subjectCounts: { mathematics: 10 },
        topicCounts: {
          mathematics: {
            'Calculus & Differentiation': 4,
            'Integration by Parts & Definite Integrals': 2,
          },
        },
      };
      return cachedQuestionCountsDoc;
    } finally {
      countsDocFetchPromise = null;
    }
  })();

  return countsDocFetchPromise;
}

/**
 * Reads the small index document listing question IDs for a subject: `stats/questionIndex_{subject}`.
 * Allows picking random IDs without ever reading the whole pool or scanning all docs.
 */
export async function getSubjectQuestionIds(subject: string): Promise<string[]> {
  const norm = subject.toLowerCase().trim();
  if (subjectQuestionIndexCache.has(norm)) {
    return subjectQuestionIndexCache.get(norm)!;
  }

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    const snap = await getDoc(indexRef);
    if (snap.exists()) {
      const data = snap.data();
      const ids: string[] = Array.isArray(data.ids) ? data.ids : [];
      subjectQuestionIndexCache.set(norm, ids);
      return ids;
    }

    // If index doc doesn't exist yet, query existing IDs with small limit
    const targetColl = isSubjectPoolSupported(norm) ? getSubjectPoolCollection(norm) : 'questions';
    const qSnap = await getDocs(
      query(collection(db, targetColl), where('status', '==', 'published'), limit(30))
    );
    const ids = qSnap.docs.map((d) => d.id);
    subjectQuestionIndexCache.set(norm, ids);
    setDoc(indexRef, { subject: norm, ids, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    return ids;
  } catch (err) {
    console.warn(`[Index] Could not fetch question index for ${norm}:`, err);
    return subjectQuestionIndexCache.get(norm) || [];
  }
}

export async function addIdToSubjectIndex(subject: string, id: string | string[]): Promise<void> {
  const norm = subject.toLowerCase().trim();
  const idArray = Array.isArray(id) ? id : [id];
  const current = subjectQuestionIndexCache.get(norm) || [];
  const updated = Array.from(new Set([...current, ...idArray]));
  subjectQuestionIndexCache.set(norm, updated);

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    await setDoc(
      indexRef,
      {
        subject: norm,
        ids: arrayUnion(...idArray),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-fatal
  }
}

export async function removeIdFromSubjectIndex(subject: string, id: string): Promise<void> {
  const norm = subject.toLowerCase().trim();
  const current = subjectQuestionIndexCache.get(norm) || [];
  subjectQuestionIndexCache.set(norm, current.filter((x) => x !== id));

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    await updateDoc(indexRef, {
      ids: arrayRemove(id),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Returns subject counts from the single small stats document `stats/questionCounts`.
 * Does NOT read all questions or perform unpaginated scans.
 */
export async function fetchSubjectPoolCounts(): Promise<Record<string, number>> {
  const docData = await getQuestionCountsDoc();
  return docData.subjectCounts;
}

/**
 * Returns topic counts from the cached stats document.
 * Requires ZERO additional reads.
 */
export async function fetchSubjectTopics(subject: string): Promise<PoolTopicCount[]> {
  const norm = (subject || '').trim().toLowerCase();
  const docData = await getQuestionCountsDoc();
  const subTopics = docData.topicCounts[norm] || {};
  const list: PoolTopicCount[] = [];

  if (Object.keys(subTopics).length === 0) {
    const defaultChapters = getChaptersForSubject(norm);
    defaultChapters.forEach((ch) => {
      list.push({ name: ch.name, count: 0 });
    });
  } else {
    for (const [name, count] of Object.entries(subTopics)) {
      list.push({ name, count });
    }
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads questions in pages of 20 with limit and cursor ("Load more").
 * Caches first page results in-memory for the session so going back and forth does not re-read.
 */
export async function fetchPoolQuestionsPaginated(filters: {
  subject: string;
  topic?: string;
  search?: string;
  difficulty?: string;
  status?: string;
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<PaginatedQuestionsResult> {
  const count = filters.limitCount ?? 20;
  const isFirstPage = !filters.startAfterDoc;
  const cacheKey = `${filters.subject}__${filters.topic || 'all'}__${filters.difficulty || 'all'}__${filters.status || 'all'}__${(filters.search || '').trim().toLowerCase()}`;

  // Session-level in-memory cache check
  if (isFirstPage && questionsPageCache.has(cacheKey)) {
    return questionsPageCache.get(cacheKey)!;
  }

  const isPool = isSubjectPoolSupported(filters.subject);

  if (!isPool) {
    // Fall back to existing bank questions with page size 20
    const res = await fetchQuestionsPaginated({
      search: filters.search,
      subject: filters.subject,
      difficulty: filters.difficulty,
      limitCount: count,
      startAfterDoc: filters.startAfterDoc,
    });
    if (isFirstPage) {
      questionsPageCache.set(cacheKey, res);
    }
    return res;
  }

  const collName = getSubjectPoolCollection(filters.subject);
  const constraints: QueryConstraint[] = [];

  if (filters.topic && filters.topic !== 'all') {
    constraints.push(where('topic', '==', filters.topic));
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    constraints.push(where('difficulty', '==', filters.difficulty.toLowerCase()));
  }
  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status.toLowerCase()));
  }
  if (filters.startAfterDoc) {
    constraints.push(startAfter(filters.startAfterDoc));
  }
  constraints.push(limit(count));

  try {
    const q = query(collection(db, collName), ...constraints);
    const snap = await getDocs(q);

    let questions: Question[] = snap.docs.map((d) => {
      const data = d.data();
      const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
      const text = data.text || data.q || data.question || '';
      return {
        id: d.id,
        ...data,
        subject: filters.subject.toLowerCase(),
        chapter: data.topic || data.chapter || 'general',
        topic: data.topic || data.chapter || 'general',
        difficulty: (data.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
        status: (data.status || 'published').toLowerCase() as 'draft' | 'reviewed' | 'published',
        active: data.active !== false,
        q: text,
        question: text,
        stem: text,
        options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
        tags: Array.isArray(data.tags) ? data.tags : ['entrance'],
        rand: typeof data.rand === 'number' ? data.rand : 0.5,
        schemaVersion: 1,
        contentHash: data.contentHash || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy || '',
        correct: typeof data.correct === 'number' ? data.correct : (typeof data.correctAnswer === 'number' ? data.correctAnswer : 0),
        correctAnswer: typeof data.correctAnswer === 'number' ? data.correctAnswer : (typeof data.correct === 'number' ? data.correct : 0),
        explain: data.explain || data.explanation || '',
        explanation: data.explanation || data.explain || '',
      } as Question;
    });

    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      questions = questions.filter((item) =>
        (item.q || item.question || '').toLowerCase().includes(term) ||
        (item.topic || item.chapter || '').toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.options.some((o) => o.toLowerCase().includes(term))
      );
    }

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;

    const result: PaginatedQuestionsResult = {
      questions,
      lastDoc: last,
      hasMore,
    };

    if (isFirstPage) {
      questionsPageCache.set(cacheKey, result);
    }

    return result;
  } catch (err: unknown) {
    console.warn(`[AdminService] fetchPoolQuestionsPaginated ${collName} notice:`, err);
    throw err;
  }
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
  }
): Promise<string> {
  const normSub = question.subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const qText = (question.text || '').trim();
  const topic = (question.topic || 'General Concepts').trim();
  const cHash = await computeContentHash(qText, question.options);

  // Deterministic document ID based on content hash
  const qId = question.id && !question.id.startsWith('q_custom')
    ? question.id
    : `pool_${normSub}_${cHash.substring(0, 20)}`;

  const isNew = !question.id || question.id.startsWith('q_custom');

  const docData: Record<string, unknown> = {
    id: qId,
    subject: normSub,
    topic,
    chapter: topic,
    text: qText,
    q: qText,
    question: qText,
    options: question.options,
    correct: question.correct,
    correctAnswer: question.correct,
    explain: (question.explain || '').trim(),
    explanation: (question.explain || '').trim(),
    difficulty: question.difficulty,
    status: question.status,
    active: true,
    rand: Math.random(),
    contentHash: cHash,
    updatedAt: serverTimestamp(),
    createdBy: adminEmail,
  };

  await setDoc(doc(db, collName, qId), docData, { merge: true });

  // Update in-memory counts doc
  if (isNew) {
    if (cachedQuestionCountsDoc) {
      cachedQuestionCountsDoc.subjectCounts[normSub] = (cachedQuestionCountsDoc.subjectCounts[normSub] || 0) + 1;
      if (!cachedQuestionCountsDoc.topicCounts[normSub]) cachedQuestionCountsDoc.topicCounts[normSub] = {};
      cachedQuestionCountsDoc.topicCounts[normSub][topic] = (cachedQuestionCountsDoc.topicCounts[normSub][topic] || 0) + 1;
    }
    // Update stats/questionCounts document
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await updateDoc(statsRef, {
        [`subjectCounts.${normSub}`]: increment(1),
        [`topicCounts.${normSub}.${topic}`]: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        if (cachedQuestionCountsDoc) {
          await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
        }
      });
    } catch {
      // Non-fatal
    }

    // Add to subject question index
    await addIdToSubjectIndex(normSub, qId);
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'save_pool_question', {
    pool: collName,
    questionId: qId,
    topic,
    subject: normSub,
  });

  return qId;
}

export async function deletePoolQuestion(
  adminEmail: string,
  subject: string,
  questionId: string
): Promise<void> {
  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  await deleteDoc(doc(db, collName, questionId));

  // Decrement count in stats/questionCounts
  if (cachedQuestionCountsDoc) {
    cachedQuestionCountsDoc.subjectCounts[normSub] = Math.max(0, (cachedQuestionCountsDoc.subjectCounts[normSub] || 1) - 1);
  }
  try {
    const statsRef = doc(db, 'stats', 'questionCounts');
    await updateDoc(statsRef, {
      [`subjectCounts.${normSub}`]: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }

  await removeIdFromSubjectIndex(normSub, questionId);
  clearQuestionsCache();

  await logAdminAction(adminEmail, 'delete_pool_question', {
    pool: collName,
    subject: normSub,
    questionId,
  });
}

export async function renamePoolTopic(
  adminEmail: string,
  subject: string,
  oldTopic: string,
  newTopic: string
): Promise<number> {
  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);

  // Query ONLY questions matching oldTopic with a safe limit of 200 (never read whole collection)
  const q = query(collection(db, collName), where('topic', '==', oldTopic), limit(200));
  const snap = await getDocs(q);

  const cleanNew = newTopic.trim();
  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, {
      topic: cleanNew,
      chapter: cleanNew,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  const count = snap.docs.length;

  // Update in stats/questionCounts
  if (cachedQuestionCountsDoc && cachedQuestionCountsDoc.topicCounts[normSub]) {
    const oldCnt = cachedQuestionCountsDoc.topicCounts[normSub][oldTopic] || count;
    delete cachedQuestionCountsDoc.topicCounts[normSub][oldTopic];
    cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] = (cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] || 0) + oldCnt;
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'rename_pool_topic', {
    pool: collName,
    subject: normSub,
    oldTopic,
    newTopic: cleanNew,
    count,
  });

  return count;
}

export async function moveQuestionsToTopic(
  adminEmail: string,
  subject: string,
  questionIds: string[],
  newTopic: string
): Promise<number> {
  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const cleanNew = newTopic.trim();
  const chunkSize = 400;
  let count = 0;

  for (let i = 0; i < questionIds.length; i += chunkSize) {
    const chunk = questionIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.update(doc(db, collName, id), {
        topic: cleanNew,
        chapter: cleanNew,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    count += chunk.length;
  }

  // Update in stats/questionCounts
  if (cachedQuestionCountsDoc && cachedQuestionCountsDoc.topicCounts[normSub]) {
    cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] = (cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] || 0) + count;
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'move_pool_questions_topic', {
    pool: collName,
    subject: normSub,
    questionCount: count,
    newTopic: cleanNew,
  });

  return count;
}

/**
 * Imports questions using deterministic document IDs derived from question content hashes.
 * Duplicates are detected without reading the pool.
 */
export async function batchImportPoolQuestions(
  adminEmail: string,
  targetSubject: string,
  defaultTopic: string,
  rawRows: Array<Record<string, unknown>>,
  onProgress?: (done: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  const normTargetSub = targetSubject.toLowerCase().trim();

  // 1. Fetch existing question IDs from the small index doc (ZERO reads of questions collection)
  const existingIds = await getSubjectQuestionIds(normTargetSub);
  const existingIdSet = new Set(existingIds);
  const newlyAddedIds: string[] = [];
  const topicCountsAdded: Record<string, number> = {};

  const validItems: Array<{ qId: string; docData: Record<string, unknown> }> = [];

  for (const row of rawRows) {
    const rowSub = (row.subject ? String(row.subject) : normTargetSub).trim().toLowerCase();
    const rowTopic = (row.topic || row.chapter ? String(row.topic || row.chapter) : defaultTopic).trim();
    const qText = (row.text || row.q || row.question || row.stem ? String(row.text || row.q || row.question || row.stem) : '').trim();

    let options: [string, string, string, string] = ['', '', '', ''];
    if (Array.isArray(row.options) && row.options.length >= 4) {
      options = [String(row.options[0] || ''), String(row.options[1] || ''), String(row.options[2] || ''), String(row.options[3] || '')];
    } else {
      const optA = String(row.optionA || row.option_a || row.opt1 || row.a || '').trim();
      const optB = String(row.optionB || row.option_b || row.opt2 || row.b || '').trim();
      const optC = String(row.optionC || row.option_c || row.opt3 || row.c || '').trim();
      const optD = String(row.optionD || row.option_d || row.opt4 || row.d || '').trim();
      options = [optA, optB, optC, optD];
    }

    if (!qText || options.some((o) => !o.trim())) {
      result.errors.push('Row skipped due to empty stem or options.');
      continue;
    }

    const cHash = await computeContentHash(qText, options);
    // Deterministic document ID derived from question text hash
    const qId = `pool_${rowSub}_${cHash.substring(0, 20)}`;

    if (existingIdSet.has(qId)) {
      result.duplicatesSkipped++;
      continue;
    }
    existingIdSet.add(qId);
    newlyAddedIds.push(qId);
    topicCountsAdded[rowTopic] = (topicCountsAdded[rowTopic] || 0) + 1;

    // Resolve correct answer
    const rawCorrect = row.correct !== undefined ? row.correct : (row.correctAnswer !== undefined ? row.correctAnswer : row.answer);
    const resolved = normalizeCorrectAnswer(rawCorrect, options);
    const correctIdx = resolved ? resolved.correctIndex : 0;

    const explain = String(row.explain || row.explanation || '').trim();
    const diff = (String(row.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard');
    const status = (String(row.status || 'published').toLowerCase() as 'draft' | 'reviewed' | 'published');

    validItems.push({
      qId,
      docData: {
        id: qId,
        subject: rowSub,
        topic: rowTopic,
        chapter: rowTopic,
        text: qText,
        q: qText,
        question: qText,
        options,
        correct: correctIdx,
        correctAnswer: correctIdx,
        explain,
        explanation: explain,
        difficulty: diff,
        status,
        active: true,
        rand: Math.random(),
        contentHash: cHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminEmail,
      },
    });
  }

  // Batch insert
  const chunkSize = 400;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const targetColl = getSubjectPoolCollection(String(item.docData.subject));
      batch.set(doc(db, targetColl, item.qId), item.docData);
    }
    await batch.commit();
    result.imported += chunk.length;
    if (onProgress) onProgress(result.imported, validItems.length);
  }

  // Update question index and counts document in stats
  if (result.imported > 0) {
    await addIdToSubjectIndex(normTargetSub, newlyAddedIds);

    if (cachedQuestionCountsDoc) {
      cachedQuestionCountsDoc.subjectCounts[normTargetSub] = (cachedQuestionCountsDoc.subjectCounts[normTargetSub] || 0) + result.imported;
      if (!cachedQuestionCountsDoc.topicCounts[normTargetSub]) cachedQuestionCountsDoc.topicCounts[normTargetSub] = {};
      for (const [top, cnt] of Object.entries(topicCountsAdded)) {
        cachedQuestionCountsDoc.topicCounts[normTargetSub][top] = (cachedQuestionCountsDoc.topicCounts[normTargetSub][top] || 0) + cnt;
      }
    }
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'batch_import_pool_questions', {
    targetSubject: normTargetSub,
    imported: result.imported,
    duplicatesSkipped: result.duplicatesSkipped,
  });

  return result;
}

