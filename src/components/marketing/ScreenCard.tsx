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
      border: 'border-white/15',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
      glow: 'from-blue-500/20 via-indigo-500/15 to-teal-500/15',
      highlight: 'text-[#38bdf8]',
      pillText: '#93c5fd',
      bar: 'from-[#1a6dff] to-[#14b8a6]',
      softBg: 'bg-white/[0.04]',
    },
    captain: {
      border: 'border-white/15',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
      glow: 'from-amber-500/20 via-orange-500/15 to-teal-500/15',
      highlight: 'text-[#fcd34d]',
      pillText: '#fcd34d',
      bar: 'from-[#f5b942] to-orange-400',
      softBg: 'bg-amber-500/[0.06]',
    },
    crew: {
      border: 'border-white/15',
      badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
      glow: 'from-violet-500/20 via-indigo-500/15 to-teal-500/15',
      highlight: 'text-[#c7d2fe]',
      pillText: '#c7d2fe',
      bar: 'from-violet-500 to-teal-400',
      softBg: 'bg-violet-500/[0.06]',
    },
  }[accent];

  // Default chips if not provided - no "(Sample)" text, sentence case labels
  const defaultChips: FloatingChip[] = chips || (
    mode === 'captain'
      ? [
          {
            label: 'Referrals',
            value: '28 Students',
            icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" />,
            position: 'top-right',
          },
          {
            label: 'Status',
            value: 'Verified Captain',
            icon: <Award className="w-3.5 h-3.5 text-teal-400" />,
            position: 'bottom-left',
          },
        ]
      : mode === 'crew'
      ? [
          {
            label: 'Crew event',
            value: '142 Joined',
            icon: <Zap className="w-3.5 h-3.5 text-violet-400" />,
            position: 'top-right',
          },
          {
            label: 'Tier',
            value: 'Campus Leader',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
            position: 'bottom-left',
          },
        ]
      : mode === 'leaderboard'
      ? [
          {
            label: 'Top score',
            value: '96% Accuracy',
            icon: <Award className="w-3.5 h-3.5 text-indigo-400" />,
            position: 'top-right',
          },
          {
            label: 'Average speed',
            value: '38s / MCQ',
            icon: <Clock className="w-3.5 h-3.5 text-teal-400" />,
            position: 'bottom-left',
          },
        ]
      : [
          {
            label: 'Daily goal',
            value: '45 / 50 MCQs',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
            position: 'top-right',
          },
          {
            label: 'Accuracy',
            value: '88% Verified',
            icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" />,
            position: 'bottom-left',
          },
        ]
  );

  return (
    <div className={`relative w-full max-w-xl mx-auto py-6 px-2 sm:px-4 ${className}`}>
      {/* Ambient background soft glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${accentStyles.glow} rounded-[32px] blur-3xl -z-10 pointer-events-none opacity-70`}
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
            className={`absolute z-20 pointer-events-none transition-transform hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg text-xs font-medium text-white ${
              isTop ? '-top-2' : '-bottom-2'
            } ${isRight ? '-right-2 sm:-right-4' : '-left-2 sm:-left-4'} ${driftClass}`}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              willChange: 'transform',
            }}
          >
            {chip.icon}
            <div>
              <div className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{chip.label}</div>
              <div className="font-bold text-xs text-white">{chip.value}</div>
            </div>
          </div>
        );
      })}

      {/* Main Proper Dark Glass Card: rgba(255,255,255,0.06), blur(20px), 1px border, radius 24px */}
      <div
        className="relative w-full rounded-[24px] text-white shadow-2xl overflow-hidden text-left transition-all"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header row: green dot + title on ONE line (truncate if needed), small "Sample preview" pill on the right */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="text-[13px] font-semibold text-white truncate">
              {title.replace(/\s*\(Sample\)/gi, '')}
            </span>
          </div>
          <span
            className="shrink-0 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: accentStyles.pillText,
            }}
          >
            Sample preview
          </span>
        </div>

        {/* Card Body - Soft tinted backgrounds without box-inside-box or heavy borders */}
        <div className="p-5 sm:p-6 space-y-4">
          {children ? (
            children
          ) : mode === 'captain' ? (
            <div className="space-y-3.5">
              <div
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(245, 185, 66, 0.08)',
                  border: '1px solid rgba(245, 185, 66, 0.15)',
                }}
              >
                <div className="text-[12px] font-semibold text-[#fcd34d] mb-1">
                  Active ambassador
                </div>
                <div className="text-base font-bold text-white">
                  Hamza R. · Campus Batch Leader
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  Unique invite code: <span className="font-bold text-[#fcd34d]">CAMPUS-LEAD-2026</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3.5 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="text-[12px]" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Total joined</div>
                  <div className="text-xl font-bold text-white mt-1">28 Peers</div>
                </div>
                <div
                  className="p-3.5 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="text-[12px]" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Rewards</div>
                  <div className="text-xl font-bold text-teal-400 mt-1">Pro Active</div>
                </div>
              </div>

              <div
                className="p-3.5 rounded-2xl flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Next milestone: CV Recommendation</span>
                <span className="font-bold text-[#fcd34d]">80% reached</span>
              </div>
            </div>
          ) : mode === 'crew' ? (
            <div className="space-y-3.5">
              <div
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                }}
              >
                <div className="text-[12px] font-semibold text-[#c7d2fe] mb-1">
                  Community event
                </div>
                <div className="text-base font-bold text-white">
                  Physics Rapid Drill · 45 Mins Mock
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  Organized by Ayesha K. · 142 Registered Candidates
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Candidate check-ins</span>
                  <span className="font-bold text-[#c7d2fe]">142 / 150</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-teal-400 rounded-full w-[94%]" />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3.5 rounded-2xl text-xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Live leaderboard tracking</span>
                <span className="text-teal-400 font-bold">Updated Live</span>
              </div>
            </div>
          ) : mode === 'leaderboard' ? (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                Live event standings
              </div>
              {[
                { rank: '1', name: 'Ayesha K.', score: '96 / 100', time: '14m 20s' },
                { rank: '2', name: 'Bilal S.', score: '94 / 100', time: '15m 12s' },
                { rank: '3', name: 'Daniyal M.', score: '92 / 100', time: '16m 05s' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl text-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 font-bold text-blue-400">#{row.rank}</span>
                    <span className="font-semibold text-white">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-300">{row.score}</span>
                    <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{row.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(26, 109, 255, 0.08)',
                  border: '1px solid rgba(26, 109, 255, 0.15)',
                }}
              >
                <div className="text-[12px] font-semibold text-blue-300 mb-1">
                  Active diagnostic drill
                </div>
                <div className="text-base font-bold text-white">
                  Electrostatics & Field Theory
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  Class 12 Physics · 15 Minutes timed session
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3.5 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="text-[12px]" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Questions solved</div>
                  <div className="text-xl font-bold text-white mt-1">45 / 50</div>
                </div>
                <div
                  className="p-3.5 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="text-[12px]" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Accuracy</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">88%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
