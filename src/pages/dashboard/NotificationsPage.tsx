import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Megaphone,
  UserPlus,
  FileText,
  Sparkles,
  Inbox,
  Pin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Coins,
  Award,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  subscribeToNotificationStore,
  getNotificationStoreSnapshot,
  syncUserNotificationsStore,
  fetchUserNotificationsPage,
  markNotificationAsRead,
  markAnnouncementAsRead,
  markAllNotificationsAsRead,
  WELCOME_ANNOUNCEMENT_ID,
  toMillis,
  sanitizeNotificationText,
  normalizeNotificationType,
  type AppNotification,
} from '@/services/notificationService';
import { resolveNotificationDestination } from '@/utils/routes';
import type { DocumentSnapshot } from 'firebase/firestore';

type FilterType = 'all' | 'following' | 'announcements' | 'rewards';
type DateGroupKey = 'Today' | 'Yesterday' | 'This week' | 'Earlier';
type DisplayCategory = 'follower' | 'post' | 'announcement' | 'reward' | 'crew' | 'system';

const INITIAL_VISIBLE_COUNT = 20;
const BATCH_INCREMENT = 20;

/**
 * Formats timestamps consistently:
 * - Recent items (< 7 days): relative time ("Just now", "31m ago", "12h ago", "5d ago")
 * - Older items (>= 7 days): short date ("Oct 20")
 */
function formatNotificationTime(val: unknown): string {
  const ms = toMillis(val as Parameters<typeof toMillis>[0]);
  if (!ms || ms <= 0) return 'Recently';

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - ms) / 1000));

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const currentYear = new Date().getFullYear();
  if (date.getFullYear() !== currentYear) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isPinnedNotification(notif: AppNotification): boolean {
  return Boolean(
    notif.isPinned ||
      notif.id === WELCOME_ANNOUNCEMENT_ID ||
      notif.announcementId === WELCOME_ANNOUNCEMENT_ID
  );
}

/**
 * Groups notifications strictly by their real createdAt timestamp in the user's local time:
 * Today, Yesterday, This week, and Earlier.
 */
function resolveDateGroup(notif: AppNotification): DateGroupKey {
  const ms = toMillis(notif.createdAt);
  if (!ms || ms <= 0) return 'Earlier';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfThisWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  if (ms >= startOfToday) return 'Today';
  if (ms >= startOfYesterday) return 'Yesterday';
  if (ms >= startOfThisWeek) return 'This week';
  return 'Earlier';
}

function resolveDisplayCategory(notif: AppNotification): DisplayCategory {
  if (notif.isAnnouncement || notif.type === 'announcement') {
    return 'announcement';
  }
  const normalized = normalizeNotificationType(
    notif.type,
    notif.isAnnouncement,
    notif.title,
    notif.message,
    notif.link,
    notif.postId
  );
  if (normalized === 'new_follower' || normalized === 'follow') return 'follower';
  if (normalized === 'reward') return 'reward';
  if (normalized === 'crew') return 'crew';
  if (
    normalized === 'following_post' ||
    normalized === 'comment' ||
    normalized === 'like'
  ) {
    return 'post';
  }
  return 'system';
}

/**
 * Strips raw markdown / WhatsApp formatting characters (*bold*, **bold**, _italic_, ~strike~, # headings)
 * and raw URLs from preview text so cards stay clean and readable.
 */
