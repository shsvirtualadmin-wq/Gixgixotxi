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
import { EventsModal } from './EventsModal';
import { ProgramsModal } from './ProgramsModal';
import { BillingDuration } from '../../data/marketingPricingData';

interface BoardlyMarketingAppProps {
  initialPage?: MarketingPage;
  onLaunchPortal?: (planChoice?: { planId: string; duration: BillingDuration }) => void;
}

export const BoardlyMarketingApp: React.FC<BoardlyMarketingAppProps> = ({
  initialPage = 'home',
  onLaunchPortal,
}) => {
  const [currentPage, setCurrentPage] = useState<MarketingPage>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (
        pageParam &&
        ['home', 'features', 'pricing', 'faqs', 'contact', 'privacy', 'terms', 'about'].includes(
          pageParam
        )
      ) {
        return pageParam as MarketingPage;
      }
      const hash = window.location.hash.replace('#', '');
      if (
        hash &&
        ['home', 'features', 'pricing', 'faqs', 'contact', 'privacy', 'terms', 'about'].includes(
          hash
        )
      ) {
        return hash as MarketingPage;
      }
    }
    return initialPage;
  });

  const [activeEventModal, setActiveEventModal] = useState<'blitz' | 'arena' | null>(null);
  const [activeProgramModal, setActiveProgramModal] = useState<'circles' | 'captains' | null>(null);

  // Sync browser URL and scroll to top on navigation
  const handleNavigate = (page: MarketingPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.pushState({ page }, '', url.toString());
    } catch {}
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setCurrentPage(e.state.page);
      } else {
        const params = new URLSearchParams(window.location.search);
        const p = params.get('page') as MarketingPage;
        if (p) setCurrentPage(p);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGetStarted = () => {
    if (onLaunchPortal) {
      onLaunchPortal();
    } else {
      // Default to pricing selection
      handleNavigate('pricing');
    }
  };

  const handleSelectPlan = (planId: string, duration: BillingDuration) => {
    if (onLaunchPortal) {
      onLaunchPortal({ planId, duration });
    } else {
      // Show confirmation alert or navigate to contact/checkout
      alert(`Selected plan: ${planId.toUpperCase()} (${duration}). Redirecting to registration...`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] bg-grid-faint text-[#0A1330] flex flex-col selection:bg-indigo-600 selection:text-white font-poppins relative">
      {/* Top Floating Pill Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenEventModal={(ev) => setActiveEventModal(ev)}
        onOpenProgramModal={(prog) => setActiveProgramModal(prog)}
        onGetStarted={handleGetStarted}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
            onOpenEventModal={(ev) => setActiveEventModal(ev)}
          />
        )}

        {currentPage === 'features' && (
          <FeaturesPage
            onNavigate={handleNavigate}
            onGetStarted={handleGetStarted}
            onOpenEventModal={(ev) => setActiveEventModal(ev)}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            onSelectPlan={handleSelectPlan}
            onNavigateContact={() => handleNavigate('contact')}
          />
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
      </main>

      {/* Dark Footer with huge faded wordmark and rounded corners */}
      <Footer
        onNavigate={handleNavigate}
        onOpenEventModal={(ev) => setActiveEventModal(ev)}
        onOpenProgramModal={(prog) => setActiveProgramModal(prog)}
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
