import { auth, db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import type {
  CommonsPost,
  CommonsPostType,
  CommonsFileAttachment,
  CommonsComment,
  CommonsUserPreview,
} from '@/types/commons';
import { sanitizeStudentDisplayName, extractIdFromSlug, buildEntitySlug } from '@/utils/privacy';
import {
  resolveCreatedAtMs,
  recordServerDateHeader,
  recordServerTime,
} from '@/utils/dateFormat';
import { getFollowerIds, getFollowingIds } from '@/services/followService';
import { notifyFollowersOfPost } from '@/services/notificationService';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  type PublicProfile,
} from '@/services/publicProfileService';
import {
  readSwrCache,
  writeSwrCache,
  invalidateSwrCache,
  consumeEarlyPostsFetch,
} from '@/lib/swrCache';
import seedPostsDataset from '../../data/cloudflare_d1_posts.json';

import {
  POST_LIMITS,
  buildDailyPostQuotaStatus,
  type DailyPostQuotaStatus,
} from '@/config/postLimits';
import type { PlanTier } from '@/lib/planTier';

/**
 * ============================================================================
 * BOARDLY COMMONS SERVICE — CLOUDFLARE WORKER + D1 + R2
 * ============================================================================
 * 100% of post creation, listing, filtering, search, likes, saves, comments,
 * and reports run through `/api/posts` backed by Cloudflare D1 and R2.
 *
 * Zero Firestore reads or writes are performed for posts, comments, likes,
 * saves, or study material attachments.
 * Firebase Auth is used strictly for JWT verification on authenticated writes.
 */

export const DAILY_POST_LIMIT = POST_LIMITS.free;

export class PostQuotaError extends Error {
  status: number;
  code: string;
  quota?: DailyPostQuotaStatus;

  constructor(
    message: string,
    status: number = 429,
    code: string = 'DAILY_POST_LIMIT_REACHED',
    quota?: DailyPostQuotaStatus
  ) {
    super(message);
    this.name = 'PostQuotaError';
    this.status = status;
    this.code = code;
    this.quota = quota;
  }
}

function broadcastDailyPostQuota(quota: Partial<DailyPostQuotaStatus> | null | undefined): void {
  if (!quota || typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('boardly:post-quota-updated', { detail: quota }));
  } catch {
    // ignore dispatch errors in non-browser environments
  }
}

export async function fetchDailyPostQuota(
  fallbackPlan: PlanTier = 'free'
): Promise<DailyPostQuotaStatus> {
  const fallback = buildDailyPostQuotaStatus({ plan: fallbackPlan, usedToday: 0 });
  if (!auth.currentUser) {
    return fallback;
  }
  try {
    const headers = await getOptionalAuthHeader();
    if (!headers.Authorization) {
      return fallback;
    }
    const resp = await fetch('/api/posts/limit', {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    if (!resp.ok) {
      return fallback;
    }
    const data = await resp.json().catch(() => null);
    if (!data || typeof data.usedToday !== 'number') {
      return fallback;
    }
    const plan: PlanTier =
      data.plan === 'plus' || data.plan === 'pro' || data.plan === 'free'
        ? data.plan
        : fallbackPlan;
    const normalized = buildDailyPostQuotaStatus({
      plan,
      usedToday: data.usedToday,
    });
    const merged: DailyPostQuotaStatus = {
      ...normalized,
      ...(typeof data.dateKey === 'string' ? { dateKey: data.dateKey } : {}),
      ...(typeof data.resetAtMs === 'number' ? { resetAtMs: data.resetAtMs } : {}),
      ...(typeof data.resetAtIso === 'string' ? { resetAtIso: data.resetAtIso } : {}),
      ...(typeof data.resetCountdown === 'string' ? { resetCountdown: data.resetCountdown } : {}),
      ...(typeof data.resetTimeLabel === 'string' ? { resetTimeLabel: data.resetTimeLabel } : {}),
      ...(typeof data.timezone === 'string' ? { timezone: data.timezone } : {}),
    };
    broadcastDailyPostQuota(merged);
    return merged;
  } catch {
    return fallback;
  }
}

const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.apk',
  '.dmg',
  '.pkg',
  '.com',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.py',
  '.php',
  '.ps1',
  '.elf',
  '.bin',
  '.dll',
  '.so',
];

export function isExecutableFile(filename: string): boolean {
  const lower = (filename || '').toLowerCase().trim();
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext) || lower.includes(`${ext}.`));
}

export function generateAnonymousAlias(): string {
  return 'Anonymous Student';
}

async function getOptionalAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken(false);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore unauthenticated or token retrieval error
  }
  return {};
}

async function getRequiredAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to perform this action.');
  }
  const token = await user.getIdToken(false);
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * ============================================================================
 * SHARED POST LIKE SOURCE OF TRUTH (USED BY ALL PROFILE & COMMONS SURFACES)
 * ============================================================================
 * Keeps post like counts and per-user liked status synchronized across:
 * - Dashboard Profile (`/dashboard/profile` -> `ProfilePostsSection`)
 * - Commons Public Profile (`/u/:username` -> `PublicUserProfilePage`)
 * - Commons Feed Cards (`/commons`, `/dashboard/commons` -> `CommonsPostCard`)
 * - Post Detail Page (`/commons/post/:idSlug` -> `PublicPostDetailPage`)
 * - Search Results (`/search` -> `SearchPage`)
 */
interface PostLikeEntry {
  count: number;
  votedByUid: Record<string, boolean>;
  updatedAt: number;
  localMutationAt: number;
}

type PostLikeListener = (payload: {
  postId: string;
  count: number;
  userId?: string | null;
  voted?: boolean;
}) => void;

const postLikeStore = new Map<string, PostLikeEntry>();
const postLikeListeners = new Map<string, Set<PostLikeListener>>();
const globalPostLikeListeners = new Set<PostLikeListener>();

export function getCanonicalPostLikeCount(raw: Record<string, any> | null | undefined): number {
  if (!raw) return 0;
  const rawCount = Number(raw.upvotes ?? raw.likesCount ?? raw.likes_count ?? 0);
  const safeRawCount = Number.isFinite(rawCount) ? Math.max(0, rawCount) : 0;
  const id = String(raw.id || '').trim();
  if (!id) return safeRawCount;
  const existing = postLikeStore.get(id);
  // If the user just toggled a like locally within the last 10s, prefer the live mutated count
  if (existing && Date.now() - existing.localMutationAt < 10_000) {
    return existing.count;
  }
  return safeRawCount;
}

