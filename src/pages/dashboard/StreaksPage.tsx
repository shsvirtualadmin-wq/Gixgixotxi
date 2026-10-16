import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePKTDate } from '@/hooks/usePKTDate';
import { GlassCard } from '@/components/ui/GlassCard';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Flame, Calendar, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsageDoc {
  date: string;
  practiceAttempts?: number;
  aiTutorTokens?: number;
}

export function StreaksPage() {
  const { user } = useAuth();
  const pktDate = usePKTDate();
  const navigate = useNavigate();

  const [streak, setStreak] = useState(0);
  const [usageHistory, setUsageHistory] = useState<Record<string, UsageDoc>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadStreakData() {
      try {
        setLoading(true);
        // 1. Get streak from user doc
        const userDoc = await getDoc(doc(db, 'users', user!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStreak(Number(data.streak ?? 0));
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
  const daysGrid = Array.from({ length: 28 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - idx));
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    const isToday = dateStr === pktDate;
    const usage = usageHistory[dateStr];
    const hasActivity = (usage?.practiceAttempts ?? 0) > 0 || (usage?.aiTutorTokens ?? 0) > 0;
    return {
      dateStr,
      dayNum: d.getDate(),
      month: d.toLocaleString('en-US', { month: 'short' }),
      isToday,
      hasActivity,
    };
  });

  const todayActive = (usageHistory[pktDate]?.practiceAttempts ?? 0) > 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Daily Streaks & Discipline
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Consistency is the #1 predictor of entrance test merit. Keep the chain unbroken.
        </p>
      </div>

      {loading ? (
        <Skeleton height={220} />
      ) : (
        <>
          {/* Main Hero Card */}
          <GlassCard
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16,
              border: streak > 0 ? '1px solid #D71921' : '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: streak > 0 ? 'rgba(215, 25, 33, 0.15)' : 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: streak > 0 ? '#D71921' : 'var(--text-faint)',
              }}
            >
              <Flame size={32} />
            </div>

            <div>
              <span
                className="font-display tabular-nums"
                style={{
                  fontSize: 'clamp(48px, 8vw, 64px)',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: streak > 0 ? '#D71921' : 'var(--text-muted)',
                }}
              >
                {streak}
              </span>
              <p
                className="font-mono"
                style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', marginTop: 4 }}
              >
                Consecutive Day Streak
              </p>
            </div>

            {/* 7-Day row */}
            <div style={{ marginTop: 8 }}>
              <DotRowStreak days={7} activeDays={streak} todayActive={todayActive} />
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420 }}>
              {todayActive
                ? "Today's practice complete! Your streak is safely locked for tomorrow."
                : 'Complete at least 1 practice test today before 11:59 PM PKT to maintain your streak.'}
            </p>

            {!todayActive && (
              <Button variant="primary" size="md" onClick={() => navigate('/dashboard/practice')}>
                Practice Now to Save Streak
              </Button>
            )}
          </GlassCard>

          {/* 28-Day Dot Matrix Activity Grid */}
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: '#D71921' }} />
                <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Last 28 Days Matrix
                </h3>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>PKT (UTC+5)</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {daysGrid.map((day) => (
                <div
                  key={day.dateStr}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 'var(--r-input)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    background: day.hasActivity ? 'rgba(215, 25, 33, 0.12)' : 'var(--surface-hover)',
                    border: day.isToday
                      ? '1px dashed #D71921'
                      : day.hasActivity
                      ? '1px solid #D71921'
                      : '1px solid var(--border)',
                  }}
                  title={`${day.dateStr}: ${day.hasActivity ? 'Active Practice' : 'No Practice'}`}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: day.hasActivity ? '#D71921' : 'var(--text-faint)',
                      fontWeight: day.isToday ? 700 : 400,
                    }}
                  >
                    {day.month} {day.dayNum}
                  </span>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: day.hasActivity ? '#D71921' : 'var(--border)',
                    }}
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Rules Card */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: '#D71921' }} />
              Streak Verification Rules
            </h4>
            <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
              <li>Every day resets at 00:00 Pakistan Standard Time (PKT / Asia-Karachi, UTC+5).</li>
              <li>Completing any full test or practice session adds 1 day to your streak.</li>
              <li>Missing a day resets your streak to 0, which also affects your Leaderboard score bonus.</li>
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  );
}

export default StreaksPage;
