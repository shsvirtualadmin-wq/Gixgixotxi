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
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const autoSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 1. Initial Load & Start
  useEffect(() => {
    if (!attemptId || !user) return;
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        setError(null);

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
              message: 'No questions available yet. Please select another subject or check back later.',
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
  }, [attemptId, user, navigate, location.state]);

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
          title={isNoQuestions ? 'No questions available yet' : 'Could not load practice session'}
          error={
            isNoQuestions
              ? { message: 'No questions have been published for this test track yet. Please check back soon or select another subject.' }
              : error
          }
          path={error?.path}
          onRetry={() => window.location.reload()}
          onBack={() => navigate('/dashboard/practice')}
          backLabel="Back to Practice Vault"
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
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
    </div>
  );
}
