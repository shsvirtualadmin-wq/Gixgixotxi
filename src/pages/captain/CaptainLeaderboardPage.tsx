import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Medal, ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CaptainEntry {
  id: string;
  studentName?: string;
  institution?: string;
  city?: string;
  points?: number;
  activeUsersCount?: number;
  referralCount?: number;
  tier?: string;
  rank?: number;
}

export function CaptainLeaderboardPage() {
  const [captains, setCaptains] = useState<CaptainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState('All');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const q = query(collection(db, 'captains'), orderBy('points', 'desc'), limit(30));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const list = snap.docs.map((d, idx) => ({
            id: d.id,
            rank: idx + 1,
            ...d.data(),
          })) as CaptainEntry[];
          setCaptains(list);
        } else {
          setCaptains([]);
        }
      } catch (err) {
        console.warn('[CaptainLeaderboard] Fetch note:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Name masking helper: "First L."
  const maskName = (name?: string) => {
    if (!name) return 'Campus Captain';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return parts[0];
  };

  const campuses = ['All', 'FAST-NUCES', 'NUST', 'GIKI', 'LUMS', 'NED'];

  const filtered = captains.filter((c) => {
    if (selectedCampus === 'All') return true;
    return c.institution?.toUpperCase().includes(selectedCampus.toUpperCase());
  });

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.25rem 5rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Link
        to="/captain"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={15} />
        Back to Captain Cockpit
      </Link>

      {/* Hero Header */}
      <div
        className="glass glass-animated-border"
        style={{
          borderRadius: 'var(--r-hero)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
          }}
        >
          <Trophy size={26} />
        </div>

        <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, color: 'var(--text)' }}>
          National Campus Captain Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.6 }}>
          Top university test leaders across Pakistan ranked by verified student activations and mock test participation.
        </p>

        {/* Campus Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
          {campuses.map((camp) => {
            const active = selectedCampus === camp;
            return (
              <button
                key={camp}
                onClick={() => setSelectedCampus(camp)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--r-pill)',
                  border: `1px solid ${active ? 'var(--captain-from)' : 'var(--border)'}`,
                  background: active ? 'rgba(245, 158, 11, 0.18)' : 'var(--surface)',
                  color: active ? 'var(--captain-from)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 160ms',
                }}
              >
                {camp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <Skeleton height={60} count={5} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
            <Building2 size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>No captains registered under {selectedCampus} yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Be the first captain to represent your campus!</p>
          </div>
        ) : (
          filtered.map((cap, idx) => {
            const rank = cap.rank ?? idx + 1;
            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? '#FBBF24' : rank === 2 ? '#E2E8F0' : rank === 3 ? '#FB923C' : 'var(--text-faint)';

            return (
              <div
                key={cap.id}
                className="glass-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--r-input)',
                  background: isTop3 ? 'rgba(245, 158, 11, 0.05)' : 'var(--surface)',
                  border: isTop3 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--border)',
                  gap: 12,
                }}
              >
                {/* Left: Rank & Captain details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      color: rankColor,
                      background: isTop3 ? 'rgba(255,255,255,0.06)' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    {rank === 1 ? <Trophy size={18} /> : rank <= 3 ? <Medal size={18} /> : `#${rank}`}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                        {maskName(cap.studentName)}
                      </p>
                      {cap.tier && <Badge color={isTop3 ? 'warning' : 'muted'}>{cap.tier}</Badge>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {cap.institution ?? 'University Campus'} {cap.city ? `· ${cap.city}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right: Activations & Points */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p className="tabular-nums" style={{ fontSize: 16, fontWeight: 800, color: 'var(--captain-from)' }}>
                    {cap.points?.toLocaleString() ?? 0} pts
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {cap.activeUsersCount ?? 0} active students
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
