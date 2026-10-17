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

interface Milestone {
  days: number;
  title: string;
  badge: string;
  description: string;
}

const STREAK_MILESTONES: Milestone[] = [
  { days: 3, title: 'Ignition', badge: '🔥 Bronze', description: 'Built first 3-day momentum' },
  { days: 7, title: 'Discipline', badge: '⚡ Silver', description: 'Unbroken full 1-week chain' },
  { days: 14, title: 'Habit Locked', badge: '🌟 Gold', description: 'Consistent 2-week mastery' },
  { days: 30, title: 'Exam Titan', badge: '💎 Diamond', description: 'A full month of non-stop prep' },
  { days: 60, title: 'Merit Champion', badge: '👑 Legend', description: 'Top 1% elite entrance candidate' },
];

export function StreaksPage() {
  const { user } = useAuth();
  const pktDate = usePKTDate();
  const navigate = useNavigate();

  const [streak, setStreak] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(1);
  const [freezeActive, setFreezeActive] = useState(false);
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
        // 1. Get streak & freeze data from user doc
        const userDoc = await getDoc(doc(db, 'users', user!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStreak(Number(data.streak ?? 0));
          setStreakFreezes(Number(data.streakFreezes ?? 1));
          setFreezeActive(Boolean(data.streakFreezeActive));
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

          {/* ── Milestones & Achievements Row ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={18} className="text-[#D71921]" />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Streak Milestones &amp; Badges
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STREAK_MILESTONES.map((m) => {
                const reached = streak >= m.days;
                const progress = Math.min(Math.round((streak / m.days) * 100), 100);

                return (
                  <div
                    key={m.days}
                    className={`p-3.5 rounded-xl border transition-all ${
                      reached
                        ? 'bg-red-500/10 border-[#D71921]/40'
                        : 'bg-[var(--surface)] border-[var(--border)] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--text)]">{m.title}</span>
                      <span className="text-[11px] font-mono text-[var(--text-faint)]">
                        {m.days} Days
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mb-2">{m.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={reached ? 'text-emerald-400 font-bold' : 'text-[var(--text-faint)]'}>
                        {reached ? 'UNLOCKED' : `${streak}/${m.days} days`}
                      </span>
                      <span className="text-[var(--text-faint)]">{progress}%</span>
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
    </div>
  );
}

export default StreaksPage;
