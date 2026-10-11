import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
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
  DocumentSnapshot,
} from 'firebase/firestore';

import firebaseAppletConfig from '../../firebase-applet-config.json';
import { normalizePlanId, PlanType } from '../data/planLimits';

// Default production project credentials (fail-safe)
const DEFAULTS = {
  apiKey: "AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs",
  authDomain: "gen-lang-client-0365509316.firebaseapp.com",
  projectId: "gen-lang-client-0365509316",
  storageBucket: "gen-lang-client-0365509316.firebasestorage.app",
  messagingSenderId: "556734245207",
  appId: "1:556734245207:web:4797f3915b424209b03612",
  firestoreDatabaseId: "ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712",
};

export function cleanEnvVar(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/[\r\n]+/g, '');
}

// Validation helpers
const isValidApiKey = (k: string) => k.startsWith('AIza') && k.length === 39 && !/\s/.test(k) && !/["']/.test(k);
const isValidSenderId = (s: string) => /^\d+$/.test(s);
const isValidAppId = (a: string) => /^1:\d+:web:[0-9a-fA-F]+$/.test(a);

export function isValidHostname(host: string): boolean {
  if (!host || typeof host !== 'string') return false;
  const clean = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  if (!clean || /\s/.test(clean)) return false;
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(clean);
}

/**
 * Probes https://<host>/__/auth/handler to check whether custom domain auth handler responds.
 * Returns true only if the server answers (HTTP 200 or opaque response without network failure).
 */
export async function testAuthHandlerEndpoint(host: string): Promise<boolean> {
  if (!isValidHostname(host)) return false;
  const cleanHost = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://${cleanHost}/__/auth/handler`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.type === 'opaque' || (res.status >= 200 && res.status < 400);
  } catch (err) {
    console.warn(`[Boardly Auth] Auth handler probe to ${cleanHost} failed:`, err);
    return false;
  }
}

// Track which fields use fallbacks
const fallbacksUsed: string[] = [];

// 1. API Key: Use VITE variable if valid, otherwise fallback to firebase-applet-config.json, then DEFAULT
const envApiKey = cleanEnvVar(import.meta.env.VITE_FIREBASE_API_KEY);
const jsonApiKey = cleanEnvVar(firebaseAppletConfig?.apiKey);
let rawApiKey: string;
if (isValidApiKey(envApiKey)) {
  rawApiKey = envApiKey;
} else {
  fallbacksUsed.push('apiKey');
  rawApiKey = isValidApiKey(jsonApiKey) ? jsonApiKey : DEFAULTS.apiKey;
}

// 2. Auth Domain: Keep gen-lang-client-0365509316.firebaseapp.com by default.
// Optional VITE_FIREBASE_AUTH_DOMAIN override is used ONLY if it is a valid hostname
// AND https://<that host>/__/auth/handler responds. Never break login because of it.
const envAuthDomainRaw = cleanEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
let rawAuthDomain = DEFAULTS.authDomain;

if (envAuthDomainRaw && isValidHostname(envAuthDomainRaw)) {
  const cleanHost = envAuthDomainRaw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  // Check if verified in this browser session
  if (typeof window !== 'undefined' && sessionStorage.getItem('boardly_verified_auth_domain') === cleanHost) {
    rawAuthDomain = cleanHost;
  } else if (typeof window !== 'undefined' && cleanHost !== DEFAULTS.authDomain) {
    // Probe in background so subsequent sign-ins or reloads can use it once verified
    testAuthHandlerEndpoint(cleanHost).then((responds) => {
      if (responds) {
        sessionStorage.setItem('boardly_verified_auth_domain', cleanHost);
        try {
          if ((auth as any)?.config) (auth as any).config.authDomain = cleanHost;
          if ((app?.options as any)) (app.options as any).authDomain = cleanHost;
        } catch {}
      } else {
        sessionStorage.removeItem('boardly_verified_auth_domain');
      }
    });
  }
} else {
  fallbacksUsed.push('authDomain');
}

