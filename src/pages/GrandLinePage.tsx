import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Compass,
  Trophy,
  Search,
  Info,
  AlertCircle,
  Play,
  Mail,
  User,
} from 'lucide-react';
import {
  getAllPublicGrandLineTests,
  getTestLeaderboard,
  hasUserAttemptedTest,
  type AmbassadorTestDoc,
  type PublicLeaderboardEntry,
} from '@/services/ambassadorTestService';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

import { useAuthGate } from '@/contexts/AuthGateContext';

const ENTRY_TEST_CHOICES = [
  'FAST-NUCES (CS/SE/AI)',
  'NUST NET (Engineering & CS)',
  'GIKI Entrance Exam',
  'MDCAT (Medical & Dental)',
  'ECAT Punjab (UET)',
  'NED Karachi',
  'COMSATS (NTS NAT)',
  'IBA / LUMS',
];

export function GrandLinePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();

  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Selected test for leaderboard preview
  const [activeLeaderboardTestId, setActiveLeaderboardTestId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Guest Registration Modal to take test
  const [selectedTestForStart, setSelectedTestForStart] = useState<AmbassadorTestDoc | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEntryTest, setGuestEntryTest] = useState(ENTRY_TEST_CHOICES[0]);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAllPublicGrandLineTests();
        setTests(data);
        if (data.length > 0) {
          setActiveLeaderboardTestId(data[0].id);
        }
      } catch (err) {
        console.warn('Error loading Grand Line tests:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load leaderboard when active test changes
  useEffect(() => {
    if (!activeLeaderboardTestId) return;
    async function loadBoard() {
      setLoadingLeaderboard(true);
      try {
        const board = await getTestLeaderboard(activeLeaderboardTestId!);
        setLeaderboard(board);
      } catch (err) {
        console.warn('Error loading leaderboard:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    loadBoard();
  }, [activeLeaderboardTestId]);

  const handleStartTestClick = async (test: AmbassadorTestDoc) => {
    setGuestError(null);
    if (!user) {
      requireAuth(
        `take "${test.title}" on Grand Line`,
        undefined,
        `/grand-line/test/${test.id}/run`
      );
      return;
    }

    const userEmail = user.email || '';
    try {
      const already = await hasUserAttemptedTest(test.id, userEmail);
      if (already) {
        setGuestError('You have already taken this test. In Grand Line drills, only 1 verified attempt per student is permitted.');
        return;
      }
      sessionStorage.setItem(`grandline_taker_${test.id}`, JSON.stringify({
        name: profile?.displayName || user.displayName || 'Student',
        email: userEmail,
        entryTest: 'General Prep',
      }));
      navigate(`/grand-line/test/${test.id}/run`);
    } catch (err) {
      console.warn('Error checking attempt status:', err);
      navigate(`/grand-line/test/${test.id}/run`);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForStart) return;

    const emailTrim = guestEmail.trim().toLowerCase();
    const nameTrim = guestName.trim();

    if (!nameTrim) {
      setGuestError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setGuestError('Please enter a valid email address (e.g. yourname@gmail.com).');
      return;
    }

    setCheckingEligibility(true);
    setGuestError(null);

    try {
      const already = await hasUserAttemptedTest(selectedTestForStart.id, emailTrim);
      if (already) {
        setGuestError('This email has already attempted this test. Only 1 attempt per email is allowed.');
        setCheckingEligibility(false);
        return;
      }

      sessionStorage.setItem(`grandline_taker_${selectedTestForStart.id}`, JSON.stringify({
        name: nameTrim,
        email: emailTrim,
        entryTest: guestEntryTest,
      }));

      const testId = selectedTestForStart.id;
      setSelectedTestForStart(null);
      navigate(`/grand-line/test/${testId}`);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Error validating email eligibility.');
      setCheckingEligibility(false);
    }
  };

  const filteredTests = tests.filter((t) => {
    if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(term) ||
        t.creatorName.toLowerCase().includes(term) ||
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

      <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-14">
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono capitalize transition-all cursor-pointer ${
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
          {guestError && !selectedTestForStart && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{guestError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGuestError(null)}
                className="text-red-200 hover:text-white underline font-semibold shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold text-[var(--text)] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              Captain Tests ({filteredTests.length})
            </h2>
            <span className="text-xs font-mono text-[var(--text-faint)]">
              1 Attempt per Candidate
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton height={80} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="p-12 text-center rounded-[28px] glass-panel text-[var(--muted)] text-sm space-y-2">
              <Compass size={32} className="mx-auto text-[var(--text-faint)]" />
              <p>No tests match your filter right now.</p>
              <p className="text-xs text-[var(--text-faint)]">Check back soon or apply as an ambassador to author your own mock!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="glass-card glass-card-interactive p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px]"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-[var(--text)] font-heading">
                        {test.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921]">
                        {test.subject}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[var(--muted)]">
                        {test.questionCount} Questions
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] flex items-center gap-2">
                      <span>Authored by: <strong className="text-[var(--text)]">{test.creatorName}</strong> (#{test.creatorShortId})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveLeaderboardTestId(test.id)}
                      className={activeLeaderboardTestId === test.id ? 'border-[#D71921] text-[#D71921]' : ''}
                    >
                      <Trophy size={13} />
                      <span>Leaderboard</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTestClick(test)}
                    >
                      <Play size={13} />
                      <span>Take Test</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Test Leaderboard Section ── */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-[#D71921]" />
                <h2
                  className="text-xl font-bold text-[var(--text)] font-dot"
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
              <span className="glass-pill px-3 py-1 text-xs font-mono text-[var(--muted)]">
                {leaderboard.length} Attempts Recorded
              </span>
            )}
          </div>

          {loadingLeaderboard ? (
            <div className="space-y-2">
              <Skeleton height={50} />
              <Skeleton height={50} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-panel text-xs text-[var(--muted)]">
              No attempts submitted yet for this test. Be the first to claim rank #1!
            </div>
          ) : (
            <div className="glass-panel p-4 sm:p-6 rounded-[28px] space-y-2">
              {leaderboard.map((entry) => {
                return (
                  <div
                    key={entry.rank}
                    className="p-3.5 rounded-2xl glass-row flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-dot ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-black'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-black'
                            : entry.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/[0.05] text-[var(--muted)] border border-white/10'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        {/* Candidate Name only — NEVER show emails publicly */}
                        <span className="font-bold text-sm text-[var(--text)]">
                          {entry.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-faint)] block">
                          Completed in {entry.timeTakenSeconds}s · {entry.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-dot text-[#D71921]">
                        {entry.score} / {entry.totalQuestions}
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)] block">
                        {Math.round((entry.score / entry.totalQuestions) * 100)}% accuracy
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Guest Registration Modal for Visitors ── */}
      {selectedTestForStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[28px] glass-panel p-6 sm:p-7 shadow-2xl flex flex-col gap-4 border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] font-dot"
                  style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
                >
                  Start {GRAND_LINE_NAME} Mock
                </h3>
                <p className="text-xs text-[var(--muted)]">Please enter your candidate information to start.</p>
              </div>
              <button
                onClick={() => setSelectedTestForStart(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Daniyal Tariq"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/12 text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/12 text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  />
                </div>
                <span className="text-[10px] text-[var(--text-faint)] mt-1 block">
                  Strictly 1 attempt per email. Your email is never shown publicly.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  Entrance Exam
                </label>
                <select
                  value={guestEntryTest}
                  onChange={(e) => setGuestEntryTest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/12 text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                >
                  {ENTRY_TEST_CHOICES.map((choice) => (
                    <option key={choice} value={choice} className="bg-[#121216] text-white">
                      {choice}
                    </option>
                  ))}
                </select>
              </div>

              {guestError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{guestError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedTestForStart(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" loading={checkingEligibility}>
                  Proceed to Test
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default GrandLinePage;
