import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from 'firebase/auth';
import {
  auth,
  fetchUserProfile,
  saveUserProfile,
  createInitialUserDoc,
  performGoogleSignIn,
  StudentUserProfile,
  UserRole,
} from '../lib/firebase';
import { getKarachiTodayString, normalizePlanId } from '../data/planLimits';

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

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthContextType {
  user: User | null;
  profile: StudentUserProfile | null;
  documentExists: boolean;
  isAdmin: boolean;
  loading: boolean;
  status: AuthStatus;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  availableRoles: UserRole[];
  sessionExpired: boolean;
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
    return `Unauthorized Domain: "${currentHost}" is not listed in authorized domains. In Firebase Console, go to Authentication > Settings > Authorized domains and add "${currentHost}".`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Sign-in method is not enabled. In Firebase Console, go to Authentication > Sign-in method and enable Email/Password or Google.';
  }
  if (code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API Key. Please verify your Firebase project credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please log in instead.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters with letters and numbers.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please verify and try again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact support@boardly.cfd.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. For security, please wait a few minutes before trying again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in pop-up was blocked. Please allow pop-ups for Boardly in your browser address bar.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection failed. Please check your internet connection.';
  }

  const cleanMsg = rawMsg ? rawMsg.replace(/^Firebase:\s*/i, '') : 'Authentication failed';
  return cleanMsg || 'Authentication error occurred. Please try again.';
}

