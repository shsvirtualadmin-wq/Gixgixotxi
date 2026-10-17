import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/crew', label: 'Crew' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
  { to: '/login', label: 'Login' },
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
            className="w-full h-[72px] sm:h-[80px] rounded-full px-4 sm:px-7 flex items-center justify-between bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--text)] shadow-xl"
          >
            {/* Brand Logo */}
            <Link to="/" className="flex items-center shrink-0" aria-label="Boardly Home">
              <Logo className="h-[54px] sm:h-[66px]" />
            </Link>

            {/* Desktop Unified Segmented Pill Links (Features, Crew, Pricing, Reviews, Contact, Login, Get Started) */}
            <div className="hidden lg:flex items-center gap-1 bg-[var(--surface-2)] rounded-full p-1.5 border border-[var(--border)]">
              {NAV_LINKS.map((link) => {
                const active = isLinkActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-xs xl:text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                to="/signup"
                className="text-xs xl:text-sm font-semibold px-4 py-2 rounded-full bg-[#D71921] hover:bg-[#b0131a] text-white transition-all shadow-sm ml-1"
              >
                Get Started
              </Link>
            </div>

            {/* Desktop Right Actions: Theme Toggle (44x44 tap target, 22px icon) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-2)]"
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </div>

            {/* Mobile Controls (44x44 tap targets with 22px icons) */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-2)]"
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-2)]"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Mobile Menu below 1024px */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] flex flex-col justify-between p-6 sm:p-8 animate-[page-enter_0.2s_ease-out]"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--fg)',
          }}
        >
          {/* Top Bar inside Menu */}
          <div
            className="flex items-center justify-between pb-6"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center shrink-0"
              aria-label="Boardly Home"
            >
              <Logo className="h-[54px] sm:h-[66px]" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  backgroundColor: 'transparent',
                }}
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  backgroundColor: 'transparent',
                }}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Large Navigation Links in the dot font (32px-36px) highlighting current page */}
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
                    color: active ? 'var(--red)' : 'var(--fg)',
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
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center rounded-full transition-colors text-[15px] font-semibold"
              style={{
                height: '52px',
                border: '1px solid var(--border)',
                color: 'var(--fg)',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="btn-red w-full"
              style={{
                height: '52px',
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
