import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        paddingTop: 'calc(64px + 24px + env(safe-area-inset-top, 0px))',
        paddingBottom: '64px',
      }}
    >
      <div className="boardly-container relative z-10">
        {/* 2-column hero grid (1.12fr .88fr, gap 48px, align-items: center), 1 column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Left Column: Hero Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Top chips: small, refined glass pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-heading font-medium section-chip">
                <Sparkles size={13} className="text-[#D71921]" />
                Education For Everyone
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-heading font-medium section-chip">
                Practice &amp; Learn Together
              </span>
            </div>

            {/* H1 Heading in Doto Font: prominent, large, well-proportioned line spacing */}
            <h1
              className="font-dot font-extrabold tracking-tight text-[var(--text)] mb-4 max-w-[620px]"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 800,
                lineHeight: 1.16,
                fontSize: 'clamp(28px, 4vw, 46px)',
              }}
            >
              Education For Everyone.{' '}
              <span className="block mt-1 text-[var(--text)]">Practice MCQs. Learn Together.</span>
            </h1>

            {/* Subtext with clean even spacing */}
            <p className="text-[15px] sm:text-base text-[var(--muted)] max-w-xl mb-4 leading-relaxed">
              Pakistan&apos;s accessible MCQ practice and collaborative learning platform. Master key concepts with step-by-step KaTeX derivations, timed practice sprints, chapter analytics, and free community study sharing.
            </p>

            {/* Short About line */}
            <p className="text-xs sm:text-sm text-[var(--text)] font-medium mb-6">
              Boardly is built and run by{' '}
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D71921] font-semibold hover:underline"
              >
                SHS Virtual Academy
              </a>
              .
            </p>

            {/* Hero CTAs: Red pill + Glass outline pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 w-full sm:w-auto">
              <Link
                to="/signup"
                className="h-12 px-6 rounded-full inline-flex items-center justify-center gap-2 text-sm font-heading font-bold bg-[#D71921] hover:bg-[#b8141b] text-white shadow-[0_10px_25px_rgba(215,25,33,0.38)] hover:shadow-[0_14px_30px_rgba(215,25,33,0.5)] transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] w-full sm:w-auto group cursor-pointer"
              >
                <span>Start Practicing Free</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/features"
                className="h-12 px-6 rounded-full inline-flex items-center justify-center text-sm font-heading font-semibold btn-secondary transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] w-full sm:w-auto cursor-pointer"
              >
                Explore Features
              </Link>
            </div>

            {/* Feature bullets row with even spacing */}
            <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 w-full">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 shadow-[0_0_8px_rgba(215,25,33,0.8)]" />
                <span className="text-xs text-[var(--muted)] font-medium">Comprehensive MCQ Banks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 shadow-[0_0_8px_rgba(215,25,33,0.8)]" />
                <span className="text-xs text-[var(--muted)] font-medium">Step-by-step KaTeX</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0 shadow-[0_0_8px_rgba(215,25,33,0.8)]" />
                <span className="text-xs text-[var(--muted)] font-medium">PKT Midnight Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Glass Dashboard Preview */}
          <div className="flex justify-center items-center w-full">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
