import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Trophy, Flame, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardItem {
  id: string;
  uid: string;
  displayName: string;
  university?: string;
  score: number;
  testsCompleted: number;
  accuracy: number;
  streak: number;
}

export function ArenaDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(50));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardItem));
      setLeaderboard(items);
    } catch (err: unknown) {
      console.warn('[ArenaDashboardPage] Query fallback:', err);
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), limit(50)));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardItem));
        items.sort((a, b) => (b.score || 0) - (a.score || 0));
        setLeaderboard(items);
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load leaderboard';
        setError({ message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const userRankIndex = leaderboard.findIndex((item) => item.uid === user?.uid);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Boardly Arena — National Leaderboard
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Ranked by verified MCQ test scores, test consistency, and current day streak.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={loadLeaderboard} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/practice')}>
            <Zap size={14} /> Compete in Drill
          </Button>
        </div>
      </div>

      {/* User's Current Standing Card */}
      {user && (
        <GlassCard
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderLeft: '4px solid #D71921',
          }}
        >
          <div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Your Arena Ranking
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: '#D71921' }}>
                {userRank ? `#${userRank}` : 'Unranked'}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {userRank
                  ? `in top ${Math.round((userRank / Math.max(1, leaderboard.length)) * 100)}% of active students`
                  : 'Complete your first practice test to join the leaderboard!'}
              </span>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/practice')}>
            Boost My Score
          </Button>
        </GlassCard>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      ) : error ? (
        <ErrorState title="Could not load leaderboard" error={error} onRetry={loadLeaderboard} />
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon={<Trophy size={40} className="text-[#D71921]" />}
          title="No scores recorded yet"
          description="Be the first student to claim the #1 spot on Pakistan's national entrance exam leaderboard!"
          actionLabel="Start a Practice Drill"
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-faint)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '12px 18px', width: 60 }}>Rank</th>
                  <th style={{ padding: '12px 16px' }}>Student</th>
                  <th style={{ padding: '12px 16px' }}>Target Campus</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Streak</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Accuracy</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => {
                  const isCurrentUser = item.uid === user?.uid;
                  const rank = idx + 1;

                  return (
                    <tr
                      key={item.id || item.uid}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isCurrentUser ? 'rgba(215, 25, 33, 0.08)' : 'transparent',
                        fontWeight: isCurrentUser ? 700 : 400,
                      }}
                      className="hover:bg-[var(--surface-hover)]"
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          className="font-display tabular-nums"
                          style={{
                            fontSize: rank <= 3 ? 16 : 14,
                            fontWeight: 800,
                            color: rank === 1 ? '#FBBF24' : rank === 2 ? '#E2E8F0' : rank === 3 ? '#FB923C' : 'var(--text-muted)',
                          }}
                        >
                          #{rank}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: isCurrentUser ? '#D71921' : 'var(--surface-hover)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              color: isCurrentUser ? 'white' : 'var(--text)',
                            }}
                          >
                            {(item.displayName || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <span style={{ color: 'var(--text)' }}>
                              {item.displayName || 'Student'}
                            </span>
                            {isCurrentUser && (
                              <span style={{ marginLeft: 6, fontSize: 10, background: '#D71921', color: 'white', padding: '1px 6px', borderRadius: 999 }}>
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {item.university || 'General'}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: item.streak > 0 ? '#D71921' : 'var(--text-faint)', fontSize: 12, fontWeight: 700 }}>
                          <Flame size={13} /> {item.streak ?? 0}d
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {Math.round(item.accuracy ?? 0)}%
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span className="font-display tabular-nums" style={{ fontSize: 16, fontWeight: 800, color: '#D71921' }}>
                          {Math.round(item.score ?? 0)} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default ArenaDashboardPage;
