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
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
    (profile as any)?.isSuperAdmin === true
  );

  // ── Helper to determine target dashboard URL by role ─────────────────────
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

        // Ensure displayName is populated without touching plan/role
        if (!loadedProfile.displayName || loadedProfile.displayName === 'Unnamed Student') {
          loadedProfile.displayName = fallbackName;
          setDoc(docRef, { displayName: fallbackName }, { merge: true }).catch(() => {});
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

  // ── Hard 3-second timeout on initial profileLoading to prevent stuck states ─
  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage errors in restricted contexts
        }
        // Warm-up read of config/{any} right after sign-in so the first connection is opened early
        getDoc(doc(db, 'config', 'app')).catch(() => {});

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
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: newUser } = credential;

      // Resolve and save displayName immediately
      const resolvedName =
        displayName?.trim() ||
        (email.includes('@') ? email.split('@')[0] : 'Student');

      try {
        await firebaseUpdateProfile(newUser, { displayName: resolvedName });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile displayName:', err);
      }

      // Create base user document ONLY if it doesn't already exist
      const userDocRef = doc(db, 'users', newUser.uid);
      const existingSnap = await getDoc(userDocRef).catch(() => null);
      if (!existingSnap || !existingSnap.exists()) {
        await withTimeout(
          setDoc(
            userDocRef,
            {
              uid: newUser.uid,
              name: resolvedName,
              displayName: resolvedName,
              email: email.toLowerCase(),
              photoURL: null,
              role: 'student',
              plan: 'free',
              status: 'active',
              onboardingCompleted: false,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          ),
          6000
        );
      }

      // Send email verification
      try {
        await sendEmailVerification(newUser);
      } catch (e) {
        console.warn('Verification email send issue:', e);
      }

      createReferralDoc(newUser.uid, email).catch(() => {});
    },
    [createReferralDoc]
  );

  // ── Pure popup-only Google sign-in (no redirects, no device branching) ───
  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // ONLY signInWithPopup - modern mobile browsers support popup on direct user tap
      const credential = await signInWithPopup(auth, provider);
      if (credential?.user) {
        setUser(credential.user);
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
    const actionCodeSettings = {
      url: 'https://boardly.cfd/login',
      handleCodeInApp: false,
    };
    await withTimeout(
      sendPasswordResetEmail(auth, email, actionCodeSettings),
      15000,
      'Password reset request timed out after 15 seconds.'
    );
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
            setDoc(doc(db, 'users', user.uid), updates, { merge: true }),
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
