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
} from 'firebase/firestore';
import {
  ENABLE_MULTI_SOURCE_BANK,
  getBankSources,
  getBankSource,
  getDefaultWriteSource,
  recordSourceFailure,
  recordSourceSuccess,
} from '@/config/questionBankSources';

export { ENABLE_MULTI_SOURCE_BANK };
import {
  getSubjectPoolCollection,
  computeContentHash,
  getChaptersForSubject,
  findSubjectSlug,
  normalizeTopicName,
  formatSubjectName,
} from '@/constants/taxonomy';
import type { Question, QuestionDifficulty, QuestionStatus } from '@/types';

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
  return {
    sourceId: fallbackSourceId,
    docId: compoundId,
  };
}

export function formatQuestionCompoundId(sourceId: string, docId: string): string {
  if (!ENABLE_MULTI_SOURCE_BANK) {
    return docId;
  }
  if (docId.startsWith(`${sourceId}:`)) return docId;
  return `${sourceId}:${docId}`;
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

// ─── SESSION CACHES ─────────────────────────────────────────────────────────
interface AggregatedCounts {
  subjectCounts: Record<string, number>;
  topicCounts: Record<string, Record<string, number>>;
}

let sessionAggregatedCounts: AggregatedCounts | null = null;
let countsFetchPromise: Promise<AggregatedCounts> | null = null;
const sourceIndexCache = new Map<string, Map<string, string[]>>(); // sourceId -> subject -> raw docIds
const multiSourcePageCache = new Map<string, { questions: Question[]; hasMore: boolean }>();

export function clearMultiSourceCache(): void {
  sessionAggregatedCounts = null;
  countsFetchPromise = null;
  sourceIndexCache.clear();
  multiSourcePageCache.clear();
}

// ─── 4. MULTI-SOURCE QUESTION INDEX (DRILLS & SPRINTS) ───────────────────────
/**
 * Reads the index document `question_index/<subject>` from every working source.
 * Merges the IDs as compound IDs ("sourceId:docId").
 * Never loads the whole question pool into memory.
 */
export async function getMultiSourceSubjectQuestionIds(subject: string): Promise<string[]> {
  const norm = subject.toLowerCase().trim();
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

        // If index doc does not exist yet on this source, query complete set of IDs and write index doc
        if (rawIds.length === 0) {
          const targetColl = getSubjectPoolCollection(norm);
          const subVariants = Array.from(new Set([norm, formatSubjectName(norm), norm.toLowerCase(), norm.toUpperCase()]));
          try {
            const poolSnap = await getDocs(
              query(collection(source.db, targetColl), limit(3000))
            );
            if (!poolSnap.empty) {
              rawIds = poolSnap.docs.map((d) => d.id);
            }
            if (source.id === 'legacy' || source.id === 'bank1') {
              const legacySnap = await getDocs(
                query(
                  collection(source.db, 'questions'),
                  where('subject', 'in', subVariants),
                  limit(3000)
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

  return Array.from(new Set(compoundIds));
}

/**
 * Fetches ONLY the questions for the given compound IDs from their respective sources.
 * Never reads an entire pool.
 */
export async function fetchMultiSourceQuestionsByIds(
  compoundIds: string[],
  subject?: string
): Promise<Question[]> {
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
  if (countsFetchPromise) {
    return countsFetchPromise;
  }

  countsFetchPromise = (async () => {
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
    limitPerSource?: number;
  }
): Promise<Question[]> {
  const normSub = subject.toLowerCase().trim();
  const poolColl = getSubjectPoolCollection(normSub);
  const limitCount = options?.limitPerSource ?? 60;
  const sources = getBankSources();

  const allRawQuestions: Question[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        // Query pool collection
        const qConstraints = [limit(limitCount)];
        if (options?.difficulty && options.difficulty !== 'all') {
          qConstraints.unshift(where('difficulty', '==', options.difficulty.toLowerCase()));
        }
        if (options?.status && options.status !== 'all') {
          qConstraints.unshift(where('status', '==', options.status.toLowerCase()));
        }

        const poolSnap = await getDocs(query(collection(source.db, poolColl), ...qConstraints));

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

  return deduplicated;
}

// ─── 11. PAGINATED READ FOR ADMIN (20 AT A TIME, SESSION CACHED) ───────────
export async function fetchMultiSourceQuestionsPaginated(filters: {
  subject: string;
  topic?: string;
  search?: string;
  difficulty?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}): Promise<{ questions: Question[]; totalCount: number; hasMore: boolean }> {
  const pageSize = filters.pageSize ?? 20;
  const pageIdx = filters.pageIndex ?? 0;
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
  const normSub = question.subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const qText = (question.text || '').trim();
  const topic = (question.topic || 'General Concepts').trim();

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
  const collName = getSubjectPoolCollection(normSub);
  const cleanNew = normalizeTopicName(normSub, newTopic);

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
  const sources = getBankSources();

  const englishRegex = /\b(obfuscate|synonym|antonym|closest in meaning|meaning of the word|correct preposition|preposition|grammatically correct|correct spelling|idiom|vocabulary|passive voice|direct speech|conjunction)\b/i;
  const physicsRegex = /\b(mercury droplet|surface tension|terminal velocity|capacitance|acceleration due to gravity|magnetic field|magnetic flux|electric potential|carnot engine|half-life|refractive index|projectile motion|coulomb's law|coulomb|isothermal|adiabatic|kinetic energy of|momentum of a|angstrom|diffraction grating)\b/i;
  const chemistryRegex = /\b(molarity|molality|periodic table|oxidation state|electronegativity|hydrocarbon|alkene|alkane|alkyne|chemical equilibrium|buffer solution|atomic radius|ionization energy|avogadro|stoichiometry)\b/i;

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
 * Recomputes question counts with Firestore count() aggregation (not full reads),
 * rebuilds question_index for every subject and bank, and writes stats/questionCounts.
 * Displays before/after numbers.
 */
export async function rebuildCountsAndIndex(_adminEmail: string): Promise<RebuildCountsResult> {
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

