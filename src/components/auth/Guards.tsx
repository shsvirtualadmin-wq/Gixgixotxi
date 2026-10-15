import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';

interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onNavigate?: (path: string) => void;
}

const CockpitLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 space-y-6">
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center space-y-2 flex-col text-center">
        <Skeleton variant="circular" width={64} height={64} className="mb-2" />
        <Skeleton variant="text" width={180} height={24} />
        <Skeleton variant="text" width={240} height={16} />
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton variant="rectangular" height={48} className="rounded-xl" />
        <Skeleton variant="rectangular" height={48} className="rounded-xl" />
        <Skeleton variant="rectangular" height={48} className="rounded-xl" />
      </Card>
    </div>
  </div>
);

/**
 * GuestGuard:
 * Allows unauthenticated visitors.
 * Redirects authenticated users to `/onboarding` (if incomplete) or their dashboard.
 */
export const GuestGuard: React.FC<GuardProps> = ({ children, onNavigate }) => {
  const { user, profile, loading, authLoading, profileLoading, isRegistered, isAdmin } = useAuth();
  const isLoading = loading || authLoading || profileLoading;

  React.useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        onNavigate?.('/admin');
      } else if (!isRegistered && profile?.onboardingCompleted !== true) {
        onNavigate?.('/onboarding');
      } else {
        onNavigate?.('/app');
      }
    }
  }, [isLoading, user, isRegistered, isAdmin, profile, onNavigate]);

  if (isLoading) {
    return <CockpitLoadingSkeleton />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
};

/**
 * AuthGuard:
 * Waits for auth + profile load (showing cockpit glass skeleton);
 * Redirects logged-out users to `/login`;
 * Signs out suspended users with exact message;
 * Redirects onboardingCompleted === false (except admin) to `/onboarding`.
 */
export const AuthGuard: React.FC<GuardProps> = ({ children, onNavigate }) => {
  const { user, profile, loading, authLoading, profileLoading, isRegistered, isAdmin, signOut, error } = useAuth();
  const isLoading = loading || authLoading || profileLoading;

  const isSuspended = Boolean(
    profile?.suspended === true ||
    (profile as any)?.isSuspended === true ||
    profile?.status === 'suspended'
  );

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('postLoginPath', window.location.pathname);
        }
        onNavigate?.('/login');
        return;
      }

      if (isSuspended) {
        signOut?.();
        return;
      }

      if (!isAdmin && !isRegistered && profile?.onboardingCompleted !== true) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
          onNavigate?.('/onboarding');
        }
      }
    }
  }, [isLoading, user, isSuspended, isAdmin, isRegistered, profile, signOut, onNavigate]);

  if (isLoading) {
    return <CockpitLoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (isSuspended || error?.code === 'auth/user-suspended') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <ErrorState
          title="Account Suspended"
          error="Your account has been suspended. Contact support@boardly.cfd."
          onRetry={() => {
            signOut?.();
            onNavigate?.('/login');
          }}
        />
      </div>
    );
  }

  if (!isAdmin && !isRegistered && profile?.onboardingCompleted !== true) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
      return null;
    }
  }

  return <>{children}</>;
};

/**
 * AdminGuard (/admin/*):
 * Strictly allows ONLY user.email?.toLowerCase() === "shsvirtualadmin@gmail.com".
 * Anyone else is redirected to /dashboard or /app.
 */
export const AdminGuard: React.FC<GuardProps> = ({ children, onNavigate }) => {
  const { user, loading, authLoading } = useAuth();
  const isLoading = loading || authLoading;
  const isMasterAdmin = (user?.email || '').trim().toLowerCase() === 'shsvirtualadmin@gmail.com';

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        onNavigate?.('/login');
      } else if (!isMasterAdmin) {
        onNavigate?.('/app');
      }
    }
  }, [isLoading, user, isMasterAdmin, onNavigate]);

  if (isLoading) {
    return <CockpitLoadingSkeleton />;
  }

  if (!user || !isMasterAdmin) {
    return null;
  }

  return <>{children}</>;
};

/**
 * CaptainGuard (/captain/*):
 * Allows only approved captains (or admin); otherwise redirects to /captain/apply or /app.
 */
export const CaptainGuard: React.FC<GuardProps> = ({ children, onNavigate }) => {
  const { user, profile, loading, authLoading, profileLoading, isAdmin } = useAuth();
  const isLoading = loading || authLoading || profileLoading;

  const isCaptain = Boolean(
    isAdmin ||
    profile?.role === 'captain' ||
    profile?.roles?.includes('captain') ||
    profile?.status === 'active' && profile?.role === 'captain'
  );

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        onNavigate?.('/login');
      } else if (!isCaptain) {
        onNavigate?.('/captain');
      }
    }
  }, [isLoading, user, isCaptain, onNavigate]);

  if (isLoading) {
    return <CockpitLoadingSkeleton />;
  }

  if (!user || !isCaptain) {
    return null;
  }

  return <>{children}</>;
};

/**
 * CrewGuard (/crew/*):
 * Allows only active crew members (isCrewMember === true or crewStatus === "approved" / "active", or admin);
 * Otherwise redirects to /crew/apply or /app.
 */
export const CrewGuard: React.FC<GuardProps> = ({ children, onNavigate }) => {
  const { user, profile, loading, authLoading, profileLoading, isAdmin } = useAuth();
  const isLoading = loading || authLoading || profileLoading;

  const isCrew = Boolean(
    isAdmin ||
    profile?.isCrewMember === true ||
    profile?.crewStatus === 'active' ||
    profile?.crewStatus === 'approved' ||
    profile?.role === 'crew' ||
    profile?.roles?.includes('crew')
  );

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        onNavigate?.('/login');
      } else if (!isCrew) {
        onNavigate?.('/crew');
      }
    }
  }, [isLoading, user, isCrew, onNavigate]);

  if (isLoading) {
    return <CockpitLoadingSkeleton />;
  }

  if (!user || !isCrew) {
    return null;
  }

  return <>{children}</>;
};
