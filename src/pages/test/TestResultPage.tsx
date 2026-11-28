import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttempt, reportQuestion } from '@/services/testEngine';
import { useAuth } from '@/contexts/AuthContext';
import { MathText } from '@/components/ui/MathText';
import { Button } from '@/components/ui/Button';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';
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
  RotateCcw,
  Flag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { getUniversityCriteria, getSectionCriteria } from '@/constants/universityCriteria';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getBoardyExplanation } from '@/services/boardyAiService';
import { routes } from '@/utils/routes';
import type { AttemptDoc, AttemptQuestion } from '@/types/index';
import { AdSlot } from '@/components/AdSlot';
import { AD_SLOTS } from '@/config/ads';
import { useLanguage } from '@/contexts/LanguageContext';

type ReviewFilter = 'all' | 'mistakes' | 'flagged';

export function TestResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const { t, formatNumber } = useLanguage();
  const navigate = useNavigate();
  const effectivePlan = useEffectivePlan();

  const [attempt, setAttempt] = useState<AttemptDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
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
    let mounted = true;
    setLoading(true);
    setError(null);
    setAttempt(null);
    setFilter('all');
    setAiExplaining({});
    setAiExplanations({});

    getAttempt(attemptId)
      .then((data) => {
        if (!mounted) return;
        setAttempt(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const e = err as { code?: string; message?: string };
        console.error('[TestResultPage] Error fetching attempt:', err);
        setError({
          code: e.code,
          message: e.message ?? 'Failed to load test results',
        });
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [attemptId, retryCount]);

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '2rem auto', padding: '1rem' }}>
        <LineLoader context="results" variant="section" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <ErrorState
          title={t('common.somethingWrong')}
          error={error}
          onRetry={() => setRetryCount((c) => c + 1)}
          onBack={() => navigate('/dashboard/practice', { replace: true })}
          backLabel={t('common.back')}
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
      <div className="glass-panel glass-animated-border rounded-[32px] p-5 sm:p-8 flex flex-col items-center text-center gap-4 w-full max-w-full min-w-0">
        <span className="section-chip break-words max-w-full text-center">
          {t('test.resultsTitle')} · {attempt.subject ?? t('nav.practice')}
        </span>

        {/* Big percentage & score */}
        <div className="flex items-baseline justify-center gap-3 flex-wrap max-w-full ltr-nums">
          <span
            className="font-dot tabular-nums text-5xl sm:text-7xl font-extrabold leading-none"
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
            {formatNumber(percentage)}%
          </span>
          <span className="font-dot text-xl sm:text-2xl font-bold text-[var(--text-muted)]">
            ({formatNumber(score)} / {formatNumber(attempt.maxMarks || total)})
          </span>
        </div>

        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md break-words px-2 leading-relaxed">
          {percentage >= 75
            ? t('test.greatJob')
            : percentage >= 50
            ? t('test.keepPracticing')
            : t('test.needsWork')}
        </p>

        {(() => {
          const isSprint =
            attempt.mode === 'sprint' ||
            (attempt.title && attempt.title.toLowerCase().includes('sprint')) ||
            (attempt.university && attempt.university.toLowerCase().includes('sprint'));
          if (isSprint) {
            return (
              <p className="text-xs text-[var(--text-muted)] glass-pill px-3.5 py-1.5 rounded-2xl sm:rounded-full max-w-full break-words text-center leading-relaxed">
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
              className={`text-xs px-3.5 py-1.5 rounded-2xl sm:rounded-full border border-[var(--glass-border)] max-w-full break-words text-center leading-relaxed ${
                uniCriteria.hasNegativeMarking ? 'text-[var(--warning)] bg-amber-500/10' : 'text-[var(--text-muted)] glass-pill'
              }`}
            >
              ⚡ {uniCriteria.name} marking scheme: {markingDetail}
            </p>
          );
        })()}

        {/* Key Metrics Row: 2-column grid on mobile, 4-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-2 min-w-0">
          <div className="glass-row rounded-[20px] p-3.5 min-w-0 text-center">
            <p className="font-dot text-xl sm:text-2xl font-extrabold text-[var(--success)] ltr-nums">{formatNumber(correctCount)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('test.correct')}</p>
          </div>

          <div className="glass-row rounded-[20px] p-3.5 min-w-0 text-center">
            <p className="font-dot text-xl sm:text-2xl font-extrabold text-[var(--danger)] ltr-nums">{formatNumber(wrongCount)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('test.incorrect')}</p>
          </div>

          <div className="glass-row rounded-[20px] p-3.5 min-w-0 text-center">
            <p className="font-dot text-xl sm:text-2xl font-extrabold text-[var(--text-muted)] ltr-nums">{formatNumber(unansweredCount)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('test.skipped')}</p>
          </div>

          <div className="glass-row rounded-[20px] p-3.5 min-w-0 text-center">
            <p className="font-dot text-xl sm:text-2xl font-extrabold text-[var(--text)] ltr-nums">
              {formatTime(attempt.timeTakenSeconds)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('test.timeTaken')}</p>
          </div>
        </div>

        {/* Action CTAs: stacked full-width on mobile */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center w-full sm:w-auto gap-3 mt-3">
          <PdfDownloadButton
            label={`${t('test.resultsTitle')} (PDF)`}
            variant="primary"
            className="w-full sm:w-auto"
            onDownload={async (onProgress, signal) => {
              const { exportDrillResultToPdf } = await import('@/utils/testPdfExporter');
              const letters = ['A', 'B', 'C', 'D'] as const;
              const gradedQuestions = questions.map((q, idx) => {
                const chosenIdx = userAnswers[String(idx)];
                const chosenLetter =
                  chosenIdx !== undefined && chosenIdx >= 0 && chosenIdx <= 3
                    ? letters[chosenIdx]
                    : null;
                const correctLetter = letters[q.correct ?? 0] || 'A';
                return {
                  id: q.id || `q-${idx + 1}`,
                  question: q.q,
                  optionA: q.options[0] || '',
                  optionB: q.options[1] || '',
                  optionC: q.options[2] || '',
                  optionD: q.options[3] || '',
                  correctOption: correctLetter,
                  selectedOption: chosenLetter,
                  isCorrect: chosenIdx !== undefined && chosenIdx === q.correct,
                  explanation: q.explain || '',
                  topic: q.chapter || q.subject || 'General',
                  difficulty: q.difficulty || 'medium',
                };
              });
              await exportDrillResultToPdf({
                testTitle: attempt.title || `${attempt.subject || 'Practice'} Test Result`,
                subject: attempt.subject || attempt.university || 'General',
                studentName: user?.displayName || 'Student',
                score: correctCount,
                totalQuestions: total,
                percentage,
                timeTakenSeconds: attempt.timeTakenSeconds || 0,
                gradedQuestions,
                signal,
                onProgress,
              });
            }}
          />

          <Button
            variant="primary"
            size="md"
            onClick={() =>
              navigate(
                routes.dashboardPractice({
                  subject: attempt.subject && attempt.subject !== 'Any' ? attempt.subject : undefined,
                  chapter: (attempt as any).chapter || undefined,
                  university:
                    attempt.university && attempt.university !== 'Any'
                      ? attempt.university
                      : undefined,
                })
              )
            }
            className="w-full sm:w-auto justify-center"
            style={{ gap: 8 }}
          >
            <RotateCcw size={16} />
            <span>{t('test.retakeTest')}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard/results')}
            className="w-full sm:w-auto justify-center"
            style={{ gap: 8 }}
          >
            <BookOpen size={16} />
            <span>{t('nav.results')}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto justify-center"
            style={{ gap: 8 }}
          >
            <span>{t('test.backToDashboard')}</span>
            <ArrowRight size={16} className="rtl-mirror" />
          </Button>
        </div>
      </div>

      {/* Ad Slot below score summary */}
      <AdSlot slotId={AD_SLOTS.result_below} wrapperClassName="my-6 sm:my-8" />

      {/* Review Section */}
      <div className="min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-w-0 max-w-full">
          <div className="text-start">
            <h3 className="font-dot text-lg sm:text-xl font-bold text-[var(--text)]">
              {t('test.reviewAnswers')}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {t('test.explanation')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap max-w-full">
            {(
              [
                { id: 'all', label: `${t('common.all')} (${formatNumber(questions.length)})` },
                { id: 'mistakes', label: `${t('test.incorrect')} (${formatNumber(wrongCount + unansweredCount)})` },
                { id: 'flagged', label: `${t('test.flagged')} (${formatNumber(flagged.length)})` },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#D71921] text-white font-semibold shadow-sm'
                      : 'glass-pill text-[var(--text-muted)] hover:text-[var(--text)]'
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
                    ? 'border-s-4 border-s-[var(--success)]'
                    : isSkipped
                    ? 'border-s-4 border-s-[var(--text-faint)]'
                    : 'border-s-4 border-s-[var(--danger)]'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 min-w-0 max-w-full">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
                      {t('test.questionOf', { current: formatNumber(idx + 1), total: formatNumber(questions.length) })}
                    </span>
                    {q.subject && (
                      <span className="text-[11px] text-[var(--text-faint)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                        {q.subject}
                      </span>
                    )}
                    {isItemFlagged && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                        <Bookmark size={11} fill="currentColor" /> {t('test.flagged')}
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
                            <CheckCircle size={14} /> {t('test.correct')} (<span className="ltr-nums">{correctLabel}</span>)
                          </span>
                        );
                      }
                      if (isSkipped) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[var(--text-faint)] text-xs">
                            <Clock size={14} /> {t('test.skipped')} (0)
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 text-[var(--danger)] text-xs font-bold">
                          <XCircle size={14} /> {t('test.incorrect')} (<span className="ltr-nums">{penaltyLabel}</span>)
                        </span>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => setReportingQuestionId(q.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title={t('test.reportQuestion')}
                    >
                      <Flag size={11} />
                      <span>{t('common.report')}</span>
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
                              className={`text-[11px] font-dot font-bold px-1.5 py-0.5 rounded border border-[var(--glass-border)] ${
                                isOptionCorrect
                                  ? 'bg-[var(--success)] text-white'
                                  : isUserChoice
                                  ? 'bg-[var(--danger)] text-white'
                                  : 'glass-pill text-[var(--text-muted)]'
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
                              {t('test.correctAnswer')}
                            </span>
                          )}
                          {isUserChoice && !isOptionCorrect && (
                            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--danger)] shrink-0 hidden xs:inline">
                              {t('test.yourAnswer')}
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
                      {t('test.explanation')}
                    </p>
                    <div dir="ltr"><MathText block>{q.explain}</MathText></div>
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
                          <span className="truncate">{t('common.pending')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportingQuestionId(q.id)}
                          className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer shrink-0 inline-flex items-center gap-1"
                        >
                          <Flag size={11} />
                          <span>{t('common.report')}</span>
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
                          className="relative overflow-hidden self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D71921] bg-transparent text-[var(--text)] text-xs font-semibold cursor-pointer hover:bg-[#D71921] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed max-w-full"
                        >
                          <Bot size={14} className="text-[#D71921]" />
                          <span>
                            {aiExplaining[idx] ? t('common.loading') : `${t('test.showExplanation')} (AI Mentors)`}
                          </span>
                          {aiExplaining[idx] && <ButtonLineLoader />}
                        </button>
                      ) : (
                        <div className="p-3 sm:p-4 rounded-2xl bg-[var(--surface)] border border-[#D71921] flex flex-col gap-2.5 min-w-0 max-w-full overflow-hidden">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[#D71921] text-xs font-bold">
                              <Bot size={15} />
                              <span>AI Mentors · {t('test.explanation')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRequestAiExplanation(idx, q, userAns, true)}
                                disabled={aiExplaining[idx]}
                                className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <RotateCcw size={11} /> {t('common.retry')}
                              </button>
                              <button
                                onClick={() => setReportingQuestionId(q.id)}
                                className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer flex items-center gap-1"
                                title={t('test.reportQuestion')}
                              >
                                <Flag size={11} /> {t('common.report')}
                              </button>
                            </div>
                          </div>
                          {aiExplaining[idx] ? (
                            <LineLoader
                              variant="inline"
                              context="results"
                              loading={aiExplaining[idx]}
                              message={t('common.loading')}
                            />
                          ) : (
                            <div className="text-xs sm:text-sm leading-relaxed text-[var(--text)] break-words min-w-0 max-w-full overflow-x-auto" dir="ltr">
                              <MathText block>{aiExplanations[idx]}</MathText>
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-[var(--text)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('test.reportQuestion')}
              </h3>
              <button
                type="button"
                onClick={() => setReportingQuestionId(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto text-[var(--accent)]" size={32} />
                <p className="text-sm font-semibold">{t('test.reportSubmitted')}</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-start">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">{t('commons.reportReason')}</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
                  >
                    <option value="wrong_key">{t('test.correctAnswer')}</option>
                    <option value="broken_math">Math / LaTeX</option>
                    <option value="unclear">{t('common.somethingWrong')}</option>
                    <option value="other">{t('common.report')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">{t('common.optional')}</label>
                  <textarea
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder={t('commons.reportReason')}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingQuestionId(null)}
                    className="btn-outline px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={reporting}
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
                    className="relative overflow-hidden btn-red px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{reporting ? t('common.submitting') : t('common.submit')}</span>
                    {reporting && <ButtonLineLoader />}
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
