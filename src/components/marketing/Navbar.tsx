import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
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

export interface NavbarProps {
  currentPage?: MarketingPage | string;
  accent?: 'default' | 'captain' | 'crew';
  programTag?: 'Captain' | 'Crew';
  onNavigate?: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
  onGetStarted?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage = 'home',
  accent = 'default',
  programTag,
  onNavigate,
  onGetStarted,
}) => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const accentStyles = {
    default: {
      tag: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      activeBar: 'bg-indigo-600',
      activeText: 'text-indigo-600 dark:text-indigo-400 font-bold',
      buttonBg: 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-lg shadow-indigo-600/25',
    },
    captain: {
      tag: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      activeBar: 'bg-amber-500',
      activeText: 'text-amber-700 dark:text-amber-400 font-bold',
      buttonBg: 'bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white shadow-lg shadow-amber-500/25',
    },
    crew: {
      tag: 'text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
      activeBar: 'bg-violet-600',
      activeText: 'text-violet-700 dark:text-violet-400 font-bold',
      buttonBg: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white shadow-lg shadow-violet-600/25',
    },
  }[accent];

  // Group MAIN_NAV_ITEMS by section
  const sections: Array<{ name: string; items: NavItemConfig[] }> = [
    { name: 'Main', items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Main') },
    { name: 'Prep', items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Prep') },
    { name: 'Events', items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Events') },
    { name: 'Programs', items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Programs') },
    { name: 'Company', items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Company') },
  ];

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on popstate / route change
  useEffect(() => {
    const handleRoute = () => {
      setIsOpen(false);
    };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const isCurrentActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const current = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const target = href.toLowerCase().replace(/\/$/, '') || '/';
    return current === target;
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setIsOpen(false);

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      if (onNavigate) {
        const clean = href.replace('/', '') as MarketingPage;
        if (clean) onNavigate(clean);
        else onNavigate('home');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleGetStarted = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (onGetStarted) {
        onGetStarted();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', user ? '/app' : '/signup');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 200);
  };

  return (
    <>
      {/* Background Dim Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Glass Pill Navigation Container */}
      <header className="fixed top-3.5 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 max-w-4xl mx-auto pointer-events-none">
        <div
          ref={containerRef}
          className="pointer-events-auto relative w-full rounded-[24px] sm:rounded-[28px] bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 shadow-lg shadow-indigo-950/5 transition-all duration-300 overflow-hidden"
        >
          {/* Top Pill Bar */}
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3">
            {/* Logo on Left: icon + Boardly wordmark, ONE logo only + optional program tag */}
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="flex items-center gap-2 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
              aria-label="Boardly Home"
            >
              <BrandLogo size="md" />
              {programTag && (
                <span
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentStyles.tag}`}
                >
                  {programTag}
                </span>
              )}
            </a>

            {/* Hamburger Button on Right (Morphs to X) */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100/60 dark:hover:bg-slate-800/60 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer text-slate-800 dark:text-slate-100"
            >
              <div className="w-5 h-4 relative flex flex-col justify-between pointer-events-none">
                <span
                  style={{
                    transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: isOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full bg-slate-900 dark:bg-white rounded-full origin-center"
                />
                <span
                  style={{
                    transition: 'opacity 200ms ease',
                    opacity: isOpen ? 0 : 1,
                  }}
                  className="block h-0.5 w-full bg-slate-900 dark:bg-white rounded-full"
                />
                <span
                  style={{
                    transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: isOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full bg-slate-900 dark:bg-white rounded-full origin-center"
                />
              </div>
            </button>
          </div>

          {/* Expanded Downward Menu Card */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="menu-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.05 : 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 max-h-[calc(85dvh-4rem)] overflow-y-auto"
              >
                <div className="space-y-4 pt-2">
                  {sections.map((section, sIdx) => (
                    <div key={section.name} className="space-y-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3">
                        {section.name}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {section.items.map((item, iIdx) => {
                          const active = isCurrentActive(item.href);
                          const totalIdx = sIdx * 4 + iIdx;

                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: shouldReduceMotion ? 0 : totalIdx * 0.04,
                                duration: 0.2,
                              }}
                            >
                              <a
                                href={item.href}
                                onClick={(e) => handleLinkClick(e, item.href)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 relative cursor-pointer ${
                                  active
                                    ? `bg-slate-100/80 dark:bg-slate-800/80 ${accentStyles.activeText}`
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                {/* Left accent indicator for active page */}
                                {active && (
                                  <span
                                    className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${accentStyles.activeBar}`}
                                  />
                                )}
                                <div className="flex items-center gap-2 pl-1">
                                  <span>{item.label}</span>
                                  {item.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                              </a>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Primary Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className={`w-full min-h-[46px] py-3 px-6 rounded-2xl text-center font-bold text-sm cursor-pointer transition-transform duration-150 active:scale-[0.98] ${accentStyles.buttonBg}`}
                  >
                    {user ? 'Open Student Dashboard' : 'Get Started Free'}
                  </button>
                  {!user && (
                    <a
                      href="/login"
                      onClick={(e) => handleLinkClick(e, '/login')}
                      className="block w-full py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Already have an account? <span className="underline">Sign in</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
};
