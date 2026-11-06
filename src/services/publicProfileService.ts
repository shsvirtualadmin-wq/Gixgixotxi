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
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME, isAdminAccount } from '@/constants/superAdmin';
import { BOARDLY_BOT_ACCOUNTS } from '@/config/botsConfig';
import type { PublicProfile as BasePublicProfile } from '@/types';

export interface PublicProfile extends BasePublicProfile {
  usernameLower?: string;
  isVerified?: boolean;
  isCaptain?: boolean;
  board?: string | null;
  grade?: string | number | null;
  targetUniversity?: string | null;
  equippedAvatar?: string | null;
  equippedFrame?: string | null;
  equippedNameplate?: string | null;
  equippedBanner?: string | null;
  equippedEffect?: string | null;
  equippedStreakBadges?: string[];
}

const SESSION_CACHE_PREFIX = 'boardly_pub_prof_v3_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Layer 1: In-memory cache
const memoryCache = new Map<string, { profile: PublicProfile; timestamp: number }>();

// Layer 2: In-flight promise deduplication
const inFlightRequests = new Map<string, Promise<PublicProfile | null>>();

function isLikelyHttpOrPathUrl(val?: unknown): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  );
}

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

export function getCachedPublicProfile(uid?: string | null): PublicProfile | null {
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
  return null;
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
  const w = walletData || {};
  const wEquipped = w.equipped || {};
  const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
  const isSuperAdmin = isAdminAccount(uid, u.email || p.email);

  const shortId =
    u.studentId ||
    u.shortId ||
    p.studentId ||
    p.shortId ||
    botMatch?.shortId ||
    uid.slice(0, 6).toUpperCase();
  const rawName =
    u.displayName ||
    p.displayName ||
    u.name ||
    p.name ||
    u.username ||
    p.username ||
    botMatch?.displayName ||
    (isSuperAdmin ? SUPER_ADMIN_NAME : 'Student');
  const displayName = isSuperAdmin
    ? u.displayName || p.displayName || SUPER_ADMIN_NAME
    : sanitizeStudentDisplayName(rawName, shortId);

  const avatarCandidates = [
    u.equipped?.avatar,
    u.equippedAvatar,
    p.equippedAvatar,
    p.equipped?.avatar,
    wEquipped.avatar,
    w.equippedAvatar,
    w.avatar,
    u.avatar,
    p.avatar,
    u.avatarId,
    p.avatarId,
    u.avatarUrl,
    p.avatarUrl,
    u.photoURL,
    p.photoURL,
    botMatch?.equippedAvatar,
  ];

  let equippedAvatar: string | null = null;
  for (const cand of avatarCandidates) {
    const cosmeticId = resolveCosmeticItemId(cand, 'avatar');
    if (cosmeticId) {
      equippedAvatar = cosmeticId;
      break;
    }
  }

  const urlCandidates = [
    u.avatarUrl,
    p.avatarUrl,
    u.photoURL,
    p.photoURL,
    u.avatar,
    p.avatar,
    u.equipped?.avatar,
    p.equippedAvatar,
  ];

  let resolvedAvatarUrl: string | null = null;
  for (const cand of urlCandidates) {
    if (isLikelyHttpOrPathUrl(cand) && !resolveCosmeticItemId(cand, 'avatar')) {
      resolvedAvatarUrl = cand.trim();
      break;
    }
  }

  const resolvedPhotoURL =
    (isLikelyHttpOrPathUrl(u.photoURL) && !resolveCosmeticItemId(u.photoURL, 'avatar')
      ? u.photoURL.trim()
      : null) ||
    (isLikelyHttpOrPathUrl(p.photoURL) && !resolveCosmeticItemId(p.photoURL, 'avatar')
      ? p.photoURL.trim()
      : null) ||
    resolvedAvatarUrl;

  const frameCandidates = [
    u.equipped?.frame,
    u.equippedFrame,
    p.equippedFrame,
    p.equipped?.frame,
    wEquipped.frame,
    w.equippedFrame,
    w.frame,
    u.frame,
    p.frame,
    u.frameId,
    p.frameId,
    botMatch?.frame,
  ];

  let equippedFrame: string | null = null;
  for (const cand of frameCandidates) {
    const cosmeticFrameId = resolveCosmeticItemId(cand, 'frame');
    if (cosmeticFrameId) {
      equippedFrame = cosmeticFrameId;
      break;
    }
  }

  const equippedNameplate =
    u.equipped?.nameplate ||
    u.equippedNameplate ||
    p.equippedNameplate ||
    p.equipped?.nameplate ||
    wEquipped.nameplate ||
    w.equippedNameplate ||
    u.nameplate ||
    p.nameplate ||
    null;

  const equippedBanner =
    u.equipped?.banner ||
    u.equippedBanner ||
    p.equippedBanner ||
    p.equipped?.banner ||
    wEquipped.banner ||
    w.equippedBanner ||
    u.banner ||
    p.banner ||
    null;

  const equippedEffect =
    u.equipped?.effect ||
    u.equippedEffect ||
    p.equippedEffect ||
    p.equipped?.effect ||
    wEquipped.effect ||
    w.equippedEffect ||
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
    username: u.username || p.username || botMatch?.username || undefined,
    usernameLower:
      u.usernameLower ||
      p.usernameLower ||
      (u.username || p.username || botMatch?.username
        ? String(u.username || p.username || botMatch?.username).toLowerCase()
        : undefined),
    role: isSuperAdmin ? 'admin' : u.role || p.role || (botMatch ? 'bot' : 'student'),
    customRole: u.customRole || p.customRole || undefined,
    isVerified: Boolean(
      isSuperAdmin || u.isVerified || p.isVerified || u.verified || p.verified
    ),
    isCaptain: Boolean(u.isCaptain ?? p.isCaptain),
    board: u.board || p.board || botMatch?.board || undefined,
    grade: u.grade || p.grade || u.class || p.class || botMatch?.grade || undefined,
    targetUniversity:
      u.targetUniversity || p.targetUniversity || botMatch?.targetUniversity || undefined,
    bio: u.bio ?? p.bio ?? botMatch?.bio ?? '',
    status: u.status ?? p.status ?? '',
    accent: u.accent || p.accent || '#D71921',
    memberSince: u.createdAt || p.memberSince || null,
    crewName: u.crewName || p.crewName || null,
    lastActiveAt: u.lastActiveDate || p.lastActiveAt || null,
    stats,
    publicStats: stats,
    avatar: equippedAvatar || resolvedAvatarUrl || null,
    avatarKey: u.avatarKey || p.avatarKey || wEquipped.avatarKey || null,
    avatarVariant: u.avatarVariant || p.avatarVariant || wEquipped.avatarVariant || null,
    avatarUrl: resolvedAvatarUrl,
    photoURL: resolvedPhotoURL,
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

    const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
    const isSuperAdmin = uid === SUPER_ADMIN_UID;

    if (!pubData && !uData && ! walletData && !botMatch && !isSuperAdmin) {
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

  const cached = getCachedPublicProfile(uid);
  if (cached) {
    return cached;
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
    const cached = getCachedPublicProfile(uid);
    if (cached) {
      result.set(uid, cached);
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
          const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
          const isSuperAdmin = uid === SUPER_ADMIN_UID;

          if (pubData || uData || wData || botMatch || isSuperAdmin) {
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

const nameToUidCache = new Map<string, string | null>();
const inFlightNameLookups = new Map<string, Promise<PublicProfile | null>>();

export function getCachedUidByName(name?: string | null): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return nameToUidCache.get(key) ?? null;
}

/**
 * Resolves a public profile by display name or username (used as a fallback when a legacy
 * notification row did not store `authorId`) and caches the resolved UID -> PublicProfile.
 */
export async function resolvePublicProfileByName(
  rawName?: string | null
): Promise<PublicProfile | null> {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  const key = trimmed.toLowerCase();
  if (!key || key === 'student' || key === 'a student' || key === 'anonymous') {
    return null;
  }

  if (key === SUPER_ADMIN_NAME.toLowerCase() || key === 'shs virtual academy') {
    nameToUidCache.set(key, SUPER_ADMIN_UID);
    return getPublicProfile(SUPER_ADMIN_UID);
  }

  const bot = BOARDLY_BOT_ACCOUNTS.find(
    (b) => b.displayName.toLowerCase() === key || (b.username && b.username.toLowerCase() === key)
  );
  if (bot) {
    nameToUidCache.set(key, bot.uid);
    return getPublicProfile(bot.uid);
  }

  if (nameToUidCache.has(key)) {
    const cachedUid = nameToUidCache.get(key);
    return cachedUid ? getPublicProfile(cachedUid) : null;
  }

  const existingPromise = inFlightNameLookups.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const lookupPromise = (async (): Promise<PublicProfile | null> => {
    try {
      const [pubByName, pubByUser, userByName] = await Promise.all([
        getDocs(
          query(collection(db, 'publicProfiles'), where('displayName', '==', trimmed), limit(1))
        ).catch(() => null),
        getDocs(
          query(collection(db, 'publicProfiles'), where('usernameLower', '==', key), limit(1))
        ).catch(() => null),
        getDocs(
          query(collection(db, 'users'), where('displayName', '==', trimmed), limit(1))
        ).catch(() => null),
      ]);

      const matchedDoc =
        pubByName?.docs?.[0] || pubByUser?.docs?.[0] || userByName?.docs?.[0] || null;
      if (!matchedDoc) {
        nameToUidCache.set(key, null);
        return null;
      }

      const resolvedUid = matchedDoc.id;
      nameToUidCache.set(key, resolvedUid);
      return await getPublicProfile(resolvedUid);
    } catch {
      return null;
    }
  })().finally(() => {
    inFlightNameLookups.delete(key);
  });

  inFlightNameLookups.set(key, lookupPromise);
  return lookupPromise;
}

/**
 * Syncs a user's private profile fields and equipped cosmetics to `publicProfiles/{uid}`.
 */
export async function syncUserPublicProfile(
  uid: string,
  data?: Record<string, any>
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
export type PublicUserProfileSummary = PublicProfile;

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
