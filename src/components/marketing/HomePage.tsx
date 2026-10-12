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
import { ScrollReveal } from './design-system/useScrollReveal';
import { ReviewsWall } from './ReviewsWall';
import { FinalCTA } from './FinalCTA';

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
    isPrice: true,
  },
  {
    title: 'Study 24/7 on Your Schedule',
    boardly: true,
    coaching: false,
    freeLinks: true,
  },
  {
    title: '17k+ Verified Questions',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Timed Mocks & Penalties',
    boardly: true,
    coaching: true,
    freeLinks: false,
  },
  {
    title: 'Instant Step Derivations',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Weakness Detection',
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
        eyebrow="Self-paced diagnostic practice"
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
          eyebrow="Engineered for retention"
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
            eyebrow="Three step flow"
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
          eyebrow="Why students switch"
          title="Where Boardly Stands Against"
          highlight="Traditional Coaching"
          description="Comparing traditional coaching academies, scattered online links, and Boardly’s all-in-one testing portal."
        />

        <div className="max-w-4xl mx-auto rounded-[24px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left text-[14px] min-w-[560px] border-collapse">
              <colgroup>
                <col className="w-[150px] min-w-[150px]" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
                <col className="w-[110px] min-w-[110px] sm:w-auto" />
              </colgroup>
              <thead className="bg-slate-50/95 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-[14px] font-bold sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs shadow-[2px_0_6px_rgba(0,0,0,0.04)]">
                    Feature
                  </th>
                  <th className="p-[14px] font-bold text-[#1a6dff] bg-blue-500/10 border-x border-blue-500/20">
                    Boardly
                  </th>
                  <th className="p-[14px] font-bold text-slate-600">
                    Coaching
                  </th>
                  <th className="p-[14px] font-bold text-slate-500">
                    PDF Links
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-sans">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    {/* Sticky first column on mobile: 150px wide */}
                    <td className="p-[14px] font-semibold text-slate-900 sticky left-0 z-10 bg-white/95 backdrop-blur-xs shadow-[2px_0_6px_rgba(0,0,0,0.04)] leading-snug">
                      {row.title}
                    </td>

                    {/* Boardly highlighted column: soft blue tint and border */}
                    <td className="p-[14px] font-bold bg-blue-500/10 border-x border-blue-500/20 text-[#1a6dff]">
                      {row.isPrice ? (
                        <div>
                          <div className="font-bold text-[#1a6dff] leading-tight">PKR 0-1,999</div>
                          <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">per year</div>
                        </div>
                      ) : row.boardly ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-400">
                          <X className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                    </td>

                    {/* Coaching centers */}
                    <td className="p-[14px] text-slate-700">
                      {row.isPrice ? (
                        <div>
                          <div className="font-semibold text-slate-800 leading-tight">PKR 45k-85k+</div>
                          <div className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">per year</div>
                        </div>
                      ) : row.coaching ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                          <X className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                    </td>

                    {/* Scattered PDF links */}
                    <td className="p-[14px] text-slate-600">
                      {row.isPrice ? (
                        <div>
                          <div className="font-semibold text-slate-600 leading-tight">Free</div>
                          <div className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">fragmented</div>
                        </div>
                      ) : row.freeLinks ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                          <X className="w-4 h-4 stroke-[2.2]" />
                        </div>
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
          eyebrow="Student testimonials"
          title="Practicing With Real"
          highlight="Confidence"
          description="Read experiences from students using Boardly for their exam revision across Pakistan."
        />

        <div className="max-w-4xl mx-auto">
          <ReviewsWall hideHeader={true} />
        </div>
      </Section>

      {/* 6. FAQ (Light Section) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="Frequently asked questions"
          title="Got Questions?"
          highlight="We Have Answers"
          description="Everything you need to know about Boardly test preparation and access."
        />

        <FaqAccordion items={HOME_FAQS} />
      </Section>

      {/* 7. Final CTA Section */}
      <FinalCTA
        accent="home"
        onPrimaryClick={onGetStarted}
        onSecondaryClick={() => onNavigate('pricing')}
      />
    </div>
  );
};
