import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  setDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import type { AttemptDoc, AttemptQuestion, Question } from '@/types/index';
import { BALANCED_500_QUESTIONS } from '@/data/seedBalancedPool';

/**
 * Loads an existing attempt document by ID.
 */
export async function getAttempt(attemptId: string): Promise<AttemptDoc> {
  const docRef = doc(db, 'attempts', attemptId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error(`Attempt ${attemptId} not found`);
  }
  return { id: snap.id, ...snap.data() } as AttemptDoc;
}

/**
 * Generates a batch of questions via server API route /api/tests/generate with retries
 * and automatic fallback to client-side balanced question pool.
 */
export async function generateTestBatch(params: {
  university?: string;
  subject?: string;
  chapter?: string;
  batchIndex: number;
  count: number;
  excludeIds?: string[];
  signal?: AbortSignal;
}): Promise<{ questions: AttemptQuestion[]; hasMore: boolean }> {
  const count = params.count || 5;
  const excludeIds = params.excludeIds || [];

  // Try API route with retry logic (up to 2 retries)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university: params.university,
          subject: params.subject,
          chapter: params.chapter,
          batchIndex: params.batchIndex,
          count,
          excludeIds,
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data?.questions && Array.isArray(data.questions)) {
        return {
          questions: data.questions,
          hasMore: Boolean(data.hasMore),
        };
      }
    } catch (err: unknown) {
      if (params.signal?.aborted) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  // Graceful fallback from client-side BALANCED_500_QUESTIONS if API route failed
  console.warn('[testEngine] generateTestBatch falling back to client pool:', lastError);
  const excludeSet = new Set(excludeIds);
  const available = BALANCED_500_QUESTIONS.filter((q) => !excludeSet.has(q.id));
  const pool = available.length >= count ? available : BALANCED_500_QUESTIONS;
  const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

  return {
    questions: shuffled.map((q) => normalizeQuestionDoc(q.id, q)),
    hasMore: pool.length > count,
  };
}

import { normalizeMath } from '@/lib/math';

/**
 * Filter and convert math to proper KaTeX syntax before displaying.
 * Logs and safely falls back if parsing/conversion encounters issues.
 */
function prefilterAndConvertMath(text: string): string {
  if (!text || typeof text !== 'string') return '';
  try {
    return normalizeMath(text);
  } catch (err) {
    console.warn('[MathFilter] Failed to normalize math, using safe fallback:', err, text);
    return text;
  }
}

/**
 * Normalizes question document from Firestore into a consistent AttemptQuestion format.
 */
function normalizeQuestionDoc(id: string, data: Partial<Question>): AttemptQuestion {
  const rawQ = data.q ?? data.question ?? 'Untitled Question';
  const qText = prefilterAndConvertMath(rawQ);
  const rawOpts = data.options ?? [];
  const options = Array.isArray(rawOpts) && rawOpts.length >= 2
    ? rawOpts.map((opt) => prefilterAndConvertMath(String(opt)))
    : ['Option A', 'Option B', 'Option C', 'Option D'];

  let correctIdx = 0;
  if (typeof data.correct === 'number') {
    correctIdx = data.correct;
  } else if (typeof data.correctAnswer === 'number') {
    correctIdx = data.correctAnswer;
  }

  const rawExplain = data.explain ?? data.explanation ?? '';

  return {
    id,
    q: qText,
    options,
    correct: Math.min(Math.max(0, correctIdx), options.length - 1),
    explain: prefilterAndConvertMath(rawExplain),
    subject: data.subject ?? 'General',
    chapter: data.chapter ?? data.topic ?? '',
    difficulty: data.difficulty ?? 'Medium',
    university: data.university,
  };
}

/**
 * Shuffles an array with Fisher-Yates.
 */
function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

/**
 * Fetches questions from Firestore matching attempt criteria (with intelligent fallback).
 */
export async function fetchQuestionsForAttempt(attempt: AttemptDoc): Promise<AttemptQuestion[]> {
  const questionsColl = collection(db, 'questions');
  const needed = attempt.totalQuestions || 20;
  const questionsMap = new Map<string, AttemptQuestion>();

  // 1. Try specific subject query if specified
  if (attempt.subject && attempt.subject !== 'Any') {
    try {
      const q = query(questionsColl, where('subject', '==', attempt.subject), limit(needed * 2));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        questionsMap.set(d.id, normalizeQuestionDoc(d.id, d.data() as Partial<Question>));
      });
    } catch (e) {
      console.warn('[testEngine] Filtered question query fallback:', e);
    }
  }

  // 2. If we need more questions, load general pool
  if (questionsMap.size < needed) {
    try {
      const fallbackQuery = query(questionsColl, limit(Math.max(50, needed * 2)));
      const snap = await getDocs(fallbackQuery);
      snap.docs.forEach((d) => {
        questionsMap.set(d.id, normalizeQuestionDoc(d.id, d.data() as Partial<Question>));
      });
    } catch (e) {
      console.error('[testEngine] General question query error:', e);
    }
  }

  // 3. Fallback from balanced pool if database returned fewer than needed
  if (questionsMap.size < needed) {
    const matchingSubject =
      attempt.subject && attempt.subject !== 'Any' && attempt.subject !== 'General'
        ? BALANCED_500_QUESTIONS.filter(
            (q) => q.subject?.toLowerCase() === attempt.subject?.toLowerCase()
          )
        : BALANCED_500_QUESTIONS;

    const pool =
      matchingSubject.length >= needed - questionsMap.size
        ? matchingSubject
        : BALANCED_500_QUESTIONS;
    const shuffledPool = shuffle(pool);

    for (const q of shuffledPool) {
      if (questionsMap.size >= needed) break;
      if (!questionsMap.has(q.id)) {
        questionsMap.set(q.id, normalizeQuestionDoc(q.id, q));
      }
    }
  }

  const all = Array.from(questionsMap.values());
  return shuffle(all).slice(0, needed);
}

