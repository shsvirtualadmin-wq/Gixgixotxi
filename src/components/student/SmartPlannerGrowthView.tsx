import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Target,
  ArrowRight,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError, StoredTestAttempt } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

interface SmartPlannerGrowthViewProps {
  onStartDrill: (subject?: string, topic?: string) => void;
}

export const SmartPlannerGrowthView: React.FC<SmartPlannerGrowthViewProps> = ({
  onStartDrill,
}) => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'planner' | 'growth'>('planner');
  const [attempts, setAttempts] = useState<StoredTestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  const fetchAttempts = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setErrorInfo(null);
    const path = `users/${user.uid}/testAttempts`;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'testAttempts'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: StoredTestAttempt[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setAttempts(list);
    } catch (err: any) {
      logFirestoreError(path, err, 'planner_fetch_attempts');
      setErrorInfo({
        message: err?.message || 'Unable to fetch historical attempts for growth telemetry.',
        path,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [user?.uid]);

  // Days left until exam
  const daysLeft = useMemo(() => {
    const rawTarget = profile?.targetExamDate || profile?.examDate;
    if (!rawTarget) return 28;
    const diff = Math.ceil((new Date(rawTarget).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [profile?.targetExamDate, profile?.examDate]);

  // Generate personalized schedule based on days remaining and weak topics
  const schedulePlan = useMemo(() => {
    const weakList = (profile?.weakTopics || profile?.weakSubjects || []).filter(Boolean);
    const targetTrack = profile?.testTrack || 'Pre-Engineering';

    const weeksCount = Math.max(2, Math.min(6, Math.ceil(daysLeft / 7)));
    const schedule: {
      week: number;
      focus: string;
      goalMCQs: number;
      tasks: string[];
      status: 'active' | 'upcoming';
    }[] = [];

    for (let w = 1; w <= weeksCount; w++) {
      const topic = weakList[w - 1] || 'Mixed Full Syllabus Practice';
      schedule.push({
        week: w,
        focus: w === 1 ? `Weak Area Revision: ${topic}` : w === weeksCount ? 'Full University Mock Simulations & Timing' : `Chapter Mastery: ${topic}`,
        goalMCQs: 150 + w * 25,
        tasks: [
          `Solve 25 timed MCQs daily on ${topic}`,
          'Review incorrect option derivations using Boardy AI',
          'Complete 1 full-length entrance mock under negative marking constraints',
        ],
        status: w === 1 ? 'active' : 'upcoming',
      });
    }
    return schedule;
  }, [daysLeft, profile]);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Smart Planner & Growth Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Dynamic study schedule generator calibrated to your exam countdown and real accuracy metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => onStartDrill()}
            leftIcon={<Target className="w-4 h-4" />}
          >
            Start Planned Drill
          </Button>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load planner data"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchAttempts}
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'planner'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          Adaptive Study Planner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'growth'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          Historical Growth Telemetry
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} className="rounded-3xl" />
          ))}
        </div>
      )}

      {/* TAB 1: Adaptive Study Planner */}
      {!isLoading && activeTab === 'planner' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-blue-900/20 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[var(--brand-2)] uppercase tracking-wider block">
                Target: {profile?.targetUniversity || 'University Exam'} ({daysLeft} days remaining)
              </span>
              <h3 className="text-base font-bold text-white">
                Personalized {schedulePlan.length}-Week Milestone Roadmap
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Paced automatically to cover your weakest syllabus chapters before test day.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStartDrill()}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Start Week 1 Task
            </Button>
          </div>

          <div className="space-y-3">
            {schedulePlan.map((step) => (
              <Card
                key={step.week}
                variant="glass"
                className={`p-5 space-y-3 border transition-all text-left ${
                  step.status === 'active'
                    ? 'border-[#2F6BFF] shadow-[0_0_24px_-4px_rgba(47,107,255,0.3)] bg-gradient-to-r from-blue-950/30 to-slate-900/30'
                    : 'border-white/8 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center ${
                        step.status === 'active'
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-white/10 text-[var(--text-muted)]'
                      }`}
                    >
                      W{step.week}
                    </span>
                    <h4 className="text-sm font-bold text-white">{step.focus}</h4>
                  </div>
                  <Badge variant={step.status === 'active' ? 'student' : 'default'} size="sm">
                    {step.status === 'active' ? 'Current Focus' : 'Upcoming'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {step.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/6 text-xs text-[var(--text-muted)] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/8 flex items-center justify-between text-xs text-[var(--text-faint)]">
                  <span>Target Volume: {step.goalMCQs} Questions</span>
                  <span className="font-mono text-white">Target Accuracy: 80%+</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Historical Growth Telemetry */}
      {!isLoading && activeTab === 'growth' && (
        <div className="space-y-5">
          {attempts.length === 0 ? (
            <EmptyState
              title="No test history recorded yet"
              description="Complete practice drills or mock exams to generate your real accuracy growth curve and subject mastery charts."
              action={{
                label: 'Start Practice Drill',
                onClick: () => onStartDrill(),
              }}
            />
          ) : (
            <div className="space-y-5">
              {/* Score progression cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card variant="glass" className="p-5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider block">
                    Total Tests Completed
                  </span>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {attempts.length}
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)]">Real attempts recorded</p>
                </Card>

                <Card variant="glass" className="p-5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider block">
                    Highest Mock Score
                  </span>
                  <span className="text-3xl font-extrabold text-[#34D399] font-mono">
                    {Math.max(...attempts.map((a) => a.percentage || 0))}%
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)]">Personal best performance</p>
                </Card>

                <Card variant="glass" className="p-5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider block">
                    Average Test Accuracy
                  </span>
                  <span className="text-3xl font-extrabold text-[var(--brand-2)] font-mono">
                    {Math.round(
                      attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length
                    )}
                    %
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)]">Across all subjects</p>
                </Card>
              </div>

              {/* Attempt Bar Progression Chart */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Test Accuracy Progression</h3>
                    <p className="text-xs text-[var(--text-muted)]">Chronological score history</p>
                  </div>
                  <Badge variant="student" size="sm">
                    {attempts.length} Attempts
                  </Badge>
                </div>

                <div className="flex items-end gap-2 h-44 pt-6 px-2 overflow-x-auto">
                  {attempts.map((att, i) => {
                    const pct = Math.max(5, Math.min(100, att.percentage || 0));
                    const isHigh = pct >= 70;
                    return (
                      <div
                        key={att.id || i}
                        className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                        title={`${att.title}: ${att.percentage}%`}
                      >
                        <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {pct}%
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isHigh ? 'bg-[#34D399]' : pct >= 40 ? 'bg-[#2F6BFF]' : 'bg-red-400'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                        <span className="text-[10px] text-[var(--text-faint)] font-mono">
                          #{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
