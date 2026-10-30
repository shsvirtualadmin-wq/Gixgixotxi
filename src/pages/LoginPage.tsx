import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlyLoader } from '@/components/ui/BoardlyLoader';

export function LoginPage() {
  const { user, profile, profileLoading, getRoleRedirectUrl } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to intended target or dashboard
  useEffect(() => {
    if (user && !profileLoading) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect');
      const storedRedirect = sessionStorage.getItem('boardly_post_login_redirect');
      const pendingCrew = sessionStorage.getItem('pending_join_crew_code');

      let dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      if (redirectParam && redirectParam.startsWith('/')) {
        dest = redirectParam;
      } else if (storedRedirect && storedRedirect.startsWith('/')) {
        dest = storedRedirect;
      } else if (pendingCrew) {
        dest = `/join/${pendingCrew}`;
      }

      sessionStorage.removeItem('boardly_post_login_redirect');
      logRedirect('/login', dest, 'LoginPage.tsx (authenticated)');
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, navigate, getRoleRedirectUrl]);

  return (
    <AuthLayout>
      <PageMeta
        title="Sign In to Boardly — Entrance Exam & Board Test Preparation"
        description="Sign in to your Boardly account to practice timed MCQs, download study material, join Study Crews, and participate in Boardly Commons."
        canonicalPath="/login"
      />
      {user ? (
        <BoardlyLoader
          variant="inline"
          messages={[
            'Loading Boardly...',
            'Setting up your workspace...',
            'Getting things ready...',
            'Almost there...',
          ]}
        />
      ) : (
        <AuthCard initialMode="signin" />
      )}
    </AuthLayout>
  );
}

export default LoginPage;

