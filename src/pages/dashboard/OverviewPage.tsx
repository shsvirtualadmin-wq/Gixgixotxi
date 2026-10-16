import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { DailyLimitsMeter } from '@/components/dashboard/DailyLimitsMeter';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Flame, Zap, ArrowRight, BookOpen, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OverviewPage() {
  const { user } = useAuth();
  const { profile, loading, error } = useProfile(user?.uid ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Overview — Boardly';
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>
        <Skeleton height={40} width="40%" />
        <Skeleton height={140} />
        <Skeleton height={240} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your profile"
        error={{ code: error.code, message: error.message }}
        path={error.path}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const isPremium = profile?.isPremium || profile?.plan === 'pro';
  const streak = Number(profile?.streak ?? 0);
  const firstName = profile?.displayName ? profile.displayName.split(' ')[0] : 'Student';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Salam, {firstName}!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            {profile?.targetUniversity ? `Target: ${profile.targetUniversity}` : 'Entrance Test Command Center'}
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/dashboard/practice')}>
          <Zap size={15} /> Start Practice Test
        </Button>
      </div>

      {/* ── 4-Card Cockpit Grid ───────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* Card 1: Today's Streak */}
        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            borderLeft: streak > 0 ? '4px solid #D71921' : '1px solid var(--border)',
          }}
          onClick={() => navigate('/dashboard/streaks')}
          hover
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Current Streak
            </span>
            <Flame size={18} style={{ color: streak > 0 ? '#D71921' : 'var(--text-faint)' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 36, fontWeight: 900, color: streak > 0 ? '#D71921' : 'var(--text-muted)' }}>
                {streak}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                Days
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <DotRowStreak days={7} activeDays={streak} todayActive={streak > 0} />
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Countdown to Test Date */}
        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}
          onClick={() => navigate('/dashboard/settings')}
          hover
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Exam Countdown
            </span>
            <Target size={18} style={{ color: 'var(--text-faint)' }} />
          </div>

          <div>
            <CountdownTimer
              targetTestDate={profile?.targetTestDate}
              targetUniversity={profile?.targetUniversity}
            />
          </div>
        </GlassCard>

        {/* Card 3: Daily Limit Meter */}
        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Daily Practice Limit
            </span>
            <BookOpen size={18} style={{ color: 'var(--text-faint)' }} />
          </div>

          <div>
            <DailyLimitsMeter uid={user.uid} isPremium={isPremium} />
          </div>
        </GlassCard>

        {/* Card 4: Current Plan */}
        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            borderLeft: isPremium ? '4px solid #D71921' : '1px solid var(--border)',
          }}
          onClick={() => navigate('/dashboard/plans')}
          hover
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Subscription
            </span>
            <Sparkles size={18} style={{ color: isPremium ? '#D71921' : 'var(--text-faint)' }} />
          </div>

          <div>
            <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: isPremium ? '#D71921' : 'var(--text)' }}>
              {isPremium ? 'PRO MEMBER' : 'FREE TIER'}
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {isPremium
                ? 'Unlimited MCQs & AI Tutor'
                : 'Upgrade for PKR 199/mo'}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* ── Main 2-Column Section: Weak Chapters & Recent Attempts ───── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* Top 3 Weak Chapters */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} style={{ color: '#D71921' }} />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Top Weak Chapters
              </h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/weak-chapters')}
              style={{ fontSize: 12, color: '#D71921', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Diagnostic View <ArrowRight size={12} />
            </button>
          </div>

          <WeakChapters uid={user.uid} />
        </GlassCard>

        {/* Recent Attempts */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} style={{ color: '#D71921' }} />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Recent Attempts
              </h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/results')}
              style={{ fontSize: 12, color: '#D71921', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              All Results <ArrowRight size={12} />
            </button>
          </div>

          <RecentAttempts uid={user.uid} />
        </GlassCard>
      </div>
    </div>
  );
}

export default OverviewPage;
