import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, AlertTriangle, Eye, EyeOff, Trash2, Ban, CheckCircle2, RefreshCw } from 'lucide-react';
import type { CommonsPost, CommonsReport, CommonsPrivatePost } from '@/types/commons';

export function AdminCommonsPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<CommonsPost[]>([]);
  const [reports, setReports] = useState<CommonsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadModerationQueue = async () => {
    setLoading(true);
    setActionNotice(null);
    try {
      // 1. Fetch posts with reportCount >= 1 or isHidden == true
      const qPosts = query(
        collection(db, 'commonsPosts'),
        where('reportCount', '>=', 1),
        limit(50)
      );
      const postSnap = await getDocs(qPosts);
      const posts: CommonsPost[] = postSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CommonsPost, 'id'>),
      }));

      // 2. Fetch pending reports
      const qReports = query(
        collection(db, 'commonsReports'),
        where('status', '==', 'pending'),
        limit(50)
      );
      const repSnap = await getDocs(qReports);
      const reps: CommonsReport[] = repSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CommonsReport, 'id'>),
      }));

      setFlaggedPosts(posts);
      setReports(reps);
    } catch (err: any) {
      console.error('[AdminCommonsPage] load error:', err);
      setActionNotice('Notice: Error loading moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationQueue();
  }, []);

  const handleToggleHide = async (post: CommonsPost) => {
    try {
      const nextHide = !post.isHidden;
      await updateDoc(doc(db, 'commonsPosts', post.id), {
        isHidden: nextHide,
      });
      setFlaggedPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isHidden: nextHide } : p))
      );
      setActionNotice(`Post ${nextHide ? 'hidden from public feed' : 'unhidden successfully'}.`);
    } catch (err: any) {
      setActionNotice(`Failed to toggle hide: ${err.message}`);
    }
  };

  const handleDeletePost = async (post: CommonsPost) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${post.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'commonsPosts', post.id));
      await deleteDoc(doc(db, 'postPrivate', post.id)).catch(() => {});
      setFlaggedPosts((prev) => prev.filter((p) => p.id !== post.id));
      setActionNotice('Post and private audit doc permanently deleted.');
    } catch (err: any) {
      setActionNotice(`Delete failed: ${err.message}`);
    }
  };

  const handleBanAuthor = async (post: CommonsPost) => {
    try {
      // Look up private author UID
      let authorUid = post.authorUid;
      if (!authorUid) {
        const privSnap = await getDoc(doc(db, 'postPrivate', post.id));
        authorUid = privSnap.data()?.authorUid;
      }
      if (!authorUid) {
        setActionNotice('Author UID could not be determined.');
        return;
      }

      if (!window.confirm(`Ban user ${authorUid} from publishing in Boardly Commons?`)) return;

      await updateDoc(doc(db, 'users', authorUid), {
        isPostingBanned: true,
        postingBannedAt: new Date().toISOString(),
      });
      setActionNotice(`User ${authorUid} has been banned from posting.`);
    } catch (err: any) {
      setActionNotice(`Ban failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase">
            <Shield size={16} />
            <span>Superadmin Moderation Queue</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
            COMMONS MODERATION
          </h1>
          <p className="text-xs text-neutral-400">
            Review reported study posts, manage auto-hidden content, and enforce posting bans.
          </p>
        </div>

        <button
          onClick={loadModerationQueue}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200">
          {actionNotice}
        </div>
      )}

      {/* Flagged Items */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-200 font-mono flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <span>FLAGGED POSTS ({flaggedPosts.length})</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500 font-mono">
            Loading flagged posts...
          </div>
        ) : flaggedPosts.length === 0 ? (
          <div className="p-8 rounded-2xl border border-neutral-800 bg-[#0c0c0e] text-center space-y-2">
            <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
            <p className="text-xs font-semibold text-neutral-200">Moderation Queue Clear</p>
            <p className="text-[11px] text-neutral-500">
              No flagged or reported posts requiring action at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-neutral-800 bg-[#0c0c0e] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-neutral-100">{post.title}</span>
                      {post.isHidden && (
                        <span className="text-[10px] font-mono bg-red-950/60 border border-red-800 text-red-400 px-1.5 py-0.5 rounded">
                          HIDDEN
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-amber-950/40 border border-amber-800 text-amber-400 px-1.5 py-0.5 rounded">
                        {post.reportCount} Reports
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-2 font-mono">
                      <span>Subject: {post.subject}</span>
                      <span>·</span>
                      <span>Category: {post.target}</span>
                      <span>·</span>
                      <span>Author: {post.authorName} ({post.isAnonymous ? 'Anonymous' : 'Public'})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleHide(post)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors flex items-center gap-1"
                      title={post.isHidden ? 'Unhide post' : 'Hide post'}
                    >
                      {post.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{post.isHidden ? 'Unhide' : 'Hide'}</span>
                    </button>
                    <button
                      onClick={() => handleBanAuthor(post)}
                      className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-950 text-amber-400 border border-amber-800/60 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Ban author from posting"
                    >
                      <Ban size={14} />
                      <span>Ban</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-800/60 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Permanently delete post"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
