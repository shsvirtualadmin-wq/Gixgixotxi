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
  Shield,
  Star,
  Award,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoredTestAttempt, getTestAttempts, logTestAttempt, UserRole } from '../../lib/firebase';
import { StudentOverviewTab } from './StudentOverviewTab';
import { StudentPracticeTab } from './StudentPracticeTab';
import { StudentHistoryTab } from './StudentHistoryTab';
import { StudentBoardyChatTab } from './StudentBoardyChatTab';
import { StudentEventsTab } from './StudentEventsTab';
import { StudentTestRunner } from './StudentTestRunner';
import { StudentTestResult } from './StudentTestResult';
import { StudentUsageModal } from './StudentUsageModal';
import { MeritMeterModal } from './MeritMeterModal';
import { BottomSheet } from '../ui/Drawer';
import { Modal } from '../ui/Modal';
import { AppShell } from '../ui/AppShell';
import { getEntranceExamQuestions } from '../../data/entranceExamQuestions';
import { University, UNIVERSITIES } from '../../data/universities';
import { Question } from '../../types';
import { getPlanConfig } from '../../data/planLimits';
import { EventSession } from '../../data/eventsStore';

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
  const { user, profile, isAdmin, logOut, updateProfileData, activeRole, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showMoreSheet, setShowMoreSheet] = useState<boolean>(false);
  const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
  const [showMeritMeterModal, setShowMeritMeterModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [boardyPrompt, setBoardyPrompt] = useState<string>('');

  // Review Form State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Upgrade Request State
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<'pro' | 'premium'>('pro');
  const [upgradeMonths, setUpgradeMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'jazzcash' | 'easypaisa'>('jazzcash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [upgradeSubmitted, setUpgradeSubmitted] = useState<boolean>(false);

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

  useEffect(() => {
    if (user?.uid) {
      getTestAttempts(user.uid).then((data) => {
        if (data && data.length > 0) {
          setAttempts(data);
        }
      });
    }
  }, [user]);

  const handleStartSprint = (subject: string) => {
    const rawQuestions = getEntranceExamQuestions('fast', subject, 30);
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

  const handleStartEventTest = (session: EventSession) => {
    const rawQuestions = getEntranceExamQuestions('nust', session.subject || 'Advance Maths', session.totalQuestions || 40);
    setActiveTest({
      title: session.title,
      questions: rawQuestions,
      durationMinutes: session.durationMinutes || 40,
      negativeMarkingPercent: session.type === 'arena' ? 0.25 : 0,
    });
    setCompletedResult(null);
  };

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

    if (user?.uid) {
      logTestAttempt(newAttempt).catch(console.warn);
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
      studentAnsIndex !== null
        ? `Option ${String.fromCharCode(65 + studentAnsIndex)}: "${q.options[studentAnsIndex]}"`
        : 'unattempted';
    const prompt = `Please explain this question step-by-step:\n\n**Question**: ${q.q || q.question}\n\n**Options**:\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\n\nI answered ${studentChoice}. The correct answer is Option ${String.fromCharCode(65 + q.correct)}. Where did my logic go wrong?`;

    setBoardyPrompt(prompt);
    setActiveTab('boardy');
    setCompletedResult(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewText.length < 10) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await addDoc(collection(db, 'reviews'), {
        uid: user?.uid || 'guest',
        name: profile?.name || 'Student',
        nameDisplayChoice: 'first_initial',
        rating: reviewRating,
        text: reviewText.trim(),
        exam: profile?.testTrack || 'FSC / Entry Test',
        status: 'pending',
        isVerifiedStudent: true,
        createdAt: new Date().toISOString(),
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSubmitted(false);
        setReviewText('');
      }, 2500);
    } catch (err) {
      console.warn('[Review submit notice]:', err);
      setShowReviewModal(false);
    }
  };

  const handleSubmitUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      const amount = upgradeTargetPlan === 'pro' ? 2499 * upgradeMonths : 3999 * upgradeMonths;
      await addDoc(collection(db, 'paymentRequests'), {
        userId: user?.uid || 'guest',
        userEmail: user?.email || '',
        userName: profile?.name || 'Student',
        planId: upgradeTargetPlan,
        durationMonths: upgradeMonths,
        amountPkr: amount,
        paymentMethod,
        transactionId: transactionId.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setUpgradeSubmitted(true);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setUpgradeSubmitted(false);
        setTransactionId('');
      }, 3000);
    } catch (err) {
      console.warn('[Upgrade submit notice]:', err);
      setShowUpgradeModal(false);
    }
  };

  // If a test is actively running, render the dedicated runner
  if (activeTest) {
    return (
      <StudentTestRunner
        title={activeTest.title}
        questions={activeTest.questions}
        durationMinutes={activeTest.durationMinutes}
        negativeMarkingPercent={activeTest.negativeMarkingPercent}
        onComplete={handleCompleteTest}
        onExit={() => setActiveTest(null)}
      />
    );
  }

  // If test is completed, render detailed result screen
  if (completedResult) {
    return (
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
    );
  }

  return (
    <AppShell
      role="student"
      title={
        activeTab === 'overview'
          ? 'Dashboard'
          : activeTab === 'practice'
          ? 'Practice Question Bank'
          : activeTab === 'events'
          ? 'Events & Blitz'
          : activeTab === 'boardy'
          ? 'Boardy AI Tutor'
          : activeTab === 'history'
          ? 'Test History'
          : 'Student Portal'
      }
      subtitle="FSC & University Test Prep Portal"
      activeNav={activeTab}
      onSelectNav={(id) => {
        setActiveTab(id);
        setShowMoreSheet(false);
      }}
      onNavigateUpgrade={() => setShowUpgradeModal(true)}
      onNavigateProfile={() => setShowUsageModal(true)}
      onOpenMoreSheet={() => setShowMoreSheet(true)}
      onLogout={logOut}
    >
      {/* Tab Switcher */}
      {activeTab === 'overview' && (
        <StudentOverviewTab
          attempts={attempts}
          onStartSprint={handleStartSprint}
          onGoToPractice={() => setActiveTab('practice')}
          onGoToEvents={() => setActiveTab('events')}
          onWriteReview={() => setShowReviewModal(true)}
        />
      )}

      {activeTab === 'practice' && (
        <StudentPracticeTab
          onStartSprint={handleStartSprint}
          onStartUniversityPaper={handleStartUniversityPaper}
          onOpenUsage={() => setShowUsageModal(true)}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {activeTab === 'events' && (
        <StudentEventsTab onStartEventTest={handleStartEventTest} />
      )}

      {activeTab === 'boardy' && (
        <StudentBoardyChatTab
          initialPrompt={boardyPrompt}
          onOpenUsage={() => setShowUsageModal(true)}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {activeTab === 'history' && (
        <StudentHistoryTab
          attempts={attempts}
          onStartTest={() => setActiveTab('practice')}
        />
      )}

      {/* More Drawer Sheet (Mobile Navigation) */}
      <BottomSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        title="More Resources & Tools"
      >
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            {
              id: 'history',
              label: 'Test History',
              icon: <Clock className="w-5 h-5 text-indigo-600" />,
              action: () => {
                setActiveTab('history');
                setShowMoreSheet(false);
              },
            },
            {
              id: 'merit',
              label: 'Merit Meter',
              icon: <Calculator className="w-5 h-5 text-violet-600" />,
              action: () => {
                setShowMoreSheet(false);
                setShowMeritMeterModal(true);
              },
            },
            {
              id: 'usage',
              label: 'Daily Usage',
              icon: <Zap className="w-5 h-5 text-amber-600" />,
              action: () => {
                setShowMoreSheet(false);
                setShowUsageModal(true);
              },
            },
            {
              id: 'reviews',
              label: 'Write Review',
              icon: <Star className="w-5 h-5 text-teal-600" />,
              action: () => {
                setShowMoreSheet(false);
                setShowReviewModal(true);
              },
            },
            {
              id: 'upgrade',
              label: 'Upgrade Plan',
              icon: <Sparkles className="w-5 h-5 text-pink-600" />,
              action: () => {
                setShowMoreSheet(false);
                setShowUpgradeModal(true);
              },
            },
            {
              id: 'logout',
              label: 'Log out',
              icon: <LogOut className="w-5 h-5 text-rose-600" />,
              action: () => {
                setShowMoreSheet(false);
                logOut();
              },
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:bg-indigo-50/50 flex flex-col items-center justify-center space-y-2 text-center font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Merit Meter Modal */}
      {showMeritMeterModal && (
        <MeritMeterModal
          isOpen={showMeritMeterModal}
          onClose={() => setShowMeritMeterModal(false)}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <StudentUsageModal
          isOpen={showUsageModal}
          onClose={() => setShowUsageModal(false)}
          onStartTest={() => {
            setShowUsageModal(false);
            setActiveTab('practice');
          }}
          onAskBoardy={() => {
            setShowUsageModal(false);
            setActiveTab('boardy');
          }}
          onViewPlans={() => {
            setShowUsageModal(false);
            setShowUpgradeModal(true);
          }}
        />
      )}

      {/* Write a Review Modal */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Share your Boardly Review"
          subtitle="Your honest feedback helps improve practice tests for all aspirants."
        >
          {reviewSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 fill-emerald-600" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Thank you for your review!
              </h4>
              <p className="text-xs text-slate-500">
                Your review has been submitted for moderation and will appear on the wall shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell other students how Boardly helped your test preparation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewText.length < 10}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade your Boardly Plan"
          subtitle="Unlock extended question banks, university mocks, and prioritized Boardy AI derivations."
        >
          {upgradeSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Payment Request Submitted!
              </h4>
              <p className="text-xs text-slate-500">
                Our team will verify your transaction reference and activate your {upgradeTargetPlan.toUpperCase()} membership within 2 to 4 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitUpgradeRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUpgradeTargetPlan('pro')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      upgradeTargetPlan === 'pro'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 dark:bg-indigo-950/40 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="font-extrabold text-sm">Pro Plan</p>
                    <p className="text-[11px] text-slate-500">PKR 2,499 / mo</p>
                    <p className="text-[10px] text-slate-400 mt-1">10 tests + 7 Boardy chats/day</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpgradeTargetPlan('premium')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      upgradeTargetPlan === 'premium'
                        ? 'border-violet-600 bg-violet-50/60 text-violet-900 dark:bg-violet-950/40 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="font-extrabold text-sm">Premium</p>
                    <p className="text-[11px] text-slate-500">PKR 3,999 / mo</p>
                    <p className="text-[10px] text-slate-400 mt-1">Unlimited tests + 15 Boardy chats/day</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  <option value="jazzcash">JazzCash (Till ID: 0300-1234567)</option>
                  <option value="easypaisa">Easypaisa (Account: 0345-7654321)</option>
                  <option value="bank_transfer">Meezan Bank (IBAN: PK64MEZN000123456789)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TID-9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!transactionId.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Submit Upgrade Request
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </AppShell>
  );
};
