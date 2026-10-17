import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';
import { Badge } from '../components/ui/Badge';
import { Check, X } from 'lucide-react';

const COMPARISON_ROWS = [
  { feature: 'Daily Tests (Practice, Sprints, Papers)', free: '10 / day', pro: 'Unlimited' },
  { feature: 'Boardy AI Questions', free: '5 / day', pro: '100 / day' },
  { feature: 'KaTeX Math Derivations', free: true, pro: true },
  { feature: 'All University Past Papers', free: 'Sample sets', pro: 'Full vaults' },
  { feature: 'Negative Marking Simulation', free: true, pro: true },
  { feature: 'Merit Meter Aggregate Simulator', free: false, pro: true },
  { feature: 'Create Private Study Circles', free: false, pro: true },
  { feature: 'Detailed Weak Topic Heatmaps', free: false, pro: true },
  { feature: 'Ad-Free High Velocity UI', free: true, pro: true },
  { feature: 'Priority Support Channel', free: false, pro: true },
];

export function PricingPage() {
  return (
    <div className="pt-28 pb-20 boardly-container page-enter space-y-16">
      <PricingSection />

      {/* Feature Comparison Table */}
      <div className="space-y-6 max-w-[880px] mx-auto">
        <div className="section-header">
          <Badge color="muted">Detailed Comparison</Badge>
          <h2>Free vs Pro Comparison</h2>
        </div>

        <div className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card-2)]">
                <th className="p-4 sm:p-5 font-bold text-[var(--text)]">Feature</th>
                <th className="p-4 sm:p-5 font-bold text-[var(--muted)] text-center">Free Starter</th>
                <th className="p-4 sm:p-5 font-bold text-[var(--red)] text-center font-doto">Pro Tier (PKR 199/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {COMPARISON_ROWS.map(row => (
                <tr key={row.feature} className="hover:bg-[var(--card-2)] transition-colors">
                  <td className="p-4 sm:p-5 text-[var(--text)] font-medium">{row.feature}</td>
                  <td className="p-4 sm:p-5 text-center text-[var(--muted)]">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check size={18} className="text-[var(--text)] mx-auto" />
                      ) : (
                        <X size={18} className="text-[var(--muted)] mx-auto opacity-40" />
                      )
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[var(--text)] font-semibold">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check size={18} className="text-[var(--red)] mx-auto" />
                      ) : (
                        <X size={18} className="text-[var(--muted)] mx-auto opacity-40" />
                      )
                    ) : (
                      row.pro
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FaqSection />
    </div>
  );
}

export default PricingPage;
