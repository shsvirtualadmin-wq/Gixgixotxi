import React, { useState, useMemo } from 'react';
import { MapPin, Calculator, ArrowRight, Compass } from 'lucide-react';
import { UNIVERSITIES_CONFIG } from '../../config/universities';
import { UniversityLogo } from './UniversityLogo';
import { SeoHead } from '../common/SeoHead';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { ScreenCard } from '../marketing/ScreenCard';
import { WordReveal } from '../marketing/design-system/WordReveal';
import { StepsList } from '../marketing/design-system/StepsList';
import { FaqAccordion, FaqItem } from '../marketing/design-system/FaqAccordion';
import { CtaSection } from '../marketing/design-system/CtaSection';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';

interface UniversityExplorerProps {
  onNavigateMeritMeter?: (uniId: string) => void;
  onNavigatePredictor?: () => void;
}

type CategoryTab = 'All' | 'Engineering & CS' | 'Medical' | 'Business';

const EXPLORER_TYPEWRITER = [
  'University Aggregate Check',
  'Authentic Weightage Models',
  'Engineering & Medical Merit',
  'Admissions Probability',
];

const EXPLORER_FAQS: FaqItem[] = [
  {
    question: 'How is university admission aggregate calculated in Pakistan?',
    answer:
      'Different universities allocate distinct percentage weightages to Matric (SSC), Intermediate (HSSC Part 1 or Part 2), and Entry Test scores. Boardly pre-configures official formulas so your aggregate is computed with zero guesswork.',
  },
  {
    question: 'Are university entry test weightages up-to-date for 2026?',
    answer:
      'Yes, weightage distributions reflect current admission criteria published in prospectuses across NUST, FAST-NU, GIKI, PIEAS, UET, and PMDC medical colleges.',
  },
  {
    question: 'Can I simulate what entry test score I need to secure admission?',
    answer:
      'Yes! By entering your known Matric and FSC marks into the Merit Meter, you can experiment with projected test scores to identify the exact threshold required for your target engineering or medical seat.',
  },
];

