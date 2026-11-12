import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { isQuotaExhaustedError } from '@/utils/quota';
import {
  syncPublicProfile,
  broadcastPublicProfileUpdate,
  syncProfileToD1Backend,
  invalidatePublicProfileCache,
} from '@/services/publicProfileService';
import { invalidateCommonsPostsCache } from '@/services/commonsService';
import { ensureUserShortId } from '@/utils/shortId';
import type { UserProfile } from '@/types/index';

function getLocalCachedProfile(uid: string): UserProfile | null {
  try {
    const raw =
      localStorage.getItem(`cached_profile_${uid}`) ||
      localStorage.getItem(`boardly_user_profile_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function setLocalCachedProfile(uid: string, profile: UserProfile): void {
  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(`cached_profile_${uid}`, serialized);
    localStorage.setItem(`boardly_user_profile_${uid}`, serialized);
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
    nickname?: string;
    name?: string;
    username?: string;
    bio?: string;
    status?: string;
    accent?: string;
    photoURL?: string | null;
    academicTrack?: string;
    subjects?: string[];
    profileCompleted?: boolean;
    onboardingCompleted?: boolean;
    avatarKey?: string | null;
    avatarVariant?: string | null;
    avatar?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    equippedFrame?: string | null;
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
let lastFocusRefreshAt = 0;

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

export function forceRefreshUserProfile(uid?: string | null): Promise<void> {
  const targetUid = uid || activeUid;
  if (!targetUid || targetUid.startsWith('guest_')) return Promise.resolve();
  return getDoc(doc(db, 'users', targetUid))
    .then((snap) => {
      if (activeUid !== targetUid) return;
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const fullProfile: UserProfile = {
          ...(sharedState.profile || {}),
          ...data,
          uid: targetUid,
          photoURL: null,
          role: data.role || 'student',
          plan: data.plan || 'free',
          isPremium: Boolean(data.isPremium),
          planExpiresAt: data.planExpiresAt ?? undefined,
          premiumExpiresAt: data.premiumExpiresAt ?? undefined,
          proPlanId: data.proPlanId ?? undefined,
        };
        sharedState.docExists = true;
        sharedState.fetchStatus = 'success';
        sharedState.hasReceivedSnapshot = true;
        sharedState.error = null;
        sharedState.profile = fullProfile;
        setLocalCachedProfile(targetUid, fullProfile);
        broadcastState();
      }
    })
    .catch(() => {
      // Ignore transient refresh errors
    });
}

function startSubscription(uid: string, authProfileFallback?: UserProfile | null, forceRestart = false) {
  if (teardownTimeout) {
    clearTimeout(teardownTimeout);
    teardownTimeout = null;
  }

  // Guest accounts live in D1 and AuthContext — never query Firestore `users/guest_*`
  if (uid.startsWith('guest_') || authProfileFallback?.isGuest || authProfileFallback?.accountType === 'guest') {
    if (activeUnsub) {
      activeUnsub();
      activeUnsub = null;
    }
    if (activeTimeoutTimer) {
      clearTimeout(activeTimeoutTimer);
      activeTimeoutTimer = null;
    }
    activeUid = uid;
    const guestProfile: UserProfile = authProfileFallback || getLocalCachedProfile(uid) || {
      uid,
      email: '',
      displayName: uid.replace(/^guest_/, ''),
      name: uid.replace(/^guest_/, ''),
      username: uid.replace(/^guest_/, ''),
      shortId: 'GUEST',
      role: 'student',
      customRole: 'Guest',
      plan: 'free',
      status: 'active',
      isGuest: true,
      accountType: 'guest',
      profileCompleted: true,
      onboardingCompleted: true,
      streak: 0,
    };
    sharedState = {
      profile: guestProfile,
      docExists: true,
      fetchStatus: 'success',
      fetchDurationMs: 0,
      error: null,
      hasReceivedSnapshot: true,
    };
    setLocalCachedProfile(uid, guestProfile);
    broadcastState();
    return;
  }

  if (activeUid === uid && activeUnsub && !forceRestart) {
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
  const unsubSnapshot = onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
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
          ...(sharedState.profile || {}),
          ...data,
          uid,
          photoURL: null,
          role: data.role || authProfileFallback?.role || 'student',
          plan: data.plan || 'free',
          isPremium: Boolean(data.isPremium),
          planExpiresAt: data.planExpiresAt ?? undefined,
          premiumExpiresAt: data.premiumExpiresAt ?? undefined,
          proPlanId: data.proPlanId ?? undefined,
          customRole: data.customRole ?? authProfileFallback?.customRole,
        };
        sharedState.docExists = true;
        sharedState.fetchStatus = 'success';
        sharedState.profile = fullProfile;
        setLocalCachedProfile(uid, fullProfile);
        if (!data.shortId) {
          ensureUserShortId(uid, data.shortId).catch(() => {});
        }
      } else {
        sharedState.docExists = false;
        sharedState.fetchStatus = 'success';
        if (authProfileFallback) {
          sharedState.profile = authProfileFallback;
        }
      }
      broadcastState();
    },
    (err) => {
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
        message: isQuota ? 'High traffic right now, using your saved profile' : err.message,
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
    }
  );

  activeUnsub = () => {
    cancelled = true;
    try {
      unsubSnapshot();
    } catch {
      // Ignore unsub error
    }
  };
}

if (typeof window !== 'undefined') {
  const handleWindowRefresh = () => {
    if (!activeUid || activeUid.startsWith('guest_')) return;
    const now = Date.now();
    if (now - lastFocusRefreshAt < 1500) return;
    lastFocusRefreshAt = now;
    forceRefreshUserProfile(activeUid).catch(() => {});
  };
  window.addEventListener('focus', handleWindowRefresh);
  window.addEventListener('boardly:plan-refresh', () => {
    if (activeUid && !activeUid.startsWith('guest_')) {
      forceRefreshUserProfile(activeUid).catch(() => {});
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleWindowRefresh();
    }
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

export function seedSharedUserProfileCache(uid: string, profile: UserProfile): void {
  if (!uid || !profile) return;
  const clean: UserProfile = {
    ...(sharedState.profile || {}),
    ...profile,
    uid,
    photoURL: null,
  };
  sharedState.profile = clean;
  sharedState.docExists = true;
  sharedState.fetchStatus = 'success';
  sharedState.hasReceivedSnapshot = true;
  sharedState.error = null;
  setLocalCachedProfile(uid, clean);
  broadcastState();
}

export function getSharedUserProfileSnapshot(uid?: string | null): UserProfile | null {
  if (!uid) return sharedState.profile;
  if (sharedState.profile && sharedState.profile.uid === uid) {
    return sharedState.profile;
  }
  return getLocalCachedProfile(uid);
}

/**
 * Single shared hook for accessing and updating the active student's profile.
 * Coordinates through a singleton observer on `users/{uid}` to eliminate duplicate reads.
 * Prevents re-render cascades and ensures instant cache-first availability.
 */
export function useUserProfile(): UserProfileHookResult {
  const { user, profile: authProfile, profileLoading: authLoading, updateLocalProfile, syncGuestProgress, isGuest } = useAuth();
  const [tick, setTick] = useState(0);

  const authProfileRef = useRef<UserProfile | null>(authProfile);
  useEffect(() => {
    authProfileRef.current = authProfile;
  }, [authProfile]);

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
    startSubscription(user.uid, authProfileRef.current);

    return () => {
      subscriberCallbacks.delete(onUpdate);
      if (subscriberCallbacks.size === 0) {
        releaseSubscription();
      }
    };
  }, [user?.uid]);

  // Keep AuthContext profile synchronized whenever Firestore user doc updates plan/expiry/role/name/username
  useEffect(() => {
    if (!user?.uid || isGuest) return;
    const live = sharedState.profile;
    if (!live || live.uid !== user.uid) return;
    if (
      authProfile &&
      (authProfile.plan !== live.plan ||
        authProfile.isPremium !== live.isPremium ||
        authProfile.planExpiresAt !== live.planExpiresAt ||
        authProfile.premiumExpiresAt !== live.premiumExpiresAt ||
        authProfile.proPlanId !== live.proPlanId ||
        (live.displayName && authProfile.displayName !== live.displayName) ||
        (live.username && authProfile.username !== live.username) ||
        (live.bio !== undefined && authProfile.bio !== live.bio) ||
        (live.accent !== undefined && authProfile.accent !== live.accent))
    ) {
      updateLocalProfileRef.current({
        plan: live.plan,
        isPremium: live.isPremium,
        planExpiresAt: live.planExpiresAt,
        premiumExpiresAt: live.premiumExpiresAt,
        proPlanId: live.proPlanId,
        ...(live.displayName ? { displayName: live.displayName, name: live.displayName } : {}),
        ...(live.username ? { username: live.username } : {}),
        ...(live.bio !== undefined ? { bio: live.bio } : {}),
        ...(live.accent !== undefined ? { accent: live.accent } : {}),
      });
    }
  }, [user?.uid, isGuest, authProfile, tick]);

  useEffect(() => {
    if (!user?.uid || !authProfile) return;
    if (sharedState.profile && sharedState.profile.uid === user.uid) {
      const nextCustomRole = authProfile.customRole ?? sharedState.profile.customRole;
      const nextRole = authProfile.role || sharedState.profile.role || 'student';
      // Only fill missing username/displayName from authProfile; never overwrite a live sharedState value with a stale authProfile value
      const nextUsername = sharedState.profile.username || authProfile.username;
      const nextDisplayName = sharedState.profile.displayName || authProfile.displayName;
      if (
        nextCustomRole !== sharedState.profile.customRole ||
        nextRole !== sharedState.profile.role ||
        nextUsername !== sharedState.profile.username ||
        nextDisplayName !== sharedState.profile.displayName
      ) {
        sharedState.profile = {
          ...sharedState.profile,
          role: nextRole,
          customRole: nextCustomRole,
          username: nextUsername,
          displayName: nextDisplayName,
        };
        setLocalCachedProfile(user.uid, sharedState.profile);
        broadcastState();
      }
    }
  }, [user?.uid, authProfile]);

  const profile =
    (isGuest && authProfile ? authProfile : null) ||
    sharedState.profile ||
    authProfile ||
    (user?.uid ? getLocalCachedProfile(user.uid) : null);
  const hasReceivedSnapshot = isGuest ? true : sharedState.hasReceivedSnapshot;
  const docExists = isGuest ? true : sharedState.docExists;
  const fetchStatus = isGuest ? 'success' : sharedState.fetchStatus;
  const fetchDurationMs = sharedState.fetchDurationMs;
  const error = isGuest ? null : sharedState.error;

  const retryFetch = useCallback(() => {
    if (user?.uid) {
      startSubscription(user.uid, authProfile, true);
      forceRefreshUserProfile(user.uid).catch(() => {});
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
      nickname?: string;
      name?: string;
      username?: string;
      bio?: string;
      status?: string;
      accent?: string;
      photoURL?: string | null;
      avatarKey?: string | null;
      avatarVariant?: string | null;
      avatar?: string | null;
      equippedAvatar?: string | null;
      frame?: string | null;
      equippedFrame?: string | null;
      subjects?: string[];
      profileCompleted?: boolean;
      onboardingCompleted?: boolean;
    }) => {
      if (!user?.uid) throw new Error('Cannot update profile: Unauthenticated user');
      const path = `users/${user.uid}`;
      const nowIso = new Date().toISOString();

      // Serializable client payload (no Firestore FieldValue objects in state/localStorage)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localPayload: Record<string, any> = {
        updatedAt: nowIso,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firestorePayload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      const nextNameRaw = updates.displayName ?? updates.nickname ?? updates.name;
      if (nextNameRaw !== undefined) {
        const cleanName = String(nextNameRaw).trim();
        localPayload.displayName = cleanName;
        localPayload.nickname = cleanName;
        localPayload.name = cleanName;
        firestorePayload.displayName = cleanName;
        firestorePayload.nickname = cleanName;
        firestorePayload.name = cleanName;
      }
      if (updates.username !== undefined) {
        const cleanUsername = String(updates.username).trim();
        localPayload.username = cleanUsername;
        localPayload.usernameLower = cleanUsername.toLowerCase();
        firestorePayload.username = cleanUsername;
        firestorePayload.usernameLower = cleanUsername.toLowerCase();
      }
      if (updates.bio !== undefined) {
        localPayload.bio = String(updates.bio);
        firestorePayload.bio = String(updates.bio);
      }
      if (updates.status !== undefined) {
        localPayload.status = String(updates.status);
        firestorePayload.status = String(updates.status);
      }
      if (updates.accent !== undefined) {
        localPayload.accent = String(updates.accent);
        firestorePayload.accent = String(updates.accent);
      }
      if (updates.photoURL !== undefined) {
        localPayload.photoURL = updates.photoURL;
        firestorePayload.photoURL = updates.photoURL;
      }
      if (updates.avatarKey !== undefined) {
        localPayload.avatarKey = updates.avatarKey;
        firestorePayload.avatarKey = updates.avatarKey;
      }
      if (updates.avatarVariant !== undefined) {
        localPayload.avatarVariant = updates.avatarVariant;
        firestorePayload.avatarVariant = updates.avatarVariant;
      }
      if (updates.avatar !== undefined || updates.equippedAvatar !== undefined) {
        const av = updates.equippedAvatar ?? updates.avatar ?? null;
        localPayload.avatar = av;
        localPayload.equippedAvatar = av;
        firestorePayload.avatar = av;
        firestorePayload.equippedAvatar = av;
      }
      if (updates.frame !== undefined || updates.equippedFrame !== undefined) {
        const fr = updates.equippedFrame ?? updates.frame ?? null;
        localPayload.frame = fr;
        localPayload.equippedFrame = fr;
        firestorePayload.frame = fr;
        firestorePayload.equippedFrame = fr;
      }
      if (updates.subjects !== undefined) {
        localPayload.subjects = updates.subjects;
        firestorePayload.subjects = updates.subjects;
      }
      if (updates.profileCompleted !== undefined || updates.onboardingCompleted !== undefined) {
        const completed = Boolean(updates.profileCompleted ?? updates.onboardingCompleted);
        localPayload.profileCompleted = completed;
        localPayload.onboardingCompleted = completed;
        firestorePayload.profileCompleted = completed;
        firestorePayload.onboardingCompleted = completed;
        if (completed) {
          localPayload.onboardingCompletedAt = nowIso;
          localPayload.profileCompletedAt = nowIso;
          firestorePayload.onboardingCompletedAt = serverTimestamp();
          firestorePayload.profileCompletedAt = serverTimestamp();
        }
      }

      if (isGuest || user.uid.startsWith('guest_')) {
        await syncGuestProgress({
          stats: {
            ...(updates.subjects ? { subjects: updates.subjects } : {}),
            ...(updates.avatarKey ? { avatarKey: updates.avatarKey } : {}),
            ...(updates.avatarVariant ? { avatarVariant: updates.avatarVariant } : {}),
          },
        });
        await syncProfileToD1Backend(user.uid, {
          ...(profile || {}),
          ...localPayload,
        });
        updateLocalProfileRef.current(localPayload);
        if (sharedState.profile) {
          sharedState.profile = { ...sharedState.profile, ...localPayload };
          setLocalCachedProfile(user.uid, sharedState.profile);
        }
        broadcastState();
        broadcastPublicProfileUpdate(user.uid, localPayload);
        invalidateCommonsPostsCache();
        return;
      }

      // 1. Perform confirmed server writes FIRST (Firestore users/{uid}, publicProfiles/{uid}, D1 user_usernames, Firebase Auth)
      await setDoc(doc(db, 'users', user.uid), firestorePayload, { merge: true });

      const mergedForPublic = {
        ...(profile || {}),
        ...localPayload,
      };

      await Promise.all([
        syncPublicProfile(user.uid, mergedForPublic),
        syncProfileToD1Backend(user.uid, mergedForPublic),
        localPayload.displayName && auth.currentUser && auth.currentUser.uid === user.uid
          ? firebaseUpdateProfile(auth.currentUser, {
              displayName: localPayload.displayName,
            }).catch(() => {})
          : Promise.resolve(),
      ]);

      // 2. Server confirmed — update all shared client stores immediately so header, dashboard, cockpit, profile, Commons, and settings reflect the change without refresh
      updateLocalProfileRef.current(localPayload);
      const nextSharedProfile: UserProfile = {
        ...(sharedState.profile || profile || ({ uid: user.uid } as UserProfile)),
        ...localPayload,
        uid: user.uid,
      };
      sharedState.profile = nextSharedProfile;
      sharedState.docExists = true;
      sharedState.fetchStatus = 'success';
      sharedState.hasReceivedSnapshot = true;
      setLocalCachedProfile(user.uid, nextSharedProfile);
      broadcastState();

      invalidatePublicProfileCache(user.uid);
      broadcastPublicProfileUpdate(user.uid, nextSharedProfile);
      invalidateCommonsPostsCache();

      console.log(`[useUserProfile] Confirmed profile update to ${path}:`, localPayload);
    },
    [user?.uid, profile, isGuest, syncGuestProgress]
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
