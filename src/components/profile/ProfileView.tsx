import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Award,
  Shield,
  Check,
  X,
  Lock,
  Sparkles,
  Crown,
  Share2,
  Ban,
  AlertCircle,
  ShoppingBag,
  Settings,
  ChevronLeft,
  Package,
  RefreshCw,
} from 'lucide-react';
import type { PublicProfile, EquippedCosmetics } from '@/types';
import {
  getPublicProfile,
  getPublicProfiles,
  syncPublicProfile,
  syncProfileToD1Backend,
  broadcastPublicProfileUpdate,
} from '@/services/publicProfileService';
import { DirectMessageModal } from '@/components/chat/DirectMessageModal';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { ProfileCardEffect, Nameplate } from '@/components/koban/CosmeticRenderers';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { usePlusBadge } from '@/contexts/PlusBadgeContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getPlanDisplayLabel, getUserPlanTier } from '@/config/postLimits';
import type { PlanTier } from '@/lib/planTier';
import { getCosmeticById, type CosmeticRarity } from '@/data/cosmeticsCatalog';
import { useWallet } from '@/hooks/useWallet';
import { normalizeProBadgeDesign, type ProBadgeDesignId } from '@/lib/proBadgeDesigns';
import { resolvePlusBadgeId } from '@/lib/plusBadgeDesigns';
import { getDisplayName, getUsernameHandle, getRawUsername } from '@/utils/displayName';
import { getEquippedLoadout } from '@/utils/userStateSource';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { ProfilePostsSection } from './ProfilePostsSection';

const COSMETIC_ROLE_OPTIONS = [
  'Student',
  'Pre-Medical',
  'Pre-Engineering',
  'ICS / Computer Science',
  'O / A Levels',
  'MDCAT Aspirant',
  'ECAT Aspirant',
  'Class Topper',
];

const PROFILE_REQUEST_TIMEOUT_MS = 8000;
const FOLLOW_LIST_PAGE_SIZE = 50;
const PROFILE_SWR_PREFIX = 'boardly_profile_swr_v1_';

interface FollowListItem {
  uid: string;
  displayName: string;
  username: string;
  avatar?: string;
  equippedAvatar?: string;
  photoURL?: string;
  frame?: string;
  equippedFrame?: string;
  level: number;
  role?: string;
  customRole?: string;
  plusBadge?: number | null;
  plus_badge_design?: number | null;
  plus_badge_visible?: boolean;
  proBadge?: ProBadgeDesignId | null;
  proBadgeDesign?: ProBadgeDesignId | null;
  proBadgeVisible?: boolean;
  followedAt?: number;
}

function normalizeFollowListItem(raw: any): FollowListItem | null {
  const itemUid = String(raw?.uid || '').trim();
  if (!itemUid) return null;

  const cleanUsername = getRawUsername({ username: raw?.username }) || '';
  const cleanDisplayName = getDisplayName({
    display_name: raw?.display_name ?? raw?.displayName,
    username: cleanUsername,
  });

  const rawAvatar = typeof raw?.avatar === 'string' ? raw.avatar.trim() : '';
  const isAvatarUrl = /^(https?:\/\/|data:image\/|\/)/i.test(rawAvatar);
  const resolvedPhotoURL =
    typeof raw?.photoURL === 'string' && raw.photoURL.trim()
      ? raw.photoURL.trim()
      : isAvatarUrl
        ? rawAvatar
        : '';
  const resolvedEquippedAvatar =
    typeof raw?.equippedAvatar === 'string' && raw.equippedAvatar.trim()
      ? raw.equippedAvatar.trim()
      : resolvedPhotoURL
        ? 'custom'
        : rawAvatar || 'avatar-1';

  const resolvedFrame =
    typeof raw?.equippedFrame === 'string' && raw.equippedFrame.trim()
      ? raw.equippedFrame.trim()
      : typeof raw?.frame === 'string' && raw.frame.trim()
        ? raw.frame.trim()
        : 'none';

  const resolvedLevel = Math.max(1, Number(raw?.level ?? raw?.stats?.level ?? 1) || 1);

  const plusVisible = raw?.plus_badge_visible;
  const hasExplicitPlusBadge =
    raw !== null &&
    typeof raw === 'object' &&
    Object.prototype.hasOwnProperty.call(raw, 'plusBadge');
  const resolvedPlusBadge =
    plusVisible === false
      ? null
      : resolvePlusBadgeId(
          hasExplicitPlusBadge ? raw.plusBadge : (raw?.plus_badge_design ?? null)
        );

  const proVisible = raw?.proBadgeVisible;
  const hasExplicitProBadge =
    raw !== null &&
    typeof raw === 'object' &&
    Object.prototype.hasOwnProperty.call(raw, 'proBadge');
  const rawProValue = hasExplicitProBadge ? raw.proBadge : (raw?.proBadgeDesign ?? null);
  const resolvedProBadge =
    proVisible === false || !rawProValue
      ? null
      : normalizeProBadgeDesign(rawProValue);

  return {
    uid: itemUid,
    displayName: cleanDisplayName,
    username: cleanUsername,
    avatar: rawAvatar || resolvedPhotoURL || resolvedEquippedAvatar,
    equippedAvatar: resolvedEquippedAvatar,
    photoURL: resolvedPhotoURL || undefined,
    frame: resolvedFrame,
    equippedFrame: resolvedFrame,
    level: resolvedLevel,
    role: typeof raw?.role === 'string' ? raw.role : undefined,
    customRole: typeof raw?.customRole === 'string' ? raw.customRole : undefined,
    plusBadge: resolvedPlusBadge,
    plus_badge_design: resolvedPlusBadge,
    plus_badge_visible: resolvedPlusBadge !== null,
    proBadge: resolvedProBadge,
    proBadgeDesign: resolvedProBadge,
    proBadgeVisible: resolvedProBadge !== null,
    followedAt: typeof raw?.followedAt === 'number' ? raw.followedAt : undefined,
  };
}

interface AchievementBadgeMeta {
  id: string;
  name: string;
  description: string;
  rarity: CosmeticRarity;
}

const ALL_ACHIEVEMENT_BADGES: AchievementBadgeMeta[] = [
  {
    id: 'first_login',
    name: 'First Step',
    description: 'Joined the Boardly student community.',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Maintained a 7-day study streak.',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Unstoppable 30',
    description: 'Completed 30 consecutive days of practice.',
    rarity: 'epic',
  },
  {
    id: 'centurion_100',
    name: 'MCQ Centurion',
    description: 'Solved 100+ practice questions accurately.',
    rarity: 'rare',
  },
  {
    id: 'topper_90',
    name: '90% Precision',
    description: 'Achieved 90%+ accuracy across mock tests.',
    rarity: 'legendary',
  },
  {
    id: 'commons_contributor',
    name: 'Commons Scholar',
    description: 'Shared helpful study resources with peers.',
    rarity: 'epic',
  },
];

