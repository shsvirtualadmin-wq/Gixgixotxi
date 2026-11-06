import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { useHomeUrl } from '@/utils/homeUrl';

const ALL_NAV_LINKS = [
  { to: '/rewards', label: 'Rewards', highlight: true },
  { to: '/grand-line', label: GRAND_LINE_NAME, highlight: true },
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

// Top desktop navbar excludes Grand Line button to keep it clean and focused
const DESKTOP_NAV_LINKS = ALL_NAV_LINKS.filter((link) => link.to !== '/grand-line');

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

  return (
    <>
      {/* Floating Pill Glass Navbar container - detached from top and sides with margin */}
      <header className="fixed top-0 inset-x-0 z-[1002] pointer-events-none transition-all select-none">
        <div className="w-full max-w-7xl mx-auto pt-3.5 sm:pt-4 md:pt-5 px-3 sm:px-4 md:px-6">
          <nav
            aria-label="Main Navigation"
            className={`pointer-events-auto w-full h-[64px] sm:h-[70px] px-3.5 sm:px-6 rounded-full flex items-center justify-between gap-2 sm:gap-3 transition-all duration-300 border allow-backdrop-blur text-[var(--text)] ${
              isDark
                ? 'border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.14)]'
                : 'border-black/[0.08] shadow-[0_14px_32px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.92)]'
            }`}
            style={{
              backgroundColor: isDark ? 'rgba(10, 10, 14, 0.85)' : 'rgba(255, 255, 255, 0.82)',
            }}
          >
            {/* Left side: Prominent Boardly logo/wordmark in brand red */}
            <Link
              to={homeUrl}
              onClick={handleClose}
              className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-full text-[#D71921] group transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ color: '#D71921' }}
              aria-label="Boardly Home"
            >
              <Logo
                size="navbar"
                className="h-[36px] sm:h-[46px] md:h-[48px] w-auto text-[#D71921]"
                style={{ color: '#D71921' }}
                alt="Boardly"
              />
            </Link>

            {/* Center Desktop Navigation with tight, elegant spacing for the bigger logo */}
            <div className="hidden xl:flex items-center gap-1 2xl:gap-1.5">
              {DESKTOP_NAV_LINKS.map((link) => {
                const active = isLinkActive(link.to);
                if (link.highlight) {
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={handleClose}
                      className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all border whitespace-nowrap shadow-sm hover:-translate-y-0.5 active:scale-95 ${
                        active
                          ? 'bg-[#D71921] text-white border-[#D71921] shadow-[0_4px_14px_rgba(215,25,33,0.45)]'
                          : 'bg-[#D71921]/15 text-[#D71921] border-[#D71921]/40 hover:bg-[#D71921] hover:text-white hover:shadow-[0_4px_16px_rgba(215,25,33,0.4)]'
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
                    className={`px-2 py-1.5 rounded-full text-[13px] font-heading font-medium transition-all whitespace-nowrap ${
                      active
                        ? isDark
                          ? 'text-white font-semibold bg-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                          : 'text-[#D71921] font-semibold bg-[#D71921]/10 border border-[#D71921]/25'
                        : isDark
                          ? 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                          : 'text-[#374151] hover:text-[#111827] hover:bg-black/[0.05]'
                    }`}
                  >
                    {link.shortLabel || link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side on Desktop: Inline Glass Sign In & Red Get Started buttons */}
            <div className="hidden xl:flex items-center gap-2.5 shrink-0">
              <Link
                to="/login"
                onClick={handleClose}
                className={`h-9 px-4 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold border transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
                  isDark
                    ? 'border-white/15 text-white/90 hover:text-white hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08]'
                    : 'border-black/12 text-[#111827] hover:border-black/25 bg-black/[0.03] hover:bg-black/[0.07]'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={handleClose}
                className="h-9 px-4.5 rounded-full inline-flex items-center justify-center text-xs font-heading font-semibold bg-[#D71921] hover:bg-[#b8141b] text-white shadow-[0_4px_18px_rgba(215,25,33,0.45)] hover:shadow-[0_6px_22px_rgba(215,25,33,0.55)] transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            {/* Right side on Mobile & Mid-size screens (<1280px): Brand red Rewards link + Hamburger */}
            <div className="flex xl:hidden items-center gap-1.5 sm:gap-2">
              <Link
                to="/rewards"
                onClick={handleClose}
                className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-[#D71921]/15 text-[#D71921] border border-[#D71921]/40 hover:bg-[#D71921] hover:text-white transition-all shadow-sm whitespace-nowrap"
              >
                Rewards
              </Link>
              <button
                type="button"
                onClick={() => (isOpen ? handleClose() : handleOpen())}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text)] hover:text-[#D71921] transition-all cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-full p-0 shadow-sm ${
                  isDark
                    ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/15'
                    : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/12'
                }`}
              >
                {isOpen ? (
                  <X size={20} className="stroke-[2.25]" />
                ) : (
                  <Menu size={20} className="stroke-[2.25]" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Floating Glass Mobile Menu Panel with Staggered 300ms Animation */}
      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className={`fixed inset-0 z-[1001] xl:hidden w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain select-none transition-[opacity] duration-300 ease-out motion-reduce:transition-none flex flex-col justify-start p-4 sm:p-6 ${
            isDark ? 'bg-black/70' : 'bg-slate-900/40'
          }`}
          style={{
            paddingTop: 'calc(88px + env(safe-area-inset-top, 0px))',
            opacity: isOpen ? 1 : 0,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className={`w-full max-w-lg mx-auto rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 flex flex-col gap-5 border allow-backdrop-blur transition-all duration-300 max-h-[calc(100dvh-110px)] overflow-y-auto ${
              isDark
                ? 'border-white/15 shadow-[0_20px_48px_rgba(0,0,0,0.72),inset_0_1px_1px_rgba(255,255,255,0.14)]'
                : 'border-black/10 shadow-[0_20px_44px_rgba(15,23,42,0.14),inset_0_1px_1px_rgba(255,255,255,0.95)]'
            }`}
            style={{
              backgroundColor: isDark ? 'rgba(12, 12, 16, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.98)',
            }}
          >
            {/* Navigation Links in the dot font with Staggered Transition & 48px+ tap target */}
            <div className="flex flex-col gap-1.5 sm:gap-2 py-1 shrink-0">
              {ALL_NAV_LINKS.map((link, idx) => {
                const active = isLinkActive(link.to);
                const forwardDelay = idx * 35;
                const reverseDelay = (ALL_NAV_LINKS.length - 1 - idx) * 25;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={handleClose}
                    className={`font-dot text-[20px] sm:text-[24px] leading-tight min-h-[48px] flex items-center px-3.5 py-2 rounded-2xl transition-all tracking-tight motion-reduce:transition-none active:scale-[0.98] ${
                      active
                        ? 'bg-[#D71921]/15 text-[#D71921] border border-[#D71921]/30 font-extrabold shadow-[0_2px_12px_rgba(215,25,33,0.2)]'
                        : isDark
                          ? 'text-[var(--text)] hover:text-[#D71921] hover:bg-white/[0.06] border border-transparent'
                          : 'text-[#111827] hover:text-[#D71921] hover:bg-black/[0.04] border border-transparent'
                    }`}
                    style={{
                      fontFamily: 'var(--font-dot)',
                      letterSpacing: '0.01em',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                      transitionDuration: '280ms',
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
                className="w-full flex items-center justify-center rounded-full transition-all text-[14px] font-semibold bg-[#D71921] hover:bg-[#b8141b] text-white shadow-[0_4px_18px_rgba(215,25,33,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.98]"
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
        </div>
      )}
    </>
  );
}

export default Navbar;
