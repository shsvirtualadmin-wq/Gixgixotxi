import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LineLoader } from '@/components/ui/LineLoader';
import { CrewApplyPage } from '@/pages/crew/CrewApplyPage';
import { CaptainApplyPage } from '@/pages/captain/CaptainApplyPage';

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

  if (profileLoading) {
    return <LineLoader context="dashboard" variant="section" />;
  }

  // Not logged in or guest -> redirect to login with return parameter
  if (!user || isGuest) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Hierarchy: superAdmin > admin > captain > student (strictly from ID token custom claims)
  const hasCaptainOrAboveClaim =
    isSuperAdmin ||
    isAdmin ||
    isCaptain ||
    tokenClaims?.superAdmin === true ||
    tokenClaims?.admin === true ||
    tokenClaims?.captain === true;

  if (hasCaptainOrAboveClaim) {
    return <>{children}</>;
  }

  // If normal student opens Crew or Captain URL, show a clean Apply screen instead
  if (requiredRole === 'crew') {
    return <CrewApplyPage />;
  }

  if (requiredRole === 'captain') {
    return <CaptainApplyPage />;
  }

  return <Navigate to="/dashboard" replace />;
}