export function recordPostLikeSnapshot(
  postId: string,
  count: number | null | undefined,
  userId?: string | null,
  voted?: boolean,
  isLocalMutation = false
): { count: number; voted?: boolean } {
  const cleanId = String(postId || '').trim();
  if (!cleanId) {
    return { count: Math.max(0, Number(count || 0)), voted };
  }

  const existing = postLikeStore.get(cleanId);
  const now = Date.now();
  const PreserveLocalCount =
    !isLocalMutation && existing && now - existing.localMutationAt < 10_000;

  const nextCount = PreserveLocalCount
    ? existing.count
    : count !== undefined && count !== null && Number.isFinite(Number(count))
    ? Math.max(0, Number(count))
    : existing?.count ?? 0;

  const votedByUid: Record<string, boolean> = { ...(existing?.votedByUid || {}) };
  if (userId && typeof voted === 'boolean') {
    votedByUid[userId] = voted;
  }

  const prevCount = existing?.count;
  const prevVoted = userId ? existing?.votedByUid?.[userId] : undefined;

  const entry: PostLikeEntry = {
    count: nextCount,
    votedByUid,
    updatedAt: now,
    localMutationAt: isLocalMutation ? now : existing?.localMutationAt || 0,
  };
  postLikeStore.set(cleanId, entry);

  if (prevCount !== nextCount || (userId && prevVoted !== voted) || isLocalMutation) {
    const payload = { postId: cleanId, count: nextCount, userId, voted };
    const listeners = postLikeListeners.get(cleanId);
    if (listeners && listeners.size > 0) {
      listeners.forEach((fn) => {
        try {
          fn(payload);
        } catch {
          // Ignore listener error
        }
      });
    }
    if (globalPostLikeListeners.size > 0) {
      globalPostLikeListeners.forEach((fn) => {
        try {
          fn(payload);
        } catch {
          // Ignore listener error
        }
      });
    }
  }

  return {
    count: nextCount,
    voted: userId ? votedByUid[userId] : voted,
  };
}

export function getPostLikeSnapshot(
  postId: string,
  fallbackCount = 0,
  userId?: string | null,
  fallbackVoted?: boolean
): { count: number; voted: boolean; hasKnownVote: boolean } {
  const cleanId = String(postId || '').trim();
  const safeFallback = Number.isFinite(Number(fallbackCount))
    ? Math.max(0, Number(fallbackCount))
    : 0;
  if (!cleanId) {
    return {
      count: safeFallback,
      voted: Boolean(fallbackVoted),
      hasKnownVote: typeof fallbackVoted === 'boolean',
    };
  }
  const existing = postLikeStore.get(cleanId);
  if (!existing) {
    return {
      count: safeFallback,
      voted: Boolean(fallbackVoted),
      hasKnownVote: typeof fallbackVoted === 'boolean',
    };
  }
  const hasKnownVote = Boolean(
    userId && Object.prototype.hasOwnProperty.call(existing.votedByUid, userId)
  );
  return {
    count: existing.count,
    voted: hasKnownVote && userId ? existing.votedByUid[userId] : Boolean(fallbackVoted),
    hasKnownVote: hasKnownVote || typeof fallbackVoted === 'boolean',
  };
}

export function subscribePostLike(postId: string, listener: PostLikeListener): () => void {
  const cleanId = String(postId || '').trim();
  if (!cleanId) return () => {};
  let set = postLikeListeners.get(cleanId);
  if (!set) {
    set = new Set();
    postLikeListeners.set(cleanId, set);
  }
  set.add(listener);
  return () => {
    const currentSet = postLikeListeners.get(cleanId);
    if (currentSet) {
      currentSet.delete(listener);
      if (currentSet.size === 0) {
        postLikeListeners.delete(cleanId);
      }
    }
  };
}

export function subscribeAnyPostLike(listener: PostLikeListener): () => void {
  globalPostLikeListeners.add(listener);
  return () => {
    globalPostLikeListeners.delete(listener);
  };
}

export function applyLiveAuthorToPost(
  post: CommonsPost,
  liveProfile?: PublicProfile | null
): CommonsPost {
  if (post.isAnonymous || !post.authorUid) {
    return {
      ...post,
      authorUid: null,
      authorName: post.anonymousAlias || 'Anonymous Student',
      authorAvatar: null,
      authorEquippedAvatar: null,
      authorFrame: null,
      authorPhotoURL: null,
    };
  }
  const prof = liveProfile || getCachedPublicProfile(post.authorUid);
  if (!prof) return post;
  const resolvedAvatar =
    resolveCosmeticItemId(prof.equippedAvatar || prof.avatar, 'avatar') ||
    post.authorEquippedAvatar ||
    post.authorAvatar ||
    null;
  const resolvedFrame =
    resolveCosmeticItemId(prof.equippedFrame || prof.frame, 'frame') ||
    post.authorFrame ||
    null;
  return {
    ...post,
    authorName: prof.displayName || prof.username || post.authorName || 'Student',
    ...(prof.username ? { authorUsername: prof.username } : {}),
    authorAvatar: resolvedAvatar,
    authorEquippedAvatar: resolvedAvatar,
    authorFrame: resolvedFrame,
    authorRole: (prof.role as any) || post.authorRole || 'student',
    authorCustomRole: prof.customRole || post.authorCustomRole || null,
    authorProBadge:
      prof.proBadge !== undefined ? prof.proBadge : post.authorProBadge ?? post.proBadge ?? null,
    proBadge:
      prof.proBadge !== undefined ? prof.proBadge : post.proBadge ?? post.authorProBadge ?? null,
  };
}

/**
 * Normalizes a post object returned from `/api/posts` so `createdAt` supports
 * both `.toDate()` (for legacy UI components) and ISO string / Date parsing.
 */
