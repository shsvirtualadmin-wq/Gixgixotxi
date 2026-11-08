import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function maskEmailFallback(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return 'your email address';
  return `${clean[0] || '*'}***@${clean.slice(atIdx + 1)}`;
}

export function isEmailVerificationRequiredError(errorMsg?: string | null, code?: string | null): boolean {
  if (code === 'EMAIL_VERIFICATION_REQUIRED') return true;
  if (!errorMsg) return false;
  const lower = errorMsg.toLowerCase();
  return (
    lower.includes('email_verification_required') ||
    lower.includes('email verification required') ||
    lower.includes('verify your email to continue') ||
    lower.includes('verify your email before')
  );
}

interface EmailVerificationRequiredCardProps {
  onVerified?: () => void;
  className?: string;
}

export const EmailVerificationRequiredCard: React.FC<EmailVerificationRequiredCardProps> = ({
  onVerified,
  className = '',
}) => {
  const navigate = useNavigate();
  const {
    user,
    otpVerificationState,
    requestOtpCode,
    verifyOtpCode,
    refreshVerificationStatus,
  } = useAuth();

  const initialMasked =
    otpVerificationState.maskedEmail || maskEmailFallback(user?.email || '');

  const [maskedEmail, setMaskedEmail] = useState<string>(initialMasked);
  const [cooldown, setCooldown] = useState<number>(
    Math.max(0, Number(otpVerificationState.cooldownSeconds || 0))
  );
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (otpVerificationState.maskedEmail) {
      setMaskedEmail(otpVerificationState.maskedEmail);
    } else if (user?.email) {
      setMaskedEmail(maskEmailFallback(user.email));
    }
  }, [otpVerificationState.maskedEmail, user?.email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setErrorNotice(null);
    setSentNotice(null);

    try {
      // First check if the account is already verified on the server (e.g. Google account migration)
      const isNowVerified = await refreshVerificationStatus({ syncPasswordLink: true });
      if (isNowVerified) {
        onVerified?.();
        return;
      }

      const res = await requestOtpCode({ purpose: 'signup', forceResend: true });
      if (res.maskedEmail) {
        setMaskedEmail(res.maskedEmail);
      }
      if (typeof res.cooldownSeconds === 'number' && res.cooldownSeconds > 0) {
        setCooldown(res.cooldownSeconds);
      }

      if (!res.ok) {
        setErrorNotice(
          res.error || 'Could not send verification email right now. Please try again.'
        );
        return;
      }

      const targetMasked = res.maskedEmail || maskedEmail;
      setCooldown(res.cooldownSeconds || 60);
      setSentNotice(`Verification email sent to ${targetMasked}. Check your inbox and spam folder.`);
    } catch {
      setErrorNotice('Network error while sending verification email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6 || verifying) return;

    setVerifying(true);
    setErrorNotice(null);
    try {
      const res = await verifyOtpCode(clean);
      if (!res.ok) {
        setErrorNotice(res.error || 'Invalid or expired verification code.');
        return;
      }
      setSentNotice('Email verified! Loading your page...');
      onVerified?.();
    } catch {
      setErrorNotice('Could not verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className={`cw-card my-6 max-w-lg mx-auto text-center space-y-4 p-6 rounded-3xl border border-white/10 ${className}`}
      style={{
        backgroundColor: 'var(--cw-surface, rgba(22, 22, 26, 0.72))',
      }}
    >
      <div
        className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--cw-red, #D71921) 16%, transparent)',
          color: 'var(--cw-red-text, #ff4d5c)',
        }}
      >
        <Mail size={22} />
      </div>

      <div className="space-y-1.5">
        <h2
          className="cw-font-doto text-xl font-extrabold tracking-tight"
          style={{ color: 'var(--cw-text, #f5f5f7)' }}
        >
          Please verify your email to continue
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--cw-muted, #a1a1aa)' }}>
          Enter the 6-digit verification code sent to{' '}
          <span className="font-semibold" style={{ color: 'var(--cw-text, #f5f5f7)' }}>
            {maskedEmail}
          </span>{' '}
          or request a fresh verification email below.
        </p>
      </div>

      {sentNotice && (
        <div
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium"
          style={{
            backgroundColor: 'rgba(61, 220, 132, 0.12)',
            color: '#3ddc84',
            border: '1px solid rgba(61, 220, 132, 0.28)',
          }}
          role="status"
        >
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{sentNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium"
          style={{
            backgroundColor: 'rgba(215, 25, 33, 0.14)',
            color: 'var(--cw-red-text, #ff4d5c)',
            border: '1px solid rgba(215, 25, 33, 0.3)',
          }}
          role="alert"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleVerifyCode} className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6-digit code"
          aria-label="6-digit verification code"
          className="w-full sm:w-44 h-11 px-4 rounded-full text-center font-mono text-base tracking-[0.25em] font-bold outline-none transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--cw-text, #f5f5f7)',
            border: '1px solid var(--cw-line, rgba(255, 255, 255, 0.16))',
          }}
        />
        <button
          type="submit"
          disabled={code.replace(/\D/g, '').length !== 6 || verifying}
          className="cw-btn cw-btn-red h-11 px-5 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
        >
          <span>{verifying ? 'Verifying...' : 'Verify Code'}</span>
          <ArrowRight size={15} />
        </button>
      </form>

      <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleResendEmail}
          disabled={sending || cooldown > 0}
          className="cw-btn cw-btn-glass h-10 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-55 cursor-pointer"
        >
          <RefreshCw size={14} className={sending ? 'animate-spin' : ''} />
          <span>
            {sending
              ? 'Sending verification email...'
              : cooldown > 0
              ? `Resend verification email (${cooldown}s)`
              : 'Resend verification email'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/verify-email')}
          className="text-xs font-medium underline opacity-80 hover:opacity-100 transition-opacity cursor-pointer py-1"
          style={{ color: 'var(--cw-muted, #a1a1aa)' }}
        >
          Open verification screen
        </button>
      </div>
    </div>
  );
};
