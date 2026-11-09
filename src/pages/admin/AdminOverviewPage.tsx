import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Database,
  Award,
  CreditCard,
  FileCheck2,
  Activity,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Megaphone,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  fetchAdminStats,
  getCachedAdminStats,
  seedBalancedMCQPool,
  fetchAuditLogs,
  type AdminStats,
  CORE_SUBJECTS,
} from '@/services/adminService';
import {
  fetchRewardsHealth,
  fetchRewardsState,
  setRewardsAdminMode,
  type RewardsHealthResponse,
} from '@/services/rewardsService';
import type { RewardsMode } from '@/lib/rewardsEngine';
import type { AuditLog } from '@/types';

const SUBJECT_TARGET_PILLS = [
  '125 Mathematics',
  '125 Physics',
  '125 Chemistry / CS',
  '125 English / Analytical',
  '100 FAST',
  '100 NUST',
  '100 GIKI',
  '100 LUMS',
  '100 NED / UET',
];

export function AdminOverviewPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(() => getCachedAdminStats());
  const [loading, setLoading] = useState(() => !getCachedAdminStats());
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  // Seeder state & confirmation dialog
  const [isConfirmSeedOpen, setIsConfirmSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Super Admin Rewards 3-way Mode Switch + Health Check state
  const [rewardsMode, setRewardsMode] = useState<RewardsMode | null>(null);
  const [pendingRewardsMode, setPendingRewardsMode] = useState<RewardsMode | null>(null);
  const [updatingRewardsMode, setUpdatingRewardsMode] = useState(false);
  const [rewardsModeSuccess, setRewardsModeSuccess] = useState<string | null>(null);
  const [rewardsModeError, setRewardsModeError] = useState<string | null>(null);
  const [rewardsHealth, setRewardsHealth] = useState<RewardsHealthResponse | null>(null);
  const [checkingRewardsHealth, setCheckingRewardsHealth] = useState(false);

  const handleRunRewardsHealthCheck = useCallback(async () => {
    setCheckingRewardsHealth(true);
    try {
      const h = await fetchRewardsHealth();
      setRewardsHealth(h);
    } finally {
      setCheckingRewardsHealth(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, logs, rState, rHealth] = await Promise.all([
        fetchAdminStats(),
        fetchAuditLogs(5),
        fetchRewardsState(user?.uid),
        fetchRewardsHealth(),
      ]);
      setStats(s);
      setRecentLogs(logs);
      if (rState?.loadError) {
        setRewardsMode(null);
        setRewardsModeError(rState.loadError);
      } else if (rState?.mode) {
        setRewardsMode(rState.mode);
      }
      if (rHealth) {
        setRewardsHealth(rHealth);
      }
    } catch (err: unknown) {
      console.warn('Failed to load admin stats (using fallback stats):', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'FETCH_STATS_FAILED',
        message: e?.message || 'Failed to fetch overview metrics. Check Firestore rules or collection names.',
        collection: e?.collection || 'questions/users',
        operation: e?.operation || 'fetchAdminStats',
      });
      setStats({
        totalUsers: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        totalQuestionsSolved: 0,
        totalActiveCrews: 0,
        totalAmbassadors: 0,
        pendingCaptains: 0,
        pendingCrew: 0,
        pendingPayments: 0,
        pendingReviews: 0,
        subjectCounts: {},
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleConfirmSeed = async () => {
    setIsConfirmSeedOpen(false);
    if (!user?.email) return;
    setSeeding(true);
    setSeedSuccess(null);
    setSeedError(null);
    setSeedProgress({ done: 0, total: 500 });

    try {
      const res = await seedBalancedMCQPool(user.email, (done, total) => {
        setSeedProgress({ done, total });
      });
      setSeedSuccess(`Added or verified all ${res.seeded} questions successfully.`);
      await loadData();
    } catch (err: unknown) {
      console.warn('Seeding warning:', err);
      setSeedError('Failed to complete question pool seeding. Check network connection.');
    } finally {
      setSeeding(false);
    }
  };

  const formatLogTime = (log: AuditLog): string => {
    if (!log.timestamp) return 'Just now';
    try {
      if ('toDate' in log.timestamp && typeof log.timestamp.toDate === 'function') {
        const d = log.timestamp.toDate();
        return d.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // ignore
    }
    return 'Recently';
  };

  const handleSelectRewardsMode = (nextMode: RewardsMode) => {
    if (nextMode === rewardsMode || updatingRewardsMode) return;
    setRewardsModeSuccess(null);
    setRewardsModeError(null);
    setPendingRewardsMode(nextMode);
  };

  const handleConfirmRewardsModeChange = async () => {
    if (!pendingRewardsMode || updatingRewardsMode) return;
    const targetMode = pendingRewardsMode;
    setPendingRewardsMode(null);
    setUpdatingRewardsMode(true);
    setRewardsModeSuccess(null);
    setRewardsModeError(null);

    try {
      const res = await setRewardsAdminMode(targetMode);
      if (res.ok) {
        // Re-read the stored setting from D1 via GET /api/rewards/state so the UI always matches D1
        const verifiedState = await fetchRewardsState(user?.uid);
        if (verifiedState.loadError) {
          setRewardsModeError(
            `Saved change, but failed to re-read setting from D1 (${verifiedState.loadError}).`
          );
          return;
        }
        const storedMode = verifiedState.mode;
        setRewardsMode(storedMode);
        const label =
          storedMode === 'everyone'
            ? 'Everyone (Live)'
            : storedMode === 'admin_only'
            ? 'Admin only (testing)'
            : 'Off';
        setRewardsModeSuccess(`Boardly Rewards mode updated to "${label}" in Cloudflare D1.`);
        const [logs, rHealth] = await Promise.all([
          fetchAuditLogs(5).catch(() => null),
          fetchRewardsHealth().catch(() => null),
        ]);
        if (logs) setRecentLogs(logs);
        if (rHealth) setRewardsHealth(rHealth);
      } else {
        setRewardsModeError(res.error || 'Failed to update Rewards mode.');
      }
    } catch (err: any) {
      console.error('[AdminOverviewPage] Failed to update Rewards mode:', err);
      setRewardsModeError(err?.message || 'Failed to update Rewards mode.');
    } finally {
      setUpdatingRewardsMode(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Admin overview
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            System metrics, question bank management, and pending queues.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          {loading && <ButtonLineLoader />}
        </button>
      </div>

      {loading && !stats && (
        <LineLoader context="admin" message="Loading admin panel..." />
      )}

      <AdminDiagnosticBanner
        error={error}
        collectionName="questions, users, attempts"
        onRetry={loadData}
        retrying={loading}
      />



      {/* ─── 6 STAT CARDS (2 cols mobile, 4 cols desktop) ───────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Registered users */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Registered users
            </span>
            <Users size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(Number.isFinite(Number(stats?.totalUsers)) ? Number(stats?.totalUsers) : 0).toLocaleString()}
          </p>
          <Link
            to="/admin/users"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Manage users</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 2. Questions in pool */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Questions in pool
            </span>
            <Database size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(Number.isFinite(Number(stats?.totalQuestions)) ? Number(stats?.totalQuestions) : 0).toLocaleString()}
          </p>
          <Link
            to="/admin/questions"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Inspect questions</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 3. Test attempts */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Test attempts
            </span>
            <Activity size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(Number.isFinite(Number(stats?.totalAttempts)) ? Number(stats?.totalAttempts) : 0).toLocaleString()}
          </p>
          <span className="font-heading text-[12px] text-[var(--muted)] mt-auto pt-1">
            Student submissions
          </span>
        </div>

        {/* 4. Pending applications */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Pending applications
            </span>
            <Award size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(
              (Number.isFinite(Number(stats?.pendingCaptains)) ? Number(stats?.pendingCaptains) : 0) +
              (Number.isFinite(Number(stats?.pendingCrew)) ? Number(stats?.pendingCrew) : 0)
            ).toLocaleString()}
          </p>
          <Link
            to="/admin/applications"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Review queue</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 5. Pending payments */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Pending payments
            </span>
            <CreditCard size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(Number.isFinite(Number(stats?.pendingPayments)) ? Number(stats?.pendingPayments) : 0).toLocaleString()}
          </p>
          <Link
            to="/admin/payments"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Verify payments</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 6. Pending reviews */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Pending reviews
            </span>
            <FileCheck2 size={16} className="text-[var(--text)] shrink-0" />
          </div>
          <p className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
            {(Number.isFinite(Number(stats?.pendingReviews)) ? Number(stats?.pendingReviews) : 0).toLocaleString()}
          </p>
          <Link
            to="/admin/commons"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Moderate reviews</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ─── QUESTIONS PER SUBJECT BREAKDOWN ─────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
            Questions by subject
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-heading text-[12px] text-[var(--muted)]">
              Live counts
            </span>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-1 rounded-md text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Refresh subject counts"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CORE_SUBJECTS.map((subj) => {
            const rawCount = stats?.subjectCounts?.[subj] ?? stats?.subjectCounts?.[subj.toLowerCase()] ?? 0;
            const count = Number.isFinite(Number(rawCount)) ? Number(rawCount) : 0;
            return (
              <div
                key={subj}
                className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between"
              >
                <span className="font-heading text-[12px] text-[var(--muted)] truncate">
                  {subj}
                </span>
                <span className="tabular-nums text-[22px] font-bold text-[var(--text)] mt-2">
                  {count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── BROADCAST ANNOUNCEMENTS SECTION ───────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2">
              <span>Superadmin Announcements</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Broadcast
              </span>
            </h2>
            <p className="text-[12px] text-[var(--muted)] mt-0.5">
              Post announcements to every Boardly student. Appears instantly in their in-app Notifications page.
            </p>
          </div>
        </div>
        <Link
          to="/admin/announcements"
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Post &amp; Manage Announcements</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ─── STORE PRICING CONTROL SECTION ─────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <KobanIcon size={20} decorative />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2">
              <span>Store Pricing &amp; Cosmetics Manager</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Super Admin
              </span>
            </h2>
            <p className="text-[12px] text-[var(--muted)] mt-0.5">
              Bulk update Koban prices with batched writes, preview before applying, toggle active items, and audit price history.
            </p>
          </div>
        </div>
        <Link
          to="/admin/pricing"
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Open Store Pricing</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ─── BOARDLY REWARDS D1 MODE SWITCH (SUPER ADMIN ONLY) ────────────── */}
      {isAdmin && (
        <div
          data-testid="admin-rewards-mode-card"
          className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Gift size={20} />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2">
                  <span>Rewards</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Super Admin · Cloudflare D1
                  </span>
                </h2>
                <p className="text-[12px] text-[var(--muted)] mt-0.5">
                  Control who can claim daily check-ins, MCQ milestones, and referral bonuses on{' '}
                  <Link to="/rewards" className="text-[var(--text)] underline">
                    /rewards
                  </Link>
                  . Stored in D1 <code className="font-mono">reward_settings</code>.
                </p>
              </div>
            </div>

            {/* 3-Way Segmented Control */}
            <div
              role="group"
              aria-label="Rewards mode switch"
              data-testid="rewards-mode-segmented-control"
              className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)] shrink-0"
            >
              {(
                [
                  { id: 'off', label: 'Off' },
                  { id: 'admin_only', label: 'Admin only (testing)' },
                  { id: 'everyone', label: 'Everyone' },
                ] as const
              ).map((opt) => {
                const active = rewardsMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`rewards-mode-btn-${opt.id}`}
                    disabled={updatingRewardsMode}
                    onClick={() => handleSelectRewardsMode(opt.id)}
                    className={`px-3.5 py-2 rounded-[10px] text-[12px] font-heading font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#D71921] text-white shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Firestore + D1 Health Check Panel (Part A5) */}
          <div
            data-testid="admin-rewards-health-panel"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)]"
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              {rewardsHealth?.ok ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="min-w-0 text-[12px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold text-[var(--text)]">
                    Firestore Credit Health:
                  </span>
                  <span
                    data-testid="admin-rewards-health-status"
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      rewardsHealth?.ok
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {checkingRewardsHealth
                      ? 'checking...'
                      : rewardsHealth
                      ? rewardsHealth.ok
                        ? 'ok'
                        : rewardsHealth.reason
                      : 'not_checked'}
                  </span>
                </div>
                {rewardsHealth && (
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                    Target: <code className="font-mono">{rewardsHealth.targetProjectId || 'gen-lang-client-0365509316'}</code> · DB:{' '}
                    <code className="font-mono">{rewardsHealth.targetDatabaseId || 'named-db'}</code>
                    {rewardsHealth.serviceAccountClientEmail
                      ? ` · SA: ${rewardsHealth.serviceAccountClientEmail}`
                      : ' · SA: not configured'}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              data-testid="admin-rewards-health-btn"
              disabled={checkingRewardsHealth}
              onClick={handleRunRewardsHealthCheck}
              className="px-3 py-1.5 rounded-[10px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] font-heading font-bold text-[var(--text)] flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={checkingRewardsHealth ? 'animate-spin' : ''} />
              <span>{checkingRewardsHealth ? 'Checking...' : 'Check Health'}</span>
            </button>
          </div>

          {rewardsModeSuccess && (
            <div
              data-testid="rewards-mode-success"
              className="flex items-center gap-2 p-3 rounded-[12px] border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[13px] font-heading"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{rewardsModeSuccess}</span>
            </div>
          )}

          {rewardsModeError && (
            <div
              data-testid="rewards-mode-error"
              className="flex items-center gap-2 p-3 rounded-[12px] border border-red-500/40 bg-red-500/10 text-red-500 text-[13px] font-heading"
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span>{rewardsModeError}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── SEED BALANCED QUESTION POOL TOOL ────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="max-w-[680px]">
            <h2 className="font-heading font-semibold text-[16px] text-[var(--text)] mb-1">
              Seed balanced question pool
            </h2>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed mb-3">
              Adds missing questions so every subject has 125 or more. Existing questions are never changed or deleted.
            </p>

            {/* Outlined grey pills */}
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_TARGET_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="font-heading text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] bg-[var(--card-2)]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsConfirmSeedOpen(true)}
              disabled={seeding}
              className="relative overflow-hidden w-full sm:w-auto px-4 py-2.5 rounded-[12px] border border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding in progress...' : 'Seed balanced question pool'}
              {seeding && <ButtonLineLoader />}
            </button>
          </div>
        </div>

        {/* Seeding Progress Bar */}
        {seedProgress && (
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[12px] font-heading text-[var(--muted)]">
              <span>Writing questions to pool...</span>
              <span className="font-dot text-[13px] font-bold text-[var(--text)]">
                {seedProgress.done} / {seedProgress.total} ({Math.round((seedProgress.done / seedProgress.total) * 100)}%)
              </span>
            </div>
            <div className="h-2 w-full bg-[var(--card-2)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--text)] transition-all duration-150"
                style={{ width: `${(seedProgress.done / seedProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {seedSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] text-[13px] font-heading">
            <CheckCircle2 size={16} />
            <span>{seedSuccess}</span>
          </div>
        )}

        {seedError && (
          <div className="flex items-center gap-2 p-3 rounded-[12px] border border-[var(--red)]/40 bg-[var(--card-2)] text-[var(--red)] text-[13px] font-heading">
            <AlertTriangle size={16} />
            <span>{seedError}</span>
          </div>
        )}
      </div>

      {/* ─── AUDIT TRAIL CARD ─────────────────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
            Recent audit trail
          </h2>
          <Link
            to="/admin/audit-logs"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1"
          >
            <span>View all logs</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="font-heading text-[13px] text-[var(--muted)] py-4 text-center">
            No admin actions yet
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <div
                key={log.id || i}
                className="p-3 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3 text-[13px] font-heading"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text)] shrink-0">
                    {log.action}
                  </span>
                  <span className="text-[var(--text)] truncate">
                    {log.targetEmail || log.targetUid || log.adminEmail}
                  </span>
                </div>
                <span className="text-[12px] text-[var(--muted)] shrink-0">
                  {formatLogTime(log)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── CONFIRMATION DIALOG FOR SEEDING ─────────────────────────────────── */}
      {isConfirmSeedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
            onClick={() => setIsConfirmSeedOpen(false)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-none">
            <h3 className="font-heading font-bold text-[17px] text-[var(--text)]">
              Seed balanced question pool?
            </h3>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              This will add missing standard entrance test questions so every subject has at least 125 MCQs. Existing questions are never modified or overwritten.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSeedOpen(false)}
                className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSeed}
                className="px-4 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90"
              >
                Confirm and seed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG FOR REWARDS MODE CHANGE ─────────────────────── */}
      {pendingRewardsMode && (
        <div
          data-testid="rewards-mode-confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
            onClick={() => setPendingRewardsMode(null)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-none">
            <h3 className="font-heading font-bold text-[17px] text-[var(--text)]">
              Change Boardly Rewards mode?
            </h3>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              {pendingRewardsMode === 'off'
                ? 'Setting Rewards to "Off" disables all Claim buttons for everyone and shows "Coming soon" on /rewards.'
                : pendingRewardsMode === 'admin_only'
                ? 'Setting Rewards to "Admin only (testing)" allows only Super Admins to claim rewards while students see "Coming soon".'
                : 'Setting Rewards to "Everyone" enables live daily check-ins, MCQ milestones, and referral payouts for all signed-in students.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                data-testid="rewards-mode-confirm-cancel"
                onClick={() => setPendingRewardsMode(null)}
                className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="rewards-mode-confirm-submit"
                onClick={handleConfirmRewardsModeChange}
                className="px-4 py-2 rounded-[12px] bg-[#D71921] text-white text-[13px] font-heading font-bold hover:opacity-90"
              >
                Confirm Mode Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOverviewPage;
