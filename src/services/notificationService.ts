import { auth } from '@/lib/firebase';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAIL_SUPPORT, SUPER_ADMIN_UID } from '@/constants/superAdmin';
import { DEFAULT_WELCOME_ANNOUNCEMENT } from '@/config/botsConfig';
import type { Timestamp } from '@/types';

export type NotificationType =
  | 'following_post'
  | 'new_follower'
  | 'following'
  | 'announcement'
  | 'system';

export const WELCOME_ANNOUNCEMENT_ID = DEFAULT_WELCOME_ANNOUNCEMENT.id;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Timestamp | Date | number | null;
  read: boolean;
  isPinned?: boolean;
  link?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  postId?: string;
  postType?: string;
  isAnnouncement?: boolean;
  announcementId?: string;
  publishedBy?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  isPinned?: boolean;
  authorId: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | Date | number | null;
}

export interface NotificationStoreSnapshot {
  userId: string;
  notifications: AppNotification[];
  userNotifications: AppNotification[];
  announcements: AnnouncementItem[];
  readAnnouncementIds: Set<string>;
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
}

interface InternalStoreState {
  userId: string;
  d1Notifications: Map<string, AppNotification>;
  optimisticReadIds: Set<string>;
  announcements: AnnouncementItem[];
  readAnnouncementIds: Set<string>;
  loading: boolean;
  initialized: boolean;
}

let activeStore: InternalStoreState = {
  userId: '',
  d1Notifications: new Map(),
  optimisticReadIds: new Set(),
  announcements: [],
  readAnnouncementIds: new Set(),
  loading: false,
  initialized: false,
};

let activePollTimer: ReturnType<typeof setInterval> | null = null;
let syncInFlightPromise: Promise<void> | null = null;

const storeSubscribers = new Set<(snapshot: NotificationStoreSnapshot) => void>();
const unreadRefreshSubscribers = new Set<() => void>();

export function toMillis(val: Timestamp | Date | number | null | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  if (typeof (val as Timestamp).toMillis === 'function') {
    return (val as Timestamp).toMillis();
  }
  if (typeof (val as any).seconds === 'number') {
    return (val as any).seconds * 1000;
  }
  return 0;
}

function normalizeNotificationType(rawType?: string, isAnnouncement?: boolean): NotificationType {
  if (isAnnouncement || rawType === 'announcement') return 'announcement';
  if (rawType === 'new_follower') return 'new_follower';
  if (rawType === 'following_post') return 'following_post';
  if (rawType === 'system') return 'system';
  if (rawType === 'following') return 'following_post';
  return 'following_post';
}

function buildSnapshot(state: InternalStoreState): NotificationStoreSnapshot {
  const mergedUserNotifsMap = new Map<string, AppNotification>();

  state.d1Notifications.forEach((n, id) => {
    const isRead = Boolean(n.read) || state.optimisticReadIds.has(id);
    mergedUserNotifsMap.set(id, { ...n, read: isRead });
  });

  const userNotifications = Array.from(mergedUserNotifsMap.values()).sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );

  const announcementNotifications: AppNotification[] = state.announcements.map((a) => {
    const isPinnedWelcome = a.id === WELCOME_ANNOUNCEMENT_ID || Boolean(a.isPinned);
    const isRead =
      state.readAnnouncementIds.has(a.id) || state.optimisticReadIds.has(a.id);
    return {
      id: a.id,
      type: 'announcement',
      title: a.title,
      message: a.message,
      createdAt: a.createdAt,
      read: isRead,
      isPinned: isPinnedWelcome,
      isAnnouncement: true,
      announcementId: a.id,
      publishedBy: a.authorName || 'Superadmin',
    };
  });

  const combined = [...announcementNotifications, ...userNotifications].sort((a, b) => {
    const aPinned = a.id === WELCOME_ANNOUNCEMENT_ID || Boolean(a.isPinned);
    const bPinned = b.id === WELCOME_ANNOUNCEMENT_ID || Boolean(b.isPinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });

  const unreadCount = combined.filter((n) => !n.read).length;

  return {
    userId: state.userId,
    notifications: combined,
    userNotifications,
    announcements: state.announcements,
    readAnnouncementIds: new Set(state.readAnnouncementIds),
    unreadCount,
    loading: state.loading,
    initialized: state.initialized,
  };
}

function emitStoreChange(): void {
  const snapshot = buildSnapshot(activeStore);
  storeSubscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      // Ignore subscriber error
    }
  });
}

