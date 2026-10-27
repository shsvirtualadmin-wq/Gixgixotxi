import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Flame, Sparkles, ChevronLeft, ChevronRight, Lock, Unlock, Eye } from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import type { PublicCrewSummary } from '@/types/crew';
import { fetchCrewLeaderboard } from '@/services/crewService';
import { CrewDetailsModal } from './CrewDetailsModal';

interface PublicLeaderboardProps {
  currentUser?: {
    uid: string;
    email?: string;
    streak?: number;
    score?: number;
    crewId?: string | null;
  } | null;
}

export const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({ currentUser }) => {
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedCrew, setSelectedCrew] = useState<PublicCrewSummary | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load ranked crews from server source of truth
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchCrewLeaderboard({
          search: debouncedSearch,
          page,
          limit,
        });
        if (active) {
          setCrews(result.crews);
          setTotalCount(result.totalCount);
        }
      } catch (err) {
        console.warn('[PublicLeaderboard] Load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [debouncedSearch, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search study squad by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.05] border border-white/15 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/40 shadow-sm backdrop-blur-md transition-all"
          />
        </div>

        <div className="text-xs text-[var(--muted)] shrink-0 font-mono">
          {totalCount} {totalCount === 1 ? 'squad' : 'squads'} registered across Pakistan
        </div>
      </div>

      {/* Ranked Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-[24px] bg-white/[0.04] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : crews.length === 0 ? (
        /* Empty state: Never show placeholder cards */
        <div className="p-10 sm:p-14 rounded-[28px] glass-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 text-[var(--muted)] flex items-center justify-center mx-auto">
            <Trophy size={22} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] font-heading">No Study Squads Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {debouncedSearch
              ? `No crews matched "${debouncedSearch}". Try a different squad name.`
              : 'Be the first students in Pakistan to assemble a study crew and claim the #1 rank!'}
          </p>
          {!debouncedSearch && (
            <div className="pt-2">
              <Link to="/login?redirect=/dashboard/crew" className="btn-primary text-xs px-5 py-2.5" style={{ height: '42px' }}>
                Create First Squad
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {crews.map((c) => {
            const isUserCrew = currentUser && currentUser.crewId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCrew(c)}
                className={`p-3.5 sm:p-4 rounded-[24px] border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 min-h-[68px] hover:-translate-y-1 active:scale-[0.99] ${
                  isUserCrew
                    ? 'bg-[#181011]/90 border-[#D71921]/60 hover:border-[#D71921] shadow-[0_8px_24px_rgba(215,25,33,0.18)]'
                    : 'bg-[#0e0e13]/80 backdrop-blur-md border-white/12 hover:border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                }`}
              >
                {/* Left: Rank, Avatar, Name & Conditions */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Rank */}
                  <div className="w-8 sm:w-10 text-center shrink-0">
                    <span
                      className={`font-mono text-sm sm:text-base font-bold ${
                        c.rank === 1
                          ? 'text-[#D71921]'
                          : c.rank <= 3
                          ? 'text-white'
                          : 'text-[var(--muted)]'
                      }`}
                    >
                      #{c.rank}
                    </span>
                  </div>

                  {/* Dot-matrix Avatar */}
                  <div className="rounded-2xl overflow-hidden shrink-0 border border-white/10">
                    <MatrixAvatar
                      avatarKey={c.avatarKey}
                      variant={c.avatarVariant}
                      size={46}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm sm:text-base text-[var(--text)] truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                        {c.name}
                      </span>
                      {c.isPaidActive && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D71921]/20 border border-[#D71921]/50 text-[#D71921] flex items-center gap-0.5 shrink-0">
                          <Sparkles size={9} /> Large Crew
                        </span>
                      )}
                      {isUserCrew && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/60 text-emerald-400 shrink-0">
                          Your Squad
                        </span>
                      )}
                    </div>

                    {/* Conditions snippet */}
                    <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        {c.joinMode === 'direct' ? (
                          <>
                            <Unlock size={11} className="text-emerald-400" /> Direct
                          </>
                        ) : (
                          <>
                            <Lock size={11} className="text-amber-400" /> Request
                          </>
                        )}
                      </span>
                      <span>&bull;</span>
                      <span>
                        {c.minStreak > 0 ? `Min ${c.minStreak}d streak` : 'Anyone can join'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats & View Action */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                  <div className="text-right hidden xs:block">
                    <div className="text-sm sm:text-base font-bold font-heading text-[var(--text)]">
                      {c.questionsSolved ?? c.score} <span className="text-[10px] text-[var(--muted)] font-normal font-sans">solved</span>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] flex items-center justify-end gap-2 font-mono">
                      <span className="flex items-center gap-0.5 text-[#D71921] font-semibold">
                        <Flame size={11} /> {c.streak}d
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-semibold">
                        {c.accuracy ?? 85}% acc
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCrew(c);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="View squad details"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCrew && (
        <CrewDetailsModal
          summary={selectedCrew}
          currentUser={currentUser}
          onClose={() => setSelectedCrew(null)}
        />
      )}
    </div>
  );
};
