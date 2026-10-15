import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsage } from '../../context/UsageContext';
import { StoredTestAttempt, getTestAttempts, logTestAttempt } from '../../lib/firebase';
import { StudentLayout } from '../layout/StudentLayout';
import { OverviewView } from './OverviewView';
import { PracticeVaultView } from './PracticeVaultView';
import { ChapterMapView } from './ChapterMapView';
import { FormulaVaultView } from './FormulaVaultView';
import { SmartPlannerGrowthView } from './SmartPlannerGrowthView';
import { TestHistoryView } from './TestHistoryView';
import { MeritMeterView } from './MeritMeterView';
import { UniversityExplorerView } from './UniversityExplorerView';
import { EventsArenaView } from './EventsArenaView';
import { StudyCirclesView } from './StudyCirclesView';
import { BoardyAiTutorView } from './BoardyAiTutorView';
import { PlansUsageView } from './PlansUsageView';
import { StudentReviewsView } from './StudentReviewsView';
import { StudentSettingsView } from './StudentSettingsView';
import { StudentTestRunner } from './StudentTestRunner';
import { StudentTestResult } from './StudentTestResult';
import { getEntranceExamQuestions } from '../../data/entranceExamQuestions';
import { generateUniversityPaperExam } from '../../config/universityPapers';
import { getSeenStemsForStudent, recordQuestionsAsSeen } from '../../lib/seenQuestionsTracker';
import { UNIVERSITIES, University } from '../../data/universities';
import { Question } from '../../types';
import { Lock } from 'lucide-react';

interface StudentAppShellProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onNavigateMarketing?: (path: string) => void;
  onOpenMeritMeter?: () => void;
  onOpenBlitz?: () => void;
  onOpenArena?: () => void;
}

