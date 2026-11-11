import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
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
import { useSmoothMode } from '@/utils/smoothMode';
import { HamburgerMenuSheet } from './HamburgerMenuSheet';

interface DockTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  end?: boolean;
  onClick?: () => void;
  badge?: number;
  hidden?: boolean;
}

interface BubblePosition {
  left: number;
  width: number;
  dockWidth: number;
}

const BUBBLE_LENS_WIDTH = 64;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isLowEndHardware(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 8;
  return mem <= 4 || cores <= 4;
}

function isTabElementVisible(el: HTMLButtonElement | null): el is HTMLButtonElement {
  if (!el) return false;
  if (el.hidden) return false;
  if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function DashboardBottomNavComponent() {
  const { user, profile } = useUserProfile();
  const { profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { isOpen: isProfileModalOpen } = useProfileModal();
  const unreadCount = useUnreadNotificationsCount();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { smoothMode: isSmoothMode } = useSmoothMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const lowEndDevice = useMemo(() => isLowEndHardware(), []);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  // Auto-close menu page on any route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Detect any open full-screen external modal across the app and hide the bottom navigation
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let rafId: number | null = null;

    const runModalCheck = () => {
      rafId = null;
      if (document.body.getAttribute('data-hamburger-sheet-open') === 'true') {
        setIsExternalModalOpen((prev) => (prev ? false : prev));
        return;
      }
      if (
        document.body.getAttribute('data-fullscreen-modal-open') === 'true' ||
        document.body.getAttribute('data-pro-checkout-open') === 'true'
      ) {
        setIsExternalModalOpen((prev) => (prev ? prev : true));
        return;
      }
      const overlays = document.querySelectorAll<HTMLElement>(
        '[data-fullscreen-modal="true"], [role="dialog"], [aria-modal="true"]'
      );
      const hasActiveModal = Array.from(overlays).some((el) => {
        if (
          el.getAttribute('data-hamburger-sheet') === 'true' ||
          el.classList.contains('pointer-events-none') ||
          el.classList.contains('-z-10') ||
          el.getAttribute('aria-hidden') === 'true'
        ) {
          return false;
        }
        return true;
      });
      setIsExternalModalOpen((prev) => (prev === hasActiveModal ? prev : hasActiveModal));
    };

    const scheduleModalCheck = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(runModalCheck);
    };

    runModalCheck();

    const observer = new MutationObserver(scheduleModalCheck);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'data-fullscreen-modal-open',
        'data-pro-checkout-open',
        'data-hamburger-sheet-open',
      ],
      childList: true,
      subtree: false,
    });

    window.addEventListener('boardly:modal-change', scheduleModalCheck);
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      window.removeEventListener('boardly:modal-change', scheduleModalCheck);
    };
  }, [location.pathname]);

  const shouldHideBottomNav = isProfileModalOpen || isExternalModalOpen || isMenuOpen;

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
        icon: <Compass strokeWidth={2} />,
      },
      {
        id: 'home',
        to: isAuthenticated ? '/dashboard' : homeUrl,
        label: 'Home',
        icon: <LayoutDashboard strokeWidth={2} />,
        end: true,
      },
      isAuthenticated
        ? {
            id: 'notifications',
            to: '/dashboard/notifications',
            label: 'Notifications',
            icon: <Bell strokeWidth={2} />,
            badge: unreadCount > 0 ? unreadCount : undefined,
          }
        : {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell strokeWidth={2} />,
            onClick: () => requireAuth('view your notifications'),
          },
      isAuthenticated
        ? {
            id: 'messages',
            to: '/dashboard/messages',
            label: 'Messages',
            icon: <MessageCircle strokeWidth={2} />,
            badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          }
        : {
            id: 'messages',
            label: 'Messages',
            icon: <MessageCircle strokeWidth={2} />,
            onClick: () => requireAuth('view your messages'),
          },
      isAuthenticated
        ? {
            id: 'streaks',
            to: '/dashboard/streaks',
            label: 'Streaks',
            icon: <Flame strokeWidth={2} />,
          }
        : {
            id: 'streaks',
            label: 'Streaks',
            icon: <Flame strokeWidth={2} />,
            onClick: () => requireAuth('track your daily study streaks'),
          },
      {
        id: 'crew',
        to: crewLink,
        label: 'Squad',
        icon: <Users strokeWidth={2} />,
      },
      {
        id: 'menu',
        label: 'Menu',
        icon: <Menu strokeWidth={2} />,
        onClick: () => {
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

  const [pos, setPos] = useState<BubblePosition>({
    left: 6,
    width: BUBBLE_LENS_WIDTH,
    dockWidth: 0,
  });
  const posRef = useRef<BubblePosition>(pos);
  posRef.current = pos;

  const [isInstant, setIsInstant] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHighlightId, setDragHighlightId] = useState<string | null>(null);

  const prevVisibleCountRef = useRef<number>(0);
  const prevActiveTabIdRef = useRef<string>(activeTabId);
  const hasMountedRef = useRef<boolean>(false);
  const moveTimerRef = useRef<number | null>(null);
  const justHandledTabRef = useRef<string | null>(null);
  const lastPointerNavTimeRef = useRef<number>(0);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    captured: boolean;
    startClientX: number;
    initialLeft: number;
    bubbleWidth: number;
    dockWidth: number;
    minLeft: number;
    maxLeft: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    captured: false,
    startClientX: 0,
    initialLeft: 6,
    bubbleWidth: BUBBLE_LENS_WIDTH,
    dockWidth: 0,
    minLeft: 0,
    maxLeft: 0,
    moved: false,
  });

  const getVisibleTabs = useCallback((): DockTabItem[] => {
    return navItems.filter(
      (item) => !item.hidden && isTabElementVisible(btnRefs.current[item.id] ?? null)
    );
  }, [navItems]);

  const measureTab = useCallback((tabId: string): BubblePosition | null => {
    const dockEl = dockRef.current;
    const btnEl = btnRefs.current[tabId] ?? null;
    if (!dockEl || !isTabElementVisible(btnEl)) return null;
    const dockRect = dockEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    if (btnRect.width <= 0 || dockRect.width <= 0) return null;

    const dockWidth = Math.round(dockRect.width);
    const lensWidth = BUBBLE_LENS_WIDTH;
    const tabCenter = btnRect.left - dockRect.left + btnRect.width / 2;
    const rawLeft = Math.round(tabCenter - lensWidth / 2);
    const minLeft = 6;
    const maxLeft = Math.max(minLeft, dockWidth - lensWidth - 6);
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

    return {
      left: clampedLeft,
      width: lensWidth,
      dockWidth,
    };
  }, []);

  const triggerLiquidMove = useCallback(() => {
    if (prefersReducedMotion()) {
      setIsMoving(false);
      return;
    }
    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }
    setIsMoving(true);
    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;
    }, 350);
  }, []);

  const animateBubbleToTab = useCallback(
    (targetTabId: string, forceInstant = false) => {
      const m = measureTab(targetTabId);
      if (!m) return;

      const reduced = prefersReducedMotion() || forceInstant;
      const prev = posRef.current;

      if (reduced || prev.dockWidth <= 0) {
        if (moveTimerRef.current !== null) {
          window.clearTimeout(moveTimerRef.current);
          moveTimerRef.current = null;
        }
        setIsInstant(true);
        setIsMoving(false);
        setPos(m);
        posRef.current = m;
        return;
      }

      setIsInstant(false);
      if (Math.abs(m.left - prev.left) > 2) {
        triggerLiquidMove();
      }
      setPos(m);
      posRef.current = m;
    },
    [measureTab, triggerLiquidMove]
  );

  // Place bubble on initial load, route changes, or visible tab count changes
  useLayoutEffect(() => {
    if (dragRef.current.active) return;

    const visibleTabs = getVisibleTabs();
    const visibleCount = visibleTabs.length;
    const tabCountChanged =
      prevVisibleCountRef.current !== 0 && prevVisibleCountRef.current !== visibleCount;
    prevVisibleCountRef.current = visibleCount;

    if (!hasMountedRef.current || tabCountChanged || prefersReducedMotion()) {
      const m = measureTab(activeTabId);
      if (m) {
        setIsInstant(true);
        setIsMoving(false);
        setPos(m);
        posRef.current = m;
        hasMountedRef.current = true;
      }
      prevActiveTabIdRef.current = activeTabId;
      justHandledTabRef.current = null;
      return;
    }

    if (justHandledTabRef.current === activeTabId) {
      justHandledTabRef.current = null;
      prevActiveTabIdRef.current = activeTabId;
      return;
    }

    animateBubbleToTab(activeTabId, false);
    prevActiveTabIdRef.current = activeTabId;
  }, [activeTabId, navItems.length, measureTab, getVisibleTabs, animateBubbleToTab]);

  // Reposition with no animation on window resize / dock resize
  useEffect(() => {
    const handleResize = () => {
      if (dragRef.current.active) return;
      const m = measureTab(activeTabId);
      if (m) {
        if (moveTimerRef.current !== null) {
          window.clearTimeout(moveTimerRef.current);
          moveTimerRef.current = null;
        }
        setIsInstant(true);
        setIsMoving(false);
        setPos(m);
        posRef.current = m;
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
      if (moveTimerRef.current !== null) {
        window.clearTimeout(moveTimerRef.current);
      }
    };
  }, []);

  const findNearestVisibleTab = useCallback(
    (centerX: number): DockTabItem => {
      const dockEl = dockRef.current;
      const visible = getVisibleTabs();
      const pool = visible.length > 0 ? visible : navItems;
      const fallback = pool.find((i) => i.id === activeTabId) || pool[0];
      if (!dockEl) return fallback;
      const dockRect = dockEl.getBoundingClientRect();
      let best = fallback;
      let bestDist = Infinity;

      for (const item of pool) {
        const btn = btnRefs.current[item.id];
        if (!btn) continue;
        const r = btn.getBoundingClientRect();
        if (r.width <= 0) continue;
        const c = r.left - dockRect.left + r.width / 2;
        const d = Math.abs(centerX - c);
        if (d < bestDist) {
          bestDist = d;
          best = item;
        }
      }
      return best;
    },
    [getVisibleTabs, navItems, activeTabId]
  );

  const findTabAtPoint = useCallback(
    (clientX: number, clientY: number): DockTabItem | null => {
      const visible = getVisibleTabs();
      const pool = visible.length > 0 ? visible : navItems;
      for (const item of pool) {
        const btn = btnRefs.current[item.id];
        if (!btn) continue;
        const r = btn.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        if (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top - 12 &&
          clientY <= r.bottom + 12
        ) {
          return item;
        }
      }
      return null;
    },
    [getVisibleTabs, navItems]
  );

  const navigateToTab = useCallback(
    (item: DockTabItem) => {
      justHandledTabRef.current = item.id;
      animateBubbleToTab(item.id, false);
      prevActiveTabIdRef.current = item.id;

      if (item.onClick) {
        item.onClick();
      } else if (item.to) {
        if (location.pathname !== item.to) {
          navigate(item.to);
        }
      }
    },
    [animateBubbleToTab, location.pathname, navigate]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const currentM = measureTab(activeTabId) || posRef.current;
    const dockRect = dockEl.getBoundingClientRect();
    const dockWidth = Math.round(dockRect.width);
    const bubbleWidth = BUBBLE_LENS_WIDTH;
    const minLeft = 6;
    const maxLeft = Math.max(minLeft, dockWidth - bubbleWidth - 6);
    const clampedLeft = Math.min(maxLeft, Math.max(minLeft, currentM.left));

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      captured: false,
      startClientX: e.clientX,
      initialLeft: clampedLeft,
      bubbleWidth,
      dockWidth,
      minLeft,
      maxLeft,
      moved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current.captured = true;
    } catch {
      // ignore pointer capture errors
    }

    // Lift bubble to 1.35x while pressing or dragging on the nav
    setIsPressed(true);
    setIsInstant(false);
    setDragHighlightId(activeTabId);

    // If user presses directly on another tab, preview bubble sliding toward that tab while held
    const pressedTab = findTabAtPoint(e.clientX, e.clientY);
    if (pressedTab && pressedTab.id !== activeTabId) {
      setDragHighlightId(pressedTab.id);
      const targetPos = measureTab(pressedTab.id);
      if (targetPos) {
        triggerLiquidMove();
        setPos(targetPos);
        posRef.current = targetPos;
        dragRef.current.initialLeft = targetPos.left;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const dx = e.clientX - ds.startClientX;

    if (!ds.moved && Math.abs(dx) > 4) {
      ds.moved = true;
      setIsDragging(true);
    }

    if (ds.moved) {
      const dockEl = dockRef.current;
      let nextLeft = Math.round(ds.initialLeft + dx);
      if (dockEl) {
        const dockRect = dockEl.getBoundingClientRect();
        const pointerLocalX = e.clientX - dockRect.left;
        nextLeft = Math.round(pointerLocalX - ds.bubbleWidth / 2);
      }
      const clampedLeft = Math.min(ds.maxLeft, Math.max(ds.minLeft, nextLeft));
      const nextPos: BubblePosition = {
        left: clampedLeft,
        width: ds.bubbleWidth,
        dockWidth: ds.dockWidth,
      };
      setPos(nextPos);
      posRef.current = nextPos;

      const underBubble = findNearestVisibleTab(clampedLeft + ds.bubbleWidth / 2);
      setDragHighlightId(underBubble.id);
    }
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const wasMoved = ds.moved;
    const wasCaptured = ds.captured;
    ds.active = false;
    ds.pointerId = null;
    ds.captured = false;
    ds.moved = false;

    setIsPressed(false);
    setIsDragging(false);
    setDragHighlightId(null);

    if (wasCaptured) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore pointer capture errors
      }
    }

    if (e.type === 'pointercancel') {
      animateBubbleToTab(activeTabId, false);
      return;
    }

    if (wasMoved) {
      const currentCenter = posRef.current.left + ds.bubbleWidth / 2;
      const targetItem = findNearestVisibleTab(currentCenter);
      lastPointerNavTimeRef.current = performance.now();
      navigateToTab(targetItem);
      return;
    }

    if (e.type === 'pointerup') {
      const tappedTab = findTabAtPoint(e.clientX, e.clientY);
      if (tappedTab) {
        lastPointerNavTimeRef.current = performance.now();
        navigateToTab(tappedTab);
      } else {
        animateBubbleToTab(activeTabId, false);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    item: DockTabItem
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
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

  const highlightedId =
    (isDragging || isPressed) && dragHighlightId ? dragHighlightId : activeTabId;

  const activeIdx = Math.max(0, navItems.findIndex((i) => i.id === activeTabId));
  const fallbackLeft = `calc(((100% / ${navItems.length}) * ${activeIdx + 0.5}) - ${BUBBLE_LENS_WIDTH / 2}px)`;

  const stopNavPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // Dock wrapper (position: fixed, no filter) contains THREE SIBLINGS, never nested:
  // (a) .plate  (b) .g > .gi  (c) .tabs
  const navBarElement = (
    <nav
      ref={dockRef}
      data-bottom-nav-container="true"
      role="tablist"
      aria-label="Student Dashboard Navigation"
      aria-hidden={shouldHideBottomNav}
      onClick={stopNavPropagation}
      onMouseDown={stopNavPropagation}
      onTouchStart={stopNavPropagation}
      onTouchEnd={stopNavPropagation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerInteraction}
      onPointerCancel={finishPointerInteraction}
      className={`sdn-dock ${isPressed || isDragging ? 'is-pressed' : ''} ${
        lowEndDevice || isSmoothMode ? 'low-fx' : ''
      } ${
        shouldHideBottomNav ? 'pointer-events-none invisible hidden' : 'pointer-events-auto'
      }`}
    >
      {/* (a) .plate: absolute, inset 0, fully rounded, the dock's liquid glass */}
      <div className="plate dark-surface-preserve" aria-hidden="true" />

      {/* (b) .g: 52px tall x 64px wide resting flat inside the 64px pill; scales to 1.35x when pressed or dragging */}
      <div
        ref={bubbleRef}
        aria-hidden="true"
        className={`g ${isInstant ? 'is-instant' : ''} ${
          isDragging ? 'is-dragging' : ''
        } ${isMoving ? 'is-moving' : ''} ${isPressed ? 'is-pressed out' : ''}`}
        style={{
          left: pos.dockWidth > 0 ? `${pos.left}px` : fallbackLeft,
          width: `${pos.width || BUBBLE_LENS_WIDTH}px`,
        }}
      >
        <div className={`gi dark-surface-preserve ${isPressed || isDragging ? 'out' : ''}`} />
      </div>

      {/* (c) .tabs: the buttons, position relative, z-index above .g */}
      <div className="tabs">
        {navItems.map((item, index) => {
          const isHighlighted = item.id === highlightedId;
          const isSelected = item.id === activeTabId;

          return (
            <button
              key={item.id}
              data-nav-tab={item.id}
              ref={(el) => {
                btnRefs.current[item.id] = el;
              }}
              type="button"
              role="tab"
              tabIndex={0}
              hidden={item.hidden}
              aria-selected={isSelected}
              aria-label={item.label}
              title={item.label}
              onKeyDown={(e) => handleKeyDown(e, index, item)}
              onTouchStart={stopNavPropagation}
              onTouchEnd={stopNavPropagation}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (performance.now() - lastPointerNavTimeRef.current < 450) {
                  return;
                }
                navigateToTab(item);
              }}
              className={`sdn-tab-btn pointer-events-auto ${isHighlighted ? 'is-active' : ''} ${
                item.hidden ? 'is-hidden' : ''
              }`}
            >
              <span className="shrink-0 flex items-center justify-center relative pointer-events-none">
                {item.icon}
                {Boolean(item.badge) && (
                  <span className="sdn-tab-badge absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {Number(item.badge) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {typeof document !== 'undefined'
        ? createPortal(navBarElement, document.body)
        : navBarElement}

      {/* ─── FULL-SCREEN MENU PAGE (SLIDES IN FROM RIGHT) ───────────────── */}
      <HamburgerMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent);
export default DashboardBottomNav;
