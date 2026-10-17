import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';

export function VerifyEmailPage() {
  const { user, sendVerificationEmail } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await sendVerificationEmail();
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      setError('Could not send verification email. Please try again in a few moments.');
    }
  };

  return (
    <AuthLayout>
      <div
        className="w-full rounded-[28px] border border-[var(--border)] p-7 sm:p-8 flex flex-col items-center text-center gap-5"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
          <Mail size={28} />
        </div>

        <div>
          <h1
            className="font-dot text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em', fontWeight: 800 }}
          >
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-[var(--text)] font-semibold">
              {user?.email || 'your email'}
            </span>
            . Please check your inbox and spam folder.
          </p>
        </div>

        {resendSuccess && (
          <div className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--text)]">
            <CheckCircle2 size={16} className="text-[var(--accent)]" />
            <span>Verification email sent! Check your inbox.</span>
          </div>
        )}

        {error && (
          <div className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--accent)] text-xs text-[var(--text)]">
            {error}
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="btn-outline w-full cursor-pointer disabled:opacity-50"
            style={{ height: '52px' }}
          >
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : 'Resend Verification Email'}
          </button>

          <Link
            to="/dashboard"
            className="btn-red w-full flex items-center justify-center gap-2 cursor-pointer"
            style={{ height: '52px' }}
          >
            <span>Continue to Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailPage;
