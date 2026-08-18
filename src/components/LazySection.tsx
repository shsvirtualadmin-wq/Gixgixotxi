import React, { useState, useEffect, useRef } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  placeholderHeight?: number | string;
  className?: string;
  rootMargin?: string;
  minHeight?: number | string;
  id?: string;
}

/**
 * High-performance viewport-aware lazy renderer using IntersectionObserver.
 * Defers mounting and rendering of heavy DOM sub-trees until the user scrolls within range (default 350px).
 * Once intersecting, it permanently renders the child component to prevent layout shifts.
 */
export const LazySection: React.FC<LazySectionProps> = React.memo(({
  children,
  placeholderHeight = '200px',
  className = '',
  rootMargin = '800px 0px',
  minHeight,
  id,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, render immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    // Check if element is already visible or close to viewport
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight + 800 && rect.bottom > -800) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{
        minHeight: isVisible ? (minHeight || undefined) : placeholderHeight,
      }}
    >
      {isVisible ? children : (
        <div
          className="w-full flex items-center justify-center rounded-2xl bg-[#0d1b3e]/40 border border-[#1e3a8a]/30"
          style={{ height: typeof placeholderHeight === 'number' ? `${placeholderHeight}px` : placeholderHeight }}
        />
      )}
    </div>
  );
});
