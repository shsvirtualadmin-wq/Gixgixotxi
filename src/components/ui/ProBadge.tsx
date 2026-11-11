import React, { useEffect, useRef } from 'react';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  PIXEL_FONT_PRO_BADGE_IDS,
  STATIC_PRO_BADGE_IDS,
  normalizeProBadgeDesign,
  type ProBadgeDesignId,
} from '@/lib/proBadgeDesigns';

export type ProBadgeSize = 'lg' | 'md' | 'sm' | 'icon';

export interface ProBadgeProps {
  design?: ProBadgeDesignId | string | null;
  size?: ProBadgeSize;
  /**
   * Whether animation is allowed on this badge.
   * Defaults to true. Static designs (#9 mono, #13 chevron, #17 ribbon) never animate.
   */
  animated?: boolean;
  /**
   * When true (default for `sm` and `icon` badges in lists unless `priority` is set),
   * uses the shared IntersectionObserver that animates at most 8 visible list badges at once.
   */
  listMode?: boolean;
  /**
   * When true (e.g. Header, Profile hero, or Settings picker previews), bypasses the 8-badge list cap.
   */
  priority?: boolean;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

// ============================================================================
// SINGLETON INTERSECTION OBSERVER & 8-BADGE ANIMATION LIMITER FOR LISTS
// ============================================================================
const MAX_ACTIVE_LIST_BADGES = 8;
const visibleListElements = new Set<HTMLElement>();
const activeAnimatedElements = new Set<HTMLElement>();
let sharedObserver: IntersectionObserver | null = null;
let visibilityListenerAttached = false;

function syncDocumentVisibilityClass() {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    document.documentElement.classList.add('tab-hidden');
  } else {
    document.documentElement.classList.remove('tab-hidden');
  }
}

function isReducedMotionOrSmoothMode(): boolean {
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

function rebalanceAnimatedListBadges() {
  if (isReducedMotionOrSmoothMode()) {
    activeAnimatedElements.forEach((el) => el.classList.remove('animated'));
    activeAnimatedElements.clear();
    return;
  }

  // Remove any active elements that are no longer visible
  for (const el of Array.from(activeAnimatedElements)) {
    if (!visibleListElements.has(el) || !el.isConnected) {
      el.classList.remove('animated');
      activeAnimatedElements.delete(el);
    }
  }

  // Promote waiting visible elements up to MAX_ACTIVE_LIST_BADGES (8)
  if (activeAnimatedElements.size < MAX_ACTIVE_LIST_BADGES) {
    for (const el of visibleListElements) {
      if (activeAnimatedElements.size >= MAX_ACTIVE_LIST_BADGES) break;
      if (!activeAnimatedElements.has(el) && el.isConnected) {
        activeAnimatedElements.add(el);
        el.classList.add('animated');
      }
    }
  }
}

function getSharedListBadgeObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  if (!visibilityListenerAttached && typeof document !== 'undefined') {
    visibilityListenerAttached = true;
    syncDocumentVisibilityClass();
    document.addEventListener('visibilitychange', syncDocumentVisibilityClass, { passive: true });
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            visibleListElements.add(target);
          } else {
            visibleListElements.delete(target);
            if (activeAnimatedElements.has(target)) {
              activeAnimatedElements.delete(target);
              target.classList.remove('animated');
            }
          }
        }
        rebalanceAnimatedListBadges();
      },
      {
        root: null,
        rootMargin: '24px 0px',
        threshold: 0.05,
      }
    );
  }
  return sharedObserver;
}

// ============================================================================
// INLINE SVG ICONS (CROWN, PIXEL CROWN, SPARKLE, FLAME, BOLT, GEM, STARS)
// ============================================================================
function CrownSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.8 12.5h12.4l.9-7.2-3.7 2.6L8 3.2 4.6 7.9.9 5.3l.9 7.2zm.7 1.3h11v1.2h-11v-1.2z" />
    </svg>
  );
}

function PixelCrownSvg() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="9" width="10" height="2" />
      <rect x="1" y="4" width="2" height="5" />
      <rect x="3" y="6" width="2" height="3" />
      <rect x="5" y="3" width="2" height="6" />
      <rect x="7" y="6" width="2" height="3" />
      <rect x="9" y="4" width="2" height="5" />
    </svg>
  );
}

function SparkleSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l1.9 4.6L14.5 7.5l-4.6 1.9L8 14l-1.9-4.6L1.5 7.5l4.6-1.9L8 1z" />
    </svg>
  );
}

function FlameSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.7 1.3c.2 2.2-.9 3.6-2 4.8-1.2 1.2-2.2 2.4-2.2 4.3 0 2.5 1.9 4.4 4.4 4.4 2.7 0 4.6-2.1 4.6-4.9 0-2.7-1.6-4.8-3.2-6-.3 1.3-1 2.1-1.8 2.4.4-1.6.5-3.2.2-5z" />
    </svg>
  );
}

function BoltSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M9.5 1L3 9.2h4.4L6.5 15 13 6.8H8.6L9.5 1z" />
    </svg>
  );
}

function GemSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4.2 2h7.6l3.2 4.2L8 14.6 1 6.2 4.2 2zm1.1 1.6L3.2 6h9.6l-2.1-2.4H5.3z" />
    </svg>
  );
}

function StarsSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6.5 1.5l1.1 2.8 2.9 1.1-2.9 1.1-1.1 2.8-1.1-2.8-2.9-1.1 2.9-1.1 1.1-2.8zm6 6.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7z" />
    </svg>
  );
}

function renderDesignIcon(design: ProBadgeDesignId): React.ReactNode {
  switch (design) {
    case 'ember':
    case 'seal':
    case 'crownseal':
      return (
        <span className="pb-badge--icon-svg">
          <CrownSvg />
        </span>
      );
    case 'pixel':
      return (
        <span className="pb-badge--icon-svg">
          <PixelCrownSvg />
        </span>
      );
    case 'sakura':
      return (
        <span className="pb-badge--icon-svg">
          <SparkleSvg />
        </span>
      );
    case 'flame':
      return (
        <span className="pb-badge--icon-svg">
          <FlameSvg />
        </span>
      );
    case 'electric':
      return (
        <span className="pb-badge--icon-svg">
          <BoltSvg />
        </span>
      );
    case 'diamond':
      return (
        <span className="pb-badge--icon-svg">
          <GemSvg />
        </span>
      );
    case 'cosmic':
      return (
        <span className="pb-badge--icon-svg">
          <StarsSvg />
        </span>
      );
    case 'arcade':
      return <span className="pb-arcade-tab" aria-hidden="true" />;
    case 'outline':
      return <span className="pb-outline-dot" aria-hidden="true" />;
    default:
      return null;
  }
}

export const ProBadge: React.FC<ProBadgeProps> = React.memo(function ProBadge({
  design = DEFAULT_PRO_BADGE_DESIGN,
  size = 'sm',
  animated = true,
  listMode,
  priority = false,
  className = '',
  title,
  onClick,
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const safeDesign = normalizeProBadgeDesign(design);
  const isStaticDesign = STATIC_PRO_BADGE_IDS.has(safeDesign);
  const isPixelFont = PIXEL_FONT_PRO_BADGE_IDS.has(safeDesign);

  // Use list observer by default for `sm` and `icon` badges unless `priority` is true
  const shouldObserveInList =
    !isStaticDesign &&
    animated &&
    !priority &&
    (listMode !== undefined ? listMode : size === 'sm' || size === 'icon');

  const animateDirectly =
    !isStaticDesign &&
    animated &&
    !shouldObserveInList &&
    !isReducedMotionOrSmoothMode();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!shouldObserveInList) {
      if (animateDirectly) {
        el.classList.add('animated');
      } else {
        el.classList.remove('animated');
      }
      return;
    }

    const observer = getSharedListBadgeObserver();
    if (!observer) {
      return;
    }

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      visibleListElements.delete(el);
      if (activeAnimatedElements.has(el)) {
        activeAnimatedElements.delete(el);
        el.classList.remove('animated');
        rebalanceAnimatedListBadges();
      }
    };
  }, [shouldObserveInList, animateDirectly, safeDesign]);

  const fontClass = isPixelFont ? 'pb-badge--font-doto' : 'pb-badge--font-space';
  const sizeClass = `pb-badge--${size}`;
  const designClass = `pb-badge--${safeDesign}`;
  const directAnimClass = animateDirectly ? 'animated' : '';

  const iconNode = renderDesignIcon(safeDesign);

  return (
    <span
      ref={ref}
      role="img"
      aria-label="Pro member"
      title={title || 'Boardly Pro Member'}
      data-pro-badge={safeDesign}
      data-pro-badge-size={size}
      onClick={onClick}
      className={`pb-badge dark-surface-preserve ${sizeClass} ${designClass} ${fontClass} ${directAnimClass} ${className}`.trim()}
    >
      {safeDesign === 'split' ? (
        size === 'icon' ? (
          <span className="pb-badge--icon-svg">
            <CrownSvg />
          </span>
        ) : (
          <>
            <span className="pb-split-crown">
              <span className="pb-badge--icon-svg">
                <CrownSvg />
              </span>
            </span>
            <span className="pb-badge--text pb-split-label">PRO</span>
          </>
        )
      ) : size === 'icon' ? (
        iconNode || <span className="pb-badge--text">P</span>
      ) : (
        <>
          {iconNode}
          <span className="pb-badge--text">PRO</span>
        </>
      )}
    </span>
  );
});

export default ProBadge;
