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
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  getDocFromServer,
  addDoc,
  startAfter,
  arrayUnion,
  arrayRemove,
  increment,
  documentId,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { getDisplayName } from '@/utils/displayName';
import { resolveUserJoinedAtMs } from '@/utils/userDate';
import { resolvePlusBadgeId } from '@/lib/plusBadgeDesigns';
import type {
  UserProfile,
  UserTwoFactorSummary,
  UserTwoFactorBadgeLabel,
  Question,
  QuestionKey,
  QuestionReport,
  AuditLog,
  PaymentRequest,
  StudentReview,
  CaptainApplication,
  CrewApplication,
} from '@/types';
export type { UserTwoFactorSummary, UserTwoFactorBadgeLabel };
import {
  findSubjectSlug,
  findChapterSlug,
  computeContentHash,
  getChaptersForSubject,
} from '@/constants/taxonomy';
import { normalizeCorrectAnswer } from './testEngine';
import { recordCrewPaymentActionServer } from './crewBackend';
import { formatPaymentMethodLabel } from '@/constants/branding';
import { calculatePlanExpiryPkt, getProPlanById, buildPlansCatalog } from '@/config/plans';
import {
  getPlan,
  planRank,
  normalizePlanTier,
  getPlanTierFromPlanId,
  getBillingFromPlanId,
  getPlanDisplayName,
  parsePlanExpiryMs,
  type PlanTier,
  type PaidPlanId,
} from '@/lib/planTier';
import { fetchPlansConfigOnce } from '@/hooks/usePlansConfig';
import { computePlanAnalyticsSnapshot } from '@/lib/planAnalytics';
import {
  normalizeCaptainApplicationDoc,
  normalizeCrewApplicationDoc,
  filterApplicationsByStatus,
  countPendingApplications,
  extractTimestampMs,
} from '@/lib/applicationStatus';
import {
  mergeUserActivityMetrics,
  extractAttemptSolvedCount,
  toPktDateKey,
  type D1UserActivitySummary,
  type FirestoreAttemptActivityItem,
} from '@/lib/adminUsersHelpers';
import {
  notifyApplicationDecision,
  notifyKobanPurchaseApproved,
  notifyKobanPurchaseRejected,
  notifyProActivated,
  notifyProRequestRejected,
} from './emailNotificationService';
import { adminAdjustKobans } from './kobanService';
import {
  ENABLE_MULTI_SOURCE_BANK,
  USE_FIRESTORE_QUESTION_READER,
  clearMultiSourceCache,
  getMultiSourceQuestionCounts,
  fetchMultiSourceSubjectTopics,
  fetchMultiSourceQuestionsPaginated,
  saveMultiSourceQuestion,
  deleteMultiSourceQuestion,
  moveMultiSourceQuestionsToTopic,
  batchImportMultiSourceQuestions,
  fetchMultiSourceQuestionKey,
  parseQuestionCompoundId,
  rebuildCountsAndIndex,
  type RebuildCountsResult,
  scanMisfiledQuestions,
  fixMisfiledQuestions,
  type MisfiledQuestionCandidate,
  type FixMisfiledResult,
} from './multiSourceQuestionBank';
export {
  rebuildCountsAndIndex,
  type RebuildCountsResult,
  scanMisfiledQuestions,
  fixMisfiledQuestions,
  type MisfiledQuestionCandidate,
  type FixMisfiledResult,
};
import { getDefaultWriteSource } from '@/config/questionBankSources';
import {
  fetchLiveQuestionBankStats,
  normalizeLiveSubjectCounts,
  type LiveSubjectCountEntry,
} from './universityMcqService';
import {
  countCollectionViaFirestoreRest,
  type FirestoreRestFilter,
} from './firestoreRestCount';

// ─── DIAGNOSTIC FIRESTORE & ENDPOINT ERRORS ──────────────────────────────────
export class AdminFirestoreError extends Error {
  code: string;
  collection: string;
  operation: string;

  constructor(message: string, code: string, collection: string, operation: string) {
    super(message);
    this.name = 'AdminFirestoreError';
    this.code = code;
    this.collection = collection;
    this.operation = operation;
  }
}

export class AdminStatCardError extends Error {
  source: string;
  status: number | string;

  constructor(source: string, status: number | string, detail?: string) {
    const normalizedStatus =
      status === 200 || status === '200' || status === '' ? 'STAT_UNAVAILABLE' : status;
    const cleanDetail = detail ? ` — ${detail}` : '';
    super(`${source} [${normalizedStatus}]${cleanDetail}`);
    this.name = 'AdminStatCardError';
    this.source = source;
    this.status = normalizedStatus;
  }
}

// ─── AUDIT LOGGING HELPER ────────────────────────────────────────────────────
export async function logAdminAction(
  adminEmail: string,
  action: string,
  details?: Record<string, unknown> | string,
  targetUid?: string,
  targetEmail?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      adminEmail: adminEmail.toLowerCase(),
      action,
      targetUid: targetUid ?? null,
      targetEmail: targetEmail ?? null,
      details: details ?? {},
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('[AdminService] Failed to record audit log:', err);
  }
}

// ─── USER DISPLAY NAME HELPER ───────────────────────────────────────────────
export function getUserDisplayName(
  profile?: Partial<UserProfile> | null,
  fallbackAuthUser?: { displayName?: string | null; email?: string | null } | null
): string {
  return getDisplayName(
    {
      display_name: (profile as any)?.display_name ?? profile?.displayName,
      realName: (profile as any)?.realName ?? profile?.name ?? fallbackAuthUser?.displayName,
      username: profile?.username,
    },
    'Student'
  );
}

// ─── ADMIN OVERVIEW STATS & SHARED SWR CACHE ─────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  studentCount?: number | null;
  captainCount?: number | null;
  freeCount?: number | null;
  proCount?: number | null;
  plusCount?: number | null;
  expiringSoonCount?: number | null;
  guestCount?: number | null;
  adminCount?: number;
  twoFactorEnabledCount?: number;
  totalQuestions: number;
  totalUniversities?: number;
  liveUniversities?: number;
  totalAttempts: number;
  totalQuestionsSolved?: number;
  totalActiveCrews?: number;
  totalAmbassadors?: number | null;
  pendingCaptains: number;
  pendingCrew: number;
  pendingPayments: number;
  pendingReviews: number;
  subjectCounts: Record<string, number>;
  subjectBreakdown?: LiveSubjectCountEntry[];
}

export interface AdminAmbassadorItem {
  uid: string;
  name: string;
  shortId: string;
  email: string;
  totalReferrals: number;
  bonusWeeks: number;
  referredStudents: Array<{
    name: string;
    shortId: string;
    joinedDate: string;
    track: string;
  }>;
}

export const CORE_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Biology',
  'Analytical Reasoning',
] as const;

export const DEFAULT_OFF_2FA_SUMMARY: UserTwoFactorSummary = {
  totpEnabled: false,
  email2faEnabled: false,
  twoFactorEnabled: false,
  recoveryPending: false,
  recoveryRequestedAt: null,
  recoveryDisableAt: null,
  backupCodesRemaining: 0,
  trustedDevicesCount: 0,
  lastChangedAt: null,
  badgeLabel: 'Off',
};

export function normalizeTwoFactorSummary(raw?: Partial<UserTwoFactorSummary> | null): UserTwoFactorSummary {
  if (!raw) return { ...DEFAULT_OFF_2FA_SUMMARY };
  const totpEnabled = Boolean(raw.totpEnabled);
  const email2faEnabled = Boolean(raw.email2faEnabled);
  const recoveryPending = Boolean(raw.recoveryPending);
  let badgeLabel: UserTwoFactorBadgeLabel = 'Off';
  if (recoveryPending) {
    badgeLabel = 'Recovery pending';
  } else if (totpEnabled && email2faEnabled) {
    badgeLabel = 'Both';
  } else if (totpEnabled) {
    badgeLabel = 'Authenticator';
  } else if (email2faEnabled) {
    badgeLabel = 'Email code';
  }
  return {
    totpEnabled,
    email2faEnabled,
    twoFactorEnabled: totpEnabled || email2faEnabled,
    recoveryPending,
    recoveryRequestedAt: raw.recoveryRequestedAt ?? null,
    recoveryDisableAt: raw.recoveryDisableAt ?? null,
    backupCodesRemaining: Number(raw.backupCodesRemaining || 0),
    trustedDevicesCount: Number(raw.trustedDevicesCount || 0),
    lastChangedAt: raw.lastChangedAt ?? null,
    badgeLabel: (raw.badgeLabel as UserTwoFactorBadgeLabel) || badgeLabel,
  };
}

export type AdminUserSortKey = 'newest' | 'oldest' | 'questions' | 'streak' | 'name';

export function sortAdminUsers(
  users: UserProfile[],
  sortBy: AdminUserSortKey = 'newest'
): UserProfile[] {
  const list = [...users];
  list.sort((a, b) => {
    if (sortBy === 'newest' || sortBy === 'oldest') {
      const aMs = resolveUserJoinedAtMs(a);
      const bMs = resolveUserJoinedAtMs(b);
      // Users with unknown/missing join date ALWAYS go to the very bottom
      if (aMs === null && bMs === null) {
        return String(a.uid || '').localeCompare(String(b.uid || ''));
      }
      if (aMs === null) return 1;
      if (bMs === null) return -1;
      if (aMs !== bMs) {
        return sortBy === 'newest' ? bMs - aMs : aMs - bMs;
      }
      return String(a.uid || '').localeCompare(String(b.uid || ''));
    }

    if (sortBy === 'questions') {
      const aQ = typeof a.totalQuestionsSolved === 'number' ? a.totalQuestionsSolved : -1;
      const bQ = typeof b.totalQuestionsSolved === 'number' ? b.totalQuestionsSolved : -1;
      if (bQ !== aQ) return bQ - aQ;
      const aMs = resolveUserJoinedAtMs(a) ?? -1;
      const bMs = resolveUserJoinedAtMs(b) ?? -1;
      if (bMs !== aMs) return bMs - aMs;
      return String(a.uid || '').localeCompare(String(b.uid || ''));
    }

    if (sortBy === 'streak') {
      const aS = typeof a.streak === 'number' ? a.streak : -1;
      const bS = typeof b.streak === 'number' ? b.streak : -1;
      if (bS !== aS) return bS - aS;
      const aMs = resolveUserJoinedAtMs(a) ?? -1;
      const bMs = resolveUserJoinedAtMs(b) ?? -1;
      if (bMs !== aMs) return bMs - aMs;
      return String(a.uid || '').localeCompare(String(b.uid || ''));
    }

    // sortBy === 'name'
    const aName = getUserDisplayName(a);
    const bName = getUserDisplayName(b);
    const cmp = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return String(a.uid || '').localeCompare(String(b.uid || ''));
  });
  return list;
}

export interface CachedAdminUsersDirectory {
  users: UserProfile[];
  allDirectoryUsers: UserProfile[];
  user2faMap: Record<string, UserTwoFactorSummary>;
  proBadgesByUid?: Record<string, { design: string; visible: boolean }>;
  plusBadgesByUid?: Record<
    string,
    { plus_badge_design: number | null; plus_badge_visible: boolean }
  >;
  userActivityByUid?: Record<string, D1UserActivitySummary>;
  securityLogs: any[];
  totalCount: number;
  firestoreTotalCount?: number;
  studentCount: number;
  captainCount: number;
  freeCount?: number;
  proCount: number;
  plusCount?: number;
  expiringSoonCount?: number;
  guestCount: number;
  adminCount: number;
  twoFactorEnabledCount: number;
  sortBy?: AdminUserSortKey;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  loadedAt: number;
  queryTimeMs: number;
  fromSessionStorage?: boolean;
}

const ADMIN_SWR_FRESH_MS = 45_000;
const ADMIN_SESSION_MAX_AGE_MS = 5 * 60_000;
const ADMIN_USERS_P1_SESSION_KEY = 'boardly_admin_users_p1_swr_v2';

function readAdminSessionCache<T>(key: string): { at: number; data: T } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; data?: T };
    if (!parsed || typeof parsed.at !== 'number' || !parsed.data) return null;
    if (Date.now() - parsed.at > ADMIN_SESSION_MAX_AGE_MS) return null;
    return { at: parsed.at, data: parsed.data };
  } catch {
    return null;
  }
}

function writeAdminSessionCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // ignore quota / private-mode storage failures
  }
}

function projectUserForListCache(u: UserProfile): UserProfile {
  return {
    uid: u.uid,
    email: u.email,
    username: (u as any).username,
    displayName: u.displayName,
    display_name: (u as any).display_name,
    name: u.name,
    realName: (u as any).realName,
    shortId: u.shortId,
    role: u.role,
    plan: u.plan,
    planTier: (u as any).planTier,
    isPremium: (u as any).isPremium,
    isPro: (u as any).isPro,
    isPlus: (u as any).isPlus,
    suspended: u.suspended,
    isSuspended: (u as any).isSuspended,
    isGuest: u.isGuest,
    accountType: u.accountType,
    targetUniversity: u.targetUniversity,
    totalQuestionsSolved: u.totalQuestionsSolved,
    streak: u.streak,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
    avatar: u.avatar,
    equipped: u.equipped ? { avatar: u.equipped.avatar } : undefined,
    twoFactorStatus: u.twoFactorStatus,
    proBadgeDesign: (u as any).proBadgeDesign,
    proBadgeVisible: (u as any).proBadgeVisible,
    proBadge: (u as any).proBadge,
    plus_badge_design: (u as any).plus_badge_design,
    plus_badge_visible: (u as any).plus_badge_visible,
    plus_badge_id: (u as any).plus_badge_id,
    plusBadge: (u as any).plusBadge,
  } as unknown as UserProfile;
}

let cachedAdminStats: AdminStats | null = null;
let inFlightAdminStatsPromise: Promise<AdminStats> | null = null;

let cachedAdminUsersDirectory: CachedAdminUsersDirectory | null = null;
let inFlightUsersFirstPagePromise: Promise<PaginatedUsersResult> | null = null;
let cachedUsersCollectionCount: { count: number; fetchedAt: number } | null = null;
let inFlightUsersCollectionCount: Promise<number> | null = null;

interface CachedUserActivityRecord {
  fetchedAt: number;
  publicProfile: Record<string, unknown> | null;
  firestoreAttempts: FirestoreAttemptActivityItem[];
}
const cachedUserFirestoreActivity = new Map<string, CachedUserActivityRecord>();
const USER_ACTIVITY_CACHE_TTL_MS = 60_000;

async function enrichUsersWithRealActivity(
  users: UserProfile[],
  d1ActivityByUid: Record<string, D1UserActivitySummary>,
  force = false
): Promise<UserProfile[]> {
  if (users.length === 0) return users;
  const nowMs = Date.now();
  const uidsToFetch: string[] = [];

  for (const u of users) {
    if (!u.uid || u.isGuest || u.accountType === 'guest' || u.uid.startsWith('guest_')) continue;
    const cached = cachedUserFirestoreActivity.get(u.uid);
    if (!force && cached && nowMs - cached.fetchedAt < USER_ACTIVITY_CACHE_TTL_MS) {
      continue;
    }
    uidsToFetch.push(u.uid);
  }

  if (uidsToFetch.length > 0) {
    const CHUNK_SIZE = 30;
    const chunks: string[][] = [];
    for (let i = 0; i < uidsToFetch.length; i += CHUNK_SIZE) {
      chunks.push(uidsToFetch.slice(i, i + CHUNK_SIZE));
    }

    const pubProfileByUid = new Map<string, Record<string, unknown>>();
    const attemptsByUid = new Map<string, Map<string, FirestoreAttemptActivityItem>>();

    const recordAttemptDoc = (docId: string, data: Record<string, unknown>) => {
      const uid = String(data.userId || data.uid || '').trim();
      if (!uid) return;
      const solved = extractAttemptSolvedCount(data);
      const status = String(data.status || '').toLowerCase();
      const isCompleted =
        status === 'completed' ||
        status === 'submitted' ||
        data.percentage !== undefined ||
        data.score !== undefined ||
        data.earnedMarks !== undefined ||
        data.submittedAt !== undefined ||
        data.completedAt !== undefined;
      if (!isCompleted && solved <= 0) return;
      const pktDate = toPktDateKey(
        data.completedAt || data.submittedAt || data.endedAt || data.updatedAt || data.createdAt
      );
      let perUser = attemptsByUid.get(uid);
      if (!perUser) {
        perUser = new Map<string, FirestoreAttemptActivityItem>();
        attemptsByUid.set(uid, perUser);
      }
      perUser.set(docId, { solved, pktDate });
    };

    await Promise.all(
      chunks.map(async (chunk) => {
        const queryWithTimeout = <T,>(p: Promise<T>, label: string): Promise<T | null> =>
          withTimeout(p, 5000, label).catch(() => null);
        const [pubSnap, attByUserIdSnap, attByUidSnap, testAttByUserIdSnap, testAttByUidSnap] =
          await Promise.all([
            queryWithTimeout(
              getDocs(query(collection(db, 'publicProfiles'), where(documentId(), 'in', chunk))),
              'publicProfiles-chunk'
            ),
            queryWithTimeout(
              getDocs(query(collection(db, 'attempts'), where('userId', 'in', chunk))),
              'attempts-userId-chunk'
            ),
            queryWithTimeout(
              getDocs(query(collection(db, 'attempts'), where('uid', 'in', chunk))),
              'attempts-uid-chunk'
            ),
            queryWithTimeout(
              getDocs(query(collection(db, 'testAttempts'), where('userId', 'in', chunk))),
              'testAttempts-userId-chunk'
            ),
            queryWithTimeout(
              getDocs(query(collection(db, 'testAttempts'), where('uid', 'in', chunk))),
              'testAttempts-uid-chunk'
            ),
          ]);

        if (pubSnap) {
          for (const d of pubSnap.docs) {
            pubProfileByUid.set(d.id, d.data() as Record<string, unknown>);
          }
        }
        for (const snap of [attByUserIdSnap, attByUidSnap, testAttByUserIdSnap, testAttByUidSnap]) {
          if (!snap) continue;
          for (const d of snap.docs) {
            recordAttemptDoc(d.id, d.data() as Record<string, unknown>);
          }
        }
      })
    );

    const fetchedAt = Date.now();
    for (const uid of uidsToFetch) {
      cachedUserFirestoreActivity.set(uid, {
        fetchedAt,
        publicProfile: pubProfileByUid.get(uid) ?? null,
        firestoreAttempts: Array.from(attemptsByUid.get(uid)?.values() || []),
      });
    }
  }

  return users.map((u) => {
    const cachedFs = cachedUserFirestoreActivity.get(u.uid);
    const merged = mergeUserActivityMetrics({
      user: u as unknown as Record<string, unknown>,
      publicProfile: cachedFs?.publicProfile ?? null,
      d1Activity: d1ActivityByUid[u.uid] ?? null,
      firestoreAttempts: cachedFs?.firestoreAttempts ?? [],
      nowMs,
    });
    return {
      ...u,
      totalQuestionsSolved: merged.totalQuestionsSolved,
      streak: merged.streak,
    };
  });
}

export function getCachedAdminStats(): AdminStats | null {
  return cachedAdminStats;
}

export function getCachedAdminUsersState(): CachedAdminUsersDirectory | null {
  if (cachedAdminUsersDirectory) return cachedAdminUsersDirectory;
  const restored = readAdminSessionCache<Omit<CachedAdminUsersDirectory, 'lastDoc'>>(
    ADMIN_USERS_P1_SESSION_KEY
  );
  if (restored) {
    cachedAdminUsersDirectory = {
      ...restored.data,
      lastDoc: null,
      fromSessionStorage: true,
    };
    return cachedAdminUsersDirectory;
  }
  return null;
}

function computeUserDirectoryBreakdown(
  directoryUsers: UserProfile[],
  map2fa: Record<string, UserTwoFactorSummary>
) {
  let studentCount = 0;
  let captainCount = 0;
  let freeCount = 0;
  let proCount = 0;
  let plusCount = 0;
  let expiringSoonCount = 0;
  let guestCount = 0;
  let adminCount = 0;
  let twoFactorEnabledCount = 0;
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  for (const u of directoryUsers) {
    const isGuest = Boolean(u.isGuest || u.accountType === 'guest');
    if (isGuest) {
      guestCount += 1;
    } else if (u.role === 'captain') {
      captainCount += 1;
    } else if (u.role === 'admin' || u.role === 'superadmin') {
      adminCount += 1;
    } else {
      studentCount += 1;
    }

    if (!isGuest) {
      const resolvedTier = getPlan(u, nowMs);
      if (resolvedTier === 'plus') {
        plusCount += 1;
        const expMs = parsePlanExpiryMs((u as any).plusUntil ?? u.planExpiresAt ?? u.premiumExpiresAt);
        if (expMs !== null && expMs > nowMs && expMs - nowMs <= sevenDaysMs) {
          expiringSoonCount += 1;
        }
      } else if (resolvedTier === 'pro') {
        proCount += 1;
        const expMs = parsePlanExpiryMs((u as any).proUntil ?? u.planExpiresAt ?? u.premiumExpiresAt);
        if (expMs !== null && expMs > nowMs && expMs - nowMs <= sevenDaysMs) {
          expiringSoonCount += 1;
        }
      } else {
        freeCount += 1;
      }
    }

    const tf = map2fa[u.uid] || u.twoFactorStatus;
    if (tf?.twoFactorEnabled || tf?.totpEnabled || tf?.email2faEnabled) {
      twoFactorEnabledCount += 1;
    }
  }

  return {
    totalCount: directoryUsers.length,
    studentCount,
    captainCount,
    freeCount,
    proCount,
    plusCount,
    expiringSoonCount,
    guestCount,
    adminCount,
    twoFactorEnabledCount,
  };
}

function syncCachedStatsWithUsersDirectory(dir: CachedAdminUsersDirectory) {
  if (!cachedAdminStats) return;
  const authoritativeTotal =
    typeof dir.firestoreTotalCount === 'number' && Number.isFinite(dir.firestoreTotalCount)
      ? dir.firestoreTotalCount
      : cachedAdminStats.totalUsers;
  cachedAdminStats = {
    ...cachedAdminStats,
    totalUsers: authoritativeTotal,
    studentCount: dir.studentCount,
    captainCount: dir.captainCount,
    freeCount: dir.freeCount ?? cachedAdminStats.freeCount,
    proCount: dir.proCount,
    plusCount: dir.plusCount ?? cachedAdminStats.plusCount,
    expiringSoonCount: dir.expiringSoonCount ?? cachedAdminStats.expiringSoonCount,
    guestCount: dir.guestCount,
    adminCount: dir.adminCount,
    twoFactorEnabledCount: dir.twoFactorEnabledCount,
  };
}

export function updateCachedAdminUser2fa(uid: string, status: Partial<UserTwoFactorSummary>) {
  const normalized = normalizeTwoFactorSummary(status);
  if (!cachedAdminUsersDirectory) return;
  const nextMap = {
    ...cachedAdminUsersDirectory.user2faMap,
    [uid]: normalized,
  };
  const patchList = (list: UserProfile[]) =>
    list.map((u) => (u.uid === uid ? { ...u, twoFactorStatus: normalized } : u));
  const nextAll = patchList(cachedAdminUsersDirectory.allDirectoryUsers);
  const nextUsers = patchList(cachedAdminUsersDirectory.users);
  const breakdown = computeUserDirectoryBreakdown(nextAll, nextMap);
  const preservedTotal = Math.max(cachedAdminUsersDirectory.totalCount, breakdown.totalCount);
  cachedAdminUsersDirectory = {
    ...cachedAdminUsersDirectory,
    users: nextUsers,
    allDirectoryUsers: nextAll,
    user2faMap: nextMap,
    ...breakdown,
    totalCount: preservedTotal,
  };
  syncCachedStatsWithUsersDirectory(cachedAdminUsersDirectory);
}

export function patchCachedAdminUser(uid: string, patch: Partial<UserProfile>) {
  if (!cachedAdminUsersDirectory) return;
  const patchList = (list: UserProfile[]) =>
    list.map((u) => (u.uid === uid ? { ...u, ...patch } : u));
  const nextAll = patchList(cachedAdminUsersDirectory.allDirectoryUsers);
  const nextUsers = patchList(cachedAdminUsersDirectory.users);
  const breakdown = computeUserDirectoryBreakdown(nextAll, cachedAdminUsersDirectory.user2faMap);
  const preservedTotal = Math.max(cachedAdminUsersDirectory.totalCount, breakdown.totalCount);
  cachedAdminUsersDirectory = {
    ...cachedAdminUsersDirectory,
    users: nextUsers,
    allDirectoryUsers: nextAll,
    ...breakdown,
    totalCount: preservedTotal,
  };
  syncCachedStatsWithUsersDirectory(cachedAdminUsersDirectory);
}

