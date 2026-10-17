import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { debugTracker } from '@/utils/debugTracker';
import type { UserProfile } from '@/types/index';

export interface UserProfileHookResult {
  user: ReturnType<typeof useAuth>['user'];
  profile: UserProfile | null;
  loading: boolean;
  fetchStatus: 'idle' | 'loading' | 'success' | 'error';
  fetchDurationMs: number | null;
  docExists: boolean | null;
  error: { code?: string; message: string; path?: string } | null;
  university: string;
  targetExam: string;
  testDate: string;
  targetTestDate: string;
  track: string;
  subjects: string[];
  daysLeft: number | null;
  profileCompleted: boolean;
  updateProfileData: (updates: {
    displayName?: string;
    photoURL?: string | null;
    targetUniversity?: string;
    targetExam?: string;
    targetTestDate?: string;
    academicTrack?: string;
    subjects?: string[];
    profileCompleted?: boolean;
    onboardingCompleted?: boolean;
  }) => Promise<void>;
  retryFetch: () => void;
}

/**
 * Single shared hook for accessing and updating the active student's profile.
 * Reads directly from `users/{uid}` with a real-time `onSnapshot` listener.
 * Prevents infinite loop re-renders by using stable refs.
 * Enforces an 8-second hard timeout to guarantee no indefinite skeleton states.
 */
