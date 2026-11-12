import { useState, useEffect, useMemo } from 'react';
import type { PublicProfile } from '../services/publicProfileService';
import {
  getCachedPublicProfile,
  getPublicProfile,
  subscribePublicProfile,
} from '../services/publicProfileService';
import { resolveCosmeticItemId } from '../components/ui/BoardlyAvatar';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  isValidProBadgeDesign,
  normalizeProBadgeDesign,
} from './proBadgeDesigns';
import type { UserProfile } from '../types';

export const PROFILE_LAYOUT_IDS = [
  'game-card',
  'clean-social',
  'dark-passport',
  'centered-hero',
  'full-cover',
  'trading-card',
  'retro-pixel',
  'glass',
  'id-badge',
  'loadout-showcase',
] as const;

export type ProfileLayoutId = (typeof PROFILE_LAYOUT_IDS)[number];

export const DEFAULT_PROFILE_LAYOUT: ProfileLayoutId = 'game-card';

const PROFILE_LAYOUT_ALLOWLIST = new Set<string>(PROFILE_LAYOUT_IDS);

export function isValidProfileLayout(value: unknown): value is ProfileLayoutId {
  return typeof value === 'string' && PROFILE_LAYOUT_ALLOWLIST.has(value.trim());
}

export function normalizeProfileLayout(value: unknown): ProfileLayoutId {
  if (typeof value === 'string') {
    const clean = value.trim();
    if (PROFILE_LAYOUT_ALLOWLIST.has(clean)) {
      return clean as ProfileLayoutId;
    }
  }
  return DEFAULT_PROFILE_LAYOUT;
}

export interface ProfileLayoutMeta {
  id: ProfileLayoutId;
  name: string;
  subtitle: string;
}

export const PROFILE_LAYOUT_METADATA: readonly ProfileLayoutMeta[] = [
  {
    id: 'game-card',
    name: 'Game Card',
    subtitle: 'Banner on top, overlapping avatar, 4 stat tiles, nameplate under name',
  },
  {
    id: 'clean-social',
    name: 'Clean Social',
    subtitle: 'Banner, avatar with inline stats on the right, name, nameplate & actions',
  },
  {
    id: 'dark-passport',
    name: 'Dark Passport',
    subtitle: 'Dark gradient card containing banner, avatar, nameplate & stat tiles',
  },
  {
    id: 'centered-hero',
    name: 'Centered Hero',
    subtitle: 'Banner, large centered avatar, centered name, nameplate & 3 stats',
  },
  {
    id: 'full-cover',
    name: 'Full Cover',
    subtitle: 'Top-half cover banner with dark gradient overlay & sliding stat sheet',
  },
  {
    id: 'trading-card',
    name: 'Trading Card',
    subtitle: 'Gold-bordered collectible card with nameplate title & banner art window',
  },
  {
    id: 'retro-pixel',
    name: 'Retro Pixel',
    subtitle: 'Dark monospace window "username.exe" with square blocky buttons',
  },
  {
    id: 'glass',
    name: 'Glass',
    subtitle: 'Full-bleed banner background with frosted glass panel holding identity & stats',
  },
  {
    id: 'id-badge',
    name: 'ID Badge',
    subtitle: 'Lanyard clip & crisp credential badge with banner, centered avatar & barcode',
  },
  {
    id: 'loadout-showcase',
    name: 'Loadout Showcase',
    subtitle: 'Slim banner & header with a live list of all 5 equipped store items',
  },
] as const;

/**
 * ONE shared profile data object, resolved live strictly by `uid`.
 * Holds equipped banner, avatar (pfp), avatar frame (ring), nameplate, profile effect,
 * display_name, @username, role, PRO status, level, coins, followers, following, and profile_layout.
 */
