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
 * Normalizes question document from Firestore into a consistent AttemptQuestion format.
 */
function normalizeQuestionDoc(id: string, data: Partial<Question>): AttemptQuestion {
  const qText = data.q ?? data.question ?? 'Untitled Question';
  const rawOpts = data.options ?? [];
  const options = Array.isArray(rawOpts) && rawOpts.length >= 2
    ? rawOpts.map(String)
    : ['Option A', 'Option B', 'Option C', 'Option D'];

  let correctIdx = 0;
  if (typeof data.correct === 'number') {
    correctIdx = data.correct;
  } else if (typeof data.correctAnswer === 'number') {
    correctIdx = data.correctAnswer;
  }

  return {
    id,
    q: qText,
    options,
    correct: Math.min(Math.max(0, correctIdx), options.length - 1),
    explain: data.explain ?? data.explanation ?? '',
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

  // 3. Fallback KaTeX questions if database returned 0 (e.g. offline or empty sandbox)
  if (questionsMap.size === 0) {
    const backupQuestions: AttemptQuestion[] = [
      {
        id: 'fallback-q-1',
        q: 'Evaluate the limit: $$\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$$',
        options: ['0', '1', '3', 'Does not exist'],
        correct: 2,
        explain: 'Using the standard formula $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$, we multiply and divide by 3: $$\\lim_{x \\to 0} 3 \\cdot \\frac{\\sin(3x)}{3x} = 3(1) = 3$$.',
        subject: 'Mathematics',
        chapter: 'Limits and Continuity',
        difficulty: 'Easy',
      },
      {
        id: 'fallback-q-2',
        q: 'A projectile is launched with velocity $$v_0$$ at angle $$\\theta$$ to the horizontal. The maximum horizontal range is achieved when $$\\theta$$ equals:',
        options: ['30°', '45°', '60°', '90°'],
        correct: 1,
        explain: 'The range formula is $$R = \\frac{v_0^2 \\sin(2\\theta)}{g}$$. The sine function attains its maximum value of 1 when $2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$.',
        subject: 'Physics',
        chapter: 'Motion and Force',
        difficulty: 'Easy',
      },
      {
        id: 'fallback-q-3',
        q: 'What is the derivative of $$f(x) = e^{2x} \\cos(x)$$ with respect to $$x$$?',
        options: [
          '$$e^{2x}(2\\cos(x) - \\sin(x))$$',
          '$$e^{2x}(\\cos(x) - 2\\sin(x))$$',
          '$$2e^{2x}\\cos(x)$$',
          '$$-e^{2x}\\sin(x)$$',
        ],
        correct: 0,
        explain: 'By the product rule $$(uv)\' = u\'v + uv\'$$: $$f\'(x) = (2e^{2x})\\cos(x) + e^{2x}(-\\sin(x)) = e^{2x}(2\\cos(x) - \\sin(x))$$.',
        subject: 'Mathematics',
        chapter: 'Differentiation',
        difficulty: 'Medium',
      },
      {
        id: 'fallback-q-4',
        q: 'The SI unit of magnetic flux density $$\\vec{B}$$ is the Tesla (T), which is equivalent to:',
        options: ['$$\\text{N}\\cdot\\text{A}^{-1}\\cdot\\text{m}^{-1}$$', '$$\\text{N}\\cdot\\text{A}\\cdot\\text{m}$$', '$$\\text{J}\\cdot\\text{s}$$', '$$\\text{Wb}\\cdot\\text{m}^2$$'],
        correct: 0,
        explain: 'From the Lorentz force formula $$F = I L B \\implies B = \\frac{F}{IL}$$, the unit is $$\\frac{\\text{N}}{\\text{A}\\cdot\\text{m}} = \\text{N}\\cdot\\text{A}^{-1}\\cdot\\text{m}^{-1}$$.',
        subject: 'Physics',
        chapter: 'Electromagnetism',
        difficulty: 'Medium',
      },
      {
        id: 'fallback-q-5',
        q: 'In the set of complex numbers $$\\mathbb{C}$$, the multiplicative inverse of $$z = 3 + 4i$$ is:',
        options: ['$$\\frac{3}{25} - \\frac{4}{25}i$$', '$$\\frac{3}{7} - \\frac{4}{7}i$$', '$$3 - 4i$$', '$$-3 - 4i$$'],
        correct: 0,
        explain: '$$z^{-1} = \\frac{\\bar{z}}{|z|^2} = \\frac{3 - 4i}{3^2 + 4^2} = \\frac{3 - 4i}{25} = \\frac{3}{25} - \\frac{4}{25}i$$.',
        subject: 'Mathematics',
        chapter: 'Number Systems',
        difficulty: 'Medium',
      },
    ];
    backupQuestions.forEach((q) => questionsMap.set(q.id, q));
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
