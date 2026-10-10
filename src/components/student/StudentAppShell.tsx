import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Clock,
  Sparkles,
  MoreHorizontal,
  User,
  Zap,
  Swords,
  Layers,
  FileText,
  Calculator,
  Compass,
  BarChart2,
  PieChart,
  LogOut,
  X,
  ExternalLink,
  Flame,
  Coins,
  Bell,
} from 'lucide-react';
import { BrandLogo } from '../marketing/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { StoredTestAttempt, getTestAttempts, logTestAttempt } from '../../lib/firebase';
import { StudentOverviewTab } from './StudentOverviewTab';
import { StudentPracticeTab } from './StudentPracticeTab';
import { StudentHistoryTab } from './StudentHistoryTab';
import { StudentBoardyChatTab } from './StudentBoardyChatTab';
import { StudentTestRunner } from './StudentTestRunner';
import { StudentTestResult } from './StudentTestResult';
import { StudentUsageModal } from './StudentUsageModal';
import { MeritMeterModal } from './MeritMeterModal';
import { UserAvatar } from '../UserAvatar';
import { getEntranceExamQuestions } from '../../data/entranceExamQuestions';
import { University, UNIVERSITIES } from '../../data/universities';
import { Question } from '../../types';
import { PLAN_LIMITS } from '../../data/planLimits';

type StudentTab = 'overview' | 'practice' | 'history' | 'boardy';

interface StudentAppShellProps {
  onNavigateMarketing: (path: string) => void;
  onOpenMeritMeter: () => void;
  onOpenBlitz: () => void;
  onOpenArena: () => void;
}

