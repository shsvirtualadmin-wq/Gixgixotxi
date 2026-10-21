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
  ExternalLink,
  Download,
  UserCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import type { CommonsPost, CommonsFileAttachment } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';
import { togglePostVote, toggleSavePost, checkUserVoted, checkUserSaved } from '@/services/commonsService';
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

  // Sync vote state on mount / user change
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

  const typeMeta = COMMONS_POST_TYPES[post.type] || COMMONS_POST_TYPES.notes;

  const handleVote = async () => {
    if (!currentUserId || voting) return;
    setVoting(true);
    // Optimistic UI
    const prevVoted = hasVoted;
    const prevCount = upvotes;
    setHasVoted(!prevVoted);
    setUpvotes(prevVoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await togglePostVote(post.id, currentUserId);
      setHasVoted(res.voted);
      setUpvotes(res.newCount);
    } catch (err) {
      // Revert on error
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
      setTimeout(() => setCopied(false), 2000);
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

  const isAuthor = currentUserId && (post.authorUid === currentUserId);
  const canDelete = isAuthor || isAdmin;

  // High contrast theme-aware badge coloring
  const badgeColor = isDark
    ? (post.type === 'discussion'
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
        : '#F87171')
    : (post.type === 'discussion'
        ? '#334155'
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
        : '#B91C1C');

  return (
    <article className="group relative rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      {/* ── Header Metadata Row (Unboxed metadata with typographic separators) ── */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div
          onClick={() => {
            if (!post.isAnonymous && post.authorUid) {
              openProfile(post.authorUid);
            }
          }}
          className={`flex items-center gap-2.5 min-w-0 ${
            !post.isAnonymous && post.authorUid ? 'cursor-pointer group/author' : ''
          }`}
          title={!post.isAnonymous ? `View ${post.authorName}'s profile` : undefined}
        >
          {/* Author avatar */}
          {post.isAnonymous ? (
            <div className="w-8 h-8 rounded-full bg-surface-muted border border-border flex items-center justify-center text-xs font-mono text-muted shrink-0">
              ?
            </div>
          ) : (
            <BoardlyAvatar
              equippedAvatar={(post as any).authorEquippedAvatar || (post.authorAvatar?.startsWith('pfp_') ? post.authorAvatar : undefined)}
              avatarUrl={post.authorAvatar && !post.authorAvatar.startsWith('pfp_') && !post.authorAvatar.includes('googleusercontent') ? post.authorAvatar : undefined}
              photoURL={post.authorAvatar?.includes('googleusercontent') ? post.authorAvatar : (post as any).authorPhotoURL}
              frame={(post as any).authorFrame}
              name={sanitizeStudentDisplayName(post.authorName, post.authorUid)}
              size={32}
            />
          )}

          {/* Author details */}
          <div className="min-w-0">
            {post.isAnonymous ? (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="font-medium text-muted">Anonymous</span>
                <span aria-hidden="true">·</span>
                <span>{formatTime(post.createdAt)}</span>
                {post.target && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-secondary font-medium truncate">{post.target}</span>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-primary group-hover/author:text-accent transition-colors truncate">
                    {sanitizeStudentDisplayName(post.authorName, post.authorUid)}
                  </span>
                  <RoleBadge
                    role={(post as any).authorRole || 'Student'}
                    customRole={(post as any).authorCustomRole}
                    isSuperAdmin={
                      (post as any).authorRole === 'superadmin' ||
                      (post as any).authorRole === 'admin' ||
                      post.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
                    }
                    size="sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span>{formatTime(post.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-secondary font-medium truncate">{post.target}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Type Badge & Options Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-md border"
            style={{
              backgroundColor: isDark ? `${badgeColor}22` : `${badgeColor}12`,
              borderColor: `${badgeColor}40`,
              color: badgeColor,
            }}
          >
            {typeMeta.badgeLabel}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Post options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border-strong bg-surface-raised py-1.5 shadow-xl backdrop-blur-md"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(post);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary hover:bg-surface-muted hover:text-accent text-left transition-colors cursor-pointer"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent hover:bg-accent-soft text-left transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Subject & Chapter quiet taxonomy line ── */}
      <div className="flex items-center gap-2 text-xs text-muted mb-2">
        <span className="text-accent font-medium uppercase tracking-wider text-[11px]">
          {post.subject}
        </span>
        <span aria-hidden="true" className="text-muted">/</span>
        <span className="truncate text-secondary font-medium">{post.chapter}</span>
      </div>

      {/* ── Post Title ── */}
      <h2 className="text-base font-bold text-primary mb-2 tracking-tight line-clamp-2">
        {post.title}
      </h2>

      {/* ── Post Description ── */}
      {post.description && (
        <div className="text-sm text-secondary mb-3 whitespace-pre-line leading-relaxed font-normal">
          {expanded || post.description.length <= 220 ? (
            post.description
          ) : (
            <>
              {post.description.slice(0, 220)}...{' '}
              <button
                onClick={() => setExpanded(true)}
                className="text-accent hover:underline font-medium text-xs ml-1 cursor-pointer"
              >
                Read more
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Tags (quiet unboxed typographic styling) ── */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-muted">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-muted bg-surface-muted px-2 py-0.5 rounded text-[11px] font-mono border border-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── File Attachments ── */}
      {post.files && post.files.length > 0 && (
        <div className="space-y-2 mb-4">
          {post.files.map((file, i) => (
            <FileAttachmentItem key={i} file={file} />
          ))}
        </div>
      )}

      {/* ── Action Bar: Votes, Comments, Save, Share ── */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
        <div className="flex items-center gap-1.5">
          {/* Upvote button */}
          <button
            onClick={handleVote}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              hasVoted
                ? 'bg-accent-soft border border-accent text-accent font-semibold'
                : 'text-secondary hover:text-primary hover:bg-surface-muted border border-transparent'
            }`}
            title={currentUserId ? 'Upvote' : 'Sign in to vote'}
          >
            <ThumbsUp size={15} className={hasVoted ? 'fill-current text-accent' : ''} />
            <span>{upvotes}</span>
          </button>

          {/* Comments button */}
          <button
            onClick={() => onOpenComments(post)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <MessageSquare size={15} />
            <span>{post.commentCount || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Save / Bookmark button */}
          <button
            onClick={handleSave}
            disabled={!currentUserId}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isSaved
                ? 'text-accent bg-accent-soft'
                : 'text-muted hover:text-primary hover:bg-surface-muted'
            }`}
            title="Save for later"
          >
            <Bookmark size={16} className={isSaved ? 'fill-current text-accent' : ''} />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            title="Copy share link"
          >
            <Share2 size={16} />
            {copied && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Copied!</span>}
          </button>
        </div>
      </div>
    </article>
  );
});

function FileAttachmentItem({ file }: { file: CommonsFileAttachment }) {
  const fileName = file?.name || 'attachment';
  const fileType = file?.type || '';
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-surface-muted hover:border-border-strong transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
          {isImage ? <ImageIcon size={16} /> : isPdf ? <FileText size={16} /> : <File size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary truncate">{file.name}</p>
          <p className="text-[10px] text-muted font-mono">{formatSize(file.size)}</p>
        </div>
      </div>

      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        download={file.name}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-strong rounded-lg shrink-0 transition-colors shadow-xs"
      >
        <Download size={13} />
        <span>Open</span>
      </a>
    </div>
  );
}
