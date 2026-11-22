import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';
import { PageMeta } from '@/components/ui/PageMeta';
import { LineLoader } from '@/components/ui/LineLoader';

export function LoginPage() {
  const {
    user,
    profile,
    profileLoading,
    isSessionVerified,
    otpVerificationState,
    getRoleRedirectUrl,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
      if (redirectParam && redirectParam.startsWith('/')) {
        sessionStorage.setItem('boardly_post_login_redirect', redirectParam);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Only redirect to intended target or dashboard once session is verified
  useEffect(() => {
    if (user && !profileLoading && isSessionVerified) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
      const storedRedirect = sessionStorage.getItem('boardly_post_login_redirect');
      const pendingCrew = sessionStorage.getItem('pending_join_crew_code');
      const intendedTarget =
        (redirectParam && redirectParam.startsWith('/') ? redirectParam : null) ||
        (storedRedirect && storedRedirect.startsWith('/') ? storedRedirect : null);

      let dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      if (profile && !profile.isGuest && !profile.onboardingCompleted && profile.role === 'student') {
        dest = intendedTarget
          ? `/onboarding?redirect=${encodeURIComponent(intendedTarget)}`
          : '/onboarding';
      } else if (intendedTarget) {
        dest = intendedTarget;
        sessionStorage.removeItem('boardly_post_login_redirect');
      } else if (pendingCrew) {
        dest = `/join/${pendingCrew}`;
        sessionStorage.removeItem('boardly_post_login_redirect');
      } else {
        sessionStorage.removeItem('boardly_post_login_redirect');
      }

      logRedirect('/login', dest, 'LoginPage.tsx (authenticated & verified)');
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, isSessionVerified, navigate, getRoleRedirectUrl]);

  return (
    <AuthLayout>
      <PageMeta
        title="Sign In to Boardly — Entrance Exam & Board Test Preparation"
        description="Sign in to your Boardly account to practice timed MCQs, download study material, join Study Crews, and participate in Boardly Commons."
        canonicalPath="/login"
      />
      {user && (isSessionVerified || otpVerificationState.status === 'checking') ? (
        <LineLoader context="login" variant="section" />
      ) : (
        <AuthCard initialMode="signin" />
      )}
    </AuthLayout>
  );
}

export default LoginPage;

