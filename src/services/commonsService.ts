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
  limit,
  startAfter,
  serverTimestamp,
  increment,
  writeBatch,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import type {
  CommonsPost,
  CommonsPostType,
  CommonsPrivatePost,
  CommonsComment,
  CommonsFileAttachment,
  CommonsUserPreview,
} from '@/types/commons';
import { getFollowingIds, fetchUserFollowers } from '@/services/followService';
import { notifyFollowersOfPost } from '@/services/notificationService';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

const DAILY_POST_LIMIT = 10;
const DISALLOWED_FILE_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bin',
  '.msi',
  '.apk',
  '.jar',
  '.scr',
  '.vbs',
  '.js',
  '.com',
  '.wsf',
  '.ps1',
];

const ANONYMOUS_ADJECTIVES = [
  'Curious',
  'Diligent',
  'Tenacious',
  'Focused',
  'Brilliant',
  'Strategic',
  'Resilient',
  'Aspiring',
  'Analytical',
  'Keen',
];

const ANONYMOUS_NOUNS = [
  'Scholar',
  'Engineer',
  'Falcon',
  'Physicist',
  'Mathematician',
  'Doctor',
  'Strategist',
  'Innovator',
  'Learner',
  'Achiever',
];

export function generateAnonymousAlias(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${noun} #${num}`;
}

/**
 * Generate comprehensive searchable keywords array (tokens + word prefixes 3..12 chars).
 */
export function generateSearchKeywords(params: {
  title: string;
  description: string;
  tags: string[];
  subject: string;
  chapter: string;
  target: string;
  type: string;
}): string[] {
  const rawText = [
    params.title,
    params.description,
    ...params.tags,
    params.subject,
    params.chapter,
    params.target,
    params.type,
  ]
    .join(' ')
    .toLowerCase();

  // Clean and split words
  const words = rawText
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const keywordsSet = new Set<string>();

  words.forEach((word) => {
    keywordsSet.add(word);
    // Add prefixes for substring search
    if (word.length >= 3) {
      for (let i = 3; i <= Math.min(word.length, 12); i++) {
        keywordsSet.add(word.slice(0, i));
      }
    }
  });

  // Limit array size to stay safely within Firestore 20KB index limits (max 80 tokens)
  return Array.from(keywordsSet).slice(0, 80);
}

/**
 * Check if a file extension is blocked for safety.
 */
export function isExecutableFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return DISALLOWED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Verify user posting quota (10 posts per day).
 */
export async function checkPostingRateLimit(uid: string): Promise<{
  allowed: boolean;
  todayCount: number;
  remaining: number;
}> {
  try {
    const dateKey = getPKTDateKey();
    const usageRef = doc(db, 'users', uid, 'usage', dateKey);
    const snap = await getDoc(usageRef);
    const count = Number(snap.data()?.commonsPostsCount ?? 0);

    return {
      allowed: count < DAILY_POST_LIMIT,
      todayCount: count,
      remaining: Math.max(0, DAILY_POST_LIMIT - count),
    };
  } catch (err) {
    console.warn('[commonsService] rate limit check warning:', err);
    return { allowed: true, todayCount: 0, remaining: DAILY_POST_LIMIT };
  }
}

/**
 * Increment daily post count.
 */
