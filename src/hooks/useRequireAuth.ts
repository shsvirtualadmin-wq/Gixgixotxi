import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Redirect unauthenticated users to /login only when loading is fully complete.
 * Never redirect prematurely while Auth or Firestore profile is resolving.
 */
export function useRequireAuth(options?: { requireOnboarding?: boolean }) {
  const { user, profile, loading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const requireOnboarding = options?.requireOnboarding;

  useEffect(() => {
    if (loading) return;
    const intendedTarget = `${location.pathname}${location.search}${location.hash}`;
    if (!user) {
      try {
        sessionStorage.setItem('boardly_post_login_redirect', intendedTarget);
      } catch {
        // Ignore storage errors
      }
      navigate(`/login?redirect=${encodeURIComponent(intendedTarget)}`, { replace: true });
      return;
    }
    if (requireOnboarding && profile && profile.onboardingCompleted === false) {
      navigate(`/onboarding?redirect=${encodeURIComponent(intendedTarget)}`, { replace: true });
    }
  }, [user, profile, loading, navigate, requireOnboarding, location.pathname, location.search, location.hash]);

  return { user, profile, profileLoading: loading };
}