function withTimeout<T>(promise: Promise<T>, ms = PROFILE_REQUEST_TIMEOUT_MS, label = 'Request'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
    promise.then(
      (val) => {
        window.clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function computeLevelFromStats(stats: {
  xp?: number;
  testsCompleted?: number;
  questionsAnswered?: number;
  streakDays?: number;
}): {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const rawXp =
    typeof stats.xp === 'number' && stats.xp > 0
      ? stats.xp
      : (stats.testsCompleted || 0) * 120 +
        (stats.questionsAnswered || 0) * 8 +
        (stats.streakDays || 0) * 50;
  const xp = Math.max(0, Math.floor(rawXp));
  const xpPerLevel = 500;
  const level = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(
    100,
    Math.max(4, Math.round((currentLevelXp / nextLevelXp) * 100))
  );
  return { level, xp, currentLevelXp, nextLevelXp, progressPercent };
}

export interface ProfileViewProps {
  targetUid?: string | null;
  isFullPage?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  data?: Record<string, any>;
  isOwnProfile?: boolean;
  previewMode?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
}

type ProfileTabId = 'overview' | 'loadout' | 'badges';

interface EquippedCosmeticsMap extends EquippedCosmetics {
  profileBanner?: string | null;
  avatarFrame?: string | null;
  profileEffect?: string | null;
  title?: string | null;
}

interface EnrichedProfile extends PublicProfile {
  display_name?: string;
  realName?: string;
  bio?: string;
  status?: string;
  accent?: string;
  shortId?: string;
  bannerUrl?: string;
  equippedAvatar?: string;
  equippedFrame?: string;
  equippedBanner?: string;
  equippedTitle?: string;
  equippedBadges?: string[];
  equippedCosmetics?: EquippedCosmeticsMap;
  followersCount?: number;
  followingCount?: number;
  isBanned?: boolean;
  proBadge?: string | null;
  rawProBadge?: string | null;
  plusBadge?: number | null;
  plus_badge_design?: number | null;
  plus_badge_visible?: boolean;
  plus_badge_id?: number | null;
  plan?: string | null;
  planTier?: string | null;
  isPro?: boolean;
  isPlus?: boolean;
  isPremium?: boolean;
  proUntil?: any;
  plusUntil?: any;
  planExpiresAt?: any;
  premiumExpiresAt?: any;
  proPlanId?: string | null;
  plusPlanId?: string | null;
  kobans?: number;
}

const RARITY_BADGE_TOKENS: Record<CosmeticRarity, { color: string; background: string; borderColor: string }> = {
  common: {
    color: 'var(--rarity-common-text)',
    background: 'var(--rarity-common-bg)',
    borderColor: 'var(--rarity-common-border)',
  },
  rare: {
    color: 'var(--rarity-rare-text)',
    background: 'var(--rarity-rare-bg)',
    borderColor: 'var(--rarity-rare-border)',
  },
  epic: {
    color: 'var(--rarity-epic-text)',
    background: 'var(--rarity-epic-bg)',
    borderColor: 'var(--rarity-epic-border)',
  },
  legendary: {
    color: 'var(--rarity-legendary-text)',
    background: 'var(--rarity-legendary-bg)',
    borderColor: 'var(--rarity-legendary-border)',
  },
  mythic: {
    color: 'var(--rarity-mythic-text)',
    background: 'var(--rarity-mythic-bg)',
    borderColor: 'var(--rarity-mythic-border)',
  },
};

function deriveDeterministicShortId(uid: string): string {
  if (!uid) return '10000';
  let hash = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash) % 90000) + 10000;
  return String(num);
}

function readCachedProfile(uid: string): EnrichedProfile | null {
  if (!uid || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PROFILE_SWR_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; data?: EnrichedProfile };
    if (!parsed?.data || parsed.data.uid !== uid) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedProfile(uid: string, data: EnrichedProfile): void {
  if (!uid || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${PROFILE_SWR_PREFIX}${uid}`,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {
    // ignore storage quota errors
  }
}

function buildImmediateOwnSeed(
  uid: string,
  ownProfile: any,
  currentUser: any,
  walletEquipped: any,
  myProBadgeVisible: boolean,
  myProBadgeDesign: ProBadgeDesignId
): EnrichedProfile {
  const resolvedDisplayName = getDisplayName({
    display_name: ownProfile?.display_name ?? ownProfile?.displayName,
    realName: ownProfile?.realName ?? ownProfile?.name ?? currentUser?.displayName,
    username: ownProfile?.username,
  });
  const rawUsername = getRawUsername({ username: ownProfile?.username }) || '';
  const shortId =
    String(ownProfile?.shortId || ownProfile?.studentId || deriveDeterministicShortId(uid))
      .replace(/^#+/, '')
      .trim();

  const canonicalLoadout = getEquippedLoadout({
    uid,
    equipped: walletEquipped,
    equippedCosmetics: ownProfile?.equippedCosmetics,
    equippedAvatar: ownProfile?.equippedAvatar,
    equippedFrame: ownProfile?.equippedFrame,
    equippedBanner: ownProfile?.equippedBanner,
    equippedNameplate: ownProfile?.equippedNameplate ?? ownProfile?.nameplate,
    equippedEffect: ownProfile?.effectId,
    avatar: ownProfile?.avatar,
    frame: ownProfile?.frame,
    banner: ownProfile?.banner,
    photoURL: ownProfile?.photoURL || currentUser?.photoURL || null,
  });

  const equippedAvatar =
    ownProfile?.equippedAvatar === 'custom'
      ? 'custom'
      : canonicalLoadout.avatar || 'avatar-1';
  const equippedFrame = canonicalLoadout.frame || 'none';
  const equippedBanner = canonicalLoadout.banner || 'none';
  const equippedEffect = canonicalLoadout.effect || 'none';
  const equippedTitle =
    walletEquipped?.title || ownProfile?.equippedTitle || 'title-rookie';
  const equippedNameplate = canonicalLoadout.nameplate || 'none';

  return {
    uid,
    display_name: resolvedDisplayName,
    displayName: resolvedDisplayName,
    realName: ownProfile?.realName || ownProfile?.name || currentUser?.displayName || undefined,
    username: rawUsername,
    role: ownProfile?.role || 'student',
    customRole: ownProfile?.customRole || 'Student',
    equippedAvatar,
    photoURL: canonicalLoadout.photoURL || '',
    equippedFrame,
    equippedBanner,
    equippedTitle,
    nameplate: equippedNameplate,
    equippedBadges: ownProfile?.equippedBadges || ['first_login'],
    equippedCosmetics: {
      ...(ownProfile?.equippedCosmetics || {}),
      avatar: equippedAvatar !== 'custom' ? equippedAvatar : undefined,
      frame: equippedFrame !== 'none' ? equippedFrame : undefined,
      avatarFrame: equippedFrame !== 'none' ? equippedFrame : undefined,
      banner: equippedBanner !== 'none' ? equippedBanner : undefined,
      profileBanner: equippedBanner !== 'none' ? equippedBanner : undefined,
      effect: equippedEffect !== 'none' ? equippedEffect : undefined,
      profileEffect: equippedEffect !== 'none' ? equippedEffect : undefined,
      nameplate: equippedNameplate !== 'none' ? equippedNameplate : undefined,
      title: equippedTitle,
    },
    bio: ownProfile?.bio || '',
    status: ownProfile?.status || '',
    shortId,
    studentId: shortId,
    followersCount: Number(ownProfile?.followersCount ?? 0),
    followingCount: Number(ownProfile?.followingCount ?? 0),
    isBanned: Boolean(ownProfile?.isBanned),
    proBadge: myProBadgeVisible ? myProBadgeDesign : null,
    stats: {
      streakDays: Number(ownProfile?.streakDays ?? ownProfile?.streak ?? 0),
      testsCompleted: Number(ownProfile?.testsCompleted ?? 0),
      questionsAnswered: Number(ownProfile?.totalQuestionsSolved ?? ownProfile?.questionsAnswered ?? 0),
      accuracyRate: Number(ownProfile?.accuracyRate ?? 0),
      xp: Number(ownProfile?.xp ?? ownProfile?.score ?? 0),
    },
  };
}

function ProfileSkeleton() {
  return (
    <div className="max-w-[640px] mx-auto px-4 pt-4 pb-12 space-y-5 animate-pulse" aria-busy="true">
      <div className="rounded-[32px] bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-[var(--settings-card-shadow)]">
        <div className="h-36 sm:h-40 w-full bg-[var(--border)]/50" />
        <div className="px-5 pb-5">
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <div className="w-[92px] h-[92px] rounded-full bg-[var(--border)] ring-4 ring-[var(--card)]" />
            <div className="h-8 w-32 rounded-full bg-[var(--border)]/70" />
          </div>
          <div className="space-y-2 mt-2">
            <div className="h-6 w-48 rounded-lg bg-[var(--border)]/80" />
            <div className="h-4 w-28 rounded-lg bg-[var(--border)]/60" />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="h-7 w-24 rounded-full bg-[var(--border)]/60" />
            <div className="h-7 w-20 rounded-full bg-[var(--border)]/60" />
          </div>
          <div className="mt-4 h-[68px] rounded-[22px] bg-[var(--bg)] border border-[var(--border)]" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-[46px] rounded-full bg-[var(--border)]/70" />
            <div className="h-[46px] rounded-full bg-[var(--border)]/50" />
            <div className="h-[46px] rounded-full bg-[var(--border)]/50" />
          </div>
        </div>
      </div>
      <div className="h-[48px] rounded-full bg-[var(--card)] border border-[var(--border)]" />
      <div className="h-32 rounded-[24px] bg-[var(--card)] border border-[var(--border)]" />
    </div>
  );
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUid,
  isModal = false,
  onClose,
  data: propData,
  isOwnProfile: propIsOwnProfile,
  previewMode = false,
  onEditProfile: propOnEditProfile,
  onFollow: propOnFollow,
  onMessage: propOnMessage,
  onShare: propOnShare,
}) => {
  const {
    user: currentUser,
    profile: ownProfile,
    profileLoading: authProfileLoading,
    isAdmin,
    isGuest,
    updateProfile: updateAuthContextProfile,
    proBadgeDesign: myProBadgeDesign,
    proBadgeVisible: myProBadgeVisible,
  } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet();
  const liveEffectivePlan = useEffectivePlan();
  const { effectivePlusBadgeId: myEffectivePlusBadgeId } = usePlusBadge();

  const uid = targetUid || propData?.uid || currentUser?.uid || '';
  const isOwnProfile =
    typeof propIsOwnProfile === 'boolean'
      ? propIsOwnProfile
      : Boolean(currentUser && uid && uid === currentUser.uid);

  const [scrolled, setScrolled] = useState(false);

  // Instant SWR or ownProfile seed so revisits paint immediately (<50ms) with zero black screen
  const [profile, setProfile] = useState<EnrichedProfile | null>(() => {
    if (previewMode && propData) return null;
    if (!uid) return null;
    const cached = readCachedProfile(uid);
    if (cached) return cached;
    if (isOwnProfile && (ownProfile || currentUser)) {
      return buildImmediateOwnSeed(
        uid,
        ownProfile,
        currentUser,
        wallet.equipped,
        myProBadgeVisible,
        myProBadgeDesign
      );
    }
    return null;
  });

  const [basicsLoading, setBasicsLoading] = useState<boolean>(() => !previewMode && !profile && Boolean(uid));
  const [basicsError, setBasicsError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  // Independent follows state (non-blocking)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followsSyncing, setFollowsSyncing] = useState(false);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(() => Number(profile?.followersCount ?? 0));
  const [followingCount, setFollowingCount] = useState<number>(() => Number(profile?.followingCount ?? 0));
  const [, setPostsCount] = useState(0);

  // Followers / Following Modal state
  const [followListModal, setFollowListModal] = useState<'followers' | 'following' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<FollowListItem[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListLoadingMore, setFollowListLoadingMore] = useState(false);
  const [followListError, setFollowListError] = useState<string | null>(null);
  const [followListHasMore, setFollowListHasMore] = useState(false);
  const [followListTotal, setFollowListTotal] = useState<number | null>(null);
  const followListReqIdRef = useRef(0);
  const followListAbortRef = useRef<AbortController | null>(null);
  const followListOffsetRef = useRef(0);

  const closeFollowListModal = useCallback(() => {
    followListReqIdRef.current += 1;
    if (followListAbortRef.current) {
      followListAbortRef.current.abort();
      followListAbortRef.current = null;
    }
    setFollowListModal(null);
    setFollowListLoading(false);
    setFollowListLoadingMore(false);
    setFollowListError(null);
  }, []);

  // Direct Message Modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Share Toast
  const [copiedToast, setCopiedToast] = useState(false);

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editCustomRole, setEditCustomRole] = useState('Student');
  const [editAvatar, setEditAvatar] = useState('avatar-1');
  const [editFrame, setEditFrame] = useState<string>('none');
  const [editBanner, setEditBanner] = useState<string>('none');
  const [editEffect, setEditEffect] = useState<string>('none');
  const [editBadges, setEditBadges] = useState<string[]>(['first_login']);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep latest ownProfile & wallet refs without re-triggering network fetch loops
  const ownProfileRef = useRef(ownProfile);
  ownProfileRef.current = ownProfile;
  const walletEquippedRef = useRef(wallet.equipped);
  walletEquippedRef.current = wallet.equipped;
  const myProBadgeRef = useRef({ visible: myProBadgeVisible, design: myProBadgeDesign });
  myProBadgeRef.current = { visible: myProBadgeVisible, design: myProBadgeDesign };

  useBodyScrollLock(Boolean(isEditing || followListModal), 'profile-submodal');

  // Sticky top bar scroll border + reset scroll to 0 on uid change
  useEffect(() => {
    if (!previewMode && !isModal) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    let rafId = 0;
    const syncScrolled = () => {
      const over = window.scrollY > 4;
      setScrolled((prev) => (prev === over ? prev : over));
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        syncScrolled();
      });
    };
    syncScrolled();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [uid, previewMode, isModal]);

  // Sync modal attribute for bottom nav hiding when sub-modals are open
  useEffect(() => {
    const anySubModal = Boolean(isEditing || followListModal || isChatOpen || isModal);
    if (anySubModal) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }
    return () => {
      document.body.removeAttribute('data-modal-open');
    };
  }, [isEditing, followListModal, isChatOpen, isModal]);

  // Abort any in-flight follow list request on unmount or profile switch
  useEffect(() => {
    return () => {
      followListReqIdRef.current += 1;
      if (followListAbortRef.current) {
        followListAbortRef.current.abort();
        followListAbortRef.current = null;
      }
    };
  }, [uid]);

  // Close sub-modals on Escape
  useEffect(() => {
    if (!isEditing && !followListModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (followListModal) closeFollowListModal();
        else if (isEditing && !saving) setIsEditing(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditing, followListModal, saving, closeFollowListModal]);

  const hydrateEditFields = useCallback((p: EnrichedProfile) => {
    const cleanName = getDisplayName({
      display_name: p.display_name ?? p.displayName,
      realName: p.realName,
      username: p.username,
    });
    setEditDisplayName(cleanName);
    setEditUsername(getRawUsername({ username: p.username }) || '');
    setEditBio(p.bio || '');
    setEditStatus(p.status || '');
    setEditCustomRole(p.customRole || 'Student');
    setEditAvatar(p.equippedAvatar || 'avatar-1');
    setEditFrame(p.equippedFrame || 'none');
    setEditBanner(p.equippedBanner || 'none');
    setEditEffect(p.equippedCosmetics?.profileEffect || p.equippedCosmetics?.effect || 'none');
    setEditBadges(p.equippedBadges || ['first_login']);
  }, []);

  // Preview mode hydration
  useEffect(() => {
    if (!previewMode || !propData) return;
    const candidateUid = String(propData.uid || uid || 'preview_user');
    const resolvedShortId = String(
      propData.shortId || propData.studentId || deriveDeterministicShortId(candidateUid)
    )
      .replace(/^#+/, '')
      .trim();
    const resolvedName = getDisplayName({
      display_name: propData.display_name ?? propData.displayName,
      realName: propData.realName ?? propData.name,
      username: propData.username,
    });

    setProfile({
      uid: candidateUid,
      display_name: resolvedName,
      displayName: resolvedName,
      username: getRawUsername({ username: propData.username }) || '',
      role: propData.role || 'student',
      customRole: propData.customRole || 'Student',
      equippedAvatar: propData.equippedAvatar || propData.avatar || 'avatar-1',
      photoURL: propData.photoURL || '',
      equippedFrame: propData.equippedFrame || propData.frame || 'none',
      equippedBanner: propData.equippedBanner || 'none',
      equippedTitle: propData.equippedTitle || 'title-rookie',
      equippedBadges: propData.equippedBadges || ['first_login'],
      equippedCosmetics: propData.equippedCosmetics || {},
      bio: propData.bio || '',
      status: propData.status || 'Active',
      shortId: resolvedShortId,
      studentId: resolvedShortId,
      followersCount: Number(propData.followersCount ?? 0),
      followingCount: Number(propData.followingCount ?? 0),
      proBadge: propData.proBadge ?? null,
      stats: propData.stats || {
        streakDays: 1,
        testsCompleted: 0,
        questionsAnswered: 0,
        accuracyRate: 0,
        xp: 120,
      },
    });
    setBasicsLoading(false);
    setBasicsError(null);
  }, [previewMode, propData, uid]);

  // 1. PARALLEL, TIMEOUT-GUARDED BASICS LOAD (never spins forever; never re-triggers on ownProfile identity changes)
  useEffect(() => {
    if (previewMode) return;
    if (!uid) {
      if (!authProfileLoading) {
        setBasicsLoading(false);
      }
      return;
    }

    let cancelled = false;

    // Immediate paint from SWR cache or ownProfile before network finishes
    const cached = readCachedProfile(uid);
    const immediateSeed =
      cached ||
      (isOwnProfile && (ownProfileRef.current || currentUser)
        ? buildImmediateOwnSeed(
            uid,
            ownProfileRef.current,
            currentUser,
            walletEquippedRef.current,
            myProBadgeRef.current.visible,
            myProBadgeRef.current.design
          )
        : null);

    if (immediateSeed) {
      setProfile(immediateSeed);
      setFollowersCount(Number(immediateSeed.followersCount ?? 0));
      setFollowingCount(Number(immediateSeed.followingCount ?? 0));
      hydrateEditFields(immediateSeed);
      setBasicsLoading(false);
    } else {
      setBasicsLoading(true);
    }
    setBasicsError(null);

    const loadBasics = async () => {
      try {
        if (isGuest && isOwnProfile) {
          const seed = buildImmediateOwnSeed(
            uid,
            ownProfileRef.current,
            currentUser,
            walletEquippedRef.current,
            false,
            myProBadgeRef.current.design
          );
          if (!cancelled) {
            setProfile(seed);
            hydrateEditFields(seed);
            writeCachedProfile(uid, seed);
            setBasicsLoading(false);
          }
          return;
        }

        // Fire-and-forget publicProfile sync for own profile (NEVER blocks render)
        const op = ownProfileRef.current as any;
        if (isOwnProfile && currentUser && op) {
          const ownDisplayName = getDisplayName({
            display_name: op.display_name ?? op.displayName,
            realName: op.realName ?? op.name ?? currentUser.displayName,
            username: op.username,
          });
          void syncPublicProfile(uid, {
            display_name: ownDisplayName,
            displayName: ownDisplayName,
            username: op.username,
            role: op.role,
            customRole: op.customRole,
            equippedAvatar: op.equippedAvatar || op.avatar || 'avatar-1',
            photoURL: op.photoURL || currentUser.photoURL || '',
            equippedFrame: op.equippedFrame || op.frame,
            streak: op.streak,
            score: op.score,
            bio: op.bio,
            status: op.status,
          }).catch(() => {});
        }

        // Fetch D1 profile, publicProfile, and Firestore users/{uid} IN PARALLEL with 8s timeouts
        const d1Controller = new AbortController();
        const d1Timer = window.setTimeout(() => d1Controller.abort(), PROFILE_REQUEST_TIMEOUT_MS);

        const d1Promise = fetch(
          `/api/auth/resolve-profiles?uids=${encodeURIComponent(uid)}&_t=${Date.now()}`,
          { cache: 'no-store', signal: d1Controller.signal }
        )
          .then(async (res) => {
            window.clearTimeout(d1Timer);
            const json = await res.json().catch(() => null);
            return res.ok && json?.profiles?.[uid] ? json.profiles[uid] : null;
          })
          .catch(() => {
            window.clearTimeout(d1Timer);
            return null;
          });

        const pubPromise = withTimeout(getPublicProfile(uid), PROFILE_REQUEST_TIMEOUT_MS, 'Public profile');
        const userDocPromise = withTimeout(
          getDoc(doc(db, 'users', uid)).then((snap) => (snap.exists() ? snap.data() : null)),
          PROFILE_REQUEST_TIMEOUT_MS,
          'User profile'
        );

        const [d1Result, pubResult, userResult] = await Promise.allSettled([
          d1Promise,
          pubPromise,
          userDocPromise,
        ]);

        if (cancelled) return;

        const d1Live: any = d1Result.status === 'fulfilled' ? d1Result.value : null;
        const pubData: any = pubResult.status === 'fulfilled' ? pubResult.value : null;
        const uData: any =
          userResult.status === 'fulfilled' && userResult.value
            ? userResult.value
            : isOwnProfile && ownProfileRef.current
            ? ownProfileRef.current
            : null;

        // If every single source failed and we have no cached data, show inline retry card
        if (!d1Live && !pubData && !uData) {
          if (!immediateSeed) {
            const firstRejection =
              (pubResult.status === 'rejected' && pubResult.reason) ||
              (userResult.status === 'rejected' && userResult.reason);
            setBasicsError(
              firstRejection instanceof Error
                ? firstRejection.message
                : 'Could not load this profile right now.'
            );
          }
          setBasicsLoading(false);
          return;
        }

        const shortId = String(
          uData?.shortId ||
            uData?.studentId ||
            pubData?.studentId ||
            pubData?.shortId ||
            deriveDeterministicShortId(uid)
        )
          .replace(/^#+/, '')
          .trim();

        const rawUsername =
          getRawUsername({
            username:
              d1Live?.username ||
              (isOwnProfile ? (ownProfileRef.current as any)?.username : undefined) ||
              uData?.username ||
              pubData?.username,
          }) || '';

        const resolvedDisplayName = getDisplayName({
          display_name:
            (isOwnProfile
              ? ownProfileRef.current?.display_name ?? ownProfileRef.current?.displayName
              : undefined) ||
            uData?.display_name ||
            uData?.displayName ||
            pubData?.display_name ||
            pubData?.displayName ||
            d1Live?.display_name ||
            d1Live?.displayName,
          realName:
            uData?.realName ||
            uData?.name ||
            (isOwnProfile ? currentUser?.displayName : undefined),
          username: rawUsername,
        });

        const rawEquippedCosmetics: EquippedCosmeticsMap = {
          ...(pubData?.equippedCosmetics || {}),
          ...(uData?.equippedCosmetics || {}),
          ...(isOwnProfile ? walletEquippedRef.current || {} : {}),
        };

        const rawAvatarCandidate =
          (isOwnProfile ? walletEquippedRef.current?.avatar : undefined) ||
          uData?.equippedAvatar ||
          d1Live?.avatar ||
          rawEquippedCosmetics.avatar ||
          pubData?.equippedAvatar ||
          'avatar-1';

        const isCustomUploadedAvatar =
          typeof rawAvatarCandidate === 'string' &&
          (rawAvatarCandidate.startsWith('/api/avatars/') ||
            rawAvatarCandidate.startsWith('https://') ||
            rawAvatarCandidate.startsWith('http://') ||
            rawAvatarCandidate.startsWith('data:image/'));

        const resolvedEquippedAvatar = isCustomUploadedAvatar
          ? 'custom'
          : rawAvatarCandidate || 'avatar-1';

        const resolvedPhotoURL = isCustomUploadedAvatar
          ? rawAvatarCandidate
          : uData?.photoURL ||
            pubData?.photoURL ||
            (isOwnProfile ? currentUser?.photoURL || '' : '');

        const resolvedFrame =
          (isOwnProfile ? walletEquippedRef.current?.frame : undefined) ||
          rawEquippedCosmetics.frame ||
          rawEquippedCosmetics.avatarFrame ||
          uData?.equippedFrame ||
          d1Live?.frame ||
          pubData?.equippedFrame ||
          'none';

        const resolvedBanner =
          (isOwnProfile ? walletEquippedRef.current?.banner : undefined) ||
          rawEquippedCosmetics.banner ||
          rawEquippedCosmetics.profileBanner ||
          uData?.equippedBanner ||
          pubData?.equippedBanner ||
          'none';

        const resolvedEffect =
          (isOwnProfile ? walletEquippedRef.current?.effect : undefined) ||
          rawEquippedCosmetics.effect ||
          rawEquippedCosmetics.profileEffect ||
          uData?.effectId ||
          pubData?.effectId ||
          'none';

        const resolvedTitle =
          (isOwnProfile ? walletEquippedRef.current?.title : undefined) ||
          rawEquippedCosmetics.title ||
          uData?.equippedTitle ||
          pubData?.equippedTitle ||
          'title-rookie';

        const resolvedNameplate =
          (isOwnProfile ? walletEquippedRef.current?.nameplate : undefined) ||
          rawEquippedCosmetics.nameplate ||
          uData?.nameplate ||
          pubData?.nameplate ||
          'none';

        const resolvedRole =
          (isOwnProfile ? ownProfileRef.current?.role : undefined) ||
          uData?.role ||
          pubData?.role ||
          d1Live?.role ||
          'student';

        const resolvedCustomRole =
          uData?.customRole ?? pubData?.customRole ?? d1Live?.customRole ?? 'Student';

        const resolvedBio =
          uData?.bio ?? pubData?.bio ?? (d1Live?.bio !== undefined ? d1Live.bio : '');

        const resolvedStatus =
          uData?.status ?? pubData?.status ?? (d1Live?.status !== undefined ? d1Live.status : '');

        const rawBadgeFromSources = isOwnProfile
          ? myProBadgeRef.current.visible
            ? myProBadgeRef.current.design
            : null
          : d1Live?.proBadge || pubData?.proBadge || uData?.proBadge || null;

        const resolvedProBadge: string | null =
          rawBadgeFromSources && !String(rawBadgeFromSources).toLowerCase().startsWith('plus:')
            ? normalizeProBadgeDesign(String(rawBadgeFromSources))
            : null;

        const rawPlusVisible =
          typeof uData?.plus_badge_visible === 'boolean'
            ? uData.plus_badge_visible
            : typeof pubData?.plus_badge_visible === 'boolean'
            ? pubData.plus_badge_visible
            : typeof (d1Live as any)?.plus_badge_visible === 'boolean'
            ? (d1Live as any).plus_badge_visible
            : true;

        const rawPlusDesignSource =
          d1Live?.plusBadge !== undefined
            ? d1Live.plusBadge
            : Object.prototype.hasOwnProperty.call(uData || {}, 'plus_badge_design')
            ? uData?.plus_badge_design
            : Object.prototype.hasOwnProperty.call(pubData || {}, 'plus_badge_design')
            ? pubData?.plus_badge_design
            : Object.prototype.hasOwnProperty.call(uData || {}, 'plus_badge_id')
            ? uData?.plus_badge_id
            : Object.prototype.hasOwnProperty.call(pubData || {}, 'plus_badge_id')
            ? pubData?.plus_badge_id
            : Object.prototype.hasOwnProperty.call(pubData || {}, 'plusBadge')
            ? (pubData as any)?.plusBadge
            : undefined;

        const resolvedPlusBadgeDesign: number | null =
          rawPlusDesignSource === null
            ? null
            : rawPlusDesignSource !== undefined
            ? resolvePlusBadgeId(rawPlusDesignSource)
            : null;

        const resolvedPlusBadgeId: number | null =
          rawPlusVisible === false ? null : resolvedPlusBadgeDesign;

        const enriched: EnrichedProfile = {
          uid,
          display_name: resolvedDisplayName,
          displayName: resolvedDisplayName,
          realName: uData?.realName || uData?.name || (isOwnProfile ? currentUser?.displayName || undefined : undefined),
          username: rawUsername,
          role: resolvedRole as any,
          customRole: resolvedCustomRole || 'Student',
          equippedAvatar: resolvedEquippedAvatar,
          photoURL: resolvedPhotoURL,
          equippedFrame: resolvedFrame,
          equippedBanner: resolvedBanner,
          equippedTitle: resolvedTitle,
          nameplate: resolvedNameplate,
          equippedBadges: uData?.equippedBadges || pubData?.equippedBadges || ['first_login'],
          equippedCosmetics: {
            ...rawEquippedCosmetics,
            avatar: isCustomUploadedAvatar ? undefined : resolvedEquippedAvatar,
            frame: resolvedFrame !== 'none' ? resolvedFrame : undefined,
            avatarFrame: resolvedFrame !== 'none' ? resolvedFrame : undefined,
            banner: resolvedBanner !== 'none' ? resolvedBanner : undefined,
            profileBanner: resolvedBanner !== 'none' ? resolvedBanner : undefined,
            effect: resolvedEffect !== 'none' ? resolvedEffect : undefined,
            profileEffect: resolvedEffect !== 'none' ? resolvedEffect : undefined,
            nameplate: resolvedNameplate !== 'none' ? resolvedNameplate : undefined,
            title: resolvedTitle,
          },
          bio: resolvedBio,
          status: resolvedStatus,
          shortId,
          studentId: shortId,
          followersCount: Number(uData?.followersCount ?? immediateSeed?.followersCount ?? 0),
          followingCount: Number(uData?.followingCount ?? immediateSeed?.followingCount ?? 0),
          isBanned: Boolean(uData?.isBanned),
          proBadge: resolvedProBadge,
          rawProBadge: typeof rawBadgeFromSources === 'string' ? rawBadgeFromSources : null,
          plusBadge: resolvedPlusBadgeId,
          plus_badge_design: resolvedPlusBadgeDesign,
          plus_badge_visible: rawPlusVisible,
          plus_badge_id: resolvedPlusBadgeId,
          plan: uData?.plan ?? pubData?.plan ?? d1Live?.plan ?? null,
          planTier: uData?.planTier ?? pubData?.planTier ?? d1Live?.planTier ?? null,
          isPro: Boolean(uData?.isPro ?? pubData?.isPro),
          isPlus: Boolean(uData?.isPlus ?? pubData?.isPlus),
          isPremium: Boolean(uData?.isPremium ?? pubData?.isPremium),
          proUntil: uData?.proUntil ?? pubData?.proUntil ?? null,
          plusUntil: uData?.plusUntil ?? pubData?.plusUntil ?? null,
          planExpiresAt: uData?.planExpiresAt ?? pubData?.planExpiresAt ?? null,
          premiumExpiresAt: uData?.premiumExpiresAt ?? pubData?.premiumExpiresAt ?? null,
          proPlanId: uData?.proPlanId ?? pubData?.proPlanId ?? null,
          plusPlanId: uData?.plusPlanId ?? pubData?.plusPlanId ?? null,
          kobans: Number(uData?.kobans ?? pubData?.kobans ?? 0),
          stats: {
            streakDays: Number(uData?.streakDays ?? uData?.streak ?? pubData?.stats?.streakDays ?? 0),
            testsCompleted: Number(uData?.testsCompleted ?? pubData?.stats?.testsCompleted ?? 0),
            questionsAnswered: Number(
              uData?.totalQuestionsSolved ?? pubData?.stats?.questionsAnswered ?? 0
            ),
            accuracyRate: Number(uData?.accuracyRate ?? pubData?.stats?.accuracyRate ?? 0),
            xp: Number(uData?.xp ?? uData?.score ?? pubData?.stats?.xp ?? 0),
          },
        };

        setProfile(enriched);
        setFollowersCount((prev) => (prev > 0 ? prev : enriched.followersCount || 0));
        setFollowingCount((prev) => (prev > 0 ? prev : enriched.followingCount || 0));
        hydrateEditFields(enriched);
        writeCachedProfile(uid, enriched);
        setBasicsError(null);
      } catch (err) {
        if (!cancelled && !immediateSeed) {
          setBasicsError(err instanceof Error ? err.message : 'Could not load profile.');
        }
      } finally {
        if (!cancelled) setBasicsLoading(false);
      }
    };

    void loadBasics();
    return () => {
      cancelled = true;
    };
  }, [uid, isOwnProfile, isGuest, previewMode, authProfileLoading, currentUser, reloadToken, hydrateEditFields]);

  // 2. INDEPENDENT NON-BLOCKING FOLLOWS LOAD (8s timeout + inline retry)
  const loadFollows = useCallback(async () => {
    if (!uid || isGuest || previewMode) return;
    setFollowsSyncing(true);
    setFollowsError(null);
    try {
      const fetchApiCount = async (endpoint: '/api/followers' | '/api/following'): Promise<number | null> => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), PROFILE_REQUEST_TIMEOUT_MS);
        try {
          const res = await fetch(
            `${endpoint}?uid=${encodeURIComponent(uid)}&limit=1&offset=0`,
            { signal: controller.signal, credentials: 'same-origin' }
          );
          if (!res.ok) return null;
          const body = await res.json();
          const rawTotal =
            endpoint === '/api/followers'
              ? (body?.total ?? body?.followersCount)
              : (body?.total ?? body?.followingCount);
          const parsed = Number(rawTotal);
          return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
        } catch {
          return null;
        } finally {
          window.clearTimeout(timer);
        }
      };

      const fQuery = query(collection(db, 'follows'), where('followingId', '==', uid), limit(500));
      const fgQuery = query(collection(db, 'follows'), where('followerId', '==', uid), limit(500));

      const [apiFollowersRes, apiFollowingRes, fsFollowersRes, fsFollowingRes, myFollowRes] =
        await Promise.allSettled([
          fetchApiCount('/api/followers'),
          fetchApiCount('/api/following'),
          withTimeout(getDocs(fQuery), PROFILE_REQUEST_TIMEOUT_MS, 'Followers'),
          withTimeout(getDocs(fgQuery), PROFILE_REQUEST_TIMEOUT_MS, 'Following'),
          currentUser && !isOwnProfile
            ? withTimeout(
                getDoc(doc(db, 'follows', `${currentUser.uid}_${uid}`)),
                PROFILE_REQUEST_TIMEOUT_MS,
                'Follow status'
              )
            : Promise.resolve(null),
        ]);

      const d1Followers =
        apiFollowersRes.status === 'fulfilled' ? apiFollowersRes.value : null;
      const d1Following =
        apiFollowingRes.status === 'fulfilled' ? apiFollowingRes.value : null;
      const fsFollowers =
        fsFollowersRes.status === 'fulfilled' ? fsFollowersRes.value.size : null;
      const fsFollowing =
        fsFollowingRes.status === 'fulfilled' ? fsFollowingRes.value.size : null;

      if (d1Followers === null && fsFollowers === null && d1Following === null && fsFollowing === null) {
        throw new Error('Could not refresh follower counts.');
      }

      const nextFollowers = Math.max(d1Followers ?? 0, fsFollowers ?? 0);
      const nextFollowing = Math.max(d1Following ?? 0, fsFollowing ?? 0);

      setFollowersCount(nextFollowers);
      setFollowingCount(nextFollowing);

      if (myFollowRes.status === 'fulfilled' && myFollowRes.value) {
        setIsFollowing(myFollowRes.value.exists());
      }

      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, followersCount: nextFollowers, followingCount: nextFollowing };
        writeCachedProfile(uid, next);
        return next;
      });
    } catch {
      setFollowsError('Could not refresh follower counts.');
    } finally {
      setFollowsSyncing(false);
    }
  }, [uid, isGuest, previewMode, currentUser, isOwnProfile]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  // 3. Real-time listener for publicProfiles/{uid} (merges cleanly without causing reload flicker)
  useEffect(() => {
    if (!uid || isGuest || previewMode) return;
    const pubRef = doc(db, 'publicProfiles', uid);
    const unsub = onSnapshot(
      pubRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setProfile((prev) => {
          if (!prev) return prev;
          const nextDisplay = getDisplayName({
            display_name: data.display_name ?? data.displayName ?? prev.display_name ?? prev.displayName,
            realName: prev.realName,
            username: data.username || prev.username,
          });
          const next: EnrichedProfile = {
            ...prev,
            display_name: nextDisplay,
            displayName: nextDisplay,
            username: getRawUsername({ username: data.username || prev.username }) || prev.username,
            customRole: data.customRole ?? prev.customRole,
            bio: data.bio ?? prev.bio,
            status: data.status ?? prev.status,
            photoURL: data.photoURL ?? prev.photoURL,
            equippedAvatar: data.equippedAvatar || prev.equippedAvatar,
            equippedFrame: data.equippedFrame ?? prev.equippedFrame,
            equippedBanner: data.equippedBanner ?? prev.equippedBanner,
            equippedTitle: data.equippedTitle ?? prev.equippedTitle,
            ...(Object.prototype.hasOwnProperty.call(data, 'plusBadge')
              ? { plusBadge: data.plusBadge }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, 'plus_badge_design')
              ? { plus_badge_design: data.plus_badge_design }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, 'plus_badge_visible')
              ? { plus_badge_visible: data.plus_badge_visible }
              : {}),
            equippedCosmetics: {
              ...(prev.equippedCosmetics || {}),
              ...(data.equippedCosmetics || {}),
            },
          };
          writeCachedProfile(uid, next);
          return next;
        });
      },
      () => {}
    );
    return () => unsub();
  }, [uid, isGuest, previewMode]);

  // 4. Keep own profile synced live with AuthContext & WalletContext (zero loading spinner!)
  useEffect(() => {
    if (!isOwnProfile || !ownProfile || previewMode || !uid) return;
    setProfile((prev) => {
      const base =
        prev ||
        buildImmediateOwnSeed(
          uid,
          ownProfile,
          currentUser,
          wallet.equipped,
          myProBadgeVisible,
          myProBadgeDesign
        );
      const op = ownProfile as any;
      const liveEquipped = wallet.equipped || {};
      const nextFrame = liveEquipped.frame || op.equippedFrame || base.equippedFrame || 'none';
      const nextBanner = liveEquipped.banner || op.equippedBanner || base.equippedBanner || 'none';
      const nextEffect =
        liveEquipped.effect ||
        op.equippedCosmetics?.profileEffect ||
        base.equippedCosmetics?.profileEffect ||
        'none';
      const nextTitle = liveEquipped.title || op.equippedTitle || base.equippedTitle || 'title-rookie';
      const nextNameplate = liveEquipped.nameplate || op.nameplate || base.nameplate || 'none';
      const nextAvatar =
        op.equippedAvatar === 'custom'
          ? 'custom'
          : liveEquipped.avatar || op.equippedAvatar || base.equippedAvatar || 'avatar-1';

      const nextName = getDisplayName({
        display_name: op.display_name ?? op.displayName ?? base.display_name ?? base.displayName,
        realName: op.realName ?? op.name ?? currentUser?.displayName ?? base.realName,
        username: op.username ?? base.username,
      });

      const next: EnrichedProfile = {
        ...base,
        display_name: nextName,
        displayName: nextName,
        username: getRawUsername({ username: op.username ?? base.username }) || base.username,
        role: op.role || base.role,
        customRole: op.customRole ?? base.customRole,
        bio: op.bio ?? base.bio,
        status: op.status ?? base.status,
        equippedAvatar: nextAvatar,
        photoURL: op.photoURL ?? base.photoURL,
        equippedFrame: nextFrame,
        equippedBanner: nextBanner,
        equippedTitle: nextTitle,
        nameplate: nextNameplate,
        equippedBadges: op.equippedBadges ?? base.equippedBadges,
        proBadge: myProBadgeVisible ? myProBadgeDesign : null,
        plusBadge: myEffectivePlusBadgeId,
        equippedCosmetics: {
          ...(base.equippedCosmetics || {}),
          ...(op.equippedCosmetics || {}),
          ...liveEquipped,
          frame: nextFrame !== 'none' ? nextFrame : undefined,
          avatarFrame: nextFrame !== 'none' ? nextFrame : undefined,
          banner: nextBanner !== 'none' ? nextBanner : undefined,
          profileBanner: nextBanner !== 'none' ? nextBanner : undefined,
          effect: nextEffect !== 'none' ? nextEffect : undefined,
          profileEffect: nextEffect !== 'none' ? nextEffect : undefined,
          nameplate: nextNameplate !== 'none' ? nextNameplate : undefined,
          title: nextTitle,
        },
      };
      writeCachedProfile(uid, next);
      return next;
    });
  }, [
    isOwnProfile,
    ownProfile,
    currentUser,
    wallet.equipped,
    myProBadgeDesign,
    myProBadgeVisible,
    myEffectivePlusBadgeId,
    previewMode,
    uid,
  ]);

  const handleFollowToggle = async () => {
    if (propOnFollow) {
      propOnFollow();
      return;
    }
    if (!currentUser || !uid || isOwnProfile || followLoading) return;
    if (isGuest) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    const nextAction: 'follow' | 'unfollow' = isFollowing ? 'unfollow' : 'follow';
    const followDocId = `${currentUser.uid}_${uid}`;
    const followRef = doc(db, 'follows', followDocId);
    try {
      if (isFollowing) {
        await withTimeout(deleteDoc(followRef), PROFILE_REQUEST_TIMEOUT_MS, 'Unfollow');
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await withTimeout(
          setDoc(followRef, {
            followerId: currentUser.uid,
            followingId: uid,
            createdAt: serverTimestamp(),
          }),
          PROFILE_REQUEST_TIMEOUT_MS,
          'Follow'
        );
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }

      // Sync the follow mutation to D1 follows table so counts and lists stay consistent
      void (async () => {
        try {
          const token = await auth.currentUser?.getIdToken().catch(() => null);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;
          await fetch('/api/follows', {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({
              action: nextAction,
              followerUid: currentUser.uid,
              followingUid: uid,
            }),
          });
        } catch {
          // Best-effort sync; Firestore update already succeeded
        }
      })();
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowList = async (
    type: 'followers' | 'following',
    options?: { append?: boolean }
  ) => {
    if (!uid || previewMode) return;
    const isAppend = Boolean(options?.append);
    const offset = isAppend ? followListOffsetRef.current : 0;

    // Cancel any previous in-flight request so closing & reopening never gets stuck
    const reqId = ++followListReqIdRef.current;
    if (followListAbortRef.current) {
      followListAbortRef.current.abort();
      followListAbortRef.current = null;
    }
    const controller = new AbortController();
    followListAbortRef.current = controller;
    const timeoutHandle = window.setTimeout(() => controller.abort(), PROFILE_REQUEST_TIMEOUT_MS);

    setFollowListModal(type);
    setFollowListError(null);
    if (isAppend) {
      setFollowListLoadingMore(true);
    } else {
      setFollowListLoading(true);
      setFollowListLoadingMore(false);
      setFollowListUsers([]);
      setFollowListHasMore(false);
      setFollowListTotal(null);
      followListOffsetRef.current = 0;
    }

    const endpoint = type === 'followers' ? '/api/followers' : '/api/following';
    const url = `${endpoint}?uid=${encodeURIComponent(uid)}&limit=${FOLLOW_LIST_PAGE_SIZE}&offset=${offset}`;
    const fallbackErrorMsg =
      type === 'followers' ? "Couldn't load followers" : "Couldn't load following";

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'same-origin',
      });

      const rawText = await response.text();
      let parsedBody: any = null;
      try {
        parsedBody = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsedBody = rawText;
      }

      console.info('[ProfileView][FollowList]', {
        url,
        status: response.status,
        body: parsedBody,
      });

      if (reqId !== followListReqIdRef.current) return;

      if (!response.ok || !parsedBody || typeof parsedBody !== 'object') {
        throw new Error(fallbackErrorMsg);
      }

      const rawList =
        type === 'followers'
          ? (Array.isArray(parsedBody.followers) ? parsedBody.followers : [])
          : (Array.isArray(parsedBody.following) ? parsedBody.following : []);

      let normalizedItems: FollowListItem[] = rawList
        .map((item: any) => normalizeFollowListItem(item))
        .filter((item: FollowListItem | null): item is FollowListItem => item !== null);

      let totalCount = Number(
        type === 'followers'
          ? (parsedBody.total ?? parsedBody.followersCount ?? normalizedItems.length)
          : (parsedBody.total ?? parsedBody.followingCount ?? normalizedItems.length)
      );
      if (!Number.isFinite(totalCount) || totalCount < 0) {
        totalCount = normalizedItems.length;
      }

      let hasMore = Boolean(parsedBody.hasMore);

      // Compatibility fallback: if D1 has 0 rows on initial page, check legacy Firestore follows
      if (!isAppend && normalizedItems.length === 0) {
        try {
          const field = type === 'followers' ? 'followingId' : 'followerId';
          const targetField = type === 'followers' ? 'followerId' : 'followingId';
          const q = query(
            collection(db, 'follows'),
            where(field, '==', uid),
            limit(FOLLOW_LIST_PAGE_SIZE)
          );
          const snap = await withTimeout(getDocs(q), 5000, 'Follow list');
          if (reqId !== followListReqIdRef.current) return;

          const legacyUids = Array.from(
            new Set(
              snap.docs
                .map((d) => String(d.data()?.[targetField] || '').trim())
                .filter(Boolean)
            )
          );

          if (legacyUids.length > 0) {
            const profileMap = await withTimeout(
              getPublicProfiles(legacyUids),
              5000,
              'Follow profiles'
            ).catch(() => new Map<string, PublicProfile>());
            if (reqId !== followListReqIdRef.current) return;

            normalizedItems = legacyUids
              .map((tUid) => {
                const prof = profileMap.get(tUid);
                return normalizeFollowListItem(
                  prof
                    ? {
                        ...prof,
                        uid: tUid,
                        level: prof.stats?.level ?? (prof as any).level ?? 1,
                      }
                    : {
                        uid: tUid,
                        displayName: 'Student',
                        username: '',
                        avatar: 'avatar-1',
                        level: 1,
                      }
                );
              })
              .filter((item): item is FollowListItem => item !== null);
            totalCount = Math.max(totalCount, normalizedItems.length);
            hasMore = false;
          }
        } catch {
          // Keep empty D1 result if Firestore fallback is unavailable
        }
      }

      if (reqId !== followListReqIdRef.current) return;

      if (isAppend) {
        setFollowListUsers((prev) => {
          const seen = new Set(prev.map((u) => u.uid));
          const merged = [...prev];
          for (const item of normalizedItems) {
            if (!seen.has(item.uid)) {
              seen.add(item.uid);
              merged.push(item);
            }
          }
          followListOffsetRef.current = merged.length;
          return merged;
        });
      } else {
        followListOffsetRef.current = normalizedItems.length;
        setFollowListUsers(normalizedItems);
        if (type === 'followers') {
          setFollowersCount(totalCount);
        } else {
          setFollowingCount(totalCount);
        }
      }

      setFollowListTotal(totalCount);
      setFollowListHasMore(hasMore);
    } catch (err) {
      if (reqId !== followListReqIdRef.current) return;
      console.error('[ProfileView][FollowList] Failed to load:', err);
      setFollowListError(fallbackErrorMsg);
    } finally {
      window.clearTimeout(timeoutHandle);
      if (reqId === followListReqIdRef.current) {
        followListAbortRef.current = null;
        setFollowListLoading(false);
        setFollowListLoadingMore(false);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !uid) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be under 5MB.');
      return;
    }

    setUploadingPhoto(true);
    setEditError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable'));
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/webp', 0.85));
          };
          img.onerror = () => reject(new Error('Failed to decode image'));
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const idToken = await currentUser.getIdToken();
      const uploadResp = await withTimeout(
        fetch('/api/profile/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ dataUrl }),
        }),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Avatar upload'
      );

      let finalPhotoUrl = dataUrl;
      if (uploadResp.ok) {
        const payload = await uploadResp.json();
        if (payload?.avatarUrl) finalPhotoUrl = payload.avatarUrl;
      }

      if (!finalPhotoUrl.startsWith('data:')) {
        try {
          await updateFirebaseAuthProfile(currentUser, { photoURL: finalPhotoUrl });
        } catch {
          // ignore
        }
      }

      setProfile((prev) =>
        prev ? { ...prev, photoURL: finalPhotoUrl, equippedAvatar: 'custom' } : prev
      );
      setEditAvatar('custom');
    } catch (err: any) {
      setEditError(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !uid || !isOwnProfile || !profile) return;

    const cleanDisplayName = editDisplayName.trim();
    const cleanUser = editUsername
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    if (cleanDisplayName.length < 2 || cleanDisplayName.length > 32) {
      setEditError('Display name must be between 2 and 32 characters.');
      return;
    }
    if (cleanUser && (cleanUser.length < 3 || cleanUser.length > 20)) {
      setEditError('Username must be 3–20 characters (letters, numbers, underscores).');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      const nextEquippedCosmetics: EquippedCosmeticsMap = {
        ...(profile.equippedCosmetics || {}),
        avatar: editAvatar !== 'custom' ? editAvatar : undefined,
        frame: editFrame !== 'none' ? editFrame : undefined,
        avatarFrame: editFrame !== 'none' ? editFrame : undefined,
        banner: editBanner !== 'none' ? editBanner : undefined,
        profileBanner: editBanner !== 'none' ? editBanner : undefined,
        effect: editEffect !== 'none' ? editEffect : undefined,
        profileEffect: editEffect !== 'none' ? editEffect : undefined,
      };

      const nextProfile: EnrichedProfile = {
        ...profile,
        display_name: cleanDisplayName,
        displayName: cleanDisplayName,
        username: cleanUser || profile.username,
        customRole: editCustomRole,
        bio: editBio.trim(),
        status: editStatus.trim(),
        equippedAvatar: editAvatar,
        equippedFrame: editFrame,
        equippedBanner: editBanner,
        equippedBadges: editBadges,
        equippedCosmetics: nextEquippedCosmetics,
      };

      if (isGuest) {
        setProfile(nextProfile);
        writeCachedProfile(uid, nextProfile);
        setIsEditing(false);
        return;
      }

      // Single source of truth propagation via AuthContext.updateProfile
      await withTimeout(
        updateAuthContextProfile({
          display_name: cleanDisplayName,
          displayName: cleanDisplayName,
          nickname: cleanDisplayName,
          ...(cleanUser ? { username: cleanUser } : {}),
          bio: editBio.trim(),
          status: editStatus.trim(),
          customRole: editCustomRole,
          avatar: editAvatar === 'custom' ? profile.photoURL || 'custom' : editAvatar,
          equippedAvatar: editAvatar,
          photoURL: editAvatar === 'custom' ? profile.photoURL || '' : profile.photoURL || '',
          frame: editFrame,
          equippedFrame: editFrame,
          banner: editBanner,
          equippedBanner: editBanner,
          equippedBadges: editBadges,
          equipped: nextEquippedCosmetics,
        } as any),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Save profile'
      );

      // Sync cosmetics & public profile caches in parallel (non-blocking if one lags)
      void Promise.allSettled([
        wallet.equipMultipleCosmetics({
          avatar: editAvatar !== 'custom' ? editAvatar : null,
          frame: editFrame !== 'none' ? editFrame : null,
          banner: editBanner !== 'none' ? editBanner : null,
          effect: editEffect !== 'none' ? editEffect : null,
        }),
        syncPublicProfile(uid, {
          display_name: cleanDisplayName,
          displayName: cleanDisplayName,
          username: cleanUser || profile.username,
          bio: editBio.trim(),
          status: editStatus.trim(),
          customRole: editCustomRole,
          avatar: editAvatar === 'custom' ? profile.photoURL || 'custom' : editAvatar,
          equippedAvatar: editAvatar,
          frame: editFrame,
          equippedFrame: editFrame,
          banner: editBanner,
          equippedBanner: editBanner,
          badges: editBadges,
          equipped: nextEquippedCosmetics,
        }),
        syncProfileToD1Backend(uid, {
          display_name: cleanDisplayName,
          displayName: cleanDisplayName,
          username: cleanUser || profile.username,
          customRole: editCustomRole,
          avatar: editAvatar,
          frame: editFrame,
          banner: editBanner,
        }),
      ]);

      broadcastPublicProfileUpdate(uid, {
        display_name: cleanDisplayName,
        displayName: cleanDisplayName,
        username: cleanUser || profile.username,
        customRole: editCustomRole,
        bio: editBio.trim(),
        status: editStatus.trim(),
        avatar: editAvatar,
        equippedAvatar: editAvatar,
        frame: editFrame,
        equippedFrame: editFrame,
        banner: editBanner,
        equippedBanner: editBanner,
      });

      setProfile(nextProfile);
      writeCachedProfile(uid, nextProfile);
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = () => {
    if (propOnShare) {
      propOnShare();
      return;
    }
    if (!profile) return;
    const handle = getRawUsername({ username: profile.username }) || profile.uid;
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleAdminToggleBan = async () => {
    if (!isAdmin || !uid || isOwnProfile || !profile) return;
    const nextBan = !profile.isBanned;
    try {
      await withTimeout(
        updateDoc(doc(db, 'users', uid), { isBanned: nextBan }),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Update ban status'
      );
      setProfile((prev) => (prev ? { ...prev, isBanned: nextBan } : null));
    } catch (err) {
      console.error('Failed to update ban state:', err);
    }
  };

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const topBar = !previewMode && (
    <header
      className={`sticky top-0 z-30 bg-[var(--bg)] pt-[env(safe-area-inset-top,0px)] transition-colors ${
        scrolled ? 'border-b border-[var(--border)]' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-[640px] mx-auto h-[56px] px-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        <h1 className="text-[17px] font-semibold text-[var(--text)] truncate select-none">
          Profile
        </h1>

        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Open settings"
            className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] transition-colors cursor-pointer shrink-0"
          >
            <Settings size={19} strokeWidth={1.9} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleShareProfile}
            aria-label="Share profile"
            className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] transition-colors cursor-pointer shrink-0"
          >
            {copiedToast ? (
              <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 size={18} strokeWidth={1.9} />
            )}
          </button>
        )}
      </div>
    </header>
  );

  // Fast skeleton (never a black screen, never a spinner-only screen)
  if (basicsLoading && !profile) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] overflow-x-clip">
        {topBar}
        <ProfileSkeleton />
      </div>
    );
  }

  // Inline error card with Retry (never a red banner)
  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] overflow-x-clip">
        {topBar}
        <div className="max-w-[640px] mx-auto px-4 py-12">
          <div className="p-6 rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] text-center flex flex-col items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-[var(--text)]">
                {basicsError ? "Couldn't load profile" : 'Profile not found'}
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-sm">
                {basicsError || 'This student profile could not be found or is unavailable.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReloadToken((t) => t + 1)}
              className="min-h-[44px] px-5 rounded-full bg-[var(--accent)] text-white text-[14px] font-semibold inline-flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName({
    display_name: profile.display_name ?? profile.displayName,
    realName: profile.realName,
    username: profile.username,
  });
  const usernameHandle = getUsernameHandle({ username: profile.username });
  const rawUsername = getRawUsername({ username: profile.username }) || 'student';

  const levelInfo = computeLevelFromStats(profile.stats || {});

  // Single source of truth for plan tier (shared with postLimits / useEffectivePlan):
  // - Own profile reads live from useEffectivePlan() (instant updates on plan change, zero stale cache).
  // - Other profiles resolve via getUserPlanTier() from the same config/helper.
  const targetPlan: PlanTier = (() => {
    if (isOwnProfile) {
      return isGuest ? 'free' : liveEffectivePlan.plan;
    }
    const resolved = getUserPlanTier({
      uid: profile.uid,
      role: profile.role,
      plan: profile.plan,
      planTier: profile.planTier,
      isPro: profile.isPro,
      isPlus: profile.isPlus,
      isPremium: profile.isPremium,
      proUntil: profile.proUntil,
      plusUntil: profile.plusUntil,
      planExpiresAt: profile.planExpiresAt,
      premiumExpiresAt: profile.premiumExpiresAt,
      proPlanId: profile.proPlanId,
      plusPlanId: profile.plusPlanId,
    });
    if (resolved !== 'free') return resolved;
    if (typeof profile.plusBadge === 'number') {
      return 'plus';
    }
    if (profile.proBadge) return 'pro';
    return 'free';
  })();

  const targetPlanLabel = getPlanDisplayLabel(targetPlan);
  const isTargetPlus = targetPlan === 'plus';
  const isTargetPro = targetPlan === 'pro' || targetPlan === 'plus';

  const activePlusBadgeId: number | null = isTargetPlus
    ? isOwnProfile
      ? myEffectivePlusBadgeId
      : profile.plus_badge_visible === false
      ? null
      : resolvePlusBadgeId(profile.plusBadge ?? profile.plus_badge_design ?? profile.plus_badge_id)
    : null;

  const activeProBadgeDesign: string | null =
    !isTargetPlus && isTargetPro
      ? isOwnProfile
        ? myProBadgeVisible
          ? myProBadgeDesign
          : null
        : profile.proBadge
        ? normalizeProBadgeDesign(profile.proBadge)
        : null
      : null;

  const equippedBannerId =
    (isOwnProfile ? wallet.equipped?.banner : null) ||
    profile.equippedCosmetics?.banner ||
    profile.equippedCosmetics?.profileBanner ||
    profile.equippedBanner ||
    profile.banner ||
    'none';
  const equippedFrameId =
    (isOwnProfile ? wallet.equipped?.frame : null) ||
    profile.equippedCosmetics?.frame ||
    profile.equippedCosmetics?.avatarFrame ||
    profile.equippedFrame ||
    profile.frame ||
    'none';
  const equippedEffectId =
    (isOwnProfile ? wallet.equipped?.effect : null) ||
    profile.equippedCosmetics?.effect ||
    profile.equippedCosmetics?.profileEffect ||
    profile.effectId ||
    'none';
  const equippedTitleId =
    profile.equippedCosmetics?.title || profile.equippedTitle || 'title-rookie';
  const equippedNameplateId =
    (isOwnProfile ? wallet.equipped?.nameplate : null) ||
    profile.equippedCosmetics?.nameplate ||
    profile.nameplate ||
    'none';

  const canonicalShortId = String(
    profile.shortId || profile.studentId || deriveDeterministicShortId(profile.uid)
  )
    .replace(/^#+/, '')
    .trim();

  const kobanDisplayCount = isOwnProfile
    ? Number(wallet.balance || 0)
    : Number(profile.kobans ?? profile.stats?.xp ?? 0);

  const openEditAction = () => {
    if (propOnEditProfile) {
      propOnEditProfile();
    } else {
      hydrateEditFields(profile);
      setIsEditing(true);
    }
  };

  const TABS: { id: ProfileTabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'loadout', label: 'Loadout' },
    { id: 'badges', label: 'Badges' },
  ];
  const activeTabIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));

  return (
    <div className="relative min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] overflow-x-clip pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
      {topBar}

      <div className="relative z-10 max-w-[640px] mx-auto px-4 pt-3 pb-8 space-y-5">
        {/* 1. PROFILE HERO CARD (Lives ONLY on /profile) */}
        <section className="relative rounded-[32px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] overflow-hidden">
          {/* Equipped profile effect overlay */}
          {equippedEffectId && equippedEffectId !== 'none' && (
            <ProfileCardEffect itemId={equippedEffectId} canAnimate />
          )}

          {/* Equipped Banner */}
          <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-br from-[#D71921]/25 via-[#18181f] to-[#3a4cff]/25">
            <BannerRenderer
              bannerId={equippedBannerId === 'none' ? undefined : equippedBannerId}
              showReadabilityOverlay={false}
              className="h-36 sm:h-44"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          </div>

          {/* Main Hero Body */}
          <div className="relative px-4 sm:px-6 pb-5 pt-0">
            {/* Overlapping Avatar + Equipped Frame Ring + Nameplate */}
            <div className="relative -mt-12 sm:-mt-14 mb-3 flex items-end justify-between gap-2 flex-wrap">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <div className="rounded-full p-1 bg-[var(--card)] ring-2 ring-[var(--border)] shadow-md">
                  <BoardlyAvatar
                    size={88}
                    uid={profile.uid}
                    equippedAvatar={
                      (isOwnProfile ? wallet.equipped?.avatar : null) ||
                      profile.equippedAvatar ||
                      profile.avatar
                    }
                    customPhotoURL={profile.photoURL}
                    equippedFrameId={equippedFrameId}
                    alt={displayName}
                  />
                </div>
                <span className="absolute -bottom-1 right-0 z-20 inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-doto-title text-[11px] tracking-wider border-2 border-[var(--card)] shadow-sm">
                  LV {levelInfo.level}
                </span>
              </div>

              {/* Equipped Nameplate Chip */}
              {equippedNameplateId && equippedNameplateId !== 'none' ? (
                <div className="max-w-full overflow-hidden">
                  <Nameplate
                    itemId={equippedNameplateId}
                    name={rawUsername}
                    shortId={canonicalShortId}
                  />
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold tracking-wide max-w-full"
                  style={{
                    background: 'var(--koban-bg)',
                    borderColor: 'var(--koban-border)',
                    color: 'var(--koban)',
                  }}
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-inter-num">
                    {rawUsername} #{canonicalShortId}
                  </span>
                </div>
              )}
            </div>

            {/* Display Name + @username + PRO Chip */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Display Name + Plan Chip (Free / Pro / Plus) + Equipped Badge */}
                <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[var(--text)] leading-tight break-words">
                  {displayName}
                </h2>
                {isTargetPlus ? null : isTargetPro ? (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border"
                    style={{
                      background: 'var(--koban-bg)',
                      borderColor: 'var(--koban-border)',
                      color: 'var(--koban)',
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {targetPlanLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]">
                    {targetPlanLabel}
                  </span>
                )}
                {isTargetPlus && activePlusBadgeId !== null ? (
                  <PlusBadge
                    id={activePlusBadgeId}
                    size="sm"
                    animated
                    priority
                  />
                ) : activeProBadgeDesign ? (
                  <ProBadge
                    design={activeProBadgeDesign}
                    size="sm"
                    animated
                    priority
                  />
                ) : null}
              </div>
              {usernameHandle && (
                <p className="text-[14px] font-medium text-[var(--text-muted)]">
                  {usernameHandle}
                </p>
              )}
            </div>

            {/* Role & Active Status Chips */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)]">
                <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
                {profile.customRole || 'Student'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/10 border border-emerald-600/25 text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {profile.status?.trim() || 'Active'}
              </span>
            </div>

            {/* Stats Row: Level, Kobans, Followers, Following */}
            <div className="mt-4 rounded-[22px] bg-[var(--bg)] border border-[var(--border)] p-2.5 grid grid-cols-4 items-center text-center divide-x divide-[var(--border)]">
              <div className="px-1 py-1">
                <div className="font-inter-num text-[17px] sm:text-[18px] font-bold text-[var(--text)]">
                  {levelInfo.level.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  Level
                </div>
              </div>

              <div className="px-1 py-1">
                <div
                  className="font-inter-num text-[17px] sm:text-[18px] font-bold"
                  style={{ color: 'var(--koban)' }}
                >
                  {kobanDisplayCount.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  Kobans
                </div>
              </div>

              <button
                type="button"
                onClick={() => openFollowList('followers')}
                className="px-1 py-1 hover:bg-[var(--settings-row-hover)] rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-inter-num text-[17px] sm:text-[18px] font-bold text-[var(--text)]">
                  {followsSyncing && followersCount === 0 ? (
                    <span className="inline-block w-7 h-4 rounded bg-[var(--border)] animate-pulse align-middle" />
                  ) : (
                    followersCount.toLocaleString()
                  )}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  Followers
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFollowList('following')}
                className="px-1 py-1 hover:bg-[var(--settings-row-hover)] rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-inter-num text-[17px] sm:text-[18px] font-bold text-[var(--text)]">
                  {followsSyncing && followingCount === 0 ? (
                    <span className="inline-block w-7 h-4 rounded bg-[var(--border)] animate-pulse align-middle" />
                  ) : (
                    followingCount.toLocaleString()
                  )}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  Following
                </div>
              </button>
            </div>

            {followsError && (
              <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--text-muted)] px-1">
                <span>{followsError}</span>
                <button
                  type="button"
                  onClick={() => void loadFollows()}
                  className="text-[var(--accent)] font-medium hover:underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Dot-Matrix ID Strip */}
            <div className="mt-3 px-3.5 py-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-3">
              <div
                className="flex-1 h-4 opacity-50"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, var(--text) 0px, var(--text) 2px, transparent 2px, transparent 5px, var(--accent) 5px, var(--accent) 6px, transparent 6px, transparent 9px)',
                  maskImage: 'radial-gradient(circle, black 1.4px, transparent 1.4px)',
                  WebkitMaskImage: 'radial-gradient(circle, black 1.4px, transparent 1.4px)',
                  maskSize: '4px 4px',
                  WebkitMaskSize: '4px 4px',
                }}
              />
              <span className="font-mono text-[12px] font-semibold tracking-wider text-[var(--text-muted)] shrink-0">
                ID #{canonicalShortId}
              </span>
            </div>

            {/* Action Buttons: zero truncation or clipping at 360px */}
            {!previewMode && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={openEditAction}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 shrink-0" />
                      <span className="hidden min-[400px]:inline">Edit profile</span>
                      <span className="min-[400px]:hidden">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/locker')}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:bg-[var(--settings-row-hover)] active:scale-[0.98] transition cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span>Locker</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/store')}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:bg-[var(--settings-row-hover)] active:scale-[0.98] transition cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" style={{ color: 'var(--koban)' }} />
                      <span>Store</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (propOnMessage) {
                          propOnMessage();
                        } else if (isGuest) {
                          navigate('/login');
                        } else {
                          setIsChatOpen(true);
                        }
                      }}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:bg-[var(--settings-row-hover)] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="min-h-[46px] px-2.5 sm:px-3 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold whitespace-nowrap hover:bg-[var(--settings-row-hover)] active:scale-[0.98] transition cursor-pointer"
                    >
                      {copiedToast ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 shrink-0" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Admin Moderation Bar */}
            {isAdmin && !isOwnProfile && !previewMode && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={handleAdminToggleBan}
                  className={`min-h-[40px] px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5 border cursor-pointer ${
                    profile.isBanned
                      ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--danger)]/10 border-[var(--danger-border)] text-[var(--danger)]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {profile.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 2. SEGMENTED TABS: Overview, Loadout, Badges */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className="relative p-1 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] grid grid-cols-3 items-center h-[48px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-[var(--accent)] transition-transform duration-200 ease-out"
            style={{
              width: 'calc((100% - 8px) / 3)',
              left: '4px',
              transform: `translateX(${activeTabIndex * 100}%)`,
            }}
          />
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className={`relative z-10 h-full rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 3. TAB PANELS */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* About me card */}
            <div className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-medium text-[var(--text-muted)]">About me</h3>
                {isOwnProfile && !previewMode && (
                  <button
                    type="button"
                    onClick={openEditAction}
                    className="text-[13px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {profile.bio && profile.bio.trim().length > 0 ? (
                <p className="text-[15px] leading-relaxed text-[var(--text)] whitespace-pre-wrap break-words">
                  {profile.bio}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => isOwnProfile && !previewMode && openEditAction()}
                  disabled={!isOwnProfile || previewMode}
                  className="w-full text-left rounded-2xl p-3.5 border border-dashed border-[var(--border)] bg-[var(--bg)] text-[14px] text-[var(--text-muted)] hover:border-[var(--text-muted)] transition-colors cursor-pointer disabled:cursor-default"
                >
                  {isOwnProfile ? 'Add a bio...' : 'No bio added yet.'}
                </button>
              )}
            </div>

            {/* Posts Section (loads independently) */}
            {!previewMode && (
              <ProfilePostsSection
                targetUid={profile.uid}
                isOwnProfile={isOwnProfile}
                authorDisplayName={displayName}
                authorUsername={profile.username}
                authorAvatar={
                  profile.equippedAvatar === 'custom'
                    ? profile.photoURL
                    : profile.equippedAvatar
                }
                authorFrame={equippedFrameId}
                authorRole={profile.role}
                authorProBadge={activeProBadgeDesign}
                authorPlusBadge={activePlusBadgeId}
                authorPlan={targetPlan}
                isPro={isTargetPro}
                onCountChange={setPostsCount}
              />
            )}
          </div>
        )}

        {activeTab === 'loadout' && (
          <div className="rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--text)]">Equipped loadout</h3>
                <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                  Cosmetic items active on this student profile.
                </p>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate('/locker')}
                  className="min-h-[40px] px-4 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Open Locker</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  slot: 'Avatar',
                  item: getCosmeticById(profile.equippedAvatar),
                  fallback:
                    profile.equippedAvatar === 'custom' ? 'Custom Photo' : 'Default Avatar',
                },
                {
                  slot: 'Avatar Frame',
                  item: getCosmeticById(equippedFrameId),
                  fallback: 'No Frame Equipped',
                },
                {
                  slot: 'Profile Banner',
                  item: getCosmeticById(equippedBannerId),
                  fallback: 'Default Banner',
                },
                {
                  slot: 'Nameplate',
                  item: getCosmeticById(equippedNameplateId),
                  fallback: 'Standard Gold Nameplate',
                },
                {
                  slot: 'Title',
                  item: getCosmeticById(equippedTitleId),
                  fallback: 'Boardly Rookie',
                },
                {
                  slot: 'Profile Effect',
                  item: getCosmeticById(equippedEffectId),
                  fallback: 'No Effect Equipped',
                },
              ].map((entry) => {
                const rarity: CosmeticRarity = entry.item?.rarity || 'common';
                const rStyle = RARITY_BADGE_TOKENS[rarity];
                return (
                  <div
                    key={entry.slot}
                    className="rounded-2xl p-3.5 bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-[var(--text-muted)]">
                        {entry.slot}
                      </div>
                      <div className="text-[14px] font-semibold text-[var(--text)] truncate mt-0.5">
                        {entry.item?.name || entry.fallback}
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border shrink-0"
                      style={rStyle}
                    >
                      {rarity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[var(--text)]">Achievement badges</h3>
              <span className="text-[13px] font-medium text-[var(--text-muted)]">
                {(profile.equippedBadges || ['first_login']).length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_ACHIEVEMENT_BADGES.map((badge) => {
                const unlocked = (profile.equippedBadges || ['first_login']).includes(badge.id);
                const rStyle = RARITY_BADGE_TOKENS[badge.rarity || 'common'];
                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-3.5 border transition-colors ${
                      unlocked
                        ? 'bg-[var(--bg)] border-[var(--border)]'
                        : 'bg-[var(--bg)]/60 border-dashed border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                          unlocked
                            ? 'bg-[var(--accent)]/12 border-[var(--accent)]/30 text-[var(--accent)]'
                            : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border"
                        style={rStyle}
                      >
                        {badge.rarity}
                      </span>
                    </div>
                    <div
                      className={`text-[13px] font-semibold truncate ${
                        unlocked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {badge.name}
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Followers / Following Modal */}
      {followListModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={followListModal}
          className="fixed inset-0 z-[10020] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeFollowListModal}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full sm:max-w-md max-h-[85dvh] rounded-t-[24px] sm:rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
            <div className="sm:hidden w-9 h-1 rounded-full bg-[var(--border)] mx-auto mt-2.5 shrink-0" />
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-[var(--text)] capitalize">
                  {followListModal}
                </h3>
                {!followListLoading && followListTotal !== null && (
                  <span className="font-inter-num text-[12px] font-semibold text-[var(--text-muted)]">
                    {followListTotal.toLocaleString()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={closeFollowListModal}
                aria-label="Close list"
                className="w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto overscroll-contain space-y-2 flex-1 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
              {followListLoading ? (
                <div className="space-y-2.5 py-2 animate-pulse" aria-busy="true" aria-label={`Loading ${followListModal}`}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-2xl bg-[var(--bg)] border border-[var(--border)]" />
                  ))}
                </div>
              ) : followListError && followListUsers.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-[13px] text-[var(--text-muted)]">{followListError}</p>
                  <button
                    type="button"
                    onClick={() => void openFollowList(followListModal)}
                    className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : followListUsers.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-muted)] text-[14px]">
                  {followListModal === 'followers'
                    ? 'No followers yet.'
                    : 'Not following anyone yet.'}
                </div>
              ) : (
                <>
                  {followListUsers.map((u) => {
                    const uDisplay = getDisplayName({
                      display_name: u.displayName,
                      username: u.username,
                    });
                    const uHandle = getUsernameHandle({ username: u.username });
                    return (
                      <button
                        type="button"
                        key={u.uid}
                        onClick={() => {
                          closeFollowListModal();
                          navigate(`/profile?uid=${encodeURIComponent(u.uid)}`);
                        }}
                        className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl bg-[var(--bg)] hover:bg-[var(--settings-row-hover)] border border-[var(--border)] cursor-pointer transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BoardlyAvatar
                            size={40}
                            uid={u.uid}
                            equippedAvatar={u.equippedAvatar}
                            customPhotoURL={u.photoURL}
                            equippedFrameId={u.equippedFrame}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                                {uDisplay}
                              </span>
                              {typeof u.plusBadge === 'number' ? (
                                <PlusBadge id={u.plusBadge} size="sm" listMode />
                              ) : u.proBadge ? (
                                <ProBadge design={u.proBadge} size="sm" listMode />
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] truncate">
                              {uHandle && <span className="truncate">{uHandle}</span>}
                              {uHandle && <span aria-hidden="true">·</span>}
                              <span className="font-inter-num shrink-0">Lv {u.level}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-[var(--accent)] shrink-0">
                          View
                        </span>
                      </button>
                    );
                  })}

                  {followListError && followListUsers.length > 0 && (
                    <div className="pt-2 text-center space-y-2">
                      <p className="text-[12px] text-[var(--text-muted)]">{followListError}</p>
                      <button
                        type="button"
                        onClick={() => void openFollowList(followListModal, { append: true })}
                        className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-[12px] font-semibold cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {followListHasMore && !followListError && (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={followListLoadingMore}
                        onClick={() => void openFollowList(followListModal, { append: true })}
                        className="w-full py-2.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--settings-row-hover)] border border-[var(--border)] text-[13px] font-semibold text-[var(--text)] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {followListLoadingMore ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Message Modal */}
      {isChatOpen && profile && (
        <DirectMessageModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          partner={{
            uid: profile.uid,
            displayName,
            username: profile.username,
            equippedAvatar: profile.equippedAvatar,
            photoURL: profile.photoURL,
            equippedFrame: profile.equippedFrame,
            role: profile.role,
          }}
        />
      )}

      {/* Edit Profile Sheet */}
      {isEditing && isOwnProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile"
          className="fixed inset-0 z-[10020] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => !saving && setIsEditing(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full sm:max-w-lg max-h-[90dvh] rounded-t-[24px] sm:rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
            <div className="sm:hidden w-9 h-1 rounded-full bg-[var(--border)] mx-auto mt-2.5 shrink-0" />
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <h3 className="text-[17px] font-semibold text-[var(--text)]">Edit profile</h3>
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsEditing(false)}
                aria-label="Close edit profile"
                className="w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 pb-[calc(24px+env(safe-area-inset-bottom,0px))]"
            >
              {editError && (
                <div className="p-3 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger-border)] text-[var(--danger)] text-[13px] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Custom Photo Upload */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <BoardlyAvatar
                  size={60}
                  uid={profile.uid}
                  equippedAvatar={editAvatar}
                  customPhotoURL={profile.photoURL}
                  equippedFrameId={editFrame}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[var(--text)]">Profile photo</div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Upload a photo or equip a Boardly avatar in your Locker.
                  </p>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[38px] px-4 rounded-full text-[13px] font-semibold bg-[var(--card)] hover:bg-[var(--settings-row-hover)] border border-[var(--border)] text-[var(--text)] cursor-pointer"
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-muted)] mb-1.5">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    maxLength={32}
                    required
                    className="w-full min-h-[46px] px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-muted)] mb-1.5">
                    Username
                  </label>
                  <div className="min-h-[46px] px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center focus-within:border-[var(--accent)]">
                    <span className="text-[var(--text-muted)] text-[15px] mr-1">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        )
                      }
                      maxLength={20}
                      className="w-full bg-transparent text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-muted)] mb-1.5">
                    Status
                  </label>
                  <input
                    type="text"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    placeholder="Studying for Finals..."
                    maxLength={50}
                    className="w-full min-h-[46px] px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-muted)] mb-1.5">
                    Academic track
                  </label>
                  <select
                    value={editCustomRole}
                    onChange={(e) => setEditCustomRole(e.target.value)}
                    className="w-full min-h-[46px] px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[15px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {COSMETIC_ROLE_OPTIONS.map((roleOpt) => (
                      <option key={roleOpt} value={roleOpt}>
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-muted)] mb-1.5">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Add a short bio..."
                  rows={3}
                  maxLength={240}
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(false)}
                  className="min-h-[44px] px-5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--settings-row-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 rounded-full bg-[var(--accent)] text-white text-[14px] font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
