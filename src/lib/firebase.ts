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
  onSnapshot,
  deleteDoc,
  deleteField,
  QueryDocumentSnapshot,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
};

import firebaseAppletConfig from '../../firebase-applet-config.json';
import { normalizePlanId, PlanType } from '../data/planLimits';

// Default project credentials from firebase-applet-config.json (fail-safe)
const DEFAULTS = {
  apiKey: firebaseAppletConfig.apiKey || "",
  authDomain: firebaseAppletConfig.authDomain || "",
  projectId: firebaseAppletConfig.projectId || "",
  storageBucket: firebaseAppletConfig.storageBucket || "",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "",
  appId: firebaseAppletConfig.appId || "",
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || "",
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
  lastBoardyMode?: string;
  status?: 'active' | 'suspended' | 'disabled';

  // Boardly Crew Ambassador & Internship Program
  isCrewMember?: boolean;
  crewStatus?: 'active' | 'approved' | 'revoked' | 'graduated' | 'intern' | 'none';
  crewStartDate?: string;
  crewInstitution?: string;
  crewReferralCode?: string;
  crewReferralsCount?: number;
  crewActiveUsersCount?: number;
  isPaidInternshipEligible?: boolean;
  crewRevokedAt?: string;
  crewRevokeReason?: string;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  pendingPremium?: boolean;
  pendingPremiumEmail?: string;
}

export interface UserNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'crew_approval' | 'crew_rejection' | 'announcement' | 'system';
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CrewApplication {
  id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  promotionPlan: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  pendingPremium?: boolean;
  pendingPremiumEmail?: string;
  referralCode?: string;
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

    // Check if user has an active or pending Boardly Crew ambassador 30-day Premium grant
    const userEmailNorm = (rawData.email || '').trim().toLowerCase();
    let pendingCrewConfig: any = null;

    if (userEmailNorm) {
      try {
        const emailKey = userEmailNorm.replace(/[^a-z0-9]/g, '_');
        const configSnap = await getDoc(doc(db, 'config', `crew_pending_${emailKey}`));
        if (configSnap.exists()) {
          const cfg = configSnap.data();
          if (cfg?.pendingPremium) {
            pendingCrewConfig = cfg;
          }
        }
      } catch (e) {
        // Safe read failure notice
      }
    }

    const hasPendingPremium = Boolean(rawData.pendingPremium || pendingCrewConfig?.pendingPremium);
    const premiumExpiryFromConfig = pendingCrewConfig?.expiryDate || (hasPendingPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined);
    const effectivePremiumExpiresAt = rawData.premiumExpiresAt || premiumExpiryFromConfig;

    const isPremiumExpired = Boolean(
      effectivePremiumExpiresAt &&
      new Date(effectivePremiumExpiresAt).getTime() < Date.now()
    );

    const isActivatedPremium = hasPendingPremium && !isPremiumExpired;
    const effectivePlan: PlanType = isActivatedPremium ? 'premium' : (isPremiumExpired ? 'starter' : plan);
    const effectiveIsPremium: boolean = isActivatedPremium ? true : (isPremiumExpired ? false : Boolean(rawData.isPremium));
    const effectiveIsCrewMember: boolean = isActivatedPremium ? true : Boolean(rawData.isCrewMember);
    const effectiveCrewStatus = isActivatedPremium ? 'active' : (rawData.crewStatus || (effectiveIsCrewMember ? 'active' : undefined));
    const effectiveCrewCode = rawData.crewReferralCode || pendingCrewConfig?.referralCode;
    const effectiveCrewInstitution = rawData.crewInstitution || pendingCrewConfig?.institution;

    if (pendingCrewConfig && effectiveCrewCode) {
      try {
        setDoc(
          doc(db, 'captains', uid),
          {
            userId: uid,
            studentName: rawData.name || pendingCrewConfig.fullName || 'Ambassador',
            email: userEmailNorm,
            institution: effectiveCrewInstitution || '',
            referralCode: effectiveCrewCode,
            referralCount: 0,
            activeUsersCount: 0,
            points: 0,
            status: 'active',
            type: 'crew_ambassador',
            createdAt: new Date().toISOString(),
            expiresAt: effectivePremiumExpiresAt,
          },
          { merge: true }
        ).catch(console.warn);
      } catch (capErr) {
        // Safe notice
      }
    }

    const profile: StudentUserProfile = {
      ...rawData,
      uid,
      plan: effectivePlan,
      isPremium: effectiveIsPremium,
      premiumExpiresAt: effectivePremiumExpiresAt,
      isCrewMember: effectiveIsCrewMember,
      crewStatus: effectiveCrewStatus,
      crewReferralCode: effectiveCrewCode,
      crewInstitution: effectiveCrewInstitution,
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

/**
 * Submit a new Boardly Crew Ambassador Application
 */
export async function submitCrewApplication(appData: Omit<CrewApplication, 'id' | 'status' | 'createdAt'>): Promise<string> {
  const normalizedEmail = (appData.email || '').trim().toLowerCase();
  if (normalizedEmail === 'shsvirtualadmin@gmail.com' || normalizedEmail === 'support@boardly.cfd') {
    throw new Error('Admin account is the system administrator and cannot apply as a Crew Ambassador.');
  }

  const coll = collection(db, 'crewApplications');
  const now = new Date().toISOString();
  const docRef = await addDoc(coll, {
    ...appData,
    status: 'pending',
    createdAt: now,
  });

  // Admin Notification on submit via Resend HTTP API
  try {
    fetch('/api/crew/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'submit',
        name: appData.fullName,
        email: appData.email,
        phone: appData.phone,
        institution: appData.institution,
        promotionPlan: appData.promotionPlan,
      }),
    }).catch((e) => console.warn('[Crew submit] Email notify notice:', e));
  } catch (notifyErr) {
    console.warn('[Crew submit] Notification dispatch notice:', notifyErr);
  }

  return docRef.id;
}

