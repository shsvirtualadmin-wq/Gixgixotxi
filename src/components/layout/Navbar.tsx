import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/commons/about', label: 'Boardly Commons', shortLabel: 'Commons' },
  { to: '/crew', label: 'Crew' },
  { to: '/store', label: 'Store' },
  { to: '/nakama-captains', label: NAKAMA_CAPTAINS_NAME },
  { to: '/pricing', label: 'Pricing' },
  { to: '/grand-line', label: GRAND_LINE_NAME },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsMounted(true);
    // Request animation frame for smooth slide down + fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
    }, 300);
  };

  // Close on route change
  useEffect(() => {
    handleClose();
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [location.pathname, location.hash]);

  // Lock page scroll while mobile menu is open
  useEffect(() => {
    if (isMounted) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMounted]);

  const isLinkActive = (to: string) => {
    if (location.pathname === to) return true;
    if (to === '/commons/about' && (location.pathname === '/commons/about' || location.pathname === '/about-commons')) return true;
    return false;
  };

  return (
    <>
      {/* Sticky header with top offset 12px plus safe area, z-index 1000 */}
      <header
        className="sticky z-[1000] w-full"
        style={{
          top: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="boardly-container">
          <nav
            aria-label="Main Navigation"
            className="w-full h-[72px] sm:h-[80px] rounded-full px-4 sm:px-7 flex items-center justify-between text-white transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? '#141414' : '#0A0A0A',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 12px 36px -8px rgba(0,0,0,0.35)',
            }}
          >
            {/* Brand Logo - 100% white, full opacity, no fade filter */}
            <Link to="/" className="flex items-center shrink-0" aria-label="Boardly Home">
              <Logo
                className="h-[52px] sm:h-[64px]"
                style={{ filter: 'none', opacity: 1 }}
                alt="Boardly"
              />
            </Link>

            {/* Desktop Unified Segmented Pill Links */}
            <div className="hidden lg:flex items-center gap-1 bg-[rgba(255,255,255,0.08)] rounded-full p-1.5 border border-[rgba(255,255,255,0.1)]">
              {NAV_LINKS.map((link) => {
                const active = isLinkActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-xs xl:text-sm font-medium px-3 xl:px-4 py-2 rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-[rgba(255,255,255,0.7)] hover:text-white'
                    }`}
                  >
                    {link.shortLabel || link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Actions: Sign In, Get Started, Theme Toggle */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs xl:text-sm font-medium px-4 py-2 rounded-full border border-[rgba(255,255,255,0.6)] hover:border-white text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-xs xl:text-sm font-semibold px-4 py-2 rounded-full bg-[#D71921] hover:bg-[#b0131a] text-white transition-all shadow-sm cursor-pointer"
              >
                Get Started
              </Link>
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white ml-1"
              >
                {theme === 'dark' ? <Sun size={22} className="text-white" /> : <Moon size={22} className="text-white" />}
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
              >
                {theme === 'dark' ? <Sun size={22} className="text-white" /> : <Moon size={22} className="text-white" />}
              </button>
              <button
                onClick={() => (isOpen ? handleClose() : handleOpen())}
                aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
              >
                {isOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Scrollable Mobile Menu with Staggered 300ms Animation */}
      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain select-none transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
          style={{
            backgroundColor: '#0A0A0A',
            color: '#FFFFFF',
            paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right, 0px))',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div className="min-h-full flex flex-col justify-between gap-6 w-full max-w-lg mx-auto">
            {/* Top Bar inside Menu */}
            <div
              className="flex items-center justify-between pb-5 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Link
                to="/"
                onClick={handleClose}
                className="flex items-center shrink-0"
                aria-label="Boardly Home"
              >
                <Logo
                  className="h-[52px] sm:h-[64px]"
                  style={{ filter: 'none', opacity: 1 }}
                  alt="Boardly"
                />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
                >
                  {theme === 'dark' ? <Sun size={22} className="text-white" /> : <Moon size={22} className="text-white" />}
                </button>
                <button
                  onClick={handleClose}
                  aria-label="Close menu"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Large Navigation Links in the dot font with Staggered Transition */}
            <div className="flex flex-col gap-4 sm:gap-5 my-auto py-4 shrink-0">
              {NAV_LINKS.map((link, idx) => {
                const active = isLinkActive(link.to);
                const forwardDelay = idx * 40;
                const reverseDelay = (NAV_LINKS.length - 1 - idx) * 30;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={handleClose}
                    className="font-dot text-[30px] sm:text-[36px] leading-tight transition-[opacity,transform,color] tracking-tight motion-reduce:transition-none"
                    style={{
                      fontFamily: 'var(--font-dot)',
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      color: active ? '#D71921' : '#FFFFFF',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                      transitionDuration: '300ms',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${isOpen ? forwardDelay : reverseDelay}ms`,
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Auth Buttons (Scrollable & always reachable) */}
            <div
              className="flex flex-col gap-3 pt-5 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Link
                to="/login"
                onClick={handleClose}
                className="w-full flex items-center justify-center rounded-full transition-colors text-[15px] font-semibold border border-[rgba(255,255,255,0.6)] hover:border-white text-white hover:bg-white/10"
                style={{
                  height: '52px',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={handleClose}
                className="w-full flex items-center justify-center rounded-full transition-colors text-[15px] font-semibold bg-[#D71921] hover:bg-[#b0131a] text-white shadow-sm"
                style={{
                  height: '52px',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
