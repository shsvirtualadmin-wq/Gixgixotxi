import { useState, useEffect, memo } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  FileText,
  File,
  Image as ImageIcon,
  Download,
  MoreHorizontal,
  Trash2,
  EyeOff,
  Globe,
  Pin,
  Eye,
  Check,
} from 'lucide-react';
import type { CommonsPost, CommonsFileAttachment } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';
import {
  togglePostVote,
  toggleSavePost,
  checkUserVoted,
  checkUserSaved,
} from '@/services/commonsService';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useTheme } from '@/hooks/useTheme';

interface CommonsPostCardProps {
  post: CommonsPost;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onOpenComments: (post: CommonsPost) => void;
  onOpenReport: (post: CommonsPost) => void;
  onDeletePost?: (postId: string) => void;
  onAuthorClick?: (authorUid: string) => void;
}

export const CommonsPostCard = memo(function CommonsPostCard({
  post,
  currentUserId,
  isAdmin,
  onOpenComments,
  onOpenReport,
  onDeletePost,
  onAuthorClick,
}: CommonsPostCardProps) {
  const { openProfile } = useProfileModal();
  const { isDark } = useTheme();
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voting, setVoting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [localShares, setLocalShares] = useState(post.sharesCount || 0);

  // Sync vote & save state on mount / user change
  useEffect(() => {
    let isMounted = true;
    if (currentUserId && post.id) {
      Promise.all([
        checkUserVoted(post.id, currentUserId),
        checkUserSaved(post.id, currentUserId),
      ])
        .then(([voted, saved]) => {
          if (isMounted) {
            setHasVoted(voted);
            setIsSaved(saved);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [post.id, currentUserId]);

  if (isHidden) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted/50 p-4 text-center text-xs text-muted flex items-center justify-between">
        <span>Post hidden from your feed.</span>
        <button
          onClick={() => setIsHidden(false)}
          className="text-accent font-semibold hover:underline cursor-pointer"
        >
          Undo
        </button>
      </div>
    );
  }

  const typeMeta = COMMONS_POST_TYPES[post.type] || COMMONS_POST_TYPES.notes;

  const handleVote = async () => {
    if (!currentUserId || voting) return;
    setVoting(true);
    // Instant optimistic UI
    const prevVoted = hasVoted;
    const prevCount = upvotes;
    setHasVoted(!prevVoted);
    setUpvotes(prevVoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await togglePostVote(post.id, currentUserId);
      setHasVoted(res.voted);
      setUpvotes(res.newCount);
    } catch {
      setHasVoted(prevVoted);
      setUpvotes(prevCount);
    } finally {
      setVoting(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      const res = await toggleSavePost(post.id, currentUserId);
      setIsSaved(res.saved);
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/dashboard/commons?post=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setLocalShares((prev) => prev + 1);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const isAuthor = currentUserId && post.authorUid === currentUserId;
  const canDelete = isAuthor || isAdmin;
  const isSuperAdminAuthor =
    (post as any).authorRole === 'superadmin' ||
    (post as any).authorRole === 'admin' ||
    post.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

  // Check if pinned
  const isPinned =
    Boolean(post.isPinned) ||
    (isSuperAdminAuthor &&
      Boolean(
        (post as any).pinned ||
          post.title?.toLowerCase().includes('welcome') ||
          post.title?.toLowerCase().includes('guideline')
      ));

  // High contrast theme-aware badge coloring
  const badgeColor = isDark
    ? post.type === 'discussion'
      ? '#94A3B8'
      : post.type === 'past_paper'
      ? '#60A5FA'
      : post.type === 'solved_paper'
      ? '#34D399'
      : post.type === 'formula_sheet'
      ? '#A78BFA'
      : post.type === 'doubt'
      ? '#FB923C'
      : post.type === 'resource_link'
      ? '#2DD4BF'
      : '#F87171'
    : post.type === 'discussion'
    ? '#475569'
    : post.type === 'past_paper'
    ? '#1D4ED8'
    : post.type === 'solved_paper'
    ? '#047857'
    : post.type === 'formula_sheet'
    ? '#6D28D9'
    : post.type === 'doubt'
    ? '#C2410C'
    : post.type === 'resource_link'
    ? '#0F766E'
    : '#B91C1C';

  // Separate image attachments from document attachments
  const attachments = post.files || [];
  const imageFiles = attachments.filter(
    (f) =>
      f.type?.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '')
  );
  const docFiles = attachments.filter(
    (f) =>
      !f.type?.startsWith('image/') &&
      !/\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '')
  );

  // Stats row content
  const statsParts: string[] = [];
  if (upvotes > 0) statsParts.push(`👍 ${upvotes}`);
  if (post.commentCount && post.commentCount > 0) {
    statsParts.push(
      `${post.commentCount} ${post.commentCount === 1 ? 'comment' : 'comments'}`
    );
  }
  if (localShares > 0) {
    statsParts.push(`${localShares} ${localShares === 1 ? 'share' : 'shares'}`);
  }

  const handleAuthorClick = () => {
    if (!post.isAnonymous && post.authorUid) {
      if (onAuthorClick) {
        onAuthorClick(post.authorUid);
      } else {
        openProfile(post.authorUid);
      }
    }
  };

  const isLongDescription =
    post.description &&
    (post.description.length > 220 || post.description.split('\n').length > 4);

  return (
    <article className="group relative rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      {/* ── Pinned Post Indicator (Super Admin) ── */}
      {isPinned && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-3 pb-2.5 border-b border-border">
          <Pin size={13} className="fill-current text-accent" />
          <span>Pinned Post</span>
        </div>
      )}

      {/* ── Header: Avatar, Author, Time + Globe/Mask, Type Pill, Menu ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {post.isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-surface-muted border border-border flex items-center justify-center text-muted shrink-0 select-none">
              <EyeOff size={18} />
            </div>
          ) : (
            <div
              onClick={handleAuthorClick}
              className="shrink-0 cursor-pointer transition-transform hover:scale-105"
            >
              <BoardlyAvatar
                equippedAvatar={
                  (post as any).authorEquippedAvatar ||
                  (post.authorAvatar?.startsWith('pfp_')
                    ? post.authorAvatar
                    : undefined)
                }
                avatarUrl={
                  post.authorAvatar &&
                  !post.authorAvatar.startsWith('pfp_') &&
                  !post.authorAvatar.includes('googleusercontent')
                    ? post.authorAvatar
                    : undefined
                }
                photoURL={
                  post.authorAvatar?.includes('googleusercontent')
                    ? post.authorAvatar
                    : (post as any).authorPhotoURL
                }
                frame={(post as any).authorFrame}
                name={sanitizeStudentDisplayName(post.authorName, post.authorUid)}
                size={40}
              />
            </div>
          )}

          {/* Author Name, Role Badge, Time & Privacy Icon, Type Pill */}
          <div className="min-w-0">
            {post.isAnonymous ? (
              <div>
                <span className="text-[15px] font-bold text-primary">Anonymous</span>
                <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5 flex-wrap">
                  <span>{formatTime(post.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <EyeOff size={12} />
                    <span>Anonymous</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isDark ? `${badgeColor}22` : `${badgeColor}12`,
                      borderColor: `${badgeColor}40`,
                      color: badgeColor,
                    }}
                  >
                    {typeMeta.badgeLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    onClick={handleAuthorClick}
                    className="text-[15px] font-bold text-primary hover:text-accent transition-colors truncate cursor-pointer"
                  >
                    {sanitizeStudentDisplayName(post.authorName, post.authorUid)}
                  </span>
                  <RoleBadge
                    role={(post as any).authorRole || 'Student'}
                    customRole={(post as any).authorCustomRole}
                    isSuperAdmin={isSuperAdminAuthor}
                    size="sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5 flex-wrap">
                  <span>{formatTime(post.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Globe size={12} />
                    <span>Public</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isDark ? `${badgeColor}22` : `${badgeColor}12`,
                      borderColor: `${badgeColor}40`,
                      color: badgeColor,
                    }}
                  >
                    {typeMeta.badgeLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Three-Dot Options Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border-strong bg-surface-raised py-1.5 shadow-xl animate-in fade-in zoom-in-95"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSave();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary hover:bg-surface-muted hover:text-primary text-left transition-colors cursor-pointer"
              >
                <Bookmark size={14} className={isSaved ? 'text-accent fill-current' : ''} />
                <span>{isSaved ? 'Unsave post' : 'Save post'}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsHidden(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary hover:bg-surface-muted hover:text-primary text-left transition-colors cursor-pointer"
              >
                <EyeOff size={14} />
                <span>Hide post</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenReport(post);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary hover:bg-surface-muted hover:text-accent text-left transition-colors cursor-pointer"
              >
                <Flag size={14} />
                <span>Report post</span>
              </button>

              {canDelete && onDeletePost && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeletePost(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-accent hover:bg-accent-soft text-left transition-colors cursor-pointer border-t border-border mt-1"
                >
                  <Trash2 size={14} />
                  <span>Delete post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Post Title (Bold sans-serif, no stray slash) ── */}
      <h2 className="text-[16px] sm:text-[17px] font-bold text-primary mb-2 leading-snug">
        {post.title}
      </h2>

      {/* ── Post Body (Preserve line breaks, paragraphs, 4 lines + See more) ── */}
      {post.description && (
        <div className="text-[15px] text-secondary leading-relaxed whitespace-pre-wrap font-normal mb-3">
          <div className={expanded ? '' : 'line-clamp-4'}>
            {post.description}
          </div>
          {!expanded && isLongDescription && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs font-semibold text-accent hover:underline mt-1.5 cursor-pointer block"
            >
              See more
            </button>
          )}
        </div>
      )}

      {/* ── Tags (Clean subtle hashtag chips) ── */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-muted bg-surface-muted px-2 py-0.5 rounded-md text-xs font-medium border border-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Image Previews ── */}
      {imageFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          {imageFiles.map((file, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-border bg-surface-muted max-h-96"
            >
              <img
                src={file.url}
                alt={file.name}
                loading="lazy"
                onClick={() => window.open(file.url, '_blank')}
                className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Shared Document File Chips ── */}
      {docFiles.length > 0 && (
        <div className="space-y-2 mb-3">
          {docFiles.map((file, i) => (
            <FileAttachmentChip key={i} file={file} />
          ))}
        </div>
      )}

      {/* ── Stats Row ("👍 12 · 4 comments · 2 shares", hide zero parts) ── */}
      {statsParts.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted pt-2 pb-2">
          <div className="flex items-center gap-2">
            <span>{statsParts.join(' · ')}</span>
          </div>
          {copied && (
            <span className="text-[11px] text-accent font-semibold flex items-center gap-1">
              <Check size={12} />
              <span>Link copied!</span>
            </span>
          )}
        </div>
      )}

      {/* ── Action Bar: Divider + Like, Comment, Share, Save ── */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        {/* Like */}
        <button
          onClick={handleVote}
          disabled={!currentUserId}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            hasVoted
              ? 'text-accent font-bold bg-accent-soft'
              : 'text-secondary hover:text-primary hover:bg-surface-muted'
          }`}
          title={currentUserId ? 'Like post' : 'Sign in to like'}
        >
          <ThumbsUp
            size={16}
            className={hasVoted ? 'fill-current text-accent' : ''}
          />
          <span>Like</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => onOpenComments(post)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <MessageSquare size={16} />
          <span>Comment</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          title="Share link"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        {/* Save Bookmark */}
        <button
          onClick={handleSave}
          disabled={!currentUserId}
          className={`p-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer ${
            isSaved
              ? 'text-accent bg-accent-soft'
              : 'text-muted hover:text-primary hover:bg-surface-muted'
          }`}
          title={isSaved ? 'Saved' : 'Save post'}
        >
          <Bookmark size={16} className={isSaved ? 'fill-current text-accent' : ''} />
        </button>
      </div>
    </article>
  );
});

function FileAttachmentChip({ file }: { file: CommonsFileAttachment }) {
  const fileName = file?.name || 'attachment';
  const fileType = file?.type || '';
  const isPdf =
    fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-surface-muted/60 hover:border-border-strong transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
          {isPdf ? <FileText size={16} /> : <File size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary truncate">{file.name}</p>
          <p className="text-[10px] text-muted">{formatSize(file.size)}</p>
        </div>
      </div>

      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        download={file.name}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-strong rounded-lg shrink-0 transition-colors shadow-xs"
      >
        <Download size={13} />
        <span>Open</span>
      </a>
    </div>
  );
}
