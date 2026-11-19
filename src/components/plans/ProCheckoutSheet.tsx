import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
import { ProLockedStateCard } from '@/components/plans/ProLockedStateCard';
import { SettingsSheet } from '@/components/settings/SettingsSheet';
import {
  PLANS,
  REFUND_POLICY_TEXT,
  ANNUAL_SAVINGS_PERCENT,
  getProPlanById,
  computeExtendedProExpiry,
  type ProPlanId,
} from '@/config/plans';
import {
  PAYMENT_METHODS_LIST,
  PAYMENT_METHODS_PAIR_LABEL,
  type PaymentMethodId,
} from '@/constants/branding';
import {
  purchaseProWithKobans,
  submitProPaymentRequest,
  validateProCoupon,
  redeemProCoupon,
  type ValidatedProCoupon,
} from '@/services/proSubscriptionService';

export interface ProCheckoutSheetProps {
  open: boolean;
  onClose: () => void;
  initialPlanId?: ProPlanId;
  uid?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  kobanBalance: number | null;
  balanceLoaded?: boolean;
  currentProExpiresAt?: unknown;
  hasPendingProRequest?: boolean;
  onOpenGetKobans: (neededAmount?: number) => void;
  onSuccess?: (result: {
    mode: 'kobans' | 'pkr';
    planId: ProPlanId;
    newExpiryLabel?: string;
    newBalance?: number;
  }) => void;
  onStartPracticing?: () => void;
}

/**
 * Boardly Pro Checkout Sheet built on SettingsSheet.
 * Preserves Monthly/Annual switching, Kobans instant payment, JazzCash/Opay manual TID payment,
 * coupon validation/redemption, no-refund terms, and active/pending purchase lock.
 */