/**
 * Fetch a specific user's latest Crew application
 */
export async function fetchUserCrewApplication(userId: string): Promise<CrewApplication | null> {
  if (!userId) return null;
  try {
    const coll = collection(db, 'crewApplications');
    const q = query(coll, where('userId', '==', userId), limit(5));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const apps = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      apps.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return apps[0];
    }
    return null;
  } catch (err) {
    console.warn('[fetchUserCrewApplication] query notice:', err);
    return null;
  }
}

/**
 * Fetch all Boardly Crew applications for admin review
 */
export async function fetchCrewApplications(): Promise<CrewApplication[]> {
  try {
    const coll = collection(db, 'crewApplications');
    const q = query(coll, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.warn('[Crew Applications] Fetch error:', err);
    return [];
  }
}

export interface CaptainRecord {
  userId: string;
  studentName?: string;
  email?: string;
  phone?: string;
  institution?: string;
  referralCode?: string;
  referralCount?: number;
  activeUsersCount?: number;
  points?: number;
  status?: string;
  type?: string;
  createdAt?: string;
  expiresAt?: string;
}

/**
 * Fetch approved captain document for a user (from captains/{uid})
 */
export async function fetchCaptainRecord(uid: string): Promise<CaptainRecord | null> {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'captains', uid));
    if (snap.exists()) {
      return snap.data() as CaptainRecord;
    }
    return null;
  } catch (err) {
    console.warn('[fetchCaptainRecord] notice:', err);
    return null;
  }
}

/**
 * Record a referral signup when a student registers with ref=CREW-XXXX
 */
export async function recordReferralOnSignup(params: {
  referralCode: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
}): Promise<{ success: boolean; referralCount?: number }> {
  try {
    const res = await fetch('/api/referrals/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, referralCount: data.referralCount };
    }
  } catch (err) {
    console.warn('[recordReferralOnSignup] notice:', err);
  }
  return { success: false };
}

