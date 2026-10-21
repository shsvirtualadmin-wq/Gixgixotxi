import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  limit,
  writeBatch,
  increment,
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
 * Checks if followerId currently follows targetId.
 * Directly reads users/{followerId}/following/{targetId}.
 */
export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  if (!followerId || !targetId || followerId === targetId) return false;
  try {
    const userFollowingSnap = await getDoc(doc(db, 'users', followerId, 'following', targetId));
    return userFollowingSnap.exists();
  } catch (err: any) {
    console.error(
      '[followService] isFollowing check error:',
      err?.code || 'ERROR',
      `users/${followerId}/following/${targetId}`,
      err
    );
    return false;
  }
}

/**
 * Executes an atomic client-side follow / unfollow writeBatch (Spark plan compatible):
 * - Creates / deletes users/{followerId}/following/{targetId} (where follower id == request.auth.uid)
 * - Creates / deletes users/{targetId}/followers/{followerId} (where follower id == request.auth.uid)
 * - Increments / decrements followingCount by 1 on users/{followerId}
 * - Increments / decrements followersCount by 1 on users/{targetId}
 */
export async function toggleFollowUser(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; following: boolean; followersCount: number; followingCount: number }> {
  if (!followerId || !targetId) {
    throw new Error('Both follower ID and target ID are required.');
  }

  if (followerId === targetId) {
    throw new Error('Students cannot follow themselves.');
  }

  // Enforce client-side rate limit (30 per hour)
  consumeFollowRateLimit(followerId);

  const callerFollowingDoc = doc(db, 'users', followerId, 'following', targetId);
  const targetFollowersDoc = doc(db, 'users', targetId, 'followers', followerId);
  const callerUserDoc = doc(db, 'users', followerId);
  const targetUserDoc = doc(db, 'users', targetId);

  try {
    const existingSnap = await getDoc(callerFollowingDoc);
    const isCurrentlyFollowing = existingSnap.exists();
    const batch = writeBatch(db);

    if (isCurrentlyFollowing) {
      // ─── UNFOLLOW ──────────────────────────────────────────
      batch.delete(callerFollowingDoc);
      batch.delete(targetFollowersDoc);

      batch.update(callerUserDoc, {
        followingCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      batch.update(targetUserDoc, {
        followersCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      return {
        success: true,
        following: false,
        followersCount: 0,
        followingCount: 0,
      };
    } else {
      // ─── FOLLOW ────────────────────────────────────────────
      batch.set(callerFollowingDoc, {
        targetUid: targetId,
        createdAt: serverTimestamp(),
      });
      batch.set(targetFollowersDoc, {
        followerUid: followerId,
        createdAt: serverTimestamp(),
      });

      batch.update(callerUserDoc, {
        followingCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      batch.update(targetUserDoc, {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      return {
        success: true,
        following: true,
        followersCount: 1,
        followingCount: 1,
      };
    }
  } catch (err: any) {
    console.error(
      '[followService] toggleFollowUser error:',
      err?.code || 'ERROR',
      `users/${followerId}/following/${targetId}`,
      err
    );
    throw err;
  }
}

/**
 * Follow a target student.
 */
export async function followUser(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; followersCount: number; followingCount: number }> {
  const res = await toggleFollowUser(followerId, targetId);
  return {
    success: res.success,
    followersCount: res.followersCount,
    followingCount: res.followingCount,
  };
}

/**
 * Unfollow a target student.
 */
export async function unfollowUser(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; followersCount: number; followingCount: number }> {
  const res = await toggleFollowUser(followerId, targetId);
  return {
    success: res.success,
    followersCount: res.followersCount,
    followingCount: res.followingCount,
  };
}

/**
 * Fetches followers for a user from users/{userId}/followers.
 */
export async function fetchUserFollowers(
  userId: string,
  limitCount = 50
): Promise<Array<{ uid: string; displayName?: string; avatar?: string }>> {
  if (!userId) return [];
  try {
    const subSnap = await getDocs(
      query(collection(db, 'users', userId, 'followers'), limit(limitCount))
    );
    return subSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
  } catch (err: any) {
    console.error(
      '[followService] fetchUserFollowers error:',
      err?.code || 'ERROR',
      `users/${userId}/followers`,
      err
    );
    return [];
  }
}

/**
 * Fetches following list for a user from users/{userId}/following.
 */
export async function fetchUserFollowing(
  userId: string,
  limitCount = 50
): Promise<Array<{ uid: string; displayName?: string; avatar?: string }>> {
  if (!userId) return [];
  try {
    const subSnap = await getDocs(
      query(collection(db, 'users', userId, 'following'), limit(limitCount))
    );
    return subSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
  } catch (err: any) {
    console.error(
      '[followService] fetchUserFollowing error:',
      err?.code || 'ERROR',
      `users/${userId}/following`,
      err
    );
    return [];
  }
}

// Aliases for compatibility
export const getFollowers = fetchUserFollowers;
export const getFollowing = fetchUserFollowing;

/**
 * Fetches the array of target user IDs followed by a student.
 * Directly reads subcollection users/{userId}/following.
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'following'));
    return snap.docs.map((d) => d.id).filter(Boolean);
  } catch (err: any) {
    console.error(
      '[followService] getFollowingIds error:',
      err?.code || 'ERROR',
      `users/${userId}/following`,
      err
    );
    return [];
  }
}
