import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <Badge color="brand" pulse>
                2026 Admissions Cohort Open
              </Badge>
              <Badge color="muted">FAST · NUST · GIKI · MDCAT</Badge>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--text)] leading-[1.08]">
              Crush Your Entrance Test.{' '}
              <span className="text-gradient block mt-1">Zero Blind Spots.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Pakistan&apos;s high-velocity MCQ cockpit. Official university marking schemes, step-by-step KaTeX formula derivations, timed sprints, and live national Arena battles.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth className="group">
                  Start Practicing Free
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/#arena" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" fullWidth>
                  Explore Live Arena
                </Button>
              </Link>
            </div>

            {/* Trust Chips */}
            <div className="pt-6 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-[var(--text-muted)]">Authentic Past Papers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-[var(--text-muted)]">Step-by-step KaTeX</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-[var(--text-muted)]">PKT Midnight Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
