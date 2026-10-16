import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function PricingSection() {
  return (
    <section id="pricing" className="landing-section relative">
      <div className="boardly-container">
        {/* Centered section header */}
        <div className="section-header">
          <Badge color="muted">Affordable Test Prep</Badge>
          <h2>Transparent Pricing. Made for Students.</h2>
          <p>
            No expensive PKR 50,000 academy fees. High-yield preparation designed to be accessible to every student in Pakistan.
          </p>
        </div>

        {/* Pricing: centered 2-column grid (max-width: 880px, 20px gap, equal height, 1 col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[880px] mx-auto items-stretch">
          {/* Free Tier Card */}
          <Card className="justify-between">
            <div>
              {/* Pill at top with space */}
              <div className="mb-4">
                <Badge color="muted">Free Starter</Badge>
              </div>

              {/* Price row with dot font */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-[var(--text)] font-doto">PKR 0</span>
                <span className="text-sm text-[var(--muted)]">/ forever</span>
              </div>

              {/* One-line description */}
              <p className="text-xs text-[var(--muted)] mb-5">
                Essential daily practice for disciplined self-studying students.
              </p>

              {/* 1px divider */}
              <div className="border-t border-[var(--border)] pt-4">
                {/* List: 12px gap, red dot INSIDE the card with 12px space before text */}
                <div className="flex flex-col gap-3">
                  {[
                    '3 timed practice sprints per day',
                    '10 Boardy AI queries per day',
                    'Full KaTeX formula derivations',
                    'PKT midnight quota reset (Asia/Karachi)',
                    'Live Blitz Arena participation',
                  ].map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-[var(--muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned to bottom: 20px clear space above, full width 52px tall outline button */}
            <div className="mt-auto pt-5">
              <Link to="/signup" className="btn-outline w-full" style={{ height: '52px' }}>
                Get Started Free
              </Link>
            </div>
          </Card>

          {/* Pro Tier Card: 1px red border */}
          <Card variant="red" className="justify-between relative">
            <div>
              {/* Pill at top with space */}
              <div className="flex items-center justify-between mb-4">
                <Badge color="red">Most Popular</Badge>
                <span className="text-xs text-[var(--muted)] font-medium">Full Access</span>
              </div>

              {/* Price row with dot font */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-[var(--text)] font-doto">PKR 199</span>
                <span className="text-sm text-[var(--muted)]">/ month</span>
              </div>

              {/* One-line description */}
              <p className="text-xs text-[var(--muted)] mb-5">
                Less than the cost of a single shawarma. Everything unlocked.
              </p>

              {/* 1px divider */}
              <div className="border-t border-[var(--border)] pt-4">
                {/* List: 12px gap, red dot INSIDE the card with 12px space before text */}
                <div className="flex flex-col gap-3">
                  {[
                    'Unlimited practice sprints & drills',
                    '100 Boardy AI questions / day with step derivations',
                    'All past paper vaults (FAST, NUST, GIKI, MDCAT)',
                    'Merit Meter aggregate simulator & closing merits',
                    'Create private Study Circle squad rooms',
                    'Detailed chapter weakness analytics & historical curves',
                    'Priority support & ad-free experience',
                  ].map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-[var(--text)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned to bottom: 20px clear space above, full width 52px tall solid red button */}
            <div className="mt-auto pt-5 flex flex-col gap-2.5">
              <Link to="/signup" className="btn-red w-full" style={{ height: '52px' }}>
                Upgrade to Pro
              </Link>
              <div className="text-center text-[11px] text-[var(--muted)]">
                Local payments accepted: JazzCash, EasyPaisa, SadaPay, NayaPay &amp; Bank Transfer.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
