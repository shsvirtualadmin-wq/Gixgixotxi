import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  documentId,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME, isAdminAccount } from '@/constants/superAdmin';
import { BOARDLY_BOT_ACCOUNTS } from '@/config/botsConfig';
import { resolveUnifiedPlanStatus } from '@/config/plans';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  isValidProBadgeDesign,
  normalizeProBadgeDesign,
} from '@/lib/proBadgeDesigns';
import {
  DEFAULT_PROFILE_LAYOUT,
  isValidProfileLayout,
  normalizeProfileLayout,
  type ProfileLayoutId,
} from '@/lib/profileLayouts';
import type { PublicProfile as BasePublicProfile } from '@/types';

export interface PublicProfile extends BasePublicProfile {
  usernameLower?: string;
  isVerified?: boolean;
  isCaptain?: boolean;
  board?: string | null;
  grade?: string | number | null;
  targetUniversity?: string | null;
  equippedAvatar?: string | null;
  equippedFrame?: string | null;
  equippedNameplate?: string | null;
  equippedBanner?: string | null;
  equippedEffect?: string | null;
  equippedStreakBadges?: string[];
  proBadge?: string | null;
  profileLayout?: ProfileLayoutId;
  profile_layout?: ProfileLayoutId;
}

export type PublicUserProfile = PublicProfile;

const SESSION_CACHE_PREFIX = 'boardly_pub_prof_v4_';
const CACHE_TTL_MS = 20 * 1000; // Short 20s TTL so live profile updates propagate quickly

// Layer 1: In-memory cache
const memoryCache = new Map<string, { profile: PublicProfile; timestamp: number }>();

// Layer 2: In-flight promise deduplication
const inFlightRequests = new Map<string, Promise<PublicProfile | null>>();

// Layer 3: Real-time client pub/sub for instant UI updates across all components
const profileListeners = new Map<string, Set<(profile: PublicProfile) => void>>();
const globalProfileListeners = new Set<(uid: string, profile: PublicProfile) => void>();

export function subscribePublicProfile(
  uid: string | null | undefined,
  listener: (profile: PublicProfile) => void
): () => void {
  const cleanUid = String(uid || '').trim();
  if (!cleanUid) return () => {};
  let set = profileListeners.get(cleanUid);
  if (!set) {
    set = new Set();
    profileListeners.set(cleanUid, set);
  }
  set.add(listener);
  const cached = memoryCache.get(cleanUid)?.profile;
  if (cached) {
    try {
      listener(cached);
    } catch {
      // Ignore listener error
    }
  }
  return () => {
    const currentSet = profileListeners.get(cleanUid);
    if (currentSet) {
      currentSet.delete(listener);
      if (currentSet.size === 0) {
        profileListeners.delete(cleanUid);
      }
    }
  };
}

export function subscribeAllPublicProfiles(
  listener: (uid: string, profile: PublicProfile) => void
): () => void {
  globalProfileListeners.add(listener);
  return () => {
    globalProfileListeners.delete(listener);
  };
}

function notifyProfileListeners(uid: string, profile: PublicProfile): void {
  const set = profileListeners.get(uid);
  if (set) {
    set.forEach((fn) => {
      try {
        fn(profile);
      } catch {
        // Ignore
      }
    });
  }
  globalProfileListeners.forEach((fn) => {
    try {
      fn(uid, profile);
    } catch {
      // Ignore
    }
  });
}

function isLikelyHttpOrPathUrl(val?: unknown): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  );
}

