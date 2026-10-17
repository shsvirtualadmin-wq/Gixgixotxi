import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Redirect unauthenticated users to /login only when loading is fully complete.
 * Never redirect prematurely while Auth or Firestore profile is resolving.
 */
export function useRequireAuth(options?: { requireOnboarding?: boolean }) {
  const { user, profile, loading } = useUserProfile();
  const navigate = useNavigate();
  const requireOnboarding = options?.requireOnboarding;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (requireOnboarding && profile && profile.onboardingCompleted === false) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, loading, navigate, requireOnboarding]);

  return { user, profile, profileLoading: loading };
}
