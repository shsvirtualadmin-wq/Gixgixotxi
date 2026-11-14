import {
  fetchAdminStats,
  getCachedAdminStats,
  fetchAuditLogs,
  fetchUsersPaginated,
  getCachedAdminUsersState,
  type AdminStats,
} from './adminService';
import {
  fetchRewardsHealth,
  fetchRewardsState,
  type RewardsHealthResponse,
} from './rewardsService';
import type { RewardsMode } from '@/lib/rewardsEngine';
import type { AuditLog } from '@/types';
import type { CrewDoc, PublicCrewSummary } from '@/types/crew';
import { fetchCrewLeaderboard, fetchCrewDetails } from './crewService';
import {
  fetchAdminCertificates,
  type StudentCertificateRecord,
  type AdminSignatureRecord,
  type AdminMockSummary,
} from './certificateService';
import {
  getAllCaptainsAdminData,
  type CaptainAdminSummary,
} from './referralService';
import { getCaptainAllotmentStatus } from './kobanService';
import {
  fetchUniversities,
  fetchBankHealth,
  fetchMcqReports,
  fetchMcqs,
  fetchUniversityTopics,
  getInitialCachedUniversities,
  type BankHealthData,
} from './universityMcqService';
import type {
  D1UniversityRow,
  D1McqRow,
  D1McqReportRow,
} from '@/constants/d1Universities';

const SWR_TTL_MS = 60_000;

// ============================================================================
// 1. ADMIN OVERVIEW SWR CACHE
// ============================================================================
export interface AdminOverviewCacheData {
  stats: AdminStats;
  recentLogs: AuditLog[];
  rewardsMode: RewardsMode | null;
  rewardsHealth: RewardsHealthResponse | null;
  updatedAt: number;
}

let overviewCache: AdminOverviewCacheData | null = null;
let overviewInFlight: Promise<AdminOverviewCacheData> | null = null;

export function getCachedAdminOverview(): AdminOverviewCacheData | null {
  if (overviewCache) return overviewCache;
  const cachedStats = getCachedAdminStats();
  if (cachedStats) {
    return {
      stats: cachedStats,
      recentLogs: [],
      rewardsMode: null,
      rewardsHealth: null,
      updatedAt: Date.now() - SWR_TTL_MS,
    };
  }
  return null;
}

export async function fetchAdminOverviewSWR(
  uid: string,
  options?: {
    force?: boolean;
    onUpdate?: (data: AdminOverviewCacheData) => void;
  }
): Promise<AdminOverviewCacheData> {
  const now = Date.now();
  const isFresh =
    overviewCache &&
    !options?.force &&
    now - overviewCache.updatedAt < SWR_TTL_MS;

  if (isFresh && overviewCache) {
    return overviewCache;
  }

  if (overviewInFlight && !options?.force) {
    return overviewInFlight;
  }

  const runFetch = async (): Promise<AdminOverviewCacheData> => {
    const [stats, recentLogs, rState, rewardsHealth] = await Promise.all([
      fetchAdminStats({ force: options?.force }),
      fetchAuditLogs(5).catch(() => overviewCache?.recentLogs || ([] as AuditLog[])),
      fetchRewardsState(uid).catch(() => null),
      fetchRewardsHealth().catch(() => overviewCache?.rewardsHealth || null),
    ]);

    const next: AdminOverviewCacheData = {
      stats,
      recentLogs,
      rewardsMode: rState?.mode ?? overviewCache?.rewardsMode ?? null,
      rewardsHealth: rewardsHealth ?? overviewCache?.rewardsHealth ?? null,
      updatedAt: Date.now(),
    };
    overviewCache = next;
    options?.onUpdate?.(next);
    return next;
  };

  overviewInFlight = runFetch().finally(() => {
    overviewInFlight = null;
  });

  if (overviewCache && !options?.force) {
    void overviewInFlight.catch(() => {});
    return overviewCache;
  }

  return overviewInFlight;
}

