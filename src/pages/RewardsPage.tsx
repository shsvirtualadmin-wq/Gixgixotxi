import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GuestUpgradeModal } from '@/components/auth/GuestUpgradeModal';
import {
  EmailVerificationRequiredCard,
  isEmailVerificationRequiredError,
} from '@/components/auth/EmailVerificationRequiredCard';
import { useWallet } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';
import { useHomeUrl } from '@/utils/homeUrl';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  GlassCard,
  PillRow,
  TabPills,
  KobanBadge,
  KobanCoinSvg,
  TreasureChestSvg,
  DragonCrestSvg,
  getJellyHandlers,
  spawnClaimCoinBurst,
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

const TOP_NAV_LINKS = [
  { to: '/mcqs', label: 'MCQs' },
  { to: '/commons', label: 'Commons' },
  { to: '/material', label: 'Material' },
  { to: '/crew', label: 'Crew' },
  { to: '/store', label: 'Store' },
  { to: '/pricing', label: 'Pricing' },
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

function getDiscPressHandlers() {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.add('is-pressed');
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
  };
}

export function RewardsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const homeUrl = useHomeUrl();
  const { user, isAdmin, isGuest } = useAuth();
  const { balance: walletBalance, refreshWallet } = useWallet();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Tab state synced with URL hash (#checkin, #milestones, #invite, #faq)
  const [activeTab, setActiveTab] = useState<RewardsTabId>(() =>
    typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : 'checkin'
  );

  // Single-open FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const [state, setState] = useState<RewardsStateResponse>(() =>
    buildFallbackClientState(user?.uid)
  );
  const [loading, setLoading] = useState<boolean>(true);
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

  // Refs for claim coin burst & balance count-up animation
  const balanceNumberRef = useRef<HTMLSpanElement | null>(null);
  const dailyClaimBtnRef = useRef<HTMLButtonElement | null>(null);
  const milestoneBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const confirmBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Synchronous in-flight locks to prevent double claims on rapid taps
  const claimingDailyLockRef = useRef<boolean>(false);
  const claimingMilestoneLockRef = useRef<string | null>(null);
  const attachingCodeLockRef = useRef<boolean>(false);
  const confirmingRefLockRef = useRef<string | null>(null);

  const hasLoadError = Boolean(state.loadError);
  const isGuestAccount = Boolean(isGuest || state.guestLocked || state.state === 'guest_locked');
  const isComingSoon =
    !loading &&
    !hasLoadError &&
    !isGuestAccount &&
    (state.mode === 'off' || (state.mode === 'admin_only' && !isAdmin));
  const isClaimBlocked = Boolean(loading || hasLoadError || isComingSoon || isGuestAccount);
  const isMilestoneAdminExcluded = Boolean(isAdmin && state.mode !== 'admin_only');
  const liveBalance = user && !isGuestAccount ? Math.max(walletBalance, state.balance) : 0;

  // Animated balance state for 900ms ease-out count-up + bump
  const [animatedBalance, setAnimatedBalance] = useState<number>(liveBalance);
  const [isBalanceBumping, setIsBalanceBumping] = useState<boolean>(false);
  const balanceAnimRafRef = useRef<number | null>(null);
  const bumpTimerRef = useRef<number | null>(null);
  const prevLiveBalanceRef = useRef<number>(liveBalance);

  const runBalanceCountUp = useCallback((fromVal: number, toVal: number) => {
    if (balanceAnimRafRef.current !== null) {
      window.cancelAnimationFrame(balanceAnimRafRef.current);
      balanceAnimRafRef.current = null;
    }
    if (bumpTimerRef.current !== null) {
      window.clearTimeout(bumpTimerRef.current);
      bumpTimerRef.current = null;
    }

    if (
      toVal <= fromVal ||
      typeof window === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setAnimatedBalance(toVal);
      prevLiveBalanceRef.current = toVal;
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(fromVal + (toVal - fromVal) * eased);
      setAnimatedBalance(current);

      if (t < 1) {
        balanceAnimRafRef.current = window.requestAnimationFrame(step);
      } else {
        balanceAnimRafRef.current = null;
        setAnimatedBalance(toVal);
        prevLiveBalanceRef.current = toVal;
        setIsBalanceBumping(true);
        bumpTimerRef.current = window.setTimeout(() => {
          setIsBalanceBumping(false);
          bumpTimerRef.current = null;
        }, 520);
      }
    };

    balanceAnimRafRef.current = window.requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (liveBalance !== prevLiveBalanceRef.current) {
      if (liveBalance > prevLiveBalanceRef.current && prevLiveBalanceRef.current > 0) {
        runBalanceCountUp(prevLiveBalanceRef.current, liveBalance);
      } else {
        setAnimatedBalance(liveBalance);
        prevLiveBalanceRef.current = liveBalance;
      }
    }
  }, [liveBalance, runBalanceCountUp]);

  useEffect(() => {
    return () => {
      if (balanceAnimRafRef.current !== null) {
        window.cancelAnimationFrame(balanceAnimRafRef.current);
      }
      if (bumpTimerRef.current !== null) {
        window.clearTimeout(bumpTimerRef.current);
      }
    };
  }, []);

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

  const loadState = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const fetched = await fetchRewardsState(user?.uid);
      setState(fetched);
      if (fetched.daily?.secondsUntilNextPktMidnight) {
        setCountdownSec(fetched.daily.secondsUntilNextPktMidnight);
      }
      if (fetched.loadError) {
        setBannerNotice({
          type: 'error',
          text: fetched.loadError,
        });
      }
      return fetched;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    loadState(false);
  }, [loadState]);

  // Tick PKT midnight countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSec(getSecondsUntilNextPktMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimDaily = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (
      isClaimBlocked ||
      state.daily.claimedToday ||
      claimingDaily ||
      claimingDailyLockRef.current
    ) {
      return;
    }

    claimingDailyLockRef.current = true;
    const startBalance = liveBalance;
    const sourceBtn = dailyClaimBtnRef.current;

    setClaimingDaily(true);
    setBannerNotice(null);
    try {
      const res = await claimDailyReward();
      if (res.ok) {
        const [refreshedState] = await Promise.all([loadState(true), refreshWallet()]);
        const rewardDelta =
          res.rewardAmount || state.daily.nextRewardAmount || 0;
        const confirmedServerBalance =
          typeof res.newBalance === 'number'
            ? res.newBalance
            : typeof refreshedState?.balance === 'number' &&
              refreshedState.balance > startBalance
            ? refreshedState.balance
            : startBalance + rewardDelta;

        spawnClaimCoinBurst(sourceBtn, balanceNumberRef.current);
        prevLiveBalanceRef.current = confirmedServerBalance;
        runBalanceCountUp(startBalance, confirmedServerBalance);

        setBannerNotice({
          type: 'success',
          text: `Claimed Day ${res.dayNumber} reward: +${rewardDelta.toLocaleString()} Kobans!`,
        });
      } else {
        console.error('[RewardsPage] Daily check-in claim failed:', res);
        setBannerNotice({
          type: 'error',
          text: res.error || 'Daily check-in claim failed.',
        });
      }
    } catch (err: any) {
      console.error('[RewardsPage] Unexpected error during daily claim:', err);
      setBannerNotice({
        type: 'error',
        text: err?.message || 'Unexpected error during daily check-in claim.',
      });
    } finally {
      claimingDailyLockRef.current = false;
      setClaimingDaily(false);
    }
  };

  const handleClaimMilestone = async (milestoneId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    const targetMilestone = state.milestones.find((m) => m.id === milestoneId);
    if (
      isClaimBlocked ||
      isMilestoneAdminExcluded ||
      claimingMilestoneId ||
      claimingMilestoneLockRef.current ||
      targetMilestone?.claimed ||
      (targetMilestone && !targetMilestone.eligible)
    ) {
      return;
    }

    claimingMilestoneLockRef.current = milestoneId;
    const startBalance = liveBalance;
    const sourceBtn = milestoneBtnRefs.current[milestoneId] || null;

    setClaimingMilestoneId(milestoneId);
    setBannerNotice(null);
    try {
      const res = await claimMilestoneReward(milestoneId);
      if (res.ok) {
        const [refreshedState] = await Promise.all([loadState(true), refreshWallet()]);
        const rewardDelta = res.rewardAmount || targetMilestone?.reward || 0;
        const confirmedServerBalance =
          typeof res.newBalance === 'number'
            ? res.newBalance
            : typeof refreshedState?.balance === 'number' &&
              refreshedState.balance > startBalance
            ? refreshedState.balance
            : startBalance + rewardDelta;

        spawnClaimCoinBurst(sourceBtn, balanceNumberRef.current);
        prevLiveBalanceRef.current = confirmedServerBalance;
        runBalanceCountUp(startBalance, confirmedServerBalance);

        setBannerNotice({
          type: 'success',
          text: `Milestone unlocked! +${rewardDelta.toLocaleString()} Kobans credited to your wallet.`,
        });
      } else {
        console.error('[RewardsPage] Milestone claim failed:', {
          milestoneId,
          response: res,
        });
        setBannerNotice({
          type: 'error',
          text: res.error || 'Milestone claim failed.',
        });
      }
    } catch (err: any) {
      console.error('[RewardsPage] Unexpected error during milestone claim:', err);
      setBannerNotice({
        type: 'error',
        text: err?.message || 'Unexpected error during milestone claim.',
      });
    } finally {
      claimingMilestoneLockRef.current = null;
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
    if (
      !clean ||
      isClaimBlocked ||
      attachingCode ||
      attachingCodeLockRef.current
    ) {
      return;
    }

    attachingCodeLockRef.current = true;
    setAttachingCode(true);
    setBannerNotice(null);
    try {
      const res = await attachReferralCode(clean);
      if (res.ok) {
        await loadState(true);
        setManualCodeInput('');
        setBannerNotice({
          type: 'success',
          text: `Attached ${res.inviterDisplayName || 'friend'}'s code! Share your code (${state.referral.myCode}) with them so they can confirm.`,
        });
      } else {
        console.error('[RewardsPage] Attach referral code failed:', res);
        setBannerNotice({
          type: 'error',
          text: res.error || 'Could not attach referral code.',
        });
      }
    } catch (err: any) {
      console.error('[RewardsPage] Unexpected error attaching referral code:', err);
      setBannerNotice({
        type: 'error',
        text: err?.message || 'Could not attach referral code.',
      });
    } finally {
      attachingCodeLockRef.current = false;
      setAttachingCode(false);
    }
  };

  const handleConfirmFriendCode = async (referralId: string) => {
    if (
      !user ||
      isClaimBlocked ||
      confirmingRefId ||
      confirmingRefLockRef.current
    ) {
      return;
    }
    const code = normalizeReferralCode(confirmInputs[referralId] || '');
    if (!code) {
      setBannerNotice({
        type: 'error',
        text: "Please enter your friend's BLD-XXXXXX referral code to confirm.",
      });
      return;
    }

    confirmingRefLockRef.current = referralId;
    const startBalance = liveBalance;
    const sourceBtn = confirmBtnRefs.current[referralId] || null;

    setConfirmingRefId(referralId);
    setBannerNotice(null);
    try {
      const res = await acceptPendingReferral(referralId, code);
      if (res.ok) {
        const [refreshedState] = await Promise.all([loadState(true), refreshWallet()]);
        if (res.paid) {
          const refItem = state.referral.items.find((item) => item.id === referralId);
          const rewardDelta =
            refItem?.role === 'invitee'
              ? res.inviteeReward || refItem.inviteeReward || 1000
              : res.inviterReward || refItem?.inviterReward || 5000;
          const confirmedServerBalance =
            typeof refreshedState?.balance === 'number' &&
            refreshedState.balance > startBalance
              ? refreshedState.balance
              : startBalance + rewardDelta;

          spawnClaimCoinBurst(sourceBtn, balanceNumberRef.current);
          prevLiveBalanceRef.current = confirmedServerBalance;
          runBalanceCountUp(startBalance, confirmedServerBalance);
        }
        setBannerNotice({
          type: 'success',
          text:
            res.message ||
            (res.paid
              ? `Referral completed! +${(res.inviterReward || 5000).toLocaleString()} Kobans credited to your wallet!`
              : 'Friend code confirmed! Rewards will unlock automatically once they complete 20 MCQs.'),
        });
      } else {
        console.error('[RewardsPage] Confirm friend referral code failed:', {
          referralId,
          response: res,
        });
        setBannerNotice({
          type: 'error',
          text: res.error || 'Failed to confirm friend code.',
        });
      }
    } catch (err: any) {
      console.error('[RewardsPage] Unexpected error confirming friend code:', err);
      setBannerNotice({
        type: 'error',
        text: err?.message || 'Failed to confirm friend code.',
      });
    } finally {
      confirmingRefLockRef.current = null;
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

  const whatsappShareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Join me on Boardly for FSc, MDCAT, NET & ECAT MCQ practice! Use my code ${state.referral.myCode} to get +1,000 bonus Kobans: ${state.referral.shareUrl}`
  )}`;

  const ladder =
    Array.isArray(state.dailyLadder) && state.dailyLadder.length === 30
      ? state.dailyLadder
      : DEFAULT_DAILY_LADDER;

  const days1To29 = ladder.slice(0, 29);
  const day30Amount = ladder[29] ?? 1000;

  const dailyBtnDisabled = Boolean(
    isClaimBlocked || state.daily.claimedToday || claimingDaily
  );
  const attachBtnDisabled = Boolean(
    isClaimBlocked || attachingCode || !manualCodeInput.trim()
  );

  return (
    <div
      className="rewards-page-root min-h-screen w-full flex flex-col justify-between overflow-x-hidden transition-colors duration-150"
      style={{
        backgroundColor: 'var(--rw-bg)',
        color: 'var(--rw-text)',
      }}
    >
      <PageMeta
        title="Boardly Rewards"
        description="Earn up to 7,550 Kobans every 30 days with the Boardly daily check-in, unlock MCQ practice milestones, and invite classmates for +5,000 Kobans."
        canonicalPath="/rewards"
      />

      {/* ─── SINGLE FLOATING PILL TOP NAVIGATION BAR ────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 pointer-events-none select-none"
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-4">
          <nav
            aria-label="Rewards Top Navigation"
            className="pointer-events-auto w-full h-14 sm:h-16 px-4 sm:px-6 rounded-full border flex items-center justify-between gap-3 transition-colors duration-150"
            style={{
              backgroundColor: 'var(--rw-card)',
              borderColor: 'var(--rw-border)',
            }}
          >
            {/* Left: Boardly Wordmark in Doto */}
            <Link
              to={homeUrl}
              {...getJellyHandlers()}
              className="rw-jelly-btn font-dot text-xl sm:text-2xl font-extrabold tracking-tight shrink-0 rounded-full px-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rw-red)]"
              style={{ color: 'var(--rw-red)' }}
              aria-label="Boardly"
            >
              Boardly
            </Link>

            {/* Center: Nav Links (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {TOP_NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  {...getJellyHandlers()}
                  className="rw-jelly-btn px-3 py-1.5 rounded-full text-xs lg:text-sm font-heading font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                  style={{ color: 'var(--rw-muted)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: Clear Glass Theme Toggle + Clear Glass Home Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="rewards-theme-toggle"
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                {...getJellyHandlers(false, toggleTheme)}
                className="rw-jelly-btn rw-btn-clear-glass w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <Link
                to={homeUrl}
                {...getJellyHandlers()}
                className="rw-jelly-btn rw-btn-clear-glass h-10 min-h-[40px] px-4 sm:px-5 rounded-full inline-flex items-center justify-center text-xs sm:text-sm font-heading font-bold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
              >
                Home
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main
        className="mx-auto w-full max-w-2xl px-4 pb-16 space-y-6 flex-1"
        style={{
          paddingTop: 'calc(92px + env(safe-area-inset-top, 0px))',
        }}
      >
        {/* ─── SUPER ADMIN BANNER WHEN MODE IS NOT "EVERYONE" ─────────────── */}
        {isAdmin && !loading && !hasLoadError && state.mode !== 'everyone' && (
          <div
            data-testid="super-admin-rewards-mode-banner"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[28px] border px-5 py-4"
            style={{
              backgroundColor: 'var(--rw-red)',
              borderColor: 'var(--rw-red)',
              color: 'var(--rw-on-red)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <ShieldCheck size={20} className="shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold uppercase tracking-wider">
                  Super Admin Notice · Rewards Mode:{' '}
                  {state.mode === 'admin_only' ? 'ADMIN ONLY (TESTING)' : 'OFF'}
                </p>
                <p className="mt-0.5">
                  {state.mode === 'admin_only'
                    ? 'Only Super Admins can test claiming right now. Regular students see "Coming soon".'
                    : 'Rewards claiming is currently turned OFF for everyone. All Claim buttons show "Coming soon".'}
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              {...getJellyHandlers()}
              className="rw-jelly-btn rw-btn-clear-glass inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold shrink-0"
            >
              <span>Manage in Admin</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ─── GUEST ACCOUNT REWARDS LOCK BANNER ──────────────────────────── */}
        {isGuestAccount && !loading && (
          <div
            data-testid="guest-rewards-locked-banner"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[28px] border px-5 py-4"
            style={{
              backgroundColor: 'var(--rw-card)',
              borderColor: 'var(--rw-border)',
              color: 'var(--rw-text)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <Lock size={18} className="shrink-0 mt-0.5 sm:mt-0" style={{ color: 'var(--rw-red)' }} />
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Create a free account to claim rewards</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--rw-muted)' }}>
                  Upgrade in place to keep your username, progress, and test attempts while unlocking daily Kobans and milestones.
                </p>
              </div>
            </div>
            <button
              type="button"
              data-testid="rewards-guest-upgrade-btn"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="rw-jelly-btn rw-btn-red-glass inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-heading font-bold shrink-0 cursor-pointer"
            >
              <span>Create free account</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ─── 1. BALANCE CARD ────────────────────────────────────────────── */}
        <GlassCard
          as="section"
          aria-labelledby="rewards-hero-heading"
          className="p-6 sm:p-8 text-center flex flex-col items-center gap-5"
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-xs font-heading font-bold tracking-wide"
              style={{ color: 'var(--rw-muted)' }}
            >
              Your live balance
            </span>
            {isComingSoon && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--rw-red)',
                  color: 'var(--rw-on-red)',
                }}
              >
                Preview
              </span>
            )}
          </div>

          <h1 id="rewards-hero-heading" className="sr-only">
            Boardly Student Rewards
          </h1>

          {/* Coin Icon + Kobans Amount in Doto */}
          <div className="flex items-center justify-center gap-3">
            <div
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border shrink-0"
              style={{
                backgroundColor: 'var(--rw-bg)',
                borderColor: 'var(--rw-gold)',
              }}
            >
              <KobanCoinSvg size={28} />
            </div>
            <div className="text-left">
              <span
                ref={balanceNumberRef}
                data-testid="rewards-balance-pill"
                className={`rw-balance-number font-dot text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums block leading-none ${
                  isBalanceBumping ? 'rw-balance-bumping' : ''
                }`}
              >
                {animatedBalance.toLocaleString()}{' '}
                <span
                  className="text-sm sm:text-base font-heading font-bold uppercase tracking-wider"
                  style={{ color: 'var(--rw-gold)' }}
                >
                  Kobans
                </span>
              </span>
            </div>
          </div>

          {/* Two Buttons: "Spend in Store" (Red Glass) & "Practice MCQs" (Clear Glass) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-1">
            <Link
              to="/store"
              {...getJellyHandlers()}
              className="rw-jelly-btn rw-btn-red-glass h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-5 text-xs sm:text-sm font-heading font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
            >
              <span>Spend in Store</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/dashboard/practice"
              {...getJellyHandlers()}
              className="rw-jelly-btn rw-btn-clear-glass h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-5 text-xs sm:text-sm font-heading font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
            >
              <span>Practice MCQs</span>
            </Link>
          </div>

          {/* Cycle Cap Line */}
          <p
            className="text-xs sm:text-sm font-medium"
            style={{ color: 'var(--rw-muted)' }}
          >
            Earn up to 7,550 Kobans per 30-day cycle.
          </p>

          {/* Action Feedback Notice */}
          {bannerNotice && isEmailVerificationRequiredError(bannerNotice.text) ? (
            <div className="w-full text-left">
              <EmailVerificationRequiredCard
                onVerified={() => {
                  setBannerNotice(null);
                  void loadState(false);
                }}
              />
            </div>
          ) : bannerNotice ? (
            <div
              role="status"
              className="w-full flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs sm:text-sm font-semibold text-left"
              style={
                bannerNotice.type === 'success'
                  ? {
                      backgroundColor: 'var(--rw-bg)',
                      borderColor: 'var(--rw-green)',
                      color: 'var(--rw-green)',
                    }
                  : bannerNotice.type === 'error'
                  ? {
                      backgroundColor: 'var(--rw-bg)',
                      borderColor: 'var(--rw-red)',
                      color: 'var(--rw-red)',
                    }
                  : {
                      backgroundColor: 'var(--rw-bg)',
                      borderColor: 'var(--rw-gold)',
                      color: 'var(--rw-gold)',
                    }
              }
            >
              {bannerNotice.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0" />
              ) : (
                <AlertCircle size={16} className="shrink-0" />
              )}
              <span className="truncate flex-1">{bannerNotice.text}</span>
              {isGuestAccount && (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="ml-2 underline font-bold shrink-0 cursor-pointer"
                >
                  Create free account
                </button>
              )}
            </div>
          ) : null}
        </GlassCard>

        {/* ─── 2. LIQUID GLASS TAB SWITCHER ───────────────────────────────── */}
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
            className="rw-tab-panel space-y-5"
          >
            <div className="px-1">
              <span
                className="block text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--rw-muted)' }}
              >
                Daily Streak Ladder
              </span>
              <h2
                id="daily-checkin-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                30-Day Daily Check-In
              </h2>
            </div>

            {/* Reset Countdown to 00:00 PKT */}
            <PillRow
              leftSlot={
                <Clock
                  size={16}
                  className="shrink-0"
                  style={{ color: 'var(--rw-red)' }}
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

            {/* Full-Width Red Glass Claim Button */}
            <button
              ref={dailyClaimBtnRef}
              type="button"
              data-testid="daily-claim-btn"
              disabled={dailyBtnDisabled}
              {...getJellyHandlers(dailyBtnDisabled, handleClaimDaily)}
              className="rw-jelly-btn rw-btn-red-glass w-full h-14 min-h-[56px] rounded-full inline-flex items-center justify-center gap-2.5 px-6 text-sm sm:text-base font-heading font-bold disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
            >
              {isGuestAccount ? <Lock size={18} /> : <Gift size={18} />}
              <span>
                {hasLoadError
                  ? 'Failed to load settings'
                  : loading
                  ? 'Loading...'
                  : isGuestAccount
                  ? 'Create a free account to claim rewards'
                  : isComingSoon
                  ? 'Coming soon'
                  : state.daily.claimedToday
                  ? `Claimed Day ${state.daily.completedDaysInCycle}`
                  : claimingDaily
                  ? 'Claiming...'
                  : `Claim Day ${state.daily.nextDayNumber} (+${state.daily.nextRewardAmount} Kobans)`}
              </span>
            </button>

            {/* 5-Column Grid of Round Discs for Days 1–29 + Full-Width Day 30 Row Below */}
            <div data-testid="daily-30-grid" className="space-y-4 pt-1">
              <div
                className="grid grid-cols-5"
                style={{ gap: '16px 8px' }}
              >
                {days1To29.map((amount, idx) => {
                  const dayNum = idx + 1;
                  const isChest = CHEST_DAYS.has(dayNum);
                  const isCompleted = state.daily.claimedToday
                    ? dayNum <= state.daily.completedDaysInCycle
                    : dayNum < state.daily.nextDayNumber;
                  const isToday =
                    !state.daily.claimedToday && dayNum === state.daily.nextDayNumber;

                  // Determine disc visual style based on state
                  let discStyle: React.CSSProperties;
                  if (isCompleted) {
                    // Claimed days: solid gold disc (#f5c542)
                    discStyle = {
                      backgroundColor: 'var(--rw-disc-claimed-bg)',
                      color: 'var(--rw-disc-claimed-check)',
                    };
                  } else if (isToday) {
                    // Next claimable day: solid red disc
                    discStyle = {
                      backgroundColor: 'var(--rw-red)',
                      color: 'var(--rw-on-red)',
                    };
                  } else if (isChest) {
                    // Future chest days (4, 7, 14, 21, 28): gold-outlined disc
                    discStyle = {
                      backgroundColor: 'var(--rw-disc-future-bg)',
                      border: '1.5px solid var(--rw-gold)',
                    };
                  } else {
                    // Regular future days: clear disc with visible 1.5px outline
                    discStyle = {
                      backgroundColor: 'var(--rw-disc-future-bg)',
                      border: '1.5px solid var(--rw-disc-outline)',
                    };
                  }

                  const amountColor = isCompleted
                    ? 'var(--rw-gold)'
                    : isToday
                    ? 'var(--rw-red)'
                    : isChest
                    ? 'var(--rw-gold)'
                    : 'var(--rw-text)';

                  const dayLabelColor = isToday
                    ? 'var(--rw-red)'
                    : isCompleted
                    ? 'var(--rw-gold)'
                    : 'var(--rw-muted)';

                  return (
                    <div
                      key={dayNum}
                      data-testid={`daily-tile-${dayNum}`}
                      className="col-span-1 flex flex-col items-center text-center select-none"
                    >
                      {/* Round Disc (max-width 84px on desktop, ~56px on mobile) */}
                      <div
                        {...getDiscPressHandlers()}
                        className="rw-day-disc w-14 h-14 sm:w-[76px] sm:h-[76px] md:w-[84px] md:h-[84px] max-w-[84px] aspect-square rounded-full flex items-center justify-center cursor-pointer"
                        style={discStyle}
                      >
                        {isCompleted ? (
                          <Check
                            size={28}
                            strokeWidth={3}
                            aria-label="Claimed"
                            style={{ color: 'var(--rw-disc-claimed-check)' }}
                          />
                        ) : isChest ? (
                          <TreasureChestSvg size={30} />
                        ) : isToday ? (
                          <KobanCoinSvg amber size={30} className="w-1/2 h-1/2" />
                        ) : (
                          <KobanCoinSvg amber size={28} className="w-1/2 h-1/2" />
                        )}

                        {/* Small lock badge on bottom-right corner for future days */}
                        {!isCompleted && !isToday && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border flex items-center justify-center pointer-events-none"
                            style={{
                              backgroundColor: 'var(--rw-card)',
                              borderColor: isChest
                                ? 'var(--rw-gold)'
                                : 'var(--rw-disc-outline)',
                              color: isChest ? 'var(--rw-gold)' : 'var(--rw-muted)',
                            }}
                            aria-hidden="true"
                          >
                            <Lock size={10} />
                          </span>
                        )}
                      </div>

                      {/* Reward amount under the disc (+200) */}
                      <span
                        className="font-dot text-xs sm:text-sm font-extrabold tabular-nums leading-tight mt-2"
                        style={{ color: amountColor }}
                      >
                        +{amount.toLocaleString()}
                      </span>

                      {/* "Day N" under the amount */}
                      <span
                        className="text-[11px] font-semibold leading-tight mt-0.5"
                        style={{ color: dayLabelColor }}
                      >
                        Day {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day 30 Grand Chest — Full-Width Row Below the Grid */}
              {(() => {
                const dayNum = 30;
                const isCompleted = state.daily.claimedToday
                  ? dayNum <= state.daily.completedDaysInCycle
                  : dayNum < state.daily.nextDayNumber;
                const isToday =
                  !state.daily.claimedToday && dayNum === state.daily.nextDayNumber;

                return (
                  <div
                    data-testid="daily-tile-30"
                    className="w-full rounded-[24px] border px-4 sm:px-5 py-4 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--rw-card)',
                      borderColor: isToday
                        ? 'var(--rw-red)'
                        : isCompleted
                        ? 'var(--rw-gold)'
                        : 'var(--rw-gold)',
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        {...getDiscPressHandlers()}
                        className="rw-day-disc w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0"
                        style={
                          isCompleted
                            ? {
                                backgroundColor: 'var(--rw-disc-claimed-bg)',
                                color: 'var(--rw-disc-claimed-check)',
                              }
                            : isToday
                            ? {
                                backgroundColor: 'var(--rw-red)',
                                color: 'var(--rw-on-red)',
                              }
                            : {
                                backgroundColor: 'var(--rw-disc-future-bg)',
                                border: '1.5px solid var(--rw-gold)',
                              }
                        }
                      >
                        {isCompleted ? (
                          <Check
                            size={24}
                            strokeWidth={3}
                            style={{ color: 'var(--rw-disc-claimed-check)' }}
                          />
                        ) : (
                          <TreasureChestSvg grand size={28} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-dot text-xs sm:text-sm font-extrabold uppercase tracking-wider"
                            style={{
                              color: isToday ? 'var(--rw-red)' : 'var(--rw-gold)',
                            }}
                          >
                            Day 30 · Grand Chest
                          </span>
                          {isToday && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase"
                              style={{
                                backgroundColor: 'var(--rw-red)',
                                color: 'var(--rw-on-red)',
                              }}
                            >
                              NEXT
                            </span>
                          )}
                        </div>
                        <span
                          className="block text-xs truncate mt-0.5"
                          style={{ color: 'var(--rw-muted)' }}
                        >
                          30-Day Grand Treasure Chest
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <KobanBadge amount={day30Amount} size="md" />
                      {isCompleted ? (
                        <CheckCircle2
                          size={16}
                          style={{ color: 'var(--rw-gold)' }}
                          aria-label="Completed"
                        />
                      ) : !isToday ? (
                        <Lock size={14} style={{ color: 'var(--rw-muted)' }} />
                      ) : null}
                    </div>
                  </div>
                );
              })()}
            </div>

            <p
              className="text-center text-xs font-medium pt-1"
              style={{ color: 'var(--rw-muted)' }}
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
                style={{ color: 'var(--rw-muted)' }}
              >
                Verified Practice Progression
              </span>
              <h2
                id="milestones-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                MCQ Practice Milestones
              </h2>
            </div>

            {/* Verified MCQs answered row */}
            <PillRow
              label="Verified MCQs answered"
              value={
                <span
                  data-testid="mcqs-answered-count"
                  className="font-dot text-base sm:text-lg font-extrabold tabular-nums"
                  style={{ color: 'var(--rw-text)' }}
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
                  backgroundColor: 'var(--rw-card)',
                  borderColor: 'var(--rw-gold)',
                  color: 'var(--rw-gold)',
                }}
              >
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Super Admin Account Exclusion Notice</p>
                  <p className="mt-0.5" style={{ color: 'var(--rw-muted)' }}>
                    Admin accounts have all Boardly Store items and companions unlocked by default and are excluded from claiming student MCQ milestone rewards.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Cards (50, 100, 250, 500 MCQs) */}
            <div className="space-y-3.5">
              {state.milestones.map((m) => {
                const pct = Math.min(100, Math.round((m.progress / m.threshold) * 100));
                const isClaimingThis = claimingMilestoneId === m.id;
                const btnDisabled = Boolean(
                  isClaimBlocked ||
                    isMilestoneAdminExcluded ||
                    m.claimed ||
                    !m.eligible ||
                    isClaimingThis
                );

                return (
                  <GlassCard
                    key={m.id}
                    data-testid={`milestone-card-${m.threshold}`}
                    className="p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className="block text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--rw-muted)' }}
                        >
                          {m.threshold.toLocaleString()} MCQs Milestone
                        </span>
                        <h3
                          className="font-dot text-base sm:text-lg font-extrabold mt-0.5 truncate"
                          style={{ color: 'var(--rw-text)' }}
                        >
                          {m.title}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--rw-muted)' }}
                        >
                          {m.subtitle}
                        </p>
                      </div>

                      <KobanBadge amount={m.reward} />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span style={{ color: 'var(--rw-muted)' }}>Progress</span>
                          <span
                            className="font-mono tabular-nums"
                            style={{ color: 'var(--rw-text)' }}
                          >
                            {m.progress.toLocaleString()} / {m.threshold.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="h-2.5 w-full overflow-hidden rounded-full border"
                          style={{
                            backgroundColor: 'var(--rw-bg)',
                            borderColor: 'var(--rw-border)',
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: m.claimed
                                ? 'var(--rw-green)'
                                : 'var(--rw-red)',
                            }}
                          />
                        </div>
                      </div>

                      <button
                        ref={(el) => {
                          milestoneBtnRefs.current[m.id] = el;
                        }}
                        type="button"
                        data-testid={`milestone-claim-btn-${m.threshold}`}
                        disabled={btnDisabled}
                        {...getJellyHandlers(btnDisabled, () => handleClaimMilestone(m.id))}
                        className="rw-jelly-btn rw-btn-red-glass h-10 min-h-[40px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-heading font-bold shrink-0 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                      >
                        {hasLoadError ? (
                          <span>Error</span>
                        ) : loading ? (
                          <span>Loading...</span>
                        ) : isGuestAccount ? (
                          <>
                            <Lock size={13} />
                            <span>Create a free account to claim rewards</span>
                          </>
                        ) : isComingSoon ? (
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

            {/* 1,000 MCQ Zenryu Companion Card */}
            <GlassCard
              variant="zenryu"
              data-testid="dragon-readonly-card"
              className="p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <DragonCrestSvg size={42} />
                <div className="min-w-0 flex-1">
                  <span
                    className="block text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--rw-red)' }}
                  >
                    1,000 MCQs Companion Unlock
                  </span>
                  <h3
                    className="font-dot text-base sm:text-lg font-extrabold mt-0.5"
                    style={{ color: 'var(--rw-text)' }}
                  >
                    Zenryu — The Guardian Dragon
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--rw-muted)' }}
                  >
                    Answer 1,000 practice MCQs to awaken Zenryu on your student dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--rw-muted)' }}>Progress</span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: 'var(--rw-text)' }}
                    >
                      {state.dragonMilestone.progress.toLocaleString()} / 1,000
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full border"
                    style={{
                      backgroundColor: 'var(--rw-bg)',
                      borderColor: 'var(--rw-border)',
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((state.dragonMilestone.progress / 1000) * 100)
                        )}%`,
                        backgroundColor: 'var(--rw-red)',
                      }}
                    />
                  </div>
                </div>

                <Link
                  to={user ? '/dashboard' : '/signup'}
                  {...getJellyHandlers()}
                  className="rw-jelly-btn rw-btn-clear-glass h-10 min-h-[40px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-heading font-bold shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
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
                style={{ color: 'var(--rw-muted)' }}
              >
                Two-Way Verified Friend Referrals
              </span>
              <h2
                id="referral-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                <span style={{ color: 'var(--rw-red)' }}>+5,000</span> for you,{' '}
                <span style={{ color: 'var(--rw-gold)' }}>+1,000</span> for your friend
              </h2>
            </div>

            {/* Monthly paid referrals counter */}
            <PillRow
              label="Monthly paid referrals"
              value={
                <span className="font-dot font-extrabold tabular-nums">
                  {state.referral.paidCountThisMonth} / {state.referral.maxPaidPerMonth}
                </span>
              }
            />

            {/* 3-Step Explainer */}
            <GlassCard className="p-5 sm:p-6">
              <span
                className="block text-[10px] font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--rw-muted)' }}
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
                    {idx < arr.length - 1 && (
                      <div
                        className="absolute left-[13px] top-7 bottom-[-16px] w-[1px]"
                        style={{ backgroundColor: 'var(--rw-border)' }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shrink-0"
                      style={{
                        backgroundColor: 'var(--rw-red)',
                        color: 'var(--rw-on-red)',
                      }}
                    >
                      {item.step}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3
                        className="font-dot text-sm sm:text-base font-extrabold leading-snug"
                        style={{ color: 'var(--rw-text)' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: 'var(--rw-muted)' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Permanent Referral Code Card */}
            <GlassCard className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="block text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--rw-muted)' }}
                  >
                    Your Permanent Referral Code
                  </span>
                  <span
                    data-testid="my-referral-code"
                    className="font-dot text-2xl sm:text-3xl font-extrabold tracking-wider block mt-0.5"
                    style={{ color: 'var(--rw-red)' }}
                  >
                    {state.referral.myCode}
                  </span>
                </div>

                {/* Primary action: Copy code uses Red Glass */}
                <button
                  type="button"
                  {...getJellyHandlers(false, handleCopyCode)}
                  className="rw-jelly-btn rw-btn-red-glass h-10 min-h-[40px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-heading font-bold shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied code' : 'Copy code'}</span>
                </button>
              </div>

              {/* Referral Link Row */}
              <div
                className="w-full rounded-full min-h-[48px] pl-4 pr-2 py-1.5 flex items-center justify-between gap-2 border"
                style={{
                  backgroundColor: 'var(--rw-bg)',
                  borderColor: 'var(--rw-border)',
                }}
              >
                <span
                  className="font-mono text-xs truncate min-w-0 flex-1"
                  style={{ color: 'var(--rw-muted)' }}
                  title={state.referral.shareUrl}
                >
                  {state.referral.shareUrl}
                </span>
                {/* Secondary action: Copy link uses Clear Glass */}
                <button
                  type="button"
                  {...getJellyHandlers(false, handleCopyLink)}
                  className="rw-jelly-btn rw-btn-clear-glass h-9 min-h-[36px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-heading font-bold shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                >
                  {copiedLink ? (
                    <Check size={14} style={{ color: 'var(--rw-green)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedLink ? 'Copied link' : 'Copy link'}</span>
                </button>
              </div>

              {/* Share on WhatsApp: Clear Glass with green text */}
              <a
                href={whatsappShareHref}
                target="_blank"
                rel="noopener noreferrer"
                {...getJellyHandlers()}
                className="rw-jelly-btn rw-btn-clear-glass rw-btn-whatsapp-glass w-full h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-5 text-xs sm:text-sm font-heading font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
              >
                <Share2 size={15} />
                <span>Share on WhatsApp</span>
              </a>
            </GlassCard>

            {/* Attach a Friend's Referral Code Card */}
            <GlassCard className="p-5 sm:p-6 space-y-3.5">
              <div>
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--rw-muted)' }}
                >
                  Joined Without a Link?
                </span>
                <h3
                  className="font-dot text-base sm:text-lg font-extrabold mt-0.5"
                  style={{ color: 'var(--rw-text)' }}
                >
                  Attach a friend&apos;s referral code
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--rw-muted)' }}
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
                      style={{ color: 'var(--rw-green)' }}
                    />
                  }
                  label="Inviter referral code attached"
                />
              ) : (
                <form
                  onSubmit={handleAttachManualCode}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    placeholder="BLD-7K9M2P"
                    maxLength={12}
                    aria-label="Enter friend's referral code"
                    className="h-12 min-h-[48px] flex-1 min-w-0 rounded-full border px-4 font-mono text-sm uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                    style={{
                      backgroundColor: 'var(--rw-bg)',
                      borderColor: 'var(--rw-border)',
                      color: 'var(--rw-text)',
                    }}
                  />
                  {/* Attach code uses Clear Glass */}
                  <button
                    type="submit"
                    data-testid="attach-referral-btn"
                    disabled={attachBtnDisabled}
                    {...getJellyHandlers(attachBtnDisabled)}
                    className="rw-jelly-btn rw-btn-clear-glass h-12 min-h-[48px] px-6 rounded-full inline-flex items-center justify-center text-xs sm:text-sm font-heading font-bold shrink-0 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                  >
                    {hasLoadError
                      ? 'Failed to load settings'
                      : loading
                      ? 'Loading...'
                      : isGuestAccount
                      ? 'Create a free account to claim rewards'
                      : isComingSoon
                      ? 'Coming soon'
                      : attachingCode
                      ? 'Attaching...'
                      : 'Attach code'}
                  </button>
                </form>
              )}
            </GlassCard>

            {/* Referrals List */}
            <div className="space-y-3 pt-1">
              <h3
                className="font-dot text-base sm:text-lg font-extrabold px-1"
                style={{ color: 'var(--rw-text)' }}
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
                    const acceptDisabled = Boolean(
                      isClaimBlocked || confirmingRefId === item.id
                    );

                    return (
                      <GlassCard
                        key={item.id}
                        data-testid={`referral-item-${item.id}`}
                        className="p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              className="font-dot text-sm sm:text-base font-extrabold block truncate"
                              style={{ color: 'var(--rw-text)' }}
                            >
                              {item.counterpartDisplayName}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: 'var(--rw-muted)' }}
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
                                      backgroundColor: 'var(--rw-bg)',
                                      borderColor: 'var(--rw-green)',
                                      color: 'var(--rw-green)',
                                    }
                                  : {
                                      backgroundColor: 'var(--rw-bg)',
                                      borderColor: 'var(--rw-border)',
                                      color: 'var(--rw-muted)',
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
                              className="h-11 min-h-[44px] flex-1 min-w-0 rounded-full border px-4 font-mono text-xs uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
                              style={{
                                backgroundColor: 'var(--rw-bg)',
                                borderColor: 'var(--rw-border)',
                                color: 'var(--rw-text)',
                              }}
                            />
                            <button
                              ref={(el) => {
                                confirmBtnRefs.current[item.id] = el;
                              }}
                              type="button"
                              disabled={acceptDisabled}
                              {...getJellyHandlers(acceptDisabled, () =>
                                handleConfirmFriendCode(item.id)
                              )}
                              className="rw-jelly-btn rw-btn-red-glass h-11 min-h-[44px] px-4 rounded-full inline-flex items-center justify-center text-xs font-heading font-bold shrink-0 disabled:cursor-not-allowed"
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
                style={{ color: 'var(--rw-muted)' }}
              >
                Transparency &amp; Fair Play
              </span>
              <h2
                id="rewards-faq-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                Rewards FAQ &amp; Rules
              </h2>
            </div>

            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="space-y-1.5">
                  <PillRow
                    as="button"
                    jellyVariant="faq"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenFaqId((prev) => (prev === faq.id ? null : faq.id))
                    }
                    className="w-full"
                  >
                    <span
                      className="font-heading text-xs sm:text-sm font-bold text-left pr-2"
                      style={{ color: 'var(--rw-text)' }}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                      style={{
                        color: isOpen ? 'var(--rw-red)' : 'var(--rw-muted)',
                      }}
                    />
                  </PillRow>

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
                          backgroundColor: 'var(--rw-card)',
                          borderColor: 'var(--rw-border)',
                          color: 'var(--rw-muted)',
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
      </main>

      {/* ─── FLAT RED ROUNDED-TOP FOOTER (NO EXTRA NAV PADDING) ─────────── */}
      <footer
        className="w-full rounded-t-[28px] sm:rounded-t-[40px] border-t pt-12 sm:pt-16 px-4 select-none"
        style={{
          backgroundColor: 'var(--rw-red)',
          borderColor: 'var(--rw-border)',
          color: 'var(--rw-on-red)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <Link
                to={homeUrl}
                {...getJellyHandlers()}
                className="rw-jelly-btn font-dot text-2xl sm:text-3xl font-extrabold tracking-tight inline-block"
                style={{ color: 'var(--rw-on-red)' }}
              >
                Boardly
              </Link>
              <p className="text-xs sm:text-sm mt-1 opacity-90">
                Making education accessible to everyone. A project of SHS Virtual Academy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {TOP_NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  {...getJellyHandlers()}
                  className="rw-jelly-btn px-3 py-1.5 rounded-full text-xs font-heading font-semibold"
                  style={{ color: 'var(--rw-on-red)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div
            className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-90"
            style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <span>&copy; {new Date().getFullYear()} Boardly Technologies. All rights reserved.</span>
            <span>Asia/Karachi (PKT)</span>
          </div>

          <div className="w-full text-center overflow-hidden pt-2">
            <span
              className="font-dot font-extrabold block leading-none select-none pointer-events-none"
              style={{
                fontSize: 'clamp(48px, 18vw, 180px)',
                color: 'var(--rw-on-red)',
              }}
              aria-hidden="true"
            >
              Boardly
            </span>
          </div>
        </div>
      </footer>

      <GuestUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        defaultReason="Create a free account to claim rewards and keep your username, progress, and test attempts."
      />
    </div>
  );
}

export default RewardsPage;
