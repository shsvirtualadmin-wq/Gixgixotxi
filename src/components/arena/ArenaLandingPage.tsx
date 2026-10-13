import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  Share2,
  Copy,
  Clock,
  HelpCircle,
  Trophy,
  Calendar,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../marketing/BrandLogo';
import { Footer } from '../marketing/Footer';
import { FinalCTA } from '../marketing/FinalCTA';
import { Navbar } from '../marketing/Navbar';
import {
  getArenaConfig,
  getArenaStats,
  ArenaSessionConfig,
  ArenaStats,
  DEFAULT_ARENA_CONFIG,
} from '../../lib/arenaApi';
import { SITE_URL, ARENA_URL } from '../../config/site';

interface ArenaLandingPageProps {
  onNavigate: (route: string) => void;
}

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const ARENA_FAQS: FaqItem[] = [
  {
    question: 'What is Boardly Arena?',
    answer:
      'Boardly Arena is a free live testing event where students across Pakistan attempt the same timed paper together. You get instant results and a national rank as soon as the session closes.',
  },
  {
    question: 'Is it really free?',
    answer:
      'Yes, every Arena session is 100% free for all students. There are no fees, subscriptions, or hidden charges required to participate.',
  },
  {
    question: 'When does a paper open and how long do I get?',
    answer:
      'Each session opens at the scheduled time shown in the session details above. You get the full timer duration to complete and submit your answers before the paper closes.',
  },
  {
    question: 'Which subjects are covered?',
    answer:
      'Arena alternates between core syllabus subjects such as Physics, Mathematics, Biology, and Chemistry. Details are shared when the session opens.',
  },
  {
    question: 'Does everyone get the same questions?',
    answer:
      'Yes, all participating students answer the exact same questions from our verified syllabus question bank. This ensures every percentile on the leaderboard is completely fair.',
  },
  {
    question: 'How is the leaderboard ranked?',
    answer:
      'Rankings are based on your total correct score, with total time taken used to break any score ties. The final leaderboard publishes immediately after the session concludes.',
  },
  {
    question: 'When do I see the answers?',
    answer:
      'Full step-by-step solutions and derivation reviews become available right after the session timer ends. You can review every option explanation in your results.',
  },
  {
    question: 'I missed a session. Can I still take that paper?',
    answer:
      'Live sessions happen in real time, but past Arena papers are archived into your Boardly practice library. You can re-attempt them for solo revision anytime.',
  },
  {
    question: 'Can I run an Arena for my own batch or academy?',
    answer: (
      <span>
        Yes! Through our Boardly Crew program, student organizers can host custom timed study events for their campus. Check out the{' '}
        <a href="/crew" className="text-[#1a6dff] font-semibold underline underline-offset-2">
          Boardly Crew page
        </a>{' '}
        to apply.
      </span>
    ),
  },
];

