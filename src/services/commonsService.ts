import { auth } from '@/lib/firebase';
import type {
  CommonsPost,
  CommonsPostType,
  CommonsFileAttachment,
  CommonsComment,
  CommonsUserPreview,
} from '@/types/commons';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { getFollowerIds, getFollowingIds } from '@/services/followService';
import { notifyFollowersOfPost } from '@/services/notificationService';

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

export const DAILY_POST_LIMIT = 10;

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
 * Normalizes a post object returned from `/api/posts` so `createdAt` supports
 * both `.toDate()` (for legacy UI components) and ISO string / Date parsing.
 */
export function normalizeCloudflarePost(raw: Record<string, any>): CommonsPost {
  const createdMs =
    typeof raw.createdAtMs === 'number'
      ? raw.createdAtMs
      : raw.createdAt
      ? Date.parse(String(raw.createdAt)) || Date.now()
      : Date.now();

  const dateObj = new Date(createdMs);
  const timestampCompat = {
    seconds: Math.floor(createdMs / 1000),
    nanoseconds: 0,
    toDate: () => dateObj,
    toMillis: () => createdMs,
  };

  return {
    ...(raw as any),
    id: String(raw.id || ''),
    slug: String(raw.slug || raw.id || ''),
    type: (raw.type || 'notes') as CommonsPostType,
    title: String(raw.title || ''),
    description: String(raw.description || raw.body || ''),
    subject: String(raw.subject || 'General'),
    chapter: String(raw.chapter || 'General'),
    target: String(raw.target || 'General'),
    classLevel: String(raw.classLevel || raw.class || '11'),
    board: String(raw.board || 'Federal'),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    files: Array.isArray(raw.files) ? raw.files : [],
    isAnonymous: Boolean(raw.isAnonymous),
    anonymousAlias: String(raw.anonymousAlias || 'Anonymous Student'),
    authorUid: raw.isAnonymous ? null : raw.authorUid || null,
    authorName: raw.isAnonymous
      ? 'Anonymous Student'
      : String(raw.authorName || 'Student'),
    authorAvatar: raw.isAnonymous ? null : raw.authorAvatar || null,
    authorFrame: raw.isAnonymous ? null : raw.authorFrame || null,
    authorEquippedAvatar: raw.isAnonymous ? null : raw.authorEquippedAvatar || null,
    authorPhotoURL: raw.isAnonymous ? null : raw.authorPhotoURL || null,
    authorRole: raw.isAnonymous
      ? 'student'
      : String(raw.authorUid || '').startsWith('bot_')
      ? 'bot'
      : raw.authorRole || 'student',
    authorCustomRole: raw.isAnonymous ? null : raw.authorCustomRole || null,
    upvotes: Number(raw.upvotes ?? 0),
    downvotes: Number(raw.downvotes ?? 0),
    views: Number(raw.views ?? 0),
    commentCount: Number(raw.commentCount ?? 0),
    saveCount: Number(raw.saveCount ?? 0),
    sharesCount: Number(raw.sharesCount ?? 0),
    reportCount: Number(raw.reportCount ?? 0),
    isHidden: Boolean(raw.isHidden),
    isPinned: Boolean(raw.isPinned),
    isFeatured: Boolean(raw.isFeatured),
    createdAt: timestampCompat as any,
  };
}

