import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { getParentRoute } from '@/utils/navigationParentMap';

const AUTH_CACHE_KEY = 'boardly_user_authenticated';
const GUEST_TOKEN_CACHE_KEY = 'boardly_guest_session_token';

export type SessionLayoutStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Checks whether the current user is authenticated using the exact same auth state
 * as the rest of Boardly (`useAuth()` + Firebase `auth.currentUser` + the existing
 * `boardly_user_authenticated` or guest token flag in localStorage while auth state is still loading),
 * preventing any flash to "/" before login state is resolved.
 */
export function isUserAuthenticated(
  user?: { uid?: string } | null,
  profileLoading?: boolean,
  authStatus?: SessionLayoutStatus
): boolean {
  if (authStatus === 'authenticated') {
    return true;
  }

  // If auth state has finished resolving as unauthenticated, never let a stale localStorage flag override it
  if (authStatus === 'unauthenticated') {
    return false;
  }

  if (user && (typeof user.uid === 'string' ? user.uid.length > 0 : true)) {
    return true;
  }

  // Check synchronous Firebase auth state and the localStorage session flag set by AuthContext (cleared on signOutUser)
  if (auth?.currentUser) {
    return true;
  }

  if (typeof window !== 'undefined') {
    try {
      if (
        window.localStorage.getItem(AUTH_CACHE_KEY) === 'true' ||
        Boolean(window.localStorage.getItem(GUEST_TOKEN_CACHE_KEY))
      ) {
        return true;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  // If user is explicitly null and profile is not loading (legacy callers without authStatus), user is logged out
  if (user === null && profileLoading === false) {
    return false;
  }

  return false;
}

/**
 * Resolves the tri-state session status so shared routes can avoid flashing
 * the public footer while session state is still being determined.
 */
export function getSessionStatus(
  user?: { uid?: string } | null,
  profileLoading?: boolean,
  authStatus?: SessionLayoutStatus
): SessionLayoutStatus {
  if (authStatus === 'loading') {
    return 'loading';
  }
  if (authStatus === 'authenticated') {
    return 'authenticated';
  }
  if (authStatus === 'unauthenticated') {
    return 'unauthenticated';
  }
  if (isUserAuthenticated(user, profileLoading, authStatus)) {
    return 'authenticated';
  }
  if (profileLoading) {
    return 'loading';
  }
  return 'unauthenticated';
}

export function useSessionStatus(): SessionLayoutStatus {
  const { user, profileLoading, authStatus } = useAuth();
  return getSessionStatus(user, profileLoading, authStatus);
}

/**
 * Shared helper that returns the appropriate Home URL:
 * - "/dashboard/commons" if the user is authenticated (or while auth state is restoring for a logged-in session)
 * - "/" if not authenticated
 */
export function getHomeUrl(
  user?: { uid?: string } | null,
  profileLoading?: boolean,
  authStatus?: SessionLayoutStatus
): '/dashboard/commons' | '/' {
  return isUserAuthenticated(user, profileLoading, authStatus) ? '/dashboard/commons' : '/';
}

/**
 * React hook wrapper around `getHomeUrl()` connected to `useAuth()`.
 */
export function useHomeUrl(): '/dashboard/commons' | '/' {
  const { user, profileLoading, authStatus } = useAuth();
  return getHomeUrl(user, profileLoading, authStatus);
}

/**
 * Checks if there is in-app browser history to go back to.
 */
export function hasInAppHistory(): boolean {
  if (typeof window === 'undefined') return false;
  const idx = window.history.state?.idx;
  if (typeof idx === 'number' && idx > 0) {
    return true;
  }
  return false;
}

/**
 * Navigates to the explicit parent route from the shared parent map using
 * `replace: true` so back buttons never call `history.back()` or build loops.
 */
export function navigateBackOrHome(
  navigate: NavigateFunction,
  user?: { uid?: string } | null,
  profileLoading?: boolean,
  currentPathname?: string
): void {
  const fallbackHome = getHomeUrl(user, profileLoading);
  const pathname =
    currentPathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const parent = getParentRoute(pathname, { fallbackHome });
  navigate(parent, { replace: true });
}

/**
 * React hook returning a loop-free back handler for page header back arrows (←).
 * Always navigates to the route's explicit parent from `PARENT_ROUTE_MAP` with `replace: true`.
 */
export function useSmartBack(): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileLoading } = useAuth();
  return useCallback(() => {
    navigateBackOrHome(navigate, user, profileLoading, location.pathname);
  }, [navigate, user, profileLoading, location.pathname]);
}
