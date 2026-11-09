import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  FolderOpen,
  Bell,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { CommonsPostCard } from '@/components/commons/CommonsPostCard';
import { PostingWizardModal } from '@/components/commons/PostingWizardModal';
import { CommonsCommentsDrawer } from '@/components/commons/CommonsCommentsDrawer';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import { CommonsSearchModal } from '@/components/commons/CommonsSearchModal';
import { PageMeta } from '@/components/ui/PageMeta';
import { LineLoader } from '@/components/ui/LineLoader';
import {
  fetchCommonsPosts,
  deleteCommonsPost,
  sortCommonsPosts,
  fetchCommonsPostById,
} from '@/services/commonsService';
import type { CommonsPost, CommonsPostType } from '@/types/commons';
import { Link, useSearchParams, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { buildEntitySlug } from '@/utils/privacy';

const SUBJECT_FILTERS = [
  { slug: 'all', label: 'All Subjects' },
  { slug: 'mathematics', label: 'Mathematics' },
  { slug: 'physics', label: 'Physics' },
  { slug: 'chemistry', label: 'Chemistry' },
  { slug: 'biology', label: 'Biology' },
  { slug: 'english', label: 'English' },
  { slug: 'computer', label: 'Computer Science' },
];

export function CommonsFeedPage({ initialCompose = false }: { initialCompose?: boolean }) {
  const { user, profile } = useUserProfile();
  const { isAdmin } = useAuth();
  const { requireAuth } = useAuthGate();
  const { openProfile } = useProfileModal();
  const location = useLocation();
  const navigate = useNavigate();
  const { subject: routeSubject } = useParams<{ subject?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPublicRoute = location.pathname.startsWith('/commons');
  const baseCommonsPath = location.pathname.startsWith('/dashboard/commons')
    ? '/dashboard/commons'
    : '/commons';

  // Derive Feed Tab ("all" | "trending" | "following") and filters directly from URL
  const feedTab: 'all' | 'trending' | 'following' =
    location.pathname.endsWith('/trending') || searchParams.get('tab') === 'trending'
      ? 'trending'
      : location.pathname.endsWith('/following') || searchParams.get('tab') === 'following'
      ? 'following'
      : 'all';

  const normalizedRouteSubj = (routeSubject || '').toLowerCase();
  const subjectFilter =
    normalizedRouteSubj === 'computer-science'
      ? 'computer'
      : normalizedRouteSubj || searchParams.get('subject') || 'all';
  const classFilter = searchParams.get('class') || 'all';

  const setFeedTab = useCallback(
    (nextTab: 'all' | 'trending' | 'following') => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextTab === 'all') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', nextTab);
      }
      const qs = nextParams.toString();
      const targetPath =
        subjectFilter !== 'all'
          ? `/commons/subject/${subjectFilter}`
          : baseCommonsPath;
      navigate(`${targetPath}${qs ? `?${qs}` : ''}`);
    },
    [searchParams, subjectFilter, baseCommonsPath, navigate]
  );

  const setSubjectFilter = useCallback(
    (nextSubj: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('subject');
      const qs = nextParams.toString();
      if (nextSubj === 'all') {
        navigate(`${baseCommonsPath}${qs ? `?${qs}` : ''}`);
      } else {
        navigate(`/commons/subject/${nextSubj}${qs ? `?${qs}` : ''}`);
      }
    },
    [searchParams, baseCommonsPath, navigate]
  );

  const setClassFilter = useCallback(
    (nextClass: string) => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextClass === 'all') {
        nextParams.delete('class');
      } else {
        nextParams.set('class', nextClass);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Posts State (strictly real Firestore posts, 10 per page)
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [backendMode, setBackendMode] = useState<'cloudflare-d1-r2' | 'preview-demo' | null>(null);
  const unreadNotifCount = useUnreadNotificationsCount();
  const recentCreatedPostRef = useRef<CommonsPost | null>(null);

  // Modals & Composer Config
  const [wizardConfig, setWizardConfig] = useState<{
    isOpen: boolean;
    initialType?: CommonsPostType;
    initialAnonymous?: boolean;
    initialStep?: 1 | 2;
    triggerUploadOnMount?: 'photo' | 'file' | null;
  }>({ isOpen: Boolean(initialCompose && user) });

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
      const over = window.scrollY > 380;
      setShowBackToTop((prev) => (prev === over ? prev : over));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const targetPostId = searchParams.get('post') || searchParams.get('id');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [targetPost, res] = await Promise.all([
        targetPostId ? fetchCommonsPostById(targetPostId) : Promise.resolve(null),
        fetchCommonsPosts({
          feedTab: feedTab === 'following' ? 'following' : 'all',
          pageSize: 15,
          currentUid: user?.uid,
        }),
      ]);

      let combined = res.posts;
      if (targetPost && !combined.some((p) => p.id === targetPost!.id)) {
        combined = [targetPost, ...combined];
      }
      if (
        recentCreatedPostRef.current &&
        feedTab !== 'following' &&
        !combined.some((p) => p.id === recentCreatedPostRef.current!.id)
      ) {
        combined = [recentCreatedPostRef.current, ...combined];
      }

      setPosts(sortCommonsPosts(combined));
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
      setBackendMode(res.backendMode || 'cloudflare-d1-r2');
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
    if (lastDoc === null || lastDoc === undefined || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchCommonsPosts({
        feedTab: feedTab === 'following' ? 'following' : 'all',
        lastDoc,
        pageSize: 15,
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

  const displayedPosts = useMemo(() => {
    let list = [...posts];
    if (subjectFilter !== 'all') {
      list = list.filter((p) => {
        const sub = (p.subject || '').toLowerCase();
        return sub.includes(subjectFilter) || (p.tags || []).some((t) => t.toLowerCase().includes(subjectFilter));
      });
    }
    if (classFilter !== 'all') {
      list = list.filter((p) => {
        const target = `${p.target || ''} ${p.classLevel || ''} ${p.board || ''} ${p.chapter || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return target.includes(classFilter.toLowerCase());
      });
    }
    if (feedTab === 'trending') {
      list.sort((a, b) => (b.upvotes || 0) + (b.commentCount || 0) - ((a.upvotes || 0) + (a.commentCount || 0)));
    }
    return list;
  }, [posts, subjectFilter, classFilter, feedTab]);

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

  const handlePostCreated = useCallback(
    (_postId: string, optimisticPost?: CommonsPost) => {
      setFeedTab('all');
      setSubjectFilter('all');
      setClassFilter('all');
      if (optimisticPost) {
        recentCreatedPostRef.current = optimisticPost;
        setPosts((prev) =>
          sortCommonsPosts([
            optimisticPost,
            ...prev.filter((p) => p.id !== optimisticPost.id),
          ])
        );
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void loadPosts();
    },
    [loadPosts, setClassFilter, setFeedTab, setSubjectFilter]
  );

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

  const handleOpenComments = useCallback(
    (p: CommonsPost) => {
      navigate(`/commons/post/${buildEntitySlug(p.id, p.title)}#comments`);
    },
    [navigate]
  );
  const handleOpenReport = useCallback((p: CommonsPost) => setReportPost(p), []);
  const handleAuthorClick = useCallback(
    (authorUid: string) => openProfile(authorUid),
    [openProfile]
  );

  const openComposerWithGate = (config: {
    initialType?: CommonsPostType;
    initialAnonymous?: boolean;
    initialStep?: 1 | 2;
    triggerUploadOnMount?: 'photo' | 'file' | null;
  }) => {
    requireAuth('create a post or share study material in Boardly Commons', () => {
      setWizardConfig({ isOpen: true, ...config });
    });
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="boardly-feed-container w-full max-w-2xl min-w-0 box-border overflow-x-hidden mx-auto space-y-3 pb-[calc(96px+env(safe-area-inset-bottom,0px))]"
    >
      {isPublicRoute && (
        <PageMeta
          title="Boardly Commons — Free Student Notes, Solved Past Papers & Doubts"
          description="Browse free peer-shared study notes, solved board past papers, formula sheets, and entrance test Q&A across Mathematics, Physics, Chemistry, Biology, and Computer Science."
          canonicalPath="/commons"
        />
      )}

      {/* ── Sticky Top Bar: "Commons", Search, Material Library, Guidelines, Refresh ── */}
      <header className="sticky top-2 z-30 glass-card allow-backdrop-blur rounded-[24px] px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2 w-full max-w-full min-w-0 box-border overflow-x-hidden transition-colors">
        <div className="min-w-0 flex-1">
          <h1
            className="text-lg sm:text-xl font-bold tracking-tight text-primary font-dot truncate"
          >
            Boardly Commons
          </h1>
          <p className="text-xs text-muted truncate">
            Share notes, papers and doubts. Learn together.
          </p>
        </div>

        {/* Right Action Icons: Material Library, Search, Guidelines, Refresh */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Link
            to="/material"
            className="p-2 text-secondary hover:text-primary rounded-full glass-pill transition-colors min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
            title="Study Material Library"
            aria-label="Study Material Library"
          >
            <FolderOpen size={18} />
          </Link>

          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 text-secondary hover:text-primary rounded-full glass-pill transition-colors cursor-pointer min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
            title="Search Commons"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <Link
            to="/guidelines"
            className="p-2 text-secondary hover:text-primary rounded-full glass-pill transition-colors min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
            title="Community Guidelines"
            aria-label="Guidelines"
          >
            <Shield size={18} />
          </Link>

          {user && (
            <Link
              to="/dashboard/notifications"
              className="relative p-2 text-secondary hover:text-primary rounded-full glass-pill transition-colors min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D71921] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={() => loadPosts()}
            disabled={loading}
            className="p-2 text-secondary hover:text-primary rounded-full glass-pill transition-colors cursor-pointer min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Pull-to-refresh mobile visual indicator */}
      {pullDistance > 0 && (
        <div
          className="flex justify-center items-center overflow-hidden transition-all text-xs text-muted px-4"
          style={{ height: `${pullDistance}px` }}
        >
          <LineLoader
            variant="inline"
            context="generic"
            message={pullDistance > 55 ? 'Release to refresh...' : 'Pull down to refresh...'}
            immediate
          />
        </div>
      )}

      {/* ── Post Composer Card (Facebook style: "What's on your mind?") ── */}
      <div className="glass-card rounded-[28px] p-4 sm:p-5 space-y-3 w-full max-w-full min-w-0 box-border overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => (user ? openProfile(user.uid) : openComposerWithGate({ initialStep: 1 }))}
            className="shrink-0 cursor-pointer transition-transform hover:scale-105"
            title={user ? 'View your profile' : 'Sign in to post'}
          >
            <BoardlyAvatar
              uid={user?.uid}
              equippedAvatar={
                profile?.equipped?.avatar ||
                (profile as any)?.equippedAvatar ||
                (profile as any)?.avatar
              }
              frame={profile?.equipped?.frame || (profile as any)?.frame}
              name={profile?.displayName || user?.displayName || 'Guest'}
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
            onClick={() => openComposerWithGate({ initialStep: 1 })}
            className="flex-1 min-w-0 text-left px-4 py-2.5 rounded-full bg-surface-muted hover:bg-surface-raised border border-border text-muted text-xs sm:text-sm transition-colors cursor-pointer truncate"
          >
            Share a resource or ask a doubt...
          </button>
        </div>

        {/* Quick action buttons row: Photo, File, Doubt, Anonymous */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-border w-full max-w-full min-w-0">
          <button
            type="button"
            onClick={() =>
              openComposerWithGate({
                initialStep: 2,
                triggerUploadOnMount: 'photo',
              })
            }
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <ImageIcon size={15} className="text-emerald-500 shrink-0" />
            <span className="truncate">Photo</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openComposerWithGate({
                initialStep: 2,
                triggerUploadOnMount: 'file',
              })
            }
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <Paperclip size={15} className="text-blue-500 shrink-0" />
            <span className="truncate">File</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openComposerWithGate({
                initialStep: 2,
                initialType: 'doubt',
              })
            }
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <HelpCircle size={15} className="text-amber-500 shrink-0" />
            <span className="truncate">Doubt</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openComposerWithGate({
                initialStep: 2,
                initialAnonymous: true,
              })
            }
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <EyeOff size={15} className="text-purple-500 shrink-0" />
            <span className="truncate">Anonymous</span>
          </button>
        </div>
      </div>

      {backendMode === 'preview-demo' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 w-full max-w-full min-w-0 box-border">
          <span className="font-semibold min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">
            Demo Mode (Preview Store) — Bind Cloudflare D1 (<code className="font-mono">DB</code>) &amp; R2 (<code className="font-mono">R2_BUCKET</code>) in Cloudflare Pages to use live cloud storage.
          </span>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold shrink-0 hover:text-white"
          >
            Check /api/health
          </a>
        </div>
      )}

      {/* ── Subject & Class Filters ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 w-full max-w-full min-w-0">
        {SUBJECT_FILTERS.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSubjectFilter(s.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              subjectFilter === s.slug
                ? 'bg-accent text-white border-accent'
                : 'bg-surface border-border text-secondary hover:text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="Filter by class or board"
          className="ml-auto max-w-full px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-border text-secondary focus:outline-none"
        >
          <option value="all">All Classes & Boards</option>
          <option value="class 9">Class 9 (SSC-I)</option>
          <option value="class 10">Class 10 (SSC-II)</option>
          <option value="11">Class 11 (HSSC-I)</option>
          <option value="12">Class 12 (HSSC-II)</option>
          <option value="mdcat">MDCAT</option>
          <option value="ecat">ECAT / NET</option>
          <option value="fbise">FBISE / Federal Board</option>
          <option value="sindh">Sindh Board</option>
          <option value="punjab">Punjab Board</option>
        </select>
      </div>

      {/* ── Feed Tabs: "Newest", "Trending", and "Following" ── */}
      <div className="sticky top-[58px] z-20 floating-blur backdrop-blur-lg border-b border-border px-2 sm:px-3 flex flex-wrap items-center justify-between gap-2 w-full max-w-full min-w-0 box-border overflow-x-hidden">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button
            onClick={() => setFeedTab('all')}
            className={`py-2.5 px-1 text-xs sm:text-sm transition-all cursor-pointer select-none ${
              feedTab === 'all'
                ? 'border-b-2 border-accent text-accent font-bold'
                : 'border-b-2 border-transparent text-muted hover:text-primary font-medium'
            }`}
          >
            Newest
          </button>

          <button
            onClick={() => setFeedTab('trending')}
            className={`py-2.5 px-1 text-xs sm:text-sm transition-all cursor-pointer select-none ${
              feedTab === 'trending'
                ? 'border-b-2 border-accent text-accent font-bold'
                : 'border-b-2 border-transparent text-muted hover:text-primary font-medium'
            }`}
          >
            Trending
          </button>

          <button
            onClick={() => {
              if (!user) {
                requireAuth('view posts from students you follow');
                return;
              }
              setFeedTab('following');
            }}
            className={`py-2.5 px-1 text-xs sm:text-sm transition-all cursor-pointer select-none ${
              feedTab === 'following'
                ? 'border-b-2 border-accent text-accent font-bold'
                : 'border-b-2 border-transparent text-muted hover:text-primary font-medium'
            }`}
          >
            Following
          </button>
        </div>

        <Link
          to="/search"
          className="text-xs text-muted hover:text-accent font-medium transition-colors shrink-0"
        >
          Full Search →
        </Link>
      </div>

      {/* ── Posts Stream (10 at a time, skeleton loaders, Facebook style) ── */}
      <div className="boardly-feed-container w-full max-w-full min-w-0 box-border overflow-x-hidden space-y-3 pt-1 pb-[calc(112px+env(safe-area-inset-bottom,0px))]">
        {loading && displayedPosts.length === 0 ? (
          <LineLoader context="dashboard" variant="section" />
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
        ) : displayedPosts.length === 0 ? (
          /* Empty state */
          <div className="p-10 text-center rounded-2xl border border-border bg-surface space-y-3 shadow-xs">
            <BookOpen size={32} className="mx-auto text-muted" />
            <h3 className="text-sm font-bold text-primary">
              {feedTab === 'following'
                ? "You aren't following anyone yet."
                : 'No posts matching your filter'}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              {feedTab === 'following'
                ? 'Follow people to see their posts here.'
                : 'Be the first to share notes, papers, or ask a doubt to learn together!'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {feedTab === 'following' || subjectFilter !== 'all' || classFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setFeedTab('all');
                    setSubjectFilter('all');
                    setClassFilter('all');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                >
                  <Compass size={14} />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <button
                  onClick={() => openComposerWithGate({ initialStep: 1 })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Share something</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Real Firestore posts */
          displayedPosts.map((post) => (
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

        {loadingMore && (
          <div className="py-4">
            <LineLoader
              variant="inline"
              context="generic"
              message="Loading more posts..."
            />
          </div>
        )}
      </div>

      {/* ── Floating "Back to top" Chip (Positioned above mobile bottom nav so they never overlap) ── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-[calc(96px+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 sm:right-8 z-30 px-3.5 py-2 rounded-full floating-blur backdrop-blur-lg border border-border text-primary shadow-lg text-xs font-semibold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
            photoURL: null,
            equippedAvatar:
              profile?.equipped?.avatar ||
              (profile as any)?.avatar ||
              (profile as any)?.equippedAvatar ||
              null,
            frame: profile?.equipped?.frame || (profile as any)?.frame || null,
            avatarUrl: null,
            role: profile?.role || 'Student',
            customRole: (profile as any)?.customRole || null,
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
                photoURL: null,
                equippedAvatar:
                  profile?.equipped?.avatar ||
                  (profile as any)?.avatar ||
                  (profile as any)?.equippedAvatar,
                frame: profile?.equipped?.frame || (profile as any)?.frame,
                avatarUrl: null,
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
        onSelectPost={(post: CommonsPost) => {
          setSearchModalOpen(false);
          navigate(`/commons/post/${buildEntitySlug(post.id, post.title)}`);
        }}
        onOpenComments={(p: CommonsPost) => {
          setSearchModalOpen(false);
          setCommentsPost(p);
        }}
        onOpenReport={(p: CommonsPost) => {
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
