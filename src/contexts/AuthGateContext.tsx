import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { X, Lock, Mail, UserPlus, UserCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Logo } from '@/components/ui/Logo';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { validateUsernameFormat } from '@/utils/usernameValidation';

interface AuthGateContextValue {
  /**
   * Checks if the user is signed in.
   * - If signed in: immediately runs `onAuthorized()` (if provided) and returns `true`.
   * - If signed out: opens the floating glass "Sign in to continue" modal with a clear reason
   *   and remembers the current URL so the user returns right after login, returning `false`.
   */
  requireAuth: (actionLabel: string, onAuthorized?: () => void, customRedirectPath?: string) => boolean;
  openSignInModal: (actionLabel?: string, customRedirectPath?: string) => void;
  closeSignInModal: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export const AuthGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signInWithGoogle, signInAsGuest, checkUsernameAvailability } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'options' | 'guest'>('options');
  const [actionLabel, setActionLabel] = useState('continue');
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pendingCallbackRef = useRef<(() => void) | undefined>(undefined);

  // Guest username state inside modal
  const [guestUsername, setGuestUsername] = useState('');
  const [guestCheck, setGuestCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    reason?: string;
  }>({ status: 'idle' });
  const [guestBusy, setGuestBusy] = useState(false);

  const openSignInModal = useCallback(
    (label = 'continue', customRedirect?: string) => {
      const targetUrl = customRedirect || `${location.pathname}${location.search}${location.hash}`;
      setActionLabel(label);
      setRedirectPath(targetUrl);
      setStep('options');
      setGuestUsername('');
      setGuestCheck({ status: 'idle' });
      setErrorMsg(null);
      try {
        sessionStorage.setItem('boardly_post_login_redirect', targetUrl);
      } catch {
        // ignore storage errors
      }
      setIsOpen(true);
    },
    [location.pathname, location.search, location.hash]
  );

  const closeSignInModal = useCallback(() => {
    setIsOpen(false);
    setStep('options');
    setErrorMsg(null);
    pendingCallbackRef.current = undefined;
  }, []);

  // Ensure the sign-in modal never stays mounted over a newly navigated route
  useEffect(() => {
    setIsOpen(false);
    setStep('options');
    setErrorMsg(null);
  }, [location.pathname]);

  const requireAuth = useCallback(
    (label: string, onAuthorized?: () => void, customRedirect?: string): boolean => {
      if (user) {
        if (onAuthorized) onAuthorized();
        return true;
      }
      pendingCallbackRef.current = onAuthorized;
      openSignInModal(label, customRedirect);
      return false;
    },
    [user, openSignInModal]
  );

  // Live username availability check inside AuthGate modal
  useEffect(() => {
    if (!isOpen || step !== 'guest') return;
    const raw = guestUsername.trim().replace(/^@+/, '');
    if (!raw) {
      setGuestCheck({ status: 'idle' });
      return;
    }
    const localValidation = validateUsernameFormat(raw);
    if (!localValidation.valid) {
      setGuestCheck({
        status: 'invalid',
        reason: localValidation.reason || 'Invalid username format.',
      });
      return;
    }

    let cancelled = false;
    setGuestCheck({ status: 'checking' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(raw);
      if (cancelled) return;
      if (res.available) {
        setGuestCheck({ status: 'available' });
      } else {
        setGuestCheck({
          status: 'taken',
          reason: res.reason || 'That username is already taken.',
        });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [guestUsername, isOpen, step, checkUsernameAvailability]);

  const finishAuthSuccess = useCallback(() => {
    setIsOpen(false);
    setStep('options');
    try {
      sessionStorage.removeItem('boardly_post_login_redirect');
    } catch {
      // ignore
    }
    const cb = pendingCallbackRef.current;
    pendingCallbackRef.current = undefined;
    if (cb) {
      cb();
    } else if (
      redirectPath &&
      redirectPath !== `${location.pathname}${location.search}${location.hash}`
    ) {
      navigate(redirectPath);
    }
  }, [redirectPath, location.pathname, location.search, location.hash, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setErrorMsg(null);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        finishAuthSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not sign in with Google. Please try again.';
      if (!msg.toLowerCase().includes('popup-closed')) {
        setErrorMsg(msg);
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGuestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const raw = guestUsername.trim().replace(/^@+/, '');
    const localValidation = validateUsernameFormat(raw);
    if (!localValidation.valid) {
      setGuestCheck({
        status: 'invalid',
        reason: localValidation.reason || 'Please enter a valid username.',
      });
      return;
    }

    setGuestBusy(true);
    try {
      const res: any = await signInAsGuest(raw);
      if (res && res.ok === false) {
        setGuestCheck({
          status: 'taken',
          reason: res.error || 'Could not claim that username.',
        });
        setErrorMsg(res.error || 'Could not start guest session.');
        return;
      }
      finishAuthSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start guest session.';
      setGuestCheck({
        status: 'taken',
        reason: msg,
      });
      setErrorMsg(msg);
    } finally {
      setGuestBusy(false);
    }
  };

  const currentRedirect = redirectPath || `${location.pathname}${location.search}${location.hash}`;
  const encodedRedirect = encodeURIComponent(currentRedirect);

  const canSubmitGuest =
    !guestBusy &&
    guestUsername.trim().replace(/^@+/, '').length >= 3 &&
    guestCheck.status !== 'invalid' &&
    guestCheck.status !== 'taken' &&
    guestCheck.status !== 'checking';

  return (
    <AuthGateContext.Provider value={{ requireAuth, openSignInModal, closeSignInModal }}>
      {children}

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
          >
            <div
              onClick={closeSignInModal}
              className="fixed inset-0 z-0 bg-black/30 backdrop-blur-sm glass-backdrop cursor-pointer"
              aria-hidden="true"
            />
            <div
              className="glass glass-panel relative z-10 w-full max-w-md rounded-[28px] p-6 sm:p-8 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeSignInModal}
                className="absolute top-4 right-4 w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Close sign in prompt"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#D71921]/15 border border-[#D71921]/35 flex items-center justify-center text-[#D71921]">
                  <Lock size={18} />
                </div>
                <Logo size="md" />
              </div>

              {step === 'guest' ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('options');
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <div>
                    <h2
                      id="auth-gate-title"
                      className="font-dot text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1.5"
                    >
                      Continue as guest
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      Pick a unique username to <span className="text-[var(--text-primary)] font-semibold">{actionLabel}</span> and return right to this page.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-[#D71921]/15 border border-[#D71921]/40 text-xs text-[var(--text-primary)]">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleGuestSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="authgate-guest-username"
                          className="text-xs font-semibold text-[var(--text-primary)]"
                        >
                          Username
                        </label>
                        {guestCheck.status === 'checking' && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            Checking...
                          </span>
                        )}
                        {guestCheck.status === 'available' && (
                          <span className="text-[11px] font-mono font-bold text-emerald-500 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Available</span>
                          </span>
                        )}
                        {(guestCheck.status === 'taken' || guestCheck.status === 'invalid') && (
                          <span className="text-[11px] font-mono font-bold text-[#EF4444] inline-flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>{guestCheck.status === 'taken' ? 'Taken' : 'Invalid'}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono font-bold text-sm">
                          @
                        </span>
                        <input
                          id="authgate-guest-username"
                          type="text"
                          value={guestUsername}
                          onChange={(e) => setGuestUsername(e.target.value.replace(/^@+/, ''))}
                          placeholder="ahmed_khan99"
                          maxLength={20}
                          autoFocus
                          autoComplete="off"
                          className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D71921]"
                        />
                      </div>

                      {(guestCheck.status === 'taken' || guestCheck.status === 'invalid') &&
                        guestCheck.reason && (
                          <p className="text-xs text-[#EF4444] font-medium">
                            {guestCheck.reason}
                          </p>
                        )}
                      <p className="text-[11px] text-[var(--text-muted)]">
                        3–20 characters: letters, numbers, dots (<code className="font-mono">.</code>), underscores (<code className="font-mono">_</code>).
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
                      You&apos;ll stay signed in on this device.
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      By continuing you agree to our{' '}
                      <Link
                        to="/terms"
                        onClick={closeSignInModal}
                        className="underline text-[var(--text-primary)] hover:text-[#D71921]"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        onClick={closeSignInModal}
                        className="underline text-[var(--text-primary)] hover:text-[#D71921]"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <button
                      type="submit"
                      disabled={!canSubmitGuest}
                      className="btn-primary relative overflow-hidden w-full py-3 px-4 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      <span>{guestBusy ? 'Starting guest session...' : 'Continue as guest'}</span>
                      {guestBusy && <ButtonLineLoader />}
                    </button>

                    <p
                      data-testid="authgate-guest-temporary-notice"
                      className="text-[11px] text-[var(--text-muted)] leading-relaxed"
                    >
                      Guest accounts are temporary. If you log out or clear your browser data, you can&apos;t get back into this account. Create a free account to keep your progress and use rewards and Pro.
                    </p>
                  </form>
                </div>
              ) : (
                <>
                  <h2
                    id="auth-gate-title"
                    className="font-dot text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2"
                  >
                    Sign in to continue
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    Sign in or continue as a guest to <span className="text-[var(--text-primary)] font-semibold">{actionLabel}</span>. You will stay right on this page.
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-[#D71921]/15 border border-[#D71921]/40 text-xs text-[var(--text-primary)]">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleBusy}
                      className="relative overflow-hidden w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-black border border-black/15 font-semibold text-sm hover:bg-neutral-100 transition-all cursor-pointer disabled:opacity-75 shadow-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{googleBusy ? 'Logging in...' : 'Continue with Google'}</span>
                      {googleBusy && <ButtonLineLoader />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('guest');
                        setErrorMsg(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[#D71921]/60 text-[var(--text-primary)] font-semibold text-sm transition-all cursor-pointer"
                    >
                      <UserCheck size={16} className="text-[#D71921]" />
                      <span>Continue as guest</span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <Link
                        to={`/login?redirect=${encodedRedirect}`}
                        onClick={closeSignInModal}
                        className="btn-secondary w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold"
                      >
                        <Mail size={15} />
                        <span>Sign In</span>
                      </Link>

                      <Link
                        to={`/signup?redirect=${encodedRedirect}`}
                        onClick={closeSignInModal}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold"
                      >
                        <UserPlus size={15} />
                        <span>Create account</span>
                      </Link>
                    </div>

                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={closeSignInModal}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </AuthGateContext.Provider>
  );
};

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error('useAuthGate must be used within an AuthGateProvider');
  }
  return ctx;
}
