import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { BoardlyAvatar, resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  getCachedUidByName,
  resolvePublicProfileByName,
  type PublicProfile,
} from '@/services/publicProfileService';
import { fetchCommonsPostById } from '@/services/commonsService';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME, isAdminAccount } from '@/constants/superAdmin';
import { BOARDLY_BOT_ACCOUNTS } from '@/config/botsConfig';
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

interface CachedPostAuthorMeta {
  authorUid?: string | null;
  authorName?: string;
  authorEquippedAvatar?: string | null;
  authorAvatar?: string | null;
  authorPhotoURL?: string | null;
  authorFrame?: string | null;
  authorRole?: string;
}

// Per-postId cache for notifications missing authorId on legacy notification rows
const postAuthorCache = new Map<string, CachedPostAuthorMeta>();
const inFlightPostLookups = new Map<string, Promise<CachedPostAuthorMeta | null>>();

function extractActorNameFromNotification(notif: AppNotification): string {
  if (notif.authorName && notif.authorName.trim()) {
    return notif.authorName.trim();
  }
  const rawTitle = String(notif.title || '').trim();
  const postMatch = rawTitle.match(/^(.+?)\s+posted:\s*/i);
  if (postMatch && postMatch[1]) {
    return postMatch[1].trim();
  }
  const followMatch = rawTitle.match(/^(.+?)\s+started following you/i);
  if (followMatch && followMatch[1]) {
    return followMatch[1].trim();
  }
  return '';
}

function extractPostIdFromNotification(notif: AppNotification): string {
  if (notif.postId && notif.postId.trim()) {
    return notif.postId.trim();
  }
  if (notif.id.startsWith('post_') && notif.id.includes('_follower_')) {
    const extracted = notif.id.slice('post_'.length, notif.id.lastIndexOf('_follower_'));
    if (extracted) return extracted;
  }
  return '';
}

