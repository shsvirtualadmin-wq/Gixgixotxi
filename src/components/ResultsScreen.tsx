import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { TestResult } from '../types';
import { User, StudentProfile, isUserProOrPaid, evaluateStudentAccess } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { downloadQuizPdf } from '../lib/pdfGenerator';
import { FormattedExplanation } from './FormattedExplanation';
import { MathText } from './MathText';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  Award,
  Share2,
  Check,
  Download,
  ArrowRight,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Home,
  ChevronLeft,
  Lock,
} from 'lucide-react';

import { MCQContext } from './StudyBuddyModal';

import { checkAndRecordPdfDownload } from '../lib/pdfLimit';
import { PdfRestrictionModal } from './PdfRestrictionModal';

interface ResultsScreenProps {
  result: TestResult;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  onTakeAnother: () => void;
  onOpenPrintModal: () => void;
  onUpgradeClick?: () => void;
  onBackToHome?: () => void;
  onExplainMcq?: (context: MCQContext) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = React.memo(({
  result,
  currentUser,
  userProfile,
  onTakeAnother,
  onOpenPrintModal,
  onUpgradeClick,
  onBackToHome,
  onExplainMcq,
}) => {
  const { logoUrl } = useSiteSettings();
  const [showReview, setShowReview] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'flagged'>('all');
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [restrictionInfo, setRestrictionInfo] = useState<{
    reason: string;
    message?: string;
    remainingMs?: number;
    nextAvailableAt?: string;
    isProHint?: boolean;
    userProfile?: StudentProfile | null;
  } | null>(null);

  const isProStudent = userProfile?.plan_tier === 'pro' || (userProfile ? evaluateStudentAccess(userProfile).isPro : false);
  const { score, total, percentage, timeTakenSeconds, topicBreakdown, questions, userAnswers, timestamp, config } = result;

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

      console.log('[ResultsScreen] PDF Download entitlement check initiated:', {
        activeUser,
        activeProf,
        isProHint,
        pkgHint,
        effectiveUserId,
        effectiveEmail,
      });

      if (isProHint) {
        // Pro users get unlimited PDF downloads without rate limit
        console.log('[ResultsScreen] Pro user detected — bypassing download restriction modal.');
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
            console.log('[ResultsScreen] User is Pro — allowing PDF download without rate limit.');
          } else {
            console.warn('[ResultsScreen] PDF Download restricted for free user:', checkRes.reason);
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
      const gradeOrPath = `Class ${config?.classNum}${config?.group ? ` (${config.group})` : ''}`;

      await Promise.race([
        downloadQuizPdf({
          subject: config?.subject || 'Practice Test',
          gradeOrPath,
          questions,
          includeAnswers: true,
          studentName,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF generation timed out (~15s) — please try again.')), 15000)
        ),
      ]);
    } catch (err: any) {
      console.error('Failed to download PDF in ResultsScreen:', err);
      setPdfError(
        err?.message ||
          (isUrduOrIslamiat
            ? 'پی ڈی ایف ایکسپورٹ دستیاب نہیں ہے — براہ کرم دوبارہ کوشش کریں'
            : 'PDF export unavailable — please try again')
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const minutesTaken = Math.floor(timeTakenSeconds / 60);
  const secondsTaken = timeTakenSeconds % 60;
  const timeFormatted = `${minutesTaken}:${secondsTaken.toString().padStart(2, '0')}`;

  const dateFormatted = new Date(timestamp || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleShare = async () => {
    const subjectTitle = config?.subject || 'MCQ Test';
    const summaryText = `🎓 Boardly Practice Test Result\n📚 Subject: ${subjectTitle}\n🎯 Score: ${score}/${total} (${percentage}%)\n⏱️ Time Taken: ${timeFormatted}\n📅 Date: ${dateFormatted}\n\nPracticed on Boardly Virtual Academy!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boardly Result — ${subjectTitle}`,
          text: summaryText,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = summaryText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const containsUrdu = (text: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');

  const isUrduOrIslamiat =
    ['urdu', 'islam', 'din'].some((term) => (config?.subject || '').toLowerCase().includes(term)) ||
    questions.some((q) => containsUrdu(q.q) || q.options.some((o) => containsUrdu(o)));

  let gradeBadge = { text: isUrduOrIslamiat ? 'شاندار کارکردگی!' : 'Outstanding!', color: 'text-[#0A0A0A] bg-[#F2B90C]' };
  if (percentage < 50) {
    gradeBadge = { text: isUrduOrIslamiat ? 'دوبارہ دہرائی کی ضرورت ہے' : 'Needs Revision', color: 'text-rose-900 bg-rose-100  ' };
  } else if (percentage < 75) {
    gradeBadge = { text: isUrduOrIslamiat ? 'بہتر پیش رفت!' : 'Good Progress', color: 'text-[#0A0A0A] bg-[#F2B90C]/80' };
  }

  const urduChoiceLabels = ['الف', 'ب', 'ج', 'د'];

  const filteredQuestions = questions.map((q, idx) => ({ q, idx, ans: userAnswers[idx] })).filter(({ q, ans }) => {
    if (filter === 'wrong') return ans?.selectedOption !== q.correct;
    if (filter === 'flagged') return ans?.flagged;
    return true;
  });

  return (
    <section className="animate-ios-spring flex-1 flex flex-col gap-4 py-2 relative overflow-hidden" dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}>
      <div className="relative z-10 flex flex-col h-full gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/5 ">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.light);
                  onBackToHome();
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100  text-slate-800  hover:bg-[#F2B90C] hover:text-[#0A0A0A] transition-all cursor-pointer border border-black/5  shrink-0"
                title="Return to Student Dashboard"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Dashboard</span>
              </button>
            )}
            <div
              onClick={() => {
                if (onBackToHome) onBackToHome();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0A0A0A] border-2 border-[#F2B90C] rounded-2xl p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Return to Student Dashboard"
            >
              <img
                src={logoUrl || "https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg"}
                alt="Boardly Logo"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo.png';
                }}
              />
            </div>
            <div>
              <h1 className="font-['Space_Grotesk'] font-black text-base sm:text-lg text-slate-900 uppercase tracking-wider leading-none">
                BOARDLY ACADEMY
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#F2B90C] tracking-wide mt-0.5">
                Official Score &amp; Evaluation Report
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]  bg-[#F2B90C]/20 border border-[#F2B90C]/40 px-3 py-1 rounded-full">
              {isUrduOrIslamiat ? 'امتحانی پرچہ مکمل ہوا' : 'Test Completed'}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {dateFormatted}
            </span>
          </div>
        </div>

        {/* Hero Score Card */}
        <div className="bg-white  text-slate-900  border border-black/10  rounded-3xl p-6 sm:p-8 text-center shadow-xl space-y-4 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2B90C]/15  rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                className="stroke-black/10 "
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                className="stroke-[#F2B90C] transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * percentage) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-['Space_Grotesk'] text-3xl font-extrabold text-slate-900  tracking-tight">{percentage}%</span>
              <span className="text-[10px] uppercase tracking-widest text-[#D99A00]  font-bold">
                {isUrduOrIslamiat ? 'ایکوریسی' : 'Accuracy'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${gradeBadge.color}`}>
              <Award className="w-4 h-4" />
              <span>{gradeBadge.text}</span>
            </div>
            <p className="text-slate-600  text-xs sm:text-sm font-medium">
              {score} of {total} Correct Answers &middot; Time Taken: {timeFormatted}
            </p>
          </div>
        </div>

        {/* Topic Breakdown Card */}
        <div className="bg-white  border border-black/10  rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-['Space_Grotesk'] text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isUrduOrIslamiat ? 'موضوعات کا جائزہ' : 'Topic Mastery Breakdown'}
            </h3>
            {!isProStudent && (
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Basic Summary Only
              </span>
            )}
          </div>

          {!isProStudent ? (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 text-center">
              <p className="text-xs text-slate-600  font-medium">
                Detailed chapter &amp; topic breakdown is locked on the Free Starter tier.
              </p>
              {onUpgradeClick && (
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Upgrade to Pro to Unlock Full Analytics
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(Object.entries(topicBreakdown) as [string, { total: number; correct: number }][]).map(([topic, stats]) => {
                const topicPct = Math.round((stats.correct / Math.max(1, stats.total)) * 100);
                return (
                  <div key={topic} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0A0A0A]  truncate max-w-[200px]">{topic}</span>
                      <span className="text-slate-500 font-bold">{stats.correct}/{stats.total} ({topicPct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-black/5  rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F2B90C] rounded-full transition-all duration-700"
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Primary Action Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onBackToHome && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.medium);
                onBackToHome();
              }}
              className="flex-1 bg-[#F2B90C] hover:bg-[#E0AB00] text-[#0A0A0A] font-extrabold py-3.5 px-6 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer select-none"
            >
              <Home className="w-4 h-4 text-[#0A0A0A]" />
              <span>Return to Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.medium);
              onTakeAnother();
            }}
            className="flex-1 bg-slate-900 hover:bg-slate-800   text-white border border-slate-900  font-extrabold py-3.5 px-6 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer select-none"
          >
            <RotateCcw className="w-4 h-4 text-[#F2B90C]" />
            <span>Take Another Test</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.light);
              setShowReview((prev) => !prev);
            }}
            className="bg-white  border border-black/10  text-[#0A0A0A]  font-bold py-3.5 px-5 rounded-full hover:border-[#F2B90C] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm select-none"
          >
            <span>{showReview ? 'Hide Review' : 'Review Answers'}</span>
            {showReview ? <ChevronUp className="w-4 h-4 text-[#F2B90C]" /> : <ChevronDown className="w-4 h-4 text-[#F2B90C]" />}
          </button>
        </div>

        {/* Error Banner */}
        {pdfError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800  text-xs p-3 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
            <span>{pdfError}</span>
            <button
              type="button"
              onClick={() => setPdfError(null)}
              className="text-xs font-extrabold text-rose-900  hover:underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Secondary Tools */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.light);
              handleDownloadPdf();
            }}
            disabled={isDownloadingPdf}
            className={`p-3 rounded-full border transition-all active:scale-95 active:opacity-80 cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-60 select-none ${
              pdfError
                ? 'border-rose-500 bg-rose-500/10 text-rose-700  hover:bg-rose-500/20'
                : 'bg-white  border-black/10  text-[#0A0A0A]  hover:border-[#F2B90C]'
            }`}
            title={pdfError || 'Download PDF Study Sheet'}
          >
            {isDownloadingPdf ? (
              <div className="w-4 h-4 border-2 border-[#F2B90C] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <Download className={`w-4 h-4 shrink-0 ${pdfError ? 'text-rose-500' : 'text-[#F2B90C]'}`} />
            )}
            <span>
              {isDownloadingPdf
                ? 'Generating PDF...'
                : pdfError
                ? 'PDF Failed — Retry'
                : 'PDF Study Sheet'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.light);
              handleShare();
            }}
            className="p-3 bg-white  border border-black/10  rounded-full text-[#0A0A0A]  hover:border-[#F2B90C] transition-all active:scale-95 active:opacity-80 cursor-pointer flex items-center gap-1.5 text-xs font-bold select-none"
            title="Share Test Result"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-[#F2B90C]" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          {isProStudent ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                onOpenPrintModal();
              }}
              className="p-3 bg-white  border border-black/10  rounded-full text-[#0A0A0A]  hover:border-[#F2B90C] transition-all active:scale-95 active:opacity-80 cursor-pointer flex items-center gap-1.5 text-xs font-bold select-none"
              title="Print Worksheet"
            >
              <Printer className="w-4 h-4 text-[#F2B90C]" />
              <span>Print</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                if (onUpgradeClick) onUpgradeClick();
                else onOpenPrintModal();
              }}
              className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 active:opacity-80 cursor-pointer flex items-center gap-1.5 text-xs font-bold select-none"
              title="Requires Pro Plan — Upgrade to unlock printable PDF"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Print (Pro)</span>
            </button>
          )}
        </div>

        {/* Answer Key Review Section */}
        {showReview && (
          <div className="space-y-4 pt-2 animate-ios-spring">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#0A0A0A] ">
                Detailed Answer Review
              </h3>

              <div className="flex items-center gap-1 bg-black/5  p-1 rounded-full text-xs relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.light);
                    setFilter('all');
                  }}
                  className={`relative px-3.5 py-1.5 rounded-full font-bold transition-colors cursor-pointer select-none z-10 ${
                    filter === 'all'
                      ? 'text-white '
                      : 'text-slate-600  hover:text-slate-900 '
                  }`}
                >
                  {filter === 'all' && (
                    <motion.div
                      layoutId="activeAnswerReviewTab"
                      className="absolute inset-0 bg-[#0A0A0A]  rounded-full -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span>All ({total})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.light);
                    setFilter('wrong');
                  }}
                  className={`relative px-3.5 py-1.5 rounded-full font-bold transition-colors cursor-pointer select-none z-10 ${
                    filter === 'wrong'
                      ? 'text-white'
                      : 'text-slate-600  hover:text-slate-900 '
                  }`}
                >
                  {filter === 'wrong' && (
                    <motion.div
                      layoutId="activeAnswerReviewTab"
                      className="absolute inset-0 bg-rose-500 rounded-full -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span>Incorrect ({total - score})</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 bg-white  border border-black/10  rounded-2xl text-slate-500  text-sm font-medium">
                    {filter === 'wrong' ? '🎉 No incorrect answers! Perfect score!' : 'No questions found for this filter.'}
                  </div>
                ) : (
                  filteredQuestions.map(({ q, idx, ans }) => {
                    const selectedIdx = ans?.selectedOption ?? null;
                    const isCorrect = selectedIdx === q.correct;
                    const isSkipped = selectedIdx === null;

                    return (
                      <div
                        key={q.id || idx}
                        dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}
                        className="bg-white  border border-black/10  rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-[#0A0A0A]  leading-relaxed">
                            <span className="text-[#F2B90C] font-extrabold mr-1.5">Q{idx + 1}.</span>
                            <MathText text={q.q} isUrduOrIslamiat={isUrduOrIslamiat} />
                          </div>
                          {isCorrect ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100   px-2.5 py-0.5 rounded-full shrink-0">
                              Correct
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-100   px-2.5 py-0.5 rounded-full shrink-0">
                              {isSkipped ? 'Skipped' : 'Incorrect'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isUserChoice = selectedIdx === oIdx;
                            const isCorrectChoice = q.correct === oIdx;

                            let style = 'bg-black/5  border-transparent text-slate-700 ';
                            let badge = 'bg-black/10 text-slate-800  ';

                            if (isCorrectChoice) {
                              style = 'bg-emerald-500/10 border-emerald-500 border text-[#0A0A0A]  font-bold';
                              badge = 'bg-emerald-500 text-white font-bold';
                            } else if (isUserChoice && !isCorrectChoice) {
                              style = 'bg-rose-500/10 border-rose-500 border text-[#0A0A0A]  line-through';
                              badge = 'bg-rose-500 text-white font-bold';
                            }

                            return (
                              <div key={oIdx} className={`p-3 sm:p-3.5 min-h-[3.25rem] h-auto rounded-xl border flex items-center justify-between gap-2.5 ${style}`}>
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 py-0.5">
                                  <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${badge}`}>
                                    {isUrduOrIslamiat ? urduChoiceLabels[oIdx] : String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <MathText text={opt} isUrduOrIslamiat={isUrduOrIslamiat} className="leading-relaxed text-xs sm:text-sm" />
                                  </div>
                                </div>
                                {isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                {isUserChoice && !isCorrectChoice && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-[#0A0A0A] text-white border border-[#F2B90C]/30 rounded-xl p-3.5 text-xs leading-relaxed space-y-2.5 shadow-sm mt-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#F2B90C] uppercase tracking-wider text-[11px]">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Official Explanation</span>
                          </div>
                          <FormattedExplanation text={q.explain} isUrduOrIslamiat={isUrduOrIslamiat} />

                          <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-[#F2B90C] shrink-0 animate-pulse" />
                              <span>Still confused after reading the explanation?</span>
                            </div>

                            <button
                              onClick={() => {
                                triggerHaptic(HAPTIC_PATTERNS.medium);
                                if (onExplainMcq) {
                                  onExplainMcq({
                                    question: q.q,
                                    options: q.options,
                                    correctOption: q.correct,
                                    selectedOption: ans?.selectedOption ?? null,
                                    subject: config?.subject || 'Practice Test',
                                    topic: q.topic || 'General Topic',
                                    explanation: q.explain,
                                  });
                                }
                              }}
                              className="px-3.5 py-2 bg-[#F2B90C] hover:bg-[#E0AB00] active:scale-98 text-[#0A0A0A] rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md shrink-0"
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
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

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
