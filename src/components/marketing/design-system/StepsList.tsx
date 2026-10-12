import React, { useEffect, useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';

export interface StepItem {
  number: number | string;
  title: string;
  description: string;
  checklist?: string[];
  linkText?: string;
  onLinkClick?: () => void;
  linkHref?: string;
}

export interface StepsListProps {
  steps: StepItem[];
  accent?: 'default' | 'captain' | 'crew';
  className?: string;
}

export const StepsList: React.FC<StepsListProps> = ({
  steps,
  accent = 'default',
  className = '',
}) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const accentStyles = {
    default: {
      circle: 'bg-indigo-600 text-white shadow-indigo-600/30',
      line: 'bg-gradient-to-b from-indigo-600 via-violet-600 to-teal-500',
      check: 'text-indigo-600 dark:text-indigo-400',
      link: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700',
    },
    captain: {
      circle: 'bg-amber-500 text-white shadow-amber-500/30',
      line: 'bg-gradient-to-b from-amber-500 via-orange-500 to-teal-500',
      check: 'text-amber-600 dark:text-amber-400',
      link: 'text-amber-600 dark:text-amber-400 hover:text-amber-700',
    },
    crew: {
      circle: 'bg-violet-600 text-white shadow-violet-600/30',
      line: 'bg-gradient-to-b from-violet-600 via-indigo-600 to-teal-500',
      check: 'text-violet-600 dark:text-violet-400',
      link: 'text-violet-600 dark:text-violet-400 hover:text-violet-700',
    },
  }[accent];

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateLineProgress);
        ticking = true;
      }
    };

    const updateLineProgress = () => {
      const container = containerRef.current;
      const line = lineRef.current;
      if (!container || !line) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Draw the vertical connector line as user scrolls down the section
      const progress = Math.min(
        Math.max((windowHeight * 0.7 - rect.top) / rect.height, 0),
        1
      );

      line.style.transform = `scaleY(${progress})`;
      ticking = false;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateLineProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative max-w-2xl mx-auto py-6 px-4 ${className}`}>
      {/* Background connector line */}
      <div
        className="absolute left-[2.25rem] sm:left-[2.75rem] top-8 bottom-8 w-[2px] bg-slate-200/80 dark:bg-slate-800 -z-0"
        aria-hidden="true"
      >
        {/* Animated active drawing line */}
        <div
          ref={lineRef}
          className={`w-full h-full origin-top will-change-transform ${accentStyles.line}`}
          style={{ transform: 'scaleY(0)', transformOrigin: 'top' }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-10 sm:space-y-12">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex items-start gap-5 sm:gap-7">
            {/* Circled Numeral */}
            <div
              className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-display font-black text-sm sm:text-base shadow-lg shrink-0 ${accentStyles.circle}`}
            >
              {step.number}
            </div>

            {/* Step Card Content */}
            <div className="flex-1 p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800 shadow-sm text-left">
              <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {step.description}
              </p>

              {/* Checklist items */}
              {step.checklist && step.checklist.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {step.checklist.map((item, cIdx) => (
                    <li key={cIdx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className={`p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 ${accentStyles.check}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Accent text link */}
              {step.linkText && (
                <div className="mt-4 pt-2">
                  <a
                    href={step.linkHref || '#'}
                    onClick={(e) => {
                      if (step.onLinkClick) {
                        e.preventDefault();
                        step.onLinkClick();
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-colors ${accentStyles.link}`}
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