// ============================================================================
// 2. ADMIN STUDY CREWS SWR CACHE
// ============================================================================
export interface AdminCrewsCacheData {
  crews: PublicCrewSummary[];
  total: number;
  updatedAt: number;
}

let crewsCache: AdminCrewsCacheData | null = null;
let crewsInFlight: Promise<AdminCrewsCacheData> | null = null;
const crewDetailsCache = new Map<string, { detail: CrewDoc; updatedAt: number }>();

export function getCachedAdminCrews(): AdminCrewsCacheData | null {
  return crewsCache;
}

export function getCachedAdminCrewDetail(crewId: string): CrewDoc | null {
  return crewDetailsCache.get(crewId)?.detail || null;
}

export function setCachedAdminCrewDetail(crewId: string, detail: CrewDoc): void {
  crewDetailsCache.set(crewId, { detail, updatedAt: Date.now() });
}

export function invalidateAdminCrewsCache(): void {
  if (crewsCache) {
    crewsCache = { ...crewsCache, updatedAt: 0 };
  }
}

export async function fetchAdminCrewsSWR(options?: {
  force?: boolean;
  limit?: number;
  onUpdate?: (data: AdminCrewsCacheData) => void;
}): Promise<AdminCrewsCacheData> {
  const now = Date.now();
  const isFresh =
    crewsCache && !options?.force && now - crewsCache.updatedAt < SWR_TTL_MS;

  if (isFresh && crewsCache) {
    return crewsCache;
  }

  if (crewsInFlight && !options?.force) {
    return crewsInFlight;
  }

  const runFetch = async (): Promise<AdminCrewsCacheData> => {
    const res = await fetchCrewLeaderboard({ limit: options?.limit ?? 100 });
    const next: AdminCrewsCacheData = {
      crews: Array.isArray(res.crews) ? res.crews : [],
      total: Number(res.total || (res.crews ? res.crews.length : 0)),
      updatedAt: Date.now(),
    };
    crewsCache = next;
    options?.onUpdate?.(next);
    return next;
  };

  crewsInFlight = runFetch().finally(() => {
    crewsInFlight = null;
  });

  if (crewsCache && !options?.force) {
    void crewsInFlight.catch(() => {});
    return crewsCache;
  }

  return crewsInFlight;
}

export async function fetchAdminCrewDetailSWR(
  crewId: string,
  options?: {
    force?: boolean;
    onUpdate?: (detail: CrewDoc) => void;
  }
): Promise<CrewDoc | null> {
  const cached = crewDetailsCache.get(crewId);
  if (cached && !options?.force && Date.now() - cached.updatedAt < SWR_TTL_MS) {
    return cached.detail;
  }

  const runFetch = async (): Promise<CrewDoc | null> => {
    const data = await fetchCrewDetails(crewId);
    if (data) {
      crewDetailsCache.set(crewId, { detail: data, updatedAt: Date.now() });
      options?.onUpdate?.(data);
    }
    return data;
  };

  if (cached && !options?.force) {
    void runFetch().catch(() => {});
    return cached.detail;
  }

  return runFetch();
}

// ============================================================================
// 3. ADMIN CERTIFICATES SWR CACHE
// ============================================================================
export interface AdminCertificatesCacheData {
  hasActiveSignature: boolean;
  activeSignature: AdminSignatureRecord | null;
  certificates: StudentCertificateRecord[];
  mocks: AdminMockSummary[];
  updatedAt: number;
}

const certificatesCacheByKey = new Map<string, AdminCertificatesCacheData>();
const certificatesInFlightByKey = new Map<string, Promise<AdminCertificatesCacheData>>();

function buildCertificatesCacheKey(params?: {
  search?: string;
  status?: string;
  grandLineId?: string;
}): string {
  const s = (params?.search || '').trim().toLowerCase();
  const st = params?.status && params.status !== 'all' ? params.status : 'all';
  const gl = params?.grandLineId || 'all';
  return `certs:${s}:${st}:${gl}`;
}

