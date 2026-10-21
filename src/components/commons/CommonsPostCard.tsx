import { useState } from 'react';
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

interface CommonsPostCardProps {
  post: CommonsPost;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onOpenComments: (post: CommonsPost) => void;
  onOpenReport: (post: CommonsPost) => void;
  onDeletePost?: (postId: string) => void;
  onAuthorClick?: (authorUid: string) => void;
}

export function CommonsPostCard({
  post,
  currentUserId,
  isAdmin,
  onOpenComments,
  onOpenReport,
  onDeletePost,
}: CommonsPostCardProps) {
  const { openProfile } = useProfileModal();
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

  return (
    <article className="group relative rounded-2xl border border-neutral-800 bg-[#0c0c0e]/95 p-5 shadow-sm transition-all duration-200 hover:border-neutral-700/80 hover:bg-[#111114]">
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
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono text-neutral-400 shrink-0">
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-100 group-hover/author:text-red-400 transition-colors truncate">
                {sanitizeStudentDisplayName(post.authorName, post.authorUid)}
              </span>
              {post.isAnonymous && (
                <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                  ANON
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span>{formatTime(post.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-300 font-medium truncate">{post.target}</span>
            </div>
          </div>
        </div>

        {/* Post Type Badge & Options Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-md border text-neutral-200"
            style={{
              backgroundColor: `${typeMeta.color}15`,
              borderColor: `${typeMeta.color}35`,
              color: typeMeta.color,
            }}
          >
            {typeMeta.badgeLabel}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
              aria-label="Post options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-neutral-800 bg-neutral-900/95 py-1.5 shadow-xl backdrop-blur-md"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(post);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800/70 hover:text-red-400 text-left transition-colors"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 text-left transition-colors"
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
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
        <span className="text-red-400/90 font-medium uppercase tracking-wider text-[11px]">
          {post.subject}
        </span>
        <span aria-hidden="true" className="text-neutral-600">/</span>
        <span className="truncate text-neutral-300">{post.chapter}</span>
      </div>

      {/* ── Post Title ── */}
      <h2 className="text-base font-bold text-neutral-100 mb-2 tracking-tight line-clamp-2">
        {post.title}
      </h2>

      {/* ── Post Description ── */}
      {post.description && (
        <div className="text-sm text-neutral-300 mb-3 whitespace-pre-line leading-relaxed font-normal">
          {expanded || post.description.length <= 220 ? (
            post.description
          ) : (
            <>
              {post.description.slice(0, 220)}...{' '}
              <button
                onClick={() => setExpanded(true)}
                className="text-red-400 hover:text-red-300 font-medium text-xs ml-1 underline underline-offset-2"
              >
                Read more
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Tags (quiet unboxed typographic styling) ── */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-neutral-400">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded text-[11px] font-mono border border-neutral-800/80"
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
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Upvote button */}
          <button
            onClick={handleVote}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              hasVoted
                ? 'bg-red-950/60 border border-red-800/80 text-red-400 font-semibold'
                : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent'
            }`}
            title={currentUserId ? 'Upvote' : 'Sign in to vote'}
          >
            <ThumbsUp size={15} className={hasVoted ? 'fill-red-400 text-red-400' : ''} />
            <span>{upvotes}</span>
          </button>

          {/* Comments button */}
          <button
            onClick={() => onOpenComments(post)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/70 transition-colors"
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
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved
                ? 'text-red-400 bg-red-950/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title="Save for later"
          >
            <Bookmark size={16} className={isSaved ? 'fill-red-400' : ''} />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            title="Copy share link"
          >
            <Share2 size={16} />
            {copied && <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function FileAttachmentItem({ file }: { file: CommonsFileAttachment }) {
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-neutral-800/90 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
          {isImage ? <ImageIcon size={16} /> : isPdf ? <FileText size={16} /> : <File size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-200 truncate">{file.name}</p>
          <p className="text-[10px] text-neutral-400 font-mono">{formatSize(file.size)}</p>
        </div>
      </div>

      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        download={file.name}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg shrink-0 transition-colors"
      >
        <Download size={13} />
        <span>Open</span>
      </a>
    </div>
  );
}
