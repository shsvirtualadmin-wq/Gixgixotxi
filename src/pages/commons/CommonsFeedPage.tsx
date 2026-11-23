import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { FeedPostSkeletonList, FeedPostSkeletonCard } from '@/components/ui/Skeleton';
import {
  fetchCommonsPosts,
  getInitialCachedCommonsFeed,
  deleteCommonsPost,
  sortCommonsPosts,
  fetchCommonsPostById,
} from '@/services/commonsService';
import { getCachedFollowingIds, getFollowingIds } from '@/services/followService';
import type { CommonsPost, CommonsPostType } from '@/types/commons';
import { Link, useSearchParams, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { buildEntitySlug } from '@/utils/privacy';
import { AdSlot } from '@/components/AdSlot';
import { useAdsConfig } from '@/services/adsConfigService';

// Per-tab feed keys for isolated All / Trending / Following state
type FeedTabKey = 'all' | 'trending' | 'following';

function rankTrendingPosts(list: CommonsPost[]): CommonsPost[] {
  if (list.length <= 1) return [...list];
  const now = Date.now();
  return [...list].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const rawACreated = (a as any).createdAt;
    const rawBCreated = (b as any).createdAt;
    const aCreated =
      typeof rawACreated === 'number'
        ? rawACreated
        : typeof rawACreated?.toMillis === 'function'
        ? rawACreated.toMillis()
        : typeof rawACreated === 'string'
        ? Date.parse(rawACreated) || 0
        : 0;
    const bCreated =
      typeof rawBCreated === 'number'
        ? rawBCreated
        : typeof rawBCreated?.toMillis === 'function'
        ? rawBCreated.toMillis()
        : typeof rawBCreated === 'string'
        ? Date.parse(rawBCreated) || 0
        : 0;
    const aAgeDays = Math.max(0, (now - aCreated) / (24 * 60 * 60 * 1000));
    const bAgeDays = Math.max(0, (now - bCreated) / (24 * 60 * 60 * 1000));
    const aScore =
      (a.upvotes || 0) * 3 + (a.commentCount || 0) * 2 + Math.max(0, 14 - aAgeDays) * 0.25;
    const bScore =
      (b.upvotes || 0) * 3 + (b.commentCount || 0) * 2 + Math.max(0, 14 - bAgeDays) * 0.25;
    if (Math.abs(bScore - aScore) > 0.01) return bScore - aScore;
    return bCreated - aCreated;
  });
}

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
  const { isAdmin, isGuest } = useAuth();
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

  const isGuestOrAnon = Boolean(!user || isGuest || user.uid.startsWith('guest_'));

  // Derive URL Feed Tab ("all" | "trending" | "following") and keep synchronous state so tab switches happen in the same render
  const urlFeedTab: FeedTabKey =
    location.pathname.endsWith('/trending') || searchParams.get('tab') === 'trending'
      ? 'trending'
      : location.pathname.endsWith('/following') || searchParams.get('tab') === 'following'
      ? 'following'
      : 'all';

  const [feedTab, setFeedTabState] = useState<FeedTabKey>(urlFeedTab);
  useEffect(() => {
    setFeedTabState(urlFeedTab);
  }, [urlFeedTab]);

  // Support legacy/query-based shared links (/commons?post=<id>) by redirecting to the canonical post detail page
  useEffect(() => {
    const sharedPostId = searchParams.get('post');
    if (sharedPostId && sharedPostId.trim()) {
      navigate(`${baseCommonsPath}/post/${encodeURIComponent(sharedPostId.trim())}`, { replace: true });
    }
  }, [searchParams, baseCommonsPath, navigate]);

  const normalizedRouteSubj = (routeSubject || '').toLowerCase();
  const subjectFilter =
    normalizedRouteSubj === 'computer-science'
      ? 'computer'
      : normalizedRouteSubj || searchParams.get('subject') || 'all';
  const classFilter = searchParams.get('class') || 'all';

  const setFeedTab = useCallback(
    (nextTab: FeedTabKey) => {
      // Switch to the new tab's own list in the same render before router navigation completes
      setFeedTabState(nextTab);
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

  // Segmented control liquid stretch state
  const [segStretching, setSegStretching] = useState(false);
  const triggerSegStretch = useCallback(() => {
    setSegStretching(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        setSegStretching(true);
        window.setTimeout(() => setSegStretching(false), 475);
      });
    }
  }, []);
  const feedTabIndex = feedTab === 'all' ? 0 : feedTab === 'trending' ? 1 : 2;

  // Synchronous cache for user's following list so Following tab can decide immediately before any query
  const [followingIds, setFollowingIds] = useState<string[] | null>(() => {
    if (isGuestOrAnon || !user?.uid) return [];
    return getCachedFollowingIds(user.uid);
  });

  useEffect(() => {
    if (isGuestOrAnon || !user?.uid) {
      setFollowingIds([]);
      return;
    }
    const cached = getCachedFollowingIds(user.uid);
    if (cached !== null) {
      setFollowingIds(cached);
    } else {
      setFollowingIds(null);
    }
    let cancelled = false;
    void getFollowingIds(user.uid)
      .then((ids) => {
        if (!cancelled) {
          setFollowingIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFollowingIds((prev) => prev ?? []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isGuestOrAnon, user?.uid]);

  // Separate posts state, loading flag, loaded flag, pagination, and error per tab: all, trending, following
  const initialAllCached = useMemo(
    () => getInitialCachedCommonsFeed('all', user?.uid),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [postsByTab, setPostsByTab] = useState<Record<FeedTabKey, CommonsPost[]>>(() => {
    const allSeed = initialAllCached?.posts ? sortCommonsPosts(initialAllCached.posts) : [];
    const trendingSeed = allSeed.length > 0 ? rankTrendingPosts(allSeed) : [];
    return {
      all: allSeed,
      trending: trendingSeed,
      following: [],
    };
  });

  const [loadingByTab, setLoadingByTab] = useState<Record<FeedTabKey, boolean>>(() => ({
    all: !initialAllCached || initialAllCached.posts.length === 0,
    trending: !initialAllCached || initialAllCached.posts.length === 0,
    following: !isGuestOrAnon && followingIds === null,
  }));

  const [loadedByTab, setLoadedByTab] = useState<Record<FeedTabKey, boolean>>(() => ({
    all: Boolean(initialAllCached && initialAllCached.posts.length > 0),
    trending: Boolean(initialAllCached && initialAllCached.posts.length > 0),
    following: isGuestOrAnon || (followingIds !== null && followingIds.length === 0),
  }));

  const [loadErrorByTab, setLoadErrorByTab] = useState<Record<FeedTabKey, string | null>>({
    all: null,
    trending: null,
    following: null,
  });

  const [hasMoreByTab, setHasMoreByTab] = useState<Record<FeedTabKey, boolean>>(() => ({
    all: Boolean(initialAllCached?.hasMore),
    trending: Boolean(initialAllCached?.hasMore),
    following: false,
  }));

  const [lastDocByTab, setLastDocByTab] = useState<Record<FeedTabKey, any>>(() => ({
    all: initialAllCached?.lastDoc ?? null,
    trending: initialAllCached?.lastDoc ?? null,
    following: null,
  }));

  const [loadingMoreByTab, setLoadingMoreByTab] = useState<Record<FeedTabKey, boolean>>({
    all: false,
    trending: false,
    following: false,
  });

  const [backendMode, setBackendMode] = useState<'cloudflare-d1-r2' | 'preview-demo' | null>(
    () => initialAllCached?.backendMode || null
  );
  const unreadNotifCount = useUnreadNotificationsCount();
  const recentCreatedPostRef = useRef<CommonsPost | null>(null);

  // Per-tab request IDs to prevent race conditions when switching tabs rapidly
  const requestIdByTabRef = useRef<Record<FeedTabKey, number>>({
    all: 0,
    trending: 0,
    following: 0,
  });

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

  const loadPosts = useCallback(
    async (forceLoadingState = false, tabToLoad: FeedTabKey = feedTab) => {
      const reqId = ++requestIdByTabRef.current[tabToLoad];

      // 1. FOLLOWING TAB: Decide from the user's following list BEFORE running any feed query
      if (tabToLoad === 'following') {
        if (isGuestOrAnon || !user?.uid) {
          setPostsByTab((prev) => ({ ...prev, following: [] }));
          setLoadingByTab((prev) => ({ ...prev, following: false }));
          setLoadedByTab((prev) => ({ ...prev, following: true }));
          setHasMoreByTab((prev) => ({ ...prev, following: false }));
          setLastDocByTab((prev) => ({ ...prev, following: null }));
          setLoadErrorByTab((prev) => ({ ...prev, following: null }));
          return;
        }

        const syncFollowing = getCachedFollowingIds(user.uid);
        if (syncFollowing !== null && syncFollowing.length === 0 && !forceLoadingState) {
          setFollowingIds([]);
          setPostsByTab((prev) => ({ ...prev, following: [] }));
          setLoadingByTab((prev) => ({ ...prev, following: false }));
          setLoadedByTab((prev) => ({ ...prev, following: true }));
          setHasMoreByTab((prev) => ({ ...prev, following: false }));
          setLastDocByTab((prev) => ({ ...prev, following: null }));
          setLoadErrorByTab((prev) => ({ ...prev, following: null }));
          // Refresh following list in background in case user recently followed someone
          void getFollowingIds(user.uid, 200, { forceRefresh: true }).then((freshIds) => {
            if (requestIdByTabRef.current.following !== reqId) return;
            if (freshIds.length > 0) {
              setFollowingIds(freshIds);
            }
          });
          return;
        }

        if (syncFollowing === null || forceLoadingState) {
          setLoadingByTab((prev) => ({ ...prev, following: true }));
        }
        setLoadErrorByTab((prev) => ({ ...prev, following: null }));

        try {
          const resolvedFollowingIds =
            syncFollowing !== null && !forceLoadingState
              ? syncFollowing
              : await getFollowingIds(user.uid, 200, { forceRefresh: forceLoadingState });

          if (requestIdByTabRef.current.following !== reqId) return;
          setFollowingIds(resolvedFollowingIds);

          if (resolvedFollowingIds.length === 0) {
            setPostsByTab((prev) => ({ ...prev, following: [] }));
            setLoadingByTab((prev) => ({ ...prev, following: false }));
            setLoadedByTab((prev) => ({ ...prev, following: true }));
            setHasMoreByTab((prev) => ({ ...prev, following: false }));
            setLastDocByTab((prev) => ({ ...prev, following: null }));
            return;
          }

          const followingSet = new Set(resolvedFollowingIds.map((id) => String(id).trim()));
          const res = await fetchCommonsPosts({
            feedTab: 'following',
            followingUids: resolvedFollowingIds,
            subject: subjectFilter !== 'all' ? subjectFilter : undefined,
            pageSize: 20,
            currentUid: user.uid,
          });

          if (requestIdByTabRef.current.following !== reqId) return;

          // Client-side filter again: Following shows ONLY posts whose authorUid is in followingSet
          const strictlyFiltered = res.posts.filter(
            (p) => !p.isAnonymous && Boolean(p.authorUid) && followingSet.has(String(p.authorUid))
          );

          setPostsByTab((prev) => ({
            ...prev,
            following: sortCommonsPosts(strictlyFiltered),
          }));
          setLastDocByTab((prev) => ({ ...prev, following: res.lastDoc }));
          setHasMoreByTab((prev) => ({ ...prev, following: res.hasMore }));
          setLoadedByTab((prev) => ({ ...prev, following: true }));
          setBackendMode(res.backendMode || 'cloudflare-d1-r2');
        } catch (err: unknown) {
          if (requestIdByTabRef.current.following !== reqId) return;
          console.warn('[CommonsFeedPage] following fetch error:', err);
          const msg = err instanceof Error ? err.message : 'Could not load posts';
          setPostsByTab((prev) => {
            if (prev.following.length === 0) {
              setLoadErrorByTab((ePrev) => ({ ...ePrev, following: msg }));
              setLastDocByTab((dPrev) => ({ ...dPrev, following: null }));
              setHasMoreByTab((hPrev) => ({ ...hPrev, following: false }));
            }
            return prev;
          });
        } finally {
          if (requestIdByTabRef.current.following === reqId) {
            setLoadingByTab((prev) => ({ ...prev, following: false }));
            setLoadedByTab((prev) => ({ ...prev, following: true }));
          }
        }
        return;
      }

      // 2. ALL or TRENDING TAB
      const cachedNow = getInitialCachedCommonsFeed('all', user?.uid);
      if (cachedNow && cachedNow.posts.length > 0 && !forceLoadingState) {
        setPostsByTab((prev) => {
          if (prev[tabToLoad].length > 0) return prev;
          const nextList =
            tabToLoad === 'trending'
              ? rankTrendingPosts(cachedNow.posts)
              : sortCommonsPosts(cachedNow.posts);
          return { ...prev, [tabToLoad]: nextList };
        });
        setLastDocByTab((prev) => ({
          ...prev,
          [tabToLoad]: prev[tabToLoad] !== null ? prev[tabToLoad] : cachedNow.lastDoc,
        }));
        setHasMoreByTab((prev) => ({
          ...prev,
          [tabToLoad]: prev[tabToLoad] ? prev[tabToLoad] : cachedNow.hasMore,
        }));
        setLoadingByTab((prev) => ({ ...prev, [tabToLoad]: false }));
        setLoadedByTab((prev) => ({ ...prev, [tabToLoad]: true }));
      } else {
        setLoadingByTab((prev) => ({ ...prev, [tabToLoad]: true }));
      }
      setLoadErrorByTab((prev) => ({ ...prev, [tabToLoad]: null }));

      try {
        const isFiltered = subjectFilter !== 'all' || classFilter !== 'all';
        const [targetPost, res] = await Promise.all([
          targetPostId && tabToLoad === 'all'
            ? fetchCommonsPostById(targetPostId)
            : Promise.resolve(null),
          fetchCommonsPosts({
            feedTab: tabToLoad,
            sortBy: tabToLoad === 'trending' ? 'trending' : 'newest',
            subject: subjectFilter !== 'all' ? subjectFilter : undefined,
            pageSize: isFiltered || tabToLoad === 'trending' ? 40 : 15,
            currentUid: user?.uid,
          }),
        ]);

        if (requestIdByTabRef.current[tabToLoad] !== reqId) return;

        let combined = res.posts;
        if (
          tabToLoad === 'all' &&
          targetPost &&
          !combined.some((p) => p.id === targetPost.id)
        ) {
          combined = [targetPost, ...combined];
        }
        if (
          recentCreatedPostRef.current &&
          !combined.some((p) => p.id === recentCreatedPostRef.current!.id)
        ) {
          combined = [recentCreatedPostRef.current, ...combined];
        }

        const ordered =
          tabToLoad === 'trending' ? rankTrendingPosts(combined) : sortCommonsPosts(combined);

        setPostsByTab((prev) => ({
          ...prev,
          [tabToLoad]: ordered,
        }));
        setLastDocByTab((prev) => ({ ...prev, [tabToLoad]: res.lastDoc }));
        setHasMoreByTab((prev) => ({ ...prev, [tabToLoad]: res.hasMore }));
        setLoadedByTab((prev) => ({ ...prev, [tabToLoad]: true }));
        setBackendMode(res.backendMode || 'cloudflare-d1-r2');
      } catch (err: unknown) {
        if (requestIdByTabRef.current[tabToLoad] !== reqId) return;
        console.warn('[CommonsFeedPage] fetch error:', err);
        const msg = err instanceof Error ? err.message : 'Could not load community posts';
        setPostsByTab((prev) => {
          if (prev[tabToLoad].length === 0) {
            setLoadErrorByTab((ePrev) => ({ ...ePrev, [tabToLoad]: msg }));
            setLastDocByTab((dPrev) => ({ ...dPrev, [tabToLoad]: null }));
            setHasMoreByTab((hPrev) => ({ ...hPrev, [tabToLoad]: false }));
          }
          return prev;
        });
      } finally {
        if (requestIdByTabRef.current[tabToLoad] === reqId) {
          setLoadingByTab((prev) => ({ ...prev, [tabToLoad]: false }));
          setLoadedByTab((prev) => ({ ...prev, [tabToLoad]: true }));
        }
      }
    },
    [feedTab, isGuestOrAnon, user?.uid, targetPostId, subjectFilter, classFilter]
  );

  useEffect(() => {
    void loadPosts(false, feedTab);
  }, [loadPosts, feedTab, followingIds?.length]);

  const activePosts = postsByTab[feedTab];
  const loading = loadingByTab[feedTab] || !loadedByTab[feedTab];
  const loadError = loadErrorByTab[feedTab];
  const hasMore = hasMoreByTab[feedTab];
  const lastDoc = lastDocByTab[feedTab];
  const loadingMore = loadingMoreByTab[feedTab];

  const handleLoadMore = useCallback(async () => {
    const activeTab = feedTab;
    const currentLastDoc = lastDocByTab[activeTab];
    if (currentLastDoc === null || currentLastDoc === undefined || loadingMoreByTab[activeTab]) {
      return;
    }
    if (activeTab === 'following' && (!followingIds || followingIds.length === 0)) {
      return;
    }
    const reqId = requestIdByTabRef.current[activeTab];
    setLoadingMoreByTab((prev) => ({ ...prev, [activeTab]: true }));
    try {
      const res = await fetchCommonsPosts({
        feedTab: activeTab,
        sortBy: activeTab === 'trending' ? 'trending' : 'newest',
        followingUids: activeTab === 'following' ? followingIds || [] : undefined,
        subject: subjectFilter !== 'all' ? subjectFilter : undefined,
        lastDoc: currentLastDoc,
        pageSize: activeTab === 'following' ? 20 : 15,
        currentUid: user?.uid,
      });
      if (requestIdByTabRef.current[activeTab] !== reqId) return;

      const followingSet =
        activeTab === 'following' ? new Set((followingIds || []).map((id) => String(id).trim())) : null;

      setPostsByTab((prev) => {
        const currentList = prev[activeTab];
        const existingIds = new Set(currentList.map((p) => p.id));
        let newPosts = res.posts.filter((p) => !existingIds.has(p.id));
        if (followingSet) {
          newPosts = newPosts.filter(
            (p) => !p.isAnonymous && Boolean(p.authorUid) && followingSet.has(String(p.authorUid))
          );
        }
        const merged = [...currentList, ...newPosts];
        return {
          ...prev,
          [activeTab]:
            activeTab === 'trending' ? rankTrendingPosts(merged) : sortCommonsPosts(merged),
        };
      });
      setLastDocByTab((prev) => ({ ...prev, [activeTab]: res.lastDoc }));
      setHasMoreByTab((prev) => ({ ...prev, [activeTab]: res.hasMore }));
    } catch (err: unknown) {
      console.warn('[CommonsFeedPage] load more notice:', err);
    } finally {
      setLoadingMoreByTab((prev) => ({ ...prev, [activeTab]: false }));
    }
  }, [feedTab, lastDocByTab, loadingMoreByTab, followingIds, user?.uid, subjectFilter]);

  const { config: adsConfig } = useAdsConfig();
  const commonsFeedEveryN = Math.max(2, adsConfig.slots.commons_feed?.everyN || 5);
  const displayedPosts = useMemo(() => {
    // Strictly read only the active tab's own list; never show another tab's posts
    if (feedTab === 'following') {
      if (isGuestOrAnon || !followingIds || followingIds.length === 0) {
        return [];
      }
    }
    let list = [...activePosts];
    if (feedTab === 'following') {
      const followingSet = new Set((followingIds || []).map((id) => String(id).trim()));
      list = list.filter(
        (p) => !p.isAnonymous && Boolean(p.authorUid) && followingSet.has(String(p.authorUid))
      );
    }
    if (subjectFilter !== 'all') {
      const sf = subjectFilter.toLowerCase();
      list = list.filter((p) => {
        const sub = (p.subject || '').toLowerCase();
        return (
          sub.includes(sf) ||
          (sf === 'computer' && sub.includes('computer')) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(sf))
        );
      });
    }
    if (classFilter !== 'all') {
      const cf = classFilter.toLowerCase();
      list = list.filter((p) => {
        const rawClass = String(p.classLevel || '').replace(/^Class\s+/i, '').trim().toLowerCase();
        const hay = `${p.target || ''} ${p.classLevel || ''} ${p.board || ''} ${p.chapter || ''} ${p.title || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (cf === 'fbise') {
          return hay.includes('fbise') || hay.includes('federal');
        }
        if (cf === 'ecat') {
          return hay.includes('ecat') || hay.includes('net') || hay.includes('nust') || hay.includes('fast') || hay.includes('engineering') || String(p.subject || '').toLowerCase() === 'mathematics';
        }
        if (cf === 'punjab') {
          return hay.includes('punjab') || hay.includes('lahore') || hay.includes('bise') || hay.includes('general');
        }
        if (cf === 'class 9' || cf === '9') {
          return rawClass === '9' || hay.includes('class 9') || hay.includes('ssc-i');
        }
        if (cf === 'class 10' || cf === '10') {
          return rawClass === '10' || hay.includes('class 10') || hay.includes('ssc-ii');
        }
        if (cf === '11' || cf === 'class 11') {
          return rawClass === '11' || hay.includes('class 11') || hay.includes('hssc-i');
        }
        if (cf === '12' || cf === 'class 12') {
          return rawClass === '12' || hay.includes('class 12') || hay.includes('hssc-ii') || hay.includes('mdcat');
        }
        return hay.includes(cf);
      });
    }
    if (feedTab === 'trending') {
      list = rankTrendingPosts(list);
    }
    return list;
  }, [activePosts, feedTab, isGuestOrAnon, followingIds, subjectFilter, classFilter]);

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
      { rootMargin: '1200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  // Mobile pull-to-refresh touch handlers (never interfere with normal downward scrolling)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    } else {
      setIsPulling(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    if (window.scrollY > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff <= 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(diff * 0.4, 75));
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      if (pullDistance > 55) {
        void loadPosts(true, feedTab);
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
        setPostsByTab((prev) => ({
          ...prev,
          all: sortCommonsPosts([
            optimisticPost,
            ...prev.all.filter((p) => p.id !== optimisticPost.id),
          ]),
          trending: rankTrendingPosts([
            optimisticPost,
            ...prev.trending.filter((p) => p.id !== optimisticPost.id),
          ]),
        }));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void loadPosts(false, 'all');
    },
    [loadPosts, setClassFilter, setFeedTab, setSubjectFilter]
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        await deleteCommonsPost(postId, user.uid, isAdmin);
        setPostsByTab((prev) => ({
          all: prev.all.filter((p) => p.id !== postId),
          trending: prev.trending.filter((p) => p.id !== postId),
          following: prev.following.filter((p) => p.id !== postId),
        }));
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
      data-student-page="commons"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="boardly-feed-container w-full max-w-2xl min-w-0 box-border overflow-x-clip mx-auto space-y-3 pb-[calc(96px+env(safe-area-inset-bottom,0px))]"
    >
      {isPublicRoute && (
        <PageMeta
          title="Boardly Commons — Free Student Notes, Solved Past Papers & Doubts"
          description="Browse free peer-shared study notes, solved board past papers, formula sheets, and entrance test Q&A across Mathematics, Physics, Chemistry, Biology, and Computer Science."
          canonicalPath="/commons"
        />
      )}

      {/* ── Floating Glass Top Bar: "Commons", Search, Material Library, Guidelines, Refresh ── */}
      <header className="sticky top-2 z-30 glass glass-card allow-backdrop-blur rounded-[30px] px-4 sm:px-5 py-3 flex items-center justify-between gap-2.5 w-full max-w-full min-w-0 box-border overflow-x-clip transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#D71921] shadow-[0_0_10px_#D71921] shrink-0"
              aria-hidden="true"
            />
            <h1
              className="text-lg sm:text-xl tracking-tight text-primary truncate"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              Boardly Commons
            </h1>
          </div>
          <p className="text-xs text-muted truncate mt-0.5">
            Share notes, papers and doubts. Learn together.
          </p>
        </div>

        {/* Right Action Icons: Material Library, Search, Guidelines, Notifications, Refresh (all >= 44px circular glass buttons) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/material"
            className="ios-circle-btn text-secondary hover:text-primary"
            title="Study Material Library"
            aria-label="Study Material Library"
          >
            <FolderOpen size={18} />
          </Link>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="ios-circle-btn text-secondary hover:text-primary cursor-pointer"
            title="Search Commons"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <Link
            to="/guidelines"
            className="ios-circle-btn text-secondary hover:text-primary"
            title="Community Guidelines"
            aria-label="Guidelines"
          >
            <Shield size={18} />
          </Link>

          <Link
            to="/dashboard/notifications"
            className="relative ios-circle-btn text-secondary hover:text-primary"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D71921] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => loadPosts()}
            disabled={loading}
            className="ios-circle-btn text-secondary hover:text-primary cursor-pointer"
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
          <RefreshCw
            size={18}
            className={`text-accent transition-transform ${pullDistance > 55 ? 'rotate-180 scale-110' : ''}`}
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

        <div className="dotted-divider my-1" aria-hidden="true" />

        {/* Quick action buttons row: Photo, File, Doubt, Anonymous */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 w-full max-w-full min-w-0">
          <button
            type="button"
            onClick={() =>
              openComposerWithGate({
                initialStep: 2,
                triggerUploadOnMount: 'photo',
              })
            }
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
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
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
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
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
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
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-[11px] sm:text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <EyeOff size={15} className="text-purple-500 shrink-0" />
            <span className="truncate">Anonymous</span>
          </button>
        </div>
      </div>

      {backendMode === 'preview-demo' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 w-full max-w-full min-w-0 box-border">
          <span className="font-semibold min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">
            Preview Mode — Showing sample community posts while live cloud storage is offline.
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

      {/* ── Segmented Control in a Glass Track: "All", "Trending", and "Following" ── */}
      <div className="sticky top-[68px] z-20 flex items-center justify-between gap-2 w-full max-w-full min-w-0 box-border">
        <div
          role="tablist"
          aria-label="Commons feed filter"
          className="ios-seg-track flex-1 grid grid-cols-3 items-center"
        >
          <div
            aria-hidden="true"
            className="ios-seg-thumb"
            style={{
              width: 'calc((100% - 8px) / 3)',
              transform: `translate3d(${feedTabIndex * 100}%, 0, 0)`,
            }}
          >
            <div className={`ios-seg-thumb-inner ${segStretching ? 'is-stretching' : ''}`} />
          </div>

          <button
            type="button"
            role="tab"
            aria-selected={feedTab === 'all'}
            onClick={() => {
              if (feedTab !== 'all') triggerSegStretch();
              setFeedTab('all');
            }}
            className={`ios-seg-btn ${feedTab === 'all' ? 'is-active' : ''}`}
          >
            All
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={feedTab === 'trending'}
            onClick={() => {
              if (feedTab !== 'trending') triggerSegStretch();
              setFeedTab('trending');
            }}
            className={`ios-seg-btn ${feedTab === 'trending' ? 'is-active' : ''}`}
          >
            Trending
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={feedTab === 'following'}
            onClick={() => {
              if (feedTab !== 'following') triggerSegStretch();
              setFeedTab('following');
            }}
            className={`ios-seg-btn ${feedTab === 'following' ? 'is-active' : ''}`}
          >
            Following
          </button>
        </div>

        <Link
          to="/search"
          className="px-3.5 min-h-[44px] rounded-full glass-pill inline-flex items-center justify-center text-xs text-muted hover:text-primary font-semibold transition-colors shrink-0"
        >
          Search →
        </Link>
      </div>

      {/* ── Posts Stream (15 at a time, staggered entry, Facebook-style post skeletons) ── */}
      <div className="boardly-feed-container stagger-list w-full max-w-full min-w-0 box-border overflow-x-clip space-y-3 pt-1 pb-[var(--sdn-page-pb)]">
        {loading && displayedPosts.length === 0 ? (
          <FeedPostSkeletonList count={3} />
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
              onClick={() => void loadPosts(true, feedTab)}
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
                ? isGuestOrAnon
                  ? 'Sign in to follow people'
                  : !followingIds || followingIds.length === 0
                  ? "You're not following anyone yet"
                  : 'No posts from people you follow yet'
                : subjectFilter !== 'all' || classFilter !== 'all'
                ? 'No posts matching your filter'
                : 'No posts yet'}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              {feedTab === 'following'
                ? isGuestOrAnon
                  ? 'Sign in to follow students and educators and see their posts here.'
                  : !followingIds || followingIds.length === 0
                  ? 'Follow people to see their posts here.'
                  : subjectFilter !== 'all' || classFilter !== 'all'
                  ? 'No posts from people you follow match your current filter.'
                  : 'When people you follow share notes, papers, or questions, their posts will appear here.'
                : 'Be the first to share notes, papers, or ask a doubt to learn together!'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {feedTab === 'following' ? (
                isGuestOrAnon ? (
                  <button
                    type="button"
                    onClick={() => requireAuth('view posts from students you follow')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Sign in</span>
                  </button>
                ) : !followingIds || followingIds.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setFeedTab('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                  >
                    <Compass size={14} />
                    <span>Find people to follow</span>
                  </button>
                ) : subjectFilter !== 'all' || classFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
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
                    type="button"
                    onClick={() => setFeedTab('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-on-accent hover:opacity-90 transition-colors cursor-pointer shadow-xs"
                  >
                    <Compass size={14} />
                    <span>Explore All Posts</span>
                  </button>
                )
              ) : subjectFilter !== 'all' || classFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
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
                  type="button"
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
          displayedPosts.map((post, postIdx) => (
            <Fragment key={post.id}>
              <CommonsPostCard
                post={post}
                currentUserId={user?.uid}
                isAdmin={isAdmin}
                onOpenComments={handleOpenComments}
                onOpenReport={handleOpenReport}
                onDeletePost={handleDeletePost}
                onAuthorClick={handleAuthorClick}
              />
              {(postIdx + 1) % commonsFeedEveryN === 0 && (
                <AdSlot
                  slotId="commons_feed"
                  instanceKey={`commons-${postIdx}`}
                  wrapperClassName="my-5 sm:my-6"
                />
              )}
            </Fragment>
          ))
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-6 w-full" />}

        {loadingMore && (
          <div className="py-2">
            <FeedPostSkeletonCard withAttachment={false} />
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
        posts={postsByTab.all}
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
