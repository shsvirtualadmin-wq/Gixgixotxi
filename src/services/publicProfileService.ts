import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  documentId,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import type { PublicProfile as BasePublicProfile } from '@/types';

export interface PublicProfile extends BasePublicProfile {
  usernameLower?: string;
  isVerified?: boolean;
  isCaptain?: boolean;
  board?: string;
  grade?: string | number;
  targetUniversity?: string;
  equippedAvatar?: string | null;
  equippedFrame?: string | null;
  equippedNameplate?: string | null;
  equippedBanner?: string | null;
  equippedEffect?: string | null;
  equippedStreakBadges?: string[];
}

const SESSION_CACHE_PREFIX = 'boardly_pub_prof_v2_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Layer 1: In-memory cache
const memoryCache = new Map<string, { profile: PublicProfile; timestamp: number }>();

// Layer 2: In-flight promise deduplication
const inFlightRequests = new Map<string, Promise<PublicProfile | null>>();

function getFromSessionCache(uid: string): PublicProfile | null {
  try {
    const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - (parsed.timestamp || 0) > CACHE_TTL_MS) {
      sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${uid}`);
      return null;
    }
    return parsed.profile as PublicProfile;
  } catch {
    return null;
  }
}

function saveToCaches(uid: string, profile: PublicProfile): void {
  const entry = { profile, timestamp: Date.now() };
  memoryCache.set(uid, entry);
  try {
    sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${uid}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidatePublicProfileCache(uid?: string): void {
  if (!uid) {
    memoryCache.clear();
    return;
  }
  memoryCache.delete(uid);
  try {
    sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${uid}`);
  } catch {
    // Ignore
  }
}

