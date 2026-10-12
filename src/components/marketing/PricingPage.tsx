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
      {/* 1. Header & Duration Toggle (Light) */}
      <Section variant="light" className="pt-8 sm:pt-12">
        <SectionHeader
          eyebrow="TRANSPARENT PRICING"
          title="Invest in Your Preparation,"
          highlight="Not Heavy Academy Fees"
          description="Traditional academies charge upwards of PKR 60,000 for standard coaching. Boardly provides authentic diagnostic testing at a fraction of the cost."
        />

        {/* Duration Segmented Control */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm gap-1">
            {PRICING_DURATIONS.map((dur, idx) => {
              const isActive = selectedDurationIndex === idx;
              return (
                <button
                  key={dur.months}
                  type="button"
                  onClick={() => setSelectedDurationIndex(idx)}
                  className={`relative px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{dur.label}</span>
                  {dur.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-mono font-bold px-2 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                      {dur.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
          {/* FREE PLAN */}
          <ScrollReveal delayMs={0}>
            <div className="h-full p-6 sm:p-7 rounded-[24px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                  Basic Access
                </div>
                <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1">
                  {PRICING_PLANS.free.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {PRICING_PLANS.free.tagline}
                </p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black font-display text-slate-900 dark:text-white">PKR 0</span>
                  <span className="text-xs text-slate-500 ml-2">Forever free</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {PRICING_PLANS.free.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => onSelectPlan('free', currentDurationKey)}
                >
                  Start Free Practice
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* PRO PLAN (Popular) */}
          <ScrollReveal delayMs={60}>
            <div className="h-full p-6 sm:p-7 rounded-[24px] bg-gradient-to-b from-indigo-900/90 to-slate-900/95 text-white border-2 border-indigo-500/50 shadow-2xl shadow-indigo-600/15 flex flex-col justify-between text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 text-white font-mono text-[10px] font-bold uppercase tracking-widest shadow-md">
                MOST POPULAR
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-indigo-300 tracking-wider">
                  Complete Exam Prep
                </div>
                <h3 className="text-2xl font-black font-display text-white mt-1">
                  {PRICING_PLANS.pro.name}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
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
                        <span className="text-xs text-indigo-300 ml-2">/ {activeDuration.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  {PRICING_PLANS.pro.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => onSelectPlan('pro', currentDurationKey)}
                >
                  Unlock Pro Access
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* PREMIUM PLAN */}
          <ScrollReveal delayMs={120}>
            <div className="h-full p-6 sm:p-7 rounded-[24px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
              <div>
                <div className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400 tracking-wider">
                  Full Suite
                </div>
                <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1">
                  {PRICING_PLANS.premium.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {PRICING_PLANS.premium.tagline}
                </p>
                <div className="mt-6 mb-6">
                  {(() => {
                    const price = calculatePlanPricing(PRICING_PLANS.premium.basePrice, activeDuration);
                    return (
                      <div>
                        <span className="text-4xl font-black font-display text-slate-900 dark:text-white">
                          PKR {price.total.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">/ {activeDuration.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {PRICING_PLANS.premium.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => onSelectPlan('premium', currentDurationKey)}
                >
                  Get Premium
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Section>

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
