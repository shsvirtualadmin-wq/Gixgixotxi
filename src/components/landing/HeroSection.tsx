import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        paddingTop: 'calc(88px + 32px + env(safe-area-inset-top, 0px))',
        paddingBottom: '64px',
      }}
    >
      <div className="boardly-container">
        {/* 2-column hero grid (1.1fr .9fr, gap 48px, align-items: center), 1 column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badges: outlined grey pills (no colors) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-6">
              <Badge color="muted">Education For Everyone</Badge>
              <Badge color="muted">Practice &amp; Learn Together</Badge>
            </div>

            {/* H1 Heading in Doto Font */}
            <h1
              className="font-dot text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text)] mb-6"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 900,
                lineHeight: 1.15,
                fontSize: 'clamp(28px, 6.5vw, 56px)',
              }}
            >
              Education For Everyone.{' '}
              <span className="block mt-1 text-[var(--text)]">Practice MCQs. Learn Together.</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl mb-4 leading-relaxed">
              Pakistan&apos;s accessible MCQ practice and collaborative learning platform. Master key concepts with step-by-step KaTeX derivations, timed practice sprints, chapter analytics, and free community study sharing.
            </p>

            {/* Short About line */}
            <p className="text-xs sm:text-sm text-[var(--text)] font-medium mb-8">
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
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link to="/features" className="btn-outline w-full sm:w-auto">
                Explore Features
              </Link>
            </div>

            {/* Checklist row */}
            <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 w-full">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">Comprehensive MCQ Banks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">Step-by-step KaTeX</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
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
