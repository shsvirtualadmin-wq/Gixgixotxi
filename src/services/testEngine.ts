import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  increment,
  Timestamp,
} from '../lib/firebase';
import { getKarachiTodayString } from '../data/planLimits';
import { activateReferralIfEligible } from '../lib/referralTracker';

export type AttemptMode = 'practice' | 'mock' | 'event' | 'sprint' | 'diagnostic';
export type AttemptStatus = 'preparing' | 'in_progress' | 'completed' | 'abandoned';

export interface QuestionSnapshot {
  id: string;
  stem: string;
  options: string[];
  correctOptionId: number | string;
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  explanation?: string;
}

export interface ChapterAccuracy {
  chapter: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface AttemptResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  chapterBreakdown: ChapterAccuracy[];
  negativeMarkingPercent?: number;
  marksPerQuestion?: number;
  totalMarks?: number;
}

export interface AttemptSession {
  id: string;
  userId: string;
  title: string;
  mode: AttemptMode;
  subject: string;
  universityId?: string;
  chapters?: string[];
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  serverTimeOffsetMs: number;
  status: AttemptStatus;
  questions: QuestionSnapshot[];
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, number | null>;
  flaggedQuestions: string[];
  lastHeartbeatAt?: string;
  completedAt?: string;
  results?: AttemptResults;
  sessionId?: string;
  negativeMarkingPercent?: number;
  marksPerQuestion?: number;
  totalMarks?: number;
}

export interface CreateAttemptParams {
  userId: string;
  title: string;
  mode: AttemptMode;
  subject: string;
  universityId?: string;
  chapters?: string[];
  durationMinutes: number;
  questions: QuestionSnapshot[];
  sessionId?: string;
  negativeMarkingPercent?: number;
  marksPerQuestion?: number;
  totalMarks?: number;
}

/**
 * Creates an attempt session with atomic Firestore state:
 * 1. Creates document in `attempts/{attemptId}` with status: 'preparing'
 * 2. Computes server-synchronized time and duration
 * 3. Switches status to 'in_progress'
 */
export async function createAttemptSession(params: CreateAttemptParams): Promise<AttemptSession> {
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const attemptRef = doc(db, 'attempts', attemptId);
  const clientNow = Date.now();
  const durationMs = (params.durationMinutes || 15) * 60 * 1000;
  const startedAt = new Date(clientNow).toISOString();
  const endsAt = new Date(clientNow + durationMs).toISOString();

  const initialAnswers: Record<string, number | null> = {};
  params.questions.forEach((q) => {
    initialAnswers[q.id] = null;
  });

  const sessionData: AttemptSession = {
    id: attemptId,
    userId: params.userId,
    title: params.title,
    mode: params.mode,
    subject: params.subject,
    universityId: params.universityId,
    chapters: params.chapters || [],
    durationMinutes: params.durationMinutes,
    startedAt,
    endsAt,
    serverTimeOffsetMs: 0,
    status: 'in_progress',
    questions: params.questions,
    totalQuestions: params.questions.length,
    currentIndex: 0,
    answers: initialAnswers,
    flaggedQuestions: [],
    lastHeartbeatAt: startedAt,
    sessionId: params.sessionId,
    negativeMarkingPercent: params.negativeMarkingPercent ?? 0,
    marksPerQuestion: params.marksPerQuestion ?? 1,
    totalMarks: params.totalMarks ?? params.questions.length * (params.marksPerQuestion ?? 1),
  };

  try {
    // 1. Initial write with status: preparing and Firestore Timestamp endsAt
    await setDoc(attemptRef, {
      ...sessionData,
      endsAt: Timestamp.fromMillis(clientNow + durationMs),
      status: 'preparing',
      createdAt: serverTimestamp(),
    });

    // 2. Mark in_progress with server start time
    await updateDoc(attemptRef, {
      status: 'in_progress',
      startedAtServer: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(`boardly_attempt_${attemptId}`, JSON.stringify(sessionData));
    }
  } catch (err) {
    console.warn('[TestEngine] Firestore attempt write note, using local fallback:', err);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`boardly_attempt_${attemptId}`, JSON.stringify(sessionData));
    }
  }

  return sessionData;
}

/**
 * Autosaves student progress periodically and on answer changes.
 */
