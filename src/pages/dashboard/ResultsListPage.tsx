import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckCircle, Clock, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AttemptDoc } from '@/types/index';

function formatTimestampDate(val: unknown): string {
  if (!val) return 'Recent';
  let ms = Date.now();
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) ms = d.getTime();
  } else if (typeof val === 'object' && val !== null) {
    if ('toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
      ms = (val as { toMillis: () => number }).toMillis();
    } else if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      ms = (val as { seconds: number }).seconds * 1000;
    }
  }
  return new Date(ms).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ResultsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<AttemptDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);

  const loadAttempts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ attempts?: AttemptDoc[] }>(
        `/api/practice-attempts?uid=${encodeURIComponent(user.uid)}&limit=20&offset=0`
      );
      const docs = res.attempts || [];
      setAttempts(docs.filter((a) => a.status === 'completed' || a.score !== undefined));
      setOffset(docs.length);
      setHasMore(docs.length === 20);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load test history';
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleLoadMore = async () => {
    if (!user || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get<{ attempts?: AttemptDoc[] }>(
        `/api/practice-attempts?uid=${encodeURIComponent(user.uid)}&limit=20&offset=${offset}`
      );
      const docs = res.attempts || [];
      const filtered = docs.filter((a) => a.status === 'completed' || a.score !== undefined);
      setAttempts((prev) => [...prev, ...filtered]);
      setOffset((prev) => prev + docs.length);
      setHasMore(docs.length === 20);
    } catch (err) {
      console.warn('[ResultsListPage] Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const totalTests = attempts.length;
  const avgAccuracy =
    totalTests > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / totalTests)
      : 0;
  const totalQuestionsSolved = attempts.reduce((sum, a) => sum + (a.correctAnswers ?? 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Test Results & History
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Review every attempt, identify patterns in mistakes, and track accuracy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={loadAttempts} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/practice')}>
            Start New Drill
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <BarChart2 size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tests Attempted</span>
          </div>
          <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
            {totalTests}
          </span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Accuracy</span>
          </div>
          <span
            className="font-display tabular-nums"
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: avgAccuracy >= 70 ? 'var(--success)' : avgAccuracy >= 40 ? 'var(--warning)' : '#D71921',
            }}
          >
            {avgAccuracy}%
          </span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Clock size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correct MCQs</span>
          </div>
          <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: '#D71921' }}>
            {totalQuestionsSolved}
          </span>
        </GlassCard>
      </div>

      {/* Attempts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={80} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      ) : error ? (
        <ErrorState title="Could not load attempts" error={error} onRetry={loadAttempts} />
      ) : attempts.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} className="text-[#D71921]" />}
          title="No attempts yet"
          description="Start your first practice test to see your performance metrics and mistakes review here."
          actionLabel="Start a Practice Drill"
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {attempts.map((att) => {
            const dateStr = formatTimestampDate(att.createdAt);

            const pct = att.percentage ?? 0;
            const score = att.score ?? 0;
            const total = att.totalQuestions ?? 0;

            return (
              <GlassCard
                key={att.id}
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  cursor: 'pointer',
                  borderLeft: `4px solid ${pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921'}`,
                }}
                onClick={() => navigate(`/test/${att.id}/result`)}
                hover
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {att.subject ?? 'Practice Drill'}
                    </h3>
                    {att.university && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--surface-hover)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {att.university}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-faint)' }}>
                    <span>{dateStr}</span>
                    <span>·</span>
                    <span>
                      {att.correctAnswers ?? 0} correct / {att.wrongAnswers ?? 0} wrong
                    </span>
                    {att.timeTakenSeconds && (
                      <>
                        <span>·</span>
                        <span>{Math.round(att.timeTakenSeconds / 60)} min</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="font-display tabular-nums"
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921',
                      }}
                    >
                      {pct}%
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {score} / {total} marks
                    </span>
                  </div>

                  <Button variant="secondary" size="sm" onClick={() => navigate(`/test/${att.id}/result`)}>
                    Review <ArrowRight size={13} />
                  </Button>
                </div>
              </GlassCard>
            );
          })}

          {hasMore && (
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading older results...' : 'Load older test results'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsListPage;
