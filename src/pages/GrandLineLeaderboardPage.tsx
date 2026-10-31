import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import {
  getGlobalGrandLineTopScorers,
  getAllPublicGrandLineTests,
  type AmbassadorTestDoc,
  type GlobalTopScorerEntry,
} from '@/services/ambassadorTestService';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeStudentDisplayName, buildEntitySlug } from '@/utils/privacy';

function formatTimeTaken(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const GrandLineLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [scorers, setScorers] = useState<GlobalTopScorerEntry[]>([]);
  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getGlobalGrandLineTopScorers(25),
      getAllPublicGrandLineTests(),
    ])
      .then(([topList, publicTests]) => {
        if (!mounted) return;
        setScorers(topList);
        setTests(publicTests.slice(0, 6));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6 overflow-x-hidden">
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

        <section className="glass-panel p-6 sm:p-10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="section-chip-red mb-3">
              <Sparkles size={13} />
              <span>Live Standings</span>
            </div>
            <h1 className="font-dot text-2xl sm:text-4xl font-bold text-white mb-2">
              Grand Line Top Scorers
            </h1>
            <p className="text-sm text-white/70">
              Real-time rankings from public Grand Line test attempts across Pakistan.
            </p>
          </div>
          <Link
            to="/grand-line"
            className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Browse Public Tests</span>
            <ArrowRight size={14} />
          </Link>
        </section>

        <section className="glass-panel p-4 sm:p-8 mb-8 overflow-hidden">
          <h2 className="font-dot text-lg sm:text-xl font-bold text-white mb-4">
            Global Top Performers
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card h-16 animate-pulse" />
              ))}
            </div>
          ) : scorers.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Trophy size={26} className="text-white/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-white mb-1">
                No attempts yet. Be the first.
              </p>
              <p className="text-xs text-white/60 mb-4">
                Nakama Captains publish tests on Grand Line anytime.
              </p>
              <Link to="/grand-line" className="btn-primary px-5 py-2 text-xs font-semibold">
                Explore Grand Line Tests
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scorers.map((entry, idx) => {
                const rank = entry.rank || idx + 1;
                const displayName =
                  (entry.userName || entry.studentName || entry.name || '').trim() || 'Student';
                const isCurrentUser =
                  Boolean(user?.uid && entry.studentUid && entry.studentUid === user.uid);
                return (
                  <div
                    key={`${entry.studentUid || displayName}-${idx}`}
                    className={`glass-row flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border ${
                      isCurrentUser
                        ? 'border-[#D71921]/60 bg-[#D71921]/10'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span
                        className={`font-dot text-xs sm:text-sm font-bold w-6 sm:w-8 shrink-0 tabular-nums ${
                          rank === 1
                            ? 'text-amber-400'
                            : rank === 2
                            ? 'text-zinc-300'
                            : rank === 3
                            ? 'text-amber-600'
                            : 'text-[#D71921]'
                        }`}
                      >
                        #{rank}
                      </span>
                      <BoardlyAvatar
                        uid={entry.studentUid || `${rank}-${displayName}`}
                        name={displayName}
                        photoURL={entry.userAvatar || null}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D71921] text-white shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/55 truncate">
                          {entry.testTitle ? `${entry.testTitle} · ` : ''}
                          {formatTimeTaken(entry.timeTakenSeconds)} · {entry.percentage}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {entry.totalQuestions > 0
                          ? `${entry.score}/${entry.totalQuestions}`
                          : `${entry.score}`}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-[#D71921] block">
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
          <section className="glass-panel p-6 sm:p-8">
            <h2 className="font-dot text-xl font-bold text-white mb-4">
              Active Grand Line Tests
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map((t) => (
                <Link
                  key={t.id}
                  to={`/grand-line/test/${buildEntitySlug(t.id, t.title)}`}
                  className="glass-card-interactive p-5 block"
                >
                  <span className="text-[11px] font-semibold uppercase text-[#D71921]">
                    {t.subject}
                  </span>
                  <h3 className="font-dot text-base font-bold text-white mt-1 mb-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-white/60">
                    {t.questionCount || t.questions?.length || 0} Questions · By{' '}
                    {sanitizeStudentDisplayName(t.creatorName, t.creatorUid)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GrandLineLeaderboardPage;