export function ProCheckoutSheet({
  open,
  onClose,
  initialPlanId = 'pro_monthly',
  uid,
  userEmail,
  userName,
  kobanBalance,
  balanceLoaded = true,
  currentProExpiresAt,
  hasPendingProRequest = false,
  onOpenGetKobans,
  onSuccess,
  onStartPracticing,
}: ProCheckoutSheetProps) {
  const { isGuest } = useAuth();
  const { planStatus, refreshPlanStatus } = useEffectivePlan();

  const [selectedPlanId, setSelectedPlanId] = useState<ProPlanId>(initialPlanId);
  const [paymentOption, setPaymentOption] = useState<'kobans' | 'pkr' | null>(null);
  const [selectedPkrMethod, setSelectedPkrMethod] = useState<PaymentMethodId>('jazzcash');
  const [tidInput, setTidInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `pro_chk_${Date.now()}`);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedProCoupon | null>(null);

  const [completedState, setCompletedState] = useState<{
    mode: 'kobans' | 'pkr';
    planName: string;
    durationDays: number;
    newExpiryLabel: string;
    wasExtension: boolean;
    previousExpiryLabel: string | null;
    kobansSpent?: number;
    balanceAfter?: number;
    pkrAmount?: number;
    tid?: string;
    couponCode?: string | null;
  } | null>(null);

  const kobanBalanceRef = useRef(kobanBalance);
  kobanBalanceRef.current = kobanBalance;
  const balanceLoadedRef = useRef(balanceLoaded);
  balanceLoadedRef.current = balanceLoaded;

  // Reset state when sheet opens or initialPlanId changes
  useEffect(() => {
    if (open) {
      refreshPlanStatus().catch(() => {});
      const resolvedPlan = getProPlanById(initialPlanId);
      setSelectedPlanId(resolvedPlan.id);
      const currentBal = kobanBalanceRef.current;
      if (balanceLoadedRef.current && currentBal !== null && currentBal >= resolvedPlan.price_kobans) {
        setPaymentOption('kobans');
      } else {
        setPaymentOption('pkr');
      }
      setTidInput('');
      setErrorMsg(null);
      setCouponInput('');
      setCouponError(null);
      setAppliedCoupon(null);
      setCompletedState(null);
      setIdempotencyKey(
        `pro_chk_${resolvedPlan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      );
    }
  }, [open, initialPlanId, refreshPlanStatus]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.setAttribute('data-pro-checkout-open', 'true');
      return () => {
        document.body.removeAttribute('data-pro-checkout-open');
      };
    }
    document.body.removeAttribute('data-pro-checkout-open');
  }, [open]);

  const handleSelectPlan = async (nextPlanId: ProPlanId) => {
    if (submitting) return;
    setSelectedPlanId(nextPlanId);
    setErrorMsg(null);
    setIdempotencyKey(
      `pro_chk_${nextPlanId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    );
    if (appliedCoupon?.code) {
      setCouponLoading(true);
      try {
        const revalidated = await validateProCoupon({
          code: appliedCoupon.code,
          planId: nextPlanId,
        });
        setAppliedCoupon(revalidated);
        setCouponError(null);
      } catch (err: any) {
        setAppliedCoupon(null);
        setCouponError(err?.message || 'Coupon is not valid for the selected plan.');
      } finally {
        setCouponLoading(false);
      }
    }
  };

  const handleApplyCoupon = async () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    setErrorMsg(null);
    try {
      const validated = await validateProCoupon({
        code: clean,
        planId: selectedPlanId,
      });
      setAppliedCoupon(validated);
      setCouponInput(validated.code);
      if (
        !validated.isFreeActivation &&
        balanceLoadedRef.current &&
        kobanBalanceRef.current !== null &&
        kobanBalanceRef.current >= validated.finalKobans &&
        paymentOption === 'pkr' &&
        !tidInput.trim()
      ) {
        setPaymentOption('kobans');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'Invalid or expired coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const plan = useMemo(() => getProPlanById(selectedPlanId), [selectedPlanId]);
  const effectiveDurationDays = appliedCoupon?.durationDays || plan.duration_days;
  const effectivePkr = appliedCoupon ? appliedCoupon.finalPkr : plan.price_pkr;
  const effectiveKobans = appliedCoupon ? appliedCoupon.finalKobans : plan.price_kobans;
  const isFreeCouponActivation = Boolean(
    appliedCoupon &&
      (appliedCoupon.isFreeActivation || (effectivePkr === 0 && effectiveKobans === 0))
  );

  const expiryPreview = useMemo(
    () => computeExtendedProExpiry(currentProExpiresAt, effectiveDurationDays),
    [currentProExpiresAt, effectiveDurationDays]
  );

  const isBalanceReady = balanceLoaded && kobanBalance !== null;
  const safeBalance = isBalanceReady ? Math.max(0, Math.floor(kobanBalance)) : 0;
  const hasEnoughKobans = isBalanceReady && safeBalance >= effectiveKobans;
  const neededKobans = isBalanceReady ? Math.max(0, effectiveKobans - safeBalance) : 0;
  const balanceAfterKobans = isBalanceReady ? Math.max(0, safeBalance - effectiveKobans) : 0;

  const activePkrConfig = useMemo(
    () =>
      PAYMENT_METHODS_LIST.find((m) => m.id === selectedPkrMethod) ||
      PAYMENT_METHODS_LIST[0],
    [selectedPkrMethod]
  );

  if (open && isGuest) {
    return <GuestProBlockedView variant="sheet" onClose={onClose} />;
  }

  const handleCopy = (value: string, label: string) => {
    void navigator.clipboard?.writeText(value);
    setCopiedField(label);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  const isLocked =
    !completedState &&
    (planStatus.state === 'active' || planStatus.state === 'pending' || hasPendingProRequest);

  const cleanTid = tidInput.trim();
  const isSubmitDisabled =
    submitting ||
    (!isFreeCouponActivation &&
      (!paymentOption ||
        (paymentOption === 'kobans' && !hasEnoughKobans) ||
        (paymentOption === 'pkr' && (hasPendingProRequest || cleanTid.length < 5))));

  const handlePrimarySubmit = async () => {
    if (!uid) {
      setErrorMsg('Please sign in to activate Boardly Pro.');
      return;
    }

    if (planStatus.state === 'active') {
      setErrorMsg(
        planStatus.blockReason ||
          `You already have Boardly Pro (${planStatus.planName}) active until ${planStatus.expiryFormatted}. You can renew after your current plan expires.`
      );
      return;
    }

    if (planStatus.state === 'pending' || hasPendingProRequest) {
      setErrorMsg(
        planStatus.blockReason ||
          'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while a payment is awaiting verification.'
      );
      return;
    }

    setErrorMsg(null);

    // Case 1: 100%-Off / Free Pro Coupon Activation
    if (isFreeCouponActivation && appliedCoupon) {
      setSubmitting(true);
      try {
        const res = await redeemProCoupon({
          code: appliedCoupon.code,
          planId: plan.id,
        });

        setCompletedState({
          mode: 'kobans',
          planName: res.planName || plan.name,
          durationDays: res.durationDays || effectiveDurationDays,
          newExpiryLabel: res.newExpiryLabel || expiryPreview.newExpiryLabel,
          wasExtension: expiryPreview.wasAlreadyActive,
          previousExpiryLabel: expiryPreview.previousExpiryLabel,
          kobansSpent: 0,
          balanceAfter: safeBalance,
          couponCode: appliedCoupon.code,
        });

        onSuccess?.({
          mode: 'kobans',
          planId: res.planId || plan.id,
          newExpiryLabel: res.newExpiryLabel || expiryPreview.newExpiryLabel,
          newBalance: safeBalance,
        });
      } catch (err: any) {
        setErrorMsg(err?.message || 'Could not redeem coupon. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!paymentOption) {
      setErrorMsg('Choose a payment method to continue.');
      return;
    }

    if (paymentOption === 'kobans') {
      if (!hasEnoughKobans) {
        setErrorMsg(
          `You need ${neededKobans.toLocaleString()} more Kobans to purchase ${plan.name}.`
        );
        return;
      }

      setSubmitting(true);
      try {
        const res = await purchaseProWithKobans({
          uid,
          userEmail: userEmail || undefined,
          userName: userName || undefined,
          planId: plan.id,
          idempotencyKey,
          couponCode: appliedCoupon?.code || null,
        });

        setCompletedState({
          mode: 'kobans',
          planName: res.planName,
          durationDays: res.durationDays,
          newExpiryLabel: res.newExpiryLabel,
          wasExtension: res.wasExtension,
          previousExpiryLabel: res.previousExpiryLabel,
          kobansSpent: res.kobansCharged,
          balanceAfter: res.balanceAfter,
          couponCode: appliedCoupon?.code || null,
        });

        onSuccess?.({
          mode: 'kobans',
          planId: res.planId,
          newExpiryLabel: res.newExpiryLabel,
          newBalance: res.balanceAfter,
        });
      } catch (err: any) {
        setErrorMsg(err?.message || 'Could not complete Pro activation. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (cleanTid.length < 5) {
        setErrorMsg('Please enter your Transaction ID (at least 5 characters) from your receipt.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await submitProPaymentRequest({
          uid,
          userEmail: userEmail || undefined,
          userName: userName || undefined,
          planId: plan.id,
          method: selectedPkrMethod,
          transactionId: cleanTid,
          couponCode: appliedCoupon?.code || null,
        });

        setCompletedState({
          mode: 'pkr',
          planName: res.planName,
          durationDays: effectiveDurationDays,
          newExpiryLabel: expiryPreview.newExpiryLabel,
          wasExtension: expiryPreview.wasAlreadyActive,
          previousExpiryLabel: expiryPreview.previousExpiryLabel,
          pkrAmount: res.amountPkr,
          tid: res.tid,
          couponCode: appliedCoupon?.code || null,
        });

        onSuccess?.({
          mode: 'pkr',
          planId: plan.id,
        });
      } catch (err: any) {
        setErrorMsg(err?.message || 'Could not submit payment request. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const footerNode =
    !completedState && !isLocked ? (
      <button
        type="button"
        disabled={isSubmitDisabled}
        onClick={() => void handlePrimarySubmit()}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {submitting ? (
          <ButtonLineLoader label="Processing…" />
        ) : isFreeCouponActivation ? (
          <>
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Activate Pro Pass Free ({appliedCoupon?.code})</span>
          </>
        ) : paymentOption === 'kobans' ? (
          <>
            <Zap className="h-4 w-4 shrink-0" />
            <span>Pay with Kobans ({effectiveKobans.toLocaleString()} Kobans)</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Submit payment for verification</span>
          </>
        )}
      </button>
    ) : undefined;

  return (
    <SettingsSheet
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={plan.name}
      showCloseButton
      footer={footerNode}
    >
      {completedState ? (
        <div className="space-y-4 py-2 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
            }}
          >
            <CheckCircle2 className="h-7 w-7" />
          </div>

          {completedState.mode === 'kobans' ? (
            <div className="space-y-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Instant activation
              </span>
              <h3 className="text-[20px] font-semibold" style={{ color: 'var(--text)' }}>
                Pro activated until {completedState.newExpiryLabel}
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                {completedState.wasExtension && completedState.previousExpiryLabel
                  ? `Extended from ${completedState.previousExpiryLabel} to ${completedState.newExpiryLabel}.`
                  : `Your ${completedState.planName} (${completedState.durationDays} days) is now active.`}
              </p>

              <div
                className="mt-3 space-y-2 rounded-[24px] p-4 text-left text-[14px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Kobans spent</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                    -{(completedState.kobansSpent ?? 0).toLocaleString()} Kobans
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Remaining balance</span>
                  <span className="inline-flex items-center gap-1 font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    <KobanIcon size={14} decorative />
                    <span>{(completedState.balanceAfter ?? 0).toLocaleString()} Kobans</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ backgroundColor: 'var(--koban-bg)', color: 'var(--koban)' }}
              >
                <Clock className="h-3.5 w-3.5" />
                Verification queued
              </span>
              <h3 className="text-[20px] font-semibold" style={{ color: 'var(--text)' }}>
                Request received
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                We received your PKR {completedState.pkrAmount?.toLocaleString()} payment reference
                (TID: <strong style={{ color: 'var(--text)' }}>{completedState.tid}</strong>) for{' '}
                {completedState.planName}. Payments are verified manually and plans are activated
                within 24 hours.
              </p>
            </div>
          )}

          <div className="pt-2">
            {completedState.mode === 'kobans' ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartPracticing?.();
                }}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span>Start practicing</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[50px] w-full items-center justify-center rounded-full text-[15px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      ) : isLocked ? (
        <div className="py-1">
          <ProLockedStateCard planStatus={planStatus} compact />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Pass Switch (Monthly | Annual) */}
          <div
            role="tablist"
            aria-label="Choose pass duration"
            className="grid grid-cols-2 gap-1.5 rounded-full p-1.5"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
            }}
          >
            {(['pro_monthly', 'pro_annual'] as ProPlanId[]).map((pid) => {
              const p = PLANS[pid];
              const active = selectedPlanId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => void handleSelectPlan(pid)}
                  className="min-h-[44px] rounded-full px-3 text-[13px] font-semibold transition-colors cursor-pointer"
                  style={
                    active
                      ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                      : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                  }
                >
                  {pid === 'pro_annual'
                    ? `Annual (−${ANNUAL_SAVINGS_PERCENT}%) · PKR ${p.price_pkr.toLocaleString()}`
                    : `Monthly · PKR ${p.price_pkr}`}
                </button>
              );
            })}
          </div>

          {/* 2. Summary Card */}
          <div
            className="overflow-hidden rounded-[24px]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                Price and Koban equivalent
              </span>
              <span
                className="text-right text-[14px] font-semibold tabular-nums"
                style={{ color: 'var(--text)' }}
              >
                {appliedCoupon && effectivePkr < plan.price_pkr && (
                  <span
                    className="mr-1.5 text-[12px] font-normal line-through"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    PKR {plan.price_pkr.toLocaleString()}
                  </span>
                )}
                PKR {effectivePkr.toLocaleString()} ·{' '}
                <span style={{ color: 'var(--koban)' }}>
                  {effectiveKobans.toLocaleString()} Kobans
                </span>
              </span>
            </div>

            {appliedCoupon && (
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Tag className="h-3.5 w-3.5" />
                  Coupon ({appliedCoupon.code})
                </span>
                <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                  −{appliedCoupon.percentOff ?? appliedCoupon.discountPercent ?? 0}%
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                New expiry date
              </span>
              <span className="text-right text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                {expiryPreview.newExpiryLabel} ({effectiveDurationDays} days)
              </span>
            </div>
          </div>

          {/* 3. Coupon Pill Input + Apply */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label
                htmlFor="pro-coupon-input"
                className="text-[13px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Coupon code
              </label>
              {appliedCoupon && (
                <button
                  type="button"
                  onClick={handleClearCoupon}
                  disabled={submitting || couponLoading}
                  className="text-[13px] font-medium underline cursor-pointer"
                  style={{ color: 'var(--danger)' }}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pro-coupon-input"
                type="text"
                value={couponInput}
                disabled={Boolean(appliedCoupon) || couponLoading || submitting}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !appliedCoupon && !couponLoading) {
                    e.preventDefault();
                    void handleApplyCoupon();
                  }
                }}
                placeholder="Enter promo code"
                className="h-[48px] min-w-0 flex-1 rounded-full px-4 text-[14px] uppercase outline-none placeholder:text-[var(--placeholder)] disabled:opacity-65"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: `1px solid ${couponError ? 'var(--danger-border)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
              />
              {!appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={couponLoading || submitting || !couponInput.trim()}
                  className="h-[48px] shrink-0 rounded-full px-5 text-[14px] font-semibold cursor-pointer disabled:opacity-45"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {couponLoading ? 'Checking…' : 'Apply'}
                </button>
              ) : (
                <span
                  className="inline-flex h-[48px] shrink-0 items-center gap-1 rounded-full px-4 text-[13px] font-semibold"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
                >
                  <Check className="h-4 w-4" />
                  Applied
                </span>
              )}
            </div>
            {couponError && (
              <p className="px-2 text-[12px]" style={{ color: 'var(--danger)' }}>
                {couponError}
              </p>
            )}
          </div>

          {/* 4. Payment Method Radio Rows */}
          {!isFreeCouponActivation && (
            <div className="space-y-2.5">
              <div className="px-1 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Payment method
              </div>

              {/* Option A: Pay with Kobans (Instant) */}
              <div
                role="radio"
                aria-checked={paymentOption === 'kobans' && hasEnoughKobans}
                aria-disabled={!hasEnoughKobans}
                tabIndex={hasEnoughKobans ? 0 : -1}
                onClick={() => {
                  if (hasEnoughKobans && !submitting) {
                    setPaymentOption('kobans');
                    setErrorMsg(null);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && hasEnoughKobans && !submitting) {
                    e.preventDefault();
                    setPaymentOption('kobans');
                    setErrorMsg(null);
                  }
                }}
                className={`rounded-[24px] p-4 transition-colors ${
                  hasEnoughKobans ? 'cursor-pointer' : 'opacity-80'
                }`}
                style={{
                  backgroundColor: 'var(--bg)',
                  border:
                    paymentOption === 'kobans' && hasEnoughKobans
                      ? '1.5px solid var(--accent)'
                      : '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor:
                          paymentOption === 'kobans' && hasEnoughKobans
                            ? 'var(--accent)'
                            : 'var(--border)',
                        backgroundColor:
                          paymentOption === 'kobans' && hasEnoughKobans
                            ? 'var(--accent)'
                            : 'transparent',
                      }}
                    >
                      {paymentOption === 'kobans' && hasEnoughKobans && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                          Pay with Kobans
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
                        >
                          Instant
                        </span>
                      </div>

                      <div className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        Your balance:{' '}
                        {!isBalanceReady ? (
                          <span
                            className="inline-block h-3.5 w-14 align-middle animate-pulse rounded-full"
                            style={{ backgroundColor: 'var(--skeleton)' }}
                            aria-label="Loading Kobans balance"
                          />
                        ) : (
                          <strong style={{ color: 'var(--text)' }}>
                            {safeBalance.toLocaleString()} Kobans
                          </strong>
                        )}
                        {hasEnoughKobans && (
                          <span> · After: {balanceAfterKobans.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold tabular-nums"
                    style={{ color: 'var(--koban)' }}
                  >
                    <KobanIcon size={14} decorative />
                    {effectiveKobans.toLocaleString()}
                  </span>
                </div>

                {isBalanceReady && !hasEnoughKobans && (
                  <div
                    className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="text-[13px] font-medium" style={{ color: 'var(--koban)' }}>
                      You need {neededKobans.toLocaleString()} more Kobans
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGetKobans(Math.max(500, Math.ceil(neededKobans / 100) * 100));
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <KobanIcon size={13} decorative />
                      <span>Get Kobans</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Option B: Pay with JazzCash / Opay */}
              <div
                role="radio"
                aria-checked={paymentOption === 'pkr'}
                tabIndex={0}
                onClick={() => {
                  if (!submitting) {
                    setPaymentOption('pkr');
                    setErrorMsg(null);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !submitting) {
                    e.preventDefault();
                    setPaymentOption('pkr');
                    setErrorMsg(null);
                  }
                }}
                className="rounded-[24px] p-4 transition-colors cursor-pointer space-y-3.5"
                style={{
                  backgroundColor: 'var(--bg)',
                  border:
                    paymentOption === 'pkr'
                      ? '1.5px solid var(--accent)'
                      : '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor:
                          paymentOption === 'pkr' ? 'var(--accent)' : 'var(--border)',
                        backgroundColor:
                          paymentOption === 'pkr' ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      {paymentOption === 'pkr' && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                        Pay with {PAYMENT_METHODS_PAIR_LABEL}
                      </div>
                      <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        Manually verified within 24 hours
                      </p>
                    </div>
                  </div>

                  <span
                    className="shrink-0 text-[14px] font-semibold tabular-nums"
                    style={{ color: 'var(--text)' }}
                  >
                    PKR {effectivePkr.toLocaleString()}
                  </span>
                </div>

                {paymentOption === 'pkr' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-3 border-t pt-3.5 cursor-default"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Method switch */}
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS_LIST.map((m) => {
                        const active = selectedPkrMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPkrMethod(m.id)}
                            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold cursor-pointer"
                            style={
                              active
                                ? {
                                    backgroundColor: 'var(--card)',
                                    border: '1.5px solid var(--accent)',
                                    color: 'var(--text)',
                                  }
                                : {
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-muted)',
                                  }
                            }
                          >
                            <CreditCard className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                            <span>{m.displayName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Account Details with Copy buttons */}
                    <div
                      className="space-y-2.5 rounded-2xl p-3.5 text-[13px]"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--text-muted)' }}>Exact amount</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                          PKR {effectivePkr.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {activePkrConfig.displayName} account
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold select-all tabular-nums" style={{ color: 'var(--text)' }}>
                            {activePkrConfig.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(activePkrConfig.accountNumber, 'accountNumber')
                            }
                            className="inline-flex min-h-[30px] items-center gap-1 rounded-full px-2.5 text-[12px] font-medium cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg)',
                              border: '1px solid var(--border)',
                              color: copiedField === 'accountNumber' ? '#10b981' : 'var(--text)',
                            }}
                          >
                            {copiedField === 'accountNumber' ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--text-muted)' }}>Account title</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold select-all" style={{ color: 'var(--text)' }}>
                            {activePkrConfig.accountTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(activePkrConfig.accountTitle, 'accountTitle')
                            }
                            className="inline-flex min-h-[30px] items-center gap-1 rounded-full px-2.5 text-[12px] font-medium cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg)',
                              border: '1px solid var(--border)',
                              color: copiedField === 'accountTitle' ? '#10b981' : 'var(--text)',
                            }}
                          >
                            {copiedField === 'accountTitle' ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transaction ID pill input */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="pro-tid-input"
                        className="block pl-1 text-[13px] font-medium"
                        style={{ color: 'var(--text)' }}
                      >
                        Transaction ID (TID)
                      </label>
                      <input
                        id="pro-tid-input"
                        type="text"
                        value={tidInput}
                        onChange={(e) => {
                          setTidInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="e.g. 04291847291"
                        className="h-[48px] w-full rounded-full px-4 text-[14px] outline-none placeholder:text-[var(--placeholder)]"
                        style={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[13px]"
              style={{
                backgroundColor: 'var(--tag-danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* No-refund terms + underlined --accent links */}
          <p className="px-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {REFUND_POLICY_TEXT} By continuing you agree to our{' '}
            <Link
              to="/terms"
              onClick={onClose}
              className="underline"
              style={{ color: 'var(--accent)' }}
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              onClick={onClose}
              className="underline"
              style={{ color: 'var(--accent)' }}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      )}
    </SettingsSheet>
  );
}
