import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAIL_SUPPORT, SUPER_ADMIN_UID } from '@/constants/superAdmin';
import { DEFAULT_WELCOME_ANNOUNCEMENT } from '@/config/botsConfig';

export type NotificationType =
  | 'following_post'
  | 'new_follower'
  | 'follow'
  | 'following'
  | 'comment'
  | 'reply'
  | 'like'
  | 'post_like'
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
  link?: string | null;
  // Specific to following / follower notifications:
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  actorId?: string;
  followerId?: string;
  postId?: string;
  postType?: string;
  postSlug?: string;
  commentId?: string;
  // Specific to announcements:
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
  firestoreNotifications: Map<string, AppNotification>;
  optimisticReadIds: Set<string>;
  announcements: AnnouncementItem[];
  readAnnouncementIds: Set<string>;
  loading: boolean;
  initialized: boolean;
}

let activeStore: InternalStoreState = {
  userId: '',
  d1Notifications: new Map(),
  firestoreNotifications: new Map(),
  optimisticReadIds: new Set(),
  announcements: [],
  readAnnouncementIds: new Set(),
  loading: false,
  initialized: false,
};

let activeFirestoreUnsub: (() => void) | null = null;
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
  if (rawType === 'new_follower' || rawType === 'follow' || rawType === 'follower') return 'new_follower';
  if (rawType === 'following_post' || rawType === 'new_post' || rawType === 'following') return 'following_post';
  if (rawType === 'comment' || rawType === 'reply') return 'comment';
  if (rawType === 'like' || rawType === 'post_like') return 'like';
  if (rawType === 'system') return 'system';
  return 'following_post';
}

