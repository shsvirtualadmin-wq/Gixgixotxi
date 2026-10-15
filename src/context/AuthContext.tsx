// PROTECTED: do not modify unless the task is explicitly about authentication. See PROJECT_RULES.md
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  db,
  fetchUserProfile,
  saveUserProfile,
  createInitialUserDoc,
  performGoogleSignIn,
  recordReferralOnSignup,
  StudentUserProfile,
  UserRole,
  browserLocalPersistence,
  setPersistence,
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getKarachiTodayString, normalizePlanId, PlanType } from '../data/planLimits';
import { findUniversity } from '../data/universities';
import { recordSignupReferral, getStoredReferralCode } from '../lib/referralTracker';

export interface SignUpFormData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  preparingFor?: 'Engineering & CS' | 'Business & Finance' | 'Not sure';
  referralSource?: string;
  referralCode?: string;
  termsAccepted: boolean;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthContextType {
  user: User | null;
  profile: StudentUserProfile | null;
  documentExists: boolean;
  isAdmin: boolean;
  loading: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  authError: { code: string; message: string } | null;
  retryAuth: () => Promise<void>;
  isRegistered: boolean;
  initialAuthChecked: boolean;
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
  completeOnboarding: (onboardingData: Partial<StudentUserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  friendlyErrorMessage: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function friendlyAuthError(err: any): string {
  // Log the real reason for developers
  console.error('[Firebase Auth Developer Log]:', err?.code || '', err?.message || err);
  const code: string = err?.code || '';
  const rawMsg: string = err?.message || (typeof err === 'string' ? err : '');

  if (code === 'auth/user-suspended' || rawMsg.toLowerCase().includes('suspended')) {
    return 'Your account has been suspended. Contact support@boardly.cfd.';
  }

  if (
    code === 'auth/api-key-not-valid' ||
    code === 'auth/invalid-api-key' ||
    rawMsg.toLowerCase().includes('api-key-not-valid') ||
    rawMsg.toLowerCase().includes('api key not valid')
  ) {
    return "Login is temporarily unavailable. We're on it.";
  }
  if (code === 'auth/unauthorized-domain') {
    return "This website address isn't authorized yet.";
  }
  if (code === 'auth/network-request-failed') {
    return "Check your internet connection.";
  }
  if (code === 'auth/too-many-requests') {
    return "Too many attempts. Try again in a few minutes.";
  }
  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found'
  ) {
    return "Email or password is incorrect.";
  }
  if (code === 'auth/popup-blocked') {
    return "Allow pop-ups for this site, then try again.";
  }
  if (code === 'auth/email-already-in-use') {
    return "This email address is already registered. Please log in instead.";
  }
  if (code === 'auth/invalid-email') {
    return "Email or password is incorrect.";
  }
  if (code === 'auth/weak-password') {
    return "Password is too weak. Please use at least 8 characters.";
  }

  return "Something went wrong. Please try again.";
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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState<boolean>(false);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

  const lastKnownUserRef = useRef<User | null>(null);
  const isExplicitLoggingOutRef = useRef<boolean>(false);

  // Combined loading state: true until BOTH auth identity and profile document are resolved
  const loading = authLoading || profileLoading || !initialAuthChecked;

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const [isAdminFromCollection, setIsAdminFromCollection] = useState<boolean>(false);

  // Check the admins collection for admin status
  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      setIsAdminFromCollection(false);
      return;
    }
    const checkAdminDoc = async () => {
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        if (isMounted) {
          setIsAdminFromCollection(snap.exists());
        }
      } catch {
        if (isMounted) setIsAdminFromCollection(false);
      }
    };
    checkAdminDoc();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const normalizedEmail = (user?.email || '').trim().toLowerCase();
  const isEmailVerified = Boolean(
    user?.emailVerified === true ||
    user?.providerData?.some((p) => p.providerId === 'google.com')
  );

  // Hardcode shsvirtualadmin@gmail.com as the ONLY admin email (strictly case-insensitive).
  // It must be hidden and false for every other user, including support@boardly.cfd and ordinary users.
  const isAdmin = Boolean(
    normalizedEmail === 'shsvirtualadmin@gmail.com'
  );

  // Single source of truth for "is registered": true if admin, onboarding is complete, or academic profile exists
  const isRegistered = useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!profile) return false;
    if (profile.onboardingComplete === true || profile.onboardingCompleted === true || profile.registrationComplete === true) {
      return true;
    }
    const hasAcademic = Boolean(
      (profile.class || profile.grade || profile.board || profile.stream || profile.testTrack || profile.targetUniversity || profile.targetExam) &&
      (profile.name || profile.fullName) &&
      profile.email
    );
    return hasAcademic;
  }, [user, isAdmin, profile]);

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
    const isMasterAdmin = email === 'shsvirtualadmin@gmail.com';
    const todayStr = getKarachiTodayString();

    // 1. Fetch user profile from Firestore using 3-step lookup with 15s timeout and automatic retry (Requirement 6 & 7)
    const fetchWith15sTimeoutAndRetry = async (): Promise<StudentUserProfile | null> => {
      const executeOneAttempt = (attemptNum: number): Promise<StudentUserProfile | null> => {
        return new Promise<StudentUserProfile | null>((resolve, reject) => {
          const timer = setTimeout(() => {
            const timeoutError = new Error(`Profile lookup timed out after 15 seconds (attempt ${attemptNum}).`);
            (timeoutError as any).code = 'timeout';
            reject(timeoutError);
          }, 15000);

          fetchUserProfile(firebaseUser.uid, firebaseUser.email)
            .then((res) => {
              clearTimeout(timer);
              resolve(res);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });
      };

      try {
        return await executeOneAttempt(1);
      } catch (firstErr: any) {
        console.warn(`[AuthContext] Initial profile lookup attempt 1 failed [code: ${firstErr?.code || 'UNKNOWN'}]. Performing one automatic retry...`, firstErr);
        try {
          return await executeOneAttempt(2);
        } catch (retryErr: any) {
          console.error(`[AuthContext] Automatic retry attempt 2 also failed [code: ${retryErr?.code || 'UNKNOWN'}]:`, retryErr);
          throw retryErr;
        }
      }
    };

    let existingProfile = await fetchWith15sTimeoutAndRetry();

    if (existingProfile) {
      if (!isMasterAdmin && (existingProfile.suspended === true || existingProfile.status === 'suspended' || (existingProfile as any).isSuspended === true)) {
        console.warn(`[Boardly Auth] Student ${firebaseUser.uid} (${firebaseUser.email}) is suspended. Enforcing sign out.`);
        try {
          localStorage.removeItem(`boardly_cached_profile_${firebaseUser.uid}`);
          localStorage.removeItem('boardly_active_role');
        } catch {}
        await signOut(auth);
        setUser(null);
        setProfile(null);
        setDocumentExists(false);
        setStatus('signedOut');
        const suspError = new Error('Your account has been suspended. Contact support@boardly.cfd.');
        (suspError as any).code = 'auth/user-suspended';
        throw suspError;
      }

      // Returning user found: preserve all saved data and onboarding status
      if (isMasterAdmin) {
        existingProfile.role = 'admin';
        existingProfile.plan = 'premium';
        existingProfile.isCrewMember = false;
        delete existingProfile.crewStatus;
        delete existingProfile.crewReferralCode;
        delete existingProfile.crewStartDate;
        delete existingProfile.crewInstitution;
        existingProfile.onboardingCompleted = true;
        existingProfile.onboardingComplete = true;
        existingProfile.registrationComplete = true;
        existingProfile.roles = ['admin', 'student'];
        saveUserProfile(firebaseUser.uid, {
          role: 'admin',
          plan: 'premium',
          isCrewMember: false,
          crewStatus: undefined,
          roles: ['admin', 'student'],
          onboardingCompleted: true,
          onboardingComplete: true,
          registrationComplete: true,
        }).catch(console.warn);
      } else {
        // If profile has academic info, ensure onboardingComplete is marked true
        const hasAcademic = Boolean(
          (existingProfile.class || existingProfile.grade || existingProfile.board || existingProfile.stream || existingProfile.testTrack || existingProfile.targetUniversity || existingProfile.targetExam) &&
          (existingProfile.name || existingProfile.fullName) &&
          existingProfile.email
        );
        if (hasAcademic && (!existingProfile.onboardingComplete || !existingProfile.onboardingCompleted || !existingProfile.registrationComplete)) {
          existingProfile.onboardingCompleted = true;
          existingProfile.onboardingComplete = true;
          existingProfile.registrationComplete = true;
          saveUserProfile(firebaseUser.uid, {
            onboardingCompleted: true,
            onboardingComplete: true,
            registrationComplete: true,
          }).catch(console.warn);
        }

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
      setAuthError(null);

      const highest = getHighestRole(existingProfile.roles || [existingProfile.role]);
      const savedRole = localStorage.getItem('boardly_active_role') as UserRole;
      if (savedRole && (existingProfile.roles?.includes(savedRole) || (savedRole === 'admin' && isMasterAdmin))) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(highest);
      }

      return existingProfile;
    }

    // 2. Only if the user genuinely does not exist on server: create initial document once
    const initialPlan: PlanType = isMasterAdmin ? 'premium' : 'starter';
    const initialRole: UserRole = isMasterAdmin ? 'admin' : 'student';

    const created = await createInitialUserDoc(firebaseUser.uid, {
      name: firebaseUser.displayName || (email ? email.split('@')[0] : 'Student'),
      email,
      plan: initialPlan,
      role: initialRole,
      roles: [initialRole],
      onboardingCompleted: isMasterAdmin,
      onboardingComplete: isMasterAdmin,
      testsUsedToday: 0,
      boardyQuestionsUsedToday: 0,
      lastUsageDate: todayStr,
      status: 'active',
    });

    setProfile(created);
    setDocumentExists(true);
    setActiveRole(initialRole);

    // Record tracked referral if brand-new user registered via Google
    if (!isMasterAdmin) {
      const activeRefCode = getStoredReferralCode();
      if (activeRefCode) {
        console.log(`[Referral:Attribution] Brand-new Google user detected: ${firebaseUser.uid}. Attributing referral "${activeRefCode}"...`);
        try {
          await recordSignupReferral({
            referralCode: activeRefCode,
            referredUserId: firebaseUser.uid,
            referredUserName: firebaseUser.displayName || (email ? email.split('@')[0] : 'Student'),
            referredUserEmail: email,
          });
        } catch (e) {
          console.error('[Referral:Attribution] Google sign-in referral attribution error:', e);
        }
      }
    }

    return created;
  }, []);

  useEffect(() => {
    let isMounted = true;
    setAuthLoading(true);
    setProfileLoading(true);
    setStatus('loading');

    // Ensure Firebase auth persistence is set to browserLocalPersistence
    setPersistence(auth, browserLocalPersistence).catch((persistErr) => {
      console.warn('[Boardly Auth] Persistence error:', persistErr);
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!isMounted) return;

        try {
          if (currentUser) {
            lastKnownUserRef.current = currentUser;
            setUser(currentUser);

            // 1. Immediately hydrate from cache so the user is never blocked by slow Firestore reads
            let hasCachedProfile = false;
            try {
              const cachedStr = localStorage.getItem(`boardly_cached_profile_${currentUser.uid}`);
              if (cachedStr) {
                const parsed = JSON.parse(cachedStr);
                if (parsed && typeof parsed === 'object') {
                  setProfile(parsed);
                  setDocumentExists(true);
                  setProfileLoading(false);
                  setAuthLoading(false);
                  setInitialAuthChecked(true);
                  setStatus('signedIn');
                  hasCachedProfile = true;
                }
              }
            } catch {}

            if (!hasCachedProfile) {
              setProfileLoading(true);
            }

            try {
              const loadedProfile = await syncProfile(currentUser);
              if (isMounted) {
                setProfile(loadedProfile);
                setDocumentExists(true);
                setAuthError(null);
                setStatus('signedIn');
                try {
                  localStorage.setItem(`boardly_cached_profile_${currentUser.uid}`, JSON.stringify(loadedProfile));
                } catch {}
              }
            } catch (syncErr: any) {
              console.error(
                `[AuthContext] syncProfile failed for user ${currentUser.uid} (${currentUser.email}): [code: ${syncErr?.code || 'UNKNOWN'}] [message: ${syncErr?.message || syncErr}]`,
                syncErr
              );
              // Read local storage before any fallback to protect onboarding status
              let cachedProfile: StudentUserProfile | null = null;
              try {
                const cached = localStorage.getItem(`boardly_cached_profile_${currentUser.uid}`);
                if (cached) cachedProfile = JSON.parse(cached);
              } catch {}

              if (cachedProfile && isMounted) {
                setProfile(cachedProfile);
                setDocumentExists(true);
                setAuthError(null);
                setStatus('signedIn');
              } else if (isMounted) {
                // Requirement 3: If any lookup throws, do NOT show registration. Show retry screen.
                setAuthError({
                  code: syncErr?.code || 'profile-load-error',
                  message: syncErr?.message || 'We had trouble loading your account profile. Please check your connection and retry.',
                });
              }
            } finally {
              if (isMounted) {
                setProfileLoading(false);
                setAuthLoading(false);
                setInitialAuthChecked(true);
              }
            }
          } else {
            // Guard 1: If user explicitly signed out, clear immediately
            if (isExplicitLoggingOutRef.current) {
              if (isMounted) {
                setUser(null);
                setProfile(null);
                setDocumentExists(false);
                setAuthError(null);
                setStatus('signedOut');
                lastKnownUserRef.current = null;
                setProfileLoading(false);
                setAuthLoading(false);
                setInitialAuthChecked(true);
              }
              return;
            }

            // Guard 2: If we had a known active user in this session, do NOT drop user
            // on transient token refresh glitches, tab switches, or temporary network drops
            if (lastKnownUserRef.current || auth.currentUser) {
              console.warn('[AuthContext] Retaining active user during temporary auth/token refresh.');
              try {
                if (auth.currentUser) {
                  await auth.currentUser.getIdToken(true);
                  return;
                }
              } catch (refreshErr) {
                console.warn('[AuthContext] Silent token refresh retry notice:', refreshErr);
                return;
              }
            }

            if (isMounted) {
              setUser(null);
              setProfile(null);
              setDocumentExists(false);
              setStatus('signedOut');
              lastKnownUserRef.current = null;
              setProfileLoading(false);
              setAuthLoading(false);
              setInitialAuthChecked(true);
            }
          }
        } catch (authErr) {
          console.warn('[AuthContext] onAuthStateChanged non-fatal warning:', authErr);
        } finally {
          if (isMounted) {
            setAuthLoading(false);
            if (!currentUser) {
              setProfileLoading(false);
              setInitialAuthChecked(true);
            }
          }
        }
      },
      (error) => {
        console.warn('[AuthContext] onAuthStateChanged stream error:', error);
        if (isMounted) {
          setAuthLoading(false);
          setProfileLoading(false);
          setInitialAuthChecked(true);
        }
      }
    );

    // 32-Second Safety Timeout Fallback:
    // Ensures loading is NEVER stuck indefinitely on network drops while allowing 15s lookup + retry.
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setAuthLoading(false);
        setProfileLoading(false);
        setInitialAuthChecked(true);
      }
    }, 32000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [syncProfile]);

  // Real-time Pakistan Standard Time (PKT) Midnight Reset Monitor
  // Checks every 15 seconds and on window focus/visibility change.
  // Resets test and Boardy daily usage instantly at midnight PKT across timezones without page refresh.
  useEffect(() => {
    const checkMidnightReset = () => {
      const todayPkt = getKarachiTodayString();
      if (profile && profile.lastUsageDate && profile.lastUsageDate !== todayPkt) {
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            testsUsedToday: 0,
            boardyQuestionsUsedToday: 0,
            lastUsageDate: todayPkt,
          };
        });
        if (user?.uid) {
          saveUserProfile(user.uid, {
            testsUsedToday: 0,
            boardyQuestionsUsedToday: 0,
            lastUsageDate: todayPkt,
          }).catch(console.warn);
        }
      }
    };

    const intervalId = setInterval(checkMidnightReset, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMidnightReset();
      }
    };

    window.addEventListener('focus', checkMidnightReset);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkMidnightReset);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [profile, user]);

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
      const email = formData.email.trim().toLowerCase();
      const name = formData.fullName.trim();

      // 1. Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, email, formData.password);
      const uid = cred.user.uid;

      // 2. Explicitly write to users/{uid} document immediately with required fields:
      // - email: the email address they just registered with
      // - name: the name they entered on the signup form
      // - role: 'student'
      // - plan: 'starter'
      const nowStr = new Date().toISOString();
      const userRef = doc(db, 'users', uid);
      const userDocData = {
        uid,
        email,
        name,
        role: 'student' as UserRole,
        plan: 'starter' as PlanType,
        roles: ['student'] as UserRole[],
        phone: formData.phone?.trim() || '',
        testTrack: formData.preparingFor || 'Engineering & CS',
        referralSource: formData.referralSource || '',
        onboardingCompleted: false,
        onboardingComplete: false,
        testsUsedToday: 0,
        boardyQuestionsUsedToday: 0,
        lastUsageDate: nowStr.slice(0, 10),
        streak: 0,
        streakDays: 0,
        testHistory: [],
        status: 'active',
        createdAt: nowStr,
        updatedAt: nowStr,
        termsAcceptedAt: nowStr,
        termsVersion: '2026.1',
      };

      // Critical requirement: Ensure this database write finishes before proceeding/navigating
      await setDoc(userRef, userDocData, { merge: true });

      // Cache locally immediately so session state is in sync
      try {
        localStorage.setItem(`boardly_cached_profile_${uid}`, JSON.stringify(userDocData));
      } catch {}

      // Update state immediately
      setProfile(userDocData as any);
      setDocumentExists(true);
      setActiveRole('student');

      // Record referral attribution live for Campus Ambassador / Boardly Crew
      const activeReferralCode = (
        formData.referralCode ||
        getStoredReferralCode() ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('referralCode') : '') ||
        (formData.referralSource?.startsWith('Campus Captain: ') ? formData.referralSource.replace('Campus Captain: ', '') : '') ||
        ''
      ).trim().toUpperCase();

      if (activeReferralCode) {
        console.log(`[Referral:Attribution] Brand-new email user created: ${uid}. Attributing referral "${activeReferralCode}"...`);
        try {
          await recordSignupReferral({
            referralCode: activeReferralCode,
            referredUserId: uid,
            referredUserName: name,
            referredUserEmail: email,
          });
        } catch (refErr) {
          console.error('[Referral:Attribution] Error recording email signup referral:', refErr);
        }
      }

      // Check if this newly registered student has pending Crew Ambassador 30-day Premium
      try {
        const synced = await fetchUserProfile(uid);
        if (synced && synced.isPremium && synced.plan === 'premium') {
          setProfile(synced);
        }
      } catch (pendingErr) {
        console.warn('[signUpEmail] pending premium auto-upgrade check notice:', pendingErr);
      }

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
      isExplicitLoggingOutRef.current = true;
      if (user?.uid) {
        localStorage.removeItem(`boardly_cached_profile_${user.uid}`);
        localStorage.removeItem('boardly_active_role');
      }
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setDocumentExists(false);
      setStatus('signedOut');
      lastKnownUserRef.current = null;
    } catch (err) {
      console.error('[Boardly Auth] Log out error:', err);
    } finally {
      isExplicitLoggingOutRef.current = false;
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
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) return;

    const resolvedFields: Partial<StudentUserProfile> = { ...fields };
    const rawUni = fields.targetUniversity || (fields as any).university || (fields as any).dream_university || (fields as any).target_university;
    if (rawUni && !fields.targetUniversityId) {
      const u = findUniversity(rawUni);
      if (u) {
        resolvedFields.targetUniversityId = u.id;
        resolvedFields.targetUniversity = u.shortName;
      } else {
        resolvedFields.targetUniversity = rawUni;
      }
    } else if (fields.targetUniversityId && !resolvedFields.targetUniversity) {
      const u = findUniversity(fields.targetUniversityId);
      if (u) resolvedFields.targetUniversity = u.shortName;
    }

    if (resolvedFields.targetUniversity) {
      resolvedFields.university = resolvedFields.targetUniversity;
      resolvedFields.dream_university = resolvedFields.targetUniversity;
      resolvedFields.target_university = resolvedFields.targetUniversity;
    }

    const rawExam = fields.testTrack || (fields as any).targetExam || (fields as any).exam;
    if (rawExam) {
      resolvedFields.targetExam = rawExam;
      resolvedFields.testTrack = rawExam;
    }

    const rawDate = fields.targetExamDate || (fields as any).examDate;
    if (rawDate) {
      resolvedFields.examDate = rawDate;
      resolvedFields.targetExamDate = rawDate;
    }

    await saveUserProfile(currentUid, resolvedFields);
    setProfile((prev) => {
      const next = prev ? { ...prev, ...resolvedFields } : null;
      if (next) {
        try {
          localStorage.setItem(`boardly_cached_profile_${currentUid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const completeOnboarding = async (
    onboardingData: Partial<StudentUserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      return { success: false, error: 'User session not found. Please log in again.' };
    }

    try {
      const normalizedOnboarding: Partial<StudentUserProfile> = { ...onboardingData };
      const rawUni = onboardingData.targetUniversity || (onboardingData as any).university || (onboardingData as any).dream_university || (onboardingData as any).target_university;
      if (rawUni && !onboardingData.targetUniversityId) {
        const u = findUniversity(rawUni);
        if (u) {
          normalizedOnboarding.targetUniversityId = u.id;
          normalizedOnboarding.targetUniversity = u.shortName;
        } else {
          normalizedOnboarding.targetUniversity = rawUni;
        }
      } else if (onboardingData.targetUniversityId && !normalizedOnboarding.targetUniversity) {
        const u = findUniversity(onboardingData.targetUniversityId);
        if (u) normalizedOnboarding.targetUniversity = u.shortName;
      }
      if (normalizedOnboarding.targetUniversity) {
        normalizedOnboarding.university = normalizedOnboarding.targetUniversity;
        normalizedOnboarding.dream_university = normalizedOnboarding.targetUniversity;
        normalizedOnboarding.target_university = normalizedOnboarding.targetUniversity;
      }
      const rawExam = onboardingData.testTrack || (onboardingData as any).targetExam;
      if (rawExam) {
        normalizedOnboarding.targetExam = rawExam;
        normalizedOnboarding.testTrack = rawExam;
      }
      const rawDate = onboardingData.targetExamDate || (onboardingData as any).examDate;
      if (rawDate) {
        normalizedOnboarding.examDate = rawDate;
        normalizedOnboarding.targetExamDate = rawDate;
      }

      const mergedFields: Partial<StudentUserProfile> = {
        ...normalizedOnboarding,
        onboardingCompleted: true,
        uid: currentUid,
      };
      (mergedFields as any).onboardingComplete = true;

      // 1. Direct targeted write to users/{uid} document
      await saveUserProfile(currentUid, mergedFields);

      // 2. Synchronously update profile in state and cache
      setProfile((prev) => {
        const nextProfile: StudentUserProfile = prev
          ? { ...prev, ...mergedFields }
          : ({
              uid: currentUid,
              name: auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : 'Student'),
              email: auth.currentUser?.email || '',
              plan: 'free',
              role: 'student',
              roles: ['student'],
              createdAt: new Date().toISOString(),
              status: 'active',
              ...mergedFields,
            } as StudentUserProfile);

        try {
          localStorage.setItem(`boardly_cached_profile_${currentUid}`, JSON.stringify(nextProfile));
        } catch {}

        return nextProfile;
      });

      setDocumentExists(true);
      return { success: true };
    } catch (err: any) {
      console.error('[Boardly Onboarding] Complete onboarding failed:', err);
      let errMsg = 'Failed to save onboarding details. Please check your connection and try again.';
      if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
        errMsg = 'Permission denied while saving to Firestore. Please re-authenticate and retry.';
      } else if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.error) errMsg = `Firestore error: ${parsed.error}`;
        } catch {
          errMsg = err.message;
        }
      }
      return { success: false, error: errMsg };
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await syncProfile(user);
    }
  };

  const retryAuth = useCallback(async (): Promise<void> => {
    setAuthError(null);
    setProfileLoading(true);
    if (auth.currentUser) {
      try {
        const loaded = await syncProfile(auth.currentUser);
        setProfile(loaded);
        setDocumentExists(true);
        setAuthError(null);
        setStatus('signedIn');
      } catch (e: any) {
        console.error('[AuthContext] retryAuth failed:', e);
        setAuthError({
          code: e?.code || 'retry-failed',
          message: e?.message || 'Connection retry failed. Please try again.',
        });
      } finally {
        setProfileLoading(false);
      }
    } else {
      setProfileLoading(false);
    }
  }, [syncProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        documentExists,
        isAdmin,
        loading,
        authLoading,
        profileLoading,
        authError,
        retryAuth,
        isRegistered,
        initialAuthChecked,
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
        completeOnboarding,
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
