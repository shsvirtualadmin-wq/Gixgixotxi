import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Slim Top Bar: Boardly Logo on Left, Back to home and Theme Toggle on Right */}
      <header className="w-full h-16 border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center" aria-label="Boardly Home">
          <Logo size="navbar" />
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer border border-[var(--border)]"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Centered Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          {children}

          {/* Under the card ONE small line: terms & privacy */}
          <p className="mt-5 text-center text-xs text-[var(--muted)] px-4 leading-relaxed">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline hover:text-[var(--text)] transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-[var(--text)] transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
