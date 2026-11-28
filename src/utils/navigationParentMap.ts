import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType, type NavigateFunction } from 'react-router-dom';

const SETTINGS_ENTRY_STORAGE_KEY = 'boardly_settings_entry_route_v1';

let lastRecordedSettingsEntryRoute: string | null = null;

/**
 * Normalize a pathname by removing trailing slashes (except root "/")
 * and stripping query/hash suffixes if accidentally passed.
 */
export function normalizeRoutePath(rawPath: string): string {
  const withoutHash = rawPath.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  const ensuredLeading = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (ensuredLeading.length > 1 && ensuredLeading.endsWith('/')) {
    return ensuredLeading.replace(/\/+$/, '') || '/';
  }
  return ensuredLeading;
}

/**
 * Single source of truth for explicit static parent routes across Boardly.
 * Every nested settings route and static nested page maps to its direct parent.
 * Dynamic/parameterized routes are resolved in `getStaticParentRoute()` below.
 * Root `/settings` and `/dashboard/settings` resolve dynamically to the recorded
 * non-settings home/dashboard entry route (default "/").
 */
export const PARENT_ROUTE_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Settings hierarchy (/settings/*)
  '/settings/customize': '/settings',
  '/settings/appearance': '/settings/customize',
  '/settings/theme': '/settings/customize',
  '/settings/kobans': '/settings/customize',
  '/settings/koban': '/settings/customize',
  '/settings/koban-icon': '/settings/customize',
  '/settings/pro-badge': '/settings/customize',
  '/settings/plus-badge': '/settings/customize',
  '/settings/boardly-plus': '/settings',
  '/settings/account': '/settings',
  '/settings/email': '/settings',
  '/settings/plan': '/settings',
  '/settings/display-name': '/settings/account',
  '/settings/username': '/settings/account',
  '/settings/general': '/settings',
  '/settings/usage': '/settings',
  '/settings/limits': '/settings',
  '/settings/notifications': '/settings',
  '/settings/security': '/settings',
  '/settings/login': '/settings',
  '/settings/2fa': '/settings',
  '/settings/password': '/settings',
  '/settings/sessions': '/settings',
  '/settings/passkeys': '/settings',
  '/settings/privacy': '/settings',
  '/settings/legal': '/settings',
  '/settings/boardly-ai': '/settings/privacy',
  '/settings/ai': '/settings/privacy',

  // Dashboard-prefixed Settings hierarchy (/dashboard/settings/*)
  '/dashboard/settings/customize': '/dashboard/settings',
  '/dashboard/settings/appearance': '/dashboard/settings/customize',
  '/dashboard/settings/theme': '/dashboard/settings/customize',
  '/dashboard/settings/kobans': '/dashboard/settings/customize',
  '/dashboard/settings/koban': '/dashboard/settings/customize',
  '/dashboard/settings/koban-icon': '/dashboard/settings/customize',
  '/dashboard/settings/pro-badge': '/dashboard/settings/customize',
  '/dashboard/settings/plus-badge': '/dashboard/settings/customize',
  '/dashboard/settings/boardly-plus': '/dashboard/settings',
  '/dashboard/settings/account': '/dashboard/settings',
  '/dashboard/settings/email': '/dashboard/settings',
  '/dashboard/settings/plan': '/dashboard/settings',
  '/dashboard/settings/display-name': '/dashboard/settings/account',
  '/dashboard/settings/username': '/dashboard/settings/account',
  '/dashboard/settings/general': '/dashboard/settings',
  '/dashboard/settings/usage': '/dashboard/settings',
  '/dashboard/settings/limits': '/dashboard/settings',
  '/dashboard/settings/notifications': '/dashboard/settings',
  '/dashboard/settings/security': '/dashboard/settings',
  '/dashboard/settings/login': '/dashboard/settings',
  '/dashboard/settings/2fa': '/dashboard/settings',
  '/dashboard/settings/password': '/dashboard/settings',
  '/dashboard/settings/sessions': '/dashboard/settings',
  '/dashboard/settings/passkeys': '/dashboard/settings',
  '/dashboard/settings/privacy': '/dashboard/settings',
  '/dashboard/settings/legal': '/dashboard/settings',
  '/dashboard/settings/boardly-ai': '/dashboard/settings/privacy',
  '/dashboard/settings/ai': '/dashboard/settings/privacy',

  // Boardly Plus / Plans & Billing
  '/dashboard/plan': '/settings',
  '/dashboard/plans': '/settings',
  '/wallet': '/settings',
  '/checkout': '/settings',

  // Profile
  '/profile/edit': '/profile',
  '/profile': '/dashboard',

  // AI Mentors & Dashboard sub-pages
  '/dashboard/ai': '/dashboard',
  '/dashboard/practice': '/dashboard',
  '/dashboard/notifications': '/dashboard',
  '/dashboard/messages': '/dashboard',
  '/dashboard/streaks': '/dashboard',
  '/dashboard/history': '/dashboard',
  '/dashboard/results': '/dashboard',
  '/dashboard/certificates': '/dashboard',
  '/dashboard/store': '/dashboard',
  '/dashboard/locker': '/dashboard',
  '/dashboard/arena': '/dashboard',
  '/dashboard/crew': '/dashboard',
  '/dashboard/captain': '/dashboard',
  '/dashboard/ambassador': '/dashboard',
  '/dashboard/formulas': '/dashboard',
  '/dashboard/formula-vault': '/dashboard',
  '/dashboard/bookmarks': '/dashboard',
  '/dashboard/commons': '/dashboard',
  '/dashboard/past-papers': '/dashboard',
  '/dashboard/merit-meter': '/dashboard',
  '/dashboard/study-circles': '/dashboard',

  // Top-level login-only & app pages
  '/practice': '/dashboard',
  '/results': '/dashboard',
  '/certificates': '/dashboard',
  '/messages': '/dashboard',
  '/locker': '/dashboard',
  '/notifications': '/dashboard',
  '/bookmarks': '/dashboard',
  '/saved': '/commons',
  '/crew/my': '/crew',
  '/crew/dashboard': '/crew',
  '/crew/apply': '/crew',
  '/captain/apply': '/captains',
  '/captains/apply': '/captains',
  '/captain/leaderboard': '/captains',
  '/captains/leaderboard': '/captains',

  // Store & Kobans
  '/store/get-kobans': '/store',
  '/kobans': '/store',
  '/store': '/dashboard',
  '/rewards': '/dashboard',

  // Commons & Material Library & Formula Vault
  '/commons/new': '/commons',
  '/commons/trending': '/commons',
  '/commons/following': '/commons',
  '/commons/about': '/commons',
  '/commons/guidelines': '/commons',
  '/guidelines': '/commons',
  '/material': '/commons',
  '/study-material': '/commons',
  '/formulas': '/dashboard',
  '/formula-vault': '/dashboard',

  // Grand Line & Leaderboard
  '/grand-line/about': '/grand-line',
  '/grand-line/leaderboard': '/grand-line',
  '/leaderboard': '/grand-line',

  // Auth & Onboarding
  '/forgot-password': '/login',
  '/verify-email': '/login',
  '/onboarding': '/dashboard',
});

const NON_RECORDABLE_SETTINGS_ENTRY_PREFIXES = [
  '/settings',
  '/dashboard/settings',
  '/dashboard/plan',
  '/dashboard/plans',
  '/wallet',
  '/checkout',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/onboarding',
  '/410',
];

export function isSettingsPath(pathname: string): boolean {
  const path = normalizeRoutePath(pathname);
  return (
    path === '/settings' ||
    path.startsWith('/settings/') ||
    path === '/dashboard/settings' ||
    path.startsWith('/dashboard/settings/')
  );
}

export function isSettingsRootPath(pathname: string): boolean {
  const path = normalizeRoutePath(pathname);
  return path === '/settings' || path === '/dashboard/settings';
}

function isRecordableSettingsEntry(pathname: string): boolean {
  const path = normalizeRoutePath(pathname);
  for (const prefix of NON_RECORDABLE_SETTINGS_ENTRY_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return false;
    }
  }
  return true;
}

/**
 * Records the last non-settings route the user visited before entering Settings,
 * so exiting `/settings` returns to the home/dashboard page they came from.
 */
export function recordSettingsEntryRoute(pathname: string): void {
  const path = normalizeRoutePath(pathname);
  if (!isRecordableSettingsEntry(path)) {
    return;
  }
  lastRecordedSettingsEntryRoute = path;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SETTINGS_ENTRY_STORAGE_KEY, path);
    } catch {
      // Ignore storage errors (private mode / restricted iframe)
    }
  }
}

