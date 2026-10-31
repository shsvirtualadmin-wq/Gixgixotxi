import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { X, Lock, Mail, UserPlus } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Logo } from '@/components/ui/Logo';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

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
  const { user, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState('continue');
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pendingCallbackRef = useRef<(() => void) | undefined>(undefined);

  const openSignInModal = useCallback(
    (label = 'continue', customRedirect?: string) => {
      const targetUrl = customRedirect || `${location.pathname}${location.search}${location.hash}`;
      setActionLabel(label);
      setRedirectPath(targetUrl);
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
    setErrorMsg(null);
    pendingCallbackRef.current = undefined;
  }, []);

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

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setErrorMsg(null);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        setIsOpen(false);
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = undefined;
        if (cb) {
          cb();
        } else if (redirectPath && redirectPath !== `${location.pathname}${location.search}${location.hash}`) {
          navigate(redirectPath);
        }
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

  const currentRedirect = redirectPath || `${location.pathname}${location.search}`;
  const encodedRedirect = encodeURIComponent(currentRedirect);

  return (
    <AuthGateContext.Provider value={{ requireAuth, openSignInModal, closeSignInModal }}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--overlay)] allow-backdrop-blur animate-in fade-in duration-200"
          onClick={closeSignInModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-gate-title"
        >
          <div
            className="glass-panel relative w-full max-w-md p-6 sm:p-8 border border-[var(--glass-border)] shadow-2xl text-left"
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

            <h2
              id="auth-gate-title"
              className="font-dot text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2"
            >
              Sign in to continue
            </h2>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              Sign in to <span className="text-[var(--text-primary)] font-semibold">{actionLabel}</span>. You will return right to this page after signing in.
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
                  Cancel — Continue browsing as guest
                </button>
              </div>
            </div>
          </div>
        </div>
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
