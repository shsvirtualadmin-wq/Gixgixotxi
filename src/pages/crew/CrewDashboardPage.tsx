import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyCrew, type CrewMember } from '@/hooks/useStudyCrew';
import { useUserProfile } from '@/hooks/useUserProfile';
import { InAppLeaderboard } from '@/components/crew/InAppLeaderboard';
import {
  CrewGlassSlider,
  getCrewBtnHandlers,
  type CrewSliderOption,
} from '@/components/crew/CrewGlassPrimitives';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { updateCrewSettings } from '@/services/crewService';
import { getPast7PKTDateKeys } from '@/hooks/usePKTDate';
import { useSmartBack } from '@/utils/homeUrl';
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
  Crown,
  X,
} from 'lucide-react';

/* ─── 92px Circular Progress Ring (9px stroke, red progress, round caps) ─ */
function CrewGoalProgressRing({
  value,
  max,
  size = 92,
  strokeWidth = 9,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((value / Math.max(1, max)) * 100))
  );
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
          stroke="var(--cw-line)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--cw-red)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="cw-font-doto text-base font-extrabold tabular-nums"
          style={{ color: 'var(--cw-text)' }}
        >
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

type LeaderboardTabId = 'weekly' | 'streaks';

const LEADERBOARD_SLIDER_OPTIONS: CrewSliderOption<LeaderboardTabId>[] = [
  { id: 'weekly', label: 'Weekly MCQs' },
  { id: 'streaks', label: 'Streaks' },
];

