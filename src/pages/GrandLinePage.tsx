import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import {
  Compass,
  Trophy,
  Search,
  Info,
  AlertCircle,
  Play,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  getAllPublicGrandLineTests,
  getMyTestAttempts,
  getTestLeaderboard,
  type AmbassadorTestAttempt,
  type AmbassadorTestDoc,
  type PublicLeaderboardEntry,
} from '@/services/ambassadorTestService';
import { showApiToast } from '@/lib/api';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { routes } from '@/utils/routes';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';
import { BubbleLoader } from '@/components/ui/BubbleLoader';

function formatTimeTaken(seconds?: number): string {
  const sec = Math.max(0, Math.round(Number(seconds || 0)));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins <= 0) return `${rem}s`;
  return `${mins}m ${rem}s`;
}

export function GrandLinePage() {
  const { user, isAdmin } = useAuth();
  const { profile } = useUserProfile();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();

  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [myAttemptsMap, setMyAttemptsMap] = useState<Record<string, AmbassadorTestAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Selected test for leaderboard preview
  const [activeLeaderboardTestId, setActiveLeaderboardTestId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getAllPublicGrandLineTests();
        if (!active) return;
        setTests(data);
        if (data.length > 0) {
          setActiveLeaderboardTestId((prev) => prev || data[0].id);
        }
      } catch (err: any) {
        console.warn('Error loading Grand Line tests:', err);
        if (active) {
          setLoadError(err?.rawMessage || err?.message || 'Could not load Grand Line drills.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [retryCount]);

  // Load current student's attempts and map by testId
  useEffect(() => {
    let active = true;
    if (!user) {
      setMyAttemptsMap({});
      return;
    }
    getMyTestAttempts()
      .then((attempts) => {
        if (!active) return;
        const map: Record<string, AmbassadorTestAttempt> = {};
        for (const att of attempts) {
          if (att.testId && !map[att.testId]) {
            map[att.testId] = att;
          }
        }
        setMyAttemptsMap(map);
      })
      .catch((err) => {
        console.warn('Error loading student attempts:', err);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Load leaderboard when active test changes
  useEffect(() => {
    if (!activeLeaderboardTestId) return;
    let active = true;
    async function loadBoard() {
      setLoadingLeaderboard(true);
      try {
        const board = await getTestLeaderboard(activeLeaderboardTestId!);
        if (active) setLeaderboard(board);
      } catch (err) {
        console.warn('Error loading leaderboard:', err);
      } finally {
        if (active) setLoadingLeaderboard(false);
      }
    }
    loadBoard();
    return () => {
      active = false;
    };
  }, [activeLeaderboardTestId]);

  const handleStartTestClick = (test: AmbassadorTestDoc) => {
    setBannerError(null);
    if (!user) {
      requireAuth(
        `take "${test.title}" on Grand Line`,
        undefined,
        `/grand-line/test/${test.id}/run`
      );
      return;
    }

    sessionStorage.setItem(
      `grandline_taker_${test.id}`,
      JSON.stringify({
        name:
          profile?.displayName ||
          user.displayName ||
          user.email?.split('@')[0] ||
          'Student',
        email: user.email || '',
        entryTest: 'General Prep',
      })
    );
    navigate(routes.grandLineTestRun(test.id));
  };

  const filteredTests = tests.filter((t) => {
    if (subjectFilter !== 'all' && t.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      const author = (t.creatorName || t.captainName || '').toLowerCase();
      return (
        t.title.toLowerCase().includes(term) ||
        author.includes(term) ||
        t.subject.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const activeTest = tests.find((t) => t.id === activeLeaderboardTestId);

  return (
    <>
      <PageMeta
        title={`${GRAND_LINE_NAME} — Open Public Tests & National Leaderboard | Boardly`}
        description={`Challenge verified entrance exam mock tests authored by ${NAKAMA_CAPTAINS_NAME}. Open to all students with real-time tie-broken rankings.`}
      />

      <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-14 overflow-x-hidden">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="section-chip section-chip-red">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
            <span>Public Testing Arena</span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
          >
            The {GRAND_LINE_NAME}
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Public mock tests authored by {NAKAMA_CAPTAINS_NAME}. Test your speed and accuracy against applicants across Pakistan, or climb the live national board.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/grand-line/about"
              className="glass-pill px-3.5 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <Info size={14} />
              <span>How {GRAND_LINE_NAME} Works</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search tests or captains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/12 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#D71921]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
            {['all', 'mathematics', 'physics', 'chemistry', 'biology', 'english'].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSubjectFilter(subj)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono capitalize transition-all cursor-pointer shrink-0 ${
                  subjectFilter === subj
                    ? 'bg-[#D71921] text-white font-bold shadow-[0_2px_12px_rgba(215,25,33,0.3)]'
                    : 'glass-pill text-[var(--muted)] hover:text-white'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* ── Test List (Dedicated Captain Tests Section) ── */}
        <div className="max-w-4xl mx-auto space-y-4">
          {bannerError && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{bannerError}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerError(null)}
                className="text-red-200 hover:text-white underline font-semibold shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <h2
              className="text-lg font-bold text-[var(--text)] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              Captain Tests ({filteredTests.length})
            </h2>
            <span className="text-xs font-mono text-[var(--text-faint)]">
              1 Verified Attempt per Drill
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <BubbleLoader
                variant="top-bar"
                messages={['Loading Grand Line public drills...']}
              />
              <Skeleton height={80} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </div>
          ) : loadError ? (
            <div className="p-10 text-center rounded-[28px] glass-panel space-y-3">
              <AlertCircle size={32} className="mx-auto text-[#D71921]" />
              <p className="text-sm font-bold text-[var(--text)]">{loadError}</p>
              <p className="text-xs text-[var(--muted)]">
                Please check your connection and try again.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setRetryCount((c) => c + 1)}
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </Button>
              </div>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="p-12 text-center rounded-[28px] glass-panel text-[var(--muted)] text-sm space-y-2">
              <Compass size={32} className="mx-auto text-[var(--text-faint)]" />
              <p>No tests match your filter right now.</p>
              <p className="text-xs text-[var(--text-faint)]">
                Check back soon or apply as an ambassador to author your own mock!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredTests.map((test) => {
                const myAttempt = myAttemptsMap[test.id];
                const isAttempted = Boolean(myAttempt);

                return (
                  <div
                    key={test.id}
                    className="glass-card glass-card-interactive p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px] min-w-0"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={routes.grandLineTest(test.id, test.title)}
                          className="text-base font-bold text-[var(--text)] hover:text-[#D71921] transition-colors font-heading break-words"
                        >
                          {test.title}
                        </Link>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921]">
                          {test.subject}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[var(--muted)]">
                          {test.questionCount} Questions
                        </span>
                        {isAttempted && myAttempt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
                            <CheckCircle2 size={11} />
                            <span>
                              Attempted · {myAttempt.score}/{myAttempt.totalQuestions} ({myAttempt.percentage}%)
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] flex items-center gap-2 truncate">
                        <span>
                          Authored by:{' '}
                          <strong className="text-[var(--text)]">
                            {test.creatorName || test.captainName}
                          </strong>{' '}
                          (#{test.creatorShortId || 'CAPT'})
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveLeaderboardTestId(test.id)}
                        className={
                          activeLeaderboardTestId === test.id
                            ? 'border-[#D71921] text-[#D71921]'
                            : ''
                        }
                      >
                        <Trophy size={13} />
                        <span>Leaderboard</span>
                      </Button>

                      {isAttempted ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(routes.grandLineTestRun(test.id, 'result'))}
                          >
                            <Eye size={13} />
                            <span>View Result</span>
                          </Button>

                          <PdfDownloadButton
                            variant="outline"
                            label={isAdmin ? 'Download Report' : 'Download PDF'}
                            className="text-xs py-1 px-2.5 h-8 font-semibold"
                            onDownload={async (onProgress, signal) => {
                              const { downloadDrillResultPdfByTestId } = await import(
                                '@/utils/testPdfExporter'
                              );
                              await downloadDrillResultPdfByTestId(
                                test.id,
                                myAttempt,
                                profile?.displayName || user?.displayName || 'Student',
                                onProgress,
                                signal,
                                false
                              );
                              showApiToast('Result PDF downloaded successfully!', 'success');
                            }}
                          />

                          {isAdmin && (
                            <PdfDownloadButton
                              variant="outline"
                              label="Answer Key"
                              className="text-xs py-1 px-2.5 h-8 font-semibold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                              onDownload={async (onProgress, signal) => {
                                const { downloadDrillResultPdfByTestId } = await import(
                                  '@/utils/testPdfExporter'
                                );
                                await downloadDrillResultPdfByTestId(
                                  test.id,
                                  myAttempt,
                                  profile?.displayName || user?.displayName || 'Administrator',
                                  onProgress,
                                  signal,
                                  true
                                );
                                showApiToast('Answer Key PDF downloaded successfully!', 'success');
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartTestClick(test)}
                          >
                            <Play size={13} />
                            <span>Take Test</span>
                          </Button>

                          {isAdmin && (
                            <PdfDownloadButton
                              variant="outline"
                              label="Download PDF (Key)"
                              className="text-xs py-1 px-2.5 h-8 font-semibold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                              onDownload={async (onProgress, signal) => {
                                const { downloadDrillResultPdfByTestId } = await import(
                                  '@/utils/testPdfExporter'
                                );
                                await downloadDrillResultPdfByTestId(
                                  test.id,
                                  undefined,
                                  profile?.displayName || user?.displayName || 'Administrator',
                                  onProgress,
                                  signal,
                                  true
                                );
                                showApiToast('Admin Answer Key PDF downloaded!', 'success');
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Test Leaderboard Section ── */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-[#D71921] shrink-0" />
                <h2
                  className="text-lg sm:text-xl font-bold text-[var(--text)] font-dot truncate"
                  style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
                >
                  {activeTest ? `Leaderboard: ${activeTest.title}` : 'Test Leaderboard'}
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Ranked by highest score first. Ties broken by shorter completion time. Emails are kept strictly private.
              </p>
            </div>

            {activeTest && (
              <span className="glass-pill px-3 py-1 text-xs font-mono text-[var(--muted)] shrink-0">
                {leaderboard.length} {leaderboard.length === 1 ? 'Attempt' : 'Attempts'} Recorded
              </span>
            )}
          </div>

          {loadingLeaderboard ? (
            <div className="space-y-2.5">
              <BubbleLoader
                variant="top-bar"
                messages={['Loading live Grand Line rankings...']}
              />
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-panel text-xs text-[var(--muted)]">
              No attempts submitted yet for this test. Be the first to claim rank #1!
            </div>
          ) : (
            <div className="glass-panel p-3 sm:p-6 rounded-[28px] space-y-2 overflow-hidden">
              {leaderboard.map((entry, idx) => {
                const rank = entry.rank ?? idx + 1;
                const studentName =
                  String(
                    entry.userName || entry.studentName || entry.name || 'Student'
                  ).trim() || 'Student';
                const totalQ = Math.max(1, Number(entry.totalQuestions || 0));
                const accuracyPct =
                  typeof entry.percentage === 'number'
                    ? entry.percentage
                    : Math.round((Number(entry.score || 0) / totalQ) * 100);
                const isOwnRow = Boolean(
                  user &&
                    ((entry.userUid && entry.userUid === user.uid) ||
                      (entry.studentUid && entry.studentUid === user.uid))
                );

                return (
                  <div
                    key={entry.id || `${rank}-${studentName}-${idx}`}
                    className={`p-3 sm:p-3.5 rounded-2xl glass-row flex items-center justify-between gap-2.5 sm:gap-3 text-xs min-w-0 ${
                      isOwnRow
                        ? 'border border-[#D71921]/50 bg-[#D71921]/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 font-dot tabular-nums ${
                          rank === 1
                            ? 'bg-amber-400 text-black'
                            : rank === 2
                            ? 'bg-slate-300 text-black'
                            : rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/[0.05] text-[var(--muted)] border border-white/10'
                        }`}
                      >
                        {rank}
                      </div>

                      <BoardlyAvatar
                        uid={entry.userUid || entry.studentUid || entry.id || `${rank}-${studentName}`}
                        size={32}
                        name={studentName}
                        equippedAvatar={entry.userAvatar || undefined}
                        forceStatic
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="font-bold text-xs sm:text-sm text-[var(--text)] truncate"
                            title={studentName}
                          >
                            {studentName}
                          </span>
                          {isOwnRow && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#D71921] text-white text-[9px] font-mono font-bold uppercase shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-faint)] block truncate tabular-nums">
                          {formatTimeTaken(entry.timeTakenSeconds)}
                          {entry.date ? ` · ${entry.date}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <span className="text-xs sm:text-sm font-bold font-dot text-[#D71921] block">
                        {entry.score}/{entry.totalQuestions}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-faint)] block">
                        {accuracyPct}% accuracy
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default GrandLinePage;

