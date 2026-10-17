import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    message: string;
    url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    if (!email.trim()) {
      setErrorDetails({
        code: 'validation/missing-email',
        message: 'Please enter your email address.',
        url: 'client/form-validation',
      });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      setErrorDetails({
        code: fe.code || 'auth/reset-failed',
        message: fe.message ?? 'Failed to send reset email. Please try again.',
        url: 'https://auth.boardly.cfd (sendPasswordResetEmail)',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div
        className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-7 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div>
          <h1
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            Enter your email and we&apos;ll send you a password reset link.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-3">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold text-[var(--text)] text-base">Check your inbox</p>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                If an account with that email exists, we sent a password reset link.
              </p>
            </div>
            <Link to="/login" className="btn-outline w-full mt-2" style={{ height: '52px' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorDetails && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'rgba(215, 25, 33, 0.08)',
                  borderColor: 'var(--accent)',
                  color: 'var(--text)',
                }}
                className="p-4 rounded-2xl border text-xs shadow-sm space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-[var(--accent)]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Password Reset Failed</span>
                  {errorDetails.code && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                      {errorDetails.code}
                    </span>
                  )}
                </div>
                <p className="text-[var(--text)] font-medium">{errorDetails.message}</p>
                {errorDetails.url && (
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">Target: {errorDetails.url}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="reset-email"
                className="text-sm font-medium text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-colors text-sm"
                  style={{
                    height: '52px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-red w-full mt-2 cursor-pointer disabled:opacity-50"
              style={{ height: '52px' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <ArrowLeft size={14} />
                <span>Back to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
