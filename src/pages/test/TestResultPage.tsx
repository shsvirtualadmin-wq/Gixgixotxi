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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 pb-20 flex flex-col gap-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Hero Scorecard */}
      <div className="glass glass-animated-border rounded-3xl p-4 sm:p-8 flex flex-col items-center text-center gap-4 w-full max-w-full min-w-0">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-2)] break-words max-w-full text-center px-2">
          Session Complete · {attempt.subject ?? 'Practice Drill'}
        </span>

        {/* Big percentage & score */}
        <div className="flex items-baseline justify-center gap-3 flex-wrap max-w-full">
          <span
            className="font-display tabular-nums text-5xl sm:text-7xl font-extrabold leading-none"
            style={{
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
          <span className="text-xl sm:text-2xl font-bold text-[var(--text-muted)]">
            ({score} / {attempt.maxMarks || total})
          </span>
        </div>

        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md break-words px-2 leading-relaxed">
          {percentage >= 75
            ? 'Outstanding performance! You are on track for top entrance test percentiles.'
            : percentage >= 50
            ? 'Solid effort! Focus on the missed topics below to convert traps into points.'
            : 'Review the step-by-step explanations below to master the core concepts.'}
        </p>

        {(() => {
          const isSprint =
            attempt.mode === 'sprint' ||
            (attempt.title && attempt.title.toLowerCase().includes('sprint')) ||
            (attempt.university && attempt.university.toLowerCase().includes('sprint'));
          if (isSprint) {
            return (
              <p className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-3.5 py-1.5 rounded-2xl sm:rounded-full border border-[var(--border)] max-w-full break-words text-center leading-relaxed">
                ⚡ 10-Minute Sprint marking scheme: Standard (+1.0 / 0.0) · No negative marking
              </p>
            );
          }

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
              className={`text-xs px-3.5 py-1.5 rounded-2xl sm:rounded-full border border-[var(--border)] max-w-full break-words text-center leading-relaxed ${
                uniCriteria.hasNegativeMarking ? 'text-[var(--warning)] bg-amber-500/10' : 'text-[var(--text-muted)] bg-[var(--surface-2)]'
              }`}
            >
              ⚡ {uniCriteria.name} marking scheme: {markingDetail}
            </p>
          );
        })()}

        {/* Key Metrics Row: 2-column grid on mobile, 4-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-2 min-w-0">
          <div className="glass rounded-xl p-3 min-w-0 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--success)]">{correctCount}</p>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">Correct</p>
          </div>

          <div className="glass rounded-xl p-3 min-w-0 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--danger)]">{wrongCount}</p>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">Incorrect</p>
          </div>

          <div className="glass rounded-xl p-3 min-w-0 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--text-faint)]">{unansweredCount}</p>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">Skipped</p>
          </div>

          <div className="glass rounded-xl p-3 min-w-0 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--text)]">
              {formatTime(attempt.timeTakenSeconds)}
            </p>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">Time Spent</p>
          </div>
        </div>

        {/* Action CTAs: stacked full-width on mobile */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard/practice')}
            className="w-full sm:w-auto justify-center"
            style={{ gap: 8 }}
          >
            <BookOpen size={16} />
            <span>Practice Another Drill</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto justify-center"
            style={{ gap: 8 }}
          >
            <span>Overview Dashboard</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* Review Section */}
      <div className="min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-w-0 max-w-full">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text)]">
              Question Breakdown
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Detailed step-by-step solutions with KaTeX derivations
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap max-w-full">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                    active
                      ? 'border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--brand)] font-semibold'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Cards List */}
        <div className="flex flex-col gap-4 min-w-0 max-w-full">
          {filteredQuestions.map(({ q, idx }) => {
            const userAns = userAnswers[String(idx)];
            const isCorrect = userAns === q.correct;
            const isSkipped = userAns === undefined || userAns === null;
            const isItemFlagged = flagged.includes(idx);

            const isUnavailable = q.isUnavailable || (!q.q && !q.stem);

            return (
              <div
                key={q.id || idx}
                className={`glass rounded-2xl p-4 sm:p-6 flex flex-col gap-4 min-w-0 max-w-full overflow-hidden ${
                  isCorrect
                    ? 'border-l-4 border-l-[var(--success)]'
                    : isSkipped
                    ? 'border-l-4 border-l-[var(--text-faint)]'
                    : 'border-l-4 border-l-[var(--danger)]'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 min-w-0 max-w-full">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                      Question {idx + 1}
                    </span>
                    {q.subject && (
                      <span className="text-[11px] text-[var(--text-faint)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                        {q.subject}
                      </span>
                    )}
                    {isItemFlagged && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                        <Bookmark size={11} fill="currentColor" /> Flagged
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const isSprint =
                        attempt.mode === 'sprint' ||
                        (attempt.title && attempt.title.toLowerCase().includes('sprint')) ||
                        (attempt.university && attempt.university.toLowerCase().includes('sprint'));
                      const secCrit = getSectionCriteria(attempt.university, q.subject);
                      const correctLabel = '+1.0';
                      const penaltyLabel = isSprint ? '0' : (secCrit.hasPenalty ? `${secCrit.negativePenalty}` : '0');

                      if (isCorrect) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[var(--success)] text-xs font-bold">
                            <CheckCircle size={14} /> Correct ({correctLabel})
                          </span>
                        );
                      }
                      if (isSkipped) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[var(--text-faint)] text-xs">
                            <Clock size={14} /> Skipped (0)
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 text-[var(--danger)] text-xs font-bold">
                          <XCircle size={14} /> Incorrect ({penaltyLabel})
                        </span>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => setReportingQuestionId(q.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title="Report issue with this question"
                    >
                      <Flag size={11} />
                      <span>Report</span>
                    </button>
                  </div>
                </div>

                {/* Question Stem or Deleted note */}
                {isUnavailable ? (
                  <div className="p-3 sm:p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text-muted)] flex items-center gap-2 min-w-0 max-w-full break-words">
                    <AlertTriangle size={16} className="text-[var(--accent)] shrink-0" />
                    <span>Question no longer available in the question bank. Your test score remains intact.</span>
                  </div>
                ) : (
                  <div className="text-sm sm:text-base font-semibold text-[var(--text)] leading-relaxed min-w-0 max-w-full break-words overflow-x-auto">
                    <MathText block>{q.q || q.stem || ''}</MathText>
                  </div>
                )}

                {/* Options Review */}
                {!isUnavailable && Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="flex flex-col gap-2 min-w-0 max-w-full">
                    {q.options.map((optText, optIdx) => {
                      const isOptionCorrect = optIdx === q.correct;
                      const isUserChoice = optIdx === userAns;

                      let optClasses = 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]';
                      if (isOptionCorrect) {
                        optClasses = 'border-[var(--success)] bg-emerald-500/10 text-[var(--text)]';
                      } else if (isUserChoice && !isOptionCorrect) {
                        optClasses = 'border-[var(--danger)] bg-red-500/10 text-[var(--text)]';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm min-w-0 max-w-full break-words ${optClasses}`}
                        >
                          {/* Letter Badge on EVERY option + Check/X marker */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--border)] ${
                                isOptionCorrect
                                  ? 'bg-[var(--success)] text-white'
                                  : isUserChoice
                                  ? 'bg-[var(--danger)] text-white'
                                  : 'bg-white/10 text-[var(--text-faint)]'
                              }`}
                            >
                              {['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1)}
                            </span>
                            {isOptionCorrect && (
                              <span className="text-[var(--success)]">
                                <Check size={14} />
                              </span>
                            )}
                            {isUserChoice && !isOptionCorrect && (
                              <span className="text-[var(--danger)]">
                                <X size={14} />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 break-words overflow-x-auto">
                            <MathText>{optText}</MathText>
                          </div>

                          {isOptionCorrect && (
                            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--success)] shrink-0 hidden xs:inline">
                              Correct Answer
                            </span>
                          )}
                          {isUserChoice && !isOptionCorrect && (
                            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--danger)] shrink-0 hidden xs:inline">
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
                  <div className="p-3 sm:p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-sm leading-relaxed text-[var(--text)] min-w-0 max-w-full break-words overflow-x-auto">
                    <p className="text-[10px] sm:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
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
                      <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-2.5 text-xs min-w-0 max-w-full">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] min-w-0">
                          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                          <span className="truncate">This question is being reviewed. Correct answer key is being verified.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportingQuestionId(q.id)}
                          className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer shrink-0 inline-flex items-center gap-1"
                        >
                          <Flag size={11} />
                          <span>Report</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2.5 min-w-0 max-w-full">
                      {!aiExplanations[idx] ? (
                        <button
                          onClick={() => handleRequestAiExplanation(idx, q, userAns, false)}
                          disabled={aiExplaining[idx]}
                          className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D71921] bg-transparent text-[var(--text)] text-xs font-semibold cursor-pointer hover:bg-[#D71921] hover:text-white transition-colors disabled:cursor-wait max-w-full"
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
                        <div className="p-3 sm:p-4 rounded-2xl bg-[var(--surface)] border border-[#D71921] flex flex-col gap-2.5 min-w-0 max-w-full overflow-hidden">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[#D71921] text-xs font-bold">
                              <Bot size={15} />
                              <span>Boardy AI Step-by-Step Derivation</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRequestAiExplanation(idx, q, userAns, true)}
                                disabled={aiExplaining[idx]}
                                className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <RotateCcw size={11} /> Re-derive
                              </button>
                              <button
                                onClick={() => setReportingQuestionId(q.id)}
                                className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer flex items-center gap-1"
                                title="Report issue with explanation"
                              >
                                <Flag size={11} /> Report
                              </button>
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm leading-relaxed text-[var(--text)] break-words min-w-0 max-w-full overflow-x-auto">
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