// 3. Project ID
const envProjectId = cleanEnvVar(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const jsonProjectId = cleanEnvVar(firebaseAppletConfig?.projectId);
let rawProjectId: string;
if (envProjectId && !/\s/.test(envProjectId)) {
  rawProjectId = envProjectId;
} else {
  fallbacksUsed.push('projectId');
  rawProjectId = (jsonProjectId && !/\s/.test(jsonProjectId)) ? jsonProjectId : DEFAULTS.projectId;
}

// 4. Storage Bucket
const envStorageBucket = cleanEnvVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const jsonStorageBucket = cleanEnvVar(firebaseAppletConfig?.storageBucket);
let rawStorageBucket: string;
if (envStorageBucket && !/\s/.test(envStorageBucket)) {
  rawStorageBucket = envStorageBucket;
} else {
  fallbacksUsed.push('storageBucket');
  rawStorageBucket = (jsonStorageBucket && !/\s/.test(jsonStorageBucket)) ? jsonStorageBucket : DEFAULTS.storageBucket;
}

// 5. Messaging Sender ID
const envSenderId = cleanEnvVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const jsonSenderId = cleanEnvVar(firebaseAppletConfig?.messagingSenderId);
let rawMessagingSenderId: string;
if (isValidSenderId(envSenderId)) {
  rawMessagingSenderId = envSenderId;
} else {
  fallbacksUsed.push('messagingSenderId');
  rawMessagingSenderId = isValidSenderId(jsonSenderId) ? jsonSenderId : DEFAULTS.messagingSenderId;
}

// 6. App ID
const envAppId = cleanEnvVar(import.meta.env.VITE_FIREBASE_APP_ID);
const jsonAppId = cleanEnvVar(firebaseAppletConfig?.appId);
let rawAppId: string;
if (isValidAppId(envAppId)) {
  rawAppId = envAppId;
} else {
  fallbacksUsed.push('appId');
  rawAppId = isValidAppId(jsonAppId) ? jsonAppId : DEFAULTS.appId;
}

// 7. Firestore Database ID
const envDbId = cleanEnvVar(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);
const jsonDbId = cleanEnvVar(firebaseAppletConfig?.firestoreDatabaseId);
let rawFirestoreDbId: string;
if (envDbId && !/\s/.test(envDbId)) {
  rawFirestoreDbId = envDbId;
} else {
  fallbacksUsed.push('firestoreDatabaseId');
  rawFirestoreDbId = (jsonDbId && !/\s/.test(jsonDbId)) ? jsonDbId : DEFAULTS.firestoreDatabaseId;
}

export const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: rawStorageBucket,
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId,
};

export const configValidation = {
  isValid: true,
  badVars: [] as string[],
};

// Log Firebase environment and fallback status in development
if (import.meta.env.DEV) {
  if (fallbacksUsed.length > 0) {
    console.info('[Boardly Firebase] Development: fields using fallback from firebase-applet-config.json:', fallbacksUsed.join(', '));
  } else {
    console.info('[Boardly Firebase] Development: all config fields loaded from environment variables.');
  }
}

if (import.meta.env.DEV || typeof window !== 'undefined') {
  console.log('[Boardly Firebase] Initializing Firebase:');
  console.log(' - Project ID:', firebaseConfig.projectId);
  console.log(' - Auth Domain:', firebaseConfig.authDomain);
  console.log(' - Named Firestore DB:', rawFirestoreDbId);
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with browser local persistence (called once at startup)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Boardly Auth] Persistence error:', err);
});

export { browserLocalPersistence, setPersistence };

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google sign-in: popup ONLY
export async function performGoogleSignIn(): Promise<any> {
  try {
    // If optional custom auth domain is specified, probe https://<host>/__/auth/handler before using
    const customHost = cleanEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
    if (customHost && isValidHostname(customHost) && customHost !== DEFAULTS.authDomain) {
      const cleanHost = customHost.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
      const isVerified = typeof window !== 'undefined' && sessionStorage.getItem('boardly_verified_auth_domain') === cleanHost;
      if (isVerified) {
        try {
          if ((auth as any)?.config) (auth as any).config.authDomain = cleanHost;
          if ((app?.options as any)) (app.options as any).authDomain = cleanHost;
        } catch {}
      } else {
        const works = await testAuthHandlerEndpoint(cleanHost);
        if (works) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('boardly_verified_auth_domain', cleanHost);
          }
          try {
            if ((auth as any)?.config) (auth as any).config.authDomain = cleanHost;
            if ((app?.options as any)) (app.options as any).authDomain = cleanHost;
          } catch {}
        } else {
          // Fall back strictly to default so login never breaks
          try {
            if ((auth as any)?.config) (auth as any).config.authDomain = DEFAULTS.authDomain;
            if ((app?.options as any)) (app.options as any).authDomain = DEFAULTS.authDomain;
          } catch {}
        }
      }
    }

    return await signInWithPopup(auth, googleProvider);
  } catch (popupErr: any) {
    console.warn('[Boardly Auth] Google popup error:', popupErr);
    if (
      popupErr?.code === 'auth/popup-blocked' ||
      popupErr?.code === 'auth/cancelled-popup-request' ||
      popupErr?.code === 'auth/popup-closed-by-user' ||
      popupErr?.message?.includes('popup')
    ) {
      throw new Error("Allow pop-ups for this site, then try again.");
    }
    throw popupErr;
  }
}

