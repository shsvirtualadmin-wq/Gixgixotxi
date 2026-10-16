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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  UserProfile,
  Question,
  AuditLog,
  PaymentRequest,
  StudentReview,
  CaptainApplication,
  CrewApplication,
} from '@/types';
import { BALANCED_500_QUESTIONS } from '@/data/seedBalancedPool';

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

// ─── ADMIN OVERVIEW STATS ────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalAttempts: number;
  pendingCaptains: number;
  pendingCrew: number;
  pendingPayments: number;
  pendingReviews: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [
      usersCount,
      questionsCount,
      attemptsCount,
      pendingCaptainsSnap,
      pendingCrewSnap,
      pendingPaymentsSnap,
      pendingReviewsSnap,
    ] = await Promise.all([
      getCountFromServer(collection(db, 'users')).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, 'questions')).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, 'attempts')).catch(() => ({ data: () => ({ count: 0 }) })),
      getDocs(query(collection(db, 'captainApplications'), where('status', '==', 'pending'), limit(100))).catch(() => ({ size: 0 })),
      getDocs(query(collection(db, 'crewApplications'), where('status', '==', 'pending'), limit(100))).catch(() => ({ size: 0 })),
      getDocs(query(collection(db, 'paymentRequests'), where('status', '==', 'pending'), limit(100))).catch(() => ({ size: 0 })),
      getDocs(query(collection(db, 'reviews'), where('status', '==', 'pending'), limit(100))).catch(() => ({ size: 0 })),
    ]);

    return {
      totalUsers: usersCount.data().count,
      totalQuestions: questionsCount.data().count,
      totalAttempts: attemptsCount.data().count,
      pendingCaptains: pendingCaptainsSnap.size,
      pendingCrew: pendingCrewSnap.size,
      pendingPayments: pendingPaymentsSnap.size,
      pendingReviews: pendingReviewsSnap.size,
    };
  } catch (err) {
    console.error('[AdminService] Error loading admin stats:', err);
    return {
      totalUsers: 0,
      totalQuestions: 0,
      totalAttempts: 0,
      pendingCaptains: 0,
      pendingCrew: 0,
      pendingPayments: 0,
      pendingReviews: 0,
    };
  }
}

// ─── 500+ BALANCED MCQ POOL SEEDER ───────────────────────────────────────────
export async function seedBalancedMCQPool(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ seeded: number; total: number }> {
  const total = BALANCED_500_QUESTIONS.length;
  const batchSize = 50;
  let done = 0;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = BALANCED_500_QUESTIONS.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const q of chunk) {
      const ref = doc(db, 'questions', q.id);
      batch.set(ref, q, { merge: true });
    }

    await batch.commit();
    done += chunk.length;
    if (onProgress) {
      onProgress(done, total);
    }
  }

  await logAdminAction(
    adminEmail,
    'seed_balanced_mcq_pool',
    { seededCount: total, sampleIds: ['seed_balanced_001', 'seed_balanced_500'] }
  );

  return { seeded: done, total };
}

// ─── USER MANAGEMENT & OVERRIDES ─────────────────────────────────────────────
export async function fetchUsers(
  searchTerm?: string,
  roleFilter?: string,
  planFilter?: string,
  limitCount = 100
): Promise<UserProfile[]> {
  try {
    const ref = collection(db, 'users');
    let q = query(ref, limit(limitCount));

    if (roleFilter && roleFilter !== 'all') {
      q = query(ref, where('role', '==', roleFilter), limit(limitCount));
    } else if (planFilter && planFilter !== 'all') {
      q = query(ref, where('plan', '==', planFilter), limit(limitCount));
    }

    const snap = await getDocs(q);
    let users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

    if (searchTerm && searchTerm.trim()) {
      const st = searchTerm.toLowerCase().trim();
      users = users.filter(u =>
        u.email?.toLowerCase().includes(st) ||
        u.displayName?.toLowerCase().includes(st) ||
        u.uid.toLowerCase().includes(st)
      );
    }

    return users;
  } catch (err) {
    console.error('[AdminService] fetchUsers error:', err);
    return [];
  }
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

// ─── QUESTION BANK CRUD ──────────────────────────────────────────────────────
export async function fetchQuestions(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
}): Promise<Question[]> {
  try {
    const ref = collection(db, 'questions');
    let q = query(ref, limit(filters.limitCount ?? 100));

    if (filters.subject && filters.subject !== 'all') {
      q = query(ref, where('subject', '==', filters.subject), limit(filters.limitCount ?? 100));
    } else if (filters.university && filters.university !== 'all') {
      q = query(ref, where('university', '==', filters.university), limit(filters.limitCount ?? 100));
    } else if (filters.difficulty && filters.difficulty !== 'all') {
      q = query(ref, where('difficulty', '==', filters.difficulty), limit(filters.limitCount ?? 100));
    }

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

    return questions;
  } catch (err) {
    console.error('[AdminService] fetchQuestions error:', err);
    return [];
  }
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
    const snap = await getDocs(query(collection(db, 'auditLogs'), limit(limitCount)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  }
}

export async function deleteUserAccount(
  adminEmail: string,
  targetUid: string,
  targetEmail?: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', targetUid));
  await logAdminAction(adminEmail, 'delete_user_account', { targetUid }, targetUid, targetEmail);
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
