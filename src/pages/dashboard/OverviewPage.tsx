import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBodyScrollLock, safetyCleanupScrollLocks } from '@/utils/scrollLock';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { BoardlyCoPilotCard } from '@/components/dashboard/BoardlyCoPilotCard';
import { useSmoothMode } from '@/utils/smoothMode';
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
import { getPlanDisplayLabel } from '@/config/postLimits';
import { FREE_DAILY_TESTS } from '@/constants/limits';
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
import { UniversityLogoBox } from '@/components/ui/UniversityLogoBox';

const CountUpMcq = memo(function CountUpMcq({ value }: { value: number }) {
  const { smoothMode } = useSmoothMode();
  const target = Math.max(0, Math.floor(Number(value) || 0));
  const [displayVal, setDisplayVal] = useState<number>(() => (smoothMode ? target : 0));

  useEffect(() => {
    if (smoothMode || target <= 0) {
      setDisplayVal(target);
      return;
    }
    let rafId = 0;
    const duration = 650;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, smoothMode]);

  return <>{displayVal.toLocaleString()}</>;
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
  const { user, profile, streak } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const isPlus = effectivePlan.isPlus;
  const currentPlanLabel = getPlanDisplayLabel(effectivePlan.plan);

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
    return () => window.removeEventListener('boardly-d1-attempts-updated', handleAttemptsUpdated);
  }, []);

  const d1Stats = useMemo(
    () => computeD1CockpitStats(user?.uid, universities),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.uid, universities, statsVersion]
  );

  const testsRemaining = isPro
    ? 'Unlimited'
    : Math.max(0, FREE_DAILY_TESTS - d1Stats.todayTestsCount);

  const cleanFullName = sanitizeStudentDisplayName(
    profile?.displayName || user?.displayName,
    profile?.shortId || user?.uid
  );
  const firstName = cleanFullName.split(' ')[0] || 'Student';
  const safeStreak = Number.isFinite(Number(streak))
    ? Math.max(0, Math.floor(Number(streak)))
    : 0;
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
      if (!isPro && d1Stats.todayTestsCount >= FREE_DAILY_TESTS) {
        setTestError('Daily test limit reached on Free plan. Upgrade to Pro for unlimited tests.');
        return;
      }

      const spec = getUniversityTestSpec(uni);
      setLoadingMcqs(true);
      setTestError(null);
      setRemainingSeconds(spec.durationMinutes * 60);
      setElapsedSeconds(0);
      setTestStage('loading');
      try {
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
    [d1Stats.todayTestsCount, isPro]
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
    <div data-student-page="dashboard" className="cockpit-root w-full max-w-full min-w-0 box-border space-y-6 pb-8">
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

      {/* c) Greeting: "Salam, <name>! Ready to practice today?" */}
      <section aria-label="Student Greeting">
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
        >
          Salam, {firstName}! Ready to practice today?
        </h1>
      </section>

      {/* d) Choose your university: horizontal snap carousel of LIVE tiles (80% width) */}
      <section
        id="choose-university-section"
        className="space-y-3"
        aria-label="Choose your university"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap px-1">
          <div className="space-y-0.5">
            <h2
              className="text-base sm:text-lg font-black tracking-tight"
              style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
            >
              Choose your university
            </h2>
            <p
              className="text-xs"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              Swipe live universities and tap to start the official test pattern
            </p>
          </div>
        </div>

        {loadingUniversities && universities.length === 0 ? (
          <UniversityGridSkeleton count={3} />
        ) : universitiesError ? (
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
                Could not load universities
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
              <span>Retry</span>
            </button>
          </div>
        ) : universities.length === 0 ? (
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
              No universities configured yet
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              Universities added in the Admin Question Bank will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Horizontal snap carousel of LIVE tiles (80% width, padding-bottom 40px, margin-bottom -30px) */}
            {liveUniversities.length > 0 && (
              <>
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  data-testid="live-universities-carousel"
                  className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar px-1 pt-1"
                  style={{
                    paddingBottom: '40px',
                    marginBottom: '-30px',
                    scrollbarWidth: 'none',
                  }}
                >
                  {liveUniversities.map((uni) => {
                    const mcqCount = Number(uni.mcq_count || 0);
                    return (
                      <button
                        key={uni.id}
                        type="button"
                        data-testid={`live-uni-tile-${uni.slug || uni.id}`}
                        onClick={() => void openUniversityBubble(uni)}
                        className="snap-center shrink-0 w-[80%] sm:w-[320px] rounded-[28px] p-4 sm:p-5 text-left flex flex-col justify-between gap-4 transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                        style={{
                          flex: '0 0 80%',
                          maxWidth: '340px',
                          background: 'var(--uni-tile-grad)',
                          border: '1px solid var(--uni-tile-border)',
                          boxShadow: '0 12px 24px rgba(200,15,27,.3)',
                          isolation: 'isolate',
                          color: 'var(--uni-tile-text)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <UniversityLogoBox logoUrl={uni.logo_url} name={uni.name} />

                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: 'var(--uni-live-badge-bg)',
                              border: '1px solid var(--uni-live-badge-border)',
                              color: 'var(--uni-tile-text)',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: 'var(--uni-live-badge-dot)' }}
                              aria-hidden="true"
                            />
                            <span>LIVE</span>
                          </span>
                        </div>

                        <div className="space-y-1 w-full min-w-0">
                          <div
                            className="text-2xl sm:text-3xl font-black tabular-nums leading-none"
                            style={{ fontFamily: 'var(--font-dot)', color: 'var(--uni-tile-text)' }}
                          >
                            <CountUpMcq value={mcqCount} />{' '}
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ fontFamily: 'var(--font-mono)', color: 'var(--uni-tile-subtext)' }}
                            >
                              MCQs
                            </span>
                          </div>

                          <div
                            className="text-base sm:text-lg font-bold truncate"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--uni-tile-text)' }}
                          >
                            {uni.name}
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between pt-1 text-xs font-bold"
                          style={{ fontFamily: 'var(--font-heading)', color: 'var(--uni-tile-subtext)' }}
                        >
                          <span>Start test →</span>
                          <ArrowRight size={14} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Carousel Dots */}
                {liveUniversities.length > 1 && (
                  <div
                    className="flex items-center justify-center gap-1.5 pt-1"
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
                          className="h-2 rounded-full transition-transform duration-150 cursor-pointer"
                          style={{
                            width: isActive ? '20px' : '8px',
                            backgroundColor: isActive ? 'var(--accent)' : 'var(--meter-off)',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Dark pill "N more coming soon" that expands into chips */}
            {soonUniversities.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  data-testid="coming-soon-pill-toggle"
                  onClick={() => setShowAllSoonUnis((prev) => !prev)}
                  aria-expanded={showAllSoonUnis}
                  className="inline-flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-full text-xs font-bold transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--soon-pill-bg)',
                    color: 'var(--soon-pill-text)',
                    border: '1px solid var(--soon-pill-border)',
                  }}
                >
                  <span>{soonUniversities.length} more coming soon</span>
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          backgroundColor: 'var(--pill-card-bg)',
                          border: '1px solid var(--pill-card-border)',
                          color: 'var(--text)',
                        }}
                      >
                        <UniversityLogoBox
                          name={uni.name}
                          logoUrl={uni.logo_url}
                          size="xs"
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
        className="grid grid-cols-2 gap-3 sm:gap-3.5"
        aria-label="Stats Bento"
        data-testid="stats-bento-grid"
      >
        <div
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px]"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
          >
            Questions Solved
          </span>
          <div className="space-y-0.5">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
            >
              {d1Stats.questionsSolved.toLocaleString()}
            </div>
            <p
              className="text-[11px] truncate"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              University question bank
            </p>
          </div>
        </div>

        <div
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px]"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
            >
              7-Day Streak
            </span>
            <Flame size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="space-y-1.5">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
            >
              {safeStreak} {safeStreak === 1 ? 'Day' : 'Days'}
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
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px]"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
          >
            Daily Limit
          </span>
          <div className="space-y-0.5">
            <div
              className="text-2xl sm:text-3xl font-black tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
            >
              {isPro ? 'Unlimited' : `${testsRemaining} / ${FREE_DAILY_TESTS}`}
            </div>
            <p
              className="text-[11px] truncate"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              {isPro ? (
                'No daily cap'
              ) : (
                <>
                  Resets in <PKTMidnightCountdown />
                </>
              )}
            </p>
          </div>
        </div>

        <div
          className="rounded-[24px] p-4 flex flex-col justify-between gap-2 min-h-[108px]"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
            >
              Current Plan
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
              className="text-2xl sm:text-3xl font-black leading-none"
              style={{ fontFamily: 'var(--font-dot)', color: isPlus ? '#F59E0B' : 'var(--text)' }}
            >
              {currentPlanLabel}
            </div>
            {isPlus ? (
              <p
                className="text-[11px] truncate"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
              >
                All universities &amp; unlimited posts
              </p>
            ) : isPro ? (
              <p
                className="text-[11px] truncate"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
              >
                All live universities unlocked
              </p>
            ) : (
              <Link
                to="/dashboard/plans"
                className="inline-flex items-center gap-1 min-h-[44px] -my-2.5 py-2.5 text-[11px] font-bold hover:underline"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* f) Weak Chapters */}
      <div className="cv-auto">
        <WeakChapters
          chapters={d1Stats.weakChapters}
          onDrillChapter={(item) => void handleDrillWeakChapter(item)}
        />
      </div>

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
                        <span className="nt-progress-qnum nt-doto">
                          {currentIndex + 1} / {testMcqs.length}
                        </span>
                        <span className="nt-progress-answered">
                          Answered {answeredCount}/{testMcqs.length}
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
                          <span>{flaggedMap[currentMcq.id] ? 'Flagged' : 'Flag'}</span>
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
                      aria-label="Previous question"
                      title="Previous question"
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
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={submittingTest}
                        onClick={() => setConfirmSubmitOpen(true)}
                        className="nt-btn-submit"
                      >
                        <span>{submittingTest ? 'Submitting...' : 'Finish & Submit'}</span>
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
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                              Official Test Configuration
                            </span>
                            <h3
                              className="text-lg sm:text-xl font-bold text-[var(--text)] truncate"
                              style={{ fontFamily: 'var(--font-dot)' }}
                            >
                              {activeUni.name} Entry Test
                            </h3>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
                              {getUniversityTestSpec(activeUni).patternLabel}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              Available Pool
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {Number(activeUni.mcq_count || 0).toLocaleString()} MCQs
                            </div>
                          </div>
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              Duration
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {formatDurationClock(
                                getUniversityTestSpec(activeUni).durationMinutes * 60
                              )}
                            </div>
                          </div>
                          <div className="cockpit-subrow p-3.5 space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                              Marking
                            </span>
                            <div
                              className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {getUniversityTestSpec(activeUni).markingLabel}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <label
                            className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            Select Subject Scope
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
                                Full Pattern ({activeUni.mcq_count})
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
                                  {s.subject} ({s.total})
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {selectedSubject !== 'all' && (
                          <div className="space-y-2.5">
                            <label
                              className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              Select Chapter / Topic
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
                                All Topics
                              </button>
                              {(
                                uniTopicsTree.find((x) => x.subject === selectedSubject)?.topics ||
                                []
                              ).map((t) => (
                                <button
                                  key={t.topic}
                                  type="button"
                                  onClick={() => setSelectedTopic(t.topic)}
                                  className={`cockpit-uni-pill min-h-[36px] px-3 cursor-pointer ${
                                    selectedTopic === t.topic
                                      ? 'cockpit-uni-pill--live'
                                      : 'cockpit-uni-pill--soon'
                                  }`}
                                >
                                  {t.topic} ({t.count})
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
                            Cancel
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
                            <span>Start {activeUni.name} Test</span>
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
                            <h3
                              className="text-lg sm:text-2xl font-bold text-[var(--text)]"
                              style={{ fontFamily: 'var(--font-dot)' }}
                            >
                              {activeUni.name} Test Complete
                            </h3>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                              Official Score Breakdown & Verified Answer Key
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                Accuracy
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--accent)] tabular-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {testResultSummary.accuracy}%
                              </div>
                            </div>
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                Correct
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--text)] tabular-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {testResultSummary.correctCount}/{testResultSummary.totalQuestions}
                              </div>
                            </div>
                            <div className="cockpit-subrow p-3">
                              <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                                Net Score
                              </div>
                              <div
                                className="text-base sm:text-lg font-bold text-[var(--text)] tabular-nums"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {testResultSummary.score}/{testResultSummary.maxScore}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
                            <PdfDownloadButton
                              onDownload={handleDownloadResultsPdf}
                              label="Download Results & Answer Key (PDF)"
                              variant="primary"
                            />
                            <button
                              type="button"
                              onClick={() => setTestStage('overview')}
                              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cockpit-subrow text-[var(--text)] cursor-pointer"
                            >
                              New Filter
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveUni(null)}
                              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
                            >
                              Back to Cockpit
                            </button>
                          </div>
                        </div>

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
              aria-label="Confirm test submission"
            >
              <div className="cockpit-surface-card w-full max-w-md p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h4
                    className="text-base sm:text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Submit {activeUni.name} Test?
                  </h4>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
                    aria-label="Close confirmation"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Answered</div>
                    <div className="text-base font-bold text-emerald-500 tabular-nums">
                      {answeredCount}
                    </div>
                  </div>
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Unanswered</div>
                    <div className="text-base font-bold text-[var(--accent)] tabular-nums">
                      {unansweredCount}
                    </div>
                  </div>
                  <div className="cockpit-subrow p-3">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Flagged</div>
                    <div className="text-base font-bold text-amber-500 tabular-nums">
                      {flaggedCount}
                    </div>
                  </div>
                </div>

                {unansweredCount > 0 ? (
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    You still have <strong className="text-[var(--text)]">{unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}</strong>. Are you sure you want to finish and submit now?
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    You have answered all {testMcqs.length} questions. Ready to calculate your final score?
                  </p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer"
                  >
                    Review Questions
                  </button>
                  <button
                    type="button"
                    disabled={submittingTest}
                    onClick={() => void submitUniversityD1Test()}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    {submittingTest ? 'Submitting...' : 'Confirm & Submit'}
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
              aria-label="Confirm exit test"
            >
              <div className="cockpit-surface-card w-full max-w-md p-5 sm:p-6 space-y-4">
                <h4
                  className="text-base sm:text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Leave test in progress?
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  You have answered <strong className="text-[var(--text)]">{answeredCount} of {testMcqs.length}</strong> questions ({unansweredCount} unanswered). Leaving now will discard this unsubmitted attempt.
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmExitOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer"
                  >
                    Continue Test
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAbandonTest}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    Leave Test
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
