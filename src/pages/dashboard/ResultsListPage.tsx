import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { LineLoader } from '@/components/ui/LineLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckCircle, Clock, ArrowRight, RefreshCw, BarChart2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AttemptDoc } from '@/types/index';
import { getMyTestAttempts, type AmbassadorTestAttempt } from '@/services/ambassadorTestService';
import { showApiToast } from '@/lib/api';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';

function getTimestampSeconds(val: unknown): number {
  if (!val || typeof val !== 'object') return 0;
  if ('seconds' in val && typeof (val as { seconds: unknown }).seconds === 'number') {
    return (val as { seconds: number }).seconds;
  }
  return 0;
}

function formatTimestampDate(val: unknown): string {
  if (!val) return 'Recent';
  let ms = Date.now();
  if (typeof val === 'object' && val !== null) {
    if ('toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
      ms = (val as { toMillis: () => number }).toMillis();
    } else if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      ms = (val as { seconds: number }).seconds * 1000;
    }
  } else if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) ms = parsed;
  }
  return new Date(ms).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDurationLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ResultsListPage() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<AttemptDoc[]>([]);
  const [grandLineAttempts, setGrandLineAttempts] = useState<AmbassadorTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);

  const studentFallbackName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Student';

  const loadAttempts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const grandLinePromise = getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]);
      // Query attempts matching user ID with limit 20
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const [snap, glList] = await Promise.all([getDocs(q), grandLinePromise]);
      setGrandLineAttempts(glList);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
      setAttempts(docs.filter((a) => a.status === 'completed' || a.score !== undefined));
      setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === 20);
    } catch (err: unknown) {
      console.warn('[ResultsListPage] Attempt query error:', err);
      // Fallback without compound index if needed
      try {
        const [snap, glList] = await Promise.all([
          getDocs(query(collection(db, 'attempts'), where('userId', '==', user.uid), limit(20))),
          getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]),
        ]);
        setGrandLineAttempts(glList);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
        docs.sort((a, b) => {
          const tA = getTimestampSeconds(a.createdAt);
          const tB = getTimestampSeconds(b.createdAt);
          return tB - tA;
        });
        setAttempts(docs.filter((a) => a.status === 'completed' || a.score !== undefined));
        setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
        setHasMore(snap.docs.length === 20);
      } catch (fallbackErr: unknown) {
        const glList = await getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]);
        setGrandLineAttempts(glList);
        if (glList.length === 0) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load test history';
          setError({ message: msg });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleLoadMore = async () => {
    if (!user || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(20)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
      const filtered = docs.filter((a) => a.status === 'completed' || a.score !== undefined);
      setAttempts((prev) => [...prev, ...filtered]);
      setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === 20);
    } catch (err) {
      console.warn('[ResultsListPage] Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const totalTests = attempts.length + grandLineAttempts.length;
  const sumPercentages =
    attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) +
    grandLineAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0);
  const avgAccuracy = totalTests > 0 ? Math.round(sumPercentages / totalTests) : 0;
  const totalQuestionsSolved =
    attempts.reduce((sum, a) => sum + (a.correctAnswers ?? 0), 0) +
    grandLineAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Test Results &amp; History
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Review every attempt, download verified drill PDFs, and track accuracy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={loadAttempts} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/grand-line')}>
            Grand Line Drills
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
        <LineLoader context="results" variant="section" />
      ) : error && grandLineAttempts.length === 0 ? (
        <ErrorState title="Could not load attempts" error={error} onRetry={loadAttempts} />
      ) : totalTests === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} className="text-[#D71921]" />}
          title="No attempts yet"
          description="Start your first Grand Line drill or practice test to see your performance metrics, mistake review, and downloadable result PDFs here."
          actionLabel="Explore Grand Line Drills"
          onAction={() => navigate('/grand-line')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grandLineAttempts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} className="text-[#D71921]" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Grand Line Verified Drill Attempts ({grandLineAttempts.length})
                </h2>
              </div>

              {grandLineAttempts.map((glAtt) => {
                const pct = glAtt.percentage ?? 0;
                const score = glAtt.score ?? 0;
                const total = glAtt.totalQuestions ?? 0;
                const dateStr = formatTimestampDate(glAtt.submittedAt);

                return (
                  <GlassCard
                    key={glAtt.id || glAtt.testId}
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
                    onClick={() => navigate(`/grand-line/test/${glAtt.testId}/run?mode=result`)}
                    hover
                  >
                    <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                          {glAtt.testTitle || 'Grand Line Drill'}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {glAtt.subject || 'General'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span>
                          {score} / {total} correct
                        </span>
                        <span>·</span>
                        <span>{formatDurationLabel(glAtt.timeTakenSeconds)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right', marginRight: 4 }}>
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

                      <PdfDownloadButton
                        variant="secondary"
                        label={isAdmin ? 'My Report' : 'Download PDF'}
                        className="text-xs py-1.5 px-3 h-8 font-semibold"
                        onDownload={async (onProgress, signal) => {
                          if (!glAtt.testId) return;
                          const { downloadDrillResultPdfByTestId } = await import(
                            '@/utils/testPdfExporter'
                          );
                          await downloadDrillResultPdfByTestId(
                            glAtt.testId,
                            glAtt,
                            studentFallbackName,
                            onProgress,
                            signal,
                            false
                          );
                          showApiToast('Result PDF downloaded successfully!', 'success');
                        }}
                      />

                      {isAdmin && (
                        <PdfDownloadButton
                          variant="outline"
                          label="Answer Key"
                          className="text-xs py-1.5 px-3 h-8 font-semibold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                          onDownload={async (onProgress, signal) => {
                            if (!glAtt.testId) return;
                            const { downloadDrillResultPdfByTestId } = await import(
                              '@/utils/testPdfExporter'
                            );
                            await downloadDrillResultPdfByTestId(
                              glAtt.testId,
                              glAtt,
                              studentFallbackName,
                              onProgress,
                              signal,
                              true
                            );
                            showApiToast('Answer Key PDF downloaded successfully!', 'success');
                          }}
                        />
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/grand-line/test/${glAtt.testId}/run?mode=result`);
                        }}
                      >
                        View Result <ArrowRight size={13} />
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {attempts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grandLineAttempts.length > 0 && (
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Practice Arena History ({attempts.length})
                </h2>
              )}
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
                    loading={loadingMore}
                    loadingMessages={['Loading older test results...']}
                  >
                    Load older test results
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsListPage;