function getFromSessionCache(uid: string): PublicProfile | null {
  try {
    const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - (parsed.timestamp || 0) > CACHE_TTL_MS) {
      sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${uid}`);
      return null;
    }
    return parsed.profile as PublicProfile;
  } catch {
    return null;
  }
}

function saveToCaches(uid: string, profile: PublicProfile, notify = true): void {
  const entry = { profile, timestamp: Date.now() };
  memoryCache.set(uid, entry);
  try {
    sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${uid}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
  if (notify) {
    notifyProfileListeners(uid, profile);
  }
}

export function broadcastPublicProfileUpdate(
  uid: string,
  partial: Partial<PublicProfile> & Record<string, any>
): PublicProfile | null {
  if (!uid) return null;
  const existing = memoryCache.get(uid)?.profile || getFromSessionCache(uid) || null;
  const merged = normalizePublicProfileDoc(
    uid,
    { ...(existing || {}), ...partial },
    { ...(existing || {}), ...partial },
    partial.equipped ? { equipped: partial.equipped } : null
  );
  if (partial.displayName) {
    merged.displayName = String(partial.displayName).trim();
  }
  if (partial.username) {
    merged.username = String(partial.username).trim();
    merged.usernameLower = merged.username.toLowerCase();
  }
  if (partial.bio !== undefined) merged.bio = String(partial.bio ?? '');
  if (partial.status !== undefined) merged.status = String(partial.status ?? '');
  if (partial.accent !== undefined) merged.accent = String(partial.accent || '#D71921');
  if ('proBadge' in partial) {
    merged.proBadge = partial.proBadge && isValidProBadgeDesign(partial.proBadge)
      ? normalizeProBadgeDesign(partial.proBadge)
      : null;
  }
  if ('banner' in partial || (partial.equipped && 'banner' in partial.equipped)) {
    const nextBanner = partial.banner !== undefined ? partial.banner : partial.equipped?.banner ?? null;
    merged.banner = nextBanner;
    merged.equipped = {
      ...(merged.equipped || { effect: null, frame: null, nameplate: null, avatar: null, banner: null }),
      banner: nextBanner,
    };
  }
  if ('nameplate' in partial || (partial.equipped && 'nameplate' in partial.equipped)) {
    const nextNameplate =
      partial.nameplate !== undefined ? partial.nameplate : partial.equipped?.nameplate ?? null;
    merged.nameplate = nextNameplate;
    merged.equipped = {
      ...(merged.equipped || { effect: null, frame: null, nameplate: null, avatar: null, banner: null }),
      nameplate: nextNameplate,
    };
  }
  if ('effectId' in partial || (partial.equipped && 'effect' in partial.equipped)) {
    const nextEffect =
      partial.effectId !== undefined ? partial.effectId : partial.equipped?.effect ?? null;
    merged.effectId = nextEffect;
    merged.equipped = {
      ...(merged.equipped || { effect: null, frame: null, nameplate: null, avatar: null, banner: null }),
      effect: nextEffect,
    };
  }
  if ('profileLayout' in partial || 'profile_layout' in partial) {
    const nextLayout = normalizeProfileLayout(partial.profileLayout ?? partial.profile_layout);
    merged.profileLayout = nextLayout;
    merged.profile_layout = nextLayout;
  }
  saveToCaches(uid, merged, true);
  return merged;
}

export async function syncProfileToD1Backend(
  uid: string,
  data: Record<string, any>
): Promise<void> {
  if (!uid) return;
  try {
    const { auth } = await import('@/lib/firebase');
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const guestSession = (() => {
      try {
        return localStorage.getItem('boardly_guest_session_token') || '';
      } catch {
        return '';
      }
    })();
    const equippedAvatar = resolveCosmeticItemId(
      data.equipped?.avatar ?? data.equippedAvatar ?? data.avatar,
      'avatar'
    );
    const equippedFrame = resolveCosmeticItemId(
      data.equipped?.frame ?? data.equippedFrame ?? data.frame,
      'frame'
    );
    const equippedBanner =
      data.equipped?.banner ?? data.equippedBanner ?? data.banner;
    const equippedNameplate =
      data.equipped?.nameplate ?? data.equippedNameplate ?? data.nameplate;
    const equippedEffect =
      data.equipped?.effect ?? data.equippedEffect ?? data.effectId ?? data.effect;
    await fetch('/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(guestSession ? { 'X-Guest-Session': guestSession } : {}),
        'X-User-Uid': uid,
      },
      body: JSON.stringify({
        uid,
        username: data.username || undefined,
        displayName: data.displayName || data.nickname || data.name || undefined,
        avatar: equippedAvatar !== undefined ? equippedAvatar : undefined,
        frame: equippedFrame !== undefined ? equippedFrame : undefined,
        banner: equippedBanner !== undefined ? equippedBanner : undefined,
        nameplate: equippedNameplate !== undefined ? equippedNameplate : undefined,
        effect: equippedEffect !== undefined ? equippedEffect : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        status: data.status !== undefined ? data.status : undefined,
        accent: data.accent !== undefined ? data.accent : undefined,
        profile_layout:
          data.profileLayout !== undefined || data.profile_layout !== undefined
            ? normalizeProfileLayout(data.profileLayout ?? data.profile_layout)
            : undefined,
      }),
    });
  } catch {
    // Non-fatal network error
  }
}

export async function saveProfileLayoutToServer(
  uid: string,
  layout: string
): Promise<{ ok: boolean; layout: ProfileLayoutId; error?: string }> {
  if (!isValidProfileLayout(layout)) {
    return {
      ok: false,
      layout: DEFAULT_PROFILE_LAYOUT,
      error: `Invalid layout id "${layout}".`,
    };
  }
  const validLayout: ProfileLayoutId = layout;

  // Optimistically commit immediately so navigating back to Profile never flickers or reverts
  if (uid) {
    const { commitSavedProfileLayout } = await import('@/hooks/useSecurityStatus');
    commitSavedProfileLayout(uid, validLayout);
    broadcastPublicProfileUpdate(uid, {
      profileLayout: validLayout,
      profile_layout: validLayout,
    });
  }

  try {
    const { auth } = await import('@/lib/firebase');
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const guestSession = (() => {
      try {
        return localStorage.getItem('boardly_guest_session_token') || '';
      } catch {
        return '';
      }
    })();

    const res = await fetch('/api/auth/profile-layout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(guestSession ? { 'X-Guest-Session': guestSession } : {}),
        ...(uid ? { 'X-User-Uid': uid } : {}),
      },
      body: JSON.stringify({
        uid,
        layout: validLayout,
        profile_layout: validLayout,
      }),
    });

    const rawText = await res.text().catch(() => '');
    let json: Record<string, any> | null = null;
    if (rawText) {
      try {
        json = JSON.parse(rawText) as Record<string, any>;
      } catch {
        json = null;
      }
    }

    if (!res.ok || !json?.ok) {
      const serverErrorText =
        (typeof json?.error === 'string' && json.error.trim()) ||
        (typeof json?.message === 'string' && json.message.trim()) ||
        (rawText && !rawText.trim().startsWith('<') ? rawText.trim().slice(0, 220) : '') ||
        `Failed to save layout (HTTP ${res.status})`;
      return {
        ok: false,
        layout: validLayout,
        error: serverErrorText,
      };
    }

    const confirmedLayout = normalizeProfileLayout(
      json.layout ?? json.profile_layout ?? json.profileLayout ?? validLayout
    );

    // Confirm authoritative save in shared store, Firestore, and live broadcast
    if (uid) {
      const { commitSavedProfileLayout } = await import('@/hooks/useSecurityStatus');
      commitSavedProfileLayout(uid, confirmedLayout);

      if (!uid.startsWith('guest_')) {
        setDoc(
          doc(db, 'users', uid),
          {
            profileLayout: confirmedLayout,
            profile_layout: confirmedLayout,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
        setDoc(
          doc(db, 'publicProfiles', uid),
          {
            profileLayout: confirmedLayout,
            profile_layout: confirmedLayout,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
      broadcastPublicProfileUpdate(uid, {
        profileLayout: confirmedLayout,
        profile_layout: confirmedLayout,
      });
    }

    return { ok: true, layout: confirmedLayout };
  } catch (err) {
    return {
      ok: false,
      layout: validLayout,
      error: err instanceof Error ? err.message : 'Network error saving profile layout.',
    };
  }
}

export function getCachedPublicProfile(uid?: string | null): PublicProfile | null {
  if (!uid) return null;
  const mem = memoryCache.get(uid);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.profile;
  }
  const sess = getFromSessionCache(uid);
  if (sess) {
    memoryCache.set(uid, { profile: sess, timestamp: Date.now() });
    return sess;
  }
  return null;
}

export function invalidatePublicProfileCache(uid?: string): void {
  if (!uid) {
    memoryCache.clear();
    return;
  }
  memoryCache.delete(uid);
  inFlightRequests.delete(uid);
  try {
    sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${uid}`);
  } catch {
    // Ignore
  }
}

