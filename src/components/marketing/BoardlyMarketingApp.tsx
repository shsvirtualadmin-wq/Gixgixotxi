import React, { useState, useEffect } from 'react';
import { Navbar, MarketingPage } from './Navbar';
import { Footer } from './Footer';
import { HomePage } from './HomePage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsOfServicePage } from './TermsOfServicePage';
import { FaqPage } from './FaqPage';
import { ContactPage } from './ContactPage';
import { AboutPage } from './AboutPage';
import { BoardyPage } from './BoardyPage';
import { ReviewsWall } from './ReviewsWall';
import { BlitzLanding } from '../events/BlitzLanding';
import { BlitzRegister } from '../events/BlitzRegister';
import { LeaderboardView } from '../events/LeaderboardView';
import { ArenaLanding } from '../events/ArenaLanding';
import { CirclesLanding } from '../events/CirclesLanding';
import { OrganizerApply } from '../events/OrganizerApply';
import { EventsModal } from './EventsModal';
import { ProgramsModal } from './ProgramsModal';
import { BillingDuration } from '../../data/marketingPricingData';

interface BoardlyMarketingAppProps {
  initialPage?: MarketingPage;
  onLaunchPortal?: (planChoice?: { planId: string; duration: BillingDuration }) => void;
}

function parseMarketingPageFromLocation(): MarketingPage {
  if (typeof window === 'undefined') return 'home';

  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  // Redirect legacy AI routes to /boardy
  if (['/study-buddy', '/ai', '/ustaad', '/jojo', '/zehni', '/socratic'].includes(pathname)) {
    try {
      window.history.replaceState({ page: 'boardy' }, '', '/boardy');
    } catch {}
    return 'boardy';
  }

  if (pathname === '/blitz') return 'blitz';
  if (pathname === '/blitz/register') return 'blitz/register';
  if (pathname === '/blitz/leaderboard') return 'blitz/leaderboard';
  if (pathname === '/arena') return 'arena';
  if (pathname === '/arena/leaderboard') return 'arena/leaderboard';
  if (pathname === '/circles') return 'circles';
  if (pathname === '/circles/apply') return 'circles/apply';
  if (pathname === '/boardy') return 'boardy';
  if (pathname === '/features') return 'features';
  if (pathname === '/pricing') return 'pricing';
  if (pathname === '/reviews') return 'reviews';
  if (pathname === '/faqs' || pathname === '/faq') return 'faqs';
  if (pathname === '/contact') return 'contact';
  if (pathname === '/privacy') return 'privacy';
  if (pathname === '/terms') return 'terms';
  if (pathname === '/about') return 'about';

  // Fallback query parameters
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page')?.toLowerCase();
  if (pageParam) {
    if (pageParam === 'blitz') return 'blitz';
    if (pageParam === 'blitz-register' || pageParam === 'blitz/register') return 'blitz/register';
    if (pageParam === 'blitz-leaderboard' || pageParam === 'blitz/leaderboard') return 'blitz/leaderboard';
    if (pageParam === 'arena') return 'arena';
    if (pageParam === 'arena-leaderboard' || pageParam === 'arena/leaderboard') return 'arena/leaderboard';
    if (pageParam === 'circles') return 'circles';
    if (pageParam === 'circles-apply' || pageParam === 'circles/apply') return 'circles/apply';
    if (pageParam === 'boardy') return 'boardy';
    if (
      ['home', 'features', 'pricing', 'reviews', 'faqs', 'contact', 'privacy', 'terms', 'about'].includes(
        pageParam
      )
    ) {
      return pageParam as MarketingPage;
    }
  }

  // Fallback hash
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'blitz') return 'blitz';
  if (hash === 'arena') return 'arena';
  if (hash === 'circles') return 'circles';
  if (hash === 'boardy') return 'boardy';

  return 'home';
}

function getPathForMarketingPage(page: MarketingPage): string {
  switch (page) {
    case 'home':
      return '/';
    case 'features':
      return '/features';
    case 'pricing':
      return '/pricing';
    case 'reviews':
      return '/reviews';
    case 'faqs':
      return '/faqs';
    case 'contact':
      return '/contact';
    case 'privacy':
      return '/privacy';
    case 'terms':
      return '/terms';
    case 'about':
      return '/about';
    case 'blitz':
      return '/blitz';
    case 'blitz/register':
      return '/blitz/register';
    case 'blitz/leaderboard':
      return '/blitz/leaderboard';
    case 'arena':
      return '/arena';
    case 'arena/leaderboard':
      return '/arena/leaderboard';
    case 'circles':
      return '/circles';
    case 'circles/apply':
      return '/circles/apply';
    case 'boardy':
      return '/boardy';
    default:
      return '/';
  }
}

