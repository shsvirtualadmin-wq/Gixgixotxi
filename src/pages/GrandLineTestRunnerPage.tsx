import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Compass,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAmbassadorTestById,
  submitAmbassadorTestAttempt,
  type AmbassadorCustomTest,
  type GradedAttemptQuestion,
} from '@/services/ambassadorTestService';
import { MathText } from '@/components/ui/MathText';
import { showApiToast } from '@/lib/api';

export function GrandLineTestRunnerPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [test, setTest] = useState<AmbassadorCustomTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
    gradedQuestions: GradedAttemptQuestion[];
  } | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!testId) return;
    let active = true;
    setLoading(true);
    getAmbassadorTestById(testId, false)
      .then((res) => {
        if (!active) return;
        setTest(res);
        if (res) {
          setTimeLeftSec((res.durationMinutes || 20) * 60);
          startTimeRef.current = Date.now();
        }
      })
      .catch((err) => {
        console.warn('[GrandLineTestRunnerPage] Failed to load test:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [testId]);

  const handleFinish = useCallback(async () => {
    if (!test || submitted || submitting) return;
    setSubmitting(true);

    const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const answerArray = test.questions.map((_, idx) =>
      answers[idx] !== undefined ? answers[idx] : -1
    );

    try {
      const attempt = await submitAmbassadorTestAttempt({
        testId: test.id,
        answers: answerArray,
        timeTakenSeconds: elapsedSec,
        userName: profile?.displayName || user?.displayName || 'Student',
        userAvatar: profile?.photoURL || user?.photoURL || null,
      });

      setScoreResult({
        score: attempt.score,
        totalQuestions: attempt.totalQuestions || test.questions.length,
        percentage: attempt.percentage,
        gradedQuestions:
          attempt.gradedQuestions ||
          test.questions.map((q, idx) => ({
            id: q.id,
            position: idx,
            question: q.question,
            options: q.options,
            selectedIndex: answers[idx] ?? -1,
            correctIndex: q.correctIndex ?? 0,
            isCorrect: (answers[idx] ?? -1) === (q.correctIndex ?? 0),
            explanation: q.explanation,
          })),
      });
      setSubmitted(true);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to submit test attempt.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [test, submitted, submitting, answers, user, profile]);

  // Countdown timer
  useEffect(() => {
    if (!test || submitted || timeLeftSec <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, submitted, timeLeftSec, handleFinish]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-[var(--muted)]">Preparing Grand Line test...</p>
        </div>
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
          <h1 className="text-base font-bold text-[var(--text)]">Test Not Available</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            This test could not be found or has no questions yet.
          </p>
          <Link
            to="/grand-line"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
          >
            <ArrowLeft size={14} />
            Back to Grand Line
          </Link>
        </div>
      </div>
    );
  }

  const totalQ = test.questions.length;
  const currentQ = test.questions[currentIndex];
  const mins = Math.floor(timeLeftSec / 60);
  const secs = timeLeftSec % 60;

  if (submitted && scoreResult) {
    const { score, totalQuestions, percentage, gradedQuestions } = scoreResult;

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Score Summary Card */}
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
              {test.crewName} • {test.subject}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">{test.title}</h1>
            <p className="text-3xl sm:text-4xl font-extrabold text-[var(--accent)] mt-4 tabular-nums">
              {score} / {totalQuestions}{' '}
              <span className="text-lg font-semibold text-[var(--muted)]">({percentage}%)</span>
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              Created by Captain {test.captainName}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setCurrentIndex(0);
                  setSubmitted(false);
                  setScoreResult(null);
                  setTimeLeftSec((test.durationMinutes || 20) * 60);
                  startTimeRef.current = Date.now();
                }}
                className="px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                Retake Test
              </button>
              <Link
                to="/grand-line/leaderboard"
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 flex items-center gap-1.5"
              >
                <Trophy size={14} />
                View Leaderboard
              </Link>
              <Link
                to="/grand-line"
                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-95 flex items-center gap-1.5"
              >
                <Compass size={14} />
                More Grand Line Tests
              </Link>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[var(--text)] px-1">
              Answer Key &amp; Explanations
            </h2>
            {gradedQuestions.map((q, idx) => {
              const userChoice = q.selectedIndex;
              const isCorrect = q.isCorrect;
              return (
                <div
                  key={q.id || idx}
                  className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-mono font-bold text-[var(--muted)]">
                      Q{idx + 1}.
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                        <CheckCircle2 size={13} /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                        <XCircle size={13} /> {userChoice === -1 ? 'Skipped' : 'Incorrect'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-[var(--text)]">
                    <MathText text={q.question} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isRightOpt = optIdx === q.correctIndex;
                      const isUserOpt = optIdx === userChoice;
                      let cls = 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]';
                      if (isRightOpt) {
                        cls = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold';
                      } else if (isUserOpt && !isRightOpt) {
                        cls = 'border-red-500/50 bg-red-500/10 text-red-400';
                      }
                      return (
                        <div
                          key={optIdx}
                          className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${cls}`}
                        >
                          <span className="font-mono font-bold">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <MathText text={opt} />
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                      <span className="font-semibold text-[var(--text)]">Explanation: </span>
                      <MathText text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/grand-line')}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Exit
              </button>
              <span className="text-[var(--border)]">•</span>
              <span className="text-xs font-mono text-[var(--accent)] truncate">
                {test.crewName}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[var(--text)] truncate">
              {test.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums">
              <Clock size={14} className={timeLeftSec < 60 ? 'text-red-500 animate-pulse' : 'text-[var(--muted)]'} />
              <span className={timeLeftSec < 60 ? 'text-red-500' : 'text-[var(--text)]'}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Question Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-mono font-semibold tabular-nums">
              Question {currentIndex + 1} of {totalQ}
            </span>
            <span className="tabular-nums">
              {Object.keys(answers).length} / {totalQ} answered
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
            />
          </div>

          {/* Question Stem */}
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6 space-y-5">
            <div className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed">
              <MathText text={currentQ.question} />
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const selected = answers[currentIndex] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentIndex]: idx }))}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]/40'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        selected
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm">
                      <MathText text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          {currentIndex < totalQ - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Finish &amp; Score
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default GrandLineTestRunnerPage;