export function normalizePublicProfileDoc(
  uid: string,
  pubData?: Record<string, any> | null,
  uData?: Record<string, any> | null,
  walletData?: Record<string, any> | null
): PublicProfile {
  const p = pubData || {};
  const u = uData || {};
  const wEquipped = walletData?.equipped || {};

  const shortId = u.studentId || u.shortId || p.studentId || p.shortId || uid.slice(0, 6).toUpperCase();
  const rawName = u.displayName || p.displayName || u.name || p.name || u.username || p.username || 'Student';
  const displayName = sanitizeStudentDisplayName(rawName, shortId);

  const equippedAvatar =
    u.equipped?.avatar ||
    p.equippedAvatar ||
    p.equipped?.avatar ||
    wEquipped.avatar ||
    u.avatar ||
    p.avatar ||
    null;

  const equippedFrame =
    u.equipped?.frame ||
    p.equippedFrame ||
    p.equipped?.frame ||
    wEquipped.frame ||
    u.frame ||
    p.frame ||
    null;

  const equippedNameplate =
    u.equipped?.nameplate ||
    p.equippedNameplate ||
    p.equipped?.nameplate ||
    wEquipped.nameplate ||
    u.nameplate ||
    p.nameplate ||
    null;

  const equippedBanner =
    u.equipped?.banner ||
    p.equippedBanner ||
    p.equipped?.banner ||
    wEquipped.banner ||
    u.banner ||
    p.banner ||
    null;

  const equippedEffect =
    u.equipped?.effect ||
    p.equippedEffect ||
    p.equipped?.effect ||
    wEquipped.effect ||
    u.effectId ||
    p.effectId ||
    null;

  const rawBadges =
    Array.isArray(u.badges) && u.badges.length > 0
      ? u.badges
      : Array.isArray(p.badges)
      ? p.badges
      : [];

  const equippedStreakBadges =
    Array.isArray(u.equippedStreakBadges) && u.equippedStreakBadges.length > 0
      ? u.equippedStreakBadges
      : Array.isArray(p.equippedStreakBadges) && p.equippedStreakBadges.length > 0
      ? p.equippedStreakBadges
      : [];

  const stats = {
    streak: Number(u.streak ?? p.stats?.streak ?? p.publicStats?.streak ?? 0),
    longestStreak: Number(u.longestStreak ?? p.stats?.longestStreak ?? u.streak ?? 0),
    mcqs: Number(u.totalQuestionsSolved ?? u.mcqsSolved ?? p.stats?.mcqs ?? p.publicStats?.score ?? 0),
    accuracy: Number(u.accuracy ?? p.stats?.accuracy ?? 0),
    score: Number(u.score ?? p.publicStats?.score ?? 0),
    totalQuestionsSolved: Number(u.totalQuestionsSolved ?? p.stats?.mcqs ?? 0),
  };

  return {
    uid,
    displayName,
    studentId: shortId,
    shortId,
    username: u.username || p.username || undefined,
    usernameLower:
      u.usernameLower ||
      p.usernameLower ||
      (u.username || p.username ? String(u.username || p.username).toLowerCase() : undefined),
    role: u.role || p.role || 'student',
    customRole: u.customRole || p.customRole || undefined,
    isVerified: Boolean(u.isVerified ?? p.isVerified ?? u.verified ?? p.verified),
    isCaptain: Boolean(u.isCaptain ?? p.isCaptain),
    board: u.board || p.board || undefined,
    grade: u.grade || p.grade || u.class || p.class || undefined,
    targetUniversity: u.targetUniversity || p.targetUniversity || undefined,
    bio: u.bio ?? p.bio ?? '',
    status: u.status ?? p.status ?? '',
    accent: u.accent || p.accent || '#D71921',
    memberSince: u.createdAt || p.memberSince || null,
    crewName: u.crewName || p.crewName || null,
    lastActiveAt: u.lastActiveDate || p.lastActiveAt || null,
    stats,
    publicStats: stats,
    avatar: equippedAvatar,
    avatarKey: u.avatarKey || p.avatarKey || null,
    avatarVariant: u.avatarVariant || p.avatarVariant || null,
    avatarUrl: u.avatarUrl || p.avatarUrl || null,
    photoURL: u.photoURL || p.photoURL || null,
    equippedAvatar,
    equippedFrame,
    equippedNameplate,
    equippedBanner,
    equippedEffect,
    frame: equippedFrame,
    nameplate: equippedNameplate,
    banner: equippedBanner,
    effectId: equippedEffect,
    equipped: {
      avatar: equippedAvatar,
      frame: equippedFrame,
      nameplate: equippedNameplate,
      banner: equippedBanner,
      effect: equippedEffect,
    },
    badges: rawBadges,
    equippedStreakBadges,
    followersCount:
      typeof p.followersCount === 'number'
        ? Math.max(0, p.followersCount)
        : typeof u.followersCount === 'number'
        ? Math.max(0, u.followersCount)
        : 0,
    followingCount:
      typeof p.followingCount === 'number'
        ? Math.max(0, p.followingCount)
        : typeof u.followingCount === 'number'
        ? Math.max(0, u.followingCount)
        : 0,
    updatedAt: u.updatedAt || p.updatedAt || null,
  };
}

async function fetchPublicProfileFromNetwork(uid: string): Promise<PublicProfile | null> {
  try {
    const [pubSnap, userSnap, walletSnap] = await Promise.all([
      getDoc(doc(db, 'publicProfiles', uid)).catch(() => null),
      getDoc(doc(db, 'users', uid)).catch(() => null),
      getDoc(doc(db, 'wallets', uid)).catch(() => null),
    ]);

    const pubData = pubSnap?.exists() ? pubSnap.data() : null;
    const uData = userSnap?.exists() ? userSnap.data() : null;
    const walletData = walletSnap?.exists() ? walletSnap.data() : null;

    if (!pubData && !uData) {
      return null;
    }

    const profile = normalizePublicProfileDoc(uid, pubData, uData, walletData);
    saveToCaches(uid, profile);
    return profile;
  } catch (err) {
    console.warn(`[publicProfileService] Failed to fetch profile for ${uid}:`, err);
    return null;
  }
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  if (!uid) return null;

  const mem = memoryCache.get(uid);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.profile;
  }

  const sess = getFromSessionCache(uid);
  if (sess) {
    memoryCache.set(uid, { profile: sess, timestamp: Date.now() });
    return sess;
  }

  const existingPromise = inFlightRequests.get(uid);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = fetchPublicProfileFromNetwork(uid).finally(() => {
    inFlightRequests.delete(uid);
  });

  inFlightRequests.set(uid, promise);
  return promise;
}

