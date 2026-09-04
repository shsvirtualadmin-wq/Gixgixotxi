import React, { useEffect, useRef, useState } from 'react';

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay before starting animation in seconds */
  delay?: number;
  /** Duration of animation in seconds */
  duration?: number;
  /** Distance in pixels to slide up from bottom */
  distance?: number;
  /** Whether animation should only trigger once when coming into view */
  once?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Fraction of element that must be visible to trigger (0 to 1 or "some" / "all") */
  amount?: number | 'some' | 'all';
  /** Optional hover transform */
  whileHover?: any;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Optional stagger delay for children */
  staggerChildren?: number;
}

// Shared singleton IntersectionObserver to avoid creating dozens of observer instances
let sharedObserver: IntersectionObserver | null = null;
const observerCallbacks = new WeakMap<Element, (isIntersecting: boolean) => void>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const cb = observerCallbacks.get(entry.target);
          if (cb) {
            cb(entry.isIntersecting);
          }
        }
      },
      {
        rootMargin: '50px 0px 50px 0px',
        threshold: 0.01,
      }
    );
  }
  return sharedObserver;
}

/**
 * ScrollReveal component optimized for 60fps GPU compositor performance.
 * Uses native CSS transform/opacity transitions and offscreen content-visibility
 * instead of JS-driven scroll recalculations.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  distance = 18,
  once = true,
  className = '',
  style,
}) => {
  const domRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    const observer = getSharedObserver();
    if (!observer) {
      setIsVisible(true);
      return;
    }

    const callback = (isIntersecting: boolean) => {
      if (isIntersecting) {
        setIsVisible(true);
        if (once) {
          observer.unobserve(el);
          observerCallbacks.delete(el);
        }
      } else if (!once) {
        setIsVisible(false);
      }
    };

    observerCallbacks.set(el, callback);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observerCallbacks.delete(el);
    };
  }, [once]);

  const transitionStyle: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}s`,
    transitionDelay: `${delay}s`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transform: isVisible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${distance}px, 0)`,
    opacity: isVisible ? 1 : 0.05,
    willChange: isVisible ? 'auto' : 'transform, opacity',
    ...style,
  };

  return (
    <div ref={domRef} style={transitionStyle} className={className}>
      {children}
    </div>
  );
};

export default React.memo(ScrollReveal);
