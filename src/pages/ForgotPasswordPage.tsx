import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, ArrowLeft, UserPlus, Mail, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useLanguage } from '@/contexts/LanguageContext';

function mapResetPasswordError(
  err: unknown,
  t: (key: string) => string
): {
  message: string;
  showSignUpLink?: boolean;
} {
  const fe = err as { code?: string; message?: string };
  const code = String(fe?.code || '');
  const rawMsg = String(fe?.message || '');

  if (code === 'auth/user-not-found' || rawMsg.includes('EMAIL_NOT_FOUND')) {
    return {
      message: t('auth.resetErrNotFound'),
      showSignUpLink: true,
    };
  }
  if (code === 'auth/invalid-email' || rawMsg.includes('INVALID_EMAIL')) {
    return {
      message: t('auth.resetErrInvalidEmail'),
    };
  }
  if (code === 'auth/too-many-requests' || rawMsg.includes('TOO_MANY_ATTEMPTS')) {
    return {
      message: t('auth.resetErrTooMany'),
    };
  }
  if (
    code.includes('-26') ||
    rawMsg.includes('error-code:-26') ||
    code === 'auth/unauthorized-continue-uri' ||
    code === 'auth/invalid-continue-uri'
  ) {
    return {
      message: t('auth.resetErrContinueUri'),
    };
  }
  if (code === 'auth/network-request-failed') {
    return {
      message: t('auth.networkError'),
    };
  }

  return {
    message:
      rawMsg && !/firebase|cloudflare|d1|firestore/i.test(rawMsg)
        ? rawMsg
        : t('auth.resetErrGeneric'),
  };
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
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
      const mapped = mapResetPasswordError(err, t);
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
            <ArrowLeft size={14} className="rtl-mirror" />
            <span>{t('auth.backToSignIn')}</span>
          </Link>
        </div>

        <div className="text-start">
          <h1
            className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            {t('auth.resetPassword')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
            {t('auth.resetPasswordDesc')}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 text-start">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {t('auth.resetLinkSentTo', { email: email.trim() })}
                </p>
                <p className="text-emerald-500/80">
                  {t('auth.checkInboxSpam')}
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full min-h-[48px] px-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] inline-flex items-center justify-center"
            >
              {t('auth.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div aria-live="polite" className={error ? 'block' : 'hidden'}>
              {error && (
                <div
                  role="alert"
                  className="p-3.5 bg-[#D71921]/10 border border-[#D71921]/40 rounded-2xl text-xs text-[var(--text)] space-y-2 text-start"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#D71921] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  {showSignUpHint && (
                    <div className="ps-6 pt-1">
                      <Link
                        to="/signup"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#D71921] underline hover:opacity-80"
                      >
                        <UserPlus size={13} />
                        <span>{t('auth.createAccountWithEmail')}</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-start">
              <label
                htmlFor="forgot-password-email"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  id="forgot-password-email"
                  type="email"
                  dir="ltr"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-form-input ps-[42px] pe-4"
                  style={{ height: '50px' }}
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
              <span>{t('auth.sendResetLink')}</span>
            </button>

            <p className="text-center text-xs text-[var(--text-muted)]">
              {t('auth.rememberedPassword')}{' '}
              <Link to="/login" className="text-[#D71921] font-semibold hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
