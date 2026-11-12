import { useState, useEffect, useRef } from 'react';
import { Compass, Zap, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Select Subject & Topics',
    description:
      'Choose from core subjects including Mathematics, Physics, Chemistry, Biology, and Computer Science. Pick chapters to focus on and set your practice length.',
    icon: Compass,
    floatClass: 'animate-float-1',
  },
  {
    step: '02',
    title: 'Drill Focused MCQ Sprints',
    description:
      'Practice quick micro-sprints with instant feedback. If stuck, review step-by-step KaTeX derivations and get concept breakdowns from Boardy AI.',
    icon: Zap,
    floatClass: 'animate-float-2',
  },
  {
    step: '03',
    title: 'Master Weak Chapters & Grow',
    description:
      'Review your detailed accuracy scores across every chapter. Pinpoint your weak topics, maintain your daily practice streak, and build mastery step by step.',
    icon: TrendingUp,
    floatClass: 'animate-float-3',
  },
];

export function HowItWorks() {
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
      { threshold: 0.15 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden isolate py-14 sm:py-20 lg:py-28 cv-auto-section"
    >
      <div className="boardly-container">
        {/* Centered Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Simple 3-Step Strategy Chip */}
          <div className="flex justify-center mb-4">
            <span className="section-chip">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0"
                aria-hidden="true"
              />
              Simple 3-Step Strategy
            </span>
          </div>

          {/* Heading in pixel font */}
          <h2
            className="font-dot font-extrabold text-white tracking-tight leading-tight mb-4"
            style={{
              fontFamily: 'var(--font-dot)',
              letterSpacing: '0.01em',
              fontWeight: 800,
              fontSize: 'clamp(26px, 3.6vw, 38px)',
            }}
          >
            How Boardly Works
          </h2>

          {/* Subtext in muted gray */}
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            A structured study routine designed to help you practice with clarity, stay consistent, and improve every day.
          </p>
        </div>

        {/* Floating Cards Container */}
        <div className="relative">
          {/* Subtly connected connector line behind the row at the height of the numbers */}
          <div
            className="hidden md:block absolute top-[58px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-0"
            aria-hidden="true"
          />

          {/* 3 equal-height floating glass cards with even gaps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch relative z-10">
            {STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className={`glass-card h-full flex flex-col justify-between rounded-[28px] sm:rounded-[32px] p-8 sm:p-9 transition-all duration-500 ease-out select-none ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-3'
                  }`}
                  style={{
                    transitionDelay: `${idx * 90}ms`,
                  }}
                >
                  <div>
                    {/* Top row: Big dot-matrix number, icon tile top-right */}
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="font-doto text-[34px] sm:text-[38px] leading-none font-bold text-white/95"
                      >
                        {item.step}
                      </span>
                      <div
                        className={`icon-tile w-12 h-12 rounded-[18px] ${item.floatClass}`}
                      >
                        <Icon size={20} />
                      </div>
                    </div>

                    <h3
                      className="text-lg sm:text-[19px] font-bold text-white mb-2.5 font-heading tracking-tight leading-snug"
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-[14.5px] text-[var(--muted)] leading-[1.68]">
                      {item.description}
                    </p>
                  </div>

                  {/* Step X of 3 footer pinned to the bottom, separated by a thin soft gradient line */}
                  <div className="mt-auto pt-6">
                    <div
                      className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-3.5"
                      aria-hidden="true"
                    />
                    <div
                      className="min-h-[20px] flex items-center text-xs text-[var(--muted)] font-medium font-heading tracking-tight"
                    >
                      Step {idx + 1} of 3
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
