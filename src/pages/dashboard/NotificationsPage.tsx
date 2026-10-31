import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Megaphone,
  FileText,
  UserPlus,
  CheckCheck,
  RotateCcw,
  Shield,
  Pin,
  MessageSquare,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  subscribeToNotificationStore,
  syncUserNotificationsStore,
  getNotificationStoreSnapshot,
  fetchUserNotificationsPage,
  markNotificationAsRead,
  markAnnouncementAsRead,
  markAllNotificationsAsRead,
  WELCOME_ANNOUNCEMENT_ID,
  toMillis,
  type AppNotification,
} from '@/services/notificationService';
import { resolveNotificationDestination } from '@/utils/routes';
import type { DocumentSnapshot } from 'firebase/firestore';

type FilterType = 'all' | 'following' | 'announcements';
type DateGroupKey = 'Today' | 'Yesterday' | 'Earlier';

const PAGE_SIZE_LIMIT = 50;

function formatRelativeTime(val: unknown): string {
  if (!val) return 'Just now';
  try {
    const ms = toMillis(val as Parameters<typeof toMillis>[0]);
    const date = ms > 0 ? new Date(ms) : new Date(String(val));
    if (Number.isNaN(date.getTime())) return 'Recently';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function isPinnedNotification(notif: AppNotification): boolean {
  return Boolean(
    notif.isPinned ||
      notif.id === WELCOME_ANNOUNCEMENT_ID ||
      notif.announcementId === WELCOME_ANNOUNCEMENT_ID
  );
}

function resolveDateGroup(notif: AppNotification): DateGroupKey {
  // Pinned announcements always stay in the top group ("Today") so pinned items appear first overall
  if (isPinnedNotification(notif)) {
    return 'Today';
  }
  const ms = toMillis(notif.createdAt);
  if (!ms) return 'Today';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (ms >= startOfToday) return 'Today';
  if (ms >= startOfYesterday) return 'Yesterday';
  return 'Earlier';
}

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterType>('all');
  const [storeSnapshot, setStoreSnapshot] = useState(() =>
    getNotificationStoreSnapshot(user?.uid)
  );
  const [extraNotifications, setExtraNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState<Set<string>>(
    () => new Set()
  );
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE_LIMIT);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

  // Touch swipe tracking for optional swipe-left to mark as read / dismiss
  const touchStartRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // Subscribe to the single-source-of-truth notification store
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
    } catch {
      setError('Could not refresh notifications. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Load older paginated user notifications if any
  const handleLoadMore = async () => {
    if (displayedNotifications.length > visibleCount) {
      setVisibleCount((prev) => prev + PAGE_SIZE_LIMIT);
      if (!lastDoc || !hasMoreNotifications) return;
    }

    if (!user?.uid || loadingMore || !lastDoc) return;
    setLoadingMore(true);

    try {
      const notifRes = await fetchUserNotificationsPage({
        userId: user.uid,
        pageSize: 20,
        lastDoc,
      });

      setExtraNotifications((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = [...prev];
        for (const item of notifRes.notifications) {
          if (!seen.has(item.id)) next.push(item);
        }
        return next;
      });
      setLastDoc(notifRes.lastDoc);
      setHasMoreNotifications(notifRes.hasMore);
    } catch (err: unknown) {
      console.warn('[NotificationsPage] Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // All notifications from the single source of truth (+ any older paginated items), sorted pinned first then newest first
  const allNotifications = useMemo<AppNotification[]>(() => {
    const existingIds = new Set(storeSnapshot.notifications.map((n) => n.id));
    const merged =
      extraNotifications.length === 0
        ? [...storeSnapshot.notifications]
        : [
            ...storeSnapshot.notifications,
            ...extraNotifications.filter((n) => !existingIds.has(n.id)),
          ];

    return merged
      .filter((n) => !dismissedIds.has(n.id))
      .sort((a, b) => {
        const aPinned = isPinnedNotification(a);
        const bPinned = isPinnedNotification(b);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return toMillis(b.createdAt) - toMillis(a.createdAt);
      });
  }, [storeSnapshot.notifications, extraNotifications, dismissedIds]);

  const followingCount = useMemo(
    () =>
      allNotifications.filter(
        (n) =>
          n.type === 'following_post' ||
          n.type === 'following' ||
          n.type === 'new_follower'
      ).length,
    [allNotifications]
  );

  const announcementCount = useMemo(
    () => allNotifications.filter((n) => n.type === 'announcement' || n.isAnnouncement).length,
    [allNotifications]
  );

  // Filtered view
  const displayedNotifications = useMemo<AppNotification[]>(() => {
    if (filter === 'following') {
      return allNotifications.filter(
        (n) =>
          n.type === 'following_post' ||
          n.type === 'following' ||
          n.type === 'new_follower'
      );
    }
    if (filter === 'announcements') {
      return allNotifications.filter((n) => n.type === 'announcement' || n.isAnnouncement);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const paginatedNotifications = useMemo(
    () => displayedNotifications.slice(0, visibleCount),
    [displayedNotifications, visibleCount]
  );

  // Group into Today, Yesterday, and Earlier while keeping pinned announcements first, then newest first
  const groupedNotifications = useMemo(() => {
    const groups: Record<DateGroupKey, AppNotification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const notif of paginatedNotifications) {
      const key = resolveDateGroup(notif);
      groups[key].push(notif);
    }

    const order: DateGroupKey[] = ['Today', 'Yesterday', 'Earlier'];
    return order
      .map((label) => ({
        label,
        items: groups[label],
      }))
      .filter((group) => group.items.length > 0);
  }, [paginatedNotifications]);

  // Single source of truth unread count
  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  // Mark a single notification as read
  const handleMarkSingleAsRead = useCallback(
    async (notif: AppNotification) => {
      if (!user?.uid || notif.read) return;
      setError(null);

      try {
        if (notif.type === 'announcement' || notif.isAnnouncement) {
          const annId = notif.announcementId || notif.id.replace(/^announcement_/, '');
          await markAnnouncementAsRead(user.uid, annId);
        } else {
          await markNotificationAsRead(notif.id, user.uid);
        }
      } catch {
        setError('Could not mark notification as read. Please try again.');
      }
    },
    [user?.uid]
  );

  // Handle tap on a card: follower opens profile; announcement expands inline
  const handleNotificationClick = async (notif: AppNotification) => {
    if (!user?.uid) return;
    setError(null);

    const isAnnouncement = notif.type === 'announcement' || Boolean(notif.isAnnouncement);

    if (isAnnouncement) {
      const annId = notif.announcementId || notif.id.replace(/^announcement_/, '');
      if (!notif.read) {
        void markAnnouncementAsRead(user.uid, annId).catch(() => {
          setError('Could not mark announcement as read. Please try again.');
        });
      }
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

    if (!notif.read) {
      void markNotificationAsRead(notif.id, user.uid).catch(() => {
        setError('Could not mark notification as read. Please try again.');
      });
    }

    const targetUrl = resolveNotificationDestination(notif);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  // Optional swipe left to mark as read (or dismiss if already read and not pinned)
  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { id, x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (notif: AppNotification, e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || start.id !== notif.id) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);

    if (deltaX < -56 && deltaY < 40) {
      if (!notif.read) {
        void handleMarkSingleAsRead(notif);
      } else if (!isPinnedNotification(notif)) {
        setDismissedIds((prev) => {
          const next = new Set(prev);
          next.add(notif.id);
          return next;
        });
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid || unreadCount === 0) return;
    setError(null);

    try {
      await markAllNotificationsAsRead(
        user.uid,
        storeSnapshot.userNotifications,
        storeSnapshot.announcements
      );
    } catch {
      setError('Could not mark all notifications as read. Please try again.');
    }
  };

  const isInitialLoading = storeSnapshot.loading && !storeSnapshot.initialized;
  const canLoadMore =
    displayedNotifications.length > visibleCount ||
    (hasMoreNotifications && filter !== 'announcements');

  const emptyMessageForFilter = useMemo(() => {
    if (filter === 'following') {
      return 'When students you follow post or follow you back, you will see it here.';
    }
    if (filter === 'announcements') {
      return 'Official updates and announcements from Boardly will show up here.';
    }
    return 'Activity from students you follow and official announcements will show up here.';
  }, [filter]);

  return (
    <>
      <PageMeta
        title={
          unreadCount > 0
            ? `(${unreadCount}) Notifications — Boardly`
            : 'Notifications — Boardly'
        }
        description="Stay updated with follower activity in Commons and official superadmin announcements."
      />

      <div className="notif-page">
        {/* ── 2. Page Heading & 3. Action Row ─────────────────────────────── */}
        <header className="notif-header">
          <div className="notif-heading-group">
            <span className="notif-kicker">STUDENT UPDATES</span>
            <div className="notif-page-title-row">
              <h1 className="notif-page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-unread-count-pill">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="notif-subtitle">
              Activity from students you follow and official superadmin announcements.
            </p>
          </div>

          <div className="notif-actions-row">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="notif-action-pill"
              aria-label={
                unreadCount > 0
                  ? `Mark all ${unreadCount} unread notifications as read`
                  : 'All notifications are already read'
              }
            >
              <CheckCheck
                size={15}
                className={unreadCount > 0 ? 'text-[var(--accent)] shrink-0' : 'shrink-0'}
              />
              <span>Mark all as read</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || isInitialLoading}
              title="Refresh notifications"
              aria-label="Refresh notifications"
              className="notif-refresh-btn"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </header>

        {/* ── 4. Filter Chips: All, Following, Announcements ──────────────── */}
        <div className="notif-chip-scroll-wrap">
          <div
            className="notif-chip-scroll"
            role="tablist"
            aria-label="Filter notifications"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => {
                setFilter('all');
                setVisibleCount(PAGE_SIZE_LIMIT);
              }}
              className={`notif-filter-chip ${
                filter === 'all' ? 'notif-filter-chip--active' : ''
              }`}
            >
              <span>All ({allNotifications.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filter === 'following'}
              onClick={() => {
                setFilter('following');
                setVisibleCount(PAGE_SIZE_LIMIT);
              }}
              className={`notif-filter-chip ${
                filter === 'following' ? 'notif-filter-chip--active' : ''
              }`}
            >
              <span>Following ({followingCount})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filter === 'announcements'}
              onClick={() => {
                setFilter('announcements');
                setVisibleCount(PAGE_SIZE_LIMIT);
              }}
              className={`notif-filter-chip ${
                filter === 'announcements' ? 'notif-filter-chip--active' : ''
              }`}
            >
              <span>Announcements ({announcementCount})</span>
            </button>
          </div>
        </div>

        {/* ── 5. Notification List Stage with Soft Red Gradient Blobs ─────── */}
        <div className="notif-stage">
          <div className="notif-blob-layer" aria-hidden="true" />

          {/* Error State */}
          {error && (
            <div className="notif-state-card" role="alert">
              <p className="notif-state-title">Something went wrong</p>
              <p className="notif-state-desc">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="notif-filter-chip notif-filter-chip--active mt-1"
              >
                <RotateCcw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {refreshing && !isInitialLoading && (
            <LineLoader
              variant="inline"
              context="generic"
              loading={refreshing}
            />
          )}

          {/* Loading, Empty, or Grouped Glass Cards */}
          {isInitialLoading ? (
            <LineLoader context="generic" variant="section" />
          ) : displayedNotifications.length === 0 ? (
            <div className="notif-state-card" role="status">
              <div className="notif-icon-circle notif-icon-circle--announcement" aria-hidden="true">
                <Bell size={20} />
              </div>
              <h2 className="notif-state-title">You&apos;re all caught up</h2>
              <p className="notif-state-desc">{emptyMessageForFilter}</p>
            </div>
          ) : (
            <>
              {groupedNotifications.map((group) => (
                <section
                  key={group.label}
                  className="notif-group"
                  aria-label={`${group.label} notifications`}
                >
                  <h2 className="notif-group-header">{group.label}</h2>

                  <ul className="notif-list" role="list">
                    {group.items.map((notif) => {
                      const isUnread = !notif.read;
                      const isPinned = isPinnedNotification(notif);
                      const isAnnouncement =
                        notif.type === 'announcement' || Boolean(notif.isAnnouncement);
                      const isNewFollower =
                        notif.type === 'new_follower' ||
                        notif.type === 'follow' ||
                        (notif.type as string) === 'follower';
                      const isComment = notif.type === 'comment' || notif.type === 'reply';
                      const isLike = notif.type === 'like' || notif.type === 'post_like';
                      const hasAuthorAvatar =
                        !isAnnouncement &&
                        Boolean(notif.authorId || notif.authorName || notif.authorAvatar);
                      const isExpanded =
                        isAnnouncement && expandedAnnouncementIds.has(notif.id);
                      const relativeTime = formatRelativeTime(notif.createdAt);

                      const primaryTagLabel = isAnnouncement
                        ? 'Announcement'
                        : 'Follower';

                      const ariaLabel = `${isUnread ? 'Unread' : 'Read'} ${
                        isPinned ? 'pinned ' : ''
                      }${primaryTagLabel} notification: ${notif.title}. ${notif.message}. ${relativeTime}.`;

                      return (
                        <li key={notif.id} className="notif-list-item">
                          <button
                            type="button"
                            onClick={() => void handleNotificationClick(notif)}
                            onTouchStart={(e) => handleTouchStart(notif.id, e)}
                            onTouchEnd={(e) => handleTouchEnd(notif, e)}
                            aria-label={ariaLabel}
                            aria-expanded={isAnnouncement ? isExpanded : undefined}
                            className={`notif-glass-card ${
                              isUnread
                                ? 'notif-glass-card--unread'
                                : 'notif-glass-card--read'
                            }`}
                          >
                            {/* Left: 46-48px Frosted Circle with Avatar or Megaphone Icon */}
                            {hasAuthorAvatar ? (
                              <div className="notif-icon-circle notif-icon-circle--follower">
                                <BoardlyAvatar
                                  uid={notif.authorId}
                                  name={notif.authorName || 'Student'}
                                  equippedAvatar={
                                    notif.authorAvatar?.startsWith('pfp_')
                                      ? notif.authorAvatar
                                      : undefined
                                  }
                                  avatarUrl={
                                    notif.authorAvatar &&
                                    !notif.authorAvatar.startsWith('pfp_') &&
                                    !notif.authorAvatar.includes('googleusercontent')
                                      ? notif.authorAvatar
                                      : undefined
                                  }
                                  photoURL={
                                    notif.authorAvatar?.includes('googleusercontent')
                                      ? notif.authorAvatar
                                      : undefined
                                  }
                                  frame={notif.authorFrame || undefined}
                                  size={40}
                                />
                                <span
                                  className={`notif-avatar-corner-badge ${
                                    isNewFollower ? 'notif-avatar-corner-badge--follower' : ''
                                  }`}
                                  aria-hidden="true"
                                >
                                  {isNewFollower ? (
                                    <UserPlus size={10} />
                                  ) : isComment ? (
                                    <MessageSquare size={10} />
                                  ) : isLike ? (
                                    <Heart size={10} />
                                  ) : (
                                    <FileText size={10} />
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`notif-icon-circle ${
                                  isAnnouncement
                                    ? 'notif-icon-circle--announcement'
                                    : 'notif-icon-circle--follower'
                                }`}
                                aria-hidden="true"
                              >
                                {isAnnouncement ? (
                                  <Megaphone size={19} />
                                ) : (
                                  <UserPlus size={19} />
                                )}
                              </div>
                            )}

                            {/* Center: Wrapping Tags Row -> Semi-Bold Title (max 2 lines) -> Muted Message (max 3 lines or inline expanded) */}
                            <div className="notif-card-body">
                              <div className="notif-tags-row">
                                {isPinned && (
                                  <span className="notif-tag notif-tag--pinned">
                                    <Pin size={10} aria-hidden="true" />
                                    <span>PINNED</span>
                                  </span>
                                )}
                                {isAnnouncement ? (
                                  <span className="notif-tag notif-tag--announcement">
                                    ANNOUNCEMENT
                                  </span>
                                ) : (
                                  <span className="notif-tag notif-tag--follower">
                                    FOLLOWER
                                  </span>
                                )}
                              </div>

                              <h3 className="notif-card-title">{notif.title}</h3>

                              <p
                                className={`notif-card-message ${
                                  isExpanded ? 'notif-card-message--expanded' : ''
                                }`}
                              >
                                {notif.message}
                              </p>

                              {isAnnouncement && isExpanded && (
                                <div className="notif-inline-meta">
                                  <span className="inline-flex items-center gap-1">
                                    <Shield
                                      size={12}
                                      className="text-[var(--accent)] shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>{notif.publishedBy || 'Superadmin'}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                                    <span>Show less</span>
                                    <ChevronUp size={12} aria-hidden="true" />
                                  </span>
                                </div>
                              )}

                              {isAnnouncement && !isExpanded && (
                                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] pt-0.5">
                                  <span>Tap to read full announcement</span>
                                  <ChevronDown size={12} aria-hidden="true" />
                                </div>
                              )}
                            </div>

                            {/* Right: Relative Time + Unread Red Dot (150ms fade out when marked read) */}
                            <div className="notif-card-meta">
                              <span className="notif-time">{relativeTime}</span>
                              <span
                                className={`notif-unread-dot ${
                                  isUnread ? '' : 'notif-unread-dot--read'
                                }`}
                                aria-hidden="true"
                              />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              {/* Load More Button (pagination after 50 items or Firestore cursor) */}
              {canLoadMore && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleLoadMore()}
                    disabled={loadingMore}
                    className="notif-action-pill relative overflow-hidden"
                  >
                    <span>{loadingMore ? 'Loading more...' : 'Load more'}</span>
                    {loadingMore && <ButtonLineLoader />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationsPage;
