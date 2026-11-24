import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Image as ImageIcon,
  Send,
  Trash2,
  X,
  Loader2,
  CornerDownRight,
  RefreshCw,
  FileText,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { normalizeProBadgeDesign } from '@/lib/proBadgeDesigns';
import { auth } from '@/lib/firebase';
import { resolveCreatedAtMs, formatRelativeTimePkt } from '@/utils/dateFormat';
import { getDisplayName, getUsernameHandle } from '@/utils/displayName';
import { useDailyPostQuota } from '@/hooks/useDailyPostQuota';
import { PostLimitBanner } from '@/components/commons/PostLimitBanner';
import { formatPostLimitReachedMessage } from '@/config/postLimits';
import type { PlanTier } from '@/lib/planTier';

export interface CommonsCommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorRole?: string | null;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  authorProBadge?: string | null;
  parentId?: string | null;
  text: string;
  likesCount?: number;
  likedByMe?: boolean;
  createdAt: number;
}

async function getCommonsAuthHeaders(
  includeJsonContentType = true
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = await auth.currentUser?.getIdToken(false);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return headers;
}

async function fetchCommonsComments(postId: string): Promise<CommonsCommentItem[]> {
  try {
    const headers = await getCommonsAuthHeaders(false);
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      headers,
      credentials: 'include',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.comments)
      ? data.comments
      : Array.isArray(data)
      ? data
      : [];
    return list.map((c: any) => ({
      id: String(c.id || ''),
      postId: String(c.postId || c.post_id || postId),
      authorId: String(c.authorId || c.author_id || ''),
      authorName: String(c.authorName || c.author_name || 'Student'),
      authorUsername: c.authorUsername || c.author_username || null,
      authorRole: c.authorRole || c.author_role || 'student',
      authorAvatar: c.authorAvatar || c.author_avatar || null,
      authorFrame: c.authorFrame || c.author_frame || null,
      authorProBadge: c.authorProBadge || c.author_pro_badge || null,
      parentId: c.parentId || c.parent_id || null,
      text: String(c.text || c.content || ''),
      likesCount: Number(c.likesCount ?? c.likes_count ?? 0),
      likedByMe: Boolean(c.likedByMe ?? c.liked_by_me ?? false),
      createdAt: resolveCreatedAtMs(c).ms ?? 0,
    }));
  } catch {
    return [];
  }
}

