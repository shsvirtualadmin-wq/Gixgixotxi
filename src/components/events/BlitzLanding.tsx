import React, { useState, useEffect } from 'react';
import { Trophy, Timer, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { INITIAL_SESSIONS, EventSession } from '../../data/eventsStore';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { ScreenCard } from '../marketing/ScreenCard';
import { WordReveal } from '../marketing/design-system/WordReveal';
import { StepsList } from '../marketing/design-system/StepsList';
import { CtaSection } from '../marketing/design-system/CtaSection';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';

interface BlitzLandingProps {
  onNavigate: (route: string) => void;
}

const BLITZ_TYPEWRITER = [
  'Speed Drill Bouts',
  'Rapid Physics Testing',
  'Live Public Standings',
  'Exam Pace Reflexes',
];

export const BlitzLanding: React.FC<BlitzLandingProps> = ({ onNavigate }) => {
  const [sessions] = useState<EventSession[]>(INITIAL_SESSIONS.filter((s) => s.type === 'blitz'));

  const liveSession = sessions.find((s) => s.status === 'live');
  const upcomingSession = sessions.find((s) => s.status === 'upcoming');
  const endedSession = sessions.find((s) => s.status === 'ended');

  // Countdown simulation (02:14:09)
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
    <div className="w-full">
      {/* Hero */}
      <Hero
        eyebrow="HIGH-SPEED EXAM DRILLS"
        staticHeadingPrefix="Timed Live Bouts in"
        typewriterPhrases={BLITZ_TYPEWRITER}
        staticHeadingSuffix="Nationwide"
        description="Rapid 15-minute diagnostic sprints dedicated to single board topics. Compete live with peers across Pakistan and benchmark your speed."
        primaryCtaText="Register for Blitz"
        secondaryCtaText="View Live Leaderboard"
        onPrimaryCta={() => onNavigate('/blitz/register')}
        onSecondaryCta={() => onNavigate('/blitz/leaderboard')}
      />

      {/* Live Status Strip (Light) */}
      <Section variant="light">
        <div className="max-w-3xl mx-auto text-center mb-10">
          {liveSession ? (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs sm:text-sm font-bold shadow-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE NOW: {liveSession.title} ({liveSession.subject})</span>
            </div>
          ) : upcomingSession ? (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 text-xs sm:text-sm font-bold shadow-xs">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>STARTS IN {timeLeft}: {upcomingSession.title} ({upcomingSession.subject})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold">
              <span>Next Blitz round scheduled this weekend. Registration open.</span>
            </div>
          )}
        </div>

        <SectionHeader
          eyebrow="HIGH-STAKES REVISION"
          title="Why Timed Blitz Rounds"
          highlight="Accelerate Retention"
          description="Solving 40 questions under strict stopwatch pressure replaces hesitance with lightning-fast elimination reflexes."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Stopwatch Pressure',
              desc: '45 seconds per question forces intuitive mastery of formulas and prevents getting bogged down on single tricky steps.',
              icon: <Timer className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: 'Live Public Standings',
              desc: 'See where you rank against hundreds of classmates within 30 seconds of completing the last question.',
              icon: <Trophy className="w-5 h-5 text-amber-500" />,
            },
            {
              title: '100% Free Competition',
              desc: 'Blitz tournaments are completely free with zero entry fees or paywalls for all matric and intermediate students.',
              icon: <Sparkles className="w-5 h-5 text-teal-600" />,
            },
          ].map((card, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-100 w-fit mb-3">{card.icon}</div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* Leaderboard Preview & Word Reveal (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Competition under pressure turns routine revision into sharp, exam-ready reflexes." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="LIVE BENCHMARK"
            title="Real-Time Public"
            highlight="Blitz Standings"
            description="Calibrate your performance against ambitious learners across Pakistan."
          />

          <ScreenCard
            mode="leaderboard"
            title="Blitz Round Standings (Sample)"
            subtitle="Physics · Circular Motion Rapid Drill"
          />
        </div>
      </Section>

      {/* How To Participate (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="PARTICIPATION GUIDE"
          title="Three Steps to Join the"
          highlight="Next Blitz Bout"
          description="Quick registration with zero barrier to entry."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Register in 30 Seconds',
              description: 'Select your subject and grade stream to claim your participant seat.',
              checklist: ['No Subscription Needed', 'Instant Session Reminder'],
              linkText: 'Register Now →',
              onLinkClick: () => onNavigate('/blitz/register'),
            },
            {
              number: '2',
              title: 'Enter at Countdown Launch',
              description: 'When the timer hits zero, questions unlock simultaneously for all participants.',
              checklist: ['Synchronized National Start', 'Live Per-Question Clock'],
            },
            {
              number: '3',
              title: 'Inspect Detailed Derivations',
              description: 'Immediately after the bout ends, inspect step-by-step derivations for all questions.',
              checklist: ['Full Answer Key', 'Rank & Speed Statistics'],
              linkText: 'View Past Leaderboards →',
              onLinkClick: () => onNavigate('/blitz/leaderboard'),
            },
          ]}
        />
      </Section>

      {/* CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="BLITZ"
          eyebrow="READY FOR THE NEXT ROUND?"
          title="Test Your Speed in the Next"
          highlight="Boardly Blitz"
          description="Join hundreds of classmates testing their subject knowledge under the clock."
          primaryButtonText="Register for Blitz"
          secondaryButtonText="View Standings"
          onPrimaryClick={() => onNavigate('/blitz/register')}
          onSecondaryClick={() => onNavigate('/blitz/leaderboard')}
        />
      </Section>
    </div>
  );
};
