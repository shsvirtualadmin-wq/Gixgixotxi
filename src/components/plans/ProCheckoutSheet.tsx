import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Zap,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  CreditCard,
} from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
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
} from '@/services/proSubscriptionService';

export interface ProCheckoutSheetProps {
  open: boolean;
  onClose: () => void;
  initialPlanId?: ProPlanId;
  uid?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  kobanBalance: number;
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
 * Dedicated Boardly Pro Checkout Sheet (Bottom Sheet).
 */
export function ProCheckoutSheet({
  open,
  onClose,
  initialPlanId = 'pro_monthly',
  uid,
  userEmail,
  userName,
  kobanBalance,
  currentProExpiresAt,
  hasPendingProRequest = false,
  onOpenGetKobans,
  onSuccess,
  onStartPracticing,
}: ProCheckoutSheetProps) {
  const { isDark } = useTheme();
  const { isGuest } = useAuth();
  const isLight = !isDark;

  const [selectedPlanId, setSelectedPlanId] = useState<ProPlanId>(initialPlanId);
  const [paymentOption, setPaymentOption] = useState<'kobans' | 'pkr'>('kobans');
  const [selectedPkrMethod, setSelectedPkrMethod] = useState<PaymentMethodId>('jazzcash');
  const [tidInput, setTidInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `pro_chk_${Date.now()}`);

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
  } | null>(null);

  const kobanBalanceRef = useRef(kobanBalance);
  kobanBalanceRef.current = kobanBalance;

  // Reset state when sheet opens or initialPlanId changes
  useEffect(() => {
    if (open) {
      const resolvedPlan = getProPlanById(initialPlanId);
      setSelectedPlanId(resolvedPlan.id);
      setPaymentOption(kobanBalanceRef.current >= resolvedPlan.price_kobans ? 'kobans' : 'pkr');
      setTidInput('');
      setErrorMsg(null);
      setCompletedState(null);
      setIdempotencyKey(`pro_chk_${resolvedPlan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    }
  }, [open, initialPlanId]);

  // Update idempotencyKey when user switches plan inside the sheet
  const handleSelectPlan = (nextPlanId: ProPlanId) => {
    if (submitting) return;
    setSelectedPlanId(nextPlanId);
    setErrorMsg(null);
    setIdempotencyKey(`pro_chk_${nextPlanId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  };

  // Lock body scroll & hide floating bottom nav while ProCheckoutSheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.setAttribute('data-pro-checkout-open', 'true');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.removeAttribute('data-pro-checkout-open');
        document.body.style.overflow = prevOverflow;
      };
    } else {
      document.body.removeAttribute('data-pro-checkout-open');
    }
  }, [open]);

  const plan = useMemo(() => getProPlanById(selectedPlanId), [selectedPlanId]);
  const expiryPreview = useMemo(
    () => computeExtendedProExpiry(currentProExpiresAt, plan.duration_days),
    [currentProExpiresAt, plan.duration_days]
  );

  const safeBalance = Math.max(0, Math.floor(Number(kobanBalance) || 0));
  const hasEnoughKobans = safeBalance >= plan.price_kobans;
  const neededKobans = Math.max(0, plan.price_kobans - safeBalance);
  const balanceAfterKobans = Math.max(0, safeBalance - plan.price_kobans);

  const activePkrConfig = useMemo(
    () =>
      PAYMENT_METHODS_LIST.find((m) => m.id === selectedPkrMethod) ||
      PAYMENT_METHODS_LIST[0],
    [selectedPkrMethod]
  );

  if (!open) return null;

  if (isGuest) {
    return <GuestProBlockedView variant="sheet" onClose={onClose} />;
  }