export function normalizeCloudflarePost(raw: Record<string, any>): CommonsPost {
  const parsedCreated = resolveCreatedAtMs(raw);
  const createdMs = parsedCreated.ms;

  const timestampCompat =
    createdMs !== null
      ? {
          seconds: Math.floor(createdMs / 1000),
          nanoseconds: 0,
          toDate: () => new Date(createdMs),
          toMillis: () => createdMs,
        }
      : null;

  const id = String(raw.id || '');
  const rawLikes = Math.max(0, Number(raw.upvotes ?? raw.likesCount ?? raw.likes_count ?? 0));
  const currentUid = auth.currentUser?.uid || null;
  const votedByMe = typeof raw.votedByMe === 'boolean' ? raw.votedByMe : undefined;
  const snapshot = id
    ? recordPostLikeSnapshot(id, rawLikes, currentUid, votedByMe, false)
    : { count: rawLikes };

  const isAnon = Boolean(raw.isAnonymous ?? raw.is_anonymous);
  const authorUid = isAnon ? null : raw.authorUid || raw.author_uid || null;
  const cachedAuthor = authorUid ? getCachedPublicProfile(authorUid) : null;

  let parsedTags: string[] = [];
  if (Array.isArray(raw.tags)) {
    parsedTags = raw.tags;
  } else if (typeof raw.tags_json === 'string') {
    try {
      const t = JSON.parse(raw.tags_json);
      if (Array.isArray(t)) parsedTags = t;
    } catch {
      parsedTags = [];
    }
  }

  let parsedFiles: CommonsFileAttachment[] = [];
  if (Array.isArray(raw.files)) {
    parsedFiles = raw.files;
  } else if (typeof raw.files_json === 'string') {
    try {
      const f = JSON.parse(raw.files_json);
      if (Array.isArray(f)) parsedFiles = f;
    } catch {
      parsedFiles = [];
    }
  }
  parsedFiles = parsedFiles.map((f: any) => {
    const rawFileUrl = String(f?.url || '').trim();
    const fileR2Key =
      String(f?.r2Key || f?.key || '').trim() ||
      (rawFileUrl.includes('.r2.dev/')
        ? rawFileUrl.split('.r2.dev/')[1] || ''
        : rawFileUrl.startsWith('/api/commons/r2/')
        ? rawFileUrl.slice('/api/commons/r2/'.length)
        : rawFileUrl.startsWith('/api/r2/')
        ? rawFileUrl.slice('/api/r2/'.length)
        : '');
    const normalizedUrl =
      fileR2Key && fileR2Key.startsWith('commons/')
        ? `/api/r2/${fileR2Key}`
        : f?.localUrl && String(f.localUrl).startsWith('/api/r2/')
        ? String(f.localUrl)
        : rawFileUrl.startsWith('/api/commons/r2/')
        ? `/api/r2/${rawFileUrl.slice('/api/commons/r2/'.length)}`
        : rawFileUrl;
    return {
      ...f,
      r2Key: fileR2Key || f?.r2Key,
      url: normalizedUrl,
      downloadUrl:
        fileR2Key && fileR2Key.startsWith('commons/')
          ? `/api/r2/${fileR2Key}`
          : f?.downloadUrl || normalizedUrl,
    };
  });

  const rawEquippedAvatar =
    raw.authorEquippedAvatar ?? raw.author_equipped_avatar ?? raw.authorAvatar ?? raw.author_avatar;
  const rawFrame = raw.authorFrame ?? raw.author_frame;
  const rawRole = raw.authorRole ?? raw.author_role;
  const rawCustomRole = raw.authorCustomRole ?? raw.author_custom_role;

  const basePost: CommonsPost = {
    ...(raw as any),
    id,
    slug: String(raw.slug || raw.id || ''),
    type: (raw.type || 'notes') as CommonsPostType,
    title: String(raw.title || ''),
    description: String(raw.description || raw.body || ''),
    subject: String(raw.subject || 'General'),
    chapter: String(raw.chapter || 'General'),
    target: String(raw.target || 'General'),
    classLevel: String(raw.classLevel || raw.class_level || raw.class || '11'),
    board: String(raw.board || 'Federal'),
    tags: parsedTags,
    files: parsedFiles,
    isAnonymous: isAnon,
    anonymousAlias: String(raw.anonymousAlias || raw.anonymous_alias || 'Anonymous Student'),
    authorUid,
    authorName: isAnon
      ? 'Anonymous Student'
      : String(raw.authorName || raw.author_name || 'Student'),
    authorAvatar: isAnon
      ? null
      : resolveCosmeticItemId(rawEquippedAvatar, 'avatar'),
    authorFrame: isAnon
      ? null
      : resolveCosmeticItemId(rawFrame, 'frame'),
    authorEquippedAvatar: isAnon
      ? null
      : resolveCosmeticItemId(rawEquippedAvatar, 'avatar'),
    authorPhotoURL: null,
    authorRole: isAnon
      ? 'student'
      : String(authorUid || '').startsWith('bot_')
      ? 'bot'
      : rawRole || 'student',
    authorCustomRole: isAnon ? null : rawCustomRole || null,
    authorProBadge: isAnon ? null : raw.authorProBadge ?? raw.proBadge ?? null,
    proBadge: isAnon ? null : raw.proBadge ?? raw.authorProBadge ?? null,
    upvotes: snapshot.count,
    downvotes: Number(raw.downvotes ?? 0),
    views: Number(raw.views ?? 0),
    commentCount: Number(raw.commentCount ?? raw.comment_count ?? 0),
    saveCount: Number(raw.saveCount ?? raw.save_count ?? 0),
    sharesCount: Number(raw.sharesCount ?? raw.shares_count ?? 0),
    reportCount: Number(raw.reportCount ?? raw.report_count ?? 0),
    isHidden: Boolean(raw.isHidden ?? raw.is_hidden),
    isPinned: Boolean(raw.isPinned ?? raw.is_pinned),
    isFeatured: Boolean(raw.isFeatured ?? raw.is_featured),
    createdAt: timestampCompat as any,
    ...(createdMs !== null ? { createdAtMs: createdMs } : {}),
  };
  return applyLiveAuthorToPost(basePost, cachedAuthor);
}

export async function checkPostingRateLimit(_uid: string): Promise<{
  allowed: boolean;
  remaining: number;
  count: number;
  isBanned: boolean;
  quota?: DailyPostQuotaStatus;
}> {
  const quota = await fetchDailyPostQuota('free');
  return {
    allowed: !quota.limitReached,
    remaining: quota.isUnlimited ? Infinity : quota.remaining ?? 0,
    count: quota.usedToday,
    isBanned: false,
    quota,
  };
}

