import type { AppNotification, NotificationType } from '@/services/notificationService';

export type NotificationDisplayCategory =
  | 'follower'
  | 'post'
  | 'announcement'
  | 'reward'
  | 'crew'
  | 'system';

export type NotificationFilterBucket =
  | 'following'
  | 'announcements'
  | 'rewards'
  | 'system';

export type NotificationFilterTab = 'all' | NotificationFilterBucket;

export const NOTIFICATION_FILTER_BUCKETS: readonly NotificationFilterBucket[] = [
  'following',
  'announcements',
  'rewards',
  'system',
] as const;

export interface NotificationFilterCounts {
  all: number;
  following: number;
  announcements: number;
  rewards: number;
  system: number;
}

/**
 * Pure total classifier mapping every notification display category to strictly one
 * filter tab bucket so that the sum of non-All buckets always equals the All count.
 */
export function resolveNotificationFilterBucketFromCategory(
  category: NotificationDisplayCategory
): NotificationFilterBucket {
  switch (category) {
    case 'announcement':
      return 'announcements';
    case 'follower':
    case 'post':
      return 'following';
    case 'reward':
    case 'crew':
      return 'rewards';
    case 'system':
    default:
      return 'system';
  }
}

export function resolveNotificationDisplayCategory(
  notif: Pick<
    AppNotification,
    'type' | 'isAnnouncement' | 'title' | 'message' | 'link' | 'postId'
  >,
  normalizeTypeFn?: (
    rawType?: unknown,
    isAnnouncement?: boolean,
    title?: unknown,
    message?: unknown,
    link?: unknown,
    postId?: unknown
  ) => NotificationType
): NotificationDisplayCategory {
  if (notif.isAnnouncement || notif.type === 'announcement') {
    return 'announcement';
  }
  const normalized = normalizeTypeFn
    ? normalizeTypeFn(
        notif.type,
        notif.isAnnouncement,
        notif.title,
        notif.message,
        notif.link,
        notif.postId
      )
    : notif.type;

  if (normalized === 'announcement') return 'announcement';
  if (normalized === 'new_follower' || normalized === 'follow') return 'follower';
  if (normalized === 'reward') return 'reward';
  if (normalized === 'crew') return 'crew';
  if (
    normalized === 'following_post' ||
    normalized === 'following' ||
    normalized === 'comment' ||
    normalized === 'reply' ||
    normalized === 'like' ||
    normalized === 'post_like'
  ) {
    return 'post';
  }
  return 'system';
}

export function resolveNotificationFilterBucket(
  notif: Pick<
    AppNotification,
    'type' | 'isAnnouncement' | 'title' | 'message' | 'link' | 'postId'
  >,
  normalizeTypeFn?: (
    rawType?: unknown,
    isAnnouncement?: boolean,
    title?: unknown,
    message?: unknown,
    link?: unknown,
    postId?: unknown
  ) => NotificationType
): NotificationFilterBucket {
  return resolveNotificationFilterBucketFromCategory(
    resolveNotificationDisplayCategory(notif, normalizeTypeFn)
  );
}

export function computeNotificationFilterCounts<
  T extends Pick<
    AppNotification,
    'type' | 'isAnnouncement' | 'title' | 'message' | 'link' | 'postId'
  >,
>(
  items: readonly T[],
  resolveCategory?: (item: T) => NotificationDisplayCategory
): NotificationFilterCounts {
  const counts: NotificationFilterCounts = {
    all: items.length,
    following: 0,
    announcements: 0,
    rewards: 0,
    system: 0,
  };

  for (const item of items) {
    const category = resolveCategory
      ? resolveCategory(item)
      : resolveNotificationDisplayCategory(item);
    const bucket = resolveNotificationFilterBucketFromCategory(category);
    counts[bucket] += 1;
  }

  return counts;
}

export function filterNotificationsByTab<
  T extends Pick<
    AppNotification,
    'type' | 'isAnnouncement' | 'title' | 'message' | 'link' | 'postId'
  >,
