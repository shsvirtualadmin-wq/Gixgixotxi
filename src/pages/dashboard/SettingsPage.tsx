import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Sun,
  Moon,
  Check,
  Save,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Send,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatStudentId } from '@/utils/shortId';
import { wipeStudentAccount } from '@/services/userAccountService';
import { useTheme } from '@/hooks/useTheme';
import { useWallpaper, WALLPAPERS } from '@/hooks/useWallpaper';
import { WallpaperThumbnail } from '@/components/WallpaperBackground';
import {
  checkUsernameAvailability,
  saveProfileIdentity,
  sendReservedNameRequest,
  type UsernameCheckResult,
} from '@/services/userService';
import {
  validateNickname,
  validateUsernameFormat,
  isForbiddenAdminRole,
} from '@/utils/usernameValidation';
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { RoleBadge } from '@/components/ui/RoleBadge';

const PAKISTANI_UNIVERSITIES = [
  'FAST-NUCES (CS/SE/AI/DS)',
  'NUST NET (Engineering & Computing)',
  'GIKI (Top Engineering & CS)',
  'LUMS (SBASSE / SDSB)',
  'NED University Karachi',
  'MDCAT (UHS / PMDC / NUMS)',
  'ECAT Punjab (UET Lahore)',
  'PIEAS Islamabad',
  'COMSATS University',
  'Habib University',
  'IBA Karachi',
  'AKU (Aga Khan University)',
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, signOutUser } = useAuth();
  const { profile, loading: profileLoading, updateProfileData } = useUserProfile();

  const { theme, setTheme: toggleTheme } = useTheme();
  const { wallpaper: currentWallpaper, setWallpaper } = useWallpaper();

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

  // Reserved name request state
  const [sendingNameRequest, setSendingNameRequest] = useState<boolean>(false);
  const [nameRequestSuccess, setNameRequestSuccess] = useState<string | null>(null);

  // ── Academic Preferences State ────────────────────────────────────────────
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState(false);

  // ── Security State ────────────────────────────────────────────────────────
  // Provider detection
  const providerIds = useMemo(() => {
    return (user?.providerData || []).map((p) => p.providerId);
  }, [user]);

  const hasGoogle = providerIds.includes('google.com');
  const hasPassword = providerIds.includes('password');

  // Set password form (Google-only)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Change password form (when password already exists)
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  // Forgot password flow
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // ── Account Deletion & Logout ─────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Populate initial data from profile ────────────────────────────────────
  useEffect(() => {
    if (profile) {
      const initialNickname = profile.nickname || profile.displayName || user?.displayName || '';
      setNickname(initialNickname);

      const initialUsername = profile.username || '';
      setUsername(initialUsername);

      const rawRole = profile.role || 'Student';
      if (isAdmin || rawRole === 'admin' || rawRole === 'superadmin') {
        setRoleOption('Super Admin');
      } else if (rawRole === 'Teacher' || rawRole === 'Parent') {
        setRoleOption(rawRole);
      } else if (rawRole === 'Student' || rawRole === 'student') {
        setRoleOption('Student');
      } else {
        setRoleOption('Other');
        setCustomRoleText(profile.customRole || rawRole || '');
      }

      setTargetUniversity(profile.targetUniversity || '');
      setTargetTestDate(profile.targetTestDate || '');
    }
  }, [profile, user, isAdmin]);

  // ── Debounced Live Username Availability Check ────────────────────────────
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null);
      setCheckingUsername(false);
      return;
    }

    const clean = username.trim().toLowerCase();

    // If unchanged from saved profile username, it is available for current user
    if (profile?.username && clean === profile.username.toLowerCase()) {
      setUsernameStatus({ available: true, isCurrent: true });
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    checkTimerRef.current = setTimeout(async () => {
      const res = await checkUsernameAvailability(clean, user?.uid, isAdmin);
      setUsernameStatus(res);
      setCheckingUsername(false);
    }, 350);

    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, [username, profile?.username, user?.uid, isAdmin]);

  // ── Nickname validation helper ────────────────────────────────────────────
  const nicknameValidation = useMemo(() => {
    if (!nickname) return { valid: false, error: 'Nickname cannot be empty.' };
    return validateNickname(nickname, user?.uid, isAdmin);
  }, [nickname, user?.uid, isAdmin]);

  // ── Save Profile Identity ─────────────────────────────────────────────────
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIdentityError(null);
    setIdentitySuccess(null);

    // Validate nickname
    if (!nicknameValidation.valid) {
      setIdentityError(nicknameValidation.error || 'Please enter a valid nickname.');
      return;
    }

    // Validate username format
    const uVal = validateUsernameFormat(username, user.uid, isAdmin);
    if (!uVal.valid) {
      setIdentityError(uVal.error || 'Please enter a valid username.');
      return;
    }

    // Check username availability
    if (usernameStatus && !usernameStatus.available && !usernameStatus.isCurrent) {
      setIdentityError(usernameStatus.error || 'This username is not available.');
      return;
    }

    // Role check
    let finalRole = roleOption;
    let finalCustomRole: string | null = null;

    if (!isAdmin) {
      if (roleOption === 'Other') {
        const trimmedCustom = customRoleText.trim();
        if (!trimmedCustom) {
          setIdentityError('Please enter a role title for "Other".');
          return;
        }
        if (isForbiddenAdminRole(trimmedCustom)) {
          setIdentityError('You cannot assign yourself an administrative role.');
          return;
        }
        finalRole = 'Other';
        finalCustomRole = trimmedCustom.slice(0, 20);
      } else if (isForbiddenAdminRole(roleOption)) {
        setIdentityError('You cannot assign yourself an administrative role.');
        return;
      }
    } else {
      finalRole = 'superadmin';
    }

    setSavingIdentity(true);
    try {
      const result = await saveProfileIdentity(
        user.uid,
        {
          role: finalRole,
          customRole: finalCustomRole,
          nickname: nickname.trim(),
          username: username.trim().toLowerCase(),
          previousUsername: profile?.username || null,
        },
        isAdmin
      );

      if (!result.success) {
        setIdentityError(result.error || 'Failed to save identity.');
      } else {
        setIdentitySuccess('Profile identity saved successfully!');
        setTimeout(() => setIdentitySuccess(null), 3500);
      }
    } catch (err: any) {
      console.error('[SettingsPage] Error saving identity:', err);
      setIdentityError(err?.message || 'An error occurred while saving profile identity.');
    } finally {
      setSavingIdentity(false);
    }
  };

  // ── Send Reserved Name Request ────────────────────────────────────────────
  const handleSendReservedNameRequest = async () => {
    if (!user || !username.trim()) return;
    setSendingNameRequest(true);
    setNameRequestSuccess(null);
    setIdentityError(null);

    try {
      const res = await sendReservedNameRequest(
        user.uid,
        username.trim().toLowerCase(),
        user.email,
        nickname
      );

      if (res.success) {
        setNameRequestSuccess(
          `Request for "${username.trim().toLowerCase()}" submitted to Super Admin for approval.`
        );
      } else {
        setIdentityError(res.error || 'Failed to submit name request.');
      }
    } catch (err: any) {
      setIdentityError(err?.message || 'Failed to submit request.');
    } finally {
      setSendingNameRequest(false);
    }
  };

  // ── Save Academic Preferences ─────────────────────────────────────────────
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPreferences(true);
    setPreferencesSuccess(false);

    try {
      await updateProfileData({
        targetUniversity: targetUniversity.trim() || undefined,
        targetTestDate: targetTestDate.trim() || undefined,
      });
      setPreferencesSuccess(true);
      setTimeout(() => setPreferencesSuccess(false), 3000);
    } catch (err) {
      console.error('[SettingsPage] Error saving preferences:', err);
    } finally {
      setSavingPreferences(false);
    }
  };

  // ── Set Password for Google-Only Account ───────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    // Password strength hint: minimum 8 characters, at least one letter and one number
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setPasswordError('Password must contain at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setSettingPassword(true);
    const credential = EmailAuthProvider.credential(user.email, newPassword);

    try {
      await linkWithCredential(user, credential);
      await user.reload();
      setPasswordSuccess(
        'Password set successfully! You can now sign in with either Google or your email and password.'
      );
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.warn('[SettingsPage] linkWithCredential error:', err);

      // If sensitive change requires recent login, re-authenticate with Google first
      if (
        err.code === 'auth/requires-recent-login' ||
        err.message?.includes('recent') ||
        err.code === 'auth/user-token-expired'
      ) {
        try {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
          // Retry link
          await linkWithCredential(user, credential);
          await user.reload();
          setPasswordSuccess(
            'Password set successfully! You can now sign in with either Google or your email and password.'
          );
          setNewPassword('');
          setConfirmPassword('');
        } catch (reauthErr: any) {
          console.error('[SettingsPage] Google re-authentication failed:', reauthErr);
          setPasswordError(
            reauthErr?.message ||
              'Please sign out and sign back in with Google before setting a password.'
          );
        }
      } else if (err.code === 'auth/provider-already-linked') {
        setPasswordError('A password is already linked to this account.');
      } else {
        setPasswordError(err?.message || 'Failed to set password. Please try again.');
      }
    } finally {
      setSettingPassword(false);
    }
  };

  // ── Change Password (for accounts with an existing password) ───────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (!currentPassword) {
      setChangePasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      return;
    }
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setChangePasswordError('New password must contain at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('New password and confirmation password do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setChangePasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setChangePasswordSuccess(null), 4000);
    } catch (err: any) {
      console.warn('[SettingsPage] Change password error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setChangePasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setChangePasswordError('Please log in again before changing your password.');
      } else {
        setChangePasswordError(err?.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Forgot Password (sends reset email) ───────────────────────────────────
  const handleForgotPassword = async () => {
    if (!user || !user.email) return;
    setSendingReset(true);
    setResetMessage(null);

    try {
      await sendPasswordResetEmail(auth, user.email);
      // Strictly do not reveal whether email exists; provide uniform reassuring message
      setResetMessage(
        'If this email is registered, a password reset link has been sent to your inbox.'
      );
    } catch (err: any) {
      console.warn('[SettingsPage] Reset password error:', err);
      // Even on error, don't leak account existence
      setResetMessage(
        'If this email is registered, a password reset link has been sent to your inbox.'
      );
    } finally {
      setSendingReset(false);
    }
  };

  // ── Logout & Account Deletion ─────────────────────────────────────────────
  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await wipeStudentAccount(user.uid);
      await signOutUser();
      navigate('/');
    } catch (err) {
      console.error('[SettingsPage] Delete account error:', err);
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete account. Please try again.'
      );
      setDeletingAccount(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Settings & Account Security
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Manage your profile identity, role, sign-in methods, and appearance.
        </p>
      </div>

      {profileLoading ? (
        <Skeleton height={240} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* ═════════════════════════════════════════════════════════════════════
              1. PROFILE IDENTITY (ROLE, NICKNAME, USERNAME)
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-heading" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                  Profile Identity
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Set your role, display nickname, and unique public username.
                </p>
              </div>
              <RoleBadge
                role={isAdmin ? 'Super Admin' : (roleOption === 'Other' ? (customRoleText || 'Other') : roleOption)}
                customRole={roleOption === 'Other' ? customRoleText : undefined}
                isSuperAdmin={isAdmin}
                size="md"
              />
            </div>

            <form onSubmit={handleSaveIdentity} className="flex flex-col gap-4">
              {/* Field 1: Role Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Role
                </label>
                {isAdmin ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-muted border border-border text-sm font-medium text-primary">
                    <RoleBadge role="Super Admin" isSuperAdmin={true} size="sm" />
                    <span className="text-xs text-muted">
                      (Administrative role is assigned based on verified security credentials)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select
                      value={roleOption}
                      onChange={(e) => setRoleOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary focus:outline-none focus:border-[#D71921] transition-colors"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Parent">Parent</option>
                      <option value="Other">Other</option>
                    </select>

                    {roleOption === 'Other' && (
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[11px] font-medium text-muted">
                          Specify your role title (max 20 characters)
                        </label>
                        <input
                          type="text"
                          maxLength={20}
                          value={customRoleText}
                          onChange={(e) => setCustomRoleText(e.target.value)}
                          placeholder="e.g. Mentor, Tutor, Counselor"
                          className="w-full px-3.5 py-2 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                        />
                        {isForbiddenAdminRole(customRoleText) && (
                          <p className="text-xs text-red-500 font-medium mt-0.5">
                            You cannot assign yourself an administrative role.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Nickname */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-secondary">
                    Nickname (Display Name)
                  </label>
                  <span className="text-[11px] font-mono text-muted">
                    {nickname.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={30}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-input-bg border text-sm text-primary placeholder:text-placeholder focus:outline-none transition-colors ${
                    nickname && !nicknameValidation.valid
                      ? 'border-red-500/70 focus:border-red-500'
                      : 'border-border focus:border-[#D71921]'
                  }`}
                />
                <p className="text-[11px] text-muted mt-1">
                  Shown on your profile and in Commons (2 to 30 characters; letters, numbers, spaces, and basic punctuation).
                </p>
                {nickname && !nicknameValidation.valid && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {nicknameValidation.error}
                  </p>
                )}
              </div>

              {/* Field 3: Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-secondary">
                    Username
                  </label>
                  <span className="text-[11px] font-mono text-muted">
                    {username.length}/20
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-mono text-sm select-none">
                    @
                  </span>
                  <input
                    type="text"
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    placeholder="e.g. ayesha_99"
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder font-sans focus:outline-none focus:border-[#D71921] transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {checkingUsername && <Loader2 size={16} className="animate-spin text-muted" />}
                    {!checkingUsername && usernameStatus?.available && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                    {!checkingUsername && usernameStatus && !usernameStatus.available && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                  </div>
                </div>

                {/* Username helper & live availability messages */}
                <p className="text-[11px] text-muted mt-1">
                  Unique, lowercase, letters, numbers, dots and underscores only (3 to 20 characters).
                </p>

                {usernameStatus && !checkingUsername && (
                  <div className="mt-1.5">
                    {usernameStatus.available ? (
                      <p className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
                        <Check size={14} />
                        <span>Username is available{usernameStatus.isCurrent ? ' (your current username)' : ''}!</span>
                      </p>
                    ) : usernameStatus.isReserved ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mt-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={15} className="shrink-0" />
                          <span>This name is reserved. Send a request to use it.</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={handleSendReservedNameRequest}
                          disabled={sendingNameRequest}
                          className="shrink-0 text-xs"
                        >
                          <Send size={12} />
                          <span>{sendingNameRequest ? 'Sending...' : 'Send Request'}</span>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{usernameStatus.error || 'Username is not available.'}</span>
                      </p>
                    )}
                  </div>
                )}

                {nameRequestSuccess && (
                  <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>{nameRequestSuccess}</span>
                  </p>
                )}
              </div>

              {/* Feedback messages */}
              {identityError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400">
                  {identityError}
                </div>
              )}

              {identitySuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{identitySuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={savingIdentity}
                  disabled={
                    savingIdentity ||
                    checkingUsername ||
                    !nicknameValidation.valid ||
                    (usernameStatus !== null && !usernameStatus.available && !usernameStatus.isCurrent)
                  }
                >
                  <Save size={14} />
                  <span>Save Identity</span>
                </Button>
              </div>
            </form>
          </GlassCard>

          {/* ═════════════════════════════════════════════════════════════════════
              2. SECURITY & SIGN-IN METHODS (GOOGLE-ONLY PASSWORD SET & CHANGE)
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-heading" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                  Security & Sign-In Methods
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Manage account credentials, linked sign-in methods, and passwords.
                </p>
              </div>

              {/* Linked Sign-in Methods Status */}
              <div className="flex items-center gap-2 text-xs font-sans px-3 py-1.5 rounded-full bg-surface-muted border border-border text-primary font-medium">
                <KeyRound size={14} className="text-[#D71921]" />
                <span>
                  Sign-in methods:{' '}
                  {hasGoogle && hasPassword
                    ? 'Google, Email and password'
                    : hasGoogle
                    ? 'Google'
                    : 'Email and password'}
                </span>
              </div>
            </div>

            {/* Case A: Google-Only Account (No password yet) */}
            {hasGoogle && !hasPassword ? (
              <div className="p-5 rounded-2xl bg-surface-muted border border-border flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Lock size={16} className="text-[#D71921]" />
                    <span>Set Password</span>
                  </h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    You signed in with Google. Add a password so you can also log in with your email.
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="flex flex-col gap-3.5 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password to confirm"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted">
                    Strength hint: Minimum 8 characters, at least one letter and one number.
                  </p>

                  {passwordError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={settingPassword}
                    >
                      <Lock size={14} />
                      <span>Set Password</span>
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* Case B: Password exists (Email account or Google+Password account) */
              <div className="flex flex-col gap-5">
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5 max-w-md">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Lock size={16} className="text-[#D71921]" />
                    <span>Change Password</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted">
                    Strength hint: Minimum 8 characters, at least one letter and one number.
                  </p>

                  {changePasswordError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
                      {changePasswordError}
                    </div>
                  )}

                  {changePasswordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>{changePasswordSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={changingPassword}
                    >
                      <Lock size={14} />
                      <span>Change Password</span>
                    </Button>
                  </div>
                </form>

                {/* Forgot Password Reset flow */}
                <div className="pt-3 border-t border-border flex flex-col gap-2 max-w-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-primary">Forgot your password?</h5>
                      <p className="text-[11px] text-muted">
                        We'll send a secure password reset link to your registered email address.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleForgotPassword}
                      loading={sendingReset}
                      className="shrink-0 text-xs"
                    >
                      <Mail size={13} />
                      <span>Send Reset Link</span>
                    </Button>
                  </div>

                  {resetMessage && (
                    <div className="p-3 rounded-xl bg-surface-muted border border-border text-xs text-primary flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>{resetMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* ═════════════════════════════════════════════════════════════════════
              3. APPEARANCE SETTINGS (NOTHING OS DARK / LIGHT & WALLPAPER)
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard className="p-4 sm:p-6">
            <h3 className="font-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Appearance
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select Nothing OS monochrome dark mode or high-contrast light mode.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => toggleTheme('dark')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--r-card)',
                  background: '#000000',
                  border: theme === 'dark' ? '2px solid #D71921' : '1px solid #333333',
                  color: '#F2F2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Moon size={18} />
                <span>Nothing Dark</span>
                {theme === 'dark' && <Check size={16} className="text-[#D71921]" />}
              </button>

              <button
                type="button"
                onClick={() => toggleTheme('light')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--r-card)',
                  background: '#F2F2F2',
                  border: theme === 'light' ? '2px solid #D71921' : '1px solid #CCCCCC',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Sun size={18} />
                <span>Nothing Light</span>
                {theme === 'light' && <Check size={16} className="text-[#D71921]" />}
              </button>
            </div>

            {/* Background Wallpaper Picker */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    Background Wallpaper
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Original dark artwork: concentric arcs, deep red glow, and dot matrix. Saved locally.
                  </p>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-dot)', padding: '2px 8px', borderRadius: 9999, background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#D71921', fontWeight: 700 }}>
                  {WALLPAPERS.find((w) => w.id === currentWallpaper)?.name || 'Crimson Arc'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {WALLPAPERS.map((item) => {
                  const isSelected = currentWallpaper === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWallpaper(item.id)}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        border: isSelected ? '2px solid #D71921' : '1px solid var(--border)',
                        background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <WallpaperThumbnail id={item.id} selected={isSelected} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                            {item.name}
                          </span>
                          {isSelected && <Check size={14} className="text-[#D71921]" />}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* ═════════════════════════════════════════════════════════════════════
              4. TARGET UNIVERSITY & SCHEDULE (TARGET EXAM REMOVED)
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard className="p-4 sm:p-6 flex flex-col gap-4">
            <h3 className="font-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              Target University & Schedule
            </h3>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Primary Target University
              </label>
              <select
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="">Select target university...</option>
                {PAKISTANI_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Expected Test Date (for countdown)
              </label>
              <input
                type="date"
                value={targetTestDate}
                onChange={(e) => setTargetTestDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              {preferencesSuccess ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                  <Check size={16} /> Preferences saved!
                </span>
              ) : (
                <span />
              )}
              <Button variant="primary" size="md" type="button" onClick={handleSavePreferences} loading={savingPreferences}>
                <Save size={14} /> Save Preferences
              </Button>
            </div>
          </GlassCard>

          {/* ═════════════════════════════════════════════════════════════════════
              5. ACCOUNT DETAILS & SESSION ACTIONS
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{user?.email}</p>
                <p className="text-xs font-mono text-[var(--muted)] mt-1 flex items-center gap-1.5">
                  <span>Student ID:</span>
                  <span className="font-bold text-[var(--text)] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                    {formatStudentId(profile || user?.uid)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* ═════════════════════════════════════════════════════════════════════
              6. DANGER ZONE: ACCOUNT DELETION
          ═════════════════════════════════════════════════════════════════════ */}
          <GlassCard style={{ padding: '20px 24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Danger Zone</span>
                </h4>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-md leading-relaxed">
                  Permanently delete your Boardly student account, test attempts, streaks, and squad data. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
                <span>Delete My Account</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-red-500/40 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-red-500">
                <AlertTriangle size={22} className="shrink-0" />
                <h3 className="text-lg font-bold font-heading text-[var(--text)]">Delete Account Confirmation</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Are you sure you want to delete your account? All your personal data—including profile settings, test attempts, streak records, crew membership, and ambassador status—will be wiped immediately.
            </p>

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-[11px] text-red-300">
              Type <strong className="text-white font-mono">DELETE</strong> below to confirm.
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-red-500"
            />

            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingAccount || deleteConfirmText.trim() !== 'DELETE'}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{deletingAccount ? 'Wiping Data...' : 'Yes, Delete My Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
