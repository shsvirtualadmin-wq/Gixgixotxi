import React from 'react';
import { HeartHandshake } from 'lucide-react';

export function MissionSection() {
  return (
    <section
      id="mission"
      className="relative py-14 sm:py-20 lg:py-28 cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      <div className="boardly-container">
        <div className="max-w-[880px] mx-auto w-full relative">
          {/* Ambient red & white radial glow centered behind floating glass card (static gradient) */}
          <div
            className="absolute -inset-6 sm:-inset-12 -z-10 pointer-events-none opacity-85"
            aria-hidden="true"
          >
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.16)_0%,rgba(215,25,33,0.05)_45%,rgba(255,255,255,0.02)_65%,transparent_72%)]" />
          </div>

          {/* Floating Glass Panel */}
          <div
            className="animate-float-2 glass-panel relative rounded-[32px] sm:rounded-[36px] lg:rounded-[40px] p-7 sm:p-12 lg:p-14 text-center"
          >
            {/* "Why We Built Boardly" chip */}
            <div className="flex justify-center mb-5 sm:mb-6">
              <span className="section-chip">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0"
                  aria-hidden="true"
                />
                Why We Built Boardly
              </span>
            </div>

            {/* "Our Mission" heading */}
            <h2
              className="font-dot font-extrabold text-white tracking-tight leading-tight mb-5 sm:mb-6"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 800,
                fontSize: 'clamp(26px, 3.6vw, 38px)',
              }}
            >
              Our Mission
            </h2>

            {/* Text Hierarchy */}
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Standout Mission Statement */}
              <p className="text-base sm:text-lg font-medium text-white/95 leading-relaxed">
                Boardly was made to make education accessible to everyone, no matter who they are, where they live, or what they can afford.
              </p>

              {/* Remaining context paragraphs */}
              <div className="space-y-3.5 text-sm sm:text-[15px] text-[var(--muted)] leading-[1.75]">
                <p>
                  Good practice and learning tools should not be a privilege for a few students.
                </p>
                <p>
                  This is why Boardly has a free tier that is enough for students, very low prices for anything extra, and free, unlimited sharing of study material in Commons.
                </p>
                <p>
                  Boardly Commons exists so students can learn together and help each other.
                </p>
              </div>
            </div>

            {/* Soft gradient hairline divider */}
            <div
              className="h-[1px] w-full max-w-xl mx-auto bg-gradient-to-r from-transparent via-white/12 to-transparent my-6 sm:my-8"
              aria-hidden="true"
            />

            {/* Founder Line */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--muted)]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <HeartHandshake size={16} className="text-[#D71921] shrink-0" />
                <span>Founded by Muhammad Hashir</span>
              </div>
              <span className="hidden sm:inline text-white/30 text-xs select-none" aria-hidden="true">
                &bull;
              </span>
              <span>
                A project of{' '}
                <a
                  href="https://shsvirtualacademy.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D71921] font-semibold hover:underline hover:text-[#ff3842] transition-colors"
                >
                  SHS Virtual Academy
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MissionSection;