/**
 * Fetch live referral count for an ambassador by code or captainId
 */
export async function fetchReferralCount(referralCode: string): Promise<number> {
  if (!referralCode) return 0;
  try {
    const res = await fetch(`/api/referrals/count?code=${encodeURIComponent(referralCode)}`);
    if (res.ok) {
      const data = await res.json();
      return typeof data.count === 'number' ? data.count : 0;
    }
  } catch (err) {
    console.warn('[fetchReferralCount] notice:', err);
  }
  return 0;
}

export interface ApproveCrewResult {
  status: 'upgraded' | 'pending';
  message: 'Approved and upgraded' | 'Approved; Premium will apply when the student signs up';
  targetUserId: string;
  referralCode: string;
}

/**
 * Approve a Crew application:
 * 1. Finds user by userId first. If no document exists, looks up user by application email in users collection.
 * 2. If still not found, doesn't fail: marks application approved, stores pendingPremium flag with email in config/crew_pending_<emailKey>,
 *    and applies 30 days Premium automatically when that email signs up or logs in.
 * 3. Uses setDoc with merge:true instead of updateDoc for the Premium upgrade so missing document doesn't crash.
 * 4. Returns status with exact messages: "Approved and upgraded" or "Approved; Premium will apply when the student signs up".
 */
