import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBodyScrollLock, safetyCleanupScrollLocks } from '@/utils/scrollLock';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { BoardlyCoPilotCard } from '@/components/dashboard/BoardlyCoPilotCard';
import {
  Flame,
  ArrowRight,
  CheckCircle2,
  X,
  Crown,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Award,
  LayoutGrid,
  Bookmark,
} from 'lucide-react';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { formatPlanLabel } from '@/lib/planTier';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import {
  startTestSessionWithLimit,
  fetchDailyUsageFromServer,
  DailyTestLimitError,
} from '@/services/testLimits';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import {
  fetchUniversities,
  getInitialCachedUniversities,
  fetchUniversityTopics,
  fetchMcqs,
  verifyMcqAnswers,
  submitMcqReport,
  getUniversityTestSpec,
  computeD1CockpitStats,
  saveD1UniversityAttempt,
  type D1WeakChapterItem,
} from '@/services/universityMcqService';
import {
  computeStreakData,
  getLocalStreakActivityMap,
} from '@/services/streakEngine';
import {
  type D1UniversityRow,
  type D1McqRow,
} from '@/constants/d1Universities';
import { MathText } from '@/components/ui/MathText';
import { repairSplitOrGarbledMcqOptions } from '@/lib/math';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { UniversityGridSkeleton } from '@/components/ui/Skeleton';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';
import type { AttemptQuestion } from '@/types/index';
import type { GradedAttemptQuestion } from '@/services/ambassadorTestService';

import { MyCertificatesSection } from '@/pages/dashboard/MyCertificatesPage';
import { AdSlot } from '@/components/AdSlot';
import { RotatingBoardlyAd } from '@/components/BoardlyAd';
import { AD_SLOTS } from '@/config/ads';
import {
  UniversityLogoBox,
  UNIVERSITY_LOGO_RETRY_DELAYS_MS,
  appendLogoRetryQuery,
  clearFailedUniversityLogoCache,
  markUniversityLogoCached,
  normalizeUniversityLogoUrl,
  preloadUniversityLogosInBatches,
  rememberUniversityLogoUrls,
  getUniversityInitials,
} from '@/components/ui/UniversityLogoBox';

const UniversityCardLogo = memo(function UniversityCardLogo({
  logoUrl,
  name,
  variant,
  eager = false,
}: {
  logoUrl?: string | null;
  name: string;
  variant: 'badge' | 'hero';
  eager?: boolean;
}) {
  const cleanUrl = normalizeUniversityLogoUrl(logoUrl);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [permanentlyFailed, setPermanentlyFailed] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryAttempt(0);
    setIsRetrying(false);
    setPermanentlyFailed(false);
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [cleanUrl]);

  // Recover automatically if connection comes back online after exhausting retries
  useEffect(() => {
    if (!permanentlyFailed || !cleanUrl || typeof window === 'undefined') return;
    const onOnline = () => {
      clearFailedUniversityLogoCache(cleanUrl);
      setPermanentlyFailed(false);
      setIsRetrying(false);
      setRetryAttempt(1);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [permanentlyFailed, cleanUrl]);

  const scheduleRetry = useCallback(() => {
    if (!cleanUrl || retryTimerRef.current) return;
    if (retryAttempt < UNIVERSITY_LOGO_RETRY_DELAYS_MS.length) {
      const delay = UNIVERSITY_LOGO_RETRY_DELAYS_MS[retryAttempt];
      setIsRetrying(true);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        setRetryAttempt((prev) => prev + 1);
      }, delay);
    } else {
      setIsRetrying(false);
      setPermanentlyFailed(true);
    }
  }, [cleanUrl, retryAttempt]);

  // Catch any image that failed before React attached the onError handler
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !cleanUrl || permanentlyFailed || isRetrying) return;
    if (el.complete && el.naturalWidth === 0) {
      scheduleRetry();
    }
  }, [cleanUrl, retryAttempt, permanentlyFailed, isRetrying, scheduleRetry]);

  const activeSrc = cleanUrl ? appendLogoRetryQuery(cleanUrl, retryAttempt) : '';
  const showLogo = Boolean(activeSrc && !permanentlyFailed);
  const initials = getUniversityInitials(name);
  const sizePx = variant === 'badge' ? 38 : 128;

  if (showLogo) {
    return (
      <img
        ref={imgRef}
        src={activeSrc}
        alt={name}
        width={sizePx}
        height={sizePx}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          setIsRetrying(false);
          setPermanentlyFailed(false);
          markUniversityLogoCached(cleanUrl);
        }}
        onError={scheduleRetry}
        className={variant === 'badge' ? 'uni-lg-badge-img' : 'uni-lg-big-logo-img'}
        style={isRetrying ? { visibility: 'hidden' } : undefined}
      />
    );
  }

  return (
    <span
      className={variant === 'badge' ? 'uni-lg-badge-initials' : 'uni-lg-big-logo-initials'}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
});

const PKTMidnightCountdown = memo(function PKTMidnightCountdown() {
  const [timeToMidnight, setTimeToMidnight] = useState('');

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktNow = new Date(now.getTime() + (pktOffset + localOffset) * 60 * 1000);

      const midnight = new Date(pktNow);
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - pktNow.getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeToMidnight(`${hrs}h ${mins}m`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, []);

  return <>{timeToMidnight || '24h 0m'}</>;
});

/**
 * Formats seconds as h:mm:ss (e.g. 3:00:00, not 180:00).
 */
function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function mapD1McqToAttemptQuestion(q: D1McqRow, verified?: { correctAnswer: string; explanation: string }): AttemptQuestion {
  const letter = String(verified?.correctAnswer || q.correct_answer || 'A').toUpperCase();
  const correctIdx = letter === 'B' ? 1 : letter === 'C' ? 2 : letter === 'D' ? 3 : 0;
  return {
    id: q.id,
    q: q.question,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    correct: correctIdx,
    explain: verified?.explanation || q.explanation || '',
    subject: q.subject || 'General',
    chapter: q.topic || 'General',
    difficulty: q.difficulty || 'medium',
  };
}

