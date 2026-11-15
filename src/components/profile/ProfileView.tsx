import React, { useEffect, useState, useRef } from 'react';
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
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Award,
  Flame,
  Shield,
  Target,
  Check,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  Crown,
  Share2,
  Ban,
  AlertTriangle,
  Copy,
  ShoppingBag,
  Settings,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { PublicProfile, EquippedCosmetics } from '@/types';
import {
  getPublicProfile,
  syncPublicProfile,
  syncProfileToD1Backend,
  broadcastPublicProfileUpdate,
} from '@/services/publicProfileService';
import { DirectMessageModal } from '@/components/chat/DirectMessageModal';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { ProfileCardEffect, Nameplate } from '@/components/koban/CosmeticRenderers';
import { ProBadge } from '@/components/ui/ProBadge';
import { resolveEffectivePlan } from '@/hooks/useEffectivePlan';
import {
  getCosmeticById,
  CosmeticRarity,
} from '@/data/cosmeticsCatalog';
import { useWallet } from '@/hooks/useWallet';
import { normalizeProBadgeDesign, type ProBadgeDesignId } from '@/lib/proBadgeDesigns';
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

interface EnrichedProfile extends PublicProfile {
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
  equippedCosmetics?: EquippedCosmetics & {
    profileBanner?: string | null;
    avatarFrame?: string | null;
    profileEffect?: string | null;
    title?: string | null;
  };
  followersCount?: number;
  followingCount?: number;
  isBanned?: boolean;
  proBadge?: ProBadgeDesignId | null;
}

const RARITY_STYLES: Record<
  CosmeticRarity,
  { badge: string; border: string; glow: string; text: string }
