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
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { getPublicProfile, syncPublicProfile } from '@/services/publicProfileService';
import { followUser, unfollowUser, isFollowing } from '@/services/followService';
import { getRankTitle } from '@/config/rankLadder';
import {
  PASSPORT_STAMPS,
  STREAK_BADGES,
  ROLE_BADGES,
  type PassportStamp,
  type StreakBadge,
} from '@/config/badgesConfig';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
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
import { StudyHeatmap } from './StudyHeatmap';
import { SubjectAccuracyRings } from './SubjectAccuracyRings';
import { FollowListModal } from './FollowListModal';
import { EditProfileSheet } from './EditProfileSheet';
import { ShareProfileCardModal } from './ShareProfileCardModal';
import { deriveFallbackShortId } from '@/utils/shortId';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import type { PublicProfile } from '@/types';

export interface ProfileViewProps {
  /** If targetUid is provided and not current user, runs in PUBLIC mode. */
  targetUid?: string | null;
  /** Whether mounted full-page (e.g. /dashboard/profile centered column max-w-960px) or in dialog */
  isFullPage?: boolean;
  /** Optional callback to close modal container */
  onClose?: () => void;
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
  const {
    profile: ownProfile,
    targetExam,
    testDate,
    daysLeft,
    updateProfileData,
  } = useUserProfile();
  const { balance: kobanBalance, equipped: ownEquipped, equipCosmetic } = useWallet();
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

  // Tabs: 'overview' | 'loadout' | 'badges' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'loadout' | 'badges' | 'settings'>('overview');

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

  // Showcase pinned items (up to 3)
  const [pinnedShowcase, setPinnedShowcase] = useState<string[]>(['stamp_100_mcqs', 'stamp_7d_streak']);

  // Equipped streak badges (up to 3)
  const [equippedStreakBadges, setEquippedStreakBadges] = useState<string[]>(['badge_streak_7d']);

