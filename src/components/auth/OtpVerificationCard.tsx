import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
  type FormEvent,
} from 'react';
import { Mail, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

export interface OtpVerificationCardProps {
  purpose: 'login' | 'signup';
  maskedEmail: string;
  initialCooldownSeconds?: number;
  initialError?: string | null;
  onVerifyCode: (code: string) => Promise<{
    ok: boolean;
    error?: string;
    locked?: boolean;
    attemptsRemaining?: number;
  }>;
  onResendCode: () => Promise<{
    ok: boolean;
    cooldownSeconds?: number;
    error?: string;
  }>;
  onUseDifferentAccount: () => Promise<void>;
}

export function OtpVerificationCard({
  purpose,
  maskedEmail,
  initialCooldownSeconds = 60,
  initialError = null,
  onVerifyCode,
  onResendCode,
  onUseDifferentAccount,
}: OtpVerificationCardProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(initialCooldownSeconds);
  const [errorMsg, setErrorMsg] = useState<string>(initialError || '');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (initialCooldownSeconds > 0) {
      setCooldown(initialCooldownSeconds);
    }
  }, [initialCooldownSeconds]);

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const fullCode = digits.join('');
  const isComplete = /^\d{6}$/.test(fullCode);

  const handleDigitChange = (index: number, rawValue: string) => {
    setErrorMsg('');
    const numeric = rawValue.replace(/\D/g, '');

    if (!numeric) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // If multiple digits were entered (e.g. mobile autocomplete="one-time-code" or fast typing)
    if (numeric.length > 1) {
      const chars = numeric.slice(0, 6).split('');
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && chars[i]) {
          next[index + i] = chars[i];
        }
      }
      setDigits(next);
      const focusIdx = Math.min(5, index + chars.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = numeric[numeric.length - 1];
    setDigits(next);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setErrorMsg('');
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(5, pasted.length - 1);
    inputRefs.current[Math.max(0, focusIdx)]?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isComplete || verifying) return;

    setErrorMsg('');
    setSuccessMsg('');
    setVerifying(true);

    try {
      const res = await onVerifyCode(fullCode);
      if (res.ok) {
        setSuccessMsg('Code verified! Redirecting...');
      } else {
        setErrorMsg(res.error || 'Invalid or expired code');
        if (res.locked) {
          setDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch {
      setErrorMsg('Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || verifying) return;
    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await onResendCode();
      if (res.ok) {
        setDigits(['', '', '', '', '', '']);
        setCooldown(res.cooldownSeconds ?? 60);
        setSuccessMsg('A new 6-digit code has been sent to your email.');
        inputRefs.current[0]?.focus();
      } else {
        if (res.cooldownSeconds && res.cooldownSeconds > 0) {
          setCooldown(res.cooldownSeconds);
        }
        setErrorMsg(res.error || 'Could not resend verification code. Please try again.');
      }
    } catch {
      setErrorMsg('Could not resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-8 flex flex-col items-center text-center gap-5"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[#D71921]">
        <Mail size={26} />
      </div>

      <div>
        <h1
          className="text-2xl font-bold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Enter the 6-digit code
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
          {purpose === 'signup'
            ? 'We sent a 6-digit verification code (and fallback verification link) to '
            : 'We sent a 6-digit sign-in code to '}
          <strong className="text-[var(--text)] font-semibold">
            {maskedEmail || '***@***'}
          </strong>
          . It expires in 10 minutes.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="w-full p-3.5 rounded-2xl bg-[#260B0B] border border-[#EF4444] flex items-center gap-2.5 text-xs text-[#FEE2E2] text-left"
        >
          <AlertCircle size={16} className="text-[#EF4444] shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="w-full p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--text)]"
        >
          <CheckCircle2 size={16} className="text-[#3ddc84] shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="grid grid-cols-6 gap-2 sm:gap-2.5 w-full">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={idx === 0 ? 'one-time-code' : 'off'}
              maxLength={idx === 0 ? 6 : 1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              disabled={verifying}
              aria-label={`Digit ${idx + 1} of 6`}
              className="w-full h-13 sm:h-14 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-center text-lg sm:text-xl font-bold text-[var(--text)] focus:outline-none focus:border-[#D71921] transition-colors"
              style={{ fontFamily: 'var(--font-dot, var(--font-heading))' }}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!isComplete || verifying}
          className="btn-red relative overflow-hidden w-full cursor-pointer disabled:opacity-50"
          style={{ height: '52px' }}
        >
          <span>{verifying ? 'Verifying...' : 'Verify'}</span>
          {verifying && <ButtonLineLoader />}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || verifying}
          className="btn-outline w-full cursor-pointer disabled:opacity-50"
          style={{ height: '48px' }}
        >
          {resending
            ? 'Sending code...'
            : cooldown > 0
            ? `Resend code (${cooldown}s)`
            : 'Resend code'}
        </button>

        <div className="pt-2 border-t border-[var(--border)] flex justify-center">
          <button
            type="button"
            onClick={onUseDifferentAccount}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer py-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <LogOut size={13} />
            <span>Use a different account</span>
          </button>
        </div>
      </form>
    </div>
  );
}
