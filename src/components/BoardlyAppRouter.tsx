import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SignUpPage } from './auth/SignUpPage';
import { LoginPage } from './auth/LoginPage';
import { VerifyEmailPage } from './auth/VerifyEmailPage';
import { ForgotPasswordPage } from './auth/ForgotPasswordPage';
import { ResetPasswordPage } from './auth/ResetPasswordPage';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { StudentAppShell } from './student/StudentAppShell';
import { BoardlyMarketingApp } from './marketing/BoardlyMarketingApp';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { OrganizerDashboard } from './organizer/OrganizerDashboard';
import { CaptainDashboard } from './captain/CaptainDashboard';
import { OrganizerApply } from './events/OrganizerApply';
import { AlertCircle, X } from 'lucide-react';

export const BoardlyAppRouter: React.FC = () => {
  const {
    user,
    profile,
    documentExists,
    isAdmin,
    loading,
    status,
    activeRole,
    switchRole,
    availableRoles,
    sessionExpired,
    dismissSessionExpired,
  } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  });

  const navigate = useCallback((route: string, replace = false) => {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', cleanRoute);
      } else {
        window.history.pushState({}, '', cleanRoute);
      }
      setCurrentPath(cleanRoute.toLowerCase().replace(/\/$/, '') || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Determine highest role route
  const getHighestRolePath = useCallback(() => {
    if (isAdmin) return '/admin';
    if (activeRole === 'organizer' || profile?.role === 'organizer' || profile?.roles?.includes('organizer')) return '/organizer';
    if (activeRole === 'captain' || profile?.role === 'captain' || profile?.roles?.includes('captain')) return '/captain';
    return '/app';
  }, [isAdmin, activeRole, profile]);

  // SESSIONS & AUTH GUARDS
  useEffect(() => {
    if (loading) return;

    // 1. Authenticated users guard
    if (user) {
      const targetDashboard = getHighestRolePath();

      if (documentExists || profile) {
        // If onboarding is incomplete, send to onboarding
        if (profile && !profile.onboardingCompleted && !isAdmin) {
          if (currentPath !== '/onboarding') {
            navigate('/onboarding', true);
          }
          return;
        }

        // Auth screens prevention for logged-in users
        const authRoutes = ['/', '', '/login', '/signup', '/forgot-password', '/reset-password', '/onboarding'];
        if (authRoutes.includes(currentPath)) {
          navigate(targetDashboard, true);
        }
      } else {
        // First login: send to onboarding
        if (currentPath !== '/onboarding' && currentPath !== '/signup') {
          navigate('/onboarding', true);
        }
      }
    } else {
      // 2. Unauthenticated users guard
      const protectedPrefixes = [
        '/app',
        '/onboarding',
        '/admin',
        '/organizer',
        '/captain',
        '/dashboard',
        '/profile',
        '/practice',
        '/test',
        '/results',
      ];
      const isProtected = protectedPrefixes.some(
        (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
      );

      if (isProtected) {
        navigate(`/login?returnUrl=${encodeURIComponent(currentPath)}`, true);
      }
    }
  }, [loading, user, profile, documentExists, isAdmin, currentPath, getHighestRolePath, navigate]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-indigo-100 dark:bg-violet-950/60 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-2xl bg-indigo-600/30" />
        </div>
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-3 w-56 bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse" />
      </div>
    );
  }

  // Extract returnUrl from query if present
  const returnUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl') || getHighestRolePath()
    : getHighestRolePath();

  return (
    <div className="min-h-screen flex flex-col relative font-sans">
      {/* Session Expired Notice */}
      {sessionExpired && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your session has expired. Please log in again.</span>
            </div>
            <button
              onClick={dismissSessionExpired}
              className="p-1 text-amber-500 hover:text-amber-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Route Switcher */}
      {(() => {
        // 1. Sign Up
        if (currentPath === '/signup') {
          return <SignUpPage onNavigate={(p) => navigate(p, true)} />;
        }

        // 2. Login
        if (currentPath === '/login') {
          return <LoginPage onNavigate={(p) => navigate(p, true)} returnUrl={returnUrl} />;
        }

        // 3. Email Verification
        if (currentPath === '/verify-email') {
          return <VerifyEmailPage onNavigate={(p) => navigate(p)} />;
        }

        // 4. Forgot Password
        if (currentPath === '/forgot-password') {
          return <ForgotPasswordPage onNavigate={(p) => navigate(p)} />;
        }

        // 5. Reset Password
        if (currentPath === '/reset-password') {
          return <ResetPasswordPage onNavigate={(p) => navigate(p)} />;
        }

        // 6. Onboarding Flow (4 Steps)
        if (currentPath === '/onboarding') {
          return (
            <OnboardingFlow
              onComplete={(_startTest, _config) => {
                navigate(getHighestRolePath(), true);
              }}
              onSkip={() => {
                navigate(getHighestRolePath(), true);
              }}
            />
          );
        }

        // 7. Student App (/app or /app/*)
        if (currentPath === '/app' || currentPath.startsWith('/app/')) {
          return (
            <StudentAppShell
              onNavigateMarketing={(p) => navigate(p)}
              onOpenMeritMeter={() => navigate('/features')}
              onOpenBlitz={() => navigate('/blitz')}
              onOpenArena={() => navigate('/arena')}
            />
          );
        }

        // 8. Study Circles Organizer Dashboard (/organizer or /organizer/*)
        if (currentPath === '/organizer' || currentPath.startsWith('/organizer/')) {
          if (!user) {
            navigate(`/login?returnUrl=/organizer`, true);
            return null;
          }
          const isOrganizerAllowed =
            isAdmin ||
            profile?.role === 'organizer' ||
            profile?.roles?.includes('organizer');

          if (!isOrganizerAllowed) {
            return (
              <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold max-w-sm">
                  You are not yet registered as a Study Circles organizer. Submit your organizer application to unlock this portal!
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/circles/apply')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer"
                  >
                    Apply as Organizer
                  </button>
                  <button
                    onClick={() => navigate('/app', true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    Go to Student App
                  </button>
                </div>
              </div>
            );
          }
          return <OrganizerDashboard />;
        }

        // 9. Campus Captain Dashboard (/captain or /captain/*)
        if (currentPath === '/captain' || currentPath.startsWith('/captain/')) {
          if (!user) {
            navigate(`/login?returnUrl=/captain`, true);
            return null;
          }
          const isCaptainAllowed =
            isAdmin ||
            profile?.role === 'captain' ||
            profile?.roles?.includes('captain');

          if (!isCaptainAllowed) {
            return (
              <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold max-w-sm">
                  Campus Captain access requires an approved application.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/captains/apply')}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer"
                  >
                    Apply as Captain
                  </button>
                  <button
                    onClick={() => navigate('/app', true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    Go to Student App
                  </button>
                </div>
              </div>
            );
          }
          return <CaptainDashboard />;
        }

        // 10. Admin Dashboard (/admin or /admin/*)
        if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
          if (!user) {
            navigate(`/login?returnUrl=/admin`, true);
            return null;
          }
          if (!isAdmin) {
            return (
              <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold max-w-sm">
                  Access Restricted: Administrator credentials required.
                </div>
                <button
                  onClick={() => navigate('/app', true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Return to Student Dashboard
                </button>
              </div>
            );
          }
          return (
            <AdminDashboardScreen
              currentUser={user as any}
              onBack={() => navigate('/app', true)}
            />
          );
        }

        // 11. Organizer Application (/circles/apply)
        if (currentPath === '/circles/apply') {
          return (
            <OrganizerApply
              onBack={() => navigate('/circles')}
              onSuccess={() => navigate('/organizer')}
            />
          );
        }

        // 12. Captain Application (/captains/apply or /captains)
        if (currentPath === '/captains/apply' || currentPath === '/captains') {
          return (
            <OrganizerApply
              onBack={() => navigate('/')}
              onSuccess={() => navigate('/captain')}
            />
          );
        }

        // 13. Marketing Website
        let initialMarketingPage: any = 'home';
        if (currentPath === '/blitz') initialMarketingPage = 'blitz';
        else if (currentPath === '/blitz/register') initialMarketingPage = 'blitz/register';
        else if (currentPath === '/blitz/leaderboard') initialMarketingPage = 'blitz/leaderboard';
        else if (currentPath === '/arena') initialMarketingPage = 'arena';
        else if (currentPath === '/arena/leaderboard') initialMarketingPage = 'arena/leaderboard';
        else if (currentPath === '/circles') initialMarketingPage = 'circles';
        else if (currentPath === '/boardy' || currentPath === '/study-buddy' || currentPath === '/ai') initialMarketingPage = 'boardy';
        else if (currentPath === '/pricing') initialMarketingPage = 'pricing';
        else if (currentPath === '/reviews') initialMarketingPage = 'reviews';
        else if (currentPath === '/features') initialMarketingPage = 'features';
        else if (currentPath === '/terms') initialMarketingPage = 'terms';
        else if (currentPath === '/privacy') initialMarketingPage = 'privacy';
        else if (currentPath === '/about') initialMarketingPage = 'about';
        else if (currentPath === '/contact') initialMarketingPage = 'contact';
        else if (currentPath === '/faqs' || currentPath === '/faq') initialMarketingPage = 'faqs';

        return (
          <BoardlyMarketingApp
            initialPage={initialMarketingPage}
            onLaunchPortal={() => {
              if (user) {
                navigate(getHighestRolePath(), true);
              } else {
                navigate('/login');
              }
            }}
          />
        );
      })()}
    </div>
  );
};
