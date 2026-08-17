import { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

export interface SlidingPillStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
}

/**
 * Hook for calculating smooth, GPU-accelerated sliding pill tab indicators.
 * Measures layout offsets (offsetLeft, offsetTop, offsetWidth, offsetHeight)
 * in useLayoutEffect, and batches resize observations via requestAnimationFrame
 * to eliminate layout thrashing, stutter, or forced reflows.
 */
export function useSlidingPill<T extends string | number>(activeKey: T) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Map<T, HTMLElement>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const [pillStyle, setPillStyle] = useState<SlidingPillStyle>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const updatePosition = useCallback((shouldScrollIntoView = false) => {
    const container = containerRef.current;
    const activeEl = tabRefs.current.get(activeKey);
    if (!container || !activeEl) return;

    // Synchronous layout measurement directly from offset properties
    const left = activeEl.offsetLeft;
    const top = activeEl.offsetTop;
    const width = activeEl.offsetWidth;
    const height = activeEl.offsetHeight;

    if (width === 0 || height === 0) return;

    // Gently keep tab in view horizontally inside scrollable container
    if (shouldScrollIntoView && container.scrollWidth > container.clientWidth) {
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const elLeft = left;
      const elRight = left + width;

      if (elLeft < containerLeft) {
        container.scrollTo({ left: Math.max(0, elLeft - 16), behavior: 'smooth' });
      } else if (elRight > containerRight) {
        container.scrollTo({ left: elRight - container.clientWidth + 16, behavior: 'smooth' });
      }
    }

    // Only update if values actually shifted by more than a fraction of a pixel
    setPillStyle(prev => {
      if (
        prev.ready &&
        Math.abs(prev.left - left) < 0.5 &&
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.top - top) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
      ) {
        return prev;
      }
      return {
        left,
        top,
        width,
        height,
        ready: true,
      };
    });
  }, [activeKey]);

  // Synchronously compute right after DOM updates before browser paint
  useLayoutEffect(() => {
    updatePosition(true);
  }, [updatePosition]);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        updatePosition(false);
      });
    };

    window.addEventListener('resize', scheduleUpdate, { passive: true });

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        scheduleUpdate();
      });
      observer.observe(containerRef.current);
      tabRefs.current.forEach(el => {
        if (el && observer) observer.observe(el);
      });
    }

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [updatePosition]);

  // Stable ref registration callback
  const registerTab = useCallback(
    (key: T) => (el: HTMLElement | null) => {
      if (el) {
        tabRefs.current.set(key, el);
      } else {
        tabRefs.current.delete(key);
      }
    },
    []
  );

  return { containerRef, registerTab, pillStyle, updatePosition };
}


