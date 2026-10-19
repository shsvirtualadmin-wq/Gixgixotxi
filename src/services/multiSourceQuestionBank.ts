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
  limit,
  writeBatch,
  serverTimestamp,
  documentId,
  increment,
  arrayUnion,
  arrayRemove,
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

        // If index doc does not exist yet on this source, query small initial set and write index doc
        if (rawIds.length === 0) {
          const targetColl = getSubjectPoolCollection(norm);
          try {
            const poolSnap = await getDocs(
              query(collection(source.db, targetColl), where('status', '==', 'published'), limit(40))
            );
            if (!poolSnap.empty) {
              rawIds = poolSnap.docs.map((d) => d.id);
            } else if (source.id === 'legacy') {
              const legacySnap = await getDocs(
                query(
                  collection(source.db, 'questions'),
                  where('status', '==', 'published'),
                  where('subject', '==', norm),
                  limit(40)
                )
              );
              rawIds = legacySnap.docs.map((d) => d.id);
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

        recordSourceSuccess(source.id);
        rawIds.forEach((rawId) => compoundIds.push(formatQuestionCompoundId(source.id, rawId)));
      } catch (err) {
        recordSourceFailure(source.id, err);
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
          if (snap.exists()) {
            const data = snap.data();
            const subCounts = (data.subjectCounts || {}) as Record<string, number>;
            const topCounts = (data.topicCounts || {}) as Record<string, Record<string, number>>;

            for (const [sub, cnt] of Object.entries(subCounts)) {
              sumSubjects[sub] = (sumSubjects[sub] || 0) + Number(cnt || 0);
            }

            for (const [sub, topics] of Object.entries(topCounts)) {
              if (!sumTopics[sub]) sumTopics[sub] = {};
              for (const [top, cnt] of Object.entries(topics || {})) {
                sumTopics[sub][top] = (sumTopics[sub][top] || 0) + Number(cnt || 0);
              }
            }
            recordSourceSuccess(source.id);
          } else {
            // Initialize document on new source if empty
            if (source.id === 'legacy') {
              sumSubjects.mathematics = (sumSubjects.mathematics || 0) + 10;
            }
          }
        } catch (err) {
          recordSourceFailure(source.id, err);
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
  const norm = (subject || '').trim().toLowerCase();
  const countsDoc = await getMultiSourceQuestionCounts();
  const subTopics = countsDoc.topicCounts[norm] || {};
  const list: { name: string; count: number }[] = [];

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

        recordSourceSuccess(source.id);
      } catch (err) {
        recordSourceFailure(source.id, err);
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

  // 1. Write to target source's subject pool
  await setDoc(doc(source.db, collName, finalDocId), docData, { merge: true });

  // 2. Also write secret key doc to target source's questionKeys
  await setDoc(
    doc(source.db, 'questionKeys', finalDocId),
    {
      id: finalDocId,
      correct: question.correct,
      explain: (question.explain || '').trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Update question_index/<subject> and stats/questionCounts on target source
  if (isNew) {
    try {
      const indexRef = doc(source.db, 'question_index', normSub);
      await setDoc(
        indexRef,
        {
          subject: normSub,
          ids: arrayUnion(finalDocId),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }

    try {
      const statsRef = doc(source.db, 'stats', 'questionCounts');
      await updateDoc(statsRef, {
        [`subjectCounts.${normSub}`]: increment(1),
        [`topicCounts.${normSub}.${topic}`]: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(
          statsRef,
          {
            subjectCounts: { [normSub]: 1 },
            topicCounts: { [normSub]: { [topic]: 1 } },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch {
      // Non-fatal
    }
  }

  clearMultiSourceCache();

  return {
    id: finalDocId,
    compoundId: formatQuestionCompoundId(source.id, finalDocId),
    sourceId: source.id,
  };
}

/**
 * Deletes question from the specific source it came from.
 */
export async function deleteMultiSourceQuestion(
  _adminEmail: string,
  subject: string,
  compoundId: string
): Promise<void> {
  const { sourceId, docId } = parseQuestionCompoundId(compoundId);
  const source = getBankSource(sourceId) || getDefaultWriteSource();
  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);

  // Delete from source pool & questionKeys
  await deleteDoc(doc(source.db, collName, docId));
  await deleteDoc(doc(source.db, 'questionKeys', docId)).catch(() => {});

  // Remove from source index
  try {
    const indexRef = doc(source.db, 'question_index', normSub);
    await updateDoc(indexRef, {
      ids: arrayRemove(docId),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }

  // Decrement on source stats
  try {
    const statsRef = doc(source.db, 'stats', 'questionCounts');
    await updateDoc(statsRef, {
      [`subjectCounts.${normSub}`]: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }

  clearMultiSourceCache();
}

/**
 * Moves questions to a new topic on the source each question came from.
 */
export async function moveMultiSourceQuestionsToTopic(
  _adminEmail: string,
  subject: string,
  compoundIds: string[],
  newTopic: string
): Promise<number> {
  const normSub = subject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);
  const cleanNew = newTopic.trim();

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

    const chunkSize = 400;
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
      await batch.commit();
      totalMoved += chunk.length;
    }

    // Update topic counts on source stats doc
    try {
      const statsRef = doc(source.db, 'stats', 'questionCounts');
      await setDoc(
        statsRef,
        {
          [`topicCounts.${normSub}.${cleanNew}`]: increment(docIds.length),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }
  }

  clearMultiSourceCache();
  return totalMoved;
}

/**
 * Imports CSV questions into the selected target source.
 * Skips duplicates against ALL sources by the hashed ID.
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
  const normSub = targetSubject.toLowerCase().trim();
  const collName = getSubjectPoolCollection(normSub);

  // 1. Fetch all existing question hashes across all sources to prevent cross-source duplicates
  const existingHashes = new Set<string>();
  const existingIds = await getMultiSourceSubjectQuestionIds(normSub);
  existingIds.forEach((cid) => {
    const { docId } = parseQuestionCompoundId(cid);
    existingHashes.add(docId);
  });

  const validItems: Array<{ docId: string; publicDoc: Record<string, unknown>; keyDoc: Record<string, unknown> }> = [];
  const newlyAddedDocIds: string[] = [];
  const topicCountsAdded: Record<string, number> = {};

  for (const row of rawRows) {
    const qText = (row.text || row.q || row.question || row.stem ? String(row.text || row.q || row.question || row.stem) : '').trim();
    const rowTopic = (row.topic || row.chapter ? String(row.topic || row.chapter) : defaultTopic).trim();

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
    const docId = `pool_${normSub}_${cHash.substring(0, 20)}`;

    if (existingHashes.has(docId)) {
      result.duplicatesSkipped++;
      continue;
    }
    existingHashes.add(docId);
    newlyAddedDocIds.push(docId);
    topicCountsAdded[rowTopic] = (topicCountsAdded[rowTopic] || 0) + 1;

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
      publicDoc: {
        id: docId,
        subject: normSub,
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

  // Batch insert into target source (400 ops per batch)
  const chunkSize = 200;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);
    const batch = writeBatch(source.db);
    chunk.forEach((item) => {
      batch.set(doc(source.db, collName, item.docId), item.publicDoc);
      batch.set(doc(source.db, 'questionKeys', item.docId), item.keyDoc);
    });
    await batch.commit();
    result.imported += chunk.length;
    if (onProgress) onProgress(result.imported, validItems.length);
  }

  // Update target source's question_index and stats document
  if (result.imported > 0) {
    try {
      const indexRef = doc(source.db, 'question_index', normSub);
      await setDoc(
        indexRef,
        {
          subject: normSub,
          ids: arrayUnion(...newlyAddedDocIds),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }

    try {
      const statsRef = doc(source.db, 'stats', 'questionCounts');
      await setDoc(
        statsRef,
        {
          [`subjectCounts.${normSub}`]: increment(result.imported),
          ...Object.fromEntries(
            Object.entries(topicCountsAdded).map(([top, cnt]) => [`topicCounts.${normSub}.${top}`, increment(cnt)])
          ),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }
  }

  clearMultiSourceCache();
  return result;
}
