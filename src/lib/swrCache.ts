/**
 * ============================================================================
 * BOARDLY INSTANT SWR CACHE, EARLY FETCH CONSUMER & TAB PREFETCHER
 * ============================================================================
 * Provides:
 * 1. Two-tier (Memory + localStorage) Stale-While-Revalidate cache so visited
 *    tabs and cold starts render cached content in 0ms while refreshing quietly
 *    in the background.
 * 2. In-flight request deduplication so identical requests never fire twice.
 * 3. Optimistic Last-Known User & Wallet snapshot so the app shell, top bar
 *    avatar/frame, and Koban balance render on frame 1 without layout shift or
 *    waiting on Firebase Auth handshake.
 * 4. Early HTML parallel fetch consumer (`window.__BOARDLY_EARLY_POSTS__`)
 *    started in `index.html` before the React bundle finishes downloading.
 */

export interface SwrEntry<T> {
  data: T;
  updatedAt: number;
}

const MEMORY_CACHE = new Map<string, SwrEntry<any>>();
const IN_FLIGHT = new Map<string, Promise<any>>();
const LS_PREFIX = 'boardly_swr_v2:';
const LAST_KNOWN_USER_KEY = 'boardly_last_known_user_v1';
const LAST_KNOWN_WALLET_KEY = 'boardly_last_known_wallet_v1';

export interface OptimisticUserSnapshot {
  uid: string;
  email: string;
  displayName: string;
  username?: string | null;
  shortId?: string;
  role: 'student' | 'admin' | 'superadmin' | 'crew' | 'captain' | 'ambassador';
  customRole?: string | null;
  plan: 'free' | 'pro' | 'premium';
  isGuest?: boolean;
  avatar?: string | null;
  frame?: string | null;
  proBadge?: string | null;
  streak?: number;
  targetUniversity?: string;
  updatedAt: number;
}

export interface OptimisticWalletSnapshot {
  uid: string;
  balance: number;
  equipped: {
    effect: string | null;
    frame: string | null;
    nameplate: string | null;
    avatar: string | null;
    banner: string | null;
  };
  updatedAt: number;
}

/**
 * Reads a cached SWR entry from memory first (0ms), falling back to localStorage.
 */
