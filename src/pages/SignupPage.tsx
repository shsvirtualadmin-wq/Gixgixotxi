import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { LineLoader } from '@/components/ui/LineLoader';

export function SignupPage() {
  const {
    user,
    profile,
    profileLoading,
    isSessionVerified,
    otpVerificationState,
    getRoleRedirectUrl,
  } = useAuth();
  const navigate = useNavigate();

  // Only redirect once the 6-digit verification code has been verified
  useEffect(() => {
    if (user && !profileLoading && isSessionVerified) {
      if (profile && !profile.onboardingCompleted && profile.role === 'student') {
        navigate('/onboarding', { replace: true });
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect');
      const storedRedirect = sessionStorage.getItem('boardly_post_login_redirect');
      let dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      if (redirectParam && redirectParam.startsWith('/')) {
        dest = redirectParam;
      } else if (storedRedirect && storedRedirect.startsWith('/')) {
        dest = storedRedirect;
      }
      sessionStorage.removeItem('boardly_post_login_redirect');
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, isSessionVerified, navigate, getRoleRedirectUrl]);

  return (
    <AuthLayout>
      <PageMeta
        title="Create Free Student Account — Boardly"
        description="Join Boardly for free to practice Class 11 & 12 board and university entrance exam MCQs, download notes, and study with your campus crew."
        canonicalPath="/signup"
      />
      {user && (isSessionVerified || otpVerificationState.status === 'checking') ? (
        <LineLoader context="signup" variant="section" />
      ) : (
        <AuthCard initialMode="signup" />
      )}
    </AuthLayout>
  );
}

export default SignupPage;

