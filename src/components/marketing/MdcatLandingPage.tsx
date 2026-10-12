import React from 'react';
import {
  Stethoscope,
  Microscope,
  Atom,
  Brain,
  BookOpen,
  Timer,
  CheckCircle2,
  BarChart3,
  Award,
} from 'lucide-react';
import { Hero } from './design-system/Hero';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { ScreenCard } from './ScreenCard';
import { WordReveal } from './design-system/WordReveal';
import { StepsList } from './design-system/StepsList';
import { FaqAccordion, FaqItem } from './design-system/FaqAccordion';
import { CtaSection } from './design-system/CtaSection';
import { ScrollReveal } from './design-system/useScrollReveal';

interface MdcatLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

const MDCAT_TYPEWRITER = [
  'PMDC MDCAT Mastery',
  'High-Yield Bio Drills',
  'Chemistry & Physics Speed',
  'Medical College Merit',
];

const HIGH_YIELD_TOPICS = [
  {
    subject: 'Biology',
    icon: <Microscope className="w-5 h-5 text-emerald-600" />,
    weightage: '34% (68 Questions)',
    topics: [
      'Cell Structure & Function',
      'Biological Molecules & Enzymes',
      'Bioenergetics (Photosynthesis & Respiration)',
      'Coordination & Nervous System',
      'Genetics & DNA Replication',
    ],
  },
  {
    subject: 'Chemistry',
    icon: <Atom className="w-5 h-5 text-indigo-600" />,
    weightage: '27% (54 Questions)',
    topics: [
      'Atomic Structure & Quantum Numbers',
      'Chemical Bonding & Hybridization',
      'Chemical Equilibrium & Le Chatelier',
      'Reaction Kinetics & Thermochemistry',
      'Organic Reaction Mechanisms',
    ],
  },
  {
    subject: 'Physics',
    icon: <Brain className="w-5 h-5 text-blue-600" />,
    weightage: '27% (54 Questions)',
    topics: [
      'Force, Motion & Momentum',
      'Work, Energy & Conservation Laws',
      'Waves, Doppler Effect & Optics',
      'Current Electricity & Kirchhoff Rules',
      'Electromagnetism & Nuclear Physics',
    ],
  },
  {
    subject: 'English & Logic',
    icon: <BookOpen className="w-5 h-5 text-amber-600" />,
    weightage: '12% (24 Questions)',
    topics: [
      'Subject-Verb Agreement & Syntax',
      'Contextual Vocabulary & Phrasal Verbs',
      'Critical Deduction & Cause-and-Effect',
      'Logical Syllogisms & Sequences',
    ],
  },
];

const MDCAT_FAQS: FaqItem[] = [
  {
    question: 'Does Boardly follow the official PMDC MDCAT test syllabus?',
    answer:
      'Yes, our question banks and mock tests are strictly mapped against the latest PMDC curriculum guidelines across Biology, Chemistry, Physics, English, and Logical Reasoning.',
  },
  {
    question: 'Are full-length 200-question timed mocks available?',
    answer:
      'Yes, you can simulate the full 3.5-hour exam under authentic timing and question distribution to test stamina and speed.',
  },
  {
    question: 'Can I practice questions topic-by-topic?',
    answer:
      'Yes, each subject is divided into distinct chapters and subtopics so you can eliminate individual weak points before attempting full papers.',
  },
];

export const MdcatLandingPage: React.FC<MdcatLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="MEDICAL ADMISSIONS TEST PREP"
        staticHeadingPrefix="The Targeted Path to"
        typewriterPhrases={MDCAT_TYPEWRITER}
        staticHeadingSuffix="Across Pakistan"
        description="Master 8,000+ PMDC-aligned medical MCQs, test yourself with authentic 200-question timed mocks, and fix weak numericals with step-by-step derivations."
        primaryCtaText="Start Free MDCAT Practice"
        secondaryCtaText="View Pro Plans"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={onNavigatePricing}
      />

      {/* 2. High-Yield Syllabus Breakdown (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="PMDC WEIGHTAGE BREAKDOWN"
          title="Curated Coverage Across"
          highlight="All Four Sections"
          description="Every section calibrated to PMDC exam weightage with questions across knowledge, application, and synthesis levels."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HIGH_YIELD_TOPICS.map((sec, i) => (
            <ScrollReveal key={i} delayMs={i * 50}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100">{sec.icon}</div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {sec.weightage}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-900">{sec.subject}</h3>
                  <ul className="space-y-2 text-xs text-slate-600 font-sans border-t border-slate-100 pt-3">
                    {sec.topics.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 3. Word Reveal & Interactive ScreenCard (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Precision in high-yield medical topics separates top merit contenders from the crowd." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="DIAGNOSTIC DERIVATIONS"
            title="Interactive MDCAT Question"
            highlight="Step Breakdown"
            description="Inspect authentic derivations and conceptual rationales for every single answer choice."
          />

          <ScreenCard
            mode="practice"
            title="MDCAT Biology: Cell Structure"
            subtitle="Smooth Endoplasmic Reticulum vs Rough ER"
          />
        </div>
      </Section>

      {/* 4. Mock Testing Flow (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="REAL EXAM PACE"
          title="From Topic Drills to"
          highlight="Full-Length 200-MCQ Mocks"
          description="Build the endurance and rapid decision-making required for test day."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Chapter Level Diagnostic Drills',
              description: 'Focus on individual high-yield topics like Bioenergetics, Genetics, or Organic Chemistry mechanisms.',
              checklist: ['Targeted Subtopic Practice', 'Instant Mathematical Explanations'],
            },
            {
              number: '2',
              title: 'Full 200-Question Simulated Exam',
              description: 'Timed 3.5-hour mock exam matching PMDC question ratios across all 4 subjects simultaneously.',
              checklist: ['Realistic Countdown Timer', 'Stamina & Time Management Training'],
            },
            {
              number: '3',
              title: 'Aggregate Percentile Analytics',
              description: 'Review your total score, estimated aggregate percentile, and specific question derivations.',
              checklist: ['Diagnostic Leak Detection', 'National Cohort Benchmarks'],
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="EXAM FAQs"
          title="MDCAT Preparation"
          highlight="Common Questions"
        />
        <FaqAccordion items={MDCAT_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="MDCAT"
          eyebrow="MEDICAL PREP"
          title="Begin Your MDCAT Revision"
          highlight="Today"
          description="Start practicing chapter question vaults now. No fee required for initial drills."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="Compare Plans"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={onNavigatePricing}
        />
      </Section>
    </div>
  );
};
