/**
 * Shared scroll utilities that transparently work with both the docked student
 * scroll viewport (`[data-student-scroll-container="true"]`) and standard window
 * scrolling (public/admin/settings routes).
 */

export const STUDENT_SCROLL_CONTAINER_SELECTOR = '[data-student-scroll-container="true"]';

export function getActiveStudentScrollContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>(STUDENT_SCROLL_CONTAINER_SELECTOR);
}

export function getPageScrollY(): number {
  if (typeof window === 'undefined') return 0;
  const container = getActiveStudentScrollContainer();
  if (container) {
    return container.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function scrollPageToY(top: number, behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return;
  const container = getActiveStudentScrollContainer();
  if (container) {
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top, behavior });
    } else {
      container.scrollTop = top;
    }
    return;
  }
  window.scrollTo({ top, behavior });
  if (behavior === 'auto' && typeof document !== 'undefined') {
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }
}

export function scrollPageToTop(behavior: ScrollBehavior = 'smooth'): void {
  if (typeof window === 'undefined') return;
  const container = getActiveStudentScrollContainer();
  if (container) {
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: 0, behavior });
    } else {
      container.scrollTop = 0;
    }
  }
  window.scrollTo({ top: 0, behavior });
  if (behavior === 'auto' && typeof document !== 'undefined') {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

export function subscribePageScroll(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const container = getActiveStudentScrollContainer();
  window.addEventListener('scroll', handler, { passive: true });
  container?.addEventListener('scroll', handler, { passive: true });
  return () => {
    window.removeEventListener('scroll', handler);
    container?.removeEventListener('scroll', handler);
  };
}
