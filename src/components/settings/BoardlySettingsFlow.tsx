import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  AtSign,
  Award,
  BarChart3,
  Bell,
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
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { useSmoothMode } from '@/utils/smoothMode';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ProBadgeCustomizer } from '@/components/plans/ProBadgeCustomizer';
import { KobanStyleCustomizer } from '@/components/koban/KobanStyleCustomizer';
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
import { useAiCredits } from '@/hooks/useAiCredits';
import {
  deleteAllAiChatsFromFirestore,
  getSaveChatHistoryPref,
  setSaveChatHistoryPref,
} from '@/services/aiMentorsService';
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
import { SecurityCenterPages } from './SecurityCenterPages';
import { PrivacyCenterPage } from './PrivacyCenterPage';

export const BOARDLY_APP_VERSION = 'v1.0.0';

export type SettingsSectionId =
  | 'main'
  | 'account'
  | 'account-display-name'
  | 'account-username-role'
  | 'customize'
  | 'customize-koban'
  | 'customize-pro-badge'
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

type AppLanguage = 'en' | 'ur-latn' | 'auto';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  'ur-latn': 'Roman Urdu',
  auto: 'System default',
};

const APPEARANCE_LABELS: Record<ThemeSetting, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

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
    isGuest,
    isAdmin,
    isSuperAdmin,
    isCaptain,
    signOutUser,
    updateProfile,
  } = useAuth();
  const { isPro, isPlus, isPaid, planTier, planStatus } = useEffectivePlan();
  const { config: plansConfig } = usePlansConfig();
  const { kobanBalance, balanceLoaded, equipped: walletEquipped } = useWallet();
  const aiCredits = useAiCredits();
  const { themeSetting, setTheme } = useTheme();
  const { smoothMode, setSmoothMode } = useSmoothMode();

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

  const [section, setSection] = useState<SettingsSectionId>(() =>
    mapRouteParamToSection(initialSubPage)
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Sheets
  const [aboutOpen, setAboutOpen] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  // Preferences
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('boardly_app_language') as AppLanguage | null;
      if (saved === 'en' || saved === 'ur-latn' || saved === 'auto') return saved;
    } catch {
      // Ignore
    }
    return 'en';
  });

  const [homepageSuggestions, setHomepageSuggestions] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('boardly_homepage_suggestions');
      return raw === null ? true : raw === '1';
    } catch {
      return true;
    }
  });

  // Ad-free experience preference (ON by default for active Pro/Plus; synced to user profile across devices)
  const [adFreeEnabled, setAdFreeEnabled] = useState<boolean>(() => {
    if (typeof profile?.adFreeEnabled === 'boolean') {
      return profile.adFreeEnabled;
    }
    try {
      if (user?.uid) {
        const cached = localStorage.getItem(`boardly_ad_free_${user.uid}`);
        if (cached === '1') return true;
        if (cached === '0') return false;
      }
    } catch {
      // Ignore
    }
    return true;
  });

  useEffect(() => {
    if (typeof profile?.adFreeEnabled === 'boolean') {
      setAdFreeEnabled(profile.adFreeEnabled);
    }
  }, [profile?.adFreeEnabled]);

  const handleToggleAdFree = useCallback(
    async (nextVal: boolean) => {
      if (!isPaid) return;
      setAdFreeEnabled(nextVal);
      try {
        if (user?.uid) {
          localStorage.setItem(`boardly_ad_free_${user.uid}`, nextVal ? '1' : '0');
        }
        window.dispatchEvent(
          new CustomEvent('boardly:ad-free-changed', {
            detail: { adFreeEnabled: nextVal },
          })
        );
      } catch {
        // Ignore
      }
      try {
        await updateProfile({ adFreeEnabled: nextVal });
        if (user?.uid && !isGuest) {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              adFreeEnabled: nextVal,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {
        // Non-fatal
      }
    },
    [isPaid, user?.uid, isGuest, updateProfile]
  );

  // Boardly AI Mentors privacy controls
  const [saveAiChatHistory, setSaveAiChatHistory] = useState<boolean>(() =>
    getSaveChatHistoryPref()
  );
  const [deleteAiChatsConfirmOpen, setDeleteAiChatsConfirmOpen] = useState(false);
  const [deletingAiChats, setDeletingAiChats] = useState(false);
  const [aiDataFeedback, setAiDataFeedback] = useState<string | null>(null);

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
  const currentDisplayName = getDisplayName(profile, 'Student');
  const currentUsernameHandle = getUsernameHandle(profile);
  const [displayNameDraft, setDisplayNameDraft] = useState(currentDisplayName);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameFeedback, setDisplayNameFeedback] = useState<string | null>(null);
  const [studyRoleDraft, setStudyRoleDraft] = useState<string>(
    profile?.customRole || 'FSc Pre-Medical (12th)'
  );
  const [savingStudyRole, setSavingStudyRole] = useState(false);

  // Security summary (for yellow dot on Security and login row) — SWR cached for instant render
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(() =>
    user?.uid ? readSwrCache<SecuritySummary>(`sec:summary:${user.uid}`) : null
  );

  useEffect(() => {
    setSection(mapRouteParamToSection(initialSubPage));
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
      setDisplayNameFeedback('Display name must be at least 2 characters.');
      return;
    }
    setSavingDisplayName(true);
    setDisplayNameFeedback(null);
    try {
      await updateProfile({ displayName: cleaned, display_name: cleaned });
      setDisplayNameFeedback('Display name updated everywhere.');
      window.setTimeout(() => setDisplayNameFeedback(null), 3000);
    } catch (err: any) {
      setDisplayNameFeedback(err?.message || 'Could not update display name.');
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
    const roles: string[] = [];
    if (isSuperAdmin) roles.push('superadmin');
    else if (isAdmin) roles.push('admin');
    if (isCaptain) roles.push('captain');
    if (roles.length === 0) roles.push(isGuest ? 'guest' : 'student');
    return roles.join(', ');
  }, [isSuperAdmin, isAdmin, isCaptain, isGuest]);

  const planLabel = isPlus
    ? 'Boardly Plus'
    : isPro
    ? 'Boardly Pro'
    : isGuest
    ? 'Guest'
    : 'Free';

  const nextResetDateLabel = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // ── SUB-PAGES ──────────────────────────────────────────────────────────────
  if (section === 'security') {
    return (
      <SecurityCenterPages
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
        onSummaryChange={setSecuritySummary}
      />
    );
  }

  if (section === 'privacy') {
    return (
      <PrivacyCenterPage
        onBack={() => setSection('main')}
        onNavigate={navigateTo}
        onOpenAiPrivacy={() => setSection('boardly-ai')}
        scrollContainer={scrollContainer}
      />
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
        title="Boardly AI"
        onBack={() => setSection('privacy')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup label="Mentors">
          <SettingsRow
            icon={<Sparkles />}
            label="Open Boardly AI Mentors"
            subtitle="Noor, Zain, Sehar, Hamza & Mahnoor"
            onClick={() => navigateTo('/dashboard/ai')}
          />
        </SettingsGroup>

        <SettingsGroup
          label="Chat history & privacy"
          helperText="When turned off, every Boardly AI Mentor chat behaves as a temporary chat and is not saved to your history."
        >
          <SettingsToggleRow
            icon={<MessageCircle />}
            label="Save chat history"
            checked={saveAiChatHistory}
            onChange={(val) => {
              setSaveAiChatHistory(val);
              setSaveChatHistoryPref(val);
            }}
          />
        </SettingsGroup>

        <SettingsGroup danger>
          <SettingsRow
            icon={<Trash2 />}
            label="Delete all AI chats"
            subtitle="Permanently clears your saved AI Mentor conversations"
            tone="danger"
            chevron="none"
            onClick={() => setDeleteAiChatsConfirmOpen(true)}
          />
        </SettingsGroup>

        {aiDataFeedback && (
          <p className="px-4 text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
            {aiDataFeedback}
          </p>
        )}

        <SettingsConfirmSheet
          open={deleteAiChatsConfirmOpen}
          onClose={() => setDeleteAiChatsConfirmOpen(false)}
          title="Delete all AI chats?"
          description="This permanently removes all saved Boardly AI Mentor conversations from your account. This action cannot be undone."
          confirmLabel="Delete all chats"
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
        title="Display name"
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
            className="mb-2 block pl-2 text-[14px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Public display name
          </label>
          <input
            id="settings-account-display-name"
            type="text"
            value={displayNameDraft}
            onChange={(e) => setDisplayNameDraft(e.target.value)}
            maxLength={40}
            placeholder="Enter your public display name"
            className="h-[52px] w-full rounded-full px-5 text-[16px] outline-none placeholder:text-[var(--placeholder)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <p className="mt-2.5 pl-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Shown on your profile, leaderboard, posts, and comments. Your handle stays {currentUsernameHandle || '@username'}.
          </p>

          {displayNameFeedback && (
            <p className="mt-3 pl-2 text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
              {displayNameFeedback}
            </p>
          )}

          <button
            type="submit"
            disabled={savingDisplayName || !displayNameDraft.trim()}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {savingDisplayName ? 'Saving…' : 'Save display name'}
          </button>
        </form>
      </SettingsPage>
    );
  }

  if (section === 'account-username-role') {
    return (
      <SettingsPage
        title="Username & study role"
        onBack={() => setSection('account')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup
          label="Username"
          helperText="Your handle is always shown with an @ prefix and used for mentions and profile links."
        >
          <SettingsRow
            icon={<AtSign />}
            label="Username"
            value={currentUsernameHandle || 'Not set'}
            chevron="none"
          />
        </SettingsGroup>

        <SettingsGroup label="Study role">
          {COSMETIC_ROLE_OPTIONS.map((opt) => (
            <SettingsRow
              key={opt}
              label={opt}
              value={studyRoleDraft === opt ? 'Selected' : undefined}
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
        title="Account"
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        {/* Centered avatar with pencil badge + display name — tapping opens /profile */}
        <div className="mb-6 flex flex-col items-center pt-2 text-center">
          <button
            type="button"
            onClick={() => navigateTo('/profile')}
            className="group relative flex flex-col items-center cursor-pointer"
            aria-label="Open your profile"
          >
            <div className="relative">
              <BoardlyAvatar
                uid={user?.uid}
                src={equippedLoadout.photoURL || undefined}
                equippedAvatar={equippedLoadout.avatar}
                equippedFrameId={equippedLoadout.frame}
                name={currentDisplayName}
                size="xl"
              />
              <span
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </span>
            </div>
            <span
              className="mt-3 text-[20px] font-semibold leading-tight group-hover:underline"
              style={{ color: 'var(--text)' }}
            >
              {currentDisplayName}
            </span>
            {currentUsernameHandle && (
              <span className="mt-0.5 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                {currentUsernameHandle}
              </span>
            )}
          </button>
        </div>

        <SettingsGroup>
          <SettingsRow
            icon={<Mail />}
            label="Email"
            value={user?.email || profile?.email || 'Guest account'}
            chevron="none"
          />
          <SettingsRow
            icon={<AtSign />}
            label="Username & study role"
            value={currentUsernameHandle || 'Set up'}
            onClick={() => setSection('account-username-role')}
          />
          <SettingsRow
            icon={<User />}
            label="Display name"
            value={currentDisplayName}
            onClick={() => setSection('account-display-name')}
          />
          <SettingsRow
            icon={<Crown />}
            label="Subscription"
            value={planLabel}
            onClick={() => navigateTo('/dashboard/plan')}
          />
          {!isPaid ? (
            <SettingsRow
              icon={<Sparkles />}
              label="Upgrade to Pro"
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan')}
            />
          ) : !isPlus && !isSuperAdmin ? (
            <SettingsRow
              icon={<Sparkles />}
              label="Upgrade to Plus"
              subtitle={`${plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day (2x Pro)`}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-plus-card')}
            />
          ) : null}
        </SettingsGroup>

        <SettingsGroup
          label="Ad-free experience"
          helperText={
            isPaid
              ? 'Ads are hidden because you are on Pro/Plus. You can turn this off anytime if you want to see ads.'
              : 'Upgrade to Boardly Pro or Plus to enjoy an ad-free experience across all pages.'
          }
        >
          <SettingsToggleRow
            icon={<Sparkles />}
            label="Ad-free experience"
            subtitle={
              isPaid
                ? 'Ads are hidden because you are on Pro/Plus'
                : 'Locked on Free tier'
            }
            checked={isPaid ? adFreeEnabled : false}
            disabled={!isPaid}
            isLast={isPaid}
            onChange={(val) => {
              void handleToggleAdFree(val);
            }}
          />
          {!isPaid && (
            <SettingsRow
              icon={<Crown />}
              label="Upgrade to remove ads"
              tone="accent"
              onClick={() => navigateTo('/pricing')}
            />
          )}
        </SettingsGroup>

        <SettingsGroup danger>
          <SettingsRow
            icon={<LogOut />}
            label="Sign out"
            tone="danger"
            chevron="none"
            onClick={() => setSignOutConfirmOpen(true)}
          />
        </SettingsGroup>

        <SettingsConfirmSheet
          open={signOutConfirmOpen}
          onClose={() => setSignOutConfirmOpen(false)}
          title="Sign out of Boardly?"
          description="You can sign back in anytime with your email, username, Google account, or passkey."
          confirmLabel="Sign out"
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
          <KobanStyleCustomizer />
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
          <ProBadgeCustomizer userDisplayName={currentDisplayName} />
        </div>
      </SettingsPage>
    );
  }

  if (section === 'customize') {
    return (
      <SettingsPage
        title="Customize Boardly"
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup>
          <SettingsRow
            icon={<Palette />}
            label="Appearance"
            value={APPEARANCE_LABELS[themeSetting]}
            chevron="down"
            onClick={() => setAppearanceSheetOpen(true)}
          />
          {isPaid && (
            <SettingsRow
              icon={<Crown />}
              label={isPlus ? 'Plus & Pro badge' : 'Pro badge'}
              subtitle={`Customize how your ${isPlus ? 'Plus' : 'Pro'} badge looks`}
              onClick={() => setSection('customize-pro-badge')}
            />
          )}
          <SettingsRow
            leadingElement={<KobanIcon size={24} decorative />}
            label="Koban icon"
            subtitle="Customize your Koban coin style"
            onClick={() => setSection('customize-koban')}
          />
        </SettingsGroup>

        <SettingsGroup helperText="Turns off heavy animations and decorative blur effects for smoother scrolling and lower battery usage.">
          <SettingsToggleRow
            icon={<Sparkles />}
            label="Reduce effects"
            checked={smoothMode}
            onChange={(val) => setSmoothMode(val)}
          />
        </SettingsGroup>

        <SettingsChoiceSheet
          open={appearanceSheetOpen}
          onClose={() => setAppearanceSheetOpen(false)}
          title="Appearance"
          value={themeSetting}
          options={[
            { value: 'light', label: 'Light', subtitle: 'Clean bright surfaces' },
            { value: 'dark', label: 'Dark', subtitle: 'Low-glare dark surfaces' },
            { value: 'system', label: 'System', subtitle: 'Match your device setting' },
          ]}
          onSelect={(val) => setTheme(val)}
        />
      </SettingsPage>
    );
  }

  if (section === 'general') {
    return (
      <SettingsPage
        title="General"
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup>
          <SettingsRow
            icon={<Palette />}
            label="Appearance"
            value={APPEARANCE_LABELS[themeSetting]}
            chevron="down"
            onClick={() => setAppearanceSheetOpen(true)}
          />
          <SettingsRow
            icon={<Globe />}
            label="App language"
            value={LANGUAGE_LABELS[language]}
            chevron="down"
            onClick={() => setLanguageSheetOpen(true)}
          />
        </SettingsGroup>

        {/* Display name inline pill input */}
        <section className="mb-6">
          <h2
            className="mb-2 pl-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            Display name
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
                placeholder="Your public display name"
                aria-label="Display name"
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
                {savingDisplayName ? 'Saving…' : 'Save'}
              </button>
            </div>
            {displayNameFeedback && (
              <p className="mt-2.5 pl-2 text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
                {displayNameFeedback}
              </p>
            )}
          </form>
        </section>

        <SettingsGroup helperText="Show recommended mock tests, weak-chapter drills, and study tips on your dashboard.">
          <SettingsToggleRow
            icon={<Sparkles />}
            label="Homepage suggestions"
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

        <SettingsGroup
          label="Ad-free experience"
          helperText={
            isPaid
              ? 'Ads are hidden because you are on Pro/Plus. You can turn this off anytime if you want to see ads.'
              : 'Upgrade to Boardly Pro or Plus to enjoy an ad-free experience across all pages.'
          }
        >
          <SettingsToggleRow
            icon={<Sparkles />}
            label="Ad-free experience"
            subtitle={
              isPaid
                ? 'Ads are hidden because you are on Pro/Plus'
                : 'Locked on Free tier'
            }
            checked={isPaid ? adFreeEnabled : false}
            disabled={!isPaid}
            isLast={isPaid}
            onChange={(val) => {
              void handleToggleAdFree(val);
            }}
          />
          {!isPaid && (
            <SettingsRow
              icon={<Crown />}
              label="Upgrade to remove ads"
              tone="accent"
              onClick={() => navigateTo('/pricing')}
            />
          )}
        </SettingsGroup>

        <SettingsChoiceSheet
          open={appearanceSheetOpen}
          onClose={() => setAppearanceSheetOpen(false)}
          title="Appearance"
          value={themeSetting}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          onSelect={(val) => setTheme(val)}
        />

        <SettingsChoiceSheet
          open={languageSheetOpen}
          onClose={() => setLanguageSheetOpen(false)}
          title="App language"
          value={language}
          options={[
            { value: 'en', label: 'English' },
            { value: 'ur-latn', label: 'Roman Urdu' },
            { value: 'auto', label: 'System default' },
          ]}
          onSelect={(val) => {
            setLanguage(val);
            try {
              localStorage.setItem('boardly_app_language', val);
            } catch {
              // Ignore
            }
          }}
        />
      </SettingsPage>
    );
  }

  if (section === 'usage') {
    return (
      <SettingsPage
        title="Usage and limits"
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup
          label="Boardly AI Mentor"
          helperText={
            aiCredits.unlimited
              ? 'Superadmin access includes unlimited AI Mentor credits with Quick, Balanced, Deep, and Max thinking.'
              : aiCredits.plan === 'plus'
              ? `Boardly Plus · Daily limit: ${aiCredits.limit} credits/day (2x Pro) · Deep & Max thinking unlocked · resets at midnight PKT.`
              : aiCredits.plan === 'pro'
              ? `Boardly Pro · Daily limit: ${aiCredits.limit} credits/day · Deep & Max thinking unlocked · resets at midnight PKT.`
              : `Free plan · Daily limit: ${aiCredits.limit} credits/day (Quick & Balanced) · Deep & Max locked on Free · resets at midnight PKT.`
          }
        >
          <SettingsProgressRow
            label="AI Mentor credits"
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
                ? 'Unlimited'
                : `${aiCredits.remaining} of ${aiCredits.limit} left`
            }
            resetsText={
              aiCredits.unlimited
                ? 'Superadmin'
                : `Resets in ${aiCredits.resetCountdown} (PKT)`
            }
          />
          <SettingsRow
            icon={<Sparkles />}
            label="Deep & Max thinking"
            value={
              aiCredits.unlimited || aiCredits.plan === 'pro' || aiCredits.plan === 'plus'
                ? 'Unlocked'
                : 'Locked on Free'
            }
            chevron="none"
          />
          {!aiCredits.unlimited && aiCredits.plan === 'free' && (
            <SettingsRow
              icon={<Crown />}
              label="Upgrade to Pro"
              subtitle={`Unlock ${plansConfig.pro.aiCreditsPerDay} AI Mentor credits/day with Deep & Max (or ${plansConfig.plus.aiCreditsPerDay}/day on Plus)`}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-pro-card')}
            />
          )}
          {!aiCredits.unlimited && aiCredits.plan === 'pro' && (
            <SettingsRow
              icon={<Sparkles />}
              label="Upgrade to Plus"
              subtitle={`Get ${plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day (2x Pro)`}
              tone="accent"
              onClick={() => navigateTo('/dashboard/plan#boardly-plus-card')}
            />
          )}
        </SettingsGroup>

        <SettingsGroup
          label={
            planTier === 'plus'
              ? 'Plus plan allowances'
              : isPaid
              ? 'Pro plan allowances'
              : 'Daily free plan limits'
          }
          helperText={
            planTier === 'plus'
              ? `Your Boardly Plus membership includes everything in Pro plus ${plansConfig.plus.aiCreditsPerDay} daily AI Mentor credits with Deep & Max thinking.`
              : isPaid
              ? `Your Boardly Pro membership includes full access to Grand Line Mock Tests, Formula Vault, and ${plansConfig.pro.aiCreditsPerDay} daily AI Mentor credits with Deep & Max thinking.`
              : `Free plan limits reset daily. Upgrade to Pro (${plansConfig.pro.aiCreditsPerDay} AI credits/day) or Plus (${plansConfig.plus.aiCreditsPerDay} AI credits/day) for unlimited mock tests.`
          }
        >
          <SettingsProgressRow
            label="Mock tests"
            percentRemaining={100}
            rightText={isPaid ? 'Unlimited' : '100% remaining'}
            resetsText={
              planTier === 'plus'
                ? 'Included with Plus'
                : isPaid
                ? 'Included with Pro'
                : `Resets ${nextResetDateLabel}`
            }
          />
          <SettingsProgressRow
            label="Practice sets"
            percentRemaining={100}
            rightText={isPaid ? 'Unlimited' : '100% remaining'}
            resetsText={
              planTier === 'plus'
                ? 'Included with Plus'
                : isPaid
                ? 'Included with Pro'
                : `Resets ${nextResetDateLabel}`
            }
          />
        </SettingsGroup>

        <SettingsGroup label="Balance" radius="compact">
          <button
            type="button"
            onClick={() => navigateTo('/store')}
            className="flex w-full flex-col px-5 py-4 text-left transition-colors cursor-pointer hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)]"
          >
            <span className="flex w-full items-center gap-3">
              <span className="flex shrink-0 items-center justify-center">
                <KobanIcon size={24} decorative />
              </span>
              <span
                className="min-w-0 flex-1 text-left text-[16px] font-medium leading-snug"
                style={{ color: 'var(--text)' }}
              >
                Kobans
              </span>
              <span
                className="flex-none shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold tabular-nums"
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
                    aria-label="Loading Kobans balance"
                  />
                ) : (
                  kobanBalance.toLocaleString()
                )}
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0"
                style={{ color: 'var(--text-muted)' }}
                strokeWidth={1.75}
              />
            </span>
            <span
              className="mt-2 block w-full text-left text-[13px] leading-snug break-words"
              style={{ color: 'var(--text-muted)' }}
            >
              Earn Kobans from daily claims, streaks, and mock tests
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
        title: 'Test reminders',
        key: 'testReminders' as const,
        label: 'Allow test reminders',
        helper: 'Receive reminders for scheduled Grand Line mock tests and unfinished practice drills.',
      },
      'notifications-commons': {
        title: 'Commons activity',
        key: 'commonsActivity' as const,
        label: 'Allow Commons notifications',
        helper: 'Get notified when someone replies to your posts, comments, or mentions you in Boardly Commons.',
      },
      'notifications-rewards': {
        title: 'Streaks & rewards',
        key: 'streaksRewards' as const,
        label: 'Allow streak & reward alerts',
        helper: 'Get reminded to claim daily Kobans and keep your study streak active.',
      },
      'notifications-announcements': {
        title: 'Announcements',
        key: 'announcements' as const,
        label: 'Allow Boardly announcements',
        helper: 'Hear about new past papers, exam schedules, and major Boardly releases.',
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
        title="Notifications"
        onBack={() => setSection('main')}
        scrollContainer={scrollContainer}
      >
        <SettingsGroup label="Notification categories">
          <SettingsRow
            icon={<BookOpen />}
            label="Test reminders"
            value={notifPrefs.testReminders ? 'On' : 'Off'}
            onClick={() => setSection('notifications-tests')}
          />
          <SettingsRow
            icon={<MessageCircle />}
            label="Commons activity"
            value={notifPrefs.commonsActivity ? 'On' : 'Off'}
            onClick={() => setSection('notifications-commons')}
          />
          <SettingsRow
            icon={<Flame />}
            label="Streaks & rewards"
            value={notifPrefs.streaksRewards ? 'On' : 'Off'}
            onClick={() => setSection('notifications-rewards')}
          />
          <SettingsRow
            icon={<Bell />}
            label="Announcements"
            value={notifPrefs.announcements ? 'On' : 'Off'}
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold"
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
          aria-label="Loading Kobans balance"
        />
      ) : (
        kobanBalance.toLocaleString()
      )}
    </span>
  );

  // Build visible rows for live search filtering
  const card1Rows = [
    matchesSearch('account', 'email', 'display name', 'username', 'profile', currentDisplayName) && (
      <SettingsRow
        key="account"
        leadingElement={
          <BoardlyAvatar
            uid={user?.uid}
            src={equippedLoadout.photoURL || undefined}
            equippedAvatar={equippedLoadout.avatar}
            equippedFrameId={equippedLoadout.frame}
            name={currentDisplayName}
            size="sm"
          />
        }
        label="Account"
        value={currentDisplayName}
        onClick={() => setSection('account')}
      />
    ),
    matchesSearch('switch account', 'add account') && (
      <SettingsRow
        key="switch"
        icon={<ArrowLeftRight />}
        label="Switch account"
        onClick={() => setSwitchAccountOpen(true)}
      />
    ),
    !isPaid &&
      matchesSearch('upgrade to pro', 'pro', 'plus', 'subscription', 'plan') && (
        <SettingsRow
          key="upgrade"
          icon={<Sparkles />}
          label="Upgrade to Pro"
          tone="accent"
          onClick={() => navigateTo('/dashboard/plan')}
        />
      ),
    isPaid &&
      !isPlus &&
      !isSuperAdmin &&
      matchesSearch('upgrade to plus', 'plus', 'pro', 'subscription', 'plan') && (
        <SettingsRow
          key="upgrade-plus"
          icon={<Sparkles />}
          label="Upgrade to Plus"
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
              ? 'Boardly Plus · Unlimited'
              : `Boardly Plus · Active until ${planStatus.expiryFormatted || 'Active'}`
          }
          onClick={() => navigateTo('/dashboard/plan')}
        />
      ),
  ].filter(Boolean);

  const showAdFreeSection = matchesSearch(
    'ad-free experience',
    'ad-free',
    'ads',
    'remove ads',
    'upgrade to remove ads',
    'pro',
    'plus'
  );

  const card2Rows = [
    matchesSearch('customize boardly', 'appearance', 'theme', 'dark', 'light', 'koban icon', 'pro badge', 'reduce effects') && (
      <SettingsRow
        key="customize"
        icon={<Palette />}
        label="Customize Boardly"
        onClick={() => setSection('customize')}
      />
    ),
  ].filter(Boolean);

  const card3Rows = [
    matchesSearch('general', 'language', 'display name', 'suggestions', 'appearance') && (
      <SettingsRow
        key="general"
        icon={<SlidersHorizontal />}
        label="General"
        onClick={() => setSection('general')}
      />
    ),
    matchesSearch('usage and limits', 'limits', 'kobans', 'quota', 'ai credits', 'deep', 'max') && (
      <SettingsRow
        key="usage"
        icon={<BarChart3 />}
        label="Usage and limits"
        onClick={() => setSection('usage')}
      />
    ),
    matchesSearch('boardly ai', 'ai mentors', 'noor', 'zain', 'sehar', 'hamza', 'mahnoor', 'chat') && (
      <SettingsRow
        key="boardly-ai"
        icon={<Sparkles />}
        label="Boardly AI"
        onClick={() => navigateTo('/dashboard/ai')}
      />
    ),
    normalizedSearch &&
      matchesSearch('save chat history', 'delete all ai chats', 'ai privacy', 'ai history') && (
        <SettingsRow
          key="boardly-ai-privacy"
          icon={<Trash2 />}
          label="Boardly AI chat history"
          onClick={() => setSection('boardly-ai')}
        />
      ),
    matchesSearch('notifications', 'alerts', 'reminders') && (
      <SettingsRow
        key="notifications"
        icon={<Bell />}
        label="Notifications"
        onClick={() => setSection('notifications')}
      />
    ),
    matchesSearch(
      'security and login',
      'passkey',
      '2fa',
      'authenticator',
      'sessions',
      'trusted devices',
      'password',
      'device unlock',
      'security history'
    ) && (
      <SettingsRow
        key="security"
        icon={<ShieldCheck />}
        label="Security and login"
        dot={Boolean(securitySummary?.hasRecommendations)}
        onClick={() => setSection('security')}
      />
    ),
    matchesSearch('privacy and legal', 'terms', 'policy', 'data') && (
      <SettingsRow
        key="privacy"
        icon={<Shield />}
        label="Privacy and legal"
        onClick={() => setSection('privacy')}
      />
    ),
    matchesSearch('boardly commons', 'community', 'posts', 'feed') && (
      <SettingsRow
        key="commons"
        icon={<MessageCircle />}
        label="Boardly Commons"
        onClick={() => navigateTo('/commons')}
      />
    ),
    matchesSearch('formula vault', 'formulas', 'physics', 'maths', 'chemistry') && (
      <SettingsRow
        key="formulas"
        icon={<BookOpen />}
        label="Formula Vault"
        onClick={() => navigateTo('/formulas')}
      />
    ),
    matchesSearch('grand line mock tests', 'mock tests', 'exams', 'mcqs') && (
      <SettingsRow
        key="grand-line"
        icon={<Compass />}
        label="Grand Line Mock Tests"
        onClick={() => navigateTo('/grand-line')}
      />
    ),
    matchesSearch('boardly store', 'store', 'kobans', 'shop', 'cosmetics') && (
      <SettingsRow
        key="store"
        icon={<ShoppingBag />}
        label="Boardly Store"
        rightElement={kobansChip}
        onClick={() => navigateTo('/store')}
      />
    ),
    matchesSearch('leaderboard', 'rank', 'top students') && (
      <SettingsRow
        key="leaderboard"
        icon={<Trophy />}
        label="Leaderboard"
        onClick={() => navigateTo('/leaderboard')}
      />
    ),
    matchesSearch('rewards', 'daily', 'streak', 'kobans', 'milestones') && (
      <SettingsRow
        key="rewards"
        icon={<Gift />}
        label="Rewards"
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
          label="Captain dashboard"
          onClick={() => navigateTo('/dashboard/captain')}
        />
      ),
    (isAdmin || isSuperAdmin) &&
      matchesSearch('admin', 'users', 'moderation') && (
        <SettingsRow
          key="admin"
          icon={<Users />}
          label="Admin"
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

  const showSignOut = matchesSearch('sign out', 'log out', 'logout', 'version');
  const hasAnyResults =
    card1Rows.length > 0 ||
    showAdFreeSection ||
    card2Rows.length > 0 ||
    card3Rows.length > 0 ||
    card4Rows.length > 0 ||
    showSignOut;

  return (
    <SettingsPage
      title="Settings"
      onBack={handleRootBack}
      scrollContainer={scrollContainer}
      rightAction={{
        icon: <Info className="h-5 w-5" strokeWidth={1.9} />,
        label: 'About Boardly',
        onClick: () => setAboutOpen(true),
      }}
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: 'Search settings',
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
            No settings found
          </p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-muted)' }}>
            Try searching for Account, Security, Passkeys, Appearance, or Kobans.
          </p>
        </div>
      ) : (
        <>
          {card1Rows.length > 0 && <SettingsGroup>{card1Rows}</SettingsGroup>}
          {showAdFreeSection && (
            <SettingsGroup
              label="Ad-free experience"
              helperText={
                isPaid
                  ? 'Ads are hidden because you are on Pro/Plus. You can turn this off anytime if you want to see ads.'
                  : 'Upgrade to Boardly Pro or Plus to enjoy an ad-free experience across all pages.'
              }
            >
              <SettingsToggleRow
                icon={<Sparkles />}
                label="Ad-free experience"
                subtitle={
                  isPaid
                    ? 'Ads are hidden because you are on Pro/Plus'
                    : 'Locked on Free tier'
                }
                checked={isPaid ? adFreeEnabled : false}
                disabled={!isPaid}
                isLast={isPaid}
                onChange={(val) => {
                  void handleToggleAdFree(val);
                }}
              />
              {!isPaid && (
                <SettingsRow
                  icon={<Crown />}
                  label="Upgrade to remove ads"
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
              helperText={`Signed in as ${user?.email || profile?.email || currentUsernameHandle || 'Guest'} · roles: ${roleLabels}`}
            >
              <SettingsRow
                icon={<LogOut />}
                label="Sign out"
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
        onClose={() => setSwitchAccountOpen(false)}
        uid={user?.uid}
        email={user?.email || profile?.email || ''}
        displayName={currentDisplayName}
        avatarUrl={equippedLoadout.photoURL}
        equippedAvatar={equippedLoadout.avatar}
        equippedFrameId={equippedLoadout.frame}
        planLabel={planLabel}
        onAddAccount={() => navigateTo('/login')}
        onSignOut={() => setSignOutConfirmOpen(true)}
      />

      <SettingsConfirmSheet
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title="Sign out of Boardly?"
        description="You can sign back in anytime with your email, username, Google account, or passkey."
        confirmLabel="Sign out"
        tone="danger"
        loading={signingOut}
        onConfirm={handleConfirmSignOut}
      />
    </SettingsPage>
  );
};