export async function createCommonsPost(params: {
  postId?: string;
  author?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    customRole?: string | null;
  };
  currentUser?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    customRole?: string | null;
  };
  type: CommonsPostType;
  title: string;
  description: string;
  subject?: string;
  chapter?: string;
  target?: string;
  tags: string[];
  files: CommonsFileAttachment[];
  isAnonymous: boolean;
}): Promise<{ postId: string; post: CommonsPost; quota?: DailyPostQuotaStatus }> {
  const author = params.author || params.currentUser || {
    uid: auth.currentUser?.uid || '',
    email: auth.currentUser?.email || null,
    displayName: auth.currentUser?.displayName || 'Student',
    photoURL: null,
  };
  const { isAnonymous } = params;

  if (params.files.length > 5) {
    throw new Error('Maximum 5 files are allowed per post.');
  }

  for (const f of params.files) {
    if (isExecutableFile(f.name)) {
      throw new Error(`Unsupported file type: "${f.name}". Executable files are not allowed.`);
    }
  }

  const headers = await getRequiredAuthHeader();
  const cleanPublicName = isAnonymous
    ? 'Anonymous Student'
    : sanitizeStudentDisplayName(author.displayName, author.uid);

  const resp = await fetch('/api/posts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: params.postId,
      postId: params.postId,
      type: params.type,
      title: params.title.trim(),
      description: params.description.trim(),
      subject: (params.subject || 'General').trim(),
      chapter: (params.chapter || 'General').trim(),
      target: (params.target || 'General').trim(),
      tags: params.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
      files: params.files,
      isAnonymous: Boolean(isAnonymous),
      authorName: cleanPublicName,
      authorAvatar: isAnonymous
        ? null
        : resolveCosmeticItemId(author.equippedAvatar || author.avatarUrl, 'avatar'),
      authorFrame: isAnonymous ? null : resolveCosmeticItemId(author.frame, 'frame'),
      authorEquippedAvatar: isAnonymous
        ? null
        : resolveCosmeticItemId(author.equippedAvatar || author.avatarUrl, 'avatar'),
      authorPhotoURL: null,
      authorRole: isAnonymous ? 'student' : author.role || 'student',
      authorCustomRole: isAnonymous ? null : author.customRole || null,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    console.error('[CommonsService] POST /api/posts failed:', {
      status: resp.status,
      postId: params.postId,
      response: data,
    });
    if (resp.status === 429 && data?.code === 'DAILY_POST_LIMIT_REACHED') {
      const serverQuota = data?.quota as DailyPostQuotaStatus | undefined;
      if (serverQuota) {
        broadcastDailyPostQuota(serverQuota);
      }
      throw new PostQuotaError(
        data?.error || 'Daily post limit reached.',
        429,
        data.code,
        serverQuota
      );
    }
    if (resp.status === 401) {
      throw new Error('Please sign in again');
    }
    throw new Error(data?.error || 'Upload failed, try again');
  }

  const serverQuota = data?.quota as DailyPostQuotaStatus | undefined;
  if (serverQuota) {
    broadcastDailyPostQuota(serverQuota);
  }

  const normalized = normalizeCloudflarePost(data.post || { id: data.postId, ...params });

  // Notify followers when a non-anonymous post is published (never if anonymous)
  if (!isAnonymous && author.uid) {
    void (async () => {
      try {
        const followerUids = await getFollowerIds(author.uid);
        if (followerUids.length > 0) {
          await notifyFollowersOfPost({
            followerUids,
            authorId: author.uid,
            authorName: normalized.authorName || cleanPublicName,
            authorAvatar:
              resolveCosmeticItemId(
                author.equippedAvatar || author.avatarUrl || normalized.authorAvatar,
                'avatar'
              ) || null,
            authorFrame: author.frame || normalized.authorFrame || null,
            postId: normalized.id,
            postSlug: (normalized as any).slug || normalized.id,
            postTitle: normalized.title,
            postType: normalized.type,
            postDescription: normalized.description,
            isAnonymous: false,
          });
        }
      } catch (err) {
        console.warn('[CommonsService] Follower notification notice:', err);
      }
    })();
  }

  return {
    postId: normalized.id,
    post: normalized,
    ...(serverQuota ? { quota: serverQuota } : {}),
  };
}

