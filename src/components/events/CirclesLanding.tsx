import React from 'react';
import { Users, Award, ShieldCheck, Zap, Trophy, Sparkles } from 'lucide-react';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { ScreenCard } from '../marketing/ScreenCard';
import { WordReveal } from '../marketing/design-system/WordReveal';
import { StepsList } from '../marketing/design-system/StepsList';
import { FaqAccordion, FaqItem } from '../marketing/design-system/FaqAccordion';
import { CtaSection } from '../marketing/design-system/CtaSection';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';

interface CirclesLandingProps {
  onNavigate: (route: string) => void;
}

const CIRCLES_TYPEWRITER = [
  'Batch Study Sprints',
  'Custom Timed Drills',
  'Live Campus Standings',
  'Collaborative Revision',
];

const CIRCLES_FAQS: FaqItem[] = [
  {
    question: 'What is a Boardly Study Circle?',
    answer:
      'A Study Circle is a student-led cohort where a verified campus organizer schedules synchronized testing bouts for classmates. Organizers choose the chapter, question count, and time limits, and Boardly generates live leaderboards automatically.',
  },
  {
    question: 'How many students can participate in a Study Circle bout?',
    answer:
      'Study Circle events support anywhere from a small 5-person study group to large 250+ student college batches simultaneously with zero latency.',
  },
  {
    question: 'Are Study Circle events completely free for participants?',
    answer:
      'Yes, 100% free! Every classmate accessing your circle’s link can attempt questions and view score derivations with zero fees.',
  },
  {
    question: 'What recognition do Study Circle organizers receive?',
    answer:
      'Active organizers unlock complimentary 30-day Pro access, signed certificates of leadership from SHS Virtual Academy for CVs, and priority invitation to the Boardly Crew leadership network.',
  },
];

export const CirclesLanding: React.FC<CirclesLandingProps> = ({ onNavigate }) => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="CAMPUS PEER SESSIONS"
        staticHeadingPrefix="Host Synchronized Mocks with"
        typewriterPhrases={CIRCLES_TYPEWRITER}
        staticHeadingSuffix="for Your Class"
        description="Launch timed diagnostic question sprints for your study group, coaching batch, or college society. Automated timing, real-time leaderboards, and instant derivations."
        primaryCtaText="Apply to Organize"
        secondaryCtaText="Browse Blitz Rounds"
        onPrimaryCta={() => onNavigate('/circles/apply')}
        onSecondaryCta={() => onNavigate('/blitz')}
      />

      {/* 2. Decentralized Peer Scale (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="COMMUNITY-DRIVEN LEARNING"
          title="Why Campus Study Circles"
          highlight="Outperform Solo Cramming"
          description="Preparing in synchronized peer groups creates accountability, benchmarks genuine speed, and turns revision into a shared victory."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Batch-Aligned Timers',
              desc: 'Configure question limits and countdown timers matching your specific classroom syllabus or upcoming college send-ups.',
              icon: <Zap className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: 'Instant Public Leaderboard',
              desc: 'Submissions calculate automatically with optional negative marking. Students see their rank within seconds of finishing.',
              icon: <Trophy className="w-5 h-5 text-amber-500" />,
            },
            {
              title: '100% Free for Batchmates',
              desc: 'Zero barriers or required subscriptions for participants. Any student with the link can join the drill on mobile.',
              icon: <Sparkles className="w-5 h-5 text-teal-600" />,
            },
          ].map((card, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-100 w-fit mb-3">{card.icon}</div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-sans">{card.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 3. Word Reveal & Interactive ScreenCard (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Peer accountability and shared revision transform tough syllabus topics into collaborative confidence." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="EVENT COMMAND CENTER"
            title="Interactive Study Circle"
            highlight="Organizer View"
            description="Manage live participant entries, launch new quiz bouts, and broadcast real-time rankings."
          />

          <ScreenCard
            mode="crew"
            title="Study Circle Event Command (Sample)"
            subtitle="Campus Batch Revision Sprint · Student A."
            chips={[
              {
                label: 'Session (Sample)',
                value: 'Physics Mechanics Mock',
                position: 'top-right',
              },
              {
                label: 'Active Peers (Sample)',
                value: '88 Students Solving',
                position: 'bottom-left',
              },
            ]}
          />
        </div>
      </Section>

      {/* 4. How It Works Steps (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ORGANIZER PROCESS"
          title="Four Simple Steps to Lead a"
          highlight="Campus Study Circle"
          description="Everything you need to run impactful academic tournaments for your batchmates."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Submit Organizer Application',
              description: 'Provide your institution name, academic stream, and student circle goals.',
              checklist: ['2-Minute Fast Form', 'Zero Fee or Equipment Required'],
              linkText: 'Apply to Organize →',
              onLinkClick: () => onNavigate('/circles/apply'),
            },
            {
              number: '2',
              title: 'Configure Your Session Rules',
              description: 'Select subjects, question counts, and duration timers tailored to your class.',
              checklist: ['Custom Question Curation', 'Optional Negative Marking'],
            },
            {
              number: '3',
              title: 'Share the Event Link',
              description: 'Send your unique event PIN or link to your class WhatsApp group or student council.',
              checklist: ['Mobile Friendly on All Devices', 'No App Install Needed'],
            },
            {
              number: '4',
              title: 'Review Live Rankings & Derivations',
              description: 'Watch real-time submissions and guide your cohort through mathematical derivations afterwards.',
              checklist: ['Instant Leaderboard Computation', 'Verified Step Explanations'],
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="CIRCLE FAQS"
          title="Frequently Asked Questions"
          highlight="About Study Circles"
        />
        <FaqAccordion items={CIRCLES_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="CIRCLES"
          eyebrow="EMPOWER YOUR BATCH"
          title="Lead a Study Circle for"
          highlight="Your Campus"
          description="Join ambitious batch leaders hosting timed peer study sessions across Pakistan."
          primaryButtonText="Apply to Organize"
          secondaryButtonText="Browse Blitz Rounds"
          onPrimaryClick={() => onNavigate('/circles/apply')}
          onSecondaryClick={() => onNavigate('/blitz')}
        />
      </Section>
    </div>
  );
};
