import {
  doc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  setDoc,
  increment,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { robustSaveDoc } from '@/lib/robustSave';
import {
  findSubjectSlug,
  formatSubjectName,
  getSubjectPoolCollection,
  isSubjectPoolSupported,
} from '@/constants/taxonomy';
import { getUniversityCriteria, getSectionCriteria } from '@/constants/universityCriteria';
import {
  ENABLE_MULTI_SOURCE_BANK,
  getMultiSourceSubjectQuestionIds,
  fetchMultiSourceQuestionsByIds,
  fetchMultiSourcePoolQuestions,
  fetchMultiSourceQuestionKey,
} from './multiSourceQuestionBank';
import type { AttemptDoc, AttemptQuestion } from '@/types/index';

/**
 * University marking configurations for official entrance exams.
 */
export interface UniversityMarkingScheme {
  id: string;
  name: string;
  correctMarks: number;
  negativeMarks: number; // e.g. -0.25
}

export const UNIVERSITY_MARKING_SCHEMES: Record<string, UniversityMarkingScheme> = {
  'fast-nuces': { id: 'fast-nuces', name: 'FAST-NUCES', correctMarks: 1.0, negativeMarks: -0.25 },
  'fast': { id: 'fast', name: 'FAST-NUCES', correctMarks: 1.0, negativeMarks: -0.25 },
  'nust-net': { id: 'nust-net', name: 'NUST NET', correctMarks: 1.0, negativeMarks: 0.0 },
  'nust': { id: 'nust', name: 'NUST NET', correctMarks: 1.0, negativeMarks: 0.0 },
  'giki': { id: 'giki', name: 'GIKI', correctMarks: 1.0, negativeMarks: 0.0 },
  'lums': { id: 'lums', name: 'LUMS (SSE)', correctMarks: 1.0, negativeMarks: 0.0 },
  'ned': { id: 'ned', name: 'NED UET', correctMarks: 1.0, negativeMarks: 0.0 },
  'mdcat': { id: 'mdcat', name: 'MDCAT (PMDC)', correctMarks: 1.0, negativeMarks: 0.0 },
  'ecat': { id: 'ecat', name: 'UET ECAT', correctMarks: 4.0, negativeMarks: -1.0 },
  'default': { id: 'default', name: 'Standard Drill', correctMarks: 1.0, negativeMarks: 0.0 },
};

export function getUniversityMarking(uniNameOrId?: string | null): UniversityMarkingScheme {
  if (!uniNameOrId) return UNIVERSITY_MARKING_SCHEMES['default'];
  const clean = uniNameOrId.trim().toLowerCase();
  for (const [key, scheme] of Object.entries(UNIVERSITY_MARKING_SCHEMES)) {
    if (clean.includes(key) || clean === key) {
      return scheme;
    }
  }
  return UNIVERSITY_MARKING_SCHEMES['default'];
}

/**
 * Fisher-Yates array shuffle.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles 4 options and returns the shuffled array plus mapping.
 * optionMapping[shuffledIndex] = originalIndex (0..3).
 */
export function shuffleOptions(options: string[]): {
  shuffledOptions: [string, string, string, string];
  optionMapping: number[];
} {
  const safeOpts: string[] = options && options.length === 4
    ? options
    : ['Option A', 'Option B', 'Option C', 'Option D'];

  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOptions = indices.map((idx) => safeOpts[idx]) as [string, string, string, string];
  return {
    shuffledOptions,
    optionMapping: indices,
  };
}

/**
 * Normalizes any format of correct answer (index 0..3, letter 'A'..'D', or exact option text)
 * to a standardized zero-based index and trimmed option text.
 */
export function normalizeCorrectAnswer(
  rawCorrect: unknown,
  options: string[]
): { correctIndex: number; correctText: string } | null {
  if (!Array.isArray(options) || options.length < 2) return null;

  // 1. Direct number index (0 <= idx < options.length)
  if (typeof rawCorrect === 'number' && Number.isInteger(rawCorrect)) {
    if (rawCorrect >= 0 && rawCorrect < options.length) {
      return {
        correctIndex: rawCorrect,
        correctText: String(options[rawCorrect] || '').trim(),
      };
    }
  }

  // 2. String representation
  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();

    // Check if it's a numeric string e.g. "0", "1", "2", "3" that isn't one of the options
    const asNum = Number(trimmed);
    if (
      !isNaN(asNum) &&
      Number.isInteger(asNum) &&
      asNum >= 0 &&
      asNum < options.length &&
      !options.includes(trimmed)
    ) {
      return {
        correctIndex: asNum,
        correctText: String(options[asNum] || '').trim(),
      };
    }

    // Check letter e.g. "A", "B", "C", "D"
    const upper = trimmed.toUpperCase();
    const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    if (letterMap[upper] !== undefined && letterMap[upper] < options.length && !options.includes(trimmed)) {
      const idx = letterMap[upper];
      return {
        correctIndex: idx,
        correctText: String(options[idx] || '').trim(),
      };
    }

    // Check exact text matching one of the options
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const targetNorm = norm(trimmed);
    const textIdx = options.findIndex((opt) => norm(String(opt || '')) === targetNorm);
    if (textIdx !== -1) {
      return {
        correctIndex: textIdx,
        correctText: String(options[textIdx] || '').trim(),
      };
    }
  }

  return null;
}

