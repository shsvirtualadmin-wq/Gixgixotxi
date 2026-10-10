import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, Trophy, Users, HelpCircle, Mail } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BoardyMascot } from '../BoardyMascot';

export type MarketingPage =
  | 'home'
  | 'features'
  | 'pricing'
  | 'faqs'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'blitz'
  | 'blitz/register'
  | 'blitz/leaderboard'
  | 'arena'
  | 'arena/leaderboard'
  | 'circles'
  | 'circles/apply'
  | 'boardy';

interface NavbarProps {
  currentPage: MarketingPage;
  onNavigate: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
  onGetStarted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenEventModal,
  onOpenProgramModal,
  onGetStarted,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMobileNav = (page: MarketingPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const handleEventClick = (event: 'blitz' | 'arena') => {
    setMobileMenuOpen(false);
    if (onOpenEventModal) {
      onOpenEventModal(event);
    } else {
      onNavigate('features');
    }
  };

  const handleProgramClick = (program: 'circles' | 'captains') => {
    setMobileMenuOpen(false);
    if (onOpenProgramModal) {
      onOpenProgramModal(program);
    } else {
      onNavigate('about');
    }
  };

  return (
    <>
      {/* Floating Rounded Pill Top Bar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 max-w-6xl mx-auto transition-all duration-300">
        <nav
          className={`flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-indigo-900/5 border-slate-200/80'
              : 'bg-white/80 backdrop-blur-sm shadow-md shadow-slate-900/5 border-slate-200/60'
          }`}
          aria-label="Main Navigation"
        >
          {/* Logo on Left */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 text-left"
            aria-label="Boardly Home"
          >
            <BrandLogo size="md" />
          </button>

          {/* Desktop Nav Links in Center */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                currentPage === 'home'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
              {currentPage === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('features')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                currentPage === 'features'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Features
              {currentPage === 'features' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                currentPage === 'pricing'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pricing
              {currentPage === 'pricing' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('boardy')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded flex items-center gap-1.5 ${
                currentPage === 'boardy'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BoardyMascot size={18} />
              <span>Boardy</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {currentPage === 'boardy' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('faqs')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                currentPage === 'faqs'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FAQs
              {currentPage === 'faqs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('contact')}
              className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                currentPage === 'contact'
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact
              {currentPage === 'contact' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Right Action on Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/login');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button on Right (minimum 44x44px hitbox) */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Card Overlay with Blurred Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-start p-4 sm:p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-[28px] border border-slate-200/80 shadow-2xl p-6 flex flex-col max-h-[92vh] overflow-y-auto">
            {/* Header: Logo and Close (X) button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => handleMobileNav('home')}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
              >
                <BrandLogo size="md" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items: Large and bold, with thin dividers */}
            <div className="flex flex-col py-3">
              {/* Home (active color) */}
              <button
                onClick={() => handleMobileNav('home')}
                className={`flex items-center justify-between py-3.5 text-left text-xl font-bold transition-colors border-b border-slate-100/80 ${
                  currentPage === 'home'
                    ? 'text-indigo-600'
                    : 'text-slate-900 hover:text-indigo-600'
                }`}
              >
                <span>Home</span>
                {currentPage === 'home' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Features */}
              <button
                onClick={() => handleMobileNav('features')}
                className={`flex items-center justify-between py-3.5 text-left text-xl font-bold transition-colors border-b border-slate-100/80 ${
                  currentPage === 'features'
                    ? 'text-indigo-600'
                    : 'text-slate-900 hover:text-indigo-600'
                }`}
              >
                <span>Features</span>
                {currentPage === 'features' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Pricing */}
              <button
                onClick={() => handleMobileNav('pricing')}
                className={`flex items-center justify-between py-3.5 text-left text-xl font-bold transition-colors border-b border-slate-100/80 ${
                  currentPage === 'pricing'
                    ? 'text-indigo-600'
                    : 'text-slate-900 hover:text-indigo-600'
                }`}
              >
                <span>Pricing</span>
                {currentPage === 'pricing' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Boardy */}
              <button
                onClick={() => handleMobileNav('boardy')}
                className={`flex items-center justify-between py-3.5 text-left text-xl font-bold transition-colors border-b border-slate-100/80 ${
                  currentPage === 'boardy'
                    ? 'text-indigo-600'
                    : 'text-slate-900 hover:text-indigo-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BoardyMascot size={22} />
                  <span>Boardy</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                {currentPage === 'boardy' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Events Section */}
              <div className="pt-4 pb-2 border-b border-slate-100/80">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Events
                </span>
                <div className="flex flex-col gap-1 mt-2">
                  <button
                    onClick={() => handleMobileNav('blitz')}
                    className="flex items-center justify-between py-2 text-left text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-indigo-500" />
                      <span>Boardly Blitz</span>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                      Live Drills
                    </span>
                  </button>
                  <button
                    onClick={() => handleMobileNav('arena')}
                    className="flex items-center justify-between py-2 text-left text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-teal-600" />
                      <span>Boardly Arena</span>
                    </div>
                    <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                      Grand Mocks
                    </span>
                  </button>
                </div>
              </div>

              {/* Programs Section */}
              <div className="pt-4 pb-2 border-b border-slate-100/80">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Programs
                </span>
                <div className="flex flex-col gap-1 mt-2">
                  <button
                    onClick={() => handleMobileNav('circles')}
                    className="flex items-center justify-between py-2 text-left text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>Study Circles</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Group Study</span>
                  </button>
                  <button
                    onClick={() => handleProgramClick('captains')}
                    className="flex items-center justify-between py-2 text-left text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-500" />
                      <span>Campus Captains</span>
                    </div>
                    <span className="text-xs text-violet-700 font-medium bg-violet-50 px-2 py-0.5 rounded-full">
                      Apply Now
                    </span>
                  </button>
                </div>
              </div>

              {/* About & Contact */}
              <button
                onClick={() => handleMobileNav('about')}
                className="flex items-center justify-between py-3.5 text-left text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors border-b border-slate-100/80"
              >
                <span>About</span>
              </button>
              <button
                onClick={() => handleMobileNav('contact')}
                className="flex items-center justify-between py-3.5 text-left text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors border-b border-slate-100/80"
              >
                <span>Contact</span>
              </button>
            </div>

            {/* Full-width gradient "Get started" button at bottom */}
            <div className="pt-5 mt-auto space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-3.5 px-6 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-transform"
              >
                <span>Get started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-center"
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