export function getNotificationStoreSnapshot(userId?: string): NotificationStoreSnapshot {
  if (userId && activeStore.userId !== userId) {
    return {
      userId,
      notifications: [],
      userNotifications: [],
      announcements: [],
      readAnnouncementIds: new Set(),
      unreadCount: 0,
      loading: true,
      initialized: false,
    };
  }
  return buildSnapshot(activeStore);
}

export function triggerUnreadNotificationsRefresh(): void {
  if (activeStore.userId) {
    void syncUserNotificationsStore(activeStore.userId);
  }
  unreadRefreshSubscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore subscriber execution error
    }
  });
}

async function getOptionalBearerHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken(false);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore token retrieval failure
  }
  return {};
}

export function isUserSuperAdmin(user: { uid?: string; email?: string | null } | null): boolean {
  if (!user) return false;
  const uid = user.uid || '';
  const email = (user.email || '').toLowerCase();
  return (
    uid === SUPER_ADMIN_UID ||
    email === SUPER_ADMIN_EMAIL.toLowerCase() ||
    email === SUPER_ADMIN_EMAIL_SUPPORT.toLowerCase()
  );
}

export async function fetchWelcomeAnnouncement(userId?: string): Promise<{
  announcement: AnnouncementItem;
  userStatus: { welcomed: boolean; read: boolean } | null;
}> {
  let d1Item: AnnouncementItem | null = null;
  let userStatus: { welcomed: boolean; read: boolean } | null = null;

  try {
    const headers = await getOptionalBearerHeader();
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const resp = await fetch(`/api/announcements/welcome${qs}`, {
      headers,
      cache: 'no-store',
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.announcement) {
        const a = data.announcement;
        d1Item = {
          id: a.id || WELCOME_ANNOUNCEMENT_ID,
          title: a.title || DEFAULT_WELCOME_ANNOUNCEMENT.title,
          message: a.message || DEFAULT_WELCOME_ANNOUNCEMENT.message,
          isPinned: true,
          authorId: a.authorId || DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
          authorEmail: a.authorEmail || DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
          authorName: a.authorName || DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
          createdAt: a.updatedAtMs || a.createdAtMs || a.updatedAt || a.createdAt || Date.now(),
        };
      }
      const statusRaw = data?.userStatus || data?.welcomeStatus;
      if (statusRaw && typeof statusRaw === 'object') {
        userStatus = {
          welcomed: Boolean(statusRaw.welcomed),
          read: Boolean(statusRaw.read),
        };
      }
    }
  } catch {
    // Ignore fetch error, fall back to default
  }

  const fallback: AnnouncementItem = d1Item || {
    id: WELCOME_ANNOUNCEMENT_ID,
    title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
    message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
    isPinned: true,
    authorId: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
    authorEmail: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
    authorName: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
    createdAt: Date.now(),
  };

  return { announcement: fallback, userStatus };
}

export async function updateWelcomeAnnouncement(params: {
  title: string;
  message: string;
  adminUser: { uid: string; email?: string | null; displayName?: string | null };
}): Promise<AnnouncementItem> {
  const { title, message, adminUser } = params;
  if (!isUserSuperAdmin(adminUser)) {
    throw new Error('Unauthorized: Only the superadmin can edit the Welcome announcement.');
  }

  const cleanTitle = title.trim();
  const cleanMessage = message.trim();
  if (!cleanTitle || !cleanMessage) {
    throw new Error('Both title and message are required.');
  }

  const headers = await getOptionalBearerHeader();
  await fetch('/api/announcements/welcome', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      title: cleanTitle,
      message: cleanMessage,
    }),
  });

  invalidateAnnouncementsCache();
  triggerUnreadNotificationsRefresh();

  return {
    id: WELCOME_ANNOUNCEMENT_ID,
    title: cleanTitle,
    message: cleanMessage,
    isPinned: true,
    authorId: adminUser.uid,
    authorEmail: adminUser.email || '',
    authorName: adminUser.displayName || 'Superadmin',
    createdAt: Date.now(),
  };
}

const ensuredWelcomeSessionSet = new Set<string>();

export async function ensureWelcomeNotificationForUser(userId: string): Promise<void> {
  if (!userId || ensuredWelcomeSessionSet.has(userId)) return;
  ensuredWelcomeSessionSet.add(userId);

  try {
    const headers = await getOptionalBearerHeader();
    const d1Resp = await fetch('/api/announcements/welcome/ensure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ userId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (d1Resp?.read) {
      activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
      activeStore.optimisticReadIds.add(WELCOME_ANNOUNCEMENT_ID);
    }
  } catch (err) {
    console.warn('[notificationService] ensureWelcomeNotificationForUser notice:', err);
  }
}