export function getHighestRole(roles: UserRole[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('organizer')) return 'organizer';
  if (roles.includes('captain')) return 'captain';
  return 'student';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentUserProfile | null>(null);
  const [documentExists, setDocumentExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const normalizedEmail = (user?.email || '').trim().toLowerCase();
  const isAdmin = Boolean(
    normalizedEmail === 'shsvirtualadmin@gmail.com' ||
    normalizedEmail === 'support@boardly.cfd' ||
    profile?.role === 'admin' ||
    profile?.roles?.includes('admin')
  );

  const availableRoles = useMemo<UserRole[]>(() => {
    const list: UserRole[] = [];
    if (isAdmin) list.push('admin');
    if (profile?.roles && Array.isArray(profile.roles)) {
      profile.roles.forEach((r) => {
        if (!list.includes(r)) list.push(r);
      });
    } else if (profile?.role && !list.includes(profile.role)) {
      list.push(profile.role);
    }
    if (!list.includes('student')) list.push('student');
    return list;
  }, [isAdmin, profile]);

  const switchRole = useCallback((newRole: UserRole) => {
    if (availableRoles.includes(newRole)) {
      setActiveRole(newRole);
      try {
        localStorage.setItem('boardly_active_role', newRole);
      } catch {}
    }
  }, [availableRoles]);

  /**
   * Syncs and loads the user's profile from Named Firestore.
   * Never overwrites existing returning users.
   */
  const syncProfile = useCallback(async (firebaseUser: User): Promise<StudentUserProfile> => {
    const email = (firebaseUser.email || '').trim().toLowerCase();
    const isMasterAdmin = email === 'shsvirtualadmin@gmail.com' || email === 'support@boardly.cfd';
    const todayStr = getKarachiTodayString();

    // 1. Attempt to fetch existing document
    let existingProfile = await fetchUserProfile(firebaseUser.uid);

    if (existingProfile) {
      // Returning user found! Load saved data without resetting progress
      if (isMasterAdmin) {
        existingProfile.role = 'admin';
        existingProfile.plan = 'premium';
        existingProfile.onboardingCompleted = true;
        if (!existingProfile.roles?.includes('admin')) {
          existingProfile.roles = [...(existingProfile.roles || ['student']), 'admin'];
        }
        saveUserProfile(firebaseUser.uid, {
          role: 'admin',
          plan: 'premium',
          roles: existingProfile.roles,
          onboardingCompleted: true,
        }).catch(console.warn);
      } else {
        // Daily allowance reset at Pakistan midnight
        if (existingProfile.lastUsageDate !== todayStr) {
          existingProfile.testsUsedToday = 0;
          existingProfile.boardyQuestionsUsedToday = 0;
          existingProfile.lastUsageDate = todayStr;
          saveUserProfile(firebaseUser.uid, {
            testsUsedToday: 0,
            boardyQuestionsUsedToday: 0,
            lastUsageDate: todayStr,
          }).catch(console.warn);
        }
      }

      setProfile(existingProfile);
      setDocumentExists(true);

      const highest = getHighestRole(existingProfile.roles || [existingProfile.role]);
      const savedRole = localStorage.getItem('boardly_active_role') as UserRole;
      if (savedRole && (existingProfile.roles?.includes(savedRole) || (savedRole === 'admin' && isMasterAdmin))) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(highest);
      }

      return existingProfile;
    }

    // 2. First login only: Create document ONCE with merge transaction
    const initialPlan = isMasterAdmin ? 'premium' : 'free';
    const initialRole: UserRole = isMasterAdmin ? 'admin' : 'student';

    const created = await createInitialUserDoc(firebaseUser.uid, {
      name: firebaseUser.displayName || (email ? email.split('@')[0] : 'Student'),
      email,
      plan: initialPlan,
      role: initialRole,
      roles: [initialRole],
      onboardingCompleted: isMasterAdmin,
      testsUsedToday: 0,
      boardyQuestionsUsedToday: 0,
      lastUsageDate: todayStr,
      status: 'active',
    });

    setProfile(created);
    setDocumentExists(true);
    setActiveRole(initialRole);
    return created;
  }, []);

  useEffect(() => {
    setLoading(true);
    setStatus('loading');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncProfile(currentUser);
          setStatus('signedIn');
        } catch (err) {
          console.error('[AuthContext] syncProfile failed:', err);
          setStatus('signedIn'); // keep logged in, let UI handle retry
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setDocumentExists(false);
        setStatus('signedOut');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const signInEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncProfile(cred.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signUpEmail = async (formData: SignUpFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      const email = formData.email.trim().toLowerCase();
      const isMasterAdmin = email === 'shsvirtualadmin@gmail.com' || email === 'support@boardly.cfd';

      await createInitialUserDoc(cred.user.uid, {
        name: formData.fullName.trim(),
        email,
        phone: formData.phone?.trim() || '',
        plan: isMasterAdmin ? 'premium' : 'free',
        role: isMasterAdmin ? 'admin' : 'student',
        roles: isMasterAdmin ? ['admin', 'student'] : ['student'],
        testTrack: formData.preparingFor || 'Not sure',
        referralSource: formData.referralSource || '',
        onboardingCompleted: isMasterAdmin,
      });

      await syncProfile(cred.user);

      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('[Boardly Auth] Verification email send notice:', e);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Boardly Auth] signUpEmail failed:', err);
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const signInGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await performGoogleSignIn();
      if (cred && cred.user) {
        await syncProfile(cred.user);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Boardly Auth] Google sign-in failed:', err);
      return { success: false, error: friendlyAuthError(err) };
    }
  };

  const logOut = async () => {
    try {
      if (user?.uid) {
        localStorage.removeItem(`boardly_cached_profile_${user.uid}`);
        localStorage.removeItem('boardly_active_role');
      }
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setDocumentExists(false);
      setStatus('signedOut');
    } catch (err) {
      console.error('[Boardly Auth] Log out error:', err);
    }
  };

  const sendResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      return { success: false, message: friendlyAuthError(err) };
    }
  };

  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) return { success: false, error: 'No user signed in' };
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
      setUser({ ...auth.currentUser });
      return auth.currentUser.emailVerified;
    } catch {
      return false;
    }
  };

  const updateProfileData = async (fields: Partial<StudentUserProfile>): Promise<void> => {
    if (!user) return;
    await saveUserProfile(user.uid, fields);
    setProfile((prev) => (prev ? { ...prev, ...fields } : null));
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await syncProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        documentExists,
        isAdmin,
        loading,
        status,
        activeRole,
        switchRole,
        availableRoles,
        sessionExpired,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
