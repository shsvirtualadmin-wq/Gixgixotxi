import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  Edit3,
  ShoppingBag,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  Share2,
  Users,
  Flame,
  Award,
  Sparkles,
  Shield,
  Clock,
  Calendar,
  CreditCard,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pin,
  RotateCcw,
  Tag,
  Settings,
  MessageSquare,
} from 'lucide-react';

import { DirectMessageModal } from '@/components/chat/DirectMessageModal';
import {
  checkChatPermission,
  sendChatRequest,
  subscribeIncomingChatRequests,
  type ChatPermissionState,
} from '@/services/chatService';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { resolveUnifiedPlanStatus } from '@/config/plans';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  isValidProBadgeDesign,
  normalizeProBadgeDesign,
} from '@/lib/proBadgeDesigns';

// Fast in-memory cache for instant profile reopening (kept in sync via subscribePublicProfile)
const profileMemoryCache = new Map<string, { profile: PublicProfile; timestamp: number }>();

export function invalidateProfileMemoryCache(uid?: string): void {
  if (!uid) {
    profileMemoryCache.clear();
    return;
  }
  profileMemoryCache.delete(uid);
}

import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { GuestUpgradeModal } from '@/components/auth/GuestUpgradeModal';
import { WalletModal } from './WalletModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import {
  useProfileLayoutStatus,
  getProfileLayoutSnapshotForUid,
} from '@/hooks/useSecurityStatus';
import {
  getPublicProfile,
  syncPublicProfile,
  subscribePublicProfile,
  broadcastPublicProfileUpdate,
} from '@/services/publicProfileService';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '@/services/followService';
import { getRankTitle } from '@/config/rankLadder';
import {
  PASSPORT_STAMPS,
  STREAK_BADGES,
  ROLE_BADGES,
  type PassportStamp,
  type StreakBadge,
} from '@/config/badgesConfig';
import { getCosmeticById, COSMETICS_CATALOG, type CosmeticItem } from '@/data/cosmeticsCatalog';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileCardEffect,
  CosmeticErrorBoundary,
} from '@/components/koban/CosmeticRenderers';
import {
  BannerRenderer,
  DefaultDotMatrixBanner,
} from '@/components/koban/artwork/bannerArtwork';
import { KobanChip, KobanIcon } from '@/components/koban/KobanIcon';
import { ProfilePostsSection } from './ProfilePostsSection';
import { FollowListModal } from './FollowListModal';
import { EditProfileSheet } from './EditProfileSheet';
import { ShareProfileCardModal } from './ShareProfileCardModal';
import { ProfilePicturePickerModal } from './ProfilePicturePickerModal';
import { MATRIX_AVATARS } from '@/lib/matrixAvatarsData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchUserCommonsPosts } from '@/services/commonsService';
import { deriveFallbackShortId } from '@/utils/shortId';
import { sanitizeStudentDisplayName, isAdminAccount } from '@/utils/privacy';
import { BoardlyAvatar, resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { PublicProfile } from '@/types';
import {
  DEFAULT_PROFILE_LAYOUT,
  normalizeProfileLayout,
  buildSharedProfileData,
  type ProfileLayoutId,
  type SharedProfileData,
} from '@/lib/profileLayouts';
import { ProfileLayoutsRenderer } from './ProfileLayoutsRenderer';

export interface ProfileViewProps {
  /** Explicit layout ID (one of the 10 layouts). Falls back to data.profile_layout or 'game-card'. */
  layout?: ProfileLayoutId | string | null;
  /** Pre-resolved shared profile data object by UID. */
  data?: SharedProfileData | null;
  /** When true, renders the compact live preview card for Settings > Profile Layout carousel. */
  previewMode?: boolean;
  /** If targetUid is provided and not current user, runs in PUBLIC mode. */
  targetUid?: string | null;
  /** Whether mounted full-page (e.g. /dashboard/profile centered column max-w-960px) or in dialog */
  isFullPage?: boolean;
  /** Optional callback to close modal container */
  onClose?: (skipHistoryBack?: boolean) => void;
  /** Force preview mode */
  initialPreviewAsPublic?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  layout: propLayout,
  data: propData,
  previewMode = false,
  targetUid,
  isFullPage = false,
  onClose,
  initialPreviewAsPublic = false,
}) => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, isAdmin, isGuest, signOutUser } = useAuth();
  const { requireAuth } = useAuthGate();
  const { openProfile } = useProfileModal();
  const {
    profile: ownProfile,
    updateProfileData,
  } = useUserProfile();
  const {
    balance: kobanBalance,
    equipped: ownEquipped,
    equipCosmetic,
    owned: ownedCosmetics,
    purchaseCosmetic,
    loading: walletLoading,
    isSuperAdmin,
  } = useWallet();
  const effectivePlan = useEffectivePlan();
  const { effectiveProBadge } = useProBadge();
  const selfLayoutStatus = useProfileLayoutStatus();

  // Determine true mode
  const currentUid = authUser?.uid || authProfile?.uid || null;
  const isViewingSelf = !targetUid || targetUid === currentUid;

  // Toggle for "View as others" (preview public mode while being owner)
  const [previewAsPublic, setPreviewAsPublic] = useState(initialPreviewAsPublic);
  const isPublicMode = !isViewingSelf || previewAsPublic;

  // Profile data state
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tabs: 'overview' | 'loadout' | 'badges'
  const [activeTab, setActiveTab] = useState<'overview' | 'loadout' | 'badges'>('overview');
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Loadout sub-tabs: 'slots' | 'banners'
  const [loadoutSubTab, setLoadoutSubTab] = useState<'slots' | 'banners'>('slots');
  const [bannerFilter, setBannerFilter] = useState<'all' | 'static' | 'animated' | 'owned'>('all');
  const [selectedBannerPreviewId, setSelectedBannerPreviewId] = useState<string | null>(null);
  const [previewThemeMode, setPreviewThemeMode] = useState<'dark' | 'light'>('dark');
  const [equippingBannerId, setEquippingBannerId] = useState<string | null>(null);

  // Follow states
  const [isFollowedByMe, setIsFollowedByMe] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followWorking, setFollowWorking] = useState(false);
  const [unfollowModalOpen, setUnfollowModalOpen] = useState(false);

  // Sub-modals
  const [followListTab, setFollowListTab] = useState<'followers' | 'following' | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [crewDetailModalOpen, setCrewDetailModalOpen] = useState(false);

  // Active badge popover state
  const [badgePopover, setBadgePopover] = useState<{ name: string; meaning: string } | null>(null);

  // Profile effect replay / play once trigger
  const [effectPlayKey, setEffectPlayKey] = useState(1);

  // Equipped streak badges (up to 3)
  const [equippedStreakBadges, setEquippedStreakBadges] = useState<string[]>(['badge_streak_7d']);

  // Pinned stamps in showcase (up to 3)
  const [pinnedShowcase, setPinnedShowcase] = useState<string[]>([]);

  // 1-on-1 Direct Message & Chat Requests modal
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [dmInitialTab, setDmInitialTab] = useState<'chat' | 'requests'>('chat');
  const [chatPermission, setChatPermission] = useState<ChatPermissionState | null>(null);
  const [chatRequestWorking, setChatRequestWorking] = useState(false);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);

  const [guestUpgradeModalOpen, setGuestUpgradeModalOpen] = useState(false);

  // Subscribe to incoming chat requests count for signed-in non-guest user
  useEffect(() => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) {
      setIncomingRequestsCount(0);
      return;
    }
    return subscribeIncomingChatRequests(currentUid, (reqs) => {
      setIncomingRequestsCount(reqs.length);
    });
  }, [currentUid, isGuest]);

  // Open chat/requests modal automatically if navigated from notification (?chat=requests or ?chat=open)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatParam = params.get('chat');
    if (chatParam === 'requests') {
      setDmInitialTab('requests');
      setDmModalOpen(true);
    } else if (chatParam === 'open') {
      setDmInitialTab('chat');
      setDmModalOpen(true);
    }
  }, [targetUid]);

  const selfContextRef = useRef({
    ownProfile,
    authProfile,
    ownEquipped,
    authUserDisplayName: authUser?.displayName || null,
    authUserEmail: authUser?.email || null,
  });
  selfContextRef.current = {
    ownProfile,
    authProfile,
    ownEquipped,
    authUserDisplayName: authUser?.displayName || null,
    authUserEmail: authUser?.email || null,
  };

  useEffect(() => {
    let isMounted = true;
    const resolvedUid = targetUid || currentUid;
    if (!resolvedUid) {
      setLoading(false);
      return;
    }

    const {
      ownProfile: curOwnProfile,
      authProfile: curAuthProfile,
      ownEquipped: curOwnEquipped,
      authUserDisplayName,
    } = selfContextRef.current;

    // For a guest viewing their own profile, build the profile from AuthContext + wallet + D1 state
    const activeGuestSource = (curOwnProfile || curAuthProfile) as Record<string, any> | null;
    if (
      (isViewingSelf && (isGuest || resolvedUid.startsWith('guest_'))) ||
      resolvedUid.startsWith('guest_')
    ) {
      const guestUsername =
        activeGuestSource?.username ||
        activeGuestSource?.displayName ||
        authUserDisplayName ||
        resolvedUid.replace(/^guest_/, '');
      const guestDisplayName =
        activeGuestSource?.displayName ||
        activeGuestSource?.name ||
        guestUsername;
      const guestShortId = activeGuestSource?.shortId || 'GUEST';
      const guestLayoutSnapshot = getProfileLayoutSnapshotForUid(resolvedUid);
      const guestLayout = normalizeProfileLayout(
        (guestLayoutSnapshot.known ? guestLayoutSnapshot.layout : null) ??
          activeGuestSource?.profileLayout ??
          activeGuestSource?.profile_layout ??
          DEFAULT_PROFILE_LAYOUT
      );
      const guestAvatar =
        resolveCosmeticItemId(curOwnEquipped?.avatar, 'avatar') ||
        resolveCosmeticItemId(activeGuestSource?.equipped?.avatar, 'avatar') ||
        resolveCosmeticItemId(activeGuestSource?.avatar, 'avatar') ||
        activeGuestSource?.avatarKey ||
        null;
      const guestBanner =
        curOwnEquipped?.banner ||
        activeGuestSource?.equipped?.banner ||
        activeGuestSource?.equippedBanner ||
        activeGuestSource?.banner ||
        null;
      const guestFrame =
        curOwnEquipped?.frame ||
        activeGuestSource?.equipped?.frame ||
        activeGuestSource?.equippedFrame ||
        activeGuestSource?.frame ||
        null;
      const guestNameplate =
        curOwnEquipped?.nameplate ||
        activeGuestSource?.equipped?.nameplate ||
        activeGuestSource?.equippedNameplate ||
        activeGuestSource?.nameplate ||
        null;
      const guestEffect =
        curOwnEquipped?.effect ||
        activeGuestSource?.equipped?.effect ||
        activeGuestSource?.effectId ||
        null;

      const guestPublicProfile: PublicProfile & { username?: string; isGuest?: boolean; accountType?: string } = {
        uid: resolvedUid,
        displayName: guestDisplayName,
        username: guestUsername,
        studentId: guestShortId,
        shortId: guestShortId,
        avatar: guestAvatar,
        banner: guestBanner,
        frame: guestFrame,
        nameplate: guestNameplate,
        effectId: guestEffect,
        badges: [],
        bio: activeGuestSource?.bio || '',
        status: activeGuestSource?.status || 'active',
        accent: activeGuestSource?.accent || '#D71921',
        memberSince: null,
        crewName: null,
        stats: {
          streak: Number(activeGuestSource?.streak ?? 0),
          longestStreak: Number(activeGuestSource?.streak ?? 0),
          mcqs: Number(activeGuestSource?.totalQuestionsSolved ?? 0),
          accuracy: 0,
        },
        followersCount: 0,
        followingCount: 0,
        lastActiveAt: activeGuestSource?.lastActiveAt ? String(activeGuestSource.lastActiveAt) : new Date().toISOString(),
        role: 'student',
        customRole: 'Guest',
        isGuest: true,
        accountType: 'guest',
        profileLayout: guestLayout,
        profile_layout: guestLayout,
        equipped: {
          effect: guestEffect,
          frame: guestFrame,
          nameplate: guestNameplate,
          avatar: guestAvatar,
          banner: guestBanner,
        },
        avatarUrl: guestAvatar,
        photoURL: null,
        avatarKey: activeGuestSource?.avatarKey || null,
        avatarVariant: activeGuestSource?.avatarVariant || null,
      };

      setProfile(guestPublicProfile);
      profileMemoryCache.set(resolvedUid, { profile: guestPublicProfile, timestamp: Date.now() });
      setLoading(false);
      setFetchError(null);

      const unsubGuestLive = subscribePublicProfile(resolvedUid, (updatedProf) => {
        if (!isMounted || !updatedProf) return;
        setProfile((prev) => {
          if (!prev) return prev;
          const nextLayout =
            updatedProf.profileLayout || updatedProf.profile_layout
              ? normalizeProfileLayout(updatedProf.profileLayout ?? updatedProf.profile_layout)
              : prev.profileLayout || prev.profile_layout || DEFAULT_PROFILE_LAYOUT;
          const merged: PublicProfile = {
            ...prev,
            displayName: updatedProf.displayName || prev.displayName,
            ...(updatedProf.username ? { username: updatedProf.username } : {}),
            bio: updatedProf.bio ?? prev.bio,
            status: updatedProf.status ?? prev.status,
            accent: updatedProf.accent || prev.accent,
            avatar: updatedProf.avatar ?? updatedProf.equipped?.avatar ?? prev.avatar,
            frame: updatedProf.frame ?? updatedProf.equipped?.frame ?? prev.frame,
            banner: updatedProf.banner ?? updatedProf.equipped?.banner ?? prev.banner,
            nameplate: updatedProf.nameplate ?? updatedProf.equipped?.nameplate ?? prev.nameplate,
            effectId: updatedProf.effectId ?? updatedProf.equipped?.effect ?? prev.effectId,
            profileLayout: nextLayout,
            profile_layout: nextLayout,
            equipped: {
              ...(prev.equipped || { effect: null, frame: null, nameplate: null, avatar: null, banner: null }),
              ...(updatedProf.equipped || {}),
            },
          };
          profileMemoryCache.set(resolvedUid, { profile: merged, timestamp: Date.now() });
          return merged;
        });
      });

      return () => {
        isMounted = false;
        unsubGuestLive();
      };
    }

    // Instant cache restore: if this profile was previously viewed, display it immediately
    const cached = profileMemoryCache.get(resolvedUid);
    if (cached) {
      setProfile(cached.profile);
      setLoading(false);
    } else {
      setLoading(true);
      setProfile(null);
    }
    setFetchError(null);

    async function fetchProfileData() {
      const uid = targetUid || currentUid;
      if (!uid) return;

      try {
        // Read users/{uid}, publicProfiles/{uid}, wallets/{uid}, and D1 live profile in parallel.
        const userDocRef = doc(db, 'users', uid);
        const [userSnap, publicSnap, walletSnap, d1LiveRes] = await Promise.all([
          getDoc(userDocRef).catch(() => null),
          getDoc(doc(db, 'publicProfiles', uid)).catch(() => null),
          getDoc(doc(db, 'wallets', uid)).catch(() => null),
          fetch(`/api/auth/resolve-profiles?uids=${encodeURIComponent(uid)}`, {
            headers: { Accept: 'application/json' },
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);

        const rawUData = userSnap && userSnap.exists() ? userSnap.data() : null;
        const rawPubData = publicSnap && publicSnap.exists() ? publicSnap.data() : null;
        const walletData = walletSnap && walletSnap.exists() ? walletSnap.data() : null;
        const d1Live = d1LiveRes?.ok && d1LiveRes?.profiles?.[uid] ? d1LiveRes.profiles[uid] : null;

        const uData: Record<string, any> | null = rawUData || d1Live
          ? {
              ...(rawUData || {}),
              ...(d1Live?.username ? { username: d1Live.username } : {}),
              ...(d1Live?.displayName ? { displayName: d1Live.displayName } : {}),
              ...(d1Live?.bio !== null && d1Live?.bio !== undefined ? { bio: d1Live.bio } : {}),
              ...(d1Live?.status !== null && d1Live?.status !== undefined ? { status: d1Live.status } : {}),
              ...(d1Live?.accent ? { accent: d1Live.accent } : {}),
              ...(d1Live?.profile_layout || d1Live?.profileLayout
                ? {
                    profileLayout: normalizeProfileLayout(d1Live.profile_layout ?? d1Live.profileLayout),
                    profile_layout: normalizeProfileLayout(d1Live.profile_layout ?? d1Live.profileLayout),
                  }
                : {}),
            }
          : null;
        const pubData: Record<string, any> | null = rawPubData || d1Live
          ? {
              ...(rawPubData || {}),
              ...(d1Live?.username ? { username: d1Live.username } : {}),
              ...(d1Live?.displayName ? { displayName: d1Live.displayName } : {}),
              ...(d1Live?.avatar ? { avatar: d1Live.avatar, equippedAvatar: d1Live.avatar } : {}),
              ...(d1Live?.frame ? { frame: d1Live.frame, equippedFrame: d1Live.frame } : {}),
              ...(d1Live?.role ? { role: d1Live.role } : {}),
              ...(d1Live?.customRole ? { customRole: d1Live.customRole } : {}),
              ...(d1Live?.bio !== null && d1Live?.bio !== undefined ? { bio: d1Live.bio } : {}),
              ...(d1Live?.status !== null && d1Live?.status !== undefined ? { status: d1Live.status } : {}),
              ...(d1Live?.accent ? { accent: d1Live.accent } : {}),
              ...(d1Live?.proBadge !== undefined ? { proBadge: d1Live.proBadge } : {}),
              ...(d1Live?.profile_layout || d1Live?.profileLayout
                ? {
                    profileLayout: normalizeProfileLayout(d1Live.profile_layout ?? d1Live.profileLayout),
                    profile_layout: normalizeProfileLayout(d1Live.profile_layout ?? d1Live.profileLayout),
                  }
                : {}),
            }
          : null;

        // 2. Fallback check: Read author details from recent post if user doc lacks displayName / photo
        let postAuthorName: string | null = null;
        let postAuthorAvatar: string | null = null;
        let postAuthorPhotoURL: string | null = null;
        let postAuthorFrame: string | null = null;
        let postAuthorEquippedAvatar: string | null = null;

        if (!uData?.displayName && !pubData?.displayName) {
          try {
            const recentPosts = await fetchUserCommonsPosts(uid, false);
            if (recentPosts.length > 0) {
              const pData = recentPosts[0];
              postAuthorName = pData.authorName || null;
              postAuthorAvatar = pData.authorAvatar || null;
              postAuthorPhotoURL =
                pData.authorPhotoURL ||
                (pData.authorAvatar?.includes('googleusercontent') ? pData.authorAvatar : null);
              postAuthorFrame = pData.authorFrame || null;
              postAuthorEquippedAvatar = pData.authorEquippedAvatar || null;
            }
          } catch (postErr) {
            console.warn('[ProfileView] author post fallback notice:', postErr);
          }
        }

        const {
          ownProfile: latestOwnProfile,
          authProfile: latestAuthProfile,
          ownEquipped: latestOwnEquipped,
          authUserDisplayName: latestAuthUserDisplayName,
          authUserEmail: latestAuthUserEmail,
        } = selfContextRef.current;

        const candidateName =
          (uid === currentUid
            ? latestOwnProfile?.displayName ||
              uData?.displayName ||
              pubData?.displayName ||
              latestOwnProfile?.username ||
              uData?.username ||
              pubData?.username ||
              latestAuthProfile?.displayName ||
              latestAuthProfile?.username ||
              latestAuthUserDisplayName
            : uData?.displayName ||
              pubData?.displayName ||
              uData?.username ||
              pubData?.username ||
              uData?.name) ||
          postAuthorName;
        const candidateUsername =
          (uid === currentUid
            ? latestOwnProfile?.username || uData?.username || pubData?.username || latestAuthProfile?.username
            : uData?.username || pubData?.username) || null;
        const candidateEmail = uData?.email || pubData?.email || (uid === currentUid ? latestAuthUserEmail : null);

        const isAdminAccountUser =
          isAdminAccount(uid) ||
          uData?.role === 'admin' ||
          uData?.role === 'superadmin' ||
          pubData?.role === 'admin' ||
          pubData?.role === 'superadmin' ||
          (candidateEmail && isAdminAccount(candidateEmail)) ||
          isAdminAccount(candidateName) ||
          (candidateName && (
            candidateName.toLowerCase().includes('shs') ||
            candidateName.toLowerCase().includes('virtual academy')
          )) ||
          (uid === currentUid && isAdmin);

        const trustedServerRole =
          d1Live?.role ||
          (isAdminAccountUser ? 'admin' : (uData?.role || pubData?.role || 'student'));

        const shortCode =
          uData?.studentId ||
          uData?.shortId ||
          pubData?.studentId ||
          pubData?.shortId ||
          deriveFallbackShortId(uid);

        let cleanName = '';
        if (isAdminAccountUser) {
          cleanName = 'SHS Virtual Academy';
          if (uid === currentUid) {
            if (uData && (!uData.displayName || uData.displayName !== 'SHS Virtual Academy')) {
              setDoc(userDocRef, { displayName: 'SHS Virtual Academy' }, { merge: true }).catch(() => {});
            }
            if (pubData && (!pubData.displayName || pubData.displayName !== 'SHS Virtual Academy')) {
              setDoc(doc(db, 'publicProfiles', uid), { displayName: 'SHS Virtual Academy' }, { merge: true }).catch(() => {});
            }
          }
        } else {
          cleanName = sanitizeStudentDisplayName(candidateName, shortCode);
        }

        // Resolve each cosmetic slot using non-empty truthy priority so null in one doc never masks a valid equipped ID in another
        const selfEq = uid === currentUid ? latestOwnEquipped : null;
        const avatar =
          resolveCosmeticItemId(selfEq?.avatar, 'avatar') ||
          resolveCosmeticItemId(walletData?.equipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(uData?.equipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(pubData?.equipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(uData?.equippedAvatar, 'avatar') ||
          resolveCosmeticItemId(pubData?.equippedAvatar, 'avatar') ||
          resolveCosmeticItemId(uData?.avatar, 'avatar') ||
          resolveCosmeticItemId(pubData?.avatar, 'avatar') ||
          resolveCosmeticItemId(postAuthorEquippedAvatar, 'avatar') ||
          resolveCosmeticItemId(postAuthorAvatar, 'avatar') ||
          null;
        const avatarUrl = avatar;
        const photoURL = null;
        const frame =
          (selfEq?.frame as string) ||
          (walletData?.equipped?.frame as string) ||
          (uData?.equipped?.frame as string) ||
          (pubData?.equipped?.frame as string) ||
          (uData?.equippedFrame as string) ||
          (pubData?.equippedFrame as string) ||
          (uData?.frame as string) ||
          (pubData?.frame as string) ||
          postAuthorFrame ||
          null;
        const nameplate =
          (selfEq?.nameplate as string) ||
          (walletData?.equipped?.nameplate as string) ||
          (uData?.equipped?.nameplate as string) ||
          (pubData?.equipped?.nameplate as string) ||
          (uData?.equippedNameplate as string) ||
          (pubData?.equippedNameplate as string) ||
          (uData?.nameplate as string) ||
          (pubData?.nameplate as string) ||
          null;
        const banner =
          (selfEq?.banner as string) ||
          (walletData?.equipped?.banner as string) ||
          (uData?.equipped?.banner as string) ||
          (pubData?.equipped?.banner as string) ||
          (uData?.equippedBanner as string) ||
          (pubData?.equippedBanner as string) ||
          (uData?.banner as string) ||
          (pubData?.banner as string) ||
          (d1Live?.banner as string) ||
          null;
        const effectId =
          (selfEq?.effect as string) ||
          (walletData?.equipped?.effect as string) ||
          (uData?.equipped?.effect as string) ||
          (pubData?.equipped?.effect as string) ||
          (uData?.equippedEffect as string) ||
          (pubData?.equippedEffect as string) ||
          (uData?.effectId as string) ||
          (pubData?.effectId as string) ||
          (d1Live?.effect as string) ||
          null;
        const equipped = {
          effect: effectId,
          frame,
          nameplate,
          avatar,
          banner,
        };

        const stats = {
          streak: Number(uData?.streak ?? pubData?.stats?.streak ?? 0),
          longestStreak: Number(uData?.longestStreak ?? pubData?.stats?.longestStreak ?? uData?.streak ?? 0),
          mcqs: Number(uData?.totalQuestionsSolved ?? uData?.mcqsSolved ?? pubData?.stats?.mcqs ?? 0),
          accuracy: Number(uData?.accuracy ?? pubData?.stats?.accuracy ?? 0),
        };

        const followCountsPromise = getFollowCounts(uid, uData, pubData);
        const followRelationPromise =
          currentUid && uid !== currentUid
            ? Promise.all([isFollowing(currentUid, uid), isFollowing(uid, currentUid)])
            : Promise.resolve([false, false] as [boolean, boolean]);
        const chatPermPromise =
          currentUid && uid !== currentUid
            ? checkChatPermission(currentUid, uid).catch(() => null)
            : Promise.resolve(null);

        const [followCounts, [followingState, followsMeState], resolvedChatPerm] = await Promise.all([
          followCountsPromise,
          followRelationPromise,
          chatPermPromise,
        ]);

        const resolvedBadges =
          Array.isArray(uData?.badges) && uData.badges.length > 0
            ? uData.badges
            : Array.isArray(pubData?.badges)
            ? pubData.badges
            : [];

        const resolvedProfile: PublicProfile & { username?: string } = {
          uid,
          displayName: cleanName,
          ...(candidateUsername ? { username: candidateUsername } : {}),
          studentId: shortCode,
          shortId: shortCode,
          avatar,
          banner,
          frame,
          nameplate,
          effectId,
          badges: resolvedBadges,
          bio: uData?.bio || pubData?.bio || '',
          status: uData?.status || pubData?.status || '',
          accent: uData?.accent || pubData?.accent || '#D71921',
          memberSince: uData?.createdAt || pubData?.memberSince || null,
          crewName: uData?.crewName || pubData?.crewName || null,
          stats,
          followersCount: followCounts.followersCount,
          followingCount: followCounts.followingCount,
          lastActiveAt: uData?.lastActiveDate || pubData?.lastActiveAt || null,
          role: trustedServerRole,
          customRole: d1Live?.customRole || (trustedServerRole !== 'student' ? uData?.customRole || pubData?.customRole : undefined) || undefined,
          equipped,
          avatarUrl,
          photoURL,
          avatarKey: uData?.avatarKey || pubData?.avatarKey || null,
          avatarVariant: uData?.avatarVariant || pubData?.avatarVariant || null,
          proBadge: (() => {
            if (uid.startsWith('guest_')) return null;
            if (pubData?.proBadge && isValidProBadgeDesign(pubData.proBadge)) {
              return normalizeProBadgeDesign(pubData.proBadge);
            }
            if (uData?.proBadgeVisible === false || pubData?.proBadgeVisible === false) {
              return null;
            }
            const unified = resolveUnifiedPlanStatus({
              uid,
              email: null,
              role: trustedServerRole,
              isGuest: Boolean(uData?.isGuest || uid.startsWith('guest_')),
              plan: uData?.plan ?? pubData?.plan ?? null,
              isPremium: uData?.isPremium ?? pubData?.isPremium ?? null,
              proPlanId: uData?.proPlanId ?? pubData?.proPlanId ?? null,
              planStartedAt: uData?.planStartedAt ?? pubData?.planStartedAt,
              updatedAt: uData?.updatedAt ?? pubData?.updatedAt,
              planExpiresAt: uData?.planExpiresAt ?? pubData?.planExpiresAt,
              premiumExpiresAt: uData?.premiumExpiresAt ?? pubData?.premiumExpiresAt,
              isSuperAdmin: isAdminAccountUser,
            });
            const isActivePro = unified.state === 'active' || Boolean(unified.isPro);
            if (!isActivePro) return null;
            if (pubData?.proBadge === null && !uData?.proBadgeDesign && !pubData?.proBadgeDesign) {
              return DEFAULT_PRO_BADGE_DESIGN;
            }
            const candidateDesign = uData?.proBadgeDesign || pubData?.proBadgeDesign || pubData?.proBadge;
            return isValidProBadgeDesign(candidateDesign)
              ? normalizeProBadgeDesign(candidateDesign)
              : DEFAULT_PRO_BADGE_DESIGN;
          })(),
          profileLayout: normalizeProfileLayout(
            (getProfileLayoutSnapshotForUid(uid).known ? getProfileLayoutSnapshotForUid(uid).layout : null) ??
              d1Live?.profile_layout ??
              d1Live?.profileLayout ??
              pubData?.profile_layout ??
              pubData?.profileLayout ??
              uData?.profile_layout ??
              uData?.profileLayout ??
              DEFAULT_PROFILE_LAYOUT
          ),
          profile_layout: normalizeProfileLayout(
            (getProfileLayoutSnapshotForUid(uid).known ? getProfileLayoutSnapshotForUid(uid).layout : null) ??
              d1Live?.profile_layout ??
              d1Live?.profileLayout ??
              pubData?.profile_layout ??
              pubData?.profileLayout ??
              uData?.profile_layout ??
              uData?.profileLayout ??
              DEFAULT_PROFILE_LAYOUT
          ),
        };

        if (!isMounted) return;
        setProfile(resolvedProfile);
        profileMemoryCache.set(uid, { profile: resolvedProfile, timestamp: Date.now() });

        const initialPinned = (uData?.pinnedStamps as string[]) || (pubData?.pinnedStamps as string[]) || [];
        if (Array.isArray(initialPinned)) {
          setPinnedShowcase(initialPinned);
        }

        const initialStreakBadges =
          (uData?.equippedStreakBadges as string[]) ||
          (pubData?.equippedStreakBadges as string[]) ||
          (uid === currentUid ? ['badge_streak_7d'] : []);
        if (Array.isArray(initialStreakBadges)) {
          setEquippedStreakBadges(initialStreakBadges);
        }

        if (currentUid && uid !== currentUid) {
          setIsFollowedByMe(followingState);
          setFollowsMe(followsMeState);
          setChatPermission(resolvedChatPerm);
        } else {
          setIsFollowedByMe(false);
          setFollowsMe(false);
          setChatPermission(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[ProfileView] error loading profile:', err?.code || 'ERROR', `users/${uid}`, err);
        setFetchError(err?.message || 'Could not load student profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfileData();

    // Subscribe to live public profile broadcasts so any profile edit immediately updates this view
    const unsubLiveProfile = subscribePublicProfile(resolvedUid, (updatedProf) => {
      if (!isMounted || !updatedProf) return;
      setProfile((prev) => {
        if (!prev) return prev;
        const nextLayout =
          updatedProf.profileLayout || updatedProf.profile_layout
            ? normalizeProfileLayout(updatedProf.profileLayout ?? updatedProf.profile_layout)
            : prev.profileLayout || prev.profile_layout || DEFAULT_PROFILE_LAYOUT;
        const merged: PublicProfile = {
          ...prev,
          displayName: updatedProf.displayName || prev.displayName,
          ...(updatedProf.username ? { username: updatedProf.username } : {}),
          bio: updatedProf.bio ?? prev.bio,
          status: updatedProf.status ?? prev.status,
          accent: updatedProf.accent || prev.accent,
          avatar: updatedProf.avatar ?? updatedProf.equipped?.avatar ?? prev.avatar,
          frame: updatedProf.frame ?? updatedProf.equipped?.frame ?? prev.frame,
          banner: updatedProf.banner ?? updatedProf.equipped?.banner ?? prev.banner,
          nameplate: updatedProf.nameplate ?? updatedProf.equipped?.nameplate ?? prev.nameplate,
          effectId: updatedProf.effectId ?? updatedProf.equipped?.effect ?? prev.effectId,
          proBadge: updatedProf.proBadge !== undefined ? updatedProf.proBadge : prev.proBadge,
          profileLayout: nextLayout,
          profile_layout: nextLayout,
          equipped: {
            ...(prev.equipped || { effect: null, frame: null, nameplate: null, avatar: null, banner: null }),
            ...(updatedProf.equipped || {}),
          },
        };
        profileMemoryCache.set(resolvedUid, { profile: merged, timestamp: Date.now() });
        return merged;
      });
    });

    return () => {
      isMounted = false;
      unsubLiveProfile();
    };
  }, [targetUid, currentUid, isAdmin, isGuest, isViewingSelf]);

  // When viewing self in own mode, safely merge ownProfile/ownEquipped without wiping loaded cosmetics or follower counts
  useEffect(() => {
    if (isViewingSelf && (ownProfile || authProfile) && !previewAsPublic && (!walletLoading || isGuest)) {
      const op = (ownProfile || authProfile) as any;
      const isAdminAccountUser = !isGuest && (isAdmin || isAdminAccount(currentUid));
      const shortCode = op.studentId || op.shortId || (isGuest ? 'GUEST' : deriveFallbackShortId(currentUid || '0'));
      const rawDisplayName = op.displayName || op.username || authProfile?.displayName || authProfile?.username || authUser?.displayName;
      const safeSelfName =
        !isAdminAccount(currentUid) &&
        typeof rawDisplayName === 'string' &&
        rawDisplayName.trim().toLowerCase() === 'shs virtual academy'
          ? op.username || authProfile?.username || 'Student'
          : rawDisplayName;
      const cleanName = isAdminAccount(currentUid)
        ? safeSelfName || 'SHS Virtual Academy'
        : isGuest
        ? (safeSelfName || 'Guest')
        : sanitizeStudentDisplayName(safeSelfName, shortCode);
      const resolvedUsername = op.username || authProfile?.username || (isGuest ? cleanName : undefined);

      setProfile((prev) => {
        const resolvedAvatar =
          resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(op.equipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(op.avatar, 'avatar') ||
          resolveCosmeticItemId(prev?.avatar, 'avatar') ||
          null;
        const resolvedBanner =
          (ownEquipped?.banner as string) ||
          (op.equipped?.banner as string) ||
          (op.banner as string) ||
          prev?.banner ||
          null;
        const resolvedFrame =
          (ownEquipped?.frame as string) ||
          (op.equipped?.frame as string) ||
          (op.frame as string) ||
          prev?.frame ||
          null;
        const resolvedNameplate =
          (ownEquipped?.nameplate as string) ||
          (op.equipped?.nameplate as string) ||
          (op.nameplate as string) ||
          prev?.nameplate ||
          null;
        const resolvedEffectId =
          (ownEquipped?.effect as string) ||
          (op.equipped?.effect as string) ||
          (op.effectId as string) ||
          prev?.effectId ||
          null;

        const cachedSelf = currentUid ? profileMemoryCache.get(currentUid)?.profile : null;
        const resolvedFollowersCount =
          prev?.followersCount ??
          cachedSelf?.followersCount ??
          (typeof op.followersCount === 'number' ? op.followersCount : 0);
        const resolvedFollowingCount =
          prev?.followingCount ??
          cachedSelf?.followingCount ??
          (typeof op.followingCount === 'number' ? op.followingCount : 0);

        const selfTrustedRole = isAdminAccount(currentUid)
          ? 'superadmin'
          : isAdminAccountUser
          ? authProfile?.role || 'admin'
          : authProfile?.role && authProfile.role !== 'admin' && authProfile.role !== 'superadmin'
          ? authProfile.role
          : op.role && op.role !== 'admin' && op.role !== 'superadmin'
          ? op.role
          : 'student';

        const nextProfile: PublicProfile & { username?: string; isGuest?: boolean; accountType?: string } = {
          uid: currentUid || 'guest',
          displayName: cleanName,
          ...(resolvedUsername ? { username: resolvedUsername } : {}),
          studentId: shortCode,
          shortId: shortCode,
          avatar: resolvedAvatar,
          banner: resolvedBanner,
          frame: resolvedFrame,
          nameplate: resolvedNameplate,
          effectId: resolvedEffectId,
          badges: op.badges || prev?.badges || [],
          bio: op.bio ?? prev?.bio ?? '',
          status: op.status ?? prev?.status ?? '',
          accent: op.accent || prev?.accent || '#D71921',
          memberSince: op.createdAt || op.memberSince || prev?.memberSince || null,
          crewName: op.crewName || prev?.crewName || null,
          stats: {
            streak: Number(op.streak ?? prev?.stats?.streak ?? 0),
            longestStreak: Number(op.longestStreak ?? op.streak ?? prev?.stats?.longestStreak ?? 0),
            mcqs: Number(op.totalQuestionsSolved ?? op.mcqsSolved ?? prev?.stats?.mcqs ?? 0),
            accuracy: Number(op.accuracy ?? prev?.stats?.accuracy ?? 0),
          },
          followersCount: resolvedFollowersCount,
          followingCount: resolvedFollowingCount,
          lastActiveAt: op.lastActiveDate || prev?.lastActiveAt || null,
          role: selfTrustedRole,
          customRole: isGuest ? 'Guest' : (selfTrustedRole !== 'student' ? op.customRole || prev?.customRole : undefined),
          ...(isGuest ? { isGuest: true, accountType: 'guest' } : {}),
          equipped: {
            effect: resolvedEffectId,
            frame: resolvedFrame,
            nameplate: resolvedNameplate,
            avatar: resolvedAvatar,
            banner: resolvedBanner,
          },
          avatarUrl: resolvedAvatar,
          photoURL: null,
          avatarKey: op.avatarKey || prev?.avatarKey || null,
          avatarVariant: op.avatarVariant || prev?.avatarVariant || null,
          profileLayout: normalizeProfileLayout(
            (selfLayoutStatus.known ? selfLayoutStatus.layout : null) ??
              prev?.profileLayout ??
              prev?.profile_layout ??
              (authProfile as any)?.profileLayout ??
              (authProfile as any)?.profile_layout ??
              op.profileLayout ??
              op.profile_layout ??
              DEFAULT_PROFILE_LAYOUT
          ),
          profile_layout: normalizeProfileLayout(
            (selfLayoutStatus.known ? selfLayoutStatus.layout : null) ??
              prev?.profileLayout ??
              prev?.profile_layout ??
              (authProfile as any)?.profileLayout ??
              (authProfile as any)?.profile_layout ??
              op.profileLayout ??
              op.profile_layout ??
              DEFAULT_PROFILE_LAYOUT
          ),
        };

        if (currentUid) {
          profileMemoryCache.set(currentUid, { profile: nextProfile, timestamp: Date.now() });
          if (!isGuest && !currentUid.startsWith('guest_')) {
            void syncPublicProfile(currentUid, {
              ...op,
              displayName: cleanName,
              shortId: shortCode,
              avatar: resolvedAvatar,
              banner: resolvedBanner,
              frame: resolvedFrame,
              nameplate: resolvedNameplate,
              effectId: resolvedEffectId,
              equipped: nextProfile.equipped,
              followersCount: resolvedFollowersCount,
              followingCount: resolvedFollowingCount,
            }).catch(() => {});
          }
        }

        return nextProfile;
      });
    }
  }, [isViewingSelf, ownProfile, authProfile, ownEquipped, walletLoading, previewAsPublic, currentUid, authUser?.displayName, authUser?.email, isAdmin, isGuest, selfLayoutStatus.layout, selfLayoutStatus.known, selfLayoutStatus.ready]);

  // Rank title computation
  const rank = useMemo(() => {
    const mcqs = profile?.stats?.mcqs ?? profile?.publicStats?.totalQuestionsSolved ?? (isViewingSelf ? ownProfile?.totalQuestionsSolved : 0) ?? 0;
    const streak = profile?.stats?.streak ?? profile?.publicStats?.streak ?? (isViewingSelf ? ownProfile?.streak : 0) ?? 0;
    return getRankTitle(mcqs, streak);
  }, [profile, isViewingSelf, ownProfile]);

  // Studying now active status (within 10 minutes)
  const isStudyingNow = useMemo(() => {
    if (isViewingSelf) return true;
    const lastActive = profile?.lastActiveAt;
    if (!lastActive) return false;
    let ts = 0;
    if (typeof lastActive === 'object' && 'seconds' in lastActive) {
      ts = lastActive.seconds * 1000;
    } else if (typeof lastActive === 'string' || typeof lastActive === 'number') {
      ts = new Date(lastActive).getTime();
    }
    return Date.now() - ts < 10 * 60 * 1000;
  }, [profile?.lastActiveAt, isViewingSelf]);

  // Follow / Unfollow handler
  const handleFollowToggle = async () => {
    if (!currentUid) {
      requireAuth(`follow ${profile?.displayName || 'this student'}`);
      return;
    }
    if (!profile?.uid || followWorking || isViewingSelf || currentUid === profile.uid) return;
    const targetId = profile.uid;

    if (isFollowedByMe) {
      setUnfollowModalOpen(true);
      return;
    }

    // Optimistic follow
    setFollowWorking(true);
    setIsFollowedByMe(true);
    setProfile((prev) => (prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null));

    try {
      await followUser(currentUid, targetId, {
        followerName: ownProfile?.displayName || authUser?.displayName || 'Student',
        followerAvatar:
          resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
          resolveCosmeticItemId(ownProfile?.equipped?.avatar, 'avatar') ||
          resolveCosmeticItemId((ownProfile as any)?.avatar, 'avatar') ||
          null,
        followerFrame:
          (ownEquipped?.frame as string) || (ownProfile?.equipped?.frame as string) || null,
      });
      const [updatedCounts, updatedPerm] = await Promise.all([
        getFollowCounts(targetId),
        checkChatPermission(currentUid, targetId).catch(() => null),
      ]);
      if (updatedPerm) setChatPermission(updatedPerm);
      setProfile((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          followersCount: updatedCounts.followersCount,
          followingCount: updatedCounts.followingCount,
        };
        profileMemoryCache.set(targetId, { profile: updated, timestamp: Date.now() });
        return updated;
      });
      // Also invalidate own profile cache so our own followingCount refreshes on next view
      profileMemoryCache.delete(currentUid);
    } catch (err: any) {
      console.error('[ProfileView] followUser failed:', err?.code || 'ERROR', `users/${currentUid}/following/${targetId}`, err);
      // Rollback
      setIsFollowedByMe(false);
      setProfile((prev) => (prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) } : null));
    } finally {
      setFollowWorking(false);
    }
  };

  const confirmUnfollow = async () => {
    if (!currentUid || !profile?.uid || isViewingSelf || currentUid === profile.uid) return;
    const targetId = profile.uid;
    setFollowWorking(true);

    // Optimistic unfollow
    setIsFollowedByMe(false);
    setProfile((prev) => (prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) } : null));

    try {
      await unfollowUser(currentUid, targetId);
      const [updatedCounts, updatedPerm] = await Promise.all([
        getFollowCounts(targetId),
        checkChatPermission(currentUid, targetId).catch(() => null),
      ]);
      if (updatedPerm) setChatPermission(updatedPerm);
      setProfile((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          followersCount: updatedCounts.followersCount,
          followingCount: updatedCounts.followingCount,
        };
        profileMemoryCache.set(targetId, { profile: updated, timestamp: Date.now() });
        return updated;
      });
      profileMemoryCache.delete(currentUid);
      setUnfollowModalOpen(false);
    } catch (err: any) {
      console.error('[ProfileView] unfollowUser failed:', err?.code || 'ERROR', `users/${currentUid}/following/${targetId}`, err);
      // Rollback
      setIsFollowedByMe(true);
      setProfile((prev) => (prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null));
    } finally {
      setFollowWorking(false);
    }
  };

  const handleMessageOrRequestClick = async () => {
    if (!currentUid) {
      requireAuth(`message ${profile?.displayName || 'this student'}`);
      return;
    }
    if (!profile?.uid || isViewingSelf || currentUid === profile.uid) return;

    const canChatDirectly =
      (isFollowedByMe && followsMe) ||
      Boolean(chatPermission?.canChat) ||
      chatPermission?.outgoingRequest?.status === 'accepted' ||
      chatPermission?.incomingRequest?.status === 'accepted';

    if (canChatDirectly) {
      setDmInitialTab('chat');
      setDmModalOpen(true);
      return;
    }

    if (chatPermission?.incomingRequest?.status === 'pending') {
      setDmInitialTab('requests');
      setDmModalOpen(true);
      return;
    }

    if (
      chatRequestWorking ||
      chatPermission?.outgoingRequest?.status === 'pending' ||
      chatPermission?.isCooldownActive
    ) {
      return;
    }

    setChatRequestWorking(true);
    try {
      const createdReq = await sendChatRequest(
        currentUid,
        profile.uid,
        {
          displayName: ownProfile?.displayName || authUser?.displayName || 'Student',
          avatar:
            resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
            resolveCosmeticItemId(ownProfile?.equipped?.avatar, 'avatar') ||
            resolveCosmeticItemId((ownProfile as any)?.avatar, 'avatar') ||
            null,
          frame:
            (ownEquipped?.frame as string) ||
            (ownProfile?.equipped?.frame as string) ||
            null,
          photoURL: null,
          role: ownProfile?.role || 'student',
        },
        {
          displayName: profile.displayName || 'Student',
          avatar: resolveCosmeticItemId(profile.avatar, 'avatar') || null,
          frame: profile.frame || null,
          photoURL: null,
        }
      );

      setChatPermission((prev) => ({
        canChat: createdReq.status === 'accepted',
        reason: createdReq.status === 'accepted' ? 'request_accepted' : 'none',
        isMutualFollow: Boolean(isFollowedByMe && followsMe),
        outgoingRequest: createdReq,
        incomingRequest: prev?.incomingRequest || null,
        cooldownEndsAtMs: null,
        isCooldownActive: false,
      }));

      if (createdReq.status === 'accepted') {
        setDmInitialTab('chat');
        setDmModalOpen(true);
      }
    } catch (err) {
      console.warn('[ProfileView] sendChatRequest notice:', err);
      const updatedPerm = await checkChatPermission(currentUid, profile.uid).catch(() => null);
      if (updatedPerm) setChatPermission(updatedPerm);
    } finally {
      setChatRequestWorking(false);
    }
  };

  // Edit Profile submission (server-confirmed via updateProfileData)
  const handleSaveProfileUpdates = async (updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }) => {
    if (!currentUid) return;
    await updateProfileData(updates);
    setProfile((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      profileMemoryCache.set(currentUid, { profile: next, timestamp: Date.now() });
      return next;
    });
    broadcastPublicProfileUpdate(currentUid, updates);
  };

  const handleSaveAvatar = async (newAvatarId: string | null) => {
    if (!currentUid || !isViewingSelf) return;
    const prevProfile = profile;

    setProfile((prev) => {
      if (!prev) return null;
      const next: PublicProfile = {
        ...prev,
        avatar: newAvatarId,
        avatarUrl: newAvatarId,
        equipped: {
          ...(prev.equipped || {
            effect: null,
            frame: null,
            nameplate: null,
            avatar: null,
            banner: null,
          }),
          avatar: newAvatarId,
        },
      };
      profileMemoryCache.set(currentUid, { profile: next, timestamp: Date.now() });
      return next;
    });

    try {
      await equipCosmetic('avatar', newAvatarId);
      await updateProfileData({
        avatar: newAvatarId ?? undefined,
        equippedAvatar: newAvatarId,
      });
    } catch (err) {
      if (prevProfile) {
        setProfile(prevProfile);
        profileMemoryCache.set(currentUid, { profile: prevProfile, timestamp: Date.now() });
      }
      throw err;
    }
  };

  // Unequip cosmetic item
  const handleUnequipItem = async (type: 'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner') => {
    if (!isViewingSelf) return;
    try {
      await equipCosmetic(type, null);
      setProfile((prev) => (prev ? { ...prev, [type]: null } : null));
    } catch (err) {
      console.warn('[ProfileView] unequip error:', err);
    }
  };

  // Student level calculation
  const studentLevel = useMemo(() => {
    const mcqs =
      profile?.stats?.mcqs ??
      profile?.publicStats?.totalQuestionsSolved ??
      (isViewingSelf ? ownProfile?.totalQuestionsSolved : 0) ??
      0;
    return Math.max(1, Math.floor(Number(mcqs) / 25) + 1);
  }, [profile, isViewingSelf, ownProfile]);

  // All 12 flagship and catalog profile banners
  const catalogBanners = useMemo(() => {
    return COSMETICS_CATALOG.filter((item) => item.type === 'banner');
  }, []);

  // Equip banner handler with single source of truth sync
  const handleEquipBanner = async (bannerId: string | null) => {
    if (!isViewingSelf) return;
    setEquippingBannerId(bannerId);
    try {
      await equipCosmetic('banner', bannerId);
      setProfile((prev) => (prev ? { ...prev, banner: bannerId } : null));
    } catch (err: any) {
      console.warn('[ProfileView] Error equipping banner:', err);
      alert(err?.message || 'Failed to equip banner.');
    } finally {
      setEquippingBannerId(null);
    }
  };

  // Unlock and immediately equip banner
  const handlePurchaseBanner = async (item: CosmeticItem) => {
    if (!authUser?.uid) {
      navigate('/login?redirect=/dashboard/profile');
      return;
    }
    if (kobanBalance < item.priceKobans) {
      navigate('/store');
      return;
    }
    try {
      setEquippingBannerId(item.id);
      await purchaseCosmetic(item);
      await equipCosmetic('banner', item.id);
      setProfile((prev) => (prev ? { ...prev, banner: item.id } : null));
    } catch (err: any) {
      console.warn('[ProfileView] purchase banner error:', err);
      alert(err?.message || 'Failed to purchase banner.');
    } finally {
      setEquippingBannerId(null);
    }
  };

  // Toggle streak badge equip
  const handleToggleStreakBadge = (badgeId: string) => {
    if (!isViewingSelf) return;
    setEquippedStreakBadges((prev) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), badgeId];
      }
      return [...prev, badgeId];
    });
  };

  // Toggle showcase pin
  const handleToggleShowcasePin = (id: string) => {
    if (!isViewingSelf || !currentUid) return;
    setPinnedShowcase((prev) => {
      const next = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= 3
        ? [...prev.slice(1), id]
        : [...prev, id];

      if (!isGuest && !currentUid.startsWith('guest_')) {
        setDoc(doc(db, 'users', currentUid), { pinnedStamps: next }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'publicProfiles', currentUid), { uid: currentUid, pinnedStamps: next }, { merge: true }).catch(() => {});
      }
      return next;
    });
  };

  const accentColor = propData?.accent || profile?.accent || '#D71921';
  const effectiveEffectId =
    propData?.effect ||
    profile?.effectId ||
    (isViewingSelf && !previewAsPublic ? ownEquipped?.effect : null) ||
    null;

  // Build the single shared profile data object resolved strictly by UID
  const sharedProfileData: SharedProfileData = useMemo(() => {
    if (propData) {
      const resolvedOverride = propLayout
        ? normalizeProfileLayout(propLayout)
        : normalizeProfileLayout(propData.profile_layout ?? propData.profileLayout);
      return {
        ...propData,
        profile_layout: resolvedOverride,
        profileLayout: resolvedOverride,
      };
    }

    const activeUid = String(profile?.uid || targetUid || currentUid || 'guest').trim();
    const built = buildSharedProfileData({
      uid: activeUid,
      publicProfile: profile as any,
      ownUserProfile: isViewingSelf && !previewAsPublic ? ((ownProfile || authProfile) as any) : null,
      walletCoins: isViewingSelf ? kobanBalance : null,
      walletEquipped: isViewingSelf && !previewAsPublic ? (ownEquipped as any) : null,
      overrideLayout: propLayout ? normalizeProfileLayout(propLayout) : null,
    });

    const activeProBadge = isViewingSelf ? effectiveProBadge : profile?.proBadge;
    return {
      ...built,
      level: studentLevel,
      proBadge: activeProBadge || built.proBadge || null,
      isPro: Boolean(activeProBadge || built.isPro),
      followers: Number(profile?.followersCount ?? built.followers ?? 0),
      following: Number(profile?.followingCount ?? built.following ?? 0),
    };
  }, [
    propData,
    propLayout,
    profile,
    targetUid,
    currentUid,
    isViewingSelf,
    previewAsPublic,
    ownProfile,
    authProfile,
    kobanBalance,
    ownEquipped,
    effectiveProBadge,
    studentLevel,
  ]);

  const resolvedLayoutId: ProfileLayoutId = useMemo(
    () =>
      normalizeProfileLayout(
        propLayout ??
          propData?.profile_layout ??
          propData?.profileLayout ??
          (isViewingSelf && selfLayoutStatus.known ? selfLayoutStatus.layout : null) ??
          profile?.profileLayout ??
          profile?.profile_layout ??
          (isViewingSelf
            ? (authProfile as any)?.profileLayout ??
              (authProfile as any)?.profile_layout ??
              (ownProfile as any)?.profileLayout ??
              (ownProfile as any)?.profile_layout
            : null) ??
          DEFAULT_PROFILE_LAYOUT
      ),
    [propLayout, propData, isViewingSelf, selfLayoutStatus.known, selfLayoutStatus.layout, profile, authProfile, ownProfile]
  );

  // When rendered in Settings > Profile Layout live preview carousel, render the live profile card
  if (previewMode && propData) {
    return (
      <div className="relative w-full bg-[var(--card)] text-[var(--text)] overflow-hidden flex flex-col">
        <ProfileLayoutsRenderer
          layout={resolvedLayoutId}
          data={sharedProfileData}
          previewMode={true}
          shortId={deriveFallbackShortId(sharedProfileData.uid || '0')}
        />
        {resolvedLayoutId !== 'loadout-showcase' && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card)] flex flex-col gap-2.5">
            <div className="flex items-center gap-5 border-b border-[var(--border)] pb-2 text-xs font-heading font-semibold">
              <span className="text-[var(--text)] border-b-2 border-[#D71921] pb-1.5 -mb-2">
                Overview
              </span>
              <span className="text-[var(--muted)]">Loadout</span>
              <span className="text-[var(--muted)]">Badges</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-[11px] text-[var(--text)]">
                  About Me
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  #{deriveFallbackShortId(sharedProfileData.uid || '0')}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                {sharedProfileData.bio || 'Preparing for MDCAT, ECAT & board exams on Boardly.'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (
    (loading && !profile && !propData) ||
    (isViewingSelf && !propData && !selfLayoutStatus.known && selfLayoutStatus.loading)
  ) {
    return (
      <div
        className={`relative w-full flex flex-col bg-[var(--background)] text-[var(--text)] ${
          isFullPage ? 'max-w-4xl mx-auto py-2 sm:py-6 px-0 sm:px-4' : 'max-w-xl mx-auto'
        }`}
      >
        <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden flex flex-col animate-pulse">
          <div className="w-full h-[160px] sm:h-[200px] bg-[var(--card-2)]" />
          <div className="px-4 sm:px-6 pb-6 flex flex-col gap-4">
            <div className="flex items-end justify-between -mt-[44px] sm:-mt-[60px]">
              <div className="w-[84px] h-[84px] sm:w-[112px] sm:h-[112px] rounded-full bg-[var(--card-2)] border-4 border-[var(--card)]" />
            </div>
            <div className="h-6 w-48 rounded-lg bg-[var(--card-2)]" />
            <div className="h-4 w-32 rounded-lg bg-[var(--card-2)]" />
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="h-20 rounded-2xl bg-[var(--card-2)]" />
              <div className="h-20 rounded-2xl bg-[var(--card-2)]" />
              <div className="h-20 rounded-2xl bg-[var(--card-2)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compute public mode chat button state
  const canChatDirectly =
    (isFollowedByMe && followsMe) ||
    Boolean(chatPermission?.canChat) ||
    chatPermission?.outgoingRequest?.status === 'accepted' ||
    chatPermission?.incomingRequest?.status === 'accepted';
  const isPendingOutgoing = chatPermission?.outgoingRequest?.status === 'pending';
  const isPendingIncoming = chatPermission?.incomingRequest?.status === 'pending';
  const isCooldown = Boolean(chatPermission?.isCooldownActive);
  const messageButtonDisabled =
    chatRequestWorking || (!canChatDirectly && (isPendingOutgoing || isCooldown));
  let messageButtonLabel = 'Message';
  if (chatRequestWorking) {
    messageButtonLabel = 'Sending...';
  } else if (canChatDirectly) {
    messageButtonLabel = 'Message';
  } else if (isPendingIncoming) {
    messageButtonLabel = 'Respond to Request';
  } else if (isPendingOutgoing || isCooldown) {
    messageButtonLabel = 'Request Sent';
  }

  const badgeRowNode = (
    <div className="relative flex items-center gap-1.5 flex-wrap pt-0.5">
      {(profile?.role === 'captain' || profile?.badges?.includes('captain')) && (
        <button
          type="button"
          onClick={() =>
            setBadgePopover({
              name: 'Nakama Captain',
              meaning: 'Founder and leader of a verified study crew',
            })
          }
          className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Nakama Captain"
        >
          <Award size={13} className="text-blue-500" />
        </button>
      )}
      {profile?.crewName && (
        <button
          type="button"
          onClick={() =>
            setBadgePopover({
              name: 'Crew Member',
              meaning: `Enlisted in crew: ${profile.crewName}`,
            })
          }
          className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title={`Crew: ${profile.crewName}`}
        >
          <Users size={13} className="text-purple-500" />
        </button>
      )}
      {((isViewingSelf && isAdmin) ||
        profile?.role === 'superadmin' ||
        profile?.badges?.includes('staff')) && (
        <button
          type="button"
          onClick={() =>
            setBadgePopover({
              name: 'Staff Proctor',
              meaning: 'Official Boardly administrator and academic proctor',
            })
          }
          className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Boardly Staff"
        >
          <Shield size={13} className="text-red-500" />
        </button>
      )}
      {equippedStreakBadges.map((badgeId) => {
        const b = STREAK_BADGES.find((s) => s.id === badgeId);
        if (!b) return null;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setBadgePopover({ name: b.name, meaning: b.description })}
            className="w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            style={{
              backgroundColor: `${b.color}15`,
              borderColor: `${b.color}40`,
            }}
            title={b.name}
          >
            <Flame size={13} style={{ color: b.color }} />
          </button>
        );
      })}
      {pinnedShowcase.map((stampId) => {
        const s = PASSPORT_STAMPS.find((p) => p.id === stampId);
        if (!s) return null;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setBadgePopover({ name: s.name, meaning: s.requirement })}
            className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            title={s.name}
          >
            <Award size={13} />
          </button>
        );
      })}
      {badgePopover && (
        <div className="absolute left-0 bottom-full mb-2 z-50 p-2.5 rounded-xl floating-blur backdrop-blur-lg border border-[var(--border)] shadow-xl text-xs flex flex-col gap-1 min-w-[200px] animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-[var(--text)]">{badgePopover.name}</span>
            <button
              onClick={() => setBadgePopover(null)}
              className="text-[var(--muted)] hover:text-[var(--text)]"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{badgePopover.meaning}</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative w-full flex flex-col bg-[var(--background)] text-[var(--text)] ${
        isFullPage ? 'max-w-4xl mx-auto py-2 sm:py-6 px-0 sm:px-4' : 'max-w-xl mx-auto'
      }`}
    >
      {/* ── PROFILE EFFECT (Confined to dialog on desktop, full screen on mobile) ── */}
      {effectiveEffectId && (
        <div key={effectPlayKey} className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <CosmeticErrorBoundary fallback={null}>
            <ProfileCardEffect itemId={effectiveEffectId} size={500} />
          </CosmeticErrorBoundary>
        </div>
      )}

      {/* ── "VIEW AS OTHERS" PREVIEW BANNER (OWN MODE PREVIEW) ── */}
      {isViewingSelf && previewAsPublic && (
        <div className="sticky top-0 z-50 px-4 py-2 bg-[var(--red)] text-white text-xs font-heading font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Eye size={14} />
            <span>Viewing your profile exactly as other students see it</span>
          </div>
          <button
            onClick={() => setPreviewAsPublic(false)}
            className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-white font-mono text-xs transition-colors cursor-pointer"
          >
            Back to my view
          </button>
        </div>
      )}

      {/* ── MAIN CARD CONTAINER ── */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden flex flex-col">
        {/* ── CONFIGURABLE 10-LAYOUT HEADER (Renders all 5 store items + buttons) ── */}
        <ProfileLayoutsRenderer
          layout={resolvedLayoutId}
          data={sharedProfileData}
          isPublicMode={isPublicMode}
          previewMode={false}
          shortId={
            profile?.studentId ||
            profile?.shortId ||
            deriveFallbackShortId(sharedProfileData.uid || '0')
          }
          onClose={onClose ? () => onClose() : undefined}
          onPreviewAsPublic={
            isViewingSelf && !previewAsPublic ? () => setPreviewAsPublic(true) : undefined
          }
          onEditProfile={() => setEditSheetOpen(true)}
          onChangeAvatar={
            isViewingSelf && !isPublicMode ? () => setAvatarPickerOpen(true) : undefined
          }
          onOpenStore={() => {
            if (onClose) onClose(true);
            navigate('/store');
          }}
          onOpenSettings={() => {
            if (onClose) onClose(true);
            navigate('/settings');
          }}
          onOpenWallet={() => setWalletModalOpen(true)}
          onOpenRewards={() => {
            if (onClose) onClose(true);
            navigate('/rewards');
          }}
          onOpenMessages={() => {
            setDmInitialTab(incomingRequestsCount > 0 ? 'requests' : 'chat');
            setDmModalOpen(true);
          }}
          onOpenFollowers={() => setFollowListTab('followers')}
          onOpenFollowing={() => setFollowListTab('following')}
          onFollowToggle={currentUid !== profile?.uid ? handleFollowToggle : undefined}
          onMessageClick={
            !isViewingSelf && currentUid !== profile?.uid ? handleMessageOrRequestClick : undefined
          }
          onShareProfile={() => setShareModalOpen(true)}
          onViewCrew={profile?.crewName ? () => setCrewDetailModalOpen(true) : undefined}
          onUpgradeGuest={isGuest ? () => setGuestUpgradeModalOpen(true) : undefined}
          onProBadgeClick={() =>
            setBadgePopover({
              name: 'Pro Member',
              meaning: 'Unlimited mock exams & AI assistance',
            })
          }
          isFollowedByMe={isFollowedByMe}
          followsMe={followsMe}
          followWorking={followWorking}
          incomingRequestsCount={incomingRequestsCount}
          messageButtonLabel={messageButtonLabel}
          messageButtonDisabled={messageButtonDisabled}
          messageButtonHighlight={isPendingIncoming}
          isGuest={isGuest}
          crewName={profile?.crewName}
          badgeRowNode={badgeRowNode}
          effectPlayKey={effectPlayKey}
        />

        {/* ── 7. TABS WITH UNDERLINE STYLE ── */}
        <div className="px-4 sm:px-6 border-b border-[var(--border)] flex items-center gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[var(--red)] text-[var(--text)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('loadout')}
            className={`pb-3 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'loadout'
                ? 'border-[var(--red)] text-[var(--text)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Loadout
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-3 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-[var(--red)] text-[var(--text)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Badges
          </button>
        </div>

        {/* ── TAB CONTENT BODY ── */}
        <div className="p-4 sm:p-6 pb-28 sm:pb-36 flex flex-col gap-6">
          {/* ══════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* About Me & Metadata */}
              <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-xs text-[var(--text)]">About Me</span>
                  {profile?.memberSince && (
                    <span className="text-[11px] text-[var(--muted)] font-mono flex items-center gap-1">
                      <Calendar size={12} />
                      Member since{' '}
                      {new Date(
                        typeof profile.memberSince === 'object' && 'seconds' in profile.memberSince
                          ? profile.memberSince.seconds * 1000
                          : profile.memberSince
                      ).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {profile?.bio ? (
                  <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                ) : isViewingSelf && !isPublicMode ? (
                  <button
                    onClick={() => setEditSheetOpen(true)}
                    className="py-3 px-4 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--red)] transition-colors cursor-pointer text-left"
                  >
                    + Add a short bio so other students can get to know you.
                  </button>
                ) : (
                  <p className="text-xs text-[var(--muted)] italic">No bio shared yet.</p>
                )}

                {/* Crew Tag */}
                {profile?.crewName && (
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)]">Study Squad</span>
                    <span className="font-bold text-[var(--text)]">{profile.crewName}</span>
                  </div>
                )}
              </div>

              {/* ── POSTS SECTION ── */}
              <ProfilePostsSection
                targetUid={profile?.uid || targetUid || currentUid || ''}
                isOwnProfile={Boolean(isViewingSelf && !previewAsPublic)}
                readOnly={Boolean(isPublicMode)}
                currentUserId={currentUid}
                currentUserDisplayName={
                  isViewingSelf
                    ? ownProfile?.displayName || authUser?.displayName || profile?.displayName
                    : profile?.displayName
                }
                currentUserAvatar={
                  isViewingSelf
                    ? resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
                      resolveCosmeticItemId((ownProfile as any)?.avatar, 'avatar') ||
                      resolveCosmeticItemId(profile?.avatar, 'avatar') ||
                      null
                    : resolveCosmeticItemId(profile?.avatar, 'avatar') || null
                }
                equippedAvatar={
                  isViewingSelf
                    ? resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
                      resolveCosmeticItemId(profile?.equipped?.avatar, 'avatar') ||
                      resolveCosmeticItemId(profile?.avatar, 'avatar')
                    : resolveCosmeticItemId(profile?.equipped?.avatar, 'avatar') ||
                      resolveCosmeticItemId(profile?.avatar, 'avatar')
                }
                accentColor={accentColor}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: LOADOUT
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'loadout' && (
            <div className="flex flex-col gap-5">
              {/* Loadout Sub-Tabs: Equipped Slots vs Banners */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLoadoutSubTab('slots')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer ${
                      loadoutSubTab === 'slots'
                        ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Equipped Slots
                  </button>
                  <button
                    onClick={() => {
                      setLoadoutSubTab('banners');
                      if (!selectedBannerPreviewId) {
                        setSelectedBannerPreviewId(profile?.banner || 'ban_midnight_torii');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      loadoutSubTab === 'banners'
                        ? 'bg-[var(--card-2)] text-[var(--text)] border border-amber-500/40 shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>Banners</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-bold">
                      12 Flagships
                    </span>
                  </button>
                </div>

                {isViewingSelf && !isPublicMode && loadoutSubTab === 'slots' && (
                  <button
                    onClick={() => setEffectPlayKey((k) => k + 1)}
                    className="text-xs font-heading font-semibold text-[var(--red)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Replay effect
                  </button>
                )}
              </div>

              {/* ── SUB-VIEW A: ALL EQUIPPED SLOTS ── */}
              {loadoutSubTab === 'slots' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Effect */}
                  <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <Sparkles size={20} className="text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Profile Effect</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.effectId || '')?.name || 'Default Pulse'}
                        </span>
                      </div>
                    </div>

                    {isViewingSelf && !isPublicMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate('/store')}
                          className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold hover:bg-[var(--card)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        {profile?.effectId && (
                          <button
                            onClick={() => handleUnequipItem('effect')}
                            className="h-8 px-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            Unequip
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Banner */}
                  <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shrink-0 shadow-xs">
                        <BannerRenderer
                          bannerId={profile?.banner}
                          accentColor={accentColor}
                          animated={false}
                          showReadabilityOverlay={false}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Banner Art</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.banner || '')?.name || 'Signature Dot-Matrix'}
                        </span>
                      </div>
                    </div>

                    {isViewingSelf && !isPublicMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setLoadoutSubTab('banners');
                            setSelectedBannerPreviewId(profile?.banner || 'ban_midnight_torii');
                          }}
                          className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold hover:bg-[var(--card)] transition-colors cursor-pointer text-amber-500 hover:text-amber-400"
                        >
                          Change
                        </button>
                        {profile?.banner && (
                          <button
                            onClick={() => handleEquipBanner(null)}
                            className="h-8 px-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            Unequip
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Picture */}
                  <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <AvatarPicture
                          uid={profile?.uid || currentUid}
                          seed={profile?.uid || currentUid}
                          avatarId={profile?.avatar}
                          size={36}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Profile Picture</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.avatar || '')?.name ||
                            MATRIX_AVATARS.find((a) => a.key === profile?.avatar)?.label ||
                            'Dot-Matrix Avatar'}
                        </span>
                      </div>
                    </div>

                    {isViewingSelf && !isPublicMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAvatarPickerOpen(true)}
                          className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold hover:bg-[var(--card)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Frame */}
                  <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <AvatarFrame itemId={profile?.frame || 'none'} size={40}>
                          <div className="w-6 h-6 rounded-full bg-[var(--border)]" />
                        </AvatarFrame>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Avatar Frame</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.frame || '')?.name || 'Classic Border'}
                        </span>
                      </div>
                    </div>

                    {isViewingSelf && !isPublicMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate('/store')}
                          className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold hover:bg-[var(--card)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        {profile?.frame && (
                          <button
                            onClick={() => handleUnequipItem('frame')}
                            className="h-8 px-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            Unequip
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. Nameplate */}
                  <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3 sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <Award size={20} className="text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Nameplate</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.nameplate || '')?.name || 'Standard Badge'}
                        </span>
                      </div>
                    </div>

                    {isViewingSelf && !isPublicMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate('/store')}
                          className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold hover:bg-[var(--card)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        {profile?.nameplate && (
                          <button
                            onClick={() => handleUnequipItem('nameplate')}
                            className="h-8 px-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            Unequip
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SUB-VIEW B: BANNERS WARDROBE & LIVE PREVIEW ── */}
              {loadoutSubTab === 'banners' && (() => {
                const activePreviewId = selectedBannerPreviewId ?? profile?.banner ?? 'ban_midnight_torii';
                const previewItem = getCosmeticById(activePreviewId);
                const isCurrentlyEquipped = (profile?.banner || ownEquipped?.banner) === activePreviewId;
                const isOwned = (ownedCosmetics || []).includes(activePreviewId);

                const filteredBanners = catalogBanners.filter((b) => {
                  if (bannerFilter === 'static') return !b.animated;
                  if (bannerFilter === 'animated') return b.animated;
                  if (bannerFilter === 'owned') return (ownedCosmetics || []).includes(b.id);
                  return true;
                });

                return (
                  <div className="flex flex-col gap-5">
                    {/* ── 1. LIVE PREVIEW STAGE ── */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] shadow-md space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[var(--text)]">
                            Live Banner Preview
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/30 text-amber-400 font-bold">
                            {previewItem?.rarity || 'legendary'}
                          </span>
                          {previewItem?.animated && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/40 text-cyan-400">
                              ✦ Animated
                            </span>
                          )}
                        </div>

                        {/* Theme preview switch */}
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-[var(--muted)]">Preview theme:</span>
                          <button
                            onClick={() => setPreviewThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                            className="px-2.5 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] hover:border-amber-500/40 text-[var(--text)] font-semibold transition-colors cursor-pointer"
                          >
                            {previewThemeMode === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                          </button>
                        </div>
                      </div>

                      {/* Preview Container Window */}
                      <div className={`relative rounded-2xl overflow-hidden border border-[var(--border)] ${
                        previewThemeMode === 'light' ? 'bg-white text-zinc-900' : 'bg-[#0B0B10] text-white'
                      } shadow-lg transition-colors`}>
                        {/* Banner Cover Area (Responsive 130px mobile, 170px desktop) */}
                        <div className="relative w-full h-[130px] sm:h-[170px] overflow-hidden select-none">
                          <BannerRenderer
                            bannerId={activePreviewId}
                            accentColor={accentColor}
                            animated={true}
                            showReadabilityOverlay={true}
                          />
                        </div>

                        {/* Avatar, Frame, Nameplate, and Lv badge overlay preview */}
                        <div className="px-4 pb-4 -mt-[38px] sm:-mt-[48px] relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div className="flex items-end gap-3 min-w-0">
                            {/* Avatar & Lv Badge */}
                            <div className="p-0.5 rounded-full bg-[var(--card)] shrink-0 overflow-visible relative shadow-md">
                              <AvatarFrame itemId={profile?.frame || 'none'} size={window.innerWidth < 640 ? 76 : 96}>
                                <AvatarPicture
                                  uid={profile?.uid || currentUid}
                                  seed={profile?.uid || currentUid}
                                  avatarId={profile?.avatar}
                                  size={window.innerWidth < 640 ? 64 : 84}
                                />
                              </AvatarFrame>
                              <div
                                className="absolute -bottom-1 -right-1 z-30 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-mono font-black text-[9px] shadow-sm border border-[var(--card)] flex items-center gap-0.5"
                              >
                                <span className="text-[7px] font-extrabold text-amber-200">LV</span>
                                <span>{studentLevel}</span>
                              </div>
                            </div>

                            {/* Name & Identity */}
                            <div className="min-w-0 pb-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Nameplate
                                  itemId={profile?.nameplate || 'none'}
                                  name={profile?.displayName || 'Student'}
                                />
                              </div>
                              <p className="text-[11px] font-heading font-semibold text-amber-400/90 truncate">
                                {previewItem?.name || 'Default Cover'}
                              </p>
                            </div>
                          </div>

                          {/* Live Action Buttons */}
                          {isViewingSelf && !isPublicMode && (
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pb-1">
                              {isCurrentlyEquipped ? (
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                    <CheckCircle2 size={14} />
                                    <span>Equipped</span>
                                  </span>
                                  <button
                                    disabled={equippingBannerId === 'none'}
                                    onClick={() => handleEquipBanner(null)}
                                    className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] text-xs text-red-400 font-heading font-semibold transition-colors cursor-pointer"
                                  >
                                    Revert to Default
                                  </button>
                                </div>
                              ) : isOwned ? (
                                <button
                                  disabled={equippingBannerId === activePreviewId}
                                  onClick={() => handleEquipBanner(activePreviewId)}
                                  className="btn-red text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                                >
                                  {equippingBannerId === activePreviewId ? (
                                    <span>Equipping...</span>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} />
                                      <span>Equip to Profile</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {previewItem && (
                                    <button
                                      disabled={equippingBannerId === activePreviewId}
                                      onClick={() => handlePurchaseBanner(previewItem)}
                                      className="btn-red text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                                    >
                                      <KobanIcon size={14} />
                                      <span>Unlock ({previewItem.priceKobans} Kobans)</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => navigate('/store')}
                                    className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] text-xs font-heading font-semibold transition-colors cursor-pointer"
                                  >
                                    View in Store
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description & Story */}
                      {previewItem && (
                        <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-heading font-bold text-[var(--text)] mr-2">
                              {previewItem.name}:
                            </span>
                            <span className="text-[var(--muted)]">{previewItem.description}</span>
                          </div>
                          <span className="font-mono text-[11px] text-amber-500 font-bold shrink-0">
                            {previewItem.priceKobans} Kobans
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── 2. FILTER PILLS & 12 BANNERS CATALOG ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-heading font-bold text-[var(--text)]">
                          Select a Banner ({filteredBanners.length})
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { id: 'all' as const, label: 'All 12' },
                            { id: 'static' as const, label: 'Static (6)' },
                            { id: 'animated' as const, label: 'Animated (6)' },
                            {
                              id: 'owned' as const,
                              label: `Owned (${
                                catalogBanners.filter((b) => (ownedCosmetics || []).includes(b.id)).length
                              })`,
                            },
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setBannerFilter(f.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                                bannerFilter === f.id
                                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                                  : 'border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grid of Banners */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredBanners.map((banner) => {
                          const isSelected = activePreviewId === banner.id;
                          const isEquipped = (profile?.banner || ownEquipped?.banner) === banner.id;
                          const userOwns = (ownedCosmetics || []).includes(banner.id);

                          return (
                            <div
                              key={banner.id}
                              onClick={() => setSelectedBannerPreviewId(banner.id)}
                              className={`p-3 rounded-2xl bg-[var(--card)] border transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                                isSelected
                                  ? 'border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                                  : isEquipped
                                  ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                  : banner.rarity === 'legendary'
                                  ? 'border-amber-500/40 hover:border-amber-400'
                                  : banner.rarity === 'epic'
                                  ? 'border-purple-500/35 hover:border-purple-400'
                                  : banner.rarity === 'rare'
                                  ? 'border-blue-500/30 hover:border-blue-400'
                                  : 'border-[var(--border)] hover:border-teal-500/40'
                              }`}
                            >
                              {/* Rarity & Badges */}
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span
                                  className={`uppercase font-bold ${
                                    banner.rarity === 'legendary'
                                      ? 'text-amber-400'
                                      : banner.rarity === 'epic'
                                      ? 'text-purple-400'
                                      : banner.rarity === 'rare'
                                      ? 'text-blue-400'
                                      : 'text-teal-400'
                                  }`}
                                >
                                  {banner.rarity}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {banner.animated && (
                                    <span className="text-cyan-400 font-bold">✦ Animated</span>
                                  )}
                                  {isEquipped && (
                                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 size={11} /> Equipped
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Banner Thumbnail */}
                              <div className="h-24 rounded-xl overflow-hidden border border-[var(--border)] relative bg-neutral-950 shadow-inner group-hover:scale-[1.02] transition-transform">
                                <BannerRenderer
                                  bannerId={banner.id}
                                  animated={banner.animated}
                                  className="w-full h-full"
                                  showReadabilityOverlay={false}
                                />
                              </div>

                              {/* Info */}
                              <div>
                                <h4 className="font-heading font-bold text-xs text-[var(--text)] group-hover:text-amber-400 transition-colors">
                                  {banner.name}
                                </h4>
                                <p className="text-[10px] text-[var(--muted)] line-clamp-1 mt-0.5">
                                  {banner.description}
                                </p>
                              </div>

                              {/* Footer Action */}
                              <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs">
                                <span className="font-mono text-[11px] font-bold text-[#E8A317]">
                                  {userOwns ? 'Owned' : `${banner.priceKobans} Kobans`}
                                </span>

                                {isViewingSelf && !isPublicMode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBannerPreviewId(banner.id);
                                      if (userOwns) {
                                        handleEquipBanner(isEquipped ? null : banner.id);
                                      } else {
                                        handlePurchaseBanner(banner);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                                      isEquipped
                                        ? 'border border-[var(--border)] text-[var(--muted)] hover:text-white'
                                        : userOwns
                                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-xs'
                                        : 'btn-red text-[11px] py-1 px-2.5'
                                    }`}
                                  >
                                    {isEquipped ? 'Unequip' : userOwns ? 'Equip' : 'Unlock'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: BADGES (Passport Stamp Grid & Streak Badges)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'badges' && (
            <div className="flex flex-col gap-6">
              {/* Passport Stamp Grid */}
              <div className="flex flex-col gap-3">
                <span className="font-heading font-semibold text-xs text-[var(--text)]">
                  Passport Study Stamps
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PASSPORT_STAMPS.map((stamp) => {
                    const isEarned = stamp.earned({
                      mcqs: profile?.stats?.mcqs ?? profile?.publicStats?.totalQuestionsSolved,
                      streak: profile?.stats?.streak ?? profile?.publicStats?.streak,
                      longestStreak: profile?.stats?.longestStreak ?? profile?.publicStats?.longestStreak,
                      crewName: profile?.crewName,
                    });

                    // In public mode, locked stamps are hidden
                    if (isPublicMode && !isEarned) return null;

                    const isPinned = pinnedShowcase.includes(stamp.id);

                    return (
                      <div
                        key={stamp.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isEarned
                            ? 'bg-[var(--card)] border-[var(--border)]'
                            : 'bg-transparent border-dashed border-[var(--border)] opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                              isEarned
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--muted)]'
                            }`}
                          >
                            <Award size={20} />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-heading font-bold text-xs text-[var(--text)] truncate">
                              {stamp.name}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] truncate">
                              {stamp.requirement}
                            </span>
                            {!isEarned && (
                              <span className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
                                Locked · Complete requirement to earn
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pin to Showcase (OWN MODE ONLY) */}
                        {isViewingSelf && !isPublicMode && isEarned && (
                          <button
                            onClick={() => handleToggleShowcasePin(stamp.id)}
                            className={`h-8 px-2.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                              isPinned
                                ? 'bg-[var(--red)] border-[var(--red)] text-white'
                                : 'border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--muted)]'
                            }`}
                            title={isPinned ? 'Pinned in Showcase' : 'Pin in Showcase'}
                          >
                            <Pin size={12} />
                            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streak Badges Section (Own Mode: Equip up to 3) */}
              {isViewingSelf && !isPublicMode && (
                <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span className="font-heading font-semibold text-[var(--text)]">Streak Flame Badges</span>
                    <span className="font-mono text-[11px]">{equippedStreakBadges.length}/3 Equipped</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STREAK_BADGES.map((badge) => {
                      const userStreak = Math.max(
                        profile?.stats?.streak ?? 0,
                        profile?.stats?.longestStreak ?? 0
                      );
                      const isUnlocked = userStreak >= badge.days;
                      const isEquipped = equippedStreakBadges.includes(badge.id);

                      return (
                        <div
                          key={badge.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isUnlocked
                              ? 'bg-[var(--card-2)] border-[var(--border)]'
                              : 'bg-transparent border-dashed border-[var(--border)] opacity-40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isUnlocked ? `${badge.color}15` : 'transparent',
                                borderColor: isUnlocked ? `${badge.color}40` : 'var(--border)',
                              }}
                            >
                              <Flame size={17} style={{ color: isUnlocked ? badge.color : 'var(--muted)' }} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-heading font-semibold text-xs text-[var(--text)] truncate">
                                {badge.name}
                              </span>
                              <span className="text-[10px] text-[var(--muted)] font-mono">
                                {badge.days} Day Milestone
                              </span>
                            </div>
                          </div>

                          {isUnlocked && (
                            <button
                              onClick={() => handleToggleStreakBadge(badge.id)}
                              className={`h-8 px-3 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                                isEquipped
                                  ? 'bg-[var(--red)] text-white'
                                  : 'border border-[var(--border)] hover:bg-[var(--card)] text-[var(--text)]'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : 'Equip'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FOLLOWERS & FOLLOWING LIST MODAL ── */}
      {followListTab && (
        <FollowListModal
          isOpen={Boolean(followListTab)}
          onClose={() => setFollowListTab(null)}
          userId={profile?.uid || ''}
          initialTab={followListTab}
          currentUserId={currentUid}
          onSelectUser={(uid) => {
            setFollowListTab(null);
            if (!isFullPage) {
              openProfile(uid);
            } else {
              navigate(`/dashboard/profile?uid=${uid}`);
            }
          }}
        />
      )}

      {/* ── EDIT PROFILE SHEET (OWN MODE) ── */}
      {editSheetOpen && profile && (
        <EditProfileSheet
          isOpen={editSheetOpen}
          onClose={() => setEditSheetOpen(false)}
          profile={profile}
          onChangePicture={
            isViewingSelf && !isPublicMode ? () => setAvatarPickerOpen(true) : undefined
          }
          onSave={handleSaveProfileUpdates}
        />
      )}

      {/* ── CHANGE PROFILE PICTURE PICKER MODAL (OWN MODE ONLY) ── */}
      {isViewingSelf && !isPublicMode && currentUid && (
        <ProfilePicturePickerModal
          isOpen={avatarPickerOpen}
          onClose={() => setAvatarPickerOpen(false)}
          uid={currentUid}
          currentAvatarId={profile?.avatar || ownEquipped?.avatar || null}
          ownedIds={ownedCosmetics || []}
          isSuperAdmin={isSuperAdmin}
          onSaveAvatar={handleSaveAvatar}
        />
      )}

      {/* ── SHARE PROFILE CARD MODAL ── */}
      {shareModalOpen && profile && (
        <ShareProfileCardModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          profile={profile}
        />
      )}

      {/* ── LIMITED CREW DETAIL MODAL (PUBLIC MODE) ── */}
      {crewDetailModalOpen && profile?.crewName && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-base text-[var(--text)]">Study Squad</span>
              <button
                onClick={() => setCrewDetailModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--card-2)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-2">
              <span className="font-heading font-bold text-sm text-[var(--text)]">{profile.crewName}</span>
              <p className="text-xs text-[var(--muted)]">
                A student crew working together towards exam excellence on Boardly.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setCrewDetailModalOpen(false)}
                className="h-10 px-4 rounded-lg bg-[var(--red)] text-white text-xs font-heading font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL: Unfollow @name? ── */}
      {unfollowModalOpen && profile && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="font-heading font-bold text-base text-[var(--text)]">
              Unfollow @{sanitizeStudentDisplayName(profile.displayName, profile.studentId)}?
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Their shared materials will no longer show in your Following feed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUnfollowModalOpen(false)}
                disabled={followWorking}
                className="h-10 px-4 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnfollow}
                disabled={followWorking}
                className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-semibold transition-colors cursor-pointer"
              >
                {followWorking ? 'Unfollowing...' : 'Unfollow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Koban Wallet Modal ── */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        balance={kobanBalance}
      />

      {/* ── Guest Upgrade Modal ── */}
      <GuestUpgradeModal
        isOpen={guestUpgradeModalOpen}
        onClose={() => setGuestUpgradeModalOpen(false)}
      />

      {/* ── 1-on-1 Direct Message & Chat Requests Modal ── */}
      {profile && (
        <DirectMessageModal
          isOpen={dmModalOpen}
          onClose={() => setDmModalOpen(false)}
          initialTab={dmInitialTab}
          targetUser={
            !isViewingSelf && currentUid !== profile.uid
              ? {
                  uid: profile.uid,
                  displayName: profile.displayName || 'Student',
                  avatar: profile.avatar,
                  frame: profile.frame,
                  role: profile.role,
                  photoURL: null,
                }
              : null
          }
          onPermissionChange={() => {
            if (currentUid && profile.uid && currentUid !== profile.uid) {
              void checkChatPermission(currentUid, profile.uid)
                .then((perm) => setChatPermission(perm))
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
};
