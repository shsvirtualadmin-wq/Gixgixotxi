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
  ArrowLeft,
  Settings,
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

  // Robust date parser supporting Firestore Timestamp, ISO string, milliseconds, seconds, and object formats
  const parseDateSafely = (val: unknown): Date | null => {
    if (!val) return null;
    if (typeof (val as any)?.toDate === 'function') {
      try {
        const d = (val as any).toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {
        return null;
      }
    }
    if (typeof val === 'number' && !isNaN(val)) {
      const ms = val < 10000000000 ? val * 1000 : val;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof val === 'string' && val.trim().length > 0) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof val === 'object' && val !== null) {
      const secs = (val as any).seconds ?? (val as any)._seconds;
      if (typeof secs === 'number' && !isNaN(secs)) {
        const d = new Date(secs * 1000);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  };

  // Formatted Member Since (properly parsed with fallback to "Joined recently")
  const memberSinceFormatted = useMemo(() => {
    const raw =
      publicProfile?.memberSince ||
      ownUserProfile?.createdAt ||
      user?.metadata?.creationTime;

    if (!raw) return 'Joined recently';
    const parsed = parseDateSafely(raw);
    if (!parsed) return 'Joined recently';

    try {
      const str = parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return str && str !== 'Invalid Date' ? str : 'Joined recently';
    } catch {
      return 'Joined recently';
    }
  }, [publicProfile?.memberSince, ownUserProfile?.createdAt, user?.metadata]);

  // Student Level calculation (e.g. Lv 24)
  const studentLevel = useMemo(() => {
    if (typeof (publicProfile as any)?.level === 'number' && (publicProfile as any).level > 0) {
      return (publicProfile as any).level;
    }
    if (typeof (ownUserProfile as any)?.level === 'number' && (ownUserProfile as any).level > 0) {
      return (ownUserProfile as any).level;
    }
    const solved = ownUserProfile?.totalQuestionsSolved || publicProfile?.stats?.mcqs || 0;
    return Math.max(1, Math.floor(solved / 15) + 1);
  }, [publicProfile, ownUserProfile]);

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

  // ── EARNED BADGES COLLECTION (28px each, 8px gaps, max 4 + "+N" chip) ──
  interface EarnedBadgeItem {
    id: string;
    name: string;
    desc: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }

  const allEarnedBadges = useMemo<EarnedBadgeItem[]>(() => {
    const list: EarnedBadgeItem[] = [];

    // 1. Pro Member
    if (effectivePlan.isUnlimited || displayProfile.role === 'captain') {
      list.push({
        id: 'pro',
        name: 'Pro Member',
        desc: 'Unlimited diagnostic test runs and AI tutoring.',
        icon: <Crown size={15} />,
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/50',
      });
    }

    // 2. Captain
    if (displayProfile.role === 'captain' || ownUserProfile?.isCaptain) {
      list.push({
        id: 'captain',
        name: 'Nakama Captain',
        desc: 'Official campus leader guiding students through exam prep.',
        icon: <Award size={15} />,
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-500/15',
        borderClass: 'border-blue-500/50',
      });
    }

    // 3. Crew
    if (displayProfile.crewName) {
      list.push({
        id: 'crew',
        name: `Crew: ${displayProfile.crewName}`,
        desc: `Active member of the ${displayProfile.crewName} campus study crew.`,
        icon: <Users size={15} />,
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/15',
        borderClass: 'border-emerald-500/50',
      });
    }

    // 4. Staff / Admin
    if (isAdmin || displayProfile.role === 'superadmin') {
      list.push({
        id: 'staff',
        name: 'Boardly Staff',
        desc: 'Platform administrator and verified faculty engineer.',
        icon: <Shield size={15} />,
        colorClass: 'text-[#D71921]',
        bgClass: 'bg-red-500/15',
        borderClass: 'border-red-500/50',
      });
    }

    // 5. Anime streak badges (equipped or unlocked)
    const streakDays = ownUserProfile?.streak || publicProfile?.stats?.streak || 0;
    const redeemed = ownUserProfile?.redeemedBadges || [];

    for (const badge of ANIME_STREAK_BADGES) {
      const isUnlocked = streakDays >= badge.days || redeemed.includes(badge.id) || equippedBadgesList.includes(badge.id);
      if (isUnlocked) {
        list.push({
          id: badge.id,
          name: badge.name,
          desc: `${badge.days}-day streak unlock: ${badge.rewardTitle}.`,
          icon: <Flame size={15} />,
          colorClass: 'text-red-400',
          bgClass: 'bg-red-950/40',
          borderClass: 'border-red-700/50',
        });
      }
    }

    return list;
  }, [
    effectivePlan.isUnlimited,
    displayProfile.role,
    displayProfile.crewName,
    ownUserProfile?.isCaptain,
    ownUserProfile?.streak,
    ownUserProfile?.redeemedBadges,
    publicProfile?.stats?.streak,
    isAdmin,
    equippedBadgesList,
  ]);

  const visibleBadges = allEarnedBadges.slice(0, 4);
  const remainingBadgesCount = Math.max(0, allEarnedBadges.length - 4);

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
    <div className="w-full relative bg-[#0a0a0d] overflow-x-hidden select-none pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      {/* ── 0. STICKY TOP BAR (Back arrow, "Profile" title, Settings/Share icon) ── */}
      <div className="sticky top-0 z-40 w-full bg-[#0a0a0d]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-2 flex items-center justify-between min-h-[48px]">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else navigate(-1);
          }}
          className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="font-heading font-bold text-sm sm:text-base text-white tracking-wide">
          Profile
        </h1>

        {isOwnMode ? (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#D71921] bg-red-950/40'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
            aria-label="Open settings"
            title="Profile Settings"
          >
            <Settings size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors cursor-pointer"
            aria-label="Share profile"
            title="Share Profile"
          >
            <Share2 size={18} />
          </button>
        )}
      </div>

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

      {/* ── 1. COVER BANNER (Height: 120px mobile, 160px sm+) ── */}
      <div className="relative w-full h-[120px] sm:h-[160px] overflow-hidden bg-neutral-950">
        <CosmeticErrorBoundary fallback={<div className="w-full h-full bg-neutral-900" />}>
          <BannerRenderer
            bannerId={equippedBannerId}
            accentColor={displayProfile.accent}
            animated={false}
            className="w-full h-full object-cover"
          />
        </CosmeticErrorBoundary>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0d] to-transparent pointer-events-none" />
      </div>

      {/* ── 2. AVATAR, NAME ROW, LEVEL, BADGES & FOLLOWERS ── */}
      <div className="px-4 sm:px-6 pb-2">
        {/* Main Header Row: Avatar on left, info on right with >= 16px gap */}
        <div className="flex items-start gap-4 -mt-8">
          {/* Avatar: 84px with circular ring & red glow; overlaps cover banner by only 38% (-mt-8) */}
          <div className="relative w-[84px] h-[84px] shrink-0 rounded-full ring-2 ring-[#D71921] shadow-[0_0_16px_rgba(215,25,33,0.45)] bg-neutral-900 overflow-visible z-20">
            <CosmeticErrorBoundary
              fallback={
                <div className="w-full h-full rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg font-bold text-neutral-300">
                  {displayProfile.displayName.charAt(0).toUpperCase()}
                </div>
              }
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                <AvatarFrame
                  itemId={equippedFrameId || 'none'}
                  size={84}
                  className="w-full h-full"
                  forceStatic
                >
                  <AvatarPicture
                    itemId={equippedAvatarId || 'none'}
                    size={84}
                    photoURL={displayProfile.photoURL || user?.photoURL}
                    className="w-full h-full object-cover"
                  />
                </AvatarFrame>
              </div>
            </CosmeticErrorBoundary>

            {/* Level Badge: pinned small pill at bottom-right on higher z-index, never clipped */}
            <div className="absolute -bottom-1 -right-1 z-30 px-2 py-0.5 rounded-full bg-[#D71921] border border-neutral-950 text-white font-mono font-bold text-[10px] tracking-wider shadow-md select-none flex items-center justify-center">
              Lv {studentLevel}
            </div>
          </div>

          {/* Right Column: Name, Rank, ID on same row; Badges row underneath; Followers below badges */}
          <div className="min-w-0 flex-1 pt-2 space-y-1.5">
            {/* Row 1: Name, Rank, ID */}
            <div className="flex items-center gap-2 flex-wrap">
              <CosmeticErrorBoundary
                fallback={
                  <span className="font-heading font-bold text-base text-white truncate max-w-[140px] sm:max-w-xs">
                    {displayProfile.displayName}
                  </span>
                }
              >
                <Nameplate
                  itemId={equippedNameplateId || 'none'}
                  name={displayProfile.displayName}
                  forceStatic
                  className="font-heading font-bold text-base text-white truncate max-w-[140px] sm:max-w-xs"
                />
              </CosmeticErrorBoundary>

              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0">
                #{displayProfile.studentId}
              </span>

              <span className="text-[11px] font-mono font-semibold text-neutral-400 shrink-0">
                {displayProfile.rankTitle || 'Fresher'}
              </span>

              {!isOwnMode && isFollowerOfMe && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase bg-red-950/60 border border-red-800/70 text-red-300 shrink-0">
                  Follows you
                </span>
              )}
            </div>

            {/* Row 2: Badges row (28px each with 8px gaps, max 4 + "+N" chip) */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {visibleBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() =>
                    setActiveBadgeTooltip({
                      id: badge.id,
                      name: badge.name,
                      desc: badge.desc,
                    })
                  }
                  className={`w-7 h-7 rounded-lg border ${badge.borderClass} ${badge.bgClass} flex items-center justify-center ${badge.colorClass} hover:scale-110 transition-transform cursor-pointer shrink-0`}
                  title={badge.name}
                >
                  {badge.icon}
                </button>
              ))}

              {remainingBadgesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('badges')}
                  className="h-7 px-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono font-semibold text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="View all badges"
                >
                  +{remainingBadgesCount}
                </button>
              )}

              {allEarnedBadges.length === 0 && (
                <span className="text-[11px] text-neutral-500 font-mono">No badges yet</span>
              )}
            </div>

            {/* Row 3: Followers / Following on one line below badges */}
            <div className="flex items-center gap-2 pt-0.5 text-xs text-neutral-400 font-mono">
              <button
                type="button"
                onClick={() => {
                  setFollowModalInitialTab('followers');
                  setFollowModalOpen(true);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <strong className="text-white font-bold">{followersCount}</strong> followers
              </button>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <button
                type="button"
                onClick={() => {
                  setFollowModalInitialTab('following');
                  setFollowModalOpen(true);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <strong className="text-white font-bold">{followingCount}</strong> following
              </button>
            </div>
          </div>
        </div>

        {/* Active Badge Tooltip popover */}
        {activeBadgeTooltip && (
          <div className="mt-3 p-3 rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-xl text-xs backdrop-blur-md max-w-xs space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-neutral-100 font-mono">
                {activeBadgeTooltip.name}
              </span>
              <button
                type="button"
                onClick={() => setActiveBadgeTooltip(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-neutral-300 leading-snug">
              {activeBadgeTooltip.desc}
            </p>
          </div>
        )}

        {/* ── 3. ACTION BUTTONS ROW ── */}
        {isOwnMode ? (
          <div className="space-y-2 pt-3">
            {/* Full-width row: "Edit Profile" and "Boardly Store" */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#D71921] hover:bg-red-600 text-white text-xs font-semibold font-heading flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-950/40 cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
              <Link
                to="/store"
                className="min-h-[44px] px-3.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold font-heading flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles size={15} className="text-amber-400" />
                <span>Boardly Store</span>
              </Link>
            </div>

            {/* Secondary row: "View as others" secondary button + Kobans balance compact pill */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setViewAsOthers(true)}
                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View as others see your profile"
              >
                <Eye size={14} className="text-neutral-400" />
                <span>View as others</span>
              </button>

              <Link
                to="/kobans"
                className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 hover:border-amber-500/50 flex items-center gap-1.5 font-mono text-xs text-amber-400 transition-colors shrink-0"
                title="View Kobans wallet"
              >
                <Coins size={14} />
                <span className="font-bold text-white">{kobanBalance || 0}</span>
                <span className="text-[11px] text-neutral-400">Kobans</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-3">
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={amIFollowing ? () => setUnfollowConfirmOpen(true) : handleFollowAction}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  amIFollowing
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-red-600 hover:text-red-400'
                    : 'border-red-600 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
                }`}
              >
                {amIFollowing ? (
                  <>
                    <Check size={15} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Follow</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="min-h-[44px] px-3.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Share2 size={15} />
                <span>Share Profile</span>
              </button>
            </div>

            {displayProfile.crewName && (
              <button
                type="button"
                onClick={() => setCrewModalOpen(true)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={15} />
                <span>View Crew ({displayProfile.crewName})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. STICKY TABS (Underline style with red active indicator) ── */}
      <div className="sticky top-[48px] z-30 bg-[#0a0a0d]/95 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6">
        <nav className="flex items-center gap-5 overflow-x-auto no-scrollbar">
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
                  className={`min-h-[44px] py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center ${
                    isActive
                      ? 'border-[#D71921] text-white'
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

      {/* ── 5. TAB CONTENTS ── */}
      <div className="p-4 sm:p-6 space-y-3">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* About me card with "Add bio" button */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 font-heading">About me</span>
                {isOwnMode && displayProfile.bio && (
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="text-[11px] text-neutral-400 hover:text-[#D71921] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              {displayProfile.bio ? (
                <p className="text-xs text-neutral-200 leading-relaxed break-words whitespace-pre-wrap select-text">
                  {displayProfile.bio}
                </p>
              ) : isOwnMode ? (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="w-full min-h-[44px] py-2.5 px-3 rounded-lg border border-dashed border-neutral-700/80 hover:border-red-600/70 text-xs text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Edit3 size={14} className="text-[#D71921]" />
                  <span>+ Add bio to share your exam goals</span>
                </button>
              ) : (
                <p className="text-xs text-neutral-500 font-mono">No bio provided yet.</p>
              )}
            </div>

            {/* Merged Member info & Crew affiliation (one row of two small stat chips) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Calendar size={13} />
                  <span className="text-[10px] font-mono uppercase tracking-wider">Member since</span>
                </div>
                <span className="text-xs font-semibold text-neutral-100 block truncate">
                  {memberSinceFormatted}
                </span>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Users size={13} />
                  <span className="text-[10px] font-mono uppercase tracking-wider">Crew</span>
                </div>
                <span className="text-xs font-semibold text-neutral-100 block truncate">
                  {displayProfile.crewName ? displayProfile.crewName : 'Independent Scholar'}
                </span>
              </div>
            </div>

            {/* Showcase: pin cards in a 2-column grid with a "Manage pins" link */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 font-heading">Showcase</span>
                {isOwnMode && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('badges')}
                    className="text-[11px] text-[#D71921] hover:underline font-mono cursor-pointer"
                  >
                    Manage pins
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stamps
                  .filter((s) => s.isEarned)
                  .slice(0, 4)
                  .map((stamp) => (
                    <div
                      key={stamp.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-center space-y-1.5"
                    >
                      <div className="text-2xl">{stamp.icon}</div>
                      <div className="text-xs font-bold text-neutral-200 truncate">
                        {stamp.title}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-clamp-1">{stamp.desc}</div>
                    </div>
                  ))}
                {stamps.filter((s) => s.isEarned).length === 0 && (
                  <div className="col-span-2 py-6 text-center text-xs text-neutral-500 font-mono">
                    No pinned stamps yet.
                  </div>
                )}
              </div>
            </div>

            {/* ── PRIVATE STUDY METRICS (2x2 STAT CARDS, OWN MODE ONLY) ── */}
            {isOwnMode && (
              <div className="space-y-3 pt-1">
                <span className="text-xs font-semibold text-neutral-300 block font-heading">
                  Private Study Metrics
                </span>

                {/* 2x2 Stat Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                    <span className="text-[10px] text-neutral-400 font-mono block">Current Streak</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                      <Flame size={15} className="text-amber-400" />
                      <span>{ownUserProfile?.streak || 0}d</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                    <span className="text-[10px] text-neutral-400 font-mono block">Longest Streak</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                      <Flame size={15} className="text-[#D71921]" />
                      <span>{ownUserProfile?.longestStreak || ownUserProfile?.streak || 0}d</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                    <span className="text-[10px] text-neutral-400 font-mono block">MCQs Solved</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                      <Target size={15} className="text-blue-400" />
                      <span>{ownUserProfile?.totalQuestionsSolved || 0}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-1">
                    <span className="text-[10px] text-neutral-400 font-mono block">Accuracy</span>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                      <Award size={15} className="text-emerald-400" />
                      <span>{ownUserProfile?.accuracy || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* 12-Week Study Activity Heatmap: uniform cell sizes in aligned grid with day/month legend */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300 font-heading">
                      12-Week Study Heatmap
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Last 84 days</span>
                  </div>

                  {/* Month legend */}
                  <div className="flex items-center justify-between pl-7 pr-1 text-[9px] font-mono text-neutral-500">
                    <span>Month -2</span>
                    <span>Month -1</span>
                    <span>Current</span>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    {/* Day labels legend */}
                    <div className="flex flex-col justify-between h-[100px] text-[9px] font-mono text-neutral-500 shrink-0 select-none py-0.5">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Sun</span>
                    </div>

                    {/* 12 columns x 7 rows grid with uniform square cells */}
                    <div className="grid grid-flow-col grid-rows-7 grid-cols-12 gap-1 sm:gap-1.5 flex-1 w-full">
                      {Array.from({ length: 84 }).map((_, idx) => {
                        const pseudoIntensity = (idx * 7 + (ownUserProfile?.streak || 0)) % 5;
                        const shades = [
                          'bg-neutral-800/80',
                          'bg-red-950/70 border border-red-900/40',
                          'bg-red-900/90',
                          'bg-red-600',
                          'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
                        ];
                        return (
                          <div
                            key={idx}
                            className={`w-full aspect-square rounded-[2px] transition-all hover:scale-125 ${shades[pseudoIntensity]}`}
                            title={`Day ${84 - idx}: ${pseudoIntensity * 8} questions solved`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Less / More Legend */}
                  <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-neutral-400 pt-1">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-neutral-800/80" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-red-950/70" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-red-900/90" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-red-600" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-red-500" />
                    <span>More</span>
                  </div>
                </div>

                {/* Subject Performance Rings: 2x2 grid with consistent sizing */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <span className="text-xs font-semibold text-neutral-300 font-heading block">
                    Subject Performance Rings
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { subject: 'Biology', pct: 82, color: '#10B981' },
                      { subject: 'Chemistry', pct: 74, color: '#3B82F6' },
                      { subject: 'Physics', pct: 68, color: '#F59E0B' },
                      { subject: 'Mathematics', pct: 90, color: '#EC4899' },
                    ].map((s) => (
                      <div
                        key={s.subject}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 h-[116px]"
                      >
                        <svg className="w-13 h-13 transform -rotate-90 shrink-0" viewBox="0 0 56 56">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-neutral-800 fill-none"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke={s.color}
                            strokeWidth="4"
                            strokeDasharray={138.2}
                            strokeDashoffset={138.2 - (138.2 * s.pct) / 100}
                            strokeLinecap="round"
                            className="fill-none transition-all duration-1000"
                          />
                          <text
                            x="28"
                            y="32"
                            className="text-[11px] font-mono font-bold fill-white"
                            textAnchor="middle"
                          >
                            {s.pct}%
                          </text>
                        </svg>
                        <span className="text-xs font-semibold text-neutral-200 font-heading truncate max-w-full">
                          {s.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kobans Treasury Card */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="text-amber-400" size={18} />
                      <span className="text-xs font-semibold text-neutral-200 font-heading">
                        Kobans Treasury
                      </span>
                    </div>
                    <Link to="/kobans" className="text-xs font-mono text-[#D71921] hover:underline">
                      Ledger history
                    </Link>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-white font-mono truncate">
                        {kobanBalance || 0} Kobans
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        Earn by solving MCQs &amp; maintaining streaks
                      </div>
                    </div>
                    <Link
                      to="/kobans"
                      className="min-h-[44px] px-4 rounded-xl bg-[#D71921] hover:bg-red-600 text-white text-xs font-semibold font-heading flex items-center justify-center shrink-0 shadow-md shadow-red-950/40 transition-colors cursor-pointer"
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
      <div className="w-full max-w-[960px] mx-auto bg-[#0a0a0d] border-0 sm:border sm:border-neutral-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden relative">
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
