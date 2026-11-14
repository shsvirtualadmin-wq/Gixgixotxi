import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { Shield, AlertTriangle, Eye, EyeOff, Trash2, Ban, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { normalizeCloudflarePost } from '@/services/commonsService';
import type { CommonsPost, CommonsReport } from '@/types/commons';
import { LineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import { RequestAccessSheet } from '@/components/admin/RequestAccessSheet';
import type { AdminPermissionKey } from '@/constants/permissions';

export function AdminCommonsPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canBanAuthor = hasPermission('users.suspend');
  const [flaggedPosts, setFlaggedPosts] = useState<CommonsPost[]>([]);
  const [, setReports] = useState<CommonsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [accessRequestTarget, setAccessRequestTarget] = useState<{
    permission: AdminPermissionKey;
    targetId?: string;
    targetLabel?: string;
  } | null>(null);

  const getAdminHeaders = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken(false);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadModerationQueue = useCallback(async () => {
    setLoading(true);
    setActionNotice(null);
    try {
      const headers = await getAdminHeaders();
      const resp = await fetch('/api/posts/moderation/queue', { headers });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Could not load moderation queue.');
      }

      const posts: CommonsPost[] = Array.isArray(data.flaggedPosts)
        ? data.flaggedPosts.map((p: any) => normalizeCloudflarePost(p))
        : [];
      const reps: CommonsReport[] = Array.isArray(data.reports) ? data.reports : [];

      setFlaggedPosts(posts);
      setReports(reps);
    } catch (err: any) {
      console.error('[AdminCommonsPage] load error:', err);
      setActionNotice('Notice: Error loading moderation queue.');
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    void loadModerationQueue();
  }, [loadModerationQueue]);

  const handleToggleHide = async (post: CommonsPost) => {
    try {
      const nextHide = !post.isHidden;
      const headers = await getAdminHeaders();
      const resp = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isHidden: nextHide }),
      });
      if (!resp.ok) {
        throw new Error('Failed to update post visibility');
      }
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
      const headers = await getAdminHeaders();
      const resp = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!resp.ok) {
        throw new Error('Delete request failed');
      }
      setFlaggedPosts((prev) => prev.filter((p) => p.id !== post.id));
      setActionNotice('Post permanently deleted from Cloudflare D1.');
    } catch (err: any) {
      setActionNotice(`Delete failed: ${err.message}`);
    }
  };

  const handleBanAuthor = async (post: CommonsPost) => {
    if (!hasPermission('users.suspend', post.id)) {
      setAccessRequestTarget({
        permission: 'users.suspend',
        targetId: post.id,
        targetLabel: `Author of "${post.title}"`,
      });
      return;
    }
    try {
      const authorUid = (post as any).realAuthorUid || post.authorUid;
      if (!window.confirm(`Ban author of "${post.title}" from publishing in Boardly Commons?`)) {
        return;
      }

      const headers = await getAdminHeaders();
      const resp = await fetch('/api/posts/moderation/ban', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          postId: post.id,
          targetUid: authorUid,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Could not ban author');
      }

      setActionNotice(`Author of "${post.title}" has been banned from posting.`);
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
            <span>{isSuperAdmin ? 'Superadmin Moderation Queue' : 'Admin Moderation Queue'}</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
            COMMONS MODERATION
          </h1>
          <p className="text-xs text-neutral-400">
            Review reported study posts, manage auto-hidden content, and delete inappropriate posts.
          </p>
        </div>

        <button
          onClick={loadModerationQueue}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          <RefreshCw size={14} />
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
          <div className="p-6 rounded-2xl border border-neutral-800 bg-[#0c0c0e]">
            <LineLoader context="admin" message="Loading flagged posts..." />
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
                      title={
                        canBanAuthor || hasPermission('users.suspend', post.id)
                          ? 'Ban author from posting'
                          : 'Requires Super Admin approval (users.suspend)'
                      }
                    >
                      {canBanAuthor || hasPermission('users.suspend', post.id) ? (
                        <Ban size={14} />
                      ) : (
                        <Lock size={13} />
                      )}
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

      {accessRequestTarget && (
        <RequestAccessSheet
          open={Boolean(accessRequestTarget)}
          onClose={() => setAccessRequestTarget(null)}
          permission={accessRequestTarget.permission}
          targetId={accessRequestTarget.targetId}
          targetLabel={accessRequestTarget.targetLabel}
        />
      )}
    </div>
  );
}
