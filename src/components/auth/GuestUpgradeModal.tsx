import React, { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { Logo } from '@/components/ui/Logo';

export interface GuestUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgraded?: () => void;
  defaultReason?: string;
}

export const GuestUpgradeModal: React.FC<GuestUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgraded,
}) => {
  const {
    user,
    profile,
    upgradeGuestWithEmail,
    upgradeGuestWithGoogle,
    signOutUser,
  } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || profile?.username || ''
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingConflict, setExistingConflict] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const guestUsername = profile?.username || user?.displayName || 'guest';

  const handleGoogleUpgrade = async () => {
    setErrorMsg(null);
    setExistingConflict(false);
    setGoogleLoading(true);
    try {
      const res = await upgradeGuestWithGoogle();
      if (res.ok) {
        setSuccessMsg('Account upgraded! Your username, progress, attempts, and stats have been preserved.');
        setTimeout(() => {
          onClose();
          onUpgraded?.();
        }, 900);
      } else {
        setErrorMsg(res.error || 'Could not upgrade account with Google.');
        if (res.existingAccountConflict) {
          setExistingConflict(true);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google upgrade failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailUpgrade = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExistingConflict(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await upgradeGuestWithEmail(
        cleanEmail,
        password,
        displayName.trim() || guestUsername
      );
      if (res.ok) {
        setSuccessMsg('Account upgraded! Your username, progress, attempts, and stats have been preserved.');
        setTimeout(() => {
          onClose();
          onUpgraded?.();
        }, 900);
      } else {
        setErrorMsg(res.error || 'Could not upgrade guest account.');
        if (res.existingAccountConflict) {
          setExistingConflict(true);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upgrade guest account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = async () => {
    onClose();
    await signOutUser();
    const redirect = `${window.location.pathname}${window.location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  const content = (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-upgrade-title"
    >
      <div
        onClick={() => !loading && !googleLoading && onClose()}
        className="fixed inset-0 z-0 bg-black/55 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 text-left shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading || googleLoading}
          className="absolute top-4 right-4 w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="space-y-1.5">
          <Logo size="md" />
          <h2
            id="guest-upgrade-title"
            className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight pt-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Create your account
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            Upgrade your guest account (<strong className="text-[var(--text)] font-mono">@{guestUsername}</strong>) in place. Your username, progress, attempts, and stats carry over automatically.
          </p>
        </div>

        {successMsg ? (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3 text-xs sm:text-sm text-emerald-400 font-medium">
            <CheckCircle2 size={20} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#260B0B] border border-[#EF4444] space-y-2.5 text-xs text-white">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-[#FEE2E2]">{errorMsg}</span>
                </div>
                {existingConflict && (
                  <div className="pt-2 border-t border-[#EF4444]/30 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#FCA5A5]">
                      Already have an account with those credentials?
                    </span>
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="px-3 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <LogIn size={13} />
                      <span>Log in instead</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleUpgrade}
              disabled={googleLoading || loading}
              className="auth-google-btn relative overflow-hidden w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
              <span>{googleLoading ? 'Linking Google account...' : 'Continue with Google'}</span>
              {googleLoading && <ButtonLineLoader />}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-[var(--border)]" />
              <span className="text-xs text-[var(--muted)] lowercase">or use email &amp; password</span>
              <div className="flex-1 border-t border-[var(--border)]" />
            </div>

            <form onSubmit={handleEmailUpgrade} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] block">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={guestUsername}
                    className="auth-form-input"
                    style={{ height: '46px', paddingLeft: '40px', paddingRight: '14px' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] block">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="auth-form-input"
                    style={{ height: '46px', paddingLeft: '40px', paddingRight: '14px' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151] pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="auth-form-input"
                    style={{ height: '46px', paddingLeft: '40px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-black p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="btn-red relative overflow-hidden w-full cursor-pointer disabled:opacity-70"
                style={{ height: '48px' }}
              >
                <span>{loading ? 'Upgrading account...' : 'Create account'}</span>
                {loading && <ButtonLineLoader />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default GuestUpgradeModal;
