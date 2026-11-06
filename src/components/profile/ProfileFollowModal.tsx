import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '@/services/followService';
import { getPublicProfiles } from '@/services/publicProfileService';
import type { PublicProfile } from '@/types';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';

interface ProfileFollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUid: string;
  initialTab?: 'followers' | 'following';
  currentUserId?: string | null;
  onOpenUserProfile?: (uid: string) => void;
}

export const ProfileFollowModal: React.FC<ProfileFollowModalProps> = ({
  isOpen,
  onClose,
  targetUid,
  initialTab = 'followers',
  currentUserId,
  onOpenUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !targetUid) return;

    let cancelled = false;
    setLoading(true);
    setPage(1);

    const loadData = async () => {
      try {
        const followDocs =
          activeTab === 'followers'
            ? await getFollowers(targetUid, 50)
            : await getFollowing(targetUid, 50);

        const uids =
          activeTab === 'followers'
            ? followDocs.map((d: any) => d.uid || d.followerId).filter(Boolean)
            : followDocs.map((d: any) => d.uid || d.targetId).filter(Boolean);

        if (cancelled) return;

        if (uids.length === 0) {
          setProfiles([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        const profileMap = await getPublicProfiles(uids);
        if (cancelled) return;

        const resolvedList: PublicProfile[] = [];
        uids.forEach((id) => {
          const p = profileMap.get(id);
          if (p) resolvedList.push(p);
        });

        setProfiles(resolvedList);
        setHasMore(resolvedList.length > 20);

        // Check if current user follows these people
        if (currentUserId) {
          const statusMap: Record<string, boolean> = {};
          await Promise.all(
            resolvedList.slice(0, 20).map(async (p) => {
              if (p.uid !== currentUserId) {
                statusMap[p.uid] = await isFollowing(currentUserId, p.uid);
              }
            })
          );
          if (!cancelled) {
            setFollowingStatus((prev) => ({ ...prev, ...statusMap }));
          }
        }
      } catch (err) {
        console.warn('[ProfileFollowModal] Load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUid, activeTab, currentUserId]);

  const displayedProfiles = profiles.slice(0, page * 20);
  const canLoadMore = hasMore && displayedProfiles.length < profiles.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isOpen || !canLoadMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && canLoadMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { root: listContainerRef.current, rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, canLoadMore, loading]);

  if (!isOpen) return null;

  const handleToggleFollow = async (pUid: string) => {
    if (!currentUserId || pendingUid) return;
    const isCurrentlyFollowing = Boolean(followingStatus[pUid]);
    setPendingUid(pUid);

    // Optimistic UI
    setFollowingStatus((prev) => ({ ...prev, [pUid]: !isCurrentlyFollowing }));

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(currentUserId, pUid);
      } else {
        await followUser(currentUserId, pUid);
      }
    } catch (err) {
      // Revert on error
      setFollowingStatus((prev) => ({ ...prev, [pUid]: isCurrentlyFollowing }));
      console.warn('[ProfileFollowModal] Follow toggle failed:', err);
    } finally {
      setPendingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-[#0e0e11] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[640px] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`text-sm font-bold pb-1 transition-all border-b-2 ${
                activeTab === 'followers'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Followers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`text-sm font-bold pb-1 transition-all border-b-2 ${
                activeTab === 'following'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Following
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content list */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3.5 bg-neutral-800 rounded" />
                      <div className="w-16 h-2.5 bg-neutral-850 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-neutral-800 rounded-lg" />
                </div>
              ))}
            </div>
          ) : displayedProfiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 font-mono space-y-1">
              <p>{activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
            </div>
          ) : (
            <>
              {displayedProfiles.map((p) => {
                const isOwn = currentUserId === p.uid;
                const isUserFollowing = Boolean(followingStatus[p.uid]);
                return (
                  <div
                    key={p.uid}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-neutral-850 bg-neutral-900/40 hover:bg-neutral-900 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUserProfile?.(p.uid);
                      }}
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                    >
                      <BoardlyAvatar
                        equippedAvatar={p.avatar || (p.equipped?.avatar as string)}
                        avatarUrl={p.avatarUrl}
                        photoURL={p.photoURL}
                        frame={p.frame || (p.equipped?.frame as string) || 'none'}
                        avatarKey={p.avatarKey}
                        avatarVariant={p.avatarVariant}
                        name={p.displayName || 'Student'}
                        size={38}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-100 truncate">
                            {p.displayName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400">
                            #{p.studentId}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate">
                          {p.rankTitle || 'Fresher'}
                        </div>
                      </div>
                    </button>

                    {/* Follow button (hidden on own row) */}
                    {!isOwn && currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(p.uid)}
                        disabled={pendingUid === p.uid}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                          isUserFollowing
                            ? 'border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:border-red-600 hover:text-red-400'
                            : 'border-red-600 bg-red-600 hover:bg-red-500 text-white shadow-sm'
                        }`}
                      >
                        {isUserFollowing ? (
                          <span className="flex items-center gap-1">
                            <Check size={13} />
                            <span>Following</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserPlus size={13} />
                            <span>Follow</span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {canLoadMore && <div ref={sentinelRef} className="h-4 w-full shrink-0" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
