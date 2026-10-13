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
  | 'arena/register'
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
  getStartedText?: string;
  getStartedHref?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage = 'home',
  accent = 'default',
  programTag,
  onNavigate,
  onGetStarted,
  getStartedText,
  getStartedHref,
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

  const finalTargetHref =
    getStartedHref ||
    (accent === 'crew'
      ? '/crew/apply'
      : accent === 'captain'
      ? '/captain/apply'
      : user
      ? '/app'
      : '/signup');

  const finalTargetText =
    getStartedText ||
    (accent === 'crew'
      ? 'Apply to Join Crew'
      : accent === 'captain'
      ? 'Apply as Captain'
      : user
      ? 'Open Student Dashboard'
      : 'Get Started Free');

  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setIsOpen(false);
    setTimeout(() => {
      if (onGetStarted) {
        onGetStarted();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', finalTargetHref);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-pointer"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.35)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Clean Glass Pill Navigation Container */}
      <header
        ref={containerRef}
        className="fixed top-3.5 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 max-w-4xl mx-auto pointer-events-none"
      >
        {/* Top Navbar Pill: stays white while open, radius 9999px */}
        <div
          className="pointer-events-auto relative w-full transition-all duration-200 overflow-hidden shadow-xl flex items-center justify-between px-4 sm:px-6 h-16 min-h-[64px]"
          style={{
            backgroundColor: isOpen
              ? '#ffffff'
              : isLightSection
              ? 'rgba(255, 255, 255, 0.85)'
              : 'rgba(15, 23, 42, 0.65)',
            backdropFilter: isOpen ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: isOpen ? 'none' : 'blur(16px)',
            border: isOpen
              ? '1px solid #e2e8f0'
              : isLightSection
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            boxShadow: isOpen
              ? '0 10px 30px rgba(15, 23, 42, 0.08)'
              : isLightSection
              ? '0 8px 32px rgba(15, 23, 42, 0.08)'
              : '0 8px 32px rgba(0, 0, 0, 0.28)',
          }}
        >
          {/* Logo on Left: icon + Boardly wordmark, ONE logo only + optional program tag */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="flex items-center gap-2.5 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6dff] rounded-lg"
            aria-label="Boardly Home"
          >
            <BrandLogo size="md" variant={isOpen || isLightSection ? 'light' : 'dark'} />
            {programTag && (
              <span
                className="text-[12px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor:
                    isOpen || isLightSection
                      ? 'rgba(15, 23, 42, 0.06)'
                      : 'rgba(255, 255, 255, 0.08)',
                  borderColor:
                    isOpen || isLightSection
                      ? 'rgba(15, 23, 42, 0.1)'
                      : 'rgba(255, 255, 255, 0.15)',
                  color:
                    accent === 'crew'
                      ? isOpen || isLightSection
                        ? '#4f46e5'
                        : '#c7d2fe'
                      : accent === 'captain'
                      ? isOpen || isLightSection
                        ? '#b45309'
                        : '#fcd34d'
                      : isOpen || isLightSection
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
            className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6dff] cursor-pointer"
          >
            <div className="w-5 h-4 relative flex flex-col justify-between pointer-events-none">
              <span
                style={{
                  backgroundColor: isOpen || isLightSection ? '#0f172a' : '#ffffff',
                  transition:
                    'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease',
                  transform: isOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                }}
                className="block h-0.5 w-full rounded-full origin-center"
              />
              <span
                style={{
                  backgroundColor: isOpen || isLightSection ? '#0f172a' : '#ffffff',
                  transition: 'opacity 200ms ease, background-color 200ms ease',
                  opacity: isOpen ? 0 : 1,
                }}
                className="block h-0.5 w-full rounded-full"
              />
              <span
                style={{
                  backgroundColor: isOpen || isLightSection ? '#0f172a' : '#ffffff',
                  transition:
                    'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease',
                  transform: isOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                }}
                className="block h-0.5 w-full rounded-full origin-center"
              />
            </div>
          </button>
        </div>

        {/* Menu Panel - attached right under navbar with 8px gap */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="menu-panel"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-auto mt-2 w-full overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '28px',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
                maxHeight: 'calc(100dvh - 120px)',
                overscrollBehavior: 'contain',
              }}
            >
              <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 pb-6 space-y-4">
                {sections.map((section) => (
                  <div key={section.name} className="space-y-1">
                    <div className="text-[12px] font-semibold text-[#64748b] px-3 pt-4 first:pt-0">
                      {section.name}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {section.items.map((item) => {
                        const active = isCurrentActive(item.href);

                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleLinkClick(e, item.href)}
                            className={`w-full h-[52px] min-h-[52px] flex items-center justify-between px-4 rounded-[16px] text-[16px] transition-colors cursor-pointer select-none ${
                              active
                                ? 'bg-[#eef2ff] text-[#1a6dff] font-semibold'
                                : 'text-[#0f172a] font-medium hover:bg-[#f1f5f9] active:bg-[#f1f5f9]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{item.label}</span>
                              {item.isAi && <Sparkles className="w-4 h-4 text-[#f5b942]" />}
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#94a3b8]" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bottom Primary Action Button and Sign In link */}
                <div className="pt-4 border-t border-[#e2e8f0] space-y-4">
                  <a
                    href={finalTargetHref}
                    onClick={handleGetStarted}
                    className="w-full h-[56px] min-h-[56px] rounded-full text-white font-bold text-[16px] cursor-pointer transition-transform duration-150 active:scale-[0.98] flex items-center justify-center select-none shadow-sm"
                    style={{
                      borderRadius: '9999px',
                      backgroundColor: '#1a6dff',
                      color: '#ffffff',
                    }}
                  >
                    {finalTargetText}
                  </a>

                  {!user && (
                    <div className="text-center pt-1 pb-1">
                      <a
                        href="/login"
                        onClick={(e) => handleLinkClick(e, '/login')}
                        className="inline-block text-[14px] text-[#475569] hover:text-[#0f172a] transition-colors cursor-pointer"
                      >
                        Already have an account?{' '}
                        <span className="text-[#1a6dff] font-semibold underline underline-offset-2">
                          Sign in
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
