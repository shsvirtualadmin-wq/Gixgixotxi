import React, { useState } from 'react';
import {
  PRICING_DURATIONS,
  PRICING_PLANS,
  calculatePlanPricing,
  normalizePlan,
  PlanKey,
  PricingDuration,
  MANUAL_PAYMENT_CONFIG,
} from '../../config/pricing';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Copy,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string | null;
  initialTargetPlan?: 'pro' | 'premium';
  onSubmitUpgradeRequest?: (data: {
    plan: 'pro' | 'premium';
    durationMonths: number;
    amount: number;
    paymentMethod: 'bank_transfer' | 'jazzcash' | 'easypaisa';
    transactionId: string;
  }) => Promise<void>;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'free',
  initialTargetPlan = 'pro',
  onSubmitUpgradeRequest,
}) => {
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<number>(2); // Default to 6 Months (index 2, Best Value)
  const [checkoutTarget, setCheckoutTarget] = useState<'pro' | 'premium' | null>(null);

  // Checkout Form State
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypaisa' | 'bank_transfer'>('jazzcash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeDuration: PricingDuration = PRICING_DURATIONS[selectedDurationIndex] || PRICING_DURATIONS[0];
  const userPlanKey: PlanKey = normalizePlan(currentPlan);

  const handleCopyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleOpenCheckout = (planId: 'pro' | 'premium') => {
    setCheckoutTarget(planId);
    setIsSubmittedSuccess(false);
    setTransactionId('');
  };

  const handleBackToPlans = () => {
    setCheckoutTarget(null);
    setIsSubmittedSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget || !transactionId.trim()) return;

    const planConfig = PRICING_PLANS[checkoutTarget];
    const pricing = calculatePlanPricing(planConfig.basePrice, activeDuration);

    setIsSubmitting(true);
    try {
      if (onSubmitUpgradeRequest) {
        await onSubmitUpgradeRequest({
          plan: checkoutTarget,
          durationMonths: activeDuration.months,
          amount: pricing.total,
          paymentMethod,
          transactionId: transactionId.trim(),
        });
      }
      setIsSubmittedSuccess(true);
    } catch (err) {
      console.error('Failed to submit upgrade request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-[#0d1b3e]/70 backdrop-blur-md transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-50 sm:rounded-3xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:my-8 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0d1b3e] flex items-center justify-center text-white shadow-sm">
              <Zap className="w-4 h-4 text-[#1a6dff]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#0d1b3e] tracking-tight">Boardly</span>
              <span className="text-[11px] font-semibold text-slate-500 ml-1.5 hidden sm:inline">
                Academic Upgrade Center
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT SWITCHER: Either Pricing Screen OR Checkout Sheet */}
        {!checkoutTarget ? (
          /* ========================================================= */
          /* 1. PRICING SCREEN                                         */
          /* ========================================================= */
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto space-y-2.5 pt-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0d1b3e] tracking-tight font-sans">
                Choose Your Path to <span className="text-[#1a6dff]">Success</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Flexible plans designed to fit your preparation journey. Start with what works for you and upgrade anytime.
              </p>
            </div>

            {/* Pill Tabs: Monthly | 3 Months | 6 Months (Best Value) | 12 Months */}
            {/* Wrapper has top padding of at least 14px and no overflow clipping */}
            <div className="flex justify-center pt-4 overflow-visible">
              <div className="inline-flex p-1.5 rounded-full bg-slate-200/80 border border-slate-300/80 shadow-inner max-w-full overflow-visible gap-1 relative">
                {PRICING_DURATIONS.map((dur, index) => {
                  const isActive = selectedDurationIndex === index;
                  return (
                    <button
                      key={dur.months}
                      type="button"
                      onClick={() => setSelectedDurationIndex(index)}
                      className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none ${
                        isActive
                          ? 'bg-[#1a6dff] text-white shadow-md shadow-[#1a6dff]/30'
                          : 'text-slate-600 hover:text-[#0d1b3e] hover:bg-white/60'
                      }`}
                    >
                      {/* Floating Dark "Best Value" Badge above 6 Months - exactly positioned to avoid any clipping */}
                      {dur.badge && (
                        <span
                          className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#0d1b3e] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap z-10 border border-white/20 pointer-events-none"
                          style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)' }}
                        >
                          {dur.badge}
                        </span>
                      )}
                      <span>{dur.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Pricing Cards: Stacked on mobile (~380px wide) with Pro displayed first on mobile, 3 across on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* ---------------- CARD 1: FREE ---------------- */}
              {(() => {
                const isCurrentPlan = userPlanKey === 'free';
                return (
                  <div className="order-2 md:order-1 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                          Starter Access
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block with fixed height to prevent layout shift */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-4xl font-extrabold text-[#0d1b3e] font-sans">
                            Rs 0
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">free forever</p>
                        <p className="text-[11px] text-slate-400">Basic daily foundation practice</p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-slate-100 space-y-3 text-sm">
                        {PRICING_PLANS.free.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {feat.included ? (
                              <Check className="w-4 h-4 text-[#1a6dff] shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isCurrentPlan}
                        onClick={onClose}
                        className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                          isCurrentPlan
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'border-2 border-[#1a6dff] text-[#1a6dff] hover:bg-blue-50 cursor-pointer shadow-xs'
                        }`}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Start for Free'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ---------------- CARD 2: PRO (order-1 on mobile so Pro is displayed first) ---------------- */}
              {(() => {
                const isCurrentPlan = userPlanKey === 'pro';
                const pricing = calculatePlanPricing(PRICING_PLANS.pro.basePrice, activeDuration);

                return (
                  <div className="order-1 md:order-2 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border-2 border-[#1a6dff] ring-4 ring-[#1a6dff]/10 shadow-xl shadow-[#1a6dff]/10 transition-all relative">
                    {/* Floating "Most Popular" Pill */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1a6dff] text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a6dff]">
                          Pro Plan
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block with smooth number animation container */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl sm:text-4xl font-extrabold text-[#0d1b3e] font-sans tabular-nums transition-all">
                            Rs {pricing.effectiveMonth.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-500">per month</span>
                        </div>

                        {/* Struck-through total + Green Save Badge */}
                        <div className="flex items-center gap-2 text-xs">
                          {pricing.discountPct > 0 && (
                            <>
                              <span className="text-slate-400 line-through tabular-nums font-semibold">
                                Rs {pricing.originalTotal.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Save {pricing.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-500 tabular-nums">
                          Rs {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-slate-100 space-y-3 text-sm">
                        {PRICING_PLANS.pro.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {feat.included ? (
                              <Check className="w-4 h-4 text-[#1a6dff] shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isCurrentPlan}
                        onClick={() => handleOpenCheckout('pro')}
                        className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                          isCurrentPlan
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-[#1a6dff] hover:bg-[#1558d6] text-white cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Get Pro'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ---------------- CARD 3: PREMIUM ---------------- */}
              {(() => {
                const isCurrentPlan = userPlanKey === 'premium';
                const pricing = calculatePlanPricing(PRICING_PLANS.premium.basePrice, activeDuration);

                return (
                  <div className="order-3 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600">
                          Maximum Edge
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block with smooth number animation container */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl sm:text-4xl font-extrabold text-[#0d1b3e] font-sans tabular-nums transition-all">
                            Rs {pricing.effectiveMonth.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-500">per month</span>
                        </div>

                        {/* Struck-through total + Green Save Badge */}
                        <div className="flex items-center gap-2 text-xs">
                          {pricing.discountPct > 0 && (
                            <>
                              <span className="text-slate-400 line-through tabular-nums font-semibold">
                                Rs {pricing.originalTotal.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Save {pricing.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-500 tabular-nums">
                          Rs {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-slate-100 space-y-3 text-sm">
                        {PRICING_PLANS.premium.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-[#1a6dff] shrink-0 mt-0.5" />
                            <span className="text-slate-700 font-medium">
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isCurrentPlan}
                        onClick={() => handleOpenCheckout('premium')}
                        className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                          isCurrentPlan
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-[#0d1b3e] hover:bg-[#152a5c] text-white cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Get Premium'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 3. CHECKOUT (Bottom Sheet on Mobile, Modal on Desktop)     */
          /* ========================================================= */
          <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
            {/* Back Button & Checkout Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                type="button"
                onClick={handleBackToPlans}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0d1b3e] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Plan</span>
              </button>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1a6dff] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Checkout & Manual Verification
              </span>
            </div>

            {isSubmittedSuccess ? (
              /* Success State */
              <div className="py-12 px-6 text-center space-y-4 bg-white rounded-3xl border border-emerald-200 shadow-sm animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-[#0d1b3e]">
                    Request received. We'll activate your plan soon.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Our team manually checks JazzCash and Easypaisa transaction IDs against our bank records. Your account limits will be upgraded once confirmed.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`${MANUAL_PAYMENT_CONFIG.support.whatsappLink}&text=Hello%20Boardly%20Support,%20I%20have%20submitted%20TID%20${encodeURIComponent(transactionId)}%20for%20my%20${checkoutTarget.toUpperCase()}%20subscription.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Send Screenshot on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Done & Return to App
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <div className="space-y-6">
                {/* 1. Summary Box: Plan, Duration, and EXACT Amount to Send */}
                {(() => {
                  const targetConfig = PRICING_PLANS[checkoutTarget];
                  const pricing = calculatePlanPricing(targetConfig.basePrice, activeDuration);

                  return (
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0d1b3e] to-[#1a6dff] text-white shadow-xl space-y-3">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#1a6dff] bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                          {targetConfig.name} Plan
                        </span>
                        <span>Duration: <strong>{activeDuration.label} ({activeDuration.months} Months)</strong></span>
                      </div>

                      <div className="pt-2 pb-1 border-t border-white/10 flex items-baseline justify-between">
                        <div>
                          <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                            Exact Amount to Send
                          </div>
                          <div className="text-3xl sm:text-4xl font-black font-sans tracking-tight">
                            Rs {pricing.total.toLocaleString()}
                          </div>
                        </div>

                        {pricing.discountPct > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                              You Save Rs {pricing.savingsAmount.toLocaleString()}
                            </span>
                            <div className="text-[11px] text-white/60 line-through mt-0.5">
                              Standard: Rs {pricing.originalTotal.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. MANUAL LOCAL PAYMENTS SECTION (Unchanged in logic) */}
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <h5 className="font-black text-xs text-amber-950 uppercase tracking-wider">
                        Manual Local Payments
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      Pakistan Instant Transfer
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    Send your subscription payment directly to either mobile wallet below:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* JazzCash Card */}
                    <div className="p-3 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-rose-600 uppercase tracking-wide">
                          {MANUAL_PAYMENT_CONFIG.jazzcash.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber, 'jazzcash')}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#1a6dff] cursor-pointer bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                        >
                          {copiedKey === 'jazzcash' ? (
                            <span className="text-emerald-600">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono font-bold text-xs text-slate-900">
                        {MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Account Title: <strong className="text-slate-800">{MANUAL_PAYMENT_CONFIG.jazzcash.accountTitle}</strong>
                      </p>
                    </div>

                    {/* Easypaisa Card */}
                    <div className="p-3 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-emerald-600 uppercase tracking-wide">
                          {MANUAL_PAYMENT_CONFIG.easypaisa.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber, 'easypaisa')}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#1a6dff] cursor-pointer bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                        >
                          {copiedKey === 'easypaisa' ? (
                            <span className="text-emerald-600">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono font-bold text-xs text-slate-900">
                        {MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Account Title: <strong className="text-slate-800">{MANUAL_PAYMENT_CONFIG.easypaisa.accountTitle}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Important instruction note */}
                  <div className="p-3 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1.5">
                    <p className="font-medium">
                      <em>Important Note:</em> After sending your payment, please WhatsApp or email a screenshot of your transaction receipt to support to manually activate your Pro/Premium plan:
                    </p>
                    <div className="flex flex-wrap items-center gap-3 font-bold text-[11px] pt-0.5">
                      <a
                        href={MANUAL_PAYMENT_CONFIG.support.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>💬 WhatsApp: {MANUAL_PAYMENT_CONFIG.support.whatsappNumber}</span>
                      </a>
                      <span className="text-slate-300">|</span>
                      <a
                        href={`mailto:${MANUAL_PAYMENT_CONFIG.support.supportEmail}?subject=Subscription%20Payment%20Receipt`}
                        className="text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <span>✉️ Email: {MANUAL_PAYMENT_CONFIG.support.supportEmail}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Select Transfer Account Used
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                    >
                      <option value="jazzcash">
                        JazzCash: {MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber} (Title: {MANUAL_PAYMENT_CONFIG.jazzcash.accountTitle})
                      </option>
                      <option value="easypaisa">
                        Easypaisa: {MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber} (Title: {MANUAL_PAYMENT_CONFIG.easypaisa.accountTitle})
                      </option>
                      <option value="bank_transfer">Direct Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Transaction ID / Reference Number (TID)
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. TID 1234567890 or JazzCash Ref"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enter the SMS transaction ID received from JazzCash or Easypaisa.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleBackToPlans}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!transactionId.trim() || isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#1a6dff] hover:bg-[#1558d6] text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Upgrade Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
