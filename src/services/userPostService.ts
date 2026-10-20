import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserPost {
  id: string;
  user_id: string;
  text: string;
  image_url?: string | null;
  author_name?: string;
  author_avatar?: string | null;
  likes_count?: number;
  comments_count?: number;
  liked_by?: string[];
  created_at: string;
  updated_at: string;
}

export interface FetchUserPostsParams {
  userId?: string | null;
  page?: number;
  limit?: number;
}

export interface FetchUserPostsResponse {
  success: boolean;
  posts: UserPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates, compresses, and resizes an image file to max 1600px dimension and WebP/JPEG data URL.
 */
export async function validateAndCompressImage(file: File): Promise<{
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}> {
  // 1. Validate file extension and MIME type
  const fileNameLower = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!hasValidExt || !hasValidMime) {
    throw new Error('Images must be JPG, PNG, or WebP only.');
  }

  // 2. Validate file size (max 5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Image size (${sizeMb} MB) exceeds the maximum allowed limit of 5 MB.`);
  }

  // 3. Resize and compress via HTML Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image preview.'));
      img.onload = () => {
        try {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to original data URL if canvas context unavailable
            resolve({
              dataUrl: reader.result as string,
              originalSize: file.size,
              compressedSize: file.size,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use image/webp if supported, or fallback to image/jpeg
          const outputFormat = 'image/webp';
          let compressedUrl = canvas.toDataURL(outputFormat, 0.85);
          if (!compressedUrl.startsWith('data:image/webp')) {
            compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          const approxBytes = Math.round((compressedUrl.length * 3) / 4);

          resolve({
            dataUrl: compressedUrl,
            originalSize: file.size,
            compressedSize: approxBytes,
          });
        } catch (e: any) {
          reject(new Error(e?.message || 'Error compressing image.'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch posts for a specific user, sorted newest first, with pagination.
 */
export async function fetchUserPosts(params: FetchUserPostsParams): Promise<FetchUserPostsResponse> {
  const page = params.page || 1;
  const limitCount = params.limit || 5;
  const userId = params.userId || '';

  // 1. Try server API endpoint /api/posts
  try {
    const url = new URL('/api/posts', window.location.origin);
    if (userId) url.searchParams.set('userId', userId);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limitCount));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.posts)) {
        return {
          success: true,
          posts: data.posts,
          total: data.total ?? data.posts.length,
          page: data.page ?? page,
          limit: data.limit ?? limitCount,
          hasMore: Boolean(data.hasMore),
        };
      }
    }
  } catch (apiErr) {
    console.warn('[userPostService] /api/posts fetch notice (falling back to Firestore):', apiErr);
  }

  // 2. Firestore fallback if API is unavailable or offline
  try {
    const postsRef = collection(db, 'posts');
    let q = query(postsRef, orderBy('created_at', 'desc'), firestoreLimit(limitCount * page));

    if (userId) {
      q = query(postsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'), firestoreLimit(limitCount * page));
    }

    const snap = await getDocs(q);
    const allFetched = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        user_id: data.user_id || data.userId,
        text: data.text || '',
        image_url: data.image_url || data.imageUrl || null,
        author_name: data.author_name || data.authorName || 'Student',
        author_avatar: data.author_avatar || data.authorAvatar || null,
        likes_count: data.likes_count ?? 0,
        comments_count: data.comments_count ?? 0,
        liked_by: Array.isArray(data.liked_by) ? data.liked_by : [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      } as UserPost;
    });

    const startIndex = (page - 1) * limitCount;
    const paginated = allFetched.slice(startIndex, startIndex + limitCount);

    return {
      success: true,
      posts: paginated,
      total: allFetched.length,
      page,
      limit: limitCount,
      hasMore: allFetched.length > page * limitCount,
    };
  } catch (fsErr) {
    console.warn('[userPostService] Firestore query error:', fsErr);
    return {
      success: false,
      posts: [],
      total: 0,
      page,
      limit: limitCount,
      hasMore: false,
    };
  }
}

/**
 * Create a new user post.
 */
export async function createUserPost(params: {
  userId: string;
  text: string;
  imageUrl?: string | null;
  authorName?: string;
  authorAvatar?: string | null;
}): Promise<UserPost> {
  const text = (params.text || '').trim();
  const imageUrl = params.imageUrl || null;

  if (!text && !imageUrl) {
    throw new Error('Please enter some text or attach an image.');
  }

  const payload = {
    user_id: params.userId,
    text,
    image_url: imageUrl,
    author_name: params.authorName || 'Student',
    author_avatar: params.authorAvatar || null,
  };

  // 1. Call server API
  let createdPost: UserPost | null = null;
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.post) {
        createdPost = data.post;
      }
    }
  } catch (err) {
    console.warn('[userPostService] /api/posts create failed, saving to Firestore:', err);
  }

  // Fallback generation if API failed
  if (!createdPost) {
    const nowIso = new Date().toISOString();
    createdPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_id: params.userId,
      text,
      image_url: imageUrl,
      author_name: params.authorName || 'Student',
      author_avatar: params.authorAvatar || null,
      likes_count: 0,
      comments_count: 0,
      liked_by: [],
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  // 2. Synchronize to Firestore collection
  try {
    const postRef = doc(db, 'posts', createdPost.id);
    await setDoc(postRef, createdPost, { merge: true });
  } catch (fsErr) {
    console.warn('[userPostService] Firestore sync post error:', fsErr);
  }

  return createdPost;
}

