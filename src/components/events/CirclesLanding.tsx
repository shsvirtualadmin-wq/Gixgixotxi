import React, { useState, useEffect } from 'react';
import { Users, Award, ShieldCheck, ArrowRight, Zap, Trophy, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { BrandLogo } from '../marketing/BrandLogo';
import { UNIVERSITIES } from '../../data/universities';
import { UniversityLogoBadge } from '../UniversityLogoBadge';

interface CirclesLandingProps {
  onNavigate: (route: string) => void;
}

const SAMPLE_COMMUNITY_TICKER = [
  'Student organized a Blitz · 142 registered',
  'Batch Rep hosted Physics Mechanics Drill · 88 participants',
  'Pre-Med Circle ran MDCAT Biology Mock · 210 registered',
  'FAST Aspirants Group launched Math Speed Run · 124 registered',
  'FSc Class of 2026 organized Organic Chem Blitz · 165 registered',
];

const TYPEWRITER_PHRASES = [
  'With Boardly Study Circles.',
  'Under Official Board Timers.',
  'With Real-Time Leaderboards.',
  'Empowering Your Whole Batch.'
];

export const CirclesLanding: React.FC<CirclesLandingProps> = ({ onNavigate }) => {
  // Typewriter effect state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && displayText === currentPhrase) {
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentPhrase.substring(0, displayText.length - 1)
          : currentPhrase.substring(0, displayText.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <div className="min-h-screen bg-[#070B19] text-white relative selection:bg-indigo-500 selection:text-white">
      {/* 1. DARK HERO WITH FAINT PERSPECTIVE GRID AND DOTS */}
      <div className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Perspective grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 -z-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 60%),
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            transform: 'perspective(600px) rotateX(25deg)',
            transformOrigin: 'top center',
          }}
        />

        <div className="max-w-5xl mx-auto text-center">
          {/* Pill with three small overlapping university logo circles */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-dark border border-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <div className="flex items-center -space-x-2">
              <UniversityLogoBadge university="NUST" size="xs" />
              <UniversityLogoBadge university="FAST" size="xs" />
              <UniversityLogoBadge university="GIKI" size="xs" />
            </div>
            <span>Run mocks for NUST, FAST and more</span>
          </div>

          {/* Heading in heavy condensed font in two colors */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6 font-poppins">
            <span className="text-white block sm:inline">HOST BLITZ SESSIONS FOR YOUR BATCH </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300">
              WITH STUDY CIRCLES
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Organize official timed MCQ drills tailored for your study group, coaching batch, or campus society with Boardly’s automated engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/circles/apply')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <span>Visit Study Circles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CIRCLES HOME SECTION */}
      <div className="border-t border-white/10 bg-[#0B1120] py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Secondary Nav bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-dark border border-white/10 mb-12">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" light />
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold border-l border-white/10 pl-3">
                Study Circles
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => onNavigate('/blitz')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Blitz
              </button>
              <button
                onClick={() => onNavigate('/arena')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Arena
              </button>
              <button
                onClick={() => onNavigate('/circles/apply')}
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer"
              >
                Apply to Organize
              </button>
            </div>
          </div>

          {/* Subheading pill and typewriter headline */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">
              By Students. For Their Communities. Backed by Boardly.
            </div>

            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight min-h-[96px] flex items-center justify-center flex-col sm:flex-row gap-2 font-poppins">
              <span className="text-slate-200">Scale Your Prep</span>
              <span className="text-indigo-400 border-b-2 border-indigo-400 pb-0.5">
                {displayText}
                <span className="inline-block w-1 h-6 bg-indigo-400 animate-pulse ml-1 align-middle" />
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => onNavigate('/circles/apply')}
                className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                Apply to Organize
              </button>
              <button
                onClick={() => onNavigate('/blitz')}
                className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
              >
                Browse Community Sessions
              </button>
            </div>
          </div>

          {/* 3. TILTED SCROLLING TICKER OF RECENT SESSIONS */}
          <div className="my-16 overflow-hidden py-4 -rotate-1 bg-indigo-950/40 border-y border-indigo-500/20">
            <div className="flex gap-6 animate-marquee-scroll whitespace-nowrap">
              {[...SAMPLE_COMMUNITY_TICKER, ...SAMPLE_COMMUNITY_TICKER].map((tick, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-xs font-medium text-indigo-200 border border-indigo-400/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{tick}</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Sample content)</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. COMPARISON SECTION: A hundred thousand students. One official team. */}
          <section className="my-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 font-poppins">
                A hundred thousand students. One official team.
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                No single central team can service every regional syllabus revision calendar alone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card 1: One official team limitation */}
              <div className="glass-dark p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 text-slate-300 flex items-center justify-center font-bold mb-4 text-xs">
                    OFFICIAL
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-poppins">Centralized Capacity</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Our core academic team can realistically run only 1 to 2 nationwide sessions per week to ensure question quality control and server stability.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500 pt-4 border-t border-white/10">
                  Limited weekly slots for major examinations
                </div>
              </div>

              {/* Card 2: Highlighted Card for Many smaller organizers */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border-2 border-indigo-500/50 shadow-xl shadow-indigo-950/50 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-3 right-3 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-400/30">
                  STUDY CIRCLES
                </div>
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold mb-4 text-xs">
                    DECENTRALIZED
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-poppins">Campus-Driven Scale</h3>
                  <p className="text-sm text-indigo-200 leading-relaxed mb-6">
                    Thousands of students are spread across hundreds of colleges and academies with diverse exam dates. Student organizers create targeted drills for their exact classmates.
                  </p>
                </div>
                <div className="text-xs font-bold text-indigo-300 pt-4 border-t border-indigo-400/20">
                  Empowering batches through trusted local organizers
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-slate-400 font-medium">
                When motivated batch leaders organize, whole cohorts improve their merit rankings together.
              </p>
            </div>
          </section>

          {/* 5. THE REAL PERKS OF ORGANIZING */}
          <section className="my-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 font-poppins">
                The Real Perks of Organizing
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Lead academic events and build verified credentials that stand out.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-dark p-6 rounded-3xl border border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-poppins">Verified Certificate</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive an official Boardly Leadership Certificate documenting the verified cohort size you managed.
                </p>
              </div>

              <div className="glass-dark p-6 rounded-3xl border border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-poppins">Branded Standings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every drill leaderboard carries your organizer badge and college affiliation publicly.
                </p>
              </div>

              <div className="glass-dark p-6 rounded-3xl border border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-poppins">Priority Tech Line</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct WhatsApp access to the Boardly engineering team for instant support during live tests.
                </p>
              </div>

              <div className="glass-dark p-6 rounded-3xl border border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-poppins">Early Feature Access</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preview upcoming mock papers, Boardy features, and diagnostic drills before public releases.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => onNavigate('/circles/apply')}
                className="px-8 py-3.5 rounded-full text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Apply to Become an Organizer
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
