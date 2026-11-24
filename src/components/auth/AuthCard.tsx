import { useState, useEffect, useCallback, useMemo, type FormEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  Loader2,
  Check,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { logRedirect } from '@/utils/debugTracker';
import { OtpVerificationCard } from './OtpVerificationCard';
import { validateUsernameFormat } from '@/utils/usernameValidation';
import { isWebAuthnSupported, signInWithPasskey } from '@/services/securityCenterService';
import {
  getAddAccountReason,
  getSavedAccounts,
  isAddAccountUrl,
  shouldAutoRedirectFromAuthScreen,
  type SavedAccountEntry,
} from '@/utils/savedAccounts';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup' | 'guest';
  isAddAccountFlow?: boolean;
  addAccountReason?: 'session_expired' | null;
  initialEmail?: string;
  initialUid?: string | null;
  onAuthSubmitSuccess?: (targetUid?: string | null) => void;
  onCancelAddAccount?: () => void;
}

function sanitizeFriendlyAuthMessage(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/\[auth\/[^\]]+\]\s*/gi, '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/in Firebase Authentication/gi, '')
    .replace(/Cloudflare D1|Cloudflare|Firestore|Firebase/gi, 'Boardly')
    .trim();
}

export function AuthCard({
  initialMode = 'signin',
  isAddAccountFlow: isAddAccountFlowProp,
  addAccountReason: addAccountReasonProp,
  initialEmail = '',
  initialUid = null,
  onAuthSubmitSuccess,
  onCancelAddAccount,
}: AuthCardProps) {
  const isAddAccountFlow = Boolean(
    isAddAccountFlowProp ??
      (typeof window !== 'undefined' && isAddAccountUrl(window.location.search))
  );
  const addAccountReason =
    addAccountReasonProp ??
    (typeof window !== 'undefined' ? getAddAccountReason(window.location.search) : null);
  const [hasSubmittedNewAuth, setHasSubmittedNewAuth] = useState(false);
  const [submittedTargetUid, setSubmittedTargetUid] = useState<string | null>(null);

  const [mode, setMode] = useState<'signin' | 'signup' | 'guest'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('mode') === 'guest') return 'guest';
      if (window.location.pathname === '/signup') return 'signup';
    }
    return initialMode;
  });
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGuest,
    checkUsernameAvailability,
    signOutUser,
    authError,
    clearAuthError,
    profileError,
    clearProfileError,
    isSessionVerified,
    otpVerificationState,
    requestOtpCode,
    verifyOtpCode,
    user,
    profile,
    profileLoading,
    getRoleRedirectUrl,
    switchToSavedAccount,
    removeSavedAccountSession,
  } = useAuth();
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountEntry[]>(() => getSavedAccounts());
  const [switchingSavedUid, setSwitchingSavedUid] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Guest Mode State
  const [guestUsername, setGuestUsername] = useState('');
  const [guestCheckState, setGuestCheckState] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    reason?: string;
  }>({ status: 'idle' });
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // Sign Up Username State
  const [signupUsername, setSignupUsername] = useState('');
  const [signupUsernameCheck, setSignupUsernameCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    reason?: string;
  }>({ status: 'idle' });

  // Status State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [emailAlreadyInUse, setEmailAlreadyInUse] = useState(false);
  const passkeySupported = useMemo(() => isWebAuthnSupported(), []);

  const handlePasskeySignIn = useCallback(async () => {
    setGeneralError('');
    setPasskeyLoading(true);
    try {
      await signInWithPasskey(email.trim() || undefined);
      const nextUid = auth.currentUser?.uid ?? null;
      setSubmittedTargetUid(nextUid);
      setHasSubmittedNewAuth(true);
      onAuthSubmitSuccess?.(nextUid);
    } catch (err: any) {
      setGeneralError(sanitizeFriendlyAuthMessage(err?.message) || t('auth.errPasskeySignIn'));
    } finally {
      setPasskeyLoading(false);
    }
  }, [email, onAuthSubmitSuccess, t]);

  // Segmented thumb liquid stretch state
  const [segStretching, setSegStretching] = useState(false);
  const triggerSegStretch = useCallback(() => {
    setSegStretching(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        setSegStretching(true);
        window.setTimeout(() => setSegStretching(false), 475);
      });
    }
  }, []);

  // Visual-only password strength indicator for Signup
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    const clamped = Math.max(1, Math.min(4, score));
    const labels = [
      '',
      t('auth.strengthWeak'),
      t('auth.strengthFair'),
      t('auth.strengthGood'),
      t('auth.strengthStrong'),
    ];
    return { level: clamped, label: labels[clamped] };
  }, [password, t]);

  // Smooth scroll-into-view on mobile keyboard focus so primary button isn't hidden
  const handleInputFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.setTimeout(() => {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          // ignore
        }
      }, 180);
    }
  }, []);

  // Sync mode with props if prop changes
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('mode') === 'guest') {
      setMode('guest');
    } else {
      setMode(initialMode);
    }
    setFieldErrors({});
    setGeneralError('');
    setEmailAlreadyInUse(false);
    clearAuthError();
    clearProfileError();
  }, [initialMode, clearAuthError, clearProfileError]);

  // Live debounced username availability check in guest mode
  useEffect(() => {
    if (mode !== 'guest') return;
    const raw = guestUsername.trim().replace(/^@+/, '');
    if (!raw) {
      setGuestCheckState({ status: 'idle' });
      return;
    }
    const localValidation = validateUsernameFormat(raw);
    if (!localValidation.valid) {
      setGuestCheckState({
        status: 'invalid',
        reason: localValidation.reason || t('auth.errInvalidUsernameFormat'),
      });
      return;
    }

    let cancelled = false;
    setGuestCheckState({ status: 'checking' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(raw);
      if (cancelled) return;
      if (res.available) {
        setGuestCheckState({ status: 'available' });
      } else {
        setGuestCheckState({
          status: 'taken',
          reason: res.reason || t('auth.errUsernameTaken'),
        });
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [guestUsername, mode, checkUsernameAvailability, t]);

  // Live debounced username availability check in email sign-up mode
  useEffect(() => {
    if (mode !== 'signup') return;
    const raw = signupUsername.trim().replace(/^@+/, '');
    if (!raw) {
      setSignupUsernameCheck({ status: 'idle' });
      return;
    }
    const localValidation = validateUsernameFormat(raw);
    if (!localValidation.valid) {
      setSignupUsernameCheck({
        status: 'invalid',
        reason: localValidation.reason || t('auth.errInvalidUsernameFormat'),
      });
      return;
    }

    let cancelled = false;
    setSignupUsernameCheck({ status: 'checking' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(raw);
      if (cancelled) return;
      if (res.available) {
        setSignupUsernameCheck({ status: 'available' });
      } else {
        setSignupUsernameCheck({
          status: 'taken',
          reason: res.reason || t('auth.errUsernameTaken'),
        });
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signupUsername, mode, checkUsernameAvailability, t]);

  const getDestinationUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
    const storedRedirect = sessionStorage.getItem('boardly_post_login_redirect');
    const pendingCrew = sessionStorage.getItem('pending_join_crew_code');

    if (!isAddAccountFlow) {
      if (redirectParam && redirectParam.startsWith('/')) {
        sessionStorage.removeItem('boardly_post_login_redirect');
        return redirectParam;
      }
      if (storedRedirect && storedRedirect.startsWith('/')) {
        sessionStorage.removeItem('boardly_post_login_redirect');
        return storedRedirect;
      }
      if (pendingCrew) {
        return `/join/${pendingCrew}`;
      }
    }
    if (profile && !profile.isGuest && !profile.onboardingCompleted && profile.role === 'student') {
      return '/onboarding';
    }
    return profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
  }, [profile, getRoleRedirectUrl, isAddAccountFlow]);

  const handleStartGuestMode = useCallback(() => {
    setGeneralError('');
    setFieldErrors({});
    clearAuthError();
    clearProfileError();
    setMode('guest');
  }, [clearAuthError, clearProfileError]);

  const handleGuestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const raw = guestUsername.trim().replace(/^@+/, '');
    const localCheck = validateUsernameFormat(raw);
    if (!localCheck.valid) {
      setGuestCheckState({
        status: 'invalid',
        reason: localCheck.reason || t('auth.errValidUsername'),
      });
      return;
    }

    setGuestSubmitting(true);
    try {
      const res: any = await signInAsGuest(raw);
      if (res && res.ok === false) {
        setGuestCheckState({
          status: 'taken',
          reason: res.error || t('auth.errCouldNotClaimUsername'),
        });
        setGeneralError(res.error || t('auth.errGuestSession'));
        return;
      }
      const nextUid = auth.currentUser?.uid ?? null;
      setSubmittedTargetUid(nextUid);
      setHasSubmittedNewAuth(true);
      onAuthSubmitSuccess?.(nextUid);
      const dest = isAddAccountFlow ? '/dashboard' : getDestinationUrl();
      logRedirect('/login', dest, 'AuthCard.tsx (Guest account created)');
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.errGuestSession');
      setGuestCheckState({
        status: 'taken',
        reason: msg,
      });
      setGeneralError(msg);
    } finally {
      setGuestSubmitting(false);
    }
  };

  // Navigate ONLY after session has completed 6-digit verification (or Google / Guest sign-in)
  // AND never auto-bounce an existing logged-in user (admin or student) during Add Account flow
  useEffect(() => {
    const canRedirect = shouldAutoRedirectFromAuthScreen({
      isAddAccountFlow,
      hasCompletedNewAuthSubmit: hasSubmittedNewAuth,
      initialUid,
      currentUid: user?.uid ?? null,
      profileUid: profile?.uid ?? null,
      profileLoading,
      isSessionVerified,
      submittedTargetUid,
    });
    if (canRedirect) {
      const dest = getDestinationUrl();
      logRedirect('/login', dest, 'AuthCard.tsx (user authenticated & verified -> send to target)');
      navigate(dest, { replace: true });
    }
  }, [
    isAddAccountFlow,
    hasSubmittedNewAuth,
    submittedTargetUid,
    initialUid,
    user,
    isSessionVerified,
    profile,
    profileLoading,
    navigate,
    getDestinationUrl,
  ]);

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    clearAuthError();
    clearProfileError();
    setFieldErrors({});
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      const nextUid = auth.currentUser?.uid ?? null;
      setSubmittedTargetUid(nextUid);
      setHasSubmittedNewAuth(true);
      onAuthSubmitSuccess?.(nextUid);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setGeneralError(
        sanitizeFriendlyAuthMessage(fe.message) || t('auth.errGoogleSignIn')
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const errors: Record<string, string> = {};

    if (mode === 'signin') {
      if (!email.trim()) {
        errors.email = t('auth.errEnterEmailOrUsername');
      } else if (email.trim().includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = t('auth.errValidEmail');
      }
    } else {
      if (!email.trim()) {
        errors.email = t('auth.errEnterEmail');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = t('auth.errValidEmail');
      }
    }

    if (!password) {
      errors.password = t('auth.errEnterPassword');
    } else if (mode === 'signup' && password.length < 6) {
      errors.password = t('auth.errPasswordLength');
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        errors.name = t('auth.errEnterFullName');
      }
      const cleanSignupUsername = signupUsername.trim().replace(/^@+/, '');
      const usernameValidation = validateUsernameFormat(cleanSignupUsername);
      if (!cleanSignupUsername) {
        errors.username = t('auth.errChooseUsername');
      } else if (!usernameValidation.valid) {
        errors.username = usernameValidation.reason || t('auth.errValidUsername');
      } else if (signupUsernameCheck.status === 'taken') {
        errors.username = signupUsernameCheck.reason || t('auth.errUsernameTaken');
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = t('auth.errPasswordsMismatch');
      }
      if (!termsAccepted) {
        errors.terms = t('auth.errAcceptTerms');
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
        const nextUid = auth.currentUser?.uid ?? null;
        setSubmittedTargetUid(nextUid);
        setHasSubmittedNewAuth(true);
        onAuthSubmitSuccess?.(nextUid);
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get('redirect');
        if (!isAddAccountFlow && redirectParam && redirectParam.startsWith('/')) {
          try {
            sessionStorage.setItem('boardly_post_login_redirect', redirectParam);
          } catch {
            // ignore storage errors
          }
        }
        await signUp(
          email.trim(),
          password,
          displayName.trim(),
          signupUsername.trim().replace(/^@+/, '')
        );
        const nextUid = auth.currentUser?.uid ?? null;
        setSubmittedTargetUid(nextUid);
        setHasSubmittedNewAuth(true);
        onAuthSubmitSuccess?.(nextUid);
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[AuthCard] Submit error:', err);
      }
      const fe = err as { code?: string; message?: string };
      const code = fe.code ?? '';

      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'INVALID_CREDENTIALS'
      ) {
        setEmailAlreadyInUse(false);
        setGeneralError(t('auth.errInvalidCredentials'));
      } else if (
        code === 'USERNAME_TAKEN' ||
        code === 'USERNAME_TAKEN_OR_SIMILAR' ||
        code === 'INVALID_USERNAME_FORMAT'
      ) {
        setEmailAlreadyInUse(false);
        const msg = sanitizeFriendlyAuthMessage(fe.message) || t('auth.errUsernameTaken');
        setFieldErrors({ username: msg });
        setGeneralError(msg);
      } else if (code === 'auth/email-already-in-use') {
        setEmailAlreadyInUse(true);
        const msg = t('auth.errEmailAlreadyInUse');
        setFieldErrors({ email: msg });
        setGeneralError(msg);
      } else if (code === 'auth/weak-password') {
        setEmailAlreadyInUse(false);
        setFieldErrors({ password: t('auth.errWeakPassword') });
      } else if (code === 'auth/too-many-requests') {
        setEmailAlreadyInUse(false);
        setGeneralError(
          sanitizeFriendlyAuthMessage(fe.message) || t('auth.errTooManyAttempts')
        );
      } else if (code === 'auth/user-disabled') {
        setEmailAlreadyInUse(false);
        setGeneralError(t('auth.errAccountDisabled'));
      } else if (code === 'auth/network-request-failed') {
        setEmailAlreadyInUse(false);
        setGeneralError(t('auth.networkError'));
      } else {
        setEmailAlreadyInUse(false);
        setGeneralError(
          mode === 'signin'
            ? t('auth.errInvalidCredentials')
            : sanitizeFriendlyAuthMessage(fe.message) || t('auth.errRegistrationFailed')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ── 6-Digit Email Verification Code Step (Login 2FA & Sign Up Verification) ──
  if (user && otpVerificationState.status === 'pending') {
    const activePurpose =
      otpVerificationState.purpose || (mode === 'signup' ? 'signup' : '2fa');
    return (
      <OtpVerificationCard
        purpose={activePurpose}
        maskedEmail={otpVerificationState.maskedEmail}
        initialCooldownSeconds={otpVerificationState.cooldownSeconds}
        initialError={otpVerificationState.error}
        twoFactorMethods={otpVerificationState.twoFactorMethods}
        recoveryDisableAt={otpVerificationState.recoveryDisableAt}
        onVerifyCode={verifyOtpCode}
        onResendCode={() =>
          requestOtpCode({
            purpose: activePurpose,
            forceResend: true,
          })
        }
        onUseDifferentAccount={async () => {
          await signOutUser();
          setPassword('');
          setConfirmPassword('');
          setGeneralError('');
        }}
      />
    );
  }

  // ── Guest Username Step (PART B) ──────────────────────────────────────────
  if (mode === 'guest') {
    const canSubmitGuest =
      !guestSubmitting &&
      guestUsername.trim().replace(/^@+/, '').length >= 3 &&
      guestCheckState.status !== 'invalid' &&
      guestCheckState.status !== 'taken' &&
      guestCheckState.status !== 'checking';

    return (
      <div className="glass glass-panel w-full rounded-[32px] p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setGeneralError('');
            }}
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="rtl-mirror" />
            <span>{t('auth.backToSignIn')}</span>
          </button>
          <span
            className="px-3 py-1 rounded-full text-[11px] uppercase bg-white/[0.06] border border-white/[0.15] text-[var(--text-muted)]"
            style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
          >
            {t('auth.guestMode')}
          </span>
        </div>

        <div className="text-start">
          <span
            className="block mb-2"
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
          <h1
            className="text-2xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
          >
            {t('auth.pickGuestUsername')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
            {t('auth.pickGuestUsernameDesc')}
          </p>
        </div>

        <div aria-live="polite">
          {generalError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-[#D71921]/10 border border-[#D71921]/40 flex items-start gap-2.5 text-xs text-[var(--text)]"
            >
              <AlertCircle size={16} className="text-[#D71921] shrink-0 mt-0.5" />
              <span>{sanitizeFriendlyAuthMessage(generalError)}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-start">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="guest-username-input"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('settings.username')}
              </label>

              {guestCheckState.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {t('auth.checkingAvailability')}
                </span>
              )}
              {guestCheckState.status === 'available' && (
                <span className="text-[11px] font-mono font-bold text-emerald-500 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{t('auth.available')}</span>
                </span>
              )}
              {(guestCheckState.status === 'taken' || guestCheckState.status === 'invalid') && (
                <span className="text-[11px] font-mono font-bold text-[#D71921] inline-flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{guestCheckState.status === 'taken' ? t('auth.taken') : t('auth.invalid')}</span>
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono font-bold text-sm pointer-events-none">
                @
              </div>
              <input
                id="guest-username-input"
                type="text"
                dir="ltr"
                inputMode="text"
                value={guestUsername}
                onFocus={handleInputFocus}
                onChange={(e) => setGuestUsername(e.target.value.replace(/^@+/, ''))}
                placeholder="ahmed_khan99"
                maxLength={20}
                autoFocus
                autoComplete="username"
                className={`auth-form-input font-mono ps-9 pe-4 ${
                  guestCheckState.status === 'taken' || guestCheckState.status === 'invalid'
                    ? 'input-error'
                    : ''
                }`}
                style={{ height: '50px' }}
              />
            </div>

            {(guestCheckState.status === 'taken' || guestCheckState.status === 'invalid') &&
              guestCheckState.reason && (
                <span className="text-xs text-[#D71921] font-medium">
                  {guestCheckState.reason}
                </span>
              )}

            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('auth.usernameHint')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed text-start">
            {t('auth.guestStaySignedIn')}
          </div>

          <button
            type="submit"
            disabled={!canSubmitGuest}
            className="btn-primary relative overflow-hidden w-full min-h-[52px] rounded-full inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guestSubmitting && <Loader2 size={16} className="animate-spin shrink-0" />}
            <span>{t('auth.continueAsGuest')}</span>
          </button>

          <p
            data-testid="guest-temporary-notice"
            className="text-[11px] text-[var(--text-muted)] leading-relaxed text-start"
          >
            {t('auth.guestTempNotice')}
          </p>
        </form>
      </div>
    );
  }

  const displayedError = sanitizeFriendlyAuthMessage(
    generalError || authError?.message || profileError?.message
  );

  // ── Main Sign In / Sign Up Card (Task 7 Visual Redesign) ──────────────────
  // Exact order required:
  // 1. Wordmark ("Boardly" dot-matrix)
  // 2. Sign in / Create account tabs
  // 3. Heading and subtext
  // 4. Email form + Primary button
  // 5. Divider "or"
  // 6. Continue with Google
  // 7. Continue as guest (ONE button only, secondary below main action)
  return (
    <div className="glass glass-panel w-full rounded-[32px] p-6 sm:p-8 flex flex-col gap-5">
      {/* 1. Dot-matrix "Boardly" Wordmark + COMMONS / Student label */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "'Doto', var(--font-dot), sans-serif",
            fontWeight: 800,
            fontSize: '26px',
            lineHeight: 1,
            letterSpacing: '0.03em',
            color: 'var(--cw-red-text, #D71921)',
          }}
        >
          Boardly
        </span>
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.15] text-[10px] uppercase tracking-[0.14em] text-[var(--text-primary)]"
          style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_#D71921]" />
          COMMONS
        </span>
      </div>

      {/* 2. Segmented Tabs in a Glass Track with Shared Sliding Red Thumb */}
      <div
        role="tablist"
        aria-label={t('auth.authModeAria')}
        className="ios-seg-track w-full grid grid-cols-2 items-center"
      >
        <div
          aria-hidden="true"
          className="ios-seg-thumb"
          style={{
            width: 'calc((100% - 8px) / 2)',
            transform:
              mode === 'signup'
                ? isRtl
                  ? 'translate3d(-100%, 0, 0)'
                  : 'translate3d(100%, 0, 0)'
                : 'translate3d(0%, 0, 0)',
          }}
        >
          <div className={`ios-seg-thumb-inner ${segStretching ? 'is-stretching' : ''}`} />
        </div>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => {
            if (mode !== 'signin') triggerSegStretch();
            setMode('signin');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/login${window.location.search}`);
            }
          }}
          className={`ios-seg-btn ${mode === 'signin' ? 'is-active' : ''}`}
        >
          {t('auth.signIn')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => {
            if (mode !== 'signup') triggerSegStretch();
            setMode('signup');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/signup${window.location.search}`);
            }
          }}
          className={`ios-seg-btn ${mode === 'signup' ? 'is-active' : ''}`}
        >
          {t('auth.createAccount')}
        </button>
      </div>

      {/* Add-Account context bar when adding/switching accounts */}
      {isAddAccountFlow && (
        <div
          className={`flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-xs ${
            addAccountReason === 'session_expired'
              ? 'border-[#D71921]/35 bg-[#D71921]/10'
              : 'border-white/[0.12] bg-white/[0.04]'
          }`}
        >
          <div className="min-w-0 text-start">
            <p className="font-semibold text-[var(--text)]">
              {addAccountReason === 'session_expired'
                ? t('auth.sessionExpiredTitle')
                : t('auth.addAnotherAccount')}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {addAccountReason === 'session_expired'
                ? t('auth.sessionExpiredDesc')
                : t('auth.currentAccountSavedDesc')}
            </p>
          </div>
          {onCancelAddAccount && (
            <button
              type="button"
              onClick={onCancelAddAccount}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft size={14} className="rtl-mirror" />
              <span>{t('common.back')}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Heading & Subtext */}
      <div className="text-start">
        <h1
          className="text-xl sm:text-2xl text-[var(--text)] tracking-tight"
          style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
        >
          {isAddAccountFlow
            ? mode === 'signin'
              ? t('auth.signInAnotherTitle')
              : t('auth.createAnotherTitle')
            : mode === 'signin'
            ? t('auth.signInToContinue')
            : t('auth.createYourAccount')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
          {mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
        </p>
      </div>

      {/* Saved accounts still signed in on this device (e.g. after logging out of one account) */}
      {!isAddAccountFlow && mode === 'signin' && !user && savedAccounts.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3 text-start">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
            {t('auth.savedAccountsDevice')}
          </p>
          <div className="space-y-1.5">
            {savedAccounts.map((acc) => {
              const isSwitching = switchingSavedUid === acc.uid;
              return (
                <div
                  key={acc.uid}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.06] transition-colors"
                >
                  <button
                    type="button"
                    disabled={Boolean(switchingSavedUid)}
                    onClick={async () => {
                      setGeneralError('');
                      setSwitchingSavedUid(acc.uid);
                      try {
                        const res = await switchToSavedAccount(acc);
                        setSavedAccounts(getSavedAccounts());
                        if (res.ok) {
                          navigate(res.redirectTo || '/dashboard', { replace: true });
                          return;
                        }
                        if (res.email) setEmail(res.email);
                        setGeneralError(res.error || t('auth.sessionExpiredTitle'));
                      } finally {
                        setSwitchingSavedUid(null);
                      }
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-start cursor-pointer disabled:cursor-wait"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text)]">
                        {acc.displayName}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {isSwitching
                          ? t('auth.switchingAccount')
                          : acc.email || (acc.username ? `@${acc.username}` : '')}
                      </p>
                    </div>
                    {isSwitching ? (
                      <Loader2 size={14} className="animate-spin text-[#D71921] shrink-0" />
                    ) : (
                      <span className="text-[11px] font-semibold text-[#D71921] shrink-0">
                        {t('common.continue')}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(switchingSavedUid)}
                    aria-label={t('auth.removeAccountAria', { name: acc.displayName })}
                    onClick={async () => {
                      const next = await removeSavedAccountSession(acc.uid);
                      setSavedAccounts(next);
                    }}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] px-1.5 py-1 rounded-lg cursor-pointer"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Local Error Area with aria-live */}
      <div aria-live="polite" className={displayedError ? 'block' : 'hidden'}>
        {displayedError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#D71921]/10 border border-[#D71921]/40 flex flex-col gap-2.5 text-xs text-[var(--text)]"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-[#D71921] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1 text-start">
                <span className="font-bold text-[#D71921] uppercase tracking-wider text-[10px] block">
                  {mode === 'signin' ? t('auth.signInNotice') : t('auth.signUpNotice')}
                </span>
                <p className="text-[var(--text)] leading-relaxed font-medium">
                  {displayedError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneralError('');
                  clearAuthError();
                  clearProfileError();
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm font-bold px-1.5 py-0.5 cursor-pointer"
                aria-label={t('common.dismiss')}
              >
                &times;
              </button>
            </div>

            {emailAlreadyInUse && (
              <div className="pt-2 border-t border-[#D71921]/25 flex flex-wrap items-center gap-2.5">
                <Link
                  to={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                  className="py-1.5 px-3 rounded-xl bg-[#D71921] text-white font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  {t('auth.forgotPasswordResetCta')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setGeneralError('');
                    setFieldErrors({});
                    setEmailAlreadyInUse(false);
                  }}
                  className="py-1.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold cursor-pointer"
                >
                  {t('auth.switchToSignIn')}
                </button>
              </div>
            )}

            {authError?.code === 'auth/popup-blocked' && (
              <div className="pt-2 border-t border-[#D71921]/25 flex flex-col gap-1.5">
                <p className="text-[11px] text-[var(--text-muted)] text-start">
                  {t('auth.popupBlockedDesc')}
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2 px-3 rounded-xl bg-[#D71921] text-white font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                >
                  {t('auth.retryGoogleSignIn')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Email Form + Primary Action Button */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Full Name (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-start">
            <label
              htmlFor="auth-fullname"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t('auth.fullName')}
            </label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                <User size={18} />
              </div>
              <input
                id="auth-fullname"
                type="text"
                inputMode="text"
                value={displayName}
                onFocus={handleInputFocus}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                placeholder={t('auth.fullNamePlaceholder')}
                autoComplete="name"
                className={`auth-form-input h-[50px] ps-[42px] pe-4 ${fieldErrors.name ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.name && (
              <span className="text-xs text-[#D71921] font-medium">{fieldErrors.name}</span>
            )}
          </div>
        )}

        {/* Username (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-start">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="auth-signup-username"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('auth.username')}
              </label>

              {signupUsernameCheck.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {t('auth.checking')}
                </span>
              )}
              {signupUsernameCheck.status === 'available' && (
                <span
                  data-testid="signup-username-available"
                  className="text-[11px] font-mono font-bold text-emerald-500 inline-flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>{t('auth.available')}</span>
                </span>
              )}
              {(signupUsernameCheck.status === 'taken' ||
                signupUsernameCheck.status === 'invalid') && (
                <span
                  data-testid="signup-username-taken"
                  className="text-[11px] font-mono font-bold text-[#D71921] inline-flex items-center gap-1"
                >
                  <AlertCircle size={13} />
                  <span>
                    {signupUsernameCheck.status === 'taken'
                      ? t('auth.taken')
                      : t('auth.invalid')}
                  </span>
                </span>
              )}
            </div>

            <div className="relative" dir="ltr">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono font-bold text-sm pointer-events-none">
                @
              </div>
              <input
                id="auth-signup-username"
                data-testid="auth-signup-username"
                type="text"
                inputMode="text"
                value={signupUsername}
                onFocus={handleInputFocus}
                onChange={(e) => {
                  setSignupUsername(e.target.value.replace(/^@+/, '').replace(/\s+/g, ''));
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: '' }));
                  }
                }}
                placeholder="ahmed_khan99"
                maxLength={20}
                autoComplete="username"
                className={`auth-form-input font-mono ${
                  fieldErrors.username ||
                  signupUsernameCheck.status === 'taken' ||
                  signupUsernameCheck.status === 'invalid'
                    ? 'input-error'
                    : ''
                }`}
                style={{
                  height: '50px',
                  paddingLeft: '36px',
                  paddingRight: '16px',
                }}
              />
            </div>

            {fieldErrors.username ? (
              <span className="text-xs text-[#D71921] font-medium">
                {fieldErrors.username}
              </span>
            ) : (
              (signupUsernameCheck.status === 'taken' ||
                signupUsernameCheck.status === 'invalid') &&
              signupUsernameCheck.reason && (
                <span className="text-xs text-[#D71921] font-medium">
                  {signupUsernameCheck.reason}
                </span>
              )
            )}
            <span className="text-[11px] text-[var(--text-muted)] leading-snug">
              {t('auth.usernameRulesHint')}
            </span>
          </div>
        )}

        {/* Email (Sign Up) or Email / Username (Sign In) */}
        <div className="flex flex-col gap-1.5 text-start">
          <label
            htmlFor="auth-email"
            className="text-xs sm:text-sm font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {mode === 'signin' ? t('auth.emailOrUsername') : t('auth.email')}
          </label>
          <div className="relative">
            <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              id="auth-email"
              data-testid="auth-identifier-input"
              type={mode === 'signin' ? 'text' : 'email'}
              inputMode="email"
              value={email}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              placeholder={
                mode === 'signin'
                  ? t('auth.emailOrUsernamePlaceholder')
                  : t('auth.emailPlaceholder')
              }
              autoComplete={mode === 'signin' ? 'username' : 'email'}
              className={`auth-form-input h-[50px] ps-[42px] pe-4 ${fieldErrors.email ? 'input-error' : ''}`}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-[#D71921] font-medium">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 text-start">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t('auth.password')}
            </label>
            {mode === 'signin' && (
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[var(--text-muted)] hover:text-[#D71921] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('auth.forgotPassword')}
              </Link>
            )}
          </div>
          <div className="relative">
            <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <Lock size={18} />
            </div>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className={`auth-form-input h-[50px] ps-[42px] pe-12 ${fieldErrors.password ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer rounded-lg"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-[#D71921] font-medium">{fieldErrors.password}</span>
          )}

          {/* Visual-only password strength meter on Sign Up */}
          {mode === 'signup' && password.length > 0 && (
            <div className="pt-1 space-y-1" aria-hidden="true">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1 rounded-full transition-colors ${
                      bar <= passwordStrength.level
                        ? passwordStrength.level <= 1
                          ? 'bg-[#D71921]'
                          : passwordStrength.level === 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-[var(--surface-2)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] block">
                {t('auth.passwordStrengthLabel')}{' '}
                <strong className="text-[var(--text)]">{passwordStrength.label}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-start">
            <label
              htmlFor="auth-confirm-password"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onFocus={handleInputFocus}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`auth-form-input h-[50px] ps-[42px] pe-12 ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer rounded-lg"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-xs text-[#D71921] font-medium">{fieldErrors.confirmPassword}</span>
            )}
          </div>
        )}

        {/* ONE Terms & Privacy Consent Checkbox Row on Signup (Styled checkbox, red when checked) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-start pt-0.5">
            <label
              htmlFor="auth-terms-consent"
              className="flex items-start gap-2.5 text-xs text-[var(--text-muted)] leading-relaxed cursor-pointer select-none"
            >
              <span className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  id="auth-terms-consent"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked && fieldErrors.terms) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.terms;
                        return next;
                      });
                    }
                  }}
                  className="peer sr-only"
                />
                <span className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--surface-2)] peer-checked:bg-[#D71921] peer-checked:border-[#D71921] peer-focus-visible:ring-2 peer-focus-visible:ring-[#D71921]/40 flex items-center justify-center transition-colors">
                  {termsAccepted && <Check size={12} strokeWidth={3} className="text-white" />}
                </span>
              </span>
              <span>
                {t('auth.agreePrefix')}{' '}
                <Link
                  to="/terms"
                  className="underline text-[var(--text)] hover:text-[#D71921] font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('legal.termsOfService')}
                </Link>{' '}
                {t('common.and')}{' '}
                <Link
                  to="/privacy"
                  className="underline text-[var(--text)] hover:text-[#D71921] font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('legal.privacyPolicy')}
                </Link>
                .
              </span>
            </label>
            {fieldErrors.terms && (
              <span className="text-xs text-[#D71921] font-medium">{fieldErrors.terms}</span>
            )}
          </div>
        )}

        {/* Primary Button (Solid red pill with glow, min 52px tall) */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-primary relative overflow-hidden w-full min-h-[52px] rounded-full mt-1 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={17} className="animate-spin shrink-0" />}
          <span>{mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}</span>
        </button>
      </form>

      {/* 5. Dotted Divider: "OR" */}
      <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
        <div className="flex-1 dotted-divider" />
        <span
          className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
          style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
        >
          {t('auth.orDivider')}
        </span>
        <div className="flex-1 dotted-divider" />
      </div>

      {/* 6. Continue with Google (white pill), then 7. Continue as guest (glass pill) */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="auth-google-btn relative overflow-hidden min-h-[52px] rounded-full"
          aria-label={t('auth.continueWithGoogle')}
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin shrink-0 text-[#D71921]" />
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
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
          <span>{t('auth.continueWithGoogle')}</span>
        </button>

        {mode === 'signin' && passkeySupported && (
          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={googleLoading || loading || passkeyLoading}
            className="btn-secondary w-full min-h-[52px] px-5 rounded-full text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer inline-flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {passkeyLoading ? (
              <Loader2 size={16} className="animate-spin shrink-0 text-[var(--accent)]" />
            ) : (
              <KeyRound size={16} className="text-[var(--accent)] shrink-0" />
            )}
            <span>
              {passkeyLoading ? t('auth.verifyingPasskey') : t('auth.signInWithPasskey')}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleStartGuestMode}
          disabled={googleLoading || loading || passkeyLoading}
          className="btn-secondary w-full min-h-[52px] px-5 rounded-full text-xs sm:text-sm font-semibold text-[var(--text)] cursor-pointer inline-flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <UserCheck size={16} className="text-[#D71921] shrink-0" />
          <span>{t('auth.continueAsGuest')}</span>
        </button>
      </div>
    </div>
  );
}
