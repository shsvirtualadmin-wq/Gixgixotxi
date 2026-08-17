import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  formattingFn?: (val: number, isComplete: boolean) => string;
  finalDisplay?: string; // Optional override for final text (e.g. "12K+", "24/7", "3 Tracks")
  prefix?: string;
  suffix?: string;
  separator?: boolean; // Formats with commas like 1,240
  triggerOnView?: boolean; // Trigger with IntersectionObserver
  rootMargin?: string;
  threshold?: number;
}

export function useCountUp({
  end,
  start = 0,
  duration = 1200,
  decimals = 0,
  formattingFn,
  finalDisplay,
  prefix = '',
  suffix = '',
  separator = true,
  triggerOnView = true,
  rootMargin = '50px',
  threshold = 0.05,
}: UseCountUpOptions) {
  const [displayString, setDisplayString] = useState<string>(() => {
    // Initial SSR/mount default is the starting formatted number or 0
    return prefix + (separator ? start.toLocaleString() : start.toString()) + suffix;
  });
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsComplete(true);
      setHasStarted(true);
      if (finalDisplay) {
        setDisplayString(finalDisplay);
      } else if (formattingFn) {
        setDisplayString(formattingFn(end, true));
      } else {
        const valStr = decimals > 0 
          ? (separator ? end.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : end.toFixed(decimals))
          : (separator ? Math.round(end).toLocaleString() : Math.round(end).toString());
        setDisplayString(prefix + valStr + suffix);
      }
      return;
    }

    const startAnimation = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setHasStarted(true);

      const startTime = performance.now();
      const startVal = start;
      const targetVal = end;
      let animFrameId: number;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        
        // Quintic ease-out for rapid initial roll and buttery smooth landing
        const easeOut = 1 - Math.pow(1 - rawProgress, 4);
        const currentNumericVal = startVal + (targetVal - startVal) * easeOut;

        if (rawProgress < 1) {
          if (formattingFn) {
            setDisplayString(formattingFn(currentNumericVal, false));
          } else {
            const formattedNum = decimals > 0
              ? (separator 
                  ? currentNumericVal.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) 
                  : currentNumericVal.toFixed(decimals))
              : (separator 
                  ? Math.round(currentNumericVal).toLocaleString() 
                  : Math.round(currentNumericVal).toString());
            setDisplayString(prefix + formattedNum + suffix);
          }
          animFrameId = requestAnimationFrame(step);
        } else {
          setIsComplete(true);
          if (finalDisplay) {
            setDisplayString(finalDisplay);
          } else if (formattingFn) {
            setDisplayString(formattingFn(targetVal, true));
          } else {
            const finalNum = decimals > 0
              ? (separator 
                  ? targetVal.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) 
                  : targetVal.toFixed(decimals))
              : (separator 
                  ? Math.round(targetVal).toLocaleString() 
                  : Math.round(targetVal).toString());
            setDisplayString(prefix + finalNum + suffix);
          }
        }
      };

      animFrameId = requestAnimationFrame(step);

      return () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
      };
    };

    if (!triggerOnView) {
      const cleanup = startAnimation();
      return cleanup;
    }

    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const cleanup = startAnimation();
      return cleanup;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          observer.disconnect();
          startAnimation();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    // Fallback safety timeout in case observer doesn't trigger immediately
    const fallbackTimer = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        observer.disconnect();
        startAnimation();
      }
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [end, start, duration, decimals, formattingFn, finalDisplay, prefix, suffix, separator, triggerOnView, rootMargin, threshold]);

  return {
    ref: elementRef,
    displayString,
    isComplete,
    hasStarted,
  };
}
