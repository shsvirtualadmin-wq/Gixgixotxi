import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Check,
  ArrowRight,
  ArrowLeft,
  Flame,
  LogIn,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CrewEvent, PublicLeaderboardEntry, CrewEventAttempt } from '../../types/crewEvents';
import {
  fetchCrewEventById,
  fetchEventLeaderboard,
  fetchUserEventAttempt,
  submitEventAttempt,
  formatSafeDisplayName,
} from '../../lib/crewEventsStore';
import { TestPreparationScreen } from '../TestPreparationScreen';
import { TestScreen } from '../TestScreen';
import { ResultsScreen } from '../ResultsScreen';
import { TestConfig, UserAnswer, TestResult } from '../../types';
import { loadKatexCss } from '../../lib/katexLoader';
import { SeoHead } from '../common/SeoHead';

interface PublicCrewEventViewProps {
  eventId: string;
  onNavigateHome?: () => void;
  onNavigateSignIn?: () => void;
}

export const PublicCrewEventView: React.FC<PublicCrewEventViewProps> = ({
  eventId,
  onNavigateHome,
  onNavigateSignIn,
}) => {
  const { user, profile, signInGoogle } = useAuth();

  const [event, setEvent] = useState<CrewEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAttempt, setUserAttempt] = useState<CrewEventAttempt | null>(null);

  // Test Attempt Flow States
  const [isPreparingMath, setIsPreparingMath] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchCrewEventById(eventId),
      fetchEventLeaderboard(eventId),
    ])
      .then(([evt, lb]) => {
        if (!isMounted) return;
        setEvent(evt);
        setLeaderboard(lb);
      })
      .catch(console.warn)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Check if current authenticated student has already attempted this event
  useEffect(() => {
    if (user?.uid && eventId) {
      fetchUserEventAttempt(eventId, user.uid)
        .then((att) => setUserAttempt(att))
        .catch(console.warn);
    }
  }, [user?.uid, eventId]);

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleGoogleSignInToAttempt = async () => {
    setGoogleLoading(true);
    try {
      await signInGoogle();
    } catch (err) {
      console.warn('Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleStartAttempt = () => {
    if (!event) return;
    if (!user) {
      handleGoogleSignInToAttempt();
      return;
    }

    if (userAttempt && !event.retakesAllowed) {
      alert('You have already submitted an attempt for this event. Retakes are not enabled.');
      return;
    }

    // Launch KaTeX preparation screen first
    loadKatexCss().catch(console.warn);
    setIsPreparingMath(true);
  };

  const handleFinishEventTest = async (answers: UserAnswer[], timeTakenSeconds: number) => {
    if (!event || !user) return;

    const questions = event.questions || [];
    let correctCount = 0;
    const topicBreakdown: Record<string, { total: number; correct: number }> = {};

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      const topicName = q.topic || event.subjects[0] || 'General';
      if (!topicBreakdown[topicName]) {
        topicBreakdown[topicName] = { total: 0, correct: 0 };
      }
      topicBreakdown[topicName].total += 1;
      if (ans && ans.selectedOption === q.correct) {
        correctCount += 1;
        topicBreakdown[topicName].correct += 1;
      }
    });

    const total = questions.length || 1;
    const percentage = Math.round((correctCount / total) * 100);

    const submission: TestResult = {
      id: `evt-res-${Date.now()}`,
      timestamp: Date.now(),
      config: {
        path: 'boards',
        subject: event.subjects[0] || 'Physics',
        durationMinutes: event.durationMinutes,
        questionCount: total,
        difficulty: event.difficulty,
        mode: 'instant',
        instantFeedback: true,
      },
      score: correctCount,
      total,
      percentage,
      timeTakenSeconds,
      topicBreakdown,
      userAnswers: answers,
      questions,
    };

    setTestResult(submission);
    setIsRunningTest(false);

    try {
      const att = await submitEventAttempt(
        event,
        user.uid,
        formatSafeDisplayName(profile?.name || user.displayName, user.email),
        correctCount,
        total,
        timeTakenSeconds,
        answers
      );
      setUserAttempt(att);
      // Refresh leaderboard
      const updatedLb = await fetchEventLeaderboard(event.id);
      setLeaderboard(updatedLb);
    } catch (err: any) {
      console.warn('Error saving event attempt:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07061d] text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-2xl bg-violet-600/30 animate-pulse flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#07061d] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold max-w-sm">
          Event Not Found or Expired.
        </div>
        <button
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            else window.location.href = '/';
          }}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  // 1. If currently in preparation screen
  if (isPreparingMath) {
    return (
      <TestPreparationScreen
        questions={event.questions || []}
        testTitle={event.title}
        onReady={() => {
          setIsPreparingMath(false);
          setIsRunningTest(true);
        }}
      />
    );
  }

  // 2. If currently running the real test
  if (isRunningTest) {
    const config: TestConfig = {
      path: 'boards',
      subject: event.subjects[0] || 'Physics',
      durationMinutes: event.durationMinutes,
      questionCount: event.questions?.length || event.questionCount,
      difficulty: event.difficulty,
      mode: 'instant',
      instantFeedback: false,
    };

    return (
      <TestScreen
        questions={event.questions || []}
        config={config}
        currentUser={user as any}
        userProfile={profile as any}
        onFinishTest={handleFinishEventTest}
        onExitTest={() => {
          if (confirm('Leave this competition test? Your progress will not be submitted.')) {
            setIsRunningTest(false);
          }
        }}
      />
    );
  }

  // 3. If test was just completed
  if (testResult) {
    return (
      <ResultsScreen
        result={testResult}
        currentUser={user as any}
        userProfile={profile as any}
        onTakeAnother={() => {
          setTestResult(null);
        }}
        onOpenPrintModal={() => window.print()}
        onBackToHome={() => {
          setTestResult(null);
        }}
      />
    );
  }

  const isLive = event.status === 'live';
  const isEnded = event.status === 'ended';
  const isUpcoming = event.status === 'scheduled';

  return (
    <div className="min-h-screen bg-[#07061d] text-white pb-24 font-sans select-none">
      <SeoHead
        pathname={`/events/${eventId}`}
        override={{
          title: `${event.title} — Boardly Event`,
          description: `Attempt ${event.title} organized by ${event.organizerName}. Authentic timed MCQs and live national standings.`,
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#090826]/90 backdrop-blur-xl border-b border-violet-500/20 px-4 sm:px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <button
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            else window.location.href = '/';
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Event Hero Details Card */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-violet-500/25 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Status Chip & Program Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 border border-teal-500/30 px-3 py-1 rounded-full">
              {event.type}
            </span>

            {isLive && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                LIVE TOURNAMENT
              </span>
            )}
            {isUpcoming && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/40">
                Scheduled
              </span>
            )}
            {isEnded && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                Event Concluded
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Organized by <strong className="text-white">{event.organizerName}</strong>
            </p>
          </div>

          {/* Key chips row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400">Subject</div>
              <div className="font-bold text-white truncate mt-0.5">{event.subjects.join(', ')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400">Questions</div>
              <div className="font-bold font-mono text-teal-300 mt-0.5">{event.questionCount} MCQs</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400">Duration</div>
              <div className="font-bold font-mono text-sky-300 mt-0.5">{event.durationMinutes} Minutes</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400">Candidates</div>
              <div className="font-bold font-mono text-amber-300 mt-0.5">{event.totalAttempts} Attempts</div>
            </div>
          </div>

          {event.description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {event.description}
            </p>
          )}

          {/* Attempt CTA Section */}
          <div className="pt-4 border-t border-violet-500/20">
            {userAttempt ? (
              <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Your Attempt is Recorded</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    Score: <strong className="text-white">{userAttempt.score}/{userAttempt.total}</strong> ({userAttempt.percentage}%) • Time: {Math.floor(userAttempt.timeTakenSeconds / 60)}m {userAttempt.timeTakenSeconds % 60}s
                  </div>
                </div>

                {event.retakesAllowed && (
                  <button
                    onClick={handleStartAttempt}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Test</span>
                  </button>
                )}
              </div>
            ) : user ? (
              <button
                onClick={handleStartAttempt}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-violet-600/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Test Now (Free Access)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleGoogleSignInToAttempt}
                  disabled={googleLoading}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  <span>{googleLoading ? 'Signing in...' : 'Sign in with Google to Start (Free)'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  All Boardly users can attempt without Pro paywall. No password setup required.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Public Leaderboard Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-violet-500/25 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Tournament Standings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Live rankings updated in real time. Ties are broken by completion speed.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {leaderboard.length} Ranked
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/5">
              No attempts submitted yet. Be the first to take the test and claim rank #1!
            </div>
          ) : (
            <div className="border border-violet-500/20 rounded-2xl overflow-hidden divide-y divide-violet-500/10">
              <div className="grid grid-cols-12 px-3 py-2 bg-white/5 text-[11px] font-mono font-bold text-slate-400">
                <span className="col-span-2">Rank</span>
                <span className="col-span-5">Student</span>
                <span className="col-span-3 text-right">Score</span>
                <span className="col-span-2 text-right">Time</span>
              </div>

              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="grid grid-cols-12 px-3 py-2.5 text-xs items-center hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-2 font-mono font-bold">
                    {entry.rank === 1 && <span className="text-amber-400">🥇 #1</span>}
                    {entry.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                    {entry.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                    {entry.rank > 3 && <span className="text-slate-400">#{entry.rank}</span>}
                  </div>
                  <div className="col-span-5 font-medium text-white truncate">
                    {entry.displayName}
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-teal-300">
                    {entry.score}/{entry.total} ({entry.percentage}%)
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-400 text-[11px]">
                    {Math.floor(entry.timeTakenSeconds / 60)}m {entry.timeTakenSeconds % 60}s
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
