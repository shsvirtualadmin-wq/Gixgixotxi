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
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL_SUPPORT,
  SUPER_ADMIN_UID,
  SUPER_ADMIN_NAME,
} from '@/constants/superAdmin';
import { DEFAULT_WELCOME_ANNOUNCEMENT, BOARDLY_BOT_ACCOUNTS } from '@/config/botsConfig';

export type NotificationType =
  | 'following_post'
  | 'new_follower'
  | 'follow'
  | 'following'
  | 'new_message'
  | 'comment'
  | 'reply'
  | 'like'
  | 'post_like'
  | 'announcement'
  | 'reward'
  | 'crew'
  | 'system';

export const WELCOME_ANNOUNCEMENT_ID = DEFAULT_WELCOME_ANNOUNCEMENT.id;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Timestamp | Date | number | string | null;
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
const cleanedDuplicateIds = new Set<string>();
const dedupIdAliases = new Map<string, Set<string>>();

function getLocalReadIdsKey(userId: string): string {
  return `boardly_read_notifs_v2_${userId}`;
}

function loadLocalReadIds(userId: string): Set<string> {
  if (!userId || typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(getLocalReadIdsKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map(String).filter(Boolean));
    }
  } catch {
    // Ignore storage error
  }
  return new Set();
}

function saveLocalReadIds(userId: string, ids: Iterable<string>): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const arr = Array.from(new Set(ids)).slice(-500);
    window.localStorage.setItem(getLocalReadIdsKey(userId), JSON.stringify(arr));
  } catch {
    // Ignore storage error
  }
}

export function toMillis(
  val:
    | Timestamp
    | Date
    | number
    | string
    | { seconds?: number; nanoseconds?: number; _seconds?: number }
    | null
    | undefined
): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    if (!Number.isFinite(val) || val <= 0) return 0;
    return val < 1e11 ? Math.floor(val * 1000) : val;
  }
  if (val instanceof Date) {
    const ms = val.getTime();
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return 0;
      return n < 1e11 ? Math.floor(n * 1000) : n;
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  if (typeof (val as Timestamp).toMillis === 'function') {
    try {
      const ms = (val as Timestamp).toMillis();
      return Number.isFinite(ms) && ms > 0 ? ms : 0;
    } catch {
      return 0;
    }
  }
  if (typeof (val as any).seconds === 'number' && Number.isFinite((val as any).seconds)) {
    return Math.floor((val as any).seconds * 1000);
  }
  if (typeof (val as any)._seconds === 'number' && Number.isFinite((val as any)._seconds)) {
    return Math.floor((val as any)._seconds * 1000);
  }
  return 0;
}

/**
 * Cleans up "Congratulations undefined!", null, or [object Object] template bugs in stored notifications.
 */
