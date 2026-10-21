import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/hooks/useTheme';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { RoleBadge } from '@/components/ui/RoleBadge';
import {
  checkUsernameAvailability,
  saveProfileIdentity,
  type UsernameCheckResult,
} from '@/services/userService';
import {
  validateNickname,
  validateUsernameFormat,
  isForbiddenAdminRole,
} from '@/utils/usernameValidation';
import {
  updatePassword,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  User,
  Shield,
  CreditCard,
  Lock,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  Sliders,
  Sparkles,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, signOutUser } = useAuth();
  const { profile, loading: profileLoading, updateProfileData } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();

  // ── Profile Identity State ────────────────────────────────────────────────
  const [roleOption, setRoleOption] = useState<string>('Student');
  const [customRoleText, setCustomRoleText] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  const [usernameStatus, setUsernameStatus] = useState<UsernameCheckResult | null>(null);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [savingIdentity, setSavingIdentity] = useState<boolean>(false);
  const [identitySuccess, setIdentitySuccess] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Sync profile when loaded
  useEffect(() => {
    if (profile) {
      if (profile.role) {
        const lower = profile.role.toLowerCase();
        if (lower === 'teacher') setRoleOption('Teacher');
        else if (lower === 'parent') setRoleOption('Parent');
        else if (lower === 'other') {
          setRoleOption('Other');
          setCustomRoleText(profile.customRole || '');
        } else {
          setRoleOption('Student');
        }
      }
      setNickname(profile.nickname || profile.displayName || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  // Live username availability debounce check (350ms)
  const usernameCheckSeq = useRef(0);
  useEffect(() => {
    if (!username || username.trim() === '') {
      setUsernameStatus(null);
      setCheckingUsername(false);
      return;
    }

    const clean = username.trim().toLowerCase();
    const formatCheck = validateUsernameFormat(clean);
    if (!formatCheck.valid) {
      setUsernameStatus({
        available: false,
        reason: formatCheck.error || 'Invalid username format',
      });
      setCheckingUsername(false);
      return;
    }

    // If matches user's current saved username
    if (profile?.username && clean === profile.username.toLowerCase()) {
      setUsernameStatus({ available: true });
      setCheckingUsername(false);
      return;
    }

    const seq = ++usernameCheckSeq.current;
    setCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(clean, user?.uid);
        if (seq === usernameCheckSeq.current) {
          setUsernameStatus(res);
          setCheckingUsername(false);
        }
      } catch (err) {
        if (seq === usernameCheckSeq.current) {
          setUsernameStatus({ available: false, reason: 'Error checking username' });
          setCheckingUsername(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, user?.uid, profile?.username]);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSavingIdentity(true);
    setIdentityError(null);
    setIdentitySuccess(null);

    // Validate Nickname
    const nickVal = validateNickname(nickname);
    if (!nickVal.valid) {
      setIdentityError(nickVal.error || 'Invalid nickname.');
      setSavingIdentity(false);
      return;
    }

    // Validate Role
    let finalRole = roleOption.toLowerCase();
    let finalCustomRole: string | undefined = undefined;

    if (roleOption === 'Other') {
      if (!customRoleText.trim()) {
        setIdentityError('Please specify your custom role.');
        setSavingIdentity(false);
        return;
      }
      if (isForbiddenAdminRole(customRoleText)) {
        setIdentityError('This role title is reserved for platform staff.');
        setSavingIdentity(false);
        return;
      }
      finalCustomRole = customRoleText.trim().slice(0, 30);
    }

    // Validate Username if entered
    let cleanUsername = username.trim().toLowerCase();
    if (cleanUsername) {
      const uVal = validateUsernameFormat(cleanUsername);
      if (!uVal.valid) {
        setIdentityError(uVal.error || 'Invalid username format.');
        setSavingIdentity(false);
        return;
      }
      if (usernameStatus && !usernameStatus.available && cleanUsername !== (profile?.username || '').toLowerCase()) {
        setIdentityError(usernameStatus.reason || 'Username is not available.');
        setSavingIdentity(false);
        return;
      }
    } else {
      cleanUsername = '';
    }

    try {
      await saveProfileIdentity({
        uid: user.uid,
        nickname: nickname.trim(),
        username: cleanUsername,
        role: finalRole,
        customRole: finalCustomRole,
      });

      // Update local profile hook state
      await updateProfileData({
        displayName: nickname.trim(),
      });

      setIdentitySuccess('Profile identity saved successfully.');
      setTimeout(() => setIdentitySuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save identity.';
      setIdentityError(msg);
    } finally {
      setSavingIdentity(false);
    }
  };

  // ── Account & Password Management State ──────────────────────────────────
  const isGoogleUser = useMemo(() => {
    return user?.providerData?.some((p) => p.providerId === 'google.com');
  }, [user]);

  const hasPasswordProvider = useMemo(() => {
    return user?.providerData?.some((p) => p.providerId === 'password');
  }, [user]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      if (hasPasswordProvider) {
        // Change existing password
        await updatePassword(user, newPassword);
        setPasswordSuccess('Password updated successfully.');
      } else {
        // Link password credential for Google user
        const credential = EmailAuthProvider.credential(user.email, newPassword);
        await linkWithCredential(user, credential);
        setPasswordSuccess('Password linked successfully! You can now sign in with email or Google.');
      }
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. You may need to sign in again first.';
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset email.';
      setPasswordError(msg);
    }
  };

  // ── Sign Out Confirmation State ──────────────────────────────────────────
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleConfirmSignOut = async () => {
    setShowSignOutModal(false);
    await signOutUser();
    navigate('/login');
  };

  // Superadmin privileges
  const isSuperAdmin = Boolean(
    isAdmin ||
    effectivePlan.isSuperAdmin ||
    (user && user.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2')
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8 px-4 space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Manage your role, identity, plan, preferences, and account security.
        </p>
      </div>

      {/* ── Section A: Profile Identity ── */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <User size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-primary">
            Profile Identity
          </h2>
        </div>

        <form onSubmit={handleSaveIdentity} className="space-y-4">
          {/* Role Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary block">
              Role
            </label>
            <select
              value={roleOption}
              onChange={(e) => setRoleOption(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          {/* Custom Role Input (if Other) */}
          {roleOption === 'Other' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary block">
                Custom Role Title
              </label>
              <input
                type="text"
                value={customRoleText}
                onChange={(e) => setCustomRoleText(e.target.value)}
                maxLength={30}
                placeholder="e.g. Researcher, Mentor, Alumni"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Nickname / Display Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-secondary block">
                Nickname / Display Name
              </label>
              <span className="text-[11px] text-muted">{nickname.length}/40</span>
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="e.g. Akira, Sarah, Hamza"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent"
            />
            <p className="text-[11px] text-muted">
              Shown across your profile, Commons posts, and comments.
            </p>
          </div>

          {/* Username with Live Availability Check */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-secondary block">
                Username
              </label>
              {checkingUsername ? (
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Checking...
                </span>
              ) : usernameStatus ? (
                usernameStatus.available ? (
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Available
                  </span>
                ) : (
                  <span className="text-[11px] text-accent font-semibold flex items-center gap-1">
                    <AlertCircle size={11} /> {usernameStatus.reason || 'Unavailable'}
                  </span>
                )
              ) : null}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted text-sm font-mono select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                }
                maxLength={30}
                placeholder="username"
                className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-[11px] text-muted">
              Unique handle (3-30 letters, numbers, underscores, and dots).
            </p>
          </div>

          {/* Feedback messages */}
          {identityError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-accent text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{identityError}</span>
            </div>
          )}

          {identitySuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{identitySuccess}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingIdentity}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {savingIdentity ? 'Saving...' : 'Save Identity'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Section B: Plan ── */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <Sparkles size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-primary">
            Plan & Subscription
          </h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-muted border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-primary">
                {effectivePlan.isUnlimited ? 'Unlimited' : 'Free'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-xs text-muted">
              {effectivePlan.isUnlimited
                ? effectivePlan.source === 'crew'
                  ? `Unlimited member with ${effectivePlan.crewName || 'Study Squad'}`
                  : 'Full unlimited access across all question banks and simulations.'
                : 'Free tier with daily limits on mock tests and practice sprints.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/plans')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              effectivePlan.isUnlimited
                ? 'bg-surface hover:bg-surface-raised border border-border text-primary'
                : 'bg-accent hover:bg-accent-hover text-on-accent shadow-xs'
            }`}
          >
            {effectivePlan.isUnlimited ? 'Manage Subscription' : 'Upgrade Plan'}
          </button>
        </div>
      </section>

      {/* ── Section C: Account & Sign-In ── */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <Lock size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-primary">
            Account & Sign-In
          </h2>
        </div>

        {/* Read-Only Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-secondary block">
            Email Address
          </label>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-muted border border-border text-sm text-secondary">
            <Lock size={14} className="text-muted shrink-0" />
            <span className="truncate">{user?.email || 'No email associated'}</span>
          </div>
          <p className="text-[11px] text-muted">
            Your email is private and never shown on your profile or in Commons.
          </p>
        </div>

        {/* Sign-in Methods Line */}
        <div className="p-3 rounded-xl bg-surface-muted/50 border border-border flex items-center justify-between text-xs text-muted">
          <span>Sign-in methods:</span>
          <span className="font-medium text-secondary">
            {isGoogleUser && hasPasswordProvider
              ? 'Google + Email/Password'
              : isGoogleUser
              ? 'Google Sign-In'
              : 'Email & Password'}
          </span>
        </div>

        {/* Password Management */}
        <div className="pt-2 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">
                {hasPasswordProvider ? 'Change Password' : 'Set Password'}
              </h3>
              <p className="text-xs text-muted">
                {hasPasswordProvider
                  ? 'Update your password for email sign-in.'
                  : 'Add a password so you can also sign in with email directly.'}
              </p>
            </div>

            {hasPasswordProvider && (
              <button
                type="button"
                onClick={handleSendResetEmail}
                className="text-xs text-accent hover:underline font-semibold cursor-pointer"
              >
                {resetEmailSent ? 'Reset link sent!' : 'Forgot password?'}
              </button>
            )}
          </div>

          <form onSubmit={handleSetPassword} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={hasPasswordProvider ? 'New password (min. 6 chars)' : 'Set password (min. 6 chars)'}
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted hover:text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-border text-sm text-primary focus:outline-none focus:border-accent"
            />

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-accent text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPassword || !newPassword}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-raised border border-border text-primary text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? 'Saving...' : hasPasswordProvider ? 'Update Password' : 'Set Password'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Section D: Appearance ── */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          {resolvedTheme === 'dark' ? (
            <Moon size={18} className="text-accent" />
          ) : (
            <Sun size={18} className="text-accent" />
          )}
          <h2 className="text-base font-semibold text-primary">
            Appearance
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Theme</p>
            <p className="text-xs text-muted">
              {themeSetting === 'system'
                ? `System sync (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
                : resolvedTheme === 'dark'
                ? 'Dark Mode'
                : 'Light Mode'}
            </p>
          </div>

          <div
            className="flex items-center p-1 rounded-xl bg-surface-muted border border-border select-none"
            role="radiogroup"
            aria-label="Theme selection"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                themeSetting === 'light'
                  ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                  : 'text-muted hover:text-primary border border-transparent'
              }`}
              aria-checked={themeSetting === 'light'}
              role="radio"
            >
              <Sun size={13} strokeWidth={2} />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                themeSetting === 'dark'
                  ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                  : 'text-muted hover:text-primary border border-transparent'
              }`}
              aria-checked={themeSetting === 'dark'}
              role="radio"
            >
              <Moon size={13} strokeWidth={2} />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                themeSetting === 'system'
                  ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                  : 'text-muted hover:text-primary border border-transparent'
              }`}
              aria-checked={themeSetting === 'system'}
              role="radio"
            >
              <Monitor size={13} strokeWidth={2} />
              <span>System</span>
            </button>
          </div>
        </div>
      </section>



      {/* ── Section E: Sign Out ── */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs">
        <button
          type="button"
          onClick={() => setShowSignOutModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 text-accent hover:bg-accent-soft rounded-xl font-medium text-sm transition-colors cursor-pointer select-none"
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </section>

      {/* ── Sign Out Confirmation Modal ── */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5 text-primary">
              <AlertCircle size={20} className="text-accent shrink-0" />
              <h3 className="text-base font-bold">Sign out of Boardly?</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              You will be returned to the login screen. Your progress and preferences remain securely saved.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-muted border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-on-accent transition-colors cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
