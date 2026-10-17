import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';

export function LoginPage() {
  const { user, profile, profileLoading, getRoleRedirectUrl } = useAuth();
  const navigate = useNavigate();

  // If already logged in, immediately redirect to dashboard
  useEffect(() => {
    if (user && !profileLoading) {
      const dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      logRedirect('/login', dest, 'LoginPage.tsx (already authenticated)');
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
