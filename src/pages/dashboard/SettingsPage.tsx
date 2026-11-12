import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent, type TouchEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Bell,
  Crown,
  Check,
  AlertCircle,
  Send,
  ShieldAlert,
  Sparkles,
  FileText,
  ExternalLink,
  Mail,
  LogOut,
  AtSign,
  Loader2,
  UserPlus,
  Zap,
  ArrowLeft,
  ChevronRight,
  Search,
  X,
  Pencil,
  Shield,
  Coins,
  Palette,
} from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { useSmoothMode } from '@/utils/smoothMode';
import { useDragonHiddenPreference } from '@/components/dashboard/DragonCompanion';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { GuestUpgradeModal } from '@/components/auth/GuestUpgradeModal';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import { ProBadgeCustomizer } from '@/components/plans/ProBadgeCustomizer';
import { KobanStyleCustomizer } from '@/components/koban/KobanStyleCustomizer';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { useKobanStyle } from '@/contexts/KobanStyleContext';
import { PRO_BADGE_DESIGNS } from '@/lib/proBadgeDesigns';
import { KOBAN_DESIGNS } from '@/lib/kobanStyle';
import { clearCachedAuthAndAdminStorage } from '@/components/dashboard/HamburgerMenuSheet';
import { LineLoader } from '@/components/ui/LineLoader';
import {
  LEGAL_VERSION_DISPLAY,
  LEGAL_LAST_UPDATED_LABEL,
} from '@/constants/legalConsent';
import { validateUsernameFormat } from '@/utils/usernameValidation';
import { Layout } from 'lucide-react';
import {
  PROFILE_LAYOUT_METADATA,
  DEFAULT_PROFILE_LAYOUT,
  normalizeProfileLayout,
  useLiveProfileData,
  type ProfileLayoutId,
} from '@/lib/profileLayouts';
import { saveProfileLayoutToServer } from '@/services/publicProfileService';
import { ProfileView, invalidateProfileMemoryCache } from '@/components/profile/ProfileView';

// Strictly cosmetic academic badge options (cannot grant admin/moderator privileges)
const COSMETIC_ROLE_OPTIONS = [
  'Matric Student (9th)',
  'Matric Student (10th)',
  'FSc Pre-Medical (11th)',
  'FSc Pre-Medical (12th)',
  'FSc Pre-Engineering (11th)',
  'FSc Pre-Engineering (12th)',
  'ICS / Computer Science',
  'MDCAT Aspirant',
  'ECAT / NET Aspirant',
  'O / A Levels Student',
  'Self-Learner',
] as const;

const ALLOWED_COSMETIC_ROLES = new Set<string>(COSMETIC_ROLE_OPTIONS);

// Reserved keywords that require Admin Approval before a non-admin can use them
const RESERVED_NAME_KEYWORDS = [
  'admin',
  'administrator',
  'superadmin',
  'boardly',
  'official',
  'moderator',
  'mod',
  'support',
  'staff',
  'system',
  'founder',
  'ceo',
  'team',
];