export function getCachedAdminCertificates(params?: {
  search?: string;
  status?: string;
  grandLineId?: string;
}): AdminCertificatesCacheData | null {
  const key = buildCertificatesCacheKey(params);
  return certificatesCacheByKey.get(key) || certificatesCacheByKey.get('certs::all:all') || null;
}

export function invalidateAdminCertificatesCache(): void {
  for (const [k, v] of certificatesCacheByKey.entries()) {
    certificatesCacheByKey.set(k, { ...v, updatedAt: 0 });
  }
}

export async function fetchAdminCertificatesSWR(params?: {
  search?: string;
  status?: string;
  grandLineId?: string;
  force?: boolean;
  onUpdate?: (data: AdminCertificatesCacheData) => void;
}): Promise<AdminCertificatesCacheData> {
  const key = buildCertificatesCacheKey(params);
  const existing = certificatesCacheByKey.get(key);
  const now = Date.now();

  if (existing && !params?.force && now - existing.updatedAt < SWR_TTL_MS) {
    return existing;
  }

  const inflight = certificatesInFlightByKey.get(key);
  if (inflight && !params?.force) {
    return inflight;
  }

  const runFetch = async (): Promise<AdminCertificatesCacheData> => {
    const res = await fetchAdminCertificates({
      search: params?.search || undefined,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      grandLineId: params?.grandLineId || undefined,
    });
    const next: AdminCertificatesCacheData = {
      hasActiveSignature: Boolean(res.hasActiveSignature),
      activeSignature: res.activeSignature || null,
      certificates: Array.isArray(res.certificates) ? res.certificates : [],
      mocks: Array.isArray(res.mocks) ? res.mocks : [],
      updatedAt: Date.now(),
    };
    certificatesCacheByKey.set(key, next);
    params?.onUpdate?.(next);
    return next;
  };

  const promise = runFetch().finally(() => {
    certificatesInFlightByKey.delete(key);
  });
  certificatesInFlightByKey.set(key, promise);

  if (existing && !params?.force) {
    void promise.catch(() => {});
    return existing;
  }

  return promise;
}

// ============================================================================
// 4. ADMIN CAPTAINS SWR CACHE
// ============================================================================
export interface AdminCaptainsCacheData {
  captains: CaptainAdminSummary[];
  allotmentStatuses: Record<
    string,
    { granted: boolean; date: Date | null; monthLabel: string }
  >;
  updatedAt: number;
}

let captainsCache: AdminCaptainsCacheData | null = null;
let captainsInFlight: Promise<AdminCaptainsCacheData> | null = null;

export function getCachedAdminCaptains(): AdminCaptainsCacheData | null {
  return captainsCache;
}

export function patchCachedCaptainAllotment(
  captainUid: string,
  status: { granted: boolean; date: Date | null; monthLabel: string }
): void {
  if (!captainsCache) return;
  captainsCache = {
    ...captainsCache,
    allotmentStatuses: {
      ...captainsCache.allotmentStatuses,
      [captainUid]: status,
    },
  };
}

