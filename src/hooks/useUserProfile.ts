import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { debugTracker } from '@/utils/debugTracker';
import { isQuotaExhaustedError } from '@/utils/quota';
import { syncPublicProfile } from '@/services/publicProfileService';
import type { UserProfile } from '@/types/index';

function getLocalCachedProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`cached_profile_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function setLocalCachedProfile(uid: string, profile: UserProfile): void {
  try {
    localStorage.setItem(`cached_profile_${uid}`, JSON.stringify(profile));
  } catch {
    // Ignore storage write errors
  }
}

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
  streak: number;
  profileCompleted: boolean;
  updateProfileData: (updates: {
    displayName?: string;
    photoURL?: string | null;
    academicTrack?: string;
    subjects?: string[];
    profileCompleted?: boolean;
    onboardingCompleted?: boolean;
    avatarKey?: string | null;
    avatarVariant?: string | null;
  }) => Promise<void>;
  retryFetch: () => void;
}

interface SharedUserProfileState {
  profile: UserProfile | null;
  docExists: boolean | null;
  fetchStatus: 'idle' | 'loading' | 'success' | 'error';
  fetchDurationMs: number | null;
  error: { code?: string; message: string; path?: string } | null;
  hasReceivedSnapshot: boolean;
}

let activeUid: string | null = null;
let activeUnsub: (() => void) | null = null;
let activeTimeoutTimer: NodeJS.Timeout | null = null;
let teardownTimeout: NodeJS.Timeout | null = null;

let sharedState: SharedUserProfileState = {
  profile: null,
  docExists: null,
  fetchStatus: 'idle',
  fetchDurationMs: null,
  error: null,
  hasReceivedSnapshot: false,
};

const subscriberCallbacks = new Set<() => void>();

function broadcastState() {
  for (const cb of subscriberCallbacks) {
    try {
      cb();
    } catch {
      // Ignore callback errors
    }
  }
}

function startSubscription(uid: string, authProfileFallback?: UserProfile | null) {
  if (teardownTimeout) {
    clearTimeout(teardownTimeout);
    teardownTimeout = null;
  }

  if (activeUid === uid && activeUnsub) {
    return;
  }

  if (activeUnsub) {
    activeUnsub();
    activeUnsub = null;
  }
  if (activeTimeoutTimer) {
    clearTimeout(activeTimeoutTimer);
    activeTimeoutTimer = null;
  }

  activeUid = uid;
  const path = `users/${uid}`;
  const startTime = Date.now();
  const cached = getLocalCachedProfile(uid);

  sharedState = {
    profile: cached || authProfileFallback || null,
    docExists: Boolean(cached),
    fetchStatus: cached ? 'success' : 'loading',
    fetchDurationMs: null,
    error: null,
    hasReceivedSnapshot: Boolean(cached),
  };
  broadcastState();

  activeTimeoutTimer = setTimeout(() => {
    if (!sharedState.hasReceivedSnapshot) {
      console.warn(`[useUserProfile] Snapshot timeout (8s) on ${path}. Falling back to cached state.`);
      const duration = Date.now() - startTime;
      sharedState.hasReceivedSnapshot = true;
      sharedState.fetchStatus = 'error';
      sharedState.fetchDurationMs = duration;
      sharedState.error = {
        code: 'timeout',
        message: 'Profile fetch timed out after 8s. Showing cached profile.',
        path,
      };
      if (authProfileFallback && !sharedState.profile) {
        sharedState.profile = authProfileFallback;
      }
      broadcastState();
    }
  }, 8000);

  let cancelled = false;
  activeUnsub = () => {
    cancelled = true;
  };

  getDoc(doc(db, 'users', uid))
    .then((snap) => {
      if (cancelled) return;
      if (activeTimeoutTimer) {
        clearTimeout(activeTimeoutTimer);
        activeTimeoutTimer = null;
      }
      const duration = Date.now() - startTime;
      sharedState.fetchDurationMs = duration;
      sharedState.hasReceivedSnapshot = true;
      sharedState.error = null;

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const fullProfile: UserProfile = {
          ...data,
          uid,
          role: data.role || 'student',
        };
        sharedState.docExists = true;
        sharedState.fetchStatus = 'success';
        sharedState.profile = fullProfile;
        setLocalCachedProfile(uid, fullProfile);
        if (!data.shortId) {
          import('@/utils/shortId').then(({ ensureUserShortId }) => {
            ensureUserShortId(uid, data.shortId).catch(() => {});
          });
        }
      } else {
        sharedState.docExists = false;
        sharedState.fetchStatus = 'success';
        if (authProfileFallback) {
          sharedState.profile = authProfileFallback;
        }
      }
      broadcastState();
    })
    .catch((err) => {
      if (cancelled) return;
      if (activeTimeoutTimer) {
        clearTimeout(activeTimeoutTimer);
        activeTimeoutTimer = null;
      }
      const duration = Date.now() - startTime;
      const isQuota = isQuotaExhaustedError(err);
      sharedState.fetchDurationMs = duration;
      sharedState.hasReceivedSnapshot = true;
      sharedState.fetchStatus = isQuota ? 'success' : 'error';
      sharedState.error = {
        code: isQuota ? 'RESOURCE_EXHAUSTED' : err.code,
        message: isQuota ? 'Daily database limit reached, using cached profile' : err.message,
        path,
      };
      const cachedProf = getLocalCachedProfile(uid);
      if (cachedProf) {
        sharedState.profile = cachedProf;
        sharedState.docExists = true;
      } else if (authProfileFallback) {
        sharedState.profile = authProfileFallback;
        sharedState.docExists = true;
      }
      broadcastState();
    });
}

function releaseSubscription() {
  if (teardownTimeout) clearTimeout(teardownTimeout);
  teardownTimeout = setTimeout(() => {
    if (subscriberCallbacks.size === 0 && activeUnsub) {
      activeUnsub();
      activeUnsub = null;
      activeUid = null;
    }
  }, 15000);
}

/**
 * Single shared hook for accessing and updating the active student's profile.
 * Coordinates through a singleton observer on `users/{uid}` to eliminate duplicate reads.
 * Prevents re-render cascades and ensures instant cache-first availability.
 */
export function useUserProfile(): UserProfileHookResult {
  const { user, profile: authProfile, profileLoading: authLoading, updateLocalProfile } = useAuth();
  const [, setTick] = useState(0);

  const updateLocalProfileRef = useRef(updateLocalProfile);
  useEffect(() => {
    updateLocalProfileRef.current = updateLocalProfile;
  }, [updateLocalProfile]);

  useEffect(() => {
    if (!user?.uid) return;

    const onUpdate = () => {
      setTick((t) => t + 1);
    };

    subscriberCallbacks.add(onUpdate);
    startSubscription(user.uid, authProfile);

    return () => {
      subscriberCallbacks.delete(onUpdate);
      if (subscriberCallbacks.size === 0) {
        releaseSubscription();
      }
    };
  }, [user?.uid, authProfile]);

  useEffect(() => {
    if (!user?.uid || !authProfile) return;
    if (sharedState.profile && sharedState.profile.uid === user.uid) {
      const nextCustomRole = authProfile.customRole ?? sharedState.profile.customRole;
      const nextRole = authProfile.role || sharedState.profile.role || 'student';
      const nextUsername = authProfile.username ?? sharedState.profile.username;
      const nextDisplayName = authProfile.displayName ?? sharedState.profile.displayName;
      if (
        nextCustomRole !== sharedState.profile.customRole ||
        nextRole !== sharedState.profile.role ||
        nextUsername !== sharedState.profile.username ||
        nextDisplayName !== sharedState.profile.displayName
      ) {
        sharedState.profile = {
          ...sharedState.profile,
          ...authProfile,
          role: nextRole,
          customRole: nextCustomRole,
        };
        setLocalCachedProfile(user.uid, sharedState.profile);
        broadcastState();
      }
    }
  }, [user?.uid, authProfile]);

  const profile = sharedState.profile || (user?.uid ? getLocalCachedProfile(user.uid) : null);
  const hasReceivedSnapshot = sharedState.hasReceivedSnapshot;
  const docExists = sharedState.docExists;
  const fetchStatus = sharedState.fetchStatus;
  const fetchDurationMs = sharedState.fetchDurationMs;
  const error = sharedState.error;

  const retryFetch = useCallback(() => {
    if (user?.uid) {
      if (activeUnsub) {
        activeUnsub();
        activeUnsub = null;
      }
      startSubscription(user.uid, authProfile);
    }
  }, [user?.uid, authProfile]);

  // Loading state: true only while Auth is resolving OR while initial snapshot is waiting for active user
  const loading = (authLoading && !profile) || (Boolean(user?.uid) && !hasReceivedSnapshot && !profile);

  // Unified field extraction without target exam
  const profileCompleted = Boolean(profile?.profileCompleted || profile?.onboardingCompleted);

  const subjects = useMemo(() => {
    if (profile?.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0) {
      return profile.subjects;
    }
    return [];
  }, [profile?.subjects]);

  const updateProfileData = useCallback(
    async (updates: {
      displayName?: string;
      photoURL?: string | null;
      avatarKey?: string | null;
      avatarVariant?: string | null;
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
      if (updates.avatarKey !== undefined) {
        safePayload.avatarKey = updates.avatarKey;
      }
      if (updates.avatarVariant !== undefined) {
        safePayload.avatarVariant = updates.avatarVariant;
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
      if (sharedState.profile) {
        sharedState.profile = { ...sharedState.profile, ...safePayload };
        setLocalCachedProfile(user.uid, sharedState.profile);
      }
      broadcastState();

      // 2. Perform merge write to Firestore
      await setDoc(doc(db, 'users', user.uid), safePayload, { merge: true });

      // 3. Sync public-safe fields to publicProfiles/{uid}
      syncPublicProfile(user.uid, {
        ...(profile || {}),
        ...safePayload,
      }).catch((err) => {
        console.warn('[useUserProfile] syncPublicProfile failed:', err);
      });

      console.log(`[useUserProfile] Wrote profile update to ${path}:`, safePayload);
    },
    [user?.uid, profile]
  );

  const streak = Math.max(
    0,
    Math.floor(Number((profile as { streak?: unknown } | null)?.streak ?? 0) || 0)
  );

  return {
    user,
    profile,
    loading,
    fetchStatus,
    fetchDurationMs,
    docExists,
    error,
    university: '',
    targetExam: '',
    testDate: '',
    targetTestDate: '',
    track: '',
    subjects,
    daysLeft: null,
    streak,
    profileCompleted,
    updateProfileData,
    retryFetch,
  };
}

export default useUserProfile;
