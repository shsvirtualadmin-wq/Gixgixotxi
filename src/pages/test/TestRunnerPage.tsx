import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAttempt,
  fetchQuestionsForAttempt,
  startAttempt,
  saveAttemptProgress,
  submitAttempt,
} from '@/services/testEngine';
import { QuestionCard } from '@/components/test/QuestionCard';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { ConfirmSubmitModal } from '@/components/test/ConfirmSubmitModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getUniversityRulesSummary } from '@/constants/universityCriteria';
import { formatSubjectName } from '@/constants/taxonomy';
import {
  Sparkles,
  Lock,
  X,
  AlertCircle,
  Check,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AttemptDoc, AttemptQuestion } from '@/types/index';
import { notifyTestStarted } from '@/services/emailNotificationService';

export function TestRunnerPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user, isGuest, profile, updateLocalProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [attempt, setAttempt] = useState<AttemptDoc | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // PDF Download state
  const [pdfUpgradeModalOpen, setPdfUpgradeModalOpen] = useState(false);
  const [pdfLimitMessage, setPdfLimitMessage] = useState<string | null>(null);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [leaveWarningOpen, setLeaveWarningOpen] = useState(false);

  const effectivePlan = useEffectivePlan();
  const isPro = Boolean(effectivePlan.isPro || effectivePlan.isUnlimited || effectivePlan.isSuperAdmin);
  const isAdmin = Boolean(effectivePlan.isSuperAdmin);
  const isSubjectToDailyLimit = !isPro && !isAdmin;

  const autoSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 0. Leave-Test Interceptor (strict warning only for users subject to daily limits)
  useEffect(() => {
    if (!isSubjectToDailyLimit || submitting || loading || !attempt || attempt.status === 'completed') {
      return;
    }

    try {
      window.history.pushState({ inTest: true }, '');
    } catch {
      // Ignore history pushState failure in restricted environments
    }

    const handlePopState = () => {
      try {
        window.history.pushState({ inTest: true }, '');
      } catch {
        // Ignore history pushState failure in restricted environments
      }
      setLeaveWarningOpen(true);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'If you leave now, this test will be counted as one of your daily attempts.';
      return e.returnValue;
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubjectToDailyLimit, submitting, loading, attempt]);

  // 1. Initial Load & Start
  useEffect(() => {
    if (!attemptId || !user) return;
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        setError(null);
        setAttempt(null);
        setQuestions([]);
        setCurrentIndex(0);
        setUserAnswers({});
        setFlagged([]);
        setSecondsRemaining(null);
        setPaletteOpen(false);
        setConfirmModalOpen(false);
        setSubmitting(false);
        autoSubmittedRef.current = false;

        let currentAttempt: AttemptDoc;
        try {
          currentAttempt = await getAttempt(attemptId!);
        } catch (getErr) {
          const stateAttempt = (location.state as { attempt?: Partial<AttemptDoc> })?.attempt;
          if (stateAttempt) {
            currentAttempt = { id: attemptId!, ...stateAttempt } as AttemptDoc;
          } else {
            throw getErr;
          }
        }
        if (!isMounted) return;

        // If already completed, jump straight to results
        if (currentAttempt.status === 'completed') {
          navigate(`/test/${attemptId}/result`, { replace: true });
          return;
        }

        let testQuestions: AttemptQuestion[] = currentAttempt.questions ?? [];

        // If status is preparing or no questions attached, fetch and start
        if (currentAttempt.status === 'preparing' || testQuestions.length === 0) {
          testQuestions = await fetchQuestionsForAttempt(currentAttempt);
          if (testQuestions.length === 0) {
            setAttempt(currentAttempt);
            setQuestions([]);
            setError({
              code: 'NO_QUESTIONS',
              message: 'Not enough questions yet. Please select another subject or check back soon.',
            });
            setLoading(false);
            return;
          }
          const { endsAt } = await startAttempt(
            attemptId!,
            testQuestions,
            currentAttempt.durationSeconds,
            currentAttempt.timed
          );
          currentAttempt.endsAt = endsAt;
          currentAttempt.status = 'in_progress';
          currentAttempt.questions = testQuestions;

          if (!isGuest && user && !user.uid.startsWith('guest_')) {
            notifyTestStarted({
              attemptId: attemptId!,
              studentName: user.displayName || undefined,
              testName:
                currentAttempt.title ||
                [currentAttempt.subject, currentAttempt.university].filter(Boolean).join(' — ') ||
                'Boardly Practice Test',
              universityPattern: currentAttempt.university || 'Standard Drill',
              subjectScope: currentAttempt.subject || 'All Subjects',
              totalQuestions: testQuestions.length,
              durationMinutes: currentAttempt.durationSeconds
                ? Math.round(currentAttempt.durationSeconds / 60)
                : undefined,
            });
          }
        }

        setAttempt(currentAttempt);
        setQuestions(testQuestions);
        setUserAnswers(currentAttempt.userAnswers ?? {});
        setFlagged(currentAttempt.flagged ?? []);
        startTimeRef.current = Date.now();

        // Calculate timer from endsAt
        if (currentAttempt.timed && currentAttempt.endsAt) {
          const endsAtMillis =
            typeof (currentAttempt.endsAt as { toMillis?: () => number }).toMillis === 'function'
              ? (currentAttempt.endsAt as { toMillis: () => number }).toMillis()
              : (currentAttempt.endsAt as { seconds: number }).seconds * 1000;
          const left = Math.max(0, Math.floor((endsAtMillis - Date.now()) / 1000));
          setSecondsRemaining(left);
        } else {
          setSecondsRemaining(null);
        }

        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        const e = err as { code?: string; message?: string };
        console.error('[TestRunnerPage] Initialization error:', err);
        setError({
          code: e.code,
          message: e.message ?? 'Failed to load test session',
          path: `attempts/${attemptId}`,
        });
        setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [attemptId, user, isGuest, navigate, location.state, retryCount]);

  // 2. Submission Handler
  const handleFinalSubmit = useCallback(async () => {
    if (!attempt || !attemptId || !user || submitting) return;
    setSubmitting(true);
    try {
      const timeTakenSeconds = Math.max(
        1,
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
      const resultMetrics = await submitAttempt(attemptId, attempt, userAnswers, timeTakenSeconds, user.uid);
      if (isGuest || user.uid.startsWith('guest_')) {
        const solvedDelta = resultMetrics.correctAnswers + resultMetrics.wrongAnswers;
        updateLocalProfile({
          testsCompleted: Number(profile?.testsCompleted || 0) + 1,
          totalQuestionsSolved: Number(profile?.totalQuestionsSolved || 0) + solvedDelta,
          streak: Math.max(1, Number(profile?.streak || 0)),
        });
      }
      navigate(`/test/${attemptId}/result`, { replace: true });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error('[TestRunnerPage] Submit error:', err);
      setError({
        code: e.code,
        message: e.message ?? 'Failed to submit test',
      });
      setSubmitting(false);
      setConfirmModalOpen(false);
    }
  }, [attempt, attemptId, user, isGuest, profile, updateLocalProfile, submitting, userAnswers, navigate]);

  // 3. Timer Countdown & Auto-Submit
  useEffect(() => {
    if (!attempt?.timed || secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      if (!autoSubmittedRef.current && !submitting) {
        autoSubmittedRef.current = true;
        handleFinalSubmit();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          if (!autoSubmittedRef.current && !submitting) {
            autoSubmittedRef.current = true;
            handleFinalSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt?.timed, secondsRemaining, handleFinalSubmit, submitting]);

  // 4. Answer Progress Autosave
  const handleSelectAnswer = useCallback(
    (optionIdx: number) => {
      const updated = { ...userAnswers, [String(currentIndex)]: optionIdx };
      setUserAnswers(updated);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (attemptId) {
          saveAttemptProgress(attemptId, updated, flagged);
        }
      }, 2000);
    },
    [userAnswers, currentIndex, attemptId, flagged]
  );

  const handleClearAnswer = useCallback(() => {
    const updated = { ...userAnswers };
    delete updated[String(currentIndex)];
    setUserAnswers(updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (attemptId) {
        saveAttemptProgress(attemptId, updated, flagged);
      }
    }, 2000);
  }, [userAnswers, currentIndex, attemptId, flagged]);

  const handleToggleFlag = useCallback(() => {
    const isCurrentlyFlagged = flagged.includes(currentIndex);
    const updated = isCurrentlyFlagged
      ? flagged.filter((i) => i !== currentIndex)
      : [...flagged, currentIndex];
    setFlagged(updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (attemptId) {
        saveAttemptProgress(attemptId, userAnswers, updated);
      }
    }, 2000);
  }, [flagged, currentIndex, attemptId, userAnswers]);

  // PDF Download Handler with Pro check & Server-enforced Hourly Limit
  const handleDownloadPdf = useCallback(async () => {
    if (!user) return;

    // 1. Pro check: Only Pro users (or Admin) can download
    if (!isPro && !isAdmin) {
      setPdfUpgradeModalOpen(true);
      return;
    }

    // 2. Server-side hourly rate limit: 1 download per hour per user (Admin exempt)
    if (!isAdmin) {
      try {
        const res = await fetch('/api/tests/pdf-download-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            role: (user as { role?: string }).role || 'student',
          }),
        });

        if (res.status === 429) {
          const data = (await res.json()) as { message?: string; remainingMinutes?: number };
          setPdfLimitMessage(
            data.message ||
              `Download limit: Pro members can download 1 PDF per hour. Please wait before downloading another test PDF.`
          );
          return;
        }
      } catch {
        // Fallback to client localStorage check if server API is unavailable
        const storageKey = `boardly_pdf_dl_${user.uid}`;
        const lastStr = localStorage.getItem(storageKey);
        if (lastStr) {
          const lastTime = Number(lastStr);
          const elapsed = Date.now() - lastTime;
          const oneHour = 60 * 60 * 1000;
          if (elapsed < oneHour) {
            const remainingMinutes = Math.ceil((oneHour - elapsed) / (60 * 1000));
            setPdfLimitMessage(
              `Download limit: Pro members can download 1 PDF per hour. Please wait ${remainingMinutes} minute${
                remainingMinutes === 1 ? '' : 's'
              } before downloading another test PDF.`
            );
            return;
          }
        }
        localStorage.setItem(storageKey, String(Date.now()));
      }
    }

    const testTitle = [
      attempt?.subject && attempt.subject !== 'Any' ? attempt.subject : 'Practice Drill',
      attempt?.university && attempt.university !== 'Any' ? `(${attempt.university})` : '',
    ]
      .filter(Boolean)
      .join(' ') || 'Boardly Practice Test';

    setPdfSuccessMessage('Generating test PDF with KaTeX math rendering...');

    try {
      const { exportTestToPdf } = await import('@/utils/testPdfExporter');
      await exportTestToPdf(
        {
          title: testTitle,
          university: attempt?.university || 'General Entrance Drill',
          markingScheme: getUniversityRulesSummary(attempt?.university),
          studentName: user.displayName || 'Candidate',
          studentEmail: user.email || '',
          questions,
        },
        (progressText) => setPdfSuccessMessage(progressText)
      );

      setPdfSuccessMessage('Test PDF downloaded successfully!');
      setTimeout(() => setPdfSuccessMessage(null), 3500);
    } catch (exportErr) {
      console.error('[TestRunnerPage] PDF export failed:', exportErr);
      setPdfLimitMessage('Could not generate PDF. Please try again.');
    }
  }, [user, isPro, isAdmin, attempt, questions]);

  // 5. Keyboard Navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        paletteOpen ||
        confirmModalOpen
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      // Options: 1/A (0), 2/B (1), 3/C (2), 4/D (3)
      if (key === '1' || key === 'A') {
        e.preventDefault();
        handleSelectAnswer(0);
      } else if (key === '2' || key === 'B') {
        e.preventDefault();
        handleSelectAnswer(1);
      } else if (key === '3' || key === 'C') {
        e.preventDefault();
        handleSelectAnswer(2);
      } else if (key === '4' || key === 'D') {
        e.preventDefault();
        handleSelectAnswer(3);
      } else if (key === 'F') {
        e.preventDefault();
        handleToggleFlag();
      } else if (key === 'P' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (key === 'N' || e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleSelectAnswer,
    handleToggleFlag,
    questions.length,
    paletteOpen,
    confirmModalOpen,
  ]);

  if (loading) {
    return (
      <div
        className="nt-quiz-shell select-none"
        aria-busy="true"
        aria-label="Loading test questions"
      >
        <div className="nt-quiz-main">
          <header className="nt-topbar">
            <div className="h-10 w-20 rounded-full skeleton-shimmer" />
            <div className="nt-topbar-right">
              <div className="h-10 w-28 rounded-full skeleton-shimmer" />
              <div className="h-10 w-10 rounded-full skeleton-shimmer" />
              <div className="h-10 w-10 rounded-full skeleton-shimmer" />
            </div>
          </header>
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
              <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
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
      </div>
    );
  }

  if (error || !attempt || questions.length === 0) {
    const isNoQuestions = (!error || error.code === 'NO_QUESTIONS') && attempt && questions.length === 0;
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <ErrorState
          title={isNoQuestions ? 'Not enough questions yet' : 'Could not load practice session'}
          error={
            isNoQuestions
              ? { message: 'Not enough questions have been published for this test track yet. Please choose another subject or check back soon.' }
              : error
          }
          path={error?.path}
          onRetry={() => setRetryCount((c) => c + 1)}
          onBack={() => navigate('/dashboard/practice')}
          backLabel="Back to Practice Vault"
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const examChipLabel =
    attempt.university && attempt.university !== 'Any'
      ? attempt.university.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase()
      : attempt.subject && attempt.subject !== 'Any'
      ? formatSubjectName(attempt.subject)
      : 'SAT';

  const formatTimerText = (secs: number | null) => {
    if (secs === null) return '00:00';
    const safe = Math.max(0, Math.floor(secs));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTimerUrgent =
    attempt.timed && secondsRemaining !== null && secondsRemaining > 0 && secondsRemaining < 300;

  return (
    <div className="nt-quiz-shell select-none">
      {/* 1–4. CENTERED MAIN COLUMN (max-w 760px, fits 100dvh with no scrolling) */}
      <main className="nt-quiz-main">
        {/* 1. TOP BAR: round "SAT" chip (red text), timer chip, PDF icon button, close icon button */}
        <header className="nt-topbar">
          <div className="nt-chip nt-chip--exam" title={examChipLabel}>
            <span>{examChipLabel}</span>
          </div>

          <div className="nt-topbar-right">
            {attempt.timed && secondsRemaining !== null && (
              <div
                className={`nt-chip nt-chip--timer ${
                  isTimerUrgent ? 'nt-chip--timer-urgent' : ''
                }`}
                aria-label="Time remaining"
              >
                <Clock size={14} className="text-[#d71921] shrink-0" />
                <span className="nt-doto">{formatTimerText(secondsRemaining)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              title={
                isPro || isAdmin
                  ? 'Download test questions as PDF'
                  : 'Download test questions as PDF (Pro Feature)'
              }
              aria-label="Download PDF"
              className="nt-chip nt-chip--icon"
            >
              <Download size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSubjectToDailyLimit) {
                  setLeaveWarningOpen(true);
                } else {
                  navigate('/dashboard/practice');
                }
              }}
              title="Close test"
              aria-label="Close test"
              className="nt-chip nt-chip--icon"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* 2–4. PROGRESS + QUESTION CARD + 4 OPTIONS GRID */}
        <QuestionCard
          question={currentQ}
          index={currentIndex}
          total={questions.length}
          selectedAnswer={userAnswers[String(currentIndex)]}
          isFlagged={flagged.includes(currentIndex)}
          onSelectAnswer={handleSelectAnswer}
          onClearAnswer={handleClearAnswer}
          onToggleFlag={handleToggleFlag}
          userAnswersMap={userAnswers}
          onSelectIndex={(idx) => setCurrentIndex(idx)}
          university={attempt.university || undefined}
          isPro={isPro || isAdmin}
          onDownloadPdf={handleDownloadPdf}
        />
      </main>

      {/* 5. BOTTOM DOCK: pinned, frosted-glass bar with square Previous icon button, Next button, and red Finish & Submit button */}
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
              disabled={currentIndex >= questions.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="nt-btn-next"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmModalOpen(true)}
              className="nt-btn-submit"
            >
              <span>{submitting ? 'Submitting...' : 'Finish & Submit'}</span>
              {submitting && <ButtonLineLoader />}
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-over Palette */}
      <QuestionPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        userAnswers={userAnswers}
        flagged={flagged}
        onSelectIndex={(idx) => setCurrentIndex(idx)}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmSubmitModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleFinalSubmit}
        submitting={submitting}
        totalQuestions={questions.length}
        answeredCount={Object.keys(userAnswers).length}
        flaggedCount={flagged.length}
        secondsRemaining={secondsRemaining}
      />

      {/* Success Notification Toast */}
      {pdfSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl floating-blur backdrop-blur-lg border border-[var(--border)] text-[var(--text)] text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom duration-200">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {/* Hourly Rate Limit Modal */}
      {pdfLimitMessage && (
        <div className="fixed inset-0 z-50 overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-[var(--text)] animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                Hourly Download Limit
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1.5">
                {pdfLimitMessage}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPdfLimitMessage(null)}
                className="btn-red px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Locked State / Upgrade Modal */}
      {pdfUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl text-[var(--text)] animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <Lock size={22} />
              </div>
              <button
                type="button"
                onClick={() => setPdfUpgradeModalOpen(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-semibold tracking-wide uppercase mb-2">
                <Sparkles size={12} />
                <span>Boardly Pro Exclusive</span>
              </div>
              <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--text)]">
                Unlock PDF Exam Exports
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-1.5">
                Download complete, printable entrance test papers with full question stems, 4-choice options, and official answer keys for offline paper practice.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--text)]">
                <Check size={14} className="text-[var(--accent)] shrink-0" />
                <span>1 Full Test PDF export per hour</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text)]">
                <Check size={14} className="text-[var(--accent)] shrink-0" />
                <span>Formatted for crisp standard A4 physical printing</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text)]">
                <Check size={14} className="text-[var(--accent)] shrink-0" />
                <span>Includes complete official answer key appendix</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPdfUpgradeModalOpen(false)}
                className="btn-outline px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/plans')}
                className="btn-red px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE-TEST MIDWAY WARNING POPUP (Requirement 7) ── */}
      {leaveWarningOpen && (
        <div className="fixed inset-0 z-[100] overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[var(--text)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[var(--text)]">
                  Leave Test Session?
                </h3>
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Test In Progress
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              If you leave now, this test will be counted as one of your daily attempts.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLeaveWarningOpen(false)}
                className="btn-outline px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveWarningOpen(false);
                  navigate('/dashboard/practice', { replace: true });
                }}
                className="btn-red px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Leave Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
