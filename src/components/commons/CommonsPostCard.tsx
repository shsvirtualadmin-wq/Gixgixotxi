import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
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
import { useAuthGate } from '@/contexts/AuthGateContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { MathText } from '@/components/ui/MathText';
import { sanitizeStudentDisplayName, maskPublicUserText, buildEntitySlug } from '@/utils/privacy';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useTheme } from '@/hooks/useTheme';
import { CommonsImageAttachment } from './CommonsImageAttachment';
import { CommonsImageViewerModal } from './CommonsImageViewerModal';

interface CommonsPostCardProps {
  post: CommonsPost;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onOpenComments: (post: CommonsPost) => void;
  onOpenReport: (post: CommonsPost) => void;
  onDeletePost?: (postId: string) => void;
  onAuthorClick?: (authorUid: string) => void;
}

const voteSaveCache = new Map<string, { voted: boolean; saved: boolean }>();

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
  const { requireAuth } = useAuthGate();
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
  const [viewerImage, setViewerImage] = useState<{ url: string; name?: string } | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  // Sync vote & save state when card approaches viewport (with in-memory cache)
  useEffect(() => {
    if (!currentUserId || !post.id) return;
    const cacheKey = `${currentUserId}:${post.id}`;
    const cached = voteSaveCache.get(cacheKey);
    if (cached) {
      setHasVoted(cached.voted);
      setIsSaved(cached.saved);
      return;
    }

    let isMounted = true;
    const fetchStatus = () => {
      Promise.all([
        checkUserVoted(post.id, currentUserId),
        checkUserSaved(post.id, currentUserId),
      ])
        .then(([voted, saved]) => {
          voteSaveCache.set(cacheKey, { voted, saved });
          if (isMounted) {
            setHasVoted(voted);
            setIsSaved(saved);
          }
        })
        .catch(() => {});
    };

    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      fetchStatus();
      return () => {
        isMounted = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          fetchStatus();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => {
      isMounted = false;
      observer.disconnect();
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
  const postPermalink = `/commons/post/${buildEntitySlug(post.id, post.title)}`;

  const handleVote = async () => {
    if (!currentUserId) {
      requireAuth('like this post');
      return;
    }
    if (voting) return;
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
      const cacheKey = `${currentUserId}:${post.id}`;
      const existing = voteSaveCache.get(cacheKey);
      voteSaveCache.set(cacheKey, { voted: res.voted, saved: existing?.saved ?? isSaved });
    } catch {
      setHasVoted(prevVoted);
      setUpvotes(prevCount);
    } finally {
      setVoting(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      requireAuth('save this post to your library');
      return;
    }
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      const res = await toggleSavePost(post.id, currentUserId);
      setIsSaved(res.saved);
      const cacheKey = `${currentUserId}:${post.id}`;
      const existing = voteSaveCache.get(cacheKey);
      voteSaveCache.set(cacheKey, { voted: existing?.voted ?? hasVoted, saved: res.saved });
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${postPermalink}`;
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
    <article ref={cardRef} className="group relative glass-card rounded-[28px] p-4 sm:p-6 transition-all duration-200 hover:border-[var(--glass-border-hover)]">
      {/* ── Pinned Post Indicator (Super Admin) ── */}
      {isPinned && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-3 pb-2.5 border-b border-[var(--glass-border)] font-sans">
          <Pin size={13} className="fill-current text-accent" />
          <span>Pinned</span>
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
                isSuperAdmin={isSuperAdminAuthor}
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
                  requireAuth('report this post', () => onOpenReport(post));
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

      {/* ── Post Title (Clickable Permalink to real Post Detail URL) ── */}
      <h2
        className="text-[17px] font-bold text-primary mb-2 leading-snug font-sans"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <Link to={postPermalink} className="hover:text-accent transition-colors">
          <MathText text={post.title} />
        </Link>
      </h2>

      {/* ── Post Body (Preserve line breaks, paragraphs, KaTeX math, 4 lines + See more) ── */}
      {post.description && (
        <div className="text-[15px] text-secondary leading-relaxed whitespace-pre-wrap font-normal mb-3 font-sans">
          <div className={expanded ? '' : 'line-clamp-4'}>
            <MathText text={maskPublicUserText(post.description)} block />
          </div>
          {!expanded && isLongDescription && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs font-semibold text-accent hover:underline mt-1.5 cursor-pointer block font-sans"
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
            <Link
              key={idx}
              to={`/search?q=${encodeURIComponent(tag)}`}
              className="text-muted bg-surface-muted hover:text-primary px-2 py-0.5 rounded-md text-xs font-medium border border-border font-sans transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* ── Image Attachments (with skeleton, retry placeholder & lightbox) ── */}
      {imageFiles.length > 0 && (
        <div className="mb-3 space-y-2.5">
          {imageFiles.map((file, i) => (
            <CommonsImageAttachment
              key={i}
              file={file}
              authorUid={post.isAnonymous ? null : post.authorUid}
              onOpenViewer={(url, name) => setViewerImage({ url, name: name || post.title })}
            />
          ))}
        </div>
      )}

      {/* ── Shared Document File Chips ── */}
      {docFiles.length > 0 && (
        <div className="space-y-2 mb-3">
          {docFiles.map((file, i) => (
            <FileAttachmentChip
              key={i}
              file={file}
              currentUserId={currentUserId}
              onRequireAuth={() => requireAuth('download this study material')}
            />
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

      {/* Full-screen pinch-to-zoom image viewer */}
      <CommonsImageViewerModal
        isOpen={Boolean(viewerImage)}
        imageUrl={viewerImage?.url || null}
        imageAlt={viewerImage?.name || post.title}
        onClose={() => setViewerImage(null)}
      />
    </article>
  );
});

function FileAttachmentChip({
  file,
  currentUserId,
  onRequireAuth,
}: {
  file: CommonsFileAttachment;
  currentUserId?: string | null;
  onRequireAuth: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const fileName = file?.name || 'attachment';
  const fileType = file?.type || '';
  const isPdf =
    fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!file?.url?.startsWith('firestore://')) return;
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      const { resolveCommonsAttachmentUrl } = await import('@/services/commonsUploadService');
      const resolved = await resolveCommonsAttachmentUrl(file.url);
      if (resolved) {
        const a = document.createElement('a');
        a.href = resolved;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('[CommonsPostCard] Failed to download attachment:', err);
    } finally {
      setDownloading(false);
    }
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

      {currentUserId ? (
        <a
          href={file.url}
          onClick={handleDownloadClick}
          target="_blank"
          rel="ugc nofollow noopener noreferrer"
          download={file.name}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-strong rounded-lg shrink-0 transition-colors shadow-xs"
        >
          <Download size={13} />
          <span>{downloading ? 'Preparing...' : 'Download'}</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={onRequireAuth}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-strong rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
        >
          <Download size={13} />
          <span>Sign in to Download</span>
        </button>
      )}
    </div>
  );
}


