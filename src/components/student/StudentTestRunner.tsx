import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  AlertTriangle,
  ArrowRight,
  Zap,
  Check,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathText';
import { useAuth } from '../../context/AuthContext';
import { useAuthRole } from '../../hooks/useAuthRole';
import { generateQuizPdfChunked } from '../../lib/pdfGenerator';
import { isUserProOrPaid } from '../../lib/supabase';

interface StudentTestRunnerProps {
  title: string;
  questions: Question[];
  durationMinutes: number;
  negativeMarkingPercent?: number;
  marksPerQuestion?: number;
  totalMarks?: number;
  startTime?: number;
  endTime?: number;
  initialAnswers?: (number | null)[];
  initialFlagged?: boolean[];
  initialIndex?: number;
  onProgressUpdate?: (progress: {
    answers: (number | null)[];
    flagged: boolean[];
    currentIndex: number;
  }) => void;
  onComplete: (results: {
    title: string;
    questions: Question[];
    userAnswers: (number | null)[];
    flagged: boolean[];
    timeSpentSeconds: number;
    negativeMarkingPercent: number;
    marksPerQuestion?: number;
    totalMarks?: number;
  }) => void;
  onExit: () => void;
  onUpgrade?: () => void;
}

export const StudentTestRunner: React.FC<StudentTestRunnerProps> = ({
  title,
  questions,
  durationMinutes,
  negativeMarkingPercent = 0,
  marksPerQuestion = 1,
  totalMarks,
  startTime,
  endTime,
  initialAnswers,
  initialFlagged,
  initialIndex = 0,
  onProgressUpdate,
  onComplete,
  onExit,
  onUpgrade,
}) => {
  const { user, profile, isAdmin } = useAuthRole();
  const isPremiumUser = isAdmin || profile?.plan === 'premium';

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < questions.length) {
      return initialIndex;
    }
    return 0;
  });

  const [answers, setAnswers] = useState<(number | null)[]>(() => {
    if (Array.isArray(initialAnswers) && initialAnswers.length === questions.length) {
      return [...initialAnswers];
    }
    return Array(questions.length).fill(null);
  });

  const [flagged, setFlagged] = useState<boolean[]>(() => {
    if (Array.isArray(initialFlagged) && initialFlagged.length === questions.length) {
      return [...initialFlagged];
    }
    return Array(questions.length).fill(false);
  });

  // Calculate real start and end timestamps so refreshing restores the exact remaining time
  const [effectiveStartTime] = useState<number>(() => startTime || Date.now());
  const [effectiveEndTime] = useState<number>(() => endTime || Date.now() + durationMinutes * 60 * 1000);

  const calculateRemainingSeconds = useCallback(() => {
    return Math.max(0, Math.floor((effectiveEndTime - Date.now()) / 1000));
  }, [effectiveEndTime]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemainingSeconds);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'flagged' | 'unanswered'>('all');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showPdfUpgradeSheet, setShowPdfUpgradeSheet] = useState<boolean>(false);

  // PDF Generation Progress state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ page: number; totalPages: number; percent: number } | null>(null);

  // Timer interval: resilient wall-clock time
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Auto-submit when time expires
        handleSubmitTest();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemainingSeconds]);

  // Handle select / deselect option
  const handleSelectOption = (optIdx: number) => {
    const updated = [...answers];
    // Tapping an option saves it immediately; tapping it again deselects
    const nextVal = updated[currentIndex] === optIdx ? null : optIdx;
    updated[currentIndex] = nextVal;
    setAnswers(updated);
    onProgressUpdate?.({ answers: updated, flagged, currentIndex });
  };

  const handleToggleFlag = () => {
    const updated = [...flagged];
    updated[currentIndex] = !updated[currentIndex];
    setFlagged(updated);
    onProgressUpdate?.({ answers, flagged: updated, currentIndex });
  };

  const goToQuestion = (targetIdx: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, targetIdx));
    setCurrentIndex(clamped);
    onProgressUpdate?.({ answers, flagged, currentIndex: clamped });
    setShowPalette(false);
  };

  const goToPrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handleSubmitTest = () => {
    setShowSubmitConfirm(false);
    const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - effectiveStartTime) / 1000));
    onComplete({
      title,
      questions,
      userAnswers: answers,
      flagged,
      timeSpentSeconds,
      negativeMarkingPercent,
      marksPerQuestion,
      totalMarks,
    });
  };

  const handlePdfClick = async () => {
    if (!isPremiumUser) {
      setShowPdfUpgradeSheet(true);
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfProgress({ page: 1, totalPages: Math.ceil(questions.length / 4) + 1, percent: 5 });

      await generateQuizPdfChunked({
        title,
        questions,
        userAnswers: answers,
        durationMinutes,
        isSubmitted: false,
        onProgress: (prog) => {
          setPdfProgress(prog);
        },
      });
    } catch (err) {
      console.error('[PDF Export Error]:', err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const currentQ = questions[currentIndex] || questions[0];
  const answeredCount = answers.filter((a) => a !== null).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flagged.filter(Boolean).length;

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = timeLeft < 180;

  // Filtered indices for navigator
  const filteredPaletteIndices = useMemo(() => {
    return questions.map((_, idx) => idx).filter((idx) => {
      if (paletteFilter === 'flagged') return flagged[idx];
      if (paletteFilter === 'unanswered') return answers[idx] === null;
      return true;
    });
  }, [questions, paletteFilter, flagged, answers]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans max-w-full overflow-x-hidden">
      {/* A2: Top Bar on ONE LINE */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-3 sm:px-4 py-2.5 shadow-sm">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-2">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Exit test"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Short test title with ellipsis (shrinks first) */}
          <div className="min-w-0 flex-1 truncate">
            <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
              {title}
            </h1>
          </div>

          {/* Controls: Timer chip, PDF button, Submit button (never cut off) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border transition-all ${
                isLowTime
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={handlePdfClick}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-60"
              title="Download printable PDF worksheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Max 360px+ responsive with no horizontal overflow */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-3.5 sm:px-4 py-4 pb-24">
        {/* Under top bar: "Q4 / 30", bookmark/flag, subject label */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">Q{currentIndex + 1}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">/ {questions.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold max-w-[130px] sm:max-w-[200px] truncate">
              {currentQ.subject || currentQ.topic || 'Subject'}
            </span>

            <button
              type="button"
              onClick={handleToggleFlag}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                flagged[currentIndex]
                  ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
              title={flagged[currentIndex] ? 'Question flagged' : 'Flag for review'}
            >
              <Flag className={`w-4 h-4 ${flagged[currentIndex] ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Question Card: White rounded card with only the question */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
          <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed overflow-x-auto">
            <MathText text={currentQ.q || currentQ.question || ''} />
          </div>
        </div>

        {/* Option rows below: letter A-D on left, text/math on right, full width, tap size, Boardly blue active */}
        <div className="space-y-2.5 mt-3.5">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = answers[currentIndex] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200/90 text-slate-800 hover:border-slate-300'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed whitespace-normal break-words overflow-x-auto self-center">
                  <MathText text={opt} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Prev and Next under the card. On the last question, Next becomes "Review & Submit" */}
        <div className="flex items-center justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex-1 py-3 px-4 rounded-2xl bg-white border border-slate-200/90 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Review &amp; Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNext}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>

      {/* Fixed bottom bar: green dot answered, grey dot unanswered, button "4 / 30" */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 py-2.5 px-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700">{answeredCount} answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-xs font-semibold text-slate-500">{unansweredCount} unanswered</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPalette(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-colors cursor-pointer"
          >
            {currentIndex + 1} / {questions.length}
          </button>
        </div>
      </footer>

      {/* A3: Navigator Bottom Sheet */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setShowPalette(false)}
          />
          <div className="w-full max-w-3xl mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Question Navigator</h3>
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-50 border-2 border-blue-600" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-200" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaletteFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paletteFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setPaletteFilter('flagged')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paletteFilter === 'flagged'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Only flagged ({flaggedCount})
              </button>
              <button
                type="button"
                onClick={() => setPaletteFilter('unanswered')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paletteFilter === 'unanswered'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Only unanswered ({unansweredCount})
              </button>
            </div>

            {/* Grid of numbered squares (scrollable for 200 questions) */}
            <div className="flex-1 overflow-y-auto py-2 pr-1">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {filteredPaletteIndices.map((idx) => {
                  const isAnswered = answers[idx] !== null;
                  const isFlagged = flagged[idx];
                  const isCurrent = idx === currentIndex;

                  let styleClass = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';
                  if (isCurrent) {
                    styleClass = 'bg-blue-50 border-2 border-blue-600 text-blue-900 font-black shadow-xs ring-2 ring-blue-500/20';
                  } else if (isFlagged) {
                    styleClass = 'bg-amber-50 border-amber-400 text-amber-900 font-bold';
                  } else if (isAnswered) {
                    styleClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`h-10 rounded-xl border flex items-center justify-center text-xs transition-all cursor-pointer active:scale-95 relative ${styleClass}`}
                    >
                      {idx + 1}
                      {isFlagged && !isCurrent && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Sheet */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Ready to Submit?</h3>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="block text-xl font-black text-emerald-700">{answeredCount}</span>
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Answered</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-xl font-black text-slate-700">{unansweredCount}</span>
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Unanswered</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="block text-xl font-black text-amber-700">{flaggedCount}</span>
                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Flagged</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep practicing
              </button>
              <button
                type="button"
                onClick={handleSubmitTest}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B2: Exit Confirmation Modal with required text */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Leave test session?</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This test will count toward today's limit and your progress will not be saved.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Resume test
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Leave test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4: PDF Upgrade Sheet for free users */}
      {showPdfUpgradeSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">Upgrade to Premium</h3>
            <p className="text-xs text-slate-500 text-center">
              Printable PDF export is an exclusive Premium benefit.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited daily practice tests &amp; mock papers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Printable PDF export with complete answer key &amp; derivations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Higher Boardy AI question limits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Priority academic tutor support</span>
              </li>
            </ul>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPdfUpgradeSheet(false);
                  onUpgrade?.();
                }}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                Upgrade to Premium
              </button>
              <button
                type="button"
                onClick={() => setShowPdfUpgradeSheet(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Progress Modal */}
      {isGeneratingPdf && pdfProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Exporting Printable PDF</h4>
            <p className="text-xs text-slate-500">
              Page {pdfProgress.page} of {pdfProgress.totalPages} ({pdfProgress.percent}%)
            </p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${pdfProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
