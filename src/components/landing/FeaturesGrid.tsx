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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: KaTeX Derivations (Spans 2 cols) */}
          <Card className="md:col-span-2 justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Calculator size={22} />
              </div>
              <div>
                <h3
                  className="text-xl font-bold text-[var(--text)] mb-2"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  KaTeX Derivation Engine
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  No more blurry screenshots or cryptic notation. Every math and physics explanation is formatted with pure LaTeX derivations so you see exactly how terms cancel.
                </p>
              </div>

              {/* Live Math Demo: Intentional dark panel with explicit white text and clear KaTeX */}
              <div
                className="p-4 rounded-xl border text-sm space-y-2 select-text"
                style={{
                  backgroundColor: '#0A0A0A',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-xs font-medium">
                  Sample solution step:
                </div>
                <div style={{ color: '#FFFFFF' }} className="py-1">
                  <MathText block text={'$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$'} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
              <span>Formulas and step derivations verified in KaTeX</span>
            </div>
          </Card>

          {/* Card 2: Boardly Commons */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <MessageSquare size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Boardly Commons
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                An open student community to share study material free with no limits, talk to the whole community, talk anonymously, and message peers directly to solve doubts together.
              </p>
            </div>
            {/* Callout: solid red #D71921 with white text */}
            <div
              className="mt-5 p-3.5 rounded-xl text-xs font-semibold flex flex-col gap-1.5"
              style={{
                backgroundColor: '#D71921',
                color: '#FFFFFF',
                border: '1px solid #D71921',
              }}
            >
              <span>Free, unlimited sharing and peer learning for everyone.</span>
              <Link to="/commons/about" className="inline-flex items-center gap-1 text-[11px] font-bold underline hover:opacity-90">
                <span>Learn more about Commons</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Card>

          {/* Card 3: Boardy AI Tutor */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Cpu size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Boardy 24/7 AI Tutor
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Stuck on a tricky organic reaction or vector projection? Ask Boardy. Step-by-step guidance without giving away the answer upfront.
              </p>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              Powered by server-verified edge intelligence.
            </div>
          </Card>

          {/* Card 4: Study Circles & Squads */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Study Crew &amp; Squads
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Form collaborative study squads of up to 30 classmates with private 6-character room codes. Compare solve times, coordinate drills, and track streaks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <Link to="/crew" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--red)] hover:underline">
                <span>Learn more about Study Crew</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Card>

          {/* Card 5: Daily Drills & Streak */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Flame size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                PKT Midnight Resets
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                No awkward midday quota refreshes. All daily drill allowances refresh precisely at midnight Pakistan Standard Time (Asia/Karachi).
              </p>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              Keep your streak alive during late-night study sessions.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
