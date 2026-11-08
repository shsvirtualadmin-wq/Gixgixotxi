import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { LineLoader } from '@/components/ui/LineLoader';
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

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center antialiased pb-36 rs-body text-[var(--rs-text)]">
        <LineLoader context="dashboard" variant="section" />
      </div>
    );
  }

  // Error State with Retry
  if (hasError || !streakData) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-4 antialiased pb-36 rs-body text-[var(--rs-text)]">
        <div className="w-14 h-14 rounded-full bg-[var(--rs-red)]/15 text-[var(--rs-red-text)] flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="rs-doto text-xl text-[var(--rs-text)]">Could not load streak data</h2>
        <p className="rs-body text-sm text-[var(--rs-muted)] max-w-xs">
          There was an issue connecting to your practice history. Please check your connection and retry.
        </p>
        <button
          type="button"
          onClick={loadStreakData}
          className="rs-glass-btn rs-glass-btn--red inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold min-h-[44px]"
        >
          <RotateCcw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div
      className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-5 antialiased select-none rs-body text-[var(--rs-text)]"
      style={{ paddingBottom: 'calc(136px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── 1. Top of Page ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="rs-glass-btn w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="rs-doto text-2xl sm:text-[28px] text-[var(--rs-text)]">
            Streaks
          </h1>
          <p className="rs-body text-xs sm:text-sm text-[var(--rs-muted)] mt-0.5">
            Practice a little every day and keep your streak going.
          </p>
        </div>
      </div>

      {/* ── Notification Banner ────────────────────────────────────────── */}
      {notification && (
        <div
          className={`w-full p-3.5 rounded-[20px] border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-[var(--rs-green)]/12 border-[var(--rs-green)]/30 text-[var(--rs-green)]'
              : 'bg-[var(--rs-red)]/12 border-[var(--rs-red)]/30 text-[var(--rs-red-text)]'
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

      {/* ── 2. Main Streak Card (28px radius, centered, 170px ring) ─────── */}
      <div className="rs-card rs-card--28 w-full flex flex-col items-center text-center gap-5 relative overflow-hidden">
        {/* 170px Circular Progress Ring (12px stroke, faint track, red progress with round caps) */}
        <div className="relative flex items-center justify-center w-[170px] h-[170px]">
          <svg
            width={170}
            height={170}
            viewBox="0 0 170 170"
            className="transform -rotate-90 select-none"
          >
            {/* Faint Track Circle */}
            <circle
              cx={85}
              cy={85}
              r={ringRadius}
              fill="transparent"
              stroke="var(--rs-line)"
              strokeWidth={12}
            />
            {/* Solid Red Progress Stroke */}
            <circle
              cx={85}
              cy={85}
              r={ringRadius}
              fill="transparent"
              stroke="var(--rs-red)"
              strokeWidth={12}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - nextBadgeProgress / 100)}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Big Streak Number in Doto (48px) with "day streak" under it */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="rs-doto tabular-nums text-[48px] leading-none text-[var(--rs-text)]">
              {currentStreak}
            </span>
            <span className="rs-body text-xs font-medium text-[var(--rs-muted)] mt-1.5">
              {currentStreak === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>

          {/* Small Round Red-Tinted Flame Badge at Top Right of Ring */}
          <div
            className="absolute top-1 right-1 w-9 h-9 rounded-full flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--rs-red) 16%, var(--rs-card2))',
              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--rs-red) 36%, var(--rs-line))',
              color: 'var(--rs-red-text)',
            }}
          >
            <Flame size={18} className="fill-current" />
          </div>
        </div>

        {/* Milestone Days Left (bold) & Longest Streak (muted) */}
        <div className="flex flex-col items-center gap-1">
          <span className="rs-body text-sm font-bold text-[var(--rs-text)]">
            {daysToNextBadge > 0
              ? `${daysToNextBadge} ${daysToNextBadge === 1 ? 'day' : 'days'} to ${nextBadge.name}`
              : `Milestone reached: ${nextBadge.name}!`}
          </span>
          {longestStreak > 0 && (
            <span className="rs-body text-xs text-[var(--rs-muted)] tabular-nums">
              Longest: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>

        {/* Status Banner: rounded pill-shaped row in card2 with a small orange dot */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full rs-body text-xs font-medium text-[var(--rs-text)]"
          style={{
            backgroundColor: 'var(--rs-card2)',
            boxShadow: 'inset 0 0 0 1px var(--rs-line)',
          }}
        >
          {isTodayDone ? (
            <>
              <Check size={15} className="text-[var(--rs-green)] shrink-0 stroke-[2.5]" />
              <span>Today&apos;s practice done</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Practice today to keep your streak. Ends 11:59 PM PKT</span>
            </>
          )}
        </div>

        {/* Main Button "Practice Now to Lock Streak" as a full-width red glass pill */}
        {!isTodayDone ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard/practice')}
            className="rs-glass-btn rs-glass-btn--red w-full h-12 text-sm font-bold flex items-center justify-center min-h-[48px]"
          >
            Practice Now to Lock Streak
          </button>
        ) : (
          <p className="rs-body text-xs sm:text-sm font-medium text-[var(--rs-muted)]">
            Come back tomorrow
          </p>
        )}
      </div>

      {/* ── 3. Action Buttons Row (Share Streak & Freeze Active) ─────────── */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Share Streak: glass pill button */}
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="rs-glass-btn h-12 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[44px] px-4"
        >
          <Share2 size={16} className="shrink-0" />
          <span>Share Streak</span>
        </button>

        {/* Freeze Active: blue-tinted glass pill button with a snowflake icon */}
        <button
          type="button"
          disabled={streakFreezes <= 0 && !freezeActive}
          onClick={() => setFreezeConfirmOpen(true)}
          className="rs-glass-btn rs-glass-btn--blue h-12 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[44px] px-4"
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

      {/* ── 4. "This week" Card (seven 44px rounded-square day cells, radius 14px) ── */}
      <div className="rs-card rs-card--28 w-full flex flex-col gap-3.5">
        <h3 className="rs-doto text-base text-[var(--rs-text)]">This week</h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center justify-items-center">
          {streakData.thisWeek.map((day) => {
            const cellClass = day.isPracticed
              ? 'rs-day-cell--practiced'
              : day.isFrozen
              ? 'rs-day-cell--frozen'
              : day.isToday
              ? 'rs-day-cell--today'
              : day.isFuture
              ? 'rs-day-cell--future'
              : 'rs-day-cell--missed';

            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={`rs-day-cell ${cellClass}`}
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
                    <span>{day.dayNum}</span>
                  )}
                </div>
                <span
                  className={`rs-body text-xs ${
                    day.isToday
                      ? 'font-bold text-[var(--rs-text)]'
                      : day.isFuture
                      ? 'text-[var(--rs-muted)] opacity-45'
                      : 'text-[var(--rs-muted)]'
                  }`}
                >
                  {day.weekdayInitial}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. "Last 4 weeks" Card ───────────────────────────────────────── */}
      <div className="rs-card rs-card--28 w-full flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="rs-doto text-base sm:text-lg text-[var(--rs-text)]">Last 4 weeks</h3>
          <p className="rs-body text-xs text-[var(--rs-muted)]">Pakistan Standard Time</p>
        </div>

        {/* 7-Column Grid: Weekday Headers across top */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((initial, i) => (
              <span key={i} className="rs-body text-xs font-bold text-[var(--rs-muted)] py-1">
                {initial}
              </span>
            ))}
          </div>

          {/* Month Label indicator above first row */}
          {streakData.last28Days[0]?.monthLabel && (
            <div className="rs-body text-[11px] font-bold text-[var(--rs-muted)] px-1 pt-0.5">
              {streakData.last28Days[0].monthLong}
            </div>
          )}

          {/* 7-Column Grid of Day Cells (radius 14px) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 justify-items-center">
            {streakData.last28Days.map((day) => {
              const cellClass = day.isPracticed
                ? 'rs-day-cell--practiced'
                : day.isFrozen
                ? 'rs-day-cell--frozen'
                : day.isToday
                ? 'rs-day-cell--today'
                : day.isFuture
                ? 'rs-day-cell--future'
                : 'rs-day-cell--missed';

              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`rs-day-cell w-full max-w-[44px] ${cellClass} cursor-pointer`}
                  aria-label={`${day.date}: ${day.isPracticed ? 'Practiced' : 'No practice'}`}
                >
                  {day.monthLabel && day.date !== streakData.last28Days[0]?.date && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 text-[9px] font-bold rounded bg-[var(--rs-card)] text-[var(--rs-text)] border border-[var(--rs-line)]">
                      {day.monthLabel}
                    </span>
                  )}
                  {day.isFrozen ? <Snowflake size={14} /> : day.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend Row separated by a thin top line */}
        <div
          className="flex items-center justify-between flex-wrap gap-3 pt-3 rs-body text-xs text-[var(--rs-muted)]"
          style={{ borderTop: '1px solid var(--rs-line)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[4px] bg-[var(--rs-red)]" />
            <span>Practiced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-[4px] flex items-center justify-center text-[var(--rs-blue)] text-[9px]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--rs-blue) 18%, var(--rs-card2))',
                border: '1px solid var(--rs-blue)',
              }}
            >
              ❄
            </span>
            <span>Freeze used</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[4px] bg-[var(--rs-card2)] border border-dashed border-[var(--rs-red)]" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-[4px] bg-[var(--rs-card2)]"
              style={{ border: '1px solid var(--rs-line)' }}
            />
            <span>Missed</span>
          </div>
        </div>
      </div>

      {/* ── 6. Badges and Rewards ("Streak badges") ───────────────────────── */}
      <div className="w-full flex flex-col gap-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="rs-doto text-lg sm:text-xl text-[var(--rs-text)]">Streak badges</h2>
            <p className="rs-body text-xs sm:text-sm text-[var(--rs-muted)] mt-0.5">
              Reach a streak milestone to unlock a badge and a reward. You can equip up to 3.
            </p>
          </div>
          <span className="rs-doto text-xs sm:text-sm text-[var(--rs-muted)] shrink-0 self-start sm:self-auto">
            Equipped {equippedBadges.length} of 3
          </span>
        </div>

        {/* Highlighted NEXT Badge Card */}
        {nextBadge && (
          <div
            onClick={() => setSelectedBadge(nextBadge)}
            className="w-full rs-card rs-card--28 p-4 sm:p-5 flex flex-col gap-4 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <AnimeBadgeEmblem
                badge={nextBadge}
                isUnlocked={currentStreak >= nextBadge.days}
                size={72}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="rs-doto text-base text-[var(--rs-text)] truncate">
                    {nextBadge.name}
                  </h3>
                  <span className="rs-doto text-xs text-[var(--rs-muted)] shrink-0">
                    {nextBadge.days} days
                  </span>
                </div>
                <p className="rs-body text-xs text-[var(--rs-muted)] mt-1 line-clamp-1">
                  Reward: {nextBadge.rewardTitle}
                </p>
              </div>
            </div>

            {/* Full-width thin red progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-1.5 rounded-full bg-[var(--rs-card2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--rs-red)] transition-all duration-500"
                  style={{ width: `${nextBadgeProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--rs-muted)] rs-body">
                <span>
                  {daysToNextBadge > 0
                    ? `${daysToNextBadge} more ${daysToNextBadge === 1 ? 'day' : 'days'} to unlock`
                    : 'Milestone reached!'}
                </span>
                <span className="tabular-nums font-bold">{nextBadgeProgress}%</span>
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
                className={`rs-card rs-card--24 p-4 transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isEquipped
                    ? 'ring-1 ring-[var(--rs-red)]'
                    : isEarned
                    ? ''
                    : 'opacity-75'
                }`}
              >
                {/* Badge Emblem & Tier Pill */}
                <div className="flex items-start justify-between gap-2">
                  <AnimeBadgeEmblem badge={b} isUnlocked={isEarned} size={56} />
                  <span className="rs-chip shrink-0">
                    {b.tierName}
                  </span>
                </div>

                {/* Name & Days */}
                <div className="flex flex-col min-w-0">
                  <h4 className="rs-doto text-xs sm:text-sm text-[var(--rs-text)] truncate">
                    {b.name}
                  </h4>
                  <span className="rs-doto text-[11px] text-[var(--rs-muted)] mt-0.5">
                    {b.days} days
                  </span>
                </div>

                {/* State: Equip / Equipped button or Lock icon */}
                <div
                  className="pt-2.5 flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--rs-line)' }}
                >
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
                      className={`w-full py-1.5 px-3 text-xs font-bold flex items-center justify-center min-h-[36px] rs-glass-btn ${
                        isEquipped ? 'rs-glass-btn--red' : ''
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
                    <div className="flex items-center gap-1.5 text-xs text-[var(--rs-muted)] rs-body py-1">
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
      <div className="w-full rs-card rs-card--28 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setHowStreaksWorkOpen((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[48px]"
          aria-expanded={howStreaksWorkOpen}
        >
          <div className="flex items-center gap-2.5">
            <Info size={18} className="text-[var(--rs-red-text)] shrink-0" />
            <h3 className="rs-doto text-sm sm:text-base text-[var(--rs-text)]">
              How streaks work
            </h3>
          </div>
          <ChevronDown
            size={18}
            className={`text-[var(--rs-muted)] transition-transform duration-200 ${
              howStreaksWorkOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {howStreaksWorkOpen && (
          <div
            className="px-5 pb-5 pt-3 text-xs sm:text-sm text-[var(--rs-muted)] rs-body flex flex-col gap-2.5 leading-relaxed"
            style={{ borderTop: '1px solid var(--rs-line)' }}
          >
            <p>• A new day starts at 12:00 AM Pakistan Standard Time (PKT).</p>
            <p>• Finish any practice test during the day to add 1 day to your streak.</p>
            <p>• If you miss a day, your streak goes back to 0, unless a Streak Freeze is active.</p>
          </div>
        )}
      </div>

      {/* ── Day Details Bottom Sheet ────────────────────────────────────── */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] rs-card rs-card--28 p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--rs-line)' }}
            >
              <div>
                <span className="text-xs text-[var(--rs-muted)] rs-body">
                  {selectedDay.weekday} · PKT
                </span>
                <h3 className="rs-doto text-base sm:text-lg text-[var(--rs-text)]">
                  {selectedDay.month} {selectedDay.dayNum}, {selectedDay.date.slice(0, 4)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Close"
                className="w-8 h-8 rs-glass-btn flex items-center justify-center text-[var(--rs-text)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 py-1 text-sm rs-body">
              <div className="flex justify-between items-center">
                <span className="text-[var(--rs-muted)]">Status</span>
                <span
                  className={`font-bold ${
                    selectedDay.isPracticed
                      ? 'text-[var(--rs-green)]'
                      : selectedDay.isFrozen
                      ? 'text-[var(--rs-blue)]'
                      : selectedDay.isToday
                      ? 'text-[var(--rs-gold)]'
                      : 'text-[var(--rs-muted)]'
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
                    <span className="text-[var(--rs-muted)]">MCQs Solved</span>
                    <span className="rs-doto text-[var(--rs-text)]">
                      {selectedDay.mcqsSolved}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--rs-muted)]">Practice Sessions</span>
                    <span className="rs-doto text-[var(--rs-text)]">
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
                className="w-full h-11 rs-glass-btn rs-glass-btn--red font-bold text-sm flex items-center justify-center cursor-pointer min-h-[44px]"
              >
                Practice Now
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="w-full h-10 rs-glass-btn text-[var(--rs-text)] font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Badge Details Bottom Sheet ──────────────────────────────────── */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] rs-card rs-card--28 p-6 flex flex-col items-center text-center gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                aria-label="Close"
                className="w-8 h-8 rs-glass-btn flex items-center justify-center text-[var(--rs-text)] cursor-pointer"
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
              <span className="rs-chip">
                {selectedBadge.tierName} · {selectedBadge.days} days
              </span>
              <h3 className="rs-doto text-lg text-[var(--rs-text)] mt-1">
                {selectedBadge.name}
              </h3>
              <p className="rs-body text-xs text-[var(--rs-muted)] leading-relaxed mt-1 max-w-xs">
                {selectedBadge.lore}
              </p>
            </div>

            {/* Reward Box */}
            <div className="w-full p-3.5 rs-card2-row text-left flex flex-col gap-1">
              <span className="rs-body text-[11px] font-bold text-[var(--rs-muted)]">
                Customization Reward:
              </span>
              <span className="rs-body text-xs font-bold text-[var(--rs-text)]">
                {selectedBadge.rewardTitle}
              </span>
              <p className="rs-body text-xs text-[var(--rs-muted)]">
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
                className={`w-full h-11 font-bold text-sm flex items-center justify-center cursor-pointer min-h-[44px] rs-glass-btn ${
                  equippedBadges.includes(selectedBadge.id) ? 'rs-glass-btn--red' : ''
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
                <div className="w-full h-1.5 rounded-full bg-[var(--rs-card2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--rs-red)]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((currentStreak / selectedBadge.days) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <span className="rs-body text-xs text-[var(--rs-muted)] mt-1">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => !freezeToggling && setFreezeConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rs-card rs-card--28 p-6 flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--rs-blue-soft)] text-[var(--rs-blue)] mx-auto flex items-center justify-center">
              <Snowflake size={24} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="rs-doto text-base sm:text-lg text-[var(--rs-text)]">
                {freezeActive ? 'Turn Off Streak Freeze?' : 'Activate Streak Freeze?'}
              </h3>
              <p className="rs-body text-xs sm:text-sm text-[var(--rs-muted)] leading-relaxed mt-1">
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
                className="w-full h-11 rs-glass-btn rs-glass-btn--red font-bold text-sm flex items-center justify-center cursor-pointer min-h-[44px]"
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
                className="w-full h-11 rs-glass-btn text-[var(--rs-text)] font-bold text-sm flex items-center justify-center cursor-pointer min-h-[44px]"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rs-card rs-card--28 p-6 flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--rs-line)' }}
            >
              <h3 className="rs-doto text-base text-[var(--rs-text)]">Share Your Streak</h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rs-glass-btn flex items-center justify-center text-[var(--rs-text)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Achievement Preview Card */}
            <div className="p-6 rs-card2-row flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-full bg-[var(--rs-red-soft)] text-[var(--rs-red-text)]">
                <Flame size={28} className="fill-current" />
              </div>
              <span className="rs-doto text-3xl text-[var(--rs-text)]">
                {currentStreak} DAYS
              </span>
              <span className="rs-body text-xs font-bold text-[var(--rs-red-text)]">
                Unbroken Practice Streak
              </span>
              <span className="rs-body text-[11px] text-[var(--rs-muted)] mt-1">
                Boardly · boardly.cfd
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyShare}
                className="w-full h-11 rs-glass-btn text-[var(--rs-text)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {copiedShare ? (
                  <>
                    <Check size={16} className="text-[var(--rs-green)]" />
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
                className="w-full h-11 rs-glass-btn rs-glass-btn--red font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
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
