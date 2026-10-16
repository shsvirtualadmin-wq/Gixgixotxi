import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react';
import { MathText } from '../ui/MathText';
import { AttemptSession, syncAttemptProgress, submitAttempt } from '../../services/testEngine';
import { useAuth } from '../../context/AuthContext';

interface TestRunnerScreenProps {
  session: AttemptSession;
  onCompleted: (session: AttemptSession) => void;
  onExit: () => void;
}

export const TestRunnerScreen: React.FC<TestRunnerScreenProps> = ({
  session,
  onCompleted,
  onExit,
}) => {
  const { user, profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(session.currentIndex || 0);
  const [answers, setAnswers] = useState<Record<string, number | null>>(session.answers || {});
  const [flagged, setFlagged] = useState<string[]>(session.flaggedQuestions || []);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Calculate live countdown to endsAt
  const endsAtMs = useMemo(() => {
    return new Date(session.endsAt).getTime();
  }, [session.endsAt]);

  const startedAtMs = useMemo(() => {
    return new Date(session.startedAt).getTime();
  }, [session.startedAt]);

  const calculateSecondsLeft = useCallback(() => {
    return Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
  }, [endsAtMs]);

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateSecondsLeft);

  // Sync ref for autosave
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const flaggedRef = useRef(flagged);
  flaggedRef.current = flagged;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  // Periodic autosave (every 5 seconds)
  useEffect(() => {
    const autosaveTimer = setInterval(() => {
      syncAttemptProgress(session.id, answersRef.current, flaggedRef.current, indexRef.current);
    }, 5000);
    return () => clearInterval(autosaveTimer);
  }, [session.id]);

  // Wall-clock timer with auto-submit at 00:00
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateSecondsLeft]);

  // Final Submit handler
  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    const timeSpentSeconds = Math.max(
      1,
      Math.floor((Date.now() - startedAtMs) / 1000)
    );

    try {
      const results = await submitAttempt(
        session.id,
        answersRef.current,
        timeSpentSeconds,
        profile?.name || user?.displayName || 'Student'
      );
      const updatedSession: AttemptSession = {
        ...session,
        status: 'completed',
        completedAt: new Date().toISOString(),
        answers: answersRef.current,
        results,
      };
      onCompleted(updatedSession);
    } catch (err) {
      console.error('[TestRunner] Submit error:', err);
      setSubmitting(false);
    }
  };

  const currentQ = session.questions[currentIndex];
  const isCurrentFlagged = flagged.includes(currentQ?.id);
  const currentAnswer = answers[currentQ?.id];

  // Option selection
  const handleSelectOption = (optIdx: number) => {
    const nextAnswers = {
      ...answers,
      [currentQ.id]: answers[currentQ.id] === optIdx ? null : optIdx,
    };
    setAnswers(nextAnswers);
    syncAttemptProgress(session.id, nextAnswers, flagged, currentIndex);
  };

  // Toggle flag
  const handleToggleFlag = () => {
    const nextFlagged = isCurrentFlagged
      ? flagged.filter((id) => id !== currentQ.id)
      : [...flagged, currentQ.id];
    setFlagged(nextFlagged);
    syncAttemptProgress(session.id, answers, nextFlagged, currentIndex);
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showExitModal) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') handleSelectOption(0);
      else if (key === '2' || key === 'b') handleSelectOption(1);
      else if (key === '3' || key === 'c') handleSelectOption(2);
      else if (key === '4' || key === 'd') handleSelectOption(3);
      else if (key === 'f') handleToggleFlag();
      else if (key === 'arrowright' || key === 'n') {
        if (currentIndex < session.questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (key === 'arrowleft' || key === 'p') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, answers, flagged, showSubmitModal, showExitModal]);

  // Statistics for submit confirmation
  const totalQuestions = session.questions.length;
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a !== null && a !== undefined).length;
  }, [answers]);
  const flaggedCount = flagged.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsLeft < 300;
  const isCriticalTime = secondsLeft < 60;

  return (
    <div className="min-h-screen bg-[#070B14] text-[#EAF0FF] flex flex-col font-sans select-none">
      {/* 64px Distraction-Free Header */}
      <header className="h-16 px-4 md:px-8 border-b border-white/10 bg-[#0B1220]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="p-2 rounded-xl text-[#A3B0CC] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Exit Test"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#2F6BFF]/20 text-[#22D3EE] border border-[#2F6BFF]/30">
                {session.subject}
              </span>
              <h1 className="text-xs md:text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
                {session.title}
              </h1>
            </div>
            <p className="text-[11px] text-[#A3B0CC]">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        {/* Center / Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs md:text-sm font-bold transition-all ${
              isCriticalTime
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isLowTime
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-[#EAF0FF] border-white/10'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          {/* Palette Toggle */}
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer md:flex items-center gap-1.5 text-xs font-bold"
            title="Question Palette"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Palette</span>
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-[#2F6BFF] hover:bg-[#2557D6] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* Main Question Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-between">
        {currentQ ? (
          <div className="space-y-6">
            {/* Question Header & Flag Toggle */}
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div className="flex items-center gap-2 text-xs text-[#A3B0CC]">
                <span className="font-bold text-[#22D3EE]">Q{currentIndex + 1}</span>
                {currentQ.chapter && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{currentQ.chapter}</span>
                  </>
                )}
              </div>
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  isCurrentFlagged
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/5 text-[#A3B0CC] border-white/10 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isCurrentFlagged ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>

            {/* Question Stem with MathText */}
            <div className="text-base md:text-lg font-medium text-[#EAF0FF] leading-relaxed py-2">
              <MathText text={currentQ.stem} />
            </div>

            {/* Option Cards (>= 56px touch target) */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((optText, optIdx) => {
                const isSelected = currentAnswer === optIdx;
                const optLetter = String.fromCharCode(65 + optIdx);
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full min-h-[56px] p-4 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] text-white shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 hover:bg-white/8 border-white/10 text-[#EAF0FF]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                          : 'bg-white/5 text-[#A3B0CC] border-white/10'
                      }`}
                    >
                      {optLetter}
                    </div>
                    <div className="flex-1 text-sm md:text-base leading-snug">
                      <MathText text={optText} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-[#A3B0CC]">Question not found.</div>
        )}

        {/* Footer Navigation Bar */}
        <div className="pt-8 pb-4 flex items-center justify-between border-t border-white/8 mt-8">
          <button
            onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A3B0CC] hidden sm:inline">
              Shortcuts: 1-4 / A-D to select, F to flag, N/P to move
            </span>
          </div>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2557D6] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Review & Submit</span>
            </button>
          )}
        </div>
      </main>

      {/* Floating Question Palette Drawer */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0B1220] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#22D3EE]" />
                  <span>Question Palette</span>
                </h3>
                <button
                  onClick={() => setShowPalette(false)}
                  className="p-1.5 rounded-lg text-[#A3B0CC] hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A3B0CC] bg-white/5 p-3 rounded-xl border border-white/8">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#2F6BFF]" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-white/10" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>Flagged ({flaggedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border-2 border-white" />
                  <span>Active</span>
                </div>
              </div>

              {/* Number Tiles Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {session.questions.map((q, idx) => {
                  const isAns = answers[q.id] !== null && answers[q.id] !== undefined;
                  const isFlg = flagged.includes(q.id);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPalette(false);
                      }}
                      className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center relative transition-all cursor-pointer border ${
                        isCurrent ? 'ring-2 ring-white border-white scale-105 z-10' : ''
                      } ${
                        isFlg
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isAns
                          ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                          : 'bg-white/5 text-[#A3B0CC] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlg && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setShowPalette(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2557D6] text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF]/20 text-[#22D3EE] border border-[#2F6BFF]/30 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Ready to Submit?</h3>
              <p className="text-xs text-[#A3B0CC]">
                Review your session summary below before finalizing your score.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/5 p-4 rounded-2xl border border-white/8 text-center">
              <div>
                <p className="text-lg font-extrabold text-emerald-400">{answeredCount}</p>
                <p className="text-[11px] text-[#A3B0CC]">Answered</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-400">{unansweredCount}</p>
                <p className="text-[11px] text-[#A3B0CC]">Unanswered</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-blue-400">{flaggedCount}</p>
                <p className="text-[11px] text-[#A3B0CC]">Flagged</p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                ⚠️ You have {unansweredCount} unanswered questions remaining.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer border border-white/10"
              >
                Keep Testing
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2557D6] text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Scoring...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Leave Test Session?</h3>
              <p className="text-xs text-[#A3B0CC]">
                Your answers have been autosaved. You can return anytime while the timer is running.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer border border-white/10"
              >
                Stay
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
