import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../common/SeoHead';
import { Navbar } from '../marketing/Navbar';
import { Footer } from '../marketing/Footer';
import { ScrollProgress } from '../marketing/design-system/ScrollProgress';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { FaqAccordion, FaqItem } from '../marketing/design-system/FaqAccordion';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';
import { FinalCTA } from '../marketing/FinalCTA';
import { Award, Briefcase, ShieldCheck, ArrowLeft, Users, TrendingUp, CheckCircle2, MessageSquare } from 'lucide-react';

interface CaptainLandingPageProps {
  currentPath?: string;
  onNavigate: (route: string) => void;
}

const CAPTAIN_TYPEWRITER = [
  'Campus Leadership',
  'Batch Ambassador',
  'Career CV Credentials',
  'Verifiable Impact',
];

const CAPTAIN_FAQS: FaqItem[] = [
  {
    question: 'How do referral links and coupon codes work?',
    answer:
      'Every verified Campus Captain receives a unique referral code and tracking link. When classmates register through your link, your portal automatically credits active referrals and updates your tier progress in real time.',
  },
  {
    question: 'Can I apply as a guest if I do not have a Boardly account yet?',
    answer:
      'Yes! You can complete the Campus Captain application immediately as a guest. Once your application is reviewed and approved, our student relations team will send you credentials to claim your dashboard.',
  },
  {
    question: 'What rewards and credentials do Campus Captains unlock?',
    answer:
      'Approved Captains unlock 30 days of free Pro testing, private referral analytics, signed official Letters of Recommendation from SHS Virtual Academy for CVs/LinkedIn, and priority consideration for paid marketing internships.',
  },
  {
    question: 'How many students do I need to recruit to remain active?',
    answer:
      'There are zero strict quotas or penalties. However, active Captains who onboard 10+ batchmates qualify for tiered certificate badges and sponsored community study sessions.',
  },
];