export function useUserProfile(): UserProfileHookResult {
  const { user, profile: authProfile, profileLoading: authLoading, updateLocalProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authProfile ?? null);
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = useState<boolean>(false);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const updateLocalProfileRef = useRef(updateLocalProfile);
  useEffect(() => {
    updateLocalProfileRef.current = updateLocalProfile;
  }, [updateLocalProfile]);

  const authProfileRef = useRef(authProfile);
  useEffect(() => {
    authProfileRef.current = authProfile;
    if (authProfile && !profile) {
      setProfile(authProfile);
    }
  }, [authProfile, profile]);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setHasReceivedSnapshot(false);
      setDocExists(null);
      setFetchStatus('idle');
      setFetchDurationMs(null);
      setError(null);
      debugTracker.recordUserFetch({
        status: 'idle',
        updatedAt: Date.now(),
      });
      return;
    }

    const path = `users/${user.uid}`;
    const startTime = Date.now();
    setFetchStatus('loading');
    debugTracker.recordUserFetch({
      status: 'loading',
      updatedAt: Date.now(),
    });

    let isSubscribed = true;

    // 8-second safety timeout: guarantee loading ends even if network hangs
    const timeoutTimer = setTimeout(() => {
      if (isSubscribed && !hasReceivedSnapshot) {
        console.warn(`[useUserProfile] Snapshot timeout (8s) on ${path}. Falling back to cached state.`);
        const duration = Date.now() - startTime;
        setHasReceivedSnapshot(true);
        setFetchStatus('error');
        setFetchDurationMs(duration);
        setError({
          code: 'timeout',
          message: 'Profile fetch timed out after 8s. Showing cached profile.',
          path,
        });
        debugTracker.recordUserFetch({
          status: 'error',
          code: 'timeout',
          message: '8s timeout exceeded',
          durationMs: duration,
          docExists: false,
          updatedAt: Date.now(),
        });
        // Use authProfile or minimal default profile
        if (authProfileRef.current) {
          setProfile(authProfileRef.current);
        }
      }
    }, 8000);

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (!isSubscribed) return;
        clearTimeout(timeoutTimer);
        const duration = Date.now() - startTime;
        setFetchDurationMs(duration);
        setHasReceivedSnapshot(true);
        setError(null);

        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setDocExists(true);
          setFetchStatus('success');
          setProfile({ ...data, uid: user.uid });
          updateLocalProfileRef.current(data);
          debugTracker.recordUserFetch({
            status: 'success',
            durationMs: duration,
            docExists: true,
            updatedAt: Date.now(),
          });
        } else {
          // Document does not exist: auto-create standard profile
          setDocExists(false);
          setFetchStatus('success');
          console.log(`[useUserProfile] No Firestore doc at ${path}, creating default document`);
          const defaultData: Partial<UserProfile> = {
            uid: user.uid,
            email: (user.email || '').toLowerCase(),
            displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
            photoURL: user.photoURL || null,
            role: 'student',
            plan: 'free',
            status: 'active',
            profileCompleted: false,
            onboardingCompleted: false,
            streak: 0,
            createdAt: serverTimestamp() as unknown as undefined,
            updatedAt: serverTimestamp() as unknown as undefined,
          };

          setDoc(doc(db, 'users', user.uid), defaultData, { merge: true }).catch((err) => {
            console.warn('[useUserProfile] Auto-create default user doc warning:', err);
          });

          const completeProfile = { ...(authProfileRef.current || {}), ...defaultData } as UserProfile;
          setProfile(completeProfile);
          updateLocalProfileRef.current(completeProfile);
          debugTracker.recordUserFetch({
            status: 'success',
            durationMs: duration,
            docExists: false,
            updatedAt: Date.now(),
          });
        }
      },
      (err) => {
        if (!isSubscribed) return;
        clearTimeout(timeoutTimer);
        const duration = Date.now() - startTime;
        console.error(`[useUserProfile] Snapshot error on ${path}:`, err);
        setFetchDurationMs(duration);
        setHasReceivedSnapshot(true);
        setFetchStatus('error');
        setError({
          code: err.code,
          message: err.message,
          path,
        });
        debugTracker.recordUserFetch({
          status: 'error',
          code: err.code,
          message: err.message,
          durationMs: duration,
          updatedAt: Date.now(),
        });
        if (authProfileRef.current) {
          setProfile(authProfileRef.current);
        }
      }
    );

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutTimer);
      unsubscribe();
    };
    // CRITICAL: only re-subscribe if user.uid changes or explicit retry is triggered!
    // Never include authProfile or updateLocalProfile in dependencies to prevent infinite re-render loops!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, retryTrigger]);

  const retryFetch = useCallback(() => {
    setHasReceivedSnapshot(false);
    setFetchStatus('loading');
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Loading state: true only while Auth is resolving OR while initial snapshot is waiting for active user
  const loading = (authLoading && !profile) || (Boolean(user?.uid) && !hasReceivedSnapshot && !profile);

  // Unified field extraction with complete synchronization
  const targetExam = profile?.targetExam || profile?.targetUniversity || '';
  const university = profile?.targetUniversity || profile?.targetExam || '';
  const testDate = profile?.targetTestDate || '';
  const targetTestDate = profile?.targetTestDate || '';
  const track = profile?.academicTrack || '';
  const profileCompleted = Boolean(profile?.profileCompleted || profile?.onboardingCompleted);

  const subjects = useMemo(() => {
    if (profile?.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0) {
      return profile.subjects;
    }
    return [];
  }, [profile?.subjects]);

  const daysLeft = useMemo(() => {
    if (!testDate) return null;
    try {
      const target = new Date(`${testDate}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [testDate]);

  const updateProfileData = useCallback(
    async (updates: {
      displayName?: string;
      photoURL?: string | null;
      targetUniversity?: string;
      targetExam?: string;
      targetTestDate?: string;
      academicTrack?: string;
      subjects?: string[];
      profileCompleted?: boolean;
      onboardingCompleted?: boolean;
    }) => {
      if (!user?.uid) throw new Error('Cannot update profile: Unauthenticated user');
      const path = `users/${user.uid}`;

      // Strictly allow safe student preference updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safePayload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.displayName !== undefined) {
        safePayload.displayName = updates.displayName.trim();
        safePayload.name = updates.displayName.trim();
      }
      if (updates.photoURL !== undefined) {
        safePayload.photoURL = updates.photoURL;
      }
      const resolvedExam = updates.targetExam || updates.targetUniversity;
      if (resolvedExam !== undefined) {
        safePayload.targetExam = resolvedExam.trim();
        safePayload.targetUniversity = resolvedExam.trim();
      }
      if (updates.targetTestDate !== undefined) {
        safePayload.targetTestDate = updates.targetTestDate.trim();
      }
      if (updates.academicTrack !== undefined) {
        safePayload.academicTrack = updates.academicTrack.trim();
      }
      if (updates.subjects !== undefined) {
        safePayload.subjects = updates.subjects;
      }
      if (updates.profileCompleted !== undefined || updates.onboardingCompleted !== undefined) {
        const completed = Boolean(updates.profileCompleted ?? updates.onboardingCompleted);
        safePayload.profileCompleted = completed;
        safePayload.onboardingCompleted = completed;
        if (completed) {
          safePayload.onboardingCompletedAt = serverTimestamp();
          safePayload.profileCompletedAt = serverTimestamp();
        }
      }

      // 1. Immediately update in-memory state so UI updates without needing a refresh
      updateLocalProfileRef.current(safePayload);
      setProfile((prev) => (prev ? { ...prev, ...safePayload } : (safePayload as UserProfile)));

      // 2. Perform merge write to Firestore
      await setDoc(doc(db, 'users', user.uid), safePayload, { merge: true });
      console.log(`[useUserProfile] Wrote profile update to ${path}:`, safePayload);
    },
    [user?.uid]
  );

  return {
    user,
    profile,
    loading,
    fetchStatus,
    fetchDurationMs,
    docExists,
    error,
    university,
    targetExam,
    testDate,
    targetTestDate,
    track,
    subjects,
    daysLeft,
    profileCompleted,
    updateProfileData,
    retryFetch,
  };
}

export default useUserProfile;
