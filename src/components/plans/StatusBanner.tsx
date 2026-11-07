import { Zap, Crown, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { PLANS, getProStatusSummary } from '@/config/plans';
import { formatPaymentMethodLabel } from '@/constants/branding';
import type { PaymentRequest } from '@/types';

export interface StatusBannerProps {
  planId: 'free' | 'pro' | 'crew';
  planExpiresAtRaw?: unknown;
  pendingProRequest?: PaymentRequest | null;
  latestRejectedProRequest?: PaymentRequest | null;
  onUpgradeOrExtend: () => void;
  compact?: boolean;
}

/**
 * Clean 1px-bordered StatusBanner shown on both `/dashboard/plans` and `/store` (Boardly Pro tab).
 * Removes the old left-edge border curve artifact and shows:
 * - "Pro active until 12 Dec 2026, N days left" when Pro is active
 * - Expiring-soon warning when <= 3 days left
 * - "Extend Pro" button when already Pro, or "Upgrade to Pro, PKR 199/mo" when on Free
 * - Pending PKR verification banner ("Request received, we will verify within 2 hours")
 * - Rejected PKR request notice if the latest request was rejected
 */
export function StatusBanner({
  planId,
  planExpiresAtRaw,
  pendingProRequest,
  latestRejectedProRequest,
  onUpgradeOrExtend,
  compact = false,
}: StatusBannerProps) {
  const proSummary = getProStatusSummary(planExpiresAtRaw);
  const isProActive = planId === 'pro' || proSummary.isActive;
  const monthlyPricePkr = PLANS.pro_monthly.price_pkr;

  const badgeLabel = isProActive
    ? 'Boardly Pro'
    : planId === 'crew'
    ? 'Nakama Crew'
    : 'Free Tier';

  return (
    <div className="space-y-3">
      {/* Main Active Plan Card — 1px uniform border, no stray left-edge border curve */}
      <div
        className={`rounded-[22px] bg-[var(--card)] border ${
          isProActive
            ? 'border-[var(--red)]/40 shadow-[0_10px_30px_rgba(232,52,42,0.08)]'
            : 'border-[var(--border)]'
        } ${compact ? 'p-4' : 'p-4 sm:p-5'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Active Plan
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md font-bold border ${
                isProActive
                  ? 'border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)]'
                  : planId === 'crew'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
              }`}
            >
              {isProActive && <Crown size={11} />}
              <span>{badgeLabel}</span>
            </span>

            {isProActive && proSummary.statusText && (
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
                <span>{proSummary.statusText}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            {isProActive ? (
              proSummary.isExpiringSoon ? (
                <span>
                  Your Pro pass expires soon ({proSummary.expiryDateLabel}). Extend now to keep
                  unlimited mock tests, AI derivations, and full analytics without interruption.
                </span>
              ) : (
                <span>
                  Unlimited daily practice tests, Arena mocks, AI step-by-step derivations, and
                  complete accuracy analytics are unlocked on your account.
                </span>
              )
            ) : planId === 'crew' ? (
              <span>
                Crew-shared practice perks are active. Upgrade to Boardly Pro for unlimited
                personal daily tests and full AI explanations.
              </span>
            ) : (
              <span>
                You are on the Free plan (2 practice tests/day, 10 questions/test). Upgrade to
                Boardly Pro for unlimited mock tests, AI derivations, and deep analytics.
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onUpgradeOrExtend}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--red)] hover:bg-[#d62d23] text-[#FFFFFF] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 shadow-[0_6px_20px_rgba(232,52,42,0.28)] transition-all duration-200 cursor-pointer"
        >
          <Zap size={15} className="shrink-0 text-[#FFFFFF]" />
          <span className="text-[#FFFFFF]">
            {isProActive
              ? 'Extend Pro'
              : `Upgrade to Pro, PKR ${monthlyPricePkr}/mo`}
          </span>
        </button>
      </div>

      {/* Pending PKR Pro Request Notice */}
      {pendingProRequest && (
        <div className="rounded-[18px] bg-amber-500/10 border border-amber-500/35 p-3.5 sm:p-4 flex items-start gap-3">
          <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
                Request received, we will verify within 2 hours
              </p>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                Pending Verification
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {pendingProRequest.planName ||
                (pendingProRequest.plan === 'pro_annual'
                  ? 'Boardly Pro, Annual Pass'
                  : 'Boardly Pro, Monthly Pass')}{' '}
              · PKR {(pendingProRequest.amount_pkr ?? pendingProRequest.amount).toLocaleString()}{' '}
              via {formatPaymentMethodLabel(pendingProRequest.method)} · TID:{' '}
              <span className="font-mono font-semibold text-[var(--text)]">
                {pendingProRequest.TID || pendingProRequest.transactionId}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Latest Rejected PKR Pro Request Notice (only shown if not currently Pro and no pending request) */}
      {!isProActive && !pendingProRequest && latestRejectedProRequest && (
        <div className="rounded-[18px] bg-red-500/10 border border-red-500/35 p-3.5 sm:p-4 flex items-start gap-3">
          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
              Previous Pro payment request could not be verified
            </p>
            <p className="text-xs text-[var(--muted)]">
              Reason:{' '}
              <span className="text-[var(--text)] font-medium">
                {latestRejectedProRequest.rejectionReason ||
                  'Transaction ID could not be verified on our payment portal.'}
              </span>{' '}
              (TID: {latestRejectedProRequest.TID || latestRejectedProRequest.transactionId})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
