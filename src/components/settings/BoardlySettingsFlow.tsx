import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  AtSign,
  Award,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  ChevronRight,
  Coins,
  Compass,
  Crown,
  Flame,
  Gift,
  Globe,
  Info,
  LogOut,
  Mail,
  MessageCircle,
  Palette,
  Pencil,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Trophy,
  User,
  Users,
  Volume2,
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LANGUAGE_META,
  ORDERED_LANGUAGES,
  type AppLanguage,
} from '@/i18n';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useShowAds, setUserAdFreePreference } from '@/hooks/useShowAds';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { useSmoothMode } from '@/utils/smoothMode';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { perfMarkEnd } from '@/lib/perfMetrics';
import {
  readCachedNotificationPrefsForUid,
  writeCachedNotificationPrefsForUid,
} from '@/hooks/useSecurityStatus';
import { fetchSecuritySummary, type SecuritySummary } from '@/services/securityCenterService';
import { getDisplayName, getUsernameHandle } from '@/utils/displayName';
import {
  getEquippedLoadout,
  readSwrCache,
  writeSwrCache,
} from '@/utils/userStateSource';
import {
  buildAddAccountUrl,
  getSavedAccounts,
  upsertSavedAccount,
  type LiveSavedAccountInfo,
  type SavedAccountEntry,
} from '@/utils/savedAccounts';
import { formatPlanLabel } from '@/lib/planTier';
import { useAiCredits } from '@/hooks/useAiCredits';
import {
  deleteAllAiChatsFromFirestore,
  getSaveChatHistoryPref,
  setSaveChatHistoryPref,
} from '@/services/aiMentorsService';
import { AI_MENTORS } from '@/utils/aiMentorsLogic';
import {
  getSavedVoiceForMentor,
  loadDeviceVoices,
  setSavedVoiceForMentor,
  speakWithMentorVoice,
} from '@/utils/voiceInput';
import { SettingsPage } from './SettingsPage';
import { SettingsGroup } from './SettingsGroup';
import { SettingsProgressRow, SettingsRow } from './SettingsRow';
import { SettingsToggleRow } from './SettingsToggleRow';
import {
  AboutBoardlySheet,
  SettingsChoiceSheet,
  SettingsConfirmSheet,
  SwitchAccountSheet,
} from './SettingsSheet';

const LazySecurityCenterPages = lazy(() =>
  import('./SecurityCenterPages').then((m) => ({ default: m.SecurityCenterPages }))
);
const LazyPrivacyCenterPage = lazy(() =>
  import('./PrivacyCenterPage').then((m) => ({ default: m.PrivacyCenterPage }))
);
const LazyProBadgeCustomizer = lazy(() =>
  import('@/components/plans/ProBadgeCustomizer').then((m) => ({ default: m.ProBadgeCustomizer }))
);
const LazyPlusBadgeCustomizer = lazy(() =>
  import('@/components/plans/PlusBadgeCustomizer').then((m) => ({ default: m.PlusBadgeCustomizer }))
);
const LazyKobanStyleCustomizer = lazy(() =>
  import('@/components/koban/KobanStyleCustomizer').then((m) => ({ default: m.KobanStyleCustomizer }))
);

function SettingsSubpageSkeleton() {
  return (
    <div className="min-h-[60dvh] max-w-[680px] mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-7 w-40 rounded-full bg-[var(--surface-hover)]" />
      <div className="rounded-[28px] p-5 bg-[var(--card)] border border-[var(--border)] space-y-3">
        <div className="h-4 w-3/4 rounded bg-[var(--surface-hover)]" />
        <div className="h-4 w-1/2 rounded bg-[var(--surface-hover)]" />
        <div className="h-12 w-full rounded-2xl bg-[var(--surface-hover)]" />
      </div>
      <div className="rounded-[28px] p-5 bg-[var(--card)] border border-[var(--border)] space-y-3">
        <div className="h-4 w-2/3 rounded bg-[var(--surface-hover)]" />
        <div className="h-10 w-full rounded-2xl bg-[var(--surface-hover)]" />
      </div>
    </div>
  );
}

export const BOARDLY_APP_VERSION = 'v1.0.0';

export type SettingsSectionId =
  | 'main'
  | 'account'
  | 'account-display-name'
  | 'account-username-role'
  | 'customize'
  | 'customize-koban'
  | 'customize-pro-badge'
  | 'customize-plus-badge'
  | 'general'
  | 'usage'
  | 'notifications'
  | 'notifications-tests'
  | 'notifications-commons'
  | 'notifications-rewards'
  | 'notifications-announcements'
  | 'security'
  | 'privacy'
  | 'boardly-ai';

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

function mapRouteParamToSection(param?: string): SettingsSectionId {
  switch ((param || '').toLowerCase()) {
    case 'account':
    case 'email':
    case 'plan':
      return 'account';
    case 'display-name':
      return 'account-display-name';
    case 'username':
      return 'account-username-role';
    case 'customize':
    case 'appearance':
    case 'theme':
      return 'customize';
    case 'koban':
    case 'koban-icon':
      return 'customize-koban';
    case 'pro-badge':
      return 'customize-pro-badge';
    case 'plus-badge':
      return 'customize-plus-badge';
    case 'general':
      return 'general';
    case 'usage':
    case 'limits':
      return 'usage';
    case 'notifications':
      return 'notifications';
    case 'security':
    case 'login':
    case '2fa':
    case 'password':
    case 'sessions':
    case 'passkeys':
      return 'security';
    case 'privacy':
    case 'legal':
      return 'privacy';
    case 'ai':
    case 'boardly-ai':
      return 'boardly-ai';
    default:
      return 'main';
  }
}

function mapSectionToRoutePath(section: SettingsSectionId): string {
  switch (section) {
    case 'account':
      return '/settings/account';
    case 'account-display-name':
      return '/settings/display-name';
    case 'account-username-role':
      return '/settings/username';
    case 'customize':
      return '/settings/customize';
    case 'customize-koban':
      return '/settings/koban';
    case 'customize-pro-badge':
      return '/settings/pro-badge';
    case 'customize-plus-badge':
      return '/settings/plus-badge';
    case 'general':
      return '/settings/general';
    case 'usage':
      return '/settings/usage';
    case 'notifications':
    case 'notifications-tests':
    case 'notifications-commons':
    case 'notifications-rewards':
    case 'notifications-announcements':
      return '/settings/notifications';
    case 'security':
      return '/settings/security';
    case 'privacy':
      return '/settings/privacy';
    case 'boardly-ai':
      return '/settings/boardly-ai';
    case 'main':
    default:
      return '/settings';
  }
}

export interface BoardlySettingsFlowProps {
  /** Initial section when opened via /settings/:subPage */
  initialSubPage?: string;
  /** Back action from the root Settings screen (e.g. close More tab or navigate back) */
  onClose?: () => void;
  /** Called right before navigating to another app route */
  onAfterNavigate?: () => void;
  /** Scroll mode: 'window' for /settings page, 'self' for More tab full-screen overlay */
  scrollContainer?: 'window' | 'self';
}

