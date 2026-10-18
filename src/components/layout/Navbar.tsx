import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/crew', label: 'Crew' },
  { to: '/nakama-captains', label: NAKAMA_CAPTAINS_NAME },
  { to: '/pricing', label: 'Pricing' },
  { to: '/grand-line', label: GRAND_LINE_NAME },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Lock page scroll while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [mobileOpen]);

  const isLinkActive = (to: string) => {
    return location.pathname === to;
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
                    className={`text-xs xl:text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-[rgba(255,255,255,0.7)] hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Actions: Sign In (white outline), Get Started (#D71921), and Theme Toggle */}
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

            {/* Mobile Controls: 44x44 circles, rgba(255,255,255,0.12), white 22px icons, red on hover/active */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
              >
                {theme === 'dark' ? <Sun size={22} className="text-white" /> : <Moon size={22} className="text-white" />}
              </button>
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
              >
                {mobileOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Mobile Menu */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] flex flex-col justify-between p-6 sm:p-8 animate-[page-enter_0.2s_ease-out]"
          style={{
            backgroundColor: '#0A0A0A',
            color: '#FFFFFF',
          }}
        >
          {/* Top Bar inside Menu */}
          <div
            className="flex items-center justify-between pb-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[rgba(255,255,255,0.12)] hover:bg-[#D71921] active:bg-[#D71921] text-white"
              >
                <X size={22} className="text-white" />
              </button>
            </div>
          </div>

          {/* Large Navigation Links in the dot font */}
          <div className="flex flex-col gap-5 my-auto py-6">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="font-dot text-[32px] sm:text-[36px] leading-tight transition-colors tracking-tight"
                  style={{
                    fontFamily: 'var(--font-dot)',
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                    color: active ? '#D71921' : '#FFFFFF',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Bottom Auth Buttons */}
          <div
            className="flex flex-col gap-3 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
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
      )}
    </>
  );
}

export default Navbar;
