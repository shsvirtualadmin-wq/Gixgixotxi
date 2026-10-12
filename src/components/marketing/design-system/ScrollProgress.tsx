import React, { useEffect, useRef } from 'react';

interface ScrollProgressProps {
  accent?: 'default' | 'captain' | 'crew';
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ accent = 'default' }) => {
  const lineRef = useRef<HTMLDivElement>(null);

  const gradientClass = {
    default: 'bg-gradient-to-b from-indigo-500 via-violet-500 to-teal-400',
    captain: 'bg-gradient-to-b from-amber-500 via-teal-400 to-amber-500',
    crew: 'bg-gradient-to-b from-violet-500 via-indigo-500 to-teal-400',
  }[accent];

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const el = lineRef.current;
      if (!el) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;

      // Update scaleY with requestAnimationFrame directly, no React state
      el.style.transform = `scaleY(${progress})`;
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
      className="fixed left-0 top-0 bottom-0 w-[3px] z-50 pointer-events-none bg-slate-200/40 dark:bg-slate-800/40"
      aria-hidden="true"
    >
      <div
        ref={lineRef}
        className={`w-full h-full origin-top will-change-transform shadow-[0_0_8px_rgba(99,102,241,0.6)] ${gradientClass}`}
        style={{ transform: 'scaleY(0)', transformOrigin: 'top' }}
      />
    </div>
  );
};
