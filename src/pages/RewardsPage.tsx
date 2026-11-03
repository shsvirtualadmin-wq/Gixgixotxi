import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gift,
  CheckCircle2,
  Lock,
  Sparkles,
  Copy,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  Award,
  Users,
  ArrowRight,
  HelpCircle,
  Flame,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
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
  ensureFirestoreRewardsConfigSeeded,
  fetchRewardsState,
  getPendingReferralCode,
} from '@/services/rewardsService';

// ─── Custom SVG Icons (Pure SVG, zero external image assets) ──────────────────

function KobanCoinIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <ellipse
        cx="12"
        cy="12"
        rx="7.5"
        ry="10"
        fill="url(#kobanGoldGrad)"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="5"
        ry="7"
        stroke="#FEF3C7"
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
        opacity="0.75"
      />
      <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1" fill="#92400E" opacity="0.85" />
      <defs>
        <linearGradient id="kobanGoldGrad" x1="4.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TreasureChestSvg({
  grand = false,
  size = 24,
}: {
  grand?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className="inline-block shrink-0"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="11"
        width="22"
        height="13"
        rx="2.5"
        fill={grand ? '#B91C1C' : '#92400E'}
        stroke={grand ? '#FCA5A5' : '#FCD34D'}
        strokeWidth="1.6"
      />
      <path
        d="M3 11C3 7.5 6.5 5 14 5C21.5 5 25 7.5 25 11H3Z"
        fill={grand ? '#DC2626' : '#B45309'}
        stroke={grand ? '#FCA5A5' : '#FCD34D'}
        strokeWidth="1.6"
      />
      <rect
        x="11.5"
        y="9.5"
        width="5"
        height="6"
        rx="1.2"
        fill="#FDE68A"
        stroke="#78350F"
        strokeWidth="1.2"
      />
      <circle cx="14" cy="12.5" r="1" fill="#78350F" />
    </svg>
  );
}

