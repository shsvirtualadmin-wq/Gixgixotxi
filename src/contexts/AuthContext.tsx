import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  setStoredGuestSessionToken,
  getStoredTrustedDeviceToken,
  setStoredTrustedDeviceToken,
} from '@/lib/api';
import type { UserProfile } from '@/types';
import { debugTracker } from '@/utils/debugTracker';
import { deriveFallbackShortId, ensureUserShortId } from '@/utils/shortId';
import { processAmbassadorReferralOnSignup } from '@/services/referralService';
import { validateUsernameFormat } from '@/utils/usernameValidation';
import {
  LEGAL_DOCUMENT_VERSION,
  recordLegalConsentOnServer,
} from '@/constants/legalConsent';
import { seedSharedUserProfileCache } from '@/hooks/useUserProfile';

const GuestLogoutConfirmModal = lazy(() =>
  import('@/components/auth/GuestLogoutConfirmModal').then((m) => ({
    default: m.GuestLogoutConfirmModal,
  }))
);
const GuestUpgradeModal = lazy(() =>
  import('@/components/auth/GuestUpgradeModal').then((m) => ({
    default: m.GuestUpgradeModal,
  }))
);
const ChooseUsernameModal = lazy(() =>
  import('@/components/auth/ChooseUsernameModal').then((m) => ({
    default: m.ChooseUsernameModal,
  }))
);

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
const SUPER_ADMIN_UID_ALLOWLIST = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'uid_superadmin_1',
  'uid_superadmin_2',
]);
const REFERRAL_LS_KEY = 'boardly_ref_code';

// ─── Timeout Helper (prevents hanging Firestore calls from freezing auth) ────
function withTimeout<T>(
  promise: Promise<T>,
  ms = 12000,
  timeoutMsg = 'Database operation timed out. Check Firestore rules or connectivity.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        const err = new Error(timeoutMsg);
        (err as unknown as { code: string }).code = 'firestore/timeout';
        reject(err);
      }, ms)
    ),
  ]);
}

export interface OtpVerificationState {
  status: 'idle' | 'checking' | 'pending' | 'verified';
  purpose: 'login' | 'signup' | '2fa' | null;
  email: string;
  maskedEmail: string;
  cooldownSeconds: number;
  error: string | null;
  twoFactorMethods?: {
    totp: boolean;
    email: boolean;
  };
  pendingExpiresAt?: number | null;
  recoveryDisableAt?: number | null;
}

function maskEmailClient(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '***@***';
  return `${clean[0] || '*'}***@${clean.slice(atIdx + 1)}`;
}

function isGoogleProviderUser(firebaseUser: User | null): boolean {
  if (!firebaseUser) return false;
  return (
    Array.isArray(firebaseUser.providerData) &&
    firebaseUser.providerData.some((p) => p?.providerId === 'google.com')
  );
}

const GUEST_TOKEN_LS_KEY = 'boardly_guest_session_token';
const GUEST_DEVICE_ID_LS_KEY = 'boardly_device_id';

function getOrCreateClientDeviceId(): string {
  try {
    const existing = localStorage.getItem(GUEST_DEVICE_ID_LS_KEY);
    if (existing && existing.length >= 12) return existing;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(GUEST_DEVICE_ID_LS_KEY, id);
    return id;
  } catch {
    return 'browser-device';
  }
}