function stripFormattingAndLinks(raw: string, preserveNewlines = false): string {
  if (!raw) return '';
  let text = sanitizeNotificationText(raw);

  // Convert markdown links [label](https://...) -> label
  text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]+\)/gi, '$1');

  // Remove standalone raw URLs
  text = text.replace(/https?:\/\/[^\s)]+/gi, '');
  text = text.replace(/\bwww\.[^\s)]+/gi, '');

  // Strip markdown/WhatsApp formatting markers while keeping inner text
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*\n]+)\*/g, '$1');
  text = text.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?:;])/g, '$1$2');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/~([^~\n]+)~/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Strip leading markdown heading or blockquote markers
  text = text.replace(/^\s*#{1,6}\s+/gm, '');
  text = text.replace(/^\s*>\s+/gm, '');

  // Strip stray leading/trailing asterisks or underscores
  text = text.replace(/^\*+|\*+$/g, '').trim();

  if (preserveNewlines) {
    return text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Formats the notification heading and body preview so that:
 * 1. "Congratulations undefined!" is fixed.
 * 2. Raw markdown (*IMPORTANT*) and raw links are stripped from the preview.
 * 3. Repeated titles (e.g. "IMPORTANT" as the heading and "IMPORTANT Russian Open Doors Scholarship..." below it)
 *    are deduplicated into a single clean heading + body preview.
 */
function formatHeadingAndPreview(notif: AppNotification): {
  heading: string;
  preview: string;
  expandedBody: string;
} {
  const rawTitle = sanitizeNotificationText(notif.title, notif.authorName);
  const rawMessage = sanitizeNotificationText(notif.message, notif.authorName);

  let heading = stripFormattingAndLinks(rawTitle, false);
  let preview = stripFormattingAndLinks(rawMessage, false);
  const expandedBody = stripFormattingAndLinks(rawMessage, true);

  if (!heading && preview) {
    heading = preview;
    preview = '';
  }

  // Check if heading is of the form "Author posted: <PostTitle>" or just "<PostTitle>"
  const postedMatch = heading.match(/^(.+?\s+posted:\s*)(.+)$/i);
  const authorPrefix = postedMatch ? postedMatch[1] : '';
  const coreTitle = (postedMatch ? postedMatch[2] : heading).trim();

  if (coreTitle && preview) {
    const escapedCore = coreTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = new RegExp(`^${escapedCore}(?:\\s*[:\\-–—.|!]+\\s*|\\s+|$)`, 'i');

    if (prefixRegex.test(preview)) {
      const remainder = preview.replace(prefixRegex, '').trim();

      // If coreTitle was just a 1-word label like "IMPORTANT" or "URGENT", promote the first phrase of remainder into the heading
      if (coreTitle.split(/\s+/).length <= 1 && remainder.length > 0) {
        const firstSentenceMatch = remainder.match(/^([^.!?\n]{8,72})(?:[.!?]\s+|\s+-\s+|\s+—\s+|$)(.*)$/);
        if (firstSentenceMatch) {
          heading = `${authorPrefix}${coreTitle}: ${firstSentenceMatch[1].trim()}`;
          preview = (firstSentenceMatch[2] || '').trim();
        } else {
          const words = remainder.split(/\s+/);
          const titlePart = words.slice(0, 8).join(' ');
          const bodyPart = words.slice(8).join(' ');
          heading = `${authorPrefix}${coreTitle}: ${titlePart}`;
          preview = bodyPart;
        }
      } else {
        preview = remainder;
      }
    }
  }

  // Final check: if preview is identical to heading (case-insensitive), clear redundant preview
  if (
    preview &&
    (preview.toLowerCase() === heading.toLowerCase() ||
      preview.toLowerCase() === coreTitle.toLowerCase())
  ) {
    preview = '';
  }

  return { heading, preview, expandedBody };
}

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openProfile } = useProfileModal();

  const [filter, setFilter] = useState<FilterType>('all');
  const [storeSnapshot, setStoreSnapshot] = useState(() =>
    getNotificationStoreSnapshot(user?.uid)
  );
  const [extraNotifications, setExtraNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState<Set<string>>(
    () => new Set()
  );
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

  const touchStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to the single-source-of-truth notification store and clean up on unmount
  useEffect(() => {
    if (!user?.uid) {
      setStoreSnapshot(getNotificationStoreSnapshot(''));
      return;
    }

    const unsub = subscribeToNotificationStore(user.uid, (snap) => {
      setStoreSnapshot(snap);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    setError(null);
    try {
      await syncUserNotificationsStore(user.uid);
      setExtraNotifications([]);
      setLastDoc(null);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    } catch {
      setError('Unable to refresh notifications right now. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  const handleLoadMore = useCallback(async () => {
    if (!user?.uid || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchUserNotificationsPage({
        userId: user.uid,
        pageSize: BATCH_INCREMENT,
        lastDoc,
      });
      setExtraNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const merged = [...prev];
        for (const item of res.notifications) {
          if (!existingIds.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setLastDoc(res.lastDoc);
      setHasMoreNotifications(res.hasMore);
      setVisibleCount((prev) => prev + BATCH_INCREMENT);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, loadingMore, lastDoc]);

  // Combine store notifications + extra paginated items, deduplicate, and sort newest-first by real createdAt
  const allNotifications = useMemo<AppNotification[]>(() => {
    const byId = new Map<string, AppNotification>();
    for (const item of storeSnapshot.notifications) {
      if (!dismissedIds.has(item.id)) {
        byId.set(item.id, item);
      }
    }
    for (const extra of extraNotifications) {
      if (!dismissedIds.has(extra.id) && !byId.has(extra.id)) {
        byId.set(extra.id, extra);
      }
    }
    return Array.from(byId.values()).sort(
      (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
    );
  }, [storeSnapshot.notifications, extraNotifications, dismissedIds]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return allNotifications;
    if (filter === 'announcements') {
      return allNotifications.filter(
        (n) => resolveDisplayCategory(n) === 'announcement'
      );
    }
    if (filter === 'following') {
      return allNotifications.filter((n) => {
        const cat = resolveDisplayCategory(n);
        return cat === 'follower' || cat === 'post';
      });
    }
    if (filter === 'rewards') {
      return allNotifications.filter((n) => {
        const cat = resolveDisplayCategory(n);
        return cat === 'reward' || cat === 'crew';
      });
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const displayedNotifications = useMemo(
    () => filteredNotifications.slice(0, visibleCount),
    [filteredNotifications, visibleCount]
  );

  // Automatic infinite scroll using IntersectionObserver
  const canLoadMore =
    filteredNotifications.length > visibleCount || hasMoreNotifications;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore || storeSnapshot.loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || loadingMore) return;
        if (filteredNotifications.length > visibleCount) {
          setVisibleCount((prev) => prev + BATCH_INCREMENT);
        } else if (hasMoreNotifications) {
          void handleLoadMore();
        }
      },
      { root: null, rootMargin: '260px 0px', threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    canLoadMore,
    storeSnapshot.loading,
    loadingMore,
    filteredNotifications.length,
    visibleCount,
    hasMoreNotifications,
    handleLoadMore,
  ]);

  // Group displayed notifications into Today, Yesterday, This week, and Earlier in local time
  const groupedNotifications = useMemo(() => {
    const groups: Record<DateGroupKey, AppNotification[]> = {
      Today: [],
      Yesterday: [],
      'This week': [],
      Earlier: [],
    };
    for (const item of displayedNotifications) {
      const groupKey = resolveDateGroup(item);
      groups[groupKey].push(item);
    }
    const order: DateGroupKey[] = ['Today', 'Yesterday', 'This week', 'Earlier'];
    return order
      .filter((key) => groups[key].length > 0)
      .map((key) => ({
        label: key,
        items: groups[key].sort(
          (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
        ),
      }));
  }, [displayedNotifications]);

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.read).length,
    [allNotifications]
  );

  const counts = useMemo(() => {
    let announcementsCount = 0;
    let followingCount = 0;
    let rewardsCount = 0;

    for (const n of allNotifications) {
      const cat = resolveDisplayCategory(n);
      if (cat === 'announcement') announcementsCount++;
      else if (cat === 'follower' || cat === 'post') followingCount++;
      else if (cat === 'reward' || cat === 'crew') rewardsCount++;
    }

    return {
      all: allNotifications.length,
      following: followingCount,
      announcements: announcementsCount,
      rewards: rewardsCount,
    };
  }, [allNotifications]);

  const handleMarkOneRead = useCallback(
    async (notif: AppNotification) => {
      if (notif.read || !user?.uid) return;

      setExtraNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );

      try {
        if (notif.isAnnouncement && notif.announcementId) {
          await markAnnouncementAsRead(user.uid, notif.announcementId);
        } else {
          await markNotificationAsRead(notif.id, user.uid);
        }
      } catch {
        // Optimistic update already applied
      }
    },
    [user?.uid]
  );

  const handleNotificationTap = useCallback(
    async (notif: AppNotification) => {
      void handleMarkOneRead(notif);

      const category = resolveDisplayCategory(notif);

      // 1. Announcements expand/collapse in place
      if (category === 'announcement') {
        setExpandedAnnouncementIds((prev) => {
          const next = new Set(prev);
          if (next.has(notif.id)) {
            next.delete(notif.id);
          } else {
            next.add(notif.id);
          }
          return next;
        });
        return;
      }

      // 2. Follower notifications open that user's full profile
      if (category === 'follower') {
        let followerUid = notif.authorId || notif.actorId || notif.followerId || '';
        if (!followerUid && notif.id.startsWith('follow_')) {
          const parts = notif.id.split('_');
          if (parts.length >= 3) followerUid = parts[1];
        }
        if (followerUid) {
          openProfile(followerUid);
          return;
        }
      }

      // 3. Post, Reward, Crew, and System notifications navigate to their target page
      const destination = resolveNotificationDestination({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        authorId: notif.authorId,
        actorId: notif.actorId || notif.authorId,
        followerId: notif.followerId || notif.authorId,
        postId: notif.postId,
        postSlug: notif.postSlug,
        postTitle: notif.title,
        commentId: notif.commentId,
        isAnnouncement: notif.isAnnouncement,
        announcementId: notif.announcementId,
      });

      if (destination) {
        navigate(destination);
      }
    },
    [handleMarkOneRead, navigate, openProfile]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user?.uid || unreadCount === 0) return;

    setExtraNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsAsRead(
        user.uid,
        storeSnapshot.userNotifications,
        storeSnapshot.announcements
      );
    } catch {
      // Optimistic update already applied
    }
  }, [
    user?.uid,
    unreadCount,
    storeSnapshot.userNotifications,
    storeSnapshot.announcements,
  ]);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { id, x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (notif: AppNotification, e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.id !== notif.id) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      if (deltaX < -85 && deltaY < 40) {
        if (!notif.read) {
          void handleMarkOneRead(notif);
        } else if (!isPinnedNotification(notif)) {
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.add(notif.id);
            return next;
          });
        }
      }
    },
    [handleMarkOneRead]
  );

  const isLoading = storeSnapshot.loading && !storeSnapshot.initialized;

  return (
    <div className="notif-page">
      {/* Header & Action Row */}
      <header className="notif-header">
        <div className="notif-heading-group">
          <span className="notif-kicker">Activity &amp; Updates</span>
          <div className="notif-page-title-row">
            <h1 className="notif-page-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="notif-unread-count-pill">{unreadCount} unread</span>
            )}
          </div>
          <p className="notif-subtitle">
            Posts from people you follow, new followers, rewards, crew updates, and announcements.
          </p>
        </div>

        <div className="notif-actions-row">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isLoading}
            className="notif-action-pill"
          >
            <CheckCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Mark all as read</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="notif-refresh-btn"
            aria-label="Refresh notifications"
            title="Refresh notifications"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </header>

      {/* Filter Tabs Row */}
      <div className="notif-chip-scroll-wrap">
        <div className="notif-chip-scroll" role="tablist" aria-label="Notification filters">
          {(
            [
              { id: 'all', label: 'All', count: counts.all },
              { id: 'following', label: 'Following', count: counts.following },
              { id: 'announcements', label: 'Announcements', count: counts.announcements },
              { id: 'rewards', label: 'Rewards', count: counts.rewards },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(tab.id);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`notif-filter-chip ${
                  active ? 'notif-filter-chip--active' : ''
                }`}
              >
                <span>{tab.label}</span>
                <span className="notif-filter-chip-count">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Notification Stage */}
      <div className="notif-stage">
        {/* Error state with Retry */}
        {error && !isLoading && (
          <div className="notif-state-card" role="alert">
            <div className="notif-icon-circle notif-icon-circle--announcement">
              <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="notif-state-title">Something went wrong</h2>
            <p className="notif-state-desc">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="notif-action-pill"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                strokeWidth={1.75}
              />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading skeleton cards */}
        {isLoading ? (
          <ul className="notif-list" aria-busy="true" aria-label="Loading notifications">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="notif-list-item">
                <div className="notif-glass-card notif-glass-card--read animate-pulse pointer-events-none">
                  <div className="notif-icon-circle" />
                  <div className="notif-card-body">
                    <div className="h-3.5 w-24 rounded-full bg-current opacity-15" />
                    <div className="h-4 w-3/4 rounded-full bg-current opacity-20 mt-1" />
                    <div className="h-3 w-full rounded-full bg-current opacity-10 mt-1" />
                  </div>
                  <div className="notif-card-meta">
                    <div className="h-3 w-10 rounded-full bg-current opacity-15" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : filteredNotifications.length === 0 ? (
          /* Empty state */
          <div className="notif-state-card">
            <div className="notif-icon-circle">
              <Inbox className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="notif-state-title">You&apos;re all caught up</h2>
            <p className="notif-state-desc">
              {filter === 'following'
                ? 'When students or captains you follow publish study notes, past papers, or follow you back, they will appear here.'
                : filter === 'announcements'
                ? 'No superadmin announcements have been posted yet.'
                : filter === 'rewards'
                ? 'Koban rewards, Nakama Captain allotments, and Boardly Crew updates will appear here.'
                : 'New posts from people you follow, follower alerts, rewards, and official announcements will appear here.'}
            </p>
          </div>
        ) : (
          /* Date-Grouped Semantic Notification Lists */
          <>
            {groupedNotifications.map((group) => (
              <section
                key={group.label}
                className="notif-group"
                aria-label={`${group.label} notifications`}
              >
                <h2 className="notif-group-header">{group.label}</h2>

                <ul className="notif-list">
                  {group.items.map((notif) => {
                    const category = resolveDisplayCategory(notif);
                    const isAnnouncement = category === 'announcement';
                    const isPinned = isPinnedNotification(notif);
                    const isExpanded =
                      isAnnouncement && expandedAnnouncementIds.has(notif.id);
                    const { heading, preview, expandedBody } =
                      formatHeadingAndPreview(notif);

                    const renderLeftAvatarOrIcon = () => {
                      if (category === 'announcement') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--announcement">
                            <Megaphone className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                        );
                      }

                      if (category === 'follower') {
                        if (notif.authorAvatar) {
                          return (
                            <div className="notif-icon-circle">
                              <BoardlyAvatar
                                size="md"
                                avatarId={notif.authorAvatar || undefined}
                                frameId={notif.authorFrame || undefined}
                                fallbackInitials={notif.authorName || 'Student'}
                              />
                              <span
                                className="notif-avatar-corner-badge notif-avatar-corner-badge--follower"
                                aria-hidden="true"
                              >
                                <UserPlus className="w-2.5 h-2.5" strokeWidth={2} />
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="notif-icon-circle notif-icon-circle--follower">
                            <UserPlus className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                        );
                      }

                      if (category === 'post') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--post">
                            <BoardlyAvatar
                              size="md"
                              avatarId={notif.authorAvatar || undefined}
                              frameId={notif.authorFrame || undefined}
                              fallbackInitials={notif.authorName || heading || 'Post'}
                            />
                            <span
                              className="notif-avatar-corner-badge notif-avatar-corner-badge--post"
                              aria-hidden="true"
                            >
                              <FileText className="w-2.5 h-2.5" strokeWidth={2} />
                            </span>
                          </div>
                        );
                      }

                      if (category === 'reward') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--reward">
                            <Coins className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                        );
                      }

                      if (category === 'crew') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--crew">
                            <Award className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                        );
                      }

                      // System or Direct Message
                      const isMsg =
                        notif.type === 'new_message' ||
                        heading.toLowerCase().includes('message');
                      return (
                        <div className="notif-icon-circle notif-icon-circle--system">
                          {isMsg ? (
                            <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
                          ) : (
                            <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                          )}
                        </div>
                      );
                    };

                    const renderTypeTag = () => {
                      if (category === 'announcement') {
                        return (
                          <span className="notif-tag notif-tag--announcement">
                            <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                            ANNOUNCEMENT
                          </span>
                        );
                      }
                      if (category === 'follower') {
                        return (
                          <span className="notif-tag notif-tag--follower">
                            <UserPlus className="w-2.5 h-2.5" strokeWidth={2} />
                            FOLLOWER
                          </span>
                        );
                      }
                      if (category === 'post') {
                        return (
                          <span className="notif-tag notif-tag--post">
                            <FileText className="w-2.5 h-2.5" strokeWidth={2} />
                            POST
                          </span>
                        );
                      }
                      if (category === 'reward') {
                        return (
                          <span className="notif-tag notif-tag--reward">
                            <Coins className="w-2.5 h-2.5" strokeWidth={2} />
                            REWARD
                          </span>
                        );
                      }
                      if (category === 'crew') {
                        return (
                          <span className="notif-tag notif-tag--crew">
                            <Award className="w-2.5 h-2.5" strokeWidth={2} />
                            CREW
                          </span>
                        );
                      }
                      return (
                        <span className="notif-tag notif-tag--system">
                          <Bell className="w-2.5 h-2.5" strokeWidth={2} />
                          SYSTEM
                        </span>
                      );
                    };

                    return (
                      <li key={notif.id} className="notif-list-item">
                        <button
                          type="button"
                          onClick={() => handleNotificationTap(notif)}
                          onTouchStart={(e) => handleTouchStart(notif.id, e)}
                          onTouchEnd={(e) => handleTouchEnd(notif, e)}
                          aria-expanded={isAnnouncement ? isExpanded : undefined}
                          className={`notif-glass-card ${
                            notif.read
                              ? 'notif-glass-card--read'
                              : 'notif-glass-card--unread'
                          }`}
                        >
                          {/* Left Column: Avatar or Category Icon */}
                          {renderLeftAvatarOrIcon()}

                          {/* Center Column: Tags + Title + Preview + Inline Announcement Expansion */}
                          <div className="notif-card-body">
                            <div className="notif-tags-row">
                              {isPinned && (
                                <span className="notif-tag notif-tag--pinned">
                                  <Pin className="w-2.5 h-2.5" strokeWidth={2} />
                                  PINNED
                                </span>
                              )}
                              {renderTypeTag()}
                            </div>

                            <h3 className="notif-card-title">{heading}</h3>

                            {(isExpanded ? expandedBody : preview) && (
                              <p
                                className={`notif-card-message ${
                                  isExpanded ? 'notif-card-message--expanded' : ''
                                }`}
                              >
                                {isExpanded ? expandedBody : preview}
                              </p>
                            )}

                            {isAnnouncement && (
                              <div className="notif-inline-meta">
                                <span>
                                  {isExpanded
                                    ? `Published by ${notif.publishedBy || 'Superadmin'}`
                                    : 'Tap to read full announcement'}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  {isExpanded ? (
                                    <>
                                      <span>Show less</span>
                                      <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    </>
                                  ) : (
                                    <>
                                      <span>Expand</span>
                                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Time + Unread Red Dot */}
                          <div className="notif-card-meta">
                            <span className="notif-time">
                              {formatNotificationTime(notif.createdAt)}
                            </span>
                            <span
                              className={`notif-unread-dot ${
                                notif.read ? 'notif-unread-dot--read' : ''
                              }`}
                              aria-label={notif.read ? 'Read' : 'Unread'}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {/* Infinite scroll sentinel & subtle loading indicator */}
            {canLoadMore && (
              <div
                ref={sentinelRef}
                className="flex justify-center pt-2 pb-4 min-h-[36px]"
                aria-live="polite"
              >
                {loadingMore && <ButtonLineLoader label="Loading more..." />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
