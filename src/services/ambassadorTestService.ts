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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Question } from '@/types/index';

export interface AmbassadorQuestion {
  id: string;
  subject: string;
  chapter?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface AmbassadorTestDoc {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  questions: AmbassadorQuestion[];
  isPublic: boolean;
  status: 'published' | 'unpublished';
  creatorUid: string;
  creatorName: string;
  creatorShortId: string;
  creatorEmail: string;
  createdAt?: Timestamp | { seconds: number } | string;
  updatedAt?: Timestamp | { seconds: number } | string;
}

export interface GrandLineAttempt {
  id: string;
  testId: string;
  testTitle: string;
  creatorUid: string;
  name: string;
  email: string; // Private: visible only to creator & superadmin
  entryTest: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  date: string;
  submittedAt?: Timestamp | { seconds: number } | string;
}

export interface PublicLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  date: string;
}

/**
 * Creates a new test authored by an ambassador.
 * Stored strictly in `ambassador_tests` collection — NEVER added to the main MCQ bank.
 */
export async function createAmbassadorTest(params: {
  title: string;
  subject: string;
  questionCount: number;
  questions: AmbassadorQuestion[];
  isPublic: boolean;
  creatorUid: string;
  creatorName: string;
  creatorShortId: string;
  creatorEmail: string;
}): Promise<string> {
  const testRef = doc(collection(db, 'ambassador_tests'));
  const testDoc: AmbassadorTestDoc = {
    id: testRef.id,
    title: params.title.trim(),
    subject: params.subject,
    questionCount: params.questionCount,
    questions: params.questions,
    isPublic: params.isPublic,
    status: params.isPublic ? 'published' : 'unpublished',
    creatorUid: params.creatorUid,
    creatorName: params.creatorName,
    creatorShortId: params.creatorShortId,
    creatorEmail: params.creatorEmail,
    createdAt: serverTimestamp() as unknown as Timestamp,
    updatedAt: serverTimestamp() as unknown as Timestamp,
  };

  await setDoc(testRef, testDoc);
  return testRef.id;
}

/**
 * Updates an ambassador test.
 * Only the creator or super admin is authorized.
 */
export async function updateAmbassadorTest(
  testId: string,
  updates: Partial<AmbassadorTestDoc>,
  callerUid: string,
  isSuperAdmin = false
): Promise<void> {
  const testRef = doc(db, 'ambassador_tests', testId);
  const snap = await getDoc(testRef);
  if (!snap.exists()) throw new Error('Test not found.');
  const data = snap.data() as AmbassadorTestDoc;

  if (data.creatorUid !== callerUid && !isSuperAdmin) {
    throw new Error('Unauthorized: only the author or super admin can edit this test.');
  }

  await updateDoc(testRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes an ambassador test.
 * Only the creator or super admin is authorized.
 */
export async function deleteAmbassadorTest(
  testId: string,
  callerUid: string,
  isSuperAdmin = false
): Promise<void> {
  const testRef = doc(db, 'ambassador_tests', testId);
  const snap = await getDoc(testRef);
  if (!snap.exists()) throw new Error('Test not found.');
  const data = snap.data() as AmbassadorTestDoc;

  if (data.creatorUid !== callerUid && !isSuperAdmin) {
    throw new Error('Unauthorized: only the author or super admin can delete this test.');
  }

  await deleteDoc(testRef);
}

/**
 * Toggles published status for Grand Line public visibility.
 */
export async function togglePublishAmbassadorTest(
  testId: string,
  makePublic: boolean,
  callerUid: string,
  isSuperAdmin = false
): Promise<void> {
  await updateAmbassadorTest(
    testId,
    {
      isPublic: makePublic,
      status: makePublic ? 'published' : 'unpublished',
    },
    callerUid,
    isSuperAdmin
  );
}

/**
 * Retrieves all tests created by an ambassador.
 */
export async function getAmbassadorTestsForCreator(creatorUid: string): Promise<AmbassadorTestDoc[]> {
  try {
    const q = query(
      collection(db, 'ambassador_tests'),
      where('creatorUid', '==', creatorUid)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AmbassadorTestDoc));
    // Sort client-side by title/updatedAt
    return list;
  } catch (err) {
    console.warn('[ambassadorTestService] Error querying tests for creator:', err);
    return [];
  }
}

/**
 * Retrieves all public Grand Line tests.
 */
export async function getAllPublicGrandLineTests(): Promise<AmbassadorTestDoc[]> {
  try {
    const q = query(
      collection(db, 'ambassador_tests'),
      where('isPublic', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AmbassadorTestDoc))
      .filter((t) => t.status !== 'unpublished');
  } catch (err) {
    console.warn('[ambassadorTestService] Error querying public tests:', err);
    return [];
  }
}

/**
 * Retrieves a single ambassador test by ID.
 */
export async function getAmbassadorTestById(testId: string): Promise<AmbassadorTestDoc | null> {
  try {
    const snap = await getDoc(doc(db, 'ambassador_tests', testId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as AmbassadorTestDoc;
  } catch (err) {
    console.warn('[ambassadorTestService] Error fetching test by ID:', err);
    return null;
  }
}

/**
 * Validates Gmail/Email format and checks if already attempted.
 * Rule: 1 attempt per email per test.
 */
export async function hasUserAttemptedTest(testId: string, email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const attemptDocId = `${testId}_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  const snap = await getDoc(doc(db, 'ambassador_test_attempts', attemptDocId));
  return snap.exists();
}

/**
 * Submits an attempt for a Grand Line test.
 * Enforces server-side validation: 1 attempt per email per test.
 */
export async function submitGrandLineAttempt(params: {
  testId: string;
  testTitle: string;
  creatorUid: string;
  name: string;
  email: string;
  entryTest: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
}): Promise<GrandLineAttempt> {
  const { testId, testTitle, creatorUid, name, email, entryTest, score, totalQuestions, timeTakenSeconds } = params;
  const cleanEmail = email.trim().toLowerCase();

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const attemptDocId = `${testId}_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  const attemptRef = doc(db, 'ambassador_test_attempts', attemptDocId);

  // Check duplicate attempt
  const existingSnap = await getDoc(attemptRef);
  if (existingSnap.exists()) {
    throw new Error('You have already taken this test. Only 1 attempt per email is allowed.');
  }

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const attemptData: GrandLineAttempt = {
    id: attemptDocId,
    testId,
    testTitle,
    creatorUid,
    name: name.trim(),
    email: cleanEmail,
    entryTest: entryTest.trim(),
    score,
    totalQuestions,
    timeTakenSeconds,
    date: dateStr,
    submittedAt: serverTimestamp() as unknown as Timestamp,
  };

  await setDoc(attemptRef, attemptData);
  return attemptData;
}

/**
 * Retrieves the public leaderboard for a Grand Line test.
 * Strictly hides emails! Ranked by score desc, then timeTakenSeconds asc.
 */
export async function getTestLeaderboard(testId: string): Promise<PublicLeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'ambassador_test_attempts'),
      where('testId', '==', testId)
    );
    const snap = await getDocs(q);

    const raw = snap.docs.map((d) => d.data() as GrandLineAttempt);

    // Sort: highest score first, ties broken by shorter time taken
    raw.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });

    return raw.map((item, index) => ({
      rank: index + 1,
      name: item.name || 'Anonymous Student',
      score: item.score,
      totalQuestions: item.totalQuestions,
      timeTakenSeconds: item.timeTakenSeconds,
      date: item.date,
    }));
  } catch (err) {
    console.warn('[ambassadorTestService] Error getting test leaderboard:', err);
    return [];
  }
}