export function normalizePublicProfileDoc(
  uid: string,
  pubData?: Record<string, any> | null,
  uData?: Record<string, any> | null,
  walletData?: Record<string, any> | null
): PublicProfile {
  const p = pubData || {};
  const u = uData || {};
  const w = walletData || {};
  const wEquipped = w.equipped || {};
  const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
  const trustedD1Role = typeof p.d1Role === 'string' ? p.d1Role.trim().toLowerCase() : '';
  const isSuperAdmin =
    isAdminAccount(uid) || trustedD1Role === 'superadmin' || trustedD1Role === 'admin';

  const shortId =
    u.studentId ||
    u.shortId ||
    p.studentId ||
    p.shortId ||
    botMatch?.shortId ||
    uid.slice(0, 6).toUpperCase();
  const candidateName =
    u.displayName ||
    p.displayName ||
    u.name ||
    p.name ||
    u.username ||
    p.username ||
    botMatch?.displayName ||
    (isSuperAdmin ? SUPER_ADMIN_NAME : 'Student');
  const safeRawName =
    !isSuperAdmin && String(candidateName).trim().toLowerCase() === 'shs virtual academy'
      ? u.username || p.username || 'Student'
      : candidateName;
  const displayName = isSuperAdmin
    ? u.displayName || p.displayName || SUPER_ADMIN_NAME
    : sanitizeStudentDisplayName(safeRawName, shortId);

  const avatarCandidates = [
    u.equipped?.avatar,
    u.equippedAvatar,
    p.equippedAvatar,
    p.equipped?.avatar,
    wEquipped.avatar,
    w.equippedAvatar,
    w.avatar,
    u.avatar,
    p.avatar,
    u.avatarId,
    p.avatarId,
    u.avatarUrl,
    p.avatarUrl,
    botMatch?.equippedAvatar,
  ];

  let equippedAvatar: string | null = null;
  for (const cand of avatarCandidates) {
    const cosmeticId = resolveCosmeticItemId(cand, 'avatar');
    if (cosmeticId) {
      equippedAvatar = cosmeticId;
      break;
    }
  }

  // Never expose Google/external photoURLs as user avatars
  const resolvedAvatarUrl: string | null = equippedAvatar;
  const resolvedPhotoURL: string | null = null;

  const frameCandidates = [
    u.equipped?.frame,
    u.equippedFrame,
    p.equippedFrame,
    p.equipped?.frame,
    wEquipped.frame,
    w.equippedFrame,
    w.frame,
    u.frame,
    p.frame,
    u.frameId,
    p.frameId,
    botMatch?.frame,
  ];

  let equippedFrame: string | null = null;
  for (const cand of frameCandidates) {
    const cosmeticFrameId = resolveCosmeticItemId(cand, 'frame');
    if (cosmeticFrameId) {
      equippedFrame = cosmeticFrameId;
      break;
    }
  }

  const equippedNameplate =
    u.equipped?.nameplate ||
    u.equippedNameplate ||
    p.equippedNameplate ||
    p.equipped?.nameplate ||
    wEquipped.nameplate ||
    w.equippedNameplate ||
    u.nameplate ||
    p.nameplate ||
    null;

  const equippedBanner =
    u.equipped?.banner ||
    u.equippedBanner ||
    p.equippedBanner ||
    p.equipped?.banner ||
    wEquipped.banner ||
    w.equippedBanner ||
    u.banner ||
    p.banner ||
    null;

  const equippedEffect =
    u.equipped?.effect ||
    u.equippedEffect ||
    p.equippedEffect ||
    p.equipped?.effect ||
    wEquipped.effect ||
    w.equippedEffect ||
    u.effectId ||
    p.effectId ||
    null;

  const rawBadges =
    Array.isArray(u.badges) && u.badges.length > 0
      ? u.badges
      : Array.isArray(p.badges)
      ? p.badges
      : [];

  const equippedStreakBadges =
    Array.isArray(u.equippedStreakBadges) && u.equippedStreakBadges.length > 0
      ? u.equippedStreakBadges
      : Array.isArray(p.equippedStreakBadges) && p.equippedStreakBadges.length > 0
      ? p.equippedStreakBadges
      : [];

  const stats = {
    streak: Number(u.streak ?? p.stats?.streak ?? p.publicStats?.streak ?? 0),
    longestStreak: Number(u.longestStreak ?? p.stats?.longestStreak ?? u.streak ?? 0),
    mcqs: Number(u.totalQuestionsSolved ?? u.mcqsSolved ?? p.stats?.mcqs ?? p.publicStats?.score ?? 0),
    accuracy: Number(u.accuracy ?? p.stats?.accuracy ?? 0),
    score: Number(u.score ?? p.publicStats?.score ?? 0),
    totalQuestionsSolved: Number(u.totalQuestionsSolved ?? p.stats?.mcqs ?? 0),
  };

  const resolvedRole = isSuperAdmin
    ? 'admin'
    : trustedD1Role ||
      (botMatch ? 'bot' : 'student');

  return {
    uid,
    displayName,
    studentId: shortId,
    shortId,
    username: u.username || p.username || botMatch?.username || undefined,
    usernameLower:
      u.usernameLower ||
      p.usernameLower ||
      (u.username || p.username || botMatch?.username
        ? String(u.username || p.username || botMatch?.username).toLowerCase()
        : undefined),
    role: resolvedRole,
    customRole: p.d1CustomRole || undefined,
    isVerified: Boolean(
      isSuperAdmin || u.isVerified || p.isVerified || u.verified || p.verified
    ),
    isCaptain: Boolean(u.isCaptain ?? p.isCaptain),
    board: u.board || p.board || botMatch?.board || undefined,
    grade: u.grade || p.grade || u.class || p.class || botMatch?.grade || undefined,
    targetUniversity:
      u.targetUniversity || p.targetUniversity || botMatch?.targetUniversity || undefined,
    bio: u.bio ?? p.bio ?? botMatch?.bio ?? '',
    status: u.status ?? p.status ?? '',
    accent: u.accent || p.accent || '#D71921',
    memberSince: u.createdAt || p.memberSince || null,
    crewName: u.crewName || p.crewName || null,
    lastActiveAt: u.lastActiveDate || p.lastActiveAt || null,
    stats,
    publicStats: stats,
    avatar: equippedAvatar || resolvedAvatarUrl || null,
    avatarKey: u.avatarKey || p.avatarKey || wEquipped.avatarKey || null,
    avatarVariant: u.avatarVariant || p.avatarVariant || wEquipped.avatarVariant || null,
    avatarUrl: resolvedAvatarUrl,
    photoURL: resolvedPhotoURL,
    equippedAvatar,
    equippedFrame,
    equippedNameplate,
    equippedBanner,
    equippedEffect,
    frame: equippedFrame,
    nameplate: equippedNameplate,
    banner: equippedBanner,
    effectId: equippedEffect,
    equipped: {
      avatar: equippedAvatar,
      frame: equippedFrame,
      nameplate: equippedNameplate,
      banner: equippedBanner,
      effect: equippedEffect,
    },
    badges: rawBadges,
    equippedStreakBadges,
    followersCount:
      typeof p.followersCount === 'number'
        ? Math.max(0, p.followersCount)
        : typeof u.followersCount === 'number'
        ? Math.max(0, u.followersCount)
        : 0,
    followingCount:
      typeof p.followingCount === 'number'
        ? Math.max(0, p.followingCount)
        : typeof u.followingCount === 'number'
        ? Math.max(0, u.followingCount)
        : 0,
    proBadge: (() => {
      if (uid.startsWith('guest_') || botMatch) return null;
      // If server D1 explicitly resolved proBadge (string or null), respect it if active Pro
      if (p.proBadge !== undefined) {
        if (p.proBadge === null) {
          // Check if Firestore user doc has active Pro and badge wasn't explicitly hidden
          if (u.proBadgeVisible === false || p.proBadgeVisible === false) return null;
        } else if (isValidProBadgeDesign(p.proBadge)) {
          return normalizeProBadgeDesign(p.proBadge);
        }
      }
      const unified = resolveUnifiedPlanStatus({
        uid,
        email: u.email || p.email || null,
        role: resolvedRole,
        isGuest: Boolean(u.isGuest || uid.startsWith('guest_')),
        plan: u.plan ?? p.plan ?? null,
        isPremium: u.isPremium ?? p.isPremium ?? null,
        proPlanId: u.proPlanId ?? p.proPlanId ?? null,
        planStartedAt: u.planStartedAt ?? p.planStartedAt,
        updatedAt: u.updatedAt ?? p.updatedAt,
        planExpiresAt: u.planExpiresAt ?? p.planExpiresAt ?? p.verifiedBadges?.proUntil,
        premiumExpiresAt: u.premiumExpiresAt ?? p.premiumExpiresAt,
        isSuperAdmin,
      });
      const isActivePro = unified.state === 'active' || Boolean(unified.isPro);
      if (!isActivePro) return null;
      const isVisible =
        u.proBadgeVisible !== undefined
          ? Boolean(u.proBadgeVisible)
          : p.proBadgeVisible !== undefined
          ? Boolean(p.proBadgeVisible)
          : true;
      if (!isVisible) return null;
      const candidateDesign = u.proBadgeDesign || p.proBadgeDesign || p.proBadge || u.proBadge;
      return isValidProBadgeDesign(candidateDesign)
        ? normalizeProBadgeDesign(candidateDesign)
        : DEFAULT_PRO_BADGE_DESIGN;
    })(),
    profileLayout: normalizeProfileLayout(
      p.d1ProfileLayout ||
        p.profile_layout ||
        p.profileLayout ||
        u.profile_layout ||
        u.profileLayout ||
        DEFAULT_PROFILE_LAYOUT
    ),
    profile_layout: normalizeProfileLayout(
      p.d1ProfileLayout ||
        p.profile_layout ||
        p.profileLayout ||
        u.profile_layout ||
        u.profileLayout ||
        DEFAULT_PROFILE_LAYOUT
    ),
    updatedAt: u.updatedAt || p.updatedAt || null,
  };
}