export async function fetchAdminCaptainsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminCaptainsCacheData) => void;
}): Promise<AdminCaptainsCacheData> {
  const now = Date.now();
  if (captainsCache && !options?.force && now - captainsCache.updatedAt < SWR_TTL_MS) {
    return captainsCache;
  }

  if (captainsInFlight && !options?.force) {
    return captainsInFlight;
  }

  const runFetch = async (): Promise<AdminCaptainsCacheData> => {
    const data = await getAllCaptainsAdminData();
    const initialStatuses: Record<
      string,
      { granted: boolean; date: Date | null; monthLabel: string }
    > = { ...(captainsCache?.allotmentStatuses || {}) };

    const immediateNext: AdminCaptainsCacheData = {
      captains: data,
      allotmentStatuses: initialStatuses,
      updatedAt: Date.now(),
    };
    captainsCache = immediateNext;
    options?.onUpdate?.(immediateNext);

    // Fetch allotment statuses in parallel in background without blocking initial captains render
    const statusMap: Record<
      string,
      { granted: boolean; date: Date | null; monthLabel: string }
    > = { ...initialStatuses };
    await Promise.all(
      data.slice(0, 30).map(async (c) => {
        try {
          const st = await getCaptainAllotmentStatus(c.captainUid);
          statusMap[c.captainUid] = st;
        } catch {
          // ignore single status failure
        }
      })
    );

    const hydrated: AdminCaptainsCacheData = {
      captains: data,
      allotmentStatuses: statusMap,
      updatedAt: Date.now(),
    };
    captainsCache = hydrated;
    options?.onUpdate?.(hydrated);
    return hydrated;
  };

  captainsInFlight = runFetch().finally(() => {
    captainsInFlight = null;
  });

  if (captainsCache && !options?.force) {
    void captainsInFlight.catch(() => {});
    return captainsCache;
  }

  return captainsInFlight;
}

// ============================================================================
// 5. ADMIN QUESTION BANK SWR CACHE
// ============================================================================
export interface AdminQuestionsInitCacheData {
  universities: D1UniversityRow[];
  healthData: BankHealthData | null;
  reports: D1McqReportRow[];
  updatedAt: number;
}

export interface AdminUniversityMcqsCacheData {
  mcqs: D1McqRow[];
  total: number;
  subjects: Array<{
    subject: string;
    total: number;
    topics: Array<{ topic: string; count: number }>;
  }>;
  updatedAt: number;
}

let questionsInitCache: AdminQuestionsInitCacheData | null = null;
let questionsInitInFlight: Promise<AdminQuestionsInitCacheData> | null = null;
const uniMcqsCacheByKey = new Map<string, AdminUniversityMcqsCacheData>();
const uniMcqsInFlightByKey = new Map<string, Promise<AdminUniversityMcqsCacheData>>();

export function getCachedAdminQuestionsInit(): AdminQuestionsInitCacheData | null {
  if (questionsInitCache) return questionsInitCache;
  const initialUnis = getInitialCachedUniversities();
  if (initialUnis && initialUnis.length > 0) {
    return {
      universities: initialUnis,
      healthData: null,
      reports: [],
      updatedAt: Date.now() - SWR_TTL_MS,
    };
  }
  return null;
}

export function buildAdminUniMcqsCacheKey(params: {
  universityId: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
}): string {
  return [
    params.universityId,
    params.subject || 'all',
    params.topic || 'all',
    params.difficulty || 'all',
    (params.search || '').trim().toLowerCase(),
  ].join('::');
}

export function getCachedAdminUniversityMcqs(
  params: {
    universityId: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    search?: string;
  }
): AdminUniversityMcqsCacheData | null {
  const key = buildAdminUniMcqsCacheKey(params);
  return uniMcqsCacheByKey.get(key) || null;
}

export function invalidateAdminQuestionsCache(): void {
  if (questionsInitCache) {
    questionsInitCache = { ...questionsInitCache, updatedAt: 0 };
  }
  for (const [k, v] of uniMcqsCacheByKey.entries()) {
    uniMcqsCacheByKey.set(k, { ...v, updatedAt: 0 });
  }
}

export async function fetchAdminQuestionsInitSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminQuestionsInitCacheData) => void;
}): Promise<AdminQuestionsInitCacheData> {
  const now = Date.now();
  if (
    questionsInitCache &&
    !options?.force &&
    now - questionsInitCache.updatedAt < SWR_TTL_MS
  ) {
    return questionsInitCache;
  }

  if (questionsInitInFlight && !options?.force) {
    return questionsInitInFlight;
  }

  const runFetch = async (): Promise<AdminQuestionsInitCacheData> => {
    const [universities, healthData, reports] = await Promise.all([
      fetchUniversities(Boolean(options?.force)),
      fetchBankHealth().catch(() => questionsInitCache?.healthData || null),
      fetchMcqReports().catch(() => questionsInitCache?.reports || []),
    ]);

    const next: AdminQuestionsInitCacheData = {
      universities,
      healthData,
      reports,
      updatedAt: Date.now(),
    };
    questionsInitCache = next;
    options?.onUpdate?.(next);
    return next;
  };

  questionsInitInFlight = runFetch().finally(() => {
    questionsInitInFlight = null;
  });

  if (questionsInitCache && !options?.force) {
    void questionsInitInFlight.catch(() => {});
    return questionsInitCache;
  }

  return questionsInitInFlight;
}

