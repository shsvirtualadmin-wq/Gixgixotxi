import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { StreakBadge } from '@/components/dashboard/StreakBadge';
import { DailyLimitsMeter } from '@/components/dashboard/DailyLimitsMeter';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { PhoneMockup } from '@/components/landing/PhoneMockup';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { X } from 'lucide-react';

const MOCKUP_DISMISSED_KEY = 'boardly_overview_mockup_dismissed';

export function OverviewPage() {
  const { user } = useAuth();
  const { profile, loading, error } = useProfile(user?.uid ?? null);
  const [mockupDismissed, setMockupDismissed] = useState(() =>
    localStorage.getItem(MOCKUP_DISMISSED_KEY) === 'true'
  );

  const dismissMockup = () => {
    setMockupDismissed(true);
    localStorage.setItem(MOCKUP_DISMISSED_KEY, 'true');
  };

  useEffect(() => {
    document.title = 'Overview — Boardly';
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
        <Skeleton height={40} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
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
        onBack={() => { /* sign out is in top bar */ }}
        backLabel="Sign Out"
      />
    );
  }

  const isPremium = profile?.isPremium || profile?.plan === 'pro';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <div>
        <h1
          className="font-display"
          style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Welcome back{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4 }}>
          {profile?.targetUniversity ? `Preparing for ${profile.targetUniversity}` : 'Your test prep cockpit'}
        </p>
      </div>

      {/* Dismissible PhoneMockup card */}
      {!mockupDismissed && (
        <div
          className="glass"
          style={{ borderRadius: 'var(--r-card)', padding: '1.5rem', position: 'relative' }}
        >
          <button
            onClick={dismissMockup}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>Sample preview</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneMockup initialScreen={0} compact />
          </div>
        </div>
      )}

      {/* Countdown + Streak row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Test Countdown
          </p>
          <CountdownTimer
            targetTestDate={profile?.targetTestDate}
            targetUniversity={profile?.targetUniversity}
          />
        </div>

        <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Study Streak
          </p>
          <StreakBadge streak={profile?.streak ?? 0} />
        </div>
      </div>

      {/* Daily Limits */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Daily Limits</p>
        <DailyLimitsMeter uid={user.uid} isPremium={isPremium ?? false} />
      </div>

      {/* Recent Attempts */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Recent Attempts</p>
        <RecentAttempts uid={user.uid} />
      </div>

      {/* Weak Chapters */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Needs Work</p>
        <WeakChapters uid={user.uid} />
      </div>
    </div>
  );
}
