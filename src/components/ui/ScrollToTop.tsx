import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { safetyCleanupScrollLocks } from '@/utils/scrollLock';
import {
  getPageScrollY,
  scrollPageToTop,
  scrollPageToY,
  subscribePageScroll,
} from '@/utils/scrollContainer';

const scrollPositionsByKey = new Map<string, number>();
const scrollPositionsByPath = new Map<string, number>();
const MAX_SAVED_SCROLL_ENTRIES = 60;

function saveScrollPosition(key: string, pathKey: string, y: number): void {
  if (scrollPositionsByKey.size > MAX_SAVED_SCROLL_ENTRIES) {
    const oldest = scrollPositionsByKey.keys().next().value;
    if (oldest !== undefined) scrollPositionsByKey.delete(oldest);
  }
  scrollPositionsByKey.set(key, y);
  scrollPositionsByPath.set(pathKey, y);
}

/**
 * Automatically scrolls to the top on forward (PUSH/REPLACE) route changes,
 * preserves and restores the user's scroll position when navigating Back/Forward (POP),
 * and scrolls smoothly to URL hash anchors when present.
 */
export function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const activeRouteRef = useRef<{ key: string; pathKey: string }>({
    key,
    pathKey: `${pathname}${search}`,
  });

  // Continuously save scroll position for the active route using a passive listener
  useEffect(() => {
    const pathKey = `${pathname}${search}`;
    activeRouteRef.current = { key, pathKey };

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        saveScrollPosition(
          activeRouteRef.current.key,
          activeRouteRef.current.pathKey,
          getPageScrollY()
        );
      });
    };

    const unsubscribe = subscribePageScroll(onScroll);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      saveScrollPosition(key, pathKey, getPageScrollY());
      unsubscribe();
    };
  }, [key, pathname, search]);

  useEffect(() => {
    safetyCleanupScrollLocks();

    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''));
      if (id === 'checkin' || id === 'milestones' || id === 'invite' || id === 'faq') {
        return;
      }
      const scrollToAnchor = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      };
      if (!scrollToAnchor()) {
        const timer = setTimeout(scrollToAnchor, 250);
        return () => clearTimeout(timer);
      }
      return;
    }

    const pathKey = `${pathname}${search}`;
    if (navigationType === 'POP') {
      const savedY =
        scrollPositionsByKey.get(key) ?? scrollPositionsByPath.get(pathKey) ?? 0;
      const restore = () => {
        scrollPageToY(savedY, 'auto');
      };
      const r1 = window.requestAnimationFrame(() => {
        restore();
        window.requestAnimationFrame(restore);
      });
      return () => window.cancelAnimationFrame(r1);
    }

    scrollPageToTop('auto');
  }, [pathname, search, hash, key, navigationType]);

  return null;
}

export default ScrollToTop;

