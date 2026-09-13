import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { Question, UserAnswer, TestConfig } from '../types';
import { deduplicateQuestions } from '../lib/shuffle';
import { User, StudentProfile } from '../lib/supabase';
import { SecurityWatermark } from './SecurityWatermark';
import { downloadQuizPdf } from '../lib/pdfGenerator';
import {
  Bookmark,
  ChevronLeft,
  Grid,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Download,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import { saveBookmark, removeBookmark } from '../lib/bookmarks';
import type { MCQContext } from '../types';
import { FormattedExplanation } from './FormattedExplanation';
import { MathText } from './MathText';

import { checkAndRecordPdfDownload } from '../lib/pdfLimit';
import { isUserProOrPaid } from '../lib/supabase';
import { PdfRestrictionModal } from './PdfRestrictionModal';
import { LeaveConfirmationModal } from './LeaveConfirmationModal';

interface TestScreenProps {
  questions: Question[];
  config: TestConfig;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  initialCurrentIndex?: number;
  initialUserAnswers?: Record<number, UserAnswer>;
  initialTimeLeftSeconds?: number;
  bgGenError?: string | null;
  onRetryGeneration?: () => void;
  onLoadPracticeBank?: () => void;
  onFinishTest: (answers: UserAnswer[], timeTakenSeconds: number) => void;
  onExitTest?: () => void;
  onUpgradeClick?: () => void;
  onExplainMcq?: (mcqCtx: MCQContext) => void;
  onSessionStateChange?: (state: { currentIndex: number; userAnswers: Record<number, UserAnswer>; timeLeftSeconds: number }) => void;
}

export const TestScreen: React.FC<TestScreenProps> = React.memo(({
  questions,
  config,
  currentUser,
  userProfile,
  initialCurrentIndex,
  initialUserAnswers,
  initialTimeLeftSeconds,
  bgGenError,
  onRetryGeneration,
  onLoadPracticeBank,
  onFinishTest,
  onExitTest,
  onUpgradeClick,
  onExplainMcq,
  onSessionStateChange,
}) => {
  const durationMins = config?.durationMinutes || 10;
  const targetDurationSeconds = durationMins * 60;

  const [currentIndex, setCurrentIndex] = useState(() => initialCurrentIndex ?? 0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>(() => initialUserAnswers ?? {});
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [restrictionInfo, setRestrictionInfo] = useState<{
    reason: string;
    message?: string;
    remainingMs?: number;
    nextAvailableAt?: string;
    isProHint?: boolean;
    userProfile?: StudentProfile | null;
  } | null>(null);

  const testConfigKey = `${config?.subject || ''}-${config?.classNum || ''}-${config?.group || ''}-${durationMins}-${config?.questionCount || 0}`;
  const lastConfigKeyRef = useRef<string>(testConfigKey);

  // Wall-clock end timestamp for continuous background resilient countdown
  const endTimeRef = useRef<number>(
    Date.now() + (typeof initialTimeLeftSeconds === 'number' && initialTimeLeftSeconds >= 0 ? initialTimeLeftSeconds : targetDurationSeconds) * 1000
  );
  const hasFinishedRef = useRef<boolean>(false);

  // Re-initialize end timestamp if test configuration changes
  useEffect(() => {
    if (lastConfigKeyRef.current !== testConfigKey) {
      lastConfigKeyRef.current = testConfigKey;
      const startSecs = typeof initialTimeLeftSeconds === 'number' && initialTimeLeftSeconds >= 0 ? initialTimeLeftSeconds : targetDurationSeconds;
      endTimeRef.current = Date.now() + startSecs * 1000;
      hasFinishedRef.current = false;
    }
  }, [testConfigKey, targetDurationSeconds, initialTimeLeftSeconds]);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() =>
    Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
  );

  const questionStartTimeRef = useRef<number>(Date.now());

  const effectiveQuestions = useMemo(() => {
    const deduped = deduplicateQuestions(questions);
    return (config?.questionCount && config.questionCount > 0 && deduped.length > config.questionCount)
      ? deduped.slice(0, config.questionCount)
      : deduped;
  }, [questions, config?.questionCount]);

  const currentQ = effectiveQuestions[currentIndex];
  const targetTotalQ = config?.questionCount ? Math.min(config.questionCount, effectiveQuestions.length) : (effectiveQuestions.length || 10);
  const totalQ = Math.max(1, targetTotalQ);
  const currentAnswer = userAnswers[currentIndex];
  const isAnswered = Boolean(currentAnswer && currentAnswer.selectedOption !== null);

  const handleFinishTest = useCallback(async () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      const totalTimeTaken = Math.max(1, targetDurationSeconds - remaining);

      const answerList: UserAnswer[] = effectiveQuestions.map((_, idx) => {
        return (
          userAnswers[idx] || {
            questionIndex: idx,
            selectedOption: null,
            timeSpentSeconds: 0,
            flagged: false,
          }
        );
      });
      await Promise.resolve(onFinishTest(answerList, totalTimeTaken));
    } catch (err: any) {
      console.error('[TestScreen handleFinishTest Exception]:', err);
      hasFinishedRef.current = false;
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Failed to submit test results. Please try again.');
    }
  }, [targetDurationSeconds, effectiveQuestions, userAnswers, onFinishTest]);

  // Sync initial props into state when restored from session storage/backend
  useEffect(() => {
    if (initialUserAnswers && Object.keys(initialUserAnswers).length > 0) {
      setUserAnswers((prev) => {
        const merged = { ...initialUserAnswers, ...prev };
        return merged;
      });
    }
  }, [initialUserAnswers]);

  useEffect(() => {
    if (typeof initialCurrentIndex === 'number' && initialCurrentIndex >= 0) {
      setCurrentIndex(initialCurrentIndex);
    }
  }, [initialCurrentIndex]);

  // Report active session state to parent whenever index or answers change (prevents re-rendering App on every 500ms timer tick)
  useEffect(() => {
    if (onSessionStateChange) {
      const remainingSecs = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      onSessionStateChange({
        currentIndex,
        userAnswers,
        timeLeftSeconds: remainingSecs,
      });
    }
  }, [currentIndex, userAnswers, onSessionStateChange]);

  // Auto-fallback timer: If currentQ is missing for > 2s, automatically trigger onLoadPracticeBank to populate question
  useEffect(() => {
    if (!currentQ && onLoadPracticeBank) {
      const fallbackTimer = setTimeout(() => {
        console.warn('[TestScreen Auto-Fallback Triggered]: Question loading delayed, auto-populating question via practice bank fallback...');
        onLoadPracticeBank();
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [currentQ, currentIndex, onLoadPracticeBank]);

  // Continuous Time-Based Timer (wall-clock based: immune to re-renders, question navigation, backgrounding & idle)
  useEffect(() => {
    const tick = () => {
      if (hasFinishedRef.current) return;
      const now = Date.now();
      const remainingMs = endTimeRef.current - now;
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeftSeconds(remainingSecs);

      if (remainingSecs <= 0) {
        handleFinishTest();
      }
    };

    tick();
    const timer = setInterval(tick, 500);

    return () => clearInterval(timer);
  }, [handleFinishTest]);

  // Format Timer mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIndex: number) => {
    if (isAnswered) return;

    triggerHaptic(HAPTIC_PATTERNS.light);
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    const newUserAnswers = {
      ...userAnswers,
      [currentIndex]: {
        questionIndex: currentIndex,
        selectedOption: optIndex,
        timeSpentSeconds: (userAnswers[currentIndex]?.timeSpentSeconds || 0) + timeSpent,
        flagged: userAnswers[currentIndex]?.flagged || false,
      },
    };

    setUserAnswers(newUserAnswers);
    questionStartTimeRef.current = Date.now();

    // Notify session state listener immediately upon answer selection for instant locking & backend persistence
    if (onSessionStateChange) {
      onSessionStateChange({
        currentIndex,
        userAnswers: newUserAnswers,
        timeLeftSeconds,
      });
    }
  };

  const handleToggleFlag = () => {
    const isNowFlagged = !currentAnswer?.flagged;
    if (currentQ) {
      if (isNowFlagged) {
        saveBookmark(currentQ, config.subject, config.classNum, config.group);
      } else {
        removeBookmark(currentQ.id);
      }
    }

    setUserAnswers((prev) => {
      const existing = prev[currentIndex] || {
        questionIndex: currentIndex,
        selectedOption: null,
        timeSpentSeconds: 0,
      };
      return {
        ...prev,
        [currentIndex]: {
          ...existing,
          flagged: isNowFlagged,
        },
      };
    });
  };

  const handleSkip = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1);
      questionStartTimeRef.current = Date.now();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1);
      questionStartTimeRef.current = Date.now();
    } else {
      handleFinishTest();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      questionStartTimeRef.current = Date.now();
    }
  };

  const progressPct = Math.round(((currentIndex + 1) / totalQ) * 100);

  const containsUrdu = (text: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');

  const isUrduOrIslamiat =
    ['urdu', 'islam', 'din'].some((term) => (config.subject || '').toLowerCase().includes(term)) ||
    effectiveQuestions.some((q) => containsUrdu(q.q) || q.options.some((o) => containsUrdu(o)));

  const urduOptionBadges = ['الف', 'ب', 'ج', 'د'];

  const handleDownloadPdf = async () => {
    setRestrictionInfo(null);
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      let activeProf = userProfile;
      if (!activeProf) {
        try {
          if (currentUser?.id) {
            const cached = localStorage.getItem(`boardly_profile_${currentUser.id}`);
            if (cached) activeProf = JSON.parse(cached);
          }
          if (!activeProf) {
            const cached = localStorage.getItem('boardly_cached_profile');
            if (cached) activeProf = JSON.parse(cached);
          }
        } catch (e) {}
      }

      let activeUser = currentUser;
      if (!activeUser) {
        try {
          const cachedUser = localStorage.getItem('boardly_cached_user');
          if (cachedUser) activeUser = JSON.parse(cachedUser);
        } catch (e) {}
      }

      const isProHint = isUserProOrPaid(activeUser, activeProf);
      const pkgHint = activeProf?.package_name || (activeUser as any)?.package_name || (activeUser as any)?.user_metadata?.package_name || '';
      const effectiveUserId = activeUser?.id || activeProf?.id || (activeProf as any)?.user_id;
      const effectiveEmail = activeUser?.email || activeProf?.email;

      console.log('[TestScreen] PDF Download entitlement check initiated:', {
        activeUser,
        activeProf,
        isProHint,
        pkgHint,
        effectiveUserId,
        effectiveEmail,
      });

      if (isProHint) {
        // Pro users get unlimited PDF downloads without rate limit
        console.log('[TestScreen] Pro user detected — bypassing download restriction modal.');
        checkAndRecordPdfDownload(effectiveUserId, effectiveEmail, true, pkgHint, activeProf).catch(() => {});
      } else {
        const checkRes = await Promise.race([
          checkAndRecordPdfDownload(effectiveUserId, effectiveEmail, isProHint, pkgHint, activeProf),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Permission check timed out. Please check your connection and try again.')), 8000)
          ),
        ]);

        if (!checkRes.allowed) {
          if (checkRes.isPro || isProHint) {
            console.log('[TestScreen] User is Pro — allowing PDF download without rate limit.');
          } else {
            console.warn('[TestScreen] PDF Download restricted for free user:', checkRes.reason);
            setRestrictionInfo({
              reason: checkRes.reason || 'FREE_USER',
              message: checkRes.message || 'PDF downloads are a Pro feature — upgrade to unlock unlimited access',
              remainingMs: checkRes.remainingMs,
              nextAvailableAt: checkRes.nextAvailableAt,
              isProHint,
              userProfile: activeProf,
            });
            return;
          }
        }
      }

      const studentName = activeUser?.user_metadata?.full_name || activeUser?.user_metadata?.name || activeProf?.name;
      const gradeOrPath = `Class ${config.classNum}${config.group ? ` (${config.group})` : ''}`;

      await Promise.race([
        downloadQuizPdf({
          subject: config.subject,
          gradeOrPath,
          questions: effectiveQuestions,
          includeAnswers: false,
          studentName,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF generation timed out (~15s) — please try again.')), 15000)
        ),
      ]);
    } catch (err: any) {
      console.error('Failed to download PDF in TestScreen:', err);
      setPdfError(
        err?.message || 'PDF export unavailable — please try again'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <section className="animate-ios-spring flex-1 flex flex-col h-full py-2 relative overflow-hidden" dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}>
      <SecurityWatermark currentUser={currentUser} />

      <div className="relative z-10 flex flex-col h-full gap-3 overflow-hidden">
        {/* Fixed Header Section */}
        <div className="shrink-0 space-y-3">
          {/* FBISE Exam Header Banner for Urdu & Islamiat */}
          {isUrduOrIslamiat && (
            <div className="bg-[#0A1330] text-white border border-[#1E5AFF]/40 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xs font-bold text-[#1E5AFF] tracking-wide font-['Noto_Nastaliq_Urdu','Noto_Sans_Arabic',serif]">
                فیڈرل بورڈ برائے مابعد ثانوی و ثانوی تعلیم - امتحانی پرچہ معروضی (FBISE)
              </div>
              <div className="text-xs font-medium text-slate-300 mt-0.5 font-['Noto_Nastaliq_Urdu','Noto_Sans_Arabic',serif]">
                مضمون: {config.subject} &middot; جماعت {config.classNum} ({config.group || 'عام'})
              </div>
            </div>
          )}

          {/* Test Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {onExitTest && (
                <button
                  onClick={() => {
                    setShowExitConfirmModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600  border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer mr-1 shadow-xs"
                  title="Exit Test & Return to Dashboard"
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Exit to Dashboard</span>
                </button>
              )}
              <span className="text-xs font-bold font-['Space_Grotesk'] text-[#0A1330]  bg-[#1E5AFF]/15 border border-[#1E5AFF]/40 px-3.5 py-1 rounded-full">
                {isUrduOrIslamiat ? `سوال ${currentIndex + 1} از ${totalQ}` : `Q${currentIndex + 1} of ${totalQ}`}
              </span>
              <button
                onClick={() => setShowNavGrid(true)}
                className="p-1.5 rounded-full text-[#0A1330]  bg-black/5  hover:bg-[#1E5AFF] hover:text-white active:scale-95 transition-all cursor-pointer"
                title={isUrduOrIslamiat ? 'سوالات کا نیویگیٹر' : 'Question Navigator'}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {effectiveQuestions.length < totalQ && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full animate-pulse" title="Syllabus-aligned questions generating in background">
                  <Sparkles className="w-3 h-3 text-[#1E5AFF] shrink-0" />
                  <span>Generating more questions ({effectiveQuestions.length}/{totalQ} ready)</span>
                </span>
              )}
              <span
                className={`font-mono text-sm font-extrabold px-3.5 py-1 rounded-full border ${
                  timeLeftSeconds < 120
                    ? 'text-rose-600 bg-rose-100 border-rose-300   animate-pulse'
                    : 'text-[#0A1330]  bg-[#1E5AFF]/15 border border-[#1E5AFF]/40'
                }`}
              >
                {formatTime(timeLeftSeconds)}
              </span>
            </div>
          </div>

          {/* Progress Bar (Electric Blue Bar) */}
          <div className="h-2 rounded-full bg-black/5  overflow-hidden border border-black/5 ">
            <div
              className="h-full bg-[#1E5AFF] transition-all duration-300 shadow-[0_0_10px_rgba(30,90,255,0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Topic & Controls */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0A1330]  uppercase tracking-wider font-['Space_Grotesk']">
              {currentQ?.topic || config.subject}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  pdfError
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700  hover:bg-rose-500/20'
                    : 'border-black/10  bg-white  text-[#0A1330]  hover:border-[#1E5AFF]'
                }`}
                title={pdfError || 'Download PDF WorkSheet'}
              >
                <Download className={`w-3.5 h-3.5 ${pdfError ? 'text-rose-500' : 'text-[#1E5AFF]'}`} />
                <span>{isDownloadingPdf ? 'Generating...' : pdfError ? 'PDF Failed — Retry' : 'PDF WorkSheet'}</span>
              </button>

              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
                  currentAnswer?.flagged
                    ? 'border-[#1E5AFF] bg-[#1E5AFF] text-white'
                    : 'border-black/10  bg-white  text-[#0A1330]  hover:border-[#1E5AFF]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentAnswer?.flagged ? 'fill-white' : ''}`} />
                <span>{currentAnswer?.flagged ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
          </div>

          {pdfError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800  text-xs p-2.5 rounded-xl flex items-center justify-between gap-2">
              <span className="font-semibold">{pdfError}</span>
              <button
                onClick={() => setPdfError(null)}
                className="text-[11px] font-extrabold underline text-rose-900  hover:opacity-80 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {config?.isReviewSet && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{config.reviewNote || "You've seen all available questions for this topic — showing a mixed review set"}</span>
            </div>
          )}
        </div>

        {/* Scrollable Main Content (Question + Options + Explanation Card with attached Doubt Solver) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
          {!currentQ ? (
            bgGenError ? (
              <div className="bg-white border border-black/10 rounded-2xl p-8 sm:p-12 text-center space-y-5 my-auto shadow-sm">
                <p className="text-xs text-rose-500 font-semibold">{bgGenError}</p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {onRetryGeneration && (
                    <button
                      onClick={onRetryGeneration}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E5AFF] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>{isUrduOrIslamiat ? 'سوال دوبارہ لوڈ کریں' : 'Retry Loading Question'}</span>
                    </button>
                  )}
                  {onLoadPracticeBank && (
                    <button
                      onClick={onLoadPracticeBank}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>{isUrduOrIslamiat ? 'پریکٹس بینک سے حاصل کریں' : 'Load Practice Bank'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            <>
              <div className="bg-white  border border-slate-200  rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
                <div dir={isUrduOrIslamiat ? 'rtl' : 'ltr'} className="min-h-[3.5rem] flex items-center py-2 px-1">
                  <MathText
                    text={currentQ.q}
                    isUrduOrIslamiat={isUrduOrIslamiat}
                    block
                    className={`font-['Space_Grotesk'] text-base sm:text-lg font-bold text-[#0A1330]  leading-relaxed ${
                      isUrduOrIslamiat ? 'text-right' : ''
                    }`}
                  />
                </div>

                {/* MCQ Options Tiles */}
                <div className="space-y-3.5">
                  {currentQ.options.map((optText, optIdx) => {
                    const isSelected = currentAnswer?.selectedOption === optIdx;
                    const isCorrect = currentQ.correct === optIdx;
                    const isExamMode = config.instantFeedback === false || config.mode === 'ai-custom';
                    const showInstantFeedback = !isExamMode;
                    const showInstant = isAnswered && showInstantFeedback;

                    let tileStyle = 'bg-white  border-slate-200  hover:border-[#1E5AFF] hover:shadow-md';
                    let badgeStyle = 'bg-slate-100  text-[#0A1330]  border border-slate-200 ';

                    if (showInstant) {
                      if (isCorrect) {
                        tileStyle = 'bg-emerald-500/10 border-2 border-emerald-500 text-[#0A1330]  font-bold';
                        badgeStyle = 'bg-emerald-500 text-white font-bold border-transparent';
                      } else if (isSelected && !isCorrect) {
                        tileStyle = 'bg-rose-500/10 border-2 border-rose-500 text-[#0A1330]  font-bold';
                        badgeStyle = 'bg-rose-500 text-white font-bold border-transparent';
                      } else {
                        tileStyle = 'bg-white  border-black/5  opacity-50';
                        badgeStyle = 'bg-black/5  text-slate-400 border-transparent';
                      }
                    } else if (isSelected) {
                      tileStyle = 'bg-[#1E5AFF]/10 border-2 border-[#1E5AFF] text-[#0A1330]  font-bold shadow-md';
                      badgeStyle = 'bg-[#1E5AFF] text-white font-extrabold border-transparent';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        disabled={isAnswered && !isExamMode}
                        dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}
                        className={`w-full text-left p-4.5 sm:p-5.5 min-h-[4.25rem] h-auto rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                          isAnswered && !isExamMode ? 'cursor-default' : ''
                        } ${tileStyle}`}
                      >
                        <div className="flex items-center gap-3.5 pr-2 min-w-0 flex-1 my-auto py-1">
                          <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 font-['Space_Grotesk'] ${badgeStyle}`}>
                            {isUrduOrIslamiat ? urduOptionBadges[optIdx] : String.fromCharCode(65 + optIdx)}
                          </span>
                          <div className="flex-1 min-w-0 py-1 px-0.5">
                            <MathText
                              text={optText}
                              isUrduOrIslamiat={isUrduOrIslamiat}
                              className={`text-sm sm:text-base font-medium text-[#0A1330]  leading-relaxed ${
                                isUrduOrIslamiat ? 'text-right' : ''
                              }`}
                            />
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-center ml-2 my-auto">
                          {showInstant && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                          {showInstant && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                          {!showInstant && isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#1E5AFF] text-white flex items-center justify-center font-bold">
                              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Answer Explanation Card when answered (Only in Instant Feedback Mode) */}
              {isAnswered && config.instantFeedback !== false && config.mode !== 'ai-custom' && (
                <div
                  dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}
                  className="bg-[#0A1330] text-white border border-[#1E5AFF]/40 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-3 shadow-md animate-ios-spring"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[#1E5AFF] uppercase tracking-wider text-xs sm:text-sm">
                      <HelpCircle className="w-4 h-4 text-[#1E5AFF]" />
                      <span>Official Answer Explanation</span>
                    </div>
                  </div>

                  <FormattedExplanation text={currentQ.explain} isUrduOrIslamiat={isUrduOrIslamiat} />

                  {/* Contextual Doubt Solver Attached Directly to Explanation Card */}
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                      <Sparkles className="w-4 h-4 text-[#1E5AFF] shrink-0 animate-pulse" />
                      <span>Still confused after reading the explanation?</span>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic(HAPTIC_PATTERNS.medium);
                        if (onExplainMcq) {
                          onExplainMcq({
                            question: currentQ.q,
                            options: currentQ.options,
                            correctOption: currentQ.correct,
                            selectedOption: currentAnswer?.selectedOption ?? null,
                            subject: config.subject || 'Practice Test',
                            topic: currentQ.topic || 'General Topic',
                            explanation: currentQ.explain,
                          });
                        }
                      }}
                      className="px-4 py-2.5 bg-[#1E5AFF] hover:bg-[#1546CC] active:scale-98 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md shrink-0"
                      title="Solve My Doubt with Study Buddy AI"
                    >
                      <img
                        src="/study-buddy-logo.svg"
                        alt="Study Buddy AI"
                        className="w-4 h-4 rounded-full object-contain filter drop-shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <span>Ask Doubt</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {submitError && (
          <div className="shrink-0 bg-rose-500/10 border border-rose-500/30 text-rose-600  p-3 rounded-2xl text-xs flex items-center justify-between gap-2 animate-ios-spring">
            <div className="flex items-center gap-2 font-medium">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
            <button
              onClick={() => {
                setSubmitError(null);
                handleFinishTest();
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-all shadow-sm"
            >
              Retry Submit
            </button>
          </div>
        )}

        {/* Pinned Bottom Navigation Buttons */}
        <div className="shrink-0 flex items-center gap-3 pt-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isSubmitting}
            className="p-3.5 bg-white  border border-black/10  text-[#0A1330]  rounded-full hover:border-[#1E5AFF] disabled:opacity-30 cursor-pointer transition-all shadow-sm"
            title="Previous Question"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1 bg-white  border border-black/10  text-[#0A1330]  font-bold py-3.5 px-4 rounded-full hover:border-[#1E5AFF] disabled:opacity-30 cursor-pointer transition-all text-xs sm:text-sm shadow-sm"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 bg-[#1E5AFF] hover:bg-[#1546CC] disabled:opacity-75 text-white font-extrabold py-3.5 px-6 rounded-full transition-all active:scale-98 cursor-pointer shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Submitting Test...</span>
              </>
            ) : (
              <>
                <span>{currentIndex === totalQ - 1 ? 'Submit Test' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Navigator */}
      {showNavGrid && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white  border border-black/10  rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-['Space_Grotesk'] font-bold text-lg text-[#0A1330] ">
                Question Navigator
              </h3>
              <button
                onClick={() => setShowNavGrid(false)}
                className="w-8 h-8 rounded-full bg-black/5  flex items-center justify-center text-[#0A1330]  hover:bg-[#1E5AFF] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
              {Array.from({ length: totalQ }, (_, idx) => {
                const isAvailable = idx < effectiveQuestions.length;
                const ans = userAnswers[idx];
                const isCurrent = idx === currentIndex;
                const isDone = ans && ans.selectedOption !== null;
                const isFlagged = ans?.flagged;

                let badgeColor = 'bg-black/5 text-slate-600  ';
                if (!isAvailable) {
                  badgeColor = 'bg-slate-100 text-slate-400   border-dashed border-slate-300  opacity-70';
                } else if (isCurrent) {
                  badgeColor = 'bg-[#1E5AFF] text-white font-extrabold shadow-sm';
                } else if (isFlagged) {
                  badgeColor = 'bg-[#0A1330] text-[#1E5AFF] border border-[#1E5AFF]/50';
                } else if (isDone) {
                  badgeColor = 'bg-emerald-500/20 text-emerald-800  border border-emerald-500/30';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowNavGrid(false);
                    }}
                    className={`h-10 rounded-xl text-xs font-bold border flex items-center justify-center relative cursor-pointer transition-all ${badgeColor}`}
                  >
                    <span>{idx + 1}</span>
                    {!isAvailable && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#1E5AFF] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNavGrid(false)}
                className="flex-1 bg-black/5  text-[#0A0A0A]  font-bold text-xs py-3 rounded-full cursor-pointer hover:bg-black/10  transition-all"
              >
                Close
              </button>
              {onExitTest && (
                <button
                  onClick={() => {
                    setShowNavGrid(false);
                    setShowExitConfirmModal(true);
                  }}
                  className="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-xs py-3 rounded-full cursor-pointer transition-all border border-rose-500/20"
                >
                  Exit to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showExitConfirmModal && (
        <LeaveConfirmationModal
          isOpen={showExitConfirmModal}
          title="Exit Test?"
          message="Exiting will count this test as a used attempt and your current test progress will be lost. Are you sure you want to exit and return to the dashboard?"
          stayLabel="Stay"
          leaveLabel="Leave Anyway"
          onStay={() => setShowExitConfirmModal(false)}
          onLeaveAnyway={() => {
            setShowExitConfirmModal(false);
            if (onExitTest) {
              onExitTest();
            }
          }}
        />
      )}

      {restrictionInfo && (
        <PdfRestrictionModal
          reason={restrictionInfo.reason}
          message={restrictionInfo.message}
          remainingMs={restrictionInfo.remainingMs}
          nextAvailableAt={restrictionInfo.nextAvailableAt}
          onClose={() => setRestrictionInfo(null)}
          onUpgradeClick={onUpgradeClick}
          isProHint={restrictionInfo.isProHint}
          userProfile={restrictionInfo.userProfile}
        />
      )}
    </section>
  );
});
