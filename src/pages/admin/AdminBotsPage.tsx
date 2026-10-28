import { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Play,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Power,
  MessageSquare,
  ThumbsUp,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';

interface BotAccountItem {
  uid: string;
  username: string;
  displayName: string;
  subject: string;
  avatar: string;
  bio: string;
  enabled: boolean;
  dailyPostLimit: number;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
  lastRunAt: string | null;
  lastRunStatus: string;
  role: string;
}

interface BotRunResultItem {
  botUid: string;
  displayName: string;
  subject: string;
  postsCreated: number;
  commentsCreated: number;
  likesAdded: number;
  status: string;
  error?: string;
}

export function AdminBotsPage() {
  const [bots, setBots] = useState<BotAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [runningBotUid, setRunningBotUid] = useState<string | null>(null);
  const [togglingBotUid, setTogglingBotUid] = useState<string | null>(null);
  const [deletingContent, setDeletingContent] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [botRunSecretConfigured, setBotRunSecretConfigured] = useState<boolean | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRunResults, setLastRunResults] = useState<BotRunResultItem[]>([]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken(false);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadBots = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/bots', {
        headers,
        cache: 'no-store',
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !Array.isArray(data?.bots)) {
        throw new Error(data?.error || 'Could not load bot accounts.');
      }
      setBots(data.bots);
      if (typeof data.geminiConfigured === 'boolean') {
        setGeminiConfigured(data.geminiConfigured);
      }
      if (typeof data.botRunSecretConfigured === 'boolean') {
        setBotRunSecretConfigured(data.botRunSecretConfigured);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bot accounts.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBots();
  }, [loadBots]);

  const handleToggleBot = async (bot: BotAccountItem) => {
    setTogglingBotUid(bot.uid);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`/api/bots/${encodeURIComponent(bot.uid)}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: !bot.enabled }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update bot status.');
      }
      setBots((prev) =>
        prev.map((item) =>
          item.uid === bot.uid ? { ...item, enabled: Boolean(data.enabled) } : item
        )
      );
      setSuccessMsg(
        `${bot.displayName} (${bot.subject}) is now ${data.enabled ? 'Enabled' : 'Disabled'}.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not toggle bot.');
    } finally {
      setTogglingBotUid(null);
    }
  };

  const handleTriggerRun = async (botUid?: string) => {
    if (botUid) {
      setRunningBotUid(botUid);
    } else {
      setRunningAll(true);
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/bots/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          botUid: botUid || undefined,
          maxBots: botUid ? 1 : 2,
          postsPerBot: 1,
          force: true,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Bot run failed.');
      }
      const results: BotRunResultItem[] = Array.isArray(data.results) ? data.results : [];
      setLastRunResults(results);
      const totalCreated = results.reduce((sum, r) => sum + Number(r.postsCreated || 0), 0);
      const totalComments = results.reduce((sum, r) => sum + Number(r.commentsCreated || 0), 0);
      const totalLikes = results.reduce((sum, r) => sum + Number(r.likesAdded || 0), 0);
      setSuccessMsg(
        `Bot run finished: ${totalCreated} post(s), ${totalComments} comment(s), and ${totalLikes} like(s) published with verified KaTeX.`
      );
      await loadBots();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Manual bot run failed.');
    } finally {
      setRunningAll(false);
      setRunningBotUid(null);
    }
  };

  const handleDeleteAllBotContent = async (botUid?: string) => {
    const label = botUid
      ? `all posts, comments, and likes created by ${botUid}`
      : 'ALL posts, comments, and likes created by all 12 bots';
    if (!window.confirm(`Are you sure you want to permanently delete ${label}?`)) {
      return;
    }

    setDeletingContent(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/bots/delete-content', {
        method: 'POST',
        headers,
        body: JSON.stringify({ botUid: botUid || undefined }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Could not delete bot content.');
      }
      setSuccessMsg(
        `Deleted ${data.deletedPosts || 0} bot post(s), ${data.deletedComments || 0} comment(s), and ${data.deletedLikes || 0} like(s).`
      );
      setLastRunResults([]);
      await loadBots();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete bot content.');
    } finally {
      setDeletingContent(false);
    }
  };

  const enabledCount = bots.filter((b) => b.enabled).length;
  const totalPosts = bots.reduce((sum, b) => sum + Number(b.postsCount || 0), 0);
  const totalComments = bots.reduce((sum, b) => sum + Number(b.commentsCount || 0), 0);
  const totalLikes = bots.reduce((sum, b) => sum + Number(b.likesCount || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              AUTOMATED STUDY BOTS (CRON + GEMINI + KATEX VERIFIED)
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Commons Study Bots ({bots.length})
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            12 subject-focused bot accounts that publish KaTeX-validated study notes, solved examples, and helpful comments daily. Excluded from student leaderboards and user statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleTriggerRun()}
            disabled={runningAll || Boolean(runningBotUid)}
            className="btn-red text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {runningAll ? (
              <>
                <RotateCcw size={14} className="animate-spin" />
                <span>Running Bots...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Trigger Manual Run</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDeleteAllBotContent()}
            disabled={deletingContent}
            className="px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {deletingContent ? (
              <>
                <RotateCcw size={14} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete All Bot Content</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={loadBots}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Active Bots</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">
            {enabledCount} / {bots.length || 12}
          </div>
          <div className="text-[11px] text-sky-400 mt-1">role = &apos;bot&apos; in D1</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Bot Study Posts</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">{totalPosts}</div>
          <div className="text-[11px] text-emerald-400 mt-1">KaTeX &amp; self-check verified</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Bot Comments &amp; Likes</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">
            {totalComments} / {totalLikes}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">On community &amp; student posts</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Worker Secrets Status</div>
          <div className="flex flex-col gap-1 mt-1.5 text-xs">
            <span className={geminiConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              GEMINI_API_KEY: {geminiConfigured ? 'Configured' : 'Set in Cloudflare Secrets'}
            </span>
            <span
              className={botRunSecretConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400'}
            >
              BOT_RUN_SECRET: {botRunSecretConfigured ? 'Configured' : 'Set in Cloudflare Secrets'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Feedback Banners ── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Last Manual Run Report ── */}
      {lastRunResults.length > 0 && (
        <Card className="p-5 bg-[var(--card)] border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Latest Run Execution Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {lastRunResults.map((r) => (
              <div
                key={r.botUid}
                className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[var(--text)]">
                    {r.displayName} ({r.subject})
                  </div>
                  <div className="text-[var(--muted)] mt-0.5">
                    +{r.postsCreated} post, +{r.commentsCreated} comment, +{r.likesAdded} like
                    {r.error ? ` · ${r.error}` : ''}
                  </div>
                </div>
                <Badge color={r.postsCreated > 0 ? 'green' : 'amber'}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Bot Accounts List ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height={150} count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const isRunningThis = runningBotUid === bot.uid;
            const isTogglingThis = togglingBotUid === bot.uid;
            const lastRunLabel = bot.lastRunAt
              ? new Date(bot.lastRunAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never run';

            return (
              <Card
                key={bot.uid}
                className={`p-5 bg-[var(--card)] border transition-all flex flex-col justify-between gap-4 ${
                  bot.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-65'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <BoardlyAvatar
                      equippedAvatar={bot.avatar}
                      name={bot.displayName}
                      size={44}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="font-bold text-sm text-[var(--text)] truncate"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {bot.displayName}
                        </h3>
                        <RoleBadge role="bot" customRole={`${bot.subject} Bot`} size="sm" />
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        @{bot.username} · <strong className="text-[var(--text)]">{bot.subject}</strong> · Max{' '}
                        {bot.dailyPostLimit}/day
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBot(bot)}
                    disabled={isTogglingThis}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 ${
                      bot.enabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Power size={12} />
                    <span>{bot.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">{bot.bio}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text)]">
                    <FileText size={13} className="text-sky-400" />
                    <span>{bot.postsCount} posts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text)]">
                    <MessageSquare size={13} className="text-emerald-400" />
                    <span>{bot.commentsCount} comments</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text)]">
                    <ThumbsUp size={13} className="text-amber-400" />
                    <span>{bot.likesCount} likes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--muted)]">
                  <div className="min-w-0 truncate flex items-center gap-1.5" title={bot.lastRunStatus}>
                    <Clock size={12} className="shrink-0" />
                    <span className="truncate">
                      {lastRunLabel} · {bot.lastRunStatus || 'Ready'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTriggerRun(bot.uid)}
                      disabled={isRunningThis || runningAll || !bot.enabled}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {isRunningThis ? (
                        <RotateCcw size={11} className="animate-spin" />
                      ) : (
                        <Play size={11} />
                      )}
                      <span>Run Now</span>
                    </button>

                    {(bot.postsCount > 0 || bot.commentsCount > 0 || bot.likesCount > 0) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAllBotContent(bot.uid)}
                        disabled={deletingContent}
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                        title={`Delete ${bot.displayName}'s content`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminBotsPage;
