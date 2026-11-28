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
  getCachedOverviewUsersAndPlansSnapshot,
  getCachedOverviewAttemptsCard,
  getCachedOverviewApplications,
  getCachedOverviewPaymentsCard,
  getCachedOverviewReviewsCard,
  getUserDisplayName,
  seedBalancedMCQPool,
  fetchAuditLogs,
  fetchOverviewUsersAndPlansSnapshot,
  fetchOverviewAttemptsCard,
  fetchOverviewApplicationsCard,
  fetchOverviewPaymentsCard,
  fetchOverviewReviewsCard,
  type OverviewUsersAndPlansSnapshot,
  AdminStatCardError,
  CORE_SUBJECTS,
} from '@/services/adminService';
import { perfMarkEnd } from '@/lib/perfMetrics';
import { getCachedAdminOverview } from '@/services/adminTabCache';
import {
  fetchLiveQuestionBankStats,
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
import { clearGenericErrorToasts, dismissApiToast, showApiToast } from '@/lib/api';
import type { RewardsMode } from '@/lib/rewardsEngine';
import type { AuditLog } from '@/types';
import {
  DotHeading,
  GlassCard,
  Pill,
  Segmented,
  Skeleton,
} from '@/components/admin/AdminGlassPrimitives';
import { formatAuditActionLabel, pluralize } from '@/utils/adminLabels';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';

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

function normalizeErrorStatus(rawStatus: unknown, fallbackCode?: string): string | number {
  const rawStr = String(rawStatus ?? '').trim();
  const upper = rawStr.toUpperCase();
  if (!rawStr || upper === '200' || upper === 'HTTP_200' || upper === 'OK') {
    const cleanFallback = String(fallbackCode ?? '').trim();
    const upperFallback = cleanFallback.toUpperCase();
    if (
      cleanFallback &&
      upperFallback !== '200' &&
      upperFallback !== 'HTTP_200' &&
      upperFallback !== 'OK'
    ) {
      return cleanFallback;
    }
    return 'STAT_UNAVAILABLE';
  }
  return typeof rawStatus === 'number' || typeof rawStatus === 'string' ? rawStatus : rawStr;
}

function parseCardError(
  err: unknown,
  fallbackSource: string
): { source: string; status: string | number; message: string } {
  if (err instanceof AdminStatCardError) {
    return {
      source: err.source,
      status: normalizeErrorStatus(err.status),
      message: err.message,
    };
  }
  const e = err as { code?: string; status?: number | string; message?: string; collection?: string };
  const source = e?.collection ? `firestore:${e.collection}` : fallbackSource;
  const rawStatus = e?.status ?? e?.code ?? 'ERROR';
  const status = normalizeErrorStatus(rawStatus, e?.code);
  const message = e?.message || `Failed to load ${source}`;
  return { source, status, message };
}

function isTransientCardError(parsed: { status: string | number; message: string }): boolean {
  const statusStr = String(parsed.status || '').toLowerCase();
  const msgStr = String(parsed.message || '').toLowerCase();
  if (statusStr.includes('resource_exhausted') || msgStr.includes('quota')) return false;
  if (statusStr.includes('permission') || statusStr.includes('unauthenticated')) return false;
  return (
    statusStr.includes('deadline') ||
    statusStr.includes('timeout') ||
    statusStr.includes('unavailable') ||
    statusStr.includes('rest_count_failed') ||
    statusStr.includes('firestore_error') ||
    statusStr.includes('empty_count') ||
    statusStr.includes('malformed') ||
    statusStr.includes('aborted') ||
    statusStr.includes('internal') ||
    statusStr.includes('unknown') ||
    statusStr.includes('cancelled') ||
    statusStr.includes('408') ||
    statusStr.includes('429') ||
    statusStr.includes('500') ||
    statusStr.includes('502') ||
    statusStr.includes('503') ||
    statusStr.includes('504') ||
    msgStr.includes('timed out') ||
    msgStr.includes('timeout') ||
    msgStr.includes('network') ||
    msgStr.includes('fetch') ||
    msgStr.includes('transport')
  );
}

export function AdminOverviewPage() {
  const { user, isAdmin, isSuperAdmin, profileLoading } = useAuth();
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const initialOverview = getCachedAdminOverview();
  const initialUsersAndPlans = getCachedOverviewUsersAndPlansSnapshot();
  const initialLiveBank = getCachedLiveQuestionBankStats();
  const initialAttempts = getCachedOverviewAttemptsCard();
  const initialAppsSummary = getCachedOverviewApplications();
  const initialPayments = getCachedOverviewPaymentsCard();
  const initialReviews = getCachedOverviewReviewsCard();

  // Unified atomic snapshot for Registered users + Boardly Plans Snapshot + Users directory preview
  const [usersAndPlansCard, setUsersAndPlansCard] = useState<
    CardState<OverviewUsersAndPlansSnapshot>
  >(() => ({
    loading: !initialUsersAndPlans,
    data: initialUsersAndPlans,
    error: null,
  }));

  // Unified atomic snapshot for Questions in pool + Questions by subject (one GET /api/mcqs/health source)
  const [questionBankCard, setQuestionBankCard] = useState<
    CardState<{
      totalQuestions: number;
      totalUniversities: number;
      liveUniversities: number;
      subjectCounts: Record<string, number>;
      subjects: LiveSubjectCountEntry[];
    }>
  >(() => {
    if (initialLiveBank) {
      const normalized = normalizeLiveSubjectCounts(initialLiveBank.bySubject);
      return {
        loading: false,
        data: {
          totalQuestions: initialLiveBank.totalMcqs,
          totalUniversities: initialLiveBank.totalUniversities,
          liveUniversities: initialLiveBank.liveUniversities,
          subjectCounts: normalized.subjectCounts,
          subjects: normalized.entries,
        },
        error: null,
      };
    }
    return { loading: true, data: null, error: null };
  });

  const [attemptsCard, setAttemptsCard] = useState<CardState<{ totalAttempts: number }>>(() => ({
    loading: !initialAttempts,
    data: initialAttempts,
    error: null,
  }));

  const [applicationsCard, setApplicationsCard] = useState<
    CardState<{ pendingCaptains: number; pendingCrew: number; totalPending: number }>
  >(() => ({
    loading: !initialAppsSummary,
    data: initialAppsSummary,
    error: null,
  }));

  const [paymentsCard, setPaymentsCard] = useState<CardState<{ pendingPayments: number }>>(() => ({
    loading: !initialPayments,
    data: initialPayments,
    error: null,
  }));

  const [reviewsCard, setReviewsCard] = useState<CardState<{ pendingReviews: number }>>(() => ({
    loading: !initialReviews,
    data: initialReviews,
    error: null,
  }));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cardErrors, setCardErrors] = useState<Record<string, AdminDiagnosticError>>({});
  const bannerError: AdminDiagnosticError | null = Object.values(cardErrors)[0] ?? null;
  const [recentLogsCard, setRecentLogsCard] = useState<CardState<AuditLog[]>>(() => {
    const cachedLogs =
      initialOverview && Array.isArray(initialOverview.recentLogs) && initialOverview.recentLogs.length > 0
        ? initialOverview.recentLogs
        : null;
    return {
      loading: !cachedLogs,
      data: cachedLogs,
      error: null,
    };
  });

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
  const [rewardsModeLoading, setRewardsModeLoading] = useState<boolean>(
    () => !initialOverview?.rewardsMode
  );
  const [pendingRewardsMode, setPendingRewardsMode] = useState<RewardsMode | null>(null);
  const [updatingRewardsMode, setUpdatingRewardsMode] = useState(false);
  const [rewardsModeSuccess, setRewardsModeSuccess] = useState<string | null>(null);
  const [rewardsModeError, setRewardsModeError] = useState<string | null>(null);
  const [rewardsHealth, setRewardsHealth] = useState<RewardsHealthResponse | null>(
    () => initialOverview?.rewardsHealth ?? null
  );
  const [rewardsHealthLoading, setRewardsHealthLoading] = useState<boolean>(
    () => !initialOverview?.rewardsHealth
  );
  const [checkingRewardsHealth, setCheckingRewardsHealth] = useState(false);

  // Wingmates Radar live feed state — counters stay null while pending/failed (never fake 0s)
  const [radarItems, setRadarItems] = useState<WingmateFeedItem[]>([]);
  const [radarCounters, setRadarCounters] = useState<WingmatesCounters | null>(null);
  const [radarLoading, setRadarLoading] = useState<boolean>(true);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [radarFilter, setRadarFilter] = useState<RadarFilterId>('all');
  const [remindingUid, setRemindingUid] = useState<string | null>(null);
  const [remindedUids, setRemindedUids] = useState<Record<string, number>>({});
  const [liveClockMs, setLiveClockMs] = useState<number>(() => Date.now());

  const isMountedRef = useRef(true);
  const requestIdsRef = useRef<Record<string, number>>({});
  const nextRequestId = useCallback((key: string): number => {
    const next = (requestIdsRef.current[key] ?? 0) + 1;
    requestIdsRef.current[key] = next;
    return next;
  }, []);
  const isLatestRequest = useCallback(
    (key: string, reqId: number): boolean =>
      isMountedRef.current && requestIdsRef.current[key] === reqId,
    []
  );

  useEffect(() => {
    isMountedRef.current = true;
    clearGenericErrorToasts();
    const id = window.setInterval(() => {
      setLiveClockMs(Date.now());
    }, 15_000);
    return () => {
      isMountedRef.current = false;
      window.clearInterval(id);
      clearGenericErrorToasts();
    };
  }, []);

  const clearCardFailure = useCallback((cardKey: string) => {
    setCardErrors((prev) => {
      if (!(cardKey in prev)) return prev;
      const next = { ...prev };
      delete next[cardKey];
      return next;
    });
    dismissApiToast({ tag: `admin-overview:${cardKey}` });
    clearGenericErrorToasts();
  }, []);

  const reportCardFailure = useCallback(
    (cardKey: string, err: unknown, fallbackSource: string) => {
      const parsed = parseCardError(err, fallbackSource);
      setCardErrors((prev) => ({
        ...prev,
        [cardKey]: {
          code: String(parsed.status),
          message: parsed.message,
          collection: parsed.source,
          operation: 'AdminOverviewCardLoad',
        },
      }));
      return parsed;
    },
    []
  );

  useEffect(() => {
    if (
      usersAndPlansCard.data &&
      typeof usersAndPlansCard.data.users.totalUsers === 'number'
    ) {
      perfMarkEnd('admin_student_count', {
        totalUsers: usersAndPlansCard.data.users.totalUsers,
      });
    }
  }, [usersAndPlansCard.data]);

  const loadUsersAndPlansCard = useCallback(
    async (force = false) => {
      const reqId = nextRequestId('usersAndPlans');
      setUsersAndPlansCard((prev) => ({
        ...prev,
        loading: !prev.data || force,
        error: null,
      }));
      try {
        const snapshot = await fetchOverviewUsersAndPlansSnapshot({ force });
        if (!isLatestRequest('usersAndPlans', reqId)) return;
        setUsersAndPlansCard({ loading: false, data: snapshot, error: null });
        clearCardFailure('users');
        if (snapshot.plansError) {
          reportCardFailure(
            'plans',
            new AdminStatCardError(
              snapshot.plansError.source,
              snapshot.plansError.status,
              snapshot.plansError.message
            ),
            snapshot.plansError.source
          );
        } else {
          clearCardFailure('plans');
        }
      } catch (err) {
        if (!isLatestRequest('usersAndPlans', reqId)) return;
        const parsed = reportCardFailure('users', err, 'firestore:users');
        clearCardFailure('plans');
        setUsersAndPlansCard({ loading: false, data: null, error: parsed });
      }
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadQuestionBankCard = useCallback(
    async (force = false) => {
      const reqId = nextRequestId('questionBank');
      setQuestionBankCard((prev) => ({
        ...prev,
        loading: !prev.data || force,
        error: null,
      }));
      try {
        const bank = await fetchLiveQuestionBankStats({ force, strict: true });
        if (!isLatestRequest('questionBank', reqId)) return;
        const normalized = normalizeLiveSubjectCounts(bank.bySubject);
        setQuestionBankCard({
          loading: false,
          data: {
            totalQuestions: bank.totalMcqs,
            totalUniversities: bank.totalUniversities,
            liveUniversities: bank.liveUniversities,
            subjectCounts: normalized.subjectCounts,
            subjects: normalized.entries,
          },
          error: null,
        });
        clearCardFailure('questions');
      } catch (err) {
        if (!isLatestRequest('questionBank', reqId)) return;
        const parsed = reportCardFailure('questions', err, 'GET /api/mcqs/health');
        setQuestionBankCard({ loading: false, data: null, error: parsed });
      }
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadAttemptsCard = useCallback(
    async (force = false, allowAutoRetry = true) => {
      const reqId = nextRequestId('attempts');
      setAttemptsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      const retryDelaysMs = allowAutoRetry ? [800, 1800] : [];
      let lastErr: unknown = null;

      for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
        try {
          const data = await fetchOverviewAttemptsCard({ force: force || attempt > 0 });
          if (!isLatestRequest('attempts', reqId)) return;
          setAttemptsCard({ loading: false, data, error: null });
          clearCardFailure('attempts');
          return;
        } catch (err) {
          if (!isLatestRequest('attempts', reqId)) return;
          lastErr = err;
          const parsed = parseCardError(err, 'firestore:attempts');
          const delayMs = retryDelaysMs[attempt];
          if (delayMs !== undefined && isTransientCardError(parsed)) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            if (!isLatestRequest('attempts', reqId)) return;
            continue;
          }
          break;
        }
      }

      if (!isLatestRequest('attempts', reqId)) return;
      const reported = reportCardFailure('attempts', lastErr, 'firestore:attempts');
      setAttemptsCard({ loading: false, data: null, error: reported });
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadApplicationsCard = useCallback(
    async (force = false, allowAutoRetry = true) => {
      const reqId = nextRequestId('applications');
      setApplicationsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewApplicationsCard({ force });
        if (!isLatestRequest('applications', reqId)) return;
        setApplicationsCard({ loading: false, data, error: null });
        clearCardFailure('applications');
      } catch (err) {
        if (!isLatestRequest('applications', reqId)) return;
        const parsed = parseCardError(err, 'firestore:captainApplications,crewApplications');
        if (allowAutoRetry && isTransientCardError(parsed)) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          if (!isLatestRequest('applications', reqId)) return;
          try {
            const retryData = await fetchOverviewApplicationsCard({ force: true });
            if (!isLatestRequest('applications', reqId)) return;
            setApplicationsCard({ loading: false, data: retryData, error: null });
            clearCardFailure('applications');
            return;
          } catch (retryErr) {
            if (!isLatestRequest('applications', reqId)) return;
            const retryParsed = reportCardFailure(
              'applications',
              retryErr,
              'firestore:captainApplications,crewApplications'
            );
            setApplicationsCard({ loading: false, data: null, error: retryParsed });
            return;
          }
        }
        const reported = reportCardFailure(
          'applications',
          err,
          'firestore:captainApplications,crewApplications'
        );
        setApplicationsCard({ loading: false, data: null, error: reported });
      }
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadPaymentsCard = useCallback(
    async (force = false, allowAutoRetry = true) => {
      const reqId = nextRequestId('payments');
      setPaymentsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const data = await fetchOverviewPaymentsCard({ force });
        if (!isLatestRequest('payments', reqId)) return;
        setPaymentsCard({ loading: false, data, error: null });
        clearCardFailure('payments');
      } catch (err) {
        if (!isLatestRequest('payments', reqId)) return;
        const parsed = parseCardError(err, 'firestore:paymentRequests');
        if (allowAutoRetry && isTransientCardError(parsed)) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          if (!isLatestRequest('payments', reqId)) return;
          try {
            const retryData = await fetchOverviewPaymentsCard({ force: true });
            if (!isLatestRequest('payments', reqId)) return;
            setPaymentsCard({ loading: false, data: retryData, error: null });
            clearCardFailure('payments');
            return;
          } catch (retryErr) {
            if (!isLatestRequest('payments', reqId)) return;
            const retryParsed = reportCardFailure('payments', retryErr, 'firestore:paymentRequests');
            setPaymentsCard({ loading: false, data: null, error: retryParsed });
            return;
          }
        }
        const reported = reportCardFailure('payments', err, 'firestore:paymentRequests');
        setPaymentsCard({ loading: false, data: null, error: reported });
      }
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadReviewsCard = useCallback(
    async (force = false, allowAutoRetry = true) => {
      const reqId = nextRequestId('reviews');
      setReviewsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      const retryDelaysMs = allowAutoRetry ? [800, 1800] : [];
      let lastErr: unknown = null;

      for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
        try {
          const data = await fetchOverviewReviewsCard({ force: force || attempt > 0 });
          if (!isLatestRequest('reviews', reqId)) return;
          setReviewsCard({ loading: false, data, error: null });
          clearCardFailure('reviews');
          return;
        } catch (err) {
          if (!isLatestRequest('reviews', reqId)) return;
          lastErr = err;
          const parsed = parseCardError(err, 'firestore:reviews');
          const delayMs = retryDelaysMs[attempt];
          if (delayMs !== undefined && isTransientCardError(parsed)) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            if (!isLatestRequest('reviews', reqId)) return;
            continue;
          }
          break;
        }
      }

      if (!isLatestRequest('reviews', reqId)) return;
      const reported = reportCardFailure('reviews', lastErr, 'firestore:reviews');
      setReviewsCard({ loading: false, data: null, error: reported });
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const loadRecentLogs = useCallback(
    async (force = false) => {
      const reqId = nextRequestId('auditLogs');
      setRecentLogsCard((prev) => ({ ...prev, loading: !prev.data || force, error: null }));
      try {
        const logs = await fetchAuditLogs(5);
        if (!isLatestRequest('auditLogs', reqId)) return;
        setRecentLogsCard({
          loading: false,
          data: Array.isArray(logs) ? logs : [],
          error: null,
        });
        clearCardFailure('auditLogs');
      } catch (err) {
        if (!isLatestRequest('auditLogs', reqId)) return;
        const parsed = reportCardFailure(
          'auditLogs',
          err,
          'firestore:auditLogs | GET /api/admin/grand-line-audit-logs'
        );
        setRecentLogsCard({ loading: false, data: null, error: parsed });
      }
    },
    [clearCardFailure, isLatestRequest, nextRequestId, reportCardFailure]
  );

  const handleRunRewardsHealthCheck = useCallback(async () => {
    setCheckingRewardsHealth(true);
    try {
      const h = await fetchRewardsHealth();
      if (isMountedRef.current) {
        setRewardsHealth(h);
        clearCardFailure('rewardsHealth');
      }
    } catch (err) {
      reportCardFailure('rewardsHealth', err, 'GET /api/rewards/health');
    } finally {
      if (isMountedRef.current) setCheckingRewardsHealth(false);
    }
  }, [clearCardFailure, reportCardFailure]);

  const loadWingmatesRadar = useCallback(async () => {
    const reqId = nextRequestId('wingmatesRadar');
    setRadarLoading(true);
    setRadarError(null);
    try {
      const res = await fetchAdminWingmatesRadar();
      if (!isLatestRequest('wingmatesRadar', reqId)) return;
      if (res.ok && res.counters) {
        setRadarItems(res.items || []);
        setRadarCounters(res.counters);
        clearGenericErrorToasts();
      } else {
        setRadarItems([]);
        setRadarCounters(null);
        setRadarError(res.error || 'Unable to load Wingmates Radar.');
      }
    } catch (err: any) {
      if (!isLatestRequest('wingmatesRadar', reqId)) return;
      setRadarItems([]);
      setRadarCounters(null);
      setRadarError(err?.message || 'Unable to load Wingmates Radar.');
    } finally {
      if (isLatestRequest('wingmatesRadar', reqId)) {
        setRadarLoading(false);
      }
    }
  }, [isLatestRequest, nextRequestId]);

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

  const userUid = user?.uid ?? null;

  const loadData = useCallback(
    async (options?: { force?: boolean }) => {
      if (!userUid || !isAdmin) return;
      const force = Boolean(options?.force);
      if (force) {
        setIsRefreshing(true);
      }
      setCardErrors({});
      clearGenericErrorToasts();

      // Fire each independent data source once in parallel (users+plans share one atomic snapshot; questions+subjects share one health snapshot)
      const tasks: Promise<unknown>[] = [
        loadUsersAndPlansCard(force),
        loadQuestionBankCard(force),
        loadAttemptsCard(force),
        loadApplicationsCard(force),
        loadPaymentsCard(force),
        loadReviewsCard(force),
        loadWingmatesRadar(),
      ];

      if (isSuperAdmin) {
        setRewardsModeLoading((prev) => prev || force);
        setRewardsHealthLoading((prev) => prev || force);
        tasks.push(
          loadRecentLogs(force),
          fetchRewardsState(userUid)
            .then((st) => {
              if (!isMountedRef.current) return;
              if (st?.loadError) {
                reportCardFailure('rewardsState', new Error(st.loadError), 'GET /api/rewards/summary');
              } else if (st?.mode) {
                setRewardsMode(st.mode);
                clearCardFailure('rewardsState');
              }
            })
            .catch((err) => {
              reportCardFailure('rewardsState', err, 'GET /api/rewards/summary');
            })
            .finally(() => {
              if (isMountedRef.current) setRewardsModeLoading(false);
            }),
          fetchRewardsHealth()
            .then((rh) => {
              if (isMountedRef.current && rh) {
                setRewardsHealth(rh);
                clearCardFailure('rewardsHealth');
              }
            })
            .catch((err) => {
              reportCardFailure('rewardsHealth', err, 'GET /api/rewards/health');
            })
            .finally(() => {
              if (isMountedRef.current) setRewardsHealthLoading(false);
            })
        );
      }

      await Promise.allSettled(tasks);
      clearGenericErrorToasts();
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    },
    [
      userUid,
      isAdmin,
      isSuperAdmin,
      loadUsersAndPlansCard,
      loadQuestionBankCard,
      loadAttemptsCard,
      loadApplicationsCard,
      loadPaymentsCard,
      loadReviewsCard,
      loadWingmatesRadar,
      loadRecentLogs,
      clearCardFailure,
      reportCardFailure,
    ]
  );

  // Wait for auth AND admin-role check to finish before starting fetches
  useEffect(() => {
    if (!profileLoading && userUid && isAdmin) {
      void loadData();
    }
  }, [profileLoading, userUid, isAdmin, loadData]);

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
            `Saved change, but failed to verify updated setting (${verifiedState.loadError}).`
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
        setRewardsModeSuccess(`Boardly Rewards mode updated to "${label}".`);
        const [logs, rHealth] = await Promise.all([
          fetchAuditLogs(5).catch(() => null),
          fetchRewardsHealth().catch(() => null),
        ]);
        if (logs) setRecentLogsCard({ loading: false, data: logs, error: null });
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
    valueAccessor: (d: any) => number | null | undefined,
    retryFn: () => void,
    testId?: string
  ) => {
    if ((profileLoading || card.loading) && !card.data) {
      return (
        <div className="my-2 flex items-center" aria-label="Loading metric">
          <span className="h-9 sm:h-10 w-24 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
        </div>
      );
    }
    const num = card.data ? valueAccessor(card.data) : null;
    if (card.error || !card.data || typeof num !== 'number' || !Number.isFinite(num)) {
      return (
        <div className="my-2 flex flex-col gap-1" data-testid={testId ? `${testId}-error` : undefined}>
          <div className="inline-flex items-center gap-1.5 text-[var(--red)] font-heading font-bold text-[13px]">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Error ({card.error?.status || 'FAILED'})</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--muted)] line-clamp-2">
            {card.error?.source ? `${card.error.source}: ` : ''}
            {card.error?.message || 'Failed to load metric'}
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
    return (
      <p
        data-testid={testId}
        className="tabular-nums text-[36px] sm:text-[40px] font-extrabold text-[var(--text)] leading-none my-2"
      >
        {num.toLocaleString()}
      </p>
    );
  };

  return (
    <div data-admin-page="overview" className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <DotHeading as="h1" size="page">
            Admin overview
          </DotHeading>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            System metrics, question bank management, and pending queues.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData({ force: true })}
          disabled={isRefreshing}
          className={`relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-[14px] border text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer ${
            glassEnabled
              ? 'ag-flat-card hover:border-[#E8353B]/40'
              : 'bg-[var(--card)] hover:bg-[var(--surface-hover)] border-[var(--border)]'
          }`}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Registered users (includes active guests — shared with Users page) */}
        <GlassCard variant="glass" padding="md" className="col-span-2 flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Total accounts
            </span>
            <Users size={16} className="text-[#E8353B] shrink-0" />
          </div>
          {renderCardMetric(
            usersAndPlansCard,
            (d: OverviewUsersAndPlansSnapshot) => d.users.totalUsers,
            () => void loadUsersAndPlansCard(true),
            'admin-overview-total-users'
          )}
          {(profileLoading || usersAndPlansCard.loading) && !usersAndPlansCard.data ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-2" aria-label="Loading user breakdown">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ) : usersAndPlansCard.data && !usersAndPlansCard.error ? (
            (() => {
              const u = usersAndPlansCard.data.users;
              const freeVal = u.freeCount;
              const proVal = u.proCount;
              const plusVal = u.plusCount;
              const guestVal = u.guestCount;
              const hasAnyPlanChip =
                typeof freeVal === 'number' ||
                typeof proVal === 'number' ||
                typeof plusVal === 'number' ||
                typeof guestVal === 'number';
              if (!hasAnyPlanChip) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {typeof freeVal === 'number' && (
                    <Pill tone="neutral">Free {freeVal.toLocaleString()}</Pill>
                  )}
                  {typeof proVal === 'number' && (
                    <Pill tone="accent">Pro {proVal.toLocaleString()}</Pill>
                  )}
                  {typeof plusVal === 'number' && (
                    <Pill tone="warning">Plus {plusVal.toLocaleString()}</Pill>
                  )}
                  {typeof guestVal === 'number' && (
                    <Pill tone="neutral">
                      {pluralize(guestVal, 'guest', 'guests')}
                    </Pill>
                  )}
                </div>
              );
            })()
          ) : null}
          {isSuperAdmin ? (
            <Link
              to="/admin/users"
              className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 mt-auto pt-1 transition-colors"
            >
              <span>Manage users</span>
              <ArrowRight size={12} />
            </Link>
          ) : (
            <span className="font-heading text-[12px] text-[var(--muted)] mt-auto pt-1">
              Platform accounts
            </span>
          )}
        </GlassCard>

        {/* 2. Questions in pool */}
        <GlassCard variant="glass" padding="md" className="flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[13px] text-[var(--muted)]">
              Questions in pool
            </span>
            <Database size={16} className="text-[var(--text)] shrink-0" />
          </div>
          {renderCardMetric(
            questionBankCard,
            (d) => d.totalQuestions,
            () => void loadQuestionBankCard(true),
            'admin-overview-total-questions'
          )}
          {(profileLoading || questionBankCard.loading) && !questionBankCard.data ? (
            <Skeleton className="h-3.5 w-32 mb-2" />
          ) : questionBankCard.data &&
            !questionBankCard.error &&
            typeof questionBankCard.data.totalUniversities === 'number' &&
            typeof questionBankCard.data.liveUniversities === 'number' ? (
            <div className="text-[11px] font-mono text-[var(--muted)] mb-2 ag-tabular">
              {questionBankCard.data.liveUniversities} of {questionBankCard.data.totalUniversities}{' '}
              universities live
            </div>
          ) : null}
          <Link
            to="/admin/questions"
            className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 mt-auto pt-1 transition-colors"
          >
            <span>Inspect questions</span>
            <ArrowRight size={12} />
          </Link>
        </GlassCard>

        {/* 3. Test attempts */}
        <GlassCard variant="glass" padding="md" className="flex flex-col justify-between min-h-[144px]">
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
            {attemptsCard.data
              ? pluralize(attemptsCard.data.totalAttempts, 'submission')
              : 'Student submissions'}
          </span>
        </GlassCard>

        {/* 4. Pending applications */}
        <GlassCard variant="glass" padding="md" className="flex flex-col justify-between min-h-[144px]">
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
            className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 mt-auto pt-1 transition-colors"
          >
            <span>Review queue</span>
            <ArrowRight size={12} />
          </Link>
        </GlassCard>

        {/* 5. Pending payments */}
        <GlassCard variant="glass" padding="md" className="flex flex-col justify-between min-h-[144px]">
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
            className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 mt-auto pt-1 transition-colors"
          >
            <span>Verify payments</span>
            <ArrowRight size={12} />
          </Link>
        </GlassCard>

        {/* 6. Pending reviews */}
        <GlassCard variant="glass" padding="md" className="col-span-2 md:col-span-1 lg:col-span-2 flex flex-col justify-between min-h-[144px]">
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
            className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 mt-auto pt-1 transition-colors"
          >
            <span>Moderate reviews</span>
            <ArrowRight size={12} />
          </Link>
        </GlassCard>
      </div>

      {/* ─── SUBSCRIPTION ANALYTICS (FREE / PRO / PLUS) ──────────────────────── */}
      <GlassCard variant="glass" padding="md" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <DotHeading as="h2" size="section">
              Boardly Plans Snapshot
            </DotHeading>
          </div>
          {isSuperAdmin && (
            <Link
              to="/admin/plans"
              className="font-heading text-[12px] text-[#E8353B] hover:underline inline-flex items-center gap-1"
            >
              <span>Edit plans &amp; pricing</span>
              <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {(profileLoading || usersAndPlansCard.loading) && !usersAndPlansCard.data ? (
          <div
            data-testid="plans-snapshot-loading"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs"
            aria-label="Loading plan analytics"
          >
            {[
              { label: 'Active Free', border: 'border-[var(--border)]', labelClass: 'text-[var(--muted)]' },
              { label: 'Active Pro', border: 'border-[#E8353B]/30', labelClass: 'text-[#E8353B]' },
              { label: 'Active Plus', border: 'border-amber-500/40', labelClass: 'text-amber-600 dark:text-amber-400' },
              { label: 'Expiring ≤7d', border: 'border-[var(--border)]', labelClass: 'text-[var(--muted)]' },
              { label: 'Pro / Plus PKR', border: 'border-[var(--border)]', labelClass: 'text-[var(--muted)]' },
              { label: 'Pro → Plus', border: 'border-[var(--border)]', labelClass: 'text-[var(--muted)]' },
            ].map((tile) => (
              <div key={tile.label} className={`ag-flat-card p-3 rounded-2xl border ${tile.border}`}>
                <div className={`font-mono text-[10px] uppercase ${tile.labelClass}`}>{tile.label}</div>
                <Skeleton className="h-7 w-14 mt-1.5" />
              </div>
            ))}
          </div>
        ) : (() => {
          const plansErr = usersAndPlansCard.error ?? usersAndPlansCard.data?.plansError ?? null;
          const plans = usersAndPlansCard.data?.plans ?? null;
          if (plansErr || !plans) {
            return (
              <div
                data-testid="plans-snapshot-error"
                className="p-3.5 rounded-[16px] ag-flat-card border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="truncate">
                    {plansErr
                      ? `${plansErr.source} (${plansErr.status}): ${plansErr.message}`
                      : 'Plan analytics unavailable.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadUsersAndPlansCard(true)}
                  className="underline font-bold shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="ag-flat-card p-3 rounded-2xl border border-[var(--border)]">
                <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Active Free</div>
                <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1 tabular-nums">
                  {plans.freeCount.toLocaleString()}
                </div>
              </div>
              <div className="ag-flat-card p-3 rounded-2xl border border-[#E8353B]/35">
                <div className="font-mono text-[10px] uppercase text-[#E8353B]">Active Pro</div>
                <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1 tabular-nums">
                  {plans.proCount.toLocaleString()}
                </div>
              </div>
              <div className="ag-flat-card p-3 rounded-2xl border border-amber-500/40">
                <div className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400">
                  Active Plus
                </div>
                <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1 tabular-nums">
                  {plans.plusCount.toLocaleString()}
                </div>
              </div>
              <div className="ag-flat-card p-3 rounded-2xl border border-[var(--border)]">
                <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Expiring ≤7d</div>
                <div className="font-dot text-xl font-extrabold text-[var(--text)] mt-1 tabular-nums">
                  {plans.expiringSoonCount.toLocaleString()}
                </div>
              </div>
              <div className="ag-flat-card p-3 rounded-2xl border border-[var(--border)]">
                <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Pro / Plus PKR</div>
                <div className="font-mono text-[12px] font-bold text-[var(--text)] mt-1.5 tabular-nums">
                  {`${plans.proRevenuePkr.toLocaleString()} / ${plans.plusRevenuePkr.toLocaleString()}`}
                </div>
              </div>
              <div className="ag-flat-card p-3 rounded-2xl border border-[var(--border)]">
                <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Pro → Plus</div>
                <div className="font-dot text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  {plans.proToPlusConversions.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })()}
      </GlassCard>

      {/* ─── WINGMATES RADAR (ALL USERS LIVE FEED + FILTERS + SEND REMINDER) ─── */}
      <GlassCard
        variant="glass"
        padding="md"
        data-testid="wingmates-radar-section"
        aria-labelledby="wingmates-radar-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Cockpit Live Feed · All Students
            </span>
            <DotHeading as="h2" size="section" className="mt-0.5">
              <span id="wingmates-radar-heading">Wingmates Radar</span>
            </DotHeading>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Segmented<RadarFilterId>
              ariaLabel="Wingmates Radar filters"
              value={radarFilter}
              onChange={setRadarFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'at_risk', label: 'At risk' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />

            <button
              type="button"
              onClick={() => void loadWingmatesRadar()}
              disabled={radarLoading}
              className="p-2 rounded-full ag-flat-card text-[var(--text)] cursor-pointer disabled:opacity-50"
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
          {(
            [
              {
                label: 'Practicing now',
                value: radarCounters?.practicingNow,
                color: 'var(--rw-green)',
              },
              {
                label: 'Streak at risk',
                value: radarCounters?.streakAtRisk,
                color: 'var(--rw-gold)',
              },
              {
                label: 'Inactive 2+ days',
                value: radarCounters?.inactive2PlusDays,
                color: 'var(--rw-red)',
              },
            ] as const
          ).map((counter) => (
            <div
              key={counter.label}
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
                {counter.label}
              </span>
              {(profileLoading || radarLoading) && !radarCounters ? (
                <div
                  className="h-6 w-12 rounded-md animate-pulse mt-1"
                  style={{ backgroundColor: 'var(--pill-card-bg)' }}
                />
              ) : radarError ||
                !radarCounters ||
                typeof counter.value !== 'number' ||
                !Number.isFinite(counter.value) ? (
                <span
                  className="font-mono text-[11px] font-bold mt-1"
                  style={{ color: 'var(--rw-red)' }}
                >
                  Unavailable
                </span>
              ) : (
                <span
                  className="font-dot text-lg sm:text-xl font-black tabular-nums mt-0.5"
                  style={{ color: counter.color }}
                >
                  {counter.value.toLocaleString()}
                </span>
              )}
            </div>
          ))}
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
      </GlassCard>

      {/* ─── REGISTERED USERS PREVIEW (SUPER ADMIN ONLY) ───────────────────── */}
      {isSuperAdmin && (
        <GlassCard variant="glass" padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#E8353B] shrink-0" />
              <DotHeading as="h2" size="section" className="flex items-center gap-1.5">
                <span>Users directory</span>
                {(profileLoading || usersAndPlansCard.loading) && !usersAndPlansCard.data ? (
                  <Skeleton className="inline-block h-4 w-10" />
                ) : usersAndPlansCard.error || !usersAndPlansCard.data ? (
                  <span className="text-xs font-mono text-[var(--red)]">(Error)</span>
                ) : (
                  <span className="tabular-nums ag-tabular">
                    ({usersAndPlansCard.data.users.totalUsers.toLocaleString()})
                  </span>
                )}
              </DotHeading>
            </div>
            <Link
              to="/admin/users"
              className="font-heading text-[12px] font-bold text-[#E8353B] hover:underline flex items-center gap-1"
            >
              <span>Open full users directory</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {(profileLoading || usersAndPlansCard.loading) && !usersAndPlansCard.data ? (
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
          ) : usersAndPlansCard.error || !usersAndPlansCard.data ? (
            <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
              <span>
                {usersAndPlansCard.error?.source} ({usersAndPlansCard.error?.status}):{' '}
                {usersAndPlansCard.error?.message}
              </span>
              <button
                type="button"
                onClick={() => void loadUsersAndPlansCard(true)}
                className="underline font-bold ml-3 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : usersAndPlansCard.data.users.previewUsers === null ? (
            <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
              <span>Could not load users directory preview.</span>
              <button
                type="button"
                onClick={() => void loadUsersAndPlansCard(true)}
                className="underline font-bold ml-3 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : usersAndPlansCard.data.users.previewUsers.length === 0 ? (
            <p className="text-xs font-mono text-[var(--muted)] py-2">
              No users found in directory.
            </p>
          ) : (
            <div
              data-testid="admin-overview-users-list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
            >
              {usersAndPlansCard.data.users.previewUsers.slice(0, 6).map((u) => {
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
        </GlassCard>
      )}

      {/* ─── QUESTIONS PER SUBJECT BREAKDOWN (ONE UNIFIED LIST, NOT 40 CARDS) ── */}
      <GlassCard variant="glass" padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <DotHeading as="h2" size="section">
            Questions by subject
          </DotHeading>
          <div className="flex items-center gap-2">
            {(profileLoading || questionBankCard.loading) && !questionBankCard.data ? (
              <Skeleton className="h-3.5 w-28" />
            ) : questionBankCard.data && typeof questionBankCard.data.totalQuestions === 'number' ? (
              <Pill tone="neutral">
                Live counts · {questionBankCard.data.totalQuestions.toLocaleString()} MCQs
              </Pill>
            ) : null}
            <button
              type="button"
              onClick={() => void loadQuestionBankCard(true)}
              disabled={questionBankCard.loading}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Refresh subject counts"
            >
              <RefreshCw size={13} className={questionBankCard.loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {(profileLoading || questionBankCard.loading) && !questionBankCard.data ? (
          <div className="ag-flat-card rounded-[18px] divide-y divide-[var(--border)] overflow-hidden">
            {CORE_SUBJECTS.map((subj) => (
              <div
                key={subj}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <span className="font-heading text-[13px] text-[var(--muted)]">{subj}</span>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : questionBankCard.error || !questionBankCard.data ? (
          <div className="p-3 rounded-[14px] ag-flat-card border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
            <span>
              {questionBankCard.error
                ? `${questionBankCard.error.source} (${questionBankCard.error.status}): ${questionBankCard.error.message}`
                : 'Subject breakdown unavailable.'}
            </span>
            <button
              type="button"
              onClick={() => void loadQuestionBankCard(true)}
              className="underline font-bold ml-3 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : questionBankCard.data && questionBankCard.data.subjects.length === 0 ? (
          <div className="p-3 rounded-[14px] ag-flat-card border border-[var(--border)] text-[var(--muted)] text-xs font-mono flex items-center justify-between">
            <span>
              {questionBankCard.data.totalQuestions > 0
                ? 'Subject breakdown unavailable for this question bank snapshot.'
                : 'No questions recorded by subject yet.'}
            </span>
            <button
              type="button"
              onClick={() => void loadQuestionBankCard(true)}
              className="underline font-bold ml-3 text-[var(--text)] cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="ag-flat-card rounded-[18px] overflow-hidden">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 border-collapse">
              {(questionBankCard.data?.subjects ?? []).map((entry) => (
                <li
                  key={entry.subject}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-[var(--border)] hover:bg-[var(--surface-hover)]/40 transition-colors"
                >
                  <span className="font-heading text-[13px] text-[var(--text)]">
                    {entry.subject}
                  </span>
                  <span className="tabular-nums ag-tabular text-[14px] font-bold text-[var(--text)] shrink-0">
                    {entry.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {/* ─── SUPERADMIN-ONLY CONTROLS ────────────────────────────────────────── */}
      {isSuperAdmin && (
        <>
          {/* Broadcast Announcements */}
          <GlassCard variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8353B]/12 border border-[#E8353B]/30 flex items-center justify-center text-[#E8353B] shrink-0">
                <Megaphone size={20} />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2 flex-wrap">
                  <DotHeading as="div" size="section">Superadmin Announcements</DotHeading>
                  <Pill tone="accent">Broadcast</Pill>
                </h2>
                <p className="text-[12px] text-[var(--muted)] mt-0.5">
                  Post announcements to every Boardly student. Appears instantly in their in-app Notifications page.
                </p>
              </div>
            </div>
            <Link
              to="/admin/announcements"
              className="px-4 py-2.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>Post &amp; Manage Announcements</span>
              <ArrowRight size={14} />
            </Link>
          </GlassCard>

          {/* Store Pricing Control */}
          <GlassCard variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8353B]/12 border border-[#E8353B]/30 flex items-center justify-center text-[#E8353B] shrink-0">
                <KobanIcon size={20} decorative />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2 flex-wrap">
                  <DotHeading as="div" size="section">Store Pricing &amp; Cosmetics Manager</DotHeading>
                  <Pill tone="accent">Super Admin</Pill>
                </h2>
                <p className="text-[12px] text-[var(--muted)] mt-0.5">
                  Bulk update Koban prices with batched writes, preview before applying, toggle active items, and audit price history.
                </p>
              </div>
            </div>
            <Link
              to="/admin/pricing"
              className="px-4 py-2.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>Open Store Pricing</span>
              <ArrowRight size={14} />
            </Link>
          </GlassCard>

          {/* Boardly Rewards Mode Switch */}
          <GlassCard
            variant="glass"
            padding="md"
            data-testid="admin-rewards-mode-card"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8353B]/12 border border-[#E8353B]/30 flex items-center justify-center text-[#E8353B] shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] flex items-center gap-2 flex-wrap">
                    <DotHeading as="div" size="section">Rewards</DotHeading>
                    <Pill tone="accent">Super Admin</Pill>
                  </h2>
                  <p className="text-[12px] text-[var(--muted)] mt-0.5">
                    Control who can claim daily check-ins, MCQ milestones, and referral bonuses on{' '}
                    <Link to="/rewards" className="text-[var(--text)] underline">
                      /rewards
                    </Link>
                    . Changes apply immediately.
                  </p>
                </div>
              </div>

              {(profileLoading || rewardsModeLoading) && !rewardsMode ? (
                <div
                  data-testid="rewards-mode-loading"
                  className="inline-flex items-center gap-1.5 p-1.5 rounded-[14px] ag-flat-card shrink-0"
                  aria-label="Loading rewards mode"
                >
                  <Skeleton className="h-8 w-14 rounded-[10px]" />
                  <Skeleton className="h-8 w-32 rounded-[10px]" />
                  <Skeleton className="h-8 w-20 rounded-[10px]" />
                </div>
              ) : (
                <div
                  role="group"
                  aria-label="Rewards mode switch"
                  data-testid="rewards-mode-segmented-control"
                  className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 rounded-[14px] ag-flat-card shrink-0"
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
                        className={`px-3.5 py-2 rounded-[10px] text-[12px] font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#E8353B] text-white shadow-sm'
                            : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              data-testid="admin-rewards-health-panel"
              className="ag-flat-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[16px]"
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                {(profileLoading || rewardsHealthLoading) && !rewardsHealth ? (
                  <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                ) : rewardsHealth?.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="min-w-0 text-[12px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-[var(--text)]">
                      Reward credit health:
                    </span>
                    {(profileLoading || rewardsHealthLoading) && !rewardsHealth ? (
                      <span
                        data-testid="admin-rewards-health-loading"
                        className="inline-block h-5 w-20 rounded-full ag-skeleton"
                        aria-label="Loading rewards health"
                      />
                    ) : (
                      <span
                        data-testid="admin-rewards-health-status"
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          rewardsHealth?.ok
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }`}
                      >
                        {checkingRewardsHealth
                          ? 'Checking…'
                          : rewardsHealth
                          ? rewardsHealth.ok
                            ? 'Healthy'
                            : rewardsHealth.reason
                          : 'Unavailable'}
                      </span>
                    )}
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
                <span>{checkingRewardsHealth ? 'Checking…' : 'Check Health'}</span>
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
          </GlassCard>

          {/* Seed Balanced Question Pool Tool */}
          <GlassCard variant="glass" padding="md" className="flex flex-col gap-4">
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
          </GlassCard>

          {/* Audit Trail Card */}
          <GlassCard variant="glass" padding="md" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DotHeading as="h2" size="section">
                Recent audit trail
              </DotHeading>
              <Link
                to="/admin/audit-logs"
                className="font-heading text-[12px] text-[var(--text)] hover:text-[#E8353B] flex items-center gap-1 transition-colors"
              >
                <span>View all logs</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {(profileLoading || recentLogsCard.loading) && !recentLogsCard.data ? (
              <div className="space-y-2" aria-label="Loading audit logs">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="ag-list-row p-3 rounded-[16px] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <Skeleton className="h-5 w-32 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentLogsCard.error && !recentLogsCard.data ? (
              <div className="p-3 rounded-[14px] ag-flat-card border border-[var(--red)]/40 text-[var(--red)] text-xs font-mono flex items-center justify-between">
                <span>
                  {recentLogsCard.error.source} ({recentLogsCard.error.status}):{' '}
                  {recentLogsCard.error.message}
                </span>
                <button
                  type="button"
                  onClick={() => void loadRecentLogs(true)}
                  className="underline font-bold ml-3 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : !recentLogsCard.data || recentLogsCard.data.length === 0 ? (
              <p className="font-heading text-[13px] text-[var(--muted)] py-4 text-center">
                No admin actions yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogsCard.data.map((log, i) => (
                  <div
                    key={log.id || i}
                    className="ag-list-row p-3 rounded-[16px] flex items-center justify-between gap-3 text-[13px] font-heading"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                      <Pill tone="neutral" title={log.action}>
                        {formatAuditActionLabel(log.action)}
                      </Pill>
                      <span className="text-[var(--text)] truncate">
                        {log.targetEmail || log.targetUid || log.adminEmail}
                      </span>
                    </div>
                    <span className="text-[12px] text-[var(--muted)] shrink-0 ag-tabular">
                      {formatLogTime(log)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
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
              ? This takes effect immediately.
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
                className="px-4 py-2 rounded-[12px] bg-[#E8353B] hover:bg-[#D4292F] text-white text-[13px] font-heading font-bold cursor-pointer"
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
