import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const FAQ_ITEMS = [
  {
    q: 'Can I practice with timed conditions and penalty marking?',
    a: 'Yes. Boardly supports both untimed topic practice and full timed mock tests with configurable negative marking matching MDCAT, ECAT, NUST NET, FAST, and GIKI patterns.',
  },
  {
    q: 'When do daily practice limits refresh?',
    a: 'Daily practice counters and study streaks reset automatically every night at 12:00 AM Pakistan Standard Time (PKT, UTC+5).',
  },
  {
    q: 'Which subjects and levels are covered?',
    a: 'Boardly covers Class 11 (HSSC-I) and Class 12 (HSSC-II) Mathematics, Physics, Chemistry, Biology, Computer Science, and English across FBISE, Punjab, Sindh, KPK, and Balochistan boards, plus MDCAT and ECAT/NET entrance tracks.',
  },
  {
    q: 'What is Boardly Commons?',
    a: 'Boardly Commons is our open student academic network where students share handwritten notes, solved past papers, formula sheets, and ask subject doubts. Anyone can browse and read Commons posts publicly; signing in lets you post, upvote, comment, and download PDFs.',
  },
  {
    q: 'How do I pay if I do not have an international credit card?',
    a: 'Boardly supports 100% local Pakistani payment methods including JazzCash, Opay, SadaPay, NayaPay, and direct Bank Transfer with fast verification.',
  },
  {
    q: 'Can I study effectively on my smartphone?',
    a: 'Yes. Every test runner, KaTeX formula derivation, Commons feed, and Study Crew dashboard is engineered for smooth mobile and desktop performance.',
  },
  {
    q: 'What are Grand Line public tests and Nakama Captains?',
    a: 'Nakama Captains are verified campus student leaders who author and publish public mock tests on the Grand Line arena. Students can view test syllabi and leaderboards publicly and sign in to take full timed attempts.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title="Frequently Asked Questions (FAQ) — Boardly"
        description="Answers to common questions about Boardly's Class 11 & 12 MCQ bank, timed entrance exam mocks, Boardly Commons, PKT midnight resets, and local JazzCash/Opay payments."
        canonicalPath="/faq"
        jsonLd={faqSchema}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'FAQ' }]} />

        <div className="glass-panel p-8 sm:p-10 mb-8">
          <div className="section-chip-red mb-4">
            <HelpCircle size={13} />
            <span>Got Questions?</span>
          </div>
          <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed">
            Everything you need to know about practicing on Boardly, downloading notes in Commons, competing on Grand Line, and paying locally.
          </p>
        </div>

        <div className="space-y-3 mb-10">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="glass-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm sm:text-base text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-white/60 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#D71921]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-0 text-sm text-white/70 leading-relaxed border-t border-white/[0.06]">
                    <p className="pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-panel p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-dot text-xl font-bold text-white mb-1">
              Still have a question?
            </h2>
            <p className="text-xs sm:text-sm text-white/65">
              Our support team is happy to help with accounts, syllabus coverage, or local billing.
            </p>
          </div>
          <Link
            to="/contact"
            className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
