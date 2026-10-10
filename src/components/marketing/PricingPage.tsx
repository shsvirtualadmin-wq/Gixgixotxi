import React, { useState } from 'react';
import { Check, X, Sparkles, HelpCircle, ArrowRight, ShieldCheck, Zap, BookOpen, Layers } from 'lucide-react';
import {
  BillingDuration,
  BILLING_DURATIONS,
  MARKETING_PLANS,
  COMPARISON_FEATURES,
  PRICING_FAQS,
  PlanTier,
} from '../../data/marketingPricingData';

interface PricingPageProps {
  onSelectPlan: (planId: string, duration: BillingDuration) => void;
  onNavigateContact?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  onNavigateContact,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<BillingDuration>('eight_months');
  const [openFaqId, setOpenFaqId] = useState<string | null>('plan-fit');

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
          <span>Boardy, your 24/7 study buddy.</span>
        </div>

        {/* Reworded Heading: Pick the plan that fits your prep */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A1330] font-poppins tracking-tight">
          Pick the plan that fits your prep
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From self-paced daily drills to high-stakes entrance test simulations, choose the exact depth of practice and Boardy guidance you need.
        </p>
      </div>

      {/* Pill Toggle: Monthly | 3 Months | 8 Months (badge "Best Value") | 12 Months */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1.5 rounded-full bg-slate-200/70 border border-slate-300/60 shadow-inner max-w-full overflow-x-auto">
          {BILLING_DURATIONS.map((dur) => {
            const isActive = selectedDuration === dur.id;
            return (
              <button
                key={dur.id}
                onClick={() => setSelectedDuration(dur.id)}
                className={`relative px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-white text-[#0A1330] shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{dur.label}</span>
                {dur.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dur.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Pricing Cards: Free, Pro, Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-14">
        {MARKETING_PLANS.map((plan) => {
          const pricingInfo = plan.pricing[selectedDuration];
          const isHighlighted = plan.highlighted;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-[24px] p-6 sm:p-8 transition-all duration-300 bg-white ${
                isHighlighted
                  ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-600/10 ring-4 ring-indigo-500/10 scale-100 md:scale-[1.03]'
                  : 'border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:border-slate-300'
              }`}
            >
              {/* Highlight Badge */}
              {isHighlighted && plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
                  {plan.badge}
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
                    {plan.name}
                  </h3>
                  {plan.id === 'premium' && (
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
                      Top Rank
                    </span>
                  )}
                  {plan.id === 'free' && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Standard
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  {plan.tagline}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px] mb-6">
                  {plan.description}
                </p>

                {/* Price Block */}
                <div className="pb-6 mb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">PKR</span>
                    <span className="text-4xl sm:text-5xl font-black font-poppins text-[#0A1330]">
                      {pricingInfo.pricePkr.toLocaleString()}
                    </span>
                    {pricingInfo.originalPricePkr && (
                      <span className="text-base text-slate-400 line-through">
                        PKR {pricingInfo.originalPricePkr.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-slate-500">
                      {plan.priceNote || pricingInfo.billingPeriodLabel}
                    </span>
                    {pricingInfo.savingsTag && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {pricingInfo.savingsTag}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id, selectedDuration)}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mb-8 ${
                    isHighlighted
                      ? 'text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn hover:scale-[1.02] active:scale-[0.98]'
                      : plan.id === 'premium'
                      ? 'text-white bg-gradient-to-r from-slate-900 to-indigo-950 hover:bg-slate-800 shadow-md hover:scale-[1.02] active:scale-[0.98]'
                      : 'text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:scale-[0.98]'
                  }`}
                >
                  <span>{pricingInfo.buttonLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Checklist (Green check for included, Grey X for excluded) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    What's included:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-slate-700 font-medium'
                            : 'text-slate-400 line-through decoration-slate-300'
                        }
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
