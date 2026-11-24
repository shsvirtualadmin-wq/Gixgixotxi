import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Infinity as InfinityIcon } from 'lucide-react';
import {
  POST_LIMITS,
  type DailyPostQuotaStatus,
} from '@/config/postLimits';
import { BoardlyAd } from '@/components/BoardlyAd';
import { useShowAds } from '@/hooks/useShowAds';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { showAds } = useShowAds();
  const { t, formatNumber } = useLanguage();

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
          title={t('commons.unlimitedPosts')}
        >
          <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{t('commons.unlimitedPosts')}</span>
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
          <span>{t('commons.unlimitedPosts')}</span>
        </span>
      </div>
    );
  }

  const limit = quota.limit ?? POST_LIMITS.free;
  const remaining = quota.remaining ?? Math.max(0, limit - quota.usedToday);
  const planLabel = quota.plan === 'pro' ? 'Boardly Pro' : t('common.free');
  const upgradeTarget: 'pro' | 'plus' = quota.upgradeTarget ?? 'pro';

  // Limit Reached: show clear plan-aware cap, exact midnight PKT reset time, and BoardlyAd (only when ads are enabled)
  if (quota.limitReached) {
    const reachedHeadline = t('commons.dailyPostLimitReached', {
      used: formatNumber(quota.usedToday),
      limit: formatNumber(limit),
      plan: planLabel,
    });
    const resetText = t('test.resetsIn', { time: `${quota.resetCountdown} (${quota.resetTimeLabel})` });

    if (!showAds) {
      return (
        <div
          role="alert"
          className={`my-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--text)] space-y-1 ${className}`}
        >
          <div className="font-bold">{reachedHeadline}</div>
          <div className="text-[var(--text-muted)]">{resetText}</div>
        </div>
      );
    }

    const upgradeLabel =
      upgradeTarget === 'plus'
        ? t('commons.upgradePlusUnlimited')
        : t('commons.upgradeProPosts', { limit: formatNumber(POST_LIMITS.pro) });

    return (
      <div role="alert" className={`my-2 ${className}`}>
        <BoardlyAd
          variant="banner"
          accent={upgradeTarget === 'plus' ? 'indigo-blue' : 'teal-purple'}
          illustrationId="crew-together"
          chip={upgradeTarget === 'plus' ? 'BOARDLY PLUS' : t('commons.dailyLimitReached')}
          headline={reachedHeadline}
          description={t('test.dailyLimitDesc')}
          metaNote={resetText}
          ctaLabel={upgradeLabel}
          onAction={() => handleUpgrade(upgradeTarget)}
          secondaryAction={
            quota.plan === 'free'
              ? {
                  label: t('commons.upgradePlusUnlimited'),
                  onClick: () => handleUpgrade('plus'),
                }
              : undefined
          }
          dismissible={false}
          infoText={t('settings.resetsAtMidnight')}
        />
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
          {t('commons.postsLeftToday', {
            remaining: formatNumber(remaining),
            limit: formatNumber(limit),
          })}{' '}
          · {planLabel}
        </span>
        {isLow && (
          <button
            type="button"
            onClick={() => handleUpgrade(upgradeTarget)}
            className="font-bold text-[var(--accent)] hover:underline cursor-pointer"
          >
            {t('common.upgrade')}
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
          {t('commons.postsLeftToday', {
            remaining: formatNumber(remaining),
            limit: formatNumber(limit),
          })}
        </span>
        <span className="text-[var(--text-muted)]">· {planLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span>{t('commons.resetsLabel', { time: quota.resetTimeLabel })}</span>
        {isLow && (
          <button
            type="button"
            onClick={() => handleUpgrade(upgradeTarget)}
            className="font-bold text-[#D71921] dark:text-[#ff6b72] hover:underline cursor-pointer"
          >
            {t('common.upgrade')}
          </button>
        )}
      </div>
    </div>
  );
};
