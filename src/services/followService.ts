import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { notifyUserOfNewFollower } from '@/services/notificationService';
import {
  getPublicProfiles,
  invalidatePublicProfileCache,
  type PublicProfile,
} from '@/services/publicProfileService';

export interface FollowUserSummary {
  uid: string;
  displayName: string;
  username?: string;
  avatar?: string;
  avatarKey?: string;
  avatarVariant?: string;
  avatarUrl?: string;
  photoURL?: string;
  equippedAvatar?: string | null;
  frame?: string | null;
  nameplate?: string | null;
  banner?: string | null;
  role?: string;
  customRole?: string;
  targetUniversity?: string;
  board?: string;
  shortId?: string;
  badges?: string[];
}

// Fast in-memory cache for follow counts & status to make profile reopening instant
const followCountsMemoryCache = new Map<
  string,
  { followersCount: number; followingCount: number; ts: number }
>();
const isFollowingMemoryCache = new Map<string, { following: boolean; ts: number }>();
const FOLLOW_CACHE_TTL_MS = 60_000;

export function invalidateFollowCache(uid?: string): void {
  if (!uid) {
    followCountsMemoryCache.clear();
    isFollowingMemoryCache.clear();
    return;
  }
  followCountsMemoryCache.delete(uid);
  for (const key of isFollowingMemoryCache.keys()) {
    if (key.startsWith(`${uid}_`) || key.endsWith(`_${uid}`)) {
      isFollowingMemoryCache.delete(key);
    }
  }
}

/**
 * Checks if `currentUserId` is currently following `targetUserId`.
 */
export async function checkIsFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return false;
  }

  const cacheKey = `${currentUserId}_${targetUserId}`;
  const cached = isFollowingMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FOLLOW_CACHE_TTL_MS) {
    return cached.following;
  }

  try {
    const followDocId = `${currentUserId}_${targetUserId}`;
    const [followSnap, pubFollowingSnap, userFollowingSnap, pubFollowerSnap] = await Promise.all([
      getDoc(doc(db, 'follows', followDocId)).catch(() => null),
      getDoc(doc(db, 'publicProfiles', currentUserId, 'following', targetUserId)).catch(() => null),
      getDoc(doc(db, 'users', currentUserId, 'following', targetUserId)).catch(() => null),
      getDoc(doc(db, 'publicProfiles', targetUserId, 'followers', currentUserId)).catch(() => null),
    ]);

    const following = Boolean(
      followSnap?.exists() ||
        pubFollowingSnap?.exists() ||
        userFollowingSnap?.exists() ||
        pubFollowerSnap?.exists()
    );
    isFollowingMemoryCache.set(cacheKey, { following, ts: Date.now() });
    return following;
  } catch (err: unknown) {
    console.warn('[followService] checkIsFollowing error:', err);
    return false;
  }
}

export const isFollowing = checkIsFollowing;

/**
 * Atomically sets the follow relationship (`nextFollowing = true | false`) in Firestore
 * and updates `followersCount` and `followingCount` on both users' documents.
 */
