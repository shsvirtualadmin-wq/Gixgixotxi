import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Badge } from '../ui/Badge';

const FAQS = [
  {
    q: 'Does Boardly simulate actual negative marking?',
    a: 'Yes. For tests like FAST-NUCES that deduct 0.25 marks per incorrect answer, Boardly applies the exact deduction formula. Your test engine results show raw score, net score, and total penalty marks so you learn when to skip.',
  },
  {
    q: 'When do daily practice limits refresh?',
    a: 'All Free and Pro quotas refresh precisely at 12:00 AM (midnight) Pakistan Standard Time (PKT, UTC+5). If you study at 11:30 PM, your new allowance is available right at midnight.',
  },
  {
    q: 'Which universities and tests are included?',
    a: 'We have dedicated question banks and past paper formats for FAST-NUCES (CS & Engineering), NUST NET (Engineering, Computing, Applied Sciences), GIKI, LUMS LCAT, NED Karachi, ECAT Punjab, and MDCAT (PMDC syllabus).',
  },
  {
    q: 'How do I pay if I do not have an international credit card?',
    a: 'We accept local Pakistani payment methods: JazzCash, EasyPaisa, SadaPay, NayaPay, and direct bank transfer. Upload your transaction screenshot on the Plans page and our team activates Pro within minutes.',
  },
  {
    q: 'Can I study effectively on my smartphone?',
    a: 'Absolutely. Boardly is engineered mobile-first with a high-contrast dark cockpit, 48px touch targets, sticky timers, and responsive KaTeX math rendering that requires zero zooming.',
  },
  {
    q: 'What is the Boardly Ambassador & Captain program?',
    a: 'Students can become Campus Captains or Crew Ambassadors to represent Boardly at their colleges and academies. Top ambassadors earn milestone rewards, official certificates, and paid stipend tiers.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(current => (current === idx ? null : idx));
  };

  return (
    <section id="faq" className="landing-section relative">
      <div className="boardly-container">
        {/* Centered section header block */}
        <div className="section-header">
          <Badge color="muted">Got Questions?</Badge>
          <h2>Frequently Asked Questions</h2>
          <p>
            Everything you need to know about preparing with Boardly.
          </p>
        </div>

        {/* FAQ list: centered at max-width 800px, 12px gap between rows */}
        <div className="max-w-[800px] mx-auto flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                onClick={() => toggle(idx)}
                className="rounded-[16px] bg-[var(--surface)] border border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{
                  padding: '20px',
                }}
              >
                {/* Question row: Space Grotesk 16px, + / - toggle icon */}
                <div className="flex items-center justify-between gap-4">
                  <h3
                    className="text-[16px] font-semibold text-[var(--text)] leading-snug"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {faq.q}
                  </h3>
                  <div className="text-[var(--muted)] shrink-0 w-6 h-6 flex items-center justify-center">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </div>

                {/* Answer text: Space Grotesk 14px, #9A9A9A, 12px space below question when open */}
                {isOpen && (
                  <div
                    className="mt-3 pt-3 border-t border-[var(--border)] text-[14px] text-[#9A9A9A] leading-relaxed"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thin dotted divider between sections */}
        <div className="divider-dotted mt-16 sm:mt-24" />
      </div>
    </section>
  );
}
