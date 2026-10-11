import React, { useState } from 'react';
import { Check, X, Sparkles, HelpCircle, ArrowRight, ShieldCheck, Zap, BookOpen, Layers } from 'lucide-react';
import {
  PRICING_DURATIONS,
  PRICING_PLANS,
  calculatePlanPricing,
  PricingDuration,
  PlanKey,
  MANUAL_PAYMENT_CONFIG,
} from '../../config/pricing';
import {
  BillingDuration,
  COMPARISON_FEATURES,
  PRICING_FAQS,
} from '../../data/marketingPricingData';

interface PricingPageProps {
  onSelectPlan: (planId: string, duration: BillingDuration) => void;
  onNavigateContact?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  onNavigateContact,
}) => {
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<number>(2); // 6 Months (Best Value) default
  const [openFaqId, setOpenFaqId] = useState<string | null>('plan-fit');
  const activeDuration: PricingDuration = PRICING_DURATIONS[selectedDurationIndex] || PRICING_DURATIONS[0];

  const durationIdMapping: Record<number, BillingDuration> = {
    0: 'monthly',
    1: 'quarterly',
    2: 'six_months',
    3: 'yearly',
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const scrollToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('comparison-table-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Flexible Plans for Academic Success</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A1330] font-poppins tracking-tight">
          Choose Your Path to <span className="text-[#1a6dff]">Success</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Flexible plans designed to fit your preparation journey. Start with what works for you and upgrade anytime.
        </p>
      </div>

      {/* Pill Toggle: Monthly | 3 Months | 6 Months (badge "Best Value") | 12 Months */}
      <div className="flex justify-center mb-12 overflow-visible pt-4">
        <div className="inline-flex p-1.5 rounded-full bg-slate-200/70 border border-slate-300/60 shadow-inner max-w-full overflow-visible relative gap-1">
          {PRICING_DURATIONS.map((dur, idx) => {
            const isActive = selectedDurationIndex === idx;
            return (
              <button
                key={dur.months}
                type="button"
                onClick={() => setSelectedDurationIndex(idx)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-[#1a6dff] text-white shadow-md shadow-[#1a6dff]/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{dur.label}</span>
                {dur.badge && (
                  <span
                    className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#0d1b3e] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap border border-white/20 pointer-events-none"
                    style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    {dur.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Pricing Cards: Free, Pro, Premium (Derived from PRICING_PLANS single source of truth) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-14">
        {/* FREE CARD */}
        {(() => {
          const plan = PRICING_PLANS.free;
          return (
            <div className="relative flex flex-col justify-between rounded-[24px] p-6 sm:p-8 transition-all duration-300 bg-white border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:border-slate-300">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    Free Forever
                  </span>
                </div>

                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  {plan.tagline}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px] mb-6">
                  Essential daily diagnostic testing and core conceptual revision at zero cost.
                </p>

                {/* Price Block */}
                <div className="pb-6 mb-6 border-b border-slate-100 min-h-[88px] flex flex-col justify-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">PKR</span>
                    <span className="text-4xl sm:text-5xl font-black font-poppins text-[#0A1330]">
                      0
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 mt-2 block">
                    Free forever · No credit card required
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => onSelectPlan('free', durationIdMapping[selectedDurationIndex])}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mb-8 text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:scale-[0.98]"
                >
                  <span>Start for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    What's included:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      {feat.included ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                      <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through decoration-slate-300'}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* PRO CARD */}
        {(() => {
          const plan = PRICING_PLANS.pro;
          const pricing = calculatePlanPricing(plan.basePrice, activeDuration);
          return (
            <div className="relative flex flex-col justify-between rounded-[24px] p-6 sm:p-8 transition-all duration-300 bg-white border-2 border-[#1a6dff] shadow-2xl shadow-[#1a6dff]/15 ring-4 ring-[#1a6dff]/10 scale-100 md:scale-[1.03]">
              {/* Highlight Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1a6dff] shadow-md whitespace-nowrap">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                    High Yield
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#1a6dff] uppercase tracking-wide mb-2">
                  {plan.tagline}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px] mb-6">
                  Full chapter unlocks, extended Boardy AI queries, and full diagnostic analytics.
                </p>

                {/* Price Block */}
                <div className="pb-6 mb-6 border-b border-slate-100 min-h-[88px] flex flex-col justify-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">PKR</span>
                    <span className="text-4xl sm:text-5xl font-black font-poppins text-[#0A1330] tabular-nums">
                      {pricing.effectiveMonth.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">per month</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {pricing.discountPct > 0 ? (
                      <>
                        <span className="text-slate-400 line-through tabular-nums font-semibold">
                          PKR {pricing.originalTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Save {pricing.discountPct}%
                        </span>
                      </>
                    ) : null}
                    <span className="text-slate-500 font-medium">
                      PKR {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => onSelectPlan('pro', durationIdMapping[selectedDurationIndex])}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mb-8 text-white bg-[#1a6dff] hover:bg-[#1558d6] shadow-md shadow-[#1a6dff]/30 active:scale-[0.98]"
                >
                  <span>Get Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    What's included:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      {feat.included ? (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-[#1a6dff] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                      <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through decoration-slate-300'}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* PREMIUM CARD */}
        {(() => {
          const plan = PRICING_PLANS.premium;
          const pricing = calculatePlanPricing(plan.basePrice, activeDuration);
          return (
            <div className="relative flex flex-col justify-between rounded-[24px] p-6 sm:p-8 transition-all duration-300 bg-white border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:border-slate-300">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                    Maximum Edge
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  {plan.tagline}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px] mb-6">
                  Unlimited tests, national entrance mocks, past paper vaults, and 24/7 priority support.
                </p>

                {/* Price Block */}
                <div className="pb-6 mb-6 border-b border-slate-100 min-h-[88px] flex flex-col justify-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">PKR</span>
                    <span className="text-4xl sm:text-5xl font-black font-poppins text-[#0A1330] tabular-nums">
                      {pricing.effectiveMonth.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">per month</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {pricing.discountPct > 0 ? (
                      <>
                        <span className="text-slate-400 line-through tabular-nums font-semibold">
                          PKR {pricing.originalTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Save {pricing.discountPct}%
                        </span>
                      </>
                    ) : null}
                    <span className="text-slate-500 font-medium">
                      PKR {pricing.total.toLocaleString()} billed for {activeDuration.months} {activeDuration.months === 1 ? 'month' : 'months'}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => onSelectPlan('premium', durationIdMapping[selectedDurationIndex])}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mb-8 text-white bg-[#0d1b3e] hover:bg-[#152a5c] shadow-md active:scale-[0.98]"
                >
                  <span>Get Premium</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    What's included:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-[#1a6dff] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="text-slate-700 font-medium">
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Manual Local Payments Section (JazzCash & Easypaisa) */}
      <section className="mb-16 p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-200/80 shadow-xl shadow-amber-500/5">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                <span>🇵🇰 Manual Local Payments</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                JazzCash & Easypaisa Instant Transfers
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              Active Pakistani Gateway
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Students and parents in Pakistan can transfer subscription fees directly to our official mobile wallets without requiring international credit cards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JazzCash Card */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                  JazzCash
                </span>
                <span className="text-[11px] font-bold text-slate-400">Mobile Wallet</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Account / Mobile Number:</p>
                <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">+923058969050</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Account Title:</span>
                <span className="font-extrabold text-slate-900">haseena bibi</span>
              </div>
            </div>

            {/* Easypaisa Card */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Easypaisa
                </span>
                <span className="text-[11px] font-bold text-slate-400">Mobile Wallet</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Account / Mobile Number:</p>
                <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">+923335292094</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Account Title:</span>
                <span className="font-extrabold text-slate-900">Sadia Fatima</span>
              </div>
            </div>
          </div>

          {/* Verification note & support contact */}
          <div className="p-4 rounded-2xl bg-white/90 border border-amber-200 text-xs sm:text-sm text-slate-800 space-y-2">
            <p className="font-semibold text-amber-950">
              📌 <strong>How to activate your plan manually:</strong>
            </p>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Please WhatsApp or email a screenshot of your transaction receipt to support to manually activate your Pro/Premium plan within 2 to 4 hours. Include your registered account email address in the message.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 font-bold text-xs sm:text-sm">
              <a
                href="https://wa.me/923058969050?text=Hello%20Boardly%20Support,%20I%20have%20transferred%20the%20fee%20for%20my%20plan."
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2 flex items-center gap-1.5"
              >
                <span>💬 WhatsApp Support: +923058969050</span>
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="mailto:support@boardly.cfd?subject=Manual%20Payment%20Screenshot"
                className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1.5"
              >
                <span>✉️ Email Support: support@boardly.cfd</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Link to Comparison Section */}
      <div className="text-center mb-16">
        <a
          href="#comparison-table-section"
          onClick={scrollToComparison}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 cursor-pointer"
        >
          <span>Not sure which plan fits your syllabus?</span>
          <span>Compare full feature matrix below ↓</span>
        </a>
      </div>

      {/* Full Comparison Table Section */}
      <section id="comparison-table-section" className="scroll-mt-28 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1330] font-poppins">
            Free vs Pro vs Premium
          </h2>
          <p className="text-sm text-slate-600">
            A granular comparison of every test engine capability, question limit, and Boardy chat quota.
          </p>
        </div>

        {/* Desktop Comparison Table (Hidden on small mobile) */}
        <div className="hidden md:block overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-4 px-6 text-sm font-bold text-slate-900 w-2/5">Features & Limits</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-700 w-1/5 text-center">Free</th>
                <th className="py-4 px-6 text-sm font-bold text-indigo-700 bg-indigo-50/60 w-1/5 text-center border-x border-indigo-100">
                  Pro (Most Popular)
                </th>
                <th className="py-4 px-6 text-sm font-bold text-teal-800 w-1/5 text-center">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {COMPARISON_FEATURES.map((row, idx) => {
                // Category divider if first of category or index 0
                const isFirstOfCategory =
                  idx === 0 || COMPARISON_FEATURES[idx - 1].category !== row.category;

                return (
                  <React.Fragment key={idx}>
                    {isFirstOfCategory && (
                      <tr className="bg-slate-100/60 font-semibold text-xs tracking-wider text-slate-500 uppercase">
                        <td colSpan={4} className="py-2.5 px-6">
                          {row.category}
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-6 text-center text-slate-600">
                        {typeof row.freeValue === 'boolean' ? (
                          row.freeValue ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.freeValue}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center text-indigo-900 font-medium bg-indigo-50/30 border-x border-indigo-100">
                        {typeof row.proValue === 'boolean' ? (
                          row.proValue ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.proValue}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center text-slate-900 font-semibold">
                        {typeof row.premiumValue === 'boolean' ? (
                          row.premiumValue ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.premiumValue}</span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (One per feature with Free/Pro/Premium values side by side) */}
        <div className="block md:hidden space-y-4">
          {COMPARISON_FEATURES.map((row, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {row.category}
                </span>
                {row.highlight && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Key Feature
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900">{row.name}</h4>

              {/* Side-by-side values */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                {/* Free */}
                <div className="p-2.5 rounded-xl bg-slate-50 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">Free</span>
                  {typeof row.freeValue === 'boolean' ? (
                    row.freeValue ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )
                  ) : (
                    <span className="text-slate-700 font-medium">{row.freeValue}</span>
                  )}
                </div>

                {/* Pro */}
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-600 mb-1">Pro</span>
                  {typeof row.proValue === 'boolean' ? (
                    row.proValue ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )
                  ) : (
                    <span className="text-indigo-900 font-semibold">{row.proValue}</span>
                  )}
                </div>

                {/* Premium */}
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-teal-700 mb-1">Premium</span>
                  {typeof row.premiumValue === 'boolean' ? (
                    row.premiumValue ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )
                  ) : (
                    <span className="text-teal-950 font-bold">{row.premiumValue}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Guaranteed Update Note */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/70 text-center text-xs sm:text-sm font-medium text-indigo-900 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>All plans include regular question bank updates as FBISE and provincial curricula evolve.</span>
        </div>
      </section>

      {/* FAQ Accordion Section (+ / x icons) */}
      <section className="mb-14">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1330] font-poppins">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about plans, billing methods in Pakistan, and renewals.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3.5">
          {PRICING_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-[20px] transition-all duration-200 border bg-white ${
                  isOpen
                    ? 'border-indigo-300/80 shadow-md shadow-indigo-900/5'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-[20px]"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-[#0A1330]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-indigo-600 text-white rotate-45'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {/* + / x toggle icon: plus rotates into x */}
                    <span className="text-lg font-semibold leading-none">+</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Help prompt */}
        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-slate-500">
            Need a custom school bundle or have billing queries?{' '}
            <button
              onClick={onNavigateContact}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Contact our academic advisory team
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};