export function sanitizeNotificationText(rawText: unknown, fallbackName?: string | null): string {
  if (rawText === null || rawText === undefined) return '';
  let text = String(rawText).trim();
  if (!text) return '';

  const cleanFallback =
    fallbackName &&
    String(fallbackName).trim() &&
    !/^(undefined|null|\[object Object\])$/i.test(String(fallbackName).trim())
      ? String(fallbackName).trim()
      : '';

  text = text.replace(
    /Congratulations\s+(?:undefined|null|\[object Object\])\s*!/gi,
    cleanFallback ? `Congratulations ${cleanFallback}!` : 'Congratulations!'
  );
  text = text.replace(
    /Congratulations\s+(?:undefined|null|\[object Object\])\b/gi,
    cleanFallback ? `Congratulations ${cleanFallback}` : 'Congratulations'
  );
  text = text.replace(
    /^(?:undefined|null|\[object Object\])\s+started following you/i,
    `${cleanFallback || 'A student'} started following you`
  );
  text = text.replace(
    /^(?:undefined|null|\[object Object\])\s+posted:/i,
    cleanFallback ? `${cleanFallback} posted:` : 'New post:'
  );
  text = text.replace(
    /represent\s+(?:undefined|null|\[object Object\])/gi,
    'represent your institution'
  );
  text = text.replace(/\(\s*#(?:undefined|null|\[object Object\])\s*\)/gi, '');
  text = text.replace(/\s+\[object Object\]/g, '');
  return text.trim();
}

export function extractNotificationActorMeta(
  raw: Record<string, any>,
  docId?: string
): {
  authorId?: string;
  actorId?: string;
  followerId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  postId?: string;
} {
  const idStr = String(docId || raw.id || '').trim();

  let extractedFollowUid = '';
  if (idStr.startsWith('follow_')) {
    const parts = idStr.split('_');
    if (parts.length >= 3 && parts[1]) {
      extractedFollowUid = parts[1];
    }
  }

  let extractedPostId = raw.postId || raw.post_id || undefined;
  if (!extractedPostId && idStr.startsWith('post_') && idStr.includes('_follower_')) {
    const mid = idStr.slice('post_'.length, idStr.lastIndexOf('_follower_'));
    if (mid) extractedPostId = mid;
  }

  let rawName =
    raw.authorName ||
    raw.author_name ||
    raw.followerName ||
    raw.actorName ||
    raw.senderName ||
    undefined;

  const titleStr = String(raw.title || '').trim();
  if (!rawName && titleStr) {
    const postMatch = titleStr.match(/^(.+?)\s+posted:\s*/i);
    if (postMatch && postMatch[1]) {
      rawName = postMatch[1].trim();
    } else {
      const followMatch = titleStr.match(/^(.+?)\s+started following you/i);
      if (followMatch && followMatch[1]) {
        rawName = followMatch[1].trim();
      }
    }
  }

  let resolvedUid =
    raw.authorId ||
    raw.author_id ||
    raw.actorId ||
    raw.actor_id ||
    raw.followerId ||
    raw.follower_id ||
    raw.authorUid ||
    raw.senderId ||
    raw.fromUid ||
    extractedFollowUid ||
    undefined;

  if (!resolvedUid && rawName) {
    const lowerName = String(rawName).trim().toLowerCase();
    if (
      lowerName === SUPER_ADMIN_NAME.toLowerCase() ||
      lowerName === 'shs virtual academy'
    ) {
      resolvedUid = SUPER_ADMIN_UID;
    } else {
      const bot = BOARDLY_BOT_ACCOUNTS.find(
        (b) =>
          b.displayName.toLowerCase() === lowerName ||
          (b.username && b.username.toLowerCase() === lowerName)
      );
      if (bot) {
        resolvedUid = bot.uid;
      }
    }
  }

  const authorAvatar =
    raw.authorEquippedAvatar ||
    raw.equippedAvatar ||
    raw.authorAvatar ||
    raw.author_avatar ||
    raw.followerAvatar ||
    raw.actorAvatar ||
    raw.avatar ||
    raw.avatarUrl ||
    raw.photoURL ||
    null;

  const authorFrame =
    raw.authorFrame ||
    raw.author_frame ||
    raw.followerFrame ||
    raw.actorFrame ||
    raw.equippedFrame ||
    raw.frame ||
    null;

  return {
    authorId: resolvedUid ? String(resolvedUid) : undefined,
    actorId:
      raw.actorId || raw.followerId || resolvedUid
        ? String(raw.actorId || raw.followerId || resolvedUid)
        : undefined,
    followerId:
      raw.followerId || raw.actorId || resolvedUid
        ? String(raw.followerId || raw.actorId || resolvedUid)
        : undefined,
    authorName: rawName ? String(rawName) : undefined,
    authorAvatar,
    authorFrame,
    postId: extractedPostId ? String(extractedPostId) : undefined,
  };
}

export function normalizeNotificationType(
  rawType?: unknown,
  isAnnouncement?: boolean,
  title?: unknown,
  message?: unknown,
  link?: unknown,
  postId?: unknown
): NotificationType {
  const rt = String(rawType || '').trim().toLowerCase();
  if (isAnnouncement || rt === 'announcement') return 'announcement';
  if (rt === 'new_follower' || rt === 'follow' || rt === 'follower') return 'new_follower';
  if (rt === 'reward' || rt === 'koban' || rt === 'allotment') return 'reward';
  if (rt === 'crew' || rt === 'captain') return 'crew';

  const t = String(title || '').toLowerCase();
  const m = String(message || '').toLowerCase();
  const l = String(link || '').toLowerCase();
  const combined = `${t} ${m} ${l}`;

  // Detect follow notifications by text/id patterns
  if (
    t.includes('started following you') ||
    t.includes('new follower') ||
    t.includes('followed you')
  ) {
    return 'new_follower';
  }

  // Detect Reward notifications (Kobans, monthly captain allotments, referral bonus weeks)
  if (
    combined.includes('monthly allotment') ||
    combined.includes('leadership allowance') ||
    combined.includes('kobans credited') ||
    combined.includes('koban credited') ||
    /\+\d[\d,]*\s*kobans/.test(combined) ||
    combined.includes('5,000 kobans') ||
    combined.includes('bonus week of boardly pro') ||
    combined.includes('signed up using your link') ||
    combined.includes('referral bonus')
  ) {
    return 'reward';
  }

  // Detect Crew / Nakama Captain notifications
  if (
    combined.includes('welcome to boardly crew') ||
    combined.includes('boardly crew ambassador') ||
    combined.includes('campus captain approved') ||
    combined.includes('nakama captain') ||
    combined.includes('squad upgraded to large crew') ||
    combined.includes('large crew status') ||
    combined.includes('referral code is crew-') ||
    combined.includes('your code is cap-') ||
    l.includes('/crew') ||
    l.includes('/captain')
  ) {
    return 'crew';
  }

  // Detect System notifications
  if (
    rt === 'system' ||
    combined.includes('boardly pro activated') ||
    combined.includes('koban request update') ||
    combined.includes('could not be approved')
  ) {
    return 'system';
  }

  if (rt === 'comment' || rt === 'reply' || t.includes('commented on') || t.includes('replied to')) {
    return 'comment';
  }
  if (rt === 'like' || rt === 'post_like' || t.includes('liked your') || t.includes('upvoted your')) {
    return 'like';
  }
  if (
    rt === 'new_message' ||
    rt === 'message' ||
    rt === 'chat_request' ||
    rt === 'chat_request_accepted' ||
    t.includes('message request') ||
    t.includes('new message from')
  ) {
    return 'new_message';
  }

  // Post notifications
  if (
    Boolean(postId) ||
    t.includes('posted:') ||
    m.includes('published a new') ||
    l.includes('/commons/post/') ||
    rt === 'following_post' ||
    rt === 'new_post' ||
    rt === 'following'
  ) {
    return 'following_post';
  }

  return 'system';
}

function normalizeDedupToken(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Generates a semantic deduplication key so duplicate notifications (e.g. same post published
 * or fanned out twice, or duplicate Crew/Captain/Reward notifications) collapse into one card.
 */
function getSemanticDedupKey(n: AppNotification): string {
  if (n.isAnnouncement || n.type === 'announcement') {
    return `ann_${n.announcementId || n.id}`;
  }

  if (n.type === 'new_follower') {
    let actor = n.authorId || n.followerId || n.actorId || '';
    if (!actor && n.id.startsWith('follow_')) {
      const parts = n.id.split('_');
      if (parts.length >= 3) actor = parts[1];
    }
    if (!actor) actor = normalizeDedupToken(n.title);
    return `follow_${actor}`;
  }

  if (n.type === 'following_post') {
    const cleanTitle = normalizeDedupToken(
      n.title.includes('posted:') ? n.title.split('posted:').slice(1).join(' ') : n.title
    );
    const cleanMsgPrefix = normalizeDedupToken(n.message).slice(0, 60);
    const authorKey = normalizeDedupToken(n.authorId || n.authorName || '');
    // If title is generic like "important", combine with message prefix so distinct posts aren't merged,
    // while identical posts ("IMPORTANT Russian Open Doors Scholarship" or "Harvard courses") merge cleanly.
    const contentSig =
      cleanTitle.length >= 12 ? cleanTitle : `${cleanTitle}_${cleanMsgPrefix}`;
    if (contentSig) {
      return `post_sig_${authorKey}_${contentSig}`;
    }
    if (n.postId) {
      return `post_id_${n.postId}`;
    }
  }

  return `${n.type}_${normalizeDedupToken(n.title)}_${normalizeDedupToken(n.message).slice(0, 80)}`;
}

function buildSnapshot(state: InternalStoreState): NotificationStoreSnapshot {
  const rawList: AppNotification[] = [];

  state.d1Notifications.forEach((n, id) => {
    const isRead = Boolean(n.read) || state.optimisticReadIds.has(id);
    rawList.push({ ...n, id, read: isRead });
  });

  state.firestoreNotifications.forEach((n, id) => {
    const isRead = Boolean(n.read) || state.optimisticReadIds.has(id);
    rawList.push({ ...n, id, read: isRead });
  });

  const semanticMap = new Map<string, AppNotification>();
  const postIdToKey = new Map<string, string>();
  dedupIdAliases.clear();

  for (const raw of rawList) {
    const sanitizedTitle = sanitizeNotificationText(raw.title, raw.authorName);
    const sanitizedMessage = sanitizeNotificationText(raw.message, raw.authorName);
    const resolvedType = normalizeNotificationType(
      raw.type,
      raw.isAnnouncement,
      sanitizedTitle,
      sanitizedMessage,
      raw.link,
      raw.postId
    );

    const n: AppNotification = {
      ...raw,
      type: resolvedType,
      title: sanitizedTitle,
      message: sanitizedMessage,
    };

    let semKey = getSemanticDedupKey(n);
    if (n.postId && postIdToKey.has(n.postId)) {
      semKey = postIdToKey.get(n.postId)!;
    } else if (n.postId) {
      postIdToKey.set(n.postId, semKey);
    }

    const existing = semanticMap.get(semKey);
    if (!existing) {
      const aliasSet = new Set<string>([n.id]);
      if (n.postId && state.userId) {
        aliasSet.add(`post_${n.postId}_follower_${state.userId}`);
      }
      const isRead =
        Boolean(n.read) ||
        Array.from(aliasSet).some((aid) => state.optimisticReadIds.has(aid));
      semanticMap.set(semKey, { ...n, read: isRead });
      dedupIdAliases.set(n.id, aliasSet);
    } else {
      const aliasSet = dedupIdAliases.get(existing.id) || new Set<string>([existing.id]);
      aliasSet.add(n.id);
      if (n.postId && state.userId) {
        aliasSet.add(`post_${n.postId}_follower_${state.userId}`);
      }
      const combinedRead =
        Boolean(existing.read) ||
        Boolean(n.read) ||
        Array.from(aliasSet).some((aid) => state.optimisticReadIds.has(aid));

      const existingMs = toMillis(existing.createdAt);
      const incomingMs = toMillis(n.createdAt);
      const bestCreatedAt =
        existingMs >= incomingMs && existingMs > 0
          ? existing.createdAt
          : incomingMs > 0
          ? n.createdAt
          : existing.createdAt || n.createdAt;

      // Prefer deterministic ID as the primary ID when available
      const preferIncomingId =
        !existing.id.startsWith('post_') &&
        !existing.id.startsWith('follow_') &&
        (n.id.startsWith('post_') || n.id.startsWith('follow_'));
      const primaryId = preferIncomingId ? n.id : existing.id;

      const merged: AppNotification = {
        ...existing,
        ...n,
        id: primaryId,
        type: existing.type !== 'system' ? existing.type : n.type,
        title: existing.title.length >= n.title.length ? existing.title : n.title,
        message: existing.message.length >= n.message.length ? existing.message : n.message,
        createdAt: bestCreatedAt,
        read: combinedRead,
        authorId: existing.authorId || n.authorId || existing.actorId || n.actorId || existing.followerId || n.followerId,
        actorId: existing.actorId || n.actorId || existing.authorId || n.authorId,
        followerId: existing.followerId || n.followerId || existing.authorId || n.authorId,
        authorName: existing.authorName || n.authorName,
        authorAvatar: existing.authorAvatar || n.authorAvatar || null,
        authorFrame: existing.authorFrame || n.authorFrame || null,
        postId: existing.postId || n.postId,
        postSlug: existing.postSlug || n.postSlug,
        postType: existing.postType || n.postType,
      };
      semanticMap.set(semKey, merged);
      dedupIdAliases.set(primaryId, aliasSet);
    }
  }

  // Sort user notifications strictly by real createdAt timestamp (newest first)
  const userNotifications = Array.from(semanticMap.values()).sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );

  // Deduplicate announcements by ID and sanitize text
  const seenAnnIds = new Set<string>();
  const announcementNotifications: AppNotification[] = [];
  for (const a of state.announcements) {
    if (!a.id || seenAnnIds.has(a.id)) continue;
    seenAnnIds.add(a.id);
    const isPinnedWelcome = a.id === WELCOME_ANNOUNCEMENT_ID || Boolean(a.isPinned);
    const isRead =
      state.readAnnouncementIds.has(a.id) || state.optimisticReadIds.has(a.id);
    announcementNotifications.push({
      id: a.id,
      type: 'announcement',
      title: sanitizeNotificationText(a.title),
      message: sanitizeNotificationText(a.message),
      createdAt: a.createdAt,
      read: isRead,
      isPinned: isPinnedWelcome,
      isAnnouncement: true,
      announcementId: a.id,
      publishedBy: a.authorName || 'Superadmin',
    });
  }

  // Sort all notifications strictly by their real createdAt timestamp (newest first)
  const combined = [...announcementNotifications, ...userNotifications].sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );

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
      if (!activeStore.initialized) {
        void ensureWelcomeNotificationForUser(userId).catch(() => {});
      }
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
          // Only fetch one-time Firestore notifications if real-time listener is not already active
          activeFirestoreUnsub
            ? Promise.resolve(null)
            : getDocs(
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
          const rawCreated = item.createdAtMs ?? item.createdAt ?? null;
          const parsedMs = toMillis(rawCreated);
          const actorMeta = extractNotificationActorMeta(item, id);
          const cleanTitle = sanitizeNotificationText(item.title, actorMeta.authorName);
          const cleanMsg = sanitizeNotificationText(item.message, actorMeta.authorName);
          nextD1Map.set(id, {
            id,
            type: normalizeNotificationType(
              item.type,
              false,
              cleanTitle,
              cleanMsg,
              item.link,
              actorMeta.postId
            ),
            title: cleanTitle,
            message: cleanMsg,
            createdAt: parsedMs > 0 ? parsedMs : rawCreated,
            read: isRead,
            isPinned: Boolean(item.isPinned),
            link: item.link || null,
            authorId: actorMeta.authorId,
            actorId: actorMeta.actorId,
            followerId: actorMeta.followerId,
            authorName: actorMeta.authorName,
            authorAvatar: actorMeta.authorAvatar,
            authorFrame: actorMeta.authorFrame,
            postId: actorMeta.postId,
            postSlug: item.postSlug,
            postType: item.postType,
          });
        }
        activeStore.d1Notifications = nextD1Map;
      }

      // Update Firestore notifications map if snapshot was fetched
      if (fsNotifSnap) {
        const nextFsMap = new Map<string, AppNotification>();
        const seenSemKeys = new Map<string, string>();
        const dupIdsToDelete: string[] = [];

        fsNotifSnap.docs.forEach((d) => {
          const data = d.data();
          if (data?.announcementId === WELCOME_ANNOUNCEMENT_ID) return;
          const isRead = Boolean(data.read) || activeStore.optimisticReadIds.has(d.id);
          if (isRead) {
            activeStore.optimisticReadIds.add(d.id);
          }
          const actorMeta = extractNotificationActorMeta(data, d.id);
          const cleanTitle = sanitizeNotificationText(data.title, actorMeta.authorName);
          const cleanMsg = sanitizeNotificationText(data.message, actorMeta.authorName);
          const notifItem: AppNotification = {
            id: d.id,
            type: normalizeNotificationType(
              data.type,
              false,
              cleanTitle,
              cleanMsg,
              data.link,
              actorMeta.postId
            ),
            title: cleanTitle,
            message: cleanMsg,
            createdAt: data.createdAt || data.createdAtMs || null,
            read: isRead,
            isPinned: Boolean(data.isPinned),
            link: data.link || null,
            authorId: actorMeta.authorId,
            actorId: actorMeta.actorId,
            followerId: actorMeta.followerId,
            authorName: actorMeta.authorName,
            authorAvatar: actorMeta.authorAvatar,
            authorFrame: actorMeta.authorFrame,
            postId: actorMeta.postId,
            postSlug: data.postSlug,
            postType: data.postType,
          };
          const semKey = getSemanticDedupKey(notifItem);
          if (seenSemKeys.has(semKey)) {
            if (!cleanedDuplicateIds.has(d.id)) {
              cleanedDuplicateIds.add(d.id);
              dupIdsToDelete.push(d.id);
            }
          } else {
            seenSemKeys.set(semKey, d.id);
          }
          nextFsMap.set(d.id, notifItem);
        });
        activeStore.firestoreNotifications = nextFsMap;

        if (dupIdsToDelete.length > 0) {
          void Promise.all(
            dupIdsToDelete.slice(0, 25).map((dupId) =>
              deleteDoc(doc(db, 'notifications', dupId)).catch(() => {})
            )
          );
        }
      }

      saveLocalReadIds(userId, [
        ...activeStore.optimisticReadIds,
        ...activeStore.readAnnouncementIds,
      ]);
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

  const cachedReadIds = loadLocalReadIds(userId);
  activeStore = {
    userId,
    d1Notifications: new Map(),
    firestoreNotifications: new Map(),
    optimisticReadIds: new Set(cachedReadIds),
    announcements: [],
    readAnnouncementIds: new Set(cachedReadIds),
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
        const seenSemKeys = new Map<string, string>();
        const dupIdsToDelete: string[] = [];

        snap.docs.forEach((d) => {
          const data = d.data();
          if (data?.announcementId === WELCOME_ANNOUNCEMENT_ID) return;
          const isRead = Boolean(data.read) || activeStore.optimisticReadIds.has(d.id);
          if (isRead) {
            activeStore.optimisticReadIds.add(d.id);
          }
          const actorMeta = extractNotificationActorMeta(data, d.id);
          const cleanTitle = sanitizeNotificationText(data.title, actorMeta.authorName);
          const cleanMsg = sanitizeNotificationText(data.message, actorMeta.authorName);
          const notifItem: AppNotification = {
            id: d.id,
            type: normalizeNotificationType(
              data.type,
              false,
              cleanTitle,
              cleanMsg,
              data.link,
              actorMeta.postId
            ),
            title: cleanTitle,
            message: cleanMsg,
            createdAt: data.createdAt || data.createdAtMs || null,
            read: isRead,
            isPinned: Boolean(data.isPinned),
            link: data.link || null,
            authorId: actorMeta.authorId,
            actorId: actorMeta.actorId,
            followerId: actorMeta.followerId,
            authorName: actorMeta.authorName,
            authorAvatar: actorMeta.authorAvatar,
            authorFrame: actorMeta.authorFrame,
            postId: actorMeta.postId,
            postSlug: data.postSlug,
            postType: data.postType,
          };
          const semKey = getSemanticDedupKey(notifItem);
          if (seenSemKeys.has(semKey)) {
            if (!cleanedDuplicateIds.has(d.id)) {
              cleanedDuplicateIds.add(d.id);
              dupIdsToDelete.push(d.id);
            }
          } else {
            seenSemKeys.set(semKey, d.id);
          }
          nextFsMap.set(d.id, notifItem);
        });
        activeStore.firestoreNotifications = nextFsMap;
        emitStoreChange();

        if (dupIdsToDelete.length > 0) {
          void Promise.all(
            dupIdsToDelete.slice(0, 25).map((dupId) =>
              deleteDoc(doc(db, 'notifications', dupId)).catch(() => {})
            )
          );
        }
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
    if (activeStore.userId === userId && storeSubscribers.size > 0) {
      void syncUserNotificationsStore(userId);
    }
  }, 60000);
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
    if (storeSubscribers.size === 0) {
      if (activeFirestoreUnsub) {
        activeFirestoreUnsub();
        activeFirestoreUnsub = null;
      }
      if (activePollTimer) {
        clearInterval(activePollTimer);
        activePollTimer = null;
      }
      activeStore.userId = '';
    }
  };
}