export async function checkPostingRateLimit(_uid: string): Promise<{
  allowed: boolean;
  remaining: number;
  count: number;
  isBanned: boolean;
}> {
  // Enforced directly by Cloudflare Worker / D1 rate_limits table on POST /api/posts
  return {
    allowed: true,
    remaining: DAILY_POST_LIMIT,
    count: 0,
    isBanned: false,
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
}): Promise<{ postId: string; post: CommonsPost }> {
  const author = params.author || params.currentUser || {
    uid: auth.currentUser?.uid || '',
    email: auth.currentUser?.email || null,
    displayName: auth.currentUser?.displayName || 'Student',
    photoURL: auth.currentUser?.photoURL || null,
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
      authorAvatar: isAnonymous ? null : author.avatarUrl || author.equippedAvatar || null,
      authorFrame: isAnonymous ? null : author.frame || null,
      authorEquippedAvatar: isAnonymous ? null : author.equippedAvatar || null,
      authorPhotoURL: isAnonymous ? null : author.photoURL || null,
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
    if (resp.status === 401) {
      throw new Error('Please sign in again');
    }
    throw new Error(data?.error || 'Upload failed, try again');
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
            authorName: normalized.authorName || cleanAuthorName,
            authorAvatar:
              author.avatarUrl ||
              author.photoURL ||
              author.equippedAvatar ||
              normalized.authorAvatar ||
              null,
            authorFrame: author.frame || normalized.authorFrame || null,
            postId: normalized.id,
            postSlug: normalized.slug || normalized.id,
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

export async function fetchCommonsPosts(options: {
  subject?: string;
  target?: string;
  type?: CommonsPostType | 'all';
  sortBy?: 'trending' | 'newest' | 'top';
  feedTab?: 'all' | 'following';
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

  let effectiveFollowingUids = options.followingUids;
  if (
    options.feedTab === 'following' &&
    (!effectiveFollowingUids || effectiveFollowingUids.length === 0) &&
    options.currentUid
  ) {
    effectiveFollowingUids = await getFollowingIds(options.currentUid);
  }

  if (
    options.feedTab === 'following' &&
    (!effectiveFollowingUids || effectiveFollowingUids.length === 0)
  ) {
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
  if (options.sortBy) {
    params.set('sort', options.sortBy);
  }
  if (options.searchQuery?.trim()) {
    params.set('q', options.searchQuery.trim());
  }
  if (options.feedTab === 'following' && effectiveFollowingUids?.length) {
    params.set('followingUids', effectiveFollowingUids.join(','));
  }

  const headers = await getOptionalAuthHeader();
  const resp = await fetch(`/api/posts?${params.toString()}`, {
    headers,
    cache: 'no-store',
  });
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !Array.isArray(data?.posts)) {
    throw new Error(data?.error || `Failed to load posts (HTTP ${resp.status}).`);
  }

  const posts = data.posts.map((p: any) => normalizeCloudflarePost(p));
  const nextOffset =
    typeof data.nextOffset === 'number' ? data.nextOffset : offset + pageSize;

  return {
    posts,
    lastDoc: data.hasMore ? nextOffset : null,
    hasMore: Boolean(data.hasMore),
    backendMode: data.backendMode || (data.source === 'cloudflare-d1-r2' ? 'cloudflare-d1-r2' : 'preview-demo'),
  };
}

export async function fetchCommonsPostById(postIdOrSlug: string): Promise<CommonsPost | null> {
  if (!postIdOrSlug) return null;
  try {
    const headers = await getOptionalAuthHeader();
    const resp = await fetch(`/api/posts/${encodeURIComponent(postIdOrSlug)}?view=1`, {
      headers,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.post) return null;
    return normalizeCloudflarePost(data.post);
  } catch {
    return null;
  }
}

export async function togglePostVote(
  postId: string,
  _userId: string
): Promise<{ voted: boolean; newCount: number }> {
  const headers = await getRequiredAuthHeader();
  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || 'Could not update like.');
  }
  return {
    voted: Boolean(data.voted),
    newCount: Number(data.newCount || 0),
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
        { headers }
      );
      if (!resp.ok) return { voted: false, saved: false };
      const data = await resp.json();
      return {
        voted: Boolean(data?.voted),
        saved: Boolean(data?.saved),
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
  isAnonymous: boolean;
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
          : params.author.avatarUrl || params.author.equippedAvatar || null,
        authorFrame: params.isAnonymous ? null : params.author.frame || null,
        authorEquippedAvatar: params.isAnonymous
          ? null
          : params.author.equippedAvatar || null,
        authorPhotoURL: params.isAnonymous ? null : params.author.photoURL || null,
      }),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.comment) {
    throw new Error(data?.error || 'Could not post comment.');
  }

  return data.comment as CommonsComment;
}

export async function fetchPostComments(postId: string): Promise<CommonsComment[]> {
  if (!postId) return [];
  try {
    const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data?.comments) ? data.comments : [];
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
  const cleaned = searchTerm.trim();
  if (!cleaned) return [];

  try {
    const resp = await fetch(`/api/public-profiles?search=${encodeURIComponent(cleaned)}&limit=12`, {
      cache: 'no-store',
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const list: Record<string, any>[] = Array.isArray(json?.profiles) ? json.profiles : [];

    return list.slice(0, 12).map((data) => {
      const uid = String(data.uid || data.id || '');
      const rawName = data.displayName || data.name || data.username || '';
      const displayName = sanitizeStudentDisplayName(rawName, uid);
      return {
        uid,
        displayName,
        avatar: data.avatar || data.avatarUrl || data.equipped?.avatar || null,
        frame: data.frame || data.equipped?.frame || null,
        equippedAvatar: data.equipped?.avatar || data.equippedAvatar || null,
        photoURL: data.photoURL || null,
        shortId: data.shortId ? String(data.shortId) : null,
        bio: data.bio || data.tagline || null,
        followersCount: Number(data.followersCount || 0),
        followingCount: Number(data.followingCount || 0),
        role: data.role || 'student',
        customRole: data.customRole || null,
      };
    });
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
    const resp = await fetch(`/api/posts?${params.toString()}`, { headers });
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
      { headers }
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

export async function deleteCommonsPost(postId: string): Promise<void> {
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
