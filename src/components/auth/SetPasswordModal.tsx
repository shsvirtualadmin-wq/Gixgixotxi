import React, { useState } from 'react';
import {
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  updatePassword,
  User,
} from 'firebase/auth';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X, ShieldCheck, Key } from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  mode: 'set' | 'change';
  onSuccess: () => void;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  mode,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSet = mode === 'set';
  const email = user.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      if (isSet) {
        // Link email/password credential to Google user
        const credential = EmailAuthProvider.credential(email, password);
        try {
          await linkWithCredential(user, credential);
        } catch (linkErr: any) {
          if (linkErr?.code === 'auth/requires-recent-login') {
            // Re-authenticate with Google first, then retry
            const googleProvider = new GoogleAuthProvider();
            googleProvider.setCustomParameters({ prompt: 'select_account' });
            await reauthenticateWithPopup(user, googleProvider);
            await linkWithCredential(user, credential);
          } else {
            throw linkErr;
          }
        }
        setSuccessMsg('Password set. You can now log in with email and password');
      } else {
        // Change existing password
        try {
          await updatePassword(user, password);
        } catch (updateErr: any) {
          if (updateErr?.code === 'auth/requires-recent-login') {
            const googleProvider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, googleProvider);
            await updatePassword(user, password);
          } else {
            throw updateErr;
          }
        }
        setSuccessMsg('Password changed successfully.');
      }

      onSuccess();
      setTimeout(() => {
        onClose();
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      console.error('[SetPassword error]:', err);
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please use at least 8 characters with a mix of letters and numbers.');
      } else if (code === 'auth/credential-already-in-use') {
        setErrorMsg('This email credential is already associated with another account.');
      } else if (code === 'auth/requires-recent-login') {
        setErrorMsg('Recent sign-in required. Please log in again to update your password.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Pop-up was blocked. Please enable pop-ups in your browser to verify your Google login.');
      } else {
        setErrorMsg(err?.message || 'Failed to set password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0d1b3e] tracking-tight">
              {isSet ? 'Set Account Password' : 'Change Password'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {email}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          {isSet
            ? 'Set a password for your account so you can log in using either Google or your email and password on any device.'
            : 'Enter your new password below. It must be at least 8 characters long.'}
        </p>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isSet ? 'New Password' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                disabled={loading || Boolean(successMsg)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Strength hint: minimum 8 characters (letters, numbers recommended)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
                disabled={loading || Boolean(successMsg)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(successMsg) || !password || password.length < 8}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isSet ? 'Set Password' : 'Change Password'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
