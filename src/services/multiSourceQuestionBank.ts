import {
  ENABLE_MULTI_SOURCE_BANK,
  USE_FIRESTORE_QUESTION_READER,
  getBankSources,
  getBankSource,
  getDefaultWriteSource,
  recordSourceSuccess,
} from '@/config/questionBankSources';
import { auth } from '@/lib/firebase';
import {
  computeContentHash,
  getChaptersForSubject,
  findSubjectSlug,
  normalizeTopicName,
} from '@/constants/taxonomy';
import type { Question, QuestionDifficulty, QuestionStatus } from '@/types';
import { clearQuestionsCache } from './adminService';

export { ENABLE_MULTI_SOURCE_BANK, USE_FIRESTORE_QUESTION_READER };

export function parseQuestionCompoundId(
  compoundId: string,
  fallbackSourceId = 'legacy'
): { sourceId: string; docId: string } {
  if (!ENABLE_MULTI_SOURCE_BANK) {
    return { sourceId: 'legacy', docId: compoundId };
  }
  if (compoundId && compoundId.includes(':')) {
    const colonIdx = compoundId.indexOf(':');
    return {
      sourceId: compoundId.slice(0, colonIdx),
      docId: compoundId.slice(colonIdx + 1),
    };
  }
  if (compoundId && compoundId.startsWith('bank1__')) {
    return { sourceId: 'bank1', docId: compoundId };
  }
  if (compoundId && compoundId.startsWith('bank2__')) {
    return { sourceId: 'bank2', docId: compoundId };
  }
  return {
    sourceId: fallbackSourceId,
    docId: compoundId,
  };
}

export function formatQuestionCompoundId(_sourceId: string, docId: string): string {
  return docId;
}

export function toD1QuestionId(compoundOrDocId: string): string {
  if (!compoundOrDocId) return '';
  if (compoundOrDocId.includes(':')) {
    const { sourceId, docId } = parseQuestionCompoundId(compoundOrDocId);
    if (sourceId !== 'legacy' && !docId.startsWith(`${sourceId}__`)) {
      return `${sourceId}__${docId}`;
    }
    return docId;
  }
  return compoundOrDocId;
}

async function getD1AuthHeaders(includeJsonContentType = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // Non-fatal if user is anonymous / not signed in
  }
  return headers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapD1RowToQuestion(raw: Record<string, any>): Question {
  const qText = String(raw.question_text ?? raw.questionText ?? raw.q ?? raw.question ?? '');
  let opts: string[] = [];
  if (Array.isArray(raw.options)) {
    opts = raw.options.map((o: unknown) => String(o ?? ''));
  } else if (typeof raw.options_json === 'string') {
    try {
      const parsed = JSON.parse(raw.options_json);
      if (Array.isArray(parsed)) opts = parsed.map((o: unknown) => String(o ?? ''));
    } catch {
      opts = [];
    }
  }
  const bankId = String(raw.bank_id || raw.sourceId || 'legacy');
  const hasAnswer =
    raw.correct_answer !== undefined ||
    raw.correctAnswer !== undefined ||
    raw.correct !== undefined;
  const answerVal = hasAnswer
    ? Number(raw.correct_answer ?? raw.correctAnswer ?? raw.correct ?? 0)
    : undefined;
  const explainVal =
    raw.explanation !== undefined || raw.explain !== undefined
      ? String(raw.explanation ?? raw.explain ?? '')
      : undefined;

  const mapped: Question = {
    id: String(raw.id || ''),
    sourceId: bankId,
    subject: String(raw.subject || 'physics'),
    chapter: String(raw.topic || raw.chapter || 'General'),
    topic: String(raw.topic || raw.chapter || 'General'),
    difficulty: String(raw.difficulty || 'medium').toLowerCase() as QuestionDifficulty,
    status: String(raw.status || 'published').toLowerCase() as QuestionStatus,
    active: raw.status !== 'archived',
    q: qText,
    question: qText,
    stem: qText,
    options: [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || ''],
    tags: Array.isArray(raw.tags) ? raw.tags : ['entrance'],
    rand: 0.5,
    schemaVersion: 1,
    contentHash: String(raw.contentHash || ''),
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
    createdBy: String(raw.createdBy || 'admin'),
    ...(hasAnswer ? { correct: answerVal, correctAnswer: answerVal } : {}),
    ...(explainVal !== undefined ? { explain: explainVal, explanation: explainVal } : {}),
  } as Question;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mapped as any;
  m.bank_id = bankId;
  m.needs_review = Number(raw.needs_review ?? (raw.needsReview ? 1 : 0));
  m.needsReview = Boolean(raw.needs_review || raw.needsReview);
  m.source_path = String(raw.source_path || '');
  return mapped;
}

