import { Cpu, Target, Calculator, Users, Flame } from 'lucide-react';
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
          <h2>Engineered for Entrance Excellence</h2>
          <p>
            Every feature is calibrated around the real challenges of Pakistani entrance tests — negative marking, speed calculation, and dense formulas.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: KaTeX Derivations (Spans 2 cols) */}
          <Card className="md:col-span-2 justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
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
                  No more blurry screenshots or cryptic notation. Every physics and calculus explanation is formatted with pure LaTeX derivations so you see exactly how terms cancel.
                </p>
              </div>

              {/* Live Math Demo */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[var(--border)] text-sm space-y-2">
                <div className="text-xs text-[var(--muted)]">Sample solution step:</div>
                <div className="text-[var(--text)]">
                  <MathText block>
                    {'$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$'}
                  </MathText>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
              <span>Over 3,000+ formulas verified and normalized</span>
            </div>
          </Card>

          {/* Card 2: Negative Marking */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Target size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Actual Exam Rules
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Test yourself under real conditions — FAST-NUCES 0.25 negative marking, NET time-per-question constraints, and GIKI penalty rules.
              </p>
            </div>
            <div className="mt-5 p-3 rounded-xl bg-[#1A1A1A] border border-[var(--border)] text-xs text-[var(--text)]">
              Stop losing aggregate to careless wild guesses.
            </div>
          </Card>

          {/* Card 3: Boardy AI Tutor */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
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
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Study Circles
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Create private sprint squads with friends using a 6-character room code. Compete on daily drill quotas and compare weak subtopics.
              </p>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              Join peer circles across Pakistan.
            </div>
          </Card>

          {/* Card 5: Daily Drills & Streak */}
          <Card className="justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
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
