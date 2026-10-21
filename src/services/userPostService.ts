import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
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
  currentUserId?: string | null;
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
 * Checks posts/{postId}/likes/{uid} subcollection and liked_by array to ensure like state is accurately hydrated.
 */
export async function fetchUserPosts(params: FetchUserPostsParams): Promise<FetchUserPostsResponse> {
  const page = params.page || 1;
  const limitCount = params.limit || 5;
  const userId = params.userId || '';
  const currentUserId = params.currentUserId || '';

  let postsList: UserPost[] = [];
  let totalCount = 0;
  let hasMorePosts = false;

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
        postsList = data.posts;
        totalCount = data.total ?? data.posts.length;
        hasMorePosts = Boolean(data.hasMore);
      }
    }
  } catch (apiErr) {
    console.warn('[userPostService] /api/posts fetch notice (falling back to Firestore):', apiErr);
  }

  // 2. Firestore fallback if API is unavailable or offline
  if (postsList.length === 0) {
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
          likes_count: data.likes_count ?? data.likesCount ?? 0,
          comments_count: data.comments_count ?? data.commentCount ?? 0,
          liked_by: Array.isArray(data.liked_by) ? data.liked_by : Array.isArray(data.likedBy) ? data.likedBy : [],
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        } as UserPost;
      });

      const startIndex = (page - 1) * limitCount;
      postsList = allFetched.slice(startIndex, startIndex + limitCount);
      totalCount = allFetched.length;
      hasMorePosts = allFetched.length > page * limitCount;
    } catch (fsErr: any) {
      console.warn('[userPostService] Firestore query error:', fsErr);
    }
  }

  // 3. Hydrate like state for current user from posts/{id}/likes/{currentUserId} if needed
  if (currentUserId && postsList.length > 0) {
    try {
      await Promise.all(
        postsList.map(async (post) => {
          const likedByArray = Array.isArray(post.liked_by) ? post.liked_by : [];
          if (!likedByArray.includes(currentUserId)) {
            const likeDocRef = doc(db, 'posts', post.id, 'likes', currentUserId);
            const likeDocSnap = await getDoc(likeDocRef);
            if (likeDocSnap.exists()) {
              post.liked_by = [...likedByArray, currentUserId];
            }
          }
        })
      );
    } catch (likeCheckErr) {
      console.warn('[userPostService] like check hydration notice:', likeCheckErr);
    }
  }

  return {
    success: true,
    posts: postsList,
    total: totalCount,
    page,
    limit: limitCount,
    hasMore: hasMorePosts,
  };
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
 * Stores like in subcollection posts/{postId}/likes/{userId} and maintains liked_by[] array on posts/{postId}.
 */
export async function toggleLikePost(params: { id: string; userId: string }): Promise<{
  liked: boolean;
  likesCount: number;
}> {
  if (!params.id || !params.userId) {
    throw new Error('Post ID and User ID required to toggle like.');
  }

  const postRef = doc(db, 'posts', params.id);
  const likeRef = doc(db, 'posts', params.id, 'likes', params.userId);

  try {
    const result = await runTransaction(db, async (tx) => {
      const [postSnap, likeSnap] = await Promise.all([
        tx.get(postRef),
        tx.get(likeRef),
      ]);

      const isLiked = likeSnap.exists();
      const currentData = postSnap.exists() ? postSnap.data() : null;
      const currentLikedBy: string[] = Array.isArray(currentData?.liked_by)
        ? currentData.liked_by
        : Array.isArray(currentData?.likedBy)
        ? currentData.likedBy
        : [];
      const currentCount = typeof currentData?.likes_count === 'number'
        ? currentData.likes_count
        : typeof currentData?.likesCount === 'number'
        ? currentData.likesCount
        : currentLikedBy.length;

      if (isLiked) {
        // Unlike
        tx.delete(likeRef);
        const newCount = Math.max(0, currentCount - 1);
        const newLikedBy = currentLikedBy.filter((u) => u !== params.userId);
        if (postSnap.exists()) {
          tx.update(postRef, {
            likes_count: newCount,
            likesCount: newCount,
            liked_by: newLikedBy,
            likedBy: newLikedBy,
            updated_at: new Date().toISOString(),
          });
        }
        return { liked: false, likesCount: newCount };
      } else {
        // Like
        tx.set(likeRef, {
          uid: params.userId,
          createdAt: serverTimestamp(),
        });
        const newCount = currentCount + 1;
        const newLikedBy = currentLikedBy.includes(params.userId) ? currentLikedBy : [...currentLikedBy, params.userId];
        if (postSnap.exists()) {
          tx.update(postRef, {
            likes_count: newCount,
            likesCount: newCount,
            liked_by: newLikedBy,
            likedBy: newLikedBy,
            updated_at: new Date().toISOString(),
          });
        }
        return { liked: true, likesCount: newCount };
      }
    });

    // Also notify server in background if available
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'like',
        id: params.id,
        user_id: params.userId,
      }),
    }).catch(() => {});

    return result;
  } catch (err: any) {
    console.error(
      '[userPostService] toggleLikePost error:',
      err?.code || 'ERROR',
      `posts/${params.id}/likes/${params.userId}`,
      err
    );
    throw err;
  }
}

/**
 * Checks if a user has liked a specific post.
 */
export async function checkUserLikedPost(postId: string, userId: string): Promise<boolean> {
  if (!postId || !userId) return false;
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch (err: any) {
    console.error(
      '[userPostService] checkUserLikedPost error:',
      err?.code || 'ERROR',
      `posts/${postId}/likes/${userId}`,
      err
    );
    return false;
  }
}
