import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { getGlobalGrandLineTopScorers } from '@/services/ambassadorTestService';

interface TopScorer {
  name: string;
  score: number;
}

export function ArenaStrip() {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getGlobalGrandLineTopScorers(4);
        setTopScorers(list);
      } catch {
        setTopScorers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="grand-line" className="landing-section relative">
      <div className="boardly-container">
        {/* Grand Line Banner Card */}
        <div
          className="p-6 sm:p-8 rounded-[14px] bg-[var(--card)] border border-[var(--red)] relative"
          style={{ boxShadow: 'none' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Column: Event info */}
            <div className="flex flex-col items-start text-left gap-3.5">
              <Badge color="red-outline" dot>
                Grand Line
              </Badge>

              <h2
                className="font-dot font-extrabold text-[var(--text)] tracking-tight leading-tight"
                style={{
                  fontFamily: 'var(--font-dot)',
                  letterSpacing: '0.01em',
                  fontWeight: 800,
                  fontSize: 'clamp(22px, 3.2vw, 32px)',
                }}
              >
                Grand Line: Public Tests by Nakama Captains
              </h2>

              <p className="text-sm sm:text-[15px] text-[var(--muted)] leading-relaxed">
                Take tests created by Nakama Captains from across Pakistan. Enter your name and Gmail, take the test, and see where you rank.
              </p>

              <div className="pt-1 w-full sm:w-auto">
                <Link to="/grand-line" className="btn-red w-full sm:w-auto group">
                  <span>Browse Grand Line</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Column: Live Leaderboard Preview */}
            <div>
              <div className="p-4 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border)]">
                  <span
                    className="font-semibold text-[var(--text)] flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                    Grand Line Top Scorers
                  </span>
                  <span
                    className="text-[var(--muted)] text-xs"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Live standings
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-[var(--muted)]">
                    Loading standings...
                  </div>
                ) : topScorers.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {topScorers.map((student, idx) => (
                      <div
                        key={idx + student.name}
                        className="px-3.5 py-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-doto font-bold text-sm text-[var(--text)] w-6 text-left shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div
                            className="font-semibold text-[var(--text)]"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {student.name}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-doto font-bold text-sm text-[var(--text)]">
                            {student.score} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 px-4 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-center space-y-2">
                    <div className="w-10 h-10 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--red)]">
                      <Trophy size={18} />
                    </div>
                    <div className="text-xs font-semibold text-[var(--text)]">
                      No attempts yet. Be the first.
                    </div>
                    <p className="text-[11px] text-[var(--muted)] max-w-xs mx-auto">
                      Nakama Captains publish tests on Grand Line anytime.
                    </p>
                  </div>
                )}

                <div className="pt-1 text-center">
                  <span className="text-[11px] text-[var(--muted)]">
                    Real-time rankings from public Grand Line test attempts.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