export function sortCommonsPosts(
  posts: CommonsPost[],
  sortBy: 'trending' | 'newest' | 'top' = 'newest'
): CommonsPost[] {
  return [...posts].sort((a, b) => {
    const aPinned = Boolean(a.isPinned);
    const bPinned = Boolean(b.isPinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const aTime = a.createdAt?.toMillis
      ? a.createdAt.toMillis()
      : a.createdAt?.seconds
      ? a.createdAt.seconds * 1000
      : 0;
    const bTime = b.createdAt?.toMillis
      ? b.createdAt.toMillis()
      : b.createdAt?.seconds
      ? b.createdAt.seconds * 1000
      : 0;

    if (sortBy === 'newest') {
      return bTime - aTime;
    }
    if (sortBy === 'top') {
      if ((b.upvotes || 0) !== (a.upvotes || 0)) {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      return bTime - aTime;
    }
    // trending
    return (b.upvotes || 0) - (a.upvotes || 0) || bTime - aTime;
  });
}

const COMMONS_POSTS_CACHE_TTL_MS = 60_000;
const COMMONS_SWR_KEY = 'commons:feed:default:v2';

const commonsListCache = new Map<
  string,
  {
    data: {
      posts: CommonsPost[];
      lastDoc: any;
      hasMore: boolean;
      backendMode?: 'cloudflare-d1-r2' | 'preview-demo';
    };
    expiresAt: number;
  }
>();
const commonsListInFlight = new Map<
  string,
  Promise<{
    posts: CommonsPost[];
    lastDoc: any;
    hasMore: boolean;
    backendMode?: 'cloudflare-d1-r2' | 'preview-demo';
  }>
>();
const commonsPostDetailCache = new Map<string, { post: CommonsPost; expiresAt: number }>();
const commonsPostDetailInFlight = new Map<string, Promise<CommonsPost | null>>();

export function invalidateCommonsPostsCache(): void {
  commonsListCache.clear();
  commonsPostDetailCache.clear();
  invalidateSwrCache('commons:feed:');
}

/**
 * Synchronously returns the cached Commons feed (from memory or localStorage SWR)
 * so returning to the Commons tab or cold-starting with a warm cache renders in 0ms
 * with zero skeleton flash.
 */
export function getInitialCachedCommonsFeed(
  feedTab: 'all' | 'following' = 'all',
  currentUid?: string | null
): {
  posts: CommonsPost[];
  lastDoc: any;
  hasMore: boolean;
  backendMode?: 'cloudflare-d1-r2' | 'preview-demo';
} | null {
  if (feedTab === 'following') {
    return null;
  }
  const exactKey = `${currentUid || 'anon'}:limit=15&offset=0`;
  const mem = commonsListCache.get(exactKey) || commonsListCache.get('anon:limit=15&offset=0');
  if (mem && mem.data.posts.length > 0) {
    return mem.data;
  }
  const swr = readSwrCache<{
    rawPosts: Record<string, any>[];
    lastDoc: any;
    hasMore: boolean;
    backendMode?: 'cloudflare-d1-r2' | 'preview-demo';
  }>(COMMONS_SWR_KEY, 6 * 60 * 60 * 1000);
  if (swr && Array.isArray(swr.data?.rawPosts) && swr.data.rawPosts.length > 0) {
    const normalized = swr.data.rawPosts.map((p) => normalizeCloudflarePost(p));
    return {
      posts: normalized,
      lastDoc: swr.data.lastDoc,
      hasMore: Boolean(swr.data.hasMore),
      backendMode: swr.data.backendMode || 'cloudflare-d1-r2',
    };
  }
  return null;
}

export async function fetchCommonsPosts(options: {
  subject?: string;
  target?: string;
  type?: CommonsPostType | 'all';
  sortBy?: 'trending' | 'newest' | 'top';
  feedTab?: 'all' | 'trending' | 'following';
  followingUids?: string[];
  currentUid?: string | null;
  searchQuery?: string;
  pageSize?: number;
  lastDoc?: any;
  lastVisibleDoc?: any;
}): Promise<{
  posts: CommonsPost[];
  lastDoc: any;
  hasMore: boolean;
  backendMode?: 'cloudflare-d1-r2' | 'preview-demo';
}> {
  const pageSize = options.pageSize || 15;
  const cursor = options.lastDoc ?? options.lastVisibleDoc;
  const offset = typeof cursor === 'number' ? cursor : 0;
  // Support both feedTab='trending' and sortBy='trending'
  const isTrending = options.feedTab === 'trending' || options.sortBy === 'trending';

  if (
    options.feedTab === 'following' &&
    (!options.currentUid || options.currentUid.startsWith('guest_'))
  ) {
    return { posts: [], lastDoc: null, hasMore: false };
  }

  let effectiveFollowingUids = options.followingUids;
  if (
    options.feedTab === 'following' &&
    effectiveFollowingUids === undefined &&
    options.currentUid
  ) {
    effectiveFollowingUids = await getFollowingIds(options.currentUid);
  }

  const followingSet = new Set(
    (effectiveFollowingUids || []).map((id) => String(id || '').trim()).filter(Boolean)
  );

  if (options.feedTab === 'following' && followingSet.size === 0) {
    return { posts: [], lastDoc: null, hasMore: false };
  }

  const params = new URLSearchParams();
  params.set('limit', String(pageSize));
  params.set('offset', String(offset));

  if (options.subject && options.subject !== 'all') {
    params.set('subject', options.subject);
  }
  if (options.target && options.target !== 'all') {
    params.set('target', options.target);
  }
  if (options.type && options.type !== 'all') {
    params.set('type', options.type);
  }
  if (isTrending) {
    params.set('sort', 'trending');
  } else if (options.sortBy) {
    params.set('sort', options.sortBy);
  }
  if (options.searchQuery?.trim()) {
    params.set('q', options.searchQuery.trim());
  }
  if (options.feedTab === 'following' && followingSet.size > 0) {
    params.set('followingUids', Array.from(followingSet).join(','));
  }

  const isDefaultFirstPage =
    offset === 0 &&
    pageSize <= 20 &&
    (!options.feedTab || options.feedTab === 'all') &&
    (!options.subject || options.subject === 'all') &&
    (!options.target || options.target === 'all') &&
    (!options.type || options.type === 'all') &&
    (!options.sortBy || options.sortBy === 'newest') &&
    !options.searchQuery?.trim();

  const cacheKey = `${options.currentUid || 'anon'}:${options.feedTab || 'all'}:${params.toString()}`;
  const cached = commonsListCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt && cached.data.posts.length > 0) {
    return cached.data;
  }
  const existingPromise = commonsListInFlight.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    let data: Record<string, any> | null = null;

    // 1. Reuse early parallel fetch started in index.html if available and non-empty
    if (isDefaultFirstPage) {
      const earlyPromise = consumeEarlyPostsFetch();
      if (earlyPromise) {
        const earlyData = await earlyPromise.catch(() => null);
        if (earlyData && Array.isArray(earlyData.posts) && earlyData.posts.length > 0) {
          data = earlyData;
        }
      }
    }

    // 2. Otherwise fetch from /api/posts
    if (!data || !Array.isArray(data.posts) || data.posts.length === 0) {
      try {
        const headers = await getOptionalAuthHeader();
        const resp = await fetch(`/api/posts?${params.toString()}`, {
          headers,
        });
        recordServerDateHeader(resp);
        const fetchedData = await resp.json().catch(() => ({}));
        if (fetchedData?.serverTimeMs) {
          recordServerTime(fetchedData.serverTimeMs);
        }
        if (resp.ok && Array.isArray(fetchedData?.posts)) {
          data = fetchedData;
        } else if (!data) {
          throw new Error(fetchedData?.error || `Failed to load posts (HTTP ${resp.status}).`);
        }
      } catch (fetchErr) {
        if (options.feedTab === 'following' || options.searchQuery?.trim()) {
          throw fetchErr;
        }
      }
    }

    // 3. Fallback to bundled canonical D1 seed posts if the remote endpoint returned 0 posts
    // on a public feed request ('all' or 'trending')
    const canFallbackToSeed =
      (!options.feedTab || options.feedTab === 'all' || options.feedTab === 'trending') &&
      !options.searchQuery?.trim() &&
      Array.isArray((seedPostsDataset as any)?.posts) &&
      (seedPostsDataset as any).posts.length > 0;

    if ((!data || !Array.isArray(data.posts) || data.posts.length === 0) && canFallbackToSeed) {
      let seedRows = ((seedPostsDataset as any).posts as Record<string, any>[]).filter(
        (p) => !Number(p.is_hidden || 0)
      );
      if (options.subject && options.subject !== 'all') {
        const sLow = options.subject.toLowerCase();
        seedRows = seedRows.filter((p) => {
          const ps = String(p.subject || '').toLowerCase();
          return ps === sLow || ps.includes(sLow) || (sLow === 'computer' && ps.includes('computer'));
        });
      }
      if (options.type && options.type !== 'all') {
        seedRows = seedRows.filter((p) => p.type === options.type);
      }
      if (options.target && options.target !== 'all') {
        const tLow = options.target.toLowerCase();
        seedRows = seedRows.filter((p) => String(p.target || '').toLowerCase().includes(tLow));
      }
      if (isTrending) {
        const now = Date.now();
        seedRows = [...seedRows].sort((a, b) => {
          const aCreated = Number(a.created_at || 0);
          const bCreated = Number(b.created_at || 0);
          const aAgeDays = Math.max(0, (now - aCreated) / (24 * 60 * 60 * 1000));
          const bAgeDays = Math.max(0, (now - bCreated) / (24 * 60 * 60 * 1000));
          const aScore =
            Number(a.upvotes || 0) * 3 +
            Number(a.comment_count || 0) * 2 +
            Math.max(0, 14 - aAgeDays) * 0.25;
          const bScore =
            Number(b.upvotes || 0) * 3 +
            Number(b.comment_count || 0) * 2 +
            Math.max(0, 14 - bAgeDays) * 0.25;
          if (Math.abs(bScore - aScore) > 0.01) return bScore - aScore;
          return bCreated - aCreated;
        });
      }
      const pagedSeed = seedRows.slice(offset, offset + pageSize);
      const seedHasMore = offset + pageSize < seedRows.length;
      data = {
        success: true,
        backendMode: 'cloudflare-d1-r2',
        posts: pagedSeed,
        hasMore: seedHasMore,
        nextOffset: seedHasMore ? offset + pageSize : null,
      };
    }

    if (!data || !Array.isArray(data.posts)) {
      throw new Error('Could not load community posts');
    }

    const rawPosts: CommonsPost[] = data.posts.map((p: any) => normalizeCloudflarePost(p));
    const authorUids = Array.from(
      new Set(
        rawPosts
          .filter((p) => !p.isAnonymous && p.authorUid)
          .map((p) => String(p.authorUid))
      )
    );

    // Apply any already-cached profiles synchronously and trigger background profile enrichment
    // without blocking the first post paint on Firestore WebChannel handshakes!
    let posts: CommonsPost[] = rawPosts.map((p) =>
      applyLiveAuthorToPost(p, p.authorUid ? getCachedPublicProfile(p.authorUid) : null)
    );

    if (options.feedTab === 'following') {
      posts = posts.filter(
        (p) => !p.isAnonymous && Boolean(p.authorUid) && followingSet.has(String(p.authorUid))
      );
    } else if (isTrending && posts.length > 1) {
      const now = Date.now();
      posts = [...posts].sort((a, b) => {
        const aCreated = getPostCreatedAtMs(a.createdAt);
        const bCreated = getPostCreatedAtMs(b.createdAt);
        const aAgeDays = Math.max(0, (now - aCreated) / (24 * 60 * 60 * 1000));
        const bAgeDays = Math.max(0, (now - bCreated) / (24 * 60 * 60 * 1000));
        const aScore =
          (a.upvotes || 0) * 3 +
          (a.commentCount || 0) * 2 +
          Math.max(0, 14 - aAgeDays) * 0.25;
        const bScore =
          (b.upvotes || 0) * 3 +
          (b.commentCount || 0) * 2 +
          Math.max(0, 14 - bAgeDays) * 0.25;
        if (Math.abs(bScore - aScore) > 0.01) return bScore - aScore;
        return bCreated - aCreated;
      });
    }

    if (authorUids.length > 0) {
      void getPublicProfiles(authorUids).catch(() => {});
    }

    for (const p of posts) {
      const entry = {
        post: p,
        expiresAt: Date.now() + COMMONS_POSTS_CACHE_TTL_MS,
      };
      if (p.id) {
        commonsPostDetailCache.set(p.id, entry);
        commonsPostDetailCache.set(buildEntitySlug(p.id, p.title), entry);
      }
      if ((p as any).slug) {
        commonsPostDetailCache.set(String((p as any).slug), entry);
      }
    }
    const nextOffset =
      typeof data.nextOffset === 'number' ? data.nextOffset : offset + pageSize;

    const result = {
      posts,
      lastDoc: data.hasMore ? nextOffset : null,
      hasMore: Boolean(data.hasMore),
      backendMode: (data.backendMode ||
        (data.source === 'cloudflare-d1-r2' ? 'cloudflare-d1-r2' : 'preview-demo')) as
        | 'cloudflare-d1-r2'
        | 'preview-demo',
    };
    if (result.posts.length > 0) {
      commonsListCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + COMMONS_POSTS_CACHE_TTL_MS,
      });
      if (isDefaultFirstPage) {
        commonsListCache.set('anon:limit=15&offset=0', {
          data: result,
          expiresAt: Date.now() + COMMONS_POSTS_CACHE_TTL_MS,
        });
        writeSwrCache(COMMONS_SWR_KEY, {
          rawPosts: data.posts.slice(0, 15),
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          backendMode: result.backendMode,
        });
      }
    }
    return result;
  })();

  commonsListInFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    commonsListInFlight.delete(cacheKey);
  }
}

