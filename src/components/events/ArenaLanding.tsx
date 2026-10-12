import React, { useState } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { INITIAL_SESSIONS } from '../../data/eventsStore';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { ScreenCard } from '../marketing/ScreenCard';
import { WordReveal } from '../marketing/design-system/WordReveal';
import { StepsList } from '../marketing/design-system/StepsList';
import { FaqAccordion, FaqItem } from '../marketing/design-system/FaqAccordion';
import { CtaSection } from '../marketing/design-system/CtaSection';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';

interface ArenaLandingProps {
  onNavigate: (route: string) => void;
}

const ARENA_TYPEWRITER = [
  'Full-Length Mocks',
  'NUST NET Simulations',
  'FAST-NU & GIKI Bouts',
  'National Grand Tournaments',
];

const ARENA_FAQS: FaqItem[] = [
  {
    question: 'What is Boardly Arena?',
    answer:
      'Boardly Arena is a nationwide tournament series hosting official-length entrance test mocks. Every tournament rigorously matches the exact syllabus weightage, question count, marking scheme, and time constraints of Pakistan’s top universities.',
  },
  {
    question: 'Which university formats are mirrored?',
    answer:
      'Arena covers full-length papers for NUST (NET Engineering & Computing), FAST-NU, GIKI, UET (ECAT), PIEAS, and MDCAT medical entrance examinations.',
  },
  {
    question: 'Is participation completely free?',
    answer:
      'Yes! Regular Arena tournament seasons are 100% free for all registered candidates with zero entry paywalls.',
  },
];

export const ArenaLanding: React.FC<ArenaLandingProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Engineering' | 'Medical'>('All');

  const arenaSessions = INITIAL_SESSIONS.filter((s) => s.type === 'arena');
  const filteredSessions = arenaSessions.filter((s) => {
    if (activeTab === 'All') return true;
    return s.category === activeTab;
  });

  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="GRAND MOCK TOURNAMENTS"
        staticHeadingPrefix="Official-Length Mocks in"
        typewriterPhrases={ARENA_TYPEWRITER}
        staticHeadingSuffix="Across Pakistan"
        description="Full-length timed grand tournaments mirroring entrance exams for Pakistan’s premier engineering, computing, and medical universities."
        primaryCtaText="Browse Tournaments"
        secondaryCtaText="View Leaderboard"
        onPrimaryCta={() => {
          const el = document.getElementById('arena-sessions');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSecondaryCta={() => onNavigate('/arena/leaderboard')}
      />

      {/* 2. Tournament Sessions (Light) */}
      <Section variant="light" id="arena-sessions">
        <SectionHeader
          eyebrow="SCHEDULED TOURNAMENTS"
          title="Upcoming Grand Mock"
          highlight="Competitive Sessions"
          description="Select an upcoming session to simulate full exam conditions alongside hundreds of peers."
        />

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm gap-1">
            {(['All', 'Engineering', 'Medical'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {filteredSessions.map((session, i) => (
            <ScrollReveal key={session.id} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {session.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {session.durationMinutes} Mins · {session.totalQuestions} MCQs
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-900">{session.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{session.subject}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">Free Registration</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('/arena/leaderboard')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>View Standings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 3. Word Reveal & ScreenCard (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Simulating the exact question count and time limits is the only way to eliminate test-day anxiety." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="TOURNAMENT STANDINGS"
            title="Live Arena Tournament"
            highlight="Grand Leaderboard"
            description="Verified national rank calibrated against thousands of classmates."
          />

          <ScreenCard
            mode="leaderboard"
            title="Arena Grand Mock Standings (Sample)"
            subtitle="Full-Length 180-Question Simulation"
          />
        </div>
      </Section>

      {/* 4. Tournament Process (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="Three Steps to Compete in"
          highlight="Boardly Arena"
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Select Target Exam Tournament',
              description: 'Pick an Arena round matching your target university format (NUST, FAST-NU, MDCAT, etc.).',
              checklist: ['Exact Question Distribution', 'Negative Marking Rules'],
            },
            {
              number: '2',
              title: 'Complete Full-Length Paper',
              description: 'Solve the complete test under timed conditions with real-time section switching.',
              checklist: ['Simulated Test Room Timer', 'Flag for Review Tools'],
            },
            {
              number: '3',
              title: 'Review National Percentile',
              description: 'Inspect where your aggregate places you relative to past admissions merit thresholds.',
              checklist: ['Aggregate Estimation', 'In-depth Question Derivations'],
              linkText: 'Check Current Standings →',
              onLinkClick: () => onNavigate('/arena/leaderboard'),
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ARENA FAQS"
          title="Tournament Questions"
          highlight="Answered"
        />
        <FaqAccordion items={ARENA_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="ARENA"
          eyebrow="NATIONWIDE TOURNAMENTS"
          title="Step Into the"
          highlight="Boardly Arena"
          description="Compete in scheduled full-length mock exams for premier universities across Pakistan."
          primaryButtonText="View Leaderboard"
          secondaryButtonText="Explore Curriculum"
          onPrimaryClick={() => onNavigate('/arena/leaderboard')}
          onSecondaryClick={() => onNavigate('/features')}
        />
      </Section>
    </div>
  );
};