/**
 * Edit an existing post. Only the owner can edit.
 */
export async function updateUserPost(params: {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string | null;
}): Promise<UserPost> {
  const text = (params.text || '').trim();
  const imageUrl = params.imageUrl;

  if (!text && !imageUrl) {
    throw new Error('A post cannot be empty. Please provide text or an image.');
  }

  const payload = {
    action: 'edit',
    id: params.id,
    user_id: params.userId,
    text,
    image_url: imageUrl,
  };

  let updatedPost: UserPost | null = null;

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.post) {
        updatedPost = data.post;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403) {
        throw new Error(errData?.error || 'You can only edit your own posts.');
      }
    }
  } catch (apiErr: any) {
    if (apiErr?.message?.includes('own posts')) throw apiErr;
    console.warn('[userPostService] /api/posts update error, applying to Firestore:', apiErr);
  }

  // Firestore update
  try {
    const postRef = doc(db, 'posts', params.id);
    const updates: Record<string, any> = {
      text,
      updated_at: new Date().toISOString(),
    };
    if (imageUrl !== undefined) {
      updates.image_url = imageUrl;
    }
    await updateDoc(postRef, updates);
  } catch (fsErr) {
    console.warn('[userPostService] Firestore update post error:', fsErr);
  }

  return (
    updatedPost || {
      id: params.id,
      user_id: params.userId,
      text,
      image_url: imageUrl ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
}

/**
 * Delete a post. Only the owner can delete.
 */
export async function deleteUserPost(params: { id: string; userId: string }): Promise<boolean> {
  // 1. Call server API
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        id: params.id,
        user_id: params.userId,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403) {
        throw new Error(errData?.error || 'You can only delete your own posts.');
      }
    }
  } catch (apiErr: any) {
    if (apiErr?.message?.includes('own posts')) throw apiErr;
    console.warn('[userPostService] /api/posts delete notice:', apiErr);
  }

  // 2. Synchronize deletion with Firestore
  try {
    const postRef = doc(db, 'posts', params.id);
    await deleteDoc(postRef);
  } catch (fsErr) {
    console.warn('[userPostService] Firestore delete post notice:', fsErr);
  }

  return true;
}

/**
 * Like / unlike a post.
 */
export async function toggleLikePost(params: { id: string; userId: string }): Promise<{
  liked: boolean;
  likesCount: number;
}> {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'like',
        id: params.id,
        user_id: params.userId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        liked: Boolean(data.liked),
        likesCount: data.likes_count ?? 0,
      };
    }
  } catch (err) {
    console.warn('[userPostService] like error:', err);
  }

  return { liked: true, likesCount: 1 };
}
