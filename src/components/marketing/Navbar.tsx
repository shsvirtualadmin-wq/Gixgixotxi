import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BoardyMascot } from '../BoardyMascot';
import { useAuth } from '../../context/AuthContext';

export type MarketingPage =
  | 'home'
  | 'features'
  | 'pricing'
  | 'boardly-ai'
  | 'boardy'
  | 'mdcat'
  | 'fsc-matric'
  | 'fast-nu'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'reviews'
  | 'faqs'
  | 'blitz'
  | 'blitz/register'
  | 'blitz/leaderboard'
  | 'arena'
  | 'arena/leaderboard'
  | 'circles'
  | 'circles/apply';

interface NavbarProps {
  currentPage: MarketingPage;
  onNavigate: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
  onGetStarted: () => void;
}

export const NAV_LINKS: Array<{ id: MarketingPage; href: string; label: string; isAi?: boolean }> = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'features', href: '/features', label: 'Features' },
  { id: 'pricing', href: '/pricing', label: 'Pricing' },
  { id: 'boardly-ai', href: '/boardly-ai', label: 'Boardly AI', isAi: true },
  { id: 'mdcat', href: '/mdcat', label: 'MDCAT' },
  { id: 'fsc-matric', href: '/fsc-matric', label: 'FSC & Matric' },
  { id: 'about', href: '/about', label: 'About' },
  { id: 'contact', href: '/contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenEventModal,
  onOpenProgramModal,
  onGetStarted,
}) => {
  const { user } = useAuth();
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

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: MarketingPage, href: string) => {
    // If middle click or holding ctrl/cmd, let the browser handle opening new tab
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMobileMenuOpen(false);

    if (page === 'home' && user) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/app');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
    }
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardClick = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', user ? '/app' : '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <>
      {/* Floating Top Header Navigation */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 max-w-7xl mx-auto pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full glass-navbar-pill transition-all duration-200"
          aria-label="Main Navigation"
        >
          {/* Logo on Left */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, 'home', '/')}
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 text-left cursor-pointer"
            aria-label="Boardly Home"
          >
            <BrandLogo size="md" />
          </a>

          {/* Desktop Nav Links in Center: Real <a href> tags for crawlers & sitelinks */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const isActive =
                currentPage === link.id ||
                (link.id === 'boardly-ai' && currentPage === 'boardy');

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.id, link.href)}
                  className={`transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.isAi && <BoardyMascot size={16} />}
                  <span>{link.label}</span>
                  {link.isAi && <Sparkles className="w-3 h-3 text-amber-500" />}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right Action on Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={handleDashboardClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs xl:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <span>Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/login');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="px-4 py-2 rounded-full text-xs xl:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Sign In
                </a>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs xl:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={handleDashboardClick}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-indigo-600 shadow-xs"
              >
                Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-indigo-600 shadow-xs"
              >
                Start Free
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Navigation (with plain <a> tags) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, 'home', '/')}
              className="flex items-center gap-2"
              aria-label="Boardly Home"
            >
              <BrandLogo size="md" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                currentPage === link.id ||
                (link.id === 'boardly-ai' && currentPage === 'boardy');

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.id, link.href)}
                  className={`flex items-center justify-between py-3 text-lg font-bold border-b border-slate-100/80 transition-colors ${
                    isActive
                      ? 'text-indigo-600 font-extrabold'
                      : 'text-slate-800 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {link.isAi && <BoardyMascot size={20} />}
                    <span>{link.label}</span>
                    {link.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </a>
              );
            })}

            {/* Additional Secondary Mobile Links */}
            <a
              href="/fast-nu"
              onClick={(e) => handleLinkClick(e, 'fast-nu', '/fast-nu')}
              className="flex items-center justify-between py-3 text-lg font-bold text-slate-800 hover:text-indigo-600 border-b border-slate-100/80"
            >
              <span>FAST-NU Prep</span>
            </a>
            <a
              href="/privacy"
              onClick={(e) => handleLinkClick(e, 'privacy', '/privacy')}
              className="flex items-center justify-between py-3 text-base font-semibold text-slate-600 hover:text-indigo-600 border-b border-slate-100/80"
            >
              <span>Privacy Policy</span>
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLinkClick(e, 'terms', '/terms')}
              className="flex items-center justify-between py-3 text-base font-semibold text-slate-600 hover:text-indigo-600 border-b border-slate-100/80"
            >
              <span>Terms of Service</span>
            </a>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onGetStarted();
              }}
              className="w-full py-3.5 rounded-2xl text-center font-bold text-white bg-indigo-600 shadow-md text-sm cursor-pointer"
            >
              Start Free Practice
            </button>
            {!user && (
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="w-full py-3 rounded-2xl text-center font-bold text-slate-700 bg-white border border-slate-200 text-sm block cursor-pointer"
              >
                Sign In to Account
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};
