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
import { ArrowLeft, Zap, ShieldCheck, Award, BarChart3, Users, Clock, CheckCircle2 } from 'lucide-react';

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
  const { profile, isAdmin } = useAuth();

  const isCrewApproved =
    isAdmin ||
    profile?.role === 'crew' ||
    profile?.roles?.includes('crew') ||
    profile?.role === 'organizer' ||
    profile?.roles?.includes('organizer');

  const applyHref = isCrewApproved ? '/crew/dashboard' : '/crew/apply';
  const applyText = isCrewApproved ? 'Open Organizer Portal' : 'Apply to Join Crew';

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
        onGetStarted={() => onNavigate(applyHref)}
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
          className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-white/15 bg-indigo-50/70 dark:bg-white/5 transition-colors cursor-pointer truncate"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home</span>
        </a>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full border shrink-0 whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-white/10 dark:text-indigo-300 dark:border-white/20"
        >
          Crew program
        </span>
      </div>

      {/* Hero Header */}
      <Hero
        eyebrow="Boardly Crew program"
        staticHeadingPrefix="Host Live Study Circles as a"
        typewriterPhrases={CREW_TYPEWRITER}
        staticHeadingSuffix="Across Pakistan"
        description="Organize timed mock exams, lead study circles on your campus, and build verifiable community leadership credentials backed by Boardly."
        primaryCtaText={applyText}
        secondaryCtaText="See Benefits"
        primaryHref={applyHref}
        secondaryHref="#crew-benefits"
        onPrimaryCta={() => onNavigate(applyHref)}
        onSecondaryCta={() => {
          const el = document.getElementById('crew-benefits');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        accent="crew"
        compactTop={true}
      />

      {/* SECTION 1: Hook - The benefits (3-4 short points) */}
      <Section variant="light" id="crew-benefits" accent="crew">
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
              icon: <Zap className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: '30 Days Free Pro Access',
              desc: 'Every approved organizer receives full complimentary access to the entire Boardly testing vault for their personal exam preparation.',
              icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
            },
            {
              title: 'Signed Leadership Credentials',
              desc: 'Receive official certificates of recognition detailing tournament participant counts and campus engagement for resumes and LinkedIn.',
              icon: <Award className="w-5 h-5 text-indigo-600" />,
            },
          ].map((perk, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-indigo-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-3">
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
      <Section variant="light" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="Organizer responsibilities"
          title="What You Do as an"
          highlight="Official Crew Organizer"
          description="Clear, lightweight responsibilities designed to fit smoothly around your studies."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              number: '01',
              title: 'Create & Schedule Test Bouts',
              desc: 'Launch 15-minute Blitz sprints or comprehensive mock exams for your classmates using Boardly’s 17,000+ verified questions.',
              icon: <Clock className="w-5 h-5 text-indigo-600" />,
            },
            {
              number: '02',
              title: 'Share Event Links & PINs',
              desc: 'Distribute event invite links in campus WhatsApp groups, academic societies, and student forums.',
              icon: <Users className="w-5 h-5 text-indigo-600" />,
            },
            {
              number: '03',
              title: 'Lead Collaborative Review',
              desc: 'Encourage peer discussions on tough concepts, track batch score trends, and celebrate top leaderboard finishers.',
              icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
            },
          ].map((resp, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-indigo-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 w-fit">
                      {resp.icon}
                    </div>
                    <span className="text-xs font-bold text-indigo-400 font-mono">STEP {resp.number}</span>
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
      <Section variant="light" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="Evaluation & tracking"
          title="How Your Events are"
          highlight="Recorded & Evaluated"
          description="Automated tracking calculates scores and attendance so you never have to manage spreadsheets."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Live Participant Logging',
              desc: 'Every attendee who enters your event code is automatically logged in your private event dashboard.',
              icon: <Users className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: 'Instant Aggregate Analytics',
              desc: 'Automated grading tallies score distributions, difficulty breakdowns, and negative marking live.',
              icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
            },
            {
              title: 'Milestone Verification',
              desc: 'As your hosted events reach attendance targets, official certificates of recognition are unlocked for your profile.',
              icon: <Award className="w-5 h-5 text-teal-600" />,
            },
          ].map((item, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="p-6 rounded-[24px] bg-white border border-indigo-100 shadow-sm text-left h-full flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-3">
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
      <Section variant="light" accent="crew">
        <SectionHeader
          accent="crew"
          eyebrow="Frequent questions"
          title="Boardly Crew"
          highlight="Event FAQs"
        />
        <FaqAccordion items={CREW_FAQS} accent="crew" />
      </Section>

      {/* Final CTA Section: Links directly to /crew/apply */}
      <FinalCTA
        accent="crew"
        primaryButtonText={applyText}
        secondaryButtonText="Explore Curriculum"
        primaryHref={applyHref}
        secondaryHref="/features"
        onPrimaryClick={() => onNavigate(applyHref)}
        onSecondaryClick={() => onNavigate('/features')}
      />

      {/* Shared Footer */}
      <Footer
        accent="crew"
        programName="Crew"
        onNavigate={(p) => onNavigate(`/${p}`)}
      />
    </div>
  );
};
export default CrewLandingPage;