export function normalizeQuestionText(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function hashNormalizedQuestionText(text: string): string {
  const norm = normalizeQuestionText(text);
  let hash1 = 0x811c9dc5;
  let hash2 = 0x27d4eb2f;
  for (let i = 0; i < norm.length; i++) {
    const char = norm.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = (hash2 << 5) - hash2 + char;
    hash2 |= 0;
  }
  return `qh_${(hash1 >>> 0).toString(16)}_${(hash2 >>> 0).toString(16)}`;
}

export const MCQ_CACHE_VERSION = 'v3_d1';
const MCQ_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AggregatedCounts {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
}

let sessionAggregatedCounts: AggregatedCounts | null = null;
let countsFetchPromise: Promise<AggregatedCounts> | null = null;

function readMcqStorageCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`boardly_mcq_${MCQ_CACHE_VERSION}_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: string; ts: number; data: T };
    if (parsed.v !== MCQ_CACHE_VERSION) return null;
    if (Date.now() - parsed.ts > MCQ_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeMcqStorageCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `boardly_mcq_${MCQ_CACHE_VERSION}_${key}`,
      JSON.stringify({ v: MCQ_CACHE_VERSION, ts: Date.now(), data })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function clearMultiSourceCache(): void {
  sessionAggregatedCounts = null;
  countsFetchPromise = null;
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('boardly_mcq_')) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  }
}

export async function getMultiSourceSubjectQuestionIds(subject: string): Promise<string[]> {
  const norm = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cachedIds = readMcqStorageCache<string[]>(`idx_${norm}`);
  if (cachedIds && cachedIds.length > 0) {
    return cachedIds;
  }

  try {
    const headers = await getD1AuthHeaders();
    const resp = await fetch(`/api/questions/ids?subject=${encodeURIComponent(norm)}`, {
      headers,
    });
    if (resp.ok) {
      const data = await resp.json();
      const ids: string[] = Array.isArray(data?.ids) ? data.ids : [];
      if (ids.length > 0) {
        writeMcqStorageCache(`idx_${norm}`, ids);
      }
      return ids;
    }
  } catch (err) {
    console.warn(`[D1QuestionBank] Failed to fetch question IDs for ${norm}:`, err);
  }
  return [];
}

export async function fetchMultiSourceQuestionsByIds(
  compoundIds: string[],
  _subject?: string
): Promise<Question[]> {
  if (!compoundIds || compoundIds.length === 0) return [];

  const d1Ids = compoundIds.map((cid) => toD1QuestionId(cid)).filter(Boolean);
  if (d1Ids.length === 0) return [];
  const headers = await getD1AuthHeaders();
  const collected: Question[] = [];
  const chunkSize = 50;
  for (let i = 0; i < d1Ids.length; i += chunkSize) {
    const chunk = d1Ids.slice(i, i + chunkSize);
    try {
      const resp = await fetch(
        `/api/questions?ids=${encodeURIComponent(chunk.join(','))}&limit=${chunk.length}`,
        { headers }
      );
      if (resp.ok) {
        const data = await resp.json();
        const list = Array.isArray(data?.questions) ? data.questions : [];
        list.forEach((raw: Record<string, unknown>) => {
          collected.push(mapD1RowToQuestion(raw));
        });
      }
    } catch (err) {
      console.warn('[D1QuestionBank] Failed to fetch questions by IDs:', err);
    }
  }
  return collected;
}

export async function getMultiSourceQuestionCounts(): Promise<AggregatedCounts> {
  if (sessionAggregatedCounts) {
    return sessionAggregatedCounts;
  }
  const cachedCounts = readMcqStorageCache<AggregatedCounts>('counts');
  if (cachedCounts && Object.keys(cachedCounts.subjectCounts || {}).length > 0) {
    sessionAggregatedCounts = cachedCounts;
    return cachedCounts;
  }
  if (countsFetchPromise) {
    return countsFetchPromise;
  }

  countsFetchPromise = (async () => {
    const sumSubjects: Record<string, number> = {};
    const sumTopics: Record<string, Record<string, number>> = {};
    try {
      const resp = await fetch('/api/questions/health');
      if (resp.ok) {
        const data = await resp.json();
        const rawSubCounts = (data?.bySubject || {}) as Record<string, number>;
        const rawTopCounts = (data?.topicsBySubject || {}) as Record<string, Record<string, number>>;

        for (const [sub, cnt] of Object.entries(rawSubCounts)) {
          const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
          sumSubjects[canonSub] = (sumSubjects[canonSub] || 0) + Number(cnt || 0);
        }

        for (const [sub, topics] of Object.entries(rawTopCounts)) {
          const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
          if (!sumTopics[canonSub]) sumTopics[canonSub] = {};
          for (const [top, cnt] of Object.entries(topics || {})) {
            const canonTop = normalizeTopicName(canonSub, top);
            sumTopics[canonSub][canonTop] = (sumTopics[canonSub][canonTop] || 0) + Number(cnt || 0);
          }
        }

        const banksData = (data?.banks || {}) as Record<string, { total?: number }>;
        for (const src of getBankSources()) {
          const bTotal = Number(banksData[src.id]?.total ?? 0);
          recordSourceSuccess(src.id, 'D1 /api/questions/health', 2, bTotal);
        }
      }
    } catch (err) {
      console.warn('[D1QuestionBank] Failed to load counts from /api/questions/health:', err);
    }

    sessionAggregatedCounts = {
      subjectCounts: sumSubjects,
      topicCounts: sumTopics,
    };
    if (Object.keys(sumSubjects).length > 0) {
      writeMcqStorageCache('counts', sessionAggregatedCounts);
    }
    countsFetchPromise = null;
    return sessionAggregatedCounts;
  })();

  return countsFetchPromise;
}

export async function fetchMultiSourceSubjectTopics(
  subject: string
): Promise<{ name: string; count: number }[]> {
  const norm = findSubjectSlug(subject) || (subject || '').trim().toLowerCase();
  const countsDoc = await getMultiSourceQuestionCounts();
  const subTopics = countsDoc.topicCounts[norm] || {};
  const topicMap = new Map<string, number>();

  const defaultChapters = getChaptersForSubject(norm);
  defaultChapters.forEach((ch) => {
    topicMap.set(ch.name, 0);
  });

  for (const [name, count] of Object.entries(subTopics)) {
    const canonName = normalizeTopicName(norm, name);
    const existing = topicMap.get(canonName) || 0;
    topicMap.set(canonName, existing + Number(count || 0));
  }

  const list: { name: string; count: number }[] = [];
  topicMap.forEach((count, name) => {
    list.push({ name, count });
  });

  return list.sort((a, b) => {
    if (a.count > 0 && b.count === 0) return -1;
    if (a.count === 0 && b.count > 0) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function fetchMultiSourcePoolQuestions(
  subject: string,
  options?: {
    topic?: string;
    difficulty?: string;
    status?: string;
    bank?: string;
    needsReview?: boolean;
    limitPerSource?: number;
  }
): Promise<Question[]> {
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const limitCount = (options?.limitPerSource ?? 50) * 3;
  const params = new URLSearchParams();
  if (normSub && normSub !== 'all') params.set('subject', normSub);
  if (options?.topic && options.topic !== 'all') params.set('topic', options.topic);
  if (options?.difficulty && options.difficulty !== 'all')
    params.set('difficulty', options.difficulty.toLowerCase());
  if (options?.status && options.status !== 'all')
    params.set('status', options.status.toLowerCase());
  if (options?.bank && options.bank !== 'all') params.set('bank', options.bank);
  if (options?.needsReview !== undefined)
    params.set('needs_review', options.needsReview ? '1' : '0');
  params.set('limit', String(Math.min(limitCount, 500)));

  try {
    const headers = await getD1AuthHeaders();
    const resp = await fetch(`/api/questions?${params.toString()}`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      const rawList = Array.isArray(data?.questions) ? data.questions : [];
      return rawList.map((r: Record<string, unknown>) => mapD1RowToQuestion(r));
    }
  } catch (err) {
    console.warn(`[D1QuestionBank] Failed to fetch pool questions for ${normSub}:`, err);
  }
  return [];
}

export async function fetchMultiSourceQuestionsPaginated(filters: {
  subject: string;
  topic?: string;
  search?: string;
  difficulty?: string;
  status?: string;
  bank?: string;
  needsReview?: boolean;
  pageIndex?: number;
  pageSize?: number;
}): Promise<{ questions: Question[]; totalCount: number; hasMore: boolean }> {
  const pageSize = filters.pageSize ?? 20;
  const pageIdx = filters.pageIndex ?? 0;

  const params = new URLSearchParams();
  if (filters.subject && filters.subject !== 'all') {
    params.set('subject', findSubjectSlug(filters.subject) || filters.subject.toLowerCase().trim());
  }
  if (filters.topic && filters.topic !== 'all') {
    params.set('topic', filters.topic);
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    params.set('difficulty', filters.difficulty.toLowerCase());
  }
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status.toLowerCase());
  }
  if (filters.bank && filters.bank !== 'all') {
    params.set('bank', filters.bank);
  }
  if (filters.needsReview !== undefined) {
    params.set('needs_review', filters.needsReview ? '1' : '0');
  }
  if (filters.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  params.set('limit', String(pageSize));
  params.set('offset', String(pageIdx * pageSize));

  try {
    const headers = await getD1AuthHeaders();
    const resp = await fetch(`/api/questions?${params.toString()}`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      const rawList = Array.isArray(data?.questions) ? data.questions : [];
      const questions = rawList.map((r: Record<string, unknown>) => mapD1RowToQuestion(r));
      const totalCount = Number(data?.total ?? questions.length);
      return {
        questions,
        totalCount,
        hasMore: Boolean(data?.hasMore),
      };
    }
  } catch (err) {
    console.warn('[D1QuestionBank] Paginated read failed:', err);
  }
  return { questions: [], totalCount: 0, hasMore: false };
}

export async function fetchMultiSourceQuestionKey(
  compoundId: string,
  _subject?: string
): Promise<{ correct: unknown; explain?: string } | null> {
  const d1Id = toD1QuestionId(compoundId);
  try {
    const headers = await getD1AuthHeaders(true);
    const resp = await fetch('/api/questions/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        questionId: d1Id,
        selectedAnswer: -1,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        correct: data.correct_answer ?? data.correctAnswer ?? 0,
        explain: data.explanation || '',
      };
    }
  } catch (err) {
    console.warn(`[D1QuestionKey] Verify lookup failed for ${d1Id}:`, err);
  }
  return null;
}

export async function saveMultiSourceQuestion(
  _adminEmail: string,
  targetSourceId: string,
  question: {
    id?: string;
    subject: string;
    topic: string;
    text: string;
    options: [string, string, string, string];
    correct: number;
    explain?: string;
    difficulty: QuestionDifficulty;
    status: QuestionStatus;
  }
): Promise<{ id: string; compoundId: string; sourceId: string }> {
  const source = getBankSource(targetSourceId) || getDefaultWriteSource();
  const normSub = findSubjectSlug(question.subject) || question.subject.toLowerCase().trim();
  const qText = (question.text || '').trim();
  const topic = (question.topic || 'General Concepts').trim();

  const isNew = !question.id || question.id.startsWith('q_custom');
  const cHash = await computeContentHash(qText, question.options);
  const d1Id = isNew
    ? `${source.id === 'legacy' ? '' : `${source.id}__`}pool_${normSub}_${cHash.substring(0, 20)}`
    : toD1QuestionId(question.id!);

  const headers = await getD1AuthHeaders(true);
  const payload = {
    id: d1Id,
    bank_id: source.id,
    subject: normSub,
    topic,
    difficulty: question.difficulty,
    status: question.status,
    question_text: qText,
    options: question.options,
    correct_answer: Number(question.correct ?? 0),
    explanation: (question.explain || '').trim(),
  };

  const url = isNew ? '/api/questions' : `/api/questions/${encodeURIComponent(d1Id)}`;
  const method = isNew ? 'POST' : 'PUT';
  const resp = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error || `Failed to save question in D1 (HTTP ${resp.status})`);
  }

  const savedData = await resp.json();
  const savedId = String(savedData?.question?.id || d1Id);
  clearMultiSourceCache();
  clearQuestionsCache();

  return {
    id: savedId,
    compoundId: savedId,
    sourceId: source.id,
  };
}

export async function deleteMultiSourceQuestion(
  _adminEmail: string,
  _subject: string,
  compoundId: string
): Promise<void> {
  const d1Id = toD1QuestionId(compoundId);
  const headers = await getD1AuthHeaders();
  const resp = await fetch(`/api/questions/${encodeURIComponent(d1Id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error || `Failed to delete question from D1 (HTTP ${resp.status})`);
  }
  clearMultiSourceCache();
  clearQuestionsCache();
}

