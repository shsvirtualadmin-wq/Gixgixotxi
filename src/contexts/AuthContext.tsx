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
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: { code?: string; message: string; path?: string } | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryProfile: () => void;
  getRoleRedirectUrl: (customRole?: string) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isAdmin = !!(user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL);

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

  // ── Fetch / create user profile ──────────────────────────────────────────
  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);
    const path = `users/${firebaseUser.uid}`;
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;

        // Suspension check
        if (data.suspended === true || data.isSuspended === true) {
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
          setProfileError({
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
          setDoc(docRef, { displayName: fallbackName }, { merge: true }).catch(() => {});
        }

        setProfile(data);
      } else {
        // Safe fields only on first user creation (e.g. Google sign-in)
        const fallbackName =
          firebaseUser.displayName?.trim() ||
          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student');
        const newProfile: Partial<UserProfile> = {
          uid: firebaseUser.uid,
          email: (firebaseUser.email ?? '').toLowerCase(),
          displayName: fallbackName,
          role: 'student',
          plan: 'free',
          onboardingCompleted: false,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newProfile,
          createdAt: serverTimestamp(),
        });
        setProfile(newProfile as UserProfile);

        await createReferralDoc(firebaseUser.uid, firebaseUser.email ?? '');
      }
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      console.error(`[Boardly] Firestore profile read failed at ${path}:`, err);
      setProfileError({
        code: fe.code,
        message: fe.message ?? 'Failed to load your profile.',
        path,
      });
    } finally {
      setProfileLoading(false);
    }
  }, [createReferralDoc]);

  // Handle mobile redirect auth result if any
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (credential) => {
        if (credential?.user) {
          setUser(credential.user);
          await loadProfile(credential.user);
        }
      })
      .catch((err) => {
        console.warn('[Boardly] Redirect auth result:', err);
      });
  }, [loadProfile]);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
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
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: newUser } = credential;

      // Resolve and save displayName immediately
      const resolvedName =
        displayName?.trim() ||
        (email.includes('@') ? email.split('@')[0] : 'Student');

      try {
        await updateProfile(newUser, { displayName: resolvedName });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile displayName:', err);
      }

      // Create profile doc immediately with ONLY safe fields
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: email.toLowerCase(),
        displayName: resolvedName,
        role: 'student',
        plan: 'free',
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
      });

      // Send email verification
      try {
        await sendEmailVerification(newUser);
      } catch (e) {
        console.warn('Verification email send issue:', e);
      }

      await createReferralDoc(newUser.uid, email);
    },
    [createReferralDoc]
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (popupErr: unknown) {
      const fe = popupErr as { code?: string };
      // Fallback to signInWithRedirect when popup is blocked on mobile browsers
      if (
        fe.code === 'auth/popup-blocked' ||
        fe.code === 'auth/cancelled-popup-request' ||
        fe.code === 'auth/popup-closed-by-user'
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        throw popupErr;
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (user) await sendEmailVerification(user);
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const retryProfile = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileLoading,
        profileError,
        isAdmin,
        signIn,
        signUp,
        signInWithGoogle,
        signOutUser,
        sendVerificationEmail,
        resetPassword,
        retryProfile,
        getRoleRedirectUrl,
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
