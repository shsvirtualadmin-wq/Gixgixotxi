import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';
import { PageMeta } from '@/components/ui/PageMeta';
import { LineLoader } from '@/components/ui/LineLoader';
import {
  getAddAccountPrefillEmail,
  isAddAccountUrl,
  shouldAutoRedirectFromAuthScreen,
} from '@/utils/savedAccounts';

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
  const location = useLocation();

  const isAddAccountFlow = isAddAccountUrl(location.search);
  const prefillEmail = getAddAccountPrefillEmail(location.search);
  const initialUidRef = useRef<string | null>(null);
  const [hasCompletedNewAuthSubmit, setHasCompletedNewAuthSubmit] = useState(false);
  const [submittedTargetUid, setSubmittedTargetUid] = useState<string | null>(null);

  // Capture the UID that was already signed in when opening the Add Account flow
  if (isAddAccountFlow && initialUidRef.current === null && user?.uid) {
    initialUidRef.current = user.uid;
  }

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (isAddAccountFlow) {
        // Never carry over an old admin/page redirect URL into an Add Account flow
        sessionStorage.removeItem('boardly_post_login_redirect');
        return;
      }
      const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
      if (redirectParam && redirectParam.startsWith('/')) {
        sessionStorage.setItem('boardly_post_login_redirect', redirectParam);
      }
    } catch {
      // Ignore storage errors
    }
  }, [location.search, isAddAccountFlow]);

  // Only redirect to intended target or dashboard once session is verified AND not blocked by Add Account flow
  useEffect(() => {
    const canRedirect = shouldAutoRedirectFromAuthScreen({
      isAddAccountFlow,
      hasCompletedNewAuthSubmit,
      initialUid: initialUidRef.current,
      currentUid: user?.uid ?? null,
      profileUid: profile?.uid ?? null,
      profileLoading,
      isSessionVerified,
      submittedTargetUid,
    });
    if (!canRedirect) return;

    const searchParams = new URLSearchParams(location.search);
    const redirectParam = isAddAccountFlow
      ? null
      : searchParams.get('redirect') || searchParams.get('returnTo');
    const storedRedirect = isAddAccountFlow
      ? null
      : sessionStorage.getItem('boardly_post_login_redirect');
    const pendingCrew = isAddAccountFlow
      ? null
      : sessionStorage.getItem('pending_join_crew_code');
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
  }, [
    isAddAccountFlow,
    hasCompletedNewAuthSubmit,
    submittedTargetUid,
    user,
    profile,
    profileLoading,
    isSessionVerified,
    location.search,
    navigate,
    getRoleRedirectUrl,
  ]);

  const handleCancelAddAccount = () => {
    const searchParams = new URLSearchParams(location.search);
    const fromParam = searchParams.get('from');
    if (fromParam && fromParam.startsWith('/') && !fromParam.startsWith('/login')) {
      navigate(fromParam, { replace: true });
      return;
    }
    navigate('/settings', { replace: true });
  };

  const showRedirectLoader =
    !isAddAccountFlow
      ? Boolean(user && (isSessionVerified || otpVerificationState.status === 'checking'))
      : Boolean(
          hasCompletedNewAuthSubmit &&
            user &&
            (isSessionVerified || otpVerificationState.status === 'checking')
        );

  return (
    <AuthLayout>
      <PageMeta
        title={
          isAddAccountFlow
            ? 'Add Account — Boardly'
            : 'Sign In to Boardly — Entrance Exam & Board Test Preparation'
        }
        description="Sign in to your Boardly account to practice timed MCQs, download study material, join Study Crews, and participate in Boardly Commons."
        canonicalPath="/login"
      />
      {showRedirectLoader ? (
        <LineLoader context="login" variant="section" />
      ) : (
        <AuthCard
          initialMode="signin"
          isAddAccountFlow={isAddAccountFlow}
          initialEmail={prefillEmail}
          initialUid={initialUidRef.current}
          onAuthSubmitSuccess={(targetUid) => {
            setSubmittedTargetUid(targetUid ?? null);
            setHasCompletedNewAuthSubmit(true);
          }}
          onCancelAddAccount={isAddAccountFlow ? handleCancelAddAccount : undefined}
        />
      )}
    </AuthLayout>
  );
}

export default LoginPage;
