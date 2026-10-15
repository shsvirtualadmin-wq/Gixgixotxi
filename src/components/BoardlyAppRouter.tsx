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
import { MigrationCheckPage } from './admin/MigrationCheckPage';
import { MigrationPage } from './admin/MigrationPage';
import { OrganizerDashboard } from './organizer/OrganizerDashboard';
import { CaptainDashboard } from './captain/CaptainDashboard';
import { CaptainLandingPage } from './captain/CaptainLandingPage';
import { CrewOrganizerDashboard } from './crew/CrewOrganizerDashboard';
import { PublicCrewEventView } from './events/PublicCrewEventView';
import { OrganizerApply } from './events/OrganizerApply';
import { SeoHead } from './common/SeoHead';
import { PublicEventPage } from './public/PublicEventPage';
import { PublicProgramPage } from './public/PublicProgramPage';
import { CrewDashboardPage } from './crew/CrewDashboardPage';
import { CrewLandingPage } from './crew/CrewLandingPage';
import { ProgramApplicationPage } from './common/ProgramApplicationPage';
import { ArenaLandingPage } from './arena/ArenaLandingPage';
import { ArenaRegisterPage } from './arena/ArenaRegisterPage';
import { ArenaLeaderboardPage } from './arena/ArenaLeaderboardPage';
import { initReferralTracker } from '../lib/referralTracker';
import { UniversityExplorer } from './universities/UniversityExplorer';
import { MeritMeter } from './merit/MeritMeter';
import { Navbar } from './marketing/Navbar';
import { Footer } from './marketing/Footer';
import { ScrollProgress } from './marketing/design-system/ScrollProgress';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle, X } from 'lucide-react';

if (typeof window !== 'undefined') {
  (window as any).__boardlyPageOpenTime = (window as any).__boardlyPageOpenTime || performance.now();
  console.log(`[Startup:PageOpen] timestamp: ${new Date().toISOString()} (0ms)`);
}

