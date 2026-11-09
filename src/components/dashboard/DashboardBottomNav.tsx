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
import { HamburgerMenuSheet } from './HamburgerMenuSheet';

interface DockTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  end?: boolean;
  onClick?: () => void;
  badge?: number;
}

interface BubbleEdges {
  left: number;
  right: number;
  width: number;
  dockWidth: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isTabElementVisible(el: HTMLButtonElement | null): el is HTMLButtonElement {
  if (!el) return false;
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
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  // Auto-close drawer on any route change so state never gets stuck or re-triggered
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Detect any open full-screen external modal across the app and hide the bottom navigation
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkModalState = () => {
      if (document.body.getAttribute('data-hamburger-sheet-open') === 'true') {
        setIsExternalModalOpen(false);
        return;
      }
      if (
        document.body.getAttribute('data-fullscreen-modal-open') === 'true' ||
        document.body.getAttribute('data-pro-checkout-open') === 'true'
      ) {
        setIsExternalModalOpen(true);
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
      setIsExternalModalOpen(hasActiveModal);
    };

    checkModalState();

    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'style',
        'class',
        'data-fullscreen-modal-open',
        'data-pro-checkout-open',
        'data-hamburger-sheet-open',
      ],
      childList: true,
      subtree: true,
    });

    window.addEventListener('boardly:modal-change', checkModalState);
    return () => {
      observer.disconnect();
      window.removeEventListener('boardly:modal-change', checkModalState);
    };
  }, [location.pathname]);

  const shouldHideBottomNav = isProfileModalOpen || isExternalModalOpen;

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

  const [edges, setEdges] = useState<BubbleEdges>({
    left: 7,
    right: 7,
    width: 0,
    dockWidth: 0,
  });
  const edgesRef = useRef<BubbleEdges>(edges);
  edgesRef.current = edges;

  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isInstant, setIsInstant] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragRelaxing, setIsDragRelaxing] = useState(false);
  const [isSquashed, setIsSquashed] = useState(false);
  const [dragHighlightId, setDragHighlightId] = useState<string | null>(null);

  const prevVisibleCountRef = useRef<number>(0);
  const prevActiveTabIdRef = useRef<string>(activeTabId);
  const hasMountedRef = useRef<boolean>(false);
  const relaxTimerRef = useRef<number | null>(null);
  const squashTimerRef = useRef<number | null>(null);
  const justHandledTabRef = useRef<string | null>(null);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    initialLeft: number;
    bubbleWidth: number;
    dockWidth: number;
    minLeft: number;
    maxLeft: number;
    clampedLeft: number;
    baseRight: number;
    moved: boolean;
    lastClientX: number;
    lastTime: number;
    velocityX: number;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    initialLeft: 7,
    bubbleWidth: 0,
    dockWidth: 0,
    minLeft: 7,
    maxLeft: 7,
    clampedLeft: 7,
    baseRight: 7,
    moved: false,
    lastClientX: 0,
    lastTime: 0,
    velocityX: 0,
  });

  // Measure only visible tabs against the dock
  const getVisibleTabs = useCallback((): DockTabItem[] => {
    return navItems.filter((item) => isTabElementVisible(btnRefs.current[item.id] ?? null));
  }, [navItems]);

  const measureTab = useCallback((tabId: string): BubbleEdges | null => {
    const dockEl = dockRef.current;
    const btnEl = btnRefs.current[tabId] ?? null;
    if (!dockEl || !isTabElementVisible(btnEl)) return null;
    const dockRect = dockEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    if (btnRect.width <= 0 || dockRect.width <= 0) return null;

    const dockWidth = Math.round(dockRect.width);
    const left = Math.max(7, Math.round(btnRect.left - dockRect.left));
    const width = Math.round(btnRect.width);
    const right = Math.max(7, dockWidth - (left + width));

    return {
      left,
      right,
      width,
      dockWidth,
    };
  }, []);

  const triggerTravelSquash = useCallback(() => {
    if (prefersReducedMotion()) {
      setIsSquashed(false);
      return;
    }
    if (squashTimerRef.current !== null) {
      window.clearTimeout(squashTimerRef.current);
    }
    setIsSquashed(true);
    squashTimerRef.current = window.setTimeout(() => {
      setIsSquashed(false);
      squashTimerRef.current = null;
    }, 230);
  }, []);

  const animateBubbleToTab = useCallback(
    (targetTabId: string, forceInstant = false) => {
      const m = measureTab(targetTabId);
      if (!m) return;

      const reduced = prefersReducedMotion() || forceInstant;
      const prev = edgesRef.current;

      if (reduced || prev.width <= 0) {
        setIsInstant(true);
        setIsSquashed(false);
        setEdges(m);
        edgesRef.current = m;
        return;
      }

      const prevCenter = prev.left + (m.dockWidth - prev.right - prev.left) / 2;
      const nextCenter = m.left + m.width / 2;
      const delta = nextCenter - prevCenter;

      if (Math.abs(delta) > 1) {
        setDirection(delta >= 0 ? 'right' : 'left');
      } else {
        const visible = getVisibleTabs();
        const prevIdx = visible.findIndex((t) => t.id === prevActiveTabIdRef.current);
        const nextIdx = visible.findIndex((t) => t.id === targetTabId);
        if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
          setDirection(nextIdx > prevIdx ? 'right' : 'left');
        }
      }

      setIsInstant(false);
      setEdges(m);
      edgesRef.current = m;

      if (Math.abs(m.left - prev.left) > 3 || Math.abs(m.right - prev.right) > 3) {
        triggerTravelSquash();
      }
    },
    [measureTab, getVisibleTabs, triggerTravelSquash]
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
        setIsSquashed(false);
        setEdges(m);
        edgesRef.current = m;
        hasMountedRef.current = true;
      }
      prevActiveTabIdRef.current = activeTabId;
      justHandledTabRef.current = null;
      return;
    }

    // If pointer release or tap already triggered the transition to this tab, avoid duplicate trigger
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
        setIsInstant(true);
        setIsSquashed(false);
        setEdges(m);
        edgesRef.current = m;
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
      if (squashTimerRef.current !== null) {
        window.clearTimeout(squashTimerRef.current);
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
    // Never capture pointer on the hamburger menu button — use single onClick event only
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest('[data-nav-tab="menu"]')) return;
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const currentM = measureTab(activeTabId) || edgesRef.current;
    const dockRect = dockEl.getBoundingClientRect();
    const dockWidth = Math.round(dockRect.width);
    const bubbleWidth =
      currentM.width > 0
        ? currentM.width
        : Math.max(36, Math.round((dockWidth - 14) / Math.max(1, getVisibleTabs().length)));
    const minLeft = 7;
    const maxLeft = Math.max(minLeft, dockWidth - bubbleWidth - 7);
    const clampedLeft = Math.min(maxLeft, Math.max(minLeft, currentM.left));
    const baseRight = Math.max(7, dockWidth - (clampedLeft + bubbleWidth));
    const now = performance.now();

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      initialLeft: clampedLeft,
      bubbleWidth,
      dockWidth,
      minLeft,
      maxLeft,
      clampedLeft,
      baseRight,
      moved: false,
      lastClientX: e.clientX,
      lastTime: now,
      velocityX: 0,
    };

    if (relaxTimerRef.current !== null) {
      window.clearTimeout(relaxTimerRef.current);
      relaxTimerRef.current = null;
    }
    if (squashTimerRef.current !== null) {
      window.clearTimeout(squashTimerRef.current);
      squashTimerRef.current = null;
    }

    setIsInstant(false);
    setIsSquashed(false);
    setIsDragRelaxing(false);
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
      const dt = Math.max(6, now - ds.lastTime);
      const stepDx = e.clientX - ds.lastClientX;
      const instantVx = stepDx / dt; // px per ms
      ds.velocityX = ds.velocityX * 0.35 + instantVx * 0.65;
      ds.lastClientX = e.clientX;
      ds.lastTime = now;

      const clampedLeft = Math.min(ds.maxLeft, Math.max(ds.minLeft, Math.round(ds.initialLeft + dx)));
      const baseRight = Math.max(7, ds.dockWidth - (clampedLeft + ds.bubbleWidth));
      ds.clampedLeft = clampedLeft;
      ds.baseRight = baseRight;

      let nextLeft = clampedLeft;
      let nextRight = baseRight;

      if (!prefersReducedMotion()) {
        // Stretch up to 26px in the direction of travel (leading edge extends)
        const stretchPx = Math.min(26, Math.round(Math.abs(ds.velocityX) * 18));
        if (stretchPx > 0) {
          if (ds.velocityX > 0) {
            // Moving right: RIGHT edge is leading -> reduce right inset
            nextRight = Math.max(7, baseRight - stretchPx);
          } else if (ds.velocityX < 0) {
            // Moving left: LEFT edge is leading -> reduce left inset
            nextLeft = Math.max(7, clampedLeft - stretchPx);
          }
        }

        if (isDragRelaxing) {
          setIsDragRelaxing(false);
        }

        if (relaxTimerRef.current !== null) {
          window.clearTimeout(relaxTimerRef.current);
        }
        // When finger slows down / pauses for ~90ms, ease bubble back to its normal width
        relaxTimerRef.current = window.setTimeout(() => {
          if (!dragRef.current.active) return;
          dragRef.current.velocityX = 0;
          setIsDragRelaxing(true);
          const relaxedEdges: BubbleEdges = {
            left: dragRef.current.clampedLeft,
            right: dragRef.current.baseRight,
            width: dragRef.current.bubbleWidth,
            dockWidth: dragRef.current.dockWidth,
          };
          setEdges(relaxedEdges);
          edgesRef.current = relaxedEdges;
        }, 90);
      }

      const nextEdges: BubbleEdges = {
        left: nextLeft,
        right: nextRight,
        width: ds.dockWidth - nextLeft - nextRight,
        dockWidth: ds.dockWidth,
      };
      setEdges(nextEdges);
      edgesRef.current = nextEdges;

      const underBubble = findNearestVisibleTab(clampedLeft + ds.bubbleWidth / 2);
      setDragHighlightId(underBubble.id);
    }
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
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
    setIsDragRelaxing(false);
    setDragHighlightId(null);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore pointer capture errors
    }

    // Only navigate on pointerup if the user actually dragged across tabs;
    // taps (!ds.moved) and the hamburger menu button are handled exclusively by onClick
    if (ds.moved) {
      const dx = e.clientX - ds.startClientX;
      const finalLeft = Math.min(ds.maxLeft, Math.max(ds.minLeft, ds.initialLeft + dx));
      const targetItem = findNearestVisibleTab(finalLeft + ds.bubbleWidth / 2);
      if (targetItem.id !== 'menu') {
        navigateToTab(targetItem);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number, item: DockTabItem) => {
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

  const highlightedId = isDragging && dragHighlightId ? dragHighlightId : activeTabId;

  // Fallback CSS percentages only before first layout measurement completes
  const activeIdx = Math.max(0, navItems.findIndex((i) => i.id === activeTabId));
  const fallbackLeft = `calc(7px + ((100% - 14px) * ${activeIdx} / ${navItems.length}))`;
  const fallbackRight = `calc(7px + ((100% - 14px) * ${navItems.length - 1 - activeIdx} / ${navItems.length}))`;

  const stopNavPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const navBarElement = (
    <div
      data-bottom-nav-container="true"
      style={{ zIndex: 90 }}
      onClick={stopNavPropagation}
      onMouseDown={stopNavPropagation}
      onTouchStart={stopNavPropagation}
      onTouchEnd={stopNavPropagation}
      className={`fixed bottom-[calc(14px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[336px] z-[90] ${
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
        className="sdn-dock pointer-events-auto"
      >
        {/* Single sliding & stretching red glass bubble behind icons */}
        <div
          ref={bubbleRef}
          aria-hidden="true"
          className={`sdn-bubble ${direction === 'left' ? 'dir-left' : 'dir-right'} ${
            isInstant ? 'is-instant' : ''
          } ${isDragging ? 'is-dragging' : ''} ${
            isDragRelaxing ? 'is-drag-relaxing' : ''
          } ${isPressed ? 'is-pressed' : ''} ${isSquashed ? 'is-squashed' : ''}`}
          style={{
            left: edges.dockWidth > 0 ? `${edges.left}px` : fallbackLeft,
            right: edges.dockWidth > 0 ? `${edges.right}px` : fallbackRight,
          }}
        />

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
              aria-selected={isSelected}
              aria-label={item.label}
              title={item.label}
              onKeyDown={(e) => handleKeyDown(e, index, item)}
              onPointerDown={(e) => {
                if (item.id === 'menu') {
                  e.stopPropagation();
                }
              }}
              onPointerUp={(e) => {
                if (item.id === 'menu') {
                  e.stopPropagation();
                }
              }}
              onTouchStart={stopNavPropagation}
              onTouchEnd={stopNavPropagation}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateToTab(item);
              }}
              className={`sdn-tab-btn pointer-events-auto ${isHighlighted ? 'is-active' : ''}`}
            >
              <span className="shrink-0 flex items-center justify-center relative pointer-events-none">
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
  );

  return (
    <>
      {typeof document !== 'undefined'
        ? createPortal(navBarElement, document.body)
        : navBarElement}

      {/* ─── REDESIGNED BOARDLY HAMBURGER MENU BOTTOM SHEET ───────────────── */}
      <HamburgerMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent);
export default DashboardBottomNav;