export interface SharedProfileData {
  uid: string;
  banner: string | null;
  avatar: string;
  frame: string | null;
  nameplate: string | null;
  effect: string | null;
  display_name: string;
  displayName: string;
  username: string;
  role: string;
  customRole?: string | null;
  isPro: boolean;
  proBadge: string | null;
  level: number;
  coins: number;
  followers: number;
  following: number;
  profile_layout: ProfileLayoutId;
  profileLayout: ProfileLayoutId;
  bio?: string;
  statusText?: string;
  accent?: string;
  targetExam?: string;
  boardOrTrack?: string;
  gradeOrYear?: string;
  streak?: number;
  xp?: number;
  mcqs?: number;
  accuracy?: number;
  joinedAt?: unknown;
  ownedCosmetics?: string[];
  badgeIds?: string[];
}

export function computeLevelFromStats(
  mcqsSolved?: number,
  streak?: number,
  fallbackLevel?: number
): number {
  if (typeof fallbackLevel === 'number' && Number.isFinite(fallbackLevel) && fallbackLevel >= 1) {
    return Math.floor(fallbackLevel);
  }
  const safeMcqs = Math.max(0, Number(mcqsSolved || 0));
  const safeStreak = Math.max(0, Number(streak || 0));
  const combinedPoints = safeMcqs * 10 + safeStreak * 50;
  if (combinedPoints > 0) {
    return Math.max(1, Math.floor(combinedPoints / 250) + 1);
  }
  return 1;
}

/**
 * Builds the canonical SharedProfileData strictly by `uid` from a PublicProfile, own UserProfile, and optional wallet state.
 * Never looks anything up by username or display name.
 */
