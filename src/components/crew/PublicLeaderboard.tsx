import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Trophy,
  Flame,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Eye,
  Users,
} from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { ProBadge } from '@/components/ui/ProBadge';
import type { PublicCrewSummary } from '@/types/crew';
import { fetchCrewLeaderboard } from '@/services/crewService';
import { CrewDetailsModal } from './CrewDetailsModal';
import {
  CrewGlassSlider,
  getCrewBtnHandlers,
  type CrewSliderOption,
} from './CrewGlassPrimitives';

interface PublicLeaderboardProps {
  currentUser?: {
    uid: string;
    email?: string;
    streak?: number;
    score?: number;
    crewId?: string | null;
  } | null;
}

type PublicFilterId = 'all' | 'open' | 'request';

const FILTER_OPTIONS: CrewSliderOption<PublicFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open to join' },
  { id: 'request', label: 'Request only' },
];

export const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<PublicFilterId>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedCrew, setSelectedCrew] = useState<PublicCrewSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchCrewLeaderboard({
          search: debouncedSearch,
          offset: (page - 1) * limit,
          limit,
        });
        if (active) {
          setCrews(result.crews);
          setTotalCount(result.total);
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

  const filteredCrews = useMemo(() => {
    return crews.filter((c) => {
      if (filter === 'all') return true;
      if (filter === 'open') return c.joinMode === 'direct' && !c.isClosed;
      if (filter === 'request') return c.joinMode === 'request' && !c.isClosed;
      return true;
    });
  }, [crews, filter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <section className="cw-card space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2
            className="cw-font-doto text-xl sm:text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--cw-text)' }}
          >
            National Crew Leaderboard
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
            {totalCount} {totalCount === 1 ? 'squad' : 'squads'} registered across Pakistan
          </p>
        </div>
      </div>

      {/* Filter Slider + Rounded Search Pill */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        <CrewGlassSlider
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter crews by join mode"
          trackVariant="card2"
        />

        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--cw-muted)' }}
          />
          <input
            type="text"
            placeholder="Search study squad by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cw-pill-input w-full h-11 pl-11 pr-4 text-sm font-medium"
          />
        </div>
      </div>

      {/* Ranked Squad Rows */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-[22px] animate-pulse"
              style={{ backgroundColor: 'var(--cw-card2)' }}
            />
          ))}
        </div>
      ) : filteredCrews.length === 0 ? (
        <div
          className="rounded-[22px] p-10 text-center space-y-3"
          style={{
            backgroundColor: 'var(--cw-card2)',
            boxShadow: 'inset 0 0 0 1px var(--cw-line)',
          }}
        >
          <div
            className="w-11 h-11 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'var(--cw-card)', color: 'var(--cw-muted)' }}
          >
            <Trophy size={20} />
          </div>
          <h3 className="cw-font-doto text-base font-extrabold" style={{ color: 'var(--cw-text)' }}>
            No Study Squads Found
          </h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--cw-muted)' }}>
            {debouncedSearch
              ? `No crews matched "${debouncedSearch}". Try a different squad name.`
              : 'Be the first students in Pakistan to assemble a study crew and claim the #1 rank!'}
          </p>
          {!debouncedSearch && (
            <div className="pt-1">
              <Link
                to="/login?redirect=/dashboard/crew"
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-red"
              >
                Create First Squad
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCrews.map((c, idx) => {
            const isUserCrew = Boolean(currentUser && currentUser.crewId === c.id);
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
                {/* Left: 28px Gold Rank Badge, 34px Avatar in card2, Name, Member Count */}
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

                      {/* PRO BADGE RULE: Show Pro badge ONLY when crew has active Pro */}
                      {Boolean(c.isPaidActive) && (
                        <ProBadge design={(c as any).proBadge || 'ember'} size="sm" listMode />
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

                {/* Right: Solved Count + Join (red) or Request (glass) button */}
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

                  {!c.isClosed && c.memberCount < (c.maxMembers || 30) ? (
                    c.joinMode === 'direct' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) {
                            navigate('/crew/my');
                          } else {
                            setSelectedCrew(c);
                          }
                        }}
                        {...getCrewBtnHandlers()}
                        className="cw-btn cw-btn-red !py-2 !px-4 !text-xs"
                      >
                        Join
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedCrew(c)}
                        {...getCrewBtnHandlers()}
                        className="cw-btn cw-btn-glass !py-2 !px-4 !text-xs"
                      >
                        Request
                      </button>
                    )
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
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Details Modal */}
      {selectedCrew && (
        <CrewDetailsModal
          summary={selectedCrew}
          currentUser={currentUser}
          onClose={() => setSelectedCrew(null)}
        />
      )}
    </section>
  );
};
