import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Button } from './Button';
import { SITE_STATS } from '../../../config/stats';
import { UNIVERSITIES } from '../../../data/universities';
import { UniversityLogoBadge } from '../../UniversityLogoBadge';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface HeroProps {
  eyebrow: string;
  staticHeadingPrefix: string;
  typewriterPhrases: string[];
  staticHeadingSuffix?: string;
  description: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  primaryHref?: string;
  secondaryHref?: string;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  accent?: 'default' | 'captain' | 'crew';
  tickerItems?: string[];
  compactTop?: boolean;
}

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  if (!/^[A-Z\s\-_0-9&,.]+$/.test(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export const Hero: React.FC<HeroProps> = ({
  eyebrow,
  staticHeadingPrefix,
  typewriterPhrases,
  staticHeadingSuffix = '',
  description,
  primaryCtaText = 'Start Free Practice',
  secondaryCtaText = 'Explore Curriculum',
  primaryHref,
  secondaryHref,
  onPrimaryCta,
  onSecondaryCta,
  accent = 'default',
  tickerItems = [
    'Student A. joined a Blitz · 142 registered',
    'Student B. completed Physics drill · 45 MCQs',
    'Student C. started timed mock session',
    'Student D. reviewed formula vault derivation',
  ],
  compactTop = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Typewriter effect state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState(typewriterPhrases[0] || '');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion || typewriterPhrases.length === 0) {
      setCurrentText(typewriterPhrases[0] || '');
      return;
    }

    const targetPhrase = typewriterPhrases[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting && currentText === targetPhrase) {
      // Pause before deleting
      timer = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && currentText === '') {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
    } else {
      const speed = isDeleting ? 45 : 85;
      timer = setTimeout(() => {
        setCurrentText((prev) =>
          isDeleting
            ? targetPhrase.substring(0, prev.length - 1)
            : targetPhrase.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, typewriterPhrases, shouldReduceMotion]);

  // Accent styling
  const accentClasses = {
    default: {
      eyebrow: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
      gradientText: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 bg-clip-text text-transparent',
      caret: 'bg-[#1a6dff]',
    },
    captain: {
      eyebrow: 'text-amber-700 dark:text-amber-400 border-amber-500/20 bg-amber-500/10',
      gradientText: 'bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 bg-clip-text text-transparent',
      caret: 'bg-amber-500',
    },
    crew: {
      eyebrow: 'text-violet-700 dark:text-violet-400 border-violet-500/20 bg-violet-500/10',
      gradientText: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent',
      caret: 'bg-violet-600',
    },
  }[accent];

  // Stats Count-up animation on first view
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({ students: 0, mcqs: 0, unis: 0 });

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;

    const duration = shouldReduceMotion ? 100 : 1200;
    const startTime = performance.now();

    const animateCounts = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        students: Math.floor(eased * SITE_STATS.studentsCount),
        mcqs: Math.floor(eased * (SITE_STATS.questionBankCount / 1000)),
        unis: Math.floor(eased * SITE_STATS.universitiesCount),
      });

      if (progress < 1) {
        requestAnimationFrame(animateCounts);
      } else {
        setCounts({
          students: SITE_STATS.studentsCount,
          mcqs: 17,
          unis: SITE_STATS.universitiesCount,
        });
      }
    };

    requestAnimationFrame(animateCounts);
  }, [statsVisible, shouldReduceMotion]);

  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  return (
    <div
      className={`relative ${
        compactTop ? 'pt-4 sm:pt-8' : 'pt-24 sm:pt-32'
      } pb-10 sm:pb-12 overflow-hidden text-center`}
    >
      {/* Eyebrow Pill: Sentence case, 12-13px, weight 600, letter-spacing 0 */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[12px] sm:text-[13px] font-semibold tracking-normal mb-6 shadow-xs backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>{formatSentenceCase(eyebrow)}</span>
      </div>

      {/* Main Two-tone Heading with Typewriter (line-height 1.2) */}
      <h1 className="max-w-4xl mx-auto px-4 text-3xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-slate-950 dark:text-white leading-[1.2]">
        {staticHeadingPrefix}{' '}
        <span className={`inline-block ${accentClasses.gradientText}`}>
          {currentText}
          {!shouldReduceMotion && (
            <span
              className={`inline-block w-[3px] h-[0.85em] ml-1 align-baseline ${accentClasses.caret} animate-[typewriterBlink_1s_infinite]`}
              aria-hidden="true"
            />
          )}
        </span>{' '}
        {staticHeadingSuffix}
      </h1>

      {/* Subtext: line-height 1.6 */}
      <p className="max-w-2xl mx-auto px-4 mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-[1.6]">
        {description}
      </p>

      {/* Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 px-4">
        <Button
          variant="primary"
          size="lg"
          accent={accent}
          href={primaryHref}
          onClick={onPrimaryCta}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {primaryCtaText}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          accent={accent}
          href={secondaryHref}
          onClick={onSecondaryCta}
        >
          {secondaryCtaText}
        </Button>
      </div>

      {/* Stats Row of 3 Items separated by thin dividers: Sentence case labels, 13px, muted color */}
      <div
        ref={statsRef}
        className="max-w-3xl mx-auto mt-12 sm:mt-16 px-4"
      >
        <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 py-4 px-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div className="px-2 sm:px-6 text-center">
            <div className="text-xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              {statsVisible ? `${counts.students}+` : SITE_STATS.studentsLabel}
            </div>
            <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Students
            </div>
          </div>
          <div className="px-2 sm:px-6 text-center">
            <div className="text-xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              {statsVisible ? `${counts.mcqs}k+` : SITE_STATS.questionBankLabel}
            </div>
            <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Verified MCQs
            </div>
          </div>
          <div className="px-2 sm:px-6 text-center">
            <div className="text-xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              {statsVisible ? `${counts.unis}+` : SITE_STATS.universitiesLabel}
            </div>
            <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Universities
            </div>
          </div>
        </div>
      </div>

      {/* Auto-scrolling horizontal logos marquee */}
      <div className="mt-12 w-full overflow-hidden">
        <div className="text-center mb-3">
          <span className="text-[12px] sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400">
            Covering top universities and boards
          </span>
        </div>

        <div
          className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]"
          onTouchStart={() => setIsMarqueePaused(true)}
          onTouchEnd={() => setIsMarqueePaused(false)}
        >
          <div
            className={`flex items-center gap-6 sm:gap-8 py-2 animate-marquee-scroll ${
              isMarqueePaused ? '[animation-play-state:paused]' : ''
            }`}
          >
            {[...UNIVERSITIES, ...UNIVERSITIES].map((uni, index) => (
              <div
                key={`${uni.id}-${index}`}
                className="flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 text-center group cursor-default"
              >
                <UniversityLogoBadge university={uni} size="lg" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1.5 truncate max-w-full">
                  {uni.shortName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live-activity ticker strip */}
      <div className="mt-8 border-t border-slate-200/40 dark:border-slate-800/40 pt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)]">
        <div className="flex items-center gap-8 animate-marquee-scroll whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
