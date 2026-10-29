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
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAIL_SUPPORT, SUPER_ADMIN_UID } from '@/constants/superAdmin';
import { DEFAULT_WELCOME_ANNOUNCEMENT } from '@/config/botsConfig';

export type NotificationType = 'following' | 'announcement';

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
  // Specific to following:
  authorId?: string;
  authorName?: string;
  postId?: string;
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

const unreadRefreshSubscribers = new Set<() => void>();

export function triggerUnreadNotificationsRefresh(): void {
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
 * with Firestore fallback.
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
          createdAt: a.updatedAtMs || a.createdAtMs || Date.now(),
        };
      }
      if (data?.userStatus) {
        userStatus = {
          welcomed: Boolean(data.userStatus.welcomed),
          read: Boolean(data.userStatus.read),
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
 * Ensures every user (both newly registered and existing users who have not seen it)
 * receives the pinned "Welcome to Boardly" announcement once as an unread notification.
 * Stores `welcomed = true` on `users/{uid}` and in D1 `user_welcome_status` so it is never duplicated.
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

    const welcomeTitle = d1Resp?.announcement?.title || DEFAULT_WELCOME_ANNOUNCEMENT.title;
    const welcomeMessage = d1Resp?.announcement?.message || DEFAULT_WELCOME_ANNOUNCEMENT.message;

    // Also persist welcomed flag on Firestore user profile so it is never duplicated across devices
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

    // Ensure welcome announcement doc exists in Firestore if possible
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

    invalidateAnnouncementsCache();
    triggerUnreadNotificationsRefresh();
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
export async function fetchAnnouncements(limitCount = 50): Promise<AnnouncementItem[]> {
  if (cachedAnnouncements && Date.now() < cachedAnnouncements.expires) {
    return cachedAnnouncements.data.slice(0, limitCount);
  }

  try {
    const [{ announcement: welcomeItem }, snap] = await Promise.all([
      fetchWelcomeAnnouncement(),
      getDocs(
        query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(limitCount))
      ).catch(() => null),
    ]);

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
    cachedAnnouncements = { data: list, expires: Date.now() + 60000 };
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
 * Creates notifications for all followers of a user when they post non-anonymously.
 * Guaranteed never called if the post is anonymous.
 */
export async function notifyFollowersOfPost(params: {
  followerUids: string[];
  authorId: string;
  authorName: string;
  postId: string;
  postTitle: string;
  isAnonymous?: boolean;
}): Promise<void> {
  if (params.isAnonymous) {
    return;
  }

  const { followerUids, authorId, authorName, postId, postTitle } = params;
  if (!followerUids || followerUids.length === 0) return;

  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const followerUid of followerUids) {
      if (!followerUid || followerUid === authorId) continue;
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userId: followerUid,
        type: 'following',
        title: `${authorName} shared study material in Commons`,
        message: postTitle ? `"${postTitle.slice(0, 100)}"` : 'Shared a new resource in Commons.',
        link: '/dashboard/commons',
        authorId,
        authorName,
        postId,
        read: false,
        createdAt: serverTimestamp(),
      });
      count++;
      if (count >= 400) break;
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (err: unknown) {
    console.warn('[notificationService] Failed to notify followers:', err);
  }
}

/**
 * Fetches the IDs of announcements that the current user has already marked as read.
 */
export async function fetchReadAnnouncementIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const readSet = new Set<string>();

  try {
    const [snap, welcomeRes] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'readAnnouncements')).catch(() => null),
      fetchWelcomeAnnouncement(userId).catch(() => null),
    ]);

    if (snap) {
      snap.docs.forEach((d) => readSet.add(d.id));
    }
    if (welcomeRes?.userStatus?.read) {
      readSet.add(WELCOME_ANNOUNCEMENT_ID);
    }
  } catch (err: unknown) {
    console.warn('[notificationService] Failed to fetch read announcements:', err);
  }

  return readSet;
}

