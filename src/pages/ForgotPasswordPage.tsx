import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, ArrowLeft, UserPlus, Mail, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

function mapResetPasswordError(err: unknown): {
  message: string;
  showSignUpLink?: boolean;
} {
  const fe = err as { code?: string; message?: string };
  const code = String(fe?.code || '');
  const rawMsg = String(fe?.message || '');

  if (code === 'auth/user-not-found' || rawMsg.includes('EMAIL_NOT_FOUND')) {
    return {
      message:
        'No active Boardly account was found for this email address. If your account was deleted, you can create a new account with this email.',
      showSignUpLink: true,
    };
  }
  if (code === 'auth/invalid-email' || rawMsg.includes('INVALID_EMAIL')) {
    return {
      message: 'Please enter a valid email address (for example: student@example.com).',
    };
  }
  if (code === 'auth/too-many-requests' || rawMsg.includes('TOO_MANY_ATTEMPTS')) {
    return {
      message:
        'Too many password reset requests were sent recently. Please wait a few minutes and try again.',
    };
  }
  if (
    code.includes('-26') ||
    rawMsg.includes('error-code:-26') ||
    code === 'auth/unauthorized-continue-uri' ||
    code === 'auth/invalid-continue-uri'
  ) {
    return {
      message:
        'We could not complete the password reset link right now. Please try requesting a new link or signing in directly.',
    };
  }
  if (code === 'auth/network-request-failed') {
    return {
      message:
        'Network connection issue. Please check your internet connection and try again.',
    };
  }

  return {
    message:
      rawMsg && !/firebase|cloudflare|d1|firestore/i.test(rawMsg)
        ? rawMsg
        : 'Could not send the password reset email right now. Please double-check your email address and try again.',
  };
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpHint, setShowSignUpHint] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSignUpHint(false);
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const mapped = mapResetPasswordError(err);
      setError(mapped.message);
      setShowSignUpHint(Boolean(mapped.showSignUpLink));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div
        className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 flex flex-col gap-5"
        style={{
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "'Doto', var(--font-dot), sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: 1,
              letterSpacing: '0.02em',
              color: 'var(--cw-red-text, #D71921)',
            }}
          >
            Boardly
          </span>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="text-left">
          <h1
            className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            Reset password
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
            Enter your registered email and we&apos;ll send you a password reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 text-left">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Reset link sent to {email.trim()}</p>
                <p className="text-emerald-500/80">
                  Please check your inbox and spam/junk folder for the password reset email.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full min-h-[48px] px-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] inline-flex items-center justify-center"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div aria-live="polite" className={error ? 'block' : 'hidden'}>
              {error && (
                <div
                  role="alert"
                  className="p-3.5 bg-[#D71921]/10 border border-[#D71921]/40 rounded-2xl text-xs text-[var(--text)] space-y-2 text-left"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#D71921] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  {showSignUpHint && (
                    <div className="pl-6 pt-1">
                      <Link
                        to="/signup"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#D71921] underline hover:opacity-80"
                      >
                        <UserPlus size={13} />
                        <span>Create a new account with this email →</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="forgot-password-email"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  id="forgot-password-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-form-input"
                  style={{
                    height: '50px',
                    paddingLeft: '42px',
                    paddingRight: '16px',
                  }}
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-red w-full inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65"
              style={{ height: '50px' }}
            >
              {busy && <Loader2 size={17} className="animate-spin shrink-0" />}
              <span>Send reset link</span>
            </button>

            <p className="text-center text-xs text-[var(--text-muted)]">
              Remembered your password?{' '}
              <Link to="/login" className="text-[#D71921] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
