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
import { TestHeader } from '@/components/test/TestHeader';
import { QuestionCard } from '@/components/test/QuestionCard';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { ConfirmSubmitModal } from '@/components/test/ConfirmSubmitModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { exportTestToPdf } from '@/utils/testPdfExporter';
import { getUniversityRulesSummary } from '@/constants/universityCriteria';
import { Sparkles, Lock, X, AlertCircle, Check } from 'lucide-react';
import type { AttemptDoc, AttemptQuestion } from '@/types/index';

export function TestRunnerPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
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
  }, [attemptId, user, navigate, location.state, retryCount]);

  // 2. Submission Handler
  const handleFinalSubmit = useCallback(async () => {
    if (!attempt || !attemptId || !user || submitting) return;
    setSubmitting(true);
    try {
      const timeTakenSeconds = Math.max(
        1,
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
      await submitAttempt(attemptId, attempt, userAnswers, timeTakenSeconds, user.uid);
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
  }, [attempt, attemptId, user, submitting, userAnswers, navigate]);

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
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          maxWidth: 820,
          margin: '0 auto',
          gap: 24,
        }}
      >
        <Skeleton height={48} width="50%" />
        <Skeleton height={320} />
        <Skeleton height={60} />
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
  const title = [
    attempt.subject && attempt.subject !== 'Any' ? attempt.subject : 'Practice Drill',
    attempt.university && attempt.university !== 'Any' ? `(${attempt.university})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {/* 64px Glass Header */}
      <TestHeader
        title={title}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        secondsRemaining={secondsRemaining}
        timed={attempt.timed}
        answeredCount={Object.keys(userAnswers).length}
        flaggedCount={flagged.length}
        onOpenPalette={() => setPaletteOpen(true)}
        onRequestSubmit={() => setConfirmModalOpen(true)}
      />

      {/* Main Test Cockpit Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 1.25rem',
        }}
      >
        <QuestionCard
          question={currentQ}
          index={currentIndex}
          total={questions.length}
          selectedAnswer={userAnswers[String(currentIndex)]}
          isFlagged={flagged.includes(currentIndex)}
          onSelectAnswer={handleSelectAnswer}
          onClearAnswer={handleClearAnswer}
          onToggleFlag={handleToggleFlag}
          onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          canPrev={currentIndex > 0}
          canNext={currentIndex < questions.length - 1}
          university={attempt.university || undefined}
          isPro={isPro || isAdmin}
          onDownloadPdf={handleDownloadPdf}
        />
      </main>

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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom duration-200">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {/* Hourly Rate Limit Modal */}
      {pdfLimitMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
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
