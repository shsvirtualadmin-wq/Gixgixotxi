import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        paddingTop: 'calc(var(--nav-h) + 40px)',
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
              <Badge color="muted">2026 Admissions Cohort Open</Badge>
              <Badge color="muted">FAST · NUST · GIKI · MDCAT</Badge>
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
              Crush Your Entrance Test.{' '}
              <span className="block mt-1 text-[var(--text)]">Zero Blind Spots.</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl mb-8 leading-relaxed">
              Pakistan&apos;s high-velocity MCQ cockpit. Official university marking schemes, step-by-step KaTeX formula derivations, timed sprints, and live national Arena battles.
            </p>

            {/* Hero CTAs:
                "Start Practicing Free" is a solid red pill (padding 14px 24px)
                "Explore Live Arena" is an outline pill
                side by side with gap 12px, wrapping on mobile */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <Link to="/signup" className="btn-red w-full sm:w-auto group">
                <span>Start Practicing Free</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link to="/features" className="btn-outline w-full sm:w-auto">
                Explore Features
              </Link>
            </div>

            {/* Checklist row:
                (Authentic Past Papers / Step-by-step KaTeX / PKT Midnight Resets)
                uses flex-wrap, margin-top 24px, with small red dots instead of colored icons */}
            <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 w-full">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--muted)] font-medium">Authentic Past Papers</span>
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