async function recordPostUsage(uid: string): Promise<void> {
  try {
    const dateKey = getPKTDateKey();
    const usageRef = doc(db, 'users', uid, 'usage', dateKey);
    await setDoc(
      usageRef,
      {
        commonsPostsCount: increment(1),
        lastPostAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[commonsService] usage record notice:', err);
  }
}

/**
 * Create a new Commons post (Public doc + Private author record for moderation).
 */
export async function createCommonsPost(params: {
  currentUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
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
}): Promise<string> {
  const { currentUser } = params;

  // 1. Rate limit verification
  const rateLimit = await checkPostingRateLimit(currentUser.uid);
  if (!rateLimit.allowed) {
    throw new Error(`Daily posting limit reached (${DAILY_POST_LIMIT} posts/day). Please try again tomorrow.`);
  }

  // 2. Validate attachments
  if (params.files.length > 5) {
    throw new Error('Maximum 5 files allowed per post.');
  }
  for (const f of params.files) {
    if (isExecutableFile(f.name)) {
      throw new Error(`Executable file "${f.name}" is forbidden for security.`);
    }
    if (f.size > 25 * 1024 * 1024) {
      throw new Error(`File "${f.name}" exceeds the 25 MB limit.`);
    }
  }

  // 3. Prepare Post ID & Author Identifiers
  const postRef = doc(collection(db, 'commonsPosts'));
  const postId = postRef.id;

  let publicAuthorUid: string | null = currentUser.uid;
  let publicAuthorName = sanitizeStudentDisplayName(currentUser.displayName, currentUser.uid);
  // Priority: 1. equippedAvatar, 2. avatarUrl, 3. photoURL (Google), 4. null
  let publicAuthorAvatar: string | null =
    currentUser.equippedAvatar || currentUser.avatarUrl || currentUser.photoURL || null;
  let authorFrame: string | null = currentUser.frame || null;
  let authorEquippedAvatar: string | null = currentUser.equippedAvatar || null;
  let authorPhotoURL: string | null = currentUser.photoURL || null;
  let authorRole: string | null = (currentUser as any).role || 'Student';
  let authorCustomRole: string | null = (currentUser as any).customRole || null;
  let authorAlias: string | undefined = undefined;

  if (params.isAnonymous) {
    publicAuthorUid = null;
    authorAlias = undefined;
    publicAuthorName = 'Anonymous';
    publicAuthorAvatar = null;
    authorFrame = null;
    authorEquippedAvatar = null;
    authorPhotoURL = null;
    authorRole = null;
    authorCustomRole = null;
  }

  const searchKeywords = generateSearchKeywords({
    title: params.title,
    description: params.description,
    tags: params.tags,
    subject: params.subject || '',
    chapter: params.chapter || '',
    target: params.target || '',
    type: params.type,
  });

  const now = serverTimestamp();

  const publicData: Omit<CommonsPost, 'id'> = {
    type: params.type,
    title: params.title.trim(),
    description: params.description.trim(),
    subject: params.subject || '',
    chapter: params.chapter || '',
    target: params.target || '',
    tags: params.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    files: params.files,
    isAnonymous: Boolean(params.isAnonymous),
    authorUid: publicAuthorUid,
    authorName: publicAuthorName,
    authorAvatar: publicAuthorAvatar,
    authorFrame,
    authorEquippedAvatar,
    authorPhotoURL,
    authorRole,
    authorCustomRole,
    upvotes: 0,
    commentCount: 0,
    saveCount: 0,
    reportCount: 0,
    isHidden: false,
    searchKeywords,
    createdAt: now,
    updatedAt: now,
  };

  const privateData: CommonsPrivatePost = {
    postId,
    authorUid: currentUser.uid,
    ...(currentUser.email ? { authorEmail: currentUser.email } : {}),
    authorName: currentUser.displayName || 'Student',
    isAnonymous: Boolean(params.isAnonymous),
    createdAt: now,
  };

  const batch = writeBatch(db);
  batch.set(postRef, publicData);
  // Author & admin private audit doc (postsPrivate)
  const postsPrivateRef = doc(db, 'postsPrivate', postId);
  batch.set(postsPrivateRef, privateData);

  await batch.commit();

  // Fire-and-forget post usage counter and follower notifications so the UI never hangs
  void recordPostUsage(currentUser.uid);

  if (!params.isAnonymous && currentUser.uid) {
    void (async () => {
      try {
        const followers = await fetchUserFollowers(currentUser.uid, 100);
        const followerUids = followers.map((f) => f.uid).filter(Boolean);
        if (followerUids.length > 0) {
          await notifyFollowersOfPost({
            followerUids,
            authorId: currentUser.uid,
            authorName: publicAuthorName,
            postId,
            postTitle: params.title,
            isAnonymous: false,
          });
        }
      } catch (notifErr) {
        console.warn('[commonsService] Failed to notify followers:', notifErr);
      }
    })();
  }

  return postId;
}

/**
 * Fetch Commons feed posts with filtering & pagination.
 */
export async function fetchCommonsPosts(params: {
  feedTab?: 'all' | 'following' | 'for_you';
  subject?: string;
  type?: string;
  target?: string;
  searchQuery?: string;
  lastVisibleDoc?: DocumentSnapshot | null;
  pageSize?: number;
  currentUid?: string | null;
}): Promise<{ posts: CommonsPost[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  const limitCount = params.pageSize || 20;

  try {
    // Single-field index on createdAt ensures instant execution without requiring composite index creation
    let q = query(
      collection(db, 'commonsPosts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2)
    );

    // If querying by first keyword token
    if (params.searchQuery && params.searchQuery.trim().length >= 2) {
      const firstToken = params.searchQuery.trim().toLowerCase().split(/\s+/)[0];
      q = query(
        collection(db, 'commonsPosts'),
        where('searchKeywords', 'array-contains', firstToken),
        limit(limitCount * 2)
      );
    }

    if (params.lastVisibleDoc) {
      q = query(q, startAfter(params.lastVisibleDoc));
    }

    const snap = await getDocs(q);
    let posts: CommonsPost[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CommonsPost, 'id'>),
    }));

    // Client-side filtering for isHidden
    posts = posts.filter((p) => p.isHidden !== true);

    // Handle "following" tab: filter to followed creators (anonymous posts never shown in Following)
    if (params.feedTab === 'following') {
      if (!params.currentUid) {
        return { posts: [], lastDoc: null, hasMore: false };
      }
      try {
        const followedIdsList = await getFollowingIds(params.currentUid);
        const followedUids = new Set<string>(followedIdsList);

        // Also check legacy subcollection if user has older follow entries
        if (followedUids.size === 0) {
          const legacyFollowingSnap = await getDocs(
            collection(db, 'publicProfiles', params.currentUid, 'following')
          ).catch(() => null);
          legacyFollowingSnap?.docs.forEach((d) => followedUids.add(d.id));
        }

        posts = posts.filter(
          (p) => !p.isAnonymous && p.authorUid && followedUids.has(p.authorUid)
        );
      } catch (err) {
        console.warn('[commonsService] error fetching followed list for following tab:', err);
        posts = [];
      }
    }

    // Client-side filtering for combined chips and multi-word searches
    if (params.subject && params.subject !== 'all') {
      const s = params.subject.toLowerCase();
      posts = posts.filter((p) => p.subject?.toLowerCase() === s);
    }

    if (params.type && params.type !== 'all') {
      posts = posts.filter((p) => p.type === params.type);
    }

    if (params.target && params.target !== 'all') {
      const t = params.target.toLowerCase();
      posts = posts.filter((p) => p.target?.toLowerCase().includes(t) || t.includes(p.target?.toLowerCase()));
    }

    if (params.searchQuery && params.searchQuery.trim().length >= 2) {
      const tokens = params.searchQuery.toLowerCase().trim().split(/\s+/);
      posts = posts.filter((post) => {
        const text = `${post.title || ''} ${post.description || ''} ${post.subject || ''} ${post.chapter || ''} ${post.target || ''} ${(post.tags || []).join(' ')}`.toLowerCase();
        return tokens.every((token) => text.includes(token));
      });
    }

    // Sort pinned posts first in the order pinned, then normal posts newest first
    posts = sortCommonsPosts(posts);

    const trimmed = posts.slice(0, limitCount);
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= limitCount;

    return { posts: trimmed, lastDoc, hasMore };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[commonsService] fetchCommonsPosts notice (using local feed fallback):', errorMsg);
    return { posts: [], lastDoc: null, hasMore: false };
  }
}

export function isPostPinned(post: CommonsPost): boolean {
  if (post.isPinned || (post as any).pinned) return true;
  const isSuperAdminAuthor =
    post.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
    post.authorRole === 'superadmin' ||
    (post as any).authorRole === 'admin';
  if (
    isSuperAdminAuthor &&
    (post.title?.toLowerCase().includes('welcome') ||
      post.title?.toLowerCase().includes('guideline'))
  ) {
    return true;
  }
  return false;
}

export function getPostMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (val?.seconds) return val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1000000) : 0);
  if (val instanceof Date) return val.getTime();
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Sorts posts so pinned posts appear at the top in the order they were pinned,
 * followed by normal posts newest first.
 */
