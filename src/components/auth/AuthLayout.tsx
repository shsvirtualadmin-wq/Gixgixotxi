import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-between relative overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Subtle calm dot-matrix & crimson ambient glow on wide screens */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 18%, rgba(215, 25, 33, 0.08), transparent 55%), radial-gradient(rgba(128, 128, 138, 0.14) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 22px 22px',
        }}
      />

      {/* Slim Top Bar: Dot-Matrix Boardly Wordmark on Left, Theme Toggle & Back to home on Right */}
      <header className="relative z-10 w-full h-14 sm:h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-8 flex items-center justify-between shrink-0">
        <Link
          to="/"
          className="inline-flex items-center no-underline select-none"
          aria-label="Boardly Home"
        >
          <span
            style={{
              fontFamily: "'Doto', var(--font-dot), sans-serif",
              fontWeight: 800,
              fontSize: '20px',
              lineHeight: 1,
              letterSpacing: '0.02em',
              color: 'var(--cw-red-text, #D71921)',
            }}
          >
            Boardly
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer border border-[var(--border)]"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Centered Scrollable Main Area (16px side padding on phone, max-w-[440px] card on tablet/PC) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10 w-full">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
}
