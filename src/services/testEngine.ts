import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
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
  findChapterSlug,
  formatSubjectName,
} from '@/constants/taxonomy';
import { getUniversityCriteria, getSectionCriteria } from '@/constants/universityCriteria';
import type { QueryConstraint } from 'firebase/firestore';
import type { AttemptDoc, AttemptQuestion, Question, QuestionKey } from '@/types/index';

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

/**
 * Fetches questions from Firestore using index-friendly `rand` queries.
 * Queries ONLY status == "published" && active == true.
 * Never loads the whole question bank into memory.
 */
export async function fetchQuestionsForAttempt(attempt: Partial<AttemptDoc>): Promise<AttemptQuestion[]> {
  const questionsColl = collection(db, 'questions');

  // Full Mock Test: generate MCQs per the selected university's real paper pattern
  if (attempt.mode === 'full') {
    const criteria = getUniversityCriteria(attempt.university);
    const collectedQuestions: Question[] = [];
    const seenIds = new Set<string>();

    for (const split of criteria.subjectsSplit) {
      const subSlug = findSubjectSlug(split.subject) || split.subject.toLowerCase();
      try {
        const subQuery = query(
          questionsColl,
          where('status', '==', 'published'),
          where('active', '==', true),
          where('subject', '==', subSlug),
          limit(split.count * 2)
        );
        const snap = await getDocs(subQuery);
        if (snap.empty) {
          throw new Error(
            `Not enough questions yet for ${formatSubjectName(subSlug)}. Please select another subject or check back soon.`
          );
        }
        const pool = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Question))
          .filter((q) => !seenIds.has(q.id));

        const chosen = shuffleArray(pool).slice(0, split.count);
        chosen.forEach((q) => {
          seenIds.add(q.id);
          collectedQuestions.push(q);
        });
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message;
        if (msg && msg.includes('Not enough questions yet')) {
          throw err;
        }
        throw new Error(
          `Not enough questions yet for ${formatSubjectName(subSlug)}. Please select another subject or check back soon.`
        );
      }
    }

    return collectedQuestions.map((q) => {
      const rawOptions = Array.isArray(q.options) && q.options.length === 4
        ? q.options
        : (['A', 'B', 'C', 'D'] as [string, string, string, string]);

      const { shuffledOptions, optionMapping } = shuffleOptions(rawOptions);
      return {
        id: q.id,
        q: q.q || q.stem || '',
        options: shuffledOptions,
        optionMapping,
        subject: q.subject || 'general',
        chapter: q.chapter || 'general',
        difficulty: q.difficulty || 'medium',
      };
    });
  }

  const needed = Math.max(1, attempt.totalQuestions || 10);
  const subjectSlug = findSubjectSlug(attempt.subject || '') || (attempt.subject ? attempt.subject.toLowerCase() : undefined);
  const chapterSlug = attempt.chapter ? findChapterSlug(subjectSlug || 'mathematics', attempt.chapter) || attempt.chapter.toLowerCase() : undefined;

  const r = Math.random();
  const collectedMap = new Map<string, Question>();

  if (import.meta.env.DEV) {
    console.log('[Firestore Index Notice] Querying questions with parameters:', {
      status: 'published',
      active: true,
      subject: subjectSlug,
      chapter: chapterSlug,
      randAnchor: r,
      limit: needed,
    });
    console.log(
      `[Firestore Index] Required composite index: questions collection: status (Asc), active (Asc), subject (Asc)${
        chapterSlug ? ', chapter (Asc)' : ''
      }, rand (Asc)`
    );
  }

  // Helper query executor
  async function runQuery(operator: '>=' | '<', limitCount: number) {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('active', '==', true),
      ];

      if (subjectSlug && subjectSlug !== 'all' && subjectSlug !== 'general') {
        constraints.push(where('subject', '==', subjectSlug));
      }

      if (chapterSlug && chapterSlug !== 'all') {
        constraints.push(where('chapter', '==', chapterSlug));
      }

      constraints.push(where('rand', operator, r));
      constraints.push(orderBy('rand', 'asc'));
      constraints.push(limit(limitCount));

      const q = query(questionsColl, ...constraints);
      const snap = await getDocs(q);

      snap.docs.forEach((d) => {
        if (!collectedMap.has(d.id)) {
          collectedMap.set(d.id, { id: d.id, ...d.data() } as Question);
        }
      });
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.warn(`[testEngine] Query with rand ${operator} notice:`, err);
      }
    }
  }

  // 1. First pass: rand >= r
  await runQuery('>=', needed * 2);

  // 2. Wrap-around pass: rand < r if we still need more questions
  if (collectedMap.size < needed) {
    await runQuery('<', needed * 2);
  }

  // 3. Fallback: if chapter query yielded fewer questions, loosen chapter constraint
  if (collectedMap.size < needed && chapterSlug) {
    try {
      const looseQuery = query(
        questionsColl,
        where('status', '==', 'published'),
        where('active', '==', true),
        ...(subjectSlug && subjectSlug !== 'all' && subjectSlug !== 'general' ? [where('subject', '==', subjectSlug)] : []),
        limit(needed)
      );
      const snap = await getDocs(looseQuery);
      snap.docs.forEach((d) => {
        if (!collectedMap.has(d.id)) {
          collectedMap.set(d.id, { id: d.id, ...d.data() } as Question);
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[testEngine] Loosened chapter query note:', err);
      }
    }
  }

  // 4. Final fallback: general published & active questions
  if (collectedMap.size < needed) {
    try {
      const generalQ = query(
        questionsColl,
        where('status', '==', 'published'),
        where('active', '==', true),
        limit(needed * 2)
      );
      const snap = await getDocs(generalQ);
      snap.docs.forEach((d) => {
        if (!collectedMap.has(d.id)) {
          collectedMap.set(d.id, { id: d.id, ...d.data() } as Question);
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[testEngine] General pool fallback note:', err);
      }
    }
  }

  const rawList = Array.from(collectedMap.values());
  const randomized = shuffleArray(rawList).slice(0, needed);

  // Convert to AttemptQuestion with shuffled options and optionMapping.
  // Note: NEVER include correct answer or explanation here!
  return randomized.map((q) => {
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
      subject: q.subject || 'general',
      chapter: q.chapter || 'general',
      difficulty: q.difficulty || 'medium',
    };
  });
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

  // 1. Fetch secret answer keys from `questionKeys` collection
  const questionKeyMap = new Map<string, QuestionKey>();
  await Promise.all(
    questions.map(async (q) => {
      try {
        const keySnap = await getDoc(doc(db, 'questionKeys', q.id));
        if (keySnap.exists()) {
          questionKeyMap.set(q.id, { id: keySnap.id, ...keySnap.data() } as QuestionKey);
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
  // Answered definition: Student selected an option in a completed attempt
  const chapterAcc: Record<string, { subjectSlug: string; correct: number; total: number }> = {};

  // Enrich questions with answer key for result review
  const enrichedQuestions: AttemptQuestion[] = questions.map((q, idx) => {
    const selectedShuffledIndex = userAnswers[String(idx)];
    const key = questionKeyMap.get(q.id);

    const chSlug = q.chapter || 'general';
    const subSlug = q.subject || 'general';

    const sectionConfig = getSectionCriteria(attempt.university, subSlug);
    maxMarks += sectionConfig.correctMarks;

    if (!chapterAcc[chSlug]) {
      chapterAcc[chSlug] = { subjectSlug: subSlug, correct: 0, total: 0 };
    }

    let isCorrect = false;
    let originalChoice: number | undefined = undefined;

    if (selectedShuffledIndex === undefined || selectedShuffledIndex === null) {
      unansweredCount += 1;
    } else {
      // Question counts as answered ONLY if student selected an option
      chapterAcc[chSlug].total += 1;

      // Translate shuffled option selection to original index using optionMapping
      originalChoice = Array.isArray(q.optionMapping)
        ? q.optionMapping[selectedShuffledIndex]
        : selectedShuffledIndex;

      if (key && originalChoice === key.correct) {
        correctCount += 1;
        chapterAcc[chSlug].correct += 1;
        isCorrect = true;
        earnedMarks += sectionConfig.correctMarks;
      } else {
        wrongCount += 1;
        earnedMarks += sectionConfig.negativePenalty;
      }
    }

    // In review mode, provide the correct index relative to the shuffled options
    let correctInShuffledOrder: number | undefined = undefined;
    if (key && Array.isArray(q.optionMapping)) {
      correctInShuffledOrder = q.optionMapping.indexOf(key.correct);
    } else if (key) {
      correctInShuffledOrder = key.correct;
    }

    return {
      ...q,
      correct: correctInShuffledOrder,
      correctIndex: correctInShuffledOrder,
      isCorrect,
      explain: key?.explain || 'Explanation available in the study portal.',
      explanation: key?.explain || 'Explanation available in the study portal.',
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
