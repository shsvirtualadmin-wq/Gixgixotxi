import React from 'react';
import {
  Calculator,
  Target,
  Brain,
  Cpu,
  Timer,
  Zap,
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

interface FastNuLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

const FAST_TYPEWRITER = [
  'FAST-NU Entry Speed',
  'Calculus & Analytical IQ',
  'Negative Marking Strategy',
  'CS Admissions Merit',
];

const ENGINEERING_DOMAINS = [
  {
    domain: 'Advanced Mathematics',
    weightage: '50% of Paper',
    icon: <Calculator className="w-5 h-5 text-indigo-600" />,
    topics: [
      'Limits, Derivatives & Optimization',
      'Integration & Area Under Curves',
      'Conic Sections & Analytic Geometry',
      'Vectors, Matrices & Determinants',
    ],
  },
  {
    domain: 'Basic & Everyday Math',
    weightage: '20% of Paper',
    icon: <Target className="w-5 h-5 text-blue-600" />,
    topics: [
      'Percentages, Ratios & Arithmetic',
      'Linear & Quadratic Systems',
      'Speed, Work Rates & Averages',
      'Geometric Areas & Volumes',
    ],
  },
  {
    domain: 'Analytical & IQ Reasoning',
    weightage: '20% of Paper',
    icon: <Brain className="w-5 h-5 text-amber-600" />,
    topics: [
      'Number Series & Matrix Grids',
      'Direction Senses & Blood Relations',
      'Deduction Puzzles & Syllogisms',
      'Non-Verbal Analogies',
    ],
  },
  {
    domain: 'Physics & Technical Basics',
    weightage: '10% of Paper',
    icon: <Cpu className="w-5 h-5 text-teal-600" />,
    topics: [
      'Vectors & Equilibrium Forces',
      'Projectile Dynamics & Momentum',
      'Current Electricity & Capacitance',
      'Mechanical Energy & Efficiency',
    ],
  },
];

const FAST_FAQS: FaqItem[] = [
  {
    question: 'Does FAST-NU penalize wrong answers with negative marking?',
    answer:
      'Yes. FAST-NU entry tests apply negative marking (-0.25 deducted per wrong MCQ). Boardly test runners calibrate authentic penalty calculations so you master when to attempt versus skip.',
  },
  {
    question: 'How does Boardly help train solving speed under 50 seconds?',
    answer:
      'Our practice engine highlights coefficient shortcuts, elimination strategies, and pattern recognition to shave critical seconds off mathematical and IQ problems.',
  },
  {
    question: 'Does this prepare for NUST NET and UET ECAT as well?',
    answer:
      'Yes, the engineering question banks comprehensively support NUST NET (Engineering & Computing), UET ECAT/TCAT, GIKI, and PIEAS admissions tests.',
  },
];

export const FastNuLandingPage: React.FC<FastNuLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="FAST-NU & COMPUTING ADMISSIONS"
        staticHeadingPrefix="Speed & Strategy for"
        typewriterPhrases={FAST_TYPEWRITER}
        staticHeadingSuffix="Nationwide"
        description="Master 6,000+ engineering and computing MCQs with authentic negative marking calibration, rapid mathematical shortcuts, and timed mock drills."
        primaryCtaText="Start Free FAST-NU Prep"
        secondaryCtaText="View Pro Plans"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={onNavigatePricing}
      />

      {/* 2. Domains (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="EXAM WEIGHTAGE DISTRIBUTION"
          title="Master All Four Test Domains with"
          highlight="Targeted Practice"
          description="From high-weightage Calculus to rapid IQ deduction, train the exact problem formats used by FAST-NU."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ENGINEERING_DOMAINS.map((dom, i) => (
            <ScrollReveal key={i} delayMs={i * 50}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100">{dom.icon}</div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {dom.weightage}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-900">{dom.domain}</h3>
                  <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                    {dom.topics.map((t, idx) => (
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
        <WordReveal statement="The FAST-NU test is won by speed and negative marking discipline, not slow pen-and-paper derivations." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="SHORTCUT DERIVATION"
            title="Interactive Speed Breakdown"
            highlight="Calculus Limits"
            description="Inspect rapid coefficient rules that solve complex limits in under 15 seconds."
          />

          <ScreenCard
            mode="practice"
            title="Advanced Math: Trigonometric Limits"
            subtitle="Rapid Coefficient Rule & Verification"
          />
        </div>
      </Section>

      {/* 4. Speed Training Flow (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="TIMING DISCIPLINE"
          title="From Scratch Calculations to"
          highlight="Sub-45-Second Accuracy"
          description="Build the rapid mental shortcuts required to finish all questions before the countdown expires."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Learn Shortcut Derivations',
              description: 'Replace 5-minute manual algebra with proven coefficient rules, derivative shortcuts, and elimination logic.',
              checklist: ['Trig & Calculus Shortcuts', 'Negative Marking Strategy'],
            },
            {
              number: '2',
              title: 'Simulate High-Speed Drill Sessions',
              description: 'Practice 30-question sprints with strict 45-second per-question countdowns and instant penalty scoring.',
              checklist: ['Per-Question Timers', 'Skip vs Attempt Training'],
            },
            {
              number: '3',
              title: 'Analyze Accuracy Percentiles',
              description: 'Track how many marks were lost to penalties and evaluate your readiness for CS admissions merit cutoffs.',
              checklist: ['Negative Penalty Breakdown', 'Merit Aggregate Tracking'],
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ADMISSIONS FAQS"
          title="FAST-NU Entry Test"
          highlight="Common Questions"
        />
        <FaqAccordion items={FAST_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="FAST-NU"
          eyebrow="ENGINEERING & CS PREP"
          title="Master the FAST-NU Test Format"
          highlight="Today"
          description="Begin solving high-speed mathematical and analytical reasoning questions right away."
          primaryButtonText="Start Free FAST-NU Prep"
          secondaryButtonText="Compare Plans"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={onNavigatePricing}
        />
      </Section>
    </div>
  );
};
