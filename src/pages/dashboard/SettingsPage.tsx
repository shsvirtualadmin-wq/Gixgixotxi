import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, type FormEvent, type TouchEvent } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import {
  User,
  Lock,
  Trash2,
  Sun,
  Moon,
  Monitor,
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
import { useBoardlyUIMode, type BoardlyUIMode } from '@/utils/uiMode';
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
import {
  useSecurityStatus,
  readCachedPlanLabelForUid,
  writeCachedPlanLabelForUid,
  readCachedNotificationPrefsForUid,
  writeCachedNotificationPrefsForUid,
} from '@/hooks/useSecurityStatus';

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
  'pro-badge': 'Pro Badge',
  'koban-icon': 'Koban Icon',
  notifications: 'Notifications',
  security: 'Security',
  legal: 'Legal & Privacy',
};

function isLegacyProfileLayoutTarget(raw: string): boolean {
  const clean = raw.replace(/^#/, '').trim().toLowerCase();
  return (
    clean === 'settings-profile-layout' ||
    clean === 'profile-layout' ||
    clean === 'appearance-profile-layout' ||
    clean === 'layout'
  );
}

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
    profileLoading,
    otpVerificationState,
    isAdmin,
    isSuperAdmin,
    isCaptain,
    tokenClaims,
    refreshTokenClaims,
    isGuest,
    checkUsernameAvailability,
    updateProfile,
    updateLocalProfile,
    signOutUser,
  } = useAuth();
  const [debugClaimsRefreshing, setDebugClaimsRefreshing] = useState(false);
  const [debugCardCollapsed, setDebugCardCollapsed] = useState(true);
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting: themePreference, setTheme: setThemePreference } = useTheme();
  const { smoothMode, toggleSmoothMode } = useSmoothMode();
  const { uiMode, setUIMode, toggleUIMode, uiLite, toggleUILite } = useBoardlyUIMode();
  const { hideDragon, setHideDragon } = useDragonHiddenPreference();
  const { openProfile } = useProfileModal();
  const {
    settings: proBadgeSettings,
    isActivePro,
    effectiveProBadge,
    known: proBadgeKnown,
  } = useProBadge();
  const { style: kobanStyle, known: kobanStyleKnown } = useKobanStyle();
  const securityStatus = useSecurityStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subPage?: string }>();

  // Redirect old profile-layout routes/hashes to /profile
  useEffect(() => {
    if (
      (params.subPage && isLegacyProfileLayoutTarget(params.subPage)) ||
      (location.hash && isLegacyProfileLayoutTarget(location.hash))
    ) {
      navigate('/profile', { replace: true });
    }
  }, [params.subPage, location.hash, navigate]);

  // Sub-page navigation state (supports both /settings/:subPage and #hash)
  const [activeSubPage, setActiveSubPage] = useState<SettingsSubPageId | null>(() => {
    if (params.subPage) {
      const fromParam = mapHashToSubPage(params.subPage).subPage;
      if (fromParam) return fromParam;
    }
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

  // Notification Preferences State (SWR per-uid)
  const activeUid = user?.uid || profile?.uid || '';
  const cachedNotifPrefs = useMemo(
    () => readCachedNotificationPrefsForUid(activeUid),
    [activeUid]
  );
  const [emailKobanReceipts, setEmailKobanReceipts] = useState<boolean>(() => {
    if (profile?.notificationPrefs) {
      return profile.notificationPrefs.emailKobanReceipts !== false;
    }
    if (cachedNotifPrefs) {
      return cachedNotifPrefs.emailKobanReceipts;
    }
    return true;
  });
  const [emailArenaStarts, setEmailArenaStarts] = useState<boolean>(() => {
    if (profile?.notificationPrefs) {
      return profile.notificationPrefs.emailArenaStarts !== false;
    }
    if (cachedNotifPrefs) {
      return cachedNotifPrefs.emailArenaStarts;
    }
    return true;
  });
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
      const nextReceipts = profile.notificationPrefs.emailKobanReceipts !== false;
      const nextArena = profile.notificationPrefs.emailArenaStarts !== false;
      setEmailKobanReceipts(nextReceipts);
      setEmailArenaStarts(nextArena);
      if (activeUid) {
        writeCachedNotificationPrefsForUid(activeUid, {
          emailKobanReceipts: nextReceipts,
          emailArenaStarts: nextArena,
        });
      }
    }
  }, [
    activeUid,
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

  const baseSettingsPath = useMemo(
    () =>
      location.pathname.startsWith('/dashboard/settings')
        ? '/dashboard/settings'
        : '/settings',
    [location.pathname]
  );

  // Ensure direct entry to /settings/:subPage or /settings#subPage has /settings directly underneath in history
  const seededDirectSubPageHistoryRef = useRef(false);
  useEffect(() => {
    if (seededDirectSubPageHistoryRef.current || typeof window === 'undefined') return;
    const fromHash = mapHashToSubPage(window.location.hash);
    const fromParam = params.subPage
      ? mapHashToSubPage(params.subPage)
      : { subPage: null, targetId: null };
    const initialSubPage = fromParam.subPage || fromHash.subPage;
    if (!initialSubPage) {
      seededDirectSubPageHistoryRef.current = true;
      return;
    }
    const histState = window.history.state;
    const alreadyFromRoot = Boolean(
      histState?.fromSettingsRoot || histState?.usr?.fromSettingsRoot
    );
    seededDirectSubPageHistoryRef.current = true;
    if (!alreadyFromRoot) {
      const subPageUrl = `${baseSettingsPath}/${initialSubPage}`;
      window.history.replaceState({ settingsRoot: true }, '', baseSettingsPath);
      window.history.pushState(
        { fromSettingsRoot: true, settingsSubPage: initialSubPage },
        '',
        subPageUrl
      );
    }
  }, [baseSettingsPath, params.subPage]);

  // Open a sub-page with exactly ONE history entry (/settings/:subPage)
  const openSubPage = useCallback(
    (subPage: SettingsSubPageId, targetId?: string) => {
      setActiveSubPage(subPage);
      setSearchQuery('');
      setSearchFocused(false);
      const targetPath = `${baseSettingsPath}/${subPage}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath, { state: { fromSettingsRoot: true, targetId } });
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
    [baseSettingsPath, location.pathname, navigate, smoothMode]
  );

  // Close the active sub-page -> go strictly one level: Sub-page -> Settings
  const closeSubPage = useCallback(() => {
    setActiveSubPage(null);
    const histState = typeof window !== 'undefined' ? window.history.state : null;
    const cameFromSettingsRoot = Boolean(
      (location.state as any)?.fromSettingsRoot ||
        histState?.fromSettingsRoot ||
        histState?.usr?.fromSettingsRoot
    );
    if (cameFromSettingsRoot && typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(baseSettingsPath, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: smoothMode ? 'auto' : 'smooth' });
  }, [baseSettingsPath, location.state, navigate, smoothMode]);

  // Sync sub-page with URL path param, hash & browser/phone back button (popstate)
  useEffect(() => {
    const syncFromLocation = () => {
      const pathMatch = window.location.pathname.match(
        /^\/(?:dashboard\/)?settings\/([^/?#]+)/
      );
      const rawSeg = pathMatch?.[1] || params.subPage || '';
      const fromParam = rawSeg
        ? mapHashToSubPage(rawSeg)
        : { subPage: null, targetId: null };
      const fromHash = mapHashToSubPage(window.location.hash);
      const subPage = fromParam.subPage || fromHash.subPage;
      const targetId =
        fromParam.targetId ||
        fromHash.targetId ||
        ((location.state as any)?.targetId as string | null) ||
        null;

      // Normalize legacy #hash URL to /settings/:subPage in-place without adding extra history entry
      if (!fromParam.subPage && fromHash.subPage && typeof window !== 'undefined') {
        window.history.replaceState(
          { ...window.history.state, fromSettingsRoot: true, settingsSubPage: fromHash.subPage },
          '',
          `${baseSettingsPath}/${fromHash.subPage}`
        );
      }

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
  }, [baseSettingsPath, location.hash, location.pathname, location.state, params.subPage, smoothMode]);

  // Swipe-back gesture handler on sub-pages (ignores horizontal swipes inside the layout carousel)
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!activeSubPage || e.touches.length !== 1) return;
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest?.('[data-layout-carousel="true"]')) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!activeSubPage || !touchStartRef.current || e.changedTouches.length !== 1) return;
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest?.('[data-layout-carousel="true"]')) {
      touchStartRef.current = null;
      return;
    }
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
      writeCachedNotificationPrefsForUid(user.uid, {
        emailKobanReceipts: nextReceipts,
        emailArenaStarts: nextArena,
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
    if (isSigningOut) return;
    setIsSigningOut(true);
    if (typeof window !== 'undefined') {
      (window as any).__boardlySigningOut = true;
    }
    try {
      await signOutUser({ force: true });
      clearCachedAuthAndAdminStorage();
    } finally {
      try {
        sessionStorage.removeItem('boardly_post_login_redirect');
      } catch {
        // ignore
      }
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

  // Computed display values for Main Settings rows (load-early SWR, never show a placeholder that later changes)
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

  const planRowValue = useMemo<string | null>(() => {
    if (isGuest) return 'Guest Mode';
    if (!effectivePlan.loading) {
      const resolved =
        effectivePlan.source === 'superadmin'
          ? 'Superadmin · Unlimited'
          : effectivePlan.isUnlimited
          ? 'Pro · Unlimited'
          : 'Free Plan';
      if (activeUid) {
        writeCachedPlanLabelForUid(activeUid, resolved);
      }
      return resolved;
    }
    return readCachedPlanLabelForUid(activeUid);
  }, [isGuest, effectivePlan.loading, effectivePlan.source, effectivePlan.isUnlimited, activeUid]);

  const emailRowValue = useMemo<string | null>(() => {
    if (isGuest) return 'Guest';
    if (
      otpVerificationState.status === 'verified' ||
      Boolean(user?.emailVerified) ||
      Boolean((profile as any)?.emailVerified)
    ) {
      return 'Verified';
    }
    if (otpVerificationState.status === 'checking' || (profileLoading && !profile)) {
      return null;
    }
    return 'Unverified';
  }, [isGuest, otpVerificationState.status, user?.emailVerified, profile, profileLoading]);

  const usernameRowValue = useMemo<string | null>(() => {
    if (profile?.username) return `@${profile.username}`;
    if (!profileLoading && (user || profile)) return `@${effectiveUsername}`;
    return null;
  }, [profile, profileLoading, user, effectiveUsername]);

  const displayNameRowValue = useMemo<string | null>(() => {
    if (profile?.displayName || user?.displayName) {
      return profile?.displayName || user?.displayName || null;
    }
    if (!profileLoading && (user || profile)) return effectiveDisplayName;
    return null;
  }, [profile, profileLoading, user, effectiveDisplayName]);

  const appearanceValueLabel = useMemo(() => {
    if (themePreference === 'light') return 'Light';
    if (themePreference === 'dark') return 'Dark';
    return 'System';
  }, [themePreference]);

  const proBadgeRowValue = useMemo<string | null>(() => {
    if (isGuest) return 'Pro Only';
    if (!proBadgeKnown || effectivePlan.loading) return null;
    if (!isActivePro) return 'Pro Only';
    if (!proBadgeSettings.visible) return 'Hidden';
    const found = PRO_BADGE_DESIGNS.find((d) => d.id === proBadgeSettings.design);
    return found?.name || 'Ember';
  }, [
    isGuest,
    proBadgeKnown,
    effectivePlan.loading,
    isActivePro,
    proBadgeSettings.visible,
    proBadgeSettings.design,
  ]);

  const kobanRowValue = useMemo<string | null>(() => {
    if (!kobanStyleKnown && !isGuest) return null;
    const found = KOBAN_DESIGNS.find((d) => d.id === kobanStyle.design);
    return found?.name || 'Neon K Chip';
  }, [kobanStyleKnown, isGuest, kobanStyle.design]);

  const notificationsKnown = Boolean(
    isGuest ||
      profile?.notificationPrefs !== undefined ||
      cachedNotifPrefs !== null ||
      !profileLoading
  );

  const notificationsRowValue = useMemo<string | null>(() => {
    if (!notificationsKnown) return null;
    if (emailKobanReceipts && emailArenaStarts) return 'Enabled';
    if (!emailKobanReceipts && !emailArenaStarts) return 'Critical Only';
    return 'Custom';
  }, [notificationsKnown, emailKobanReceipts, emailArenaStarts]);

  const securityRowValue = useMemo<string | null>(() => {
    if (isGuest) return 'Off';
    if (!securityStatus.known) return null;
    return securityStatus.rowLabel;
  }, [isGuest, securityStatus.known, securityStatus.rowLabel]);

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
            value: emailRowValue,
            icon: Mail,
            keywords: ['email', 'address', 'verified', 'contact', 'account email'],
          },
          {
            id: 'username' as SettingsSubPageId,
            label: 'Username & Study Role',
            value: usernameRowValue,
            icon: AtSign,
            keywords: ['username', 'handle', 'study role', 'matric', 'fsc', 'mdcat', 'ecat', 'badge'],
          },
          {
            id: 'display-name' as SettingsSubPageId,
            label: 'Display Name',
            value: displayNameRowValue,
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
            icon: Mail,
            keywords: ['notifications', 'email alerts', 'koban receipts', 'test start', 'arena'],
          },
          {
            id: 'security' as SettingsSubPageId,
            label: 'Security & Two-Step Verification',
            value: securityRowValue,
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
      emailRowValue,
      usernameRowValue,
      displayNameRowValue,
      appearanceValueLabel,
      themePreference,
      proBadgeRowValue,
      kobanRowValue,
      notificationsRowValue,
      securityRowValue,
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
            (row.value ? row.value.toLowerCase().includes(normalizedQuery) : false) ||
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
        data-student-page="settings"
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

              {/* UI Style (boardlyUI = "classic" | "glass") */}
              <div id="settings-ui-mode" className="stg-group">
                <div className="stg-group-label">Interface Style</div>
                <div className="stg-card">
                  <div className="stg-row stg-row--static">
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Sparkles size={17} />
                      </span>
                      <span className="stg-row-label">UI Style</span>
                    </div>
                    <select
                      aria-label="UI Style"
                      value={uiMode}
                      onChange={(e) =>
                        setUIMode(e.target.value as BoardlyUIMode)
                      }
                      onDoubleClick={toggleUIMode}
                      className="fsm-appearance-select"
                    >
                      <option value="classic">Classic</option>
                      <option value="glass">Liquid Glass</option>
                    </select>
                  </div>
                  <div
                    id="settings-ui-lite"
                    className="stg-row"
                    style={{ display: uiMode === 'glass' ? undefined : 'none' }}
                    onClick={toggleUILite}
                  >
                    <div className="stg-row-left">
                      <span className="stg-row-icon">
                        <Zap size={17} />
                      </span>
                      <span className="stg-row-label">Performance mode</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={uiLite}
                      aria-label="Performance mode"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUILite();
                      }}
                      className="stg-switch"
                    >
                      <span className="stg-switch-thumb" />
                    </button>
                  </div>
                </div>
                <p className="stg-footnote">
                  Switch between the Classic interface and Liquid Glass. Performance mode disables backdrop blur and ripples in Liquid Glass (auto-enabled on devices with ≤4 GB RAM or ≤4 CPU cores).
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
                        <Mail size={17} />
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
                <div className="pt-3 text-center text-[11px] font-medium text-[var(--menu-subtext)]">
                  <Link to="/terms" className="hover:text-[var(--menu-text)] hover:underline">
                    Terms
                  </Link>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <Link to="/privacy" className="hover:text-[var(--menu-text)] hover:underline">
                    Privacy
                  </Link>
                </div>
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
    <div data-student-page="settings" className="stg-shell">
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
                      {row.value !== null ? (
                        <span className="stg-row-value">{row.value}</span>
                      ) : (
                        <span className="stg-row-value-skeleton" aria-label="Loading" />
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

        {/* Requirement 8: Token Claims & Role Debug (hidden for regular students; collapsed behind Developer info toggle for admins) */}
        {!normalizedQuery && (isAdmin || isSuperAdmin) && (
          <div id="settings-rbac-debug-card" className="stg-group">
            <div className="stg-group-label flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDebugCardCollapsed((prev) => !prev)}
                className="text-[11px] font-semibold text-[var(--menu-subtext)] hover:text-[var(--menu-text)] cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Developer info</span>
                <span>{debugCardCollapsed ? '▸' : '▾'}</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDebugCardCollapsed((prev) => !prev)}
                  className="text-[11px] font-semibold text-[var(--menu-subtext)] hover:text-[var(--menu-text)] cursor-pointer"
                >
                  {debugCardCollapsed ? 'Show' : 'Hide'}
                </button>
                {user && !isGuest && !debugCardCollapsed && (
                  <button
                    type="button"
                    disabled={debugClaimsRefreshing}
                    onClick={async () => {
                      setDebugClaimsRefreshing(true);
                      try {
                        await refreshTokenClaims(true);
                      } finally {
                        setDebugClaimsRefreshing(false);
                      }
                    }}
                    className="text-[11px] font-semibold text-[#D71921] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {debugClaimsRefreshing ? 'Refreshing…' : 'Refresh Token'}
                  </button>
                )}
              </div>
            </div>
              <div
                data-collapsed={debugCardCollapsed ? 'true' : 'false'}
                style={{ display: debugCardCollapsed ? 'none' : 'block' }}
                className="lg-collapsible stg-card p-4 space-y-2.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--menu-subtext)]">email</span>
                  <span className="text-[var(--menu-text)] font-semibold break-all text-right">
                    {user?.email || 'null'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--menu-subtext)]">uid</span>
                  <span className="text-[var(--menu-text)] break-all text-right">
                    {user?.uid || 'null'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--menu-subtext)]">email_verified</span>
                  <span className="text-[var(--menu-text)] font-semibold">
                    {String(
                      Boolean(
                        user?.emailVerified ??
                          (tokenClaims?.rawClaims as Record<string, unknown> | undefined)
                            ?.email_verified
                      )
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--menu-subtext)]">
                    isSuperAdmin / isAdmin / isCaptain
                  </span>
                  <span className="text-[var(--menu-text)] font-semibold">
                    {String(isSuperAdmin)} / {String(isAdmin)} / {String(isCaptain)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--menu-subtext)]">roleSource</span>
                  <span className="text-[var(--menu-text)] font-semibold">
                    {tokenClaims?.roleSource || tokenClaims?.diagnostics?.roleSource || 'none'}
                  </span>
                </div>

                {tokenClaims?.diagnostics && (
                  <div className="pt-2 border-t border-dashed border-[var(--menu-divider)] space-y-1.5">
                    <div className="text-[var(--menu-subtext)]">role checks</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--menu-subtext)]">
                        1. customClaims (JWT)
                      </span>
                      <span className="text-[var(--menu-text)] text-right">
                        {tokenClaims.diagnostics.checks.customClaims.passed ? 'PASS' : 'NONE'} (sa:
                        {String(tokenClaims.diagnostics.checks.customClaims.superAdmin)}, a:
                        {String(tokenClaims.diagnostics.checks.customClaims.admin)}, c:
                        {String(tokenClaims.diagnostics.checks.customClaims.captain)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--menu-subtext)]">
                        2. verifiedOwnerEmail
                      </span>
                      <span className="text-[var(--menu-text)] text-right break-all">
                        {tokenClaims.diagnostics.checks.verifiedOwnerEmail.passed ? 'PASS' : 'FAIL'} (
                        {tokenClaims.diagnostics.checks.verifiedOwnerEmail.tokenEmail || 'none'} ==={' '}
                        {tokenClaims.diagnostics.checks.verifiedOwnerEmail.expectedEmail}, verified:
                        {String(tokenClaims.diagnostics.checks.verifiedOwnerEmail.emailVerified)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--menu-subtext)]">
                        3. server /api/me/roles
                      </span>
                      <span className="text-[var(--menu-text)] text-right break-all">
                        {tokenClaims.diagnostics.checks.serverRolesApi.attempted
                          ? `HTTP ${tokenClaims.diagnostics.checks.serverRolesApi.status ?? 'ERR'} · source:${
                              tokenClaims.diagnostics.checks.serverRolesApi.effectiveSource || 'none'
                            } · minted:${String(
                              tokenClaims.diagnostics.checks.serverRolesApi.claimMintSucceeded
                            )}`
                          : 'not attempted'}
                      </span>
                    </div>
                    {tokenClaims.diagnostics.checks.serverRolesApi.error && (
                      <div className="text-[11px] text-amber-400 break-all">
                        mint note: {tokenClaims.diagnostics.checks.serverRolesApi.error}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--menu-subtext)]">
                        4. firestore users/{'{uid}'}.role
                      </span>
                      <span className="text-[var(--menu-text)] text-right">
                        {tokenClaims.diagnostics.checks.firestoreRoleDoc.inspected
                          ? `${tokenClaims.diagnostics.checks.firestoreRoleDoc.docRole ?? 'unset'} (ignored for auth)`
                          : 'not read yet (ignored for auth)'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-1 border-t border-dashed border-[var(--menu-divider)]">
                  <div className="text-[var(--menu-subtext)] mb-1">claims</div>
                  <pre className="p-2.5 rounded-xl bg-black/30 text-[11px] leading-relaxed text-[var(--menu-text)] overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(
                      tokenClaims?.rawClaims &&
                        Object.keys(tokenClaims.rawClaims).length > 0
                        ? tokenClaims.rawClaims
                        : {
                            superAdmin: tokenClaims.superAdmin,
                            admin: tokenClaims.admin,
                            captain: tokenClaims.captain,
                          },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
          </div>
        )}

        {/* Floating "Search settings" Glass Pill at the Bottom */}
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
      </div>

      <GuestUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}

export default SettingsPage;
