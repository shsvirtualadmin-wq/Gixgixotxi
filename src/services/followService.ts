import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FollowDoc, PublicProfile } from '../types';

/**
 * Rate limit configuration: 30 follow/unfollow operations per hour.
 */
const HOURLY_RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory fallback for rate limiting if localStorage is unavailable
const memoryRateLimits = new Map<string, number[]>();

/**
 * Checks and consumes one rate limit slot for a user.
 * Throws an Error if the user has exceeded 30 operations in the last hour.
 */
export function consumeFollowRateLimit(userId: string): { allowed: boolean; remaining: number } {
  if (!userId) {
    throw new Error('User ID is required for rate limit verification.');
  }

  const now = Date.now();
  const storageKey = `boardly_follow_rate_${userId}`;
  let timestamps: number[] = [];

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (raw) {
      timestamps = JSON.parse(raw);
    } else {
      timestamps = memoryRateLimits.get(userId) || [];
    }
  } catch {
    timestamps = memoryRateLimits.get(userId) || [];
  }

  // Retain only timestamps within the rolling 1-hour window
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= HOURLY_RATE_LIMIT) {
    const oldest = timestamps[0];
    const waitMinutes = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 60000));
    throw new Error(
      `Rate limit exceeded: Maximum ${HOURLY_RATE_LIMIT} follow/unfollow actions allowed per hour. Please wait ${waitMinutes} minute(s) before trying again.`
    );
  }

  // Consume slot
  timestamps.push(now);

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(timestamps));
    }
    memoryRateLimits.set(userId, timestamps);
  } catch {
    memoryRateLimits.set(userId, timestamps);
  }

  return {
    allowed: true,
    remaining: Math.max(0, HOURLY_RATE_LIMIT - timestamps.length),
  };
}

/**
 * Checks remaining follow/unfollow rate limit allowance without consuming a slot.
 */
export function checkFollowRateLimit(userId: string): { allowed: boolean; remaining: number; resetInMs: number } {
  if (!userId) {
    return { allowed: false, remaining: 0, resetInMs: 0 };
  }

  const now = Date.now();
  const storageKey = `boardly_follow_rate_${userId}`;
  let timestamps: number[] = [];

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (raw) {
      timestamps = JSON.parse(raw);
    } else {
      timestamps = memoryRateLimits.get(userId) || [];
    }
  } catch {
    timestamps = memoryRateLimits.get(userId) || [];
  }

  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  const remaining = Math.max(0, HOURLY_RATE_LIMIT - timestamps.length);
  const resetInMs = timestamps.length > 0 ? Math.max(0, timestamps[0] + RATE_LIMIT_WINDOW_MS - now) : 0;

  return {
    allowed: remaining > 0,
    remaining,
    resetInMs,
  };
}

/**
 * Returns the deterministic follow document ID for a follower/target pair.
 */
export function getFollowDocId(followerId: string, targetId: string): string {
  return `${followerId}_${targetId}`;
}

/**
 * Checks if followerId currently follows targetId.
 */
export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  if (!followerId || !targetId || followerId === targetId) return false;
  try {
    const docId = getFollowDocId(followerId, targetId);
    const snap = await getDoc(doc(db, 'follows', docId));
    return snap.exists();
  } catch (err) {
    console.warn(`[followService] isFollowing check error (${followerId} -> ${targetId}):`, err);
    return false;
  }
}

/**
 * Follow a target student.
 * Updates both follower's followingCount and target's followersCount in one atomic transaction.
 * Strictly guarantees counts never go below zero.
 * Rate limited to 30 actions per hour.
 * Disallows self-following.
 */
