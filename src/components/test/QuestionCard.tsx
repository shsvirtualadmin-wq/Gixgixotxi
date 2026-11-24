import { useState, memo } from 'react';
import {
  Bookmark,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { MathText } from '@/components/ui/MathText';
import { repairSplitOrGarbledMcqOptions } from '@/lib/math';
import { reportQuestion } from '@/services/testEngine';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatChapterName, formatSubjectName } from '@/constants/taxonomy';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import type { AttemptQuestion } from '@/types/index';

interface QuestionCardProps {
  question: AttemptQuestion;
  index: number;
  total: number;
  selectedAnswer: number | undefined;
  isFlagged: boolean;
  onSelectAnswer: (optionIdx: number) => void;
  onClearAnswer?: () => void;
  onToggleFlag: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  userAnswersMap?: Record<string, number>;
  onSelectIndex?: (idx: number) => void;
  isPracticeInstantReveal?: boolean;
  isReviewMode?: boolean;
  isFastNuces?: boolean;
  university?: string;
  markingBadge?: string;
  isPro?: boolean;
  onDownloadPdf?: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const QuestionCard = memo(function QuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
  userAnswersMap = {},
  onSelectIndex,
  isPracticeInstantReveal = false,
  isReviewMode = false,
  university,
}: QuestionCardProps) {
  const { user } = useAuth();
  const { t, formatNumber } = useLanguage();

  // Report issue modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'wrong_key' | 'broken_math' | 'unclear' | 'other'>('wrong_key');
  const [reportComment, setReportComment] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  const handleOptionClick = (optIdx: number) => {
    triggerHaptic();
    onSelectAnswer(optIdx);
  };

  const handleSendReport = async () => {
    if (!user || reporting) return;
    setReporting(true);
    try {
      await reportQuestion({
        questionId: question.id,
        reason: reportReason,
        comment: reportComment,
        userId: user.uid,
        userEmail: user.email || '',
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportComment('');
      }, 1400);
    } catch (err) {
      console.warn('[QuestionCard] Report question note:', err);
    } finally {
      setReporting(false);
    }
  };

  const correctIndex = typeof question.correctIndex === 'number'
    ? question.correctIndex
    : (question.correct ?? 0);

  const isAnswered = selectedAnswer !== undefined;
  const showReview = isReviewMode || (isPracticeInstantReveal && isAnswered);
  const answeredCount = Object.keys(userAnswersMap).length;

  // Handle deleted question gracefully
  const isUnavailable = question.isUnavailable || (!question.q && !question.stem);

  // Build clean subject · topic label (kept untranslated for question bank subjects)
  const subjectLabel = question.subject ? formatSubjectName(question.subject) : (university || 'SAT Math');
  const topicLabel = question.chapter
    ? formatChapterName(question.subject || 'mathematics', question.chapter)
    : (question.topic || '');
  const subjectTagText = topicLabel ? `${subjectLabel} · ${topicLabel}` : subjectLabel;

  // Repair any split or garbled options (e.g. "$1{" and "}170$" -> "1,170")
  const cleanedOptions = repairSplitOrGarbledMcqOptions(question.options || []);

  return (
    <>
      {/* 2. PROGRESS: large question number on start, "Answered 0/100" on end, small dots below in 2 rows */}
      <section className="nt-progress" aria-label={t('test.questionOf', { current: index + 1, total })}>
        <div className="nt-progress-row">
          <span className="nt-progress-qnum nt-doto ltr-nums">
            {formatNumber(index + 1)} / {formatNumber(total)}
          </span>
          <span className="nt-progress-answered ltr-nums">
            {t('test.answered')} {formatNumber(answeredCount)}/{formatNumber(total)}
          </span>
        </div>

        <div
          className="nt-dots-grid"
          style={
            {
              '--nt-dot-cols': Math.max(1, Math.ceil(total / 2)),
            } as React.CSSProperties
          }
          role="tablist"
          aria-label={t('test.paletteTitle')}
        >
          {Array.from({ length: total }).map((_, dotIdx) => {
            const isCurrent = dotIdx === index;
            const isDotAnswered = userAnswersMap[String(dotIdx)] !== undefined;
            return (
              <button
                key={dotIdx}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`${t('test.questionOf', { current: dotIdx + 1, total })}${isDotAnswered ? ` (${t('test.answered')})` : ''}`}
                onClick={() => onSelectIndex?.(dotIdx)}
                className={`nt-dot ${
                  isCurrent
                    ? 'nt-dot--current'
                    : isDotAnswered
                    ? 'nt-dot--answered'
                    : ''
                }`}
              />
            );
          })}
        </div>
      </section>

      {/* 3. QUESTION CARD: rounded 28px card holding subject tag pill, Flag pill button, then question text */}
      <section className="nt-qcard" aria-label={t('test.questionOf', { current: index + 1, total })}>
        <div className="nt-qcard-header">
          <span className="nt-subject-pill" title={subjectTagText}>
            {subjectTagText}
          </span>

          {!showReview ? (
            <button
              type="button"
              onClick={onToggleFlag}
              aria-pressed={isFlagged}
              className={`nt-flag-pill ${isFlagged ? 'nt-flag-pill--active' : ''}`}
              title={isFlagged ? t('test.flagged') : t('test.flag')}
            >
              <Bookmark size={12} fill={isFlagged ? 'currentColor' : 'none'} />
              <span>{isFlagged ? t('test.flagged') : t('test.flag')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="nt-flag-pill"
              title={t('test.reportQuestion')}
            >
              <span>{t('common.report')}</span>
            </button>
          )}
        </div>

        {isUnavailable ? (
          <div className="nt-qcard-stem flex flex-col items-center justify-center text-center gap-1.5 py-2">
            <AlertTriangle className="text-[#d71921]" size={22} />
            <p className="text-sm font-semibold">{t('common.noResults')}</p>
            <p className="text-xs text-[var(--nt-muted)]">
              {t('common.somethingWrong')}
            </p>
          </div>
        ) : (
          <div className="nt-qcard-stem select-text" dir="ltr">
            <MathText text={question.stem || question.q || ''} block />
          </div>
        )}
      </section>

      {/* 4. OPTIONS A-D: kept LTR for English/math exam options */}
      {!isUnavailable && (
        <div
          className="nt-options-grid"
          dir="ltr"
          role="radiogroup"
          aria-label={t('test.questionOf', { current: index + 1, total })}
        >
          {cleanedOptions.map((optText, optIdx) => {
            const letter = OPTION_LABELS[optIdx] ?? String(optIdx + 1);
            const isSelected = selectedAnswer === optIdx;

            let stateIcon = null;
            if (showReview) {
              if (optIdx === correctIndex) {
                stateIcon = <Check size={16} className="text-emerald-500 shrink-0" />;
              } else if (isSelected) {
                stateIcon = <X size={16} className="text-[#d71921] shrink-0" />;
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={showReview}
                onClick={() => handleOptionClick(optIdx)}
                className={`nt-option-card ${isSelected ? 'nt-option-card--selected' : ''}`}
              >
                <span className="nt-option-badge">{letter}</span>
                <span className="nt-option-text select-text">
                  <MathText text={optText} />
                </span>
                {stateIcon}
              </button>
            );
          })}
        </div>
      )}

      {/* ── REPORT ISSUE MODAL ────────────────────────────────────────────── */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-[var(--text)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('test.reportQuestion')}
              </h3>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs"
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
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">{t('commons.reportReason')}</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as 'wrong_key' | 'broken_math' | 'unclear' | 'other')}
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
                    onClick={() => setIsReportOpen(false)}
                    className="btn-outline px-3 py-1.5 rounded-xl text-xs"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReport}
                    disabled={reporting}
                    className="relative overflow-hidden btn-red px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-60"
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
    </>
  );
});

export default QuestionCard;