export function buildSharedProfileData(params: {
  uid: string;
  publicProfile?: Partial<PublicProfile> | null;
  ownUserProfile?: (UserProfile & Record<string, any>) | null;
  walletCoins?: number | null;
  walletEquipped?: {
    avatar?: string | null;
    frame?: string | null;
    banner?: string | null;
    nameplate?: string | null;
    effect?: string | null;
  } | null;
  overrideLayout?: ProfileLayoutId | null;
}): SharedProfileData {
  const { uid, publicProfile, ownUserProfile, walletCoins, walletEquipped, overrideLayout } = params;
  const cleanUid = String(uid || ownUserProfile?.uid || publicProfile?.uid || '').trim();

  const rawDisplayName =
    ownUserProfile?.displayName ||
    ownUserProfile?.nickname ||
    ownUserProfile?.name ||
    publicProfile?.displayName ||
    'Student';
  const displayName = String(rawDisplayName).trim() || 'Student';

  const rawUsername =
    ownUserProfile?.username ||
    publicProfile?.username ||
    `user_${cleanUid.slice(0, 6) || 'boardly'}`;
  const username = String(rawUsername).trim().replace(/^@+/, '') || 'student';

  const rawAvatar =
    walletEquipped?.avatar ??
    ownUserProfile?.equipped?.avatar ??
    ownUserProfile?.equippedAvatar ??
    ownUserProfile?.avatar ??
    publicProfile?.equipped?.avatar ??
    publicProfile?.equippedAvatar ??
    publicProfile?.avatar ??
    'avatar-1';

  const avatar = resolveCosmeticItemId(rawAvatar, 'avatar') || 'avatar-1';

  const rawFrame =
    walletEquipped?.frame !== undefined
      ? walletEquipped.frame
      : ownUserProfile?.equipped?.frame !== undefined
      ? ownUserProfile.equipped.frame
      : ownUserProfile?.equippedFrame !== undefined
      ? ownUserProfile.equippedFrame
      : ownUserProfile?.frame !== undefined
      ? ownUserProfile.frame
      : publicProfile?.equipped?.frame !== undefined
      ? publicProfile.equipped.frame
      : publicProfile?.equippedFrame !== undefined
      ? publicProfile.equippedFrame
      : publicProfile?.frame;

  const frame = resolveCosmeticItemId(rawFrame, 'frame') || null;

  const banner =
    (walletEquipped?.banner !== undefined
      ? walletEquipped.banner
      : ownUserProfile?.equipped?.banner !== undefined
      ? ownUserProfile.equipped.banner
      : ownUserProfile?.banner !== undefined
      ? ownUserProfile.banner
      : publicProfile?.equipped?.banner !== undefined
      ? publicProfile.equipped.banner
      : publicProfile?.equippedBanner !== undefined
      ? publicProfile.equippedBanner
      : publicProfile?.banner) || null;

  const nameplate =
    (walletEquipped?.nameplate !== undefined
      ? walletEquipped.nameplate
      : ownUserProfile?.equipped?.nameplate !== undefined
      ? ownUserProfile.equipped.nameplate
      : ownUserProfile?.nameplate !== undefined
      ? ownUserProfile.nameplate
      : publicProfile?.equipped?.nameplate !== undefined
      ? publicProfile.equipped.nameplate
      : publicProfile?.equippedNameplate !== undefined
      ? publicProfile.equippedNameplate
      : publicProfile?.nameplate) || null;

  const effect =
    (walletEquipped?.effect !== undefined
      ? walletEquipped.effect
      : ownUserProfile?.equipped?.effect !== undefined
      ? ownUserProfile.equipped.effect
      : (ownUserProfile as Record<string, any> | null)?.effectId !== undefined
      ? (ownUserProfile as Record<string, any>).effectId
      : publicProfile?.equipped?.effect !== undefined
      ? publicProfile.equipped.effect
      : publicProfile?.equippedEffect !== undefined
      ? publicProfile.equippedEffect
      : publicProfile?.effectId) || null;

  const role = String(
    ownUserProfile?.role || publicProfile?.role || 'student'
  ).trim();

  const customRole =
    (ownUserProfile?.customRole !== undefined
      ? ownUserProfile.customRole
      : publicProfile?.customRole) || null;

  const rawProBadge =
    ownUserProfile?.proBadge !== undefined
      ? ownUserProfile.proBadge
      : publicProfile?.proBadge !== undefined
      ? publicProfile.proBadge
      : ownUserProfile?.proBadgeDesign;

  const isProRoleOrPlan = Boolean(
    rawProBadge ||
      ownUserProfile?.plan === 'pro' ||
      ownUserProfile?.isPremium ||
      role === 'superadmin' ||
      role === 'admin'
  );

  const proBadgeVisible =
    ownUserProfile?.proBadgeVisible !== undefined ? Boolean(ownUserProfile.proBadgeVisible) : true;

  const proBadge: string | null =
    isProRoleOrPlan && proBadgeVisible
      ? isValidProBadgeDesign(rawProBadge)
        ? normalizeProBadgeDesign(rawProBadge)
        : DEFAULT_PRO_BADGE_DESIGN
      : null;

  const streak = Number(
    ownUserProfile?.streak ??
      publicProfile?.stats?.streak ??
      publicProfile?.publicStats?.streak ??
      0
  );
  const mcqs = Number(
    ownUserProfile?.totalQuestionsSolved ??
      publicProfile?.stats?.mcqs ??
      publicProfile?.stats?.totalQuestionsSolved ??
      publicProfile?.publicStats?.score ??
      0
  );
  const accuracy = Number(
    (ownUserProfile as Record<string, any> | null)?.accuracy ??
      publicProfile?.stats?.accuracy ??
      0
  );

  const level = computeLevelFromStats(mcqs, streak);

  const coins = Math.max(
    0,
    Number(
      walletCoins ??
        (ownUserProfile as Record<string, any> | null)?.coins ??
        (publicProfile as Record<string, any> | null)?.coins ??
        (streak * 25 + mcqs * 5)
    )
  );

  const followers = Math.max(
    0,
    Number(
      publicProfile?.followersCount ??
        (ownUserProfile as Record<string, any> | null)?.followersCount ??
        0
    )
  );
  const following = Math.max(
    0,
    Number(
      publicProfile?.followingCount ??
        (ownUserProfile as Record<string, any> | null)?.followingCount ??
        0
    )
  );

  const resolvedLayout = normalizeProfileLayout(
    overrideLayout ||
      (ownUserProfile as Record<string, any> | null)?.profileLayout ||
      (ownUserProfile as Record<string, any> | null)?.profile_layout ||
      (publicProfile as Record<string, any> | null)?.profileLayout ||
      (publicProfile as Record<string, any> | null)?.profile_layout ||
      DEFAULT_PROFILE_LAYOUT
  );

  return {
    uid: cleanUid,
    banner,
    avatar,
    frame,
    nameplate,
    effect,
    display_name: displayName,
    displayName,
    username,
    role,
    customRole,
    isPro: isProRoleOrPlan,
    proBadge,
    level,
    coins,
    followers,
    following,
    profile_layout: resolvedLayout,
    profileLayout: resolvedLayout,
    bio: ownUserProfile?.bio ?? publicProfile?.bio ?? '',
    statusText: ownUserProfile?.status ?? publicProfile?.status ?? '',
    accent: ownUserProfile?.accent ?? publicProfile?.accent ?? '#D71921',
    targetExam:
      ownUserProfile?.targetUniversity ??
      ownUserProfile?.targetExam ??
      publicProfile?.targetUniversity ??
      'MDCAT',
    boardOrTrack:
      ownUserProfile?.academicTrack ??
      publicProfile?.board ??
      'Pre-Medical',
    gradeOrYear: String(publicProfile?.grade ?? 'Class 12'),
    streak,
    xp: mcqs * 10 + streak * 50,
    mcqs,
    accuracy,
    joinedAt: ownUserProfile?.createdAt ?? publicProfile?.memberSince ?? null,
    badgeIds: ownUserProfile?.equippedBadges ?? publicProfile?.badges ?? [],
  };
}

