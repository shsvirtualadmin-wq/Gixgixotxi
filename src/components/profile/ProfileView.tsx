import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  Share2,
  Users,
  UserPlus,
  Check,
  Edit3,
  ExternalLink,
  Shield,
  Award,
  Flame,
  Target,
  Sparkles,
  RefreshCw,
  LogOut,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Coins,
  Crown,
  Zap,
  Info,
  AlertCircle,
  User,
  GraduationCap,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import {
  getPublicProfile,
  syncPublicProfile,
  updateProfileAtomic,
} from '@/services/publicProfileService';
import {
  isFollowing,
  followUser,
  unfollowUser,
} from '@/services/followService';
import {
  fetchUserPublicPosts,
  togglePostAnonymity,
  deleteCommonsPost,
} from '@/services/commonsService';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import {
  AvatarFrame,
  AvatarPicture,
  Nameplate,
  ProfileCardEffect,
  CosmeticErrorBoundary,
} from '@/components/koban/CosmeticRenderers';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { ANIME_STREAK_BADGES } from '@/constants/animeBadges';
import { calculateRankTitle, RANK_TIERS } from '@/config/rankLadder';
import { CommonsPostCard } from '@/components/commons/CommonsPostCard';
import { ProfileFollowModal } from './ProfileFollowModal';
import { EditProfileModal } from './EditProfileModal';
import { ProfileShareCardModal } from './ProfileShareCardModal';
import type { PublicProfile, CommonsPost, CosmeticType } from '@/types';

