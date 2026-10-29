import { useCallback } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

const AUTH_CACHE_KEY = 'boardly_user_authenticated';

/**
 * Checks whether the current user is authenticated using the exact same auth state
 * as the rest of Boardly (`useAuth()` + Firebase `auth.currentUser` + the existing
 * `boardly_user_authenticated` flag in localStorage while auth state is still loading),
 * preventing any flash to "/" before login state is resolved.
 */
export function isUserAuthenticated(
  user?: { uid?: string } | null,
  profileLoading?: boolean
): boolean {
  if (user && (typeof user.uid === 'string' ? user.uid.length > 0 : true)) {
    return true;
  }

  // If auth state has finished loading and user is explicitly null, user is logged out
  if (user === null && profileLoading === false) {
    return false;
  }

  // While auth state is still loading (or outside React context), check synchronous
  // Firebase auth state and the existing localStorage session flag set by AuthContext
  if (auth?.currentUser) {
    return true;
  }

  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem(AUTH_CACHE_KEY) === 'true') {
        return true;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return false;
}

/**
 * Shared helper that returns the appropriate Home URL:
 * - "/dashboard/commons" if the user is authenticated (or while auth state is restoring for a logged-in session)
 * - "/" if not authenticated
 */
export function getHomeUrl(
  user?: { uid?: string } | null,
  profileLoading?: boolean
): '/dashboard/commons' | '/' {
  return isUserAuthenticated(user, profileLoading) ? '/dashboard/commons' : '/';
}

/**
 * React hook wrapper around `getHomeUrl()` connected to `useAuth()`.
 */
export function useHomeUrl(): '/dashboard/commons' | '/' {
  const { user, profileLoading } = useAuth();
  return getHomeUrl(user, profileLoading);
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
 * Navigates back using `window.history.back()` when there is in-app history,
 * and falls back to `getHomeUrl()` if there is none (e.g. opened directly in a new tab).
 */
export function navigateBackOrHome(
  navigate: NavigateFunction,
  user?: { uid?: string } | null,
  profileLoading?: boolean
): void {
  if (hasInAppHistory()) {
    window.history.back();
  } else {
    navigate(getHomeUrl(user, profileLoading));
  }
}

/**
 * React hook returning a smart back handler for page header back arrows (←).
 * Uses `window.history.back()` when in-app history exists, and falls back to `getHomeUrl()`.
 */
export function useSmartBack(): () => void {
  const navigate = useNavigate();
  const { user, profileLoading } = useAuth();
  return useCallback(() => {
    navigateBackOrHome(navigate, user, profileLoading);
  }, [navigate, user, profileLoading]);
}
