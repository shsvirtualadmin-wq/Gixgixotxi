import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  fetchUserProfile,
  saveUserProfile,
  StudentUserProfile,
} from '../lib/firebase';
import { PLAN_LIMITS, getKarachiTodayString } from '../data/planLimits';

export interface SignUpFormData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  preparingFor?: 'Engineering & CS' | 'Business & Finance' | 'Not sure';
  referralSource?: string;
  termsAccepted: boolean;
}

export interface AuthContextType {
  user: User | null;
  profile: StudentUserProfile | null;
  loading: boolean;
  sessionExpired: boolean;
  migratedBanner: boolean;
  dismissMigratedBanner: () => void;
  dismissSessionExpired: () => void;
  signInEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpEmail: (data: SignUpFormData) => Promise<{ success: boolean; error?: string }>;
  signInGoogle: () => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  reloadUserStatus: () => Promise<boolean>;
  updateProfileData: (fields: Partial<StudentUserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  friendlyErrorMessage: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function friendlyAuthError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please log in instead.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Your password must be at least 8 characters with an uppercase letter, lowercase letter, and a number.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please verify and try again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact support@boardly.cfd for assistance.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. For security, please wait a few minutes before trying again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for Boardly.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email address. Please sign in with your email and password to link them.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection lost. Please check your internet connection and try again.';
  }

  return msg.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '').trim() || 'An error occurred during authentication. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [migratedBanner, setMigratedBanner] = useState<boolean>(() => {
    return localStorage.getItem('boardly_migrated_banner_seen') !== 'true';
  });

  const dismissMigratedBanner = useCallback(() => {
    localStorage.setItem('boardly_migrated_banner_seen', 'true');
    setMigratedBanner(false);
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const syncProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }

    try {
      let p = await fetchUserProfile(firebaseUser.uid);
      const todayStr = getKarachiTodayString();

      if (!p) {
        // Create initial user document if it doesn't exist yet
        const newProfile: StudentUserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
          email: firebaseUser.email || '',
          plan: 'starter',
          role: 'student',
          createdAt: new Date().toISOString(),
          termsAcceptedAt: new Date().toISOString(),
          termsVersion: '2026.1',
          onboardingCompleted: false,
          testsUsedToday: 0,
          boardyQuestionsUsedToday: 0,
          lastUsageDate: todayStr,
        };
        await saveUserProfile(firebaseUser.uid, newProfile);
        p = newProfile;
      } else {
        // Daily usage reset check at Pakistan midnight
        if (p.lastUsageDate !== todayStr) {
          const updated = {
            ...p,
            testsUsedToday: 0,
            boardyQuestionsUsedToday: 0,
            lastUsageDate: todayStr,
          };
          await saveUserProfile(firebaseUser.uid, {
            testsUsedToday: 0,
            boardyQuestionsUsedToday: 0,
            lastUsageDate: todayStr,
          });
          p = updated;
        }
      }

      setProfile(p);
    } catch (err) {
      console.warn('[AuthContext] syncProfile error:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const signInEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncProfile(cred.user);
      return { success: true };
    } catch (err: any) {
      const code = err?.code;
      // PART 1 #7: Seamless fallback check for students migrated from Supabase
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        try {
          const checkRes = await fetch('/api/auth/migrate-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: pass }),
          });
          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.migrated && data.firebaseToken) {
              // Automatically sign in with custom token or credentials
              const { signInWithCustomToken } = await import('firebase/auth');
              const cred = await signInWithCustomToken(auth, data.firebaseToken);
              await syncProfile(cred.user);
              setMigratedBanner(true);
              return { success: true };
            }
          }
        } catch {
          // If fallback fails, show standard friendly error
        }
      }
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signUpEmail = async (formData: SignUpFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      const todayStr = getKarachiTodayString();

      const newProfile: StudentUserProfile = {
        uid: cred.user.uid,
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || '',
        plan: 'starter',
        role: 'student',
        createdAt: new Date().toISOString(),
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '2026.1',
        referralSource: formData.referralSource || '',
        testTrack: formData.preparingFor || 'Not sure',
        onboardingCompleted: false,
        testsUsedToday: 0,
        boardyQuestionsUsedToday: 0,
        lastUsageDate: todayStr,
      };

      await saveUserProfile(cred.user.uid, newProfile);
      setProfile(newProfile);

      // Send verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('[Firebase] Verification email send notice:', e);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signInGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncProfile(cred.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[Firebase] Sign out error:', err);
    }
  };

  const sendResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Neutral security response so nobody can guess which emails are registered
      return {
        success: true,
        message: "If an account exists with that email address, we've sent a link to reset your password.",
      };
    } catch (err: any) {
      // Always return neutral security message per user requirement 5
      return {
        success: true,
        message: "If an account exists with that email address, we've sent a link to reset your password.",
      };
    }
  };

  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user currently signed in.' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const reloadUserStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await reload(auth.currentUser);
      const isVerified = auth.currentUser.emailVerified;
      if (isVerified) {
        setUser({ ...auth.currentUser });
      }
      return isVerified;
    } catch {
      return false;
    }
  };

  const updateProfileData = async (fields: Partial<StudentUserProfile>) => {
    if (!user) return;
    try {
      await saveUserProfile(user.uid, fields);
      setProfile((prev) => (prev ? { ...prev, ...fields } : null));
    } catch (err) {
      console.error('[Firebase] updateProfileData error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        sessionExpired,
        migratedBanner,
        dismissMigratedBanner,
        dismissSessionExpired,
        signInEmail,
        signUpEmail,
        signInGoogle,
        logOut,
        sendResetEmail,
        resendVerification,
        reloadUserStatus,
        updateProfileData,
        refreshProfile,
        friendlyErrorMessage: friendlyAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
