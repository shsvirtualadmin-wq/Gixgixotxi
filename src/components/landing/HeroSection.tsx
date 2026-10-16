import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';

export function HeroSection() {
  return (
    <section className="relative pt-[104px] pb-20 md:pb-28 overflow-hidden">
      <div className="site-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="space-y-6 text-center lg:text-left">
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
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto group shadow-lg shadow-blue-500/25"
                  style={{ padding: '14px 24px', borderRadius: 12, fontSize: '1rem', fontWeight: 600 }}
                >
                  Start Practicing Free
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/#arena" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto border border-white/10 hover:border-white/20"
                  style={{ padding: '14px 24px', borderRadius: 12, fontSize: '1rem', fontWeight: 600 }}
                >
                  Explore Live Arena
                </Button>
              </Link>
            </div>

            {/* Trust Chips Row */}
            <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Authentic Past Papers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Step-by-step KaTeX</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>PKT Midnight Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
