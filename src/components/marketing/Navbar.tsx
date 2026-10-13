import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { ArrowRight, Sparkles } from 'lucide-react';
import { MAIN_NAV_ITEMS, NavItemConfig } from '../../config/navigation';

export type MarketingPage =
  | 'home'
  | 'features'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'faq'
  | 'faqs'
  | 'terms'
  | 'privacy'
  | 'boardy'
  | 'boardly-ai'
  | 'mdcat'
  | 'fsc'
  | 'fsc-matric'
  | 'fast'
  | 'fast-nu'
  | 'captain'
  | 'crew'
  | 'blitz'
  | 'blitz/register'
  | 'blitz/leaderboard'
  | 'arena'
  | 'arena/leaderboard'
  | 'circles'
  | 'circles/apply'
  | 'reviews';

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
      tag: 'text-[#93c5fd] bg-blue-500/10 border-blue-500/20',
      activeBar: 'bg-[#1a6dff]',
      activeText: 'text-[#38bdf8] font-semibold',
      buttonBg: 'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30',
    },
    captain: {
      tag: 'text-[#fcd34d] bg-amber-500/10 border-amber-500/20',
      activeBar: 'bg-[#f5b942]',
      activeText: 'text-[#fcd34d] font-semibold',
      buttonBg: 'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30',
    },
    crew: {
      tag: 'text-[#c7d2fe] bg-violet-500/10 border-violet-500/20',
      activeBar: 'bg-[#818cf8]',
      activeText: 'text-[#c7d2fe] font-semibold',
      buttonBg: 'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30',
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

  // Detect whether navbar is hovering over a light or dark section
  const [isLightSection, setIsLightSection] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const navY = 50;
      const navX = window.innerWidth / 2;
      const el = document.elementFromPoint(navX, navY);
      if (!el) return;
      const lightSection = el.closest(
        '[data-variant="light"], [data-theme="light"], .bg-white, .bg-\\[\\#f8f9ff\\]'
      );
      setIsLightSection(Boolean(lightSection));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
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
      {/* Background Dim Backdrop (No extra blur band) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Clean Glass Pill Navigation Container: height 64px, radius 9999px */}
      <header className="fixed top-3.5 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 max-w-4xl mx-auto pointer-events-none">
        <div
          ref={containerRef}
          className="pointer-events-auto relative w-full transition-all duration-300 overflow-hidden shadow-xl"
          style={{
            backgroundColor: isOpen
              ? 'rgba(15, 23, 42, 0.95)'
              : isLightSection
              ? 'rgba(255, 255, 255, 0.75)'
              : 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: isOpen ? '28px' : '20px',
            minHeight: '64px',
            boxShadow:
              isLightSection && !isOpen
                ? '0 8px 32px rgba(15, 23, 42, 0.08)'
                : '0 8px 32px rgba(0, 0, 0, 0.28)',
          }}
        >
          {/* Top Pill Bar - Exactly 64px high */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 min-h-[64px]">
            {/* Logo on Left: icon + Boardly wordmark, ONE logo only + optional program tag */}
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="flex items-center gap-2.5 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6dff] rounded-lg"
              aria-label="Boardly Home"
            >
              <BrandLogo size="md" variant={isLightSection && !isOpen ? 'light' : 'dark'} />
              {programTag && (
                <span
                  className="text-[12px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full border border-white/15"
                  style={{
                    backgroundColor:
                      isLightSection && !isOpen
                        ? 'rgba(15, 23, 42, 0.06)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color:
                      accent === 'crew'
                        ? isLightSection && !isOpen
                          ? '#4f46e5'
                          : '#c7d2fe'
                        : accent === 'captain'
                        ? isLightSection && !isOpen
                          ? '#b45309'
                          : '#fcd34d'
                        : isLightSection && !isOpen
                        ? '#1d4ed8'
                        : '#93c5fd',
                  }}
                >
                  {programTag === 'Crew' ? 'Crew' : 'Captain'}
                </span>
              )}
            </a>

            {/* Hamburger Button on Right (Morphs to X) */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6dff] cursor-pointer"
            >
              <div className="w-5 h-4 relative flex flex-col justify-between pointer-events-none">
                <span
                  style={{
                    backgroundColor: isLightSection && !isOpen ? '#0f172a' : '#ffffff',
                    transition:
                      'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease',
                    transform: isOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full rounded-full origin-center"
                />
                <span
                  style={{
                    backgroundColor: isLightSection && !isOpen ? '#0f172a' : '#ffffff',
                    transition: 'opacity 200ms ease, background-color 200ms ease',
                    opacity: isOpen ? 0 : 1,
                  }}
                  className="block h-0.5 w-full rounded-full"
                />
                <span
                  style={{
                    backgroundColor: isLightSection && !isOpen ? '#0f172a' : '#ffffff',
                    transition:
                      'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease',
                    transform: isOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full rounded-full origin-center"
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
                className="px-4 sm:px-6 pb-6 pt-2 border-t border-white/10 max-h-[calc(85dvh-4rem)] overflow-y-auto"
              >
                <div className="space-y-4 pt-2">
                  {sections.map((section, sIdx) => (
                    <div key={section.name} className="space-y-1">
                      <div className="text-[12px] font-semibold text-white/60 tracking-normal px-3">
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
                                    ? `bg-white/15 text-white`
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
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
                                  {item.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 opacity-40 text-white" />
                              </a>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Primary Action Button */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className={`w-full min-h-[52px] py-3.5 px-6 rounded-full overflow-hidden text-center font-bold text-base cursor-pointer transition-transform duration-150 active:scale-[0.98] ${accentStyles.buttonBg}`}
                  >
                    {user ? 'Open Student Dashboard' : 'Get Started Free'}
                  </button>
                  {!user && (
                    <a
                      href="/login"
                      onClick={(e) => handleLinkClick(e, '/login')}
                      className="block w-full py-2.5 text-center text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
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
