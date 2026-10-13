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
import { Users, Award, ShieldCheck, Zap, Briefcase, ArrowLeft } from 'lucide-react';

interface CrewLandingPageProps {
  currentPath?: string;
  onNavigate: (route: string) => void;
}

const CREW_TYPEWRITER = [
  'Campus Event Host',
  'Study Circle Leader',
  'Timed Drill Organizer',
  'Community Builder',
];

const CREW_FAQS: FaqItem[] = [
  {
    question: 'Who can organize Boardly Crew study circles & events?',
    answer:
      'Any enrolled Matric, Intermediate (FSC/ICS), or university student in Pakistan can apply to become an official Boardly Crew Organizer and host campus study sessions.',
  },
  {
    question: 'Which test formats can Crew Organizers host?',
    answer:
      'Organizers can launch timed 15-minute Blitz quizzes, custom chapter drills, or full entrance test mock simulations across Physics, Chemistry, Biology, Mathematics, and Computer Science.',
  },
  {
    question: 'How does live participant scoring & rank calculation work?',
    answer:
      'When students submit their answers through your event link, Boardly automatically calculates their aggregate score, applies negative marking (if configured), and updates the event leaderboard live.',
  },
  {
    question: 'Are participant attempts free for all attendees?',
    answer:
      'Yes, 100% free! Every student attending a Crew-organized session can solve the complete question set with zero fees or subscription requirements.',
  },
];

