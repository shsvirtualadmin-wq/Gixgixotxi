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
  CheckCircle2,
  Download,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { NotFoundPage } from '@/pages/NotFoundPage';
import {
  getAmbassadorTestById,
  getTestLeaderboard,
  getMyTestAttempts,
  type AmbassadorTestDoc,
  type AmbassadorTestAttempt,
  type PublicLeaderboardEntry,
} from '@/services/ambassadorTestService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { sanitizeStudentDisplayName, extractIdFromSlug, buildEntitySlug } from '@/utils/privacy';
import { routes } from '@/utils/routes';
import { downloadDrillResultPdfByTestId } from '@/utils/testPdfExporter';
import { showApiToast } from '@/lib/api';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';

function formatTimeTaken(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const GrandLineTestInfoPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const testId = extractIdFromSlug(idSlug);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { requireAuth } = useAuthGate();

  const [test, setTest] = useState<AmbassadorTestDoc | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [myAttempt, setMyAttempt] = useState<AmbassadorTestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setTest(null);

    Promise.all([
      getAmbassadorTestById(testId, false, { view: 'info', silentErrorToast: true }),
      getTestLeaderboard(testId).catch(() => [] as PublicLeaderboardEntry[]),
      user ? getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]) : Promise.resolve([] as AmbassadorTestAttempt[]),
    ])
      .then(([docData, lb, attempts]) => {
        if (!mounted) return;
        setTest(docData);
        setLeaderboard(lb);
        if (user && Array.isArray(attempts)) {
          const found = attempts.find((a) => a.testId === testId) || null;
          setMyAttempt(found);
        } else {
          setMyAttempt(null);
        }
      })
      .catch((err: any) => {
        if (!mounted) return;
        if (err?.status === 404 || err?.code === 'NOT_FOUND') {
          setTest(null);
        } else {
          setLoadError(err?.rawMessage || err?.message || 'Could not load test details.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [testId, user, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-panel p-8 h-64 animate-pulse" />
          <div className="glass-panel p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 flex items-center justify-center">
        <div className="glass-panel p-8 max-w-md w-full text-center">
          <AlertTriangle size={28} className="text-[#D71921] mx-auto mb-3" />
          <h1 className="font-dot text-xl font-bold text-white mb-2">Could not load Grand Line drill</h1>
          <p className="text-xs text-white/65 mb-6">{loadError}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
            <Link to="/grand-line" className="btn-secondary px-5 py-2.5 text-xs font-semibold">
              Back to Grand Line
            </Link>
          </div>
        </div>
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
  const studentFallbackName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Student';

  const handleStartTest = () => {
    if (myAttempt) {
      navigate(routes.grandLineTestRun(test.id, 'result'));
      return;
    }
    requireAuth(
      `take the "${test.title}" Grand Line test and record your ranking`,
      () => {
        navigate(routes.grandLineTestRun(test.id));
      },
      routes.grandLineTestRun(test.id)
    );
  };

  const handleDownloadPdf = async () => {
    if (!myAttempt || downloadingPdf) return;
    setDownloadingPdf(true);
    setPdfProgressText('Formatting PDF...');
    try {
      await downloadDrillResultPdfByTestId(
        test.id,
        myAttempt,
        studentFallbackName,
        (prog) => setPdfProgressText(prog.message)
      );
      showApiToast('Result PDF downloaded successfully!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF. Tap to retry.';
      showApiToast(msg, 'error');
    } finally {
      setDownloadingPdf(false);
      setPdfProgressText(null);
    }
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="section-chip-red">
                <Trophy size={13} />
                <span>Grand Line Public Mock Test</span>
              </div>
              {myAttempt && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                  Attempted · {myAttempt.score}/{myAttempt.totalQuestions} ({myAttempt.percentage}%)
                </span>
              )}
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
            {myAttempt ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/grand-line/test/${test.id}/run?mode=result`)}
                  className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>View my result</span>
                </button>
                <PdfDownloadButton
                  label="Download PDF Report"
                  variant="secondary"
                  className="px-5 py-3 text-xs sm:text-sm font-semibold"
                  onDownload={async (onProgress, signal) => {
                    await downloadDrillResultPdfByTestId(
                      test.id,
                      myAttempt,
                      studentFallbackName,
                      onProgress,
                      signal
                    );
                    showApiToast('Result PDF downloaded successfully!', 'success');
                  }}
                />
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartTest}
                className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                {user ? <Play size={15} /> : <Lock size={15} />}
                <span>{user ? 'Start Timed Test Now' : 'Sign in to Take Test'}</span>
              </button>
            )}

            <Link
              to="/grand-line/leaderboard"
              className="btn-secondary px-5 py-3 text-xs sm:text-sm font-semibold"
            >
              Global Standings
            </Link>
          </div>
        </section>

        {/* Top Scorers Panel */}
        <section className="glass-panel p-5 sm:p-8 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="min-w-0">
              <h2 className="font-dot text-lg sm:text-xl font-bold text-white truncate">
                Top Scorers on This Test
              </h2>
              <p className="text-xs text-white/60">
                Real-time rankings from verified Grand Line test attempts.
              </p>
            </div>
            <span className="glass-pill px-3 py-1 text-xs text-white/70 shrink-0">
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
              {leaderboard.slice(0, 25).map((entry) => {
                const displayName =
                  (entry.userName || entry.studentName || entry.name || '').trim() || 'Student';
                const isCurrentUser =
                  Boolean(user?.uid && entry.studentUid && entry.studentUid === user.uid);
                return (
                  <div
                    key={`${entry.rank}-${entry.id || displayName}`}
                    className={`glass-row flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl border ${
                      isCurrentUser
                        ? 'border-[#D71921]/60 bg-[#D71921]/10'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span
                        className={`font-dot text-xs sm:text-sm font-bold w-6 sm:w-7 shrink-0 tabular-nums ${
                          entry.rank === 1
                            ? 'text-amber-400'
                            : entry.rank === 2
                            ? 'text-zinc-300'
                            : entry.rank === 3
                            ? 'text-amber-600'
                            : 'text-[#D71921]'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      <BoardlyAvatar
                        uid={entry.studentUid || `${entry.rank}-${displayName}`}
                        name={displayName}
                        photoURL={entry.userAvatar || null}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {displayName}
                          </p>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D71921] text-white shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/55 truncate">
                          {formatTimeTaken(entry.timeTakenSeconds)} · {entry.percentage}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {entry.score}/{entry.totalQuestions}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#D71921]">
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GrandLineTestInfoPage;
