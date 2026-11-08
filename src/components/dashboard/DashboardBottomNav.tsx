import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
  lazy,
  Suspense,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Bell,
  MessageCircle,
  Users,
  Menu,
  Compass,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { getHomeUrl, isUserAuthenticated } from '@/utils/homeUrl';

const LazyHamburgerMenuSheet = lazy(() =>
  import('./HamburgerMenuSheet').then((m) => ({ default: m.HamburgerMenuSheet }))
);

interface DockTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  end?: boolean;
  onClick?: () => void;
  badge?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function DashboardBottomNavComponent() {
  const { user, profile } = useUserProfile();
  const { profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { isOpen: isProfileModalOpen } = useProfileModal();
  const unreadCount = useUnreadNotificationsCount();
  const unreadMessagesCount = useUnreadMessagesCount();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasOpenedMenu, setHasOpenedMenu] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  // Auto-close drawer on any route change so state never gets stuck or re-triggered
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Detect any open full-screen modal across the app and hide the bottom navigation
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkModalState = () => {
      if (
        document.body.getAttribute('data-fullscreen-modal-open') === 'true' ||
        document.body.style.overflow === 'hidden'
      ) {
        setIsExternalModalOpen(true);
        return;
      }
      const overlays = document.querySelectorAll<HTMLElement>(
        '[data-fullscreen-modal="true"], [role="dialog"], [aria-modal="true"], .fixed.inset-0'
      );
      const hasActiveModal = Array.from(overlays).some((el) => {
        if (
          el.classList.contains('pointer-events-none') ||
          el.classList.contains('-z-10') ||
          el.getAttribute('aria-hidden') === 'true'
        ) {
          return false;
        }
        return true;
      });
      setIsExternalModalOpen(hasActiveModal);
    };

    checkModalState();

    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-fullscreen-modal-open'],
      childList: true,
      subtree: true,
    });

    window.addEventListener('boardly:modal-change', checkModalState);
    return () => {
      observer.disconnect();
      window.removeEventListener('boardly:modal-change', checkModalState);
    };
  }, [location.pathname]);

  const shouldHideBottomNav = isMenuOpen || isProfileModalOpen || isExternalModalOpen;

  const role = profile?.role || 'student';
  const isApprovedCaptain =
    role === 'captain' ||
    role === 'ambassador' ||
    Boolean(profile?.isCaptain) ||
    Boolean(profile?.isAmbassador);
  const crewLink = isAuthenticated ? '/dashboard/crew' : '/crew';
  const commonsLink =
    !isAuthenticated || location.pathname.startsWith('/commons')
      ? '/commons'
      : '/dashboard/commons';

  // Unified 7-Tab Student Nav: Commons, Home, Notifications, Messages, Streaks, Squad, Menu
  const navItems: DockTabItem[] = useMemo(
    () => [
      {
        id: 'commons',
        to: commonsLink,
        label: 'Commons',
        icon: <Compass size={18} strokeWidth={2} />,
      },
      {
        id: 'home',
        to: isAuthenticated ? '/dashboard' : homeUrl,
        label: 'Home',
        icon: <LayoutDashboard size={18} strokeWidth={2} />,
        end: true,
      },
      isAuthenticated
        ? {
            id: 'notifications',
            to: '/dashboard/notifications',
            label: 'Notifications',
            icon: <Bell size={18} strokeWidth={2} />,
            badge: unreadCount > 0 ? unreadCount : undefined,
          }
        : {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell size={18} strokeWidth={2} />,
            onClick: () => requireAuth('view your notifications'),
          },
      isAuthenticated
        ? {
            id: 'messages',
            to: '/dashboard/messages',
            label: 'Messages',
            icon: <MessageCircle size={18} strokeWidth={2} />,
            badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          }
        : {
            id: 'messages',
            label: 'Messages',
            icon: <MessageCircle size={18} strokeWidth={2} />,
            onClick: () => requireAuth('view your messages'),
          },
      isAuthenticated
        ? {
            id: 'streaks',
            to: '/dashboard/streaks',
            label: 'Streaks',
            icon: <Flame size={18} strokeWidth={2} />,
          }
        : {
            id: 'streaks',
            label: 'Streaks',
            icon: <Flame size={18} strokeWidth={2} />,
            onClick: () => requireAuth('track your daily study streaks'),
          },
      {
        id: 'crew',
        to: crewLink,
        label: 'Squad',
        icon: <Users size={18} strokeWidth={2} />,
      },
      {
        id: 'menu',
        label: 'Menu',
        icon: <Menu size={18} strokeWidth={2} />,
        onClick: () => {
          setHasOpenedMenu(true);
          setIsMenuOpen(true);
        },
      },
    ],
    [isAuthenticated, homeUrl, commonsLink, unreadCount, unreadMessagesCount, crewLink, requireAuth]
  );

  // Determine active tab from current route / state
  const activeTabId = useMemo(() => {
    const p = location.pathname;
    if (
      isMenuOpen ||
      p.startsWith('/store') ||
      p === '/contact' ||
      (isApprovedCaptain &&
        (p.startsWith('/dashboard/captain') || p.startsWith('/dashboard/ambassador')))
    ) {
      return 'menu';
    }
    if (p.startsWith('/dashboard/crew') || p.startsWith('/crew')) {
      return 'crew';
    }
    if (p.startsWith('/dashboard/streaks')) {
      return 'streaks';
    }
    if (p.startsWith('/dashboard/messages') || p === '/messages') {
      return 'messages';
    }
    if (p.startsWith('/dashboard/notifications') || p === '/notifications') {
      return 'notifications';
    }
    if (
      p.startsWith('/dashboard/commons') ||
      p.startsWith('/commons') ||
      p === '/saved'
    ) {
      return 'commons';
    }
    return 'home';
  }, [location.pathname, isMenuOpen, isApprovedCaptain]);

  const dockRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [metrics, setMetrics] = useState<{ x: number; width: number }>({
    x: 7,
    width: 0,
  });
  const [isInstant, setIsInstant] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);
  const [dragHighlightId, setDragHighlightId] = useState<string | null>(null);

  const prevTabCountRef = useRef<number>(navItems.length);
  const hasMountedRef = useRef<boolean>(false);
  const relaxTimerRef = useRef<number | null>(null);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    initialBubbleX: number;
    bubbleWidth: number;
    minX: number;
    maxX: number;
    moved: boolean;
    lastClientX: number;
    lastTime: number;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    initialBubbleX: 7,
    bubbleWidth: 0,
    minX: 7,
    maxX: 7,
    moved: false,
    lastClientX: 0,
    lastTime: 0,
  });

  const measureTab = useCallback((tabId: string) => {
    const dockEl = dockRef.current;
    const btnEl = btnRefs.current[tabId];
    if (!dockEl || !btnEl) return null;
    const dockRect = dockEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    if (btnRect.width <= 0) return null;
    return {
      x: Math.round(btnRect.left - dockRect.left),
      width: Math.round(btnRect.width),
    };
  }, []);

  // Place bubble on page load, route changes, or visible tab count changes
  useLayoutEffect(() => {
    if (dragRef.current.active) return;
    const m = measureTab(activeTabId);
    if (!m) return;

    const tabCountChanged = prevTabCountRef.current !== navItems.length;
    prevTabCountRef.current = navItems.length;

    if (!hasMountedRef.current || tabCountChanged || prefersReducedMotion()) {
      setIsInstant(true);
      setMetrics(m);
      hasMountedRef.current = true;
    } else {
      setIsInstant(false);
      setMetrics(m);
    }
  }, [activeTabId, navItems.length, measureTab]);

  // Reposition with no animation on window resize / dock resize
  useEffect(() => {
    const handleResize = () => {
      if (dragRef.current.active) return;
      const m = measureTab(activeTabId);
      if (m) {
        setIsInstant(true);
        setMetrics(m);
      }
    };

    window.addEventListener('resize', handleResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && dockRef.current) {
      ro = new ResizeObserver(handleResize);
      ro.observe(dockRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [activeTabId, measureTab]);

  useEffect(() => {
    return () => {
      if (relaxTimerRef.current !== null) {
        window.clearTimeout(relaxTimerRef.current);
      }
    };
  }, []);

  const resetBubbleStretch = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.setProperty('--sdn-sx', '1.32');
    bubble.style.setProperty('--sdn-sy', '1.5');
  }, []);

  const triggerWobble = useCallback(() => {
    if (prefersReducedMotion()) return;
    setIsWobbling(false);
    requestAnimationFrame(() => {
      setIsWobbling(true);
    });
  }, []);

  const findNearestTab = useCallback(
    (centerX: number): DockTabItem => {
      const dockEl = dockRef.current;
      const fallback = navItems.find((i) => i.id === activeTabId) || navItems[0];
      if (!dockEl) return fallback;
      const dockRect = dockEl.getBoundingClientRect();
      let best = fallback;
      let bestDist = Infinity;

      for (const item of navItems) {
        const btn = btnRefs.current[item.id];
        if (!btn) continue;
        const r = btn.getBoundingClientRect();
        const c = r.left - dockRect.left + r.width / 2;
        const d = Math.abs(centerX - c);
        if (d < bestDist) {
          bestDist = d;
          best = item;
        }
      }
      return best;
    },
    [navItems, activeTabId]
  );

  const navigateToTab = useCallback(
    (item: DockTabItem) => {
      const m = measureTab(item.id);
      if (m) {
        setIsInstant(prefersReducedMotion());
        setMetrics(m);
      }
      triggerWobble();

      if (item.onClick) {
        item.onClick();
      } else if (item.to) {
        if (location.pathname !== item.to) {
          navigate(item.to);
        }
      }
    },
    [measureTab, triggerWobble, location.pathname, navigate]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const currentM = measureTab(activeTabId) || metrics;
    const dockWidth = dockEl.clientWidth;
    const minX = 7;
    const maxX = Math.max(minX, dockWidth - currentM.width - 7);
    const now = performance.now();

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      initialBubbleX: currentM.x,
      bubbleWidth: currentM.width,
      minX,
      maxX,
      moved: false,
      lastClientX: e.clientX,
      lastTime: now,
    };

    setIsInstant(false);
    setIsWobbling(false);
    resetBubbleStretch();
    setIsPressed(true);
    setDragHighlightId(activeTabId);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture errors
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const dx = e.clientX - ds.startClientX;
    if (Math.abs(dx) > 4) {
      ds.moved = true;
      if (!isDragging) setIsDragging(true);
    }

    if (ds.moved) {
      const now = performance.now();
      const dt = Math.max(8, now - ds.lastTime);
      const vx = Math.abs(e.clientX - ds.lastClientX) / dt;
      ds.lastClientX = e.clientX;
      ds.lastTime = now;

      if (!prefersReducedMotion() && bubbleRef.current) {
        const extraX = Math.min(0.3, vx * 0.18);
        const sx = (1.32 + extraX).toFixed(3);
        const sy = (1.5 - extraX * 0.2).toFixed(3);
        bubbleRef.current.style.setProperty('--sdn-sx', sx);
        bubbleRef.current.style.setProperty('--sdn-sy', sy);

        if (relaxTimerRef.current !== null) {
          window.clearTimeout(relaxTimerRef.current);
        }
        relaxTimerRef.current = window.setTimeout(() => {
          resetBubbleStretch();
        }, 90);
      }

      const clampedX = Math.min(ds.maxX, Math.max(ds.minX, ds.initialBubbleX + dx));
      setMetrics({ x: clampedX, width: ds.bubbleWidth });

      const underBubble = findNearestTab(clampedX + ds.bubbleWidth / 2);
      setDragHighlightId(underBubble.id);
    }
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLElement>) => {
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    ds.active = false;
    ds.pointerId = null;

    if (relaxTimerRef.current !== null) {
      window.clearTimeout(relaxTimerRef.current);
      relaxTimerRef.current = null;
    }

    setIsPressed(false);
    setIsDragging(false);
    setDragHighlightId(null);
    resetBubbleStretch();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore pointer capture errors
    }

    const dockEl = dockRef.current;
    let targetItem = navItems.find((i) => i.id === activeTabId) || navItems[0];

    if (ds.moved) {
      const dx = e.clientX - ds.startClientX;
      const finalX = Math.min(ds.maxX, Math.max(ds.minX, ds.initialBubbleX + dx));
      targetItem = findNearestTab(finalX + ds.bubbleWidth / 2);
    } else if (dockEl) {
      const dockRect = dockEl.getBoundingClientRect();
      const clickX = e.clientX - dockRect.left;
      targetItem = findNearestTab(clickX);
    }

    navigateToTab(targetItem);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number, item: DockTabItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToTab(item);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const nextIdx = (index + dir + navItems.length) % navItems.length;
      const nextItem = navItems[nextIdx];
      btnRefs.current[nextItem.id]?.focus();
    }
  };

  const highlightedId = isDragging && dragHighlightId ? dragHighlightId : activeTabId;

  return (
    <>
      {/* ─── FIXED UNIFIED PILL BOTTOM NAVIGATION ────────────────────────────── */}
      <div
        className={`fixed bottom-[calc(14px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[336px] z-40 ${
          shouldHideBottomNav
            ? 'opacity-0 pointer-events-none invisible'
            : 'pointer-events-auto'
        }`}
        aria-label="Student Navigation Bar"
        aria-hidden={shouldHideBottomNav}
      >
        <nav
          ref={dockRef}
          role="tablist"
          aria-label="Student Dashboard Navigation"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerInteraction}
          onPointerCancel={finishPointerInteraction}
          className="sdn-dock"
        >
          {/* Single sliding & stretching red glass bubble behind icons */}
          <div
            ref={bubbleRef}
            aria-hidden="true"
            onAnimationEnd={() => setIsWobbling(false)}
            className={`sdn-bubble ${isInstant ? 'is-instant' : ''} ${
              isDragging ? 'is-dragging' : ''
            } ${isPressed ? 'is-pressed' : ''} ${isWobbling ? 'is-wobbling' : ''}`}
            style={{
              width:
                metrics.width > 0
                  ? `${metrics.width}px`
                  : `calc((100% - 14px) / ${navItems.length})`,
              translate: `${metrics.x}px 0`,
            }}
          />

          {navItems.map((item, index) => {
            const isHighlighted = item.id === highlightedId;
            const isSelected = item.id === activeTabId;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  btnRefs.current[item.id] = el;
                }}
                type="button"
                role="tab"
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={item.label}
                title={item.label}
                onKeyDown={(e) => handleKeyDown(e, index, item)}
                onClick={(e) => {
                  // Keyboard-initiated click (detail === 0) is handled if not already handled by pointerup
                  if (e.detail === 0) {
                    navigateToTab(item);
                  }
                }}
                className={`sdn-tab-btn ${isHighlighted ? 'is-active' : ''}`}
              >
                <span className="shrink-0 flex items-center justify-center relative">
                  {item.icon}
                  {Boolean(item.badge) && (
                    <span
                      className={`absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm ${
                        isHighlighted
                          ? 'bg-white text-[#e11d2e] border border-black/20'
                          : 'bg-[#e11d2e] text-white border border-black'
                      }`}
                    >
                      {Number(item.badge) > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="sr-only">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── REDESIGNED BOARDLY HAMBURGER MENU BOTTOM SHEET ───────────────── */}
      {(hasOpenedMenu || isMenuOpen) && (
        <Suspense fallback={null}>
          <LazyHamburgerMenuSheet
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent);
export default DashboardBottomNav;
