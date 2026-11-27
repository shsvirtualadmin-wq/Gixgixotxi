import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Users,
  BellRing,
  Sparkles,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  EmailVerificationRequiredCard,
  isEmailVerificationRequiredError,
} from '@/components/auth/EmailVerificationRequiredCard';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  GlassCard,
  PillRow,
  TabPills,
  KobanBadge,
  KobanCoinSvg,
  TreasureChestSvg,
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
  fetchRewardsState,
  fetchWingmatesFeed,
  getPendingReferralCode,
  readCachedRewardsState,
  triggerWingmateAction,
  type WingmateFeedItem,
  type WingmatesCounters,
} from '@/services/rewardsService';
import { recordRewardsContentPaint } from '@/lib/navStore';
import { useLanguage } from '@/contexts/LanguageContext';

const LazyGuestUpgradeModal = React.lazy(() =>
  import('@/components/auth/GuestUpgradeModal').then((m) => ({
    default: m.GuestUpgradeModal,
  }))
);

type RewardsTabId = 'checkin' | 'wingmates' | 'invite' | 'faq';

const FAQ_IDS = [
  'faq-missed-day',
  'faq-wingmates',
  'faq-two-way',
  'faq-payout',
] as const;

function parseTabFromHash(hash: string): RewardsTabId {
  const clean = hash.replace(/^#/, '').toLowerCase();
  if (clean === 'wingmates' || clean === 'milestones') {
    return 'wingmates';
  }
  if (clean === 'invite' || clean === 'faq' || clean === 'checkin') {
    return clean;
  }
  return 'checkin';
}

function formatLiveTimeAgo(
  timestampMs: number,
  nowMs: number,
  t: (k: string, p?: Record<string, string | number>) => string
): string {
  if (!timestampMs || timestampMs <= 0) return t('rewards.inactive');
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return t('time.secondsAgo', { count: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('time.minutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('time.hoursAgo', { count: diffHr });
  const diffDays = Math.floor(diffHr / 24);
  return t('time.daysAgo', { count: diffDays });
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
  const { t, formatNumber } = useLanguage();
  const { user, isAdmin, isGuest } = useAuth();
  const { balance: walletBalance, refreshWallet } = useWallet();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const rewardsTabs: TabPillItem<RewardsTabId>[] = [
    { id: 'checkin', label: t('rewards.tabCheckin') },
    { id: 'wingmates', label: t('rewards.tabWingmates') },
    { id: 'invite', label: t('rewards.tabInvite') },
    { id: 'faq', label: t('rewards.tabFaq') },
  ];

  // Tab state synced with URL hash (#checkin, #milestones, #invite, #faq)
  const [activeTab, setActiveTab] = useState<RewardsTabId>(() =>
    typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : 'checkin'
  );

  // Single-open FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_IDS[0]);

  const initialCachedRef = useRef<RewardsStateResponse | null>(
    readCachedRewardsState(user?.uid)
  );
  const [state, setState] = useState<RewardsStateResponse>(
    () => initialCachedRef.current || buildFallbackClientState(user?.uid)
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCachedRef.current);
  const [countdownSec, setCountdownSec] = useState<number>(() =>
    initialCachedRef.current?.daily?.secondsUntilNextPktMidnight ||
      getSecondsUntilNextPktMidnight()
  );

  // Action feedback states
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>(
    () => getPendingReferralCode() || ''
  );
  const [attachingCode, setAttachingCode] = useState(false);
  const [confirmInputs, setConfirmInputs] = useState<Record<string, string>>({});
  const [confirmingRefId, setConfirmingRefId] = useState<string | null>(null);

  // Wingmates live state
  const [wingmates, setWingmates] = useState<WingmateFeedItem[]>([]);
  const [wingmatesCounters, setWingmatesCounters] = useState<WingmatesCounters>({
    practicingNow: 0,
    streakAtRisk: 0,
    inactive2PlusDays: 0,
  });
  const [wingmatesLoading, setWingmatesLoading] = useState<boolean>(true);
  const [wingmatesError, setWingmatesError] = useState<string | null>(null);
  const [actionInFlightUid, setActionInFlightUid] = useState<string | null>(null);
  const [liveClockMs, setLiveClockMs] = useState<number>(() => Date.now());

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Refs for claim coin burst & balance count-up animation
  const balanceNumberRef = useRef<HTMLSpanElement | null>(null);
  const dailyClaimBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Synchronous in-flight locks to prevent double claims on rapid taps
  const claimingDailyLockRef = useRef<boolean>(false);
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
      initialCachedRef.current = fetched;
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
    const cached = readCachedRewardsState(user?.uid);
    if (cached) {
      initialCachedRef.current = cached;
      setState(cached);
      setLoading(false);
      recordRewardsContentPaint('cache');
      // Refresh in the background (stale-while-revalidate)
      void loadState(true);
    } else {
      void loadState(false).then(() => {
        recordRewardsContentPaint('network');
      });
    }
  }, [user?.uid, loadState]);

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
          text: t('rewards.claimedDayNotice', {
            day: formatNumber(res.dayNumber),
            amount: formatNumber(rewardDelta),
          }),
        });
      } else {
        console.error('[RewardsPage] Daily check-in claim failed:', res);
        setBannerNotice({
          type: 'error',
          text: res.error || t('rewards.claimFailed'),
        });
      }
    } catch (err: any) {
      console.error('[RewardsPage] Unexpected error during daily claim:', err);
      setBannerNotice({
        type: 'error',
        text: err?.message || t('rewards.claimFailed'),
      });
    } finally {
      claimingDailyLockRef.current = false;
      setClaimingDaily(false);
    }
  };

  const loadWingmates = useCallback(async (silent = false) => {
    if (!user?.uid || isGuestAccount) {
      setWingmates([]);
      setWingmatesCounters({
        practicingNow: 0,
        streakAtRisk: 0,
        inactive2PlusDays: 0,
      });
      setWingmatesError(null);
      setWingmatesLoading(false);
      return;
    }
    if (!silent) {
      setWingmatesLoading(true);
    }
    setWingmatesError(null);
    try {
      const res = await fetchWingmatesFeed();
      if (res.ok) {
        setWingmates(res.wingmates || []);
        setWingmatesCounters(
          res.counters || {
            practicingNow: 0,
            streakAtRisk: 0,
            inactive2PlusDays: 0,
          }
        );
      } else {
        setWingmatesError(res.error || 'Could not load Wingmates live feed.');
      }
    } catch (err: any) {
      setWingmatesError(err?.message || 'Could not load Wingmates live feed.');
    } finally {
      if (!silent) {
        setWingmatesLoading(false);
      }
    }
  }, [user?.uid, isGuestAccount]);

  useEffect(() => {
    void loadWingmates(false);
  }, [loadWingmates]);

  // Live "time ago" ticker every 15 seconds
  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveClockMs(Date.now());
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const handleWingmateAction = async (item: WingmateFeedItem) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (actionInFlightUid) return;
    if (item.actionType === 'nudge' && !item.canNudge) return;

    setActionInFlightUid(item.uid);
    setBannerNotice(null);
    try {
      const res = await triggerWingmateAction(item.uid, item.actionType);
      if (res.ok) {
        const now = Date.now();
        setWingmates((prev) =>
          prev.map((w) =>
            w.uid === item.uid
              ? {
                  ...w,
                  canNudge: item.actionType === 'nudge' ? false : w.canNudge,
                  lastNudgedAtMs: item.actionType === 'nudge' ? now : w.lastNudgedAtMs,
                }
              : w
          )
        );
        setBannerNotice({
          type: 'success',
          text:
            res.message ||
            (item.actionType === 'nudge'
              ? `Nudge sent to ${item.displayName}!`
              : `Cheer sent to ${item.displayName}!`),
        });
      } else {
        if (item.actionType === 'nudge' && res.nextNudgeAtMs) {
          setWingmates((prev) =>
            prev.map((w) =>
              w.uid === item.uid
                ? {
                    ...w,
                    canNudge: false,
                  }
                : w
            )
          );
        }
        setBannerNotice({
          type: 'error',
          text: res.error || `Failed to ${item.actionType} ${item.displayName}.`,
        });
      }
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        text: err?.message || `Failed to ${item.actionType} ${item.displayName}.`,
      });
    } finally {
      setActionInFlightUid(null);
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
      data-student-page="rewards"
      className="rewards-page-root min-h-[100dvh] w-full flex flex-col overflow-x-clip transition-colors duration-150"
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

      {/* ─── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div
        className="mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-6 space-y-6 flex-1"
        style={{
          paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
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
                <p className="font-bold">{t('rewards.guestLockTitle')}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--rw-muted)' }}>
                  {t('rewards.guestLockDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-testid="rewards-guest-upgrade-btn"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="rw-jelly-btn rw-btn-red-glass inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-heading font-bold shrink-0 cursor-pointer"
            >
              <span>{t('rewards.createFreeAccount')}</span>
              <ArrowRight size={14} className="rtl-mirror" />
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
              {t('rewards.yourLiveBalance')}
            </span>
            {isComingSoon && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--rw-red)',
                  color: 'var(--rw-on-red)',
                }}
              >
                {t('store.preview')}
              </span>
            )}
          </div>

          <h1 id="rewards-hero-heading" className="sr-only">
            {t('rewards.title')}
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
            <div className="text-start">
              <span
                ref={balanceNumberRef}
                data-testid="rewards-balance-pill"
                className={`rw-balance-number font-dot text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ltr-nums block leading-none ${
                  isBalanceBumping ? 'rw-balance-bumping' : ''
                }`}
              >
                {formatNumber(animatedBalance)}{' '}
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
              <span>{t('rewards.spendInStore')}</span>
              <ArrowRight size={15} className="rtl-mirror" />
            </Link>

            <Link
              to="/dashboard/practice"
              {...getJellyHandlers()}
              className="rw-jelly-btn rw-btn-clear-glass h-12 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 px-5 text-xs sm:text-sm font-heading font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
            >
              <span>{t('rewards.practiceMcqs')}</span>
            </Link>
          </div>

          {/* Cycle Cap Line */}
          <p
            className="text-xs sm:text-sm font-medium"
            style={{ color: 'var(--rw-muted)' }}
          >
            {t('rewards.cycleCapLine')}
          </p>

          {/* Action Feedback Notice */}
          {bannerNotice && isEmailVerificationRequiredError(bannerNotice.text) ? (
            <div className="w-full text-start">
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
              className="w-full flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs sm:text-sm font-semibold text-start"
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
                  className="ms-2 underline font-bold shrink-0 cursor-pointer"
                >
                  {t('rewards.createFreeAccount')}
                </button>
              )}
            </div>
          ) : null}
        </GlassCard>

        {/* ─── 2. LIQUID GLASS TAB SWITCHER ───────────────────────────────── */}
        <TabPills
          tabs={rewardsTabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel={t('rewards.title')}
        />

        {/* First-visit skeleton shimmer banner (shown only when cold cache is fetching) */}
        {loading && !initialCachedRef.current && (
          <div
            data-testid="rewards-first-visit-skeleton"
            aria-hidden="true"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse"
          >
            <div
              className="h-16 rounded-[24px] border"
              style={{
                backgroundColor: 'var(--rw-card)',
                borderColor: 'var(--rw-border)',
              }}
            />
            <div
              className="h-16 rounded-[24px] border"
              style={{
                backgroundColor: 'var(--rw-card)',
                borderColor: 'var(--rw-border)',
              }}
            />
            <div
              className="hidden sm:block h-16 rounded-[24px] border"
              style={{
                backgroundColor: 'var(--rw-card)',
                borderColor: 'var(--rw-border)',
              }}
            />
          </div>
        )}

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
                {t('rewards.dailyStreakLadder')}
              </span>
              <h2
                id="daily-checkin-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                {t('rewards.thirtyDayCheckin')}
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
              label={t('rewards.nextResetPkt')}
              value={
                <span
                  data-testid="pkt-countdown"
                  className="font-mono text-sm sm:text-base font-bold tabular-nums ltr-nums"
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
                  ? t('rewards.failedLoadSettings')
                  : loading
                  ? t('common.loading')
                  : isGuestAccount
                  ? t('rewards.guestLockTitle')
                  : isComingSoon
                  ? t('rewards.comingSoon')
                  : state.daily.claimedToday
                  ? t('rewards.claimedDayBtn', { day: formatNumber(state.daily.completedDaysInCycle) })
                  : claimingDaily
                  ? t('rewards.claiming')
                  : t('rewards.claimDayBtn', {
                      day: formatNumber(state.daily.nextDayNumber),
                      amount: formatNumber(state.daily.nextRewardAmount),
                    })}
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
                    // Regular future locked days: clear disc with visible dashed outline
                    discStyle = {
                      backgroundColor: 'var(--rw-disc-future-bg)',
                      border: '1.5px dashed var(--rw-disc-outline)',
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
                        className="font-dot text-xs sm:text-sm font-extrabold tabular-nums ltr-nums leading-tight mt-2"
                        style={{ color: amountColor }}
                      >
                        +{formatNumber(amount)}
                      </span>

                      {/* "Day N" under the amount */}
                      <span
                        className="text-[11px] font-semibold leading-tight mt-0.5"
                        style={{ color: dayLabelColor }}
                      >
                        {t('rewards.dayLabel', { day: formatNumber(dayNum) })}
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
                            {t('rewards.day30GrandChest')}
                          </span>
                          {isToday && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase"
                              style={{
                                backgroundColor: 'var(--rw-red)',
                                color: 'var(--rw-on-red)',
                              }}
                            >
                              {t('common.next')}
                            </span>
                          )}
                        </div>
                        <span
                          className="block text-xs truncate mt-0.5"
                          style={{ color: 'var(--rw-muted)' }}
                        >
                          {t('rewards.grandChestSub')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <KobanBadge amount={day30Amount} size="md" />
                      {isCompleted ? (
                        <CheckCircle2
                          size={16}
                          style={{ color: 'var(--rw-gold)' }}
                          aria-label={t('common.done')}
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
              {t('rewards.cumulativeNote')}
            </p>
          </section>
        )}

        {/* ─── 4. WINGMATES TAB (#wingmates) ──────────────────────────────── */}
        {activeTab === 'wingmates' && (
          <section
            key="wingmates"
            aria-labelledby="wingmates-heading"
            data-testid="wingmates-section"
            className="rw-tab-panel space-y-4"
          >
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <span
                  className="block font-mono text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--rw-muted)' }}
                >
                  {t('rewards.studySquadLive')}
                </span>
                <h2
                  id="wingmates-heading"
                  className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                  style={{ color: 'var(--rw-text)' }}
                >
                  {t('rewards.tabWingmates')}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void loadWingmates(false)}
                disabled={wingmatesLoading}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--pill-card-border)',
                  color: 'var(--text)',
                }}
              >
                <RefreshCw size={12} className={wingmatesLoading ? 'animate-spin' : ''} />
                <span>{t('common.refresh')}</span>
              </button>
            </div>

            {/* 3 Counter Pills: Practicing now, Streak at risk, Inactive 2+ days */}
            <div
              className="grid grid-cols-3 gap-2.5"
              data-testid="wingmates-counters"
            >
              <div
                className="rounded-[22px] border px-3.5 py-3 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--pill-card-border)',
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('rewards.practicingNow')}
                </span>
                <span
                  data-testid="wingmates-counter-practicing"
                  className="font-dot text-xl sm:text-2xl font-black tabular-nums ltr-nums mt-1"
                  style={{ color: 'var(--rw-green)' }}
                >
                  {formatNumber(wingmatesCounters.practicingNow)}
                </span>
              </div>

              <div
                className="rounded-[22px] border px-3.5 py-3 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--pill-card-border)',
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('rewards.streakAtRisk')}
                </span>
                <span
                  data-testid="wingmates-counter-at-risk"
                  className="font-dot text-xl sm:text-2xl font-black tabular-nums ltr-nums mt-1"
                  style={{ color: 'var(--rw-gold)' }}
                >
                  {formatNumber(wingmatesCounters.streakAtRisk)}
                </span>
              </div>

              <div
                className="rounded-[22px] border px-3.5 py-3 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--pill-card-border)',
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('rewards.inactive2Days')}
                </span>
                <span
                  data-testid="wingmates-counter-inactive"
                  className="font-dot text-xl sm:text-2xl font-black tabular-nums ltr-nums mt-1"
                  style={{ color: 'var(--rw-red)' }}
                >
                  {formatNumber(wingmatesCounters.inactive2PlusDays)}
                </span>
              </div>
            </div>

            {/* Loading State */}
            {wingmatesLoading && (
              <div
                data-testid="wingmates-loading"
                className="space-y-2.5"
              >
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="rounded-[999px] border px-4 py-3.5 flex items-center justify-between gap-3 animate-pulse"
                    style={{
                      backgroundColor: 'var(--pill-card-bg)',
                      borderColor: 'var(--pill-card-border)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="h-11 w-11 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--pill-chip-bg)' }}
                      />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div
                          className="h-3.5 w-32 rounded-full"
                          style={{ backgroundColor: 'var(--pill-chip-bg)' }}
                        />
                        <div
                          className="h-2.5 w-44 rounded-full"
                          style={{ backgroundColor: 'var(--pill-chip-bg)' }}
                        />
                      </div>
                    </div>
                    <div
                      className="h-9 w-24 rounded-full shrink-0"
                      style={{ backgroundColor: 'var(--pill-chip-bg)' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!wingmatesLoading && wingmatesError && (
              <div
                data-testid="wingmates-error"
                className="rounded-[28px] border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--rw-red)',
                  color: 'var(--text)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--rw-red)' }} />
                  <div>
                    <p className="text-sm font-bold">{t('rewards.wingmatesErrorTitle')}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {wingmatesError}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadWingmates(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rw-red)',
                    color: 'var(--rw-on-red)',
                  }}
                >
                  {t('common.retry')}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!wingmatesLoading && !wingmatesError && wingmates.length === 0 && (
              <div
                data-testid="wingmates-empty"
                className="rounded-[28px] border p-6 text-center flex flex-col items-center gap-3"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  borderColor: 'var(--pill-card-border)',
                  color: 'var(--text)',
                }}
              >
                <div
                  className="h-12 w-12 rounded-full border flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--pill-chip-bg)',
                    borderColor: 'var(--pill-chip-border)',
                    color: 'var(--rw-red)',
                  }}
                >
                  <Users size={20} />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="font-dot text-base sm:text-lg font-black">
                    {t('rewards.noWingmatesTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('rewards.noWingmatesDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('invite')}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rw-red)',
                    color: 'var(--rw-on-red)',
                  }}
                >
                  <span>{t('rewards.inviteWingmates')}</span>
                  <ArrowRight size={14} className="rtl-mirror" />
                </button>
              </div>
            )}

            {/* Live Feed Rows */}
            {!wingmatesLoading && !wingmatesError && wingmates.length > 0 && (
              <div
                data-testid="wingmates-feed-list"
                className="space-y-2.5"
              >
                {wingmates.map((w) => {
                  const isBusy = actionInFlightUid === w.uid;
                  const isNudge = w.actionType === 'nudge';
                  const isDisabled = isBusy || (isNudge && !w.canNudge);
                  const statusDotColor =
                    w.statusType === 'practicing_now'
                      ? 'var(--rw-green)'
                      : w.statusType === 'finished_test' || w.statusType === 'back_after_days'
                      ? 'var(--rw-gold)'
                      : 'var(--rw-red)';

                  return (
                    <div
                      key={w.uid}
                      data-testid={`wingmate-row-${w.uid}`}
                      className="rounded-[999px] border px-3.5 sm:px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-150"
                      style={{
                        backgroundColor: 'var(--pill-card-bg)',
                        borderColor: 'var(--pill-card-border)',
                        color: 'var(--text)',
                      }}
                    >
                      {/* Left: Avatar/Initials + Name + Status + Live Time Ago */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="relative h-11 w-11 rounded-full border flex items-center justify-center shrink-0 overflow-hidden font-dot text-sm font-black"
                          style={{
                            backgroundColor: 'var(--pill-chip-bg)',
                            borderColor: 'var(--pill-chip-border)',
                            color: 'var(--text)',
                          }}
                        >
                          {w.avatarUrl ? (
                            <img
                              src={w.avatarUrl}
                              alt={w.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{w.initials}</span>
                          )}
                          <span
                            className="absolute bottom-0.5 end-0.5 h-2.5 w-2.5 rounded-full border"
                            style={{
                              backgroundColor: statusDotColor,
                              borderColor: 'var(--pill-card-bg)',
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-sm font-bold truncate"
                              style={{ color: 'var(--text)' }}
                            >
                              {w.displayName}
                            </span>
                            <span
                              className="font-mono text-[10px] font-bold uppercase tracking-wider shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              · {formatLiveTimeAgo(w.lastEventAtMs, liveClockMs, t)}
                            </span>
                          </div>
                          <p
                            className="text-xs font-medium truncate mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {w.statusText}
                          </p>
                        </div>
                      </div>

                      {/* Right: Nudge or Cheer Pill Button */}
                      <button
                        type="button"
                        data-testid={`wingmate-action-btn-${w.uid}`}
                        disabled={isDisabled}
                        onClick={() => void handleWingmateAction(w)}
                        className="h-9 px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-opacity duration-150"
                        style={
                          isNudge
                            ? {
                                backgroundColor: w.canNudge
                                  ? 'var(--rw-red)'
                                  : 'var(--pill-chip-bg)',
                                color: w.canNudge
                                  ? 'var(--rw-on-red)'
                                  : 'var(--text-muted)',
                                border: w.canNudge
                                  ? '1px solid var(--rw-red)'
                                  : '1px solid var(--pill-chip-border)',
                              }
                            : {
                                backgroundColor: 'var(--pill-chip-bg)',
                                color: 'var(--text)',
                                border: '1px solid var(--pill-chip-border)',
                              }
                        }
                      >
                        {isNudge ? (
                          <>
                            <BellRing size={12} />
                            <span>
                              {isBusy
                                ? t('chat.sending')
                                : w.canNudge
                                ? t('rewards.nudge')
                                : t('rewards.nudged24h')}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} style={{ color: 'var(--rw-gold)' }} />
                            <span>{isBusy ? t('rewards.cheering') : t('rewards.cheer')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                {t('rewards.twoWayReferrals')}
              </span>
              <h2
                id="referral-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                {t('rewards.referralHeadline')}
              </h2>
            </div>

            {/* Monthly paid referrals counter */}
            <PillRow
              label={t('rewards.monthlyPaidReferrals')}
              value={
                <span className="font-dot font-extrabold tabular-nums ltr-nums">
                  {formatNumber(state.referral.paidCountThisMonth)} / {formatNumber(state.referral.maxPaidPerMonth)}
                </span>
              }
            />

            {/* 3-Step Explainer */}
            <GlassCard className="p-5 sm:p-6">
              <span
                className="block text-[10px] font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--rw-muted)' }}
              >
                {t('rewards.howItWorks')}
              </span>
              <div className="relative space-y-4">
                {[
                  {
                    step: 1,
                    title: t('rewards.step1Title'),
                    desc: t('rewards.step1Desc', { code: state.referral.myCode || 'BOARDLY' }),
                  },
                  {
                    step: 2,
                    title: t('rewards.step2Title'),
                    desc: t('rewards.step2Desc'),
                  },
                  {
                    step: 3,
                    title: t('rewards.step3Title', { count: formatNumber(state.referral.config.minInviteeMcqs) }),
                    desc: t('rewards.step3Desc', { count: formatNumber(state.referral.config.minInviteeMcqs) }),
                  },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="relative flex items-start gap-3.5">
                    {idx < arr.length - 1 && (
                      <div
                        className="absolute start-[13px] top-7 bottom-[-16px] w-[1px]"
                        style={{ backgroundColor: 'var(--rw-border)' }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shrink-0 ltr-nums"
                      style={{
                        backgroundColor: 'var(--rw-red)',
                        color: 'var(--rw-on-red)',
                      }}
                    >
                      {formatNumber(item.step)}
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
                    {t('rewards.yourReferralCode')}
                  </span>
                  <span
                    data-testid="my-referral-code"
                    className="font-dot text-2xl sm:text-3xl font-extrabold tracking-wider block mt-0.5 ltr-nums"
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
                  <span>{copiedCode ? t('rewards.copiedCode') : t('rewards.copyCode')}</span>
                </button>
              </div>

              {/* Referral Link Row */}
              <div
                className="w-full rounded-full min-h-[48px] ps-4 pe-2 py-1.5 flex items-center justify-between gap-2 border"
                style={{
                  backgroundColor: 'var(--rw-bg)',
                  borderColor: 'var(--rw-border)',
                }}
              >
                <span
                  className="font-mono text-xs truncate min-w-0 flex-1 ltr-nums"
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
                  <span>{copiedLink ? t('rewards.copiedLink') : t('rewards.copyLink')}</span>
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
                <span>{t('rewards.shareWhatsapp')}</span>
              </a>
            </GlassCard>

            {/* Attach a Friend's Referral Code Card */}
            <GlassCard className="p-5 sm:p-6 space-y-3.5">
              <div>
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--rw-muted)' }}
                >
                  {t('rewards.joinedWithoutLink')}
                </span>
                <h3
                  className="font-dot text-base sm:text-lg font-extrabold mt-0.5"
                  style={{ color: 'var(--rw-text)' }}
                >
                  {t('rewards.attachFriendCode')}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--rw-muted)' }}
                >
                  {t('rewards.attachCodeWindow', { days: formatNumber(state.referral.config.manualCodeWindowDays) })}
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
                  label={t('rewards.inviterAttached')}
                />
              ) : (
                <form
                  onSubmit={handleAttachManualCode}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <input
                    type="text"
                    dir="ltr"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    placeholder="BLD-7K9M2P"
                    maxLength={12}
                    aria-label={t('rewards.attachFriendCode')}
                    className="h-12 min-h-[48px] flex-1 min-w-0 rounded-full border px-4 font-mono text-sm uppercase tracking-wider focus:outline-none"
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
                      ? t('rewards.failedLoadSettings')
                      : loading
                      ? t('common.loading')
                      : isGuestAccount
                      ? t('rewards.guestLockTitle')
                      : isComingSoon
                      ? t('rewards.comingSoon')
                      : attachingCode
                      ? t('rewards.attaching')
                      : t('rewards.attachCodeBtn')}
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
                {t('rewards.yourReferralsCount', { count: formatNumber(state.referral.items.length) })}
              </h3>

              {state.referral.items.length === 0 ? (
                <PillRow
                  dashed
                  label={t('rewards.noReferralsYet')}
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
                              {item.role === 'inviter' ? t('rewards.youInvited') : t('rewards.invitedYou')} ·{' '}
                              <span className="ltr-nums">
                                {formatNumber(item.inviteeMcqsAnswered)} / {formatNumber(item.minInviteeMcqs)} MCQs
                              </span>
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
                                ? t('rewards.waitingForFriend')
                                : isPaid
                                ? t('rewards.statusPaid')
                                : t('rewards.statusPending')}
                            </span>
                          </div>
                        </div>

                        {needsMyAcceptance && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              dir="ltr"
                              value={confirmInputs[item.id] || ''}
                              onChange={(e) =>
                                setConfirmInputs((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value.toUpperCase(),
                                }))
                              }
                              placeholder={t('rewards.enterFriendCodePlaceholder')}
                              aria-label={t('rewards.enterFriendCodePlaceholder')}
                              className="h-11 min-h-[44px] flex-1 min-w-0 rounded-full border px-4 font-mono text-xs uppercase focus:outline-none"
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
                                ? t('rewards.comingSoon')
                                : confirmingRefId === item.id
                                ? t('rewards.accepting')
                                : t('rewards.accept')}
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
                {t('rewards.faqEyebrow')}
              </span>
              <h2
                id="rewards-faq-heading"
                className="font-dot text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: 'var(--rw-text)' }}
              >
                {t('rewards.faqTitle')}
              </h2>
            </div>

            {FAQ_IDS.map((faqId, idx) => {
              const isOpen = openFaqId === faqId;
              return (
                <div key={faqId} className="space-y-1.5">
                  <PillRow
                    as="button"
                    jellyVariant="faq"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenFaqId((prev) => (prev === faqId ? null : faqId))
                    }
                    className="w-full"
                  >
                    <span
                      className="font-heading text-xs sm:text-sm font-bold text-start pe-2"
                      style={{ color: 'var(--rw-text)' }}
                    >
                      {t(`rewards.faq_${idx}_q`)}
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
                        {t(`rewards.faq_${idx}_a`)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      {isUpgradeModalOpen && (
        <React.Suspense fallback={null}>
          <LazyGuestUpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            defaultReason="Create a free account to claim rewards and keep your username, progress, and test attempts."
          />
        </React.Suspense>
      )}
    </div>
  );
}

export default RewardsPage;
