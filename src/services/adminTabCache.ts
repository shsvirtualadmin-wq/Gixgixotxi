import {
  fetchAdminStats,
  getCachedAdminStats,
  getCachedOverviewApplications,
  getApplicationsCacheVersion,
  fetchAuditLogs,
  fetchUsersPaginated,
  getCachedAdminUsersState,
  fetchAllApplications,
  fetchPaymentRequests,
  type AdminStats,
} from './adminService';
import {
  fetchRewardsHealth,
  fetchRewardsState,
  type RewardsHealthResponse,
} from './rewardsService';
import type { RewardsMode } from '@/lib/rewardsEngine';
import type { AuditLog, CaptainApplication, CrewApplication, KobanRequest, PaymentRequest } from '@/types';
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
import {
  getCaptainAllotmentStatus,
  fetchKobanRequests,
} from './kobanService';
import {
  fetchUniversities,
  fetchLiveQuestionBankStats,
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
import {
  fetchAnnouncements,
  fetchWelcomeAnnouncement,
  type AnnouncementItem,
} from './notificationService';
import {
  fetchCouponsPaginatedAdmin,
  type CouponDoc,
} from './couponService';
import {
  fetchAdminAdsConfig,
  fetchAdminAdsStats,
  type AdminAdsStatsResponse,
} from './adsConfigService';
import type { AdsConfigDoc } from '@/config/ads';
import type { AccessRequestRecord, ActivePermissionGrant } from '@/constants/permissions';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { api, apiRequest } from '@/lib/api';

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
  appsCacheVersion?: number;
}

let overviewCache: AdminOverviewCacheData | null = null;
let overviewInFlight: Promise<AdminOverviewCacheData> | null = null;

