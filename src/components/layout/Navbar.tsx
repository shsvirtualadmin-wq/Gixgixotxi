import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

const NAV_LINKS = [
  { to: '/grand-line', label: GRAND_LINE_NAME, highlight: true },
  { to: '/commons/about', label: 'Boardly Commons', shortLabel: 'Commons' },
  { to: '/features', label: 'Features' },
  { to: '/crew', label: 'Crew' },
  { to: '/store', label: 'Store' },
  { to: '/nakama-captains', label: NAKAMA_CAPTAINS_NAME },
  { to: '/pricing', label: 'Pricing' },
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
      {/* Slim full-width top bar with solid surface background, 1px bottom border, and subtle blur */}
      <header
        className="fixed top-0 inset-x-0 z-[1002] w-full border-b border-[var(--border)] backdrop-blur-md transition-colors select-none"
        style={{
          backgroundColor:
            resolvedTheme === 'dark' ? 'rgba(13, 13, 16, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <nav
          aria-label="Main Navigation"
          className="boardly-container h-16 flex items-center justify-between gap-4 text-[var(--text)]"
        >
          {/* Left side: Brand Logo vertically centered */}
          <Link
            to="/"
            onClick={handleClose}
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg text-[var(--text)]"
            aria-label="Boardly Home"
          >
            <Logo
              size="navbar"
              className="h-[34px] sm:h-[38px] w-auto text-[var(--text)]"
              alt="Boardly"
            />
          </Link>

          {/* Center Desktop Navigation with Grand Line Prominent */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.to);
              if (link.highlight) {
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={handleClose}
                    className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all border whitespace-nowrap ${
                      active
                        ? 'bg-[#D71921] text-white border-[#D71921]'
                        : 'bg-[#D71921]/10 text-[#D71921] border-[#D71921]/30 hover:bg-[#D71921] hover:text-white'
                    }`}
                  >
                    {link.shortLabel || link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={handleClose}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] font-heading font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'text-[var(--text)] font-semibold bg-[var(--surface-muted)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/60'
                  }`}
                >
                  {link.shortLabel || link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side on Desktop: Inline Sign In & Get Started buttons */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <Link
              to="/login"
              onClick={handleClose}
              className="h-9 px-4 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold border border-[var(--border-strong)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={handleClose}
              className="h-9 px-4 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold bg-[#D71921] hover:opacity-90 text-white transition-opacity whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>

          {/* Right side on Mobile/Tablet: Quick Grand Line pill + Hamburger Icon */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/grand-line"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-[#D71921]/10 text-[#D71921] border border-[#D71921]/30 hover:bg-[#D71921] hover:text-white transition-colors"
            >
              {GRAND_LINE_NAME}
            </Link>
            <button
              type="button"
              onClick={() => (isOpen ? handleClose() : handleOpen())}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text)] hover:text-[var(--accent)] transition-colors cursor-pointer bg-transparent border border-[var(--border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg p-0"
            >
              {isOpen ? (
                <X size={20} className="stroke-[2.25]" />
              ) : (
                <Menu size={20} className="stroke-[2.25]" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Full-Screen Scrollable Mobile Menu with Staggered 300ms Animation */}
      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] lg:hidden w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain select-none transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(1.25rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1.25rem, env(safe-area-inset-right, 0px))',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div className="min-h-full flex flex-col justify-between gap-6 w-full max-w-lg mx-auto">
            {/* Navigation Links in the dot font with Staggered Transition */}
            <div className="flex flex-col gap-3 sm:gap-4 my-auto py-2 shrink-0">
              {NAV_LINKS.map((link, idx) => {
                const active = isLinkActive(link.to);
                const forwardDelay = idx * 40;
                const reverseDelay = (NAV_LINKS.length - 1 - idx) * 30;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={handleClose}
                    className="font-dot text-[24px] sm:text-[28px] leading-tight transition-[opacity,transform,color] tracking-tight motion-reduce:transition-none hover:text-[#D71921] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg"
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
              className="flex flex-col gap-2.5 pt-4 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <Link
                to="/login"
                onClick={handleClose}
                className="w-full flex items-center justify-center rounded-full transition-colors text-[14px] font-semibold border border-[var(--border-strong)] hover:border-[var(--text)] text-[var(--text)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={{
                  height: '46px',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={handleClose}
                className="w-full flex items-center justify-center rounded-full transition-colors text-[14px] font-semibold bg-[#D71921] hover:bg-[#b0131a] text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={{
                  height: '46px',
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
