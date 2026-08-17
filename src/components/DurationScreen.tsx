import React, { useState, useEffect } from 'react';
import { PathType, QuestionDifficulty, TestMode } from '../types';
import { fetchStudentMcqUsage, StudentMcqUsageInfo, User, StudentProfile, evaluateStudentAccess, isAdminEmail } from '../lib/supabase';
import { Zap, Check, ShieldCheck, Gauge, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { BrandedLoadingSpinner } from './BrandedLoadingSpinner';

interface DurationScreenProps {
  stepLabel?: string;
  path?: PathType;
  subject: string;
  customTopic?: string;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  mcqUsageInfo?: StudentMcqUsageInfo | null;
  onStartTest: (params: {
    durationMinutes: number;
    questionCount: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
    subject?: string;
    customTopic?: string;
  }) => void;
  onBack: () => void;
  isGenerating?: boolean;
  isTestLimitReached?: boolean;
}

export const DurationScreen: React.FC<DurationScreenProps> = ({
  stepLabel = 'Step 4 of 4',
  subject,
  customTopic,
  currentUser,
  userProfile,
  mcqUsageInfo,
  onStartTest,
  onBack,
  isGenerating = false,
  isTestLimitReached = false,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [selectedQuestions, setSelectedQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Exam Standard');
  const [mode, setMode] = useState<TestMode>('instant');
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [usageInfo, setUsageInfo] = useState<StudentMcqUsageInfo | null>(mcqUsageInfo || null);

  useEffect(() => {
    fetchStudentMcqUsage(currentUser?.id || 'guest', currentUser?.email, userProfile).then((info) => {
      setUsageInfo(info);
    });
  }, [currentUser?.id, currentUser?.email, userProfile]);

  const access = evaluateStudentAccess(userProfile || null, 0, isAdminEmail(currentUser?.email));
  const isProUser = Boolean(
    usageInfo?.isAdmin || 
    usageInfo?.isPro || 
    access.isPro || 
    isAdminEmail(currentUser?.email)
  );

  const handleStart = () => {
    if (isGenerating) return;
    triggerHaptic(HAPTIC_PATTERNS.medium);
    onStartTest({
      subject,
      customTopic,
      durationMinutes: selectedDuration,
      questionCount: selectedQuestions,
      difficulty,
      mode: 'instant',
      instantFeedback,
    });
  };

  return (
    <section className="animate-ios-spring flex-1 flex flex-col gap-4 py-2">
      <div className="flex items-center justify-end">
        {isProUser ? (
          <span className="text-[10px] font-bold tracking-wide text-white bg-[#1E5AFF] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            {usageInfo?.isAdmin || isAdminEmail(currentUser?.email) ? 'Admin (Unlimited)' : 'Unlimited — Pro Access'}
          </span>
        ) : usageInfo ? (
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
            usageInfo.currentUsage >= 2 
              ? 'bg-rose-100  text-rose-800  border border-rose-300 ' 
              : 'bg-slate-100  text-slate-700 '
          }`}>
            <Gauge className="w-3.5 h-3.5 text-[#1E5AFF]" />
            {usageInfo.currentUsage} / 2 Free MCQs Used This Month
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <h2 className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 ">
          Configure Your Practice Test
        </h2>
        <p className="text-slate-600  text-xs sm:text-sm">
          Subject: <strong className="text-slate-900 ">{subject}</strong>
          {customTopic && <span className="text-[#1E5AFF]"> ({customTopic})</span>}
        </p>
      </div>

      {!isProUser && usageInfo && usageInfo.currentUsage >= 2 && (
        <div className="rounded-2xl p-4 flex flex-col gap-2 border bg-rose-50  border-rose-200  text-rose-900  shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700 ">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>Monthly Free Test Limit Reached (2/2)</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            You've used your 2 free tests this month — upgrade to continue taking unlimited practice tests. Limit resets on <strong className="underline">{usageInfo.resetDate}</strong>.
          </p>
        </div>
      )}

      {/* Preset Test Duration Cards */}
      <div className="bg-white/75  backdrop-blur-md border border-slate-200/80  rounded-2xl divide-y divide-slate-100  overflow-hidden shadow-sm transition-colors duration-200">
        {[
          { mins: 5, count: 5, label: 'Quick Warmup', tag: '5 Mins' },
          { mins: 10, count: 10, label: 'Quick Practice', tag: '10 Mins' },
          { mins: 15, count: 15, label: 'Standard Practice', tag: '15 Mins' },
          { mins: 20, count: 20, label: 'Chapter Test', tag: '20 Mins' },
        ].map((item) => {
          const isSelected = selectedQuestions === item.count;
          return (
            <div
              key={item.mins}
              onClick={() => {
                setSelectedDuration(item.mins);
                setSelectedQuestions(item.count);
              }}
              className={`p-4 flex items-center justify-between transition-all cursor-pointer ${
                isSelected ? 'bg-[#1E5AFF]/[0.08] ' : 'hover:bg-slate-50 '
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  isSelected
                    ? 'bg-slate-900 text-[#1E5AFF]  '
                    : 'bg-slate-100 text-slate-700  '
                }`}>
                  {item.tag}
                </span>
                <span className="font-['Space_Grotesk'] text-sm font-bold text-slate-900 ">
                  {item.label} &middot; {item.count} Questions
                </span>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-[#1E5AFF] text-white flex items-center justify-center font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Question Source */}
      <div className="bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 transition-colors duration-200">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Question Source
        </label>
        <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm">
          <Zap className="w-4 h-4 shrink-0 text-[#1E5AFF]" />
          <span>Verified Question Bank</span>
          <span className="ml-auto text-[10px] bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
            Curated & Verified
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white  border border-slate-200/80  rounded-2xl p-3.5 shadow-sm space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            className="w-full bg-slate-50  border border-slate-200  rounded-xl px-3 py-2 text-xs text-slate-900  font-bold focus:outline-none focus:border-[#1E5AFF]"
          >
            <option value="Exam Standard" className="bg-white  text-slate-900 ">Exam Standard</option>
            <option value="Easy" className="bg-white  text-slate-900 ">Easy / Revision</option>
            <option value="Medium" className="bg-white  text-slate-900 ">Medium / Practice</option>
            <option value="Hard" className="bg-white  text-slate-900 ">Hard / Advanced</option>
          </select>
        </div>

        <div className="bg-white  border border-slate-200/80  rounded-2xl p-3.5 shadow-sm space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Feedback Mode
          </label>
          <button
            type="button"
            onClick={() => setInstantFeedback(!instantFeedback)}
            className="w-full bg-slate-50  border border-slate-200  rounded-xl px-3 py-2 text-xs text-slate-900  flex items-center justify-between font-bold cursor-pointer"
          >
            <span>{instantFeedback ? 'Instant Explanation' : 'Exam Timer Only'}</span>
            <span className={`w-2.5 h-2.5 rounded-full ${instantFeedback ? 'bg-emerald-500' : 'bg-[#1E5AFF]'}`} />
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 space-y-3">
        {isTestLimitReached && !isProUser && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center text-xs font-bold text-amber-700 ">
            2/2 free MCQs used this month. Contact admin to upgrade your plan to Pro for unlimited tests.
          </div>
        )}
        <button
          onClick={handleStart}
          disabled={isGenerating || (isTestLimitReached && !isProUser)}
          className={isTestLimitReached && !isProUser
            ? "w-full bg-slate-300  text-slate-500  font-extrabold py-4 px-6 rounded-full cursor-not-allowed opacity-80 flex items-center justify-center gap-2 text-base border border-slate-300 "
            : "w-full bg-slate-900 hover:bg-slate-800   text-white  font-extrabold py-4 px-6 rounded-full transition-all active:scale-98 shadow-md flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
          }
        >
          {isGenerating ? (
            <>
              <BrandedLoadingSpinner size="xs" />
              <span>Generating Test Questions...</span>
            </>
          ) : isTestLimitReached && !isProUser ? (
            <span>2/2 free MCQs used this month</span>
          ) : (
            <>
              <span>Start Practice Test</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600  hover:text-slate-900  transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </section>
  );
};
