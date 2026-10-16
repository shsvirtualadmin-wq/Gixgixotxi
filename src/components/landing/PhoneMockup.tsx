import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Trophy, Flame } from 'lucide-react';

interface PhoneMockupProps {
  screen?: 0 | 1 | 2 | 3;
  onScreenChange?: (screen: 0 | 1 | 2 | 3) => void;
}

export function PhoneMockup({
  screen: externalScreen,
  onScreenChange,
}: PhoneMockupProps) {
  const [internalScreen, setInternalScreen] = useState<0 | 1 | 2 | 3>(0);
  const activeScreen = externalScreen !== undefined ? externalScreen : internalScreen;

  // Auto advance screens only if not controlled externally
  useEffect(() => {
    if (externalScreen !== undefined) return;
    const interval = setInterval(() => {
      setInternalScreen(prev => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [externalScreen]);

  const handleSelectScreen = (idx: 0 | 1 | 2 | 3) => {
    if (onScreenChange) onScreenChange(idx);
    else setInternalScreen(idx);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[340px] mx-auto">
      {/* Phone Shell: Width min(300px, 78vw), aspect-ratio 9/19, centered, 24px space below */}
      <div
        className="relative rounded-[36px] p-2 bg-[#000000] border border-[#2A2A2A] mb-6 shrink-0"
        style={{
          width: 'min(300px, 78vw)',
          aspectRatio: '9 / 19',
          maxHeight: '560px',
          boxShadow: 'none',
        }}
      >
        {/* Screen Bezel & Container */}
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-[#0A0A0A] flex flex-col justify-between border border-[#1F1F1F]">
          {/* Top Notch / Dynamic Pill */}
          <div className="pt-2 px-3.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-[var(--muted)] font-doto">09:41</span>
            <div className="w-16 h-3 bg-[#000000] rounded-full border border-[#222222]" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
              <span className="text-[9px] font-bold text-[var(--muted)] font-doto">5G</span>
            </div>
          </div>

          {/* Screen Content Body: Render immediately, full opacity, no delayed state */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col justify-between">
            {/* SCREEN 0: COCKPIT */}
            {activeScreen === 0 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Target Countdown */}
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-0.5">
                    <span>Target Test</span>
                    <span className="text-[var(--red)] font-semibold">FAST-NUCES CS</span>
                  </div>
                  <div className="text-base font-bold text-[#F2F2F2] font-doto tracking-tight">
                    42d 14h 28m
                  </div>
                </div>

                {/* Streak Dots & Daily Limit Ring */}
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-[10px] mb-1.5 text-[#F2F2F2] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                      <span>7-Day Streak</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              idx < 5 ? 'bg-[var(--red)]' : 'bg-[#2A2A2A]'
                            }`}
                          />
                          <span className="text-[7px] text-[var(--muted)]">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Limit Ring */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="w-11 h-11 rounded-full border-2 border-[var(--red)] border-t-[#2A2A2A] flex flex-col items-center justify-center">
                      <span className="font-doto text-[10px] font-bold text-[#F2F2F2]">18</span>
                      <span className="text-[6px] text-[var(--muted)]">/25</span>
                    </div>
                    <span className="text-[7px] text-[var(--muted)] mt-0.5">Daily Ring</span>
                  </div>
                </div>

                {/* 2 Priority Chapters with Practice buttons */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                    Priority Chapters
                  </span>
                  <div className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-between text-[10px]">
                    <div className="truncate max-w-[110px]">
                      <div className="text-[#F2F2F2] font-medium truncate">Integration by Parts</div>
                      <div className="font-doto text-[var(--muted)] text-[9px]">48% Accuracy</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[var(--red)] text-[#FFFFFF]">
                      Practice
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-between text-[10px]">
                    <div className="truncate max-w-[110px]">
                      <div className="text-[#F2F2F2] font-medium truncate">Electromagnetism</div>
                      <div className="font-doto text-[var(--muted)] text-[9px]">54% Accuracy</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[var(--red)] text-[#FFFFFF]">
                      Practice
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 1: CREW */}
            {activeScreen === 1 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Alpha Squad Sprint */}
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-[var(--muted)] uppercase font-semibold">
                      Alpha Squad Sprint
                    </span>
                    <div className="text-base font-bold text-[#F2F2F2] font-doto">
                      210 <span className="text-[10px] text-[var(--muted)]">/ 300 MCQs</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--red)] border-t-[#2A2A2A] flex items-center justify-center font-doto text-[10px] font-bold text-[#F2F2F2]">
                    70%
                  </div>
                </div>

                {/* Squad Members */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                    Crew Members
                  </span>
                  {[
                    { name: 'You (Lead)', score: '84 MCQs' },
                    { name: 'Hamza A.', score: '68 MCQs' },
                    { name: 'Fatima R.', score: '58 MCQs' },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 px-2 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-between text-[10px]"
                    >
                      <span className="text-[#F2F2F2] font-medium">{m.name}</span>
                      <span className="font-doto text-[var(--muted)]">{m.score}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-center">
                  <span className="text-[9px] text-[var(--red)] font-semibold">
                    + Invite 1 more member for 1.2x boost
                  </span>
                </div>
              </div>
            )}

            {/* SCREEN 2: CAPTAIN */}
            {activeScreen === 2 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Captain Stats */}
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                  <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mb-0.5">
                    <span>Campus Ambassador</span>
                    <span className="text-[var(--red)] font-semibold">Tier 2</span>
                  </div>
                  <div className="text-base font-bold text-[#F2F2F2] font-doto">
                    18 <span className="text-[10px] font-normal text-[var(--muted)]">Referrals</span>
                  </div>
                  <div className="text-[9px] text-[var(--muted)] mt-0.5 font-doto">
                    PKR 3,600 Earned
                  </div>
                </div>

                {/* Referred Students */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                    Recent Students
                  </span>
                  {[
                    { name: 'Danyal S.', target: 'FAST CS' },
                    { name: 'Sara K.', target: 'NUST SEECS' },
                    { name: 'Waleed M.', target: 'GIKI Eng' },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 px-2 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-between text-[10px]"
                    >
                      <span className="text-[#F2F2F2] font-medium">{s.name}</span>
                      <span className="text-[9px] text-[var(--muted)]">{s.target}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-[var(--muted)]">Referral code: BOARDLY20</span>
                </div>
              </div>
            )}

            {/* SCREEN 3: ARENA */}
            {activeScreen === 3 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Arena Header */}
                <div className="p-2 rounded-xl bg-[#111111] border border-[var(--red)]">
                  <div className="text-[9px] text-[var(--red)] font-semibold">
                    Boardly Blitz Live
                  </div>
                  <div className="text-xs font-bold text-[#F2F2F2]">
                    National Leaderboard
                  </div>
                </div>

                {/* Top 3 Leaderboard */}
                <div className="space-y-1.5">
                  {[
                    { rank: '01', name: 'Zaid K.', score: '98' },
                    { rank: '02', name: 'Ayesha M.', score: '96' },
                    { rank: '03', name: 'Bilal H.', score: '94' },
                  ].map(item => (
                    <div
                      key={item.rank}
                      className="p-1.5 px-2 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-doto font-bold text-[var(--muted)]">
                          {item.rank}
                        </span>
                        <span className="text-[#F2F2F2] font-medium">{item.name}</span>
                      </div>
                      <span className="font-doto font-bold text-[#F2F2F2]">{item.score} pts</span>
                    </div>
                  ))}
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--red)] text-center text-[#FFFFFF] text-[9px] font-semibold">
                  Queue Active · Starts Sun 8:00 PM
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tab Bar inside the Phone with internal padding */}
          <div className="h-10 px-2 bg-[#111111] border-t border-[#2A2A2A] flex items-center justify-around shrink-0">
            <button
              onClick={() => handleSelectScreen(0)}
              aria-label="Cockpit tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 0 ? 'text-[#FFFFFF]' : 'text-[var(--muted)]'
              }`}
            >
              <LayoutDashboard size={13} />
              <span className="text-[7px] font-medium">Cockpit</span>
            </button>
            <button
              onClick={() => handleSelectScreen(1)}
              aria-label="Crew tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 1 ? 'text-[#FFFFFF]' : 'text-[var(--muted)]'
              }`}
            >
              <Users size={13} />
              <span className="text-[7px] font-medium">Crew</span>
            </button>
            <button
              onClick={() => handleSelectScreen(2)}
              aria-label="Captain tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 2 ? 'text-[#FFFFFF]' : 'text-[var(--muted)]'
              }`}
            >
              <Trophy size={13} />
              <span className="text-[7px] font-medium">Captain</span>
            </button>
            <button
              onClick={() => handleSelectScreen(3)}
              aria-label="Arena tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 3 ? 'text-[#FFFFFF]' : 'text-[var(--muted)]'
              }`}
            >
              <Flame size={13} />
              <span className="text-[7px] font-medium">Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Control Pill Container:
          Separate from phone with 20px space (mt-5), 4 equal tabs, 44px height (h-11).
          Active tab = solid white background with BLACK text.
          Inactive tab = #9A9A9A text on #111111 */}
      <div className="w-full max-w-[320px] h-11 p-1 rounded-full bg-[#111111] border border-[var(--border)] grid grid-cols-4 items-center gap-1">
        {(['Cockpit', 'Crew', 'Captain', 'Arena'] as const).map((label, idx) => {
          const isActive = activeScreen === idx;
          return (
            <button
              key={label}
              onClick={() => handleSelectScreen(idx as 0 | 1 | 2 | 3)}
              className={`h-full w-full rounded-full text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'bg-[#111111] text-[#9A9A9A] hover:text-[#F2F2F2]'
              }`}
              style={{
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                backgroundColor: isActive ? '#FFFFFF' : '#111111',
                color: isActive ? '#000000' : '#9A9A9A',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* "Sample preview" pill sits below, centered, 12px under the control */}
      <div className="mt-3">
        <span className="badge-pill text-[12px] px-3 py-1">Sample preview</span>
      </div>
    </div>
  );
}
