import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { StudentProfileView } from '../StudentProfileView';
import { TargetUniversityModal } from '../TargetUniversityModal';
import { PricingModal } from '../pricing/PricingModal';
import { BottomSheet } from '../ui/Drawer';
import { Modal } from '../ui/Modal';
import { AppShell } from '../ui/AppShell';
import { TrustFooter } from '../ui/TrustFooter';
import { MoreBottomSheet } from './MoreBottomSheet';
import { DailyLimitsView } from './DailyLimitsView';
import { MeritMeter } from '../merit/MeritMeter';
import { UniversityExplorer } from '../universities/UniversityExplorer';
import { AdmissionPredictor } from '../predictor/AdmissionPredictor';
import { ComingSoon } from '../common/ComingSoon';
import { getEntranceExamQuestions } from '../../data/entranceExamQuestions';
import { generateUniversityPaperExam, getUniversityPaperConfig } from '../../config/universityPapers';
import { getSeenStemsForStudent, recordQuestionsAsSeen } from '../../lib/seenQuestionsTracker';
import { University, UNIVERSITIES } from '../../data/universities';
import { Question } from '../../types';
import { getPlanConfig } from '../../data/planLimits';
import { EventSession } from '../../data/eventsStore';
import { useUsage } from '../../context/UsageContext';

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
  const { canStartTest, consumeTestStart, loading: usageLoading } = useUsage();

  const prevTabRef = useRef<string>('overview');
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p === '/boardy' || p === '/app/boardy' || p.startsWith('/boardy') || p.startsWith('/app/boardy')) return 'boardy';
      if (p.includes('/profile') || p === '/app/profile') return 'profile';
      if (p.includes('/universities') || p === '/app/universities') return 'universities';
      if (p.includes('/merit-meter') || p === '/app/merit-meter') return 'merit-meter';
      if (p.includes('/predictor') || p === '/app/predictor') return 'predictor';
      if (p.includes('/limits') || p === '/app/limits') return 'limits';
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('tab')) return sp.get('tab')!;
    }
    return 'overview';
  });
  const [showMoreSheet, setShowMoreSheet] = useState<boolean>(false);
  const [isBoardyFocused, setIsBoardyFocused] = useState<boolean>(false);
  const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
  const [showMeritMeterModal, setShowMeritMeterModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeFromBlocked, setUpgradeFromBlocked] = useState<boolean>(false);
  const [showUniModal, setShowUniModal] = useState<boolean>(false);
  const [boardyPrompt, setBoardyPrompt] = useState<string>('');

  const handleSelectTab = useCallback((tabId: string) => {
    if (tabId === 'boardy') {
      prevTabRef.current = activeTab !== 'boardy' ? activeTab : 'overview';
      if (typeof window !== 'undefined') {
        window.history.pushState({ tab: 'boardy', from: prevTabRef.current }, '', '/app/boardy');
      }
      setActiveTab('boardy');
    } else {
      if (activeTab === 'boardy') {
        if (typeof window !== 'undefined') {
          window.history.replaceState({ tab: tabId }, '', '/app');
        }
      }
      prevTabRef.current = tabId;
      setActiveTab(tabId);
    }
  }, [activeTab]);

  const handleBackFromBoardy = useCallback(() => {
    const returnTab = prevTabRef.current || 'overview';
    if (typeof window !== 'undefined') {
      window.history.replaceState({ tab: returnTab }, '', '/app');
    }
    setActiveTab(returnTab);
  }, []);

  // Close sheet on route / popstate change
  useEffect(() => {
    const handlePop = () => {
      setShowMoreSheet(false);
      const p = window.location.pathname.toLowerCase();
      if (p === '/boardy' || p === '/app/boardy' || p.startsWith('/boardy') || p.startsWith('/app/boardy')) {
        setActiveTab('boardy');
      } else if (p.includes('/profile')) {
        setActiveTab('profile');
      } else if (p.includes('/universities')) {
        setActiveTab('universities');
      } else if (p.includes('/merit-meter')) {
        setActiveTab('merit-meter');
      } else if (p.includes('/predictor')) {
        setActiveTab('predictor');
      } else if (p.includes('/limits')) {
        setActiveTab('limits');
      } else {
        setActiveTab(prevTabRef.current || 'overview');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

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
    marksPerQuestion?: number;
    totalMarks?: number;
    universityId?: string;
    subject?: string;
    startTime?: number;
    endTime?: number;
    initialAnswers?: (number | null)[];
    initialFlagged?: boolean[];
    initialIndex?: number;
  } | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('boardly_university_test_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            if (!parsed.endTime || parsed.endTime > Date.now()) {
              return {
                title: parsed.title,
                questions: parsed.questions,
                durationMinutes: parsed.durationMinutes,
                negativeMarkingPercent: parsed.negativeMarkingPercent ?? 0,
                marksPerQuestion: parsed.marksPerQuestion ?? 1,
                totalMarks: parsed.totalMarks,
                universityId: parsed.universityId,
                subject: parsed.subject,
                startTime: parsed.startTime,
                endTime: parsed.endTime,
                initialAnswers: parsed.userAnswers,
                initialFlagged: parsed.flagged,
                initialIndex: parsed.currentIndex || 0,
              };
            } else {
              localStorage.removeItem('boardly_university_test_session');
            }
          }
        }
      } catch (e) {
        console.warn('Error reading stored test session:', e);
      }
    }
    return null;
  });

  // Test Result State
  const [completedResult, setCompletedResult] = useState<{
    title: string;
    questions: Question[];
    userAnswers: (number | null)[];
    timeSpentSeconds: number;
    negativeMarkingPercent: number;
    marksPerQuestion?: number;
    totalMarks?: number;
    universityId?: string;
  } | null>(null);

  // Test Attempts History directly mapped from active Firestore profile testHistory
  const [attempts, setAttempts] = useState<StoredTestAttempt[]>(() => {
    if (Array.isArray(profile?.testHistory) && profile.testHistory.length > 0) {
      return profile.testHistory;
    }
    return [];
  });

  // Copy feedback state for manual payment details
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  useEffect(() => {
    if (Array.isArray(profile?.testHistory) && profile.testHistory.length > 0) {
      setAttempts(profile.testHistory);
    }
  }, [profile?.testHistory]);

  useEffect(() => {
    // If no active test is running, clean up leftover auto-start flags
    if (!activeTest) {
      try {
        localStorage.removeItem('boardly_start_diagnostic_on_load');
        localStorage.removeItem('boardly_active_test_session');
        sessionStorage.removeItem('boardly_auto_start_drill');
        sessionStorage.removeItem('boardly_start_test');
      } catch {}
    }

    if (user?.uid) {
      getTestAttempts(user.uid).then((data) => {
        if (data && data.length > 0) {
          setAttempts((prev) => {
            const map = new Map<string, StoredTestAttempt>();
            data.forEach((item) => {
              if (item.id) map.set(item.id, item);
            });
            prev.forEach((item) => {
              if (item.id && !map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      });
    }
  }, [user]);

  const handleProgressUpdate = (progress: {
    answers: (number | null)[];
    flagged: boolean[];
    currentIndex: number;
  }) => {
    if (!activeTest) return;
    try {
      const sessionObj = {
        title: activeTest.title,
        questions: activeTest.questions,
        durationMinutes: activeTest.durationMinutes,
        negativeMarkingPercent: activeTest.negativeMarkingPercent,
        marksPerQuestion: activeTest.marksPerQuestion,
        totalMarks: activeTest.totalMarks,
        universityId: activeTest.universityId,
        subject: activeTest.subject,
        startTime: activeTest.startTime,
        endTime: activeTest.endTime,
        userAnswers: progress.answers,
        flagged: progress.flagged,
        currentIndex: progress.currentIndex,
        updatedAt: Date.now(),
      };
      localStorage.setItem('boardly_university_test_session', JSON.stringify(sessionObj));
    } catch {}
  };

  const handleStartSprint = async (subject: string) => {
    if (!canStartTest()) {
      setUpgradeFromBlocked(true);
      setShowUpgradeModal(true);
      return;
    }
    const sessionId = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const allowed = await consumeTestStart(sessionId);
    if (!allowed) {
      setUpgradeFromBlocked(true);
      setShowUpgradeModal(true);
      return;
    }

    const uniKey = profile?.targetUniversityId || profile?.targetUniversity || profile?.university || 'nust';
    const rawQuestions = getEntranceExamQuestions(uniKey, subject, 30);
    const finalQuestions = rawQuestions.slice(0, 30);

    setActiveTest({
      title: `Timed Sprint · ${subject}`,
      questions: finalQuestions,
      durationMinutes: 10,
      negativeMarkingPercent: 0,
      subject,
      universityId: uniKey,
    });
    setCompletedResult(null);
  };

  const handleStartUniversityPaper = async (uni: University) => {
    if (!canStartTest()) {
      setUpgradeFromBlocked(true);
      setShowUpgradeModal(true);
      return;
    }
    const sessionId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const allowed = await consumeTestStart(sessionId);
    if (!allowed) {
      setUpgradeFromBlocked(true);
      setShowUpgradeModal(true);
      return;
    }

    const studentSeenStems = getSeenStemsForStudent(user?.uid || profile?.uid);
    const { config: paperConfig, questions } = generateUniversityPaperExam(uni.id, studentSeenStems);

    const startTime = Date.now();
    const durationMinutes = paperConfig.durationMinutes;
    const endTime = startTime + durationMinutes * 60 * 1000;

    const sessionState = {
      title: `${paperConfig.shortName} Full Entrance Mock Paper`,
      questions,
      durationMinutes,
      negativeMarkingPercent: paperConfig.negativeMarkingPercent,
      marksPerQuestion: paperConfig.marksPerQuestion,
      totalMarks: paperConfig.totalMarks,
      universityId: uni.id,
      startTime,
      endTime,
      initialAnswers: Array(questions.length).fill(null),
      initialFlagged: Array(questions.length).fill(false),
      initialIndex: 0,
    };

    try {
      localStorage.setItem(
        'boardly_university_test_session',
        JSON.stringify({
          ...sessionState,
          userAnswers: sessionState.initialAnswers,
          flagged: sessionState.initialFlagged,
          currentIndex: 0,
        })
      );
    } catch (e) {
      console.warn('[LocalStorage] Could not save university test session:', e);
    }

    setActiveTest(sessionState);
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
    marksPerQuestion?: number;
    totalMarks?: number;
  }) => {
    try {
      localStorage.removeItem('boardly_university_test_session');
    } catch {}

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    results.questions.forEach((q, i) => {
      const a = results.userAnswers[i];
      if (a === null) unattempted++;
      else if (a === q.correct) correct++;
      else wrong++;
    });

    const perQuestionMark = results.marksPerQuestion ?? (activeTest?.marksPerQuestion || 1);
    const effectiveTotalMarks = results.totalMarks ?? (activeTest?.totalMarks || (results.questions.length * perQuestionMark));
    const rawScore = (correct * perQuestionMark) - (wrong * results.negativeMarkingPercent * perQuestionMark);
    const finalScore = Math.max(0, Math.round(rawScore * 10) / 10);
    const percentage = Math.round((finalScore / effectiveTotalMarks) * 100);

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

    // Record questions as seen for this student
    if (results.questions.length > 0) {
      recordQuestionsAsSeen(user?.uid || profile?.uid, results.questions, activeTest?.subject || 'University Paper', results.title);
    }

    if (user?.uid) {
      logTestAttempt(newAttempt).catch(console.warn);
      const currentUsed = profile?.testsUsedToday || 0;
      const existingHistory = Array.isArray(profile?.testHistory) ? profile.testHistory : [];
      const updatedHistory = [newAttempt, ...existingHistory];
      const currentStreak = typeof profile?.streak === 'number'
        ? profile.streak
        : (typeof profile?.streakDays === 'number' ? profile.streakDays : 0);
      const newStreak = Math.max(1, currentStreak + 1);
      updateProfileData({
        testHistory: updatedHistory,
        streak: newStreak,
        streakDays: newStreak,
      }).catch(console.warn);
    }

    setCompletedResult({
      title: results.title,
      questions: results.questions,
      userAnswers: results.userAnswers,
      timeSpentSeconds: results.timeSpentSeconds,
      negativeMarkingPercent: results.negativeMarkingPercent,
      marksPerQuestion: perQuestionMark,
      totalMarks: effectiveTotalMarks,
      universityId: activeTest?.universityId,
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

  const handlePricingUpgradeRequest = async (data: {
    plan: 'pro' | 'premium';
    durationMonths: number;
    amount: number;
    paymentMethod: 'bank_transfer' | 'jazzcash' | 'easypaisa';
    transactionId: string;
  }) => {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await addDoc(collection(db, 'paymentRequests'), {
        userId: user?.uid || 'guest',
        userEmail: user?.email || '',
        userName: profile?.name || 'Student',
        planId: data.plan,
        durationMonths: data.durationMonths,
        amountPkr: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Upgrade submit notice]:', err);
      throw err;
    }
  };

  // If a test is actively running, render the dedicated runner
  if (activeTest) {
    // If not unlimited and user reached daily quota without an existing saved session, block test
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem('boardly_university_test_session') : null;
    if (!storedSession && !canStartTest() && !usageLoading) {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0d1b3e]">
            You have used today's free limit. Resets at midnight (PKT)
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            Upgrade to keep practicing with full-length university mocks and unlimited timed drills.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setActiveTest(null);
                setUpgradeFromBlocked(true);
                setShowUpgradeModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => {
                setActiveTest(null);
                setActiveTab('overview');
              }}
              className="px-6 py-3 rounded-2xl bg-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-300 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <StudentTestRunner
        title={activeTest.title}
        questions={activeTest.questions}
        durationMinutes={activeTest.durationMinutes}
        negativeMarkingPercent={activeTest.negativeMarkingPercent}
        marksPerQuestion={activeTest.marksPerQuestion}
        totalMarks={activeTest.totalMarks}
        startTime={activeTest.startTime}
        endTime={activeTest.endTime}
        initialAnswers={activeTest.initialAnswers}
        initialFlagged={activeTest.initialFlagged}
        initialIndex={activeTest.initialIndex}
        onProgressUpdate={handleProgressUpdate}
        onComplete={handleCompleteTest}
        onExit={() => {
          try {
            localStorage.removeItem('boardly_university_test_session');
          } catch {}
          setActiveTest(null);
        }}
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
        marksPerQuestion={completedResult.marksPerQuestion}
        totalMarks={completedResult.totalMarks}
        onRetake={() => {
          const uniKey = completedResult.universityId || profile?.targetUniversityId || profile?.targetUniversity || profile?.university || 'nust';
          if (completedResult.title.includes('Sprint')) {
            handleStartSprint(completedResult.universityId || 'Advance Maths');
            return;
          }

          const { config: paperConfig, questions } = generateUniversityPaperExam(
            uniKey,
            getSeenStemsForStudent(user?.uid || profile?.uid)
          );
          const startTime = Date.now();
          const durationMinutes = paperConfig.durationMinutes;
          const endTime = startTime + durationMinutes * 60 * 1000;

          const sessionState = {
            title: `${paperConfig.shortName} Full Entrance Mock Paper`,
            questions,
            durationMinutes,
            negativeMarkingPercent: paperConfig.negativeMarkingPercent,
            marksPerQuestion: paperConfig.marksPerQuestion,
            totalMarks: paperConfig.totalMarks,
            universityId: uniKey,
            startTime,
            endTime,
            initialAnswers: Array(questions.length).fill(null),
            initialFlagged: Array(questions.length).fill(false),
            initialIndex: 0,
          };

          try {
            localStorage.setItem(
              'boardly_university_test_session',
              JSON.stringify({
                ...sessionState,
                userAnswers: sessionState.initialAnswers,
                flagged: sessionState.initialFlagged,
                currentIndex: 0,
              })
            );
          } catch {}

          setActiveTest(sessionState);
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

  // Full-Screen Boardy AI tab: renders with 0 chrome (no bottom nav, no top bar, no footer, no sidebar)
  if (activeTab === 'boardy' && !activeTest && !completedResult) {
    return (
      <>
        <StudentBoardyChatTab
          initialPrompt={boardyPrompt}
          onOpenUsage={() => setShowUsageModal(true)}
          onUpgrade={() => {
            setUpgradeFromBlocked(true);
            setShowUpgradeModal(true);
          }}
          onBackToDashboard={handleBackFromBoardy}
          isFullScreen={true}
        />
        <PricingModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setUpgradeFromBlocked(false);
          }}
          fromBlocked={upgradeFromBlocked}
          currentPlan={profile?.plan}
          initialTargetPlan={upgradeTargetPlan}
          onSubmitUpgradeRequest={handlePricingUpgradeRequest}
        />
      </>
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
          : activeTab === 'history'
          ? 'Test History'
          : activeTab === 'limits'
          ? 'Daily Limits'
          : activeTab === 'universities'
          ? 'University Explorer'
          : activeTab === 'merit-meter'
          ? 'Merit Meter'
          : activeTab === 'predictor'
          ? 'Admission Predictor'
          : activeTab === 'profile'
          ? 'Student Profile'
          : 'Student Portal'
      }
      subtitle="FSC & University Test Prep Portal"
      activeNav={activeTab}
      onSelectNav={handleSelectTab}
      onNavigateUpgrade={() => {
        setUpgradeFromBlocked(false);
        setShowUpgradeModal(true);
      }}
      onNavigateProfile={() => handleSelectTab('profile')}
      onNavigateBilling={() => {
        handleSelectTab('profile');
        setTimeout(() => {
          const el = document.getElementById('current-plan-card');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }}
      onLogout={logOut}
      onOpenMore={() => setShowMoreSheet(true)}
      isInputFocused={isBoardyFocused}
      isInTestSession={Boolean(activeTest)}
    >
      {/* Tab Switcher */}
      {activeTab === 'overview' && (
        <StudentOverviewTab
          attempts={attempts}
          onStartSprint={handleStartSprint}
          onGoToPractice={() => handleSelectTab('practice')}
          onGoToEvents={() => handleSelectTab('events')}
          onWriteReview={() => setShowReviewModal(true)}
          onSelectUniversity={() => setShowUniModal(true)}
          onUpgrade={() => {
            setUpgradeFromBlocked(true);
            setShowUpgradeModal(true);
          }}
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
          onInputFocus={() => setIsBoardyFocused(true)}
          onInputBlur={() => setIsBoardyFocused(false)}
        />
      )}

      {activeTab === 'history' && (
        <StudentHistoryTab
          attempts={attempts}
          onStartTest={() => setActiveTab('practice')}
        />
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto animate-in fade-in pb-12">
          <StudentProfileView
            user={user}
            profile={profile}
            onRefreshProfile={() => {
              // Handled via AuthContext
            }}
            onNavigateHome={() => setActiveTab('overview')}
            onOpenUpgrade={(target) => {
              if (target) setUpgradeTargetPlan(target);
              setShowUpgradeModal(true);
            }}
            onStartPractice={() => setActiveTab('practice')}
            onSignOut={logOut}
          />
        </div>
      )}

      {/* Requirement 3: More sheet destination tabs & unbuilt tiles */}
      {activeTab === 'limits' && (
        <DailyLimitsView
          onOpenUpgradeModal={() => setShowUpgradeModal(true)}
          onNavigatePractice={() => setActiveTab('practice')}
          onNavigateBoardy={() => setActiveTab('boardy')}
        />
      )}

      {activeTab === 'universities' && (
        <UniversityExplorer
          onNavigateMeritMeter={(uniId) => {
            setActiveTab('merit-meter');
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', `/app/merit-meter?uni=${encodeURIComponent(uniId)}`);
            }
          }}
          onNavigatePredictor={() => setActiveTab('predictor')}
        />
      )}

      {activeTab === 'merit-meter' && (
        <MeritMeter
          onStartPractice={() => setActiveTab('practice')}
          onExploreMore={() => setActiveTab('universities')}
        />
      )}

      {activeTab === 'predictor' && (
        <AdmissionPredictor
          onNavigateMeritMeter={() => setActiveTab('merit-meter')}
          onNavigateUniversities={() => setActiveTab('universities')}
        />
      )}

      {activeTab === 'arena' && (
        <ComingSoon
          title="Boardly Arena"
          icon={<Swords className="w-8 h-8 text-indigo-600" />}
          text="Real-time head-to-head multiplayer MCQ showdowns with synchronized timing and negative marking calibration."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'chapter-map' && (
        <ComingSoon
          title="Chapter Map"
          icon={<Layers className="w-8 h-8 text-indigo-600" />}
          text="Interactive conceptual dependency graph mapping prerequisite concepts across Physics, Math, Chemistry, and Biology."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'formula-vault' && (
        <ComingSoon
          title="Formula Vault"
          icon={<Sparkles className="w-8 h-8 text-amber-500" />}
          text="Searchable high-yield formula sheets, constants, and derivations for quick reference before timed exams."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'paper-vault' && (
        <ComingSoon
          title="Paper Vault (Beta)"
          icon={<FileText className="w-8 h-8 text-blue-600" />}
          text="Official board past papers from FBISE, BISE Lahore, and university entrance exams with full solution keys."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'growth' && (
        <ComingSoon
          title="Growth & Analytics"
          icon={<BarChart2 className="w-8 h-8 text-emerald-600" />}
          text="Deep diagnostic breakdown of accuracy trends, subject percentiles, and speed bottlenecks across test attempts."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'smart-planner' && (
        <ComingSoon
          title="Smart Planner (Beta)"
          icon={<Calendar className="w-8 h-8 text-purple-600" />}
          text="Algorithmic daily revision schedule calibrated to your target university test date and weakest topic areas."
          onBack={() => setActiveTab('overview')}
        />
      )}

      {activeTab !== 'profile' && <TrustFooter className="mt-12" />}

      {/* Requirement 3: "More" Bottom Sheet */}
      <MoreBottomSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            if (tab === 'profile') window.history.pushState({}, '', '/app/profile');
            else if (tab === 'universities') window.history.pushState({}, '', '/app/universities');
            else if (tab === 'merit-meter') window.history.pushState({}, '', '/app/merit-meter');
            else if (tab === 'predictor') window.history.pushState({}, '', '/app/predictor');
            else if (tab === 'limits') window.history.pushState({}, '', '/app/limits');
          }
        }}
        onNavigateUrl={(url) => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
      />

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
              <h4 className="font-extrabold text-base text-slate-900">
                Thank you for your review!
              </h4>
              <p className="text-xs text-slate-500">
                Your review has been submitted for moderation and will appear on the wall shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell other students how Boardly helped your test preparation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Redesigned Pricing & Checkout Experience */}
      <PricingModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setUpgradeFromBlocked(false);
        }}
        fromBlocked={upgradeFromBlocked}
        currentPlan={profile?.plan}
        initialTargetPlan={upgradeTargetPlan}
        onSubmitUpgradeRequest={handlePricingUpgradeRequest}
      />

      {/* Target University Selector Modal */}
      <TargetUniversityModal
        isOpen={showUniModal}
        onClose={() => setShowUniModal(false)}
        currentUser={user as any}
        userProfile={profile as any}
        onUniversityUpdated={(updated) => {
          const chosen = updated.dream_university || updated.target_university || '';
          updateProfileData({
            targetUniversity: chosen,
            targetUniversityId: chosen,
            university: chosen,
          });
        }}
      />
    </AppShell>
  );
};