function buildSnapshot(state: InternalStoreState): NotificationStoreSnapshot {
  const mergedUserNotifsMap = new Map<string, AppNotification>();

  // Merge D1 notifications first
  state.d1Notifications.forEach((n, id) => {
    const isRead = Boolean(n.read) || state.optimisticReadIds.has(id);
    mergedUserNotifsMap.set(id, { ...n, read: isRead });
  });

  // Merge Firestore notifications (deduplicating by id or postId+authorId)
  state.firestoreNotifications.forEach((n, id) => {
    const existing = mergedUserNotifsMap.get(id);
    const isRead =
      Boolean(n.read) ||
      Boolean(existing?.read) ||
      state.optimisticReadIds.has(id);

    // Also check if there is already a deterministic D1 notification for the same post & user
    if (!existing && n.postId && state.userId) {
      const deterministicId = `post_${n.postId}_follower_${state.userId}`;
      const detExisting = mergedUserNotifsMap.get(deterministicId);
      if (detExisting) {
        const combinedRead =
          Boolean(detExisting.read) ||
          isRead ||
          state.optimisticReadIds.has(deterministicId);
        mergedUserNotifsMap.set(deterministicId, {
          ...detExisting,
          read: combinedRead,
          authorAvatar: detExisting.authorAvatar || n.authorAvatar || null,
          authorFrame: detExisting.authorFrame || n.authorFrame || null,
        });
        return;
      }
    }

    if (!existing && n.type === 'new_follower' && n.authorId && state.userId) {
      const detFollowId = `follow_${n.authorId}_${state.userId}`;
      const detExisting = mergedUserNotifsMap.get(detFollowId);
      if (detExisting) {
        const combinedRead =
          Boolean(detExisting.read) ||
          isRead ||
          state.optimisticReadIds.has(detFollowId);
        mergedUserNotifsMap.set(detFollowId, {
          ...detExisting,
          read: combinedRead,
          authorAvatar: detExisting.authorAvatar || n.authorAvatar || null,
        });
        return;
      }
    }

    mergedUserNotifsMap.set(id, {
      ...(existing || {}),
      ...n,
      read: isRead,
      authorAvatar: n.authorAvatar || existing?.authorAvatar || null,
      authorFrame: n.authorFrame || existing?.authorFrame || null,
    });
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

  // SINGLE SOURCE OF TRUTH: unreadCount is strictly the number of notifications where read === false
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

/**
 * Validates if the user is a superadmin before performing administrative actions.
 */
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

/**
 * Fetches the pinned "Welcome to Boardly" announcement from D1 (/api/announcements/welcome)
 * with Firestore fallback. Supports both `userStatus` and `welcomeStatus` response keys.
 */
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

  try {
    const snap = await getDoc(doc(db, 'announcements', WELCOME_ANNOUNCEMENT_ID));
    if (snap.exists()) {
      const data = snap.data();
      d1Item = {
        id: WELCOME_ANNOUNCEMENT_ID,
        title: data.title || d1Item?.title || DEFAULT_WELCOME_ANNOUNCEMENT.title,
        message: data.message || d1Item?.message || DEFAULT_WELCOME_ANNOUNCEMENT.message,
        isPinned: true,
        authorId: data.authorId || d1Item?.authorId || DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
        authorEmail: data.authorEmail || d1Item?.authorEmail || DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
        authorName: data.authorName || d1Item?.authorName || 'Superadmin',
        createdAt: data.updatedAt || data.createdAt || d1Item?.createdAt || Date.now(),
      };
    }
  } catch {
    // Fall back to default announcement
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

/**
 * Superadmin: Update the pinned "Welcome to Boardly" announcement in both D1 and Firestore.
 */
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
  }).catch(() => {});

  try {
    await setDoc(
      doc(db, 'announcements', WELCOME_ANNOUNCEMENT_ID),
      {
        title: cleanTitle,
        message: cleanMessage,
        isPinned: true,
        authorId: adminUser.uid,
        authorEmail: adminUser.email || '',
        authorName: adminUser.displayName || 'Superadmin',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Continue despite Firestore mirror write error
  }

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

/**
 * Ensures every user receives the pinned "Welcome to Boardly" announcement once.
 */
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

    const welcomeTitle = d1Resp?.announcement?.title || DEFAULT_WELCOME_ANNOUNCEMENT.title;
    const welcomeMessage = d1Resp?.announcement?.message || DEFAULT_WELCOME_ANNOUNCEMENT.message;

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const alreadyWelcomedFirestore = userSnap.exists() && Boolean(userSnap.data()?.welcomed);

      if (!alreadyWelcomedFirestore) {
        await setDoc(
          userRef,
          {
            welcomed: true,
            welcomedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch {
      // Ignore Firestore write error
    }

    try {
      const welcomeDocRef = doc(db, 'announcements', WELCOME_ANNOUNCEMENT_ID);
      const welcomeSnap = await getDoc(welcomeDocRef);
      if (!welcomeSnap.exists()) {
        await setDoc(welcomeDocRef, {
          title: welcomeTitle,
          message: welcomeMessage,
          isPinned: true,
          authorId: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
          authorEmail: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
          authorName: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      // Ignore announcement creation error
    }
  } catch (err) {
    console.warn('[notificationService] ensureWelcomeNotificationForUser notice:', err);
  }
}

/**
 * Superadmin: Post a global announcement to all users.
 */
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

  const docRef = await addDoc(collection(db, 'announcements'), {
    title: cleanTitle,
    message: cleanMessage,
    isPinned: false,
    authorId: adminUser.uid,
    authorEmail: adminUser.email || '',
    authorName: adminUser.displayName || 'Superadmin',
    createdAt: serverTimestamp(),
  });

  invalidateAnnouncementsCache();
  triggerUnreadNotificationsRefresh();
  return docRef.id;
}

/**
 * Superadmin: Delete a global announcement.
 */
export async function deleteAnnouncement(
  announcementId: string,
  adminUser: { uid: string; email?: string | null }
): Promise<void> {
  if (!isUserSuperAdmin(adminUser)) {
    throw new Error('Unauthorized: Only the superadmin can delete announcements.');
  }

  await deleteDoc(doc(db, 'announcements', announcementId));
  invalidateAnnouncementsCache();
  triggerUnreadNotificationsRefresh();
}

let cachedAnnouncements: { data: AnnouncementItem[]; expires: number } | null = null;

export function invalidateAnnouncementsCache() {
  cachedAnnouncements = null;
}

/**
 * Fetches all global announcements ordered with pinned "Welcome to Boardly" first, then newest first.
 */
export async function fetchAnnouncements(limitCount = 50, userId?: string): Promise<AnnouncementItem[]> {
  if (cachedAnnouncements && Date.now() < cachedAnnouncements.expires) {
    return cachedAnnouncements.data.slice(0, limitCount);
  }

  try {
    const [{ announcement: welcomeItem, userStatus }, snap] = await Promise.all([
      fetchWelcomeAnnouncement(userId || activeStore.userId),
      getDocs(
        query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(limitCount))
      ).catch(() => null),
    ]);

    if (userStatus?.read && (userId || activeStore.userId)) {
      activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
    }

    const firestoreItems: AnnouncementItem[] = snap
      ? snap.docs
          .filter((d) => d.id !== WELCOME_ANNOUNCEMENT_ID)
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || '',
              message: data.message || '',
              isPinned: Boolean(data.isPinned),
              authorId: data.authorId || '',
              authorEmail: data.authorEmail || '',
              authorName: data.authorName || 'Superadmin',
              createdAt: data.createdAt || null,
            };
          })
      : [];

    const list: AnnouncementItem[] = [{ ...welcomeItem, isPinned: true }, ...firestoreItems];
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

/**
 * Creates notifications for all followers of a user when they publish a post (resource, file, doubt, or formula sheet).
 * Anonymous posts MUST NEVER notify followers so the author's identity is never leaked.
 * Deterministic IDs (`post_${postId}_follower_${followerUid}`) prevent duplicates on edit or retry.
 */
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
  const nowMs = Date.now();

  // 1. Persist to D1 (/api/notifications)
  try {
    const headers = await getOptionalBearerHeader();
    const payload = uniqueFollowers.map((followerUid) => ({
      id: `post_${postId}_follower_${followerUid}`,
      userId: followerUid,
      type: 'following_post',
      title: notifTitle,
      message: notifMessage,
      link: null,
      read: false,
      authorId,
      authorName: cleanAuthor,
      authorAvatar,
      authorFrame,
      postId,
      postSlug: postSlug || null,
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
    // Ignore D1 mirror error
  }

  // 2. Persist to Firestore (`notifications` collection with deterministic doc ID so it never duplicates)
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const followerUid of uniqueFollowers) {
      const deterministicId = `post_${postId}_follower_${followerUid}`;
      const ref = doc(db, 'notifications', deterministicId);
      batch.set(
        ref,
        {
          userId: followerUid,
          type: 'following_post',
          title: notifTitle,
          message: notifMessage,
          link: null,
          authorId,
          authorName: cleanAuthor,
          authorAvatar: authorAvatar || null,
          authorFrame: authorFrame || null,
          postId,
          postSlug: postSlug || null,
          postType,
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      count++;
      if (count >= 400) break;
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (err: unknown) {
    console.warn('[notificationService] Firestore notifyFollowersOfPost notice:', err);
  }
}

/**
 * Creates a "new_follower" notification ("X started following you") when `followerId` follows `targetUserId`.
 * Stores type and actorId without full URLs so route building is dynamic.
 */
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
            link: null,
            read: false,
            authorId: followerId,
            followerId,
            actorId: followerId,
            authorName: cleanName,
            authorAvatar: followerAvatar,
            authorFrame: followerFrame,
            createdAtMs: nowMs,
          },
        ],
      }),
    }).catch(() => {});
  } catch {
    // Ignore D1 mirror error
  }

  try {
    await setDoc(
      doc(db, 'notifications', deterministicId),
      {
        userId: targetUserId,
        type: 'new_follower',
        title,
        message,
        link: null,
        authorId: followerId,
        followerId,
        actorId: followerId,
        authorName: cleanName,
        authorAvatar: followerAvatar || null,
        authorFrame: followerFrame || null,
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Ignore Firestore write error
  }
}

/**
 * Fetches the IDs of announcements that the current user has already marked as read.
 */
export async function fetchReadAnnouncementIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const readSet = new Set<string>();

  try {
    const headers = await getOptionalBearerHeader();
    const [snap, welcomeRes, d1NotifRes] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'readAnnouncements')).catch(() => null),
      fetchWelcomeAnnouncement(userId).catch(() => null),
      fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
        headers,
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (snap) {
      snap.docs.forEach((d) => readSet.add(d.id));
    }
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

/**
 * Synchronizes the single-source-of-truth notification store with D1 and Firestore.
 */
export async function syncUserNotificationsStore(userId: string): Promise<void> {
  if (!userId) return;
  if (syncInFlightPromise && activeStore.userId === userId) {
    return syncInFlightPromise;
  }

  const doSync = async () => {
    try {
      await ensureWelcomeNotificationForUser(userId);
      const headers = await getOptionalBearerHeader();

      const [d1Data, announcements, firestoreReadAnns, welcomeRes, fsNotifSnap] =
        await Promise.all([
          fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
            headers,
            cache: 'no-store',
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetchAnnouncements(50, userId),
          getDocs(collection(db, 'users', userId, 'readAnnouncements')).catch(() => null),
          fetchWelcomeAnnouncement(userId).catch(() => null),
          getDocs(
            query(
              collection(db, 'notifications'),
              where('userId', '==', userId),
              limit(100)
            )
          ).catch(() => null),
        ]);

      if (activeStore.userId !== userId) return;

      // Update readAnnouncementIds from all sources
      if (firestoreReadAnns) {
        firestoreReadAnns.docs.forEach((d) => activeStore.readAnnouncementIds.add(d.id));
      }
      if (welcomeRes?.userStatus?.read || d1Data?.welcomeRead) {
        activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
      }
      if (Array.isArray(d1Data?.readAnnouncementIds)) {
        d1Data.readAnnouncementIds.forEach((id: string) => {
          if (id) activeStore.readAnnouncementIds.add(String(id));
        });
      }

      // Update D1 notifications map
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

      // Update Firestore notifications map if snapshot was fetched
      if (fsNotifSnap) {
        const nextFsMap = new Map<string, AppNotification>();
        fsNotifSnap.docs.forEach((d) => {
          const data = d.data();
          if (data?.announcementId === WELCOME_ANNOUNCEMENT_ID) return;
          const isRead = Boolean(data.read) || activeStore.optimisticReadIds.has(d.id);
          if (isRead) {
            activeStore.optimisticReadIds.add(d.id);
          }
          nextFsMap.set(d.id, {
            id: d.id,
            type: normalizeNotificationType(data.type),
            title: data.title || '',
            message: data.message || '',
            createdAt: data.createdAt || null,
            read: isRead,
            isPinned: Boolean(data.isPinned),
            link:
              data.link ||
              (data.postId ? `/commons/post/${data.postId}` : '/dashboard/commons'),
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar || null,
            authorFrame: data.authorFrame || null,
            postId: data.postId,
            postType: data.postType,
          });
        });
        activeStore.firestoreNotifications = nextFsMap;
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
    if (activeFirestoreUnsub) {
      activeFirestoreUnsub();
      activeFirestoreUnsub = null;
    }
    if (activePollTimer) {
      clearInterval(activePollTimer);
      activePollTimer = null;
    }
    activeStore = {
      userId: '',
      d1Notifications: new Map(),
      firestoreNotifications: new Map(),
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

  if (activeFirestoreUnsub) {
    activeFirestoreUnsub();
    activeFirestoreUnsub = null;
  }
  if (activePollTimer) {
    clearInterval(activePollTimer);
    activePollTimer = null;
  }

  activeStore = {
    userId,
    d1Notifications: new Map(),
    firestoreNotifications: new Map(),
    optimisticReadIds: new Set(),
    announcements: [],
    readAnnouncementIds: new Set(),
    loading: true,
    initialized: false,
  };
  emitStoreChange();

  // Live Firestore listener for instant new-notification & read-state updates
  try {
    const qNotif = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(100)
    );
    activeFirestoreUnsub = onSnapshot(
      qNotif,
      (snap) => {
        if (activeStore.userId !== userId) return;
        const nextFsMap = new Map<string, AppNotification>();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data?.announcementId === WELCOME_ANNOUNCEMENT_ID) return;
          const isRead = Boolean(data.read) || activeStore.optimisticReadIds.has(d.id);
          if (isRead) {
            activeStore.optimisticReadIds.add(d.id);
          }
          nextFsMap.set(d.id, {
            id: d.id,
            type: normalizeNotificationType(data.type),
            title: data.title || '',
            message: data.message || '',
            createdAt: data.createdAt || null,
            read: isRead,
            isPinned: Boolean(data.isPinned),
            link:
              data.link ||
              (data.postId ? `/commons/post/${data.postId}` : '/dashboard/commons'),
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar || null,
            authorFrame: data.authorFrame || null,
            postId: data.postId,
            postType: data.postType,
          });
        });
        activeStore.firestoreNotifications = nextFsMap;
        emitStoreChange();
      },
      () => {
        // Ignore Firestore listener permission/network error; D1 sync still runs
      }
    );
  } catch {
    // Ignore listener setup error
  }

  void syncUserNotificationsStore(userId);
  activePollTimer = setInterval(() => {
    if (activeStore.userId === userId) {
      void syncUserNotificationsStore(userId);
    }
  }, 25000);
}

/**
 * Subscribe to the complete NotificationStoreSnapshot (notifications list + unreadCount).
 * Both NotificationsPage and useUnreadNotificationsCount use this single source of truth.
 */
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

/**
 * Mark a single user notification as read with immediate optimistic update and rollback on failure.
 */
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

  // Snapshot previous state for rollback if persistence fails
  const prevOptimisticHad = activeStore.optimisticReadIds.has(notificationId);
  const prevD1Entry = activeStore.d1Notifications.get(notificationId);
  const prevFsEntry = activeStore.firestoreNotifications.get(notificationId);
  const prevAnnHad = activeStore.readAnnouncementIds.has(notificationId);

  // Also check if there is a deterministic counterpart for the same postId
  const targetPostId = prevD1Entry?.postId || prevFsEntry?.postId;
  const deterministicPostId =
    targetPostId && userId ? `post_${targetPostId}_follower_${userId}` : null;

  // 1. Optimistic update immediately
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
  if (prevFsEntry) {
    activeStore.firestoreNotifications.set(notificationId, { ...prevFsEntry, read: true });
  }
  emitStoreChange();

  // 2. Update database (D1 + Firestore)
  let d1Succeeded = false;
  let fsSucceeded = false;

  const headers = await getOptionalBearerHeader();
  const d1Promise = userId
    ? fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          userId,
          notificationId,
        }),
      })
        .then(async (r) => {
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
        })
        .catch(() => {})
    : Promise.resolve();

  const fsPromise = updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    readAt: serverTimestamp(),
  })
    .then(() => {
      fsSucceeded = true;
    })
    .catch(() => {});

  await Promise.all([d1Promise, fsPromise]);

  // 3. Rollback if both persistence backends failed
  if (!d1Succeeded && !fsSucceeded) {
    if (!prevOptimisticHad) {
      activeStore.optimisticReadIds.delete(notificationId);
    }
    if (deterministicPostId) {
      activeStore.optimisticReadIds.delete(deterministicPostId);
    }
    if (prevD1Entry) {
      activeStore.d1Notifications.set(notificationId, prevD1Entry);
    }
    if (prevFsEntry) {
      activeStore.firestoreNotifications.set(notificationId, prevFsEntry);
    }
    if (!prevAnnHad) {
      activeStore.readAnnouncementIds.delete(notificationId);
    }
    emitStoreChange();
    throw new Error('Failed to mark notification as read.');
  }
}

