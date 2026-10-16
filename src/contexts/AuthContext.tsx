import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
const REFERRAL_LS_KEY = 'boardly_ref_code';

// ─── Timeout Helper (prevents hanging Firestore calls from freezing auth) ────
function withTimeout<T>(
  promise: Promise<T>,
  ms = 6000,
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
    (user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL) ||
    profile?.role === 'admin'
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

  // ── Fetch / create user profile (protected with timeout & fallback) ────
  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);
    const path = `users/${firebaseUser.uid}`;

    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const snap = await withTimeout(
        getDoc(docRef),
        6000,
        'Profile lookup timed out. Check Firestore rules or connectivity.'
      );

      if (snap.exists()) {
        const data = snap.data() as UserProfile;

        // Suspension check
        if (data.suspended === true || data.isSuspended === true) {
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

        // Ensure displayName is populated and never Unnamed Student
        if (!data.displayName || data.displayName === 'Unnamed Student') {
          const fallbackName =
            firebaseUser.displayName?.trim() ||
            (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student');
          data.displayName = fallbackName;
          withTimeout(setDoc(docRef, { displayName: fallbackName }, { merge: true }), 4000).catch(() => {});
        }

        setProfile(data);
      } else {
        // Base user document required fields on first creation:
        const fallbackName =
          firebaseUser.displayName?.trim() ||
          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student');

        const baseUserDoc = {
          uid: firebaseUser.uid,
          name: fallbackName,
          displayName: fallbackName,
          email: (firebaseUser.email ?? '').toLowerCase(),
          photoURL: firebaseUser.photoURL ?? null,
          role: 'student',
          plan: 'free',
          status: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
        };

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: (firebaseUser.email ?? '').toLowerCase(),
          displayName: fallbackName,
          name: fallbackName,
          photoURL: firebaseUser.photoURL ?? null,
          role: 'student',
          plan: 'free',
          status: 'active',
          onboardingCompleted: false,
        };

        await withTimeout(
          setDoc(doc(db, 'users', firebaseUser.uid), baseUserDoc, { merge: true }),
          6000,
          'User record creation timed out. Check Firestore security rules.'
        );

        setProfile(newProfile);
        createReferralDoc(firebaseUser.uid, firebaseUser.email ?? '').catch(() => {});
      }
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      console.error(`[Boardly] Firestore profile read failed at ${path}:`, err);

      setProfileError({
        code: fe.code || 'firestore/unavailable',
        message:
          fe.message ??
          'Failed to load user profile from database. Operating with fallback session.',
        path,
      });

      // Crucial: Fallback in-memory profile so users are NEVER trapped on login screen
      const fallbackName =
        firebaseUser.displayName?.trim() ||
        (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student');
      setProfile({
        uid: firebaseUser.uid,
        email: (firebaseUser.email ?? '').toLowerCase(),
        displayName: fallbackName,
        role: 'student',
        plan: 'free',
        onboardingCompleted: true,
      });
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

      // Create base user document immediately with all required fields
      await withTimeout(
        setDoc(doc(db, 'users', newUser.uid), {
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
        }, { merge: true }),
        6000
      );

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
    await firebaseSignOut(auth);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (user) await sendEmailVerification(user);
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    await sendPasswordResetEmail(auth, email);
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
