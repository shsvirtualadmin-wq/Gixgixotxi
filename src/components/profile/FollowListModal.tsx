import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, UserPlus, UserCheck, AlertCircle } from 'lucide-react';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '@/services/followService';
import { getPublicProfiles } from '@/services/publicProfileService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { getRankTitle } from '@/config/rankLadder';
import type { PublicProfile } from '@/types';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
  currentUserId?: string | null;
  onSelectUser?: (uid: string) => void;
}

const PAGE_SIZE = 20;

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialTab = 'followers',
  currentUserId,
  onSelectUser,
}) => {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Set of UIDs the current viewer is following
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  // Unfollow confirmation modal state
  const [unfollowTarget, setUnfollowTarget] = useState<PublicProfile | null>(null);
  const [unfollowLoading, setUnfollowLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize initialTab when opening
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setPage(1);
    }
  }, [isOpen, initialTab]);

  // Infinite scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isOpen || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { root: listContainerRef.current, rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasMore, loading]);

  const loadData = useCallback(async () => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const records =
        tab === 'followers'
          ? await getFollowers(userId, page * PAGE_SIZE + 1)
          : await getFollowing(userId, page * PAGE_SIZE + 1);

      const targetUids = records.map((r: any) => r.uid || (tab === 'followers' ? r.followerId : r.targetId)).filter(Boolean);
      const hasNext = targetUids.length > page * PAGE_SIZE;
      const slicedUids = targetUids.slice(0, page * PAGE_SIZE);

      setHasMore(hasNext);

      // Fetch public profiles strictly
      const profileMap = await getPublicProfiles(slicedUids);
      const list: PublicProfile[] = [];
      for (const uid of slicedUids) {
        const p = profileMap.get(uid);
        if (p) list.push(p);
      }
      setProfiles(list);

      // Check current user follow status for these profiles
      if (currentUserId) {
        const checks = await Promise.all(
          slicedUids.map(async (uid) => {
            if (uid === currentUserId) return null;
            const res = await isFollowing(currentUserId, uid);
            return res ? uid : null;
          })
        );
        const validFollowing = new Set<string>(checks.filter(Boolean) as string[]);
        setFollowingSet(validFollowing);
      }
    } catch (err: any) {
      console.warn('[FollowListModal] error loading list:', err);
      setErrorMessage(err?.message || 'Could not load student list.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, userId, tab, page, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isOpen) return null;

  const handleFollowClick = async (profile: PublicProfile) => {
    if (!currentUserId || pendingUid) return;
    const targetId = profile.uid;
    const currentlyFollowing = followingSet.has(targetId);

    if (currentlyFollowing) {
      // Prompt confirmation
      setUnfollowTarget(profile);
      return;
    }

    // Optimistic follow
    setPendingUid(targetId);
    setFollowingSet((prev) => new Set(prev).add(targetId));

    try {
      await followUser(currentUserId, targetId);
    } catch (err: any) {
      // Rollback
      setFollowingSet((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      setErrorMessage(err?.message || 'Failed to follow student.');
    } finally {
      setPendingUid(null);
    }
  };

  const confirmUnfollow = async () => {
    if (!currentUserId || !unfollowTarget) return;
    const targetId = unfollowTarget.uid;
    setUnfollowLoading(true);

    // Optimistic update
    setFollowingSet((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });

    try {
      await unfollowUser(currentUserId, targetId);
      setUnfollowTarget(null);
    } catch (err: any) {
      // Rollback
      setFollowingSet((prev) => new Set(prev).add(targetId));
      setErrorMessage(err?.message || 'Failed to unfollow.');
    } finally {
      setUnfollowLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-[var(--card)] border-t sm:border border-[var(--border)] sm:rounded-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] shadow-2xl overflow-hidden"
        style={{ borderRadius: '24px 24px 0 0' }}
      >
        {/* Header & Tabs */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setTab('followers');
                setPage(1);
              }}
              className={`pb-1 text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 ${
                tab === 'followers'
                  ? 'border-[var(--red)] text-[var(--text)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => {
                setTab('following');
                setPage(1);
              }}
              className={`pb-1 text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 ${
                tab === 'following'
                  ? 'border-[var(--red)] text-[var(--text)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Following
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* List Body */}
        <div ref={listContainerRef} className="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {loading && profiles.length === 0 ? (
            <div className="py-8">
              <LineLoader variant="section" context="generic" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-[var(--muted)]">
              <p className="font-heading font-medium text-sm text-[var(--text)]">
                {tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
              <p className="text-xs max-w-xs">
                {tab === 'followers'
                  ? 'When students follow this profile, they will appear here.'
                  : 'Start following fellow students to stay updated on their shared study resources.'}
              </p>
            </div>
          ) : (
            profiles.map((p) => {
              const rank = getRankTitle(p.stats?.mcqs || p.publicStats?.score, p.stats?.streak);
              const isMe = currentUserId === p.uid;
              const isFollowed = followingSet.has(p.uid);
              const isWorking = pendingUid === p.uid;

              return (
                <div
                  key={p.uid}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[var(--card-2)] transition-colors border border-transparent hover:border-[var(--border)]"
                >
                  <button
                    onClick={() => {
                      if (onSelectUser) {
                        onSelectUser(p.uid);
                      }
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                  >
                    <BoardlyAvatar
                      equippedAvatar={p.avatar || (p.equipped?.avatar as string)}
                      avatarUrl={p.avatarUrl}
                      photoURL={p.photoURL}
                      frame={p.frame || (p.equipped?.frame as string) || 'none'}
                      avatarKey={p.avatarKey}
                      avatarVariant={p.avatarVariant}
                      name={p.displayName || 'Student'}
                      size={36}
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-semibold text-xs text-[var(--text)] group-hover:text-[var(--red)] transition-colors truncate">
                          {p.displayName}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--muted)]">
                          #{p.studentId || p.shortId || p.uid.slice(0, 5)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: rank.badgeColor }}>
                        {rank.title}
                      </span>
                    </div>
                  </button>

                  {/* Follow/Following Button (Hidden on my own row) */}
                  {!isMe && currentUserId && (
                    <button
                      onClick={() => handleFollowClick(p)}
                      disabled={isWorking}
                      className={`h-8 px-3 rounded-lg text-xs font-heading font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isFollowed
                          ? 'border border-[var(--border)] text-[var(--text)] hover:border-red-500 hover:text-red-500 bg-transparent'
                          : 'bg-[var(--red)] text-white hover:bg-[var(--red-dark)]'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck size={13} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Infinite Scroll Sentinel */}
          {hasMore && <div ref={sentinelRef} className="h-4 w-full shrink-0" />}
          {loading && profiles.length > 0 && (
            <div className="py-2">
              <LineLoader variant="inline" context="generic" message="Loading more..." />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Unfollow @name? */}
      {unfollowTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="font-heading font-bold text-base text-[var(--text)]">
              Unfollow @{unfollowTarget.displayName}?
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Their shared study resources and updates will no longer appear in your Following feed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUnfollowTarget(null)}
                disabled={unfollowLoading}
                className="h-10 px-4 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnfollow}
                disabled={unfollowLoading}
                className="relative overflow-hidden h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <span>{unfollowLoading ? 'Unfollowing...' : 'Unfollow'}</span>
                {unfollowLoading && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