/**
 * Returns the recorded non-settings entry route for exiting `/settings`,
 * defaulting to "/".
 */
export function getSettingsEntryRoute(defaultRoute = '/'): string {
  const fallback = normalizeRoutePath(defaultRoute);
  if (lastRecordedSettingsEntryRoute && isRecordableSettingsEntry(lastRecordedSettingsEntryRoute)) {
    return lastRecordedSettingsEntryRoute;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(SETTINGS_ENTRY_STORAGE_KEY);
      if (stored) {
        const normalized = normalizeRoutePath(stored);
        if (isRecordableSettingsEntry(normalized)) {
          lastRecordedSettingsEntryRoute = normalized;
          return normalized;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return fallback;
}

/**
 * Resolves static & parameterized parent routes (excluding root `/settings` entry lookup).
 * Returns null if the route has no explicit nested parent and should fall back to home.
 */
export function getStaticParentRoute(pathname: string): string | null {
  const path = normalizeRoutePath(pathname);

  if (Object.prototype.hasOwnProperty.call(PARENT_ROUTE_MAP, path)) {
    return PARENT_ROUTE_MAP[path];
  }

  // Any other nested settings page -> direct parent
  if (path.startsWith('/settings/notifications/')) {
    return '/settings/notifications';
  }
  if (path.startsWith('/settings/')) {
    return '/settings';
  }
  if (path.startsWith('/dashboard/settings/notifications/')) {
    return '/dashboard/settings/notifications';
  }
  if (path.startsWith('/dashboard/settings/')) {
    return '/dashboard/settings';
  }

  // Dynamic / parameterized nested routes
  if (path.startsWith('/dashboard/formulas/')) return '/dashboard/formulas';
  if (path.startsWith('/dashboard/formula-vault/')) return '/dashboard/formula-vault';
  if (path.startsWith('/formulas/')) return '/formulas';
  if (path.startsWith('/formula-vault/')) return '/formula-vault';

  if (path.startsWith('/dashboard/messages/')) return '/dashboard/messages';
  if (path.startsWith('/messages/')) return '/messages';

  if (path.startsWith('/dashboard/results/')) return '/dashboard/results';
  if (path.startsWith('/dashboard/history/')) return '/dashboard/history';
  if (path.startsWith('/results/')) return '/dashboard/results';
  if (/^\/test\/[^/]+\/result$/.test(path)) return '/dashboard/results';
  if (path.startsWith('/test/')) return '/dashboard/practice';

  if (path.startsWith('/dashboard/store/')) return '/dashboard/store';
  if (path.startsWith('/store/')) return '/store';

  if (path.startsWith('/dashboard/bookmarks/')) return '/dashboard/bookmarks';
  if (path.startsWith('/bookmarks/')) return '/bookmarks';

  if (path.startsWith('/material/')) return '/material';
  if (path.startsWith('/study-material/')) return '/study-material';

  if (path.startsWith('/commons/')) return '/commons';

  if (path.startsWith('/grand-line/') || path.startsWith('/tests/')) return '/grand-line';

  if (path.startsWith('/captains/')) return '/captains';
  if (path.startsWith('/crew/') || path.startsWith('/join/')) return '/crew';

  if (path.startsWith('/verify/')) return '/verify';

  if (path.startsWith('/u/') || path.startsWith('/profile/') || path.startsWith('/user/') || path.startsWith('/users/')) {
    return '/dashboard';
  }

  // MCQs / Subjects / Practice multi-segment hierarchy
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'mcqs' || segments[0] === 'subjects' || segments[0] === 'practice') {
    if (segments.length >= 4) {
      return `/${segments[0]}/${segments[2]}`;
    }
    if (segments.length === 3) {
      return `/${segments[0]}/${segments[1]}`;
    }
    if (segments.length === 2) {
      return `/${segments[0]}`;
    }
  }

  // Admin & Superadmin sub-pages
  if (path.startsWith('/admin/wallets/')) return '/admin/wallets';
  if (path.startsWith('/admin/')) return '/admin';
  if (path.startsWith('/superadmin/')) return '/superadmin';

  return null;
}

export interface ParentRouteOptions {
  /** Fallback destination for top-level pages without a specific parent (default "/"). */
  fallbackHome?: string;
}

/**
 * Resolves the explicit parent route for ANY path in Boardly using the single
 * shared parent map. Never relies on history.back() or navigate(-1).
 */
export function getParentRoute(pathname: string, options?: ParentRouteOptions): string {
  const path = normalizeRoutePath(pathname);
  const fallbackHome = normalizeRoutePath(options?.fallbackHome || '/');

  // Root Settings always exits to the home/dashboard page the user came from (default "/")
  if (isSettingsRootPath(path)) {
    return getSettingsEntryRoute('/');
  }

  const staticParent = getStaticParentRoute(path);
  if (staticParent) {
    return staticParent;
  }

  // Top-level public/dashboard pages fall back to home
  if (path === '/dashboard' || path === '/') {
    return '/';
  }

  return fallbackHome;
}

/**
 * Navigates to the explicit parent route using `replace: true` so back-button
 * clicks never push duplicate entries or create navigation loops.
 */
export function navigateToParentRoute(
  navigate: NavigateFunction,
  pathname: string,
  options?: ParentRouteOptions
): string {
  const parent = getParentRoute(pathname, options);
  navigate(parent, { replace: true });
  return parent;
}

/**
 * React hook returning a loop-free back handler that always navigates to the
 * current route's explicit parent with `{ replace: true }`.
 */
export function useParentBack(options?: ParentRouteOptions): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackHome = options?.fallbackHome;

  return useCallback(() => {
    navigateToParentRoute(navigate, location.pathname, { fallbackHome });
  }, [navigate, location.pathname, fallbackHome]);
}

function readHistoryIdx(): number | null {
  if (typeof window === 'undefined') return null;
  const idx = window.history.state?.idx;
  return typeof idx === 'number' ? idx : null;
}

/**
 * Global navigation guard mounted once inside BrowserRouter (`AppInner`).
 * 1. Tracks the last non-settings entry route so `/settings` exits cleanly to where
 *    the user came from (default "/").
 * 2. Intercepts browser / phone system Back (`POP` navigations) so leaving `/settings`
 *    or any nested settings/mapped page always follows `PARENT_ROUTE_MAP` with
 *    `replace: true` and can NEVER re-enter a nested settings page or loop.
 */
export function useParentNavigationGuard(): void {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const prevRef = useRef<{
    pathname: string;
    key: string;
    idx: number | null;
  }>({
    pathname: normalizeRoutePath(location.pathname),
    key: location.key,
    idx: readHistoryIdx(),
  });

  useEffect(() => {
    const currentPath = normalizeRoutePath(location.pathname);
    const currentIdx = readHistoryIdx();
    const prev = prevRef.current;

    // Initial mount or hash-only change on the same history entry: never redirect, only record entry route.
    if (prev.key === location.key && prev.pathname === currentPath) {
      if (isRecordableSettingsEntry(currentPath)) {
        recordSettingsEntryRoute(currentPath);
      }
      return;
    }

    // Update ref right away; if we redirect below, the subsequent REPLACE render updates it again.
    prevRef.current = {
      pathname: currentPath,
      key: location.key,
      idx: currentIdx,
    };

    if (navigationType !== 'POP') {
      if (isRecordableSettingsEntry(currentPath)) {
        recordSettingsEntryRoute(currentPath);
      }
      return;
    }

    // Distinguish browser Back vs browser Forward using React Router's history state idx.
    const isBrowserForward =
      typeof currentIdx === 'number' && typeof prev.idx === 'number' && currentIdx > prev.idx;
    if (isBrowserForward) {
      if (isRecordableSettingsEntry(currentPath)) {
        recordSettingsEntryRoute(currentPath);
      }
      return;
    }

    const prevPath = prev.pathname;

    // 1. Leaving Settings root via browser/phone Back must NEVER re-enter any nested settings page
    //    and must always go to the recorded home/dashboard entry route (default "/").
    if (isSettingsRootPath(prevPath)) {
      const expectedParent = getParentRoute(prevPath);
      if (currentPath !== expectedParent) {
        navigate(expectedParent, { replace: true });
        return;
      }
      if (isRecordableSettingsEntry(currentPath)) {
        recordSettingsEntryRoute(currentPath);
      }
      return;
    }

    // 2. Leaving any nested settings page via browser/phone Back must always follow the parent map.
    if (isSettingsPath(prevPath)) {
      const expectedParent = getParentRoute(prevPath);
      if (currentPath !== expectedParent) {
        navigate(expectedParent, { replace: true });
        return;
      }
      return;
    }

    // 3. Leaving any other explicitly mapped nested page via browser/phone Back:
    //    if history popped onto a duplicate of the same page (because an earlier UI back used replace: true)
    //    or bounced back into a child of the page we just left, redirect to the explicit parent.
    const staticParent = getStaticParentRoute(prevPath);
    if (staticParent) {
      const landedOnDuplicate = currentPath === prevPath;
      const landedOnChild = currentPath.startsWith(`${prevPath}/`);
      const landedInSettingsFromSettingsChild =
        isSettingsPath(staticParent) && isSettingsPath(currentPath) && currentPath !== staticParent;

      if (landedOnDuplicate || landedOnChild || landedInSettingsFromSettingsChild) {
        navigate(staticParent, { replace: true });
        return;
      }
    }

    if (isRecordableSettingsEntry(currentPath)) {
      recordSettingsEntryRoute(currentPath);
    }
  }, [location.pathname, location.key, navigationType, navigate]);
}
