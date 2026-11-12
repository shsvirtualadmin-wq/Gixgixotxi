import { useSyncExternalStore } from 'react';

export type BottomNavTabId = 'commons' | 'home' | 'messages' | 'streaks' | 'crew' | 'menu';

export const BOTTOM_NAV_TAB_INDEX: Record<BottomNavTabId, number> = {
  commons: 0,
  home: 1,
  messages: 2,
  streaks: 3,
  crew: 4,
  menu: 5,
};

interface NavStoreState {
  pathname: string;
  activeTabId: BottomNavTabId;
  optimisticTabId: BottomNavTabId | null;
  isMenuOpen: boolean;
}

export function resolveTabIdFromPathname(
  pathname: string,
  isMenuOpen = false,
  isApprovedCaptain = false
): BottomNavTabId {
  const p = pathname || '/dashboard';
  if (
    isMenuOpen ||
    p === '/menu' ||
    p === '/dashboard/menu' ||
    p.startsWith('/store') ||
    p.startsWith('/dashboard/store') ||
    p.startsWith('/dashboard/notifications') ||
    p === '/notifications' ||
    p.startsWith('/rewards') ||
    p.startsWith('/dashboard/rewards') ||
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
  if (p.startsWith('/dashboard/messages') || p === '/messages' || p.startsWith('/dashboard/chat')) {
    return 'messages';
  }
  if (
    p.startsWith('/dashboard/commons') ||
    p.startsWith('/commons') ||
    p === '/saved'
  ) {
    return 'commons';
  }
  return 'home';
}

const initialPathname =
  typeof window !== 'undefined' ? window.location.pathname : '/dashboard';

let state: NavStoreState = {
  pathname: initialPathname,
  activeTabId: resolveTabIdFromPathname(initialPathname, false, false),
  optimisticTabId: null,
  isMenuOpen: initialPathname === '/menu' || initialPathname === '/dashboard/menu',
};

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeNavStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNavStoreSnapshot(): NavStoreState {
  return state;
}

export function setOptimisticNavTab(
  tabId: BottomNavTabId,
  openMenu?: boolean
): void {
  const nextMenuOpen =
    typeof openMenu === 'boolean' ? openMenu : tabId === 'menu' ? true : state.isMenuOpen;
  if (
    state.optimisticTabId === tabId &&
    state.activeTabId === tabId &&
    state.isMenuOpen === nextMenuOpen
  ) {
    return;
  }
  state = {
    ...state,
    activeTabId: tabId,
    optimisticTabId: tabId,
    isMenuOpen: nextMenuOpen,
  };
  emitChange();
}

export function setNavMenuOpen(isOpen: boolean, isApprovedCaptain = false): void {
  const resolvedTab = resolveTabIdFromPathname(state.pathname, isOpen, isApprovedCaptain);
  if (state.isMenuOpen === isOpen && state.activeTabId === resolvedTab && !state.optimisticTabId) {
    return;
  }
  state = {
    ...state,
    isMenuOpen: isOpen,
    optimisticTabId: null,
    activeTabId: resolvedTab,
  };
  emitChange();
}

export function syncNavRouteFromRouter(
  pathname: string,
  isApprovedCaptain = false
): void {
  const shouldKeepMenu =
    pathname === '/menu' || pathname === '/dashboard/menu' ? true : false;
  const resolved = resolveTabIdFromPathname(pathname, shouldKeepMenu, isApprovedCaptain);
  if (
    state.pathname === pathname &&
    state.activeTabId === resolved &&
    state.optimisticTabId === null &&
    state.isMenuOpen === shouldKeepMenu
  ) {
    return;
  }
  state = {
    pathname,
    activeTabId: resolved,
    optimisticTabId: null,
    isMenuOpen: shouldKeepMenu,
  };
  emitChange();
}

export function useNavStore(): NavStoreState {
  return useSyncExternalStore(
    subscribeNavStore,
    getNavStoreSnapshot,
    getNavStoreSnapshot
  );
}

// ─── Console-Only Performance Telemetry (Target: <100ms nav, <500ms rewards) ──

let lastNavTapStartMs: number | null = null;
let lastNavTapTabId: string | null = null;
let lastRewardsTapStartMs: number | null = null;

export function markNavTapStart(tabId: string): void {
  if (typeof performance === 'undefined') return;
  lastNavTapStartMs = performance.now();
  lastNavTapTabId = tabId;
}

export function recordNavFirstPaint(activeKey: string): void {
  if (typeof performance === 'undefined' || lastNavTapStartMs === null) return;
  const start = lastNavTapStartMs;
  const tabId = lastNavTapTabId || activeKey;
  lastNavTapStartMs = null;
  lastNavTapTabId = null;

  requestAnimationFrame(() => {
    const elapsed = performance.now() - start;
    console.info(
      `[Perf] Bottom nav tap (${tabId}) -> first paint: ${elapsed.toFixed(1)}ms (target <100ms)`
    );
  });
}

export function markRewardsTapStart(): void {
  if (typeof performance === 'undefined') return;
  lastRewardsTapStartMs = performance.now();
}

export function recordRewardsContentPaint(source: 'cache' | 'network'): void {
  if (typeof performance === 'undefined') return;
  const now = performance.now();
  const start = lastRewardsTapStartMs ?? now;
  lastRewardsTapStartMs = null;

  requestAnimationFrame(() => {
    const elapsed = Math.max(0.1, performance.now() - start);
    console.info(
      `[Perf] Rewards tap -> content (${source}): ${elapsed.toFixed(1)}ms (target <500ms)`
    );
  });
}
