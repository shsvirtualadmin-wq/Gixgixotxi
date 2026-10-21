import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
  const { theme, resolvedTheme, setTheme } = useTheme();
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
      {/* Floating card navbar inset 16px from edges, 12px from top, fixed while scrolling */}
      <header
        className="fixed top-0 inset-x-0 z-[1002] flex justify-center px-4 pointer-events-none"
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <nav
          aria-label="Main Navigation"
          className="w-full max-w-[1200px] h-[72px] md:h-[80px] rounded-[20px] px-5 sm:px-6 flex items-center justify-between pointer-events-auto border transition-colors select-none text-[var(--text)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: resolvedTheme === 'dark' ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Left side: Brand Logo vertically centered, sized 40-48px height, linked to home */}
          <Link
            to="/"
            onClick={handleClose}
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg text-[var(--text)]"
            aria-label="Boardly Home"
          >
            <Logo
              size="navbar"
              className="h-[40px] sm:h-[46px] md:h-[48px] w-auto text-[var(--text)]"
              alt="Boardly"
            />
          </Link>

          {/* Right side: Clean 24px Hamburger / Close Icon with 44px tap area */}
          <button
            type="button"
            onClick={() => (isOpen ? handleClose() : handleOpen())}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text)] hover:text-[var(--accent)] transition-colors cursor-pointer bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg p-0"
          >
            {isOpen ? (
              <X size={24} className="stroke-[2.25]" />
            ) : (
              <Menu size={24} className="stroke-[2.25]" />
            )}
          </button>
        </nav>
      </header>

      {/* Full-Screen Scrollable Mobile Menu with Staggered 300ms Animation */}
      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain select-none transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            paddingTop: 'calc(100px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right, 0px))',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div className="min-h-full flex flex-col justify-between gap-6 w-full max-w-lg mx-auto">
            {/* Large Navigation Links in the dot font with Staggered Transition */}
            <div className="flex flex-col gap-4 sm:gap-5 my-auto py-2 shrink-0">
              {NAV_LINKS.map((link, idx) => {
                const active = isLinkActive(link.to);
                const forwardDelay = idx * 40;
                const reverseDelay = (NAV_LINKS.length - 1 - idx) * 30;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={handleClose}
                    className="font-dot text-[30px] sm:text-[36px] leading-tight transition-[opacity,transform,color] tracking-tight motion-reduce:transition-none hover:text-[#D71921] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg"
                    style={{
                      fontFamily: 'var(--font-dot)',
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      color: active ? '#D71921' : 'var(--text)',
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

            {/* Bottom Auth Buttons & Appearance segmented control */}
            <div
              className="flex flex-col gap-3 pt-5 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <Link
                to="/login"
                onClick={handleClose}
                className="w-full flex items-center justify-center rounded-full transition-colors text-[15px] font-semibold border border-[var(--border-strong)] hover:border-[var(--text)] text-[var(--text)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
                className="w-full flex items-center justify-center rounded-full transition-colors text-[15px] font-semibold bg-[#D71921] hover:bg-[#b0131a] text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={{
                  height: '52px',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Get Started
              </Link>

              {/* Three-option segmented control: Light, Dark, System */}
              <div className="pt-2 pb-1 shrink-0 flex justify-center">
                <div
                  role="radiogroup"
                  aria-label="Appearance"
                  className="inline-flex items-center p-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-medium transition-colors"
                >
                  {(['light', 'dark', 'system'] as const).map((mode) => {
                    const isSelected = theme === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setTheme(mode)}
                        className={`px-3.5 py-1.5 rounded-full capitalize transition-all cursor-pointer text-[13px] ${
                          isSelected
                            ? 'bg-[#D71921] text-white font-semibold shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
