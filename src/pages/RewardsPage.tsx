import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Gift,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  GlassCard,
  PillRow,
  TabPills,
  KobanBadge,
  KobanCoinSvg,
  TreasureChestSvg,
  DragonCrestSvg,
  type TabPillItem,
} from '@/components/ui/RewardsPrimitives';
import {
  CHEST_DAYS,
  DEFAULT_DAILY_LADDER,
  getSecondsUntilNextPktMidnight,
  normalizeReferralCode,
  type RewardsStateResponse,
} from '@/lib/rewardsEngine';
import {
  acceptPendingReferral,
  attachReferralCode,
  buildFallbackClientState,
  claimDailyReward,
  claimMilestoneReward,
  fetchRewardsState,
  getPendingReferralCode,
} from '@/services/rewardsService';

type RewardsTabId = 'checkin' | 'milestones' | 'invite' | 'faq';

const REWARDS_TABS: TabPillItem<RewardsTabId>[] = [
  { id: 'checkin', label: 'Check-In' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'invite', label: 'Invite' },
  { id: 'faq', label: 'FAQ' },
];

const FAQ_ITEMS = [
  {
    id: 'faq-missed-day',
    question: 'What happens if I miss a day in the 30-day check-in?',
    answer:
      'Your 30-day check-in progress is cumulative and does not reset if you miss a day. Each day resets at 00:00 PKT (Asia/Karachi, UTC+5), and after Day 30 the cycle renews at Day 1.',
  },
  {
    id: 'faq-milestones',
    question: 'How are MCQ milestones counted?',
    answer:
      'Milestones count verified answered questions from your completed practice test attempts on the server. Each milestone (50, 100, 250, 500 MCQs) can be claimed once per student account.',
  },
  {
    id: 'faq-two-way',
    question: 'Why do referrals require two-way code confirmation?',
    answer:
      'To keep referrals fair for real classmates, your friend attaches your link/code on signup and shares their own BLD-XXXXXX code with you to confirm within 14 days.',
  },
  {
    id: 'faq-payout',
    question: 'When are referral Kobans paid out?',
    answer:
      'Once both codes are linked, your friend verifies their email, and they complete 20 practice MCQs, the server credits +5,000 Kobans to you and +1,000 Kobans to your friend (up to 10 paid referrals per month).',
  },
];

