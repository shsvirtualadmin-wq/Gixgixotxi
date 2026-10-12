import React, { useEffect, useRef } from 'react';

interface ScrollProgressProps {
  accent?: 'default' | 'captain' | 'crew';
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ accent = 'default' }) => {
  const lineRef = useRef<HTMLDivElement>(null);

  const gradientClass = {
    default: 'bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400',
    captain: 'bg-gradient-to-r from-amber-500 via-orange-400 to-teal-400',
    crew: 'bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-400',
  }[accent];

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const el = lineRef.current;
      if (!el) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;

      // Update scaleX with requestAnimationFrame directly
      el.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 right-0 h-[3px] z-[60] pointer-events-none bg-slate-200/20 dark:bg-slate-800/20"
      aria-hidden="true"
    >
      <div
        ref={lineRef}
        className={`w-full h-full origin-left will-change-transform shadow-[0_0_8px_rgba(26,109,255,0.6)] ${gradientClass}`}
        style={{ transform: 'scaleX(0)', transformOrigin: 'left' }}
      />
    </div>
  );
};
