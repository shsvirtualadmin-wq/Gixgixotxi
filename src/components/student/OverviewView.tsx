import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Flame,
  Award,
  Zap,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError, StoredTestAttempt } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PhoneMockup } from '../marketing/PhoneMockup';
import { getKarachiTodayString, getTimeUntilKarachiMidnight, getPlanConfig } from '../../data/planLimits';

interface OverviewViewProps {
  onNavigate: (path: string) => void;
  onReviewAttempt: (attempt: StoredTestAttempt) => void;
  onStartDrill: (subject?: string, topic?: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onReviewAttempt,
  onStartDrill,
}) => {
  const { user, profile } = useAuth();

  const [hideMockup, setHideMockup] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('boardly_hide_mockup') === 'true';
    }
    return false;
  });

  const [attempts, setAttempts] = useState<StoredTestAttempt[]>([]);
  const [dailyUsage, setDailyUsage] = useState<{
    testsTaken: number;
    boardyQuestionsAsked: number;
    questionsAnswered: number;
  }>({ testsTaken: 0, boardyQuestionsAsked: 0, questionsAnswered: 0 });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  const todayPkt = useMemo(() => getKarachiTodayString(), []);
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilKarachiMidnight().formattedCountdown);

  // Update midnight countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilKarachiMidnight().formattedCountdown);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setErrorInfo(null);

    const uid = user.uid;
    const attemptsPath = `users/${uid}/testAttempts`;
    const usagePath = `users/${uid}/usage/${todayPkt}`;

    try {
      // 1. Fetch real attempts
      const attemptsQuery = query(
        collection(db, 'users', uid, 'testAttempts'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const attemptsSnap = await getDocs(attemptsQuery);
      const loadedAttempts: StoredTestAttempt[] = attemptsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Fallback: check profile.testHistory if subcollection is empty
      if (loadedAttempts.length === 0 && profile?.testHistory && profile.testHistory.length > 0) {
        setAttempts(profile.testHistory.slice(-20).reverse());
      } else {
        setAttempts(loadedAttempts);
      }

      // 2. Fetch real daily usage in PKT timezone
      const usageDocRef = doc(db, 'users', uid, 'usage', todayPkt);
      const usageSnap = await getDoc(usageDocRef);
      if (usageSnap.exists()) {
        const udata = usageSnap.data();
        setDailyUsage({
          testsTaken: udata.testsTaken ?? udata.testsUsed ?? 0,
          boardyQuestionsAsked: udata.boardyQuestionsAsked ?? udata.boardyUsed ?? 0,
          questionsAnswered: udata.questionsAnswered ?? udata.questionsUsed ?? 0,
        });
      } else {
        // Fallback to top-level user doc counters if usage subcollection document not yet created for today
        setDailyUsage({
          testsTaken: profile?.testsUsedToday ?? 0,
          boardyQuestionsAsked: profile?.boardyQuestionsUsedToday ?? 0,
          questionsAnswered: 0,
        });
      }
    } catch (err: any) {
      logFirestoreError(attemptsPath, err, 'overview_data_fetch');
      setErrorInfo({
        message: err?.message || 'Could not load your recent test attempts from the database.',
        path: attemptsPath,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, todayPkt, profile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDismissMockup = () => {
    setHideMockup(true);
    try {
      localStorage.setItem('boardly_hide_mockup', 'true');
    } catch {}
  };

  // Exam Countdown Calculation
  const daysLeft = useMemo(() => {
    const rawTarget = profile?.targetExamDate || profile?.examDate;
    if (!rawTarget) return 28;
    const targetTime = new Date(rawTarget).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [profile?.targetExamDate, profile?.examDate]);

  // Aggregate stats from real attempts
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return { totalTests: 0, totalQuestions: 0, avgAccuracy: 0 };
    }
    const totalTests = attempts.length;
    const totalQuestions = attempts.reduce((acc, a) => acc + (a.totalQuestions || 0), 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + (a.correctCount || 0), 0);
    const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalTests, totalQuestions, avgAccuracy };
  }, [attempts]);

  const planConfig = getPlanConfig(profile?.plan);
  const testsRemaining = Math.max(0, planConfig.testsPerDay - dailyUsage.testsTaken);
  const aiRemaining = Math.max(0, planConfig.boardyPerDay - dailyUsage.boardyQuestionsAsked);

  const firstName = profile?.name ? profile.name.trim().split(' ')[0] : 'Student';
  const targetUni = profile?.targetUniversity || 'Top University';
  const targetTrack = profile?.testTrack || 'Pre-Engineering';

  // Weak chapters / topics extracted from attempts topicBreakdown + profile onboarding tags
  const weakTopicsList = useMemo(() => {
    const fromProfile = (profile?.weakTopics || profile?.weakSubjects || []).filter(Boolean);
    if (fromProfile.length > 0) return fromProfile.slice(0, 4);
    return ['Integration & Limits', 'Vectors & Equilibrium', 'Reaction Kinetics', 'Analytical Reasoning'];
  }, [profile]);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Welcome back, {firstName} 🚀
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Targeting <span className="text-[var(--brand-2)] font-semibold">{targetUni}</span> ({targetTrack}) · Active syllabus v2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => onStartDrill()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shadow-lg shadow-blue-600/25"
          >
            Launch Practice Drill
          </Button>
        </div>
      </div>

      {/* Error State if fetch failed */}
      {errorInfo && (
        <ErrorState
          title="Could not sync study overview"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={loadDashboardData}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-4">
            <Skeleton variant="rectangular" height={180} className="rounded-3xl" />
          </div>
          <div className="md:col-span-4">
            <Skeleton variant="rectangular" height={180} className="rounded-3xl" />
          </div>
          <div className="md:col-span-4">
            <Skeleton variant="rectangular" height={180} className="rounded-3xl" />
          </div>
          <div className="md:col-span-8">
            <Skeleton variant="rectangular" height={320} className="rounded-3xl" />
          </div>
          <div className="md:col-span-4">
            <Skeleton variant="rectangular" height={320} className="rounded-3xl" />
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Dismissible PhoneMockup Preview Card */}
          {!hideMockup && (
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-cyan-900/30 border border-white/12 p-6 overflow-hidden">
              <button
                type="button"
                onClick={handleDismissMockup}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer z-20"
                title="Dismiss preview card"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
                <div className="space-y-3 max-w-lg">
                  <Badge variant="student" size="sm" className="font-mono">
                    Sample preview · Interactive hardware simulator
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                    Your complete study cockpit on mobile & desktop
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Practice timed past paper simulations, receive step-by-step KaTeX derivations, and challenge classmates in live national blitz mocks.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('/dashboard/practice')}
                      rightIcon={<Target className="w-3.5 h-3.5" />}
                    >
                      Explore Past Papers
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate('/dashboard/ai-tutor')}
                      rightIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--brand-2)]" />}
                    >
                      Ask Boardy AI
                    </Button>
                  </div>
                </div>

                <div className="w-full max-w-[280px] shrink-0">
                  <PhoneMockup initialScreen="student" autoPlay={false} />
                </div>
              </div>
            </div>
          )}

          {/* 12-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* 1. Exam Countdown Card (Cols 1-4) */}
            <Card variant="glass" className="md:col-span-4 p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)] tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--brand-2)]" />
                  <span>Exam Target Countdown</span>
                </span>
                <Badge variant="student" size="sm">
                  {targetUni}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                    {daysLeft}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">days left</span>
                </div>
                <p className="text-xs text-[var(--text-faint)]">
                  Expected Exam Date: {profile?.targetExamDate || profile?.examDate || 'Not specified'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">Maintain daily study pacing</span>
                <button
                  onClick={() => onNavigate('/dashboard/profile')}
                  className="text-xs font-bold text-[var(--brand-2)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit Target</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </Card>

            {/* 2. Daily Limits Meter Card (PKT Asia/Karachi) (Cols 5-8) */}
            <Card variant="glass" className="md:col-span-4 p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)] tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Daily Quota (PKT)</span>
                </span>
                <Badge variant={profile?.plan === 'pro' ? 'student' : 'default'} size="sm">
                  {planConfig.name} Tier
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)]">Practice Sprints</span>
                    <span className="font-mono font-bold text-white">
                      {dailyUsage.testsTaken} / {planConfig.testsPerDay >= 999 ? '∞' : planConfig.testsPerDay}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE]"
                      style={{
                        width: `${Math.min(100, (dailyUsage.testsTaken / planConfig.testsPerDay) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)]">Boardy AI Prompts</span>
                    <span className="font-mono font-bold text-white">
                      {dailyUsage.boardyQuestionsAsked} / {planConfig.boardyPerDay >= 999 ? '∞' : planConfig.boardyPerDay}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#34D399]"
                      style={{
                        width: `${Math.min(100, (dailyUsage.boardyQuestionsAsked / planConfig.boardyPerDay) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/8 flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                <span>Resets in {countdown}</span>
                {profile?.plan !== 'pro' && (
                  <button
                    onClick={() => onNavigate('/dashboard/plans')}
                    className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Upgrade for PKR 199
                  </button>
                )}
              </div>
            </Card>

            {/* 3. Study Streak & KPIs Card (Cols 9-12) */}
            <Card variant="glass" className="md:col-span-4 p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)] tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Performance KPIs</span>
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{profile?.streak ?? 0} Day Streak</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/8">
                  <span className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-wider block">
                    Tests Done
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {stats.totalTests}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/8">
                  <span className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-wider block">
                    Accuracy
                  </span>
                  <span className="text-2xl font-black text-[#34D399] font-mono">
                    {stats.avgAccuracy}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/8 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Total Questions: {stats.totalQuestions}</span>
                <button
                  onClick={() => onNavigate('/dashboard/history')}
                  className="text-xs font-bold text-[var(--brand-2)] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View History</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </Card>

            {/* 4. Recent Completed Attempts List (Cols 1-7) */}
            <Card variant="glass" className="md:col-span-7 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Recent Completed Attempts</h3>
                  <p className="text-xs text-[var(--text-muted)]">Review mistake derivations and score pacing</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('/dashboard/history')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  All Attempts
                </Button>
              </div>

              {attempts.length === 0 ? (
                <EmptyState
                  title="No test attempts yet"
                  description="Complete your first timed practice drill or full university mock paper to see your score derivations here."
                  action={{
                    label: 'Start Diagnostic Sprint',
                    onClick: () => onStartDrill(),
                  }}
                  className="py-10"
                />
              ) : (
                <div className="space-y-2.5">
                  {attempts.slice(0, 5).map((att) => {
                    const formattedDate = new Date(att.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const minutesSpent = Math.max(1, Math.round((att.timeSpentSeconds || 0) / 60));
                    const scoreColor =
                      att.percentage >= 75
                        ? 'text-[#34D399]'
                        : att.percentage >= 50
                        ? 'text-amber-400'
                        : 'text-[#F87171]';

                    return (
                      <div
                        key={att.id || att.createdAt}
                        onClick={() => onReviewAttempt(att)}
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-[var(--brand-2)] transition-colors">
                            {att.title || 'Practice Sprint'}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{minutesSpent} min</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{att.correctCount} correct</span>
                            <span>•</span>
                            <span className="text-rose-400 font-semibold">{att.wrongCount} wrong</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-base font-extrabold font-mono ${scoreColor}`}>
                              {att.percentage}%
                            </span>
                            <span className="text-[10px] text-[var(--text-faint)] block">
                              {att.score}/{att.totalQuestions}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 5. High-Priority Weak Chapters & Topics Card (Cols 8-12) */}
            <Card variant="glass" className="md:col-span-5 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Priority Focus Areas</h3>
                    <p className="text-xs text-[var(--text-muted)]">Targeted for score optimization</p>
                  </div>
                  <Badge variant="student" size="sm">
                    {targetTrack}
                  </Badge>
                </div>

                <div className="space-y-2.5 pt-4">
                  {weakTopicsList.map((topic, i) => (
                    <div
                      key={topic}
                      className="p-3 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 text-[#F87171] text-xs font-mono font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{topic}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartDrill(undefined, topic)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[var(--brand)] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Drill
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('/dashboard/chapter-map')}
                  rightIcon={<Layers className="w-3.5 h-3.5" />}
                  className="w-full justify-center text-xs"
                >
                  Open Full Syllabus Chapter Map
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
