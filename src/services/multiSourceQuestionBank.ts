import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
  documentId,
  increment,
  arrayUnion,
  arrayRemove,
  getCountFromServer,
  type QueryConstraint,
} from 'firebase/firestore';
import {
  ENABLE_MULTI_SOURCE_BANK,
  USE_FIRESTORE_QUESTION_READER,
  getBankSources,
  getBankSource,
  getDefaultWriteSource,
  recordSourceFailure,
  recordSourceSuccess,
} from '@/config/questionBankSources';
import { auth } from '@/lib/firebase';

export { ENABLE_MULTI_SOURCE_BANK, USE_FIRESTORE_QUESTION_READER };
import {
  getSubjectPoolCollection,
  computeContentHash,
  getChaptersForSubject,
  findSubjectSlug,
  normalizeTopicName,
  formatSubjectName,
} from '@/constants/taxonomy';
import type { Question, QuestionDifficulty, QuestionStatus } from '@/types';
import { clearQuestionsCache } from './adminService';

// ─── COMPOUND ID HELPERS ────────────────────────────────────────────────────
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

export function formatQuestionCompoundId(sourceId: string, docId: string): string {
  if (!ENABLE_MULTI_SOURCE_BANK) {
    return docId;
  }
  if (!USE_FIRESTORE_QUESTION_READER) {
    return docId;
  }
  if (docId.startsWith(`${sourceId}:`)) return docId;
  return `${sourceId}:${docId}`;
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

export function mapD1RowToQuestion(raw: Record<string, any>): Question {
  const qText = String(raw.question_text ?? raw.questionText ?? raw.q ?? raw.question ?? '');
  let opts: string[] = [];
  if (Array.isArray(raw.options)) {
    opts = raw.options.map((o: any) => String(o ?? ''));
  } else if (typeof raw.options_json === 'string') {
    try {
      const parsed = JSON.parse(raw.options_json);
      if (Array.isArray(parsed)) opts = parsed.map((o: any) => String(o ?? ''));
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

  (mapped as any).bank_id = bankId;
  (mapped as any).needs_review = Number(raw.needs_review ?? (raw.needsReview ? 1 : 0));
  (mapped as any).needsReview = Boolean(raw.needs_review || raw.needsReview);
  (mapped as any).source_path = String(raw.source_path || '');
  return mapped;
}

// ─── NORMALIZED QUESTION TEXT & HASHING ──────────────────────────────────────
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

// ─── SESSION & VERSIONED LOCALSTORAGE CACHES ────────────────────────────────
export const MCQ_CACHE_VERSION = 'v3_d1';
const MCQ_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AggregatedCounts {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
}

let sessionAggregatedCounts: AggregatedCounts | null = null;
let countsFetchPromise: Promise<AggregatedCounts> | null = null;
const sourceIndexCache = new Map<string, Map<string, string[]>>(); // sourceId -> subject -> raw docIds
const multiSourcePageCache = new Map<string, { questions: Question[]; hasMore: boolean }>();

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
  sourceIndexCache.clear();
  multiSourcePageCache.clear();
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

// ─── 4. MULTI-SOURCE QUESTION INDEX (DRILLS & SPRINTS) ───────────────────────
/**
 * Reads question IDs for a subject from Cloudflare D1 (`/api/questions/ids`) by default,
 * or falls back to `question_index/<subject>` in Firestore if `USE_FIRESTORE_QUESTION_READER` is enabled.
 */
export async function getMultiSourceSubjectQuestionIds(subject: string): Promise<string[]> {
  const norm = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cachedIds = readMcqStorageCache<string[]>(`idx_${norm}`);
  if (cachedIds && cachedIds.length > 0) {
    return cachedIds;
  }

  if (!USE_FIRESTORE_QUESTION_READER) {
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

  const sources = getBankSources();
  const compoundIds: string[] = [];

  await Promise.all(
    sources.map(async (source) => {
      // Check session cache for this source & subject
      const srcCache = sourceIndexCache.get(source.id);
      if (srcCache && srcCache.has(norm)) {
        const cachedRawIds = srcCache.get(norm)!;
        cachedRawIds.forEach((rawId) => compoundIds.push(formatQuestionCompoundId(source.id, rawId)));
        return;
      }

      try {
        let rawIds: string[] = [];

        // 1. Try reading standard question_index/<subject>
        const indexRef = doc(source.db, 'question_index', norm);
        const snap = await getDoc(indexRef);

        if (snap.exists()) {
          const data = snap.data();
          rawIds = Array.isArray(data.ids) ? data.ids : [];
        } else if (source.id === 'legacy') {
          // Fallback for legacy: stats/questionIndex_<subject>
          const legacyStatsRef = doc(source.db, 'stats', `questionIndex_${norm}`);
          const legacySnap = await getDoc(legacyStatsRef);
          if (legacySnap.exists()) {
            const data = legacySnap.data();
            rawIds = Array.isArray(data.ids) ? data.ids : [];
          }
        }

        // If index doc does not exist yet on this source, query a bounded batch of IDs (never the whole collection)
        if (rawIds.length === 0) {
          const targetColl = getSubjectPoolCollection(norm);
          const subVariants = Array.from(new Set([norm, formatSubjectName(norm), norm.toLowerCase(), norm.toUpperCase()]));
          try {
            const poolSnap = await getDocs(
              query(collection(source.db, targetColl), limit(250))
            );
            if (!poolSnap.empty) {
              rawIds = poolSnap.docs.map((d) => d.id);
            }
            if (source.id === 'legacy' || source.id === 'bank1') {
              const legacySnap = await getDocs(
                query(
                  collection(source.db, 'questions'),
                  where('subject', 'in', subVariants),
                  limit(250)
                )
              );
              legacySnap.docs.forEach((d) => {
                if (!rawIds.includes(d.id)) {
                  rawIds.push(d.id);
                }
              });
            }
            if (rawIds.length > 0) {
              setDoc(indexRef, { subject: norm, ids: rawIds, updatedAt: serverTimestamp() }, { merge: true }).catch(
                () => {}
              );
            }
          } catch {
            // Non-fatal fallback
          }
        }

        // Cache for this source
        if (!sourceIndexCache.has(source.id)) {
          sourceIndexCache.set(source.id, new Map());
        }
        sourceIndexCache.get(source.id)!.set(norm, rawIds);

        recordSourceSuccess(source.id, `reading question_index/${norm}`);
        rawIds.forEach((rawId) => compoundIds.push(formatQuestionCompoundId(source.id, rawId)));
      } catch (err) {
        recordSourceFailure(source.id, err, `reading question_index/${norm}`);
        // Continue serving other sources
      }
    })
  );

  const uniqueIds = Array.from(new Set(compoundIds));
  if (uniqueIds.length > 0) {
    writeMcqStorageCache(`idx_${norm}`, uniqueIds);
  }
  return uniqueIds;
}

/**
 * Fetches ONLY the questions for the given compound IDs from their respective sources.
 * Never reads an entire pool.
 */
export async function fetchMultiSourceQuestionsByIds(
  compoundIds: string[],
  subject?: string
): Promise<Question[]> {
  if (!compoundIds || compoundIds.length === 0) return [];

  if (!USE_FIRESTORE_QUESTION_READER) {
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
          list.forEach((raw: Record<string, any>) => {
            collected.push(mapD1RowToQuestion(raw));
          });
        }
      } catch (err) {
        console.warn('[D1QuestionBank] Failed to fetch questions by IDs:', err);
      }
    }
    return collected;
  }

  const normSub = (subject || 'mathematics').toLowerCase().trim();
  const poolColl = getSubjectPoolCollection(normSub);

  // Group raw IDs by sourceId
  const bySource = new Map<string, string[]>();
  compoundIds.forEach((cid) => {
    const { sourceId, docId } = parseQuestionCompoundId(cid);
    if (!bySource.has(sourceId)) bySource.set(sourceId, []);
    bySource.get(sourceId)!.push(docId);
  });

  const collectedQuestions: Question[] = [];

  await Promise.all(
    Array.from(bySource.entries()).map(async ([sourceId, rawIds]) => {
      const source = getBankSource(sourceId);
      if (!source) return;

      const chunkSize = 30;
      for (let i = 0; i < rawIds.length; i += chunkSize) {
        const chunk = rawIds.slice(i, i + chunkSize);
        try {
          // 1. Fetch from subject pool
          const poolSnap = await getDocs(
            query(collection(source.db, poolColl), where(documentId(), 'in', chunk))
          );

          const foundDocIds = new Set<string>();

          poolSnap.docs.forEach((d) => {
            foundDocIds.add(d.id);
            const data = d.data();
            const qText = data.text || data.q || data.question || '';
            const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
            collectedQuestions.push({
              id: formatQuestionCompoundId(source.id, d.id),
              sourceId: source.id,
              subject: data.subject || normSub,
              chapter: data.topic || data.chapter || 'general',
              topic: data.topic || data.chapter || 'general',
              difficulty: (data.difficulty || 'medium').toLowerCase() as QuestionDifficulty,
              q: qText,
              question: qText,
              stem: qText,
              options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
              tags: Array.isArray(data.tags) ? data.tags : ['entrance'],
              status: (data.status || 'published').toLowerCase() as QuestionStatus,
              active: data.active !== false,
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
            } as Question);
          });

          // 2. If some missing and this is legacy, check old main questions collection
          const missing = chunk.filter((id) => !foundDocIds.has(id));
          if (missing.length > 0 && source.id === 'legacy') {
            try {
              const mainSnap = await getDocs(
                query(collection(source.db, 'questions'), where(documentId(), 'in', missing))
              );
              mainSnap.docs.forEach((d) => {
                const data = d.data();
                const qText = data.text || data.q || data.question || '';
                const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
                collectedQuestions.push({
                  id: formatQuestionCompoundId(source.id, d.id),
                  sourceId: source.id,
                  subject: data.subject || normSub,
                  chapter: data.chapter || data.topic || 'general',
                  topic: data.topic || data.chapter || 'general',
                  difficulty: (data.difficulty || 'medium').toLowerCase() as QuestionDifficulty,
                  q: qText,
                  question: qText,
                  stem: qText,
                  options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
                  tags: Array.isArray(data.tags) ? data.tags : ['entrance'],
                  status: (data.status || 'published').toLowerCase() as QuestionStatus,
                  active: data.active !== false,
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
                } as Question);
              });
            } catch {
              // Ignore fallback error
            }
          }

          recordSourceSuccess(source.id);
        } catch (err) {
          recordSourceFailure(source.id, err);
        }
      }
    })
  );

  return collectedQuestions;
}

// ─── 5. MULTI-SOURCE COUNTS (SUM OF stats/questionCounts) ───────────────────
/**
 * Sums subjectCounts and topicCounts across all working sources' stats/questionCounts documents.
 * Correctly parses both nested map structures and flat dotted keys.
 */
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
    if (!USE_FIRESTORE_QUESTION_READER) {
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
    }

    const sources = getBankSources();
    const sumSubjects: Record<string, number> = {};
    const sumTopics: Record<string, Record<string, number>> = {};

    await Promise.all(
      sources.map(async (source) => {
        try {
          const statsRef = doc(source.db, 'stats', 'questionCounts');
          const snap = await getDoc(statsRef);
          let srcCount = 0;

          if (snap.exists()) {
            const data = snap.data();
            const subCounts = (data.subjectCounts || {}) as Record<string, number>;
            const topCounts = (data.topicCounts || {}) as Record<string, Record<string, number>>;

            // 1. Process nested subjectCounts
            for (const [sub, cnt] of Object.entries(subCounts)) {
              const n = Number(cnt || 0);
              const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
              sumSubjects[canonSub] = (sumSubjects[canonSub] || 0) + n;
              srcCount += n;
            }

            // 2. Process nested topicCounts with normalization
            for (const [sub, topics] of Object.entries(topCounts)) {
              const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
              if (!sumTopics[canonSub]) sumTopics[canonSub] = {};
              for (const [top, cnt] of Object.entries(topics || {})) {
                const canonTop = normalizeTopicName(canonSub, top);
                sumTopics[canonSub][canonTop] = (sumTopics[canonSub][canonTop] || 0) + Number(cnt || 0);
              }
            }

            // 3. Fallback: unpack any flat dotted keys from previous migrations e.g. "topicCounts.mathematics.Calculus"
            for (const [k, v] of Object.entries(data)) {
              if (k.startsWith('topicCounts.') && typeof v === 'number') {
                const parts = k.split('.');
                if (parts.length >= 3) {
                  const sub = parts[1];
                  const top = parts.slice(2).join('.');
                  const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
                  const canonTop = normalizeTopicName(canonSub, top);
                  if (!sumTopics[canonSub]) sumTopics[canonSub] = {};
                  // Only add if not already captured in nested map
                  if (!topCounts[sub]?.[top]) {
                    sumTopics[canonSub][canonTop] = (sumTopics[canonSub][canonTop] || 0) + Number(v || 0);
                  }
                }
              } else if (k.startsWith('subjectCounts.') && typeof v === 'number') {
                const sub = k.split('.')[1];
                const canonSub = findSubjectSlug(sub) || sub.toLowerCase().trim();
                if (!subCounts[sub]) {
                  sumSubjects[canonSub] = (sumSubjects[canonSub] || 0) + Number(v || 0);
                }
              }
            }

            recordSourceSuccess(source.id, 'reading stats/questionCounts', undefined, srcCount);
          } else {
            recordSourceSuccess(
              source.id,
              'reading stats/questionCounts (empty)',
              undefined,
              0
            );
          }
        } catch (err) {
          recordSourceFailure(source.id, err, 'reading stats/questionCounts');
        }
      })
    );

    sessionAggregatedCounts = {
      subjectCounts: sumSubjects,
      topicCounts: sumTopics,
    };
    if (Object.keys(sumSubjects).length > 0) {
      writeMcqStorageCache('counts', sessionAggregatedCounts);
    }
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

  // 1. Seed all default taxonomy chapters for this subject (starting at count 0)
  const defaultChapters = getChaptersForSubject(norm);
  defaultChapters.forEach((ch) => {
    topicMap.set(ch.name, 0);
  });

  // 2. Add or update counts from database stats (using normalized topic names)
  for (const [name, count] of Object.entries(subTopics)) {
    const canonName = normalizeTopicName(norm, name);
    const existing = topicMap.get(canonName) || 0;
    topicMap.set(canonName, existing + Number(count || 0));
  }

  // 3. Convert to array
  const list: { name: string; count: number }[] = [];
  topicMap.forEach((count, name) => {
    list.push({ name, count });
  });

  // Sort: topics with questions first, then canonical default chapters
  return list.sort((a, b) => {
    if (a.count > 0 && b.count === 0) return -1;
    if (a.count === 0 && b.count > 0) return 1;
    return a.name.localeCompare(b.name);
  });
}


