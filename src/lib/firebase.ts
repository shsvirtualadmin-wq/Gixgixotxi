import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDocFromServer,
  getCountFromServer,
  runTransaction,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import firebaseAppletConfig from '../../firebase-applet-config.json';
import { normalizePlanId, PlanType } from '../data/planLimits';

// Firebase configuration from applet config and environment variables
export const firebaseConfig = {
  apiKey: "AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs",
  authDomain: "auth.boardly.cfd",
  projectId: "gen-lang-client-0365509316",
  storageBucket: "gen-lang-client-0365509316.firebasestorage.app",
  messagingSenderId: "556734245207",
  appId: "1:556734245207:web:4797f3915b424209b03612",
  firestoreDatabaseId: "ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712",
};

// Log Firebase environment and connection parameters in development
if (import.meta.env.DEV || typeof window !== 'undefined') {
  console.log('[Boardly Firebase] Initializing Firebase with:');
  console.log(' - Project ID:', firebaseConfig.projectId);
  console.log(' - Auth Domain:', firebaseConfig.authDomain);
  console.log(' - Named Firestore DB:', firebaseConfig.firestoreDatabaseId);
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with browser local persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Boardly Auth] Persistence error:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Helper for resilient Google sign-in with popup fallback
export async function performGoogleSignIn(): Promise<any> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (popupErr: any) {
    console.warn('[Boardly Auth] Popup failed, checking fallback:', popupErr);
    if (
      popupErr?.code === 'auth/popup-blocked' ||
      popupErr?.code === 'auth/cancelled-popup-request' ||
      popupErr?.code === 'auth/popup-closed-by-user' ||
      popupErr?.message?.includes('popup')
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        throw new Error('Allow pop-ups for this site to sign in with Google.');
      }
    }
    throw popupErr;
  }
}

// Initialize Firestore NAMED Database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Error handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('[Boardly Firestore Permission/Operation Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Named Firestore
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'connection_test'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Boardly Firestore] Client offline notice: running in local cached mode.');
    } else if (error?.code === 'permission-denied') {
      console.info('[Boardly Firestore] Connection active to named database', firebaseConfig.firestoreDatabaseId);
    }
  }
}
testFirestoreConnection();

export type UserRole = 'student' | 'organizer' | 'captain' | 'admin';

export interface StudentUserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  plan: PlanType;
  role: UserRole;
  roles?: UserRole[];
  createdAt: string;
  updatedAt?: string;
  termsAcceptedAt?: string;
  termsVersion?: string;
  referralSource?: string;
  referredBy?: string;
  onboardingCompleted: boolean;
  onboardingComplete?: boolean;
  testTrack?: string;
  targetUniversityId?: string;
  targetExamDate?: string;
  targetExamDaysLeft?: number;
  weakSubjects?: string[];
  testsUsedToday?: number;
  boardyQuestionsUsedToday?: number;
  lastUsageDate?: string;
  streakDays?: number;
  streak?: number;
  testHistory?: StoredTestAttempt[];
  testsLimit?: number;
  boardyLimit?: number;
  points?: number;
  status?: 'active' | 'suspended' | 'disabled';
}

export interface StoredTestAttempt {
  id?: string;
  userId: string;
  title: string;
  testType: 'sprint' | 'university_paper' | 'onboarding_diagnostic' | 'custom' | 'event';
  universityId?: string;
  subject?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  percentage: number;
  timeSpentSeconds: number;
  createdAt: string;
  topicBreakdown?: Record<string, { correct: number; total: number }>;
}

export interface StoredReview {
  id?: string;
  uid: string;
  name: string;
  nameDisplayChoice?: 'first_initial' | 'first_only' | 'anonymous';
  rating: number;
  title?: string;
  text: string;
  exam?: string;
  city?: string;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isVerifiedStudent?: boolean;
  createdAt: string;
  updatedAt?: string;
  moderatedBy?: string;
}

export interface StoredPaymentRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: 'pro' | 'premium';
  durationMonths: number;
  amountPkr: number;
  paymentMethod: 'bank_transfer' | 'jazzcash' | 'easypaisa';
  proofUrl?: string;
  transactionId?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface StoredAuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface StoredAppConfig {
  showPlaceholders: boolean;
  placeholderTarget: number;
  boardyEnabled: boolean;
  eventsEnabled: boolean;
  maintenanceMode: boolean;
  admins: string[];
}

/**
 * Reads users/{uid} safely from Named Firestore.
 * Normalizes legacy plans ('starter' -> 'free', 'all_access' -> 'premium')
 */
