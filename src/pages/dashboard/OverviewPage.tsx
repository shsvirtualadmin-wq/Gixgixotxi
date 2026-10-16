import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Target, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { DailyLimitsMeter } from '@/components/dashboard/DailyLimitsMeter';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function OverviewPage() {
  const { user, profile: authProfile } = useAuth();
  const { profile: hookProfile, loading } = useProfile(user?.uid ?? null);
  const profile = hookProfile || authProfile;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Cockpit — Boardly';
  }, []);

  // If still completely loading and have no user or profile, render clean skeleton
  if (loading && !profile && !user) {
    return (
      <div className="flex flex-col gap-5 max-w-[1000px] mx-auto">
        <Skeleton height={36} width="40%" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton height={130} />
          <Skeleton height={130} />
          <Skeleton height={130} />
          <Skeleton height={130} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton height={240} />
          <Skeleton height={240} />
        </div>
      </div>
    );
  }

  const isPro = profile?.isPremium || profile?.plan === 'pro';
  const streak = Number(profile?.streak ?? 0);
  const rawName = profile?.displayName || profile?.name || user?.displayName || 'Student';
  const firstName = rawName.trim().split(' ')[0] || 'Student';

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="badge-pill mb-2">Student Cockpit</span>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Salam, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            {profile?.targetUniversity
              ? `Target: ${profile.targetUniversity} Admissions 2026`
              : 'Pakistan Entrance Test Command Center'}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/practice')}
          className="btn-red group cursor-pointer"
          style={{ height: '48px', padding: '12px 22px' }}
        >
          <span>Start Practice Sprint</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* ── 4-Card Cockpit Metric Row ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Target Exam Countdown in Dot Font */}
        <Card className="justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Exam Countdown
            </span>
            <Target size={16} />
          </div>
          <div>
            <CountdownTimer
              targetTestDate={profile?.targetTestDate}
              targetUniversity={profile?.targetUniversity}
            />
          </div>
        </Card>

        {/* Metric 2: Streak Dots for the Week */}
        <Card className="justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              7-Day Streak
            </span>
            <Flame size={16} className={streak > 0 ? 'text-[var(--red)]' : ''} />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-doto text-3xl font-bold text-[#FFFFFF]">
                {streak}
              </span>
              <span className="text-xs text-[var(--muted)]">Days</span>
            </div>
            <DotRowStreak days={7} activeDays={streak} todayActive={streak > 0} />
          </div>
        </Card>

        {/* Metric 3: Daily Limit Ring */}
        <Card className="justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Daily Limit
            </span>
            <BookOpen size={16} />
          </div>
          <div>
            <DailyLimitsMeter uid={user?.uid ?? ''} isPremium={isPro} />
          </div>
        </Card>

        {/* Metric 4: Current Plan Card with Upgrade */}
        <Card
          variant={isPro ? 'red' : 'default'}
          className="justify-between cursor-pointer"
          onClick={() => navigate('/pricing')}
        >
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Current Plan
            </span>
            <Sparkles size={16} className={isPro ? 'text-[var(--red)]' : ''} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span
                className="font-bold text-base text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {isPro ? 'Pro Member' : 'Free Starter'}
              </span>
              {!isPro && (
                <span className="text-[11px] text-[var(--red)] font-semibold">
                  Upgrade →
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              {isPro
                ? 'Unlimited sprints & past papers unlocked'
                : 'PKR 199/month for unlimited access'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Main 2-Column Section: 3 Priority Chapters & Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Column 1: 3 Priority Chapters with Accuracy & Practice Button */}
        <Card>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
              <h2
                className="text-base font-bold text-[var(--text)] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Priority Weak Chapters
              </h2>
            </div>
            <span className="text-xs text-[var(--muted)]">Auto-Diagnosed</span>
          </div>

          <WeakChapters uid={user?.uid ?? ''} />
        </Card>

        {/* Column 2: Recent Attempts */}
        <Card>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
              <h2
                className="text-base font-bold text-[var(--text)] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Recent Attempts
              </h2>
            </div>
            <span className="text-xs text-[var(--muted)]">Latest 5</span>
          </div>

          <RecentAttempts uid={user?.uid ?? ''} />
        </Card>
      </div>
    </div>
  );
}

export default OverviewPage;
