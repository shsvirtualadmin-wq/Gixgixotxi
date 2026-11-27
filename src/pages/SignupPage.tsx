import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { LineLoader } from '@/components/ui/LineLoader';
import {
  getAddAccountPrefillEmail,
  isAddAccountUrl,
  shouldAutoRedirectFromAuthScreen,
} from '@/utils/savedAccounts';

import {
  clearPostLoginRedirect,
  persistPostLoginRedirect,
  readPostLoginRedirect,
  resolvePostAuthDestination,
  sanitizeRedirectTarget,
} from '@/utils/routeGuards';

export function SignupPage() {
  const {
    user,
    profile,
    isGuest,
    profileLoading,
    tokenClaims,
    isAdmin,
    isSuperAdmin,
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

  if (isAddAccountFlow && initialUidRef.current === null && user?.uid) {
    initialUidRef.current = user.uid;
  }

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (isAddAccountFlow) {
        clearPostLoginRedirect();
        return;
      }
      const redirectParam = sanitizeRedirectTarget(
        searchParams.get('redirect') || searchParams.get('returnTo')
      );
      if (redirectParam) {
        persistPostLoginRedirect(redirectParam);
      }
    } catch {
      // Ignore storage errors
    }
  }, [location.search, isAddAccountFlow]);

  // Only redirect once verification completes AND not blocked by Add Account flow
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
      : sanitizeRedirectTarget(searchParams.get('redirect') || searchParams.get('returnTo'));
    const storedRedirect = isAddAccountFlow ? null : readPostLoginRedirect();
    const pendingCrew = isAddAccountFlow
      ? null
      : sessionStorage.getItem('pending_join_crew_code');
    const intendedTarget = redirectParam || storedRedirect;

    if (!intendedTarget && !isGuest && !tokenClaims?.verified) {
      return;
    }

    const effectiveRole = isSuperAdmin
      ? 'super_admin'
      : isAdmin
      ? 'admin'
      : profile?.role || 'student';

    const needsOnboarding = Boolean(
      profile &&
        !profile.isGuest &&
        !profile.onboardingCompleted &&
        effectiveRole === 'student' &&
        !isAdmin &&
        !isSuperAdmin
    );

    const { destination: dest, shouldClearStoredRedirect } = resolvePostAuthDestination({
      isAddAccountFlow,
      redirectParam,
      storedRedirect,
      pendingCrewCode: pendingCrew,
      needsOnboarding,
      roleDefaultUrl: profile ? getRoleRedirectUrl(effectiveRole) : '/dashboard',
    });

    if (shouldClearStoredRedirect) {
      clearPostLoginRedirect();
    }
    navigate(dest, { replace: true });
  }, [
    isAddAccountFlow,
    hasCompletedNewAuthSubmit,
    submittedTargetUid,
    user,
    profile,
    isGuest,
    profileLoading,
    tokenClaims?.verified,
    isAdmin,
    isSuperAdmin,
    isSessionVerified,
    location.search,
    navigate,
    getRoleRedirectUrl,
  ]);

  const handleCancelAddAccount = () => {
    const searchParams = new URLSearchParams(location.search);
    const fromParam = sanitizeRedirectTarget(searchParams.get('from'));
    if (fromParam) {
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
        title={isAddAccountFlow ? 'Add Account — Boardly' : 'Create Free Student Account — Boardly'}
        description="Join Boardly for free to practice Class 11 & 12 board and university entrance exam MCQs, download notes, and study with your campus crew."
        canonicalPath="/signup"
      />
      {showRedirectLoader ? (
        <LineLoader context="signup" variant="section" />
      ) : (
        <AuthCard
          initialMode="signup"
          isAddAccountFlow={isAddAccountFlow}
          initialEmail={prefillEmail}
          initialUid={initialUidRef.current}
          disableAutoRedirect={true}
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

export default SignupPage;
