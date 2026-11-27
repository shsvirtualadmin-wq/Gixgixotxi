import type { AuthStatus, OtpVerificationState } from '@/contexts/AuthContext';

export const POST_LOGIN_REDIRECT_KEY = 'boardly_post_login_redirect';

const AUTH_LOOP_PREFIXES = ['/login', '/signup', '/forgot-password', '/verify-email'];

/**
 * Validates that a redirect target is a safe relative in-app path.
 * Rejects protocol-relative URLs (`//evil.com`), external URLs, control chars,
 * and auth-page loops (`/login`, `/signup`, `/forgot-password`, `/verify-email`).
 */
export function sanitizeRedirectTarget(raw?: string | null): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;
  if (/[\r\n\t]/.test(trimmed)) return null;

  const pathOnly = trimmed.split(/[?#]/)[0].toLowerCase();
  if (
    AUTH_LOOP_PREFIXES.some(
      (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }

  return trimmed;
}

export function buildFullPath(pathname: string, search = '', hash = ''): string {
  const safePath = pathname && pathname.startsWith('/') ? pathname : '/';
  return `${safePath}${search || ''}${hash || ''}`;
}

export function buildLoginRedirectUrl(pathname: string, search = '', hash = ''): string {
  const target = sanitizeRedirectTarget(buildFullPath(pathname, search, hash));
  if (!target) return '/login';
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function persistPostLoginRedirect(target: string): void {
  const safe = sanitizeRedirectTarget(target);
  if (!safe) return;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, safe);
    }
  } catch {
    // Ignore storage access errors (private mode / quota)
  }
}

export function readPostLoginRedirect(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sanitizeRedirectTarget(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY));
  } catch {
    return null;
  }
}

