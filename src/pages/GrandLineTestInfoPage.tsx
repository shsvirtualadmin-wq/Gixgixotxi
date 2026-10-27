import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  BookOpen,
  User,
  Play,
  Lock,
  Share2,
  Check,
  Award,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import {
  getAmbassadorTestById,
  getTestLeaderboard,
  type AmbassadorTestDoc,
  type PublicLeaderboardEntry,
} from '@/services/ambassadorTestService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { sanitizeStudentDisplayName, extractIdFromSlug, buildEntitySlug } from '@/utils/privacy';

export const GrandLineTestInfoPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const testId = extractIdFromSlug(idSlug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [test, setTest] = useState<AmbassadorTestDoc | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getAmbassadorTestById(testId),
      getTestLeaderboard(testId),
    ])
      .then(([docData, lb]) => {
        if (!mounted) return;
        setTest(docData);
        setLeaderboard(lb);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4">
        <div className="max-w-4xl mx-auto glass-panel p-8 h-64 animate-pulse" />
      </div>
    );
  }

  if (!test || test.status === 'unpublished') {
    return <NotFoundPage />;
  }

  const canonicalSlug = buildEntitySlug(test.id, test.title);
  const canonicalPath = `/grand-line/test/${canonicalSlug}`;
  const creatorName = sanitizeStudentDisplayName(test.creatorName, test.creatorUid);
  const qCount = test.questionCount || test.questions?.length || 0;
  const estMinutes = Math.max(10, qCount * 1.5);

  const handleStartTest = () => {
    requireAuth(
      `take the "${test.title}" Grand Line test and record your ranking`,
      () => {
        navigate(`/grand-line/test/${test.id}/run`);
      },
      `/grand-line/test/${test.id}/run`
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${test.title} — Grand Line Public Test by ${creatorName}`}
        description={`View syllabus, question count, duration, and live top scorers for "${test.title}" (${test.subject}) created by Nakama Captain ${creatorName} on Boardly Grand Line.`}
        canonicalPath={canonicalPath}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Grand Line', href: '/grand-line' },
            { label: test.title },
          ]}
        />

        <section className="glass-panel p-7 sm:p-10 mb-8 border border-[#D71921]/30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="section-chip-red">
              <Trophy size={13} />
              <span>Grand Line Public Mock Test</span>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`https://boardly.cfd${canonicalPath}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="glass-pill px-3 py-1.5 text-xs text-white/75 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copied ? 'Link Copied' : 'Share Test'}</span>
            </button>
          </div>

          <h1 className="font-dot text-2xl sm:text-4xl font-bold text-white mb-3">
            {test.title}
          </h1>

          <p className="text-sm text-white/70 mb-6">
            Published by Nakama Captain{' '}
            <Link
              to={`/captains/${encodeURIComponent(test.creatorUid)}`}
              className="text-white font-semibold hover:text-[#D71921] underline underline-offset-2"
            >
              {creatorName}
            </Link>{' '}
            for {test.subject} entrance &amp; board preparation.
          </p>

          {/* Info Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="glass-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                <BookOpen size={13} className="text-[#D71921]" />
                <span>Subject / Syllabus</span>
              </div>
              <p className="text-sm font-bold text-white">{test.subject || 'Multi-Subject'}</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                <Award size={13} className="text-[#D71921]" />
                <span>Questions</span>
              </div>
              <p className="text-sm font-bold text-white">{qCount} MCQs</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                <Clock size={13} className="text-[#D71921]" />
                <span>Est. Duration</span>
              </div>
              <p className="text-sm font-bold text-white">{Math.round(estMinutes)} Mins</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                <User size={13} className="text-[#D71921]" />
                <span>Captain Author</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{creatorName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStartTest}
              className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {user ? <Play size={15} /> : <Lock size={15} />}
              <span>{user ? 'Start Timed Test Now' : 'Sign in to Take Test'}</span>
            </button>

            <Link
              to="/grand-line/leaderboard"
              className="btn-secondary px-5 py-3 text-xs sm:text-sm font-semibold"
            >
              Global Standings
            </Link>
          </div>
        </section>

        {/* Top Scorers Panel */}
        <section className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-dot text-xl font-bold text-white">
                Top Scorers on This Test
              </h2>
              <p className="text-xs text-white/60">
                Real-time rankings from verified Grand Line test attempts.
              </p>
            </div>
            <span className="glass-pill px-3 py-1 text-xs text-white/70">
              {leaderboard.length} Attempt{leaderboard.length === 1 ? '' : 's'}
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Trophy size={24} className="text-white/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">
                No attempts yet. Be the first.
              </p>
              <p className="text-xs text-white/55">
                Sign in and complete this test to claim the #1 spot on the leaderboard.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.slice(0, 15).map((entry) => (
                <div
                  key={`${entry.rank}-${entry.name}`}
                  className="glass-row flex items-center justify-between p-3.5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-dot text-sm font-bold text-[#D71921] w-7">
                      #{entry.rank}
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {sanitizeStudentDisplayName(entry.name)}
                      </p>
                      <p className="text-[11px] text-white/50">{entry.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {entry.score} / {entry.totalQuestions}
                    </span>
                    <span className="block text-[10px] text-white/50">
                      {entry.timeTakenSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GrandLineTestInfoPage;
