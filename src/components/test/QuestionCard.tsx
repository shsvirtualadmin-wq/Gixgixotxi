import { useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flag,
  Check,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { MathText } from '@/components/ui/MathText';
import { Button } from '@/components/ui/Button';
import { reportQuestion } from '@/services/testEngine';
import { useAuth } from '@/contexts/AuthContext';
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
  // Practice instant feedback or review mode
  isPracticeInstantReveal?: boolean;
  isReviewMode?: boolean;
  isFastNuces?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionCard({
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
}: QuestionCardProps) {
  const { user } = useAuth();

  // Report Modal states
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

  const handlePrevClick = () => {
    triggerHaptic();
    onPrev();
  };

  const handleNextClick = () => {
    triggerHaptic();
    onNext();
  };

  const handleSubmitClick = () => {
    triggerHaptic();
    if (onSubmit) onSubmit();
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || reporting) return;
    triggerHaptic();
    setReporting(true);
    try {
      await reportQuestion({
        questionId: question.id,
        stem: question.stem || question.q || '',
        subject: question.subject || 'General',
        chapter: question.chapter,
        reason: reportReason,
        comment: reportComment.trim(),
        userId: user.uid,
        userEmail: user.email || '',
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportComment('');
      }, 1500);
    } catch (err) {
      console.warn('[QuestionCard] Failed to submit report:', err);
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
                    ? 'w-6 bg-[#D71921]'
                    : isDotAnswered
                    ? 'w-2 bg-white'
                    : 'w-2 bg-[#222222]'
                }`}
              />
            );
          })}
        </div>

        {/* Q Header Bar: "Q 07 / 30" in Dot Font + Negative marking note */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[#1A1A1A] pb-3">
          <div className="flex items-center gap-3">
            <span className="font-dot text-2xl font-bold text-white tracking-widest">
              Q {formattedIndex} / {formattedTotal}
            </span>
            {question.subject && (
              <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#222222] bg-[#0D0D0D] text-[#9A9A9A]">
                {question.subject}
              </span>
            )}
            {question.chapter && (
              <span className="hidden sm:inline font-mono text-[11px] text-[#666666] truncate max-w-[200px]">
                {question.chapter}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Negative marking note in small mono text */}
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777] bg-[#0D0D0D] px-2.5 py-1 rounded-md border border-[#1F1F1F]">
              {isFastNuces ? '−0.25 NEGATIVE MARKING' : '+1.0 / 0.0 NO PENALTY'}
            </span>

            {/* Flag bookmark toggle */}
            <button
              type="button"
              onClick={onToggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-colors cursor-pointer ${
                isFlagged
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : 'border-[#222222] bg-[#0D0D0D] text-[#888888] hover:text-white hover:border-[#333333]'
              }`}
              title="Bookmark for review (F)"
            >
              <Bookmark size={13} fill={isFlagged ? 'currentColor' : 'none'} />
              <span>{isFlagged ? 'FLAGGED' : 'FLAG'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── QUESTION STEM CARD ────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0D0D] border border-[#222222] text-[#F2F2F2] flex flex-col gap-4">
        <div className="text-lg sm:text-xl font-normal leading-relaxed text-white">
          <MathText text={question.stem || question.q || ''} block />
        </div>

        {/* Clear selection link */}
        {selectedAnswer !== undefined && !showReview && (
          <div className="flex justify-end pt-2 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={onClearAnswer}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#777777] hover:text-white cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>CLEAR SELECTION</span>
            </button>
          </div>
        )}
      </div>

      {/* ── OPTIONS A-D ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {(question.options || []).map((optText, optIdx) => {
          const letter = OPTION_LABELS[optIdx] ?? String(optIdx + 1);
          const isSelected = selectedAnswer === optIdx;

          // States in review/practice reveal mode
          let cardBorder = 'border-[#222222]';
          let cardBg = 'bg-[#0D0D0D]';
          let badgeBorder = 'border-[#333333]';
          let badgeBg = 'bg-[#141414]';
          let badgeText = 'text-[#888888]';
          let stateIcon = null;

          if (showReview) {
            if (optIdx === correctIndex) {
              cardBorder = 'border-white';
              cardBg = 'bg-[#121212]';
              badgeBorder = 'border-white';
              badgeBg = 'bg-white';
              badgeText = 'text-black font-bold';
              stateIcon = <Check size={14} className="text-white shrink-0" />;
            } else if (isSelected) {
              cardBorder = 'border-[#D71921]';
              cardBg = 'bg-[#180608]';
              badgeBorder = 'border-[#D71921]';
              badgeBg = 'bg-[#D71921]';
              badgeText = 'text-white font-bold';
              stateIcon = <X size={14} className="text-[#D71921] shrink-0" />;
            }
          } else if (isSelected) {
            cardBorder = 'border-[#D71921]';
            cardBg = 'bg-[#140506]';
            badgeBorder = 'border-[#D71921]';
            badgeBg = 'bg-[#D71921]';
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
                {/* Circular letter badge (28px mono) */}
                <div
                  className={`w-7 h-7 rounded-full border ${badgeBorder} ${badgeBg} ${badgeText} font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors`}
                >
                  {letter}
                </div>

                {/* Option Content via MathText */}
                <div className="flex-1 min-w-0 text-[16px] sm:text-[18px] text-white">
                  <MathText text={optText} />
                </div>
              </div>

              {/* Status Indicator */}
              {stateIcon ? (
                stateIcon
              ) : isSelected ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── EXPLANATION CARD (Animated 200ms) ─────────────────────────────── */}
      {showReview && (question.explanation || question.explain) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#080808] border border-[#222222] text-[#F2F2F2] flex flex-col gap-3 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#9A9A9A]">
                EXPLANATION &amp; DERIVATION
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#666666]">
              CORRECT: {OPTION_LABELS[correctIndex]}
            </span>
          </div>

          <div className="text-[16px] sm:text-[17px] text-white leading-relaxed">
            <MathText text={question.explanation || question.explain || ''} block />
          </div>
        </div>
      )}

      {/* ── REPORT BUTTON & BOTTOM ACTION CONTROLS ───────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrevClick}
            disabled={!canPrev}
            className="border-[#222222] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] font-mono text-xs uppercase px-4 rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft size={16} />
            <span>PREV</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleNextClick}
            disabled={!canNext}
            className="border-[#222222] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] font-mono text-xs uppercase px-4 rounded-xl flex items-center gap-1.5"
          >
            <span>NEXT</span>
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Student Report Question Button (Available after answering or anytime) */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#222222] bg-[#0D0D0D] text-[#888888] hover:text-[#D71921] hover:border-[#D71921]/40 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            title="Report an issue with this question"
          >
            <Flag size={12} />
            <span>REPORT</span>
          </button>

          {onSubmit && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="bg-[#D71921] hover:bg-[#b0141a] text-white font-mono text-xs uppercase px-6 rounded-xl flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>FINISH TEST</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── REPORT MODAL ─────────────────────────────────────────────────── */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#0D0D0D] border border-[#222222] p-6 flex flex-col gap-5 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2 text-[#D71921]">
                <AlertTriangle size={18} />
                <h3 className="font-dot text-lg font-bold tracking-wide text-white">
                  REPORT QUESTION
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-[#888888] hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-6 rounded-2xl bg-[#08140B] border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 size={28} className="text-emerald-400" />
                <span className="font-mono text-xs uppercase font-bold tracking-wider">
                  REPORT LOGGED FOR FACULTY AUDIT
                </span>
                <p className="text-xs text-[#888888]">
                  Thank you! Our subject team will review this question prompt and answer key.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="flex flex-col gap-4">
                <p className="text-xs text-[#888888] leading-relaxed">
                  Notice an error in the question stem, mathematical LaTeX rendering, or answer key?
                </p>

                {/* Reason options */}
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {[
                    { id: 'wrong_key', label: 'Wrong answer key (correct choice is incorrect)' },
                    { id: 'broken_math', label: 'Broken math formula / LaTeX compilation error' },
                    { id: 'unclear', label: 'Unclear wording, ambiguity, or syllabus mismatch' },
                    { id: 'other', label: 'Other typo or technical issue' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                        reportReason === r.id
                          ? 'border-[#D71921] bg-[#140506] text-white'
                          : 'border-[#1F1F1F] bg-[#000000] text-[#9A9A9A] hover:border-[#333333]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reportReason === r.id}
                        onChange={() => setReportReason(r.id as any)}
                        className="accent-[#D71921]"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                {/* Comment textarea */}
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#888888] block mb-1.5">
                    DETAILS (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Describe what looks wrong or provide your derived answer..."
                    className="w-full p-3 rounded-xl bg-black border border-[#222222] font-mono text-xs text-white placeholder-[#555555] focus:border-[#D71921] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A]">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#222222] font-mono text-xs uppercase text-[#888888] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <Button
                    type="submit"
                    disabled={reporting}
                    className="bg-[#D71921] hover:bg-[#b0141a] text-white font-mono text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    {reporting ? <Loader2 size={13} className="animate-spin" /> : null}
                    <span>SUBMIT REPORT</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionCard;