export async function fetchCommonsPostById(postIdOrSlug: string): Promise<CommonsPost | null> {
  if (!postIdOrSlug) return null;
  const extractedId = extractIdFromSlug(postIdOrSlug);
  const cached =
    commonsPostDetailCache.get(postIdOrSlug) ||
    (extractedId ? commonsPostDetailCache.get(extractedId) : undefined);
  if (cached && Date.now() < cached.expiresAt) {
    return applyLiveAuthorToPost(cached.post);
  }
  const pending = commonsPostDetailInFlight.get(postIdOrSlug);
  if (pending) {
    return pending;
  }

  const p = (async () => {
    try {
      let rawPost: Record<string, any> | null = null;
      try {
        const headers = await getOptionalAuthHeader();
        const resp = await fetch(`/api/posts/${encodeURIComponent(postIdOrSlug)}?view=1`, {
          headers,
        });
        recordServerDateHeader(resp);
        if (resp.ok) {
          const data = await resp.json().catch(() => null);
          if (data?.serverTimeMs) {
            recordServerTime(data.serverTimeMs);
          }
          if (data?.post) {
            rawPost = data.post;
          }
        }
      } catch {
        // Fallback to seedPostsDataset below
      }

      if (!rawPost && Array.isArray((seedPostsDataset as any)?.posts)) {
        const cleanTarget = decodeURIComponent(postIdOrSlug).trim();
        const seedMatch = ((seedPostsDataset as any).posts as Record<string, any>[]).find(
          (sp) =>
            sp.id === cleanTarget ||
            sp.id === extractedId ||
            sp.slug === cleanTarget ||
            cleanTarget.startsWith(`${sp.id}-`)
        );
        if (seedMatch && !Number(seedMatch.is_hidden || 0)) {
          rawPost = seedMatch;
        }
      }

      if (!rawPost) return null;
      const rawNormalized = normalizeCloudflarePost(rawPost);
      let liveAuthor: PublicProfile | null = null;
      if (!rawNormalized.isAnonymous && rawNormalized.authorUid) {
        const map = await getPublicProfiles([rawNormalized.authorUid]).catch(() => null);
        liveAuthor = map?.get(rawNormalized.authorUid) || null;
      }
      const normalized = applyLiveAuthorToPost(rawNormalized, liveAuthor);
      const entry = {
        post: normalized,
        expiresAt: Date.now() + COMMONS_POSTS_CACHE_TTL_MS,
      };
      commonsPostDetailCache.set(postIdOrSlug, entry);
      if (normalized.id) {
        commonsPostDetailCache.set(normalized.id, entry);
        commonsPostDetailCache.set(buildEntitySlug(normalized.id, normalized.title), entry);
      }
      if ((normalized as any).slug) {
        commonsPostDetailCache.set(String((normalized as any).slug), entry);
      }
      return normalized;
    } catch {
      return null;
    } finally {
      commonsPostDetailInFlight.delete(postIdOrSlug);
    }
  })();

  commonsPostDetailInFlight.set(postIdOrSlug, p);
  return p;
}

