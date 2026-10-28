import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

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
        'We could not complete the password reset link handshake on auth.boardly.cfd. Please verify that both boardly.cfd and auth.boardly.cfd are listed in Firebase Authentication → Settings → Authorized domains, or try signing in directly.',
    };
  }
  if (code === 'auth/network-request-failed') {
    return {
      message:
        'Network connection issue while contacting the authentication server. Please check your internet connection and try again.',
    };
  }

  return {
    message:
      rawMsg && !rawMsg.startsWith('Firebase:')
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="flex items-center justify-between mb-6 px-1">
          <Link to="/login" className="inline-flex items-center gap-2.5 group">
            <Logo size={26} />
          </Link>
          <Link
            to="/login"
            className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="glass-panel allow-backdrop-blur rounded-[28px] p-6 sm:p-8 space-y-5">
          <div>
            <h1 className="font-dot text-2xl font-bold text-[var(--text)]">Reset password</h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
              Enter your registered email and we&apos;ll send you a password reset link.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[18px] text-xs text-emerald-500">
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
                className="btn-secondary block text-center w-full py-3 rounded-full text-xs font-semibold"
              >
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-[#D71921]/10 border border-[#D71921]/30 rounded-[18px] text-xs text-[#D71921] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  {showSignUpHint && (
                    <div className="pl-6 pt-1">
                      <Link
                        to="/signup"
                        className="inline-flex items-center gap-1.5 font-semibold underline hover:opacity-80"
                      >
                        <UserPlus size={13} />
                        <span>Create a new account with this email →</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm glass-input rounded-[16px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3.5 rounded-full text-xs sm:text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Sending reset link...' : 'Send reset link'}
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
      </div>
    </div>
  );
}
