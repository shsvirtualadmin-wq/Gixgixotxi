import { Compass, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const STEPS = [
  {
    step: '01',
    title: 'Pick Your Target Test',
    description:
      'Choose your target university (FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT) and your planned test date. Boardly customizes your question weights and countdown.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'Drill High-Yield Sprints',
    description:
      'Practice 10-minute micro-sprints or full past papers with authentic negative marking. If stuck, inspect step-by-step KaTeX derivations and ask Boardy AI.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Secure Your Aggregate',
    description:
      'Track chapter accuracy on your dashboard. Use the Merit Meter to simulate your Matric, FSc, and entrance score requirements for your desired engineering or CS discipline.',
    icon: TrendingUp,
  },
];

export function HowItWorks() {
  return (
    <section className="landing-section relative">
      <div className="boardly-container">
        {/* Centered section header */}
        <div className="section-header">
          <Badge color="muted">Simple 3-Step Strategy</Badge>
          <h2>How Boardly Works</h2>
          <p>
            No endless unorganized PDF drives. A structured study pipeline engineered to maximize your marks in minimum time.
          </p>
        </div>

        {/* 3 cards: no fixed height or min-height, equal height only on desktop via items-stretch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className="justify-between"
              >
                <div>
                  {/* Top row: number in dot font, icon box top-right */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-doto text-[40px] leading-none font-bold text-[var(--text-muted)]"
                    >
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#FFFFFF] shrink-0">
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3
                    className="text-xl font-bold text-[var(--text)] mb-2"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Step X of 3 at the bottom after a 1px divider */}
                <div
                  className="mt-auto pt-4 border-t border-[var(--border)] text-[13px] text-[var(--text-muted)] font-medium"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Step {idx + 1} of 3
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
