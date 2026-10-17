import {
  collection,
  doc,
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
  addDoc,
  startAfter,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';
import type {
  UserProfile,
  Question,
  AuditLog,
  PaymentRequest,
  StudentReview,
  CaptainApplication,
  CrewApplication,
} from '@/types';

// ─── DIAGNOSTIC FIRESTORE ERROR ──────────────────────────────────────────────
export class AdminFirestoreError extends Error {
  code: string;
  collection: string;
  projectId: string;
  operation: string;

  constructor(message: string, code: string, collection: string, operation: string) {
    super(message);
    this.name = 'AdminFirestoreError';
    this.code = code;
    this.collection = collection;
    this.projectId = firebaseConfig.projectId || 'gen-lang-client-0365509316';
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
  pendingCaptains: number;
  pendingCrew: number;
  pendingPayments: number;
  pendingReviews: number;
  subjectCounts: Record<string, number>;
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

export async function fetchAdminStats(): Promise<AdminStats> {
  const questionsCol = collection(db, 'questions');
  const usersCol = collection(db, 'users');
  const attemptsCol = collection(db, 'attempts');

  let usersTotal = 0;
  let questionsTotal = 0;
  let attemptsTotal = 0;

  try {
    const snap = await getCountFromServer(usersCol);
    usersTotal = snap.data().count;
  } catch (err: unknown) {
    console.warn('[AdminService] getCountFromServer(users) warning:', err);
    try {
      const snap = await getDocs(query(usersCol, limit(100)));
      usersTotal = snap.size;
    } catch (fallbackErr) {
      console.warn('[AdminService] Fallback getDocs(users) failed:', fallbackErr);
      usersTotal = 0;
    }
  }

  try {
    const snap = await getCountFromServer(questionsCol);
    questionsTotal = snap.data().count;
  } catch (err: unknown) {
    console.warn('[AdminService] getCountFromServer(questions) warning:', err);
    try {
      const snap = await getDocs(query(questionsCol, limit(100)));
      questionsTotal = snap.size;
    } catch (fallbackErr) {
      console.warn('[AdminService] Fallback getDocs(questions) failed:', fallbackErr);
      questionsTotal = 0;
    }
  }

  try {
    const snap = await getCountFromServer(attemptsCol);
    attemptsTotal = snap.data().count;
  } catch (err: unknown) {
    console.warn('[AdminService] Attempts count warning:', err);
    attemptsTotal = 0;
  }

  const [
    pendingCaptainsSnap,
    pendingCrewSnap,
    pendingPaymentsSnap,
    pendingReviewsSnap,
  ] = await Promise.all([
    getDocs(query(collection(db, 'captainApplications'), limit(100))).catch(() => ({ docs: [], size: 0 })),
    getDocs(query(collection(db, 'crewApplications'), limit(100))).catch(() => ({ docs: [], size: 0 })),
    getDocs(query(collection(db, 'paymentRequests'), limit(100))).catch(() => ({ docs: [], size: 0 })),
    getDocs(query(collection(db, 'reviews'), limit(100))).catch(() => ({ docs: [], size: 0 })),
  ]);

  const pendingCaptainsCount = pendingCaptainsSnap.docs
    ? pendingCaptainsSnap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data()?.status === 'pending').length
    : pendingCaptainsSnap.size;
  const pendingCrewCount = pendingCrewSnap.docs
    ? pendingCrewSnap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data()?.status === 'pending').length
    : pendingCrewSnap.size;
  const pendingPaymentsCount = pendingPaymentsSnap.docs
    ? pendingPaymentsSnap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data()?.status === 'pending').length
    : pendingPaymentsSnap.size;
  const pendingReviewsCount = pendingReviewsSnap.docs
    ? pendingReviewsSnap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data()?.status === 'pending').length
    : pendingReviewsSnap.size;

  // Query subject counts in parallel using getCountFromServer per subject
  const subjectCounts: Record<string, number> = {};
  await Promise.all(
    CORE_SUBJECTS.map(async (subj) => {
      try {
        const snap = await getCountFromServer(query(questionsCol, where('subject', '==', subj)));
        subjectCounts[subj] = snap.data().count;
      } catch (err: unknown) {
        console.warn(`[AdminService] Subject count query for ${subj}:`, err);
        subjectCounts[subj] = 0;
      }
    })
  );

  let totalQ = questionsTotal;
  const subjectSum = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
  if (totalQ === 0 && subjectSum > 0) {
    totalQ = subjectSum;
  }

  return {
    totalUsers: usersTotal,
    totalQuestions: totalQ,
    totalAttempts: attemptsTotal,
    pendingCaptains: pendingCaptainsCount,
    pendingCrew: pendingCrewCount,
    pendingPayments: pendingPaymentsCount,
    pendingReviews: pendingReviewsCount,
    subjectCounts,
  };
}

// ─── 500+ BALANCED MCQ POOL SEEDER ───────────────────────────────────────────
export async function seedBalancedMCQPool(
  _adminEmail: string,
  _onProgress?: (done: number, total: number) => void
): Promise<{ seeded: number; total: number }> {
  // Disabled per Task B - questions are loaded dynamically from Firestore without hardcoded seeds
  return { seeded: 0, total: 0 };
}

// ─── USER MANAGEMENT & OVERRIDES ─────────────────────────────────────────────
export interface PaginatedUsersResult {
  users: UserProfile[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchUsersPaginated(options?: {
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  role?: string;
  plan?: string;
}): Promise<PaginatedUsersResult> {
  const ref = collection(db, 'users');
  const count = options?.limitCount ?? 50;
  const queryConstraints: QueryConstraint[] = [];

  // Note: Never combine where() with orderBy() to prevent missing composite index failures. Sort client-side.
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
    const snap = await getDocs(q);
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;

    return { users, lastDoc, hasMore };
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
): Promise<void> {
  const ref = doc(db, 'users', targetUid);
  await setDoc(ref, updates, { merge: true });

  await logAdminAction(
    adminEmail,
    'user_override',
    { updates, previous },
    targetUid,
    targetEmail
  );
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

export async function saveQuestion(adminEmail: string, question: Question): Promise<void> {
  const qId = question.id || `q_custom_${Date.now()}`;
  const payload = {
    ...question,
    id: qId,
    q: question.question || question.q || '',
    question: question.question || question.q || '',
    correct: question.correctAnswer ?? question.correct ?? 0,
    correctAnswer: question.correctAnswer ?? question.correct ?? 0,
    explain: question.explanation || question.explain || '',
    explanation: question.explanation || question.explain || '',
    mathChecked: true,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'questions', qId), payload, { merge: true });
  await logAdminAction(adminEmail, 'save_question', { questionId: qId, subject: question.subject });
}

export async function deleteQuestion(adminEmail: string, questionId: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', questionId));
  await logAdminAction(adminEmail, 'delete_question', { questionId });
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
  // 30 days of Pro access from today
  const durationDays = (req.durationMonths ?? 1) * 30;
  const expiresAt = Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // 1. Update payment request
  await updateDoc(doc(db, 'paymentRequests', req.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });

  // 2. Upgrade student account
  await setDoc(
    doc(db, 'users', req.userId),
    {
      plan: 'pro',
      isPremium: true,
      premiumSource: req.method || 'payment_request',
      premiumExpiresAt: expiresAt,
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
