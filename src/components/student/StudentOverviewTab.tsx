import React, { useMemo } from 'react';
import { ArrowRight, Zap, GraduationCap, TrendingUp, Flame, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoredTestAttempt } from '../../lib/firebase';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { UNIVERSITIES } from '../../data/universities';

interface StudentOverviewTabProps {
  onStartSprint: (subject: string) => void;
  onGoToPractice: () => void;
  onReviewAttempt?: (attempt: StoredTestAttempt) => void;
  attempts: StoredTestAttempt[];
}

export const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({
  onStartSprint,
  onGoToPractice,
  onReviewAttempt,
  attempts,
}) => {
  const { profile } = useAuth();

  const firstName = profile?.name?.trim().split(' ')[0] || 'Student';
  const targetUniId = profile?.targetUniversityId || 'fast';
  const targetUni = UNIVERSITIES.find((u) => u.id === targetUniId) || UNIVERSITIES[0];

  const daysLeft = profile?.targetExamDaysLeft || 21;

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

  // Analytics if attempts exist
  const hasTests = attempts && attempts.length > 0;
  const recentAttempts = attempts.slice(0, 3);
  const avgScore = hasTests
    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Date & Greeting Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {todayFormatted}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {hasTests
            ? `Keep your momentum going! Your exam is ${daysLeft} days away.`
            : `Take your first test and you will see where you stand. Your exam is ${daysLeft} days away.`}
        </p>
      </div>

      {/* Hero Card: Start Here */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/15">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-blue-100 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Start here</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Timed sprint in {sprintSubject}
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-lg">
              30 questions in ten minutes, gives you a first score to build on. Tested against verified {targetUni.shortName} past patterns.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onStartSprint(sprintSubject)}
                className="py-3 px-6 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 group"
              >
                <span>Start sprint</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={onGoToPractice}
                className="text-xs font-semibold text-blue-200 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Choose another test
              </button>
            </div>
          </div>

          {/* Answer-sheet bubble preview on right */}
          <div className="hidden md:flex md:col-span-4 justify-end">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 w-44 space-y-2 text-[10px] select-none shadow-inner">
              <div className="text-center font-bold text-blue-100 text-[11px] pb-1 border-b border-white/15">
                OMR Answer Sheet
              </div>
              {[
                { num: '01', chosen: 'B' },
                { num: '02', chosen: 'A' },
                { num: '03', chosen: 'D' },
                { num: '04', chosen: 'C' },
                { num: '05', chosen: 'B' },
              ].map((row) => (
                <div key={row.num} className="flex items-center justify-between text-blue-100 font-mono">
                  <span className="text-[9px] opacity-75">{row.num}</span>
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const isSelected = row.chosen === letter;
                    return (
                      <span
                        key={letter}
                        className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] transition-all ${
                          isSelected
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'border border-white/30 text-white/70'
                        }`}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Side-by-Side Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Timed Sprint */}
        <div
          onClick={() => onStartSprint('Advance Maths')}
          className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-md hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              Timed sprint
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              30 questions in ten minutes, in one subject. Focused speed drill with instant step-by-step solutions.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {/* Row of tiny dots */}
            <div className="flex items-center gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
              Start sprint <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: University Papers */}
        <div
          onClick={onGoToPractice}
          className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-md hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
              University papers
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              All the entry tests, from FAST and NUST to IBA and LUMS. Full simulation with exact question counts & negative marking.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {/* Row of tiny dots */}
            <div className="flex items-center gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-indigo-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              Explore papers <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Target University Highlight Card */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <UniversityLogoBadge university={targetUni} size="lg" />
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Primary Goal
            </span>
            <h3 className="font-extrabold text-slate-900 text-base">{targetUni.fullName}</h3>
            <p className="text-xs text-slate-500">
              Exam in {daysLeft} days · Paced study path active
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToPractice}
          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer shrink-0"
        >
          View mock
        </button>
      </div>

      {/* Stats and Results (when tests exist) */}
      {hasTests ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-lg">Your Performance</h3>
            <span className="text-xs text-slate-500">{attempts.length} tests completed</span>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900">{avgScore}%</div>
              <span className="text-[11px] text-slate-500">Average Score</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-center">
              <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900">3 Days</div>
              <span className="text-[11px] text-slate-500">Current Streak</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-center">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-black text-slate-900">{attempts.length}</div>
              <span className="text-[11px] text-slate-500">Tests Taken</span>
            </div>
          </div>

          {/* Recent attempts list */}
          <div className="bg-white/80 rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 text-xs font-bold text-slate-700">
              Recent Test Results
            </div>
            {recentAttempts.map((att) => (
              <div
                key={att.id || att.createdAt}
                onClick={() => onReviewAttempt?.(att)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{att.title}</h4>
                  <p className="text-xs text-slate-500">
                    {new Date(att.createdAt).toLocaleDateString()} · {att.correctCount} / {att.totalQuestions} correct
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                      att.percentage >= 70
                        ? 'bg-emerald-50 text-emerald-700'
                        : att.percentage >= 50
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {att.percentage}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 text-center space-y-2">
          <p className="text-xs sm:text-sm text-blue-900 font-semibold">
            Ready to measure your baseline?
          </p>
          <p className="text-xs text-blue-700 max-w-md mx-auto">
            Take a 10-minute sprint to populate your score trends, identify weak topics, and receive targeted study recommendations from Boardy.
          </p>
        </div>
      )}
    </div>
  );
};
