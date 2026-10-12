import React, { useState } from 'react';
import { Check, X, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import {
  PRICING_DURATIONS,
  PRICING_PLANS,
  calculatePlanPricing,
  PricingDuration,
  PlanKey,
} from '../../config/pricing';
import {
  BillingDuration,
  COMPARISON_FEATURES,
  PRICING_FAQS,
} from '../../data/marketingPricingData';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { Button } from './design-system/Button';
import { WordReveal } from './design-system/WordReveal';
import { FaqAccordion } from './design-system/FaqAccordion';
import { CtaSection } from './design-system/CtaSection';
import { ScrollReveal } from './design-system/useScrollReveal';

interface PricingPageProps {
  onSelectPlan: (planId: string, duration: BillingDuration) => void;
  onNavigateContact?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  onNavigateContact,
}) => {
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<number>(2); // 6 Months (Best Value) default
  const activeDuration: PricingDuration = PRICING_DURATIONS[selectedDurationIndex] || PRICING_DURATIONS[0];

  const durationIdMapping: Record<number, BillingDuration> = {
    0: 'monthly',
    1: 'quarterly',
    2: 'six_months',
    3: 'yearly',
  };

  const currentDurationKey = durationIdMapping[selectedDurationIndex] || 'six_months';

  return (
    <div className="w-full pt-20">
      {/* 1. Header & Duration Toggle & Pricing Cards (Boardly Navy #0d1b3e Base + Glass UI) */}
      <section className="relative w-full py-12 sm:py-20 bg-[#0d1b3e] text-white overflow-visible">
        {/* Soft blurred gradient orbs behind the glass (blue #1a6dff and purple/teal) so blur is visible */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute top-12 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full blur-[100px] opacity-60 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #1a6dff 0%, rgba(26,109,255,0) 70%)' }}
          />
          <div
            className="absolute top-1/3 right-1/4 translate-x-1/4 w-96 h-96 rounded-full blur-[90px] opacity-50 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, rgba(139,92,246,0) 70%)' }}
          />
          <div
            className="absolute bottom-12 left-1/3 w-80 h-80 rounded-full blur-[90px] opacity-45 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #14b8a6 0%, rgba(20,184,166,0) 70%)' }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeader
            eyebrow="TRANSPARENT PRICING"
            title="Invest in Your Preparation,"
            highlight="Not Heavy Academy Fees"
            description="Traditional academies charge upwards of PKR 60,000 for standard coaching. Boardly provides authentic diagnostic testing at a fraction of the cost."
            dark={true}
          />

          {/* Duration Segmented Control - Glass Pills */}
          <div className="flex justify-center mb-12">
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
              {PRICING_DURATIONS.map((dur, idx) => {
                const isActive = selectedDurationIndex === idx;
                return (
                  <button
                    key={dur.months}
                    type="button"
                    onClick={() => setSelectedDurationIndex(idx)}
                    className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#1a6dff] text-white shadow-md shadow-[#1a6dff]/40'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{dur.label}</span>
                    {dur.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f5b942] text-[#0d1b3e] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {dur.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Pricing Cards - Stacked 1 Column on Mobile, 3 on Desktop, Scrollable in both directions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {/* 1. FREE PLAN */}
            <ScrollReveal delayMs={0}>
              <div
                className="h-full p-6 sm:p-7 flex flex-col justify-between text-left transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                }}
              >
                <div>
                  <div
                    className="text-[13px] font-semibold tracking-normal"
                    style={{ color: 'rgba(255, 255, 255, 0.65)' }}
                  >
                    Basic access
                  </div>
                  <h3 className="text-2xl font-black font-display text-white mt-1">
                    {PRICING_PLANS.free.name}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {PRICING_PLANS.free.tagline}
                  </p>
                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-black font-display text-white">PKR 0</span>
                    <span className="text-xs ml-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Forever free
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-white">
                    {PRICING_PLANS.free.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => onSelectPlan('free', currentDurationKey)}
                    className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center cursor-pointer"
                  >
                    Start Free Practice
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* 2. PRO PLAN (Most Popular) */}
            <ScrollReveal delayMs={60}>
              <div
                className="h-full p-6 sm:p-7 flex flex-col justify-between text-left relative transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid #1a6dff',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 24px rgba(26, 109, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#1a6dff] to-[#14b8a6] text-white text-[12px] font-semibold tracking-normal shadow-md">
                  Most popular
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#38bdf8] tracking-normal">
                    Complete exam prep
                  </div>
                  <h3 className="text-2xl font-black font-display text-white mt-1">
                    {PRICING_PLANS.pro.name}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {PRICING_PLANS.pro.tagline}
                  </p>
                  <div className="mt-6 mb-6">
                    {(() => {
                      const price = calculatePlanPricing(PRICING_PLANS.pro.basePrice, activeDuration);
                      return (
                        <div>
                          <span className="text-4xl font-black font-display text-white">
                            PKR {price.total.toLocaleString()}
                          </span>
                          <span className="text-xs ml-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            / {activeDuration.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-white">
                    {PRICING_PLANS.pro.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => onSelectPlan('pro', currentDurationKey)}
                    className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(26,109,255,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Unlock Pro Access
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* 3. PREMIUM PLAN (Gold Badge) */}
            <ScrollReveal delayMs={120}>
              <div
                className="h-full p-6 sm:p-7 flex flex-col justify-between text-left relative transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#f5b942] text-[#0d1b3e] text-[12px] font-semibold tracking-normal shadow-md">
                  Premium edge
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#fcd34d] tracking-normal">
                    Full suite
                  </div>
                  <h3 className="text-2xl font-black font-display text-white mt-1">
                    {PRICING_PLANS.premium.name}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {PRICING_PLANS.premium.tagline}
                  </p>
                  <div className="mt-6 mb-6">
                    {(() => {
                      const price = calculatePlanPricing(PRICING_PLANS.premium.basePrice, activeDuration);
                      return (
                        <div>
                          <span className="text-4xl font-black font-display text-white">
                            PKR {price.total.toLocaleString()}
                          </span>
                          <span className="text-xs ml-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            / {activeDuration.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-white">
                    {PRICING_PLANS.premium.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => onSelectPlan('premium', currentDurationKey)}
                    className="w-full min-h-[48px] h-12 py-3 px-4 rounded-[14px] bg-white/10 hover:bg-white/15 border border-[#f5b942]/40 hover:border-[#f5b942] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center cursor-pointer"
                  >
                    Get Premium
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 2. Word Reveal (Dark) */}
      <Section variant="dark">
        <WordReveal statement="One affordable season of diagnostic testing unlocks entry to your dream university program." />
      </Section>

      {/* 3. Detailed Comparison Matrix (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="FEATURE BREAKDOWN"
          title="Compare Plans"
          highlight="In Detail"
          description="A granular comparison of question limits, analytics, mock exams, and tutor support."
        />

        <div className="max-w-4xl mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-700">
                <tr>
                  <th className="py-4 px-4 sm:px-6 font-bold">Feature</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-600">Free</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-indigo-600 bg-indigo-50/40">Pro</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-600">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-sans">
                {COMPARISON_FEATURES.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">
                      {feat.name}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-slate-600">
                      {typeof feat.freeValue === 'boolean' ? (
                        feat.freeValue ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-300" />
                      ) : (
                        feat.freeValue
                      )}
                    </td>
                    <td className="py-3 px-4 sm:px-6 font-bold text-indigo-700 bg-indigo-50/20">
                      {typeof feat.proValue === 'boolean' ? (
                        feat.proValue ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-300" />
                      ) : (
                        feat.proValue
                      )}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-slate-700">
                      {typeof feat.premiumValue === 'boolean' ? (
                        feat.premiumValue ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-300" />
                      ) : (
                        feat.premiumValue
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 4. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="COMMONLY ASKED"
          title="Pricing & Membership"
          highlight="Frequently Asked Questions"
        />

        <FaqAccordion
          items={PRICING_FAQS.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))}
        />
      </Section>

      {/* 5. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="PLANS"
          eyebrow="READY TO LEVEL UP?"
          title="Start Practicing for Your Exam"
          highlight="Today"
          description="Free access is ready immediately. Upgrade to Pro whenever you want full archive access."
          primaryButtonText="Create Free Account"
          secondaryButtonText="Contact Support"
          onPrimaryClick={() => onSelectPlan('free', 'six_months')}
          onSecondaryClick={onNavigateContact}
        />
      </Section>
    </div>
  );
};