export async function syncAttemptProgress(
  attemptId: string,
  answers: Record<string, number | null>,
  flaggedQuestions: string[],
  currentIndex: number
): Promise<void> {
  const nowStr = new Date().toISOString();
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`boardly_attempt_${attemptId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.answers = answers;
        parsed.flaggedQuestions = flaggedQuestions;
        parsed.currentIndex = currentIndex;
        parsed.lastHeartbeatAt = nowStr;
        localStorage.setItem(`boardly_attempt_${attemptId}`, JSON.stringify(parsed));
      }
    }

    const attemptRef = doc(db, 'attempts', attemptId);
    await updateDoc(attemptRef, {
      answers,
      flaggedQuestions,
      currentIndex,
      lastHeartbeatAt: nowStr,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    // Non-fatal autosave warning
    console.warn('[TestEngine] syncAttemptProgress notice:', err);
  }
}

/**
 * Loads an existing attempt session from Firestore or LocalStorage.
 */
export async function getAttemptSession(attemptId: string): Promise<AttemptSession | null> {
  try {
    const snap = await getDoc(doc(db, 'attempts', attemptId));
    if (snap.exists()) {
      const data = snap.data() as Record<string, any>;
      return {
        ...data,
        endsAt: typeof data.endsAt?.toDate === 'function' ? data.endsAt.toDate().toISOString() : data.endsAt,
        startedAt: typeof data.startedAt?.toDate === 'function' ? data.startedAt.toDate().toISOString() : data.startedAt,
      } as AttemptSession;
    }
  } catch (err) {
    console.warn('[TestEngine] Firestore getAttemptSession note:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`boardly_attempt_${attemptId}`);
      if (cached) return JSON.parse(cached) as AttemptSession;
    } catch {}
  }
  return null;
}

/**
 * Helper to mask student name into "First L." format (e.g. "Ahmed K.")
 */
function maskStudentName(name: string): string {
  if (!name) return 'Student';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Submits and grades an attempt:
 * 1. Evaluates responses
 * 2. Computes score, accuracy, and chapter breakdown
 * 3. Updates attempt to completed in Firestore
 * 4. Records PKT daily usage
 * 5. Updates Arena leaderboard if live event
 * 6. Triggers referral activation hook
 */
export async function submitAttempt(
  attemptId: string,
  answers: Record<string, number | null>,
  timeSpentSeconds: number,
  studentName?: string
): Promise<AttemptResults> {
  let session = await getAttemptSession(attemptId);
  if (!session) {
    throw new Error(`Attempt ${attemptId} not found`);
  }

  const questions = session.questions;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const chapterMap: Record<string, { total: number; correct: number; subject: string }> = {};

  questions.forEach((q) => {
    const userChoice = answers[q.id];
    const chName = q.chapter || 'General Topics';
    if (!chapterMap[chName]) {
      chapterMap[chName] = { total: 0, correct: 0, subject: q.subject };
    }
    chapterMap[chName].total += 1;

    if (userChoice === null || userChoice === undefined) {
      skipped += 1;
    } else if (
      userChoice === q.correctOptionId ||
      String(userChoice) === String(q.correctOptionId)
    ) {
      correct += 1;
      chapterMap[chName].correct += 1;
    } else {
      wrong += 1;
    }
  });

  const marksPerQ = session.marksPerQuestion ?? 1;
  const negPercent = session.negativeMarkingPercent ?? 0;
  const rawScore = correct * marksPerQ - wrong * negPercent * marksPerQ;
  const finalScore = Math.max(0, Math.round(rawScore * 10) / 10);
  const totalQuestions = questions.length;
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  const chapterBreakdown: ChapterAccuracy[] = Object.entries(chapterMap).map(
    ([chapter, stats]) => ({
      chapter,
      subject: stats.subject,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })
  );

  const results: AttemptResults = {
    score: finalScore,
    totalQuestions,
    correctAnswers: correct,
    wrongAnswers: wrong,
    skippedAnswers: skipped,
    accuracy,
    timeSpentSeconds,
    chapterBreakdown,
    negativeMarkingPercent: negPercent,
    marksPerQuestion: marksPerQ,
    totalMarks: session.totalMarks ?? totalQuestions * marksPerQ,
  };

  const completedAt = new Date().toISOString();

  // 1. Update attempt document in Firestore
  try {
    const attemptRef = doc(db, 'attempts', attemptId);
    await updateDoc(attemptRef, {
      status: 'completed',
      answers,
      completedAt,
      completedAtServer: serverTimestamp(),
      results,
      timeSpentSeconds,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[TestEngine] Note updating attempts doc to completed:', err);
  }

  // 2. Update local cached attempt
  if (typeof window !== 'undefined') {
    try {
      session.status = 'completed';
      session.completedAt = completedAt;
      session.results = results;
      localStorage.setItem(`boardly_attempt_${attemptId}`, JSON.stringify(session));
    } catch {}
  }

  // 3. Update PKT Daily Usage under users/{uid}/usage/{YYYY-MM-DD}
  const todayPkt = getKarachiTodayString();
  const userId = session.userId;
  if (userId && userId !== 'guest') {
    try {
      const usageDocRef = doc(db, 'users', userId, 'usage', todayPkt);
      await setDoc(
        usageDocRef,
        {
          date: todayPkt,
          testsUsedToday: increment(1),
          testsCompleted: increment(1),
          lastTestAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (usageErr) {
      console.warn('[TestEngine] Daily usage update note:', usageErr);
    }

    // Also update user profile doc
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        testsUsedToday: increment(1),
        testsCompleted: increment(1),
        lastUsageDate: todayPkt,
        updatedAt: serverTimestamp(),
      });
    } catch (profileErr) {
      console.warn('[TestEngine] User profile stats update note:', profileErr);
    }

    // 4. If Arena/Event: publish to sessionResults/{sessionId}
    if (session.sessionId) {
      try {
        const maskedName = maskStudentName(studentName || 'Student');
        const eventResultRef = doc(db, 'sessionResults', `${session.sessionId}_${userId}`);
        await setDoc(
          eventResultRef,
          {
            sessionId: session.sessionId,
            userId,
            studentName: maskedName,
            score: finalScore,
            accuracy,
            timeSpentSeconds,
            submittedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (eventErr) {
        console.warn('[TestEngine] Event session result publish note:', eventErr);
      }
    }

    // 5. Referral activation check on first completed test
    try {
      await activateReferralIfEligible(userId);
    } catch (refErr) {
      console.warn('[TestEngine] Referral activation notice:', refErr);
    }
  }

  return results;
}
