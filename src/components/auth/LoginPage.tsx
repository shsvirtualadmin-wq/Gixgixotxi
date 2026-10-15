import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { BrandLogo } from '../marketing/BrandLogo';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

function getValidatedPostLoginPath(): string {
  if (typeof window === 'undefined') return '/app';
  try {
    const saved = sessionStorage.getItem('postLoginPath');
    sessionStorage.removeItem('postLoginPath');
    if (!saved || typeof saved !== 'string') return '/app';

    const trimmed = saved.trim();
    if (
      !trimmed.startsWith('/') ||
      trimmed.startsWith('//') ||
      trimmed.includes('://') ||
      trimmed.includes('\\')
    ) {
      return '/app';
    }

    const validPrefixes = ['/app', '/organizer', '/captain', '/admin', '/crew', '/dashboard', '/onboarding'];
    const isAllowed = validPrefixes.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`)
    );
    return isAllowed ? trimmed : '/app';
  } catch {
    return '/app';
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signInEmail, signInGoogle, friendlyErrorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; code?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!email.trim() || !password) {
      setErrorDetails({ message: 'Please enter both your email and password.' });
      return;
    }

    setIsLoading(true);
    const res = await signInEmail(email, password);
    setIsLoading(false);

    if (res.success) {
      const isOwnerAdmin = email.trim().toLowerCase() === 'shsvirtualadmin@gmail.com';
      const destination = isOwnerAdmin ? '/admin' : getValidatedPostLoginPath();
      onNavigate(destination);
    } else {
      setErrorDetails({
        message: res.error || 'Failed to sign in. Please verify your email and password.',
        code: (res as any).code || 'auth/invalid-credential',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorDetails(null);
    setGoogleLoading(true);

    try {
      const res = await signInGoogle();
      if (res.success) {
        onNavigate(getValidatedPostLoginPath());
      } else {
        setGoogleLoading(false);
        setErrorDetails({
          message: res.error || 'Google sign-in was cancelled or encountered an issue.',
          code: (res as any).code || 'auth/popup-closed-by-user',
        });
      }
    } catch (err: any) {
      setGoogleLoading(false);
      setErrorDetails({
        message: friendlyErrorMessage(err),
        code: err?.code || 'auth/google-sign-in-failed',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid-48 text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand)] selection:text-white relative overflow-x-hidden font-sans">
      {/* Background radial glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
        <button
          onClick={() => onNavigate('/signup')}
          className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          Don't have an account? <span className="text-[var(--brand-2)] underline underline-offset-4">Sign up</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card variant="hero" className="w-full max-w-md p-6 sm:p-10 space-y-6">
          <div className="text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Sign in to your Boardly study cockpit to continue timed drills, full mocks, and progress analytics.
            </p>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignIn}
            isLoading={googleLoading}
            className="w-full justify-center gap-3 cursor-pointer text-sm font-semibold"
            leftIcon={
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border)] w-full" />
            <span className="bg-[#0E1626] px-3 text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider absolute">
              or continue with email
            </span>
          </div>

          {/* Error notice */}
          {errorDetails && (
            <ErrorState
              title="Sign in failed"
              error={errorDetails.message}
              path={errorDetails.code ? `Error code: ${errorDetails.code}` : undefined}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-xs font-semibold text-[var(--brand-2)] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer text-[var(--text-faint)] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2 cursor-pointer font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Cockpit
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-[var(--text-faint)]">
        Protected by SHA-256 encryption & Firestore security rules · Boardly 2026
      </footer>
    </div>
  );
};
