import React from 'react';
import {
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  FileDown,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';
import { MarketingPage } from './Navbar';
import { Hero } from './design-system/Hero';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { ScreenCard } from './ScreenCard';
import { WordReveal } from './design-system/WordReveal';
import { StepsList } from './design-system/StepsList';
import { FaqAccordion, FaqItem } from './design-system/FaqAccordion';
import { CtaSection } from './design-system/CtaSection';
import { ScrollReveal } from './design-system/useScrollReveal';

interface FeaturesPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
}

const FEATURES_TYPEWRITER = [
  'Diagnostic Mocks',
  'Formula Derivations',
  'SLO Alignment',
  'Exam Pace Training',
];

const FEATURES_FAQS: FaqItem[] = [
  {
    question: 'How do step-by-step derivations work?',
    answer:
      'Whenever you complete a question or drill, you can reveal the mathematical derivation, fundamental law, or syllabus concept backing the correct answer.',
  },
  {
    question: 'Are questions aligned with the latest SLO curriculum?',
    answer:
      'Yes, questions strictly align with the newest Student Learning Outcomes (SLOs) established by FBISE and provincial boards for Classes 9–12.',
  },
  {
    question: 'Can I export mock tests as printable PDFs?',
    answer:
      'Yes, Pro members can export curated mock test papers with answer keys for offline revision or group study circle practice.',
  },
];

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigate,
  onGetStarted,
}) => {
  return (
    <div className="w-full">
      {/* Hero */}
      <Hero
        eyebrow="ACADEMIC ENGINE CAPABILITIES"
        staticHeadingPrefix="Engineered for"
        typewriterPhrases={FEATURES_TYPEWRITER}
        staticHeadingSuffix="at Every Level"
        description="Explore the diagnostic question algorithms, verified curricula, and timed revision tools powering the Boardly test prep engine."
        primaryCtaText="Start Free Practice"
        secondaryCtaText="Compare Plans"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={() => onNavigate('pricing')}
      />

      {/* Feature 1: Chapter-Wise Question Vaults (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="PILLAR 01 · COMPLETE CURRICULUM"
          title="Chapter-Wise Question Vaults with"
          highlight="Step Derivations"
          description="No ambiguous keys. Every question contains the verified choice plus step-by-step formulas and conceptual explanations."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4 text-left">
            {[
              {
                title: 'Latest 2026 SLO Alignment',
                desc: 'Strictly aligned with modern concept-based question structures across FBISE and provincial boards.',
              },
              {
                title: 'Three Cognitive Difficulty Tiers',
                desc: 'Drill knowledge Recall, practical Application, and multi-step Synthesis problems.',
              },
              {
                title: 'Subject Breadth',
                desc: 'Full coverage of Physics, Chemistry, Biology, Mathematics, Computer Science, and English.',
              },
            ].map((f, i) => (
              <ScrollReveal key={i} delayMs={i * 60}>
                <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="lg:col-span-6">
            <ScrollReveal delayMs={120}>
              <ScreenCard
                mode="practice"
                title="Chapter Vault: Electrostatics"
                subtitle="Physics · Class 12 Chapter 1"
              />
            </ScrollReveal>
          </div>
        </div>
      </Section>

      {/* Feature 2: Timed Mock Exams & Negative Marking (Dark) */}
      <Section variant="dark">
        <WordReveal statement="True exam mastery requires solving tricky questions under timer pressure, not passive video watching." />

        <div className="mt-12">
          <SectionHeader
            dark
            eyebrow="PILLAR 02 · REAL EXAM PRESSURE"
            title="Authentic Timed Mocks with"
            highlight="Negative Marking"
            description="Replicate authentic exam day constraints with per-question countdowns and accurate penalty rules."
          />

          <StepsList
            steps={[
              {
                number: '1',
                title: 'Select Exam Format',
                description: 'Choose between 15-minute blitz drills, full 200-MCQ MDCAT mocks, or FAST-NU analytical reasoning papers.',
                checklist: ['Custom Time Constraints', 'Authentic Question Ratios'],
              },
              {
                number: '2',
                title: 'Simulate Penalty Scoring',
                description: 'Incorrect answers penalize fractional marks, training you to avoid reckless guessing under pressure.',
                checklist: ['Negative Marking Calculations', 'Accuracy vs Guessing Feedback'],
              },
              {
                number: '3',
                title: 'Instant Comprehensive Scorecard',
                description: 'Review your total marks, accuracy percentage, average time per question, and national percentile standing.',
                checklist: ['Time-Per-Question Breakdown', 'Percentile Benchmarks'],
              },
            ]}
          />
        </div>
      </Section>

      {/* Feature 3: Diagnostic Weakness Detection (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="PILLAR 03 · TARGETED MASTERY"
          title="Diagnostic Weakness Detection"
          highlight="Fixes Mark Leaks"
          description="Know exactly which subtopics drop your aggregate before walking into the actual exam hall."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Subtopic Precision',
              desc: 'Instead of saying "weak in Physics", Boardly isolates "Electromagnetic Induction numericals".',
              icon: <Brain className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: 'Speed Tracking',
              desc: 'Identifies questions where you took longer than 60 seconds so you build rapid recall.',
              icon: <Timer className="w-5 h-5 text-teal-600" />,
            },
            {
              title: 'Spaced Retesting',
              desc: 'Incorrect answers cycle back into subsequent revision drills until verified mastered.',
              icon: <Zap className="w-5 h-5 text-violet-600" />,
            },
          ].map((card, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs text-left space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-100 w-fit">{card.icon}</div>
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="FREQUENT QUESTIONS"
          title="Feature & Diagnostic"
          highlight="Questions Answered"
        />
        <FaqAccordion items={FEATURES_FAQS} />
      </Section>

      {/* CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="ENGINE"
          eyebrow="START PRACTICING TODAY"
          title="Accelerate Your Scores with"
          highlight="Diagnostic Testing"
          description="Join thousands of students practicing on Pakistan's premier test prep portal."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="View Pricing"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={() => onNavigate('pricing')}
        />
      </Section>
    </div>
  );
};
