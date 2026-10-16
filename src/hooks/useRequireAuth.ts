import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirect unauthenticated users to /login.
 * Redirect authenticated users who haven't completed onboarding to /onboarding.
 * Call at the top of any protected page.
 */
export function useRequireAuth(options?: { requireOnboarding?: boolean }) {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const requireOnboarding = options?.requireOnboarding;

  useEffect(() => {
    if (profileLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (requireOnboarding && profile && !profile.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, profileLoading, navigate, requireOnboarding]);

  return { user, profile, profileLoading };
}
