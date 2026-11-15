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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { normalizeProBadgeDesign } from '@/lib/proBadgeDesigns';
import { auth } from '@/lib/firebase';

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
      createdAt: Number(c.createdAt ?? c.created_at ?? Date.now()),
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
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorRole?: string | null;
  authorCustomRole?: string | null;
  authorAvatar?: string | null;
  authorFrame?: string | null;
  authorProBadge?: string | null;
  title?: string;
  description: string;
  type?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  files?: Array<{
    url?: string;
    name?: string;
    mimeType?: string;
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
  isPro?: boolean;
  accentColor?: string;
  theme?: 'dark' | 'light';
  variant?: 'default' | 'retro' | 'compact';
  onCountChange?: (count: number) => void;
}

function formatRelativeDate(timestamp: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeServerPost(raw: any): ProfilePostItem {
  const createdMs =
    typeof raw.createdAt === 'number'
      ? raw.createdAt
      : typeof raw.created_at === 'number'
      ? raw.created_at
      : typeof raw.createdAt?.seconds === 'number'
      ? raw.createdAt.seconds * 1000
      : Date.now();

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

  return {
    id: String(raw.id || ''),
    authorId: String(raw.authorId || raw.author_id || ''),
    authorName: String(raw.authorName || raw.author_name || 'Student'),
    authorUsername: raw.authorUsername || raw.author_username || null,
    authorRole: raw.authorRole || raw.author_role || 'student',
    authorCustomRole: raw.authorCustomRole || raw.author_custom_role || null,
    authorAvatar: raw.authorAvatar || raw.author_avatar || null,
    authorFrame: raw.authorFrame || raw.author_frame || null,
    authorProBadge: raw.authorProBadge || raw.author_pro_badge || null,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: String(raw.description || ''),
    type: String(raw.type || 'post'),
    board: String(raw.board || 'All Boards'),
    classLevel: String(raw.classLevel || raw.class_level || 'All Classes'),
    subject: String(raw.subject || 'General'),
    files: parsedFiles,
    likesCount: Math.max(0, Number(raw.likesCount ?? raw.likes_count ?? 0)),
    commentsCount: Math.max(0, Number(raw.commentsCount ?? raw.comments_count ?? 0)),
    viewsCount: Math.max(0, Number(raw.viewsCount ?? raw.views_count ?? 0)),
    likedByMe: Boolean(raw.likedByMe),
    bookmarkedByMe: Boolean(raw.bookmarkedByMe),
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
  isPro = false,
  onCountChange,
}) => {
  const { user, profile: viewerProfile, isGuest } = useAuth();
  const [posts, setPosts] = useState<ProfilePostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state (own profile only)
  const [composerText, setComposerText] = useState('');
  const [composerImageFile, setComposerImageFile] = useState<File | null>(null);
  const [composerImagePreview, setComposerImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadUserPosts = useCallback(async () => {
    if (!targetUid) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = await getCommonsAuthHeaders().catch(() => ({} as Record<string, string>));
      const res = await fetch(
        `/api/posts?authorId=${encodeURIComponent(targetUid)}&limit=50`,
        {
          headers,
          credentials: 'include',
        }
      );
      const data = await res.json().catch(() => ({}));
      const rawList = Array.isArray(data?.posts) ? data.posts : [];
      const filtered = rawList
        .filter((r: any) => {
          const aid = String(r.authorId || r.author_id || '');
          const isAnon = Boolean(r.isAnonymous || r.is_anonymous);
          return aid === targetUid && !isAnon;
        })
        .map(normalizeServerPost)
        .sort((a: ProfilePostItem, b: ProfilePostItem) => b.createdAt - a.createdAt);

      setPosts(filtered);
      onCountChange?.(filtered.length);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [targetUid, onCountChange]);

  useEffect(() => {
    void loadUserPosts();
  }, [loadUserPosts]);

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
        throw new Error(createJson?.error || 'Could not publish post.');
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
            title: postTitle,
            description: trimmed,
            type: 'discussion',
            files: uploadedFiles,
            likesCount: 0,
            commentsCount: 0,
            createdAt: Date.now(),
          });

      setPosts((prev) => {
        const next = [createdPost, ...prev.filter((p) => p.id !== createdPost.id)];
        onCountChange?.(next.length);
        return next;
      });
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
    const next = posts.filter((p) => p.id !== postId);
    setPosts(next);
    onCountChange?.(next.length);

    try {
      const headers = await getCommonsAuthHeaders();
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        setPosts(previous);
        onCountChange?.(previous.length);
      }
    } catch {
      setPosts(previous);
      onCountChange?.(previous.length);
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
        const res = await fetchCommonsComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: res.comments || [] }));
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
      const created = await createCommonsComment(postId, text, replyTarget?.id || null);
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
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId
            ? { ...c, likedByMe: res.liked, likesCount: res.likesCount }
            : c
        ),
      }));
    } catch {
      // ignore
    }
  };

  const handleSharePost = async (post: ProfilePostItem) => {
    const url = `${window.location.origin}/commons?post=${encodeURIComponent(post.id)}`;
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
      {/* Section Header with Count Chip ("5 posts") */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-doto-title text-[13px] tracking-[0.14em] text-white/90">
          POSTS
        </h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold font-inter-num text-white/80 bg-white/[0.07] border border-white/[0.14]">
          {posts.length.toLocaleString()} {posts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Composer (Only on own profile) */}
      {isOwnProfile && !isGuest && (
        <form
          onSubmit={handlePublishPost}
          className="boardly-glass-card rounded-[24px] p-4 transition-all"
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
                className="w-full resize-none bg-transparent border-0 outline-none text-[14px] leading-relaxed text-white placeholder:text-white/50 font-sans"
              />

              {composerImagePreview && (
                <div className="relative mt-2.5 inline-block rounded-2xl overflow-hidden border border-white/15">
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

              {composerError && (
                <p className="mt-1.5 text-xs font-medium text-[#ff6b72]">{composerError}</p>
              )}

              <div className="mt-3 pt-3 nothing-dotted-divider flex items-center justify-between gap-2">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="press-scale inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#D71921]" />
                    <span>Attach image</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={publishing || (!composerText.trim() && !composerImageFile)}
                  className="boardly-red-pill press-scale inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full text-xs font-bold tracking-wide disabled:opacity-45 cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
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
              className="boardly-glass-card rounded-[24px] p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 rounded bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-white/10" />
                </div>
              </div>
              <div className="h-12 w-full rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[24px] p-8 text-center border border-dashed border-white/20 bg-white/[0.02]">
          <p className="text-[15px] font-semibold text-white/85">No posts yet</p>
          <p className="text-[13px] mt-1 text-white/60">
            {isOwnProfile
              ? 'Share study notes, updates, or questions with your study squad above.'
              : `${authorDisplayName} hasn't shared any posts yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {posts.map((post, idx) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const postComments = commentsByPost[post.id] || [];
            const loadingComments = Boolean(commentsLoadingByPost[post.id]);
            const replyTarget = replyToByPost[post.id] || null;
            const imageAttachments = (post.files || []).filter(
              (f) =>
                f?.url &&
                (f.mimeType?.startsWith('image/') ||
                  /\.(png|jpe?g|gif|webp|avif)$/i.test(f.name || f.url || ''))
            );

            const bodyText =
              post.description && post.description !== post.title
                ? post.description
                : post.title || post.description;
            const isLong = shouldCollapsePost(bodyText);
            const isExpanded = Boolean(expandedPostIds[post.id]);

            return (
              <article
                key={post.id}
                style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
                className="boardly-glass-card rounded-[24px] p-4 sm:p-5 transition-all"
              >
                {/* Post Author Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <BoardlyAvatar
                      size={40}
                      uid={post.authorId || targetUid}
                      equippedAvatar={post.authorAvatar || authorAvatar}
                      equippedFrameId={post.authorFrame || authorFrame}
                      alt={post.authorName || authorDisplayName}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[15px] font-bold text-white truncate">
                          {post.authorName || authorDisplayName}
                        </span>
                        {(post.authorProBadge || (isPro && authorProBadge)) && (
                          <ProBadge
                            design={normalizeProBadgeDesign(
                              post.authorProBadge || authorProBadge
                            )}
                            size="sm"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-white/65">
                        {(post.authorUsername || authorUsername) && (
                          <span className="truncate">
                            @{String(post.authorUsername || authorUsername).replace(/^@+/, '')}
                          </span>
                        )}
                        <span>·</span>
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
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-[#D71921] hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Body (collapses after ~6 lines with Show more) */}
                <div className="mt-3">
                  <div
                    className={`text-[15px] leading-[1.55] whitespace-pre-wrap break-words text-white/90 font-sans ${
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
                      className="mt-1.5 text-[13px] font-semibold text-[#D71921] hover:underline cursor-pointer"
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
                        className="w-full max-h-80 object-cover rounded-2xl border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* Commons Action Bar: Like, Comment, Bookmark, Share */}
                <div className="mt-3.5 pt-3 nothing-dotted-divider flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`press-scale inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        post.likedByMe
                          ? 'bg-[#D71921]/20 text-[#ff6b72] border border-[#D71921]/40'
                          : 'text-white/75 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.likedByMe ? 'fill-[#D71921] text-[#D71921]' : ''
                        }`}
                      />
                      <span className="font-inter-num">{post.likesCount.toLocaleString()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleCommentsDrawer(post.id)}
                      className={`press-scale inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isCommentsOpen
                          ? 'bg-white/15 text-white border border-white/25'
                          : 'text-white/75 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-inter-num">
                        {post.commentsCount.toLocaleString()}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(post)}
                      aria-label="Bookmark post"
                      className={`press-scale w-11 h-11 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                        post.bookmarkedByMe
                          ? 'text-amber-400 bg-amber-500/15'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${post.bookmarkedByMe ? 'fill-amber-400' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      aria-label="Share post"
                      className="press-scale px-3 min-h-[44px] rounded-full inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      {shareToastPostId === post.id && (
                        <span className="text-[11px] text-emerald-400">Copied!</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Comments Drawer */}
                {isCommentsOpen && (
                  <div className="mt-3 pt-3 nothing-dotted-divider space-y-3">
                    {loadingComments ? (
                      <div className="py-3 flex items-center justify-center gap-2 text-xs text-white/60">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading comments...</span>
                      </div>
                    ) : postComments.length === 0 ? (
                      <p className="text-xs py-2 text-center text-white/55">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {postComments.map((c) => (
                          <div
                            key={c.id}
                            className={`rounded-2xl p-3 text-xs bg-white/[0.04] border border-white/10 ${
                              c.parentCommentId ? 'ml-5' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-white truncate">
                                  {c.authorName || 'Student'}
                                </span>
                                {c.authorUsername && (
                                  <span className="text-[11px] text-white/55 truncate">
                                    @{String(c.authorUsername).replace(/^@+/, '')}
                                  </span>
                                )}
                                <span className="text-[10px] text-white/45">
                                  {formatRelativeDate(
                                    typeof c.createdAt === 'number'
                                      ? c.createdAt
                                      : Date.now()
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleLikeComment(post.id, c.id)}
                                  className={`inline-flex items-center gap-1 text-[11px] cursor-pointer ${
                                    c.likedByMe ? 'text-[#D71921]' : 'text-white/55'
                                  }`}
                                >
                                  <Heart
                                    className={`w-3 h-3 ${
                                      c.likedByMe ? 'fill-[#D71921]' : ''
                                    }`}
                                  />
                                  {c.likesCount > 0 && (
                                    <span className="font-inter-num">{c.likesCount}</span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyToByPost((prev) => ({
                                      ...prev,
                                      [post.id]: { id: c.id, authorName: c.authorName },
                                    }))
                                  }
                                  className="text-[11px] font-semibold text-white/60 hover:text-white cursor-pointer"
                                >
                                  Reply
                                </button>
                                {(c.authorId === user?.uid || isOwnProfile) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-white/45 hover:text-[#D71921] cursor-pointer"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 leading-relaxed text-white/85 break-words">
                              {c.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    {user?.uid && !isGuest && (
                      <div className="space-y-1.5">
                        {replyTarget && (
                          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-white/70">
                            <span className="inline-flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3" />
                              Replying to <strong>{replyTarget.authorName}</strong>
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
                          <div className="search-pill-wrapper flex-1 flex items-center rounded-full px-3.5 min-h-[44px] bg-white/[0.06] border border-white/15 transition-all">
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
                              className="flex-1 text-xs text-white placeholder:text-white/45"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={
                              submittingCommentPostId === post.id ||
                              !(commentDraftByPost[post.id] || '').trim()
                            }
                            onClick={() => void handleSendComment(post.id)}
                            className="boardly-red-pill press-scale min-h-[44px] px-4 rounded-full text-xs font-bold disabled:opacity-40 cursor-pointer"
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