function DragonCrestSvg({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className="inline-block shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="rgba(215, 25, 33, 0.14)"
        stroke="#D71921"
        strokeWidth="1.5"
      />
      <path
        d="M9 21C10.5 16.5 13 14 16.5 13.5C15 11.5 12.5 10.5 10.5 11C12.5 8 16.8 7.5 20.2 9.8C22.8 11.5 24 14.8 22.8 18.2C21.6 21.5 18.2 23.5 14.5 23.2C16.8 21.8 18.2 19.6 18 17.5C15.5 18.5 12.2 19.8 9 21Z"
        fill="#D71921"
      />
      <circle cx="18.5" cy="11.5" r="1.2" fill="#FEF08A" />
    </svg>
  );
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
  const { user, isAdmin } = useAuth();
  const { balance: walletBalance, refreshWallet } = useWallet();

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

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        await ensureFirestoreRewardsConfigSeeded(true);
      }
      const fetched = await fetchRewardsState(user?.uid);
      setState(fetched);
      if (fetched.daily?.secondsUntilNextPktMidnight) {
        setCountdownSec(fetched.daily.secondsUntilNextPktMidnight);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isAdmin]);

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

  const isComingSoon = Boolean(state.comingSoon || !state.enabled || !state.serverConfigured);
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
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Unable to claim daily reward right now.',
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
    if (isComingSoon || isAdmin || claimingMilestoneId) return;

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
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Unable to claim milestone reward.',
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

  return (
    <div className="rewards-page-root relative min-h-screen overflow-x-hidden pb-20 pt-6 md:pt-10">
      <PageMeta
        title="Boardly Rewards"
        description="Earn up to 7,550 Kobans every 30 days with the Boardly daily check-in, unlock MCQ practice milestones, and invite classmates for +5,000 Kobans."
        canonicalPath="/rewards"
      />
      <style>{`
        .rewards-glass-card {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(15, 23, 42, 0.10);
          box-shadow: 0 16px 40px -12px rgba(15, 23, 42, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        [data-theme="dark"] .rewards-glass-card,
        .dark .rewards-glass-card {
          background: rgba(18, 20, 28, 0.74);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 44px -12px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
        }
        @supports not ((backdrop-filter: blur(16px)) or (-webkit-backdrop-filter: blur(16px))) {
          .rewards-glass-card {
            background: rgba(255, 255, 255, 0.96);
          }
          [data-theme="dark"] .rewards-glass-card,
          .dark .rewards-glass-card {
            background: rgba(18, 20, 28, 0.96);
          }
        }
        .rewards-lifted-btn {
          min-height: 44px;
          transform: translateY(-2px);
          box-shadow: 0 10px 18px -6px rgba(215, 25, 33, 0.42);
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .rewards-lifted-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 14px 24px -6px rgba(215, 25, 33, 0.52);
        }
        .rewards-lifted-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 4px 10px -4px rgba(215, 25, 33, 0.35);
        }
        .rewards-lifted-btn:disabled {
          transform: translateY(0px);
          box-shadow: none;
          cursor: not-allowed;
        }
        .rewards-secondary-lifted-btn {
          min-height: 44px;
          transform: translateY(-2px);
          box-shadow: 0 10px 18px -6px rgba(15, 23, 42, 0.16);
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease;
        }
        .rewards-secondary-lifted-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 14px 22px -6px rgba(15, 23, 42, 0.24);
        }
        .rewards-secondary-lifted-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        .rewards-secondary-lifted-btn:disabled {
          transform: translateY(0px);
          box-shadow: none;
          cursor: not-allowed;
        }
        @media (prefers-reduced-motion: reduce) {
          .rewards-lifted-btn,
          .rewards-secondary-lifted-btn {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Subtle Ambient Blurred Color Blobs */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-24 left-1/4 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D71921 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 h-80 w-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D71921 0%, transparent 70%)' }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ─── SECTION 1: HERO ────────────────────────────────────────────── */}
        <section
          aria-labelledby="rewards-hero-heading"
          className="rewards-glass-card rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#D71921]/30 bg-[#D71921]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D71921]">
                <Sparkles size={14} />
                <span>Boardly Student Rewards</span>
                {isComingSoon && (
                  <span className="ml-1 rounded bg-[#D71921] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                    PREVIEW
                  </span>
                )}
              </div>

              <h1
                id="rewards-hero-heading"
                className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text)] leading-[1.08]"
              >
                Earn <span className="text-[#D71921]">Kobans</span> Every Day You Study.
              </h1>

              <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                Check in daily for up to <strong className="text-[var(--text)]">7,550 Kobans</strong> per 30-day cycle, unlock MCQ practice milestones, and invite classmates for <strong className="text-[var(--text)]">+5,000 Kobans</strong> per verified referral.
              </p>
            </div>

            {/* Balance & Primary CTA Card */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
                      <KobanCoinIcon size={26} />
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                        Your Live Balance
                      </span>
                      <span
                        data-testid="rewards-balance-pill"
                        className="font-display text-2xl sm:text-3xl font-black text-[var(--text)] tabular-nums"
                      >
                        {displayBalance.toLocaleString()}{' '}
                        <span className="text-sm font-bold text-amber-500">Kobans</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <Link
                      to="/store"
                      className="rewards-lifted-btn inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-[#D71921] px-5 py-2.5 text-sm font-bold text-white"
                    >
                      <span>Spend in Store</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/dashboard/practice"
                      className="rewards-secondary-lifted-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
                    >
                      <span>Practice MCQs</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-left sm:text-right">
                  <div>
                    <span className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                      Start Earning Today
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                      Create a free student account to track your streak & Kobans
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to="/signup"
                      className="rewards-lifted-btn inline-flex items-center justify-center gap-2 rounded-xl bg-[#D71921] px-5 py-2.5 text-sm font-bold text-white"
                    >
                      <span>Sign up free</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/login"
                      className="rewards-secondary-lifted-btn inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {bannerNotice && (
            <div
              role="status"
              className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                bannerNotice.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : bannerNotice.type === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}
            >
              {bannerNotice.type === 'success' ? (
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span>{bannerNotice.text}</span>
            </div>
          )}
        </section>

        {/* ─── SECTION 2: 30-DAY DAILY CHECK-IN ───────────────────────────── */}
        <section
          aria-labelledby="daily-checkin-heading"
          className="rewards-glass-card rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D71921]">
                <Flame size={15} />
                <span>Cumulative 30-Day Cycle · Never Resets on Missed Days</span>
              </div>
              <h2
                id="daily-checkin-heading"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)]"
              >
                30-Day Daily Check-In
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Claim once per calendar day (Asia/Karachi, UTC+5). Earn{' '}
                <strong className="text-[var(--text)]">7,550 Kobans</strong> every 30 check-ins with bonus treasure chests on Days 4, 7, 14, 21, 28 & 30!
              </p>
            </div>

            {/* Countdown + Claim Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
                <Clock size={16} className="text-[#D71921] shrink-0" />
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Next Reset (00:00 PKT)
                  </span>
                  <span
                    data-testid="pkt-countdown"
                    className="font-mono text-sm font-bold text-[var(--text)] tabular-nums"
                  >
                    {formatCountdownHms(countdownSec)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-testid="daily-claim-btn"
                disabled={isComingSoon || state.daily.claimedToday || claimingDaily}
                onClick={handleClaimDaily}
                className="rewards-lifted-btn inline-flex items-center justify-center gap-2 rounded-xl bg-[#D71921] px-6 py-3 text-sm font-bold text-white disabled:bg-neutral-500/30 disabled:text-[var(--muted)] disabled:border disabled:border-[var(--border)]"
              >
                <Gift size={17} />
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
            </div>
          </div>

          {/* 30-Day Grid: 3x10 on mobile (grid-cols-3), 6x5 on desktop (md:grid-cols-6) */}
          <div
            data-testid="daily-30-grid"
            className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3"
          >
            {ladder.map((amount, idx) => {
              const dayNum = idx + 1;
              const isChest = CHEST_DAYS.has(dayNum);
              const isGrandChest = dayNum === 30;
              const isCompleted = state.daily.claimedToday
                ? dayNum <= state.daily.completedDaysInCycle
                : dayNum < state.daily.nextDayNumber;
              const isToday = !state.daily.claimedToday && dayNum === state.daily.nextDayNumber;

              return (
                <div
                  key={dayNum}
                  data-testid={`daily-tile-${dayNum}`}
                  className={`relative flex flex-col items-center justify-between rounded-2xl border p-3 transition-all ${
                    isToday
                      ? 'border-[#D71921] bg-[#D71921]/12 ring-2 ring-[#D71921]/30'
                      : isCompleted
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : isGrandChest
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : isChest
                      ? 'border-amber-500/35 bg-amber-500/5'
                      : 'border-[var(--border)] bg-[var(--surface)]/70'
                  }`}
                >
                  <div className="flex w-full items-center justify-between text-[11px] font-bold">
                    <span
                      className={
                        isToday
                          ? 'text-[#D71921] font-extrabold'
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[var(--muted)]'
                      }
                    >
                      Day {dayNum}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-500 shrink-0"
                        aria-label="Completed"
                      />
                    ) : isToday ? (
                      <span className="rounded bg-[#D71921] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
                        Next
                      </span>
                    ) : isChest ? (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-300">
                        {isGrandChest ? 'Grand' : 'Chest'}
                      </span>
                    ) : (
                      <Lock size={12} className="text-[var(--muted)] opacity-50" />
                    )}
                  </div>

                  <div className="my-2.5 flex items-center justify-center">
                    {isChest ? (
                      <TreasureChestSvg grand={isGrandChest} size={isGrandChest ? 30 : 26} />
                    ) : (
                      <KobanCoinIcon size={22} />
                    )}
                  </div>

                  <div className="text-center">
                    <span
                      className={`font-display text-sm sm:text-base font-black tabular-nums ${
                        isGrandChest
                          ? 'text-[#D71921] dark:text-amber-300'
                          : isChest
                          ? 'text-amber-600 dark:text-amber-300'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      +{amount.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-[var(--muted)]">Kobans</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 3: MCQ MILESTONES + DRAGON READ-ONLY CARD ───────────── */}
        <section
          aria-labelledby="milestones-heading"
          className="rewards-glass-card rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D71921]">
                <Award size={15} />
                <span>Verified Practice Progression</span>
              </div>
              <h2
                id="milestones-heading"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1"
              >
                MCQ Practice Milestones
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Answer practice MCQs in completed drills to unlock one-time Koban milestone bonuses.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left sm:text-right shrink-0">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Verified MCQs Answered
              </span>
              <span
                data-testid="mcqs-answered-count"
                className="font-display text-2xl font-black text-[var(--text)] tabular-nums"
              >
                {state.mcqsAnswered.toLocaleString()}{' '}
                <span className="text-xs font-semibold text-[#D71921]">MCQs</span>
              </span>
            </div>
          </div>

          {isAdmin && (
            <div
              data-testid="super-admin-milestone-note"
              className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-200"
            >
              <ShieldCheck size={18} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Super Admin Account Exclusion Notice</p>
                <p className="mt-0.5 opacity-90">
                  Admin accounts have all Boardly Store items and companions unlocked by default and are excluded from claiming student MCQ milestone rewards.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.milestones.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.threshold) * 100));
              const isClaimingThis = claimingMilestoneId === m.id;
              const btnDisabled = isComingSoon || isAdmin || m.claimed || !m.eligible || isClaimingThis;

              return (
                <div
                  key={m.id}
                  data-testid={`milestone-card-${m.threshold}`}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5 gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D71921]">
                        <span>{m.threshold.toLocaleString()} MCQs Milestone</span>
                      </span>
                      <h3 className="font-display text-lg font-extrabold text-[var(--text)] mt-0.5">
                        {m.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-1">{m.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 shrink-0">
                      <KobanCoinIcon size={16} />
                      <span className="font-display text-sm font-black text-amber-600 dark:text-amber-300 tabular-nums">
                        +{m.reward.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--muted)]">Progress</span>
                      <span className="font-mono text-[var(--text)] tabular-nums">
                        {m.progress.toLocaleString()} / {m.threshold.toLocaleString()} MCQs ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-500/15">
                      <div
                        className="h-full rounded-full bg-[#D71921] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-[var(--muted)]">
                      {m.claimed
                        ? 'Reward credited to your wallet'
                        : m.eligible
                        ? 'Milestone reached!'
                        : `${Math.max(0, m.threshold - m.progress)} more MCQs needed`}
                    </span>

                    <button
                      type="button"
                      data-testid={`milestone-claim-btn-${m.threshold}`}
                      disabled={btnDisabled}
                      onClick={() => handleClaimMilestone(m.id)}
                      className="rewards-lifted-btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D71921] px-4 py-2 text-xs font-bold text-white disabled:bg-neutral-500/25 disabled:text-[var(--muted)] disabled:border disabled:border-[var(--border)]"
                    >
                      {isComingSoon ? (
                        <span>Coming soon</span>
                      ) : m.claimed ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Claimed</span>
                        </>
                      ) : isAdmin ? (
                        <span>Admin Excluded</span>
                      ) : isClaimingThis ? (
                        <span>Claiming...</span>
                      ) : (
                        <span>Claim +{m.reward} Kobans</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Read-Only 1,000-MCQ Dragon Companion Card (Untouched unlock logic) */}
          <div
            data-testid="dragon-readonly-card"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D71921]/35 bg-gradient-to-r from-[#D71921]/10 via-amber-500/5 to-transparent p-5"
          >
            <div className="flex items-start sm:items-center gap-4">
              <DragonCrestSvg size={44} />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#D71921] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    1,000 MCQs Companion Unlock
                  </span>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    Read-Only Companion Status
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold text-[var(--text)]">
                  Zenryu — The Guardian Dragon Companion
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  Answer 1,000 practice MCQs to awaken Zenryu on your student dashboard (or unlock early in the Koban Store). Progress:{' '}
                  <strong className="text-[var(--text)] tabular-nums">
                    {state.dragonMilestone.progress.toLocaleString()} / 1,000 MCQs
                  </strong>
                  .
                </p>
              </div>
            </div>

            <Link
              to={user ? '/dashboard' : '/signup'}
              className="rewards-secondary-lifted-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs sm:text-sm font-bold text-[var(--text)] shrink-0"
            >
              <span>{state.dragonMilestone.unlocked ? 'Dragon Unlocked · View' : 'View on Dashboard'}</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        {/* ─── SECTION 4: INVITE FRIENDS (+5,000 INVITER / +1,000 INVITEE) ─── */}
        <section
          aria-labelledby="referral-heading"
          className="rewards-glass-card rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D71921]">
                <Users size={15} />
                <span>Two-Way Verified Friend Referrals</span>
              </div>
              <h2
                id="referral-heading"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)]"
              >
                Invite Classmates: <span className="text-[#D71921]">+5,000</span> for You,{' '}
                <span className="text-amber-500">+1,000</span> for Your Friend
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Both you and your friend earn Kobans automatically as soon as you confirm their code and they answer{' '}
                <strong className="text-[var(--text)]">{state.referral.config.minInviteeMcqs} practice MCQs</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left md:text-right shrink-0">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Monthly Paid Referrals
              </span>
              <span className="font-display text-xl font-black text-[var(--text)] tabular-nums">
                {state.referral.paidCountThisMonth} / {state.referral.maxPaidPerMonth}{' '}
                <span className="text-xs font-semibold text-[var(--muted)]">this month</span>
              </span>
            </div>
          </div>

          {/* 3-Step Visual Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D71921] text-xs font-black text-white">
                1
              </span>
              <h3 className="font-display text-base font-bold text-[var(--text)]">
                Share Your Referral Link
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Send your personal <code className="font-mono text-[var(--text)]">/join/{state.referral.myCode}</code> link to a classmate (or have them enter your code within 7 days of signup).
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D71921] text-xs font-black text-white">
                2
              </span>
              <h3 className="font-display text-base font-bold text-[var(--text)]">
                Confirm Your Friend&apos;s Code
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Once your friend signs up and verifies their email, ask them for their own <code className="font-mono text-[var(--text)]">BLD-XXXXXX</code> code and enter it below within 14 days.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D71921] text-xs font-black text-white">
                3
              </span>
              <h3 className="font-display text-base font-bold text-[var(--text)]">
                Friend Answers 20 MCQs
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                As soon as your friend completes 20 practice MCQs, you receive{' '}
                <strong className="text-[var(--text)]">+5,000 Kobans</strong> and they receive{' '}
                <strong className="text-[var(--text)]">+1,000 Kobans</strong>!
              </p>
            </div>
          </div>

          {/* Your Code + Share Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] block">
                    Your Permanent Referral Code
                  </span>
                  <span
                    data-testid="my-referral-code"
                    className="font-mono text-2xl font-black tracking-wider text-[#D71921]"
                  >
                    {state.referral.myCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rewards-secondary-lifted-btn inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-xs font-bold text-[var(--text)]"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                  Your Direct Invite Link
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={state.referral.shareUrl}
                    aria-label="Your referral share URL"
                    className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 font-mono text-xs text-[var(--text)]"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rewards-secondary-lifted-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-xs font-bold text-[var(--text)] shrink-0"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleWebShare}
                  className="rewards-lifted-btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D71921] px-4 py-2.5 text-xs sm:text-sm font-bold text-white"
                >
                  <Share2 size={15} />
                  <span>Share Invite Link</span>
                </button>
                <a
                  href={whatsappShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rewards-secondary-lifted-btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300"
                >
                  <Share2 size={15} />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Manual Inviter Code Input (Within 7 days of signup if none attached) */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] block">
                  Joined Without a Link?
                </span>
                <h3 className="font-display text-lg font-extrabold text-[var(--text)]">
                  Attach a Friend&apos;s Referral Code
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  If you signed up within the last {state.referral.config.manualCodeWindowDays} days without clicking a referral link, enter your friend&apos;s <code className="font-mono text-[var(--text)]">BLD-XXXXXX</code> code here.
                </p>
              </div>

              {state.referral.alreadyAttachedInviter ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>You have already attached an inviter referral code to your account.</span>
                </div>
              ) : (
                <form onSubmit={handleAttachManualCode} className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                      placeholder="BLD-7K9M2P"
                      maxLength={12}
                      aria-label="Enter friend's referral code"
                      className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 font-mono text-sm uppercase tracking-wider text-[var(--text)] placeholder:text-[var(--muted)]/50"
                    />
                    <button
                      type="submit"
                      data-testid="attach-referral-btn"
                      disabled={isComingSoon || attachingCode || !manualCodeInput.trim()}
                      className="rewards-lifted-btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D71921] px-5 py-2.5 text-xs sm:text-sm font-bold text-white disabled:bg-neutral-500/25 disabled:text-[var(--muted)] disabled:border disabled:border-[var(--border)] shrink-0"
                    >
                      <span>
                        {isComingSoon
                          ? 'Coming soon'
                          : attachingCode
                          ? 'Attaching...'
                          : 'Attach Code'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    Requires verified email. Self-referrals and mutual referrals are automatically blocked.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Pending & Completed Referrals List */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-extrabold text-[var(--text)]">
              Your Referrals ({state.referral.items.length})
            </h3>

            {state.referral.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-6 text-center">
                <p className="text-sm font-semibold text-[var(--text)]">No referrals yet</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Share your link above with classmates to start earning +5,000 Kobans per verified referral.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.referral.items.map((item) => {
                  const isPendingConfirm =
                    item.role === 'inviter' && item.status === 'pending_confirmation';
                  const pct = Math.min(
                    100,
                    Math.round((item.inviteeMcqsAnswered / item.minInviteeMcqs) * 100)
                  );

                  return (
                    <div
                      key={item.id}
                      data-testid={`referral-item-${item.id}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-extrabold text-[var(--text)]">
                            {item.counterpartDisplayName}
                          </span>
                          <span className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--muted)]">
                            {item.role === 'inviter' ? 'You Invited' : 'Invited You'}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              item.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                : item.status === 'confirmed_waiting_mcqs'
                                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                                : item.status === 'pending_confirmation'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-red-500/15 text-red-600 dark:text-red-300'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--muted)]">
                          Invitee MCQ Progress:{' '}
                          <strong className="text-[var(--text)] tabular-nums">
                            {item.inviteeMcqsAnswered} / {item.minInviteeMcqs} MCQs
                          </strong>{' '}
                          ({pct}%) · Reward:{' '}
                          <strong className="text-[var(--text)]">
                            +{(item.role === 'inviter' ? item.inviterReward : item.inviteeReward).toLocaleString()} Kobans
                          </strong>
                        </p>
                      </div>

                      {isPendingConfirm && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
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
                            className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs uppercase text-[var(--text)]"
                          />
                          <button
                            type="button"
                            disabled={isComingSoon || confirmingRefId === item.id}
                            onClick={() => handleConfirmFriendCode(item.id)}
                            className="rewards-lifted-btn inline-flex items-center justify-center rounded-xl bg-[#D71921] px-4 py-2.5 text-xs font-bold text-white disabled:bg-neutral-500/25 disabled:text-[var(--muted)]"
                          >
                            {isComingSoon
                              ? 'Coming soon'
                              : confirmingRefId === item.id
                              ? 'Confirming...'
                              : 'Confirm Code'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION 5: SHORT FAQ & RULES ───────────────────────────────── */}
        <section
          aria-labelledby="rewards-faq-heading"
          className="rewards-glass-card rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D71921]">
            <HelpCircle size={15} />
            <span>Transparency & Fair Play</span>
          </div>
          <h2
            id="rewards-faq-heading"
            className="font-display text-2xl font-extrabold text-[var(--text)]"
          >
            Rewards FAQ & Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 space-y-1.5">
              <h3 className="font-display text-sm font-bold text-[var(--text)]">
                What happens if I miss a day in the 30-day check-in?
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Your 30-day check-in progress is cumulative and does not reset if you miss a day. Each day resets at 00:00 PKT (Asia/Karachi, UTC+5), and after Day 30 the cycle renews at Day 1.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 space-y-1.5">
              <h3 className="font-display text-sm font-bold text-[var(--text)]">
                How are MCQ milestones counted?
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Milestones count verified answered questions from your completed practice test attempts on the server. Each milestone (50, 100, 250, 500 MCQs) can be claimed once per student account.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 space-y-1.5">
              <h3 className="font-display text-sm font-bold text-[var(--text)]">
                Why do referrals require two-way code confirmation?
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                To keep referrals fair for real classmates, your friend attaches your link/code on signup and shares their own <code className="font-mono">BLD-XXXXXX</code> code with you to confirm within 14 days.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 space-y-1.5">
              <h3 className="font-display text-sm font-bold text-[var(--text)]">
                When are referral Kobans paid out?
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Once both codes are linked, your friend verifies their email, and they complete 20 practice MCQs, the server credits +5,000 Kobans to you and +1,000 Kobans to your friend (up to 10 paid referrals per month).
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RewardsPage;