export function sortCommonsPosts(posts: CommonsPost[]): CommonsPost[] {
  const pinned: CommonsPost[] = [];
  const normal: CommonsPost[] = [];

  for (const post of posts) {
    if (isPostPinned(post)) {
      pinned.push(post);
    } else {
      normal.push(post);
    }
  }

  // Pinned posts: in the order they were pinned (pinnedAt / createdAt ascending)
  pinned.sort((a, b) => {
    const timeA = getPostMillis((a as any).pinnedAt) || getPostMillis(a.createdAt);
    const timeB = getPostMillis((b as any).pinnedAt) || getPostMillis(b.createdAt);
    return timeA - timeB;
  });

  // Normal posts: newest first
  normal.sort((a, b) => {
    const timeA = getPostMillis(a.createdAt);
    const timeB = getPostMillis(b.createdAt);
    return timeB - timeA;
  });

  return [...pinned, ...normal];
}

export async function fetchCommonsPostById(postId: string): Promise<CommonsPost | null> {
  if (!postId) return null;
  try {
    const snap = await getDoc(doc(db, 'commonsPosts', postId));
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...(snap.data() as Omit<CommonsPost, 'id'>),
    };
  } catch (err) {
    console.warn('[commonsService] fetchCommonsPostById notice:', err);
    return null;
  }
}