export interface ProfileViewProps {
  targetUid?: string | null;
  mode?: 'auto' | 'own' | 'public';
  isEmbedded?: boolean;
  onClose?: () => void;
  onOpenUserProfile?: (uid: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUid: propTargetUid,
  mode: forcedMode,
  isEmbedded = false,
  onClose,
  onOpenUserProfile,
}) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // If propTargetUid is empty or matches logged in user, it's own profile
  const isSelf = !propTargetUid || (user && propTargetUid === user.uid);
  const resolvedUid = propTargetUid || user?.uid || '';

  // Mode: own vs public (with "View as others" preview toggle in own mode)
  const [viewAsOthers, setViewAsOthers] = useState(false);
  const isOwnMode = isSelf && !viewAsOthers && forcedMode !== 'public';

  // State
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowerOfMe, setIsFollowerOfMe] = useState(false);
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Tabs
  type TabKey = 'overview' | 'posts' | 'loadout' | 'badges' | 'settings';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Posts Tab
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [postCategoryFilter, setPostCategoryFilter] = useState<'all' | 'notes' | 'doubt' | 'discussion'>('all');

  // Modals
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalInitialTab, setFollowModalInitialTab] = useState<'followers' | 'following'>('followers');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [unfollowConfirmOpen, setUnfollowConfirmOpen] = useState(false);
  const [activeBadgeTooltip, setActiveBadgeTooltip] = useState<{ id: string; name: string; desc: string } | null>(null);
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Settings State for inline editing
  const [targetUniInput, setTargetUniInput] = useState('');
  const [targetScoreInput, setTargetScoreInput] = useState('');
  const [discordInput, setDiscordInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Effect replay state
  const [effectPlayKey, setEffectPlayKey] = useState<number>(Date.now());
  const [effectVisible, setEffectVisible] = useState(true);

  // Hooks for OWN data only
  const {
    profile: ownUserProfile,
    updateProfileData,
    daysLeft,
    targetExam,
    testDate,
    university,
    targetScore,
  } = useUserProfile();
  const { wallet, balance: kobanBalance, equipCosmetic } = useWallet();
  const effectivePlan = useEffectivePlan();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync settings input defaults
  useEffect(() => {
    if (ownUserProfile) {
      setTargetUniInput(ownUserProfile.targetUniversity || university || '');
      setTargetScoreInput(String(ownUserProfile.targetScore || targetScore || ''));
      setDiscordInput((ownUserProfile as any)?.socialDiscord || '');
      setGithubInput((ownUserProfile as any)?.socialGithub || '');
      setTwitterInput((ownUserProfile as any)?.socialTwitter || '');
    }
  }, [ownUserProfile, university, targetScore]);

  // Effect timeout: Play once then fade
  useEffect(() => {
    setEffectVisible(true);
    const timer = setTimeout(() => {
      setEffectVisible(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [effectPlayKey, resolvedUid]);

  // Load public profile
  useEffect(() => {
    if (!resolvedUid) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;
    setIsLoadingProfile(true);

    const load = async () => {
      try {
        const p = await getPublicProfile(resolvedUid);
        if (!isMounted) return;
        setPublicProfile(p);
        if (p) {
          setFollowersCount(p.followersCount || 0);
          setFollowingCount(p.followingCount || 0);
        }

        // Check follow relationships
        if (user?.uid && user.uid !== resolvedUid) {
          const [followingThem, theyFollowMe] = await Promise.all([
            isFollowing(user.uid, resolvedUid),
            isFollowing(resolvedUid, user.uid),
          ]);
          if (!isMounted) return;
          setAmIFollowing(followingThem);
          setIsFollowerOfMe(theyFollowMe);
        }
      } catch (err) {
        console.warn('[ProfileView] Error loading public profile:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [resolvedUid, user?.uid]);

  // Load public posts for posts tab (Anonymous posts NEVER appear on any profile)
  useEffect(() => {
    if (!resolvedUid || activeTab !== 'posts') return;

    let isMounted = true;
    setIsLoadingPosts(true);

    const loadPosts = async () => {
      try {
        // Any query for a user's posts must only return isAnonymous == false
        const res = await fetchUserPublicPosts(resolvedUid, null, 25);
        if (isMounted) {
          setPosts(res.posts);
          setHasMorePosts(res.hasMore);
        }
      } catch (err) {
        console.warn('[ProfileView] Error loading posts:', err);
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [resolvedUid, activeTab]);

  // Status line activity check: active in last 10 minutes
  const isStudyingNow = useMemo(() => {
    if (!publicProfile?.lastActiveAt) return false;
    try {
      const ts = publicProfile.lastActiveAt;
      const date = (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as any);
      return Date.now() - date.getTime() < 10 * 60 * 1000;
    } catch {
      return false;
    }
  }, [publicProfile?.lastActiveAt]);

  // Formatted Member Since
  const memberSinceFormatted = useMemo(() => {
    if (!publicProfile?.memberSince) return 'Early Member';
    try {
      const ts = publicProfile.memberSince;
      const date = (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as any);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Early Member';
    }
  }, [publicProfile?.memberSince]);

  // Follow action
  const handleFollowAction = async () => {
    if (!user?.uid || !resolvedUid || amIFollowing) return;
    setAmIFollowing(true);
    setFollowersCount((prev) => prev + 1);
    try {
      await followUser(user.uid, resolvedUid);
    } catch (err) {
      setAmIFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      console.warn('[ProfileView] Follow failed:', err);
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!user?.uid || !resolvedUid) return;
    setUnfollowConfirmOpen(false);
    setAmIFollowing(false);
    setFollowersCount((prev) => Math.max(0, prev - 1));
    try {
      await unfollowUser(user.uid, resolvedUid);
    } catch (err) {
      setAmIFollowing(true);
      setFollowersCount((prev) => prev + 1);
      console.warn('[ProfileView] Unfollow failed:', err);
    }
  };

  // Toggle anonymity of own post
  const handleToggleAnonymity = async (targetPost: CommonsPost) => {
    if (!user?.uid) return;
    const makeAnon = !targetPost.isAnonymous;
    try {
      await togglePostAnonymity(
        targetPost.id,
        { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL },
        makeAnon
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === targetPost.id ? { ...p, isAnonymous: makeAnon } : p))
      );
    } catch (err) {
      console.warn('[ProfileView] Toggle anonymity error:', err);
    }
  };

  // Delete own post
  const handleDeletePost = async (postId: string) => {
    if (!user?.uid) return;
    if (!window.confirm('Delete this post from Boardly Commons?')) return;
    try {
      await deleteCommonsPost(postId, user.uid, isAdmin);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.warn('[ProfileView] Delete post error:', err);
    }
  };

  // Save profile updates from EditProfileModal (Atomic batch write to BOTH users and publicProfiles)
  const handleSaveProfileEdits = async (updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }) => {
    if (!user?.uid) return;
    const fresh = await updateProfileAtomic(user.uid, updates);
    setPublicProfile(fresh);
    await updateProfileData(updates);
  };

  // Save settings tab updates (Target university, score, socials)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    try {
      await updateProfileData({
        targetUniversity: targetUniInput.trim(),
        targetScore: targetScoreInput ? Number(targetScoreInput) : null,
        socialDiscord: discordInput.trim().slice(0, 40),
        socialGithub: githubInput.trim().slice(0, 40),
        socialTwitter: twitterInput.trim().slice(0, 40),
      } as any);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      console.warn('[ProfileView] Error saving settings:', err);
    }
  };

  // Reset account study data
  const handleResetAccountData = async () => {
    if (!user?.uid) return;
    try {
      await updateProfileData({
        streak: 0,
        longestStreak: 0,
        totalQuestionsSolved: 0,
        testsCompleted: 0,
        score: 0,
        accuracy: 0,
      });
      setResetConfirmOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.warn('[ProfileView] Reset account error:', err);
    }
  };

  // Stamp Passport Data
  const stamps = useMemo(() => {
    const totalMcqs = ownUserProfile?.totalQuestionsSolved || 0;
    const streakDays = Math.max(ownUserProfile?.streak || 0, 0);
    const hasCrew = Boolean(ownUserProfile?.crewId || ownUserProfile?.isCrewMember);

    return [
      {
        id: 'stamp-100-mcqs',
        title: 'First 100 MCQs',
        desc: 'Solve 100 practice questions',
        isEarned: isOwnMode ? totalMcqs >= 100 : Boolean(publicProfile?.pinnedStamps?.includes('stamp-100-mcqs')),
        icon: '🎯',
        hint: 'Solve 100 questions in practice or mock tests',
      },
      {
        id: 'stamp-7-day-streak',
        title: '7-Day Streak',
        desc: '7 uninterrupted practice days',
        isEarned: isOwnMode ? streakDays >= 7 : Boolean(publicProfile?.pinnedStamps?.includes('stamp-7-day-streak')),
        icon: '🔥',
        hint: 'Maintain uninterrupted practice for 7 days',
      },
      {
        id: 'stamp-join-crew',
        title: 'Joined a Crew',
        desc: 'Enlisted in an active study crew',
        isEarned: isOwnMode ? hasCrew : Boolean(publicProfile?.pinnedStamps?.includes('stamp-join-crew')),
        icon: '⚔️',
        hint: 'Join an active campus study squad',
      },
    ];
  }, [isOwnMode, ownUserProfile, publicProfile?.pinnedStamps]);

  // Streak Badges (equip up to 3)
  const equippedBadgesList = useMemo(() => {
    const raw = isOwnMode
      ? ownUserProfile?.equippedBadges || publicProfile?.badges || []
      : publicProfile?.badges || [];
    return Array.isArray(raw) ? raw.slice(0, 3) : [];
  }, [isOwnMode, ownUserProfile?.equippedBadges, publicProfile?.badges]);

  const handleToggleEquipStreakBadge = async (badgeId: string) => {
    if (!isOwnMode || !user?.uid) return;
    const current = [...equippedBadgesList];
    let updated: string[] = [];
    if (current.includes(badgeId)) {
      updated = current.filter((id) => id !== badgeId);
    } else {
      if (current.length >= 3) {
        current.shift(); // remove oldest to keep max 3
      }
      updated = [...current, badgeId];
    }

    await updateProfileData({ equippedBadges: updated });
    await syncPublicProfile(user.uid, {
      ...publicProfile,
      badges: updated,
      equippedBadges: updated,
    });
    setPublicProfile((prev) => (prev ? { ...prev, badges: updated } : prev));
  };

  // Toggle Stamp Pin to Showcase
  const handleTogglePinStamp = async (stampId: string) => {
    if (!isOwnMode || !user?.uid) return;
    const currentPins = Array.isArray(publicProfile?.pinnedStamps) ? [...publicProfile.pinnedStamps] : [];
    let updated: string[] = [];
    if (currentPins.includes(stampId)) {
      updated = currentPins.filter((id) => id !== stampId);
    } else {
      if (currentPins.length >= 3) currentPins.shift();
      updated = [...currentPins, stampId];
    }
    await updateProfileData({ pinnedStamps: updated });
    await syncPublicProfile(user.uid, { ...publicProfile, pinnedStamps: updated });
    setPublicProfile((prev) => (prev ? { ...prev, pinnedStamps: updated } : prev));
  };

  // Filtered public posts
  const displayedPosts = useMemo(() => {
    if (postCategoryFilter === 'all') return posts;
    return posts.filter((p) => p.type === postCategoryFilter);
  }, [posts, postCategoryFilter]);

  // Fallback profile if loading
  const displayProfile: PublicProfile = publicProfile || {
    uid: resolvedUid,
    displayName: isOwnMode ? (user?.displayName || 'Student') : 'Student',
    studentId: '...',
    avatar: null,
    banner: null,
    frame: null,
    nameplate: null,
    effectId: null,
    badges: [],
    bio: '',
    status: '',
    accent: '#D71921',
    memberSince: null,
    crewName: null,
    stats: { streak: 0, longestStreak: 0, mcqs: 0, accuracy: 0 },
    followersCount: 0,
    followingCount: 0,
    lastActiveAt: null,
    rankTitle: 'Fresher',
  };

  const equippedEffectId = isOwnMode ? (wallet.equipped.effect || displayProfile.effectId) : displayProfile.effectId;
  const equippedBannerId = isOwnMode ? (wallet.equipped.banner || displayProfile.banner) : displayProfile.banner;
  const equippedFrameId = isOwnMode ? (wallet.equipped.frame || displayProfile.frame) : displayProfile.frame;
  const equippedNameplateId = isOwnMode ? (wallet.equipped.nameplate || displayProfile.nameplate) : displayProfile.nameplate;
  const equippedAvatarId = isOwnMode ? (wallet.equipped.avatar || displayProfile.avatar) : displayProfile.avatar;

  // ── ERROR HANDLING: USER NOT FOUND 404 CARD ──
  if (!isLoadingProfile && !publicProfile && !isSelf) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0c0c0e] p-6 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
            <User size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-mono">User not found</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This student profile does not exist or may have been deleted.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose || (() => navigate(-1))}
            className="min-h-[40px] px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-950/40 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Render Inner Content
  const renderProfileContent = () => (
    <div className="w-full relative bg-[#0a0a0d] overflow-hidden select-none">
      {/* ── OFFLINE BANNER ── */}
      {isOffline && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 flex items-center gap-2 text-xs text-amber-200">
          <AlertCircle size={14} className="shrink-0" />
          <span>Network offline. Showing cached profile information.</span>
        </div>
      )}

      {/* ── VIEW AS OTHERS BANNER (OWN MODE PREVIEW) ── */}
      {viewAsOthers && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <span>Viewing your profile as others see it</span>
          <button
            type="button"
            onClick={() => setViewAsOthers(false)}
            className="font-bold underline hover:text-white cursor-pointer"
          >
            Back to my view
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          1. BANNER (Full width, 160px mobile, 200px desktop)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[160px] md:h-[200px] overflow-hidden bg-neutral-950">
        <CosmeticErrorBoundary fallback={<div className="w-full h-full bg-neutral-900" />}>
          <BannerRenderer
            bannerId={equippedBannerId}
            accentColor={displayProfile.accent}
            animated={false}
            className="w-full h-full object-cover"
          />
        </CosmeticErrorBoundary>
        {/* Subtle bottom shadow gradient to elevate avatar */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2 & 3. AVATAR, NAME ROW, FOLLOW COUNTS, BADGE ICONS
         ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 pb-4">
        {/* Avatar overlapping banner by half: 88px mobile, 120px desktop */}
        <div className="flex justify-between items-end -mt-11 md:-mt-15 mb-3">
          <div className="relative overflow-visible z-10">
            <CosmeticErrorBoundary
              fallback={
                <div className="w-[88px] h-[88px] md:w-[120px] md:h-[120px] rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-xl font-bold text-neutral-300">
                  {displayProfile.displayName.charAt(0).toUpperCase()}
                </div>
              }
            >
              <div className="w-[88px] h-[88px] md:w-[120px] md:h-[120px]">
                <AvatarFrame
                  itemId={equippedFrameId || 'none'}
                  size={120}
                  className="w-full h-full"
                  forceStatic
                >
                  <AvatarPicture
                    itemId={equippedAvatarId || 'none'}
                    size={110}
                    photoURL={displayProfile.photoURL || user?.photoURL}
                    className="w-full h-full"
                  />
                </AvatarFrame>
              </div>
            </CosmeticErrorBoundary>
          </div>

          {/* Quick Action in Header */}
          <div className="flex items-center gap-2">
            {!isOwnMode ? (
              <button
                type="button"
                onClick={amIFollowing ? () => setUnfollowConfirmOpen(true) : handleFollowAction}
                className={`min-h-[40px] px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  amIFollowing
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-red-600 hover:text-red-400'
                    : 'border-red-600 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
                }`}
              >
                {amIFollowing ? (
                  <span className="flex items-center gap-1.5">
                    <Check size={14} />
                    <span>Following</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <UserPlus size={14} />
                    <span>Follow</span>
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="min-h-[40px] px-3.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Nameplate, Display Name, Student ID, Rank Title & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CosmeticErrorBoundary
              fallback={
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  {displayProfile.displayName}
                </span>
              }
            >
              <Nameplate
                itemId={equippedNameplateId || 'none'}
                name={displayProfile.displayName}
                forceStatic
                className="text-base sm:text-lg font-bold text-white"
              />
            </CosmeticErrorBoundary>

            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
              #{displayProfile.studentId}
            </span>

            {/* Public mode: "Follows you" tag if they follow me */}
            {!isOwnMode && isFollowerOfMe && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase bg-red-950/50 border border-red-800/60 text-red-300">
                Follows you
              </span>
            )}
          </div>

          {/* Rank title */}
          <div className="text-xs font-bold font-mono text-neutral-400">
            {displayProfile.rankTitle || 'Fresher'}
          </div>

          {/* Status Line with "studying now" dot if active in last 10 minutes */}
          <div className="flex items-center gap-2 text-xs text-neutral-300 pt-0.5">
            {isStudyingNow && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Studying now</span>
              </span>
            )}
            {displayProfile.status && (
              <span className="text-neutral-400 truncate max-w-sm">
                {displayProfile.status}
              </span>
            )}
          </div>
        </div>

        {/* 4. Follow counts: "128 followers · 54 following" */}
        <div className="flex items-center gap-3 pt-2.5 text-xs text-neutral-400 font-mono">
          <button
            type="button"
            onClick={() => {
              setFollowModalInitialTab('followers');
              setFollowModalOpen(true);
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            <strong className="text-neutral-100 font-bold">{followersCount}</strong> followers
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => {
              setFollowModalInitialTab('following');
              setFollowModalOpen(true);
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            <strong className="text-neutral-100 font-bold">{followingCount}</strong> following
          </button>
        </div>

        {/* 5. Badge icons row: small icon-only badges (24px, 6px gap, wrapping row) */}
        <div className="relative flex items-center gap-1.5 flex-wrap pt-3">
          {/* Pro Badge */}
          {(effectivePlan.isUnlimited || displayProfile.role === 'captain') && (
            <button
              type="button"
              onClick={() =>
                setActiveBadgeTooltip({
                  id: 'pro',
                  name: 'Pro Member',
                  desc: 'Unlimited diagnostic test runs and step-by-step AI tutoring solutions.',
                })
              }
              className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500/20 to-red-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 hover:scale-105 transition-transform cursor-pointer"
              title="Pro Member"
            >
              <Crown size={14} />
            </button>
          )}

          {/* Captain Badge */}
          {(displayProfile.role === 'captain' || ownUserProfile?.isCaptain) && (
            <button
              type="button"
              onClick={() =>
                setActiveBadgeTooltip({
                  id: 'captain',
                  name: 'Nakama Captain',
                  desc: 'Official campus leader guiding students through exam preparation.',
                })
              }
              className="w-6 h-6 rounded-md bg-blue-950/60 border border-blue-500/60 flex items-center justify-center text-blue-400 hover:scale-105 transition-transform cursor-pointer"
              title="Nakama Captain"
            >
              <Award size={14} />
            </button>
          )}

          {/* Crew Leader Badge */}
          {displayProfile.crewName && (
            <button
              type="button"
              onClick={() =>
                setActiveBadgeTooltip({
                  id: 'crew',
                  name: `Crew: ${displayProfile.crewName}`,
                  desc: `Active member of the ${displayProfile.crewName} campus study crew.`,
                })
              }
              className="w-6 h-6 rounded-md bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 hover:scale-105 transition-transform cursor-pointer"
              title={`Crew: ${displayProfile.crewName}`}
            >
              <Users size={14} />
            </button>
          )}

          {/* Staff Badge (Superadmin only) */}
          {(isAdmin || displayProfile.role === 'superadmin') && (
            <button
              type="button"
              onClick={() =>
                setActiveBadgeTooltip({
                  id: 'staff',
                  name: 'Boardly Staff',
                  desc: 'Platform administrator and verified faculty engineer.',
                })
              }
              className="w-6 h-6 rounded-md bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 hover:scale-105 transition-transform cursor-pointer"
              title="Boardly Staff"
            >
              <Shield size={14} />
            </button>
          )}

          {/* Up to 3 equipped streak badges */}
          {equippedBadgesList.map((badgeId) => {
            const badge = ANIME_STREAK_BADGES.find((b) => b.id === badgeId);
            if (!badge) return null;
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() =>
                  setActiveBadgeTooltip({
                    id: badge.id,
                    name: badge.name,
                    desc: `${badge.days}-day streak unlock: ${badge.rewardTitle}. ${badge.lore}`,
                  })
                }
                className="w-6 h-6 rounded-md border flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                style={{
                  backgroundColor: `${badge.accentColor}18`,
                  borderColor: `${badge.accentColor}70`,
                  color: badge.accentColor,
                }}
                title={badge.name}
              >
                <Flame size={14} />
              </button>
            );
          })}

          {/* Tooltip popover */}
          {activeBadgeTooltip && (
            <div className="absolute top-10 left-0 z-40 p-2.5 rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-xl text-xs backdrop-blur-md max-w-xs space-y-1 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-neutral-100 font-mono">
                  {activeBadgeTooltip.name}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveBadgeTooltip(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-[11px] text-neutral-300 leading-snug">
                {activeBadgeTooltip.desc}
              </p>
            </div>
          )}
        </div>

        {/* 6. Actions row */}
        <div className="pt-3 border-t border-neutral-850 mt-3">
          {isOwnMode ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="min-h-[44px] px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-md shadow-red-950/40 whitespace-nowrap cursor-pointer"
              >
                Edit Profile
              </button>
              <Link
                to="/store"
                className="min-h-[44px] px-3.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Boardly Store</span>
              </Link>
              <button
                type="button"
                onClick={() => setViewAsOthers(true)}
                className="min-h-[44px] px-3.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                View as others
              </button>

              {/* Koban balance chip (contrast >= 4.5:1, never wrapping) */}
              <div className="ml-auto min-h-[44px] px-3 rounded-lg border border-neutral-800 bg-neutral-900/90 flex items-center gap-1.5 font-mono text-xs text-amber-400 shrink-0 whitespace-nowrap">
                <Coins size={14} />
                <span className="font-bold text-white">{kobanBalance || 0}</span>
                <span className="text-[11px] text-neutral-400">Kobans</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={amIFollowing ? () => setUnfollowConfirmOpen(true) : handleFollowAction}
                className={`min-h-[44px] px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  amIFollowing
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-red-600 hover:text-red-400'
                    : 'border-red-600 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
                }`}
              >
                {amIFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="min-h-[44px] px-3.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share profile</span>
              </button>

              {displayProfile.crewName && (
                <button
                  type="button"
                  onClick={() => setCrewModalOpen(true)}
                  className="min-h-[44px] px-3.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Users size={14} />
                  <span>View crew</span>
                </button>
              )}

              {viewAsOthers && (
                <button
                  type="button"
                  onClick={() => setViewAsOthers(false)}
                  className="ml-auto min-h-[44px] px-3.5 rounded-lg border border-amber-600 bg-amber-600/20 text-xs font-bold text-amber-200 hover:bg-amber-600/30 transition-colors cursor-pointer"
                >
                  Back to my view
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          7. TABS (Underline style)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-neutral-800/90 px-4 sm:px-6">
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {(['overview', 'posts', 'loadout', 'badges', ...(isOwnMode ? ['settings'] : [])] as TabKey[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              const labels: Record<TabKey, string> = {
                overview: 'Overview',
                posts: 'Posts',
                loadout: 'Loadout',
                badges: 'Badges',
                settings: 'Settings',
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            }
          )}
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          8. TAB CONTENTS
         ══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* About me (Plain text, links never rendered) */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">About me</span>
              {displayProfile.bio ? (
                <p className="text-xs text-neutral-200 leading-relaxed break-words whitespace-pre-wrap select-text">
                  {displayProfile.bio}
                </p>
              ) : isOwnMode ? (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs text-neutral-500 hover:text-red-400 transition-colors font-mono cursor-pointer"
                >
                  + Add a bio to share your exam goals
                </button>
              ) : (
                <p className="text-xs text-neutral-500 font-mono">No bio provided yet.</p>
              )}
            </div>

            {/* Member info & Crew */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 space-y-1">
                <span className="text-[11px] text-neutral-400 block font-mono">Member since</span>
                <span className="text-xs font-semibold text-neutral-100">{memberSinceFormatted}</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 space-y-1">
                <span className="text-[11px] text-neutral-400 block font-mono">Crew affiliation</span>
                <span className="text-xs font-semibold text-neutral-100">
                  {displayProfile.crewName ? displayProfile.crewName : 'Independent Scholar'}
                </span>
              </div>
            </div>

            {/* Showcase: Up to 3 pinned stamps or badges */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 block">Showcase</span>
                {isOwnMode && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('badges')}
                    className="text-[11px] text-red-400 hover:underline font-mono cursor-pointer"
                  >
                    Manage pins
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {stamps
                  .filter((s) => s.isEarned)
                  .slice(0, 3)
                  .map((stamp) => (
                    <div
                      key={stamp.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-center space-y-1"
                    >
                      <div className="text-xl">{stamp.icon}</div>
                      <div className="text-[11px] font-bold text-neutral-200 truncate">
                        {stamp.title}
                      </div>
                      <div className="text-[9px] text-neutral-500 truncate">{stamp.desc}</div>
                    </div>
                  ))}
                {stamps.filter((s) => s.isEarned).length === 0 && (
                  <div className="col-span-3 py-6 text-center text-xs text-neutral-500 font-mono">
                    No pinned stamps yet.
                  </div>
                )}
              </div>
            </div>

            {/* ── PRIVATE STUDY STATS (OWN MODE ONLY: NEVER RENDERED IN PUBLIC MODE) ── */}
            {isOwnMode && (
              <div className="space-y-4 pt-4 border-t border-neutral-850">
                <span className="text-xs font-semibold text-neutral-300 block">
                  Private Study Metrics
                </span>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono block">Current Streak</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1">
                      <Flame size={14} className="text-amber-400" />
                      <span>{ownUserProfile?.streak || 0}d</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono block">Longest Streak</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1">
                      <Flame size={14} className="text-red-400" />
                      <span>{ownUserProfile?.longestStreak || ownUserProfile?.streak || 0}d</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono block">MCQs Solved</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1">
                      <Target size={14} className="text-blue-400" />
                      <span>{ownUserProfile?.totalQuestionsSolved || 0}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono block">Accuracy</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1">
                      <Award size={14} className="text-emerald-400" />
                      <span>{ownUserProfile?.accuracy || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* 12-Week Study Heatmap */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300 block">
                      12-Week Study Activity Heatmap
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Last 84 days</span>
                  </div>

                  <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1 pt-2">
                    {Array.from({ length: 84 }).map((_, idx) => {
                      const pseudoIntensity = (idx * 7 + (ownUserProfile?.streak || 0)) % 5;
                      const shades = [
                        'bg-neutral-850',
                        'bg-red-950/60',
                        'bg-red-900/80',
                        'bg-red-600',
                        'bg-red-500',
                      ];
                      return (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-[2px] ${shades[pseudoIntensity]}`}
                          title={`Day ${84 - idx}: ${pseudoIntensity * 8} questions solved`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Subject Accuracy Rings */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <span className="text-xs font-semibold text-neutral-300 block">
                    Subject Performance Rings
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { subject: 'Biology', pct: 82, color: '#10B981' },
                      { subject: 'Chemistry', pct: 74, color: '#3B82F6' },
                      { subject: 'Physics', pct: 68, color: '#F59E0B' },
                      { subject: 'English', pct: 90, color: '#8B5CF6' },
                    ].map((s) => (
                      <div
                        key={s.subject}
                        className="flex flex-col items-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5"
                      >
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            className="text-neutral-800 fill-none"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke={s.color}
                            strokeWidth="3.5"
                            strokeDasharray={113}
                            strokeDashoffset={113 - (113 * s.pct) / 100}
                            strokeLinecap="round"
                            className="fill-none transition-all duration-1000"
                          />
                          <text
                            x="24"
                            y="27"
                            className="text-[9px] font-mono font-bold fill-white"
                            textAnchor="middle"
                          >
                            {s.pct}%
                          </text>
                        </svg>
                        <span className="text-[11px] font-semibold text-neutral-300">
                          {s.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kobans Balance Card */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="text-amber-400" size={18} />
                      <span className="text-xs font-semibold text-neutral-200">
                        Kobans Treasury
                      </span>
                    </div>
                    <Link to="/kobans" className="text-xs font-mono text-red-400 hover:underline">
                      Ledger history
                    </Link>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <div>
                      <div className="text-lg font-bold text-white font-mono">
                        {kobanBalance || 0} Kobans
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Earn by completing daily tests & streaks
                      </div>
                    </div>
                    <Link
                      to="/kobans"
                      className="min-h-[40px] px-3.5 rounded-lg border border-red-700 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      Get Kobans
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB (FILTERS: ALL, NOTES, DOUBT, DISCUSSION) ── */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {/* Filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'notes', label: 'Notes' },
                { key: 'doubt', label: 'Doubt' },
                { key: 'discussion', label: 'Discussion' },
              ].map(({ key, label }) => {
                const isSelected = postCategoryFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPostCategoryFilter(key as any)}
                    className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-600/20 text-white shadow-sm'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {isLoadingPosts ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-neutral-900/60 border border-neutral-800 animate-pulse" />
                ))}
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 font-mono space-y-3">
                <p>No posts yet</p>
                {isOwnMode && (
                  <Link
                    to="/dashboard/commons"
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-950/40 transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Create a post</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedPosts.map((post) => (
                  <CommonsPostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.uid}
                    isAdmin={isAdmin}
                    onOpenComments={() => navigate(`/dashboard/commons?post=${post.id}`)}
                    onOpenReport={() => {}}
                    onDeletePost={isOwnMode || isAdmin ? handleDeletePost : undefined}
                    onAuthorClick={(authorUid) => onOpenUserProfile?.(authorUid)}
                    onToggleAnonymity={isOwnMode ? handleToggleAnonymity : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOADOUT TAB (RARITY TAGS & STORE LINKS) ── */}
        {activeTab === 'loadout' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 block">Equipped loadout</span>
              {isOwnMode ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEffectPlayKey(Date.now())}
                    className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Replay effect</span>
                  </button>
                  <Link
                    to="/store"
                    className="text-xs text-red-400 hover:underline font-mono flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    <span>Equip in Store</span>
                  </Link>
                </div>
              ) : (
                <Link
                  to="/store"
                  className="text-xs text-red-400 hover:underline font-mono flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  <span>Get this look</span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'effect' as CosmeticType, label: 'Profile Effect', id: equippedEffectId },
                { type: 'banner' as CosmeticType, label: 'Profile Banner', id: equippedBannerId },
                { type: 'avatar' as CosmeticType, label: 'Profile Picture', id: equippedAvatarId },
                { type: 'frame' as CosmeticType, label: 'Avatar Frame', id: equippedFrameId },
                { type: 'nameplate' as CosmeticType, label: 'Nameplate', id: equippedNameplateId },
              ].map((cos) => {
                const item = cos.id && cos.id !== 'none' ? getCosmeticById(cos.id) : null;
                const rarity = item?.rarity || 'Default';
                const rarityBadgeStyles: Record<string, string> = {
                  Default: 'border-neutral-750 bg-neutral-800 text-neutral-400',
                  Common: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
                  Rare: 'border-blue-700/80 bg-blue-950/60 text-blue-400',
                  Epic: 'border-purple-700/80 bg-purple-950/60 text-purple-300',
                  Legendary: 'border-amber-700/80 bg-amber-950/60 text-amber-300',
                };

                return (
                  <div
                    key={cos.type}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                          {cos.label}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold border ${
                            rarityBadgeStyles[rarity] || rarityBadgeStyles.Default
                          }`}
                        >
                          {rarity}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-neutral-200 truncate block">
                        {item ? item.name : 'Default'}
                      </span>
                    </div>

                    {isOwnMode ? (
                      <Link
                        to={`/store?tab=my_items&type=${cos.type}`}
                        className="min-h-[36px] px-3 rounded-lg border border-neutral-800 bg-neutral-800/80 hover:bg-neutral-800 text-xs font-semibold text-red-400 transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                      >
                        Equip in Store
                      </Link>
                    ) : (
                      <Link
                        to={`/store?item=${item?.id || ''}`}
                        className="min-h-[36px] px-3 rounded-lg border border-red-800/60 bg-red-950/40 hover:bg-red-900/50 text-xs font-semibold text-red-300 transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                      >
                        Get this look
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BADGES TAB (GRID OF ALL EARNED & LOCKED BADGES WITH HINTS) ── */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Rank Badges */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">Rank Ladder Badges</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RANK_TIERS.map((tier) => {
                  const currentSolved = ownUserProfile?.totalQuestionsSolved || displayProfile.stats.mcqs || 0;
                  const isEarned = currentSolved >= tier.minMcqs;
                  return (
                    <div
                      key={tier.rankTitle}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isEarned
                          ? 'border-neutral-700 bg-neutral-900/70 shadow-sm'
                          : 'border-neutral-850 bg-neutral-950/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                            style={{
                              backgroundColor: `${tier.color}15`,
                              borderColor: `${tier.color}40`,
                              color: tier.color,
                            }}
                          >
                            {isEarned ? <Award size={20} /> : <Lock size={16} className="text-neutral-500" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-neutral-100">{tier.rankTitle}</span>
                              {isEarned ? (
                                <span className="text-[10px] text-emerald-400 font-mono">Earned</span>
                              ) : (
                                <span className="text-[10px] text-neutral-500 font-mono">Locked</span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 leading-snug">
                              {isEarned
                                ? `Unlocked at ${tier.minMcqs} MCQs milestone`
                                : `Solve ${tier.minMcqs} MCQs to unlock`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passport Stamps */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">Passport Stamps</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      stamp.isEarned
                        ? 'border-neutral-700 bg-neutral-900/70 shadow-sm'
                        : 'border-neutral-850 bg-neutral-950/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-xl shrink-0">
                          {stamp.isEarned ? stamp.icon : <Lock size={16} className="text-neutral-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-100">{stamp.title}</span>
                            <span className={`text-[10px] font-mono ${stamp.isEarned ? 'text-emerald-400' : 'text-neutral-500'}`}>
                              {stamp.isEarned ? 'Earned' : 'Locked'}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 leading-snug">
                            {stamp.isEarned ? stamp.desc : stamp.hint}
                          </div>
                        </div>
                      </div>

                      {isOwnMode && stamp.isEarned && (
                        <button
                          type="button"
                          onClick={() => handleTogglePinStamp(stamp.id)}
                          className="text-[10px] font-mono text-red-400 hover:underline shrink-0 cursor-pointer"
                        >
                          {publicProfile?.pinnedStamps?.includes(stamp.id) ? 'Pinned' : 'Pin'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anime Streak Badges Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 block">
                  Streak Badges {isOwnMode && '(Equip up to 3)'}
                </span>
                {isOwnMode && (
                  <span className="text-[11px] font-mono text-neutral-500">
                    {equippedBadgesList.length}/3 equipped
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ANIME_STREAK_BADGES.map((badge) => {
                  const currentStreak = ownUserProfile?.streak || displayProfile.stats.streak || 0;
                  const isEarned = currentStreak >= badge.days || displayProfile.badges.includes(badge.id);
                  const isEquipped = equippedBadgesList.includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isEquipped
                          ? 'border-red-600 bg-red-950/20'
                          : isEarned
                          ? 'border-neutral-800 bg-neutral-900/40'
                          : 'border-neutral-850 bg-neutral-950/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 border"
                          style={{
                            backgroundColor: `${badge.accentColor}20`,
                            borderColor: `${badge.accentColor}50`,
                          }}
                        >
                          {isEarned ? (
                            <Flame size={16} style={{ color: badge.accentColor }} />
                          ) : (
                            <Lock size={14} className="text-neutral-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-100">{badge.name}</span>
                            <span className={`text-[10px] font-mono ${isEarned ? 'text-emerald-400' : 'text-neutral-500'}`}>
                              {isEarned ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {isEarned ? `${badge.rewardTitle}` : `Reach a ${badge.days}-day streak to unlock`}
                          </div>
                        </div>
                      </div>

                      {isOwnMode && isEarned && (
                        <button
                          type="button"
                          onClick={() => handleToggleEquipStreakBadge(badge.id)}
                          className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isEquipped
                              ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-red-600'
                              : 'border-red-600 bg-red-600 text-white hover:bg-red-500'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB (OWN MODE ONLY: EDIT BIO, STATUS, TARGET, SOCIALS, DANGER ZONE) ── */}
        {activeTab === 'settings' && isOwnMode && (
          <div className="space-y-6">
            {/* Quick Edit Bio & Appearance */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 block">Identity & Appearance</span>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Open Full Editor</span>
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Customize your public display name, accent tint, 40-character status, and 160-character academic bio.
              </p>
            </div>

            {/* Target University & Score Form */}
            <form onSubmit={handleSaveSettings} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
              <span className="text-xs font-semibold text-neutral-300 block">Study Target & Social Links</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-mono block">Target University</label>
                  <input
                    type="text"
                    value={targetUniInput}
                    onChange={(e) => setTargetUniInput(e.target.value)}
                    placeholder="e.g. NUST, FAST, King Edward, GIKI"
                    className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-mono block">Target Score (Aggregate % or Marks)</label>
                  <input
                    type="number"
                    value={targetScoreInput}
                    onChange={(e) => setTargetScoreInput(e.target.value)}
                    placeholder="e.g. 185"
                    className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Social links (Plain text handles/usernames, never active hyperlinks for peer safety) */}
              <div className="space-y-2 pt-2 border-t border-neutral-850">
                <span className="text-[11px] font-mono text-neutral-400 block">Social Links (Plain text user IDs)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={discordInput}
                    onChange={(e) => setDiscordInput(e.target.value)}
                    placeholder="Discord username"
                    className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                  />
                  <input
                    type="text"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder="GitHub handle"
                    className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                  />
                  <input
                    type="text"
                    value={twitterInput}
                    onChange={(e) => setTwitterInput(e.target.value)}
                    placeholder="Twitter/X handle"
                    className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {settingsSaved ? (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Saved changes
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="min-h-[38px] px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Study Preferences
                </button>
              </div>
            </form>

            {/* Target Exam Details with Countdown */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 block">Target Exam Schedule</span>
                <Link to="/onboarding" className="text-xs font-mono text-red-400 hover:underline">
                  Change exam track
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white font-mono">
                    {targetExam || 'MDCAT / Engineering Prep'}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Test date: {testDate || 'July 2026'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400 font-mono">
                    {daysLeft !== null ? daysLeft : 45}d
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">remaining</div>
                </div>
              </div>
            </div>

            {/* Danger Zone: Reset Account Data & Sign Out */}
            <div className="rounded-xl border border-red-950/80 bg-red-950/20 p-4 space-y-3">
              <span className="text-xs font-bold text-red-400 block font-mono">Danger Zone</span>
              <p className="text-xs text-neutral-400">
                Actions here permanently reset diagnostic test statistics or disconnect your device session.
              </p>

              {resetSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <Check size={14} /> Practice test history and streak counters reset successfully.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="min-h-[42px] px-3.5 rounded-lg border border-red-800/80 bg-neutral-950 hover:bg-red-950/40 text-xs font-semibold text-red-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Reset Study Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="min-h-[42px] px-3.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOLLOWERS / FOLLOWING MODAL ── */}
      <ProfileFollowModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        targetUid={resolvedUid}
        initialTab={followModalInitialTab}
        currentUserId={user?.uid}
        onOpenUserProfile={(uid) => {
          setFollowModalOpen(false);
          onOpenUserProfile?.(uid);
        }}
      />

      {/* ── EDIT PROFILE MODAL (OWN ONLY) ── */}
      {isOwnMode && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          publicProfile={displayProfile}
          userProfile={ownUserProfile}
          onSave={handleSaveProfileEdits}
        />
      )}

      {/* ── SHARE CARD MODAL (PUBLIC & OWN) ── */}
      <ProfileShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        profile={displayProfile}
      />

      {/* ── UNFOLLOW CONFIRMATION MODAL ── */}
      {unfollowConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-neutral-800 bg-[#0e0e11] p-5 shadow-2xl text-center space-y-4">
            <h4 className="text-sm font-bold text-neutral-100 font-mono">
              Unfollow @{displayProfile.displayName}?
            </h4>
            <p className="text-xs text-neutral-400">
              Their study updates and shared materials will no longer appear on your Following feed.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnfollowConfirmOpen(false)}
                className="min-h-[44px] rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnfollow}
                className="min-h-[44px] rounded-lg border border-red-800/80 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET STUDY DATA CONFIRMATION MODAL ── */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0e0e11] p-5 shadow-2xl text-center space-y-3">
            <h4 className="text-sm font-bold text-red-400 font-mono">
              Reset Study Practice Data?
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will reset your question solve counts, streak days, and test completion records. Owned store cosmetics will remain in your wallet.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="min-h-[42px] rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAccountData}
                className="min-h-[42px] rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIMITED CREW DETAIL MODAL (FOR NON-MEMBERS) ── */}
      {crewModalOpen && displayProfile.crewName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0e0e11] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-neutral-100 font-mono">Crew Affiliation</h4>
              <button
                type="button"
                onClick={() => setCrewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <div className="text-base font-bold text-white font-mono">{displayProfile.crewName}</div>
              <div className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                <Users size={14} />
                <span>Campus Peer Study Unit</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Crew details are restricted to verified batch members and captains.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ── CONTAINER STRUCTURE (EMBEDDED vs MODAL) ──
  // If embedded (/dashboard/profile): centered column max-width 960px
  if (isEmbedded) {
    return (
      <div className="w-full max-w-[960px] mx-auto bg-[#0a0a0d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Profile effect confined to embedded card */}
        {equippedEffectId && effectVisible && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
            <CosmeticErrorBoundary fallback={null}>
              <ProfileCardEffect
                key={`embedded-${effectPlayKey}`}
                itemId={equippedEffectId}
                mode="dialog"
                accentColor={displayProfile.accent}
                intensity="high"
              />
            </CosmeticErrorBoundary>
          </div>
        )}
        {renderProfileContent()}
      </div>
    );
  }

  // If modal (!isEmbedded):
  // - Mobile: full-screen view with a close button (X) at top-left on a small dark circle. Back button closes it (history state). The effect plays over the whole screen.
  // - Desktop: centered dialog (max-width 560px, own scrolling), effect confined to the dialog.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      {/* Mobile whole-screen effect */}
      {equippedEffectId && effectVisible && (
        <div className="md:hidden fixed inset-0 pointer-events-none z-30 overflow-hidden">
          <CosmeticErrorBoundary fallback={null}>
            <ProfileCardEffect
              key={`mobile-${effectPlayKey}`}
              itemId={equippedEffectId}
              mode="dialog"
              accentColor={displayProfile.accent}
              intensity="high"
            />
          </CosmeticErrorBoundary>
        </div>
      )}

      {/* Dialog container */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[560px] bg-[#0a0a0d] border-0 md:border md:border-neutral-800 md:rounded-2xl shadow-2xl overflow-y-auto min-h-screen md:min-h-0">
        {/* Desktop effect confined to dialog */}
        {equippedEffectId && effectVisible && (
          <div className="hidden md:block absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
            <CosmeticErrorBoundary fallback={null}>
              <ProfileCardEffect
                key={`desktop-${effectPlayKey}`}
                itemId={equippedEffectId}
                mode="dialog"
                accentColor={displayProfile.accent}
                intensity="high"
              />
            </CosmeticErrorBoundary>
          </div>
        )}

        {/* Top-left close button (X) on a small dark circle */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="fixed top-4 left-4 md:absolute md:top-3 md:left-3 z-40 w-8 h-8 rounded-full bg-black/85 border border-neutral-700/80 flex items-center justify-center text-white backdrop-blur-md hover:bg-neutral-800 transition-colors shadow-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {renderProfileContent()}
      </div>
    </div>
  );
};
