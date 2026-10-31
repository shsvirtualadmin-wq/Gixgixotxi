import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { notifyUserOfNewFollower } from '@/services/notificationService';

export interface FollowRecord {
  uid: string;
  followerId?: string;
  targetId?: string;
  createdAt?: any;
}

async function getOptionalBearerHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken(false);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore token error
  }
  return {};
}

export async function checkIsFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return false;
  }

  try {
    const [fsUserSnap, fsPubSnap, d1Res] = await Promise.all([
      getDoc(doc(db, 'users', currentUserId, 'following', targetUserId)).catch(() => null),
      getDoc(doc(db, 'publicProfiles', currentUserId, 'following', targetUserId)).catch(() => null),
      fetch(
        `/api/follows?followerUid=${encodeURIComponent(currentUserId)}&followingUid=${encodeURIComponent(targetUserId)}`,
        { cache: 'no-store' }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (fsUserSnap && fsUserSnap.exists()) return true;
    if (fsPubSnap && fsPubSnap.exists()) return true;
    if (d1Res?.isFollowing) return true;
    return false;
  } catch (err: unknown) {
    console.warn('[followService] checkIsFollowing error:', err);
    return false;
  }
}

export const isFollowing = checkIsFollowing;

async function performFollowStateChange(
  currentUserId: string,
  targetUserId: string,
  nextFollowing: boolean,
  followerMeta?: {
    followerName?: string;
    followerAvatar?: string | null;
    followerFrame?: string | null;
  }
): Promise<{ following: boolean }> {
  if (!currentUserId || !targetUserId) {
    throw new Error('Invalid user IDs.');
  }
  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.');
  }

  const action = nextFollowing ? 'follow' : 'unfollow';

  let resolvedFollowerName =
    followerMeta?.followerName || auth.currentUser?.displayName || '';
  let resolvedFollowerAvatar =
    followerMeta?.followerAvatar || auth.currentUser?.photoURL || null;
  let resolvedFollowerFrame = followerMeta?.followerFrame || null;

  if (!resolvedFollowerName && nextFollowing) {
    try {
      const meSnap = await getDoc(doc(db, 'publicProfiles', currentUserId));
      if (meSnap.exists()) {
        const d = meSnap.data();
        resolvedFollowerName = d.displayName || d.username || 'A student';
        resolvedFollowerAvatar =
          resolvedFollowerAvatar || d.photoURL || d.equippedAvatar || d.avatar || null;
        resolvedFollowerFrame = resolvedFollowerFrame || d.equippedFrame || null;
      }
    } catch {
      // Ignore profile lookup error
    }
  }
  if (!resolvedFollowerName) {
    resolvedFollowerName = 'A student';
  }

  // 1. Sync with D1 (/api/follows)
  let d1Succeeded = false;
  try {
    const headers = await getOptionalBearerHeader();
    const resp = await fetch('/api/follows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        followerUid: currentUserId,
        followingUid: targetUserId,
        action,
        followerName: resolvedFollowerName,
        followerAvatar: resolvedFollowerAvatar,
        followerFrame: resolvedFollowerFrame,
      }),
    });
    if (resp.ok) {
      d1Succeeded = true;
    }
  } catch {
    // Ignore D1 network error, continue with Firestore
  }

  // 2. Sync with Firestore
  const userFollowingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const userFollowerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const pubFollowingRef = doc(db, 'publicProfiles', currentUserId, 'following', targetUserId);
  const pubFollowerRef = doc(db, 'publicProfiles', targetUserId, 'followers', currentUserId);
  const currentUserDoc = doc(db, 'users', currentUserId);
  const targetUserDoc = doc(db, 'users', targetUserId);
  const currentPublicDoc = doc(db, 'publicProfiles', currentUserId);
  const targetPublicDoc = doc(db, 'publicProfiles', targetUserId);

  let fsSucceeded = false;
  try {
    const batch = writeBatch(db);
    if (!nextFollowing) {
      batch.delete(userFollowingRef);
      batch.delete(userFollowerRef);
      batch.delete(pubFollowingRef);
      batch.delete(pubFollowerRef);
      batch.set(currentUserDoc, { followingCount: increment(-1) }, { merge: true });
      batch.set(currentPublicDoc, { followingCount: increment(-1) }, { merge: true });
      batch.set(targetPublicDoc, { followersCount: increment(-1) }, { merge: true });
    } else {
      const payloadTarget = {
        uid: targetUserId,
        targetId: targetUserId,
        targetUserId,
        createdAt: serverTimestamp(),
      };
      const payloadFollower = {
        uid: currentUserId,
        followerId: currentUserId,
        createdAt: serverTimestamp(),
      };
      batch.set(userFollowingRef, payloadTarget);
      batch.set(userFollowerRef, payloadFollower);
      batch.set(pubFollowingRef, payloadTarget);
      batch.set(pubFollowerRef, payloadFollower);
      batch.set(currentUserDoc, { followingCount: increment(1) }, { merge: true });
      batch.set(currentPublicDoc, { followingCount: increment(1) }, { merge: true });
      batch.set(targetPublicDoc, { followersCount: increment(1) }, { merge: true });
    }
    await batch.commit();
    fsSucceeded = true;
  } catch (err) {
    console.warn('[followService] Firestore batch notice:', err);
  }

  // Update targetUserDoc separately so strict rules on users/{targetId} never block the follow batch
  try {
    await updateDoc(targetUserDoc, {
      followersCount: increment(nextFollowing ? 1 : -1),
    });
  } catch {
    // Expected when non-admin updates another user's private users/{uid} doc
  }

  if (nextFollowing) {
    void notifyUserOfNewFollower({
      targetUserId,
      followerId: currentUserId,
      followerName: resolvedFollowerName,
      followerAvatar: resolvedFollowerAvatar,
      followerFrame: resolvedFollowerFrame,
    });
  }

  if (!d1Succeeded && !fsSucceeded) {
    throw new Error('Could not update follow status. Please try again.');
  }

  return { following: nextFollowing };
}