export const UniversityExplorer: React.FC<UniversityExplorerProps> = ({
  onNavigateMeritMeter,
  onNavigatePredictor,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
  const universityCount = UNIVERSITIES_CONFIG.length;

  const filteredUnis = useMemo(() => {
    if (activeTab === 'All') return UNIVERSITIES_CONFIG;
    return UNIVERSITIES_CONFIG.filter((u) => u.category.includes(activeTab as any));
  }, [activeTab]);

  const handleCalculateClick = (uniId: string) => {
    if (onNavigateMeritMeter) {
      onNavigateMeritMeter(uniId);
    } else {
      const target = `/merit-meter?uni=${encodeURIComponent(uniId)}`;
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const tabs: CategoryTab[] = ['All', 'Engineering & CS', 'Medical', 'Business'];

  return (
    <div className="w-full">
      <SeoHead pathname="/universities" />

      {/* 1. Hero */}
      <Hero
        eyebrow="PAKISTAN UNIVERSITY DIRECTORY 2026"
        staticHeadingPrefix="Calculate Your"
        typewriterPhrases={EXPLORER_TYPEWRITER}
        staticHeadingSuffix="Accurately"
        description={`Explore ${universityCount} leading Pakistani universities, compare entry test weightage models, and calculate your exact admission chances.`}
        primaryCtaText="Browse Directory"
        secondaryCtaText="Try Merit Predictor"
        onPrimaryCta={() => {
          const el = document.getElementById('university-list');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSecondaryCta={() => {
          if (onNavigatePredictor) onNavigatePredictor();
          else if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/merit-meter');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
      />

      {/* 2. Directory Section (Light) */}
      <Section variant="light" id="university-list">
        <SectionHeader
          eyebrow="ADMISSIONS DIRECTORY"
          title="Verified University Formulas &"
          highlight="Weightage Ratios"
          description="Click Calculate Aggregate on any institution to test your marks against official formulas."
        />

        {/* Filter tabs */}
        <div className="mb-8 border-b border-slate-200/80 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar pb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {filteredUnis.map((uni, idx) => (
            <ScrollReveal key={uni.id} delayMs={idx * 30}>
              <div className="group relative bg-white/90 backdrop-blur-md rounded-[24px] p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 text-left h-full">
                <div className="space-y-4">
                  {/* Header: Logo + Names */}
                  <div className="flex items-start gap-3.5">
                    <UniversityLogo
                      key={uni.id}
                      src={uni.logo}
                      alt={`${uni.shortName} logo`}
                      className="w-12 h-12 rounded-2xl shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-black text-lg text-slate-900 truncate font-display">
                          {uni.shortName}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {uni.entryTestName.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {uni.fullName}
                      </p>
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{uni.city}</span>
                  </div>

                  {/* Program Tag Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {uni.programs.slice(0, 3).map((prog) => (
                      <span
                        key={prog}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100/90 text-slate-700"
                      >
                        {prog}
                      </span>
                    ))}
                    {uni.programs.length > 3 && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-indigo-50 text-indigo-700">
                        +{uni.programs.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Weightage pill */}
                  <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex justify-between items-center font-mono">
                    <span>Model:</span>
                    <span className="text-slate-900 font-bold">
                      {uni.weights.matric}% M · {uni.weights.fsc}% FSc · {uni.weights.test}% Test
                    </span>
                  </div>
                </div>

                {/* Calculate Aggregate Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={uni.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Prospectus
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCalculateClick(uni.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculate Aggregate</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 3. Word Reveal & Interactive Simulator ScreenCard (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Understanding your university's exact weightage formula tells you where every single entrance test mark counts." />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            eyebrow="ADMISSIONS SIMULATOR"
            title="Interactive Aggregate"
            highlight="Calculation Model"
            description="Preview how matric, intermediate, and entrance test weightages synthesize into your final merit index."
          />

          <ScreenCard
            mode="dashboard"
            title="Admissions Aggregate Model (Sample)"
            subtitle="Diagnostic Weightage Breakdown · Student A."
            chips={[
              {
                label: 'Projected Aggregate (Sample)',
                value: '84.6% Merit Index',
                position: 'top-right',
              },
              {
                label: 'Target Margin (Sample)',
                value: '+4.2% Safe Zone',
                position: 'bottom-left',
              },
            ]}
          />
        </div>
      </Section>

      {/* 4. Calculation Process Steps (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="CALCULATION WORKFLOW"
          title="Three Steps to Compute Your"
          highlight="Admission Aggregate"
          description="A quick, transparent method to test your standing across Pakistan’s top institutions."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Select Target University & Faculty',
              description:
                'Choose from engineering, computing, medical, or business tracks to load the exact verified formula.',
              checklist: ['Official University Weightages', 'Instant Formula Mapping'],
              linkText: 'Browse Directory Above ↑',
              onLinkClick: () => {
                const el = document.getElementById('university-list');
                el?.scrollIntoView({ behavior: 'smooth' });
              },
            },
            {
              number: '2',
              title: 'Enter Academic & Test Scores',
              description:
                'Provide your SSC Matric marks, HSSC Intermediate results, and entry test performance.',
              checklist: ['Automatic Percentage Conversion', 'Target Score Simulation'],
            },
            {
              number: '3',
              title: 'Analyze Historical Merit Thresholds',
              description:
                'Compare your projected score against previous year closing cutoffs to gauge admission probability.',
              checklist: ['Closing Merit Comparison', 'Target Test Score Requirement'],
              linkText: 'Open Merit Meter →',
              onLinkClick: () => {
                if (onNavigatePredictor) onNavigatePredictor();
                else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/merit-meter');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              },
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ADMISSIONS FAQS"
          title="University Entry & Merit"
          highlight="Questions Answered"
        />
        <FaqAccordion items={EXPLORER_FAQS} />
      </Section>

      {/* 6. CTA Section (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="MERIT"
          eyebrow="ADMISSIONS PREDICTOR"
          title="Know Your Chances Before"
          highlight="Submitting Applications"
          description="Use Boardly's interactive aggregate calculators to test your matric, FSC, and test marks."
          primaryButtonText="Start Free MCQ Practice"
          secondaryButtonText="Explore Features"
          onPrimaryClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/app');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          onSecondaryClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/features');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
        />
      </Section>
    </div>
  );
};
