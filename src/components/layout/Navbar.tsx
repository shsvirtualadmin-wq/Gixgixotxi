import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';

const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#arena', label: 'Arena' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reviews', label: 'Reviews' },
];

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('boardly-theme') : 'dark';
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardly-theme', theme);
  }, [theme]);

  return { theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) };
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Lock scroll when full-screen mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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
            className="w-full h-16 rounded-full px-5 sm:px-6 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }}
          >
            {/* Brand Logo & Name: Logo B box is white rounded square with black B */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div
                className="w-8 h-8 rounded-lg bg-[#FFFFFF] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <span
                  className="font-bold text-base text-[#000000] leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  B
                </span>
              </div>
              <span
                className="text-xl font-bold tracking-tight text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Boardly
              </span>
            </Link>

            {/* Desktop Nav Links (Hidden below 1024px) */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right Actions: Flush with container right edge (Hidden below 1024px) */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] rounded-full transition-colors"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="btn-red"
                style={{
                  height: '42px',
                  padding: '10px 22px',
                  fontSize: '14px',
                }}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Controls (Shown below 1024px): Clean, no duplicate border */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Black Menu below 1024px */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-[1001] bg-[#000000] text-[#F2F2F2] flex flex-col justify-between p-6 sm:p-8 animate-[page-enter_0.2s_ease-out]"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Top Bar inside Menu */}
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg bg-[#FFFFFF] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <span
                  className="font-bold text-base text-[#000000] leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  B
                </span>
              </div>
              <span
                className="text-xl font-bold tracking-tight text-[#FFFFFF]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Boardly
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[#FFFFFF] border border-[var(--border)]"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#FFFFFF] hover:bg-[#1A1A1A] border border-[var(--border)] cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Large Navigation Links (Features, Arena, Pricing, Reviews) */}
          <div className="flex flex-col gap-6 my-auto py-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-3xl sm:text-4xl font-semibold text-[#FFFFFF] hover:text-[var(--red)] transition-colors tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom Auth Buttons (Sign In, Get Started) */}
          <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="btn-outline w-full"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="btn-red w-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
