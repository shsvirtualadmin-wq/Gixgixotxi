import { useState, useEffect, useRef } from 'react';
import { X, Send, AlertCircle, EyeOff, ThumbsUp, MessageSquare, Reply } from 'lucide-react';
import type { CommonsPost, CommonsComment } from '@/types/commons';
import { addPostComment, fetchPostComments } from '@/services/commonsService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { MathText } from '@/components/ui/MathText';
import { sanitizeStudentDisplayName, maskPublicUserText } from '@/utils/privacy';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { getPublicProfiles } from '@/services/publicProfileService';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';

interface CommonsCommentsDrawerProps {
  post: CommonsPost | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    uid: string;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function CommonsCommentsDrawer({
  post,
  isOpen,
  onClose,
  currentUser,
}: CommonsCommentsDrawerProps) {
  const { requireAuth } = useAuthGate();
  const { openProfile } = useProfileModal();
  const [comments, setComments] = useState<CommonsComment[]>([]);
  const [newText, setNewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (post && isOpen) {
      let active = true;
      setLoading(true);
      setError(null);
      fetchPostComments(post.id)
        .then(async (list) => {
          if (!active) return;
          setComments(list);
          const uids = Array.from(
            new Set(
              list
                .filter((c) => !c.isAnonymous && c.authorUid)
                .map((c) => c.authorUid as string)
            )
          );
          if (uids.length > 0) {
            const profMap = await getPublicProfiles(uids).catch(() => new Map());
            if (!active || profMap.size === 0) return;
            setComments((prev) =>
              prev.map((c) => {
                if (c.isAnonymous || !c.authorUid) return c;
                const p = profMap.get(c.authorUid);
                if (!p) return c;
                return {
                  ...c,
                  authorName: p.displayName || c.authorName,
                  authorEquippedAvatar:
                    p.equippedAvatar || p.avatar || (c as any).authorEquippedAvatar || undefined,
                  authorAvatar:
                    p.equippedAvatar || p.avatar || c.authorAvatar || undefined,
                  authorPhotoURL: null,
                  authorFrame: p.equippedFrame || p.frame || (c as any).authorFrame,
                  authorRole: p.role || (c as any).authorRole,
                  authorCustomRole: p.customRole || (c as any).authorCustomRole,
                } as CommonsComment;
              })
            );
          }
        })
        .catch(() => {
          if (active) setError('Failed to load comments.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      requireAuth('comment on this post in Boardly Commons');
      return;
    }
    if (!newText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const added = await addPostComment({
        postId: post.id,
        author: currentUser,
        text: newText.trim(),
        isAnonymous,
      });
      setComments((prev) => [...prev, added]);
      setNewText('');
      setIsAnonymous(false);
    } catch (err: any) {
      setError(err?.message || 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCommentLike = (commentId: string) => {
    if (!currentUser) {
      requireAuth('like this comment in Boardly Commons');
      return;
    }
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReplyTo = (authorName: string) => {
    if (!currentUser) {
      requireAuth(`reply to ${authorName} in Boardly Commons`);
      return;
    }
    setNewText(`@${authorName} `);
    inputRef.current?.focus();
  };

  const formatCommentTime = (ts: any) => {
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
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center overlay-blur bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg glass-panel rounded-t-[28px] sm:rounded-[28px] flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
      >
        {/* Mobile drag bar */}
        <div className="w-10 h-1 bg-[var(--glass-border-hover)] rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--glass-border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-primary font-dot">
              Comments ({comments.length})
            </h3>
            <p className="text-xs text-muted truncate max-w-[260px] sm:max-w-md mt-0.5">
              {post.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading ? (
            <div className="py-6">
              <LineLoader
                variant="section"
                context="generic"
                message="Loading comments..."
              />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No comments yet. Share your thoughts or ask a question!
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = likedCommentIds.has(comment.id);
              const authorIsSuperAdmin =
                (comment as any).authorRole === 'superadmin' ||
                (comment as any).authorRole === 'admin' ||
                comment.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

              return (
                <div key={comment.id} className="flex gap-2.5 items-start text-xs group">
                  {/* Avatar */}
                  {comment.isAnonymous ? (
                    <div className="w-8 h-8 rounded-full bg-surface-muted border border-border flex items-center justify-center text-muted shrink-0 select-none">
                      <EyeOff size={14} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (comment.authorUid) {
                          onClose();
                          openProfile(comment.authorUid);
                        }
                      }}
                      className="shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      title="View profile"
                    >
                      <BoardlyAvatar
                        uid={comment.authorUid}
                        equippedAvatar={
                          (comment as any).authorEquippedAvatar || comment.authorAvatar || undefined
                        }
                        frame={(comment as any).authorFrame}
                        name={sanitizeStudentDisplayName(
                          comment.authorName,
                          comment.authorUid
                        )}
                        size={32}
                      />
                    </button>
                  )}

                  {/* Bubble & actions */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-surface-muted rounded-2xl px-3.5 py-2.5 border border-border inline-block max-w-full min-w-0 overflow-x-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1 min-w-0">
                        {comment.isAnonymous ? (
                          <span className="font-bold text-muted">Anonymous</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (comment.authorUid) {
                                  onClose();
                                  openProfile(comment.authorUid);
                                }
                              }}
                              className="font-bold text-primary hover:underline truncate max-w-full cursor-pointer text-left"
                            >
                              {sanitizeStudentDisplayName(
                                comment.authorName,
                                comment.authorUid
                              )}
                            </button>
                            <RoleBadge
                              role={(comment as any).authorRole || 'Student'}
                              customRole={(comment as any).authorCustomRole}
                              isSuperAdmin={authorIsSuperAdmin}
                              size="sm"
                            />
                          </>
                        )}
                      </div>
                      <div className="boardly-post-content text-[13px] text-secondary leading-relaxed whitespace-pre-wrap min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                        <MathText text={maskPublicUserText(comment.text || (comment as any).body)} block />
                      </div>
                    </div>

                    {/* Like / Reply under each comment */}
                    <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-muted font-medium">
                      <span>{formatCommentTime(comment.createdAt)}</span>

                      <button
                        type="button"
                        onClick={() => toggleCommentLike(comment.id)}
                        className={`hover:underline cursor-pointer flex items-center gap-1 ${
                          isLiked ? 'text-accent font-bold' : 'hover:text-primary'
                        }`}
                      >
                        <ThumbsUp size={11} className={isLiked ? 'fill-current' : ''} />
                        <span>{isLiked ? 'Liked' : 'Like'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleReplyTo(
                            comment.isAnonymous
                              ? 'Anonymous'
                              : sanitizeStudentDisplayName(
                                  comment.authorName,
                                  comment.authorUid
                                )
                          )
                        }
                        className="hover:underline hover:text-primary cursor-pointer flex items-center gap-1"
                      >
                        <Reply size={11} />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input box pinned at bottom */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-border bg-surface-raised space-y-2 shrink-0"
        >
          {error && (
            <div className="text-[11px] text-tag-danger-text bg-tag-danger-bg px-2.5 py-1.5 rounded-lg border border-tag-danger-text/20 flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0 text-accent" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted px-1">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border bg-surface text-accent focus:ring-accent cursor-pointer accent-red-600"
              />
              <span className="flex items-center gap-1">
                <EyeOff size={13} /> Comment anonymously
              </span>
            </label>
          </div>

          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={
                currentUser
                  ? 'Write a helpful comment...'
                  : 'Sign in to join the discussion'
              }
              disabled={!currentUser || submitting}
              className="flex-1 px-3.5 py-2.5 text-sm sm:text-xs bg-surface border border-border rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!currentUser || submitting || !newText.trim()}
              className={`relative overflow-hidden px-4 py-2.5 bg-accent hover:opacity-90 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed text-on-accent rounded-xl transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center justify-center min-h-[44px] text-xs font-semibold ${
                submitting ? 'min-w-[100px]' : 'min-w-[44px]'
              }`}
            >
              {submitting ? (
                <>
                  <span>Posting...</span>
                  <ButtonLineLoader />
                </>
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
