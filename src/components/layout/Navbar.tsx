import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { useHomeUrl } from '@/utils/homeUrl';

const ALL_NAV_LINKS = [
  { to: '/rewards', label: 'Rewards' },
  { to: '/grand-line', label: GRAND_LINE_NAME },
  { to: '/mcqs', label: 'Subject MCQs', shortLabel: 'MCQs' },
  { to: '/commons', label: 'Boardly Commons', shortLabel: 'Commons' },
  { to: '/material', label: 'Study Material', shortLabel: 'Material' },
  { to: '/features', label: 'Features' },
  { to: '/crew', label: 'Crew' },
  { to: '/store', label: 'Store' },
  { to: '/captains', label: NAKAMA_CAPTAINS_NAME, shortLabel: 'Captains' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

// Top desktop navbar excludes Grand Line and Rewards buttons to keep it clean and focused
const DESKTOP_NAV_LINKS = ALL_NAV_LINKS.filter(
  (link) => link.to !== '/grand-line' && link.to !== '/rewards'
);

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const homeUrl = useHomeUrl();
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsMounted(true);
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

  const isDark = resolvedTheme === 'dark';

  const pillElement = (
    <header
      role="banner"
      aria-label="Main Navigation"
      className="boardly-top-nav-pill public-header-glass-bar dark-surface-preserve"
    >
      {/* Left side: Boardly logo/wordmark */}
      <Link
        to={homeUrl}
        onClick={handleClose}
        className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full text-white"
        style={{ color: '#FFFFFF' }}
        aria-label="Boardly Home"
      >
        <Logo
          size="navbar"
          className="h-[36px] sm:h-[40px] w-auto text-white"
          style={{ color: '#FFFFFF' }}
          alt="Boardly"
        />
      </Link>

      {/* Center Desktop Navigation */}
      <nav
        aria-label="Primary Links"
        className="hidden xl:flex items-center gap-1 2xl:gap-1.5"
      >
        {DESKTOP_NAV_LINKS.map((link) => {
          const active = isLinkActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleClose}
              className={`px-2.5 py-1.5 rounded-full text-[13px] font-heading font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'text-white font-semibold bg-white/[0.18]'
                  : 'text-white/85 hover:text-white hover:bg-white/[0.10]'
              }`}
            >
              {link.shortLabel || link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side on Desktop: Sign In & Get Started buttons */}
      <div className="hidden xl:flex items-center gap-2.5 shrink-0">
        <Link
          to="/login"
          onClick={handleClose}
          className="h-9 px-4 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold border border-white/25 text-white bg-white/[0.12] hover:bg-white/[0.20] transition-colors whitespace-nowrap"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          onClick={handleClose}
          className="h-9 px-4.5 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold bg-white text-[#780a14] hover:bg-white/90 transition-colors whitespace-nowrap"
          style={{ color: '#780a14' }}
        >
          Get Started
        </Link>
      </div>

      {/* Right side on Mobile & Mid-size screens (<1280px): 44px translucent white circle Hamburger button */}
      <button
        type="button"
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className="boardly-top-nav-circle-btn xl:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {isOpen ? (
          <X size={20} className="stroke-[2.25]" />
        ) : (
          <Menu size={20} className="stroke-[2.25]" />
        )}
      </button>
    </header>
  );

  return (
    <>
      {typeof document !== 'undefined'
        ? createPortal(pillElement, document.body)
        : pillElement}

      {/* Separate Mobile Menu Overlay (Portaled to body, outside the pill) */}
      {isMounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="fixed inset-0 z-[999] xl:hidden w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain select-none flex flex-col justify-start p-4 sm:p-6"
            style={{
              paddingTop: 'calc(84px + env(safe-area-inset-top, 0px))',
            }}
          >
            {/* Dimmed backdrop without backdrop-filter so the top pill's blur stays clean */}
            <div
              onClick={handleClose}
              className="fixed inset-0 z-0 bg-black/55 transition-opacity duration-200 ease-out cursor-pointer"
              style={{ opacity: isOpen ? 1 : 0 }}
              aria-hidden="true"
            />

            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg mx-auto rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 flex flex-col gap-5 glass allow-backdrop-blur transition-all duration-250 max-h-[calc(100dvh-104px)] overflow-y-auto"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.98)',
              }}
            >
              {/* Navigation Links in the dot font with Staggered Transition & 48px+ tap target */}
              <div className="flex flex-col gap-1.5 sm:gap-2 py-1 shrink-0">
                {ALL_NAV_LINKS.map((link, idx) => {
                  const active = isLinkActive(link.to);
                  const forwardDelay = idx * 30;
                  const reverseDelay = (ALL_NAV_LINKS.length - 1 - idx) * 20;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={handleClose}
                      className={`font-dot text-[20px] sm:text-[24px] leading-tight min-h-[48px] flex items-center px-3.5 py-2 rounded-2xl transition-all tracking-tight motion-reduce:transition-none active:scale-[0.98] ${
                        active
                          ? 'bg-[var(--accent-red-soft)] text-[var(--accent-red)] border border-[var(--accent-red-border)] font-extrabold'
                          : isDark
                            ? 'text-[var(--text)] hover:text-[#D71921] hover:bg-white/[0.06] border border-transparent'
                            : 'text-[#111827] hover:text-[#D71921] hover:bg-black/[0.04] border border-transparent'
                      }`}
                      style={{
                        fontFamily: 'var(--font-dot)',
                        letterSpacing: '0.01em',
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                        transitionDuration: '240ms',
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
                className={`flex flex-col gap-3 pt-4 shrink-0 border-t ${
                  isDark ? 'border-white/10' : 'border-black/10'
                }`}
              >
                <Link
                  to="/login"
                  onClick={handleClose}
                  className={`w-full flex items-center justify-center rounded-full transition-all text-[14px] font-semibold border text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.98] ${
                    isDark
                      ? 'border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1]'
                      : 'border-black/12 hover:border-black/25 bg-black/[0.04] hover:bg-black/[0.08]'
                  }`}
                  style={{
                    height: '48px',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={handleClose}
                  className="w-full flex items-center justify-center rounded-full transition-all text-[14px] font-semibold bg-[#D71921] hover:bg-[#b8141b] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.98]"
                  style={{
                    height: '48px',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Get Started
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className={`w-full flex items-center justify-center rounded-full transition-all text-[13px] font-medium py-2.5 cursor-pointer ${
                    isDark
                      ? 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-black/[0.04]'
                  }`}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Continue without an account
                </button>

                {/* Three-option segmented control: Light, Dark, System */}
                <div className="pt-2 pb-1 shrink-0 flex justify-center">
                  <div
                    role="radiogroup"
                    aria-label="Appearance"
                    className={`inline-flex items-center p-1 rounded-full border text-xs font-medium transition-colors ${
                      isDark
                        ? 'bg-white/[0.06] border-white/10'
                        : 'bg-black/[0.05] border-black/10'
                    }`}
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
          </div>,
          document.body
        )}
    </>
  );
}

export default Navbar;
