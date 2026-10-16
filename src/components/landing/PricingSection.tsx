import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="site-container">
        <div className="section-header">
          <Badge color="success">Affordable Test Prep</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Transparent Pricing.{' '}
            <span className="text-gradient">Made for Students.</span>
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl">
            No expensive PKR 50,000 academy fees. High-yield preparation designed to be accessible to every student in Pakistan.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 items-stretch w-full"
          style={{ maxWidth: '880px', margin: '0 auto', gap: '24px' }}
        >
          {/* Free Tier */}
          <GlassCard hover className="flex flex-col justify-between p-8 h-full">
            <div className="space-y-6">
              <div>
                <Badge color="muted" className="mb-3">
                  Free Starter
                </Badge>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">PKR 0</span>
                  <span className="text-sm text-[var(--text-muted)]">/ forever</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Essential daily practice for disciplined self-studying students.
                </p>
              </div>

              <div className="space-y-3 border-t border-[var(--border)] pt-6">
                {[
                  '3 timed practice sprints per day',
                  '10 Boardy AI queries per day',
                  'Full KaTeX formula derivations',
                  'PKT midnight quota reset (Asia/Karachi)',
                  'Live Blitz Arena participation',
                ].map(feature => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                    <Check size={16} className="text-blue-400 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Link to="/signup" className="w-full block">
                <Button variant="secondary" size="lg" fullWidth>
                  Get Started Free
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Pro Tier */}
          <GlassCard animated className="flex flex-col justify-between p-8 h-full relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge color="brand" pulse>
                  Most Popular
                </Badge>
                <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                  <Sparkles size={14} /> Full Access
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">PKR 199</span>
                  <span className="text-sm text-[var(--text-muted)]">/ month</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Less than the cost of a single shawarma. Everything unlocked.
                </p>
              </div>

              <div className="space-y-3 border-t border-[var(--border)] pt-6">
                {[
                  'Unlimited practice sprints & drills',
                  '100 Boardy AI questions / day with step derivations',
                  'All past paper vaults (FAST, NUST, GIKI, MDCAT)',
                  'Merit Meter aggregate simulator & closing merits',
                  'Create private Study Circle squad rooms',
                  'Detailed chapter weakness analytics & historical curves',
                  'Priority support & ad-free experience',
                ].map(feature => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-white">
                    <Check size={16} className="text-cyan-400 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 space-y-3">
              <Link to="/signup" className="w-full block">
                <Button variant="primary" size="lg" fullWidth>
                  Upgrade to Pro
                </Button>
              </Link>

              <div className="text-center text-[11px] text-[var(--text-faint)]">
                Local payments accepted: JazzCash, EasyPaisa, SadaPay, NayaPay &amp; Bank Transfer.
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