export async function fetchAdminUniversityMcqsSWR(params: {
  universityId: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
  force?: boolean;
  onUpdate?: (data: AdminUniversityMcqsCacheData) => void;
}): Promise<AdminUniversityMcqsCacheData> {
  const key = buildAdminUniMcqsCacheKey(params);
  const isFirstPage = !params.offset || params.offset === 0;
  const existing = isFirstPage ? uniMcqsCacheByKey.get(key) : undefined;
  const now = Date.now();

  if (existing && !params.force && now - existing.updatedAt < SWR_TTL_MS) {
    return existing;
  }

  const inflight = isFirstPage ? uniMcqsInFlightByKey.get(key) : undefined;
  if (inflight && !params.force) {
    return inflight;
  }

  const runFetch = async (): Promise<AdminUniversityMcqsCacheData> => {
    const [mcqRes, topicsRes] = await Promise.all([
      fetchMcqs({
        university_id: params.universityId,
        subject:
          params.subject && params.subject !== 'all' ? params.subject : undefined,
        topic: params.topic && params.topic !== 'all' ? params.topic : undefined,
        difficulty:
          params.difficulty && params.difficulty !== 'all'
            ? params.difficulty
            : undefined,
        search: params.search?.trim() || undefined,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        include_answers: true,
      }),
      fetchUniversityTopics(params.universityId, Boolean(params.force)).catch(
        () => ({ subjects: [], flat: [] })
      ),
    ]);

    const next: AdminUniversityMcqsCacheData = {
      mcqs: mcqRes.mcqs,
      total: mcqRes.total,
      subjects: topicsRes.subjects || [],
      updatedAt: Date.now(),
    };

    if (isFirstPage) {
      uniMcqsCacheByKey.set(key, next);
      params.onUpdate?.(next);
    }
    return next;
  };

  const promise = runFetch().finally(() => {
    if (isFirstPage) {
      uniMcqsInFlightByKey.delete(key);
    }
  });

  if (isFirstPage) {
    uniMcqsInFlightByKey.set(key, promise);
  }

  if (existing && !params.force) {
    void promise.catch(() => {});
    return existing;
  }

  return promise;
}

// ============================================================================
// 6. LAZY CHUNK & TAB DATA PREFETCHING (IDLE + HOVER/TOUCH)
// ============================================================================
const prefetchedChunks = new Set<string>();
let idlePrefetchScheduled = false;

const ADMIN_CHUNK_LOADERS: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('@/pages/admin/AdminOverviewPage'),
  '/admin/users': () => import('@/pages/admin/AdminUsersPage'),
  '/admin/announcements': () => import('@/pages/admin/AdminAnnouncementsPage'),
  '/admin/bots': () => import('@/pages/admin/AdminBotsPage'),
  '/admin/crews': () => import('@/pages/admin/AdminCrewsPage'),
  '/admin/captains': () => import('@/pages/admin/AdminCaptainsPage'),
  '/admin/certificates': () => import('@/pages/admin/AdminCertificatesPage'),
  '/admin/signatures': () => import('@/pages/admin/AdminCertificatesPage'),
  '/admin/questions': () => import('@/pages/admin/AdminQuestionsPage'),
  '/admin/pricing': () => import('@/pages/admin/AdminPricingPage'),
  '/admin/kobans': () => import('@/pages/admin/AdminKobansPage'),
  '/admin/applications': () => import('@/pages/admin/AdminApplicationsPage'),
  '/admin/payments': () => import('@/pages/admin/AdminPaymentsPage'),
  '/admin/audit-logs': () => import('@/pages/admin/AdminAuditLogsPage'),
  '/admin/health': () => import('@/pages/admin/AdminHealthPage'),
};

