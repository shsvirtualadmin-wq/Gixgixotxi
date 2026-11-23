import React, { useEffect, useRef } from 'react';
import {
  getPlusBadgeById,
  resolvePlusBadgeId,
} from '@/lib/plusBadgeDesigns';

export type PlusBadgeSize = 'lg' | 'md' | 'sm' | 'icon';

export interface PlusBadgeProps {
  /** Canonical 1..50 PLUS badge ID (or legacy/string value resolvable to 1..50). Renders nothing if null/invalid. */
  id?: number | string | null;
  size?: PlusBadgeSize;
  /** Whether animation is allowed on this badge. Defaults to true. */
  animated?: boolean;
  /**
   * When true (default for `sm` and `icon` badges in lists unless `priority` is set),
   * uses a shared IntersectionObserver so only on-screen rows animate.
   */
  listMode?: boolean;
  /** When true (e.g., Live Preview, header, profile hero), animates immediately when visible without pausing. */
  priority?: boolean;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

// ============================================================================
// SHARED INTERSECTION OBSERVER — ANIMATE ONLY ON-SCREEN ROWS IN LONG LISTS
// ============================================================================
let sharedPlusObserver: IntersectionObserver | null = null;
let plusVisibilityListenerAttached = false;

function syncDocumentVisibilityClass() {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    document.documentElement.classList.add('tab-hidden');
  } else {
    document.documentElement.classList.remove('tab-hidden');
  }
}

function isReducedMotionActive(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (
    document.documentElement.classList.contains('smooth-mode') ||
    document.documentElement.getAttribute('data-smooth-mode') === 'true'
  ) {
    return true;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function getSharedPlusBadgeObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  if (!plusVisibilityListenerAttached && typeof document !== 'undefined') {
    plusVisibilityListenerAttached = true;
    syncDocumentVisibilityClass();
    document.addEventListener('visibilitychange', syncDocumentVisibilityClass, { passive: true });
  }
  if (!sharedPlusObserver) {
    sharedPlusObserver = new IntersectionObserver(
      (entries) => {
        const reduced = isReducedMotionActive();
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (!reduced && entry.isIntersecting && entry.intersectionRatio > 0) {
            target.classList.remove('plus-badge--paused');
          } else {
            target.classList.add('plus-badge--paused');
          }
        }
      },
      {
        root: null,
        rootMargin: '24px 0px',
        threshold: 0.01,
      }
    );
  }
  return sharedPlusObserver;
}

export const PlusBadge: React.FC<PlusBadgeProps> = React.memo(function PlusBadge({
  id,
  size = 'md',
  animated = true,
  listMode,
  priority = false,
  className = '',
  title,
  onClick,
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const resolvedId = resolvePlusBadgeId(id);
  const badge = getPlusBadgeById(resolvedId);

  const shouldObserve =
    Boolean(badge?.animated) &&
    animated &&
    !priority &&
    (listMode !== undefined ? listMode : size === 'sm' || size === 'icon');

  const shouldPauseStaticOrDisabled =
    !badge?.animated || !animated || isReducedMotionActive();

  useEffect(() => {
    const el = ref.current;
    if (!el || !badge) return;

    if (!badge.animated || !animated || isReducedMotionActive()) {
      el.classList.add('plus-badge--paused');
      return;
    }

    if (!shouldObserve) {
      el.classList.remove('plus-badge--paused');
      return;
    }

    const observer = getSharedPlusBadgeObserver();
    if (!observer) {
      el.classList.remove('plus-badge--paused');
      return;
    }

    // Start paused until IntersectionObserver confirms element is on-screen
    el.classList.add('plus-badge--paused');
    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [badge, animated, shouldObserve]);

  if (!badge) return null;

  const sizeClass =
    size === 'lg'
      ? 'l'
      : size === 'sm'
      ? 'plus-badge--sm'
      : size === 'icon'
      ? 'plus-badge--icon'
      : '';

  const initialPausedClass =
    shouldPauseStaticOrDisabled || shouldObserve ? 'plus-badge--paused' : '';

  return (
    <span
      ref={ref}
      role="img"
      aria-label={`PLUS member — ${badge.name}`}
      title={title || `Boardly PLUS · ${badge.name}`}
      data-plus-badge={badge.id}
      data-plus-badge-name={badge.name}
      data-plus-badge-size={size}
      onClick={onClick}
      style={badge.style}
      className={`plus-badge dark-surface-preserve pb ${badge.animClass} ${sizeClass} ${initialPausedClass} ${className}`.trim()}
    >
      <i aria-hidden="true">{badge.icon}</i>
      {size === 'icon' ? '+' : 'PLUS'}
    </span>
  );
});

export default PlusBadge;