export async function approveCrewApplication(
  app: CrewApplication,
  adminEmail: string
): Promise<ApproveCrewResult> {
  const now = new Date().toISOString();
  // 30 days expiry date
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const normalizedEmail = (app.email || '').trim().toLowerCase();
  if (normalizedEmail === 'shsvirtualadmin@gmail.com') {
    throw new Error('Admin account shsvirtualadmin@gmail.com cannot be converted into a Crew ambassador.');
  }

  // 1. Generate clean referral code: CREW-<FIRST_NAME>-<RANDOM>
  const cleanName = (app.fullName || 'CREW').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'AMB';
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const referralCode = app.referralCode || `CREW-${cleanName}-${randSuffix}`;

  // 2. Find user by userId first
  let targetUserId = app.userId;
  let userFound = false;

  if (targetUserId && !targetUserId.startsWith('guest_')) {
    try {
      const snap = await getDoc(doc(db, 'users', targetUserId));
      if (snap.exists()) {
        userFound = true;
      }
    } catch (err) {
      console.warn('[approveCrewApplication] check user by id error:', err);
    }
  }

  // If no document exists, look up user by application email in users collection
  if (!userFound && normalizedEmail) {
    try {
      const usersQ = query(
        collection(db, 'users'),
        where('email', '==', normalizedEmail),
        limit(1)
      );
      const snap = await getDocs(usersQ);
      if (!snap.empty) {
        targetUserId = snap.docs[0].id;
        userFound = true;
      }
    } catch (err) {
      console.warn('[approveCrewApplication] lookup user by email error:', err);
    }
  }

  if (userFound && targetUserId) {
    // 3. User document was found: use setDoc with merge:true instead of updateDoc
    const userRef = doc(db, 'users', targetUserId);
    let existingUserPlan = 'free';
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const udata = snap.data();
        if (udata.plan && udata.plan !== 'premium') {
          existingUserPlan = udata.plan;
        } else if (udata.previousPlan) {
          existingUserPlan = udata.previousPlan;
        }
      }
    } catch (err) {}

    await setDoc(
      userRef,
      {
        plan: 'premium',
        isPremium: true,
        premiumSource: 'crew',
        previousPlan: existingUserPlan,
        premiumExpiresAt: expiryDate,
        isCrewMember: true,
        crewStatus: 'approved',
        crewStartDate: now,
        crewInstitution: app.institution,
        crewReferralCode: referralCode,
        crewReferralsCount: 0,
        crewActiveUsersCount: 0,
        isPaidInternshipEligible: false,
        pendingPremium: false,
        updatedAt: now,
      },
      { merge: true }
    );

    // Create / update captains/{userId} doc with status 'approved'
    try {
      await setDoc(
        doc(db, 'captains', targetUserId),
        {
          userId: targetUserId,
          studentName: app.fullName,
          email: normalizedEmail,
          phone: app.phone,
          institution: app.institution,
          referralCode,
          referralCount: 0,
          activeUsersCount: 0,
          points: 0,
          status: 'approved',
          isReferralCodeActive: true,
          type: 'crew_ambassador',
          createdAt: now,
          expiresAt: expiryDate,
        },
        { merge: true }
      );
    } catch (capErr) {
      console.warn('[Crew Approve] Captain doc create notice:', capErr);
    }

    // Create in-app notification
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        title: "🎉 You're Approved for Boardly Crew!",
        message: `Congratulations! Your Boardly Crew application has been approved. You now have 30 days of free Premium access and your unique ambassador referral code (${referralCode}).`,
        type: 'crew_approval',
        read: false,
        createdAt: now,
        metadata: {
          referralCode,
          expiresAt: expiryDate,
        },
      });
    } catch (notifErr) {
      console.warn('[Crew Approve] In-app notification notice:', notifErr);
    }

    // Update application doc
    if (app.id) {
      await setDoc(
        doc(db, 'crewApplications', app.id),
        {
          status: 'approved',
          reviewedAt: now,
          reviewedBy: adminEmail,
          userId: targetUserId,
          referralCode,
          pendingPremium: false,
        },
        { merge: true }
      );
    }

    // Send email via Resend
    try {
      fetch('/api/crew/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approve',
          to: normalizedEmail,
          name: app.fullName,
          referralCode,
          institution: app.institution,
        }),
      }).catch((e) => console.warn('[Crew Approve] Email dispatch notice:', e));
    } catch (emailErr) {
      console.warn('[Crew Approve] Email trigger notice:', emailErr);
    }

    await recordAuditLog({
      adminId: 'admin',
      adminEmail,
      action: 'APPROVE_CREW_APPLICATION',
      targetType: 'crewApplications',
      targetId: app.id || targetUserId,
      details: `Approved ${app.fullName} (${app.institution}) as Crew Ambassador with 30d Premium & code ${referralCode}`,
    });

    return {
      status: 'upgraded',
      message: 'Approved and upgraded',
      targetUserId,
      referralCode,
    };
  }

  // Still not found: don't fail!
  // Mark the application approved, store a pendingPremium flag with the email,
  // and apply the 30 days Premium automatically when that email signs up or logs in.
  // Use setDoc with merge:true instead of updateDoc for the Premium upgrade so a missing document doesn't crash it.
  const fallbackUserId = app.userId || `guest_${Date.now()}`;

  // 1. Mark application approved with pendingPremium flag and email
  if (app.id) {
    await setDoc(
      doc(db, 'crewApplications', app.id),
      {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: adminEmail,
        referralCode,
        pendingPremium: true,
        pendingPremiumEmail: normalizedEmail,
        userId: fallbackUserId,
      },
      { merge: true }
    );
  }

  // 2. Store pendingPremium flag with the email in config (readable by all users per firestore.rules)
  try {
    const emailKey = normalizedEmail.replace(/[^a-z0-9]/g, '_');
    await setDoc(
      doc(db, 'config', `crew_pending_${emailKey}`),
      {
        email: normalizedEmail,
        applicationId: app.id || '',
        fullName: app.fullName,
        institution: app.institution,
        referralCode,
        pendingPremium: true,
        approvedAt: now,
        expiryDate,
      },
      { merge: true }
    );
  } catch (configErr) {
    console.warn('[approveCrewApplication] config pending flag notice:', configErr);
  }

  // 3. Use setDoc with merge:true for the Premium upgrade on fallback user doc so missing document doesn't crash
  try {
    await setDoc(
      doc(db, 'users', fallbackUserId),
      {
        email: normalizedEmail,
        name: app.fullName,
        plan: 'premium',
        isPremium: true,
        premiumSource: 'crew',
        previousPlan: 'free',
        premiumExpiresAt: expiryDate,
        isCrewMember: true,
        crewStatus: 'approved',
        crewStartDate: now,
        crewInstitution: app.institution,
        crewReferralCode: referralCode,
        crewReferralsCount: 0,
        crewActiveUsersCount: 0,
        isPaidInternshipEligible: false,
        pendingPremium: true,
        pendingPremiumEmail: normalizedEmail,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (userErr) {
    console.warn('[approveCrewApplication] setDoc on fallback user notice:', userErr);
  }

  // 4. Create captain document with merge:true
  try {
    await setDoc(
      doc(db, 'captains', fallbackUserId),
      {
        userId: fallbackUserId,
        studentName: app.fullName,
        email: normalizedEmail,
        phone: app.phone,
        institution: app.institution,
        referralCode,
        referralCount: 0,
        activeUsersCount: 0,
        points: 0,
        status: 'approved',
        isReferralCodeActive: true,
        type: 'crew_ambassador',
        pendingPremium: true,
        createdAt: now,
        expiresAt: expiryDate,
      },
      { merge: true }
    );
  } catch (capErr) {
    console.warn('[approveCrewApplication] captain doc notice:', capErr);
  }

  // 5. Send approval email via Resend
  try {
    fetch('/api/crew/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'approve',
        to: normalizedEmail,
        name: app.fullName,
        referralCode,
        institution: app.institution,
      }),
    }).catch((e) => console.warn('[Crew Approve] Email dispatch notice:', e));
  } catch (emailErr) {
    console.warn('[Crew Approve] Email trigger notice:', emailErr);
  }

  await recordAuditLog({
    adminId: 'admin',
    adminEmail,
    action: 'APPROVE_CREW_APPLICATION_PENDING_REGISTRATION',
    targetType: 'crewApplications',
    targetId: app.id || fallbackUserId,
    details: `Approved application for ${app.fullName} (${normalizedEmail}) - pending student registration. Code: ${referralCode}`,
  });

  return {
    status: 'pending',
    message: 'Approved; Premium will apply when the student signs up',
    targetUserId: fallbackUserId,
    referralCode,
  };
}

