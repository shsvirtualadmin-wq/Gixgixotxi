import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Trophy,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Users,
} from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import type { PublicCrewSummary } from '@/types/crew';
import {
  fetchCrewLeaderboard,
  joinCrew,
  cancelJoinRequest,
} from '@/services/crewService';
import { evaluateUserEligibility } from '@/services/crewBackend';
import { CrewDetailsModal } from './CrewDetailsModal';
import { CreateCrewModal } from './CreateCrewModal';
import {
  CrewGlassSlider,
  getCrewBtnHandlers,
  type CrewSliderOption,
} from './CrewGlassPrimitives';

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
  externalCreateTrigger?: number;
}

type CrewFilterId = 'all' | 'open' | 'request';
type CrewSortId = 'questions' | 'streak' | 'accuracy';

const FILTER_OPTIONS: CrewSliderOption<CrewFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open to join' },
  { id: 'request', label: 'Request only' },
];

const SORT_OPTIONS: CrewSliderOption<CrewSortId>[] = [
  { id: 'questions', label: 'Questions' },
  { id: 'streak', label: 'Streak' },
  { id: 'accuracy', label: 'Accuracy' },
];

export const InAppLeaderboard: React.FC<InAppLeaderboardProps> = ({
  currentUser,
  onCrewJoined,
  externalCreateTrigger,
}) => {
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<CrewFilterId>('all');
  const [sortBy, setSortBy] = useState<CrewSortId>('questions');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedCrew, setSelectedCrew] = useState<PublicCrewSummary | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      setCreateModalOpen(true);
    }
  }, [externalCreateTrigger]);

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
        offset: (page - 1) * limit,
        limit,
      });
      setCrews(res.crews);
      setTotalCount(res.total);
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

  const filteredCrews = useMemo(() => {
    return [...crews]
      .filter((c) => {
        if (filter === 'all') return true;
        if (filter === 'open') return c.joinMode === 'direct' && !c.isClosed;
        if (filter === 'request') return c.joinMode === 'request' && !c.isClosed;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
        if (sortBy === 'accuracy') return (b.accuracy ?? 85) - (a.accuracy ?? 85);
        return (b.questionsSolved ?? b.score ?? 0) - (a.questionsSolved ?? a.score ?? 0);
      });
  }, [crews, filter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <section className="cw-card space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="cw-font-doto text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--cw-text)' }}>
            National Crew Leaderboard
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
            All registered study crews across Pakistan, ranked by solved MCQs and streaks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          {...getCrewBtnHandlers()}
          className="cw-btn cw-btn-red shrink-0"
        >
          <Plus size={16} strokeWidth={2.2} />
          <span>Create Crew</span>
        </button>
      </div>

      {actionError && (
        <div
          className="cw-lb-row-me flex items-center gap-2.5 text-xs font-semibold"
          style={{ color: 'var(--cw-red-text)' }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Sliders + Sort Sliders + Rounded Search Pill */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CrewGlassSlider
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter crews by join mode"
            trackVariant="card2"
          />
          <CrewGlassSlider
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            ariaLabel="Sort crews by metric"
            trackVariant="card2"
          />
        </div>

        {/* Rounded Search Pill */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--cw-muted)' }}
          />
          <input
            type="text"
            placeholder="Search crews by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cw-pill-input w-full h-11 pl-11 pr-4 text-sm font-medium"
          />
        </div>
      </div>

      {/* Crew Rows */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-[22px] animate-pulse"
              style={{ backgroundColor: 'var(--cw-card2)' }}
            />
          ))}
        </div>
      ) : filteredCrews.length === 0 ? (
        <div
          className="rounded-[22px] p-8 text-center space-y-2"
          style={{
            backgroundColor: 'var(--cw-card2)',
            boxShadow: 'inset 0 0 0 1px var(--cw-line)',
          }}
        >
          <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--cw-card)', color: 'var(--cw-muted)' }}>
            <Trophy size={18} />
          </div>
          <h3 className="cw-font-doto text-base font-extrabold" style={{ color: 'var(--cw-text)' }}>
            No Matching Crews
          </h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--cw-muted)' }}>
            {debouncedSearch
              ? `No crews found for "${debouncedSearch}".`
              : 'No study squads currently fit this filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCrews.map((c, idx) => {
            const isUserCrew = currentUser.crewId === c.id;
            const eligibility = evaluateUserEligibility(c, {
              uid: currentUser.uid,
              streak: currentUser.streak,
              crewId: currentUser.crewId,
            });
            const isActionLoading = actionLoadingId === c.id;
            const displayRank = c.rank || idx + 1;
            const solvedCount = c.questionsSolved ?? c.score ?? 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCrew(c)}
                className={`${
                  isUserCrew ? 'cw-lb-row-me' : 'cw-lb-row'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer`}
              >
                {/* Left: 28px Gold Rank Badge, 34px Avatar in card2, Name, Member count */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="cw-rank-badge shrink-0">{displayRank}</span>

                  <div className="cw-avatar-34 shrink-0">
                    <MatrixAvatar
                      avatarKey={c.avatarKey}
                      variant={c.avatarVariant}
                      size={34}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-bold text-sm sm:text-[15px] truncate"
                        style={{ color: 'var(--cw-text)' }}
                      >
                        {c.name}
                      </span>

                      {/* PRO BADGE RULE: only show Pro chip when crew actually has active Pro */}
                      {Boolean(c.isPaidActive) && (
                        <span className="cw-chip cw-chip-pro">Pro</span>
                      )}

                      {isUserCrew && (
                        <span className="cw-chip cw-chip-you">You</span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 text-xs mt-0.5 flex-wrap"
                      style={{ color: 'var(--cw-muted)' }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        <span>
                          {c.memberCount} / {c.maxMembers || 30} members
                        </span>
                      </span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1">
                        {c.joinMode === 'direct' ? (
                          <>
                            <Unlock size={11} style={{ color: 'var(--cw-green)' }} />
                            <span>Open</span>
                          </>
                        ) : (
                          <>
                            <Lock size={11} style={{ color: 'var(--cw-gold)' }} />
                            <span>Request</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Solved count in Doto + Join (red) or Request (glass) button */}
                <div
                  className="flex items-center justify-between sm:justify-end gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-left sm:text-right">
                    <div
                      className="cw-font-doto text-sm sm:text-base font-extrabold tabular-nums"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      {solvedCount.toLocaleString()}{' '}
                      <span
                        className="cw-font-body text-xs font-medium"
                        style={{ color: 'var(--cw-muted)' }}
                      >
                        solved
                      </span>
                    </div>
                    <div
                      className="text-[11px] flex items-center sm:justify-end gap-1.5 font-semibold"
                      style={{ color: 'var(--cw-muted)' }}
                    >
                      <span
                        className="inline-flex items-center gap-0.5"
                        style={{ color: 'var(--cw-red-text)' }}
                      >
                        <Flame size={11} />
                        {c.streak || 1}d
                      </span>
                      <span>&bull;</span>
                      <span style={{ color: 'var(--cw-green)' }}>
                        {c.accuracy ?? 85}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {eligibility === 'eligible' ? (
                      c.joinMode === 'direct' ? (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleJoinDirect(c)}
                          {...getCrewBtnHandlers(isActionLoading)}
                          className="cw-btn cw-btn-red !py-2 !px-4 !text-xs"
                        >
                          {isActionLoading ? 'Joining...' : 'Join'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleRequestJoin(c)}
                          {...getCrewBtnHandlers(isActionLoading)}
                          className="cw-btn cw-btn-glass !py-2 !px-4 !text-xs"
                        >
                          {isActionLoading ? 'Sending...' : 'Request'}
                        </button>
                      )
                    ) : eligibility === 'pending' ? (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleCancelRequest(c.id)}
                        {...getCrewBtnHandlers(isActionLoading)}
                        className="cw-btn cw-btn-glass !py-2 !px-3.5 !text-xs"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedCrew(c)}
                        {...getCrewBtnHandlers()}
                        className="cw-btn cw-btn-glass !py-2 !px-3.5 !text-xs"
                      >
                        <Eye size={13} />
                        <span>View</span>
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
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid var(--cw-line)' }}
        >
          <span className="cw-font-doto text-xs font-bold" style={{ color: 'var(--cw-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              {...getCrewBtnHandlers(page <= 1)}
              className="cw-btn cw-icon-btn cw-btn-glass"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              {...getCrewBtnHandlers(page >= totalPages)}
              className="cw-btn cw-icon-btn cw-btn-glass"
              aria-label="Next page"
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
    </section>
  );
};