function containsReservedKeyword(name: string): string | null {
  const lower = name.toLowerCase();
  for (const kw of RESERVED_NAME_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

export type SettingsSubPageId =
  | 'plan'
  | 'email'
  | 'username'
  | 'display-name'
  | 'appearance'
  | 'profile-layout'
  | 'pro-badge'
  | 'koban-icon'
  | 'notifications'
  | 'security'
  | 'legal';

interface SettingsSubPageSearchItem {
  id: string;
  label: string;
  subtitle: string;
  subPage: SettingsSubPageId | null;
  targetId?: string;
  keywords: string[];
}

const SUBPAGE_TITLES: Record<SettingsSubPageId, string> = {
  plan: 'Workspace & Plan',
  email: 'Account Email',
  username: 'Username & Study Role',
  'display-name': 'Display Name',
  appearance: 'Appearance',
  'profile-layout': 'Profile Layout',
  'pro-badge': 'Pro Badge',
  'koban-icon': 'Koban Icon',
  notifications: 'Notifications',
  security: 'Security',
  legal: 'Legal & Privacy',
};

function mapHashToSubPage(rawHash: string): {
  subPage: SettingsSubPageId | null;
  targetId: string | null;
} {
  const clean = rawHash.replace(/^#/, '').trim().toLowerCase();
  if (!clean) return { subPage: null, targetId: null };

  switch (clean) {
    case 'settings-plan':
    case 'plan':
      return { subPage: 'plan', targetId: null };
    case 'settings-email':
    case 'email':
      return { subPage: 'email', targetId: null };
    case 'settings-username':
    case 'username':
    case 'study-role':
      return { subPage: 'username', targetId: null };
    case 'settings-display-name':
    case 'display-name':
      return { subPage: 'display-name', targetId: null };
    case 'settings-appearance':
    case 'appearance':
      return { subPage: 'appearance', targetId: null };
    case 'settings-profile-layout':
    case 'profile-layout':
    case 'appearance-profile-layout':
      return { subPage: 'profile-layout', targetId: null };
    case 'settings-theme':
      return { subPage: 'appearance', targetId: 'settings-theme' };
    case 'appearance-reduce-effects':
      return { subPage: 'appearance', targetId: 'appearance-reduce-effects' };
    case 'settings-dragon':
      return { subPage: 'appearance', targetId: 'settings-dragon' };
    case 'appearance-pro-badge':
    case 'pro-badge':
      return { subPage: 'pro-badge', targetId: null };
    case 'appearance-koban-icon':
    case 'koban-icon':
      return { subPage: 'koban-icon', targetId: null };
    case 'settings-notifications':
    case 'notifications':
      return { subPage: 'notifications', targetId: null };
    case 'settings-security':
    case 'security':
      return { subPage: 'security', targetId: null };
    case 'settings-password':
      return { subPage: 'security', targetId: 'settings-password' };
    case 'security-totp':
      return { subPage: 'security', targetId: 'security-totp' };
    case 'security-email-2fa':
      return { subPage: 'security', targetId: 'security-email-2fa' };
    case 'security-devices':
      return { subPage: 'security', targetId: 'security-devices' };
    case 'settings-delete-account':
      return { subPage: 'security', targetId: 'settings-delete-account' };
    case 'settings-legal':
    case 'legal':
      return { subPage: 'legal', targetId: null };
    case 'settings-sign-out':
      return { subPage: null, targetId: 'settings-sign-out' };
    default:
      return { subPage: null, targetId: clean };
  }
}

export function SettingsPage() {
  const {
    user,
    profile,
    isAdmin,
    isGuest,
    checkUsernameAvailability,
    updateProfile,
    updateLocalProfile,
    signOutUser,
  } = useAuth();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting: themePreference, setTheme: setThemePreference } = useTheme();
  const { smoothMode, toggleSmoothMode } = useSmoothMode();
  const { hideDragon, setHideDragon } = useDragonHiddenPreference();
  const { openProfile } = useProfileModal();
  const { settings: proBadgeSettings, isActivePro, effectiveProBadge } = useProBadge();
  const { style: kobanStyle } = useKobanStyle();
  const navigate = useNavigate();
  const location = useLocation();

  // Sub-page navigation state
  const [activeSubPage, setActiveSubPage] = useState<SettingsSubPageId | null>(() => {
    if (typeof window === 'undefined') return null;
    return mapHashToSubPage(window.location.hash).subPage;
  });

  // Search settings state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Touch swipe-back tracking for sub-pages
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Guest Upgrade Modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Username editor state
  const [usernameInput, setUsernameInput] = useState<string>(profile?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'unchanged' | 'checking' | 'available' | 'taken' | 'invalid'
  >('unchanged');
  const [usernameStatusMsg, setUsernameStatusMsg] = useState<string>('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSavedMsg, setUsernameSavedMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Display Name & Role state
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [customRole, setCustomRole] = useState<string>(() => {
    const existing = profile?.customRole || '';
    return ALLOWED_COSMETIC_ROLES.has(existing) ? existing : COSMETIC_ROLE_OPTIONS[0];
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [pendingRestrictedName, setPendingRestrictedName] = useState<string | null>(null);
  const [requestingApproval, setRequestingApproval] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Notification Preferences State
  const [emailKobanReceipts, setEmailKobanReceipts] = useState<boolean>(
    profile?.notificationPrefs?.emailKobanReceipts !== false
  );
  const [emailArenaStarts, setEmailArenaStarts] = useState<boolean>(
    profile?.notificationPrefs?.emailArenaStarts !== false
  );
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sign Out & Account Deletion State
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Profile Layout State (10 layouts, default 'game-card')
  const activeUid = user?.uid || profile?.uid || '';
  const { data: ownLiveProfileData } = useLiveProfileData(
    activeUid,
    profile as any,
    kobanBalance,
    equipped as any
  );

  const [savedProfileLayout, setSavedProfileLayout] = useState<ProfileLayoutId>(() =>
    normalizeProfileLayout(
      profile?.profileLayout ??
        profile?.profile_layout ??
        DEFAULT_PROFILE_LAYOUT
    )
  );
  const [selectedProfileLayout, setSelectedProfileLayout] = useState<ProfileLayoutId>(() =>
    normalizeProfileLayout(
      profile?.profileLayout ??
        profile?.profile_layout ??
        DEFAULT_PROFILE_LAYOUT
    )
  );
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutMessage, setLayoutMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load saved profile_layout from D1 for the authenticated user's UID
  useEffect(() => {
    if (!activeUid) return;
    let cancelled = false;
    fetch(`/api/auth/profile-layout?uid=${encodeURIComponent(activeUid)}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.ok && (json.profile_layout || json.layout)) {
          const resolved = normalizeProfileLayout(json.profile_layout ?? json.layout);
          setSavedProfileLayout(resolved);
          setSelectedProfileLayout(resolved);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeUid]);

  const handleSaveProfileLayout = async () => {
    if (!activeUid || layoutSaving) return;
    setLayoutSaving(true);
    setLayoutMessage(null);
    try {
      const res = await saveProfileLayoutToServer(activeUid, selectedProfileLayout);
      if (!res.ok) {
        setLayoutMessage({
          type: 'error',
          text: res.error || 'Could not save profile layout.',
        });
        return;
      }
      setSavedProfileLayout(res.layout);
      setSelectedProfileLayout(res.layout);
      updateLocalProfile({
        profileLayout: res.layout,
        profile_layout: res.layout,
      });
      invalidateProfileMemoryCache(activeUid);
      setLayoutMessage({
        type: 'success',
        text: 'Profile layout saved.',
      });
    } finally {
      setLayoutSaving(false);
    }
  };

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (profile?.username) {
      setUsernameInput(profile.username);
    }
    if (profile?.customRole && ALLOWED_COSMETIC_ROLES.has(profile.customRole)) {
      setCustomRole(profile.customRole);
    }
    if (profile?.notificationPrefs) {
      setEmailKobanReceipts(profile.notificationPrefs.emailKobanReceipts !== false);
      setEmailArenaStarts(profile.notificationPrefs.emailArenaStarts !== false);
    }
  }, [
    profile?.displayName,
    profile?.username,
    profile?.customRole,
    profile?.notificationPrefs,
    user?.displayName,
  ]);

  // Debounced live username availability check
  const normalizedUsername = useMemo(
    () => usernameInput.trim().replace(/^@+/, '').toLowerCase(),
    [usernameInput]
  );
  const formatValidation = useMemo(
    () => validateUsernameFormat(normalizedUsername, user?.uid, isAdmin),
    [normalizedUsername, user?.uid, isAdmin]
  );

  useEffect(() => {
    setUsernameSavedMsg(null);
    if (!normalizedUsername) {
      setUsernameStatus('idle');
      setUsernameStatusMsg('');
      return;
    }
    if (profile?.username && normalizedUsername === profile.username.toLowerCase()) {
      setUsernameStatus('unchanged');
      setUsernameStatusMsg('This is your current username.');
      return;
    }
    if (!formatValidation.valid) {
      setUsernameStatus('invalid');
      setUsernameStatusMsg(formatValidation.error || formatValidation.reason || 'Invalid username');
      return;
    }

    let cancelled = false;
    setUsernameStatus('checking');
    setUsernameStatusMsg('Checking availability…');

    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(normalizedUsername);
      if (cancelled) return;
      if (res.available) {
        setUsernameStatus('available');
        setUsernameStatusMsg(`@${normalizedUsername} is available`);
      } else {
        setUsernameStatus('taken');
        setUsernameStatusMsg(res.reason || 'That username is already taken.');
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedUsername, formatValidation.valid, formatValidation.error, formatValidation.reason, profile?.username, checkUsernameAvailability]);

  // Open a sub-page and push a history state so phone back button closes the sub-page
  const openSubPage = useCallback(
    (subPage: SettingsSubPageId, targetId?: string) => {
      setActiveSubPage(subPage);
      setSearchQuery('');
      setSearchFocused(false);
      const nextHash = targetId ? `#${targetId}` : `#${subPage}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState({ settingsSubPage: subPage }, '', `${location.pathname}${nextHash}`);
      }
      window.scrollTo({ top: 0, behavior: smoothMode ? 'auto' : 'smooth' });

      if (targetId) {
        if (targetId === 'settings-delete-account') {
          setDeleteConfirmOpen(true);
        }
        window.setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: smoothMode ? 'auto' : 'smooth', block: 'center' });
            el.classList.add('stg-highlight-target');
            window.setTimeout(() => el.classList.remove('stg-highlight-target'), 1600);
          }
        }, 120);
      }
    },
    [location.pathname, smoothMode]
  );

  // Close the active sub-page
  const closeSubPage = useCallback(() => {
    setActiveSubPage(null);
    if (window.location.hash) {
      window.history.pushState({}, '', location.pathname);
    }
    window.scrollTo({ top: 0, behavior: smoothMode ? 'auto' : 'smooth' });
  }, [location.pathname, smoothMode]);

  // Sync sub-page with URL hash & browser/phone back button (popstate)
  useEffect(() => {
    const syncFromLocation = () => {
      const { subPage, targetId } = mapHashToSubPage(window.location.hash);
      setActiveSubPage(subPage);
      if (targetId === 'settings-delete-account') {
        setDeleteConfirmOpen(true);
      }
      if (targetId) {
        window.setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: smoothMode ? 'auto' : 'smooth', block: 'center' });
            el.classList.add('stg-highlight-target');
            window.setTimeout(() => el.classList.remove('stg-highlight-target'), 1600);
          }
        }, 100);
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [location.hash, smoothMode]);

  // Swipe-back gesture handler on sub-pages
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!activeSubPage || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!activeSubPage || !touchStartRef.current || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStartRef.current.x;
    const deltaY = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (deltaX > 68 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      closeSubPage();
    }
  };

  const hasPasswordProvider = user?.providerData.some(
    (p) => p.providerId === 'password'
  );

  // Handlers for Display Name
  const handleSaveDisplayName = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    if (trimmedName.length > 50) {
      setProfileMessage({ type: 'error', text: 'Display name must be 50 characters or fewer.' });
      return;
    }

    const reservedWord = containsReservedKeyword(trimmedName);
    if (reservedWord && !isAdmin) {
      setPendingRestrictedName(trimmedName);
      setProfileMessage({
        type: 'warning',
        text: `The name "${trimmedName}" contains an official or restricted keyword ("${reservedWord}"). Official names require administrator approval.`,
      });
      return;
    }

    setPendingRestrictedName(null);
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await updateProfile({ displayName: trimmedName });
      setProfileMessage({ type: 'success', text: 'Display name saved.' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update display name.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRequestAdminApproval = async () => {
    if (!user || !pendingRestrictedName) return;
    setRequestingApproval(true);
    try {
      const reqRef = doc(db, 'nameApprovalRequests', user.uid);
      await setDoc(reqRef, {
        uid: user.uid,
        email: user.email || '',
        currentName: profile?.displayName || user.displayName || 'Student',
        requestedName: pendingRestrictedName,
        requestedRole: customRole,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setProfileMessage({
        type: 'success',
        text: `Approval request for "${pendingRestrictedName}" sent to Boardly Administrators.`,
      });
      setPendingRestrictedName(null);
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not submit approval request.',
      });
    } finally {
      setRequestingApproval(false);
    }
  };

  // Handler for Username & Study Role (combined Save button)
  const handleSaveUsernameAndRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUsernameSaving(true);
    setUsernameSavedMsg(null);
    try {
      // 1. If username changed, claim/update it
      const usernameChanged =
        normalizedUsername &&
        (!profile?.username || normalizedUsername !== profile.username.toLowerCase());

      if (usernameChanged) {
        if (usernameStatus !== 'available') {
          setUsernameSavedMsg({
            type: 'error',
            text: usernameStatusMsg || 'Please choose an available username.',
          });
          setUsernameSaving(false);
          return;
        }
        if (!isGuest) {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/auth/username-register', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: user.uid,
              username: normalizedUsername,
              email: (user.email || profile?.email || '').toLowerCase(),
              accountType: 'registered',
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) {
            setUsernameSavedMsg({
              type: 'error',
              text: data?.error || 'Could not update username.',
            });
            setUsernameSaving(false);
            return;
          }
        }
      }

      // 2. Save strictly cosmetic customRole (client role value can never alter real permissions)
      const safeCosmeticRole = ALLOWED_COSMETIC_ROLES.has(customRole)
        ? customRole
        : COSMETIC_ROLE_OPTIONS[0];

      await updateProfile({
        ...(usernameChanged ? { username: normalizedUsername } : {}),
        customRole: safeCosmeticRole,
      });

      setUsernameStatus('unchanged');
      setUsernameSavedMsg({
        type: 'success',
        text: 'Username and study role saved.',
      });
    } catch (err) {
      setUsernameSavedMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save changes.',
      });
    } finally {
      setUsernameSaving(false);
    }
  };

  // Handler for Notification Toggles
  const handleToggleNotification = async (
    key: 'emailKobanReceipts' | 'emailArenaStarts',
    nextVal: boolean
  ) => {
    if (!user) return;
    const nextReceipts = key === 'emailKobanReceipts' ? nextVal : emailKobanReceipts;
    const nextArena = key === 'emailArenaStarts' ? nextVal : emailArenaStarts;

    if (key === 'emailKobanReceipts') setEmailKobanReceipts(nextVal);
    if (key === 'emailArenaStarts') setEmailArenaStarts(nextVal);

    setNotifSaving(true);
    setNotifMessage(null);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          notificationPrefs: {
            emailKobanReceipts: nextReceipts,
            emailArenaStarts: nextArena,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      updateLocalProfile({
        notificationPrefs: {
          emailKobanReceipts: nextReceipts,
          emailArenaStarts: nextArena,
        },
      });
      setNotifMessage({ type: 'success', text: 'Notification preferences saved.' });
    } catch (err) {
      setNotifMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save notification settings.',
      });
    } finally {
      setNotifSaving(false);
    }
  };

  // Handler for Password Change
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 6 characters.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      if (hasPasswordProvider && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated.' });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect.' });
      } else if (code === 'auth/requires-recent-login') {
        setPasswordMessage({
          type: 'error',
          text: 'Please sign out and sign back in before changing your password.',
        });
      } else {
        setPasswordMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to update password.',
        });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handler for Sign Out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    clearCachedAuthAndAdminStorage();
    try {
      await Promise.all([
        signOutUser(),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    } finally {
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  // Handler for Delete Account
  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteError(null);
    try {
      if (hasPasswordProvider && user.email && deletePassword) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        setDeleteError(
          'For security, please sign out and sign back in before deleting your account.'
        );
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError(
          err instanceof Error ? err.message : 'Failed to delete account.'
        );
      }
      setDeleting(false);
    }
  };

  // Computed display values for Main Settings rows
  const effectiveDisplayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Student';
  const effectiveUsername =
    profile?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'student';

  const roleBadgeLabel = useMemo(() => {
    if (isGuest) return 'Guest';
    if (effectivePlan.source === 'superadmin') return 'Superadmin · Unlimited';
    if (isAdmin) return 'Admin';
    if (effectivePlan.isUnlimited) return 'Pro · Unlimited';
    return customRole || 'Student';
  }, [isGuest, effectivePlan.source, effectivePlan.isUnlimited, isAdmin, customRole]);

  const planRowValue = useMemo(() => {
    if (isGuest) return 'Guest Mode';
    if (effectivePlan.source === 'superadmin') return 'Superadmin · Unlimited';
    if (effectivePlan.isUnlimited) return 'Pro · Unlimited';
    return 'Free Plan';
  }, [isGuest, effectivePlan.source, effectivePlan.isUnlimited]);

  const appearanceValueLabel = useMemo(() => {
    if (themePreference === 'light') return 'Light';
    if (themePreference === 'dark') return 'Dark';
    return 'System';
  }, [themePreference]);

  const proBadgeRowValue = useMemo(() => {
    if (!isActivePro) return 'Pro Only';
    if (!proBadgeSettings.visible) return 'Hidden';
    const found = PRO_BADGE_DESIGNS.find((d) => d.id === proBadgeSettings.design);
    return found?.name || 'Ember';
  }, [isActivePro, proBadgeSettings.visible, proBadgeSettings.design]);

  const profileLayoutRowValue = useMemo(() => {
    const found = PROFILE_LAYOUT_METADATA.find((l) => l.id === savedProfileLayout);
    return found?.name || 'Game Card';
  }, [savedProfileLayout]);

  const kobanRowValue = useMemo(() => {
    const found = KOBAN_DESIGNS.find((d) => d.id === kobanStyle.design);
    return found?.name || 'Neon K Chip';
  }, [kobanStyle.design]);

  const notificationsRowValue = useMemo(() => {
    if (emailKobanReceipts && emailArenaStarts) return 'Enabled';
    if (!emailKobanReceipts && !emailArenaStarts) return 'Critical Only';
    return 'Custom';
  }, [emailKobanReceipts, emailArenaStarts]);

  const equippedAvatarId =
    equipped?.avatar ||
    ((profile as Record<string, unknown> | null)?.avatar as string | undefined);
  const equippedFrameId = equipped?.frame;

  // Main settings rows organized by group
  const mainGroups = useMemo(
    () => [
      {
        id: 'account',
        label: 'Account',
        rows: [
          {
            id: 'plan' as SettingsSubPageId,
            label: 'Workspace / Plan',
            value: planRowValue,
            icon: Zap,
            keywords: ['workspace', 'plan', 'pro', 'subscription', 'billing', 'unlimited', 'upgrade'],
          },
          {
            id: 'email' as SettingsSubPageId,
            label: 'Account Email',
            value: isGuest ? 'Guest' : 'Verified',
            icon: Mail,
            keywords: ['email', 'address', 'verified', 'contact', 'account email'],
          },
          {
            id: 'username' as SettingsSubPageId,
            label: 'Username & Study Role',
            value: `@${effectiveUsername}`,
            icon: AtSign,
            keywords: ['username', 'handle', 'study role', 'matric', 'fsc', 'mdcat', 'ecat', 'badge'],
          },
          {
            id: 'display-name' as SettingsSubPageId,
            label: 'Display Name',
            value: effectiveDisplayName,
            icon: User,
            keywords: ['display name', 'full name', 'name', 'real name', 'approval'],
          },
        ],
      },
      {
        id: 'personalize',
        label: 'Personalize',
        rows: [
          {
            id: 'appearance' as SettingsSubPageId,
            label: 'Appearance',
            value: appearanceValueLabel,
            icon: themePreference === 'light' ? Sun : themePreference === 'dark' ? Moon : Monitor,
            keywords: ['appearance', 'theme', 'light', 'dark', 'system', 'reduce effects', 'smooth mode', 'dragon', 'hide dragon'],
          },
          {
            id: 'profile-layout' as SettingsSubPageId,
            label: 'Profile Layout',
            value: profileLayoutRowValue,
            icon: Layout,
            keywords: ['profile', 'layout', 'design', 'theme', 'banner', 'profile layout', 'game card', 'passport', 'trading card', 'retro', 'glass', 'id badge', 'loadout'],
          },
          {
            id: 'pro-badge' as SettingsSubPageId,
            label: 'Pro Badge',
            value: proBadgeRowValue,
            icon: Crown,
            keywords: ['pro badge', 'badge', '31 designs', 'ember', 'neon', 'holo', 'show my badge'],
          },
          {
            id: 'koban-icon' as SettingsSubPageId,
            label: 'Koban Icon',
            value: kobanRowValue,
            icon: Coins,
            keywords: ['koban', 'coin', 'icon', 'palette', 'glow', 'motion', 'shine', 'sparkle'],
          },
        ],
      },
      {
        id: 'general',
        label: '',
        rows: [
          {
            id: 'notifications' as SettingsSubPageId,
            label: 'Notifications',
            value: notificationsRowValue,
            icon: Bell,
            keywords: ['notifications', 'email alerts', 'koban receipts', 'test start', 'arena'],
          },
          {
            id: 'security' as SettingsSubPageId,
            label: 'Security & Two-Step Verification',
            value: profile?.twoFactorStatus?.twoFactorEnabled ? 'Enabled' : 'Off',
            icon: Shield,
            keywords: ['security', 'password', '2fa', 'two-step', 'totp', 'authenticator', 'backup codes', 'devices', 'delete account'],
          },
          {
            id: 'legal' as SettingsSubPageId,
            label: 'Legal & Privacy',
            value: LEGAL_VERSION_DISPLAY,
            icon: FileText,
            keywords: ['legal', 'privacy policy', 'terms of service', 'version'],
          },
        ],
      },
    ],
    [
      planRowValue,
      isGuest,
      effectiveUsername,
      effectiveDisplayName,
      appearanceValueLabel,
      themePreference,
      profileLayoutRowValue,
      proBadgeRowValue,
      kobanRowValue,
      notificationsRowValue,
      profile?.twoFactorStatus?.twoFactorEnabled,
    ]
  );

  // Deep sub-page search items so searching "dragon", "totp", "password", "reduce effects", "delete", etc. jumps straight into the sub-page
  const deepSearchItems: SettingsSubPageSearchItem[] = useMemo(
    () => [
      {
        id: 'deep-plan',
        label: 'View Plan Details',
        subtitle: `Account · ${planRowValue}`,
        subPage: 'plan',
        keywords: ['plan', 'workspace', 'upgrade', 'pro', 'unlimited', 'subscription', 'billing'],
      },
      {
        id: 'deep-email',
        label: 'Account Email & Verification',
        subtitle: `Account · ${user?.email || 'Guest'}`,
        subPage: 'email',
        keywords: ['email', 'verified', 'address', 'privacy'],
      },
      {
        id: 'deep-username',
        label: 'Change @username',
        subtitle: `Username & Study Role · @${effectiveUsername}`,
        subPage: 'username',
        keywords: ['username', 'handle', '@', 'unique'],
      },
      {
        id: 'deep-role',
        label: 'Academic Study Role Badge',
        subtitle: `Username & Study Role · ${customRole}`,
        subPage: 'username',
        keywords: ['study role', 'academic', 'matric', 'fsc', 'mdcat', 'ecat', 'ics', 'o levels', 'a levels'],
      },
      {
        id: 'deep-display-name',
        label: 'Display Name',
        subtitle: `Account · ${effectiveDisplayName}`,
        subPage: 'display-name',
        keywords: ['display name', 'name', 'official name', 'admin approval'],
      },
      {
        id: 'deep-theme',
        label: 'Theme (Light / Dark / System)',
        subtitle: `Appearance · Currently ${appearanceValueLabel}`,
        subPage: 'appearance',
        targetId: 'settings-theme',
        keywords: ['theme', 'light mode', 'dark mode', 'system', 'color scheme'],
      },
      {
        id: 'deep-reduce-effects',
        label: 'Reduce effects',
        subtitle: `Appearance · ${smoothMode ? 'On' : 'Off'}`,
        subPage: 'appearance',
        targetId: 'appearance-reduce-effects',
        keywords: ['reduce effects', 'smooth mode', 'blur', 'animations', 'battery', 'performance', 'low end'],
      },
      {
        id: 'deep-dragon',
        label: 'Hide dragon',
        subtitle: `Appearance · ${hideDragon ? 'Hidden' : 'Visible'}`,
        subPage: 'appearance',
        targetId: 'settings-dragon',
        keywords: ['hide dragon', 'dragon', 'mascot', 'companion', 'pet'],
      },
      {
        id: 'deep-profile-layout',
        label: 'Profile layout',
        subtitle: `Personalize · ${profileLayoutRowValue}`,
        subPage: 'profile-layout',
        keywords: ['profile', 'layout', 'design', 'theme', 'banner', 'profile layout', 'game card', 'clean social', 'dark passport', 'centered hero', 'full cover', 'trading card', 'retro pixel', 'glass', 'id badge', 'loadout showcase'],
      },
      {
        id: 'deep-pro-badge',
        label: 'Pro Badge (31 Designs & Visibility)',
        subtitle: `Personalize · ${proBadgeRowValue}`,
        subPage: 'pro-badge',
        keywords: ['pro badge', 'show my badge', 'ember', 'neon', 'holo', 'aurora', 'diamond', 'cosmic'],
      },
      {
        id: 'deep-koban',
        label: 'Koban Icon (Design, Color Palette, Glow & Motion)',
        subtitle: `Personalize · ${kobanRowValue}`,
        subPage: 'koban-icon',
        keywords: ['koban icon', 'coin', 'color palette', 'glow strength', 'motion', 'shine', 'sparkles'],
      },
      {
        id: 'deep-notif-koban',
        label: 'Daily & milestone Koban receipts',
        subtitle: `Notifications · ${emailKobanReceipts ? 'On' : 'Off'}`,
        subPage: 'notifications',
        keywords: ['koban receipts', 'daily', 'milestone', 'notifications', 'email'],
      },
      {
        id: 'deep-notif-arena',
        label: 'Test start notifications',
        subtitle: `Notifications · ${emailArenaStarts ? 'On' : 'Off'}`,
        subPage: 'notifications',
        keywords: ['test start', 'arena', 'notifications', 'live test', 'competition'],
      },
      {
        id: 'deep-password',
        label: 'Change Password',
        subtitle: 'Security · Update your login password',
        subPage: 'security',
        targetId: 'settings-password',
        keywords: ['change password', 'password', 'update password', 'current password', 'new password'],
      },
      {
        id: 'deep-totp',
        label: 'Authenticator app (TOTP) & Backup Codes',
        subtitle: 'Security · Two-step verification',
        subPage: 'security',
        targetId: 'security-totp',
        keywords: ['authenticator', 'totp', 'qr code', 'backup codes', 'regenerate', '2fa', 'two-step'],
      },
      {
        id: 'deep-email-2fa',
        label: 'Email code at login',
        subtitle: 'Security · 6-digit email login code',
        subPage: 'security',
        targetId: 'security-email-2fa',
        keywords: ['email code', 'login code', 'email 2fa', 'turn off', 'verification'],
      },
      {
        id: 'deep-devices',
        label: 'Remembered devices & Sign out of all devices',
        subtitle: 'Security · Revoke active sessions',
        subPage: 'security',
        targetId: 'security-devices',
        keywords: ['remembered devices', 'trusted devices', 'sign out of all devices', 'sessions', 'revoke'],
      },
      {
        id: 'deep-delete-account',
        label: 'Delete Account',
        subtitle: 'Security · Permanently erase account data',
        subPage: 'security',
        targetId: 'settings-delete-account',
        keywords: ['delete account', 'remove account', 'erase', 'danger'],
      },
      {
        id: 'deep-terms',
        label: 'Terms of Service & Privacy Policy',
        subtitle: `Legal & Privacy · ${LEGAL_VERSION_DISPLAY}`,
        subPage: 'legal',
        keywords: ['terms of service', 'privacy policy', 'legal', 'version 2.0', 'consent'],
      },
      {
        id: 'deep-signout',
        label: 'Sign out',
        subtitle: 'Account · End current session',
        subPage: null,
        targetId: 'settings-sign-out',
        keywords: ['sign out', 'log out', 'logout', 'exit'],
      },
    ],
    [
      planRowValue,
      user?.email,
      effectiveUsername,
      customRole,
      effectiveDisplayName,
      appearanceValueLabel,
      smoothMode,
      hideDragon,
      profileLayoutRowValue,
      proBadgeRowValue,
      kobanRowValue,
      emailKobanReceipts,
      emailArenaStarts,
    ]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return mainGroups;
    return mainGroups
      .map((group) => ({
        ...group,
        rows: group.rows.filter(
          (row) =>
            row.label.toLowerCase().includes(normalizedQuery) ||
            row.value.toLowerCase().includes(normalizedQuery) ||
            row.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))
        ),
      }))
      .filter((group) => group.rows.length > 0);
  }, [mainGroups, normalizedQuery]);

  const matchingDeepItems = useMemo(() => {
    if (!normalizedQuery) return [];
    return deepSearchItems.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))
    );
  }, [deepSearchItems, normalizedQuery]);

  if (isSigningOut) {
    return <LineLoader context="login" variant="page" immediate />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER SUB-PAGE (SLIDES IN FROM THE RIGHT)
  // ─────────────────────────────────────────────────────────────────────────
  if (activeSubPage) {
    return (
      <div
        className="stg-subpage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <PageMeta
          title={`${SUBPAGE_TITLES[activeSubPage]} — Settings | Boardly`}
          description="Manage your Boardly account, personalization, and security settings."
        />

        {/* Fixed-spec top header: 100% width, box-sizing: border-box, 12px side padding, one flex row with gap 8px */}
        <header className="stg-top-header">
          <button
            type="button"
            onClick={closeSubPage}
            className="fsm-back-btn shrink-0"
            aria-label="Back to Settings"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>

          <h1 className="stg-top-header-title">
            {SUBPAGE_TITLES[activeSubPage]}
          </h1>

          <div className="stg-top-header-slot">
            <BoardlyAvatar
              uid={user?.uid}
              equippedAvatar={equippedAvatarId}
              equippedFrameId={equippedFrameId}
              size={36}
            />
          </div>
        </header>

        <div className="stg-container pt-2">
          {/* 1. PLAN SUB-PAGE */}
          {activeSubPage === 'plan' && (
            <div className="space-y-4">
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Current Plan</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Zap size={17} className="text-[#D71921]" />
                      </span>
                      <div className="min-w-0">
                        <div className="stg-row-label font-semibold">
                          {planRowValue}
                        </div>
                        <div className="text-xs text-[var(--menu-subtext)]">
                          {effectivePlan.source === 'superadmin'
                            ? 'Superadmin permanent unlimited access'
                            : effectivePlan.isUnlimited
                              ? 'Unlimited tests, Pro badges & full analytics'
                              : 'Standard practice access'}
                        </div>
                      </div>
                    </div>
                    <span className="stg-row-value font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>

                  <Link to="/dashboard/plans" className="stg-row">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Crown size={17} />
                      </span>
                      <span className="stg-row-label">
                        {effectivePlan.isUnlimited ? 'View Plan Details' : 'Upgrade to Pro'}
                      </span>
                    </div>
                    <div className="stg-row-right">
                      <ChevronRight size={17} />
                    </div>
                  </Link>
                </div>
                <p className="stg-footnote">
                  {effectivePlan.source === 'superadmin'
                    ? 'Superadmin accounts include permanent unlimited access to all practice papers, AI tools, and Pro cosmetics.'
                    : effectivePlan.isUnlimited
                      ? 'Your Boardly Pro membership unlocks unlimited mock tests, custom Pro badges, and priority features.'
                      : 'Upgrade to Boardly Pro to unlock unlimited mock tests, custom Pro badges, and full analytics.'}
                </p>
              </div>
            </div>
          )}

          {/* 2. ACCOUNT EMAIL SUB-PAGE */}
          {activeSubPage === 'email' && (
            <div className="space-y-4">
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Email Address</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Mail size={17} />
                      </span>
                      <span className="stg-row-label font-mono text-sm">
                        {isGuest ? 'Guest session (no email linked)' : user?.email || 'No email'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      {isGuest ? 'Guest' : 'Verified'}
                    </span>
                  </div>

                  {isGuest && (
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="stg-row text-[#D71921] font-semibold"
                    >
                      <div className="stg-row-left">
                        <span className="stg-row-icon !text-[#D71921]">
                          <UserPlus size={17} />
                        </span>
                        <span className="stg-row-label font-semibold text-[#D71921]">
                          Link Email &amp; Upgrade Account
                        </span>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                  )}
                </div>
                <p className="stg-footnote">
                  Your email address is private and never shown on your public profile. It is only used for sign-in, security alerts, and official receipts.
                </p>
              </div>
            </div>
          )}

          {/* 3. DISPLAY NAME SUB-PAGE */}
          {activeSubPage === 'display-name' && (
            <form onSubmit={handleSaveDisplayName} className="space-y-4">
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Display Name</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setPendingRestrictedName(null);
                      }}
                      maxLength={50}
                      placeholder="Enter your display name"
                      className="stg-input"
                      aria-label="Display Name"
                    />
                    <span className="text-xs font-mono text-[var(--menu-subtext)] shrink-0">
                      {displayName.length}/50
                    </span>
                  </div>
                </div>
                <p className="stg-footnote">
                  Shown on your profile, leaderboards, and Commons posts. Official names (Admin, Boardly, Support, Moderator, Staff, Founder, CEO) require administrator approval.
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-semibold border space-y-2.5 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : profileMessage.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/35 text-amber-700 dark:text-amber-200'
                        : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {profileMessage.type === 'warning' ? (
                      <ShieldAlert size={15} className="shrink-0 mt-0.5 text-amber-500" />
                    ) : profileMessage.type === 'error' ? (
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    ) : (
                      <Check size={15} className="shrink-0 mt-0.5" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>

                  {pendingRestrictedName && !isAdmin && (
                    <button
                      type="button"
                      disabled={requestingApproval}
                      onClick={handleRequestAdminApproval}
                      className="stg-btn-secondary !min-h-[44px]"
                    >
                      <Send size={14} />
                      <span>
                        {requestingApproval
                          ? 'Sending Request...'
                          : 'Request Approval from Admin'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="stg-btn-primary"
              >
                {profileSaving ? 'Saving…' : 'Save Name'}
              </button>
            </form>
          )}

          {/* 4. USERNAME & STUDY ROLE SUB-PAGE */}
          {activeSubPage === 'username' && (
            <form onSubmit={handleSaveUsernameAndRole} className="space-y-5">
              {/* Username Input Group */}
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Unique Username</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-base font-mono font-bold text-[var(--menu-subtext)]">
                        @
                      </span>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        maxLength={20}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="your_username"
                        className="stg-input font-mono"
                        aria-label="Username"
                      />
                    </div>
                    <div className="shrink-0 flex items-center">
                      {usernameStatus === 'checking' && (
                        <Loader2 size={16} className="animate-spin text-[var(--menu-subtext)]" />
                      )}
                      {usernameStatus === 'available' && (
                        <Check size={16} className="text-emerald-500" />
                      )}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                        <AlertCircle size={16} className="text-[#D71921]" />
                      )}
                    </div>
                  </div>
                </div>
                <p
                  className={`stg-footnote ${
                    usernameStatus === 'available'
                      ? '!text-emerald-600 dark:!text-emerald-400 font-medium'
                      : usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? '!text-[#D71921] dark:!text-red-400 font-medium'
                        : ''
                  }`}
                >
                  {usernameStatusMsg ||
                    '3–20 characters: lowercase letters, numbers, and underscores only.'}
                </p>
              </div>

              {/* Academic Role Badge List (selectable rows with check on chosen one, not wrapping pills) */}
              <div className="stg-group">
                <div className="stg-group-label">Academic Study Role</div>
                <div className="stg-card">
                  {COSMETIC_ROLE_OPTIONS.map((roleOption) => {
                    const selected = customRole === roleOption;
                    return (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => setCustomRole(roleOption)}
                        className="stg-row"
                      >
                        <div className="stg-row-left">
                          <span className="stg-row-label">{roleOption}</span>
                        </div>
                        <div className="stg-row-right">
                          {selected && (
                            <Check size={18} className="text-[#D71921] shrink-0" strokeWidth={2.5} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="stg-footnote">
                  Your study role badge is cosmetic only and appears on your profile and Commons posts. It never changes account permissions.
                </p>
              </div>

              {usernameSavedMsg && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-semibold border flex items-center gap-2 ${
                    usernameSavedMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
                  }`}
                >
                  {usernameSavedMsg.type === 'success' ? (
                    <Check size={15} className="shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0" />
                  )}
                  <span>{usernameSavedMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={usernameSaving}
                className="stg-btn-primary"
              >
                {usernameSaving ? 'Saving…' : 'Save'}
              </button>
            </form>
          )}

          {/* 5. APPEARANCE SUB-PAGE */}
          {activeSubPage === 'appearance' && (
            <div className="space-y-5">
              {/* Theme Dropdown Group */}
              <div id="settings-theme" className="stg-group !mt-2">
                <div className="stg-group-label">Theme</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        {themePreference === 'light' ? (
                          <Sun size={17} />
                        ) : themePreference === 'dark' ? (
                          <Moon size={17} />
                        ) : (
                          <Monitor size={17} />
                        )}
                      </span>
                      <span className="stg-row-label">Theme</span>
                    </div>
                    <select
                      aria-label="Theme"
                      value={themePreference}
                      onChange={(e) =>
                        setThemePreference(e.target.value as ThemeSetting)
                      }
                      className="fsm-appearance-select"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
                <p className="stg-footnote">
                  Choose Light, Dark, or follow your device&apos;s System appearance setting.
                </p>
              </div>

              {/* Reduce Effects Group */}
              <div id="appearance-reduce-effects" className="stg-group">
                <div className="stg-group-label">Performance</div>
                <div className="stg-card">
                  <div className="stg-row" onClick={toggleSmoothMode}>
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Sparkles size={17} />
                      </span>
                      <span className="stg-row-label">Reduce effects</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={smoothMode}
                      aria-label="Reduce effects"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSmoothMode();
                      }}
                      className="stg-switch"
                    >
                      <span className="stg-switch-thumb" />
                    </button>
                  </div>
                </div>
                <p className="stg-footnote">
                  Disables slide animations, heavy glass blurs, and ambient background motion for a faster, battery-friendly experience.
                </p>
              </div>

              {/* Hide Dragon Group */}
              <div id="settings-dragon" className="stg-group">
                <div className="stg-group-label">Companion</div>
                <div className="stg-card">
                  <div
                    className="stg-row"
                    onClick={() => setHideDragon(!hideDragon)}
                  >
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Palette size={17} />
                      </span>
                      <span className="stg-row-label">Hide dragon</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hideDragon}
                      aria-label="Hide dragon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHideDragon(!hideDragon);
                      }}
                      className="stg-switch"
                    >
                      <span className="stg-switch-thumb" />
                    </button>
                  </div>
                </div>
                <p className="stg-footnote">
                  Hides the interactive companion dragon across your dashboard while keeping all your XP and evolution progress intact.
                </p>
              </div>
            </div>
          )}

          {/* 5b. PROFILE LAYOUT SUB-PAGE (Horizontally Swipeable 10 Live Preview Cards) */}
          {activeSubPage === 'profile-layout' && (
            <div className="space-y-5 pt-1">
              <div className="stg-group !mt-2">
                <div className="stg-group-label flex items-center justify-between">
                  <span>Choose Profile Layout (10 Layouts)</span>
                  <span className="text-[11px] font-mono text-[#D71921]">
                    Swipe horizontally →
                  </span>
                </div>
                <p className="stg-footnote !mt-0 !mb-3">
                  Every layout renders your equipped banner, avatar, frame, nameplate, and profile effect live. Tap a card to preview and press Save to apply everywhere your profile is shown.
                </p>

                {/* Horizontally Swipeable Carousel of 10 Live Preview Cards */}
                <div
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scrollbar-thin"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {PROFILE_LAYOUT_METADATA.map((item, idx) => {
                    const isSelected = selectedProfileLayout === item.id;
                    const isCurrentlySaved = savedProfileLayout === item.id;
                    const previewData = {
                      ...ownLiveProfileData,
                      displayName: effectiveDisplayName,
                      display_name: effectiveDisplayName,
                      username: effectiveUsername,
                      proBadge: effectiveProBadge || ownLiveProfileData.proBadge,
                      isPro: Boolean(isActivePro || ownLiveProfileData.isPro),
                      profile_layout: item.id,
                      profileLayout: item.id,
                    };

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedProfileLayout(item.id);
                          setLayoutMessage(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedProfileLayout(item.id);
                            setLayoutMessage(null);
                          }
                        }}
                        data-layout-card={item.id}
                        className={`snap-center shrink-0 w-[310px] sm:w-[360px] rounded-3xl p-3 transition-all cursor-pointer select-none flex flex-col justify-between bg-[var(--card)] border ${
                          isSelected
                            ? 'ring-2 ring-[#D71921] border-[#D71921] shadow-[0_8px_30px_rgba(215,25,33,0.2)]'
                            : 'border-[var(--border)] hover:border-[var(--text)]/30 opacity-90 hover:opacity-100'
                        }`}
                      >
                        {/* Card Header Bar with Layout Title & Check Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--muted)]">
                                #{idx + 1}
                              </span>
                              <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                                {item.name}
                              </span>
                              {isCurrentlySaved && (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#D71921] text-white shadow-sm'
                                : 'border border-[var(--border)] bg-[var(--card-2)] text-transparent'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>

                        {/* Live ProfileView Preview with User's Own Equipped Items */}
                        <div className="pointer-events-none rounded-2xl overflow-hidden border border-[var(--border)]">
                          <ProfileView
                            layout={item.id}
                            data={previewData}
                            previewMode={true}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {layoutMessage && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-semibold border flex items-center gap-2 ${
                    layoutMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
                  }`}
                >
                  {layoutMessage.type === 'success' ? (
                    <Check size={15} className="shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0" />
                  )}
                  <span>{layoutMessage.text}</span>
                </div>
              )}

              <button
                type="button"
                disabled={layoutSaving}
                onClick={() => void handleSaveProfileLayout()}
                className="stg-btn-primary"
              >
                {layoutSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}

          {/* 6. PRO BADGE SUB-PAGE */}
          {activeSubPage === 'pro-badge' && (
            <div className="pt-1">
              <ProBadgeCustomizer userDisplayName={effectiveDisplayName} />
            </div>
          )}

          {/* 7. KOBAN ICON SUB-PAGE */}
          {activeSubPage === 'koban-icon' && (
            <div className="pt-1">
              <KobanStyleCustomizer />
            </div>
          )}

          {/* 8. NOTIFICATIONS SUB-PAGE */}
          {activeSubPage === 'notifications' && (
            <div className="space-y-4">
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Email Preferences</div>
                <div className="stg-card">
                  {/* Daily & milestone Koban receipts */}
                  <div
                    className="stg-row"
                    onClick={() =>
                      !notifSaving &&
                      void handleToggleNotification(
                        'emailKobanReceipts',
                        !emailKobanReceipts
                      )
                    }
                  >
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Coins size={17} />
                      </span>
                      <span className="stg-row-label">
                        Daily &amp; milestone Koban receipts
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailKobanReceipts}
                      aria-label="Daily and milestone Koban receipts"
                      disabled={notifSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleNotification(
                          'emailKobanReceipts',
                          !emailKobanReceipts
                        );
                      }}
                      className="stg-switch"
                    >
                      <span className="stg-switch-thumb" />
                    </button>
                  </div>

                  {/* Test start notifications */}
                  <div
                    className="stg-row"
                    onClick={() =>
                      !notifSaving &&
                      void handleToggleNotification(
                        'emailArenaStarts',
                        !emailArenaStarts
                      )
                    }
                  >
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Bell size={17} />
                      </span>
                      <span className="stg-row-label">Test start notifications</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailArenaStarts}
                      aria-label="Test start notifications"
                      disabled={notifSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleNotification(
                          'emailArenaStarts',
                          !emailArenaStarts
                        );
                      }}
                      className="stg-switch"
                    >
                      <span className="stg-switch-thumb" />
                    </button>
                  </div>
                </div>
                <p className="stg-footnote">
                  Critical transactional emails — including 6-digit verification codes, password resets, and security alerts — are always sent.
                </p>
              </div>

              {notifMessage && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-semibold border flex items-center gap-2 ${
                    notifMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
                  }`}
                >
                  <Check size={15} className="shrink-0" />
                  <span>{notifMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* 9. SECURITY SUB-PAGE */}
          {activeSubPage === 'security' && (
            <div className="space-y-5">
              {/* Change Password Group */}
              <div id="settings-password" className="stg-group !mt-2">
                <div className="stg-group-label">Change Password</div>
                {isGuest ? (
                  <>
                    <div className="stg-card">
                      <button
                        type="button"
                        onClick={() => setUpgradeModalOpen(true)}
                        className="stg-row text-[#D71921] font-semibold"
                      >
                        <div className="stg-row-left">
                          <span className="stg-row-icon !text-[#D71921]">
                            <UserPlus size={17} />
                          </span>
                          <span className="stg-row-label font-semibold text-[#D71921]">
                            Upgrade guest account to set a password
                          </span>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                    </div>
                    <p className="stg-footnote">
                      Guest accounts do not have a password until upgraded with an email address.
                    </p>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div className="stg-card">
                        {hasPasswordProvider && (
                          <div className="stg-row stg-row--static">
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Current password"
                              required
                              className="stg-input"
                              aria-label="Current password"
                            />
                          </div>
                        )}
                        <div className="stg-row stg-row--static">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (min. 6 characters)"
                            required
                            minLength={6}
                            className="stg-input"
                            aria-label="New password"
                          />
                        </div>
                        <div className="stg-row stg-row--static">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                            className="stg-input"
                            aria-label="Confirm new password"
                          />
                        </div>
                      </div>

                      {passwordMessage && (
                        <div
                          className={`rounded-2xl p-3.5 text-xs font-semibold border flex items-center gap-2 ${
                            passwordMessage.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                              : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
                          }`}
                        >
                          {passwordMessage.type === 'success' ? (
                            <Check size={15} className="shrink-0" />
                          ) : (
                            <AlertCircle size={15} className="shrink-0" />
                          )}
                          <span>{passwordMessage.text}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="stg-btn-primary"
                      >
                        <Lock size={15} />
                        <span>
                          {passwordSaving ? 'Updating Password…' : 'Update Password'}
                        </span>
                      </button>
                    </form>
                    <p className="stg-footnote">
                      Use a strong password with at least 6 characters that you don&apos;t use elsewhere.
                    </p>
                  </>
                )}
              </div>

              {/* Two-Step Verification, Email Code at Login & Remembered Devices */}
              <SecuritySettingsSection />

              {/* Delete Account Group (preserved for account lifecycle & #settings-delete-account) */}
              <div id="settings-delete-account" className="stg-group">
                <div className="stg-group-label">Account Deletion</div>
                <div className="stg-card">
                  {!deleteConfirmOpen ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="stg-row stg-row--danger"
                    >
                      <div className="stg-row-left">
                        <span className="stg-row-icon">
                          <Trash2 size={17} />
                        </span>
                        <span className="stg-row-label">Delete Account</span>
                      </div>
                    </button>
                  ) : (
                    <form
                      onSubmit={handleDeleteAccount}
                      className="divide-y divide-[var(--menu-divider)]"
                    >
                      {hasPasswordProvider && (
                        <div className="stg-row stg-row--static">
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                            className="stg-input"
                          />
                        </div>
                      )}
                      <div className="stg-row stg-row--static">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE in all caps to confirm"
                          required
                          className="stg-input font-mono"
                        />
                      </div>

                      {deleteError && (
                        <div className="p-3.5 text-xs font-semibold text-[#D71921] dark:text-red-300 flex items-center gap-2">
                          <AlertCircle size={15} className="shrink-0" />
                          <span>{deleteError}</span>
                        </div>
                      )}

                      <div className="p-3.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmOpen(false);
                            setDeletePassword('');
                            setDeleteConfirmText('');
                            setDeleteError(null);
                          }}
                          className="stg-btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deleting || deleteConfirmText !== 'DELETE'}
                          className="stg-btn-primary flex-1"
                        >
                          {deleting ? 'Deleting…' : 'Confirm Delete'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <p className="stg-footnote">
                  Permanently deletes your Boardly profile, test history, streaks, and saved items. This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* 10. LEGAL & PRIVACY SUB-PAGE */}
          {activeSubPage === 'legal' && (
            <div className="space-y-4">
              <div className="stg-group !mt-2">
                <div className="stg-group-label">Documents</div>
                <div className="stg-card">
                  <Link to="/terms" className="stg-row">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <FileText size={17} />
                      </span>
                      <span className="stg-row-label">Terms of Service</span>
                    </div>
                    <div className="stg-row-right">
                      <ExternalLink size={15} />
                      <ChevronRight size={17} />
                    </div>
                  </Link>

                  <Link to="/privacy" className="stg-row">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Shield size={17} />
                      </span>
                      <span className="stg-row-label">Privacy Policy</span>
                    </div>
                    <div className="stg-row-right">
                      <ExternalLink size={15} />
                      <ChevronRight size={17} />
                    </div>
                  </Link>

                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-label">Version</span>
                    </div>
                    <span className="stg-row-value font-mono">
                      {LEGAL_VERSION_DISPLAY}
                    </span>
                  </div>

                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-label">Last Updated</span>
                    </div>
                    <span className="stg-row-value">{LEGAL_LAST_UPDATED_LABEL}</span>
                  </div>
                </div>
                <p className="stg-footnote">
                  Your continued use of Boardly is governed by our Terms of Service and Privacy Policy ({LEGAL_VERSION_DISPLAY}, updated {LEGAL_LAST_UPDATED_LABEL}).
                </p>
              </div>
            </div>
          )}
        </div>

        <GuestUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER MAIN SETTINGS PAGE (/settings)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="stg-shell">
      <PageMeta
        title="Settings — Boardly"
        description="Manage your Boardly profile, appearance, notifications, and account security."
      />

      {/* Top Header: 44px circular glass back button at top-left, centered title "Settings" */}
      <header className="stg-top-header">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}
          className="fsm-back-btn shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <h1 className="stg-top-header-title">Settings</h1>

        {/* Right slot keeps title perfectly centered */}
        <div className="stg-top-header-slot" aria-hidden="true" />
      </header>

      <div className="stg-container">
        {/* Centered 88px Avatar + Edit Pencil Badge, Name, @username, Role Pill */}
        <div className="flex flex-col items-center text-center pt-3 pb-2">
          <div className="relative inline-flex items-center justify-center overflow-visible">
            <BoardlyAvatar
              uid={user?.uid}
              equippedAvatar={equippedAvatarId}
              equippedFrameId={equippedFrameId}
              size={88}
            />
            <button
              type="button"
              onClick={() => openProfile()}
              className="fsm-edit-badge cursor-pointer"
              aria-label="Edit avatar and profile"
              title="Edit profile"
            >
              <Pencil size={13} strokeWidth={2.4} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap max-w-full px-2">
            <h2 className="text-[20px] font-bold tracking-tight text-[var(--menu-text)] leading-tight truncate max-w-[260px]">
              {effectiveDisplayName}
            </h2>
            {!isGuest && effectivePlan.isUnlimited && effectiveProBadge && (
              <ProBadge design={effectiveProBadge} size="sm" animated priority />
            )}
          </div>

          <p className="mt-0.5 text-[14px] font-medium text-[var(--menu-subtext)]">
            @{effectiveUsername}
          </p>

          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="fsm-role-pill">{roleBadgeLabel}</span>
          </div>
        </div>

        {/* Guest Upgrade Prompt Card (if guest) */}
        {isGuest && !normalizedQuery && (
          <div className="stg-group">
            <div className="stg-card">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="stg-row text-[#D71921] font-semibold"
              >
                <div className="stg-row-left">
                  <span className="stg-row-icon !text-[#D71921]">
                    <UserPlus size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="stg-row-label font-semibold text-[#D71921]">
                      Upgrade Guest Account
                    </div>
                    <div className="text-xs text-[var(--menu-subtext)] font-normal">
                      Link your email &amp; password so you never lose progress
                    </div>
                  </div>
                </div>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* Grouped Rounded Cards */}
        {filteredGroups.map((group) => (
          <div key={group.id} className="stg-group">
            {group.label && (
              <div className="stg-group-label">{group.label}</div>
            )}
            <div className="stg-card">
              {group.rows.map((row) => {
                const IconComp = row.icon;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => openSubPage(row.id)}
                    className="stg-row"
                  >
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <IconComp size={17} strokeWidth={2} />
                      </span>
                      <span className="stg-row-label">{row.label}</span>
                    </div>
                    <div className="stg-row-right">
                      {row.value && (
                        <span className="stg-row-value">{row.value}</span>
                      )}
                      <ChevronRight size={17} className="shrink-0 opacity-75" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Deep Sub-Page Search Matches */}
        {normalizedQuery && matchingDeepItems.length > 0 && (
          <div className="stg-group">
            <div className="stg-group-label">Matching Settings Inside Sub-Pages</div>
            <div className="stg-card">
              {matchingDeepItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.subPage) {
                      openSubPage(item.subPage, item.targetId);
                    } else if (item.targetId === 'settings-sign-out') {
                      setSearchQuery('');
                      const el = document.getElementById('settings-sign-out');
                      el?.scrollIntoView({ behavior: smoothMode ? 'auto' : 'smooth', block: 'center' });
                    }
                  }}
                  className="stg-row"
                >
                  <div className="stg-row-left">
                    <span className="stg-row-icon">
                      <Search size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="stg-row-label font-medium">{item.label}</div>
                      <div className="text-xs text-[var(--menu-subtext)] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="stg-row-right">
                    <ChevronRight size={17} className="shrink-0 opacity-75" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty Search State */}
        {normalizedQuery &&
          filteredGroups.length === 0 &&
          matchingDeepItems.length === 0 && (
            <div className="stg-group">
              <div className="stg-card p-6 text-center">
                <p className="text-sm font-semibold text-[var(--menu-text)]">
                  No settings found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-[var(--menu-subtext)] mt-1">
                  Try searching for theme, password, authenticator, dragon, koban, or badge.
                </p>
              </div>
            </div>
          )}

        {/* Separate Card at the End: Red "Sign out" Row */}
        {(!normalizedQuery ||
          'sign out log out logout'.includes(normalizedQuery)) && (
          <div id="settings-sign-out" className="stg-group">
            <div className="stg-card">
              <button
                type="button"
                onClick={handleSignOut}
                className="stg-row stg-row--danger"
              >
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <LogOut size={17} strokeWidth={2.1} />
                  </span>
                  <span className="stg-row-label">Sign out</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Liquid-Glass "Search settings" Pill at the Bottom */}
      <div className="stg-search-wrap">
        <div className={`fsm-search-pill ${searchFocused ? 'is-focused' : ''}`}>
          <Search
            size={18}
            className="text-[var(--menu-subtext)] shrink-0 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            aria-label="Search settings"
            className="fsm-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="w-6 h-6 rounded-full bg-[var(--menu-icon-bg)] text-[var(--menu-subtext)] hover:text-[var(--menu-text)] inline-flex items-center justify-center cursor-pointer shrink-0"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <GuestUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}

export default SettingsPage;
