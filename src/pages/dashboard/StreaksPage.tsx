import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  computeStreakData,
  fetchUserCompletedSessionDates,
  type StreakComputationResult,
  type StreakCalendarDay,
} from '@/services/streakEngine';
import {
  ANIME_STREAK_BADGES,
  AnimeBadgeEmblem,
  redeemStreakBadge,
  toggleEquipBadge,
  type AnimeBadge,
} from '@/constants/animeBadges';
import {
  ArrowLeft,
  Flame,
  Share2,
  Snowflake,
  Check,
  Copy,
  Lock,
  ChevronDown,
  Info,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '@/utils/homeUrl';

export function StreaksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleBack = useSmartBack();

  // Streak & User State
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streakFreezes, setStreakFreezes] = useState(1);
  const [freezeActive, setFreezeActive] = useState(false);
  const [redeemedBadges, setRedeemedBadges] = useState<string[]>([]);
  const [equippedBadges, setEquippedBadges] = useState<string[]>([]);
  const [streakData, setStreakData] = useState<StreakComputationResult | null>(null);

  // Modals & Bottom Sheets
  const [selectedDay, setSelectedDay] = useState<StreakCalendarDay | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<AnimeBadge | null>(null);
  const [freezeConfirmOpen, setFreezeConfirmOpen] = useState(false);
  const [freezeToggling, setFreezeToggling] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [howStreaksWorkOpen, setHowStreaksWorkOpen] = useState(false);
  const [redeemingBadgeId, setRedeemingBadgeId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Authoritative data loading function
  const loadStreakData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setHasError(false);

      // 1. Fetch user profile for freeze, badges, and cached counters
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const uData = userSnap.exists() ? userSnap.data() : {};

      const isFreezeActive = Boolean(uData.streakFreezeActive);
      const currentFreezes = Number(uData.streakFreezes ?? 1);
      setStreakFreezes(currentFreezes);
      setFreezeActive(isFreezeActive);
      setRedeemedBadges(Array.isArray(uData.redeemedBadges) ? uData.redeemedBadges : []);
      setEquippedBadges(Array.isArray(uData.equippedBadges) ? uData.equippedBadges : []);

      // 2. Fetch all completed session PKT dates across attempts & usage
      const sessionDates = await fetchUserCompletedSessionDates(user.uid);

      // 3. Compute authoritative streak data with ONE shared function
      const computed = computeStreakData(sessionDates, {
        freezeActive: isFreezeActive,
      });
      setStreakData(computed);

      // 4. Mirror accurate streak to user doc if it diverged
      if (uData.streak !== computed.currentStreak || uData.longestStreak !== computed.longestStreak) {
        updateDoc(userRef, {
          streak: computed.currentStreak,
          longestStreak: computed.longestStreak,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          console.warn('[StreaksPage] Non-critical user doc mirror warning:', err);
        });
      }
    } catch (err) {
      console.error('[StreaksPage] Error loading streak data:', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // Current streak values
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const isTodayDone = streakData?.todayStatus.isDone ?? false;

  // Next milestone badge calculation
  const nextBadge = useMemo(() => {
    return (
      ANIME_STREAK_BADGES.find((b) => b.days > currentStreak) ||
      ANIME_STREAK_BADGES[ANIME_STREAK_BADGES.length - 1]
    );
  }, [currentStreak]);

  const daysToNextBadge = Math.max(0, nextBadge.days - currentStreak);
  const nextBadgeProgress = Math.min(
    100,
    Math.max(0, Math.round((currentStreak / nextBadge.days) * 100))
  );

  // Toggle freeze handler
  const handleConfirmFreezeToggle = async () => {
    if (!user) return;
    const nextActive = !freezeActive;
    const nextFreezes = nextActive ? Math.max(0, streakFreezes - 1) : streakFreezes + 1;

    try {
      setFreezeToggling(true);
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        streakFreezeActive: nextActive,
        streakFreezes: nextFreezes,
        updatedAt: serverTimestamp(),
      };

      try {
        await updateDoc(userRef, updates);
      } catch (_updateErr) {
        // Fallback to setDoc with merge if document is new or needs initial fields
        await setDoc(userRef, { uid: user.uid, ...updates }, { merge: true });
      }

      setFreezeActive(nextActive);
      setStreakFreezes(nextFreezes);
      setFreezeConfirmOpen(false);

      // Recompute streak with new freeze state
      if (streakData) {
        const recomputed = computeStreakData(streakData.activePKTDays, {
          freezeActive: nextActive,
        });
        setStreakData(recomputed);
      }

      setNotification({
        type: 'success',
        message: nextActive
          ? 'Streak freeze activated! Your streak is protected for 1 missed day.'
          : 'Streak freeze deactivated.',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.warn('[StreaksPage] Notice toggling streak freeze in Firestore, applying local state:', err);
      // Optimistic fallback state update so user is not blocked
      setFreezeActive(nextActive);
      setStreakFreezes(nextFreezes);
      setFreezeConfirmOpen(false);
      if (streakData) {
        const recomputed = computeStreakData(streakData.activePKTDays, {
          freezeActive: nextActive,
        });
        setStreakData(recomputed);
      }
      setNotification({
        type: 'success',
        message: nextActive ? 'Streak freeze activated.' : 'Streak freeze deactivated.',
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setFreezeToggling(false);
    }
  };

  // Badge redeem / equip handlers
  const handleRedeemBadge = async (badge: AnimeBadge) => {
    if (!user || currentStreak < badge.days || redeemedBadges.includes(badge.id)) return;
    try {
      setRedeemingBadgeId(badge.id);
      await redeemStreakBadge(user.uid, badge.id);
      setRedeemedBadges((prev) => [...prev, badge.id]);
      setNotification({ type: 'success', message: `Badge ${badge.name} unlocked!` });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setNotification({ type: 'error', message: (err as Error).message || 'Failed to redeem badge' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setRedeemingBadgeId(null);
    }
  };

  const handleToggleEquip = async (badgeId: string) => {
    if (!user || !redeemedBadges.includes(badgeId)) return;
    try {
      const updated = await toggleEquipBadge(user.uid, badgeId, equippedBadges);
      setEquippedBadges(updated);
      setNotification({ type: 'success', message: 'Badge equipment updated.' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setNotification({ type: 'error', message: (err as Error).message || 'Failed to update equipped badges' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Share handlers
  const handleCopyShare = () => {
    const text = `🔥 I'm on a ${currentStreak}-day practice streak on Boardly! Preparing daily with authentic exam questions.`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 I'm on a ${currentStreak}-day practice streak on Boardly!\nJoin me and practice daily:\nhttps://boardly.cfd`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 antialiased pb-32">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] animate-pulse" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 w-28 bg-[var(--surface-muted)] rounded-md animate-pulse" />
            <div className="h-4 w-56 bg-[var(--surface-muted)] rounded-md animate-pulse" />
          </div>
        </div>
        <div className="h-80 w-full rounded-3xl bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-28 w-full rounded-2xl bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-64 w-full rounded-2xl bg-[var(--surface-muted)] animate-pulse" />
      </div>
    );
  }

  // Error State with Retry
  if (hasError || !streakData) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-4 antialiased pb-32">
        <div className="w-14 h-14 rounded-full bg-red-500/10 text-[#D71921] flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">Could not load streak data</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          There was an issue connecting to your practice history. Please check your connection and retry.
        </p>
        <button
          type="button"
          onClick={loadStreakData}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D71921] text-white font-medium text-sm hover:bg-[#b0131a] transition-colors cursor-pointer min-h-[44px]"
        >
          <RotateCcw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 antialiased select-none pb-32">
      {/* ── 1. Top of Page ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center glass-pill text-[var(--text)] active:scale-95 transition-all cursor-pointer shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-dot text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            Streaks
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Practice a little every day and keep your streak going.
          </p>
        </div>
      </div>

      {/* ── Notification Banner ────────────────────────────────────────── */}
      {notification && (
        <div
          className={`w-full p-3 sm:p-3.5 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75 transition-opacity cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 2. Hero Card ────────────────────────────────────────────────── */}
      <div className="w-full glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center gap-5 relative overflow-hidden">
        {/* Solid 140px Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg
            width={140}
            height={140}
            viewBox="0 0 140 140"
            className="transform -rotate-90 select-none"
          >
            {/* Background Track Circle */}
            <circle
              cx={70}
              cy={70}
              r={58}
              fill="transparent"
              stroke="var(--glass-border)"
              strokeWidth={9}
            />
            {/* Solid Red Progress Stroke */}
            <circle
              cx={70}
              cy={70}
              r={58}
              fill="transparent"
              stroke="#D71921"
              strokeWidth={9}
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - nextBadgeProgress / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>

          {/* Centered Number and Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-dot text-4xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight">
              {currentStreak}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
              {currentStreak === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>

          {/* Flame Badge at Top Right */}
          <div className="absolute top-0 right-0 p-2 rounded-full bg-red-500/15 text-[#D71921] pointer-events-none">
            <Flame size={20} className="fill-[#D71921]" />
          </div>
        </div>

        {/* Milestone Days Left & Longest Streak */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-[var(--text)]">
            {daysToNextBadge > 0
              ? `${daysToNextBadge} ${daysToNextBadge === 1 ? 'day' : 'days'} to ${nextBadge.name}`
              : `Milestone reached: ${nextBadge.name}!`}
          </span>
          {longestStreak > 0 && (
            <span className="text-xs text-[var(--text-muted)] font-dot">
              Longest: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>

        {/* Today's Status Row */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-[var(--text)]">
          {isTodayDone ? (
            <>
              <Check size={16} className="text-emerald-500 shrink-0 stroke-[2.5]" />
              <span>Today's practice done</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Practice today to keep your streak. Ends 11:59 PM PKT</span>
            </>
          )}
        </div>

        {/* Primary Practice Button or Done Message */}
        {!isTodayDone ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard/practice')}
            className="w-full h-12 rounded-full btn-primary font-semibold text-sm transition-all flex items-center justify-center cursor-pointer min-h-[44px]"
          >
            Practice Now to Lock Streak
          </button>
        ) : (
          <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">
            Come back tomorrow
          </p>
        )}
      </div>

      {/* ── 3. Action Buttons Row (Share Streak & Freeze) ────────────────── */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Share Button */}
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="h-11 sm:h-12 rounded-full btn-secondary text-[var(--text)] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
        >
          <Share2 size={16} className="shrink-0" />
          <span>Share Streak</span>
        </button>

        {/* Freeze Button */}
        <button
          type="button"
          disabled={streakFreezes <= 0 && !freezeActive}
          onClick={() => setFreezeConfirmOpen(true)}
          className={`h-11 sm:h-12 rounded-full border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
            freezeActive
              ? 'border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/15 cursor-pointer'
              : streakFreezes > 0
              ? 'btn-secondary text-[var(--text)] cursor-pointer'
              : 'glass-pill text-[var(--text-muted)] opacity-50 cursor-not-allowed'
          }`}
        >
          <Snowflake size={16} className="shrink-0" />
          <span>
            {freezeActive
              ? 'Freeze Active'
              : streakFreezes > 0
              ? `Freeze (${streakFreezes} left)`
              : 'No freeze left'}
          </span>
        </button>
      </div>

      {/* ── 4. Last 7 Days ("This week") ─────────────────────────────────── */}
      <div className="w-full glass-card rounded-[28px] p-4 sm:p-5 flex flex-col gap-3">
        <h3 className="font-dot text-sm font-bold text-[var(--text)]">This week</h3>
        <div className="grid grid-cols-7 gap-2 items-center">
          {streakData.thisWeek.map((day) => {
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    day.isPracticed
                      ? 'bg-[#D71921] text-white font-bold'
                      : day.isFrozen
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-400/60'
                      : day.isToday
                      ? 'border-2 border-dashed border-[#D71921] glass-pill text-[var(--text)]'
                      : day.isFuture
                      ? 'glass-pill border-dashed text-[var(--text-muted)] opacity-40'
                      : 'glass-pill text-[var(--text-muted)]'
                  } ${day.isToday && day.isPracticed ? 'ring-2 ring-[#D71921]/30 ring-offset-2 ring-offset-[var(--card)]' : ''}`}
                  title={`${day.date}: ${
                    day.isPracticed
                      ? 'Practiced'
                      : day.isFrozen
                      ? 'Streak Freeze'
                      : day.isToday
                      ? 'Today (Pending)'
                      : day.isFuture
                      ? 'Upcoming'
                      : 'Missed'
                  }`}
                >
                  {day.isPracticed ? (
                    <Check size={16} className="stroke-[3]" />
                  ) : day.isFrozen ? (
                    <Snowflake size={15} />
                  ) : (
                    <span className="text-xs font-dot font-medium">{day.dayNum}</span>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    day.isToday
                      ? 'font-bold text-[var(--text)]'
                      : day.isFuture
                      ? 'text-[var(--text-muted)] opacity-40'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {day.weekdayInitial}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Calendar ("Last 4 weeks") ─────────────────────────────────── */}
      <div className="w-full glass-card rounded-[28px] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="font-dot text-base sm:text-lg font-bold text-[var(--text)]">Last 4 weeks</h3>
          <p className="text-xs text-[var(--text-muted)]">Pakistan Standard Time</p>
        </div>

        {/* 7-Column Grid: Weekday Headers across top */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((initial, i) => (
              <span key={i} className="text-xs font-semibold text-[var(--text-muted)] py-1">
                {initial}
              </span>
            ))}
          </div>

          {/* Month Label indicator above first row */}
          {streakData.last28Days[0]?.monthLabel && (
            <div className="text-[11px] font-semibold text-[var(--text-muted)] px-1 pt-1">
              {streakData.last28Days[0].monthLong}
            </div>
          )}

          {/* 4 Rows of 40px rounded cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {streakData.last28Days.map((day) => {
              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-xs font-dot transition-all cursor-pointer ${
                    day.isPracticed
                      ? 'bg-[#D71921] text-white font-bold shadow-xs'
                      : day.isFrozen
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-400/50 font-semibold'
                      : day.isToday
                      ? 'border-2 border-dashed border-[#D71921] glass-row text-[var(--text)] font-bold'
                      : day.isFuture
                      ? 'glass-row border-dashed text-[var(--text-muted)] opacity-35'
                      : 'glass-row text-[var(--text)] hover:border-[var(--glass-border-hover)]'
                  }`}
                  aria-label={`${day.date}: ${day.isPracticed ? 'Practiced' : 'No practice'}`}
                >
                  {/* Subtle month label badge on day 1 transition */}
                  {day.monthLabel && day.date !== streakData.last28Days[0]?.date && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 text-[9px] font-bold rounded glass-pill text-[var(--text)]">
                      {day.monthLabel}
                    </span>
                  )}
                  {day.isFrozen ? <Snowflake size={14} /> : day.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--glass-border)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#D71921]" />
            <span>Practiced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 text-[10px]">
              ❄
            </span>
            <span>Freeze used</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-dashed border-[#D71921]" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded glass-row" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      {/* ── 6. Badges and Rewards ("Streak badges") ───────────────────────── */}
      <div className="w-full flex flex-col gap-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="font-dot text-lg sm:text-xl font-bold text-[var(--text)]">Streak badges</h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Reach a streak milestone to unlock a badge and a reward. You can equip up to 3.
            </p>
          </div>
          <span className="font-dot text-xs sm:text-sm text-[var(--text-muted)] shrink-0 self-start sm:self-auto">
            Equipped {equippedBadges.length} of 3
          </span>
        </div>

        {/* Highlighted NEXT Badge Card */}
        {nextBadge && (
          <div
            onClick={() => setSelectedBadge(nextBadge)}
            className="w-full glass-card rounded-[28px] p-4 sm:p-5 flex flex-col gap-4 cursor-pointer hover:border-[var(--glass-border-hover)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <AnimeBadgeEmblem
                badge={nextBadge}
                isUnlocked={currentStreak >= nextBadge.days}
                size={72}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-dot text-base font-bold text-[var(--text)] truncate">
                    {nextBadge.name}
                  </h3>
                  <span className="font-dot text-xs font-semibold text-[var(--text-muted)] shrink-0">
                    {nextBadge.days} days
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                  Reward: {nextBadge.rewardTitle}
                </p>
              </div>
            </div>

            {/* Full-width 8px progress bar with clear track */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-2 rounded-full bg-[var(--glass-pill-bg)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D71921] transition-all duration-500"
                  style={{ width: `${nextBadgeProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>
                  {daysToNextBadge > 0
                    ? `${daysToNextBadge} more ${daysToNextBadge === 1 ? 'day' : 'days'} to unlock`
                    : 'Milestone reached!'}
                </span>
                <span className="font-dot font-bold">{nextBadgeProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Compact 2-Column Grid of All Badges */}
        <div className="grid grid-cols-2 gap-3">
          {ANIME_STREAK_BADGES.map((b) => {
            const isEarned = currentStreak >= b.days || redeemedBadges.includes(b.id);
            const isEquipped = equippedBadges.includes(b.id);

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBadge(b)}
                className={`p-3.5 rounded-[24px] transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isEquipped
                    ? 'glass-card glass-animated-border'
                    : isEarned
                    ? 'glass-card hover:border-[var(--glass-border-hover)]'
                    : 'glass-card opacity-70'
                }`}
              >
                {/* Badge Emblem & Tier Pill */}
                <div className="flex items-start justify-between gap-2">
                  <AnimeBadgeEmblem badge={b} isUnlocked={isEarned} size={56} />
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full glass-pill text-[var(--text-muted)] shrink-0">
                    {b.tierName}
                  </span>
                </div>

                {/* Name & Days */}
                <div className="flex flex-col min-w-0">
                  <h4 className="font-dot text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                    {b.name}
                  </h4>
                  <span className="font-dot text-[11px] text-[var(--text-muted)] mt-0.5">
                    {b.days} days
                  </span>
                </div>

                {/* State: Equip / Equipped button or Lock icon */}
                <div className="pt-2 border-t border-[var(--glass-border)] flex items-center justify-between">
                  {isEarned ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!redeemedBadges.includes(b.id)) {
                          handleRedeemBadge(b);
                        } else {
                          handleToggleEquip(b.id);
                        }
                      }}
                      className={`w-full py-1.5 px-3 rounded-full text-xs font-semibold transition-colors flex items-center justify-center min-h-[36px] ${
                        isEquipped
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {isEquipped
                        ? 'Equipped'
                        : redeemedBadges.includes(b.id)
                        ? 'Equip'
                        : redeemingBadgeId === b.id
                        ? 'Unlocking...'
                        : 'Unlock'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] py-1">
                      <Lock size={13} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. How Streaks Work Accordion ───────────────────────────────── */}
      <div className="w-full glass-card rounded-[28px] overflow-hidden">
        <button
          type="button"
          onClick={() => setHowStreaksWorkOpen((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[var(--glass-pill-bg)] transition-colors cursor-pointer min-h-[48px]"
          aria-expanded={howStreaksWorkOpen}
        >
          <div className="flex items-center gap-2.5">
            <Info size={18} className="text-[#D71921] shrink-0" />
            <h3 className="font-dot text-sm sm:text-base font-bold text-[var(--text)]">
              How streaks work
            </h3>
          </div>
          <ChevronDown
            size={18}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${
              howStreaksWorkOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {howStreaksWorkOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-[var(--glass-border)] text-xs sm:text-sm text-[var(--text-muted)] flex flex-col gap-2.5 leading-relaxed">
            <p>• A new day starts at 12:00 AM Pakistan Standard Time (PKT).</p>
            <p>• Finish any practice test during the day to add 1 day to your streak.</p>
            <p>• If you miss a day, your streak goes back to 0, unless a Streak Freeze is active.</p>
          </div>
        )}
      </div>

      {/* ── Day Details Bottom Sheet ────────────────────────────────────── */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-150"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] glass-panel allow-backdrop-blur p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <div>
                <span className="text-xs text-[var(--text-muted)]">
                  {selectedDay.weekday} · PKT
                </span>
                <h3 className="font-dot text-base sm:text-lg font-bold text-[var(--text)]">
                  {selectedDay.month} {selectedDay.dayNum}, {selectedDay.date.slice(0, 4)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 py-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Status</span>
                <span
                  className={`font-semibold ${
                    selectedDay.isPracticed
                      ? 'text-emerald-500'
                      : selectedDay.isFrozen
                      ? 'text-sky-400'
                      : selectedDay.isToday
                      ? 'text-amber-500'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {selectedDay.isPracticed
                    ? 'Practiced'
                    : selectedDay.isFrozen
                    ? 'Streak Freeze Used'
                    : selectedDay.isToday
                    ? 'Practice Pending'
                    : selectedDay.isFuture
                    ? 'Upcoming Day'
                    : 'No practice'}
                </span>
              </div>
              {selectedDay.isPracticed && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">MCQs Solved</span>
                    <span className="font-dot font-semibold text-[var(--text)]">
                      {selectedDay.mcqsSolved}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Practice Sessions</span>
                    <span className="font-dot font-semibold text-[var(--text)]">
                      {selectedDay.sessionCount}
                    </span>
                  </div>
                </>
              )}
            </div>

            {selectedDay.isToday && !isTodayDone && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  navigate('/dashboard/practice');
                }}
                className="w-full h-11 rounded-full btn-primary font-semibold text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                Practice Now
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="w-full h-10 rounded-full btn-secondary text-[var(--text)] font-medium text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Badge Details Bottom Sheet ──────────────────────────────────── */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] glass-panel allow-backdrop-blur p-6 flex flex-col items-center text-center gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <AnimeBadgeEmblem
              badge={selectedBadge}
              isUnlocked={currentStreak >= selectedBadge.days || redeemedBadges.includes(selectedBadge.id)}
              size={80}
            />

            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full glass-pill text-[var(--text-muted)]">
                {selectedBadge.tierName} · {selectedBadge.days} days
              </span>
              <h3 className="font-dot text-lg font-bold text-[var(--text)] mt-1">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 max-w-xs">
                {selectedBadge.lore}
              </p>
            </div>

            {/* Reward Box */}
            <div className="w-full p-3.5 rounded-[20px] glass-row text-left flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                Customization Reward:
              </span>
              <span className="text-xs font-bold text-[var(--text)]">
                {selectedBadge.rewardTitle}
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                {selectedBadge.rewardDesc}
              </p>
            </div>

            {/* Action / Progress */}
            {currentStreak >= selectedBadge.days || redeemedBadges.includes(selectedBadge.id) ? (
              <button
                type="button"
                onClick={() => {
                  if (!redeemedBadges.includes(selectedBadge.id)) {
                    handleRedeemBadge(selectedBadge);
                  } else {
                    handleToggleEquip(selectedBadge.id);
                  }
                }}
                className={`w-full h-11 rounded-full font-semibold text-sm transition-colors cursor-pointer min-h-[44px] ${
                  equippedBadges.includes(selectedBadge.id)
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {equippedBadges.includes(selectedBadge.id)
                  ? 'Equipped (Tap to Unequip)'
                  : redeemedBadges.includes(selectedBadge.id)
                  ? 'Equip to Profile'
                  : 'Unlock Badge'}
              </button>
            ) : (
              <div className="w-full flex flex-col gap-1 text-center">
                <div className="w-full h-2 rounded-full bg-[var(--glass-pill-bg)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D71921]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((currentStreak / selectedBadge.days) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)] mt-1">
                  {Math.max(0, selectedBadge.days - currentStreak)} more days of practice required
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Streak Freeze Confirmation Modal ────────────────────────────── */}
      {freezeConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150"
          onClick={() => !freezeToggling && setFreezeConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] glass-panel allow-backdrop-blur p-6 flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-sky-500/15 text-sky-400 mx-auto flex items-center justify-center">
              <Snowflake size={24} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-dot text-base sm:text-lg font-bold text-[var(--text)]">
                {freezeActive ? 'Turn Off Streak Freeze?' : 'Activate Streak Freeze?'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-1">
                {freezeActive
                  ? 'Your streak will no longer be protected if you miss a practice day.'
                  : 'A Streak Freeze shields your streak for 1 day if you miss a daily practice session. When active, it automatically covers your missed day so your streak doesn’t reset to zero.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={freezeToggling}
                onClick={handleConfirmFreezeToggle}
                className="w-full h-11 rounded-full btn-primary font-semibold text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                {freezeToggling
                  ? 'Updating...'
                  : freezeActive
                  ? 'Turn Off Freeze'
                  : 'Activate Freeze'}
              </button>
              <button
                type="button"
                disabled={freezeToggling}
                onClick={() => setFreezeConfirmOpen(false)}
                className="w-full h-11 rounded-full btn-secondary text-[var(--text)] font-medium text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ─────────────────────────────────────────────────── */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] glass-panel allow-backdrop-blur p-6 flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <h3 className="font-dot text-base font-bold text-[var(--text)]">Share Your Streak</h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Achievement Preview Card */}
            <div className="p-6 rounded-[22px] glass-row flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-full bg-red-500/15 text-[#D71921]">
                <Flame size={28} className="fill-[#D71921]" />
              </div>
              <span className="font-dot text-3xl font-extrabold text-[var(--text)]">
                {currentStreak} DAYS
              </span>
              <span className="text-xs font-semibold text-[#D71921]">
                Unbroken Practice Streak
              </span>
              <span className="text-[11px] text-[var(--text-muted)] mt-1">
                Boardly · boardly.cfd
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyShare}
                className="w-full h-11 rounded-full btn-secondary text-[var(--text)] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                {copiedShare ? (
                  <>
                    <Check size={16} className="text-emerald-500" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Achievement Text</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full h-11 rounded-full btn-primary font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <Share2 size={16} />
                <span>Share to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreaksPage;
