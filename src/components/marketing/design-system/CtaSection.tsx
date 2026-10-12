import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface CtaSectionProps {
  watermarkText?: string;
  eyebrow?: string;
  title: string;
  highlight?: string;
  description: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  accent?: 'default' | 'captain' | 'crew';
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  watermarkText = 'BOARDLY',
  eyebrow = 'READY TO EXCEL?',
  title,
  highlight,
  description,
  primaryButtonText = 'Start Free Practice',
  secondaryButtonText = 'Explore Features',
  onPrimaryClick,
  onSecondaryClick,
  accent = 'default',
}) => {
  const watermarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = watermarkRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            // Subtle parallax translateY
            const offset = (rect.top - window.innerHeight / 2) * 0.08;
            el.style.transform = `translateY(${offset}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const highlightClasses = {
    default: 'bg-gradient-to-r from-indigo-400 via-violet-300 to-teal-300 bg-clip-text text-transparent',
    captain: 'bg-gradient-to-r from-amber-400 via-orange-300 to-teal-300 bg-clip-text text-transparent',
    crew: 'bg-gradient-to-r from-violet-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent',
  }[accent];

  return (
    <div className="relative py-6 sm:py-10 px-4 text-center overflow-hidden">
      {/* Big Ghost Watermark Word behind heading */}
      <div
        ref={watermarkRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-0 opacity-[0.05] dark:opacity-[0.07] will-change-transform"
        aria-hidden="true"
      >
        <span className="text-6xl sm:text-9xl lg:text-[14rem] font-black font-display uppercase tracking-widest text-white">
          {watermarkText}
        </span>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Eyebrow */}
        <div className="mb-4">
          <span
            className="inline-block text-[12px] sm:text-[13px] font-semibold tracking-normal px-3 py-1 rounded-full shadow-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: accent === 'crew' ? '#c7d2fe' : accent === 'captain' ? '#fcd34d' : '#2dd4bf',
            }}
          >
            {eyebrow.charAt(0).toUpperCase() + eyebrow.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl font-black font-display text-white tracking-tight leading-tight">
          {title}{' '}
          {highlight && <span className={highlightClasses}>{highlight}</span>}
        </h2>

        {/* Subtext */}
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
          {description}
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            accent={accent}
            onClick={onPrimaryClick}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {primaryButtonText}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            accent={accent}
            onClick={onSecondaryClick}
          >
            {secondaryButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
