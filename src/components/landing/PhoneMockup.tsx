import { useState, useEffect, useRef } from 'react';
import { Award, Clock, Flame } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface PhoneMockupProps {
  screen?: 0 | 1 | 2 | 3;
  onScreenChange?: (screen: 0 | 1 | 2 | 3) => void;
  interactive?: boolean;
  /** Reduce phone height for compact/embedded display */
  compact?: boolean;
  /** Start the internal carousel on a given screen index */
  initialScreen?: 0 | 1 | 2 | 3;
}

export function PhoneMockup({
  screen: externalScreen,
  onScreenChange,
  interactive = true,
  compact = false,
  initialScreen = 0,
}: PhoneMockupProps) {
  const [internalScreen, setInternalScreen] = useState<0 | 1 | 2 | 3>(initialScreen);
  const activeScreen = externalScreen !== undefined ? externalScreen : internalScreen;

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto advance screens if not controlled externally and not hovering
  useEffect(() => {
    if (externalScreen !== undefined) return;
    const interval = setInterval(() => {
      setInternalScreen(prev => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [externalScreen]);

  // Arena reorder ticker simulation
  const [arenaTick, setArenaTick] = useState(0);
  useEffect(() => {
    if (activeScreen !== 3) return;
    const interval = setInterval(() => {
      setArenaTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeScreen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 8;
    const rotateX = -(y / (rect.height / 2)) * 8;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const setScreen = (idx: 0 | 1 | 2 | 3) => {
    if (onScreenChange) onScreenChange(idx);
    else setInternalScreen(idx);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="relative will-change-transform"
      >
        {/* Outer Phone Shell */}
        <div
          className={`relative rounded-[40px] p-2.5 shadow-2xl border border-white/20 will-change-transform ${compact ? 'w-[240px] h-[480px]' : 'w-[265px] sm:w-[280px] h-[550px]'}`}
          style={{
            maxHeight: '560px',
            aspectRatio: '9 / 19',
            background: 'linear-gradient(135deg, #2a2a3e 0%, #151928 50%, #2a2a3e 100%)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Inner Screen */}
          <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-[#070B14] flex flex-col border border-white/10">
            {/* Dynamic Island / Speaker Pill */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-[#151928] border border-white/20" />
            </div>

            {/* Top Sample Preview Pill */}
            <div className="pt-9 pb-2 px-4 flex items-center justify-between border-b border-white/10 bg-[#0E1626]/80 backdrop-blur-md z-20">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold tracking-wide text-white/90">
                  {activeScreen === 0 && 'Cockpit'}
                  {activeScreen === 1 && 'Crew Link'}
                  {activeScreen === 2 && 'Captain'}
                  {activeScreen === 3 && 'Live Arena'}
                </span>
              </div>
              <Badge color="violet" className="text-[10px] px-2 py-0.5">
                Sample preview
              </Badge>
            </div>

            {/* Screen Content Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-left">
              {/* SCREEN 0: Student Cockpit */}
              {activeScreen === 0 && (
                <div className="space-y-3 animate-[page-enter_0.3s_ease-out]">
                  {/* Countdown Card */}
                  <div className="glass p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold">
                        Target: FAST-NUCES
                      </span>
                      <div className="text-xl font-bold text-white tabular-nums">42d 14h 28m</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                  </div>

                  {/* Daily Drill Progress */}
                  <div className="glass p-3 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white font-medium flex items-center gap-1">
                        <Flame size={14} className="text-amber-400" /> 7-Day Streak
                      </span>
                      <span className="text-[var(--text-muted)] tabular-nums">18 / 25 MCQs</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-[72%]" />
                    </div>
                  </div>

                  {/* Weak Chapters */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[var(--text-faint)] font-medium">
                      Priority Chapters
                    </span>
                    <div className="glass p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="text-white font-medium">Integration by Parts</div>
                        <div className="text-[10px] text-amber-400">Accuracy: 48%</div>
                      </div>
                      <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-medium">
                        Practice
                      </span>
                    </div>
                    <div className="glass p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="text-white font-medium">Rotational Dynamics</div>
                        <div className="text-[10px] text-red-400">Accuracy: 36%</div>
                      </div>
                      <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-medium">
                        Practice
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 1: Crew Ambassador */}
              {activeScreen === 1 && (
                <div className="space-y-3 animate-[page-enter_0.3s_ease-out]">
                  <div className="glass p-3.5 rounded-2xl text-center">
                    <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold">
                      Your Ambassador Code
                    </span>
                    <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-wider my-1">
                      BOARDLY-FAST26
                    </div>
                    <button className="text-[11px] w-full py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/30 transition-colors">
                      Copy Link &amp; Share
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="glass p-3 rounded-xl text-center">
                      <div className="text-xl font-bold text-white tabular-nums">34</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Referred</div>
                    </div>
                    <div className="glass p-3 rounded-xl text-center">
                      <div className="text-xl font-bold text-emerald-400 tabular-nums">28</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Active Aspirants</div>
                    </div>
                  </div>

                  <div className="glass p-3 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-medium">Internship Unlock</span>
                      <span className="text-purple-400 font-bold">28 / 30</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[93%]" />
                    </div>
                    <div className="text-[10px] text-[var(--text-faint)] mt-1.5">
                      2 more active referrals to unlock Stipend Tier.
                    </div>
                  </div>

                  {/* Recent referrals list */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-faint)] font-semibold uppercase tracking-wider">
                      <span>Recent Aspirants</span>
                      <span className="text-emerald-400">Live</span>
                    </div>
                    {[
                      { name: 'Hamza S.', campus: 'FAST CS', status: 'Active Mock' },
                      { name: 'Ayesha K.', campus: 'NUST SEECS', status: 'Verified' },
                      { name: 'Zainab R.', campus: 'GIKI Eng', status: 'Active Sprint' },
                    ].map(ref => (
                      <div key={ref.name} className="glass p-2 rounded-xl flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-white font-medium">{ref.name}</div>
                          <div className="text-[9px] text-[var(--text-faint)]">{ref.campus}</div>
                        </div>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {ref.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SCREEN 2: Campus Captain */}
              {activeScreen === 2 && (
                <div className="space-y-3 animate-[page-enter_0.3s_ease-out]">
                  <div className="glass p-3.5 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Award size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">NUST H-12 Wing</div>
                      <div className="text-[10px] text-amber-400 font-semibold">Tier: Gold Commander</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="glass p-2 rounded-xl">
                      <div className="text-sm font-bold text-white">#4</div>
                      <div className="text-[9px] text-[var(--text-muted)]">Campus</div>
                    </div>
                    <div className="glass p-2 rounded-xl">
                      <div className="text-sm font-bold text-amber-400">1,420</div>
                      <div className="text-[9px] text-[var(--text-muted)]">Points</div>
                    </div>
                    <div className="glass p-2 rounded-xl">
                      <div className="text-sm font-bold text-white">92</div>
                      <div className="text-[9px] text-[var(--text-muted)]">Students</div>
                    </div>
                  </div>

                  <div className="glass p-3 rounded-2xl space-y-2">
                    <span className="text-[11px] text-white font-semibold">Weekly Missions</span>
                    <div className="text-xs flex items-center justify-between text-[var(--text-muted)]">
                      <span>Distribute 50 Mock Passes</span>
                      <span className="text-emerald-400 font-bold">Done</span>
                    </div>
                    <div className="text-xs flex items-center justify-between text-[var(--text-muted)]">
                      <span>Host Batch Study Circle</span>
                      <span className="text-amber-400">1/2</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 3: Live Arena */}
              {activeScreen === 3 && (
                <div className="space-y-3 animate-[page-enter_0.3s_ease-out]">
                  <div className="glass p-3 rounded-2xl flex items-center justify-between bg-gradient-to-r from-red-500/10 to-amber-500/10 border-red-500/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-bold text-red-400 tracking-wider">
                        BLITZ MOCK #14
                      </span>
                    </div>
                    <span className="text-[10px] text-white/80 tabular-nums">482 Live</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold">
                      Live Rankings (Simulated)
                    </span>
                    {(arenaTick % 2 === 0
                      ? [
                          { rank: 1, name: 'Zaid K.', score: '98/100', school: 'Lahore' },
                          { rank: 2, name: 'Areeba S.', score: '96/100', school: 'Karachi' },
                          { rank: 3, name: 'Hamza N.', score: '94/100', school: 'Islamabad' },
                          { rank: 4, name: 'Mustafa R.', score: '91/100', school: 'Rawalpindi' },
                        ]
                      : [
                          { rank: 1, name: 'Areeba S.', score: '99/100', school: 'Karachi' },
                          { rank: 2, name: 'Zaid K.', score: '98/100', school: 'Lahore' },
                          { rank: 3, name: 'Mustafa R.', score: '95/100', school: 'Rawalpindi' },
                          { rank: 4, name: 'Hamza N.', score: '94/100', school: 'Islamabad' },
                        ]
                    ).map(row => (
                      <div
                        key={row.name}
                        className="glass px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all duration-300"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              row.rank === 1
                                ? 'bg-amber-400 text-black'
                                : row.rank === 2
                                ? 'bg-slate-300 text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {row.rank}
                          </span>
                          <div>
                            <span className="text-white font-medium">{row.name}</span>
                            <span className="text-[10px] text-[var(--text-faint)] block leading-none">
                              {row.school}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-cyan-400 tabular-nums">{row.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar indicator */}
            <div className="py-2 flex justify-center bg-[#070B14]">
              <div className="w-24 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Screen Selection Tabs below phone */}
      <div className="flex items-center justify-between gap-1 mt-4 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full w-full max-w-[290px]">
        {(['Cockpit', 'Crew', 'Captain', 'Arena'] as const).map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => setScreen(idx as 0 | 1 | 2 | 3)}
            aria-pressed={activeScreen === idx}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer text-center ${
              activeScreen === idx
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
