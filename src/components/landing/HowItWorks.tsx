import { Compass, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const STEPS = [
  {
    step: '01',
    title: 'Select Subject & Topics',
    description:
      'Choose from core subjects including Mathematics, Physics, Chemistry, Biology, and Computer Science. Pick chapters to focus on and set your practice length.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'Drill Focused MCQ Sprints',
    description:
      'Practice quick micro-sprints with instant feedback. If stuck, review step-by-step KaTeX derivations and get concept breakdowns from Boardy AI.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Master Weak Chapters & Grow',
    description:
      'Review your detailed accuracy scores across every chapter. Pinpoint your weak topics, maintain your daily practice streak, and build mastery step by step.',
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
            A structured study routine designed to help you practice with clarity, stay consistent, and improve every day.
          </p>
        </div>

        {/* 3 equal-height cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className="h-full flex flex-col justify-between"
              >
                <div>
                  {/* Top row: number in dot font, icon box top-right */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-doto text-[32px] leading-none font-bold text-[var(--text-muted)]"
                    >
                      {item.step}
                    </span>
                    <div className="icon-tile">
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3
                    className="text-lg font-bold text-[var(--text)] mb-1.5"
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
                  className="mt-auto pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-medium"
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
