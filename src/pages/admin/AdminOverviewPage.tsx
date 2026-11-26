import { useCallback, useEffect, useRef, useState } from 'react';
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
  Megaphone,
  Gift,
  ShieldCheck,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  getCachedAdminStats,
  getCachedAdminUsersState,
  getUserDisplayName,
  seedBalancedMCQPool,
  fetchAuditLogs,
  fetchOverviewUsersCard,
  fetchOverviewQuestionsCard,
  fetchOverviewAttemptsCard,
  fetchOverviewApplicationsCard,
  getCachedOverviewApplications,
  fetchOverviewPaymentsCard,
  fetchOverviewReviewsCard,
  fetchOverviewSubjectsCard,
  fetchPlanAnalyticsStats,
  getCachedPlanAnalyticsStats,
  type PlanAnalyticsStats,
  AdminStatCardError,
  CORE_SUBJECTS,
} from '@/services/adminService';
import { perfMarkEnd } from '@/lib/perfMetrics';
import { getCachedAdminOverview } from '@/services/adminTabCache';
import {
  getCachedLiveQuestionBankStats,
  normalizeLiveSubjectCounts,
  type LiveSubjectCountEntry,
} from '@/services/universityMcqService';
import {
  fetchAdminWingmatesRadar,
  fetchRewardsHealth,
  fetchRewardsState,
  sendAdminWingmateReminder,
  setRewardsAdminMode,
  type RewardsHealthResponse,
  type WingmateFeedItem,
  type WingmatesCounters,
} from '@/services/rewardsService';
import { showApiToast } from '@/lib/api';
import type { RewardsMode } from '@/lib/rewardsEngine';
import type { AuditLog, UserProfile } from '@/types';

type RadarFilterId = 'all' | 'active' | 'at_risk' | 'inactive';

