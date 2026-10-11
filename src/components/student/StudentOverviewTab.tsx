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
import { getTimeUntilKarachiMidnight, getPlanConfig, PlanType } from '../../data/planLimits';
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

  // Plan allowances & daily usage calculated directly from active Firestore user doc
  const userPlan: PlanType = (profile?.plan as PlanType) || 'free';
  const planConfig = getPlanConfig(userPlan);
  const countdown = getTimeUntilKarachiMidnight();

  const testsLimit = typeof (profile as any)?.testsLimit === 'number'
    ? (profile as any).testsLimit
    : planConfig.testsPerDay;
  const boardyLimit = typeof (profile as any)?.boardyLimit === 'number'
    ? (profile as any).boardyLimit
    : planConfig.boardyPerDay;

  const testsUsed = typeof profile?.testsUsedToday === 'number' ? profile.testsUsedToday : 0;
  const boardyUsed = typeof profile?.boardyQuestionsUsedToday === 'number' ? profile.boardyQuestionsUsedToday : 0;
  const isUnlimited = isAdmin || testsLimit >= 999;
  const isBoardyUnlimited = isAdmin || boardyLimit >= 999;
  const testsLeft = isUnlimited ? 'Unlimited' : Math.min(testsLimit, Math.max(0, testsLimit - testsUsed));
  const boardyLeft = isBoardyUnlimited ? 'Unlimited' : Math.min(boardyLimit, Math.max(0, boardyLimit - boardyUsed));

  // Real streak directly from Firestore user doc
  const streak = typeof profile?.streak === 'number'
    ? profile.streak
    : (typeof profile?.streakDays === 'number' ? profile.streakDays : 0);

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

  // Use actual Firestore user testHistory array (or loaded attempts)
  const testHistoryList: StoredTestAttempt[] = useMemo(() => {
    if (Array.isArray(profile?.testHistory) && profile.testHistory.length > 0) {
      return profile.testHistory;
    }
    return attempts || [];
  }, [profile?.testHistory, attempts]);

  const hasTestHistory = testHistoryList.length > 0;

  // Real Score Accuracy Trend from actual testHistory (oldest to newest)
  const trendData = useMemo(() => {
    if (!hasTestHistory) return [];
    return [...testHistoryList]
      .reverse()
      .slice(-7)
      .map((a, idx) => ({
        label: `Test ${idx + 1}`,
        value: Math.round(a.percentage || 0),
      }));
  }, [hasTestHistory, testHistoryList]);

  // Real Target Weak Areas computed dynamically from user's test history
  const calculatedWeakAreas = useMemo(() => {
    if (!hasTestHistory) return [];

    const statsMap: Record<string, { correct: number; total: number }> = {};

    testHistoryList.forEach((att) => {
      if (att.topicBreakdown && Object.keys(att.topicBreakdown).length > 0) {
        Object.entries(att.topicBreakdown).forEach(([topic, stats]) => {
          if (!statsMap[topic]) {
            statsMap[topic] = { correct: 0, total: 0 };
          }
          statsMap[topic].correct += stats.correct;
          statsMap[topic].total += stats.total;
        });
      } else if (att.subject) {
        const sub = att.subject;
        if (!statsMap[sub]) {
          statsMap[sub] = { correct: 0, total: 0 };
        }
        statsMap[sub].correct += att.correctCount || 0;
        statsMap[sub].total += att.totalQuestions || 0;
      }
    });

    const results = Object.entries(statsMap)
      .filter(([_, stats]) => stats.total > 0)
      .map(([subject, stats]) => {
        const acc = Math.round((stats.correct / stats.total) * 100);
        const priority = acc < 50 ? 'High' : acc < 70 ? 'Medium' : 'Low';
        return {
          subject,
          accuracy: `${acc}%`,
          accuracyNum: acc,
          priority,
        };
      })
      .sort((a, b) => a.accuracyNum - b.accuracyNum)
      .slice(0, 4);

    return results;
  }, [hasTestHistory, testHistoryList]);

  // Dynamic sprint recommendation: use identified weak area or target weak subject
  const sprintSubject = useMemo(() => {
    if (calculatedWeakAreas.length > 0) {
      return calculatedWeakAreas[0].subject;
    }
    if (profile?.weakSubjects?.[0] && profile.weakSubjects[0] !== 'Not sure, help me find out') {
      return profile.weakSubjects[0];
    }
    return 'Advance Maths';
  }, [calculatedWeakAreas, profile?.weakSubjects]);

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
          {/* Real streak counter from Firestore */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-800">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span>{streak} Day Streak</span>
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

      {/* Today's Allowance Rings & Midnight Countdown - Real Database Values */}
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
              {planConfig.name} Plan ({testsUsed} used today)
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
            <p className="text-[11px] text-slate-500 mt-0.5">
              {boardyLimit} daily ({boardyUsed} used today)
            </p>
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

      {/* Analytics Trend & Weak Topics - Driven by Real Firestore testHistory or Clean Empty State */}
      {!hasTestHistory ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Take your first test to see your analytics
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Your score accuracy trends, chapter masteries, and target weak areas will be calculated automatically once you complete your first practice test or timed sprint.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToPractice}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Start Practice Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score Trend Chart */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Score Accuracy Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Progression across your recent {trendData.length} test attempt{trendData.length > 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="indigo">Live Analytics</Badge>
            </div>
            <SparkLineTrendChart data={trendData} color="#4F46E5" height={190} />
          </div>

          {/* Weak Topics to Drill */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Target Weak Areas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chapters and subjects where extra practice yields maximum aggregate gain
              </p>

              <div className="mt-4 space-y-2.5">
                {calculatedWeakAreas.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium text-center">
                    Great job! All your tested subjects are performing at 75%+ accuracy. Keep drilling to maintain peak confidence.
                  </div>
                ) : (
                  calculatedWeakAreas.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">
                          {topic.subject}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Accuracy: {topic.accuracy} · Priority: {topic.priority}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartSprint(topic.subject)}
                        className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Drill
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review CTA Card (for students with at least 1 attempt) */}
      {hasTestHistory && onWriteReview && (
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
                You've completed {testHistoryList.length} test{testHistoryList.length > 1 ? 's' : ''}! Write a review to help fellow aspirants.
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
