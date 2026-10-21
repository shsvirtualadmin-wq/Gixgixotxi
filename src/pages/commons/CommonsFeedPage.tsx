import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  BookOpen,
  RefreshCw,
  Shield,
  AlertTriangle,
  ArrowUp,
  Image as ImageIcon,
  Paperclip,
  HelpCircle,
  EyeOff,
  Compass,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { CommonsPostCard } from '@/components/commons/CommonsPostCard';
import { PostingWizardModal } from '@/components/commons/PostingWizardModal';
import { CommonsCommentsDrawer } from '@/components/commons/CommonsCommentsDrawer';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import {
  fetchCommonsPosts,
  deleteCommonsPost,
  sortCommonsPosts,
  fetchCommonsPostById,
} from '@/services/commonsService';
import type { CommonsPost, CommonsPostType } from '@/types/commons';
import { Link, useSearchParams } from 'react-router-dom';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';

export function CommonsFeedPage() {
  const { user, profile } = useUserProfile();
  const { isAdmin } = useAuth();
  const { openProfile } = useProfileModal();

  // Feed Options: Only "All" and "Following"
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');

  // Posts State (strictly real Firestore posts, 10 per page)
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals & Composer Config
  const [wizardConfig, setWizardConfig] = useState<{
    isOpen: boolean;
    initialType?: CommonsPostType;
    initialAnonymous?: boolean;
    initialStep?: 1 | 2;
    triggerUploadOnMount?: 'photo' | 'file' | null;
  }>({ isOpen: false });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommonsPost | null>(null);
  const [reportPost, setReportPost] = useState<CommonsPost | null>(null);

  // Back to top indicator
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('post') || searchParams.get('id');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // If a shared post ID is in the URL, fetch it specifically so it's guaranteed to be loaded
      let targetPost: CommonsPost | null = null;
      if (targetPostId) {
        targetPost = await fetchCommonsPostById(targetPostId);
      }

      const res = await fetchCommonsPosts({
        feedTab,
        pageSize: 10,
        currentUid: user?.uid,
      });

      let combined = res.posts;
      if (targetPost && !combined.some((p) => p.id === targetPost!.id)) {
        combined = [targetPost, ...combined];
      }

      setPosts(sortCommonsPosts(combined));
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('[CommonsFeedPage] fetch error:', err);
      const msg =
        err instanceof Error ? err.message : 'Could not load community posts';
      setLoadError(msg);
      setPosts([]);
      setLastDoc(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [feedTab, user?.uid, targetPostId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLoadMore = useCallback(async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchCommonsPosts({
        feedTab,
        lastVisibleDoc: lastDoc,
        pageSize: 10,
        currentUid: user?.uid,
      });
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = res.posts.filter((p) => !existingIds.has(p.id));
        return sortCommonsPosts([...prev, ...newPosts]);
      });
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('[CommonsFeedPage] load more notice:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, feedTab, user?.uid]);

  // Infinite scroll trigger via IntersectionObserver sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  // Mobile pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.4, 75));
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      if (pullDistance > 55) {
        loadPosts();
      }
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handlePostCreated = useCallback(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDeletePost = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        await deleteCommonsPost(postId, user.uid, isAdmin);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Could not delete post.';
        console.warn('[CommonsFeedPage] Delete failed:', msg);
      }
    },
    [user, isAdmin]
  );

  const handleOpenComments = useCallback((p: CommonsPost) => setCommentsPost(p), []);
  const handleOpenReport = useCallback((p: CommonsPost) => setReportPost(p), []);
  const handleAuthorClick = useCallback(
    (authorUid: string) => openProfile(authorUid),
    [openProfile]
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="pb-28 max-w-2xl mx-auto space-y-3"
    >
      {/* ── Sticky Top Bar: "Commons", Search, Shield, Refresh ── */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border -mx-4 sm:mx-0 sm:rounded-b-2xl px-4 py-2.5 flex items-center justify-between shadow-xs transition-colors">
        <div>
          <h1
            className="text-lg sm:text-xl font-bold tracking-tight text-primary font-sans"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Commons
          </h1>
          <p className="text-xs text-muted">
            Share notes, papers and doubts. Learn together.
          </p>
        </div>

        {/* Right Action Icons: Search, Guidelines, Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 text-secondary hover:text-primary rounded-xl hover:bg-surface-muted transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Search Commons"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <Link
            to="/commons/guidelines"
            className="p-2 text-secondary hover:text-primary rounded-xl hover:bg-surface-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Community Guidelines"
            aria-label="Guidelines"
          >
            <Shield size={19} />
          </Link>

          <button
            onClick={() => loadPosts()}
            disabled={loading}
            className="p-2 text-secondary hover:text-primary rounded-xl hover:bg-surface-muted transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Pull-to-refresh mobile visual indicator */}
      {pullDistance > 0 && (
        <div
          className="flex justify-center items-center overflow-hidden transition-all text-xs text-muted"
          style={{ height: `${pullDistance}px` }}
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              size={14}
              className={pullDistance > 55 ? 'animate-spin text-accent' : ''}
            />
            <span>{pullDistance > 55 ? 'Release to refresh' : 'Pull down to refresh'}</span>
          </div>
        </div>
      )}

      {/* ── Post Composer Card (Facebook style: "What's on your mind?") ── */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div
            onClick={() => user && openProfile(user.uid)}
            className="shrink-0 cursor-pointer transition-transform hover:scale-105"
            title="View your profile"
          >
            <BoardlyAvatar
              equippedAvatar={profile?.equipped?.avatar || profile?.equippedAvatar}
              avatarUrl={profile?.avatarUrl || user?.photoURL}
              frame={profile?.equipped?.frame || profile?.frame}
              name={profile?.displayName || user?.displayName || 'User'}
              isSuperAdmin={
                isAdmin ||
                user?.email === 'admin@shsvirtual.org' ||
                user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
              }
              size={38}
            />
          </div>

          <button
            type="button"
            onClick={() => setWizardConfig({ isOpen: true, initialStep: 1 })}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-surface-muted hover:bg-surface-raised border border-border text-muted text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Share a resource or ask a doubt...
          </button>
        </div>

        {/* Quick action buttons row: Photo, File, Doubt, Anonymous */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-border overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() =>
              setWizardConfig({
                isOpen: true,
                initialStep: 2,
                triggerUploadOnMount: 'photo',
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap shrink-0"
          >
            <ImageIcon size={16} className="text-emerald-500 shrink-0" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setWizardConfig({
                isOpen: true,
                initialStep: 2,
                triggerUploadOnMount: 'file',
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap shrink-0"
          >
            <Paperclip size={16} className="text-blue-500 shrink-0" />
            <span>File</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setWizardConfig({
                isOpen: true,
                initialStep: 2,
                initialType: 'doubt',
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap shrink-0"
          >
            <HelpCircle size={16} className="text-amber-500 shrink-0" />
            <span>Doubt</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setWizardConfig({
                isOpen: true,
                initialStep: 2,
                initialAnonymous: true,
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap shrink-0"
          >
            <EyeOff size={16} className="text-purple-500 shrink-0" />
            <span>Anonymous</span>
          </button>
        </div>
      </div>

      {/* ── Feed Tabs: "All" and "Following" (Clean underlined active tab in red) ── */}
      <div className="sticky top-[58px] z-20 bg-background/95 backdrop-blur-md border-b border-border -mx-4 sm:mx-0 px-4 flex items-center gap-6">
        <button
          onClick={() => setFeedTab('all')}
          className={`py-2.5 px-1 text-xs sm:text-sm transition-all cursor-pointer select-none ${
            feedTab === 'all'
              ? 'border-b-2 border-accent text-accent font-bold'
              : 'border-b-2 border-transparent text-muted hover:text-primary font-medium'
          }`}
        >
          All
        </button>

        <button
          onClick={() => setFeedTab('following')}
          className={`py-2.5 px-1 text-xs sm:text-sm transition-all cursor-pointer select-none ${
            feedTab === 'following'
              ? 'border-b-2 border-accent text-accent font-bold'
              : 'border-b-2 border-transparent text-muted hover:text-primary font-medium'
          }`}
        >
          Following
        </button>
      </div>

      {/* ── Posts Stream (10 at a time, skeleton loaders, Facebook style) ── */}
      <div className="space-y-3 pt-1">
        {loading && posts.length === 0 ? (
          /* Skeleton Loaders (No blank screen, no spinner-only state) */
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-skeleton shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-3.5 bg-skeleton rounded" />
                    <div className="w-20 h-2.5 bg-skeleton rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-4 bg-skeleton rounded mt-2" />
                <div className="space-y-2">
                  <div className="w-full h-3 bg-skeleton rounded" />
                  <div className="w-5/6 h-3 bg-skeleton rounded" />
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <div className="w-16 h-3.5 bg-skeleton rounded" />
                  <div className="w-16 h-3.5 bg-skeleton rounded" />
                  <div className="w-16 h-3.5 bg-skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          /* Error state with retry */
          <div className="p-8 text-center rounded-2xl border border-tag-danger-text/30 bg-tag-danger-bg space-y-3 shadow-xs">
            <AlertTriangle size={28} className="mx-auto text-accent" />
            <h3 className="text-sm font-semibold text-primary">
              Couldn't Load Posts
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              We encountered an issue fetching the latest community resources.
            </p>
            <button
              onClick={() => loadPosts()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-surface border border-border text-primary hover:bg-surface-muted transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : posts.length === 0 ? (
          /* Empty state */
          <div className="p-10 text-center rounded-2xl border border-border bg-surface space-y-3 shadow-xs">
            <BookOpen size={32} className="mx-auto text-muted" />
            <h3 className="text-sm font-bold text-primary">
              {feedTab === 'following'
                ? "You aren't following anyone yet."
                : 'No posts yet'}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              {feedTab === 'following'
                ? 'Follow people to see their posts here.'
                : 'Be the first to share notes, papers, or ask a doubt to learn together!'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {feedTab === 'following' ? (
                <button
                  onClick={() => setFeedTab('all')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                >
                  <Compass size={14} />
                  <span>Switch to All</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    setWizardConfig({ isOpen: true, initialStep: 1 })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Share something</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Real Firestore posts */
          posts.map((post) => (
            <CommonsPostCard
              key={post.id}
              post={post}
              currentUserId={user?.uid}
              isAdmin={isAdmin}
              onOpenComments={handleOpenComments}
              onOpenReport={handleOpenReport}
              onDeletePost={handleDeletePost}
              onAuthorClick={handleAuthorClick}
            />
          ))
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-6 w-full" />}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="py-4 text-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-muted mt-1.5">Loading more posts...</p>
          </div>
        )}
      </div>

      {/* ── Floating "Back to top" Chip (When scrolled) ── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 sm:right-8 z-40 px-3.5 py-2 rounded-full bg-surface-raised border border-border text-primary shadow-lg text-xs font-semibold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Back to top"
        >
          <ArrowUp size={14} />
          <span>Back to top</span>
        </button>
      )}

      {/* ── Modals & Drawers ── */}
      {user && (
        <PostingWizardModal
          isOpen={wizardConfig.isOpen}
          onClose={() => setWizardConfig({ isOpen: false })}
          onPostCreated={handlePostCreated}
          currentUser={{
            uid: user.uid,
            email: user.email,
            displayName: profile?.displayName || user.displayName,
            photoURL: profile?.photoURL || user.photoURL,
          }}
          initialType={wizardConfig.initialType}
          initialAnonymous={wizardConfig.initialAnonymous}
          initialStep={wizardConfig.initialStep}
          triggerUploadOnMount={wizardConfig.triggerUploadOnMount}
        />
      )}

      <CommonsCommentsDrawer
        post={commentsPost}
        isOpen={Boolean(commentsPost)}
        onClose={() => setCommentsPost(null)}
        currentUser={
          user
            ? {
                uid: user.uid,
                displayName: profile?.displayName || user.displayName,
                photoURL: profile?.photoURL || user.photoURL,
                equippedAvatar: profile?.equippedAvatar,
                frame: profile?.frame,
                avatarUrl: profile?.avatarUrl,
              }
            : null
        }
      />

      <CommonsReportModal
        post={reportPost}
        isOpen={Boolean(reportPost)}
        onClose={() => setReportPost(null)}
        reporterUid={user?.uid || null}
      />

      <CommonsSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        posts={posts}
        currentUserId={user?.uid}
        onSelectPost={(post) => {
          setSearchModalOpen(false);
          setCommentsPost(post);
        }}
        onOpenComments={(p) => {
          setSearchModalOpen(false);
          setCommentsPost(p);
        }}
        onOpenReport={(p) => {
          setSearchModalOpen(false);
          setReportPost(p);
        }}
        onOpenUserProfile={(uid: string) => {
          setSearchModalOpen(false);
          openProfile(uid);
        }}
      />
    </div>
  );
}