export function OverviewPage() {
  const location = useLocation();
  const isOverviewRouteActive =
    location.pathname === '/dashboard' ||
    location.pathname === '/dashboard/' ||
    location.pathname === '/menu' ||
    location.pathname === '/dashboard/menu';
  const { user, profile, streak, loading: profileLoading } = useUserProfile();
  const { t, formatNumber } = useLanguage();
  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const isPlus = effectivePlan.isPlus;
  const currentPlanLabel = formatPlanLabel(effectivePlan.plan, {
    freeLabel: t('common.free'),
  });

  // Safety cleanup on mount to remove any leftover scroll lock on body/html
  useEffect(() => {
    safetyCleanupScrollLocks();
  }, []);

  // ── Universities State ──
  const initialCachedUnis = useMemo(() => {
    const cached = getInitialCachedUniversities();
    return cached
      ? [...cached].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      : null;
  }, []);
  const [universities, setUniversities] = useState<D1UniversityRow[]>(
    () => initialCachedUnis ?? []
  );
  const [loadingUniversities, setLoadingUniversities] = useState<boolean>(
    () => !initialCachedUnis || initialCachedUnis.length === 0
  );
  const [universitiesError, setUniversitiesError] = useState<string | null>(null);

  const loadUniversitiesFromD1 = useCallback(async (background = false, forceRefresh = false) => {
    if (!background) {
      setLoadingUniversities(true);
    }
    setUniversitiesError(null);
    try {
      const rows = await fetchUniversities(forceRefresh);
      if (Array.isArray(rows)) {
        const sorted = [...rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
        setUniversities(sorted);
      } else if (!background) {
        setUniversities([]);
      }
    } catch (err: any) {
      if (!background) {
        const rawMsg = String(err?.message || '');
        const cleanMsg = /d1|cloudflare|worker|firestore|firebase|database/i.test(rawMsg)
          ? 'Unable to load universities right now. Please try again.'
          : rawMsg || 'Unable to load universities right now. Please try again.';
        setUniversitiesError(cleanMsg);
      }
    } finally {
      setLoadingUniversities(false);
    }
  }, []);

  useEffect(() => {
    void loadUniversitiesFromD1(Boolean(initialCachedUnis && initialCachedUnis.length > 0));
  }, [loadUniversitiesFromD1, initialCachedUnis]);

  useEffect(() => {
    const handleUnisUpdated = () => {
      void loadUniversitiesFromD1(true, true);
    };
    window.addEventListener('boardly-universities-updated', handleUnisUpdated);
    return () => window.removeEventListener('boardly-universities-updated', handleUnisUpdated);
  }, [loadUniversitiesFromD1]);

  // ── Cockpit Stats (Questions Solved, Weak Chapters, Recent Attempts) ──
  const [statsVersion, setStatsVersion] = useState(0);

  useEffect(() => {
    const handleAttemptsUpdated = () => setStatsVersion((v) => v + 1);
    window.addEventListener('boardly-d1-attempts-updated', handleAttemptsUpdated);
    window.addEventListener('boardly-streak-updated', handleAttemptsUpdated);
    return () => {
      window.removeEventListener('boardly-d1-attempts-updated', handleAttemptsUpdated);
      window.removeEventListener('boardly-streak-updated', handleAttemptsUpdated);
    };
  }, []);

  const d1Stats = useMemo(
    () => computeD1CockpitStats(user?.uid, universities),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.uid, universities, statsVersion]
  );

  const [serverTestsStarted, setServerTestsStarted] = useState(0);

  useEffect(() => {
    if (isPro || !user?.uid) {
      setServerTestsStarted(0);
      return;
    }
    let cancelled = false;
    fetchDailyUsageFromServer(user.uid)
      .then((usage) => {
        if (!cancelled && usage && typeof usage.testsStarted === 'number') {
          setServerTestsStarted(usage.testsStarted);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPro, user?.uid, statsVersion]);

  const effectiveTodayTests = Math.max(d1Stats.todayTestsCount, serverTestsStarted);

  const testsRemaining = isPro
    ? 'Unlimited'
    : Math.max(0, FREE_DAILY_TESTS - effectiveTodayTests);

  const rawDisplayName = (
    profile?.display_name ||
    profile?.displayName ||
    profile?.realName ||
    profile?.name ||
    user?.displayName ||
    ''
  ).trim();
  const cleanFullName =
    rawDisplayName && rawDisplayName.toLowerCase() !== 'student'
      ? sanitizeStudentDisplayName(rawDisplayName, profile?.shortId || user?.uid)
      : profile?.username
      ? `@${profile.username}`
      : '';
  const firstName =
    cleanFullName && cleanFullName.toLowerCase() !== 'student'
      ? cleanFullName.split(' ')[0] || ''
      : '';
  const localStreak = useMemo(() => {
    if (!user?.uid) return 0;
    const localMap = getLocalStreakActivityMap(user.uid);
    const freezeActive = Boolean(
      (profile as { streakFreezeActive?: boolean } | null)?.streakFreezeActive
    );
    return computeStreakData(localMap, { freezeActive }).currentStreak;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile, statsVersion]);
  const profileStreak = Number.isFinite(Number(streak))
    ? Math.max(0, Math.floor(Number(streak)))
    : 0;
  const safeStreak = Math.max(profileStreak, localStreak);
  const filledBars = Math.min(7, safeStreak);

  // ── Active University Full-Screen Test Runner State ──
  const [activeUni, setActiveUni] = useState<D1UniversityRow | null>(null);
  const [uniTopicsTree, setUniTopicsTree] = useState<
    Array<{ subject: string; total: number; topics: Array<{ topic: string; count: number }> }>
  >([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Test Runner State
  const [testStage, setTestStage] = useState<'overview' | 'loading' | 'running' | 'results'>('overview');
  const [testMcqs, setTestMcqs] = useState<D1McqRow[]>([]);
  const [loadingMcqs, setLoadingMcqs] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedMap, setFlaggedMap] = useState<Record<string, boolean>>({});
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [verifiedMap, setVerifiedMap] = useState<
    Record<string, { correctAnswer: string; explanation: string }>
  >({});
  const [testResultSummary, setTestResultSummary] = useState<{
    totalQuestions: number;
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
    score: number;
    maxScore: number;
    accuracy: number;
  } | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);

  // Close non-running test setup popup if user navigates away while OverviewPage stays in KeepAlive
  useEffect(() => {
    if (!isOverviewRouteActive && activeUni && testStage !== 'running') {
      setActiveUni(null);
    }
  }, [isOverviewRouteActive, activeUni, testStage]);

  // Lock body scroll ONLY while the full-screen test popup is actually open and active
  const isTestPopupOpen = Boolean(activeUni && isOverviewRouteActive);
  useBodyScrollLock(isTestPopupOpen, 'overview-test-popup');

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    if (isTestPopupOpen) {
      document.body.setAttribute('data-fullscreen-modal-open', 'true');
      window.dispatchEvent(new Event('boardly:modal-change'));
      return () => {
        document.body.removeAttribute('data-fullscreen-modal-open');
        window.dispatchEvent(new Event('boardly:modal-change'));
      };
    } else {
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new Event('boardly:modal-change'));
    }
  }, [isTestPopupOpen]);

  // Intercept Browser Back and beforeunload while a test is actively running
  useEffect(() => {
    if (!activeUni || testStage !== 'running') return;

    window.history.pushState({ boardlyFullTestRunner: true }, '');

    const onPopState = () => {
      // Keep runner open and show exit confirmation instead of silently abandoning
      window.history.pushState({ boardlyFullTestRunner: true }, '');
      setConfirmExitOpen(true);
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [activeUni, testStage]);

  const handleRequestCloseRunner = useCallback(() => {
    if (testStage === 'running' && !submittingTest) {
      setConfirmExitOpen(true);
      return;
    }
    setConfirmExitOpen(false);
    setConfirmSubmitOpen(false);
    setMobilePaletteOpen(false);
    setActiveUni(null);
  }, [testStage, submittingTest]);

  const handleConfirmAbandonTest = useCallback(() => {
    setConfirmExitOpen(false);
    setConfirmSubmitOpen(false);
    setMobilePaletteOpen(false);
    setActiveUni(null);
    setTestStage('overview');
  }, []);

  const openUniversityBubble = useCallback(
    async (uni: D1UniversityRow, prefillSubject?: string, prefillTopic?: string) => {
      if (!uni || (Number(uni.mcq_count || 0) <= 0 && Number(uni.is_live || 0) <= 0)) return;
      setActiveUni(uni);
      setSelectedSubject(prefillSubject || 'all');
      setSelectedTopic(prefillTopic || 'all');
      setTestStage('overview');
      setTestError(null);
      setTestMcqs([]);
      setAnswers({});
      setFlaggedMap({});
      setMobilePaletteOpen(false);
      setConfirmSubmitOpen(false);
      setConfirmExitOpen(false);
      setTestResultSummary(null);
      setLoadingTopics(true);

      try {
        const res = await fetchUniversityTopics(uni.id);
        setUniTopicsTree(Array.isArray(res?.subjects) ? res.subjects : []);
      } catch {
        setUniTopicsTree([]);
      } finally {
        setLoadingTopics(false);
      }
    },
    []
  );

  const startUniversityD1Test = useCallback(
    async (uni: D1UniversityRow, subjectFilter: string, topicFilter: string) => {
      if (!uni || (Number(uni.mcq_count || 0) <= 0 && Number(uni.is_live || 0) <= 0)) return;
      const isUnlimitedUser = Boolean(isPro || effectivePlan.isSuperAdmin);
      if (!isUnlimitedUser && effectiveTodayTests >= FREE_DAILY_TESTS) {
        setTestError(
          `Daily test limit reached (${FREE_DAILY_TESTS}/${FREE_DAILY_TESTS} tests). Upgrade to Boardly Pro or Plus, or join a Study Crew to practice unlimited.`
        );
        return;
      }

      const spec = getUniversityTestSpec(uni);
      setLoadingMcqs(true);
      setTestError(null);
      setRemainingSeconds(spec.durationMinutes * 60);
      setElapsedSeconds(0);
      setTestStage('loading');
      try {
        // Enforce daily starter limit atomically on the server (/api/usage/daily/start-test)
        if (user?.uid) {
          const limitRes = await startTestSessionWithLimit({
            uid: user.uid,
            userEmail: user.email,
            isUnlimited: isUnlimitedUser,
            skipAttemptDocWrite: true,
            attemptPayload: {
              mode: 'university_d1',
              universityId: uni.id,
              subject: subjectFilter,
              topic: topicFilter,
            },
          });
          if (typeof limitRes.testsStarted === 'number') {
            setServerTestsStarted(limitRes.testsStarted);
          }
        }

        const res = await fetchMcqs({
          university_id: uni.id,
          subject: subjectFilter !== 'all' ? subjectFilter : undefined,
          topic: topicFilter !== 'all' ? topicFilter : undefined,
          limit: 100,
        });
        const list = Array.isArray(res?.mcqs) ? res.mcqs : [];
        if (list.length === 0) {
          setTestError('No questions found for the selected filter in this university.');
          setTestStage('overview');
          setLoadingMcqs(false);
          return;
        }
        setTestMcqs(list);
        setCurrentIndex(0);
        setAnswers({});
        setFlaggedMap({});
        setVerifiedMap({});
        setTestResultSummary(null);
        setRemainingSeconds(spec.durationMinutes * 60);
        setElapsedSeconds(0);
        setTestStage('running');
      } catch (err: any) {
        if (
          err instanceof DailyTestLimitError ||
          err?.code === 'DAILY_TESTS_LIMIT_EXCEEDED'
        ) {
          setServerTestsStarted(FREE_DAILY_TESTS);
          setTestError(
            err?.message ||
              `Daily test limit reached (${FREE_DAILY_TESTS}/${FREE_DAILY_TESTS} tests). Upgrade to Boardly Pro or Plus, or join a Study Crew to practice unlimited.`
          );
          setTestStage('overview');
          return;
        }
        const rawMsg = String(err?.message || '');
        const cleanMsg = /d1|cloudflare|worker|firestore|firebase|database/i.test(rawMsg)
          ? 'Failed to load test questions. Please try again.'
          : rawMsg || 'Failed to load test questions. Please try again.';
        setTestError(cleanMsg);
        setTestStage('overview');
      } finally {
        setLoadingMcqs(false);
      }
    },
    [effectiveTodayTests, effectivePlan.isSuperAdmin, isPro, user?.email, user?.uid]
  );

  const submitUniversityD1Test = useCallback(async () => {
    if (!activeUni || testMcqs.length === 0 || submittingTest) return;
    setConfirmSubmitOpen(false);
    setMobilePaletteOpen(false);
    setSubmittingTest(true);
    try {
      const spec = getUniversityTestSpec(activeUni);
      const qIds = testMcqs.map((q) => q.id);
      const verified = await verifyMcqAnswers(qIds);

      let answeredCount = 0;
      let correctCount = 0;
      let wrongCount = 0;
      const breakdownMap = new Map<
        string,
        { subject: string; topic: string; answered: number; correct: number }
      >();
      const nextVerifiedMap: Record<string, { correctAnswer: string; explanation: string }> = {};

      for (const q of testMcqs) {
        const userAns = answers[q.id];
        const v = verified[q.id];
        const correctLetter = String(v?.correctAnswer || q.correct_answer || 'A').toUpperCase();
        const explanation = String(v?.explanation ?? q.explanation ?? '');
        nextVerifiedMap[q.id] = { correctAnswer: correctLetter, explanation };

        if (userAns) {
          answeredCount += 1;
          const isCorrect = userAns === correctLetter;
          if (isCorrect) {
            correctCount += 1;
          } else {
            wrongCount += 1;
          }
          const subj = q.subject || 'General';
          const top = q.topic || 'General';
          const bKey = `${subj}::${top}`;
          const prev = breakdownMap.get(bKey);
          if (prev) {
            prev.answered += 1;
            if (isCorrect) prev.correct += 1;
          } else {
            breakdownMap.set(bKey, {
              subject: subj,
              topic: top,
              answered: 1,
              correct: isCorrect ? 1 : 0,
            });
          }
        }
      }

      const rawScore =
        correctCount * spec.positiveMarks - wrongCount * spec.negativeMarks;
      const score = Math.max(0, Math.round(rawScore * 100) / 100);
      const maxScore = testMcqs.length * spec.positiveMarks;
      const accuracy =
        testMcqs.length > 0 ? Math.round((correctCount / testMcqs.length) * 100) : 0;

      saveD1UniversityAttempt(user?.uid, {
        universityId: activeUni.id,
        universityName: activeUni.name,
        universitySlug: activeUni.slug,
        subject: selectedSubject !== 'all' ? selectedSubject : 'All Subjects',
        topic: selectedTopic !== 'all' ? selectedTopic : 'All Topics',
        totalQuestions: testMcqs.length,
        answeredCount,
        correctCount,
        wrongCount,
        score,
        maxScore,
        accuracy,
        durationSeconds: Math.max(1, elapsedSeconds),
        markingLabel: spec.markingLabel,
        topicBreakdown: Array.from(breakdownMap.values()),
      });

      setVerifiedMap(nextVerifiedMap);
      setTestResultSummary({
        totalQuestions: testMcqs.length,
        answeredCount,
        correctCount,
        wrongCount,
        score,
        maxScore,
        accuracy,
      });
      setTestStage('results');
    } finally {
      setSubmittingTest(false);
    }
  }, [activeUni, answers, elapsedSeconds, selectedSubject, selectedTopic, submittingTest, testMcqs, user?.uid]);

  // Countdown timer while university test is running
  useEffect(() => {
    if (testStage !== 'running') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void submitUniversityD1Test();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testStage, submitUniversityD1Test]);

  const handleDrillWeakChapter = useCallback(
    async (item: D1WeakChapterItem) => {
      if (!item.isUniversityLive) return;
      const uni = universities.find(
        (u) => u.id === item.universityId || u.slug.toLowerCase() === item.universitySlug.toLowerCase()
      );
      if (!uni || Number(uni.mcq_count || 0) <= 0) return;
      await openUniversityBubble(uni, item.subject, item.topic);
      await startUniversityD1Test(uni, item.subject, item.topic);
    },
    [openUniversityBubble, startUniversityD1Test, universities]
  );

  const handleRetakeFromRecent = useCallback(
    async (universityId: string, subject?: string, topic?: string) => {
      const uni = universities.find((u) => u.id === universityId);
      if (!uni || Number(uni.mcq_count || 0) <= 0) return;
      await openUniversityBubble(uni, subject || 'all', topic || 'all');
    },
    [openUniversityBubble, universities]
  );

  const handleReportCurrentMcq = async (mcq: D1McqRow) => {
    try {
      await submitMcqReport({
        mcq_id: mcq.id,
        university_id: mcq.university_id,
        reason: 'Flagged during university test',
        reported_by: user?.uid || 'student',
      });
      setReportNotice('Question reported for review.');
      setTimeout(() => setReportNotice(null), 3000);
    } catch {
      setReportNotice('Report saved.');
      setTimeout(() => setReportNotice(null), 2500);
    }
  };

  // Lazy-loaded PDF download handler for the Question Paper (on the test screen)
  const handleDownloadQuestionPaperPdf = useCallback(
    async (onProgress: (p: any) => void, signal?: AbortSignal) => {
      if (!activeUni || testMcqs.length === 0) return;
      const spec = getUniversityTestSpec(activeUni);
      const { exportTestToPdf } = await import('@/utils/testPdfExporter');
      const mappedQuestions: AttemptQuestion[] = testMcqs.map((q) => mapD1McqToAttemptQuestion(q));
      await exportTestToPdf({
        title: `${activeUni.name} Official Mock Test`,
        university: activeUni.name,
        markingScheme: spec.markingLabel,
        studentName: cleanFullName,
        studentEmail: user?.email || undefined,
        questions: mappedQuestions,
        signal,
        onProgress,
      });
    },
    [activeUni, cleanFullName, testMcqs, user?.email]
  );

  // Lazy-loaded PDF download handler for Answers + Score (on the results screen)
  const handleDownloadResultsPdf = useCallback(
    async (onProgress: (p: any) => void, signal?: AbortSignal) => {
      if (!activeUni || !testResultSummary || testMcqs.length === 0) return;
      const { exportDrillResultToPdf } = await import('@/utils/testPdfExporter');
      const gradedQuestions: GradedAttemptQuestion[] = testMcqs.map((q) => {
        const ver = verifiedMap[q.id];
        const correctLetter = (ver?.correctAnswer || q.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D';
        const chosen = answers[q.id] ?? null;
        return {
          id: q.id,
          question: q.question,
          optionA: q.option_a,
          optionB: q.option_b,
          optionC: q.option_c,
          optionD: q.option_d,
          correctOption: correctLetter,
          selectedOption: chosen,
          isCorrect: chosen !== null && chosen === correctLetter,
          explanation: ver?.explanation || q.explanation || '',
          topic: q.topic || 'General',
          difficulty: q.difficulty || 'medium',
        };
      });

      await exportDrillResultToPdf({
        testTitle: `${activeUni.name} Entry Test Result`,
        subject: selectedSubject !== 'all' ? selectedSubject : activeUni.name,
        studentName: cleanFullName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        score: testResultSummary.correctCount,
        totalQuestions: testResultSummary.totalQuestions,
        percentage: testResultSummary.accuracy,
        timeTakenSeconds: Math.max(1, elapsedSeconds),
        gradedQuestions,
        signal,
        onProgress,
      });
    },
    [activeUni, answers, cleanFullName, elapsedSeconds, selectedSubject, testMcqs, testResultSummary, verifiedMap]
  );

  const [showAllSoonUnis, setShowAllSoonUnis] = useState(false);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);
  const activeCarouselIdxRef = useRef(0);
  activeCarouselIdxRef.current = activeCarouselIdx;
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const liveUniversities = useMemo(
    () =>
      universities.filter(
        (u) => Number(u.mcq_count || 0) > 0 || Number(u.is_live || 0) > 0
      ),
    [universities]
  );

  const soonUniversities = useMemo(
    () =>
      universities.filter(
        (u) => !(Number(u.mcq_count || 0) > 0 || Number(u.is_live || 0) > 0)
      ),
    [universities]
  );

  // Cache logo URLs in memory and preload+decode ALL university logos (live + coming soon)
  // after first paint in small idle batches, starting with the visible card and its neighbors.
  // Keyed only on the stable logo-URL signature so swiping never restarts or cancels preloading.
  const universityLogoSignature = useMemo(
    () =>
      [...liveUniversities, ...soonUniversities]
        .map((u) => `${u.id}:${u.logo_url || ''}`)
        .join('|'),
    [liveUniversities, soonUniversities]
  );

  useEffect(() => {
    if (liveUniversities.length === 0 && soonUniversities.length === 0) return;
    rememberUniversityLogoUrls([...liveUniversities, ...soonUniversities]);

    const orderedUrls: string[] = [];
    const totalLive = liveUniversities.length;
    if (totalLive > 0) {
      const center = Math.max(0, Math.min(totalLive - 1, activeCarouselIdxRef.current));
      const pushIfPresent = (idx: number) => {
        if (idx >= 0 && idx < totalLive && liveUniversities[idx]?.logo_url) {
          orderedUrls.push(liveUniversities[idx].logo_url);
        }
      };
      pushIfPresent(center);
      for (let offset = 1; offset < totalLive; offset++) {
        pushIfPresent(center + offset);
        pushIfPresent(center - offset);
      }
    }
    for (const u of soonUniversities) {
      if (u.logo_url) orderedUrls.push(u.logo_url);
    }

    return preloadUniversityLogosInBatches(orderedUrls, { batchSize: 3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityLogoSignature]);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || liveUniversities.length <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setActiveCarouselIdx(0);
      return;
    }
    const ratio = Math.max(0, Math.min(1, el.scrollLeft / maxScroll));
    const idx = Math.round(ratio * (liveUniversities.length - 1));
    setActiveCarouselIdx(idx);
  }, [liveUniversities.length]);

  const scrollToCarouselIndex = useCallback((idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    setActiveCarouselIdx(idx);
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const flaggedCount = useMemo(
    () => Object.values(flaggedMap).filter(Boolean).length,
    [flaggedMap]
  );
  const unansweredCount = Math.max(0, testMcqs.length - answeredCount);
  const currentMcq = testMcqs[currentIndex];

  return (
    <div data-student-page="dashboard" className="cockpit-root w-full max-w-full min-w-0 box-border space-y-6">
      {/* b) Boardly Co-Pilot live message */}
      <section aria-label="Boardly Co-Pilot">
        <BoardlyCoPilotCard
          firstName={firstName}
          streak={safeStreak}
          recentAttempts={d1Stats.recentAttempts}
          weakChapters={d1Stats.weakChapters}
          questionsSolved={d1Stats.questionsSolved}
        />
      </section>

      {/* c) Greeting */}
      <section aria-label={t('nav.dashboard')}>
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-start"
          style={{ color: 'var(--text)' }}
        >
          {(() => {
            const hour = new Date().getHours();
            const greetingKey =
              hour < 12
                ? 'dashboard.greetingMorning'
                : hour < 17
                ? 'dashboard.greetingAfternoon'
                : 'dashboard.greetingEvening';
            if (firstName) {
              return (
                <>
                  {t(greetingKey, { name: firstName })}! {t('dashboard.readyToPractice')}
                </>
              );
            }
            if (profileLoading) {
              return (
                <>
                  <span
                    className="inline-block align-middle h-6 w-28 animate-pulse rounded-full bg-[var(--border)] me-2"
                    aria-label={t('common.loading')}
                  />
                  {t('dashboard.readyToPractice')}
                </>
              );
            }
            return t('dashboard.readyToPractice');
          })()}
        </h1>
      </section>

      {/* d & e) Liquid-glass stage: Choose your university carousel, coming-soon pill & stats */}
      <div className="uni-lg-stage">
        <div className="uni-lg-backdrop" aria-hidden="true">
          <div className="uni-lg-dotgrid" />
          <div className="uni-lg-blob uni-lg-blob--red" />
          <div className="uni-lg-blob uni-lg-blob--orange" />
        </div>

        <div className="uni-lg-content space-y-5">
          {/* d) Choose your university: horizontal snap carousel of LIVE liquid-glass cards */}
          <section
            id="choose-university-section"
            className="space-y-3"
            aria-label={t('dashboard.universitiesTitle')}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap px-4 sm:px-5">
              <div className="space-y-0.5 text-start">
                <h2
                  className="text-base sm:text-lg font-black tracking-tight"
                  style={{ color: 'var(--text)' }}
                >
                  {t('dashboard.universitiesTitle')}
                </h2>
                <p
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
                >
                  {t('dashboard.universitiesSubtitle')}
                </p>
              </div>
            </div>

            {loadingUniversities && universities.length === 0 ? (
              <div className="px-4 sm:px-5">
                <UniversityGridSkeleton count={3} />
              </div>
            ) : universitiesError ? (
              <div className="px-4 sm:px-5">
                <div
                  className="rounded-[28px] p-6 text-center space-y-3"
                  style={{
                    backgroundColor: 'var(--pill-card-bg)',
                    border: '1px solid var(--pill-card-border)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
                  >
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
                    >
                      {t('common.somethingWrong')}
                    </p>
                    <p
                      className="text-xs max-w-md mx-auto"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
                    >
                      {universitiesError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadUniversitiesFromD1()}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      backgroundColor: 'var(--accent)',
                      color: 'var(--text-on-accent)',
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>{t('common.retry')}</span>
                  </button>
                </div>
              </div>
            ) : universities.length === 0 ? (
              <div className="px-4 sm:px-5">
                <div
                  className="rounded-[28px] p-6 text-center space-y-1.5"
                  style={{
                    backgroundColor: 'var(--pill-card-bg)',
                    border: '1px solid var(--pill-card-border)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
                  >
                    {t('common.noResults')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Horizontal snap carousel of LIVE liquid-glass cards */}
                {liveUniversities.length > 0 && (
                  <>
                    <div
                      ref={carouselRef}
                      onScroll={handleCarouselScroll}
                      data-testid="live-universities-carousel"
                      className={`uni-lg-carousel${
                        liveUniversities.length === 1 ? ' uni-lg-carousel--single' : ''
                      }`}
                    >
                      {liveUniversities.map((uni, uniIdx) => {
                        const mcqCount = Math.max(0, Math.floor(Number(uni.mcq_count || 0)));
                        const isEagerLogo = uniIdx < 2;
                        return (
                          <button
                            key={uni.id}
                            type="button"
                            data-testid={`live-uni-tile-${uni.slug || uni.id}`}
                            onClick={() => void openUniversityBubble(uni)}
                            className="uni-lg-card"
                          >
                            {/* 3 floating glass bubbles */}
                            <span className="uni-lg-bubble uni-lg-bubble--1" aria-hidden="true" />
                            <span className="uni-lg-bubble uni-lg-bubble--2" aria-hidden="true" />
                            <span className="uni-lg-bubble uni-lg-bubble--3" aria-hidden="true" />

                            {/* 1. Top row: small logo badge + LIVE pill */}
                            <div className="uni-lg-top">
                              <span className="uni-lg-badge">
                                <UniversityCardLogo
                                  logoUrl={uni.logo_url}
                                  name={uni.name}
                                  variant="badge"
                                  eager={isEagerLogo}
                                />
                              </span>

                              <span className="uni-lg-live-pill">
                                <span className="uni-lg-live-dot" aria-hidden="true" />
                                <span>{t('common.live')}</span>
                              </span>
                            </div>

                            {/* 2. Big logo with breathing white glass disc */}
                            <div className="uni-lg-hero" aria-hidden="true">
                              <span className="uni-lg-disc" />
                              <span className="uni-lg-big-logo">
                                <UniversityCardLogo
                                  logoUrl={uni.logo_url}
                                  name={uni.name}
                                  variant="hero"
                                  eager={isEagerLogo}
                                />
                              </span>
                            </div>

                            {/* 3. Text: 50px dot-matrix MCQ count, MCQS label, 26px bold university name */}
                            <div className="uni-lg-meta">
                              <div className="uni-lg-count">
                                <span className="ltr-nums">{formatNumber(mcqCount)}</span>
                              </div>
                              <div className="uni-lg-mcqs-label">{t('nav.mcqs')}</div>
                              <div className="uni-lg-name" title={uni.name}>
                                {uni.name}
                              </div>
                            </div>

                            {/* 4. Start test glass pill with 40px white arrow circle */}
                            <div className="uni-lg-cta">
                              <span>{t('dashboard.startTest')}</span>
                              <span className="uni-lg-cta-circle" aria-hidden="true">
                                <ArrowRight size={17} strokeWidth={2.4} />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Pagination Dots */}
                    {liveUniversities.length > 1 && (
                      <div
                        className="uni-lg-dots px-4 sm:px-5"
                        role="tablist"
                        aria-label="University carousel slides"
                      >
                        {liveUniversities.map((uni, idx) => {
                          const isActive = idx === activeCarouselIdx;
                          return (
                            <button
                              key={uni.id}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              aria-label={`Slide ${idx + 1}: ${uni.name}`}
                              onClick={() => scrollToCarouselIndex(idx)}
                              className={`uni-lg-dot${isActive ? ' uni-lg-dot--active' : ''}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Glass pill "N more coming soon" that expands into chips */}
                {soonUniversities.length > 0 && (
                  <div className="space-y-2.5 pt-1 px-4 sm:px-5">
                    <button
                      type="button"
                      data-testid="coming-soon-pill-toggle"
                      onClick={() => setShowAllSoonUnis((prev) => !prev)}
                      aria-expanded={showAllSoonUnis}
                      className="uni-lg-glass-pill text-xs font-bold"
                    >
                      <span>
                        <span className="ltr-nums">{formatNumber(soonUniversities.length)}</span> · {t('dashboard.comingSoonBank')}
                      </span>
                      <span aria-hidden="true">{showAllSoonUnis ? '▴' : '▾'}</span>
                    </button>

                    {showAllSoonUnis && (
                      <div
                        className="flex flex-wrap items-center gap-2 pt-1"
                        data-testid="coming-soon-chips"
                      >
                        {soonUniversities.map((uni) => (
                          <span
                            key={uni.id}
                            className="uni-lg-glass-chip text-xs font-medium"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            <UniversityLogoBox
                              name={uni.name}
                              logoUrl={uni.logo_url}
                              size="xs"
                              eager
                            />
                            <span className="truncate max-w-[180px]">{uni.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* e) Stats bento (2×2): questions solved, 7-day streak, daily limit, current plan */}
          <section
            className="grid grid-cols-2 gap-3 sm:gap-3.5 px-4 sm:px-5"
            aria-label={t('profile.stats')}
            data-testid="stats-bento-grid"
          >
            <div className="uni-lg-glass-tile text-start">
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('dashboard.questionsSolved')}
              </span>
              <div className="space-y-0.5">
                <div
                  className="text-2xl sm:text-3xl font-black tabular-nums leading-none ltr-nums"
                  style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
                >
                  {formatNumber(d1Stats.questionsSolved)}
                </div>
                <p
                  className="text-[11px] truncate"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
                >
                  {t('dashboard.universitiesTitle')}
                </p>
              </div>
            </div>

            <div className="uni-lg-glass-tile text-start">
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('dashboard.studyStreak')}
                </span>
                <Flame size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="space-y-1.5">
                <div
                  className="text-xl sm:text-2xl font-black tabular-nums leading-none"
                  style={{ color: 'var(--text)' }}
                >
                  {safeStreak === 1
                    ? t('dashboard.streakDay')
                    : t('dashboard.streakDays', { count: formatNumber(safeStreak) })}
                </div>
                <div className="flex items-center gap-1" aria-hidden="true">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor:
                          i < filledBars ? 'var(--accent)' : 'var(--meter-off)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

        <div
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px] text-start"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('dashboard.dailyLimits')}
          </span>
          <div className="space-y-0.5">
            <div
              className="text-xl sm:text-2xl font-black tabular-nums leading-none ltr-nums"
              style={{ color: 'var(--text)' }}
            >
              {isPro ? t('common.unlimited') : `${formatNumber(Number(testsRemaining))} / ${formatNumber(FREE_DAILY_TESTS)}`}
            </div>
            <p
              className="text-[11px] truncate"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              {isPro ? (
                t('dashboard.unlimitedTests')
              ) : (
                <>
                  <PKTMidnightCountdown />
                </>
              )}
            </p>
          </div>
        </div>

        <div
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px] text-start"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('plans.yourPlan')}
            </span>
            {isPro && (
              <Crown
                size={14}
                className="shrink-0"
                style={{ color: isPlus ? '#F59E0B' : 'var(--accent)' }}
              />
            )}
          </div>
          <div className="space-y-0.5">
            <div
              className="text-xl sm:text-2xl font-black leading-none"
              style={{ color: isPlus ? '#F59E0B' : 'var(--text)' }}
            >
              {currentPlanLabel}
            </div>
            {isPlus || isPro ? (
              <p
                className="text-[11px] truncate"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
              >
                {t('plans.unlimitedPractice')}
              </p>
            ) : (
              <Link
                to="/dashboard/plans"
                className="inline-flex items-center gap-1 min-h-[44px] -my-2.5 py-2.5 text-[11px] font-bold hover:underline"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}
              >
                <span>{t('plans.upgradeToPro')}</span>
                <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
          </section>
        </div>
      </div>

      {/* f) Weak Chapters */}
      <div className="cv-auto">
        <WeakChapters
          chapters={d1Stats.weakChapters}
          onDrillChapter={(item) => void handleDrillWeakChapter(item)}
        />
      </div>

      {/* Rotating Boardly Ad in dashboard gap (hidden for Pro/Plus with ad-free ON) */}
      <RotatingBoardlyAd
        variant="card"
        slotKey="dashboard_overview_mid"
        wrapperClassName="cv-auto py-1"
      />

      {/* g) Recent Attempts */}
      <div className="cv-auto">
        <RecentAttempts
          attempts={d1Stats.recentAttempts}
          onRetakeUniversity={(uniId, subj, top) =>
            void handleRetakeFromRecent(uniId, subj, top)
          }
        />
      </div>

      {/* h) My Certificates */}
      <div className="cv-auto">
        <MyCertificatesSection compact={true} />
      </div>

      {/* ── FULL-SCREEN UNIVERSITY TEST RUNNER (Apple × Nothing OS 100dvh layout) ── */}
      {isTestPopupOpen &&
        activeUni &&
        typeof document !== 'undefined' &&
        document.body &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] nt-quiz-shell select-none"
            style={{ position: 'fixed', inset: 0, height: '100dvh', maxHeight: '100dvh', zIndex: 9999 }}
            data-fullscreen-modal="true"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeUni.name} Test Runner`}
          >
          {testStage === 'running' || testStage === 'loading' ? (
            <>
              {/* 1–4. CENTERED MAIN COLUMN (max-w 760px, fits 100dvh with no scrolling) */}
              <div className="nt-quiz-main">
                {/* 1. TOP BAR: round "SAT" chip (red text), timer chip, PDF icon button, close icon button */}
                <header className="nt-topbar">
                  <div className="nt-chip nt-chip--exam inline-flex items-center gap-2" title={activeUni.name}>
                    <UniversityLogoBox
                      name={activeUni.name}
                      logoUrl={activeUni.logo_url}
                      size="xs"
                      eager
                    />
                    <span>
                      {activeUni.name.replace(/\s*\(.*?\)\s*/g, '').trim() || activeUni.name}
                    </span>
                  </div>

                  <div className="nt-topbar-right">
                    <div
                      className={`nt-chip nt-chip--timer ${
                        remainingSeconds > 0 && remainingSeconds < 300
                          ? 'nt-chip--timer-urgent'
                          : ''
                      }`}
                      aria-label="Time remaining"
                    >
                      <Clock size={14} className="text-[#d71921] shrink-0" />
                      <span className="nt-doto">{formatDurationClock(remainingSeconds)}</span>
                    </div>

                    {testStage === 'running' && testMcqs.length > 0 && (
                      <PdfDownloadButton
                        onDownload={handleDownloadQuestionPaperPdf}
                        iconOnly
                        title="Download Test PDF"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleRequestCloseRunner}
                      aria-label="Close test runner"
                      title="Close test"
                      className="nt-chip nt-chip--icon"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </header>

                {/* STAGE B: SKELETON WHILE QUESTIONS LOAD */}
                {(testStage === 'loading' || (loadingMcqs && testStage !== 'running')) && (
                  <div
                    className="flex-1 min-h-0 flex flex-col gap-3"
                    aria-busy="true"
                    aria-label="Loading test questions"
                  >
                    <div className="nt-progress">
                      <div className="nt-progress-row">
                        <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
                        <div className="h-4 w-24 rounded-md skeleton-shimmer" />
                      </div>
                      <div className="h-3 w-full rounded-full skeleton-shimmer" />
                    </div>
                    <div className="nt-qcard space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-7 w-40 rounded-full skeleton-shimmer" />
                        <div className="h-7 w-20 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="space-y-2 pt-1">
                        <div className="h-4 w-full rounded-md skeleton-shimmer" />
                        <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
                        <div className="h-4 w-2/3 rounded-md skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="nt-options-grid">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="nt-option-card">
                          <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                          <div className="h-4 flex-1 rounded-md skeleton-shimmer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STAGE C: RUNNING TEST QUESTION & OPTIONS (Apple × Nothing OS) */}
                {testStage === 'running' && currentMcq && (
                  <>
                    {/* 2. PROGRESS: large question number on left, "Answered X/Y" on right, 2-row dot strip below */}
                    <section className="nt-progress" aria-label="Test progress">
                      <div className="nt-progress-row">
                        <span className="nt-progress-qnum nt-doto ltr-nums">
                          {currentIndex + 1} / {testMcqs.length}
                        </span>
                        <span className="nt-progress-answered">
                          {t('test.answered')} <span className="ltr-nums">{answeredCount}/{testMcqs.length}</span>
                        </span>
                      </div>

                      <div
                        className="nt-dots-grid"
                        style={
                          {
                            '--nt-dot-cols': Math.max(1, Math.ceil(testMcqs.length / 2)),
                          } as React.CSSProperties
                        }
                        role="tablist"
                        aria-label="Questions navigation strip"
                      >
                        {testMcqs.map((q, dotIdx) => {
                          const isCurrent = dotIdx === currentIndex;
                          const isDotAnswered = Boolean(answers[q.id]);
                          return (
                            <button
                              key={q.id}
                              type="button"
                              role="tab"
                              aria-selected={isCurrent}
                              aria-label={`Question ${dotIdx + 1}${
                                isDotAnswered ? ' (Answered)' : ''
                              }`}
                              onClick={() => setCurrentIndex(dotIdx)}
                              className={`nt-dot ${
                                isCurrent
                                  ? 'nt-dot--current'
                                  : isDotAnswered
                                  ? 'nt-dot--answered'
                                  : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    </section>

                    {/* 3. QUESTION CARD: rounded 28px card with subject tag pill, Flag pill button, and question text */}
                    <section className="nt-qcard" aria-label={`Question ${currentIndex + 1}`}>
                      <div className="nt-qcard-header">
                        <span
                          className="nt-subject-pill"
                          title={`${currentMcq.subject} · ${currentMcq.topic}`}
                        >
                          {currentMcq.subject}
                          {currentMcq.topic ? ` · ${currentMcq.topic}` : ''}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setFlaggedMap((prev) => ({
                              ...prev,
                              [currentMcq.id]: !prev[currentMcq.id],
                            }))
                          }
                          aria-pressed={Boolean(flaggedMap[currentMcq.id])}
                          className={`nt-flag-pill ${
                            flaggedMap[currentMcq.id] ? 'nt-flag-pill--active' : ''
                          }`}
                        >
                          <Bookmark
                            size={12}
                            fill={flaggedMap[currentMcq.id] ? 'currentColor' : 'none'}
                          />
                          <span>{flaggedMap[currentMcq.id] ? t('test.flagged') : t('test.flag')}</span>
                        </button>
                      </div>

                      <div className="nt-qcard-stem select-text">
                        <MathText text={currentMcq.question} block />
                      </div>
                    </section>

                    {/* 4. OPTIONS: A–D rounded 22px cards, resizing to fit remaining space (4 rows mobile, 2x2 >=700px) */}
                    {(() => {
                      const cleanOpts = repairSplitOrGarbledMcqOptions([
                        currentMcq.option_a,
                        currentMcq.option_b,
                        currentMcq.option_c,
                        currentMcq.option_d,
                      ]);
                      const optionPairs = [
                        ['A', cleanOpts[0]],
                        ['B', cleanOpts[1]],
                        ['C', cleanOpts[2]],
                        ['D', cleanOpts[3]],
                      ] as const;

                      return (
                        <div
                          className="nt-options-grid"
                          role="radiogroup"
                          aria-label={`Question ${currentIndex + 1} options`}
                        >
                          {optionPairs.map(([letter, optText]) => {
                            const selected = answers[currentMcq.id] === letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [currentMcq.id]: letter,
                                  }))
                                }
                                className={`nt-option-card ${
                                  selected ? 'nt-option-card--selected' : ''
                                }`}
                              >
                                <span className="nt-option-badge">{letter}</span>
                                <span className="nt-option-text select-text">
                                  <MathText text={optText} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* 5. BOTTOM DOCK: pinned, frosted-glass bar with square Previous icon button, Next button, and red Finish & Submit button */}
              {testStage === 'running' && testMcqs.length > 0 && (
                <footer className="nt-bottom-dock">
                  <div className="nt-bottom-dock-inner">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      aria-label={t('test.previous')}
                      title={t('test.previous')}
                      className="nt-btn-prev"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="nt-dock-right">
                      <button
                        type="button"
                        disabled={currentIndex >= testMcqs.length - 1}
                        onClick={() =>
                          setCurrentIndex((i) => Math.min(testMcqs.length - 1, i + 1))
                        }
                        className="nt-btn-next"
                      >
                        <span>{t('test.next')}</span>
                        <ChevronRight size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={submittingTest}
                        onClick={() => setConfirmSubmitOpen(true)}
                        className="nt-btn-submit"
                      >
                        <span>{submittingTest ? t('common.submitting') : t('test.finishTest')}</span>
                        {submittingTest && <ButtonLineLoader />}
                      </button>
                    </div>
                  </div>
                </footer>
              )}
            </>
          ) : (
            /* OVERVIEW & RESULTS STAGES */
            <>
              <header
                className="shrink-0 w-full border-b border-[var(--nt-border)] bg-[var(--nt-surface)] px-3 sm:px-5 flex items-center justify-between gap-2"
                style={{
                  paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
                  paddingBottom: '8px',
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="nt-chip nt-chip--exam inline-flex items-center gap-2">
                    <UniversityLogoBox
                      name={activeUni.name}
                      logoUrl={activeUni.logo_url}
                      size="xs"
                      eager
                    />
                    <span>
                      {activeUni.name.replace(/\s*\(.*?\)\s*/g, '').trim() || activeUni.name}
                    </span>
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className="text-xs text-[var(--nt-muted)] truncate leading-tight">
                      {getUniversityTestSpec(activeUni).patternLabel}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestCloseRunner}
                  aria-label="Close test runner"
                  className="nt-chip nt-chip--icon"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
                <main className="flex-1 min-w-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
                  <div className="w-full max-w-[760px] mx-auto">
                    {/* STAGE A: OVERVIEW / SUBJECT FILTER SETUP */}
                    {testStage === 'overview' && (
                      <div className="cockpit-surface-card p-5 sm:p-7 space-y-6">
                        <div className="flex items-center gap-3.5">
                          <UniversityLogoBox
                            name={activeUni.name}
                            logoUrl={activeUni.logo_url}
                            size="md"
                            eager
                          />
                          <div className="space-y-0.5 min-w-0 text-start">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                              {t('dashboard.setupTest')}
                            </span>
                            <h3
                              className="text-lg sm:text-xl font-bold text-[var(--text)] truncate"
                            >
                              {activeUni.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
                              {getUniversityTestSpec(activeUni).patternLabel}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              {t('nav.mcqs')}
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums ltr-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {t('dashboard.mcqsCount', { count: formatNumber(Number(activeUni.mcq_count || 0)) })}
                            </div>
                          </div>
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              {t('dashboard.timeLimit')}
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums ltr-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {formatDurationClock(
                                getUniversityTestSpec(activeUni).durationMinutes * 60
                              )}
                            </div>
                          </div>
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              {t('test.score')}
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums ltr-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {getUniversityTestSpec(activeUni).markingLabel}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <label
                            className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-start"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {t('dashboard.subjects')}
                          </label>
                          {loadingTopics ? (
                            <div className="flex flex-wrap gap-2" aria-hidden="true">
                              <div className="h-9 w-32 rounded-full skeleton-shimmer" />
                              <div className="h-9 w-28 rounded-full skeleton-shimmer" />
                              <div className="h-9 w-24 rounded-full skeleton-shimmer" />
                              <div className="h-9 w-28 rounded-full skeleton-shimmer" />
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubject('all');
                                  setSelectedTopic('all');
                                }}
                                className={`cockpit-uni-pill min-h-[38px] px-3.5 cursor-pointer ${
                                  selectedSubject === 'all'
                                    ? 'cockpit-uni-pill--live'
                                    : 'cockpit-uni-pill--soon'
                                }`}
                              >
                                {t('dashboard.allSubjects')} ({formatNumber(Number(activeUni.mcq_count || 0))})
                              </button>
                              {uniTopicsTree.map((s) => (
                                <button
                                  key={s.subject}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubject(s.subject);
                                    setSelectedTopic('all');
                                  }}
                                  className={`cockpit-uni-pill min-h-[38px] px-3.5 cursor-pointer ${
                                    selectedSubject === s.subject
                                      ? 'cockpit-uni-pill--live'
                                      : 'cockpit-uni-pill--soon'
                                  }`}
                                >
                                  {s.subject} ({formatNumber(s.total)})
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {selectedSubject !== 'all' && (
                          <div className="space-y-2.5">
                            <label
                              className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-start"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {t('dashboard.topics')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedTopic('all')}
                                className={`cockpit-uni-pill min-h-[36px] px-3 cursor-pointer ${
                                  selectedTopic === 'all'
                                    ? 'cockpit-uni-pill--live'
                                    : 'cockpit-uni-pill--soon'
                                }`}
                              >
                                {t('dashboard.allTopics')}
                              </button>
                              {(
                                uniTopicsTree.find((x) => x.subject === selectedSubject)?.topics ||
                                []
                              ).map((topicItem) => (
                                <button
                                  key={topicItem.topic}
                                  type="button"
                                  onClick={() => setSelectedTopic(topicItem.topic)}
                                  className={`cockpit-uni-pill min-h-[36px] px-3 cursor-pointer ${
                                    selectedTopic === topicItem.topic
                                      ? 'cockpit-uni-pill--live'
                                      : 'cockpit-uni-pill--soon'
                                  }`}
                                >
                                  {topicItem.topic} ({formatNumber(topicItem.count)})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {testError && (
                          <div className="cockpit-subrow p-3.5 text-xs text-[var(--accent)] flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{testError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveUni(null)}
                            className="inline-flex items-center justify-center min-h-[48px] px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold cockpit-subrow text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            disabled={loadingMcqs}
                            onClick={() =>
                              void startUniversityD1Test(
                                activeUni,
                                selectedSubject,
                                selectedTopic
                              )
                            }
                            className="relative overflow-hidden inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-75"
                          >
                            <span>{t('dashboard.startTest')}</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STAGE D: TEST RESULTS + PDF DOWNLOAD (ANSWERS + SCORE) */}
                    {testStage === 'results' && testResultSummary && (
                      <div className="space-y-5 pb-8">
                        <div className="cockpit-surface-card p-5 sm:p-6 text-center space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--cockpit-pill-live-bg)] text-[var(--accent)]">
                            <Award size={24} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg sm:text-2xl font-bold text-[var(--text)]">
                              {activeUni.name} — {t('test.resultsTitle')}
                            </h3>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                              {testResultSummary.accuracy >= 80
                                ? t('test.greatJob')
                                : testResultSummary.accuracy >= 50
                                ? t('test.keepPracticing')
                                : t('test.needsWork')}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                {t('dashboard.accuracy')}
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--accent)] tabular-nums ltr-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {formatNumber(testResultSummary.accuracy)}%
                              </div>
                            </div>
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                {t('test.correct')}
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--text)] tabular-nums ltr-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {formatNumber(testResultSummary.correctCount)}/{formatNumber(testResultSummary.totalQuestions)}
                              </div>
                            </div>
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                {t('test.score')}
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--text)] tabular-nums ltr-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {formatNumber(testResultSummary.score)}/{formatNumber(testResultSummary.maxScore)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
                            <PdfDownloadButton
                              onDownload={handleDownloadResultsPdf}
                              label="PDF"
                              variant="primary"
                            />
                            <button
                              type="button"
                              onClick={() => setTestStage('overview')}
                              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cockpit-subrow text-[var(--text)] cursor-pointer"
                            >
                              {t('test.retakeTest')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveUni(null)}
                              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
                            >
                              {t('test.backToDashboard')}
                            </button>
                          </div>
                        </div>

                        <AdSlot slotId={AD_SLOTS.result_below} wrapperClassName="my-6 sm:my-8" />

                        <div className="space-y-3">
                          {testMcqs.map((q, idx) => {
                            const userAns = answers[q.id];
                            const ver = verifiedMap[q.id];
                            const correctAns = (
                              ver?.correctAnswer ||
                              q.correct_answer ||
                              'A'
                            ).toUpperCase();
                            const isCorrect = userAns === correctAns;
                            return (
                              <div
                                key={q.id}
                                className="cockpit-surface-card p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm select-text"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-bold text-[var(--text)]">
                                    Q{idx + 1}. {q.subject} · {q.topic}
                                  </span>
                                  <span
                                    className={`cockpit-uni-pill ${
                                      isCorrect
                                        ? 'cockpit-uni-pill--live'
                                        : 'cockpit-uni-pill--soon'
                                    }`}
                                  >
                                    {userAns ? `Your Ans: ${userAns}` : 'Unanswered'} · Correct:{' '}
                                    {correctAns}
                                  </span>
                                </div>
                                <div className="text-[var(--text)] font-medium">
                                  <MathText text={q.question} block />
                                </div>
                                {(ver?.explanation || q.explanation) && (
                                  <div className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                                    <MathText text={ver?.explanation || q.explanation} block />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </>
          )}

          {/* CONFIRM FINISH & SUBMIT DIALOG (Shows Unanswered Count) */}
          {confirmSubmitOpen && (
            <div
              className="fixed inset-0 z-[120] bg-black/75 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('test.confirmSubmitTitle')}
            >
              <div className="cockpit-surface-card w-full max-w-md p-5 sm:p-6 space-y-4 text-start">
                <div className="flex items-start justify-between gap-3">
                  <h4
                    className="text-base sm:text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {t('test.confirmSubmitTitle')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
                    aria-label={t('common.close')}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">{t('test.answered')}</div>
                    <div className="text-base font-bold text-emerald-500 tabular-nums ltr-nums">
                      {formatNumber(answeredCount)}
                    </div>
                  </div>
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">{t('test.unanswered')}</div>
                    <div className="text-base font-bold text-[var(--accent)] tabular-nums ltr-nums">
                      {formatNumber(unansweredCount)}
                    </div>
                  </div>
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">{t('test.flagged')}</div>
                    <div className="text-base font-bold text-amber-500 tabular-nums ltr-nums">
                      {formatNumber(flaggedCount)}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {t('test.confirmSubmitDesc', { answered: formatNumber(answeredCount), total: formatNumber(testMcqs.length) })}
                  {unansweredCount > 0 ? ` ${t('test.unansweredWarning', { count: formatNumber(unansweredCount) })}` : ''}
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer"
                  >
                    {t('test.reviewAnswers')}
                  </button>
                  <button
                    type="button"
                    disabled={submittingTest}
                    onClick={() => void submitUniversityD1Test()}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    {submittingTest ? t('common.submitting') : t('test.submitNow')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM EXIT / ABANDON DIALOG (Triggered by X or Browser Back) */}
          {confirmExitOpen && (
            <div
              className="fixed inset-0 z-[120] bg-black/75 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('test.exitConfirmTitle')}
            >
              <div className="cockpit-surface-card w-full max-w-md p-5 sm:p-6 space-y-4 text-start">
                <h4
                  className="text-base sm:text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {t('test.exitConfirmTitle')}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {t('test.exitConfirmDesc')}
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmExitOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer"
                  >
                    {t('test.stayInTest')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAbandonTest}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    {t('test.leaveNow')}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>,
          document.body
        )}
    </div>
  );
}
export default OverviewPage;
