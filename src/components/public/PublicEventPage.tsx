import React from 'react';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Trophy, Users } from 'lucide-react';
import { SeoHead } from '../common/SeoHead';

interface EventPageProps {
  type: 'blitz' | 'arena';
  onNavigateHome?: () => void;
  onStartPractice?: () => void;
}

export const PublicEventPage: React.FC<EventPageProps> = ({
  type,
  onNavigateHome,
  onStartPractice,
}) => {
  const isBlitz = type === 'blitz';
  const pathname = isBlitz ? '/events/blitz' : '/events/arena';
  const title = isBlitz ? 'Boardly Blitz' : 'Boardly Arena';
  const subtitle = isBlitz
    ? 'High-Stakes Rapid-Fire MCQ Sprint Competitions'
    : 'Real-Time Head-to-Head Entrance Exam Battle Arena';

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <SeoHead pathname={pathname} />

      {/* Header Container */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Coming Soon</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0d1b3e] tracking-tight">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          {subtitle}
        </p>
      </div>

      {/* Main Content Card (150+ words of real informative content) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white shadow-xl shadow-indigo-950/5 space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        {isBlitz ? (
          <>
            <p>
              Boardly Blitz is Pakistan’s upcoming premier timed speed-drill tournament crafted specifically for Matric, FSC, and university entrance test candidates. In competitive exams like the PMDC MDCAT, NUST NET, and FAST-NU admission tests, accuracy under intense time pressure separates top scorers from the rest. Blitz challenges students with 30 rapid-fire questions in high-yield Physics, Chemistry, and Advanced Mathematics, testing not just memory but lightning-fast conceptual derivation.
            </p>
            <p>
              Every registered candidate receives a standardized time allotment with real-time countdown clocks and instant national percentile calculation. Compete alongside thousands of fellow aspirants from Lahore, Karachi, Islamabad, Peshawar, Quetta, and across provincial boards. High performers earn national digital certificates of merit, featured spots on the nationwide leaderboard, and premium scholarship tokens.
            </p>
            <p>
              While our automated tournament servers finalize matchmaking synchronization, students can immediately hone their speed through our timed daily question sprints and personalized chapter diagnostic assessments.
            </p>
          </>
        ) : (
          <>
            <p>
              Boardly Arena brings competitive, real-time multiplayer head-to-head academic duels to Pakistan’s entrance test community. Modeled after premier competitive programming and academic Olympiads, Arena pairs you with peer aspirants studying for the same target institution—be it engineering mocks for UET, FAST, and GIKI, or pre-medical sprints for MDCAT and NUMS.
            </p>
            <p>
              In Arena battles, both contenders face synchronized question stems featuring authentic negative marking rules and rigorous numerical steps. Points are awarded based on both accuracy and response velocity, discouraging wild guessing while rewarding sharp conceptual instincts. Watch live score adjustments round by round, analyze opponent pacing, and review comprehensive step-by-step derivations once the duel concludes.
            </p>
            <p>
              Arena is entering its final beta qualification phase. In the interim, practice with chapter-wise past paper modules and review challenging derivations with our 24/7 Boardy AI assistant to build up your duel rating.
            </p>
          </>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>National Launch Scheduled for Spring 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </a>
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                if (onStartPractice) onStartPractice();
                else window.location.href = '/app';
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
