import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_VERSION_DISPLAY,
} from '@/constants/legalConsent';
import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, seedSharedUserProfileCache } from '@/hooks/useUserProfile';
import {
  syncProfileToD1Backend,
  broadcastPublicProfileUpdate,
  invalidatePublicProfileCache,
} from '@/services/publicProfileService';
import { invalidateProfileMemoryCache } from '@/components/profile/ProfileView';
import { invalidateCommonsPostsCache } from '@/services/commonsService';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { PLANS } from '@/config/plans';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  LogOut,
  Check,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Mail,
  Shield,
  Lock,
  Send,
  CheckCircle2,
  AtSign,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { validateNickname, validateUsernameFormat, isForbiddenAdminRole } from '@/utils/usernameValidation';
import { submitNameRequest } from '@/services/nameRequestService';
import { useSmoothMode } from '@/utils/smoothMode';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { wipeStudentAccount } from '@/services/userAccountService';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  useDragonHiddenPreference,
  DRAGON_COMPANION_NAME,
} from '@/components/dashboard/DragonCompanion';
import {
  getEmailNotificationPreferences,
  saveEmailNotificationPreferences,
  type EmailNotificationPreferences,
} from '@/services/emailNotificationService';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import { KobanStyleCustomizer } from '@/components/koban/KobanStyleCustomizer';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ProBadgeCustomizer } from '@/components/plans/ProBadgeCustomizer';
import { ProBadge } from '@/components/ui/ProBadge';

const SELECTABLE_USER_ROLES = [
  'Student',
  'FSc Student',
  'Matric Student',
  'Post-FSc / Entry Test',
  'MDCAT Aspirant',
  'ECAT / NET Aspirant',
  'ICS / CS Student',
  'Educator',
] as const;