export const StudentAppShell: React.FC<StudentAppShellProps> = ({
  onNavigateMarketing,
  onOpenMeritMeter,
  onOpenBlitz,
  onOpenArena,
}) => {
  const { user, profile, logOut, updateProfileData } = useAuth();

  const [activeTab, setActiveTab] = useState<StudentTab>('overview');
  const [showMoreSheet, setShowMoreSheet] = useState<boolean>(false);
  const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
  const [showMeritMeterModal, setShowMeritMeterModal] = useState<boolean>(false);
  const [boardyPrompt, setBoardyPrompt] = useState<string>('');

  // Test Runner State
  const [activeTest, setActiveTest] = useState<{
    title: string;
    questions: Question[];
    durationMinutes: number;
    negativeMarkingPercent: number;
    universityId?: string;
    subject?: string;
  } | null>(null);

  // Test Result State
  const [completedResult, setCompletedResult] = useState<{
    title: string;
    questions: Question[];
    userAnswers: (number | null)[];
    timeSpentSeconds: number;
    negativeMarkingPercent: number;
  } | null>(null);

  // Test Attempts History
  const [attempts, setAttempts] = useState<StoredTestAttempt[]>([]);

  // Load test attempts
  useEffect(() => {
    if (user?.uid) {
      getTestAttempts(user.uid).then((data) => {
        if (data && data.length > 0) {
          setAttempts(data);
        }
      });
    }
  }, [user]);

  // Start a Timed Sprint in subject
  const handleStartSprint = (subject: string) => {
    const rawQuestions = getEntranceExamQuestions('fast', subject, 30);
    // Ensure we have 30 questions
    const finalQuestions = rawQuestions.slice(0, 30);

    setActiveTest({
      title: `Timed Sprint · ${subject}`,
      questions: finalQuestions,
      durationMinutes: 10,
      negativeMarkingPercent: 0,
      subject,
    });
    setCompletedResult(null);
  };

  // Start University Mock
  const handleStartUniversityPaper = (uni: University) => {
    const rawQuestions = getEntranceExamQuestions(uni.id, 'Advance Maths', 40);
    const negPercent = uni.id === 'fast' || uni.id === 'giki' || uni.id === 'iba' ? 0.25 : 0;

    setActiveTest({
      title: `${uni.shortName} Full Entrance Mock Paper`,
      questions: rawQuestions,
      durationMinutes: 45,
      negativeMarkingPercent: negPercent,
      universityId: uni.id,
    });
    setCompletedResult(null);
  };

  // Complete Test & Save to Firestore
  const handleCompleteTest = async (results: {
    title: string;
    questions: Question[];
    userAnswers: (number | null)[];
    flagged: boolean[];
    timeSpentSeconds: number;
    negativeMarkingPercent: number;
  }) => {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    results.questions.forEach((q, i) => {
      const a = results.userAnswers[i];
      if (a === null) unattempted++;
      else if (a === q.correct) correct++;
      else wrong++;
    });

    const rawScore = correct - wrong * results.negativeMarkingPercent;
    const finalScore = Math.max(0, Math.round(rawScore * 10) / 10);
    const percentage = Math.round((finalScore / results.questions.length) * 100);

    const newAttempt: StoredTestAttempt = {
      userId: user?.uid || 'guest',
      title: results.title,
      testType: results.title.includes('Sprint') ? 'sprint' : 'university_paper',
      universityId: activeTest?.universityId,
      subject: activeTest?.subject,
      score: finalScore,
      totalQuestions: results.questions.length,
      correctCount: correct,
      wrongCount: wrong,
      unattemptedCount: unattempted,
      percentage,
      timeSpentSeconds: results.timeSpentSeconds,
      createdAt: new Date().toISOString(),
    };

    setAttempts((prev) => [newAttempt, ...prev]);

    // Save to Firestore
    if (user?.uid) {
      logTestAttempt(newAttempt).catch(console.warn);
      // Increment testsUsedToday
      const currentUsed = profile?.testsUsedToday || 0;
      updateProfileData({ testsUsedToday: currentUsed + 1 }).catch(console.warn);
    }

    setCompletedResult({
      title: results.title,
      questions: results.questions,
      userAnswers: results.userAnswers,
      timeSpentSeconds: results.timeSpentSeconds,
      negativeMarkingPercent: results.negativeMarkingPercent,
    });
    setActiveTest(null);
  };

  const handleAskBoardyAboutQuestion = (q: Question, studentAnsIndex: number | null) => {
    const studentChoice =
      studentAnsIndex !== null ? `Option ${String.fromCharCode(65 + studentAnsIndex)}: "${q.options[studentAnsIndex]}"` : 'unattempted';
    const prompt = `Please explain this question step-by-step:\n\n**Question**: ${q.q || q.question}\n\n**Options**:\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\n\nI answered ${studentChoice}. The correct answer is Option ${String.fromCharCode(65 + q.correct)}. Where did my logic go wrong?`;

    setBoardyPrompt(prompt);
    setActiveTab('boardy');
    setCompletedResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Content View (if test is active, show test runner) */}
      {activeTest ? (
        <StudentTestRunner
          title={activeTest.title}
          questions={activeTest.questions}
          durationMinutes={activeTest.durationMinutes}
          negativeMarkingPercent={activeTest.negativeMarkingPercent}
          onComplete={handleCompleteTest}
          onExit={() => setActiveTest(null)}
        />
      ) : completedResult ? (
        <StudentTestResult
          title={completedResult.title}
          questions={completedResult.questions}
          userAnswers={completedResult.userAnswers}
          timeSpentSeconds={completedResult.timeSpentSeconds}
          negativeMarkingPercent={completedResult.negativeMarkingPercent}
          onRetake={() => {
            const rawQuestions = getEntranceExamQuestions('fast', 'Advance Maths', 30);
            setActiveTest({
              title: completedResult.title,
              questions: rawQuestions,
              durationMinutes: 10,
              negativeMarkingPercent: completedResult.negativeMarkingPercent,
            });
            setCompletedResult(null);
          }}
          onGoHome={() => {
            setCompletedResult(null);
            setActiveTab('overview');
          }}
          onAskBoardyAboutQuestion={handleAskBoardyAboutQuestion}
        />
      ) : (
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 flex-1">
          {/* Student App Top Header Bar */}
          <header className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/70">
            {/* Logo Left */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="cursor-pointer focus:outline-none"
                aria-label="Boardly Home"
              >
                <BrandLogo size="sm" />
              </button>
            </div>

            {/* Counters, Bell & Profile Right */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Streak Counter */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black shadow-xs cursor-default"
                title={`${profile?.streakDays || 1} day study streak`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{profile?.streakDays || 1}d</span>
              </div>

              {/* Coin / Points Counter */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-black shadow-xs cursor-default"
                title="Boardly prep points"
              >
                <Coins className="w-3.5 h-3.5 text-indigo-600" />
                <span>{profile?.points || 120}</span>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setShowUsageModal(true)}
                className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Notifications and usage"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              </button>

              {/* Profile Avatar / Initials */}
              <button
                type="button"
                onClick={() => setShowMoreSheet(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-xs hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
                aria-label="Open student profile and more options"
              >
                {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
              </button>
            </div>
          </header>

          {activeTab === 'overview' && (
            <StudentOverviewTab
              attempts={attempts}
              onStartSprint={handleStartSprint}
              onGoToPractice={() => setActiveTab('practice')}
              onReviewAttempt={(att) => {
                // Generate review questions
                const qReview = getEntranceExamQuestions('fast', att.subject || 'Advance Maths', att.totalQuestions || 30);
                const dummyAns = Array(qReview.length).fill(null).map((_, i) => (i % 2 === 0 ? qReview[i].correct : 0));
                setCompletedResult({
                  title: att.title,
                  questions: qReview,
                  userAnswers: dummyAns,
                  timeSpentSeconds: att.timeSpentSeconds || 600,
                  negativeMarkingPercent: 0,
                });
              }}
            />
          )}

          {activeTab === 'practice' && (
            <StudentPracticeTab
              onStartSprint={handleStartSprint}
              onStartUniversityPaper={handleStartUniversityPaper}
              onOpenUsage={() => setShowUsageModal(true)}
              onUpgrade={() => onNavigateMarketing('/pricing')}
            />
          )}

          {activeTab === 'history' && (
            <StudentHistoryTab
              attempts={attempts}
              onStartNewTest={() => setActiveTab('practice')}
              onReviewAttempt={(att) => {
                const qReview = getEntranceExamQuestions('fast', att.subject || 'Advance Maths', att.totalQuestions || 30);
                const dummyAns = Array(qReview.length).fill(null).map((_, i) => (i % 2 === 0 ? qReview[i].correct : 0));
                setCompletedResult({
                  title: att.title,
                  questions: qReview,
                  userAnswers: dummyAns,
                  timeSpentSeconds: att.timeSpentSeconds || 600,
                  negativeMarkingPercent: 0,
                });
              }}
            />
          )}

          {activeTab === 'boardy' && (
            <StudentBoardyChatTab
              initialPrompt={boardyPrompt}
              onOpenUsage={() => setShowUsageModal(true)}
              onUpgrade={() => onNavigateMarketing('/pricing')}
            />
          )}
        </div>
      )}

      {/* Glass Bottom Tab Bar (hidden when taking active test) */}
      {!activeTest && !completedResult && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-slate-200/80 px-2 py-1 shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-5 items-center">
            {/* Overview Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="relative py-2 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              {activeTab === 'overview' && (
                <span className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full" />
              )}
              <Home
                className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                  activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                Overview
              </span>
            </button>

            {/* Practice Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className="relative py-2 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              {activeTab === 'practice' && (
                <span className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full" />
              )}
              <BookOpen
                className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                  activeTab === 'practice' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'practice' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                Practice
              </span>
            </button>

            {/* History Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="relative py-2 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              {activeTab === 'history' && (
                <span className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full" />
              )}
              <Clock
                className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                  activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'history' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                Test History
              </span>
            </button>

            {/* Boardy AI Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('boardy')}
              className="relative py-2 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              {activeTab === 'boardy' && (
                <span className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full" />
              )}
              <Sparkles
                className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                  activeTab === 'boardy' ? 'text-blue-600' : 'text-amber-500'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'boardy' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                Boardy AI
              </span>
            </button>

            {/* More Sheet Tab */}
            <button
              type="button"
              onClick={() => setShowMoreSheet(true)}
              className="relative py-2 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              <MoreHorizontal className="w-5 h-5 text-slate-400 group-hover:scale-105" />
              <span className="text-[10px] font-bold text-slate-500">More</span>
            </button>
          </div>
        </nav>
      )}

      {/* "More" Glass Bottom Sheet */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowMoreSheet(false)}
          />

          <div className="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-2xl rounded-t-3xl p-6 space-y-6 z-10 animate-slideUp max-h-[85vh] overflow-y-auto">
            {/* User Profile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                  {profile?.name?.[0] || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      {profile?.name || 'Student'}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {profile?.plan ? PLAN_LIMITS[profile.plan]?.name : 'Starter'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 break-all">{profile?.email || user?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of 8 Icon Tiles */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              {/* 1. Sessions (Blitz / Arena) */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  onOpenBlitz();
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Sessions</span>
              </button>

              {/* 2. Topic Mastery */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setActiveTab('practice');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Topic Mastery</span>
              </button>

              {/* 3. Formula Sheets */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  onNavigateMarketing('/features');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Formula Sheets</span>
              </button>

              {/* 4. Past Papers (Beta tag) */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setActiveTab('practice');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group relative"
              >
                <span className="absolute -top-1.5 right-1 bg-amber-400 text-amber-950 font-black text-[8px] px-1.5 py-0.2 rounded-full shadow-xs">
                  BETA
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Past Papers</span>
              </button>

              {/* 5. Progress */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setActiveTab('history');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Progress</span>
              </button>

              {/* 6. Usage */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowUsageModal(true);
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Usage</span>
              </button>

              {/* 7. Study Plan (Beta tag) */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  onNavigateMarketing('/features');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group relative"
              >
                <span className="absolute -top-1.5 right-1 bg-amber-400 text-amber-950 font-black text-[8px] px-1.5 py-0.2 rounded-full shadow-xs">
                  BETA
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Study Plan</span>
              </button>

              {/* 8. Merit Meter */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowMeritMeterModal(true);
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] text-slate-800 leading-tight">Merit Meter</span>
              </button>
            </div>

            {/* Bottom Actions: Log out */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  onNavigateMarketing('/pricing');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Upgrade to Steady Climb &rarr;
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowMoreSheet(false);
                  await logOut();
                  onNavigateMarketing('/');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      <StudentUsageModal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        onStartTest={() => setActiveTab('practice')}
        onAskBoardy={() => setActiveTab('boardy')}
        onViewPlans={() => onNavigateMarketing('/pricing')}
      />

      {/* Merit Meter Modal */}
      <MeritMeterModal
        isOpen={showMeritMeterModal}
        onClose={() => setShowMeritMeterModal(false)}
      />
    </div>
  );
};
