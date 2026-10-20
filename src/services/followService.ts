import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
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
 * Checks both users/{followerId}/following/{targetId} and legacy follows/{followerId}_{targetId}
 */
export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  if (!followerId || !targetId || followerId === targetId) return false;
  try {
    // 1. Check direct user following subcollection
    const userFollowingSnap = await getDoc(doc(db, 'users', followerId, 'following', targetId));
    if (userFollowingSnap.exists()) return true;

    // 2. Check legacy follows collection
    const docId = getFollowDocId(followerId, targetId);
    const snap = await getDoc(doc(db, 'follows', docId));
    return snap.exists();
  } catch (err) {
    console.warn(`[followService] isFollowing check error (${followerId} -> ${targetId}):`, err);
    return false;
  }
}

/**
 * Executes a follow / unfollow toggle via callable Cloud Function "toggleFollow".
 * Gracefully falls back to subcollection updates if Cloud Functions are unavailable.
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

  // 1. Enforce rate limit (30 per hour)
  consumeFollowRateLimit(followerId);

  // 2. Primary: Call backend Cloud Function "toggleFollow"
  try {
    const toggleFollowCallable = httpsCallable<
      { targetUid: string },
      { success: boolean; following: boolean; followersCount: number; followingCount: number }
    >(functions, 'toggleFollow');

    const result = await toggleFollowCallable({ targetUid: targetId });
    if (result.data) {
      return result.data;
    }
  } catch (fnErr: any) {
    // If it's a validation error from server (e.g. self-follow), throw clear message
    const msg = fnErr?.message || '';
    if (msg.includes('Students cannot follow themselves') || msg.includes('unauthenticated')) {
      throw new Error(msg);
    }
    console.warn('[followService] Cloud Function toggleFollow failed or not deployed, using client fallback:', fnErr);
  }

  // 3. Fallback: Direct Firestore subcollection updates (allowed by updated firestore.rules)
  const callerFollowingDoc = doc(db, 'users', followerId, 'following', targetId);
  const targetFollowersDoc = doc(db, 'users', targetId, 'followers', followerId);
  const legacyFollowDoc = doc(db, 'follows', getFollowDocId(followerId, targetId));

  const existingSnap = await getDoc(callerFollowingDoc);
  const isCurrentlyFollowing = existingSnap.exists();

  const now = serverTimestamp();

  if (isCurrentlyFollowing) {
    // Unfollow
    await Promise.allSettled([
      deleteDoc(callerFollowingDoc),
      deleteDoc(targetFollowersDoc),
      deleteDoc(legacyFollowDoc),
    ]);

    return {
      success: true,
      following: false,
      followersCount: 0,
      followingCount: 0,
    };
  } else {
    // Follow
    await Promise.allSettled([
      setDoc(callerFollowingDoc, { targetUid: targetId, createdAt: now }),
      setDoc(targetFollowersDoc, { followerUid: followerId, createdAt: now }),
      setDoc(legacyFollowDoc, { followerId, targetId, createdAt: now }),
    ]);

    return {
      success: true,
      following: true,
      followersCount: 1,
      followingCount: 1,
    };
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
 * Fetches followers for a user.
 */
export async function fetchUserFollowers(
  userId: string,
  limitCount = 50
): Promise<Array<{ uid: string; displayName?: string; avatar?: string }>> {
  if (!userId) return [];
  try {
    // First try subcollection users/{userId}/followers
    const subSnap = await getDocs(
      query(collection(db, 'users', userId, 'followers'), limit(limitCount))
    );
    if (!subSnap.empty) {
      return subSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
    }

    // Fall back to legacy follows collection
    const q = query(
      collection(db, 'follows'),
      where('targetId', '==', userId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as FollowDoc;
      return { uid: data.followerId };
    });
  } catch (err) {
    console.warn(`[followService] fetchUserFollowers error (${userId}):`, err);
    return [];
  }
}

/**
 * Fetches following list for a user.
 */
export async function fetchUserFollowing(
  userId: string,
  limitCount = 50
): Promise<Array<{ uid: string; displayName?: string; avatar?: string }>> {
  if (!userId) return [];
  try {
    // First try subcollection users/{userId}/following
    const subSnap = await getDocs(
      query(collection(db, 'users', userId, 'following'), limit(limitCount))
    );
    if (!subSnap.empty) {
      return subSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
    }

    // Fall back to legacy follows collection
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', userId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as FollowDoc;
      return { uid: data.targetId };
    });
  } catch (err) {
    console.warn(`[followService] fetchUserFollowing error (${userId}):`, err);
    return [];
  }
}

// Aliases for compatibility
export const getFollowers = fetchUserFollowers;
export const getFollowing = fetchUserFollowing;

/**
 * Fetches the array of target user IDs followed by a student.
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const list = await fetchUserFollowing(userId, 200);
  return list.map((item) => item.uid).filter(Boolean);
}


