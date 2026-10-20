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

  const shortCode = (profileData.shortId as string) || deriveFallbackShortId(uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    (profileData.displayName as string) || (profileData.name as string),
    shortCode
  );

  const safePublicDoc: PublicProfile = {
    uid,
    displayName: cleanDisplayName,
    avatarKey: (profileData.avatarKey as string) || null,
    avatarVariant: (profileData.avatarVariant as string) || null,
    photoURL: (profileData.photoURL as string) || null,
    crewId: (profileData.crewId as string) || null,
    crewName: (profileData.crewName as string) || null,
    role: (profileData.role as string) || 'student',
    shortId: shortCode,
    equipped: (profileData.equipped as PublicProfile['equipped']) || {
      effect: null,
      frame: null,
      nameplate: null,
      avatar: null,
    },
    publicStats: {
      streak: Number(profileData.streak || 0),
      score: Number(profileData.score || 0),
      testsCompleted: Number(profileData.testsCompleted || 0),
      totalQuestionsSolved: Number(profileData.totalQuestionsSolved || 0),
    },
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
  if (!uid) {
    return {
      uid: 'guest',
      displayName: 'Student #00000',
      shortId: '00000',
    };
  }

  const cached = publicProfileCache.get(uid);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.profile;
  }

  try {
    const snap = await getDoc(doc(db, 'publicProfiles', uid));
    if (snap.exists()) {
      const data = snap.data() as PublicProfile;
      // Guarantee displayName is sanitized even if previously malformed
      data.displayName = sanitizeStudentDisplayName(data.displayName, data.shortId || uid);
      publicProfileCache.set(uid, { profile: data, fetchedAt: Date.now() });
      return data;
    }
  } catch (err) {
    console.warn(`[publicProfile] Could not fetch publicProfiles/${uid}:`, err);
  }

  // Graceful fallback
  const fallback: PublicProfile = {
    uid,
    displayName: `Student #${deriveFallbackShortId(uid)}`,
    shortId: deriveFallbackShortId(uid),
    role: 'student',
    publicStats: { streak: 0, score: 0, testsCompleted: 0, totalQuestionsSolved: 0 },
  };
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

      const publicDocRef = doc(db, 'publicProfiles', uid);
      const publicData: PublicProfile = {
        uid,
        displayName: cleanDisplayName,
        avatarKey: data.avatarKey || null,
        avatarVariant: data.avatarVariant || null,
        photoURL: data.photoURL || null,
        crewId: data.crewId || null,
        crewName: data.crewName || null,
        role: data.role || 'student',
        shortId: shortCode,
        equipped: userEquipped,
        publicStats: {
          streak: Number(data.streak || 0),
          score: Number(data.score || 0),
          testsCompleted: Number(data.testsCompleted || 0),
          totalQuestionsSolved: Number(data.totalQuestionsSolved || 0),
        },
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
