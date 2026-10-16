import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { TrendingDown, AlertTriangle, CheckCircle, ArrowRight, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChapterStat {
  id: string;
  chapter: string;
  subject: string;
  correct: number;
  total: number;
}

export function WeakChaptersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ChapterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [launchingChapter, setLaunchingChapter] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'chapterStats'));
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          chapter: data.chapter || d.id,
          subject: data.subject || 'General',
          correct: Number(data.correct ?? 0),
          total: Number(data.total ?? 0),
        };
      });
      // Sort by accuracy ascending (weakest first)
      items.sort((a, b) => {
        const accA = a.total > 0 ? a.correct / a.total : 0;
        const accB = b.total > 0 ? b.correct / b.total : 0;
        return accA - accB;
      });
      setStats(items.filter((item) => item.total > 0));
    } catch (err: unknown) {
      console.error('[WeakChaptersPage] Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load chapter stats';
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleDrillChapter = async (item: ChapterStat) => {
    if (!user) return;
    setLaunchingChapter(item.chapter);
    try {
      const durationSeconds = 15 * 60; // 15 mins
      const endsAt = new Date(Date.now() + durationSeconds * 1000);
      const ref = await addDoc(collection(db, 'attempts'), {
        userId: user.uid,
        uid: user.uid,
        subject: item.subject,
        chapter: item.chapter,
        difficulty: 'Medium',
        totalQuestions: 15,
        timed: true,
        durationSeconds,
        endsAt,
        status: 'preparing',
        createdAt: serverTimestamp(),
      });
      navigate(`/test/${ref.id}`);
    } catch (err) {
      console.error('[WeakChaptersPage] Launch drill error:', err);
      setLaunchingChapter(null);
    }
  };

  const weakChapters = stats.filter((s) => (s.correct / s.total) < 0.5);
  const moderateChapters = stats.filter((s) => (s.correct / s.total) >= 0.5 && (s.correct / s.total) < 0.75);
  const masteredChapters = stats.filter((s) => (s.correct / s.total) >= 0.75);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Weak Chapters Diagnostic
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Real-time chapter breakdown derived from your completed tests. Focus drills on high-risk topics.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      ) : error ? (
        <ErrorState title="Could not load chapter analytics" error={error} onRetry={loadStats} />
      ) : stats.length === 0 ? (
        <EmptyState
          icon={<TrendingDown size={40} className="text-[#D71921]" />}
          title="No chapter analytics yet"
          description="Take practice tests in Physics, Math, and Chemistry. We will track your accuracy per chapter automatically."
          actionLabel="Start a Practice Drill"
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* High Priority (Weak) */}
          {weakChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#D71921' }}>
                <AlertTriangle size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  High-Risk Topics (Below 50% Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {weakChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid #D71921',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                            {ch.subject}
                          </span>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                            {ch.chapter}
                          </h3>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {ch.correct} / {ch.total} answered correctly ({acc}% accuracy)
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: '#D71921' }}>
                          {acc}%
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDrillChapter(ch)}
                          loading={launchingChapter === ch.chapter}
                        >
                          <Target size={13} /> Drill Topic
                        </Button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Moderate */}
          {moderateChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--warning)' }}>
                <BookOpen size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Needs Practice (50% – 75% Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {moderateChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid var(--warning)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                            {ch.subject}
                          </span>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                            {ch.chapter}
                          </h3>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {ch.correct} / {ch.total} answered correctly ({acc}% accuracy)
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>
                          {acc}%
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDrillChapter(ch)}
                          loading={launchingChapter === ch.chapter}
                        >
                          Drill <ArrowRight size={13} />
                        </Button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mastered */}
          {masteredChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--success)' }}>
                <CheckCircle size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Mastered Chapters (75%+ Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {masteredChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid var(--success)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                            {ch.subject}
                          </span>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                            {ch.chapter}
                          </h3>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {ch.correct} / {ch.total} correct ({acc}% accuracy)
                        </p>
                      </div>
                      <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                        {acc}%
                      </span>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeakChaptersPage;
