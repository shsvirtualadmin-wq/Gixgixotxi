import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  PRICING_DURATIONS,
  PRICING_PLANS,
  calculatePlanPricing,
  PricingDuration,
} from '../../config/pricing';
import {
  BillingDuration,
  COMPARISON_FEATURES,
  PRICING_FAQS,
} from '../../data/marketingPricingData';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { WordReveal } from './design-system/WordReveal';
import { FaqAccordion } from './design-system/FaqAccordion';
import { ScrollReveal } from './design-system/useScrollReveal';
import { FinalCTA } from './FinalCTA';

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
      {/* 1. Header & Duration Toggle & Pricing Cards */}
      <section
        className="relative w-full py-16 sm:py-24 bg-[#0d1b3e] text-white"
        style={{ overflow: 'clip' }}
      >
        {/* Soft background glow orbs: 2 soft circular orbs, blur(80px), opacity 0.25-0.35 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-8 left-1/4 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
            style={{
              backgroundColor: '#1a6dff',
              filter: 'blur(80px)',
              opacity: 0.3,
            }}
          />
          <div
            className="absolute bottom-12 right-1/4 translate-x-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{
              backgroundColor: '#7c3aed',
              filter: 'blur(80px)',
              opacity: 0.28,
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <SectionHeader
            eyebrow="Transparent pricing"
            title="Invest in Your Preparation,"
            highlight="Not Heavy Academy Fees"
            description="Traditional academies charge upwards of PKR 60,000 for standard coaching. Boardly provides authentic diagnostic testing at a fraction of the cost."
            dark={true}
          />

          {/* Toggle container wrapper: 24px top margin so "Best value" badge has room without overlapping */}
          <div className="mt-6 mb-12 flex flex-col items-center">
            {/* Toggle container: width 100% (max 360px), height 48px, radius 999px, background rgba(255,255,255,0.06), 1px border, padding 4px */}
            <div className="relative w-full max-w-[360px] pt-7">
              {/* "Best value" small gold pill centered ABOVE the "6 Months" segment (index 2) with 6px gap */}
              <div
                className="absolute top-0 left-[62.5%] -translate-x-1/2 z-20 pointer-events-none"
                style={{
                  marginBottom: '6px',
                }}
              >
                <span className="inline-block bg-[#f5b942] text-[#0d1b3e] text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  Best value
                </span>
              </div>

              <div
                className="w-full h-12 rounded-full p-1 flex items-center shadow-lg relative"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '9999px',
                }}
              >
                {PRICING_DURATIONS.map((dur, idx) => {
                  const isActive = selectedDurationIndex === idx;
                  return (
                    <button
                      key={dur.months}
                      type="button"
                      onClick={() => setSelectedDurationIndex(idx)}
                      className="flex-1 h-full rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center whitespace-nowrap overflow-hidden select-none"
                      style={{
                        backgroundColor: isActive ? '#1a6dff' : 'transparent',
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '9999px',
                      }}
                    >
                      {dur.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 Pricing Cards: uniform rgba(255,255,255,0.05), 1px border, blur(16px), radius 28px, padding 24px, gap 20px. Stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch max-w-5xl mx-auto">
            {/* 1. FREE PLAN */}
            <ScrollReveal delayMs={0}>
              <div
                className="h-full flex flex-col justify-between text-left transition-all relative"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '28px',
                  padding: '24px',
                }}
              >
                <div>
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: 'rgba(255, 255, 255, 0.65)' }}
                  >
                    Basic access
                  </div>
                  <h3 className="text-[24px] font-bold font-editorial text-white mt-1">
                    {PRICING_PLANS.free.name}
                  </h3>
                  <p
                    className="text-[14px] mt-2 leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {PRICING_PLANS.free.tagline}
                  </p>
                  <div className="mt-6 mb-6 flex items-baseline">
                    <span className="text-[40px] font-bold text-white leading-none">PKR 0</span>
                    <span
                      className="text-[14px] font-medium ml-2"
                      style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                    >
                      Forever free
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {PRICING_PLANS.free.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[15px]"
                        style={{ color: 'rgba(255, 255, 255, 0.88)' }}
                      >
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  {/* Starter button: transparent with border, pill 52px tall, overflow-hidden */}
                  <button
                    type="button"
                    onClick={() => onSelectPlan('free', currentDurationKey)}
                    className="w-full h-[52px] min-h-[52px] rounded-full overflow-hidden bg-transparent hover:bg-white/10 text-white font-semibold text-base transition-colors flex items-center justify-center cursor-pointer"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '9999px',
                    }}
                  >
                    Start Free Practice
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* 2. PRO PLAN (Most Popular) */}
            <ScrollReveal delayMs={60}>
              <div
                className="h-full flex flex-col justify-between text-left relative transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(110, 168, 255, 0.5)',
                  boxShadow: '0 0 40px rgba(26, 109, 255, 0.25)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '28px',
                  padding: '24px',
                }}
              >
                {/* Centered on top edge, 12px, no overlap with plan name */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#1a6dff] to-[#14b8a6] text-white text-[12px] font-semibold shadow-md whitespace-nowrap">
                  Most popular
                </div>
                <div>
                  <div
                    className="text-[13px] font-semibold text-[#6ea8ff] pt-2"
                  >
                    Complete exam prep
                  </div>
                  <h3 className="text-[24px] font-bold font-editorial text-white mt-1">
                    {PRICING_PLANS.pro.name}
                  </h3>
                  <p
                    className="text-[14px] mt-2 leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {PRICING_PLANS.pro.tagline}
                  </p>
                  <div className="mt-6 mb-6">
                    {(() => {
                      const price = calculatePlanPricing(PRICING_PLANS.pro.basePrice, activeDuration);
                      return (
                        <div className="flex items-baseline">
                          <span className="text-[40px] font-bold text-white leading-none">
                            PKR {price.total.toLocaleString()}
                          </span>
                          <span
                            className="text-[14px] font-medium ml-2"
                            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                          >
                            / {activeDuration.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <ul className="space-y-3">
                    {PRICING_PLANS.pro.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[15px]"
                        style={{ color: 'rgba(255, 255, 255, 0.88)' }}
                      >
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  {/* Pro button: full width, pill, 52px tall, blue-to-teal gradient, overflow-hidden */}
                  <button
                    type="button"
                    onClick={() => onSelectPlan('pro', currentDurationKey)}
                    className="w-full h-[52px] min-h-[52px] rounded-full overflow-hidden bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white font-semibold text-base transition-all shadow-[0_0_20px_rgba(26,109,255,0.4)] flex items-center justify-center cursor-pointer"
                    style={{ borderRadius: '9999px' }}
                  >
                    Unlock Pro Access
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* 3. PREMIUM PLAN (Gold Badge) */}
            <ScrollReveal delayMs={120}>
              <div
                className="h-full flex flex-col justify-between text-left relative transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '28px',
                  padding: '24px',
                }}
              >
                {/* Centered on top edge, 12px, no overlap with plan name */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#f5b942] text-[#0d1b3e] text-[12px] font-bold shadow-md whitespace-nowrap">
                  Premium edge
                </div>
                <div>
                  <div
                    className="text-[13px] font-semibold text-[#fcd34d] pt-2"
                  >
                    Full suite
                  </div>
                  <h3 className="text-[24px] font-bold font-editorial text-white mt-1">
                    {PRICING_PLANS.premium.name}
                  </h3>
                  <p
                    className="text-[14px] mt-2 leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {PRICING_PLANS.premium.tagline}
                  </p>
                  <div className="mt-6 mb-6">
                    {(() => {
                      const price = calculatePlanPricing(PRICING_PLANS.premium.basePrice, activeDuration);
                      return (
                        <div className="flex items-baseline">
                          <span className="text-[40px] font-bold text-white leading-none">
                            PKR {price.total.toLocaleString()}
                          </span>
                          <span
                            className="text-[14px] font-medium ml-2"
                            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                          >
                            / {activeDuration.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <ul className="space-y-3">
                    {PRICING_PLANS.premium.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[15px]"
                        style={{ color: 'rgba(255, 255, 255, 0.88)' }}
                      >
                        <Check className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  {/* Premium button: gold #f5b942 with dark text, pill, 52px tall, overflow-hidden */}
                  <button
                    type="button"
                    onClick={() => onSelectPlan('premium', currentDurationKey)}
                    className="w-full h-[52px] min-h-[52px] rounded-full overflow-hidden bg-[#f5b942] hover:bg-[#eab308] text-[#0d1b3e] font-bold text-base transition-all shadow-md flex items-center justify-center cursor-pointer"
                    style={{ borderRadius: '9999px' }}
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

      {/* 3. Detailed Comparison Matrix (Light) - Horizontally scrollable on mobile */}
      <Section variant="light">
        <SectionHeader
          eyebrow="Feature breakdown"
          title="Compare Plans"
          highlight="In Detail"
          description="A granular comparison of question limits, analytics, mock exams, and tutor support."
        />

        <div className="max-w-4xl mx-auto rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left text-[14px] min-w-[560px] border-collapse">
              <colgroup>
                <col className="w-[150px] min-w-[150px]" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
              </colgroup>
              <thead className="bg-slate-50/95 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-[14px] font-bold sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs shadow-[2px_0_6px_rgba(0,0,0,0.04)]">
                    Feature
                  </th>
                  <th className="p-[14px] font-bold text-slate-600">
                    Free
                  </th>
                  <th className="p-[14px] font-bold text-[#1a6dff] bg-blue-500/10 border-x border-blue-500/20">
                    Pro
                  </th>
                  <th className="p-[14px] font-bold text-slate-700">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-sans">
                {COMPARISON_FEATURES.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    {/* Sticky first column on mobile: 150px wide */}
                    <td className="p-[14px] font-semibold text-slate-900 sticky left-0 z-10 bg-white/95 backdrop-blur-xs shadow-[2px_0_6px_rgba(0,0,0,0.04)] leading-snug">
                      {feat.name}
                    </td>
                    <td className="p-[14px] text-slate-600">
                      {typeof feat.freeValue === 'boolean' ? (
                        feat.freeValue ? (
                          <Check className="w-[18px] h-[18px] text-emerald-600" />
                        ) : (
                          <X className="w-[18px] h-[18px] text-slate-400" />
                        )
                      ) : (
                        feat.freeValue
                      )}
                    </td>
                    {/* Pro highlighted column: soft blue tint and subtle border */}
                    <td className="p-[14px] font-bold text-[#1a6dff] bg-blue-500/10 border-x border-blue-500/20">
                      {typeof feat.proValue === 'boolean' ? (
                        feat.proValue ? (
                          <Check className="w-[18px] h-[18px] text-emerald-600" />
                        ) : (
                          <X className="w-[18px] h-[18px] text-slate-400" />
                        )
                      ) : (
                        feat.proValue
                      )}
                    </td>
                    <td className="p-[14px] text-slate-700">
                      {typeof feat.premiumValue === 'boolean' ? (
                        feat.premiumValue ? (
                          <Check className="w-[18px] h-[18px] text-emerald-600" />
                        ) : (
                          <X className="w-[18px] h-[18px] text-slate-400" />
                        )
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
          eyebrow="Commonly asked"
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

      {/* 5. Final CTA Section (Light section with 40px rounded card) */}
      <FinalCTA
        accent="pricing"
        onPrimaryClick={() => onSelectPlan('free', 'six_months')}
        onSecondaryClick={onNavigateContact}
      />
    </div>
  );
};
export default PricingPage;
