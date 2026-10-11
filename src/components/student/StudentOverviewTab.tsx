import React, { useMemo } from 'react';
import {
  ArrowRight,
  Zap,
  GraduationCap,
  TrendingUp,
  Flame,
  AlertCircle,
  Clock,
  ChevronRight,
  Calendar,
  Sparkles,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoredTestAttempt } from '../../lib/firebase';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { UNIVERSITIES } from '../../data/universities';
import { getTimeUntilKarachiMidnight, getPlanConfig } from '../../data/planLimits';
import { SparkLineTrendChart } from '../ui/Charts';
import { Badge } from '../ui/Badge';

interface StudentOverviewTabProps {
  onStartSprint: (subject: string) => void;
  onGoToPractice: () => void;
  onGoToEvents?: () => void;
  onWriteReview?: () => void;
  onReviewAttempt?: (attempt: StoredTestAttempt) => void;
  attempts: StoredTestAttempt[];
}

export const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({
  onStartSprint,
  onGoToPractice,
  onGoToEvents,
  onWriteReview,
  onReviewAttempt,
  attempts,
}) => {
  const { profile, isAdmin } = useAuth();

  const firstName = profile?.name?.trim().split(' ')[0] || 'Student';
  const targetUniId = profile?.targetUniversityId || 'nust';
  const targetUni = UNIVERSITIES.find((u) => u.id === targetUniId) || UNIVERSITIES[0];
  const daysLeft = profile?.targetExamDaysLeft || 21;

  const planConfig = getPlanConfig(profile?.plan);
  const countdown = getTimeUntilKarachiMidnight();

  const testsUsed = profile?.testsUsedToday || 0;
  const boardyUsed = profile?.boardyQuestionsUsedToday || 0;
  const isUnlimited = isAdmin || planConfig.testsPerDay >= 999;
  const testsLeft = isUnlimited ? 'Unlimited' : Math.max(0, planConfig.testsPerDay - testsUsed);
  const boardyLeft = Math.max(0, planConfig.boardyPerDay - boardyUsed);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const sprintSubject = profile?.weakSubjects?.[0] && profile.weakSubjects[0] !== 'Not sure, help me find out'
    ? profile.weakSubjects[0]
    : 'Advance Maths';

  const hasTests = attempts && attempts.length > 0;
  const recentAttempts = attempts.slice(0, 3);

  const trendData = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return [
        { label: 'T1', value: 65 },
        { label: 'T2', value: 72 },
        { label: 'T3', value: 78 },
        { label: 'T4', value: 85 },
      ];
    }
    return attempts
      .slice(0, 7)
      .reverse()
      .map((a, idx) => ({
        label: `Test ${idx + 1}`,
        value: a.percentage || 0,
      }));
  }, [attempts]);

  return (
    <div className="space-y-6 pb-20">
      {/* Date & Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {todayFormatted}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {daysLeft} days until your {targetUni.shortName} entrance test. Stay consistent!
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-800">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>3 Day Streak</span>
          </div>
          <UniversityLogoBadge university={targetUni} size="sm" />
        </div>
      </div>

      {/* Hero Card: Start Here Sprint */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/15">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Recommended Drill</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Timed sprint in {sprintSubject}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-lg">
              30 rapid questions in 10 minutes to benchmark speed and formula accuracy for {targetUni.shortName}.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onStartSprint(sprintSubject)}
                className="py-3 px-6 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 group"
              >
                <span>Start Sprint Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                type="button"
                onClick={onGoToPractice}
                className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                All Subjects
              </button>
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <UniversityLogoBadge university={targetUni} size="lg" />
            <span className="font-extrabold text-sm text-white mt-2">{targetUni.shortName}</span>
            <span className="text-[11px] text-indigo-200">{targetUni.testName || 'Entrance Exam'}</span>
          </div>
        </div>
      </div>

      {/* Today's Allowance Rings & Midnight Countdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tests Left */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tests Left Today
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {testsLeft}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {planConfig.name} Plan Allowance
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Boardy Chats Left */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Boardy AI Left
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {boardyLeft}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Questions remaining</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Countdown */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Refill Countdown
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {countdown.formattedCountdown}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Resets midnight PKT</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Trend & Weak Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Trend Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Score Accuracy Trend
              </h3>
              <p className="text-xs text-slate-400">Progression across recent test attempts</p>
            </div>
            <Badge variant="indigo">Analytics</Badge>
          </div>
          <SparkLineTrendChart data={trendData} color="#4F46E5" height={190} />
        </div>

        {/* Weak Topics to Drill */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Target Weak Areas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chapters where extra practice yields maximum aggregate gain</p>

            <div className="mt-4 space-y-2.5">
              {[
                { subject: 'Integration & Derivatives', accuracy: '54%', priority: 'High' },
                { subject: 'Rotational Motion & Torque', accuracy: '61%', priority: 'Medium' },
                { subject: 'Aldehydes & Ketones', accuracy: '66%', priority: 'Medium' },
              ].map((topic, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-800">
                      {topic.subject}
                    </p>
                    <p className="text-[11px] text-slate-400">Accuracy: {topic.accuracy}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartSprint(topic.subject)}
                    className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Drill
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review CTA Card (for students with at least 1 attempt) */}
      {hasTests && onWriteReview && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent border border-violet-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">
                Share your Boardly study experience
              </h4>
              <p className="text-xs text-slate-500">
                You've completed {attempts.length} test{attempts.length > 1 ? 's' : ''}! Write a review to help fellow aspirants.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onWriteReview}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Write a Review
          </button>
        </div>
      )}
    </div>
  );
};