async function createCommonsComment(
  postId: string,
  payload: {
    text: string;
    parentId?: string | null;
    authorName?: string;
    authorUsername?: string | null;
    authorRole?: string;
    authorAvatar?: string;
    authorFrame?: string;
    authorProBadge?: string | null;
  }
): Promise<CommonsCommentItem | null> {
  try {
    const headers = await getCommonsAuthHeaders(true);
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        text: payload.text,
        content: payload.text,
        parentId: payload.parentId || null,
        authorName: payload.authorName,
        authorUsername: payload.authorUsername,
        authorRole: payload.authorRole,
        authorAvatar: payload.authorAvatar,
        authorFrame: payload.authorFrame,
        authorProBadge: payload.authorProBadge,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.comment || data;
    return {
      id: String(raw?.id || `c_${Date.now()}`),
      postId,
      authorId: auth.currentUser?.uid || '',
      authorName: payload.authorName || 'Student',
      authorUsername: payload.authorUsername || null,
      authorRole: payload.authorRole || 'student',
      authorAvatar: payload.authorAvatar || null,
      authorFrame: payload.authorFrame || null,
      authorProBadge: payload.authorProBadge || null,
      parentId: payload.parentId || null,
      text: payload.text,
      likesCount: 0,
      likedByMe: false,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

async function deleteCommonsComment(
  postId: string,
  commentId: string
): Promise<boolean> {
  try {
    const headers = await getCommonsAuthHeaders(true);
    const res = await fetch(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
        headers,
        credentials: 'include',
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function toggleCommonsCommentLike(
  postId: string,
  commentId: string
): Promise<{ liked?: boolean; likesCount?: number } | null> {
  try {
    const headers = await getCommonsAuthHeaders(true);
    const res = await fetch(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`,
      {
        method: 'POST',
        headers,
        credentials: 'include',
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ProfilePostItem {
  id: string;
  slug?: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorRole?: string | null;
  authorCustomRole?: string | null;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  authorProBadge?: string | null;
  authorPlusBadge?: number | null;
  isAnonymous?: boolean;
  title?: string;
  description: string;
  type?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  files?: Array<{
    url?: string;
    downloadUrl?: string;
    name?: string;
    mimeType?: string;
    type?: string;
    size?: number;
  }>;
  likesCount: number;
  commentsCount: number;
  viewsCount?: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  createdAt: number;
}

export interface ProfilePostsSectionProps {
  targetUid: string;
  isOwnProfile: boolean;
  authorDisplayName: string;
  authorUsername?: string | null;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  authorRole?: string | null;
  authorProBadge?: string | null;
  authorPlusBadge?: number | null;
  authorPlan?: PlanTier;
  isPro?: boolean;
  accentColor?: string;
  theme?: 'dark' | 'light';
  variant?: 'default' | 'retro' | 'compact';
  onCountChange?: (count: number) => void;
}

function formatRelativeDate(timestamp: number): string {
  return formatRelativeTimePkt(timestamp);
}

function normalizeServerPost(raw: any): ProfilePostItem {
  const createdMs = resolveCreatedAtMs(raw).ms ?? 0;

  let parsedFiles: any[] = [];
  if (Array.isArray(raw.files)) {
    parsedFiles = raw.files;
  } else if (typeof raw.files_json === 'string') {
    try {
      const f = JSON.parse(raw.files_json);
      if (Array.isArray(f)) parsedFiles = f;
    } catch {
      // ignore
    }
  }

  const isAnon = Boolean(raw.isAnonymous || raw.is_anonymous || raw.anonymous);

  return {
    id: String(raw.id || ''),
    slug: typeof raw.slug === 'string' && raw.slug ? raw.slug : undefined,
    authorId: isAnon
      ? ''
      : String(raw.authorUid || raw.authorId || raw.author_uid || raw.author_id || ''),
    authorName: isAnon
      ? String(raw.anonymousAlias || raw.anonymous_alias || 'Anonymous Student')
      : String(raw.authorName || raw.author_name || 'Student'),
    authorUsername: isAnon ? null : raw.authorUsername || raw.author_username || null,
    authorRole: isAnon ? 'student' : raw.authorRole || raw.author_role || 'student',
    authorCustomRole: isAnon ? null : raw.authorCustomRole || raw.author_custom_role || null,
    authorAvatar: isAnon ? null : raw.authorAvatar || raw.author_avatar || null,
    authorFrame: isAnon ? null : raw.authorFrame || raw.author_frame || null,
    authorProBadge: isAnon ? null : raw.authorProBadge || raw.author_pro_badge || null,
    authorPlusBadge: isAnon
      ? null
      : typeof raw.authorPlusBadge === 'number'
      ? raw.authorPlusBadge
      : typeof raw.author_plus_badge === 'number'
      ? raw.author_plus_badge
      : typeof raw.plusBadge === 'number'
      ? raw.plusBadge
      : null,
    isAnonymous: isAnon,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: String(raw.description ?? raw.body ?? raw.content ?? ''),
    type: String(raw.type || 'post'),
    board: String(raw.board || 'All Boards'),
    classLevel: String(raw.classLevel || raw.class_level || 'All Classes'),
    subject: String(raw.subject || 'General'),
    files: parsedFiles,
    likesCount: Math.max(0, Number(raw.likesCount ?? raw.likes_count ?? raw.upvotes ?? 0)),
    commentsCount: Math.max(
      0,
      Number(raw.commentsCount ?? raw.comments_count ?? raw.commentCount ?? 0)
    ),
    viewsCount: Math.max(0, Number(raw.viewsCount ?? raw.views_count ?? raw.views ?? 0)),
    likedByMe: Boolean(raw.likedByMe ?? raw.votedByMe),
    bookmarkedByMe: Boolean(raw.bookmarkedByMe ?? raw.savedByMe),
    createdAt: createdMs,
  };
}

export const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({
  targetUid,
  isOwnProfile,
  authorDisplayName,
  authorUsername,
  authorAvatar,
  authorFrame,
  authorProBadge,
  authorPlusBadge,
  authorPlan,
  isPro = false,
  onCountChange,
}) => {
  const { user, profile: viewerProfile, isGuest } = useAuth();
  const [posts, setPosts] = useState<ProfilePostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Composer state (own profile only)
  const [composerText, setComposerText] = useState('');
  const [composerImageFile, setComposerImageFile] = useState<File | null>(null);
  const [composerImagePreview, setComposerImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { quota, applyServerQuota, incrementLocalUsed } = useDailyPostQuota(
    Boolean(isOwnProfile && !isGuest)
  );

  // Expanded long posts (>6 lines)
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});

  // Expanded inline comments
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommonsCommentItem[]>>({});
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [replyToByPost, setReplyToByPost] = useState<
    Record<string, { id: string; authorName: string } | null>
  >({});
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState<string | null>(null);
  const [shareToastPostId, setShareToastPostId] = useState<string | null>(null);

  const [totalPostsCount, setTotalPostsCount] = useState<number>(0);

  const loadUserPosts = useCallback(async () => {
    if (!targetUid) {
      setPosts([]);
      setTotalPostsCount(0);
      onCountChange?.(0);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const headers = await getCommonsAuthHeaders(false).catch(() => ({} as Record<string, string>));
      const params = new URLSearchParams({
        authorUid: targetUid,
        limit: '100',
      });
      const viewerUid = user?.uid || '';
      if (isOwnProfile && viewerUid && viewerUid === targetUid) {
        params.set('includeOwnAnonymous', 'true');
      }
      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error('Could not load posts.');
      }
      const data = await res.json().catch(() => ({}));
      const rawList = Array.isArray(data?.posts) ? data.posts : [];
      const filtered = rawList
        .filter((r: any) => {
          const aid = String(r.authorUid || r.authorId || r.author_uid || r.author_id || '');
          const isAnon = Boolean(r.isAnonymous || r.is_anonymous || r.anonymous);
          if (isAnon) {
            // Anonymous posts are strictly only shown on the user's own profile (when verified by server)
            return Boolean(isOwnProfile && viewerUid && viewerUid === targetUid);
          }
          return aid === targetUid;
        })
        .map(normalizeServerPost)
        .sort((a: ProfilePostItem, b: ProfilePostItem) => b.createdAt - a.createdAt);

      const serverTotal =
        typeof data?.total === 'number' && data?.hasMore
          ? Math.max(filtered.length, Number(data.total))
          : filtered.length;

      setPosts(filtered);
      setTotalPostsCount(serverTotal);
      onCountChange?.(serverTotal);
    } catch (err) {
      setLoadError(
        err instanceof Error && err.name === 'AbortError'
          ? 'Posts took too long to load.'
          : 'Could not load posts right now.'
      );
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, [targetUid, isOwnProfile, user?.uid, onCountChange]);

  useEffect(() => {
    void loadUserPosts();
  }, [loadUserPosts]);

  useEffect(() => {
    const handlePostsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ authorUid?: string }>).detail;
      if (!detail?.authorUid || detail.authorUid === targetUid) {
        void loadUserPosts();
      }
    };
    window.addEventListener('boardly:posts-changed', handlePostsChanged);
    return () => {
      window.removeEventListener('boardly:posts-changed', handlePostsChanged);
    };
  }, [loadUserPosts, targetUid]);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setComposerError('Only image files can be attached to profile posts.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setComposerError('Image must be smaller than 10 MB.');
      return;
    }
    setComposerError(null);
    setComposerImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setComposerImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const clearComposerImage = () => {
    setComposerImageFile(null);
    setComposerImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = composerText.trim();
    if (!trimmed && !composerImageFile) return;
    if (!user?.uid || isGuest) {
      setComposerError('Please sign in with a registered account to post.');
      return;
    }
    if (quota.limitReached) {
      setComposerError(formatPostLimitReachedMessage(quota));
      return;
    }

    setPublishing(true);
    setComposerError(null);

    try {
      const headers = await getCommonsAuthHeaders();
      const uploadedFiles: Array<{
        url: string;
        name: string;
        mimeType: string;
        size: number;
      }> = [];

      if (composerImageFile) {
        const formData = new FormData();
        formData.append('file', composerImageFile);
        const upRes = await fetch('/api/commons/upload', {
          method: 'POST',
          headers: {
            ...(headers.Authorization ? { Authorization: headers.Authorization } : {}),
          },
          body: formData,
          credentials: 'include',
        });
        const upJson = await upRes.json().catch(() => ({}));
        if (upRes.ok && (upJson.url || upJson.file?.url)) {
          uploadedFiles.push({
            url: String(upJson.url || upJson.file?.url),
            name: composerImageFile.name,
            mimeType: composerImageFile.type,
            size: composerImageFile.size,
          });
        } else if (composerImagePreview) {
          uploadedFiles.push({
            url: composerImagePreview,
            name: composerImageFile.name,
            mimeType: composerImageFile.type,
            size: composerImageFile.size,
          });
        }
      }

      const firstLine = trimmed.split('\n')[0]?.trim() || 'Profile Update';
      const postTitle =
        firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine || 'Profile Post';

      const createRes = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: postTitle,
          description: trimmed || 'Shared an image',
          type: 'discussion',
          board: viewerProfile?.board || 'All Boards',
          classLevel: viewerProfile?.grade || 'All Classes',
          subject: 'General',
          tags: ['profile-post'],
          files: uploadedFiles,
          isAnonymous: false,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || createJson?.ok === false) {
        if (createRes.status === 429 && createJson?.quota) {
          applyServerQuota(createJson.quota);
          window.dispatchEvent(
            new CustomEvent('boardly:post-quota-updated', { detail: createJson.quota })
          );
        }
        throw new Error(createJson?.error || 'Could not publish post.');
      }

      if (createJson?.quota) {
        applyServerQuota(createJson.quota);
        window.dispatchEvent(
          new CustomEvent('boardly:post-quota-updated', { detail: createJson.quota })
        );
      } else {
        incrementLocalUsed();
      }

      const createdPost = createJson?.post
        ? normalizeServerPost(createJson.post)
        : normalizeServerPost({
            id: createJson?.id || `local_${Date.now()}`,
            authorId: user.uid,
            authorName: authorDisplayName,
            authorUsername,
            authorAvatar,
            authorFrame,
            authorProBadge,
            authorPlusBadge,
            title: postTitle,
            description: trimmed,
            type: 'discussion',
            files: uploadedFiles,
            likesCount: 0,
            commentsCount: 0,
            createdAt: Date.now(),
          });

      setPosts((prev) => {
        const alreadyPresent = prev.some((p) => p.id === createdPost.id);
        const next = [createdPost, ...prev.filter((p) => p.id !== createdPost.id)];
        const nextTotal = alreadyPresent ? Math.max(totalPostsCount, next.length) : Math.max(next.length, totalPostsCount + 1);
        setTotalPostsCount(nextTotal);
        onCountChange?.(nextTotal);
        return next;
      });
      window.dispatchEvent(
        new CustomEvent('boardly:posts-changed', {
          detail: { action: 'create', authorUid: user.uid, postId: createdPost.id },
        })
      );
      setComposerText('');
      clearComposerImage();
    } catch (err: any) {
      setComposerError(err?.message || 'Failed to publish post.');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (post: ProfilePostItem) => {
    if (!user?.uid) return;
    const prevLiked = Boolean(post.likedByMe);
    const optimisticLiked = !prevLiked;
    const optimisticCount = Math.max(0, post.likesCount + (optimisticLiked ? 1 : -1));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: optimisticLiked, likesCount: optimisticCount }
          : p
      )
    );

    try {
      const headers = await getCommonsAuthHeaders();
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/like`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.likesCount === 'number') {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likedByMe: typeof data.liked === 'boolean' ? data.liked : optimisticLiked,
                  likesCount: data.likesCount,
                }
              : p
          )
        );
      }
    } catch {
      // keep optimistic update
    }
  };

  const handleToggleBookmark = async (post: ProfilePostItem) => {
    if (!user?.uid) return;
    const prevSaved = Boolean(post.bookmarkedByMe);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, bookmarkedByMe: !prevSaved } : p))
    );

    try {
      const headers = await getCommonsAuthHeaders();
      await fetch(`/api/posts/${encodeURIComponent(post.id)}/bookmark`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // ignore
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isOwnProfile) return;
    const previous = posts;
    const previousTotal = totalPostsCount;
    const next = posts.filter((p) => p.id !== postId);
    const nextTotal = Math.max(next.length, previousTotal - 1);
    setPosts(next);
    setTotalPostsCount(nextTotal);
    onCountChange?.(nextTotal);

    try {
      const headers = await getCommonsAuthHeaders();
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        setPosts(previous);
        setTotalPostsCount(previousTotal);
        onCountChange?.(previousTotal);
      } else {
        window.dispatchEvent(
          new CustomEvent('boardly:posts-changed', {
            detail: { action: 'delete', authorUid: targetUid, postId },
          })
        );
      }
    } catch {
      setPosts(previous);
      setTotalPostsCount(previousTotal);
      onCountChange?.(previousTotal);
    }
  };

  const handleToggleCommentsDrawer = async (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      return;
    }
    setOpenCommentsPostId(postId);
    if (!commentsByPost[postId]) {
      setCommentsLoadingByPost((prev) => ({ ...prev, [postId]: true }));
      try {
        const list = await fetchCommonsComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: Array.isArray(list) ? list : [] }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
      } finally {
        setCommentsLoadingByPost((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleSendComment = async (postId: string) => {
    const text = (commentDraftByPost[postId] || '').trim();
    if (!text || !user?.uid) return;
    setSubmittingCommentPostId(postId);
    try {
      const replyTarget = replyToByPost[postId] || null;
      const viewerDisplayName = getDisplayName({
        display_name: viewerProfile?.display_name ?? viewerProfile?.displayName,
        realName: viewerProfile?.realName ?? viewerProfile?.name ?? user.displayName,
        username: viewerProfile?.username,
      });
      const created = await createCommonsComment(postId, {
        text,
        parentId: replyTarget?.id || null,
        authorName: viewerDisplayName,
        authorUsername: viewerProfile?.username || null,
        authorRole: viewerProfile?.role || 'student',
        authorAvatar: viewerProfile?.equippedAvatar || viewerProfile?.avatar || undefined,
        authorFrame: viewerProfile?.equippedFrame || viewerProfile?.frame || undefined,
      });
      if (created) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), created],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          )
        );
        setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
        setReplyToByPost((prev) => ({ ...prev, [postId]: null }));
      }
    } catch {
      // ignore
    } finally {
      setSubmittingCommentPostId(null);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteCommonsComment(postId, commentId);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p
        )
      );
    } catch {
      // ignore
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    try {
      const res = await toggleCommonsCommentLike(postId, commentId);
      if (!res) return;
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                likedByMe: res.liked ?? c.likedByMe,
                likesCount: res.likesCount ?? c.likesCount,
              }
            : c
        ),
      }));
    } catch {
      // ignore
    }
  };

  const handleSharePost = async (post: ProfilePostItem) => {
    const url = `${window.location.origin}/commons/post/${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || `${authorDisplayName} on Boardly`,
          text: post.description.slice(0, 120),
          url,
        });
        return;
      }
    } catch {
      // fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToastPostId(post.id);
      setTimeout(() => {
        setShareToastPostId((curr) => (curr === post.id ? null : curr));
      }, 2000);
    } catch {
      // ignore
    }
  };

  const shouldCollapsePost = (text: string) => {
    if (!text) return false;
    const lineCount = text.split('\n').length;
    return lineCount > 6 || text.length > 340;
  };

  return (
    <div className="space-y-4">
      {/* Section Header with Count Chip */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[14px] font-medium text-[var(--text-muted)]">Posts</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold font-inter-num text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border)]">
          {totalPostsCount.toLocaleString()} {totalPostsCount === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Composer (Only on own profile) */}
      {isOwnProfile && !isGuest && (
        <form
          onSubmit={handlePublishPost}
          className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] p-4 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              <BoardlyAvatar
                size={40}
                uid={targetUid}
                equippedAvatar={authorAvatar}
                equippedFrameId={authorFrame}
                alt={authorDisplayName}
              />
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Share something with your study squad..."
                className="w-full resize-none bg-transparent border-0 outline-none text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-muted)]"
              />

              {composerImagePreview && (
                <div className="relative mt-2.5 inline-block rounded-2xl overflow-hidden border border-[var(--border)]">
                  <img
                    src={composerImagePreview}
                    alt="Attachment preview"
                    className="max-h-48 w-auto object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={clearComposerImage}
                    aria-label="Remove attached image"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {quota.limitReached && (
                <PostLimitBanner quota={quota} variant="modal" className="mt-2.5" />
              )}

              {composerError && !quota.limitReached && (
                <p className="mt-1.5 text-[12px] font-medium text-[var(--danger)]">{composerError}</p>
              )}

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={quota.limitReached}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 min-h-[42px] px-3.5 rounded-full text-[13px] font-semibold text-[var(--text)] bg-[var(--bg)] hover:bg-[var(--settings-row-hover)] border border-[var(--border)] disabled:opacity-45 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[var(--accent)]" />
                    <span>Attach image</span>
                  </button>
                  {!quota.limitReached && (
                    <PostLimitBanner quota={quota} variant="inline" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    publishing ||
                    quota.limitReached ||
                    (!composerText.trim() && !composerImageFile)
                  }
                  className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold hover:opacity-95 disabled:opacity-45 transition cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : quota.limitReached ? (
                    <span>Limit reached</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--border)]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 rounded bg-[var(--border)]" />
                  <div className="h-2.5 w-20 rounded bg-[var(--border)]/70" />
                </div>
              </div>
              <div className="h-12 w-full rounded-xl bg-[var(--bg)]" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-[24px] p-5 bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--text-muted)]">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadUserPosts()}
            className="min-h-[38px] px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[13px] font-semibold text-[var(--text)] inline-flex items-center gap-1.5 hover:bg-[var(--settings-row-hover)] cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[24px] p-7 text-center border border-dashed border-[var(--border)] bg-[var(--card)]">
          <p className="text-[15px] font-semibold text-[var(--text)]">No posts yet</p>
          <p className="text-[13px] mt-1 text-[var(--text-muted)]">
            {isOwnProfile
              ? 'Share study notes, updates, or questions with your study squad above.'
              : `${authorDisplayName} hasn't shared any posts yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {posts.map((post) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const postComments = commentsByPost[post.id] || [];
            const loadingComments = Boolean(commentsLoadingByPost[post.id]);
            const replyTarget = replyToByPost[post.id] || null;
            const imageAttachments = (post.files || []).filter(
              (f) =>
                f?.url &&
                ((f.mimeType || f.type || '').startsWith('image/') ||
                  /\.(png|jpe?g|gif|webp|avif)$/i.test(f.name || f.url || ''))
            );
            const fileAttachments = (post.files || []).filter(
              (f) =>
                (f?.url || f?.downloadUrl) &&
                !((f.mimeType || f.type || '').startsWith('image/') ||
                  /\.(png|jpe?g|gif|webp|avif)$/i.test(f.name || f.url || ''))
            );

            const trimmedTitle = (post.title || '').trim();
            const trimmedDesc = (post.description || '').trim();
            const showDistinctTitle =
              Boolean(trimmedTitle) &&
              Boolean(trimmedDesc) &&
              trimmedTitle !== trimmedDesc &&
              !trimmedDesc.startsWith(trimmedTitle);
            const bodyText = trimmedDesc || trimmedTitle;
            const isLong = shouldCollapsePost(bodyText);
            const isExpanded = Boolean(expandedPostIds[post.id]);
            const isAnonOwnPost = Boolean(post.isAnonymous && isOwnProfile);
            const resolvedPostAuthor = isAnonOwnPost
              ? 'Anonymous'
              : getDisplayName({
                  display_name: post.authorName || authorDisplayName,
                  username: post.authorUsername || authorUsername,
                });
            const resolvedPostHandle = isAnonOwnPost
              ? null
              : getUsernameHandle({
                  username: post.authorUsername || authorUsername,
                });

            return (
              <article
                key={post.id}
                className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] p-4 sm:p-5 transition-all"
              >
                {/* Post Author Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {isAnonOwnPost ? (
                      <div className="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text-muted)]">
                        <EyeOff className="w-4 h-4" />
                      </div>
                    ) : (
                      <BoardlyAvatar
                        size={40}
                        uid={post.authorId || targetUid}
                        equippedAvatar={post.authorAvatar || authorAvatar}
                        equippedFrameId={post.authorFrame || authorFrame}
                        alt={resolvedPostAuthor}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[15px] font-semibold text-[var(--text)] truncate">
                          {resolvedPostAuthor}
                        </span>
                        {isAnonOwnPost && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
                            Anonymous · Only you see this here
                          </span>
                        )}
                        {(() => {
                          const resolvedPlusBadge =
                            typeof post.authorPlusBadge === 'number'
                              ? post.authorPlusBadge
                              : authorPlan === 'plus' && typeof authorPlusBadge === 'number'
                              ? authorPlusBadge
                              : null;
                          if (resolvedPlusBadge !== null) {
                            return <PlusBadge id={resolvedPlusBadge} size="sm" listMode />;
                          }
                          const rawBadge =
                            post.authorProBadge ||
                            (authorPlan !== 'plus' && isPro ? authorProBadge : null);
                          if (rawBadge && !String(rawBadge).toLowerCase().startsWith('plus:')) {
                            return (
                              <ProBadge
                                design={normalizeProBadgeDesign(String(rawBadge))}
                                size="sm"
                                listMode
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                        {resolvedPostHandle && (
                          <span className="truncate">{resolvedPostHandle}</span>
                        )}
                        {resolvedPostHandle && <span>·</span>}
                        <span>{formatRelativeDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                      aria-label="Delete post"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Body */}
                <div className="mt-3">
                  {showDistinctTitle && (
                    <h4 className="text-[16px] font-semibold text-[var(--text)] leading-snug mb-1.5">
                      {trimmedTitle}
                    </h4>
                  )}
                  <div
                    className={`text-[15px] leading-[1.55] whitespace-pre-wrap break-words text-[var(--text)] ${
                      isLong && !isExpanded ? 'line-clamp-6' : ''
                    }`}
                  >
                    {bodyText}
                  </div>
                  {isLong && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPostIds((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      className="mt-1.5 text-[13px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Image Attachments */}
                {imageAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl overflow-hidden">
                    {imageAttachments.map((img, i) => (
                      <img
                        key={`${post.id}_img_${i}`}
                        src={img.url}
                        alt={img.name || 'Post attachment'}
                        loading="lazy"
                        className="w-full max-h-80 object-cover rounded-2xl border border-[var(--border)]"
                      />
                    ))}
                  </div>
                )}

                {/* Non-Image File Attachments */}
                {fileAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {fileAttachments.map((file, i) => (
                      <a
                        key={`${post.id}_file_${i}`}
                        href={file.downloadUrl || file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-[13px] font-medium text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors"
                      >
                        <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        <span className="truncate">{file.name || 'Attached file'}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-3.5 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                        post.likedByMe
                          ? 'bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--settings-row-hover)] border border-transparent'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.likedByMe ? 'fill-[var(--accent)] text-[var(--accent)]' : ''
                        }`}
                      />
                      <span className="font-inter-num">{post.likesCount.toLocaleString()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleCommentsDrawer(post.id)}
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                        isCommentsOpen
                          ? 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--settings-row-hover)] border border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-inter-num">{post.commentsCount.toLocaleString()}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(post)}
                      aria-label="Bookmark post"
                      className={`w-10 h-10 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                        post.bookmarkedByMe
                          ? 'bg-[var(--koban-bg)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--settings-row-hover)]'
                      }`}
                      style={post.bookmarkedByMe ? { color: 'var(--koban)' } : undefined}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${post.bookmarkedByMe ? 'fill-current' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      aria-label="Share post"
                      className="px-3 min-h-[40px] rounded-full inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      {shareToastPostId === post.id && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Comments Drawer */}
                {isCommentsOpen && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
                    {loadingComments ? (
                      <div className="py-3 flex items-center justify-center gap-2 text-[12px] text-[var(--text-muted)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading comments...</span>
                      </div>
                    ) : postComments.length === 0 ? (
                      <p className="text-[12px] py-2 text-center text-[var(--text-muted)]">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {postComments.map((c) => {
                          const cDisplay = getDisplayName({
                            display_name: c.authorName,
                            username: c.authorUsername,
                          });
                          const cHandle = getUsernameHandle({ username: c.authorUsername });
                          return (
                            <div
                              key={c.id}
                              className={`rounded-2xl p-3 text-[12px] bg-[var(--bg)] border border-[var(--border)] ${
                                c.parentId ? 'ml-5' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-semibold text-[var(--text)] truncate">
                                    {cDisplay}
                                  </span>
                                  {cHandle && (
                                    <span className="text-[11px] text-[var(--text-muted)] truncate">
                                      {cHandle}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-[var(--text-muted)]">
                                    {formatRelativeDate(
                                      typeof c.createdAt === 'number' ? c.createdAt : Date.now()
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleLikeComment(post.id, c.id)}
                                    className={`inline-flex items-center gap-1 text-[11px] cursor-pointer ${
                                      c.likedByMe ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                    }`}
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${c.likedByMe ? 'fill-current' : ''}`}
                                    />
                                    {(c.likesCount ?? 0) > 0 && (
                                      <span className="font-inter-num">{c.likesCount}</span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplyToByPost((prev) => ({
                                        ...prev,
                                        [post.id]: { id: c.id, authorName: cDisplay },
                                      }))
                                    }
                                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                                  >
                                    Reply
                                  </button>
                                  {(c.authorId === user?.uid || isOwnProfile) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(post.id, c.id)}
                                      className="text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"
                                      aria-label="Delete comment"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="mt-1 leading-relaxed text-[var(--text)] break-words">
                                {c.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    {user?.uid && !isGuest && (
                      <div className="space-y-1.5">
                        {replyTarget && (
                          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3" />
                              Replying to <strong className="text-[var(--text)]">{replyTarget.authorName}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setReplyToByPost((prev) => ({ ...prev, [post.id]: null }))
                              }
                              className="hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentDraftByPost[post.id] || ''}
                            onChange={(e) =>
                              setCommentDraftByPost((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void handleSendComment(post.id);
                              }
                            }}
                            placeholder={
                              replyTarget
                                ? `Reply to ${replyTarget.authorName}...`
                                : 'Write a comment...'
                            }
                            className="flex-1 min-h-[42px] px-3.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={
                              submittingCommentPostId === post.id ||
                              !(commentDraftByPost[post.id] || '').trim()
                            }
                            onClick={() => void handleSendComment(post.id)}
                            className="min-h-[42px] px-4 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold disabled:opacity-40 cursor-pointer"
                          >
                            {submittingCommentPostId === post.id ? '...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
