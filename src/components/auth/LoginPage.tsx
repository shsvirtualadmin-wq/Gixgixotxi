import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../marketing/BrandLogo';
import { TrustFooter } from '../ui/TrustFooter';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

// Strictly validate post-login redirection path to prevent open-redirect exploits
function getValidatedPostLoginPath(): string {
  if (typeof window === 'undefined') return '/app';
  try {
    const saved = sessionStorage.getItem('postLoginPath');
    sessionStorage.removeItem('postLoginPath');
    if (!saved || typeof saved !== 'string') return '/app';

    const trimmed = saved.trim();
    // Path must start with single '/', must not start with '//', must not contain '://' or '\'
    if (
      !trimmed.startsWith('/') ||
      trimmed.startsWith('//') ||
      trimmed.includes('://') ||
      trimmed.includes('\\')
    ) {
      return '/app';
    }

    // Must be one of our own protected routes
    const validPrefixes = ['/app', '/organizer', '/captain', '/admin'];
    const isAllowed = validPrefixes.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`)
    );
    return isAllowed ? trimmed : '/app';
  } catch {
    return '/app';
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signInEmail, signInGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    const res = await signInEmail(email, password);
    setIsLoading(false);

    if (res.success) {
      const destination = getValidatedPostLoginPath();
      onNavigate(destination);
    } else {
      setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    const res = await signInGoogle();
    setGoogleLoading(false);

    if (res.success) {
      const destination = getValidatedPostLoginPath();
      onNavigate(destination);
    } else if (res.error) {
      if (res.error.toLowerCase().includes('popup')) {
        setErrorMsg('Sign-in popup was blocked. Please allow pop-ups for this site in your browser to sign in with Google.');
      } else {
        setErrorMsg(res.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden font-sans">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Ambient Gradient Glows */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Brand Logo */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
        <button
          onClick={() => onNavigate('/signup')}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          New to Boardly?{' '}
          <span className="text-blue-600 underline underline-offset-4">Create account</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-10 transition-all">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Log in to pick up your prep where you left off.
            </p>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 tracking-wider">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="shrink-0 font-bold mt-0.5">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 focus:bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/70 focus:bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gradient Log In Button */}
            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 pt-3 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in…</span>
                </>
              ) : (
                <>
                  <span>Log in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* New to Boardly link */}
          <div className="mt-8 text-center text-xs text-slate-500">
            New to Boardly?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
            >
              Create a free account
            </button>
          </div>
        </div>
      </main>

      {/* Footer with Trust Signals */}
      <TrustFooter onNavigate={onNavigate} />
    </div>
  );
};
