import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { CrewApplyPage } from '@/pages/crew/CrewApplyPage';
import { CaptainApplyPage } from '@/pages/captain/CaptainApplyPage';

interface RoleGuardProps {
  requiredRole: 'crew' | 'captain';
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { user, profile, profileLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <Skeleton height={28} width="60%" />
          <div className="mt-4">
            <Skeleton height={14} count={4} />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login with return parameter
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Super admin can access anything
  if (isAdmin) {
    return <>{children}</>;
  }

  // If user has the required role
  if (profile?.role === requiredRole) {
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