// ─── 2. READ SUBJECT POOL (MERGED & DEDUPLICATED BY HASH) ────────────────────
/**
 * Reads questions for a subject from every source (questions_<subject> + legacy main questions).
 * Merges results and removes duplicates by a hash of the normalized question text.
 */
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

  if (!USE_FIRESTORE_QUESTION_READER) {
    const limitCount = (options?.limitPerSource ?? 50) * 3;
    const params = new URLSearchParams();
    if (normSub && normSub !== 'all') params.set('subject', normSub);
    if (options?.topic && options.topic !== 'all') params.set('topic', options.topic);
    if (options?.difficulty && options.difficulty !== 'all') params.set('difficulty', options.difficulty.toLowerCase());
    if (options?.status && options.status !== 'all') params.set('status', options.status.toLowerCase());
    if (options?.bank && options.bank !== 'all') params.set('bank', options.bank);
    if (options?.needsReview !== undefined) params.set('needs_review', options.needsReview ? '1' : '0');
    params.set('limit', String(Math.min(limitCount, 500)));

    try {
      const headers = await getD1AuthHeaders();
      const resp = await fetch(`/api/questions?${params.toString()}`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        const rawList = Array.isArray(data?.questions) ? data.questions : [];
        return rawList.map((r: Record<string, any>) => mapD1RowToQuestion(r));
      }
    } catch (err) {
      console.warn(`[D1QuestionBank] Failed to fetch pool questions for ${normSub}:`, err);
    }
    return [];
  }

  const poolColl = getSubjectPoolCollection(normSub);
  const limitCount = options?.limitPerSource ?? 40;
  const storageCacheKey = `pool_${normSub}_${options?.topic || 'all'}_${options?.difficulty || 'all'}_${options?.status || 'all'}_${limitCount}`;
  const cachedPool = readMcqStorageCache<Question[]>(storageCacheKey);
  if (cachedPool && cachedPool.length > 0) {
    return cachedPool;
  }
  const sources = getBankSources();

  const allRawQuestions: Question[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        // Query pool collection per-chapter when topic is specified so we never read the whole collection
        const qConstraints: QueryConstraint[] = [limit(limitCount)];
        if (options?.topic && options.topic !== 'all') {
          qConstraints.unshift(where('topic', '==', options.topic));
        }
        if (options?.difficulty && options.difficulty !== 'all') {
          qConstraints.unshift(where('difficulty', '==', options.difficulty.toLowerCase()));
        }
        if (options?.status && options.status !== 'all') {
          qConstraints.unshift(where('status', '==', options.status.toLowerCase()));
        }

        let poolSnap = await getDocs(query(collection(source.db, poolColl), ...qConstraints));
        if (poolSnap.empty && options?.topic && options.topic !== 'all') {
          // Fallback if documents use 'chapter' field instead of 'topic'
          const fallbackConstraints: QueryConstraint[] = [limit(limitCount)];
          if (options?.difficulty && options.difficulty !== 'all') {
            fallbackConstraints.unshift(where('difficulty', '==', options.difficulty.toLowerCase()));
          }
          poolSnap = await getDocs(query(collection(source.db, poolColl), ...fallbackConstraints));
        }

        poolSnap.docs.forEach((d) => {
          const data = d.data();
          const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
          const qText = data.text || data.q || data.question || '';
          allRawQuestions.push({
            id: formatQuestionCompoundId(source.id, d.id),
            sourceId: source.id,
            subject: data.subject || normSub,
            chapter: data.topic || data.chapter || 'general',
            topic: data.topic || data.chapter || 'general',
            difficulty: (data.difficulty || 'medium').toLowerCase() as QuestionDifficulty,
            status: (data.status || 'published').toLowerCase() as QuestionStatus,
            active: data.active !== false,
            q: qText,
            question: qText,
            stem: qText,
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
          } as Question);
        });

        // For legacy source, also read from old main questions collection filtered by subject
        if (source.id === 'legacy') {
          try {
            const legacyConstraints = [where('subject', '==', normSub), limit(limitCount)];
            const legacySnap = await getDocs(query(collection(source.db, 'questions'), ...legacyConstraints));
            legacySnap.docs.forEach((d) => {
              const data = d.data();
              const rawOpts = Array.isArray(data.options) ? data.options : ['', '', '', ''];
              const qText = data.text || data.q || data.question || '';
              allRawQuestions.push({
                id: formatQuestionCompoundId(source.id, d.id),
                sourceId: source.id,
                subject: data.subject || normSub,
                chapter: data.chapter || data.topic || 'general',
                topic: data.topic || data.chapter || 'general',
                difficulty: (data.difficulty || 'medium').toLowerCase() as QuestionDifficulty,
                status: (data.status || 'published').toLowerCase() as QuestionStatus,
                active: data.active !== false,
                q: qText,
                question: qText,
                stem: qText,
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
              } as Question);
            });
          } catch {
            // Ignore legacy main questions error
          }
        }

        recordSourceSuccess(source.id, `querying ${poolColl}`);
      } catch (err) {
        recordSourceFailure(source.id, err, `querying ${poolColl}`);
      }
    })
  );

  // Filter by topic if specified
  let filtered = allRawQuestions;
  if (options?.topic && options.topic !== 'all') {
    filtered = filtered.filter((q) => (q.topic || q.chapter) === options.topic);
  }

  // Deduplicate across sources using normalized question text hash
  const seenHashes = new Set<string>();
  const deduplicated: Question[] = [];

  for (const q of filtered) {
    const text = q.q || q.question || q.stem || '';
    const hash = hashNormalizedQuestionText(text);
    if (!seenHashes.has(hash)) {
      seenHashes.add(hash);
      deduplicated.push(q);
    }
  }

  if (deduplicated.length > 0) {
    writeMcqStorageCache(storageCacheKey, deduplicated);
  }
  return deduplicated;
}

