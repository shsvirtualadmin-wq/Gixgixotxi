import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, X, Check, Search } from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathText';

interface StudentTestRunnerProps {
  title: string;
  questions: Question[];
  durationMinutes: number;
  negativeMarkingPercent?: number; // e.g. 0.25
  marksPerQuestion?: number;
  totalMarks?: number;
  startTime?: number; // ms timestamp
  endTime?: number;   // ms timestamp
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
}) => {
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
  const [effectiveEndTime] = useState<number>(() => endTime || (Date.now() + durationMinutes * 60 * 1000));

  const calculateRemainingSeconds = useCallback(() => {
    return Math.max(0, Math.floor((effectiveEndTime - Date.now()) / 1000));
  }, [effectiveEndTime]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemainingSeconds);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('All');

  // Derive sections/subjects from questions for quick section switching in 200-question papers
  const subjectSections = useMemo(() => {
    const list: { name: string; count: number; startIndex: number; endIndex: number }[] = [];
    let currentSub = '';
    let start = 0;

    questions.forEach((q, idx) => {
      const sub = q.subject || 'Section';
      if (sub !== currentSub) {
        if (currentSub) {
          list.push({ name: currentSub, count: idx - start, startIndex: start, endIndex: idx - 1 });
        }
        currentSub = sub;
        start = idx;
      }
    });

    if (currentSub) {
      list.push({ name: currentSub, count: questions.length - start, startIndex: start, endIndex: questions.length - 1 });
    }

    return list;
  }, [questions]);

  // Submit test callback
  const handleSubmitTest = useCallback(() => {
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
  }, [title, questions, answers, flagged, effectiveStartTime, negativeMarkingPercent, marksPerQuestion, totalMarks, onComplete]);

  // Timer countdown driven by real clock timestamp difference
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmitTest();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemainingSeconds, handleSubmitTest]);

  // Handle option select with automatic progress save
  const handleSelectOption = (optIdx: number) => {
    const updated = [...answers];
    updated[currentIndex] = optIdx;
    setAnswers(updated);
    onProgressUpdate?.({ answers: updated, flagged, currentIndex });
  };

  // Handle flag toggle with automatic progress save
  const handleToggleFlag = () => {
    const updated = [...flagged];
    updated[currentIndex] = !updated[currentIndex];
    setFlagged(updated);
    onProgressUpdate?.({ answers, flagged: updated, currentIndex });
  };

  // Navigate to specific question index with progress save
  const goToQuestion = (targetIdx: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, targetIdx));
    setCurrentIndex(clamped);
    onProgressUpdate?.({ answers, flagged, currentIndex: clamped });
    setShowPalette(false);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= questions.length) {
      goToQuestion(num - 1);
      setJumpInput('');
    }
  };

  const currentQ = questions[currentIndex] || questions[0];
  const answeredCount = answers.filter((a) => a !== null).length;
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

  const isLowTime = timeLeft < 180; // under 3 mins

  // Filtered indices for palette
  const displayedPaletteIndices = useMemo(() => {
    if (activeSubjectFilter === 'All') {
      return questions.map((_, idx) => idx);
    }
    return questions
      .map((q, idx) => ((q.subject || 'General') === activeSubjectFilter ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [questions, activeSubjectFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Exit test"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 truncate max-w-xs sm:max-w-md">
              {title}
            </h1>
            <span className="text-[11px] text-slate-500 block truncate">
              Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
            </span>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-all ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <span>Palette</span>
            <span className="bg-slate-300 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
              {answeredCount}/{questions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Question Area */}
        <div className="flex-1 space-y-6">
          {/* Question Box */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-4">
              <span className="font-bold text-blue-600 uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length}
                {currentQ.subject && ` · ${currentQ.subject}`}
              </span>

              <button
                type="button"
                onClick={handleToggleFlag}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  flagged[currentIndex]
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentIndex] ? 'Flagged for review' : 'Flag'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              <MathText text={currentQ.q || currentQ.question || ''} />
            </div>

            {/* 4 Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentIndex] === oIdx;
                const letter = String.fromCharCode(65 + oIdx);

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {letter}
                    </div>

                    <div className="text-sm font-medium text-slate-800 flex-1 leading-snug">
                      <MathText text={opt} />
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-500">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => goToQuestion(currentIndex + 1)}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finish test</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar (Desktop) */}
        <div
          className={`${
            showPalette ? 'fixed inset-4 z-40 lg:static' : 'hidden lg:block'
          } lg:w-80 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl lg:shadow-md rounded-3xl p-5 space-y-4 self-start flex flex-col max-h-[85vh] lg:max-h-[600px]`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Question Palette</h3>
              <span className="text-[11px] text-slate-500">
                {answeredCount} of {questions.length} answered
              </span>
            </div>
            {showPalette && (
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Section Tabs for 200 Questions */}
          {subjectSections.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubjectFilter('All')}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeSubjectFilter === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({questions.length})
              </button>
              {subjectSections.map((sec) => (
                <button
                  key={sec.name}
                  type="button"
                  onClick={() => setActiveSubjectFilter(sec.name)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSubjectFilter === sec.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={`${sec.name}: Q${sec.startIndex + 1}–Q${sec.endIndex + 1}`}
                >
                  {sec.name} ({sec.count})
                </button>
              ))}
            </div>
          )}

          {/* Quick Jump Input */}
          <form onSubmit={handleJumpSubmit} className="flex gap-1.5">
            <input
              type="number"
              min={1}
              max={questions.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={`Jump to Q (1-${questions.length})`}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Go
            </button>
          </form>

          {/* Question Grid - Scrollable and Fast */}
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 overflow-y-auto flex-1 pr-1 max-h-[340px]">
            {displayedPaletteIndices.map((idx) => {
              const isAns = answers[idx] !== null;
              const isFlg = flagged[idx];
              const isCur = currentIndex === idx;

              let bgStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isCur) {
                bgStyle = 'ring-2 ring-blue-600 font-black';
              }
              if (isAns) {
                bgStyle += ' bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
              } else if (isFlg) {
                bgStyle += ' bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToQuestion(idx)}
                  className={`h-8 rounded-xl border text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${bgStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />
              <span>Flagged ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span>Unattempted ({questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Ready to submit?</h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              You have answered <span className="font-bold text-slate-800">{answeredCount}</span> of{' '}
              <span className="font-bold text-slate-800">{questions.length}</span> questions.
              {questions.length - answeredCount > 0 && (
                <span className="text-amber-600 block mt-1">
                  ({questions.length - answeredCount} questions remain unattempted).
                </span>
              )}
            </p>
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
                Yes, submit now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Leave test session?</h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Your ongoing progress will not be submitted and this session will be cancelled.
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
    </div>
  );
};
