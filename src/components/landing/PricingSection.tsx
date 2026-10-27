import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KobanIcon } from '../koban/KobanIcon';

const FREE_FEATURES = [
  'The free tier is enough to practice and learn',
  'Sharing material in Commons is always free with no limit',
  '10 practice tests per day',
  'Boardy AI queries with KaTeX formula derivations',
  'Join or create Study Crew squads',
  'Daily midnight quota reset (PKT)',
];

const UNLIMITED_FEATURES = [
  'Unlimited practice tests and sprint drills',
  'Unlimited Boardy AI questions with step derivations',
  'Complete subject question banks unlocked',
  'Detailed chapter weakness diagnostics and mistake curves',
  'Unlimited public Grand Line & Arena tests',
  'Priority support desk via WhatsApp & Email',
];

const KOBAN_FEATURES = [
  '500 Kobans to personalize your student profile',
  'Unlock dot-matrix avatar frames in the Store',
  'Equip animated student nameplates',
  'Collect rising profile card aura effects',
  '100% aesthetic with zero unfair academic advantage',
  'Purchased Kobans never expire in your student wallet',
];

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

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
      className="relative py-14 sm:py-20 lg:py-28 cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      <div className="boardly-container">
        {/* Centered Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Simple, Fair Pricing Chip */}
          <div className="flex justify-center mb-4">
            <span className="section-chip">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0"
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

        {/* Pricing Cards Container with Ambient Glows */}
        <div className="relative">
          {/* Ambient red radial behind Unlimited card + subtle gold radial behind Koban card */}
          <div className="absolute -inset-4 sm:-inset-10 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.14)_0%,rgba(215,25,33,0.03)_55%,transparent_75%)] opacity-80" />
            <div className="absolute top-1/2 right-[5%] -translate-y-1/2 w-[350px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(232,163,23,0.1)_0%,rgba(232,163,23,0.02)_55%,transparent_75%)] opacity-75" />
          </div>

          {/* 3-Column Pricing Grid: Equal height, aligned rows, responsive reordering */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch relative z-10">
            {/* Free Tier Card */}
            <div
              className={`glass-card order-2 md:order-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-7 sm:p-8 lg:p-9 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <div className="flex flex-col flex-1">
                {/* Plan chip row */}
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="glass-pill px-3 py-1 rounded-full text-xs font-semibold font-heading text-white/90">
                    Free
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl sm:text-4xl font-bold text-white font-doto tracking-tight">
                    0 PKR
                  </span>
                </div>

                {/* Short description */}
                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  Enough for students to practice and learn every day.
                </p>

                {/* Thin soft gradient divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-5" aria-hidden="true" />

                {/* Bullet list */}
                <div className="flex flex-col gap-3 flex-1">
                  {FREE_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--muted)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Bottom Area */}
              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/signup"
                  className="btn-secondary inline-flex items-center justify-center w-full h-[48px] rounded-full font-semibold text-sm font-heading transition-all duration-200 active:scale-[0.98]"
                >
                  Start Free
                </Link>
                {/* Spacer to guarantee pixel-identical baseline with Unlimited card */}
                <div className="mt-2.5 min-h-[18px] text-[11px] select-none opacity-0" aria-hidden="true">
                  &nbsp;
                </div>
              </div>
            </div>

            {/* Unlimited Tier Card: Featured, slightly brighter surface, red border, static red glow */}
            <div
              className={`glass-card-highlight order-1 md:order-2 h-full flex flex-col justify-between relative rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-7 sm:p-8 lg:p-9 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
              }`}
              style={{ transitionDelay: '90ms' }}
            >
              {/* Subtle static red radial glow */}
              <div
                className="absolute -inset-1 rounded-[34px] bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,transparent_70%)] pointer-events-none -z-10"
                aria-hidden="true"
              />

              <div className="flex flex-col flex-1">
                {/* Plan chip row */}
                <div className="flex items-center justify-between min-h-[28px] mb-3.5">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold font-heading bg-[#D71921] text-white shadow-[0_2px_8px_rgba(215,25,33,0.4)]">
                    Unlimited
                  </span>
                  <span className="text-xs text-[var(--muted)] font-medium font-heading">
                    Full Access
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
                  <span className="text-3xl sm:text-4xl font-bold text-white font-doto tracking-tight">
                    199 PKR
                  </span>
                </div>

                {/* Short description */}
                <p className="text-xs sm:text-[13px] text-[var(--muted)] mb-5 min-h-[38px] leading-relaxed">
                  199 PKR for unlimited use across the platform.
                </p>

                {/* Thin soft gradient divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-5" aria-hidden="true" />

                {/* Bullet list */}
                <div className="flex flex-col gap-3 flex-1">
                  {UNLIMITED_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-white leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_6px_rgba(215,25,33,0.8)] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Bottom Area with button and Pay locally note */}
              <div className="mt-auto pt-6 flex flex-col justify-end">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center w-full h-[48px] rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white font-semibold text-sm font-heading shadow-[0_6px_20px_rgba(215,25,33,0.4)] hover:shadow-[0_8px_24px_rgba(215,25,33,0.55)] transition-all duration-200 active:scale-[0.98]"
                >
                  Get Unlimited
                </Link>
                {/* Pay locally note centered inside the card under the button */}
                <div className="mt-2.5 min-h-[18px] text-center text-[11px] text-[var(--muted)] leading-relaxed">
                  Pay locally: JazzCash, EasyPaisa, SadaPay, or Bank Transfer.
                </div>
              </div>
            </div>

            {/* Koban Pack Card: subtle gold edge glow */}
            <div
              className={`glass-card-gold order-3 md:order-3 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-7 sm:p-8 lg:p-9 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
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
}

export default PricingSection;