async function fetchD1ProfilesBatch(uids: string[]): Promise<Record<string, Record<string, any>>> {
  if (!uids || uids.length === 0) return {};
  try {
    const clean = Array.from(new Set(uids.map((u) => String(u || '').trim()).filter(Boolean))).slice(
      0,
      100
    );
    if (clean.length === 0) return {};
    const res = await fetch(
      `/api/auth/resolve-profiles?uids=${encodeURIComponent(clean.join(','))}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data && data.ok && data.profiles && typeof data.profiles === 'object') {
      return data.profiles as Record<string, Record<string, any>>;
    }
  } catch {
    // Non-fatal
  }
  return {};
}

async function fetchPublicProfileFromNetwork(uid: string): Promise<PublicProfile | null> {
  try {
    const [pubSnap, userSnap, walletSnap, d1Map] = await Promise.all([
      getDoc(doc(db, 'publicProfiles', uid)).catch(() => null),
      getDoc(doc(db, 'users', uid)).catch(() => null),
      getDoc(doc(db, 'wallets', uid)).catch(() => null),
      fetchD1ProfilesBatch([uid]),
    ]);

    const pubData = pubSnap?.exists() ? pubSnap.data() : null;
    const uData = userSnap?.exists() ? userSnap.data() : null;
    const walletData = walletSnap?.exists() ? walletSnap.data() : null;
    const d1Data = d1Map[uid] || null;

    const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
    const isSuperAdmin = isAdminAccount(uid);

    if (!pubData && !uData && !walletData && !d1Data && !botMatch && !isSuperAdmin) {
      return null;
    }

    const mergedPub = {
      ...(pubData || {}),
      ...(d1Data
        ? {
            ...(d1Data.username ? { username: d1Data.username } : {}),
            ...(d1Data.displayName ? { displayName: d1Data.displayName } : {}),
            ...(d1Data.avatar ? { avatar: d1Data.avatar, equippedAvatar: d1Data.avatar } : {}),
            ...(d1Data.frame ? { frame: d1Data.frame, equippedFrame: d1Data.frame } : {}),
            ...(d1Data.role ? { role: d1Data.role, d1Role: d1Data.role } : {}),
            ...(d1Data.customRole ? { customRole: d1Data.customRole, d1CustomRole: d1Data.customRole } : {}),
            ...(d1Data.bio !== null && d1Data.bio !== undefined ? { bio: d1Data.bio } : {}),
            ...(d1Data.status !== null && d1Data.status !== undefined ? { status: d1Data.status } : {}),
            ...(d1Data.accent ? { accent: d1Data.accent } : {}),
            ...(d1Data.proBadge !== undefined ? { proBadge: d1Data.proBadge } : {}),
            ...(d1Data.profileLayout || d1Data.profile_layout
              ? {
                  profileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                  profile_layout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                  d1ProfileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                }
              : {}),
          }
        : {}),
    };
    const mergedUser = {
      ...(uData || {}),
      ...(d1Data
        ? {
            ...(d1Data.username ? { username: d1Data.username } : {}),
            ...(d1Data.displayName ? { displayName: d1Data.displayName } : {}),
            ...(d1Data.avatar ? { avatar: d1Data.avatar, equippedAvatar: d1Data.avatar } : {}),
            ...(d1Data.frame ? { frame: d1Data.frame, equippedFrame: d1Data.frame } : {}),
            ...(d1Data.profileLayout || d1Data.profile_layout
              ? {
                  profileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                  profile_layout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                }
              : {}),
          }
        : {}),
    };

    const profile = normalizePublicProfileDoc(uid, mergedPub, mergedUser, walletData);
    saveToCaches(uid, profile);
    return profile;
  } catch (err) {
    console.warn(`[publicProfileService] Failed to fetch profile for ${uid}:`, err);
    return null;
  }
}

export async function getPublicProfile(
  uid: string,
  options?: { forceRefresh?: boolean }
): Promise<PublicProfile | null> {
  if (!uid) return null;

  if (!options?.forceRefresh) {
    const cached = getCachedPublicProfile(uid);
    if (cached) {
      return cached;
    }

    const existingPromise = inFlightRequests.get(uid);
    if (existingPromise) {
      return existingPromise;
    }
  } else {
    invalidatePublicProfileCache(uid);
  }

  const promise = fetchPublicProfileFromNetwork(uid).finally(() => {
    inFlightRequests.delete(uid);
  });

  inFlightRequests.set(uid, promise);
  return promise;
}

/**
 * Resolves a profile by username or UID, including 14-day held old usernames from D1 `username_history`.
 */
export async function resolveProfileByUsernameOrUid(rawParam: string): Promise<{
  profile: PublicProfile | null;
  redirectedFromOldUsername?: boolean;
  currentUsername?: string | null;
}> {
  const clean = String(rawParam || '').trim().replace(/^@/, '');
  if (!clean) return { profile: null };

  // Check D1 username/history endpoint first (single hop)
  try {
    const res = await fetch(
      `/api/auth/resolve-profiles?username=${encodeURIComponent(clean)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.profile?.uid) {
        const resolvedUid = String(data.profile.uid);
        const fullProfile = await getPublicProfile(resolvedUid, { forceRefresh: true });
        if (fullProfile) {
          return {
            profile: fullProfile,
            redirectedFromOldUsername: Boolean(data.redirectedFromOldUsername),
            currentUsername:
              data.currentUsername || fullProfile.username || data.profile.username || null,
          };
        }
        const d1Payload = {
          ...data.profile,
          d1Role: data.profile.role,
          d1CustomRole: data.profile.customRole,
        };
        const fallbackProfile = normalizePublicProfileDoc(resolvedUid, d1Payload, d1Payload, null);
        saveToCaches(resolvedUid, fallbackProfile);
        return {
          profile: fallbackProfile,
          redirectedFromOldUsername: Boolean(data.redirectedFromOldUsername),
          currentUsername: data.currentUsername || fallbackProfile.username || null,
        };
      }
    }
  } catch {
    // Fall through to Firestore resolution
  }

  const directByUid = await getPublicProfile(clean, { forceRefresh: true });
  if (directByUid) {
    return { profile: directByUid };
  }

  return { profile: null };
}

