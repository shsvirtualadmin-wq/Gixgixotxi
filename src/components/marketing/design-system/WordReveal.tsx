import React, { useEffect, useRef } from 'react';

export interface WordRevealProps {
  statement: string;
  accent?: 'default' | 'captain' | 'crew';
  className?: string;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  statement,
  accent = 'default',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = statement.split(' ');

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateWordOpacities);
        ticking = true;
      }
    };

    const updateWordOpacities = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress of container through the middle of the viewport
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.25;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

      const wordElements = container.querySelectorAll<HTMLSpanElement>('[data-word-index]');
      const total = wordElements.length;

      wordElements.forEach((el, idx) => {
        const wordThreshold = idx / total;
        // Smoothly fade each word from 0.2 to 1 as scroll progress passes its index
        const wordProgress = Math.min(Math.max((progress - wordThreshold) * total, 0), 1);
        const opacity = 0.2 + wordProgress * 0.8;
        el.style.opacity = String(opacity);
      });

      ticking = false;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateWordOpacities();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [words.length]);

  return (
    <div
      ref={containerRef}
      className={`max-w-4xl mx-auto text-center py-10 px-4 select-none ${className}`}
    >
      <p className="text-2xl sm:text-4xl lg:text-5xl font-black font-display leading-[1.3] text-white">
        {words.map((word, i) => (
          <span
            key={i}
            data-word-index={i}
            className="inline-block mr-[0.28em] transition-opacity duration-75 will-change-opacity"
            style={{ opacity: 0.2 }}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
};
