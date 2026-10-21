import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Megaphone,
  Compass,
  CheckCheck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchUserNotificationsPage,
  fetchAnnouncements,
  fetchReadAnnouncementIds,
  markNotificationAsRead,
  markAnnouncementAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
  type AnnouncementItem,
} from '@/services/notificationService';
import type { DocumentSnapshot } from 'firebase/firestore';

type FilterType = 'all' | 'following' | 'announcements';

function formatRelativeTime(val: any): string {
  if (!val) return 'Just now';
  try {
    const date = val?.toDate ? val.toDate() : new Date(val);
    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);
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

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raw items
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set());
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

  // Announcement detail modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Initial load
  const loadInitial = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const [notifRes, announcementsRes, readIds] = await Promise.all([
        fetchUserNotificationsPage({ userId: user.uid, pageSize: 20 }),
        fetchAnnouncements(50),
        fetchReadAnnouncementIds(user.uid),
      ]);

      setUserNotifications(notifRes.notifications);
      setLastDoc(notifRes.lastDoc);
      setHasMoreNotifications(notifRes.hasMore);
      setAnnouncements(announcementsRes);
      setReadAnnouncementIds(readIds);
    } catch (err: unknown) {
      console.error('[NotificationsPage] Error loading notifications:', err);
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Load more user notifications
  const handleLoadMore = async () => {
    if (!user?.uid || loadingMore || !lastDoc) return;
    setLoadingMore(true);

    try {
      const notifRes = await fetchUserNotificationsPage({
        userId: user.uid,
        pageSize: 20,
        lastDoc,
      });

      setUserNotifications((prev) => [...prev, ...notifRes.notifications]);
      setLastDoc(notifRes.lastDoc);
      setHasMoreNotifications(notifRes.hasMore);
    } catch (err: unknown) {
      console.warn('[NotificationsPage] Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Convert announcements to unified notification shape
  const announcementNotifications = useMemo<AppNotification[]>(() => {
    return announcements.map((a) => ({
      id: `announcement_${a.id}`,
      type: 'announcement' as const,
      title: a.title,
      message: a.message,
      createdAt: a.createdAt,
      read: readAnnouncementIds.has(a.id),
      isAnnouncement: true,
      announcementId: a.id,
      publishedBy: a.authorName || 'Superadmin',
    }));
  }, [announcements, readAnnouncementIds]);

  // Combined and sorted newest first
  const allNotifications = useMemo<AppNotification[]>(() => {
    const combined = [...userNotifications, ...announcementNotifications];
    return combined.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [userNotifications, announcementNotifications]);

  // Filtered view
  const displayedNotifications = useMemo<AppNotification[]>(() => {
    if (filter === 'following') {
      return allNotifications.filter((n) => n.type === 'following');
    }
    if (filter === 'announcements') {
      return allNotifications.filter((n) => n.type === 'announcement');
    }
    return allNotifications;
  }, [allNotifications, filter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  // Handle tap on a card: mark as read and open destination
  const handleNotificationClick = async (notif: AppNotification) => {
    if (!user?.uid) return;

    if (notif.type === 'announcement' && notif.announcementId) {
      // Mark announcement as read
      if (!notif.read) {
        setReadAnnouncementIds((prev) => new Set([...prev, notif.announcementId!]));
        await markAnnouncementAsRead(user.uid, notif.announcementId);
      }
      // Open announcement preview modal
      const original = announcements.find((a) => a.id === notif.announcementId);
      if (original) {
        setSelectedAnnouncement(original);
      }
    } else {
      // User notification (Following)
      if (!notif.read) {
        setUserNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        await markNotificationAsRead(notif.id);
      }
      if (notif.link) {
        navigate(notif.link);
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid || unreadCount === 0) return;

    // Optimistic local state update
    setUserNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setReadAnnouncementIds(new Set(announcements.map((a) => a.id)));

    await markAllNotificationsAsRead(user.uid, userNotifications, announcements);
  };

  return (
    <>
      <PageMeta
        title="Notifications — Boardly"
        description="Stay updated with follower activity in Commons and official superadmin announcements."
      />

      <div
        style={{
          maxWidth: 880,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: '1rem',
          paddingBottom: '6rem',
        }}
      >
        {/* ── Header Matching Old Page Header Style ───────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
          <div>
            <span
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-faint)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              STUDENT UPDATES
            </span>
            <h1
              className="font-display flex items-center gap-2.5"
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                marginTop: 4,
              }}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--red)] text-white">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Activity from students you follow and official superadmin announcements.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                unreadCount > 0
                  ? 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--red)] cursor-pointer'
                  : 'bg-[var(--surface-2)]/40 border border-[var(--border)] text-[var(--muted)] opacity-50 cursor-not-allowed'
              }`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <CheckCheck size={14} className={unreadCount > 0 ? 'text-[var(--red)]' : ''} />
              <span>Mark all as read</span>
            </button>
            <button
              type="button"
              onClick={loadInitial}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh notifications"
              className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Filter Chips: All, Following, Announcements ───────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[var(--red)] text-white shadow-sm'
                : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            All ({allNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('following')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === 'following'
                ? 'bg-[var(--red)] text-white shadow-sm'
                : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Following ({allNotifications.filter((n) => n.type === 'following').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('announcements')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === 'announcements'
                ? 'bg-[var(--red)] text-white shadow-sm'
                : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Announcements ({announcements.length})
          </button>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadInitial}
              className="text-white underline font-semibold hover:opacity-90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Content List ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton height={74} count={4} />
          </div>
        ) : displayedNotifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={36} />}
            title="No notifications yet"
            description="When people you follow post something, or the superadmin shares an announcement, it will show up here."
          />
        ) : (
          <div className="space-y-2.5">
            {displayedNotifications.map((notif) => {
              const isUnread = !notif.read;
              const isAnnouncement = notif.type === 'announcement';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isUnread
                      ? 'bg-[var(--card)] border-[var(--red)]/40 hover:border-[var(--red)] shadow-sm'
                      : 'bg-[var(--surface-2)]/60 border-[var(--border)] opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Icon Box */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isAnnouncement
                        ? 'bg-red-500/15 border border-red-500/30 text-[var(--red)]'
                        : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]'
                    }`}
                  >
                    {isAnnouncement ? <Megaphone size={19} /> : <Compass size={19} />}
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isAnnouncement && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--red)] text-white uppercase tracking-wider shrink-0">
                            Announcement
                          </span>
                        )}
                        <h2
                          className="font-bold text-sm text-[var(--text)] truncate"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {notif.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[var(--muted)]">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0"
                            title="Unread"
                            aria-label="Unread notification"
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--muted)] leading-relaxed truncate">
                      {notif.message}
                    </p>
                  </div>

                  {/* Right Arrow Indicator */}
                  <div className="text-[var(--muted)] shrink-0 pt-2 opacity-60">
                    <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}

            {/* Load more button if has more user notifications */}
            {hasMoreNotifications && filter !== 'announcements' && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-outline text-xs px-5 py-2.5 rounded-full cursor-pointer inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <RotateCcw size={13} className="animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load older notifications</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Announcement Modal View ───────────────────────────────────── */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <Card className="w-full max-w-lg p-6 sm:p-7 space-y-5 bg-[var(--card)] border-[var(--border)] relative shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--red)]/15 border border-[var(--red)]/30 text-[var(--red)] flex items-center justify-center shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--red)] text-white uppercase tracking-wider">
                      Official Announcement
                    </span>
                    <h3
                      className="text-lg font-bold text-[var(--text)] mt-1"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {selectedAnnouncement.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                {selectedAnnouncement.message}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                <span className="flex items-center gap-1 font-medium">
                  <Shield size={13} className="text-[var(--red)]" />
                  <span>{selectedAnnouncement.authorName || 'Superadmin'}</span>
                </span>
                <span>{formatRelativeTime(selectedAnnouncement.createdAt)}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="btn-red w-full"
                style={{ height: '44px' }}
              >
                Close
              </button>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

export default NotificationsPage;
