import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';

export function LoginPage() {
  const { user, profile, profileLoading, getRoleRedirectUrl } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to intended target or dashboard
  useEffect(() => {
    if (user && !profileLoading) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect');
      const pendingCrew = sessionStorage.getItem('pending_join_crew_code');

      let dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      if (redirectParam && redirectParam.startsWith('/')) {
        dest = redirectParam;
      } else if (pendingCrew) {
        dest = `/join/${pendingCrew}`;
      }

      logRedirect('/login', dest, 'LoginPage.tsx (authenticated)');
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, navigate, getRoleRedirectUrl]);

  return (
    <AuthLayout>
      <AuthCard initialMode="signin" />
    </AuthLayout>
  );
}

export default LoginPage;