function parseTabFromHash(hash: string): RewardsTabId {
  const clean = hash.replace(/^#/, '').toLowerCase();
  if (clean === 'milestones' || clean === 'invite' || clean === 'faq' || clean === 'checkin') {
    return clean;
  }
  return 'checkin';
}

function formatCountdownHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function RewardsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { balance: walletBalance, refreshWallet } = useWallet();

  // Tab state synced with URL hash (#checkin, #milestones, #invite, #faq)
  const [activeTab, setActiveTab] = useState<RewardsTabId>(() =>
    typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : 'checkin'
  );

  // Single-open FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const [state, setState] = useState<RewardsStateResponse>(() =>
    buildFallbackClientState(user?.uid)
  );
  const [, setLoading] = useState<boolean>(true);
  const [countdownSec, setCountdownSec] = useState<number>(() =>
    getSecondsUntilNextPktMidnight()
  );

  // Action feedback states
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingMilestoneId, setClaimingMilestoneId] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>(
    () => getPendingReferralCode() || ''
  );
  const [attachingCode, setAttachingCode] = useState(false);
  const [confirmInputs, setConfirmInputs] = useState<Record<string, string>>({});
  const [confirmingRefId, setConfirmingRefId] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Sync tab with URL hash changes
  useEffect(() => {
    if (location.hash) {
      setActiveTab(parseTabFromHash(location.hash));
    }
  }, [location.hash]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(parseTabFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = useCallback((nextTab: RewardsTabId) => {
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      const nextUrl = `${window.location.pathname}${window.location.search}#${nextTab}`;
      window.history.replaceState(null, '', nextUrl);
    }
  }, []);

  const triggerServerNotReadyFailSafe = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: 'server_not_ready',
      statusMessage: 'Rewards are being set up',
      serverConfigured: false,
      canClaim: false,
      enabled: false,
      comingSoon: true,
    }));
    setBannerNotice({
      type: 'info',
      text: 'Rewards are being set up',
    });
  }, []);

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchRewardsState(user?.uid);
      setState(fetched);
      if (fetched.daily?.secondsUntilNextPktMidnight) {
        setCountdownSec(fetched.daily.secondsUntilNextPktMidnight);
      }
      if (fetched.state === 'server_not_ready' || !fetched.serverConfigured) {
        setBannerNotice({
          type: 'info',
          text: fetched.statusMessage || 'Rewards are being set up',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Tick PKT midnight countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSec(getSecondsUntilNextPktMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isServerNotReady = Boolean(
    state.state === 'server_not_ready' || !state.serverConfigured
  );
  const isComingSoon = Boolean(isServerNotReady || !state.canClaim || state.comingSoon);
  const isMilestoneAdminExcluded = Boolean(isAdmin && state.mode !== 'admin_only');
  const displayBalance = user ? Math.max(walletBalance, state.balance) : 0;

  const handleClaimDaily = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (isComingSoon || state.daily.claimedToday || claimingDaily) return;

    setClaimingDaily(true);
    setBannerNotice(null);
    try {
      const res = await claimDailyReward();
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: `Claimed Day ${res.dayNumber} reward: +${(res.rewardAmount || 0).toLocaleString()} Kobans!`,
        });
        await Promise.all([loadState(), refreshWallet()]);
      } else if (
        res.state === 'server_not_ready' ||
        res.code === 'SERVER_NOT_READY' ||
        res.comingSoon
      ) {
        triggerServerNotReadyFailSafe();
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Rewards are being set up',
        });
      }
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleClaimMilestone = async (milestoneId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (isComingSoon || isMilestoneAdminExcluded || claimingMilestoneId) return;

    setClaimingMilestoneId(milestoneId);
    setBannerNotice(null);
    try {
      const res = await claimMilestoneReward(milestoneId);
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: `Milestone unlocked! +${(res.rewardAmount || 0).toLocaleString()} Kobans credited to your wallet.`,
        });
        await Promise.all([loadState(), refreshWallet()]);
      } else if (
        res.state === 'server_not_ready' ||
        res.code === 'SERVER_NOT_READY' ||
        res.comingSoon
      ) {
        triggerServerNotReadyFailSafe();
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Rewards are being set up',
        });
      }
    } finally {
      setClaimingMilestoneId(null);
    }
  };

  const handleAttachManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup');
      return;
    }
    const clean = normalizeReferralCode(manualCodeInput);
    if (!clean || isComingSoon || attachingCode) return;

    setAttachingCode(true);
    setBannerNotice(null);
    try {
      const res = await attachReferralCode(clean);
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: `Attached ${res.inviterDisplayName || 'friend'}'s code! Share your code (${state.referral.myCode}) with them so they can confirm.`,
        });
        setManualCodeInput('');
        await loadState();
      } else if (
        res.state === 'server_not_ready' ||
        res.code === 'SERVER_NOT_READY' ||
        res.comingSoon
      ) {
        triggerServerNotReadyFailSafe();
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Could not attach referral code.',
        });
      }
    } finally {
      setAttachingCode(false);
    }
  };

  const handleConfirmFriendCode = async (referralId: string) => {
    if (!user || isComingSoon || confirmingRefId) return;
    const code = normalizeReferralCode(confirmInputs[referralId] || '');
    if (!code) {
      setBannerNotice({
        type: 'error',
        text: "Please enter your friend's BLD-XXXXXX referral code to confirm.",
      });
      return;
    }

    setConfirmingRefId(referralId);
    setBannerNotice(null);
    try {
      const res = await acceptPendingReferral(referralId, code);
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text:
            res.message ||
            (res.paid
              ? `Referral completed! +${(res.inviterReward || 5000).toLocaleString()} Kobans credited to your wallet!`
              : 'Friend code confirmed! Rewards will unlock automatically once they complete 20 MCQs.'),
        });
        await Promise.all([loadState(), refreshWallet()]);
      } else if (
        res.state === 'server_not_ready' ||
        res.code === 'SERVER_NOT_READY' ||
        res.comingSoon
      ) {
        triggerServerNotReadyFailSafe();
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Failed to confirm friend code.',
        });
      }
    } finally {
      setConfirmingRefId(null);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.referral.myCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(state.referral.shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleWebShare = async () => {
    const shareData = {
      title: 'Join me on Boardly — Earn 1,000 Free Kobans!',
      text: `Join me on Boardly for MDCAT, NET, ECAT & FSc practice! Use my referral code ${state.referral.myCode} to earn +1,000 bonus Kobans:`,
      url: state.referral.shareUrl,
    };
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or unsupported; fallback to copy link
      }
    }
    await handleCopyLink();
  };

  const whatsappShareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Join me on Boardly for FSc, MDCAT, NET & ECAT MCQ practice! Use my code ${state.referral.myCode} to get +1,000 bonus Kobans: ${state.referral.shareUrl}`
  )}`;

  const ladder =
    Array.isArray(state.dailyLadder) && state.dailyLadder.length === 30
      ? state.dailyLadder
      : DEFAULT_DAILY_LADDER;

  const isPublicRoute = !location.pathname.startsWith('/dashboard');

  return (
    <div
      className={`rewards-page-root relative min-h-screen w-full overflow-x-hidden pb-28 ${
        isPublicRoute ? 'pt-24 sm:pt-28' : 'pt-2 sm:pt-4'
      }`}
      style={{ color: 'var(--rw-text-primary)' }}
    >
      <PageMeta
        title="Boardly Rewards"
        description="Earn up to 7,550 Kobans every 30 days with the Boardly daily check-in, unlock MCQ practice milestones, and invite classmates for +5,000 Kobans."
        canonicalPath="/rewards"
      />

      {/* Full-Viewport Theme Background & Top/Bottom Soft Red Radial Glows */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: 'var(--rw-page-bg)' }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-x-0 top-0 h-[420px]"
          style={{ background: 'var(--rw-glow-top)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[420px]"
          style={{ background: 'var(--rw-glow-bottom)' }}
        />
      </div>

      {/* Centered Mobile-First Container (max-w-md on mobile, max-w-2xl on desktop, 16px gutters) */}
      <div className="mx-auto w-full max-w-md md:max-w-2xl px-4 space-y-5">
        {/* ─── SUPER ADMIN BANNER WHEN MODE IS NOT "EVERYONE" ─────────────── */}
        {isAdmin && state.mode !== 'everyone' && (
          <div
            data-testid="super-admin-rewards-mode-banner"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[28px] border px-5 py-4"
            style={{
              backgroundColor: 'var(--rw-accent)',
              borderColor: 'var(--rw-accent)',
              color: 'var(--rw-accent-text)',
              boxShadow: 'var(--rw-btn-primary-shadow)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <ShieldCheck size={20} className="shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold uppercase tracking-wider">
                  Super Admin Notice · Rewards Mode:{' '}
                  {state.mode === 'admin_only' ? 'ADMIN ONLY (TESTING)' : 'OFF'}
                </p>
                <p className="opacity-95 mt-0.5">
                  {state.mode === 'admin_only'
                    ? 'Only Super Admins can test claiming right now. Regular students see "Coming soon".'
                    : 'Rewards claiming is currently turned OFF for everyone. All Claim buttons show "Coming soon".'}
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition-transform active:scale-95 shrink-0"
              style={{
                backgroundColor: 'var(--rw-accent-text)',
                color: 'var(--rw-accent)',
              }}
            >
              <span>Manage in Admin</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ─── 1. HERO CARD ────────────────────────────────────────────────── */}
        <GlassCard
          as="section"
          primary
          aria-labelledby="rewards-hero-heading"
          className="p-6 sm:p-7 text-center flex flex-col items-center gap-4"
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--rw-text-label)' }}
            >
              Your Live Balance
            </span>
            {isComingSoon && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--rw-accent)',
                  color: 'var(--rw-accent-text)',
                }}
              >
                Preview
              </span>
            )}
          </div>

          <h1 id="rewards-hero-heading" className="sr-only">
            Boardly Student Rewards
          </h1>

          {/* Big Balance Display */}
          <div className="flex items-center justify-center gap-3">
            <div
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border shrink-0"
              style={{
                backgroundColor: 'var(--rw-gold-bg)',
                borderColor: 'var(--rw-gold-border)',
              }}
            >
              <KobanCoinSvg size={28} />
            </div>
            <div className="text-left">
              <span
                data-testid="rewards-balance-pill"
                className="font-display text-3xl sm:text-4xl font-black tracking-tight tabular-nums block leading-none"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                {displayBalance.toLocaleString()}{' '}
                <span
                  className="text-sm sm:text-base font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--rw-gold-text)' }}
                >
                  Kobans
                </span>
              </span>
            </div>
          </div>

          {/* Two Pill Buttons under balance */}
          {user ? (
            <div className="grid grid-cols-2 gap-3 w-full pt-1">
              <Link
                to="/store"
                className="h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--rw-accent)',
                  color: 'var(--rw-accent-text)',
                  boxShadow: 'var(--rw-btn-primary-shadow)',
                }}
              >
                <span>Spend in Store</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/dashboard/practice"
                className="h-12 min-h-[48px] rounded-full border inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--rw-btn-secondary-bg)',
                  borderColor: 'var(--rw-btn-secondary-border)',
                  color: 'var(--rw-btn-secondary-text)',
                  boxShadow: 'var(--rw-btn-secondary-shadow)',
                }}
              >
                <span>Practice MCQs</span>
              </Link>
            </div>
          ) : (
            <div className="w-full space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-3 w-full">
                <Link
                  to="/store"
                  className="h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-accent)',
                    color: 'var(--rw-accent-text)',
                    boxShadow: 'var(--rw-btn-primary-shadow)',
                  }}
                >
                  <span>Spend in Store</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/dashboard/practice"
                  className="h-12 min-h-[48px] rounded-full border inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-btn-secondary-bg)',
                    borderColor: 'var(--rw-btn-secondary-border)',
                    color: 'var(--rw-btn-secondary-text)',
                    boxShadow: 'var(--rw-btn-secondary-shadow)',
                  }}
                >
                  <span>Practice MCQs</span>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <Link
                  to="/signup"
                  className="text-xs font-bold underline underline-offset-4"
                  style={{ color: 'var(--rw-accent)' }}
                >
                  Sign up free
                </Link>
                <span style={{ color: 'var(--rw-text-label)' }}>·</span>
                <Link
                  to="/login"
                  className="text-xs font-semibold"
                  style={{ color: 'var(--rw-text-secondary)' }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Muted line beneath */}
          <p
            className="text-xs sm:text-[13px] font-medium"
            style={{ color: 'var(--rw-text-secondary)' }}
          >
            Earn up to 7,550 Kobans per 30-day cycle.
          </p>

          {/* Action Feedback Notice */}
          {bannerNotice && (
            <div
              role="status"
              className="w-full flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs sm:text-sm font-semibold text-left"
              style={
                bannerNotice.type === 'success'
                  ? {
                      backgroundColor: 'var(--rw-green-bg)',
                      borderColor: 'var(--rw-green-border)',
                      color: 'var(--rw-green-text)',
                    }
                  : bannerNotice.type === 'error'
                  ? {
                      backgroundColor: 'var(--rw-zenryu-bg)',
                      borderColor: 'var(--rw-zenryu-border)',
                      color: 'var(--rw-accent)',
                    }
                  : {
                      backgroundColor: 'var(--rw-gold-bg)',
                      borderColor: 'var(--rw-gold-border)',
                      color: 'var(--rw-gold-text)',
                    }
              }
            >
              {bannerNotice.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0" />
              ) : (
                <AlertCircle size={16} className="shrink-0" />
              )}
              <span className="truncate">{bannerNotice.text}</span>
            </div>
          )}
        </GlassCard>

        {/* ─── 2. STICKY PILL TAB SWITCHER ────────────────────────────────── */}
        <TabPills
          tabs={REWARDS_TABS}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel="Student Rewards sections"
        />

        {/* ─── 3. CHECK-IN TAB (#checkin) ─────────────────────────────────── */}
        {activeTab === 'checkin' && (
          <section
            key="checkin"
            aria-labelledby="daily-checkin-heading"
            className="rw-tab-panel space-y-4"
          >
            <div className="px-1">
              <span
                className="block text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--rw-text-label)' }}
              >
                Daily Streak Ladder
              </span>
              <h2
                id="daily-checkin-heading"
                className="font-display text-xl sm:text-2xl font-bold mt-0.5"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                30-Day Daily Check-In
              </h2>
            </div>

            {/* Pill Row: Next reset (00:00 PKT) */}
            <PillRow
              leftSlot={
                <Clock
                  size={16}
                  className="shrink-0"
                  style={{ color: 'var(--rw-accent)' }}
                />
              }
              label="Next reset (00:00 PKT)"
              value={
                <span
                  data-testid="pkt-countdown"
                  className="font-mono text-sm sm:text-base font-bold tabular-nums"
                >
                  {formatCountdownHms(countdownSec)}
                </span>
              }
            />

            {/* Full-width red button: Claim Day N (+X Kobans) */}
            <button
              type="button"
              data-testid="daily-claim-btn"
              disabled={isComingSoon || state.daily.claimedToday || claimingDaily}
              onClick={handleClaimDaily}
              className="w-full h-14 min-h-[56px] rounded-full inline-flex items-center justify-center gap-2.5 px-6 text-sm sm:text-base font-bold transition-all active:scale-[0.99] disabled:cursor-not-allowed"
              style={
                isComingSoon || state.daily.claimedToday || claimingDaily
                  ? {
                      backgroundColor: 'var(--rw-locked-bg)',
                      borderColor: 'var(--rw-locked-border)',
                      color: 'var(--rw-locked-text)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }
                  : {
                      backgroundColor: 'var(--rw-accent)',
                      color: 'var(--rw-accent-text)',
                      boxShadow: 'var(--rw-btn-primary-shadow)',
                    }
              }
            >
              <Gift size={18} />
              <span>
                {isComingSoon
                  ? 'Coming soon'
                  : state.daily.claimedToday
                  ? `Claimed Day ${state.daily.completedDaysInCycle}`
                  : claimingDaily
                  ? 'Claiming...'
                  : `Claim Day ${state.daily.nextDayNumber} (+${state.daily.nextRewardAmount} Kobans)`}
              </span>
            </button>

            {/* Compact 5-column grid of small tiles */}
            <div
              data-testid="daily-30-grid"
              className="grid grid-cols-5 gap-2 sm:gap-2.5"
            >
              {ladder.map((amount, idx) => {
                const dayNum = idx + 1;
                const isChest = CHEST_DAYS.has(dayNum);
                const isGrandChest = dayNum === 30;
                const isCompleted = state.daily.claimedToday
                  ? dayNum <= state.daily.completedDaysInCycle
                  : dayNum < state.daily.nextDayNumber;
                const isToday =
                  !state.daily.claimedToday && dayNum === state.daily.nextDayNumber;

                // Day 30 is a wider GRAND tile in red/gold
                if (isGrandChest) {
                  return (
                    <div
                      key={dayNum}
                      data-testid={`daily-tile-${dayNum}`}
                      className="col-span-5 rounded-[24px] border px-4 py-3.5 flex items-center justify-between gap-3 transition-all"
                      style={{
                        background: isCompleted
                          ? 'var(--rw-green-bg)'
                          : 'var(--rw-grand-bg)',
                        borderColor: isCompleted
                          ? 'var(--rw-green-border)'
                          : 'var(--rw-grand-border)',
                        boxShadow: isToday ? 'var(--rw-next-shadow)' : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TreasureChestSvg grand size={30} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs font-extrabold uppercase tracking-wider"
                              style={{
                                color: isCompleted
                                  ? 'var(--rw-green-text)'
                                  : 'var(--rw-accent)',
                              }}
                            >
                              Day 30 · GRAND
                            </span>
                            {isToday && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase"
                                style={{
                                  backgroundColor: 'var(--rw-accent)',
                                  color: 'var(--rw-accent-text)',
                                }}
                              >
                                NEXT
                              </span>
                            )}
                          </div>
                          <span
                            className="block text-[11px] truncate"
                            style={{ color: 'var(--rw-text-secondary)' }}
                          >
                            30-Day Grand Treasure Chest
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <KobanBadge amount={amount} size="md" />
                        {isCompleted ? (
                          <CheckCircle2
                            size={16}
                            style={{ color: 'var(--rw-green-text)' }}
                            aria-label="Completed"
                          />
                        ) : !isToday ? (
                          <Lock
                            size={14}
                            style={{ color: 'var(--rw-locked-icon)' }}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                // Standard & Chest tiles (Days 1–29; Day 28 chest spans 2 cols so rows 1-6 are 100% full)
                const tileSpanClass = dayNum === 28 ? 'col-span-2' : 'col-span-1';

                let tileBg = 'var(--rw-locked-bg)';
                let tileBorder = 'var(--rw-locked-border)';
                let tileShadow: string | undefined = undefined;

                if (isToday) {
                  tileBg = 'var(--rw-next-bg)';
                  tileBorder = 'var(--rw-next-border)';
                  tileShadow = 'var(--rw-next-shadow)';
                } else if (isCompleted) {
                  tileBg = 'var(--rw-green-bg)';
                  tileBorder = 'var(--rw-green-border)';
                } else if (isChest) {
                  tileBg = 'var(--rw-chest-bg)';
                  tileBorder = 'var(--rw-chest-border)';
                }

                return (
                  <div
                    key={dayNum}
                    data-testid={`daily-tile-${dayNum}`}
                    className={`${tileSpanClass} relative flex flex-col items-center justify-between rounded-2xl border p-2 sm:p-2.5 min-h-[82px] transition-all`}
                    style={{
                      backgroundColor: tileBg,
                      borderColor: tileBorder,
                      boxShadow: tileShadow,
                    }}
                  >
                    {/* Top row: Day number + state indicator */}
                    <div className="flex w-full items-center justify-between gap-1 text-[10px] font-bold leading-none">
                      <span
                        style={{
                          color: isToday
                            ? 'var(--rw-accent)'
                            : isCompleted
                            ? 'var(--rw-green-text)'
                            : isChest
                            ? 'var(--rw-gold-text)'
                            : 'var(--rw-locked-text)',
                        }}
                      >
                        D{dayNum}
                      </span>
                      {isCompleted ? (
                        <CheckCircle2
                          size={12}
                          className="shrink-0"
                          style={{ color: 'var(--rw-green-text)' }}
                          aria-label="Completed"
                        />
                      ) : isToday ? (
                        <span
                          className="rounded px-1 py-0.5 text-[8px] font-extrabold uppercase leading-none"
                          style={{
                            backgroundColor: 'var(--rw-accent)',
                            color: 'var(--rw-accent-text)',
                          }}
                        >
                          NEXT
                        </span>
                      ) : (
                        <Lock
                          size={10}
                          className="shrink-0"
                          style={{ color: 'var(--rw-locked-icon)' }}
                        />
                      )}
                    </div>

                    {/* Center Icon */}
                    <div className="my-1 flex items-center justify-center">
                      {isChest ? (
                        <TreasureChestSvg size={20} />
                      ) : (
                        <KobanCoinSvg size={17} />
                      )}
                    </div>

                    {/* Amount */}
                    <span
                      className="font-display text-[11px] sm:text-xs font-black tabular-nums leading-none"
                      style={{
                        color: isCompleted
                          ? 'var(--rw-green-text)'
                          : isToday
                          ? 'var(--rw-text-primary)'
                          : isChest
                          ? 'var(--rw-gold-text)'
                          : 'var(--rw-locked-text)',
                      }}
                    >
                      +{amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Muted line beneath grid */}
            <p
              className="text-center text-xs font-medium pt-1"
              style={{ color: 'var(--rw-text-secondary)' }}
            >
              Cumulative cycle. Never resets if you miss a day.
            </p>
          </section>
        )}

        {/* ─── 4. MILESTONES TAB (#milestones) ────────────────────────────── */}
        {activeTab === 'milestones' && (
          <section
            key="milestones"
            aria-labelledby="milestones-heading"
            className="rw-tab-panel space-y-4"
          >
            <div className="px-1">
              <span
                className="block text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--rw-text-label)' }}
              >
                Verified Practice Progression
              </span>
              <h2
                id="milestones-heading"
                className="font-display text-xl sm:text-2xl font-bold mt-0.5"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                MCQ Practice Milestones
              </h2>
            </div>

            {/* Pill Row: Verified MCQs answered */}
            <PillRow
              label="Verified MCQs answered"
              value={
                <span
                  data-testid="mcqs-answered-count"
                  className="font-display text-base sm:text-lg font-black tabular-nums"
                  style={{ color: 'var(--rw-text-primary)' }}
                >
                  {state.mcqsAnswered.toLocaleString()}
                </span>
              }
            />

            {isAdmin && (
              <div
                data-testid="super-admin-milestone-note"
                className="flex items-start gap-3 rounded-[24px] border p-4 text-xs"
                style={{
                  backgroundColor: 'var(--rw-gold-bg)',
                  borderColor: 'var(--rw-gold-border)',
                  color: 'var(--rw-gold-text)',
                }}
              >
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Super Admin Account Exclusion Notice</p>
                  <p className="mt-0.5 opacity-90">
                    Admin accounts have all Boardly Store items and companions unlocked by default and are excluded from claiming student MCQ milestone rewards.
                  </p>
                </div>
              </div>
            )}

            {/* One Card per Milestone (50, 100, 250, 500) */}
            <div className="space-y-3.5">
              {state.milestones.map((m) => {
                const pct = Math.min(100, Math.round((m.progress / m.threshold) * 100));
                const isClaimingThis = claimingMilestoneId === m.id;
                const isReady =
                  !isComingSoon && !isMilestoneAdminExcluded && !m.claimed && m.eligible;
                const btnDisabled =
                  isComingSoon ||
                  isMilestoneAdminExcluded ||
                  m.claimed ||
                  !m.eligible ||
                  isClaimingThis;

                return (
                  <GlassCard
                    key={m.id}
                    data-testid={`milestone-card-${m.threshold}`}
                    className="p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className="block text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--rw-text-label)' }}
                        >
                          {m.threshold.toLocaleString()} MCQs Milestone
                        </span>
                        <h3
                          className="font-display text-base sm:text-lg font-bold mt-0.5 truncate"
                          style={{ color: 'var(--rw-text-primary)' }}
                        >
                          {m.title}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--rw-text-secondary)' }}
                        >
                          {m.subtitle}
                        </p>
                      </div>

                      <KobanBadge amount={m.reward} />
                    </div>

                    {/* Slim progress bar + Claim pill button on the right */}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span style={{ color: 'var(--rw-text-secondary)' }}>
                            Progress
                          </span>
                          <span
                            className="font-mono tabular-nums"
                            style={{ color: 'var(--rw-text-primary)' }}
                          >
                            {m.progress.toLocaleString()} / {m.threshold.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full"
                          style={{ backgroundColor: 'var(--rw-progress-track)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: m.claimed
                                ? 'var(--rw-green-text)'
                                : 'var(--rw-accent)',
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`milestone-claim-btn-${m.threshold}`}
                        disabled={btnDisabled}
                        onClick={() => handleClaimMilestone(m.id)}
                        className="h-10 min-h-[40px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 transition-all active:scale-95 disabled:cursor-not-allowed"
                        style={
                          m.claimed
                            ? {
                                backgroundColor: 'var(--rw-green-bg)',
                                borderColor: 'var(--rw-green-border)',
                                color: 'var(--rw-green-text)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                              }
                            : isReady
                            ? {
                                backgroundColor: 'var(--rw-accent)',
                                color: 'var(--rw-accent-text)',
                                boxShadow: 'var(--rw-btn-primary-shadow)',
                              }
                            : {
                                backgroundColor: 'var(--rw-locked-bg)',
                                borderColor: 'var(--rw-locked-border)',
                                color: 'var(--rw-locked-text)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                              }
                        }
                      >
                        {isComingSoon ? (
                          <span>Coming soon</span>
                        ) : m.claimed ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Claimed</span>
                          </>
                        ) : isMilestoneAdminExcluded ? (
                          <span>Admin Excluded</span>
                        ) : isClaimingThis ? (
                          <span>Claiming...</span>
                        ) : (
                          <span>Claim</span>
                        )}
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Zenryu Card at the bottom (1,000 MCQs) */}
            <GlassCard
              variant="zenryu"
              data-testid="dragon-readonly-card"
              className="p-5 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <DragonCrestSvg size={42} />
                <div className="min-w-0 flex-1">
                  <span
                    className="block text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--rw-accent)' }}
                  >
                    1,000 MCQs Companion Unlock
                  </span>
                  <h3
                    className="font-display text-base sm:text-lg font-bold mt-0.5"
                    style={{ color: 'var(--rw-text-primary)' }}
                  >
                    Zenryu — The Guardian Dragon
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--rw-text-secondary)' }}
                  >
                    Answer 1,000 practice MCQs to awaken Zenryu on your student dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--rw-text-secondary)' }}>Progress</span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: 'var(--rw-text-primary)' }}
                    >
                      {state.dragonMilestone.progress.toLocaleString()} / 1,000
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--rw-progress-track)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((state.dragonMilestone.progress / 1000) * 100)
                        )}%`,
                        backgroundColor: 'var(--rw-accent)',
                      }}
                    />
                  </div>
                </div>

                <Link
                  to={user ? '/dashboard' : '/signup'}
                  className="h-10 min-h-[40px] px-4 rounded-full border inline-flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-btn-secondary-bg)',
                    borderColor: 'var(--rw-btn-secondary-border)',
                    color: 'var(--rw-btn-secondary-text)',
                    boxShadow: 'var(--rw-btn-secondary-shadow)',
                  }}
                >
                  <span>View on Dashboard</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </GlassCard>
          </section>
        )}

        {/* ─── 5. INVITE TAB (#invite) ────────────────────────────────────── */}
        {activeTab === 'invite' && (
          <section
            key="invite"
            aria-labelledby="referral-heading"
            className="rw-tab-panel space-y-4"
          >
            <div className="px-1">
              <span
                className="block text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--rw-text-label)' }}
              >
                Two-Way Verified Friend Referrals
              </span>
              <h2
                id="referral-heading"
                className="font-display text-xl sm:text-2xl font-bold mt-0.5"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                <span style={{ color: 'var(--rw-accent)' }}>+5,000</span> for you,{' '}
                <span style={{ color: 'var(--rw-gold-text)' }}>+1,000</span> for your friend
              </h2>
            </div>

            {/* Pill Row: Monthly paid referrals 0 / 10 */}
            <PillRow
              label="Monthly paid referrals"
              value={
                <span className="font-display font-black tabular-nums">
                  {state.referral.paidCountThisMonth} / {state.referral.maxPaidPerMonth}
                </span>
              }
            />

            {/* Compact 3-Step Vertical Stepper */}
            <GlassCard className="p-5">
              <span
                className="block text-[10px] font-bold uppercase tracking-widest mb-3.5"
                style={{ color: 'var(--rw-text-label)' }}
              >
                How It Works
              </span>
              <div className="relative space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Share Your Referral Link',
                    desc: `Send your personal /join/${state.referral.myCode} link to a classmate (or have them enter your code within 7 days of signup).`,
                  },
                  {
                    step: 2,
                    title: "Confirm Your Friend's Code",
                    desc: 'Once your friend signs up and verifies their email, ask them for their own BLD-XXXXXX code and enter it below within 14 days.',
                  },
                  {
                    step: 3,
                    title: `Friend Answers ${state.referral.config.minInviteeMcqs} MCQs`,
                    desc: `As soon as your friend completes ${state.referral.config.minInviteeMcqs} practice MCQs, you receive +5,000 Kobans and they receive +1,000 Kobans!`,
                  },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="relative flex items-start gap-3.5">
                    {/* Connecting vertical line */}
                    {idx < arr.length - 1 && (
                      <div
                        className="absolute left-[13px] top-7 bottom-[-16px] w-[2px]"
                        style={{ backgroundColor: 'var(--rw-divider)' }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shrink-0"
                      style={{
                        backgroundColor: 'var(--rw-accent)',
                        color: 'var(--rw-accent-text)',
                      }}
                    >
                      {item.step}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3
                        className="font-display text-sm font-bold leading-snug"
                        style={{ color: 'var(--rw-text-primary)' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: 'var(--rw-text-secondary)' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Referral Code Card */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="block text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--rw-text-label)' }}
                  >
                    Your Permanent Referral Code
                  </span>
                  <span
                    data-testid="my-referral-code"
                    className="font-mono text-2xl sm:text-3xl font-black tracking-wider block mt-0.5"
                    style={{ color: 'var(--rw-accent)' }}
                  >
                    {state.referral.myCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="h-10 min-h-[40px] px-4 rounded-full border inline-flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-pill-bg)',
                    borderColor: 'var(--rw-pill-border)',
                    color: 'var(--rw-text-primary)',
                  }}
                >
                  {copiedCode ? (
                    <Check size={14} style={{ color: 'var(--rw-green-text)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Link pill with truncation and [Copy Link] */}
              <PillRow className="pr-2 pl-4">
                <span
                  className="font-mono text-xs truncate min-w-0 flex-1"
                  style={{ color: 'var(--rw-text-secondary)' }}
                  title={state.referral.shareUrl}
                >
                  {state.referral.shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-10 min-h-[40px] px-4 rounded-full border inline-flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-btn-secondary-bg)',
                    borderColor: 'var(--rw-btn-secondary-border)',
                    color: 'var(--rw-btn-secondary-text)',
                  }}
                >
                  {copiedLink ? (
                    <Check size={14} style={{ color: 'var(--rw-green-text)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </PillRow>

              {/* [Share Invite Link] (red) and [Share on WhatsApp] (green) side by side */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleWebShare}
                  className="h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-accent)',
                    color: 'var(--rw-accent-text)',
                    boxShadow: 'var(--rw-btn-primary-shadow)',
                  }}
                >
                  <Share2 size={15} />
                  <span>Share Invite Link</span>
                </button>

                <a
                  href={whatsappShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 min-h-[48px] rounded-full border inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--rw-green-bg)',
                    borderColor: 'var(--rw-green-border)',
                    color: 'var(--rw-green-text)',
                  }}
                >
                  <Share2 size={15} />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </GlassCard>

            {/* Attach a friend's referral code card */}
            <GlassCard className="p-5 space-y-3.5">
              <div>
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--rw-text-label)' }}
                >
                  Joined Without a Link?
                </span>
                <h3
                  className="font-display text-base sm:text-lg font-bold mt-0.5"
                  style={{ color: 'var(--rw-text-primary)' }}
                >
                  Attach a friend&apos;s referral code
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--rw-text-secondary)' }}
                >
                  Enter your friend&apos;s BLD-XXXXXX code within{' '}
                  {state.referral.config.manualCodeWindowDays} days of signup.
                </p>
              </div>

              {state.referral.alreadyAttachedInviter ? (
                <PillRow
                  leftSlot={
                    <CheckCircle2
                      size={16}
                      style={{ color: 'var(--rw-green-text)' }}
                    />
                  }
                  label="Inviter referral code attached"
                />
              ) : (
                <form
                  onSubmit={handleAttachManualCode}
                  className="flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    placeholder="BLD-7K9M2P"
                    maxLength={12}
                    aria-label="Enter friend's referral code"
                    className="h-12 min-h-[48px] flex-1 min-w-0 rounded-full border px-4 font-mono text-sm uppercase tracking-wider outline-none"
                    style={{
                      backgroundColor: 'var(--rw-pill-bg)',
                      borderColor: 'var(--rw-pill-border)',
                      color: 'var(--rw-text-primary)',
                    }}
                  />
                  <button
                    type="submit"
                    data-testid="attach-referral-btn"
                    disabled={isComingSoon || attachingCode || !manualCodeInput.trim()}
                    className="h-12 min-h-[48px] px-5 rounded-full inline-flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-transform active:scale-95 disabled:cursor-not-allowed"
                    style={
                      isComingSoon || attachingCode || !manualCodeInput.trim()
                        ? {
                            backgroundColor: 'var(--rw-locked-bg)',
                            borderColor: 'var(--rw-locked-border)',
                            color: 'var(--rw-locked-text)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }
                        : {
                            backgroundColor: 'var(--rw-accent)',
                            color: 'var(--rw-accent-text)',
                            boxShadow: 'var(--rw-btn-primary-shadow)',
                          }
                    }
                  >
                    {isComingSoon
                      ? 'Coming soon'
                      : attachingCode
                      ? 'Attaching...'
                      : 'Attach Code'}
                  </button>
                </form>
              )}
            </GlassCard>

            {/* Your Referrals (n) list */}
            <div className="space-y-3 pt-1">
              <h3
                className="font-display text-base font-bold px-1"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                Your Referrals ({state.referral.items.length})
              </h3>

              {state.referral.items.length === 0 ? (
                <PillRow
                  dashed
                  label="No referrals yet — share your code above to earn +5,000 Kobans"
                />
              ) : (
                <div className="space-y-3">
                  {state.referral.items.map((item) => {
                    const mySideAccepted =
                      item.role === 'inviter' ? item.inviterAccepted : item.inviteeAccepted;
                    const needsMyAcceptance =
                      item.status === 'pending_confirmation' && !mySideAccepted;
                    const waitingForCounterpart =
                      item.status === 'pending_confirmation' && mySideAccepted;
                    const isPaid =
                      item.status === 'completed' || item.status === 'paid';

                    return (
                      <GlassCard
                        key={item.id}
                        data-testid={`referral-item-${item.id}`}
                        className="p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              className="font-display text-sm sm:text-base font-bold block truncate"
                              style={{ color: 'var(--rw-text-primary)' }}
                            >
                              {item.counterpartDisplayName}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: 'var(--rw-text-secondary)' }}
                            >
                              {item.role === 'inviter' ? 'You Invited' : 'Invited You'} ·{' '}
                              {item.inviteeMcqsAnswered} / {item.minInviteeMcqs} MCQs
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <KobanBadge
                              amount={
                                item.role === 'inviter'
                                  ? item.inviterReward
                                  : item.inviteeReward
                              }
                              size="sm"
                            />
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase border"
                              style={
                                isPaid
                                  ? {
                                      backgroundColor: 'var(--rw-green-bg)',
                                      borderColor: 'var(--rw-green-border)',
                                      color: 'var(--rw-green-text)',
                                    }
                                  : {
                                      backgroundColor: 'var(--rw-pill-bg)',
                                      borderColor: 'var(--rw-pill-border)',
                                      color: 'var(--rw-text-secondary)',
                                    }
                              }
                            >
                              {waitingForCounterpart
                                ? 'Waiting for Friend'
                                : item.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {needsMyAcceptance && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={confirmInputs[item.id] || ''}
                              onChange={(e) =>
                                setConfirmInputs((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value.toUpperCase(),
                                }))
                              }
                              placeholder="Enter friend's BLD-XXXXXX"
                              aria-label={`Enter referral code for ${item.counterpartDisplayName}`}
                              className="h-11 min-h-[44px] flex-1 min-w-0 rounded-full border px-4 font-mono text-xs uppercase outline-none"
                              style={{
                                backgroundColor: 'var(--rw-pill-bg)',
                                borderColor: 'var(--rw-pill-border)',
                                color: 'var(--rw-text-primary)',
                              }}
                            />
                            <button
                              type="button"
                              disabled={isComingSoon || confirmingRefId === item.id}
                              onClick={() => handleConfirmFriendCode(item.id)}
                              className="h-11 min-h-[44px] px-4 rounded-full inline-flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: 'var(--rw-accent)',
                                color: 'var(--rw-accent-text)',
                              }}
                            >
                              {isComingSoon
                                ? 'Coming soon'
                                : confirmingRefId === item.id
                                ? 'Accepting...'
                                : 'Accept'}
                            </button>
                          </div>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── 6. FAQ TAB (#faq) ──────────────────────────────────────────── */}
        {activeTab === 'faq' && (
          <section
            key="faq"
            aria-labelledby="rewards-faq-heading"
            className="rw-tab-panel space-y-3"
          >
            <div className="px-1 mb-1">
              <span
                className="block text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--rw-text-label)' }}
              >
                Transparency & Fair Play
              </span>
              <h2
                id="rewards-faq-heading"
                className="font-display text-xl sm:text-2xl font-bold mt-0.5"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                Rewards FAQ & Rules
              </h2>
            </div>

            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="space-y-1.5">
                  <PillRow
                    as="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenFaqId((prev) => (prev === faq.id ? null : faq.id))
                    }
                    className="w-full"
                  >
                    <span
                      className="font-display text-xs sm:text-sm font-bold text-left pr-2"
                      style={{ color: 'var(--rw-text-primary)' }}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                      style={{
                        color: isOpen
                          ? 'var(--rw-accent)'
                          : 'var(--rw-text-secondary)',
                      }}
                    />
                  </PillRow>

                  {/* Smooth height animation for expanded answer */}
                  <div
                    className={`grid transition-all duration-200 ease-out ${
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="rounded-[24px] border px-5 py-4 text-xs sm:text-sm leading-relaxed"
                        style={{
                          backgroundColor: 'var(--rw-card-bg)',
                          borderColor: 'var(--rw-card-border)',
                          color: 'var(--rw-text-secondary)',
                        }}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

export default RewardsPage;