export const BoardlySettingsFlow: React.FC<BoardlySettingsFlowProps> = ({
  initialSubPage,
  onClose,
  onAfterNavigate,
  scrollContainer = 'window',
}) => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    authStatus,
    profileLoading,
    isGuest,
    isAdmin,
    isSuperAdmin,
    isCaptain,
    signOutUser,
    updateProfile,
    registerCurrentAccountSwitchSession,
    refreshSavedAccountsStatus,
    switchToSavedAccount,
    removeSavedAccountSession,
  } = useAuth();
  const { isPro, isPlus, isPaid, planTier, planStatus } = useEffectivePlan();
  const { config: plansConfig } = usePlansConfig();
  const { kobanBalance, balanceLoaded, equipped: walletEquipped } = useWallet();
  const aiCredits = useAiCredits();
  const { themeSetting, setTheme } = useTheme();
  const { smoothMode, setSmoothMode } = useSmoothMode();
  const {
    language,
    systemLanguage,
    setLanguage,
    t,
    getLanguageLabel,
    formatNumber,
    formatDate,
  } = useLanguage();

  const appearanceLabels: Record<ThemeSetting, string> = useMemo(
    () => ({
      light: t('settings.themeLight'),
      dark: t('settings.themeDark'),
      system: t('settings.themeSystem'),
    }),
    [t]
  );

  const languageOptions = useMemo(() => {
    const sysNative = LANGUAGE_META[systemLanguage]?.nativeLabel || 'English';
    return [
      ...ORDERED_LANGUAGES.map((code) => ({
        value: code as AppLanguage,
        label: LANGUAGE_META[code].nativeLabel,
        lang: LANGUAGE_META[code].htmlLang,
        dir: LANGUAGE_META[code].dir,
      })),
      {
        value: 'auto' as AppLanguage,
        label: t('settings.systemDefault'),
        subtitle: t('settings.systemDefaultDesc', { language: sysNative }),
      },
    ];
  }, [systemLanguage, t]);

  const equippedLoadout = useMemo(
    () =>
      getEquippedLoadout({
        uid: user?.uid,
        equipped: walletEquipped,
        photoURL: profile?.photoURL || user?.photoURL || null,
        avatar: profile?.avatar,
        equippedAvatar: profile?.equippedAvatar,
        frame: profile?.frame,
        equippedFrame: profile?.equippedFrame,
        banner: profile?.banner,
        nameplate: profile?.nameplate,
        effect: (profile as { effect?: string } | null)?.effect,
      }),
    [user?.uid, user?.photoURL, walletEquipped, profile]
  );

  useEffect(() => {
    perfMarkEnd('menu_open');
  }, []);

  const [section, setSectionState] = useState<SettingsSectionId>(() =>
    mapRouteParamToSection(initialSubPage)
  );
  useEffect(() => {
    setSectionState(mapRouteParamToSection(initialSubPage));
  }, [initialSubPage]);
  const setSection = useCallback(
    (next: SettingsSectionId) => {
      setSectionState(next);
      if (scrollContainer === 'window' && typeof window !== 'undefined') {
        const targetPath = mapSectionToRoutePath(next);
        if (window.location.pathname !== targetPath) {
          navigate(targetPath, { replace: false });
        }
      }
    },
    [scrollContainer, navigate]
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Sheets
  const [aboutOpen, setAboutOpen] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountEntry[]>(() => getSavedAccounts());
  const [liveAccountsMap, setLiveAccountsMap] = useState<Record<string, LiveSavedAccountInfo>>({});
  const [liveAccountsLoading, setLiveAccountsLoading] = useState(false);
  const [switchAccountError, setSwitchAccountError] = useState<string | null>(null);
  const [switchingAccountUid, setSwitchingAccountUid] = useState<string | null>(null);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const [homepageSuggestions, setHomepageSuggestions] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('boardly_homepage_suggestions');
      return raw === null ? true : raw === '1';
    } catch {
      return true;
    }
  });

  // Ad-free experience preference (single reactive source of truth shared with every ad component)
  const { adFreeEnabled: effectiveAdFreeEnabled, isPaidMember: isAdFreeEligible } = useShowAds();
  const adFreeEnabled = isPaid ? effectiveAdFreeEnabled : false;

  const handleToggleAdFree = useCallback(
    async (nextVal: boolean) => {
      if (!isPaid || !user?.uid || isGuest) return;
      // 1. Immediately update shared reactive store + localStorage so every ad hides/shows synchronously
      setUserAdFreePreference(user.uid, nextVal);
      // 2. Persist to AuthContext, shared profile cache, and Firestore users/{uid} across reloads/devices
      try {
        await updateProfile({ adFreeEnabled: nextVal });
        await setDoc(
          doc(db, 'users', user.uid),
          {
            adFreeEnabled: nextVal,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[Boardly Settings] Failed to save adFreeEnabled to Firestore:', err);
      }
    },
    [isPaid, user?.uid, isGuest, updateProfile]
  );

  // Boardly AI Mentors privacy & voice controls
  const [saveAiChatHistory, setSaveAiChatHistory] = useState<boolean>(() =>
    getSaveChatHistoryPref()
  );
  const [deleteAiChatsConfirmOpen, setDeleteAiChatsConfirmOpen] = useState(false);
  const [deletingAiChats, setDeletingAiChats] = useState(false);
  const [aiDataFeedback, setAiDataFeedback] = useState<string | null>(null);
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceMentorSlug, setVoiceMentorSlug] = useState<string>('aisha');
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string>(() =>
    getSavedVoiceForMentor('aisha')
  );

  useEffect(() => {
    if (section !== 'boardly-ai' || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    let active = true;
    const sync = () => {
      if (!active) return;
      setDeviceVoices(window.speechSynthesis.getVoices());
    };
    void loadDeviceVoices().then((v) => {
      if (active) setDeviceVoices(v);
    });
    try {
      window.speechSynthesis.addEventListener('voiceschanged', sync);
    } catch {
      // ignore
    }
    return () => {
      active = false;
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', sync);
      } catch {
        // ignore
      }
    };
  }, [section]);

  // Notification preferences (persisted per user)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const cached = user?.uid ? readCachedNotificationPrefsForUid(user.uid) : null;
    return {
      testReminders: cached?.testReminders ?? true,
      commonsActivity: cached?.commonsReplies ?? true,
      streaksRewards: cached?.streakAlerts ?? true,
      announcements: cached?.announcements ?? true,
    };
  });

  // Display name & study role editing state
  const currentDisplayName = getDisplayName(profile, '');
  const isProfileIdentityLoading =
    (authStatus === 'loading' || profileLoading) &&
    !currentDisplayName &&
    !profile?.username &&
    !profile?.email;
  const currentUsernameHandle = getUsernameHandle(profile);
  const [displayNameDraft, setDisplayNameDraft] = useState(currentDisplayName);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameFeedback, setDisplayNameFeedback] = useState<string | null>(null);
  const [studyRoleDraft, setStudyRoleDraft] = useState<string>(
    profile?.customRole || ''
  );
  const [savingStudyRole, setSavingStudyRole] = useState(false);

  // Security summary (for yellow dot on Security and login row) — SWR cached for instant render
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(() =>
    user?.uid ? readSwrCache<SecuritySummary>(`sec:summary:${user.uid}`) : null
  );

  useEffect(() => {
    setSectionState(mapRouteParamToSection(initialSubPage));
  }, [initialSubPage]);

  useEffect(() => {
    setDisplayNameDraft(currentDisplayName);
  }, [currentDisplayName]);

  useEffect(() => {
    if (profile?.customRole) {
      setStudyRoleDraft(profile.customRole);
    }
  }, [profile?.customRole]);

  useEffect(() => {
    if (!user?.uid || isGuest) return;
    const cached = readSwrCache<SecuritySummary>(`sec:summary:${user.uid}`);
    if (cached) setSecuritySummary(cached);
    let active = true;
    void fetchSecuritySummary()
      .then((res) => {
        writeSwrCache(`sec:summary:${user.uid}`, res);
        if (active) setSecuritySummary(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.uid, isGuest]);

  const navigateTo = useCallback(
    (path: string) => {
      onAfterNavigate?.();
      navigate(path);
    },
    [navigate, onAfterNavigate]
  );

  const handleRootBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  }, [onClose, navigate]);

  const handleSaveDisplayName = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = displayNameDraft.trim();
    if (!cleaned || cleaned.length < 2) {
      setDisplayNameFeedback(t('settings.displayNameEmpty'));
      return;
    }
    setSavingDisplayName(true);
    setDisplayNameFeedback(null);
    try {
      await updateProfile({ displayName: cleaned, display_name: cleaned });
      setDisplayNameFeedback(t('settings.displayNameSaved'));
      window.setTimeout(() => setDisplayNameFeedback(null), 3000);
    } catch (err: any) {
      setDisplayNameFeedback(err?.message || t('common.somethingWrong'));
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleSaveStudyRole = async (nextRole: string) => {
    setStudyRoleDraft(nextRole);
    setSavingStudyRole(true);
    try {
      await updateProfile({ customRole: nextRole });
    } catch {
      // Non-fatal
    } finally {
      setSavingStudyRole(false);
    }
  };

  const handleUpdateNotifPref = useCallback(
    (key: keyof typeof notifPrefs, value: boolean) => {
      setNotifPrefs((prev) => {
        const next = { ...prev, [key]: value };
        if (user?.uid) {
          writeCachedNotificationPrefsForUid(user.uid, {
            testReminders: next.testReminders,
            commonsReplies: next.commonsActivity,
            streakAlerts: next.streaksRewards,
            announcements: next.announcements,
          });
          void setDoc(
            doc(db, 'users', user.uid),
            {
              notificationPreferences: next,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
        return next;
      });
    },
    [user?.uid]
  );

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      setSignOutConfirmOpen(false);
      onAfterNavigate?.();
      await signOutUser();
    } finally {
      setSigningOut(false);
    }
  };

  const roleLabels = useMemo(() => {
    if (authStatus === 'loading' && !profile?.role && !isSuperAdmin && !isAdmin && !isCaptain) {
      return '';
    }
    const roles: string[] = [];
    if (isSuperAdmin) roles.push('superadmin');
    else if (isAdmin) roles.push('admin');
    if (isCaptain) roles.push('captain');
    if (roles.length === 0) {
      if (isGuest) roles.push('guest');
      else if (profile?.role) roles.push(profile.role);
    }
    return roles.join(', ');
  }, [authStatus, profile?.role, isSuperAdmin, isAdmin, isCaptain, isGuest]);

  const planLabel = formatPlanLabel(planTier, {
    isGuest,
    loading: isProfileIdentityLoading,
    freeLabel: t('common.free'),
    guestLabel: t('common.guest'),
  });

  const loadLiveSavedAccounts = useCallback(async () => {
    const currentList = getSavedAccounts();
    setSavedAccounts(currentList);
    if (currentList.length === 0) {
      setLiveAccountsMap({});
      return;
    }

    setLiveAccountsLoading(true);
    try {
      const res = await refreshSavedAccountsStatus();
      const updatedList = getSavedAccounts();
      setSavedAccounts(updatedList);

      if (!res.ok) {
        const errorMap: Record<string, LiveSavedAccountInfo> = {};
        for (const acc of updatedList) {
          if (acc.uid === user?.uid) {
            errorMap[acc.uid] = {
              uid: acc.uid,
              planTier,
              status: 'active',
            };
          } else {
            errorMap[acc.uid] = {
              uid: acc.uid,
              planTier: null,
              status: 'error',
              error: res.error || null,
            };
          }
        }
        setLiveAccountsMap(errorMap);
        return;
      }

      const nextMap: Record<string, LiveSavedAccountInfo> = { ...res.accounts };
      for (const acc of updatedList) {
        if (!nextMap[acc.uid]) {
          nextMap[acc.uid] =
            acc.uid === user?.uid
              ? { uid: acc.uid, planTier, status: 'active' }
              : { uid: acc.uid, planTier: null, status: 'expired' };
        }
      }
      setLiveAccountsMap(nextMap);
    } finally {
      setLiveAccountsLoading(false);
    }
  }, [refreshSavedAccountsStatus, user?.uid, planTier]);

  useEffect(() => {
    if (!user?.uid || isGuest) {
      if (switchAccountOpen) {
        setSavedAccounts(getSavedAccounts());
      }
      return;
    }
    const updated = upsertSavedAccount({
      uid: user.uid,
      email: user.email || profile?.email || '',
      displayName: currentDisplayName || profile?.username || user.email || t('settings.account'),
      username: profile?.username || null,
      role: profile?.role || (isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'student'),
      equippedAvatar: equippedLoadout.avatar || null,
      equippedFrameId: equippedLoadout.frame || null,
    });
    setSavedAccounts(updated);
  }, [
    switchAccountOpen,
    user?.uid,
    user?.email,
    isGuest,
    profile?.email,
    profile?.username,
    profile?.role,
    isSuperAdmin,
    isAdmin,
    currentDisplayName,
    equippedLoadout.avatar,
    equippedLoadout.frame,
    t,
  ]);

  useEffect(() => {
    if (!switchAccountOpen) {
      setSwitchAccountError(null);
      return;
    }
    setSwitchAccountError(null);
    void loadLiveSavedAccounts();
  }, [switchAccountOpen, loadLiveSavedAccounts]);

  const nextResetDateLabel = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow, { month: 'short', day: 'numeric' });
  }, [formatDate]);

  // ── SUB-PAGES ──────────────────────────────────────────────────────────────
  if (section === 'security') {
    return (
      <Suspense fallback={<SettingsSubpageSkeleton />}>
        <LazySecurityCenterPages
          onBack={() => setSection('main')}
          scrollContainer={scrollContainer}
          onSummaryChange={setSecuritySummary}
        />
      </Suspense>
    );
  }

  if (section === 'privacy') {
    return (
      <Suspense fallback={<SettingsSubpageSkeleton />}>
        <LazyPrivacyCenterPage
          onBack={() => setSection('main')}
          onNavigate={navigateTo}
          onOpenAiPrivacy={() => setSection('boardly-ai')}
          scrollContainer={scrollContainer}
        />
      </Suspense>
    );
  }

  if (section === 'boardly-ai') {
    const handleConfirmDeleteAllAiChats = async () => {
      if (!user?.uid) return;
      setDeletingAiChats(true);
      setAiDataFeedback(null);
      try {
        const deleted = await deleteAllAiChatsFromFirestore(user.uid);
        setDeleteAiChatsConfirmOpen(false);
        setAiDataFeedback(
          deleted > 0
            ? `Deleted ${deleted} saved AI chat${deleted === 1 ? '' : 's'}.`
            : 'No saved AI chats were found.'
        );
      } catch (err: any) {
        setDeleteAiChatsConfirmOpen(false);
        setAiDataFeedback(err?.message || 'Could not delete AI chats. Try again.');
      } finally {
        setDeletingAiChats(false);
      }
    };

    return (
      <SettingsPage
        title={t('settings.boardlyAi')}
        onBack={() => setSection('privacy')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup label={t('ai.title')}>
          <SettingsRow
            icon={<Sparkles />}
            label={t('nav.aiMentors')}
            subtitle="Noor, Zain, Sehar, Hamza, Mahnoor & Aisha"
            onClick={() => navigateTo('/dashboard/ai')}
          />
        </SettingsGroup>

        <SettingsGroup
          label={t('ai.history')}
          helperText={t('settings.boardlyAiSub')}
        >
          <SettingsToggleRow
            icon={<MessageCircle />}
            label={t('ai.history')}
            checked={saveAiChatHistory}
            onChange={(val) => {
              setSaveAiChatHistory(val);
              setSaveChatHistoryPref(val);
            }}
          />
        </SettingsGroup>

        {typeof window !== 'undefined' && 'speechSynthesis' in window && (
          <SettingsGroup
            label="AI Voice"
            helperText="Pick a voice on your device for Listen and voice calls. Auto selects a female voice for Aisha, Noor, Sehar and Mahnoor."
          >
            <div className="px-4 py-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <select
                  aria-label="Select AI mentor"
                  value={voiceMentorSlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setVoiceMentorSlug(slug);
                    setSelectedVoiceKey(getSavedVoiceForMentor(slug));
                  }}
                  className="rounded-xl border px-2.5 py-1.5 text-[13px] font-medium"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {AI_MENTORS.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} ({m.voice})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const mentor = AI_MENTORS.find((m) => m.slug === voiceMentorSlug) || AI_MENTORS[5];
                    speakWithMentorVoice({
                      text: `Assalam-o-Alaikum! I am ${mentor.name}, ready to help you study.`,
                      mentorSlug: mentor.slug,
                      gender: mentor.voice,
                    });
                  }}
                  className="ms-auto rounded-full border px-3 py-1 text-[12px] font-semibold cursor-pointer hover:opacity-90"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  Test
                </button>
              </div>
              <select
                aria-label="Choose device voice"
                value={selectedVoiceKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVoiceKey(val);
                  setSavedVoiceForMentor(voiceMentorSlug, val);
                }}
                className="w-full rounded-xl border px-3 py-2 text-[13px]"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="">Auto (Recommended)</option>
                {deviceVoices.map((v) => {
                  const key = v.voiceURI || v.name;
                  return (
                    <option key={key} value={key}>
                      {v.name} ({v.lang})
                    </option>
                  );
                })}
              </select>
            </div>
          </SettingsGroup>
        )}

        <SettingsGroup danger>
          <SettingsRow
            icon={<Trash2 />}
            label={t('common.delete')}
            subtitle={t('ai.history')}
            tone="danger"
            chevron="none"
            onClick={() => setDeleteAiChatsConfirmOpen(true)}
          />
        </SettingsGroup>

        {aiDataFeedback && (
          <p className="px-4 text-[13px] font-medium text-start" style={{ color: 'var(--accent)' }}>
            {aiDataFeedback}
          </p>
        )}

        <SettingsConfirmSheet
          open={deleteAiChatsConfirmOpen}
          onClose={() => setDeleteAiChatsConfirmOpen(false)}
          title={t('common.delete')}
          description={t('settings.boardlyAiSub')}
          confirmLabel={t('common.delete')}
          tone="danger"
          loading={deletingAiChats}
          onConfirm={handleConfirmDeleteAllAiChats}
        />
      </SettingsPage>
    );
  }

  if (section === 'account-display-name') {
    return (
      <SettingsPage
        title={t('settings.displayName')}
        onBack={() => setSection('account')}
        scrollContainer={scrollContainer}
      >
        <form
          onSubmit={handleSaveDisplayName}
          className="rounded-[32px] p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <label
            htmlFor="settings-account-display-name"
            className="mb-2 block ps-2 text-start text-[14px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('settings.displayName')}
          </label>
          <input
            id="settings-account-display-name"
            type="text"
            value={displayNameDraft}
            onChange={(e) => setDisplayNameDraft(e.target.value)}
            maxLength={40}
            placeholder={t('settings.displayNamePlaceholder')}
            className="h-[52px] w-full rounded-full px-5 text-[16px] outline-none placeholder:text-[var(--placeholder)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <p className="mt-2.5 ps-2 text-start text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t('settings.displayNameSub')}
          </p>

          {displayNameFeedback && (
            <p className="mt-3 ps-2 text-start text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
              {displayNameFeedback}
            </p>
          )}

          <button
            type="submit"
            disabled={savingDisplayName || !displayNameDraft.trim()}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {savingDisplayName ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </SettingsPage>
    );
  }

  if (section === 'account-username-role') {
    return (
      <SettingsPage
        title={t('settings.usernameAndRole')}
        onBack={() => setSection('account')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup
          label={t('settings.username')}
          helperText={t('settings.usernameSub')}
        >
          <SettingsRow
            icon={<AtSign />}
            label={t('settings.username')}
            value={currentUsernameHandle || t('common.notSet')}
            chevron="none"
          />
        </SettingsGroup>

        <SettingsGroup label={t('settings.studyRole')}>
          {COSMETIC_ROLE_OPTIONS.map((opt) => (
            <SettingsRow
              key={opt}
              label={opt}
              value={studyRoleDraft === opt ? t('common.active') : undefined}
              actionValue={studyRoleDraft === opt}
              loading={savingStudyRole && studyRoleDraft === opt}
              chevron="none"
              onClick={() => void handleSaveStudyRole(opt)}
            />
          ))}
        </SettingsGroup>
      </SettingsPage>
    );
  }

  if (section === 'account') {
    return (
      <SettingsPage
        title={t('settings.account')}
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        {/* Centered avatar with pencil badge + display name — tapping opens /profile */}
        <div className="mb-6 flex flex-col items-center pt-2 text-center">
          <button
            type="button"
            onClick={() => navigateTo('/profile')}
            className="group relative flex flex-col items-center cursor-pointer"
            aria-label={t('nav.viewProfile')}
          >
            <div className="relative flex h-[clamp(100px,27vw,116px)] w-[clamp(100px,27vw,116px)] shrink-0 items-center justify-center">
              <BoardlyAvatar
                uid={user?.uid}
                photoURL={equippedLoadout.photoURL || undefined}
                equippedAvatar={equippedLoadout.avatar}
                equippedFrameId={equippedLoadout.frame}
                name={currentDisplayName}
                loading={authStatus === 'loading' && !user?.uid && !profile?.uid}
                size={108}
                className="!h-full !w-full [&>div]:!h-full [&>div]:!w-full [&>div>div]:!h-full [&>div>div]:!w-full [&>div>div>.z-10]:!h-[66%] [&>div>div>.z-10]:!w-[66%]"
              />
              <span
                className="absolute -end-[2px] -bottom-[2px] z-30 flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Pencil className="h-4 w-4" />
              </span>
            </div>
            {isProfileIdentityLoading ? (
              <span
                className="mt-5 inline-block h-5 w-36 animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--border)' }}
                aria-label={t('common.loading')}
              />
            ) : (
              <span
                className="mt-5 text-[20px] font-semibold leading-tight group-hover:underline"
                style={{ color: 'var(--text)' }}
              >
                {currentDisplayName || (isGuest ? t('common.guest') : t('settings.account'))}
              </span>
            )}
            {currentUsernameHandle && (
              <span className="mt-0.5 text-[14px] ltr-nums" style={{ color: 'var(--text-muted)' }}>
                {currentUsernameHandle}
              </span>
            )}
          </button>
        </div>

        <SettingsGroup>
          <SettingsRow
            icon={<Mail />}
            label={t('settings.email')}
            value={
              authStatus === 'loading' && !user?.email && !profile?.email
                ? t('common.loading')
                : user?.email ||
                  profile?.email ||
                  (isGuest || authStatus === 'unauthenticated' ? t('settings.guestBannerTitle') : '—')
            }
            chevron="none"
          />
          <SettingsRow
            icon={<AtSign />}
            label={t('settings.usernameAndRole')}
            value={currentUsernameHandle || (isProfileIdentityLoading ? t('common.loading') : t('common.notSet'))}
            onClick={() => setSection('account-username-role')}
          />
          <SettingsRow
            icon={<User />}
            label={t('settings.displayName')}
            value={currentDisplayName || (isProfileIdentityLoading ? t('common.loading') : t('common.notSet'))}
            onClick={() => setSection('account-display-name')}
          />
          <SettingsRow
            icon={<Crown />}
            label={t('settings.plansBilling')}
            value={planLabel || t('common.loading')}
            onClick={() => navigateTo('/dashboard/plan')}
          />
          {!isPaid ? (
            <SettingsRow
              icon={<Sparkles />}
              label={t('plans.upgradeToPro')}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan')}
            />
          ) : !isPlus && !isSuperAdmin ? (
            <SettingsRow
              icon={<Sparkles />}
              label={t('plans.upgradeToPlus')}
              subtitle={t('plans.aiCreditsPerDay', { count: plansConfig.plus.aiCreditsPerDay })}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-plus-card')}
            />
          ) : null}
        </SettingsGroup>

        <SettingsGroup label={t('plans.adFree')}>
          <SettingsToggleRow
            icon={<Sparkles />}
            label={t('plans.adFree')}
            subtitle={
              isPaid
                ? adFreeEnabled
                  ? t('common.on')
                  : t('common.off')
                : t('plans.freeTier')
            }
            checked={isPaid && isAdFreeEligible ? adFreeEnabled : false}
            disabled={!isPaid}
            isLast={isPaid}
            onChange={(val) => {
              void handleToggleAdFree(val);
            }}
          />
          {!isPaid && (
            <SettingsRow
              icon={<Crown />}
              label={t('plans.upgradeToPro')}
              tone="accent"
              onClick={() => navigateTo('/pricing')}
            />
          )}
        </SettingsGroup>

        <SettingsGroup danger>
          <SettingsRow
            icon={<LogOut />}
            label={t('settings.logOut')}
            tone="danger"
            chevron="none"
            onClick={() => setSignOutConfirmOpen(true)}
          />
        </SettingsGroup>

        <SettingsConfirmSheet
          open={signOutConfirmOpen}
          onClose={() => setSignOutConfirmOpen(false)}
          title={t('settings.logOutConfirmTitle')}
          description={
            isGuest
              ? t('settings.guestLogOutConfirmDesc')
              : t('settings.logOutConfirmDesc')
          }
          confirmLabel={t('settings.logOut')}
          tone="danger"
          loading={signingOut}
          onConfirm={handleConfirmSignOut}
        />
      </SettingsPage>
    );
  }

  if (section === 'customize-koban') {
    return (
      <SettingsPage
        title="Koban icon"
        onBack={() => setSection('customize')}
        scrollContainer={scrollContainer}
      >
        <div
          className="rounded-[32px] p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <Suspense fallback={<div className="h-44 rounded-2xl bg-[var(--surface-hover)] animate-pulse" />}>
            <LazyKobanStyleCustomizer />
          </Suspense>
        </div>
      </SettingsPage>
    );
  }

  if (section === 'customize-pro-badge') {
    return (
      <SettingsPage
        title="Pro badge"
        onBack={() => setSection('customize')}
        scrollContainer={scrollContainer}
      >
        <div
          className="rounded-[32px] p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <Suspense fallback={<div className="h-44 rounded-2xl bg-[var(--surface-hover)] animate-pulse" />}>
            <LazyProBadgeCustomizer userDisplayName={currentDisplayName} />
          </Suspense>
        </div>
      </SettingsPage>
    );
  }

  if (section === 'customize-plus-badge') {
    return (
      <SettingsPage
        title="PLUS badge"
        onBack={() => setSection('customize')}
        scrollContainer={scrollContainer}
      >
        <div
          className="rounded-[32px] p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <Suspense fallback={<div className="h-44 rounded-2xl bg-[var(--surface-hover)] animate-pulse" />}>
            <LazyPlusBadgeCustomizer userDisplayName={currentDisplayName} />
          </Suspense>
        </div>
      </SettingsPage>
    );
  }

  if (section === 'customize') {
    return (
      <SettingsPage
        title={t('settings.customize')}
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup>
          <SettingsRow
            icon={<Palette />}
            label={t('settings.appearance')}
            value={appearanceLabels[themeSetting]}
            chevron="down"
            onClick={() => setAppearanceSheetOpen(true)}
          />
          {isPlus && (
            <SettingsRow
              icon={<Crown />}
              label="Boardly Plus"
              subtitle={t('profile.badges')}
              onClick={() => setSection('customize-plus-badge')}
            />
          )}
          {isPro && !isPlus && (
            <SettingsRow
              icon={<Crown />}
              label="Boardly Pro"
              subtitle={t('profile.badges')}
              onClick={() => setSection('customize-pro-badge')}
            />
          )}
          <SettingsRow
            leadingElement={<KobanIcon size={24} decorative />}
            label="Kobans"
            subtitle={t('settings.customize')}
            onClick={() => setSection('customize-koban')}
          />
        </SettingsGroup>

        <SettingsGroup helperText={t('settings.smoothModeSub')}>
          <SettingsToggleRow
            icon={<Sparkles />}
            label={t('settings.smoothMode')}
            checked={smoothMode}
            onChange={(val) => setSmoothMode(val)}
          />
        </SettingsGroup>

        <SettingsChoiceSheet
          open={appearanceSheetOpen}
          onClose={() => setAppearanceSheetOpen(false)}
          title={t('settings.appearance')}
          value={themeSetting}
          options={[
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
            { value: 'system', label: t('settings.themeSystem') },
          ]}
          onSelect={(val) => setTheme(val)}
        />
      </SettingsPage>
    );
  }

  if (section === 'general') {
    return (
      <SettingsPage
        title={t('settings.general')}
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup>
          <SettingsRow
            icon={<Palette />}
            label={t('settings.appearance')}
            value={appearanceLabels[themeSetting]}
            chevron="down"
            onClick={() => setAppearanceSheetOpen(true)}
          />
          <SettingsRow
            icon={<Globe />}
            label={t('settings.appLanguage')}
            value={getLanguageLabel(language)}
            chevron="down"
            onClick={() => setLanguageSheetOpen(true)}
          />
        </SettingsGroup>

        {/* Display name inline pill input */}
        <section className="mb-6">
          <h2
            className="mb-2 ps-4 text-start text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('settings.displayName')}
          </h2>
          <form
            onSubmit={handleSaveDisplayName}
            className="rounded-[32px] p-5"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={displayNameDraft}
                onChange={(e) => setDisplayNameDraft(e.target.value)}
                maxLength={40}
                placeholder={t('settings.displayNamePlaceholder')}
                aria-label={t('settings.displayName')}
                className="h-[48px] min-w-0 flex-1 rounded-full px-5 text-[15px] outline-none placeholder:text-[var(--placeholder)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={savingDisplayName || displayNameDraft.trim() === currentDisplayName}
                className="h-[48px] shrink-0 rounded-full px-5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {savingDisplayName ? t('common.saving') : t('common.save')}
              </button>
            </div>
            {displayNameFeedback && (
              <p className="mt-2.5 ps-2 text-start text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
                {displayNameFeedback}
              </p>
            )}
          </form>
        </section>

        <SettingsGroup helperText={t('settings.generalSub')}>
          <SettingsToggleRow
            icon={<Sparkles />}
            label={t('dashboard.quickPractice')}
            checked={homepageSuggestions}
            onChange={(val) => {
              setHomepageSuggestions(val);
              try {
                localStorage.setItem('boardly_homepage_suggestions', val ? '1' : '0');
              } catch {
                // Ignore
              }
            }}
          />
        </SettingsGroup>

        <SettingsGroup label={t('plans.adFree')}>
          <SettingsToggleRow
            icon={<Sparkles />}
            label={t('plans.adFree')}
            subtitle={
              isPaid
                ? adFreeEnabled
                  ? t('common.on')
                  : t('common.off')
                : t('plans.freeTier')
            }
            checked={isPaid && isAdFreeEligible ? adFreeEnabled : false}
            disabled={!isPaid}
            isLast={isPaid}
            onChange={(val) => {
              void handleToggleAdFree(val);
            }}
          />
          {!isPaid && (
            <SettingsRow
              icon={<Crown />}
              label={t('plans.upgradeToPro')}
              tone="accent"
              onClick={() => navigateTo('/pricing')}
            />
          )}
        </SettingsGroup>

        <SettingsChoiceSheet
          open={appearanceSheetOpen}
          onClose={() => setAppearanceSheetOpen(false)}
          title={t('settings.appearance')}
          value={themeSetting}
          options={[
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
            { value: 'system', label: t('settings.themeSystem') },
          ]}
          onSelect={(val) => setTheme(val)}
        />

        <SettingsChoiceSheet
          open={languageSheetOpen}
          onClose={() => setLanguageSheetOpen(false)}
          title={t('settings.languageSheetTitle')}
          subtitle={t('settings.languageSheetSubtitle')}
          value={language}
          options={languageOptions}
          onSelect={(val) => {
            void setLanguage(val);
          }}
        />
      </SettingsPage>
    );
  }

  if (section === 'usage') {
    return (
      <SettingsPage
        title={t('settings.usageLimits')}
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup
          label="AI Mentors"
          helperText={t('settings.resetsAtMidnight')}
        >
          <SettingsProgressRow
            label={t('settings.aiCreditsRemaining')}
            percentRemaining={
              aiCredits.unlimited
                ? 100
                : Math.max(
                    0,
                    Math.min(100, Math.round((aiCredits.remaining / Math.max(1, aiCredits.limit)) * 100))
                  )
            }
            rightText={
              aiCredits.unlimited
                ? t('common.unlimited')
                : `${formatNumber(aiCredits.remaining)} / ${formatNumber(aiCredits.limit)}`
            }
            resetsText={
              aiCredits.unlimited
                ? 'Boardly Plus'
                : t('test.resetsIn', { time: aiCredits.resetCountdown })
            }
          />
          {!aiCredits.unlimited && aiCredits.plan === 'free' && (
            <SettingsRow
              icon={<Crown />}
              label={t('plans.upgradeToPro')}
              subtitle={t('plans.aiCreditsPerDay', { count: plansConfig.pro.aiCreditsPerDay })}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-pro-card')}
            />
          )}
          {!aiCredits.unlimited && aiCredits.plan === 'pro' && (
            <SettingsRow
              icon={<Sparkles />}
              label={t('plans.upgradeToPlus')}
              subtitle={t('plans.aiCreditsPerDay', { count: plansConfig.plus.aiCreditsPerDay })}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-plus-card')}
            />
          )}
        </SettingsGroup>

        <SettingsGroup
          label={t('dashboard.dailyLimits')}
          helperText={t('settings.resetsAtMidnight')}
        >
          <SettingsProgressRow
            label={t('dashboard.fullMock')}
            percentRemaining={100}
            rightText={isPaid ? t('common.unlimited') : '100%'}
            resetsText={
              isPaid
                ? formatPlanLabel(planTier, { freeLabel: t('common.free') })
                : nextResetDateLabel
            }
          />
          <SettingsProgressRow
            label={t('settings.dailyTestsUsed')}
            percentRemaining={100}
            rightText={isPaid ? t('common.unlimited') : '100%'}
            resetsText={
              isPaid
                ? formatPlanLabel(planTier, { freeLabel: t('common.free') })
                : nextResetDateLabel
            }
          />
        </SettingsGroup>

        <SettingsGroup label={t('dashboard.kobanBalance')} radius="compact">
          <button
            type="button"
            onClick={() => navigateTo('/store')}
            className="flex w-full flex-col px-5 py-4 text-start transition-colors cursor-pointer hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)]"
          >
            <span className="flex w-full items-center gap-3">
              <span className="flex shrink-0 items-center justify-center">
                <KobanIcon size={24} decorative />
              </span>
              <span
                className="min-w-0 flex-1 text-start text-[16px] font-medium leading-snug"
                style={{ color: 'var(--text)' }}
              >
                Kobans
              </span>
              <span
                className="flex-none shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold tabular-nums ltr-nums"
                style={{
                  backgroundColor: 'var(--koban-bg)',
                  border: '1px solid var(--koban-border)',
                  color: 'var(--koban)',
                }}
              >
                <KobanIcon size={16} decorative />
                {!balanceLoaded || kobanBalance === null ? (
                  <span
                    className="inline-block h-3.5 w-10 animate-pulse rounded-full"
                    style={{ backgroundColor: 'var(--skeleton)' }}
                    aria-label={t('common.loading')}
                  />
                ) : (
                  formatNumber(kobanBalance)
                )}
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0"
                style={{ color: 'var(--text-muted)' }}
                strokeWidth={1.75}
              />
            </span>
            <span
              className="mt-2 block w-full text-start text-[13px] leading-snug break-words"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('rewards.subtitle')}
            </span>
          </button>
        </SettingsGroup>
      </SettingsPage>
    );
  }

  if (
    section === 'notifications-tests' ||
    section === 'notifications-commons' ||
    section === 'notifications-rewards' ||
    section === 'notifications-announcements'
  ) {
    const categoryMeta = {
      'notifications-tests': {
        title: t('settings.notificationsStudy'),
        key: 'testReminders' as const,
        label: t('settings.notificationsStudy'),
        helper: t('settings.notificationsStudySub'),
      },
      'notifications-commons': {
        title: t('settings.notificationsCommons'),
        key: 'commonsActivity' as const,
        label: t('settings.notificationsCommons'),
        helper: t('settings.notificationsCommonsSub'),
      },
      'notifications-rewards': {
        title: t('settings.notificationsRewards'),
        key: 'streaksRewards' as const,
        label: t('settings.notificationsRewards'),
        helper: t('settings.notificationsRewardsSub'),
      },
      'notifications-announcements': {
        title: t('settings.notificationsMessages'),
        key: 'announcements' as const,
        label: t('settings.notificationsMessages'),
        helper: t('settings.notificationsMessagesSub'),
      },
    }[section];

    return (
      <SettingsPage
        title={categoryMeta.title}
        onBack={() => setSection('notifications')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup helperText={categoryMeta.helper}>
          <SettingsToggleRow
            icon={<Bell />}
            label={categoryMeta.label}
            checked={notifPrefs[categoryMeta.key]}
            onChange={(val) => handleUpdateNotifPref(categoryMeta.key, val)}
          />
        </SettingsGroup>
      </SettingsPage>
    );
  }

  if (section === 'notifications') {
    return (
      <SettingsPage
        title={t('settings.notifications')}
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup label={t('settings.notifications')}>
          <SettingsRow
            icon={<BookOpen />}
            label={t('settings.notificationsStudy')}
            value={notifPrefs.testReminders ? t('common.on') : t('common.off')}
            onClick={() => setSection('notifications-tests')}
          />
          <SettingsRow
            icon={<MessageCircle />}
            label={t('settings.notificationsCommons')}
            value={notifPrefs.commonsActivity ? t('common.on') : t('common.off')}
            onClick={() => setSection('notifications-commons')}
          />
          <SettingsRow
            icon={<Flame />}
            label={t('settings.notificationsRewards')}
            value={notifPrefs.streaksRewards ? t('common.on') : t('common.off')}
            onClick={() => setSection('notifications-rewards')}
          />
          <SettingsRow
            icon={<Bell />}
            label={t('settings.notificationsMessages')}
            value={notifPrefs.announcements ? t('common.on') : t('common.off')}
            onClick={() => setSection('notifications-announcements')}
          />
        </SettingsGroup>
      </SettingsPage>
    );
  }

  // ── MAIN SETTINGS / MORE TAB VIEW ──────────────────────────────────────────
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesSearch = (...terms: string[]) => {
    if (!normalizedSearch) return true;
    return terms.some((t) => t.toLowerCase().includes(normalizedSearch));
  };

  const kobansChip = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ltr-nums"
      style={{
        backgroundColor: 'var(--koban-bg)',
        border: '1px solid var(--koban-border)',
        color: 'var(--koban)',
      }}
    >
      <KobanIcon size={15} decorative />
      {!balanceLoaded || kobanBalance === null ? (
        <span
          className="inline-block h-3.5 w-9 animate-pulse rounded-full"
          style={{ backgroundColor: 'var(--skeleton)' }}
          aria-label={t('common.loading')}
        />
      ) : (
        formatNumber(kobanBalance)
      )}
    </span>
  );

  // Build visible rows for live search filtering
  const card1Rows = [
    matchesSearch(t('settings.account'), 'account', 'email', 'display name', 'username', 'profile', currentDisplayName) && (
      <SettingsRow
        key="account"
        leadingElement={
          <BoardlyAvatar
            uid={user?.uid}
            photoURL={equippedLoadout.photoURL || undefined}
            equippedAvatar={equippedLoadout.avatar}
            equippedFrameId={equippedLoadout.frame}
            name={currentDisplayName}
            loading={authStatus === 'loading' && !user?.uid && !profile?.uid}
            size="sm"
          />
        }
        label={t('settings.account')}
        value={currentDisplayName || (isProfileIdentityLoading ? t('common.loading') : isGuest ? t('common.guest') : undefined)}
        onClick={() => setSection('account')}
      />
    ),
    matchesSearch(t('settings.switchAccount'), 'switch account', 'add account') && (
      <SettingsRow
        key="switch"
        icon={<ArrowLeftRight />}
        label={t('settings.switchAccount')}
        onClick={() => setSwitchAccountOpen(true)}
      />
    ),
    !isPaid &&
      matchesSearch(t('plans.upgradeToPro'), 'upgrade to pro', 'pro', 'plus', 'subscription', 'plan') && (
        <SettingsRow
          key="upgrade"
          icon={<Sparkles />}
          label={t('plans.upgradeToPro')}
          tone="accent"
          onClick={() => navigateTo('/dashboard/plan')}
        />
      ),
    isPaid &&
      !isPlus &&
      !isSuperAdmin &&
      matchesSearch(t('plans.upgradeToPlus'), 'upgrade to plus', 'plus', 'pro', 'subscription', 'plan') && (
        <SettingsRow
          key="upgrade-plus"
          icon={<Sparkles />}
          label={t('plans.upgradeToPlus')}
          tone="accent"
          onClick={() => navigateTo('/dashboard/plan#boardly-plus-card')}
        />
      ),
    isPlus &&
      matchesSearch('boardly plus', 'plus', 'subscription', 'plan') && (
        <SettingsRow
          key="active-plus"
          icon={<Sparkles />}
          label={
            planStatus.isSuperAdmin
              ? `${formatPlanLabel('plus')} · ${t('common.unlimited')}`
              : `${formatPlanLabel('plus')} · ${t('plans.activeUntil', { date: planStatus.expiryFormatted || t('common.active') })}`
          }
          onClick={() => navigateTo('/dashboard/plan')}
        />
      ),
  ].filter(Boolean);

  const showAdFreeSection = matchesSearch(
    t('plans.adFree'),
    'ad-free experience',
    'ad-free',
    'ads',
    'remove ads',
    'pro',
    'plus'
  );

  const card2Rows = [
    matchesSearch(t('settings.customize'), 'customize boardly', 'appearance', 'theme', 'dark', 'light', 'koban icon', 'pro badge', 'reduce effects') && (
      <SettingsRow
        key="customize"
        icon={<Palette />}
        label={t('settings.customize')}
        onClick={() => setSection('customize')}
      />
    ),
  ].filter(Boolean);

  const card3Rows = [
    matchesSearch(t('settings.general'), t('settings.appLanguage'), 'general', 'language', 'display name', 'suggestions', 'appearance') && (
      <SettingsRow
        key="general"
        icon={<SlidersHorizontal />}
        label={t('settings.general')}
        value={getLanguageLabel(language)}
        onClick={() => setSection('general')}
      />
    ),
    matchesSearch(t('settings.usageLimits'), 'usage and limits', 'limits', 'kobans', 'quota', 'ai credits') && (
      <SettingsRow
        key="usage"
        icon={<BarChart3 />}
        label={t('settings.usageLimits')}
        onClick={() => setSection('usage')}
      />
    ),
    matchesSearch(t('settings.boardlyAi'), 'boardly ai', 'ai mentors', 'chat') && (
      <SettingsRow
        key="boardly-ai"
        icon={<Sparkles />}
        label="AI Mentors"
        onClick={() => navigateTo('/dashboard/ai')}
      />
    ),
    normalizedSearch &&
      matchesSearch(t('ai.history'), 'save chat history', 'delete all ai chats', 'ai privacy', 'ai history') && (
        <SettingsRow
          key="boardly-ai-privacy"
          icon={<Trash2 />}
          label={t('settings.boardlyAi')}
          onClick={() => setSection('boardly-ai')}
        />
      ),
    matchesSearch(t('settings.notifications'), 'notifications', 'alerts', 'reminders') && (
      <SettingsRow
        key="notifications"
        icon={<Bell />}
        label={t('settings.notifications')}
        onClick={() => setSection('notifications')}
      />
    ),
    matchesSearch(
      t('settings.security'),
      'security and login',
      'passkey',
      '2fa',
      'authenticator',
      'sessions',
      'password'
    ) && (
      <SettingsRow
        key="security"
        icon={<ShieldCheck />}
        label={t('settings.security')}
        dot={Boolean(securitySummary?.hasRecommendations)}
        onClick={() => setSection('security')}
      />
    ),
    matchesSearch(t('settings.privacy'), 'privacy and legal', 'terms', 'policy', 'data') && (
      <SettingsRow
        key="privacy"
        icon={<Shield />}
        label={t('settings.privacy')}
        onClick={() => setSection('privacy')}
      />
    ),
    matchesSearch(t('nav.commons'), 'boardly commons', 'community', 'posts', 'feed') && (
      <SettingsRow
        key="commons"
        icon={<MessageCircle />}
        label={t('nav.commons')}
        onClick={() => navigateTo('/commons')}
      />
    ),
    matchesSearch(t('nav.formulas'), 'formula vault', 'formulas', 'physics', 'maths', 'chemistry') && (
      <SettingsRow
        key="formulas"
        icon={<BookOpen />}
        label={t('nav.formulas')}
        onClick={() => navigateTo('/formulas')}
      />
    ),
    matchesSearch(t('nav.bookmarks'), 'bookmarks', 'saved', 'saved posts', 'saved formulas', 'favorites') && (
      <SettingsRow
        key="bookmarks"
        icon={<Bookmark />}
        label={t('nav.bookmarks')}
        onClick={() => navigateTo('/bookmarks')}
      />
    ),
    matchesSearch(t('nav.grandLine'), 'grand line mock tests', 'mock tests', 'exams', 'mcqs') && (
      <SettingsRow
        key="grand-line"
        icon={<Compass />}
        label={t('nav.grandLine')}
        onClick={() => navigateTo('/grand-line')}
      />
    ),
    matchesSearch(t('nav.store'), 'boardly store', 'store', 'kobans', 'shop', 'cosmetics') && (
      <SettingsRow
        key="store"
        icon={<ShoppingBag />}
        label={t('nav.store')}
        rightElement={kobansChip}
        onClick={() => navigateTo('/store')}
      />
    ),
    matchesSearch(t('grandLine.leaderboard'), 'leaderboard', 'rank', 'top students') && (
      <SettingsRow
        key="leaderboard"
        icon={<Trophy />}
        label={t('grandLine.leaderboard')}
        onClick={() => navigateTo('/leaderboard')}
      />
    ),
    matchesSearch(t('nav.rewards'), 'rewards', 'daily', 'streak', 'kobans', 'milestones') && (
      <SettingsRow
        key="rewards"
        icon={<Gift />}
        label={t('nav.rewards')}
        onClick={() => navigateTo('/rewards')}
      />
    ),
  ].filter(Boolean);

  const card4Rows = [
    (isCaptain || isAdmin || isSuperAdmin) &&
      matchesSearch('captain dashboard', 'ambassador', 'crew') && (
        <SettingsRow
          key="captain"
          icon={<Award />}
          label={t('nav.crew')}
          onClick={() => navigateTo('/dashboard/captain')}
        />
      ),
    (isAdmin || isSuperAdmin) &&
      matchesSearch(t('nav.adminPanel'), 'admin', 'users', 'moderation') && (
        <SettingsRow
          key="admin"
          icon={<Users />}
          label={t('nav.adminPanel')}
          onClick={() => navigateTo('/admin')}
        />
      ),
    isSuperAdmin &&
      matchesSearch('super admin', 'superadmin', 'health', 'system') && (
        <SettingsRow
          key="superadmin"
          icon={<Coins />}
          label="Super Admin"
          onClick={() => navigateTo('/admin/health')}
        />
      ),
  ].filter(Boolean);

  const showSignOut = matchesSearch(t('settings.logOut'), 'sign out', 'log out', 'logout', 'version');
  const hasAnyResults =
    card1Rows.length > 0 ||
    showAdFreeSection ||
    card2Rows.length > 0 ||
    card3Rows.length > 0 ||
    card4Rows.length > 0 ||
    showSignOut;

  return (
    <SettingsPage
      title={t('settings.title')}
      onBack={handleRootBack}
      scrollContainer={scrollContainer}
      rightAction={{
        icon: <Info className="h-5 w-5" strokeWidth={1.9} />,
        label: t('settings.aboutBoardly'),
        onClick: () => setAboutOpen(true),
      }}
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: t('settings.searchPlaceholder'),
      }}
    >
      {!hasAnyResults ? (
        <div
          className="rounded-[32px] px-6 py-12 text-center"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-[16px] font-medium" style={{ color: 'var(--text)' }}>
            {t('settings.noMatches', { query: searchQuery })}
          </p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {t('settings.tryAnotherTerm')}
          </p>
        </div>
      ) : (
        <>
          {card1Rows.length > 0 && <SettingsGroup>{card1Rows}</SettingsGroup>}
          {showAdFreeSection && (
            <SettingsGroup label={t('plans.adFree')}>
              <SettingsToggleRow
                icon={<Sparkles />}
                label={t('plans.adFree')}
                subtitle={
                  isPaid
                    ? adFreeEnabled
                      ? t('common.on')
                      : t('common.off')
                    : t('plans.freeTier')
                }
                checked={isPaid && isAdFreeEligible ? adFreeEnabled : false}
                disabled={!isPaid}
                isLast={isPaid}
                onChange={(val) => {
                  void handleToggleAdFree(val);
                }}
              />
              {!isPaid && (
                <SettingsRow
                  icon={<Crown />}
                  label={t('plans.upgradeToPro')}
                  tone="accent"
                  onClick={() => navigateTo('/pricing')}
                />
              )}
            </SettingsGroup>
          )}
          {card2Rows.length > 0 && <SettingsGroup>{card2Rows}</SettingsGroup>}
          {card3Rows.length > 0 && <SettingsGroup>{card3Rows}</SettingsGroup>}
          {card4Rows.length > 0 && <SettingsGroup>{card4Rows}</SettingsGroup>}

          {showSignOut && (
            <SettingsGroup
              danger
              helperText={
                isProfileIdentityLoading
                  ? undefined
                  : `${
                      user?.email ||
                      profile?.email ||
                      currentUsernameHandle ||
                      (isGuest || authStatus === 'unauthenticated' ? t('common.guest') : t('settings.account'))
                    }${roleLabels ? ` · ${roleLabels}` : ''}`
              }
            >
              <SettingsRow
                icon={<LogOut />}
                label={t('settings.logOut')}
                value={BOARDLY_APP_VERSION}
                tone="danger"
                chevron="none"
                onClick={() => setSignOutConfirmOpen(true)}
              />
            </SettingsGroup>
          )}
        </>
      )}

      {/* Sheets */}
      <AboutBoardlySheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        version={BOARDLY_APP_VERSION}
        onOpenHelp={() => navigateTo('/faq')}
        onOpenTerms={() => navigateTo('/terms')}
      />

      <SwitchAccountSheet
        open={switchAccountOpen}
        onClose={() => {
          setSwitchAccountError(null);
          setSwitchAccountOpen(false);
        }}
        uid={user?.uid}
        email={user?.email || profile?.email || ''}
        displayName={currentDisplayName}
        isGuest={isGuest}
        authLoading={authStatus === 'loading' && !user?.uid && !profile?.uid}
        avatarUrl={equippedLoadout.photoURL}
        equippedAvatar={equippedLoadout.avatar}
        equippedFrameId={equippedLoadout.frame}
        planLabel={planLabel}
        savedAccounts={savedAccounts}
        liveAccountsMap={liveAccountsMap}
        liveLoading={liveAccountsLoading}
        switchError={switchAccountError}
        switchingUid={switchingAccountUid}
        onRetryAccount={() => {
          setSwitchAccountError(null);
          void loadLiveSavedAccounts();
        }}
        onReauthAccount={(account) => {
          setSwitchAccountError(null);
          setSwitchAccountOpen(false);
          const currentPath =
            typeof window !== 'undefined' ? window.location.pathname : '/settings';
          navigateTo(
            buildAddAccountUrl({
              email: account.email || undefined,
              returnTo: currentPath,
              reason: 'session_expired',
            })
          );
        }}
        onSelectSavedAccount={async (account) => {
          if (switchingAccountUid) return;
          setSwitchAccountError(null);
          setSwitchingAccountUid(account.uid);
          try {
            if (user?.uid && !isGuest) {
              const nextList = upsertSavedAccount({
                uid: user.uid,
                email: user.email || profile?.email || '',
                displayName: currentDisplayName || profile?.username || user.email || 'Account',
                username: profile?.username || null,
                role: profile?.role || (isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'student'),
                equippedAvatar: equippedLoadout.avatar || null,
                equippedFrameId: equippedLoadout.frame || null,
              });
              setSavedAccounts(nextList);
            }

            const result = await switchToSavedAccount(account);
            setSavedAccounts(getSavedAccounts());

            if (result.ok) {
              void loadLiveSavedAccounts();
              setSwitchAccountOpen(false);
              const dest = result.redirectTo || '/dashboard';
              onAfterNavigate?.();
              navigate(dest, { replace: true });
              return;
            }

            if (result.expired) {
              setLiveAccountsMap((prev) => ({
                ...prev,
                [account.uid]: {
                  uid: account.uid,
                  planTier: null,
                  status: 'expired',
                },
              }));
              setSwitchAccountOpen(false);
              const currentPath =
                typeof window !== 'undefined' ? window.location.pathname : '/settings';
              navigateTo(
                buildAddAccountUrl({
                  email: result.email || account.email || undefined,
                  returnTo: currentPath,
                  reason: 'session_expired',
                })
              );
              return;
            }

            // Genuine server/network failure during switch -> keep sheet open and show clear inline error
            setSwitchAccountError(result.error || t('settings.accountSwitchFailed'));
          } finally {
            setSwitchingAccountUid(null);
          }
        }}
        onRemoveSavedAccount={async (removeUid) => {
          const next = await removeSavedAccountSession(removeUid);
          setSavedAccounts(next);
          setLiveAccountsMap((prev) => {
            const copy = { ...prev };
            delete copy[removeUid];
            return copy;
          });
        }}
        onAddAccount={() => {
          if (user?.uid && !isGuest) {
            void registerCurrentAccountSwitchSession();
            const nextList = upsertSavedAccount({
              uid: user.uid,
              email: user.email || profile?.email || '',
              displayName: currentDisplayName || profile?.username || user.email || 'Account',
              username: profile?.username || null,
              role: profile?.role || (isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'student'),
              equippedAvatar: equippedLoadout.avatar || null,
              equippedFrameId: equippedLoadout.frame || null,
            });
            setSavedAccounts(nextList);
          }
          const currentPath =
            typeof window !== 'undefined' ? window.location.pathname : '/settings';
          navigateTo(buildAddAccountUrl({ returnTo: currentPath }));
        }}
        onSignOut={() => setSignOutConfirmOpen(true)}
      />

      <SettingsConfirmSheet
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title={t('settings.logOutConfirmTitle')}
        description={
          isGuest
            ? t('settings.guestLogOutConfirmDesc')
            : t('settings.logOutConfirmDesc')
        }
        confirmLabel={t('settings.logOut')}
        tone="danger"
        loading={signingOut}
        onConfirm={handleConfirmSignOut}
      />
    </SettingsPage>
  );
};