/**
 * React hook that resolves and subscribes to live SharedProfileData strictly by `uid`.
 */
export function useLiveProfileData(
  uid: string | null | undefined,
  ownUserProfile?: (UserProfile & Record<string, any>) | null,
  walletCoins?: number | null,
  walletEquipped?: {
    avatar?: string | null;
    frame?: string | null;
    banner?: string | null;
    nameplate?: string | null;
    effect?: string | null;
  } | null,
  overrideLayout?: ProfileLayoutId | null
): { data: SharedProfileData; publicProfile: PublicProfile | null; loading: boolean } {
  const cleanUid = String(uid || ownUserProfile?.uid || '').trim();
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(() =>
    cleanUid ? getCachedPublicProfile(cleanUid) : null
  );
  const [loading, setLoading] = useState<boolean>(
    () => Boolean(cleanUid && !ownUserProfile && !getCachedPublicProfile(cleanUid))
  );

  useEffect(() => {
    if (!cleanUid) {
      setPublicProfile(null);
      setLoading(false);
      return;
    }

    const cached = getCachedPublicProfile(cleanUid);
    if (cached) {
      setPublicProfile(cached);
      setLoading(false);
    }

    let cancelled = false;
    getPublicProfile(cleanUid)
      .then((fresh) => {
        if (!cancelled && fresh) {
          setPublicProfile(fresh);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsub = subscribePublicProfile(cleanUid, (live) => {
      if (!cancelled && live) {
        setPublicProfile(live);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [cleanUid]);

  const data = useMemo(
    () =>
      buildSharedProfileData({
        uid: cleanUid,
        publicProfile,
        ownUserProfile:
          ownUserProfile && ownUserProfile.uid === cleanUid ? ownUserProfile : null,
        walletCoins,
        walletEquipped,
        overrideLayout,
      }),
    [cleanUid, publicProfile, ownUserProfile, walletCoins, walletEquipped, overrideLayout]
  );

  return { data, publicProfile, loading };
}
