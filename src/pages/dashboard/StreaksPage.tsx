import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePKTDate } from '@/hooks/usePKTDate';
import { GlassCard } from '@/components/ui/GlassCard';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { DottedRingProgress } from '@/components/ui/DottedRingProgress';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import {
  Flame,
  Calendar,
  ShieldCheck,
  Award,
  Share2,
  Snowflake,
  Check,
  Copy,
  ArrowRight,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsageDoc {
  date: string;
  practiceAttempts?: number;
  aiTutorTokens?: number;
  arenaSessions?: number;
}

import {
  ANIME_STREAK_BADGES,
  AnimeBadgeEmblem,
  redeemStreakBadge,
  toggleEquipBadge,
  type AnimeBadge,
} from '@/constants/animeBadges';

export function StreaksPage() {
  const { user } = useAuth();
  const pktDate = usePKTDate();
  const navigate = useNavigate();

  const [streak, setStreak] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(1);
  const [freezeActive, setFreezeActive] = useState(false);
  const [redeemedBadges, setRedeemedBadges] = useState<string[]>([]);
  const [equippedBadges, setEquippedBadges] = useState<string[]>([]);
  const [redeemingBadgeId, setRedeemingBadgeId] = useState<string | null>(null);
  const [justUnlockedBadge, setJustUnlockedBadge] = useState<AnimeBadge | null>(null);
  const [usageHistory, setUsageHistory] = useState<Record<string, UsageDoc>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    dayNum: number;
    month: string;
    weekday: string;
    usage?: UsageDoc;
    hasActivity: boolean;
    isToday: boolean;
  } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadStreakData() {
      try {
        setLoading(true);
        // 1. Get streak & freeze & badge data from user doc
        const userDoc = await getDoc(doc(db, 'users', user!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStreak(Number(data.streak ?? 0));
          setStreakFreezes(Number(data.streakFreezes ?? 1));
          setFreezeActive(Boolean(data.streakFreezeActive));
          setRedeemedBadges(Array.isArray(data.redeemedBadges) ? data.redeemedBadges : []);
          setEquippedBadges(Array.isArray(data.equippedBadges) ? data.equippedBadges : []);
        }

        // 2. Get past usage subcollection
        const usageSnap = await getDocs(collection(db, 'users', user!.uid, 'usage'));
        const hist: Record<string, UsageDoc> = {};
        usageSnap.docs.forEach((d) => {
          hist[d.id] = { date: d.id, ...d.data() } as UsageDoc;
        });
        setUsageHistory(hist);
      } catch (err) {
        console.warn('[StreaksPage] Error loading streak:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStreakData();
  }, [user]);

  // Generate last 28 days for dot matrix
  const daysGrid = useMemo(() => {
    return Array.from({ length: 28 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - idx));
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      const isToday = dateStr === pktDate;
      const usage = usageHistory[dateStr];
      const hasActivity =
        (usage?.practiceAttempts ?? 0) > 0 ||
        (usage?.aiTutorTokens ?? 0) > 0 ||
        (usage?.arenaSessions ?? 0) > 0;
      return {
        dateStr,
        dayNum: d.getDate(),
        month: d.toLocaleString('en-US', { month: 'short' }),
        weekday: d.toLocaleString('en-US', { weekday: 'short' }),
        isToday,
        hasActivity,
        usage,
      };
    });
  }, [usageHistory, pktDate]);

  const todayUsage = usageHistory[pktDate];
  const todayActive = (todayUsage?.practiceAttempts ?? 0) > 0;

  const handleToggleFreeze = async () => {
    if (!user) return;
    if (streakFreezes <= 0 && !freezeActive) {
      alert('You have no streak freeze shields remaining for this month.');
      return;
    }

    try {
      const nextActive = !freezeActive;
      const nextFreezes = nextActive ? Math.max(0, streakFreezes - 1) : streakFreezes + 1;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          streakFreezeActive: nextActive,
          streakFreezes: nextFreezes,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setFreezeActive(nextActive);
      setStreakFreezes(nextFreezes);
    } catch (err) {
      console.warn('[StreaksPage] Failed to toggle streak freeze:', err);
    }
  };

  const handleCopyShare = () => {
    const text = `🔥 I'm on a ${streak}-day entrance test prep streak on Boardly (boardly.cfd)! Preparing for FAST-NUCES and NUST NET daily. Keep the chain unbroken!`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 I'm on a ${streak}-day entrance test prep streak on Boardly!\nJoin me and practice daily for FAST, NUST & GIKI:\nhttps://boardly.cfd`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="badge-pill mb-2">Discipline & Consistency</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
            Daily Streaks & Consistency Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Consistency is the #1 predictor of entrance test merit. Keep the chain unbroken.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
            <Share2 size={14} /> Share Streak
          </Button>
          <Button
            variant={freezeActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleToggleFreeze}
            title="Freeze streak for 24 hours if you need a rest day"
          >
            <Snowflake size={14} className={freezeActive ? 'text-cyan-400' : ''} />
            <span>{freezeActive ? 'Freeze Active' : `Freeze (${streakFreezes} left)`}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton height={280} />
      ) : (
        <>
          {/* ── Main Hero Card: Dot Ring Hero + Today Dots + Week Row ── */}
          <GlassCard
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 20,
              border: streak > 0 ? '1px solid #D71921' : '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Dot Ring Progress Hero */}
            <div className="relative flex items-center justify-center">
              <DottedRingProgress
                value={Math.min(streak, 30)}
                max={30}
                size={170}
                strokeWidth={9}
                label={`${streak}`}
                sublabel="DAY STREAK"
              />
              <div className="absolute -top-1 -right-1 p-2 rounded-full bg-red-500/20 text-[#D71921]">
                <Flame size={20} />
              </div>
            </div>

            {/* Today Activity Indicator */}
            <div className="flex items-center gap-2 p-2 px-3.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  todayActive
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="font-heading font-medium text-[var(--text)]">
                {todayActive
                  ? "Today's goal achieved! Streak locked for tomorrow."
                  : 'Today pending: Complete 1 test before 11:59 PM PKT.'}
              </span>
            </div>

            {/* 7-Day Week Row */}
            <div style={{ marginTop: 4 }}>
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] tracking-wider block mb-2">
                Last 7 Days Activity
              </span>
              <DotRowStreak days={7} activeDays={streak} todayActive={todayActive} />
            </div>

            {!todayActive && (
              <Button variant="primary" size="lg" onClick={() => navigate('/dashboard/practice')}>
                Practice Now to Lock Streak <ArrowRight size={16} />
              </Button>
            )}
          </GlassCard>

          {/* ── 28-Day Tappable Activity Matrix ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: '#D71921' }} />
                <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  28-Day Activity Matrix
                </h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                Tap any day for details · PKT (UTC+5)
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {daysGrid.map((day) => (
                <button
                  type="button"
                  key={day.dateStr}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '12px 6px',
                    borderRadius: 'var(--r-input)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    background: day.hasActivity
                      ? 'rgba(215, 25, 33, 0.14)'
                      : day.isToday
                      ? 'var(--surface-hover)'
                      : 'var(--surface)',
                    border: day.isToday
                      ? '2px dashed #D71921'
                      : day.hasActivity
                      ? '1px solid #D71921'
                      : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  className="hover:scale-105"
                  title={`${day.dateStr}: ${day.hasActivity ? 'Active Practice' : 'No Practice'}`}
                >
                  <span
                    className="font-mono text-[10px]"
                    style={{
                      color: day.hasActivity ? '#D71921' : 'var(--text-faint)',
                      fontWeight: day.isToday ? 700 : 500,
                    }}
                  >
                    {day.month} {day.dayNum}
                  </span>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: day.hasActivity
                        ? '#D71921'
                        : day.isToday
                        ? 'transparent'
                        : 'var(--border)',
                      border: day.isToday && !day.hasActivity ? '1.5px solid #D71921' : 'none',
                    }}
                  />
                </button>
              ))}
            </div>
          </GlassCard>

          {/* ── Anime-Style Streak Badges & Redeem System ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={20} className="text-[#D71921]" />
                  <h3 className="font-display text-lg font-bold text-[var(--text)]">
                    Anime-Style Streak Badges &amp; Rewards
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Hit consecutive study milestones to unlock and redeem mythic emblems. Equip up to 3 on your profile and national leaderboards.
                </p>
              </div>

              {/* Equipped Badges Indicator */}
              <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1.5 shrink-0">
                <span className="text-[11px] font-mono text-[var(--muted)]">Equipped:</span>
                <span className="text-xs font-bold text-[var(--text)] font-mono">
                  {equippedBadges.length} / 3
                </span>
                <div className="flex items-center -space-x-1.5 ml-1">
                  {equippedBadges.map((bId) => {
                    const b = ANIME_STREAK_BADGES.find((x) => x.id === bId);
                    if (!b) return null;
                    return (
                      <div key={bId} title={`${b.name} (${b.rewardTitle})`}>
                        <AnimeBadgeEmblem badge={b} isUnlocked={true} size={24} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ANIME_STREAK_BADGES.map((b) => {
                const reached = streak >= b.days;
                const isRedeemed = redeemedBadges.includes(b.id);
                const isEquipped = equippedBadges.includes(b.id);
                const progress = Math.min(Math.round((streak / b.days) * 100), 100);

                const handleRedeem = async () => {
                  if (!user || !reached || isRedeemed || redeemingBadgeId) return;
                  setRedeemingBadgeId(b.id);
                  try {
                    await redeemStreakBadge(user.uid, b.id);
                    setRedeemedBadges((prev) => [...prev, b.id]);
                    setJustUnlockedBadge(b);
                  } catch (err: unknown) {
                    alert((err as Error).message || 'Redeem failed');
                  } finally {
                    setRedeemingBadgeId(null);
                  }
                };

                const handleToggleEquip = async () => {
                  if (!user || !isRedeemed) return;
                  try {
                    const updated = await toggleEquipBadge(user.uid, b.id, equippedBadges);
                    setEquippedBadges(updated);
                  } catch (err: unknown) {
                    alert((err as Error).message || 'Failed to update equipped badges');
                  }
                };

                return (
                  <div
                    key={b.id}
                    className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                      isRedeemed
                        ? 'bg-[var(--surface-2)]/80 border-[var(--border)] shadow-lg'
                        : reached
                        ? 'bg-red-500/10 border-[#D71921]/60 shadow-md ring-1 ring-[#D71921]/30'
                        : 'bg-[var(--surface)]/40 border-[var(--border)] opacity-60'
                    }`}
                  >
                    {/* Top Row: Emblem & Meta */}
                    <div className="flex items-start gap-3.5">
                      <AnimeBadgeEmblem
                        badge={b}
                        isUnlocked={reached || isRedeemed}
                        size={56}
                        className={reached && !isRedeemed ? 'animate-pulse' : ''}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${b.accentColor}20`,
                              color: b.accentColor,
                              border: `1px solid ${b.accentColor}40`,
                            }}
                          >
                            {b.tierName}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--text-faint)]">
                            {b.days} Days
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-[var(--text)] mt-1 truncate">
                          {b.name}
                        </h4>
                        <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5 leading-snug">
                          {b.lore}
                        </p>
                      </div>
                    </div>

                    {/* Reward description tag */}
                    <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--muted)] truncate">
                        Reward: <strong className="text-[var(--text)]">{b.rewardTitle}</strong>
                      </span>

                      {/* Action Button: Redeem / Equip / Locked */}
                      {isRedeemed ? (
                        <button
                          type="button"
                          onClick={handleToggleEquip}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                              : 'bg-transparent text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
                          }`}
                        >
                          {isEquipped ? 'Equipped ✓' : 'Equip'}
                        </button>
                      ) : reached ? (
                        <button
                          type="button"
                          onClick={handleRedeem}
                          disabled={redeemingBadgeId === b.id}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#D71921] hover:bg-[#b0131a] text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer ring-2 ring-red-500/50 animate-pulse"
                        >
                          <Sparkles size={13} />
                          {redeemingBadgeId === b.id ? 'Redeeming...' : 'Unlockable — Redeem'}
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-mono font-medium text-[var(--muted)]">
                            {b.days - streak} more {b.days - streak === 1 ? 'day' : 'days'} to unlock
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${progress}%`, backgroundColor: b.accentColor }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Verification Rules Card */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: '#D71921' }} />
              Streak Verification System (PKT Standard)
            </h4>
            <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
              <li>Every calendar day resets at 00:00 Pakistan Standard Time (PKT / Asia-Karachi, UTC+5).</li>
              <li>Completing any test session adds 1 day to your active streak and locks it.</li>
              <li>Missing a day resets your streak to 0, unless your <strong>Streak Freeze Shield</strong> is active.</li>
            </ul>
          </GlassCard>
        </>
      )}

      {/* ── Day Detail Modal Sheet ─────────────────────────────────── */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">
                  {selectedDay.weekday} · PKT
                </span>
                <h3 className="text-lg font-bold font-display text-[var(--text)]">
                  {selectedDay.month} {selectedDay.dayNum}, {new Date().getFullYear()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted)]">Status:</span>
                <span className={`font-semibold ${selectedDay.hasActivity ? 'text-emerald-400' : 'text-[var(--text-faint)]'}`}>
                  {selectedDay.hasActivity ? 'Practice Completed' : 'Rest / Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted)]">Practice Attempts:</span>
                <span className="font-mono text-[var(--text)]">
                  {selectedDay.usage?.practiceAttempts ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted)]">AI Tutor Questions:</span>
                <span className="font-mono text-[var(--text)]">
                  {selectedDay.usage?.aiTutorTokens ?? 0}
                </span>
              </div>
            </div>

            {selectedDay.isToday && !todayActive && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setSelectedDay(null);
                  navigate('/dashboard/practice');
                }}
              >
                Start Practice Session
              </Button>
            )}

            <Button variant="secondary" size="sm" fullWidth onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ── Share Modal Sheet ──────────────────────────────────────── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-lg font-bold font-display text-[var(--text)]">Share Your Streak</h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Inspire your study squad and classmates!
              </p>
            </div>

            {/* Visual Achievement Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-950/40 via-black to-neutral-900 border border-[#D71921]/40 text-center flex flex-col items-center gap-2">
              <Flame size={32} className="text-[#D71921]" />
              <span className="text-3xl font-display font-extrabold text-white">{streak} DAYS</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-red-300">
                Unbroken Study Chain
              </span>
              <span className="text-[10px] text-[var(--text-faint)] mt-2">Boardly · boardly.cfd</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="md" fullWidth onClick={handleCopyShare}>
                {copiedShare ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copiedShare ? 'Copied to Clipboard!' : 'Copy Achievement Text'}</span>
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleWhatsAppShare}>
                <Share2 size={14} />
                <span>Share to WhatsApp</span>
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShareModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ── Badge Unlock Celebration Modal ── */}
      {justUnlockedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--card)] border border-[#D71921] p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D71921]/15 via-transparent to-transparent pointer-events-none" />

            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-black/50 border border-[#D71921]/40 shadow-xl mt-2 animate-bounce">
              <AnimeBadgeEmblem badge={justUnlockedBadge} isUnlocked={true} size={72} />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D71921] font-bold">
                ★ Mythic Badge Unlocked ★
              </span>
              <h3 className="text-xl font-bold font-display text-[var(--text)] mt-1">
                {justUnlockedBadge.name}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                {justUnlockedBadge.lore}
              </p>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-left">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block mb-1">
                Customization Reward Unlocked:
              </span>
              <p className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D71921]" />
                {justUnlockedBadge.rewardTitle}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                {justUnlockedBadge.rewardDesc}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setJustUnlockedBadge(null)}
            >
              Equip &amp; Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreaksPage;
