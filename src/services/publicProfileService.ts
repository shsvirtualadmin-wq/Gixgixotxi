import { api } from '../lib/api';
import { sanitizeStudentDisplayName } from '../utils/privacy';
import { deriveFallbackShortId } from '../utils/shortId';
import { calculateRankTitle } from '../config/rankLadder';
import type { PublicProfile, UserProfile } from '../types';

const publicProfileCache = new Map<string, { profile: PublicProfile; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getSessionCachedProfile(
  uid: string
): { profile: PublicProfile; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`boardly_pub_prof_${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.profile) {
      return parsed;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

function setSessionCachedProfile(uid: string, profile: PublicProfile) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `boardly_pub_prof_${uid}`,
      JSON.stringify({ profile, fetchedAt: Date.now() })
    );
  } catch {
    // Ignore storage quota/security errors
  }
}

/**
 * Synchronizes a user's sanitized public information into D1 `public_profiles`.
 * Strictly filters out any private fields: email, phone, payments, planExpiresAt, etc.
 */
export async function syncPublicProfile(
  uid: string,
  profileData: Partial<UserProfile> | Record<string, unknown>
): Promise<PublicProfile> {
  if (!uid) throw new Error('Cannot sync public profile: missing UID');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profileData as Record<string, any>;
  let existingCached =
    publicProfileCache.get(uid)?.profile ||
    getSessionCachedProfile(uid)?.profile ||
    null;

  if (!existingCached && (!p.displayName || !p.equipped)) {
    try {
      const res = await api.get<{ profile?: PublicProfile | null }>(
        `/api/public-profiles/${encodeURIComponent(uid)}`,
        { silentToast: true }
      );
      if (res?.profile) {
        existingCached = res.profile;
      }
    } catch {
      // Ignore read errors and proceed with available fields
    }
  }

  const shortCode =
    (p.studentId as string) ||
    (p.shortId as string) ||
    existingCached?.studentId ||
    deriveFallbackShortId(uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    (p.displayName as string) ||
      (p.username as string) ||
      (p.name as string) ||
      existingCached?.displayName,
    shortCode
  );

  const existingEquipped = (existingCached?.equipped as Record<string, unknown>) || {};
  const incomingEquipped = (p.equipped as Record<string, unknown>) || {};

  const frame =
    p.frame !== undefined
      ? (p.frame as string | null)
      : incomingEquipped.frame !== undefined
      ? (incomingEquipped.frame as string | null)
      : (existingEquipped.frame as string) || existingCached?.frame || null;

  const nameplate =
    p.nameplate !== undefined
      ? (p.nameplate as string | null)
      : incomingEquipped.nameplate !== undefined
      ? (incomingEquipped.nameplate as string | null)
      : (existingEquipped.nameplate as string) || existingCached?.nameplate || null;

  const effectId =
    p.effectId !== undefined
      ? (p.effectId as string | null)
      : incomingEquipped.effect !== undefined
      ? (incomingEquipped.effect as string | null)
      : (existingEquipped.effect as string) || existingCached?.effectId || null;

  const banner =
    p.banner !== undefined
      ? (p.banner as string | null)
      : incomingEquipped.banner !== undefined
      ? (incomingEquipped.banner as string | null)
      : (existingEquipped.banner as string) || existingCached?.banner || null;

  const rawCandidateAvatar =
    p.avatar !== undefined
      ? (p.avatar as string | null)
      : incomingEquipped.avatar !== undefined
      ? (incomingEquipped.avatar as string | null)
      : (existingEquipped.avatar as string) ||
        existingCached?.avatar ||
        (p.avatarKey as string) ||
        null;

  const avatar =
    rawCandidateAvatar && !String(rawCandidateAvatar).includes('googleusercontent.com')
      ? rawCandidateAvatar
      : existingCached?.avatar &&
        !String(existingCached.avatar).includes('googleusercontent.com')
      ? existingCached.avatar
      : null;

  const avatarUrl =
    (p.avatarUrl as string) || existingCached?.avatarUrl || null;

  const photoURL = (p.photoURL as string) || existingCached?.photoURL || null;

  const rawBadges = p.badges ?? p.equippedBadges ?? existingCached?.badges ?? [];
  const badges: string[] = Array.isArray(rawBadges) ? rawBadges.map(String) : [];

  const rawBio =
    typeof p.bio === 'string' ? p.bio.trim() : existingCached?.bio || '';
  const bio = rawBio.slice(0, 160);

  const rawStatus =
    typeof p.status === 'string' ? p.status.trim() : existingCached?.status || '';
  const status = rawStatus.slice(0, 40);

  const accent = (p.accent as string) || existingCached?.accent || '#E11D48';
  const crewName = (p.crewName as string) ?? (existingCached?.crewName || null);
  const memberSince =
    p.memberSince || p.createdAt || existingCached?.memberSince || Date.now();
  const lastActiveAt = p.lastActiveAt || Date.now();

  const inputStats =
    (p.stats as Record<string, unknown>) ||
    (p.publicStats as Record<string, unknown>) ||
    existingCached?.stats ||
    {};
  const streak = Number(
    inputStats.streak ?? p.streak ?? existingCached?.stats?.streak ?? 0
  );
  const longestStreak = Number(
    inputStats.longestStreak ??
      p.longestStreak ??
      existingCached?.stats?.longestStreak ??
      streak
  );
  const mcqs = Number(
    inputStats.mcqs ??
      inputStats.mcqsSolved ??
      inputStats.totalQuestionsSolved ??
      p.totalQuestionsSolved ??
      existingCached?.stats?.mcqs ??
      0
  );
  const accuracy = Number(
    inputStats.accuracy ?? p.accuracy ?? existingCached?.stats?.accuracy ?? 0
  );

  const stats = {
    streak,
    longestStreak,
    mcqs,
    accuracy,
    score: Number(inputStats.score ?? p.score ?? existingCached?.stats?.score ?? 0),
    testsCompleted: Number(
      inputStats.testsCompleted ??
        p.testsCompleted ??
        existingCached?.stats?.testsCompleted ??
        0
    ),
    totalQuestionsSolved: mcqs,
    mcqsSolved: mcqs,
  };

  const followersCount =
    typeof p.followersCount === 'number'
      ? p.followersCount
      : existingCached?.followersCount ?? 0;
  const followingCount =
    typeof p.followingCount === 'number'
      ? p.followingCount
      : existingCached?.followingCount ?? 0;

  const rankTitle = (p.rankTitle as string) || calculateRankTitle(mcqs, streak);
  const pinnedBadges = Array.isArray(p.pinnedBadges)
    ? p.pinnedBadges
    : existingCached?.pinnedBadges || [];
  const pinnedStamps = Array.isArray(p.pinnedStamps)
    ? p.pinnedStamps
    : existingCached?.pinnedStamps || [];

  const safePublicDoc: PublicProfile = {
    uid,
    displayName: cleanDisplayName,
    studentId: shortCode,
    avatar,
    banner,
    frame,
    nameplate,
    effectId,
    badges,
    bio,
    status,
    accent,
    memberSince,
    crewName,
    stats,
    followersCount,
    followingCount,
    lastActiveAt,
    rankTitle,
    pinnedBadges,
    pinnedStamps,
    nickname: (p.nickname as string) || cleanDisplayName,
    username: (p.username as string) || existingCached?.username || null,
    shortId: shortCode,
    avatarKey:
      (profileData.avatarKey as string) ||
      existingCached?.avatarKey ||
      avatar ||
      null,
    avatarVariant:
      (profileData.avatarVariant as string) ||
      existingCached?.avatarVariant ||
      null,
    avatarUrl,
    photoURL,
    crewId: (profileData.crewId as string) || existingCached?.crewId || null,
    role: (profileData.role as string) || existingCached?.role || 'student',
    customRole:
      (profileData.customRole as string) || existingCached?.customRole || null,
    equipped: {
      effect: effectId,
      frame,
      nameplate,
      avatar,
      banner,
    },
    publicStats: stats,
    updatedAt: Date.now(),
  };

  try {
    await api.post(
      '/api/public-profiles/sync',
      { uid, profile: safePublicDoc },
      { silentToast: true }
    );
    publicProfileCache.set(uid, { profile: safePublicDoc, fetchedAt: Date.now() });
    setSessionCachedProfile(uid, safePublicDoc);
  } catch (err) {
    console.warn(`[publicProfile] Failed to sync public_profiles/${uid}:`, err);
  }

  return safePublicDoc;
}

/**
 * Updates a user's profile atomically in BOTH `users` and `public_profiles` in D1.
 */
export async function updateProfileAtomic(
  uid: string,
  updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }
): Promise<PublicProfile> {
  if (!uid) throw new Error('Missing UID for profile update');

  const cleanUpdates = {
    displayName: updates.displayName.trim().slice(0, 40),
    bio: updates.bio.trim().slice(0, 160),
    status: updates.status.trim().slice(0, 40),
    accent: updates.accent || '#D71921',
    updatedAt: Date.now(),
  };

  await api.put('/api/users/me', cleanUpdates);

  publicProfileCache.delete(uid);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`boardly_pub_prof_${uid}`);
    } catch {
      // Ignore storage errors
    }
  }

  const fresh = await syncPublicProfile(uid, cleanUpdates);
  return fresh;
}

/**
 * Reads a single public profile from D1 `/api/public-profiles/:uid`.
 */
export async function getPublicProfile(
  uid: string,
  forceFresh = false
): Promise<PublicProfile | null> {
  if (!uid) return null;

  const fallbackShortId = deriveFallbackShortId(uid || 'guest');
  const fallbackDisplayName = sanitizeStudentDisplayName('', uid);
  const fallback: PublicProfile = {
    uid: uid || 'guest',
    displayName: fallbackDisplayName,
    studentId: fallbackShortId,
    shortId: fallbackShortId,
    avatar: null,
    banner: null,
    frame: null,
    nameplate: null,
    effectId: null,
    badges: [],
    bio: '',
    status: '',
    accent: '#D71921',
    memberSince: null,
    crewName: null,
    stats: {
      streak: 0,
      longestStreak: 0,
      mcqs: 0,
      accuracy: 0,
      score: 0,
      testsCompleted: 0,
      totalQuestionsSolved: 0,
    },
    publicStats: {
      streak: 0,
      longestStreak: 0,
      mcqs: 0,
      accuracy: 0,
      score: 0,
      testsCompleted: 0,
      totalQuestionsSolved: 0,
    },
    followersCount: 0,
    followingCount: 0,
    lastActiveAt: null,
    role: 'student',
  };

  if (!forceFresh) {
    const memCached = publicProfileCache.get(uid);
    const sessionCached = getSessionCachedProfile(uid);
    const cachedItem = memCached || sessionCached;

    if (cachedItem) {
      const isFresh = Date.now() - cachedItem.fetchedAt < CACHE_TTL_MS;
      if (isFresh) {
        setTimeout(() => {
          fetchPublicProfileFromNetwork(uid, fallback).catch(() => {});
        }, 150);
        return cachedItem.profile;
      }
    }
  }

  try {
    const fresh = await fetchPublicProfileFromNetwork(uid, fallback);
    return fresh;
  } catch (err) {
    console.warn(`[publicProfile] Network fetch failed for ${uid}:`, err);
    const stale =
      publicProfileCache.get(uid)?.profile ||
      getSessionCachedProfile(uid)?.profile;
    if (stale) {
      return stale;
    }
    return null;
  }
}

async function fetchPublicProfileFromNetwork(
  uid: string,
  fallback: PublicProfile
): Promise<PublicProfile | null> {
  const fallbackShortId = deriveFallbackShortId(uid || 'guest');
  const res = await api.get<{ profile?: Partial<PublicProfile> | null }>(
    `/api/public-profiles/${encodeURIComponent(uid)}`,
    { silentToast: true }
  );

  if (!res?.profile) {
    return null;
  }

  const data = res.profile;
  const studentId = data.studentId || data.shortId || fallbackShortId;
  const cleanDisplayName = sanitizeStudentDisplayName(
    data.displayName || fallback.displayName,
    studentId
  );

  const resolvedStats = data.stats || {
    streak: Number(data.publicStats?.streak || 0),
    longestStreak: Number(
      data.publicStats?.longestStreak || data.publicStats?.streak || 0
    ),
    mcqs: Number(
      data.publicStats?.mcqs || data.publicStats?.totalQuestionsSolved || 0
    ),
    accuracy: Number(data.publicStats?.accuracy || 0),
  };

  const resolvedProfile: PublicProfile = {
    ...fallback,
    ...data,
    uid: data.uid || uid,
    displayName: cleanDisplayName,
    studentId,
    avatar:
      data.avatar ??
      (data.equipped?.avatar || data.photoURL || data.avatarKey || null),
    banner: data.banner ?? null,
    frame: data.frame ?? (data.equipped?.frame || null),
    nameplate: data.nameplate ?? (data.equipped?.nameplate || null),
    effectId: data.effectId ?? (data.equipped?.effect || null),
    badges: Array.isArray(data.badges)
      ? data.badges
      : Array.isArray(data.equippedBadges)
      ? data.equippedBadges
      : [],
    bio: typeof data.bio === 'string' ? data.bio.slice(0, 160) : '',
    status: typeof data.status === 'string' ? data.status.slice(0, 40) : '',
    accent: data.accent || '#D71921',
    memberSince: data.memberSince ?? null,
    crewName: data.crewName ?? null,
    stats: resolvedStats,
    followersCount: Number(data.followersCount || 0),
    followingCount: Number(data.followingCount || 0),
    lastActiveAt: data.lastActiveAt ?? null,
    rankTitle:
      data.rankTitle || calculateRankTitle(resolvedStats.mcqs, resolvedStats.streak),
    pinnedBadges: Array.isArray(data.pinnedBadges) ? data.pinnedBadges : [],
    pinnedStamps: Array.isArray(data.pinnedStamps) ? data.pinnedStamps : [],
  };

  publicProfileCache.set(uid, { profile: resolvedProfile, fetchedAt: Date.now() });
  setSessionCachedProfile(uid, resolvedProfile);
  return resolvedProfile;
}

/**
 * Fetches multiple public profiles via D1 `/api/public-profiles/batch`.
 */
export async function getPublicProfiles(
  uids: string[]
): Promise<Map<string, PublicProfile>> {
  const result = new Map<string, PublicProfile>();
  const cleanUids = Array.from(new Set(uids.filter(Boolean)));
  if (cleanUids.length === 0) return result;

  const toFetch: string[] = [];
  const now = Date.now();

  for (const uid of cleanUids) {
    const cached = publicProfileCache.get(uid);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      result.set(uid, cached.profile);
    } else {
      toFetch.push(uid);
    }
  }

  if (toFetch.length > 0) {
    try {
      const res = await api.post<{ profiles?: PublicProfile[] }>(
        '/api/public-profiles/batch',
        { uids: toFetch },
        { silentToast: true }
      );
      const list = Array.isArray(res?.profiles) ? res.profiles : [];
      list.forEach((data) => {
        const id = data.uid;
        if (!id) return;
        data.displayName = sanitizeStudentDisplayName(
          data.displayName,
          data.shortId || id
        );
        publicProfileCache.set(id, { profile: data, fetchedAt: now });
        result.set(id, data);
      });
    } catch (err) {
      console.warn('[publicProfile] Batched D1 fetch error:', err);
    }
  }

  for (const uid of cleanUids) {
    if (!result.has(uid)) {
      const fallbackDisplayName = sanitizeStudentDisplayName('', uid);
      const fallback: PublicProfile = {
        uid,
        displayName: fallbackDisplayName,
        studentId: deriveFallbackShortId(uid),
        shortId: deriveFallbackShortId(uid),
        avatar: null,
        banner: null,
        frame: null,
        nameplate: null,
        effectId: null,
        badges: [],
        bio: '',
        status: '',
        accent: '#E11D48',
        memberSince: null,
        crewName: null,
        stats: {
          streak: 0,
          longestStreak: 0,
          mcqs: 0,
          accuracy: 0,
          score: 0,
          testsCompleted: 0,
          totalQuestionsSolved: 0,
          mcqsSolved: 0,
        },
        followersCount: 0,
        followingCount: 0,
        lastActiveAt: null,
        role: 'student',
      };
      result.set(uid, fallback);
    }
  }

  return result;
}

/**
 * Backfills all existing `users` into `public_profiles` in D1.
 */
export async function backfillAllPublicProfiles(): Promise<{
  totalUsers: number;
  backfilled: number;
}> {
  const res = await api.post<{ totalUsers: number; backfilled: number }>(
    '/api/admin/backfill-public-profiles',
    {}
  );
  return {
    totalUsers: Number(res?.totalUsers ?? 0),
    backfilled: Number(res?.backfilled ?? 0),
  };
}