/**
 * Initializes and starts an attempt with questions and server-synced endsAt timer.
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
 * Debounced progress autosave.
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
    });
  } catch (err) {
    console.warn('[testEngine] Autosave progress failed:', err);
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
 * Submits the attempt, calculates score (with negative marking if FAST-NUCES),
 * updates usage limits in PKT, and updates chapter stats.
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

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  // Track chapter breakdown
  const chapterAcc: Record<string, { subject: string; correct: number; total: number }> = {};

  const isFastNuces =
    attempt.university?.toUpperCase().includes('FAST') ||
    attempt.university?.toUpperCase().includes('NUCES');

  questions.forEach((q, idx) => {
    const ans = userAnswers[String(idx)];
    const chName = q.chapter || q.subject || 'General';

    if (!chapterAcc[chName]) {
      chapterAcc[chName] = { subject: q.subject || 'General', correct: 0, total: 0 };
    }
    chapterAcc[chName].total += 1;

    if (ans === undefined || ans === null) {
      unansweredCount += 1;
    } else if (ans === q.correct) {
      correctCount += 1;
      chapterAcc[chName].correct += 1;
    } else {
      wrongCount += 1;
    }
  });

  // Score calculation: FAST has -0.25 negative marking per incorrect answer
  let rawScore = correctCount;
  if (isFastNuces) {
    rawScore = correctCount - wrongCount * 0.25;
  }
  const score = Math.max(0, Math.round(rawScore * 100) / 100);
  const percentage = totalQuestions > 0 ? Math.max(0, Math.round((score / totalQuestions) * 100)) : 0;

  const docRef = doc(db, 'attempts', attemptId);
  await updateDoc(docRef, {
    status: 'completed',
    userAnswers,
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unanswered: unansweredCount,
    percentage,
    timeTakenSeconds,
    submittedAt: serverTimestamp(),
  });

  // 1. Update daily usage in PKT timezone
  try {
    const pktDateKey = getPKTDateKey();
    const usageRef = doc(db, 'users', uid, 'usage', pktDateKey);
    await setDoc(usageRef, { practiceAttempts: increment(1) }, { merge: true });
  } catch (err) {
    console.warn('[testEngine] Failed to increment daily usage:', err);
  }

  // 2. Update chapter stats subcollection for WeakChapters
  try {
    const entries = Object.entries(chapterAcc);
    for (const [ch, stat] of entries) {
      // Safe ID for Firestore doc
      const safeId = ch.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
      if (!safeId) continue;
      const chRef = doc(db, 'users', uid, 'chapterStats', safeId);
      await setDoc(
        chRef,
        {
          chapter: ch,
          subject: stat.subject,
          correct: increment(stat.correct),
          total: increment(stat.total),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[testEngine] Failed to update chapterStats:', err);
  }

  // 3. Mark first test completed in referrals if applicable
  try {
    const refQuery = query(
      collection(db, 'referrals'),
      where('referredUserId', '==', uid),
      limit(1)
    );
    const snap = await getDocs(refQuery);
    if (!snap.empty) {
      const referralDoc = snap.docs[0];
      await updateDoc(referralDoc.ref, {
        hasTakenFirstTest: true,
        firstTestCompleted: true,
        activated: true,
        activatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[testEngine] Referral activation update note:', err);
  }

  // 4. Update user streak in PKT timezone
  let currentStreak = 1;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const udata = userSnap.data();
      const lastActive = udata.lastActiveDate as string | undefined;
      const prevStreak = Number(udata.streak ?? 0);
      const pktDateKey = getPKTDateKey();

      if (lastActive === pktDateKey) {
        currentStreak = Math.max(1, prevStreak);
      } else if (lastActive) {
        const today = new Date(pktDateKey);
        const last = new Date(lastActive);
        const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          currentStreak = prevStreak + 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      await setDoc(
        userDocRef,
        {
          streak: currentStreak,
          lastActiveDate: getPKTDateKey(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[testEngine] Failed to update user streak:', err);
  }

  // 5. Update global leaderboard
  try {
    const lbRef = doc(db, 'leaderboard', uid);
    const userSnap = await getDoc(doc(db, 'users', uid));
    const udata = userSnap.exists() ? userSnap.data() : {};
    await setDoc(
      lbRef,
      {
        uid,
        displayName: udata.displayName || (udata.email ? udata.email.split('@')[0] : 'Student'),
        university: attempt.university || udata.targetUniversity || 'General',
        score: increment(score),
        testsCompleted: increment(1),
        accuracy: percentage,
        streak: currentStreak,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[testEngine] Failed to update leaderboard entry:', err);
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
