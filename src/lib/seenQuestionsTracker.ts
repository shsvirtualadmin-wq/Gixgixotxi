import { Question } from '../types';
import { normalizeQuestionStem, deduplicateQuestions } from './shuffle';

export interface SeenMcqRecord {
  stem: string;
  questionId?: string;
  subject: string;
  topic?: string;
  chapter?: string;
  seenCount: number;
  lastSeenTimestamp: number;
}

const STORAGE_PREFIX = 'boardly_seen_mcqs_v1_';

function getStorageKey(studentId?: string): string {
  const cleanId = (studentId || 'guest').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `${STORAGE_PREFIX}${cleanId}`;
}

/**
 * Loads all seen MCQ records for a student from LocalStorage.
 */
export function getSeenQuestionsMap(studentId?: string): Map<string, SeenMcqRecord> {
  const map = new Map<string, SeenMcqRecord>();
  if (typeof window === 'undefined' || !window.localStorage) return map;

  try {
    const key = getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: SeenMcqRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.stem) {
            map.set(item.stem, item);
          }
        }
      }
    }

    // Note: Do not automatically merge guest seen questions into a real student's session
    // to keep student records cleanly isolated per account.
  } catch (err) {
    console.warn('[SeenTracker] Error loading seen questions from storage:', err);
  }

  return map;
}

/**
 * Clear seen questions for a specific student or guest
 */
export function clearSeenQuestions(studentId?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = getStorageKey(studentId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[SeenTracker] Error clearing seen questions:', err);
  }
}

/**
 * Completely purge ALL seen question tracking records from localStorage
 */
export function clearAllSeenQuestions(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.warn('[SeenTracker] Error clearing all seen questions:', err);
  }
}

/**
 * Returns a Set of normalized stems for questions already seen by this student.
 */
export function getSeenStemsForStudent(studentId?: string, subject?: string): Set<string> {
  const map = getSeenQuestionsMap(studentId);
  const stems = new Set<string>();

  const normSub = subject ? subject.toLowerCase().trim() : undefined;

  for (const [stem, record] of map.entries()) {
    if (!normSub || !record.subject || record.subject.toLowerCase().includes(normSub) || normSub.includes(record.subject.toLowerCase())) {
      stems.add(stem);
    }
  }

  return stems;
}

/**
 * Marks a list of questions as seen by the student, persisting locally and sending to server.
 */
export function recordQuestionsAsSeen(
  studentId: string | undefined,
  questions: Question[],
  subject: string,
  topic?: string,
  chapter?: string
): void {
  if (!Array.isArray(questions) || questions.length === 0) return;

  const now = Date.now();
  const map = getSeenQuestionsMap(studentId);

  for (const q of questions) {
    const stem = normalizeQuestionStem(q.q || '');
    if (!stem) continue;

    const existing = map.get(stem);
    if (existing) {
      existing.seenCount = (existing.seenCount || 1) + 1;
      existing.lastSeenTimestamp = now;
      if (q.id) existing.questionId = q.id;
      if (topic) existing.topic = topic;
      if (chapter) existing.chapter = chapter;
    } else {
      map.set(stem, {
        stem,
        questionId: q.id,
        subject: subject || q.subject || 'General',
        topic: topic || q.topic,
        chapter: chapter || q.chapter,
        seenCount: 1,
        lastSeenTimestamp: now,
      });
    }
  }

  // Persist locally (cap to most recent 2000 seen questions)
  try {
    const key = getStorageKey(studentId);
    const records = Array.from(map.values())
      .sort((a, b) => b.lastSeenTimestamp - a.lastSeenTimestamp)
      .slice(0, 2000);
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.warn('[SeenTracker] Error saving seen questions locally:', err);
  }

  // Non-blocking sync to server API
  try {
    const payload = {
      studentId: studentId || 'guest',
      subject,
      chapter: chapter || topic,
      questions: questions.map(q => ({ q: q.q, id: q.id, topic: q.topic || topic })),
    };
    fetch('/api/log-seen-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Silent catch for offline mode
  }
}

/**
 * Synchronizes seen questions with the server on startup or login.
 */
export async function syncSeenQuestionsWithServer(
  studentId?: string,
  studentEmail?: string
): Promise<Set<string>> {
  const localStems = getSeenStemsForStudent(studentId);
  if (!studentId || studentId === 'guest') return localStems;

  try {
    const res = await fetch(`/api/student-seen-questions?studentId=${encodeURIComponent(studentId)}${studentEmail ? `&studentEmail=${encodeURIComponent(studentEmail)}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.seenStems)) {
        const map = getSeenQuestionsMap(studentId);
        let updated = false;

        for (const stem of data.seenStems) {
          const norm = normalizeQuestionStem(stem);
          if (norm && !map.has(norm)) {
            map.set(norm, {
              stem: norm,
              subject: 'General',
              seenCount: 1,
              lastSeenTimestamp: Date.now() - 3600000,
            });
            localStems.add(norm);
            updated = true;
          }
        }

        if (updated) {
          const records = Array.from(map.values())
            .sort((a, b) => b.lastSeenTimestamp - a.lastSeenTimestamp)
            .slice(0, 2000);
          localStorage.setItem(getStorageKey(studentId), JSON.stringify(records));
        }
      }
    }
  } catch (err) {
    console.warn('[SeenTracker] Server sync error:', err);
  }

  return localStems;
}

