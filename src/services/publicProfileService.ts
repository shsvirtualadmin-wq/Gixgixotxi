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
import type { PublicProfile, UserProfile } from '../types';

// In-memory cache for public profiles to prevent repetitive reads
const publicProfileCache = new Map<string, { profile: PublicProfile; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

/**
 * Synchronizes a user's sanitized public information into `publicProfiles/{uid}`.
 * Strictly filters out any private fields: email, phone, payments, planExpiresAt, etc.
 */
export async function syncPublicProfile(
  uid: string,
  profileData: Partial<UserProfile> | Record<string, unknown>
): Promise<PublicProfile> {
  if (!uid) throw new Error('Cannot sync public profile: missing UID');

  const existingCached = publicProfileCache.get(uid)?.profile;
  const shortCode = (profileData.studentId as string) || (profileData.shortId as string) || existingCached?.studentId || deriveFallbackShortId(uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    (profileData.displayName as string) || (profileData.name as string) || existingCached?.displayName,
    shortCode
  );

  const equipped = (profileData.equipped as Record<string, unknown>) || existingCached?.equipped || {};
  const frame = (profileData.frame as string) || (equipped.frame as string) || existingCached?.frame || null;
  const nameplate = (profileData.nameplate as string) || (equipped.nameplate as string) || existingCached?.nameplate || null;
  const effectId = (profileData.effectId as string) || (equipped.effect as string) || existingCached?.effectId || null;
  const avatar = (profileData.avatar as string) || (equipped.avatar as string) || (profileData.photoURL as string) || (profileData.avatarKey as string) || existingCached?.avatar || null;
  const banner = (profileData.banner as string) || existingCached?.banner || null;

  const rawBadges = profileData.badges ?? profileData.equippedBadges ?? existingCached?.badges ?? [];
  const badges: string[] = Array.isArray(rawBadges) ? rawBadges.map(String) : [];

  const rawBio = typeof profileData.bio === 'string' ? profileData.bio.trim() : (existingCached?.bio || '');
  const bio = rawBio.slice(0, 160);

  const rawStatus = typeof profileData.status === 'string' ? profileData.status.trim() : (existingCached?.status || '');
  const status = rawStatus.slice(0, 40);

  const accent = (profileData.accent as string) || existingCached?.accent || '#E11D48';
  const crewName = (profileData.crewName as string) ?? (existingCached?.crewName || null);
  const memberSince = (profileData.memberSince as any) || (profileData.createdAt as any) || existingCached?.memberSince || serverTimestamp();
  const lastActiveAt = (profileData.lastActiveAt as any) || serverTimestamp();

  const inputStats = (profileData.stats as Record<string, unknown>) || (profileData.publicStats as Record<string, unknown>) || existingCached?.stats || {};
  const streak = Number(inputStats.streak ?? profileData.streak ?? 0);
  const longestStreak = Number(inputStats.longestStreak ?? profileData.longestStreak ?? streak);
  const mcqs = Number(inputStats.mcqs ?? inputStats.mcqsSolved ?? inputStats.totalQuestionsSolved ?? profileData.totalQuestionsSolved ?? 0);
  const accuracy = Number(inputStats.accuracy ?? profileData.accuracy ?? 0);

  const stats = {
    streak,
    longestStreak,
    mcqs,
    accuracy,
    score: Number(inputStats.score ?? profileData.score ?? 0),
    testsCompleted: Number(inputStats.testsCompleted ?? profileData.testsCompleted ?? 0),
    totalQuestionsSolved: mcqs,
    mcqsSolved: mcqs,
  };

  const followersCount = typeof profileData.followersCount === 'number'
    ? profileData.followersCount
    : (existingCached?.followersCount ?? 0);
  const followingCount = typeof profileData.followingCount === 'number'
    ? profileData.followingCount
    : (existingCached?.followingCount ?? 0);

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

    // Legacy compatibility fields
    shortId: shortCode,
    avatarKey: (profileData.avatarKey as string) || avatar || null,
    avatarVariant: (profileData.avatarVariant as string) || null,
    photoURL: (profileData.photoURL as string) || avatar || null,
    crewId: (profileData.crewId as string) || null,
    role: (profileData.role as string) || 'student',
    equipped: {
      effect: effectId,
      frame,
      nameplate,
      avatar,
    },
    publicStats: stats,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'publicProfiles', uid), safePublicDoc, { merge: true });
    publicProfileCache.set(uid, { profile: safePublicDoc, fetchedAt: Date.now() });
  } catch (err) {
    console.warn(`[publicProfile] Failed to sync publicProfiles/${uid}:`, err);
  }

  return safePublicDoc;
}

/**
 * Reads a single public profile from `publicProfiles/{uid}`.
 * Fallbacks to a sanitized default if not yet created.
 */
export async function getPublicProfile(uid: string): Promise<PublicProfile> {
  const fallbackShortId = deriveFallbackShortId(uid || 'guest');
  const fallback: PublicProfile = {
    uid: uid || 'guest',
    displayName: `Student #${fallbackShortId}`,
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

  if (!uid) {
    return fallback;
  }

  const cached = publicProfileCache.get(uid);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.profile;
  }

  try {
    const snap = await getDoc(doc(db, 'publicProfiles', uid));
    if (snap.exists()) {
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
        accent: data.accent || '#E11D48',
        memberSince: data.memberSince ?? null,
        crewName: data.crewName ?? null,
        stats: resolvedStats,
        followersCount: Number(data.followersCount || 0),
        followingCount: Number(data.followingCount || 0),
        lastActiveAt: data.lastActiveAt ?? null,
      };

      publicProfileCache.set(uid, { profile: resolvedProfile, fetchedAt: Date.now() });
      return resolvedProfile;
    }
  } catch (err) {
    console.warn(`[publicProfile] Could not fetch publicProfiles/${uid}:`, err);
  }

  return fallback;
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
      const fallback: PublicProfile = {
        uid,
        displayName: `Student #${deriveFallbackShortId(uid)}`,
        shortId: deriveFallbackShortId(uid),
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
