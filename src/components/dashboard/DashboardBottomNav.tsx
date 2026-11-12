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
  MessageCircle,
  Users,
  Menu,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { getHomeUrl, isUserAuthenticated } from '@/utils/homeUrl';
import { useSmoothMode } from '@/utils/smoothMode';
import { prefetchTabRouteAndData } from '@/lib/swrCache';
import {
  BOTTOM_NAV_TAB_INDEX,
  markNavTapStart,
  recordNavFirstPaint,
  setNavMenuOpen,
  setOptimisticNavTab,
  syncNavRouteFromRouter,
  useNavStore,
  type BottomNavTabId,
} from '@/lib/navStore';
import { HamburgerMenuSheet } from './HamburgerMenuSheet';

interface DockTabItem {
  id: BottomNavTabId;
  label: string;
  icon: React.ReactNode;
  to?: string;
  end?: boolean;
  onClick?: () => void;
  badge?: number;
  hidden?: boolean;
}

interface CachedDockMetrics {
  dockLeft: number;
  dockTop: number;
  dockWidth: number;
  dockHeight: number;
  pad: number;
  gap: number;
  slotWidth: number;
  slotOffsets: number[];
}

const TAB_COUNT = 6;

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

function computeMetricsFromRect(rect: DOMRect): CachedDockMetrics {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const pad = isDesktop ? 8 : 6;
  const gap = isDesktop ? 6 : 2;
  const dockWidth = Math.max(240, Math.round(rect.width));
  const dockHeight = Math.max(52, Math.round(rect.height));
  const rawSlotWidth = (dockWidth - pad * 2 - gap * (TAB_COUNT - 1)) / TAB_COUNT;
  const slotWidth = Math.max(40, Math.round(rawSlotWidth));
  const slotOffsets: number[] = [];
  for (let i = 0; i < TAB_COUNT; i++) {
    slotOffsets.push(Math.round(pad + i * (rawSlotWidth + gap)));
  }
  return {
    dockLeft: rect.left,
    dockTop: rect.top,
    dockWidth,
    dockHeight,
    pad,
    gap,
    slotWidth,
    slotOffsets,
  };
}