export function SettingsPage() {
  const { user, signOutUser, updateLocalProfile, isAdmin, refreshVerificationStatus } = useAuth();
  const { profile, loading } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const { smoothMode, setSmoothMode } = useSmoothMode();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();
  const { hideDragon, setHideDragon } = useDragonHiddenPreference();
  const navigate = useNavigate();
  const location = useLocation();

  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Display Name state
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sendingNameRequest, setSendingNameRequest] = useState(false);
  const [nameRequestSentMsg, setNameRequestSentMsg] = useState<string | null>(null);

  // Username & Role state
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('Student');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Password state (Set Password for Google-only users / Change Password for email users)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSavedMsg, setPasswordSavedMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email Notification Preferences state (for optional emails)
  const [emailPrefs, setEmailPrefs] = useState<EmailNotificationPreferences>({
    testStarted: false,
    smallKobanReceipts: true,
  });
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [emailPrefsSaved, setEmailPrefsSaved] = useState(false);

  const isPro = effectivePlan.isUnlimited;

  // Detect whether current Firebase Auth user already has a 'password' provider linked
  const hasPasswordProvider = Boolean(
    auth.currentUser?.providerData?.some((p) => p.providerId === 'password')
  );

  // Populate fields from profile
  useEffect(() => {
    const raw =
      profile?.displayName ||
      profile?.nickname ||
      profile?.name ||
      user?.displayName ||
      (user?.email ? user.email.split('@')[0] : 'Student');
    const clean = sanitizeStudentDisplayName(raw, profile?.shortId || user?.uid);
    setDisplayName(clean);
    if (profile?.username) {
      setUsernameInput(profile.username);
    }
    const rawRole = (profile?.customRole || profile?.role || 'Student').trim();
    const matchedSelectable = SELECTABLE_USER_ROLES.find(
      (r) => r.toLowerCase() === rawRole.toLowerCase()
    );
    setSelectedRole(matchedSelectable || (rawRole.toLowerCase() === 'student' ? 'Student' : rawRole));
    setEmailPrefs(
      getEmailNotificationPreferences(
        user?.uid,
        (profile as { emailPreferences?: Partial<EmailNotificationPreferences> } | null)?.emailPreferences
      )
    );
  }, [
    profile?.displayName,
    profile?.nickname,
    profile?.name,
    profile?.shortId,
    profile?.username,
    profile?.customRole,
    profile?.role,
    user?.displayName,
    user?.email,
    user?.uid,
    profile,
  ]);

  const handleToggleEmailPref = async (key: keyof EmailNotificationPreferences) => {
    if (!user) return;
    const nextPrefs: EmailNotificationPreferences = {
      ...emailPrefs,
      [key]: !emailPrefs[key],
    };
    setEmailPrefs(nextPrefs);
    setSavingEmailPrefs(true);
    setEmailPrefsSaved(false);
    try {
      await saveEmailNotificationPreferences(user.uid, nextPrefs);
      setEmailPrefsSaved(true);
      setTimeout(() => setEmailPrefsSaved(false), 2500);
    } catch (err) {
      console.warn('[SettingsPage] Could not save email preferences:', err);
    } finally {
      setSavingEmailPrefs(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError('Display name cannot be empty.');
      return;
    }

    setNameError(null);
    setNameRequestSentMsg(null);

    // Enforce reserved names (SHS Virtual Academy, Boardly, Scholario) & format rules
    const validation = validateNickname(trimmed, user.uid, isAdmin);
    if (!validation.valid) {
      setNameError(validation.error || 'This name is reserved. Send a request to the admin.');
      return;
    }

    const cleanName = sanitizeStudentDisplayName(trimmed, profile?.shortId || user.uid);

    setSavingName(true);
    setNameSaved(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      const pubRef = doc(db, 'publicProfiles', user.uid);

      await Promise.all([
        setDoc(
          userRef,
          {
            displayName: cleanName,
            nickname: cleanName,
            name: cleanName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          pubRef,
          {
            uid: user.uid,
            displayName: cleanName,
            nickname: cleanName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {}),
        syncProfileToD1Backend(user.uid, {
          ...(profile || {}),
          displayName: cleanName,
        }),
        auth.currentUser && auth.currentUser.uid === user.uid
          ? firebaseUpdateProfile(auth.currentUser, { displayName: cleanName }).catch(() => {})
          : Promise.resolve(),
      ]);

      const nextProfilePatch = {
        displayName: cleanName,
        nickname: cleanName,
        name: cleanName,
      };
      updateLocalProfile(nextProfilePatch);
      seedSharedUserProfileCache(user.uid, {
        ...(profile || ({ uid: user.uid } as any)),
        ...nextProfilePatch,
      });
      invalidatePublicProfileCache(user.uid);
      invalidateProfileMemoryCache(user.uid);
      broadcastPublicProfileUpdate(user.uid, nextProfilePatch);
      invalidateCommonsPostsCache();

      setDisplayName(cleanName);
      setSavingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (err: unknown) {
      setSavingName(false);
      setNameError((err as { message?: string })?.message || 'Failed to update display name.');
    }
  };

  const handleSendReservedNameRequest = async () => {
    if (!user || !displayName.trim()) return;
    setSendingNameRequest(true);
    setNameError(null);
    try {
      await submitNameRequest({
        uid: user.uid,
        userEmail: user.email || '',
        requestedName: displayName.trim(),
        currentDisplayName: profile?.displayName || user.displayName || 'Student',
      });
      setNameRequestSentMsg(
        `Your request for "${displayName.trim()}" has been sent to the Superadmin for approval.`
      );
    } catch (err: unknown) {
      setNameError((err as { message?: string })?.message || 'Failed to send name request.');
    } finally {
      setSendingNameRequest(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIdentityError(null);
    setIdentitySaved(false);

    const cleanUsername = usernameInput.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername) {
      const uVal = validateUsernameFormat(cleanUsername, user.uid, isAdmin);
      if (!uVal.valid) {
        setIdentityError(uVal.error || 'Invalid username format.');
        return;
      }
    }
    if (!isAdmin && isForbiddenAdminRole(selectedRole)) {
      setIdentityError('Cannot assign administrator role.');
      return;
    }

    setSavingIdentity(true);
    try {
      const oldUsername = (profile?.username || '').trim().toLowerCase();
      if (cleanUsername) {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
        const regRes = await fetch('/api/auth/username-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            uid: user.uid,
            username: cleanUsername,
            email: (user.email || profile?.email || '').trim().toLowerCase(),
            accountType: 'registered',
          }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok || !regData.ok) {
          throw new Error(regData.error || `@${cleanUsername} is already taken.`);
        }
      }
      if (cleanUsername && cleanUsername !== oldUsername) {
        await runTransaction(db, async (tx) => {
          const newUsernameRef = doc(db, 'usernames', cleanUsername);
          const existingSnap = await tx.get(newUsernameRef);
          if (existingSnap.exists() && existingSnap.data()?.uid !== user.uid) {
            throw new Error(`@${cleanUsername} is already taken by another student.`);
          }
          if (oldUsername && oldUsername !== cleanUsername) {
            const oldRef = doc(db, 'usernames', oldUsername);
            const oldSnap = await tx.get(oldRef);
            if (oldSnap.exists() && oldSnap.data()?.uid === user.uid) {
              tx.delete(oldRef);
            }
          }
          tx.set(newUsernameRef, {
            uid: user.uid,
            username: cleanUsername,
            updatedAt: serverTimestamp(),
          });
          tx.set(
            doc(db, 'users', user.uid),
            {
              username: cleanUsername,
              customRole: selectedRole,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          tx.set(
            doc(db, 'publicProfiles', user.uid),
            {
              uid: user.uid,
              username: cleanUsername,
              customRole: selectedRole,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        });
      } else {
        await Promise.all([
          setDoc(
            doc(db, 'users', user.uid),
            { customRole: selectedRole, updatedAt: serverTimestamp() },
            { merge: true }
          ),
          setDoc(
            doc(db, 'publicProfiles', user.uid),
            { uid: user.uid, customRole: selectedRole, updatedAt: serverTimestamp() },
            { merge: true }
          ).catch(() => {}),
        ]);
      }

      await syncProfileToD1Backend(user.uid, {
        ...(profile || {}),
        ...(cleanUsername ? { username: cleanUsername } : {}),
        customRole: selectedRole,
      });

      const identityPatch = {
        ...(cleanUsername ? { username: cleanUsername } : {}),
        customRole: selectedRole,
      };
      updateLocalProfile(identityPatch);
      seedSharedUserProfileCache(user.uid, {
        ...(profile || ({ uid: user.uid } as any)),
        ...identityPatch,
      });
      invalidatePublicProfileCache(user.uid);
      invalidateProfileMemoryCache(user.uid);
      broadcastPublicProfileUpdate(user.uid, identityPatch);
      invalidateCommonsPostsCache();

      setIdentitySaved(true);
      setTimeout(() => setIdentitySaved(false), 3000);
    } catch (err: unknown) {
      setIdentityError((err as { message?: string })?.message || 'Failed to update username or role.');
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSavedMsg(null);

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setPasswordError('You must be signed in with a valid email account.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (!hasPasswordProvider) {
        // Google-only user setting a password for the first time
        const credential = EmailAuthProvider.credential(currentUser.email, newPassword);
        await linkWithCredential(currentUser, credential);
        // Refresh token and sync session so Google-verified status carries over without resetting verification
        await currentUser.getIdToken(true).catch(() => {});
        await refreshVerificationStatus({ syncPasswordLink: true }).catch(() => {});
        setPasswordSavedMsg(
          'Password set! You can now sign in using either Google or your email and password.'
        );
      } else {
        // Existing email/password user changing their password
        if (!currentPassword) {
          setPasswordError('Please enter your current password to verify your identity.');
          setSavingPassword(false);
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        await currentUser.getIdToken(true).catch(() => {});
        await refreshVerificationStatus({ syncPasswordLink: true }).catch(() => {});
        setPasswordSavedMsg('Your password has been updated.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else if (code === 'auth/requires-recent-login') {
        setPasswordError('For security, please sign out and sign back in before changing your password.');
      } else if (code === 'auth/provider-already-linked') {
        setPasswordError('A password is already linked to this account.');
      } else {
        setPasswordError((err as { message?: string })?.message || 'Could not update password.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteAccountError('Please type DELETE to confirm account deletion.');
      return;
    }
    setDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await wipeStudentAccount(user.uid);
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setDeletingAccount(false);
      setDeleteAccountError(
        (err as { message?: string })?.message || 'Could not delete account. Please sign in again and retry.'
      );
    }
  };

  // Scroll to and highlight any targeted Settings section when navigated via #hash
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    const rawHash = (location.hash || window.location.hash || '').replace(/^#/, '').trim();
    if (!rawHash) return;

    const targetId =
      rawHash === 'koban-icon'
        ? 'appearance-koban-icon'
        : rawHash;

    if (targetId === 'settings-delete-account') {
      setConfirmingDeleteAccount(true);
    } else if (targetId === 'settings-sign-out') {
      setConfirmingSignOut(true);
    }

    setHighlightedSection(targetId);

    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 90);

    const clearHighlightTimer = setTimeout(() => {
      setHighlightedSection((prev) => (prev === targetId ? null : prev));
    }, 2600);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearHighlightTimer);
    };
  }, [loading, location.hash]);

  const sectionHighlightClass = (id: string) =>
    highlightedSection === id
      ? 'ring-2 ring-[var(--nav-icon-active)] border-[var(--nav-icon-active)] transition-all duration-300'
      : 'transition-all duration-300';

  if (loading && !profile) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <LineLoader context="dashboard" variant="section" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Settings — Boardly"
        description="Manage your plan, account email, display name, username, role, password, and session settings on Boardly."
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
        {/* Page Header */}
        <div className="pb-3 border-b border-[var(--border)]">
          <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)] font-heading font-semibold">
            ACCOUNT
          </span>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Manage your plan, display name, username, role, password, and account session.
          </p>
        </div>

        {/* ── 1. Current Plan & Upgrade Section ──────────────────────────── */}
        <section
          id="settings-plan"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-plan')}`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--red)]" />
                <h2 className="text-base font-bold text-[var(--text)] font-heading">
                  Current Plan
                </h2>
                <Badge color={isPro ? 'green' : 'default'}>
                  {effectivePlan.isSuperAdmin
                    ? 'Superadmin · Unlimited'
                    : isPro
                    ? effectivePlan.source === 'crew'
                      ? `Unlimited (${effectivePlan.crewName || 'Crew'})`
                      : 'Pro Unlimited'
                    : 'Free Plan'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {effectivePlan.isSuperAdmin
                  ? 'Full superadmin authority and unlimited access across Boardly.'
                  : isPro
                  ? 'You have unlimited practice tests, past papers, and AI tutor derivations.'
                  : `You are on the Free plan. Upgrade to Pro (PKR ${PLANS.pro_monthly.price_pkr}/month) for unlimited tests and AI derivations.`}
              </p>
            </div>

            {!isPro && !effectivePlan.isSuperAdmin ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard/plans')}
                className="shrink-0"
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard/plans')}
                className="shrink-0"
              >
                <span>View Plan Details</span>
              </Button>
            )}
          </div>
        </section>

        {/* ── 2. Account Email (Read-Only) ───────────────────────────────── */}
        <section
          id="settings-email"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-3 scroll-mt-24 ${sectionHighlightClass('settings-email')}`}
        >
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[var(--muted)]" />
            <h2 className="text-base font-bold text-[var(--text)] font-heading">
              Account Email
            </h2>
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-sm font-mono text-[var(--text)] truncate">
              {user?.email || 'No email linked'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 shrink-0">
              <Shield size={12} />
              <span>Verified</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Your email is kept strictly private and is never shown on your public profile or in Commons.
          </p>
        </section>

        {/* ── 2b. Email Notification Preferences (Optional vs Transactional) ── */}
        <section
          id="settings-notifications"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-notifications')}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[var(--red)]" />
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Email Notifications
              </h2>
            </div>
            {emailPrefsSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Check size={13} />
                <span>Preferences saved</span>
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Critical transactional emails — including <strong>Koban purchase confirmations</strong>,{' '}
            <strong>official test result reports</strong>, and <strong>application status updates</strong> — are always sent to your verified account email. You can customize optional activity emails below:
          </p>

          <div className="divide-y divide-[var(--border)] rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4">
            {/* Optional Toggle 1: Small Koban Receipts */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)]">
                  Daily &amp; milestone Koban receipts
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Receive a short email receipt when you claim daily check-in or MCQ milestone Kobans.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                disabled={savingEmailPrefs}
                aria-checked={emailPrefs.smallKobanReceipts}
                onClick={() => handleToggleEmailPref('smallKobanReceipts')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailPrefs.smallKobanReceipts
                    ? 'bg-[var(--red)]'
                    : 'bg-[var(--card)] border-[var(--border)]'
                }`}
              >
                <span className="sr-only">Toggle small Koban receipts</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailPrefs.smallKobanReceipts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Optional Toggle 2: Test Started Email */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)]">
                  Test start notifications
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Send a quick email when a new timed test session starts (test completion results are always sent).
                </p>
              </div>
              <button
                type="button"
                role="switch"
                disabled={savingEmailPrefs}
                aria-checked={emailPrefs.testStarted}
                onClick={() => handleToggleEmailPref('testStarted')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailPrefs.testStarted
                    ? 'bg-[var(--red)]'
                    : 'bg-[var(--card)] border-[var(--border)]'
                }`}
              >
                <span className="sr-only">Toggle test start notifications</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailPrefs.testStarted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── 3. Display Name Section (with Reserved Name Admin Request) ─── */}
        <section
          id="settings-display-name"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-display-name')}`}
        >
          <div className="flex items-center gap-2">
            <UserIcon size={16} className="text-[var(--muted)]" />
            <h2 className="text-base font-bold text-[var(--text)] font-heading">
              Display Name
            </h2>
          </div>

          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                maxLength={40}
                placeholder="Enter your display name"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[var(--muted)] mt-1.5">
                Shown on your profile card, leaderboards, and public Commons posts. Official names (SHS Virtual Academy, Boardly, Scholario) require admin approval.
              </p>
            </div>

            {nameError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>{nameError}</span>
                </div>
                {(nameError.includes('reserved') || nameError.includes('Send a request')) && (
                  <button
                    type="button"
                    disabled={sendingNameRequest}
                    onClick={handleSendReservedNameRequest}
                    className="relative overflow-hidden self-start px-3 py-1.5 rounded-lg bg-[var(--red)] hover:opacity-90 text-white font-heading font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send size={13} />
                    <span>{sendingNameRequest ? 'Sending...' : 'Send Request to Admin'}</span>
                    {sendingNameRequest && <ButtonLineLoader />}
                  </button>
                )}
              </div>
            )}

            {nameRequestSentMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span>{nameRequestSentMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                {nameSaved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check size={14} />
                    <span>Display name updated</span>
                  </span>
                )}
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={savingName}>
                {savingName ? 'Saving...' : 'Save Name'}
              </Button>
            </div>
          </form>
        </section>

        {/* ── 4. Username (@handle) & Study Role Selection ───────────────── */}
        <section
          id="settings-username"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-username')}`}
        >
          <div className="flex items-center gap-2">
            <AtSign size={16} className="text-[var(--muted)]" />
            <h2 className="text-base font-bold text-[var(--text)] font-heading">
              Username &amp; Study Role
            </h2>
          </div>

          <form onSubmit={handleSaveIdentity} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                Unique Username (@handle)
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  if (identityError) setIdentityError(null);
                }}
                maxLength={20}
                placeholder="e.g. hashir_fsc"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[var(--muted)]">
                3–20 characters, lowercase letters, numbers, and underscores only.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)] block">
                Academic Role Badge
              </label>
              <div className="flex flex-wrap gap-2">
                {SELECTABLE_USER_ROLES.map((roleOpt) => {
                  const active = selectedRole === roleOpt;
                  return (
                    <button
                      key={roleOpt}
                      type="button"
                      onClick={() => setSelectedRole(roleOpt)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                        active
                          ? 'bg-[var(--red)] text-white border-[var(--red)]'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
                      }`}
                    >
                      {roleOpt}
                    </button>
                  );
                })}
              </div>
            </div>

            {identityError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{identityError}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                {identitySaved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check size={14} />
                    <span>Username &amp; role saved</span>
                  </span>
                )}
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={savingIdentity}>
                {savingIdentity ? 'Saving...' : 'Save Username & Role'}
              </Button>
            </div>
          </form>
        </section>

        {/* ── 5. Set Password (for Google-only users) / Change Password ──── */}
        <section
          id="settings-password"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-password')}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-[var(--muted)]" />
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                {hasPasswordProvider ? 'Change Password' : 'Set Account Password'}
              </h2>
            </div>
            {!hasPasswordProvider && (
              <Badge color="default">Signed in with Google</Badge>
            )}
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {hasPasswordProvider
              ? 'Update your account password. Make sure to choose a strong password with at least 6 characters.'
              : 'You signed in with Google. Set a password below so you can also sign in directly with your email and password anytime.'}
          </p>

          <form onSubmit={handleSavePassword} className="space-y-3">
            {hasPasswordProvider && (
              <div>
                <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span>{passwordSavedMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
                {savingPassword
                  ? 'Saving...'
                  : hasPasswordProvider
                  ? 'Update Password'
                  : 'Set Password'}
              </Button>
            </div>
          </form>
        </section>

        {/* ── 5b. Security & Optional Two-Step Verification ──────────────── */}
        <div
          id="settings-security"
          className={`rounded-2xl scroll-mt-24 ${sectionHighlightClass('settings-security')}`}
        >
          <SecuritySettingsSection />
        </div>

        {/* ── 5b-2. Appearance > Theme (Light / Dark / System) ───────────── */}
        <section
          id="settings-theme"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex items-center justify-between gap-4 flex-wrap scroll-mt-24 ${sectionHighlightClass('settings-theme')}`}
        >
          <div className="space-y-1 max-w-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Appearance
            </div>
            <div className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? (
                <Moon size={16} className="text-[var(--muted)]" />
              ) : (
                <Sun size={16} className="text-[var(--muted)]" />
              )}
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Theme
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Choose between Light, Dark, or automatic System theme across Boardly.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            {(['light', 'dark', 'system'] as ThemeSetting[]).map((mode) => {
              const active = themeSetting === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--red)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 5c. Appearance > Koban icon ────────────────────────────────── */}
        <section
          id="appearance-koban-icon"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('appearance-koban-icon')}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <KobanIcon size={20} decorative />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Appearance
                </div>
                <h2 className="text-base font-bold text-[var(--text)] font-heading">
                  Koban icon
                </h2>
              </div>
            </div>
            <Badge color="default">Cosmetic Only</Badge>
          </div>
          <KobanStyleCustomizer />
        </section>

        {/* ── 5d. Appearance > Pro badge ─────────────────────────────────── */}
        <section
          id="appearance-pro-badge"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('appearance-pro-badge')}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ProBadge design="ember" size="sm" animated priority />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Appearance
                </div>
                <h2 className="text-base font-bold text-[var(--text)] font-heading">
                  Pro badge
                </h2>
              </div>
            </div>
            <Badge color="default">Cosmetic Only</Badge>
          </div>
          <ProBadgeCustomizer userDisplayName={displayName || profile?.displayName || user?.displayName || 'Student'} />
        </section>

        {/* ── 6. Appearance > Reduce effects (Smooth Mode) ───────────────── */}
        <section
          id="appearance-reduce-effects"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex items-center justify-between gap-4 flex-wrap scroll-mt-24 ${sectionHighlightClass('appearance-reduce-effects')}`}
        >
          <div className="space-y-1 max-w-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Appearance
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--muted)]" />
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Reduce effects (Smooth Mode)
              </h2>
              {smoothMode && <Badge color="green">Active</Badge>}
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Optimizes scrolling and battery life on phones by turning off backdrop blur, idle floating animations, and animated cosmetic effects. Automatically enabled on low-memory or Data Saver devices.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={smoothMode}
            aria-label="Reduce effects"
            onClick={() => setSmoothMode(!smoothMode)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              smoothMode ? 'bg-[var(--red)]' : 'bg-[var(--surface-2)] border-[var(--border)]'
            }`}
          >
            <span className="sr-only">Reduce effects (Smooth Mode)</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                smoothMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* ── 6b. Hide Dragon Companion (Cockpit) ────────────────────────── */}
        <section
          id="settings-dragon"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex items-center justify-between gap-4 flex-wrap scroll-mt-24 ${sectionHighlightClass('settings-dragon')}`}
        >
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--muted)]" />
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Hide dragon
              </h2>
              {hideDragon && <Badge color="gray">Hidden</Badge>}
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Hide {DRAGON_COMPANION_NAME}, the animated Cockpit dragon companion and Dragon Egg progress card (shown by default).
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={hideDragon}
            aria-label="Hide dragon"
            onClick={() => setHideDragon(!hideDragon)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hideDragon ? 'bg-[var(--red)]' : 'bg-[var(--surface-2)] border-[var(--border)]'
            }`}
          >
            <span className="sr-only">Hide dragon</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                hideDragon ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* ── 6c. Legal & Privacy Links ──────────────────────────────────── */}
        <section
          id="settings-legal"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex items-center justify-between gap-4 flex-wrap scroll-mt-24 ${sectionHighlightClass('settings-legal')}`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--muted)]" />
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Legal &amp; Privacy
              </h2>
              <Badge color="gray">{LEGAL_VERSION_DISPLAY}</Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Review Boardly&apos;s Terms of Service and Privacy Policy (Last updated: {LEGAL_LAST_UPDATED_LABEL}).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/terms"
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--red)] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--red)] transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </section>

        {/* ── 7. Sign Out Section ────────────────────────────────────────── */}
        <section
          id="settings-sign-out"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-3 scroll-mt-24 ${sectionHighlightClass('settings-sign-out')}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                Sign Out
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                End your current session on this device.
              </p>
            </div>

            {!confirmingSignOut ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmingSignOut(true)}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmingSignOut(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut size={14} />
                  <span>Confirm Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── 8. Delete Account Section (with confirmation step) ─────────── */}
        <section
          id="settings-delete-account"
          className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 scroll-mt-24 ${sectionHighlightClass('settings-delete-account')}`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-[var(--red)]" />
                <h2 className="text-base font-bold text-[var(--text)] font-heading">
                  Delete Account
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Permanently remove your Boardly account, practice test history, and personal profile data. This action cannot be undone.
              </p>
            </div>

            {!confirmingDeleteAccount && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setConfirmingDeleteAccount(true);
                  setDeleteAccountError(null);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Account</span>
              </Button>
            )}
          </div>

          {confirmingDeleteAccount && (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
              <p className="text-xs text-[var(--text)] leading-relaxed">
                To confirm permanent deletion of your account, type <strong>DELETE</strong> below and press Confirm Delete:
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => {
                  setDeleteConfirmInput(e.target.value);
                  if (deleteAccountError) setDeleteAccountError(null);
                }}
                placeholder="Type DELETE to confirm"
                className="w-full h-10 px-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-mono text-[var(--text)] focus:border-[var(--red)] focus:outline-none"
              />
              {deleteAccountError && (
                <div className="text-xs text-[var(--red)] flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{deleteAccountError}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={deletingAccount}
                  onClick={() => {
                    setConfirmingDeleteAccount(false);
                    setDeleteConfirmInput('');
                    setDeleteAccountError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deletingAccount || deleteConfirmInput.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleConfirmDeleteAccount}
                >
                  <Trash2 size={14} />
                  <span>{deletingAccount ? 'Deleting...' : 'Confirm Delete'}</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default SettingsPage;