async function performFollowStateChange(
  currentUserId: string,
  targetUserId: string,
  nextFollowing: boolean,
  followerMeta?: {
    followerName?: string;
    followerAvatar?: string | null;
    followerFrame?: string | null;
  }
): Promise<{ following: boolean; followersCount?: number }> {
  if (!currentUserId || !targetUserId) {
    throw new Error('Both user IDs are required');
  }
  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.');
  }

  let resolvedFollowerName = followerMeta?.followerName?.trim() || '';
  let resolvedFollowerAvatar: string | null = followerMeta?.followerAvatar || null;
  let resolvedFollowerFrame: string | null = followerMeta?.followerFrame || null;

  if (!resolvedFollowerName && auth.currentUser?.uid === currentUserId) {
    resolvedFollowerName = auth.currentUser.displayName?.trim() || '';
    resolvedFollowerAvatar = resolvedFollowerAvatar || auth.currentUser.photoURL || null;
  }

  const currentUserDoc = doc(db, 'users', currentUserId);
  const targetUserDoc = doc(db, 'users', targetUserId);
  const currentPublicDoc = doc(db, 'publicProfiles', currentUserId);
  const targetPublicDoc = doc(db, 'publicProfiles', targetUserId);

  const followDocRef = doc(db, 'follows', `${currentUserId}_${targetUserId}`);
  const userFollowingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const userFollowerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const pubFollowingRef = doc(db, 'publicProfiles', currentUserId, 'following', targetUserId);
  const pubFollowerRef = doc(db, 'publicProfiles', targetUserId, 'followers', currentUserId);

  // Read current docs and actual follower list in parallel so counts are 100% accurate and non-negative
  const [
    curUserSnap,
    curPubSnap,
    tgtUserSnap,
    tgtPubSnap,
    existingTargetFollowers,
    existingCurrentFollowing,
  ] = await Promise.all([
    getDoc(currentUserDoc).catch(() => null),
    getDoc(currentPublicDoc).catch(() => null),
    getDoc(targetUserDoc).catch(() => null),
    getDoc(targetPublicDoc).catch(() => null),
    getFollowerIds(targetUserId, 500).catch(() => [] as string[]),
    getFollowingIds(currentUserId, 500).catch(() => [] as string[]),
  ]);

  if (!resolvedFollowerName && curUserSnap?.exists()) {
    const d = curUserSnap.data();
    resolvedFollowerName = (d.displayName || d.username || '').trim();
    resolvedFollowerAvatar =
      resolvedFollowerAvatar || d.photoURL || d.equipped?.avatar || d.avatar || null;
    resolvedFollowerFrame = resolvedFollowerFrame || d.equipped?.frame || d.frame || null;
  }
  if (!resolvedFollowerName && curPubSnap?.exists()) {
    const d = curPubSnap.data();
    resolvedFollowerName = (d.displayName || d.username || '').trim();
    resolvedFollowerAvatar =
      resolvedFollowerAvatar || d.photoURL || d.equippedAvatar || d.avatar || null;
    resolvedFollowerFrame = resolvedFollowerFrame || d.equippedFrame || d.frame || null;
  }
  if (!resolvedFollowerName) {
    resolvedFollowerName = 'A student';
  }

  // Compute accurate next counts using deduplicated sets
  const nextTargetFollowerSet = new Set(existingTargetFollowers);
  if (nextFollowing) {
    nextTargetFollowerSet.add(currentUserId);
  } else {
    nextTargetFollowerSet.delete(currentUserId);
  }
  const nextTargetFollowersCount = nextTargetFollowerSet.size;

  const nextCurrentFollowingSet = new Set(existingCurrentFollowing);
  if (nextFollowing) {
    nextCurrentFollowingSet.add(targetUserId);
  } else {
    nextCurrentFollowingSet.delete(targetUserId);
  }
  const nextCurrentFollowingCount = nextCurrentFollowingSet.size;

  let fsSucceeded = false;

  // 1. Atomic writeBatch on subcollections + existing profile docs
  try {
    const batch = writeBatch(db);

    if (!nextFollowing) {
      batch.delete(userFollowingRef);
      batch.delete(userFollowerRef);
      batch.delete(pubFollowingRef);
      batch.delete(pubFollowerRef);
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
        followerName: resolvedFollowerName,
        followerAvatar: resolvedFollowerAvatar,
        followerFrame: resolvedFollowerFrame,
        createdAt: serverTimestamp(),
      };

      batch.set(userFollowingRef, payloadTarget);
      batch.set(userFollowerRef, payloadFollower);
      batch.set(pubFollowingRef, payloadTarget);
      batch.set(pubFollowerRef, payloadFollower);
    }

    // Only update parent docs that exist so Firestore update rules (`affectedKeys().hasOnly(['followersCount', 'followingCount', 'updatedAt'])`) always pass
    if (curUserSnap?.exists()) {
      batch.update(currentUserDoc, {
        followingCount: nextCurrentFollowingCount,
        updatedAt: serverTimestamp(),
      });
    }
    if (curPubSnap?.exists()) {
      batch.update(currentPublicDoc, {
        followingCount: nextCurrentFollowingCount,
        updatedAt: serverTimestamp(),
      });
    }
    if (tgtUserSnap?.exists()) {
      batch.update(targetUserDoc, {
        followersCount: nextTargetFollowersCount,
        updatedAt: serverTimestamp(),
      });
    }
    if (tgtPubSnap?.exists()) {
      batch.update(targetPublicDoc, {
        followersCount: nextTargetFollowersCount,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    fsSucceeded = true;
  } catch (err) {
    console.warn('[followService] Batch commit fallback:', err);
    try {
      if (nextFollowing) {
        await Promise.all([
          setDoc(pubFollowerRef, { uid: currentUserId, followerId: currentUserId, createdAt: serverTimestamp() }),
          setDoc(pubFollowingRef, { uid: targetUserId, targetId: targetUserId, createdAt: serverTimestamp() }),
          setDoc(userFollowerRef, { uid: currentUserId, followerId: currentUserId, createdAt: serverTimestamp() }).catch(() => {}),
          setDoc(userFollowingRef, { uid: targetUserId, targetId: targetUserId, createdAt: serverTimestamp() }).catch(() => {}),
          tgtUserSnap?.exists()
            ? updateDoc(targetUserDoc, { followersCount: nextTargetFollowersCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          tgtPubSnap?.exists()
            ? updateDoc(targetPublicDoc, { followersCount: nextTargetFollowersCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          curUserSnap?.exists()
            ? updateDoc(currentUserDoc, { followingCount: nextCurrentFollowingCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          curPubSnap?.exists()
            ? updateDoc(currentPublicDoc, { followingCount: nextCurrentFollowingCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
        ]);
      } else {
        await Promise.all([
          deleteDoc(pubFollowerRef).catch(() => {}),
          deleteDoc(pubFollowingRef).catch(() => {}),
          deleteDoc(userFollowerRef).catch(() => {}),
          deleteDoc(userFollowingRef).catch(() => {}),
          tgtUserSnap?.exists()
            ? updateDoc(targetUserDoc, { followersCount: nextTargetFollowersCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          tgtPubSnap?.exists()
            ? updateDoc(targetPublicDoc, { followersCount: nextTargetFollowersCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          curUserSnap?.exists()
            ? updateDoc(currentUserDoc, { followingCount: nextCurrentFollowingCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
          curPubSnap?.exists()
            ? updateDoc(currentPublicDoc, { followingCount: nextCurrentFollowingCount, updatedAt: serverTimestamp() }).catch(() => {})
            : Promise.resolve(),
        ]);
      }
      fsSucceeded = true;
    } catch (fallbackErr) {
      console.error('[followService] Fallback follow writes failed:', fallbackErr);
    }
  }

  // 2. Also sync top-level `follows/{currentUserId}_{targetUserId}` record
  if (nextFollowing) {
    await setDoc(followDocRef, {
      followerId: currentUserId,
      followingId: targetUserId,
      followerName: resolvedFollowerName,
      followerAvatar: resolvedFollowerAvatar,
      followerFrame: resolvedFollowerFrame,
      createdAt: serverTimestamp(),
    })
      .then(() => {
        fsSucceeded = true;
      })
      .catch(() => {});
  } else {
    await deleteDoc(followDocRef)
      .then(() => {
        fsSucceeded = true;
      })
      .catch(() => {});
  }

  // Update in-memory caches immediately so UI and subsequent profile visits reflect the new state
  isFollowingMemoryCache.set(`${currentUserId}_${targetUserId}`, {
    following: nextFollowing,
    ts: Date.now(),
  });

  const prevTargetCounts = followCountsMemoryCache.get(targetUserId);
  followCountsMemoryCache.set(targetUserId, {
    followersCount: nextTargetFollowersCount,
    followingCount: prevTargetCounts?.followingCount ?? 0,
    ts: Date.now(),
  });

  const prevCurrentCounts = followCountsMemoryCache.get(currentUserId);
  followCountsMemoryCache.set(currentUserId, {
    followersCount: prevCurrentCounts?.followersCount ?? 0,
    followingCount: nextCurrentFollowingCount,
    ts: Date.now(),
  });

  invalidatePublicProfileCache(targetUserId);
  invalidatePublicProfileCache(currentUserId);

  if (nextFollowing) {
    void notifyUserOfNewFollower({
      targetUserId,
      followerId: currentUserId,
      followerName: resolvedFollowerName,
      followerAvatar: resolvedFollowerAvatar,
      followerFrame: resolvedFollowerFrame,
    });
  }

  if (!fsSucceeded) {
    throw new Error('Could not update follow status. Please try again.');
  }

  return { following: nextFollowing, followersCount: nextTargetFollowersCount };
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
    const [userSnap, pubSnap, followsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', userId, 'following'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(query(collection(db, 'publicProfiles', userId, 'following'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(
        query(collection(db, 'follows'), where('followerId', '==', userId), limit(maxCount))
      ).catch(() => null),
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
    if (followsSnap) {
      followsSnap.docs.forEach((d) => {
        const followingId = d.data()?.followingId;
        if (followingId && followingId !== userId) ids.add(String(followingId));
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
    const [userSnap, pubSnap, followsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', userId, 'followers'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(query(collection(db, 'publicProfiles', userId, 'followers'), limit(maxCount))).catch(
        () => null
      ),
      getDocs(
        query(collection(db, 'follows'), where('followingId', '==', userId), limit(maxCount))
      ).catch(() => null),
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
    if (followsSnap) {
      followsSnap.docs.forEach((d) => {
        const followerId = d.data()?.followerId;
        if (followerId && followerId !== userId) ids.add(String(followerId));
      });
    }
  } catch (err: unknown) {
    console.warn('[followService] getFollowerIds error:', err);
  }

  return Array.from(ids).slice(0, maxCount);
}

export async function getFollowers(
  userId: string,
  maxCount = 200
): Promise<Array<{ uid: string; followerId: string }>> {
  const ids = await getFollowerIds(userId, maxCount);
  return ids.map((id) => ({ uid: id, followerId: id }));
}

export async function getFollowing(
  userId: string,
  maxCount = 200
): Promise<Array<{ uid: string; targetId: string }>> {
  const ids = await getFollowingIds(userId, maxCount);
  return ids.map((id) => ({ uid: id, targetId: id }));
}

/**
 * Resolves a list of UIDs into rich `FollowUserSummary` objects for Followers / Following modals.
 */
export async function getUsersByIds(
  uids: string[],
  maxCount = 50
): Promise<FollowUserSummary[]> {
  if (!uids || uids.length === 0) return [];
  const cleanUids = Array.from(new Set(uids.filter(Boolean))).slice(0, maxCount);
  const profilesMap: Map<string, PublicProfile> = await getPublicProfiles(cleanUids);

  return cleanUids.map((uid) => {
    const p = profilesMap.get(uid);
    return {
      uid,
      displayName: p?.displayName || 'Student',
      username: p?.username,
      avatar: p?.equippedAvatar || p?.avatar,
      avatarKey: p?.avatarKey,
      avatarVariant: p?.avatarVariant,
      avatarUrl: p?.avatarUrl,
      photoURL: p?.photoURL,
      equippedAvatar: p?.equippedAvatar || p?.avatar || null,
      frame: p?.equippedFrame || p?.frame || null,
      nameplate: p?.equippedNameplate || p?.nameplate || null,
      banner: p?.equippedBanner || p?.banner || null,
      role: p?.role || 'student',
      customRole: p?.customRole,
      targetUniversity: p?.targetUniversity,
      board: p?.board,
      shortId: p?.shortId || uid.slice(0, 6).toUpperCase(),
      badges: p?.badges || [],
    };
  });
}

/**
 * Fetches accurate follower and following counts for a user.
 * Reconciles subcollections (`followers` / `following` / `follows`) with stored counts.
 */
export async function getFollowCounts(
  userId: string,
  seedUserData?: Record<string, any> | null,
  seedPublicData?: Record<string, any> | null
): Promise<{ followersCount: number; followingCount: number }> {
  if (!userId) return { followersCount: 0, followingCount: 0 };

  const cached = followCountsMemoryCache.get(userId);
  if (cached && Date.now() - cached.ts < 15_000) {
    return {
      followersCount: cached.followersCount,
      followingCount: cached.followingCount,
    };
  }

  try {
    const needUserDoc = seedUserData === undefined;
    const needPubDoc = seedPublicData === undefined;

    const [uSnap, pubSnap, pubFollowersSnap, pubFollowingSnap, userFollowersSnap, userFollowingSnap, followsInSnap, followsOutSnap] =
      await Promise.all([
        needUserDoc ? getDoc(doc(db, 'users', userId)).catch(() => null) : Promise.resolve(null),
        needPubDoc ? getDoc(doc(db, 'publicProfiles', userId)).catch(() => null) : Promise.resolve(null),
        getDocs(query(collection(db, 'publicProfiles', userId, 'followers'), limit(500))).catch(() => null),
        getDocs(query(collection(db, 'publicProfiles', userId, 'following'), limit(500))).catch(() => null),
        getDocs(query(collection(db, 'users', userId, 'followers'), limit(500))).catch(() => null),
        getDocs(query(collection(db, 'users', userId, 'following'), limit(500))).catch(() => null),
        getDocs(query(collection(db, 'follows'), where('followingId', '==', userId), limit(500))).catch(() => null),
        getDocs(query(collection(db, 'follows'), where('followerId', '==', userId), limit(500))).catch(() => null),
      ]);

    const uData = seedUserData !== undefined ? seedUserData : uSnap?.exists() ? uSnap.data() : null;
    const pubData = seedPublicData !== undefined ? seedPublicData : pubSnap?.exists() ? pubSnap.data() : null;

    const uFollowers = typeof uData?.followersCount === 'number' ? Math.max(0, uData.followersCount) : null;
    const uFollowing = typeof uData?.followingCount === 'number' ? Math.max(0, uData.followingCount) : null;
    const pubFollowers = typeof pubData?.followersCount === 'number' ? Math.max(0, pubData.followersCount) : null;
    const pubFollowing = typeof pubData?.followingCount === 'number' ? Math.max(0, pubData.followingCount) : null;

    const followerIds = new Set<string>();
    const followingIds = new Set<string>();
    let subcollectionReadSucceeded = false;

    if (pubFollowersSnap) {
      subcollectionReadSucceeded = true;
      pubFollowersSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) followerIds.add(d.id);
      });
    }
    if (userFollowersSnap) {
      subcollectionReadSucceeded = true;
      userFollowersSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) followerIds.add(d.id);
      });
    }
    if (followsInSnap) {
      subcollectionReadSucceeded = true;
      followsInSnap.docs.forEach((d) => {
        const fid = d.data()?.followerId;
        if (fid && fid !== userId) followerIds.add(String(fid));
      });
    }

    if (pubFollowingSnap) {
      subcollectionReadSucceeded = true;
      pubFollowingSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) followingIds.add(d.id);
      });
    }
    if (userFollowingSnap) {
      subcollectionReadSucceeded = true;
      userFollowingSnap.docs.forEach((d) => {
        if (d.id && d.id !== userId) followingIds.add(d.id);
      });
    }
    if (followsOutSnap) {
      subcollectionReadSucceeded = true;
      followsOutSnap.docs.forEach((d) => {
        const tid = d.data()?.followingId;
        if (tid && tid !== userId) followingIds.add(String(tid));
      });
    }

    const followersCount = subcollectionReadSucceeded
      ? followerIds.size
      : (pubFollowers ?? uFollowers ?? 0);
    const followingCount = subcollectionReadSucceeded
      ? followingIds.size
      : (pubFollowing ?? uFollowing ?? 0);

    // Reconcile stored counts if out of sync
    if (subcollectionReadSucceeded && auth.currentUser) {
      if (uData && (uFollowers !== followersCount || uFollowing !== followingCount)) {
        updateDoc(doc(db, 'users', userId), {
          followersCount,
          followingCount,
        }).catch(() => {});
      }
      if (pubData && (pubFollowers !== followersCount || pubFollowing !== followingCount)) {
        updateDoc(doc(db, 'publicProfiles', userId), {
          followersCount,
          followingCount,
        }).catch(() => {});
      }
    }

    followCountsMemoryCache.set(userId, {
      followersCount,
      followingCount,
      ts: Date.now(),
    });

    return { followersCount, followingCount };
  } catch (err: unknown) {
    console.warn('[followService] getFollowCounts error:', err);
    return { followersCount: 0, followingCount: 0 };
  }
}
