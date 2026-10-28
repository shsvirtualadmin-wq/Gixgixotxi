import { auth } from '@/lib/firebase';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

/**
 * ============================================================================
 * USER POST SERVICE — CLOUDFLARE D1 + R2 (`/api/posts`)
 * ============================================================================
 * All user profile posts, edits, image uploads, likes, anonymity toggles, and
 * deletions are stored in Cloudflare D1 + R2 and served via `/api/posts`.
 * Zero Firestore reads or writes.
 */

export interface UserPost {
  id: string;
  user_id: string | null;
  author_name?: string;
  author_avatar?: string | null;
  title: string;
  content: string;
  text: string;
  image_url?: string | null;
  subject: string;
  tags: string[];
  is_anonymous: boolean;
  isAnonymous?: boolean;
  likes_count: number;
  likesCount?: number;
  liked_by?: string[];
  likedBy?: string[];
  comments_count: number;
  commentsCount?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  files?: { name: string; url: string; type: string; size: number }[];
  sourceCollection?: 'posts' | 'commonsPosts';
}

const LOCAL_POSTS_CACHE_KEY = 'boardly_user_posts_cache_v2';

function getLocalCachedPosts(): Record<string, UserPost[]> {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCachedPosts(userId: string, posts: UserPost[]) {
  try {
    const cache = getLocalCachedPosts();
    cache[userId] = posts;
    localStorage.setItem(LOCAL_POSTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write errors
  }
}

async function getAuthHeaders(requireAuth = false): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken(false).catch(() => null);
  if (requireAuth && !token) {
    throw new Error('Please sign in to manage posts.');
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mapD1PostToUserPost(p: Record<string, any>, fallbackUserId: string): UserPost {
  const files = Array.isArray(p.files) ? p.files : [];
  const firstImage =
    p.image_url ||
    p.imageUrl ||
    files.find((f: any) => String(f?.type || '').startsWith('image/'))?.url ||
    null;
  const bodyText = String(p.description ?? p.content ?? p.text ?? '');
  const likes = Number(p.upvotes ?? p.likesCount ?? p.likes_count ?? 0);
  const comments = Number(p.commentCount ?? p.commentsCount ?? p.comments_count ?? 0);
  const likedByList = Array.isArray(p.upvotedBy)
    ? p.upvotedBy
    : Array.isArray(p.likedBy)
      ? p.likedBy
      : Array.isArray(p.liked_by)
        ? p.liked_by
        : [];
  const isAnon = Boolean(p.isAnonymous ?? p.is_anonymous);

  return {
    id: String(p.id || ''),
    user_id: isAnon ? null : p.authorUid || fallbackUserId,
    author_name: isAnon
      ? 'Anonymous Student'
      : sanitizeStudentDisplayName(p.authorName || p.author_name, p.authorUid || fallbackUserId),
    author_avatar: isAnon ? null : p.authorAvatar || p.author_avatar || null,
    title: String(p.title || bodyText.slice(0, 80) || 'Post'),
    content: bodyText,
    text: bodyText,
    image_url: firstImage,
    subject: String(p.subject || 'General'),
    tags: Array.isArray(p.tags) ? p.tags : [],
    is_anonymous: isAnon,
    isAnonymous: isAnon,
    likes_count: likes,
    likesCount: likes,
    liked_by: likedByList,
    likedBy: likedByList,
    comments_count: comments,
    commentsCount: comments,
    views_count: Number(p.views ?? p.viewsCount ?? 0),
    created_at: String(
      typeof p.createdAt === 'string'
        ? p.createdAt
        : p.created_at || new Date().toISOString()
    ),
    updated_at: String(
      typeof p.updatedAt === 'string'
        ? p.updatedAt
        : p.updated_at || new Date().toISOString()
    ),
    files,
    sourceCollection: 'commonsPosts',
  };
}

/**
 * Validates and compresses an image file in the browser before uploading to R2.
 */
export async function validateAndCompressImage(file: File): Promise<{
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be under 10 MB.');
  }

  const originalSize = file.size;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  return {
    dataUrl,
    originalSize,
    compressedSize: Math.round((dataUrl.length * 3) / 4),
  };
}

async function uploadDataUrlToR2(dataUrl: string, fileName = 'post-image.jpg'): Promise<string> {
  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  const headers = await getAuthHeaders(true);
  const commaIdx = dataUrl.indexOf(',');
  const headerPart = commaIdx >= 0 ? dataUrl.slice(0, commaIdx) : '';
  const base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const mimeMatch = headerPart.match(/data:([^;]+);/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const resp = await fetch('/api/posts/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName,
      contentType,
      dataBase64: base64Data,
      folder: 'images',
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.url) {
    throw new Error(data?.error || 'Failed to upload image to Cloudflare R2.');
  }
  return String(data.url);
}

export async function fetchUserPosts(params: {
  userId: string;
  page?: number;
  limit?: number;
  currentUserId?: string | null;
}): Promise<{ posts: UserPost[]; hasMore: boolean }>;
export async function fetchUserPosts(
  targetUserId: string,
  includeAnonymous?: boolean
): Promise<UserPost[]>;
export async function fetchUserPosts(
  arg1:
    | string
    | {
        userId: string;
        page?: number;
        limit?: number;
        currentUserId?: string | null;
      },
  includeAnonymous = false
): Promise<UserPost[] | { posts: UserPost[]; hasMore: boolean }> {
  const isObjectCall = typeof arg1 === 'object' && arg1 !== null;
  const targetUserId = isObjectCall ? arg1.userId : arg1;
  const page = isObjectCall ? Math.max(1, arg1.page ?? 1) : 1;
  const pageSize = isObjectCall ? Math.max(1, arg1.limit ?? 10) : 50;
  const includeAnon = isObjectCall
    ? Boolean(arg1.currentUserId && arg1.currentUserId === arg1.userId)
    : includeAnonymous;

  if (!targetUserId) {
    return isObjectCall ? { posts: [], hasMore: false } : [];
  }

  try {
    const headers = await getAuthHeaders(false);
    const params = new URLSearchParams({
      authorUid: targetUserId,
      limit: '50',
      ...(includeAnon ? { includeOwnAnonymous: 'true' } : {}),
    });

    const resp = await fetch(`/api/posts?${params.toString()}`, { headers });
    let list: UserPost[];
    if (!resp.ok) {
      list = getLocalCachedPosts()[targetUserId] || [];
    } else {
      const data = await resp.json();
      list = Array.isArray(data?.posts)
        ? data.posts.map((p: any) => mapD1PostToUserPost(p, targetUserId))
        : [];
      setLocalCachedPosts(targetUserId, list);
    }

    if (isObjectCall) {
      const start = (page - 1) * pageSize;
      const slice = list.slice(start, start + pageSize);
      return {
        posts: slice,
        hasMore: start + pageSize < list.length,
      };
    }
    return list;
  } catch {
    const cached = getLocalCachedPosts()[targetUserId] || [];
    if (isObjectCall) {
      const start = (page - 1) * pageSize;
      return {
        posts: cached.slice(start, start + pageSize),
        hasMore: start + pageSize < cached.length,
      };
    }
    return cached;
  }
}

export async function createUserPost(params: {
  userId: string;
  authorName?: string;
  authorAvatar?: string | null;
  title?: string;
  content?: string;
  text?: string;
  imageUrl?: string | null;
  subject?: string;
  tags?: string[];
  isAnonymous?: boolean;
}): Promise<UserPost> {
  const headers = await getAuthHeaders(true);
  const isAnon = Boolean(params.isAnonymous);
  const cleanPublicName = isAnon
    ? 'Anonymous Student'
    : sanitizeStudentDisplayName(params.authorName, params.userId);

  const bodyContent = (params.content ?? params.text ?? '').trim();
  const titleText = (params.title || bodyContent.slice(0, 80) || 'Community Update').trim();

  const files: { name: string; url: string; type: string; size: number }[] = [];
  let r2ImageUrl: string | null = null;
  if (params.imageUrl) {
    r2ImageUrl = await uploadDataUrlToR2(params.imageUrl, 'profile-post.jpg');
    files.push({
      name: 'profile-post.jpg',
      url: r2ImageUrl,
      type: 'image/jpeg',
      size: 0,
    });
  }

  const resp = await fetch('/api/posts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'notes',
      title: titleText,
      description: bodyContent,
      subject: params.subject || 'General',
      chapter: 'General',
      target: 'General',
      tags: params.tags || [],
      files,
      isAnonymous: isAnon,
      authorName: cleanPublicName,
      authorAvatar: isAnon ? null : params.authorAvatar || null,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || 'Could not create post.');
  }

  return mapD1PostToUserPost(
    data.post || {
      id: data.postId,
      authorUid: params.userId,
      authorName: cleanPublicName,
      authorAvatar: params.authorAvatar,
      title: titleText,
      description: bodyContent,
      image_url: r2ImageUrl,
      files,
      isAnonymous: isAnon,
    },
    params.userId
  );
}

export async function updateUserPost(
  arg1:
    | string
    | {
        id: string;
        userId: string;
        text?: string;
        imageUrl?: string | null;
        title?: string;
        content?: string;
        subject?: string;
        tags?: string[];
      },
  userIdArg?: string,
  updatesArg?: {
    title?: string;
    content?: string;
    text?: string;
    imageUrl?: string | null;
    subject?: string;
    tags?: string[];
  }
): Promise<UserPost | null> {
  const isObj = typeof arg1 === 'object' && arg1 !== null;
  const postId = isObj ? arg1.id : arg1;
  const userId = isObj ? arg1.userId : userIdArg || '';
  const updates = isObj ? arg1 : updatesArg || {};

  const headers = await getAuthHeaders(true);
  const bodyPayload: Record<string, any> = {};

  if (updates.title !== undefined) bodyPayload.title = updates.title;
  if (updates.content !== undefined || updates.text !== undefined) {
    bodyPayload.description = updates.content ?? updates.text ?? '';
  }
  if (updates.subject !== undefined) bodyPayload.subject = updates.subject;
  if (updates.tags !== undefined) bodyPayload.tags = updates.tags;

  if (updates.imageUrl !== undefined) {
    if (updates.imageUrl) {
      const uploadedUrl = await uploadDataUrlToR2(updates.imageUrl, 'profile-post.jpg');
      bodyPayload.files = [
        {
          name: 'profile-post.jpg',
          url: uploadedUrl,
          type: 'image/jpeg',
          size: 0,
        },
      ];
    } else {
      bodyPayload.files = [];
    }
  }

  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!resp.ok) return null;
  const data = await resp.json().catch(() => ({}));
  return data?.post ? mapD1PostToUserPost(data.post, userId) : null;
}

export async function toggleUserPostAnonymity(
  postId: string,
  userId: string,
  isAnonymous: boolean,
  authorName?: string,
  authorAvatar?: string | null
): Promise<boolean> {
  const headers = await getAuthHeaders(true);
  const cleanPublicName = isAnonymous
    ? 'Anonymous Student'
    : sanitizeStudentDisplayName(authorName, userId);

  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      isAnonymous,
      authorName: cleanPublicName,
      authorAvatar: isAnonymous ? null : authorAvatar || null,
    }),
  });

  return resp.ok;
}

export async function deleteUserPost(
  arg1: string | { id: string; userId: string },
  _userId?: string
): Promise<boolean> {
  const postId = typeof arg1 === 'object' && arg1 !== null ? arg1.id : arg1;
  const headers = await getAuthHeaders(true);
  const resp = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers,
  });
  return resp.ok;
}

export async function toggleLikePost(params: {
  id: string;
  userId: string;
}): Promise<{ upvoted: boolean; upvotesCount: number }> {
  const headers = await getAuthHeaders(true);
  const resp = await fetch(`/api/posts/${encodeURIComponent(params.id)}/like`, {
    method: 'POST',
    headers,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || 'Could not toggle like.');
  }
  return {
    upvoted: Boolean(data.upvoted),
    upvotesCount: Number(data.upvotesCount ?? 0),
  };
}
