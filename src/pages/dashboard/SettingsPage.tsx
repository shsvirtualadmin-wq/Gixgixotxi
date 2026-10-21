import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  ArrowLeft,
  CreditCard,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  X,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOutUser } = useAuth();
  const { profile, updateProfileData } = useUserProfile();
  const effectivePlan = useEffectivePlan();

  // ── Display Name Edit State ──────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // ── Sign Out Confirmation State ──────────────────────────────────────────
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Current Plan determination
  // The superadmin also sees "Unlimited", per requirements
  const isUnlimited = Boolean(effectivePlan.isUnlimited || effectivePlan.isSuperAdmin);
  const planName = isUnlimited ? 'Unlimited' : 'Free';

  // Open Name Edit Modal
  const handleOpenNameEdit = () => {
    setNameInput(profile?.displayName || user?.displayName || '');
    setNameError(null);
    setNameSuccess(null);
    setIsEditingName(true);
  };

  // Save Display Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length > 40) {
      setNameError('Display name must be 40 characters or fewer.');
      return;
    }

    setSavingName(true);
    setNameError(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      await updateProfileData({ displayName: trimmed });
      setNameSuccess('Display name updated successfully.');
      setTimeout(() => {
        setIsEditingName(false);
        setNameSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update display name.';
      setNameError(msg);
    } finally {
      setSavingName(false);
    }
  };

  // Sign out confirmation handler
  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[SettingsPage] Sign out failed:', err);
      setSigningOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const accountEmail = user?.email || profile?.email || 'No email attached';
  const currentDisplayName = profile?.displayName || user?.displayName || 'Student';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      {/* ── Top Bar with Back Button to Profile ─────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => navigate('/dashboard/profile')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-[var(--card)]"
          title="Back to profile"
        >
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </button>

        <h1
          className="text-lg sm:text-xl font-bold text-[var(--text)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Settings
        </h1>
        <div className="w-16 sm:w-24" aria-hidden="true" />
      </div>

      {/* ── Section A: Plan ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          <CreditCard size={16} className="text-[var(--accent)]" />
          <span>Plan & Subscription</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-[var(--text)] font-heading">
                {planName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {isUnlimited
                ? 'Full access to all university question banks, sprints, and full mocks.'
                : 'Free tier with daily practice allowances. Upgrade anytime for unlimited access.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/plans')}
            className="h-10 px-4 rounded-xl text-xs font-semibold bg-[var(--card-2)] hover:bg-[var(--card)] border border-[var(--border)] text-[var(--text)] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* ── Section B: Account ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          <User size={16} className="text-[var(--accent)]" />
          <span>Account</span>
        </div>

        <div className="space-y-4 pt-1">
          {/* Read-only email */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)] font-medium block">
              Account Email
            </label>
            <div className="text-sm font-normal text-[var(--text)] break-all select-all py-1">
              {accountEmail}
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Your email is private and never shown on your profile or in Commons.
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-[var(--muted)] font-medium block">Display Name</span>
              <span className="text-sm font-semibold text-[var(--text)] font-heading">
                {currentDisplayName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenNameEdit}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-[var(--card-2)] hover:bg-[var(--card)] border border-[var(--border)] text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Edit3 size={13} />
              <span>Change Display Name</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section C: Sign Out ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full px-5 py-4 flex items-center justify-between text-left text-red-500 hover:bg-red-500/10 active:bg-red-500/15 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} className="text-red-500" />
            <span className="text-sm font-semibold font-heading">Sign Out</span>
          </div>
          <span className="text-xs text-red-400 font-medium">Leave this session</span>
        </button>
      </div>

      {/* ── Change Display Name Modal ───────────────────────────────────── */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)] font-heading">
                Change Display Name
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
                  New Display Name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              {nameError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}

              {nameSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{nameSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={savingName}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingName}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--red)] hover:bg-[var(--red-dark)] text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {savingName && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ─────────────────────────────────── */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <LogOut size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text)] font-heading">
                Sign out of Boardly?
              </h3>
              <p className="text-xs text-[var(--muted)]">
                You will need to sign in again to access your study history and sprints.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={signingOut}
                className="w-full py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--red)] hover:bg-[var(--red-dark)] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {signingOut && <Loader2 size={13} className="animate-spin" />}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
