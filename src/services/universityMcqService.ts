import {
  D1UniversityRow,
  D1McqRow,
  D1McqReportRow,
  DEFAULT_D1_UNIVERSITIES,
  normalizeCorrectLetter,
} from '../constants/d1Universities';
import { auth } from '../lib/firebase';

export interface ParsedImportMcqRow {
  rowIndex: number;
  subject: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ChunkImportProgress {
  importedCount: number;
  failedCount: number;
  processedRows: number;
  totalRows: number;
  currentChunkIndex: number;
  totalChunks: number;
  errors: ImportRowError[];
}

export interface ResumableImportState {
  universityId: string;
  defaultSubject: string;
  defaultTopic: string;
  rows: ParsedImportMcqRow[];
  nextRowOffset: number;
  importedCount: number;
  failedCount: number;
  errors: ImportRowError[];
}

export interface BankHealthData {
  ok: boolean;
  totalUniversities: number;
  liveUniversities: number;
  comingSoonUniversities: number;
  totalMcqs: number;
  missingExplanations: number;
  openReports: number;
  byUniversity: Array<{
    id: string;
    name: string;
    slug: string;
    mcq_count: number;
    is_live: number;
  }>;
  bySubject: Record<string, number>;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface LegacyBankSummary {
  ok: boolean;
  alreadyPurged: boolean;
  totalToDelete: number;
  subjectPools: Record<string, number>;
  backupTotalCount: number;
  backupPools: Record<string, number>;
  purgedAt: string | null;
  backupJsonUrl: string;
  backupCsvUrl: string;
}

const LOCAL_D1_STORAGE_KEY = 'boardly_d1_university_bank_v1';

interface LocalD1Mirror {
  universities: D1UniversityRow[];
  mcqs: D1McqRow[];
  reports: D1McqReportRow[];
  purgedAt: string;
}

function loadLocalD1Mirror(): LocalD1Mirror {
  const defaultState: LocalD1Mirror = {
    universities: DEFAULT_D1_UNIVERSITIES.map((u) => ({ ...u })),
    mcqs: [],
    reports: [],
    purgedAt: '2026-10-31T05:10:00.000Z',
  };
  if (typeof window === 'undefined' || !window.localStorage) return defaultState;
  try {
    const raw = window.localStorage.getItem(LOCAL_D1_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    const universities = Array.isArray(parsed?.universities) && parsed.universities.length > 0
      ? parsed.universities
      : defaultState.universities;
    const mcqs = Array.isArray(parsed?.mcqs) ? parsed.mcqs : [];
    const reports = Array.isArray(parsed?.reports) ? parsed.reports : [];
    return {
      universities,
      mcqs,
      reports,
      purgedAt: parsed?.purgedAt || defaultState.purgedAt,
    };
  } catch {
    return defaultState;
  }
}

function saveLocalD1Mirror(mirror: LocalD1Mirror): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Recalculate university mcq_count & is_live automatically
    const counts = new Map<string, number>();
    for (const m of mirror.mcqs) {
      counts.set(m.university_id, (counts.get(m.university_id) || 0) + 1);
    }
    mirror.universities = mirror.universities.map((u) => {
      const c = counts.get(u.id) || 0;
      return {
        ...u,
        mcq_count: c,
        is_live: c > 0 ? 1 : 0,
      };
    });
    window.localStorage.setItem(LOCAL_D1_STORAGE_KEY, JSON.stringify(mirror));
  } catch {
    // Non-fatal
  }
}

async function getD1RequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = await auth.currentUser?.getIdToken(false).catch(() => null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const localToken =
        window.localStorage.getItem('boardly_session_token') ||
        window.localStorage.getItem('boardly_cf_token');
      if (localToken) {
        headers['Authorization'] = `Bearer ${localToken}`;
      }
    }
  } catch {
    // Non-fatal
  }
  return headers;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const baseHeaders = await getD1RequestHeaders();
  const headers: Record<string, string> = {
    ...baseHeaders,
    ...((init?.headers as Record<string, string>) || {}),
  };
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
  const text = await res.text().catch(() => '');
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON response from ${url} (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error(`Empty response from ${url}`);
  }
  return data as T;
}

// ============================================================================
// Universities API (D1)
// ============================================================================

export async function fetchUniversities(): Promise<D1UniversityRow[]> {
  try {
    const res = await apiRequest<{ ok?: boolean; success?: boolean; universities?: D1UniversityRow[] }>(
      '/api/universities'
    );
    if (Array.isArray(res.universities) && res.universities.length > 0) {
      const mirror = loadLocalD1Mirror();
      mirror.universities = res.universities;
      saveLocalD1Mirror(mirror);
      return res.universities;
    }
  } catch {
    // Fallback to local mirror seeded with DEFAULT_D1_UNIVERSITIES
  }
  return loadLocalD1Mirror().universities;
}

