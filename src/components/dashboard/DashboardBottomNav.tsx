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

interface BubbleEdges {
  left: number;
  right: number;
  width: number;
  dockWidth: number;
  pad: number;
}

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

function getDockPadPx(dockEl: HTMLElement | null): number {
  if (!dockEl || typeof window === 'undefined') return 9;
  const raw = window.getComputedStyle(dockEl).getPropertyValue('--pad').trim();
  const parsed = parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const padLeft = parseFloat(window.getComputedStyle(dockEl).paddingLeft);
  return Number.isFinite(padLeft) && padLeft > 0 ? padLeft : 9;
}

function DashboardBottomNavComponent() {
  const { user, profile } = useUserProfile();
  const { profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { isOpen: isProfileModalOpen } = useProfileModal();
  const unreadCount = useUnreadNotificationsCount();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { isSmooth: isSmoothMode } = useSmoothMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const lowEndDevice = useMemo(() => isLowEndHardware(), []);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  // Auto-close drawer on any route change so state never gets stuck or re-triggered
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
  // Icons are sized via CSS var(--ic) (25px mobile, 29px tablet, 33px laptop)
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

  const [edges, setEdges] = useState<BubbleEdges>({
    left: 9,
    right: 9,
    width: 0,
    dockWidth: 0,
    pad: 9,
  });
  const edgesRef = useRef<BubbleEdges>(edges);
  edgesRef.current = edges;

  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isInstant, setIsInstant] = useState(true);
  const [isOut, setIsOut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragRelaxing, setIsDragRelaxing] = useState(false);
  const [dragHighlightId, setDragHighlightId] = useState<string | null>(null);

  const prevVisibleCountRef = useRef<number>(0);
  const prevActiveTabIdRef = useRef<string>(activeTabId);
  const hasMountedRef = useRef<boolean>(false);
  const relaxTimerRef = useRef<number | null>(null);
  const outTimerRef = useRef<number | null>(null);
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
    pad: number;
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
    captured: false,
    startClientX: 0,
    initialLeft: 9,
    bubbleWidth: 0,
    dockWidth: 0,
    pad: 9,
    minLeft: 9,
    maxLeft: 9,
    clampedLeft: 9,
    baseRight: 9,
    moved: false,
    lastClientX: 0,
    lastTime: 0,
    velocityX: 0,
  });

  // Measure only visible tabs against the dock
  const getVisibleTabs = useCallback((): DockTabItem[] => {
    return navItems.filter(
      (item) => !item.hidden && isTabElementVisible(btnRefs.current[item.id] ?? null)
    );
  }, [navItems]);

  const measureTab = useCallback((tabId: string): BubbleEdges | null => {
    const dockEl = dockRef.current;
    const btnEl = btnRefs.current[tabId] ?? null;
    if (!dockEl || !isTabElementVisible(btnEl)) return null;
    const dockRect = dockEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    if (btnRect.width <= 0 || dockRect.width <= 0) return null;

    const pad = Math.round(getDockPadPx(dockEl));
    const dockWidth = Math.round(dockRect.width);
    const left = Math.max(pad, Math.round(btnRect.left - dockRect.left));
    const width = Math.round(btnRect.width);
    const right = Math.max(pad, dockWidth - (left + width));

    return {
      left,
      right,
      width,
      dockWidth,
      pad,
    };
  }, []);

  const triggerPopOut = useCallback((durationMs: number) => {
    if (prefersReducedMotion()) {
      setIsOut(false);
      return;
    }
    if (outTimerRef.current !== null) {
      window.clearTimeout(outTimerRef.current);
    }
    setIsOut(true);
    outTimerRef.current = window.setTimeout(() => {
      setIsOut(false);
      outTimerRef.current = null;
    }, durationMs);
  }, []);

  const animateBubbleToTab = useCallback(
    (targetTabId: string, forceInstant = false, popOutDurationMs = 520) => {
      const m = measureTab(targetTabId);
      if (!m) return;

      const reduced = prefersReducedMotion() || forceInstant;
      const prev = edgesRef.current;

      if (reduced || prev.width <= 0) {
        if (outTimerRef.current !== null) {
          window.clearTimeout(outTimerRef.current);
          outTimerRef.current = null;
        }
        setIsInstant(true);
        setIsOut(false);
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
      triggerPopOut(popOutDurationMs);
      setEdges(m);
      edgesRef.current = m;
    },
    [measureTab, getVisibleTabs, triggerPopOut]
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
        setIsOut(false);
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

    animateBubbleToTab(activeTabId, false, 520);
    prevActiveTabIdRef.current = activeTabId;
  }, [activeTabId, navItems.length, measureTab, getVisibleTabs, animateBubbleToTab]);

  // Reposition with no animation on window resize / dock resize
  useEffect(() => {
    const handleResize = () => {
      if (dragRef.current.active) return;
      const m = measureTab(activeTabId);
      if (m) {
        if (outTimerRef.current !== null) {
          window.clearTimeout(outTimerRef.current);
          outTimerRef.current = null;
        }
        setIsInstant(true);
        setIsOut(false);
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
      if (outTimerRef.current !== null) {
        window.clearTimeout(outTimerRef.current);
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
    (item: DockTabItem, popOutDurationMs = 520) => {
      justHandledTabRef.current = item.id;
      animateBubbleToTab(item.id, false, popOutDurationMs);
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

  // Rule 5: Do NOT call setPointerCapture on pointerdown — only capture once drag exceeds 6px
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const pad = Math.round(getDockPadPx(dockEl));
    const currentM = measureTab(activeTabId) || edgesRef.current;
    const dockRect = dockEl.getBoundingClientRect();
    const dockWidth = Math.round(dockRect.width);
    const bubbleWidth =
      currentM.width > 0
        ? currentM.width
        : Math.max(44, Math.round((dockWidth - pad * 2) / Math.max(1, getVisibleTabs().length)));
    const minLeft = pad;
    const maxLeft = Math.max(minLeft, dockWidth - bubbleWidth - pad);
    const clampedLeft = Math.min(maxLeft, Math.max(minLeft, currentM.left));
    const baseRight = Math.max(pad, dockWidth - (clampedLeft + bubbleWidth));
    const now = performance.now();

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      captured: false,
      startClientX: e.clientX,
      initialLeft: clampedLeft,
      bubbleWidth,
      dockWidth,
      pad,
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

    setIsInstant(false);
    setIsDragRelaxing(false);
    setDragHighlightId(activeTabId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const ds = dragRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const dx = e.clientX - ds.startClientX;

    // After the finger has moved more than 6px horizontally, start drag & add "out"
    if (!ds.moved && Math.abs(dx) > 6) {
      ds.moved = true;
      setIsDragging(true);
      if (outTimerRef.current !== null) {
        window.clearTimeout(outTimerRef.current);
        outTimerRef.current = null;
      }
      if (!prefersReducedMotion()) {
        setIsOut(true);
      }
      if (!ds.captured) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
          ds.captured = true;
        } catch {
          // ignore pointer capture errors
        }
      }
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
      const baseRight = Math.max(ds.pad, ds.dockWidth - (clampedLeft + ds.bubbleWidth));
      ds.clampedLeft = clampedLeft;
      ds.baseRight = baseRight;

      let nextLeft = clampedLeft;
      let nextRight = baseRight;

      if (!prefersReducedMotion()) {
        // Stretch in the direction of travel, up to 34px extra, from finger speed
        const stretchPx = Math.min(34, Math.round(Math.abs(ds.velocityX) * 24));
        if (stretchPx > 0) {
          if (ds.velocityX > 0) {
            // Moving right: RIGHT edge is leading -> reduce right inset (clamped to pad)
            nextRight = Math.max(ds.pad, baseRight - stretchPx);
          } else if (ds.velocityX < 0) {
            // Moving left: LEFT edge is leading -> reduce left inset (clamped to pad)
            nextLeft = Math.max(ds.pad, clampedLeft - stretchPx);
          }
        }

        if (isDragRelaxing) {
          setIsDragRelaxing(false);
        }

        if (relaxTimerRef.current !== null) {
          window.clearTimeout(relaxTimerRef.current);
        }
        // When finger slows down / pauses for ~90ms during drag, ease bubble back to its normal width
        relaxTimerRef.current = window.setTimeout(() => {
          if (!dragRef.current.active) return;
          dragRef.current.velocityX = 0;
          setIsDragRelaxing(true);
          const relaxedEdges: BubbleEdges = {
            left: dragRef.current.clampedLeft,
            right: dragRef.current.baseRight,
            width: dragRef.current.bubbleWidth,
            dockWidth: dragRef.current.dockWidth,
            pad: dragRef.current.pad,
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
        pad: ds.pad,
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

    const wasMoved = ds.moved;
    const wasCaptured = ds.captured;
    ds.active = false;
    ds.pointerId = null;
    ds.captured = false;
    ds.moved = false;

    if (relaxTimerRef.current !== null) {
      window.clearTimeout(relaxTimerRef.current);
      relaxTimerRef.current = null;
    }

    setIsDragging(false);
    setIsDragRelaxing(false);
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

    if (wasMoved) {
      // Drag release: snap to nearest tab with liquid stretch, remove "out" after ~260ms, navigate ONCE
      const dx = e.clientX - ds.startClientX;
      const finalLeft = Math.min(ds.maxLeft, Math.max(ds.minLeft, ds.initialLeft + dx));
      const targetItem = findNearestVisibleTab(finalLeft + ds.bubbleWidth / 2);
      lastPointerNavTimeRef.current = performance.now();
      navigateToTab(targetItem, 260);
      return;
    }

    // Tap release (!wasMoved on pointerup): resolve the tab whose bounding box contains the pointer
    if (e.type === 'pointerup') {
      const tappedTab = findTabAtPoint(e.clientX, e.clientY);
      if (tappedTab) {
        lastPointerNavTimeRef.current = performance.now();
        navigateToTab(tappedTab, 520);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number, item: DockTabItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      navigateToTab(item, 520);
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
  const fallbackLeft = `calc(var(--pad) + ((100% - (var(--pad) * 2)) * ${activeIdx} / ${navItems.length}))`;
  const fallbackRight = `calc(var(--pad) + ((100% - (var(--pad) * 2)) * ${navItems.length - 1 - activeIdx} / ${navItems.length}))`;

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
      className={`sdn-dock ${lowEndDevice || isSmoothMode ? 'low-fx' : ''} ${
        shouldHideBottomNav ? 'pointer-events-none invisible hidden' : 'pointer-events-auto'
      }`}
    >
      {/* (a) .plate: absolute, inset 0, fully rounded, the dock's glass */}
      <div className="plate dark-surface-preserve" aria-hidden="true" />

      {/* (b) .g: the bubble, absolute, z-index above .plate and below .tabs, pointer-events: none, with inner .gi */}
      <div
        ref={bubbleRef}
        aria-hidden="true"
        className={`g ${direction === 'left' ? 'dir-left' : 'dir-right'} ${
          isInstant ? 'is-instant' : ''
        } ${isDragging ? 'is-dragging' : ''} ${
          isDragRelaxing ? 'is-drag-relaxing' : ''
        } ${isOut ? 'out' : ''}`}
        style={{
          left: edges.dockWidth > 0 ? `${edges.left}px` : fallbackLeft,
          right: edges.dockWidth > 0 ? `${edges.right}px` : fallbackRight,
        }}
      >
        <div className={`gi dark-surface-preserve ${isOut ? 'out' : ''}`} />
      </div>

      {/* (c) .tabs: the buttons, position relative, z-index above .g, flex with gap: var(--gap) */}
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
                // Guard against double navigation when pointerup already handled the tap/drag
                if (performance.now() - lastPointerNavTimeRef.current < 450) {
                  return;
                }
                navigateToTab(item, 520);
              }}
              className={`sdn-tab-btn pointer-events-auto ${isHighlighted ? 'is-active' : ''} ${
                item.hidden ? 'is-hidden' : ''
              }`}
            >
              <span className="shrink-0 flex items-center justify-center relative pointer-events-none">
                {item.icon}
                {Boolean(item.badge) && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm ${
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
      </div>
    </nav>
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