export function removeCachedAdminUser(uid: string) {
  if (!cachedAdminUsersDirectory) return;
  const hadUser = cachedAdminUsersDirectory.allDirectoryUsers.some((u) => u.uid === uid);
  const nextAll = cachedAdminUsersDirectory.allDirectoryUsers.filter((u) => u.uid !== uid);
  const nextUsers = cachedAdminUsersDirectory.users.filter((u) => u.uid !== uid);
  const nextMap = { ...cachedAdminUsersDirectory.user2faMap };
  delete nextMap[uid];
  const breakdown = computeUserDirectoryBreakdown(nextAll, nextMap);
  const nextTotal = Math.max(
    breakdown.totalCount,
    hadUser ? cachedAdminUsersDirectory.totalCount - 1 : cachedAdminUsersDirectory.totalCount
  );
  cachedAdminUsersDirectory = {
    ...cachedAdminUsersDirectory,
    users: nextUsers,
    allDirectoryUsers: nextAll,
    user2faMap: nextMap,
    ...breakdown,
    totalCount: nextTotal,
  };
  if (cachedUsersCollectionCount && hadUser) {
    cachedUsersCollectionCount = {
      count: Math.max(0, cachedUsersCollectionCount.count - 1),
      fetchedAt: Date.now(),
    };
  }
  if (cachedOverviewUsersCard && hadUser) {
    cachedOverviewUsersCard = {
      at: Date.now(),
      data: {
        ...cachedOverviewUsersCard.data,
        totalUsers: Math.max(0, cachedOverviewUsersCard.data.totalUsers - 1),
        previewUsers: cachedOverviewUsersCard.data.previewUsers
          ? cachedOverviewUsersCard.data.previewUsers.filter((u) => u.uid !== uid)
          : null,
      },
    };
  }
  if (cachedOverviewUsersAndPlans && hadUser) {
    cachedOverviewUsersAndPlans = null;
    cachedPlanAnalytics = null;
  }
  if (cachedAdminStats) {
    cachedAdminStats = {
      ...cachedAdminStats,
      totalUsers: nextTotal,
      studentCount: breakdown.studentCount,
      captainCount: breakdown.captainCount,
      proCount: breakdown.proCount,
      guestCount: breakdown.guestCount,
      adminCount: breakdown.adminCount,
      twoFactorEnabledCount: breakdown.twoFactorEnabledCount,
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err: any = new Error(`Timed out after ${timeoutMs}ms (${label})`);
      err.code = 'DEADLINE_EXCEEDED';
      reject(err);
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Waits for Firebase Auth currentUser & ID token to be ready before firing admin requests.
 */
export async function ensureAdminAuthToken(forceRefresh = false, maxWaitMs = 3000): Promise<string> {
  const start = Date.now();
  while (!auth?.currentUser && Date.now() - start < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  if (!auth?.currentUser) {
    return '';
  }
  try {
    return await withTimeout(auth.currentUser.getIdToken(forceRefresh), 4000, 'auth-getIdToken');
  } catch {
    if (!forceRefresh) {
      try {
        return await withTimeout(auth.currentUser.getIdToken(true), 4000, 'auth-getIdToken-retry');
      } catch {
        return '';
      }
    }
    return '';
  }
}

/**
 * Executes an authenticated admin API fetch with bounded AbortController timeouts
 * and retries once automatically with a refreshed token if the first call fails.
 */
export async function fetchAdminJsonWithRetry<T = any>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10000
): Promise<{ ok: boolean; status: number; data: T | null; errorMessage?: string }> {
  const attemptFetch = async (forceRefresh: boolean, attemptTimeoutMs: number) => {
    const idToken = await ensureAdminAuthToken(forceRefresh);
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const controller = new AbortController();
    const externalSignal = init?.signal;
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }
    const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);
    try {
      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      const data = (await res.json().catch(() => null)) as T | null;
      return { res, data };
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  };

  try {
    let { res, data } = await attemptFetch(false, timeoutMs);
    if (!res.ok && (res.status === 401 || res.status === 403 || res.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      const retryResult = await attemptFetch(true, Math.min(timeoutMs, 6000));
      res = retryResult.res;
      data = retryResult.data;
    }
    if (!res.ok) {
      const rawErr =
        (typeof (data as any)?.error === 'string'
          ? (data as any).error
          : (data as any)?.error?.message) ||
        (data as any)?.message ||
        `HTTP ${res.status} from ${url}`;
      const reason = typeof (data as any)?.reason === 'string' ? (data as any).reason : '';
      const serverMsg =
        reason && !String(rawErr).includes(reason)
          ? `${rawErr} (reason: ${reason})`
          : String(rawErr);
      return { ok: false, status: res.status, data, errorMessage: serverMsg };
    }
    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    if (data === null && !contentType.includes('application/json')) {
      return {
        ok: false,
        status: 502,
        data: null,
        errorMessage: `Unexpected non-JSON response from ${url}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        data: null,
        errorMessage: `Request timed out calling ${url}`,
      };
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const { res, data } = await attemptFetch(true, Math.min(timeoutMs, 6000));
      if (res.ok) {
        return { ok: true, status: res.status, data };
      }
      const rawErr =
        (typeof (data as any)?.error === 'string'
          ? (data as any).error
          : (data as any)?.error?.message) ||
        (data as any)?.message ||
        `HTTP ${res.status} from ${url}`;
      const reason = typeof (data as any)?.reason === 'string' ? (data as any).reason : '';
      const serverMsg =
        reason && !String(rawErr).includes(reason)
          ? `${rawErr} (reason: ${reason})`
          : String(rawErr);
      return { ok: false, status: res.status, data, errorMessage: serverMsg };
    } catch (retryErr: any) {
      return {
        ok: false,
        status: retryErr?.name === 'AbortError' ? 408 : 0,
        data: null,
        errorMessage:
          retryErr?.name === 'AbortError'
            ? `Request timed out calling ${url}`
            : retryErr?.message || err?.message || `Network error calling ${url}`,
      };
    }
  }
}

export async function fetchAdminAmbassadorsList(): Promise<AdminAmbassadorItem[]> {
  try {
    await ensureAdminAuthToken();
    // 1. Fetch bounded referrals
    const refSnap = await getDocs(query(collection(db, 'referrals'), limit(500)));
    const referralsByAmbassador: Record<string, Array<{ name: string; shortId: string; joinedDate: string; track: string }>> = {};

    refSnap.docs.forEach((d) => {
      const data = d.data();
      const ambUid = data.referrerUid || data.referrerCode;
      if (!ambUid) return;

      if (!referralsByAmbassador[ambUid]) {
        referralsByAmbassador[ambUid] = [];
      }

      let dateStr = 'Recent';
      if (data.signedUpAt?.toDate) {
        dateStr = data.signedUpAt.toDate().toLocaleDateString('en-GB');
      } else if (data.signedUpAt?.seconds) {
        dateStr = new Date(data.signedUpAt.seconds * 1000).toLocaleDateString('en-GB');
      }

      referralsByAmbassador[ambUid].push({
        name: data.referredName || data.referredEmail?.split('@')[0] || 'Student',
        shortId: data.referredShortId || d.id.slice(0, 5),
        joinedDate: dateStr,
        track: data.track || 'FAST / NUST Prep',
      });
    });

    // 2. Fetch users with role 'crew', 'ambassador' or who have referrals
    const ambassadorsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['crew', 'ambassador']),
      limit(200)
    );
    const ambSnap = await getDocs(ambassadorsQuery);
    const ambassadorsMap = new Map<string, AdminAmbassadorItem>();

    ambSnap.docs.forEach((d) => {
      const u = d.data() as UserProfile;
      const uid = d.id;
      if (uid.startsWith('bot_') || (u as any).role === 'bot') return;
      const shortId = u.shortId || uid.slice(0, 5);
      const brought = referralsByAmbassador[uid] || referralsByAmbassador[shortId] || [];

      ambassadorsMap.set(uid, {
        uid,
        name: getUserDisplayName(u),
        shortId,
        email: u.email || '',
        totalReferrals: Math.max(brought.length, Number(u.ambassadorBonusWeeks || 0)),
        bonusWeeks: Number(u.ambassadorBonusWeeks || brought.length),
        referredStudents: brought,
      });
    });

    // Also include anyone who has referrals in referralsByAmbassador but might have role 'student'
    const cachedDirUsers = cachedAdminUsersDirectory?.allDirectoryUsers || [];
    const cachedUserMap = new Map<string, UserProfile>();
    for (const cu of cachedDirUsers) {
      if (cu.uid) cachedUserMap.set(cu.uid, cu);
    }

    const uncachedEntries: Array<[string, Array<{ name: string; shortId: string; joinedDate: string; track: string }>]> = [];
    for (const [key, list] of Object.entries(referralsByAmbassador)) {
      if (ambassadorsMap.has(key)) continue;
      const cachedU = cachedUserMap.get(key);
      if (cachedU) {
        ambassadorsMap.set(key, {
          uid: key,
          name: getUserDisplayName(cachedU),
          shortId: cachedU.shortId || key.slice(0, 5),
          email: cachedU.email || '',
          totalReferrals: list.length,
          bonusWeeks: Number(cachedU.ambassadorBonusWeeks || list.length),
          referredStudents: list,
        });
      } else {
        uncachedEntries.push([key, list]);
      }
    }

    const BATCH_SIZE = 10;
    for (let i = 0; i < uncachedEntries.length; i += BATCH_SIZE) {
      const chunk = uncachedEntries.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map(async ([key, list]) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', key));
            if (userDoc.exists()) {
              const u = userDoc.data() as UserProfile;
              ambassadorsMap.set(key, {
                uid: key,
                name: getUserDisplayName(u),
                shortId: u.shortId || key.slice(0, 5),
                email: u.email || '',
                totalReferrals: list.length,
                bonusWeeks: Number(u.ambassadorBonusWeeks || list.length),
                referredStudents: list,
              });
            }
          } catch {
            // ignore individual lookup failure
          }
        })
      );
    }

    return Array.from(ambassadorsMap.values()).sort((a, b) => b.totalReferrals - a.totalReferrals);
  } catch (err) {
    console.warn('[adminService] fetchAdminAmbassadorsList error:', err);
    return [];
  }
}

let serverAdminStatsInFlight: Promise<{
  ok: boolean;
  status: number;
  stats: Record<string, any> | null;
  errorMessage?: string;
}> | null = null;
let serverAdminStatsCache: {
  at: number;
  res: { ok: boolean; status: number; stats: Record<string, any> | null; errorMessage?: string };
} | null = null;

export async function fetchServerAdminStatsSnapshot(force = false): Promise<{
  ok: boolean;
  status: number;
  stats: Record<string, any> | null;
  errorMessage?: string;
}> {
  if (!force && serverAdminStatsCache && Date.now() - serverAdminStatsCache.at < ADMIN_SWR_FRESH_MS) {
    return serverAdminStatsCache.res;
  }
  if (!force && serverAdminStatsInFlight) {
    return serverAdminStatsInFlight;
  }
  const fetchPromise = (async () => {
    const resp = await fetchAdminJsonWithRetry<{ ok?: boolean; stats?: Record<string, any>; error?: any }>(
      '/api/admin/stats'
    );
    const out = {
      ok: resp.ok && Boolean(resp.data?.stats),
      status: resp.status || (resp.ok ? 200 : 500),
      stats: resp.data?.stats || null,
      errorMessage:
        resp.errorMessage ||
        (typeof resp.data?.error === 'string' ? resp.data.error : resp.data?.error?.message),
    };
    if (out.ok) {
      serverAdminStatsCache = { at: Date.now(), res: out };
    }
    return out;
  })().finally(() => {
    serverAdminStatsInFlight = null;
  });
  serverAdminStatsInFlight = fetchPromise;

  // Stale-while-revalidate: return stale cached snapshot immediately while refreshing in background
  if (!force && serverAdminStatsCache && serverAdminStatsCache.res.ok) {
    void fetchPromise.catch(() => {});
    return serverAdminStatsCache.res;
  }
  return fetchPromise;
}

function isTransientFirestoreError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  if (code.includes('resource-exhausted') || msg.includes('quota')) {
    return false;
  }
  return (
    code.includes('deadline-exceeded') ||
    code.includes('deadline_exceeded') ||
    code.includes('unavailable') ||
    code.includes('aborted') ||
    code.includes('internal') ||
    code.includes('unknown') ||
    code.includes('cancelled') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('transport')
  );
}

async function getDocsWithTimeoutAndRetry(
  q: Parameters<typeof getDocs>[0],
  label: string,
  timeoutMs = 8000
): Promise<Awaited<ReturnType<typeof getDocs>>> {
  const runOnce = async (ms: number) =>
    Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          const tErr: any = new Error(`Timed out reading ${label}`);
          tErr.code = 'DEADLINE_EXCEEDED';
          reject(tErr);
        }, ms)
      ),
    ]);

  try {
    return await runOnce(timeoutMs);
  } catch (err: any) {
    const code = String(err?.code || '').toLowerCase();
    if (code === 'permission-denied' || code === 'unauthenticated') {
      await ensureAdminAuthToken(true);
      return runOnce(timeoutMs + 2000);
    }
    if (isTransientFirestoreError(err)) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return runOnce(timeoutMs + 2500);
    }
    throw err;
  }
}

async function countCollectionPaginated(
  colRef: ReturnType<typeof collection>,
  options: {
    whereClauses?: QueryConstraint[];
    pageSize?: number;
    maxPages?: number;
    perPageTimeoutMs?: number;
    collectionLabel: string;
    filterDoc?: (data: Record<string, unknown>) => boolean;
    useDocumentIdOrder?: boolean;
  }
): Promise<number> {
  const {
    whereClauses = [],
    pageSize = 200,
    maxPages = 15,
    perPageTimeoutMs = 8000,
    collectionLabel,
    filterDoc,
    useDocumentIdOrder = whereClauses.length === 0,
  } = options;

  let total = 0;
  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const constraints: QueryConstraint[] = [...whereClauses];
    if (useDocumentIdOrder) {
      constraints.push(orderBy(documentId()));
    }
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(pageSize));

    const snap = await getDocsWithTimeoutAndRetry(
      query(colRef, ...constraints),
      collectionLabel,
      perPageTimeoutMs
    );

    if (filterDoc) {
      for (const d of snap.docs) {
        if (filterDoc((d.data() || {}) as Record<string, unknown>)) {
          total += 1;
        }
      }
    } else {
      total += snap.size;
    }

    if (snap.size < pageSize) {
      break;
    }
    cursor = snap.docs[snap.docs.length - 1] || null;
    if (!cursor) break;
  }

  return total;
}

async function strictCountOrThrow(
  targetQuery: Parameters<typeof getCountFromServer>[0],
  collectionLabel: string,
  serverStatKey?: string,
  forceServer = false,
  options?: {
    paginatedFallback?: () => Promise<number>;
    serverStatAliases?: string[];
    restConfig?: {
      collectionId: string;
      filter?: FirestoreRestFilter;
      pageSize?: number;
      maxPages?: number;
      timeoutMs?: number;
    };
  }
): Promise<number> {
  await ensureAdminAuthToken(false);
  let firestoreErr: any = null;

  // Tier 1: Direct Firestore REST v1 aggregation + keys-only paginated query.
  // Bypasses the Web SDK's single experimentalForceLongPolling stream & IndexedDB locks.
  if (options?.restConfig && auth?.currentUser && typeof globalThis.fetch === 'function') {
    try {
      const restRes = await countCollectionViaFirestoreRest({
        collectionId: options.restConfig.collectionId,
        filter: options.restConfig.filter,
        pageSize: options.restConfig.pageSize ?? 250,
        maxPages: options.restConfig.maxPages ?? 25,
        timeoutMs: options.restConfig.timeoutMs ?? 7000,
        getToken: async (forceRefresh) => {
          const tok = await ensureAdminAuthToken(Boolean(forceRefresh));
          return tok || null;
        },
      });
      if (typeof restRes.count === 'number' && Number.isFinite(restRes.count)) {
        return restRes.count;
      }
    } catch (restErr: any) {
      firestoreErr = restErr;
      const code = String(restErr?.code || '').toUpperCase();
      if (code === 'RESOURCE_EXHAUSTED') {
        throw new AdminStatCardError(
          collectionLabel,
          'RESOURCE_EXHAUSTED',
          restErr?.message || `Quota reached reading ${collectionLabel}`
        );
      }
    }
  }

  // Tier 2: Firestore Web SDK server aggregation with timeout + retry
  const tryFirestoreCount = async (refresh: boolean, timeoutMs: number): Promise<number | null> => {
    if (refresh && auth?.currentUser) {
      await ensureAdminAuthToken(true);
    }
    const snap = await Promise.race([
      getCountFromServer(targetQuery),
      new Promise<null>((_, reject) =>
        setTimeout(() => {
          const tErr: any = new Error(`Timed out reading ${collectionLabel}`);
          tErr.code = 'DEADLINE_EXCEEDED';
          reject(tErr);
        }, timeoutMs)
      ),
    ]);
    if (snap && typeof snap.data === 'function') {
      const count = snap.data().count;
      if (typeof count === 'number' && Number.isFinite(count)) {
        return count;
      }
    }
    return null;
  };

  try {
    const c = await tryFirestoreCount(false, 7000);
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    const emptyErr: any = new Error(`Empty count response from ${collectionLabel}`);
    emptyErr.code = 'EMPTY_COUNT';
    firestoreErr = emptyErr;
  } catch (err1: any) {
    firestoreErr = err1;
    const code = String(err1?.code || '').toLowerCase();
    if (code === 'permission-denied' || code === 'unauthenticated') {
      try {
        const c2 = await tryFirestoreCount(true, 8000);
        if (typeof c2 === 'number' && Number.isFinite(c2)) return c2;
      } catch (err2) {
        firestoreErr = err2;
      }
    } else if (isTransientFirestoreError(err1)) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const c2 = await tryFirestoreCount(false, 9000);
        if (typeof c2 === 'number' && Number.isFinite(c2)) return c2;
      } catch (err2) {
        firestoreErr = err2;
      }
    }
  }

  // Tier 3: Bounded paginated Web SDK getDocs fallback
  if (options?.paginatedFallback) {
    try {
      const paginatedCount = await options.paginatedFallback();
      if (typeof paginatedCount === 'number' && Number.isFinite(paginatedCount)) {
        return paginatedCount;
      }
    } catch (paginatedErr: any) {
      console.warn(
        `[AdminService] paginated fallback warning for ${collectionLabel}:`,
        paginatedErr?.message || paginatedErr
      );
      if (!firestoreErr) {
        firestoreErr = paginatedErr;
      }
    }
  }

  if (serverStatKey) {
    const srv = await fetchServerAdminStatsSnapshot(forceServer);
    const candidateKeys = [serverStatKey, ...(options?.serverStatAliases || [])];
    if (srv.ok && srv.stats) {
      for (const key of candidateKeys) {
        const val = srv.stats[key];
        if (typeof val === 'number' && Number.isFinite(val)) {
          return Number(val);
        }
      }
    }
    const rawSrvStatus = srv.status && srv.status !== 200 ? srv.status : null;
    const status = firestoreErr?.code || rawSrvStatus || 'STAT_UNAVAILABLE';
    const msg =
      firestoreErr?.message ||
      srv.errorMessage ||
      `Failed to load metric from ${collectionLabel}`;
    throw new AdminStatCardError(`${collectionLabel} | GET /api/admin/stats`, status, msg);
  }

  const rawCode = firestoreErr?.code;
  const code = rawCode && rawCode !== 200 && rawCode !== '200' ? rawCode : 'FIRESTORE_ERROR';
  const msg = firestoreErr?.message || `Failed to count ${collectionLabel}`;
  throw new AdminStatCardError(collectionLabel, code, msg);
}

export interface OverviewUsersCardData {
  totalUsers: number;
  studentCount: number | null;
  captainCount: number | null;
  freeCount: number | null;
  proCount: number | null;
  plusCount: number | null;
  expiringSoonCount: number | null;
  guestCount: number | null;
  previewUsers: UserProfile[] | null;
}

export interface OverviewUsersAndPlansSnapshot {
  users: OverviewUsersCardData;
  plans: PlanAnalyticsStats | null;
  plansError: { source: string; status: string | number; message: string } | null;
  fetchedAt: number;
}

let inFlightOverviewUsersAndPlans: Promise<OverviewUsersAndPlansSnapshot> | null = null;
let cachedOverviewUsersAndPlans: { at: number; data: OverviewUsersAndPlansSnapshot } | null = null;
let inFlightOverviewUsersCard: Promise<OverviewUsersCardData> | null = null;
let cachedOverviewUsersCard: { at: number; data: OverviewUsersCardData } | null = null;
let inFlightOverviewQuestionsCard: Promise<{
  totalQuestions: number;
  totalUniversities: number;
  liveUniversities: number;
}> | null = null;
let inFlightOverviewAttemptsCard: Promise<{ totalAttempts: number }> | null = null;
let cachedOverviewAttemptsCard: { at: number; data: { totalAttempts: number } } | null = null;
let cachedOverviewApplicationsCard: {
  at: number;
  data: { pendingCaptains: number; pendingCrew: number; totalPending: number };
} | null = null;
let applicationsCacheVersion = 0;
let inFlightOverviewApplicationsCard: Promise<{
  pendingCaptains: number;
  pendingCrew: number;
  totalPending: number;
}> | null = null;
let inFlightOverviewPaymentsCard: Promise<{ pendingPayments: number }> | null = null;
let cachedOverviewPaymentsCard: { at: number; data: { pendingPayments: number } } | null = null;
let inFlightOverviewReviewsCard: Promise<{ pendingReviews: number }> | null = null;
let cachedOverviewReviewsCard: { at: number; data: { pendingReviews: number } } | null = null;
let inFlightOverviewSubjectsCard: Promise<{
  subjectCounts: Record<string, number>;
  subjects: LiveSubjectCountEntry[];
  totalQuestions: number;
}> | null = null;

export function getApplicationsCacheVersion(): number {
  return applicationsCacheVersion;
}

export function getCachedOverviewUsersAndPlansSnapshot(): OverviewUsersAndPlansSnapshot | null {
  if (
    cachedOverviewUsersAndPlans &&
    Date.now() - cachedOverviewUsersAndPlans.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewUsersAndPlans.data;
  }
  return null;
}

export function getCachedOverviewUsersCard(): OverviewUsersCardData | null {
  if (cachedOverviewUsersCard && Date.now() - cachedOverviewUsersCard.at < ADMIN_SWR_FRESH_MS) {
    return cachedOverviewUsersCard.data;
  }
  return null;
}

export function getCachedOverviewAttemptsCard(): { totalAttempts: number } | null {
  if (
    cachedOverviewAttemptsCard &&
    Date.now() - cachedOverviewAttemptsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewAttemptsCard.data;
  }
  return null;
}

export function getCachedOverviewApplications(): {
  pendingCaptains: number;
  pendingCrew: number;
  totalPending: number;
} | null {
  if (
    cachedOverviewApplicationsCard &&
    Date.now() - cachedOverviewApplicationsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewApplicationsCard.data;
  }
  return null;
}

export function getCachedOverviewPaymentsCard(): { pendingPayments: number } | null {
  if (
    cachedOverviewPaymentsCard &&
    Date.now() - cachedOverviewPaymentsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewPaymentsCard.data;
  }
  return null;
}

export function getCachedOverviewReviewsCard(): { pendingReviews: number } | null {
  if (
    cachedOverviewReviewsCard &&
    Date.now() - cachedOverviewReviewsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewReviewsCard.data;
  }
  return null;
}

/**
 * Single authoritative, deduplicated count of registered users in Firestore (`users` collection).
 * Shared across Admin Overview ("Registered users"), Boardly Plans Snapshot, and Users Directory.
 * Never returns 0 on error — throws AdminStatCardError so callers never render a fake zero.
 */
export async function fetchFirestoreUsersTotalCount(force = false): Promise<number> {
  if (
    !force &&
    cachedUsersCollectionCount &&
    Date.now() - cachedUsersCollectionCount.fetchedAt < ADMIN_SWR_FRESH_MS
  ) {
    return cachedUsersCollectionCount.count;
  }
  if (!force && inFlightUsersCollectionCount) {
    return inFlightUsersCollectionCount;
  }
  const run = async (): Promise<number> => {
    const usersCol = collection(db, 'users');
    const count = await strictCountOrThrow(
      usersCol,
      'firestore:users',
      undefined,
      force,
      {
        restConfig: {
          collectionId: 'users',
          pageSize: 300,
          maxPages: 30,
          timeoutMs: 7000,
        },
        paginatedFallback: () =>
          countCollectionPaginated(usersCol, {
            pageSize: 100,
            maxPages: 25,
            perPageTimeoutMs: 7000,
            collectionLabel: 'firestore:users',
            useDocumentIdOrder: true,
          }),
      }
    );
    cachedUsersCollectionCount = { count, fetchedAt: Date.now() };
    return count;
  };
  inFlightUsersCollectionCount = run().finally(() => {
    inFlightUsersCollectionCount = null;
  });
  return inFlightUsersCollectionCount;
}

async function safeCountQuery(
  targetQuery: Parameters<typeof getCountFromServer>[0],
  timeoutMs = 5000
): Promise<number | null> {
  try {
    const snap = await Promise.race([
      getCountFromServer(targetQuery),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('count-timeout')), timeoutMs)),
    ]);
    return snap && typeof snap.data === 'function' ? Number(snap.data().count) : null;
  } catch {
    return null;
  }
}

async function fetchOverviewPreviewUsers(
  totalUsers: number,
  force: boolean
): Promise<UserProfile[] | null> {
  const cachedDir = getCachedAdminUsersState();
  if (
    !force &&
    cachedDir &&
    !cachedDir.fromSessionStorage &&
    cachedDir.users.length > 0 &&
    Date.now() - cachedDir.loadedAt < ADMIN_SWR_FRESH_MS
  ) {
    const registeredPreview = cachedDir.users.filter(
      (u) => !u.isGuest && u.accountType !== 'guest' && !u.uid.startsWith('bot_') && (u as any).role !== 'bot'
    );
    if (registeredPreview.length > 0) {
      return registeredPreview.slice(0, 6);
    }
  }

  try {
    await ensureAdminAuthToken(false);
    const usersCol = collection(db, 'users');
    let snap = await getDocsWithTimeoutAndRetry(
      query(usersCol, orderBy('createdAt', 'desc'), limit(6)),
      'firestore:users (preview)',
      8000
    );
    if (snap.empty && totalUsers > 0) {
      snap = await getDocsWithTimeoutAndRetry(
        query(usersCol, limit(6)),
        'firestore:users (preview fallback)',
        8000
      );
    }

    const rawUsers = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
      .filter((u) => !u.uid.startsWith('bot_') && (u as any).role !== 'bot');

    if (rawUsers.length === 0) {
      return totalUsers === 0 ? [] : null;
    }

    let map2fa: Record<string, UserTwoFactorSummary> = { ...(cachedDir?.user2faMap || {}) };
    if (Object.keys(map2fa).length === 0) {
      const twoFaRes = await fetchAdminJsonWithRetry<{
        statusByUid?: Record<string, Partial<UserTwoFactorSummary>>;
        users2fa?: Record<string, Partial<UserTwoFactorSummary>>;
        users?: Record<string, Partial<UserTwoFactorSummary>>;
      }>('/api/auth/admin/2fa-status', undefined, 5000).catch(() => null);
      const rawMap =
        twoFaRes?.ok && twoFaRes.data
          ? twoFaRes.data.statusByUid || twoFaRes.data.users2fa || twoFaRes.data.users
          : null;
      if (rawMap && typeof rawMap === 'object') {
        for (const [uid, summary] of Object.entries(rawMap)) {
          map2fa[uid] = normalizeTwoFactorSummary(summary);
        }
      }
    }

    return rawUsers.map((u) => ({
      ...u,
      twoFactorStatus: map2fa[u.uid] || u.twoFactorStatus || { ...DEFAULT_OFF_2FA_SUMMARY },
    }));
  } catch (err) {
    console.warn('[AdminService] fetchOverviewPreviewUsers warning:', err);
    return null;
  }
}

/**
 * Single atomic source of truth for Admin Overview's user-based widgets:
 * - "Registered users" card (totalUsers + Free/Pro/Plus/Guests chips)
 * - "Boardly Plans Snapshot" (Active Free/Pro/Plus, Expiring <=7d, Pro/Plus PKR, Pro -> Plus)
 * - "Users directory" preview card (count + 6 latest registered users)
 *
 * Guarantees all three sections read from the exact same `firestore:users` count and
 * paid-subscription snapshot, never showing mismatched counts or fake 0s on failure.
 */
export async function fetchOverviewUsersAndPlansSnapshot(options?: {
  force?: boolean;
}): Promise<OverviewUsersAndPlansSnapshot> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewUsersAndPlans &&
    Date.now() - cachedOverviewUsersAndPlans.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewUsersAndPlans.data;
  }
  if (!force && inFlightOverviewUsersAndPlans) {
    return inFlightOverviewUsersAndPlans;
  }

  const run = async (): Promise<OverviewUsersAndPlansSnapshot> => {
    const usersCol = collection(db, 'users');

    // 1. Authoritative total registered users count from firestore:users (throws on failure)
    const totalUsers = await fetchFirestoreUsersTotalCount(force);

    // 2. Fetch plans breakdown, preview users, guest count, and captain count in parallel
    //    using the exact same `totalUsers` value so every Overview widget agrees atomically.
    const [plansRes, previewUsers, guestsRes, captainCountRes] = await Promise.all([
      computePlanAnalyticsWithTotal(totalUsers).then(
        (data) => ({ ok: true as const, data }),
        (err: any) => ({
          ok: false as const,
          error:
            err instanceof AdminStatCardError
              ? { source: err.source, status: err.status, message: err.message }
              : {
                  source: 'firestore:users,paymentRequests,planActivations',
                  status: err?.code || err?.status || 500,
                  message: err?.message || 'Failed to load plan analytics',
                },
        })
      ),
      fetchOverviewPreviewUsers(totalUsers, force),
      fetchAdminJsonWithRetry<{ ok?: boolean; guests?: any[] }>('/api/auth/guests', undefined, 6000)
        .then((res) =>
          res.ok && Array.isArray(res.data?.guests)
            ? res.data.guests.filter((g: any) => !g.upgradedToUid).length
            : null
        )
        .catch(() => null),
      safeCountQuery(query(usersCol, where('role', '==', 'captain')), 5000),
    ]);

    const plans = plansRes.ok ? plansRes.data : null;
    const plansError = plansRes.ok ? null : plansRes.error;

    const usersData: OverviewUsersCardData = {
      totalUsers,
      studentCount:
        captainCountRes !== null ? Math.max(0, totalUsers - captainCountRes) : null,
      captainCount: captainCountRes,
      freeCount: plans ? plans.freeCount : null,
      proCount: plans ? plans.proCount : null,
      plusCount: plans ? plans.plusCount : null,
      expiringSoonCount: plans ? plans.expiringSoonCount : null,
      guestCount: guestsRes,
      previewUsers,
    };

    const nowMs = Date.now();
    const snapshot: OverviewUsersAndPlansSnapshot = {
      users: usersData,
      plans,
      plansError,
      fetchedAt: nowMs,
    };

    cachedOverviewUsersCard = { at: nowMs, data: usersData };
    if (plans) {
      cachedPlanAnalytics = { at: nowMs, data: plans };
    }
    cachedOverviewUsersAndPlans = { at: nowMs, data: snapshot };

    if (cachedAdminStats) {
      cachedAdminStats = {
        ...cachedAdminStats,
        totalUsers: usersData.totalUsers,
        studentCount: usersData.studentCount ?? cachedAdminStats.studentCount,
        captainCount: usersData.captainCount ?? cachedAdminStats.captainCount,
        freeCount: usersData.freeCount ?? cachedAdminStats.freeCount,
        proCount: usersData.proCount ?? cachedAdminStats.proCount,
        plusCount: usersData.plusCount ?? cachedAdminStats.plusCount,
        expiringSoonCount: usersData.expiringSoonCount ?? cachedAdminStats.expiringSoonCount,
        guestCount: usersData.guestCount ?? cachedAdminStats.guestCount,
      };
    }

    return snapshot;
  };

  inFlightOverviewUsersAndPlans = run().finally(() => {
    inFlightOverviewUsersAndPlans = null;
  });
  return inFlightOverviewUsersAndPlans;
}

export async function fetchOverviewUsersCard(options?: {
  force?: boolean;
}): Promise<OverviewUsersCardData> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewUsersCard &&
    Date.now() - cachedOverviewUsersCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewUsersCard.data;
  }
  if (!force && inFlightOverviewUsersCard) {
    return inFlightOverviewUsersCard;
  }
  const run = async (): Promise<OverviewUsersCardData> => {
    const snapshot = await fetchOverviewUsersAndPlansSnapshot({ force });
    return snapshot.users;
  };
  inFlightOverviewUsersCard = run().finally(() => {
    inFlightOverviewUsersCard = null;
  });
  return inFlightOverviewUsersCard;
}

export async function fetchOverviewQuestionsCard(options?: { force?: boolean }): Promise<{
  totalQuestions: number;
  totalUniversities: number;
  liveUniversities: number;
}> {
  if (!options?.force && inFlightOverviewQuestionsCard) {
    return inFlightOverviewQuestionsCard;
  }
  const run = async () => {
    try {
      const bank = await fetchLiveQuestionBankStats({
        force: Boolean(options?.force),
        strict: true,
      });
      return {
        totalQuestions: bank.totalMcqs,
        totalUniversities: bank.totalUniversities,
        liveUniversities: bank.liveUniversities,
      };
    } catch (err: any) {
      if (err instanceof AdminStatCardError) throw err;
      throw new AdminStatCardError(
        'GET /api/mcqs/health',
        err?.status || err?.code || 500,
        err?.message || 'Failed to load live question bank count'
      );
    }
  };
  inFlightOverviewQuestionsCard = run().finally(() => {
    inFlightOverviewQuestionsCard = null;
  });
  return inFlightOverviewQuestionsCard;
}

export async function fetchOverviewAttemptsCard(options?: { force?: boolean }): Promise<{
  totalAttempts: number;
}> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewAttemptsCard &&
    Date.now() - cachedOverviewAttemptsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewAttemptsCard.data;
  }
  if (!force && inFlightOverviewAttemptsCard) {
    return inFlightOverviewAttemptsCard;
  }
  const run = async () => {
    const attemptsCol = collection(db, 'attempts');
    const totalAttempts = await strictCountOrThrow(
      attemptsCol,
      'firestore:attempts',
      undefined,
      force,
      {
        restConfig: {
          collectionId: 'attempts',
          pageSize: 300,
          maxPages: 30,
          timeoutMs: 7000,
        },
        paginatedFallback: () =>
          countCollectionPaginated(attemptsCol, {
            pageSize: 50,
            maxPages: 25,
            perPageTimeoutMs: 7000,
            collectionLabel: 'firestore:attempts',
            useDocumentIdOrder: true,
          }),
      }
    );
    const data = { totalAttempts };
    cachedOverviewAttemptsCard = { at: Date.now(), data };
    return data;
  };
  inFlightOverviewAttemptsCard = run().finally(() => {
    inFlightOverviewAttemptsCard = null;
  });
  return inFlightOverviewAttemptsCard;
}

function invalidateApplicationsOverviewCache(): void {
  applicationsCacheVersion += 1;
  cachedOverviewApplicationsCard = null;
  inFlightOverviewApplicationsCard = null;
  if (cachedAdminStats) {
    cachedAdminStats = null;
  }
}

export interface AdminApplicationsSnapshot {
  captains: CaptainApplication[];
  crew: CrewApplication[];
  pendingCaptains: number;
  pendingCrew: number;
  totalPending: number;
}

/**
 * Single shared source of truth for both /admin Overview ("Pending applications" card)
 * and /admin/applications. Reads captainApplications and crewApplications with timeout
 * and retry, requiring both queues to succeed so a partial failure never renders a fake 0.
 */
export async function fetchAllApplications(): Promise<AdminApplicationsSnapshot> {
  await ensureAdminAuthToken(false);

  const [captainRes, crewRes] = await Promise.allSettled([
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'captainApplications'), limit(200)),
      'firestore:captainApplications',
      8000
    ),
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'crewApplications'), limit(200)),
      'firestore:crewApplications',
      8000
    ),
  ]);

  if (captainRes.status === 'rejected' || crewRes.status === 'rejected') {
    const err: any =
      captainRes.status === 'rejected' ? captainRes.reason : (crewRes as PromiseRejectedResult).reason;
    const failedSource =
      captainRes.status === 'rejected' && crewRes.status === 'rejected'
        ? 'firestore:captainApplications,crewApplications'
        : captainRes.status === 'rejected'
        ? 'firestore:captainApplications'
        : 'firestore:crewApplications';
    throw new AdminStatCardError(
      failedSource,
      err?.code || err?.status || 500,
      err?.message || `Failed to load ${failedSource}`
    );
  }

  const captains = captainRes.value.docs
    .map((d) => normalizeCaptainApplicationDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => extractTimestampMs(b.createdAt) - extractTimestampMs(a.createdAt));

  const crew = crewRes.value.docs
    .map((d) => normalizeCrewApplicationDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => extractTimestampMs(b.createdAt) - extractTimestampMs(a.createdAt));

  const pendingCaptains = countPendingApplications(captains);
  const pendingCrew = countPendingApplications(crew);
  const totalPending = pendingCaptains + pendingCrew;

  const summary = { pendingCaptains, pendingCrew, totalPending };
  cachedOverviewApplicationsCard = { at: Date.now(), data: summary };

  if (cachedAdminStats) {
    cachedAdminStats = {
      ...cachedAdminStats,
      pendingCaptains,
      pendingCrew,
    };
  }

  return {
    captains,
    crew,
    pendingCaptains,
    pendingCrew,
    totalPending,
  };
}

export async function fetchOverviewApplicationsCard(options?: { force?: boolean }): Promise<{
  pendingCaptains: number;
  pendingCrew: number;
  totalPending: number;
}> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewApplicationsCard &&
    Date.now() - cachedOverviewApplicationsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewApplicationsCard.data;
  }
  if (!force && inFlightOverviewApplicationsCard) {
    return inFlightOverviewApplicationsCard;
  }
  const run = async () => {
    const snapshot = await fetchAllApplications();
    return {
      pendingCaptains: snapshot.pendingCaptains,
      pendingCrew: snapshot.pendingCrew,
      totalPending: snapshot.totalPending,
    };
  };
  inFlightOverviewApplicationsCard = run().finally(() => {
    inFlightOverviewApplicationsCard = null;
  });
  return inFlightOverviewApplicationsCard;
}

export async function fetchOverviewPaymentsCard(options?: { force?: boolean }): Promise<{
  pendingPayments: number;
}> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewPaymentsCard &&
    Date.now() - cachedOverviewPaymentsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewPaymentsCard.data;
  }
  if (!force && inFlightOverviewPaymentsCard) {
    return inFlightOverviewPaymentsCard;
  }
  const run = async () => {
    const paymentsCol = collection(db, 'paymentRequests');
    const pendingPayments = await strictCountOrThrow(
      query(paymentsCol, where('status', '==', 'pending')),
      'firestore:paymentRequests',
      undefined,
      force,
      {
        restConfig: {
          collectionId: 'paymentRequests',
          filter: { fieldPath: 'status', stringValue: 'pending' },
          pageSize: 200,
          maxPages: 15,
          timeoutMs: 7000,
        },
        paginatedFallback: () =>
          countCollectionPaginated(paymentsCol, {
            whereClauses: [where('status', '==', 'pending')],
            pageSize: 60,
            maxPages: 12,
            perPageTimeoutMs: 7000,
            collectionLabel: 'firestore:paymentRequests',
            useDocumentIdOrder: false,
          }),
      }
    );
    const data = { pendingPayments };
    cachedOverviewPaymentsCard = { at: Date.now(), data };
    return data;
  };
  inFlightOverviewPaymentsCard = run().finally(() => {
    inFlightOverviewPaymentsCard = null;
  });
  return inFlightOverviewPaymentsCard;
}

export async function fetchOverviewReviewsCard(options?: { force?: boolean }): Promise<{
  pendingReviews: number;
}> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedOverviewReviewsCard &&
    Date.now() - cachedOverviewReviewsCard.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedOverviewReviewsCard.data;
  }
  if (!force && inFlightOverviewReviewsCard) {
    return inFlightOverviewReviewsCard;
  }
  const run = async () => {
    const reviewsCol = collection(db, 'reviews');
    const pendingReviews = await strictCountOrThrow(
      query(reviewsCol, where('status', '==', 'pending')),
      'firestore:reviews',
      undefined,
      force,
      {
        restConfig: {
          collectionId: 'reviews',
          filter: { fieldPath: 'status', stringValue: 'pending' },
          pageSize: 200,
          maxPages: 15,
          timeoutMs: 7000,
        },
        paginatedFallback: async () => {
          try {
            return await countCollectionPaginated(reviewsCol, {
              whereClauses: [where('status', '==', 'pending')],
              pageSize: 60,
              maxPages: 12,
              perPageTimeoutMs: 7000,
              collectionLabel: 'firestore:reviews',
              useDocumentIdOrder: false,
            });
          } catch {
            // Secondary bounded fallback if status filter index is unavailable or slow
            return countCollectionPaginated(reviewsCol, {
              pageSize: 80,
              maxPages: 8,
              perPageTimeoutMs: 7000,
              collectionLabel: 'firestore:reviews',
              useDocumentIdOrder: true,
              filterDoc: (d) => String(d.status || '').trim().toLowerCase() === 'pending',
            });
          }
        },
      }
    );
    const data = { pendingReviews };
    cachedOverviewReviewsCard = { at: Date.now(), data };
    return data;
  };
  inFlightOverviewReviewsCard = run().finally(() => {
    inFlightOverviewReviewsCard = null;
  });
  return inFlightOverviewReviewsCard;
}

export async function fetchOverviewSubjectsCard(options?: { force?: boolean }): Promise<{
  subjectCounts: Record<string, number>;
  subjects: LiveSubjectCountEntry[];
  totalQuestions: number;
}> {
  if (!options?.force && inFlightOverviewSubjectsCard) {
    return inFlightOverviewSubjectsCard;
  }
  const run = async () => {
    try {
      const bank = await fetchLiveQuestionBankStats({
        force: Boolean(options?.force),
        strict: true,
      });
      const normalized = normalizeLiveSubjectCounts(bank.bySubject);
      return {
        subjectCounts: normalized.subjectCounts,
        subjects: normalized.entries,
        totalQuestions: bank.totalMcqs,
      };
    } catch (err: any) {
      if (err instanceof AdminStatCardError) throw err;
      throw new AdminStatCardError(
        'GET /api/mcqs/health',
        err?.status || err?.code || 500,
        err?.message || 'Failed to load live subject question counts'
      );
    }
  };
  inFlightOverviewSubjectsCard = run().finally(() => {
    inFlightOverviewSubjectsCard = null;
  });
  return inFlightOverviewSubjectsCard;
}

export async function fetchAdminStats(options?: { force?: boolean }): Promise<AdminStats> {
  if (inFlightAdminStatsPromise && !options?.force) {
    return inFlightAdminStatsPromise;
  }

  const runStatsLoad = async (): Promise<AdminStats> => {
    const [usersCard, questionsCard, attemptsCard, appsCard, paymentsCard, reviewsCard, subjectsCard] =
      await Promise.all([
        fetchOverviewUsersCard(options),
        fetchOverviewQuestionsCard(options),
        fetchOverviewAttemptsCard(options),
        fetchOverviewApplicationsCard(options),
        fetchOverviewPaymentsCard(options),
        fetchOverviewReviewsCard(options),
        fetchOverviewSubjectsCard(options),
      ]);

    const result: AdminStats = {
      totalUsers: usersCard.totalUsers,
      studentCount: usersCard.studentCount,
      captainCount: usersCard.captainCount,
      freeCount: usersCard.freeCount,
      proCount: usersCard.proCount,
      plusCount: usersCard.plusCount,
      expiringSoonCount: usersCard.expiringSoonCount,
      guestCount: usersCard.guestCount,
      adminCount: getCachedAdminUsersState()?.adminCount,
      twoFactorEnabledCount: getCachedAdminUsersState()?.twoFactorEnabledCount,
      totalQuestions: questionsCard.totalQuestions,
      totalUniversities: questionsCard.totalUniversities,
      liveUniversities: questionsCard.liveUniversities,
      totalAttempts: attemptsCard.totalAttempts,
      totalQuestionsSolved: undefined,
      totalActiveCrews: undefined,
      totalAmbassadors: usersCard.captainCount,
      pendingCaptains: appsCard.pendingCaptains,
      pendingCrew: appsCard.pendingCrew,
      pendingPayments: paymentsCard.pendingPayments,
      pendingReviews: reviewsCard.pendingReviews,
      subjectCounts: subjectsCard.subjectCounts,
      subjectBreakdown: subjectsCard.subjects,
    };

    cachedAdminStats = result;
    return result;
  };

  inFlightAdminStatsPromise = runStatsLoad().finally(() => {
    inFlightAdminStatsPromise = null;
  });
  return inFlightAdminStatsPromise;
}

// ─── 500+ BALANCED MCQ POOL SEEDER ───────────────────────────────────────────
export async function seedBalancedMCQPool(
  _adminEmail: string,
  _onProgress?: (done: number, total: number) => void
): Promise<{ seeded: number; total: number }> {
  // Questions are seeded/managed in Firestore
  return { seeded: 0, total: 0 };
}

// ─── USER MANAGEMENT & OVERRIDES ─────────────────────────────────────────────
export interface PaginatedUsersResult {
  users: UserProfile[];
  totalCount: number;
  user2faMap: Record<string, UserTwoFactorSummary>;
  securityLogs: any[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  queryTimeMs: number;
  sortBy: AdminUserSortKey;
}

function getFirestoreOrderForSort(
  sortBy: AdminUserSortKey
): [string, 'asc' | 'desc'] {
  switch (sortBy) {
    case 'oldest':
      return ['createdAt', 'asc'];
    case 'questions':
      return ['totalQuestionsSolved', 'desc'];
    case 'streak':
      return ['streak', 'desc'];
    case 'name':
      return ['displayName', 'asc'];
    case 'newest':
    default:
      return ['createdAt', 'desc'];
  }
}

export async function fetchUsersPaginated(options?: {
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  role?: string;
  plan?: string;
  searchQuery?: string;
  sortBy?: AdminUserSortKey;
  force?: boolean;
}): Promise<PaginatedUsersResult> {
  const count = Math.min(Math.max(1, options?.limitCount ?? 20), 100);
  const sortBy: AdminUserSortKey = options?.sortBy ?? 'newest';
  const hasSearch = Boolean(options?.searchQuery && options.searchQuery.trim());
  const isFirstPage = !options?.startAfterDoc;
  const isDefaultFirstPage =
    !hasSearch &&
    isFirstPage &&
    sortBy === 'newest' &&
    (!options?.role || options.role === 'all') &&
    (!options?.plan || options.plan === 'all') &&
    count === 20;

  // Return fresh in-memory first-page cache immediately (45s SWR) unless forced
  if (
    isDefaultFirstPage &&
    !options?.force &&
    cachedAdminUsersDirectory &&
    !cachedAdminUsersDirectory.fromSessionStorage &&
    Date.now() - cachedAdminUsersDirectory.loadedAt < ADMIN_SWR_FRESH_MS
  ) {
    return {
      users: cachedAdminUsersDirectory.users,
      totalCount: cachedAdminUsersDirectory.totalCount,
      user2faMap: cachedAdminUsersDirectory.user2faMap,
      securityLogs: cachedAdminUsersDirectory.securityLogs,
      lastDoc: cachedAdminUsersDirectory.lastDoc,
      hasMore: cachedAdminUsersDirectory.hasMore,
      queryTimeMs: 0,
      sortBy,
    };
  }

  if (isDefaultFirstPage && inFlightUsersFirstPagePromise && !options?.force) {
    return inFlightUsersFirstPagePromise;
  }

  const runUsersQuery = async (): Promise<PaginatedUsersResult> => {
    const startTime = performance.now();
    await ensureAdminAuthToken(false);

    const ref = collection(db, 'users');
    const [orderField, orderDir] = getFirestoreOrderForSort(sortBy);

    // Strictly paginate at `count` (50/page) using Firestore orderBy + startAfter + limit(count + 1).
    // Never load the entire users collection at once (free-tier read quota), and never combine
    // where(role/plan) with orderBy(differentField) since no composite index exists on `users`.
    const queryConstraints: QueryConstraint[] = [orderBy(orderField, orderDir)];
    if (options?.startAfterDoc && !hasSearch) {
      queryConstraints.push(startAfter(options.startAfterDoc));
    }
    queryConstraints.push(limit(count + 1));

    const fetchFirestoreTotalCount = async (): Promise<number | null> => {
      try {
        return await fetchFirestoreUsersTotalCount(Boolean(options?.force));
      } catch (err) {
        console.warn('[AdminService] fetchFirestoreUsersTotalCount warning:', err);
        return cachedUsersCollectionCount?.count ?? null;
      }
    };

    const fetchGuestAccounts = async (): Promise<UserProfile[]> => {
      if (!isFirstPage) return [];
      const res = await fetchAdminJsonWithRetry<{ ok?: boolean; guests?: any[] }>('/api/auth/guests');
      if (!res.ok || !res.data?.guests || !Array.isArray(res.data.guests)) return [];
      return res.data.guests
        .filter((g: any) => !g.upgradedToUid)
        .map((g: any) => ({
          uid: g.uid,
          email: '',
          username: g.username,
          displayName: g.displayName || g.username,
          name: g.displayName || g.username,
          role: 'student',
          plan: 'free',
          isGuest: true,
          accountType: 'guest',
          onboardingCompleted: true,
          testsCompleted: Number(g.testsCompleted || 0),
          totalQuestionsSolved: Number(g.questionsSolved || 0),
          streak: Number(g.streak || 0),
          createdAt: g.createdAt ?? null,
          // Never fabricate lastActiveAt from createdAt; only keep real stored lastActiveAt
          lastActiveAt: g.lastActiveAt ?? null,
        } as unknown as UserProfile));
    };

    const fetchD1TwoFactorAndUsers = async (): Promise<{
      user2faMap: Record<string, UserTwoFactorSummary>;
      proBadgesByUid: Record<string, { design: string; visible: boolean }>;
      plusBadgesByUid: Record<
        string,
        { plus_badge_design: number | null; plus_badge_visible: boolean }
      >;
      userActivityByUid: Record<string, D1UserActivitySummary>;
      d1Users: UserProfile[];
      securityLogs: any[];
    }> => {
      // On subsequent pages, reuse fresh cached 2FA/badge/activity metadata to avoid redundant calls
      if (
        !isFirstPage &&
        !options?.force &&
        cachedAdminUsersDirectory &&
        Date.now() - cachedAdminUsersDirectory.loadedAt < 120_000
      ) {
        return {
          user2faMap: { ...cachedAdminUsersDirectory.user2faMap },
          proBadgesByUid: { ...(cachedAdminUsersDirectory.proBadgesByUid || {}) },
          plusBadgesByUid: { ...(cachedAdminUsersDirectory.plusBadgesByUid || {}) },
          userActivityByUid: { ...(cachedAdminUsersDirectory.userActivityByUid || {}) },
          d1Users: [],
          securityLogs: cachedAdminUsersDirectory.securityLogs || [],
        };
      }

      const res = await fetchAdminJsonWithRetry<{
        ok?: boolean;
        users?: Record<string, Partial<UserTwoFactorSummary>>;
        statusByUid?: Record<string, Partial<UserTwoFactorSummary>>;
        users2fa?: Record<string, Partial<UserTwoFactorSummary>>;
        proBadgesByUid?: Record<string, { design: string; visible: boolean }>;
        plusBadgesByUid?: Record<
          string,
          { plus_badge_design: number | null; plus_badge_visible: boolean }
        >;
        userActivityByUid?: Record<string, D1UserActivitySummary>;
        d1Users?: any[];
        logs?: any[];
        auditLogs?: any[];
      }>('/api/auth/admin/2fa-status');
      if (!res.ok || !res.data) {
        if (res.errorMessage) {
          console.warn('[AdminService] /api/auth/admin/2fa-status warning:', res.errorMessage);
        }
        return {
          user2faMap: {},
          proBadgesByUid: {},
          plusBadgesByUid: {},
          userActivityByUid: {},
          d1Users: [],
          securityLogs: [],
        };
      }

      const rawMap = res.data.statusByUid || res.data.users2fa || res.data.users;
      const map: Record<string, UserTwoFactorSummary> = {};
      if (rawMap && typeof rawMap === 'object') {
        for (const [uid, rawSummary] of Object.entries(rawMap)) {
          map[uid] = normalizeTwoFactorSummary(rawSummary);
        }
      }

      const proBadgesByUid: Record<string, { design: string; visible: boolean }> =
        res.data.proBadgesByUid && typeof res.data.proBadgesByUid === 'object'
          ? res.data.proBadgesByUid
          : {};

      const plusBadgesByUid: Record<
        string,
        { plus_badge_design: number | null; plus_badge_visible: boolean }
      > =
        res.data.plusBadgesByUid && typeof res.data.plusBadgesByUid === 'object'
          ? res.data.plusBadgesByUid
          : {};

      const userActivityByUid: Record<string, D1UserActivitySummary> =
        res.data.userActivityByUid && typeof res.data.userActivityByUid === 'object'
          ? res.data.userActivityByUid
          : {};

      const d1UsersList: UserProfile[] = [];
      if (Array.isArray(res.data.d1Users)) {
        for (const row of res.data.d1Users) {
          if (!row?.uid || String(row.uid).startsWith('bot_')) continue;
          const summary = row.twoFactorStatus
            ? normalizeTwoFactorSummary(row.twoFactorStatus)
            : map[row.uid] || { ...DEFAULT_OFF_2FA_SUMMARY };
          map[row.uid] = summary;
          const pbEntry = proBadgesByUid[row.uid];
          const plbEntry = plusBadgesByUid[row.uid];
          const actEntry = userActivityByUid[row.uid];
          const d1Plan = getPlan(row);
          const d1ExpMs = Number(row.planExpiresAt || row.plan_expires_at || 0);
          const d1ExpTimestamp = d1ExpMs > 0 ? Timestamp.fromMillis(d1ExpMs) : null;
          const plusDesign =
            plbEntry !== undefined
              ? plbEntry.plus_badge_design
              : row.plus_badge_design !== undefined
              ? row.plus_badge_design === null
                ? null
                : resolvePlusBadgeId(row.plus_badge_design)
              : row.plus_badge_id !== undefined
              ? row.plus_badge_id === null
                ? null
                : resolvePlusBadgeId(row.plus_badge_id)
              : null;
          const plusVisible =
            plbEntry !== undefined
              ? plbEntry.plus_badge_visible
              : typeof row.plus_badge_visible === 'boolean'
              ? row.plus_badge_visible
              : true;
          d1UsersList.push({
            uid: String(row.uid),
            email: String(row.email || ''),
            username: row.username || null,
            displayName:
              row.displayName ||
              row.username ||
              (row.email ? String(row.email).split('@')[0] : 'Student'),
            name: row.displayName || row.username || '',
            role: row.role || 'student',
            plan: d1Plan,
            planTier: d1Plan,
            isPremium: d1Plan === 'pro' || d1Plan === 'plus',
            isPro: d1Plan === 'pro',
            isPlus: d1Plan === 'plus',
            ...(d1ExpTimestamp ? { planExpiresAt: d1ExpTimestamp } : {}),
            suspended: Boolean(row.suspended || row.isSuspended),
            isGuest: Boolean(row.isGuest || row.accountType === 'guest'),
            accountType: row.accountType === 'guest' ? 'guest' : 'registered',
            onboardingCompleted: true,
            totalQuestionsSolved: Number(row.totalQuestionsSolved ?? actEntry?.solved ?? 0),
            streak: Number(row.streak ?? actEntry?.streak ?? 0),
            createdAt: row.createdAt ?? null,
            lastActiveAt: row.lastActiveAt ?? null,
            twoFactorStatus: summary,
            proBadgeDesign: row.proBadgeDesign || pbEntry?.design || 'ember',
            proBadgeVisible: row.proBadgeVisible ?? pbEntry?.visible ?? true,
            plus_badge_design: plusDesign,
            plus_badge_visible: plusVisible,
            plus_badge_id: plusDesign,
          } as unknown as UserProfile);
        }
      }

      return {
        user2faMap: map,
        proBadgesByUid,
        plusBadgesByUid,
        userActivityByUid,
        d1Users: d1UsersList,
        securityLogs: Array.isArray(res.data.logs) ? res.data.logs : [],
      };
    };

    const fetchFirestoreUsersWithRetry = async () => {
      const q = query(ref, ...queryConstraints);
      try {
        return await withTimeout(getDocs(q), 6000, 'users-list-query');
      } catch (firstErr: any) {
        const code = String(firstErr?.code || '');
        if (code === 'DEADLINE_EXCEEDED') {
          throw firstErr;
        }
        await ensureAdminAuthToken(true);
        return await withTimeout(getDocs(q), 6000, 'users-list-query-retry');
      }
    };

    try {
      const [snapResult, firestoreCount, guestUsers, d1Bundle] = await Promise.all([
        fetchFirestoreUsersWithRetry().catch((err) => {
          console.warn(
            '[AdminService] Firestore ordered users query warning, falling back to D1/guest directory:',
            err
          );
          return null;
        }),
        fetchFirestoreTotalCount(),
        fetchGuestAccounts(),
        fetchD1TwoFactorAndUsers(),
      ]);

      const {
        user2faMap,
        proBadgesByUid,
        plusBadgesByUid,
        userActivityByUid,
        d1Users,
        securityLogs,
      } = d1Bundle;

      if (!snapResult && d1Users.length === 0 && guestUsers.length === 0) {
        throw new Error('Failed to load users from Firestore and D1.');
      }

      const rawSnapDocs = snapResult ? snapResult.docs : [];
      const firestoreHasMore = rawSnapDocs.length > count;
      const pageSnapDocs = firestoreHasMore ? rawSnapDocs.slice(0, count) : rawSnapDocs;
      const lastDoc = pageSnapDocs.length > 0 ? pageSnapDocs[pageSnapDocs.length - 1] : null;

      const firestoreUsers = pageSnapDocs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => !u.uid.startsWith('bot_') && (u as any).role !== 'bot');

      const byUid = new Map<string, UserProfile>();
      for (const u of firestoreUsers) {
        byUid.set(u.uid, u);
      }

      // Compute oldest real createdAt on the current Firestore page (for safe D1 newest-window merge)
      let pageOldestCreatedMs: number | null = null;
      if (sortBy === 'newest' && firestoreUsers.length > 0) {
        for (const u of firestoreUsers) {
          const ms = resolveUserJoinedAtMs(u);
          if (ms !== null && (pageOldestCreatedMs === null || ms < pageOldestCreatedMs)) {
            pageOldestCreatedMs = ms;
          }
        }
      }

      // Enrich fetched Firestore users with D1 metadata (2FA, plan/role overrides, proBadge).
      // Only add D1-only users that aren't in Firestore when Firestore failed, when we've reached
      // the end of Firestore pagination, or (on newest-first page 1) when a D1-only user is newer
      // than the page boundary so we never dump older Firestore page-2+ users into page 1.
      for (const d1u of d1Users) {
        if (byUid.has(d1u.uid)) {
          const existing = byUid.get(d1u.uid)!;
          const existingTier = getPlan(existing);
          const d1Tier = getPlan(d1u);
          const mergedPlan = planRank(d1Tier) > planRank(existingTier) ? d1Tier : existingTier;
          const mergedRole =
            d1u.role && d1u.role !== 'student'
              ? d1u.role
              : existing.role || d1u.role || 'student';
          const existingCreatedMs = resolveUserJoinedAtMs(existing);
          byUid.set(d1u.uid, {
            ...existing,
            username: existing.username || d1u.username,
            email: existing.email || d1u.email,
            displayName: existing.displayName || d1u.displayName,
            name: existing.name || d1u.name,
            role: mergedRole,
            plan: mergedPlan,
            planTier: mergedPlan,
            isPremium: mergedPlan === 'pro' || mergedPlan === 'plus',
            isPro: mergedPlan === 'pro',
            isPlus: mergedPlan === 'plus',
            planExpiresAt: existing.planExpiresAt || d1u.planExpiresAt || null,
            suspended: existing.suspended ?? d1u.suspended ?? false,
            // Only fall back to D1 createdAt in display if Firestore document has no real timestamp
            createdAt: existingCreatedMs !== null ? existing.createdAt : d1u.createdAt ?? null,
            proBadgeDesign: (existing as any).proBadgeDesign || (d1u as any).proBadgeDesign,
            proBadgeVisible: (existing as any).proBadgeVisible ?? (d1u as any).proBadgeVisible,
            plus_badge_design:
              (existing as any).plus_badge_design !== undefined
                ? (existing as any).plus_badge_design
                : (d1u as any).plus_badge_design,
            plus_badge_visible:
              (existing as any).plus_badge_visible ?? (d1u as any).plus_badge_visible,
          });
        } else {
          const d1CreatedMs = resolveUserJoinedAtMs(d1u);
          const shouldIncludeD1Only =
            !snapResult ||
            !firestoreHasMore ||
            (isFirstPage &&
              sortBy === 'newest' &&
              pageOldestCreatedMs !== null &&
              d1CreatedMs !== null &&
              d1CreatedMs > pageOldestCreatedMs);
          if (shouldIncludeD1Only) {
            byUid.set(d1u.uid, d1u);
          }
        }
      }

      // Merge active Guest accounts on page 1 (guests are stored in D1, not Firestore)
      if (isFirstPage && guestUsers.length > 0) {
        for (const gu of guestUsers) {
          if (!byUid.has(gu.uid)) {
            byUid.set(gu.uid, gu);
          }
        }
      }

      const enrichUser = (u: UserProfile): UserProfile => {
        const resolved2fa = user2faMap[u.uid] || u.twoFactorStatus || { ...DEFAULT_OFF_2FA_SUMMARY };
        user2faMap[u.uid] = resolved2fa;
        const pbEntry = proBadgesByUid[u.uid];
        const plbEntry = plusBadgesByUid[u.uid];
        const tier = u.isGuest || u.accountType === 'guest' ? 'free' : getPlan(u);

        // PRO badge fields (strictly from proBadgesByUid / pro fields)
        const pbDesign = pbEntry?.design || (u as any).proBadgeDesign || 'ember';
        const pbVisible = pbEntry ? pbEntry.visible : ((u as any).proBadgeVisible ?? true);
        const resolvedProBadge = tier === 'pro' && pbVisible ? pbDesign : null;

        // PLUS badge fields (strictly from plusBadgesByUid / plus fields, never from pro fields)
        const plusDesign =
          plbEntry !== undefined
            ? plbEntry.plus_badge_design
            : Object.prototype.hasOwnProperty.call(u, 'plus_badge_design')
            ? (u as any).plus_badge_design === null
              ? null
              : resolvePlusBadgeId((u as any).plus_badge_design)
            : Object.prototype.hasOwnProperty.call(u, 'plus_badge_id')
            ? u.plus_badge_id === null
              ? null
              : resolvePlusBadgeId(u.plus_badge_id)
            : null;
        const plusVisible =
          plbEntry !== undefined
            ? plbEntry.plus_badge_visible
            : typeof (u as any).plus_badge_visible === 'boolean'
            ? (u as any).plus_badge_visible
            : true;
        const resolvedPlusBadge = tier === 'plus' && plusVisible ? plusDesign : null;

        return {
          ...u,
          twoFactorStatus: resolved2fa,
          proBadgeDesign: pbDesign,
          proBadgeVisible: pbVisible,
          proBadge: resolvedProBadge,
          plus_badge_design: plusDesign,
          plus_badge_visible: plusVisible,
          plus_badge_id: plusDesign,
          plusBadge: resolvedPlusBadge,
        };
      };

      let allMatchingUsers = Array.from(byUid.values()).map(enrichUser);

      if (hasSearch && options?.searchQuery) {
        const qLower = options.searchQuery.toLowerCase().trim();
        const qNoSpaces = qLower.replace(/\s+/g, '');
        const qHandle = qNoSpaces.replace(/^@+/, '');

        if (qNoSpaces.length >= 2 && auth?.currentUser) {
          try {
            const sharedRes = await searchStudentsForKobans(options.searchQuery.trim(), {
              limit: count,
              includeInactive: true,
            });
            for (const su of sharedRes.users) {
              const resolved2fa = user2faMap[su.uid] || { ...DEFAULT_OFF_2FA_SUMMARY };
              user2faMap[su.uid] = resolved2fa;
              if (!byUid.has(su.uid)) {
                byUid.set(su.uid, {
                  uid: su.uid,
                  email: su.email,
                  displayName: su.displayName || su.name || su.email || 'Student',
                  name: su.name || su.displayName || '',
                  photoURL: null,
                  avatar: resolveCosmeticItemId(su.avatar, 'avatar') || undefined,
                  shortId: su.shortId,
                  plan: su.plan,
                  role: (su.role as any) || 'student',
                  kobans: su.kobans,
                  onboardingCompleted: true,
                  twoFactorStatus: resolved2fa,
                } as unknown as UserProfile);
              } else {
                const existing = byUid.get(su.uid)!;
                byUid.set(su.uid, {
                  ...existing,
                  email: existing.email || su.email,
                  displayName: existing.displayName || su.displayName || su.name,
                  twoFactorStatus: existing.twoFactorStatus || resolved2fa,
                  ...(typeof (existing as any).kobans === 'number' || typeof su.kobans === 'number'
                    ? {
                        kobans:
                          typeof (existing as any).kobans === 'number'
                            ? (existing as any).kobans
                            : su.kobans,
                      }
                    : {}),
                });
              }
            }
            allMatchingUsers = Array.from(byUid.values()).map(enrichUser);
          } catch (sharedErr) {
            console.warn(
              '[AdminService] Shared user search fallback in fetchUsersPaginated:',
              sharedErr
            );
          }
        }

        allMatchingUsers = allMatchingUsers.filter((u) => {
          const email = (u.email || '').toLowerCase().trim();
          const displayName = (u.displayName || '').toLowerCase().trim();
          const name = (u.name || '').toLowerCase().trim();
          const username = String((u as any).username || (u as any).handle || '')
            .toLowerCase()
            .trim()
            .replace(/^@+/, '');
          const shortId = (u.shortId || '').toLowerCase().trim();
          const uid = (u.uid || '').toLowerCase().trim();
          return (
            (email && (email.includes(qNoSpaces) || email.includes(qLower))) ||
            (displayName && (displayName.includes(qLower) || displayName.includes(qNoSpaces))) ||
            (name && (name.includes(qLower) || name.includes(qNoSpaces))) ||
            (username && (username.includes(qHandle) || username.includes(qNoSpaces))) ||
            (shortId && shortId.includes(qNoSpaces.replace(/^#/, ''))) ||
            (uid && uid.includes(qNoSpaces))
          );
        });
      }

      // Apply optional role/plan filter when explicitly passed by callers
      if (options?.role && options.role !== 'all') {
        allMatchingUsers = allMatchingUsers.filter((u) => u.role === options.role);
      }
      if (options?.plan && options.plan !== 'all') {
        allMatchingUsers = allMatchingUsers.filter((u) => getPlan(u) === options.plan);
      }

      // Enrich every returned user with real solved MCQs & PKT streak across Firestore + D1
      allMatchingUsers = await enrichUsersWithRealActivity(
        allMatchingUsers,
        userActivityByUid,
        Boolean(options?.force)
      );

      // Sort deterministically according to sortBy (unknown join dates ALWAYS at the very bottom)
      const sortedUsers = sortAdminUsers(allMatchingUsers, sortBy);

      const estimatedTotal = hasSearch
        ? sortedUsers.length
        : Math.max(
            (firestoreCount ?? 0) + (isFirstPage ? guestUsers.length : 0),
            sortedUsers.length
          );

      const hasMore = !hasSearch && firestoreHasMore;
      const queryTimeMs = Math.round(performance.now() - startTime);

      if (isDefaultFirstPage) {
        const breakdown = computeUserDirectoryBreakdown(sortedUsers, user2faMap);
        cachedAdminUsersDirectory = {
          users: sortedUsers,
          allDirectoryUsers: sortedUsers,
          user2faMap,
          proBadgesByUid,
          plusBadgesByUid,
          userActivityByUid,
          securityLogs,
          ...breakdown,
          totalCount: estimatedTotal,
          firestoreTotalCount: firestoreCount ?? undefined,
          sortBy,
          lastDoc,
          hasMore,
          loadedAt: Date.now(),
          queryTimeMs,
          fromSessionStorage: false,
        };
        syncCachedStatsWithUsersDirectory(cachedAdminUsersDirectory);
        // Save compact list-only snapshot to sessionStorage for instant reopen (SWR)
        const compactUsers = sortedUsers.slice(0, 20).map(projectUserForListCache);
        writeAdminSessionCache(ADMIN_USERS_P1_SESSION_KEY, {
          users: compactUsers,
          allDirectoryUsers: compactUsers,
          user2faMap,
          proBadgesByUid,
          plusBadgesByUid,
          userActivityByUid,
          securityLogs: [],
          ...breakdown,
          totalCount: estimatedTotal,
          firestoreTotalCount: firestoreCount ?? undefined,
          sortBy,
          hasMore,
          loadedAt: Date.now(),
          queryTimeMs,
        });
      }

      console.log(
        `%c[AdminService] fetchUsersPaginated [sort=${sortBy}] (${sortedUsers.length} loaded / ${estimatedTotal} total, hasMore=${hasMore}) in ${queryTimeMs}ms`,
        'color: #10b981;'
      );

      return {
        users: sortedUsers,
        totalCount: estimatedTotal,
        user2faMap,
        securityLogs,
        lastDoc,
        hasMore,
        queryTimeMs,
        sortBy,
      };
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      console.error('[AdminService] fetchUsersPaginated error:', err);
      throw new AdminFirestoreError(
        e?.message || 'Failed to fetch users from collection "users". Check Firestore permissions.',
        e?.code || 'users-fetch-error',
        'users',
        'fetchUsersPaginated'
      );
    }
  };

  if (isDefaultFirstPage) {
    inFlightUsersFirstPagePromise = runUsersQuery().finally(() => {
      inFlightUsersFirstPagePromise = null;
    });
    return inFlightUsersFirstPagePromise;
  }

  return runUsersQuery();
}

// ─── ADMIN KOBANS STUDENT SEARCH (CANONICAL USERS + LEFT JOIN WALLETS) ───────
export type KobanStudentStatus = 'active' | 'suspended' | 'inactive' | 'orphan' | 'missing-name';

export interface KobanStudentSearchResult {
  id: string;
  uid: string;
  name: string;
  displayName: string;
  handle: string;
  email: string;
  avatar: string | null;
  shortId: string;
  plan: PlanTier;
  role: string;
  status: KobanStudentStatus;
  kobans: number;
  hasWallet: boolean;
}

export class AdminSearchHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminSearchHttpError';
    this.status = status;
  }
}

type KobanSearchSnapTuple = [
  Awaited<ReturnType<typeof getDocs>>,
  Awaited<ReturnType<typeof getDocs>> | null,
  Awaited<ReturnType<typeof getDocs>> | null,
  Awaited<ReturnType<typeof getDocs>> | null,
  Awaited<ReturnType<typeof getDocs>> | null
];

let cachedKobanSearchSnapshots: { at: number; snaps: KobanSearchSnapTuple } | null = null;
let inFlightKobanSearchSnapshots: Promise<KobanSearchSnapTuple> | null = null;

async function getKobanSearchCandidateSnapshots(): Promise<KobanSearchSnapTuple> {
  if (cachedKobanSearchSnapshots && Date.now() - cachedKobanSearchSnapshots.at < 60_000) {
    return cachedKobanSearchSnapshots.snaps;
  }
  if (inFlightKobanSearchSnapshots) {
    return inFlightKobanSearchSnapshots;
  }
  inFlightKobanSearchSnapshots = Promise.all([
    getDocs(query(collection(db, 'users'), limit(1000))),
    getDocs(query(collection(db, 'publicProfiles'), limit(1000))).catch(() => null),
    getDocs(query(collection(db, 'wallets'), limit(1000))).catch(() => null),
    getDocs(query(collection(db, 'kobanRequests'), limit(300))).catch(() => null),
    getDocs(query(collection(db, 'paymentRequests'), limit(300))).catch(() => null),
  ])
    .then((snaps) => {
      cachedKobanSearchSnapshots = { at: Date.now(), snaps };
      return snaps;
    })
    .finally(() => {
      inFlightKobanSearchSnapshots = null;
    });
  return inFlightKobanSearchSnapshots;
}

export async function searchStudentsForKobans(
  rawQuery: string,
  options?: {
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
    signal?: AbortSignal;
  }
): Promise<{
  users: KobanStudentSearchResult[];
  total: number;
  hasMore: boolean;
}> {
  const qTrimmed = String(rawQuery || '').trim();
  const qNorm = qTrimmed.toLowerCase().replace(/\s+/g, ' ');
  const qNoSpaces = qTrimmed.toLowerCase().replace(/\s+/g, '');
  const qHandle = qNoSpaces.replace(/^@+/, '');
  const qShortId = qNoSpaces.replace(/^#/, '');
  const limitCount = Math.min(25, Math.max(1, options?.limit ?? 10));
  const offsetCount = Math.max(0, options?.offset ?? 0);

  if (qNoSpaces.length < 2) {
    return { users: [], total: 0, hasMore: false };
  }

  if (options?.signal?.aborted) {
    throw new DOMException('Search aborted', 'AbortError');
  }

  // 1. Verify Admin/Superadmin role server-side via shared /api/admin/users/search endpoint
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new AdminSearchHttpError('Search failed (401): Not signed in.', 401);
  }

  const token = await currentUser.getIdToken();
  const serverUrl = `/api/admin/users/search?q=${encodeURIComponent(qTrimmed)}&limit=${limitCount}`;
  const serverResp = await fetch(serverUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: options?.signal,
  });

  if (!serverResp.ok) {
    console.error(`[AdminService] Student search failed: HTTP ${serverResp.status} for GET ${serverUrl}`);
    let serverErrMsg = `Search failed (${serverResp.status})`;
    try {
      const errBody = await serverResp.json();
      if (errBody?.error) {
        serverErrMsg = `Search failed (${serverResp.status}): ${errBody.error}`;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new AdminSearchHttpError(serverErrMsg, serverResp.status);
  }

  const serverJson = (await serverResp.json().catch(() => ({ users: [] }))) as {
    users?: Array<{
      id: string;
      name: string;
      handle: string;
      email: string;
      avatar: string | null;
      plan: string;
      role: string;
      status: KobanStudentStatus;
      kobans: number;
    }>;
  };

  if (options?.signal?.aborted) {
    throw new DOMException('Search aborted', 'AbortError');
  }

  // 2. Query Firestore canonical `users` collection + LEFT JOIN `publicProfiles`, `wallets`, and requests (cached 60s across keystrokes)
  const [usersSnap, pubSnap, walletsSnap, kobanReqSnap, paymentReqSnap] =
    await getKobanSearchCandidateSnapshots();

  if (options?.signal?.aborted) {
    throw new DOMException('Search aborted', 'AbortError');
  }

  // Map wallets by uid for LEFT JOIN
  const walletMap = new Map<string, number>();
  if (walletsSnap) {
    for (const wDoc of walletsSnap.docs) {
      const wData = wDoc.data();
      const bal = typeof wData.balance === 'number' && Number.isFinite(wData.balance) ? wData.balance : 0;
      walletMap.set(wDoc.id, bal);
    }
  }

  // Map publicProfiles by uid
  const pubProfileMap = new Map<string, Record<string, any>>();
  if (pubSnap) {
    for (const pDoc of pubSnap.docs) {
      pubProfileMap.set(pDoc.id, pDoc.data());
    }
  }

  const candidatesByUid = new Map<string, KobanStudentSearchResult & { phone?: string }>();
  const uidByEmail = new Map<string, string>();

  const registerCandidate = (cand: KobanStudentSearchResult & { phone?: string }) => {
    const uid = String(cand.uid || cand.id || '').trim();
    if (!uid || uid.startsWith('bot_') || cand.role === 'bot') return;

    const cleanEmail = String(cand.email || '').trim().toLowerCase();
    const existingUidForEmail = cleanEmail ? uidByEmail.get(cleanEmail) : undefined;
    const targetKey = existingUidForEmail && candidatesByUid.has(existingUidForEmail) ? existingUidForEmail : uid;

    const existing = candidatesByUid.get(targetKey);
    if (!existing) {
      candidatesByUid.set(targetKey, { ...cand, id: targetKey, uid: targetKey });
      if (cleanEmail) uidByEmail.set(cleanEmail, targetKey);
    } else {
      const hasRealExistingName =
        Boolean(existing.name) &&
        existing.name !== 'Unnamed Student' &&
        existing.name !== existing.email;
      const mergedName = hasRealExistingName ? existing.name : cand.name || existing.name;
      const mergedEmail = existing.email || cleanEmail;
      const mergedHandle = existing.handle || cand.handle || (mergedEmail ? mergedEmail.split('@')[0] : '');
      const hasWallet = existing.hasWallet || cand.hasWallet || walletMap.has(targetKey);
      const kobans = walletMap.has(targetKey)
        ? walletMap.get(targetKey)!
        : Math.max(existing.kobans, cand.kobans);

      let mergedStatus: KobanStudentStatus = existing.status;
      if (existing.status === 'orphan' && cand.status !== 'orphan') {
        mergedStatus = cand.status;
      }

      candidatesByUid.set(targetKey, {
        ...existing,
        name: mergedName,
        displayName: mergedName || mergedEmail || 'Student',
        handle: mergedHandle,
        email: mergedEmail,
        avatar: existing.avatar || cand.avatar,
        shortId: existing.shortId || cand.shortId || targetKey.slice(0, 5).toUpperCase(),
        plan:
          existing.plan === 'plus' || cand.plan === 'plus'
            ? 'plus'
            : existing.plan === 'pro' || cand.plan === 'pro'
            ? 'pro'
            : 'free',
        role: existing.role !== 'student' ? existing.role : cand.role,
        status: mergedStatus,
        kobans,
        hasWallet,
        phone: existing.phone || cand.phone,
      });
      if (mergedEmail) uidByEmail.set(mergedEmail, targetKey);
    }
  };

  // A. Canonical Firestore `users` collection
  const userIdsInUsersCollection = new Set<string>();
  for (const uDoc of usersSnap.docs) {
    const uid = uDoc.id;
    if (uid.startsWith('bot_')) continue;
    const data = uDoc.data() as Record<string, any>;
    if (data.role === 'bot' || data.deleted === true || data.status === 'deleted') continue;

    userIdsInUsersCollection.add(uid);
    const pub = pubProfileMap.get(uid) || {};
    const email = String(data.email || pub.email || '').trim().toLowerCase();
    const rawName = String(
      data.displayName || data.fullName || data.name || pub.displayName || pub.name || ''
    ).trim();
    const hasMissingName = !rawName || rawName === 'Unnamed Student';
    const rawHandle = String(
      data.username || data.handle || pub.username || pub.handle || (email ? email.split('@')[0] : '')
    )
      .trim()
      .replace(/^@+/, '');

    let status: KobanStudentStatus = 'active';
    if (data.suspended === true || data.isBanned === true || data.status === 'suspended') {
      status = 'suspended';
    } else if (data.status === 'inactive' || data.active === false) {
      status = 'inactive';
    } else if (hasMissingName) {
      status = 'missing-name';
    }

    const hasWallet = walletMap.has(uid);
    const kobans = hasWallet
      ? walletMap.get(uid)!
      : typeof data.kobans === 'number'
      ? data.kobans
      : 0;

    registerCandidate({
      id: uid,
      uid,
      name: hasMissingName ? '' : rawName,
      displayName: hasMissingName ? email || 'Unnamed Student' : rawName,
      handle: rawHandle,
      email,
      avatar:
        resolveCosmeticItemId(
          data.equipped?.avatar ||
            data.equippedAvatar ||
            data.avatar ||
            pub.equipped?.avatar ||
            pub.equippedAvatar ||
            pub.avatar,
          'avatar'
        ) || null,
      shortId: String(data.shortId || pub.shortId || uid.slice(0, 5).toUpperCase()),
      plan: getPlan(data),
      role: String(data.role || 'student'),
      status,
      kobans,
      hasWallet,
      phone: String(data.phone || data.whatsapp || data.phoneNumber || ''),
    });
  }

  // B. Orphan `publicProfiles` (documents in publicProfiles without a `users/{uid}` doc)
  if (pubSnap) {
    for (const pDoc of pubSnap.docs) {
      const uid = pDoc.id;
      if (uid.startsWith('bot_') || userIdsInUsersCollection.has(uid)) continue;
      const pub = pDoc.data() as Record<string, any>;
      if (pub.role === 'bot') continue;
      const email = String(pub.email || '').trim().toLowerCase();
      const rawName = String(pub.displayName || pub.name || '').trim();
      const rawHandle = String(pub.username || pub.handle || (email ? email.split('@')[0] : ''))
        .trim()
        .replace(/^@+/, '');
      const hasWallet = walletMap.has(uid);

      registerCandidate({
        id: uid,
        uid,
        name: rawName === 'Unnamed Student' ? '' : rawName,
        displayName: rawName || email || `Orphan (${uid.slice(0, 6)})`,
        handle: rawHandle,
        email,
        avatar:
          resolveCosmeticItemId(
            pub.equipped?.avatar || pub.equippedAvatar || pub.avatar,
            'avatar'
          ) || null,
        shortId: String(pub.shortId || uid.slice(0, 5).toUpperCase()),
        plan: getPlan(pub),
        role: String(pub.role || 'student'),
        status: 'orphan',
        kobans: hasWallet ? walletMap.get(uid)! : 0,
        hasWallet,
      });
    }
  }

  // C. Orphan `wallets` (wallet rows whose user profile is missing)
  for (const [wUid, bal] of walletMap.entries()) {
    if (wUid.startsWith('bot_') || candidatesByUid.has(wUid)) continue;
    registerCandidate({
      id: wUid,
      uid: wUid,
      name: '',
      displayName: `Orphan Wallet (${wUid.slice(0, 6)})`,
      handle: wUid.slice(0, 8),
      email: '',
      avatar: null,
      shortId: wUid.slice(0, 5).toUpperCase(),
      plan: 'free',
      role: 'student',
      status: 'orphan',
      kobans: bal,
      hasWallet: true,
    });
  }

  // D. Merge student accounts referenced in `kobanRequests` and `paymentRequests`
  if (kobanReqSnap) {
    for (const rDoc of kobanReqSnap.docs) {
      const r = rDoc.data() as Record<string, any>;
      const uid = String(r.userId || '').trim();
      if (!uid) continue;
      const email = String(r.userEmail || '').trim().toLowerCase();
      const name = String(r.userName || '').trim();
      registerCandidate({
        id: uid,
        uid,
        name: name === 'Student' ? '' : name,
        displayName: name || email || 'Student',
        handle: email ? email.split('@')[0] : '',
        email,
        avatar: null,
        shortId: uid.slice(0, 5).toUpperCase(),
        plan: 'free',
        role: 'student',
        status: userIdsInUsersCollection.has(uid) ? 'active' : 'orphan',
        kobans: walletMap.get(uid) ?? 0,
        hasWallet: walletMap.has(uid),
      });
    }
  }

  if (paymentReqSnap) {
    for (const rDoc of paymentReqSnap.docs) {
      const r = rDoc.data() as Record<string, any>;
      const uid = String(r.userId || '').trim();
      if (!uid) continue;
      const email = String(r.userEmail || '').trim().toLowerCase();
      const name = String(r.userName || '').trim();
      registerCandidate({
        id: uid,
        uid,
        name: name === 'Student' ? '' : name,
        displayName: name || email || 'Student',
        handle: email ? email.split('@')[0] : '',
        email,
        avatar: null,
        shortId: uid.slice(0, 5).toUpperCase(),
        plan: 'free',
        role: 'student',
        status: userIdsInUsersCollection.has(uid) ? 'active' : 'orphan',
        kobans: walletMap.get(uid) ?? 0,
        hasWallet: walletMap.has(uid),
      });
    }
  }

  // E. Merge server-side D1 & Firebase Identity Toolkit matches
  for (const sUser of serverJson.users || []) {
    const uid = String(sUser.id || '').trim();
    if (!uid) continue;
    const email = String(sUser.email || '').trim().toLowerCase();
    registerCandidate({
      id: uid,
      uid,
      name: sUser.name || '',
      displayName: sUser.name || email || 'Student',
      handle: sUser.handle || (email ? email.split('@')[0] : ''),
      email,
      avatar: sUser.avatar || null,
      shortId: uid.slice(0, 5).toUpperCase(),
      plan: getPlan(sUser),
      role: sUser.role || 'student',
      status: userIdsInUsersCollection.has(uid) ? sUser.status : 'orphan',
      kobans: walletMap.get(uid) ?? sUser.kobans ?? 0,
      hasWallet: walletMap.has(uid),
    });
  }

  // 3. Score and filter all merged candidates case-insensitively
  const scoredMatches: Array<{ item: KobanStudentSearchResult; score: number }> = [];

  for (const cand of candidatesByUid.values()) {
    const emailLower = (cand.email || '').toLowerCase().trim();
    const nameLower = (cand.name || '').toLowerCase().trim();
    const displayLower = (cand.displayName || '').toLowerCase().trim();
    const handleLower = (cand.handle || '').toLowerCase().trim().replace(/^@+/, '');
    const uidLower = (cand.uid || '').toLowerCase().trim();
    const shortIdLower = (cand.shortId || '').toLowerCase().trim();
    const phoneLower = (cand.phone || '').toLowerCase().replace(/\s+/g, '');

    let score = 0;
    if (emailLower && emailLower === qNoSpaces) {
      score = 100;
    } else if (emailLower && emailLower.startsWith(qNoSpaces)) {
      score = 90;
    } else if (handleLower && handleLower === qHandle) {
      score = 88;
    } else if (uidLower === qNoSpaces || shortIdLower === qShortId) {
      score = 85;
    } else if (emailLower && emailLower.includes(qNoSpaces)) {
      score = 80;
    } else if (nameLower && (nameLower === qNorm || displayLower === qNorm)) {
      score = 78;
    } else if (nameLower && (nameLower.startsWith(qNorm) || nameLower.includes(qNorm) || nameLower.includes(qNoSpaces))) {
      score = 72;
    } else if (displayLower && (displayLower.includes(qNorm) || displayLower.includes(qNoSpaces))) {
      score = 68;
    } else if (handleLower && handleLower.includes(qHandle)) {
      score = 65;
    } else if (shortIdLower.includes(qShortId) || uidLower.includes(qNoSpaces)) {
      score = 55;
    } else if (phoneLower && qNoSpaces.length >= 4 && phoneLower.includes(qNoSpaces)) {
      score = 50;
    }

    if (score > 0) {
      // Return only safe fields
      const safeItem: KobanStudentSearchResult = {
        id: cand.uid,
        uid: cand.uid,
        name: cand.name,
        displayName: cand.displayName,
        handle: cand.handle,
        email: cand.email,
        avatar: cand.avatar,
        shortId: cand.shortId,
        plan: cand.plan,
        role: cand.role,
        status: cand.status,
        kobans: cand.kobans,
        hasWallet: cand.hasWallet,
      };
      scoredMatches.push({ item: safeItem, score });
    }
  }

  scoredMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.item.kobans || 0) - (a.item.kobans || 0);
  });

  const allMatched = scoredMatches.map((m) => m.item);
  const paged = allMatched.slice(offsetCount, offsetCount + limitCount);

  return {
    users: paged,
    total: allMatched.length,
    hasMore: offsetCount + limitCount < allMatched.length,
  };
}

/**
 * Lazily initializes `wallets/{uid}` with `balance: 0` if the selected user does not
 * have a wallet row yet, and returns the current live balance.
 */
export async function ensureStudentWalletInitialized(uid: string): Promise<number> {
  const walletRef = doc(db, 'wallets', uid);
  const snap = await getDoc(walletRef);
  if (snap.exists()) {
    const data = snap.data();
    return typeof data.balance === 'number' && Number.isFinite(data.balance) ? data.balance : 0;
  }

  await setDoc(
    walletRef,
    {
      userId: uid,
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return 0;
}

// ─── SUPERADMIN CHECK & RESET ALL USERS ──────────────────────────────────────
export function isProtectedSuperAdmin(
  userOrProfile: { email?: string | null; role?: string | null; uid?: string | null; superAdmin?: boolean } | null | undefined
): boolean {
  if (!userOrProfile) return false;
  return userOrProfile.superAdmin === true;
}

export interface UserResetPreview {
  totalUsers: number;
  usersToDelete: { uid: string; email: string; displayName?: string | null }[];
  superadminsKept: { uid: string; email: string; role?: string }[];
}

export async function previewResetUsers(): Promise<UserResetPreview> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const usersToDelete: { uid: string; email: string; displayName?: string | null }[] = [];
  const superadminsKept: { uid: string; email: string; role?: string }[] = [];
  const currentUid = auth?.currentUser?.uid;

  usersSnap.docs.forEach((d) => {
    const data = d.data() as UserProfile;
    const item = {
      uid: d.id,
      email: data.email || 'no-email',
      displayName: data.displayName || data.name,
      role: data.role,
    };

    if (currentUid && d.id === currentUid) {
      superadminsKept.push(item);
    } else {
      usersToDelete.push(item);
    }
  });

  return {
    totalUsers: usersSnap.size,
    usersToDelete,
    superadminsKept,
  };
}

export async function executeResetAllUsers(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ deletedUsersCount: number; deletedRecordsCount: number; keptSuperadmins: string[] }> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Unauthorized: Authentication required.');
  }
  const tokenResult = await currentUser.getIdTokenResult();
  if (tokenResult.claims?.superAdmin !== true) {
    throw new Error('Unauthorized: Only a verified superAdmin (custom claim) can perform a user reset.');
  }

  const preview = await previewResetUsers();
  const targetUsers = preview.usersToDelete;
  const total = targetUsers.length;

  if (total === 0) {
    return {
      deletedUsersCount: 0,
      deletedRecordsCount: 0,
      keptSuperadmins: preview.superadminsKept.map((s) => s.email),
    };
  }

  let totalDeletedRecords = 0;
  let processedUsers = 0;

  // Process deletions in batches of 400 operations using writeBatch
  let currentBatch = writeBatch(db);
  let batchOps = 0;

  const commitBatchIfNeeded = async (force = false) => {
    if (batchOps >= 400 || (force && batchOps > 0)) {
      await currentBatch.commit();
      totalDeletedRecords += batchOps;
      currentBatch = writeBatch(db);
      batchOps = 0;
    }
  };

  for (const u of targetUsers) {
    const uid = u.uid;

    // 1. Delete users/{uid}
    currentBatch.delete(doc(db, 'users', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 2. Delete streaks/{uid}
    currentBatch.delete(doc(db, 'streaks', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 3. Delete referrals/{uid}
    currentBatch.delete(doc(db, 'referrals', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 4. Delete leaderboard/{uid}
    currentBatch.delete(doc(db, 'leaderboard', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 5. Delete captainApplications/{uid} & crewApplications/{uid}
    currentBatch.delete(doc(db, 'captainApplications', uid));
    batchOps++;
    await commitBatchIfNeeded();

    currentBatch.delete(doc(db, 'crewApplications', uid));
    batchOps++;
    await commitBatchIfNeeded();

    // 6. Delete related attempts for this user
    try {
      const attemptsSnap = await getDocs(
        query(collection(db, 'attempts'), where('userId', '==', uid), limit(40))
      );
      for (const aDoc of attemptsSnap.docs) {
        currentBatch.delete(aDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping attempts cleanup for ${uid}:`, e);
    }

    // 7. Delete related paymentRequests for this user
    try {
      const paymentsSnap = await getDocs(
        query(collection(db, 'paymentRequests'), where('userId', '==', uid), limit(20))
      );
      for (const pDoc of paymentsSnap.docs) {
        currentBatch.delete(pDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping payments cleanup for ${uid}:`, e);
    }

    // 8. Delete related reviews for this user
    try {
      const reviewsSnap = await getDocs(
        query(collection(db, 'reviews'), where('userId', '==', uid), limit(20))
      );
      for (const rDoc of reviewsSnap.docs) {
        currentBatch.delete(rDoc.ref);
        batchOps++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.warn(`[ResetUsers] Skipping reviews cleanup for ${uid}:`, e);
    }

    processedUsers++;
    if (onProgress) {
      onProgress(processedUsers, total);
    }
  }

  // Final batch commit
  await commitBatchIfNeeded(true);

  // Single entry to admin audit trail
  await logAdminAction(
    adminEmail,
    'reset_all_users',
    {
      deletedUsersCount: targetUsers.length,
      deletedRecordsCount: totalDeletedRecords,
      keptSuperadmins: preview.superadminsKept.map((s) => s.email),
    }
  );

  return {
    deletedUsersCount: targetUsers.length,
    deletedRecordsCount: totalDeletedRecords,
    keptSuperadmins: preview.superadminsKept.map((s) => s.email),
  };
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await fetchUsersPaginated({ limitCount: 50 });
  return res.users;
}

export async function updateUserOverride(
  adminEmail: string,
  targetUid: string,
  targetEmail: string,
  updates: Partial<UserProfile> & { extendMonths?: number },
  previous: Partial<UserProfile>
): Promise<UserProfile> {
  const ref = doc(db, 'users', targetUid);

  // Convert Timestamp planExpiresAt to ms for backend API
  let planExpiresAtMs: number | null | undefined = undefined;
  if (updates.planExpiresAt !== undefined) {
    if (updates.planExpiresAt === null) {
      planExpiresAtMs = null;
    } else if (typeof (updates.planExpiresAt as any)?.toMillis === 'function') {
      planExpiresAtMs = (updates.planExpiresAt as any).toMillis();
    } else if (typeof (updates.planExpiresAt as any)?.seconds === 'number') {
      planExpiresAtMs = (updates.planExpiresAt as any).seconds * 1000;
    } else if (typeof updates.planExpiresAt === 'number') {
      planExpiresAtMs = updates.planExpiresAt;
    }
  }

  // 1. Persist to D1 / backend override endpoint first (enforces permissions & last super_admin safeguard)
  const currentUser = auth?.currentUser;
  let serverUser: Record<string, any> | null = null;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    const overrideRes = await fetch(
      `/api/admin/users/${encodeURIComponent(targetUid)}/override`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: targetUid,
          email: targetEmail || previous.email || '',
          displayName: updates.displayName ?? previous.displayName ?? '',
          role: updates.role,
          customRole: updates.customRole,
          plan: updates.plan,
          isPremium: updates.isPremium,
          planExpiresAtMs,
          extendMonths: updates.extendMonths,
          suspended: updates.suspended,
        }),
      }
    );
    const overrideJson = await overrideRes.json().catch(() => ({}));
    if (!overrideRes.ok) {
      const err: any = new Error(
        overrideJson?.error || `Failed to save user changes (HTTP ${overrideRes.status}).`
      );
      err.code = overrideJson?.code || `HTTP_${overrideRes.status}`;
      err.status = overrideRes.status;
      throw err;
    }
    if (overrideJson?.user) {
      serverUser = overrideJson.user;
    }
  }

  // 2. Sync to Firestore `users/{targetUid}` & `publicProfiles/{targetUid}`
  const safeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'extendMonths') {
      safeUpdates[key] = value;
    }
  }
  if (serverUser?.planExpiresAtMs && !safeUpdates.planExpiresAt) {
    safeUpdates.planExpiresAt = Timestamp.fromMillis(Number(serverUser.planExpiresAtMs));
  }

  let verifiedProfile: UserProfile | null = null;
  try {
    await setDoc(ref, safeUpdates, { merge: true });
    const verifiedSnap = await getDocFromServer(ref);
    if (verifiedSnap.exists()) {
      verifiedProfile = { uid: targetUid, ...(verifiedSnap.data() as UserProfile) };
    }
  } catch (fsErr) {
    console.warn('[AdminService] Firestore user doc sync notice (D1 persisted):', fsErr);
  }

  try {
    const pubRef = doc(db, 'publicProfiles', targetUid);
    const pubPatch: Record<string, unknown> = { uid: targetUid };
    if (updates.role !== undefined) pubPatch.role = updates.role;
    if (updates.customRole !== undefined) pubPatch.customRole = updates.customRole;
    await setDoc(pubRef, pubPatch, { merge: true });
  } catch {
    // Non-fatal
  }

  await logAdminAction(
    adminEmail,
    'user_override',
    { updates: safeUpdates, previous, verified: Boolean(verifiedProfile || serverUser) },
    targetUid,
    targetEmail
  );

  const finalPlan: PlanTier = normalizePlanTier(
    serverUser?.plan ?? updates.plan ?? (updates as any).planTier ?? previous.plan
  );
  const finalRole = (serverUser?.role ?? updates.role ?? previous.role ?? 'student') as UserProfile['role'];
  const finalExpTimestamp =
    serverUser?.planExpiresAtMs && Number(serverUser.planExpiresAtMs) > 0
      ? Timestamp.fromMillis(Number(serverUser.planExpiresAtMs))
      : updates.planExpiresAt !== undefined
      ? updates.planExpiresAt
      : previous.planExpiresAt ?? null;

  const mergedResult: UserProfile = {
    ...(previous as UserProfile),
    ...(verifiedProfile || {}),
    ...(updates as Partial<UserProfile>),
    uid: targetUid,
    email: targetEmail || previous.email || '',
    role: finalRole,
    plan: finalPlan,
    planTier: finalPlan,
    isPremium: finalPlan !== 'free',
    isPro: finalPlan === 'pro',
    isPlus: finalPlan === 'plus',
    proUntil: finalPlan === 'pro' ? finalExpTimestamp : null,
    plusUntil: finalPlan === 'plus' ? finalExpTimestamp : null,
    planExpiresAt: finalExpTimestamp,
    suspended: Boolean(serverUser?.suspended ?? updates.suspended ?? previous.suspended),
  };

  // Update in-memory directory cache so subsequent reads do not revert to stale state
  if (cachedAdminUsersDirectory) {
    const patchList = (list: UserProfile[]) =>
      list.map((u) => (u.uid === targetUid ? { ...u, ...mergedResult } : u));
    cachedAdminUsersDirectory.users = patchList(cachedAdminUsersDirectory.users);
    cachedAdminUsersDirectory.allDirectoryUsers = patchList(
      cachedAdminUsersDirectory.allDirectoryUsers
    );
  }

  return mergedResult;
}

export async function bulkUpdateUsersPlan(
  adminEmail: string,
  targets: Array<{ uid: string; email?: string; profile?: Partial<UserProfile> }>,
  targetPlan: PlanTier,
  durationDays = 30
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;
  const nowMs = Date.now();
  const safeDays = Math.max(1, Math.min(1825, Math.round(durationDays)));
  const expTimestamp =
    targetPlan === 'free'
      ? null
      : Timestamp.fromMillis(nowMs + safeDays * 24 * 60 * 60 * 1000);

  for (const target of targets) {
    try {
      const updates: Partial<UserProfile> = {
        plan: targetPlan,
        planTier: targetPlan,
        isPremium: targetPlan !== 'free',
        isPro: targetPlan === 'pro',
        isPlus: targetPlan === 'plus',
        premiumSource: targetPlan === 'free' ? null : 'admin_bulk_override',
        planExpiresAt: expTimestamp,
        premiumExpiresAt: expTimestamp,
        proUntil: targetPlan === 'pro' ? expTimestamp : null,
        plusUntil: targetPlan === 'plus' ? expTimestamp : null,
      };
      await updateUserOverride(
        adminEmail,
        target.uid,
        target.email || target.profile?.email || '',
        updates,
        target.profile || { uid: target.uid, email: target.email || '' }
      );
      updated += 1;
    } catch (err) {
      console.warn('[AdminService] bulkUpdateUsersPlan item failed:', target.uid, err);
      failed += 1;
    }
  }
  return { updated, failed };
}

export interface PlanAnalyticsStats {
  freeCount: number;
  proCount: number;
  plusCount: number;
  expiringSoonCount: number;
  proRevenuePkr: number;
  plusRevenuePkr: number;
  proToPlusConversions: number;
}

let cachedPlanAnalytics: { at: number; data: PlanAnalyticsStats } | null = null;
let inFlightPlanAnalytics: Promise<PlanAnalyticsStats> | null = null;

export function getCachedPlanAnalyticsStats(): PlanAnalyticsStats | null {
  if (cachedPlanAnalytics && Date.now() - cachedPlanAnalytics.at < ADMIN_SWR_FRESH_MS) {
    return cachedPlanAnalytics.data;
  }
  return null;
}

async function computePlanAnalyticsWithTotal(totalUsers: number): Promise<PlanAnalyticsStats> {
  await ensureAdminAuthToken(false);

  // Fetch config/plans + paymentRequests + planActivations + paid users with timeout & retry.
  // Never silently coerce a failed collection read into [] / 0.
  const [
    plansConfigRes,
    paymentsRes,
    activationsRes,
    paidUsersByPlanRes,
    plusUsersByFlagRes,
    proUsersByFlagRes,
  ] = await Promise.allSettled([
    fetchPlansConfigOnce(),
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'paymentRequests'), limit(500)),
      'firestore:paymentRequests',
      8000
    ),
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'planActivations'), limit(500)),
      'firestore:planActivations',
      8000
    ),
    getDocsWithTimeoutAndRetry(
      query(
        collection(db, 'users'),
        where('plan', 'in', [
          'pro',
          'pro_monthly',
          'pro_annual',
          'plus',
          'plus_monthly',
          'plus_annual',
        ]),
        limit(500)
      ),
      'firestore:users (paid plans)',
      8000
    ),
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'users'), where('isPlus', '==', true), limit(200)),
      'firestore:users (isPlus)',
      8000
    ),
    getDocsWithTimeoutAndRetry(
      query(collection(db, 'users'), where('isPro', '==', true), limit(200)),
      'firestore:users (isPro)',
      8000
    ),
  ]);

  if (
    paidUsersByPlanRes.status === 'rejected' ||
    plusUsersByFlagRes.status === 'rejected' ||
    proUsersByFlagRes.status === 'rejected'
  ) {
    const err: any =
      (paidUsersByPlanRes.status === 'rejected' && paidUsersByPlanRes.reason) ||
      (plusUsersByFlagRes.status === 'rejected' && plusUsersByFlagRes.reason) ||
      (proUsersByFlagRes.status === 'rejected' && proUsersByFlagRes.reason);
    throw new AdminStatCardError(
      'firestore:users (paid plans)',
      err?.code || 500,
      err?.message || 'Failed to load active Pro/Plus subscribers'
    );
  }

  if (paymentsRes.status === 'rejected') {
    const err: any = paymentsRes.reason;
    throw new AdminStatCardError(
      'firestore:paymentRequests',
      err?.code || 500,
      err?.message || 'Failed to load payment revenue records'
    );
  }

  if (activationsRes.status === 'rejected') {
    const err: any = activationsRes.reason;
    throw new AdminStatCardError(
      'firestore:planActivations',
      err?.code || 500,
      err?.message || 'Failed to load plan activation records'
    );
  }

  const plansConfig = plansConfigRes.status === 'fulfilled' ? plansConfigRes.value : null;
  const paymentRequests = paymentsRes.value.docs.map((d) => ({
    id: d.id,
    data: d.data() as Record<string, any>,
  }));
  const planActivations = activationsRes.value.docs.map((d) => ({
    id: d.id,
    data: d.data() as Record<string, any>,
  }));

  const paidUsersMap = new Map<string, { id: string; data: Record<string, any> }>();
  for (const snap of [paidUsersByPlanRes.value, plusUsersByFlagRes.value, proUsersByFlagRes.value]) {
    for (const d of snap.docs) {
      if (!paidUsersMap.has(d.id)) {
        paidUsersMap.set(d.id, { id: d.id, data: d.data() as Record<string, any> });
      }
    }
  }

  const computed = computePlanAnalyticsSnapshot({
    plansConfig,
    paymentRequests,
    planActivations,
    paidUsers: Array.from(paidUsersMap.values()),
  });

  const result: PlanAnalyticsStats = {
    ...computed,
    freeCount: Math.max(0, totalUsers - computed.proCount - computed.plusCount),
  };

  cachedPlanAnalytics = { at: Date.now(), data: result };
  return result;
}

export async function fetchPlanAnalyticsStats(options?: {
  force?: boolean;
}): Promise<PlanAnalyticsStats> {
  const force = Boolean(options?.force);
  if (
    !force &&
    cachedPlanAnalytics &&
    Date.now() - cachedPlanAnalytics.at < ADMIN_SWR_FRESH_MS
  ) {
    return cachedPlanAnalytics.data;
  }
  if (!force && inFlightPlanAnalytics) {
    return inFlightPlanAnalytics;
  }

  const run = async (): Promise<PlanAnalyticsStats> => {
    const totalUsers = await fetchFirestoreUsersTotalCount(force);
    return computePlanAnalyticsWithTotal(totalUsers);
  };

  inFlightPlanAnalytics = run().finally(() => {
    inFlightPlanAnalytics = null;
  });
  return inFlightPlanAnalytics;
}

export interface DeleteUserAccountResult {
  firebaseAuthDeleted: boolean;
  firestoreDeleted: boolean;
  cloudflareD1Deleted: boolean;
  warning?: string;
}

export async function deleteUserAccount(
  adminEmail: string,
  targetUid: string,
  targetEmail: string
): Promise<DeleteUserAccountResult> {
  const cleanAdmin = (adminEmail || '').trim().toLowerCase();
  if (!cleanAdmin) {
    throw new Error('Admin authentication required to permanently delete users.');
  }

  const cleanUid = (targetUid || '').trim();
  const cleanEmail = (targetEmail || '').trim().toLowerCase();
  if (!cleanUid) {
    throw new Error('Missing target user UID for deletion.');
  }

  let firebaseAuthDeleted = false;
  let cloudflareD1Deleted = false;
  let authWarning: string | undefined;

  // 1. Try Firebase Callable Cloud Function (adminDeleteUserAccount) first
  try {
    const fn = httpsCallable<
      { targetUid: string; targetEmail: string },
      { success: boolean; firebaseAuthDeleted: boolean }
    >(functions, 'adminDeleteUserAccount');
    const res = await fn({ targetUid: cleanUid, targetEmail: cleanEmail });
    if (res.data?.firebaseAuthDeleted) {
      firebaseAuthDeleted = true;
    }
  } catch (fnErr: any) {
    // Cloud Function might not be deployed yet; fallback to server Admin API below
    console.warn('[AdminService] adminDeleteUserAccount callable fallback notice:', fnErr?.message);
  }

  // 2. Call Server Admin API (/api/admin/users/delete & /api/admin/remove-student)
  try {
    const idToken = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };

    const [delResp] = await Promise.all([
      fetch('/api/admin/users/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetUid: cleanUid, targetEmail: cleanEmail }),
      }).catch(() => null),
      fetch('/api/admin/remove-student', {
        method: 'POST',
        headers,
        body: JSON.stringify({ studentId: cleanUid, studentEmail: cleanEmail }),
      }).catch(() => null),
    ]);

    if (delResp && delResp.ok) {
      const data = await delResp.json().catch(() => ({}));
      cloudflareD1Deleted = true;
      if (data?.firebaseAuthDeleted) {
        firebaseAuthDeleted = true;
      } else if (!firebaseAuthDeleted && data?.firebaseAuthWarning) {
        authWarning = data.firebaseAuthWarning;
      }
    }
  } catch (srvErr: any) {
    console.warn('[AdminService] Server deletion endpoint notice:', srvErr?.message);
  }

  // 3. Delete all direct UID documents in Firestore
  const directCollections = [
    'users',
    'publicProfiles',
    'admins',
    'streaks',
    'referrals',
    'leaderboard',
    'wallets',
    'captainApplications',
    'crewApplications',
    'captains',
  ];

  await Promise.all(
    directCollections.map((collName) =>
      deleteDoc(doc(db, collName, cleanUid)).catch(() => {})
    )
  );

  // 4. Delete any duplicate / orphan records matching the same email in users & publicProfiles
  if (cleanEmail) {
    for (const collName of ['users', 'publicProfiles'] as const) {
      try {
        const emailSnap = await getDocs(
          query(collection(db, collName), where('email', '==', cleanEmail))
        );
        for (const d of emailSnap.docs) {
          await deleteDoc(doc(db, collName, d.id)).catch(() => {});
        }
      } catch {
        // Continue cleaning other collections if one fails
      }
    }
  }

  // 5. Delete queried child documents (attempts, paymentRequests, reviews, crew_requests)
  const childQueries = [
    { coll: 'attempts', field: 'userId' },
    { coll: 'paymentRequests', field: 'userId' },
    { coll: 'reviews', field: 'userId' },
    { coll: 'crew_requests', field: 'userId' },
  ];

  for (const cq of childQueries) {
    try {
      const qSnap = await getDocs(
        query(collection(db, cq.coll), where(cq.field, '==', cleanUid), limit(200))
      );
      await Promise.all(qSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
    } catch {
      // Continue cleaning child collections
    }
  }

  // 6. Verify primary Firestore user document is gone
  const checkUserSnap = await getDocFromServer(doc(db, 'users', cleanUid)).catch(() => null);
  if (checkUserSnap && checkUserSnap.exists()) {
    throw new Error(
      `Failed to delete Firestore document users/${cleanUid}. Check Firestore security rules.`
    );
  }

  await logAdminAction(
    adminEmail,
    'delete_user_account',
    {
      targetUid: cleanUid,
      targetEmail: cleanEmail,
      firebaseAuthDeleted,
      cloudflareD1Deleted,
    },
    cleanUid,
    cleanEmail
  );

  return {
    firebaseAuthDeleted,
    firestoreDeleted: true,
    cloudflareD1Deleted,
    warning: !firebaseAuthDeleted ? authWarning : undefined,
  };
}

export async function cleanupOrphanUserProfiles(
  adminEmail: string
): Promise<{ scanned: number; removed: number; removedUids: string[] }> {
  const cleanAdmin = (adminEmail || '').trim().toLowerCase();
  if (
    cleanAdmin !== 'shsvirtualadmin@gmail.com' &&
    cleanAdmin !== 'support@boardly.cfd'
  ) {
    throw new Error('Only Superadmin can clean up orphan profiles.');
  }

  const removedUids = new Set<string>();

  // 1. Try Cloud Function cleanupOrphanProfiles if deployed
  try {
    const fn = httpsCallable<
      Record<string, never>,
      { success: boolean; scannedCount: number; removedCount: number; removedUids: string[] }
    >(functions, 'cleanupOrphanProfiles');
    const res = await fn({});
    if (Array.isArray(res.data?.removedUids)) {
      res.data.removedUids.forEach((u) => removedUids.add(u));
    }
  } catch {
    // Fallback to client-side Firestore scan below
  }

  // 2. Scan users and publicProfiles in Firestore for duplicate emails or orphan publicProfiles
  const [usersSnap, pubSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'publicProfiles')),
  ]);

  const usersByUid = new Map<string, { uid: string; email: string; createdAtMs: number; data: any }>();
  const byEmail = new Map<string, Array<{ uid: string; email: string; createdAtMs: number }>>();

  usersSnap.docs.forEach((d) => {
    const data = d.data();
    const uid = d.id;
    const email = String(data.email || '').trim().toLowerCase();
    const createdAtMs =
      typeof data.createdAt?.toMillis === 'function'
        ? data.createdAt.toMillis()
        : typeof data.createdAt?.seconds === 'number'
        ? data.createdAt.seconds * 1000
        : 0;
    usersByUid.set(uid, { uid, email, createdAtMs, data });
    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push({ uid, email, createdAtMs });
    }
  });

  // Duplicate email records: keep the newest UID, mark older UIDs as orphans
  for (const [, list] of byEmail.entries()) {
    if (list.length > 1) {
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      for (let i = 1; i < list.length; i++) {
        removedUids.add(list[i].uid);
      }
    }
  }

  // Records explicitly marked deleted
  for (const [uid, info] of usersByUid.entries()) {
    if (info.data?.deleted === true || info.data?.status === 'deleted') {
      removedUids.add(uid);
    }
  }

  // publicProfiles with no matching users/{uid} document
  for (const d of pubSnap.docs) {
    if (!usersByUid.has(d.id)) {
      removedUids.add(d.id);
    }
  }

  // Never touch superadmin UID
  removedUids.delete('A5YMRimdHRcmeDWutxtUGt2e4hf2');

  const collectionsToClean = [
    'users',
    'publicProfiles',
    'streaks',
    'referrals',
    'leaderboard',
    'wallets',
    'captainApplications',
    'crewApplications',
  ];

  for (const uid of removedUids) {
    await Promise.all(
      collectionsToClean.map((coll) => deleteDoc(doc(db, coll, uid)).catch(() => {}))
    );
  }

  await logAdminAction(adminEmail, 'cleanup_orphan_profiles', {
    scanned: usersByUid.size + pubSnap.size,
    removed: removedUids.size,
    removedUids: Array.from(removedUids),
  });

  return {
    scanned: usersByUid.size,
    removed: removedUids.size,
    removedUids: Array.from(removedUids),
  };
}

export async function backfillMissingDisplayNames(
  adminEmail: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ updated: number; total: number }> {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(query(usersRef, limit(300)));
  const toUpdate: { uid: string; displayName: string }[] = [];

  for (const d of snap.docs) {
    const data = d.data() as UserProfile;
    const currentName = data.displayName?.trim();
    if (!currentName || currentName === 'Unnamed Student') {
      const derived = getUserDisplayName(data);
      toUpdate.push({ uid: d.id, displayName: derived });
    }
  }

  const batchSize = 50;
  let done = 0;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const chunk = toUpdate.slice(i, i + batchSize);
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.update(doc(db, 'users', item.uid), { displayName: item.displayName });
    }
    await batch.commit();
    done += chunk.length;
    if (onProgress) onProgress(done, toUpdate.length);
  }

  await logAdminAction(adminEmail, 'backfill_missing_display_names', { updatedCount: done });
  return { updated: done, total: toUpdate.length };
}

export async function fetchUserRecentAttempts(
  userId: string,
  limitCount = 5
): Promise<Array<{ id: string; subject?: string; score?: number; totalQuestions?: number; percentage?: number; createdAt?: Timestamp | { seconds: number } | string | null }>> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[AdminService] fetchUserRecentAttempts error:', err);
    throw wrapFirestoreError(err, 'attempts', 'fetchUserRecentAttempts');
  }
}

export interface PaginatedQuestionsResult {
  questions: Question[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchQuestionsPaginated(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<PaginatedQuestionsResult> {
  const ref = collection(db, 'questions');
  const count = filters.limitCount ?? 50;

  // IMPORTANT: Do NOT combine where('subject', ...) with orderBy(...) to prevent missing composite index failures.
  const queryConstraints: QueryConstraint[] = [];
  if (filters.subject && filters.subject !== 'all') {
    queryConstraints.push(where('subject', '==', filters.subject));
  } else if (filters.university && filters.university !== 'all') {
    queryConstraints.push(where('university', '==', filters.university));
  } else if (filters.difficulty && filters.difficulty !== 'all') {
    queryConstraints.push(where('difficulty', '==', filters.difficulty));
  }

  if (filters.startAfterDoc) {
    queryConstraints.push(startAfter(filters.startAfterDoc));
  }

  queryConstraints.push(limit(count));

  try {
    const q = query(ref, ...queryConstraints);
    const snap = await getDocs(q);
    let questions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));

    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      questions = questions.filter(q =>
        (q.question ?? q.q ?? '').toLowerCase().includes(term) ||
        (q.chapter ?? '').toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term)
      );
    }

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;

    return {
      questions,
      lastDoc: last,
      hasMore,
    };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    throw new AdminFirestoreError(
      e?.message || 'Failed to fetch questions from Firestore collection "questions". Check permissions and indexes.',
      e?.code || 'questions-fetch-error',
      'questions',
      'fetchQuestionsPaginated'
    );
  }
}

export async function fetchQuestions(filters: {
  search?: string;
  subject?: string;
  university?: string;
  difficulty?: string;
  limitCount?: number;
}): Promise<Question[]> {
  const res = await fetchQuestionsPaginated(filters);
  return res.questions;
}

export async function fetchQuestionKey(questionId: string): Promise<QuestionKey | null> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    try {
      const msKey = await fetchMultiSourceQuestionKey(questionId);
      if (msKey) {
        return {
          id: questionId,
          correct: typeof msKey.correct === 'number' ? msKey.correct : 0,
          explain: msKey.explain || '',
        } as QuestionKey;
      }
    } catch {
      // Fallback
    }
  }

  try {
    const snap = await getDocFromServer(doc(db, 'questionKeys', questionId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as QuestionKey;
    }
    return null;
  } catch (err) {
    console.warn('[AdminService] fetchQuestionKey warning:', err);
    return null;
  }
}

/**
 * Saves MCQ strictly separating public `questions/{id}` and secret `questionKeys/{id}`.
 * NEVER stores the answer key inside the `questions` collection!
 */
export async function saveQuestion(
  adminEmail: string,
  question: Partial<Question> & {
    correct?: number;
    correctAnswer?: number;
    explain?: string;
    explanation?: string;
  }
): Promise<string> {
  const qId = question.id && !question.id.startsWith('q_custom') ? question.id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const qText = (question.q || question.question || '').trim();
  const rawOpts = question.options && question.options.length >= 4 ? question.options : ['', '', '', ''];
  const options: [string, string, string, string] = [
    rawOpts[0] || '',
    rawOpts[1] || '',
    rawOpts[2] || '',
    rawOpts[3] || '',
  ];

  const subjectSlug = findSubjectSlug(question.subject || 'mathematics') || 'mathematics';
  const chapterSlug = findChapterSlug(subjectSlug, question.chapter || '') || '';
  const difficulty = (question.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';
  const status = (question.status || 'published') as 'draft' | 'reviewed' | 'published';
  const active = question.active !== undefined ? Boolean(question.active) : true;
  const rand = typeof question.rand === 'number' ? question.rand : Math.random();
  const contentHash = await computeContentHash(qText, options);

  // 2. Validate and standardize correct answer
  const rawKey = question.correct !== undefined ? question.correct : question.correctAnswer;
  const resolvedKey = normalizeCorrectAnswer(rawKey, options);
  if (!resolvedKey) {
    throw new Error('Validation failed: A valid correct answer matching one of the options is required.');
  }

  // 1. Public question doc in `questions/{qId}` — strictly NO correct or explain!
  const publicDoc: Record<string, unknown> = {
    id: qId,
    subject: subjectSlug,
    chapter: chapterSlug,
    difficulty,
    q: qText,
    options,
    tags: Array.isArray(question.tags) ? question.tags : ['entrance'],
    status,
    active,
    rand,
    schemaVersion: 1,
    contentHash,
    updatedAt: serverTimestamp(),
    createdBy: adminEmail,
  };

  if (question.source) publicDoc.source = question.source;
  if (question.year) publicDoc.year = question.year;
  if (question.createdAt) publicDoc.createdAt = question.createdAt;
  else publicDoc.createdAt = serverTimestamp();

  await setDoc(doc(db, 'questions', qId), publicDoc, { merge: true });

  // 2. Secret key doc in `questionKeys/{qId}`
  const explainVal = (question.explain || question.explanation || '').trim();

  await setDoc(
    doc(db, 'questionKeys', qId),
    {
      id: qId,
      correct: resolvedKey.correctIndex,
      correctOptionText: resolvedKey.correctText,
      explain: explainVal,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await logAdminAction(adminEmail, 'save_question', {
    questionId: qId,
    subject: subjectSlug,
    chapter: chapterSlug,
  });

  return qId;
}

export async function deleteQuestion(adminEmail: string, questionId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'questions', questionId));
  batch.delete(doc(db, 'questionKeys', questionId));
  await batch.commit();
  await logAdminAction(adminEmail, 'delete_question', { questionId });
}

export interface BankHealthStats {
  totalQuestions: number;
  bySubject: Record<string, number>;
  byChapter: Record<string, number>;
  byDifficulty: { easy: number; medium: number; hard: number };
  byStatus: { draft: number; reviewed: number; published: number };
  activeCount: number;
  inactiveCount: number;
  openReportsCount: number;
  duplicatesDetected: number;
  invalidCorrectCount: number;
  needsReviewCount?: number;
  lastImportAt?: string | null;
  banks?: Record<
    string,
    {
      bankId: string;
      label: string;
      total: number;
      published: number;
      needsReview: number;
      bySubject: Record<string, number>;
      lastImportAt: string | null;
    }
  >;
}

export async function fetchBankHealth(): Promise<BankHealthStats> {
  const result: BankHealthStats = {
    totalQuestions: 0,
    bySubject: {},
    byChapter: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byStatus: { draft: 0, reviewed: 0, published: 0 },
    activeCount: 0,
    inactiveCount: 0,
    openReportsCount: 0,
    duplicatesDetected: 0,
    invalidCorrectCount: 0,
    needsReviewCount: 0,
    lastImportAt: null,
    banks: {},
  };

  if (!USE_FIRESTORE_QUESTION_READER) {
    try {
      const [healthResp, listResp] = await Promise.all([
        fetch('/api/questions/health'),
        fetch('/api/questions?limit=1000'),
      ]);
      if (healthResp.ok) {
        const hData = await healthResp.json();
        result.totalQuestions = Number(hData?.totalQuestions ?? 0);
        result.bySubject = hData?.bySubject || {};
        result.needsReviewCount = Number(hData?.totalNeedsReview ?? 0);
        result.lastImportAt = hData?.lastImportAt || null;
        result.banks = hData?.banks || {};
      }
      if (listResp.ok) {
        const lData = await listResp.json();
        const qList = Array.isArray(lData?.questions) ? lData.questions : [];
        for (const q of qList) {
          const ch = String(q.topic || 'General');
          const diff = String(q.difficulty || 'medium').toLowerCase();
          const st = String(q.status || 'published').toLowerCase();
          result.byChapter[ch] = (result.byChapter[ch] || 0) + 1;
          if (diff === 'easy') result.byDifficulty.easy++;
          else if (diff === 'hard') result.byDifficulty.hard++;
          else result.byDifficulty.medium++;

          if (st === 'draft') result.byStatus.draft++;
          else if (st === 'reviewed') result.byStatus.reviewed++;
          else result.byStatus.published++;

          if (st !== 'archived') result.activeCount++;
          else result.inactiveCount++;
        }
      }
    } catch (err) {
      console.warn('[AdminService] fetchBankHealth D1 error:', err);
    }
    return result;
  }

  try {
    const questionsSnap = await getDocs(query(collection(db, 'questions'), limit(2500)));
    result.totalQuestions = questionsSnap.size;

    const seenHashes = new Set<string>();

    for (const d of questionsSnap.docs) {
      const data = d.data();
      const s = data.subject || 'unknown';
      const c = data.chapter || 'unknown';
      const diff = (data.difficulty || 'medium').toLowerCase();
      const st = (data.status || 'published').toLowerCase();
      const act = data.active !== false;

      result.bySubject[s] = (result.bySubject[s] || 0) + 1;
      result.byChapter[c] = (result.byChapter[c] || 0) + 1;

      if (diff === 'easy') result.byDifficulty.easy++;
      else if (diff === 'hard') result.byDifficulty.hard++;
      else result.byDifficulty.medium++;

      if (st === 'draft') result.byStatus.draft++;
      else if (st === 'reviewed') result.byStatus.reviewed++;
      else result.byStatus.published++;

      if (act) result.activeCount++;
      else result.inactiveCount++;

      // Check if options are valid array
      const opts = Array.isArray(data.options) ? data.options : [];
      if (opts.length < 2) {
        result.invalidCorrectCount++;
      } else if (data.correct === undefined && data.correctAnswer === undefined) {
        // If neither on doc, check if flagged or empty
        if (data.needs_repair) {
          result.invalidCorrectCount++;
        }
      }

      if (data.contentHash) {
        if (seenHashes.has(data.contentHash)) {
          result.duplicatesDetected++;
        } else {
          seenHashes.add(data.contentHash);
        }
      }
    }
  } catch (err) {
    console.warn('[AdminService] fetchBankHealth questions error:', err);
  }

  try {
    const repSnap = await getDocs(
      query(collection(db, 'questionReports'), where('status', '==', 'open'), limit(200))
    );
    result.openReportsCount = repSnap.size;
  } catch (err) {
    console.warn('[AdminService] fetchBankHealth reports error:', err);
  }

  return result;
}

export async function batchUpdateQuestions(
  adminEmail: string,
  questionIds: string[],
  updates: { status?: 'draft' | 'reviewed' | 'published'; active?: boolean; chapter?: string }
): Promise<number> {
  if (!USE_FIRESTORE_QUESTION_READER) {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
    const resp = await fetch('/api/questions/batch', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ids: questionIds,
        updates: {
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.chapter ? { topic: updates.chapter } : {}),
        },
      }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData?.error || `Failed to batch update questions in D1 (HTTP ${resp.status})`);
    }
    const data = await resp.json();
    clearMultiSourceCache();
    clearQuestionsCache();
    return Number(data?.updatedCount ?? questionIds.length);
  }

  const chunkSize = 400;
  let updated = 0;

  for (let i = 0; i < questionIds.length; i += chunkSize) {
    const chunk = questionIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const qId of chunk) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.active !== undefined) payload.active = updates.active;
      if (updates.chapter !== undefined) payload.chapter = updates.chapter;

      batch.update(doc(db, 'questions', qId), payload);
    }

    await batch.commit();
    updated += chunk.length;
  }

  await logAdminAction(adminEmail, 'batch_update_questions', {
    count: updated,
    updates,
  });

  return updated;
}

export interface ImportCandidate {
  question: Partial<Question>;
  key: { correct: number; explain: string };
}

export interface ImportResult {
  imported: number;
  duplicatesSkipped: number;
  errors: string[];
}

export async function batchImportQuestions(
  adminEmail: string,
  candidates: ImportCandidate[],
  onProgress?: (done: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  // 1. Gather all existing content hashes to prevent duplicates
  const existingHashes = new Set<string>();
  try {
    const existingSnap = await getDocs(query(collection(db, 'questions'), limit(3000)));
    for (const d of existingSnap.docs) {
      const h = d.data().contentHash;
      if (h) existingHashes.add(h);
    }
  } catch (hErr) {
    console.warn('[AdminService] Existing hash gathering notice:', hErr);
  }

  const validItems: Array<{ qId: string; publicDoc: Record<string, unknown>; keyDoc: Record<string, unknown> }> = [];

  for (const item of candidates) {
    const qText = (item.question.q || item.question.question || '').trim();
    const rawOpts = item.question.options || [];
    const options: [string, string, string, string] = [
      rawOpts[0] || '',
      rawOpts[1] || '',
      rawOpts[2] || '',
      rawOpts[3] || '',
    ];

    if (!qText || options.some(o => !o.trim())) {
      result.errors.push(`Row with empty stem or options skipped`);
      continue;
    }

    const cHash = item.question.contentHash || (await computeContentHash(qText, options));

    if (existingHashes.has(cHash)) {
      result.duplicatesSkipped++;
      continue;
    }
    existingHashes.add(cHash);

    const qId = item.question.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subjectSlug = findSubjectSlug(item.question.subject || 'mathematics') || 'mathematics';
    const chapterSlug = findChapterSlug(subjectSlug, item.question.chapter || '') || '';

    const publicDoc: Record<string, unknown> = {
      id: qId,
      subject: subjectSlug,
      chapter: chapterSlug,
      difficulty: (item.question.difficulty || 'medium').toLowerCase(),
      q: qText,
      options,
      tags: Array.isArray(item.question.tags) && item.question.tags.length > 0 ? item.question.tags : ['entrance'],
      status: item.question.status || 'published',
      active: item.question.active !== undefined ? Boolean(item.question.active) : true,
      rand: typeof item.question.rand === 'number' ? item.question.rand : Math.random(),
      schemaVersion: 1,
      contentHash: cHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminEmail,
    };
    if (item.question.source) publicDoc.source = item.question.source;
    if (item.question.year) publicDoc.year = item.question.year;

    const keyDoc: Record<string, unknown> = {
      id: qId,
      correct: typeof item.key.correct === 'number' ? item.key.correct : 0,
      explain: (item.key.explain || '').trim(),
      updatedAt: serverTimestamp(),
    };

    validItems.push({ qId, publicDoc, keyDoc });
  }

  // 2. Commit in batches of 200 items (400 ops: questions + questionKeys)
  const chunkSize = 200;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const entry of chunk) {
      batch.set(doc(db, 'questions', entry.qId), entry.publicDoc);
      batch.set(doc(db, 'questionKeys', entry.qId), entry.keyDoc);
    }

    await batch.commit();
    result.imported += chunk.length;
    if (onProgress) {
      onProgress(result.imported, validItems.length);
    }
  }

  await logAdminAction(adminEmail, 'batch_import_questions', {
    imported: result.imported,
    duplicatesSkipped: result.duplicatesSkipped,
    errorsCount: result.errors.length,
  });

  return result;
}

export async function fetchQuestionReports(): Promise<QuestionReport[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'questionReports'), orderBy('createdAt', 'desc'), limit(100))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionReport));
  } catch (err) {
    console.warn('[AdminService] fetchQuestionReports fallback without orderBy:', err);
    const fallbackSnap = await getDocs(query(collection(db, 'questionReports'), limit(100)));
    return fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionReport));
  }
}

export async function updateQuestionReportStatus(
  adminEmail: string,
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<void> {
  await updateDoc(doc(db, 'questionReports', reportId), {
    status,
    resolvedBy: adminEmail,
    resolvedAt: serverTimestamp(),
  });
  await logAdminAction(adminEmail, 'update_question_report', { reportId, status });
}

// ─── APPLICATION REVIEWS (CAPTAINS & CREW) ───────────────────────────────────
export async function fetchCaptainApplications(statusFilter = 'all'): Promise<CaptainApplication[]> {
  const ref = collection(db, 'captainApplications');
  const snap = await getDocs(query(ref, limit(200)));
  const normalized = snap.docs
    .map((d) => normalizeCaptainApplicationDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => extractTimestampMs(b.createdAt) - extractTimestampMs(a.createdAt));
  return filterApplicationsByStatus(normalized, statusFilter);
}

export async function fetchCrewApplications(statusFilter = 'all'): Promise<CrewApplication[]> {
  const ref = collection(db, 'crewApplications');
  const snap = await getDocs(query(ref, limit(200)));
  const normalized = snap.docs
    .map((d) => normalizeCrewApplicationDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => extractTimestampMs(b.createdAt) - extractTimestampMs(a.createdAt));
  return filterApplicationsByStatus(normalized, statusFilter);
}

async function syncCaptainRoleServerSide(targetUid: string, targetEmail: string): Promise<void> {
  if (!targetUid && !targetEmail) return;
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken();
    if (!token) return;
    await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: targetUid || undefined,
        email: targetEmail || undefined,
        role: 'captain',
      }),
    });
  } catch (err) {
    console.warn('[AdminService] Best-effort captain role claim sync skipped:', err);
  }
}

export async function approveCaptainApplication(
  adminEmail: string,
  app: CaptainApplication
): Promise<void> {
  const targetUid = String(app.userId || (app as unknown as { uid?: string }).uid || app.id || '').trim();
  const safeEmail = String(app.email || '').trim();
  const rawUni = String(
    app.university || (app as unknown as { institution?: string }).institution || ''
  ).trim();
  const safeUni =
    rawUni && rawUni.toLowerCase() !== 'undefined' && rawUni.toLowerCase() !== 'null'
      ? rawUni
      : 'your institution';
  const uniPrefix = (safeUni.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'CAMP').toUpperCase();
  const uidSuffix = (targetUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || '0000').toUpperCase();
  const captainCode = `CAP-${uniPrefix}-${uidSuffix}`;

  const rawCaptainName = String(
    app.name ||
      (app as unknown as { studentName?: string; fullName?: string; displayName?: string; userName?: string })
        .studentName ||
      (app as unknown as { fullName?: string }).fullName ||
      (app as unknown as { displayName?: string }).displayName ||
      (app as unknown as { userName?: string }).userName ||
      ''
  ).trim();
  const safeCaptainName =
    rawCaptainName &&
    rawCaptainName.toLowerCase() !== 'undefined' &&
    rawCaptainName.toLowerCase() !== 'null'
      ? rawCaptainName
      : '';
  const captainGreeting = safeCaptainName
    ? `Congratulations ${safeCaptainName}!`
    : 'Congratulations!';

  // 1. Update application doc (authoritative status change)
  await updateDoc(doc(db, 'captainApplications', app.id), {
    status: 'approved',
    captainCode,
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  // 2. Update user profile (superAdmin can set role directly; regular admin updates plan & syncs role via API)
  if (targetUid) {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          role: 'captain',
          plan: 'pro',
          isPremium: true,
          premiumSource: 'captain_grant',
          captainCode,
        },
        { merge: true }
      );
    } catch (userErr) {
      console.warn('[AdminService] Direct user role write failed, retrying non-role fields:', userErr);
      try {
        await setDoc(
          doc(db, 'users', targetUid),
          {
            plan: 'pro',
            isPremium: true,
            premiumSource: 'captain_grant',
            captainCode,
          },
          { merge: true }
        );
      } catch (fallbackErr) {
        console.warn('[AdminService] User profile update fallback warning:', fallbackErr);
      }
    }

    // Best-effort custom claim + server role table sync
    await syncCaptainRoleServerSide(targetUid, safeEmail);

    // 3. Create or update captain hub record (non-fatal if captains collection rule is locked)
    try {
      await setDoc(
        doc(db, 'captains', targetUid),
        {
          userId: targetUid,
          name: safeCaptainName || safeEmail.split('@')[0] || 'Nakama Captain',
          email: safeEmail,
          university: safeUni,
          city: app.city || '',
          referralCode: captainCode,
          captainCode,
          points: 100,
          activatedReferrals: 0,
          tier: 'Bronze',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (captainHubErr) {
      console.warn('[AdminService] Optional captains hub record write skipped:', captainHubErr);
    }

    // 4. Send notification to user (deterministic ID prevents duplicates)
    try {
      await setDoc(
        doc(db, 'notifications', `captain_approve_${targetUid}`),
        {
          userId: targetUid,
          type: 'crew',
          title: 'Campus Captain Approved!',
          message: `${captainGreeting} Your application to represent ${safeUni} has been approved. Your code is ${captainCode}.`,
          link: '/dashboard/captain',
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (notifErr) {
      console.warn('[AdminService] Captain approval notification warning:', notifErr);
    }
  }

  try {
    await logAdminAction(
      adminEmail,
      'approve_captain_application',
      { appId: app.id, captainCode },
      targetUid,
      safeEmail
    );
  } catch (auditErr) {
    console.warn('[AdminService] Captain approval audit log warning:', auditErr);
  }

  try {
    notifyApplicationDecision({
      applicationId: app.id,
      studentUid: targetUid,
      applicantName: safeCaptainName || safeEmail.split('@')[0] || 'Nakama Captain',
      studentEmail: safeEmail,
      programName: 'Nakama Campus Captain',
      decision: 'approved',
      codeOrBadge: captainCode,
      ctaPath: '/dashboard/captain',
    });
  } catch (emailErr) {
    console.warn('[AdminService] Captain approval email dispatch warning:', emailErr);
  }

  invalidateApplicationsOverviewCache();
}

export async function approveCrewApplication(
  adminEmail: string,
  app: CrewApplication
): Promise<void> {
  const targetUid = String(app.userId || (app as unknown as { uid?: string }).uid || app.id || '').trim();
  const safeEmail = String(app.email || '').trim();
  const uidSuffix = (targetUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '000000').toUpperCase();
  const crewCode = `CREW-${uidSuffix}`;

  const rawCrewName = String(
    app.name ||
      (app as unknown as { fullName?: string; studentName?: string; displayName?: string; userName?: string })
        .fullName ||
      (app as unknown as { studentName?: string }).studentName ||
      (app as unknown as { displayName?: string }).displayName ||
      (app as unknown as { userName?: string }).userName ||
      ''
  ).trim();
  const safeCrewName =
    rawCrewName &&
    rawCrewName.toLowerCase() !== 'undefined' &&
    rawCrewName.toLowerCase() !== 'null'
      ? rawCrewName
      : '';
  const crewGreeting = safeCrewName ? `Congratulations ${safeCrewName}!` : 'Congratulations!';

  // 1. Update application doc (authoritative status change)
  await updateDoc(doc(db, 'crewApplications', app.id), {
    status: 'approved',
    crewCode,
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  // 2. Update user profile
  if (targetUid) {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          role: 'crew',
          plan: 'pro',
          isPremium: true,
          premiumSource: 'crew_grant',
          isCrewMember: true,
          crewStatus: 'active',
          crewReferralCode: crewCode,
          crewStartDate: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (userErr) {
      console.warn('[AdminService] Direct crew role write failed, retrying non-role fields:', userErr);
      try {
        await setDoc(
          doc(db, 'users', targetUid),
          {
            plan: 'pro',
            isPremium: true,
            premiumSource: 'crew_grant',
            isCrewMember: true,
            crewStatus: 'active',
            crewReferralCode: crewCode,
            crewStartDate: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (fallbackErr) {
        console.warn('[AdminService] Crew user profile update fallback warning:', fallbackErr);
      }
    }

    // 3. Send notification to user (deterministic ID prevents duplicates)
    try {
      await setDoc(
        doc(db, 'notifications', `crew_approve_${targetUid}`),
        {
          userId: targetUid,
          type: 'crew',
          title: 'Welcome to Boardly Crew!',
          message: `${crewGreeting} You are now an official Boardly Crew Ambassador. Your referral code is ${crewCode}.`,
          link: '/dashboard/crew',
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (notifErr) {
      console.warn('[AdminService] Crew approval notification warning:', notifErr);
    }
  }

  try {
    await logAdminAction(
      adminEmail,
      'approve_crew_application',
      { appId: app.id, crewCode },
      targetUid,
      safeEmail
    );
  } catch (auditErr) {
    console.warn('[AdminService] Crew approval audit log warning:', auditErr);
  }

  try {
    notifyApplicationDecision({
      applicationId: app.id,
      studentUid: targetUid,
      applicantName: safeCrewName || safeEmail.split('@')[0] || 'Crew Member',
      studentEmail: safeEmail,
      programName: 'Boardly Study Crew Ambassador',
      decision: 'approved',
      codeOrBadge: crewCode,
      ctaPath: '/dashboard/crew',
    });
  } catch (emailErr) {
    console.warn('[AdminService] Crew approval email dispatch warning:', emailErr);
  }

  invalidateApplicationsOverviewCache();
}

export async function rejectApplication(
  adminEmail: string,
  type: 'captain' | 'crew',
  appId: string,
  targetUid: string,
  targetEmail: string,
  reason?: string
): Promise<void> {
  const collectionName = type === 'captain' ? 'captainApplications' : 'crewApplications';
  const safeReason = (reason || '').trim() || 'Application criteria not met at this time.';

  await updateDoc(doc(db, collectionName, appId), {
    status: 'rejected',
    rejectionReason: safeReason,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  try {
    await logAdminAction(
      adminEmail,
      `reject_${type}_application`,
      { appId, reason: safeReason },
      targetUid,
      targetEmail
    );
  } catch (auditErr) {
    console.warn('[AdminService] Reject application audit log warning:', auditErr);
  }

  try {
    notifyApplicationDecision({
      applicationId: appId,
      studentUid: targetUid,
      applicantName: targetEmail ? targetEmail.split('@')[0] : 'Applicant',
      studentEmail: targetEmail,
      programName: type === 'captain' ? 'Nakama Campus Captain' : 'Boardly Study Crew Ambassador',
      decision: 'rejected',
      reason: safeReason,
      ctaPath: '/dashboard',
    });
  } catch (emailErr) {
    console.warn('[AdminService] Reject application email dispatch warning:', emailErr);
  }

  invalidateApplicationsOverviewCache();
}

// ─── PAYMENT UPGRADE REQUESTS ────────────────────────────────────────────────
export async function fetchPaymentRequests(statusFilter = 'all'): Promise<PaymentRequest[]> {
  try {
    await ensureAdminAuthToken(false);
    const ref = collection(db, 'paymentRequests');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await withTimeout(getDocs(q), 10000, 'paymentRequests');
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRequest));
  } catch (err) {
    console.error('[AdminService] fetchPaymentRequests error:', err);
    throw wrapFirestoreError(err, 'paymentRequests', 'fetchPaymentRequests');
  }
}

export async function approvePaymentRequest(
  adminEmail: string,
  req: PaymentRequest
): Promise<void> {
  // 1. Update payment request
  await updateDoc(doc(db, 'paymentRequests', req.id), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });

  const methodDisplay = formatPaymentMethodLabel(req.method);

  // If this is a Large Crew upgrade request, update crew record (never write crew Pro into user's personal subscription)
  if ((req.plan === 'large_crew' || req.crewId) && req.crewId) {
    await recordCrewPaymentActionServer({
      crewId: req.crewId,
      action: 'extend_month',
      adminEmail,
      reason: `Verified ${methodDisplay} transaction ${req.transactionId}`,
      amount: req.amount,
      transactionId: req.transactionId,
    });

    await setDoc(
      doc(db, 'notifications', `crew_payment_${req.id}`),
      {
        userId: req.userId,
        type: 'crew',
        title: 'Squad Upgraded to Large Crew!',
        message: `Your payment of PKR ${req.amount} via ${methodDisplay} (TRX: ${req.transactionId}) was verified. Your study squad now has Large Crew status with up to 30 members and Pro sharing for all squad members!`,
        link: '/dashboard/crew',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await logAdminAction(
      adminEmail,
      'approve_crew_payment_request',
      { reqId: req.id, crewId: req.crewId, amount: req.amount, method: req.method, transactionId: req.transactionId },
      req.userId,
      req.userEmail
    );

    const [walletSnap, userSnap] = await Promise.all([
      getDoc(doc(db, 'wallets', req.userId)),
      getDoc(doc(db, 'users', req.userId)),
    ]);
    const walletBal = walletSnap.exists() ? Math.max(0, Math.floor(Number(walletSnap.data().balance) || 0)) : 0;
    const userBal = userSnap.exists() ? Math.max(0, Math.floor(Number(userSnap.data().kobans ?? userSnap.data().kobanBalance) || 0)) : 0;
    const currentBal = Math.max(walletBal, userBal);
    const kobansAmount = Number(req.amount || 0) * 10;

    notifyKobanPurchaseApproved({
      requestId: req.id,
      studentUid: req.userId,
      studentName: req.userName,
      studentEmail: req.userEmail,
      kobansAmount,
      balanceBefore: currentBal,
      newBalance: currentBal + kobansAmount,
      transactionId: req.transactionId,
      adminEmail,
    });
    return;
  }

  // Otherwise, personal Pro or Plus account upgrade / extension:
  const userRef = doc(db, 'users', req.userId);
  const [userSnap, plansConfig] = await Promise.all([
    getDoc(userRef),
    fetchPlansConfigOnce().catch(() => null),
  ]);
  const userData = userSnap.exists() ? userSnap.data() : null;
  const nowMs = Date.now();
  const existingTier = getPlan(userData, nowMs);

  const rawPlanId = String((req as any).planId || req.plan || 'pro_monthly');
  const targetTier: 'pro' | 'plus' =
    getPlanTierFromPlanId(rawPlanId) === 'plus' || (req as any).planTier === 'plus'
      ? 'plus'
      : 'pro';
  const isAnnual =
    getBillingFromPlanId(rawPlanId) === 'annual' ||
    req.durationDays === 365 ||
    (req.durationMonths !== undefined && req.durationMonths >= 12);

  const resolvedPlanId: PaidPlanId =
    targetTier === 'plus'
      ? isAnnual
        ? 'plus_annual'
        : 'plus_monthly'
      : isAnnual
        ? 'pro_annual'
        : 'pro_monthly';
  const catalog = plansConfig ? buildPlansCatalog(plansConfig) : null;
  const resolvedPlan = catalog ? catalog[resolvedPlanId] : getProPlanById(resolvedPlanId);

  const baseDurationDays =
    typeof req.durationDays === 'number' && req.durationDays > 0
      ? req.durationDays
      : isAnnual
      ? 365
      : (req.durationMonths ?? 1) * 30;
  const planName = req.planName || resolvedPlan.name;
  const pkrAmount = Number(req.amount_pkr ?? req.amount ?? resolvedPlan.price_pkr);

  const currentExpiryRaw =
    targetTier === 'plus'
      ? (userData?.plusUntil ?? userData?.planExpiresAt ?? userData?.premiumExpiresAt ?? null)
      : (userData?.proUntil ?? userData?.planExpiresAt ?? userData?.premiumExpiresAt ?? null);

  const extension = calculatePlanExpiryPkt({
    currentTier: existingTier,
    targetTier,
    currentExpiryRaw,
    purchasedDays: baseDurationDays,
    nowMs,
  });

  const proCreditDays = 0;
  const totalDurationDays = extension.daysAdded;
  const newExpiryIso = extension.newExpiryIso;

  // Record computed newExpiryDate & upgrade credit metadata on the paymentRequest doc
  await updateDoc(doc(db, 'paymentRequests', req.id), {
    newExpiryDate: newExpiryIso,
    planTier: targetTier,
    proCreditDays,
    upgradedFromPro: targetTier === 'plus' && existingTier === 'pro',
    previousPlan: existingTier,
  });

  // 2. Upgrade or extend student account (keeping legacy fields intact)
  const userPlanPayload: Record<string, unknown> = {
    plan: targetTier,
    planTier: targetTier,
    isPremium: true,
    isPro: targetTier === 'pro',
    isPlus: targetTier === 'plus',
    planId: resolvedPlan.id,
    proPlanId: resolvedPlan.id,
    premiumSource: req.method || 'payment_request',
    premiumExpiresAt: extension.newExpiryMs,
    planExpiresAt: newExpiryIso,
    updatedAt: serverTimestamp(),
  };
  if (targetTier === 'plus') {
    userPlanPayload.plusUntil = newExpiryIso;
    userPlanPayload.plusPlanId = resolvedPlan.id;
    userPlanPayload.proUntil = null;
  } else {
    userPlanPayload.proUntil = newExpiryIso;
    userPlanPayload.plusUntil = null;
  }

  await setDoc(userRef, userPlanPayload, { merge: true });

  // 2b. If a Kobans bonus coupon was redeemed on this payment, credit via normal Kobans path
  const bonusKobans = Math.max(0, Math.floor(Number((req as any).bonusKobans) || 0));
  const couponCodeLabel = String((req as any).couponCode || '').trim().toUpperCase();
  if (bonusKobans > 0) {
    await adminAdjustKobans(
      adminEmail,
      req.userId,
      bonusKobans,
      `Coupon bonus (${couponCodeLabel || 'COUPON'}) on ${planName}`,
      req.userEmail || userData?.email
    );
  }

  const tierTitle = getPlanDisplayName(targetTier);
  const creditNote =
    proCreditDays > 0
      ? ` Includes +${proCreditDays} bonus days credited from your remaining Pro pass.`
      : '';
  const bonusKobanNote =
    bonusKobans > 0
      ? ` +${bonusKobans.toLocaleString()} bonus Kobans credited to your wallet.`
      : '';

  // 3. Send in-app notification
  await setDoc(
    doc(db, 'notifications', `pro_payment_${req.id}`),
    {
      userId: req.userId,
      type: 'system',
      title: extension.wasAlreadyActive
        ? `${tierTitle} Extended!`
        : `${tierTitle} Activated!`,
      message: `Your payment of PKR ${pkrAmount.toLocaleString()} via ${methodDisplay} (TID: ${
        req.TID || req.transactionId
      }) was verified. Your ${planName} is active until ${extension.newExpiryLabel}.${creditNote}${bonusKobanNote}`,
      link: '/dashboard/plan',
      read: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  await logAdminAction(
    adminEmail,
    'approve_payment_request',
    {
      reqId: req.id,
      plan: resolvedPlan.id,
      planTier: targetTier,
      durationDays: totalDurationDays,
      proCreditDays,
      amount: pkrAmount,
      method: req.method,
      transactionId: req.TID || req.transactionId,
      wasExtension: extension.wasAlreadyActive,
      newExpiryIso,
    },
    req.userId,
    req.userEmail
  );

  notifyProActivated({
    recordId: req.id,
    studentUid: req.userId,
    studentName: req.userName || userData?.displayName || userData?.name || 'Student',
    studentEmail: req.userEmail || userData?.email,
    planName,
    planTier: targetTier,
    durationDays: totalDurationDays,
    expiresAtLabel: extension.newExpiryLabel,
    wasExtension: extension.wasAlreadyActive,
    previousExpiryLabel: extension.previousExpiryLabel,
    paidWith: 'pkr',
    pkrAmount,
    transactionId: req.TID || req.transactionId,
    adminEmail,
  });
}

export async function rejectPaymentRequest(
  adminEmail: string,
  reqId: string,
  targetUid: string,
  targetEmail: string,
  reason?: string
): Promise<void> {
  const reqRef = doc(db, 'paymentRequests', reqId);
  const reqSnap = await getDoc(reqRef);
  const reqData = reqSnap.exists() ? (reqSnap.data() as Partial<PaymentRequest>) : {};
  const cleanReason = reason || 'Invalid transaction ID or payment could not be verified.';

  await updateDoc(reqRef, {
    status: 'rejected',
    rejectionReason: cleanReason,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });

  const rawPlanId = String((reqData as any).planId || reqData.plan || 'pro_monthly');
  const targetTier: 'pro' | 'plus' =
    getPlanTierFromPlanId(rawPlanId) === 'plus' || (reqData as any).planTier === 'plus'
      ? 'plus'
      : 'pro';
  const isAnnual =
    getBillingFromPlanId(rawPlanId) === 'annual' ||
    reqData.durationDays === 365 ||
    (reqData.durationMonths !== undefined && reqData.durationMonths >= 12);
  const resolvedPlanId: PaidPlanId =
    targetTier === 'plus'
      ? isAnnual
        ? 'plus_annual'
        : 'plus_monthly'
      : isAnnual
        ? 'pro_annual'
        : 'pro_monthly';
  const resolvedPlan = getProPlanById(resolvedPlanId);
  const planName =
    reqData.plan === 'large_crew'
      ? 'Large Crew Pass'
      : reqData.planName || resolvedPlan.name;
  const pkrAmount = Number(reqData.amount_pkr ?? reqData.amount ?? resolvedPlan.price_pkr);
  const tierDisplay = reqData.plan === 'large_crew' ? 'Large Crew' : getPlanDisplayName(targetTier);

  // Notify student in-app (never touches user's existing active plan)
  try {
    await setDoc(
      doc(db, 'notifications', `pro_reject_${reqId}`),
      {
        userId: targetUid,
        type: 'system',
        title: `${tierDisplay} Request Update`,
        message: `Your ${tierDisplay} payment request could not be verified: ${cleanReason}`,
        link: '/dashboard/plan',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking
  }

  await logAdminAction(
    adminEmail,
    'reject_payment_request',
    { reqId, planTier: targetTier, reason: cleanReason },
    targetUid,
    targetEmail
  );

  notifyProRequestRejected({
    requestId: reqId,
    studentUid: targetUid,
    studentName: reqData.userName,
    studentEmail: targetEmail || reqData.userEmail,
    planName,
    planTier: targetTier,
    pkrAmount,
    reason: cleanReason,
    transactionId: reqData.TID || reqData.transactionId,
    adminEmail,
  });
}

// ─── REVIEW MODERATION ───────────────────────────────────────────────────────
export async function fetchReviews(statusFilter = 'all'): Promise<StudentReview[]> {
  try {
    const ref = collection(db, 'reviews');
    const q = statusFilter !== 'all'
      ? query(ref, where('status', '==', statusFilter), limit(50))
      : query(ref, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentReview));
  } catch (err) {
    console.error('[AdminService] fetchReviews error:', err);
    throw wrapFirestoreError(err, 'reviews', 'fetchReviews');
  }
}

export async function approveReview(adminEmail: string, reviewId: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminEmail,
  });
  await logAdminAction(adminEmail, 'approve_review', { reviewId });
}

export async function rejectReview(adminEmail: string, reviewId: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  });
  await logAdminAction(adminEmail, 'reject_review', { reviewId });
}

export async function deleteReview(adminEmail: string, reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', reviewId));
  await logAdminAction(adminEmail, 'delete_review', { reviewId });
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export async function fetchAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  const fetchServerGrandLineAuditLogs = async (): Promise<AuditLog[]> => {
    try {
      const res = await fetchAdminJsonWithRetry<{ ok?: boolean; logs?: any[] }>(
        '/api/admin/grand-line-audit-logs'
      );
      if (!res.ok || !Array.isArray(res.data?.logs)) return [];
      return res.data.logs.map((row: any) => {
        const ms = Number(row.timestampMs || Date.now());
        return {
          id: String(row.id || `gl_${ms}`),
          adminEmail: String(row.adminEmail || 'admin'),
          action: String(row.action || 'grand_line_schedule_status_updated'),
          targetUid: row.targetUid || undefined,
          targetEmail: row.targetEmail || undefined,
          details: row.details || {},
          timestamp: Timestamp.fromMillis(ms),
        } as AuditLog;
      });
    } catch {
      return [];
    }
  };

  const mergeLogs = (firestoreLogs: AuditLog[], serverLogs: AuditLog[]): AuditLog[] => {
    const byKey = new Map<string, AuditLog>();
    for (const item of [...firestoreLogs, ...serverLogs]) {
      const ms = item.timestamp?.toMillis
        ? item.timestamp.toMillis()
        : (item.timestamp as any)?.seconds
        ? (item.timestamp as any).seconds * 1000
        : 0;
      const d = (item.details || {}) as Record<string, any>;
      // Deduplicate if both client Firestore and server recorded the same schedule update within 5s
      const dedupKey =
        item.action === 'grand_line_schedule_status_updated' && d.testId
          ? `gl_sched:${d.testId}:${d.newStatus}:${d.newWindow}:${Math.floor(ms / 5000)}`
          : item.id;
      if (!byKey.has(dedupKey)) {
        byKey.set(dedupKey, item);
      }
    }
    return Array.from(byKey.values())
      .sort((a, b) => {
        const aMs = a.timestamp?.toMillis ? a.timestamp.toMillis() : ((a.timestamp as any)?.seconds || 0) * 1000;
        const bMs = b.timestamp?.toMillis ? b.timestamp.toMillis() : ((b.timestamp as any)?.seconds || 0) * 1000;
        return bMs - aMs;
      })
      .slice(0, limitCount);
  };

  const serverLogsPromise = fetchServerGrandLineAuditLogs();

  try {
    const ref = collection(db, 'auditLogs');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(limitCount));
    const [snap, serverLogs] = await Promise.all([getDocs(q), serverLogsPromise]);
    const firestoreLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    return mergeLogs(firestoreLogs, serverLogs);
  } catch (err) {
    // If index is not yet built, fall back to simple limit without order
    console.warn('[AdminService] fetchAuditLogs fallback:', err);
    try {
      const [snap, serverLogs] = await Promise.all([
        getDocs(query(collection(db, 'auditLogs'), limit(limitCount))),
        serverLogsPromise,
      ]);
      const firestoreLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
      return mergeLogs(firestoreLogs, serverLogs);
    } catch (fallbackErr) {
      console.warn('[AdminService] fetchAuditLogs secondary fallback warning:', fallbackErr);
      return await serverLogsPromise;
    }
  }
}


export async function fetchUserAttempts(targetUid: string): Promise<Record<string, unknown>[]> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', targetUid),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[AdminService] fetchUserAttempts error:', err);
    return [];
  }
}

// ─── DEDICATED SUBJECT QUESTION POOLS ────────────────────────────────────────
// Generic structure supporting dedicated collections per subject, starting with Mathematics.

export function getSubjectPoolCollection(subject: string): string {
  const norm = (subject || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `questions_${norm}`;
}

export function isSubjectPoolSupported(subject: string): boolean {
  const norm = (subject || '').trim().toLowerCase();
  return norm === 'mathematics' || norm === 'math' || norm === 'maths';
}

export interface PoolTopicCount {
  name: string;
  count: number;
}

export interface SubjectCardInfo {
  slug: string;
  name: string;
  isPool: boolean;
  poolCollection: string;
  count: number;
}

export const INITIAL_MATHEMATICS_MCQS = [
  {
    topic: 'Calculus & Differentiation',
    text: 'What is the derivative of $f(x) = \\ln(\\sin(x))$ with respect to $x$ for $\\sin(x) > 0$?',
    options: ['$\\cot(x)$', '$\\tan(x)$', '$-\\cot(x)$', '$\\frac{1}{\\sin(x)}$'] as [string, string, string, string],
    correct: 0,
    explain: 'By the chain rule, $\\frac{d}{dx}[\\ln(\\sin(x))] = \\frac{1}{\\sin(x)} \\cdot \\cos(x) = \\cot(x)$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Calculus & Differentiation',
    text: 'The function $f(x) = 2x^3 - 9x^2 + 12x + 5$ has a local maximum at $x$ equal to:',
    options: ['$x = 1$', '$x = 2$', '$x = 3$', '$x = 0$'] as [string, string, string, string],
    correct: 0,
    explain: '$f\'(x) = 6x^2 - 18x + 12 = 6(x-1)(x-2) = 0$. $f\'\'(x) = 12x - 18$. At $x = 1$, $f\'\'(1) = -6 < 0$ (local maximum).',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Integration by Parts & Definite Integrals',
    text: 'Evaluate the definite integral $\\int_{0}^{1} x e^x \\, dx$:',
    options: ['$1$', '$e - 1$', '$e - 2$', '$2$'] as [string, string, string, string],
    correct: 0,
    explain: 'Using integration by parts $\\int u v\' = uv - \\int u\' v$: with $u = x, v = e^x$, $\\int x e^x dx = [x e^x - e^x]_0^1 = (e - e) - (0 - 1) = 1$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Integration by Parts & Definite Integrals',
    text: 'The value of $\\int_{0}^{\\pi/2} \\sin^2(x) \\, dx$ is equal to:',
    options: ['$\\frac{\\pi}{4}$', '$\\frac{\\pi}{2}$', '$1$', '$\\frac{\\pi}{8}$'] as [string, string, string, string],
    correct: 0,
    explain: 'Using $\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}$, $\\int_{0}^{\\pi/2} \\frac{1 - \\cos(2x)}{2} dx = [\\frac{x}{2} - \\frac{\\sin(2x)}{4}]_0^{\\pi/2} = \\frac{\\pi}{4}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Matrices & Determinants',
    text: 'If $A$ is a non-singular square matrix of order $3 \\times 3$ and $|A| = 4$, then $|\\text{adj}(A)|$ is:',
    options: ['$16$', '$64$', '$4$', '$12$'] as [string, string, string, string],
    correct: 0,
    explain: 'For an $n \\times n$ matrix, $|\\text{adj}(A)| = |A|^{n-1}$. Here $n = 3$, so $|\\text{adj}(A)| = 4^{3-1} = 4^2 = 16$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Matrices & Determinants',
    text: 'A square matrix $A$ is called skew-symmetric if and only if:',
    options: ['$A^T = -A$', '$A^T = A$', '$A^{-1} = A^T$', '$A^2 = I$'] as [string, string, string, string],
    correct: 0,
    explain: 'By definition, a matrix $A$ is skew-symmetric if its transpose equals its negative, $A^T = -A$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Trigonometry & Complex Numbers',
    text: 'The modulus and principal argument of the complex number $z = 1 + i\\sqrt{3}$ are:',
    options: ['$r = 2, \\theta = \\frac{\\pi}{3}$', '$r = 4, \\theta = \\frac{\\pi}{6}$', '$r = 2, \\theta = \\frac{\\pi}{6}$', '$r = \\sqrt{2}, \\theta = \\frac{\\pi}{4}$'] as [string, string, string, string],
    correct: 0,
    explain: '$r = \\sqrt{1^2 + (\\sqrt{3})^2} = \\sqrt{4} = 2$. $\\tan(\\theta) = \\frac{\\sqrt{3}}{1} \\implies \\theta = \\frac{\\pi}{3}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Trigonometry & Complex Numbers',
    text: 'The period of the trigonometric function $f(x) = \\tan(3x)$ is:',
    options: ['$\\frac{\\pi}{3}$', '$\\frac{2\\pi}{3}$', '$\\pi$', '$3\\pi$'] as [string, string, string, string],
    correct: 0,
    explain: 'The fundamental period of $\\tan(x)$ is $\\pi$. For $\\tan(kx)$, the period is $\\frac{\\pi}{|k|} = \\frac{\\pi}{3}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Analytic Geometry & Conic Sections',
    text: 'The equation of the tangent to the parabola $y^2 = 4ax$ at the point $(x_1, y_1)$ is:',
    options: ['$y y_1 = 2a(x + x_1)$', '$y y_1 = 4a(x + x_1)$', '$x x_1 + y y_1 = a^2$', '$y - y_1 = 4a(x - x_1)$'] as [string, string, string, string],
    correct: 0,
    explain: 'Differentiating $y^2 = 4ax$ gives $2y \\frac{dy}{dx} = 4a \\implies m = \\frac{2a}{y_1}$. The point-slope form gives $y - y_1 = \\frac{2a}{y_1}(x - x_1) \\implies y y_1 = 2a(x + x_1)$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Analytic Geometry & Conic Sections',
    text: 'The eccentricity $e$ of an ellipse satisfies which of the following conditions?',
    options: ['$0 < e < 1$', '$e = 1$', '$e > 1$', '$e = 0$'] as [string, string, string, string],
    correct: 0,
    explain: 'For an ellipse, the eccentricity strictly satisfies $0 < e < 1$. ($e = 1$ is a parabola, $e > 1$ is a hyperbola, $e = 0$ is a circle).',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Vectors & 3D Geometry',
    text: 'The angle between two vectors $\\vec{a} = 2\\hat{i} + \\hat{j} - \\hat{k}$ and $\\vec{b} = \\hat{i} - \\hat{j} + \\hat{k}$ is:',
    options: ['$\\frac{\\pi}{2}$', '$\\frac{\\pi}{4}$', '$\\frac{\\pi}{3}$', '$0$'] as [string, string, string, string],
    correct: 0,
    explain: '$\\vec{a} \\cdot \\vec{b} = (2)(1) + (1)(-1) + (-1)(1) = 2 - 1 - 1 = 0$. Since dot product is zero, $\\theta = 90^\\circ = \\frac{\\pi}{2}$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Vectors & 3D Geometry',
    text: 'If three vectors $\\vec{a}, \\vec{b}, \\vec{c}$ are coplanar, their scalar triple product $[\\vec{a} \\, \\vec{b} \\, \\vec{c}]$ is equal to:',
    options: ['$0$', '$1$', '$\\vec{a} \\times (\\vec{b} \\times \\vec{c})$', 'Non-zero scalar'] as [string, string, string, string],
    correct: 0,
    explain: 'Vectors are coplanar if and only if the volume of the parallelepiped formed by them is zero, so $[\\vec{a} \\, \\vec{b} \\, \\vec{c}] = \\vec{a} \\cdot (\\vec{b} \\times \\vec{c}) = 0$.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
  {
    topic: 'Sequences, Series & Binomial Theorem',
    text: 'The sum to infinity of the geometric progression $4, \\frac{4}{3}, \\frac{4}{9}, \\frac{4}{27}, \\dots$ is:',
    options: ['$6$', '$8$', '$4$', '$12$'] as [string, string, string, string],
    correct: 0,
    explain: '$a = 4$ and $r = \\frac{1}{3}$. Since $|r| < 1$, $S_\\infty = \\frac{a}{1 - r} = \\frac{4}{1 - 1/3} = \\frac{4}{2/3} = 6$.',
    difficulty: 'medium' as const,
    status: 'published' as const,
  },
  {
    topic: 'Sequences, Series & Binomial Theorem',
    text: 'The number of terms in the expansion of $(2x + 3y)^{10}$ is:',
    options: ['$11$', '$10$', '$9$', '$21$'] as [string, string, string, string],
    correct: 0,
    explain: 'The number of terms in the binomial expansion of $(a + b)^n$ is always $n + 1$. For $n = 10$, there are $10 + 1 = 11$ terms.',
    difficulty: 'easy' as const,
    status: 'published' as const,
  },
];

export async function seedInitialMathPool(adminEmail: string): Promise<number> {
  const collName = getSubjectPoolCollection('mathematics');
  const snap = await getDocs(query(collection(db, collName), limit(5)));
  if (!snap.empty) {
    return 0; // Already seeded
  }

  const batch = writeBatch(db);
  let count = 0;
  for (const item of INITIAL_MATHEMATICS_MCQS) {
    const qId = `math_${Date.now()}_${count}_${Math.random().toString(36).substring(2, 6)}`;
    const cHash = await computeContentHash(item.text, item.options);
    batch.set(doc(db, collName, qId), {
      id: qId,
      subject: 'mathematics',
      topic: item.topic,
      chapter: item.topic,
      text: item.text,
      q: item.text,
      question: item.text,
      options: item.options,
      correct: item.correct,
      correctAnswer: item.correct,
      explain: item.explain,
      explanation: item.explain,
      difficulty: item.difficulty,
      status: item.status,
      active: true,
      rand: Math.random(),
      contentHash: cHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminEmail,
    });
    count++;
  }
  await batch.commit();
  await logAdminAction(adminEmail, 'seed_math_pool', { count });
  return count;
}

// ─── ULTRA-LOW-READ STATS & INDEX SYSTEM ────────────────────────────────────
export interface QuestionCountsDoc {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
  updatedAt?: unknown;
}

// In-memory session caches to eliminate repeated Firestore reads
let cachedQuestionCountsDoc: QuestionCountsDoc | null = null;
let countsDocFetchPromise: Promise<QuestionCountsDoc> | null = null;
const subjectQuestionIndexCache = new Map<string, string[]>();
const questionsPageCache = new Map<string, PaginatedQuestionsResult>();

export function clearQuestionsCache(): void {
  questionsPageCache.clear();
}

/**
 * Fetches or initializes the single lightweight stats document `stats/questionCounts`.
 * Requires exactly ONE document read for the entire session.
 */
export async function getQuestionCountsDoc(): Promise<QuestionCountsDoc> {
  if (cachedQuestionCountsDoc) {
    return cachedQuestionCountsDoc;
  }
  if (countsDocFetchPromise) {
    return countsDocFetchPromise;
  }

  countsDocFetchPromise = (async () => {
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const data = snap.data() as QuestionCountsDoc;
        cachedQuestionCountsDoc = {
          subjectCounts: data.subjectCounts || {},
          topicCounts: data.topicCounts || {},
        };
        return cachedQuestionCountsDoc;
      }

      // Initialize default counts document without reading any questions
      const initSubjects: Record<string, number> = {
        mathematics: 10,
        physics: 0,
        chemistry: 0,
        'computer-science': 0,
        english: 0,
        biology: 0,
        'analytical-reasoning': 0,
      };
      const initTopics: Record<string, Record<string, number>> = {
        mathematics: {
          'Calculus & Differentiation': 4,
          'Integration by Parts & Definite Integrals': 2,
          'Analytic Geometry & Conic Sections': 1,
          'Vectors & 3D Geometry': 2,
          'Sequences, Series & Binomial Theorem': 2,
        },
      };

      const newDoc: QuestionCountsDoc = {
        subjectCounts: initSubjects,
        topicCounts: initTopics,
      };

      cachedQuestionCountsDoc = newDoc;
      setDoc(statsRef, { ...newDoc, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      return cachedQuestionCountsDoc;
    } catch (err) {
      console.warn('[AdminService] getQuestionCountsDoc notice:', err);
      cachedQuestionCountsDoc = {
        subjectCounts: { mathematics: 10 },
        topicCounts: {
          mathematics: {
            'Calculus & Differentiation': 4,
            'Integration by Parts & Definite Integrals': 2,
          },
        },
      };
      return cachedQuestionCountsDoc;
    } finally {
      countsDocFetchPromise = null;
    }
  })();

  return countsDocFetchPromise;
}

/**
 * Reads the small index document listing question IDs for a subject: `stats/questionIndex_{subject}`.
 * Allows picking random IDs without ever reading the whole pool or scanning all docs.
 */
export async function getSubjectQuestionIds(subject: string): Promise<string[]> {
  const norm = subject.toLowerCase().trim();
  if (subjectQuestionIndexCache.has(norm)) {
    return subjectQuestionIndexCache.get(norm)!;
  }

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    const snap = await getDoc(indexRef);
    if (snap.exists()) {
      const data = snap.data();
      const ids: string[] = Array.isArray(data.ids) ? data.ids : [];
      subjectQuestionIndexCache.set(norm, ids);
      return ids;
    }

    // If index doc doesn't exist yet, query existing IDs with small limit
    const targetColl = isSubjectPoolSupported(norm) ? getSubjectPoolCollection(norm) : 'questions';
    const qSnap = await getDocs(
      query(collection(db, targetColl), where('status', '==', 'published'), limit(30))
    );
    const ids = qSnap.docs.map((d) => d.id);
    subjectQuestionIndexCache.set(norm, ids);
    setDoc(indexRef, { subject: norm, ids, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    return ids;
  } catch (err) {
    console.warn(`[Index] Could not fetch question index for ${norm}:`, err);
    return subjectQuestionIndexCache.get(norm) || [];
  }
}

export async function addIdToSubjectIndex(subject: string, id: string | string[]): Promise<void> {
  const norm = subject.toLowerCase().trim();
  const idArray = Array.isArray(id) ? id : [id];
  const current = subjectQuestionIndexCache.get(norm) || [];
  const updated = Array.from(new Set([...current, ...idArray]));
  subjectQuestionIndexCache.set(norm, updated);

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    await setDoc(
      indexRef,
      {
        subject: norm,
        ids: arrayUnion(...idArray),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-fatal
  }
}

export async function removeIdFromSubjectIndex(subject: string, id: string): Promise<void> {
  const norm = subject.toLowerCase().trim();
  const current = subjectQuestionIndexCache.get(norm) || [];
  subjectQuestionIndexCache.set(norm, current.filter((x) => x !== id));

  try {
    const indexRef = doc(db, 'stats', `questionIndex_${norm}`);
    await updateDoc(indexRef, {
      ids: arrayRemove(id),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Returns subject counts from the single small stats document `stats/questionCounts`.
 * Does NOT read all questions or perform unpaginated scans.
 */
export async function fetchSubjectPoolCounts(): Promise<Record<string, number>> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    const docData = await getMultiSourceQuestionCounts();
    return docData.subjectCounts;
  }
  const docData = await getQuestionCountsDoc();
  return docData.subjectCounts;
}

/**
 * Returns topic counts from the cached stats document.
 * Requires ZERO additional reads.
 */
export async function fetchSubjectTopics(subject: string): Promise<PoolTopicCount[]> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    return await fetchMultiSourceSubjectTopics(subject);
  }
  const norm = (subject || '').trim().toLowerCase();
  const docData = await getQuestionCountsDoc();
  const subTopics = docData.topicCounts[norm] || {};
  const list: PoolTopicCount[] = [];

  if (Object.keys(subTopics).length === 0) {
    const defaultChapters = getChaptersForSubject(norm);
    defaultChapters.forEach((ch) => {
      list.push({ name: ch.name, count: 0 });
    });
  } else {
    for (const [name, count] of Object.entries(subTopics)) {
      list.push({ name, count });
    }
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads questions in pages of 20 with limit and cursor ("Load more").
 * Caches first page results in-memory for the session so going back and forth does not re-read.
 */
export async function fetchPoolQuestionsPaginated(filters: {
  subject: string;
  topic?: string;
  search?: string;
  difficulty?: string;
  status?: string;
  bank?: string;
  needsReview?: boolean;
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  pageIndex?: number;
}): Promise<PaginatedQuestionsResult> {
  const count = filters.limitCount ?? 20;
  const isFirstPage = !filters.startAfterDoc && !filters.pageIndex;
  const cacheKey = `${filters.subject}__${filters.topic || 'all'}__${filters.difficulty || 'all'}__${filters.status || 'all'}__${filters.bank || 'all'}__${filters.needsReview === undefined ? 'all' : filters.needsReview ? '1' : '0'}__${(filters.search || '').trim().toLowerCase()}__p${filters.pageIndex || 0}`;

  // Session-level in-memory cache check
  if (isFirstPage && questionsPageCache.has(cacheKey)) {
    return questionsPageCache.get(cacheKey)!;
  }

  if (ENABLE_MULTI_SOURCE_BANK) {
    const res = await fetchMultiSourceQuestionsPaginated({
      subject: filters.subject,
      topic: filters.topic,
      search: filters.search,
      difficulty: filters.difficulty,
      status: filters.status,
      bank: filters.bank,
      needsReview: filters.needsReview,
      pageIndex: filters.pageIndex || 0,
      pageSize: count,
    });
    const result: PaginatedQuestionsResult = {
      questions: res.questions,
      lastDoc: null,
      hasMore: res.hasMore,
    };
    if (isFirstPage) {
      questionsPageCache.set(cacheKey, result);
    }
    return result;
  }

  const isPool = isSubjectPoolSupported(filters.subject);

  if (!isPool) {
    // Fall back to existing bank questions with page size 20
    const res = await fetchQuestionsPaginated({
      search: filters.search,
      subject: filters.subject,
      difficulty: filters.difficulty,
      limitCount: count,
      startAfterDoc: filters.startAfterDoc,
    });
    if (isFirstPage) {
      questionsPageCache.set(cacheKey, res);
    }
    return res;
  }

  const collName = getSubjectPoolCollection(filters.subject);
  const constraints: QueryConstraint[] = [];

  if (filters.topic && filters.topic !== 'all') {
    constraints.push(where('topic', '==', filters.topic));
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    constraints.push(where('difficulty', '==', filters.difficulty.toLowerCase()));
  }
  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status.toLowerCase()));
  }
  if (filters.startAfterDoc) {
    constraints.push(startAfter(filters.startAfterDoc));
  }
  constraints.push(limit(count));

  try {
    const q = query(collection(db, collName), ...constraints);
    const snap = await getDocs(q);

    let questions: Question[] = snap.docs.map((d) => {
      const data = d.data();
      const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
      const text = data.text || data.q || data.question || '';
      return {
        id: d.id,
        ...data,
        subject: filters.subject.toLowerCase(),
        chapter: data.topic || data.chapter || 'general',
        topic: data.topic || data.chapter || 'general',
        difficulty: (data.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
        status: (data.status || 'published').toLowerCase() as 'draft' | 'reviewed' | 'published',
        active: data.active !== false,
        q: text,
        question: text,
        stem: text,
        options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
        tags: Array.isArray(data.tags) ? data.tags : ['entrance'],
        rand: typeof data.rand === 'number' ? data.rand : 0.5,
        schemaVersion: 1,
        contentHash: data.contentHash || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy || '',
        correct: typeof data.correct === 'number' ? data.correct : (typeof data.correctAnswer === 'number' ? data.correctAnswer : 0),
        correctAnswer: typeof data.correctAnswer === 'number' ? data.correctAnswer : (typeof data.correct === 'number' ? data.correct : 0),
        explain: data.explain || data.explanation || '',
        explanation: data.explanation || data.explain || '',
      } as Question;
    });

    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      questions = questions.filter((item) =>
        (item.q || item.question || '').toLowerCase().includes(term) ||
        (item.topic || item.chapter || '').toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.options.some((o) => o.toLowerCase().includes(term))
      );
    }

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length >= count;

    const result: PaginatedQuestionsResult = {
      questions,
      lastDoc: last,
      hasMore,
    };

    if (isFirstPage) {
      questionsPageCache.set(cacheKey, result);
    }

    return result;
  } catch (err: unknown) {
    console.warn(`[AdminService] fetchPoolQuestionsPaginated ${collName} notice:`, err);
    throw err;
  }
}

export async function saveSubjectPoolQuestion(
  adminEmail: string,
  question: {
    id?: string;
    subject: string;
    topic: string;
    text: string;
    options: [string, string, string, string];
    correct: number;
    explain?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'draft' | 'reviewed' | 'published';
  },
  sourceId?: string
): Promise<string> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    const targetSource =
      sourceId ||
      (question.id ? parseQuestionCompoundId(question.id).sourceId : getDefaultWriteSource().id);
    const res = await saveMultiSourceQuestion(adminEmail, targetSource, question);
    await logAdminAction(adminEmail, 'save_pool_question', {
      sourceId: res.sourceId,
      questionId: res.compoundId,
      topic: question.topic,
      subject: question.subject,
    });
    return res.compoundId;
  }

  const normSub = question.subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const qText = (question.text || '').trim();
  const topic = (question.topic || 'General Concepts').trim();
  const cHash = await computeContentHash(qText, question.options);

  // Deterministic document ID based on content hash
  const qId = question.id && !question.id.startsWith('q_custom')
    ? question.id
    : `pool_${normSub}_${cHash.substring(0, 20)}`;

  const isNew = !question.id || question.id.startsWith('q_custom');

  const docData: Record<string, unknown> = {
    id: qId,
    subject: normSub,
    topic,
    chapter: topic,
    text: qText,
    q: qText,
    question: qText,
    options: question.options,
    correct: question.correct,
    correctAnswer: question.correct,
    explain: (question.explain || '').trim(),
    explanation: (question.explain || '').trim(),
    difficulty: question.difficulty,
    status: question.status,
    active: true,
    rand: Math.random(),
    contentHash: cHash,
    updatedAt: serverTimestamp(),
    createdBy: adminEmail,
  };

  await setDoc(doc(db, collName, qId), docData, { merge: true });

  // Update in-memory counts doc
  if (isNew) {
    if (cachedQuestionCountsDoc) {
      cachedQuestionCountsDoc.subjectCounts[normSub] = (cachedQuestionCountsDoc.subjectCounts[normSub] || 0) + 1;
      if (!cachedQuestionCountsDoc.topicCounts[normSub]) cachedQuestionCountsDoc.topicCounts[normSub] = {};
      cachedQuestionCountsDoc.topicCounts[normSub][topic] = (cachedQuestionCountsDoc.topicCounts[normSub][topic] || 0) + 1;
    }
    // Update stats/questionCounts document
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(
        statsRef,
        {
          [`subjectCounts.${normSub}`]: increment(1),
          [`topicCounts.${normSub}.${topic}`]: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }

    // Add to subject question index
    await addIdToSubjectIndex(normSub, qId);
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'save_pool_question', {
    pool: collName,
    questionId: qId,
    topic,
    subject: normSub,
  });

  return qId;
}

export async function deletePoolQuestion(
  adminEmail: string,
  subject: string,
  questionId: string
): Promise<void> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    await deleteMultiSourceQuestion(adminEmail, subject, questionId);
    await logAdminAction(adminEmail, 'delete_pool_question', {
      subject,
      questionId,
    });
    return;
  }

  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  await deleteDoc(doc(db, collName, questionId));

  // Decrement count in stats/questionCounts
  if (cachedQuestionCountsDoc) {
    cachedQuestionCountsDoc.subjectCounts[normSub] = Math.max(0, (cachedQuestionCountsDoc.subjectCounts[normSub] || 1) - 1);
  }
  try {
    const statsRef = doc(db, 'stats', 'questionCounts');
    await setDoc(
      statsRef,
      {
        [`subjectCounts.${normSub}`]: increment(-1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-fatal
  }

  await removeIdFromSubjectIndex(normSub, questionId);
  clearQuestionsCache();

  await logAdminAction(adminEmail, 'delete_pool_question', {
    pool: collName,
    subject: normSub,
    questionId,
  });
}

export async function renamePoolTopic(
  adminEmail: string,
  subject: string,
  oldTopic: string,
  newTopic: string
): Promise<number> {
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cleanNew = newTopic.trim();

  if (!USE_FIRESTORE_QUESTION_READER) {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
    const resp = await fetch('/api/questions/batch', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        subject: normSub,
        oldTopic,
        newTopic: cleanNew,
      }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData?.error || `Failed to rename topic in D1 (HTTP ${resp.status})`);
    }
    const data = await resp.json();
    clearMultiSourceCache();
    clearQuestionsCache();
    return Number(data?.updatedCount ?? 0);
  }

  const collName = getSubjectPoolCollection(normSub);

  // Query ONLY questions matching oldTopic with a safe limit of 200 (never read whole collection)
  const q = query(collection(db, collName), where('topic', '==', oldTopic), limit(200));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, {
      topic: cleanNew,
      chapter: cleanNew,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  const count = snap.docs.length;

  // Update in stats/questionCounts
  if (cachedQuestionCountsDoc && cachedQuestionCountsDoc.topicCounts[normSub]) {
    const oldCnt = cachedQuestionCountsDoc.topicCounts[normSub][oldTopic] || count;
    delete cachedQuestionCountsDoc.topicCounts[normSub][oldTopic];
    cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] = (cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] || 0) + oldCnt;
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'rename_pool_topic', {
    pool: collName,
    subject: normSub,
    oldTopic,
    newTopic: cleanNew,
    count,
  });

  return count;
}

export async function moveQuestionsToTopic(
  adminEmail: string,
  subject: string,
  questionIds: string[],
  newTopic: string
): Promise<number> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    const count = await moveMultiSourceQuestionsToTopic(adminEmail, subject, questionIds, newTopic);
    await logAdminAction(adminEmail, 'move_pool_questions_topic', {
      subject,
      questionCount: count,
      newTopic,
    });
    return count;
  }

  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const cleanNew = newTopic.trim();
  const chunkSize = 400;
  let count = 0;

  for (let i = 0; i < questionIds.length; i += chunkSize) {
    const chunk = questionIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.update(doc(db, collName, id), {
        topic: cleanNew,
        chapter: cleanNew,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    count += chunk.length;
  }

  // Update in stats/questionCounts
  if (cachedQuestionCountsDoc && cachedQuestionCountsDoc.topicCounts[normSub]) {
    cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] = (cachedQuestionCountsDoc.topicCounts[normSub][cleanNew] || 0) + count;
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'move_pool_questions_topic', {
    pool: collName,
    subject: normSub,
    questionCount: count,
    newTopic: cleanNew,
  });

  return count;
}

/**
 * Imports questions using deterministic document IDs derived from question content hashes.
 * Duplicates are detected without reading the pool.
 */
export async function batchImportPoolQuestions(
  adminEmail: string,
  targetSubject: string,
  defaultTopic: string,
  rawRows: Array<Record<string, unknown>>,
  onProgress?: (done: number, total: number) => void,
  targetSourceId?: string
): Promise<ImportResult> {
  if (ENABLE_MULTI_SOURCE_BANK) {
    const srcId = targetSourceId || getDefaultWriteSource().id;
    const res = await batchImportMultiSourceQuestions(
      adminEmail,
      srcId,
      targetSubject,
      defaultTopic,
      rawRows,
      onProgress
    );
    await logAdminAction(adminEmail, 'batch_import_pool_questions', {
      sourceId: srcId,
      targetSubject,
      imported: res.imported,
      duplicatesSkipped: res.duplicatesSkipped,
    });
    return res;
  }

  const result: ImportResult = {
    imported: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  const normTargetSub = targetSubject.toLowerCase().trim();

  // 1. Fetch existing question IDs from the small index doc (ZERO reads of questions collection)
  const existingIds = await getSubjectQuestionIds(normTargetSub);
  const existingIdSet = new Set(existingIds);
  const newlyAddedIds: string[] = [];
  const topicCountsAdded: Record<string, number> = {};

  const validItems: Array<{ qId: string; docData: Record<string, unknown> }> = [];

  for (const row of rawRows) {
    const rowSub = (row.subject ? String(row.subject) : normTargetSub).trim().toLowerCase();
    const rowTopic = (row.topic || row.chapter ? String(row.topic || row.chapter) : defaultTopic).trim();
    const qText = (row.text || row.q || row.question || row.stem ? String(row.text || row.q || row.question || row.stem) : '').trim();

    let options: [string, string, string, string] = ['', '', '', ''];
    if (Array.isArray(row.options) && row.options.length >= 4) {
      options = [String(row.options[0] || ''), String(row.options[1] || ''), String(row.options[2] || ''), String(row.options[3] || '')];
    } else {
      const optA = String(row.optionA || row.option_a || row.opt1 || row.a || '').trim();
      const optB = String(row.optionB || row.option_b || row.opt2 || row.b || '').trim();
      const optC = String(row.optionC || row.option_c || row.opt3 || row.c || '').trim();
      const optD = String(row.optionD || row.option_d || row.opt4 || row.d || '').trim();
      options = [optA, optB, optC, optD];
    }

    if (!qText || options.some((o) => !o.trim())) {
      result.errors.push('Row skipped due to empty stem or options.');
      continue;
    }

    const cHash = await computeContentHash(qText, options);
    // Deterministic document ID derived from question text hash
    const qId = `pool_${rowSub}_${cHash.substring(0, 20)}`;

    if (existingIdSet.has(qId)) {
      result.duplicatesSkipped++;
      continue;
    }
    existingIdSet.add(qId);
    newlyAddedIds.push(qId);
    topicCountsAdded[rowTopic] = (topicCountsAdded[rowTopic] || 0) + 1;

    // Resolve correct answer
    const rawCorrect = row.correct !== undefined ? row.correct : (row.correctAnswer !== undefined ? row.correctAnswer : row.answer);
    const resolved = normalizeCorrectAnswer(rawCorrect, options);
    const correctIdx = resolved ? resolved.correctIndex : 0;

    const explain = String(row.explain || row.explanation || '').trim();
    const diff = (String(row.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard');
    const status = (String(row.status || 'published').toLowerCase() as 'draft' | 'reviewed' | 'published');

    validItems.push({
      qId,
      docData: {
        id: qId,
        subject: rowSub,
        topic: rowTopic,
        chapter: rowTopic,
        text: qText,
        q: qText,
        question: qText,
        options,
        correct: correctIdx,
        correctAnswer: correctIdx,
        explain,
        explanation: explain,
        difficulty: diff,
        status,
        active: true,
        rand: Math.random(),
        contentHash: cHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminEmail,
      },
    });
  }

  // Batch insert
  const chunkSize = 400;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const targetColl = getSubjectPoolCollection(String(item.docData.subject));
      batch.set(doc(db, targetColl, item.qId), item.docData);
    }
    await batch.commit();
    result.imported += chunk.length;
    if (onProgress) onProgress(result.imported, validItems.length);
  }

  // Update question index and counts document in stats
  if (result.imported > 0) {
    await addIdToSubjectIndex(normTargetSub, newlyAddedIds);

    if (cachedQuestionCountsDoc) {
      cachedQuestionCountsDoc.subjectCounts[normTargetSub] = (cachedQuestionCountsDoc.subjectCounts[normTargetSub] || 0) + result.imported;
      if (!cachedQuestionCountsDoc.topicCounts[normTargetSub]) cachedQuestionCountsDoc.topicCounts[normTargetSub] = {};
      for (const [top, cnt] of Object.entries(topicCountsAdded)) {
        cachedQuestionCountsDoc.topicCounts[normTargetSub][top] = (cachedQuestionCountsDoc.topicCounts[normTargetSub][top] || 0) + cnt;
      }
    }
    try {
      const statsRef = doc(db, 'stats', 'questionCounts');
      await setDoc(statsRef, cachedQuestionCountsDoc, { merge: true });
    } catch {
      // Non-fatal
    }
  }

  clearQuestionsCache();

  await logAdminAction(adminEmail, 'batch_import_pool_questions', {
    targetSubject: normTargetSub,
    imported: result.imported,
    duplicatesSkipped: result.duplicatesSkipped,
  });

  return result;
}

