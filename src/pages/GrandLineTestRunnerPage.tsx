import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  AlertCircle,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getAmbassadorTestById,
  submitGrandLineAttempt,
  type AmbassadorTestDoc,
  type GrandLineAttempt,
} from '@/services/ambassadorTestService';
import { GRAND_LINE_NAME } from '@/constants/branding';

export function GrandLineTestRunnerPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [test, setTest] = useState<AmbassadorTestDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Candidate identity
  const [candidate, setCandidate] = useState<{
    name: string;
    email: string;
    entryTest: string;
  } | null>(null);

  // Test Runner State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GrandLineAttempt | null>(null);

  // Load test & candidate info
  useEffect(() => {
    if (!testId) return;

    // Load candidate info
    const stored = sessionStorage.getItem(`grandline_taker_${testId}`);
    if (stored) {
      try {
        setCandidate(JSON.parse(stored));
      } catch {
        // fallback
      }
    } else if (user) {
      setCandidate({
        name: profile?.displayName || user.displayName || 'Student',
        email: user.email || '',
        entryTest: profile?.targetUniversity || 'General Prep',
      });
    }

    async function fetchTest() {
      setLoading(true);
      try {
        const docData = await getAmbassadorTestById(testId!);
        if (!docData) {
          setError('Test not found or has been unpublished by the author.');
        } else {
          setTest(docData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test.');
      } finally {
        setLoading(false);
      }
    }

    fetchTest();
  }, [testId, user, profile]);

  // Timer
  useEffect(() => {
    if (result || loading || error || !test) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [result, loading, error, test]);

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: '4rem auto', padding: '1rem' }}>
        <Skeleton height={240} />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{ maxWidth: 640, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
        <GlassCard style={{ padding: '32px 24px' }}>
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-xl font-bold font-heading text-[var(--text)]">Cannot Start Test</h2>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{error || 'Test not found.'}</p>
          <div className="pt-4">
            <Link to="/grand-line" className="btn-red px-5 py-2 text-xs font-bold">
              Back to {GRAND_LINE_NAME}
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const questions = test.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQ = questions.length;

  const handleSelectOption = (optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!candidate) {
      navigate('/grand-line');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score
      let score = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correct) {
          score++;
        }
      });

      const attemptRecord = await submitGrandLineAttempt({
        testId: test.id,
        testTitle: test.title,
        creatorUid: test.creatorUid,
        name: candidate.name,
        email: candidate.email,
        entryTest: candidate.entryTest,
        score,
        totalQuestions: totalQ,
        timeTakenSeconds: timeElapsed,
      });

      setResult(attemptRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting test attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  // Result screen
  if (result) {
    const accuracy = Math.round((result.score / result.totalQuestions) * 100);
    return (
      <div style={{ maxWidth: 640, margin: '4rem auto', padding: '1rem' }}>
        <GlassCard style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>

          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
            Test Submitted Successfully
          </span>
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">
            {test.title}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Attempt recorded for <strong className="text-[var(--text)]">{result.name}</strong>
          </p>

          <div className="grid grid-cols-3 gap-3 my-6 text-center">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">Score</span>
              <span className="text-2xl font-display font-bold text-[#D71921]">
                {result.score} / {result.totalQuestions}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">Accuracy</span>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                {accuracy}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">Time</span>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                {result.timeTakenSeconds}s
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/grand-line')}
              className="w-full sm:w-auto"
            >
              <Trophy size={15} />
              <span>View {GRAND_LINE_NAME} Leaderboard</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              Return Home
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Test Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Badge color="red">{test.subject.toUpperCase()}</Badge>
            <span className="text-xs font-mono text-[var(--muted)]">{test.title}</span>
          </div>
          <p className="text-xs text-[var(--text-faint)] mt-1">
            Candidate: <strong>{candidate?.name || 'Student'}</strong> ({candidate?.entryTest || 'General'})
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono">
            <Clock size={13} className="text-[#D71921]" />
            <span>{Math.floor(timeElapsed / 60)}:{String(timeElapsed % 60).padStart(2, '0')}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
          >
            Submit Test
          </Button>
        </div>
      </div>

      {/* Progress & Palette */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
              currentIndex === i
                ? 'bg-[#D71921] text-white ring-2 ring-red-400/50'
                : answers[i] !== undefined
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-400'
                : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-white'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="flex items-center justify-between text-xs text-[var(--text-faint)] font-mono">
            <span>QUESTION {currentIndex + 1} OF {totalQ}</span>
            {currentQuestion.chapter && <span>{currentQuestion.chapter}</span>}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[var(--text)] leading-relaxed">
            {currentQuestion.q}
          </h3>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = answers[currentIndex] === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#D71921]/15 border-[#D71921] text-white ring-1 ring-[#D71921]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                      isSelected
                        ? 'bg-[#D71921] text-white'
                        : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </Button>

            {currentIndex < totalQ - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit Test
              </Button>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default GrandLineTestRunnerPage;
