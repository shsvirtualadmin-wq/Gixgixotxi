import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';
import { CrewApplyPage } from '@/pages/crew/CrewApplyPage';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateRoleGuardAccess,
  persistPostLoginRedirect,
} from '@/utils/routeGuards';

interface RoleGuardProps {
  requiredRole: 'crew' | 'captain';
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const {
    user,
    authStatus,
    profileLoading,
    isCaptain,
    isAdmin,
    isSuperAdmin,
    tokenClaims,
    isGuest,
    otpVerificationState,
    isSessionVerified,
  } = useAuth();
  const location = useLocation();

  // Hierarchy: superAdmin > admin > captain > student (strictly from ID token custom claims)
  const hasSuperAdmin = isSuperAdmin || tokenClaims?.superAdmin === true;
  const hasAdmin = hasSuperAdmin || isAdmin || tokenClaims?.admin === true;
  const hasCaptainOrAboveClaim =
    hasAdmin || isCaptain || tokenClaims?.captain === true;

  const decision = evaluateRoleGuardAccess({
    requiredRole,
    authStatus,
    profileLoading,
    hasUser: Boolean(user),
    isGuest,
    tokenClaimsVerified: Boolean(tokenClaims?.verified),
    hasCaptainOrAbove: hasCaptainOrAboveClaim,
    otpStatus: otpVerificationState.status,
    otpPurpose: otpVerificationState.purpose,
    isSessionVerified,
  });

  if (decision.action === 'loading') {
    return <RoutePageSkeleton pathname={location.pathname} />;
  }

  if (decision.action === 'redirect_login' || decision.action === 'redirect_verify_email') {
    const target = buildFullPath(location.pathname, location.search, location.hash);
    persistPostLoginRedirect(target);
    const dest =
      decision.action === 'redirect_verify_email'
        ? '/verify-email'
        : buildLoginRedirectUrl(location.pathname, location.search, location.hash);
    return <Navigate to={dest} replace />;
  }

  if (decision.action === 'allow') {
    return <>{children}</>;
  }

  if (decision.action === 'show_crew_apply') {
    return <CrewApplyPage />;
  }

  // Normal users without captain/admin/superAdmin claim get redirected
  return <Navigate to="/dashboard" replace />;
}

