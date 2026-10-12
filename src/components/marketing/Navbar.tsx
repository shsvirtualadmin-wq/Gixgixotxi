import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
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
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
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

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        cardMenuRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  // Close on popstate
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

  // Requirement: Tapping a link plays the close animation first (~350ms), then navigates
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setIsOpen(false);

    setTimeout(() => {
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

      const clean = href.replace('/', '') as MarketingPage;
      if (clean) onNavigate(clean);
      else onNavigate('home');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 350);
  };

  const handleDashboardClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', user ? '/app' : '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 350);
  };

  const handleActionClick = (action: () => void) => {
    setIsOpen(false);
    setTimeout(() => {
      action();
    }, 350);
  };

  return (
    <>
      {/* Floating Pill Header: Requirement 1 - The header only has the logo and the hamburger icon */}
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

          {/* Morphing Hamburger Button on Right */}
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="boardly-mobile-bubble-card"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100/80 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer text-[#0d1b3e]"
          >
            {/* CSS morphing hamburger bars to X over ~300ms */}
            <div className="w-5 h-4 relative flex flex-col justify-between pointer-events-none">
              <span
                style={{
                  transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: isOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                }}
                className="block h-0.5 w-full bg-[#0d1b3e] rounded-full origin-center"
              />
              <span
                style={{
                  transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: isOpen ? 0 : 1,
                }}
                className="block h-0.5 w-full bg-[#0d1b3e] rounded-full"
              />
              <span
                style={{
                  transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: isOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                }}
                className="block h-0.5 w-full bg-[#0d1b3e] rounded-full origin-center"
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Floating Hamburger Menu & Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark backdrop fades in with light blur over about 400ms. Exits in ~350ms */}
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[4px] cursor-pointer"
              aria-hidden="true"
            />

            {/* Floating Panel:
                OPEN: 550-650ms (600ms), ease-out (cubic-bezier 0.22, 1, 0.36, 1).
                Starts translateY -16px, scale 0.96, opacity 0 -> glides down to place.
                CLOSE: slightly faster (~350ms), translateY -16px, scale 0.96, opacity 0.
            */}
            <motion.div
              key="nav-panel"
              id="boardly-mobile-bubble-card"
              ref={cardMenuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation"
              tabIndex={-1}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : -16 }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-[380px] z-50 rounded-[28px] bg-white/90 backdrop-blur-[24px] shadow-2xl border border-white/80 p-5 max-h-[calc(100dvh-5rem)] overflow-y-auto focus:outline-none"
            >
              {/* Menu items appear one after another (stagger 55ms, fading up 12px over 350ms), starting halfway (~300ms) */}
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      delayChildren: shouldReduceMotion ? 0 : 0.3,
                      staggerChildren: shouldReduceMotion ? 0 : 0.055,
                    },
                  },
                  exit: {
                    transition: {
                      staggerChildren: 0.02,
                      staggerDirection: -1,
                    },
                  },
                }}
              >
                {sections.map((section) => (
                  <div key={section.name} className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                      {section.name}
                    </span>

                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isCurrentActive(item.href);

                        return (
                          <motion.div
                            key={item.href}
                            variants={{
                              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                  duration: shouldReduceMotion ? 0.05 : 0.35,
                                  ease: [0.22, 1, 0.36, 1],
                                },
                              },
                              exit: {
                                opacity: 0,
                                transition: { duration: shouldReduceMotion ? 0.05 : 0.18 },
                              },
                            }}
                          >
                            <a
                              href={item.href}
                              onClick={(e) => handleLinkClick(e, item.href)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Bottom of the card actions: Keep "Start Free Practice" at the bottom of the menu panel */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.35, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="mt-5 pt-4 border-t border-slate-200/80 space-y-2"
              >
                {user ? (
                  <button
                    type="button"
                    onClick={handleDashboardClick}
                    className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md text-sm cursor-pointer transition-all"
                  >
                    Open Student Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleActionClick(onGetStarted)}
                      className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md text-sm cursor-pointer transition-all"
                    >
                      Start Free Practice
                    </button>
                    <a
                      href="/login"
                      onClick={(e) => handleLinkClick(e, '/login')}
                      className="w-full py-2.5 rounded-2xl text-center font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-white/80 active:scale-95 text-sm block cursor-pointer transition-all"
                    >
                      Sign In
                    </a>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