> = {
  common: {
    badge: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    border: 'border-white/15',
    glow: '',
    text: 'text-zinc-300',
  },
  rare: {
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    border: 'border-sky-500/40',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.18)]',
    text: 'text-sky-300',
  },
  epic: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.22)]',
    text: 'text-purple-300',
  },
  legendary: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/50',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.28)]',
    text: 'text-amber-300',
  },
  mythic: {
    badge: 'bg-[#D71921]/25 text-red-200 border-[#D71921]/60',
    border: 'border-[#D71921]/60',
    glow: 'shadow-[0_0_28px_rgba(215,25,33,0.35)]',
    text: 'text-red-200',
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

const SHORT_ID_MEMORY_CACHE = new Map<string, string>();

async function ensureUserShortId(uid: string, existingShortId?: string): Promise<string> {
  const cleanExisting = String(existingShortId || '').replace(/^#+/, '').trim();
  if (/^\d{5}$/.test(cleanExisting)) {
    SHORT_ID_MEMORY_CACHE.set(uid, cleanExisting);
    return cleanExisting;
  }
  const cached = SHORT_ID_MEMORY_CACHE.get(uid);
  if (cached && /^\d{5}$/.test(cached)) {
    return cached;
  }
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : null;
    const saved = String(data?.shortId || data?.studentId || '').replace(/^#+/, '').trim();
    if (/^\d{5}$/.test(saved)) {
      SHORT_ID_MEMORY_CACHE.set(uid, saved);
      return saved;
    }

    const pubRef = doc(db, 'publicProfiles', uid);
    const pubSnap = await getDoc(pubRef).catch(() => null);
    const pubData = pubSnap && pubSnap.exists() ? pubSnap.data() : null;
    const pubSaved = String(pubData?.studentId || pubData?.shortId || '')
      .replace(/^#+/, '')
      .trim();
    if (/^\d{5}$/.test(pubSaved)) {
      SHORT_ID_MEMORY_CACHE.set(uid, pubSaved);
      return pubSaved;
    }

    const fallbackId = deriveDeterministicShortId(uid);
    SHORT_ID_MEMORY_CACHE.set(uid, fallbackId);
    if (auth.currentUser?.uid === uid) {
      await setDoc(
        userRef,
        { shortId: fallbackId, studentId: fallbackId },
        { merge: true }
      ).catch(() => {});
      await setDoc(
        pubRef,
        { studentId: fallbackId, shortId: fallbackId },
        { merge: true }
      ).catch(() => {});
    }
    return fallbackId;
  } catch {
    const fallback = deriveDeterministicShortId(uid);
    SHORT_ID_MEMORY_CACHE.set(uid, fallback);
    return fallback;
  }
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
    authProfile,
    isAdmin,
    isGuest,
    refreshUserProfile,
    proBadgeDesign: myProBadgeDesign,
    proBadgeVisible: myProBadgeVisible,
  } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet();

  const uid = targetUid || propData?.uid || currentUser?.uid;
  const isOwnProfile =
    typeof propIsOwnProfile === 'boolean'
      ? propIsOwnProfile
      : Boolean(currentUser && uid === currentUser.uid);

  const [profile, setProfile] = useState<EnrichedProfile | null>(null);
  const [loading, setLoading] = useState(!previewMode);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  // Followers / Following Modal state
  const [followListModal, setFollowListModal] = useState<'followers' | 'following' | null>(
    null
  );
  const [followListUsers, setFollowListUsers] = useState<PublicProfile[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  // Direct Message Modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Share Toast
  const [copiedToast, setCopiedToast] = useState(false);

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editCustomRole, setEditCustomRole] = useState('Student');
  const [editAvatar, setEditAvatar] = useState('avatar-1');
  const [editFrame, setEditFrame] = useState<string>('none');
  const [editBanner, setEditBanner] = useState<string>('none');
  const [editEffect, setEditEffect] = useState<string>('none');
  const [editBadges, setEditBadges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load Profile Data
  useEffect(() => {
    if (previewMode && propData) {
      const candidateUid = String(propData.uid || uid || 'preview_user');
      const resolvedShortId =
        String(
          propData.shortId ||
            propData.studentId ||
            ownProfile?.shortId ||
            ownProfile?.studentId ||
            SHORT_ID_MEMORY_CACHE.get(candidateUid) ||
            deriveDeterministicShortId(candidateUid)
        )
          .replace(/^#+/, '')
          .trim();

      setProfile({
        uid: candidateUid,
        displayName: propData.displayName || propData.nickname || 'Student',
        username: propData.username || 'student',
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
      setLoading(false);
      return;
    }

    if (!uid) {
      setLoading(false);
      return;
    }
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        if (isGuest && isOwnProfile) {
          const activeGuestSource = (authProfile || ownProfile) as any;
          const guestDisplayName =
            activeGuestSource?.displayName ||
            activeGuestSource?.nickname ||
            activeGuestSource?.username ||
            'Guest Student';
          const guestUsername = (
            activeGuestSource?.username ||
            guestDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '')
          ).slice(0, 24);
          const guestShortId = String(
            activeGuestSource?.shortId ||
              activeGuestSource?.studentId ||
              deriveDeterministicShortId(uid)
          )
            .replace(/^#+/, '')
            .trim();

          if (!isMounted) return;
          const enrichedGuest: EnrichedProfile = {
            uid,
            displayName: guestDisplayName,
            username: guestUsername,
            role: 'student',
            customRole: activeGuestSource?.customRole || 'Student',
            equippedAvatar: activeGuestSource?.equippedAvatar || 'avatar-1',
            photoURL: activeGuestSource?.photoURL || '',
            equippedFrame: activeGuestSource?.equippedFrame || 'none',
            equippedBanner: activeGuestSource?.equippedBanner || 'none',
            equippedTitle: activeGuestSource?.equippedTitle || 'title-rookie',
            equippedBadges: activeGuestSource?.equippedBadges || ['first_login'],
            equippedCosmetics: activeGuestSource?.equippedCosmetics || {},
            bio: activeGuestSource?.bio || 'Exploring Boardly in Guest Mode.',
            status: activeGuestSource?.status || 'Studying in Guest Mode',
            shortId: guestShortId,
            studentId: guestShortId,
            followersCount: 0,
            followingCount: 0,
            isBanned: false,
            stats: {
              streakDays: activeGuestSource?.streakDays || 0,
              testsCompleted: 0,
              questionsAnswered: 0,
              accuracyRate: 0,
              xp: activeGuestSource?.xp || 0,
            },
          };
          setProfile(enrichedGuest);
          setEditNickname(enrichedGuest.displayName);
          setEditUsername(enrichedGuest.username || '');
          setEditBio(enrichedGuest.bio || '');
          setEditStatus(enrichedGuest.status || '');
          setEditCustomRole(enrichedGuest.customRole || 'Student');
          setEditAvatar(enrichedGuest.equippedAvatar);
          setEditFrame(enrichedGuest.equippedFrame || 'none');
          setEditBanner(enrichedGuest.equippedBanner || 'none');
          setEditEffect(enrichedGuest.equippedCosmetics?.profileEffect || 'none');
          setEditBadges(enrichedGuest.equippedBadges || ['first_login']);
          setLoading(false);
          return;
        }

        if (isOwnProfile && currentUser && ownProfile) {
          await syncPublicProfile(uid, {
            nickname:
              (authProfile as any)?.displayName ||
              ownProfile.nickname ||
              currentUser.displayName ||
              'Student',
            username: (authProfile as any)?.username || ownProfile.username,
            role: (authProfile as any)?.role || ownProfile.role,
            customRole: (authProfile as any)?.customRole || (ownProfile as any).customRole,
            equippedAvatar:
              (authProfile as any)?.avatar || ownProfile.equippedAvatar || 'avatar-1',
            photoURL: ownProfile.photoURL || currentUser.photoURL || '',
            equippedFrame: (authProfile as any)?.frame || ownProfile.equippedFrame,
            streak: ownProfile.streak,
            score: ownProfile.score,
            bio: (authProfile as any)?.bio ?? ownProfile.bio,
            status: (authProfile as any)?.status ?? ownProfile.status,
          }).catch(() => {});
        }

        let d1Live: any = null;
        try {
          const d1Res = await fetch(
            `/api/auth/resolve-profiles?uids=${encodeURIComponent(uid)}&_t=${Date.now()}`,
            { cache: 'no-store' }
          );
          const d1Json = await d1Res.json().catch(() => null);
          if (d1Res.ok && d1Json?.profiles?.[uid]) {
            d1Live = d1Json.profiles[uid];
          }
        } catch {
          // ignore
        }

        let pubData = await getPublicProfile(uid);
        let uData: any = null;
        try {
          const uSnap = await getDoc(doc(db, 'users', uid));
          if (uSnap.exists()) {
            uData = uSnap.data();
          }
        } catch {
          if (isOwnProfile && ownProfile) {
            uData = ownProfile;
          }
        }

        const shortId = await ensureUserShortId(
          uid,
          uData?.shortId || uData?.studentId || pubData?.studentId || pubData?.shortId
        );

        let fCount = uData?.followersCount || 0;
        let fgCount = uData?.followingCount || 0;
        try {
          const fQuery = query(
            collection(db, 'follows'),
            where('followingId', '==', uid),
            limit(500)
          );
          const fgQuery = query(
            collection(db, 'follows'),
            where('followerId', '==', uid),
            limit(500)
          );
          const [fSnap, fgSnap] = await Promise.all([getDocs(fQuery), getDocs(fgQuery)]);
          fCount = fSnap.size;
          fgCount = fgSnap.size;

          if (currentUser && !isOwnProfile && !isGuest) {
            const myFollowDoc = await getDoc(
              doc(db, 'follows', `${currentUser.uid}_${uid}`)
            );
            if (isMounted) setIsFollowing(myFollowDoc.exists());
          }
        } catch {
          // fallback to stored count
        }

        if (!isMounted) return;

        setFollowersCount(fCount);
        setFollowingCount(fgCount);

        const resolvedDisplayName =
          d1Live?.displayName ||
          (isOwnProfile ? (authProfile as any)?.displayName : undefined) ||
          pubData?.displayName ||
          uData?.nickname ||
          uData?.displayName ||
          'Student';
        const resolvedUsername =
          d1Live?.username ||
          (isOwnProfile ? (authProfile as any)?.username : undefined) ||
          pubData?.username ||
          uData?.username ||
          resolvedDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '');

        const rawEquippedCosmetics: EquippedCosmeticsMap = {
          ...(pubData?.equippedCosmetics || {}),
          ...(uData?.equippedCosmetics || {}),
        };

        const rawAvatarCandidate =
          d1Live?.avatar ||
          (isOwnProfile ? (authProfile as any)?.avatar : undefined) ||
          rawEquippedCosmetics.avatar ||
          uData?.equippedAvatar ||
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
          : pubData?.photoURL ||
            uData?.photoURL ||
            (isOwnProfile ? currentUser?.photoURL || '' : '');

        const resolvedFrame =
          d1Live?.frame ||
          (isOwnProfile ? (authProfile as any)?.frame : undefined) ||
          rawEquippedCosmetics.avatarFrame ||
          uData?.equippedFrame ||
          pubData?.equippedFrame ||
          'none';

        const resolvedBanner =
          rawEquippedCosmetics.profileBanner ||
          uData?.equippedBanner ||
          pubData?.equippedBanner ||
          'none';

        const resolvedTitle =
          rawEquippedCosmetics.title ||
          uData?.equippedTitle ||
          pubData?.equippedTitle ||
          'title-rookie';

        const resolvedRole =
          d1Live?.role ||
          (isOwnProfile ? (authProfile as any)?.role : undefined) ||
          pubData?.role ||
          uData?.role ||
          'student';

        const resolvedCustomRole =
          d1Live?.customRole ??
          (isOwnProfile ? (authProfile as any)?.customRole : undefined) ??
          pubData?.customRole ??
          uData?.customRole ??
          'Student';

        const resolvedBio =
          d1Live?.bio !== undefined && d1Live?.bio !== ''
            ? d1Live.bio
            : (isOwnProfile ? (authProfile as any)?.bio : undefined) ??
              uData?.bio ??
              pubData?.bio ??
              '';

        const resolvedStatus =
          d1Live?.status !== undefined && d1Live?.status !== ''
            ? d1Live.status
            : (isOwnProfile ? (authProfile as any)?.status : undefined) ??
              uData?.status ??
              pubData?.status ??
              '';

        const resolvedProBadge: ProBadgeDesignId | null = isOwnProfile
          ? myProBadgeVisible
            ? myProBadgeDesign
            : null
          : d1Live?.proBadge
          ? normalizeProBadgeDesign(d1Live.proBadge)
          : pubData?.proBadge
          ? normalizeProBadgeDesign(pubData.proBadge)
          : uData?.proBadge
          ? normalizeProBadgeDesign(uData.proBadge)
          : null;

        const enriched: EnrichedProfile = {
          uid,
          displayName: resolvedDisplayName,
          username: resolvedUsername,
          role: resolvedRole as any,
          customRole: resolvedCustomRole || 'Student',
          equippedAvatar: resolvedEquippedAvatar,
          photoURL: resolvedPhotoURL,
          equippedFrame: resolvedFrame,
          equippedBanner: resolvedBanner,
          equippedTitle: resolvedTitle,
          equippedBadges: uData?.equippedBadges ||
            pubData?.equippedBadges || ['first_login'],
          equippedCosmetics: {
            ...rawEquippedCosmetics,
            avatar: isCustomUploadedAvatar ? undefined : resolvedEquippedAvatar,
            avatarFrame: resolvedFrame !== 'none' ? resolvedFrame : undefined,
            profileBanner: resolvedBanner !== 'none' ? resolvedBanner : undefined,
            title: resolvedTitle,
          },
          bio: resolvedBio,
          status: resolvedStatus,
          shortId,
          studentId: shortId,
          followersCount: fCount,
          followingCount: fgCount,
          isBanned: uData?.isBanned || false,
          proBadge: resolvedProBadge,
          stats: {
            streakDays: uData?.streakDays ?? pubData?.stats?.streakDays ?? 0,
            testsCompleted: pubData?.stats?.testsCompleted ?? 0,
            questionsAnswered: pubData?.stats?.questionsAnswered ?? 0,
            accuracyRate: pubData?.stats?.accuracyRate ?? 0,
            xp: uData?.xp ?? pubData?.stats?.xp ?? 0,
          },
        };

        setProfile(enriched);
        setEditNickname(enriched.displayName);
        setEditUsername(enriched.username || '');
        setEditBio(enriched.bio || '');
        setEditStatus(enriched.status || '');
        setEditCustomRole(enriched.customRole || 'Student');
        setEditAvatar(enriched.equippedAvatar);
        setEditFrame(enriched.equippedFrame || 'none');
        setEditBanner(enriched.equippedBanner || 'none');
        setEditEffect(enriched.equippedCosmetics?.profileEffect || 'none');
        setEditBadges(enriched.equippedBadges || ['first_login']);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [
    uid,
    currentUser,
    isOwnProfile,
    isGuest,
    previewMode,
    propData,
    authProfile,
    ownProfile,
    myProBadgeDesign,
    myProBadgeVisible,
  ]);

  // Real-time listener for publicProfiles/{uid}
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
          return {
            ...prev,
            displayName: data.displayName || prev.displayName,
            username: data.username || prev.username,
            customRole: data.customRole ?? prev.customRole,
            bio: data.bio ?? prev.bio,
            status: data.status ?? prev.status,
            photoURL: data.photoURL ?? prev.photoURL,
            equippedAvatar: data.equippedAvatar || prev.equippedAvatar,
            equippedFrame: data.equippedFrame ?? prev.equippedFrame,
            equippedBanner: data.equippedBanner ?? prev.equippedBanner,
            equippedTitle: data.equippedTitle ?? prev.equippedTitle,
            equippedCosmetics: {
              ...(prev.equippedCosmetics || {}),
              ...(data.equippedCosmetics || {}),
            },
          };
        });
      },
      () => {}
    );
    return () => unsub();
  }, [uid, isGuest, previewMode]);

  // Keep own profile synced with live WalletContext & AuthContext
  useEffect(() => {
    if (!isOwnProfile || !ownProfile || previewMode) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const op = ownProfile as any;
      const liveEquipped = wallet.equipped || {};
      const nextFrame =
        liveEquipped.avatarFrame || op.equippedFrame || prev.equippedFrame || 'none';
      const nextBanner =
        liveEquipped.profileBanner || op.equippedBanner || prev.equippedBanner || 'none';
      const nextTitle =
        liveEquipped.title || op.equippedTitle || prev.equippedTitle || 'title-rookie';
      const nextAvatar =
        op.equippedAvatar === 'custom'
          ? 'custom'
          : liveEquipped.avatar || op.equippedAvatar || prev.equippedAvatar || 'avatar-1';

      return {
        ...prev,
        displayName:
          (authProfile as any)?.displayName || op.nickname || prev.displayName,
        username: (authProfile as any)?.username || op.username || prev.username,
        role: (authProfile as any)?.role || op.role || prev.role,
        customRole:
          (authProfile as any)?.customRole ?? op.customRole ?? prev.customRole,
        bio: (authProfile as any)?.bio ?? op.bio ?? prev.bio,
        status: (authProfile as any)?.status ?? op.status ?? prev.status,
        equippedAvatar: nextAvatar,
        photoURL: op.photoURL ?? prev.photoURL,
        equippedFrame: nextFrame,
        equippedBanner: nextBanner,
        equippedTitle: nextTitle,
        equippedBadges: op.equippedBadges ?? prev.equippedBadges,
        proBadge: myProBadgeVisible ? myProBadgeDesign : null,
        equippedCosmetics: {
          ...(prev.equippedCosmetics || {}),
          ...(op.equippedCosmetics || {}),
          ...liveEquipped,
          avatarFrame: nextFrame !== 'none' ? nextFrame : undefined,
          profileBanner: nextBanner !== 'none' ? nextBanner : undefined,
          title: nextTitle,
        },
      };
    });
  }, [
    isOwnProfile,
    ownProfile,
    authProfile,
    wallet.equipped,
    myProBadgeDesign,
    myProBadgeVisible,
    previewMode,
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
    const followDocId = `${currentUser.uid}_${uid}`;
    const followRef = doc(db, 'follows', followDocId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: uid,
          createdAt: serverTimestamp(),
        });
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowList = async (type: 'followers' | 'following') => {
    if (!uid || previewMode) return;
    setFollowListModal(type);
    setFollowListLoading(true);
    setFollowListUsers([]);
    try {
      const field = type === 'followers' ? 'followingId' : 'followerId';
      const targetField = type === 'followers' ? 'followerId' : 'followingId';
      const q = query(collection(db, 'follows'), where(field, '==', uid), limit(50));
      const snap = await getDocs(q);
      const targetUids = snap.docs
        .map((d) => d.data()[targetField] as string)
        .filter(Boolean);

      const loaded: PublicProfile[] = [];
      for (const tUid of targetUids) {
        const p = await getPublicProfile(tUid);
        if (p) loaded.push(p);
      }
      setFollowListUsers(loaded);
    } catch (err) {
      console.error('Error loading follow list:', err);
    } finally {
      setFollowListLoading(false);
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
      const uploadResp = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ dataUrl }),
      });

      let finalPhotoUrl = dataUrl;
      if (uploadResp.ok) {
        const payload = await uploadResp.json();
        if (payload?.avatarUrl) {
          finalPhotoUrl = payload.avatarUrl;
        }
      }

      if (!finalPhotoUrl.startsWith('data:')) {
        try {
          await updateProfile(currentUser, { photoURL: finalPhotoUrl });
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

    const cleanNick = editNickname.trim();
    const cleanUser = editUsername
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    if (cleanNick.length < 2 || cleanNick.length > 32) {
      setEditError('Display name must be between 2 and 32 characters.');
      return;
    }
    if (cleanUser.length < 3 || cleanUser.length > 20) {
      setEditError(
        'Username must be 3–20 characters (letters, numbers, underscores).'
      );
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      const nextEquippedCosmetics: EquippedCosmeticsMap = {
        ...(profile.equippedCosmetics || {}),
        avatar: editAvatar !== 'custom' ? editAvatar : undefined,
        avatarFrame: editFrame !== 'none' ? editFrame : undefined,
        profileBanner: editBanner !== 'none' ? editBanner : undefined,
        profileEffect: editEffect !== 'none' ? editEffect : undefined,
      };

      if (isGuest) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                displayName: cleanNick,
                username: cleanUser,
                customRole: editCustomRole,
                bio: editBio.trim(),
                status: editStatus.trim(),
                equippedAvatar: editAvatar,
                equippedFrame: editFrame,
                equippedBanner: editBanner,
                equippedBadges: editBadges,
                equippedCosmetics: nextEquippedCosmetics,
              }
            : null
        );
        setIsEditing(false);
        return;
      }

      try {
        await wallet.equipMultipleCosmetics({
          avatar: editAvatar !== 'custom' ? editAvatar : null,
          frame: editFrame !== 'none' ? editFrame : null,
          banner: editBanner !== 'none' ? editBanner : null,
          effect: editEffect !== 'none' ? editEffect : null,
        });
      } catch {
        // fallback below
      }

      await setDoc(
        doc(db, 'users', uid),
        {
          displayName: cleanNick,
          nickname: cleanNick,
          username: cleanUser,
          bio: editBio.trim(),
          status: editStatus.trim(),
          customRole: editCustomRole,
          avatar: editAvatar === 'custom' ? profile.photoURL || 'custom' : editAvatar,
          equippedAvatar: editAvatar,
          photoURL: editAvatar === 'custom' ? profile.photoURL || '' : '',
          frame: editFrame,
          equippedFrame: editFrame,
          banner: editBanner,
          equippedBanner: editBanner,
          equippedBadges: editBadges,
          equipped: nextEquippedCosmetics,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      await syncPublicProfile(uid, {
        displayName: cleanNick,
        nickname: cleanNick,
        username: cleanUser,
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
      }).catch(() => {});

      await syncProfileToD1Backend(uid, {
        displayName: cleanNick,
        username: cleanUser,
        customRole: editCustomRole,
        avatar: editAvatar,
        frame: editFrame,
        banner: editBanner,
      }).catch(() => {});

      broadcastPublicProfileUpdate(uid, {
        displayName: cleanNick,
        username: cleanUser,
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

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: cleanNick,
              username: cleanUser,
              customRole: editCustomRole,
              bio: editBio.trim(),
              status: editStatus.trim(),
              equippedAvatar: editAvatar,
              equippedFrame: editFrame,
              equippedBanner: editBanner,
              equippedBadges: editBadges,
              equippedCosmetics: nextEquippedCosmetics,
            }
          : null
      );

      await refreshUserProfile().catch(() => {});
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
    const handle = profile.username || profile.uid;
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleAdminToggleBan = async () => {
    if (!isAdmin || !uid || isOwnProfile || !profile) return;
    const nextBan = !profile.isBanned;
    try {
      await updateDoc(doc(db, 'users', uid), { isBanned: nextBan }).catch((err) => {
        console.error(`Failed to update users/${uid}:`, err);
      });
      setProfile((prev) => (prev ? { ...prev, isBanned: nextBan } : null));
    } catch (err) {
      console.error('Failed to update ban state:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#050506]">
        <div className="w-12 h-12 rounded-full border-2 border-[#D71921] border-t-transparent animate-spin mb-4" />
        <p className="font-doto-title text-xs tracking-[0.2em] text-white/70">
          LOADING PROFILE...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center boardly-glass-card rounded-[32px] max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-doto-title text-lg text-white mb-1">Profile Not Found</h3>
        <p className="text-sm text-white/70">
          This user profile could not be loaded or does not exist.
        </p>
      </div>
    );
  }

  const levelInfo = computeLevelFromStats(profile.stats || {});
  const isTargetPro = (() => {
    if (isOwnProfile) {
      return resolveEffectivePlan({
        uid: currentUser?.uid,
        email: currentUser?.email,
        role: ownProfile?.role || profile.role,
        isGuest,
        plan: ownProfile?.plan,
        isPremium: ownProfile?.isPremium,
        planExpiresAt: ownProfile?.planExpiresAt,
      }).isUnlimited;
    }
    return (
      Boolean(profile.proBadge) ||
      profile.role === 'superadmin' ||
      profile.role === 'admin'
    );
  })();

  const activeProBadgeDesign: ProBadgeDesignId | null = isTargetPro
    ? isOwnProfile
      ? myProBadgeVisible
        ? myProBadgeDesign
        : null
      : normalizeProBadgeDesign(profile.proBadge || 'ember')
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

  const handleString = String(profile.username || 'student').replace(/^@+/, '');
  const kobanDisplayCount = isOwnProfile
    ? Number(wallet.balance || 0)
    : Number((profile as any).kobans ?? (profile.stats?.xp || 0));

  const openEditAction = () => {
    if (propOnEditProfile) {
      propOnEditProfile();
    } else {
      setIsEditing(true);
    }
  };

  const TABS: { id: ProfileTabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'loadout', label: 'Loadout' },
    { id: 'badges', label: 'Badges' },
  ];
  const activeTabIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab)
  );

  return (
    <div className="relative min-h-screen bg-[#050506] text-white boardly-page-safe-bottom overflow-x-hidden">
      {/* Ambient blurred red (#D71921) and blue (#3a4cff) glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-28 -left-24 w-[360px] h-[360px] rounded-full bg-[#D71921]/22 blur-[120px]" />
        <div className="absolute top-1/3 -right-28 w-[340px] h-[340px] rounded-full bg-[#3a4cff]/18 blur-[130px]" />
        <div className="absolute bottom-10 left-1/4 w-[280px] h-[280px] rounded-full bg-[#D71921]/12 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-3.5 sm:px-5 pt-3 pb-8 space-y-4">
        {/* 1. FLOATING GLASS TOP BAR: back button, "Profile" in Doto, settings button */}
        {!previewMode && (
          <header className="boardly-glass-pill sticky top-3 z-30 h-14 px-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (isModal && onClose) {
                  onClose();
                } else if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              aria-label="Go back"
              className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="font-doto-title text-[16px] tracking-[0.16em] text-white select-none truncate">
              PROFILE
            </h1>

            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                aria-label="Open settings"
                className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <Settings className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleShareProfile}
                aria-label="Share profile"
                className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                {copiedToast ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
            )}
          </header>
        )}

        {/* 2. HERO GLASS CARD (radius 32) */}
        <section className="boardly-glass-card relative rounded-[32px] overflow-hidden">
          {/* Equipped profile effect overlay */}
          {equippedEffectId && equippedEffectId !== 'none' && (
            <ProfileCardEffect itemId={equippedEffectId} canAnimate />
          )}

          {/* Equipped Banner on top with a dotted texture */}
          <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-br from-[#D71921]/35 via-[#14141c] to-[#3a4cff]/30">
            <BannerRenderer
              bannerId={equippedBannerId === 'none' ? undefined : equippedBannerId}
              showReadabilityOverlay={false}
              className="h-36 sm:h-44"
            />
            {/* Nothing OS Dotted Texture Overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090c] via-transparent to-black/25" />
          </div>

          {/* Main Hero Body */}
          <div className="relative px-4 sm:px-6 pb-5 pt-0">
            {/* Overlapping Avatar with Equipped Frame Ring & Red LV Badge */}
            <div className="relative -mt-14 sm:-mt-16 mb-3 flex items-end justify-between gap-3">
              <div className="relative inline-flex items-center justify-center">
                <div className="rounded-full p-1 bg-[#09090c]/90 backdrop-blur-md border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.65)]">
                  <BoardlyAvatar
                    size={92}
                    uid={profile.uid}
                    equippedAvatar={
                      (isOwnProfile ? wallet.equipped?.avatar : null) ||
                      profile.equippedAvatar ||
                      profile.avatar
                    }
                    customPhotoURL={profile.photoURL}
                    equippedFrameId={equippedFrameId}
                    alt={profile.displayName || 'Student'}
                  />
                </div>
                {/* Red LV Badge */}
                <span className="absolute -bottom-1.5 right-0 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D71921] text-white font-doto-title text-[11px] tracking-wider border border-white/30 shadow-[0_4px_12px_rgba(215,25,33,0.55)]">
                  LV {levelInfo.level}
                </span>
              </div>

              {/* Gold-outlined Nameplate Chip ("pkig #89617") */}
              {equippedNameplateId && equippedNameplateId !== 'none' ? (
                <Nameplate
                  itemId={equippedNameplateId}
                  name={handleString}
                  shortId={canonicalShortId}
                />
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/55 shadow-[0_0_18px_rgba(245,158,11,0.2)]">
                  <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[12px] font-bold tracking-wide text-amber-100 font-inter-num">
                    {handleString} #{canonicalShortId}
                  </span>
                </div>
              )}
            </div>

            {/* Name + @handle + gold PRO pill */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-white leading-tight">
                  {profile.displayName}
                </h2>
                {isTargetPro && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400/25 via-yellow-300/20 to-amber-500/25 text-amber-200 border border-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.28)]">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    PRO
                  </span>
                )}
                {activeProBadgeDesign && (
                  <ProBadge design={activeProBadgeDesign} size="sm" animated />
                )}
              </div>
              <p className="text-[14px] font-medium text-white/72">@{handleString}</p>
            </div>

            {/* Student and Active Chips */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-white/[0.08] border border-white/[0.16] text-white/90">
                <Shield className="w-3.5 h-3.5 text-[#D71921]" />
                {profile.customRole || 'Student'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/12 border border-emerald-400/30 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {profile.status?.trim() || 'Active'}
              </span>
            </div>

            {/* Stats Row in One Inset Card with Dotted Vertical Dividers: Level, Kobans (gold), Followers, Following */}
            <div className="mt-4 boardly-glass-inset rounded-[22px] p-3 grid grid-cols-4 items-center text-center">
              <div className="px-1.5 py-1">
                <div className="font-inter-num text-[17px] sm:text-[19px] font-extrabold text-white">
                  {levelInfo.level.toLocaleString()}
                </div>
                <div className="font-doto-title text-[10px] tracking-[0.12em] text-white/65 mt-0.5">
                  LEVEL
                </div>
              </div>

              <div className="px-1.5 py-1 nothing-dotted-divider-v">
                <div className="font-inter-num text-[17px] sm:text-[19px] font-extrabold text-amber-300">
                  {kobanDisplayCount.toLocaleString()}
                </div>
                <div className="font-doto-title text-[10px] tracking-[0.12em] text-amber-300/80 mt-0.5">
                  KOBANS
                </div>
              </div>

              <button
                type="button"
                onClick={() => openFollowList('followers')}
                className="px-1.5 py-1 nothing-dotted-divider-v hover:bg-white/[0.04] rounded-r-xl transition-colors cursor-pointer"
              >
                <div className="font-inter-num text-[17px] sm:text-[19px] font-extrabold text-white">
                  {followersCount.toLocaleString()}
                </div>
                <div className="font-doto-title text-[10px] tracking-[0.12em] text-white/65 mt-0.5">
                  FOLLOWERS
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFollowList('following')}
                className="px-1.5 py-1 nothing-dotted-divider-v hover:bg-white/[0.04] rounded-r-xl transition-colors cursor-pointer"
              >
                <div className="font-inter-num text-[17px] sm:text-[19px] font-extrabold text-white">
                  {followingCount.toLocaleString()}
                </div>
                <div className="font-doto-title text-[10px] tracking-[0.12em] text-white/65 mt-0.5">
                  FOLLOWING
                </div>
              </button>
            </div>

            {/* Dot-Matrix Barcode Strip with the ID Number */}
            <div className="mt-3.5 px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <div
                className="flex-1 h-5 opacity-75"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 2px, transparent 2px, transparent 5px, rgba(215,25,33,0.85) 5px, rgba(215,25,33,0.85) 6px, transparent 6px, transparent 9px)',
                  maskImage:
                    'radial-gradient(circle, black 1.5px, transparent 1.5px)',
                  WebkitMaskImage:
                    'radial-gradient(circle, black 1.5px, transparent 1.5px)',
                  maskSize: '4px 4px',
                  WebkitMaskSize: '4px 4px',
                }}
              />
              <span className="font-doto-title text-[12px] tracking-[0.18em] text-white/85 shrink-0">
                ID #{canonicalShortId}
              </span>
            </div>

            {/* Action Pill Buttons (50px tall): Edit profile (red), Locker (glass), Store (glass) */}
            {!previewMode && (
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={openEditAction}
                      className="boardly-red-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-bold tracking-wide cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">Edit profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/locker')}
                      className="boardly-glass-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white hover:bg-white/15 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-[#D71921] shrink-0" />
                      <span className="truncate">Locker</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/store')}
                      className="boardly-glass-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white hover:bg-white/15 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">Store</span>
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
                      className="boardly-red-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-bold tracking-wide cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span className="truncate">Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="boardly-glass-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white hover:bg-white/15 cursor-pointer"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-[#D71921] shrink-0" />
                          <span className="truncate">Follow</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="boardly-glass-pill press-scale h-[50px] px-3 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white hover:bg-white/15 cursor-pointer"
                    >
                      {copiedToast ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">Share</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Admin Moderation Bar (if viewing another user as Admin) */}
            {isAdmin && !isOwnProfile && !previewMode && (
              <div className="mt-3 pt-3 nothing-dotted-divider flex justify-end">
                <button
                  type="button"
                  onClick={handleAdminToggleBan}
                  className={`press-scale min-h-[44px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer ${
                    profile.isBanned
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-red-500/15 border-red-500/35 text-red-300'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {profile.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 3. iOS SEGMENTED TABS: Overview, Loadout, Badges (red-tinted active thumb) */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className="boardly-glass-pill relative p-1.5 grid grid-cols-3 items-center h-[52px]"
        >
          {/* Shared sliding red-tinted active thumb */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-b from-[#D71921]/90 to-[#b51219]/90 border border-white/25 shadow-[0_4px_16px_rgba(215,25,33,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              width: 'calc((100% - 12px) / 3)',
              left: '6px',
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
                className={`relative z-10 h-full rounded-full text-[13px] font-bold tracking-wide transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 4. TAB PANELS */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* About me card (dashed "Add a bio..." placeholder when empty) */}
            <div className="boardly-glass-card rounded-[24px] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-doto-title text-[12px] tracking-[0.16em] text-white/80">
                  ABOUT ME
                </h3>
                {isOwnProfile && !previewMode && (
                  <button
                    type="button"
                    onClick={openEditAction}
                    className="text-xs font-semibold text-[#D71921] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {profile.bio && profile.bio.trim().length > 0 ? (
                <p className="text-[14px] leading-relaxed text-white/90 whitespace-pre-wrap break-words font-sans">
                  {profile.bio}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => isOwnProfile && !previewMode && openEditAction()}
                  className="w-full text-left rounded-2xl p-3.5 border border-dashed border-white/25 bg-white/[0.02] text-[14px] text-white/55 hover:border-white/40 transition-colors cursor-pointer"
                >
                  {isOwnProfile ? 'Add a bio...' : 'No bio added yet.'}
                </button>
              )}
            </div>

            {/* Posts Section */}
            {!previewMode && (
              <ProfilePostsSection
                targetUid={profile.uid}
                isOwnProfile={isOwnProfile}
                authorDisplayName={profile.displayName}
                authorUsername={profile.username}
                authorAvatar={
                  profile.equippedAvatar === 'custom'
                    ? profile.photoURL
                    : profile.equippedAvatar
                }
                authorFrame={equippedFrameId}
                authorRole={profile.role}
                authorProBadge={activeProBadgeDesign}
                isPro={isTargetPro}
                onCountChange={setPostsCount}
              />
            )}
          </div>
        )}

        {activeTab === 'loadout' && (
          <div className="boardly-glass-card rounded-[28px] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-doto-title text-[14px] tracking-[0.14em] text-white">
                  EQUIPPED LOADOUT
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Cosmetic items active on this student profile.
                </p>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate('/locker')}
                  className="boardly-red-pill press-scale min-h-[44px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
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
                    profile.equippedAvatar === 'custom'
                      ? 'Custom Photo'
                      : 'Default Avatar',
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
                const rStyle = RARITY_STYLES[rarity];
                return (
                  <div
                    key={entry.slot}
                    className="boardly-glass-inset rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-doto-title text-[10px] tracking-[0.14em] text-white/60">
                        {entry.slot.toUpperCase()}
                      </div>
                      <div className="text-[14px] font-bold text-white truncate mt-0.5">
                        {entry.item?.name || entry.fallback}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${rStyle.badge}`}
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
          <div className="boardly-glass-card rounded-[28px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-doto-title text-[14px] tracking-[0.14em] text-white">
                ACHIEVEMENT BADGES
              </h3>
              <span className="text-xs font-semibold font-inter-num text-white/70">
                {(profile.equippedBadges || ['first_login']).length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_ACHIEVEMENT_BADGES.map((badge) => {
                const unlocked = (profile.equippedBadges || ['first_login']).includes(
                  badge.id
                );
                const rStyle = RARITY_STYLES[badge.rarity || 'common'];
                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      unlocked
                        ? 'boardly-glass-inset border-white/20'
                        : 'bg-white/[0.02] border-dashed border-white/10 opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#D71921]/15 border border-[#D71921]/30 flex items-center justify-center text-[#D71921]">
                        {unlocked ? (
                          <Award className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4 text-white/50" />
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${rStyle.badge}`}
                      >
                        {badge.rarity}
                      </span>
                    </div>
                    <div className="text-[13px] font-bold text-white truncate">
                      {badge.name}
                    </div>
                    <div className="text-[11px] text-white/65 line-clamp-2 mt-0.5">
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
          data-modal-layer="true"
          role="dialog"
          aria-modal="true"
          className="boardly-modal-backdrop fixed inset-0 flex items-center justify-center p-4"
        >
          <div className="boardly-glass-card rounded-[32px] w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden">
            <div className="p-4 nothing-dotted-divider flex items-center justify-between">
              <h3 className="font-doto-title text-sm tracking-[0.14em] text-white uppercase">
                {followListModal}
              </h3>
              <button
                type="button"
                onClick={() => setFollowListModal(null)}
                aria-label="Close list"
                className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center text-white/75 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {followListLoading ? (
                <div className="py-12 text-center text-white/65 text-sm">Loading...</div>
              ) : followListUsers.length === 0 ? (
                <div className="py-12 text-center text-white/60 text-sm">
                  No {followListModal} yet.
                </div>
              ) : (
                followListUsers.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => {
                      setFollowListModal(null);
                      navigate(`/u/${u.username || u.uid}`);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 cursor-pointer transition-colors"
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
                        <div className="text-sm font-bold text-white truncate">
                          {u.displayName}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          @{u.username || 'student'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#D71921]">View</span>
                  </div>
                ))
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
            displayName: profile.displayName,
            username: profile.username,
            equippedAvatar: profile.equippedAvatar,
            photoURL: profile.photoURL,
            equippedFrame: profile.equippedFrame,
            role: profile.role,
          }}
        />
      )}

      {/* Edit Profile Modal (z-index 2000) */}
      {isEditing && isOwnProfile && (
        <div
          data-modal-layer="true"
          role="dialog"
          aria-modal="true"
          className="boardly-modal-backdrop fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div className="boardly-glass-card rounded-t-[36px] sm:rounded-[32px] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 nothing-dotted-divider flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D71921]" />
                <h3 className="font-doto-title text-sm tracking-[0.14em] text-white">
                  EDIT PROFILE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Close edit profile"
                className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center text-white/75 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="p-5 overflow-y-auto space-y-5 flex-1"
            >
              {editError && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/35 rounded-2xl text-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D71921]" />
                  {editError}
                </div>
              )}

              {/* Custom Photo Upload */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/12">
                <BoardlyAvatar
                  size={64}
                  uid={profile.uid}
                  equippedAvatar={editAvatar}
                  customPhotoURL={profile.photoURL}
                  equippedFrameId={editFrame}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">Profile Picture</div>
                  <p className="text-xs text-white/65 mt-0.5">
                    Upload a custom photo or equip a Boardly avatar in your Locker.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
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
                      className="press-scale min-h-[44px] px-4 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white cursor-pointer"
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-doto-title text-[10px] tracking-[0.14em] text-white/70 mb-1.5">
                    DISPLAY NAME
                  </label>
                  <div className="search-pill-wrapper rounded-2xl bg-white/[0.06] border border-white/15 px-3.5 min-h-[48px] flex items-center">
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      maxLength={32}
                      required
                      className="w-full text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-doto-title text-[10px] tracking-[0.14em] text-white/70 mb-1.5">
                    USERNAME (@HANDLE)
                  </label>
                  <div className="search-pill-wrapper rounded-2xl bg-white/[0.06] border border-white/15 px-3.5 min-h-[48px] flex items-center">
                    <span className="text-white/50 text-sm mr-1">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        )
                      }
                      maxLength={20}
                      required
                      className="w-full text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-doto-title text-[10px] tracking-[0.14em] text-white/70 mb-1.5">
                    STATUS LINE
                  </label>
                  <div className="search-pill-wrapper rounded-2xl bg-white/[0.06] border border-white/15 px-3.5 min-h-[48px] flex items-center">
                    <input
                      type="text"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      placeholder="Studying for Finals..."
                      maxLength={50}
                      className="w-full text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-doto-title text-[10px] tracking-[0.14em] text-white/70 mb-1.5">
                    ACADEMIC ROLE CHIP
                  </label>
                  <select
                    value={editCustomRole}
                    onChange={(e) => setEditCustomRole(e.target.value)}
                    className="w-full rounded-2xl bg-[#121216] border border-white/15 px-3.5 min-h-[48px] text-sm text-white outline-none"
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
                <label className="block font-doto-title text-[10px] tracking-[0.14em] text-white/70 mb-1.5">
                  ABOUT ME / BIO
                </label>
                <div className="search-pill-wrapper rounded-2xl bg-white/[0.06] border border-white/15 p-3.5">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Add a bio..."
                    rows={3}
                    maxLength={240}
                    className="w-full bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/45 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 nothing-dotted-divider flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="boardly-glass-pill press-scale min-h-[48px] px-5 rounded-full text-xs font-bold text-white/80 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="boardly-red-pill press-scale min-h-[48px] px-6 rounded-full text-xs font-bold tracking-wide disabled:opacity-50 cursor-pointer"
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
