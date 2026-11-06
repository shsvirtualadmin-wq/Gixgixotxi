import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls the window to the top on route changes, unless
 * a URL hash (e.g. `#comment-123` or `#features`) is present, in which case
 * it scrolls to the anchor element if found.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
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

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