export const BoardlyAppRouter: React.FC = () => {
  const {
    user,
    profile,
    documentExists,
    isAdmin,
    loading,
    authLoading,
    profileLoading,
    authError,
    retryAuth,
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
    if (activeRole === 'crew' || profile?.role === 'crew' || profile?.roles?.includes('crew')) return '/crew/dashboard';
    if (activeRole === 'organizer' || profile?.role === 'organizer' || profile?.roles?.includes('organizer')) return '/organizer';
    if (activeRole === 'captain' || profile?.role === 'captain' || profile?.roles?.includes('captain')) return '/captain/dashboard';
    return '/app';
  }, [isAdmin, activeRole, profile]);

  const lastRedirectRef = useRef<string | null>(null);

  // SESSIONS & AUTH GUARDS: Never redirect before both auth and profile are resolved, and NEVER on auth error
  useEffect(() => {
    if (loading || authLoading || profileLoading || !initialAuthChecked || authError) return;

    // 1. Authenticated users guard
    if (user) {
      // If user is on /login or /signup, redirect once to postLoginPath or highest dashboard or onboarding
      if (currentPath === '/login' || currentPath === '/signup') {
        const savedPostLogin = sessionStorage.getItem('postLoginPath');
        if (savedPostLogin) {
          sessionStorage.removeItem('postLoginPath');
          lastRedirectRef.current = savedPostLogin;
          const pageOpen = (typeof window !== 'undefined' && (window as any).__boardlyPageOpenTime) || 0;
          console.log(`[Startup:RouteChosen] timestamp: ${new Date().toISOString()} (+${(performance.now() - pageOpen).toFixed(1)}ms) -> ${savedPostLogin}`);
          navigate(savedPostLogin, true);
          return;
        }
        const targetDashboard = isRegistered ? getHighestRolePath() : '/onboarding';
        if (lastRedirectRef.current !== targetDashboard) {
          lastRedirectRef.current = targetDashboard;
          const pageOpen = (typeof window !== 'undefined' && (window as any).__boardlyPageOpenTime) || 0;
          console.log(`[Startup:RouteChosen] timestamp: ${new Date().toISOString()} (+${(performance.now() - pageOpen).toFixed(1)}ms) -> ${targetDashboard}`);
          navigate(targetDashboard, true);
        }
        return;
      }

      // If user is on /onboarding and is already registered, redirect to dashboard
      if (currentPath === '/onboarding' && isRegistered) {
        const targetDashboard = getHighestRolePath();
        if (lastRedirectRef.current !== targetDashboard) {
          lastRedirectRef.current = targetDashboard;
          const pageOpen = (typeof window !== 'undefined' && (window as any).__boardlyPageOpenTime) || 0;
          console.log(`[Startup:RouteChosen] timestamp: ${new Date().toISOString()} (+${(performance.now() - pageOpen).toFixed(1)}ms) -> ${targetDashboard}`);
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
            const pageOpen = (typeof window !== 'undefined' && (window as any).__boardlyPageOpenTime) || 0;
            console.log(`[Startup:RouteChosen] timestamp: ${new Date().toISOString()} (+${(performance.now() - pageOpen).toFixed(1)}ms) -> /onboarding`);
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
        '/captain/dashboard',
        '/crew/dashboard',
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
  }, [loading, authLoading, profileLoading, initialAuthChecked, authError, user, isRegistered, currentPath, getHighestRolePath, navigate]);

  const [loadingTimedOut, setLoadingTimedOut] = useState<boolean>(false);

  useEffect(() => {
    const isCurrentlyLoading = loading || authLoading || profileLoading || !initialAuthChecked;
    if (!isCurrentlyLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 5000); // 5-second maximum limit (Requirement 4)
    return () => clearTimeout(timer);
  }, [loading, authLoading, profileLoading, initialAuthChecked]);

  // Requirement 4 & 7: If loading times out or any lookup throws, stop loader and show Retry & Back to Login screen with real error code
  if (authError || (loadingTimedOut && (loading || authLoading || profileLoading || !initialAuthChecked))) {
    const displayCode = authError?.code || 'timeout';
    const displayMsg = authError?.message || 'We had trouble loading your account profile. You can retry.';
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Connection took longer than expected
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {displayMsg}
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            [Code: {displayCode}]
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setLoadingTimedOut(false);
              if (retryAuth) {
                retryAuth();
              } else if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              setLoadingTimedOut(false);
              navigate('/login', true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Requirement 2: Single full-screen loading component with Boardly logo matching initial HTML loader (zero flash)
  if (loading || authLoading || profileLoading || !initialAuthChecked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg border border-slate-200/80 dark:border-slate-800 animate-pulse">
          <img
            src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png"
            alt="Boardly Logo"
            className="w-12 h-12 object-contain rounded-xl"
          />
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
        // Referral Route: /r/CODE -> capture code in localStorage/sessionStorage and navigate
        if (currentPath.startsWith('/r/')) {
          initReferralTracker();
          navigate(user ? '/app' : '/signup', true);
          return null;
        }

        // 1. Sign Up
        if (currentPath === '/signup') {
          if (typeof window !== 'undefined') {
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const refParam = urlParams.get('ref') || urlParams.get('referral');
              if (refParam && refParam.trim()) {
                sessionStorage.setItem('referralCode', refParam.trim());
              }
            } catch {}
          }
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

        // 9. Boardly Captain Dashboard (/captain/dashboard)
        if (currentPath === '/captain/dashboard' || currentPath.startsWith('/captain/dashboard/')) {
          if (!user) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('postLoginPath', '/captain/dashboard');
            }
            navigate('/login', true);
            return null;
          }
          const isCaptainAllowed =
            isAdmin ||
            profile?.role === 'captain' ||
            profile?.roles?.includes('captain') ||
            profile?.isCrewMember;

          if (!isCaptainAllowed) {
            return (
              <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold max-w-sm">
                  Campus Captain access requires an approved application.
                </div>
                <div className="flex gap-2">
                  <a
                    href="/captain/apply"
                    onClick={(e) => {
                      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      navigate('/captain/apply');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer inline-flex items-center justify-center"
                  >
                    Apply as Captain
                  </a>
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

        // 9a. Dedicated Boardly Captain Application Page (/captain/apply)
        if (currentPath === '/captain/apply') {
          return (
            <ErrorBoundary onReset={() => navigate('/captain')}>
              <ProgramApplicationPage program="captain" onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }

        // 9b. Boardly Captain Landing Page (/captain)
        if (currentPath === '/captain' || currentPath.startsWith('/captain/')) {
          return (
            <ErrorBoundary onReset={() => navigate('/')}>
              <CaptainLandingPage currentPath={currentPath} onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }

        // Backward-compatibility Redirects for Captain
        if (
          (currentPath === '/crew' && typeof window !== 'undefined' && (window.location.search.includes('ref=') || window.location.search.includes('r='))) ||
          currentPath === '/crew/portal' ||
          currentPath === '/crew/leaderboard' ||
          currentPath === '/crew/ambassador'
        ) {
          const search = typeof window !== 'undefined' ? window.location.search : '';
          navigate(`/captain${search}`, true);
          return null;
        }
        if (currentPath === '/captains/apply' || currentPath === '/programs/captains/apply') {
          navigate('/captain/apply', true);
          return null;
        }
        if (currentPath === '/captains' || currentPath === '/programs/captains') {
          navigate('/captain', true);
          return null;
        }
        if (currentPath === '/crew-dashboard') {
          navigate('/captain/dashboard', true);
          return null;
        }

        // 10. Admin Dashboard (/admin or /admin/*)
        if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
          if (!user) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('postLoginPath', currentPath);
            }
            navigate('/login', true);
            return null;
          }
          if (!isAdmin) {
            navigate('/app', true);
            return null;
          }
          if (currentPath === '/admin/migrate') {
            return (
              <MigrationPage
                onNavigate={(p) => navigate(p, true)}
              />
            );
          }
          if (currentPath === '/admin/migration-check') {
            return (
              <MigrationCheckPage
                onBack={() => navigate('/admin', true)}
              />
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

        // Public Events Pages (/events/blitz, /events/arena, /events/:id)
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
        if (currentPath.startsWith('/events/')) {
          const evtId = currentPath.replace('/events/', '').split('?')[0];
          return (
            <ErrorBoundary onReset={() => navigate('/')}>
              <PublicCrewEventView
                eventId={evtId}
                onNavigateHome={() => navigate('/')}
                onNavigateSignIn={() => navigate('/login')}
              />
            </ErrorBoundary>
          );
        }

        // Dedicated Boardly Crew Organizer Dashboard (/crew/dashboard)
        if (currentPath === '/crew/dashboard' || currentPath.startsWith('/crew/dashboard/')) {
          return (
            <ErrorBoundary onReset={() => navigate('/')}>
              <CrewOrganizerDashboard
                onBackToApp={() => navigate('/app')}
                onNavigateApply={() => navigate('/crew/apply')}
                onOpenPublicEvent={(id) => navigate(`/events/${id}`)}
              />
            </ErrorBoundary>
          );
        }

        // Dedicated Boardly Crew Application Page (/crew/apply)
        if (currentPath === '/crew/apply') {
          return (
            <ErrorBoundary onReset={() => navigate('/crew')}>
              <ProgramApplicationPage program="crew" onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }

        // Dedicated Boardly Crew Landing Page (/crew, /crew/how-it-works, /crew/perks, /crew/faq)
        if (currentPath === '/crew' || currentPath.startsWith('/crew/')) {
          return (
            <ErrorBoundary onReset={() => navigate('/')}>
              <CrewLandingPage currentPath={currentPath} onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }

        // Public Programs Pages (/programs/crew, /programs/crew/apply)
        if (currentPath === '/programs/crew/apply') {
          navigate('/crew/apply', true);
          return null;
        }
        if (currentPath === '/programs/crew') {
          navigate('/crew', true);
          return null;
        }

        // Public University Explorer & Merit Meter
        if (currentPath === '/universities') {
          return (
            <div className="min-h-screen flex flex-col justify-between">
              <ScrollProgress />
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
              <ScrollProgress />
              <Navbar currentPage="home" onNavigate={(p) => navigate(`/${p}`)} onGetStarted={() => navigate(user ? '/app' : '/signup')} />
              <MeritMeter
                onStartPractice={() => navigate(user ? '/app' : '/signup')}
                onExploreMore={() => navigate('/universities')}
              />
              <Footer onNavigate={(p) => navigate(`/${p}`)} />
            </div>
          );
        }

        // Dedicated Boardly Arena Routes (/arena, /arena/register, /arena/leaderboard)
        if (currentPath === '/arena/register') {
          return (
            <ErrorBoundary onReset={() => navigate('/arena')}>
              <ArenaRegisterPage onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }
        if (currentPath === '/arena/leaderboard') {
          return (
            <ErrorBoundary onReset={() => navigate('/arena')}>
              <ArenaLeaderboardPage onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }
        if (currentPath === '/arena' || currentPath === '/events/arena') {
          return (
            <ErrorBoundary onReset={() => navigate('/')}>
              <ArenaLandingPage onNavigate={(route) => navigate(route)} />
            </ErrorBoundary>
          );
        }

        // 13. Marketing Website
        let initialMarketingPage: any = 'home';
        if (currentPath === '/blitz') initialMarketingPage = 'blitz';
        else if (currentPath === '/blitz/register') initialMarketingPage = 'blitz/register';
        else if (currentPath === '/blitz/leaderboard') initialMarketingPage = 'blitz/leaderboard';
        else if (currentPath === '/arena') initialMarketingPage = 'arena';
        else if (currentPath === '/arena/register') initialMarketingPage = 'arena/register';
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