const voteStatusCache = new Map<string, boolean>();
const saveStatusCache = new Map<string, boolean>();

/**
 * Toggle upvote on a post with atomic counter update.
 */
export async function togglePostVote(
  postId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }> {
  const voteRef = doc(db, 'commonsPosts', postId, 'votes', userId);
  const postRef = doc(db, 'commonsPosts', postId);

  const voteSnap = await getDoc(voteRef);
  const isVoted = voteSnap.exists();

  const batch = writeBatch(db);

  if (isVoted) {
    batch.delete(voteRef);
    batch.update(postRef, {
      upvotes: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(voteRef, {
      userId,
      postId,
      createdAt: serverTimestamp(),
    });
    batch.update(postRef, {
      upvotes: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  // Update in-memory vote cache
  voteStatusCache.set(`${postId}_${userId}`, !isVoted);

  // Read latest upvotes
  const updatedSnap = await getDoc(postRef);
  const count = Number(updatedSnap.data()?.upvotes ?? 0);

  return { voted: !isVoted, newCount: Math.max(0, count) };
}

/**
 * Check if the user has voted on a post with in-memory caching.
 */
export async function checkUserVoted(postId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  const key = `${postId}_${userId}`;
  if (voteStatusCache.has(key)) {
    return voteStatusCache.get(key)!;
  }
  try {
    const voteRef = doc(db, 'commonsPosts', postId, 'votes', userId);
    const snap = await getDoc(voteRef);
    const hasVoted = snap.exists();
    voteStatusCache.set(key, hasVoted);
    return hasVoted;
  } catch {
    return false;
  }
}

/**
 * Toggle bookmark / saved post.
 */
export async function toggleSavePost(
  postId: string,
  userId: string
): Promise<{ saved: boolean }> {
  const saveRef = doc(db, 'users', userId, 'savedCommons', postId);
  const postRef = doc(db, 'commonsPosts', postId);

  const saveSnap = await getDoc(saveRef);
  const isSaved = saveSnap.exists();

  const batch = writeBatch(db);

  if (isSaved) {
    batch.delete(saveRef);
    batch.update(postRef, { saveCount: increment(-1) });
  } else {
    batch.set(saveRef, { postId, savedAt: serverTimestamp() });
    batch.update(postRef, { saveCount: increment(1) });
  }

  await batch.commit();

  saveStatusCache.set(`${postId}_${userId}`, !isSaved);
  return { saved: !isSaved };
}

/**
 * Check if user has saved a post with in-memory caching.
 */
export async function checkUserSaved(postId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  const key = `${postId}_${userId}`;
  if (saveStatusCache.has(key)) {
    return saveStatusCache.get(key)!;
  }
  try {
    const saveRef = doc(db, 'users', userId, 'savedCommons', postId);
    const snap = await getDoc(saveRef);
    const isSaved = snap.exists();
    saveStatusCache.set(key, isSaved);
    return isSaved;
  } catch {
    return false;
  }
}

/**
 * Submit comment to a post.
 */
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
  isAnonymous?: boolean;
}): Promise<CommonsComment> {
  if (!params.postId) throw new Error('Missing post ID');
  if (!params.author?.uid) throw new Error('Must be signed in to comment');

  const commentRef = doc(collection(db, 'commonsPosts', params.postId, 'comments'));
  const postRef = doc(db, 'commonsPosts', params.postId);

  const cleanText = params.text.trim();
  if (!cleanText) throw new Error('Comment text cannot be empty');
  if (cleanText.length > 1000) throw new Error('Comment exceeds 1,000 characters');

  const isAnon = Boolean(params.isAnonymous);

  // For anonymous comments, NEVER store real UID in the public comment document;
  // store moderation ownership in postsPrivate/{postId}_comment_{commentId}.
  const publicAuthorUid = isAnon ? null : params.author.uid;
  const authorName = isAnon
    ? 'Anonymous'
    : sanitizeStudentDisplayName(params.author.displayName, params.author.uid);

  // Avatar priority: equippedAvatar -> avatarUrl -> photoURL -> null
  const authorAvatar = isAnon
    ? null
    : params.author.equippedAvatar || params.author.avatarUrl || params.author.photoURL || null;
  const authorFrame = isAnon ? null : params.author.frame || null;
  const authorEquippedAvatar = isAnon ? null : params.author.equippedAvatar || null;
  const authorPhotoURL = isAnon ? null : params.author.photoURL || null;
  const authorRole = isAnon ? null : ((params.author as any).role || 'Student');
  const authorCustomRole = isAnon ? null : ((params.author as any).customRole || null);

  const commentData: Omit<CommonsComment, 'id'> = {
    postId: params.postId,
    authorUid: publicAuthorUid,
    uid: publicAuthorUid || undefined,
    authorName,
    authorAvatar,
    authorFrame,
    authorEquippedAvatar,
    authorPhotoURL,
    authorRole,
    authorCustomRole,
    isAnonymous: isAnon,
    text: cleanText,
    createdAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(commentRef, commentData);
    if (isAnon) {
      const commentPrivateRef = doc(db, 'postsPrivate', `${params.postId}_comment_${commentRef.id}`);
      batch.set(commentPrivateRef, {
        postId: params.postId,
        commentId: commentRef.id,
        authorUid: params.author.uid,
        authorEmail: params.author.email || null,
        isAnonymous: true,
        createdAt: serverTimestamp(),
      });
    }
    batch.update(postRef, {
      commentCount: increment(1),
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      id: commentRef.id,
      ...commentData,
    };
  } catch (err: any) {
    console.error(
      '[commonsService] addPostComment error:',
      err?.code || 'ERROR',
      `commonsPosts/${params.postId}/comments/${commentRef.id}`,
      err
    );
    throw err;
  }
}

/**
 * Fetch comments for a post.
 */
export async function fetchPostComments(postId: string): Promise<CommonsComment[]> {
  try {
    const q = query(
      collection(db, 'commonsPosts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CommonsComment, 'id'>),
    }));
  } catch (err) {
    console.error('[commonsService] fetchPostComments error:', err);
    return [];
  }
}

/**
 * Report a post for moderation. Auto-hides when reportCount reaches 3.
 */
export async function reportCommonsPost(params: {
  postId: string;
  reporterUid: string;
  reason: 'spam' | 'harassment' | 'copyright' | 'inaccurate' | 'other';
  details?: string;
}): Promise<{ autoHidden: boolean }> {
  const reportRef = doc(collection(db, 'commonsReports'));
  const postRef = doc(db, 'commonsPosts', params.postId);

  const batch = writeBatch(db);
  batch.set(reportRef, {
    postId: params.postId,
    reporterUid: params.reporterUid,
    reason: params.reason,
    details: params.details || '',
    createdAt: serverTimestamp(),
    status: 'pending',
  });

  batch.update(postRef, { reportCount: increment(1) });
  await batch.commit();

  // Check if auto-hide threshold met
  const postSnap = await getDoc(postRef);
  const reportCount = Number(postSnap.data()?.reportCount ?? 1);
  let autoHidden = false;

  if (reportCount >= 3) {
    await updateDoc(postRef, { isHidden: true });
    autoHidden = true;
  }

  return { autoHidden };
}

/**
 * Search students (people) by prefix on displayName.
 * Strictly avoids exposing emails.
 */
export async function searchPeople(queryText: string): Promise<CommonsUserPreview[]> {
  if (!queryText || queryText.trim().length < 2) return [];
  const cleanQ = queryText.trim().toLowerCase();

  try {
    const q = query(
      collection(db, 'publicProfiles'),
      limit(50)
    );
    const snap = await getDocs(q);

    const matches: CommonsUserPreview[] = [];
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const displayName = String(data.displayName || '').toLowerCase();
      const nickname = String(data.nickname || '').toLowerCase();
      const username = String(data.username || '').toLowerCase();

      if (displayName.includes(cleanQ) || nickname.includes(cleanQ) || username.includes(cleanQ)) {
        matches.push({
          uid: docSnap.id,
          displayName: data.displayName || data.nickname || 'Student',
          nickname: data.nickname || data.displayName || 'Student',
          username: data.username || undefined,
          role: data.role || 'Student',
          customRole: data.customRole || undefined,
          isSuperAdmin: Boolean(data.isSuperAdmin || data.role === 'superadmin' || docSnap.id === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'),
          shortId: data.shortId,
          avatarUrl: data.avatarUrl || data.photoURL,
          photoURL: data.photoURL,
          equippedAvatar: data.equippedAvatar,
          frame: data.frame,
          targetUniversity: data.targetUniversity,
          streak: data.streak,
        });
      }
    });

    return matches;
  } catch (err) {
    console.warn('[commonsService] searchPeople notice:', err);
    return [];
  }
}

/**
 * Delete a post (by author or superadmin).
 */
export async function deleteCommonsPost(postId: string, userUid: string, isAdmin = false): Promise<void> {
  const postRef = doc(db, 'commonsPosts', postId);
  const postsPrivateRef = doc(db, 'postsPrivate', postId);
  const legacyPrivateRef = doc(db, 'postPrivate', postId);

  // Author verification check across public post and postsPrivate
  const [postSnap, postsPrivateSnap] = await Promise.all([
    getDoc(postRef),
    getDoc(postsPrivateRef).catch(() => null),
  ]);

  const publicAuthorUid = postSnap.data()?.authorUid;
  const privateAuthorUid = postsPrivateSnap?.data()?.authorUid;

  if (!isAdmin && publicAuthorUid !== userUid && privateAuthorUid !== userUid) {
    throw new Error('Unauthorized to delete this post.');
  }

  const batch = writeBatch(db);
  batch.delete(postRef);
  if (postsPrivateSnap?.exists()) {
    batch.delete(postsPrivateRef);
  }
  try {
    const legacySnap = await getDoc(legacyPrivateRef);
    if (legacySnap.exists()) {
      batch.delete(legacyPrivateRef);
    }
  } catch {
    // Ignore legacy collection permission notice
  }
  await batch.commit();
}

/**
 * Fetch a user's PUBLIC posts only (isAnonymous == false).
 * Enforces privacy: Anonymous posts never appear here.
 */
export async function fetchUserPublicPosts(
  authorUid: string,
  lastVisibleDoc?: DocumentSnapshot | null,
  pageSize = 10
): Promise<{ posts: CommonsPost[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  if (!authorUid) return { posts: [], lastDoc: null, hasMore: false };

  try {
    let q = query(
      collection(db, 'commonsPosts'),
      where('authorUid', '==', authorUid),
      where('isAnonymous', '==', false),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (lastVisibleDoc) {
      q = query(
        collection(db, 'commonsPosts'),
        where('authorUid', '==', authorUid),
        where('isAnonymous', '==', false),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc),
        limit(pageSize + 1)
      );
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const returnDocs = hasMore ? docs.slice(0, pageSize) : docs;
    const lastDoc = returnDocs.length > 0 ? returnDocs[returnDocs.length - 1] : null;

    const posts: CommonsPost[] = returnDocs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CommonsPost, 'id'>),
      isAnonymous: Boolean(d.data().isAnonymous),
    }));

    return { posts, lastDoc, hasMore };
  } catch (err) {
    console.warn('[commonsService] fetchUserPublicPosts warning:', err);
    return { posts: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch OWN posts (both public and anonymous created by this user).
 */
export async function fetchUserOwnPosts(
  userUid: string,
  lastVisibleDoc?: DocumentSnapshot | null,
  pageSize = 10
): Promise<{ posts: CommonsPost[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  if (!userUid) return { posts: [], lastDoc: null, hasMore: false };

  try {
    // 1. Fetch public posts created by this user
    const publicQ = query(
      collection(db, 'commonsPosts'),
      where('authorUid', '==', userUid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const publicSnap = await getDocs(publicQ);
    const postMap = new Map<string, CommonsPost>();

    publicSnap.docs.forEach((d) => {
      postMap.set(d.id, {
        id: d.id,
        ...(d.data() as Omit<CommonsPost, 'id'>),
        isAnonymous: Boolean(d.data().isAnonymous),
      });
    });

    // 2. Fetch anonymous posts created by this user from postsPrivate
    try {
      const privQ = query(
        collection(db, 'postsPrivate'),
        where('authorUid', '==', userUid),
        where('isAnonymous', '==', true),
        limit(50)
      );
      const privSnap = await getDocs(privQ);
      for (const pDoc of privSnap.docs) {
        if (!postMap.has(pDoc.id)) {
          const postDoc = await getDoc(doc(db, 'commonsPosts', pDoc.id));
          if (postDoc.exists()) {
            postMap.set(postDoc.id, {
              id: postDoc.id,
              ...(postDoc.data() as Omit<CommonsPost, 'id'>),
              isAnonymous: true,
            });
          }
        }
      }
    } catch (privErr) {
      console.warn('[commonsService] Error fetching private anonymous posts:', privErr);
    }

    // Sort all by createdAt desc
    const allPosts = Array.from(postMap.values()).sort((a, b) => {
      const tA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    const paginated = allPosts.slice(0, pageSize);
    return {
      posts: paginated,
      lastDoc: null,
      hasMore: allPosts.length > pageSize,
    };
  } catch (err) {
    console.warn('[commonsService] fetchUserOwnPosts warning:', err);
    return { posts: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Switch a post between public and anonymous.
 * Switching to anonymous removes it from public profile immediately.
 */
export async function togglePostAnonymity(
  postId: string,
  user: { uid: string; displayName?: string | null; photoURL?: string | null },
  makeAnonymous: boolean
): Promise<void> {
  const postRef = doc(db, 'commonsPosts', postId);
  const postsPrivateRef = doc(db, 'postsPrivate', postId);

  const now = serverTimestamp();
  const batch = writeBatch(db);

  if (makeAnonymous) {
    batch.update(postRef, {
      isAnonymous: true,
      authorUid: null,
      authorName: 'Anonymous',
      authorAvatar: null,
      authorFrame: null,
      authorEquippedAvatar: null,
      authorPhotoURL: null,
      authorRole: null,
      authorCustomRole: null,
      updatedAt: now,
    });
    batch.set(postsPrivateRef, { authorUid: user.uid, isAnonymous: true, updatedAt: now }, { merge: true });
  } else {
    batch.update(postRef, {
      isAnonymous: false,
      authorUid: user.uid,
      authorName: sanitizeStudentDisplayName(user.displayName, user.uid),
      authorAvatar: user.photoURL || null,
      updatedAt: now,
    });
    batch.set(postsPrivateRef, { authorUid: user.uid, isAnonymous: false, updatedAt: now }, { merge: true });
  }

  await batch.commit();
}