/**
 * Batch fetches multiple public profiles in ONE batched lookup per page of results.
 */
export async function getPublicProfiles(uids: string[]): Promise<Map<string, PublicProfile>> {
  const result = new Map<string, PublicProfile>();
  if (!uids || uids.length === 0) return result;

  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const missingUids: string[] = [];

  for (const uid of uniqueUids) {
    const cached = getCachedPublicProfile(uid);
    if (cached) {
      result.set(uid, cached);
      continue;
    }
    missingUids.push(uid);
  }

  if (missingUids.length === 0) {
    return result;
  }

  // 1. Single batched D1 call for all missing UIDs
  const d1ProfilesByUid = await fetchD1ProfilesBatch(missingUids);

  // 2. Chunked Firestore `in` query on publicProfiles (no N+1 per-item getDoc waterfall)
  const CHUNK_SIZE = 10;
  for (let i = 0; i < missingUids.length; i += CHUNK_SIZE) {
    const chunk = missingUids.slice(i, i + CHUNK_SIZE);
    try {
      const [pubSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, 'publicProfiles'), where(documentId(), 'in', chunk))).catch(
          () => null
        ),
        getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk))).catch(
          () => null
        ),
      ]);
      const pubDocsByUid = new Map<string, Record<string, any>>();
      pubSnap?.docs.forEach((docSnap) => {
        pubDocsByUid.set(docSnap.id, docSnap.data());
      });
      const userDocsByUid = new Map<string, Record<string, any>>();
      userSnap?.docs.forEach((docSnap) => {
        userDocsByUid.set(docSnap.id, docSnap.data());
      });

      for (const uid of chunk) {
        const pubData = pubDocsByUid.get(uid) || null;
        const uData = userDocsByUid.get(uid) || null;
        const d1Data = d1ProfilesByUid[uid] || null;
        const botMatch = BOARDLY_BOT_ACCOUNTS.find((b) => b.uid === uid);
        const isSuperAdmin = isAdminAccount(uid);

        if (pubData || uData || d1Data || botMatch || isSuperAdmin) {
          const mergedPub = {
            ...(pubData || {}),
            ...(d1Data
              ? {
                  ...(d1Data.username ? { username: d1Data.username } : {}),
                  ...(d1Data.displayName ? { displayName: d1Data.displayName } : {}),
                  ...(d1Data.avatar
                    ? { avatar: d1Data.avatar, equippedAvatar: d1Data.avatar }
                    : {}),
                  ...(d1Data.frame ? { frame: d1Data.frame, equippedFrame: d1Data.frame } : {}),
                  ...(d1Data.role ? { role: d1Data.role, d1Role: d1Data.role } : {}),
                  ...(d1Data.customRole ? { customRole: d1Data.customRole, d1CustomRole: d1Data.customRole } : {}),
                  ...(d1Data.proBadge !== undefined ? { proBadge: d1Data.proBadge } : {}),
                  ...(d1Data.profileLayout || d1Data.profile_layout
                    ? {
                        profileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                        profile_layout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                        d1ProfileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                      }
                    : {}),
                }
              : {}),
          };
          const mergedUser = {
            ...(uData || {}),
            ...(d1Data
              ? {
                  ...(d1Data.username ? { username: d1Data.username } : {}),
                  ...(d1Data.displayName ? { displayName: d1Data.displayName } : {}),
                  ...(d1Data.avatar
                    ? { avatar: d1Data.avatar, equippedAvatar: d1Data.avatar }
                    : {}),
                  ...(d1Data.frame ? { frame: d1Data.frame, equippedFrame: d1Data.frame } : {}),
                  ...(d1Data.profileLayout || d1Data.profile_layout
                    ? {
                        profileLayout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                        profile_layout: normalizeProfileLayout(d1Data.profileLayout ?? d1Data.profile_layout),
                      }
                    : {}),
                }
              : {}),
          };
          const prof = normalizePublicProfileDoc(uid, mergedPub, mergedUser, null);
          saveToCaches(uid, prof);
          result.set(uid, prof);
        }
      }
    } catch (err) {
      console.warn('[publicProfileService] Batch fetch chunk error:', err);
    }
  }

  return result;
}