function formatLiveTimeAgo(timestampMs: number, nowMs: number): string {
  if (!timestampMs || timestampMs <= 0) return 'Inactive';
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

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

interface CardState<T> {
  loading: boolean;
  data: T | null;
  error: { source: string; status: string | number; message: string } | null;
}

function parseCardError(
  err: unknown,
  fallbackSource: string
): { source: string; status: string | number; message: string } {
  if (err instanceof AdminStatCardError) {
    return {
      source: err.source,
      status: err.status,
      message: err.message,
    };
  }
  const e = err as { code?: string; status?: number; message?: string; collection?: string };
  const source = e?.collection ? `firestore:${e.collection}` : fallbackSource;
  const status = e?.status ?? e?.code ?? 'ERROR';
  const message = e?.message || `Failed to load ${source}`;
  return { source, status, message };
}

export function AdminOverviewPage() {
  const { user, isAdmin, isSuperAdmin, profileLoading } = useAuth();
  const initialOverview = getCachedAdminOverview();
  const initialStats = initialOverview?.stats ?? getCachedAdminStats();

  // Independent state per stat card — never returns 0 or a default on failure
  const [usersCard, setUsersCard] = useState<
    CardState<{
      totalUsers: number;
      studentCount: number | null;
      captainCount: number | null;
      freeCount: number | null;
      proCount: number | null;
      plusCount: number | null;
      expiringSoonCount: number | null;
      guestCount: number | null;
      previewUsers: UserProfile[];
    }>
  >(() => ({
    loading: !initialStats,
    data: initialStats
      ? {
          totalUsers: initialStats.totalUsers,
          studentCount: initialStats.studentCount ?? null,
          captainCount: initialStats.captainCount ?? null,
          freeCount: initialStats.freeCount ?? null,
          proCount: initialStats.proCount ?? null,
          plusCount: initialStats.plusCount ?? null,
          expiringSoonCount: initialStats.expiringSoonCount ?? null,
          guestCount: initialStats.guestCount ?? null,
          previewUsers: getCachedAdminUsersState()?.users ?? [],
        }
      : null,
    error: null,
  }));
  const [planAnalytics, setPlanAnalytics] = useState<PlanAnalyticsStats | null>(() =>
    getCachedPlanAnalyticsStats()
  );

  const initialLiveBank = getCachedLiveQuestionBankStats();

  const [questionsCard, setQuestionsCard] = useState<
    CardState<{
      totalQuestions: number;
      totalUniversities?: number;
      liveUniversities?: number;
    }>
  >(() => ({
    loading: !initialLiveBank && !initialStats,
    data: initialLiveBank
      ? {
          totalQuestions: initialLiveBank.totalMcqs,
          totalUniversities: initialLiveBank.totalUniversities,
          liveUniversities: initialLiveBank.liveUniversities,
        }
      : initialStats
      ? {
          totalQuestions: initialStats.totalQuestions,
          totalUniversities: initialStats.totalUniversities,
          liveUniversities: initialStats.liveUniversities,
        }
      : null,
    error: null,
  }));

  const [attemptsCard, setAttemptsCard] = useState<CardState<{ totalAttempts: number }>>(() => ({
    loading: !initialStats,
    data: initialStats ? { totalAttempts: initialStats.totalAttempts } : null,
    error: null,
  }));

  const initialAppsSummary = getCachedOverviewApplications();
  const [applicationsCard, setApplicationsCard] = useState<
    CardState<{ pendingCaptains: number; pendingCrew: number; totalPending: number }>
  >(() => ({
    loading: !initialAppsSummary,
    data: initialAppsSummary,
    error: null,
  }));

  const [paymentsCard, setPaymentsCard] = useState<CardState<{ pendingPayments: number }>>(() => ({
    loading: !initialStats,
    data: initialStats ? { pendingPayments: initialStats.pendingPayments } : null,
    error: null,
  }));

  const [reviewsCard, setReviewsCard] = useState<CardState<{ pendingReviews: number }>>(() => ({
    loading: !initialStats,
    data: initialStats ? { pendingReviews: initialStats.pendingReviews } : null,
    error: null,
  }));

  const [subjectsCard, setSubjectsCard] = useState<
    CardState<{
      subjectCounts: Record<string, number>;
      subjects: LiveSubjectCountEntry[];
      totalQuestions?: number;
    }>
  >(() => {
    if (initialLiveBank) {
      const normalized = normalizeLiveSubjectCounts(initialLiveBank.bySubject);
      return {
        loading: false,
        data: {
          subjectCounts: normalized.subjectCounts,
          subjects: normalized.entries,
          totalQuestions: initialLiveBank.totalMcqs,
        },
        error: null,
      };
    }
    if (initialStats) {
      const normalized = initialStats.subjectBreakdown
        ? {
            subjectCounts: initialStats.subjectCounts || {},
            entries: initialStats.subjectBreakdown,
          }
        : normalizeLiveSubjectCounts(initialStats.subjectCounts);
      return {
        loading: false,
        data: {
          subjectCounts: normalized.subjectCounts,
          subjects: normalized.entries,
          totalQuestions: initialStats.totalQuestions,
        },
        error: null,
      };
    }
    return { loading: true, data: null, error: null };
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannerError, setBannerError] = useState<AdminDiagnosticError | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>(() => initialOverview?.recentLogs ?? []);

  // Seeder state & confirmation dialog
  const [isConfirmSeedOpen, setIsConfirmSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Super Admin Rewards 3-way Mode Switch + Health Check state
  const [rewardsMode, setRewardsMode] = useState<RewardsMode | null>(
    () => initialOverview?.rewardsMode ?? null
  );
  const [pendingRewardsMode, setPendingRewardsMode] = useState<RewardsMode | null>(null);
  const [updatingRewardsMode, setUpdatingRewardsMode] = useState(false);
  const [rewardsModeSuccess, setRewardsModeSuccess] = useState<string | null>(null);
  const [rewardsModeError, setRewardsModeError] = useState<string | null>(null);
  const [rewardsHealth, setRewardsHealth] = useState<RewardsHealthResponse | null>(
    () => initialOverview?.rewardsHealth ?? null
  );
  const [checkingRewardsHealth, setCheckingRewardsHealth] = useState(false);

  // Wingmates Radar live feed state
  const [radarItems, setRadarItems] = useState<WingmateFeedItem[]>([]);
  const [radarCounters, setRadarCounters] = useState<WingmatesCounters>({
    practicingNow: 0,
    streakAtRisk: 0,
    inactive2PlusDays: 0,
  });
  const [radarLoading, setRadarLoading] = useState<boolean>(true);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [radarFilter, setRadarFilter] = useState<RadarFilterId>('all');
  const [remindingUid, setRemindingUid] = useState<string | null>(null);
  const [remindedUids, setRemindedUids] = useState<Record<string, number>>({});
  const [liveClockMs, setLiveClockMs] = useState<number>(() => Date.now());

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    const id = window.setInterval(() => {
      setLiveClockMs(Date.now());
    }, 15_000);
    return () => {
      isMountedRef.current = false;
      window.clearInterval(id);
    };
  }, []);

  const reportCardFailure = useCallback(
    (err: unknown, fallbackSource: string) => {
      const parsed = parseCardError(err, fallbackSource);
      const toastMsg = `${parsed.source} (${parsed.status}): ${parsed.message}`;
      showApiToast(toastMsg, 'error');
      setBannerError({
        code: String(parsed.status),
        message: parsed.message,
        collection: parsed.source,
        operation: 'AdminOverviewCardLoad',
      });
      return parsed;
    },
    []
  );

  useEffect(() => {
    if (usersCard.data && typeof usersCard.data.totalUsers === 'number') {
      perfMarkEnd('admin_student_count', { totalUsers: usersCard.data.totalUsers });
    }
  }, [usersCard.data]);

  const loadUsersCard = useCallback(
    async (force = false) => {
      setUsersCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewUsersCard({ force });
        if (!isMountedRef.current) return;
        setUsersCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'firestore:users | GET /api/admin/stats');
        setUsersCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadQuestionsCard = useCallback(
    async (force = false) => {
      setQuestionsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewQuestionsCard({ force });
        if (!isMountedRef.current) return;
        setQuestionsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'GET /api/mcqs/health');
        setQuestionsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadAttemptsCard = useCallback(
    async (force = false) => {
      setAttemptsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewAttemptsCard({ force });
        if (!isMountedRef.current) return;
        setAttemptsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'firestore:attempts | GET /api/admin/stats');
        setAttemptsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadApplicationsCard = useCallback(
    async (force = false) => {
      setApplicationsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewApplicationsCard({ force });
        if (!isMountedRef.current) return;
        setApplicationsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(
          err,
          'firestore:captainApplications,crewApplications | GET /api/admin/stats'
        );
        setApplicationsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadPaymentsCard = useCallback(
    async (force = false) => {
      setPaymentsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewPaymentsCard({ force });
        if (!isMountedRef.current) return;
        setPaymentsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'firestore:paymentRequests | GET /api/admin/stats');
        setPaymentsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadReviewsCard = useCallback(
    async (force = false) => {
      setReviewsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewReviewsCard({ force });
        if (!isMountedRef.current) return;
        setReviewsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'firestore:reviews | GET /api/admin/stats');
        setReviewsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const loadSubjectsCard = useCallback(
    async (force = false) => {
      setSubjectsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewSubjectsCard({ force });
        if (!isMountedRef.current) return;
        setSubjectsCard({ loading: false, data, error: null });
      } catch (err) {
        if (!isMountedRef.current) return;
        const parsed = reportCardFailure(err, 'GET /api/mcqs/health');
        setSubjectsCard({ loading: false, data: null, error: parsed });
      }
    },
    [reportCardFailure]
  );

  const handleRunRewardsHealthCheck = useCallback(async () => {
    setCheckingRewardsHealth(true);
    try {
      const h = await fetchRewardsHealth();
      if (isMountedRef.current) setRewardsHealth(h);
    } catch (err) {
      reportCardFailure(err, 'GET /api/rewards/health');
    } finally {
      if (isMountedRef.current) setCheckingRewardsHealth(false);
    }
  }, [reportCardFailure]);

  const loadWingmatesRadar = useCallback(async () => {
    setRadarLoading(true);
    setRadarError(null);
    try {
      const res = await fetchAdminWingmatesRadar();
      if (!isMountedRef.current) return;
      if (res.ok) {
        setRadarItems(res.items || []);
        setRadarCounters(
          res.counters || {
            practicingNow: 0,
            streakAtRisk: 0,
            inactive2PlusDays: 0,
          }
        );
      } else {
        setRadarError(res.error || 'Unable to load Wingmates Radar.');
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setRadarError(err?.message || 'Unable to load Wingmates Radar.');
    } finally {
      if (isMountedRef.current) {
        setRadarLoading(false);
      }
    }
  }, []);

  const handleSendRadarReminder = async (item: WingmateFeedItem) => {
    if (remindingUid) return;
    setRemindingUid(item.uid);
    try {
      const res = await sendAdminWingmateReminder(item.uid);
      if (res.ok) {
        const now = res.remindedAtMs || Date.now();
        setRemindedUids((prev) => ({ ...prev, [item.uid]: now }));
        showApiToast(`Reminder sent to ${item.displayName}`, 'info');
      } else {
        showApiToast(res.error || 'Failed to send reminder', 'error');
      }
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to send reminder', 'error');
    } finally {
      setRemindingUid(null);
    }
  };

  const loadData = useCallback(
    async (options?: { force?: boolean }) => {
      if (!user || !isAdmin) return;
      const force = Boolean(options?.force);
      if (force) {
        setIsRefreshing(true);
      }
      setBannerError(null);

      // Fire every stat card independently in parallel so a single failure never blocks or zeros out others
      const tasks: Promise<unknown>[] = [
        loadUsersCard(force),
        fetchPlanAnalyticsStats({ force })
          .then((analytics) => {
            if (isMountedRef.current) setPlanAnalytics(analytics);
          })
          .catch(() => {}),
        loadQuestionsCard(force),
        loadAttemptsCard(force),
        loadApplicationsCard(force),
        loadPaymentsCard(force),
        loadReviewsCard(force),
        loadSubjectsCard(force),
        loadWingmatesRadar(),
      ];

      if (isSuperAdmin) {
        tasks.push(
          fetchAuditLogs(5)
            .then((logs) => {
              if (isMountedRef.current && Array.isArray(logs)) {
                setRecentLogs(logs);
              }
            })
            .catch((err) => {
              reportCardFailure(err, 'firestore:auditLogs | GET /api/admin/grand-line-audit-logs');
            }),
          fetchRewardsState(user.uid)
            .then((st) => {
              if (isMountedRef.current && st?.mode) {
                setRewardsMode(st.mode);
              }
            })
            .catch((err) => {
              reportCardFailure(err, 'GET /api/rewards/state');
            }),
          fetchRewardsHealth()
            .then((rh) => {
              if (isMountedRef.current && rh) {
                setRewardsHealth(rh);
              }
            })
            .catch((err) => {
              reportCardFailure(err, 'GET /api/rewards/health');
            })
        );
      }

      await Promise.allSettled(tasks);
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    },
    [
      user,
      isAdmin,
      isSuperAdmin,
      loadUsersCard,
      loadQuestionsCard,
      loadAttemptsCard,
      loadApplicationsCard,
      loadPaymentsCard,
      loadReviewsCard,
      loadSubjectsCard,
      loadWingmatesRadar,
      reportCardFailure,
    ]
  );

  // Wait for auth AND admin-role check to finish before starting fetches
  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData();
    }
  }, [profileLoading, user, isAdmin, loadData]);

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
      await loadData({ force: true });
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

  const renderCardMetric = (
    card: CardState<any>,
    valueAccessor: (d: any) => number,
    retryFn: () => void,
    testId?: string
  ) => {
    if (card.loading && !card.data) {
      return (
        <div className="my-2 flex items-center gap-2">
          <span className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--muted)] leading-none">
            —
          </span>
          <span className="h-7 w-20 rounded-lg bg-[var(--surface-hover)] animate-pulse" />
        </div>
      );
    }
    if (card.error || !card.data) {
      return (
        <div className="my-2 flex flex-col gap-1" data-testid={testId ? `${testId}-error` : undefined}>
          <div className="inline-flex items-center gap-1.5 text-[var(--red)] font-heading font-bold text-[13px]">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Error ({card.error?.status || 'FAILED'})</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--muted)] line-clamp-2">
            {card.error?.source}: {card.error?.message || 'Failed to load metric'}
          </p>
          <button
            type="button"
            onClick={retryFn}
            className="mt-1 self-start text-[11px] font-heading font-semibold text-[var(--red)] hover:underline cursor-pointer"
          >
            Retry card
          </button>
        </div>
      );
    }
    const num = valueAccessor(card.data);
    return (
      <p
        data-testid={testId}
        className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2"
      >
        {Number(num).toLocaleString()}
      </p>
    );
  };

  return (
    <div data-admin-page="overview" className="flex flex-col gap-6 w-full max-w-full">
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
          onClick={() => loadData({ force: true })}
          disabled={isRefreshing}
          className="relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          {isRefreshing && <ButtonLineLoader />}
        </button>
      </div>

      <AdminDiagnosticBanner
        error={bannerError}
        collectionName={bannerError?.collection || 'questions, users, attempts'}
        onRetry={() => loadData({ force: true })}
        retrying={isRefreshing}
      />

      {/* ─── 6 INDEPENDENT STAT CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Registered users */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Registered users
            </span>
            <Users size={16} className="text-[var(--text)] shrink-0" />
          </div>
          {renderCardMetric(
            usersCard,
            (d) => d.totalUsers,
            () => void loadUsersCard(true),
            'admin-overview-total-users'
          )}
          {usersCard.data && !usersCard.error ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px] font-mono text-[var(--muted)]">
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)]">
                Free: {usersCard.data.freeCount ?? '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#D71921]/10 border border-[#D71921]/30 text-[#D71921]">
                Pro: {usersCard.data.proCount ?? '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold">
                Plus: {usersCard.data.plusCount ?? '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)]">
                Guests: {usersCard.data.guestCount ?? '—'}
              </span>
            </div>
          ) : usersCard.loading ? (
            <div className="h-4 w-32 rounded bg-[var(--surface-hover)] animate-pulse mb-2" />
          ) : null}
          {isSuperAdmin ? (
            <Link
              to="/admin/users"
              className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
            >
              <span>Manage users</span>
              <ArrowRight size={12} />
            </Link>
          ) : (
            <span className="font-heading text-[12px] text-[var(--muted)] mt-auto pt-1">
              Platform accounts
            </span>
          )}
        </div>

        {/* 2. Questions in pool */}
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Questions in pool
            </span>
            <Database size={16} className="text-[var(--text)] shrink-0" />
          </div>
          {renderCardMetric(
            questionsCard,
            (d) => d.totalQuestions,
            () => void loadQuestionsCard(true),
            'admin-overview-total-questions'
          )}
          {questionsCard.data &&
          !questionsCard.error &&
          typeof questionsCard.data.totalUniversities === 'number' ? (
            <div className="text-[11px] font-mono text-[var(--muted)] mb-2">
              {questionsCard.data.liveUniversities ?? 0} of {questionsCard.data.totalUniversities}{' '}
              universities live
            </div>
          ) : null}
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
          {renderCardMetric(
            attemptsCard,
            (d) => d.totalAttempts,
            () => void loadAttemptsCard(true),
            'admin-overview-total-attempts'
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
          {renderCardMetric(
            applicationsCard,
            (d) => d.totalPending,
            () => void loadApplicationsCard(true),
            'admin-overview-pending-applications'
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
          {renderCardMetric(
            paymentsCard,
            (d) => d.pendingPayments,
            () => void loadPaymentsCard(true),
            'admin-overview-pending-payments'
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
          {renderCardMetric(
            reviewsCard,
            (d) => d.pendingReviews,
            () => void loadReviewsCard(true),
            'admin-overview-pending-reviews'
          )}
          <Link
            to="/admin/commons"
            className="font-heading text-[12px] text-[var(--text)] hover:underline flex items-center gap-1 mt-auto pt-1"
          >
            <span>Moderate reviews</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ─── SUBSCRIPTION ANALYTICS (FREE / PRO / PLUS) ──────────────────────── */}
      <section className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="font-dot text-[16px] font-extrabold text-[var(--text)]">
              Boardly Plans Snapshot
            </h2>
          </div>
          {isSuperAdmin && (
            <Link
              to="/admin/plans"
              className="font-heading text-[12px] text-[var(--accent)] hover:underline inline-flex items-center gap-1"
            >
              <span>Edit config/plans</span>
              <ArrowRight size={12} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--border)]">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Active Free</div>
            <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1">
              {(usersCard.data?.freeCount ?? planAnalytics?.freeCount ?? '—').toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[#D71921]/30">
            <div className="font-mono text-[10px] uppercase text-[#D71921]">Active Pro</div>
            <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1">
              {(usersCard.data?.proCount ?? planAnalytics?.proCount ?? '—').toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-amber-500/40">
            <div className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400">
              Active Plus
            </div>
            <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1">
              {(usersCard.data?.plusCount ?? planAnalytics?.plusCount ?? '—').toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--border)]">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Expiring ≤7d</div>
            <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1">
              {(
                usersCard.data?.expiringSoonCount ??
                planAnalytics?.expiringSoonCount ??
                '—'
              ).toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--border)]">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Pro / Plus PKR</div>
            <div className="font-mono text-[12px] font-bold text-[var(--text)] mt-1.5">
              {planAnalytics
                ? `${planAnalytics.proRevenuePkr.toLocaleString()} / ${planAnalytics.plusRevenuePkr.toLocaleString()}`
                : '—'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--border)]">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Pro → Plus</div>
            <div className="font-dot text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {planAnalytics ? planAnalytics.proToPlusConversions.toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WINGMATES RADAR (ALL USERS LIVE FEED + FILTERS + SEND REMINDER) ─── */}
      <section
        data-testid="wingmates-radar-section"
        aria-labelledby="wingmates-radar-heading"
        className="p-5 rounded-[28px] border flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--pill-card-bg)',
          borderColor: 'var(--pill-card-border)',
          color: 'var(--text)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span
              className="block font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Cockpit Live Feed · All Students
            </span>
            <h2
              id="wingmates-radar-heading"
              className="font-dot text-[18px] sm:text-[20px] font-black mt-0.5"
              style={{ color: 'var(--text)' }}
            >
              Wingmates Radar
            </h2>
          </div>

          <div className="flex items-center flex-wrap gap-1.5" role="group" aria-label="Wingmates Radar filters">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'at_risk', label: 'At risk' },
                { id: 'inactive', label: 'Inactive' },
              ] as const
            ).map((f) => {
              const isSelected = radarFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  data-testid={`wingmates-radar-filter-${f.id}`}
                  onClick={() => setRadarFilter(f.id)}
                  className="px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-opacity duration-150"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--rw-on-red)',
                          border: '1px solid var(--accent)',
                        }
                      : {
                          backgroundColor: 'var(--pill-chip-bg)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--pill-chip-border)',
                        }
                  }
                >
                  {f.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => void loadWingmatesRadar()}
              disabled={radarLoading}
              className="p-2 rounded-full border cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--pill-chip-bg)',
                borderColor: 'var(--pill-chip-border)',
                color: 'var(--text)',
              }}
              title="Refresh Wingmates Radar"
            >
              <RefreshCw size={13} className={radarLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Counters Strip */}
        <div
          className="grid grid-cols-3 gap-2.5"
          data-testid="wingmates-radar-counters"
        >
          <div
            className="rounded-[20px] border px-3.5 py-2.5 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--pill-chip-bg)',
              borderColor: 'var(--pill-chip-border)',
            }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Practicing now
            </span>
            <span
              className="font-dot text-lg sm:text-xl font-black tabular-nums mt-0.5"
              style={{ color: 'var(--rw-green)' }}
            >
              {radarCounters.practicingNow}
            </span>
          </div>

          <div
            className="rounded-[20px] border px-3.5 py-2.5 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--pill-chip-bg)',
              borderColor: 'var(--pill-chip-border)',
            }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Streak at risk
            </span>
            <span
              className="font-dot text-lg sm:text-xl font-black tabular-nums mt-0.5"
              style={{ color: 'var(--rw-gold)' }}
            >
              {radarCounters.streakAtRisk}
            </span>
          </div>

          <div
            className="rounded-[20px] border px-3.5 py-2.5 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--pill-chip-bg)',
              borderColor: 'var(--pill-chip-border)',
            }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Inactive 2+ days
            </span>
            <span
              className="font-dot text-lg sm:text-xl font-black tabular-nums mt-0.5"
              style={{ color: 'var(--rw-red)' }}
            >
              {radarCounters.inactive2PlusDays}
            </span>
          </div>
        </div>

        {/* Feed States */}
        {radarLoading ? (
          <div className="space-y-2" data-testid="wingmates-radar-loading">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-[999px] border px-4 py-3 flex items-center justify-between gap-3 animate-pulse"
                style={{
                  backgroundColor: 'var(--pill-chip-bg)',
                  borderColor: 'var(--pill-chip-border)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="h-10 w-10 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--pill-card-bg)' }}
                  />
                  <div className="space-y-1.5 flex-1">
                    <div
                      className="h-3 w-28 rounded-full"
                      style={{ backgroundColor: 'var(--pill-card-bg)' }}
                    />
                    <div
                      className="h-2.5 w-40 rounded-full"
                      style={{ backgroundColor: 'var(--pill-card-bg)' }}
                    />
                  </div>
                </div>
                <div
                  className="h-8 w-28 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--pill-card-bg)' }}
                />
              </div>
            ))}
          </div>
        ) : radarError ? (
          <div
            data-testid="wingmates-radar-error"
            className="rounded-[20px] border p-4 flex items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'var(--pill-chip-bg)',
              borderColor: 'var(--rw-red)',
              color: 'var(--rw-red)',
            }}
          >
            <span>{radarError}</span>
            <button
              type="button"
              onClick={() => void loadWingmatesRadar()}
              className="font-mono font-bold underline cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        ) : (
          (() => {
            const filteredRadar = radarItems.filter((item) => {
              if (radarFilter === 'all') return true;
              return item.filterCategory === radarFilter;
            });

            if (filteredRadar.length === 0) {
              return (
                <div
                  data-testid="wingmates-radar-empty"
                  className="rounded-[20px] border p-5 text-center text-xs font-mono"
                  style={{
                    backgroundColor: 'var(--pill-chip-bg)',
                    borderColor: 'var(--pill-chip-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No users match the selected Wingmates Radar filter.
                </div>
              );
            }

            return (
              <div
                data-testid="wingmates-radar-list"
                className="space-y-2 max-h-[380px] overflow-y-auto pr-1"
              >
                {filteredRadar.map((item) => {
                  const isSending = remindingUid === item.uid;
                  const alreadyReminded = Boolean(
                    remindedUids[item.uid] ||
                      (item.lastRemindedAtMs &&
                        liveClockMs - item.lastRemindedAtMs < 24 * 60 * 60 * 1000)
                  );
                  const dotColor =
                    item.statusType === 'practicing_now'
                      ? 'var(--rw-green)'
                      : item.statusType === 'finished_test' ||
                        item.statusType === 'back_after_days'
                      ? 'var(--rw-gold)'
                      : 'var(--rw-red)';

                  return (
                    <div
                      key={item.uid}
                      data-testid={`wingmates-radar-row-${item.uid}`}
                      className="rounded-[999px] border px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--pill-chip-bg)',
                        borderColor: 'var(--pill-chip-border)',
                        color: 'var(--text)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="relative h-10 w-10 rounded-full border flex items-center justify-center shrink-0 overflow-hidden font-dot text-xs font-black"
                          style={{
                            backgroundColor: 'var(--pill-card-bg)',
                            borderColor: 'var(--pill-card-border)',
                            color: 'var(--text)',
                          }}
                        >
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{item.initials}</span>
                          )}
                          <span
                            className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border"
                            style={{
                              backgroundColor: dotColor,
                              borderColor: 'var(--pill-chip-bg)',
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-xs sm:text-sm font-bold truncate"
                              style={{ color: 'var(--text)' }}
                            >
                              {item.displayName}
                            </span>
                            <span
                              className="font-mono text-[10px] font-bold uppercase tracking-wider shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              · {formatLiveTimeAgo(item.lastEventAtMs, liveClockMs)}
                            </span>
                          </div>
                          <p
                            className="text-[11px] sm:text-xs truncate mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.statusText}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`wingmates-radar-remind-btn-${item.uid}`}
                        disabled={isSending || alreadyReminded}
                        onClick={() => void handleSendRadarReminder(item)}
                        className="h-8 px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-opacity duration-150"
                        style={
                          alreadyReminded
                            ? {
                                backgroundColor: 'var(--pill-card-bg)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--pill-card-border)',
                              }
                            : {
                                backgroundColor: 'var(--accent)',
                                color: 'var(--rw-on-red)',
                                border: '1px solid var(--accent)',
                              }
                        }
                      >
                        <BellRing size={11} />
                        <span>
                          {isSending
                            ? 'Sending...'
                            : alreadyReminded
                            ? 'Reminded'
                            : 'Send reminder'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </section>

      {/* ─── REGISTERED USERS PREVIEW (SUPER ADMIN ONLY) ───────────────────── */}
      {isSuperAdmin && (
        <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-red-500 shrink-0" />
              <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
                Users directory (
                {usersCard.loading && !usersCard.data
                  ? '—'
                  : usersCard.error || !usersCard.data
                  ? 'Error'
                  : usersCard.data.totalUsers.toLocaleString()}
                )
              </h2>
            </div>
            <Link
              to="/admin/users"
              className="font-heading text-[12px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <span>Open full users directory</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {usersCard.loading && !usersCard.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3 animate-pulse"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3.5 w-28 rounded bg-[var(--surface-hover)]" />
                    <div className="h-2.5 w-20 rounded bg-[var(--surface-hover)]" />
                  </div>
                  <div className="h-5 w-16 rounded-md bg-[var(--surface-hover)]" />
                </div>
              ))}
            </div>
          ) : usersCard.error || !usersCard.data ? (
            <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
              <span>
                {usersCard.error?.source} ({usersCard.error?.status}): {usersCard.error?.message}
              </span>
              <button
                type="button"
                onClick={() => void loadUsersCard(true)}
                className="underline font-bold ml-3 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : usersCard.data.previewUsers.length === 0 ? (
            <p className="text-xs font-mono text-[var(--muted)] py-2">
              No users found in directory.
            </p>
          ) : (
            <div
              data-testid="admin-overview-users-list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
            >
              {usersCard.data.previewUsers.slice(0, 6).map((u) => {
                const badge = u.twoFactorStatus?.badgeLabel || 'Off';
                return (
                  <Link
                    key={u.uid}
                    to="/admin/users"
                    className="p-3 rounded-[14px] bg-[var(--card-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-heading font-semibold text-xs text-[var(--text)] truncate">
                        {getUserDisplayName(u)}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)] truncate">
                        {u.username ? `@${u.username}` : u.email || u.uid}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        badge === 'Recovery pending'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : badge === 'Off'
                          ? 'bg-[var(--surface-hover)] text-[var(--muted)] border-[var(--border)]'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <ShieldCheck size={10} />
                      2FA: {badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── QUESTIONS PER SUBJECT BREAKDOWN ─────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
            Questions by subject
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-heading text-[12px] text-[var(--muted)]">
              {subjectsCard.data && typeof subjectsCard.data.totalQuestions === 'number'
                ? `Live counts · ${subjectsCard.data.totalQuestions.toLocaleString()} MCQs`
                : 'Live counts'}
            </span>
            <button
              type="button"
              onClick={() => void loadSubjectsCard(true)}
              disabled={subjectsCard.loading}
              className="p-1 rounded-md text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Refresh subject counts"
            >
              <RefreshCw size={13} className={subjectsCard.loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {subjectsCard.error ? (
          <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
            <span>
              {subjectsCard.error.source} ({subjectsCard.error.status}): {subjectsCard.error.message}
            </span>
            <button
              type="button"
              onClick={() => void loadSubjectsCard(true)}
              className="underline font-bold ml-3 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
            {subjectsCard.loading && !subjectsCard.data
              ? CORE_SUBJECTS.map((subj) => (
                  <div
                    key={subj}
                    className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between"
                  >
                    <span className="font-heading text-[12px] text-[var(--muted)] truncate">
                      {subj}
                    </span>
                    <span className="tabular-nums text-[22px] font-bold text-[var(--text)] mt-2">
                      —
                    </span>
                  </div>
                ))
              : (subjectsCard.data?.subjects && subjectsCard.data.subjects.length > 0
                  ? subjectsCard.data.subjects
                  : CORE_SUBJECTS.map((subj) => ({
                      subject: subj,
                      count: subjectsCard.data?.subjectCounts?.[subj] ?? 0,
                    }))
                ).map((entry) => (
                  <div
                    key={entry.subject}
                    className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between"
                  >
                    <span
                      title={entry.subject}
                      className="font-heading text-[12px] text-[var(--muted)] truncate"
                    >
                      {entry.subject}
                    </span>
                    <span className="tabular-nums text-[22px] font-bold text-[var(--text)] mt-2">
                      {entry.count.toLocaleString()}
                    </span>
                  </div>
                ))}
          </div>
        )}
      </div>

      {/* ─── SUPERADMIN-ONLY CONTROLS ────────────────────────────────────────── */}
      {isSuperAdmin && (
        <>
          {/* Broadcast Announcements */}
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

          {/* Store Pricing Control */}
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

          {/* Boardly Rewards D1 Mode Switch */}
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

          {/* Seed Balanced Question Pool Tool */}
          <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="max-w-[680px]">
                <h2 className="font-heading font-semibold text-[16px] text-[var(--text)] mb-1">
                  Seed balanced question pool
                </h2>
                <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed mb-3">
                  Adds missing questions so every subject has 125 or more. Existing questions are never changed or deleted.
                </p>

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

            {seedProgress && (
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-[12px] font-heading text-[var(--muted)]">
                  <span>Writing questions to pool...</span>
                  <span className="font-dot text-[13px] font-bold text-[var(--text)]">
                    {seedProgress.done} / {seedProgress.total} ({Math.round((seedProgress.done / seedProgress.total) * 100)}%)
                  </span>
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

          {/* Audit Trail Card */}
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
        </>
      )}

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
              Are you sure you want to set Boardly Rewards mode to{' '}
              <strong className="text-[var(--text)] font-bold">
                {pendingRewardsMode === 'everyone'
                  ? 'Everyone (Live)'
                  : pendingRewardsMode === 'admin_only'
                  ? 'Admin only (testing)'
                  : 'Off'}
              </strong>
              ? This takes effect immediately via Cloudflare D1.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                data-testid="rewards-mode-cancel-btn"
                onClick={() => setPendingRewardsMode(null)}
                className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="rewards-mode-confirm-btn"
                onClick={handleConfirmRewardsModeChange}
                className="px-4 py-2 rounded-[12px] bg-[#D71921] hover:bg-red-600 text-white text-[13px] font-heading font-bold cursor-pointer"
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
