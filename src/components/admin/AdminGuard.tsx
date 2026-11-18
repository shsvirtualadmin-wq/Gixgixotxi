import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';

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
    profileLoading,
    tokenClaims,
    isAdmin,
    isSuperAdmin,
  } = useAuth();
  const location = useLocation();

  if (profileLoading || (Boolean(user) && !isGuest && !tokenClaims.verified)) {
    return <RoutePageSkeleton />;
  }

  if (!user || isGuest) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  const hasSuperAdmin = isSuperAdmin || tokenClaims?.superAdmin === true;
  const hasAdmin = hasSuperAdmin || isAdmin || tokenClaims?.admin === true;

  // Fail closed: normal users (neither admin nor superAdmin claim) are redirected immediately
  if (!hasAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // SuperAdmin-only gate: regular admins are redirected to /admin
  if ((requireSuperAdmin || location.pathname.startsWith('/superadmin')) && !hasSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  return <AdminGuard requireSuperAdmin>{children}</AdminGuard>;
}

export default AdminGuard;