export async function followUser(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; followersCount: number; followingCount: number }> {
  if (!followerId || !targetId) {
    throw new Error('Both follower ID and target ID are required.');
  }

  if (followerId === targetId) {
    throw new Error('Students cannot follow themselves.');
  }

  // 1. Enforce rate limit (30 per hour)
  consumeFollowRateLimit(followerId);

  const followDocId = getFollowDocId(followerId, targetId);
  const followDocRef = doc(db, 'follows', followDocId);
  const followerProfileRef = doc(db, 'publicProfiles', followerId);
  const targetProfileRef = doc(db, 'publicProfiles', targetId);

  let updatedTargetFollowers = 0;
  let updatedFollowerFollowing = 0;

  await runTransaction(db, async (tx) => {
    // Read all required documents first (Firestore transaction requirement)
    const followSnap = await tx.get(followDocRef);
    if (followSnap.exists()) {
      // Already following; treat as idempotent success
      const [fSnap, tSnap] = await Promise.all([tx.get(followerProfileRef), tx.get(targetProfileRef)]);
      updatedFollowerFollowing = fSnap.exists() ? Number(fSnap.data().followingCount || 0) : 0;
      updatedTargetFollowers = tSnap.exists() ? Number(tSnap.data().followersCount || 0) : 0;
      return;
    }

    const [followerSnap, targetSnap] = await Promise.all([
      tx.get(followerProfileRef),
      tx.get(targetProfileRef),
    ]);

    const curFollowerFollowing = followerSnap.exists()
      ? Number(followerSnap.data().followingCount || 0)
      : 0;
    const curTargetFollowers = targetSnap.exists()
      ? Number(targetSnap.data().followersCount || 0)
      : 0;

    updatedFollowerFollowing = Math.max(0, curFollowerFollowing + 1);
    updatedTargetFollowers = Math.max(0, curTargetFollowers + 1);

    // 1. Create follow document in follows/{followerId}_{targetId}
    const followData: FollowDoc = {
      followerId,
      targetId,
      createdAt: serverTimestamp(),
    };
    tx.set(followDocRef, followData);

    // 2. Update follower publicProfile followingCount in the same transaction
    if (followerSnap.exists()) {
      tx.update(followerProfileRef, {
        followingCount: updatedFollowerFollowing,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(
        followerProfileRef,
        {
          uid: followerId,
          followingCount: updatedFollowerFollowing,
          followersCount: 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 3. Update target publicProfile followersCount in the same transaction
    if (targetSnap.exists()) {
      tx.update(targetProfileRef, {
        followersCount: updatedTargetFollowers,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(
        targetProfileRef,
        {
          uid: targetId,
          followersCount: updatedTargetFollowers,
          followingCount: 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  });

  return {
    success: true,
    followersCount: updatedTargetFollowers,
    followingCount: updatedFollowerFollowing,
  };
}

/**
 * Unfollow a target student.
 * Updates both follower's followingCount and target's followersCount in one atomic transaction.
 * Strictly guarantees counts never drop below zero.
 * Rate limited to 30 actions per hour.
 */
export async function unfollowUser(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; followersCount: number; followingCount: number }> {
  if (!followerId || !targetId) {
    throw new Error('Both follower ID and target ID are required.');
  }

  // 1. Enforce rate limit (30 per hour)
  consumeFollowRateLimit(followerId);

  const followDocId = getFollowDocId(followerId, targetId);
  const followDocRef = doc(db, 'follows', followDocId);
  const followerProfileRef = doc(db, 'publicProfiles', followerId);
  const targetProfileRef = doc(db, 'publicProfiles', targetId);

  let updatedTargetFollowers = 0;
  let updatedFollowerFollowing = 0;

  await runTransaction(db, async (tx) => {
    // Read all required documents first
    const followSnap = await tx.get(followDocRef);
    if (!followSnap.exists()) {
      // Not following; idempotent exit
      const [fSnap, tSnap] = await Promise.all([tx.get(followerProfileRef), tx.get(targetProfileRef)]);
      updatedFollowerFollowing = fSnap.exists() ? Math.max(0, Number(fSnap.data().followingCount || 0)) : 0;
      updatedTargetFollowers = tSnap.exists() ? Math.max(0, Number(tSnap.data().followersCount || 0)) : 0;
      return;
    }

    const [followerSnap, targetSnap] = await Promise.all([
      tx.get(followerProfileRef),
      tx.get(targetProfileRef),
    ]);

    const curFollowerFollowing = followerSnap.exists()
      ? Number(followerSnap.data().followingCount || 0)
      : 0;
    const curTargetFollowers = targetSnap.exists()
      ? Number(targetSnap.data().followersCount || 0)
      : 0;

    // Never below zero
    updatedFollowerFollowing = Math.max(0, curFollowerFollowing - 1);
    updatedTargetFollowers = Math.max(0, curTargetFollowers - 1);

    // 1. Delete follow document
    tx.delete(followDocRef);

    // 2. Update follower publicProfile followingCount
    if (followerSnap.exists()) {
      tx.update(followerProfileRef, {
        followingCount: updatedFollowerFollowing,
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Update target publicProfile followersCount
    if (targetSnap.exists()) {
      tx.update(targetProfileRef, {
        followersCount: updatedTargetFollowers,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return {
    success: true,
    followersCount: updatedTargetFollowers,
    followingCount: updatedFollowerFollowing,
  };
}

/**
 * Fetches the list of UIDs followed by followerId from the `follows` collection.
 */
export async function getFollowingIds(followerId: string): Promise<string[]> {
  if (!followerId) return [];
  try {
    const q = query(collection(db, 'follows'), where('followerId', '==', followerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().targetId as string).filter(Boolean);
  } catch (err) {
    console.warn(`[followService] getFollowingIds error for ${followerId}:`, err);
    return [];
  }
}

/**
 * Fetches follower relationship records for a user.
 */
export async function getFollowers(targetId: string, maxLimit = 50): Promise<FollowDoc[]> {
  if (!targetId) return [];
  try {
    const q = query(
      collection(db, 'follows'),
      where('targetId', '==', targetId),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FollowDoc);
  } catch (err) {
    console.warn(`[followService] getFollowers error for ${targetId}:`, err);
    return [];
  }
}

/**
 * Fetches following relationship records for a user.
 */
export async function getFollowing(followerId: string, maxLimit = 50): Promise<FollowDoc[]> {
  if (!followerId) return [];
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FollowDoc);
  } catch (err) {
    console.warn(`[followService] getFollowing error for ${followerId}:`, err);
    return [];
  }
}
