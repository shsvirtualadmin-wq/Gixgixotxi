import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  Heart,
  MessageCircle,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Maximize2,
  Check,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  UserPost,
  fetchUserPosts,
  createUserPost,
  updateUserPost,
  deleteUserPost,
  toggleLikePost,
  validateAndCompressImage,
} from '@/services/userPostService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';

interface ProfilePostsSectionProps {
  targetUid: string;
  isOwnProfile: boolean;
  readOnly: boolean;
  currentUserId?: string | null;
  currentUserDisplayName?: string | null;
  currentUserAvatar?: string | null;
  equippedAvatar?: string | null;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  accentColor?: string;
}

export const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({
  targetUid,
  isOwnProfile,
  readOnly,
  currentUserId,
  currentUserDisplayName,
  currentUserAvatar,
  equippedAvatar,
  avatarKey,
  avatarVariant,
  accentColor = '#D71921',
}) => {
  // Feed state
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Create post state
  const [postText, setPostText] = useState('');
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    name: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete post modal state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active open menu dropdown
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Lightbox preview for images
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load posts for this user
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFeedError(null);
    setPage(1);

    async function loadInitial() {
      try {
        const res = await fetchUserPosts({
          userId: targetUid,
          page: 1,
          limit: 5,
          currentUserId,
        });

        if (!isMounted) return;
        setPosts(res.posts);
        setHasMore(res.hasMore);
      } catch (err: any) {
        if (!isMounted) return;
        setFeedError(err?.message || 'Failed to load posts.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (targetUid) {
      loadInitial();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [targetUid, currentUserId]);

  // Load more posts
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchUserPosts({
        userId: targetUid,
        page: nextPage,
        limit: 5,
        currentUserId,
      });

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = res.posts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
      setPage(nextPage);
      setHasMore(res.hasMore);
    } catch (err: any) {
      console.warn('[ProfilePostsSection] Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Image select & compress for new post
  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCreateError(null);
    try {
      const compressed = await validateAndCompressImage(file);
      setAttachedImage({
        dataUrl: compressed.dataUrl,
        name: file.name,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
      });
    } catch (err: any) {
      setCreateError(err?.message || 'Invalid image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Image select for editing post
  const handleSelectEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditError(null);
    try {
      const compressed = await validateAndCompressImage(file);
      setEditImageUrl(compressed.dataUrl);
    } catch (err: any) {
      setEditError(err?.message || 'Invalid image file.');
    } finally {
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = postText.trim();
    if (!trimmed && !attachedImage?.dataUrl) {
      setCreateError('Please enter some text or attach an image.');
      return;
    }

    if (!currentUserId) {
      setCreateError('You must be signed in to post.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const newPost = await createUserPost({
        userId: currentUserId,
        text: trimmed,
        imageUrl: attachedImage?.dataUrl || null,
        authorName: currentUserDisplayName || 'Student',
        authorAvatar: currentUserAvatar || null,
      });

      setPosts((prev) => [newPost, ...prev]);
      setPostText('');
      setAttachedImage(null);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a post
  const handleStartEdit = (post: UserPost) => {
    setActiveMenuPostId(null);
    setEditingPostId(post.id);
    setEditText(post.text || '');
    setEditImageUrl(post.image_url || null);
    setEditError(null);
  };

  // Save edited post
  const handleSaveEdit = async (postId: string) => {
    const trimmed = editText.trim();
    if (!trimmed && !editImageUrl) {
      setEditError('A post cannot be empty. Please enter text or keep an image.');
      return;
    }

    if (!currentUserId) return;

    setIsUpdating(true);
    setEditError(null);

    try {
      const updated = await updateUserPost({
        id: postId,
        userId: currentUserId,
        text: trimmed,
        imageUrl: editImageUrl,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updated, text: trimmed, image_url: editImageUrl } : p))
      );
      setEditingPostId(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update post.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm delete post
  const handleConfirmDelete = async () => {
    if (!postToDelete || !currentUserId) return;
    setIsDeleting(true);

    try {
      await deleteUserPost({
        id: postToDelete,
        userId: currentUserId,
      });

      setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
      setPostToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle like
  const handleToggleLike = async (postId: string) => {
    if (!currentUserId) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likedBy = Array.isArray(p.liked_by)
          ? [...p.liked_by]
          : Array.isArray((p as any).likedBy)
          ? [...(p as any).likedBy]
          : [];
        const hasLiked = likedBy.includes(currentUserId);
        const newLikedBy = hasLiked ? likedBy.filter((u) => u !== currentUserId) : [...likedBy, currentUserId];
        const newCount = Math.max(0, (p.likes_count ?? (p as any).likesCount ?? 0) + (hasLiked ? -1 : 1));
        return {
          ...p,
          liked_by: newLikedBy,
          likedBy: newLikedBy,
          likes_count: newCount,
          likesCount: newCount,
        };
      })
    );

    const originalPost = posts.find((p) => p.id === postId);
    try {
      await toggleLikePost({ id: postId, userId: currentUserId });
    } catch (err: any) {
      console.error('[ProfilePostsSection] Like toggle exception:', err?.code, `posts/${postId}/likes/${currentUserId}`, err);
      if (originalPost) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? originalPost : p)));
      }
    }
  };

  // Format date helper
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return '';
      const now = Date.now();
      const diffMs = now - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (3600 * 1000));
      const diffDays = Math.floor(diffMs / (86400 * 1000));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  const canManageOwn = isOwnProfile && !readOnly;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── SECTION HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--red)]" />
          <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text)] tracking-tight">
            Posts
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {readOnly && isOwnProfile && (
          <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1">
            Read-only preview
          </span>
        )}
      </div>

      {/* ── 1. CREATE POST BOX (OWN PROFILE & NOT IN "VIEW AS OTHERS" PREVIEW) ── */}
      {canManageOwn && (
        <form
          onSubmit={handleCreatePost}
          className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] shadow-xs flex flex-col gap-3 transition-all focus-within:border-[var(--red)]"
        >
          {createError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex gap-3 items-start">
            {/* Author Avatar Thumbnail */}
            <div className="shrink-0">
              <BoardlyAvatar
                equippedAvatar={equippedAvatar || (currentUserAvatar && !currentUserAvatar.startsWith('http') ? currentUserAvatar : undefined)}
                avatarUrl={currentUserAvatar?.startsWith('http') ? currentUserAvatar : undefined}
                avatarKey={avatarKey}
                avatarVariant={avatarVariant}
                name={currentUserDisplayName || 'You'}
                size={36}
              />
            </div>

            {/* Post Input */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <textarea
                ref={postTextareaRef}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share something with your study squad..."
                rows={2}
                maxLength={5000}
                className="w-full bg-transparent text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] resize-none border-none outline-none focus:ring-0 p-0 leading-relaxed"
              />

              {/* Image Preview if attached */}
              {attachedImage && (
                <div className="relative mt-1 group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] max-w-sm">
                  <img
                    src={attachedImage.dataUrl}
                    alt="Attached preview"
                    className="w-full max-h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                    <span className="text-[10px] font-mono text-white/90 truncate max-w-[200px]">
                      {attachedImage.name} ({(attachedImage.compressedSize / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="w-7 h-7 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSelectImage}
                className="hidden"
                id="create-post-image-file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`h-8 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--card)] text-xs font-heading font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  attachedImage ? 'text-[var(--red)] border-[var(--red)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
                title="Attach image (JPG, PNG, WebP up to 5 MB)"
              >
                <ImageIcon size={14} />
                <span>{attachedImage ? 'Image Attached' : 'Attach Image'}</span>
              </button>
              <span className="text-[10px] font-mono text-[var(--muted)] hidden sm:inline">
                JPG, PNG, WebP (max 5 MB)
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!postText.trim() && !attachedImage?.dataUrl)}
              className={`relative overflow-hidden h-8 px-4 rounded-lg bg-[var(--red)] hover:bg-[var(--red-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-heading font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                isSubmitting ? 'min-w-[110px]' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <span>Posting...</span>
                  <ButtonLineLoader />
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── 2. POSTS FEED LIST ── */}
      {loading ? (
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <LineLoader
            variant="section"
            context="generic"
            message="Loading posts..."
          />
        </div>
      ) : feedError ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{feedError}</span>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State: short text under the composer */
        <div className="py-4 px-2 text-center">
          <p className="text-xs text-[var(--muted)]">
            {canManageOwn
              ? 'No posts yet. Share something with your study squad above!'
              : 'This student hasn’t posted any updates yet.'}
          </p>
        </div>
      ) : (
        <div className="boardly-feed-container flex flex-col gap-3 w-full max-w-full min-w-0 box-border overflow-x-hidden">
          {posts.map((post) => {
            const isMyPost = Boolean(currentUserId && String(post.user_id) === String(currentUserId));
            const isEditingThis = editingPostId === post.id;
            const postLikedBy = Array.isArray(post.liked_by)
              ? post.liked_by
              : Array.isArray((post as any).likedBy)
              ? (post as any).likedBy
              : [];
            const hasLiked = Boolean(currentUserId && postLikedBy.includes(currentUserId));

            return (
              <div
                key={post.id}
                className="boardly-post-card p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs flex flex-col gap-3 w-full max-w-full min-w-0 box-border overflow-x-hidden transition-colors hover:border-[var(--border)]/80"
              >
                {/* ── Post Header: Author info, time & Menu ── */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0">
                      <BoardlyAvatar
                        equippedAvatar={
                          post.author_avatar && !post.author_avatar.startsWith('http') && !post.author_avatar.startsWith('data:')
                            ? post.author_avatar
                            : isOwnProfile
                            ? equippedAvatar
                            : undefined
                        }
                        avatarUrl={
                          post.author_avatar && (post.author_avatar.startsWith('http') || post.author_avatar.startsWith('data:'))
                            ? post.author_avatar
                            : undefined
                        }
                        avatarKey={isOwnProfile ? avatarKey : undefined}
                        avatarVariant={isOwnProfile ? avatarVariant : undefined}
                        name={post.author_name || 'Student'}
                        size={32}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-heading font-semibold text-xs text-[var(--text)] truncate">
                        {post.author_name || 'Student'}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--muted)] flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(post.created_at)}
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <span className="text-[9px] text-[var(--muted)] italic">· edited</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Menu button on own posts (only if NOT in read-only / preview mode) */}
                  {isMyPost && !readOnly && !isEditingThis && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                        className="w-8 h-8 rounded-lg hover:bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
                        title="Post options"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 top-9 z-30 w-36 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(post)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-heading font-medium text-[var(--text)] hover:bg-[var(--card-2)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Edit2 size={13} className="text-[var(--muted)]" />
                            <span>Edit Post</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(null);
                              setPostToDelete(post.id);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-heading font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Post Content (or Edit Form) ── */}
                {isEditingThis ? (
                  <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)] min-w-0 max-w-full">
                    {editError && (
                      <div className="text-xs text-red-500 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        {editError}
                      </div>
                    )}

                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full max-w-full p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--red)] resize-none"
                      placeholder="Edit your post text..."
                    />

                    {/* Image handling during edit */}
                    {editImageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-[var(--border)] max-w-xs">
                        <img src={editImageUrl} alt="Post image" className="w-full max-w-full h-auto max-h-48 object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditImageUrl(null)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSelectEditImage}
                          className="hidden"
                          id={`edit-file-${post.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="h-8 px-3 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--red)] text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon size={13} />
                          <span>Attach image to this post</span>
                        </button>
                      </div>
                    )}

                    {/* Edit actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setEditingPostId(null)}
                        disabled={isUpdating}
                        className="h-8 px-3 rounded-lg border border-[var(--border)] text-xs font-heading font-medium hover:bg-[var(--card)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(post.id)}
                        disabled={isUpdating}
                        className="relative overflow-hidden h-8 px-3.5 rounded-lg bg-[var(--red)] hover:bg-[var(--red-dark)] text-white text-xs font-heading font-semibold flex items-center justify-center gap-1 cursor-pointer min-w-[120px] disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <>
                            <span>Saving...</span>
                            <ButtonLineLoader />
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Text Body */}
                    {post.text && (
                      <p className="boardly-post-content text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-line min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                        {post.text}
                      </p>
                    )}

                    {/* Image attachment */}
                    {post.image_url && (
                      <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-black/30 max-h-96 w-full max-w-full min-w-0">
                        <img
                          src={post.image_url}
                          alt="Post media"
                          onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) container.style.display = 'none';
                          }}
                          className="w-full max-w-full h-auto max-h-96 object-contain cursor-pointer transition-transform group-hover:scale-[1.01]"
                          onClick={() => setLightboxImageUrl(post.image_url || null)}
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImageUrl(post.image_url || null)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                          title="View full image"
                        >
                          <Maximize2 size={12} />
                          <span className="text-[10px]">Expand</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Footer: Likes & Comments ── */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border)] text-xs font-mono text-[var(--muted)] min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    disabled={readOnly && !currentUserId}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                      hasLiked ? 'text-[var(--red)] font-bold' : 'hover:text-[var(--text)]'
                    }`}
                    title={hasLiked ? 'Liked' : 'Like'}
                  >
                    <Heart
                      size={14}
                      className={`transition-transform group-hover:scale-110 ${
                        hasLiked ? 'fill-[var(--red)] text-[var(--red)]' : ''
                      }`}
                    />
                    <span>{post.likes_count ?? 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={14} />
                    <span>{post.comments_count ?? 0}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── LOAD MORE BUTTON ── */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="relative overflow-hidden h-10 px-5 rounded-xl border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs min-w-[160px] disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <span>Loading posts...</span>
                    <ButtonLineLoader />
                  </>
                ) : (
                  <span>Load more posts</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {postToDelete && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">Delete Post</h4>
                <p className="text-xs text-[var(--muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text)] leading-relaxed">
              Are you sure you want to permanently delete this post from your profile?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={isDeleting}
                className="h-9 px-4 rounded-xl border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="relative overflow-hidden h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-w-[120px] disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <span>Deleting...</span>
                    <ButtonLineLoader />
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE LIGHTBOX MODAL ── */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-10"
            aria-label="Close image"
          >
            <X size={18} />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImageUrl}
              alt="Expanded post media"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
