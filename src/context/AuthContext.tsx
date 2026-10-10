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
  console.error('[Firebase Auth Error Details]:', err);
  const code: string = err?.code || '';
  const rawMsg: string = err?.message || (typeof err === 'string' ? err : '');
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

  if (code === 'auth/unauthorized-domain') {
    return `Unauthorized Domain: "${currentHost}" is not listed in authorized domains. In Firebase Console, go to Authentication > Settings > Authorized domains and add "${currentHost}". [auth/unauthorized-domain]`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Sign-in method disabled: This provider is not enabled. In Firebase Console, go to Authentication > Sign-in method and enable Email/Password or Google. [auth/operation-not-allowed]';
  }
  if (code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API Key: The configured API key is not accepted by Google Firebase. [auth/invalid-api-key]';
  }
  if (code === 'auth/configuration-not-found') {
    return 'Firebase project configuration not found. Please verify Identity Platform settings. [auth/configuration-not-found]';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please log in instead. [auth/email-already-in-use]';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address. [auth/invalid-email]';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters with an uppercase letter, lowercase letter, and a number. [auth/weak-password]';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
    return `Incorrect email or password. Please verify and try again. [${code || 'auth/invalid-credential'}]`;
  }
  if (code === 'auth/user-disabled') {
    return 'This user account has been disabled. [auth/user-disabled]';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. For security, please wait a few minutes before trying again. [auth/too-many-requests]';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled before completion. [auth/popup-closed-by-user]';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for Boardly. [auth/popup-blocked]';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Google sign-in popup was superseded by another request. [auth/cancelled-popup-request]';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method. [auth/account-exists-with-different-credential]';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection failed. Please check your internet connection or ad-blocker. [auth/network-request-failed]';
  }

  // Fallback: ALWAYS include code and full message instead of stripping down to "Error"
  const cleanMsg = rawMsg ? rawMsg.replace(/^Firebase:\s*/i, '') : 'Authentication failed';
  if (code) {
    return `${cleanMsg} [${code}]`;
  }
  return cleanMsg || 'Authentication error occurred. Please try again.';
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

      try {
        await saveUserProfile(cred.user.uid, newProfile);
      } catch (profileErr) {
        console.warn('[Firebase] Initial profile save warning (handled gracefully):', profileErr);
      }
      setProfile(newProfile);

      // Send verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('[Firebase] Verification email send notice:', e);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Firebase] signUpEmail failed:', err);
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signInGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      try {
        await syncProfile(cred.user);
      } catch (syncErr) {
        console.warn('[Firebase] Google sign-in syncProfile warning:', syncErr);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Firebase] signInGoogle failed:', err);
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
