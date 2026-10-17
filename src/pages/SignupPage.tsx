import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';

export function SignupPage() {
  const { user, profile, profileLoading, getRoleRedirectUrl } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (user && !profileLoading) {
      if (profile && !profile.onboardingCompleted && profile.role === 'student') {
        navigate('/onboarding', { replace: true });
        return;
      }
      const dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, navigate, getRoleRedirectUrl]);

  return (
    <AuthLayout>
      <AuthCard initialMode="signup" />
    </AuthLayout>
  );
}

export default SignupPage;
