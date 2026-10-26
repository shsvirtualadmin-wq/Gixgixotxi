import { Link } from 'react-router-dom';
import { Cpu, MessageSquare, Calculator, Users, Flame } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { MathText } from '../ui/MathText';

export function FeaturesGrid() {
  return (
    <section id="features" className="landing-section relative">
      <div className="boardly-container">
        {/* Section Header */}
        <div className="section-header">
          <Badge color="muted">Platform Capabilities</Badge>
          <h2>Engineered for Student Excellence</h2>
          <p>
            Every feature is calibrated to help students master core subjects, build consistent practice habits, and learn together with clear derivations.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Card 1: KaTeX Derivations (Spans 2 cols) */}
          <Card className="md:col-span-2 h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="icon-tile">
                <Calculator size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  KaTeX Derivation Engine
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  No more blurry screenshots or cryptic notation. Every math and physics explanation is formatted with pure LaTeX derivations so you see exactly how terms cancel.
                </p>
              </div>

              {/* Live Math Demo */}
              <div
                className="p-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] space-y-1.5 select-text"
              >
                <div className="text-xs font-medium text-[var(--muted)]">
                  Sample solution step:
                </div>
                <div
                  className="py-1 overflow-x-auto text-center text-[var(--text)]"
                  style={{ color: 'var(--text)' }}
                >
                  <MathText block text={'$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$'} />
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
              <span>Formulas and step derivations verified in KaTeX</span>
            </div>
          </Card>

          {/* Card 2: Boardly Commons */}
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="icon-tile">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Boardly Commons
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  An open student community to share study material free with no limits, talk to the whole community, talk anonymously, and message peers directly to solve doubts together.
                </p>
              </div>
              {/* Callout with 3px red accent bar */}
              <div
                className="p-3.5 rounded-[10px] border border-[var(--border)] border-l-[3px] border-l-[var(--red)] bg-[var(--surface-muted)] text-[var(--text)]"
              >
                <span className="text-xs font-medium text-[var(--text)] leading-relaxed block">
                  Free, unlimited sharing and peer learning for everyone.
                </span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <Link
                to="/commons/about"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--red)] hover:underline focus:underline focus:outline-hidden transition-colors w-fit"
              >
                <span>Learn more about Commons</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Card>

          {/* Card 3: Boardy AI Tutor */}
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="icon-tile">
                <Cpu size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Boardy 24/7 AI Tutor
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Stuck on a tricky organic reaction or vector projection? Ask Boardy. Step-by-step guidance without giving away the answer upfront.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              Powered by server-verified edge intelligence.
            </div>
          </Card>

          {/* Card 4: Study Circles & Squads */}
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="icon-tile">
                <Users size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Study Squads
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Form collaborative study squads of up to 30 classmates with private 6-character room codes. Compare solve times, coordinate drills, and track streaks.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <Link to="/crew" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--red)] hover:underline">
                <span>Learn more about Study Squads</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Card>

          {/* Card 5: Daily Drills & Streak */}
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="icon-tile">
                <Flame size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)] mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  PKT Midnight Resets
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  No awkward midday quota refreshes. All daily drill allowances refresh precisely at midnight Pakistan Standard Time (Asia/Karachi).
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              Keep your streak alive during late-night study sessions.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