export async function createAnnouncement(params: {
  title: string;
  message: string;
  adminUser: { uid: string; email?: string | null; displayName?: string | null };
}): Promise<string> {
  const { title, message, adminUser } = params;

  if (!isUserSuperAdmin(adminUser)) {
    throw new Error('Unauthorized: Only the superadmin can create announcements.');
  }

  const cleanTitle = title.trim();
  const cleanMessage = message.trim();

  if (!cleanTitle) {
    throw new Error('Announcement title cannot be empty.');
  }
  if (!cleanMessage) {
    throw new Error('Announcement message cannot be empty.');
  }

  const headers = await getOptionalBearerHeader();
  const resp = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      title: cleanTitle,
      message: cleanMessage,
      authorName: adminUser.displayName || 'Superadmin',
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || 'Failed to create announcement.');
  }

  invalidateAnnouncementsCache();
  triggerUnreadNotificationsRefresh();
  return String(data?.id || `ann_${Date.now()}`);
}

export async function deleteAnnouncement(
  announcementId: string,
  adminUser: { uid: string; email?: string | null }
): Promise<void> {
  if (!isUserSuperAdmin(adminUser)) {
    throw new Error('Unauthorized: Only the superadmin can delete announcements.');
  }

  const headers = await getOptionalBearerHeader();
  await fetch(`/api/admin/announcements/${encodeURIComponent(announcementId)}`, {
    method: 'DELETE',
    headers,
  });
  invalidateAnnouncementsCache();
  triggerUnreadNotificationsRefresh();
}

let cachedAnnouncements: { data: AnnouncementItem[]; expires: number } | null = null;

export function invalidateAnnouncementsCache() {
  cachedAnnouncements = null;
}

export async function fetchAnnouncements(limitCount = 50, userId?: string): Promise<AnnouncementItem[]> {
  if (cachedAnnouncements && Date.now() < cachedAnnouncements.expires) {
    return cachedAnnouncements.data.slice(0, limitCount);
  }

  try {
    const { announcement: welcomeItem, userStatus } = await fetchWelcomeAnnouncement(userId || activeStore.userId);

    if (userStatus?.read && (userId || activeStore.userId)) {
      activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
    }

    const list: AnnouncementItem[] = [{ ...welcomeItem, isPinned: true }];
    cachedAnnouncements = { data: list, expires: Date.now() + 30000 };
    return list.slice(0, limitCount);
  } catch (err: unknown) {
    console.warn('[notificationService] Error fetching announcements:', err);
    const fallbackWelcome: AnnouncementItem = {
      id: WELCOME_ANNOUNCEMENT_ID,
      title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
      message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
      isPinned: true,
      authorId: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
      authorEmail: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
      authorName: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
      createdAt: Date.now(),
    };
    return cachedAnnouncements?.data
      ? cachedAnnouncements.data.slice(0, limitCount)
      : [fallbackWelcome];
  }
}

export async function notifyFollowersOfPost(params: {
  followerUids: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  postId: string;
  postSlug?: string;
  postTitle: string;
  postType?: string;
  postDescription?: string;
  isAnonymous?: boolean;
}): Promise<void> {
  if (params.isAnonymous) {
    return;
  }

  const {
    followerUids,
    authorId,
    authorName,
    authorAvatar = null,
    authorFrame = null,
    postId,
    postSlug,
    postTitle,
    postType = 'notes',
    postDescription = '',
  } = params;

  if (!authorId || !postId || !followerUids || followerUids.length === 0) return;

  const uniqueFollowers = Array.from(
    new Set(followerUids.map((u) => String(u || '').trim()).filter((u) => u && u !== authorId))
  );
  if (uniqueFollowers.length === 0) return;

  const cleanAuthor = (authorName || 'Student').trim();
  const cleanTitle = (postTitle || 'New post').trim();
  const notifTitle = `${cleanAuthor} posted: ${cleanTitle}`;
  const notifMessage = postDescription
    ? postDescription.trim().slice(0, 140)
    : `Published a new ${postType} in Commons.`;
  const targetLink = `/commons/post/${postSlug || postId}`;
  const nowMs = Date.now();

  try {
    const headers = await getOptionalBearerHeader();
    const payload = uniqueFollowers.map((followerUid) => ({
      id: `post_${postId}_follower_${followerUid}`,
      userId: followerUid,
      type: 'following_post',
      title: notifTitle,
      message: notifMessage,
      link: targetLink,
      read: false,
      authorId,
      authorName: cleanAuthor,
      authorAvatar,
      authorFrame,
      postId,
      postType,
      isAnonymous: false,
      createdAtMs: nowMs,
    }));
    await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ notifications: payload }),
    }).catch(() => {});
  } catch {
    // Ignore network error
  }
}

