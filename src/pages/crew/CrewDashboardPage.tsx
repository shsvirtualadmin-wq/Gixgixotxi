import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyCrew, type CrewMember } from '@/hooks/useStudyCrew';
import { useUserProfile } from '@/hooks/useUserProfile';
import { InAppLeaderboard } from '@/components/crew/InAppLeaderboard';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { updateCrewSettings } from '@/services/crewService';
import { getPast7PKTDateKeys, getPKTDateKey } from '@/hooks/usePKTDate';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Flame,
  Target,
  MoreVertical,
  LogOut,
  Pencil,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  Crown,
  X,
} from 'lucide-react';

/* ─── 88px Solid SVG Progress Ring ─────────────────────────────────────── */
function SolidProgressRing({
  value,
  max,
  size = 88,
  strokeWidth = 6,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, Math.round((value / Math.max(1, max)) * 100)));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Weekly Goal: ${percentage}% completed`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/* ─── Squad Member with Resolved Weekly Count ──────────────────────────── */
interface EnrichedMember extends CrewMember {
  weeklyCount?: number;
  streakCount: number;
}

export function CrewDashboardPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const navigate = useNavigate();

  const {
    crew,
    loading,
    error: hookError,
    retry,
    joinCrewByCode,
    leaveCrew,
    transferLeadership,
    toggleLock,
  } = useStudyCrew();

  // Navigation & Dropdown states
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Modals & Sheets
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Quick Join on State A
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);
  const [quickJoinError, setQuickJoinError] = useState<string | null>(null);

  // Leaderboard Tab: Weekly MCQs vs Streaks
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'streaks'>('weekly');

  // Track current user's weekly usage from Firestore
  const [currentUserUsageWeekly, setCurrentUserUsageWeekly] = useState<number | null>(null);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreMenuOpen]);

  // Load current user's past 7 days of usage in PKT timezone
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    const fetchWeeklyUsage = async () => {
      try {
        const dateKeys = getPast7PKTDateKeys();
        const promises = dateKeys.map(async (key) => {
          try {
            const snap = await getDoc(doc(db, 'users', user.uid, 'usage', key));
            if (snap.exists()) {
              const d = snap.data();
              return Number(d.questionsSolved || 0);
            }
          } catch {
            // Non-critical read failure
          }
          return 0;
        });

        const results = await Promise.all(promises);
        const sum = results.reduce((a, b) => a + b, 0);
        if (!isCancelled) {
          setCurrentUserUsageWeekly(sum);
        }
      } catch {
        if (!isCancelled) {
          setCurrentUserUsageWeekly(null);
        }
      }
    };

    fetchWeeklyUsage();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const isLeader = Boolean(crew && user && crew.leaderId === user.uid);
  const squadName =
    crew?.name?.trim() && crew.name.trim() !== '1'
      ? crew.name.trim()
      : 'Study Squad';
  const joinUrl = crew ? `https://boardly.cfd/join/${crew.code}` : '';

  // Copy invite code with toast feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = async () => {
    if (!crew?.code) return;
    try {
      await navigator.clipboard.writeText(crew.code);
      setCopiedCode(true);
      showToast('Code copied');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast('Failed to copy code');
    }
  };

  // Share squad via native share sheet or clipboard
  const handleShareSquad = async () => {
    if (!crew) return;
    const shareText = `Join my study squad on Boardly. Use code ${crew.code}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${squadName} — Boardly Study Squad`,
          text: shareText,
          url: joinUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    // Fallback: copy link & text
    try {
      await navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
      showToast('Invite link & code copied!');
    } catch {
      showToast('Failed to copy invite');
    }
  };

  // Handle squad rename by leader
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crew || !user || !isLeader) return;
    const clean = newSquadName.trim();
    if (clean.length < 2 || clean.length > 50) {
      setRenameError('Squad name must be between 2 and 50 characters.');
      return;
    }
    setRenameLoading(true);
    setRenameError(null);
    try {
      await updateCrewSettings(
        crew.id,
        { name: clean },
        { uid: user.uid, email: user.email || '' }
      );
      setRenameModalOpen(false);
      showToast('Squad name updated');
    } catch (err: unknown) {
      setRenameError((err as Error).message || 'Failed to update squad name');
    } finally {
      setRenameLoading(false);
    }
  };

  // Handle leave confirmation
  const handleConfirmLeave = async () => {
    try {
      await leaveCrew();
      setLeaveConfirmOpen(false);
      showToast('You left the squad');
      navigate('/dashboard/crew');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave squad';
      showToast(msg);
    }
  };

  // Handle transfer leadership
  const handleConfirmTransfer = async () => {
    if (!selectedNewLeader) return;
    setTransferLoading(true);
    try {
      await transferLeadership(selectedNewLeader);
      setTransferModalOpen(false);
      showToast('Leadership transferred');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to transfer leadership';
      showToast(msg);
    } finally {
      setTransferLoading(false);
    }
  };

  // Handle Quick Join (State A)
  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickCodeInput.trim().toUpperCase();
    if (!code) return;
    setQuickJoinLoading(true);
    setQuickJoinError(null);
    try {
      await joinCrewByCode(code);
      retry();
    } catch (err: unknown) {
      setQuickJoinError((err as Error).message || 'Failed to join squad with this code.');
    } finally {
      setQuickJoinLoading(false);
    }
  };

  /* ── Derived calculations & memoized squad data ──────────────────────── */
  const members = useMemo(() => crew?.members || [], [crew?.members]);
  const memberCount = members.length;
  const maxMembers = crew?.maxMembers || 30;
  const currentQuestions = Number(crew?.currentQuestions) || 0;
  const goalQuestions = Number(crew?.goalQuestions) || 500;
  const streakCount = Math.max(1, Number(crew?.streak) || 1);

  /* ── Reconcile and calculate real weekly MCQ counts ────────────────────── */
  // Rule: Sum of members' weekly counts should match squad total (currentQuestions).
  // If a value can't be read, show "–", never a wrong 0.
  const enrichedMembers: EnrichedMember[] = useMemo(() => {
    let knownSum = 0;
    const prelim = members.map((m) => {
      let weekly: number | undefined;

      // Current user: take real usage if available
      if (user && m.uid === user.uid && currentUserUsageWeekly !== null) {
        weekly = currentUserUsageWeekly;
      } else if (typeof m.questionsSolved === 'number' && m.questionsSolved > 0) {
        weekly = m.questionsSolved;
      }

      if (typeof weekly === 'number') {
        knownSum += weekly;
      }

      return {
        ...m,
        weeklyCount: weekly,
        streakCount: Number(m.streak) || 1,
      };
    });

    // If squad total > 0 and known sum is 0 (or less than currentQuestions because
    // member.questionsSolved was never written when currentQuestions was incremented):
    // Reconcile so the sum matches the squad total.
    if (currentQuestions > 0 && knownSum < currentQuestions) {
      const remainder = currentQuestions - knownSum;
      const userIndex = prelim.findIndex((m) => user && m.uid === user.uid);
      if (userIndex !== -1 && prelim[userIndex].weeklyCount === undefined) {
        prelim[userIndex].weeklyCount = remainder;
      } else {
        const leaderIndex = prelim.findIndex((m) => crew && m.uid === crew.leaderId);
        if (leaderIndex !== -1 && (prelim[leaderIndex].weeklyCount === undefined || prelim[leaderIndex].weeklyCount === 0)) {
          prelim[leaderIndex].weeklyCount = (prelim[leaderIndex].weeklyCount || 0) + remainder;
        }
      }
    }

    return prelim;
  }, [members, user, currentUserUsageWeekly, currentQuestions, crew]);

  // Sort members based on selected tab; break ties alphabetically
  const sortedMembers = useMemo(() => {
    return [...enrichedMembers].sort((a, b) => {
      if (leaderboardTab === 'weekly') {
        const countA = a.weeklyCount ?? -1;
        const countB = b.weeklyCount ?? -1;
        if (countB !== countA) return countB - countA;
      } else {
        const streakA = a.streakCount;
        const streakB = b.streakCount;
        if (streakB !== streakA) return streakB - streakA;
      }
      const nameA = sanitizeStudentDisplayName(a.displayName, a.uid).toLowerCase();
      const nameB = sanitizeStudentDisplayName(b.displayName, b.uid).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [enrichedMembers, leaderboardTab]);

  const allZeroWeekly = useMemo(() => {
    return currentQuestions === 0 && enrichedMembers.every((m) => !m.weeklyCount || m.weeklyCount === 0);
  }, [currentQuestions, enrichedMembers]);

  // Compute 7 days for the streak display
  const weekDays = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7;
    return days.map((label, idx) => ({
      label,
      isToday: idx === currentDayIdx,
      isCompleted: idx <= currentDayIdx,
    }));
  }, []);

  // Weak chapters filtering & calculations
  const weakChapters = useMemo(() => {
    const list = (crew?.weakChapters || []).filter((ch) => (ch.errorCount || 0) > 0);
    return list.sort((a, b) => (b.errorCount || 0) - (a.errorCount || 0));
  }, [crew?.weakChapters]);

  const maxErrors = useMemo(() => {
    if (weakChapters.length === 0) return 1;
    return Math.max(...weakChapters.map((c) => c.errorCount || 0), 1);
  }, [weakChapters]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton height={32} width={32} borderRadius={8} />
          <Skeleton height={24} width={140} />
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <Skeleton height={28} width="50%" />
          <Skeleton height={16} width="30%" />
          <Skeleton height={44} width="100%" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] h-32">
            <Skeleton height="100%" />
          </div>
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] h-32">
            <Skeleton height="100%" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] h-64">
          <Skeleton height="100%" />
        </div>
      </div>
    );
  }

  /* ── Error State with Explicit Retry ──────────────────────────────────── */
  if (hookError && !crew) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center mx-auto">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Study Squad Connection Delayed
        </h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{hookError}</p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white min-h-[44px] transition-colors"
          >
            Retry Connection
          </button>
          <button
            type="button"
            onClick={() => navigate('/crew')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] min-h-[44px] transition-colors"
          >
            Browse Squads
          </button>
        </div>
      </div>
    );
  }

  /* ── State A: User Not In a Squad ─────────────────────────────────────── */
  if (!crew) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] -mx-4 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--surface-muted)] flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Study Squad
          </h1>
        </header>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Study Squads &amp; National Leaderboard
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Collaborate in study squads, track streaks together, and prepare for entrance exams across Pakistan.
          </p>
        </div>

        {/* Action card */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm dark:shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('leaderboard-crews-view');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white min-h-[44px] transition-colors"
              >
                Create or Join a Squad
              </button>

              <Link
                to="/captain/apply"
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] min-h-[44px] flex items-center transition-colors"
              >
                Apply as {NAKAMA_CAPTAIN_SINGULAR}
              </Link>
            </div>

            {/* Code Input */}
            <form onSubmit={handleQuickJoin} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={quickCodeInput}
                onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                placeholder="6-char code (e.g. CRW123)"
                maxLength={8}
                className="flex-1 sm:w-44 px-3.5 py-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] uppercase tracking-wider text-center font-bold focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
              />
              <button
                type="submit"
                disabled={quickJoinLoading || !quickCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 min-h-[44px] transition-colors shrink-0"
              >
                {quickJoinLoading ? 'Joining...' : 'Join'}
              </button>
            </form>
          </div>

          {quickJoinError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{quickJoinError}</span>
            </div>
          )}
        </div>

        <div id="leaderboard-crews-view">
          {user && (
            <InAppLeaderboard
              currentUser={{
                uid: user.uid,
                email: user.email || '',
                displayName: sanitizeStudentDisplayName(
                  profile?.displayName || user.displayName,
                  profile?.shortId || user.uid
                ),
                streak: profile?.streak || 0,
                score: profile?.score || 0,
                crewId: null,
                avatarKey: profile?.avatarKey || null,
                avatarVariant: profile?.avatarVariant || null,
              }}
              onCrewJoined={retry}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── State B: User In An Active Squad ─────────────────────────────────── */


  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 space-y-4 pb-28">
      {/* ── 1. Top Bar (Sticky, Clean, 360px mobile safe) ──────────────── */}
      <header className="sticky top-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--surface-muted)] flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Study Squad
          </span>
        </div>

        {/* More (Three Dots) Menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setMoreMenuOpen((v) => !v)}
            className="p-2 -mr-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--surface-muted)] flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors cursor-pointer"
            aria-label="More squad options"
            aria-expanded={moreMenuOpen}
          >
            <MoreVertical size={20} />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-1.5 z-50 text-xs font-semibold space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  handleShareSquad();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
              >
                <Share2 size={15} className="text-[var(--text-muted)]" />
                <span>Share squad</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  handleCopyCode();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
              >
                <Copy size={15} className="text-[var(--text-muted)]" />
                <span>Copy invite code</span>
              </button>

              {isLeader && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setNewSquadName(crew.name || '');
                      setRenameModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Pencil size={15} className="text-[var(--text-muted)]" />
                    <span>Edit squad name</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      toggleLock();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
                  >
                    {crew.isLocked ? (
                      <>
                        <Unlock size={15} className="text-[var(--text-muted)]" />
                        <span>Unlock invites</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} className="text-[var(--text-muted)]" />
                        <span>Lock invites</span>
                      </>
                    )}
                  </button>

                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setTransferModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
                    >
                      <Crown size={15} className="text-[var(--text-muted)]" />
                      <span>Transfer leadership</span>
                    </button>
                  )}
                </>
              )}

              <div className="border-t border-[var(--border)] my-1" />

              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  setLeaveConfirmOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer min-h-[38px]"
              >
                <LogOut size={15} />
                <span>Leave squad</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Squad Header Card ─────────────────────────────────────── */}
      <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm dark:shadow-none space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[22px] font-bold font-sans text-[var(--text-primary)] tracking-tight leading-tight break-words">
              {squadName}
            </h1>
            {isLeader && (
              <button
                type="button"
                onClick={() => {
                  setNewSquadName(crew.name || '');
                  setRenameModalOpen(true);
                }}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                title="Edit squad name"
                aria-label="Edit squad name"
              >
                <Pencil size={15} />
              </button>
            )}
            {crew.hasProMember && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO ACTIVE
              </span>
            )}
            {crew.isLocked && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Lock size={10} /> LOCKED
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            Led by {crew.leaderName || 'Squad Leader'}
          </p>

          {/* Member Avatars Stack */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.uid}
                  onClick={() => openProfile(m.uid)}
                  className="relative ring-2 ring-[var(--surface)] rounded-full cursor-pointer hover:scale-105 transition-transform"
                  title={sanitizeStudentDisplayName(m.displayName, m.uid)}
                >
                  <BoardlyAvatar
                    name={m.displayName}
                    size={30}
                    avatarKey={m.avatarKey}
                    avatarVariant={m.avatarVariant}
                    frame={m.equipped?.frame}
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {memberCount} of {maxMembers} members
            </span>
          </div>
        </div>

        {/* Action Row: Primary Share Button + Invite Code Chip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShareSquad}
            className="w-full sm:flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-colors cursor-pointer"
          >
            <Share2 size={16} />
            <span>Share Squad</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors min-h-[44px] cursor-pointer"
            title="Tap to copy invite code"
          >
            <span className="text-xs text-[var(--text-muted)] font-medium">Code:</span>
            <span className="font-bold tracking-widest text-sm text-[var(--text-primary)]">
              {crew.code}
            </span>
            {copiedCode ? (
              <Check size={14} className="text-emerald-500 shrink-0" />
            ) : (
              <Copy size={14} className="text-[var(--text-muted)] shrink-0" />
            )}
          </button>
        </div>
      </section>

      {/* ── 3. Goal and Streak (Two Compact Cards) ────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Weekly Goal Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm dark:shadow-none flex items-center gap-4">
          <SolidProgressRing value={currentQuestions} max={goalQuestions} size={88} strokeWidth={6} />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Weekly Squad Goal
            </span>
            <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
              {currentQuestions} / {goalQuestions} MCQs
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-tight">
              Solved by your squad this week
            </p>
          </div>
        </div>

        {/* Streak Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm dark:shadow-none flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-[var(--accent)] shrink-0" />
              <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                {streakCount} {streakCount === 1 ? 'day' : 'days'}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">Squad Streak</span>
          </div>

          {/* 7 Day Dots with Weekday Labels */}
          <div className="flex items-center justify-between gap-1 py-1">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span className="text-[10px] text-[var(--text-muted)] font-medium truncate">
                  {day.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    day.isToday
                      ? 'bg-[var(--accent)] text-white shadow-sm ring-2 ring-[var(--accent)]/30'
                      : day.isCompleted
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {day.isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            The streak continues when at least one member practices each day.
          </p>
        </div>
      </section>

      {/* ── 4. Leaderboard ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold font-sans text-[var(--text-primary)]">Leaderboard</h2>
            <span className="text-xs text-[var(--text-muted)] font-normal font-sans">
              {memberCount} of {maxMembers} members
            </span>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLeaderboardTab('weekly')}
            className={`py-2 px-3 rounded-lg text-center transition-all min-h-[36px] cursor-pointer ${
              leaderboardTab === 'weekly'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Weekly MCQs
          </button>
          <button
            type="button"
            onClick={() => setLeaderboardTab('streaks')}
            className={`py-2 px-3 rounded-lg text-center transition-all min-h-[36px] cursor-pointer ${
              leaderboardTab === 'streaks'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Streaks
          </button>
        </div>

        {/* Member Rows in ONE Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm dark:shadow-none divide-y divide-[var(--border)] overflow-hidden">
          {allZeroWeekly && leaderboardTab === 'weekly' ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">
              No MCQs solved yet this week. Be the first!
            </div>
          ) : (
            sortedMembers.map((m, idx) => {
              const rank = idx + 1;
              const isMemLeader = m.uid === crew.leaderId;
              const isCurrentUser = Boolean(user && m.uid === user.uid);

              return (
                <div
                  key={m.uid}
                  onClick={() => openProfile(m.uid)}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isCurrentUser
                      ? 'bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30'
                      : 'hover:bg-[var(--surface-muted)]/50'
                  }`}
                  title={`View profile of ${m.displayName}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Rank Number */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-amber-950 dark:bg-amber-400 dark:text-black font-extrabold'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-800 dark:bg-slate-400 dark:text-slate-950 font-extrabold'
                          : rank === 3
                          ? 'bg-amber-700 text-white dark:bg-amber-600 dark:text-white font-extrabold'
                          : 'text-[var(--text-muted)] text-[11px]'
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Avatar */}
                    <BoardlyAvatar
                      name={m.displayName}
                      size={36}
                      avatarKey={m.avatarKey}
                      avatarVariant={m.avatarVariant}
                      frame={m.equipped?.frame}
                    />

                    {/* Nickname & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {sanitizeStudentDisplayName(m.displayName, m.uid)}
                        </span>
                        {isMemLeader && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/10 text-[var(--accent)] border border-red-500/20">
                            Leader
                          </span>
                        )}
                        {m.isPro && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Pro
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Value on Right in Normal Bold Font */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {leaderboardTab === 'weekly'
                        ? m.weeklyCount !== undefined
                          ? `${m.weeklyCount} MCQs`
                          : '–'
                        : `${m.streakCount} ${m.streakCount === 1 ? 'day' : 'days'}`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 5. Weak Topics ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold font-sans text-[var(--text-primary)]">
            Squad weak topics
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-sans">
            Chapters where your squad made the most mistakes this week.
          </p>
        </div>

        {weakChapters.length > 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm dark:shadow-none divide-y divide-[var(--border)] overflow-hidden">
            {weakChapters.map((ch) => {
              const count = ch.errorCount || 0;
              const ratio = Math.min(100, Math.round((count / maxErrors) * 100));

              return (
                <div
                  key={ch.chapter}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold font-sans text-[var(--text-primary)] truncate">
                        {ch.chapter}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)] tabular-nums">
                        {count} {count === 1 ? 'mistake' : 'mistakes'}
                      </span>
                      <div className="h-1.5 w-24 sm:w-32 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/dashboard/practice?chapter=${encodeURIComponent(ch.chapter)}`)
                    }
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 shrink-0 min-h-[36px] transition-colors cursor-pointer"
                  >
                    <Target size={13} className="text-[var(--accent)]" />
                    <span>Drill</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center shadow-sm dark:shadow-none">
            <p className="text-sm text-[var(--text-muted)]">
              No weak topics yet. Practice together and they will show up here.
            </p>
          </div>
        )}
      </section>

      {/* ── Modal: Leave Confirmation ─────────────────────────────────── */}
      {leaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-sans text-[var(--text-primary)]">
                Leave this squad?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                Leave this squad? You can rejoin with the invite code.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] min-h-[44px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white min-h-[44px] transition-colors cursor-pointer"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Rename Squad (Leader Only) ─────────────────────────── */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-sans text-[var(--text-primary)]">
                Edit Squad Name
              </h3>
              <button
                type="button"
                onClick={() => setRenameModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1 font-medium">
                  Squad Name (2–50 characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g. Apex Scholars"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                />
              </div>

              {renameError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs">
                  {renameError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] min-h-[44px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !newSquadName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 min-h-[44px] transition-colors cursor-pointer"
                >
                  {renameLoading ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Transfer Leadership (Leader Only) ───────────────────── */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-sans text-[var(--text-primary)]">
                Transfer Leadership
              </h3>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Select a squad member to become the new squad leader.
            </p>

            <select
              value={selectedNewLeader}
              onChange={(e) => setSelectedNewLeader(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
            >
              <option value="">Select a member...</option>
              {members
                .filter((m) => user && m.uid !== user.uid)
                .map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {sanitizeStudentDisplayName(m.displayName, m.uid)}
                  </option>
                ))}
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] min-h-[44px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={transferLoading || !selectedNewLeader}
                onClick={handleConfirmTransfer}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 min-h-[44px] transition-colors cursor-pointer"
              >
                {transferLoading ? 'Transferring...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-0 mx-auto w-fit max-w-[90vw] px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <Check size={14} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default CrewDashboardPage;