  const surfaceBg = isLight ? '#FFFFFF' : '#0F0F14';
  const cardBg = isLight ? '#F7F7FA' : '#16161E';
  const elevatedBg = isLight ? '#EFEFF5' : '#1C1C26';
  const borderCol = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)';
  const textPrimary = isLight ? '#111118' : '#F5F5FA';
  const textMuted = isLight ? '#5A5A6E' : '#9CA3AF';

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handlePrimarySubmit = async () => {
    if (!uid) {
      setErrorMsg('Please sign in to activate Boardly Pro.');
      return;
    }

    setErrorMsg(null);

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
      // Pay with PKR (JazzCash / Opay)
      if (hasPendingProRequest) {
        setErrorMsg(
          'You already have a pending Pro pass request awaiting verification. We will verify it within 2 hours.'
        );
        return;
      }

      const cleanTid = tidInput.trim();
      if (cleanTid.length < 5) {
        setErrorMsg('Please enter your valid Transaction ID (TID) from your JazzCash / Opay receipt.');
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
        });

        setCompletedState({
          mode: 'pkr',
          planName: res.planName,
          durationDays: plan.duration_days,
          newExpiryLabel: expiryPreview.newExpiryLabel,
          wasExtension: expiryPreview.wasAlreadyActive,
          previousExpiryLabel: expiryPreview.previousExpiryLabel,
          pkrAmount: res.amountPkr,
          tid: res.tid,
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

  return (
    <div
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-checkout-title"
    >
      {/* 1. Backdrop Layer ONLY has blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      {/* 2. Solid Opaque Bottom Sheet / Modal Surface (NO backdrop-filter on sheet or children) */}
      <div
        style={{
          backgroundColor: surfaceBg,
          borderColor: borderCol,
          color: textPrimary,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        className="relative z-10 w-full sm:max-w-[500px] max-h-[92dvh] rounded-t-[28px] sm:rounded-[28px] border flex flex-col shadow-[0_-16px_48px_rgba(0,0,0,0.45)] overflow-hidden transition-transform duration-200 motion-reduce:transition-none"
      >
        {/* Drag Handle (Mobile) */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div
            style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.18)' }}
            className="w-10 h-1 rounded-full"
          />
        </div>

        {/* Sticky Header */}
        <div
          style={{ backgroundColor: surfaceBg, borderColor: borderCol }}
          className="px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#E8342A]/15 text-[#E8342A]">
                <Zap size={14} />
              </span>
              <h2
                id="pro-checkout-title"
                style={{ color: textPrimary }}
                className="font-heading font-bold text-base sm:text-lg truncate"
              >
                {plan.name}
              </h2>
            </div>
            <p style={{ color: textMuted }} className="text-xs mt-0.5">
              Unlock unlimited mock tests, AI derivations &amp; full analytics
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close Pro checkout"
            style={{
              backgroundColor: cardBg,
              borderColor: borderCol,
              color: textPrimary,
            }}
            className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-4 flex-1">
          {completedState ? (
            /* ─── SUCCESS STATE ─────────────────────────────────────────────────── */
            <div className="py-4 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={30} />
              </div>

              {completedState.mode === 'kobans' ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 font-mono text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Instant Activation</span>
                  </span>
                  <h3
                    style={{ color: textPrimary }}
                    className="font-heading font-extrabold text-xl sm:text-2xl"
                  >
                    Pro activated until {completedState.newExpiryLabel}
                  </h3>
                  <p style={{ color: textMuted }} className="text-xs sm:text-sm max-w-sm mx-auto">
                    {completedState.wasExtension && completedState.previousExpiryLabel
                      ? `Your Boardly Pro pass was extended from ${completedState.previousExpiryLabel} to ${completedState.newExpiryLabel}.`
                      : `Your ${completedState.planName} (${completedState.durationDays} days) is now active on your account.`}
                  </p>

                  <div
                    style={{ backgroundColor: cardBg, borderColor: borderCol }}
                    className="rounded-2xl border p-3.5 text-left space-y-2 max-w-sm mx-auto mt-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: textMuted }}>Kobans Spent</span>
                      <span className="font-mono font-bold text-[#E8342A]">
                        -{(completedState.kobansSpent ?? 0).toLocaleString()} Kobans
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: textMuted }}>Remaining Balance</span>
                      <span
                        style={{ color: textPrimary }}
                        className="font-mono font-bold inline-flex items-center gap-1"
                      >
                        <KobanIcon size={12} />
                        <span>{(completedState.balanceAfter ?? 0).toLocaleString()} Kobans</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 font-mono text-[11px] font-bold uppercase tracking-wider">
                    <Clock size={12} />
                    <span>Verification Queued</span>
                  </span>
                  <h3
                    style={{ color: textPrimary }}
                    className="font-heading font-extrabold text-xl sm:text-2xl"
                  >
                    Request received, we will verify within 2 hours
                  </h3>
                  <p style={{ color: textMuted }} className="text-xs sm:text-sm max-w-sm mx-auto">
                    We received your PKR {completedState.pkrAmount?.toLocaleString()} payment
                    reference (TID:{' '}
                    <strong style={{ color: textPrimary }} className="font-mono">
                      {completedState.tid}
                    </strong>
                    ) for {completedState.planName}. You will receive an email as soon as Pro is
                    activated.
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
                    style={{ backgroundColor: '#E8342A', color: '#FFFFFF' }}
                    className="w-full min-h-[48px] rounded-xl font-heading font-bold text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(232,52,42,0.3)] cursor-pointer"
                  >
                    <span className="text-[#FFFFFF]">Start practicing</span>
                    <ArrowRight size={16} className="text-[#FFFFFF]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ backgroundColor: '#E8342A', color: '#FFFFFF' }}
                    className="w-full min-h-[48px] rounded-xl font-heading font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-[#FFFFFF]">Done</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ─── CHECKOUT FORM ─────────────────────────────────────────────────── */
            <>
              {/* Plan Duration Switcher (Monthly 30d vs Annual 365d) */}
              <div
                style={{ backgroundColor: cardBg, borderColor: borderCol }}
                className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border"
              >
                {(['pro_monthly', 'pro_annual'] as ProPlanId[]).map((pid) => {
                  const p = PLANS[pid];
                  const active = selectedPlanId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handleSelectPlan(pid)}
                      style={{
                        backgroundColor: active ? surfaceBg : 'transparent',
                        borderColor: active ? '#E8342A' : 'transparent',
                        color: textPrimary,
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-1.5 ${
                        active ? 'shadow-sm' : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-xs truncate">
                          {pid === 'pro_annual' ? 'Annual Pass' : 'Monthly Pass'}
                        </div>
                        <div style={{ color: textMuted }} className="font-mono text-[10px]">
                          PKR {p.price_pkr.toLocaleString()} · {p.duration_days}d
                        </div>
                      </div>
                      {pid === 'pro_annual' && (
                        <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#E8342A]/15 text-[#E8342A] shrink-0">
                          -{ANNUAL_SAVINGS_PERCENT}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 1. Summary Card */}
              <div
                style={{ backgroundColor: cardBg, borderColor: borderCol }}
                className="rounded-2xl border p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span
                      style={{ color: textMuted }}
                      className="font-mono text-[10px] uppercase tracking-wider block"
                    >
                      Selected Pass
                    </span>
                    <span
                      style={{ color: textPrimary }}
                      className="font-heading font-bold text-sm sm:text-base"
                    >
                      {plan.name}
                    </span>
                  </div>
                  <span
                    style={{ backgroundColor: elevatedBg, borderColor: borderCol, color: textPrimary }}
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg border"
                  >
                    {plan.duration_days} days
                  </span>
                </div>

                <div
                  style={{ borderColor: borderCol }}
                  className="pt-2 border-t flex items-center justify-between gap-2 flex-wrap"
                >
                  <span style={{ color: textMuted }} className="text-xs">
                    Price &amp; Koban Equivalent
                  </span>
                  <span
                    style={{ color: textPrimary }}
                    className="font-mono text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <span>PKR {plan.price_pkr.toLocaleString()}</span>
                    <span style={{ color: textMuted }}>=</span>
                    <span className="inline-flex items-center gap-1 text-[#D97706] dark:text-[#FFD66B]">
                      <KobanIcon size={13} />
                      <span>{plan.price_kobans.toLocaleString()} Kobans</span>
                    </span>
                  </span>
                </div>

                <div
                  style={{ borderColor: borderCol }}
                  className="pt-2 border-t flex items-center justify-between gap-2 flex-wrap"
                >
                  <span style={{ color: textMuted }} className="text-xs">
                    {expiryPreview.wasAlreadyActive ? 'Pro Extension' : 'New Expiry Date'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-500">
                    {expiryPreview.wasAlreadyActive && expiryPreview.previousExpiryLabel
                      ? `Extends your Pro from ${expiryPreview.previousExpiryLabel} to ${expiryPreview.newExpiryLabel}`
                      : `Active until ${expiryPreview.newExpiryLabel}`}
                  </span>
                </div>
              </div>

              {/* 2. Two Selectable Payment Option Pill Cards */}
              <div className="space-y-2.5">
                <label
                  style={{ color: textMuted }}
                  className="block font-mono text-[10px] uppercase tracking-wider"
                >
                  Select Payment Method
                </label>

                {/* Option A: Pay with Kobans */}
                <div
                  onClick={() => {
                    if (hasEnoughKobans && !submitting) {
                      setPaymentOption('kobans');
                      setErrorMsg(null);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && hasEnoughKobans && !submitting) {
                      e.preventDefault();
                      setPaymentOption('kobans');
                      setErrorMsg(null);
                    }
                  }}
                  aria-disabled={!hasEnoughKobans}
                  style={{
                    backgroundColor: cardBg,
                    borderColor:
                      paymentOption === 'kobans' && hasEnoughKobans ? '#E8342A' : borderCol,
                  }}
                  className={`rounded-2xl border p-3.5 transition-all duration-150 ${
                    hasEnoughKobans
                      ? 'cursor-pointer'
                      : 'opacity-90 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        style={{
                          borderColor:
                            paymentOption === 'kobans' && hasEnoughKobans ? '#E8342A' : borderCol,
                          backgroundColor:
                            paymentOption === 'kobans' && hasEnoughKobans
                              ? '#E8342A'
                              : 'transparent',
                        }}
                        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                      >
                        {paymentOption === 'kobans' && hasEnoughKobans && (
                          <Check size={12} className="text-[#FFFFFF]" strokeWidth={3} />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{ color: textPrimary }}
                            className="font-heading font-bold text-sm"
                          >
                            Pay with Kobans
                          </span>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                            Instant
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span style={{ color: textMuted }}>
                            Your balance:{' '}
                            <strong style={{ color: textPrimary }} className="font-mono">
                              {safeBalance.toLocaleString()} Kobans
                            </strong>
                          </span>
                          {hasEnoughKobans && (
                            <span style={{ color: textMuted }}>
                              Balance after:{' '}
                              <strong className="font-mono text-emerald-500">
                                {balanceAfterKobans.toLocaleString()} Kobans
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{ color: textPrimary }}
                      className="font-mono text-xs font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <KobanIcon size={13} />
                      <span>{plan.price_kobans.toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Low balance state with "You need N more Kobans" + "Get Kobans" button */}
                  {!hasEnoughKobans && (
                    <div
                      style={{ backgroundColor: elevatedBg, borderColor: borderCol }}
                      className="mt-3 pt-2.5 px-3 pb-2.5 rounded-xl border flex items-center justify-between gap-2 flex-wrap"
                    >
                      <span className="text-xs font-medium text-amber-500">
                        You need <strong>{neededKobans.toLocaleString()}</strong> more Kobans
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGetKobans(Math.max(500, Math.ceil(neededKobans / 100) * 100));
                        }}
                        style={{ backgroundColor: '#E8342A', color: '#FFFFFF' }}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg font-heading font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <KobanIcon size={12} />
                        <span className="text-[#FFFFFF]">Get Kobans</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Option B: Pay with JazzCash / Opay (PKR) */}
                <div
                  onClick={() => {
                    if (!submitting) {
                      setPaymentOption('pkr');
                      setErrorMsg(null);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !submitting) {
                      e.preventDefault();
                      setPaymentOption('pkr');
                      setErrorMsg(null);
                    }
                  }}
                  style={{
                    backgroundColor: cardBg,
                    borderColor: paymentOption === 'pkr' ? '#E8342A' : borderCol,
                  }}
                  className="rounded-2xl border p-3.5 transition-all duration-150 cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        style={{
                          borderColor: paymentOption === 'pkr' ? '#E8342A' : borderCol,
                          backgroundColor: paymentOption === 'pkr' ? '#E8342A' : 'transparent',
                        }}
                        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                      >
                        {paymentOption === 'pkr' && (
                          <Check size={12} className="text-[#FFFFFF]" strokeWidth={3} />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{ color: textPrimary }}
                            className="font-heading font-bold text-sm"
                          >
                            Pay with {PAYMENT_METHODS_PAIR_LABEL} (PKR)
                          </span>
                        </div>
                        <p style={{ color: textMuted }} className="text-xs">
                          Send exact PKR amount &amp; submit Transaction ID (verified within 2h)
                        </p>
                      </div>
                    </div>

                    <span
                      style={{ color: textPrimary }}
                      className="font-mono text-xs font-bold shrink-0"
                    >
                      PKR {plan.price_pkr.toLocaleString()}
                    </span>
                  </div>

                  {/* Expanded PKR Account Details & TID Input when Option B is selected */}
                  {paymentOption === 'pkr' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderColor: borderCol }}
                      className="pt-3 border-t space-y-3 cursor-default"
                    >
                      {/* Method selector: JazzCash vs Opay */}
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS_LIST.map((m) => {
                          const isSelected = selectedPkrMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedPkrMethod(m.id)}
                              style={{
                                backgroundColor: isSelected ? surfaceBg : elevatedBg,
                                borderColor: isSelected ? '#E8342A' : borderCol,
                                color: textPrimary,
                              }}
                              className="min-h-[44px] px-3 py-2 rounded-xl border font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CreditCard size={13} className="text-[#E8342A]" />
                              <span>{m.displayName}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Account Number & Title with Copy Buttons */}
                      <div
                        style={{ backgroundColor: surfaceBg, borderColor: borderCol }}
                        className="rounded-xl border p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: textMuted }}>Send Exact Amount</span>
                          <span
                            style={{ color: textPrimary }}
                            className="font-mono font-bold text-sm text-[#E8342A]"
                          >
                            PKR {plan.price_pkr.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: textMuted }}>
                            {activePkrConfig.displayName} Account
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: textPrimary }}
                              className="font-mono font-bold select-all"
                            >
                              {activePkrConfig.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(activePkrConfig.accountNumber, 'accountNumber')
                              }
                              style={{ backgroundColor: elevatedBg, borderColor: borderCol }}
                              className="px-2 py-1 rounded-md border text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedField === 'accountNumber' ? (
                                <>
                                  <Check size={11} className="text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: textMuted }}>Account Title</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: textPrimary }}
                              className="font-mono font-bold select-all"
                            >
                              {activePkrConfig.accountTitle}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(activePkrConfig.accountTitle, 'accountTitle')
                              }
                              style={{ backgroundColor: elevatedBg, borderColor: borderCol }}
                              className="px-2 py-1 rounded-md border text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
                              title="Copy Account Title"
                            >
                              {copiedField === 'accountTitle' ? (
                                <>
                                  <Check size={11} className="text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Transaction ID (TID) Field */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="pro-tid-input"
                          style={{ color: textPrimary }}
                          className="block font-heading font-semibold text-xs"
                        >
                          Transaction ID (TID / Reference Number)
                        </label>
                        <input
                          id="pro-tid-input"
                          type="text"
                          value={tidInput}
                          onChange={(e) => setTidInput(e.target.value)}
                          placeholder="e.g. 04291847291"
                          style={{
                            backgroundColor: surfaceBg,
                            borderColor: borderCol,
                            color: textPrimary,
                          }}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border font-mono text-xs sm:text-sm focus:outline-none focus:border-[#E8342A]"
                        />
                        <p style={{ color: textMuted }} className="text-[11px] leading-relaxed">
                          Send PKR {plan.price_pkr.toLocaleString()} to our{' '}
                          {activePkrConfig.displayName} account ({activePkrConfig.accountNumber} ·{' '}
                          {activePkrConfig.accountTitle}), then paste the SMS/app Transaction ID
                          above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/35 p-3 flex items-start gap-2.5 text-xs text-red-500">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Terms Line: REFUND_POLICY_TEXT + Terms & Privacy links */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]" style={{ color: textMuted }}>
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  <span>{REFUND_POLICY_TEXT}</span>
                </div>
                <p className="text-[11px] pl-5" style={{ color: textMuted }}>
                  By completing your purchase, you agree to our{' '}
                  <Link
                    to="/terms"
                    onClick={onClose}
                    className="underline hover:text-[#E8342A]"
                    style={{ color: textPrimary }}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    onClick={onClose}
                    className="underline hover:text-[#E8342A]"
                    style={{ color: textPrimary }}
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer CTA (only shown before completion) */}
        {!completedState && (
          <div
            style={{ backgroundColor: surfaceBg, borderColor: borderCol }}
            className="px-5 py-3.5 border-t shrink-0"
          >
            <button
              type="button"
              disabled={
                submitting ||
                (paymentOption === 'kobans' && !hasEnoughKobans) ||
                (paymentOption === 'pkr' && hasPendingProRequest)
              }
              onClick={handlePrimarySubmit}
              style={{
                backgroundColor: '#E8342A',
                color: '#FFFFFF',
              }}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl font-heading font-bold text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(232,52,42,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {submitting ? (
                <ButtonLineLoader label="Processing..." />
              ) : paymentOption === 'kobans' ? (
                <>
                  <Zap size={16} className="text-[#FFFFFF] shrink-0" />
                  <span className="text-[#FFFFFF]">
                    Pay with Kobans ({plan.price_kobans.toLocaleString()} Kobans)
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-[#FFFFFF] shrink-0" />
                  <span className="text-[#FFFFFF]">Submit payment for verification</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