export async function notifyUserOfNewFollower(params: {
  targetUserId: string;
  followerId: string;
  followerName: string;
  followerAvatar?: string | null;
  followerFrame?: string | null;
}): Promise<void> {
  const {
    targetUserId,
    followerId,
    followerName,
    followerAvatar = null,
    followerFrame = null,
  } = params;
  if (!targetUserId || !followerId || targetUserId === followerId) return;

  const cleanName = (followerName || 'A student').trim();
  const deterministicId = `follow_${followerId}_${targetUserId}`;
  const title = `${cleanName} started following you`;
  const message = 'Tap to view their profile.';
  const link = `/user/${followerId}`;
  const nowMs = Date.now();

  try {
    const headers = await getOptionalBearerHeader();
    await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        notifications: [
          {
            id: deterministicId,
            userId: targetUserId,
            type: 'new_follower',
            title,
            message,
            link,
            read: false,
            authorId: followerId,
            authorName: cleanName,
            authorAvatar,
            authorFrame: followerFrame,
            createdAtMs: nowMs,
          },
        ],
      }),
    }).catch(() => {});
  } catch {
    // Ignore network error
  }
}

export async function fetchReadAnnouncementIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const readSet = new Set<string>();

  try {
    const headers = await getOptionalBearerHeader();
    const [welcomeRes, d1NotifRes] = await Promise.all([
      fetchWelcomeAnnouncement(userId).catch(() => null),
      fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
        headers,
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (welcomeRes?.userStatus?.read) {
      readSet.add(WELCOME_ANNOUNCEMENT_ID);
    }
    if (d1NotifRes?.welcomeRead) {
      readSet.add(WELCOME_ANNOUNCEMENT_ID);
    }
    if (Array.isArray(d1NotifRes?.readAnnouncementIds)) {
      d1NotifRes.readAnnouncementIds.forEach((id: string) => {
        if (id) readSet.add(String(id));
      });
    }
  } catch (err: unknown) {
    console.warn('[notificationService] Failed to fetch read announcements:', err);
  }

  return readSet;
}

export async function syncUserNotificationsStore(userId: string): Promise<void> {
  if (!userId) return;
  if (syncInFlightPromise && activeStore.userId === userId) {
    return syncInFlightPromise;
  }

  const doSync = async () => {
    try {
      await ensureWelcomeNotificationForUser(userId);
      const headers = await getOptionalBearerHeader();

      const [d1Data, announcements, welcomeRes] = await Promise.all([
        fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
          headers,
          cache: 'no-store',
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetchAnnouncements(50, userId),
        fetchWelcomeAnnouncement(userId).catch(() => null),
      ]);

      if (activeStore.userId !== userId) return;

      if (welcomeRes?.userStatus?.read || d1Data?.welcomeRead) {
        activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
      }
      if (Array.isArray(d1Data?.readAnnouncementIds)) {
        d1Data.readAnnouncementIds.forEach((id: string) => {
          if (id) activeStore.readAnnouncementIds.add(String(id));
        });
      }

      if (Array.isArray(d1Data?.notifications)) {
        const nextD1Map = new Map<string, AppNotification>();
        for (const item of d1Data.notifications) {
          const id = String(item.id || '');
          if (!id || id === WELCOME_ANNOUNCEMENT_ID) continue;
          const isRead = Boolean(item.read) || activeStore.optimisticReadIds.has(id);
          if (isRead) {
            activeStore.optimisticReadIds.add(id);
          }
          nextD1Map.set(id, {
            id,
            type: normalizeNotificationType(item.type),
            title: String(item.title || ''),
            message: String(item.message || ''),
            createdAt: Number(item.createdAtMs || item.createdAt || Date.now()),
            read: isRead,
            isPinned: Boolean(item.isPinned),
            link:
              item.link ||
              (item.postId ? `/commons/post/${item.postId}` : '/dashboard/commons'),
            authorId: item.authorId,
            authorName: item.authorName,
            authorAvatar: item.authorAvatar || null,
            authorFrame: item.authorFrame || null,
            postId: item.postId,
            postType: item.postType,
          });
        }
        activeStore.d1Notifications = nextD1Map;
      }

      activeStore.announcements = announcements;
      activeStore.loading = false;
      activeStore.initialized = true;
      emitStoreChange();
    } catch (err) {
      console.warn('[notificationService] syncUserNotificationsStore error:', err);
      activeStore.loading = false;
      activeStore.initialized = true;
      emitStoreChange();
    } finally {
      syncInFlightPromise = null;
    }
  };

  syncInFlightPromise = doSync();
  return syncInFlightPromise;
}

function attachUserRealtimeStore(userId: string): void {
  if (!userId) {
    if (activePollTimer) {
      clearInterval(activePollTimer);
      activePollTimer = null;
    }
    activeStore = {
      userId: '',
      d1Notifications: new Map(),
      optimisticReadIds: new Set(),
      announcements: [],
      readAnnouncementIds: new Set(),
      loading: false,
      initialized: false,
    };
    emitStoreChange();
    return;
  }

  if (activeStore.userId === userId) {
    return;
  }

  if (activePollTimer) {
    clearInterval(activePollTimer);
    activePollTimer = null;
  }

  activeStore = {
    userId,
    d1Notifications: new Map(),
    optimisticReadIds: new Set(),
    announcements: [],
    readAnnouncementIds: new Set(),
    loading: true,
    initialized: false,
  };
  emitStoreChange();

  void syncUserNotificationsStore(userId);
  activePollTimer = setInterval(() => {
    if (activeStore.userId === userId) {
      void syncUserNotificationsStore(userId);
    }
  }, 25000);
}

export function subscribeToNotificationStore(
  userId: string,
  onSnapshotChange: (snapshot: NotificationStoreSnapshot) => void
): () => void {
  if (!userId) {
    attachUserRealtimeStore('');
    onSnapshotChange(buildSnapshot(activeStore));
    return () => {};
  }

  attachUserRealtimeStore(userId);
  storeSubscribers.add(onSnapshotChange);
  onSnapshotChange(buildSnapshot(activeStore));

  return () => {
    storeSubscribers.delete(onSnapshotChange);
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  explicitUserId?: string
): Promise<void> {
  if (!notificationId) return;
  const userId = explicitUserId || activeStore.userId || auth.currentUser?.uid || '';

  if (notificationId === WELCOME_ANNOUNCEMENT_ID) {
    await markAnnouncementAsRead(userId, WELCOME_ANNOUNCEMENT_ID);
    return;
  }

  const prevOptimisticHad = activeStore.optimisticReadIds.has(notificationId);
  const prevD1Entry = activeStore.d1Notifications.get(notificationId);
  const prevAnnHad = activeStore.readAnnouncementIds.has(notificationId);

  const targetPostId = prevD1Entry?.postId;
  const deterministicPostId =
    targetPostId && userId ? `post_${targetPostId}_follower_${userId}` : null;

  activeStore.optimisticReadIds.add(notificationId);
  if (deterministicPostId) {
    activeStore.optimisticReadIds.add(deterministicPostId);
  }
  if (prevD1Entry) {
    activeStore.d1Notifications.set(notificationId, { ...prevD1Entry, read: true });
  }
  if (deterministicPostId && activeStore.d1Notifications.has(deterministicPostId)) {
    const det = activeStore.d1Notifications.get(deterministicPostId)!;
    activeStore.d1Notifications.set(deterministicPostId, { ...det, read: true });
  }
  emitStoreChange();

  let d1Succeeded = false;
  const headers = await getOptionalBearerHeader();

  if (userId) {
    try {
      const r = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          userId,
          notificationId,
        }),
      });
      if (r.ok) d1Succeeded = true;

      if (deterministicPostId && deterministicPostId !== notificationId) {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({
            userId,
            notificationId: deterministicPostId,
          }),
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  }

  if (!d1Succeeded) {
    if (!prevOptimisticHad) {
      activeStore.optimisticReadIds.delete(notificationId);
    }
    if (deterministicPostId) {
      activeStore.optimisticReadIds.delete(deterministicPostId);
    }
    if (prevD1Entry) {
      activeStore.d1Notifications.set(notificationId, prevD1Entry);
    }
    if (!prevAnnHad) {
      activeStore.readAnnouncementIds.delete(notificationId);
    }
    emitStoreChange();
    throw new Error('Failed to mark notification as read.');
  }
}

