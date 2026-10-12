import React from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Brain,
  Timer,
  BarChart3,
  FileDown,
  Trophy,
  Users,
  Star,
  Check,
  X,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MarketingPage } from './Navbar';
import { Hero } from './design-system/Hero';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { Button } from './design-system/Button';
import { ScreenCard } from './ScreenCard';
import { WordReveal } from './design-system/WordReveal';
import { StepsList } from './design-system/StepsList';
import { FaqAccordion, FaqItem } from './design-system/FaqAccordion';
import { CtaSection } from './design-system/CtaSection';
import { ScrollReveal } from './design-system/useScrollReveal';
import { ReviewsWall } from './ReviewsWall';

interface HomePageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
}

const HOME_TYPEWRITER_PHRASES = [
  'Matric Success',
  'FSc Confidence',
  'Entry Test Wins',
  'Academic Excellence',
];

const COMPARISON_ROWS = [
  {
    title: 'Full Prep Season Cost',
    boardly: 'PKR 0 – 1,999 / yr',
    coaching: 'PKR 45,000 – 85,000+',
    freeLinks: 'Free (fragmented)',
  },
  {
    title: 'Study 24/7 on Your Schedule',
    boardly: true,
    coaching: false,
    freeLinks: true,
  },
  {
    title: '17k+ Verified Questions in One Place',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Timed Mocks & Negative Marking',
    boardly: true,
    coaching: true,
    freeLinks: false,
  },
  {
    title: 'Instant Formula & Step Derivations',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Diagnostic Weakness Detection',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
];

const HOME_FAQS: FaqItem[] = [
  {
    question: 'Is Boardly free to use?',
    answer:
      'Yes! Students can practice core chapter question banks, attempt diagnostic drills, and inspect step-by-step derivations completely free. Optional Pro upgrades unlock unlimited mocks and advanced diagnostic analytics.',
  },
  {
    question: 'Which exams and boards are supported?',
    answer:
      'Boardly covers FBISE and provincial boards for SSC (Classes 9 & 10) and HSSC (Classes 11 & 12), as well as dedicated entry test modules for PMDC MDCAT, FAST-NU, and UET/ECAT.',
  },
  {
    question: 'Can I practice on my smartphone?',
    answer:
      'Yes, Boardly is 100% mobile-first and works smoothly in any mobile browser without requiring large downloads. Your practice history synchronizes instantly across devices.',
  },
  {
    question: 'How does negative marking work in mock exams?',
    answer:
      'In university entrance tests like FAST-NU or MDCAT, incorrect answers deduct fractional marks. Boardly applies authentic weighting formulas so your aggregate score reflects real test conditions.',
  },
  {
    question: 'What is the strict no-refund policy?',
    answer:
      'Pro plan upgrades grant immediate access to digital testing archives and servers. Therefore, all digital Pro purchases are final and non-refundable.',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onGetStarted,
}) => {
  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <Hero
        eyebrow="SELF-PACED DIAGNOSTIC PRACTICE"
        staticHeadingPrefix="The Smarter Path to"
        typewriterPhrases={HOME_TYPEWRITER_PHRASES}
        staticHeadingSuffix="Across Pakistan"
        description="Master 17,000+ board-aligned questions, test yourself under authentic timing and negative marking, and get instant step-by-step derivations."
        primaryCtaText="Start Free Practice"
        secondaryCtaText="Explore Features"
        onPrimaryCta={onGetStarted}
        onSecondaryCta={() => onNavigate('features')}
      />

      {/* 2. CORE CAPABILITIES (Light Section) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="ENGINEERED FOR RETENTION"
          title="Active Drills Instead of"
          highlight="Passive Cramming"
          description="Most students read lecture notes without verifying whether they can solve tricky questions under time pressure. Boardly turns revision into an active diagnostic game."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            {[
              {
                icon: <Brain className="w-5 h-5 text-indigo-600" />,
                title: 'Chapter-Wise Diagnostic Drills',
                desc: 'Target specific subjects and subtopics with curated SLO-based questions.',
              },
              {
                icon: <Timer className="w-5 h-5 text-teal-600" />,
                title: 'Authentic Timed Mocks',
                desc: 'Experience real exam pacing, countdown timers, and negative marking penalty formulas.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-violet-600" />,
                title: 'Instant Weakness Analytics',
                desc: 'Pinpoint exactly which formulas and chapters trigger score deductions.',
              },
            ].map((pillar, i) => (
              <ScrollReveal key={i} delayMs={i * 60}>
                <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                    {pillar.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="lg:col-span-6">
            <ScrollReveal delayMs={120}>
              <ScreenCard
                mode="practice"
                title="Boardly Diagnostic Test"
                subtitle="Physics · Electrostatics & Field Theory"
              />
            </ScrollReveal>
          </div>
        </div>
      </Section>

      {/* 3. HOW IT WORKS & WORD REVEAL (Dark Section) */}
      <Section variant="dark">
        <WordReveal statement="Active question practice builds deeper retention and real exam timing than passive lectures ever could." />

        <div className="mt-12">
          <SectionHeader
            dark
            eyebrow="THREE STEP FLOW"
            title="How Boardly"
            highlight="Powers Your Revision"
            description="From track selection to diagnostic mastery in three focused steps."
          />

          <StepsList
            steps={[
              {
                number: '1',
                title: 'Select Your Academic Track',
                description:
                  'Choose between MDCAT Medical, FSC Pre-Engineering, ICS, FAST-NU, or Matric boards. Your question feeds immediately calibrate to your syllabus.',
                checklist: ['PMDC & FBISE Aligned', 'Automated Syllabus Calibration'],
                linkText: 'Explore Tracks →',
                onLinkClick: () => onNavigate('features'),
              },
              {
                number: '2',
                title: 'Attempt Timed Diagnostic Drills',
                description:
                  'Solve bite-sized 15-minute drills or complete full-length mock exams with real countdown timers and negative marking penalties.',
                checklist: ['Single Question Mode', 'Realistic Exam Pressure'],
                linkText: 'Try Free Drill →',
                onLinkClick: onGetStarted,
              },
              {
                number: '3',
                title: 'Review Derivations & Eliminate Weaknesses',
                description:
                  'Never guess why an option was right. Inspect complete mathematical steps, textbook citations, and diagnostic score trends.',
                checklist: ['Step-by-step Explanations', 'Diagnostic Score History'],
                linkText: 'Start Practicing →',
                onLinkClick: onGetStarted,
              },
            ]}
          />
        </div>
      </Section>

      {/* 4. COMPARISON MATRIX (Light Section) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="WHY STUDENTS SWITCH"
          title="Where Boardly Stands Against"
          highlight="Traditional Coaching"
          description="Comparing traditional coaching academies, scattered online links, and Boardly’s all-in-one testing portal."
        />

        <div className="max-w-4xl mx-auto overflow-hidden rounded-[24px] bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-700">
                <tr>
                  <th className="py-4 px-4 sm:px-6 font-bold">Feature</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-indigo-600 bg-indigo-50/50">Boardly</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-500">Coaching Centers</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-500">Scattered PDF Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-sans">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {row.title}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-indigo-700 bg-indigo-50/30">
                      {typeof row.boardly === 'boolean' ? (
                        row.boardly ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />
                      ) : (
                        row.boardly
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                      {typeof row.coaching === 'boolean' ? (
                        row.coaching ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />
                      ) : (
                        row.coaching
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                      {typeof row.freeLinks === 'boolean' ? (
                        row.freeLinks ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />
                      ) : (
                        row.freeLinks
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 5. REVIEWS WALL (Dark Section) */}
      <Section variant="dark">
        <SectionHeader
          dark
          eyebrow="STUDENT TESTIMONIALS"
          title="Practicing With Real"
          highlight="Confidence"
          description="Read experiences from students using Boardly for their exam revision across Pakistan."
        />

        <div className="max-w-4xl mx-auto">
          <ReviewsWall />
        </div>
      </Section>

      {/* 6. FAQ (Light Section) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="FREQUENTLY ASKED QUESTIONS"
          title="Got Questions?"
          highlight="We Have Answers"
          description="Everything you need to know about Boardly test preparation and access."
        />

        <FaqAccordion items={HOME_FAQS} />
      </Section>

      {/* 7. CTA (Dark Section) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="BOARDLY"
          eyebrow="GET EXAM READY"
          title="Transform Your Prep in"
          highlight="Under 2 Minutes"
          description="Start practicing chapter MCQs right away. No payment required to begin."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="View Pricing"
          onPrimaryClick={onGetStarted}
          onSecondaryClick={() => onNavigate('pricing')}
        />
      </Section>
    </div>
  );
};
