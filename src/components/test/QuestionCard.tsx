import { useState, memo } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Download,
  Lock,
} from 'lucide-react';
import { MathText } from '@/components/ui/MathText';
import { reportQuestion } from '@/services/testEngine';
import { useAuth } from '@/contexts/AuthContext';
import { formatChapterName, formatSubjectName } from '@/constants/taxonomy';
import { getSectionCriteria } from '@/constants/universityCriteria';
import { BubbleLoader } from '@/components/ui/BubbleLoader';
import type { AttemptQuestion } from '@/types/index';

interface QuestionCardProps {
  question: AttemptQuestion;
  index: number;
  total: number;
  selectedAnswer: number | undefined;
  isFlagged: boolean;
  onSelectAnswer: (optionIdx: number) => void;
  onClearAnswer: () => void;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  userAnswersMap?: Record<string, number>;
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
  onClearAnswer,
  onToggleFlag,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onSubmit,
  isSubmitting = false,
  userAnswersMap = {},
  isPracticeInstantReveal = false,
  isReviewMode = false,
  isFastNuces = false,
  university,
  markingBadge,
  isPro = false,
  onDownloadPdf,
}: QuestionCardProps) {
  const { user } = useAuth();

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

  const formattedIndex = String(index + 1).padStart(2, '0');
  const formattedTotal = String(total).padStart(2, '0');

  // Handle deleted question gracefully
  const isUnavailable = question.isUnavailable || (!question.q && !question.stem);

  return (
    <div className="w-full max-w-[820px] mx-auto flex flex-col gap-5 font-sans">
      {/* ── TOP: DOT-STYLE PROGRESS BAR & QUESTION META ───────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Dot Progress Bar */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {Array.from({ length: total }).map((_, dotIdx) => {
            const isCurrent = dotIdx === index;
            const isDotAnswered = userAnswersMap[String(dotIdx)] !== undefined;
            return (
              <div
                key={dotIdx}
                className={`h-2 rounded-full transition-all duration-150 shrink-0 ${
                  isCurrent
                    ? 'w-6 bg-[var(--accent)]'
                    : isDotAnswered
                    ? 'w-2 bg-[var(--text)]'
                    : 'w-2 bg-[var(--border)]'
                }`}
              />
            );
          })}
        </div>

        {/* Q Header Bar: "Q 07 / 30" in Dot Font + Negative marking note */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <span className="font-dot text-2xl font-bold text-[var(--text)] tracking-widest">
              Q {formattedIndex} / {formattedTotal}
            </span>
            {question.subject && (
              <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]">
                {formatSubjectName(question.subject)}
              </span>
            )}
            {question.chapter && (
              <span className="hidden sm:inline font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                {formatChapterName(question.subject || 'mathematics', question.chapter)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Marking Scheme Badge */}
            {(() => {
              const secCriteria = getSectionCriteria(university, question.subject);
              const displayBadge =
                markingBadge ||
                secCriteria?.badgeLabel ||
                (isFastNuces ? '−0.25 NEGATIVE MARKING' : '+1.0 / 0.0 NO PENALTY');
              return (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                  {displayBadge}
                </span>
              );
            })()}

            {/* Flag bookmark toggle */}
            {!showReview && (
              <button
                type="button"
                onClick={onToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-colors cursor-pointer ${
                  isFlagged
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-500'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Bookmark for review"
              >
                <Bookmark size={13} fill={isFlagged ? 'currentColor' : 'none'} />
                <span>{isFlagged ? 'FLAGGED' : 'FLAG'}</span>
              </button>
            )}

            {/* Download PDF Button right of FLAG button */}
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-mono transition-colors cursor-pointer"
                title={isPro ? 'Download test questions as PDF' : 'Download test questions as PDF (Pro Feature)'}
              >
                {isPro ? (
                  <Download size={13} />
                ) : (
                  <Lock size={12} className="text-amber-500" />
                )}
                <span>DOWNLOAD PDF</span>
              </button>
            )}

            {/* Report Issue Button in Review Mode */}
            {showReview && (
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--accent)] text-xs font-mono transition-colors cursor-pointer"
                title="Report issue with this question"
              >
                <Flag size={12} />
                <span>REPORT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── QUESTION STEM CARD ────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex flex-col gap-4 shadow-sm">
        {isUnavailable ? (
          <div className="py-4 text-center space-y-2">
            <AlertTriangle className="mx-auto text-[var(--accent)]" size={28} />
            <p className="text-sm font-semibold text-[var(--text)]">Question no longer available</p>
            <p className="text-xs text-[var(--text-muted)]">
              This question was removed from the active question bank. Your score calculations remain preserved.
            </p>
          </div>
        ) : (
          <div className="text-lg sm:text-xl font-normal leading-relaxed text-[var(--text)]">
            <MathText text={question.stem || question.q || ''} block />
          </div>
        )}

        {/* Clear selection link */}
        {selectedAnswer !== undefined && !showReview && !isUnavailable && (
          <div className="flex justify-end pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClearAnswer}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>CLEAR SELECTION</span>
            </button>
          </div>
        )}
      </div>

      {/* ── OPTIONS A-D ──────────────────────────────────────────────────── */}
      {!isUnavailable && (
        <div className="flex flex-col gap-3">
          {(question.options || []).map((optText, optIdx) => {
            const letter = OPTION_LABELS[optIdx] ?? String(optIdx + 1);
            const isSelected = selectedAnswer === optIdx;

            let cardBorder = 'border-[var(--border)]';
            let cardBg = 'bg-[var(--surface)]';
            let badgeBorder = 'border-[var(--border)]';
            let badgeBg = 'bg-[var(--surface-2)]';
            let badgeText = 'text-[var(--text-muted)]';
            let stateIcon = null;

            if (showReview) {
              if (optIdx === correctIndex) {
                cardBorder = 'border-[var(--text)] ring-1 ring-[var(--text)]';
                cardBg = 'bg-[var(--surface-2)]';
                badgeBorder = 'border-[var(--text)]';
                badgeBg = 'bg-[var(--text)]';
                badgeText = 'text-[var(--bg)] font-bold';
                stateIcon = <Check size={16} className="text-[var(--text)] shrink-0" />;
              } else if (isSelected) {
                cardBorder = 'border-[var(--accent)] ring-1 ring-[var(--accent)]';
                cardBg = 'bg-[var(--surface-2)]';
                badgeBorder = 'border-[var(--accent)]';
                badgeBg = 'bg-[var(--accent)]';
                badgeText = 'text-white font-bold';
                stateIcon = <X size={16} className="text-[var(--accent)] shrink-0" />;
              }
            } else if (isSelected) {
              cardBorder = 'border-[var(--accent)] ring-1 ring-[var(--accent)]';
              cardBg = 'bg-[var(--surface-2)]';
              badgeBorder = 'border-[var(--accent)]';
              badgeBg = 'bg-[var(--accent)]';
              badgeText = 'text-white font-bold';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={showReview}
                onClick={() => handleOptionClick(optIdx)}
                className={`w-full min-h-[56px] p-4 sm:p-5 rounded-2xl border ${cardBorder} ${cardBg} text-left flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer active:scale-[0.99] disabled:cursor-default`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Circular letter badge */}
                  <div
                    className={`w-7 h-7 rounded-full border ${badgeBorder} ${badgeBg} ${badgeText} font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors`}
                  >
                    {letter}
                  </div>

                  {/* Option Content via MathText */}
                  <div className="flex-1 min-w-0 text-[15px] sm:text-[16px] text-[var(--text)]">
                    <MathText text={optText} />
                  </div>
                </div>

                {/* Status Indicator */}
                {stateIcon ? (
                  stateIcon
                ) : isSelected ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* ── EXPLANATION CARD (In Review Mode) ─────────────────────────────── */}
      {showReview && (question.explanation || question.explain) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex flex-col gap-3 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                EXPLANATION &amp; DERIVATION
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--text)]">
              CORRECT: {OPTION_LABELS[correctIndex]}
            </span>
          </div>

          <div className="text-[15px] sm:text-[16px] text-[var(--text)] leading-relaxed">
            <MathText text={question.explanation || question.explain || ''} block />
          </div>
        </div>
      )}

      {/* ── NAVIGATION BUTTONS (PREV / NEXT / SUBMIT) ──────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="btn-outline px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {canNext && (
            <button
              type="button"
              onClick={onNext}
              className="btn-outline px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          )}

          {onSubmit && (
            isSubmitting ? (
              <div className="w-48 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <BubbleLoader
                  variant="inline"
                  loading={isSubmitting}
                  messages={['Checking your answers...']}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="btn-red px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finish &amp; Submit</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* ── REPORT ISSUE MODAL ────────────────────────────────────────────── */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-[var(--text)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                Report an Issue
              </h3>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs"
              >
                Close
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto text-[var(--accent)]" size={32} />
                <p className="text-sm font-semibold">Thank you for reporting</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Our academic reviewers will inspect this question.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">What seems wrong?</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as 'wrong_key' | 'broken_math' | 'unclear' | 'other')}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
                  >
                    <option value="wrong_key">Answer key appears incorrect</option>
                    <option value="broken_math">Math formula formatting issue</option>
                    <option value="unclear">Question wording is ambiguous or incomplete</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">Additional details (optional)</label>
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
                    onClick={() => setIsReportOpen(false)}
                    className="btn-outline px-3 py-1.5 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  {reporting ? (
                    <div className="w-44 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <BubbleLoader
                        variant="inline"
                        loading={reporting}
                        messages={['Submitting question report...']}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendReport}
                      disabled={reporting}
                      className="btn-red px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <span>Submit Report</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestionCard;
