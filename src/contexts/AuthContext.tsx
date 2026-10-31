import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
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
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types';
import { deriveFallbackShortId, ensureUserShortId } from '@/utils/shortId';
import { processAmbassadorReferralOnSignup } from '@/services/referralService';

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
const SUPER_ADMIN_EMAIL_SCHOLARIO = 'support@scholario.me';
const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
const REFERRAL_LS_KEY = 'boardly_ref_code';

function withTimeout<T>(
  promise: Promise<T>,
  ms = 12000,
  timeoutMsg = 'Operation timed out.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        const err = new Error(timeoutMsg);
        (err as unknown as { code: string }).code = 'api/timeout';
        reject(err);
      }, ms)
    ),
  ]);
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: { code?: string; message: string; path?: string } | null;
  authError: { code?: string; message: string } | null;
  clearAuthError: () => void;
  clearProfileError: () => void;
  isAdmin: boolean;
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

  const isAdmin = !!(
    (user?.uid && user.uid === SUPER_ADMIN_UID) ||
    (user?.email && (
      user.email.toLowerCase() === SUPER_ADMIN_EMAIL ||
      user.email.toLowerCase() === SUPER_ADMIN_EMAIL_SUPPORT ||
      user.email.toLowerCase() === SUPER_ADMIN_EMAIL_SCHOLARIO
    )) ||
    (profile?.uid && profile.uid === SUPER_ADMIN_UID) ||
    (profile?.email && (
      profile.email.toLowerCase() === SUPER_ADMIN_EMAIL ||
      profile.email.toLowerCase() === SUPER_ADMIN_EMAIL_SUPPORT ||
      profile.email.toLowerCase() === SUPER_ADMIN_EMAIL_SCHOLARIO
    )) ||
    profile?.role === 'admin' ||
    profile?.role === 'superadmin' ||
    (profile as unknown as { isSuperAdmin?: boolean })?.isSuperAdmin === true
  );

  const getRoleRedirectUrl = useCallback(
    (customRole?: string) => {
      if (isAdmin) return '/admin';
      const role = customRole || profile?.role || 'student';
      if (role === 'crew') return '/crew';
      if (role === 'captain') return '/captain';
      return '/dashboard';
    },
    [isAdmin, profile]
  );

  // ── Create referral document after first signup via D1 API ───────────────
  const createReferralDoc = useCallback(async (uid: string, email: string) => {
    const refCode = localStorage.getItem(REFERRAL_LS_KEY);
    if (!refCode) return;
    try {
      await api.post('/api/referrals/signup', {
        referrerCode: refCode,
        newUid: uid,
        newEmail: email.toLowerCase(),
      });
    } catch (err) {
      console.warn('[Boardly] Referral registration notice:', err);
    }
  }, []);

  // ── Fetch / create user profile from D1 (/api/users/me) ──────────────────
  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);
    const path = `/api/users/me`;

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
      shortId: deriveFallbackShortId(firebaseUser.uid),
    };

    try {
      let loadedProfile: UserProfile | null = null;
      let isNew = false;

      try {
        const res = await Promise.race([
          api.get<{ profile: UserProfile | null; isNew?: boolean }>('/api/users/me'),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
        ]);

        if (res && res.profile) {
          loadedProfile = res.profile;
          isNew = !!res.isNew;
        }
      } catch (readErr: unknown) {
        console.warn(`[Boardly] D1 user profile read notice at ${path}:`, readErr);
      }

      if (loadedProfile) {
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

        if (!loadedProfile.displayName || loadedProfile.displayName === 'Unnamed Student') {
          loadedProfile.displayName = fallbackName;
          api.put('/api/users/me', { displayName: fallbackName }).catch(() => {});
        }

        if (isNew) {
          createReferralDoc(firebaseUser.uid, firebaseUser.email ?? '').catch(() => {});
          processAmbassadorReferralOnSignup({
            newUid: firebaseUser.uid,
            newEmail: firebaseUser.email ?? '',
            newName: fallbackName,
            newShortId: loadedProfile.shortId || deriveFallbackShortId(firebaseUser.uid),
          }).catch(() => {});
          ensureUserShortId(firebaseUser.uid, loadedProfile.shortId).catch(() => {});
        }

        setProfile(loadedProfile);
      } else {
        setProfile(defaultProfile);
      }
    } catch (err: unknown) {
      console.warn(`[Boardly] D1 profile read fallback at ${path}:`, err);
      setProfile(defaultProfile);
    } finally {
      setProfileLoading(false);
    }
  }, [createReferralDoc]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage errors
        }
        loadProfile(firebaseUser).catch((err) => {
          console.warn('[Boardly Auth] onAuthStateChanged profile load error:', err);
        });
      } else {
        setProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
    });
    return unsubscribe;
  }, [loadProfile, retryCount]);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setAuthError(null);
      const cleanEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const { user: newUser } = credential;

      const resolvedName =
        displayName?.trim() ||
        (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Student');

      try {
        await firebaseUpdateProfile(newUser, { displayName: resolvedName });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile displayName:', err);
      }

      try {
        await withTimeout(
          api.put('/api/users/me', {
            uid: newUser.uid,
            name: resolvedName,
            displayName: resolvedName,
            email: cleanEmail,
            photoURL: null,
            role: 'student',
            plan: 'free',
            status: 'active',
            onboardingCompleted: false,
          }),
          6000
        );
      } catch (err) {
        console.warn('[Boardly] Initial D1 user doc creation notice:', err);
      }

      try {
        await sendEmailVerification(newUser);
      } catch (e) {
        console.warn('Verification email send issue:', e);
      }

      createReferralDoc(newUser.uid, cleanEmail).catch(() => {});
    },
    [createReferralDoc]
  );

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(auth, provider);
      if (credential?.user) {
        setUser(credential.user);
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

      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }

      if (fe.code === 'auth/popup-blocked') {
        const errPayload = {
          code: 'auth/popup-blocked',
          message:
            'The sign-in popup was blocked by your browser. Please tap "Continue with Google" again and choose "Allow" when prompted.',
        };
        setAuthError(errPayload);
        throw popupErr;
      }

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
    try {
      localStorage.removeItem('boardly_user_authenticated');
    } catch {
      // Ignore storage errors
    }
    await firebaseSignOut(auth);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (user) await sendEmailVerification(user);
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await withTimeout(
        sendPasswordResetEmail(auth, cleanEmail),
        12000,
        'Password reset request timed out.'
      );
      return;
    } catch (sdkErr: unknown) {
      const errObj = sdkErr as { code?: string; message?: string };
      const code = String(errObj?.code || '');
      const msg = String(errObj?.message || '');

      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        throw sdkErr;
      }

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
          const fallbackErr = new Error(
            data?.error || 'Could not send password reset email.'
          ) as Error & { code?: string };
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
      if (user) {
        try {
          await withTimeout(
            api.put('/api/users/me', updates),
            6000,
            'Profile update timed out.'
          );
        } catch (e) {
          console.warn('[Boardly] updateProfile error:', e);
        }
      }
    },
    [user, updateLocalProfile]
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
