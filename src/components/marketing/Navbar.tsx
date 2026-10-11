import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BoardyMascot } from '../BoardyMascot';
import { useAuth } from '../../context/AuthContext';
import { MAIN_NAV_ITEMS, NavItemConfig } from '../../config/navigation';

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

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onGetStarted,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cardMenuRef = useRef<HTMLDivElement | null>(null);

  // Group MAIN_NAV_ITEMS by section
  const sections: Array<{ name: string; items: NavItemConfig[] }> = [
    {
      name: 'Main',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Main'),
    },
    {
      name: 'Prep',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Prep'),
    },
    {
      name: 'Events',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Events'),
    },
    {
      name: 'Programs',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Programs'),
    },
    {
      name: 'Company',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Company'),
    },
  ];

  // Handle open / close animation mount cycle
  useEffect(() => {
    let timeoutId: any;
    if (isOpen) {
      setIsRendered(true);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      // Focus into menu after opening
      timeoutId = setTimeout(() => {
        cardMenuRef.current?.focus();
      }, 50);
    } else if (isRendered) {
      // Keep mounted during close animation (200ms)
      timeoutId = setTimeout(() => {
        setIsRendered(false);
        document.body.style.overflow = '';
        triggerButtonRef.current?.focus();
      }, 200);
    }

    return () => {
      clearTimeout(timeoutId);
      // ALWAYS unlock on cleanup
      document.body.style.overflow = '';
    };
  }, [isOpen, isRendered]);

  // Close on Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on route change (popstate)
  useEffect(() => {
    const handleRoute = () => {
      setIsOpen(false);
    };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setIsOpen(false);

    if (href === '/' && user) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/app');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    // Map href to MarketingPage if relevant
    const clean = href.replace('/', '') as MarketingPage;
    if (clean) onNavigate(clean);
    else onNavigate('home');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardClick = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', user ? '/app' : '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const isCurrentActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const current = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const target = href.toLowerCase().replace(/\/$/, '') || '/';
    return current === target;
  };

  return (
    <>
      {/* Floating Pill Header */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 max-w-7xl mx-auto pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full glass-navbar-pill transition-all duration-200"
          aria-label="Main Navigation"
        >
          {/* Logo on Left */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 text-left cursor-pointer"
            aria-label="Boardly Home"
          >
            <BrandLogo size="md" />
          </a>

          {/* Desktop Nav Links in Center */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
            {MAIN_NAV_ITEMS.filter((i) => i.section === 'Main' || i.href === '/mdcat' || i.href === '/fsc-matric').map((link) => {
              const isActive = isCurrentActive(link.href);

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
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

          {/* Mobile Hamburger Morphing Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={handleDashboardClick}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-indigo-600 shadow-xs cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-indigo-600 shadow-xs cursor-pointer"
              >
                Start Free
              </button>
            )}

            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls="boardly-mobile-bubble-card"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer text-[#0d1b3e]"
            >
              {/* CSS morphing hamburger bars to X */}
              <div className="w-5 h-4 relative flex flex-col justify-between pointer-events-none">
                <span
                  className={`block h-0.5 w-full bg-[#0d1b3e] rounded-full transition-transform duration-200 origin-center ${
                    isOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-[#0d1b3e] rounded-full transition-opacity duration-150 ${
                    isOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-[#0d1b3e] rounded-full transition-transform duration-200 origin-center ${
                    isOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Dim backdrop layer */}
      {isRendered && (
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 cursor-pointer lg:hidden ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Requirement 2: Floating bubble card dropped under the header */}
      {isRendered && (
        <div
          id="boardly-mobile-bubble-card"
          ref={cardMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          tabIndex={-1}
          style={{
            transformOrigin: 'top right',
            transition: isOpen
              ? 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease'
              : 'transform 200ms ease, opacity 200ms ease',
            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(-12px)',
            opacity: isOpen ? 1 : 0,
          }}
          className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-[380px] z-50 lg:hidden rounded-[28px] bg-white/85 backdrop-blur-[20px] shadow-2xl border border-white p-5 max-h-[calc(100dvh-5rem)] overflow-y-auto focus:outline-none"
        >
          {/* Menu Items grouped with 40ms stagger */}
          <div className="space-y-4">
            {sections.map((section, sIndex) => (
              <div key={section.name} className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                  {section.name}
                </span>

                <div className="space-y-0.5">
                  {section.items.map((item, iIndex) => {
                    const active = isCurrentActive(item.href);
                    const staggerDelay = (sIndex * 4 + iIndex) * 35;

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleLinkClick(e, item.href)}
                        style={{
                          transitionDelay: isOpen ? `${staggerDelay}ms` : '0ms',
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          active
                            ? 'text-indigo-600 bg-indigo-50/70 font-extrabold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                          <span>{item.label}</span>
                          {item.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom of the card actions */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2">
            {user ? (
              <button
                type="button"
                onClick={handleDashboardClick}
                className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md text-sm cursor-pointer transition-colors"
              >
                Open Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onGetStarted();
                  }}
                  className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md text-sm cursor-pointer transition-colors"
                >
                  Start Free Practice
                </button>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/login');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="w-full py-2.5 rounded-2xl text-center font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-white/80 text-sm block cursor-pointer transition-colors"
                >
                  Sign In
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
