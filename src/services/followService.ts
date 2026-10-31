import { auth } from '@/lib/firebase';
import { notifyUserOfNewFollower } from '@/services/notificationService';
import { getPublicProfile } from '@/services/publicProfileService';

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
    const resp = await fetch(
      `/api/follows?followerUid=${encodeURIComponent(currentUserId)}&followingUid=${encodeURIComponent(targetUserId)}`,
      { cache: 'no-store' }
    );
    if (!resp.ok) return false;
    const d1Res = await resp.json();
    return Boolean(d1Res?.isFollowing);
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
      const mePub = await getPublicProfile(currentUserId);
      if (mePub) {
        resolvedFollowerName = mePub.displayName || mePub.username || 'A student';
        resolvedFollowerAvatar =
          resolvedFollowerAvatar || mePub.avatar || mePub.equipped?.avatar || null;
        resolvedFollowerFrame = resolvedFollowerFrame || mePub.frame || mePub.equipped?.frame || null;
      }
    } catch {
      // Ignore profile lookup error
    }
  }
  if (!resolvedFollowerName) {
    resolvedFollowerName = 'A student';
  }

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

  if (!resp.ok) {
    throw new Error('Could not update follow status. Please try again.');
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
    const resp = await fetch(`/api/follows?followerUid=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (resp.ok) {
      const d1Res = await resp.json();
      if (Array.isArray(d1Res?.followingIds)) {
        d1Res.followingIds.forEach((id: string) => {
          if (id && id !== userId) ids.add(String(id));
        });
      }
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
    const resp = await fetch(`/api/follows?followingUid=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (resp.ok) {
      const d1Res = await resp.json();
      if (Array.isArray(d1Res?.followerIds)) {
        d1Res.followerIds.forEach((id: string) => {
          if (id && id !== userId) ids.add(String(id));
        });
      }
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
    const [followerIds, followingIds, pubData] = await Promise.all([
      getFollowerIds(userId),
      getFollowingIds(userId),
      getPublicProfile(userId).catch(() => null),
    ]);

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