/**
 * Retrieves attempt data for the test creator (Ambassador) or Super Admin.
 * Displays student name, email, entry test, score, and time taken.
 */
export async function getTestAttemptsForCreator(testId: string): Promise<GrandLineAttempt[]> {
  try {
    const q = query(
      collection(db, 'ambassador_test_attempts'),
      where('testId', '==', testId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GrandLineAttempt));
    list.sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds);
    return list;
  } catch (err) {
    console.warn('[ambassadorTestService] Error getting creator attempts:', err);
    return [];
  }
}

/**
 * Retrieves all ambassador tests across the platform for Super Admin.
 */
export async function getAllAmbassadorTestsForAdmin(): Promise<AmbassadorTestDoc[]> {
  try {
    const snap = await getDocs(collection(db, 'ambassador_tests'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AmbassadorTestDoc));
  } catch (err) {
    console.warn('[ambassadorTestService] Admin fetch error:', err);
    return [];
  }
}

/**
 * Converts AmbassadorQuestion to Question interface for the test runner.
 */
export function convertToRunnerQuestion(aq: AmbassadorQuestion, index: number): Question {
  return {
    id: aq.id || `amb-q-${index}`,
    subject: aq.subject,
    chapter: aq.chapter || 'Ambassador Drill',
    difficulty: aq.difficulty || 'medium',
    q: aq.q,
    options: (Array.isArray(aq.options) && aq.options.length === 4
      ? (aq.options as [string, string, string, string])
      : [aq.options?.[0] || 'A', aq.options?.[1] || 'B', aq.options?.[2] || 'C', aq.options?.[3] || 'D']) as [string, string, string, string],
    correct: aq.correct,
    explain: aq.explanation,
    status: 'published',
    active: true,
    rand: Math.random(),
    schemaVersion: 1,
    contentHash: '',
    createdAt: null,
    updatedAt: null,
    createdBy: 'ambassador',
    tags: ['grand-line', 'ambassador-drill'],
    source: 'Ambassador Drill',
  };
}

/**
 * Retrieves top scorers across all Grand Line attempts for public landing preview.
 * Returns only name and score.
 */
export async function getGlobalGrandLineTopScorers(limitCount = 4): Promise<Array<{ name: string; score: number }>> {
  try {
    const q = query(
      collection(db, 'ambassador_test_attempts'),
      limit(limitCount * 3)
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];

    const attempts = snap.docs.map((d) => d.data() as GrandLineAttempt);
    // Sort by score descending
    attempts.sort((a, b) => (b.score || 0) - (a.score || 0));

    return attempts.slice(0, limitCount).map((att) => ({
      name: att.name || 'Anonymous Student',
      score: att.score || 0,
    }));
  } catch (err) {
    console.warn('[ambassadorTestService] Global top scorers notice:', err);
    return [];
  }
}

