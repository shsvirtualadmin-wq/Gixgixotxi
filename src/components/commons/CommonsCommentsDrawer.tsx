import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, EyeOff, Shield } from 'lucide-react';
import type { CommonsPost, CommonsComment } from '@/types/commons';
import { addPostComment, fetchPostComments } from '@/services/commonsService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { RoleBadge } from '@/components/ui/RoleBadge';

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
  const [comments, setComments] = useState<CommonsComment[]>([]);
  const [newText, setNewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post && isOpen) {
      setLoading(true);
      setError(null);
      fetchPostComments(post.id)
        .then(setComments)
        .catch((err) => setError('Failed to load comments.'))
        .finally(() => setLoading(false));
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to comment.');
      return;
    }
    if (!newText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const added = await addPostComment({
        postId: post.id,
        author: currentUser,
        text: newText,
        isAnonymous,
      });
      setComments((prev) => [...prev, added]);
      setNewText('');
      setIsAnonymous(false);
    } catch (err: any) {
      console.error(
        '[CommonsCommentsDrawer] handleSend error:',
        err?.code || 'ERROR',
        `commonsPosts/${post.id}/comments`,
        err
      );
      setError(err?.message || 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-[#0c0c0e] border-l border-neutral-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/40">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 font-mono">
              COMMENTS ({comments.length})
            </h3>
            <p className="text-xs text-neutral-400 truncate max-w-[280px]">
              {post.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-mono">
              Loading peer discussion...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No comments yet. Be the first to share an insight or question!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {comment.isAnonymous ? (
                      <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-mono text-neutral-400 shrink-0 select-none">
                        ?
                      </div>
                    ) : (
                      <BoardlyAvatar
                        equippedAvatar={(comment as any).authorEquippedAvatar || (comment.authorAvatar?.startsWith('pfp_') ? comment.authorAvatar : undefined)}
                        avatarUrl={comment.authorAvatar && !comment.authorAvatar.startsWith('pfp_') && !comment.authorAvatar.includes('googleusercontent') ? comment.authorAvatar : undefined}
                        photoURL={comment.authorAvatar?.includes('googleusercontent') ? comment.authorAvatar : (comment as any).authorPhotoURL}
                        frame={(comment as any).authorFrame}
                        name={sanitizeStudentDisplayName(comment.authorName, comment.authorUid)}
                        size={24}
                      />
                    )}
                    {comment.isAnonymous ? (
                      <span className="font-semibold text-neutral-400">Anonymous</span>
                    ) : (
                      <>
                        <span className="font-semibold text-neutral-200">
                          {sanitizeStudentDisplayName(comment.authorName, comment.authorUid)}
                        </span>
                        <RoleBadge
                          role={(comment as any).authorRole || 'Student'}
                          customRole={(comment as any).authorCustomRole}
                          isSuperAdmin={
                            (comment as any).authorRole === 'superadmin' ||
                            (comment as any).authorRole === 'admin' ||
                            comment.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
                          }
                          size="sm"
                        />
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatCommentTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-900/60 space-y-2">
          {error && (
            <div className="text-[11px] text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-200">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <EyeOff size={12} /> Comment anonymously
              </span>
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={currentUser ? 'Write a respectful comment...' : 'Sign in to comment'}
              disabled={!currentUser || submitting}
              className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-red-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!currentUser || submitting || !newText.trim()}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
