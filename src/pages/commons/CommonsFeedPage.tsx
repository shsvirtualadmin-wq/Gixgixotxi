import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  RefreshCw,
  Compass,
  Users,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { CommonsPostCard } from '@/components/commons/CommonsPostCard';
import { PostingWizardModal } from '@/components/commons/PostingWizardModal';
import { CommonsCommentsDrawer } from '@/components/commons/CommonsCommentsDrawer';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import { CommonsSearchModal } from '@/components/commons/CommonsSearchModal';
import { fetchCommonsPosts, deleteCommonsPost } from '@/services/commonsService';
import type { CommonsPost } from '@/types/commons';
import { Link } from 'react-router-dom';
import { useProfileModal } from '@/contexts/ProfileModalContext';

export function CommonsFeedPage() {
  const { user, profile } = useUserProfile();
  const { isAdmin } = useAuth();
  const { openProfile } = useProfileModal();

  // Feed Options: Only "Following" and "All"
  const [feedTab, setFeedTab] = useState<'following' | 'all'>('all');

  // Posts State (strictly real Firestore posts, zero placeholder/fake posts)
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommonsPost | null>(null);
  const [reportPost, setReportPost] = useState<CommonsPost | null>(null);

  // Direct search query
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchCommonsPosts({
        feedTab,
        searchQuery,
        pageSize: 20,
        currentUid: user?.uid,
      });

      setPosts(res.posts);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('[CommonsFeedPage] fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Could not load community posts';
      setLoadError(msg);
      setPosts([]);
      setLastDoc(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [feedTab, searchQuery, user?.uid]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchCommonsPosts({
        feedTab,
        searchQuery,
        lastVisibleDoc: lastDoc,
        pageSize: 20,
        currentUid: user?.uid,
      });
      setPosts((prev) => [...prev, ...res.posts]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteCommonsPost(postId, user.uid, isAdmin);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete post.';
      alert(msg);
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* ── Top Header Bar with Red Dot Matrix Accent ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-500 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>COMMUNITY RESOURCE EXCHANGE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100 font-mono mt-1">
            BOARDLY COMMONS
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Peer notes, solved entrance past papers, high-yield formula sheets &amp; doubts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/commons/guidelines"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-neutral-400 hover:text-white rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 transition-colors"
          >
            <Shield size={14} className="text-neutral-500" />
            <span>Guidelines</span>
          </Link>

          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Share Resource</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-neutral-800 bg-[#0c0c0e] hover:border-neutral-700 text-left transition-colors group cursor-text"
        >
          <div className="flex items-center gap-3">
            <Search size={18} className="text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm text-neutral-400">
              Search high-yield formulas, past papers, doubts, or classmates...
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            <span>⌘K</span>
          </div>
        </button>
      </div>

      {/* ── Feed Options: ONLY "Following" and "All" (No Shortcuts) ── */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          {/* Option 1: Following */}
          <button
            onClick={() => setFeedTab('following')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all ${
              feedTab === 'following'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Users size={15} className={feedTab === 'following' ? 'text-red-500' : ''} />
            <span>Following</span>
          </button>

          {/* Option 2: All */}
          <button
            onClick={() => setFeedTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all ${
              feedTab === 'all'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Compass size={15} className={feedTab === 'all' ? 'text-red-500' : ''} />
            <span>All</span>
          </button>
        </div>

        <button
          onClick={() => loadPosts()}
          disabled={loading}
          className="p-2 text-neutral-500 hover:text-neutral-300 rounded-lg hover:bg-neutral-900 transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Posts Stream (Real Posts Only) ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-mono">Loading Commons stream...</p>
          </div>
        ) : loadError ? (
          <div className="p-8 text-center rounded-2xl border border-red-900/40 bg-[#160b0c] space-y-3">
            <AlertTriangle size={28} className="mx-auto text-red-500" />
            <h3 className="text-sm font-semibold text-neutral-200 font-mono uppercase tracking-wider">
              Couldn't Load Posts
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              We encountered an issue fetching the latest community resources. Your connection might have timed out or been interrupted.
            </p>
            <button
              onClick={() => loadPosts()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-neutral-800 bg-[#0c0c0e] space-y-3">
            <BookOpen size={32} className="mx-auto text-neutral-600" />
            <h3 className="text-sm font-semibold text-neutral-200 font-mono uppercase tracking-wider">
              {feedTab === 'following' ? 'NO POSTS FROM FOLLOWED USERS' : 'NO STUDY POSTS YET'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              {feedTab === 'following'
                ? 'Follow peers and study creators to see their notes and papers here, or switch to "All" to browse the community feed.'
                : 'Be the first to share handwritten notes, solved past papers, or high-yield formula sheets for your peers!'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              {feedTab === 'following' && (
                <button
                  onClick={() => setFeedTab('all')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                >
                  <Compass size={14} className="text-red-500" />
                  <span>Browse All Posts</span>
                </button>
              )}
              <button
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer shadow-md shadow-red-950/40"
              >
                <Plus size={15} />
                <span>Create first post</span>
              </button>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <CommonsPostCard
              key={post.id}
              post={post}
              currentUserId={user?.uid}
              isAdmin={isAdmin}
              onOpenComments={(p) => setCommentsPost(p)}
              onOpenReport={(p) => setReportPost(p)}
              onDeletePost={handleDeletePost}
              onAuthorClick={(authorUid: string) => openProfile(authorUid)}
            />
          ))
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            >
              {loadingMore ? 'Loading more posts...' : 'Load more resources'}
            </button>
          </div>
        )}
      </div>

      {/* ── Modals & Drawers ── */}
      {user && (
        <PostingWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onPostCreated={handlePostCreated}
          currentUser={{
            uid: user.uid,
            email: user.email,
            displayName: profile?.displayName || user.displayName,
            photoURL: profile?.photoURL || user.photoURL,
          }}
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
        onSelectPost={() => {}}
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
