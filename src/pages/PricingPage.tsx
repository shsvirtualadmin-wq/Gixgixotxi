import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Check, X } from 'lucide-react';

const COMPARISON_ROWS = [
  { feature: 'Daily Practice Sprints', free: '3 / day', pro: 'Unlimited' },
  { feature: 'Boardy AI Questions', free: '10 / day', pro: '100 / day' },
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
    <div className="pt-24 pb-20 page-enter space-y-16">
      <PricingSection />

      {/* Feature Comparison Table */}
      <div className="site-container space-y-6">
        <div className="text-center space-y-2">
          <Badge color="brand">Detailed Comparison</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Free vs Pro Comparison
          </h2>
        </div>

        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-white/[0.02]">
                <th className="p-4 sm:p-5 font-bold text-white">Feature</th>
                <th className="p-4 sm:p-5 font-bold text-[var(--text-muted)] text-center">Free Starter</th>
                <th className="p-4 sm:p-5 font-bold text-cyan-400 text-center">Pro Tier (PKR 199/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {COMPARISON_ROWS.map(row => (
                <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 sm:p-5 text-white font-medium">{row.feature}</td>
                  <td className="p-4 sm:p-5 text-center text-[var(--text-muted)]">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check size={18} className="text-blue-400 mx-auto" />
                      ) : (
                        <X size={18} className="text-[var(--text-faint)] mx-auto opacity-40" />
                      )
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-white font-semibold">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check size={18} className="text-cyan-400 mx-auto" />
                      ) : (
                        <X size={18} className="text-[var(--text-faint)] mx-auto opacity-40" />
                      )
                    ) : (
                      row.pro
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

      <FaqSection />
    </div>
  );
}

export default PricingPage;
