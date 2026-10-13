import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../common/SeoHead';
import { UnifiedProgramApplicationModal } from '../common/UnifiedProgramApplicationModal';
import { Navbar } from '../marketing/Navbar';
import { Footer } from '../marketing/Footer';
import { ScrollProgress } from '../marketing/design-system/ScrollProgress';
import { Hero } from '../marketing/design-system/Hero';
import { Section } from '../marketing/design-system/Section';
import { SectionHeader } from '../marketing/design-system/SectionHeader';
import { ScreenCard } from '../marketing/ScreenCard';
import { WordReveal } from '../marketing/design-system/WordReveal';
import { StepsList } from '../marketing/design-system/StepsList';
import { FaqAccordion, FaqItem } from '../marketing/design-system/FaqAccordion';
import { ScrollReveal } from '../marketing/design-system/useScrollReveal';
import { FinalCTA } from '../marketing/FinalCTA';
import { Award, Briefcase, TrendingUp, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

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
  const { user, profile, isAdmin } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const isCaptainApproved =
    isAdmin ||
    profile?.role === 'captain' ||
    profile?.roles?.includes('captain') ||
    profile?.isCrewMember;

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
        onGetStarted={() => {
          if (isCaptainApproved) onNavigate('/captain/dashboard');
          else setIsApplyModalOpen(true);
        }}
      />

      {/* Top Back to Home row under navbar */}
      <div className="pt-20 sm:pt-24 pb-2 px-4 max-w-6xl mx-auto flex items-center justify-between gap-3 text-[13px] font-semibold">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer truncate"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home</span>
        </a>
        <span
          className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#fcd34d',
          }}
        >
          Captain program
        </span>
      </div>

      {/* 3. Hero */}
      <Hero
        eyebrow="Boardly Captain program"
        staticHeadingPrefix="Step Up as a"
        typewriterPhrases={CAPTAIN_TYPEWRITER}
        staticHeadingSuffix="at Your College"
        description="Represent Boardly at your institution. Empower your classmates with national-standard test prep, build verified leadership credentials, and unlock career perks."
        primaryCtaText={isCaptainApproved ? 'Open Captain Dashboard' : 'Apply as Captain'}
        secondaryCtaText="See Ambassador Perks"
        onPrimaryCta={() => {
          if (isCaptainApproved) onNavigate('/captain/dashboard');
          else setIsApplyModalOpen(true);
        }}
        onSecondaryCta={() => {
          const el = document.getElementById('captain-perks');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        accent="captain"
        compactTop={true}
      />

      {/* 4. Ambassador Perks (Light) */}
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
              icon: <Award className="w-5 h-5 text-amber-500" />,
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
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-amber-500/20 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 w-fit mb-3">
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

      {/* 5. Word Reveal & Interactive ScreenCard (Dark) */}
      <Section variant="dark" accent="captain">
        <WordReveal
          accent="captain"
          statement="Real student leadership means empowering your batchmates with national-standard prep tools."
        />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            accent="captain"
            eyebrow="Ambassador tracking"
            title="Your Dedicated Captain"
            highlight="Tracking Portal"
            description="Inspect referral statistics, track peer registrations, and claim milestone rewards."
          />

          <ScreenCard
            mode="captain"
            accent="captain"
            title="Captain Ambassador Portal"
            subtitle="Campus Batch Leader · Student A."
          />
        </div>
      </Section>

      {/* 6. How To Become A Captain (Light) */}
      <Section variant="light" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Onboarding timeline"
          title="From Simple Application to"
          highlight="Verified Campus Leader"
          description="A quick four-step process designed to get you set up in under 48 hours."
        />

        <StepsList
          accent="captain"
          steps={[
            {
              number: '1',
              title: 'Submit 2-Minute Application',
              description: 'Provide your institution name, academic stream, and student leadership background.',
              checklist: ['No Prior Experience Required', 'Instant Confirmation'],
              linkText: 'Apply Now →',
              onLinkClick: () => setIsApplyModalOpen(true),
            },
            {
              number: '2',
              title: 'Verification & Onboarding',
              description: 'Our community relations team reviews your details within 24–48 hours and confirms your admission.',
              checklist: ['Fast 24-48 Hour Review', 'Community Welcome Call'],
            },
            {
              number: '3',
              title: 'Unlock Dashboard & Pro Access',
              description: 'Receive your custom referral code and access your private analytics command center.',
              checklist: ['Free Pro Account Upgrade', 'Unique Referral Tracking Link'],
            },
            {
              number: '4',
              title: 'Lead & Unlock Career Rewards',
              description: 'Share prep resources with classmates and qualify for signed letters of recommendation.',
              checklist: ['Verifiable CV Credentials', 'Paid Internship Eligibility'],
            },
          ]}
        />
      </Section>

      {/* 7. FAQs (Light) */}
      <Section variant="light" accent="captain">
        <SectionHeader
          accent="captain"
          eyebrow="Ambassador FAQs"
          title="Boardly Captain"
          highlight="Questions Answered"
        />
        <FaqAccordion items={CAPTAIN_FAQS} accent="captain" />
      </Section>

      {/* 8. Final CTA Section */}
      <FinalCTA
        accent="captain"
        primaryButtonText={isCaptainApproved ? 'Open Captain Dashboard' : 'Apply as Captain'}
        secondaryButtonText="Explore Curriculum"
        onPrimaryClick={() => {
          if (isCaptainApproved) onNavigate('/captain/dashboard');
          else setIsApplyModalOpen(true);
        }}
        onSecondaryClick={() => onNavigate('/features')}
      />

      {/* 9. Shared Footer */}
      <Footer
        accent="captain"
        programName="Captain"
        onNavigate={(p) => onNavigate(`/${p}`)}
      />

      {/* 10. Application Modal */}
      {isApplyModalOpen && (
        <UnifiedProgramApplicationModal
          defaultProgram="captain"
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            if (user) onNavigate('/captain/dashboard');
          }}
        />
      )}
    </div>
  );
};