export async function fetchUserProfile(uid: string): Promise<StudentUserProfile | null> {
  const userPath = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }
    const rawData = snap.data();
    const normalizedPlan = normalizePlanId(rawData.plan);
    const plan = (rawData.plan || 'starter') as PlanType;
    const normalizedRole = (rawData.role || 'student') as UserRole;
    const roles: UserRole[] = Array.isArray(rawData.roles) && rawData.roles.length > 0
      ? rawData.roles
      : [normalizedRole];

    const profile: StudentUserProfile = {
      ...rawData,
      uid,
      plan,
      role: normalizedRole,
      roles,
      streak: typeof rawData.streak === 'number' ? rawData.streak : (typeof rawData.streakDays === 'number' ? rawData.streakDays : 0),
      streakDays: typeof rawData.streak === 'number' ? rawData.streak : (typeof rawData.streakDays === 'number' ? rawData.streakDays : 0),
      testHistory: Array.isArray(rawData.testHistory) ? rawData.testHistory : [],
      testsUsedToday: typeof rawData.testsUsedToday === 'number' ? rawData.testsUsedToday : 0,
      boardyQuestionsUsedToday: typeof rawData.boardyQuestionsUsedToday === 'number' ? rawData.boardyQuestionsUsedToday : 0,
      name: rawData.name || 'Student',
      email: rawData.email || '',
      onboardingCompleted: Boolean(rawData.onboardingCompleted || rawData.onboardingComplete),
      onboardingComplete: Boolean(rawData.onboardingCompleted || rawData.onboardingComplete),
      createdAt: rawData.createdAt || new Date().toISOString(),
    };

    return profile;
  } catch (err: any) {
    console.warn('[Boardly Firebase] fetchUserProfile error, falling back to cache:', err);
    try {
      const cached = localStorage.getItem(`boardly_cached_profile_${uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }
}

/**
 * Creates user profile document ONCE with merge so a returning user is never overwritten.
 */
export async function createInitialUserDoc(
  uid: string,
  initialData: Partial<StudentUserProfile>
): Promise<StudentUserProfile> {
  const userRef = doc(db, 'users', uid);
  const nowStr = new Date().toISOString();
  const role = initialData.role || 'student';
  const plan = (initialData.plan || 'starter') as PlanType;
  const fallbackProfile: StudentUserProfile = {
    uid,
    name: initialData.name || 'Student',
    email: initialData.email || '',
    phone: initialData.phone || '',
    plan,
    role,
    roles: [role],
    createdAt: nowStr,
    termsAcceptedAt: nowStr,
    termsVersion: '2026.1',
    onboardingCompleted: false,
    onboardingComplete: false,
    testsUsedToday: 0,
    boardyQuestionsUsedToday: 0,
    lastUsageDate: nowStr.slice(0, 10),
    streak: 0,
    streakDays: 0,
    testHistory: [],
    status: 'active',
    ...initialData,
  };

  try {
    let resultProfile: StudentUserProfile | null = null;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(userRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        resultProfile = {
          ...existingData,
          uid,
          plan: normalizePlanId(existingData.plan),
          role: (existingData.role || 'student') as UserRole,
          roles: existingData.roles || [(existingData.role || 'student') as UserRole],
        } as StudentUserProfile;
      } else {
        transaction.set(userRef, fallbackProfile, { merge: true });
        resultProfile = fallbackProfile;
      }
    });

    if (resultProfile) {
      try {
        localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify(resultProfile));
      } catch {}
      return resultProfile;
    }
  } catch (err: any) {
    console.warn('[Boardly Firebase] Transaction in createInitialUserDoc failed, attempting setDoc fallback:', err);
    try {
      await setDoc(userRef, fallbackProfile, { merge: true });
      localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify(fallbackProfile));
      return fallbackProfile;
    } catch (setErr) {
      console.warn('[Boardly Firebase] Fallback setDoc also failed, returning local session profile:', setErr);
      try {
        localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify(fallbackProfile));
      } catch {}
      return fallbackProfile;
    }
  }

  return fallbackProfile;
}

/**
 * Updates user profile in Firestore
 */
export async function saveUserProfile(uid: string, fields: Partial<StudentUserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userPath = `users/${uid}`;
  try {
    const cleanFields: Record<string, any> = {
      ...fields,
      uid,
      updatedAt: new Date().toISOString(),
    };
    if (fields.onboardingCompleted !== undefined) {
      cleanFields.onboardingCompleted = fields.onboardingCompleted;
      cleanFields.onboardingComplete = fields.onboardingCompleted;
    }
    // Remove any undefined properties
    Object.keys(cleanFields).forEach((key) => {
      if (cleanFields[key] === undefined) {
        delete cleanFields[key];
      }
    });

    try {
      await updateDoc(userRef, cleanFields);
    } catch (updateErr: any) {
      // If doc is not found, fallback to setDoc with merge
      if (
        updateErr?.code === 'not-found' ||
        updateErr?.message?.includes('No document to update') ||
        updateErr?.message?.includes('NOT_FOUND')
      ) {
        const fallbackDoc: Record<string, any> = {
          uid,
          name: auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : 'Student'),
          email: auth.currentUser?.email || '',
          plan: 'free',
          role: 'student',
          roles: ['student'],
          status: 'active',
          createdAt: new Date().toISOString(),
          ...cleanFields,
        };
        await setDoc(userRef, fallbackDoc, { merge: true });
      } else {
        throw updateErr;
      }
    }

    try {
      const existingStr = localStorage.getItem(`boardly_cached_profile_${uid}`);
      const existing = existingStr ? JSON.parse(existingStr) : {};
      localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify({ ...existing, ...cleanFields }));
    } catch {}
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

/**
 * Deletes user profile document from Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userPath = `users/${uid}`;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(userRef);
    try {
      localStorage.removeItem(`boardly_cached_profile_${uid}`);
    } catch {}
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, userPath);
  }
}

/**
 * Fetches all students with pagination and createdAt desc ordering
 */
export async function fetchAllUsersPaginated(
  pageSize = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ students: StudentUserProfile[]; lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const usersPath = 'users';
  try {
    const usersCol = collection(db, 'users');
    let snap;
    try {
      let q = query(usersCol, orderBy('createdAt', 'desc'), limit(pageSize));
      if (lastDoc) {
        q = query(usersCol, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      }
      snap = await getDocs(q);
    } catch (orderErr) {
      console.warn('[Boardly Firebase] Ordered query failed, falling back to simple limit query:', orderErr);
      const fallbackQ = query(usersCol, limit(pageSize));
      snap = await getDocs(fallbackQ);
    }

    const students: StudentUserProfile[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        uid: d.id,
        plan: normalizePlanId(data.plan),
        role: (data.role || 'student') as UserRole,
        roles: data.roles || [(data.role || 'student') as UserRole],
        name: data.name || (data.email ? data.email.split('@')[0] : 'Student'),
        email: data.email || '',
        createdAt: data.createdAt || new Date(0).toISOString(),
        onboardingCompleted: Boolean(data.onboardingCompleted),
        status: data.status || 'active',
      } as StudentUserProfile;
    });

    // In case fallback query was used, sort in-memory
    students.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const lastVisibleDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { students, lastVisibleDoc };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, usersPath);
  }
}

/**
 * Gets total student count via count aggregation query
 */
export async function getUserCountTotal(): Promise<number> {
  const usersPath = 'users';
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCol);
    return snapshot.data().count;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, usersPath);
  }
}

/**
 * Test attempts logging
 */
export async function logTestAttempt(attempt: Omit<StoredTestAttempt, 'createdAt'>): Promise<string> {
  const collPath = `users/${attempt.userId}/testAttempts`;
  const coll = collection(db, 'users', attempt.userId, 'testAttempts');
  const nowStr = new Date().toISOString();
  let id = `att_${Date.now()}`;
  try {
    const res = await addDoc(coll, {
      ...attempt,
      createdAt: nowStr,
    });
    id = res.id;
  } catch (err: any) {
    console.warn('[Boardly Firebase] logTestAttempt warning:', err);
  }

  // Also append to users/{userId}.testHistory array so both subcollection and array stay in sync
  try {
    const userRef = doc(db, 'users', attempt.userId);
    const newAttemptItem: StoredTestAttempt = { id, ...attempt, createdAt: nowStr };
    const { arrayUnion } = await import('firebase/firestore');
    await updateDoc(userRef, {
      testHistory: arrayUnion(newAttemptItem),
      updatedAt: nowStr,
    });
  } catch (docErr) {
    // Non-fatal if user doc doesn't exist yet or subcollection is primary
  }

  if (typeof window !== 'undefined') {
    try {
      const cacheKey = `boardly_attempts_${attempt.userId}`;
      const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const newEntry = { id, ...attempt, createdAt: nowStr };
      localStorage.setItem(cacheKey, JSON.stringify([newEntry, ...existing]));
    } catch {}
  }
  return id;
}

export async function getTestAttempts(userId: string): Promise<StoredTestAttempt[]> {
  const collPath = `users/${userId}/testAttempts`;
  try {
    const coll = collection(db, 'users', userId, 'testAttempts');
    const q = query(coll, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    if (typeof window !== 'undefined' && docs.length > 0) {
      localStorage.setItem(`boardly_attempts_${userId}`, JSON.stringify(docs));
    }
    return docs;
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`boardly_attempts_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  }
}

/**
 * Global audit log helper (admin actions)
 */
export async function recordAuditLog(log: Omit<StoredAuditLog, 'createdAt'>): Promise<void> {
  const auditPath = 'auditLogs';
  try {
    const coll = collection(db, 'auditLogs');
    await addDoc(coll, {
      ...log,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Boardly AuditLog] Write notice:', err);
  }
}
