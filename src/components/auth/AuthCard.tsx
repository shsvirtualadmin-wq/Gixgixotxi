import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/signup') {
      return 'signup';
    }
    return initialMode;
  });
  const {
    signIn,
    signUp,
    signInWithGoogle,
    authError,
    clearAuthError,
    profileError,
    clearProfileError,
    sendVerificationEmail,
    user,
    profile,
    profileLoading,
    getRoleRedirectUrl,
  } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  // Signup Verification Confirmation State
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Sync mode with props if prop changes
  useEffect(() => {
    setMode(initialMode);
    setFieldErrors({});
    setGeneralError('');
    clearAuthError();
    clearProfileError();
  }, [initialMode, clearAuthError, clearProfileError]);

  // Navigate after successful auth (immediate fallback navigation if user is logged in)
  useEffect(() => {
    if (user && !signupSuccess) {
      // Do not block navigation if Firestore profile sync is slow/offline
      if (!profileLoading || profile) {
        const dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
        logRedirect('/login', dest, 'AuthCard.tsx (user authenticated -> send straight to dashboard/admin)');
        navigate(dest, { replace: true });
      }
    }
  }, [user, profile, profileLoading, signupSuccess, navigate, getRoleRedirectUrl]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    clearAuthError();
    clearProfileError();
    setFieldErrors({});
    setGoogleLoading(true);

    try {
      // ONLY signInWithPopup on user click
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        // Immediate explicit navigation to dashboard
        const dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
        logRedirect('/login', dest, 'AuthCard.tsx (Google sign in explicit)');
        navigate(dest, { replace: true });
      }
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      const codeStr = fe.code ? `[${fe.code}] ` : '';
      setGeneralError(`${codeStr}${fe.message || 'Google sign-in could not be completed.'}`);
    } finally {
      // ALWAYS reset google loading state so button never gets stuck in infinite spinner
      setGoogleLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendVerificationEmail();
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      setGeneralError('Failed to resend verification email. Please try again shortly.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        errors.name = 'Please enter your full name.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim());
        navigate('/onboarding', { replace: true });
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[AuthCard] Submit error:', err);
      }
      const fe = err as { code?: string; message?: string };
      const code = fe.code ?? '';

      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setGeneralError('Incorrect email or password. Please check your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setFieldErrors({ email: 'An account with this email already exists. Try signing in.' });
      } else if (code === 'auth/weak-password') {
        setFieldErrors({ password: 'Password is too weak. Please use at least 6 characters.' });
      } else if (code === 'auth/too-many-requests') {
        setGeneralError('Too many failed attempts. Please wait a few moments before trying again.');
      } else if (code === 'auth/user-disabled') {
        setGeneralError('This account has been disabled. Please contact support@boardly.cfd.');
      } else if (code === 'auth/network-request-failed') {
        setGeneralError('Network connection issue. Please check your internet connection.');
      } else {
        setGeneralError('Authentication failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── "Check Your Inbox" Screen after Sign Up ───────────────────────────────
  if (signupSuccess) {
    return (
      <div
        className="w-full rounded-[28px] border border-[var(--border)] p-7 sm:p-8 flex flex-col items-center text-center gap-5"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--red)]">
          <Mail size={28} />
        </div>

        <div>
          <h2
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Check your inbox
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
            We sent a verification link to <strong className="text-[var(--text)]">{email}</strong>.
            Click the link in the email to verify your student account.
          </p>
        </div>

        {resendSuccess && (
          <div className="w-full p-3 rounded-xl bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[#FFFFFF]">
            <CheckCircle2 size={16} className="text-[var(--red)]" />
            <span>Verification email resent successfully.</span>
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0}
            className="btn-outline w-full cursor-pointer disabled:opacity-50"
            style={{ height: '52px' }}
          >
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend verification email'}
          </button>

          <button
            onClick={() => {
              setSignupSuccess(false);
              const dest = getRoleRedirectUrl(profile?.role);
              navigate(dest, { replace: true });
            }}
            className="btn-red w-full cursor-pointer"
            style={{ height: '52px' }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main Sign In / Sign Up Card ───────────────────────────────────────────
  return (
    <div
      className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-7 flex flex-col gap-5"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: 'none',
      }}
    >
      {/* Segmented Tabs: "Sign in" & "Create account" */}
      <div className="w-full h-11 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-2 gap-1 items-center">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/login');
            }
          }}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signin'
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/signup');
            }
          }}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signup'
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Create account
        </button>
      </div>

      {/* Header & Subtext */}
      <div>
        <h1
          className="text-2xl font-bold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
          Practice for FAST, NUST, GIKI, NED and MDCAT
        </p>
      </div>

      {/* Visible Red Error Alert Box */}
      {(generalError || authError || profileError) && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#260B0B] border-2 border-[#EF4444] flex flex-col gap-2.5 text-xs text-[#FFFFFF] shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5 text-left">
              <span className="font-semibold text-[#FCA5A5] uppercase tracking-wider text-[11px] block">
                {mode === 'signin' ? 'Sign-In Issue' : 'Sign-Up Issue'}
              </span>
              <p className="text-[#FEE2E2] leading-relaxed font-medium">
                {generalError || authError?.message || profileError?.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGeneralError('');
                clearAuthError();
                clearProfileError();
              }}
              className="text-[#FCA5A5] hover:text-[#FFFFFF] text-xs font-bold px-1.5 py-0.5 cursor-pointer"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>

          {authError?.code === 'auth/popup-blocked' && (
            <div className="pt-2 border-t border-[#EF4444]/30 flex flex-col gap-1.5">
              <p className="text-[11px] text-[#FCA5A5]">
                Your browser blocked the Google sign-in popup. Allow popups for boardly.cfd and try again:
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2 px-3 rounded-xl bg-[#EF4444] text-[#FFFFFF] font-semibold text-xs hover:bg-[#DC2626] transition-colors cursor-pointer text-center"
              >
                Retry Google Sign-In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Continue with Google FIRST: Full-width white button, 52px tall, official Google icon, black text */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        style={{
          height: '52px',
          backgroundColor: '#FFFFFF',
          color: '#000000',
          border: '1px solid #FFFFFF',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
        }}
      >
        {googleLoading ? (
          <span
            className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider: "or use email" */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span
          className="text-xs text-[var(--muted)] lowercase"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          or use email
        </span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* Form Fields: 16px gap between fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="auth-fullname"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Full name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <User size={18} />
              </div>
              <input
                id="auth-fullname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ahmed Khan"
                autoComplete="name"
                className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-colors text-sm"
                style={{
                  height: '52px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                }}
              />
            </div>
            {fieldErrors.name && (
              <span className="text-xs text-[var(--red)]">{fieldErrors.name}</span>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2 text-left">
          <label
            htmlFor="auth-email"
            className="text-sm font-medium text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              autoComplete="email"
              className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-colors text-sm"
              style={{
                height: '52px',
                paddingLeft: '44px',
                paddingRight: '16px',
              }}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-[var(--red)]">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Password
            </label>
            {mode === 'signin' && (
              <Link
                to="/forgot-password"
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
              <Lock size={18} />
            </div>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-colors text-sm"
              style={{
                height: '52px',
                paddingLeft: '44px',
                paddingRight: '44px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-[var(--red)]">{fieldErrors.password}</span>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="auth-confirm-password"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-colors text-sm"
                style={{
                  height: '52px',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-xs text-[var(--red)]">{fieldErrors.confirmPassword}</span>
            )}
          </div>
        )}

        {/* Primary Red Button: 52px tall, full width */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-red w-full mt-2 cursor-pointer disabled:opacity-50"
          style={{ height: '52px' }}
        >
          {loading ? (
            <span
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>
    </div>
  );
}
