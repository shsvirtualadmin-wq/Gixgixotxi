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
  getAddAccountReason,
  isAddAccountUrl,
  shouldAutoRedirectFromAuthScreen,
} from '@/utils/savedAccounts';

import { perfMarkEnd } from '@/lib/perfMetrics';
import {
  clearPostLoginRedirect,
  persistPostLoginRedirect,
  readPostLoginRedirect,
  resolvePostAuthDestination,
  sanitizeRedirectTarget,
} from '@/utils/routeGuards';

function preloadTargetChunksForDest(dest: string): Promise<unknown> {
  if (dest.startsWith('/superadmin')) {
    return Promise.allSettled([
      import('@/components/admin/AdminGuard'),
      import('@/components/admin/AdminLayout'),
      import('@/pages/admin/AdminUsersPage'),
    ]);
  }
  if (dest.startsWith('/admin')) {
    return Promise.allSettled([
      import('@/components/admin/AdminGuard'),
      import('@/components/admin/AdminLayout'),
      import('@/pages/admin/AdminOverviewPage'),
    ]);
  }
  return Promise.allSettled([
    import('@/components/dashboard/DashboardShell'),
    import('@/pages/dashboard/OverviewPage'),
  ]);
}

export function LoginPage() {
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
  const addAccountReason = getAddAccountReason(location.search);
  const initialUidRef = useRef<string | null>(null);
  const [hasCompletedNewAuthSubmit, setHasCompletedNewAuthSubmit] = useState(false);
  const [submittedTargetUid, setSubmittedTargetUid] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);

  // Capture the UID that was already signed in when opening the Add Account flow
  if (isAddAccountFlow && initialUidRef.current === null && user?.uid) {
    initialUidRef.current = user.uid;
  }

  // Warm the core dashboard shell chunk while the user is typing credentials so post-login redirect is instant (no second loading screen)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('@/components/dashboard/DashboardShell').catch(() => {});
      void import('@/pages/dashboard/OverviewPage').catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (isAddAccountFlow) {
        // Never carry over an old admin/page redirect URL into an Add Account flow
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

  // Only redirect to intended target or dashboard once session is verified AND not blocked by Add Account flow
  useEffect(() => {
    if (hasRedirectedRef.current) return;
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

    // Wait for verified role claims before deciding role-default or student-onboarding redirects
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

    let cancelled = false;

    // Ensure the target shell + page chunks are already loaded before navigating so React Router never shows a second Suspense loading screen.
    // Commit hasRedirectedRef and clear stored redirect ONLY when the navigation actually executes (never before async resolution,
    // otherwise a dependency update during preload cancels the effect and permanently strands the user on /login).
    void Promise.race([
      preloadTargetChunksForDest(dest),
      new Promise((resolve) => window.setTimeout(resolve, 300)),
    ]).finally(() => {
      if (cancelled || hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      if (shouldClearStoredRedirect) {
        clearPostLoginRedirect();
      }
      logRedirect('/login', dest, 'LoginPage.tsx (authenticated & verified)');
      perfMarkEnd('login_to_dashboard', { dest, role: effectiveRole });
      navigate(dest, { replace: true });
    });

    return () => {
      cancelled = true;
    };
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
          addAccountReason={addAccountReason}
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

export default LoginPage;
