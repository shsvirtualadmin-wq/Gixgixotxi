import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
  type FormEvent,
} from 'react';
import {
  Mail,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Clock,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

export interface OtpVerificationCardProps {
  purpose: 'login' | 'signup' | '2fa';
  maskedEmail: string;
  initialCooldownSeconds?: number;
  initialError?: string | null;
  twoFactorMethods?: {
    totp: boolean;
    email: boolean;
  };
  recoveryDisableAt?: number | null;
  onVerifyCode: (
    code: string,
    opts?: { method?: 'totp' | 'email' | 'backup'; rememberDevice?: boolean }
  ) => Promise<{
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
  twoFactorMethods,
  recoveryDisableAt: initialRecoveryDisableAt = null,
  onVerifyCode,
  onResendCode,
  onUseDifferentAccount,
}: OtpVerificationCardProps) {
  const isTwoFactor = purpose === '2fa';
  const hasTotp = Boolean(twoFactorMethods?.totp);
  const hasEmail2fa = Boolean(twoFactorMethods?.email) || (!hasTotp && isTwoFactor);

  const [activeMethod, setActiveMethod] = useState<'totp' | 'email' | 'backup'>(() => {
    if (!isTwoFactor) return 'email';
    if (hasTotp) return 'totp';
    return 'email';
  });

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(
    activeMethod === 'email' ? initialCooldownSeconds : 0
  );
  const [errorMsg, setErrorMsg] = useState<string>(initialError || '');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // 24-hour Lost Authenticator Recovery state
  const [recoveryMode, setRecoveryMode] = useState<'idle' | 'code_sent' | 'scheduled'>(
    initialRecoveryDisableAt && initialRecoveryDisableAt > Date.now() ? 'scheduled' : 'idle'
  );
  const [recoveryDisableAt, setRecoveryDisableAt] = useState<number | null>(
    initialRecoveryDisableAt
  );
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    if (initialRecoveryDisableAt && initialRecoveryDisableAt > Date.now()) {
      setRecoveryDisableAt(initialRecoveryDisableAt);
      setRecoveryMode('scheduled');
    }
  }, [initialRecoveryDisableAt]);

  useEffect(() => {
    if (initialCooldownSeconds > 0 && activeMethod === 'email') {
      setCooldown(initialCooldownSeconds);
    }
  }, [initialCooldownSeconds, activeMethod]);

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
    if (activeMethod !== 'backup') {
      inputRefs.current[0]?.focus();
    }
  }, [activeMethod]);

  const fullCode = digits.join('');
  const isComplete =
    activeMethod === 'backup'
      ? backupCodeInput.replace(/[^A-Za-z0-9]/g, '').length >= 8
      : /^\d{6}$/.test(fullCode);

  const handleDigitChange = (index: number, rawValue: string) => {
    setErrorMsg('');
    const numeric = rawValue.replace(/\D/g, '');

    if (!numeric) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

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

  const handleSwitchMethod = async (nextMethod: 'totp' | 'email' | 'backup') => {
    setErrorMsg('');
    setSuccessMsg('');
    setActiveMethod(nextMethod);
    setDigits(['', '', '', '', '', '']);
    setBackupCodeInput('');

    // If user switches to email 2FA and no email code was sent yet, trigger send-code
    if (nextMethod === 'email' && isTwoFactor && cooldown <= 0) {
      setResending(true);
      try {
        const res = await onResendCode();
        if (res.ok) {
          setCooldown(res.cooldownSeconds ?? 60);
          setSuccessMsg('A 6-digit sign-in code has been sent to your email.');
        } else if (res.cooldownSeconds) {
          setCooldown(res.cooldownSeconds);
        }
      } catch {
        // Ignore
      } finally {
        setResending(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isComplete || verifying) return;

    setErrorMsg('');
    setSuccessMsg('');
    setVerifying(true);

    const codeToVerify = activeMethod === 'backup' ? backupCodeInput.trim() : fullCode;

    try {
      const res = await onVerifyCode(
        codeToVerify,
        isTwoFactor
          ? { method: activeMethod, rememberDevice }
          : { rememberDevice }
      );
      if (res.ok) {
        setSuccessMsg('Code verified! Redirecting...');
      } else {
        setErrorMsg(res.error || 'Invalid or expired code');
        if (res.locked) {
          setDigits(['', '', '', '', '', '']);
          setBackupCodeInput('');
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

  const handleRequest24hRecovery = async () => {
    if (!auth.currentUser || recoveryLoading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setRecoveryLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/recovery/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Could not start recovery request.');
      } else {
        setRecoveryMode('code_sent');
        setSuccessMsg(
          data?.message || 'We sent a 6-digit recovery code to your verified email.'
        );
      }
    } catch {
      setErrorMsg('Network error while requesting 2FA recovery.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleConfirm24hRecovery = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || recoveryLoading || recoveryCode.trim().length !== 6) return;
    setErrorMsg('');
    setSuccessMsg('');
    setRecoveryLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/recovery/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code: recoveryCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Invalid or expired recovery code.');
      } else {
        setRecoveryDisableAt(data.recoveryDisableAt || Date.now() + 24 * 3600 * 1000);
        setRecoveryMode('scheduled');
        setRecoveryCode('');
        setSuccessMsg(
          data.message ||
            '24-hour recovery timer started. Two-step verification will automatically turn off in 24 hours.'
        );
      }
    } catch {
      setErrorMsg('Network error while confirming 2FA recovery.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleCancel24hRecovery = async () => {
    if (!auth.currentUser || recoveryLoading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setRecoveryLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/recovery/cancel', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setRecoveryDisableAt(null);
        setRecoveryMode('idle');
        setSuccessMsg('24-hour recovery request cancelled.');
      } else {
        setErrorMsg(data?.error || 'Could not cancel recovery.');
      }
    } catch {
      setErrorMsg('Network error while cancelling recovery.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div
      className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-8 flex flex-col items-center text-center gap-5"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[#D71921]">
        {isTwoFactor ? (
          activeMethod === 'backup' ? (
            <KeyRound size={26} />
          ) : (
            <Shield size={26} />
          )
        ) : (
          <Mail size={26} />
        )}
      </div>

      <div>
        <h1
          className="text-2xl font-bold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          {isTwoFactor
            ? activeMethod === 'backup'
              ? 'Enter backup code'
              : activeMethod === 'totp'
              ? 'Two-step verification'
              : 'Enter email login code'
            : 'Verify your email'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
          {isTwoFactor ? (
            activeMethod === 'totp' ? (
              'Open your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy) and enter the 6-digit code.'
            ) : activeMethod === 'backup' ? (
              'Enter one of your 10 one-time backup codes (e.g. ABCD-1234). Each backup code works once.'
            ) : (
              <>
                We sent a 6-digit login code to{' '}
                <strong className="text-[var(--text)] font-semibold">
                  {maskedEmail || '***@***'}
                </strong>
                . It expires in 10 minutes.
              </>
            )
          ) : (
            <>
              We sent a 6-digit verification code (and fallback verification link) to{' '}
              <strong className="text-[var(--text)] font-semibold">
                {maskedEmail || '***@***'}
              </strong>
              . Verify once to activate your account.
            </>
          )}
        </p>
      </div>

      {/* Method Selector when Both TOTP and Email 2FA are enabled */}
      {isTwoFactor && hasTotp && hasEmail2fa && (
        <div className="w-full p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => void handleSwitchMethod('totp')}
            className={`py-2 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeMethod === 'totp'
                ? 'bg-[#D71921] text-white'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Authenticator App
          </button>
          <button
            type="button"
            onClick={() => void handleSwitchMethod('email')}
            className={`py-2 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeMethod === 'email'
                ? 'bg-[#D71921] text-white'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Email Code
          </button>
        </div>
      )}

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
        {activeMethod === 'backup' ? (
          <input
            type="text"
            value={backupCodeInput}
            onChange={(e) => {
              setErrorMsg('');
              setBackupCodeInput(e.target.value.toUpperCase());
            }}
            placeholder="ABCD-1234"
            maxLength={12}
            disabled={verifying}
            autoFocus
            className="w-full h-14 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-center text-lg font-mono font-bold tracking-widest text-[var(--text)] focus:outline-none focus:border-[#D71921] transition-colors"
          />
        ) : (
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
        )}

        {isTwoFactor && (
          <label className="flex items-center justify-center gap-2.5 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] accent-[#D71921] cursor-pointer"
            />
            <span>Remember this device for 30 days</span>
          </label>
        )}

        <button
          type="submit"
          disabled={!isComplete || verifying}
          className="btn-red relative overflow-hidden w-full cursor-pointer disabled:opacity-50"
          style={{ height: '52px' }}
        >
          <span>{verifying ? 'Verifying...' : 'Verify'}</span>
          {verifying && <ButtonLineLoader />}
        </button>

        {(!isTwoFactor || activeMethod === 'email') && (
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
        )}

        {isTwoFactor && hasTotp && (
          <div className="flex items-center justify-center gap-4 text-xs">
            {activeMethod !== 'backup' ? (
              <button
                type="button"
                onClick={() => void handleSwitchMethod('backup')}
                className="text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-4 cursor-pointer"
              >
                Use a backup code instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSwitchMethod('totp')}
                className="text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-4 cursor-pointer"
              >
                Use authenticator code
              </button>
            )}
          </div>
        )}

        {/* 24-Hour Lost Authenticator & Backup Codes Self-Service Recovery */}
        {isTwoFactor && (
          <div className="pt-3 border-t border-[var(--border)] w-full text-left space-y-2.5">
            {recoveryMode === 'scheduled' && recoveryDisableAt ? (
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <Clock size={14} />
                  <span>24-Hour Recovery Scheduled</span>
                </div>
                <p className="text-[var(--muted)] leading-relaxed">
                  Two-step verification will automatically turn off on{' '}
                  <strong className="text-[var(--text)]">
                    {new Date(recoveryDisableAt).toLocaleString()}
                  </strong>
                  .
                </p>
                <button
                  type="button"
                  disabled={recoveryLoading}
                  onClick={handleCancel24hRecovery}
                  className="text-xs font-semibold text-[#EF4444] hover:underline cursor-pointer"
                >
                  Cancel recovery request
                </button>
              </div>
            ) : recoveryMode === 'code_sent' ? (
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2.5 text-xs">
                <p className="text-[var(--muted)] leading-relaxed">
                  Enter the 6-digit recovery code sent to your email to start the 24-hour cooling-off period:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit email code"
                    className="flex-1 h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-mono text-[var(--text)]"
                  />
                  <button
                    type="button"
                    disabled={recoveryLoading || recoveryCode.length !== 6}
                    onClick={handleConfirm24hRecovery}
                    className="px-3.5 h-10 rounded-xl bg-[#D71921] text-white font-semibold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {recoveryLoading ? 'Confirming...' : 'Start 24h Recovery'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  disabled={recoveryLoading}
                  onClick={handleRequest24hRecovery}
                  className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-4 cursor-pointer"
                >
                  Lost authenticator and backup codes? Request 24-hour email recovery
                </button>
              </div>
            )}
          </div>
        )}

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
