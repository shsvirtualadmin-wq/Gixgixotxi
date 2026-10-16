import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
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
    a: 'Absolutely. Boardly is engineered mobile-first with a high-contrast dark glass cockpit, 48px touch targets, sticky timers, and responsive KaTeX math rendering that requires zero zooming.',
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
    <section className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge color="brand">Got Questions?</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--text-muted)] text-base">
            Everything you need to know about preparing with Boardly.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <GlassCard
                key={faq.q}
                hover
                onClick={() => toggle(idx)}
                className="cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                  <ChevronDown
                    size={18}
                    className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-muted)] leading-relaxed animate-[page-enter_0.2s_ease-out]">
                    {faq.a}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