export const StudentAppShell: React.FC<StudentAppShellProps> = ({
  currentPath: propPath,
  onNavigate: propNavigate,
}) => {
  const { user, profile, updateProfileData } = useAuth();
  const { canStartTest, consumeTestStart, loading: usageLoading } = useUsage();

  // Internal path tracking
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (propPath) return propPath.toLowerCase();
    if (typeof window !== 'undefined') {
      return window.location.pathname.toLowerCase().replace(/\/$/, '') || '/dashboard';
    }
    return '/dashboard';
  });

  useEffect(() => {
    if (propPath) {
      setCurrentPath(propPath.toLowerCase());
    }
  }, [propPath]);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/dashboard';
      setCurrentPath(p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback(
    (targetPath: string) => {
      const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', cleanPath);
      }
      setCurrentPath(cleanPath.toLowerCase());
      if (propNavigate) {
        propNavigate(cleanPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [propNavigate]
  );

  // Active Boardy Prompt
  const [boardyPrompt, setBoardyPrompt] = useState<string>('');

  // Active Test Runner Session
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

  // Completed Test Result
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

  // Handle Progress update during test
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

  // Launch a Timed Sprint
  const handleStartSprint = async (subject: string) => {
    if (!canStartTest()) {
      handleNavigate('/dashboard/plans');
      return;
    }
    const sessionId = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const allowed = await consumeTestStart(sessionId);
    if (!allowed) {
      handleNavigate('/dashboard/plans');
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

  // Launch Full University Mock Exam
  const handleStartUniversityPaper = async (uniKeyOrObj: string | University) => {
    if (!canStartTest()) {
      handleNavigate('/dashboard/plans');
      return;
    }
    const sessionId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const allowed = await consumeTestStart(sessionId);
    if (!allowed) {
      handleNavigate('/dashboard/plans');
      return;
    }

    const uniId = typeof uniKeyOrObj === 'string' ? uniKeyOrObj : uniKeyOrObj.id;
    const studentSeenStems = getSeenStemsForStudent(user?.uid || profile?.uid);
    const { config: paperConfig, questions } = generateUniversityPaperExam(uniId, studentSeenStems);

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
      universityId: uniId,
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

  // Launch Custom Drill Session
  const handleStartDrillSession = async (config: {
    subject: string;
    chapter?: string;
    topic?: string;
    questionCount: number;
    durationMinutes: number;
    difficulty?: string;
    isPastPaper?: boolean;
    universityId?: string;
  }) => {
    if (!canStartTest()) {
      handleNavigate('/dashboard/plans');
      return;
    }
    const sessionId = `drill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const allowed = await consumeTestStart(sessionId);
    if (!allowed) {
      handleNavigate('/dashboard/plans');
      return;
    }

    const uniId = config.universityId || profile?.targetUniversityId || 'nust';
    const sub = config.subject === 'All Subjects' ? 'Advance Maths' : config.subject;
    const studentSeenStems = getSeenStemsForStudent(user?.uid || profile?.uid);

    let questions: Question[] = [];
    if (config.isPastPaper && config.universityId) {
      const exam = generateUniversityPaperExam(config.universityId, studentSeenStems);
      questions = exam.questions.slice(0, config.questionCount);
    } else {
      questions = getEntranceExamQuestions(uniId, sub, config.questionCount);
    }

    const startTime = Date.now();
    const endTime = startTime + config.durationMinutes * 60 * 1000;

    const title = config.chapter
      ? `${config.chapter} Drill · ${config.subject}`
      : config.isPastPaper
      ? `${config.universityId?.toUpperCase()} Past Paper Drill`
      : `${config.subject} Custom Drill`;

    const sessionState = {
      title,
      questions,
      durationMinutes: config.durationMinutes,
      negativeMarkingPercent: 0,
      marksPerQuestion: 1,
      totalMarks: questions.length,
      universityId: uniId,
      subject: config.subject,
      startTime,
      endTime,
      initialAnswers: Array(questions.length).fill(null),
      initialFlagged: Array(questions.length).fill(false),
      initialIndex: 0,
    };

    try {
      localStorage.setItem('boardly_university_test_session', JSON.stringify(sessionState));
    } catch {}

    setActiveTest(sessionState);
    setCompletedResult(null);
  };

  // Complete active test
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
    const effectiveTotalMarks =
      results.totalMarks ?? (activeTest?.totalMarks || results.questions.length * perQuestionMark);
    const rawScore = correct * perQuestionMark - wrong * results.negativeMarkingPercent * perQuestionMark;
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

    if (results.questions.length > 0) {
      recordQuestionsAsSeen(
        user?.uid || profile?.uid,
        results.questions,
        activeTest?.subject || 'University Paper',
        results.title
      );
    }

    if (user?.uid) {
      logTestAttempt(newAttempt).catch(console.warn);
      const existingHistory = Array.isArray(profile?.testHistory) ? profile.testHistory : [];
      const updatedHistory = [newAttempt, ...existingHistory];
      const currentStreak =
        typeof profile?.streak === 'number'
          ? profile.streak
          : typeof profile?.streakDays === 'number'
          ? profile.streakDays
          : 0;
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

  // Ask Boardy about a question from results
  const handleAskBoardyAboutQuestion = (q: Question, studentAnsIndex: number | null) => {
    const studentChoice =
      studentAnsIndex !== null
        ? `Option ${String.fromCharCode(65 + studentAnsIndex)}: "${q.options[studentAnsIndex]}"`
        : 'unattempted';
    const prompt = `Please explain this question step-by-step:\n\n**Question**: ${
      q.q || q.question
    }\n\n**Options**:\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${
      q.options[3]
    }\n\nI answered ${studentChoice}. The correct answer is Option ${String.fromCharCode(
      65 + q.correct
    )}. Where did my logic go wrong?`;

    setBoardyPrompt(prompt);
    setCompletedResult(null);
    handleNavigate('/dashboard/ai-tutor');
  };

  // Render Active Test Runner if running
  if (activeTest) {
    const storedSession =
      typeof window !== 'undefined' ? localStorage.getItem('boardly_university_test_session') : null;
    if (!storedSession && !canStartTest() && !usageLoading) {
      return (
        <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Daily Test Limit Reached (Resets midnight PKT)
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md">
            Upgrade to Boardly Pro for unlimited tests and entrance mock papers.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveTest(null);
                handleNavigate('/dashboard/plans');
              }}
              className="px-6 py-3 rounded-xl bg-[var(--brand)] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => {
                setActiveTest(null);
                handleNavigate('/dashboard');
              }}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-colors cursor-pointer"
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

  // Render Completed Test Result Screen
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
          if (completedResult.title.includes('Sprint')) {
            handleStartSprint('Advance Maths');
          } else {
            handleStartUniversityPaper(completedResult.universityId || 'nust');
          }
        }}
        onGoHome={() => {
          setCompletedResult(null);
          handleNavigate('/dashboard');
        }}
        onAskBoardyAboutQuestion={handleAskBoardyAboutQuestion}
      />
    );
  }

  // Determine current active sub-view
  const normalizedPath = currentPath.toLowerCase();

  const renderActiveView = () => {
    // 1. Overview (/dashboard or /app)
    if (normalizedPath === '/dashboard' || normalizedPath === '/app' || normalizedPath === '') {
      return (
        <OverviewView
          onNavigate={handleNavigate}
          onStartSprint={handleStartSprint}
          onStartMock={(uniId) => {
            const uni = UNIVERSITIES.find((u) => u.id === uniId) || UNIVERSITIES[0];
            handleStartUniversityPaper(uni);
          }}
          onAskBoardy={(prompt) => {
            setBoardyPrompt(prompt);
            handleNavigate('/dashboard/ai-tutor');
          }}
        />
      );
    }

    // 2. Practice Vault (/dashboard/practice or /practice or /app/practice)
    if (
      normalizedPath === '/dashboard/practice' ||
      normalizedPath.startsWith('/dashboard/practice/') ||
      normalizedPath === '/practice' ||
      normalizedPath.startsWith('/practice/') ||
      normalizedPath === '/app/practice'
    ) {
      return <PracticeVaultView onStartDrillSession={handleStartDrillSession} />;
    }

    // 3. Chapter Map (/dashboard/chapter-map or /app/chapter-map)
    if (
      normalizedPath === '/dashboard/chapter-map' ||
      normalizedPath.startsWith('/dashboard/chapter-map/') ||
      normalizedPath === '/app/chapter-map'
    ) {
      return (
        <ChapterMapView
          onStartChapterDrill={(subj, chap) =>
            handleStartDrillSession({
              subject: subj,
              chapter: chap,
              questionCount: 20,
              durationMinutes: 20,
            })
          }
        />
      );
    }

    // 4. Formula Vault (/dashboard/formula-vault or /app/formula-vault)
    if (
      normalizedPath === '/dashboard/formula-vault' ||
      normalizedPath.startsWith('/dashboard/formula-vault/') ||
      normalizedPath === '/app/formula-vault'
    ) {
      return (
        <FormulaVaultView
          onAskBoardyDerivation={(formulaName, latex) => {
            setBoardyPrompt(
              `Please explain the complete step-by-step derivation and high-yield entrance test problem applications for the following formula:\n\n**${formulaName}**:\n$$${latex}$$\n\nGive 2 entrance exam shortcut tricks.`
            );
            handleNavigate('/dashboard/ai-tutor');
          }}
        />
      );
    }

    // 5. Test History (/dashboard/history or /app/history)
    if (
      normalizedPath === '/dashboard/history' ||
      normalizedPath.startsWith('/dashboard/history/') ||
      normalizedPath === '/app/history'
    ) {
      return (
        <TestHistoryView
          onReviewAttempt={(attemptId) => {
            console.log('Review attempt:', attemptId);
          }}
        />
      );
    }

    // 6. Merit Meter (/dashboard/merit-meter or /app/merit-meter)
    if (
      normalizedPath === '/dashboard/merit-meter' ||
      normalizedPath.startsWith('/dashboard/merit-meter/') ||
      normalizedPath === '/app/merit-meter'
    ) {
      return (
        <MeritMeterView
          onNavigateToPractice={() => handleNavigate('/dashboard/practice')}
        />
      );
    }

    // 7. University Directory (/dashboard/universities or /app/universities)
    if (
      normalizedPath === '/dashboard/universities' ||
      normalizedPath.startsWith('/dashboard/universities/') ||
      normalizedPath === '/app/universities'
    ) {
      return (
        <UniversityExplorerView
          onStartUniversityMock={(uniKey) => {
            const uni = UNIVERSITIES.find((u) => u.id === uniKey) || UNIVERSITIES[0];
            handleStartUniversityPaper(uni);
          }}
          onOpenMeritCalculator={(uniKey) => {
            handleNavigate(`/dashboard/merit-meter?uni=${encodeURIComponent(uniKey)}`);
          }}
        />
      );
    }

    // 8. Events & Arena (/dashboard/events or /app/events)
    if (
      normalizedPath === '/dashboard/events' ||
      normalizedPath.startsWith('/dashboard/events/') ||
      normalizedPath === '/app/events'
    ) {
      return (
        <EventsArenaView
          onEnterLiveSession={(sessionId) => {
            console.log('Enter live session:', sessionId);
          }}
        />
      );
    }

    // 9. Study Circles (/dashboard/study-circles or /app/study-circles)
    if (
      normalizedPath === '/dashboard/study-circles' ||
      normalizedPath.startsWith('/dashboard/study-circles/') ||
      normalizedPath === '/app/study-circles'
    ) {
      return (
        <StudyCirclesView
          onLaunchSquadSession={(sessionDocId) => {
            console.log('Launch squad session:', sessionDocId);
          }}
        />
      );
    }

    // 10. Boardy AI Tutor (/dashboard/ai-tutor or /boardy or /app/boardy)
    if (
      normalizedPath === '/dashboard/ai-tutor' ||
      normalizedPath.startsWith('/dashboard/ai-tutor/') ||
      normalizedPath === '/boardy' ||
      normalizedPath.startsWith('/boardy/') ||
      normalizedPath === '/app/boardy'
    ) {
      return (
        <BoardyAiTutorView
          initialPrompt={boardyPrompt}
          onNavigateToPlans={() => handleNavigate('/dashboard/plans')}
        />
      );
    }

    // 11. Growth & Smart Planner (/dashboard/growth or /app/growth)
    if (
      normalizedPath === '/dashboard/growth' ||
      normalizedPath.startsWith('/dashboard/growth/') ||
      normalizedPath === '/app/growth'
    ) {
      return (
        <SmartPlannerGrowthView
          onStartDailyGoal={() => handleNavigate('/dashboard/practice')}
        />
      );
    }

    // 12. Plans & Usage (/dashboard/plans or /app/plans or /app/limits)
    if (
      normalizedPath === '/dashboard/plans' ||
      normalizedPath.startsWith('/dashboard/plans/') ||
      normalizedPath === '/app/plans' ||
      normalizedPath === '/app/limits'
    ) {
      return (
        <PlansUsageView
          onUpgradeSuccess={() => {
            handleNavigate('/dashboard');
          }}
        />
      );
    }

    // 13. Reviews (/dashboard/reviews or /app/reviews)
    if (
      normalizedPath === '/dashboard/reviews' ||
      normalizedPath.startsWith('/dashboard/reviews/') ||
      normalizedPath === '/app/reviews'
    ) {
      return <StudentReviewsView />;
    }

    // 14. Profile & Settings (/dashboard/profile or /dashboard/settings or /app/profile)
    if (
      normalizedPath === '/dashboard/profile' ||
      normalizedPath.startsWith('/dashboard/profile/') ||
      normalizedPath === '/dashboard/settings' ||
      normalizedPath === '/app/profile' ||
      normalizedPath === '/profile'
    ) {
      return <StudentSettingsView />;
    }

    // Default fallback to Overview
    return (
      <OverviewView
        onNavigate={handleNavigate}
        onStartSprint={handleStartSprint}
        onStartMock={(uniId) => {
          const uni = UNIVERSITIES.find((u) => u.id === uniId) || UNIVERSITIES[0];
          handleStartUniversityPaper(uni);
        }}
        onAskBoardy={(prompt) => {
          setBoardyPrompt(prompt);
          handleNavigate('/dashboard/ai-tutor');
        }}
      />
    );
  };

  return (
    <StudentLayout currentPath={normalizedPath} onNavigate={handleNavigate}>
      {renderActiveView()}
    </StudentLayout>
  );
};
