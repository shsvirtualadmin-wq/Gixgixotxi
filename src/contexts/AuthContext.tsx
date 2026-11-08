import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
import { setStoredGuestSessionToken } from '@/lib/api';
import type { UserProfile } from '@/types';
import { debugTracker } from '@/utils/debugTracker';
import { deriveFallbackShortId, ensureUserShortId } from '@/utils/shortId';
import { processAmbassadorReferralOnSignup } from '@/services/referralService';

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
const SUPER_ADMIN_EMAIL_SCHOLARIO = 'support@scholario.me';
const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
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
  purpose: 'login' | 'signup' | null;
  email: string;
  maskedEmail: string;
  cooldownSeconds: number;
  error: string | null;
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
    purpose?: 'login' | 'signup';
    forceResend?: boolean;
  }) => Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }>;
  verifyOtpCode: (code: string) => Promise<{
    ok: boolean;
    error?: string;
    locked?: boolean;
    attemptsRemaining?: number;
  }>;
  verifyFallbackEmailLink: (
    token: string,
    uid?: string
  ) => Promise<{ ok: boolean; error?: string }>;
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
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
    ((user?.uid && user.uid === SUPER_ADMIN_UID) ||
      (user?.email &&
        (user.email.toLowerCase() === SUPER_ADMIN_EMAIL ||
          user.email.toLowerCase() === SUPER_ADMIN_EMAIL_SUPPORT ||
          user.email.toLowerCase() === SUPER_ADMIN_EMAIL_SCHOLARIO)) ||
      (profile?.uid && profile.uid === SUPER_ADMIN_UID) ||
      (profile?.email &&
        (profile.email.toLowerCase() === SUPER_ADMIN_EMAIL ||
          profile.email.toLowerCase() === SUPER_ADMIN_EMAIL_SUPPORT ||
          profile.email.toLowerCase() === SUPER_ADMIN_EMAIL_SCHOLARIO)) ||
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
    const isSuperAdminAccount =
      firebaseUser.uid === SUPER_ADMIN_UID ||
      emailLower === SUPER_ADMIN_EMAIL ||
      emailLower === SUPER_ADMIN_EMAIL_SUPPORT ||
      emailLower === SUPER_ADMIN_EMAIL_SCHOLARIO;

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
      photoURL: firebaseUser.photoURL ?? null,
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
          loadedProfile = snap.data() as UserProfile;
        } else if (snap && typeof snap.exists === 'function' && !snap.exists()) {
          // Truly new user: initialize clean defaults
          const baseUserDoc: UserProfile = {
            uid: firebaseUser.uid,
            name: fallbackName,
            displayName: fallbackName,
            email: emailLower,
            photoURL: firebaseUser.photoURL ?? null,
            role: isSuperAdminAccount ? 'admin' : 'student',
            plan: isSuperAdminAccount ? 'pro' : 'free',
            status: 'active',
            profileCompleted: isSuperAdminAccount ? true : false,
            onboardingCompleted: isSuperAdminAccount ? true : false,
            streak: 0,
            shortId: deriveFallbackShortId(firebaseUser.uid),
          };
          await setDoc(docRef, {
            ...baseUserDoc,
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

        // Ensure displayName and default Student role are populated silently
        const silentPatches: Record<string, unknown> = {};
        if (!loadedProfile.displayName || loadedProfile.displayName === 'Unnamed Student') {
          loadedProfile.displayName = fallbackName;
          silentPatches.displayName = fallbackName;
        }
        if (!loadedProfile.role) {
          loadedProfile.role = isSuperAdminAccount ? 'admin' : 'student';
          silentPatches.role = loadedProfile.role;
        }
        if (Object.keys(silentPatches).length > 0) {
          setDoc(docRef, silentPatches, { merge: true }).catch(() => {});
        }

        setProfile(loadedProfile);
      } else {
        // Doc read timed out or failed — use fallback profile in-memory ONLY.
        // NEVER write this fallback profile to Firestore, as that would overwrite the user's real plan!
        console.warn(`[Boardly] Profile read timed out or offline at ${path}. Keeping in-memory fallback.`);
        setProfile(defaultProfile);
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
      opts?: { purpose?: 'login' | 'signup'; forceResend?: boolean }
    ): Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }> => {
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            purpose: opts?.purpose,
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

        setOtpVerificationState({
          status: 'pending',
          purpose: data.purpose || opts?.purpose || 'login',
          email: firebaseUser.email || '',
          maskedEmail: masked,
          cooldownSeconds: cooldown || 60,
          error: null,
        });

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
    async (opts?: { purpose?: 'login' | 'signup'; forceResend?: boolean }) => {
      const targetUser = auth.currentUser || user;
      if (!targetUser) {
        return { ok: false, error: 'Please sign in first.' };
      }
      return requestOtpCodeForUser(targetUser, opts);
    },
    [user, requestOtpCodeForUser]
  );

  // ── Verify 6-digit OTP code via Worker (`/api/auth/verify-code`) ─────────
  const verifyOtpCode = useCallback(
    async (
      code: string
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
        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            code: code.trim(),
            purpose: otpVerificationState.purpose || undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          verified?: boolean;
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

  // ── Auth state listener (Single Source of Truth with `/api/auth/me`) ─────
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        if (isGoogleProviderUser(firebaseUser)) {
          try {
            localStorage.setItem('boardly_user_authenticated', 'true');
          } catch {
            // Ignore storage errors
          }
          setOtpVerificationState({
            status: 'verified',
            purpose: null,
            email: firebaseUser.email || '',
            maskedEmail: maskEmailClient(firebaseUser.email || ''),
            cooldownSeconds: 0,
            error: null,
          });
        } else {
          // Check server-side D1 verification status for this email + password session
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
            const idToken = await firebaseUser.getIdToken();
            const statusRes = await fetch('/api/auth/verification-status', {
              credentials: 'include',
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            });
            const statusData = (await statusRes.json().catch(() => ({}))) as {
              ok?: boolean;
              verified?: boolean;
              requiredPurpose?: 'login' | 'signup' | null;
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
                maskedEmail:
                  statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
                cooldownSeconds: 0,
                error: null,
              });
            } else {
              try {
                localStorage.removeItem('boardly_user_authenticated');
              } catch {
                // Ignore storage errors
              }
              const requiredPurpose =
                statusData.requiredPurpose ||
                (firebaseUser.emailVerified ? 'login' : 'signup');

              setOtpVerificationState({
                status: 'pending',
                purpose: requiredPurpose,
                email: firebaseUser.email || '',
                maskedEmail:
                  statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
                cooldownSeconds: Number(statusData.cooldownSeconds || 0),
                error: null,
              });

              if (
                !statusData.hasActiveCode &&
                (!statusData.cooldownSeconds || statusData.cooldownSeconds <= 0)
              ) {
                void requestOtpCodeForUserRef.current(firebaseUser, {
                  purpose: requiredPurpose,
                  forceResend: false,
                });
              }
            }
          } catch {
            try {
              localStorage.removeItem('boardly_user_authenticated');
            } catch {
              // Ignore storage errors
            }
            setOtpVerificationState((prev) => ({
              status: 'pending',
              purpose: prev.purpose || (firebaseUser.emailVerified ? 'login' : 'signup'),
              email: firebaseUser.email || '',
              maskedEmail: maskEmailClient(firebaseUser.email || ''),
              cooldownSeconds: prev.cooldownSeconds,
              error: prev.error,
            }));
          }
        }

        // Warm-up read of config/{any} right after sign-in so the first connection is opened early
        getDoc(doc(db, 'config', 'app')).catch(() => {});

        await loadProfileRef.current(firebaseUser).catch((err) => {
          console.warn('[Boardly Auth] onAuthStateChanged profile load error:', err);
        });

        // Also sync server-side username from `/api/auth/me` if registered user has one in D1
        try {
          const idToken = await firebaseUser.getIdToken();
          const meRes = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const meData = await meRes.json().catch(() => ({}));
          if (meRes.ok && meData?.user?.username) {
            setProfile((prev) =>
              prev && !prev.username ? { ...prev, username: meData.user.username } : prev
            );
          }
        } catch {
          // Non-fatal
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
  }, [retryCount, resolveServerGuestSession]);

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

        await setDoc(
          doc(db, 'users', newFirebaseUser.uid),
          {
            ...upgradedProfileDoc,
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
        photoURL: googleUser.photoURL || null,
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

      await setDoc(
        doc(db, 'users', googleUser.uid),
        {
          ...upgradedProfileDoc,
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
    async (email: string, password: string) => {
      setAuthError(null);
      // Clear any previous guest session when explicitly logging into a registered account
      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);
      fetch('/api/auth/guest/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

      const cleanEmail = email.trim().toLowerCase();
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const loggedInUser = credential.user;

      try {
        localStorage.removeItem('boardly_user_authenticated');
      } catch {
        // Ignore storage errors
      }

      const purpose: 'login' | 'signup' = loggedInUser.emailVerified ? 'login' : 'signup';
      setOtpVerificationState({
        status: 'pending',
        purpose,
        email: loggedInUser.email || cleanEmail,
        maskedEmail: maskEmailClient(loggedInUser.email || cleanEmail),
        cooldownSeconds: 60,
        error: null,
      });

      await requestOtpCodeForUser(loggedInUser, {
        purpose,
        forceResend: false,
      });
    },
    [requestOtpCodeForUser]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setAuthError(null);
      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);
      fetch('/api/auth/guest/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

      const cleanEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const { user: newUser } = credential;

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

      // Write the initial user document with emailVerified: false
      const userDocRef = doc(db, 'users', newUser.uid);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            uid: newUser.uid,
            name: resolvedName,
            displayName: resolvedName,
            email: cleanEmail,
            photoURL: null,
            role: 'student',
            plan: 'free',
            status: 'active',
            deleted: false,
            emailVerified: false,
            onboardingCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        6000
      );

      // Send 6-digit verification code + fallback link via Worker + Resend
      await requestOtpCodeForUser(newUser, {
        purpose: 'signup',
        forceResend: false,
      });

      createReferralDoc(newUser.uid, cleanEmail).catch(() => {});
    },
    [createReferralDoc, requestOtpCodeForUser]
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
    fetch('/api/auth/guest/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // ONLY signInWithPopup - modern mobile browsers support popup on direct user tap
      const credential = await signInWithPopup(auth, provider);
      if (credential?.user) {
        setUser(credential.user);
        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage errors
        }
        setOtpVerificationState({
          status: 'verified',
          purpose: null,
          email: credential.user.email || '',
          maskedEmail: maskEmailClient(credential.user.email || ''),
          cooldownSeconds: 0,
          error: null,
        });
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
  }, [loadProfile]);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
    try {
      localStorage.removeItem('boardly_user_authenticated');
      localStorage.removeItem(GUEST_TOKEN_LS_KEY);
    } catch {
      // Ignore storage errors
    }
    setStoredGuestSessionToken(null);
    setGuestSessionToken(null);
    if (savedGuestToken || isGuest) {
      fetch('/api/auth/guest/logout', {
        method: 'POST',
        credentials: 'include',
        headers: savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : undefined,
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
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth).catch(() => {});
  }, [guestSessionToken, isGuest]);

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
          fetch('/api/auth/username-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              username: updates.username,
              accountType: 'registered',
            }),
          }).catch(() => {});
        }
        try {
          await withTimeout(
            setDoc(doc(db, 'users', user.uid), updates, { merge: true }),
            6000,
            'Profile update timed out.'
          );
        } catch (e) {
          console.warn('[Boardly] updateProfile error:', e);
        }
      }
    },
    [user, isGuest, updateLocalProfile, syncGuestProgress]
  );

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

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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
