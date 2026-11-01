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
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { WalletModal } from './WalletModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getPublicProfile, syncPublicProfile } from '@/services/publicProfileService';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchUserCommonsPosts } from '@/services/commonsService';
import { deriveFallbackShortId } from '@/utils/shortId';
import { sanitizeStudentDisplayName, isAdminAccount } from '@/utils/privacy';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { PublicProfile } from '@/types';

export interface ProfileViewProps {
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
  targetUid,
  isFullPage = false,
  onClose,
  initialPreviewAsPublic = false,
}) => {
  const navigate = useNavigate();
  const { user: authUser, isAdmin, signOutUser } = useAuth();
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
  } = useWallet();
  const effectivePlan = useEffectivePlan();

  // Determine true mode
  const currentUid = authUser?.uid || null;
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

  useEffect(() => {
    let isMounted = true;
    const resolvedUid = targetUid || currentUid;
    if (!resolvedUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    setProfile(null);

    async function fetchProfileData() {
      const uid = targetUid || currentUid;
      if (!uid) return;

      try {
        // 1. Read publicProfiles/{uid} for everyone; only read users/{uid} when viewing self or as admin
        //    (reading users/{uid} for another user as a non-admin throws permission-denied and would reject Promise.all!)
        const userDocRef = doc(db, 'users', uid);
        const canReadPrivateUserDoc = uid === currentUid || isAdmin;

        const [userSnap, publicSnap] = await Promise.all([
          canReadPrivateUserDoc
            ? getDoc(userDocRef).catch(() => null)
            : Promise.resolve(null),
          getDoc(doc(db, 'publicProfiles', uid)).catch(() => null),
        ]);

        const uData = userSnap && userSnap.exists() ? userSnap.data() : null;
        const pubData = publicSnap && publicSnap.exists() ? publicSnap.data() : null;

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

        const candidateName = uData?.displayName || uData?.username || uData?.name || pubData?.displayName || postAuthorName;
        const candidateEmail = uData?.email || pubData?.email || (uid === currentUid ? authUser?.email : null);

        const isAdminAccountUser =
          isAdminAccount(uid) ||
          uData?.role === 'admin' ||
          uData?.role === 'superadmin' ||
          pubData?.role === 'admin' ||
          (candidateEmail && isAdminAccount(candidateEmail)) ||
          isAdminAccount(candidateName) ||
          (candidateName && (
            candidateName.toLowerCase().includes('shs') ||
            candidateName.toLowerCase().includes('virtual academy')
          )) ||
          (uid === currentUid && isAdmin);

        const shortCode =
          uData?.studentId ||
          uData?.shortId ||
          pubData?.studentId ||
          pubData?.shortId ||
          deriveFallbackShortId(uid);

        let cleanName = '';
        if (isAdminAccountUser) {
          cleanName = 'SHS Virtual Academy';
          // Ensure admin user doc and public profile have the official name and role
          if (uData && (!uData.displayName || uData.displayName !== 'SHS Virtual Academy' || uData.role !== 'admin')) {
            setDoc(userDocRef, { displayName: 'SHS Virtual Academy', role: 'admin' }, { merge: true }).catch(() => {});
          }
          if (pubData && (!pubData.displayName || pubData.displayName !== 'SHS Virtual Academy' || pubData.role !== 'admin')) {
            setDoc(doc(db, 'publicProfiles', uid), { displayName: 'SHS Virtual Academy', role: 'admin' }, { merge: true }).catch(() => {});
          }
          if (postAuthorPhotoURL && !uData?.photoURL) {
            setDoc(userDocRef, { photoURL: postAuthorPhotoURL }, { merge: true }).catch(() => {});
          }
        } else {
          // Priority: displayName -> username -> name -> postAuthorName -> fallback
          cleanName = sanitizeStudentDisplayName(candidateName, shortCode);
        }

        const mergedEquipped = {
          ...(pubData?.equipped || {}),
          ...(uData?.equipped || {}),
        };
        // Avatar priority: 1. equipped store avatar, 2. custom uploaded/chosen avatar, 3. Google photo only if nothing set, 4. default placeholder
        const rawEquippedAvatar =
          (mergedEquipped?.avatar as string) ||
          (uData?.avatar as string) ||
          (pubData?.avatar as string) ||
          postAuthorEquippedAvatar ||
          null;
        const avatar =
          rawEquippedAvatar && !String(rawEquippedAvatar).includes('googleusercontent.com')
            ? rawEquippedAvatar
            : null;
        const avatarUrl =
          (uData?.avatarUrl as string) ||
          (pubData?.avatarUrl as string) ||
          (postAuthorAvatar && !postAuthorAvatar.startsWith('pfp_') && postAuthorAvatar !== 'eclipse-wyrm' && !postAuthorAvatar.includes('googleusercontent') ? postAuthorAvatar : null) ||
          null;
        const photoURL =
          (uData?.photoURL as string) ||
          (pubData?.photoURL as string) ||
          postAuthorPhotoURL ||
          (postAuthorAvatar?.includes('googleusercontent') ? postAuthorAvatar : null) ||
          null;
        const frame =
          (mergedEquipped?.frame as string) ||
          (uData?.frame as string) ||
          (pubData?.frame as string) ||
          postAuthorFrame ||
          null;
        const nameplate =
          (mergedEquipped?.nameplate as string) ||
          (uData?.nameplate as string) ||
          (pubData?.nameplate as string) ||
          null;
        const banner =
          (mergedEquipped?.banner as string) ||
          (uData?.banner as string) ||
          (pubData?.banner as string) ||
          null;
        const effectId =
          (mergedEquipped?.effect as string) ||
          (uData?.effectId as string) ||
          (pubData?.effectId as string) ||
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

        const followCounts = await getFollowCounts(uid, { uData, pubData });

        const resolvedProfile: PublicProfile = {
          uid,
          displayName: cleanName,
          studentId: shortCode,
          shortId: shortCode,
          avatar,
          banner,
          frame,
          nameplate,
          effectId,
          badges: uData?.badges || pubData?.badges || [],
          bio: uData?.bio || pubData?.bio || '',
          status: uData?.status || pubData?.status || '',
          accent: uData?.accent || pubData?.accent || '#D71921',
          memberSince: uData?.createdAt || pubData?.memberSince || null,
          crewName: uData?.crewName || pubData?.crewName || null,
          stats,
          followersCount: followCounts.followersCount,
          followingCount: followCounts.followingCount,
          lastActiveAt: uData?.lastActiveDate || pubData?.lastActiveAt || null,
          role: isAdminAccountUser ? 'admin' : (uData?.role || pubData?.role || 'student'),
          equipped,
          avatarUrl,
          photoURL,
          avatarKey: uData?.avatarKey || null,
          avatarVariant: uData?.avatarVariant || null,
        };

        if (!isMounted) return;
        setProfile(resolvedProfile);

        const initialPinned = (uData?.pinnedStamps as string[]) || (pubData?.pinnedStamps as string[]) || [];
        if (Array.isArray(initialPinned)) {
          setPinnedShowcase(initialPinned);
        }

        // Check follow relationship directly from users/{currentUid}/following/{uid}
        if (currentUid && uid !== currentUid) {
          const followSnap = await getDoc(doc(db, 'users', currentUid, 'following', uid));
          if (!isMounted) return;
          setIsFollowedByMe(followSnap.exists());
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

    return () => {
      isMounted = false;
    };
  }, [targetUid, currentUid, isAdmin, authUser?.email]);

  // Profile and follow status are fetched via one-time getDoc in fetchProfileData above to conserve Firestore read quota.

  // When viewing self in own mode, safely merge ownProfile/ownEquipped without wiping loaded cosmetics or replacing Boardly avatars with Google photoURL
  useEffect(() => {
    if (isViewingSelf && ownProfile && !previewAsPublic && !walletLoading) {
      const op = ownProfile as any;
      const isAdminAccountUser = isAdmin || isAdminAccount(currentUid) || op.role === 'admin' || isAdminAccount(authUser?.email);
      const shortCode = op.studentId || op.shortId || deriveFallbackShortId(currentUid || '0');
      const cleanName = isAdminAccountUser
        ? 'SHS Virtual Academy'
        : sanitizeStudentDisplayName(op.displayName || authUser?.displayName, shortCode);

      setProfile((prev) => {
        const candidateAvatar =
          (ownEquipped?.avatar as string) ||
          (op.equipped?.avatar as string) ||
          (op.avatar as string) ||
          prev?.avatar ||
          op.avatarKey ||
          prev?.avatarKey ||
          null;
        const resolvedAvatar =
          candidateAvatar && !String(candidateAvatar).includes('googleusercontent.com')
            ? candidateAvatar
            : prev?.avatar || null;
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

        return {
          uid: currentUid || 'guest',
          displayName: cleanName,
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
          followersCount: prev?.followersCount ?? 0,
          followingCount: prev?.followingCount ?? 0,
          lastActiveAt: op.lastActiveDate || prev?.lastActiveAt || null,
          role: isAdminAccountUser ? 'admin' : (op.role || prev?.role || 'student'),
          equipped: {
            effect: resolvedEffectId,
            frame: resolvedFrame,
            nameplate: resolvedNameplate,
            avatar: resolvedAvatar,
            banner: resolvedBanner,
          },
          avatarUrl: op.avatarUrl || prev?.avatarUrl || null,
          photoURL: op.photoURL || prev?.photoURL || null,
          avatarKey: op.avatarKey || prev?.avatarKey || null,
          avatarVariant: op.avatarVariant || prev?.avatarVariant || null,
        };
      });
    }
  }, [isViewingSelf, ownProfile, ownEquipped, walletLoading, previewAsPublic, currentUid, authUser?.displayName, authUser?.email, isAdmin]);

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
    if (!profile?.uid || followWorking) return;
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
      await followUser(currentUid, targetId);
      const updatedCounts = await getFollowCounts(targetId);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: updatedCounts.followersCount,
              followingCount: updatedCounts.followingCount,
            }
          : null
      );
    } catch (err: any) {
      console.error('[ProfileView] followUser failed:', err?.code || 'ERROR', `users/${currentUid}/following/${targetId}`, err);
      // Rollback
      setIsFollowedByMe(false);
      setProfile((prev) => (prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) } : null));
      alert(err?.message || 'Failed to follow user.');
    } finally {
      setFollowWorking(false);
    }
  };

  const confirmUnfollow = async () => {
    if (!currentUid || !profile?.uid) return;
    const targetId = profile.uid;
    setFollowWorking(true);

    // Optimistic unfollow
    setIsFollowedByMe(false);
    setProfile((prev) => (prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) } : null));

    try {
      await unfollowUser(currentUid, targetId);
      const updatedCounts = await getFollowCounts(targetId);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: updatedCounts.followersCount,
              followingCount: updatedCounts.followingCount,
            }
          : null
      );
      setUnfollowModalOpen(false);
    } catch (err: any) {
      console.error('[ProfileView] unfollowUser failed:', err?.code || 'ERROR', `users/${currentUid}/following/${targetId}`, err);
      // Rollback
      setIsFollowedByMe(true);
      setProfile((prev) => (prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null));
      alert(err?.message || 'Failed to unfollow user.');
    } finally {
      setFollowWorking(false);
    }
  };

  // Edit Profile submission
  const handleSaveProfileUpdates = async (updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }) => {
    if (!currentUid) return;
    await updateProfileData(updates);
    await syncPublicProfile(currentUid, {
      ...ownProfile,
      ...updates,
    });
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
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

      setDoc(doc(db, 'users', currentUid), { pinnedStamps: next }, { merge: true }).catch(() => {});
      setDoc(doc(db, 'publicProfiles', currentUid), { pinnedStamps: next }, { merge: true }).catch(() => {});
      return next;
    });
  };

  const accentColor = profile?.accent || '#D71921';
  const effectiveEffectId =
    profile?.effectId ||
    (isViewingSelf && !previewAsPublic ? ownEquipped?.effect : null) ||
    null;

  if (loading && !profile) {
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
        {/* ── 1. BANNER (Full width: 160px mobile, 200px desktop) ── */}
        <div className="relative w-full h-[160px] sm:h-[200px] overflow-hidden shrink-0 select-none">
          <CosmeticErrorBoundary
            fallback={<DefaultDotMatrixBanner accentColor={accentColor} />}
          >
            <BannerRenderer
              bannerId={profile?.banner}
              accentColor={accentColor}
              animated={true}
            />
          </CosmeticErrorBoundary>

          {/* Close button on mobile/dialog */}
          {onClose && (
            <button
              onClick={() => onClose()}
              className="absolute top-3 left-3 z-40 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-white/20"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}

          {/* Owner preview toggle button on top right of banner */}
          {isViewingSelf && !previewAsPublic && (
            <button
              onClick={() => setPreviewAsPublic(true)}
              className="absolute top-3 right-3 z-40 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-heading font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
            >
              <Eye size={13} />
              <span className="hidden sm:inline">View as others</span>
            </button>
          )}

          </div>

        {/* ── 2. AVATAR & HEADER DETAILS ── */}
        <div className="px-4 sm:px-6 pb-4 flex flex-col gap-3">
          {/* Avatar row with half-banner overlap */}
          <div className="flex items-end justify-between -mt-[44px] sm:-mt-[60px] relative z-20">
            {/* Avatar container (88px mobile, 120px desktop, never clipped) */}
            <div className="p-1 rounded-full bg-[var(--card)] shrink-0 overflow-visible relative">
              <BoardlyAvatar
                equippedAvatar={profile?.avatar || (profile?.equipped?.avatar as string)}
                avatarUrl={profile?.avatarUrl}
                photoURL={
                  profile?.avatar || (profile?.equipped?.avatar as string) || profile?.avatarUrl || profile?.avatarKey
                    ? null
                    : profile?.photoURL || (isViewingSelf ? (authUser?.photoURL as string) : null)
                }
                frame={profile?.frame || (profile?.equipped?.frame as string) || 'none'}
                name={profile?.displayName || 'Student'}
                avatarKey={profile?.avatarKey}
                avatarVariant={profile?.avatarVariant}
                size={window.innerWidth < 640 ? 76 : 104}
              />
              {/* Level Badge anchored to bottom-right of avatar (duplicate ADMIN tag removed) */}
              <div
                className="absolute -bottom-1 -right-1 z-30 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-mono font-black text-[10px] sm:text-[11px] shadow-md border-2 border-[var(--card)] flex items-center gap-0.5 select-none"
                title={`Level ${studentLevel} Student`}
              >
                <span className="text-[8px] font-extrabold text-amber-200">LV</span>
                <span>{studentLevel}</span>
              </div>
            </div>

            {/* Kobans Chip (OWN MODE ONLY) - Opens Wallet Modal */}
            {isViewingSelf && !isPublicMode && (
              <div className="mb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-2)] border border-[#E8A317]/30 hover:border-[#E8A317] text-[#D97706] dark:text-[#FBBF24] font-mono text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  title="Your Koban balance - View Wallet"
                >
                  <KobanIcon size={15} />
                  <span>{kobanBalance.toLocaleString()}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── 3. NAME ROW ── */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Nameplate: ID shown only once inside the nameplate */}
              {profile?.nameplate ? (
                <Nameplate
                  itemId={profile.nameplate}
                  name={profile?.displayName || 'Student'}
                  shortId={profile?.studentId || profile?.shortId || deriveFallbackShortId(profile?.uid || '0')}
                />
              ) : (
                <h1 className="font-heading font-bold text-lg sm:text-xl text-[var(--text)] truncate flex items-center gap-1.5">
                  <span>{profile?.displayName || 'Student'}</span>
                  <span className="font-mono text-xs font-normal text-[var(--muted)]">
                    #{profile?.studentId || profile?.shortId || deriveFallbackShortId(profile?.uid || '0')}
                  </span>
                </h1>
              )}

              {/* Public mode: Follows you tag */}
              {isPublicMode && followsMe && (
                <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                  Follows you
                </span>
              )}
            </div>

            {/* Role badge & Active status line (shown once under the nameplate) */}
            <div className="flex items-center gap-2 flex-wrap text-xs mt-0.5">
              <RoleBadge
                role={profile?.role || (isViewingSelf ? ownProfile?.role : 'Student')}
                customRole={profile?.customRole || (isViewingSelf ? ownProfile?.customRole : undefined)}
                isSuperAdmin={
                  isAdminAccount(profile?.uid) ||
                  (isViewingSelf && isAdmin) ||
                  profile?.role === 'superadmin' ||
                  profile?.role === 'admin'
                }
                size="md"
              />

              {/* Green dot with "Active" next to it (no quote marks) */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-sans font-medium select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span>Active</span>
              </div>

              {profile?.status && profile.status.toLowerCase() !== 'active' && (
                <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs truncate max-w-sm">
                  <span>·</span>
                  <span className="truncate">{profile.status.replace(/^["']|["']$/g, '')}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. FOLLOW COUNTS (Tappable) ── */}
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--muted)] pt-1">
            <button
              onClick={() => setFollowListTab('followers')}
              className="hover:text-[var(--text)] transition-colors cursor-pointer group"
            >
              <strong className="text-[var(--text)] font-bold mr-1 group-hover:text-[var(--red)] transition-colors">
                {profile?.followersCount || 0}
              </strong>
              followers
            </button>
            <span>·</span>
            <button
              onClick={() => setFollowListTab('following')}
              className="hover:text-[var(--text)] transition-colors cursor-pointer group"
            >
              <strong className="text-[var(--text)] font-bold mr-1 group-hover:text-[var(--red)] transition-colors">
                {profile?.followingCount || 0}
              </strong>
              following
            </button>
          </div>

          {/* ── 5. BADGE ICONS ROW (Small icon-only 24px, 6px gap, original SVG) ── */}
          <div className="relative flex items-center gap-1.5 flex-wrap pt-1">
            {/* Pro badge */}
            {((isViewingSelf && effectivePlan.isUnlimited) || profile?.role === 'pro' || profile?.badges?.includes('pro')) && (
              <button
                type="button"
                onClick={() => setBadgePopover({ name: 'Pro Member', meaning: 'Unlimited mock exams & AI assistance' })}
                className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title="Pro Member"
              >
                <Sparkles size={13} className="text-amber-500" />
              </button>
            )}

            {/* Captain badge */}
            {(profile?.role === 'captain' || profile?.badges?.includes('captain')) && (
              <button
                type="button"
                onClick={() => setBadgePopover({ name: 'Nakama Captain', meaning: 'Founder and leader of a verified study crew' })}
                className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title="Nakama Captain"
              >
                <Award size={13} className="text-blue-500" />
              </button>
            )}

            {/* Crew leader */}
            {profile?.crewName && (
              <button
                type="button"
                onClick={() => setBadgePopover({ name: 'Crew Member', meaning: `Enlisted in crew: ${profile.crewName}` })}
                className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title={`Crew: ${profile.crewName}`}
              >
                <Users size={13} className="text-purple-500" />
              </button>
            )}

            {/* Staff badge (superadmin only) */}
            {((isViewingSelf && isAdmin) || profile?.role === 'superadmin' || profile?.badges?.includes('staff')) && (
              <button
                type="button"
                onClick={() => setBadgePopover({ name: 'Staff Proctor', meaning: 'Official Boardly administrator and academic proctor' })}
                className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title="Boardly Staff"
              >
                <Shield size={13} className="text-red-500" />
              </button>
            )}

            {/* Equipped Streak Badges (up to 3) */}
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

            {/* Pinned Showcase Stamps (up to 3) */}
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

            {/* Badge popover dialog */}
            {badgePopover && (
              <div className="absolute left-0 bottom-full mb-2 z-50 p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-xs flex flex-col gap-1 min-w-[200px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[var(--text)]">{badgePopover.name}</span>
                  <button onClick={() => setBadgePopover(null)} className="text-[var(--muted)] hover:text-[var(--text)]">
                    <X size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted)]">{badgePopover.meaning}</p>
              </div>
            )}
          </div>

          {/* ── 6. ACTIONS ROW ── */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {isViewingSelf && !isPublicMode ? (
              // ── OWN MODE ACTIONS ──
              <>
                <button
                  onClick={() => setEditSheetOpen(true)}
                  className="h-11 px-4 rounded-lg bg-[var(--red)] hover:bg-[var(--red-dark)] text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => {
                    if (onClose) onClose(true);
                    navigate('/store');
                  }}
                  className="h-11 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag size={14} className="text-[#E8A317]" />
                  <span>Boardly Store</span>
                </button>

                <button
                  onClick={() => {
                    if (onClose) onClose(true);
                    navigate('/settings');
                  }}
                  className="h-11 px-3.5 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Settings"
                >
                  <Settings size={15} />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </>
            ) : (
              // ── PUBLIC MODE ACTIONS ──
              <>
                {/* Follow Button (shown to both signed-in visitors and guests) */}
                {currentUid !== profile?.uid && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followWorking}
                    className={`h-11 px-5 rounded-lg text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isFollowedByMe
                        ? 'border border-[var(--border)] text-[var(--text)] hover:border-red-500 hover:text-red-500 bg-transparent'
                        : 'bg-[var(--red)] hover:bg-[var(--red-dark)] text-white'
                    }`}
                  >
                    {isFollowedByMe ? (
                      <>
                        <UserCheck size={14} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}

                {/* Share profile button */}
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="h-11 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Share2 size={14} />
                  <span>Share Profile</span>
                </button>

                {/* View crew button */}
                {profile?.crewName && (
                  <button
                    onClick={() => setCrewDetailModalOpen(true)}
                    className="h-11 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Users size={14} />
                    <span>View Crew</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

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
                    ? (ownEquipped?.avatar as string) ||
                      ((ownProfile as any)?.avatar as string) ||
                      (ownProfile as any)?.avatarUrl ||
                      (ownProfile?.photoURL as string) ||
                      (authUser?.photoURL as string) ||
                      profile?.avatar ||
                      null
                    : profile?.avatar || profile?.avatarUrl || profile?.photoURL || null
                }
                equippedAvatar={
                  isViewingSelf
                    ? ownEquipped?.avatar || (profile?.equipped?.avatar as string) || profile?.avatar
                    : (profile?.equipped?.avatar as string) || profile?.avatar
                }
                avatarKey={isViewingSelf ? profile?.avatarKey || ownProfile?.avatarKey : profile?.avatarKey}
                avatarVariant={isViewingSelf ? profile?.avatarVariant || ownProfile?.avatarVariant : profile?.avatarVariant}
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
                        <AvatarPicture avatarId={profile?.avatar} size={36} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Profile Picture</span>
                        <span className="font-heading font-semibold text-xs text-[var(--text)]">
                          {getCosmeticById(profile?.avatar || '')?.name || 'Dot-Matrix Avatar'}
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
                                  avatarId={profile?.avatar}
                                  avatarKey={profile?.avatarKey}
                                  variant={profile?.avatarVariant}
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
          onSave={handleSaveProfileUpdates}
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
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
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
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
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
    </div>
  );
};
