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
import { IPhoneAppPreview } from './IPhoneAppPreview';

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

      {/* 1.5 REAL APP PREVIEW (Pure CSS/SVG iPhone 16 Pro Frame) */}
      <section className="relative w-full py-12 sm:py-16 px-4 overflow-hidden border-y border-slate-200/60 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40">
        <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-8">
          <div className="inline-block bg-white border border-[#dbe3f5] text-[#1a6dff] rounded-full text-[12px] font-semibold px-3 py-1 shadow-xs mb-3">
            Real app experience
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight font-display">
            Built for Real Exam Readiness
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Practice board-aligned MCQs, review step derivations, compete in circle leaderboards, and coordinate college mockathons.
          </p>
        </div>

        <IPhoneAppPreview initialTab="student" />
      </section>

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

      {/* 3. HOW IT WORKS & THREE STEP FLOW */}
      <section
        className="relative w-full overflow-hidden [overflow-x:clip] text-[#0f172a]"
        style={{
          background: 'linear-gradient(180deg, #f5f7ff 0%, #ffffff 100%)',
          padding: '64px 20px',
        }}
      >
        {/* Smooth fade into sections above and below */}
        <div
          className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#f0f6ff]/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f6f5ff]/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Quote Banner */}
          <div className="py-4 px-4 mb-12 text-center">
            <p className="text-[24px] font-bold text-[#0f172a] leading-[1.4] max-w-[340px] sm:max-w-2xl mx-auto text-center">
              Active question practice builds deeper retention and real exam timing than passive lectures ever could.
            </p>
          </div>

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            {/* Pill above heading */}
            <div className="mb-3">
              <span className="inline-block bg-white border border-[#dbe3f5] text-[#1a6dff] rounded-full text-[13px] font-semibold px-3.5 py-1 shadow-xs">
                Three step flow
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-[28px] font-extrabold text-[#0f172a] leading-[1.2] font-display">
              How Boardly <span style={{ color: '#1a6dff' }}>Powers Your Revision</span>
            </h2>

            {/* Subtext */}
            <p className="mt-3 text-[16px] text-[#475569] leading-[1.6]">
              From track selection to diagnostic mastery in three focused steps.
            </p>
          </div>

          {/* Three step flow cards */}
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                number: 1,
                title: 'Select Your Academic Track',
                description:
                  'Choose between MDCAT Medical, FSC Pre-Engineering, ICS, FAST-NU, or Matric boards. Your question feeds immediately calibrate to your syllabus.',
                checklist: ['PMDC & FBISE Aligned', 'Automated Syllabus Calibration'],
                linkText: 'Explore Tracks',
                onLinkClick: () => onNavigate('features'),
                linkHref: '/features',
              },
              {
                number: 2,
                title: 'Attempt Timed Diagnostic Drills',
                description:
                  'Solve bite-sized 15-minute drills or complete full-length mock exams with real countdown timers and negative marking penalties.',
                checklist: ['Single Question Mode', 'Realistic Exam Pressure'],
                linkText: 'Try Free Drill',
                onLinkClick: onGetStarted,
                linkHref: '/app',
              },
              {
                number: 3,
                title: 'Review Derivations & Eliminate Weaknesses',
                description:
                  'Never guess why an option was right. Inspect complete mathematical steps, textbook citations, and diagnostic score trends.',
                checklist: ['Step-by-step Explanations', 'Diagnostic Score History'],
                linkText: 'Start Practicing',
                onLinkClick: onGetStarted,
                linkHref: '/app',
              },
            ].map((step, idx, arr) => (
              <div key={step.number} className="relative flex items-start gap-4 sm:gap-6">
                {/* Number circle column */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#1a6dff] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm z-10">
                    {step.number}
                  </div>
                  {/* Vertical line connecting the circles: 2px #c7d2fe, ending at the last circle */}
                  {idx < arr.length - 1 && (
                    <div
                      className="w-[2px] bg-[#c7d2fe] absolute top-10 bottom-[-24px] left-1/2 -translate-x-1/2"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Card on the right */}
                <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] text-left">
                  <h3 className="text-[18px] font-bold text-[#0f172a]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-[#475569] leading-[1.6]">
                    {step.description}
                  </p>

                  {/* Checklist items */}
                  {step.checklist && step.checklist.length > 0 && (
                    <ul className="mt-4 pt-4 border-t border-[#e2e8f0] space-y-2">
                      {step.checklist.map((item, cIdx) => (
                        <li key={cIdx} className="flex items-center gap-2 text-[14px] text-[#334155]">
                          <span className="p-0.5 rounded-full bg-blue-50 text-[#1a6dff] shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Text link */}
                  {step.linkText && (
                    <div className="mt-4 pt-2">
                      <a
                        href={step.linkHref || '#'}
                        onClick={(e) => {
                          e.preventDefault();
                          step.onLinkClick();
                        }}
                        className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#1a6dff] hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span>{step.linkText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* 5. REVIEWS WALL / TESTIMONIALS */}
      <section
        className="relative w-full overflow-hidden [overflow-x:clip] text-[#0f172a]"
        style={{
          background: 'linear-gradient(180deg, #f5f7ff 0%, #ffffff 100%)',
          padding: '64px 20px',
        }}
      >
        {/* Smooth fade into sections above and below */}
        <div
          className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#f0f6ff]/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f6f5ff]/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            {/* Pill above heading */}
            <div className="mb-3">
              <span className="inline-block bg-white border border-[#dbe3f5] text-[#1a6dff] rounded-full text-[13px] font-semibold px-3.5 py-1 shadow-xs">
                Student testimonials
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-[28px] font-extrabold text-[#0f172a] leading-[1.2] font-display">
              Practicing With Real <span style={{ color: '#1a6dff' }}>Confidence</span>
            </h2>

            {/* Subtext */}
            <p className="mt-3 text-[16px] text-[#475569] leading-[1.6]">
              Read experiences from students using Boardly for their exam revision across Pakistan.
            </p>
          </div>

          <div className="w-full">
            <ReviewsWall hideHeader={true} />
          </div>
        </div>
      </section>

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