export const BoardlyMarketingApp: React.FC<BoardlyMarketingAppProps> = ({
  initialPage,
  onLaunchPortal,
}) => {
  const [currentPage, setCurrentPage] = useState<MarketingPage>(() => {
    if (initialPage && initialPage !== 'home') return initialPage;
    return parseMarketingPageFromLocation();
  });

  const [activeEventModal, setActiveEventModal] = useState<'blitz' | 'arena' | null>(null);
  const [activeProgramModal, setActiveProgramModal] = useState<'circles' | 'captains' | null>(null);

  // Sync browser URL and scroll to top on navigation
  const handleNavigate = (page: MarketingPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const targetPath = getPathForMarketingPage(page);
      const url = new URL(window.location.href);
      url.pathname = targetPath;
      url.searchParams.delete('page');
      window.history.pushState({ page }, '', url.toString());
    } catch {}
  };

  const handleRouteNavigate = (route: string) => {
    const clean = route.replace(/^\//, '').toLowerCase();
    if (clean === 'blitz/register') handleNavigate('blitz/register');
    else if (clean === 'blitz/leaderboard') handleNavigate('blitz/leaderboard');
    else if (clean === 'arena/leaderboard') handleNavigate('arena/leaderboard');
    else if (clean === 'circles/apply') handleNavigate('circles/apply');
    else if (clean === 'blitz') handleNavigate('blitz');
    else if (clean === 'arena') handleNavigate('arena');
    else if (clean === 'circles') handleNavigate('circles');
    else if (clean === 'boardy') handleNavigate('boardy');
    else if (clean === 'terms') handleNavigate('terms');
    else if (clean === 'privacy') handleNavigate('privacy');
    else if (clean === 'contact') handleNavigate('contact');
    else if (clean === 'about') handleNavigate('about');
    else if (clean === 'pricing') handleNavigate('pricing');
    else if (clean === 'features') handleNavigate('features');
    else if (clean === 'faqs' || clean === 'faq') handleNavigate('faqs');
    else handleNavigate('home');
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setCurrentPage(e.state.page);
      } else {
        setCurrentPage(parseMarketingPageFromLocation());
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGetStarted = () => {
    if (onLaunchPortal) {
      onLaunchPortal();
    } else {
      handleNavigate('pricing');
    }
  };

  const handleSelectPlan = (planId: string, duration: BillingDuration) => {
    if (onLaunchPortal) {
      onLaunchPortal({ planId, duration });
    } else {
      alert(`Selected plan: ${planId.toUpperCase()} (${duration}). Redirecting to registration...`);
    }
  };

  // Minimal standalone pages that come with their own header/footer
  if (currentPage === 'blitz/register') {
    return <BlitzRegister onNavigate={handleRouteNavigate} />;
  }

  if (currentPage === 'circles/apply') {
    return <OrganizerApply onNavigate={handleRouteNavigate} onSignIn={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] bg-grid-faint text-[#0A1330] flex flex-col selection:bg-indigo-600 selection:text-white font-poppins relative">
      {/* Top Floating Pill Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenEventModal={(ev) => handleNavigate(ev === 'blitz' ? 'blitz' : 'arena')}
        onOpenProgramModal={(prog) => (prog === 'circles' ? handleNavigate('circles') : setActiveProgramModal('captains'))}
        onGetStarted={handleGetStarted}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
            onOpenEventModal={(ev) => handleNavigate(ev === 'blitz' ? 'blitz' : 'arena')}
          />
        )}

        {currentPage === 'features' && (
          <FeaturesPage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
            onOpenEventModal={(ev) => handleNavigate(ev === 'blitz' ? 'blitz' : 'arena')}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            onSelectPlan={handleSelectPlan}
            onNavigateContact={() => handleNavigate('contact')}
          />
        )}

        {currentPage === 'reviews' && (
          <div className="pt-24 min-h-[85vh]">
            <ReviewsWall isFullPage={true} />
          </div>
        )}

        {currentPage === 'faqs' && (
          <FaqPage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'privacy' && (
          <PrivacyPolicyPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'terms' && (
          <TermsOfServicePage onNavigate={handleNavigate} />
        )}

        {currentPage === 'about' && (
          <AboutPage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
          />
        )}

        {currentPage === 'blitz' && (
          <BlitzLanding onNavigate={handleRouteNavigate} />
        )}

        {currentPage === 'blitz/leaderboard' && (
          <LeaderboardView type="blitz" onNavigate={handleRouteNavigate} />
        )}

        {currentPage === 'arena' && (
          <ArenaLanding onNavigate={handleRouteNavigate} />
        )}

        {currentPage === 'arena/leaderboard' && (
          <LeaderboardView type="arena" onNavigate={handleRouteNavigate} />
        )}

        {currentPage === 'circles' && (
          <CirclesLanding onNavigate={handleRouteNavigate} />
        )}

        {currentPage === 'boardy' && (
          <BoardyPage onNavigate={handleRouteNavigate} onGetStarted={handleGetStarted} />
        )}
      </main>

      {/* Dark Footer with huge faded wordmark, links, and university disclaimer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenEventModal={(ev) => handleNavigate(ev === 'blitz' ? 'blitz' : 'arena')}
        onOpenProgramModal={(prog) => (prog === 'circles' ? handleNavigate('circles') : setActiveProgramModal('captains'))}
      />

      {/* Modals */}
      {activeEventModal && (
        <EventsModal
          event={activeEventModal}
          onClose={() => setActiveEventModal(null)}
          onGetStarted={handleGetStarted}
        />
      )}

      {activeProgramModal && (
        <ProgramsModal
          program={activeProgramModal}
          onClose={() => setActiveProgramModal(null)}
          onGetStarted={handleGetStarted}
          onNavigateContact={() => {
            setActiveProgramModal(null);
            handleNavigate('contact');
          }}
        />
      )}
    </div>
  );
};