export interface PrioritizedSelectionResult<T> {
  selected: T[];
  isReviewSet: boolean;
  unseenCount: number;
  poolTotal: number;
  reviewNote?: string;
}

/**
 * Intelligent question selection that strictly prioritizes unseen questions over previously seen ones.
 *
 * 1. Categorizes the eligible pool into unseen vs seen sets using normalized question stems.
 * 2. If unseen questions >= requested count: returns randomized unseen questions (0% repeats).
 * 3. If unseen questions > 0 but < requested count: takes ALL unseen questions first,
 *    then fills remaining slots with least-recently/least-frequently seen questions.
 * 4. If unseen questions === 0 (student exhausted the pool for this scope):
 *    cycles through seen questions ordered by least seen (oldest lastSeen, lowest seenCount),
 *    and flags isReviewSet = true with an informative user note.
 */
export function selectPrioritizedQuestions<T extends Question>(
  pool: T[],
  param2: Set<string> | number,
  param3: number | Set<string>,
  seenMap?: Map<string, SeenMcqRecord>
): PrioritizedSelectionResult<T> {
  const seenStems: Set<string> = (param2 instanceof Set)
    ? param2
    : ((param3 instanceof Set) ? param3 : new Set<string>());
  const rawCount = typeof param2 === 'number' ? param2 : (typeof param3 === 'number' ? param3 : 10);
  const targetCount = Math.max(1, rawCount);
  const dedupedPool = deduplicateQuestions(pool);

  if (dedupedPool.length === 0) {
    return {
      selected: [],
      isReviewSet: false,
      unseenCount: 0,
      poolTotal: 0,
    };
  }

  const unseen: T[] = [];
  const seen: T[] = [];

  for (const q of dedupedPool) {
    const stem = normalizeQuestionStem(q.q || '');
    if (stem && seenStems.has(stem)) {
      seen.push(q);
    } else {
      unseen.push(q);
    }
  }

  // Shuffle unseen questions so repeat tests with large pools are fresh and randomized
  const shuffledUnseen = [...unseen].sort(() => 0.5 - Math.random());

  // Case A: Pool has enough unseen questions to satisfy the full test length
  if (shuffledUnseen.length >= targetCount) {
    return {
      selected: shuffledUnseen.slice(0, targetCount),
      isReviewSet: false,
      unseenCount: unseen.length,
      poolTotal: dedupedPool.length,
    };
  }

  // Sort seen pool by least seen (lowest seenCount, then oldest lastSeenTimestamp)
  const sortedSeen = [...seen].sort((a, b) => {
    const stemA = normalizeQuestionStem(a.q || '');
    const stemB = normalizeQuestionStem(b.q || '');
    const recA = seenMap?.get(stemA);
    const recB = seenMap?.get(stemB);

    const countA = recA?.seenCount || 1;
    const countB = recB?.seenCount || 1;
    if (countA !== countB) return countA - countB;

    const timeA = recA?.lastSeenTimestamp || 0;
    const timeB = recB?.lastSeenTimestamp || 0;
    return timeA - timeB;
  });

  // Case B: Pool has SOME unseen questions, but fewer than targetCount
  if (shuffledUnseen.length > 0) {
    const neededFromSeen = targetCount - shuffledUnseen.length;
    const recycledPortion = sortedSeen.slice(0, neededFromSeen);
    const combined = [...shuffledUnseen, ...recycledPortion];

    return {
      selected: combined,
      isReviewSet: false,
      unseenCount: unseen.length,
      poolTotal: dedupedPool.length,
    };
  }

  // Case C: Student has completed/seen ALL available questions for this scope (unseen === 0)
  const reviewSelection = sortedSeen.slice(0, targetCount);
  return {
    selected: reviewSelection,
    isReviewSet: true,
    unseenCount: 0,
    poolTotal: dedupedPool.length,
    reviewNote: "You've seen all available questions for this topic — showing a mixed review set",
  };
}
