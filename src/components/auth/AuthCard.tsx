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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';
import { OtpVerificationCard } from './OtpVerificationCard';
import { validateUsernameFormat } from '@/utils/usernameValidation';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup' | 'guest';
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

export function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
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
  } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [emailAlreadyInUse, setEmailAlreadyInUse] = useState(false);

  // Visual-only password strength indicator for Signup
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    const clamped = Math.max(1, Math.min(4, score));
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: clamped, label: labels[clamped] };
  }, [password]);

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
        reason: localValidation.reason || 'Invalid username format.',
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
          reason: res.reason || 'That username is already taken.',
        });
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [guestUsername, mode, checkUsernameAvailability]);

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
        reason: localValidation.reason || 'Invalid username format.',
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
          reason: res.reason || 'That username is already taken.',
        });
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signupUsername, mode, checkUsernameAvailability]);

  const getDestinationUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
    const storedRedirect = sessionStorage.getItem('boardly_post_login_redirect');
    const pendingCrew = sessionStorage.getItem('pending_join_crew_code');

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
    if (profile && !profile.isGuest && !profile.onboardingCompleted && profile.role === 'student') {
      return '/onboarding';
    }
    return profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
  }, [profile, getRoleRedirectUrl]);

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
        reason: localCheck.reason || 'Please enter a valid username.',
      });
      return;
    }

    setGuestSubmitting(true);
    try {
      const res: any = await signInAsGuest(raw);
      if (res && res.ok === false) {
        setGuestCheckState({
          status: 'taken',
          reason: res.error || 'Could not claim that username.',
        });
        setGeneralError(res.error || 'Could not start guest session.');
        return;
      }
      const dest = getDestinationUrl();
      logRedirect('/login', dest, 'AuthCard.tsx (Guest account created)');
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create guest session.';
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
  useEffect(() => {
    if (user && isSessionVerified) {
      if (!profileLoading || profile) {
        const dest = getDestinationUrl();
        logRedirect('/login', dest, 'AuthCard.tsx (user authenticated & verified -> send to target)');
        navigate(dest, { replace: true });
      }
    }
  }, [user, isSessionVerified, profile, profileLoading, navigate, getDestinationUrl]);

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    clearAuthError();
    clearProfileError();
    setFieldErrors({});
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setGeneralError(
        sanitizeFriendlyAuthMessage(fe.message) || 'Google sign-in could not be completed. Please try again.'
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
        errors.email = 'Please enter your email or username.';
      } else if (email.trim().includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    } else {
      if (!email.trim()) {
        errors.email = 'Please enter your email address.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (mode === 'signup' && password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        errors.name = 'Please enter your full name.';
      }
      const cleanSignupUsername = signupUsername.trim().replace(/^@+/, '');
      const usernameValidation = validateUsernameFormat(cleanSignupUsername);
      if (!cleanSignupUsername) {
        errors.username = 'Please choose a username.';
      } else if (!usernameValidation.valid) {
        errors.username = usernameValidation.reason || 'Please enter a valid username.';
      } else if (signupUsernameCheck.status === 'taken') {
        errors.username = signupUsernameCheck.reason || 'That username is already taken.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
      if (!termsAccepted) {
        errors.terms = 'Please agree to our Terms of Service and Privacy Policy to continue.';
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
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
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
        setGeneralError('Invalid username/email or password');
      } else if (
        code === 'USERNAME_TAKEN' ||
        code === 'USERNAME_TAKEN_OR_SIMILAR' ||
        code === 'INVALID_USERNAME_FORMAT'
      ) {
        setEmailAlreadyInUse(false);
        const msg = sanitizeFriendlyAuthMessage(fe.message) || 'That username is already taken.';
        setFieldErrors({ username: msg });
        setGeneralError(msg);
      } else if (code === 'auth/email-already-in-use') {
        setEmailAlreadyInUse(true);
        const msg =
          'An account with this email already exists. You can sign in with your password or reset your password below.';
        setFieldErrors({ email: msg });
        setGeneralError(msg);
      } else if (code === 'auth/weak-password') {
        setEmailAlreadyInUse(false);
        setFieldErrors({ password: 'Password is too weak. Please use at least 6 characters.' });
      } else if (code === 'auth/too-many-requests') {
        setEmailAlreadyInUse(false);
        setGeneralError(
          sanitizeFriendlyAuthMessage(fe.message) ||
            'Too many failed attempts. Please wait a few moments before trying again.'
        );
      } else if (code === 'auth/user-disabled') {
        setEmailAlreadyInUse(false);
        setGeneralError('This account has been disabled. Please contact support@boardly.cfd.');
      } else if (code === 'auth/network-request-failed') {
        setEmailAlreadyInUse(false);
        setGeneralError('Network connection issue. Please check your internet connection.');
      } else {
        setEmailAlreadyInUse(false);
        setGeneralError(
          mode === 'signin'
            ? 'Invalid username/email or password'
            : sanitizeFriendlyAuthMessage(fe.message) ||
              'Could not complete registration right now. Please check your details and try again.'
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
      <div
        className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 flex flex-col gap-5"
        style={{ boxShadow: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setGeneralError('');
            }}
            className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </button>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]">
            Guest Mode
          </span>
        </div>

        <div className="text-left">
          <span
            className="block mb-2"
            style={{
              fontFamily: "'Doto', var(--font-dot), sans-serif",
              fontWeight: 800,
              fontSize: '20px',
              lineHeight: 1,
              letterSpacing: '0.02em',
              color: 'var(--cw-red-text, #D71921)',
            }}
          >
            Boardly
          </span>
          <h1
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Pick a guest username
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Choose a unique username to practice tests, save your progress, and participate in Boardly Commons.
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
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="guest-username-input"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Username
              </label>

              {guestCheckState.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Checking availability...
                </span>
              )}
              {guestCheckState.status === 'available' && (
                <span className="text-[11px] font-mono font-bold text-emerald-500 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Available</span>
                </span>
              )}
              {(guestCheckState.status === 'taken' || guestCheckState.status === 'invalid') && (
                <span className="text-[11px] font-mono font-bold text-[#D71921] inline-flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{guestCheckState.status === 'taken' ? 'Taken' : 'Invalid'}</span>
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono font-bold text-sm pointer-events-none">
                @
              </div>
              <input
                id="guest-username-input"
                type="text"
                inputMode="text"
                value={guestUsername}
                onFocus={handleInputFocus}
                onChange={(e) => setGuestUsername(e.target.value.replace(/^@+/, ''))}
                placeholder="ahmed_khan99"
                maxLength={20}
                autoFocus
                autoComplete="username"
                className={`auth-form-input font-mono ${
                  guestCheckState.status === 'taken' || guestCheckState.status === 'invalid'
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

            {(guestCheckState.status === 'taken' || guestCheckState.status === 'invalid') &&
              guestCheckState.reason && (
                <span className="text-xs text-[#D71921] font-medium">
                  {guestCheckState.reason}
                </span>
              )}

            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              3 to 20 characters: letters, numbers, dots and underscores only.
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed text-left">
            You&apos;ll stay signed in on this device.
          </div>

          <button
            type="submit"
            disabled={!canSubmitGuest}
            className="btn-red relative overflow-hidden w-full inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ height: '50px' }}
          >
            {guestSubmitting && <Loader2 size={16} className="animate-spin shrink-0" />}
            <span>Continue as guest</span>
          </button>

          <p
            data-testid="guest-temporary-notice"
            className="text-[11px] text-[var(--text-muted)] leading-relaxed text-left"
          >
            Guest accounts are temporary. If you log out or clear your browser data, you can&apos;t get back into this account. Create a free account to keep your progress and use rewards and Pro.
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
    <div
      className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 flex flex-col gap-5"
      style={{
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      {/* 1. Dot-matrix "Boardly" Wordmark (same as dashboard header) */}
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
        <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Student Cockpit
        </span>
      </div>

      {/* 2. Segmented Tabs: "Sign in" & "Create account" */}
      <div
        role="tablist"
        aria-label="Authentication mode"
        className="w-full h-11 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-2 gap-1 items-center"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => {
            setMode('signin');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/login${window.location.search}`);
            }
          }}
          className={`h-full rounded-lg text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signin'
              ? 'bg-[#D71921] text-white'
              : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => {
            setMode('signup');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/signup${window.location.search}`);
            }
          }}
          className={`h-full rounded-lg text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signup'
              ? 'bg-[#D71921] text-white'
              : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
        >
          Create account
        </button>
      </div>

      {/* 3. Heading & Subtext */}
      <div className="text-left">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-dot)' }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
          {mode === 'signin'
            ? 'Sign in to continue your university mock tests and track your progress.'
            : 'Join Boardly to practice official university entry test papers and track your rank.'}
        </p>
      </div>

      {/* Local Error Area with aria-live */}
      <div aria-live="polite" className={displayedError ? 'block' : 'hidden'}>
        {displayedError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#D71921]/10 border border-[#D71921]/40 flex flex-col gap-2.5 text-xs text-[var(--text)]"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-[#D71921] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1 text-left">
                <span className="font-bold text-[#D71921] uppercase tracking-wider text-[10px] block">
                  {mode === 'signin' ? 'Sign-In Notice' : 'Sign-Up Notice'}
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
                aria-label="Dismiss error"
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
                  Forgot password? Reset it here →
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
                  Switch to Sign In
                </button>
              </div>
            )}

            {authError?.code === 'auth/popup-blocked' && (
              <div className="pt-2 border-t border-[#D71921]/25 flex flex-col gap-1.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  Your browser blocked the Google sign-in window. Allow popups and try again:
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2 px-3 rounded-xl bg-[#D71921] text-white font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                >
                  Retry Google Sign-In
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
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="auth-fullname"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Full name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                placeholder="Ahmed Khan"
                autoComplete="name"
                className={`auth-form-input ${fieldErrors.name ? 'input-error' : ''}`}
                style={{
                  height: '50px',
                  paddingLeft: '42px',
                  paddingRight: '16px',
                }}
              />
            </div>
            {fieldErrors.name && (
              <span className="text-xs text-[#D71921] font-medium">{fieldErrors.name}</span>
            )}
          </div>
        )}

        {/* Username (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="auth-signup-username"
                className="text-xs sm:text-sm font-semibold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Username
              </label>

              {signupUsernameCheck.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Checking...
                </span>
              )}
              {signupUsernameCheck.status === 'available' && (
                <span
                  data-testid="signup-username-available"
                  className="text-[11px] font-mono font-bold text-emerald-500 inline-flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Available</span>
                </span>
              )}
              {(signupUsernameCheck.status === 'taken' ||
                signupUsernameCheck.status === 'invalid') && (
                <span
                  data-testid="signup-username-taken"
                  className="text-[11px] font-mono font-bold text-[#D71921] inline-flex items-center gap-1"
                >
                  <AlertCircle size={13} />
                  <span>{signupUsernameCheck.status === 'taken' ? 'Taken' : 'Invalid'}</span>
                </span>
              )}
            </div>

            <div className="relative">
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
              3 to 20 characters: letters, numbers, dots and underscores only
            </span>
          </div>
        )}

        {/* Email (Sign Up) or Email / Username (Sign In) */}
        <div className="flex flex-col gap-1.5 text-left">
          <label
            htmlFor="auth-email"
            className="text-xs sm:text-sm font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {mode === 'signin' ? 'Email or username' : 'Email'}
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              id="auth-email"
              data-testid="auth-identifier-input"
              type={mode === 'signin' ? 'text' : 'email'}
              inputMode={mode === 'signin' ? 'email' : 'email'}
              value={email}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              placeholder={
                mode === 'signin' ? 'student@example.com or username' : 'student@example.com'
              }
              autoComplete={mode === 'signin' ? 'username' : 'email'}
              className={`auth-form-input ${fieldErrors.email ? 'input-error' : ''}`}
              style={{
                height: '50px',
                paddingLeft: '42px',
                paddingRight: '16px',
              }}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-[#D71921] font-medium">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Password
            </label>
            {mode === 'signin' && (
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[var(--text-muted)] hover:text-[#D71921] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
              className={`auth-form-input ${fieldErrors.password ? 'input-error' : ''}`}
              style={{
                height: '50px',
                paddingLeft: '42px',
                paddingRight: '48px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer rounded-lg"
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
                Password strength: <strong className="text-[var(--text)]">{passwordStrength.label}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="auth-confirm-password"
              className="text-xs sm:text-sm font-semibold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                className={`auth-form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                style={{
                  height: '50px',
                  paddingLeft: '42px',
                  paddingRight: '48px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer rounded-lg"
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
          <div className="flex flex-col gap-1.5 text-left pt-0.5">
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
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="underline text-[var(--text)] hover:text-[#D71921] font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="underline text-[var(--text)] hover:text-[#D71921] font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {fieldErrors.terms && (
              <span className="text-xs text-[#D71921] font-medium">{fieldErrors.terms}</span>
            )}
          </div>
        )}

        {/* Primary Button (Spinner + disabled when loading, same label, no layout shift) */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-red relative overflow-hidden w-full mt-1 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
          style={{ height: '50px' }}
        >
          {loading && <Loader2 size={17} className="animate-spin shrink-0" />}
          <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
        </button>
      </form>

      {/* 5. Divider: "or" */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span
          className="text-xs font-medium text-[var(--text-muted)] lowercase"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          or
        </span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* 6. Continue with Google, then 7. Continue as guest (ONE guest button only) */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="auth-google-btn relative overflow-hidden"
          aria-label="Continue with Google"
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
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={handleStartGuestMode}
          disabled={googleLoading || loading}
          className="w-full min-h-[48px] px-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] hover:border-[#D71921]/55 text-xs sm:text-sm font-semibold text-[var(--text)] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-heading)', height: '48px' }}
        >
          <UserCheck size={16} className="text-[#D71921] shrink-0" />
          <span>Continue as guest</span>
        </button>
      </div>
    </div>
  );
}