// ─── 11. PAGINATED READ FOR ADMIN (20 AT A TIME, SESSION CACHED) ───────────
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

  if (!USE_FIRESTORE_QUESTION_READER) {
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
        const questions = rawList.map((r: Record<string, any>) => mapD1RowToQuestion(r));
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

  const cacheKey = `${filters.subject}__${filters.topic || 'all'}__${filters.difficulty || 'all'}__${filters.status || 'all'}`;

  let poolQuestions: Question[];
  if (multiSourcePageCache.has(cacheKey)) {
    poolQuestions = multiSourcePageCache.get(cacheKey)!.questions;
  } else {
    poolQuestions = await fetchMultiSourcePoolQuestions(filters.subject, {
      topic: filters.topic,
      difficulty: filters.difficulty,
      status: filters.status,
      limitPerSource: 80,
    });
    multiSourcePageCache.set(cacheKey, { questions: poolQuestions, hasMore: poolQuestions.length > pageSize });
  }

  // Filter in memory for search query
  let resultList = poolQuestions;
  if (filters.search && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    resultList = resultList.filter(
      (q) =>
        (q.q || q.question || '').toLowerCase().includes(term) ||
        (q.topic || q.chapter || '').toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term) ||
        q.options.some((o) => o.toLowerCase().includes(term))
    );
  }

  const start = pageIdx * pageSize;
  const end = start + pageSize;
  const paged = resultList.slice(start, end);

  return {
    questions: paged,
    totalCount: resultList.length,
    hasMore: end < resultList.length,
  };
}

