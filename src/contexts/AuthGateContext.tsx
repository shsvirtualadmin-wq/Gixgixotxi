import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { X, Mail, UserPlus, UserCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
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
  const { t } = useLanguage();
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

  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startY: number;
    lastY: number;
    lastTime: number;
    velocityY: number;
  }>({
    active: false,
    pointerId: null,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
  });

  const openSignInModal = useCallback(
    (label = 'continue', customRedirect?: string) => {
      const targetUrl = customRedirect || `${location.pathname}${location.search}${location.hash}`;
      setActionLabel((label || '').trim() || 'continue');
      setRedirectPath(targetUrl);
      setStep('options');
      setGuestUsername('');
      setGuestCheck({ status: 'idle' });
      setErrorMsg(null);
      setIsClosing(false);
      setDragY(0);
      setIsDraggingSheet(false);
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
    setIsClosing(true);
    setDragY(0);
    setIsDraggingSheet(false);
    pendingCallbackRef.current = undefined;
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setStep('options');
      setErrorMsg(null);
    }, 240);
  }, []);

  // Ensure the sign-in modal never stays mounted over a newly navigated route
  useEffect(() => {
    setIsOpen(false);
    setIsClosing(false);
    setDragY(0);
    setIsDraggingSheet(false);
    setStep('options');
    setErrorMsg(null);
  }, [location.pathname]);

  const handleGrabberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const now = performance.now();
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: now,
      velocityY: 0,
    };
    setIsDraggingSheet(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleGrabberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - ds.lastTime);
    const dyFromLast = e.clientY - ds.lastY;
    ds.velocityY = dyFromLast / dt; // px/ms
    ds.lastY = e.clientY;
    ds.lastTime = now;

    const rawDelta = e.clientY - ds.startY;
    const clampedDelta = rawDelta < 0 ? rawDelta * 0.2 : rawDelta;
    setDragY(clampedDelta);
  };

  const handleGrabberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;
    ds.active = false;
    ds.pointerId = null;
    setIsDraggingSheet(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const totalDy = e.clientY - ds.startY;
    const vy = ds.velocityY;
    // Snap closed if dragged down > 95px or flicked downward with velocity > 0.55 px/ms
    if (totalDy > 95 || vy > 0.55) {
      closeSignInModal();
    } else {
      setDragY(0);
    }
  };

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
    setIsClosing(false);
    setDragY(0);
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
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
          >
            <div
              onClick={closeSignInModal}
              className={`fixed inset-0 z-0 bg-black/55 backdrop-blur-md glass-backdrop cursor-pointer transition-opacity duration-250 ${
                isClosing ? 'opacity-0' : 'opacity-100'
              }`}
              aria-hidden="true"
            />
            <div
              className={`glass glass-panel ios-bottom-sheet relative z-10 w-full max-w-md px-6 pt-3 pb-7 sm:p-8 text-start ${
                isClosing ? 'is-closing' : ''
              }`}
              style={
                dragY !== 0 || isDraggingSheet
                  ? {
                      transform: `translate3d(0, ${dragY}px, 0)`,
                      transition: isDraggingSheet
                        ? 'none'
                        : 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }
                  : undefined
              }
              onClick={(e) => e.stopPropagation()}
            >
              {/* Draggable iOS Sheet Grabber */}
              <div
                onPointerDown={handleGrabberPointerDown}
                onPointerMove={handleGrabberPointerMove}
                onPointerUp={handleGrabberPointerUp}
                onPointerCancel={handleGrabberPointerUp}
                className="w-full py-2 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
                aria-label="Drag handle to dismiss"
              >
                <div className="ios-sheet-grabber !my-0" />
              </div>

              {/* Top Header Row: COMMONS label with red dot + circular glass close button */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.14]">
                  <span
                    className="w-2 h-2 rounded-full bg-[#D71921] shadow-[0_0_10px_#D71921]"
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-primary)]"
                    style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                  >
                    {t('nav.commons')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={closeSignInModal}
                  className="ios-circle-btn text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dot-matrix "Boardly" wordmark */}
              <div className="mb-2">
                <span
                  className="block select-none"
                  style={{
                    fontFamily: "'Doto', var(--font-dot), monospace",
                    fontWeight: 800,
                    fontSize: '28px',
                    lineHeight: 1.05,
                    letterSpacing: '0.03em',
                    color: '#D71921',
                  }}
                >
                  Boardly
                </span>
              </div>

              {step === 'guest' ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('options');
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>{t('common.back')}</span>
                  </button>

                  <div>
                    <h2
                      id="auth-gate-title"
                      className="text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight mb-1.5 font-extrabold"
                    >
                      {t('auth.continueAsGuest')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      {t('auth.guestPickUsername', { action: actionLabel })}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/40 text-xs text-[var(--text-primary)]">
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
                          {t('auth.usernameLabel')}
                        </label>
                        {guestCheck.status === 'checking' && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {t('auth.checking')}
                          </span>
                        )}
                        {guestCheck.status === 'available' && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>{t('auth.available')}</span>
                          </span>
                        )}
                        {(guestCheck.status === 'taken' || guestCheck.status === 'invalid') && (
                          <span className="text-[11px] font-mono font-bold text-[#EF4444] inline-flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>{guestCheck.status === 'taken' ? t('auth.taken') : t('auth.invalid')}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono font-bold text-sm">
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
                          dir="ltr"
                          className="w-full h-12 ps-9 pe-4 rounded-full bg-white/[0.06] border border-white/[0.18] font-mono text-sm text-[var(--text-primary)] focus:outline-none"
                        />
                      </div>

                      {(guestCheck.status === 'taken' || guestCheck.status === 'invalid') &&
                        guestCheck.reason && (
                          <p className="text-xs text-[#EF4444] font-medium">
                            {guestCheck.reason}
                          </p>
                        )}
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {t('auth.usernameRules')}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/[0.14] text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {t('auth.guestStaySignedIn')}
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {t('auth.agreePrefix')}{' '}
                      <Link
                        to="/terms"
                        onClick={closeSignInModal}
                        className="underline text-[var(--text-primary)] hover:text-[#D71921]"
                      >
                        {t('settings.termsOfService')}
                      </Link>{' '}
                      {t('auth.and')}{' '}
                      <Link
                        to="/privacy"
                        onClick={closeSignInModal}
                        className="underline text-[var(--text-primary)] hover:text-[#D71921]"
                      >
                        {t('settings.privacyPolicy')}
                      </Link>
                      .
                    </p>

                    <button
                      type="submit"
                      disabled={!canSubmitGuest}
                      className="btn-primary relative overflow-hidden w-full min-h-[52px] px-5 rounded-full text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      <span>{guestBusy ? t('auth.startingGuest') : t('auth.continueAsGuest')}</span>
                      {guestBusy && <ButtonLineLoader />}
                    </button>

                    <p
                      data-testid="authgate-guest-temporary-notice"
                      className="text-[11px] text-[var(--text-muted)] leading-relaxed"
                    >
                      {t('auth.guestTempNotice')}
                    </p>
                  </form>
                </div>
              ) : (
                <>
                  <h2
                    id="auth-gate-title"
                    className="text-2xl sm:text-[26px] text-[var(--text-primary)] tracking-tight mb-2 font-extrabold"
                  >
                    {t('auth.signInToContinue')}
                  </h2>

                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                    {t('auth.signInSubtitle', { action: actionLabel })}
                  </p>

                  {errorMsg && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/40 text-xs text-[var(--text-primary)]">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Continue with Google (white pill) */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleBusy}
                      className="auth-google-btn relative overflow-hidden w-full min-h-[52px] flex items-center justify-center gap-3 px-5 rounded-full font-semibold text-sm cursor-pointer disabled:opacity-75"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      <span>{googleBusy ? t('auth.loggingIn') : t('auth.continueWithGoogle')}</span>
                      {googleBusy && <ButtonLineLoader />}
                    </button>

                    {/* Continue as guest (glass pill) */}
                    <button
                      type="button"
                      onClick={() => {
                        setStep('guest');
                        setErrorMsg(null);
                      }}
                      className="btn-secondary w-full min-h-[52px] flex items-center justify-center gap-2.5 px-5 rounded-full text-[var(--text-primary)] font-semibold text-sm cursor-pointer"
                    >
                      <UserCheck size={16} className="text-[#D71921]" />
                      <span>{t('auth.continueAsGuest')}</span>
                    </button>

                    {/* Dotted OR divider */}
                    <div className="flex items-center gap-3 py-1.5" aria-hidden="true">
                      <div className="flex-1 dotted-divider" />
                      <span
                        className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] font-extrabold"
                      >
                        {t('common.or')}
                      </span>
                      <div className="flex-1 dotted-divider" />
                    </div>

                    {/* Sign in (glass) + Create account (red) side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/login?redirect=${encodedRedirect}`}
                        onClick={closeSignInModal}
                        className="btn-secondary w-full min-h-[50px] rounded-full flex items-center justify-center gap-2 px-4 text-sm font-semibold"
                      >
                        <Mail size={15} />
                        <span>{t('nav.signIn')}</span>
                      </Link>

                      <Link
                        to={`/signup?redirect=${encodedRedirect}`}
                        onClick={closeSignInModal}
                        className="btn-primary w-full min-h-[50px] rounded-full flex items-center justify-center gap-2 px-4 text-sm font-semibold"
                      >
                        <UserPlus size={15} />
                        <span>{t('nav.createAccount')}</span>
                      </Link>
                    </div>

                    {/* Cancel */}
                    <div className="pt-1 flex justify-center">
                      <button
                        type="button"
                        onClick={closeSignInModal}
                        className="w-full min-h-[48px] px-4 rounded-full text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        {t('common.cancel')}
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