export async function togglePostVote(
  postId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }> {
  const effectiveUserId = userId || auth.currentUser?.uid || '';
  const headers = await getRequiredAuthHeader();
  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers,
    cache: 'no-store',
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || 'Could not update like.');
  }
  const voted = Boolean(data.voted ?? data.upvoted);
  const newCount = Math.max(
    0,
    Number(data.newCount ?? data.upvotesCount ?? data.likesCount ?? 0)
  );
  if (effectiveUserId) {
    statusRequestCache.delete(`${effectiveUserId}:${postId}`);
  }
  invalidateCommonsPostsCache();
  recordPostLikeSnapshot(postId, newCount, effectiveUserId || null, voted, true);
  return {
    voted,
    newCount,
  };
}

const statusRequestCache = new Map<
  string,
  Promise<{ voted: boolean; saved: boolean }>
>();

async function fetchUserPostStatus(
  postId: string,
  userId: string
): Promise<{ voted: boolean; saved: boolean }> {
  if (!postId || !userId) return { voted: false, saved: false };
  const key = `${userId}:${postId}`;
  const pending = statusRequestCache.get(key);
  if (pending) return pending;

  const p = (async () => {
    try {
      const headers = await getOptionalAuthHeader();
      const resp = await fetch(
        `/api/posts/${encodeURIComponent(postId)}/status?userId=${encodeURIComponent(userId)}`,
        { headers, cache: 'no-store' }
      );
      if (!resp.ok) return { voted: false, saved: false };
      const data = await resp.json();
      const voted = Boolean(data?.voted);
      const saved = Boolean(data?.saved);
      recordPostLikeSnapshot(postId, undefined, userId, voted, false);
      return {
        voted,
        saved,
      };
    } catch {
      return { voted: false, saved: false };
    } finally {
      setTimeout(() => statusRequestCache.delete(key), 5000);
    }
  })();

  statusRequestCache.set(key, p);
  return p;
}

export async function checkUserVoted(postId: string, userId: string): Promise<boolean> {
  if (!postId || !userId) return false;
  const snap = getPostLikeSnapshot(postId, 0, userId);
  if (snap.hasKnownVote) {
    return snap.voted;
  }
  const st = await fetchUserPostStatus(postId, userId);
  return st.voted;
}

