import React from 'react';
import { AlertTriangle, UserPlus, LogOut, X } from 'lucide-react';

interface GuestLogoutConfirmModalProps {
  isOpen: boolean;
  username?: string | null;
  loading?: boolean;
  onCancel: () => void;
  onCreateAccount: () => void;
  onConfirmLogout: () => void;
}

export const GuestLogoutConfirmModal: React.FC<GuestLogoutConfirmModalProps> = ({
  isOpen,
  username,
  loading = false,
  onCancel,
  onCreateAccount,
  onConfirmLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-logout-confirm-title"
      data-testid="guest-logout-confirm-modal"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121214] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="guest-logout-confirm-title"
              className="text-base sm:text-lg font-bold tracking-tight text-white"
            >
              Log out of guest account?
            </h2>
            {username && (
              <p className="text-xs font-mono text-white/55">@{username}</p>
            )}
          </div>
        </div>

        <p
          data-testid="guest-logout-warning-text"
          className="text-sm sm:text-[15px] text-white/90 leading-relaxed mb-6 break-words"
        >
          If you sign out without connecting an email, your progress won&apos;t be saved, this account will be deleted, and you can&apos;t log in again.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-testid="guest-logout-create-account-btn"
            disabled={loading}
            onClick={onCreateAccount}
            className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white font-semibold text-sm flex items-center justify-center gap-2 text-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Connect email / Create account</span>
          </button>

          <button
            type="button"
            data-testid="guest-logout-confirm-btn"
            disabled={loading}
            onClick={onConfirmLogout}
            className="w-full min-h-[46px] py-3 px-4 rounded-xl border border-white/20 bg-white/[0.07] hover:bg-white/[0.12] text-white font-semibold text-sm flex items-center justify-center gap-2 text-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{loading ? 'Signing out...' : 'Sign out anyway'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
