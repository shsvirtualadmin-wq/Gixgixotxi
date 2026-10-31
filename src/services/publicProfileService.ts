import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  writeBatch,
  serverTimestamp,
  documentId,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeStudentDisplayName } from '../utils/privacy';
import { deriveFallbackShortId } from '../utils/shortId';
import { calculateRankTitle } from '../config/rankLadder';
import type { PublicProfile, UserProfile } from '../types';

// In-memory cache + sessionStorage for public profiles (5 min TTL)
const publicProfileCache = new Map<string, { profile: PublicProfile; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

function getSessionCachedProfile(uid: string): { profile: PublicProfile; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`boardly_pub_prof_${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.profile) {
      return parsed;
    }
  } catch (_e) {
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
  } catch (_e) {
    // Ignore storage quota/security errors
  }
}

/**
 * Synchronizes a user's sanitized public information into `publicProfiles/{uid}`.
 * Strictly filters out any private fields: email, phone, payments, planExpiresAt, etc.
 */
export async function syncPublicProfile(
  uid: string,
  profileData: Partial<UserProfile> | Record<string, unknown>
): Promise<PublicProfile> {
  if (!uid) throw new Error('Cannot sync public profile: missing UID');

  const p = profileData as Record<string, any>;
  let existingCached = publicProfileCache.get(uid)?.profile || getSessionCachedProfile(uid)?.profile || null;

  // If cache is cold and partial data is passed (e.g., equipping an item), read existing publicProfiles/{uid} first
  if (!existingCached && (!p.displayName || !p.equipped)) {
    try {
      const snap = await getDoc(doc(db, 'publicProfiles', uid));
      if (snap.exists()) {
        existingCached = snap.data() as PublicProfile;
      }
    } catch (_e) {
      // Ignore read errors and proceed with available fields
    }
  }

  const shortCode = (p.studentId as string) || (p.shortId as string) || existingCached?.studentId || deriveFallbackShortId(uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    (p.displayName as string) || (p.username as string) || (p.name as string) || existingCached?.displayName,
    shortCode
  );

  const existingEquipped = (existingCached?.equipped as Record<string, unknown>) || {};
  const incomingEquipped = (p.equipped as Record<string, unknown>) || {};
  const equipped = { ...existingEquipped, ...incomingEquipped };

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

  // Avatar priority: 1) equipped store avatar, 2) custom chosen avatar, 3) existing saved avatar (NEVER let Google photoURL overwrite a Boardly avatar)
  const rawCandidateAvatar =
    p.avatar !== undefined
      ? (p.avatar as string | null)
      : incomingEquipped.avatar !== undefined
      ? (incomingEquipped.avatar as string | null)
      : (existingEquipped.avatar as string) || existingCached?.avatar || (p.avatarKey as string) || null;

  // Ensure a Google photoURL is never stored as the equipped store avatar ID
  const avatar =
    rawCandidateAvatar && !String(rawCandidateAvatar).includes('googleusercontent.com')
      ? rawCandidateAvatar
      : existingCached?.avatar && !String(existingCached.avatar).includes('googleusercontent.com')
      ? existingCached.avatar
      : null;

  const avatarUrl =
    (p.avatarUrl as string) ||
    (existingCached as any)?.avatarUrl ||
    null;

  const photoURL =
    (p.photoURL as string) ||
    existingCached?.photoURL ||
    null;

  const rawBadges = p.badges ?? p.equippedBadges ?? existingCached?.badges ?? [];
  const badges: string[] = Array.isArray(rawBadges) ? rawBadges.map(String) : [];

  const rawBio = typeof p.bio === 'string' ? p.bio.trim() : (existingCached?.bio || '');
  const bio = rawBio.slice(0, 160);

  const rawStatus = typeof p.status === 'string' ? p.status.trim() : (existingCached?.status || '');
  const status = rawStatus.slice(0, 40);

  const accent = (p.accent as string) || existingCached?.accent || '#E11D48';
  const crewName = (p.crewName as string) ?? (existingCached?.crewName || null);
  const memberSince = (p.memberSince as any) || (p.createdAt as any) || existingCached?.memberSince || serverTimestamp();
  const lastActiveAt = (p.lastActiveAt as any) || serverTimestamp();

  const inputStats = (p.stats as Record<string, unknown>) || (p.publicStats as Record<string, unknown>) || existingCached?.stats || {};
  const streak = Number(inputStats.streak ?? p.streak ?? existingCached?.stats?.streak ?? 0);
  const longestStreak = Number(inputStats.longestStreak ?? p.longestStreak ?? existingCached?.stats?.longestStreak ?? streak);
  const mcqs = Number(
    inputStats.mcqs ??
      inputStats.mcqsSolved ??
      inputStats.totalQuestionsSolved ??
      p.totalQuestionsSolved ??
      existingCached?.stats?.mcqs ??
      0
  );
  const accuracy = Number(inputStats.accuracy ?? p.accuracy ?? existingCached?.stats?.accuracy ?? 0);

  const stats = {
    streak,
    longestStreak,
    mcqs,
    accuracy,
    score: Number(inputStats.score ?? p.score ?? existingCached?.stats?.score ?? 0),
    testsCompleted: Number(inputStats.testsCompleted ?? p.testsCompleted ?? existingCached?.stats?.testsCompleted ?? 0),
    totalQuestionsSolved: mcqs,
    mcqsSolved: mcqs,
  };

  const followersCount = typeof p.followersCount === 'number'
    ? p.followersCount
    : (existingCached?.followersCount ?? 0);
  const followingCount = typeof p.followingCount === 'number'
    ? p.followingCount
    : (existingCached?.followingCount ?? 0);

  const rankTitle = (p.rankTitle as string) || calculateRankTitle(mcqs, streak);
  const pinnedBadges = Array.isArray(p.pinnedBadges) ? p.pinnedBadges : (existingCached?.pinnedBadges || []);
  const pinnedStamps = Array.isArray(p.pinnedStamps) ? p.pinnedStamps : (existingCached?.pinnedStamps || []);

  // Strictly contains NO email and NO phone
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

    // Legacy compatibility fields & identity
    nickname: (p.nickname as string) || cleanDisplayName,
    username: (p.username as string) || existingCached?.username || null,
    shortId: shortCode,
    avatarKey: (profileData.avatarKey as string) || existingCached?.avatarKey || avatar || null,
    avatarVariant: (profileData.avatarVariant as string) || existingCached?.avatarVariant || null,
    avatarUrl,
    photoURL,
    crewId: (profileData.crewId as string) || existingCached?.crewId || null,
    role: (profileData.role as string) || existingCached?.role || 'student',
    customRole: (profileData.customRole as string) || (existingCached as any)?.customRole || null,
    equipped: {
      effect: effectId,
      frame,
      nameplate,
      avatar,
      banner,
    },
    publicStats: stats,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'publicProfiles', uid), safePublicDoc, { merge: true });
    publicProfileCache.set(uid, { profile: safePublicDoc, fetchedAt: Date.now() });
    setSessionCachedProfile(uid, safePublicDoc);
  } catch (err) {
    console.warn(`[publicProfile] Failed to sync publicProfiles/${uid}:`, err);
  }

  return safePublicDoc;
}

/**
 * Updates a user's profile atomically in BOTH users/{uid} and publicProfiles/{uid} via a Firestore batch write.
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

  const userRef = doc(db, 'users', uid);
  const pubRef = doc(db, 'publicProfiles', uid);

  const cleanUpdates = {
    displayName: updates.displayName.trim().slice(0, 40),
    bio: updates.bio.trim().slice(0, 160),
    status: updates.status.trim().slice(0, 40),
    accent: updates.accent || '#D71921',
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.update(userRef, cleanUpdates);
  batch.set(pubRef, cleanUpdates, { merge: true });

  await batch.commit();

  // Invalidate cache immediately
  publicProfileCache.delete(uid);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`boardly_pub_prof_${uid}`);
    } catch (_e) {
      // Ignore storage errors on cache clear
    }
  }

  // Sync and return fresh public profile
  const fresh = await syncPublicProfile(uid, cleanUpdates);
  return fresh;
}

/**
 * Reads a single public profile from `publicProfiles/{uid}`.
 * Cached for 5 minutes in sessionStorage with background revalidation.
 * Offline resilient: returns cached version if network fails.
 */
export async function getPublicProfile(uid: string, forceFresh = false): Promise<PublicProfile | null> {
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

  // 1. Check in-memory or sessionStorage cache
  if (!forceFresh) {
    const memCached = publicProfileCache.get(uid);
    const sessionCached = getSessionCachedProfile(uid);
    const cachedItem = memCached || sessionCached;

    if (cachedItem) {
      const isFresh = Date.now() - cachedItem.fetchedAt < CACHE_TTL_MS;
      if (isFresh) {
        // Trigger background revalidation
        setTimeout(() => {
          fetchPublicProfileFromNetwork(uid, fallback).catch(() => {});
        }, 150);
        return cachedItem.profile;
      }
    }
  }

  // 2. Fetch fresh from network
  try {
    const fresh = await fetchPublicProfileFromNetwork(uid, fallback);
    return fresh;
  } catch (err) {
    console.warn(`[publicProfile] Network fetch failed for ${uid}:`, err);
    // Offline resilience: return stale cached profile if available
    const stale = publicProfileCache.get(uid)?.profile || getSessionCachedProfile(uid)?.profile;
    if (stale) {
      return stale;
    }
    // Return null if not found
    return null;
  }
}

async function fetchPublicProfileFromNetwork(
  uid: string,
  fallback: PublicProfile
): Promise<PublicProfile | null> {
  const fallbackShortId = deriveFallbackShortId(uid || 'guest');
  const snap = await getDoc(doc(db, 'publicProfiles', uid));

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as Partial<PublicProfile>;
  const studentId = data.studentId || data.shortId || fallbackShortId;
  const cleanDisplayName = sanitizeStudentDisplayName(data.displayName || fallback.displayName, studentId);

  const resolvedStats = data.stats || {
    streak: Number(data.publicStats?.streak || 0),
    longestStreak: Number(data.publicStats?.longestStreak || data.publicStats?.streak || 0),
    mcqs: Number(data.publicStats?.mcqs || data.publicStats?.totalQuestionsSolved || 0),
    accuracy: Number(data.publicStats?.accuracy || 0),
  };

  const resolvedProfile: PublicProfile = {
    ...fallback,
    ...data,
    uid,
    displayName: cleanDisplayName,
    studentId,
    avatar: data.avatar ?? (data.equipped?.avatar || data.photoURL || data.avatarKey || null),
    banner: data.banner ?? null,
    frame: data.frame ?? (data.equipped?.frame || null),
    nameplate: data.nameplate ?? (data.equipped?.nameplate || null),
    effectId: data.effectId ?? (data.equipped?.effect || null),
    badges: Array.isArray(data.badges) ? data.badges : (Array.isArray(data.equippedBadges) ? data.equippedBadges : []),
    bio: typeof data.bio === 'string' ? data.bio.slice(0, 160) : '',
    status: typeof data.status === 'string' ? data.status.slice(0, 40) : '',
    accent: data.accent || '#D71921',
    memberSince: data.memberSince ?? null,
    crewName: data.crewName ?? null,
    stats: resolvedStats,
    followersCount: Number(data.followersCount || 0),
    followingCount: Number(data.followingCount || 0),
    lastActiveAt: data.lastActiveAt ?? null,
    rankTitle: (data as any)?.rankTitle || calculateRankTitle(resolvedStats.mcqs, resolvedStats.streak),
    pinnedBadges: Array.isArray((data as any)?.pinnedBadges) ? (data as any).pinnedBadges : [],
    pinnedStamps: Array.isArray((data as any)?.pinnedStamps) ? (data as any).pinnedStamps : [],
  };

  publicProfileCache.set(uid, { profile: resolvedProfile, fetchedAt: Date.now() });
  setSessionCachedProfile(uid, resolvedProfile);
  return resolvedProfile;
}

/**
 * Fetches multiple public profiles in batched chunks of 30 (Firestore in limit).
 */
export async function getPublicProfiles(uids: string[]): Promise<Map<string, PublicProfile>> {
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

  if (toFetch.length === 0) return result;

  // Chunk in batches of 30
  const CHUNK_SIZE = 30;
  for (let i = 0; i < toFetch.length; i += CHUNK_SIZE) {
    const chunk = toFetch.slice(i, i + CHUNK_SIZE);
    try {
      const q = query(collection(db, 'publicProfiles'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as PublicProfile;
        data.displayName = sanitizeStudentDisplayName(data.displayName, data.shortId || d.id);
        publicProfileCache.set(d.id, { profile: data, fetchedAt: now });
        result.set(d.id, data);
      });
    } catch (err) {
      console.warn('[publicProfile] Batched fetch error for chunk:', err);
    }
  }

  // Any missing UIDs get a clean fallback
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
 * Backfills all existing `users` documents into `publicProfiles/{uid}`.
 * Runs with atomic batched writes of up to 400 per commit.
 * Only the superadmin can execute this.
 */
export async function backfillAllPublicProfiles(): Promise<{ totalUsers: number; backfilled: number }> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = usersSnap.docs;
  let backfilledCount = 0;

  const BATCH_SIZE = 400;
  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const chunk = allUsers.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const userDoc of chunk) {
      const data = userDoc.data();
      const uid = userDoc.id;
      const shortCode = data.shortId || deriveFallbackShortId(uid);
      const cleanDisplayName = sanitizeStudentDisplayName(
        data.displayName || data.name,
        shortCode
      );

      let userEquipped: PublicProfile['equipped'] = {
        effect: data.equipped?.effect || null,
        frame: data.equipped?.frame || null,
        nameplate: data.equipped?.nameplate || null,
        avatar: data.equipped?.avatar || null,
      };

      try {
        const wSnap = await getDoc(doc(db, 'wallets', uid));
        if (wSnap.exists()) {
          const wData = wSnap.data();
          if (wData.equipped) {
            userEquipped = {
              effect: wData.equipped.effect ?? userEquipped.effect,
              frame: wData.equipped.frame ?? userEquipped.frame,
              nameplate: wData.equipped.nameplate ?? userEquipped.nameplate,
              avatar: wData.equipped.avatar ?? userEquipped.avatar,
            };
          }
        }
      } catch {
        // Fallback to data.equipped
      }

      const streak = Number(data.streak || 0);
      const longestStreak = Number(data.longestStreak || streak);
      const mcqs = Number(data.totalQuestionsSolved || data.mcqsSolved || 0);
      const accuracy = Number(data.accuracy || 0);

      const stats = {
        streak,
        longestStreak,
        mcqs,
        accuracy,
        score: Number(data.score || 0),
        testsCompleted: Number(data.testsCompleted || 0),
        totalQuestionsSolved: mcqs,
        mcqsSolved: mcqs,
      };

      const publicDocRef = doc(db, 'publicProfiles', uid);
      const publicData: PublicProfile = {
        uid,
        displayName: cleanDisplayName,
        studentId: shortCode,
        avatar: (data.avatar as string) || userEquipped.avatar || data.photoURL || data.avatarKey || null,
        banner: data.banner || null,
        frame: data.frame || userEquipped.frame || null,
        nameplate: data.nameplate || userEquipped.nameplate || null,
        effectId: data.effectId || userEquipped.effect || null,
        badges: Array.isArray(data.badges) ? data.badges : (Array.isArray(data.equippedBadges) ? data.equippedBadges : []),
        bio: typeof data.bio === 'string' ? data.bio.trim().slice(0, 160) : '',
        status: typeof data.status === 'string' ? data.status.trim().slice(0, 40) : '',
        accent: data.accent || '#E11D48',
        memberSince: data.memberSince || data.createdAt || serverTimestamp(),
        crewName: data.crewName || null,
        stats,
        followersCount: Number(data.followersCount || 0),
        followingCount: Number(data.followingCount || 0),
        lastActiveAt: data.lastActiveDate || data.lastActiveAt || serverTimestamp(),

        avatarKey: data.avatarKey || null,
        avatarVariant: data.avatarVariant || null,
        photoURL: data.photoURL || null,
        crewId: data.crewId || null,
        role: data.role || 'student',
        shortId: shortCode,
        equipped: userEquipped,
        publicStats: stats,
        updatedAt: serverTimestamp(),
      };

      batch.set(publicDocRef, publicData, { merge: true });
      backfilledCount++;
    }

    await batch.commit();
  }

  return {
    totalUsers: allUsers.length,
    backfilled: backfilledCount,
  };
}