export async function followUser(
  currentUserId: string,
  targetUserId: string,
  followerMeta?: {
    followerName?: string;
    followerAvatar?: string | null;
    followerFrame?: string | null;
  }
): Promise<void> {
  await performFollowStateChange(currentUserId, targetUserId, true, followerMeta);
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  await performFollowStateChange(currentUserId, targetUserId, false);
}

export async function toggleFollowUser(
  currentUserId: string,
  targetUserId: string,
  followerMeta?: {
    followerName?: string;
    followerAvatar?: string | null;
    followerFrame?: string | null;
  }
): Promise<{ following: boolean }> {
  const currentlyFollowing = await checkIsFollowing(currentUserId, targetUserId);
  return performFollowStateChange(
    currentUserId,
    targetUserId,
    !currentlyFollowing,
    followerMeta
  );
}

export async function getFollowingIds(userId: string, maxCount = 200): Promise<string[]> {
  if (!userId) return [];
  const ids = new Set<string>();

  try {
    const [userSnap, pubSnap, d1Res] = await Promise.all([
      getDocs(query(collection(db, 'users', userId, 'following'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(query(collection(db, 'publicProfiles', userId, 'following'), limit(maxCount))).catch(
        () => null
      ),
      fetch(`/api/follows?followerUid=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (userSnap) {
      userSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) ids.add(d.id);
      });
    }
    if (pubSnap) {
      pubSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) ids.add(d.id);
      });
    }
    if (Array.isArray(d1Res?.followingIds)) {
      d1Res.followingIds.forEach((id: string) => {
        if (id && id !== userId) ids.add(String(id));
      });
    }
  } catch (err: unknown) {
    console.warn('[followService] getFollowingIds error:', err);
  }

  return Array.from(ids).slice(0, maxCount);
}

export async function getFollowerIds(userId: string, maxCount = 200): Promise<string[]> {
  if (!userId) return [];
  const ids = new Set<string>();

  try {
    const [userSnap, pubSnap, d1Res] = await Promise.all([
      getDocs(query(collection(db, 'users', userId, 'followers'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(query(collection(db, 'publicProfiles', userId, 'followers'), limit(maxCount))).catch(
        () => null
      ),
      fetch(`/api/follows?followingUid=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (userSnap) {
      userSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) ids.add(d.id);
      });
    }
    if (pubSnap) {
      pubSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) ids.add(d.id);
      });
    }
    if (Array.isArray(d1Res?.followerIds)) {
      d1Res.followerIds.forEach((id: string) => {
        if (id && id !== userId) ids.add(String(id));
      });
    }
  } catch (err: unknown) {
    console.warn('[followService] getFollowerIds error:', err);
  }

  return Array.from(ids).slice(0, maxCount);
}

export async function getFollowers(
  userId: string,
  limitCount = 50
): Promise<FollowRecord[]> {
  const ids = await getFollowerIds(userId, limitCount);
  return ids.map((uid) => ({ uid, followerId: uid }));
}

export async function getFollowing(
  userId: string,
  limitCount = 50
): Promise<FollowRecord[]> {
  const ids = await getFollowingIds(userId, limitCount);
  return ids.map((uid) => ({ uid, targetId: uid }));
}

export async function getFollowCounts(
  userId: string
): Promise<{ followersCount: number; followingCount: number }> {
  if (!userId) return { followersCount: 0, followingCount: 0 };
  try {
    const [followerIds, followingIds, publicSnap] = await Promise.all([
      getFollowerIds(userId),
      getFollowingIds(userId),
      getDoc(doc(db, 'publicProfiles', userId)).catch(() => null),
    ]);

    const pubData = publicSnap?.exists() ? publicSnap.data() : null;
    const followersCount = Math.max(
      followerIds.length,
      Number(pubData?.followersCount || 0)
    );
    const followingCount = Math.max(
      followingIds.length,
      Number(pubData?.followingCount || 0)
    );

    return { followersCount, followingCount };
  } catch {
    return { followersCount: 0, followingCount: 0 };
  }
}