/**
 * Reject a Crew application:
 * 1. Updates status to 'rejected' with reviewedAt, reviewedBy, rejectionReason
 * 2. Creates in-app notification for user
 * 3. Sends rejection email with reason
 */
export async function rejectCrewApplication(appId: string, userId: string, adminEmail: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  const appRef = doc(db, 'crewApplications', appId);
  
  // Fetch app details for email recipient
  let applicantEmail = '';
  let applicantName = '';
  try {
    const snap = await getDoc(appRef);
    if (snap.exists()) {
      const data = snap.data();
      applicantEmail = data.email || '';
      applicantName = data.fullName || '';
    }
  } catch (fetchErr) {
    console.warn('[Crew Reject] Fetch app doc notice:', fetchErr);
  }

  // 1. Update application status
  await updateDoc(appRef, {
    status: 'rejected',
    rejectionReason: reason || 'Application did not meet current cohort criteria',
    reviewedAt: now,
    reviewedBy: adminEmail,
  });

  // 2. Create in-app notification
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: userId,
      title: 'Boardly Crew Application Status',
      message: reason
        ? `Your Boardly Crew application was reviewed: ${reason}`
        : 'Thank you for applying to Boardly Crew. Unfortunately, your application was not accepted for this cohort.',
      type: 'crew_rejection',
      read: false,
      createdAt: now,
    });
  } catch (notifErr) {
    console.warn('[Crew Reject] Notification notice:', notifErr);
  }

  // 3. Send rejection email with reason
  if (applicantEmail) {
    try {
      fetch('/api/crew/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reject',
          to: applicantEmail,
          name: applicantName,
          reason: reason || 'Application did not meet current cohort criteria',
        }),
      }).catch((e) => console.warn('[Crew Reject] Email dispatch notice:', e));
    } catch (emailErr) {
      console.warn('[Crew Reject] Email trigger notice:', emailErr);
    }
  }

  // 4. Audit Log
  await recordAuditLog({
    adminId: 'admin',
    adminEmail,
    action: 'REJECT_CREW_APPLICATION',
    targetType: 'crewApplications',
    targetId: appId,
    details: `Rejected Crew application for user ${userId}. Reason: ${reason || 'N/A'}`,
  });
}