  useEffect(() => {
    let isMounted = true;
    const uidToFetch = targetUid || currentUid;
    if (!uidToFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);

    async function fetchProfileData() {
      try {
        const publicData = await getPublicProfile(uidToFetch);
        if (!isMounted) return;
        setProfile(publicData);

        // Check follow relationship if viewing someone else
        if (currentUid && uidToFetch !== currentUid) {
          const [followingTarget, followedByTarget] = await Promise.all([
            isFollowing(currentUid, uidToFetch),
            isFollowing(uidToFetch, currentUid),
          ]);
          if (!isMounted) return;
          setIsFollowedByMe(followingTarget);
          setFollowsMe(followedByTarget);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('[ProfileView] error loading profile:', err);
        setFetchError(err?.message || 'Could not load student profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [targetUid, currentUid]);

  // When viewing self in own mode, keep profile in sync with ownProfile/ownEquipped
  useEffect(() => {
    if (isViewingSelf && ownProfile && !previewAsPublic) {
      const shortCode = ownProfile.studentId || ownProfile.shortId || deriveFallbackShortId(currentUid || '0');
      const cleanName = sanitizeStudentDisplayName(ownProfile.displayName || authUser?.displayName, shortCode);

      setProfile((prev) => ({
        uid: currentUid || 'guest',
        displayName: cleanName,
        studentId: shortCode,
        avatar: (ownEquipped?.avatar as string) || (ownProfile.avatar as string) || ownProfile.avatarKey || null,
        banner: (ownEquipped?.banner as string) || (ownProfile.banner as string) || null,
        frame: (ownEquipped?.frame as string) || (ownProfile.frame as string) || null,
        nameplate: (ownEquipped?.nameplate as string) || (ownProfile.nameplate as string) || null,
        effectId: (ownEquipped?.effect as string) || (ownProfile.effectId as string) || null,
        badges: ownProfile.badges || prev?.badges || [],
        bio: ownProfile.bio || prev?.bio || '',
        status: ownProfile.status || prev?.status || '',
        accent: ownProfile.accent || prev?.accent || '#D71921',
        memberSince: ownProfile.createdAt || ownProfile.memberSince || prev?.memberSince || null,
        crewName: ownProfile.crewName || prev?.crewName || null,
        stats: {
          streak: Number(ownProfile.streak ?? prev?.stats?.streak ?? 0),
          longestStreak: Number(ownProfile.longestStreak ?? ownProfile.streak ?? prev?.stats?.longestStreak ?? 0),
          mcqs: Number(ownProfile.totalQuestionsSolved ?? ownProfile.mcqsSolved ?? prev?.stats?.mcqs ?? 0),
          accuracy: Number(ownProfile.accuracy ?? prev?.stats?.accuracy ?? 0),
        },
        followersCount: prev?.followersCount ?? 0,
        followingCount: prev?.followingCount ?? 0,
        lastActiveAt: ownProfile.lastActiveDate || prev?.lastActiveAt || null,
        equipped: ownEquipped,
      }));
    }
  }, [isViewingSelf, ownProfile, ownEquipped, previewAsPublic, currentUid, authUser?.displayName]);

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
    if (!currentUid || !profile?.uid || followWorking) return;
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
    } catch (err: any) {
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
      setUnfollowModalOpen(false);
    } catch (err: any) {
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
    } catch (err) {
      console.warn('[ProfileView] unequip error:', err);
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
    if (!isViewingSelf) return;
    setPinnedShowcase((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const accentColor = profile?.accent || '#D71921';
  const effectiveEffectId = profile?.effectId || ownEquipped?.effect || null;

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
              onClick={onClose}
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
            <div className="p-1 rounded-full bg-[var(--card)] shrink-0 overflow-visible">
              <AvatarFrame itemId={profile?.frame || 'none'} size={window.innerWidth < 640 ? 88 : 120}>
                <AvatarPicture
                  avatarId={profile?.avatar}
                  avatarKey={profile?.avatarKey}
                  variant={profile?.avatarVariant}
                  size={window.innerWidth < 640 ? 76 : 104}
                />
              </AvatarFrame>
            </div>

            {/* Kobans Chip (OWN MODE ONLY) */}
            {isViewingSelf && !isPublicMode && (
              <div className="mb-2 shrink-0">
                <Link
                  to="/store"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-2)] border border-[#E8A317]/30 hover:border-[#E8A317] text-[#D97706] dark:text-[#FBBF24] font-mono text-xs font-bold transition-colors shadow-sm"
                  title="Your Koban balance"
                >
                  <KobanIcon size={15} />
                  <span>{kobanBalance.toLocaleString()}</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── 3. NAME ROW ── */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Nameplate */}
              {profile?.nameplate ? (
                <Nameplate
                  itemId={profile.nameplate}
                  name={profile?.displayName || 'Student'}
                  shortId={profile?.studentId || profile?.shortId}
                />
              ) : (
                <h1 className="font-heading font-bold text-lg sm:text-xl text-[var(--text)] truncate">
                  {profile?.displayName || 'Student'}
                </h1>
              )}

              {/* Student ID chip */}
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                #{profile?.studentId || profile?.shortId || profile?.uid?.slice(0, 5) || '00000'}
              </span>

              {/* Public mode: Follows you tag */}
              {isPublicMode && followsMe && (
                <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                  Follows you
                </span>
              )}
            </div>

            {/* Rank title & status line */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className="font-mono font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: rank.badgeBg, color: rank.badgeColor }}
              >
                {rank.title}
              </span>

              {profile?.status ? (
                <div className="flex items-center gap-1.5 text-[var(--muted)] italic truncate max-w-sm">
                  {isStudyingNow && (
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                      title="Studying now"
                    />
                  )}
                  <span>"{profile.status}"</span>
                </div>
              ) : isStudyingNow ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Studying now</span>
                </div>
              ) : null}
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
                  onClick={() => navigate('/store')}
                  className="h-11 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag size={14} className="text-[#E8A317]" />
                  <span>Boardly Store</span>
                </button>

                <button
                  onClick={() => setPreviewAsPublic(true)}
                  className="h-11 px-3.5 rounded-lg border border-[var(--border)] hover:bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="View as others"
                >
                  <Eye size={14} />
                  <span className="hidden sm:inline">View as others</span>
                </button>
              </>
            ) : (
              // ── PUBLIC MODE ACTIONS ──
              <>
                {/* Follow Button */}
                {currentUid && currentUid !== profile?.uid && (
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

          {/* Settings tab: OWN MODE ONLY */}
          {isViewingSelf && !isPublicMode && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-[var(--red)] text-[var(--text)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Settings
            </button>
          )}
        </div>

        {/* ── TAB CONTENT BODY ── */}
        <div className="p-4 sm:p-6 flex flex-col gap-6">
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
                    + Add a bio to let other students know what exam you're preparing for...
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

              {/* Public Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Streak</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Flame size={16} className="text-orange-500 fill-orange-500" />
                    <span className="font-mono font-bold text-lg text-[var(--text)]">
                      {profile?.stats?.streak ?? profile?.publicStats?.streak ?? 0}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Best Streak</span>
                  <span className="font-mono font-bold text-lg text-[var(--text)] mt-1">
                    {profile?.stats?.longestStreak ?? profile?.publicStats?.longestStreak ?? profile?.stats?.streak ?? 0}d
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">MCQs Solved</span>
                  <span className="font-mono font-bold text-lg text-[var(--text)] mt-1">
                    {(profile?.stats?.mcqs ?? profile?.publicStats?.totalQuestionsSolved ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Accuracy</span>
                  <span className="font-mono font-bold text-lg text-[var(--text)] mt-1">
                    {Math.round(profile?.stats?.accuracy ?? profile?.publicStats?.accuracy ?? 0)}%
                  </span>
                </div>
              </div>

              {/* 12-Week Heatmap */}
              <StudyHeatmap accentColor={accentColor} />

              {/* Subject Accuracy Rings */}
              <SubjectAccuracyRings isOwnMode={!isPublicMode} accentColor={accentColor} />

              {/* Showcase Pinned Items */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-heading font-semibold text-[var(--text)] flex items-center gap-1.5">
                    <Pin size={13} className="text-[var(--red)]" />
                    Student Showcase
                  </span>
                  <span className="font-mono text-[11px]">{pinnedShowcase.length}/3 Pinned</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {pinnedShowcase.map((itemId) => {
                    const stamp = PASSPORT_STAMPS.find((s) => s.id === itemId);
                    const badge = STREAK_BADGES.find((b) => b.id === itemId);

                    return (
                      <div
                        key={itemId}
                        className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          {badge ? (
                            <Flame size={18} style={{ color: badge.color }} />
                          ) : (
                            <Award size={18} className="text-[var(--red)]" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-heading font-semibold text-xs text-[var(--text)] truncate">
                            {badge?.name || stamp?.name || 'Honor Stamp'}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] truncate">
                            {badge?.description || stamp?.requirement || 'Earned Achievement'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OWN MODE ONLY OVERVIEW ADDITIONS: Kobans Card & Daily Pro Reward */}
              {isViewingSelf && !isPublicMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Koban Balance Card */}
                  <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KobanIcon size={20} />
                        <span className="font-heading font-bold text-sm text-[var(--text)]">
                          Kobans Balance
                        </span>
                      </div>
                      <span className="font-mono font-bold text-base text-[#D97706] dark:text-[#FBBF24]">
                        {kobanBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
                      <Link
                        to="/store"
                        className="text-xs font-heading font-semibold text-[var(--red)] hover:underline"
                      >
                        Get Kobans →
                      </Link>
                      <Link
                        to="/dashboard/plans"
                        className="text-xs font-mono text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        Ledger History
                      </Link>
                    </div>
                  </div>

                  {/* Daily Reward / Pro Perk Card */}
                  <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" />
                        <span className="font-heading font-bold text-sm text-[var(--text)]">
                          Pro Daily Reward
                        </span>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      Claim daily study streak rewards and unlock exclusive anime cosmetic drops in the store.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: LOADOUT
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'loadout' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="font-heading font-semibold text-[var(--text)]">Equipped Cosmetics</span>
                {isViewingSelf && !isPublicMode && (
                  <button
                    onClick={() => setEffectPlayKey((k) => k + 1)}
                    className="text-xs font-heading font-semibold text-[var(--red)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Replay effect
                  </button>
                )}
              </div>

              {/* Grid of Loadout Slots: Effect, Banner, Picture, Frame, Nameplate */}
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
                    <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shrink-0">
                      <DefaultDotMatrixBanner accentColor={accentColor} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Banner Art</span>
                      <span className="font-heading font-semibold text-xs text-[var(--text)]">
                        {getCosmeticById(profile?.banner || '')?.name || 'Dot-Matrix Pattern'}
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
                      {profile?.banner && (
                        <button
                          onClick={() => handleUnequipItem('banner')}
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

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: SETTINGS (OWN MODE ONLY)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && isViewingSelf && !isPublicMode && (
            <div className="flex flex-col gap-6">
              {/* 1. Target Exam with Countdown & Edit */}
              <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-xs text-[var(--text)]">Target Exam</span>
                  <Link
                    to="/onboarding"
                    className="text-xs font-heading font-semibold text-[var(--red)] hover:underline"
                  >
                    Change Target →
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)]">
                      {targetExam || 'MDCAT / ECAT / University Test'}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {testDate ? `Scheduled Date: ${testDate}` : 'No date set yet'}
                    </p>
                  </div>

                  {daysLeft !== null && daysLeft >= 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xl text-[var(--red)]">{daysLeft}</span>
                      <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Days Left</span>
                    </div>
                  ) : daysLeft !== null && daysLeft < 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-[var(--muted)]">Exam passed. Set your next target</span>
                      <Link
                        to="/onboarding"
                        className="h-8 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--card)] text-xs font-heading font-semibold text-[var(--text)] transition-colors inline-flex items-center"
                      >
                        Set Next Target
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 2. Current Plan */}
              <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Current Plan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {effectivePlan.isSuperAdmin
                        ? 'Superadmin (Unlimited)'
                        : effectivePlan.isUnlimited
                        ? 'Boardly Pro Member'
                        : 'Free Starter'}
                    </span>
                    <span className="badge-pill text-[10px] px-2 py-0.5">
                      {effectivePlan.isUnlimited ? 'Active' : 'Free'}
                    </span>
                  </div>
                  {effectivePlan.planExpiresAt && (
                    <span className="text-[11px] text-[var(--muted)] font-mono">
                      Expires:{' '}
                      {new Date(
                        typeof effectivePlan.planExpiresAt === 'object' && 'seconds' in effectivePlan.planExpiresAt
                          ? effectivePlan.planExpiresAt.seconds * 1000
                          : effectivePlan.planExpiresAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <Link
                  to="/pricing"
                  className="h-10 px-4 rounded-lg bg-[var(--red)] hover:bg-[var(--red-dark)] text-white text-xs font-heading font-semibold transition-colors flex items-center justify-center shrink-0"
                >
                  Manage Subscription
                </Link>
              </div>

              {/* 3. Superadmin Access (Visible ONLY to superadmins) */}
              {isAdmin && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-red-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-heading font-bold text-xs text-[var(--text)]">Superadmin Console</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        Platform management, moderation queue & question bank
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin"
                    className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-semibold transition-colors flex items-center justify-center shrink-0"
                  >
                    Open Admin Portal
                  </Link>
                </div>
              )}

              {/* 4. Account (Email visible ONLY here) */}
              <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-4">
                <span className="font-heading font-semibold text-xs text-[var(--text)]">Account & Authentication</span>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Account Email</span>
                  <span className="font-mono text-xs text-[var(--text)] bg-[var(--card)] px-3 py-2 rounded-lg border border-[var(--border)]">
                    {authUser?.email || 'No email attached'}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    Strict Privacy: Your email is private and is NEVER shown on public profiles or Commons.
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <button
                    onClick={() => setEditSheetOpen(true)}
                    className="h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--card)] text-xs font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer"
                  >
                    Change Display Name
                  </button>

                  <button
                    onClick={async () => {
                      await signOutUser();
                      navigate('/login');
                    }}
                    className="h-10 px-4 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-heading font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
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
            navigate(`/dashboard/profile?uid=${uid}`);
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
              Unfollow @{profile.displayName}?
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
    </div>
  );
};
