import { Zap, Crown, Clock, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import {
  buildPlansCatalog,
  getProStatusSummary,
  type UnifiedPlanStatusResult,
} from '@/config/plans';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { formatPaymentMethodLabel } from '@/constants/branding';
import type { PaymentRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPlanLabel } from '@/lib/planTier';

export interface StatusBannerProps {
  planId: 'free' | 'pro' | 'plus' | 'crew';
  planExpiresAtRaw?: unknown;
  planStatus?: UnifiedPlanStatusResult;
  pendingProRequest?: PaymentRequest | null;
  latestRejectedProRequest?: PaymentRequest | null;
  onUpgradeOrExtend: () => void;
  onUpgradeToPlus?: () => void;
  compact?: boolean;
}

/**
 * Clean 1px-bordered StatusBanner shown on `/store` (Membership tab) and billing views.
 * Uses the unified plan status so it always agrees with the header chip and plan locks:
 * - Plus active: shows Boardly Plus active-until date (no upgrade button).
 * - Pro active: shows Boardly Pro active-until date + "Upgrade to Plus" button.
 * - Pending: shows pending verification status with no buy button.
 * - Free: shows "Upgrade to Pro" button.
 */
export function StatusBanner({
  planId,
  planExpiresAtRaw,
  planStatus,
  pendingProRequest,
  latestRejectedProRequest,
  onUpgradeOrExtend,
  onUpgradeToPlus,
  compact = false,
}: StatusBannerProps) {
  const { config: plansConfig } = usePlansConfig();
  const { t, formatPKR, formatNumber } = useLanguage();
  const catalog = buildPlansCatalog(plansConfig);

  const proSummary = getProStatusSummary(
    planStatus
      ? {
          plan: planStatus.isPersonalPlus
            ? 'plus'
            : planStatus.isPersonalPro
            ? 'pro'
            : 'free',
          isPremium: planStatus.isPersonalPro,
          proPlanId: planStatus.planId,
          planExpiresAt: planStatus.expiryMs ?? planExpiresAtRaw,
          isSuperAdmin: planStatus.isSuperAdmin,
        }
      : planExpiresAtRaw
  );

  const isPlusActive = planStatus
    ? planStatus.isPersonalPlus || planStatus.isSuperAdmin
    : planId === 'plus' || proSummary.isPersonalPlus;
  const isProActive = planStatus
    ? planStatus.state === 'active'
    : planId === 'pro' || planId === 'plus' || proSummary.isActive;
  const isPending = planStatus ? planStatus.state === 'pending' : Boolean(pendingProRequest);
  const canUpgradeFreeToPro = !isProActive && !isPending;
  const canUpgradeProToPlus = isProActive && !isPlusActive && !isPending && !planStatus?.isSuperAdmin;
  const monthlyPricePkr = catalog.pro_monthly.price_pkr;

  const badgeLabel = isPlusActive
    ? planStatus?.planName || formatPlanLabel('plus')
    : isProActive
    ? planStatus?.planName || formatPlanLabel('pro')
    : isPending
    ? t('plans.verificationPending')
    : planId === 'crew'
    ? t('plans.nakamaCrew')
    : t('plans.freeTier');

  const statusPillText =
    planStatus?.state === 'active' && planStatus.expiryFormatted
      ? planStatus.expiryFormatted.startsWith('Active') || planStatus.expiryFormatted === 'Unlimited'
        ? planStatus.timeLeftLabel
        : t('plans.activeUntilWithTime', { date: planStatus.expiryFormatted, timeLeft: planStatus.timeLeftLabel })
      : proSummary.statusText;

  return (
    <div className="space-y-3">
      <div
        className={`rounded-[22px] bg-[var(--card)] border ${
          isPlusActive
            ? 'border-amber-500/45 shadow-[0_10px_30px_rgba(245,158,11,0.09)]'
            : isProActive
            ? 'border-emerald-500/35 shadow-[0_10px_30px_rgba(16,185,129,0.07)]'
            : isPending
            ? 'border-amber-500/35'
            : 'border-[var(--border)]'
        } ${compact ? 'p-4' : 'p-4 sm:p-5'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
              {t('plans.currentPlan')}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md font-bold border ${
                isPlusActive
                  ? 'border-amber-500/45 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-300'
                  : isProActive
                  ? 'border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)]'
                  : isPending
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : planId === 'crew'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
              }`}
            >
              {isPlusActive ? <Sparkles size={11} /> : isProActive ? <Crown size={11} /> : null}
              {isPending && <Clock size={11} />}
              <span>{badgeLabel}</span>
            </span>

            {isProActive && statusPillText && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-md border ${
                  proSummary.isExpiringSoon
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 font-semibold'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium'
                }`}
              >
                {proSummary.isExpiringSoon ? (
                  <AlertTriangle size={11} />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                <span>{statusPillText}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            {isPlusActive ? (
              <span>
                {t('plans.bannerPlusActive', { credits: formatNumber(plansConfig.plus.aiCreditsPerDay) })}
              </span>
            ) : isProActive ? (
              <span>
                {t('plans.bannerProActive', {
                  proCredits: formatNumber(plansConfig.pro.aiCreditsPerDay),
                  plusCredits: formatNumber(plansConfig.plus.aiCreditsPerDay),
                })}
              </span>
            ) : isPending ? (
              <span>{t('plans.bannerPending')}</span>
            ) : planId === 'crew' ? (
              <span>{t('plans.bannerCrew')}</span>
            ) : (
              <span>
                {t('plans.bannerFree', { credits: formatNumber(plansConfig.free.aiCreditsPerDay) })}
              </span>
            )}
          </p>
        </div>

        {canUpgradeFreeToPro && (
          <button
            type="button"
            onClick={onUpgradeOrExtend}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--red)] hover:bg-[#d62d23] text-[#FFFFFF] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 shadow-[0_6px_20px_rgba(232,52,42,0.28)] transition-all duration-200 cursor-pointer"
          >
            <Zap size={15} className="shrink-0 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] ltr-nums">
              {t('plans.upgradeToProPrice', { price: formatPKR(monthlyPricePkr) })}
            </span>
          </button>
        )}

        {canUpgradeProToPlus && onUpgradeToPlus && (
          <button
            type="button"
            onClick={onUpgradeToPlus}
            style={{
              background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 55%, #B45309 100%)',
              color: '#FFFFFF',
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-[#FFFFFF] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 shadow-[0_6px_20px_rgba(217,119,6,0.28)] hover:brightness-110 transition-all duration-200 cursor-pointer"
          >
            <Sparkles size={15} className="shrink-0 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF]">{t('plans.upgradeToPlus')}</span>
          </button>
        )}
      </div>

      {!planStatus && pendingProRequest && (
        <div className="rounded-[18px] bg-amber-500/10 border border-amber-500/35 p-3.5 sm:p-4 flex items-start gap-3">
          <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
                {t('plans.paymentVerifyingTitle')}
              </p>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                {t('plans.pendingVerification')}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {pendingProRequest.planName ||
                (String(pendingProRequest.plan || '').startsWith('plus')
                  ? 'Boardly Plus'
                  : 'Boardly Pro')}{' '}
              · <span className="ltr-nums">{formatPKR(pendingProRequest.amount_pkr ?? pendingProRequest.amount)}</span>{' '}
              {t('plans.viaMethod', { method: formatPaymentMethodLabel(pendingProRequest.method) })} · TID:{' '}
              <span className="font-mono font-semibold text-[var(--text)] ltr-nums">
                {pendingProRequest.TID || pendingProRequest.transactionId}
              </span>
            </p>
          </div>
        </div>
      )}

      {!isProActive && !isPending && latestRejectedProRequest && (
        <div className="rounded-[18px] bg-red-500/10 border border-red-500/35 p-3.5 sm:p-4 flex items-start gap-3">
          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
              {t('plans.previousPaymentRejected')}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t('plans.reasonLabel')}{' '}
              <span className="text-[var(--text)] font-medium">
                {latestRejectedProRequest.rejectionReason || t('plans.defaultRejectionReason')}
              </span>{' '}
              (<span className="ltr-nums">TID: {latestRejectedProRequest.TID || latestRejectedProRequest.transactionId}</span>)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
