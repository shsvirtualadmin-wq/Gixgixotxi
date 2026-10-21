import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Badge } from '../ui/Badge';

const FAQS = [
  {
    q: 'Can I practice with timed conditions and penalty marking?',
    a: 'Yes. You can test yourself in timed sprint mode, and for selective tests that penalize guessing, you can practice with negative marking to build disciplined accuracy and time management.',
  },
  {
    q: 'When do daily practice limits refresh?',
    a: 'All Free and Pro quotas refresh precisely at 12:00 AM (midnight) Pakistan Standard Time (PKT, UTC+5). If you study late at night, your new allowance is available right at midnight.',
  },
  {
    q: 'Which subjects and levels are covered?',
    a: 'Boardly covers core subjects including Mathematics, Physics, Chemistry, Biology, and Computer Science, structured for intermediate and secondary students as well as competitive university entry requirements.',
  },
  {
    q: 'What is Boardly Commons?',
    a: 'Boardly Commons is our student community space where learners share study notes, discuss difficult questions, post concept doubts, and collaborate with peers across Pakistan in a safe, moderated environment.',
  },
  {
    q: 'How do I pay if I do not have an international credit card?',
    a: 'We accept local Pakistani payment methods: JazzCash, EasyPaisa, SadaPay, NayaPay, and direct bank transfer. Upload your transaction screenshot on the Plans page and our team activates Pro within minutes.',
  },
  {
    q: 'Can I study effectively on my smartphone?',
    a: 'Absolutely. Boardly is engineered mobile-first with a high-contrast dark theme, 48px touch targets, sticky timers, and responsive KaTeX math rendering that requires zero zooming.',
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
            Everything you need to know about practicing and learning with Boardly.
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
                    className="mt-3 pt-3 border-t border-[var(--border)] text-[14px] text-[var(--text-muted)] leading-relaxed"
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
