import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttempt } from '@/services/testEngine';
import { MathText } from '@/components/ui/MathText';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Bookmark,
} from 'lucide-react';
import type { AttemptDoc } from '@/types/index';

type ReviewFilter = 'all' | 'mistakes' | 'flagged';

export function TestResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>('all');

  useEffect(() => {
    if (!attemptId) return;

    getAttempt(attemptId)
      .then((data) => {
        setAttempt(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const e = err as { code?: string; message?: string };
        console.error('[TestResultPage] Error fetching attempt:', err);
        setError({
          code: e.code,
          message: e.message ?? 'Failed to load test results',
        });
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={200} />
        <Skeleton height={140} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <ErrorState
          title="Could not load test results"
          error={error}
          onRetry={() => window.location.reload()}
          onBack={() => navigate('/dashboard')}
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  const questions = attempt.questions ?? [];
  const total = attempt.totalQuestions || questions.length;
  const score = attempt.score ?? 0;
  const percentage = attempt.percentage ?? 0;
  const correctCount = attempt.correctAnswers ?? 0;
  const wrongCount = attempt.wrongAnswers ?? 0;
  const unansweredCount = attempt.unanswered ?? 0;
  const userAnswers = attempt.userAnswers ?? {};
  const flagged = attempt.flagged ?? [];

  const isFastNuces =
    attempt.university?.toUpperCase().includes('FAST') ||
    attempt.university?.toUpperCase().includes('NUCES');

  const formatTime = (secs?: number) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Filtered Questions for Review
  const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return flagged.includes(idx);
    if (filter === 'mistakes') {
      const ans = userAnswers[String(idx)];
      return ans !== q.correct;
    }
    return true;
  });

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '2.5rem 1.25rem 5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Hero Scorecard */}
      <div
        className="glass glass-animated-border"
        style={{
          borderRadius: 'var(--r-hero)',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--brand-2)',
          }}
        >
          Session Complete · {attempt.subject ?? 'Practice Drill'}
        </span>

        {/* Big percentage & score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            className="font-display tabular-nums"
            style={{
              fontSize: 'clamp(48px, 8vw, 72px)',
              fontWeight: 800,
              lineHeight: 1,
              background:
                percentage >= 70
                  ? 'linear-gradient(135deg, #34D399, #10B981)'
                  : percentage >= 40
                  ? 'linear-gradient(135deg, #FBBF24, #FB923C)'
                  : 'linear-gradient(135deg, #F87171, #EF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {percentage}%
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-muted)' }}>
            ({score} / {total})
          </span>
        </div>

        <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 440 }}>
          {percentage >= 75
            ? 'Outstanding performance! You are on track for top entrance test percentiles.'
            : percentage >= 50
            ? 'Solid effort! Focus on the missed topics below to convert traps into points.'
            : 'Review the step-by-step explanations below to master the core concepts.'}
        </p>

        {isFastNuces && (
          <p style={{ fontSize: 12, color: 'var(--warning)', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 12px', borderRadius: 999 }}>
            ⚡ FAST-NUCES negative marking applied: -0.25 per incorrect answer
          </p>
        )}

        {/* Key Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 12,
            width: '100%',
            maxWidth: 600,
            marginTop: 8,
          }}
        >
          <div className="glass" style={{ borderRadius: 'var(--r-input)', padding: '12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{correctCount}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Correct</p>
          </div>

          <div className="glass" style={{ borderRadius: 'var(--r-input)', padding: '12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{wrongCount}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Incorrect</p>
          </div>

          <div className="glass" style={{ borderRadius: 'var(--r-input)', padding: '12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-faint)' }}>{unansweredCount}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Skipped</p>
          </div>

          <div className="glass" style={{ borderRadius: 'var(--r-input)', padding: '12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
              {formatTime(attempt.timeTakenSeconds)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Time Spent</p>
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard/practice')}
            style={{ gap: 8 }}
          >
            <BookOpen size={16} />
            <span>Practice Another Drill</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard')}
            style={{ gap: 8 }}
          >
            <span>Overview Dashboard</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* Review Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              Question Breakdown
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Detailed step-by-step solutions with KaTeX derivations
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                { id: 'all', label: `All (${questions.length})` },
                { id: 'mistakes', label: `Mistakes (${wrongCount + unansweredCount})` },
                { id: 'flagged', label: `Flagged (${flagged.length})` },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                    background: active ? 'rgba(47, 107, 255, 0.15)' : 'var(--surface)',
                    color: active ? 'var(--brand)' : 'var(--text-muted)',
                    transition: 'all 160ms',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredQuestions.map(({ q, idx }) => {
            const userAns = userAnswers[String(idx)];
            const isCorrect = userAns === q.correct;
            const isSkipped = userAns === undefined || userAns === null;
            const isItemFlagged = flagged.includes(idx);

            return (
              <div
                key={q.id || idx}
                className="glass"
                style={{
                  borderRadius: 'var(--r-card)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderLeft: isCorrect
                    ? '4px solid var(--success)'
                    : isSkipped
                    ? '4px solid var(--text-faint)'
                    : '4px solid var(--danger)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      Question {idx + 1}
                    </span>
                    {q.subject && (
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 999 }}>
                        {q.subject}
                      </span>
                    )}
                    {isItemFlagged && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)' }}>
                        <Bookmark size={11} fill="currentColor" /> Flagged
                      </span>
                    )}
                  </div>

                  <div>
                    {isCorrect ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle size={14} /> Correct (+1)
                      </span>
                    ) : isSkipped ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-faint)', fontSize: 12 }}>
                        <Clock size={14} /> Skipped (0)
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}>
                        <XCircle size={14} /> Incorrect ({isFastNuces ? '-0.25' : '0'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Stem */}
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6 }}>
                  <MathText block>{q.q}</MathText>
                </div>

                {/* Options Review */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((optText, optIdx) => {
                    const isOptionCorrect = optIdx === q.correct;
                    const isUserChoice = optIdx === userAns;

                    let bg = 'var(--surface)';
                    let border = '1px solid var(--border)';
                    let textColor = 'var(--text-muted)';

                    if (isOptionCorrect) {
                      bg = 'rgba(52, 211, 153, 0.12)';
                      border = '1px solid var(--success)';
                      textColor = 'var(--text)';
                    } else if (isUserChoice && !isOptionCorrect) {
                      bg = 'rgba(248, 113, 113, 0.12)';
                      border = '1px solid var(--danger)';
                      textColor = 'var(--text)';
                    }

                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 'var(--r-input)',
                          background: bg,
                          border,
                          color: textColor,
                          fontSize: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            background: isOptionCorrect
                              ? 'var(--success)'
                              : isUserChoice
                              ? 'var(--danger)'
                              : 'rgba(255, 255, 255, 0.08)',
                            color: isOptionCorrect || isUserChoice ? '#ffffff' : 'var(--text-faint)',
                          }}
                        >
                          {isOptionCorrect ? <Check size={13} /> : isUserChoice ? <X size={13} /> : ['A', 'B', 'C', 'D'][optIdx]}
                        </div>

                        <div style={{ flex: 1 }}>
                          <MathText>{optText}</MathText>
                        </div>

                        {isOptionCorrect && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isOptionCorrect && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explain && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--r-input)',
                      background: 'rgba(47, 107, 255, 0.08)',
                      border: '1px solid rgba(47, 107, 255, 0.2)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--text)',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Explanation & Solution Step
                    </p>
                    <MathText block>{q.explain}</MathText>
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