export async function moveMultiSourceQuestionsToTopic(
  _adminEmail: string,
  subject: string,
  compoundIds: string[],
  newTopic: string
): Promise<number> {
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cleanNew = normalizeTopicName(normSub, newTopic);
  const d1Ids = compoundIds.map((cid) => toD1QuestionId(cid)).filter(Boolean);
  if (d1Ids.length === 0) return 0;
  const headers = await getD1AuthHeaders(true);
  const resp = await fetch('/api/questions/batch', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      ids: d1Ids,
      updates: { topic: cleanNew },
    }),
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error || `Failed to move questions in D1 (HTTP ${resp.status})`);
  }
  const data = await resp.json();
  clearMultiSourceCache();
  clearQuestionsCache();
  return Number(data?.updatedCount ?? d1Ids.length);
}

export async function batchImportMultiSourceQuestions(
  _adminEmail: string,
  targetSourceId: string,
  targetSubject: string,
  defaultTopic: string,
  rawRows: Array<Record<string, unknown>>,
  onProgress?: (done: number, total: number) => void
): Promise<{ imported: number; duplicatesSkipped: number; errors: string[] }> {
  const result = {
    imported: 0,
    duplicatesSkipped: 0,
    errors: [] as string[],
  };

  const source = getBankSource(targetSourceId) || getDefaultWriteSource();
  const normSub = findSubjectSlug(targetSubject) || targetSubject.toLowerCase().trim();

  const existingHashesBySubject = new Map<string, Set<string>>();
  const getSubjectHashes = async (sub: string) => {
    if (!existingHashesBySubject.has(sub)) {
      const set = new Set<string>();
      const ids = await getMultiSourceSubjectQuestionIds(sub);
      ids.forEach((cid) => {
        const { docId } = parseQuestionCompoundId(cid);
        set.add(docId);
      });
      existingHashesBySubject.set(sub, set);
    }
    return existingHashesBySubject.get(sub)!;
  };

  const validItems: Array<{
    docId: string;
    subject: string;
    topic: string;
    difficulty: QuestionDifficulty;
    status: QuestionStatus;
    text: string;
    options: [string, string, string, string];
    correct: number;
    explain: string;
  }> = [];

  for (const row of rawRows) {
    const qText = (
      row.text || row.q || row.question || row.stem
        ? String(row.text || row.q || row.question || row.stem)
        : ''
    ).trim();

    const rowSubjectRaw =
      row.subject || row.Subject || row.SUBJECT || row.course || row.discipline;
    const rowSub = (rowSubjectRaw ? findSubjectSlug(String(rowSubjectRaw)) : null) || normSub;

    const rawTopic = String(row.topic || row.chapter || defaultTopic || 'General Concepts');
    const rowTopic = normalizeTopicName(rowSub, rawTopic);

    let options: [string, string, string, string] = ['', '', '', ''];
    if (Array.isArray(row.options) && row.options.length >= 4) {
      options = [
        String(row.options[0] || ''),
        String(row.options[1] || ''),
        String(row.options[2] || ''),
        String(row.options[3] || ''),
      ];
    } else {
      const optA = String(row.optionA || row.option_a || row.opt1 || row.a || '').trim();
      const optB = String(row.optionB || row.option_b || row.opt2 || row.b || '').trim();
      const optC = String(row.optionC || row.option_c || row.opt3 || row.c || '').trim();
      const optD = String(row.optionD || row.option_d || row.opt4 || row.d || '').trim();
      options = [optA, optB, optC, optD];
    }

    if (!qText || options.some((o) => !o.trim())) {
      result.errors.push('Row skipped: empty stem or options.');
      continue;
    }

    const cHash = await computeContentHash(qText, options);
    const docId = `pool_${rowSub}_${cHash.substring(0, 20)}`;

    const subjectHashes = await getSubjectHashes(rowSub);
    if (subjectHashes.has(docId)) {
      result.duplicatesSkipped++;
      continue;
    }
    subjectHashes.add(docId);

    let correctIdx = 0;
    const rawCorrect =
      row.correct !== undefined
        ? row.correct
        : row.correctAnswer !== undefined
        ? row.correctAnswer
        : row.answer;
    if (typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect <= 3) {
      correctIdx = rawCorrect;
    } else if (typeof rawCorrect === 'string') {
      const upper = rawCorrect.trim().toUpperCase();
      if (upper === 'A' || upper === '0') correctIdx = 0;
      else if (upper === 'B' || upper === '1') correctIdx = 1;
      else if (upper === 'C' || upper === '2') correctIdx = 2;
      else if (upper === 'D' || upper === '3') correctIdx = 3;
    }

    const explain = String(row.explain || row.explanation || '').trim();
    const diff = String(row.difficulty || 'medium').toLowerCase() as QuestionDifficulty;
    const status = String(row.status || 'published').toLowerCase() as QuestionStatus;

    validItems.push({
      docId,
      subject: rowSub,
      topic: rowTopic,
      difficulty: diff,
      status,
      text: qText,
      options,
      correct: correctIdx,
      explain,
    });
  }

  const chunkSize = 100;
  const headers = await getD1AuthHeaders(true);
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const d1Questions = chunk.map((item) => ({
      id: source.id === 'legacy' ? item.docId : `${source.id}__${item.docId}`,
      bank_id: source.id,
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      status: item.status,
      question_text: item.text,
      options: item.options,
      correct_answer: item.correct,
      explanation: item.explain,
    }));
    const resp = await fetch('/api/questions/batch', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bank_id: source.id,
        questions: d1Questions,
      }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      result.errors.push(errData?.error || `D1 batch import failed (HTTP ${resp.status})`);
    } else {
      result.imported += chunk.length;
      if (onProgress) onProgress(result.imported, validItems.length);
    }
  }
  clearMultiSourceCache();
  clearQuestionsCache();
  return result;
}