function buildSyntheticGuestUser(guestUid: string, username: string, sessionToken: string): User {
  const tokenValue = `guest_${sessionToken}`;
  const fakeUser: Partial<User> & Record<string, any> = {
    uid: guestUid,
    displayName: username,
    email: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'guest',
    emailVerified: true,
    isAnonymous: true,
    isGuest: true,
    metadata: {},
    providerData: [],
    refreshToken: sessionToken,
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => tokenValue,
    getIdTokenResult: async () =>
      ({
        token: tokenValue,
        claims: { sub: guestUid, isGuest: true, username },
        authTime: new Date().toUTCString(),
        issuedAtTime: new Date().toUTCString(),
        expirationTime: new Date(Date.now() + 30 * 86400 * 1000).toUTCString(),
        signInProvider: 'guest',
        signInSecondFactor: null,
      }) as any,
    reload: async () => {},
    toJSON: () => ({ uid: guestUid, displayName: username, isGuest: true }),
  };
  return fakeUser as User;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface GuestUpgradeResult {
  ok: boolean;
  existingAccountConflict?: boolean;
  existingEmail?: string;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: { code?: string; message: string; path?: string } | null;
  authError: { code?: string; message: string } | null;
  clearAuthError: () => void;
  clearProfileError: () => void;
  isAdmin: boolean;
  isGuest: boolean;
  guestSessionToken: string | null;
  isSessionVerified: boolean;
  otpVerificationState: OtpVerificationState;
  requestOtpCode: (opts?: {
    purpose?: 'login' | 'signup' | '2fa';
    forceResend?: boolean;
  }) => Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }>;
  verifyOtpCode: (
    code: string,
    opts?: { method?: 'totp' | 'email' | 'backup'; rememberDevice?: boolean }
  ) => Promise<{
    ok: boolean;
    error?: string;
    locked?: boolean;
    attemptsRemaining?: number;
  }>;
  verifyFallbackEmailLink: (
    token: string,
    uid?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  refreshVerificationStatus: (opts?: { syncPasswordLink?: boolean }) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<{
    available: boolean;
    username: string;
    normalized: string;
    reason?: string | null;
    code?: string | null;
  }>;
  signInAsGuest: (username: string, targetUniversity?: string) => Promise<UserProfile>;
  syncGuestProgress: (updates: {
    testsCompleted?: number;
    totalQuestionsSolved?: number;
    streak?: number;
    targetUniversity?: string;
    stats?: Record<string, any>;
    attempts?: any[];
  }) => Promise<void>;
  upgradeGuestWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<GuestUpgradeResult>;
  upgradeGuestWithGoogle: () => Promise<GuestUpgradeResult>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: (opts?: { force?: boolean }) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryProfile: () => void;
  getRoleRedirectUrl: (customRole?: string) => string;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [guestSessionToken, setGuestSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(GUEST_TOKEN_LS_KEY) || null;
    } catch {
      return null;
    }
  });
  const [otpVerificationState, setOtpVerificationState] = useState<OtpVerificationState>({
    status: 'idle',
    purpose: null,
    email: '',
    maskedEmail: '',
    cooldownSeconds: 0,
    error: null,
  });
  const [showGuestLogoutConfirm, setShowGuestLogoutConfirm] = useState(false);
  const [guestLogoutLoading, setGuestLogoutLoading] = useState(false);
  const [showGuestUpgradeFromLogout, setShowGuestUpgradeFromLogout] = useState(false);
  const pendingGuestLogoutResolversRef = useRef<Array<() => void>>([]);
  const [usernamePromptState, setUsernamePromptState] = useState<{
    open: boolean;
    allowSkip: boolean;
    suggested: string;
  }>({
    open: false,
    allowSkip: false,
    suggested: '',
  });

  const isGuest = Boolean(
    profile?.isGuest === true ||
      profile?.accountType === 'guest' ||
      (user as any)?.isGuest === true ||
      (user?.uid && String(user.uid).startsWith('guest_'))
  );

  // Guests are exempt from the 6-digit email OTP verification step
  const isSessionVerified = isGuest || otpVerificationState.status === 'verified';

  const isAdmin = !!(
    !isGuest &&
    isSessionVerified &&
    ((user?.uid && SUPER_ADMIN_UID_ALLOWLIST.has(user.uid)) ||
      (profile?.uid && SUPER_ADMIN_UID_ALLOWLIST.has(profile.uid)) ||
      profile?.role === 'admin' ||
      profile?.role === 'superadmin' ||
      (profile as any)?.isSuperAdmin === true)
  );

  // ── Helper to determine target dashboard URL by role ─────────────────────
  const getRoleRedirectUrl = useCallback(
    (customRole?: string) => {
      if (isGuest) return '/dashboard';
      if (isAdmin) return '/admin';
      const role = customRole || profile?.role || 'student';
      if (role === 'crew') return '/crew';
      if (role === 'captain') return '/captain';
      return '/dashboard';
    },
    [isGuest, isAdmin, profile]
  );

  // ── Create referral document after first signup ──────────────────────────
  const createReferralDoc = useCallback(async (uid: string, email: string) => {
    const refCode = localStorage.getItem(REFERRAL_LS_KEY);
    if (!refCode) return;
    try {
      const refDocRef = doc(db, 'referrals', uid);
      const existing = await getDoc(refDocRef);
      if (existing.exists()) return;
      await setDoc(refDocRef, {
        referrerCode: refCode,
        referredUserId: uid,
        referredUid: uid,
        referredEmail: email.toLowerCase(),
        status: 'pending',
        activated: false,
        signedUpAt: serverTimestamp(),
        emailVerified: false,
        firstTestCompleted: false,
      });
    } catch (err) {
      console.warn('[Boardly] Referral doc creation failed:', err);
    }
  }, []);

  // ── Fetch / create user profile (protected with fast race & fallback) ────
  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);
    const path = `users/${firebaseUser.uid}`;

    const emailLower = (firebaseUser.email ?? '').toLowerCase();
    const isSuperAdminAccount = SUPER_ADMIN_UID_ALLOWLIST.has(firebaseUser.uid);

    const fallbackName =
      firebaseUser.displayName?.trim() ||
      (firebaseUser.email
        ? firebaseUser.email.split('@')[0]
        : isSuperAdminAccount
        ? 'Super Admin'
        : 'Student');

    const defaultProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: emailLower,
      displayName: fallbackName,
      name: fallbackName,
      photoURL: null,
      role: isSuperAdminAccount ? 'admin' : 'student',
      plan: isSuperAdminAccount ? 'pro' : 'free',
      status: 'active',
      profileCompleted: isSuperAdminAccount ? true : false,
      onboardingCompleted: isSuperAdminAccount ? true : false,
      streak: 0,
    };

    try {
      const docRef = doc(db, 'users', firebaseUser.uid);

      let loadedProfile: UserProfile | null = null;

      // 1. Fast path read: 99.9% of users already have a profile document
      try {
        const snap = await Promise.race([
          getDoc(docRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          loadedProfile = { ...(snap.data() as UserProfile), photoURL: null };
        } else if (snap && typeof snap.exists === 'function' && !snap.exists()) {
          // Truly new user: initialize clean defaults (never copy Google photoURL or write protected fields from client)
          const baseUserDoc: UserProfile = {
            uid: firebaseUser.uid,
            name: fallbackName,
            displayName: fallbackName,
            email: emailLower,
            photoURL: null,
            role: isSuperAdminAccount ? 'admin' : 'student',
            plan: isSuperAdminAccount ? 'pro' : 'free',
            status: 'active',
            profileCompleted: isSuperAdminAccount ? true : false,
            onboardingCompleted: isSuperAdminAccount ? true : false,
            streak: 0,
            shortId: deriveFallbackShortId(firebaseUser.uid),
          };
          await setDoc(docRef, {
            uid: firebaseUser.uid,
            name: fallbackName,
            displayName: fallbackName,
            email: emailLower,
            photoURL: null,
            profileCompleted: isSuperAdminAccount ? true : false,
            onboardingCompleted: isSuperAdminAccount ? true : false,
            streak: 0,
            shortId: baseUserDoc.shortId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          loadedProfile = baseUserDoc;
          createReferralDoc(firebaseUser.uid, firebaseUser.email ?? '').catch(() => {});
          processAmbassadorReferralOnSignup({
            newUid: firebaseUser.uid,
            newEmail: firebaseUser.email ?? '',
            newName: fallbackName,
            newShortId: baseUserDoc.shortId || deriveFallbackShortId(firebaseUser.uid),
          }).catch(() => {});
          ensureUserShortId(firebaseUser.uid, baseUserDoc.shortId).catch(() => {});
        }
      } catch (readErr: unknown) {
        console.warn(`[Boardly] User doc read notice at ${path}:`, readErr);
        const code = (readErr as { code?: string })?.code;
        if (code === 'permission-denied') {
          debugTracker.recordPlanLog({
            action: 'auth_load_profile',
            status: 'permission_denied',
            errorCode: code,
            details: (readErr as Error)?.message,
          });
        }
      }

      if (loadedProfile) {
        // Suspension check
        if (loadedProfile.suspended === true || loadedProfile.isSuspended === true) {
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
          setProfileError({
            code: 'auth/account-suspended',
            message: 'Your account has been suspended. Contact support@boardly.cfd.',
          });
          return;
        }

        // Ensure displayName and default Student role are populated in memory; never trust client Firestore role for admin unless UID is in allowlist (until verified by /api/auth/me)
        const silentPatches: Record<string, unknown> = {};
        if (!loadedProfile.displayName || loadedProfile.displayName === 'Unnamed Student') {
          loadedProfile.displayName = fallbackName;
          silentPatches.displayName = fallbackName;
        }
        if (
          !isSuperAdminAccount &&
          String(loadedProfile.displayName || '').trim().toLowerCase() === 'shs virtual academy'
        ) {
          loadedProfile.displayName = loadedProfile.username || fallbackName;
          silentPatches.displayName = loadedProfile.displayName;
        }
        if (isSuperAdminAccount) {
          loadedProfile.role = 'admin';
        } else if (
          !loadedProfile.role ||
          loadedProfile.role === 'admin' ||
          loadedProfile.role === 'superadmin'
        ) {
          loadedProfile.role = 'student';
        }
        if (Object.keys(silentPatches).length > 0) {
          setDoc(docRef, silentPatches, { merge: true }).catch(() => {});
        }

        setProfile(loadedProfile);
        seedSharedUserProfileCache(firebaseUser.uid, loadedProfile);
      } else {
        // Doc read timed out or failed — use fallback profile in-memory ONLY.
        // NEVER write this fallback profile to Firestore, as that would overwrite the user's real plan!
        console.warn(`[Boardly] Profile read timed out or offline at ${path}. Keeping in-memory fallback.`);
        setProfile(defaultProfile);
        seedSharedUserProfileCache(firebaseUser.uid, defaultProfile);
      }
    } catch (err: unknown) {
      console.warn(`[Boardly] Firestore profile read fallback at ${path}:`, err);
      setProfile(defaultProfile);
    } finally {
      setProfileLoading(false);
    }
  }, [createReferralDoc]);

  // ── Request 6-digit OTP code from Worker (`/api/auth/send-code`) ─────────
  const requestOtpCodeForUser = useCallback(
    async (
      firebaseUser: User,
      opts?: { purpose?: 'login' | 'signup' | '2fa'; forceResend?: boolean }
    ): Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }> => {
      try {
        const idToken = await firebaseUser.getIdToken();
        const sendPurpose = opts?.purpose === '2fa' ? 'login' : opts?.purpose;
        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            purpose: sendPurpose,
            forceResend: Boolean(opts?.forceResend),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          purpose?: 'login' | 'signup';
          maskedEmail?: string;
          cooldownSeconds?: number;
          retryAfterSeconds?: number;
          error?: string;
        };

        const masked = data.maskedEmail || maskEmailClient(firebaseUser.email || '');
        const cooldown = Number(data.cooldownSeconds ?? data.retryAfterSeconds ?? 0);

        if (!res.ok || !data.ok) {
          const errMsg = data.error || 'Could not send verification code. Please try again.';
          setOtpVerificationState((prev) => ({
            ...prev,
            status: 'pending',
            purpose: opts?.purpose || prev.purpose || 'login',
            email: firebaseUser.email || prev.email,
            maskedEmail: masked,
            cooldownSeconds: cooldown > 0 ? cooldown : prev.cooldownSeconds,
            error: errMsg,
          }));
          return {
            ok: false,
            maskedEmail: masked,
            cooldownSeconds: cooldown,
            error: errMsg,
          };
        }

        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'pending',
          purpose: opts?.purpose || prev.purpose || data.purpose || 'login',
          email: firebaseUser.email || '',
          maskedEmail: masked,
          cooldownSeconds: cooldown || 60,
          error: null,
        }));

        return {
          ok: true,
          maskedEmail: masked,
          cooldownSeconds: cooldown || 60,
        };
      } catch {
        const errMsg = 'Network error while sending verification code.';
        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'pending',
          error: errMsg,
        }));
        return { ok: false, error: errMsg };
      }
    },
    []
  );

  const requestOtpCode = useCallback(
    async (opts?: { purpose?: 'login' | 'signup' | '2fa'; forceResend?: boolean }) => {
      const targetUser = auth.currentUser || user;
      if (!targetUser) {
        return { ok: false, error: 'Please sign in first.' };
      }
      return requestOtpCodeForUser(targetUser, opts);
    },
    [user, requestOtpCodeForUser]
  );

  // ── Verify 6-digit OTP or 2FA code via Worker (`/api/auth/verify-code` or `/api/auth/2fa/verify`) ──
  const verifyOtpCode = useCallback(
    async (
      code: string,
      opts?: { method?: 'totp' | 'email' | 'backup'; rememberDevice?: boolean }
    ): Promise<{
      ok: boolean;
      error?: string;
      locked?: boolean;
      attemptsRemaining?: number;
    }> => {
      const targetUser = auth.currentUser || user;
      if (!targetUser) {
        return { ok: false, error: 'Session expired. Please sign in again.' };
      }

      try {
        const idToken = await targetUser.getIdToken();
        const isTwoFactorStep =
          otpVerificationState.purpose === '2fa' || Boolean(opts?.method);
        const endpoint = isTwoFactorStep ? '/api/auth/2fa/verify' : '/api/auth/verify-code';

        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            code: code.trim(),
            purpose:
              otpVerificationState.purpose === '2fa'
                ? 'login'
                : otpVerificationState.purpose || undefined,
            method: opts?.method,
            rememberDevice: Boolean(opts?.rememberDevice),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          verified?: boolean;
          trustedDeviceToken?: string | null;
          error?: string;
          locked?: boolean;
          attemptsRemaining?: number;
        };

        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Invalid or expired code',
            locked: Boolean(data.locked),
            attemptsRemaining: data.attemptsRemaining,
          };
        }

        if (data.trustedDeviceToken) {
          setStoredTrustedDeviceToken(data.trustedDeviceToken);
        }

        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage errors
        }

        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'verified',
          purpose: null,
          cooldownSeconds: 0,
          error: null,
        }));

        try {
          await targetUser.reload();
          await loadProfile(targetUser);
        } catch {
          // Ignore reload error
        }

        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid or expired code' };
      }
    },
    [user, otpVerificationState.purpose, loadProfile]
  );

  // ── Verify Fallback Email Link (`/api/auth/verify-link`) ─────────────────
  const verifyFallbackEmailLink = useCallback(
    async (token: string, uid?: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const targetUser = auth.currentUser || user;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (targetUser) {
          const idToken = await targetUser.getIdToken().catch(() => '');
          if (idToken) headers.Authorization = `Bearer ${idToken}`;
        }

        const res = await fetch('/api/auth/verify-link', {
          method: 'POST',
          headers,
          body: JSON.stringify({ token, uid }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };

        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Invalid or expired verification link.',
          };
        }

        if (targetUser) {
          try {
            localStorage.setItem('boardly_user_authenticated', 'true');
          } catch {
            // Ignore storage errors
          }
          setOtpVerificationState((prev) => ({
            ...prev,
            status: 'verified',
            purpose: null,
            cooldownSeconds: 0,
            error: null,
          }));
          try {
            await targetUser.reload();
            await loadProfile(targetUser);
          } catch {
            // Ignore reload error
          }
        }

        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid or expired verification link.' };
      }
    },
    [user, loadProfile]
  );

  // Clean up any legacy redirect session markers on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('boardly_auth_redirect_pending');
        sessionStorage.removeItem('boardly_redirect_pending');
      } catch {
        // Ignore storage access errors
      }
    }
  }, []);

  // Keep refs to current user/profile so Firebase onAuthStateChanged(null) never clears an active guest session prematurely
  const userRef = useRef<User | null>(user);
  const profileRef = useRef<UserProfile | null>(profile);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const loadProfileRef = useRef(loadProfile);
  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

  const requestOtpCodeForUserRef = useRef(requestOtpCodeForUser);
  useEffect(() => {
    requestOtpCodeForUserRef.current = requestOtpCodeForUser;
  }, [requestOtpCodeForUser]);

  // Helper to resolve current user/guest from the unified `/api/auth/me` endpoint
  const resolveServerGuestSession = useCallback(async (): Promise<boolean> => {
    try {
      const savedGuestToken = localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
      const headers: Record<string, string> = {};
      if (savedGuestToken) {
        headers['X-Guest-Session'] = savedGuestToken;
      }
      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      const meData = (await meRes.json().catch(() => ({}))) as {
        ok?: boolean;
        authenticated?: boolean;
        user?: {
          uid: string;
          username: string | null;
          displayName: string;
          accountType: 'guest' | 'registered';
          plan: string;
          role: string;
          customRole?: string;
          isGuest?: boolean;
          shortId?: string;
          targetUniversity?: string;
          testsCompleted?: number;
          totalQuestionsSolved?: number;
          streak?: number;
        } | null;
        guest?: {
          uid: string;
          username: string;
          displayName: string;
          shortId: string;
          targetUniversity?: string;
          testsCompleted?: number;
          totalQuestionsSolved?: number;
          streak?: number;
          createdAt?: number;
          lastActiveAt?: number;
        } | null;
      };

      const g = meData.guest || (meData.user?.accountType === 'guest' ? meData.user : null);
      if (meRes.ok && meData.authenticated && g && g.uid) {
        const guestUsername = g.username || g.displayName || 'Guest';
        const guestDisplayName = g.displayName || guestUsername;
        const effectiveToken = savedGuestToken || `${g.uid}.cookie_session`;
        setStoredGuestSessionToken(effectiveToken);
        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage error
        }
        const synthUser = buildSyntheticGuestUser(g.uid, guestUsername, effectiveToken);
        const guestProfile: UserProfile = {
          uid: g.uid,
          email: '',
          displayName: guestDisplayName,
          name: guestDisplayName,
          username: guestUsername,
          shortId: g.shortId || 'GUEST',
          role: 'student',
          customRole: 'Guest',
          plan: 'free',
          status: 'active',
          isGuest: true,
          accountType: 'guest',
          profileCompleted: true,
          onboardingCompleted: true,
          targetUniversity: g.targetUniversity || 'General Prep',
          testsCompleted: Number(g.testsCompleted || 0),
          totalQuestionsSolved: Number(g.totalQuestionsSolved || 0),
          streak: Number(g.streak || 0),
          lastActiveAt: (g as any).lastActiveAt || Date.now(),
        };
        setGuestSessionToken(effectiveToken);
        setUser(synthUser);
        setProfile(guestProfile);
        setOtpVerificationState({
          status: 'verified',
          purpose: null,
          email: '',
          maskedEmail: `@${guestUsername}`,
          cooldownSeconds: 0,
          error: null,
        });
        setProfileLoading(false);
        setProfileError(null);
        return true;
      }

      // Only clear guest state if server explicitly responded that there is no valid guest session
      if (meRes.ok && meData.authenticated === false) {
        return false;
      }

      // On transient server error, keep any existing in-memory guest session alive
      if (userRef.current && (userRef.current as any).isGuest) {
        setProfileLoading(false);
        return true;
      }
      return false;
    } catch {
      // Network failure: do not destroy an already-loaded guest session
      if (userRef.current && (userRef.current as any).isGuest) {
        setProfileLoading(false);
        return true;
      }
      return false;
    }
  }, []);

  // Helper to evaluate server-side verification gate (`/api/auth/verification-status`)
  const evaluateUserVerificationGate = useCallback(
    async (
      firebaseUser: User,
      isFreshLogin = false,
      syncPasswordLink = false
    ): Promise<boolean> => {
      setOtpVerificationState((prev) =>
        prev.status === 'pending' && prev.email === (firebaseUser.email || '')
          ? prev
          : {
              status: 'checking',
              purpose: prev.purpose,
              email: firebaseUser.email || '',
              maskedEmail: maskEmailClient(firebaseUser.email || ''),
              cooldownSeconds: prev.cooldownSeconds,
              error: null,
            }
      );

      try {
        const idToken = await firebaseUser.getIdToken(syncPasswordLink);
        const savedTrustedDevice = getStoredTrustedDeviceToken();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${idToken}`,
        };
        if (savedTrustedDevice) {
          headers['X-Trusted-Device'] = savedTrustedDevice;
        }

        const queryParts: string[] = [];
        if (isFreshLogin) queryParts.push('login=1');
        if (syncPasswordLink) queryParts.push('syncPasswordLink=1');
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        const statusRes = await fetch(`/api/auth/verification-status${queryString}`, {
          credentials: 'include',
          headers,
        });
        const statusData = (await statusRes.json().catch(() => ({}))) as {
          ok?: boolean;
          verified?: boolean;
          emailVerified?: boolean;
          twoFactorEnabled?: boolean;
          totpEnabled?: boolean;
          email2faEnabled?: boolean;
          deviceTrusted?: boolean;
          requiredPurpose?: 'login' | 'signup' | '2fa' | null;
          pendingExpiresAt?: number | null;
          recoveryDisableAt?: number | null;
          hasActiveCode?: boolean;
          maskedEmail?: string;
          cooldownSeconds?: number;
        };

        if (statusRes.ok && statusData.verified) {
          try {
            localStorage.setItem('boardly_user_authenticated', 'true');
          } catch {
            // Ignore storage errors
          }
          setOtpVerificationState({
            status: 'verified',
            purpose: null,
            email: firebaseUser.email || '',
            maskedEmail: statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
            cooldownSeconds: 0,
            error: null,
          });
          return true;
        }

        try {
          localStorage.removeItem('boardly_user_authenticated');
        } catch {
          // Ignore storage errors
        }

        const requiredPurpose: 'login' | 'signup' | '2fa' =
          statusData.requiredPurpose ||
          (statusData.twoFactorEnabled
            ? '2fa'
            : firebaseUser.emailVerified
            ? 'login'
            : 'signup');

        const totpEnabled = Boolean(statusData.totpEnabled);
        const email2faEnabled = Boolean(statusData.email2faEnabled);

        setOtpVerificationState({
          status: 'pending',
          purpose: requiredPurpose,
          email: firebaseUser.email || '',
          maskedEmail: statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
          cooldownSeconds: Number(statusData.cooldownSeconds || 0),
          error: null,
          twoFactorMethods: {
            totp: totpEnabled,
            email: email2faEnabled,
          },
          pendingExpiresAt: statusData.pendingExpiresAt || null,
          recoveryDisableAt: statusData.recoveryDisableAt || null,
        });

        // Automatically send email code when required for one-time signup verification
        // OR when 2FA is active with email 2FA enabled and no TOTP-only preference
        const shouldAutoSendEmail =
          requiredPurpose === 'signup' ||
          (requiredPurpose === '2fa' && email2faEnabled && !totpEnabled);

        if (
          shouldAutoSendEmail &&
          !statusData.hasActiveCode &&
          (!statusData.cooldownSeconds || statusData.cooldownSeconds <= 0)
        ) {
          void requestOtpCodeForUserRef.current(firebaseUser, {
            purpose: requiredPurpose,
            forceResend: false,
          });
        }
        return false;
      } catch {
        // Fallback if network fails
        if (isGoogleProviderUser(firebaseUser) || firebaseUser.emailVerified) {
          setOtpVerificationState({
            status: 'verified',
            purpose: null,
            email: firebaseUser.email || '',
            maskedEmail: maskEmailClient(firebaseUser.email || ''),
            cooldownSeconds: 0,
            error: null,
          });
          return true;
        }
        setOtpVerificationState((prev) => ({
          status: 'pending',
          purpose: prev.purpose || 'signup',
          email: firebaseUser.email || '',
          maskedEmail: maskEmailClient(firebaseUser.email || ''),
          cooldownSeconds: prev.cooldownSeconds,
          error: prev.error,
        }));
        return false;
      }
    },
    []
  );

  const refreshVerificationStatus = useCallback(
    async (opts?: { syncPasswordLink?: boolean }): Promise<boolean> => {
      const targetUser = auth.currentUser || userRef.current;
      if (!targetUser || (targetUser as any).isGuest) return true;
      const ok = await evaluateUserVerificationGate(
        targetUser,
        false,
        Boolean(opts?.syncPasswordLink)
      );
      if (opts?.syncPasswordLink) {
        await targetUser.getIdToken(true).catch(() => {});
      }
      return ok;
    },
    [evaluateUserVerificationGate]
  );

  // ── Auth state listener (Single Source of Truth with `/api/auth/me`) ─────
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);

        // Run verification gate, Firestore profile load, and D1 `/api/auth/me` in parallel instead of a sequential waterfall
        const [, , meCheck] = await Promise.all([
          evaluateUserVerificationGate(firebaseUser, false).catch(() => false),
          loadProfileRef.current(firebaseUser).catch((err) => {
            console.warn('[Boardly Auth] onAuthStateChanged profile load error:', err);
          }),
          (async () => {
            try {
              const idToken = await firebaseUser.getIdToken();
              const meRes = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: { Authorization: `Bearer ${idToken}` },
              });
              const meData = await meRes.json().catch(() => ({}));
              return { ok: meRes.ok, meData, idToken };
            } catch {
              return null;
            }
          })(),
        ]);

        if (!isMounted) return;

        // Apply server-side username and trusted role from `/api/auth/me` if registered user has one in D1
        if (meCheck?.ok && meCheck.meData?.user) {
          const { meData, idToken } = meCheck;
          const serverRoleRaw = String(meData.user.role || '').trim().toLowerCase();
          const trustedRole = SUPER_ADMIN_UID_ALLOWLIST.has(firebaseUser.uid)
            ? 'admin'
            : serverRoleRaw === 'superadmin' || serverRoleRaw === 'admin'
            ? 'admin'
            : serverRoleRaw === 'captain' || serverRoleRaw === 'crew'
            ? (serverRoleRaw as UserProfile['role'])
            : 'student';
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  ...(meData.user.username ? { username: meData.user.username } : {}),
                  role: trustedRole,
                }
              : prev
          );
          const hasRegUsername = Boolean(
            meData.hasRegisteredUsername || meData.user.hasRegisteredUsername
          );
          if (!hasRegUsername) {
            const existingFsUsername = String(profileRef.current?.username || '').trim();
            if (existingFsUsername && validateUsernameFormat(existingFsUsername).valid) {
              const regRes = await fetch('/api/auth/username-register', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  username: existingFsUsername,
                  email: (firebaseUser.email || '').toLowerCase(),
                  accountType: 'registered',
                }),
              }).catch(() => null);
              const regJson = regRes ? await regRes.json().catch(() => ({})) : {};
              if (regRes?.ok && regJson?.ok) {
                setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
              } else {
                const isGoogle = isGoogleProviderUser(firebaseUser);
                const seenKey = `boardly_username_prompt_seen_${firebaseUser.uid}`;
                const alreadySeen =
                  !isGoogle &&
                  typeof window !== 'undefined' &&
                  window.localStorage.getItem(seenKey) === '1';
                if (!alreadySeen) {
                  setUsernamePromptState({
                    open: true,
                    allowSkip: !isGoogle,
                    suggested: '',
                  });
                }
              }
            } else {
              const isGoogle = isGoogleProviderUser(firebaseUser);
              const seenKey = `boardly_username_prompt_seen_${firebaseUser.uid}`;
              const alreadySeen =
                !isGoogle &&
                typeof window !== 'undefined' &&
                window.localStorage.getItem(seenKey) === '1';
              if (!alreadySeen) {
                const baseSuggested = (
                  firebaseUser.displayName ||
                  (firebaseUser.email ? firebaseUser.email.split('@')[0] : '') ||
                  ''
                )
                  .toLowerCase()
                  .replace(/[^a-z0-9._]/g, '_')
                  .replace(/^[._]+|[._]+$/g, '')
                  .slice(0, 16);
                setUsernamePromptState({
                  open: true,
                  allowSkip: !isGoogle,
                  suggested: baseSuggested.length >= 3 ? baseSuggested : '',
                });
              }
            }
          } else {
            setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
          }
        }
      } else {
        // Firebase emitted "no user". NEVER clear user/profile before checking `/api/auth/me`!
        const hasValidGuest = await resolveServerGuestSession();
        if (!isMounted) return;
        if (hasValidGuest) {
          return;
        }

        // Confirmed: neither a Firebase user nor an active guest session
        try {
          localStorage.removeItem('boardly_user_authenticated');
          localStorage.removeItem(GUEST_TOKEN_LS_KEY);
        } catch {
          // Ignore storage errors
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        setOtpVerificationState({
          status: 'idle',
          purpose: null,
          email: '',
          maskedEmail: '',
          cooldownSeconds: 0,
          error: null,
        });
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [retryCount, resolveServerGuestSession, evaluateUserVerificationGate]);

  // ── Sliding Guest Session Keep-Alive (tab focus + periodic refresh) ──────
  useEffect(() => {
    if (!isGuest) return;

    const refreshGuestSession = () => {
      void resolveServerGuestSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshGuestSession();
      }
    };

    const interval = setInterval(refreshGuestSession, 4 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isGuest, resolveServerGuestSession]);

  // ── Guest Mode Actions ───────────────────────────────────────────────────
  const checkUsernameAvailability = useCallback(async (rawUsername: string) => {
    try {
      const res = await fetch(
        `/api/auth/username-check?username=${encodeURIComponent(rawUsername.trim())}`,
        { method: 'GET', credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      return {
        available: Boolean(data?.available),
        username: String(data?.username || rawUsername.trim()),
        normalized: String(data?.normalized || rawUsername.trim().toLowerCase()),
        reason: data?.reason || null,
        code: data?.code || null,
      };
    } catch {
      return {
        available: false,
        username: rawUsername.trim(),
        normalized: rawUsername.trim().toLowerCase(),
        reason: 'Could not verify username availability. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }, []);

  const signInAsGuest = useCallback(
    async (username: string, targetUniversity = 'General Prep'): Promise<UserProfile> => {
      setAuthError(null);
      const deviceId = getOrCreateClientDeviceId();
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({
          username: username.trim(),
          deviceId,
          targetUniversity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.guest) {
        const err: any = new Error(
          data?.error || 'Could not create guest session. Please try another username.'
        );
        err.code = data?.code || 'GUEST_CREATION_FAILED';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      const g = data.guest;
      const sessionToken = String(data.sessionToken || '');
      try {
        if (sessionToken) {
          localStorage.setItem(GUEST_TOKEN_LS_KEY, sessionToken);
        }
        localStorage.setItem('boardly_user_authenticated', 'true');
      } catch {
        // Ignore storage error
      }
      setStoredGuestSessionToken(sessionToken || `${g.uid}.cookie_session`);

      setGuestSessionToken(sessionToken);
      void recordLegalConsentOnServer({
        userId: g.uid,
        accountType: 'guest',
        actionContext: 'guest_signin',
        documentVersion: LEGAL_DOCUMENT_VERSION,
      });
      const synthUser = buildSyntheticGuestUser(g.uid, g.username, sessionToken);
      const guestProfile: UserProfile = {
        uid: g.uid,
        email: '',
        displayName: g.displayName || g.username,
        name: g.displayName || g.username,
        username: g.username,
        shortId: g.shortId || 'GUEST',
        role: 'student',
        customRole: 'Guest',
        plan: 'free',
        status: 'active',
        isGuest: true,
        accountType: 'guest',
        profileCompleted: true,
        onboardingCompleted: true,
        targetUniversity: g.targetUniversity || targetUniversity,
        testsCompleted: Number(g.testsCompleted || 0),
        totalQuestionsSolved: Number(g.totalQuestionsSolved || 0),
        streak: Number(g.streak || 0),
        lastActiveAt: g.lastActiveAt || Date.now(),
      };

      setUser(synthUser);
      setProfile(guestProfile);
      setOtpVerificationState({
        status: 'verified',
        purpose: null,
        email: '',
        maskedEmail: `@${g.username}`,
        cooldownSeconds: 0,
        error: null,
      });
      setProfileLoading(false);
      return guestProfile;
    },
    []
  );

  const syncGuestProgress = useCallback(
    async (updates: {
      testsCompleted?: number;
      totalQuestionsSolved?: number;
      streak?: number;
      targetUniversity?: string;
      stats?: Record<string, any>;
      attempts?: any[];
    }) => {
      if (!isGuest) return;
      try {
        const token = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['X-Guest-Session'] = token;

        await fetch('/api/auth/guest/sync', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify(updates),
        });
      } catch {
        // Non-fatal background sync
      }
    },
    [isGuest, guestSessionToken]
  );

  const upgradeGuestWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<GuestUpgradeResult> => {
      if (!isGuest || !profile?.uid) {
        return { ok: false, error: 'No active guest account to upgrade.' };
      }
      setAuthError(null);
      const cleanEmail = email.trim().toLowerCase();
      const guestUid = profile.uid;
      const guestUsername = profile.username || profile.displayName || 'Student';
      const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';

      try {
        // 1. Create the Firebase Auth credentials for the email/password
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const newFirebaseUser = credential.user;
        const idToken = await newFirebaseUser.getIdToken();

        // 2. Upgrade the guest account in-place on D1 (`/api/auth/guest/upgrade`)
        const upgRes = await fetch('/api/auth/guest/upgrade', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
          },
          body: JSON.stringify({
            guestUid,
            guestSessionToken: savedGuestToken,
            newUid: newFirebaseUser.uid,
            email: cleanEmail,
            displayName: displayName?.trim() || guestUsername,
            signInProvider: 'password',
          }),
        });
        const upgData = await upgRes.json().catch(() => ({}));

        if (upgRes.status === 409 || upgData?.code === 'ACCOUNT_ALREADY_EXISTS') {
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: cleanEmail,
            error:
              upgData?.error ||
              'An account with this email already exists. Please log in instead.',
          };
        }

        if (!upgRes.ok || !upgData?.ok) {
          return {
            ok: false,
            error: upgData?.error || 'Could not upgrade guest account. Please try again.',
          };
        }

        // 3. Migrate Commons posts, comments, likes, saves & attempts in D1 store
        await fetch('/api/posts/migrate-guest', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestUid,
            newUid: newFirebaseUser.uid,
            username: guestUsername,
          }),
        }).catch(() => {});

        // 4. Write upgraded profile to Firestore preserving username, progress, attempts, and stats
        const preservedName = displayName?.trim() || guestUsername;
        try {
          await firebaseUpdateProfile(newFirebaseUser, { displayName: preservedName });
        } catch {
          // Non-fatal
        }

        const upgradedProfileDoc: UserProfile = {
          uid: newFirebaseUser.uid,
          email: cleanEmail,
          displayName: preservedName,
          name: preservedName,
          username: guestUsername,
          shortId: upgData.shortId || profile.shortId || deriveFallbackShortId(newFirebaseUser.uid),
          role: 'student',
          plan: 'free',
          status: 'active',
          isGuest: false,
          accountType: 'registered',
          profileCompleted: true,
          onboardingCompleted: true,
          targetUniversity: upgData.targetUniversity || profile.targetUniversity || 'General Prep',
          testsCompleted: Number(upgData.testsCompleted ?? profile.testsCompleted ?? 0),
          totalQuestionsSolved: Number(
            upgData.totalQuestionsSolved ?? profile.totalQuestionsSolved ?? 0
          ),
          streak: Number(upgData.streak ?? profile.streak ?? 0),
        };

        const { role: _r1, plan: _p1, status: _s1, ...safeUpgradedEmailDoc } = upgradedProfileDoc;
        await setDoc(
          doc(db, 'users', newFirebaseUser.uid),
          {
            ...safeUpgradedEmailDoc,
            emailVerified: true,
            upgradedFromGuestUid: guestUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        await setDoc(
          doc(db, 'publicProfiles', newFirebaseUser.uid),
          {
            uid: newFirebaseUser.uid,
            displayName: preservedName,
            username: guestUsername,
            studentId: upgradedProfileDoc.shortId,
            role: 'student',
            stats: {
              streak: upgradedProfileDoc.streak || 0,
              testsCompleted: upgradedProfileDoc.testsCompleted || 0,
              totalQuestionsSolved: upgradedProfileDoc.totalQuestionsSolved || 0,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        // Carry over guest test attempts into Firestore attempts/{attemptId} for the new registered UID
        if (Array.isArray(upgData.attempts)) {
          for (const rawAtt of upgData.attempts) {
            if (rawAtt && typeof rawAtt === 'object') {
              const attId = String(rawAtt.id || rawAtt.attemptId || '');
              if (attId) {
                await setDoc(
                  doc(db, 'attempts', attId),
                  {
                    ...rawAtt,
                    id: attId,
                    uid: newFirebaseUser.uid,
                    userId: newFirebaseUser.uid,
                    upgradedFromGuestUid: guestUid,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              }
            }
          }
        }

        try {
          localStorage.removeItem(GUEST_TOKEN_LS_KEY);
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        setUser(newFirebaseUser);
        setProfile(upgradedProfileDoc);
        setOtpVerificationState({
          status: 'verified',
          purpose: null,
          email: cleanEmail,
          maskedEmail: maskEmailClient(cleanEmail),
          cooldownSeconds: 0,
          error: null,
        });
        return { ok: true };
      } catch (err: any) {
        const code = String(err?.code || '');
        if (code === 'auth/email-already-in-use') {
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: cleanEmail,
            error:
              'This email already belongs to another Boardly account. Would you like to log in instead?',
          };
        }
        return {
          ok: false,
          error: err?.message || 'Could not upgrade guest account.',
        };
      }
    },
    [isGuest, profile, guestSessionToken]
  );

  const upgradeGuestWithGoogle = useCallback(async (): Promise<GuestUpgradeResult> => {
    if (!isGuest || !profile?.uid) {
      return { ok: false, error: 'No active guest account to upgrade.' };
    }
    setAuthError(null);
    const guestUid = profile.uid;
    const guestUsername = profile.username || profile.displayName || 'Student';
    const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
    const snapshotGuestProfile = { ...profile };

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(auth, provider);
      const googleUser = credential?.user;
      if (!googleUser) {
        return { ok: false, error: 'Google sign-in was cancelled.' };
      }

      // Check if this Google user already has an existing registered profile in Firestore
      const existingSnap = await getDoc(doc(db, 'users', googleUser.uid)).catch(() => null);
      if (
        existingSnap &&
        typeof existingSnap.exists === 'function' &&
        existingSnap.exists()
      ) {
        const existingData = existingSnap.data();
        if (
          existingData &&
          existingData.onboardingCompleted === true &&
          existingData.upgradedFromGuestUid !== guestUid
        ) {
          // Revert Firebase popup login so guest session is not lost unless they choose to log in
          await firebaseSignOut(auth).catch(() => {});
          const synth = buildSyntheticGuestUser(
            guestUid,
            guestUsername,
            savedGuestToken || `${guestUid}.cookie_session`
          );
          setUser(synth);
          setProfile(snapshotGuestProfile);
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: googleUser.email || undefined,
            error:
              'This Google account already belongs to an existing Boardly user. Would you like to log in to that account instead?',
          };
        }
      }

      const idToken = await googleUser.getIdToken();
      const upgRes = await fetch('/api/auth/guest/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
        },
        body: JSON.stringify({
          guestUid,
          guestSessionToken: savedGuestToken,
          newUid: googleUser.uid,
          email: googleUser.email || '',
          displayName: googleUser.displayName || guestUsername,
          signInProvider: 'google.com',
        }),
      });
      const upgData = await upgRes.json().catch(() => ({}));

      if (upgRes.status === 409 || upgData?.code === 'ACCOUNT_ALREADY_EXISTS') {
        await firebaseSignOut(auth).catch(() => {});
        const synth = buildSyntheticGuestUser(
          guestUid,
          guestUsername,
          savedGuestToken || `${guestUid}.cookie_session`
        );
        setUser(synth);
        setProfile(snapshotGuestProfile);
        return {
          ok: false,
          existingAccountConflict: true,
          existingEmail: googleUser.email || undefined,
          error:
            upgData?.error ||
            'This Google account already belongs to another user. Please log in instead.',
        };
      }

      await fetch('/api/posts/migrate-guest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestUid,
          newUid: googleUser.uid,
          username: guestUsername,
        }),
      }).catch(() => {});

      const upgradedProfileDoc: UserProfile = {
        uid: googleUser.uid,
        email: (googleUser.email || '').toLowerCase(),
        displayName: guestUsername,
        name: googleUser.displayName || guestUsername,
        username: guestUsername,
        photoURL: null,
        shortId: upgData?.shortId || snapshotGuestProfile.shortId || deriveFallbackShortId(googleUser.uid),
        role: 'student',
        plan: 'free',
        status: 'active',
        isGuest: false,
        accountType: 'registered',
        profileCompleted: true,
        onboardingCompleted: true,
        targetUniversity:
          upgData?.targetUniversity || snapshotGuestProfile.targetUniversity || 'General Prep',
        testsCompleted: Number(
          upgData?.testsCompleted ?? snapshotGuestProfile.testsCompleted ?? 0
        ),
        totalQuestionsSolved: Number(
          upgData?.totalQuestionsSolved ?? snapshotGuestProfile.totalQuestionsSolved ?? 0
        ),
        streak: Number(upgData?.streak ?? snapshotGuestProfile.streak ?? 0),
      };

      const { role: _r2, plan: _p2, status: _s2, ...safeUpgradedGoogleDoc } = upgradedProfileDoc;
      await setDoc(
        doc(db, 'users', googleUser.uid),
        {
          ...safeUpgradedGoogleDoc,
          emailVerified: true,
          upgradedFromGuestUid: guestUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      await setDoc(
        doc(db, 'publicProfiles', googleUser.uid),
        {
          uid: googleUser.uid,
          displayName: guestUsername,
          username: guestUsername,
          studentId: upgradedProfileDoc.shortId,
          role: 'student',
          stats: {
            streak: upgradedProfileDoc.streak || 0,
            testsCompleted: upgradedProfileDoc.testsCompleted || 0,
            totalQuestionsSolved: upgradedProfileDoc.totalQuestionsSolved || 0,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      if (Array.isArray(upgData?.attempts)) {
        for (const rawAtt of upgData.attempts) {
          if (rawAtt && typeof rawAtt === 'object') {
            const attId = String(rawAtt.id || rawAtt.attemptId || '');
            if (attId) {
              await setDoc(
                doc(db, 'attempts', attId),
                {
                  ...rawAtt,
                  id: attId,
                  uid: googleUser.uid,
                  userId: googleUser.uid,
                  upgradedFromGuestUid: guestUid,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch(() => {});
            }
          }
        }
      }

      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
        localStorage.setItem('boardly_user_authenticated', 'true');
      } catch {
        // Ignore
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);
      setUser(googleUser);
      setProfile(upgradedProfileDoc);
      setOtpVerificationState({
        status: 'verified',
        purpose: null,
        email: googleUser.email || '',
        maskedEmail: maskEmailClient(googleUser.email || ''),
        cooldownSeconds: 0,
        error: null,
      });
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Could not upgrade guest account with Google.',
      };
    }
  }, [isGuest, profile, guestSessionToken]);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setAuthError(null);
      const rawIdentifier = identifier.trim();
      const genericMsg = 'Invalid username/email or password';

      // Clear any previous guest token in local storage when explicitly logging into a registered account
      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);

      let loggedInUser: User;

      if (!rawIdentifier.includes('@')) {
        // Username login: resolve username -> email and verify password on the server (`/api/auth/login-username`)
        // without EVER exposing the account's email to the browser!
        const res = await fetch('/api/auth/login-username', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: rawIdentifier,
            password,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !data?.tokenResponse?.idToken) {
          const isRateLimited = res.status === 429 || data?.code === 'RATE_LIMITED';
          const err: any = new Error(
            isRateLimited
              ? data?.error || 'Too many login attempts. Please wait a few minutes and try again.'
              : genericMsg
          );
          err.code = isRateLimited ? 'auth/too-many-requests' : 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }

        const serverTokenResponse = data.tokenResponse;
        const customCredential = {
          providerId: 'password',
          signInMethod: 'password',
          toJSON: () => ({}),
          _getIdTokenResponse: async () => serverTokenResponse,
          _linkToIdToken: async () => serverTokenResponse,
          _reauthenticateWithIdToken: async () => serverTokenResponse,
        };

        try {
          const credential = await signInWithCredential(auth, customCredential as any);
          loggedInUser = credential.user;
        } catch {
          const err: any = new Error(genericMsg);
          err.code = 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      } else {
        // Email login
        const cleanEmail = rawIdentifier.toLowerCase();
        try {
          const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          loggedInUser = credential.user;
        } catch (firebaseErr: any) {
          const fCode = String(firebaseErr?.code || '');
          if (fCode === 'auth/too-many-requests') {
            throw firebaseErr;
          }
          // Enforce identical generic error message for wrong email / wrong password
          const err: any = new Error(genericMsg);
          err.code = 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      }

      await evaluateUserVerificationGate(loggedInUser, true);
    },
    [evaluateUserVerificationGate]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, username?: string) => {
      setAuthError(null);

      // 1. Validate & pre-check username before creating Firebase user
      const rawUsername = String(username || '').trim();
      const formatCheck = validateUsernameFormat(rawUsername);
      if (!formatCheck.valid) {
        const err: any = new Error(formatCheck.reason || 'Please enter a valid username.');
        err.code = 'INVALID_USERNAME_FORMAT';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      const preCheck = await checkUsernameAvailability(formatCheck.clean);
      if (!preCheck.available) {
        const err: any = new Error(preCheck.reason || 'This username is already taken.');
        err.code = preCheck.code || 'USERNAME_TAKEN';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);

      const cleanEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const { user: newUser } = credential;

      // 2. Atomically reserve the username in D1 `user_usernames` with the new user's UID & email.
      // If reservation fails (e.g. simultaneous signup race condition), roll back by deleting the Firebase user!
      try {
        const idToken = await newUser.getIdToken();
        const regRes = await fetch('/api/auth/username-register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: newUser.uid,
            username: formatCheck.clean,
            email: cleanEmail,
            accountType: 'registered',
          }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok || !regData?.ok) {
          await deleteUser(newUser).catch(() => {});
          await firebaseSignOut(auth).catch(() => {});
          const err: any = new Error(
            regData?.error || 'That username was just taken. Please choose another username.'
          );
          err.code = regData?.code || 'USERNAME_TAKEN';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      } catch (reserveErr: any) {
        if (reserveErr?.code === 'USERNAME_TAKEN' || reserveErr?.code === 'USERNAME_TAKEN_OR_SIMILAR' || reserveErr?.code === 'INVALID_USERNAME_FORMAT') {
          throw reserveErr;
        }
        await deleteUser(newUser).catch(() => {});
        await firebaseSignOut(auth).catch(() => {});
        const err: any = new Error(
          reserveErr?.message || 'Could not reserve username. Please try again.'
        );
        err.code = 'USERNAME_RESERVATION_FAILED';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      try {
        localStorage.removeItem('boardly_user_authenticated');
      } catch {
        // Ignore storage errors
      }

      setOtpVerificationState({
        status: 'pending',
        purpose: 'signup',
        email: cleanEmail,
        maskedEmail: maskEmailClient(cleanEmail),
        cooldownSeconds: 60,
        error: null,
      });

      // Resolve and save displayName immediately
      const resolvedName =
        displayName?.trim() ||
        formatCheck.clean ||
        (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Student');

      try {
        await firebaseUpdateProfile(newUser, { displayName: resolvedName });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile displayName:', err);
      }

      // Clean up any leftover orphan profile records with the same email under an old UID
      try {
        const orphanPubSnap = await getDocs(
          query(collection(db, 'publicProfiles'), where('email', '==', cleanEmail))
        ).catch(() => null);
        if (orphanPubSnap && !orphanPubSnap.empty) {
          for (const d of orphanPubSnap.docs) {
            if (d.id !== newUser.uid) {
              await deleteDoc(doc(db, 'publicProfiles', d.id)).catch(() => {});
              await deleteDoc(doc(db, 'users', d.id)).catch(() => {});
            }
          }
        }
      } catch {
        // Non-fatal orphan cleanup
      }

      // Write the initial user document with username and emailVerified: false
      const userDocRef = doc(db, 'users', newUser.uid);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            uid: newUser.uid,
            name: resolvedName,
            displayName: resolvedName,
            username: formatCheck.clean,
            usernameLower: formatCheck.normalized,
            email: cleanEmail,
            photoURL: null,
            role: 'student',
            plan: 'free',
            status: 'active',
            deleted: false,
            emailVerified: false,
            onboardingCompleted: false,
            legalDocumentVersion: LEGAL_DOCUMENT_VERSION,
            termsAcceptedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        6000
      );

      void recordLegalConsentOnServer({
        userId: newUser.uid,
        accountType: 'registered',
        actionContext: 'email_signup',
        documentVersion: LEGAL_DOCUMENT_VERSION,
      });

      // Send 6-digit verification code + fallback link via Worker + Resend
      await requestOtpCodeForUser(newUser, {
        purpose: 'signup',
        forceResend: false,
      });

      createReferralDoc(newUser.uid, cleanEmail).catch(() => {});
    },
    [checkUsernameAvailability, createReferralDoc, requestOtpCodeForUser]
  );

  // ── Pure popup-only Google sign-in (no redirects, no device branching) ───
  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      localStorage.removeItem(GUEST_TOKEN_LS_KEY);
    } catch {
      // Ignore storage errors
    }
    setStoredGuestSessionToken(null);
    setGuestSessionToken(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // ONLY signInWithPopup - modern mobile browsers support popup on direct user tap
      const credential = await signInWithPopup(auth, provider);
      if (credential?.user) {
        setUser(credential.user);
        await evaluateUserVerificationGate(credential.user, true);
        // Load profile with timeout; non-fatal if Firestore rules are slow
        try {
          await loadProfile(credential.user);
        } catch (dbErr) {
          console.warn('[Boardly Auth] Profile sync issue during Google sign-in:', dbErr);
        }
        return credential.user;
      }
      return null;
    } catch (popupErr: unknown) {
      const fe = popupErr as { code?: string; message?: string };

      // 1. User intentionally closed or cancelled popup window
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }

      // 2. Popup blocked by browser
      if (fe.code === 'auth/popup-blocked') {
        const errPayload = {
          code: 'auth/popup-blocked',
          message:
            'The sign-in popup was blocked by your browser. Please tap "Continue with Google" again and choose "Allow" when prompted.',
        };
        setAuthError(errPayload);
        throw popupErr;
      }

      // 3. Other Firebase auth error (e.g. auth/unauthorized-domain, auth/network-request-failed)
      const errPayload = {
        code: fe.code || 'auth/popup-failed',
        message: fe.message || 'Google sign-in could not be completed.',
      };
      setAuthError(errPayload);
      throw popupErr;
    }
  }, [loadProfile, evaluateUserVerificationGate]);

  const executeForceSignOut = useCallback(async () => {
    setAuthError(null);
    const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
    const guestUid = isGuest ? profile?.uid || user?.uid || '' : '';
    try {
      localStorage.removeItem('boardly_user_authenticated');
      localStorage.removeItem(GUEST_TOKEN_LS_KEY);
    } catch {
      // Ignore storage errors
    }
    setStoredGuestSessionToken(null);
    setGuestSessionToken(null);
    if (savedGuestToken || isGuest) {
      await fetch('/api/auth/guest/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
        },
        body: JSON.stringify({ uid: guestUid }),
      }).catch(() => {});
    }
    setOtpVerificationState({
      status: 'idle',
      purpose: null,
      email: '',
      maskedEmail: '',
      cooldownSeconds: 0,
      error: null,
    });
    setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth).catch(() => {});
  }, [guestSessionToken, isGuest, profile?.uid, user?.uid]);

  const signOutUser = useCallback(
    async (opts?: { force?: boolean }) => {
      if (isGuest && !opts?.force) {
        setShowGuestLogoutConfirm(true);
        return new Promise<void>((resolve) => {
          pendingGuestLogoutResolversRef.current.push(resolve);
        });
      }
      await executeForceSignOut();
    },
    [isGuest, executeForceSignOut]
  );

  const handleConfirmGuestLogout = useCallback(async () => {
    setGuestLogoutLoading(true);
    try {
      await executeForceSignOut();
      setShowGuestLogoutConfirm(false);
      const resolvers = [...pendingGuestLogoutResolversRef.current];
      pendingGuestLogoutResolversRef.current = [];
      for (const r of resolvers) {
        try {
          r();
        } catch {
          // Ignore
        }
      }
    } finally {
      setGuestLogoutLoading(false);
    }
  }, [executeForceSignOut]);

  const handleCancelGuestLogout = useCallback(() => {
    if (guestLogoutLoading) return;
    setShowGuestLogoutConfirm(false);
    pendingGuestLogoutResolversRef.current = [];
  }, [guestLogoutLoading]);

  const handleCreateAccountFromGuestLogout = useCallback(() => {
    if (guestLogoutLoading) return;
    setShowGuestLogoutConfirm(false);
    pendingGuestLogoutResolversRef.current = [];
    setShowGuestUpgradeFromLogout(true);
  }, [guestLogoutLoading]);

  const sendVerificationEmail = useCallback(async () => {
    if (user && !isGuest) {
      await requestOtpCodeForUser(user, {
        purpose: 'signup',
        forceResend: true,
      });
    }
  }, [user, isGuest, requestOtpCodeForUser]);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Call sendPasswordResetEmail WITHOUT restrictive continueUrl first to avoid
      // Firebase Identity Toolkit internal error -26 (auth/error-code:-26) on auth.boardly.cfd
      await withTimeout(
        sendPasswordResetEmail(auth, cleanEmail),
        12000,
        'Password reset request timed out.'
      );
      return;
    } catch (sdkErr: any) {
      const code = String(sdkErr?.code || '');
      const msg = String(sdkErr?.message || '');

      // If Firebase explicitly reports user-not-found or invalid-email, rethrow immediately
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        throw sdkErr;
      }

      // For auth/error-code:-26, unauthorized-continue-uri, or custom authDomain errors,
      // fallback to the server-side Identity Toolkit endpoint
      if (
        code.includes('-26') ||
        msg.includes('-26') ||
        code.includes('continue-uri') ||
        code === 'auth/internal-error' ||
        code === 'auth/network-request-failed'
      ) {
        const resp = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.success) {
          const fallbackErr: any = new Error(
            data?.error || 'Could not send password reset email.'
          );
          fallbackErr.code = data?.code || code || 'auth/error-code:-26';
          throw fallbackErr;
        }
        return;
      }

      throw sdkErr;
    }
  }, []);

  const retryProfile = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

  const updateLocalProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : ({ ...updates } as UserProfile)));
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      updateLocalProfile(updates);
      if (isGuest) {
        await syncGuestProgress({
          testsCompleted: updates.testsCompleted,
          totalQuestionsSolved: updates.totalQuestionsSolved,
          streak: updates.streak,
          targetUniversity: updates.targetUniversity || undefined,
        });
        return;
      }
      if (user) {
        if (updates.username) {
          const idToken = await user.getIdToken().catch(() => '');
          fetch('/api/auth/username-register', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              uid: user.uid,
              username: updates.username,
              email: (user.email || profile?.email || '').toLowerCase(),
              accountType: 'registered',
            }),
          }).catch(() => {});
        }
        try {
          const safeUpdates: Record<string, unknown> = { ...updates };
          for (const protectedKey of [
            'plan',
            'tier',
            'kobans',
            'kobanBalance',
            'role',
            'proUntil',
            'paid_until',
            'planExpiresAt',
            'premiumExpiresAt',
            'isPremium',
            'proPlanId',
            'status',
          ]) {
            delete safeUpdates[protectedKey];
          }
          await withTimeout(
            setDoc(doc(db, 'users', user.uid), safeUpdates, { merge: true }),
            6000,
            'Profile update timed out.'
          );
        } catch (e) {
          console.warn('[Boardly] updateProfile error:', e);
        }
      }
    },
    [user, isGuest, profile?.email, updateLocalProfile, syncGuestProgress]
  );

  const handleSaveModalUsername = useCallback(
    async (chosenUsername: string): Promise<{ ok: boolean; error?: string }> => {
      const currentUser = auth.currentUser || user;
      if (!currentUser || isGuest) {
        return { ok: false, error: 'Please sign in first.' };
      }
      const formatCheck = validateUsernameFormat(chosenUsername);
      if (!formatCheck.valid) {
        return { ok: false, error: formatCheck.reason || 'Invalid username format.' };
      }
      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch('/api/auth/username-register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: currentUser.uid,
            username: formatCheck.clean,
            email: (currentUser.email || profile?.email || '').toLowerCase(),
            accountType: 'registered',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          return {
            ok: false,
            error: data?.error || 'This username is already taken.',
          };
        }

        updateLocalProfile({ username: formatCheck.clean });
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            username: formatCheck.clean,
            usernameLower: formatCheck.normalized,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
        await setDoc(
          doc(db, 'publicProfiles', currentUser.uid),
          {
            uid: currentUser.uid,
            username: formatCheck.clean,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        try {
          localStorage.setItem(`boardly_username_prompt_seen_${currentUser.uid}`, '1');
        } catch {
          // Ignore
        }
        setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Could not save username.' };
      }
    },
    [user, isGuest, profile?.email, updateLocalProfile]
  );

  const handleSkipModalUsername = useCallback(() => {
    const currentUid = auth.currentUser?.uid || user?.uid;
    if (currentUid) {
      try {
        localStorage.setItem(`boardly_username_prompt_seen_${currentUid}`, '1');
      } catch {
        // Ignore
      }
    }
    setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
  }, [user?.uid]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      profileLoading,
      profileError,
      authError,
      clearAuthError,
      clearProfileError,
      isAdmin,
      isGuest,
      guestSessionToken,
      isSessionVerified,
      otpVerificationState,
      requestOtpCode,
      verifyOtpCode,
      verifyFallbackEmailLink,
      refreshVerificationStatus,
      checkUsernameAvailability,
      signInAsGuest,
      syncGuestProgress,
      upgradeGuestWithEmail,
      upgradeGuestWithGoogle,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      sendVerificationEmail,
      resetPassword,
      retryProfile,
      getRoleRedirectUrl,
      updateProfile,
      updateLocalProfile,
    }),
    [
      user,
      profile,
      profileLoading,
      profileError,
      authError,
      clearAuthError,
      clearProfileError,
      isAdmin,
      isGuest,
      guestSessionToken,
      isSessionVerified,
      otpVerificationState,
      requestOtpCode,
      verifyOtpCode,
      verifyFallbackEmailLink,
      refreshVerificationStatus,
      checkUsernameAvailability,
      signInAsGuest,
      syncGuestProgress,
      upgradeGuestWithEmail,
      upgradeGuestWithGoogle,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      sendVerificationEmail,
      resetPassword,
      retryProfile,
      getRoleRedirectUrl,
      updateProfile,
      updateLocalProfile,
    ]
  );

  const shouldRenderUsernameModal = Boolean(
    usernamePromptState.open &&
      !isGuest &&
      user &&
      isSessionVerified &&
      !profileLoading
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showGuestLogoutConfirm && (
        <Suspense fallback={null}>
          <GuestLogoutConfirmModal
            isOpen={showGuestLogoutConfirm}
            username={profile?.username || profile?.displayName}
            loading={guestLogoutLoading}
            onCancel={handleCancelGuestLogout}
            onCreateAccount={handleCreateAccountFromGuestLogout}
            onConfirmLogout={handleConfirmGuestLogout}
          />
        </Suspense>
      )}
      {showGuestUpgradeFromLogout && (
        <Suspense fallback={null}>
          <GuestUpgradeModal
            isOpen={showGuestUpgradeFromLogout}
            onClose={() => setShowGuestUpgradeFromLogout(false)}
            defaultReason="Create a free account to keep your username, progress, and test attempts permanently."
          />
        </Suspense>
      )}
      {shouldRenderUsernameModal && (
        <Suspense fallback={null}>
          <ChooseUsernameModal
            isOpen={shouldRenderUsernameModal}
            initialSuggestion={usernamePromptState.suggested}
            allowSkip={usernamePromptState.allowSkip}
            onSkip={handleSkipModalUsername}
            onCheckAvailability={checkUsernameAvailability}
            onSaveUsername={handleSaveModalUsername}
          />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
