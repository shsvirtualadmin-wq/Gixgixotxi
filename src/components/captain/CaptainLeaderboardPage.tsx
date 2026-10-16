import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy,
  Award,
  ArrowLeft,
  Users,
  Building,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { db, collection, query, orderBy, limit, getDocs } from '../../lib/firebase';
import { SeoHead } from '../common/SeoHead';

interface CaptainLeaderboardEntry {
  id: string;
  studentName?: string;
  fullName?: string;
  institution?: string;
  points?: number;
  referralCount?: number;
  activeUsersCount?: number;
}

interface CaptainLeaderboardPageProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const CaptainLeaderboardPage: React.FC<CaptainLeaderboardPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [captains, setCaptains] = useState<CaptainLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'captains'), orderBy('points', 'desc'), limit(30));
      const snap = await getDocs(q);
      const items: CaptainLeaderboardEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setCaptains(items);
    } catch (err) {
      console.warn('[CaptainLeaderboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const maskName = (name?: string) => {
    if (!name) return 'Captain';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#EAF0FF] font-sans p-4 sm:p-8">
      <SeoHead pathname="/captain/leaderboard" title="National Campus Captains Leaderboard" />
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <button
            onClick={() => {
              if (onBack) onBack();
              else if (onNavigate) onNavigate('/captain/dashboard');
              else if (typeof window !== 'undefined') window.history.back();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#A3B0CC] hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <button
            onClick={fetchStandings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3B0CC] hover:text-white cursor-pointer border border-white/10"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-900/30 to-amber-900/20 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-xs font-bold text-amber-300 border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>National Standings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campus Captains Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-[#A3B0CC] leading-relaxed">
              Verified campus outreach rankings across Pakistani colleges and universities. Points are awarded as students activate and practice tests.
            </p>
          </div>
        </div>

        {/* Standings Table */}
        <div className="p-6 rounded-3xl bg-[#0B1220] border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <h3 className="font-bold text-sm text-white">Top 30 Campus Leaders</h3>
            <span className="text-xs text-[#A3B0CC] font-mono">Updated Real-Time</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#A3B0CC] animate-pulse">
              Loading national captain standings...
            </div>
          ) : captains.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A3B0CC]">
              No active captains recorded yet. Be the first to register your campus!
            </div>
          ) : (
            <div className="space-y-2">
              {captains.map((cap, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const isSelf = user?.uid && cap.id === user.uid;
                const rawName = cap.studentName || cap.fullName || 'Captain';

                return (
                  <div
                    key={cap.id}
                    className={`p-4 rounded-2xl flex items-center justify-between gap-4 transition-all ${
                      isSelf
                        ? 'bg-amber-500/15 border-2 border-amber-500 shadow-md'
                        : isTop3
                        ? 'bg-white/8 border border-white/12'
                        : 'bg-white/4 border border-white/6'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/20'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/5 text-[#A3B0CC]'
                        }`}
                      >
                        {rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {maskName(rawName)}
                          </h4>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A3B0CC] truncate">
                          {cap.institution || 'University Representative'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                        {cap.points || 0} pts
                      </span>
                      <span className="text-[10px] text-[#A3B0CC] block font-mono">
                        {cap.activeUsersCount || 0} active recruits
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