/**
 * Revoke Crew status (removes ambassador privileges, sets captains/{uid}.status = "revoked",
 * returns user to their previous plan only if premium came from Crew, deactivates referral code,
 * sends in-app notification, dispatches email from noreply@boardly.cfd, and updates audit logs).
 */
export async function revokeCrewMemberStatus(
  userId: string,
  adminEmail: string,
  reason?: string
): Promise<void> {
  const now = new Date().toISOString();
  const cleanReason = reason?.trim() || 'Access revoked by administrator';

  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  let userEmail = '';
  let userName = 'Ambassador';
  let premiumSource: string | null = null;
  let previousPlan = 'free';

  if (snap.exists()) {
    const data = snap.data();
    if (data.email?.toLowerCase() === 'shsvirtualadmin@gmail.com' || data.role === 'admin') {
      throw new Error('Cannot revoke or modify administrator account.');
    }
    userEmail = data.email || '';
    userName = data.name || 'Ambassador';
    premiumSource = data.premiumSource || null;
    previousPlan = data.previousPlan || 'free';
  }

  // 1. Set captains/{userId}.status = "revoked" with revokedAt, revokedBy, and revokeReason
  try {
    await setDoc(
      doc(db, 'captains', userId),
      {
        status: 'revoked',
        revokedAt: now,
        revokedBy: adminEmail,
        revokeReason: cleanReason,
        isReferralCodeActive: false,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (capErr) {
    console.warn('[revokeCrewMemberStatus] captains update notice:', capErr);
  }

  // 2. Set application status to "revoked" in crewApplications
  try {
    const q1 = query(collection(db, 'crewApplications'), where('userId', '==', userId));
    const appsSnap = await getDocs(q1);
    for (const appDoc of appsSnap.docs) {
      await updateDoc(doc(db, 'crewApplications', appDoc.id), {
        status: 'revoked',
        revokedAt: now,
        revokedBy: adminEmail,
        revokeReason: cleanReason,
      });
    }
    const q2 = query(collection(db, 'captainApplications'), where('userId', '==', userId));
    const capAppsSnap = await getDocs(q2);
    for (const appDoc of capAppsSnap.docs) {
      await updateDoc(doc(db, 'captainApplications', appDoc.id), {
        status: 'revoked',
        revokedAt: now,
        revokedBy: adminEmail,
        revokeReason: cleanReason,
      });
    }
  } catch (appErr) {
    console.warn('[revokeCrewMemberStatus] applications update notice:', appErr);
  }

  // 3. User document update:
  // Remove Crew-granted Premium ONLY if premiumSource === 'crew'.
  // Return user to their previous plan. Never downgrade a plan the user paid for!
  const shouldRevertPlan = premiumSource === 'crew';
  const updatedUserFields: any = {
    isCrewMember: false,
    crewStatus: 'revoked',
    crewRevokedAt: now,
    crewRevokeReason: cleanReason,
    updatedAt: now,
  };

  if (shouldRevertPlan) {
    updatedUserFields.plan = previousPlan;
    updatedUserFields.isPremium = previousPlan !== 'free';
    updatedUserFields.premiumSource = null;
  }

  await updateDoc(userRef, updatedUserFields);

  // 4. In-app notification
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title: 'Your Boardly Crew access has been revoked',
      message: cleanReason
        ? `Your Boardly Crew access has been revoked: ${cleanReason}`
        : 'Your Boardly Crew access has been revoked.',
      type: 'crew_revoked',
      read: false,
      createdAt: now,
      metadata: {
        reason: cleanReason,
        revokedAt: now,
      },
    });
  } catch (notifErr) {
    console.warn('[revokeCrewMemberStatus] notification notice:', notifErr);
  }

  // 5. Send email from noreply@boardly.cfd with reason
  if (userEmail) {
    try {
      fetch('/api/crew/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'revoke',
          to: userEmail,
          name: userName,
          reason: cleanReason,
        }),
      }).catch((e) => console.warn('[Crew Revoke] Email dispatch notice:', e));
    } catch (emailErr) {
      console.warn('[Crew Revoke] Email trigger notice:', emailErr);
    }
  }

  // 6. Audit log
  await recordAuditLog({
    adminId: 'admin',
    adminEmail,
    action: 'REVOKE_CREW_STATUS',
    targetType: 'users',
    targetId: userId,
    details: `Revoked Crew status for ${userId} (${userEmail}). Reason: ${cleanReason}`,
  });
}

