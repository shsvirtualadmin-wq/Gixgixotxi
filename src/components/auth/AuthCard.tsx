import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logRedirect } from '@/utils/debugTracker';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { OtpVerificationCard } from './OtpVerificationCard';
import { validateUsernameFormat } from '@/utils/usernameValidation';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup' | 'guest';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [emailAlreadyInUse, setEmailAlreadyInUse] = useState(false);

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
      // ONLY signInWithPopup on user click
      await signInWithGoogle();
      // Navigation is handled by the useEffect above once isSessionVerified is true
      // (immediate for Google users without 2FA; after 2FA code for Google users with 2FA enabled).
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      const codeStr = fe.code ? `[${fe.code}] ` : '';
      setGeneralError(`${codeStr}${fe.message || 'Google sign-in could not be completed.'}`);
    } finally {
      // ALWAYS reset google loading state so button never gets stuck in infinite spinner
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
        const msg = fe.message || 'That username is already taken.';
        setFieldErrors({ username: msg });
        setGeneralError(msg);
      } else if (code === 'auth/email-already-in-use') {
        setEmailAlreadyInUse(true);
        const msg =
          'An account with this email already exists in Firebase Authentication. You can sign in with your password or reset your password below.';
        setFieldErrors({ email: msg });
        setGeneralError(msg);
      } else if (code === 'auth/weak-password') {
        setEmailAlreadyInUse(false);
        setFieldErrors({ password: 'Password is too weak. Please use at least 6 characters.' });
      } else if (code === 'auth/too-many-requests') {
        setEmailAlreadyInUse(false);
        setGeneralError(
          fe.message || 'Too many failed attempts. Please wait a few moments before trying again.'
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
            : fe.message || 'Authentication failed. Please check your details and try again.'
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
        className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-7 flex flex-col gap-5"
        style={{
          backgroundColor: 'var(--card)',
          boxShadow: 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setGeneralError('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Sign In</span>
          </button>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
            Guest Mode
          </span>
        </div>

        <div className="text-left">
          <h1
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Pick a guest username
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            Choose a unique username to practice tests, save your progress, and participate in Boardly Commons.
          </p>
        </div>

        {generalError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#260B0B] border border-[#EF4444] flex items-start gap-2.5 text-xs text-[#FEE2E2]"
          >
            <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="guest-username-input"
                className="text-sm font-medium text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Username
              </label>

              {guestCheckState.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--muted)]">
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
                <span className="text-[11px] font-mono font-bold text-[#EF4444] inline-flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{guestCheckState.status === 'taken' ? 'Taken' : 'Invalid'}</span>
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] font-mono font-bold text-sm pointer-events-none">
                @
              </div>
              <input
                id="guest-username-input"
                type="text"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value.replace(/^@+/, ''))}
                placeholder="ahmed_khan99"
                maxLength={20}
                autoFocus
                autoComplete="off"
                className={`auth-form-input font-mono ${
                  guestCheckState.status === 'taken' || guestCheckState.status === 'invalid'
                    ? 'input-error'
                    : ''
                }`}
                style={{
                  height: '52px',
                  paddingLeft: '36px',
                  paddingRight: '16px',
                }}
              />
            </div>

            {(guestCheckState.status === 'taken' || guestCheckState.status === 'invalid') &&
              guestCheckState.reason && (
                <span className="text-xs text-[#EF4444] font-medium">
                  {guestCheckState.reason}
                </span>
              )}

            <span className="text-[11px] text-[var(--muted)] leading-relaxed">
              3 to 20 characters. Letters, numbers, dots (<code className="font-mono">.</code>) and underscores (<code className="font-mono">_</code>) only. Case-insensitive across all accounts.
            </span>
          </div>

          {/* Non-blocking note required by Part B Rule 3 */}
          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--muted)] leading-relaxed text-left">
            You&apos;ll stay signed in on this device.
          </div>

          <button
            type="submit"
            disabled={!canSubmitGuest}
            className="btn-red relative overflow-hidden w-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ height: '52px' }}
          >
            <span>{guestSubmitting ? 'Starting guest session...' : 'Continue as guest'}</span>
            {guestSubmitting && <ButtonLineLoader />}
          </button>

          <p
            data-testid="guest-temporary-notice"
            className="text-[11px] text-[var(--muted)] leading-relaxed text-left"
          >
            Guest accounts are temporary. If you log out or clear your browser data, you can&apos;t get back into this account. Create a free account to keep your progress and use rewards and Pro.
          </p>
        </form>
      </div>
    );
  }

  // ── Main Sign In / Sign Up Card ───────────────────────────────────────────
  return (
    <div
      className="w-full rounded-[28px] border border-[var(--border)] p-6 sm:p-7 flex flex-col gap-5"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: 'none',
      }}
    >
      {/* Segmented Tabs: "Sign in" & "Create account" */}
      <div className="w-full h-11 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-2 gap-1 items-center">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/login${window.location.search}`);
            }
          }}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signin'
              ? 'bg-[#D71921] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/signup${window.location.search}`);
            }
          }}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            mode === 'signup'
              ? 'bg-[#D71921] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Create account
        </button>
      </div>

      {/* Header & Subtext */}
      <div>
        <h1
          className="text-2xl font-bold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
          Practice MCQs. Learn together. Education for everyone.
        </p>
      </div>

      {/* Visible Red Error Alert Box */}
      {(generalError || authError || profileError) && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#260B0B] border-2 border-[#EF4444] flex flex-col gap-2.5 text-xs text-[#FFFFFF] shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5 text-left">
              <span className="font-semibold text-[#FCA5A5] uppercase tracking-wider text-[11px] block">
                {mode === 'signin' ? 'Sign-In Issue' : 'Sign-Up Issue'}
              </span>
              <p className="text-[#FEE2E2] leading-relaxed font-medium">
                {generalError || authError?.message || profileError?.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGeneralError('');
                clearAuthError();
                clearProfileError();
              }}
              className="text-[#FCA5A5] hover:text-[#FFFFFF] text-xs font-bold px-1.5 py-0.5 cursor-pointer"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>

          {emailAlreadyInUse && (
            <div className="pt-2 border-t border-[#EF4444]/30 flex flex-wrap items-center gap-3">
              <Link
                to={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                className="py-1.5 px-3 rounded-xl bg-[#EF4444] text-[#FFFFFF] font-semibold text-xs hover:bg-[#DC2626] transition-colors"
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
                className="py-1.5 px-3 rounded-xl border border-[#FCA5A5]/40 text-[#FCA5A5] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Switch to Sign In
              </button>
            </div>
          )}

          {authError?.code === 'auth/popup-blocked' && (
            <div className="pt-2 border-t border-[#EF4444]/30 flex flex-col gap-1.5">
              <p className="text-[11px] text-[#FCA5A5]">
                Your browser blocked the Google sign-in popup. Allow popups for boardly.cfd and try again:
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2 px-3 rounded-xl bg-[#EF4444] text-[#FFFFFF] font-semibold text-xs hover:bg-[#DC2626] transition-colors cursor-pointer text-center"
              >
                Retry Google Sign-In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Continue with Google + Continue as guest */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="auth-google-btn relative overflow-hidden"
          aria-label="Continue with Google"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>
            {googleLoading
              ? mode === 'signin'
                ? 'Logging in...'
                : 'Creating your account...'
              : 'Continue with Google'}
          </span>
          {googleLoading && <ButtonLineLoader />}
        </button>

        <button
          type="button"
          onClick={handleStartGuestMode}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] hover:border-[#D71921]/60 text-xs sm:text-sm font-semibold text-[var(--text)] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-heading)', height: '48px' }}
        >
          <UserCheck size={16} className="text-[#D71921]" />
          <span>Continue as guest</span>
        </button>
      </div>

      {/* Divider: "or use email" */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span
          className="text-xs text-[var(--muted)] lowercase"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          or use email
        </span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* Form Fields: 16px gap between fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="auth-fullname"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Full name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
                <User size={18} />
              </div>
              <input
                id="auth-fullname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ahmed Khan"
                autoComplete="name"
                className={`auth-form-input ${fieldErrors.name ? 'input-error' : ''}`}
                style={{
                  height: '52px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                }}
              />
            </div>
            {fieldErrors.name && (
              <span className="text-xs text-[#DC2626] font-medium mt-0.5">{fieldErrors.name}</span>
            )}
          </div>
        )}

        {/* Username (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="auth-signup-username"
                className="text-sm font-medium text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Username
              </label>

              {signupUsernameCheck.status === 'checking' && (
                <span className="text-[11px] font-mono text-[var(--muted)]">
                  Checking availability...
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
                  className="text-[11px] font-mono font-bold text-[#EF4444] inline-flex items-center gap-1"
                >
                  <AlertCircle size={13} />
                  <span>{signupUsernameCheck.status === 'taken' ? 'Taken' : 'Invalid'}</span>
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] font-mono font-bold text-sm pointer-events-none">
                @
              </div>
              <input
                id="auth-signup-username"
                data-testid="auth-signup-username"
                type="text"
                value={signupUsername}
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
                  height: '52px',
                  paddingLeft: '36px',
                  paddingRight: '16px',
                }}
              />
            </div>

            {fieldErrors.username ? (
              <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                {fieldErrors.username}
              </span>
            ) : (
              (signupUsernameCheck.status === 'taken' ||
                signupUsernameCheck.status === 'invalid') &&
              signupUsernameCheck.reason && (
                <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                  {signupUsernameCheck.reason}
                </span>
              )
            )}
            <span className="text-[11px] text-[var(--muted)] leading-relaxed">
              3 to 20 characters: letters, numbers, dots (<code className="font-mono">.</code>) and underscores (<code className="font-mono">_</code>) only.
            </span>
          </div>
        )}

        {/* Email (Sign Up) or Email / Username (Sign In) */}
        <div className="flex flex-col gap-2 text-left">
          <label
            htmlFor="auth-email"
            className="text-sm font-medium text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {mode === 'signin' ? 'Email or username' : 'Email'}
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              id="auth-email"
              data-testid="auth-identifier-input"
              type={mode === 'signin' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                mode === 'signin' ? 'student@example.com or username' : 'student@example.com'
              }
              autoComplete={mode === 'signin' ? 'username' : 'email'}
              className={`auth-form-input ${fieldErrors.email ? 'input-error' : ''}`}
              style={{
                height: '52px',
                paddingLeft: '44px',
                paddingRight: '16px',
              }}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-[#DC2626] font-medium mt-0.5">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Password
            </label>
            {mode === 'signin' && (
              <Link
                to="/forgot-password"
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
              <Lock size={18} />
            </div>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className={`auth-form-input ${fieldErrors.password ? 'input-error' : ''}`}
              style={{
                height: '52px',
                paddingLeft: '44px',
                paddingRight: '44px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#000000] transition-colors cursor-pointer p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-[#DC2626] font-medium mt-0.5">{fieldErrors.password}</span>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="auth-confirm-password"
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`auth-form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                style={{
                  height: '52px',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#000000] transition-colors cursor-pointer p-1"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-xs text-[#DC2626] font-medium mt-0.5">{fieldErrors.confirmPassword}</span>
            )}
          </div>
        )}

        {/* Primary Red Button: 52px tall, full width, bottom 2px line when submitting */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-red relative overflow-hidden w-full mt-2 cursor-pointer disabled:opacity-75"
          style={{ height: '52px' }}
        >
          <span>
            {loading
              ? mode === 'signin'
                ? 'Logging in...'
                : 'Creating your account...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </span>
          {loading && <ButtonLineLoader />}
        </button>

        {mode === 'signup' && (
          <p className="text-[11px] text-center text-[var(--muted)] leading-relaxed mt-2">
            By creating an account you agree to the{' '}
            <Link to="/terms" className="underline hover:text-[var(--text)]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-[var(--text)]">
              Privacy Policy
            </Link>
            .
          </p>
        )}

        {/* Mode switch link + Continue as guest */}
        <div className="pt-2 border-t border-[var(--border)] flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-[var(--muted)]">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', `/signup${window.location.search}`);
                    }
                  }}
                  className="text-[var(--text)] font-semibold hover:text-[#D71921] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', `/login${window.location.search}`);
                    }
                  }}
                  className="text-[var(--text)] font-semibold hover:text-[#D71921] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={handleStartGuestMode}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)] text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Continue as guest
          </button>
        </div>
      </form>
    </div>
  );
}