export function CrewDashboardPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const navigate = useNavigate();
  const handleBack = useSmartBack();

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

  // Trigger Create Crew modal in Browse view
  const [createCrewTrigger, setCreateCrewTrigger] = useState(0);

  // Top Toast pill feedback (auto-hides in ~1.8s)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Quick Join on State A (Browse view)
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);
  const [quickJoinError, setQuickJoinError] = useState<string | null>(null);

  // Leaderboard Tab: Weekly MCQs vs Streaks
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTabId>('weekly');

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
  // PRO BADGE RULE: Show "PRO ACTIVE" badge and "Pro" chip only when the crew actually has an active Pro plan
  const crewHasActivePro = Boolean(crew?.hasProMember);

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
      setTimeout(() => setCopiedCode(false), 1800);
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
      showToast('You left the crew');
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
      showToast('Joined crew!');
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
  const enrichedMembers: EnrichedMember[] = useMemo(() => {
    let knownSum = 0;
    const prelim = members.map((m) => {
      let weekly: number | undefined;

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

    if (currentQuestions > 0 && knownSum < currentQuestions) {
      const remainder = currentQuestions - knownSum;
      const userIndex = prelim.findIndex((m) => user && m.uid === user.uid);
      if (userIndex !== -1 && prelim[userIndex].weeklyCount === undefined) {
        prelim[userIndex].weeklyCount = remainder;
      } else {
        const leaderIndex = prelim.findIndex((m) => crew && m.uid === crew.leaderId);
        if (
          leaderIndex !== -1 &&
          (prelim[leaderIndex].weeklyCount === undefined ||
            prelim[leaderIndex].weeklyCount === 0)
        ) {
          prelim[leaderIndex].weeklyCount =
            (prelim[leaderIndex].weeklyCount || 0) + remainder;
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
    return (
      currentQuestions === 0 &&
      enrichedMembers.every((m) => !m.weeklyCount || m.weeklyCount === 0)
    );
  }, [currentQuestions, enrichedMembers]);

  // Compute 7 days (Mon-Sun) for the 30px streak circles
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

  return (
    <div className="ncd-root w-full max-w-full min-w-0 flex flex-col justify-between transition-colors duration-150">
      {/* ─── TOP TOAST PILL (Slides down, auto-hides in ~1.8s) ──────────── */}
      {toastMessage && (
        <div role="status" className="cw-top-toast">
          <Check size={14} strokeWidth={2.5} style={{ color: '#3ddc84' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── MAIN SCREEN CONTENT ────────────────────────────────────────── */}
      <div className="w-full pt-2 sm:pt-3 flex-1 space-y-5">
        {loading ? (
          <div className="py-12">
            <LineLoader context="dashboard" variant="section" />
          </div>
        ) : hookError && !crew ? (
          /* ── Error State with Explicit Retry ──────────────────────────── */
          <div className="cw-card my-8 text-center space-y-4">
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cw-red) 18%, transparent)',
                color: 'var(--cw-red-text)',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <h2 className="cw-font-doto text-xl font-extrabold" style={{ color: 'var(--cw-text)' }}>
              Study Squad Connection Delayed
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cw-muted)' }}>
              {hookError}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={retry}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-red w-full sm:w-auto"
              >
                Retry Connection
              </button>
              <button
                type="button"
                onClick={() => navigate('/crew')}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-glass w-full sm:w-auto"
              >
                Browse Squads
              </button>
            </div>
          </div>
        ) : !crew ? (
          /* ── State A: Browse View (User Not In a Squad) ───────────────── */
          <div className="space-y-5">
            {/* Back + Doto Page Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-icon-btn cw-btn-glass shrink-0"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} strokeWidth={2} />
                </button>
                <h1
                  className="cw-font-doto text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                  style={{ color: 'var(--cw-text)' }}
                >
                  Study Squads &amp; National Leaderboard
                </h1>
              </div>
              <p className="text-sm leading-relaxed pl-1" style={{ color: 'var(--cw-muted)' }}>
                Collaborate in study squads, track streaks together, and prepare for entrance exams across Pakistan.
              </p>
            </div>

            {/* CTA Card with Red & Glass Buttons + Join-Code Pill Input + Join Button */}
            <section className="cw-card space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateCrewTrigger((n) => n + 1)}
                    {...getCrewBtnHandlers()}
                    className="cw-btn cw-btn-red"
                  >
                    Create or Join a Squad
                  </button>

                  <Link
                    to="/captain/apply"
                    {...getCrewBtnHandlers()}
                    className="cw-btn cw-btn-glass"
                  >
                    Apply as {NAKAMA_CAPTAIN_SINGULAR}
                  </Link>
                </div>

                {/* Join-Code Pill Input + Join Button */}
                <form
                  onSubmit={handleQuickJoin}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <input
                    type="text"
                    value={quickCodeInput}
                    onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                    placeholder="6-char code (e.g. CRW123)"
                    maxLength={8}
                    className="cw-pill-input flex-1 sm:w-44 h-[44px] px-4 text-xs uppercase tracking-wider text-center font-mono font-bold"
                  />
                  <button
                    type="submit"
                    disabled={quickJoinLoading || !quickCodeInput.trim()}
                    {...getCrewBtnHandlers(quickJoinLoading || !quickCodeInput.trim())}
                    className="cw-btn cw-btn-red shrink-0"
                  >
                    <span>{quickJoinLoading ? 'Joining...' : 'Join'}</span>
                    {quickJoinLoading && <ButtonLineLoader />}
                  </button>
                </form>
              </div>

              {quickJoinError && (
                <div
                  className="cw-lb-row-me flex items-center gap-2 text-xs font-semibold"
                  style={{ color: 'var(--cw-red-text)' }}
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{quickJoinError}</span>
                </div>
              )}
            </section>

            {/* National Crew Leaderboard Card */}
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
                  externalCreateTrigger={createCrewTrigger}
                />
              )}
            </div>
          </div>
        ) : (
          /* ── State B: Active Crew View ────────────────────────────────── */
          <div className="space-y-5">
            {/* ── 1. Crew Hero Card ──────────────────────────────────────── */}
            <section className="cw-card space-y-5 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1
                      className="cw-font-doto font-extrabold tracking-tight break-words"
                      style={{
                        fontSize: 'clamp(28px, 6.5vw, 37px)',
                        lineHeight: 1.08,
                        color: 'var(--cw-text)',
                      }}
                    >
                      {squadName}
                    </h1>

                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewSquadName(crew.name || '');
                          setRenameModalOpen(true);
                        }}
                        {...getCrewBtnHandlers()}
                        className="cw-btn cw-icon-btn cw-btn-glass !w-8 !h-8 !min-w-[32px] !min-h-[32px]"
                        title="Edit squad name"
                        aria-label="Edit squad name"
                      >
                        <Pencil size={14} />
                      </button>
                    )}

                    {/* PRO BADGE RULE: Show "PRO ACTIVE" badge ONLY when crew actually has active Pro */}
                    {crewHasActivePro && (
                      <span className="cw-chip cw-chip-pro">PRO ACTIVE</span>
                    )}

                    {crew.isLocked && (
                      <span className="cw-chip cw-chip-gold">
                        <Lock size={11} />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* Leader line */}
                  <p className="text-sm font-medium" style={{ color: 'var(--cw-muted)' }}>
                    Led by {crew.leaderName || 'Squad Leader'}
                  </p>
                </div>

                {/* Top-Right Three-Dot Menu Button & Glass Popup (220px wide, radius 24px) */}
                <div className="relative shrink-0" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((v) => !v)}
                    {...getCrewBtnHandlers()}
                    className="cw-btn cw-icon-btn cw-btn-glass"
                    aria-label="More squad options"
                    aria-expanded={moreMenuOpen}
                  >
                    <MoreVertical size={18} strokeWidth={2} />
                  </button>

                  {moreMenuOpen && (
                    <div
                      role="menu"
                      className="cw-menu-popup absolute right-0 mt-2 z-50 space-y-0.5"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          handleShareSquad();
                        }}
                        className="cw-menu-row"
                      >
                        <Share2 size={15} style={{ color: 'var(--cw-muted)' }} />
                        <span>Share crew</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          handleCopyCode();
                        }}
                        className="cw-menu-row"
                      >
                        <Copy size={15} style={{ color: 'var(--cw-muted)' }} />
                        <span>Copy invite code</span>
                      </button>

                      {isLeader && (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setNewSquadName(crew.name || '');
                              setRenameModalOpen(true);
                            }}
                            className="cw-menu-row"
                          >
                            <Pencil size={15} style={{ color: 'var(--cw-muted)' }} />
                            <span>Edit crew name</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              toggleLock();
                            }}
                            className="cw-menu-row"
                          >
                            {crew.isLocked ? (
                              <>
                                <Unlock size={15} style={{ color: 'var(--cw-muted)' }} />
                                <span>Unlock invites</span>
                              </>
                            ) : (
                              <>
                                <Lock size={15} style={{ color: 'var(--cw-muted)' }} />
                                <span>Lock invites</span>
                              </>
                            )}
                          </button>

                          {members.length > 1 && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMoreMenuOpen(false);
                                setTransferModalOpen(true);
                              }}
                              className="cw-menu-row"
                            >
                              <Crown size={15} style={{ color: 'var(--cw-muted)' }} />
                              <span>Transfer leadership</span>
                            </button>
                          )}
                        </>
                      )}

                      <div
                        className="my-1"
                        style={{ borderTop: '1px solid var(--cw-line)' }}
                      />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setLeaveConfirmOpen(true);
                        }}
                        className="cw-menu-row cw-menu-row-danger"
                      >
                        <LogOut size={15} />
                        <span>Leave crew</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Member count with 34px avatars in card2 */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden py-0.5">
                  {members.slice(0, 5).map((m) => (
                    <button
                      key={m.uid}
                      type="button"
                      onClick={() => openProfile(m.uid)}
                      className="cw-avatar-34 relative cursor-pointer transition-transform hover:scale-105"
                      title={sanitizeStudentDisplayName(m.displayName, m.uid)}
                    >
                      <BoardlyAvatar
                        name={m.displayName}
                        size={34}
                        avatarKey={m.avatarKey}
                        avatarVariant={m.avatarVariant}
                        frame={m.equipped?.frame}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--cw-muted)' }}>
                  {memberCount} of {maxMembers} members
                </span>
              </div>

              {/* Red "Share crew" button + Glass invite-code button with code in monospace */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleShareSquad}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-red sm:flex-1"
                >
                  <Share2 size={16} strokeWidth={2.2} />
                  <span>Share crew</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-glass justify-between sm:justify-center"
                  title="Tap to copy invite code"
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--cw-muted)' }}>
                    Code:
                  </span>
                  <span
                    className="font-mono font-bold tracking-widest text-sm"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    {crew.code}
                  </span>
                  {copiedCode ? (
                    <Check size={15} strokeWidth={2.5} style={{ color: 'var(--cw-green)' }} />
                  ) : (
                    <Copy size={15} style={{ color: 'var(--cw-muted)' }} />
                  )}
                </button>
              </div>
            </section>

            {/* ── 2. Weekly Goal Card & Streak Card ─────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Weekly Goal Card */}
              <div className="cw-card flex items-center gap-5">
                <CrewGoalProgressRing
                  value={currentQuestions}
                  max={goalQuestions}
                  size={92}
                  strokeWidth={9}
                />
                <div className="flex flex-col justify-center min-w-0">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    Weekly Squad Goal
                  </span>
                  <div
                    className="cw-font-doto text-2xl sm:text-[26px] font-extrabold tabular-nums mt-1 leading-tight"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    {currentQuestions} / {goalQuestions} MCQs
                  </div>
                  <p
                    className="text-xs mt-1 leading-snug"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    Solved by your squad this week
                  </p>
                </div>
              </div>

              {/* Streak Card */}
              <div className="cw-card flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <Flame
                      size={22}
                      className="shrink-0 self-center"
                      style={{ color: 'var(--cw-red-text)' }}
                    />
                    <span
                      className="cw-font-doto text-3xl sm:text-4xl font-extrabold tabular-nums leading-none"
                      style={{ color: 'var(--cw-red-text)' }}
                    >
                      {streakCount}
                    </span>
                    <span
                      className="cw-font-doto text-sm font-bold"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      {streakCount === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    Squad Streak
                  </span>
                </div>

                {/* Mon-Sun Row of 30px Circles */}
                <div className="flex items-center justify-between gap-1.5">
                  {weekDays.map((day, idx) => (
                    <div
                      key={day.label}
                      className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
                    >
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{
                          color: day.isToday ? 'var(--cw-red-text)' : 'var(--cw-muted)',
                        }}
                      >
                        {day.label}
                      </span>
                      <div
                        className={
                          day.isCompleted
                            ? 'cw-streak-circle-done'
                            : 'cw-streak-circle-todo'
                        }
                      >
                        {day.isCompleted ? (
                          <Check size={14} strokeWidth={3} />
                        ) : (
                          idx + 1
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--cw-muted)' }}
                >
                  The streak continues when at least one member practices each day.
                </p>
              </div>
            </section>

            {/* ── 3. Leaderboard Card ───────────────────────────────────── */}
            <section className="cw-card space-y-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <h2
                  className="cw-font-doto text-xl font-extrabold"
                  style={{ color: 'var(--cw-text)' }}
                >
                  Leaderboard
                </h2>
                <span className="text-xs font-semibold" style={{ color: 'var(--cw-muted)' }}>
                  {memberCount} of {maxMembers} members
                </span>
              </div>

              {/* Weekly MCQs | Streaks Slider */}
              <CrewGlassSlider
                options={LEADERBOARD_SLIDER_OPTIONS}
                value={leaderboardTab}
                onChange={setLeaderboardTab}
                ariaLabel="Crew leaderboard metric"
                trackVariant="card2"
              />

              {/* Member Rows */}
              <div className="space-y-2.5">
                {allZeroWeekly && leaderboardTab === 'weekly' ? (
                  <div
                    className="cw-lb-row text-center text-sm py-8"
                    style={{ color: 'var(--cw-muted)' }}
                  >
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
                        className={`${
                          isCurrentUser ? 'cw-lb-row-me' : 'cw-lb-row'
                        } flex items-center justify-between gap-3 cursor-pointer`}
                        title={`View profile of ${m.displayName}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* 28px Gold Rank Badge with dark text */}
                          <span className="cw-rank-badge shrink-0">{rank}</span>

                          {/* 34px Circle Avatar in card2 */}
                          <div className="cw-avatar-34 shrink-0">
                            <BoardlyAvatar
                              name={m.displayName}
                              size={34}
                              avatarKey={m.avatarKey}
                              avatarVariant={m.avatarVariant}
                              frame={m.equipped?.frame}
                            />
                          </div>

                          {/* Nickname & Chips (Leader, Pro, You) */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-sm font-bold truncate"
                                style={{ color: 'var(--cw-text)' }}
                              >
                                {sanitizeStudentDisplayName(m.displayName, m.uid)}
                              </span>

                              {isMemLeader && (
                                <span className="cw-chip cw-chip-leader">
                                  Leader
                                </span>
                              )}

                              {/* PRO BADGE RULE: Show Pro chip ONLY when crew has active Pro AND member is Pro */}
                              {crewHasActivePro && m.isPro && (
                                <span className="cw-chip cw-chip-pro">Pro</span>
                              )}

                              {isCurrentUser && (
                                <span className="cw-chip cw-chip-you">You</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Metric Value on Right in Doto */}
                        <div className="text-right shrink-0">
                          <span
                            className="cw-font-doto text-sm sm:text-base font-extrabold tabular-nums"
                            style={{ color: 'var(--cw-text)' }}
                          >
                            {leaderboardTab === 'weekly'
                              ? m.weeklyCount !== undefined
                                ? `${m.weeklyCount} MCQs`
                                : '–'
                              : `${m.streakCount} ${
                                  m.streakCount === 1 ? 'day' : 'days'
                                }`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ── 4. Squad Weak Topics Card ─────────────────────────────── */}
            <section className="cw-card space-y-4">
              <div>
                <h2
                  className="cw-font-doto text-xl font-extrabold"
                  style={{ color: 'var(--cw-text)' }}
                >
                  Squad weak topics
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
                  Chapters where your squad made the most mistakes this week.
                </p>
              </div>

              {weakChapters.length > 0 ? (
                <div className="space-y-2.5">
                  {weakChapters.map((ch) => {
                    const count = ch.errorCount || 0;
                    const ratio = Math.min(100, Math.round((count / maxErrors) * 100));

                    return (
                      <div
                        key={ch.chapter}
                        className="cw-lb-row flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h3
                            className="text-sm font-bold truncate"
                            style={{ color: 'var(--cw-text)' }}
                          >
                            {ch.chapter}
                          </h3>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="cw-font-doto text-xs font-bold tabular-nums"
                              style={{ color: 'var(--cw-muted)' }}
                            >
                              {count} {count === 1 ? 'mistake' : 'mistakes'}
                            </span>
                            <div
                              className="h-2 w-24 sm:w-32 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'var(--cw-card)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${ratio}%`,
                                  backgroundColor: 'var(--cw-red)',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/practice?chapter=${encodeURIComponent(
                                ch.chapter
                              )}`
                            )
                          }
                          {...getCrewBtnHandlers()}
                          className="cw-btn cw-btn-glass !py-2 !px-4 !text-xs shrink-0"
                        >
                          <Target size={14} style={{ color: 'var(--cw-red-text)' }} />
                          <span>Drill</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Bordered rounded empty state in muted text */
                <div
                  className="rounded-[22px] p-6 text-center text-sm"
                  style={{
                    backgroundColor: 'var(--cw-card2)',
                    border: '1px dashed var(--cw-line)',
                    color: 'var(--cw-muted)',
                  }}
                >
                  No weak topics yet. Practice together and they will show up here.
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ─── DIALOG: LEAVE CREW (Radius 32px Glass Card over Blurred Backdrop) ─ */}
      {leaveConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-crew-dialog-title"
          className="cw-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div className="cw-dialog-card w-full max-w-sm text-center space-y-4">
            {/* Red circular icon on top */}
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cw-red) 24%, transparent)',
                boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--cw-red) 50%, transparent)',
                color: '#ffffff',
              }}
            >
              <LogOut size={20} strokeWidth={2.2} />
            </div>

            <div className="space-y-1.5">
              <h3
                id="leave-crew-dialog-title"
                className="cw-font-doto text-xl font-extrabold"
                style={{ color: 'var(--cw-text)' }}
              >
                Leave this crew?
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--cw-muted)' }}>
                Leave this squad? You can rejoin with the invite code.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-glass w-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-red w-full"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIALOG: RENAME CREW (Leader Only) ──────────────────────────── */}
      {renameModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-crew-dialog-title"
          className="cw-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div className="cw-dialog-card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3
                id="rename-crew-dialog-title"
                className="cw-font-doto text-lg font-extrabold"
                style={{ color: 'var(--cw-text)' }}
              >
                Edit Crew Name
              </h3>
              <button
                type="button"
                onClick={() => setRenameModalOpen(false)}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-icon-btn cw-btn-glass !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--cw-muted)' }}
                >
                  Crew Name (2–50 characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g. Apex Scholars"
                  className="cw-pill-input w-full h-11 px-4 text-sm font-medium"
                />
              </div>

              {renameError && (
                <div
                  className="cw-lb-row-me text-xs font-semibold"
                  style={{ color: 'var(--cw-red-text)' }}
                >
                  {renameError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-glass w-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !newSquadName.trim()}
                  {...getCrewBtnHandlers(renameLoading || !newSquadName.trim())}
                  className="cw-btn cw-btn-red w-full"
                >
                  <span>{renameLoading ? 'Saving...' : 'Save Name'}</span>
                  {renameLoading && <ButtonLineLoader />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DIALOG: TRANSFER LEADERSHIP (Leader Only) ──────────────────── */}
      {transferModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-leader-dialog-title"
          className="cw-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div className="cw-dialog-card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3
                id="transfer-leader-dialog-title"
                className="cw-font-doto text-lg font-extrabold"
                style={{ color: 'var(--cw-text)' }}
              >
                Transfer Leadership
              </h3>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-icon-btn cw-btn-glass !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--cw-muted)' }}>
              Select a crew member to become the new leader.
            </p>

            <select
              value={selectedNewLeader}
              onChange={(e) => setSelectedNewLeader(e.target.value)}
              className="cw-pill-input w-full h-11 px-4 text-xs font-semibold"
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

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-glass w-full"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={transferLoading || !selectedNewLeader}
                onClick={handleConfirmTransfer}
                {...getCrewBtnHandlers(transferLoading || !selectedNewLeader)}
                className="cw-btn cw-btn-red w-full"
              >
                <span>{transferLoading ? 'Transferring...' : 'Confirm'}</span>
                {transferLoading && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrewDashboardPage;
