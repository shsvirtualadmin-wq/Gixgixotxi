import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Trophy, Flame } from 'lucide-react';
import { PillNav } from '@/components/ui/PillNav';

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
        className="relative rounded-[36px] p-2 bg-[#000000] border border-[#2A2A2A] mb-6 shrink-0 shadow-2xl"
        style={{
          width: 'min(300px, 78vw)',
          aspectRatio: '9 / 19',
          maxHeight: '560px',
        }}
      >
        {/* Screen Bezel & Container: Follows site theme */}
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-[var(--surface)] flex flex-col justify-between border border-[var(--border)]">
          {/* Top Notch / Dynamic Pill */}
          <div className="pt-2 px-3.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] font-doto">09:41</span>
            <div className="w-16 h-3 bg-[#000000] rounded-full border border-[#222222]" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[9px] font-bold text-[var(--text-muted)] font-doto">5G</span>
            </div>
          </div>

          {/* Screen Content Body: Render immediately, full opacity, no delayed state */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col justify-between">
            {/* SCREEN 0: COCKPIT */}
            {activeScreen === 0 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Daily Goal & Track */}
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-0.5">
                    <span>Active Track</span>
                    <span className="text-[var(--accent)] font-semibold">Mathematics &amp; Science</span>
                  </div>
                  <div className="text-base font-bold text-[var(--text)] font-doto tracking-tight">
                    Daily Goal: 25 MCQs
                  </div>
                </div>

                {/* Streak Dots & Daily Limit Ring */}
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-[10px] mb-1.5 text-[var(--text)] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      <span>7-Day Streak</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              idx < 5 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                            }`}
                          />
                          <span className="text-[7px] text-[var(--text-muted)]">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Limit Ring */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="w-11 h-11 rounded-full border-2 border-[var(--accent)] border-t-[var(--border)] flex flex-col items-center justify-center">
                      <span className="font-doto text-[10px] font-bold text-[var(--text)]">18</span>
                      <span className="text-[6px] text-[var(--text-muted)]">/25</span>
                    </div>
                    <span className="text-[7px] text-[var(--text-muted)] mt-0.5">Daily Ring</span>
                  </div>
                </div>

                {/* 2 Priority Chapters with Practice buttons */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Weak Chapters (&lt; 50%)
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <div className="truncate max-w-[110px]">
                      <div className="text-[var(--text)] font-medium truncate">Integration by Parts</div>
                      <div className="font-doto text-[var(--accent)] text-[9px]">Calculus &amp; Math</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[var(--accent)] text-white">
                      Drill
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <div className="truncate max-w-[110px]">
                      <div className="text-[var(--text)] font-medium truncate">Electromagnetism</div>
                      <div className="font-doto text-[var(--accent)] text-[9px]">Physics Track</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[var(--accent)] text-white">
                      Drill
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 1: CREW */}
            {activeScreen === 1 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Squad Sprint Goal */}
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-semibold">
                      Weekly Squad Goal
                    </span>
                    <div className="text-sm font-bold text-[var(--text)] font-doto">
                      500 <span className="text-[9px] font-normal text-[var(--text-muted)]">Completed MCQs</span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] flex items-center justify-center font-doto text-[9px] font-bold text-[var(--text)]">
                    PKT
                  </div>
                </div>

                {/* Squad Features */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Squad Synergy
                  </span>
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">Shared Streaks</span>
                    <span className="font-doto text-[var(--accent)]">Daily Active</span>
                  </div>
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">Mistake Diagnostics</span>
                    <span className="font-doto text-[var(--text-muted)]">Aggregated</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-center">
                  <span className="text-[9px] text-[var(--accent)] font-semibold">
                    1 Pro Member Unlocks Squad-Wide Pro
                  </span>
                </div>
              </div>
            )}

            {/* SCREEN 2: CAPTAIN */}
            {activeScreen === 2 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Captain Stats */}
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] mb-0.5">
                    <span>Campus Ambassador</span>
                    <span className="text-[var(--accent)] font-semibold">Verified</span>
                  </div>
                  <div className="text-base font-bold text-[var(--text)] font-doto">
                    20% <span className="text-[10px] font-normal text-[var(--text-muted)]">Direct Commission</span>
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-doto">
                    PKR 40 per Pro Subscription
                  </div>
                </div>

                {/* Captain Features */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Captain Perks
                  </span>
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">Instant Free Pro</span>
                    <span className="text-[9px] text-[var(--accent)]">Unlocked</span>
                  </div>
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">JazzCash / EasyPaisa</span>
                    <span className="text-[9px] text-[var(--text-muted)]">Direct Payouts</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-[var(--text-muted)]">Unique Referral Link &amp; Code</span>
                </div>
              </div>
            )}

            {/* SCREEN 3: ARENA */}
            {activeScreen === 3 && (
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                {/* Arena Header */}
                <div className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--accent)]">
                  <div className="text-[9px] text-[var(--accent)] font-semibold">
                    Grand Line Arena
                  </div>
                  <div className="text-xs font-bold text-[var(--text)]">
                    Public Tests by Captains
                  </div>
                </div>

                {/* Arena details */}
                <div className="space-y-1.5">
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">Live Test Timer</span>
                    <span className="font-doto text-[var(--accent)]">Synchronized</span>
                  </div>
                  <div className="p-1.5 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text)] font-medium">Nationwide Percentile</span>
                    <span className="font-doto text-[var(--text-muted)]">Instant</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--accent)] text-center text-white text-[9px] font-semibold">
                  Queue Active · Sunday 8:00 PM PKT
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tab Bar inside the Phone with internal padding */}
          <div className="h-10 px-2 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-around shrink-0">
            <button
              onClick={() => handleSelectScreen(0)}
              aria-label="Cockpit tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 0 ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              <LayoutDashboard size={13} />
              <span className="text-[7px] font-medium">Cockpit</span>
            </button>
            <button
              onClick={() => handleSelectScreen(1)}
              aria-label="Crew tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 1 ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              <Users size={13} />
              <span className="text-[7px] font-medium">Crew</span>
            </button>
            <button
              onClick={() => handleSelectScreen(2)}
              aria-label="Captain tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 2 ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              <Trophy size={13} />
              <span className="text-[7px] font-medium">Captain</span>
            </button>
            <button
              onClick={() => handleSelectScreen(3)}
              aria-label="Arena tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeScreen === 3 ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              <Flame size={13} />
              <span className="text-[7px] font-medium">Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Control Pill Container: using unified PillNav */}
      <div className="w-full max-w-[340px] mt-4">
        <PillNav
          items={[
            { id: 0, label: 'Cockpit' },
            { id: 1, label: 'Crew' },
            { id: 2, label: 'Captain' },
            { id: 3, label: 'Arena' },
          ]}
          activeId={activeScreen}
          onChange={(id) => handleSelectScreen(id as 0 | 1 | 2 | 3)}
          className="w-full justify-between"
        />
      </div>

      {/* "Sample preview" pill sits below, centered, 12px under the control */}
      <div className="mt-3">
        <span className="badge-pill text-[12px] px-3 py-1">Sample preview</span>
      </div>
    </div>
  );
}