export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId || !announcementId) return;

  const prevHadRead = activeStore.readAnnouncementIds.has(announcementId);
  const prevOptimisticHad = activeStore.optimisticReadIds.has(announcementId);

  activeStore.readAnnouncementIds.add(announcementId);
  activeStore.optimisticReadIds.add(announcementId);
  emitStoreChange();

  let d1Succeeded = false;
  const headers = await getOptionalBearerHeader();

  const d1Calls: Promise<void>[] = [
    fetch('/api/notifications/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        notificationId: announcementId,
        isAnnouncement: true,
      }),
    })
      .then((r) => {
        if (r.ok) d1Succeeded = true;
      })
      .catch(() => {}),
  ];

  if (announcementId === WELCOME_ANNOUNCEMENT_ID) {
    d1Calls.push(
      fetch('/api/announcements/welcome/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ userId: effectiveUserId }),
      })
        .then((r) => {
          if (r.ok) d1Succeeded = true;
        })
        .catch(() => {})
    );
  }

  await Promise.all(d1Calls);

  if (!d1Succeeded) {
    if (!prevHadRead) {
      activeStore.readAnnouncementIds.delete(announcementId);
    }
    if (!prevOptimisticHad) {
      activeStore.optimisticReadIds.delete(announcementId);
    }
    emitStoreChange();
    throw new Error('Failed to mark announcement as read.');
  }
}

