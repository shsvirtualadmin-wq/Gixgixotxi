import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
  { to: '/login', label: 'Login' },
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
    if (to.startsWith('/#')) {
      const hash = to.slice(1);
      return location.hash === hash;
    }
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
            className="w-full h-14 sm:h-16 rounded-full px-3.5 sm:px-6 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50"
          >
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white text-black"
                aria-hidden="true"
              >
                <span
                  className="font-bold text-base leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  B
                </span>
              </div>
              <span
                className="text-lg sm:text-xl font-bold tracking-tight text-white"
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Boardly
              </span>
            </Link>

            {/* Desktop Unified Segmented Pill Links (Features, Pricing, Reviews, Contact, Login, Get Started) */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
              {NAV_LINKS.map(link => {
                const active = isLinkActive(link.to);
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`text-xs xl:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                to="/signup"
                className="text-xs xl:text-sm font-semibold px-4 py-1.5 rounded-full bg-[#D71921] hover:bg-[#b0131a] text-white transition-all shadow-sm ml-1"
              >
                Get Started
              </Link>
            </div>

            {/* Desktop Right Actions: Theme Toggle */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer text-neutral-400 hover:text-white border border-white/10 bg-white/5"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer text-neutral-300 border border-white/10 bg-white/5"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer text-neutral-300 border border-white/10 bg-white/5"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Mobile Menu below 1024px:
          Overlay uses theme variables only: background var(--bg), text var(--fg), borders var(--border).
          NO hard-coded #000 or #fff anywhere in the menu. */}
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
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--fg)',
                  color: 'var(--bg)',
                }}
                aria-hidden="true"
              >
                <span
                  className="font-bold text-base leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  B
                </span>
              </div>
              <span
                className="text-xl font-bold tracking-tight"
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                  color: 'var(--fg)',
                }}
              >
                Boardly
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  backgroundColor: 'transparent',
                }}
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  backgroundColor: 'transparent',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Large Navigation Links in the dot font (34px) highlighting current page */}
          <div className="flex flex-col gap-6 my-auto py-8">
            {NAV_LINKS.map(link => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="font-dot text-[34px] leading-tight transition-colors tracking-tight"
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

          {/* Bottom Auth Buttons:
              "Sign In" is an outline button with text var(--fg) and a 1px var(--border) border.
              "Get Started" is the red button with white text. */}
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
