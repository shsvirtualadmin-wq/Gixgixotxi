import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';

const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#arena', label: 'Arena' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reviews', label: 'Reviews' },
];

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('boardly-theme');
    return (stored === 'light' ? 'light' : 'dark') as 'dark' | 'light';
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] w-full border-b border-white/[0.08]"
      style={{
        background: 'rgba(10, 14, 28, 0.78)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
      }}
    >
      <div className="site-container h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/favicon.svg"
            alt="Boardly Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
            style={{ width: 36, height: 36, maxWidth: 36, maxHeight: 36 }}
          />
          <span className="font-display text-xl font-bold tracking-tight text-[var(--text)]">
            Boardly
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>

          <Link to="/signup">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
            className="p-2 text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[rgba(10,14,28,0.95)] backdrop-blur-xl">
          <div className="site-container py-5 flex flex-col gap-4 animate-[page-enter_0.2s_ease-out]">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text)] py-1.5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <hr className="border-[var(--border)] my-1" />

            <div className="flex flex-col gap-2.5">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full">
                <Button variant="secondary" size="md" fullWidth>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full">
                <Button variant="primary" size="md" fullWidth>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
