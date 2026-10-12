import React from 'react';
import {
  GraduationCap,
  Layers,
  Award,
  BookOpen,
  Atom,
  Brain,
  Calculator,
  Compass,
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

interface FscMatricLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

const FSC_TYPEWRITER = [
  'FSC Board Exam Confidence',
  'Matric High Scoring',
  'SLO Concept Clarity',
  'Physics & Math Mastery',
];

const GRADE_STREAMS = [
  {
    grade: 'Matric (Class 9 & 10)',
    icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
    focus: 'SSC Part 1 & 2 Examination',
    subjects: [
      'Physics (Dynamics, Motion, Gravitation, Thermal)',
      'Chemistry (Atomic Structure, Reactions, Acids)',
      'Biology / CS (Cellular Biology, Fundamentals)',
      'Mathematics (Algebra, Matrices, Geometry, Trigonometry)',
    ],
  },
  {
    grade: 'FSC Part 1 (Class 11)',
    icon: <Layers className="w-5 h-5 text-teal-600" />,
    focus: 'HSSC Part 1 Foundation',
    subjects: [
      'Physics (Vectors, Circular Dynamics, Thermodynamics)',
      'Chemistry (Stoichiometry, Orbital Hybridization, Gases)',
      'Biology (Cell Ultra-structure, Bioenergetics, Enzymes)',
      'Mathematics (Matrices, Sequences, Complex Numbers)',
    ],
  },
  {
    grade: 'FSC Part 2 (Class 12)',
    icon: <Award className="w-5 h-5 text-violet-600" />,
    focus: 'HSSC Part 2 & Merit Maximizer',
    subjects: [
      'Physics (Electrostatics, Electromagnetism, Nuclear)',
      'Chemistry (Inorganic Periodicity, Organic Carbonyls)',
      'Biology (Homeostasis, Chromosomes, Biotechnology)',
      'Mathematics (Calculus, Analytic Geometry, Conics)',
    ],
  },
];

const FSC_FAQS: FaqItem[] = [
  {
    question: 'Does Boardly cater to the new FBISE SLO (Student Learning Outcomes) pattern?',
    answer:
      'Yes! FBISE and provincial boards now emphasize conceptual application over rote memorization. Boardly questions reflect real board paper SLO cognitive distributions.',
  },
  {
    question: 'Which provincial boards are covered?',
    answer:
      'Curricula are aligned with FBISE (Federal Board), BISE Lahore, Rawalpindi, Gujranwala, Multan, Karachi, Peshawar, Quetta, and all other major regional boards.',
  },
  {
    question: 'Can I practice individual chapters before school send-up exams?',
    answer:
      'Yes, each textbook chapter is split into focused diagnostic drills so you can practice single units and verify formulas before school midterms.',
  },
];

export const FscMatricLandingPage: React.FC<FscMatricLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="FBISE & PROVINCIAL BOARDS"
        staticHeadingPrefix="Concept-Based Practice for"
        typewriterPhrases={FSC_TYPEWRITER}
        staticHeadingSuffix="Nationwide"
        description="Master 10,000+ SLO-aligned MCQs, test your timing with chapter mocks, and prepare for Federal and Provincial board exams."
        primaryCtaText="Start Free Practice"
        secondaryCtaText="View Pro Plans"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={onNavigatePricing}
      />

      {/* 2. Streams (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="GRADE STREAMS"
          title="Structured for SSC & HSSC"
          highlight="Board Curricula"
          description="Tailored question banks for Matric, Class 11, and Class 12 covering science, math, and general tracks."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GRADE_STREAMS.map((stream, idx) => (
            <ScrollReveal key={idx} delayMs={idx * 60}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-100 w-fit mb-3">{stream.icon}</div>
                  <h3 className="text-lg font-bold font-display text-slate-900">{stream.grade}</h3>
                  <div className="text-xs font-mono font-semibold text-indigo-600 mt-1 mb-4">
                    {stream.focus}
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    {stream.subjects.map((sub, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{sub}</span>
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
        <WordReveal statement="Memorizing past papers is no longer enough. Modern SLO exam papers demand true conceptual understanding." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="SLO DEMONSTRATION"
            title="Interactive Concept Breakdown"
            highlight="Work & Energy"
            description="Inspect authentic derivations and principles behind every question."
          />

          <ScreenCard
            mode="practice"
            title="Physics Class 11: Conservation of Energy (Sample)"
            subtitle="Mechanical Energy & Kinetic Formulas"
          />
        </div>
      </Section>

      {/* 4. Revision Flow (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="REVISION DISCIPLINE"
          title="From Textbook Chapters to"
          highlight="Board Exam Confidence"
          description="A systematic method to ensure zero surprises in your final paper."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Target Chapter-Wise Drills',
              description: 'Complete 20-question quizzes for specific chapters like Matrices, Stoichiometry, or Vectors.',
              checklist: ['SLO Question Sets', 'Immediate Derivation Keys'],
            },
            {
              number: '2',
              title: 'Attempt Timed Send-Up Mocks',
              description: 'Practice multi-chapter combinations under strict 15–30 minute timers matching your board duration.',
              checklist: ['Timer Pressure Training', 'Question Switching Practice'],
            },
            {
              number: '3',
              title: 'Review Formula Vault Derivations',
              description: 'Quickly cross-check complex laws, constants, and unit conversions in the built-in reference vault.',
              checklist: ['Full Formula Summaries', 'High-Yield Definitions'],
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="BOARD FAQS"
          title="FSC & Matric Questions"
          highlight="Answered"
        />
        <FaqAccordion items={FSC_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="BOARDS"
          eyebrow="READY FOR HIGH MARKS?"
          title="Start Practicing Your Board Syllabus"
          highlight="Now"
          description="Free diagnostic testing is ready immediately on any smartphone or tablet."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="Compare Plans"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={onNavigatePricing}
        />
      </Section>
    </div>
  );
};