export const CrewLandingPage: React.FC<CrewLandingPageProps> = ({
  onNavigate,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const isCrewApproved =
    isAdmin ||
    profile?.role === 'crew' ||
    profile?.roles?.includes('crew') ||
    profile?.role === 'organizer' ||
    profile?.roles?.includes('organizer');

  return (
    <div className="w-full">
      <SeoHead
        pathname="/crew"
        override={{
          title: 'Boardly Crew | Lead Campus Study Circles & Events',
          description:
            'Host competitive test prep events, lead your college batch, and unlock 30 days of free Pro access as a verified Boardly Crew organizer.',
        }}
      />

      {/* 1. Shared Left Scroll Progress Line */}
      <ScrollProgress accent="crew" />

      {/* 2. Shared Expanding Navbar */}
      <Navbar
        currentPage="crew"
        accent="crew"
        programTag="Crew"
        onNavigate={(p) => onNavigate(`/${p}`)}
        onGetStarted={() => {
          if (isCrewApproved) onNavigate('/crew/dashboard');
          else setIsApplyModalOpen(true);
        }}
      />

      {/* Top Back to Home row under navbar */}
      <div className="pt-24 pb-2 px-4 max-w-6xl mx-auto flex items-center justify-between gap-3 text-[13px] font-semibold">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 transition-colors cursor-pointer truncate"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home</span>
        </a>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full border shrink-0 whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#c7d2fe',
          }}
        >
          Crew program
        </span>
      </div>

      {/* 3. Hero */}
      <Hero
        eyebrow="Boardly Crew program"
        staticHeadingPrefix="Host Live Study Circles as a"
        typewriterPhrases={CREW_TYPEWRITER}
        staticHeadingSuffix="Across Pakistan"
        description="Organize timed mock exams, lead study circles on your campus, and build verifiable community leadership credentials backed by Boardly."
        primaryCtaText={isCrewApproved ? 'Open Organizer Portal' : 'Apply to Join Crew'}
        secondaryCtaText="See Organizer Perks"
        onPrimaryCta={() => {
          if (isCrewApproved) onNavigate('/crew/dashboard');
          else setIsApplyModalOpen(true);
        }}
        onSecondaryCta={() => {
          const el = document.getElementById('crew-perks');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        accent="crew"
        compactTop={true}
      />

      {/* 4. Organizer Perks (Light) */}
      <Section variant="light" id="crew-perks" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="Organizer privileges"
          title="Empower Your Campus and"
          highlight="Unlock Career Accolades"
          description="Everything you need to run impactful academic tournaments for your batchmates."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Host Custom Live Events',
              desc: 'Select question counts, test durations, and target subjects to generate instant public event links and live leaderboards.',
              icon: <Zap className="w-5 h-5 text-violet-600" />,
            },
            {
              title: '30 Days Free Pro Access',
              desc: 'Every approved organizer receives full complimentary access to the entire Boardly testing vault for their personal exam preparation.',
              icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
            },
            {
              title: 'Signed Leadership Credentials',
              desc: 'Receive official certificates of recognition detailing tournament participant counts and campus engagement for resumes and LinkedIn.',
              icon: <Award className="w-5 h-5 text-violet-600" />,
            },
          ].map((perk, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-violet-500/20 shadow-xs text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 w-fit mb-3">
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
      <Section variant="dark" accent="crew">
        <WordReveal
          accent="crew"
          statement="Peer collaboration and timed practice competitions turn difficult revision into a shared victory."
        />

        <div className="mt-12 max-w-4xl mx-auto">
          <SectionHeader
            dark
            accent="crew"
            eyebrow="Event command center"
            title="Your Dedicated Event"
            highlight="Organizer Portal"
            description="Manage live participant entries, launch new quiz bouts, and broadcast real-time rankings."
          />

          <ScreenCard
            mode="crew"
            accent="crew"
            title="Organizer Event Control"
            subtitle="Campus Study Sprint · 142 Candidates"
          />
        </div>
      </Section>

      {/* 6. Steps (Light) */}
      <Section variant="light" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="How Crew works"
          title="Four Simple Steps to"
          highlight="National Student Leadership"
          description="From fast application to hosting your first campus tournament."
        />

        <StepsList
          accent="crew"
          steps={[
            {
              number: '1',
              title: 'Apply in Under 2 Minutes',
              description: 'Submit your campus name, study circle vision, and expected batch size.',
              checklist: ['No Fees or Purchases', 'Open to All Academic Streams'],
              linkText: 'Apply to Crew →',
              onLinkClick: () => setIsApplyModalOpen(true),
            },
            {
              number: '2',
              title: 'Verification & Access Token',
              description: 'Our team verifies your submission within 24–48 hours and activates your organizer privileges.',
              checklist: ['Quick 24h Review', 'Dedicated Support Hotline'],
            },
            {
              number: '3',
              title: 'Create and Share Event Links',
              description: 'Select questions, configure timers, and share the event link in WhatsApp groups and campus forums.',
              checklist: ['Instant Event PIN Generation', 'Mobile-Friendly for All Peers'],
            },
            {
              number: '4',
              title: 'Broadcast Live Leaderboard Standings',
              description: 'Watch submissions roll in as students compete for top scores with automated real-time rankings.',
              checklist: ['Automated Score Computation', 'Exportable Aggregate Summary'],
            },
          ]}
        />
      </Section>

      {/* 7. FAQs (Light) */}
      <Section variant="light" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="Frequent questions"
          title="Boardly Crew"
          highlight="Event FAQs"
        />
        <FaqAccordion items={CREW_FAQS} accent="crew" />
      </Section>

      {/* 8. Final CTA Section */}
      <FinalCTA
        accent="crew"
        primaryButtonText={isCrewApproved ? 'Open Organizer Portal' : 'Apply to Join Crew'}
        secondaryButtonText="Explore Curriculum"
        onPrimaryClick={() => {
          if (isCrewApproved) onNavigate('/crew/dashboard');
          else setIsApplyModalOpen(true);
        }}
        onSecondaryClick={() => onNavigate('/features')}
      />

      {/* 9. Shared Footer */}
      <Footer
        accent="crew"
        programName="Crew"
        onNavigate={(p) => onNavigate(`/${p}`)}
      />

      {/* 10. Application Modal */}
      {isApplyModalOpen && (
        <UnifiedProgramApplicationModal
          defaultProgram="crew"
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            if (user) onNavigate('/crew/dashboard');
          }}
        />
      )}
    </div>
  );
};