/**
 * Mark a global announcement as read for a specific user with immediate optimistic update and rollback on failure.
 */
export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId || !announcementId) return;

  const prevHadRead = activeStore.readAnnouncementIds.has(announcementId);
  const prevOptimisticHad = activeStore.optimisticReadIds.has(announcementId);

  // 1. Optimistic update immediately
  activeStore.readAnnouncementIds.add(announcementId);
  activeStore.optimisticReadIds.add(announcementId);
  emitStoreChange();

  // 2. Persist to D1 and Firestore
  let d1Succeeded = false;
  let fsSucceeded = false;
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

  const fsCall = setDoc(
    doc(db, 'users', effectiveUserId, 'readAnnouncements', announcementId),
    {
      readAt: serverTimestamp(),
    },
    { merge: true }
  )
    .then(() => {
      fsSucceeded = true;
    })
    .catch(() => {});

  await Promise.all([...d1Calls, fsCall]);

  // 3. Rollback if both failed
  if (!d1Succeeded && !fsSucceeded) {
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

/**
 * Mark all user notifications and all announcements as read with immediate optimistic update and rollback on failure.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  userNotifications?: AppNotification[],
  announcements?: AnnouncementItem[]
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId) return;

  // Snapshot previous state for rollback if persistence fails
  const prevOptimisticReadIds = new Set(activeStore.optimisticReadIds);
  const prevReadAnnouncementIds = new Set(activeStore.readAnnouncementIds);
  const prevD1Notifications = new Map(activeStore.d1Notifications);
  const prevFsNotifications = new Map(activeStore.firestoreNotifications);

  const targetUserNotifs =
    userNotifications && userNotifications.length > 0
      ? userNotifications
      : buildSnapshot(activeStore).userNotifications;
  const targetAnnouncements =
    announcements && announcements.length > 0 ? announcements : activeStore.announcements;

  // 1. Optimistic update immediately
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

  activeStore.firestoreNotifications.forEach((n, id) => {
    activeStore.firestoreNotifications.set(id, { ...n, read: true });
    activeStore.optimisticReadIds.add(id);
  });

  emitStoreChange();

  // 2. Persist to D1 (awaited!) and Firestore
  let d1Succeeded = false;
  let fsSucceeded = false;
  const headers = await getOptionalBearerHeader();

  const announcementIds = Array.from(
    new Set([WELCOME_ANNOUNCEMENT_ID, ...targetAnnouncements.map((a) => a.id)])
  );

  const d1ReadAllPromise = Promise.all([
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
    }).then((r) => {
      if (r.ok) d1Succeeded = true;
    }),
    fetch('/api/announcements/welcome/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ userId: effectiveUserId }),
    }).then((r) => {
      if (r.ok) d1Succeeded = true;
    }),
  ]).catch(() => {});

  const fsBatchPromise = (async () => {
    try {
      const batch = writeBatch(db);
      let ops = 0;

      // Mark all unread user notifications (regardless of type!) as read in Firestore
      const unreadFsIds = new Set<string>();
      targetUserNotifs
        .filter((n) => !n.isAnnouncement && n.id !== WELCOME_ANNOUNCEMENT_ID)
        .forEach((n) => unreadFsIds.add(n.id));
      prevFsNotifications.forEach((n, id) => {
        if (!n.read) unreadFsIds.add(id);
      });

      Array.from(unreadFsIds)
        .slice(0, 200)
        .forEach((id) => {
          if (prevFsNotifications.has(id)) {
            batch.update(doc(db, 'notifications', id), {
              read: true,
              readAt: serverTimestamp(),
            });
            ops++;
          }
        });

      announcementIds.slice(0, 100).forEach((annId) => {
        batch.set(
          doc(db, 'users', effectiveUserId, 'readAnnouncements', annId),
          { readAt: serverTimestamp() },
          { merge: true }
        );
        ops++;
      });

      if (ops > 0) {
        await batch.commit();
      }
      fsSucceeded = true;
    } catch {
      // Ignore Firestore batch error if D1 succeeded
    }
  })();

  await Promise.all([d1ReadAllPromise, fsBatchPromise]);

  // 3. Rollback if both failed
  if (!d1Succeeded && !fsSucceeded) {
    activeStore.optimisticReadIds = prevOptimisticReadIds;
    activeStore.readAnnouncementIds = prevReadAnnouncementIds;
    activeStore.d1Notifications = prevD1Notifications;
    activeStore.firestoreNotifications = prevFsNotifications;
    emitStoreChange();
    throw new Error('Failed to mark all notifications as read.');
  }
}

/**
 * Fetches a paginated page of user notifications (merging D1 + Firestore).
 */
export async function fetchUserNotificationsPage(params: {
  userId: string;
  pageSize?: number;
  lastDoc?: DocumentSnapshot | null;
}): Promise<{
  notifications: AppNotification[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  const { userId, pageSize = 20, lastDoc } = params;
  if (!userId) {
    return { notifications: [], lastDoc: null, hasMore: false };
  }

  try {
    if (!lastDoc) {
      await syncUserNotificationsStore(userId);
      const snap = getNotificationStoreSnapshot(userId);
      return {
        notifications: snap.userNotifications.slice(0, pageSize),
        lastDoc: null,
        hasMore: snap.userNotifications.length > pageSize,
      };
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snap = await getDocs(q);
    const notifications: AppNotification[] = snap.docs
      .filter((d) => d.data()?.announcementId !== WELCOME_ANNOUNCEMENT_ID)
      .map((d) => {
        const data = d.data();
        const isRead = Boolean(data.read) || activeStore.optimisticReadIds.has(d.id);
        return {
          id: d.id,
          type: normalizeNotificationType(data.type),
          title: data.title || '',
          message: data.message || '',
          createdAt: data.createdAt || null,
          read: isRead,
          isPinned: Boolean(data.isPinned),
          link:
            data.link ||
            (data.postId ? `/commons/post/${data.postId}` : '/dashboard/commons'),
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatar: data.authorAvatar || null,
          authorFrame: data.authorFrame || null,
          postId: data.postId,
          postType: data.postType,
        };
      });

    const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length === pageSize;

    return { notifications, lastDoc: newLastDoc, hasMore };
  } catch (err: unknown) {
    console.warn('[notificationService] fetchUserNotificationsPage error:', err);
    return { notifications: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Listener for the unread notifications count (for header bell, bottom mobile nav bell, menu sheet).
 * Derives count strictly from the single source of truth store (`notifications.filter(n => !n.read).length`).
 */
export function subscribeToUnreadNotifications(
  userId: string,
  onCountChange: (count: number) => void
): () => void {
  return subscribeToNotificationStore(userId, (snapshot) => {
    onCountChange(snapshot.unreadCount);
  });
}