function DashboardBottomNavComponent() {
  const { user, profile, profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { isOpen: isProfileModalOpen } = useProfileModal();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { smoothMode: isSmoothMode } = useSmoothMode();
  const location = useLocation();
  const navigate = useNavigate();

  const navState = useNavStore();
  const activeTabId = navState.activeTabId;
  const isMenuOpen = navState.isMenuOpen;

  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const lowEndDevice = useMemo(() => isLowEndHardware(), []);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  const role = profile?.role || 'student';
  const isApprovedCaptain =
    role === 'captain' ||
    role === 'ambassador' ||
    Boolean(profile?.isCaptain) ||
    Boolean(profile?.isAmbassador);

  // Sync lightweight route store when React Router location changes and record first paint
  useLayoutEffect(() => {
    syncNavRouteFromRouter(location.pathname, isApprovedCaptain);
    recordNavFirstPaint(location.pathname);
  }, [location.pathname, isApprovedCaptain]);

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

  const isSettingsScreen =
    location.pathname === '/settings' ||
    location.pathname.startsWith('/settings/') ||
    location.pathname === '/dashboard/settings' ||
    location.pathname.startsWith('/dashboard/settings/');

  const shouldHideBottomNav =
    isSettingsScreen || isProfileModalOpen || isExternalModalOpen || isMenuOpen;

  // Keep authenticated users inside /dashboard/* routes so DashboardShell stays mounted and KeepAlive tabs swap in 0ms
  const crewLink = isAuthenticated ? '/dashboard/crew' : '/crew';
  const commonsLink = isAuthenticated ? '/dashboard/commons' : '/commons';

  // Unified 6-Tab Student Nav: Commons (compass), Dashboard (grid), Messages (chat), Streak (flame), Friends (community), Menu (hamburger)
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
        label: 'Dashboard',
        icon: <LayoutDashboard strokeWidth={2} />,
        end: true,
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
            label: 'Streak',
            icon: <Flame strokeWidth={2} />,
          }
        : {
            id: 'streaks',
            label: 'Streak',
            icon: <Flame strokeWidth={2} />,
            onClick: () => requireAuth('track your daily study streaks'),
          },
      {
        id: 'crew',
        to: crewLink,
        label: 'Friends',
        icon: <Users strokeWidth={2} />,
      },
      {
        id: 'menu',
        label: 'Menu',
        icon: <Menu strokeWidth={2} />,
        onClick: () => {
          setNavMenuOpen(true, isApprovedCaptain);
          recordNavFirstPaint('menu');
        },
      },
    ],
    [
      isAuthenticated,
      homeUrl,
      commonsLink,
      unreadMessagesCount,
      crewLink,
      requireAuth,
      isApprovedCaptain,
    ]
  );

  const dockRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Cached dock geometry — updated ONLY on mount and resize (never read during pointerdown/pointermove animation path)
  const metricsRef = useRef<CachedDockMetrics>({
    dockLeft: 12,
    dockTop: 0,
    dockWidth: 360,
    dockHeight: 64,
    pad: 6,
    gap: 2,
    slotWidth: 56,
    slotOffsets: [6, 64, 122, 180, 238, 296],
  });

  const [slotWidth, setSlotWidth] = useState<number>(56);
  const [translateX, setTranslateX] = useState<number>(6);
  const [isInstant, setIsInstant] = useState<boolean>(true);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHighlightId, setDragHighlightId] = useState<BottomNavTabId | null>(null);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    captured: boolean;
    startClientX: number;
    initialTx: number;
    minTx: number;
    maxTx: number;
    moved: boolean;
    pressedTabId: BottomNavTabId;
    navigatedOnPress: boolean;
  }>({
    active: false,
    pointerId: null,
    captured: false,
    startClientX: 0,
    initialTx: 6,
    minTx: 6,
    maxTx: 296,
    moved: false,
    pressedTabId: activeTabId,
    navigatedOnPress: false,
  });

  const activeTabIdRef = useRef<BottomNavTabId>(activeTabId);
  activeTabIdRef.current = activeTabId;

  const refreshCachedMetrics = useCallback(() => {
    const dockEl = dockRef.current;
    if (!dockEl) return null;
    const rect = dockEl.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const next = computeMetricsFromRect(rect);
    metricsRef.current = next;
    return next;
  }, []);

  // Measure once on mount and when visibility changes, and update on resize only
  useLayoutEffect(() => {
    if (shouldHideBottomNav) return;
    const m = refreshCachedMetrics() || metricsRef.current;
    const idx = BOTTOM_NAV_TAB_INDEX[activeTabIdRef.current] ?? 1;
    const targetTx = m.slotOffsets[idx] ?? m.pad;
    setSlotWidth(m.slotWidth);
    setTranslateX(targetTx);
  }, [shouldHideBottomNav, refreshCachedMetrics]);

  // Move bubble via GPU translate3d whenever activeTabId changes
  useLayoutEffect(() => {
    if (dragRef.current.active) return;
    const m = metricsRef.current;
    const idx = BOTTOM_NAV_TAB_INDEX[activeTabId] ?? 1;
    const targetTx = m.slotOffsets[idx] ?? m.pad;
    setIsInstant(prefersReducedMotion());
    setTranslateX(targetTx);
  }, [activeTabId]);

  // Cache geometry on window resize / ResizeObserver (zero layout reads during pointer interactions)
  useEffect(() => {
    const handleResize = () => {
      if (dragRef.current.active) return;
      const m = refreshCachedMetrics();
      if (m) {
        const idx = BOTTOM_NAV_TAB_INDEX[activeTabId] ?? 1;
        setIsInstant(true);
        setSlotWidth(m.slotWidth);
        setTranslateX(m.slotOffsets[idx] ?? m.pad);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && dockRef.current) {
      ro = new ResizeObserver(handleResize);
      ro.observe(dockRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [activeTabId, refreshCachedMetrics]);

  // Fast index lookup from clientX using cached metrics (zero getBoundingClientRect calls)
  const getTabByClientX = useCallback(
    (clientX: number): { item: DockTabItem; index: number } => {
      const m = metricsRef.current;
      const relX = clientX - m.dockLeft - m.pad;
      const stride = Math.max(1, m.slotWidth + m.gap);
      const rawIdx = Math.floor(relX / stride);
      const clampedIdx = Math.max(0, Math.min(TAB_COUNT - 1, rawIdx));
      return {
        item: navItems[clampedIdx] || navItems[1],
        index: clampedIdx,
      };
    },
    [navItems]
  );

  const executeTabAction = useCallback(
    (item: DockTabItem) => {
      markNavTapStart(item.id);
      setOptimisticNavTab(item.id, item.id === 'menu');
      prefetchTabRouteAndData(item.id, user?.uid);

      const m = metricsRef.current;
      const idx = BOTTOM_NAV_TAB_INDEX[item.id] ?? 1;
      setIsInstant(prefersReducedMotion());
      setTranslateX(m.slotOffsets[idx] ?? m.pad);

      if (item.onClick) {
        item.onClick();
      } else if (item.to) {
        if (location.pathname !== item.to) {
          navigate(item.to);
        } else {
          recordNavFirstPaint(item.id);
        }
      }
    },
    [user?.uid, location.pathname, navigate]
  );

  // Respond immediately on pointerdown: move bubble + set active tab + navigate right away!
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Identify target tab from event target or cached slot math (no layout read!)
    const targetBtn = (e.target as HTMLElement | null)?.closest?.(
      '[data-nav-tab]'
    ) as HTMLElement | null;
    const attrTabId = targetBtn?.getAttribute('data-nav-tab') as BottomNavTabId | null;

    let pressedItem: DockTabItem;
    let pressedIdx: number;
    if (attrTabId && attrTabId in BOTTOM_NAV_TAB_INDEX) {
      pressedIdx = BOTTOM_NAV_TAB_INDEX[attrTabId];
      pressedItem = navItems[pressedIdx] || navItems[1];
    } else {
      const resolved = getTabByClientX(e.clientX);
      pressedItem = resolved.item;
      pressedIdx = resolved.index;
    }

    const m = metricsRef.current;
    const targetTx = m.slotOffsets[pressedIdx] ?? m.pad;
    const minTx = m.pad;
    const maxTx = Math.max(minTx, m.dockWidth - m.slotWidth - m.pad);

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      captured: false,
      startClientX: e.clientX,
      initialTx: targetTx,
      minTx,
      maxTx,
      moved: false,
      pressedTabId: pressedItem.id,
      navigatedOnPress: true,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current.captured = true;
    } catch {
      // ignore pointer capture errors
    }

    setIsPressed(true);
    setIsInstant(prefersReducedMotion());
    setDragHighlightId(pressedItem.id);

    // Optimistic UI + immediate navigation on pointerdown
    executeTabAction(pressedItem);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const dx = e.clientX - ds.startClientX;
    if (!ds.moved && Math.abs(dx) > 6) {
      ds.moved = true;
      setIsDragging(true);
    }

    if (ds.moved) {
      const m = metricsRef.current;
      const pointerLocalX = e.clientX - m.dockLeft;
      const rawTx = Math.round(pointerLocalX - m.slotWidth / 2);
      const clampedTx = Math.min(ds.maxTx, Math.max(ds.minTx, rawTx));
      setTranslateX(clampedTx);

      const { item: underTab } = getTabByClientX(e.clientX);
      if (underTab.id !== dragHighlightId) {
        setDragHighlightId(underTab.id);
        prefetchTabRouteAndData(underTab.id, user?.uid);
      }
    }
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const wasMoved = ds.moved;
    const wasCaptured = ds.captured;
    const pressedTabId = ds.pressedTabId;
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
        // ignore
      }
    }

    const m = metricsRef.current;

    if (e.type === 'pointercancel') {
      const idx = BOTTOM_NAV_TAB_INDEX[activeTabId] ?? 1;
      setTranslateX(m.slotOffsets[idx] ?? m.pad);
      return;
    }

    if (wasMoved) {
      const { item: targetItem, index: targetIdx } = getTabByClientX(e.clientX);
      setTranslateX(m.slotOffsets[targetIdx] ?? m.pad);
      if (targetItem.id !== pressedTabId) {
        executeTabAction(targetItem);
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
      executeTabAction(item);
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

  const stopNavPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // Dock wrapper (position: fixed, no filter) contains THREE SIBLINGS, never nested:
  // (a) .plate (static blur layer)  (b) .g > .gi (GPU translate3d bubble, zero blur)  (c) .tabs
  const navBarElement = (
    <nav
      ref={dockRef}
      data-bottom-nav-container="true"
      role="tablist"
      aria-label="Student Dashboard Navigation"
      aria-hidden={shouldHideBottomNav}
      hidden={shouldHideBottomNav}
      style={
        shouldHideBottomNav
          ? { display: 'none' }
          : ({ '--slot-w': `${slotWidth}px` } as React.CSSProperties)
      }
      onClick={stopNavPropagation}
      onMouseDown={stopNavPropagation}
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
      {/* (a) .plate: static blur layer behind the bubble — never animates or re-composites */}
      <div className="plate dark-surface-preserve" aria-hidden="true" />

      {/* (b) .g: GPU-accelerated bubble driven strictly by translate3d (never animates width/left/blur) */}
      <div
        ref={bubbleRef}
        aria-hidden="true"
        className={`g ${isInstant ? 'is-instant' : ''} ${
          isDragging ? 'is-dragging' : ''
        } ${isPressed ? 'is-pressed out' : ''}`}
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
        }}
      >
        <div className={`gi dark-surface-preserve ${isPressed || isDragging ? 'out' : ''}`} />
      </div>

      {/* (c) .tabs: the 6 evenly-spaced buttons, position relative, z-index above .g */}
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
              onTouchStart={() => {
                prefetchTabRouteAndData(item.id, user?.uid);
              }}
              onMouseEnter={() => {
                prefetchTabRouteAndData(item.id, user?.uid);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Keyboard activation (detail === 0) triggers navigation; pointer taps already fired on pointerdown
                if (e.detail === 0) {
                  executeTabAction(item);
                }
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
        onClose={() => {
          setNavMenuOpen(false, isApprovedCaptain);
          if (location.pathname === '/menu' || location.pathname === '/dashboard/menu') {
            navigate('/dashboard', { replace: true });
          }
        }}
      />
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent, () => true);
export default DashboardBottomNav;
