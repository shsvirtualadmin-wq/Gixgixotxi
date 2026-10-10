import React, { useState, useEffect } from 'react';
import { Trophy, Timer, ArrowRight, Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { FrostedBackgroundDecor } from './FrostedBackgroundDecor';
import { INITIAL_SESSIONS, EventSession } from '../../data/eventsStore';

interface BlitzLandingProps {
  onNavigate: (route: string) => void;
}

export const BlitzLanding: React.FC<BlitzLandingProps> = ({ onNavigate }) => {
  const [sessions] = useState<EventSession[]>(INITIAL_SESSIONS.filter(s => s.type === 'blitz'));
  
  // Find live session or latest session
  const liveSession = sessions.find(s => s.status === 'live');
  const upcomingSession = sessions.find(s => s.status === 'upcoming');
  const endedSession = sessions.find(s => s.status === 'ended');

  // Countdown simulation for upcoming session (02:14:09)
  const [timeLeft, setTimeLeft] = useState('02:14:09');

  useEffect(() => {
    let secondsRemaining = 2 * 3600 + 14 * 60 + 9;
    const interval = setInterval(() => {
      if (secondsRemaining > 0) {
        secondsRemaining -= 1;
        const h = Math.floor(secondsRemaining / 3600).toString().padStart(2, '0');
        const m = Math.floor((secondsRemaining % 3600) / 60).toString().padStart(2, '0');
        const s = (secondsRemaining % 60).toString().padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-80px)] pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col justify-center">
      <FrostedBackgroundDecor />

      {/* Top Status Pill */}
      <div className="flex justify-center mb-6">
        {liveSession ? (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass font-medium text-xs sm:text-sm text-emerald-800 border-emerald-300/60 shadow-sm animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">LIVE NOW</span>
            <span className="text-slate-400">·</span>
            <span>{liveSession.title}</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-emerald-700">{liveSession.subject}</span>
          </div>
        ) : upcomingSession ? (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass font-medium text-xs sm:text-sm text-indigo-900 border-indigo-200/80 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-bold">STARTS IN {timeLeft}</span>
            <span className="text-slate-400">·</span>
            <span>{upcomingSession.title}</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-indigo-600">{upcomingSession.subject}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass font-medium text-xs sm:text-sm text-slate-700 border-slate-200/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="font-bold">SESSION ENDED</span>
            <span className="text-slate-400">·</span>
            <span>{endedSession?.title || 'Electromagnetism Drill'}</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-indigo-600">{endedSession?.subject || 'Physics'}</span>
          </div>
        )}
      </div>

      {/* Huge Bold BLITZ Heading */}
      <div className="text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-[#0A1330] leading-none mb-3">
          BLITZ
        </h1>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-600 uppercase mb-6 flex items-center justify-center gap-2">
          <span>by</span>
          <span className="inline-block">Boardly</span>
        </p>

        {/* Two-line Description */}
        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto font-normal">
          Timed live MCQ drills dedicated to a single board subject, with instant score breakdowns and public leaderboards.
          100% free for matric and intermediate learners nationwide.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <button
          onClick={() => onNavigate('/blitz/register')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>Register for Blitz</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onNavigate('/blitz/leaderboard')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-slate-800 glass hover:bg-white/90 transition-all border border-slate-200/80 cursor-pointer shadow-sm hover:shadow"
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          <span>View Leaderboard</span>
        </button>
      </div>

      {/* Glass cards feature strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        <div className="glass-card p-6 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Timer className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2">Timed Topic Drills</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            40 to 50 questions under strict stopwatch pressure to develop lightning-fast elimination reflexes.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2">Live Public Rank</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            See your placement calibrated against thousands of classmates immediately upon submission.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2">Zero Paywalls</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Boardly Blitz is permanently free so every motivated student has access to top-tier competitive drills.
          </p>
        </div>
      </div>
    </div>
  );
};
