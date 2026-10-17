import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApp, firebaseConfig } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import {
  fetchAdminStats,
  seedBalancedMCQPool,
  fetchAuditLogs,
  type AdminStats,
  CORE_SUBJECTS,
} from '@/services/adminService';
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
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  // Seeder state & confirmation dialog
  const [isConfirmSeedOpen, setIsConfirmSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, logs] = await Promise.all([
        fetchAdminStats(),
        fetchAuditLogs(5),
      ]);
      setStats(s);
      setRecentLogs(logs);
    } catch (err: unknown) {
      console.warn('Failed to load admin stats (using fallback stats):', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'FETCH_STATS_FAILED',
        message: e?.message || 'Failed to fetch overview metrics. Check Firestore rules or collection names.',
        collection: e?.collection || 'questions/users',
        projectId: e?.projectId || firebaseConfig.projectId || 'gen-lang-client-0366509316',
        operation: e?.operation || 'fetchAdminStats',
      });
      setStats({
        totalUsers: 0,
        totalQuestions: 500,
        totalAttempts: 0,
        pendingCaptains: 0,
        pendingCrew: 0,
        pendingPayments: 0,
        pendingReviews: 0,
        subjectCounts: {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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
          className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {(stats?.totalUsers ?? 0).toLocaleString()}
            </p>
          )}
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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {(stats?.totalQuestions ?? 0).toLocaleString()}
            </p>
          )}
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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {(stats?.totalAttempts ?? 0).toLocaleString()}
            </p>
          )}
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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {((stats?.pendingCaptains ?? 0) + (stats?.pendingCrew ?? 0)).toLocaleString()}
            </p>
          )}
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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {(stats?.pendingPayments ?? 0).toLocaleString()}
            </p>
          )}
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
          {loading ? (
            <Skeleton height={40} width="60%" />
          ) : (
            <p className="font-dot text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2">
              {(stats?.pendingReviews ?? 0).toLocaleString()}
            </p>
          )}
          <Link
            to="/admin/reviews"
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
          <span className="font-heading text-[12px] text-[var(--muted)]">
            Live counts in collection
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CORE_SUBJECTS.map((subj) => {
            const count = stats?.subjectCounts?.[subj] ?? 0;
            return (
              <div
                key={subj}
                className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between"
              >
                <span className="font-heading text-[12px] text-[var(--muted)] truncate">
                  {subj}
                </span>
                <span className="font-dot text-[22px] font-bold text-[var(--text)] mt-2">
                  {loading ? '...' : count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

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
              className="w-full sm:w-auto px-4 py-2.5 rounded-[12px] border border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding in progress...' : 'Seed balanced question pool'}
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
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

      {/* ─── FIREBASE PROJECT DEBUG FOOTER ───────────────────────────────────── */}
      <div className="pt-4 pb-2 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-[var(--muted)]">
        <span>Firebase Active Project ID: <strong className="text-[var(--text)]">{getApp().options.projectId || 'unknown'}</strong></span>
        <span>Auth Domain: <strong className="text-[var(--text)]">{getApp().options.authDomain || 'unknown'}</strong></span>
      </div>
    </div>
  );
}

export default AdminOverviewPage;