export function prefetchAdminTabChunk(rawPath: string): void {
  const cleanPath = rawPath.split('?')[0].replace(/\/+$/, '') || '/admin';
  if (prefetchedChunks.has(cleanPath)) return;
  const loader = ADMIN_CHUNK_LOADERS[cleanPath];
  if (loader) {
    prefetchedChunks.add(cleanPath);
    void loader().catch(() => {
      prefetchedChunks.delete(cleanPath);
    });
  }
}

export function prefetchAdminTabData(rawPath: string, uid?: string): void {
  const cleanPath = rawPath.split('?')[0].replace(/\/+$/, '') || '/admin';
  if (cleanPath === '/admin' && uid) {
    void fetchAdminOverviewSWR(uid).catch(() => {});
  } else if (cleanPath === '/admin/users') {
    if (!getCachedAdminUsersState()) {
      void fetchUsersPaginated({ limitCount: 50 }).catch(() => {});
    }
  } else if (cleanPath === '/admin/crews') {
    void fetchAdminCrewsSWR().catch(() => {});
  } else if (
    cleanPath === '/admin/certificates' ||
    cleanPath === '/admin/signatures'
  ) {
    void fetchAdminCertificatesSWR().catch(() => {});
  } else if (cleanPath === '/admin/captains') {
    void fetchAdminCaptainsSWR().catch(() => {});
  } else if (cleanPath === '/admin/questions') {
    void fetchAdminQuestionsInitSWR()
      .then((init) => {
        const firstUniId = init.universities[0]?.id || 'uni_fast_nuces';
        return fetchAdminUniversityMcqsSWR({
          universityId: firstUniId,
          limit: 20,
          offset: 0,
        });
      })
      .catch(() => {});
  }
}

export function prefetchAdminRouteOnInteraction(rawPath: string, uid?: string): void {
  prefetchAdminTabChunk(rawPath);
  prefetchAdminTabData(rawPath, uid);
}

export function scheduleIdleAdminPrefetchAll(uid?: string): () => void {
  if (typeof window === 'undefined') return () => {};
  if (idlePrefetchScheduled) return () => {};
  idlePrefetchScheduled = true;

  const runIdleJob = (cb: () => void, delayMs: number): number => {
    const w = window as unknown as {
      requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === 'function') {
      return w.requestIdleCallback(cb, { timeout: delayMs + 1000 });
    }
    return window.setTimeout(cb, delayMs);
  };

  const t1 = runIdleJob(() => {
    // 1. Prefetch primary admin tab chunks first
    const primaryPaths = [
      '/admin',
      '/admin/users',
      '/admin/crews',
      '/admin/captains',
      '/admin/certificates',
      '/admin/questions',
      '/admin/announcements',
      '/admin/bots',
    ];
    for (const p of primaryPaths) {
      prefetchAdminTabChunk(p);
    }
    // 2. Prefetch data for core tabs in parallel
    if (uid) {
      prefetchAdminTabData('/admin', uid);
    }
    prefetchAdminTabData('/admin/crews', uid);
    prefetchAdminTabData('/admin/certificates', uid);
    prefetchAdminTabData('/admin/questions', uid);
  }, 150);

  const t2 = runIdleJob(() => {
    // 3. Prefetch remaining admin chunks & data
    for (const p of Object.keys(ADMIN_CHUNK_LOADERS)) {
      prefetchAdminTabChunk(p);
    }
    prefetchAdminTabData('/admin/captains', uid);
    prefetchAdminTabData('/admin/users', uid);
  }, 600);

  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}
