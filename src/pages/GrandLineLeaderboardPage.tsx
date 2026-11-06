import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import {
  getGlobalGrandLineTopScorers,
  getAllPublicGrandLineTests,
  type AmbassadorTestDoc,
  type GlobalTopScorerEntry,
} from '@/services/ambassadorTestService';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  type PublicUserProfileSummary,
} from '@/services/publicProfileService';
import { isAdminAccount } from '@/constants/superAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeStudentDisplayName, buildEntitySlug } from '@/utils/privacy';

function formatTimeTaken(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-badge rank-badge--1';
  if (rank === 2) return 'rank-badge rank-badge--2';
  if (rank === 3) return 'rank-badge rank-badge--3';
  return 'rank-badge rank-badge--default';
}

export const GrandLineLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [scorers, setScorers] = useState<GlobalTopScorerEntry[]>([]);
  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [profilesByUid, setProfilesByUid] = useState<Record<string, PublicUserProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadLeaderboardData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [topList, publicTests] = await Promise.all([
        getGlobalGrandLineTopScorers(25),
        getAllPublicGrandLineTests().catch(() => [] as AmbassadorTestDoc[]),
      ]);
      setScorers(topList);
      setTests(publicTests.slice(0, 6));

      const uids = Array.from(
        new Set(
          topList
            .map((e) => (e.studentUid || '').trim())
            .filter((uid) => uid.length > 0)
        )
      );
      if (uids.length > 0) {
        const initialCached: Record<string, PublicUserProfileSummary> = {};
        for (const uid of uids) {
          const cached = getCachedPublicProfile(uid);
          if (cached) initialCached[uid] = cached;
        }
        if (Object.keys(initialCached).length > 0) {
          setProfilesByUid((prev) => ({ ...prev, ...initialCached }));
        }
        getPublicProfiles(uids)
          .then((fetched) => {
            setProfilesByUid((prev) => ({ ...prev, ...fetched }));
          })
          .catch(() => {
            // Keep cached/entry avatars on fallback
          });
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboardData();
  }, [loadLeaderboardData]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-2 sm:pt-3 pb-[calc(96px+env(safe-area-inset-bottom,0px))] px-4 sm:px-6 overflow-x-hidden">
      <PageMeta
        title="Grand Line Leaderboard — Live Standings & Top Scorers | Boardly"
        description="View real-time student rankings and top scorers across public Grand Line mock tests authored by Nakama Captains on Boardly."
        canonicalPath="/grand-line/leaderboard"
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Grand Line', href: '/grand-line' },
            { label: 'Leaderboard' },
          ]}
        />

        <section className="captain-glass-panel p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="section-chip-red mb-3">
              <Sparkles size={13} />
              <span>LIVE STANDINGS</span>
            </div>
            <h1 className="font-dot text-2xl sm:text-4xl font-bold text-[var(--text)] mb-2">
              Grand Line Top Scorers
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Real-time rankings from public Grand Line test attempts across Pakistan.
            </p>
          </div>
          <Link
            to="/grand-line"
            className="btn-primary min-h-[44px] px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Browse Public Tests</span>
            <ArrowRight size={14} />
          </Link>
        </section>

        <section className="captain-glass-panel p-4 sm:p-6 mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              GLOBAL TOP PERFORMERS
            </h2>
            {!loading && !loadError && scorers.length > 0 && (
              <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
                {scorers.length} {scorers.length === 1 ? 'student' : 'students'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="captain-glass-card h-[68px] animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="captain-glass-card p-8 text-center">
              <AlertTriangle size={26} className="text-[#D71921] mx-auto mb-2" />
              <p className="text-sm font-bold text-[var(--text)] mb-1">
                Could not load leaderboard standings
              </p>
              <p className="text-xs text-[var(--muted)] mb-4">
                Please check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void loadLeaderboardData()}
                className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          ) : scorers.length === 0 ? (
            <div className="captain-glass-card p-8 text-center">
              <Trophy size={26} className="text-[var(--muted)] mx-auto mb-2" />
              <p className="text-sm font-bold text-[var(--text)] mb-1">
                No attempts yet. Be the first.
              </p>
              <p className="text-xs text-[var(--muted)] mb-4">
                Nakama Captains publish tests on Grand Line anytime.
              </p>
              <Link
                to="/grand-line"
                className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold inline-flex items-center justify-center"
              >
                Explore Grand Line Tests
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scorers.map((entry, idx) => {
                const rank = entry.rank || idx + 1;
                const uid = (entry.studentUid || '').trim();
                const liveProfile = uid ? profilesByUid[uid] : undefined;
                const displayName =
                  (entry.userName || entry.studentName || entry.name || liveProfile?.displayName || '').trim() ||
                  'Student';
                const isCurrentUser = Boolean(user?.uid && uid && uid === user.uid);
                const isSuperAdminActor =
                  Boolean(liveProfile?.isSuperAdmin) || isAdminAccount(uid, displayName);

                return (
                  <div
                    key={`${uid || displayName}-${idx}`}
                    className={`ranking-glass-row min-h-[68px] flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3.5 ${
                      isCurrentUser ? 'ranking-glass-row--highlight' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <span className={getRankBadgeClass(rank)}>#{rank}</span>
                      <div className="w-[44px] h-[44px] shrink-0 flex items-center justify-center">
                        <BoardlyAvatar
                          uid={uid || `${rank}-${displayName}`}
                          name={displayName}
                          photoURL={liveProfile?.photoURL || entry.userAvatar || null}
                          avatar={liveProfile?.avatar || null}
                          equippedAvatarId={liveProfile?.equippedAvatarId || null}
                          customAvatarUrl={liveProfile?.customAvatarUrl || null}
                          equippedFrameId={liveProfile?.equippedFrameId || null}
                          isSuperAdmin={isSuperAdminActor}
                          size={44}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                            {displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D71921] text-white shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--muted)] font-mono tabular-nums truncate mt-0.5">
                          {entry.testTitle ? `${entry.testTitle} · ` : ''}
                          {formatTimeTaken(entry.timeTakenSeconds)} · {entry.percentage}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 whitespace-nowrap tabular-nums pl-2">
                      <span className="text-xs sm:text-sm font-bold font-mono text-[var(--text)] block whitespace-nowrap">
                        {entry.totalQuestions > 0
                          ? `${entry.score}/${entry.totalQuestions}`
                          : `${entry.score}`}
                      </span>
                      <span className="text-[11px] font-bold text-[#D71921] block whitespace-nowrap mt-0.5">
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {tests.length > 0 && (
          <section className="captain-glass-panel p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
              ACTIVE GRAND LINE TESTS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
              {tests.map((t) => {
                const qCount = t.questionCount || t.questions?.length || 0;
                return (
                  <Link
                    key={t.id}
                    to={`/grand-line/test/${buildEntitySlug(t.id, t.title)}`}
                    className="captain-glass-card captain-glass-card--interactive p-4 sm:p-5 h-full min-h-[112px] flex flex-col justify-between gap-2"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <span className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D71921]/12 text-[#D71921]">
                        {t.subject}
                      </span>
                      <h3 className="font-sans text-sm sm:text-base font-bold text-[var(--text)] leading-snug line-clamp-2">
                        {t.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--muted)] tabular-nums truncate pt-1">
                      {qCount} {qCount === 1 ? 'question' : 'questions'} · By{' '}
                      {sanitizeStudentDisplayName(t.creatorName, t.creatorUid)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GrandLineLeaderboardPage;
