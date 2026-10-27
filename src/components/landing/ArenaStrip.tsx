import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { getGlobalGrandLineTopScorers } from '@/services/ambassadorTestService';

interface TopScorer {
  name: string;
  score: number;
}

export function ArenaStrip() {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="grand-line"
      ref={sectionRef}
      className="relative py-14 sm:py-20 lg:py-28 cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      <div className="boardly-container">
        <div className="relative">
          {/* Ambient red & dark radial glow behind and around the floating card */}
          <div
            className="absolute -inset-4 sm:-inset-10 -z-10 pointer-events-none opacity-85"
            aria-hidden="true"
          >
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,rgba(215,25,33,0.06)_45%,rgba(255,255,255,0.02)_65%,transparent_75%)]" />
          </div>

          {/* Outer Floating Glass Panel with red accent border, internal radial glow and deep layered shadows */}
          <div
            className={`relative overflow-hidden rounded-[26px] sm:rounded-[36px] lg:rounded-[40px] p-7 sm:p-10 lg:p-14 border border-[#D71921]/45 bg-[#0e0e13]/92 shadow-[0_24px_55px_-12px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.14)] transition-all duration-500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-2'
            }`}
          >
            {/* Subtle internal red radial gradient so the box stands out elegantly as the key block */}
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(215,25,33,0.12)_0%,transparent_70%)] pointer-events-none -z-0"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
              {/* Left Column: Event info */}
              <div className="flex flex-col items-start text-left gap-4">
                {/* Grand Line chip */}
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-heading tracking-wide text-white/90 bg-white/[0.05] border border-[#D71921]/40 shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0"
                    aria-hidden="true"
                  />
                  Grand Line
                </span>

                {/* Pixel heading */}
                <h2
                  className="font-dot font-extrabold text-white tracking-tight leading-tight"
                  style={{
                    fontFamily: 'var(--font-dot)',
                    letterSpacing: '0.01em',
                    fontWeight: 800,
                    fontSize: 'clamp(24px, 3.4vw, 34px)',
                  }}
                >
                  Grand Line: Public Tests by Nakama Captains
                </h2>

                {/* Paragraph */}
                <p className="text-sm sm:text-[15px] text-[var(--muted)] leading-relaxed max-w-xl">
                  Take tests created by Nakama Captains from across Pakistan. Enter your name and Gmail, take the test, and see where you rank.
                </p>

                {/* Browse Grand Line Button */}
                <div className="pt-2 w-full sm:w-auto">
                  <Link
                    to="/grand-line"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white font-semibold text-sm tracking-wide font-heading shadow-[0_6px_20px_rgba(215,25,33,0.4)] hover:shadow-[0_8px_24px_rgba(215,25,33,0.55)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group w-full sm:w-auto"
                  >
                    <span>Browse Grand Line</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Live Leaderboard Preview */}
              <div className="w-full">
                {/* Inner floating glass panel with very slow subtle idle float */}
                <div className="animate-float-2 p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-[#0a0a0e]/75 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col gap-3.5">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                    <span
                      className="font-semibold text-white flex items-center gap-2 font-heading tracking-tight"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.9)] shrink-0" />
                      Grand Line Top Scorers
                    </span>
                    <span
                      className="text-[var(--muted)] text-xs font-heading"
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
                          className="px-3.5 py-3 rounded-[14px] bg-white/[0.04] border border-white/8 hover:border-white/15 transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-doto font-bold text-sm text-white/90 w-6 text-left shrink-0">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div
                              className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {student.name}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-doto font-bold text-sm text-white">
                              {student.score} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-[20px] sm:rounded-[24px] bg-white/[0.03] border border-white/8 text-center space-y-2.5">
                      <div className="w-11 h-11 rounded-[16px] bg-white/[0.05] border border-white/10 mx-auto flex items-center justify-center text-[#D71921] shadow-[0_0_15px_rgba(215,25,33,0.3)] animate-float-1">
                        <Trophy size={19} />
                      </div>
                      <div className="text-xs font-semibold text-white font-heading">
                        No attempts yet. Be the first.
                      </div>
                      <p className="text-[11px] text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
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
      </div>
    </section>
  );
}
