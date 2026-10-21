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
import { db } from '@/lib/firebase';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAIL_SUPPORT, SUPER_ADMIN_UID } from '@/constants/superAdmin';

export type NotificationType = 'following' | 'announcement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Timestamp | Date | number | null;
  read: boolean;
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
  authorId: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | null;
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
    authorId: adminUser.uid,
    authorEmail: adminUser.email || '',
    authorName: adminUser.displayName || 'Superadmin',
    createdAt: serverTimestamp(),
  });

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
}

/**
 * Fetches all global announcements ordered newest first.
 */
export async function fetchAnnouncements(limitCount = 50): Promise<AnnouncementItem[]> {
  try {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || '',
        message: data.message || '',
        authorId: data.authorId || '',
        authorEmail: data.authorEmail || '',
        authorName: data.authorName || 'Superadmin',
        createdAt: data.createdAt || null,
      };
    });
  } catch (err: unknown) {
    console.warn('[notificationService] Error fetching announcements:', err);
    return [];
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
  // CRITICAL PRIVACY CHECK: If anonymous, NEVER notify
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
      // Firestore batch limit is 500
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
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'readAnnouncements'));
    return new Set(snap.docs.map((d) => d.id));
  } catch (err: unknown) {
    console.warn('[notificationService] Failed to fetch read announcements:', err);
    return new Set();
  }
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
  }
}

/**
 * Mark a global announcement as read for a specific user.
 */
export async function markAnnouncementAsRead(userId: string, announcementId: string): Promise<void> {
  if (!userId || !announcementId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'readAnnouncements', announcementId), {
      readAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    console.warn('[notificationService] Error marking announcement as read:', err);
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
    const batch = writeBatch(db);

    // 1. Mark unread user notifications
    userNotifications
      .filter((n) => !n.read && n.type === 'following')
      .slice(0, 200)
      .forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), {
          read: true,
          readAt: serverTimestamp(),
        });
      });

    // 2. Mark announcements as read in user's readAnnouncements subcollection
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
    const notifications: AppNotification[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: (data.type as NotificationType) || 'following',
        title: data.title || '',
        message: data.message || '',
        createdAt: data.createdAt || null,
        read: Boolean(data.read),
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
 * Real-time listener for the unread notifications count (for bottom nav bell badge).
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

  // 1. Listen for unread following notifications
  const qNotif = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const unsubNotif = onSnapshot(
    qNotif,
    (snap) => {
      unreadNotificationsCount = snap.size;
      updateGrandTotal();
    },
    (err) => {
      console.warn('[notificationService] Unread notif snapshot error:', err);
    }
  );

  // 2. Poll / check announcements against readAnnouncements
  const checkAnnouncements = async () => {
    try {
      const [announcements, readSet] = await Promise.all([
        fetchAnnouncements(20),
        fetchReadAnnouncementIds(userId),
      ]);
      const unread = announcements.filter((a) => !readSet.has(a.id)).length;
      unreadAnnouncementsCount = unread;
      updateGrandTotal();
    } catch {
      // Ignore background errors
    }
  };

  checkAnnouncements();
  const timer = setInterval(checkAnnouncements, 45000);

  return () => {
    unsubNotif();
    clearInterval(timer);
  };
}
