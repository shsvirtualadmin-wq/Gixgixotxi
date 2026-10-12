import React from 'react';
import { Sparkles, CheckCircle2, TrendingUp, Zap, Clock, Award, ShieldCheck, ChevronRight } from 'lucide-react';

export interface FloatingChip {
  label: string;
  value: string;
  icon?: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ScreenCardProps {
  title?: string;
  subtitle?: string;
  accent?: 'default' | 'captain' | 'crew';
  mode?: 'dashboard' | 'practice' | 'leaderboard' | 'captain' | 'crew' | 'custom';
  chips?: FloatingChip[];
  children?: React.ReactNode;
  className?: string;
}

export const ScreenCard: React.FC<ScreenCardProps> = ({
  title = 'Student Practice Portal',
  subtitle = 'Interactive diagnostic testing & active revision',
  accent = 'default',
  mode = 'dashboard',
  chips,
  children,
  className = '',
}) => {
  // Theme styling based on accent
  const accentStyles = {
    default: {
      border: 'border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      glow: 'from-indigo-500/10 via-violet-500/10 to-teal-500/10',
      highlight: 'text-indigo-600 dark:text-indigo-400',
      bar: 'from-indigo-600 to-violet-600',
    },
    captain: {
      border: 'border-amber-500/25',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      glow: 'from-amber-500/15 via-teal-500/10 to-amber-500/10',
      highlight: 'text-amber-600 dark:text-amber-400',
      bar: 'from-amber-500 to-teal-500',
    },
    crew: {
      border: 'border-violet-500/25',
      badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
      glow: 'from-violet-500/15 via-indigo-500/10 to-teal-500/10',
      highlight: 'text-violet-600 dark:text-violet-400',
      bar: 'from-violet-600 to-teal-500',
    },
  }[accent];

  // Default chips if not provided
  const defaultChips: FloatingChip[] = chips || (
    mode === 'captain'
      ? [
          {
            label: 'Referrals (Sample)',
            value: '28 Students',
            icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" />,
            position: 'top-right',
          },
          {
            label: 'Status (Sample)',
            value: 'Verified Captain',
            icon: <Award className="w-3.5 h-3.5 text-teal-500" />,
            position: 'bottom-left',
          },
        ]
      : mode === 'crew'
      ? [
          {
            label: 'Crew Event (Sample)',
            value: '142 Joined',
            icon: <Zap className="w-3.5 h-3.5 text-violet-500" />,
            position: 'top-right',
          },
          {
            label: 'Tier (Sample)',
            value: 'Campus Leader',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />,
            position: 'bottom-left',
          },
        ]
      : mode === 'leaderboard'
      ? [
          {
            label: 'Top Score (Sample)',
            value: '96% Accuracy',
            icon: <Award className="w-3.5 h-3.5 text-indigo-500" />,
            position: 'top-right',
          },
          {
            label: 'Avg Speed (Sample)',
            value: '38s / MCQ',
            icon: <Clock className="w-3.5 h-3.5 text-teal-500" />,
            position: 'bottom-left',
          },
        ]
      : [
          {
            label: 'Daily Goal (Sample)',
            value: '45 / 50 MCQs',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
            position: 'top-right',
          },
          {
            label: 'Accuracy (Sample)',
            value: '88% Verified',
            icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />,
            position: 'bottom-left',
          },
        ]
  );

  return (
    <div className={`relative w-full max-w-xl mx-auto py-6 px-2 sm:px-4 ${className}`}>
      {/* Ambient background soft glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${accentStyles.glow} rounded-[32px] blur-2xl -z-10 pointer-events-none opacity-80`}
        aria-hidden="true"
      />

      {/* Floating Glass Chips with slow drift */}
      {defaultChips.map((chip, idx) => {
        const isTop = chip.position.includes('top');
        const isRight = chip.position.includes('right');
        const driftClass = idx % 2 === 0 ? 'animate-[driftA_7s_ease-in-out_infinite]' : 'animate-[driftB_8s_ease-in-out_infinite]';

        return (
          <div
            key={idx}
            className={`absolute z-20 pointer-events-none transition-transform hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/60 dark:border-slate-800/80 shadow-lg shadow-slate-900/5 text-xs font-medium text-slate-800 dark:text-slate-100 ${
              isTop ? '-top-2' : '-bottom-2'
            } ${isRight ? '-right-2 sm:-right-4' : '-left-2 sm:-left-4'} ${driftClass}`}
            style={{
              willChange: 'transform',
            }}
          >
            {chip.icon}
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">{chip.label}</div>
              <div className="font-bold text-xs">{chip.value}</div>
            </div>
          </div>
        );
      })}

      {/* Main Glass Screen Card: 24px border radius, no phone hardware */}
      <div
        className={`relative w-full rounded-[24px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border ${accentStyles.border} shadow-2xl shadow-indigo-950/10 overflow-hidden text-left`}
      >
        {/* Top Header Strip with Sample Notice */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {title}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider border ${accentStyles.badge}`}>
            Sample Preview
          </span>
        </div>

        {/* Card Body with minimum 14px text */}
        <div className="p-5 sm:p-6 space-y-4">
          {children ? (
            children
          ) : mode === 'captain' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="text-xs font-mono uppercase text-amber-700 dark:text-amber-400 mb-1">
                  Active Ambassador (Sample)
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  Student A. · Campus Batch Leader
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Unique invite code: <span className="font-mono font-bold text-amber-600">SAMPLE-CAPTAIN</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Joined (Sample)</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">28 Peers</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Rewards (Sample)</div>
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">Pro Active</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Next milestone: CV Recommendation</span>
                <span className="font-bold text-amber-600">80% reached</span>
              </div>
            </div>
          ) : mode === 'crew' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="text-xs font-mono uppercase text-violet-700 dark:text-violet-400 mb-1">
                  Community Event (Sample)
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  Physics Rapid Drill · 45 Mins Mock
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Organized by Student B. · 142 Registered Candidates
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Candidate Check-ins</span>
                  <span className="font-bold text-violet-600">142 / 150</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-teal-500 rounded-full w-[94%]" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-xs">
                <span className="text-slate-700 dark:text-slate-300">Live leaderboard tracking</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">Updated Live</span>
              </div>
            </div>
          ) : mode === 'leaderboard' ? (
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                Live Event Standings (Sample)
              </div>
              {[
                { rank: '1', name: 'Student A.', score: '96 / 100', time: '14m 20s' },
                { rank: '2', name: 'Student B.', score: '94 / 100', time: '15m 12s' },
                { rank: '3', name: 'Student C.', score: '92 / 100', time: '16m 05s' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-bold font-mono text-indigo-600 dark:text-indigo-400">#{row.rank}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 dark:text-white">{row.score}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{row.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <div className="text-xs font-mono uppercase text-indigo-700 dark:text-indigo-400 mb-1">
                  Concept Practice MCQ (Sample)
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Which principle describes the induced electromotive force in a closed loop?
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { text: 'Faraday’s Law of Electromagnetic Induction', correct: true },
                  { text: 'Coulomb’s Inverse Square Law', correct: false },
                  { text: 'Pascal’s Principle of Fluid Transmission', correct: false },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                      opt.correct
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.correct && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Step-by-step breakdown:</span> Verified explanation and formula derivations available instantly.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
