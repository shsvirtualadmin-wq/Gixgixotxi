import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Crown, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import {
  POST_LIMITS,
  type DailyPostQuotaStatus,
} from '@/config/postLimits';

interface PostLimitBannerProps {
  quota: DailyPostQuotaStatus;
  /** Optional callback invoked right before navigating to /dashboard/plan (e.g. close modal) */
  onBeforeNavigate?: () => void;
  /** Compact inline style for profile composer vs fuller banner for modal */
  variant?: 'modal' | 'inline';
  className?: string;
}

export const PostLimitBanner: React.FC<PostLimitBannerProps> = ({
  quota,
  onBeforeNavigate,
  variant = 'modal',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleUpgrade = (target: 'pro' | 'plus') => {
    onBeforeNavigate?.();
    navigate(
      target === 'plus'
        ? '/dashboard/plan#boardly-plus-card'
        : '/dashboard/plan#boardly-pro-card'
    );
  };

  // Plus & Superadmin: Unlimited posts
  if (quota.isUnlimited) {
    if (variant === 'inline') {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11.5px] font-semibold text-amber-500 ${className}`}
          title="Boardly Plus includes unlimited daily posts"
        >
          <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Unlimited posts</span>
        </span>
      );
    }

    return (
      <div
        className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] ${className}`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Boardly Plus</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
          <InfinityIcon className="w-3.5 h-3.5" />
          <span>Unlimited posts</span>
        </span>
      </div>
    );
  }

  const limit = quota.limit ?? POST_LIMITS.free;
  const remaining = quota.remaining ?? Math.max(0, limit - quota.usedToday);
  const planLabel = quota.plan === 'pro' ? 'Pro' : 'Free';
  const upgradeTarget: 'pro' | 'plus' = quota.upgradeTarget ?? 'pro';

  // Limit Reached: show clear plan-aware cap, exact midnight PKT reset time, and Upgrade CTA
  if (quota.limitReached) {
    const upgradeLabel =
      upgradeTarget === 'plus'
        ? 'Upgrade to Plus (Unlimited)'
        : `Upgrade to Pro (${POST_LIMITS.pro}/day)`;

    return (
      <div
        role="alert"
        className={`rounded-2xl p-3.5 sm:p-4 bg-[#D71921]/12 border border-[#D71921]/40 space-y-2.5 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-[13px] font-bold text-[#D71921] dark:text-red-300">
              Daily post limit reached ({quota.usedToday}/{limit} · {planLabel})
            </div>
            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {quota.plan === 'free'
                ? `Free accounts can publish up to ${POST_LIMITS.free} posts per day. Upgrade to Pro for ${POST_LIMITS.pro} posts/day or Plus for unlimited posting.`
                : `Boardly Pro accounts can publish up to ${POST_LIMITS.pro} posts per day. Upgrade to Plus for unlimited daily posts.`}
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--text-muted)] pt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#D71921] shrink-0" />
              <span>
                Resets in <strong className="text-[var(--text)]">{quota.resetCountdown}</strong> ({quota.resetTimeLabel})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => handleUpgrade(upgradeTarget)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background:
                upgradeTarget === 'plus'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'var(--accent, #D71921)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{upgradeLabel}</span>
          </button>
          {quota.plan === 'free' && (
            <button
              type="button"
              onClick={() => handleUpgrade('plus')}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--border)]/50 border border-[var(--border)] cursor-pointer transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Or go Plus (Unlimited)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isLow = remaining <= 3;

  // Under limit — inline variant (Profile composer)
  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-[11.5px] ${className}`}>
        <span
          className={`font-semibold font-inter-num ${
            isLow ? 'text-amber-500' : 'text-[var(--text-muted)]'
          }`}
        >
          {remaining} of {limit} posts left today · {planLabel}
        </span>
        {isLow && (
          <button
            type="button"
            onClick={() => handleUpgrade(upgradeTarget)}
            className="font-bold text-[var(--accent)] hover:underline cursor-pointer"
          >
            {upgradeTarget === 'plus' ? 'Get Unlimited' : `Upgrade (${POST_LIMITS.pro}/day)`}
          </button>
        )}
      </div>
    );
  }

  // Under limit — modal variant (PostingWizardModal)
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 text-xs">
        <span
          className={`font-bold font-inter-num ${
            isLow ? 'text-amber-500' : 'text-[var(--text)]'
          }`}
        >
          {remaining} of {limit} posts left today
        </span>
        <span className="text-[var(--text-muted)]">· {planLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span>Resets {quota.resetTimeLabel}</span>
        {isLow && (
          <button
            type="button"
            onClick={() => handleUpgrade(upgradeTarget)}
            className="font-bold text-[#D71921] dark:text-[#ff6b72] hover:underline cursor-pointer"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};
