import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        paddingTop: 'calc(64px + 44px + env(safe-area-inset-top, 0px))',
        paddingBottom: '56px',
      }}
    >
      <div className="boardly-container">
        {/* 2-column hero grid (1.12fr .88fr, gap 48px, align-items: center), 1 column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badges: compact outlined pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-5">
              <Badge color="muted">Education For Everyone</Badge>
              <Badge color="muted">Practice &amp; Learn Together</Badge>
            </div>

            {/* H1 Heading in Doto Font: sized to fit in 3 lines max on desktop */}
            <h1
              className="font-dot font-extrabold tracking-tight text-[var(--text)] mb-4 max-w-[600px]"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 800,
                lineHeight: 1.18,
                fontSize: 'clamp(26px, 3.6vw, 42px)',
              }}
            >
              Education For Everyone.{' '}
              <span className="block mt-1 text-[var(--text)]">Practice MCQs. Learn Together.</span>
            </h1>

            {/* Subtext */}
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
                className="text-[var(--red)] font-semibold hover:underline"
              >
                SHS Virtual Academy
              </a>
              .
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <Link to="/signup" className="btn-red w-full sm:w-auto group">
                <span>Start Practicing Free</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link to="/features" className="btn-outline w-full sm:w-auto">
                Explore Features
              </Link>
            </div>

            {/* Checklist row */}
            <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 w-full">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">Comprehensive MCQ Banks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">Step-by-step KaTeX</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">PKT Midnight Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="flex justify-center items-center w-full">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