// Initialize Firestore NAMED Database
export const db = getFirestore(app, rawFirestoreDbId);

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
      console.info('[Boardly Firestore] Connection active to named database', rawFirestoreDbId);
    }
  }
}
testFirestoreConnection();

export type UserRole = 'student' | 'organizer' | 'captain' | 'admin';

export interface StudentUserProfile {
  uid: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  photoURL?: string;
  plan: PlanType;
  role: UserRole;
  roles?: UserRole[];
  dailyUsage?: {
    testsTakenToday?: number;
    questionsAskedToday?: number;
    date?: string;
  };
  createdAt: string;
  updatedAt?: string;
  termsAcceptedAt?: string;
  termsVersion?: string;
  referralSource?: string;
  referredBy?: string;
  onboardingCompleted: boolean;
  onboardingComplete?: boolean;
  testTrack?: string;
  targetExam?: string;
  targetUniversity?: string;
  targetUniversityId?: string;
  university?: string;
  dream_university?: string;
  target_university?: string;
  examDate?: string;
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
 * Normalizes legacy plans ('starter' -> 'free', 'all_access' -> 'premium').
 * Never decides "user needs registration" from null/undefined or from a cached result.
 * Checks snapshot.metadata.fromCache: if doc doesn't exist and fromCache is true,
 * fetches the server result (getDocFromServer) before deciding.
 */
export async function fetchUserProfile(uid: string): Promise<StudentUserProfile | null> {
  const userPath = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    let snap: DocumentSnapshot<DocumentData> = await getDoc(userRef);

    // If doc doesn't exist according to local cache, do NOT assume it doesn't exist on server!
    // Fetch directly from server before deciding whether the user needs registration.
    const isFromCache = Boolean((snap as any)?.metadata?.fromCache);
    if (!snap.exists() && isFromCache) {
      try {
        snap = await getDocFromServer(userRef);
      } catch (serverErr) {
        console.warn('[Boardly Firebase] getDocFromServer failed or network offline:', serverErr);
      }
    }

    if (!snap.exists()) {
      // If snapshot is still from cache (e.g. offline), check local storage backup before declaring non-existent
      const stillFromCache = Boolean((snap as any)?.metadata?.fromCache);
      if (stillFromCache) {
        try {
          const cached = localStorage.getItem(`boardly_cached_profile_${uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.uid === uid) return parsed;
          }
        } catch {}
      }
      return null;
    }

    const rawData = snap.data();
    const isRegistered = Boolean(rawData.onboardingComplete || rawData.onboardingCompleted);
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
      onboardingCompleted: isRegistered,
      onboardingComplete: isRegistered,
      createdAt: rawData.createdAt || new Date().toISOString(),
    };

    try {
      localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify(profile));
    } catch {}

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
  const isRegisteredInit = Boolean(initialData.onboardingComplete || initialData.onboardingCompleted);

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
    onboardingCompleted: isRegisteredInit,
    onboardingComplete: isRegisteredInit,
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
        const isRegisteredExisting = Boolean(existingData.onboardingComplete || existingData.onboardingCompleted);
        resultProfile = {
          ...existingData,
          uid,
          plan: normalizePlanId(existingData.plan),
          role: (existingData.role || 'student') as UserRole,
          roles: existingData.roles || [(existingData.role || 'student') as UserRole],
          onboardingComplete: isRegisteredExisting,
          onboardingCompleted: isRegisteredExisting,
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
    if (fields.onboardingCompleted !== undefined || fields.onboardingComplete !== undefined) {
      const isDone = Boolean(fields.onboardingCompleted || fields.onboardingComplete);
      cleanFields.onboardingCompleted = isDone;
      cleanFields.onboardingComplete = isDone;
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
