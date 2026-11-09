import { useState, useEffect, useCallback } from 'react';
import {
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
  KeyRound,
  Activity,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
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
  assignedKeyIndex?: number;
  assignedKeyLabel?: string;
  role: string;
}

interface PublicKeyStatusItem {
  keyIndex: number;
  label: string;
  status: 'available' | 'cooling_down' | 'daily_quota_hit';
  statusText: string;
  cooldownUntil: string | null;
  callsToday: number;
  assignedBots: number[];
  lastError: string | null;
}

interface BotRunResultItem {
  uid?: string;
  botUid: string;
  displayName: string;
  subject: string;
  postsCreated: number;
  commentsCreated: number;
  likesAdded: number;
  likesCreated?: number;
  geminiCallsUsed?: number;
  assignedKeyIndex?: number;
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
  const [geminiKeysCount, setGeminiKeysCount] = useState<number>(0);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [geminiFallbackModel, setGeminiFallbackModel] = useState<string>('gemini-2.5-flash-lite');
  const [botRunSecretConfigured, setBotRunSecretConfigured] = useState<boolean | null>(null);
  const [keyStatuses, setKeyStatuses] = useState<PublicKeyStatusItem[]>([]);
  const [allKeysExhaustedUntil, setAllKeysExhaustedUntil] = useState<string | null>(null);
  const [geminiCallsLastRun, setGeminiCallsLastRun] = useState<number>(0);
  const [geminiCallsToday, setGeminiCallsToday] = useState<number>(0);
  const [lastRunRanAt, setLastRunRanAt] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRunResults, setLastRunResults] = useState<BotRunResultItem[]>([]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken(false);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const applyRunSummaryToBanner = useCallback((summary: any, isFreshTrigger: boolean) => {
    if (!summary || typeof summary !== 'object') return;

    const rawResults: any[] = Array.isArray(summary.results) ? summary.results : [];
    const normalizedResults: BotRunResultItem[] = rawResults.map((r) => ({
      uid: r.uid || r.botUid,
      botUid: r.botUid || r.uid,
      displayName: r.displayName || r.uid || 'Bot',
      subject: r.subject || 'General',
      postsCreated: Number(r.postsCreated || 0),
      commentsCreated: Number(r.commentsCreated || 0),
      likesAdded: Number(r.likesAdded ?? r.likesCreated ?? 0),
      likesCreated: Number(r.likesCreated ?? r.likesAdded ?? 0),
      geminiCallsUsed: Number(r.geminiCallsUsed || 0),
      assignedKeyIndex: typeof r.assignedKeyIndex === 'number' ? r.assignedKeyIndex : undefined,
      status: String(r.status || 'completed'),
      error: r.error ? String(r.error) : undefined,
    }));

    if (normalizedResults.length > 0 || isFreshTrigger) {
      setLastRunResults(normalizedResults);
    }
    if (summary.ranAt) {
      setLastRunRanAt(String(summary.ranAt));
    }
    if (typeof summary.geminiCallsLastRun === 'number') {
      setGeminiCallsLastRun(summary.geminiCallsLastRun);
    }
    if (typeof summary.geminiCallsToday === 'number') {
      setGeminiCallsToday(summary.geminiCallsToday);
    }
    if (Array.isArray(summary.keyStatuses)) {
      setKeyStatuses(summary.keyStatuses);
    }
    if (summary.allKeysExhaustedUntil !== undefined) {
      setAllKeysExhaustedUntil(summary.allKeysExhaustedUntil || null);
    }

    const totalCreated = normalizedResults.reduce((sum, r) => sum + r.postsCreated, 0);
    const totalComments = normalizedResults.reduce((sum, r) => sum + r.commentsCreated, 0);
    const totalLikes = normalizedResults.reduce((sum, r) => sum + r.likesAdded, 0);
    const anyErrors = normalizedResults.some((r) => Boolean(r.error));

    // Step 6: Never show green "Bot run finished" banner when 0 posts were published because of errors
    if (
      summary.bannerStatus === 'error' ||
      summary.runOutcome === 'quota_exhausted' ||
      summary.runOutcome === 'error' ||
      (totalCreated === 0 && anyErrors)
    ) {
      const firstErr =
        summary.bannerMessage ||
        normalizedResults.find((r) => r.error)?.error ||
        'Gemini quota exhausted or generation error (0 posts published).';
      setSuccessMsg(null);
      setWarningMsg(null);
      setErrorMsg(firstErr);
    } else if (
      summary.bannerStatus === 'warning' ||
      summary.runOutcome === 'partial' ||
      summary.runOutcome === 'daily_limit'
    ) {
      setSuccessMsg(null);
      setErrorMsg(null);
      setWarningMsg(
        summary.bannerMessage ||
          `Run completed with warnings: ${totalCreated} post(s), ${totalComments} comment(s), ${totalLikes} like(s).`
      );
    } else if (isFreshTrigger) {
      setErrorMsg(null);
      setWarningMsg(null);
      setSuccessMsg(
        summary.bannerMessage ||
          `Bot run finished: ${totalCreated} post(s), ${totalComments} comment(s), and ${totalLikes} like(s) published with verified KaTeX.`
      );
    }
  }, []);

  const loadBots = useCallback(
    async (preserveBanner = false) => {
      setLoading(true);
      if (!preserveBanner) {
        setErrorMsg(null);
      }
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
        if (typeof data.geminiKeysCount === 'number') {
          setGeminiKeysCount(data.geminiKeysCount);
        }
        if (data.geminiModel) {
          setGeminiModel(String(data.geminiModel));
        }
        if (data.geminiFallbackModel) {
          setGeminiFallbackModel(String(data.geminiFallbackModel));
        }
        if (typeof data.botRunSecretConfigured === 'boolean') {
          setBotRunSecretConfigured(data.botRunSecretConfigured);
        }
        if (Array.isArray(data.keyStatuses)) {
          setKeyStatuses(data.keyStatuses);
        }
        if (data.allKeysExhaustedUntil !== undefined) {
          setAllKeysExhaustedUntil(data.allKeysExhaustedUntil || null);
        }
        if (typeof data.geminiCallsLastRun === 'number') {
          setGeminiCallsLastRun(data.geminiCallsLastRun);
        }
        if (typeof data.geminiCallsToday === 'number') {
          setGeminiCallsToday(data.geminiCallsToday);
        }
        if (data.lastRunSummary && !preserveBanner) {
          applyRunSummaryToBanner(data.lastRunSummary, false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load bot accounts.';
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    },
    [applyRunSummaryToBanner]
  );

  useEffect(() => {
    void loadBots(false);
  }, [loadBots]);

  const handleToggleBot = async (bot: BotAccountItem) => {
    setTogglingBotUid(bot.uid);
    setErrorMsg(null);
    setWarningMsg(null);
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
    setWarningMsg(null);
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
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || data?.bannerMessage || 'Bot run failed.');
      }
      applyRunSummaryToBanner(data, true);
      await loadBots(true);
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
    setWarningMsg(null);
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
      await loadBots(true);
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
  const availableKeysCount = keyStatuses.filter((k) => k.status === 'available').length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              AUTOMATED STUDY BOTS (2-HOUR BATCH CRON · MULTI-KEY POOL · LOCAL KATEX VERIFIED)
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Commons Study Bots ({bots.length})
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            12 subject-focused bot accounts processed sequentially in 2-bot batches (least recently run) with multi-key rotation, cooldown tracking, and local KaTeX validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleTriggerRun()}
            disabled={runningAll || Boolean(runningBotUid)}
            className="relative overflow-hidden btn-red text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-w-[180px]"
          >
            <Play size={14} />
            <span>{runningAll ? 'Running 2-bot batch...' : 'Run Next Batch (2 Bots)'}</span>
            {runningAll && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={() => handleDeleteAllBotContent()}
            disabled={deletingContent}
            className="relative overflow-hidden px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 min-w-[170px]"
          >
            <Trash2 size={14} />
            <span>{deletingContent ? 'Deleting bot content...' : 'Delete All Bot Content'}</span>
            {deletingContent && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={() => loadBots(false)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Active Bots</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">
            {enabledCount} / {bots.length || 12}
          </div>
          <div className="text-[11px] text-sky-400 mt-1">2 bots/batch · Max 2 posts/day</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Bot Study Posts</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">{totalPosts}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Local KaTeX verified</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">Bot Comments &amp; Likes</div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">
            {totalComments} / {totalLikes}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Likes = 0 Gemini calls</div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
            <Activity size={13} className="text-sky-400" />
            <span>Gemini Calls Used</span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text)] mt-1">
            {geminiCallsLastRun} <span className="text-sm font-normal text-[var(--muted)]">last run</span>
          </div>
          <div className="text-[11px] text-sky-400 mt-1">
            {geminiCallsToday} total call(s) today
          </div>
        </Card>

        <Card className="p-4 bg-[var(--card)] border-[var(--border)] col-span-2 lg:col-span-1">
          <div className="text-xs text-[var(--muted)]">Worker Secrets &amp; Model</div>
          <div className="flex flex-col gap-1 mt-1.5 text-xs">
            <span className={geminiConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {geminiKeysCount > 0
                ? `${geminiKeysCount} key${geminiKeysCount === 1 ? '' : 's'} configured (${availableKeysCount} available)`
                : '0 keys configured'}
            </span>
            <span className="text-[11px] text-[var(--muted)] truncate" title={`Primary: ${geminiModel}, Fallback: ${geminiFallbackModel}`}>
              Model: <strong className="text-[var(--text)]">{geminiModel}</strong>
            </span>
            <span
              className={botRunSecretConfigured ? 'text-emerald-400 font-semibold text-[11px]' : 'text-amber-400 text-[11px]'}
            >
              BOT_RUN_SECRET: {botRunSecretConfigured ? 'Configured' : 'Missing'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── All Keys Exhausted Cooldown Banner ── */}
      {allKeysExhaustedUntil && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              All Gemini API keys are currently cooling down until{' '}
              {new Date(allKeysExhaustedUntil).toLocaleString()}
            </div>
            <div className="text-amber-300/90">
              Scheduled and manual runs will automatically skip Gemini API calls until the earliest key cooldown expires.
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback Banners ── */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/35 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="whitespace-pre-wrap break-words leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {warningMsg && (
        <div className="p-4 rounded-2xl bg-amber-950/35 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="whitespace-pre-wrap break-words leading-relaxed">{warningMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="whitespace-pre-wrap break-words leading-relaxed">{successMsg}</div>
        </div>
      )}

      {/* ── Gemini Multi-Key Pool Status (No key values exposed) ── */}
      <Card className="p-5 bg-[var(--card)] border-[var(--border)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <KeyRound size={14} />
            <span>
              Gemini API Key Pool ({geminiKeysCount} {geminiKeysCount === 1 ? 'key' : 'keys'} configured)
            </span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            Pinned model: <strong className="text-[var(--text)]">{geminiModel}</strong> · Fallback:{' '}
            <strong className="text-[var(--text)]">{geminiFallbackModel}</strong> · Cron:{' '}
            <code className="text-sky-300">0 */2 * * *</code>
          </div>
        </div>

        {keyStatuses.length === 0 ? (
          <div className="text-xs text-amber-300 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3">
            No Gemini API keys detected. Configure <code className="font-mono">GEMINI_API_KEYS=key1,key2,...,key7</code> in Cloudflare Worker secrets.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {keyStatuses.map((ks) => {
              const badgeColor =
                ks.status === 'available'
                  ? 'green'
                  : ks.status === 'daily_quota_hit'
                    ? 'red'
                    : 'amber';

              return (
                <div
                  key={ks.keyIndex}
                  className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text)]">{ks.label}</span>
                    <Badge color={badgeColor}>{ks.statusText}</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] flex items-center justify-between">
                    <span>Calls today: <strong className="text-[var(--text)]">{ks.callsToday}</strong></span>
                    <span>
                      Bots: {ks.assignedBots.map((n) => `#${n}`).join(', ') || '—'}
                    </span>
                  </div>
                  {ks.lastError && (
                    <div className="text-[11px] text-red-300/90 bg-red-950/25 border border-red-500/25 rounded-lg p-2 whitespace-pre-wrap break-words">
                      {ks.lastError}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Latest Run Execution Summary (Full untruncated errors) ── */}
      {lastRunResults.length > 0 && (
        <Card className="p-5 bg-[var(--card)] border-[var(--border)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Latest Run Execution Summary</span>
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {lastRunRanAt ? `Ran at ${new Date(lastRunRanAt).toLocaleString()} · ` : ''}
              Gemini calls this run: <strong className="text-[var(--text)]">{geminiCallsLastRun}</strong> · Today:{' '}
              <strong className="text-[var(--text)]">{geminiCallsToday}</strong>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {lastRunResults.map((r) => {
              const badgeColor =
                r.postsCreated > 0
                  ? 'green'
                  : r.error || r.status === 'error' || r.status === 'quota_exhausted'
                    ? 'red'
                    : 'amber';

              return (
                <div
                  key={r.botUid}
                  className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-[var(--text)]">
                      {r.displayName} ({r.subject})
                      {typeof r.assignedKeyIndex === 'number' && (
                        <span className="ml-2 text-[11px] font-normal text-sky-400">
                          [Key #{r.assignedKeyIndex + 1}]
                        </span>
                      )}
                    </div>
                    <Badge color={badgeColor}>{r.status}</Badge>
                  </div>
                  <div className="text-[var(--muted)]">
                    +{r.postsCreated} post(s), +{r.commentsCreated} comment(s), +{r.likesAdded} like(s)
                    {typeof r.geminiCallsUsed === 'number'
                      ? ` · ${r.geminiCallsUsed} Gemini call(s)`
                      : ''}
                  </div>
                  {r.error && (
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-200 text-[11px] font-mono whitespace-pre-wrap break-words leading-relaxed">
                      {r.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Bot Accounts List ── */}
      {loading ? (
        <LineLoader context="admin" message="Loading Commons study bots..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot, idx) => {
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
            const keyLabel =
              bot.assignedKeyLabel ||
              (geminiKeysCount > 0 ? `Key #${(idx % geminiKeysCount) + 1}` : 'Key #1');
            const isErrorStatus =
              Boolean(bot.lastRunStatus) &&
              (bot.lastRunStatus.toLowerCase().includes('error') ||
                bot.lastRunStatus.includes('429') ||
                bot.lastRunStatus.toLowerCase().includes('quota'));

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
                      uid={bot.uid}
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
                        {bot.dailyPostLimit}/day · <span className="text-sky-400">{keyLabel}</span>
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

                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--muted)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <Clock size={12} className="shrink-0 mt-0.5" />
                      <span
                        className={`whitespace-pre-wrap break-words leading-relaxed ${
                          isErrorStatus ? 'text-red-300' : ''
                        }`}
                      >
                        {lastRunLabel} · {bot.lastRunStatus || 'Ready'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTriggerRun(bot.uid)}
                        disabled={isRunningThis || runningAll || !bot.enabled}
                        className="relative overflow-hidden px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40 min-w-[100px]"
                      >
                        <Play size={11} />
                        <span>{isRunningThis ? 'Running...' : 'Run Now'}</span>
                        {isRunningThis && <ButtonLineLoader />}
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