/**
 * Mark a single user notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    console.warn('[notificationService] Error marking notification as read:', err);
  } finally {
    triggerUnreadNotificationsRefresh();
  }
}

/**
 * Mark a global announcement as read for a specific user.
 */
export async function markAnnouncementAsRead(userId: string, announcementId: string): Promise<void> {
  if (!userId || !announcementId) return;
  try {
    if (announcementId === WELCOME_ANNOUNCEMENT_ID) {
      const headers = await getOptionalBearerHeader();
      await fetch('/api/announcements/welcome/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    }

    await setDoc(doc(db, 'users', userId, 'readAnnouncements', announcementId), {
      readAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    console.warn('[notificationService] Error marking announcement as read:', err);
  } finally {
    triggerUnreadNotificationsRefresh();
  }
}

/**
 * Mark all user notifications and all announcements as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  userNotifications: AppNotification[],
  announcements: AnnouncementItem[]
): Promise<void> {
  if (!userId) return;

  try {
    const headers = await getOptionalBearerHeader();
    void fetch('/api/announcements/welcome/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ userId }),
    }).catch(() => {});

    const batch = writeBatch(db);

    userNotifications
      .filter((n) => !n.read && n.type === 'following')
      .slice(0, 200)
      .forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), {
          read: true,
          readAt: serverTimestamp(),
        });
      });

    announcements.slice(0, 100).forEach((a) => {
      batch.set(
        doc(db, 'users', userId, 'readAnnouncements', a.id),
        { readAt: serverTimestamp() },
        { merge: true }
      );
    });

    await batch.commit();
  } catch (err: unknown) {
    console.warn('[notificationService] Error marking all as read:', err);
  } finally {
    triggerUnreadNotificationsRefresh();
  }
}

/**
 * Fetches a paginated page of user notifications.
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
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const snap = await getDocs(q);
    const notifications: AppNotification[] = snap.docs
      .filter((d) => d.data()?.announcementId !== WELCOME_ANNOUNCEMENT_ID)
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: (data.type as NotificationType) || 'following',
          title: data.title || '',
          message: data.message || '',
          createdAt: data.createdAt || null,
          read: Boolean(data.read),
          isPinned: Boolean(data.isPinned),
          link: data.link || '/dashboard/commons',
          authorId: data.authorId,
          authorName: data.authorName,
          postId: data.postId,
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
 * Listener for the unread notifications count (for bottom nav and header bell badge).
 */
export function subscribeToUnreadNotifications(
  userId: string,
  onCountChange: (count: number) => void
): () => void {
  if (!userId) {
    onCountChange(0);
    return () => {};
  }

  let unreadNotificationsCount = 0;
  let unreadAnnouncementsCount = 0;

  const updateGrandTotal = () => {
    onCountChange(unreadNotificationsCount + unreadAnnouncementsCount);
  };

  const qNotif = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    limit(50)
  );

  const checkAllUnread = async () => {
    try {
      await ensureWelcomeNotificationForUser(userId);
      const [notifSnap, announcements, readSet] = await Promise.all([
        getDocs(qNotif).catch(() => null),
        fetchAnnouncements(20),
        fetchReadAnnouncementIds(userId),
      ]);
      if (notifSnap) {
        unreadNotificationsCount = notifSnap.docs.filter(
          (d) => d.data()?.announcementId !== WELCOME_ANNOUNCEMENT_ID
        ).length;
      }
      unreadAnnouncementsCount = announcements.filter((a) => !readSet.has(a.id)).length;
      updateGrandTotal();
    } catch {
      // Ignore background errors
    }
  };

  void checkAllUnread();
  unreadRefreshSubscribers.add(checkAllUnread);
  const timer = setInterval(checkAllUnread, 45000);

  return () => {
    unreadRefreshSubscribers.delete(checkAllUnread);
    clearInterval(timer);
  };
}
