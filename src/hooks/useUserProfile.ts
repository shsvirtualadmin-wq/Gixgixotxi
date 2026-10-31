import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  const path = `/api/users/me`;
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

  api
    .get<{ profile: UserProfile | null }>('/api/users/me', { silentToast: true })
    .then((res) => {
      if (cancelled) return;
      if (activeTimeoutTimer) {
        clearTimeout(activeTimeoutTimer);
        activeTimeoutTimer = null;
      }
      const duration = Date.now() - startTime;
      sharedState.fetchDurationMs = duration;
      sharedState.hasReceivedSnapshot = true;
      sharedState.error = null;

      if (res?.profile) {
        const data = res.profile;
        const fullProfile = { ...data, uid };
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
      sharedState.fetchDurationMs = duration;
      sharedState.hasReceivedSnapshot = true;
      sharedState.fetchStatus = 'error';
      sharedState.error = {
        code: err?.code,
        message: err?.message || 'Failed to fetch profile',
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

  const loading = (authLoading && !profile) || (Boolean(user?.uid) && !hasReceivedSnapshot && !profile);
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

      const safePayload: Record<string, unknown> = {
        updatedAt: Date.now(),
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
          safePayload.onboardingCompletedAt = Date.now();
          safePayload.profileCompletedAt = Date.now();
        }
      }

      updateLocalProfileRef.current(safePayload as Partial<UserProfile>);
      if (sharedState.profile) {
        sharedState.profile = { ...sharedState.profile, ...safePayload };
        setLocalCachedProfile(user.uid, sharedState.profile);
      }
      broadcastState();

      await api.put('/api/users/me', safePayload);

      syncPublicProfile(user.uid, {
        ...(profile || {}),
        ...safePayload,
      }).catch((err) => {
        console.warn('[useUserProfile] syncPublicProfile failed:', err);
      });
    },
    [user?.uid, profile]
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
    profileCompleted,
    updateProfileData,
    retryFetch,
  };
}

export default useUserProfile;
