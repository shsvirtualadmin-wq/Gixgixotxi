import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
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
} from 'lucide-react';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import {
  fetchUniversities,
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
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';

const LazyDragonCompanion = lazy(() =>
  import('@/components/dashboard/DragonCompanion').then((m) => ({ default: m.DragonCompanion }))
);

function getUniversityInitials(name: string): string {
  const cleaned = (name || '').replace(/\(.*?\)/g, '').trim();
  const words = cleaned.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return 'UN';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

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

function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function OverviewPage() {
  const { user, profile, streak } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;

  // ── Cloudflare D1 Universities State (GET /api/universities ONLY — Zero Firebase) ──
  const [universities, setUniversities] = useState<D1UniversityRow[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState<boolean>(true);
  const [universitiesError, setUniversitiesError] = useState<string | null>(null);

  const loadUniversitiesFromD1 = useCallback(async () => {
    setLoadingUniversities(true);
    setUniversitiesError(null);
    try {
      const rows = await fetchUniversities();
      if (Array.isArray(rows)) {
        const sorted = [...rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
        setUniversities(sorted);
      } else {
        setUniversities([]);
      }
    } catch (err: any) {
      setUniversitiesError(err?.message || 'Unable to load universities from Cloudflare D1.');
    } finally {
      setLoadingUniversities(false);
    }
  }, []);

  useEffect(() => {
    void loadUniversitiesFromD1();
  }, [loadUniversitiesFromD1]);

  // ── D1 Cockpit Stats (Questions Solved, Weak Chapters, Recent Attempts) ──
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

  // ── Active University Test Flow State (Opened ONLY via a LIVE University Bubble or Live Weak Chapter Drill) ──
  const [activeUni, setActiveUni] = useState<D1UniversityRow | null>(null);
  const [uniTopicsTree, setUniTopicsTree] = useState<
    Array<{ subject: string; total: number; topics: Array<{ topic: string; count: number }> }>
  >([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Test Runner State
  const [testStage, setTestStage] = useState<'overview' | 'running' | 'results'>('overview');
  const [testMcqs, setTestMcqs] = useState<D1McqRow[]>([]);
  const [loadingMcqs, setLoadingMcqs] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
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

  const openUniversityBubble = useCallback(
    async (uni: D1UniversityRow, prefillSubject?: string, prefillTopic?: string) => {
      if (!uni || Number(uni.mcq_count || 0) <= 0) return;
      setActiveUni(uni);
      setSelectedSubject(prefillSubject || 'all');
      setSelectedTopic(prefillTopic || 'all');
      setTestStage('overview');
      setTestError(null);
      setTestMcqs([]);
      setAnswers({});
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
      if (!uni || Number(uni.mcq_count || 0) <= 0) return;
      if (!isPro && d1Stats.todayTestsCount >= FREE_DAILY_TESTS) {
        setTestError('Daily test limit reached on Free plan. Upgrade to Pro for unlimited tests.');
        return;
      }

      setLoadingMcqs(true);
      setTestError(null);
      try {
        const res = await fetchMcqs({
          university_id: uni.id,
          subject: subjectFilter !== 'all' ? subjectFilter : undefined,
          topic: topicFilter !== 'all' ? topicFilter : undefined,
          limit: 100,
        });
        const list = Array.isArray(res?.mcqs) ? res.mcqs : [];
        if (list.length === 0) {
          setTestError('No MCQs found for the selected filter in this university.');
          setLoadingMcqs(false);
          return;
        }
        const spec = getUniversityTestSpec(uni);
        setTestMcqs(list);
        setCurrentIndex(0);
        setAnswers({});
        setVerifiedMap({});
        setTestResultSummary(null);
        setRemainingSeconds(spec.durationMinutes * 60);
        setElapsedSeconds(0);
        setTestStage('running');
      } catch (err: any) {
        setTestError(err?.message || 'Failed to load university MCQs from D1.');
      } finally {
        setLoadingMcqs(false);
      }
    },
    [d1Stats.todayTestsCount, isPro]
  );

  const submitUniversityD1Test = useCallback(async () => {
    if (!activeUni || testMcqs.length === 0 || submittingTest) return;
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
      setReportNotice('Question reported to Admin Question Bank.');
      setTimeout(() => setReportNotice(null), 3000);
    } catch {
      setReportNotice('Report saved.');
      setTimeout(() => setReportNotice(null), 2500);
    }
  };

  const liveCount = useMemo(
    () => universities.filter((u) => Number(u.mcq_count || 0) > 0).length,
    [universities]
  );

  return (
    <div className="cockpit-root w-full max-w-full min-w-0 box-border space-y-6 pb-8">
      {/* 2. Greeting: "Salam, {name}! Ready to practice today?" */}
      <section className="pt-1" aria-label="Student Greeting">
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] leading-tight"
          style={{ fontFamily: 'var(--font-dot)' }}
        >
          Salam, {firstName}! Ready to practice today?
        </h1>
      </section>

      {/* 2b. Dedicated Dragon Stage (Between Greeting & Choose Your University; collapses with zero gap when hidden/off) */}
      <Suspense fallback={null}>
        <LazyDragonCompanion
          weakChapters={d1Stats.weakChapters}
          currentMcq={testStage === 'running' ? testMcqs[currentIndex] ?? null : null}
          isTestModalOpen={Boolean(activeUni)}
        />
      </Suspense>

      {/* 3. "Choose your university" glass bubble grid — the ONLY test entry */}
      <section
        id="choose-university-section"
        className="cockpit-grid-stage space-y-3.5"
        aria-label="Choose your university"
      >
        {/* Soft blurred red/crimson radial-gradient blobs behind the grid (no images) */}
        <div className="cockpit-blob-layer" aria-hidden="true" />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="space-y-0.5">
            <h2
              className="text-base sm:text-lg font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Choose your university
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tap a live university to start its official entry test pattern
            </p>
          </div>
          {!loadingUniversities && universities.length > 0 && (
            <span className="cockpit-uni-pill cockpit-uni-pill--soon tabular-nums">
              {liveCount} Live · {Math.max(0, universities.length - liveCount)} Coming Soon
            </span>
          )}
        </div>

        {/* Section-level LineLoader for university grid */}
        {loadingUniversities ? (
          <LineLoader
            context="universities"
            variant="section"
            onRetry={() => void loadUniversitiesFromD1()}
          />
        ) : universitiesError ? (
          /* Error State */
          <div className="cockpit-surface-card p-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
              <p
                className="text-sm font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Could not load universities
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                {universitiesError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadUniversitiesFromD1()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : universities.length === 0 ? (
          /* Empty State */
          <div className="cockpit-surface-card p-6 text-center space-y-1.5">
            <p
              className="text-sm font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              No universities configured yet
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Universities added in the Admin Question Bank will appear here automatically.
            </p>
          </div>
        ) : (
          /* 2-Column Glass Bubble Grid */
          <div className="cockpit-uni-grid">
            {universities.map((uni) => {
              const mcqCount = Number(uni.mcq_count || 0);
              const isLive = mcqCount > 0;
              const initials = getUniversityInitials(uni.name);

              return (
                <button
                  key={uni.id}
                  type="button"
                  disabled={!isLive}
                  aria-disabled={!isLive}
                  onClick={() => {
                    if (isLive) {
                      void openUniversityBubble(uni);
                    }
                  }}
                  className={`cockpit-uni-bubble ${
                    isLive ? 'cockpit-uni-bubble--live' : 'cockpit-uni-bubble--soon'
                  }`}
                >
                  {/* Top Row: Frosted Circular Emblem + Glass Status Pill */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div
                      className={`cockpit-uni-circle ${
                        isLive ? 'cockpit-uni-circle--live' : ''
                      }`}
                    >
                      {uni.logo_url ? (
                        <img
                          src={uni.logo_url}
                          alt={uni.name}
                          className="w-6 h-6 object-contain rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {isLive ? (
                      <span className="cockpit-uni-pill cockpit-uni-pill--live tabular-nums">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                          aria-hidden="true"
                        />
                        {mcqCount.toLocaleString()} MCQs
                      </span>
                    ) : (
                      <span className="cockpit-uni-pill cockpit-uni-pill--soon">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Bottom Row: University Name + Subtitle */}
                  <div className="mt-3.5 space-y-0.5 w-full min-w-0">
                    <div
                      className="text-sm sm:text-[15px] font-bold text-[var(--text)] leading-snug truncate"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {uni.name}
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                      <span className="truncate">
                        {isLive ? 'Tap to start test' : 'Bank in preparation'}
                      </span>
                      {isLive && (
                        <ArrowRight
                          size={13}
                          className="shrink-0 text-[var(--accent)]"
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Compact Stat Cards: Questions Solved, 7-Day Streak, Daily Limit, Current Plan */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5"
        aria-label="Cockpit Stats"
      >
        {/* Card 1: Questions Solved */}
        <div className="cockpit-surface-card p-3.5 sm:p-4 flex flex-col justify-between gap-2 min-h-[104px]">
          <span
            className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Questions Solved
          </span>
          <div className="space-y-0.5">
            <div
              className="text-xl sm:text-2xl font-bold text-[var(--text)] tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {d1Stats.questionsSolved.toLocaleString()}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              University D1 bank
            </p>
          </div>
        </div>

        {/* Card 2: 7-Day Streak */}
        <div className="cockpit-surface-card p-3.5 sm:p-4 flex flex-col justify-between gap-2 min-h-[104px]">
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              7-Day Streak
            </span>
            <Flame size={14} className="text-[var(--accent)] shrink-0" />
          </div>
          <div className="space-y-1.5">
            <div
              className="text-xl sm:text-2xl font-bold text-[var(--text)] tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {safeStreak} {safeStreak === 1 ? 'Day' : 'Days'}
            </div>
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor:
                      i < filledBars ? 'var(--accent)' : 'var(--surface-2)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Daily Limit */}
        <div className="cockpit-surface-card p-3.5 sm:p-4 flex flex-col justify-between gap-2 min-h-[104px]">
          <span
            className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Daily Limit
          </span>
          <div className="space-y-0.5">
            <div
              className="text-xl sm:text-2xl font-bold text-[var(--text)] tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isPro ? 'Unlimited' : `${testsRemaining} / ${FREE_DAILY_TESTS}`}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
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

        {/* Card 4: Current Plan */}
        <div className="cockpit-surface-card p-3.5 sm:p-4 flex flex-col justify-between gap-2 min-h-[104px]">
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Current Plan
            </span>
            {isPro && <Crown size={14} className="text-[var(--accent)] shrink-0" />}
          </div>
          <div className="space-y-0.5">
            <div
              className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isPro ? 'Pro' : 'Free'}
            </div>
            {isPro ? (
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                All live universities unlocked
              </p>
            ) : (
              <Link
                to="/dashboard/plans"
                className="inline-flex items-center gap-1 min-h-[44px] -my-2.5 py-2.5 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 5. Weak Chapters: built only from D1 university MCQ attempts; hidden until attempts exist */}
      <WeakChapters
        chapters={d1Stats.weakChapters}
        onDrillChapter={(item) => void handleDrillWeakChapter(item)}
      />

      {/* 6. Recent Attempts (latest 5) with an empty state */}
      <RecentAttempts
        attempts={d1Stats.recentAttempts}
        onRetakeUniversity={(uniId, subj, top) =>
          void handleRetakeFromRecent(uniId, subj, top)
        }
      />

      {/* ── University Test Flow Modal (Opened ONLY by tapping a LIVE University Bubble) ── */}
      {activeUni && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto overlay-blur bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeUni.name} Test Flow`}
        >
          <div className="cockpit-surface-card w-full max-w-2xl p-4 sm:p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="cockpit-uni-circle cockpit-uni-circle--live">
                  {getUniversityInitials(activeUni.name)}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-base sm:text-lg font-bold text-[var(--text)] truncate"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {activeUni.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {getUniversityTestSpec(activeUni).patternLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUni(null)}
                aria-label="Close university test modal"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full cockpit-subrow flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {testStage === 'overview' && (
              <div className="space-y-4">
                {/* University Pattern, Duration & Marking Badges */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="cockpit-subrow p-3 space-y-0.5">
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
                  <div className="cockpit-subrow p-3 space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                      Duration
                    </span>
                    <div
                      className="text-sm sm:text-base font-bold text-[var(--text)] tabular-nums"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {getUniversityTestSpec(activeUni).durationMinutes} mins
                    </div>
                  </div>
                  <div className="cockpit-subrow p-3 space-y-0.5">
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

                {/* Optional Subject / Topic Filter from D1 */}
                <div className="space-y-2">
                  <label
                    className="block text-xs font-semibold text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Select Subject Scope
                  </label>
                  {loadingTopics ? (
                    <LineLoader context="universities" variant="inline" />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject('all');
                          setSelectedTopic('all');
                        }}
                        className={`cockpit-uni-pill cursor-pointer ${
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
                          className={`cockpit-uni-pill cursor-pointer ${
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
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-semibold text-[var(--text-muted)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Select Topic
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTopic('all')}
                        className={`cockpit-uni-pill cursor-pointer ${
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
                          className={`cockpit-uni-pill cursor-pointer ${
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
                  <div className="cockpit-subrow p-3 text-xs text-[var(--accent)] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{testError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveUni(null)}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold cockpit-subrow text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loadingMcqs}
                    onClick={() =>
                      void startUniversityD1Test(activeUni, selectedSubject, selectedTopic)
                    }
                    className="relative overflow-hidden inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-75"
                  >
                    <span>
                      {loadingMcqs ? 'Preparing your test...' : `Start ${activeUni.name} Test`}
                    </span>
                    {!loadingMcqs && <ArrowRight size={14} />}
                    {loadingMcqs && <ButtonLineLoader />}
                  </button>
                </div>
              </div>
            )}

            {testStage === 'running' && testMcqs[currentIndex] && (
              <div className="space-y-4">
                {/* Runner Top Status Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap cockpit-subrow px-3.5 py-2.5">
                  <span className="text-xs font-bold text-[var(--text)] tabular-nums">
                    Question {currentIndex + 1} of {testMcqs.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] tabular-nums">
                      <Clock size={13} />
                      {formatDurationClock(remainingSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleReportCurrentMcq(testMcqs[currentIndex])}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                      title="Report an issue with this MCQ"
                    >
                      <Flag size={12} />
                      <span>Report</span>
                    </button>
                  </div>
                </div>

                {reportNotice && (
                  <div className="text-xs font-medium text-[var(--accent)] px-1">
                    {reportNotice}
                  </div>
                )}

                {/* Question Stem */}
                <div className="cockpit-subrow p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{testMcqs[currentIndex].subject}</span>
                    <span>·</span>
                    <span>{testMcqs[currentIndex].topic}</span>
                  </div>
                  <div className="text-sm sm:text-base font-medium text-[var(--text)] leading-relaxed">
                    <MathText text={testMcqs[currentIndex].question} />
                  </div>
                </div>

                {/* Options A / B / C / D */}
                <div className="space-y-2">
                  {(
                    [
                      ['A', testMcqs[currentIndex].option_a],
                      ['B', testMcqs[currentIndex].option_b],
                      ['C', testMcqs[currentIndex].option_c],
                      ['D', testMcqs[currentIndex].option_d],
                    ] as const
                  ).map(([letter, optText]) => {
                    const selected = answers[testMcqs[currentIndex].id] === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [testMcqs[currentIndex].id]: letter,
                          }))
                        }
                        className={`w-full text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[var(--accent)] bg-[var(--cockpit-pill-live-bg)] text-[var(--text)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            selected
                              ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed flex-1">
                          <MathText text={optText} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation & Submit */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold cockpit-subrow text-[var(--text)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentIndex < testMcqs.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIndex((i) => Math.min(testMcqs.length - 1, i + 1))
                        }
                        className="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold cockpit-subrow text-[var(--text)] cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={submittingTest}
                      onClick={() => void submitUniversityD1Test()}
                      className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 cursor-pointer disabled:opacity-75"
                    >
                      {!submittingTest && <CheckCircle2 size={14} />}
                      <span>{submittingTest ? 'Calculating your score...' : 'Finish & Submit'}</span>
                      {submittingTest && <ButtonLineLoader />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {testStage === 'results' && testResultSummary && (
              <div className="space-y-4">
                <div className="cockpit-subrow p-4 text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--cockpit-pill-live-bg)] text-[var(--accent)]">
                    <Award size={20} />
                  </div>
                  <h4
                    className="text-base sm:text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {activeUni.name} Test Complete
                  </h4>
                  <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)] flex-wrap">
                    <span>
                      Accuracy: <strong className="text-[var(--text)]">{testResultSummary.accuracy}%</strong>
                    </span>
                    <span>
                      Correct: <strong className="text-[var(--text)]">{testResultSummary.correctCount}/{testResultSummary.totalQuestions}</strong>
                    </span>
                    <span>
                      Score: <strong className="text-[var(--text)]">{testResultSummary.score}/{testResultSummary.maxScore}</strong>
                    </span>
                  </div>
                </div>

                {/* Review Answers & Explanations */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {testMcqs.map((q, idx) => {
                    const userAns = answers[q.id];
                    const ver = verifiedMap[q.id];
                    const correctAns = ver?.correctAnswer || q.correct_answer;
                    const isCorrect = userAns === correctAns;
                    return (
                      <div key={q.id} className="cockpit-subrow p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
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
                            {userAns ? `Your Ans: ${userAns}` : 'Unanswered'} · Correct: {correctAns}
                          </span>
                        </div>
                        <div className="text-[var(--text)]">
                          <MathText text={q.question} />
                        </div>
                        {(ver?.explanation || q.explanation) && (
                          <div className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                            <MathText text={ver?.explanation || q.explanation} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestStage('overview')}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold cockpit-subrow text-[var(--text)] cursor-pointer"
                  >
                    New Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUni(null)}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] cursor-pointer"
                  >
                    Back to Cockpit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default OverviewPage;