/**
 * Loads an existing attempt document by ID with fallback for deleted/unavailable questions.
 */
export async function getAttempt(attemptId: string): Promise<AttemptDoc> {
  const docRef = doc(db, 'attempts', attemptId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error(`Attempt ${attemptId} not found`);
  }

  const data = snap.data();
  // Safe normalization: ensure questions array handles deleted questions gracefully
  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  const normalizedQuestions: AttemptQuestion[] = rawQuestions.map((item: unknown, i: number) => {
    const q = item as Partial<AttemptQuestion> | undefined;
    if (!q || (!q.q && !q.stem && (!q.options || q.options.length === 0))) {
      return {
        id: q?.id || `missing-${i}`,
        q: 'Question no longer available in the question bank.',
        options: ['[Unavailable]', '[Unavailable]', '[Unavailable]', '[Unavailable]'],
        subject: q?.subject || 'general',
        chapter: q?.chapter || 'general',
        difficulty: 'medium',
        isUnavailable: true,
      };
    }
    return {
      ...(q as AttemptQuestion),
      q: q.q || q.stem || 'Question text not available.',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'],
    };
  });

  return {
    id: snap.id,
    ...data,
    questions: normalizedQuestions,
  } as AttemptDoc;
}

// ─── SEEN QUESTIONS TRACKING (PER STUDENT & LOCALSTORAGE + COMPACT END WRITE) ──
const SEEN_STORAGE_PREFIX = 'boardly_seen_questions_';

// In-memory fallback cache for Node environments or private browsing
const memorySeenCache = new Map<string, Record<string, string[]>>();

