import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  getGlobalGrandLineTopScorers,
  getAllPublicGrandLineTests,
  type AmbassadorTestDoc,
} from '@/services/ambassadorTestService';
import { sanitizeStudentDisplayName, buildEntitySlug } from '@/utils/privacy';

export const GrandLineLeaderboardPage: React.FC = () => {
  const [scorers, setScorers] = useState<Array<{ name: string; score: number }>>([]);
  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getGlobalGrandLineTopScorers(20),
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
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

        <section className="glass-panel p-8 sm:p-10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="section-chip-red mb-3">
              <Sparkles size={13} />
              <span>Live Standings</span>
            </div>
            <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-2">
              Grand Line Top Scorers
            </h1>
            <p className="text-sm text-white/70">
              Real-time rankings from public Grand Line test attempts across Pakistan.
            </p>
          </div>
          <Link
            to="/grand-line"
            className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0"
          >
            <span>Browse Public Tests</span>
            <ArrowRight size={14} />
          </Link>
        </section>

        <section className="glass-panel p-6 sm:p-8 mb-8">
          <h2 className="font-dot text-xl font-bold text-white mb-4">
            Global Top Performers
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card h-14 animate-pulse" />
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
              {scorers.map((entry, idx) => (
                <div
                  key={`${entry.name}-${idx}`}
                  className="glass-row flex items-center justify-between p-4 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-dot text-sm font-bold text-[#D71921] w-8">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {sanitizeStudentDisplayName(entry.name)}
                    </span>
                  </div>
                  <span className="glass-pill px-3 py-1 text-xs font-bold text-white">
                    Score: {entry.score}
                  </span>
                </div>
              ))}
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
