import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KobanIcon } from '../koban/KobanIcon';
import { usePlansConfig } from '@/hooks/usePlansConfig';

const KOBAN_FEATURES = [
  '500 Kobans to personalize your student profile',
  'Redeem Kobans for Boardly Pro or Plus',
  'Unlock dot-matrix avatar frames in the Store',
  'Equip animated student nameplates',
  'Collect rising profile card aura effects',
  'Purchased Kobans never expire in your student wallet',
];

export const PricingSection = React.memo(function PricingSection() {
  const { config: plansConfig } = usePlansConfig();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const FREE_FEATURES = [
    'The free tier is enough to practice and learn',
    'Sharing material in Commons is always free with no limit',
    `${plansConfig.free.aiCreditsPerDay} AI Mentor credits per day (Quick & Balanced)`,
    'KaTeX formula derivations',
    'Join or create Study Crew squads',
    'Daily midnight quota reset (PKT)',
  ];

  const PRO_FEATURES = [
    'Unlimited practice tests and sprint drills',
    `${plansConfig.pro.aiCreditsPerDay} AI Mentor credits per day`,
    'Deep & Max AI thinking unlocked',
    'Complete subject question banks unlocked',
    'Detailed chapter weakness diagnostics and mistake curves',
    'Pro badge next to your name',
    'Ad-free experience',
  ];

  const PLUS_FEATURES = [
    'Everything in Boardly Pro',
    `${plansConfig.plus.aiCreditsPerDay} AI Mentor credits per day (2x Pro)`,
    'Deep & Max AI thinking unlocked',
    'Plus badge next to your name',
    'Unused Pro days credited automatically on upgrade',
    'Share Plus benefits with your Nakama Crew',
    'Ad-free experience',
  ];

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative overflow-hidden isolate py-14 sm:py-20 lg:py-28 cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      <div className="boardly-container">
        {/* Centered Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Simple, Fair Pricing Chip */}
          <div className="flex justify-center mb-4">
            <span className="section-chip">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0"
                aria-hidden="true"
              />
              Simple, Fair Pricing
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-dot font-extrabold text-white tracking-tight leading-tight mb-4"
            style={{
              fontFamily: 'var(--font-dot)',
              letterSpacing: '0.01em',
              fontWeight: 800,
              fontSize: 'clamp(24px, 3.4vw, 36px)',
            }}
          >
            Honest Pricing. Accessible for Everyone.
          </h2>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Education should never be gated behind expensive academy fees. Our free tier is enough for students to practice and learn, with low-cost options for extras.
          </p>
        </div>

        {/* Pricing Cards Container */}
        <div className="relative">
          {/* 4-Column Pricing Grid: Free, Pro, Plus, Kobans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto items-stretch relative z-10">
            {/* Free Tier Card */}
            <div
              className={`glass-card order-2 md:order-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] p-6 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="glass-pill px-3 py-1 rounded-full text-xs font-semibold font-heading text-white/90">
                    Free
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl font-bold text-white font-doto tracking-tight">
                    0 PKR
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  Enough for students to practice and learn every day.
                </p>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-5" aria-hidden="true" />

                <div className="flex flex-col gap-3 flex-1">
                  {FREE_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--muted)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/signup"
                  className="btn-secondary inline-flex items-center justify-center w-full h-[46px] rounded-full font-semibold text-sm font-heading transition-all duration-200 active:scale-[0.98]"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Boardly Pro Tier Card */}
            <div
              className={`glass-card-highlight order-1 md:order-2 h-full flex flex-col justify-between relative overflow-hidden isolate rounded-[26px] sm:rounded-[32px] p-6 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '60ms' }}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold font-heading bg-[#D71921] text-white">
                    Boardly Pro
                  </span>
                  <span className="text-xs text-[var(--muted)] font-medium font-heading">
                    Popular
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl font-bold text-white font-doto tracking-tight">
                    {plansConfig.pro.pricePkrMonthly} PKR
                  </span>
                  <span className="text-xs text-[var(--muted)]">/ mo</span>
                </div>

                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  Unlimited practice &amp; {plansConfig.pro.aiCreditsPerDay} AI Mentor credits/day.
                </p>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-5" aria-hidden="true" />

                <div className="flex flex-col gap-3 flex-1">
                  {PRO_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-white leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center w-full h-[46px] rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white font-semibold text-sm font-heading shadow-[0_4px_14px_rgba(215,20,31,0.28)] transition-all duration-200 active:scale-[0.98]"
                >
                  Get Pro
                </Link>
              </div>
            </div>

            {/* Boardly Plus Tier Card */}
            <div
              className={`glass-card-gold order-1 md:order-3 h-full flex flex-col justify-between relative overflow-hidden isolate rounded-[26px] sm:rounded-[32px] p-6 sm:p-7 border border-amber-500/40 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '120ms' }}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold font-heading bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                    Boardly Plus
                  </span>
                  <span className="text-xs text-amber-300 font-medium font-heading">
                    Best value
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl font-bold text-white font-doto tracking-tight">
                    {plansConfig.plus.pricePkrMonthly} PKR
                  </span>
                  <span className="text-xs text-[var(--muted)]">/ mo</span>
                </div>

                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  Everything in Pro plus {plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day.
                </p>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-400/25 to-transparent mb-5" aria-hidden="true" />

                <div className="flex flex-col gap-3 flex-1">
                  {PLUS_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-white leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center w-full h-[46px] rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-105 text-black font-bold text-sm font-heading transition-all duration-200 active:scale-[0.98]"
                >
                  Get Plus
                </Link>
              </div>
            </div>

            {/* Koban Pack Card */}
            <div
              className={`glass-card order-3 md:order-4 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] p-6 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '180ms' }}
            >
              <div className="flex flex-col flex-1">
                {/* Plan chip row */}
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="glass-pill px-3 py-1 rounded-full text-xs font-semibold font-heading text-white/90">
                    Koban Pack
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#E8A317] font-semibold font-heading">
                    <KobanIcon size={14} />
                    <span>500 Kobans</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl sm:text-4xl font-bold text-white font-doto tracking-tight">
                    50 PKR
                  </span>
                </div>

                {/* Short description */}
                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  50 PKR for 500 kobans. Kobans are used to customize your profile.
                </p>

                {/* Thin soft gradient divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-5" aria-hidden="true" />

                {/* Bullet list */}
                <div className="flex flex-col gap-3 flex-1">
                  {KOBAN_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--muted)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A317] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Bottom Area */}
              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/store"
                  className="btn-secondary inline-flex items-center justify-center w-full h-[48px] rounded-full font-semibold text-sm font-heading transition-all duration-200 active:scale-[0.98]"
                >
                  Explore Store &amp; Kobans
                </Link>
                {/* Spacer to guarantee pixel-identical baseline with Unlimited card */}
                <div className="mt-2.5 min-h-[18px] text-[11px] select-none opacity-0" aria-hidden="true">
                  &nbsp;
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Guide Button Below Cards */}
        <div className="text-center mt-10 sm:mt-12">
          <Link
            to="/pricing"
            className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-xs sm:text-sm font-heading hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <span>View complete pricing guide &amp; local payment instructions</span>
            <span className="transition-transform group-hover:translate-x-1 select-none" aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
});

export default PricingSection;