/**
 * Mark a single user notification as read with immediate optimistic update and persistence across all alias IDs.
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

  const prevD1Entry = activeStore.d1Notifications.get(notificationId);
  const prevFsEntry = activeStore.firestoreNotifications.get(notificationId);
  const targetPostId = prevD1Entry?.postId || prevFsEntry?.postId;
  const deterministicPostId =
    targetPostId && userId ? `post_${targetPostId}_follower_${userId}` : null;

  const allTargetIds = new Set<string>([notificationId]);
  if (deterministicPostId) allTargetIds.add(deterministicPostId);
  const aliases = dedupIdAliases.get(notificationId);
  if (aliases) {
    aliases.forEach((aid) => allTargetIds.add(aid));
  }

  // 1. Optimistic update immediately
  allTargetIds.forEach((id) => {
    activeStore.optimisticReadIds.add(id);
    const d1Item = activeStore.d1Notifications.get(id);
    if (d1Item) {
      activeStore.d1Notifications.set(id, { ...d1Item, read: true });
    }
    const fsItem = activeStore.firestoreNotifications.get(id);
    if (fsItem) {
      activeStore.firestoreNotifications.set(id, { ...fsItem, read: true });
    }
  });
  saveLocalReadIds(userId, [
    ...activeStore.optimisticReadIds,
    ...activeStore.readAnnouncementIds,
  ]);
  emitStoreChange();

  // 2. Update database (D1 + Firestore) across all alias IDs
  const headers = await getOptionalBearerHeader();
  const d1Promises = userId
    ? Array.from(allTargetIds).map((id) =>
        fetch('/api/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({
            userId,
            notificationId: id,
          }),
        }).catch(() => {})
      )
    : [];

  const fsPromises = Array.from(allTargetIds).map((id) =>
    updateDoc(doc(db, 'notifications', id), {
      read: true,
      readAt: serverTimestamp(),
    }).catch(() => {})
  );

  await Promise.all([...d1Promises, ...fsPromises]);
}

/**
 * Mark a global announcement as read for a specific user with immediate optimistic update.
 */
