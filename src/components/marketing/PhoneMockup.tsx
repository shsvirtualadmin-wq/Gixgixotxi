import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Award,
  Users,
  Copy,
  Check,
  Zap,
  Target,
  Trophy,
  ArrowRight,
  Sparkles,
  BookOpen,
  Share2,
} from 'lucide-react';

export type MockupScreen = 'student' | 'crew' | 'captain' | 'arena';

export interface PhoneMockupProps {
  initialScreen?: MockupScreen;
  className?: string;
  autoPlay?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  initialScreen = 'student',
  className = '',
  autoPlay = true,
}) => {
  const [activeScreen, setActiveScreen] = useState<MockupScreen>(initialScreen);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt tracking
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-cycle across 4 screens unless hovered
  useEffect(() => {
    if (!autoPlay || isHovered) return;
    const screens: MockupScreen[] = ['student', 'crew', 'captain', 'arena'];
    const timer = setInterval(() => {
      setActiveScreen((prev) => {
        const nextIdx = (screens.indexOf(prev) + 1) % screens.length;
        return screens[nextIdx];
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Mild tilt within +-6 degrees
    setTilt({
      x: -(y / (rect.height / 2)) * 5,
      y: (x / (rect.width / 2)) * 5,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {/* Outer Floating Shell */}
      <div className="animate-phone-float relative mx-auto w-[330px] sm:w-[350px]">
        {/* Soft Ambient Glow under Phone */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-[#2F6BFF]/25 via-[#7C5CFF]/20 to-[#22D3EE]/25 blur-3xl -z-10 rounded-[50px] opacity-75" />

        {/* Hardware Frame (Neutral Metallic Study Hardware) */}
        <div className="relative rounded-[44px] p-3.5 bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] border border-white/20 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.25)]">
          {/* Glass Diagonal Reflection Streak */}
          <div className="absolute inset-0 rounded-[44px] overflow-hidden pointer-events-none z-30">
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-white/2 to-transparent rotate-25" />
          </div>

          {/* Screen Bezel */}
          <div className="relative rounded-[34px] bg-[#070B14] overflow-hidden border border-white/10 shadow-inner flex flex-col h-[610px]">
            {/* Top Status & Neutral Camera Pill */}
            <div className="pt-2 px-5 pb-1 flex items-center justify-between z-20 shrink-0">
              <span className="text-[13px] font-bold text-[#A3B0CC] tabular-nums">09:41</span>
              {/* Neutral Centered Camera Pill */}
              <div className="w-16 h-3.5 bg-black/90 rounded-full border border-white/15 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1E293B] border border-white/20" />
              </div>
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-[#22D3EE] border border-white/12">
                Sample preview
              </span>
            </div>

            {/* Screen Content Container */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 relative z-10 text-left">
              {/* SCREEN 1: STUDENT */}
              {activeScreen === 'student' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  {/* Countdown Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#2F6BFF]/20 via-white/5 to-[#22D3EE]/10 border border-[#2F6BFF]/30 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-[#A3B0CC] font-medium mb-1">
                      <span>Target Exam</span>
                      <span className="text-[#22D3EE] font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                        7-Day Streak
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#EAF0FF]">FAST-NU CS Entry Test</h4>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-[#2F6BFF]/30 border border-[#2F6BFF]/50 text-[#EAF0FF] font-bold text-xs tabular-nums">
                        24 Days
                      </div>
                      <div className="text-[13px] text-[#A3B0CC]">remaining until exam day</div>
                    </div>
                  </div>

                  {/* Daily Drill Progress */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[#EAF0FF]">Daily Practice Sprint</span>
                      <span className="text-xs font-bold text-[#22D3EE] tabular-nums">15 / 20 MCQs</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/8 rounded-full overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE] w-[75%] transition-all duration-700" />
                    </div>
                    <p className="text-[13px] text-[#A3B0CC] mt-2">
                      Physics: Vectors & Rectangular Components
                    </p>
                  </div>

                  {/* Subject Strengths Radar Bars */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md flex flex-col gap-2.5">
                    <span className="text-[13px] font-bold text-[#EAF0FF]">Subject Mastery</span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#A3B0CC]">Mathematics</span>
                        <span className="text-[#34D399] font-bold tabular-nums">92%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-[#34D399] rounded-full w-[92%]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#A3B0CC]">Physics</span>
                        <span className="text-[#22D3EE] font-bold tabular-nums">84%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22D3EE] rounded-full w-[84%]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#A3B0CC]">Analytical Reasoning</span>
                        <span className="text-[#7C5CFF] font-bold tabular-nums">88%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7C5CFF] rounded-full w-[88%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 2: CREW */}
              {activeScreen === 'crew' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  {/* Referral Code Box */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#7C5CFF]/20 via-white/5 to-[#E879F9]/10 border border-[#7C5CFF]/40 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-[#E879F9] font-bold mb-1">
                      <span>Boardly Crew Ambassador</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#7C5CFF]/30 text-white text-[11px]">
                        Active
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <div>
                        <span className="text-[11px] text-[#A3B0CC] block">Your Referral Code</span>
                        <span className="text-base font-extrabold text-[#EAF0FF] font-mono tracking-wider">
                          FAST-BILAL26
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode('FAST-BILAL26')}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#E879F9] text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Share'}
                      </button>
                    </div>
                  </div>

                  {/* Crew Stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-center">
                      <span className="text-xl font-bold text-[#EAF0FF] tabular-nums">42</span>
                      <span className="text-[13px] text-[#A3B0CC] block mt-0.5">Joined Students</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-center">
                      <span className="text-xl font-bold text-[#E879F9] tabular-nums">28</span>
                      <span className="text-[13px] text-[#A3B0CC] block mt-0.5">Tests Completed</span>
                    </div>
                  </div>

                  {/* Rewards Progress */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold text-[#EAF0FF]">
                        Paid Internship Milestone
                      </span>
                      <span className="text-xs font-bold text-[#E879F9] tabular-nums">28 / 50</span>
                    </div>
                    <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#E879F9] w-[56%]" />
                    </div>
                    <span className="text-[13px] text-[#A3B0CC] block mt-2">
                      22 more active test-takers to qualify
                    </span>
                  </div>

                  {/* Unlocked Benefit Pill */}
                  <div className="p-2.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span className="text-[13px] text-[#EAF0FF] font-semibold">
                      30-Day Pro Pass Unlocked
                    </span>
                  </div>
                </div>
              )}

              {/* SCREEN 3: CAPTAIN */}
              {activeScreen === 'captain' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  {/* Captain Hero Badge */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F59E0B]/20 via-white/5 to-[#FB923C]/10 border border-[#F59E0B]/40 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-[#FB923C] font-bold mb-1">
                      <span>Campus Captain</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                        Gold Tier
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#EAF0FF]">FAST-NUCES Islamabad</h4>
                    <div className="mt-2 flex items-center gap-3">
                      <div>
                        <span className="text-[11px] text-[#A3B0CC] block">Campus Rank</span>
                        <span className="text-lg font-extrabold text-[#EAF0FF]">#3 Nationwide</span>
                      </div>
                      <div className="h-8 w-px bg-white/12" />
                      <div>
                        <span className="text-[11px] text-[#A3B0CC] block">Impact Points</span>
                        <span className="text-lg font-extrabold text-[#FB923C] tabular-nums">1,400 Pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Mission */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-bold text-[#EAF0FF]">Active Campus Mission</span>
                      <span className="text-xs font-bold text-[#F59E0B]">+500 Pts</span>
                    </div>
                    <p className="text-[13px] text-[#A3B0CC] leading-relaxed">
                      Host a Sunday FAST Math Sprint for 25 campus batchmates.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] w-[68%]" />
                      </div>
                      <span className="text-xs text-[#EAF0FF] font-bold tabular-nums">17/25</span>
                    </div>
                  </div>

                  {/* Promotional Kit Access */}
                  <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-bold text-[#EAF0FF] block">Captain Promo Kit</span>
                      <span className="text-xs text-[#A3B0CC]">Banners, WhatsApp posts & guides</span>
                    </div>
                    <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-semibold">
                      Open
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 4: ARENA */}
              {activeScreen === 'arena' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  {/* Live Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500/20 via-[#0E1626] to-[#2F6BFF]/20 border border-red-500/30 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
                          Live Arena
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#A3B0CC] tabular-nums">
                        348 Competing
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#EAF0FF]">National NET Mock Sprint</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-[#EAF0FF]">
                        Physics
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-[#EAF0FF]">
                        Mathematics
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-[#22D3EE]">
                        60 MCQs · 90m
                      </span>
                    </div>
                  </div>

                  {/* Arena Live Leaderboard Rows */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-[#A3B0CC] font-bold">
                      <span>Live Standings</span>
                      <span className="text-[#34D399]">Score</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.06] border border-white/8 text-[13px]">
                        <span className="font-bold text-[#EAF0FF] flex items-center gap-1.5">
                          <span className="w-5 text-amber-400 font-extrabold">#1</span>
                          Hamza K.
                        </span>
                        <span className="font-extrabold text-[#34D399] tabular-nums">58 / 60</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] text-[13px]">
                        <span className="font-bold text-[#EAF0FF] flex items-center gap-1.5">
                          <span className="w-5 text-slate-300 font-bold">#2</span>
                          Ayesha M.
                        </span>
                        <span className="font-extrabold text-[#22D3EE] tabular-nums">56 / 60</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] text-[13px]">
                        <span className="font-bold text-[#EAF0FF] flex items-center gap-1.5">
                          <span className="w-5 text-amber-600 font-bold">#3</span>
                          Bilal S.
                        </span>
                        <span className="font-extrabold text-[#EAF0FF] tabular-nums">54 / 60</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 4-Screen Switcher Dock */}
            <div className="p-2 border-t border-white/10 bg-[#0E1626]/90 backdrop-blur-md grid grid-cols-4 gap-1 z-20 shrink-0">
              <button
                onClick={() => setActiveScreen('student')}
                className={`py-2 rounded-xl text-[12px] font-bold transition-all text-center cursor-pointer ${
                  activeScreen === 'student'
                    ? 'bg-[#2F6BFF]/25 text-[#22D3EE] border border-[#2F6BFF]/40 shadow-[0_0_12px_rgba(47,107,255,0.4)]'
                    : 'text-[#6F7C99] hover:text-[#EAF0FF]'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setActiveScreen('crew')}
                className={`py-2 rounded-xl text-[12px] font-bold transition-all text-center cursor-pointer ${
                  activeScreen === 'crew'
                    ? 'bg-[#7C5CFF]/25 text-[#E879F9] border border-[#7C5CFF]/40 shadow-[0_0_12px_rgba(124,92,255,0.4)]'
                    : 'text-[#6F7C99] hover:text-[#EAF0FF]'
                }`}
              >
                Crew
              </button>
              <button
                onClick={() => setActiveScreen('captain')}
                className={`py-2 rounded-xl text-[12px] font-bold transition-all text-center cursor-pointer ${
                  activeScreen === 'captain'
                    ? 'bg-[#F59E0B]/25 text-[#FB923C] border border-[#F59E0B]/40 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'text-[#6F7C99] hover:text-[#EAF0FF]'
                }`}
              >
                Captain
              </button>
              <button
                onClick={() => setActiveScreen('arena')}
                className={`py-2 rounded-xl text-[12px] font-bold transition-all text-center cursor-pointer ${
                  activeScreen === 'arena'
                    ? 'bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'text-[#6F7C99] hover:text-[#EAF0FF]'
                }`}
              >
                Arena
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
