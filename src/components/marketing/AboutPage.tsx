import React from 'react';
import { Target, Compass, Award, ExternalLink } from 'lucide-react';
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

interface AboutPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
}

const ABOUT_TYPEWRITER = [
  'Diagnostic Test Access',
  'Academic Integrity',
  'Transparent Derivations',
  'National Education Mission',
];

const ABOUT_FAQS: FaqItem[] = [
  {
    question: 'What is the relationship between Boardly and SHS Virtual Academy?',
    answer:
      'Boardly is an academic testing engine developed under the pedagogical guidance of SHS Virtual Academy. While SHS Virtual Academy conducts live counseling and structured tuition, Boardly provides the national diagnostic testing portal for self-paced practice.',
  },
  {
    question: 'Are question banks authored by qualified subject educators?',
    answer:
      'Yes, questions and derivations are curated by experienced educators aligned with FBISE and provincial board examination specifications, with extensive review for factual accuracy.',
  },
  {
    question: 'How does Boardly maintain high server availability during peak exam seasons?',
    answer:
      'Our platform is engineered as a lightweight, cloud-native application optimized for low latency across mobile data connections in all regions of Pakistan.',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onGetStarted }) => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="ACADEMIC HERITAGE & MISSION"
        staticHeadingPrefix="Democratizing Education for"
        typewriterPhrases={ABOUT_TYPEWRITER}
        staticHeadingSuffix="Across Pakistan"
        description="Boardly provides every Matric, Intermediate, and competitive entrance test aspirant with diagnostic question banks, transparent derivations, and authentic mock exams."
        primaryCtaText="Start Free Practice"
        secondaryCtaText="Contact Team"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={() => onNavigate('contact')}
      />

      {/* 2. Institutional Partnership (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ACADEMIC ROOTS"
          title="Proudly Engineered by"
          highlight="SHS Virtual Academy"
          description="A specialized testing initiative operating under verified curriculum guidance."
        />

        <div className="max-w-4xl mx-auto p-6 sm:p-10 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm text-left space-y-4 font-sans text-sm sm:text-base text-slate-700 leading-relaxed">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-bold uppercase text-indigo-600 tracking-wider">
              Curriculum Leadership
            </span>
            <a
              href="https://shsvirtualacademy.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>Visit shsvirtualacademy.pro</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p>
            Boardly operates under the curriculum leadership and academic direction of{' '}
            <strong className="text-slate-900 font-bold">SHS Virtual Academy</strong>. While SHS Virtual Academy leads online secondary classes, student counseling, and live pedagogical mentorship, Boardly serves as the high-yield diagnostic testing portal where learners test retention, benchmark speed, and analyze performance against thousands of classmates nationwide.
          </p>
        </div>
      </Section>

      {/* 3. Word Reveal & ScreenCard (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Every student in Pakistan deserves top-tier diagnostic test practice without financial barriers." />

        <div className="mt-12 max-w-4xl mx-auto space-y-12">
          <SectionHeader
            dark
            eyebrow="CORE VALUES"
            title="Three Tenets That Guide"
            highlight="Every Question We Publish"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Active Testing Over Cramming',
                desc: 'Reading answers creates a false illusion of competence. Only answering under time pressure confirms true readiness.',
                icon: <Target className="w-5 h-5 text-indigo-400" />,
              },
              {
                title: 'Transparent Mathematical Steps',
                desc: 'No mysterious answer keys. Every numerical or conceptual MCQ includes full step-by-step derivations.',
                icon: <Compass className="w-5 h-5 text-teal-400" />,
              },
              {
                title: 'Accessibility for Every City',
                desc: 'Free core access ensuring students in remote districts receive the exact same quality prep as high-end academies.',
                icon: <Award className="w-5 h-5 text-amber-400" />,
              },
            ].map((v, i) => (
              <ScrollReveal key={i} delayMs={i * 60}>
                <div className="p-6 rounded-[24px] bg-slate-900/80 border border-slate-800 text-left space-y-3 h-full">
                  <div className="p-2.5 rounded-xl bg-slate-800 w-fit">{v.icon}</div>
                  <h3 className="text-base font-bold text-white font-display">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="pt-6">
            <ScreenCard
              mode="dashboard"
              title="Boardly Academic Integrity Portal"
              subtitle="Curriculum Alignment Verification · Student A."
              chips={[
                {
                  label: 'Syllabus match',
                  value: '100% SLO Aligned',
                  position: 'top-right',
                },
                {
                  label: 'Derivations',
                  value: 'Verified Formulas',
                  position: 'bottom-left',
                },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* 4. Methodology Steps (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="PEDAGOGICAL DISCIPLINE"
          title="How Boardly Maintains"
          highlight="Curriculum Standards"
          description="A rigorous process behind every single diagnostic question bank and mock exam."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'SLO-Mapped Question Drafting',
              description:
                'Every question is authored against official federal and provincial board learning objectives.',
              checklist: ['Cognitive Level Tagging', 'Curriculum Mapping Verification'],
            },
            {
              number: '2',
              title: 'Multi-Step Derivation Authoring',
              description:
                'Educators provide complete mathematical steps, textbook citations, and reasoning for every choice.',
              checklist: ['Zero Ambiguous Keys', 'Step-by-Step Mathematical Clarity'],
            },
            {
              number: '3',
              title: 'Diagnostic Test Delivery',
              description:
                'Tests are deployed across mobile-friendly interfaces with real-time timers and instant feedback.',
              checklist: ['360px Mobile First UI', 'Zero Barrier Free Access'],
              linkText: 'Explore Features →',
              onLinkClick: () => onNavigate('features'),
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="MISSION & OPERATIONS"
          title="Frequently Asked Questions"
          highlight="About Boardly"
        />
        <FaqAccordion items={ABOUT_FAQS} />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="MISSION"
          eyebrow="JOIN THE COMMUNITY"
          title="Start Practicing with Boardly"
          highlight="Today"
          description="Prepare for Matric, FSC, and competitive entry tests with complete confidence."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="View Plans"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={() => onNavigate('pricing')}
        />
      </Section>
    </div>
  );
};
