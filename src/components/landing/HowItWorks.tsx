import { Compass, Zap, TrendingUp } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

const STEPS = [
  {
    step: '01',
    title: 'Pick Your Target Test',
    description:
      'Choose your target university (FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT) and your planned test date. Boardly customizes your question weights and countdown.',
    icon: Compass,
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    step: '02',
    title: 'Drill High-Yield Sprints',
    description:
      'Practice 10-minute micro-sprints or full past papers with authentic negative marking. If stuck, inspect step-by-step KaTeX derivations and ask Boardy AI.',
    icon: Zap,
    accent: 'from-purple-500 to-pink-500',
  },
  {
    step: '03',
    title: 'Secure Your Aggregate',
    description:
      'Track chapter accuracy on your dashboard. Use the Merit Meter to simulate your Matric, FSc, and entrance score requirements for your desired engineering or CS discipline.',
    icon: TrendingUp,
    accent: 'from-amber-500 to-orange-400',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="site-container">
        <div className="section-header">
          <Badge color="violet">Simple 3-Step Strategy</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            How Boardly Works
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl">
            No endless unorganized PDF drives. A structured study pipeline engineered to maximize your marks in minimum time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard
                key={item.step}
                hover
                className="relative flex flex-col justify-between h-full"
                style={{ padding: '28px' }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-[var(--text-faint)]/40 tabular-nums">
                      {item.step}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.accent} p-0.5 flex items-center justify-center shrink-0`}
                    >
                      <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center text-white">
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--border)] text-xs font-medium text-[var(--text-faint)]">
                  Step {idx + 1} of 3
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
