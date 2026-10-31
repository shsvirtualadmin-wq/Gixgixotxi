import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Target,
  BookOpen,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Clock,
  Check,
  ChevronRight,
  X,
  Sliders,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { fetchUniversities } from '@/services/universityMcqService';
import { DEFAULT_D1_UNIVERSITIES, type D1UniversityRow } from '@/constants/d1Universities';
import { DailyLimitsMeter } from '@/components/dashboard/DailyLimitsMeter';
import { RecentAttempts } from '@/components/dashboard/RecentAttempts';
import { WeakChapters } from '@/components/dashboard/WeakChapters';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { collection, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { startTestSessionWithLimit, DailyTestLimitError } from '@/services/testLimits';
import { DailyLimitBlockedSheet } from '@/components/test/DailyLimitBlockedSheet';
import { isQuotaExhaustedError } from '@/utils/quota';
import {
  TARGET_UNIVERSITY_CRITERIA,
  getUniversityCriteria,
  type UniversityCriteria,
} from '@/constants/universityCriteria';

export function OverviewPage() {
  const { user, profile, university, testDate } = useUserProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Home — Boardly';
  }, []);

  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const rawStreak = Number(profile?.streak ?? 0);
  const streak = Number.isFinite(rawStreak) && rawStreak >= 0 ? Math.floor(rawStreak) : 0;
  const rawQuestionsSolved = Number(
    (profile as { stats?: { mcqs?: unknown } } | null)?.stats?.mcqs ??
      profile?.totalQuestionsSolved ??
      0
  );
  const questionsSolved =
    Number.isFinite(rawQuestionsSolved) && rawQuestionsSolved >= 0
      ? Math.floor(rawQuestionsSolved)
      : 0;
  const rawName =
    profile?.displayName ||
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Student');
  const firstName = rawName.trim().split(' ')[0] || 'Student';
  const targetUniversity = profile?.targetUniversity || university || 'FAST-NUCES';
  const targetTestDate = profile?.targetTestDate || testDate;
  const currentUid = user?.uid || '';

  // ── Selected Blueprint State ──
  const [selectedTarget, setSelectedTarget] = useState<string>(targetUniversity);
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);

  // Sync selected target when profile loads
  useEffect(() => {
    if (profile?.targetUniversity) {
      setSelectedTarget(profile.targetUniversity);
    } else if (university) {
      setSelectedTarget(university);
    }
  }, [profile?.targetUniversity, university]);

  // Current blueprint details
  const blueprint: UniversityCriteria = useMemo(() => {
    return getUniversityCriteria(selectedTarget);
  }, [selectedTarget]);

  // ── Weighted Chapter Drill State (From query params or Weak Chapters widget) ──
  const [weightedChapter, setWeightedChapter] = useState<string | null>(null);
  const [weightedSubject, setWeightedSubject] = useState<string | null>(null);

  useEffect(() => {
    const drillCh = searchParams.get('drillChapter');
    const drillSub = searchParams.get('drillSubject');
    if (drillCh) {
      setWeightedChapter(drillCh);
      setWeightedSubject(drillSub || 'General');
      // Scroll to complete test card smoothly
      const el = document.getElementById('complete-test-card');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  const clearWeightedChapter = () => {
    setWeightedChapter(null);
    setWeightedSubject(null);
    if (searchParams.get('drillChapter')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('drillChapter');
      nextParams.delete('drillSubject');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // ── Test Launch State ──
  const [launching, setLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [blockedSheetOpen, setBlockedSheetOpen] = useState(false);
  const [todayAttempts, setTodayAttempts] = useState(0);
  const [dailyLimitError, setDailyLimitError] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const launchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = launchTimeoutRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // ── Launch Complete Test ──
  const handleStartCompleteTest = async (chapterOverride?: string, subjectOverride?: string) => {
    if (!user) {
      setLaunchError('Please sign in to start your test session.');
      return;
    }
    if (launching) return;

    const activeWeightCh = chapterOverride || weightedChapter;
    const activeWeightSub = subjectOverride || weightedSubject;

    setLaunching(true);
    setLaunchError(null);
    setLaunchStatus('Preparing your Complete Test blueprint...');

    // 15-second safety timeout
    if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
    let timedOut = false;
    launchTimeoutRef.current = setTimeout(() => {
      timedOut = true;
      setLaunching(false);
      setLaunchStatus(null);
      setLaunchError(
        'Setting up your test session took longer than expected. Please check your connection and try again.'
      );
    }, 15000);

    const newAttemptRef = doc(collection(db, 'attempts'));
    const attemptId = newAttemptRef.id;

    const attemptPayload = {
      id: attemptId,
      userId: user.uid,
      uid: user.uid,
      status: 'preparing' as const,
      mode: 'complete',
      title: `${blueprint.name} Complete Test`,
      university: blueprint.name,
      subject: activeWeightSub || 'all',
      chapter: activeWeightCh || 'general',
      weightedChapter: activeWeightCh || null,
      blueprintId: blueprint.id,
      totalQuestions: blueprint.totalQuestions,
      durationSeconds: blueprint.durationMinutes * 60,
      timed: true,
      createdAt: serverTimestamp(),
    };

    try {
      await startTestSessionWithLimit({
        uid: user.uid,
        userEmail: user.email,
        isUnlimited: Boolean(effectivePlan.isUnlimited || effectivePlan.isSuperAdmin),
        attemptPayload,
        customAttemptId: attemptId,
      });

      if (timedOut) return;
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);

      navigate(`/test/${attemptId}`, { state: { attempt: attemptPayload } });
    } catch (startErr: unknown) {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
      setLaunching(false);
      setLaunchStatus(null);

      if (
        startErr instanceof DailyTestLimitError ||
        (startErr as { code?: string })?.code === 'DAILY_TESTS_LIMIT_EXCEEDED'
      ) {
        if (!effectivePlan.isUnlimited && !effectivePlan.isSuperAdmin) {
          setBlockedSheetOpen(true);
        }
        return;
      }

      if (isQuotaExhaustedError(startErr)) {
        setLaunchError('Daily database limit reached, try again later.');
        return;
      }

      const msg = (startErr as { message?: string })?.message;
      if (msg && msg.includes('Not enough questions')) {
        setLaunchError(msg);
        return;
      }

      setLaunchError('Could not start your test session. Please check your connection and try again.');
    }
  };

  // ── D1 Universities for Cockpit "Choose your university" section (Zero Firebase) ──
  const [d1Universities, setD1Universities] = useState<D1UniversityRow[]>(DEFAULT_D1_UNIVERSITIES);
  const [loadingD1Unis, setLoadingD1Unis] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetchUniversities()
      .then((list) => {
        if (mounted) {
          setD1Universities(Array.isArray(list) && list.length > 0 ? list : DEFAULT_D1_UNIVERSITIES);
          setLoadingD1Unis(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingD1Unis(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handler for weak chapter "Drill" buttons: starts the Complete Test with that chapter weighted ~50%
  const handleDrillWeakChapter = (chapterName: string, subjectName: string) => {
    setWeightedChapter(chapterName);
    setWeightedSubject(subjectName);
    // Smooth scroll to Complete Test card
    const el = document.getElementById('complete-test-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0 overflow-x-hidden pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 min-w-0 w-full">
        <div className="min-w-0">
          <span className="badge-pill mb-2">Student Home</span>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] truncate"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Salam, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 truncate">
            Ready to practice today?
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('complete-test-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="btn-red group cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 shrink-0"
          style={{ height: '48px', padding: '12px 22px' }}
        >
          <span>Go to Complete Test</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* ── Profile Setup Banner (if not completed) ────── */}
      {profile && !profile.profileCompleted && !profile.onboardingCompleted && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(239,68,68,0.12)] text-[var(--red)] flex items-center justify-center shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm text-[var(--text)]">
                Complete Your Profile
              </p>
              <p className="text-xs text-[var(--muted)]">
                Personalize your nickname, study subjects and preferences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="btn-red text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Setup Now
          </button>
        </div>
      )}

      {/* ── 4-Card Cockpit Metric Row (Responsive Grid: 1 col mobile, 2 sm, 4 lg) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Questions Solved */}
        <Card className="justify-between min-h-[135px]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Questions Solved
            </span>
            <BookOpen size={16} />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="tabular-nums text-3xl font-bold text-[var(--text)]"
                style={{
                  fontFamily:
                    "var(--font-heading), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(questionsSolved)}
              </span>
              <span className="text-xs text-[var(--muted)]">MCQs</span>
            </div>
            <p className="text-[11px] text-[var(--muted)]">Continuous practice progress</p>
          </div>
        </Card>

        {/* Metric 2: 7-Day Streak */}
        <Card className="justify-between min-h-[135px]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              7-Day Streak
            </span>
            <Flame size={16} className={streak > 0 ? 'text-[var(--red)]' : ''} />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="tabular-nums text-3xl font-bold text-[var(--text)]"
                style={{
                  fontFamily:
                    "var(--font-heading), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(streak)}
              </span>
              <span className="text-xs text-[var(--muted)]">Days</span>
            </div>
            <DotRowStreak days={7} activeDays={streak} todayActive={streak > 0} />
          </div>
        </Card>

        {/* Metric 3: Daily Limit */}
        {!dailyLimitError && (
          <Card className="justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Daily Limit
              </span>
              <BookOpen size={16} />
            </div>
            <div>
              <DailyLimitsMeter
                uid={currentUid}
                isPremium={isPro}
                onUsageChange={setTodayAttempts}
                onError={() => setDailyLimitError(true)}
              />
            </div>
          </Card>
        )}

        {/* Metric 4: Current Plan Card with Upgrade (Links to /dashboard/plans) */}
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
                {effectivePlan.isSuperAdmin
                  ? 'Superadmin · Unlimited'
                  : isPro
                  ? (effectivePlan.source === 'crew' ? `Pro (${effectivePlan.crewName || 'Crew'})` : 'Pro Member')
                  : 'Free Starter'}
              </span>
              {!isPro && !effectivePlan.isSuperAdmin && (
                <span className="text-[11px] text-[var(--red)] font-semibold">
                  Upgrade →
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              {effectivePlan.isSuperAdmin
                ? 'Full superadmin access unlocked'
                : isPro
                ? 'Unlimited Complete Tests unlocked'
                : 'PKR 199/month for unlimited tests'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── CHOOSE YOUR UNIVERSITY (Cloudflare D1 University Bubbles) ── */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={17} className="text-[var(--accent)]" />
              <h2
                className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Choose your university
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Tap a LIVE university to practice its subject and topic MCQ bank. Universities with 0 MCQs unlock automatically as questions are added.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--muted)] shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{(d1Universities || []).filter((u) => u.mcq_count > 0).length} LIVE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] opacity-50" />
              <span>{(d1Universities || []).filter((u) => u.mcq_count === 0).length} Coming Soon</span>
            </span>
          </div>
        </div>

        {loadingD1Unis ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
            {(d1Universities || []).map((uni) => {
              const isLive = uni.mcq_count > 0;
              const initials = uni.name
                .replace(/\([^)]*\)/g, '')
                .trim()
                .split(/[\s-]+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  key={uni.id}
                  type="button"
                  disabled={!isLive}
                  onClick={() => {
                    if (!isLive) return;
                    navigate(`/dashboard/practice?university=${encodeURIComponent(uni.slug)}`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all ${
                    isLive
                      ? 'bg-[var(--surface-muted)]/60 border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm cursor-pointer group'
                      : 'bg-[var(--surface-muted)]/30 border-[var(--border)] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    {uni.logo_url ? (
                      <img
                        src={uni.logo_url}
                        alt={uni.name}
                        className="w-8 h-8 rounded-xl object-contain bg-[var(--surface)] border border-[var(--border)] p-1 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-xl border text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          isLive
                            ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {initials || 'UNI'}
                      </div>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                        isLive
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                      }`}
                    >
                      {isLive ? 'LIVE' : 'Coming Soon'}
                    </span>
                  </div>

                  <div className="min-w-0 w-full">
                    <div className="text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {uni.name}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
                      {isLive ? `${uni.mcq_count} MCQs available` : '0 MCQs · Coming Soon'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Status Banner (When launching test) ── */}
      {launchStatus && (
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-medium">{launchStatus}</span>
        </div>
      )}

      {/* ── Error Banner ── */}
      {launchError && (
        <div
          ref={errorBannerRef}
          style={{
            backgroundColor: 'rgba(215, 25, 33, 0.08)',
            borderColor: 'var(--accent)',
            color: 'var(--text)',
          }}
          className="p-4 rounded-2xl border text-xs sm:text-sm flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="text-[var(--text)] leading-relaxed font-medium">{launchError}</p>
            </div>
            <button
              type="button"
              onClick={() => setLaunchError(null)}
              className="text-xs font-semibold text-[var(--accent)] hover:underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── ONE PRIMARY CARD: COMPLETE TEST ────────────────────────── */}
      <Card
        id="complete-test-card"
        className="p-6 sm:p-7 border-[var(--accent)]/30 bg-[var(--surface)] relative overflow-hidden"
      >
        <div className="flex flex-col gap-5">
          {/* Top Row: Title, Blueprint Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge color="red">Primary Mode</Badge>
                {blueprint.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                    <Check size={11} strokeWidth={3} />
                    Verified pattern
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
                    <ShieldAlert size={11} />
                    Draft pattern
                  </span>
                )}
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Complete Test
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
                Full authentic simulation generated directly from curriculum blueprint.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setTargetPickerOpen(true)}
                className="btn-outline px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[var(--accent)]"
              >
                <Sliders size={14} className="text-[var(--accent)]" />
                <span>Blueprint: {blueprint.name}</span>
                <ChevronRight size={13} className="text-[var(--muted)]" />
              </button>
            </div>
          </div>

          {/* Weighted Chapter Callout (When user clicked 'Drill' on a weak chapter) */}
          {weightedChapter && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target size={16} className="text-[var(--red)] shrink-0" />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-[var(--text)]">Chapter Focus Active: </span>
                  <span className="text-[var(--red)] font-semibold">{weightedChapter}</span>
                  <span className="text-[var(--muted)]"> (~50% weighted in {weightedSubject || 'subject'} section)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearWeightedChapter}
                className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer shrink-0"
                title="Clear chapter weighting"
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            </div>
          )}

          {/* Blueprint Summary Card (4 Metrics Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Metric 1: Total Questions */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--muted)] block">
                Questions
              </span>
              <strong className="text-base sm:text-lg font-bold font-mono text-[var(--text)] mt-0.5 block">
                {blueprint.totalQuestions} MCQs
              </strong>
            </div>

            {/* Metric 2: Time Allowed */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--muted)] block">
                Duration
              </span>
              <strong className="text-base sm:text-lg font-bold font-mono text-[var(--text)] mt-0.5 block">
                {blueprint.durationMinutes} Mins
              </strong>
            </div>

            {/* Metric 3: Marking Scheme */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--muted)] block">
                Marking Scheme
              </span>
              <span
                className={`text-xs sm:text-sm font-bold mt-0.5 block truncate ${
                  blueprint.hasNegativeMarking ? 'text-[var(--accent)]' : 'text-emerald-500'
                }`}
              >
                {blueprint.hasNegativeMarking ? blueprint.negativeMarking : 'No Negative Marking (+1.0 / 0.0)'}
              </span>
            </div>

            {/* Metric 4: Difficulty Mix */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--muted)] block">
                Difficulty Mix
              </span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-[var(--text)] mt-0.5 block">
                {blueprint.difficultyMix
                  ? `${blueprint.difficultyMix.easy}%E · ${blueprint.difficultyMix.medium}%M · ${blueprint.difficultyMix.hard}%H`
                  : '20%E · 60%M · 20%H'}
              </span>
            </div>
          </div>

          {/* Blueprint Sections Split Breakdown */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
            <span className="text-[10px] uppercase font-semibold text-[var(--muted)] block mb-1.5">
              Section Breakdown ({(blueprint?.sections || []).length} Sections)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(blueprint?.sections || []).map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] font-medium text-[var(--text)] text-[11px]"
                >
                  <strong className="font-semibold">{s?.name || 'Section'}:</strong> {s?.count ?? 0} Qs
                  <span className="text-[10px] text-[var(--muted)] ml-1">({s?.badgeLabel || 'Standard'})</span>
                </span>
              ))}
            </div>
            {blueprint?.sourceNote && (
              <p className="text-[10px] text-[var(--muted)] mt-2 italic">
                Source: {blueprint.sourceNote}
              </p>
            )}
          </div>

          {/* Primary Launch Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--red)] shrink-0" />
              <span>
                {isPro
                  ? 'Pro account: Unlimited Complete Tests unlocked.'
                  : `Free Starter plan: 1 Complete Test per day (${Math.max(0, FREE_DAILY_TESTS - todayAttempts)} remaining today).`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStartCompleteTest()}
              disabled={launching}
              className="btn-red w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md sm:min-w-[200px]"
              style={{ height: '48px' }}
            >
              {launching ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Test...</span>
                </>
              ) : (
                <>
                  <span>
                    {weightedChapter ? `Start Complete Test (${weightedChapter})` : 'Start Complete Test'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* ── Main 2-Column Section: Priority Chapters & Recent Attempts ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Column 1: Priority Weak Chapters */}
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

          <DashboardErrorBoundary fallbackTitle="Chapters unavailable">
            <WeakChapters uid={currentUid} onDrill={handleDrillWeakChapter} />
          </DashboardErrorBoundary>
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

          <DashboardErrorBoundary fallbackTitle="Attempts unavailable">
            <RecentAttempts uid={currentUid} />
          </DashboardErrorBoundary>
        </Card>
      </div>

      {/* ── TARGET BLUEPRINT PICKER MODAL ────────────────────────── */}
      {targetPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[var(--overlay-bg)] animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[85vh] glass-panel allow-backdrop-blur rounded-t-[28px] sm:rounded-[32px] p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[var(--text)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
              <div>
                <h3
                  className="text-lg font-bold font-dot text-[var(--text)]"
                >
                  Select Test Blueprint
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Official Pakistani university criteria, negative marking rules, and section splits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetPickerOpen(false)}
                className="p-1.5 rounded-full glass-pill text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Blueprints List */}
            <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
              {TARGET_UNIVERSITY_CRITERIA.map((criteria) => {
                const isSelected = selectedTarget === criteria.name || selectedTarget === criteria.id;
                return (
                  <div
                    key={criteria.id}
                    onClick={() => {
                      setSelectedTarget(criteria.name);
                      setTargetPickerOpen(false);
                    }}
                    className={`p-4 rounded-[22px] border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'glass-row border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]'
                        : 'glass-row hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                              : 'border-[var(--glass-border)]'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--text)]">
                              {criteria.name}
                            </span>
                            {criteria.isVerified ? (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                                Verified
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
                                Draft pattern
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--muted)]">
                            {criteria.badge}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          criteria.hasNegativeMarking
                            ? 'border-red-500/40 bg-red-500/10 text-red-500'
                            : 'glass-pill text-[var(--muted)]'
                        }`}
                      >
                        {criteria.negativeMarking}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {criteria.description}
                    </p>

                    {/* Criteria Highlights: MCQs, Time, Split */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--glass-border)] text-[10px]">
                      <span className="px-2 py-0.5 rounded-full glass-pill font-mono text-[var(--text)]">
                        {criteria.totalQuestions} MCQs
                      </span>
                      <span className="px-2 py-0.5 rounded-full glass-pill font-mono text-[var(--text)]">
                        {criteria.durationMinutes} Minutes
                      </span>
                      <span className="text-[var(--muted)] truncate max-w-[280px]">
                        {(criteria.sections || []).map((s) => `${s?.name || 'Section'}: ${s?.count ?? 0}`).join(' · ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[var(--glass-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setTargetPickerOpen(false)}
                className="btn-secondary px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Limit Blocked Sheet ── */}
      <DailyLimitBlockedSheet
        isOpen={blockedSheetOpen && !effectivePlan.isUnlimited && !effectivePlan.isSuperAdmin}
        onClose={() => setBlockedSheetOpen(false)}
        testsUsed={todayAttempts >= FREE_DAILY_TESTS ? todayAttempts : FREE_DAILY_TESTS}
      />
    </div>
  );
}

export default OverviewPage;