function resolveDirectActorUid(notif: AppNotification): string {
  let uid =
    notif.authorId ||
    notif.actorId ||
    notif.followerId ||
    (notif as any).authorUid ||
    '';

  if (!uid && notif.id.startsWith('follow_')) {
    const parts = notif.id.split('_');
    if (parts.length >= 3 && parts[1]) {
      uid = parts[1];
    }
  }

  if (!uid) {
    const postId = extractPostIdFromNotification(notif);
    const cachedPost = postId ? postAuthorCache.get(postId) : undefined;
    if (cachedPost?.authorUid) {
      uid = cachedPost.authorUid;
    }
  }

  if (!uid) {
    const actorName = extractActorNameFromNotification(notif);
    if (actorName) {
      const lower = actorName.toLowerCase();
      if (
        lower === SUPER_ADMIN_NAME.toLowerCase() ||
        lower === 'shs virtual academy'
      ) {
        uid = SUPER_ADMIN_UID;
      } else {
        const bot = BOARDLY_BOT_ACCOUNTS.find(
          (b) =>
            b.displayName.toLowerCase() === lower ||
            (b.username && b.username.toLowerCase() === lower)
        );
        if (bot) {
          uid = bot.uid;
        } else {
          const cachedNameUid = getCachedUidByName(actorName);
          if (cachedNameUid) {
            uid = cachedNameUid;
          }
        }
      }
    }
  }

  return uid ? String(uid).trim() : '';
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

  // Per-UID cached actor profiles for follower and post notifications
  const [actorProfilesByUid, setActorProfilesByUid] = useState<Map<string, PublicProfile>>(
    () => new Map()
  );
  const [, setPostMetaVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const uidsToFetch = new Set<string>();
    const postIdsToResolve = new Set<string>();
    const namesToResolve = new Set<string>();

    for (const notif of allNotifications) {
      const cat = resolveDisplayCategory(notif);
      if (cat !== 'follower' && cat !== 'post') continue;

      const actorUid = resolveDirectActorUid(notif);
      if (actorUid) {
        uidsToFetch.add(actorUid);
      } else {
        const postId = extractPostIdFromNotification(notif);
        if (cat === 'post' && postId && !postAuthorCache.has(postId)) {
          postIdsToResolve.add(postId);
        }
        const actorName = extractActorNameFromNotification(notif);
        if (actorName && !getCachedUidByName(actorName)) {
          namesToResolve.add(actorName);
        }
      }
    }

    if (uidsToFetch.size > 0) {
      void getPublicProfiles(Array.from(uidsToFetch)).then((fetchedMap) => {
        if (cancelled || fetchedMap.size === 0) return;
        setActorProfilesByUid((prev) => {
          let changed = false;
          const next = new Map(prev);
          fetchedMap.forEach((prof, uid) => {
            const existing = next.get(uid);
            if (
              !existing ||
              existing.equippedAvatar !== prof.equippedAvatar ||
              existing.avatarUrl !== prof.avatarUrl ||
              existing.photoURL !== prof.photoURL ||
              existing.equippedFrame !== prof.equippedFrame ||
              existing.displayName !== prof.displayName
            ) {
              next.set(uid, prof);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      });
    }

    if (postIdsToResolve.size > 0) {
      void Promise.all(
        Array.from(postIdsToResolve).map(async (postId) => {
          let promise = inFlightPostLookups.get(postId);
          if (!promise) {
            promise = fetchCommonsPostById(postId)
              .then((post) => {
                if (!post || post.isAnonymous) {
                  const emptyMeta: CachedPostAuthorMeta = { authorUid: null };
                  postAuthorCache.set(postId, emptyMeta);
                  return emptyMeta;
                }
                const meta: CachedPostAuthorMeta = {
                  authorUid: post.authorUid || null,
                  authorName: post.authorName || undefined,
                  authorEquippedAvatar: (post as any).authorEquippedAvatar || null,
                  authorAvatar: post.authorAvatar || null,
                  authorPhotoURL: null,
                  authorFrame: (post as any).authorFrame || null,
                  authorRole: (post as any).authorRole || undefined,
                };
                postAuthorCache.set(postId, meta);
                return meta;
              })
              .catch(() => null)
              .finally(() => {
                inFlightPostLookups.delete(postId);
              });
            inFlightPostLookups.set(postId, promise);
          }
          return promise;
        })
      ).then((results) => {
        if (cancelled) return;
        const newlyDiscoveredUids = results
          .map((r) => r?.authorUid)
          .filter((u): u is string => Boolean(u));
        setPostMetaVersion((v) => v + 1);
        if (newlyDiscoveredUids.length > 0) {
          void getPublicProfiles(newlyDiscoveredUids).then((fetchedMap) => {
            if (cancelled || fetchedMap.size === 0) return;
            setActorProfilesByUid((prev) => {
              const next = new Map(prev);
              fetchedMap.forEach((prof, uid) => next.set(uid, prof));
              return next;
            });
          });
        }
      });
    }

    if (namesToResolve.size > 0) {
      void Promise.all(
        Array.from(namesToResolve).map((name) => resolvePublicProfileByName(name))
      ).then((profiles) => {
        if (cancelled) return;
        const validProfiles = profiles.filter((p): p is PublicProfile => Boolean(p && p.uid));
        if (validProfiles.length > 0) {
          setPostMetaVersion((v) => v + 1);
          setActorProfilesByUid((prev) => {
            const next = new Map(prev);
            for (const prof of validProfiles) {
              next.set(prof.uid, prof);
            }
            return next;
          });
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [allNotifications]);

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

  const tabButtonRefs = useRef<Record<FilterType, HTMLButtonElement | null>>({
    all: null,
    following: null,
    announcements: null,
    rewards: null,
  });
  const [sliderRect, setSliderRect] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  useEffect(() => {
    const updateSlider = () => {
      const activeBtn = tabButtonRefs.current[filter];
      if (activeBtn) {
        setSliderRect({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        });
      }
    };
    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [filter, counts.all, counts.following, counts.announcements, counts.rewards]);

  return (
    <div className="notif-page">
      {/* Header & Action Row */}
      <header className="notif-header">
        <div className="notif-heading-group">
          <span className="notif-kicker">Activity &amp; Updates</span>
          <div className="notif-page-title-row">
            <h1 className="notif-page-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rs-chip rs-chip--red tabular-nums">{unreadCount} unread</span>
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
            className="rs-glass-btn inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-xs font-bold"
          >
            <CheckCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>Mark all as read</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="rs-glass-btn w-[42px] h-[42px] min-w-[42px] min-h-[42px] inline-flex items-center justify-center shrink-0"
            aria-label="Refresh notifications"
            title="Refresh notifications"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </header>

      {/* Filter Tabs Row (Segmented Tab Bar with Sliding Red Glass Pill) */}
      <div className="rs-seg-scroll">
        <div className="rs-seg-track" role="tablist" aria-label="Notification filters">
          {sliderRect.width > 0 && (
            <span
              className="rs-seg-slider"
              aria-hidden="true"
              style={{
                width: `${sliderRect.width}px`,
                transform: `translate3d(${sliderRect.left}px, 0, 0)`,
              }}
            />
          )}
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
                ref={(el) => {
                  tabButtonRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(tab.id);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`rs-seg-tab ${active ? 'rs-seg-tab--active' : ''}`}
              >
                <span>{tab.label}</span>
                <span className="rs-seg-badge">{tab.count}</span>
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
              className="rs-glass-btn inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-xs font-bold"
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
                    <div className="notif-card-top-row">
                      <div className="h-3.5 w-24 rounded-full bg-current opacity-15" />
                      <div className="h-3 w-10 rounded-full bg-current opacity-15" />
                    </div>
                    <div className="h-4 w-3/4 rounded-full bg-current opacity-20 mt-1" />
                    <div className="h-3 w-full rounded-full bg-current opacity-10 mt-1" />
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
                    const directActorUid = resolveDirectActorUid(notif);
                    const directActorProfile = directActorUid
                      ? actorProfilesByUid.get(directActorUid) || getCachedPublicProfile(directActorUid)
                      : null;
                    const actorProBadge = directActorProfile?.proBadge || null;

                    const renderLeftAvatarOrIcon = () => {
                      if (category === 'announcement') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--announcement">
                            <Megaphone className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                        );
                      }

                      if (category === 'follower' || category === 'post') {
                        const actorUid = resolveDirectActorUid(notif);
                        const actorProfile = actorUid
                          ? actorProfilesByUid.get(actorUid) || getCachedPublicProfile(actorUid)
                          : null;
                        const postId = extractPostIdFromNotification(notif);
                        const postMeta = postId ? postAuthorCache.get(postId) : undefined;
                        const extractedName = extractActorNameFromNotification(notif);

                        const resolvedActorName =
                          actorProfile?.displayName ||
                          postMeta?.authorName ||
                          notif.authorName ||
                          extractedName ||
                          heading ||
                          'Student';

                        // Prefer live profile avatar/frame; only fall back to post/notification values if live profile has none
                        const resolvedEquippedAvatar =
                          resolveCosmeticItemId(actorProfile?.equipped?.avatar, 'avatar') ||
                          resolveCosmeticItemId(actorProfile?.equippedAvatar, 'avatar') ||
                          resolveCosmeticItemId(actorProfile?.avatar, 'avatar') ||
                          resolveCosmeticItemId(
                            postMeta?.authorEquippedAvatar || postMeta?.authorAvatar,
                            'avatar'
                          ) ||
                          resolveCosmeticItemId(notif.authorAvatar, 'avatar') ||
                          undefined;

                        const resolvedFrame =
                          actorProfile?.equipped?.frame ||
                          actorProfile?.equippedFrame ||
                          actorProfile?.frame ||
                          postMeta?.authorFrame ||
                          notif.authorFrame ||
                          undefined;

                        const isActorSuperAdmin = Boolean(
                          isAdminAccount(actorUid) ||
                            actorProfile?.role === 'admin' ||
                            actorProfile?.role === 'superadmin' ||
                            postMeta?.authorRole === 'admin' ||
                            postMeta?.authorRole === 'superadmin' ||
                            resolvedActorName.trim().toLowerCase() ===
                              SUPER_ADMIN_NAME.toLowerCase()
                        );

                        return (
                          <div className="notif-icon-circle notif-icon-circle--avatar">
                            <BoardlyAvatar
                              uid={actorUid || postMeta?.authorUid || notif.authorId || notif.actorId || notif.followerId || notif.id}
                              equippedAvatar={resolvedEquippedAvatar}
                              frame={resolvedFrame}
                              name={resolvedActorName}
                              isSuperAdmin={isActorSuperAdmin}
                              size={46}
                            />
                            {category === 'follower' ? (
                              <span
                                className="notif-avatar-corner-badge notif-avatar-corner-badge--follower"
                                aria-hidden="true"
                              >
                                <UserPlus className="w-2.5 h-2.5" strokeWidth={2} />
                              </span>
                            ) : (
                              <span
                                className="notif-avatar-corner-badge notif-avatar-corner-badge--post"
                                aria-hidden="true"
                              >
                                <FileText className="w-2.5 h-2.5" strokeWidth={2} />
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (category === 'reward') {
                        return (
                          <div className="notif-icon-circle notif-icon-circle--reward">
                            <KobanIcon size={20} decorative />
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
                          <span className="rs-chip rs-chip--red">
                            <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                            ANNOUNCEMENT
                          </span>
                        );
                      }
                      if (category === 'follower') {
                        return (
                          <span className="rs-chip rs-chip--green">
                            <UserPlus className="w-2.5 h-2.5" strokeWidth={2} />
                            FOLLOWER
                          </span>
                        );
                      }
                      if (category === 'post') {
                        return (
                          <span className="rs-chip">
                            <FileText className="w-2.5 h-2.5" strokeWidth={2} />
                            POST
                          </span>
                        );
                      }
                      if (category === 'reward') {
                        return (
                          <span className="rs-chip rs-chip--gold">
                            <KobanIcon size={11} decorative />
                            REWARD
                          </span>
                        );
                      }
                      if (category === 'crew') {
                        return (
                          <span className="rs-chip rs-chip--gold">
                            <Award className="w-2.5 h-2.5" strokeWidth={2} />
                            CREW
                          </span>
                        );
                      }
                      return (
                        <span className="rs-chip">
                          <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
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
                          {/* Left Column: 46px Round Avatar or Category Icon */}
                          {renderLeftAvatarOrIcon()}

                          {/* Right Content Column: Top row (Chips + Time), Bold 16px Title, Muted 14px Description */}
                          <div className="notif-card-body">
                            <div className="notif-card-top-row">
                              <div className="notif-tags-row">
                                {isPinned && (
                                  <span className="rs-chip rs-chip--gold">
                                    <Pin className="w-2.5 h-2.5" strokeWidth={2} />
                                    PINNED
                                  </span>
                                )}
                                {renderTypeTag()}
                              </div>

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
                            </div>

                            <h3 className="notif-card-title flex items-center gap-1.5 flex-wrap">
                              <span>{heading}</span>
                              {actorProBadge && (
                                <ProBadge design={actorProBadge} size="sm" listMode />
                              )}
                            </h3>

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
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--rs-muted)]">
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
