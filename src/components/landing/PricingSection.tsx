import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { KobanIcon } from '../koban/KobanIcon';

export function PricingSection() {
  return (
    <section id="pricing" className="landing-section relative">
      <div className="boardly-container">
        {/* Centered section header */}
        <div className="section-header">
          <Badge color="muted">Simple, Fair Pricing</Badge>
          <h2>Honest Pricing. Accessible for Everyone.</h2>
          <p>
            Education should never be gated behind expensive academy fees. Our free tier is enough for students to practice and learn, with low-cost options for extras.
          </p>
        </div>

        {/* 3-Column Pricing Grid: equal height, aligned headers/prices/lists/buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {/* Free Tier Card */}
          <Card className="h-full flex flex-col justify-between">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between min-h-[26px] mb-3">
                <Badge color="muted">Free</Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-doto">0 PKR</span>
              </div>

              <p className="text-xs text-[var(--muted)] mb-4 min-h-[34px] leading-relaxed">
                Enough for students to practice and learn every day.
              </p>

              <div className="border-t border-[var(--border)] pt-4 flex-1">
                <div className="flex flex-col gap-2.5">
                  {[
                    'The free tier is enough to practice and learn',
                    'Sharing material in Commons is always free with no limit',
                    '10 practice tests per day',
                    'Boardy AI queries with KaTeX formula derivations',
                    'Join or create Study Crew squads',
                    'Daily midnight quota reset (PKT)',
                  ].map(feature => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--muted)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link to="/signup" className="btn-outline w-full">
                Start Free
              </Link>
            </div>
          </Card>

          {/* Unlimited Tier Card: 1px red border only, aligned with neighbors */}
          <Card variant="red" className="h-full flex flex-col justify-between relative">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between min-h-[26px] mb-3">
                <Badge color="red">Unlimited</Badge>
                <span className="text-xs text-[var(--muted)] font-medium">Full Access</span>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-doto">199 PKR</span>
              </div>

              <p className="text-xs text-[var(--muted)] mb-4 min-h-[34px] leading-relaxed">
                199 PKR for unlimited use across the platform.
              </p>

              <div className="border-t border-[var(--border)] pt-4 flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-2.5">
                  {[
                    'Unlimited practice tests and sprint drills',
                    'Unlimited Boardy AI questions with step derivations',
                    'Complete subject question banks unlocked',
                    'Detailed chapter weakness diagnostics and mistake curves',
                    'Unlimited public Grand Line & Arena tests',
                    'Priority support desk via WhatsApp & Email',
                  ].map(feature => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--text)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)]/60 text-[11px] text-[var(--muted)] leading-snug">
                  Pay locally: JazzCash, EasyPaisa, SadaPay, or Bank Transfer.
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link to="/signup" className="btn-red w-full">
                Get Unlimited
              </Link>
            </div>
          </Card>

          {/* Koban Pack Card */}
          <Card className="h-full flex flex-col justify-between">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between min-h-[26px] mb-3">
                <Badge color="muted">Koban Pack</Badge>
                <div className="flex items-center gap-1 text-xs text-[#E8A317] font-semibold">
                  <KobanIcon size={14} />
                  <span>500 Kobans</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-doto">50 PKR</span>
              </div>

              <p className="text-xs text-[var(--muted)] mb-4 min-h-[34px] leading-relaxed">
                50 PKR for 500 kobans. Kobans are used to customize your profile.
              </p>

              <div className="border-t border-[var(--border)] pt-4 flex-1">
                <div className="flex flex-col gap-2.5">
                  {[
                    '50 PKR for 500 kobans to personalize your student profile',
                    'Unlock dot-matrix avatar frames in the Store',
                    'Equip animated student nameplates',
                    'Collect rising profile card aura effects',
                    '100% aesthetic with zero unfair academic advantage',
                    'Purchased Kobans never expire in your student wallet',
                  ].map(feature => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--muted)] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A317] shrink-0 mt-1.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link to="/store" className="btn-outline w-full">
                Explore Store &amp; Kobans
              </Link>
            </div>
          </Card>
        </div>

        {/* Link to /pricing */}
        <div className="text-center mt-8">
          <Link
            to="/pricing"
            className="btn-outline inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-5 rounded-full"
          >
            <span>View complete pricing guide &amp; local payment instructions</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