export const CaptainLandingPage: React.FC<CaptainLandingPageProps> = ({
  onNavigate,
}) => {
  const { profile, isAdmin } = useAuth();

  const isCaptainApproved =
    isAdmin ||
    profile?.role === 'captain' ||
    profile?.roles?.includes('captain') ||
    profile?.isCrewMember;

  const applyHref = isCaptainApproved ? '/captain/dashboard' : '/captain/apply';
  const applyText = isCaptainApproved ? 'Open Captain Dashboard' : 'Apply as Captain';

  return (
    <div className="w-full">
      <SeoHead
        pathname="/captain"
        override={{
          title: 'Boardly Captain | Campus Ambassador Program',
          description:
            'Represent Boardly at your college or campus. Empower batchmates with test prep, build verifiable leadership experience, and unlock exclusive rewards.',
        }}
      />

      {/* 1. Shared Left Scroll Progress Line */}
      <ScrollProgress accent="captain" />

      {/* 2. Shared Expanding Navbar */}
      <Navbar
        currentPage="captain"
        accent="captain"
        programTag="Captain"
        onNavigate={(p) => onNavigate(`/${p}`)}
        onGetStarted={() => onNavigate(applyHref)}
        getStartedText={applyText}
        getStartedHref={applyHref}
      />

      {/* Top Back to Home row under navbar */}
      <div className="pt-24 pb-2 px-4 max-w-6xl mx-auto flex items-center justify-between gap-3 text-[13px] font-semibold">
        <a
          href="/"
          onClick={(e) => {
            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            onNavigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white px-3.5 py-1.5 rounded-full border border-amber-200 dark:border-white/15 bg-amber-50/70 dark:bg-white/5 transition-colors cursor-pointer truncate"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home</span>
        </a>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full border shrink-0 whitespace-nowrap bg-amber-50 text-amber-800 border-amber-200 dark:bg-white/10 dark:text-amber-300 dark:border-white/20"
        >
          Captain program
        </span>
      </div>

      {/* Hero Header */}
      <Hero
        eyebrow="Campus ambassador program"
        staticHeadingPrefix="Step Up as a"
        typewriterPhrases={CAPTAIN_TYPEWRITER}
        staticHeadingSuffix="at Your College"
        description="Represent Boardly at your institution. Empower your classmates with national-standard test prep, build verified leadership credentials, and unlock career perks."
        primaryCtaText={applyText}
        secondaryCtaText="See Perks"
        primaryHref={applyHref}
        secondaryHref="#captain-perks"
        onPrimaryCta={() => onNavigate(applyHref)}
        onSecondaryCta={() => {
          const el = document.getElementById('captain-perks');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        accent="captain"
        compactTop={true}
      />

      {/* SECTION 1: Hook - The benefits (3-4 short points) */}
      <Section variant="light" id="captain-perks" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Leadership perks"
          title="Career Value That Builds Your"
          highlight="Professional Future"
          description="Tangible rewards and verified leadership accolades that differentiate your university and career applications."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Signed Recommendation Letter',
              desc: 'Official verification letter signed by SHS Virtual Academy leadership detailing your initiative, outreach impact, and batch size.',
              icon: <Award className="w-5 h-5 text-amber-600" />,
            },
            {
              title: '30 Days Free Pro Access',
              desc: 'Instant full access to all 17,000+ MCQs, past papers, formula vaults, and timed mocks for your own personal exam revision.',
              icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
            },
            {
              title: 'Paid Internship Track',
              desc: 'Top-performing Campus Captains receive direct fast-track interviews for paid summer internships in student operations and community management.',
              icon: <Briefcase className="w-5 h-5 text-amber-600" />,
            },
          ].map((perk, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-amber-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit mb-3">
                    {perk.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{perk.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-sans">
                    {perk.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* SECTION 2: Responsibilities - What they have to do */}
      <Section variant="light" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Ambassador responsibilities"
          title="What You Do as an"
          highlight="Official Campus Captain"
          description="Represent Boardly with pride and support your batchmates in achieving exam excellence."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              number: '01',
              title: 'Represent Boardly on Campus',
              desc: 'Serve as the trusted campus advocate for modern test prep, helping classmates find study resources and diagnostic drills.',
              icon: <Users className="w-5 h-5 text-amber-600" />,
            },
            {
              number: '02',
              title: 'Share Tracking Links & Codes',
              desc: 'Distribute your personal referral link in study groups, academy circles, and campus WhatsApp chats.',
              icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
            },
            {
              number: '03',
              title: 'Voice Student Feedback',
              desc: 'Share insights with our academic team on what your batch needs most to help shape future test bank updates.',
              icon: <MessageSquare className="w-5 h-5 text-teal-600" />,
            },
          ].map((resp, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-amber-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit">
                      {resp.icon}
                    </div>
                    <span className="text-xs font-bold text-amber-600 font-mono">ROLE {resp.number}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{resp.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-sans">
                    {resp.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* SECTION 3: How it will be recorded and evaluated */}
      <Section variant="light" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Evaluation & tracking"
          title="How Your Ambassadorship is"
          highlight="Recorded & Evaluated"
          description="Transparent analytics measure your community impact in real time."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Real-Time Referral Analytics',
              desc: 'Every classmate registration through your referral link is attributed automatically to your dashboard.',
              icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
            },
            {
              title: 'Tiered Milestone Progress',
              desc: 'Watch your progress bar advance as peers complete diagnostic tests and unlock higher recognition tiers.',
              icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
            },
            {
              title: 'Direct Letter Endorsements',
              desc: 'Official letters of recommendation and verified LinkedIn credentials are generated upon reaching milestones.',
              icon: <Award className="w-5 h-5 text-amber-600" />,
            },
          ].map((item, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-amber-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit mb-3">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* SECTION 4: Questions (FAQ) */}
      <Section variant="light" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Ambassador FAQs"
          title="Boardly Captain"
          highlight="Questions Answered"
        />
        <FaqAccordion items={CAPTAIN_FAQS} accent="captain" />
      </Section>

      {/* Final CTA Section: Links directly to /captain/apply */}
      <FinalCTA
        accent="captain"
        primaryButtonText={applyText}
        secondaryButtonText="Explore Curriculum"
        primaryHref={applyHref}
        secondaryHref="/features"
        onPrimaryClick={() => onNavigate(applyHref)}
        onSecondaryClick={() => onNavigate('/features')}
      />

      {/* Shared Footer */}
      <Footer
        accent="captain"
        programName="Captain"
        onNavigate={(p) => onNavigate(`/${p}`)}
      />
    </div>
  );
};
export default CaptainLandingPage;
