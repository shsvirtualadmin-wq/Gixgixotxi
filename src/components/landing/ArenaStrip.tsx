import { Link } from 'react-router-dom';
import { Trophy, Shield, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const LEADERBOARD_PREVIEW = [
  { rank: 1, name: 'Zaid K.', city: 'Lahore', target: 'FAST CS', score: 98, percentile: '99.8%' },
  { rank: 2, name: 'Ayesha M.', city: 'Islamabad', target: 'NUST SEECS', score: 96, percentile: '99.4%' },
  { rank: 3, name: 'Bilal H.', city: 'Karachi', target: 'NED CS', score: 94, percentile: '98.9%' },
  { rank: 4, name: 'Maryam N.', city: 'Peshawar', target: 'GIKI Eng', score: 92, percentile: '98.1%' },
];

export function ArenaStrip() {
  return (
    <section id="arena" className="py-20 md:py-28 relative">
      <div className="site-container">
        <GlassCard animated className="relative overflow-hidden" style={{ padding: '32px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Event info */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <Badge color="danger">National Competitive Arena</Badge>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Boardly Blitz: <span className="text-gradient">Sunday 8:00 PM PKT</span>
              </h2>

              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Compete against thousands of students across Karachi, Lahore, Islamabad, and beyond under strictly synchronized exam timers. See where your aggregate stands before test day.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[var(--text-faint)]">
                <div className="flex items-center gap-1.5">
                  <Shield size={16} className="text-blue-400 shrink-0" />
                  Anti-cheat auto-submit timer
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy size={16} className="text-amber-400 shrink-0" />
                  Campus bragging rights
                </div>
              </div>

              <div className="pt-2 flex justify-center lg:justify-start">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto group shadow-lg shadow-blue-500/25"
                    style={{ padding: '14px 24px', borderRadius: 12, fontSize: '1rem', fontWeight: 600 }}
                  >
                    Register for Next Blitz
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Col: Live leaderboard mock */}
            <div className="lg:col-span-6 w-full">
              <div className="glass p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm pb-3 border-b border-white/10 gap-3">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400 shrink-0" /> Last Week&apos;s Honor Roll
                  </span>
                  <span className="text-xs text-[var(--text-faint)] font-medium shrink-0">
                    520+ Candidates
                  </span>
                </div>

                <div className="space-y-2.5">
                  {LEADERBOARD_PREVIEW.map(student => (
                    <div
                      key={student.name}
                      className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-center justify-between text-sm min-h-[48px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            student.rank === 1
                              ? 'bg-amber-400 text-black'
                              : student.rank === 2
                              ? 'bg-slate-300 text-black'
                              : student.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {student.rank}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold text-white leading-tight">{student.name}</div>
                          <div className="text-xs text-[var(--text-faint)] leading-tight mt-0.5">
                            {student.city} · {student.target}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <div className="font-bold text-cyan-400 tabular-nums text-sm">
                          {student.score}/100
                        </div>
                        <div className="text-xs text-emerald-400 font-medium">{student.percentile}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <span className="text-[11px] text-[var(--text-faint)]">
                    Participant privacy protected via masked initials.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
