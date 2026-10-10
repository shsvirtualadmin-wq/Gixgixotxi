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
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export const BoardlyAppRouter: React.FC = () => {
  const {
    user,
    profile,
    loading,
    migratedBanner,
    dismissMigratedBanner,
    sessionExpired,
    dismissSessionExpired,
  } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  });

  const navigate = useCallback((route: string) => {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', cleanRoute);
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

  // Extract returnUrl from query if present
  const returnUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl') || '/app'
    : '/app';

  // SESSIONS & ROUTE PROTECTION
  // If user is logged in and visits /login or /signup, redirect to /app (or onboarding/verify)
  useEffect(() => {
    if (!loading && user) {
      if (currentPath === '/login' || currentPath === '/signup') {
        if (!user.emailVerified) {
          navigate('/verify-email');
        } else if (!profile?.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/app');
        }
      }
    }
  }, [loading, user, profile, currentPath, navigate]);

  // Route protection for /app and /onboarding
  useEffect(() => {
    if (!loading && !user) {
      if (currentPath.startsWith('/app') || currentPath === '/onboarding') {
        navigate(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [loading, user, currentPath, navigate]);

  // If loading, render global auth loading state with skeletons (no flash of wrong page!)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30" />
        </div>
        <div className="h-4 w-36 bg-slate-200 rounded-full animate-pulse" />
        <div className="h-3 w-56 bg-slate-100 rounded-full animate-pulse" />
      </div>
    );
  }

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
              className="p-1 text-amber-500 hover:text-amber-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Migrated Student Upgrade Banner */}
      {migratedBanner && user && (
        <aside 
          aria-label="Account migration update" 
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-medium py-2.5 px-4 shadow-sm relative z-50 flex items-center justify-between"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>We've upgraded our login. You're all set.</span>
          </div>
          <button
            onClick={dismissMigratedBanner}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Route Switcher */}
      {(() => {
        // 1. Sign Up
        if (currentPath === '/signup') {
          return <SignUpPage onNavigate={navigate} />;
        }

        // 2. Login
        if (currentPath === '/login') {
          return <LoginPage onNavigate={navigate} returnUrl={returnUrl} />;
        }

        // 3. Email Verification
        if (currentPath === '/verify-email') {
          return <VerifyEmailPage onNavigate={navigate} />;
        }

        // 4. Forgot Password
        if (currentPath === '/forgot-password') {
          return <ForgotPasswordPage onNavigate={navigate} />;
        }

        // 5. Reset Password
        if (currentPath === '/reset-password') {
          return <ResetPasswordPage onNavigate={navigate} />;
        }

        // 6. Onboarding Flow (4 Steps)
        if (currentPath === '/onboarding') {
          return (
            <OnboardingFlow
              onComplete={(startTest, _config) => {
                navigate('/app');
              }}
              onSkip={() => {
                navigate('/app');
              }}
            />
          );
        }

        // 7. Student App (/app or /app/*)
        if (currentPath.startsWith('/app')) {
          return (
            <StudentAppShell
              onNavigateMarketing={(p) => navigate(p)}
              onOpenMeritMeter={() => navigate('/features')}
              onOpenBlitz={() => navigate('/blitz')}
              onOpenArena={() => navigate('/arena')}
            />
          );
        }

        // 8. Marketing Website
        // Determine initial page from path if applicable (e.g. /blitz, /arena, /boardy, /pricing, etc.)
        let initialMarketingPage: any = 'home';
        if (currentPath === '/blitz') initialMarketingPage = 'blitz';
        else if (currentPath === '/blitz/register') initialMarketingPage = 'blitz/register';
        else if (currentPath === '/blitz/leaderboard') initialMarketingPage = 'blitz/leaderboard';
        else if (currentPath === '/arena') initialMarketingPage = 'arena';
        else if (currentPath === '/arena/leaderboard') initialMarketingPage = 'arena/leaderboard';
        else if (currentPath === '/circles') initialMarketingPage = 'circles';
        else if (currentPath === '/circles/apply') initialMarketingPage = 'circles/apply';
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
                navigate('/app');
              } else {
                navigate('/signup');
              }
            }}
          />
        );
      })()}
    </div>
  );
};