export function clearPostLoginRedirect(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export interface PostAuthDestinationInput {
  isAddAccountFlow?: boolean;
  redirectParam?: string | null;
  storedRedirect?: string | null;
  pendingCrewCode?: string | null;
  needsOnboarding?: boolean;
  roleDefaultUrl: string;
}

export interface PostAuthDestinationResult {
  destination: string;
  shouldClearStoredRedirect: boolean;
}

/**
 * Single source of truth for post-login / post-signup / post-verification routing.
 * Always preserves an explicit requested in-app route (including query & hash)
 * and keeps `boardly_post_login_redirect` intact if the user must complete onboarding first.
 */
export function resolvePostAuthDestination(
  input: PostAuthDestinationInput
): PostAuthDestinationResult {
  const {
    isAddAccountFlow = false,
    redirectParam = null,
    storedRedirect = null,
    pendingCrewCode = null,
    needsOnboarding = false,
    roleDefaultUrl,
  } = input;

  const safeRedirectParam = isAddAccountFlow ? null : sanitizeRedirectTarget(redirectParam);
  const safeStoredRedirect = isAddAccountFlow ? null : sanitizeRedirectTarget(storedRedirect);
  const intendedTarget = safeRedirectParam || safeStoredRedirect;

  if (needsOnboarding) {
    return {
      destination: intendedTarget
        ? `/onboarding?redirect=${encodeURIComponent(intendedTarget)}`
        : '/onboarding',
      // Keep stored redirect intact until onboarding completes
      shouldClearStoredRedirect: false,
    };
  }

  if (intendedTarget) {
    return {
      destination: intendedTarget,
      shouldClearStoredRedirect: true,
    };
  }

  const cleanCrewCode = !isAddAccountFlow && pendingCrewCode ? pendingCrewCode.trim() : '';
  if (cleanCrewCode) {
    return {
      destination: `/join/${encodeURIComponent(cleanCrewCode)}`,
      shouldClearStoredRedirect: true,
    };
  }

  return {
    destination: sanitizeRedirectTarget(roleDefaultUrl) || '/dashboard',
    shouldClearStoredRedirect: true,
  };
}

export type PublicLayoutDecision =
  | { action: 'render_public_layout' }
  | { action: 'render_app_layout' }
  | { action: 'loading_authenticated_home' }
  | { action: 'redirect'; target: string; clearPendingRedirect: boolean };

export interface PublicLayoutAccessInput {
  pathname: string;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  isOptimisticallyAuthenticated: boolean;
  pendingRedirect?: string | null;
}

/**
 * Pure route layout evaluator for `PublicLayout` (shared routes like `/`, `/leaderboard`, `/privacy`, etc.).
 * - Non-root routes NEVER redirect to `/dashboard/commons` or `/`.
 * - Signed-in reloads on shared routes stay in AppLayout without flashing public chrome or remounting.
 * - Authenticated visits to `/` honor a valid pending redirect target before defaulting to `/dashboard/commons`.
 */
export function evaluatePublicLayoutAccess(
  input: PublicLayoutAccessInput
): PublicLayoutDecision {
  const { pathname, sessionStatus, isOptimisticallyAuthenticated, pendingRedirect } = input;
  const isHomePage = pathname === '/' || pathname === '';

  if (isHomePage) {
    const safePending = sanitizeRedirectTarget(pendingRedirect);
    if (sessionStatus === 'authenticated') {
      if (safePending && safePending !== '/') {
        return { action: 'redirect', target: safePending, clearPendingRedirect: true };
      }
      return { action: 'redirect', target: '/dashboard/commons', clearPendingRedirect: false };
    }
    if (
      sessionStatus === 'loading' &&
      (isOptimisticallyAuthenticated || Boolean(safePending && safePending !== '/'))
    ) {
      return { action: 'loading_authenticated_home' };
    }
    return { action: 'render_public_layout' };
  }

  if (
    sessionStatus === 'authenticated' ||
    (sessionStatus === 'loading' && isOptimisticallyAuthenticated)
  ) {
    return { action: 'render_app_layout' };
  }

  return { action: 'render_public_layout' };
}

export type AdminRouteDecision =
  | { action: 'loading' }
  | { action: 'allow' }
  | { action: 'redirect_login' }
  | { action: 'redirect_verify_email' }
  | { action: 'redirect_dashboard' }
  | { action: 'redirect_admin' };

export interface AdminRouteAccessInput {
  pathname: string;
  authStatus: AuthStatus;
  profileLoading: boolean;
  hasUser: boolean;
  isGuest: boolean;
  tokenClaimsVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  otpStatus: OtpVerificationState['status'];
  otpPurpose?: OtpVerificationState['purpose'];
  isSessionVerified: boolean;
  requireSuperAdmin?: boolean;
}

/**
 * Pure, fail-closed route-access evaluator shared by `AdminGuard` and `AdminLayout`.
 * Never redirects a signed-in admin/superadmin while Firebase Auth, ID token claims,
 * or the OTP/2FA verification check are still hydrating on direct entry or refresh.
 */
export function evaluateAdminRouteAccess(input: AdminRouteAccessInput): AdminRouteDecision {
  const {
    pathname,
    authStatus,
    profileLoading,
    hasUser,
    isGuest,
    tokenClaimsVerified,
    isAdmin,
    isSuperAdmin,
    otpStatus,
    otpPurpose,
    isSessionVerified,
    requireSuperAdmin = false,
  } = input;

  // 1. Wait for auth persistence & profile hydration before making any redirect decision
  if (authStatus === 'loading' || profileLoading) {
    return { action: 'loading' };
  }

  // 2. For a signed-in non-guest user, wait until BOTH verified token claims AND
  //    the server OTP/2FA verification status have settled (never bounce on 'idle' or 'checking')
  if (
    hasUser &&
    !isGuest &&
    (!tokenClaimsVerified || otpStatus === 'idle' || otpStatus === 'checking')
  ) {
    return { action: 'loading' };
  }

  // 3. Unauthenticated or guest user -> redirect to login with full return URL
  if (!hasUser || isGuest) {
    return { action: 'redirect_login' };
  }

  // 4. Server explicitly confirmed OTP/2FA verification is pending
  if (otpStatus === 'pending' && !isSessionVerified) {
    return {
      action: otpPurpose === 'signup' ? 'redirect_verify_email' : 'redirect_login',
    };
  }

  // 5. Fail-closed role enforcement once claims are verified
  if (!isAdmin && !isSuperAdmin) {
    return { action: 'redirect_dashboard' };
  }

  // 6. SuperAdmin-only gate
  const needsSuperAdmin =
    requireSuperAdmin ||
    pathname === '/superadmin' ||
    pathname.startsWith('/superadmin/');
  if (needsSuperAdmin && !isSuperAdmin) {
    return { action: 'redirect_admin' };
  }

  return { action: 'allow' };
}

export type DashboardRouteDecision =
  | { action: 'loading' }
  | { action: 'allow' }
  | { action: 'redirect_login_clean' }
  | { action: 'redirect_public'; target: string }
  | { action: 'redirect_login' }
  | { action: 'redirect_verify_email' };

export interface DashboardRouteAccessInput {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  profileLoading: boolean;
  hasUser: boolean;
  isGuest: boolean;
  otpStatus: OtpVerificationState['status'];
  otpPurpose?: OtpVerificationState['purpose'];
  isSessionVerified: boolean;
  isSigningOut: boolean;
  publicEquivalent?: string | null;
}

/**
 * Pure route-access evaluator for `DashboardShell` (`/dashboard/*`, `/settings`, `/bookmarks`, etc.).
 * Keeps signed-in users on their exact URL across direct entry and browser refreshes while auth
 * and OTP verification settle, and only bounces when confirmed unauthenticated or OTP-pending.
 */
export function evaluateDashboardRouteAccess(
  input: DashboardRouteAccessInput
): DashboardRouteDecision {
  const {
    authStatus,
    isAuthenticated,
    profileLoading,
    hasUser,
    isGuest,
    otpStatus,
    otpPurpose,
    isSessionVerified,
    isSigningOut,
    publicEquivalent,
  } = input;

  if (isSigningOut) {
    return !hasUser && authStatus === 'unauthenticated'
      ? { action: 'redirect_login_clean' }
      : { action: 'loading' };
  }

  if (authStatus === 'loading') {
    return { action: 'loading' };
  }

  if (!hasUser && !isAuthenticated && profileLoading) {
    return { action: 'loading' };
  }

  if (authStatus === 'unauthenticated' && !isAuthenticated && !profileLoading && !hasUser) {
    if (publicEquivalent) {
      return { action: 'redirect_public', target: publicEquivalent };
    }
    return { action: 'redirect_login' };
  }

  // Signed-in non-guest user: wait while verification check hasn't resolved yet
  if (hasUser && !isGuest && (otpStatus === 'idle' || otpStatus === 'checking')) {
    return { action: 'loading' };
  }

  // Only redirect to verification/login when server explicitly confirmed verification is pending
  if (hasUser && !isGuest && otpStatus === 'pending' && !isSessionVerified) {
    return {
      action: otpPurpose === 'signup' ? 'redirect_verify_email' : 'redirect_login',
    };
  }

  return { action: 'allow' };
}

export type RoleGuardDecision =
  | { action: 'loading' }
  | { action: 'allow' }
  | { action: 'redirect_login' }
  | { action: 'redirect_verify_email' }
  | { action: 'show_crew_apply' }
  | { action: 'redirect_dashboard' };

export interface RoleGuardAccessInput {
  requiredRole: 'crew' | 'captain';
  authStatus: AuthStatus;
  profileLoading: boolean;
  hasUser: boolean;
  isGuest: boolean;
  tokenClaimsVerified: boolean;
  hasCaptainOrAbove: boolean;
  otpStatus: OtpVerificationState['status'];
  otpPurpose?: OtpVerificationState['purpose'];
  isSessionVerified: boolean;
}

export function evaluateRoleGuardAccess(input: RoleGuardAccessInput): RoleGuardDecision {
  const {
    requiredRole,
    authStatus,
    profileLoading,
    hasUser,
    isGuest,
    tokenClaimsVerified,
    hasCaptainOrAbove,
    otpStatus,
    otpPurpose,
    isSessionVerified,
  } = input;

  if (authStatus === 'loading' || profileLoading) {
    return { action: 'loading' };
  }

  if (
    hasUser &&
    !isGuest &&
    (!tokenClaimsVerified || otpStatus === 'idle' || otpStatus === 'checking')
  ) {
    return { action: 'loading' };
  }

  if (!hasUser || isGuest) {
    return { action: 'redirect_login' };
  }

  if (otpStatus === 'pending' && !isSessionVerified) {
    return {
      action: otpPurpose === 'signup' ? 'redirect_verify_email' : 'redirect_login',
    };
  }

  if (hasCaptainOrAbove) {
    return { action: 'allow' };
  }

  if (requiredRole === 'crew') {
    return { action: 'show_crew_apply' };
  }

  return { action: 'redirect_dashboard' };
}
