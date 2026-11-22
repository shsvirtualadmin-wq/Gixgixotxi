import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';
import { CrewApplyPage } from '@/pages/crew/CrewApplyPage';

interface RoleGuardProps {
  requiredRole: 'crew' | 'captain';
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const {
    user,
    profileLoading,
    isCaptain,
    isAdmin,
    isSuperAdmin,
    tokenClaims,
    isGuest,
  } = useAuth();
  const location = useLocation();

  if (profileLoading || (Boolean(user) && !isGuest && !tokenClaims.verified)) {
    return <RoutePageSkeleton />;
  }

  // Not logged in or guest -> redirect to login with return parameter
  if (!user || isGuest) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    try {
      sessionStorage.setItem('boardly_post_login_redirect', target);
    } catch {
      // Ignore storage errors
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  // Hierarchy: superAdmin > admin > captain > student (strictly from ID token custom claims)
  // - superAdmin === true
  // - admin === true || superAdmin
  // - captain === true || admin || superAdmin
  const hasSuperAdmin = isSuperAdmin || tokenClaims?.superAdmin === true;
  const hasAdmin = hasSuperAdmin || isAdmin || tokenClaims?.admin === true;
  const hasCaptainOrAboveClaim =
    hasAdmin || isCaptain || tokenClaims?.captain === true;

  if (hasCaptainOrAboveClaim) {
    return <>{children}</>;
  }

  if (requiredRole === 'crew') {
    return <CrewApplyPage />;
  }

  // Normal users without captain/admin/superAdmin claim get redirected
  return <Navigate to="/dashboard" replace />;
}

