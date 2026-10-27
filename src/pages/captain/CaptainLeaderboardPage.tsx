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
    <div className="max-w-[880px] mx-auto py-8 px-4 sm:px-6 pb-24 flex flex-col gap-6">
      <Link
        to="/captains"
        className="glass-pill px-3.5 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors self-start"
      >
        <ArrowLeft size={15} />
        <span>Back to Nakama Captains</span>
      </Link>

      {/* Hero Header */}
      <div className="glass-panel p-8 sm:p-10 rounded-[32px] text-center flex flex-col items-center gap-3">
        <div className="w-13 h-13 rounded-full bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Trophy size={26} />
        </div>

        <h1
          className="text-2xl sm:text-4xl font-extrabold text-[var(--text)] font-dot tracking-tight"
          style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
        >
          National Campus Captain Leaderboard
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-lg leading-relaxed">
          Top university test leaders across Pakistan ranked by verified student activations and mock test participation.
        </p>

        {/* Campus Filter Chips */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {campuses.map((camp) => {
            const active = selectedCampus === camp;
            return (
              <button
                key={camp}
                type="button"
                onClick={() => setSelectedCampus(camp)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'glass-pill text-[var(--muted)] hover:text-white'
                }`}
              >
                {camp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="glass-panel p-4 sm:p-6 rounded-[28px] flex flex-col gap-2.5">
        {loading ? (
          <Skeleton height={60} count={5} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--muted)]">
            <Building2 size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-[var(--text)]">No captains registered under {selectedCampus} yet</p>
            <p className="text-xs mt-1">Be the first captain to represent your campus!</p>
          </div>
        ) : (
          filtered.map((cap, idx) => {
            const rank = cap.rank ?? idx + 1;
            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? '#FBBF24' : rank === 2 ? '#E2E8F0' : rank === 3 ? '#FB923C' : 'var(--text-faint)';

            return (
              <div
                key={cap.id}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
                  isTop3
                    ? 'glass-row border-amber-500/30 bg-amber-500/[0.06]'
                    : 'glass-row hover:bg-white/[0.04]'
                }`}
              >
                {/* Left: Rank & Captain details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 font-dot"
                    style={{ color: rankColor }}
                  >
                    {rank === 1 ? <Trophy size={18} /> : rank <= 3 ? <Medal size={18} /> : `#${rank}`}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-bold text-[var(--text)] truncate">
                        {maskName(cap.studentName)}
                      </p>
                      {cap.tier && <Badge color={isTop3 ? 'warning' : 'muted'}>{cap.tier}</Badge>}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                      {cap.institution ?? 'University Campus'} {cap.city ? `· ${cap.city}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right: Activations & Points */}
                <div className="text-right shrink-0 pl-3">
                  <p className="font-dot text-sm sm:text-base font-extrabold text-amber-400">
                    {cap.points?.toLocaleString() ?? 0} pts
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
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
