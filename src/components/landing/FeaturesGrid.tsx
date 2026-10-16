import { Cpu, Target, Calculator, Users, Flame } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { MathText } from '../ui/MathText';

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <Badge color="brand">Platform Capabilities</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text)]">
            Engineered for <span className="text-gradient">Entrance Excellence</span>
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl">
            Every feature is calibrated around the real challenges of Pakistani entrance tests — negative marking, speed calculation, and dense formulas.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: KaTeX Derivations (Spans 2 cols) */}
          <GlassCard hover className="md:col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Calculator size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">KaTeX Derivation Engine</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  No more blurry screenshots or cryptic notation. Every physics and calculus explanation is formatted with pure LaTeX derivations so you see exactly how terms cancel.
                </p>
              </div>

              {/* Live Math Demo */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-sm space-y-2">
                <div className="text-xs text-[var(--text-faint)]">Sample Solution Step:</div>
                <div className="text-blue-300">
                  <MathText block>
                    {'$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$'}
                  </MathText>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-faint)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Over 3,000+ formulas verified and normalized
            </div>
          </GlassCard>

          {/* Card 2: Negative Marking */}
          <GlassCard hover className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Target size={22} />
              </div>
              <h3 className="text-xl font-bold text-white">Actual Exam Rules</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Test yourself under real conditions — FAST-NUCES 0.25 negative marking, NET time-per-question constraints, and GIKI penalty rules.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Stop losing aggregate to careless wild guesses.
            </div>
          </GlassCard>

          {/* Card 3: Boardy AI Tutor */}
          <GlassCard hover className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Cpu size={22} />
              </div>
              <h3 className="text-xl font-bold text-white">Boardy 24/7 AI Tutor</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Stuck on a tricky organic reaction or vector projection? Ask Boardy. Step-by-step guidance without giving away the answer upfront.
              </p>
            </div>
            <div className="mt-4 text-xs text-purple-300">
              Powered by server-verified edge intelligence.
            </div>
          </GlassCard>

          {/* Card 4: Study Circles & Squads */}
          <GlassCard hover className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users size={22} />
              </div>
              <h3 className="text-xl font-bold text-white">Study Circles</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Create private sprint squads with friends using a 6-character room code. Compete on daily drill quotas and compare weak subtopics.
              </p>
            </div>
            <div className="mt-4 text-xs text-emerald-400">
              Join peer circles across Pakistan.
            </div>
          </GlassCard>

          {/* Card 5: Daily Drills & Streak */}
          <GlassCard hover className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Flame size={22} />
              </div>
              <h3 className="text-xl font-bold text-white">PKT Midnight Resets</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                No awkward midday quota refreshes. All daily drill allowances refresh precisely at midnight Pakistan Standard Time (Asia/Karachi).
              </p>
            </div>
            <div className="mt-4 text-xs text-red-300">
              Keep your streak alive during late-night study sessions.
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