export function readSwrCache<T>(key: string, maxAgeMs = 24 * 60 * 60 * 1000): SwrEntry<T> | null {
  const mem = MEMORY_CACHE.get(key);
  if (mem) {
    if (Date.now() - mem.updatedAt <= maxAgeMs) {
      return mem as SwrEntry<T>;
    }
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${LS_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SwrEntry<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.updatedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.updatedAt > maxAgeMs) {
      window.localStorage.removeItem(`${LS_PREFIX}${key}`);
      return null;
    }
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Writes data to both the in-memory map and localStorage (if serializable and reasonably sized).
 */
export function writeSwrCache<T>(key: string, data: T, persistToStorage = true): void {
  const entry: SwrEntry<T> = {
    data,
    updatedAt: Date.now(),
  };
  MEMORY_CACHE.set(key, entry);
  if (!persistToStorage || typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(entry);
    // Keep individual localStorage entries under 180KB so we never hit quota limits
    if (serialized.length <= 180_000) {
      window.localStorage.setItem(`${LS_PREFIX}${key}`, serialized);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateSwrCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    MEMORY_CACHE.clear();
    return;
  }
  for (const k of Array.from(MEMORY_CACHE.keys())) {
    if (k.startsWith(keyPrefix)) {
      MEMORY_CACHE.delete(k);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(`${LS_PREFIX}${keyPrefix}`)) {
          window.localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Deduplicates concurrent in-flight promises sharing the same key.
 */
export function dedupeInFlight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = IN_FLIGHT.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const p = factory().finally(() => {
    IN_FLIGHT.delete(key);
  });
  IN_FLIGHT.set(key, p);
  return p;
}

/**
 * Optimistic user snapshot helpers so the shell & header render immediately on cold start
 * without blocking on Firebase Auth initialization.
 */
export function readOptimisticUserSnapshot(): OptimisticUserSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const isAuthFlag = window.localStorage.getItem('boardly_user_authenticated') === 'true';
    const hasGuestToken = Boolean(window.localStorage.getItem('boardly_guest_session_token'));
    const raw = window.localStorage.getItem(LAST_KNOWN_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OptimisticUserSnapshot;
    if (!parsed || !parsed.uid) return null;
    if (!isAuthFlag && !hasGuestToken) return null;
    // Expire optimistic snapshot after 14 days of inactivity
    if (Date.now() - (parsed.updatedAt || 0) > 14 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeOptimisticUserSnapshot(snapshot: Omit<OptimisticUserSnapshot, 'updatedAt'>): void {
  if (typeof window === 'undefined' || !snapshot?.uid) return;
  try {
    const record: OptimisticUserSnapshot = {
      ...snapshot,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(LAST_KNOWN_USER_KEY, JSON.stringify(record));
    window.localStorage.setItem('boardly_user_authenticated', 'true');
  } catch {
    // Ignore storage errors
  }
}

export function clearOptimisticUserSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LAST_KNOWN_USER_KEY);
    window.localStorage.removeItem(LAST_KNOWN_WALLET_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Optimistic Wallet / Koban Balance helpers so the top-bar balance chip never displays
 * "•••" or shifts width on startup.
 */
export function readOptimisticWalletSnapshot(uid?: string | null): OptimisticWalletSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_KNOWN_WALLET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OptimisticWalletSnapshot;
    if (!parsed || typeof parsed.balance !== 'number') return null;
    if (uid && parsed.uid && parsed.uid !== uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeOptimisticWalletSnapshot(snapshot: Omit<OptimisticWalletSnapshot, 'updatedAt'>): void {
  if (typeof window === 'undefined' || !snapshot?.uid) return;
  try {
    const record: OptimisticWalletSnapshot = {
      ...snapshot,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(LAST_KNOWN_WALLET_KEY, JSON.stringify(record));
  } catch {
    // Ignore
  }
}

/**
 * Consumes the early `/api/posts` promise kicked off inline in `index.html`
 * before the main JS bundle finished parsing.
 */
export function consumeEarlyPostsFetch(): Promise<Record<string, any> | null> | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    __BOARDLY_EARLY_POSTS__?: Promise<Record<string, any> | null> | null;
  };
  const promise = win.__BOARDLY_EARLY_POSTS__ || null;
  if (promise) {
    win.__BOARDLY_EARLY_POSTS__ = null;
  }
  return promise;
}

/**
 * Consumes the early `/api/universities` promise kicked off inline in `index.html`.
 */
export function consumeEarlyUniversitiesFetch(): Promise<Record<string, any> | null> | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    __BOARDLY_EARLY_UNIVERSITIES__?: Promise<Record<string, any> | null> | null;
  };
  const promise = win.__BOARDLY_EARLY_UNIVERSITIES__ || null;
  if (promise) {
    win.__BOARDLY_EARLY_UNIVERSITIES__ = null;
  }
  return promise;
}

// ─── Route Chunk & Data Prefetching for Instant Tab Switching ───────────────
const prefetchedTabs = new Set<string>();

export function prefetchTabRouteAndData(tabId: string, uid?: string | null): void {
  const key = `${tabId}:${uid || 'anon'}`;
  if (prefetchedTabs.has(key)) return;
  prefetchedTabs.add(key);

  switch (tabId) {
    case 'commons': {
      void import('@/pages/commons/CommonsFeedPage').catch(() => {});
      void import('@/services/commonsService')
        .then((m) => m.fetchCommonsPosts({ feedTab: 'all', pageSize: 15, currentUid: uid }))
        .catch(() => {});
      break;
    }
    case 'home':
    case 'overview': {
      void import('@/pages/dashboard/OverviewPage').catch(() => {});
      void import('@/services/universityMcqService')
        .then((m) => m.fetchUniversities())
        .catch(() => {});
      break;
    }
    case 'practice': {
      void import('@/pages/dashboard/PracticePage').catch(() => {});
      void import('@/services/universityMcqService')
        .then((m) => m.fetchUniversities())
        .catch(() => {});
      break;
    }
    case 'notifications': {
      void import('@/pages/dashboard/NotificationsPage').catch(() => {});
      if (uid && !uid.startsWith('guest_')) {
        void import('@/services/notificationService')
          .then((m) => m.syncUserNotificationsStore(uid))
          .catch(() => {});
      }
      break;
    }
    case 'streaks': {
      void import('@/pages/dashboard/StreaksPage').catch(() => {});
      break;
    }
    case 'messages': {
      void import('@/pages/dashboard/MessagesPage').catch(() => {});
      break;
    }
    case 'crew': {
      void import('@/pages/crew/CrewDashboardPage').catch(() => {});
      break;
    }
    case 'profile': {
      void import('@/pages/dashboard/ProfilePage').catch(() => {});
      break;
    }
    default:
      break;
  }
}

let idlePrefetchScheduled = false;

/**
 * Schedules background prefetching of core dock tabs after initial paint + idle
 * so the first tap on any bottom-nav tab is instant.
 */
export function scheduleIdleTabPrefetch(uid?: string | null): void {
  if (typeof window === 'undefined' || idlePrefetchScheduled) return;
  // Respect Data Saver mode on mobile connections
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g') {
    return;
  }
  idlePrefetchScheduled = true;

  const runPrefetch = () => {
    const tabs = ['commons', 'home', 'streaks', 'messages', 'crew'];
    tabs.forEach((tab, idx) => {
      setTimeout(() => {
        prefetchTabRouteAndData(tab, uid);
      }, idx * 180);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPrefetch, { timeout: 2500 });
  } else {
    setTimeout(runPrefetch, 1200);
  }
}
