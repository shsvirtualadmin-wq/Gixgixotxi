import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';
import { perfMarkStart } from '@/lib/perfMetrics';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateAdminRouteAccess,
  persistPostLoginRedirect,
} from '@/utils/routeGuards';

interface AdminGuardProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Strict fail-closed route guard backed ONLY by verified Firebase Auth custom claims
 * (`token.admin === true` or `token.superAdmin === true`).
 * - Normal users visiting `/admin` or `/superadmin` are immediately redirected to `/dashboard`
 *   before any child component mounts or fetches admin data.
 * - Regular admins visiting `/superadmin` or `requireSuperAdmin` routes are redirected to `/admin`.
 */
export function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const {
    user,
    isGuest,
    authStatus,
    profileLoading,
    tokenClaims,
    isAdmin,
    isSuperAdmin,
    otpVerificationState,
    isSessionVerified,
  } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      perfMarkStart('admin_student_count');
    }
  }, [location.pathname]);

  const hasSuperAdmin = isSuperAdmin || tokenClaims?.superAdmin === true;
  const hasAdmin = hasSuperAdmin || isAdmin || tokenClaims?.admin === true;

  const decision = evaluateAdminRouteAccess({
    pathname: location.pathname,
    authStatus,
    profileLoading,
    hasUser: Boolean(user),
    isGuest,
    tokenClaimsVerified: Boolean(tokenClaims?.verified),
    isAdmin: hasAdmin,
    isSuperAdmin: hasSuperAdmin,
    otpStatus: otpVerificationState.status,
    otpPurpose: otpVerificationState.purpose,
    isSessionVerified,
    requireSuperAdmin,
  });

  if (decision.action === 'loading') {
    return <RoutePageSkeleton pathname={location.pathname} />;
  }

  if (decision.action === 'redirect_login' || decision.action === 'redirect_verify_email') {
    const fullTarget = buildFullPath(location.pathname, location.search, location.hash);
    persistPostLoginRedirect(fullTarget);
    const dest =
      decision.action === 'redirect_verify_email'
        ? '/verify-email'
        : buildLoginRedirectUrl(location.pathname, location.search, location.hash);
    return <Navigate to={dest} replace />;
  }

  // Fail closed: normal users (neither admin nor superAdmin claim) are redirected immediately
  if (decision.action === 'redirect_dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // SuperAdmin-only gate: regular admins are redirected to /admin
  if (decision.action === 'redirect_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  return <AdminGuard requireSuperAdmin>{children}</AdminGuard>;
}

export default AdminGuard;
