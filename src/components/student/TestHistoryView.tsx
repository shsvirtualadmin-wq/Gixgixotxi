import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Award,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  Target,
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
import { Modal } from '../ui/Modal';
import { MathText } from '../ui/MathText';

interface TestHistoryViewProps {
  onStartNewTest: () => void;
  selectedAttemptId?: string | null;
}

export const TestHistoryView: React.FC<TestHistoryViewProps> = ({
  onStartNewTest,
  selectedAttemptId,
}) => {
  const { user } = useAuth();

  const [attempts, setAttempts] = useState<StoredTestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);
  const [activeReviewAttempt, setActiveReviewAttempt] = useState<StoredTestAttempt | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAttempts = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setErrorInfo(null);
    const path = `users/${user.uid}/testAttempts`;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'testAttempts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: StoredTestAttempt[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setAttempts(list);

      // Auto-open if selectedAttemptId provided in props
      if (selectedAttemptId) {
        const found = list.find((a) => a.id === selectedAttemptId);
        if (found) setActiveReviewAttempt(found);
      }
    } catch (err: any) {
      logFirestoreError(path, err, 'history_fetch_attempts');
      setErrorInfo({
        message: err?.message || 'Could not load your test history from the database.',
        path,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [user?.uid, selectedAttemptId]);

  const filteredAttempts = attempts.filter((att) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      att.title.toLowerCase().includes(q) ||
      (att.subject && att.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Test History & Answer Reviews
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Review detailed question breakdowns, derivation steps, and pacing across all your test attempts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onStartNewTest}
            leftIcon={<Target className="w-4 h-4" />}
          >
            Start New Test Drill
          </Button>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load test history"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchAttempts}
        />
      )}

      {/* Search Toolbar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-faint)]" />
        <input
          type="text"
          placeholder="Filter by test title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} className="rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && filteredAttempts.length === 0 && !errorInfo && (
        <EmptyState
          title="No completed test attempts found"
          description="Every sprint, past-paper simulator, or mock exam you take will be logged here with detailed question derivations."
          action={{
            label: 'Start Practice Session',
            onClick: onStartNewTest,
          }}
        />
      )}

      {/* Attempts List */}
      {!isLoading && filteredAttempts.length > 0 && (
        <div className="space-y-3">
          {filteredAttempts.map((att) => {
            const formattedDate = new Date(att.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const minutesSpent = Math.max(1, Math.round((att.timeSpentSeconds || 0) / 60));
            const scoreColor =
              att.percentage >= 75
                ? 'text-[#34D399]'
                : att.percentage >= 50
                ? 'text-amber-400'
                : 'text-[#F87171]';

            return (
              <Card
                key={att.id || att.createdAt}
                variant="glass"
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all cursor-pointer group"
                onClick={() => setActiveReviewAttempt(att)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="student" size="sm">
                      {att.subject || 'Entrance Test'}
                    </Badge>
                    <span className="text-xs text-[var(--text-faint)] font-mono">
                      {att.testType || 'Practice'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[var(--brand-2)] transition-colors">
                    {att.title || 'Practice Sprint'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                      {minutesSpent} min spent
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{att.correctCount} correct</span>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{att.wrongCount} wrong</span>
                    {att.unattemptedCount ? (
                      <>
                        <span>•</span>
                        <span className="text-[var(--text-faint)]">{att.unattemptedCount} skipped</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/8">
                  <div className="text-right">
                    <span className={`text-2xl font-black font-mono ${scoreColor}`}>
                      {att.percentage}%
                    </span>
                    <span className="text-xs text-[var(--text-faint)] block font-mono">
                      {att.score} / {att.totalQuestions} Marks
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed Answer Review Modal */}
      {activeReviewAttempt && (
        <Modal
          isOpen={Boolean(activeReviewAttempt)}
          onClose={() => setActiveReviewAttempt(null)}
          title={`Attempt Review: ${activeReviewAttempt.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-left">
            {/* Score Breakdown Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
              <div>
                <span className="text-[10px] text-[var(--text-faint)] uppercase font-bold block">
                  Score Percentage
                </span>
                <span className="text-xl font-extrabold text-[#34D399] font-mono">
                  {activeReviewAttempt.percentage}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] uppercase font-bold block">
                  Total Questions
                </span>
                <span className="text-xl font-extrabold text-white font-mono">
                  {activeReviewAttempt.totalQuestions}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] uppercase font-bold block">
                  Correct / Wrong
                </span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  <span className="text-emerald-400">{activeReviewAttempt.correctCount}</span> /{' '}
                  <span className="text-rose-400">{activeReviewAttempt.wrongCount}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] uppercase font-bold block">
                  Time Spent
                </span>
                <span className="text-xl font-extrabold text-white font-mono">
                  {Math.round((activeReviewAttempt.timeSpentSeconds || 0) / 60)}m
                </span>
              </div>
            </div>

            {/* Topic Breakdown if available */}
            {activeReviewAttempt.topicBreakdown && Object.keys(activeReviewAttempt.topicBreakdown).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Topic Accuracy Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(activeReviewAttempt.topicBreakdown).map(([topic, stat]) => (
                    <div
                      key={topic}
                      className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-white">{topic}</span>
                      <span className="text-xs font-mono font-bold text-[var(--brand-2)]">
                        {stat.correct} / {stat.total} ({Math.round((stat.correct / stat.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-blue-900/20 border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
              💡 <span className="font-bold text-white">Boardy Tip:</span> Reviewing incorrect answers immediately after completing a timed mock reinforces pattern recognition and eliminates recurring formula mistakes.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActiveReviewAttempt(null)}
              >
                Close Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