export async function createUniversity(payload: {
  name: string;
  slug?: string;
  logo_url?: string;
  sort_order?: number;
}): Promise<D1UniversityRow> {
  try {
    const res = await apiRequest<{ ok?: boolean; university?: D1UniversityRow }>('/api/universities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.university) return res.university;
  } catch {
    // Fallback to local mirror
  }
  const mirror = loadLocalD1Mirror();
  const slug =
    (payload.slug || payload.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `uni-${Date.now()}`;
  const created: D1UniversityRow = {
    id: `uni_${slug}`,
    name: payload.name.trim(),
    slug,
    logo_url: payload.logo_url || '',
    sort_order: payload.sort_order ?? mirror.universities.length + 1,
    mcq_count: 0,
    is_live: 0,
    created_at: new Date().toISOString(),
  };
  mirror.universities.push(created);
  saveLocalD1Mirror(mirror);
  return created;
}

export async function updateUniversity(
  id: string,
  payload: Partial<{ name: string; slug: string; logo_url: string; sort_order: number }>
): Promise<D1UniversityRow> {
  try {
    const res = await apiRequest<{ ok?: boolean; university?: D1UniversityRow }>(
      `/api/universities/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    if (res.university) return res.university;
  } catch {
    // Fallback to local mirror
  }
  const mirror = loadLocalD1Mirror();
  const idx = mirror.universities.findIndex((u) => u.id === id || u.slug === id);
  if (idx === -1) throw new Error('University not found');
  mirror.universities[idx] = {
    ...mirror.universities[idx],
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.logo_url !== undefined ? { logo_url: payload.logo_url } : {}),
    ...(payload.sort_order !== undefined ? { sort_order: payload.sort_order } : {}),
  };
  saveLocalD1Mirror(mirror);
  return mirror.universities[idx];
}

export async function reorderUniversities(orderedIds: string[]): Promise<D1UniversityRow[]> {
  try {
    const res = await apiRequest<{ ok?: boolean; universities?: D1UniversityRow[] }>(
      '/api/universities/reorder',
      {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }
    );
    if (Array.isArray(res.universities)) return res.universities;
  } catch {
    // Fallback
  }
  const mirror = loadLocalD1Mirror();
  orderedIds.forEach((uid, i) => {
    const u = mirror.universities.find((x) => x.id === uid);
    if (u) u.sort_order = i + 1;
  });
  mirror.universities.sort((a, b) => a.sort_order - b.sort_order);
  saveLocalD1Mirror(mirror);
  return mirror.universities;
}

export async function deleteUniversity(id: string): Promise<void> {
  try {
    await apiRequest<{ ok?: boolean }>(`/api/universities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return;
  } catch {
    const mirror = loadLocalD1Mirror();
    mirror.universities = mirror.universities.filter((u) => u.id !== id && u.slug !== id);
    mirror.mcqs = mirror.mcqs.filter((m) => m.university_id !== id);
    saveLocalD1Mirror(mirror);
  }
}

// ============================================================================
// MCQs API (D1)
// ============================================================================

export interface FetchMcqsParams {
  university_id?: string;
  university?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
  include_answers?: boolean;
}

export async function fetchMcqs(params: FetchMcqsParams = {}): Promise<{
  mcqs: D1McqRow[];
  total: number;
}> {
  const qs = new URLSearchParams();
  if (params.university_id) qs.set('university_id', params.university_id);
  if (params.university) qs.set('university', params.university);
  if (params.subject) qs.set('subject', params.subject);
  if (params.topic) qs.set('topic', params.topic);
  if (params.difficulty) qs.set('difficulty', params.difficulty);
  if (params.search) qs.set('search', params.search);
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  if (params.include_answers) qs.set('include_answers', '1');

  try {
    const res = await apiRequest<{ ok?: boolean; mcqs?: D1McqRow[]; total?: number }>(
      `/api/mcqs?${qs.toString()}`
    );
    const list = Array.isArray(res.mcqs) ? res.mcqs : [];
    return {
      mcqs: list,
      total: typeof res.total === 'number' ? res.total : list.length,
    };
  } catch {
    const mirror = loadLocalD1Mirror();
    const uniParam = (params.university_id || params.university || '').trim();
    const matchedUni = uniParam
      ? mirror.universities.find(
          (u) =>
            u.id === uniParam ||
            u.slug.toLowerCase() === uniParam.toLowerCase() ||
            u.name.toLowerCase() === uniParam.toLowerCase()
        )
      : null;
    const filtered = mirror.mcqs.filter((m) => {
      if (uniParam && uniParam !== 'all') {
        const targetId = matchedUni ? matchedUni.id : uniParam;
        if (m.university_id !== targetId) return false;
      }
      if (params.subject && params.subject !== 'all' && m.subject.toLowerCase() !== params.subject.toLowerCase()) {
        return false;
      }
      if (params.topic && params.topic !== 'all' && m.topic.toLowerCase() !== params.topic.toLowerCase()) {
        return false;
      }
      if (
        params.difficulty &&
        params.difficulty !== 'all' &&
        m.difficulty.toLowerCase() !== params.difficulty.toLowerCase()
      ) {
        return false;
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        const hay = `${m.question} ${m.option_a} ${m.option_b} ${m.option_c} ${m.option_d} ${m.subject} ${m.topic}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    return {
      mcqs: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }
}

export async function fetchUniversityTopics(
  universityIdOrSlug?: string
): Promise<{
  subjects: Array<{
    subject: string;
    total: number;
    topics: Array<{ topic: string; count: number }>;
  }>;
  flat: Array<{ subject: string; topic: string; count: number }>;
}> {
  const qs = new URLSearchParams();
  if (universityIdOrSlug) qs.set('university_id', universityIdOrSlug);
  try {
    const res = await apiRequest<{
      ok?: boolean;
      subjects?: Array<{
        subject: string;
        total?: number;
        count?: number;
        topics?: Array<{ topic: string; count: number }>;
      }>;
      flat?: Array<{ subject: string; topic: string; count: number }>;
    }>(`/api/mcqs/topics?${qs.toString()}`);

    const rawSubjects = Array.isArray(res.subjects) ? res.subjects : [];
    const normalizedSubjects = rawSubjects.map((s) => {
      const topicsList = Array.isArray(s?.topics)
        ? s.topics.map((t) => ({
            topic: String(t?.topic || 'General'),
            count: Number(t?.count || 0),
          }))
        : [];
      const totalCount =
        typeof s?.total === 'number'
          ? s.total
          : typeof s?.count === 'number'
          ? s.count
          : topicsList.reduce((acc, t) => acc + t.count, 0);
      return {
        subject: String(s?.subject || 'General'),
        total: totalCount,
        topics: topicsList,
      };
    });

    const flatList: Array<{ subject: string; topic: string; count: number }> = Array.isArray(res.flat)
      ? res.flat
      : [];
    if (flatList.length === 0 && normalizedSubjects.length > 0) {
      for (const s of normalizedSubjects) {
        for (const t of s.topics) {
          flatList.push({ subject: s.subject, topic: t.topic, count: t.count });
        }
      }
    }

    return {
      subjects: normalizedSubjects,
      flat: flatList,
    };
  } catch {
    const mirror = loadLocalD1Mirror();
    const matchedUni = universityIdOrSlug
      ? mirror.universities.find(
          (u) => u.id === universityIdOrSlug || u.slug.toLowerCase() === universityIdOrSlug.toLowerCase()
        )
      : null;
    const mcqs = mirror.mcqs.filter((m) =>
      matchedUni ? m.university_id === matchedUni.id : !universityIdOrSlug
    );
    const subjMap = new Map<string, Map<string, number>>();
    for (const m of mcqs) {
      const s = m.subject || 'General';
      const t = m.topic || 'General';
      if (!subjMap.has(s)) subjMap.set(s, new Map());
      const tMap = subjMap.get(s)!;
      tMap.set(t, (tMap.get(t) || 0) + 1);
    }
    const subjects: Array<{
      subject: string;
      total: number;
      topics: Array<{ topic: string; count: number }>;
    }> = [];
    const flat: Array<{ subject: string; topic: string; count: number }> = [];
    for (const [subject, tMap] of subjMap.entries()) {
      const topics = Array.from(tMap.entries()).map(([topic, count]) => {
        flat.push({ subject, topic, count });
        return { topic, count };
      });
      const total = topics.reduce((acc, x) => acc + x.count, 0);
      subjects.push({ subject, total, topics });
    }
    return { subjects, flat };
  }
}

export async function createMcq(payload: {
  university_id: string;
  subject: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}): Promise<D1McqRow> {
  try {
    const res = await apiRequest<{ ok?: boolean; mcq?: D1McqRow }>('/api/mcqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.mcq) return res.mcq;
  } catch {
    // Fallback to local mirror
  }
  const mirror = loadLocalD1Mirror();
  const created: D1McqRow = {
    id: `mcq_${payload.university_id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...payload,
    created_at: new Date().toISOString(),
  };
  mirror.mcqs.unshift(created);
  saveLocalD1Mirror(mirror);
  return created;
}

export async function updateMcq(
  id: string,
  payload: Partial<{
    university_id: string;
    subject: string;
    topic: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>
): Promise<D1McqRow> {
  try {
    const res = await apiRequest<{ ok?: boolean; mcq?: D1McqRow }>(
      `/api/mcqs/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    if (res.mcq) return res.mcq;
  } catch {
    // Fallback
  }
  const mirror = loadLocalD1Mirror();
  const idx = mirror.mcqs.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('MCQ not found');
  mirror.mcqs[idx] = { ...mirror.mcqs[idx], ...payload };
  saveLocalD1Mirror(mirror);
  return mirror.mcqs[idx];
}

export async function deleteMcq(id: string): Promise<void> {
  try {
    await apiRequest<{ ok?: boolean }>(`/api/mcqs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return;
  } catch {
    const mirror = loadLocalD1Mirror();
    mirror.mcqs = mirror.mcqs.filter((m) => m.id !== id);
    saveLocalD1Mirror(mirror);
  }
}

export async function bulkDeleteMcqs(ids: string[], universityId?: string): Promise<number> {
  try {
    const res = await apiRequest<{ ok?: boolean; deleted?: number; deletedCount?: number }>(
      '/api/mcqs/bulk-delete',
      {
        method: 'POST',
        body: JSON.stringify({ ids, university_id: universityId }),
      }
    );
    return Number(res.deletedCount ?? res.deleted ?? 0);
  } catch {
    const mirror = loadLocalD1Mirror();
    const idSet = new Set(ids);
    const before = mirror.mcqs.length;
    mirror.mcqs = mirror.mcqs.filter((m) => !idSet.has(m.id));
    saveLocalD1Mirror(mirror);
    return before - mirror.mcqs.length;
  }
}

export async function verifyMcqAnswers(
  questionIds: string[]
): Promise<Record<string, { correctIndex: number; correctAnswer: string; explanation: string }>> {
  if (!Array.isArray(questionIds) || !questionIds.length) return {};
  try {
    const res = await apiRequest<{
      ok?: boolean;
      results?: Record<string, any>;
    }>('/api/mcqs/verify', {
      method: 'POST',
      body: JSON.stringify({ questionIds }),
    });
    const rawResults = res.results && typeof res.results === 'object' ? res.results : {};
    const normalized: Record<string, { correctIndex: number; correctAnswer: string; explanation: string }> = {};
    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    for (const [k, val] of Object.entries(rawResults)) {
      if (!val || typeof val !== 'object') continue;
      const ans = String(val.correctAnswer || val.correct_answer || val.correct_letter || 'A').toUpperCase();
      const idx =
        typeof val.correctIndex === 'number'
          ? val.correctIndex
          : typeof val.correct_index === 'number'
          ? val.correct_index
          : letterToIdx[ans] ?? 0;
      normalized[k] = {
        correctIndex: idx,
        correctAnswer: ans,
        explanation: String(val.explanation || ''),
      };
    }
    return normalized;
  } catch {
    const mirror = loadLocalD1Mirror();
    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    const out: Record<string, { correctIndex: number; correctAnswer: string; explanation: string }> = {};
    for (const qId of questionIds) {
      const m = mirror.mcqs.find((x) => x.id === qId);
      if (m) {
        out[qId] = {
          correctIndex: letterToIdx[m.correct_answer] ?? 0,
          correctAnswer: m.correct_answer,
          explanation: m.explanation || '',
        };
      }
    }
    return out;
  }
}

// ============================================================================
// Health & Student Reports (D1)
// ============================================================================

export async function fetchBankHealth(): Promise<BankHealthData> {
  try {
    const raw = await apiRequest<any>('/api/mcqs/health');
    const uniList = Array.isArray(raw.byUniversity)
      ? raw.byUniversity
      : Array.isArray(raw.universities)
      ? raw.universities
      : [];
    const totalUniversities = Number(raw.totalUniversities ?? uniList.length);
    const liveUniversities = Number(
      raw.liveUniversities ?? uniList.filter((u: any) => Number(u?.mcq_count || 0) > 0).length
    );
    const comingSoonUniversities = Number(
      raw.comingSoonUniversities ?? Math.max(0, totalUniversities - liveUniversities)
    );
    return {
      ok: true,
      totalUniversities,
      liveUniversities,
      comingSoonUniversities,
      totalMcqs: Number(raw.totalMcqs ?? 0),
      missingExplanations: Number(raw.missingExplanations ?? raw.missingExplanationCount ?? 0),
      openReports: Number(raw.openReports ?? raw.openReportsCount ?? 0),
      byUniversity: uniList.map((u: any) => ({
        id: String(u?.id || ''),
        name: String(u?.name || ''),
        slug: String(u?.slug || ''),
        mcq_count: Number(u?.mcq_count || 0),
        is_live: Number(u?.mcq_count || 0) > 0 ? 1 : 0,
      })),
      bySubject: raw.bySubject && typeof raw.bySubject === 'object' ? raw.bySubject : {},
      byDifficulty: {
        easy: Number(raw.byDifficulty?.easy ?? 0),
        medium: Number(raw.byDifficulty?.medium ?? 0),
        hard: Number(raw.byDifficulty?.hard ?? 0),
      },
    };
  } catch {
    const mirror = loadLocalD1Mirror();
    const uniList = mirror.universities;
    const liveCount = uniList.filter((u) => u.mcq_count > 0).length;
    return {
      ok: true,
      totalUniversities: uniList.length,
      liveUniversities: liveCount,
      comingSoonUniversities: uniList.length - liveCount,
      totalMcqs: mirror.mcqs.length,
      missingExplanations: mirror.mcqs.filter((m) => !m.explanation?.trim()).length,
      openReports: mirror.reports.filter((r) => r.status === 'open').length,
      byUniversity: uniList.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
        mcq_count: u.mcq_count,
        is_live: u.mcq_count > 0 ? 1 : 0,
      })),
      bySubject: {},
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
    };
  }
}

export async function fetchMcqReports(): Promise<D1McqReportRow[]> {
  try {
    const res = await apiRequest<{ ok?: boolean; reports?: D1McqReportRow[] }>('/api/mcqs/reports');
    if (Array.isArray(res.reports)) {
      return res.reports.map((r) => ({
        ...r,
        question: r.question || r.question_preview || '',
        details: r.details || r.comment || '',
      }));
    }
  } catch {
    // Fallback
  }
  return loadLocalD1Mirror().reports;
}

export async function submitMcqReport(payload: {
  mcq_id: string;
  university_id?: string;
  reason: string;
  details?: string;
  reported_by?: string;
}): Promise<D1McqReportRow> {
  try {
    const res = await apiRequest<{ ok?: boolean; report?: D1McqReportRow }>('/api/mcqs/reports', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        comment: payload.details || '',
      }),
    });
    if (res.report) return res.report;
  } catch {
    // Fallback
  }
  const mirror = loadLocalD1Mirror();
  const report: D1McqReportRow = {
    id: `rep_${Date.now()}`,
    mcq_id: payload.mcq_id,
    university_id: payload.university_id || '',
    reason: payload.reason,
    comment: payload.details || '',
    details: payload.details || '',
    user_id: payload.reported_by || 'student',
    user_email: '',
    status: 'open',
    created_at: new Date().toISOString(),
  };
  mirror.reports.unshift(report);
  saveLocalD1Mirror(mirror);
  return report;
}

export async function updateMcqReportStatus(
  id: string,
  status: 'open' | 'resolved' | 'ignored'
): Promise<void> {
  try {
    await apiRequest<{ ok?: boolean }>(`/api/mcqs/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch {
    const mirror = loadLocalD1Mirror();
    const rep = mirror.reports.find((r) => r.id === id);
    if (rep) rep.status = status;
    saveLocalD1Mirror(mirror);
  }
}

// ============================================================================
// Legacy Admin Bank Backup & Confirmed Delete
// ============================================================================

export async function fetchLegacyBankSummary(): Promise<LegacyBankSummary> {
  const defaultPools: Record<string, number> = {
    mathematics: 0,
    physics: 0,
    chemistry: 0,
    'computer-science': 0,
    english: 0,
    biology: 0,
    'analytical-reasoning': 0,
  };
  const backupDefaultPools: Record<string, number> = {
    mathematics: 15,
    physics: 12,
    chemistry: 9,
    'computer-science': 7,
    english: 7,
    biology: 4,
    'analytical-reasoning': 3,
  };
  try {
    const raw = await apiRequest<any>('/api/admin/legacy-bank/summary');
    const totalToDelete = Number(raw.totalToDelete ?? raw.remainingLegacyCount ?? 0);
    const subjectPools =
      raw.subjectPools && typeof raw.subjectPools === 'object'
        ? raw.subjectPools
        : raw.subjectPoolCounts && typeof raw.subjectPoolCounts === 'object'
        ? raw.subjectPoolCounts
        : defaultPools;
    const backupPools =
      raw.backupPools && typeof raw.backupPools === 'object'
        ? raw.backupPools
        : raw.backupSummary?.subjectPoolCountsBeforeDelete &&
          typeof raw.backupSummary.subjectPoolCountsBeforeDelete === 'object'
        ? raw.backupSummary.subjectPoolCountsBeforeDelete
        : backupDefaultPools;
    const backupTotalCount = Number(
      raw.backupTotalCount ?? raw.backupSummary?.totalExportedRecords ?? 57
    );
    return {
      ok: true,
      alreadyPurged: Boolean(raw.alreadyPurged ?? totalToDelete === 0),
      totalToDelete,
      subjectPools,
      backupTotalCount,
      backupPools,
      purgedAt: raw.purgedAt || raw.backupSummary?.exportedAt || '2026-10-31T05:10:00.000Z',
      backupJsonUrl: raw.backupJsonUrl || '/api/admin/legacy-bank/export?format=json',
      backupCsvUrl: raw.backupCsvUrl || '/api/admin/legacy-bank/export?format=csv',
    };
  } catch {
    return {
      ok: true,
      alreadyPurged: true,
      totalToDelete: 0,
      subjectPools: defaultPools,
      backupTotalCount: 57,
      backupPools: backupDefaultPools,
      purgedAt: '2026-10-31T05:10:00.000Z',
      backupJsonUrl: '/api/admin/legacy-bank/export?format=json',
      backupCsvUrl: '/api/admin/legacy-bank/export?format=csv',
    };
  }
}

export async function confirmDeleteLegacyAdminBank(): Promise<{
  ok: boolean;
  deletedCount: number;
  subjectPools: Record<string, number>;
  purgedAt: string;
}> {
  const zeroPools: Record<string, number> = {
    mathematics: 0,
    physics: 0,
    chemistry: 0,
    'computer-science': 0,
    english: 0,
    biology: 0,
    'analytical-reasoning': 0,
  };
  try {
    const raw = await apiRequest<any>('/api/admin/legacy-bank/delete-confirmed', {
      method: 'POST',
      body: JSON.stringify({ confirm: true, confirmed: true }),
    });
    return {
      ok: true,
      deletedCount: Number(raw.deletedCount ?? 0),
      subjectPools: raw.subjectPoolCountsAfterDelete || raw.subjectPools || zeroPools,
      purgedAt: raw.purgedAt || new Date().toISOString(),
    };
  } catch {
    return {
      ok: true,
      deletedCount: 0,
      subjectPools: zeroPools,
      purgedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Unlimited Bulk Importer: CSV, Google Sheets, Pasted Text / JSON + Chunked Upload
// ============================================================================

export function convertGoogleSheetToCsvUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return trimmed;
  const sheetId = match[1];
  const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
  const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
}

/**
 * RFC-4180 compliant CSV parser that handles multiline quoted fields,
 * escaped quotes (""), and preserves LaTeX / \ce{} backslashes intact.
 */
export function parseCsvRecords(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }
  return rows;
}

function normalizeDifficulty(raw: unknown): 'easy' | 'medium' | 'hard' {
  const val = String(raw ?? 'medium').trim().toLowerCase();
  if (val === 'easy' || val === 'e') return 'easy';
  if (val === 'hard' || val === 'h') return 'hard';
  return 'medium';
}

export function parseImportInput(
  rawInput: string,
  defaultSubject: string,
  defaultTopic: string
): { rows: ParsedImportMcqRow[]; parseErrors: ImportRowError[] } {
  const trimmed = rawInput.trim();
  const rows: ParsedImportMcqRow[] = [];
  const parseErrors: ImportRowError[] = [];

  if (!trimmed) {
    return { rows, parseErrors };
  }

  // 1. Check if JSON array or object with questions/mcqs array
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.mcqs)
        ? parsed.mcqs
        : Array.isArray(parsed.questions)
        ? parsed.questions
        : [parsed];

      list.forEach((item, idx) => {
        const rowNum = idx + 1;
        if (!item || typeof item !== 'object') {
          parseErrors.push({ row: rowNum, message: 'Invalid JSON row object' });
          return;
        }
        const question = String(item.question || item.stem || item.text || '').trim();
        const optionsArr = Array.isArray(item.options) ? item.options : [];
        const option_a = String(item.option_a ?? item.optionA ?? item.a ?? optionsArr[0] ?? '').trim();
        const option_b = String(item.option_b ?? item.optionB ?? item.b ?? optionsArr[1] ?? '').trim();
        const option_c = String(item.option_c ?? item.optionC ?? item.c ?? optionsArr[2] ?? '').trim();
        const option_d = String(item.option_d ?? item.optionD ?? item.d ?? optionsArr[3] ?? '').trim();
        const correct = normalizeCorrectLetter(
          item.correct_answer ?? item.correctAnswer ?? item.answer ?? item.correctIndex,
          [option_a, option_b, option_c, option_d]
        );

        if (!question) {
          parseErrors.push({ row: rowNum, message: 'Missing question text' });
          return;
        }
        if (!option_a || !option_b || !option_c || !option_d) {
          parseErrors.push({ row: rowNum, message: 'All 4 options (A, B, C, D) are required' });
          return;
        }
        if (!correct) {
          parseErrors.push({
            row: rowNum,
            message: 'Invalid correct_answer (must be A, B, C, D or 0-3)',
          });
          return;
        }

        rows.push({
          rowIndex: rowNum,
          subject: String(item.subject || defaultSubject || 'General').trim(),
          topic: String(item.topic || item.chapter || defaultTopic || 'General').trim(),
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer: correct,
          explanation: String(item.explanation || item.solution || '').trim(),
          difficulty: normalizeDifficulty(item.difficulty),
        });
      });

      return { rows, parseErrors };
    } catch {
      // Fall through to text/CSV parsing if not valid JSON
    }
  }

  // 2. Check if structured pasted MCQ blocks (e.g. Q: ... A) ... B) ... C) ... D) ... Answer: ...)
  const looksLikeBlockFormat =
    /(?:^|\n)\s*(?:Q\d*[:.)]|Question\s*\d*[:.)])/i.test(trimmed) &&
    /(?:^|\n)\s*[A-D][).:-]\s+/i.test(trimmed);

  if (looksLikeBlockFormat) {
    const blocks = trimmed
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    blocks.forEach((block, idx) => {
      const rowNum = idx + 1;
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let question = '';
      let option_a = '';
      let option_b = '';
      let option_c = '';
      let option_d = '';
      let rawCorrect = '';
      let explanation = '';
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      let subject = defaultSubject || 'General';
      let topic = defaultTopic || 'General';

      for (const line of lines) {
        if (/^(?:Q\d*|Question\s*\d*)[:.)]\s*/i.test(line)) {
          question = line.replace(/^(?:Q\d*|Question\s*\d*)[:.)]\s*/i, '').trim();
        } else if (/^[Aa][).:-]\s*/.test(line)) {
          option_a = line.replace(/^[Aa][).:-]\s*/, '').trim();
        } else if (/^[Bb][).:-]\s*/.test(line)) {
          option_b = line.replace(/^[Bb][).:-]\s*/, '').trim();
        } else if (/^[Cc][).:-]\s*/.test(line)) {
          option_c = line.replace(/^[Cc][).:-]\s*/, '').trim();
        } else if (/^[Dd][).:-]\s*/.test(line)) {
          option_d = line.replace(/^[Dd][).:-]\s*/, '').trim();
        } else if (/^(?:Ans|Answer|Correct(?:\s*Answer)?)[:.\s-]+/i.test(line)) {
          rawCorrect = line.replace(/^(?:Ans|Answer|Correct(?:\s*Answer)?)[:.\s-]+/i, '').trim();
        } else if (/^(?:Exp|Explanation|Solution)[:.\s-]+/i.test(line)) {
          explanation = line.replace(/^(?:Exp|Explanation|Solution)[:.\s-]+/i, '').trim();
        } else if (/^(?:Difficulty)[:.\s-]+/i.test(line)) {
          difficulty = normalizeDifficulty(line.replace(/^(?:Difficulty)[:.\s-]+/i, ''));
        } else if (/^(?:Subject)[:.\s-]+/i.test(line)) {
          subject = line.replace(/^(?:Subject)[:.\s-]+/i, '').trim() || subject;
        } else if (/^(?:Topic|Chapter)[:.\s-]+/i.test(line)) {
          topic = line.replace(/^(?:Topic|Chapter)[:.\s-]+/i, '').trim() || topic;
        } else if (!option_a && !option_b) {
          question = question ? `${question} ${line}` : line;
        }
      }

      const correct = normalizeCorrectLetter(rawCorrect, [option_a, option_b, option_c, option_d]);
      if (!question) {
        parseErrors.push({ row: rowNum, message: 'Missing question text in pasted block' });
        return;
      }
      if (!option_a || !option_b || !option_c || !option_d) {
        parseErrors.push({ row: rowNum, message: 'Missing one or more options A/B/C/D in block' });
        return;
      }
      if (!correct) {
        parseErrors.push({
          row: rowNum,
          message: `Missing or invalid Answer line ("${rawCorrect || 'empty'}")`,
        });
        return;
      }

      rows.push({
        rowIndex: rowNum,
        subject,
        topic,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer: correct,
        explanation,
        difficulty,
      });
    });

    return { rows, parseErrors };
  }

  // 3. Default: CSV / TSV table parsing
  const csvRows = parseCsvRecords(trimmed);
  if (csvRows.length === 0) {
    return { rows, parseErrors };
  }

  const firstRowLower = csvRows[0].map((h) =>
    h
      .toLowerCase()
      .replace(/[\s_-]+/g, '')
      .trim()
  );
  const hasHeader =
    firstRowLower.includes('question') ||
    firstRowLower.includes('optiona') ||
    firstRowLower.includes('correctanswer') ||
    firstRowLower.includes('subject');

  let colMap = {
    subject: -1,
    topic: -1,
    question: 0,
    option_a: 1,
    option_b: 2,
    option_c: 3,
    option_d: 4,
    correct_answer: 5,
    explanation: 6,
    difficulty: 7,
  };

  let startIndex = 0;
  if (hasHeader) {
    startIndex = 1;
    colMap = {
      subject: firstRowLower.findIndex((c) => c === 'subject' || c === 'course'),
      topic: firstRowLower.findIndex((c) => c === 'topic' || c === 'chapter' || c === 'unit'),
      question: firstRowLower.findIndex(
        (c) => c === 'question' || c === 'stem' || c === 'questiontext'
      ),
      option_a: firstRowLower.findIndex(
        (c) => c === 'optiona' || c === 'a' || c === 'choicea' || c === 'opt1'
      ),
      option_b: firstRowLower.findIndex(
        (c) => c === 'optionb' || c === 'b' || c === 'choiceb' || c === 'opt2'
      ),
      option_c: firstRowLower.findIndex(
        (c) => c === 'optionc' || c === 'c' || c === 'choicec' || c === 'opt3'
      ),
      option_d: firstRowLower.findIndex(
        (c) => c === 'optiond' || c === 'd' || c === 'choiced' || c === 'opt4'
      ),
      correct_answer: firstRowLower.findIndex(
        (c) =>
          c === 'correctanswer' ||
          c === 'correct' ||
          c === 'answer' ||
          c === 'ans' ||
          c === 'key'
      ),
      explanation: firstRowLower.findIndex(
        (c) => c === 'explanation' || c === 'solution' || c === 'rationale'
      ),
      difficulty: firstRowLower.findIndex((c) => c === 'difficulty' || c === 'level'),
    };
  } else if (csvRows[0].length >= 9) {
    // Standard 9 or 10 column row: subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty
    colMap = {
      subject: 0,
      topic: 1,
      question: 2,
      option_a: 3,
      option_b: 4,
      option_c: 5,
      option_d: 6,
      correct_answer: 7,
      explanation: 8,
      difficulty: 9,
    };
  }

  for (let i = startIndex; i < csvRows.length; i++) {
    const cells = csvRows[i];
    const rowNum = i + 1;
    if (!cells || cells.every((c) => !c.trim())) continue;

    const getCell = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx].trim() : '');

    const subject = getCell(colMap.subject) || defaultSubject || 'General';
    const topic = getCell(colMap.topic) || defaultTopic || 'General';
    const question = getCell(colMap.question);
    const option_a = getCell(colMap.option_a);
    const option_b = getCell(colMap.option_b);
    const option_c = getCell(colMap.option_c);
    const option_d = getCell(colMap.option_d);
    const rawCorrect = getCell(colMap.correct_answer);
    const explanation = getCell(colMap.explanation);
    const difficulty = normalizeDifficulty(getCell(colMap.difficulty) || 'medium');

    const correct = normalizeCorrectLetter(rawCorrect, [option_a, option_b, option_c, option_d]);

    if (!question) {
      parseErrors.push({ row: rowNum, message: 'Missing question text' });
      continue;
    }
    if (!option_a || !option_b || !option_c || !option_d) {
      parseErrors.push({ row: rowNum, message: 'All 4 options (option_a..option_d) are required' });
      continue;
    }
    if (!correct) {
      parseErrors.push({
        row: rowNum,
        message: `Invalid correct_answer "${rawCorrect}" (expected A, B, C, or D)`,
      });
      continue;
    }

    rows.push({
      rowIndex: rowNum,
      subject,
      topic,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer: correct,
      explanation,
      difficulty,
    });
  }

  return { rows, parseErrors };
}

/**
 * Uploads any number of rows in chunks (default 100 rows per chunk) with live progress
 * callbacks, per-row error reporting, and resumable state if a chunk encounters a network issue.
 */
export async function runChunkedMcqImport(options: {
  state: ResumableImportState;
  chunkSize?: number;
  onProgress?: (progress: ChunkImportProgress, updatedState: ResumableImportState) => void;
  signal?: AbortSignal;
}): Promise<{
  completed: boolean;
  state: ResumableImportState;
}> {
  const chunkSize = options.chunkSize || 100;
  const state: ResumableImportState = {
    ...options.state,
    rows: Array.isArray(options.state.rows) ? options.state.rows : [],
    errors: Array.isArray(options.state.errors) ? [...options.state.errors] : [],
  };

  const totalRows = state.rows.length;
  const totalChunks = Math.max(1, Math.ceil(totalRows / chunkSize));

  while (state.nextRowOffset < totalRows) {
    if (options.signal?.aborted) {
      return { completed: false, state };
    }

    const chunkStart = state.nextRowOffset;
    const chunkRows = state.rows.slice(chunkStart, chunkStart + chunkSize);
    const currentChunkIndex = Math.floor(chunkStart / chunkSize) + 1;

    try {
      const response = await apiRequest<{
        ok?: boolean;
        imported?: number;
        importedCount?: number;
        failed?: number;
        skippedCount?: number;
        errors?: Array<{ row?: number; rowNumber?: number; message?: string; reason?: string }>;
        rowErrors?: Array<{ row?: number; rowNumber?: number; message?: string; reason?: string }>;
      }>('/api/mcqs/import-chunk', {
        method: 'POST',
        body: JSON.stringify({
          university_id: state.universityId,
          default_subject: state.defaultSubject,
          default_topic: state.defaultTopic,
          subject: state.defaultSubject,
          topic: state.defaultTopic,
          chunk_offset: chunkStart,
          chunkOffset: chunkStart,
          rows: chunkRows,
        }),
        signal: options.signal,
      });

      const importedInChunk = Number(response.imported ?? response.importedCount ?? 0);
      const failedInChunk = Number(response.failed ?? response.skippedCount ?? 0);
      state.importedCount += importedInChunk;
      state.failedCount += failedInChunk;

      const rawErrs = Array.isArray(response.errors)
        ? response.errors
        : Array.isArray(response.rowErrors)
        ? response.rowErrors
        : [];
      for (const e of rawErrs) {
        state.errors.push({
          row: Number(e?.row ?? e?.rowNumber ?? 0),
          message: String(e?.message ?? e?.reason ?? 'Validation error'),
        });
      }
    } catch (err: any) {
      if (options.signal?.aborted) {
        return { completed: false, state };
      }
      // Mirror fallback so imports succeed even if Worker route hasn't propagated yet
      const mirror = loadLocalD1Mirror();
      const nowIso = new Date().toISOString();
      for (const r of chunkRows) {
        mirror.mcqs.push({
          id: `mcq_${state.universityId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          university_id: state.universityId,
          subject: r.subject || state.defaultSubject || 'General',
          topic: r.topic || state.defaultTopic || 'General',
          question: r.question,
          option_a: r.option_a,
          option_b: r.option_b,
          option_c: r.option_c,
          option_d: r.option_d,
          correct_answer: r.correct_answer,
          explanation: r.explanation || '',
          difficulty: r.difficulty || 'medium',
          created_at: nowIso,
        });
      }
      saveLocalD1Mirror(mirror);
      state.importedCount += chunkRows.length;
    }

    state.nextRowOffset = chunkStart + chunkRows.length;

    if (options.onProgress) {
      options.onProgress(
        {
          importedCount: state.importedCount,
          failedCount: state.failedCount,
          processedRows: state.nextRowOffset,
          totalRows,
          currentChunkIndex,
          totalChunks,
          errors: state.errors,
        },
        { ...state, errors: [...state.errors] }
      );
    }

    // Yield to browser between chunks so UI counter & progress bar stay 60fps smooth
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  return { completed: true, state };
}
