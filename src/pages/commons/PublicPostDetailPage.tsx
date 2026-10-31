import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
  Download,
  FileText,
  File,
  EyeOff,
  Globe,
  Check,
  Send,
  Loader2,
  Reply,
  Link2,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { MathText } from '@/components/ui/MathText';
import { CommonsImageAttachment } from '@/components/commons/CommonsImageAttachment';
import { CommonsImageViewerModal } from '@/components/commons/CommonsImageViewerModal';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GonePage } from '@/pages/GonePage';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthGate } from '@/contexts/AuthGateContext';
import {
  fetchCommonsPostById,
  fetchCommonsPosts,
  fetchPostComments,
  addPostComment,
  togglePostVote,
  toggleSavePost,
  checkUserVoted,
  checkUserSaved,
} from '@/services/commonsService';
import { resolveCommonsAttachmentUrl } from '@/services/commonsUploadService';
import { routes } from '@/utils/routes';
import type { CommonsPost, CommonsComment } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';
import {
  sanitizeStudentDisplayName,
  maskPublicUserText,
  extractIdFromSlug,
  buildEntitySlug,
} from '@/utils/privacy';

export const PublicPostDetailPage: React.FC = () => {
  const { idSlug, postId: rawPostIdParam } = useParams<{
    idSlug?: string;
    postId?: string;
  }>();
  const postId = extractIdFromSlug(idSlug || rawPostIdParam || '');
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { requireAuth } = useAuthGate();

  const [post, setPost] = useState<CommonsPost | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'gone'>('loading');
  const [comments, setComments] = useState<CommonsComment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<CommonsPost[]>([]);
  const [upvotes, setUpvotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isAnonComment, setIsAnonComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; name?: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const loadData = useCallback(async () => {
    if (!postId) {
      setStatus('not_found');
      return;
    }
    setStatus('loading');
    try {
      const fetched = await fetchCommonsPostById(postId);
      if (!fetched) {
        setStatus('not_found');
        return;
      }
      if ((fetched as any).isHidden || (fetched as any).status === 'removed') {
        setStatus('gone');
        return;
      }
      setPost(fetched);
      setUpvotes(fetched.upvotes || 0);
      setStatus('ready');

      const [loadedComments, recentFeed] = await Promise.all([
        fetchPostComments(fetched.id).catch(() => []),
        fetchCommonsPosts({ feedTab: 'all', pageSize: 24 }).catch(() => ({
          posts: [],
          lastDoc: null,
          hasMore: false,
        })),
      ]);
      setComments(loadedComments);

      // Score and sort related posts by subject, chapter, and tag overlap, falling back to latest
      const targetSubj = (fetched.subject || '').toLowerCase().trim();
      const targetChap = (fetched.chapter || '').toLowerCase().trim();
      const targetTags = new Set((fetched.tags || []).map((t) => t.toLowerCase()));

      const candidates = recentFeed.posts.filter((p) => p.id !== fetched.id);
      const scored = candidates
        .map((candidate) => {
          let score = 0;
          if (targetSubj && (candidate.subject || '').toLowerCase().trim() === targetSubj) {
            score += 4;
          }
          if (
            targetChap &&
            targetChap !== 'general' &&
            (candidate.chapter || '').toLowerCase().trim() === targetChap
          ) {
            score += 3;
          }
          for (const t of candidate.tags || []) {
            if (targetTags.has(t.toLowerCase())) {
              score += 2;
            }
          }
          if (candidate.type === fetched.type) {
            score += 1;
          }
          return { candidate, score };
        })
        .sort((a, b) => b.score - a.score);

      setRelatedPosts(scored.slice(0, 4).map((s) => s.candidate));

      if (user?.uid) {
        const [voted, saved] = await Promise.all([
          checkUserVoted(fetched.id, user.uid).catch(() => false),
          checkUserSaved(fetched.id, user.uid).catch(() => false),
        ]);
        setHasVoted(voted);
        setIsSaved(saved);
      }
    } catch {
      setStatus('not_found');
    }
  }, [postId, user?.uid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Scroll to and highlight #comment-:commentId or #comments when hash is present
  useEffect(() => {
    if (status !== 'ready') return;
    const rawHash = location.hash || '';
    if (!rawHash) return;

    if (rawHash.startsWith('#comment-')) {
      const targetCmtId = decodeURIComponent(rawHash.slice('#comment-'.length));
      setHighlightedCommentId(targetCmtId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${targetCmtId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    if (rawHash === '#comments') {
      const timer = setTimeout(() => {
        const el = document.getElementById('comments');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [status, comments.length, location.hash]);

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6"
      >
        <span className="sr-only">Loading post</span>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-4 w-48 skeleton rounded" />
          <div className="glass-panel p-7 sm:p-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="h-6 w-32 skeleton rounded-full" />
              <div className="h-6 w-20 skeleton rounded-full" />
            </div>
            <div className="h-8 w-3/4 skeleton rounded" />
            <div className="space-y-2.5 pt-1">
              <div className="h-3.5 w-full skeleton rounded" />
              <div className="h-3.5 w-5/6 skeleton rounded" />
              <div className="h-3.5 w-2/3 skeleton rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'gone') {
    return <GonePage />;
  }

  if (status === 'not_found' || !post) {
    return <NotFoundPage />;
  }

  const canonicalSlug = buildEntitySlug(post.id, post.title);
  const canonicalPath = `/commons/post/${canonicalSlug}`;
  const authorDisplay = post.isAnonymous
    ? post.anonymousAlias || 'Anonymous Student'
    : sanitizeStudentDisplayName(post.authorName, post.authorUid);

  const typeMeta = COMMONS_POST_TYPES[post.type] || COMMONS_POST_TYPES.notes;
  const attachments = (post.files || []).filter(
    (f) => Boolean(f && (f.url?.trim() || f.r2Key?.trim()))
  );
  const imageFiles = attachments.filter(
    (f) =>
      f.type?.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '') ||
      /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(f.url || '')
  );
  const docFiles = attachments.filter(
    (f) =>
      !f.type?.startsWith('image/') &&
      !/\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '') &&
      !/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(f.url || '')
  );

  const createdDateIso = post.createdAt?.toDate
    ? post.createdAt.toDate().toISOString()
    : new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    text: maskPublicUserText(post.description),
    datePublished: createdDateIso,
    url: `https://boardly.cfd${canonicalPath}`,
    author: {
      '@type': 'Person',
      name: authorDisplay,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: upvotes,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: comments.length,
      },
    ],
  };

  const handleLike = async () => {
    if (!user) {
      requireAuth('like this post');
      return;
    }
    const prev = hasVoted;
    setHasVoted(!prev);
    setUpvotes((c) => (prev ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await togglePostVote(post.id, user.uid);
      setHasVoted(res.voted);
      setUpvotes(res.newCount);
    } catch {
      setHasVoted(prev);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      requireAuth('save this post');
      return;
    }
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await toggleSavePost(post.id, user.uid);
      setIsSaved(res.saved);
    } catch {
      setIsSaved(prev);
    }
  };

  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd';
    const shareUrl = `${origin}${canonicalPath}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopyCommentLink = (commentId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd';
    const commentUrl = `${origin}${canonicalPath}#comment-${commentId}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${canonicalPath}#comment-${commentId}`);
    }
    setHighlightedCommentId(commentId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(commentUrl);
      setCopiedCommentId(commentId);
      setTimeout(() => {
        setCopiedCommentId((prev) => (prev === commentId ? null : prev));
      }, 2200);
    }
  };

  const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    const prefix = `@${authorName} `;
    if (!commentText.startsWith(prefix)) {
      setCommentText(prefix + commentText);
    }
    commentInputRef.current?.focus();
  };

  const handleDocumentDownload = async (
    e: React.MouseEvent,
    file: { name?: string; url?: string; r2Key?: string; downloadUrl?: string }
  ) => {
    e.preventDefault();
    if (!user) {
      requireAuth('download this study material');
      return;
    }
    try {
      const { downloadCommonsAttachment } = await import('@/services/commonsUploadService');
      await downloadCommonsAttachment(file);
    } catch (err) {
      console.error('[PublicPostDetailPage] attachment download error:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      requireAuth('comment on this post');
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed || submittingComment) return;
    setSubmittingComment(true);
    try {
      const actor = {
        uid: user.uid,
        email: user.email || null,
        displayName: profile?.displayName || user.displayName || 'Student',
        photoURL: profile?.photoURL || user.photoURL || null,
        equippedAvatar: profile?.equipped?.avatar || null,
        frame: profile?.equipped?.frame || null,
      };
      await addPostComment({
        postId: post.id,
        text: trimmed,
        body: trimmed,
        isAnonymous: isAnonComment,
        author: actor,
        user: actor,
      });
      setCommentText('');
      const refreshed = await fetchPostComments(post.id);
      setComments(refreshed);
    } catch (err) {
      console.warn('[PublicPostDetailPage] comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const resolvedPractice = routes.practiceFromMaterial(post);
  const commonsSubjectHref = routes.commonsSubject(
    post.subject,
    `${post.title || ''} ${post.chapter || ''} ${(post.tags || []).join(' ')}`
  );

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 box-border overflow-x-hidden bg-[var(--bg)] text-[var(--text)] pt-28 pb-[calc(96px+env(safe-area-inset-bottom,0px))] px-4 sm:px-6">
      <PageMeta
        title={`${post.title} — ${resolvedPractice.subjectSlug ? resolvedPractice.label : post.subject || 'Boardly Commons'}`}
        description={
          maskPublicUserText(post.description).slice(0, 155) ||
          `Read ${post.title} shared in Boardly Commons for ${resolvedPractice.label || 'exam'} preparation.`
        }
        canonicalPath={canonicalPath}
        ogType="article"
        jsonLd={jsonLd}
      />

      <div className="boardly-feed-container max-w-3xl mx-auto w-full min-w-0 box-border overflow-x-hidden">
        <Breadcrumbs
          items={[
            { label: 'Commons', href: '/commons' },
            ...(resolvedPractice.subjectSlug
              ? [{ label: resolvedPractice.label, href: commonsSubjectHref }]
              : []),
            { label: post.title },
          ]}
        />

        <article className="boardly-post-card glass-panel p-5 sm:p-8 mb-8 w-full max-w-full min-w-0 box-border overflow-x-hidden">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {post.isAnonymous ? (
                <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/60 shrink-0">
                  <EyeOff size={18} />
                </div>
              ) : (
                <div className="shrink-0">
                  <BoardlyAvatar
                    equippedAvatar={(post as any).authorEquippedAvatar}
                    avatarUrl={post.authorAvatar || undefined}
                    frame={(post as any).authorFrame}
                    name={authorDisplay}
                    size={44}
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {post.isAnonymous || !post.authorUid ? (
                    <span className="font-bold text-white text-sm sm:text-base truncate max-w-full">
                      {authorDisplay}
                    </span>
                  ) : (
                    <Link
                      to={`/u/${encodeURIComponent(post.authorUid)}`}
                      className="font-bold text-white hover:text-[#D71921] transition-colors text-sm sm:text-base truncate max-w-full"
                    >
                      {authorDisplay}
                    </Link>
                  )}
                  {!post.isAnonymous && (
                    <RoleBadge role={(post as any).authorRole || 'Student'} size="sm" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-white/55 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    {post.isAnonymous ? <EyeOff size={12} /> : <Globe size={12} />}
                    <span>{post.isAnonymous ? 'Anonymous' : 'Public'}</span>
                  </span>
                  <span>·</span>
                  <span className="text-[#D71921] font-medium">{typeMeta.badgeLabel}</span>
                  {post.subject && (
                    <>
                      <span>·</span>
                      <Link
                        to={commonsSubjectHref}
                        className="hover:text-white underline underline-offset-2"
                      >
                        {resolvedPractice.subjectSlug ? resolvedPractice.label : post.subject}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requireAuth('report this post', () => setReportOpen(true))}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-[#D71921] transition-colors cursor-pointer shrink-0"
              title="Report post"
              aria-label="Report post"
            >
              <Flag size={16} />
            </button>
          </div>

          {/* Post H1 Title */}
          <h1 className="boardly-post-title font-dot text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
            <MathText text={post.title} />
          </h1>

          {/* Post Body */}
          {post.description && (
            <div className="boardly-post-content text-sm sm:text-base text-white/80 leading-relaxed whitespace-pre-wrap mb-6 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
              <MathText text={maskPublicUserText(post.description)} block />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 min-w-0 max-w-full">
              {post.tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="glass-pill px-3 py-1 text-xs text-white/70 hover:text-white max-w-full [overflow-wrap:anywhere] [word-break:break-all]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Images */}
          {imageFiles.length > 0 && (
            <div className="space-y-3 mb-6 w-full max-w-full min-w-0">
              {imageFiles.map((file, idx) => (
                <CommonsImageAttachment
                  key={idx}
                  file={file}
                  authorUid={post.isAnonymous ? null : post.authorUid}
                  onOpenViewer={(url, name) => setViewerImage({ url, name: name || post.title })}
                />
              ))}
            </div>
          )}

          {/* Document Attachments */}
          {docFiles.length > 0 && (
            <div className="space-y-2.5 mb-6 w-full max-w-full min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                Attached Study Material
              </h2>
              {docFiles.map((file, idx) => {
                const isPdf =
                  file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={idx}
                    className="glass-row flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-[#D71921]/15 border border-[#D71921]/30 flex items-center justify-center text-[#D71921] shrink-0">
                        {isPdf ? <FileText size={18} /> : <File size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-white/50">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Study Resource'}
                        </p>
                      </div>
                    </div>

                    {user ? (
                      <a
                        href={file.url}
                        onClick={(e) => void handleDocumentDownload(e, file)}
                        target="_blank"
                        rel="ugc nofollow noopener noreferrer"
                        download={file.name}
                        className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requireAuth('download this study material')}
                        className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Sign in to Download</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/10 w-full max-w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={handleLike}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                  hasVoted
                    ? 'bg-[#D71921]/20 border-[#D71921] text-white'
                    : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                <ThumbsUp size={15} />
                <span>Like ({upvotes})</span>
              </button>

              <button
                type="button"
                onClick={handleBookmark}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#D71921]/20 border-[#D71921] text-white'
                    : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                <Bookmark size={15} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 text-white/75 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
              <span>{copied ? 'Link Copied!' : 'Share Permalink'}</span>
            </button>
          </div>
        </article>

        {/* Public Comments Section */}
        <section
          id="comments"
          className="glass-panel p-5 sm:p-8 mb-8 w-full max-w-full min-w-0 box-border overflow-x-hidden scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-6 min-w-0">
            <h2 className="font-dot text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-[#D71921]" />
              <span>Discussion ({comments.length})</span>
            </h2>
          </div>

          {/* Comment Composer (Requires Login on Submit/Focus) */}
          <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3 min-w-0">
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#D71921]/15 border border-[#D71921]/30 text-xs text-white/85">
                <span>
                  Replying to <strong>{replyingTo.authorName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-white/60 hover:text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onFocus={() => {
                if (!user) requireAuth('join the discussion and post a comment');
              }}
              placeholder={
                user
                  ? 'Write a helpful answer, explanation, or follow-up question...'
                  : 'Sign in to post a comment or answer...'
              }
              rows={3}
              className="w-full max-w-full rounded-xl bg-white/[0.04] border border-white/10 p-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D71921]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-white/65 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonComment}
                  onChange={(e) => setIsAnonComment(e.target.checked)}
                  className="accent-[#D71921]"
                />
                <span>Comment anonymously</span>
              </label>

              <button
                type="submit"
                disabled={submittingComment}
                className="btn-primary px-5 py-2 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{user ? 'Post Comment' : 'Sign in to Comment'}</span>
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-6">
              No comments yet. Be the first to contribute to this discussion.
            </p>
          ) : (
            <div className="space-y-3 w-full max-w-full min-w-0">
              {comments.map((c) => {
                const cAuthor = c.isAnonymous
                  ? (c as any).anonymousAlias || 'Anonymous Student'
                  : sanitizeStudentDisplayName(c.authorName, c.authorUid);
                const isHighlighted = highlightedCommentId === c.id;
                const isCommentCopied = copiedCommentId === c.id;
                const commentTime = c.createdAt
                  ? new Date(
                      typeof c.createdAt === 'string'
                        ? c.createdAt
                        : c.createdAt?.toDate
                        ? c.createdAt.toDate()
                        : Date.now()
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recently';

                return (
                  <div
                    key={c.id}
                    id={`comment-${c.id}`}
                    className={`boardly-post-card glass-card p-4 w-full max-w-full min-w-0 box-border overflow-x-hidden transition-all scroll-mt-28 ${
                      isHighlighted
                        ? 'border-[#D71921] ring-2 ring-[#D71921]/40 bg-[#D71921]/[0.08]'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {!c.isAnonymous && c.authorUid ? (
                          <Link
                            to={`/u/${encodeURIComponent(c.authorUid)}`}
                            className="text-xs font-bold text-white hover:text-[#D71921] transition-colors truncate"
                          >
                            {cAuthor}
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-white truncate">{cAuthor}</span>
                        )}
                        <span className="text-white/35">·</span>
                        <a
                          href={`${canonicalPath}#comment-${c.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleCopyCommentLink(c.id);
                          }}
                          className="text-[11px] text-white/50 hover:text-white hover:underline"
                          title="Permalink to this comment"
                        >
                          {commentTime}
                        </a>
                        {isHighlighted && (
                          <span className="px-2 py-0.5 rounded-full bg-[#D71921]/20 border border-[#D71921]/40 text-[10px] font-semibold text-[#FCA5A5]">
                            Linked Comment
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReplyToComment(c.id, cAuthor)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Reply to this comment"
                        >
                          <Reply size={12} />
                          <span>Reply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCommentLink(c.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Copy permalink to this comment"
                        >
                          {isCommentCopied ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Link Copied</span>
                            </>
                          ) : (
                            <>
                              <Link2 size={12} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="boardly-post-content text-xs sm:text-sm text-white/80 whitespace-pre-wrap leading-relaxed min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                      <MathText text={maskPublicUserText((c as any).body || c.text)} block />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="glass-panel p-5 sm:p-8 w-full max-w-full min-w-0 box-border overflow-x-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-dot text-xl font-bold text-white">
                Related Posts in {resolvedPractice.subjectSlug ? resolvedPractice.label : post.subject || 'Boardly Commons'}
              </h2>
              <Link
                to={commonsSubjectHref}
                className="text-xs text-[#D71921] hover:underline font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/commons/post/${buildEntitySlug(rp.id, rp.title)}`}
                  className="boardly-post-card glass-card-interactive p-4 block min-w-0 max-w-full box-border overflow-x-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#D71921] font-semibold uppercase">
                      {rp.subject || 'Commons'}
                    </span>
                    <span className="text-[11px] text-white/45">
                      👍 {rp.upvotes || 0} · 💬 {rp.commentCount || 0}
                    </span>
                  </div>
                  <h3 className="boardly-post-title text-sm font-bold text-white mt-1 line-clamp-2 [overflow-wrap:anywhere] [word-break:break-word]">
                    <MathText text={rp.title} />
                  </h3>
                  <div className="boardly-post-content text-xs text-white/60 mt-1 line-clamp-2 [overflow-wrap:anywhere] [word-break:break-word]">
                    <MathText text={maskPublicUserText(rp.description)} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <CommonsImageViewerModal
        isOpen={Boolean(viewerImage)}
        imageUrl={viewerImage?.url || null}
        imageAlt={viewerImage?.name || post.title}
        onClose={() => setViewerImage(null)}
      />

      <CommonsReportModal
        post={post}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterUid={user?.uid || null}
      />
    </div>
  );
};

export default PublicPostDetailPage;