const nameToUidCache = new Map<string, string | null>();

export function getCachedUidByName(name?: string | null): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return nameToUidCache.get(key) ?? null;
}

/**
 * Resolves a public profile strictly for known system bot accounts if needed.
 * Never resolves user identity or role from display_name or username_lower.
 */
export async function resolvePublicProfileByName(
  rawName?: string | null
): Promise<PublicProfile | null> {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  const key = trimmed.toLowerCase();
  if (!key || key === 'student' || key === 'a student' || key === 'anonymous') {
    return null;
  }

  const bot = BOARDLY_BOT_ACCOUNTS.find(
    (b) => b.displayName.toLowerCase() === key || (b.username && b.username.toLowerCase() === key)
  );
  if (bot) {
    nameToUidCache.set(key, bot.uid);
    return getPublicProfile(bot.uid);
  }

  return null;
}

/**
 * Syncs a user's private profile fields and equipped cosmetics to `publicProfiles/{uid}`.
 */
export async function syncUserPublicProfile(
  uid: string,
  data?: Record<string, any>
): Promise<void> {
  if (!uid) return;
  const input = data || {};

  try {
    const pubRef = doc(db, 'publicProfiles', uid);
    const existingSnap = await getDoc(pubRef).catch(() => null);
    const existingData = existingSnap?.exists() ? existingSnap.data() : {};

    const cleanUsername = input.username ? String(input.username).trim() : existingData.username;
    const cleanUsernameLower = cleanUsername ? cleanUsername.toLowerCase() : undefined;

    const rawEquippedAvatar =
      input.equipped?.avatar ??
      input.equippedAvatar ??
      input.avatar ??
      existingData.equippedAvatar ??
      existingData.avatar ??
      null;
    const equippedAvatar = resolveCosmeticItemId(rawEquippedAvatar, 'avatar');
    const rawEquippedFrame =
      input.equipped?.frame ??
      input.equippedFrame ??
      input.frame ??
      existingData.equippedFrame ??
      existingData.frame ??
      null;
    const equippedFrame = resolveCosmeticItemId(rawEquippedFrame, 'frame');
    const equippedNameplate =
      input.equipped?.nameplate ??
      input.equippedNameplate ??
      input.nameplate ??
      existingData.equippedNameplate ??
      existingData.nameplate ??
      null;
    const equippedBanner =
      input.equipped?.banner ??
      input.equippedBanner ??
      input.banner ??
      existingData.equippedBanner ??
      existingData.banner ??
      null;
    const equippedEffect =
      input.equipped?.effect ??
      input.equippedEffect ??
      input.effectId ??
      existingData.equippedEffect ??
      existingData.effectId ??
      null;

    const shortId =
      input.studentId ||
      input.shortId ||
      existingData.studentId ||
      existingData.shortId ||
      uid.slice(0, 6).toUpperCase();

    const payload: Record<string, any> = {
      uid,
      displayName: sanitizeStudentDisplayName(
        input.displayName || existingData.displayName || 'Student',
        shortId
      ),
      studentId: shortId,
      shortId,
      board: input.board ?? existingData.board ?? null,
      grade: input.grade ?? input.class ?? existingData.grade ?? null,
      targetUniversity: input.targetUniversity ?? existingData.targetUniversity ?? null,
      bio: input.bio ?? existingData.bio ?? '',
      status: input.status ?? existingData.status ?? '',
      accent: input.accent ?? existingData.accent ?? '#D71921',
      avatar: equippedAvatar,
      avatarKey: input.avatarKey ?? existingData.avatarKey ?? null,
      avatarVariant: input.avatarVariant ?? existingData.avatarVariant ?? null,
      avatarUrl: equippedAvatar,
      equippedAvatar,
      equippedFrame,
      equippedNameplate,
      equippedBanner,
      equippedEffect,
      frame: equippedFrame,
      nameplate: equippedNameplate,
      banner: equippedBanner,
      effectId: equippedEffect,
      equipped: {
        avatar: equippedAvatar,
        frame: equippedFrame,
        nameplate: equippedNameplate,
        banner: equippedBanner,
        effect: equippedEffect,
      },
      equippedStreakBadges:
        input.equippedStreakBadges ?? existingData.equippedStreakBadges ?? [],
      updatedAt: serverTimestamp(),
    };

    if (cleanUsername) {
      payload.username = cleanUsername;
      payload.usernameLower = cleanUsernameLower;
    }

    if (!existingSnap?.exists()) {
      payload.role = input.role && ['student', 'Student'].includes(input.role) ? input.role : 'student';
      payload.isVerified = false;
      payload.followersCount = typeof input.followersCount === 'number' ? input.followersCount : 0;
      payload.followingCount = typeof input.followingCount === 'number' ? input.followingCount : 0;
      await setDoc(pubRef, payload);
    } else {
      await updateDoc(pubRef, payload);
    }

    if (cleanUsernameLower) {
      const oldUsernameLower = existingData.usernameLower;
      if (oldUsernameLower && oldUsernameLower !== cleanUsernameLower) {
        const oldRef = doc(db, 'usernames', oldUsernameLower);
        const oldSnap = await getDoc(oldRef).catch(() => null);
        if (oldSnap?.exists() && oldSnap.data()?.uid === uid) {
          await deleteDoc(oldRef).catch(() => {});
        }
      }
      const newUsernameRef = doc(db, 'usernames', cleanUsernameLower);
      await setDoc(
        newUsernameRef,
        {
          uid,
          username: cleanUsername,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    invalidatePublicProfileCache(uid);
    broadcastPublicProfileUpdate(uid, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    await syncProfileToD1Backend(uid, {
      ...input,
      displayName: payload.displayName,
      username: cleanUsername,
      avatar: equippedAvatar,
      frame: equippedFrame,
      bio: payload.bio,
      status: payload.status,
      accent: payload.accent,
    });
  } catch (err) {
    console.warn('[publicProfileService] syncUserPublicProfile notice:', err);
  }
}

export const syncPublicProfile = syncUserPublicProfile;
export type PublicUserProfileSummary = PublicProfile;

export async function backfillAllPublicProfiles(): Promise<{
  totalUsers: number;
  backfilled: number;
}> {
  const snap = await getDocs(query(collection(db, 'users'), limit(500)));
  let backfilled = 0;
  for (const d of snap.docs) {
    try {
      await syncUserPublicProfile(d.id, d.data());
      backfilled++;
    } catch {
      // Ignore individual user backfill error
    }
  }
  return { totalUsers: snap.docs.length, backfilled };
}