/**
 * Batch fetches multiple public profiles with caching and chunked queries.
 */
export async function getPublicProfiles(uids: string[]): Promise<Map<string, PublicProfile>> {
  const result = new Map<string, PublicProfile>();
  if (!uids || uids.length === 0) return result;

  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const missingUids: string[] = [];

  for (const uid of uniqueUids) {
    const mem = memoryCache.get(uid);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
      result.set(uid, mem.profile);
      continue;
    }
    const sess = getFromSessionCache(uid);
    if (sess) {
      memoryCache.set(uid, { profile: sess, timestamp: Date.now() });
      result.set(uid, sess);
      continue;
    }
    missingUids.push(uid);
  }

  if (missingUids.length === 0) {
    return result;
  }

  const CHUNK_SIZE = 10;
  for (let i = 0; i < missingUids.length; i += CHUNK_SIZE) {
    const chunk = missingUids.slice(i, i + CHUNK_SIZE);
    try {
      const q = query(collection(db, 'publicProfiles'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q).catch(() => null);
      const pubDocsByUid = new Map<string, Record<string, any>>();
      snap?.docs.forEach((docSnap) => {
        pubDocsByUid.set(docSnap.id, docSnap.data());
      });

      await Promise.all(
        chunk.map(async (uid) => {
          const pubData = pubDocsByUid.get(uid) || null;
          const [uSnap, wSnap] = await Promise.all([
            getDoc(doc(db, 'users', uid)).catch(() => null),
            getDoc(doc(db, 'wallets', uid)).catch(() => null),
          ]);
          const uData = uSnap?.exists() ? uSnap.data() : null;
          const wData = wSnap?.exists() ? wSnap.data() : null;

          if (pubData || uData) {
            const prof = normalizePublicProfileDoc(uid, pubData, uData, wData);
            saveToCaches(uid, prof);
            result.set(uid, prof);
          }
        })
      );
    } catch (err) {
      console.warn('[publicProfileService] Batch fetch chunk error:', err);
    }
  }

  return result;
}

/**
 * Syncs a user's private profile fields and equipped cosmetics to `publicProfiles/{uid}`.
 */