export const ArenaLandingPage: React.FC<ArenaLandingPageProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<ArenaSessionConfig>(DEFAULT_ARENA_CONFIG);
  const [stats, setStats] = useState<ArenaStats>({
    studentsRegistered: null,
    sessionsRun: null,
    questionsAnswered: null,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    // Sync SEO metadata
    document.title = 'Boardly Arena: live timed MCQ practice';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Compete in a timed MCQ session, get instant results and see your rank. Free for every student.'
      );
    }

    // Load config and real stats
    getArenaConfig().then(setConfig);
    getArenaStats().then(setStats);
  }, []);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    onNavigate(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(ARENA_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    const shareText = encodeURIComponent(`Join me on Boardly Arena: ${ARENA_URL}`);
    window.open(`https://wa.me/?text=${shareText}`, '_blank', 'noopener,noreferrer');
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Only display stats that have real database counts
  const realStatsList = [
    stats.studentsRegistered !== null && stats.studentsRegistered > 0
      ? { label: 'Students registered', value: stats.studentsRegistered.toLocaleString() }
      : null,
    stats.sessionsRun !== null && stats.sessionsRun > 0
      ? { label: 'Sessions run', value: stats.sessionsRun.toLocaleString() }
      : null,
    stats.questionsAnswered !== null && stats.questionsAnswered > 0
      ? { label: 'Questions answered', value: stats.questionsAnswered.toLocaleString() }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="min-h-screen w-full bg-[#f8faff] text-[#0f172a] font-sans antialiased flex flex-col justify-between selection:bg-[#1a6dff] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentPage="home"
        accent="default"
        onNavigate={(page) => onNavigate(page === 'home' ? '/' : `/${page}`)}
        onGetStarted={() => onNavigate('/arena/register')}
        getStartedText="Register for Arena"
        getStartedHref="/arena/register"
      />

      <main className="w-full flex-1">
        {/* Faint blue grid background pattern overlay */}
        <div
          className="w-full"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(26, 109, 255, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(26, 109, 255, 0.035) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        >
          {/* SECTION A: HERO (Mobile first, single column, 24px side padding) */}
          <section className="w-full max-w-3xl mx-auto px-6 pt-16 sm:pt-24 pb-14 text-center">
            {/* Status Pill */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#dbe3f5] text-[13px] font-semibold text-[#0f172a] shadow-xs">
                {config.registrationOpen ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shrink-0" />
                    <span>
                      Registration open · {config.sessionName} · {config.subject}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-[#475569]">Registration closed</span>
                  </>
                )}
              </div>
            </div>

            {/* Heading: 48px, weight 800, #0f172a */}
            <h1 className="text-[40px] sm:text-[48px] font-extrabold text-[#0f172a] tracking-tight leading-[1.1] font-display">
              Boardly Arena
            </h1>

            {/* Small blue line under heading */}
            <p className="mt-2 text-[15px] sm:text-[16px] font-bold text-[#1a6dff] tracking-wide uppercase">
              Live timed practice
            </p>

            {/* Paragraph: 18px, #475569 */}
            <p className="mt-5 text-[17px] sm:text-[18px] text-[#475569] leading-[1.6] max-w-xl mx-auto">
              Compete in a timed MCQ session on one subject, get instant results, and see your rank on a public leaderboard. Free for every student.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3 max-w-md mx-auto">
              {/* Primary Pill Button (Hidden in closed state until notify feature exists) */}
              {config.registrationOpen && (
                <a
                  href="/arena/register"
                  onClick={(e) => handleNav(e, '/arena/register')}
                  className="w-full h-[56px] rounded-full bg-[#1a6dff] hover:bg-blue-700 text-white font-bold text-[16px] flex items-center justify-center shadow-md shadow-[#1a6dff]/25 transition-all cursor-pointer"
                >
                  Register for Arena
                </a>
              )}

              {/* Secondary Pill Button */}
              <a
                href="/arena/leaderboard"
                onClick={(e) => handleNav(e, '/arena/leaderboard')}
                className="w-full h-[56px] rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[#0f172a] font-bold text-[16px] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                View leaderboard
              </a>

              {/* Enter Test Room Pill Button */}
              <a
                href="/arena/test"
                onClick={(e) => handleNav(e, '/arena/test')}
                className="w-full h-[52px] rounded-full bg-[#f5f7ff] hover:bg-blue-50 border border-[#c7d2fe] text-[#1a6dff] font-bold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Enter Test Room (/arena/test)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Small Share & Copy Pill Buttons side-by-side */}
              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[13px] font-semibold text-[#475569] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1a6dff]" />}
                  <span>{copiedLink ? 'Link copied' : 'Copy link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[13px] font-semibold text-[#475569] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Session Info Chips Row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 text-[13px] font-semibold text-[#475569]">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#e2e8f0] shadow-xs">
                <Calendar className="w-4 h-4 text-[#1a6dff]" />
                <span>{config.startsAt}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#e2e8f0] shadow-xs">
                <Clock className="w-4 h-4 text-[#1a6dff]" />
                <span>{config.durationMinutes} minutes</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#e2e8f0] shadow-xs">
                <FileText className="w-4 h-4 text-[#1a6dff]" />
                <span>{config.questionCount} questions</span>
              </span>
            </div>
          </section>
        </div>

        {/* SECTION B: ABOUT */}
        <section className="w-full bg-white py-16 px-6 border-y border-[#e2e8f0]">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#f5f7ff] border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold mb-4">
              About the format
            </span>
            <p className="text-[19px] sm:text-[20px] leading-[1.7] text-[#0f172a] font-normal">
              <span className="bg-[#e0ebff] px-1.5 py-0.5 rounded-[8px] font-medium text-[#0f172a]">
                Boardly Arena puts one subject live with a timed paper and a public leaderboard
              </span>
              , so you can practice under real exam pressure and see where you stand.{' '}
              <span className="bg-[#e0ebff] px-1.5 py-0.5 rounded-[8px] font-medium text-[#0f172a]">
                No coaching centre, no fee
              </span>
              , just you,{' '}
              <span className="bg-[#e0ebff] px-1.5 py-0.5 rounded-[8px] font-medium text-[#0f172a]">
                the clock and your rank, well before test day
              </span>
              .
            </p>
          </div>
        </section>

        {/* SECTION C: STATS ROW (Real database counts only) */}
        {realStatsList.length > 0 && (
          <section className="w-full py-12 px-6 bg-[#f8faff]">
            <div className="max-w-4xl mx-auto">
              <div
                className={`grid grid-cols-1 ${
                  realStatsList.length === 1
                    ? 'max-w-xs mx-auto'
                    : realStatsList.length === 2
                    ? 'sm:grid-cols-2 max-w-xl mx-auto'
                    : 'sm:grid-cols-3'
                } gap-6 text-center`}
              >
                {realStatsList.map((st, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-[24px] bg-white border border-[#e2e8f0] shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <p className="text-[36px] font-extrabold text-[#0f172a] font-display leading-tight">
                      {st.value}
                    </p>
                    <p className="mt-1 text-[14px] text-[#475569] font-medium">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION D: HOW IT WORKS (3 white cards with numbered circles) */}
        <section className="w-full py-16 px-6 bg-[#f8faff]">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold mb-3 shadow-xs">
              Simple 3-step process
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0f172a] leading-tight font-display">
              How Boardly Arena Works
            </h2>
            <p className="mt-2 text-[16px] text-[#475569]">
              Everything runs automatically from your registration to the final national leaderboard.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                number: 1,
                title: 'Register once',
                description:
                  'Create your free Arena entry with your name, campus and WhatsApp number.',
              },
              {
                number: 2,
                title: 'Join the live session',
                description:
                  'When the paper opens, you get a fixed time to answer. The timer runs for everyone.',
              },
              {
                number: 3,
                title: 'Check your rank',
                description:
                  'Results and the leaderboard update after the session ends, and you can review the answers.',
              },
            ].map((step, idx, arr) => (
              <div key={step.number} className="relative flex items-start gap-4 sm:gap-6">
                {/* Number circle column */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#1a6dff] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm z-10">
                    {step.number}
                  </div>
                  {/* Connecting line ending at last circle */}
                  {idx < arr.length - 1 && (
                    <div
                      className="w-[2px] bg-[#c7d2fe] absolute top-10 bottom-[-24px] left-1/2 -translate-x-1/2"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Card on right: solid white, radius 28px, border #e2e8f0, shadow */}
                <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] text-left">
                  <h3 className="text-[18px] font-bold text-[#0f172a]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-[#475569] leading-[1.6]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION E: FAQ ACCORDION */}
        <section className="w-full py-16 px-6 bg-white border-t border-[#e2e8f0]">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#f5f7ff] border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold mb-3">
              Frequently asked questions
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#0f172a] font-display">
              Got Questions About Arena?
            </h2>
            <p className="mt-2 text-[16px] text-[#475569]">
              Clear answers on how the timed papers, scoring, and leaderboard operate.
            </p>
          </div>

          <div className="max-w-2xl mx-auto divide-y divide-[#e2e8f0] border-y border-[#e2e8f0]">
            {ARENA_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-2">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full min-h-[56px] py-3.5 flex items-center justify-between text-left gap-4 cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-bold text-[#0f172a] group-hover:text-[#1a6dff] transition-colors">
                      {faq.question}
                    </span>
                    <div
                      className={`w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all ${
                        isOpen
                          ? 'bg-[#1a6dff] text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-lg font-bold leading-none select-none">
                        {isOpen ? '✕' : '+'}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="pb-4 text-[15px] text-[#475569] leading-relaxed animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION F: FINAL CTA CARD */}
        <div className="w-full py-12 px-6 bg-[#f8faff]">
          <FinalCTA
            accent="home"
            heading="Ready for the next session?"
            description="Register once and we will let you know when the next Arena opens. It is free for every student."
            primaryButtonText="Register now"
            secondaryButtonText="View leaderboard"
            primaryHref="/arena/register"
            secondaryHref="/arena/leaderboard"
            onPrimaryClick={() => onNavigate('/arena/register')}
            onSecondaryClick={() => onNavigate('/arena/leaderboard')}
          />
        </div>
      </main>

      {/* SECTION G: SHARED FOOTER WITH ARENA INDEPENDENT NOTE */}
      <Footer
        onNavigate={(page) => onNavigate(page === 'home' ? '/' : `/${page}`)}
        arenaNote={true}
      />
    </div>
  );
};