export function getStudentSeenQuestions(studentId: string, subjectSlug: string): string[] {
  const sKey = subjectSlug.toLowerCase();
  if (typeof window === 'undefined' || !window.localStorage) {
    const mem = memorySeenCache.get(studentId || 'guest');
    return mem?.[sKey] || [];
  }
  try {
    const key = `${SEEN_STORAGE_PREFIX}${studentId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = parsed[subjectSlug.toLowerCase()];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordStudentSeenQuestions(studentId: string, subjectSlug: string, newSeenIds: string[]): void {
  if (!newSeenIds.length) return;
  const sKey = subjectSlug.toLowerCase();
  const sid = studentId || 'guest';

  // Always update in-memory cache
  if (!memorySeenCache.has(sid)) {
    memorySeenCache.set(sid, {});
  }
  const mem = memorySeenCache.get(sid)!;
  const curMem = mem[sKey] || [];
  const memSet = new Set(curMem);
  const toAddMem = newSeenIds.filter((id) => !memSet.has(id));
  mem[sKey] = [...curMem, ...toAddMem];

  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${SEEN_STORAGE_PREFIX}${sid}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    const existing: string[] = Array.isArray(parsed[sKey]) ? parsed[sKey] : [];
    const seenSet = new Set(existing);
    const toAdd = newSeenIds.filter((id) => !seenSet.has(id));
    parsed[sKey] = [...existing, ...toAdd];
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Ignore quota errors
  }
}

export function resetStudentSeenQuestions(studentId: string, subjectSlug: string): void {
  const sKey = subjectSlug.toLowerCase();
  const sid = studentId || 'guest';
  const mem = memorySeenCache.get(sid);
  if (mem) {
    delete mem[sKey];
  }

  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${SEEN_STORAGE_PREFIX}${sid}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    delete parsed[sKey];
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Ignore
  }
}

export async function persistSeenQuestionsToFirestore(studentId: string, subjectSlug: string, seenIds: string[]): Promise<void> {
  if (!studentId || studentId === 'guest' || !seenIds.length) return;
  try {
    const userRef = doc(db, 'users', studentId);
    await setDoc(
      userRef,
      {
        [`seenQuestions.${subjectSlug.toLowerCase()}`]: arrayUnion(...seenIds),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking
  }
}

/**
 * Selects random unseen question IDs from question_index across all active banks.
 * - Excludes seen questions
 * - Resets seen questions only when unseen runs out
 * - If pool has fewer unseen than needed, fills with least recently seen and returns a notice
 * - Prevents duplicates by honoring globalExcludedIds within the same test
 */
export async function selectUnseenQuestionsForSubject(
  studentId: string,
  subjectSlug: string,
  needed: number,
  globalExcludedIds: Set<string> = new Set()
): Promise<{ selectedCompoundIds: string[]; notice?: string }> {
  const normSub = findSubjectSlug(subjectSlug) || subjectSlug.toLowerCase();
  let allIds = await getMultiSourceSubjectQuestionIds(normSub);

  // Fallback: If question_index was completely empty on this subject, fallback to query published
  if (!allIds || allIds.length === 0) {
    try {
      const fallbackQs = await fetchMultiSourcePoolQuestions(normSub, { limitPerSource: Math.max(needed * 2, 40) });
      allIds = fallbackQs.map((q) => q.id);
    } catch {
      allIds = [];
    }
  }

  // Filter out any questions already selected for other sections of this same test
  const availableIds = allIds.filter((id) => !globalExcludedIds.has(id));

  if (availableIds.length === 0) {
    return { selectedCompoundIds: [] };
  }

  const seenList = getStudentSeenQuestions(studentId, normSub);
  const seenSet = new Set(seenList);

  // Unseen in this pool
  let unseenIds = availableIds.filter((id) => !seenSet.has(id));

  // Reset seen list only when unseen questions run out
  if (unseenIds.length === 0 && availableIds.length > 0) {
    resetStudentSeenQuestions(studentId, normSub);
    unseenIds = [...availableIds];
  }

  let chosenIds: string[] = [];
  let notice: string | undefined = undefined;

  if (unseenIds.length >= needed) {
    chosenIds = shuffleArray(unseenIds).slice(0, needed);
  } else {
    // Take all unseen questions
    chosenIds = shuffleArray(unseenIds);
    const deficit = needed - chosenIds.length;
    const chosenSet = new Set(chosenIds);

    // Least recently seen: items in seenList from the beginning (oldest seen first)
    const lrsCandidates = seenList.filter((id) => availableIds.includes(id) && !chosenSet.has(id));
    const fillFromSeen = lrsCandidates.slice(0, deficit);
    chosenIds = [...chosenIds, ...fillFromSeen];

    // If total available distinct IDs in database is less than needed, take whatever is available
    if (chosenIds.length < needed) {
      const remaining = availableIds.filter((id) => !chosenIds.includes(id));
      chosenIds = [...chosenIds, ...remaining.slice(0, needed - chosenIds.length)];
    }

    if (fillFromSeen.length > 0) {
      notice = `Serving ${fillFromSeen.length} least recently seen questions to complete your ${needed}-question practice.`;
    }
  }

  // Record chosen IDs in student's localStorage seen tracking
  recordStudentSeenQuestions(studentId, normSub, chosenIds);

  return { selectedCompoundIds: chosenIds, notice };
}

/**
 * Fetches questions for an attempt:
 * - Full Mock: respects university criteria split (Advanced Math 50, Basic Math 20, Physics 30, English 20) with NO duplicates inside one test
 * - 10-Minute Sprint & Drills: picks random IDs from question_index across all active banks, excluding seen questions
 * - Minimal Firestore reads: fetches ONLY the selected document IDs
 */
export async function fetchQuestionsForAttempt(attempt: Partial<AttemptDoc>): Promise<AttemptQuestion[]> {
  const studentId = attempt.userId || 'guest';

  // ─── 1. FULL MOCK TEST ──────────────────────────────────────────────────────
  if (attempt.mode === 'full') {
    const criteria = getUniversityCriteria(attempt.university);
    const globalExcludedIds = new Set<string>();
    const sectionSelectedQuestions: AttemptQuestion[] = [];

    for (const split of criteria.subjectsSplit) {
      const subSlug = findSubjectSlug(split.subject) || split.subject.toLowerCase();
      const countNeeded = split.count;

      const { selectedCompoundIds, notice } = await selectUnseenQuestionsForSubject(
        studentId,
        subSlug,
        countNeeded,
        globalExcludedIds
      );

      // Add to global exclusion set so NO subsequent section (e.g. Basic Math after Advanced Math) duplicates questions!
      selectedCompoundIds.forEach((id) => globalExcludedIds.add(id));

      if (notice && import.meta.env.DEV) {
        console.info(`[Full Mock - ${split.name}] ${notice}`);
      }

      if (selectedCompoundIds.length > 0) {
        const fetchedQuestions = await fetchMultiSourceQuestionsByIds(selectedCompoundIds, subSlug);

        // Convert to AttemptQuestion with shuffled options and mapping
        fetchedQuestions.forEach((q) => {
          const rawOptions = Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : (['A', 'B', 'C', 'D'] as [string, string, string, string]);
          const { shuffledOptions, optionMapping } = shuffleOptions(rawOptions);
          sectionSelectedQuestions.push({
            id: q.id,
            q: q.q || q.stem || '',
            stem: q.q || q.stem || '',
            options: shuffledOptions,
            optionMapping,
            subject: q.subject || subSlug,
            chapter: q.chapter || split.name || 'general',
            difficulty: q.difficulty || 'medium',
          });
        });
      }
    }

    if (sectionSelectedQuestions.length === 0) {
      throw new Error('Not enough questions available across banks to generate this test. Please try again soon.');
    }

    return sectionSelectedQuestions;
  }

  // ─── 2. 10-MINUTE SPRINT & DRILLS ───────────────────────────────────────────
  const needed = Math.max(1, attempt.totalQuestions || 10);
  const subjectSlug = findSubjectSlug(attempt.subject || '') || (attempt.subject ? attempt.subject.toLowerCase() : 'mathematics');

  const { selectedCompoundIds, notice } = await selectUnseenQuestionsForSubject(
    studentId,
    subjectSlug,
    needed
  );

  if (notice && import.meta.env.DEV) {
    console.info(`[Sprint - ${subjectSlug}] ${notice}`);
  }

  if (selectedCompoundIds.length > 0) {
    const fetched = await fetchMultiSourceQuestionsByIds(selectedCompoundIds, subjectSlug);
    if (fetched.length > 0) {
      return fetched.map((q) => {
        const rawOptions = Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : (['A', 'B', 'C', 'D'] as [string, string, string, string]);
        const { shuffledOptions, optionMapping } = shuffleOptions(rawOptions);
        return {
          id: q.id,
          q: q.q || q.stem || '',
          stem: q.q || q.stem || '',
          options: shuffledOptions,
          optionMapping,
          subject: q.subject || subjectSlug,
          chapter: q.chapter || 'general',
          difficulty: q.difficulty || 'medium',
        };
      });
    }
  }

  throw new Error(`Not enough questions found for ${formatSubjectName(subjectSlug)}. Please rebuild index or check back soon.`);
}

/**
 * Console test: Runs 5 consecutive 10-minute sprints and prints how many unique question IDs appeared.
 */
export async function testRunFiveSprints(subject = 'mathematics'): Promise<{
  totalDelivered: number;
  uniqueCount: number;
  repeats: number;
  sprints: Array<{ sprint: number; ids: string[] }>;
}> {
  console.log(`%c[Sprint Test] Running 5 consecutive 10-minute sprints for "${subject}"...`, 'color: #3b82f6; font-weight: bold;');
  const testUserId = `test-runner-${Date.now()}`;
  const results: Array<{ sprint: number; ids: string[] }> = [];
  const allIds: string[] = [];

  for (let sprintNum = 1; sprintNum <= 5; sprintNum++) {
    const { selectedCompoundIds, notice } = await selectUnseenQuestionsForSubject(testUserId, subject, 10);
    results.push({ sprint: sprintNum, ids: selectedCompoundIds });
    allIds.push(...selectedCompoundIds);
    console.log(
      `%c[Sprint ${sprintNum}] Delivered ${selectedCompoundIds.length} MCQs${notice ? ` (${notice})` : ''}:`,
      'color: #10b981;',
      selectedCompoundIds
    );
  }

  const uniqueSet = new Set(allIds);
  const repeats = allIds.length - uniqueSet.size;

  console.log(
    `%c[Sprint Test Results] Total Delivered: ${allIds.length} | Unique Questions: ${uniqueSet.size} | Repeat Count: ${repeats}`,
    'color: #8b5cf6; font-weight: bold; font-size: 14px;'
  );

  // Clean up test runner in localStorage
  resetStudentSeenQuestions(testUserId, subject);

  return {
    totalDelivered: allIds.length,
    uniqueCount: uniqueSet.size,
    repeats,
    sprints: results,
  };
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testRunFiveSprints = testRunFiveSprints;
}


/**
 * Initializes and starts an attempt document with timer.
 */
export async function startAttempt(
  attemptId: string,
  questions: AttemptQuestion[],
  durationSeconds: number,
  timed: boolean
): Promise<{ endsAt: Timestamp | null }> {
  const endsAt = timed
    ? Timestamp.fromMillis(Date.now() + durationSeconds * 1000)
    : null;

  const docRef = doc(db, 'attempts', attemptId);
  await updateDoc(docRef, {
    status: 'in_progress',
    questions,
    totalQuestions: questions.length,
    startedAt: serverTimestamp(),
    endsAt,
  });

  return { endsAt };
}

/**
 * Debounced progress autosave for student answers.
 */
export async function saveAttemptProgress(
  attemptId: string,
  userAnswers: Record<string, number>,
  flagged: number[]
): Promise<void> {
  try {
    const docRef = doc(db, 'attempts', attemptId);
    await updateDoc(docRef, {
      userAnswers,
      flagged,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[testEngine] Autosave progress note:', err);
  }
}

export interface AttemptResultMetrics {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  percentage: number;
  timeTakenSeconds: number;
}

/**
 * Submits an attempt:
 * - Reads secret keys from collection `questionKeys` for scoring
 * - Shuffled option order mapping resolves user selections accurately
 * - Calculates official exam score using university negative marking
 * - Updates `users/{uid}/chapterStats/{chapterSlug}` by chapter slug ONLY
 * - Updates daily limits & streaks in PKT
 */
export async function submitAttempt(
  attemptId: string,
  attempt: AttemptDoc,
  userAnswers: Record<string, number>,
  timeTakenSeconds: number,
  uid: string
): Promise<AttemptResultMetrics> {
  const questions = attempt.questions ?? [];
  const totalQuestions = questions.length;

  // 1. Fetch secret answer keys from `questionKeys` with fallback to `questions` doc
  const questionKeyMap = new Map<string, { correct: unknown; explain?: string }>();
  await Promise.all(
    questions.map(async (q) => {
      try {
        if (ENABLE_MULTI_SOURCE_BANK) {
          const msKey = await fetchMultiSourceQuestionKey(q.id, q.subject);
          if (msKey) {
            questionKeyMap.set(q.id, msKey);
            return;
          }
        }

        // First check dedicated subject pool if applicable
        if (q.subject && isSubjectPoolSupported(q.subject)) {
          const poolColl = getSubjectPoolCollection(q.subject);
          const poolSnap = await getDoc(doc(db, poolColl, q.id));
          if (poolSnap.exists()) {
            const pData = poolSnap.data();
            questionKeyMap.set(q.id, {
              correct: pData.correct !== undefined ? pData.correct : pData.correctAnswer,
              explain: pData.explain || pData.explanation || '',
            });
            return;
          }
        }

        const keySnap = await getDoc(doc(db, 'questionKeys', q.id));
        if (keySnap.exists()) {
          const kData = keySnap.data();
          questionKeyMap.set(q.id, {
            correct: kData.correct !== undefined ? kData.correct : kData.correctAnswer,
            explain: kData.explain || kData.explanation || '',
          });
          return;
        }

        // Fallback: check questions doc in case keys collection didn't have it
        const qSnap = await getDoc(doc(db, 'questions', q.id));
        if (qSnap.exists()) {
          const qData = qSnap.data();
          if (qData.correct !== undefined || qData.correctAnswer !== undefined) {
            questionKeyMap.set(q.id, {
              correct: qData.correct !== undefined ? qData.correct : qData.correctAnswer,
              explain: qData.explain || qData.explanation || '',
            });
            return;
          }
        }

        // Fallback to in-memory question doc fields if present
        const anyQ = q as unknown as Record<string, unknown>;
        if (anyQ.correct !== undefined || anyQ.correctAnswer !== undefined) {
          questionKeyMap.set(q.id, {
            correct: anyQ.correct !== undefined ? anyQ.correct : anyQ.correctAnswer,
            explain: (anyQ.explain as string) || (anyQ.explanation as string) || '',
          });
        }
      } catch (keyErr) {
        console.warn(`[testEngine] Could not load key for ${q.id}:`, keyErr);
      }
    })
  );

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let earnedMarks = 0;
  let maxMarks = 0;

  // Track chapter breakdown by chapter SLUG only
  const chapterAcc: Record<string, { subjectSlug: string; correct: number; total: number }> = {};

  // Enrich questions with answer key for result review
  const enrichedQuestions: AttemptQuestion[] = questions.map((q, idx) => {
    const selectedShuffledIndex = userAnswers[String(idx)];
    const key = questionKeyMap.get(q.id);

    const chSlug = q.chapter || 'general';
    const subSlug = q.subject || 'general';

    const isSprint =
      attempt.mode === 'sprint' ||
      (attempt.title && attempt.title.toLowerCase().includes('sprint')) ||
      (attempt.university && attempt.university.toLowerCase().includes('sprint'));
    const sectionConfig = isSprint
      ? {
          correctMarks: 1.0,
          negativePenalty: 0.0,
          hasPenalty: false,
          subject: subSlug,
          name: 'Sprint',
          count: 10,
          badgeLabel: '+1.0 / 0.0 NO PENALTY',
        }
      : getSectionCriteria(attempt.university, subSlug);
    maxMarks += sectionConfig.correctMarks;

    if (!chapterAcc[chSlug]) {
      chapterAcc[chSlug] = { subjectSlug: subSlug, correct: 0, total: 0 };
    }

    // Determine original options array using optionMapping
    const currentOptions = Array.isArray(q.options) ? q.options : [];
    let originalOptions: string[] = [...currentOptions];
    if (Array.isArray(q.optionMapping) && q.optionMapping.length === currentOptions.length) {
      originalOptions = new Array(currentOptions.length);
      q.optionMapping.forEach((origIdx, shufIdx) => {
        originalOptions[origIdx] = currentOptions[shufIdx];
      });
    }

    // Robust resolution of correct answer
    const rawKey = key?.correct;
    const resolved = normalizeCorrectAnswer(rawKey, originalOptions);

    let correctOriginalIndex = resolved?.correctIndex ?? 0;
    const correctOptionText = resolved?.correctText || originalOptions[correctOriginalIndex] || '';

    // Calculate position in current shuffled options
    let correctInShuffledOrder = correctOriginalIndex;
    if (Array.isArray(q.optionMapping) && q.optionMapping.length > 0) {
      const mappedPos = q.optionMapping.indexOf(correctOriginalIndex);
      if (mappedPos !== -1) {
        correctInShuffledOrder = mappedPos;
      }
    }

    let isCorrect = false;

    if (selectedShuffledIndex === undefined || selectedShuffledIndex === null) {
      unansweredCount += 1;
    } else {
      chapterAcc[chSlug].total += 1;

      const studentChosenText = currentOptions[selectedShuffledIndex];
      const origChoice = Array.isArray(q.optionMapping)
        ? q.optionMapping[selectedShuffledIndex]
        : selectedShuffledIndex;

      // Triple verification: by shuffled index, by original index, and by exact option text
      const isIndexMatch = selectedShuffledIndex === correctInShuffledOrder;
      const isOrigIndexMatch = origChoice === correctOriginalIndex;
      const isTextMatch =
        Boolean(studentChosenText) &&
        Boolean(correctOptionText) &&
        studentChosenText.trim().toLowerCase() === correctOptionText.trim().toLowerCase();

      if (isIndexMatch || isOrigIndexMatch || isTextMatch) {
        correctCount += 1;
        chapterAcc[chSlug].correct += 1;
        isCorrect = true;
        earnedMarks += sectionConfig.correctMarks;
      } else {
        wrongCount += 1;
        earnedMarks += sectionConfig.negativePenalty;
      }
    }

    // Stored explanation: ONLY show real saved explanation, never the placeholder!
    const savedExplain = (key?.explain || '').trim();

    return {
      ...q,
      correct: correctInShuffledOrder,
      correctIndex: correctInShuffledOrder,
      correctOptionText,
      isCorrect,
      explain: savedExplain,
      explanation: savedExplain,
    };
  });

  // Calculate score with official university & section marking scheme
  const score = Math.max(0, Math.round(earnedMarks * 100) / 100);
  const percentage =
    maxMarks > 0 ? Math.max(0, Math.min(100, Math.round((earnedMarks / maxMarks) * 100))) : 0;

  // Save completed attempt document
  const docRef = doc(db, 'attempts', attemptId);
  await updateDoc(docRef, {
    status: 'completed',
    questions: enrichedQuestions,
    userAnswers,
    score,
    maxMarks,
    earnedMarks,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unanswered: unansweredCount,
    percentage,
    timeTakenSeconds,
    submittedAt: serverTimestamp(),
  });

  // 2. Update users/{uid}/chapterStats subcollection strictly by chapter SLUG
  try {
    for (const [cSlug, stat] of Object.entries(chapterAcc)) {
      if (!cSlug || stat.total === 0) continue;
      const chRef = doc(db, 'users', uid, 'chapterStats', cSlug);
      await setDoc(
        chRef,
        {
          chapter: cSlug,
          subject: stat.subjectSlug,
          correct: increment(stat.correct),
          total: increment(stat.total),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (statErr) {
    console.warn('[testEngine] Failed to update chapterStats:', statErr);
  }

  // 3. Update daily usage & questions in PKT timezone
  const pktDateKey = getPKTDateKey();
  try {
    const answeredCount = correctCount + wrongCount;
    const usageRef = doc(db, 'users', uid, 'usage', pktDateKey);
    await setDoc(
      usageRef,
      {
        practiceAttempts: increment(1),
        questionsSolved: increment(answeredCount),
        accuracy: percentage,
        timeSpentSeconds: increment(timeTakenSeconds),
        subjects: arrayUnion(attempt.subject || 'general'),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[testEngine] Failed to record daily usage:', err);
  }

  // 4. Update user streak
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const udata = userSnap.data();
      const lastActive = udata.lastActiveDate as string | undefined;
      const prevStreak = Number(udata.streak ?? 0);

      let newStreak = prevStreak;
      if (lastActive !== pktDateKey) {
        newStreak = prevStreak + 1;
      }

      await updateDoc(userDocRef, {
        streak: newStreak,
        lastActiveDate: pktDateKey,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (streakErr) {
    console.warn('[testEngine] Streak update notice:', streakErr);
  }

  // 5. Compact write for seen questions to Firestore at test completion
  try {
    if (uid && uid !== 'guest') {
      const bySubject: Record<string, string[]> = {};
      for (const q of questions) {
        if (!q.id) continue;
        const sSlug = findSubjectSlug(q.subject || '') || (q.subject || 'mathematics').toLowerCase();
        if (!bySubject[sSlug]) bySubject[sSlug] = [];
        bySubject[sSlug].push(q.id);
      }
      for (const [sub, qIds] of Object.entries(bySubject)) {
        await persistSeenQuestionsToFirestore(uid, sub, qIds);
      }
    }
  } catch (seenErr) {
    console.warn('[testEngine] Seen questions write notice:', seenErr);
  }

  return {
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unanswered: unansweredCount,
    percentage,
    timeTakenSeconds,
  };
}

/**
 * Student Report Question action: saves report doc in `questionReports` collection.
 */
export async function reportQuestion(params: {
  questionId: string;
  reason: 'wrong_key' | 'broken_math' | 'unclear' | 'other' | string;
  comment?: string;
  userId: string;
  userEmail?: string;
}): Promise<void> {
  const reportRef = doc(collection(db, 'questionReports'));
  await robustSaveDoc(reportRef, {
    questionId: params.questionId,
    reason: params.reason,
    comment: params.comment || '',
    userId: params.userId,
    userEmail: params.userEmail || '',
    status: 'open',
    createdAt: serverTimestamp(),
  });
}

/**
 * Re-grades an existing attempt document after correcting keys or algorithms.
 */
export async function regradeAttempt(attemptId: string): Promise<AttemptDoc> {
  const attempt = await getAttempt(attemptId);
  const questions = attempt.questions || [];
  const userAnswers = attempt.userAnswers || {};

  // Fetch keys with fallback
  const questionKeyMap = new Map<string, { correct: unknown; explain?: string }>();
  await Promise.all(
    questions.map(async (q) => {
      try {
        if (q.subject && isSubjectPoolSupported(q.subject)) {
          const poolColl = getSubjectPoolCollection(q.subject);
          const poolSnap = await getDoc(doc(db, poolColl, q.id));
          if (poolSnap.exists()) {
            const pData = poolSnap.data();
            questionKeyMap.set(q.id, {
              correct: pData.correct !== undefined ? pData.correct : pData.correctAnswer,
              explain: pData.explain || pData.explanation || '',
            });
            return;
          }
        }

        const keySnap = await getDoc(doc(db, 'questionKeys', q.id));
        if (keySnap.exists()) {
          const kData = keySnap.data();
          questionKeyMap.set(q.id, {
            correct: kData.correct !== undefined ? kData.correct : kData.correctAnswer,
            explain: kData.explain || kData.explanation || '',
          });
          return;
        }
        const qSnap = await getDoc(doc(db, 'questions', q.id));
        if (qSnap.exists()) {
          const qData = qSnap.data();
          questionKeyMap.set(q.id, {
            correct: qData.correct !== undefined ? qData.correct : qData.correctAnswer,
            explain: qData.explain || qData.explanation || '',
          });
        }
      } catch (err) {
        console.warn(`[regradeAttempt] key load error for ${q.id}:`, err);
      }
    })
  );

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let earnedMarks = 0;
  let maxMarks = 0;

  const enrichedQuestions = questions.map((q, idx) => {
    const selectedShuffledIndex = userAnswers[String(idx)];
    const key = questionKeyMap.get(q.id);
    const subSlug = q.subject || 'general';
    const sectionConfig = getSectionCriteria(attempt.university, subSlug);
    maxMarks += sectionConfig.correctMarks;

    const currentOptions = Array.isArray(q.options) ? q.options : [];
    let originalOptions = [...currentOptions];
    if (Array.isArray(q.optionMapping) && q.optionMapping.length === currentOptions.length) {
      originalOptions = new Array(currentOptions.length);
      q.optionMapping.forEach((origIdx, shufIdx) => {
        originalOptions[origIdx] = currentOptions[shufIdx];
      });
    }

    const resolved = normalizeCorrectAnswer(key?.correct, originalOptions);
    const correctOriginalIndex = resolved?.correctIndex ?? 0;
    const correctOptionText = resolved?.correctText || originalOptions[correctOriginalIndex] || '';

    let correctInShuffledOrder = correctOriginalIndex;
    if (Array.isArray(q.optionMapping) && q.optionMapping.length > 0) {
      const mappedPos = q.optionMapping.indexOf(correctOriginalIndex);
      if (mappedPos !== -1) {
        correctInShuffledOrder = mappedPos;
      }
    }

    let isCorrect = false;
    if (selectedShuffledIndex === undefined || selectedShuffledIndex === null) {
      unansweredCount += 1;
    } else {
      const studentChosenText = currentOptions[selectedShuffledIndex];
      const origChoice = Array.isArray(q.optionMapping)
        ? q.optionMapping[selectedShuffledIndex]
        : selectedShuffledIndex;

      const isIndexMatch = selectedShuffledIndex === correctInShuffledOrder;
      const isOrigIndexMatch = origChoice === correctOriginalIndex;
      const isTextMatch =
        Boolean(studentChosenText) &&
        Boolean(correctOptionText) &&
        studentChosenText.trim().toLowerCase() === correctOptionText.trim().toLowerCase();

      if (isIndexMatch || isOrigIndexMatch || isTextMatch) {
        correctCount += 1;
        isCorrect = true;
        earnedMarks += sectionConfig.correctMarks;
      } else {
        wrongCount += 1;
        earnedMarks += sectionConfig.negativePenalty;
      }
    }

    const savedExplain = (key?.explain || q.explain || '').trim();

    return {
      ...q,
      correct: correctInShuffledOrder,
      correctIndex: correctInShuffledOrder,
      correctOptionText,
      isCorrect,
      explain: savedExplain,
      explanation: savedExplain,
    };
  });

  const score = Math.max(0, Math.round(earnedMarks * 100) / 100);
  const percentage =
    maxMarks > 0 ? Math.max(0, Math.min(100, Math.round((earnedMarks / maxMarks) * 100))) : 0;

  const docRef = doc(db, 'attempts', attemptId);
  const updatedData = {
    questions: enrichedQuestions,
    score,
    maxMarks,
    earnedMarks,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unanswered: unansweredCount,
    percentage,
    regradedAt: serverTimestamp(),
  };

  await updateDoc(docRef, updatedData);
  return { ...attempt, ...updatedData } as AttemptDoc;
}