// ─── SECRET KEY LOOKUP (FOR TEST EVALUATION) ────────────────────────────────
export async function fetchMultiSourceQuestionKey(
  compoundId: string,
  subject?: string
): Promise<{ correct: unknown; explain?: string } | null> {
  if (!USE_FIRESTORE_QUESTION_READER) {
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

  const { sourceId, docId } = parseQuestionCompoundId(compoundId);
  const source = getBankSource(sourceId) || getDefaultWriteSource();

  try {
    // 1. Check pool collection on this source
    if (subject) {
      const poolColl = getSubjectPoolCollection(subject);
      const poolSnap = await getDoc(doc(source.db, poolColl, docId));
      if (poolSnap.exists()) {
        const data = poolSnap.data();
        if (data.correct !== undefined || data.correctAnswer !== undefined) {
          return {
            correct: data.correct !== undefined ? data.correct : data.correctAnswer,
            explain: data.explain || data.explanation || '',
          };
        }
      }
    }

    // 2. Check questionKeys collection on this source
    const keySnap = await getDoc(doc(source.db, 'questionKeys', docId));
    if (keySnap.exists()) {
      const data = keySnap.data();
      return {
        correct: data.correct !== undefined ? data.correct : data.correctAnswer,
        explain: data.explain || data.explanation || '',
      };
    }

    // 3. Check questions collection on this source
    const qSnap = await getDoc(doc(source.db, 'questions', docId));
    if (qSnap.exists()) {
      const data = qSnap.data();
      if (data.correct !== undefined || data.correctAnswer !== undefined) {
        return {
          correct: data.correct !== undefined ? data.correct : data.correctAnswer,
          explain: data.explain || data.explanation || '',
        };
      }
    }
  } catch (err) {
    console.warn(`[MultiSourceKey] Lookup failed for ${compoundId}:`, err);
  }

  return null;
}

// ─── 7, 8. MULTI-SOURCE WRITING (SAVE, IMPORT, EDIT, MOVE, DELETE) ───────────
/**
 * Saves MCQ to the specified bank source's subject pool (`questions_<subject>`).
 * Checks for duplicates against ALL sources using normalized question text hash.
 */
export async function saveMultiSourceQuestion(
  adminEmail: string,
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

  if (!USE_FIRESTORE_QUESTION_READER) {
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

  const collName = getSubjectPoolCollection(normSub);

  // Content hash & normalized text hash
  const cHash = await computeContentHash(qText, question.options);
  const textHash = hashNormalizedQuestionText(qText);

  // Check duplicate across ALL sources if adding a new question
  const isNew = !question.id || question.id.startsWith('q_custom');
  if (isNew) {
    const existingPool = await fetchMultiSourcePoolQuestions(normSub, { limitPerSource: 100 });
    const isDuplicate = existingPool.some(
      (existing) => hashNormalizedQuestionText(existing.q || existing.question || '') === textHash
    );
    if (isDuplicate) {
      throw new Error(`Duplicate question detected: this question already exists in the question bank.`);
    }
  }

  const { docId: cleanDocId } = parseQuestionCompoundId(question.id || '');
  const finalDocId =
    cleanDocId && !cleanDocId.startsWith('q_custom')
      ? cleanDocId
      : `pool_${normSub}_${cHash.substring(0, 20)}`;

  // If editing an existing question, inspect old topic to update counts accurately
  let oldTopic: string | null = null;
  if (!isNew) {
    try {
      const existingSnap = await getDoc(doc(source.db, collName, finalDocId));
      if (existingSnap.exists()) {
        const exData = existingSnap.data();
        oldTopic = normalizeTopicName(normSub, exData.topic || exData.chapter || '');
      }
    } catch {
      // Non-fatal
    }
  }

  const docData: Record<string, unknown> = {
    id: finalDocId,
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

  if (isNew) {
    docData.createdAt = serverTimestamp();
  }

  // Ensure stats/questionCounts document exists so batch update succeeds safely
  const statsRef = doc(source.db, 'stats', 'questionCounts');
  const indexRef = doc(source.db, 'question_index', normSub);
  const poolDocRef = doc(source.db, collName, finalDocId);
  const keyDocRef = doc(source.db, 'questionKeys', finalDocId);

  // Execute question write, key write, question_index, and stats/questionCounts in the SAME BATCH
  const batch = writeBatch(source.db);

  // 1. Write question doc
  batch.set(poolDocRef, docData, { merge: true });

  // 2. Write key doc
  batch.set(
    keyDocRef,
    {
      id: finalDocId,
      correct: question.correct,
      explain: (question.explain || '').trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Update question_index and stats/questionCounts in same batch
  if (isNew) {
    batch.set(
      indexRef,
      {
        subject: normSub,
        ids: arrayUnion(finalDocId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      statsRef,
      {
        [`subjectCounts.${normSub}`]: increment(1),
        [`topicCounts.${normSub}.${topic}`]: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else if (oldTopic && oldTopic !== topic) {
    // Topic changed on edit: adjust counts
    batch.set(
      statsRef,
      {
        [`topicCounts.${normSub}.${oldTopic}`]: increment(-1),
        [`topicCounts.${normSub}.${topic}`]: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  clearMultiSourceCache();

  return {
    id: finalDocId,
    compoundId: formatQuestionCompoundId(source.id, finalDocId),
    sourceId: source.id,
  };
}

/**
 * Deletes question from the specific source it came from, updating question_index and stats in the SAME BATCH.
 */
export async function deleteMultiSourceQuestion(
  _adminEmail: string,
  subject: string,
  compoundId: string
): Promise<void> {
  if (!USE_FIRESTORE_QUESTION_READER) {
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
    return;
  }

  const { sourceId, docId } = parseQuestionCompoundId(compoundId);
  const source = getBankSource(sourceId) || getDefaultWriteSource();
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);

  // Read existing doc to get exact topic for decrementing
  let existingTopic = 'General Concepts';
  try {
    const existingSnap = await getDoc(doc(source.db, collName, docId));
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      existingTopic = normalizeTopicName(normSub, data.topic || data.chapter || 'General Concepts');
    }
  } catch {
    // Non-fatal
  }

  const statsRef = doc(source.db, 'stats', 'questionCounts');
  const indexRef = doc(source.db, 'question_index', normSub);
  const poolDocRef = doc(source.db, collName, docId);
  const keyDocRef = doc(source.db, 'questionKeys', docId);

  try {
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await setDoc(statsRef, { subjectCounts: {}, topicCounts: {}, updatedAt: serverTimestamp() });
    }
  } catch {
    // Non-fatal
  }

  const batch = writeBatch(source.db);

  // 1. Delete question doc
  batch.delete(poolDocRef);

  // 2. Delete key doc
  batch.delete(keyDocRef);

  // 3. Remove docId from question_index in same batch
  batch.set(
    indexRef,
    {
      ids: arrayRemove(docId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 4. Decrement subject and topic counts in same batch
  batch.set(
    statsRef,
    {
      [`subjectCounts.${normSub}`]: increment(-1),
      [`topicCounts.${normSub}.${existingTopic}`]: increment(-1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  clearMultiSourceCache();
}

/**
 * Moves questions to a new topic on the source each question came from, updating stats in the same batch.
 */
export async function moveMultiSourceQuestionsToTopic(
  _adminEmail: string,
  subject: string,
  compoundIds: string[],
  newTopic: string
): Promise<number> {
  const normSub = findSubjectSlug(subject) || subject.toLowerCase().trim();
  const cleanNew = normalizeTopicName(normSub, newTopic);

  if (!USE_FIRESTORE_QUESTION_READER) {
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

  const collName = getSubjectPoolCollection(normSub);

  // Group by sourceId
  const bySource = new Map<string, string[]>();
  compoundIds.forEach((cid) => {
    const { sourceId, docId } = parseQuestionCompoundId(cid);
    if (!bySource.has(sourceId)) bySource.set(sourceId, []);
    bySource.get(sourceId)!.push(docId);
  });

  let totalMoved = 0;

  for (const [sourceId, docIds] of bySource.entries()) {
    const source = getBankSource(sourceId);
    if (!source) continue;

    const chunkSize = 200;
    for (let i = 0; i < docIds.length; i += chunkSize) {
      const chunk = docIds.slice(i, i + chunkSize);
      const batch = writeBatch(source.db);
      chunk.forEach((id) => {
        batch.update(doc(source.db, collName, id), {
          topic: cleanNew,
          chapter: cleanNew,
          updatedAt: serverTimestamp(),
        });
      });

      // Update topic counts on source stats doc in same batch
      const statsRef = doc(source.db, 'stats', 'questionCounts');
      batch.set(
        statsRef,
        {
          [`topicCounts.${normSub}.${cleanNew}`]: increment(chunk.length),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      totalMoved += chunk.length;
    }
  }

  clearMultiSourceCache();
  return totalMoved;
}

/**
 * Imports CSV questions into the selected target source.
 * Normalizes topic names, maps aliases, and updates question_index and stats in the same batch.
 */
export async function batchImportMultiSourceQuestions(
  adminEmail: string,
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

  // Map of existing IDs per subject
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
    collName: string;
    topic: string;
    publicDoc: Record<string, unknown>;
    keyDoc: Record<string, unknown>;
  }> = [];

  for (const row of rawRows) {
    const qText = (row.text || row.q || row.question || row.stem ? String(row.text || row.q || row.question || row.stem) : '').trim();
    
    // Determine each row's own subject pool (never ignore row's subject column)
    const rowSubjectRaw =
      row.subject ||
      row.Subject ||
      row.SUBJECT ||
      row.course ||
      row.discipline;
    const rowSub = (rowSubjectRaw ? findSubjectSlug(String(rowSubjectRaw)) : null) || normSub;
    const rowCollName = getSubjectPoolCollection(rowSub);

    const rawTopic = String(row.topic || row.chapter || defaultTopic || 'General Concepts');
    const rowTopic = normalizeTopicName(rowSub, rawTopic);

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

    // Resolve correct index (0..3)
    let correctIdx = 0;
    const rawCorrect = row.correct !== undefined ? row.correct : (row.correctAnswer !== undefined ? row.correctAnswer : row.answer);
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
    const diff = (String(row.difficulty || 'medium').toLowerCase() as QuestionDifficulty);
    const status = (String(row.status || 'published').toLowerCase() as QuestionStatus);

    validItems.push({
      docId,
      subject: rowSub,
      collName: rowCollName,
      topic: rowTopic,
      publicDoc: {
        id: docId,
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
      keyDoc: {
        id: docId,
        correct: correctIdx,
        explain,
        updatedAt: serverTimestamp(),
      },
    });
  }

  if (!USE_FIRESTORE_QUESTION_READER) {
    const chunkSize = 100;
    const headers = await getD1AuthHeaders(true);
    for (let i = 0; i < validItems.length; i += chunkSize) {
      const chunk = validItems.slice(i, i + chunkSize);
      const d1Questions = chunk.map((item) => ({
        id: source.id === 'legacy' ? item.docId : `${source.id}__${item.docId}`,
        bank_id: source.id,
        subject: item.subject,
        topic: item.topic,
        difficulty: item.publicDoc.difficulty,
        status: item.publicDoc.status,
        question_text: item.publicDoc.text,
        options: item.publicDoc.options,
        correct_answer: item.publicDoc.correct,
        explanation: item.publicDoc.explain,
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

  // Ensure stats/questionCounts exists on target source
  const statsRef = doc(source.db, 'stats', 'questionCounts');
  try {
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await setDoc(statsRef, { subjectCounts: {}, topicCounts: {}, updatedAt: serverTimestamp() });
    }
  } catch {
    // Non-fatal
  }

  // Batch insert into target source (up to 100 items per batch)
  const chunkSize = 100;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(source.db);

    // Group chunk items by subject so each row's subject pool and stats are updated correctly
    const subGroups = new Map<string, typeof chunk>();
    chunk.forEach((item) => {
      const list = subGroups.get(item.subject) || [];
      list.push(item);
      subGroups.set(item.subject, list);
    });

    const statsUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    for (const [subKey, subItems] of subGroups.entries()) {
      const subDocIds: string[] = [];
      const subTopicCounts: Record<string, number> = {};

      subItems.forEach((item) => {
        batch.set(doc(source.db, item.collName, item.docId), item.publicDoc);
        batch.set(doc(source.db, 'questionKeys', item.docId), item.keyDoc);
        subDocIds.push(item.docId);
        subTopicCounts[item.topic] = (subTopicCounts[item.topic] || 0) + 1;
      });

      // Update question_index for subKey
      const subIndexRef = doc(source.db, 'question_index', subKey);
      batch.set(
        subIndexRef,
        {
          subject: subKey,
          ids: arrayUnion(...subDocIds),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Accumulate stats updates for subKey
      statsUpdates[`subjectCounts.${subKey}`] = increment(subItems.length);
      for (const [top, cnt] of Object.entries(subTopicCounts)) {
        statsUpdates[`topicCounts.${subKey}.${top}`] = increment(cnt);
      }
    }

    batch.set(statsRef, statsUpdates, { merge: true });
    await batch.commit();

    result.imported += chunk.length;
    if (onProgress) onProgress(result.imported, validItems.length);
  }

  clearMultiSourceCache();
  return result;
}

// ─── 5B. FIX MISFILED QUESTIONS ──────────────────────────────────────────────
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
  const englishRegex = /\b(obfuscate|synonym|antonym|closest in meaning|meaning of the word|correct preposition|preposition|grammatically correct|correct spelling|idiom|vocabulary|passive voice|direct speech|conjunction)\b/i;
  const physicsRegex = /\b(mercury droplet|surface tension|terminal velocity|capacitance|acceleration due to gravity|magnetic field|magnetic flux|electric potential|carnot engine|half-life|refractive index|projectile motion|coulomb's law|coulomb|isothermal|adiabatic|kinetic energy of|momentum of a|angstrom|diffraction grating)\b/i;
  const chemistryRegex = /\b(molarity|molality|periodic table|oxidation state|electronegativity|hydrocarbon|alkene|alkane|alkyne|chemical equilibrium|buffer solution|atomic radius|ionization energy|avogadro|stoichiometry)\b/i;

  if (!USE_FIRESTORE_QUESTION_READER) {
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

  const sources = getBankSources();
  const coreSubjects = ['mathematics', 'physics', 'chemistry', 'english'];

  for (const src of sources) {
    for (const poolSub of coreSubjects) {
      const collName = getSubjectPoolCollection(poolSub);
      try {
        const snap = await getDocs(collection(src.db, collName));
        snap.forEach((d) => {
          const data = d.data();
          const docId = d.id;
          const compoundId = `${src.id}:${docId}`;
          const stem = String(data.text || data.q || data.stem || data.question || '');
          const rawTopic = String(data.topic || data.chapter || '');
          const explicitSubject = data.subject ? findSubjectSlug(String(data.subject)) : null;

          let proposedSub: string | null = null;
          let reason = '';

          // 1. Explicit subject mismatch
          if (explicitSubject && explicitSubject !== poolSub && coreSubjects.includes(explicitSubject)) {
            proposedSub = explicitSubject;
            reason = `Document carries subject "${explicitSubject}" but was filed into ${poolSub} pool`;
          }
          // 2. Misfiled inside mathematics
          else if (poolSub === 'mathematics') {
            if (englishRegex.test(stem) || englishRegex.test(rawTopic)) {
              proposedSub = 'english';
              reason = `English vocabulary/grammar terms ("${stem.match(englishRegex)?.[0] || 'English'}") misfiled in mathematics pool`;
            } else if (physicsRegex.test(stem) || physicsRegex.test(rawTopic)) {
              proposedSub = 'physics';
              reason = `Physics concepts ("${stem.match(physicsRegex)?.[0] || 'Physics'}") misfiled in mathematics pool`;
            } else if (chemistryRegex.test(stem) || chemistryRegex.test(rawTopic)) {
              proposedSub = 'chemistry';
              reason = `Chemistry concepts ("${stem.match(chemistryRegex)?.[0] || 'Chemistry'}") misfiled in mathematics pool`;
            }
          }
          // 3. Misfiled inside physics
          else if (poolSub === 'physics') {
            if (englishRegex.test(stem)) {
              proposedSub = 'english';
              reason = `English vocabulary terms misfiled in physics pool`;
            } else if (chemistryRegex.test(stem)) {
              proposedSub = 'chemistry';
              reason = `Chemistry concepts misfiled in physics pool`;
            }
          }
          // 4. Misfiled inside english
          else if (poolSub === 'english') {
            if (physicsRegex.test(stem)) {
              proposedSub = 'physics';
              reason = `Physics concepts misfiled in english pool`;
            }
          }

          if (proposedSub && proposedSub !== poolSub) {
            candidates.push({
              id: compoundId,
              docId,
              sourceId: src.id,
              currentPoolSubject: poolSub,
              proposedSubject: proposedSub,
              stem: stem.slice(0, 120),
              topic: rawTopic,
              reason,
            });
          }
        });
      } catch (err) {
        console.warn(`[scanMisfiledQuestions] Pool read note for ${src.id}/${collName}:`, err);
      }
    }
  }

  return candidates;
}

export async function fixMisfiledQuestions(
  candidates: MisfiledQuestionCandidate[],
  adminEmail: string
): Promise<FixMisfiledResult> {
  const fixed: FixMisfiledResult['fixed'] = [];

  if (!USE_FIRESTORE_QUESTION_READER) {
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

  for (const item of candidates) {
    const src = getBankSource(item.sourceId);
    if (!src) continue;

    const oldColl = getSubjectPoolCollection(item.currentPoolSubject);
    const newColl = getSubjectPoolCollection(item.proposedSubject);

    const oldDocRef = doc(src.db, oldColl, item.docId);
    const oldSnap = await getDoc(oldDocRef);
    if (!oldSnap.exists()) continue;

    const data = oldSnap.data();
    const oldKeyRef = doc(src.db, 'questionKeys', item.docId);
    const keySnap = await getDoc(oldKeyRef);
    const keyData = keySnap.exists() ? keySnap.data() : null;

    // Generate new document ID with correct subject prefix
    const cHash = data.contentHash || item.docId.replace(/^pool_[a-z]+_/, '') || Math.random().toString(36).substring(2);
    const newDocId = `pool_${item.proposedSubject}_${cHash.substring(0, 20)}`;
    const newTopic = normalizeTopicName(item.proposedSubject, data.topic || data.chapter || 'General Concepts');

    const newPublicDoc = {
      ...data,
      id: newDocId,
      subject: item.proposedSubject,
      topic: newTopic,
      chapter: newTopic,
      updatedAt: serverTimestamp(),
      updatedBy: adminEmail,
    };

    const newKeyDoc = keyData
      ? { ...keyData, id: newDocId, updatedAt: serverTimestamp() }
      : { id: newDocId, correct: data.correct ?? 0, updatedAt: serverTimestamp() };

    const batch = writeBatch(src.db);

    // 1. Create in new collection & new key
    batch.set(doc(src.db, newColl, newDocId), newPublicDoc);
    batch.set(doc(src.db, 'questionKeys', newDocId), newKeyDoc);

    // 2. Delete from old collection & old key
    batch.delete(oldDocRef);
    if (item.docId !== newDocId) {
      batch.delete(oldKeyRef);
    }

    // 3. Update indices atomically
    const oldIndexRef = doc(src.db, 'question_index', item.currentPoolSubject);
    batch.set(
      oldIndexRef,
      {
        subject: item.currentPoolSubject,
        ids: arrayRemove(item.docId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const newIndexRef = doc(src.db, 'question_index', item.proposedSubject);
    batch.set(
      newIndexRef,
      {
        subject: item.proposedSubject,
        ids: arrayUnion(newDocId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Update stats/questionCounts atomically
    const statsRef = doc(src.db, 'stats', 'questionCounts');
    const oldTopic = String(data.topic || 'General Concepts');
    const statsUpdates: Record<string, unknown> = {
      [`subjectCounts.${item.currentPoolSubject}`]: increment(-1),
      [`topicCounts.${item.currentPoolSubject}.${oldTopic}`]: increment(-1),
      [`subjectCounts.${item.proposedSubject}`]: increment(1),
      [`topicCounts.${item.proposedSubject}.${newTopic}`]: increment(1),
      updatedAt: serverTimestamp(),
    };
    batch.set(statsRef, statsUpdates, { merge: true });

    await batch.commit();

    fixed.push({
      id: item.id,
      oldSubject: item.currentPoolSubject,
      newSubject: item.proposedSubject,
      stem: item.stem,
      reason: item.reason,
    });
  }

  clearMultiSourceCache();
  return { fixedCount: fixed.length, fixed };
}

// ─── 6. REBUILD COUNTS & INDEX (COUNT AGGREGATION SYSTEM) ─────────────────────
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

/**
 * Recomputes question counts (from Cloudflare D1 `/api/questions/health` when `!USE_FIRESTORE_QUESTION_READER`,
 * or Firestore when `USE_FIRESTORE_QUESTION_READER` is enabled).
 */
export async function rebuildCountsAndIndex(_adminEmail: string): Promise<RebuildCountsResult> {
  if (!USE_FIRESTORE_QUESTION_READER) {
    const beforeDoc = await getMultiSourceQuestionCounts();
    const beforeSubCounts = { ...beforeDoc.subjectCounts };
    const beforeTotal = Object.values(beforeSubCounts).reduce((a, b) => a + b, 0);

    clearMultiSourceCache();
    clearQuestionsCache();

    const resp = await fetch('/api/questions/health');
    const data = resp.ok ? await resp.json() : {};
    const banks = (data?.banks || {}) as Record<string, { label?: string; total?: number; lastImportAt?: string }>;
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
      return `${b.label || bId}: ${b.total ?? 0} questions in D1 (last import: ${b.lastImportAt || 'N/A'})`;
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

  // 1. Snapshot Before counts
  const beforeCountsDoc = await getMultiSourceQuestionCounts();
  const beforeSubjectCounts: Record<string, number> = { ...beforeCountsDoc.subjectCounts };
  const beforeBankBreakdown: Record<string, number> = {};
  const sources = getBankSources();

  for (const src of sources) {
    try {
      const snap = await getDoc(doc(src.db, 'stats', 'questionCounts'));
      if (snap.exists()) {
        const sc = snap.data().subjectCounts || {};
        beforeBankBreakdown[src.id] = Object.values(sc).reduce((a: number, b: unknown) => a + Number(b || 0), 0);
      } else {
        beforeBankBreakdown[src.id] = 0;
      }
    } catch {
      beforeBankBreakdown[src.id] = 0;
    }
  }

  const beforeTotal = Object.values(beforeSubjectCounts).reduce((a, b) => a + b, 0);

  const subjects = [
    'mathematics',
    'physics',
    'chemistry',
    'computer-science',
    'english',
    'biology',
    'analytical-reasoning',
  ];

  const details: string[] = [];

  // 2. Rebuild each bank
  for (const src of sources) {
    const bankSubjects: Record<string, number> = {};
    const bankTopics: Record<string, Record<string, number>> = {};

    for (const sub of subjects) {
      bankTopics[sub] = {};
      const poolColl = getSubjectPoolCollection(sub);
      const docIdsSet = new Set<string>();
      const subVariants = Array.from(new Set([sub, formatSubjectName(sub), sub.toLowerCase(), sub.toUpperCase()]));

      // 2a. Check dedicated pool: questions_${sub}
      try {
        const poolRef = collection(src.db, poolColl);
        // Use count() aggregation
        const countSnap = await getCountFromServer(poolRef);
        const aggCount = countSnap.data().count;

        if (aggCount > 0) {
          const docsSnap = await getDocs(query(poolRef, limit(5000)));
          docsSnap.docs.forEach((d) => {
            docIdsSet.add(d.id);
            const data = d.data();
            const rawTopic = data.topic || data.chapter || 'General Concepts';
            const canonTopic = normalizeTopicName(sub, rawTopic);
            bankTopics[sub][canonTopic] = (bankTopics[sub][canonTopic] || 0) + 1;
          });
        }
      } catch {
        // Non-fatal if collection doesn't exist
      }

      // 2b. Also check general questions collection (for legacy and bank1)
      if (src.id === 'legacy' || src.id === 'bank1') {
        try {
          const mainRef = collection(src.db, 'questions');
          const mainCountSnap = await getCountFromServer(
            query(mainRef, where('subject', 'in', subVariants))
          );
          if (mainCountSnap.data().count > 0) {
            const mainDocsSnap = await getDocs(
              query(mainRef, where('subject', 'in', subVariants), limit(5000))
            );
            mainDocsSnap.docs.forEach((d) => {
              // Avoid duplicate count if doc already counted in pool
              if (!docIdsSet.has(d.id)) {
                docIdsSet.add(d.id);
                const data = d.data();
                const rawTopic = data.topic || data.chapter || 'General Concepts';
                const canonTopic = normalizeTopicName(sub, rawTopic);
                bankTopics[sub][canonTopic] = (bankTopics[sub][canonTopic] || 0) + 1;
              }
            });
          }
        } catch {
          // Non-fatal
        }
      }

      // Ensure default taxonomy chapters exist in topic map (starting at count 0 if none)
      const defaultChapters = getChaptersForSubject(sub);
      defaultChapters.forEach((ch) => {
        if (bankTopics[sub][ch.name] === undefined) {
          bankTopics[sub][ch.name] = 0;
        }
      });

      const totalSubCount = docIdsSet.size;
      bankSubjects[sub] = totalSubCount;

      // 2c. Write question_index/<subject> with updated list of document IDs
      try {
        const indexRef = doc(src.db, 'question_index', sub);
        await setDoc(
          indexRef,
          {
            subject: sub,
            ids: Array.from(docIdsSet),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        if (src.id === 'legacy') {
          const legIndexRef = doc(src.db, 'stats', `questionIndex_${sub}`);
          await setDoc(
            legIndexRef,
            {
              subject: sub,
              ids: Array.from(docIdsSet),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
      } catch (idxErr) {
        console.warn(`[Rebuild] Could not update question_index/${sub} on ${src.id}:`, idxErr);
      }
    }

    // 2d. Write stats/questionCounts document for this bank
    try {
      const statsRef = doc(src.db, 'stats', 'questionCounts');
      await setDoc(statsRef, {
        subjectCounts: bankSubjects,
        topicCounts: bankTopics,
        updatedAt: serverTimestamp(),
      });
      const totalBankQ = Object.values(bankSubjects).reduce((a, b) => a + b, 0);
      details.push(
        `${src.name} (${src.id}): Indexed ${totalBankQ} questions across ${subjects.length} subjects.`
      );
    } catch (statsErr) {
      console.warn(`[Rebuild] Could not update stats/questionCounts on ${src.id}:`, statsErr);
    }
  }

  // 3. Clear all caches
  clearMultiSourceCache();
  clearQuestionsCache();

  // 4. Fetch fresh aggregated after stats
  const afterCountsDoc = await getMultiSourceQuestionCounts();
  const afterSubjectCounts: Record<string, number> = { ...afterCountsDoc.subjectCounts };
  const afterBankBreakdown: Record<string, number> = {};

  for (const src of sources) {
    try {
      const snap = await getDoc(doc(src.db, 'stats', 'questionCounts'));
      if (snap.exists()) {
        const sc = snap.data().subjectCounts || {};
        afterBankBreakdown[src.id] = Object.values(sc).reduce((a: number, b: unknown) => a + Number(b || 0), 0);
      } else {
        afterBankBreakdown[src.id] = 0;
      }
    } catch {
      afterBankBreakdown[src.id] = 0;
    }
  }

  const afterTotal = Object.values(afterSubjectCounts).reduce((a, b) => a + b, 0);

  return {
    before: {
      totalQuestions: beforeTotal,
      subjectCounts: beforeSubjectCounts,
      bankBreakdown: beforeBankBreakdown,
    },
    after: {
      totalQuestions: afterTotal,
      subjectCounts: afterSubjectCounts,
      bankBreakdown: afterBankBreakdown,
    },
    details,
  };
}

