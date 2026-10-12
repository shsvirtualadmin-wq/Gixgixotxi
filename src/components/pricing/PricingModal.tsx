import React, { useState, useRef, useEffect } from 'react';
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
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromBlocked?: boolean;
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
  fromBlocked = false,
  currentPlan = 'free',
  initialTargetPlan = 'pro',
  onSubmitUpgradeRequest,
}) => {
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<number>(2); // Default to 6 Months (index 2, Best Value)
  const [checkoutTarget, setCheckoutTarget] = useState<'pro' | 'premium' | null>(null);
  const paidPlansRef = useRef<HTMLDivElement>(null);

  // Focus state for checkout inputs
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fromBlocked && paidPlansRef.current) {
      setTimeout(() => {
        paidPlansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [isOpen, fromBlocked]);

  // Lock body scroll behind modal only while modal is open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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
      } else {
        // Fallback default network call
        const res = await fetch('/api/upgrade-requests/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: checkoutTarget,
            durationMonths: activeDuration.months,
            amount: pricing.total,
            paymentMethod,
            transactionId: transactionId.trim(),
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to submit manual upgrade request.');
        }
      }
      setIsSubmittedSuccess(true);
    } catch (err) {
      console.error('Upgrade request failed:', err);
      // Still show success view with WhatsApp fallback guidance
      setIsSubmittedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGlassInputStyle = (fieldName: string): React.CSSProperties => {
    const isFocused = focusedField === fieldName;
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: isFocused ? '1px solid #1a6dff' : '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '14px',
      color: '#ffffff',
      boxShadow: isFocused ? '0 0 14px rgba(26, 109, 255, 0.4)' : 'none',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-start justify-center p-4 transition-all"
      style={{
        height: '100dvh',
        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: 'rgba(13, 27, 62, 0.88)',
      }}
      onClick={onClose}
    >
      {/* Blurred background gradient orbs (blue #1a6dff and purple/teal) so blur is visible */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div
          className="absolute -top-16 -left-16 w-96 h-96 rounded-full blur-[100px] opacity-70 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1a6dff 0%, rgba(26,109,255,0) 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-20 -translate-y-1/2 w-96 h-96 rounded-full blur-[90px] opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, rgba(139,92,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-96 h-96 rounded-full blur-[90px] opacity-50 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14b8a6 0%, rgba(20,184,166,0) 70%)' }}
        />
      </div>

      {/* Modal Card - height: auto, margin: auto 0 for perfect mobile vertical alignment and bidirectional scrolling */}
      <div
        className="relative w-full max-w-5xl text-white transition-all shadow-2xl"
        style={{
          margin: 'auto 0',
          height: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top ambient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1a6dff] via-[#8b5cf6] to-[#14b8a6]" />

        {/* Top Header Bar with Close Button (Non-sticky to avoid scroll trap) */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a6dff]/20 border border-[#1a6dff]/40 flex items-center justify-center text-white shadow-sm">
              <Zap className="w-4 h-4 text-[#14b8a6]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">Boardly</span>
              <span className="text-[11px] font-semibold ml-1.5 hidden sm:inline" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Academic Upgrade Center
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
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
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
            {/* Friendly banner when opened from a blocked state */}
            {fromBlocked && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs"
                style={{
                  backgroundColor: 'rgba(245, 185, 66, 0.15)',
                  border: '1px solid rgba(245, 185, 66, 0.4)',
                  color: '#ffffff',
                }}
              >
                <AlertCircle className="w-5 h-5 text-[#f5b942] shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-white">You've reached your daily limit for today.</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Upgrade to get more tests and chats.
                  </p>
                </div>
              </div>
            )}

            {/* 1. CURRENT PLAN SUMMARY STRIP AT TOP */}
            <div
              className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                    userPlanKey === 'premium'
                      ? 'bg-[#f5b942]/20 text-[#f5b942] border border-[#f5b942]/40'
                      : userPlanKey === 'pro'
                      ? 'bg-[#1a6dff]/20 text-[#1a6dff] border border-[#1a6dff]/40'
                      : 'bg-white/10 text-white border border-white/15'
                  }`}
                >
                  {userPlanKey === 'premium' ? (
                    <Crown className="w-5 h-5 text-[#f5b942]" />
                  ) : userPlanKey === 'pro' ? (
                    <Zap className="w-5 h-5 text-[#1a6dff]" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-white/80" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Your Current Plan
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {userPlanKey === 'premium'
                      ? 'Maximum Edge (Premium)'
                      : userPlanKey === 'pro'
                      ? 'Pro Plan'
                      : 'Free Starter'}
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                <p className="font-semibold text-white">
                  {userPlanKey === 'premium'
                    ? 'Unlimited practice tests & unlimited Boardy AI chats'
                    : userPlanKey === 'pro'
                    ? '10 daily chapter tests · 50 Boardy AI questions'
                    : '2 daily chapter tests · 10 Boardy AI questions'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {userPlanKey === 'free'
                    ? 'Free tier · Refills daily at midnight PKT'
                    : 'Active Subscription · Refills daily at midnight PKT'}
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                Choose Your Path to <span className="text-[#1a6dff]">Success</span>
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed font-normal" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Flexible plans designed to fit your preparation journey. Start with what works for you and upgrade anytime.
              </p>
            </div>

            {/* Pill Tabs: Monthly | 3 Months | 6 Months (Best Value) | 12 Months */}
            <div className="flex justify-center pt-2 overflow-visible">
              <div
                className="inline-flex p-1.5 rounded-full shadow-lg gap-1 relative"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                {PRICING_DURATIONS.map((dur, index) => {
                  const isActive = selectedDurationIndex === index;
                  return (
                    <button
                      key={dur.months}
                      type="button"
                      onClick={() => setSelectedDurationIndex(index)}
                      className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none ${
                        isActive
                          ? 'bg-[#1a6dff] text-white shadow-md shadow-[#1a6dff]/40'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {/* Floating Dark "Best Value" Gold Badge above 6 Months */}
                      {dur.badge && (
                        <span
                          className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#f5b942] text-[#0d1b3e] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap z-10 pointer-events-none"
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
            <div ref={paidPlansRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch scroll-mt-6">
              {/* ---------------- CARD 1: FREE ---------------- */}
              {(() => {
                const isCurrentPlan = userPlanKey === 'free';
                return (
                  <div
                    className="order-2 md:order-1 flex flex-col justify-between p-6 sm:p-7 rounded-[24px] transition-all relative"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Starter Access
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-white font-sans">
                            Rs 0
                          </span>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>free forever</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Basic daily foundation practice</p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-white/10 space-y-3 text-sm">
                        {PRICING_PLANS.free.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {feat.included ? (
                              <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                            )}
                            <span className={feat.included ? 'text-white font-medium' : 'text-white/40 line-through'}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10">
                      <button
                        type="button"
                        disabled={isCurrentPlan}
                        onClick={onClose}
                        className={`w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold transition-all flex items-center justify-center ${
                          isCurrentPlan
                            ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                            : 'border border-white/20 hover:border-white/40 text-white bg-white/10 hover:bg-white/15 cursor-pointer shadow-md'
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
                  <div
                    className="order-1 md:order-2 flex flex-col justify-between p-6 sm:p-7 rounded-[24px] transition-all relative"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                      border: '1px solid #1a6dff',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 24px rgba(26, 109, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {/* Floating "Most Popular" Pill */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1a6dff] to-[#14b8a6] text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a6dff]">
                          Pro Plan
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white font-sans tabular-nums transition-all">
                            Rs {pricing.effectiveMonth.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>per month</span>
                        </div>

                        {/* Struck-through total + Green Save Badge */}
                        <div className="flex items-center gap-2 text-xs">
                          {pricing.discountPct > 0 && (
                            <>
                              <span className="line-through tabular-nums font-semibold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Rs {pricing.originalTotal.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Save {pricing.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs font-medium tabular-nums" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Rs {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-white/10 space-y-3 text-sm">
                        {PRICING_PLANS.pro.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {feat.included ? (
                              <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                            )}
                            <span className={feat.included ? 'text-white font-medium' : 'text-white/40 line-through'}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10">
                      {isCurrentPlan ? (
                        <div className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold text-center bg-white/5 text-white/40 border border-white/10 flex items-center justify-center select-none">
                          Current Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout('pro')}
                          className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(26,109,255,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center justify-center cursor-pointer active:scale-[0.98]"
                        >
                          Get Pro
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ---------------- CARD 3: PREMIUM (Gold Badge) ---------------- */}
              {(() => {
                const isCurrentPlan = userPlanKey === 'premium';
                const pricing = calculatePlanPricing(PRICING_PLANS.premium.basePrice, activeDuration);

                return (
                  <div
                    className="order-3 flex flex-col justify-between p-6 sm:p-7 rounded-[24px] transition-all relative"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f5b942] text-[#0d1b3e] text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                      PREMIUM EDGE
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#f5b942]">
                          Maximum Edge
                        </span>
                        {isCurrentPlan && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Pricing block */}
                      <div className="min-h-[88px] flex flex-col justify-end space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white font-sans tabular-nums transition-all">
                            Rs {pricing.effectiveMonth.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>per month</span>
                        </div>

                        {/* Struck-through total + Green Save Badge */}
                        <div className="flex items-center gap-2 text-xs">
                          {pricing.discountPct > 0 && (
                            <>
                              <span className="line-through tabular-nums font-semibold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Rs {pricing.originalTotal.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Save {pricing.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs font-medium tabular-nums" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Rs {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-white/10 space-y-3 text-sm">
                        {PRICING_PLANS.premium.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                            <span className="text-white font-medium">
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10">
                      {isCurrentPlan ? (
                        <div className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold text-center bg-white/5 text-white/40 border border-white/10 flex items-center justify-center select-none">
                          Current Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout('premium')}
                          className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] bg-white/10 hover:bg-white/15 border border-[#f5b942]/40 hover:border-[#f5b942] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-[0.98]"
                        >
                          Get Premium
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 3. CHECKOUT FORM                                          */
          /* ========================================================= */
          <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
            {/* Back Button & Checkout Title */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={handleBackToPlans}
                className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Plan</span>
              </button>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#14b8a6] bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                Checkout & Manual Verification
              </span>
            </div>

            {isSubmittedSuccess ? (
              /* Success State */
              <div
                className="py-12 px-6 text-center space-y-4 rounded-[24px] shadow-sm animate-in fade-in"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                }}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-white">
                    Request received. We'll activate your plan soon.
                  </h3>
                  <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Our team manually checks JazzCash and Easypaisa transaction IDs against our bank records. Your account limits will be upgraded once confirmed.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="https://wa.me/923058969050"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Submit proof via WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-[14px] bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer border border-white/15"
                  >
                    Done & Return to App
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <div className="space-y-6">
                {/* 1. Summary Box */}
                {(() => {
                  const targetConfig = PRICING_PLANS[checkoutTarget];
                  const pricing = calculatePlanPricing(targetConfig.basePrice, activeDuration);

                  return (
                    <div
                      className="p-5 rounded-[20px] text-white space-y-3"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#14b8a6] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                          {targetConfig.name} Plan
                        </span>
                        <span>Duration: <strong>{activeDuration.label} ({activeDuration.months} Months)</strong></span>
                      </div>

                      <div className="pt-2 pb-1 border-t border-white/10 flex items-baseline justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Exact Amount to Send
                          </div>
                          <div className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white">
                            Rs {pricing.total.toLocaleString()}
                          </div>
                        </div>

                        {pricing.discountPct > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                              You Save Rs {pricing.savingsAmount.toLocaleString()}
                            </span>
                            <div className="text-[11px] line-through mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              Standard: Rs {pricing.originalTotal.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. MANUAL LOCAL PAYMENTS SECTION */}
                <div
                  className="p-5 rounded-[20px] space-y-3"
                  style={{
                    backgroundColor: 'rgba(245, 185, 66, 0.1)',
                    border: '1px solid rgba(245, 185, 66, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f5b942] animate-pulse" />
                      <h5 className="font-black text-xs text-[#f5b942] uppercase tracking-wider">
                        Manual Local Payments
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-[#f5b942] bg-[#f5b942]/20 px-2 py-0.5 rounded-full border border-[#f5b942]/30">
                      Pakistan Instant Transfer
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Send your subscription payment directly to either mobile wallet below:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* JazzCash Card */}
                    <div
                      className="p-3.5 rounded-[16px] space-y-1"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-rose-400 uppercase tracking-wide">
                          {MANUAL_PAYMENT_CONFIG.jazzcash.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber, 'jazzcash')}
                          className="text-[10px] font-bold text-white/80 hover:text-white cursor-pointer bg-white/10 px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1"
                        >
                          {copiedKey === 'jazzcash' ? (
                            <span className="text-emerald-400">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-sans font-bold text-xs text-white">
                        {MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Account Title: <strong className="text-white">{MANUAL_PAYMENT_CONFIG.jazzcash.accountTitle}</strong>
                      </p>
                    </div>

                    {/* Easypaisa Card */}
                    <div
                      className="p-3.5 rounded-[16px] space-y-1"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-emerald-400 uppercase tracking-wide">
                          {MANUAL_PAYMENT_CONFIG.easypaisa.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber, 'easypaisa')}
                          className="text-[10px] font-bold text-white/80 hover:text-white cursor-pointer bg-white/10 px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1"
                        >
                          {copiedKey === 'easypaisa' ? (
                            <span className="text-emerald-400">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-sans font-bold text-xs text-white">
                        {MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Account Title: <strong className="text-white">{MANUAL_PAYMENT_CONFIG.easypaisa.accountTitle}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="p-3 rounded-[14px] bg-white/5 border border-white/10 text-[11px] leading-relaxed space-y-1.5">
                    <p className="font-medium text-white/80">
                      <em>Important Note:</em> Please submit your proof via WhatsApp to our official number:
                    </p>
                    <div className="flex flex-wrap items-center gap-3 font-bold text-[11px] pt-0.5">
                      <a
                        href="https://wa.me/923058969050"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>💬 WhatsApp: +92 305 8969050</span>
                      </a>
                      <span className="text-white/20">|</span>
                      <a
                        href={`mailto:${MANUAL_PAYMENT_CONFIG.support.supportEmail}?subject=Subscription%20Payment%20Receipt`}
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>✉️ Email: {MANUAL_PAYMENT_CONFIG.support.supportEmail}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-white mb-1.5">
                      Select Transfer Account Used
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      onFocus={() => setFocusedField('paymentMethod')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                      style={getGlassInputStyle('paymentMethod')}
                    >
                      <option value="jazzcash" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                        JazzCash: {MANUAL_PAYMENT_CONFIG.jazzcash.accountNumber} (Title: {MANUAL_PAYMENT_CONFIG.jazzcash.accountTitle})
                      </option>
                      <option value="easypaisa" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                        Easypaisa: {MANUAL_PAYMENT_CONFIG.easypaisa.accountNumber} (Title: {MANUAL_PAYMENT_CONFIG.easypaisa.accountTitle})
                      </option>
                      <option value="bank_transfer" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>Direct Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-white mb-1.5">
                      Transaction ID / Reference Number (TID) *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      onFocus={() => setFocusedField('transactionId')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. TID 1234567890 or JazzCash Ref"
                      className="w-full px-3.5 py-2.5 font-sans font-medium text-xs text-white placeholder-white/40 outline-none"
                      style={getGlassInputStyle('transactionId')}
                      required
                    />
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Enter the SMS transaction ID received from JazzCash or Easypaisa.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleBackToPlans}
                      className="px-4 py-2.5 rounded-[14px] text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!transactionId.trim() || isSubmitting}
                      className="min-h-[48px] h-12 px-6 py-2.5 rounded-[14px] bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white font-bold text-xs shadow-[0_0_20px_rgba(26,109,255,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
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