>(
  items: readonly T[],
  filter: NotificationFilterTab,
  resolveCategory?: (item: T) => NotificationDisplayCategory
): T[] {
  if (filter === 'all') return items as T[];
  return items.filter((item) => {
    const category = resolveCategory
      ? resolveCategory(item)
      : resolveNotificationDisplayCategory(item);
    return resolveNotificationFilterBucketFromCategory(category) === filter;
  });
}

// ---------------------------------------------------------------------------
// Semantic Deduplication
// ---------------------------------------------------------------------------

const GENERIC_POST_BODY_PATTERN =
  /^(?:.+\s+)?(?:published a new\b.*|shared a new\b.*|posted a new\b.*|created a new\b.*|tap to (?:view|read|open)\b.*|click to (?:view|read|open)\b.*|view post\b.*)$/i;

const LEADING_ALERT_WORD_PATTERN =
  /^(?:important|urgent|alert|notice|breaking|update|announcement|reminder)\s+/i;

const AUTHOR_POSTED_PREFIX_PATTERN =
  /^.+?\s+(?:posted|shared|published):\s*/i;

export function stripNotificationMarkdownAndUrls(raw: string): string {
  if (!raw) return '';
  let text = String(raw);

  // Convert markdown links [label](https://...) -> label
  text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]+\)/gi, '$1');

  // Remove standalone raw URLs
  text = text.replace(/https?:\/\/[^\s)]+/gi, ' ');
  text = text.replace(/\bwww\.[^\s)]+/gi, ' ');

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

  return text.replace(/\s+/g, ' ').trim();
}

