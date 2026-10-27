import { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex((current) => (current === idx ? null : idx));
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative py-14 sm:py-20 lg:py-28 overflow-hidden cv-auto-section"
      style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}
    >
      {/* Ambient soft red radial glow behind the FAQ section */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none -z-10 opacity-70"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.12)_0%,rgba(215,25,33,0.03)_55%,transparent_75%)]" />
      </div>

      <div className="boardly-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          {/* "Got Questions?" glass pill chip */}
          <div className="flex justify-center mb-4">
            <span className="section-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-heading tracking-wide">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0"
                aria-hidden="true"
              />
              Got Questions?
            </span>
          </div>

          {/* Heading in pixel font */}
          <h2
            className="font-dot font-extrabold text-white tracking-tight leading-tight mb-3.5"
            style={{
              fontFamily: 'var(--font-dot)',
              letterSpacing: '0.01em',
              fontWeight: 800,
              fontSize: 'clamp(26px, 3.6vw, 38px)',
            }}
          >
            Frequently Asked Questions
          </h2>

          {/* Subtext in muted gray */}
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
            Everything you need to know about practicing and learning with Boardly.
          </p>
        </div>

        {/* Floating Glass Accordion Rows */}
        <div className="max-w-[840px] mx-auto flex flex-col gap-3.5 sm:gap-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const answerId = `faq-answer-${idx}`;
            const triggerId = `faq-trigger-${idx}`;

            return (
              <div
                key={faq.q}
                className={`group rounded-[24px] sm:rounded-[28px] transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.99] ${
                  isOpen
                    ? 'glass-card-highlight'
                    : 'glass-card hover:border-white/20'
                } ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
                }`}
                style={{
                  transitionDelay: `${idx * 60}ms`,
                }}
              >
                {/* Accessible Button Trigger */}
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggle(idx)}
                  className="w-full text-left flex items-center justify-between gap-4 p-5 sm:p-6 cursor-pointer rounded-[24px] sm:rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D71921] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <span
                    className="text-[15px] sm:text-[16px] font-semibold text-white/95 leading-snug tracking-[-0.015em]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {faq.q}
                  </span>

                  {/* Round glass tile with plus/minus icon */}
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isOpen
                        ? 'bg-[#D71921]/20 border-[#D71921]/60 text-[var(--text-primary)] shadow-[0_0_12px_rgba(215,25,33,0.35)]'
                        : 'icon-tile text-white/70 group-hover:text-white group-hover:border-white/25'
                    }`}
                    aria-hidden="true"
                  >
                    {isOpen ? (
                      <Minus size={15} strokeWidth={2.5} />
                    ) : (
                      <Plus size={15} strokeWidth={2.5} />
                    )}
                  </span>
                </button>

                {/* Animated expandable answer area */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                      <div
                        className="pt-3 border-t border-white/[0.08] text-sm sm:text-[14.5px] text-[var(--muted)] leading-relaxed"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                      >
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thin soft gradient divider line fading at edges */}
        <div
          className="w-full max-w-[960px] mx-auto mt-14 sm:mt-20 h-[1px] bg-gradient-to-r from-transparent via-white/12 to-transparent"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

export default FaqSection;