export function getCachedAdminOverview(): AdminOverviewCacheData | null {
  const latestApps = getCachedOverviewApplications();
  const currentAppsVersion = getApplicationsCacheVersion();
  if (overviewCache && overviewCache.appsCacheVersion === currentAppsVersion) {
    if (latestApps) {
      return {
        ...overviewCache,
        stats: {
          ...overviewCache.stats,
          pendingCaptains: latestApps.pendingCaptains,
          pendingCrew: latestApps.pendingCrew,
        },
      };
    }
    return overviewCache;
  }
  const cachedStats = getCachedAdminStats();
  if (cachedStats) {
    return {
      stats: latestApps
        ? {
            ...cachedStats,
            pendingCaptains: latestApps.pendingCaptains,
            pendingCrew: latestApps.pendingCrew,
          }
        : cachedStats,
      recentLogs: [],
      rewardsMode: null,
      rewardsHealth: null,
      updatedAt: Date.now() - SWR_TTL_MS,
      appsCacheVersion: currentAppsVersion,
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
  const currentAppsVersion = getApplicationsCacheVersion();
  const isFresh =
    overviewCache &&
    !options?.force &&
    overviewCache.appsCacheVersion === currentAppsVersion &&
    now - overviewCache.updatedAt < SWR_TTL_MS;

  if (isFresh && overviewCache) {
    return overviewCache;
  }

  if (overviewInFlight && !options?.force) {
    return overviewInFlight;
  }

  const runFetch = async (): Promise<AdminOverviewCacheData> => {
    const versionAtStart = getApplicationsCacheVersion();
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
      appsCacheVersion: versionAtStart,
    };
    overviewCache = next;
    options?.onUpdate?.(next);
    return next;
  };

  overviewInFlight = runFetch().finally(() => {
    overviewInFlight = null;
  });

  if (overviewCache && !options?.force && overviewCache.appsCacheVersion === currentAppsVersion) {
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

    // Fetch allotment statuses in bounded batches for captains not yet in cache
    const statusMap: Record<
      string,
      { granted: boolean; date: Date | null; monthLabel: string }
    > = { ...initialStatuses };
    const missingCaptains = data
      .slice(0, 30)
      .filter((c) => c.captainUid && !statusMap[c.captainUid]);
    for (let i = 0; i < missingCaptains.length; i += 6) {
      const batch = missingCaptains.slice(i, i + 6);
      await Promise.all(
        batch.map(async (c) => {
          try {
            const st = await getCaptainAllotmentStatus(c.captainUid);
            statusMap[c.captainUid] = st;
          } catch {
            // ignore single status failure
          }
        })
      );
    }

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
  universityId?: string;
  university_id?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
}): string {
  const resolvedUniId = (params.universityId || params.university_id || '').trim();
  return [
    resolvedUniId,
    params.subject || 'all',
    params.topic || 'all',
    params.difficulty || 'all',
    (params.search || '').trim().toLowerCase(),
  ].join('::');
}

export function getCachedAdminUniversityMcqs(
  params: {
    universityId?: string;
    university_id?: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    search?: string;
  }
): AdminUniversityMcqsCacheData | null {
  const resolvedUniId = (params.universityId || params.university_id || '').trim();
  if (!resolvedUniId) return null;
  const key = buildAdminUniMcqsCacheKey({ ...params, universityId: resolvedUniId });
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
      fetchLiveQuestionBankStats({ force: Boolean(options?.force), strict: true }).catch(
        () => questionsInitCache?.healthData || null
      ),
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
  universityId?: string;
  university_id?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
  force?: boolean;
  onUpdate?: (data: AdminUniversityMcqsCacheData) => void;
}): Promise<AdminUniversityMcqsCacheData> {
  const resolvedUniId = (params.universityId || params.university_id || '').trim();
  const key = buildAdminUniMcqsCacheKey({ ...params, universityId: resolvedUniId });
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
        university_id: resolvedUniId || undefined,
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
      fetchUniversityTopics(resolvedUniId, Boolean(params.force)).catch(
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
// 6. ADMIN APPLICATIONS SWR CACHE
// ============================================================================
export interface AdminApplicationsCacheData {
  captains: CaptainApplication[];
  crew: CrewApplication[];
  updatedAt: number;
}

let applicationsCache: AdminApplicationsCacheData | null = null;
let applicationsInFlight: Promise<AdminApplicationsCacheData> | null = null;

export function getCachedAdminApplications(): AdminApplicationsCacheData | null {
  return applicationsCache;
}

export function invalidateAdminApplicationsCache(): void {
  if (applicationsCache) {
    applicationsCache = { ...applicationsCache, updatedAt: 0 };
  }
}

export async function fetchAdminApplicationsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminApplicationsCacheData) => void;
}): Promise<AdminApplicationsCacheData> {
  const now = Date.now();
  if (applicationsCache && !options?.force && now - applicationsCache.updatedAt < SWR_TTL_MS) {
    return applicationsCache;
  }
  if (applicationsInFlight && !options?.force) {
    return applicationsInFlight;
  }
  const runFetch = async (): Promise<AdminApplicationsCacheData> => {
    const res = await fetchAllApplications();
    const next: AdminApplicationsCacheData = {
      captains: Array.isArray(res?.captains) ? res.captains : [],
      crew: Array.isArray(res?.crew) ? res.crew : [],
      updatedAt: Date.now(),
    };
    applicationsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  applicationsInFlight = runFetch().finally(() => {
    applicationsInFlight = null;
  });
  if (applicationsCache && !options?.force) {
    void applicationsInFlight.catch(() => {});
    return applicationsCache;
  }
  return applicationsInFlight;
}

// ============================================================================
// 7. ADMIN ANNOUNCEMENTS SWR CACHE
// ============================================================================
export interface AdminAnnouncementsCacheData {
  items: AnnouncementItem[];
  welcome: AnnouncementItem | null;
  updatedAt: number;
}

let announcementsCache: AdminAnnouncementsCacheData | null = null;
let announcementsInFlight: Promise<AdminAnnouncementsCacheData> | null = null;

export function getCachedAdminAnnouncements(): AdminAnnouncementsCacheData | null {
  return announcementsCache;
}

export function invalidateAdminAnnouncementsCache(): void {
  if (announcementsCache) {
    announcementsCache = { ...announcementsCache, updatedAt: 0 };
  }
}

export async function fetchAdminAnnouncementsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminAnnouncementsCacheData) => void;
}): Promise<AdminAnnouncementsCacheData> {
  const now = Date.now();
  if (announcementsCache && !options?.force && now - announcementsCache.updatedAt < SWR_TTL_MS) {
    return announcementsCache;
  }
  if (announcementsInFlight && !options?.force) {
    return announcementsInFlight;
  }
  const runFetch = async (): Promise<AdminAnnouncementsCacheData> => {
    const [items, welcomeRes] = await Promise.all([
      fetchAnnouncements(50),
      fetchWelcomeAnnouncement().catch(() => null),
    ]);
    const next: AdminAnnouncementsCacheData = {
      items: Array.isArray(items) ? items : [],
      welcome: welcomeRes?.announcement ?? announcementsCache?.welcome ?? null,
      updatedAt: Date.now(),
    };
    announcementsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  announcementsInFlight = runFetch().finally(() => {
    announcementsInFlight = null;
  });
  if (announcementsCache && !options?.force) {
    void announcementsInFlight.catch(() => {});
    return announcementsCache;
  }
  return announcementsInFlight;
}

// ============================================================================
// 8. ADMIN PAYMENTS SWR CACHE
// ============================================================================
export interface AdminPaymentsCacheData {
  payments: PaymentRequest[];
  kobanRequests: KobanRequest[];
  updatedAt: number;
}

let paymentsCache: AdminPaymentsCacheData | null = null;
let paymentsInFlight: Promise<AdminPaymentsCacheData> | null = null;

export function getCachedAdminPayments(): AdminPaymentsCacheData | null {
  return paymentsCache;
}

export function invalidateAdminPaymentsCache(): void {
  if (paymentsCache) {
    paymentsCache = { ...paymentsCache, updatedAt: 0 };
  }
}

export async function fetchAdminPaymentsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminPaymentsCacheData) => void;
}): Promise<AdminPaymentsCacheData> {
  const now = Date.now();
  if (paymentsCache && !options?.force && now - paymentsCache.updatedAt < SWR_TTL_MS) {
    return paymentsCache;
  }
  if (paymentsInFlight && !options?.force) {
    return paymentsInFlight;
  }
  const runFetch = async (): Promise<AdminPaymentsCacheData> => {
    const [payments, kobanRequests] = await Promise.all([
      fetchPaymentRequests('all'),
      fetchKobanRequests('all').catch(() => paymentsCache?.kobanRequests || []),
    ]);
    const next: AdminPaymentsCacheData = {
      payments: Array.isArray(payments) ? payments : [],
      kobanRequests: Array.isArray(kobanRequests) ? kobanRequests : [],
      updatedAt: Date.now(),
    };
    paymentsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  paymentsInFlight = runFetch().finally(() => {
    paymentsInFlight = null;
  });
  if (paymentsCache && !options?.force) {
    void paymentsInFlight.catch(() => {});
    return paymentsCache;
  }
  return paymentsInFlight;
}

// ============================================================================
// 9. ADMIN COUPONS SWR CACHE
// ============================================================================
export interface AdminCouponsCacheData {
  coupons: CouponDoc[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  updatedAt: number;
}

let couponsCache: AdminCouponsCacheData | null = null;
let couponsInFlight: Promise<AdminCouponsCacheData> | null = null;

export function getCachedAdminCoupons(): AdminCouponsCacheData | null {
  return couponsCache;
}

export function invalidateAdminCouponsCache(): void {
  if (couponsCache) {
    couponsCache = { ...couponsCache, updatedAt: 0 };
  }
}

export async function fetchAdminCouponsSWR(options?: {
  force?: boolean;
  pageSize?: number;
  onUpdate?: (data: AdminCouponsCacheData) => void;
}): Promise<AdminCouponsCacheData> {
  const now = Date.now();
  if (couponsCache && !options?.force && now - couponsCache.updatedAt < SWR_TTL_MS) {
    return couponsCache;
  }
  if (couponsInFlight && !options?.force) {
    return couponsInFlight;
  }
  const runFetch = async (): Promise<AdminCouponsCacheData> => {
    const res = await fetchCouponsPaginatedAdmin({
      pageSize: options?.pageSize ?? 20,
      cursor: null,
    });
    const next: AdminCouponsCacheData = {
      coupons: Array.isArray(res.items) ? res.items : [],
      lastDoc: res.lastDoc ?? null,
      hasMore: Boolean(res.hasMore),
      updatedAt: Date.now(),
    };
    couponsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  couponsInFlight = runFetch().finally(() => {
    couponsInFlight = null;
  });
  if (couponsCache && !options?.force) {
    void couponsInFlight.catch(() => {});
    return couponsCache;
  }
  return couponsInFlight;
}

// ============================================================================
// 10. ADMIN ADS SWR CACHE
// ============================================================================
export interface AdminAdsCacheData {
  config: AdsConfigDoc;
  stats: AdminAdsStatsResponse | null;
  updatedAt: number;
}

let adsCache: AdminAdsCacheData | null = null;
let adsInFlight: Promise<AdminAdsCacheData> | null = null;

export function getCachedAdminAds(): AdminAdsCacheData | null {
  return adsCache;
}

export function setCachedAdminAdsConfig(config: AdsConfigDoc): void {
  adsCache = {
    config,
    stats: adsCache?.stats ?? null,
    updatedAt: Date.now(),
  };
}

export function invalidateAdminAdsCache(): void {
  if (adsCache) {
    adsCache = { ...adsCache, updatedAt: 0 };
  }
}

export async function fetchAdminAdsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminAdsCacheData) => void;
}): Promise<AdminAdsCacheData> {
  const now = Date.now();
  if (adsCache && !options?.force && now - adsCache.updatedAt < SWR_TTL_MS) {
    return adsCache;
  }
  if (adsInFlight && !options?.force) {
    return adsInFlight;
  }
  const runFetch = async (): Promise<AdminAdsCacheData> => {
    const [config, stats] = await Promise.all([
      fetchAdminAdsConfig(),
      fetchAdminAdsStats(30).catch(() => adsCache?.stats ?? null),
    ]);
    const next: AdminAdsCacheData = {
      config,
      stats,
      updatedAt: Date.now(),
    };
    adsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  adsInFlight = runFetch().finally(() => {
    adsInFlight = null;
  });
  if (adsCache && !options?.force) {
    void adsInFlight.catch(() => {});
    return adsCache;
  }
  return adsInFlight;
}

// ============================================================================
// 11. ADMIN ACCESS REQUESTS SWR CACHE
// ============================================================================
export interface AdminAccessRequestsCacheData {
  requests: AccessRequestRecord[];
  grants: ActivePermissionGrant[];
  migratedAccounts: Array<{
    uid: string;
    email: string;
    displayName?: string;
    previousRole: string;
    newRole: string;
  }>;
  updatedAt: number;
}

let accessRequestsCache: AdminAccessRequestsCacheData | null = null;
let accessRequestsInFlight: Promise<AdminAccessRequestsCacheData> | null = null;

export function getCachedAdminAccessRequests(): AdminAccessRequestsCacheData | null {
  return accessRequestsCache;
}

export function invalidateAdminAccessRequestsCache(): void {
  if (accessRequestsCache) {
    accessRequestsCache = { ...accessRequestsCache, updatedAt: 0 };
  }
}

export async function fetchAdminAccessRequestsSWR(options?: {
  force?: boolean;
  onUpdate?: (data: AdminAccessRequestsCacheData) => void;
}): Promise<AdminAccessRequestsCacheData> {
  const now = Date.now();
  if (
    accessRequestsCache &&
    !options?.force &&
    now - accessRequestsCache.updatedAt < SWR_TTL_MS
  ) {
    return accessRequestsCache;
  }
  if (accessRequestsInFlight && !options?.force) {
    return accessRequestsInFlight;
  }
  const runFetch = async (): Promise<AdminAccessRequestsCacheData> => {
    const res = await api.get<{
      ok?: boolean;
      requests?: AccessRequestRecord[];
      activeGrants?: ActivePermissionGrant[];
      grants?: ActivePermissionGrant[];
      migratedAccounts?: Array<{
        uid: string;
        email: string;
        displayName?: string;
        previousRole: string;
        newRole: string;
      }>;
    }>('/api/admin/access-requests', { silentErrorToast: true });
    const resolvedGrants = Array.isArray(res?.activeGrants)
      ? res.activeGrants
      : Array.isArray(res?.grants)
        ? res.grants
        : [];
    const next: AdminAccessRequestsCacheData = {
      requests: Array.isArray(res?.requests) ? res.requests : [],
      grants: resolvedGrants,
      migratedAccounts: Array.isArray(res?.migratedAccounts) ? res.migratedAccounts : [],
      updatedAt: Date.now(),
    };
    accessRequestsCache = next;
    options?.onUpdate?.(next);
    return next;
  };
  accessRequestsInFlight = runFetch().finally(() => {
    accessRequestsInFlight = null;
  });
  if (accessRequestsCache && !options?.force) {
    void accessRequestsInFlight.catch(() => {});
    return accessRequestsCache;
  }
  return accessRequestsInFlight;
}

// ============================================================================
// 12. ADMIN NAV BADGES SWR CACHE (Combined, zero polling)
// ============================================================================
export interface AdminNavBadgesCacheData {
  pendingRequestsCount: number;
  pendingModerationCount: number;
  updatedAt: number;
}

let navBadgesCache: AdminNavBadgesCacheData | null = null;
let navBadgesInFlight: Promise<AdminNavBadgesCacheData> | null = null;
const BADGES_TTL_MS = 90_000;

export function getCachedAdminNavBadges(): AdminNavBadgesCacheData | null {
  return navBadgesCache;
}

export function patchCachedModerationBadge(count: number): void {
  navBadgesCache = {
    pendingRequestsCount: navBadgesCache?.pendingRequestsCount ?? 0,
    pendingModerationCount: Math.max(0, Math.floor(count)),
    updatedAt: Date.now(),
  };
}

export async function fetchAdminNavBadgesSWR(params: {
  includeAccessRequests: boolean;
  includeModeration: boolean;
  force?: boolean;
}): Promise<AdminNavBadgesCacheData> {
  const now = Date.now();
  if (navBadgesCache && !params.force && now - navBadgesCache.updatedAt < BADGES_TTL_MS) {
    return navBadgesCache;
  }
  if (navBadgesInFlight && !params.force) {
    return navBadgesInFlight;
  }

  const runFetch = async (): Promise<AdminNavBadgesCacheData> => {
    const [reqCount, modCount] = await Promise.all([
      params.includeAccessRequests
        ? apiRequest<{ requests?: Array<{ status: string }> }>(
            '/api/admin/access-requests?status=pending',
            { method: 'GET', silentErrorToast: true }
          )
            .then((res) =>
              Array.isArray(res?.requests)
                ? res.requests.filter((r) => r.status === 'pending').length
                : 0
            )
            .catch(() => navBadgesCache?.pendingRequestsCount ?? 0)
        : Promise.resolve(0),
      params.includeModeration
        ? apiRequest<{
            flaggedPosts?: unknown[];
            reports?: Array<{ status?: string }>;
          }>('/api/posts/moderation/queue', { method: 'GET', silentErrorToast: true })
            .then((res) => {
              const flagged = Array.isArray(res?.flaggedPosts) ? res.flaggedPosts.length : 0;
              const pendingReports = Array.isArray(res?.reports)
                ? res.reports.filter((r) => !r.status || r.status === 'pending').length
                : 0;
              return Math.max(flagged, pendingReports);
            })
            .catch(() => navBadgesCache?.pendingModerationCount ?? 0)
        : Promise.resolve(0),
    ]);

    const next: AdminNavBadgesCacheData = {
      pendingRequestsCount: reqCount,
      pendingModerationCount: modCount,
      updatedAt: Date.now(),
    };
    navBadgesCache = next;
    return next;
  };

  navBadgesInFlight = runFetch().finally(() => {
    navBadgesInFlight = null;
  });

  if (navBadgesCache && !params.force) {
    void navBadgesInFlight.catch(() => {});
    return navBadgesCache;
  }
  return navBadgesInFlight;
}

// ============================================================================
// 13. LAZY CHUNK & TAB DATA PREFETCHING (IDLE + HOVER/TOUCH)
// ============================================================================
const prefetchedChunks = new Set<string>();
let idlePrefetchScheduled = false;

const ADMIN_CHUNK_LOADERS: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('@/pages/admin/AdminOverviewPage'),
  '/admin/users': () => import('@/pages/admin/AdminUsersPage'),
  '/superadmin': () => import('@/pages/admin/AdminUsersPage'),
  '/admin/announcements': () => import('@/pages/admin/AdminAnnouncementsPage'),
  '/admin/crews': () => import('@/pages/admin/AdminCrewsPage'),
  '/admin/captains': () => import('@/pages/admin/AdminCaptainsPage'),
  '/admin/certificates': () => import('@/pages/admin/AdminCertificatesPage'),
  '/admin/signatures': () => import('@/pages/admin/AdminCertificatesPage'),
  '/admin/questions': () => import('@/pages/admin/AdminQuestionsPage'),
  '/admin/formulas': () => import('@/pages/admin/AdminFormulasPage'),
  '/admin/commons': () => import('@/pages/admin/AdminCommonsPage'),
  '/admin/pricing': () => import('@/pages/admin/AdminPricingPage'),
  '/admin/plans': () => import('@/pages/admin/AdminPlansPage'),
  '/admin/kobans': () => import('@/pages/admin/AdminKobansPage'),
  '/admin/applications': () => import('@/pages/admin/AdminApplicationsPage'),
  '/admin/payments': () => import('@/pages/admin/AdminPaymentsPage'),
  '/admin/coupons': () => import('@/pages/admin/AdminCouponStudioPage'),
  '/admin/ads': () => import('@/pages/admin/AdminAdsPage'),
  '/admin/access-requests': () => import('@/pages/admin/AdminAccessRequestsPage'),
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
  } else if (cleanPath === '/admin/users' || cleanPath === '/superadmin') {
    if (!getCachedAdminUsersState()) {
      void fetchUsersPaginated({ limitCount: 20 }).catch(() => {});
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
  } else if (cleanPath === '/admin/applications') {
    void fetchAdminApplicationsSWR().catch(() => {});
  } else if (cleanPath === '/admin/announcements') {
    void fetchAdminAnnouncementsSWR().catch(() => {});
  } else if (cleanPath === '/admin/payments') {
    void fetchAdminPaymentsSWR().catch(() => {});
  } else if (cleanPath === '/admin/coupons') {
    void fetchAdminCouponsSWR().catch(() => {});
  } else if (cleanPath === '/admin/ads') {
    void fetchAdminAdsSWR().catch(() => {});
  } else if (cleanPath === '/admin/access-requests') {
    void fetchAdminAccessRequestsSWR().catch(() => {});
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

export function scheduleIdleAdminPrefetchAll(uid?: string, isSuperAdmin = false): () => void {
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
    // 1. Prefetch primary bottom-nav chunks immediately on idle
    const primaryPaths = [
      '/admin',
      '/admin/questions',
      '/admin/formulas',
      '/admin/applications',
      '/admin/certificates',
      '/admin/users',
      '/admin/payments',
      '/admin/coupons',
      '/admin/ads',
      '/admin/announcements',
      '/admin/access-requests',
    ];
    for (const p of primaryPaths) {
      prefetchAdminTabChunk(p);
    }
    // Warm lightweight SWR overview + applications caches so first switch is instant
    if (uid && !overviewCache) {
      void fetchAdminOverviewSWR(uid).catch(() => {});
    }
  }, 200);

  const t2 = runIdleJob(() => {
    // 2. Prefetch remaining admin chunks for superAdmin
    if (isSuperAdmin) {
      for (const p of Object.keys(ADMIN_CHUNK_LOADERS)) {
        prefetchAdminTabChunk(p);
      }
    }
  }, 750);

  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}