export function normalizeDedupWords(raw: string): string {
  return stripNotificationMarkdownAndUrls(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface NotificationContentFingerprint {
  category: NotificationDisplayCategory;
  isPostOrAnnouncement: boolean;
  announcementId: string;
  postId: string;
  followerUid: string;
  followerName: string;
  authorId: string;
  cleanTitle: string;
  nonRedundantBody: string;
  canonicalCombined: string;
  canonicalNoAlertPrefix: string;
  titleWordCount: number;
  significantTokens: Set<string>;
}

function extractPostId(n: AppNotification): string {
  if (n.postId && String(n.postId).trim()) {
    return String(n.postId).trim();
  }
  if (n.id.startsWith('post_') && n.id.includes('_follower_')) {
    const extracted = n.id.slice('post_'.length, n.id.lastIndexOf('_follower_')).trim();
    if (extracted) return extracted;
  }
  return '';
}

function extractFollowerActor(n: AppNotification): { uid: string; name: string } {
  let uid = String(n.authorId || n.followerId || n.actorId || '').trim();
  if (!uid && n.id.startsWith('follow_')) {
    const parts = n.id.split('_');
    if (parts.length >= 3 && parts[1]) {
      uid = parts[1].trim();
    }
  }
  let name = normalizeDedupWords(n.authorName || '');
  if (!name) {
    const title = stripNotificationMarkdownAndUrls(n.title || '');
    const m = title.match(/^(.+?)\s+(?:started following you|followed you)/i);
    if (m && m[1]) {
      name = normalizeDedupWords(m[1]);
    }
  }
  return { uid, name };
}

function buildContentFingerprint(
  n: AppNotification,
  category: NotificationDisplayCategory
): NotificationContentFingerprint {
  const rawTitle = stripNotificationMarkdownAndUrls(n.title || '');
  const rawMessage = stripNotificationMarkdownAndUrls(
    n.message || (n as { body?: string }).body || ''
  );

  const coreTitleRaw = rawTitle.replace(AUTHOR_POSTED_PREFIX_PATTERN, '').trim();
  const cleanTitle = normalizeDedupWords(coreTitleRaw);
  const cleanMessageRaw = normalizeDedupWords(rawMessage);
  const cleanMessage = GENERIC_POST_BODY_PATTERN.test(cleanMessageRaw)
    ? ''
    : cleanMessageRaw;

  let nonRedundantBody = cleanMessage;
  if (cleanTitle && cleanMessage) {
    if (cleanMessage === cleanTitle) {
      nonRedundantBody = '';
    } else if (cleanMessage.startsWith(`${cleanTitle} `)) {
      nonRedundantBody = cleanMessage.slice(cleanTitle.length).trim();
    } else if (cleanTitle.startsWith(`${cleanMessage} `)) {
      nonRedundantBody = '';
    }
  }

  const canonicalCombined = [cleanTitle, nonRedundantBody]
    .filter(Boolean)
    .join(' ')
    .trim();

  const canonicalNoAlertPrefix = canonicalCombined
    .replace(LEADING_ALERT_WORD_PATTERN, '')
    .trim();

  const titleWordCount = cleanTitle ? cleanTitle.split(' ').length : 0;
  const significantTokens = new Set(
    canonicalNoAlertPrefix
      .split(' ')
      .filter((w) => w.length >= 3)
  );

  const follower = category === 'follower' ? extractFollowerActor(n) : { uid: '', name: '' };

  return {
    category,
    isPostOrAnnouncement: category === 'post' || category === 'announcement',
    announcementId:
      category === 'announcement'
        ? String(n.announcementId || (n.isAnnouncement ? n.id : '')).trim()
        : '',
    postId: extractPostId(n),
    followerUid: follower.uid,
    followerName: follower.name,
    authorId: String(n.authorId || n.actorId || n.followerId || '').trim(),
    cleanTitle,
    nonRedundantBody,
    canonicalCombined,
    canonicalNoAlertPrefix,
    titleWordCount,
    significantTokens,
  };
}

function tokenJaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isPrefixMatch(a: string, b: string, minLen: number): boolean {
  if (!a || !b) return false;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length < minLen) return false;
  return longer.startsWith(shorter);
}

function areFingerprintsDuplicates(
  a: NotificationContentFingerprint,
  b: NotificationContentFingerprint
): boolean {
  // 1. Exact announcementId match
  if (a.announcementId && b.announcementId && a.announcementId === b.announcementId) {
    return true;
  }

  // 2. Exact postId match (only when both are post/announcement items, not a comment vs post)
  if (
    a.postId &&
    b.postId &&
    a.postId === b.postId &&
    a.category === b.category
  ) {
    return true;
  }

  // 3. Follower dedup by UID or by display name when UID is missing on either side
  if (a.category === 'follower' && b.category === 'follower') {
    if (a.followerUid && b.followerUid) {
      return a.followerUid === b.followerUid;
    }
    if (a.followerName && b.followerName && a.followerName === b.followerName) {
      return true;
    }
    if (a.canonicalCombined && a.canonicalCombined === b.canonicalCombined) {
      return true;
    }
    return false;
  }

  // Only compare content across the same category, or between post & announcement
  const compatibleCategories =
    a.category === b.category ||
    (a.isPostOrAnnouncement && b.isPostOrAnnouncement);
  if (!compatibleCategories) {
    return false;
  }

  // 4. Exact canonical combined text match
  if (a.canonicalCombined && a.canonicalCombined === b.canonicalCombined) {
    // Guard against merging very short generic messages from two different known authors
    if (
      a.canonicalCombined.length < 20 &&
      a.authorId &&
      b.authorId &&
      a.authorId !== b.authorId
    ) {
      return false;
    }
    return true;
  }

  // 5. Post / Announcement fuzzy-safe semantic dedup:
  // Handles duplicate fanouts with different title/message splits (e.g. "IMPORTANT" + "Russian Open Doors..."
  // vs "IMPORTANT: Russian Open Doors..."), formatting/URL differences, truncation, or generic body text.
  if (a.isPostOrAnnouncement && b.isPostOrAnnouncement) {
    // 5a. Match after stripping a leading alert label like "IMPORTANT" / "URGENT"
    if (
      a.canonicalNoAlertPrefix.length >= 20 &&
      a.canonicalNoAlertPrefix === b.canonicalNoAlertPrefix
    ) {
      return true;
    }

    // 5b. Prefix match on canonical combined text (handles truncated preview or trailing URL/punctuation differences)
    if (
      isPrefixMatch(a.canonicalCombined, b.canonicalCombined, 24) ||
      isPrefixMatch(a.canonicalNoAlertPrefix, b.canonicalNoAlertPrefix, 24)
    ) {
      return true;
    }

    // 5c. Identical first 64 characters of canonical content (e.g., same post with trailing link or edit)
    if (
      a.canonicalNoAlertPrefix.length >= 48 &&
      b.canonicalNoAlertPrefix.length >= 48 &&
      a.canonicalNoAlertPrefix.slice(0, 64) === b.canonicalNoAlertPrefix.slice(0, 64)
    ) {
      return true;
    }

    // 5d. Identical substantive title (>= 12 chars & >= 2 words, e.g. "free harvard course")
    // when either body is empty/generic, bodies share a prefix, or bodies have high token overlap.
    // Distinct posts with a shared subject title (e.g. "Class 10 Physics" + "Chapter 1" vs "Chapter 2")
    // have low token overlap and different body prefixes, so they remain separate.
    if (
      a.cleanTitle.length >= 12 &&
      a.titleWordCount >= 2 &&
      a.cleanTitle === b.cleanTitle
    ) {
      if (!a.nonRedundantBody || !b.nonRedundantBody) {
        return true;
      }
      if (isPrefixMatch(a.nonRedundantBody, b.nonRedundantBody, 16)) {
        return true;
      }
      if (
        a.nonRedundantBody.slice(0, 32) === b.nonRedundantBody.slice(0, 32) &&
        a.nonRedundantBody.length >= 16
      ) {
        return true;
      }
      if (tokenJaccardSimilarity(a.significantTokens, b.significantTokens) >= 0.6) {
        return true;
      }
    }

    // 5e. Identical distinctive body prefix even when wrapper titles differ (e.g. "IMPORTANT" vs "Scholarship Alert")
    if (
      a.nonRedundantBody.length >= 24 &&
      b.nonRedundantBody.length >= 24 &&
      (isPrefixMatch(a.nonRedundantBody, b.nonRedundantBody, 24) ||
        a.nonRedundantBody.slice(0, 64) === b.nonRedundantBody.slice(0, 64))
    ) {
      return true;
    }

    // 5f. Very high significant-word overlap (>= 75% Jaccard with >= 4 shared words)
    // catches duplicate reposts that have minor title/tag/CTA variations
    if (
      a.significantTokens.size >= 4 &&
      b.significantTokens.size >= 4 &&
      tokenJaccardSimilarity(a.significantTokens, b.significantTokens) >= 0.75
    ) {
      return true;
    }
  }

  return false;
}

export interface DeduplicateNotificationsOptions {
  userId?: string;
  optimisticReadIds?: ReadonlySet<string>;
  toMillisFn: (val: AppNotification['createdAt']) => number;
  resolveCategory?: (item: AppNotification) => NotificationDisplayCategory;
}

export interface DeduplicateNotificationsResult {
  items: AppNotification[];
  aliasMap: Map<string, Set<string>>;
}

function mergeDuplicateNotification(
  existing: AppNotification,
  incoming: AppNotification,
  aliasSet: Set<string>,
  options: DeduplicateNotificationsOptions
): AppNotification {
  const combinedRead =
    Boolean(existing.read) ||
    Boolean(incoming.read) ||
    Boolean(
      options.optimisticReadIds &&
        Array.from(aliasSet).some((aid) => options.optimisticReadIds!.has(aid))
    );

  const existingMs = options.toMillisFn(existing.createdAt);
  const incomingMs = options.toMillisFn(incoming.createdAt);
  const bestCreatedAt =
    existingMs >= incomingMs && existingMs > 0
      ? existing.createdAt
      : incomingMs > 0
      ? incoming.createdAt
      : existing.createdAt || incoming.createdAt;

  // Prefer announcement ID if either is an announcement; otherwise prefer deterministic ID
  const isAnnouncement = Boolean(
    existing.isAnnouncement ||
      incoming.isAnnouncement ||
      existing.type === 'announcement' ||
      incoming.type === 'announcement'
  );

  let primaryId = existing.id;
  if (isAnnouncement) {
    if (!existing.isAnnouncement && incoming.isAnnouncement) {
      primaryId = incoming.id;
    }
  } else {
    const preferIncomingId =
      !existing.id.startsWith('post_') &&
      !existing.id.startsWith('follow_') &&
      (incoming.id.startsWith('post_') || incoming.id.startsWith('follow_'));
    if (preferIncomingId) {
      primaryId = incoming.id;
    }
  }

  const resolvedType: NotificationType = isAnnouncement
    ? 'announcement'
    : existing.type !== 'system'
    ? existing.type
    : incoming.type;

  return {
    ...existing,
    ...incoming,
    id: primaryId,
    type: resolvedType,
    isAnnouncement: isAnnouncement || undefined,
    isPinned: Boolean(existing.isPinned || incoming.isPinned) || undefined,
    announcementId: existing.announcementId || incoming.announcementId,
    publishedBy: existing.publishedBy || incoming.publishedBy,
    title:
      (existing.title || '').length >= (incoming.title || '').length
        ? existing.title
        : incoming.title,
    message:
      (existing.message || '').length >= (incoming.message || '').length
        ? existing.message
        : incoming.message,
    createdAt: bestCreatedAt,
    read: combinedRead,
    link: existing.link || incoming.link || null,
    authorId:
      existing.authorId ||
      incoming.authorId ||
      existing.actorId ||
      incoming.actorId ||
      existing.followerId ||
      incoming.followerId,
    actorId:
      existing.actorId ||
      incoming.actorId ||
      existing.authorId ||
      incoming.authorId,
    followerId:
      existing.followerId ||
      incoming.followerId ||
      existing.authorId ||
      incoming.authorId,
    authorName: existing.authorName || incoming.authorName,
    authorAvatar: existing.authorAvatar || incoming.authorAvatar || null,
    authorFrame: existing.authorFrame || incoming.authorFrame || null,
    postId: existing.postId || incoming.postId,
    postSlug: existing.postSlug || incoming.postSlug,
    postType: existing.postType || incoming.postType,
    commentId: existing.commentId || incoming.commentId,
    rawType: existing.rawType || incoming.rawType,
    conversationId: existing.conversationId || incoming.conversationId,
    requestId: existing.requestId || incoming.requestId,
    senderId: existing.senderId || incoming.senderId,
  };
}

/**
 * Collapses duplicate notifications (identical IDs, postIds, announcementIds, or
 * semantically identical post/announcement/follower/system items) into a single
 * merged notification while tracking all merged IDs in aliasMap.
 */
export function deduplicateNotifications(
  rawItems: readonly AppNotification[],
  options: DeduplicateNotificationsOptions
): DeduplicateNotificationsResult {
  const entries: Array<{
    item: AppNotification;
    fingerprint: NotificationContentFingerprint;
    aliases: Set<string>;
  }> = [];

  for (const raw of rawItems) {
    if (!raw || !raw.id) continue;
    const category = options.resolveCategory
      ? options.resolveCategory(raw)
      : resolveNotificationDisplayCategory(raw);
    const fingerprint = buildContentFingerprint(raw, category);

    let matchIndex = -1;
    for (let i = 0; i < entries.length; i++) {
      const candidate = entries[i];
      if (
        candidate.aliases.has(raw.id) ||
        areFingerprintsDuplicates(candidate.fingerprint, fingerprint)
      ) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) {
      const aliases = new Set<string>([raw.id]);
      if (raw.postId && options.userId) {
        aliases.add(`post_${raw.postId}_follower_${options.userId}`);
      }
      const isRead =
        Boolean(raw.read) ||
        Boolean(
          options.optimisticReadIds &&
            Array.from(aliases).some((aid) => options.optimisticReadIds!.has(aid))
        );
      entries.push({
        item: { ...raw, read: isRead },
        fingerprint,
        aliases,
      });
    } else {
      const target = entries[matchIndex];
      target.aliases.add(raw.id);
      if (raw.postId && options.userId) {
        target.aliases.add(`post_${raw.postId}_follower_${options.userId}`);
      }
      const merged = mergeDuplicateNotification(
        target.item,
        raw,
        target.aliases,
        options
      );
      const mergedCategory = options.resolveCategory
        ? options.resolveCategory(merged)
        : resolveNotificationDisplayCategory(merged);
      target.item = merged;
      target.fingerprint = buildContentFingerprint(merged, mergedCategory);
    }
  }

  const aliasMap = new Map<string, Set<string>>();
  const items = entries
    .map((entry) => {
      aliasMap.set(entry.item.id, entry.aliases);
      return entry.item;
    })
    .sort((a, b) => options.toMillisFn(b.createdAt) - options.toMillisFn(a.createdAt));

  return { items, aliasMap };
}
