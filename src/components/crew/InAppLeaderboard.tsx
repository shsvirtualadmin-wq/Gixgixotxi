import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trophy, Sparkles, Lock, Unlock, Eye, AlertCircle, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import type { PublicCrewSummary } from '@/types/crew';
import { fetchCrewLeaderboard, joinCrew, cancelJoinRequest } from '@/services/crewService';
import { evaluateUserEligibility } from '@/services/crewBackend';
import { CrewDetailsModal } from './CrewDetailsModal';
import { CreateCrewModal } from './CreateCrewModal';

interface InAppLeaderboardProps {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
    streak?: number;
    score?: number;
    crewId?: string | null;
    avatarKey?: string | null;
    avatarVariant?: string | null;
  };
  onCrewJoined: () => void;
}

export const InAppLeaderboard: React.FC<InAppLeaderboardProps> = ({
  currentUser,
  onCrewJoined,
}) => {
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'request' | 'eligible'>('all');
  const [sortBy, setSortBy] = useState<'questions' | 'streak' | 'accuracy'>('questions');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedCrew, setSelectedCrew] = useState<PublicCrewSummary | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCrews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCrewLeaderboard({
        search: debouncedSearch,
        page,
        limit,
      });
      setCrews(res.crews);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.warn('[InAppLeaderboard] Failed to load crews:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadCrews();
  }, [loadCrews]);

  const handleJoinDirect = async (crew: PublicCrewSummary) => {
    setActionLoadingId(crew.id);
    setActionError(null);
    try {
      await joinCrew({
        crewId: crew.id,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          streak: currentUser.streak || 0,
          score: currentUser.score || 0,
          avatarKey: currentUser.avatarKey || undefined,
          avatarVariant: currentUser.avatarVariant || undefined,
        },
      });
      onCrewJoined();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join crew';
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestJoin = async (crew: PublicCrewSummary) => {
    setActionLoadingId(crew.id);
    setActionError(null);
    try {
      await joinCrew({
        crewId: crew.id,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          streak: currentUser.streak || 0,
          score: currentUser.score || 0,
          avatarKey: currentUser.avatarKey || undefined,
          avatarVariant: currentUser.avatarVariant || undefined,
        },
      });
      await loadCrews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit join request';
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (crewId: string) => {
    setActionLoadingId(crewId);
    setActionError(null);
    try {
      await cancelJoinRequest(crewId, currentUser.uid);
      await loadCrews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel request';
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter and sort crews based on active tab and sort criterion
  const filteredCrews = [...crews]
    .filter((c) => {
      const eligibilityResult = evaluateUserEligibility(
        c,
        {
          uid: currentUser.uid,
          streak: currentUser.streak,
          crewId: currentUser.crewId,
        }
      );
      const eligibility = eligibilityResult.state;

      if (filter === 'open') return c.joinMode === 'direct' && !c.isClosed;
      if (filter === 'request') return c.joinMode === 'request' && !c.isClosed;
      if (filter === 'eligible') return eligibility === 'eligible';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
      if (sortBy === 'accuracy') return (b.accuracy ?? 85) - (a.accuracy ?? 85);
      return (b.questionsSolved ?? b.score ?? 0) - (a.questionsSolved ?? a.score ?? 0);
    });

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6">
      {/* Top Banner: Create Crew CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-white">National Crew Leaderboard</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white">
              Live DB
            </span>
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.65)]">
            All registered study crews across Pakistan, ranked by questions solved, streak, and drill accuracy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Crew</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-[#D71921] text-[#D71921] text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs, Sort Options and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {([
            { id: 'all', label: 'All Crews' },
            { id: 'open', label: 'Open to Join' },
            { id: 'request', label: 'Request Only' },
            { id: 'eligible', label: 'Eligible for Me' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filter === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#141414] text-[rgba(255,255,255,0.65)] hover:text-white border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Options: Questions Solved, Streak, Accuracy */}
        <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.6)]">
          <span className="hidden sm:inline font-heading text-[11px] text-[rgba(255,255,255,0.4)]">Rank:</span>
          {(
            [
              { id: 'questions', label: 'Questions' },
              { id: 'streak', label: 'Streak' },
              { id: 'accuracy', label: 'Accuracy' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSortBy(s.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === s.id
                  ? 'bg-[#D71921] text-white font-bold'
                  : 'bg-[#141414] text-[rgba(255,255,255,0.6)] hover:text-white border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-60">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
          <input
            type="text"
            placeholder="Search crews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.12)] text-xs text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#D71921]"
          />
        </div>
      </div>

      {/* Ranked Squad List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#141414] animate-pulse" />
          ))}
        </div>
      ) : filteredCrews.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#141414] text-[rgba(255,255,255,0.4)] flex items-center justify-center mx-auto">
            <Trophy size={20} />
          </div>
          <h3 className="text-base font-bold font-heading text-white">No Matching Crews</h3>
          <p className="text-xs text-[rgba(255,255,255,0.6)] max-w-sm mx-auto">
            {debouncedSearch
              ? `No crews found for "${debouncedSearch}".`
              : 'No study squads currently fit this filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCrews.map((c) => {
            const isUserCrew = currentUser.crewId === c.id;
            const eligibilityResult = evaluateUserEligibility(
              c,
              {
                uid: currentUser.uid,
                streak: currentUser.streak,
                crewId: currentUser.crewId,
              }
            );
            const eligibility = eligibilityResult.state;

            const isActionLoading = actionLoadingId === c.id;

            return (
              <div
                key={c.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUserCrew
                    ? 'bg-[#181011] border-[#D71921]/70'
                    : 'bg-[#0A0A0A] border-[rgba(255,255,255,0.1)] hover:bg-[#111111]'
                }`}
              >
                {/* Left Side: Rank, Avatar, Title, Conditions */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-8 text-center shrink-0">
                    <span
                      className={`font-mono text-sm sm:text-base font-bold ${
                        c.rank === 1
                          ? 'text-[#D71921]'
                          : c.rank <= 3
                          ? 'text-white'
                          : 'text-[rgba(255,255,255,0.5)]'
                      }`}
                    >
                      #{c.rank}
                    </span>
                  </div>

                  <MatrixAvatar
                    avatarKey={c.avatarKey}
                    variant={c.avatarVariant}
                    size={46}
                    className="shrink-0"
                  />

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm sm:text-base text-white truncate">
                        {c.name}
                      </span>
                      {c.isPaidActive && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#D71921]/20 border border-[#D71921]/50 text-[#D71921] flex items-center gap-0.5 shrink-0">
                          <Sparkles size={9} /> Large Crew
                        </span>
                      )}
                      {isUserCrew && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/60 text-emerald-400 shrink-0">
                          Your Crew
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[rgba(255,255,255,0.6)] flex-wrap">
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
                        {c.minStreak > 0 ? `Min ${c.minStreak}d streak` : '0d streak required'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Score, Eligibility Badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(255,255,255,0.06)]">
                  {/* Score & Metrics: Solved, Streak, Accuracy */}
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold font-heading text-white">
                      {c.questionsSolved ?? c.score} <span className="text-[10px] text-[rgba(255,255,255,0.5)] font-normal font-sans">solved</span>
                    </div>
                    <div className="text-[11px] text-[rgba(255,255,255,0.6)] flex items-center sm:justify-end gap-2 font-mono">
                      <span className="flex items-center gap-0.5 text-[#D71921] font-semibold">
                        <Flame size={11} /> {c.streak}d
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-semibold">
                        {c.accuracy ?? 85}% acc
                      </span>
                    </div>
                  </div>

                  {/* Eligibility state badge */}
                  <div className="hidden md:block">
                    {eligibility === 'eligible' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
                        Eligible
                      </span>
                    )}
                    {eligibility === 'pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-400">
                        Request pending
                      </span>
                    )}
                    {eligibility === 'crew_full' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400">
                        Crew full
                      </span>
                    )}
                    {eligibility === 'locked_streak' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400" title={`Requires ${c.minStreak}d streak. You have ${currentUser.streak || 0}d.`}>
                        Locked: Needs {c.minStreak}d (you have {currentUser.streak || 0})
                      </span>
                    )}
                    {eligibility === 'already_in_crew' && !isUserCrew && (
                      <span className="text-[10px] text-neutral-400 italic">
                        In another crew
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCrew(c)}
                      className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[rgba(255,255,255,0.12)] text-xs text-white flex items-center gap-1 transition-colors"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>

                    {/* Join / Request / Pending CTA */}
                    {eligibility === 'eligible' && (
                      c.joinMode === 'direct' ? (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleJoinDirect(c)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                          {isActionLoading ? 'Joining...' : 'Join'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleRequestJoin(c)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                          {isActionLoading ? 'Sending...' : 'Request'}
                        </button>
                      )
                    )}

                    {eligibility === 'pending' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleCancelRequest(c.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.1)]">
          <span className="text-xs text-[rgba(255,255,255,0.5)] font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white disabled:opacity-40 hover:bg-[#1E1E1E]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white disabled:opacity-40 hover:bg-[#1E1E1E]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedCrew && (
        <CrewDetailsModal
          summary={selectedCrew}
          currentUser={currentUser}
          onClose={() => setSelectedCrew(null)}
          onJoin={handleJoinDirect}
          onRequest={handleRequestJoin}
        />
      )}

      {createModalOpen && (
        <CreateCrewModal
          creator={{
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            streak: currentUser.streak,
          }}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            onCrewJoined();
          }}
        />
      )}
    </div>
  );
};
