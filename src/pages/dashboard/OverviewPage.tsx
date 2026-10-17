import React, { useEffect, useRef, Component, type ErrorInfo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Target, BookOpen, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { DailyLimitsMeter } from '@/components/dashboard/DailyLimitsMeter';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { Card } from '@/components/ui/Card';

class CockpitSectionErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CockpitSectionErrorBoundary] ${this.props.title} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <AlertTriangle size={14} className="text-red-400" />
              {this.props.title} Error
            </span>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[11px] px-2 py-0.5 rounded bg-red-600 text-white font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
          <p className="font-mono text-[11px] text-red-300">
            {this.state.error?.message || 'Failed to render section'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function OverviewPage() {
  const { user, profile, loading: profileLoading, university, testDate } = useUserProfile();
  const navigate = useNavigate();
  const hasCheckedOnboardingRef = useRef(false);

  useEffect(() => {
    document.title = 'Cockpit — Boardly';
  }, []);

  // Only the dashboard may redirect new users to onboarding, and only once, after the profile has loaded and is truly missing.
  useEffect(() => {
    if (!profileLoading && user && !hasCheckedOnboardingRef.current) {
      hasCheckedOnboardingRef.current = true;
      if (!profile || profile.onboardingCompleted === false) {
        console.log('[OverviewPage] New user missing completed profile, redirecting to onboarding once.');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, profile, profileLoading, navigate]);

  if (profileLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-12 w-64 bg-[var(--card)] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
          <div className="h-32 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
          <div className="h-32 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
          <div className="h-32 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
        </div>
      </div>
    );
  }

  const isPro = Boolean(profile?.isPremium || profile?.plan === 'pro');
  const streak = Number(profile?.streak ?? 0);
  const rawName =
    profile?.displayName ||
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Student');
  const firstName = rawName.trim().split(' ')[0] || 'Student';
  const targetUniversity = profile?.targetUniversity || university;
  const targetTestDate = profile?.targetTestDate || testDate;
  const currentUid = user?.uid || '';

  return (
    <div className="flex flex-col gap-6 w-full">
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
            {targetUniversity
              ? `Target: ${targetUniversity} Admissions 2026`
              : 'Pakistan Entrance Test Command Center'}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/practice')}
          className="btn-red group cursor-pointer inline-flex items-center gap-2"
          style={{ height: '48px', padding: '12px 22px' }}
        >
          <span>Start Practice Sprint</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* ── 4-Card Cockpit Metric Row (Responsive Grid: 1 col mobile, 2 sm, 4 lg) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Target Exam Countdown */}
        <CockpitSectionErrorBoundary title="Exam Countdown">
          <Card className="justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Exam Countdown
              </span>
              <Target size={16} />
            </div>
            <div>
              <CountdownTimer
                targetTestDate={targetTestDate}
                targetUniversity={targetUniversity}
              />
            </div>
          </Card>
        </CockpitSectionErrorBoundary>

        {/* Metric 2: 7-Day Streak */}
        <CockpitSectionErrorBoundary title="7-Day Streak">
          <Card className="justify-between min-h-[135px]">
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
        </CockpitSectionErrorBoundary>

        {/* Metric 3: Daily Limit */}
        <CockpitSectionErrorBoundary title="Daily Limit">
          <Card className="justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Daily Limit
              </span>
              <BookOpen size={16} />
            </div>
            <div>
              <DailyLimitsMeter uid={currentUid} isPremium={isPro} />
            </div>
          </Card>
        </CockpitSectionErrorBoundary>

        {/* Metric 4: Current Plan Card with Upgrade (Links to /dashboard/plans) */}
        <CockpitSectionErrorBoundary title="Current Plan">
          <Card
            variant={isPro ? 'red' : 'default'}
            className="justify-between min-h-[135px] cursor-pointer"
            onClick={() => navigate('/dashboard/plans')}
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
        </CockpitSectionErrorBoundary>
      </div>

      {/* ── Main 2-Column Section: Priority Chapters & Recent Attempts ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Column 1: Priority Weak Chapters */}
        <CockpitSectionErrorBoundary title="Priority Weak Chapters">
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

            <WeakChapters uid={currentUid} />
          </Card>
        </CockpitSectionErrorBoundary>

        {/* Column 2: Recent Attempts */}
        <CockpitSectionErrorBoundary title="Recent Attempts">
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

            <RecentAttempts uid={currentUid} />
          </Card>
        </CockpitSectionErrorBoundary>
      </div>
    </div>
  );
}

export default OverviewPage;