export async function syncUserPublicProfile(
  uid: string,
  data?: Partial<PublicProfile> & Record<string, any>
): Promise<void> {
  if (!uid) return;
  const input = data || {};

  try {
    const pubRef = doc(db, 'publicProfiles', uid);
    const existingSnap = await getDoc(pubRef).catch(() => null);
    const existingData = existingSnap?.exists() ? existingSnap.data() : {};

    const cleanUsername = input.username ? String(input.username).trim() : existingData.username;
    const cleanUsernameLower = cleanUsername ? cleanUsername.toLowerCase() : undefined;

    const equippedAvatar =
      input.equipped?.avatar ??
      input.equippedAvatar ??
      input.avatar ??
      existingData.equippedAvatar ??
      existingData.avatar ??
      null;
    const equippedFrame =
      input.equipped?.frame ??
      input.equippedFrame ??
      input.frame ??
      existingData.equippedFrame ??
      existingData.frame ??
      null;
    const equippedNameplate =
      input.equipped?.nameplate ??
      input.equippedNameplate ??
      input.nameplate ??
      existingData.equippedNameplate ??
      existingData.nameplate ??
      null;
    const equippedBanner =
      input.equipped?.banner ??
      input.equippedBanner ??
      input.banner ??
      existingData.equippedBanner ??
      existingData.banner ??
      null;
    const equippedEffect =
      input.equipped?.effect ??
      input.equippedEffect ??
      input.effectId ??
      existingData.equippedEffect ??
      existingData.effectId ??
      null;

    const shortId =
      input.studentId ||
      input.shortId ||
      existingData.studentId ||
      existingData.shortId ||
      uid.slice(0, 6).toUpperCase();

    const payload: Record<string, any> = {
      uid,
      displayName: sanitizeStudentDisplayName(
        input.displayName || existingData.displayName || 'Student',
        shortId
      ),
      studentId: shortId,
      shortId,
      board: input.board ?? existingData.board ?? null,
      grade: input.grade ?? input.class ?? existingData.grade ?? null,
      targetUniversity: input.targetUniversity ?? existingData.targetUniversity ?? null,
      bio: input.bio ?? existingData.bio ?? '',
      status: input.status ?? existingData.status ?? '',
      accent: input.accent ?? existingData.accent ?? '#D71921',
      avatar: equippedAvatar,
      avatarKey: input.avatarKey ?? existingData.avatarKey ?? null,
      avatarVariant: input.avatarVariant ?? existingData.avatarVariant ?? null,
      avatarUrl: input.avatarUrl ?? existingData.avatarUrl ?? null,
      photoURL: input.photoURL ?? existingData.photoURL ?? null,
      equippedAvatar,
      equippedFrame,
      equippedNameplate,
      equippedBanner,
      equippedEffect,
      frame: equippedFrame,
      nameplate: equippedNameplate,
      banner: equippedBanner,
      effectId: equippedEffect,
      equipped: {
        avatar: equippedAvatar,
        frame: equippedFrame,
        nameplate: equippedNameplate,
        banner: equippedBanner,
        effect: equippedEffect,
      },
      equippedStreakBadges:
        input.equippedStreakBadges ?? existingData.equippedStreakBadges ?? [],
      updatedAt: serverTimestamp(),
    };

    if (cleanUsername) {
      payload.username = cleanUsername;
      payload.usernameLower = cleanUsernameLower;
    }

    if (!existingSnap?.exists()) {
      payload.role = input.role && ['student', 'Student'].includes(input.role) ? input.role : 'student';
      payload.isVerified = false;
      payload.followersCount = typeof input.followersCount === 'number' ? input.followersCount : 0;
      payload.followingCount = typeof input.followingCount === 'number' ? input.followingCount : 0;
      await setDoc(pubRef, payload);
    } else {
      await updateDoc(pubRef, payload);
    }

    if (cleanUsernameLower) {
      const oldUsernameLower = existingData.usernameLower;
      if (oldUsernameLower && oldUsernameLower !== cleanUsernameLower) {
        const oldRef = doc(db, 'usernames', oldUsernameLower);
        const oldSnap = await getDoc(oldRef).catch(() => null);
        if (oldSnap?.exists() && oldSnap.data()?.uid === uid) {
          await deleteDoc(oldRef).catch(() => {});
        }
      }
      const newUsernameRef = doc(db, 'usernames', cleanUsernameLower);
      await setDoc(
        newUsernameRef,
        {
          uid,
          username: cleanUsername,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    invalidatePublicProfileCache(uid);
  } catch (err) {
    console.warn('[publicProfileService] syncUserPublicProfile notice:', err);
  }
}

export const syncPublicProfile = syncUserPublicProfile;

export async function backfillAllPublicProfiles(): Promise<{
  totalUsers: number;
  backfilled: number;
}> {
  const snap = await getDocs(query(collection(db, 'users'), limit(500)));
  let backfilled = 0;
  for (const d of snap.docs) {
    try {
      await syncUserPublicProfile(d.id, d.data());
      backfilled++;
    } catch {
      // Ignore individual user backfill error
    }
  }
  return { totalUsers: snap.docs.length, backfilled };
}