export async function toggleSavePost(
  postId: string,
  _userId: string
): Promise<{ saved: boolean }> {
  const headers = await getRequiredAuthHeader();
  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}/save`, {
    method: 'POST',
    headers,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || 'Could not save post.');
  }
  return { saved: Boolean(data.saved) };
}

export async function checkUserSaved(postId: string, userId: string): Promise<boolean> {
  const st = await fetchUserPostStatus(postId, userId);
  return st.saved;
}

export async function addPostComment(params: {
  postId: string;
  author: {
    uid: string;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
  };
  text: string;
  body?: string;
  isAnonymous: boolean;
  user?: any;
}): Promise<CommonsComment> {
  const headers = await getRequiredAuthHeader();
  const cleanName = params.isAnonymous
    ? 'Anonymous Student'
    : sanitizeStudentDisplayName(params.author.displayName, params.author.uid);

  const resp = await fetch(
    `/api/posts/${encodeURIComponent(params.postId)}/comments`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: params.text.trim(),
        isAnonymous: Boolean(params.isAnonymous),
        authorName: cleanName,
        authorAvatar: params.isAnonymous
          ? null
          : resolveCosmeticItemId(
              params.author.equippedAvatar || params.author.avatarUrl,
              'avatar'
            ),
        authorFrame: params.isAnonymous
          ? null
          : resolveCosmeticItemId(params.author.frame, 'frame'),
        authorEquippedAvatar: params.isAnonymous
          ? null
          : resolveCosmeticItemId(
              params.author.equippedAvatar || params.author.avatarUrl,
              'avatar'
            ),
        authorPhotoURL: null,
      }),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.comment) {
    throw new Error(data?.error || 'Could not post comment.');
  }

  const rawComment = data.comment as CommonsComment;
  return {
    ...rawComment,
    authorAvatar: rawComment.isAnonymous
      ? null
      : resolveCosmeticItemId(rawComment.authorEquippedAvatar || rawComment.authorAvatar, 'avatar'),
    authorEquippedAvatar: rawComment.isAnonymous
      ? null
      : resolveCosmeticItemId(rawComment.authorEquippedAvatar || rawComment.authorAvatar, 'avatar'),
    authorPhotoURL: null,
  };
}

export async function fetchPostComments(postId: string): Promise<CommonsComment[]> {
  if (!postId) return [];
  try {
    const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const list: CommonsComment[] = Array.isArray(data?.comments) ? data.comments : [];
    const authorUids = Array.from(
      new Set(
        list
          .filter((c) => !c.isAnonymous && c.authorUid)
          .map((c) => String(c.authorUid))
      )
    );
    const liveProfiles =
      authorUids.length > 0
        ? await getPublicProfiles(authorUids).catch(() => new Map<string, PublicProfile>())
        : new Map<string, PublicProfile>();

    return list.map((c) => {
      if (c.isAnonymous || !c.authorUid) {
        return {
          ...c,
          authorUid: null,
          authorName: c.anonymousAlias || 'Anonymous Student',
          authorAvatar: null,
          authorEquippedAvatar: null,
          authorPhotoURL: null,
        };
      }
      const live = liveProfiles.get(c.authorUid) || getCachedPublicProfile(c.authorUid);
      const resolvedAvatar =
        resolveCosmeticItemId(
          live?.equippedAvatar || live?.avatar || c.authorEquippedAvatar || c.authorAvatar,
          'avatar'
        ) || null;
      const resolvedFrame =
        resolveCosmeticItemId(live?.equippedFrame || live?.frame || c.authorFrame, 'frame') || null;
      return {
        ...c,
        authorName: live?.displayName || live?.username || c.authorName || 'Student',
        ...(live?.username ? { authorUsername: live.username } : {}),
        authorAvatar: resolvedAvatar,
        authorEquippedAvatar: resolvedAvatar,
        authorFrame: resolvedFrame,
        authorPhotoURL: null,
        authorProBadge:
          live?.proBadge !== undefined ? live.proBadge : c.authorProBadge ?? c.proBadge ?? null,
        proBadge:
          live?.proBadge !== undefined ? live.proBadge : c.proBadge ?? c.authorProBadge ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function reportCommonsPost(params: {
  postId: string;
  reporterUid: string;
  reason: 'spam' | 'harassment' | 'copyright' | 'inaccurate' | 'other';
  details: string;
}): Promise<void> {
  const headers = await getRequiredAuthHeader();
  const resp = await fetch(`/api/posts/${encodeURIComponent(params.postId)}/report`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      reason: params.reason,
      details: params.details.trim(),
    }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to submit report.');
  }
}

export async function searchPeople(searchTerm: string): Promise<CommonsUserPreview[]> {
  const cleaned = searchTerm.trim().toLowerCase().replace(/^@/, '');
  if (!cleaned) return [];

  try {
    const q = query(collection(db, 'publicProfiles'), limit(40));
    const snap = await getDocs(q);
    const results: CommonsUserPreview[] = [];

    snap.docs.forEach((d) => {
      const data = d.data();
      const rawName = data.displayName || data.name || data.username || '';
      const displayName = sanitizeStudentDisplayName(rawName, d.id);
      const username = data.username ? String(data.username) : '';
      const shortId = data.shortId ? String(data.shortId) : '';
      const bio = data.bio || data.tagline || '';

      if (
        displayName.toLowerCase().includes(cleaned) ||
        username.toLowerCase().includes(cleaned) ||
        shortId.toLowerCase().includes(cleaned)
      ) {
        const resolvedStoreAvatar = resolveCosmeticItemId(
          data.equipped?.avatar || data.equippedAvatar || data.avatar || data.avatarUrl,
          'avatar'
        );
        results.push({
          uid: d.id,
          displayName,
          avatarUrl: resolvedStoreAvatar,
          frame: resolveCosmeticItemId(data.frame || data.equipped?.frame, 'frame'),
          equippedAvatar: resolvedStoreAvatar,
          photoURL: null,
          shortId: shortId || undefined,
          bio: bio || null,
          followersCount: Number(data.followersCount || 0),
          followingCount: Number(data.followingCount || 0),
          role: data.role || 'student',
          customRole: data.customRole || null,
          proBadge: data.proBadge ?? null,
        });
      }
    });

    return results.slice(0, 12);
  } catch {
    return [];
  }
}

export async function fetchUserCommonsPosts(
  targetUid: string,
  includeOwnAnonymous = false
): Promise<CommonsPost[]> {
  if (!targetUid) return [];
  try {
    const headers = await getOptionalAuthHeader();
    const params = new URLSearchParams({
      authorUid: targetUid,
      limit: '50',
      ...(includeOwnAnonymous ? { includeOwnAnonymous: 'true' } : {}),
    });
    const resp = await fetch(`/api/posts?${params.toString()}`, {
      headers,
      cache: 'no-store',
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data?.posts)
      ? data.posts.map((p: any) => normalizeCloudflarePost(p))
      : [];
  } catch {
    return [];
  }
}

export async function fetchUserSavedPosts(uid: string): Promise<CommonsPost[]> {
  if (!uid) return [];
  try {
    const headers = await getOptionalAuthHeader();
    const resp = await fetch(
      `/api/posts?savedBy=${encodeURIComponent(uid)}&limit=50`,
      { headers, cache: 'no-store' }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data?.posts)
      ? data.posts.map((p: any) => normalizeCloudflarePost(p))
      : [];
  } catch {
    return [];
  }
}

export async function deleteCommonsPost(
  postId: string,
  _userUid?: string,
  _isAdmin?: boolean
): Promise<void> {
  const headers = await getRequiredAuthHeader();
  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error || 'Could not delete post.');
  }
}
