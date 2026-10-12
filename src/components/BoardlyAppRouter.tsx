import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { SeoHead } from './common/SeoHead';
import { PublicEventPage } from './public/PublicEventPage';
import { PublicProgramPage } from './public/PublicProgramPage';
import { CrewDashboardPage } from './crew/CrewDashboardPage';
import { UniversityExplorer } from './universities/UniversityExplorer';
import { MeritMeter } from './merit/MeritMeter';
import { Navbar } from './marketing/Navbar';
import { Footer } from './marketing/Footer';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle, X } from 'lucide-react';

export const BoardlyAppRouter: React.FC = () => {
  const {
    user,
    profile,
    documentExists,
    isAdmin,
    loading,
    authLoading,
    profileLoading,
    isRegistered,
    initialAuthChecked,
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

  const lastRedirectRef = useRef<string | null>(null);

  // SESSIONS & AUTH GUARDS: Never redirect before both auth and profile are resolved
  useEffect(() => {
    if (loading || authLoading || profileLoading || !initialAuthChecked) return;

    // 1. Authenticated users guard
    if (user) {
      // If user is on /login or /signup, redirect once to highest dashboard or onboarding
      if (currentPath === '/login' || currentPath === '/signup') {
        const targetDashboard = isRegistered ? getHighestRolePath() : '/onboarding';
        if (lastRedirectRef.current !== targetDashboard) {
          lastRedirectRef.current = targetDashboard;
          navigate(targetDashboard, true);
        }
        return;
      }

      // If user is on /onboarding and is already registered, redirect to dashboard
      if (currentPath === '/onboarding' && isRegistered) {
        const targetDashboard = getHighestRolePath();
        if (lastRedirectRef.current !== targetDashboard) {
          lastRedirectRef.current = targetDashboard;
          navigate(targetDashboard, true);
        }
        return;
      }

      // Check if onboarding is incomplete for protected student routes
      if (!isRegistered) {
        const studentProtected = ['/app', '/dashboard', '/practice', '/test', '/results', '/profile', '/boardy'];
        const isStudentRoute = studentProtected.some(
          (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
        );
        if (isStudentRoute && currentPath !== '/onboarding') {
          if (lastRedirectRef.current !== '/onboarding') {
            lastRedirectRef.current = '/onboarding';
            navigate('/onboarding', true);
          }
        }
        return;
      }
    } else {
      // 2. Unauthenticated users guard on protected routes
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
        '/boardy',
      ];
      const isProtected = protectedPrefixes.some(
        (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
      );

      if (isProtected) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('postLoginPath', currentPath);
        }
        if (lastRedirectRef.current !== '/login') {
          lastRedirectRef.current = '/login';
          navigate('/login', true);
        }
      }
    }
  }, [loading, authLoading, profileLoading, initialAuthChecked, user, isRegistered, currentPath, getHighestRolePath, navigate]);

  // Loading skeleton state: Show loading until BOTH authLoading and profileLoading are resolved
  if (loading || authLoading || profileLoading || !initialAuthChecked) {
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
        // Referral Route: /r/CODE -> store code in sessionStorage and replace route to /signup
        if (currentPath.startsWith('/r/')) {
          const code = currentPath.substring(3).trim();
          if (code && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('referralCode', code);
            } catch {}
          }
          navigate('/signup', true);
          return null;
        }

        // 1. Sign Up
        if (currentPath === '/signup') {
          if (user) {
            navigate(isRegistered ? getHighestRolePath() : '/onboarding', true);
            return null;
          }
          return <SignUpPage onNavigate={(p) => navigate(p, true)} />;
        }

        // 2. Login
        if (currentPath === '/login') {
          if (user) {
            navigate(isRegistered ? getHighestRolePath() : '/onboarding', true);
            return null;
          }
          return <LoginPage onNavigate={(p) => navigate(p, true)} />;
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
          if (user && isRegistered) {
            navigate(getHighestRolePath(), true);
            return null;
          }
          return (
            <OnboardingFlow
              onComplete={(_startTest, _config) => {
                navigate(getHighestRolePath(), true);
              }}
            />
          );
        }

        // 7. Student App (/app or /app/* or /dashboard or /boardy)
        if (
          currentPath === '/app' ||
          currentPath.startsWith('/app/') ||
          currentPath === '/dashboard' ||
          currentPath === '/boardy' ||
          currentPath.startsWith('/boardy/')
        ) {
          if (!user) {
            navigate('/login', true);
            return null;
          }
          if (!isRegistered) {
            navigate('/onboarding', true);
            return null;
          }
          return (
            <>
              <SeoHead pathname="/app" noIndex={true} />
              <StudentAppShell
                onNavigateMarketing={(p) => navigate(p)}
                onOpenMeritMeter={() => navigate('/features')}
                onOpenBlitz={() => navigate('/blitz')}
                onOpenArena={() => navigate('/arena')}
              />
            </>
          );
        }

        // 8. Study Circles Organizer Dashboard (/organizer or /organizer/*)
        if (currentPath === '/organizer' || currentPath.startsWith('/organizer/')) {
          if (!user) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('postLoginPath', '/organizer');
            }
            navigate('/login', true);
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
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('postLoginPath', '/captain');
            }
            navigate('/login', true);
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
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('postLoginPath', '/admin');
            }
            navigate('/login', true);
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

        // Public Events Pages (/events/blitz, /events/arena)
        if (currentPath === '/events/blitz') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <PublicEventPage type="blitz" onNavigateHome={() => navigate('/')} onStartPractice={() => navigate('/app')} />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }
        if (currentPath === '/events/arena') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <PublicEventPage type="arena" onNavigateHome={() => navigate('/')} onStartPractice={() => navigate('/app')} />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }

        // Public Programs Pages (/programs/crew, /crew, /programs/captains)
        if (currentPath === '/programs/crew' || currentPath === '/crew') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <ErrorBoundary onReset={() => navigate('/')}>
                <PublicProgramPage type="crew" onNavigateHome={() => navigate('/')} onApplyOrStart={() => navigate(user ? '/app' : '/signup')} />
              </ErrorBoundary>
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }

        // Dedicated Crew Ambassador Dashboard (/crew-dashboard)
        if (currentPath === '/crew-dashboard') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <ErrorBoundary onReset={() => navigate('/app')}>
                <CrewDashboardPage
                  onBackToApp={() => navigate('/app')}
                  onApply={() => navigate('/programs/crew')}
                />
              </ErrorBoundary>
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }
        if (currentPath === '/programs/captains') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <PublicProgramPage type="captains" onNavigateHome={() => navigate('/')} onApplyOrStart={() => navigate('/captains/apply')} />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }

        // Public University Explorer & Merit Meter
        if (currentPath === '/universities') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <UniversityExplorer
                onNavigateMeritMeter={(uniId) => navigate(`/merit-meter?uni=${encodeURIComponent(uniId)}`)}
                onNavigatePredictor={() => navigate(user ? '/app/predictor' : '/login')}
              />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }
        if (currentPath === '/merit-meter') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <MeritMeter
                onStartPractice={() => navigate(user ? '/app' : '/signup')}
                onExploreMore={() => navigate('/universities')}
              />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
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
        else if (currentPath === '/boardly-ai' || currentPath === '/boardy' || currentPath === '/study-buddy' || currentPath === '/ai') initialMarketingPage = 'boardly-ai';
        else if (currentPath === '/mdcat') initialMarketingPage = 'mdcat';
        else if (currentPath === '/fsc-matric') initialMarketingPage = 'fsc-matric';
        else if (currentPath === '/fast-nu') initialMarketingPage = 'fast-nu';
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