export interface MisfiledQuestionCandidate {
  id: string;
  docId: string;
  sourceId: string;
  currentPoolSubject: string;
  proposedSubject: string;
  stem: string;
  topic: string;
  reason: string;
}

export interface FixMisfiledResult {
  fixedCount: number;
  fixed: Array<{
    id: string;
    oldSubject: string;
    newSubject: string;
    stem: string;
    reason: string;
  }>;
}

export async function scanMisfiledQuestions(): Promise<MisfiledQuestionCandidate[]> {
  const candidates: MisfiledQuestionCandidate[] = [];
  const englishRegex =
    /\b(obfuscate|synonym|antonym|closest in meaning|meaning of the word|correct preposition|preposition|grammatically correct|correct spelling|idiom|vocabulary|passive voice|direct speech|conjunction)\b/i;
  const physicsRegex =
    /\b(mercury droplet|surface tension|terminal velocity|capacitance|acceleration due to gravity|magnetic field|magnetic flux|electric potential|carnot engine|half-life|refractive index|projectile motion|coulomb's law|coulomb|isothermal|adiabatic|kinetic energy of|momentum of a|angstrom|diffraction grating)\b/i;
  const chemistryRegex =
    /\b(molarity|molality|periodic table|oxidation state|electronegativity|hydrocarbon|alkene|alkane|alkyne|chemical equilibrium|buffer solution|atomic radius|ionization energy|avogadro|stoichiometry)\b/i;

  try {
    const headers = await getD1AuthHeaders();
    const resp = await fetch('/api/questions?limit=1000', { headers });
    if (resp.ok) {
      const data = await resp.json();
      const list = Array.isArray(data?.questions) ? data.questions : [];
      for (const q of list) {
        const poolSub = String(q.subject || 'mathematics');
        const stem = String(q.question_text || q.questionText || '');
        const rawTopic = String(q.topic || '');
        let proposedSub: string | null = null;
        let reason = '';
        if (poolSub === 'mathematics') {
          if (englishRegex.test(stem) || englishRegex.test(rawTopic)) {
            proposedSub = 'english';
            reason = 'English vocabulary/grammar terms misfiled in mathematics pool';
          } else if (physicsRegex.test(stem) || physicsRegex.test(rawTopic)) {
            proposedSub = 'physics';
            reason = 'Physics concepts misfiled in mathematics pool';
          } else if (chemistryRegex.test(stem) || chemistryRegex.test(rawTopic)) {
            proposedSub = 'chemistry';
            reason = 'Chemistry concepts misfiled in mathematics pool';
          }
        }
        if (proposedSub && proposedSub !== poolSub) {
          candidates.push({
            id: String(q.id),
            docId: String(q.id),
            sourceId: String(q.bank_id || 'legacy'),
            currentPoolSubject: poolSub,
            proposedSubject: proposedSub,
            stem: stem.slice(0, 120),
            topic: rawTopic,
            reason,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[scanMisfiledQuestions] D1 scan error:', err);
  }
  return candidates;
}

export async function fixMisfiledQuestions(
  candidates: MisfiledQuestionCandidate[],
  _adminEmail: string
): Promise<FixMisfiledResult> {
  const fixed: FixMisfiledResult['fixed'] = [];
  const headers = await getD1AuthHeaders(true);
  for (const item of candidates) {
    const d1Id = toD1QuestionId(item.id);
    const resp = await fetch('/api/questions/batch', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ids: [d1Id],
        updates: { subject: item.proposedSubject },
      }),
    });
    if (resp.ok) {
      fixed.push({
        id: item.id,
        oldSubject: item.currentPoolSubject,
        newSubject: item.proposedSubject,
        stem: item.stem,
        reason: item.reason,
      });
    }
  }
  clearMultiSourceCache();
  clearQuestionsCache();
  return { fixedCount: fixed.length, fixed };
}

export interface RebuildCountsResult {
  before: {
    totalQuestions: number;
    subjectCounts: Record<string, number>;
    bankBreakdown: Record<string, number>;
  };
  after: {
    totalQuestions: number;
    subjectCounts: Record<string, number>;
    bankBreakdown: Record<string, number>;
  };
  details: string[];
}

export async function rebuildCountsAndIndex(_adminEmail: string): Promise<RebuildCountsResult> {
  const beforeDoc = await getMultiSourceQuestionCounts();
  const beforeSubCounts = { ...beforeDoc.subjectCounts };
  const beforeTotal = Object.values(beforeSubCounts).reduce((a, b) => a + b, 0);

  clearMultiSourceCache();
  clearQuestionsCache();

  const resp = await fetch('/api/questions/health');
  const data = resp.ok ? await resp.json() : {};
  const banks = (data?.banks || {}) as Record<
    string,
    { label?: string; total?: number; lastImportAt?: string }
  >;
  const bankBreakdown: Record<string, number> = {
    legacy: Number(banks.legacy?.total ?? 0),
    bank1: Number(banks.bank1?.total ?? 0),
    bank2: Number(banks.bank2?.total ?? 0),
  };
  const afterDoc = await getMultiSourceQuestionCounts();
  const afterSubCounts = { ...afterDoc.subjectCounts };
  const afterTotal = Object.values(afterSubCounts).reduce((a, b) => a + b, 0);

  const details = ['legacy', 'bank1', 'bank2'].map((bId) => {
    const b = banks[bId] || {};
    return `${b.label || bId}: ${b.total ?? 0} questions in D1 (last import: ${
      b.lastImportAt || 'N/A'
    })`;
  });

  return {
    before: {
      totalQuestions: beforeTotal || afterTotal,
      subjectCounts: Object.keys(beforeSubCounts).length > 0 ? beforeSubCounts : afterSubCounts,
      bankBreakdown,
    },
    after: {
      totalQuestions: afterTotal,
      subjectCounts: afterSubCounts,
      bankBreakdown,
    },
    details,
  };
}