export async function markAllNotificationsAsRead(
  userId: string,
  userNotifications?: AppNotification[],
  announcements?: AnnouncementItem[]
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId) return;

  const prevOptimisticReadIds = new Set(activeStore.optimisticReadIds);
  const prevReadAnnouncementIds = new Set(activeStore.readAnnouncementIds);
  const prevD1Notifications = new Map(activeStore.d1Notifications);

  const targetUserNotifs =
    userNotifications && userNotifications.length > 0
      ? userNotifications
      : buildSnapshot(activeStore).userNotifications;
  const targetAnnouncements =
    announcements && announcements.length > 0 ? announcements : activeStore.announcements;

  activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
  activeStore.optimisticReadIds.add(WELCOME_ANNOUNCEMENT_ID);

  for (const a of targetAnnouncements) {
    activeStore.readAnnouncementIds.add(a.id);
    activeStore.optimisticReadIds.add(a.id);
  }

  for (const n of targetUserNotifs) {
    activeStore.optimisticReadIds.add(n.id);
  }

  activeStore.d1Notifications.forEach((n, id) => {
    activeStore.d1Notifications.set(id, { ...n, read: true });
    activeStore.optimisticReadIds.add(id);
  });

  emitStoreChange();

  let d1Succeeded = false;
  const headers = await getOptionalBearerHeader();

  const announcementIds = Array.from(
    new Set([WELCOME_ANNOUNCEMENT_ID, ...targetAnnouncements.map((a) => a.id)])
  );

  await Promise.all([
    fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        announcementIds,
      }),
    })
      .then((r) => {
        if (r.ok) d1Succeeded = true;
      })
      .catch(() => {}),
    fetch('/api/announcements/welcome/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ userId: effectiveUserId }),
    })
      .then((r) => {
        if (r.ok) d1Succeeded = true;
      })
      .catch(() => {}),
  ]);

  if (!d1Succeeded) {
    activeStore.optimisticReadIds = prevOptimisticReadIds;
    activeStore.readAnnouncementIds = prevReadAnnouncementIds;
    activeStore.d1Notifications = prevD1Notifications;
    emitStoreChange();
    throw new Error('Failed to mark all notifications as read.');
  }
}

export async function fetchUserNotificationsPage(params: {
  userId: string;
  pageSize?: number;
  lastDoc?: any;
}): Promise<{
  notifications: AppNotification[];
  lastDoc: any;
  hasMore: boolean;
}> {
  const { userId, pageSize = 20 } = params;
  if (!userId) {
    return { notifications: [], lastDoc: null, hasMore: false };
  }

  try {
    await syncUserNotificationsStore(userId);
    const snap = getNotificationStoreSnapshot(userId);
    return {
      notifications: snap.userNotifications.slice(0, pageSize),
      lastDoc: null,
      hasMore: snap.userNotifications.length > pageSize,
    };
  } catch (err: unknown) {
    console.warn('[notificationService] fetchUserNotificationsPage error:', err);
    return { notifications: [], lastDoc: null, hasMore: false };
  }
}

export function subscribeToUnreadNotifications(
  userId: string,
  onCountChange: (count: number) => void
): () => void {
  return subscribeToNotificationStore(userId, (snapshot) => {
    onCountChange(snapshot.unreadCount);
  });
}