export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId || !announcementId) return;

  // 1. Optimistic update immediately
  activeStore.readAnnouncementIds.add(announcementId);
  activeStore.optimisticReadIds.add(announcementId);
  saveLocalReadIds(effectiveUserId, [
    ...activeStore.optimisticReadIds,
    ...activeStore.readAnnouncementIds,
  ]);
  emitStoreChange();

  // 2. Persist to D1 and Firestore
  const headers = await getOptionalBearerHeader();

  const d1Calls: Promise<unknown>[] = [
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
    }).catch(() => {}),
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
      }).catch(() => {})
    );
  }

  const fsCall = setDoc(
    doc(db, 'users', effectiveUserId, 'readAnnouncements', announcementId),
    {
      readAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});

  await Promise.all([...d1Calls, fsCall]);
}

/**
 * Mark all user notifications and all announcements as read with immediate optimistic update.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  userNotifications?: AppNotification[],
  announcements?: AnnouncementItem[]
): Promise<void> {
  const effectiveUserId = userId || activeStore.userId || auth.currentUser?.uid || '';
  if (!effectiveUserId) return;

  const snapNow = buildSnapshot(activeStore);
  const targetUserNotifs =
    userNotifications && userNotifications.length > 0
      ? userNotifications
      : snapNow.userNotifications;
  const targetAnnouncements =
    announcements && announcements.length > 0 ? announcements : activeStore.announcements;

  // 1. Optimistic update immediately
  activeStore.readAnnouncementIds.add(WELCOME_ANNOUNCEMENT_ID);
  activeStore.optimisticReadIds.add(WELCOME_ANNOUNCEMENT_ID);

  for (const a of targetAnnouncements) {
    activeStore.readAnnouncementIds.add(a.id);
    activeStore.optimisticReadIds.add(a.id);
  }

  for (const n of snapNow.notifications) {
    activeStore.optimisticReadIds.add(n.id);
    if (n.isAnnouncement || n.announcementId) {
      activeStore.readAnnouncementIds.add(n.announcementId || n.id);
    }
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

  saveLocalReadIds(effectiveUserId, [
    ...activeStore.optimisticReadIds,
    ...activeStore.readAnnouncementIds,
  ]);
  emitStoreChange();

  // 2. Persist to D1 and Firestore
  const headers = await getOptionalBearerHeader();

  const announcementIds = Array.from(
    new Set([
      WELCOME_ANNOUNCEMENT_ID,
      ...targetAnnouncements.map((a) => a.id),
      ...Array.from(activeStore.readAnnouncementIds),
    ])
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
    }).catch(() => {}),
    fetch('/api/announcements/welcome/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ userId: effectiveUserId }),
    }).catch(() => {}),
  ]).catch(() => {});

  const fsBatchPromise = (async () => {
    try {
      const batch = writeBatch(db);
      let ops = 0;

      const unreadFsIds = new Set<string>();
      targetUserNotifs
        .filter((n) => !n.isAnnouncement && n.id !== WELCOME_ANNOUNCEMENT_ID)
        .forEach((n) => unreadFsIds.add(n.id));
      activeStore.firestoreNotifications.forEach((_n, id) => {
        unreadFsIds.add(id);
      });

      Array.from(unreadFsIds)
        .slice(0, 200)
        .forEach((id) => {
          if (activeStore.firestoreNotifications.has(id)) {
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
    } catch {
      // Ignore Firestore batch error
    }
  })();

  await Promise.all([d1ReadAllPromise, fsBatchPromise]);
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
        const actorMeta = extractNotificationActorMeta(data, d.id);
        const cleanTitle = sanitizeNotificationText(data.title, actorMeta.authorName);
        const cleanMsg = sanitizeNotificationText(data.message, actorMeta.authorName);
        return {
          id: d.id,
          type: normalizeNotificationType(
            data.type,
            false,
            cleanTitle,
            cleanMsg,
            data.link,
            actorMeta.postId
          ),
          title: cleanTitle,
          message: cleanMsg,
          createdAt: data.createdAt || data.createdAtMs || null,
          read: isRead,
          isPinned: Boolean(data.isPinned),
          link: data.link || null,
          authorId: actorMeta.authorId,
          actorId: actorMeta.actorId,
          followerId: actorMeta.followerId,
          authorName: actorMeta.authorName,
          authorAvatar: actorMeta.authorAvatar,
          authorFrame: actorMeta.authorFrame,
          postId: actorMeta.postId,
          postSlug: data.postSlug,
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
