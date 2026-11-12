import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, MessageSquare, Calculator, Users, Flame } from 'lucide-react';

const LazyMathText = lazy(() => import('../ui/MathText'));

export function FeaturesGrid() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsVisible(true);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative isolate py-14 sm:py-20 lg:py-28 overflow-hidden cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      <div className="boardly-container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Platform Capabilities Pill */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold font-heading tracking-wide section-chip">
              Platform Capabilities
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-dot font-extrabold text-white tracking-tight leading-tight mb-3 sm:mb-4"
            style={{
              fontFamily: 'var(--font-dot)',
              letterSpacing: '0.01em',
              fontWeight: 800,
              fontSize: 'clamp(26px, 3.6vw, 38px)',
            }}
          >
            Engineered for Student Excellence
          </h2>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
            Every feature is calibrated to help students master core subjects, build consistent practice habits, and learn together with clear derivations.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {/* Card 1: KaTeX Derivations (Spans 2 cols on lg) */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '0ms',
            }}
            className="lg:col-span-2 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-6 sm:p-8 lg:p-9 glass-card hover:-translate-y-1.5 hover:border-white/22"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Floating Icon Tile */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] icon-tile flex items-center justify-center text-white shrink-0 animate-float-1">
                <Calculator size={20} />
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2 font-heading"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  KaTeX Derivation Engine
                </h3>
                <p className="text-sm text-[var(--muted)] leading-[1.65]">
                  No more blurry screenshots or cryptic notation. Every math and physics explanation is formatted with pure LaTeX derivations so you see exactly how terms cancel.
                </p>
              </div>

              {/* Live Math Demo / Inner Glass Panel */}
              <div className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] glass-row space-y-2 select-text">
                <div className="text-xs font-medium text-[var(--muted)]">
                  Sample solution step:
                </div>
                <div className="py-2 overflow-x-auto text-center text-white max-w-full min-h-[44px] flex items-center justify-center">
                  {isVisible ? (
                    <Suspense
                      fallback={
                        <span className="font-serif italic text-base sm:text-lg tracking-wide">
                          &int; x e<sup>2x</sup> dx = &frac12; x e<sup>2x</sup> &minus; &frac14; e<sup>2x</sup> + C
                        </span>
                      }
                    >
                      <LazyMathText
                        block
                        text={'$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$'}
                      />
                    </Suspense>
                  ) : (
                    <span className="font-serif italic text-base sm:text-lg tracking-wide">
                      &int; x e<sup>2x</sup> dx = &frac12; x e<sup>2x</sup> &minus; &frac14; e<sup>2x</sup> + C
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pinned Footer with Red-Dot Caption */}
            <div className="mt-6 pt-4 border-t border-white/10 min-h-[44px] flex items-center gap-2 text-xs text-[var(--muted)]">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0"
                aria-hidden="true"
              />
              <span>Formulas and step derivations verified in KaTeX</span>
            </div>
          </div>

          {/* Card 2: Boardly Commons (Interactive: contains link) */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '90ms',
            }}
            className="lg:col-span-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-6 sm:p-8 lg:p-9 glass-card hover:-translate-y-1.5 hover:border-white/22 active:scale-[0.98] transition-all duration-300 ease-out"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Floating Icon Tile */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] icon-tile flex items-center justify-center text-white shrink-0 animate-float-2">
                <MessageSquare size={20} />
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2 font-heading"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Boardly Commons
                </h3>
                <p className="text-sm text-[var(--muted)] leading-[1.65]">
                  An open student community to share study material free with no limits, talk to the whole community, talk anonymously, and message peers directly to solve doubts together.
                </p>
              </div>

              {/* Callout with red left accent line */}
              <div className="p-3.5 sm:p-4 rounded-[18px] glass-row !border-l-[3px] !border-l-[#D71921] text-white">
                <span className="text-xs font-medium text-white/90 leading-relaxed block">
                  Free, unlimited sharing and peer learning for everyone.
                </span>
              </div>
            </div>

            {/* Pinned Footer Link */}
            <div className="mt-6 pt-4 border-t border-white/10 min-h-[44px] flex items-center">
              <Link
                to="/commons/about"
                className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-[#D71921] hover:text-[#ff3842] transition-colors duration-200"
              >
                <span>Learn more about Commons</span>
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover/link:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* Card 3: Boardy AI Tutor (Non-interactive) */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '180ms',
            }}
            className="lg:col-span-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-6 sm:p-8 lg:p-9 glass-card hover:-translate-y-1.5 hover:border-white/22"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Floating Icon Tile */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] icon-tile flex items-center justify-center text-white shrink-0 animate-float-3">
                <Cpu size={20} />
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2 font-heading"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Boardy 24/7 AI Tutor
                </h3>
                <p className="text-sm text-[var(--muted)] leading-[1.65]">
                  Stuck on a tricky organic reaction or vector projection? Ask Boardy. Step-by-step guidance without giving away the answer upfront.
                </p>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 min-h-[44px] flex items-center text-xs text-[var(--muted)]">
              Powered by step-by-step academic guidance.
            </div>
          </div>

          {/* Card 4: Study Squads (Interactive: contains link) */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '270ms',
            }}
            className="lg:col-span-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-6 sm:p-8 lg:p-9 glass-card hover:-translate-y-1.5 hover:border-white/22 active:scale-[0.98] transition-all duration-300 ease-out"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Floating Icon Tile */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] icon-tile flex items-center justify-center text-white shrink-0 animate-float-1">
                <Users size={20} />
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2 font-heading"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Study Squads
                </h3>
                <p className="text-sm text-[var(--muted)] leading-[1.65]">
                  Form collaborative study squads of up to 30 classmates with private 6-character room codes. Compare solve times, coordinate drills, and track streaks.
                </p>
              </div>
            </div>

            {/* Pinned Footer Link */}
            <div className="mt-6 pt-4 border-t border-white/10 min-h-[44px] flex items-center">
              <Link
                to="/crew"
                className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-[#D71921] hover:text-[#ff3842] transition-colors duration-200"
              >
                <span>Learn more about Study Squads</span>
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover/link:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* Card 5: Daily Drills & Streak / PKT Midnight Resets (Non-interactive) */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '360ms',
            }}
            className="lg:col-span-1 h-full flex flex-col justify-between rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] p-6 sm:p-8 lg:p-9 glass-card hover:-translate-y-1.5 hover:border-white/22"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Floating Icon Tile */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] icon-tile flex items-center justify-center text-white shrink-0 animate-float-2">
                <Flame size={20} />
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2 font-heading"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  PKT Midnight Resets
                </h3>
                <p className="text-sm text-[var(--muted)] leading-[1.65]">
                  No awkward midday quota refreshes. All daily drill allowances refresh precisely at midnight Pakistan Standard Time (Asia/Karachi).
                </p>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 min-h-[44px] flex items-center text-xs text-[var(--muted)]">
              Keep your streak alive during late-night study sessions.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesGrid;