/**
 * Re-approve a previously revoked Crew ambassador
 */
export async function reapproveCrewMember(
  userId: string,
  adminEmail: string
): Promise<void> {
  const now = new Date().toISOString();
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  let referralCode = '';
  let institution = '';
  let userName = '';
  let email = '';
  let prevPlan = 'free';

  if (userSnap.exists()) {
    const data = userSnap.data();
    referralCode = data.crewReferralCode || '';
    institution = data.crewInstitution || '';
    userName = data.name || '';
    email = data.email || '';
    prevPlan = data.previousPlan || (data.plan !== 'premium' ? data.plan : 'free');
  }

  if (!referralCode) {
    const capSnap = await getDoc(doc(db, 'captains', userId));
    if (capSnap.exists()) {
      referralCode = capSnap.data().referralCode || '';
      institution = institution || capSnap.data().institution || '';
    }
  }
  if (!referralCode) {
    referralCode = `CREW-${userName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'AMB'}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 1. Update captains doc
  await setDoc(
    doc(db, 'captains', userId),
    {
      status: 'approved',
      reapprovedAt: now,
      reapprovedBy: adminEmail,
      isReferralCodeActive: true,
      expiresAt: expiryDate,
      updatedAt: now,
    },
    { merge: true }
  );

  // 2. Update user doc
  await updateDoc(userRef, {
    isCrewMember: true,
    crewStatus: 'approved',
    plan: 'premium',
    isPremium: true,
    premiumSource: 'crew',
    previousPlan: prevPlan,
    premiumExpiresAt: expiryDate,
    crewStartDate: now,
    crewReferralCode: referralCode,
    updatedAt: now,
  });

  // 3. Update application doc
  const q = query(collection(db, 'crewApplications'), where('userId', '==', userId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'crewApplications', d.id), {
      status: 'approved',
      reviewedAt: now,
      reviewedBy: adminEmail,
    });
  }

  // 4. In-app notification
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title: '🎉 Boardly Crew Access Restored!',
      message: 'Your Boardly Crew ambassador access has been re-approved by the administrator. 30 days of Premium and your referral code are now active.',
      type: 'crew_approval',
      read: false,
      createdAt: now,
    });
  } catch (e) {}

  await recordAuditLog({
    adminId: 'admin',
    adminEmail,
    action: 'REAPPROVE_CREW_MEMBER',
    targetType: 'users',
    targetId: userId,
    details: `Re-approved Crew Ambassador ${userId}`,
  });
}

/**
 * Fetch in-app notifications for the logged-in user
 */
export async function fetchUserNotifications(userId: string): Promise<UserNotification[]> {
  if (!userId) return [];
  try {
    const coll = collection(db, 'notifications');
    const q = query(coll, where('userId', '==', userId), limit(30));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.warn('[fetchUserNotifications] notice:', err);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notifId: string): Promise<void> {
  if (!notifId) return;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (err) {
    console.warn('[markNotificationAsRead] notice:', err);
  }
}

