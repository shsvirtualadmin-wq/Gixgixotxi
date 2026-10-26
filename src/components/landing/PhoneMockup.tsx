import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Trophy, Flame } from 'lucide-react';

interface PhoneMockupProps {
  screen?: 0 | 1 | 2 | 3;
  onScreenChange?: (screen: 0 | 1 | 2 | 3) => void;
}

const TABS: { id: 0 | 1 | 2 | 3; label: string }[] = [
  { id: 0, label: 'Cockpit' },
  { id: 1, label: 'Crew' },
  { id: 2, label: 'Captain' },
  { id: 3, label: 'Arena' },
];

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
    <div className="flex flex-col items-center w-full max-w-[310px] mx-auto">
      {/* Phone Shell: Compact, even internal spacing with zero empty gaps */}
      <div
        className="relative rounded-[28px] p-2 bg-[#000000] border border-[var(--border-strong)] w-full shrink-0 shadow-xl"
      >
        {/* Screen Bezel & Container */}
        <div className="relative w-full rounded-[22px] overflow-hidden bg-[var(--surface)] flex flex-col border border-[var(--border)]">
          {/* Top Notch / Dynamic Pill */}
          <div className="pt-2.5 pb-1.5 px-4 flex items-center justify-between shrink-0 border-b border-[var(--border)]/60">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] font-doto">09:41</span>
            <div className="w-14 h-2.5 bg-[#000000] rounded-full border border-[#26262B]" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] font-doto">5G</span>
            </div>
          </div>

          {/* Screen Content Body: Tight, balanced spacing filling the phone evenly */}
          <div className="p-3.5 min-h-[300px] flex flex-col justify-between gap-2.5">
            {/* SCREEN 0: COCKPIT */}
            {activeScreen === 0 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-between">
                {/* Daily Goal & Track */}
                <div className="p-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                    <span>Active Track</span>
                    <span className="text-[var(--accent)] font-semibold">Mathematics &amp; Science</span>
                  </div>
                  <div className="text-[15px] font-bold text-[var(--text)] font-doto tracking-tight">
                    Daily Goal: 25 MCQs
                  </div>
                </div>

                {/* Streak Dots & Daily Limit Ring */}
                <div className="p-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] mb-2 text-[var(--text)] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      <span>7-Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              idx < 5 ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'
                            }`}
                          />
                          <span className="text-[9px] font-medium text-[var(--text-muted)]">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Limit Ring */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-[var(--border)] flex flex-col items-center justify-center">
                      <span className="font-doto text-[11px] font-bold text-[var(--text)] leading-none">18</span>
                      <span className="text-[9px] text-[var(--text-muted)] leading-none mt-0.5">/25</span>
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] mt-1">Daily Ring</span>
                  </div>
                </div>

                {/* 2 Priority Chapters with Practice buttons */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Weak Chapters (&lt; 50%)
                  </span>
                  <div className="p-2.5 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] text-[var(--text)] font-semibold truncate">Integration by Parts</div>
                      <div className="font-doto text-[var(--accent)] text-[10px]">Calculus &amp; Math</div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-[var(--accent)] text-white shrink-0">
                      Drill
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] text-[var(--text)] font-semibold truncate">Electromagnetism</div>
                      <div className="font-doto text-[var(--accent)] text-[10px]">Physics Track</div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-[var(--accent)] text-white shrink-0">
                      Drill
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 1: CREW */}
            {activeScreen === 1 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-between">
                {/* Squad Sprint Goal */}
                <div className="p-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-0.5">
                      Weekly Squad Goal
                    </span>
                    <div className="text-[15px] font-bold text-[var(--text)] font-doto">
                      500 <span className="text-[11px] font-normal text-[var(--text-muted)]">Completed MCQs</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] flex items-center justify-center font-doto text-[10px] font-bold text-[var(--text)] shrink-0">
                    PKT
                  </div>
                </div>

                {/* Squad Features */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Squad Synergy
                  </span>
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">Shared Streaks</span>
                    <span className="font-doto text-[var(--accent)] font-semibold">Daily Active</span>
                  </div>
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">Mistake Diagnostics</span>
                    <span className="font-doto text-[var(--text-muted)]">Aggregated</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] text-center">
                  <span className="text-[11px] text-[var(--accent)] font-semibold">
                    1 Pro Member Unlocks Squad-Wide Pro
                  </span>
                </div>
              </div>
            )}

            {/* SCREEN 2: CAPTAIN */}
            {activeScreen === 2 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-between">
                {/* Captain Stats */}
                <div className="p-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                    <span>Campus Ambassador</span>
                    <span className="text-[var(--accent)] font-semibold">Verified</span>
                  </div>
                  <div className="text-[15px] font-bold text-[var(--text)] font-doto">
                    20% <span className="text-[11px] font-normal text-[var(--text-muted)]">Direct Commission</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 font-doto">
                    PKR 40 per Pro Subscription
                  </div>
                </div>

                {/* Captain Features */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    Captain Perks
                  </span>
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">Instant Free Pro</span>
                    <span className="text-[11px] text-[var(--accent)] font-semibold">Unlocked</span>
                  </div>
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">JazzCash / EasyPaisa</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Direct Payouts</span>
                  </div>
                </div>

                <div className="p-2 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] text-center">
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">Unique Referral Link &amp; Code</span>
                </div>
              </div>
            )}

            {/* SCREEN 3: ARENA */}
            {activeScreen === 3 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-between">
                {/* Arena Header */}
                <div className="p-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--accent)]">
                  <div className="text-[11px] text-[var(--accent)] font-semibold mb-0.5">
                    Grand Line Arena
                  </div>
                  <div className="text-[14px] font-bold text-[var(--text)]">
                    Public Tests by Captains
                  </div>
                </div>

                {/* Arena details */}
                <div className="flex flex-col gap-2">
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">Live Test Timer</span>
                    <span className="font-doto text-[var(--accent)] font-semibold">Synchronized</span>
                  </div>
                  <div className="p-2.5 px-3 rounded-[10px] bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text)] font-medium">Nationwide Percentile</span>
                    <span className="font-doto text-[var(--text-muted)]">Instant</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[var(--accent)] text-center text-white text-[11px] font-semibold">
                  Queue Active · Sunday 8:00 PM PKT
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tab Bar inside the Phone */}
          <div className="h-12 px-2 bg-[var(--surface-muted)] border-t border-[var(--border)] flex items-center justify-around shrink-0">
            <button
              type="button"
              onClick={() => handleSelectScreen(0)}
              aria-label="Cockpit tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                activeScreen === 0 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutDashboard size={14} />
              <span className="text-[9px] font-medium">Cockpit</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScreen(1)}
              aria-label="Crew tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                activeScreen === 1 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Users size={14} />
              <span className="text-[9px] font-medium">Crew</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScreen(2)}
              aria-label="Captain tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                activeScreen === 2 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Trophy size={14} />
              <span className="text-[9px] font-medium">Captain</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScreen(3)}
              aria-label="Arena tab"
              className={`flex flex-col items-center gap-0.5 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                activeScreen === 3 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Flame size={14} />
              <span className="text-[9px] font-medium">Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact segmented tab control below the phone */}
      <div
        role="tablist"
        aria-label="Preview screens"
        className="w-full grid grid-cols-4 gap-1 p-1 mt-3.5 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]"
      >
        {TABS.map(tab => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectScreen(tab.id)}
              className={`h-8 rounded-[7px] text-xs font-heading font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Small quiet caption underneath */}
      <span className="mt-2 text-[11px] font-heading text-[var(--text-muted)]">
        Sample preview
      </span>
    </div>
  );
}
