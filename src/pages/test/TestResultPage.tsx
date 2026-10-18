import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttempt, reportQuestion } from '@/services/testEngine';
import { useAuth } from '@/contexts/AuthContext';
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
  Bot,
  Sparkles,
  RotateCcw,
  Flag,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { getUniversityCriteria, getSectionCriteria } from '@/constants/universityCriteria';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getBoardyExplanation } from '@/services/boardyAiService';
import type { AttemptDoc, AttemptQuestion } from '@/types/index';

type ReviewFilter = 'all' | 'mistakes' | 'flagged';

export function TestResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const effectivePlan = useEffectivePlan();

  const [attempt, setAttempt] = useState<AttemptDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [aiExplaining, setAiExplaining] = useState<Record<number, boolean>>({});
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});

  // Report modal state
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('wrong_key');
  const [reportComment, setReportComment] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleRequestAiExplanation = async (
    questionIndex: number,
    question: AttemptQuestion,
    userAns?: number,
    forceRefresh = false
  ) => {
    setAiExplaining((prev) => ({ ...prev, [questionIndex]: true }));
    try {
      const result = await getBoardyExplanation({
        question,
        questionIndex,
        chosenAnswerIndex: userAns,
        track: attempt?.university || 'General Entrance Exam',
        isUnlimited: Boolean(effectivePlan.isUnlimited || effectivePlan.isSuperAdmin),
        uid: user?.uid,
        forceRefresh,
      });

      setAiExplanations((prev) => ({ ...prev, [questionIndex]: result.explanation }));
    } catch (err) {
      console.warn('[TestResultPage] AI explain error:', err);
    } finally {
      setAiExplaining((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

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
            ({score} / {attempt.maxMarks || total})
          </span>
        </div>

        <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 440 }}>
          {percentage >= 75
            ? 'Outstanding performance! You are on track for top entrance test percentiles.'
            : percentage >= 50
            ? 'Solid effort! Focus on the missed topics below to convert traps into points.'
            : 'Review the step-by-step explanations below to master the core concepts.'}
        </p>

        {(() => {
          const uniCriteria = getUniversityCriteria(attempt.university);
          const sections = uniCriteria.sections || [];
          const penalizedSections = sections.filter((s) => s.negativePenalty && s.negativePenalty !== 0);
          const nonPenalizedSections = sections.filter((s) => !s.negativePenalty || s.negativePenalty === 0);

          let markingDetail = '';
          const defaultCorrect = sections[0]?.correctMarks ?? 1;
          const defaultPenalty = sections[0]?.negativePenalty ?? 0;
          if (uniCriteria.hasNegativeMarking) {
            if (penalizedSections.length > 0 && nonPenalizedSections.length > 0) {
              const penText = penalizedSections.map((s) => s.subject).join(' & ');
              const nonPenText = nonPenalizedSections.map((s) => s.subject).join(' & ');
              const pMark = penalizedSections[0].correctMarks;
              const pPen = penalizedSections[0].negativePenalty;
              const npMark = nonPenalizedSections[0].correctMarks;
              markingDetail = `${penText} (+${pMark} / ${pPen}), ${nonPenText} (+${npMark} / 0 NO PENALTY)`;
            } else {
              markingDetail = `+${defaultCorrect} correct / ${defaultPenalty} penalty per wrong answer (${uniCriteria.negativeMarking})`;
            }
          } else {
            markingDetail = `Standard marking: +${defaultCorrect} per correct answer (No negative marking)`;
          }

          return (
            <p
              style={{
                fontSize: 12,
                color: uniCriteria.hasNegativeMarking ? 'var(--warning)' : 'var(--text-muted)',
                background: uniCriteria.hasNegativeMarking ? 'rgba(251, 191, 36, 0.1)' : 'var(--surface-2)',
                padding: '4px 14px',
                borderRadius: 999,
                border: '1px solid var(--border)',
              }}
            >
              ⚡ {uniCriteria.name} marking scheme: {markingDetail}
            </p>
          );
        })()}

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

            const isUnavailable = q.isUnavailable || (!q.q && !q.stem);

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {(() => {
                      const secCrit = getSectionCriteria(attempt.university, q.subject);
                      const correctLabel = `+${secCrit.correctMarks}`;
                      const penaltyLabel = secCrit.hasPenalty ? `${secCrit.negativePenalty}` : '0';

                      if (isCorrect) {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>
                            <CheckCircle size={14} /> Correct ({correctLabel})
                          </span>
                        );
                      }
                      if (isSkipped) {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-faint)', fontSize: 12 }}>
                            <Clock size={14} /> Skipped (0)
                          </span>
                        );
                      }
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}>
                          <XCircle size={14} /> Incorrect ({penaltyLabel})
                        </span>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => setReportingQuestionId(q.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-pill)',
                        padding: '3px 9px',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Report issue with this question"
                    >
                      <Flag size={11} />
                      <span>Report</span>
                    </button>
                  </div>
                </div>

                {/* Question Stem or Deleted note */}
                {isUnavailable ? (
                  <div style={{ padding: '12px 16px', borderRadius: 'var(--r-input)', background: 'var(--surface-hover)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} className="text-[var(--accent)] shrink-0" />
                    <span>Question no longer available in the question bank. Your test score remains intact.</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6 }}>
                    <MathText block>{q.q || q.stem || ''}</MathText>
                  </div>
                )}

                {/* Options Review */}
                {!isUnavailable && Array.isArray(q.options) && q.options.length > 0 && (
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
                          {/* Letter Badge on EVERY option + Check/X marker */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: isOptionCorrect
                                  ? 'var(--success)'
                                  : isUserChoice
                                  ? 'var(--danger)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                color: isOptionCorrect || isUserChoice ? '#ffffff' : 'var(--text-faint)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1)}
                            </span>
                            {isOptionCorrect && (
                              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                                <Check size={14} />
                              </span>
                            )}
                            {isUserChoice && !isOptionCorrect && (
                              <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                                <X size={14} />
                              </span>
                            )}
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
                )}

                {/* Explanation: ONLY show if saved explanation exists and is not the placeholder */}
                {q.explain && q.explain.trim().length > 0 && !q.explain.includes('available in the study portal') && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--r-input)',
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--text)',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Standard Solution
                    </p>
                    <MathText block>{q.explain}</MathText>
                  </div>
                )}

                {/* Boardy AI Explanation Box with Safety & Token Awareness */}
                {(() => {
                  const hasValidKey =
                    typeof q.correct === 'number' &&
                    Array.isArray(q.options) &&
                    q.correct >= 0 &&
                    q.correct < q.options.length;

                  if (!hasValidKey) {
                    return (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--r-input)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                          <span>This question is being reviewed. Correct answer key is being verified.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportingQuestionId(q.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-pill)',
                            padding: '3px 9px',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Flag size={11} />
                          <span>Report</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {!aiExplanations[idx] ? (
                        <button
                          onClick={() => handleRequestAiExplanation(idx, q, userAns, false)}
                          disabled={aiExplaining[idx]}
                          style={{
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 14px',
                            borderRadius: 'var(--r-pill)',
                            border: '1px solid #D71921',
                            background: 'transparent',
                            color: 'var(--text)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: aiExplaining[idx] ? 'wait' : 'pointer',
                            transition: 'all 160ms',
                          }}
                          className="hover:bg-[#D71921] hover:text-white"
                        >
                          {aiExplaining[idx] ? (
                            <>
                              <Sparkles size={13} className="animate-spin text-[#D71921]" />
                              <span>Boardy is deriving solution...</span>
                            </>
                          ) : (
                            <>
                              <Bot size={14} className="text-[#D71921]" />
                              <span>Explain this with Boardy AI</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--r-card)',
                            background: 'var(--surface)',
                            border: '1px solid #D71921',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            overflowX: 'hidden',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D71921', fontSize: 12, fontWeight: 700 }}>
                              <Bot size={15} />
                              <span>Boardy AI Step-by-Step Derivation</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                onClick={() => handleRequestAiExplanation(idx, q, userAns, true)}
                                disabled={aiExplaining[idx]}
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-faint)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'none',
                                  border: 'none',
                                }}
                              >
                                <RotateCcw size={11} /> Re-derive
                              </button>
                              <button
                                onClick={() => setReportingQuestionId(q.id)}
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-faint)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'none',
                                  border: 'none',
                                }}
                                title="Report issue with explanation"
                              >
                                <Flag size={11} /> Report
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }} className="break-words">
                            <MathText block>{aiExplanations[idx]}</MathText>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── REPORT ISSUE MODAL ── */}
      {reportingQuestionId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-[var(--text)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                Report Question
              </h3>
              <button
                type="button"
                onClick={() => setReportingQuestionId(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto text-[var(--accent)]" size={32} />
                <p className="text-sm font-semibold">Report Received</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Thank you! Our academic reviewers will verify this question.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">What seems wrong?</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
                  >
                    <option value="wrong_key">Answer key appears incorrect</option>
                    <option value="broken_math">Math formula formatting issue</option>
                    <option value="unclear">Question wording is ambiguous or incomplete</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">Details (optional)</label>
                  <textarea
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Describe what needs correction..."
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingQuestionId(null)}
                    className="btn-outline px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user || reporting) return;
                      setReporting(true);
                      try {
                        await reportQuestion({
                          questionId: reportingQuestionId,
                          reason: reportReason,
                          comment: reportComment,
                          userId: user.uid,
                          userEmail: user.email || '',
                        });
                        setReportSuccess(true);
                        setTimeout(() => {
                          setReportingQuestionId(null);
                          setReportSuccess(false);
                          setReportComment('');
                        }, 1400);
                      } catch (err) {
                        console.warn('Report error:', err);
                      } finally {
                        setReporting(false);
                      }
                    }}
                    disabled={reporting}
                    className="btn-red px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {reporting && <Loader2 size={12} className="animate-spin" />}
                    <span>Submit Report</span>
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
