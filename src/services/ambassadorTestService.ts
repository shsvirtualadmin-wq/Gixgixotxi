import { api } from '../lib/api';
import { auth } from '../lib/firebase';

export interface AmbassadorTestQuestion {
  id: string;
  position?: number;
  question: string;
  options: [string, string, string, string];
  correctIndex?: number; // Present for captain/admin editing or after attempt submission; omitted for students before submission
  explanation?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface AmbassadorCustomTest {
  id: string;
  title: string;
  description: string;
  subject: string;
  durationMinutes: number;
  questions: AmbassadorTestQuestion[];
  questionCount: number;
  captainUid: string;
  captainName: string;
  creatorUid: string;
  creatorName: string;
  creatorShortId: string;
  crewId?: string | null;
  crewName: string;
  visibility: 'public' | 'private';
  status: 'draft' | 'published' | 'unpublished';
  isPublic: boolean;
  attemptsCount: number;
  avgScore?: number;
  certificateThemeId?: string | null;
  certificate_theme_id?: string | null;
  mockCode?: string | null;
  mock_code?: string | null;
  resultsFinalized?: boolean;
  results_finalized?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface GradedAttemptQuestion {
  id: string;
  position: number;
  question: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface AmbassadorTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  captainUid: string;
  captainName: string;
  studentUid: string;
  userUid?: string;
  studentName: string;
  userName?: string;
  name?: string;
  userAvatar?: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  rank?: number;
  date?: string;
  submittedAt?: any;
  gradedQuestions?: GradedAttemptQuestion[];
  createdAt: any;
}

export interface GrandLineLeaderboardEntry {
  uid: string;
  userUid?: string;
  displayName: string;
  userName?: string;
  studentName?: string;
  name?: string;
  userAvatar?: string | null;
  testsCompleted: number;
  totalScore: number;
  totalQuestions: number;
  bestPercentage: number;
  timeTakenSeconds?: number;
  rank?: number;
  lastTestTitle: string;
  updatedAt: any;
}

function toTimestampCompat(msOrDate: any) {
  const ms =
    typeof msOrDate === 'number'
      ? msOrDate
      : msOrDate
      ? Date.parse(String(msOrDate)) || Date.now()
      : Date.now();
  const d = new Date(ms);
  return {
    seconds: Math.floor(ms / 1000),
    nanoseconds: 0,
    toDate: () => d,
    toMillis: () => ms,
  };
}

function normalizeTestRow(raw: any): AmbassadorCustomTest {
  const visibility: 'public' | 'private' =
    raw.visibility === 'private' || raw.isPublic === false ? 'private' : 'public';
  const status: 'draft' | 'published' | 'unpublished' =
    raw.status === 'unpublished' || raw.status === 'draft' ? raw.status : 'published';
  const questions: AmbassadorTestQuestion[] = Array.isArray(raw.questions)
    ? raw.questions.map((q: any, i: number) => {
        const opts = Array.isArray(q.options) ? q.options : [];
        return {
          id: String(q.id || `q_${i + 1}`),
          position: typeof q.position === 'number' ? q.position : i,
          question: String(q.question || q.question_text || ''),
          options: [
            String(opts[0] ?? ''),
            String(opts[1] ?? ''),
            String(opts[2] ?? ''),
            String(opts[3] ?? ''),
          ],
          ...(q.correctIndex !== undefined || q.correct_index !== undefined
            ? { correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0) }
            : {}),
          explanation: q.explanation ? String(q.explanation) : undefined,
          topic: q.topic ? String(q.topic) : undefined,
          difficulty: q.difficulty || 'medium',
        };
      })
    : [];

  const captainUid = String(raw.captainUid || raw.captain_uid || raw.creatorUid || '');
  const captainName = String(raw.captainName || raw.captain_name || raw.creatorName || 'Captain');
  const creatorShortId =
    String(raw.creatorShortId || '') ||
    (captainUid ? captainUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : 'CAPT');

  return {
    id: String(raw.id || ''),
    title: String(raw.title || 'Untitled Test'),
    description: String(raw.description || ''),
    subject: String(raw.subject || 'General'),
    durationMinutes: Number(raw.durationMinutes ?? raw.duration_minutes ?? 20),
    questions,
    questionCount: Number(raw.questionCount ?? raw.question_count ?? questions.length),
    captainUid,
    captainName,
    creatorUid: captainUid,
    creatorName: captainName,
    creatorShortId,
    crewId: raw.crewId ?? raw.crew_id ?? null,
    crewName: String(raw.crewName || raw.crew_name || 'Grand Line Crew'),
    visibility,
    status,
    isPublic: visibility === 'public' && status === 'published',
    attemptsCount: Number(raw.attemptsCount ?? raw.attempts_count ?? 0),
    avgScore: Number(raw.avgScore ?? raw.avg_score ?? 0),
    certificateThemeId: raw.certificateThemeId || raw.certificate_theme_id || 'auto',
    certificate_theme_id: raw.certificateThemeId || raw.certificate_theme_id || 'auto',
    mockCode: raw.mockCode || raw.mock_code || null,
    mock_code: raw.mockCode || raw.mock_code || null,
    resultsFinalized: Boolean(raw.resultsFinalized ?? raw.results_finalized ?? false),
    results_finalized: Boolean(raw.resultsFinalized ?? raw.results_finalized ?? false),
    createdAt: toTimestampCompat(raw.createdAt ?? raw.created_at),
    updatedAt: toTimestampCompat(raw.updatedAt ?? raw.updated_at ?? raw.createdAt),
  };
}

export function normalizeAttemptRow(raw: any): AmbassadorTestAttempt {
  const userUid = String(raw.userUid || raw.studentUid || raw.user_uid || '');
  const rawName = String(
    raw.userName || raw.studentName || raw.name || raw.user_name || ''
  ).trim();
  const userName = rawName || 'Student';
  const ts = toTimestampCompat(raw.createdAt ?? raw.created_at);
  const dateStr =
    typeof raw.date === 'string' && raw.date.trim()
      ? raw.date.trim()
      : ts.toDate().toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

  return {
    id: String(raw.id || ''),
    testId: String(raw.testId || raw.test_id || ''),
    testTitle: String(raw.testTitle || raw.test_title || ''),
    subject: String(raw.subject || 'General'),
    captainUid: String(raw.captainUid || raw.captain_uid || ''),
    captainName: String(raw.captainName || raw.captain_name || 'Captain'),
    studentUid: userUid,
    userUid,
    studentName: userName,
    userName,
    name: userName,
    userAvatar: raw.userAvatar ?? raw.user_avatar ?? null,
    score: Number(raw.score ?? 0),
    totalQuestions: Number(raw.totalQuestions ?? raw.total_questions ?? 0),
    percentage: Number(raw.percentage ?? 0),
    timeTakenSeconds: Number(raw.timeTakenSeconds ?? raw.time_taken_seconds ?? 0),
    rank: raw.rank !== undefined ? Number(raw.rank) : undefined,
    date: dateStr,
    gradedQuestions: Array.isArray(raw.gradedQuestions) ? raw.gradedQuestions : undefined,
    createdAt: ts,
  };
}

/**
 * Parses CSV text on the frontend into validated JSON question rows.
 * Supported headers:
 *   question, optionA, optionB, optionC, optionD, correctOption (A/B/C/D or 1/2/3/4 or 0/1/2/3), explanation, topic, difficulty
 */
export function parseAmbassadorQuestionsCsv(csvText: string): {
  questions: AmbassadorTestQuestion[];
  errors: string[];
} {
  const questions: AmbassadorTestQuestion[] = [];
  const errors: string[] = [];

  if (!csvText || !csvText.trim()) {
    return { questions, errors: ['No question data provided.'] };
  }

  const parseCsvRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          if (char === '\r') i++;
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }
    return rows;
  };

  const rawRows = parseCsvRows(csvText);
  if (rawRows.length === 0) {
    return { questions, errors: ['No valid rows found.'] };
  }

  const firstRowLower = rawRows[0].map((c) => c.toLowerCase());
  const hasHeader =
    firstRowLower.some((c) => c.includes('question') || c === 'q') &&
    firstRowLower.some((c) => c.includes('option') || c === 'a' || c === 'opt1');

  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 1;

    if (row.length < 6) {
      errors.push(
        `Row ${rowNum}: Expected at least 6 columns (Question, Option A, Option B, Option C, Option D, Correct Answer), found ${row.length}.`
      );
      continue;
    }

    const [qText, optA, optB, optC, optD, rawCorrect, explanation, topic, rawDifficulty] = row;

    if (!qText) {
      errors.push(`Row ${rowNum}: Question text is empty.`);
      continue;
    }
    if (!optA || !optB || !optC || !optD) {
      errors.push(`Row ${rowNum}: All 4 options (A, B, C, D) are required.`);
      continue;
    }

    let correctIndex = -1;
    const cleanCorrect = (rawCorrect || '').trim().toUpperCase();
    if (cleanCorrect === 'A' || cleanCorrect === 'OPTION A' || cleanCorrect === '1') {
      correctIndex = 0;
    } else if (cleanCorrect === 'B' || cleanCorrect === 'OPTION B' || cleanCorrect === '2') {
      correctIndex = 1;
    } else if (cleanCorrect === 'C' || cleanCorrect === 'OPTION C' || cleanCorrect === '3') {
      correctIndex = 2;
    } else if (cleanCorrect === 'D' || cleanCorrect === 'OPTION D' || cleanCorrect === '4') {
      correctIndex = 3;
    } else if (['0', '1', '2', '3'].includes(cleanCorrect)) {
      correctIndex = Number(cleanCorrect);
    } else {
      const matchIdx = [optA, optB, optC, optD].findIndex(
        (o) => o.trim().toLowerCase() === cleanCorrect.toLowerCase()
      );
      if (matchIdx !== -1) correctIndex = matchIdx;
    }

    if (correctIndex < 0 || correctIndex > 3) {
      errors.push(`Row ${rowNum}: Invalid correct answer "${rawCorrect}". Use A, B, C, or D.`);
      continue;
    }

    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    const dLower = (rawDifficulty || '').trim().toLowerCase();
    if (dLower === 'easy' || dLower === 'medium' || dLower === 'hard') {
      difficulty = dLower;
    }

    questions.push({
      id: `q_${i}_${Math.random().toString(36).slice(2, 7)}`,
      position: questions.length,
      question: qText,
      options: [optA, optB, optC, optD],
      correctIndex,
      explanation: explanation || undefined,
      topic: topic || undefined,
      difficulty,
    });
  }

  return { questions, errors };
}

function formatQuestionPayload(q: AmbassadorTestQuestion, defaultTopic = 'General') {
  const opts = Array.isArray(q.options) ? q.options : [];
  const fourOptions: [string, string, string, string] = [
    String(opts[0] ?? ''),
    String(opts[1] ?? ''),
    String(opts[2] ?? ''),
    String(opts[3] ?? ''),
  ];
  return {
    question: String(q.question || '').trim(),
    options: fourOptions,
    correctIndex: Number(q.correctIndex ?? 0),
    explanation: String(q.explanation || ''),
    topic: String(q.topic || defaultTopic || 'General'),
    difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
  };
}

const CACHE_TTL_MS = 30_000;
const responseCache = new Map<string, { expiresAt: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();

export function invalidateAmbassadorTestCache(): void {
  responseCache.clear();
  inFlightRequests.clear();
}

function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.data as T);
  }
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const p = fetcher()
    .then((res) => {
      responseCache.set(key, { expiresAt: Date.now() + ttlMs, data: res });
      inFlightRequests.delete(key);
      return res;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });
  inFlightRequests.set(key, p);
  return p;
}

export async function createAmbassadorTest(params: {
  title: string;
  description?: string;
  subject: string;
  durationMinutes?: number;
  questions: AmbassadorTestQuestion[];
  captainUid?: string;
  captainName?: string;
  crewName?: string;
  visibility?: 'public' | 'private';
  status?: 'draft' | 'published' | 'unpublished';
  isPublic?: boolean;
  certificateThemeId?: string | null;
}): Promise<string> {
  const visibility =
    params.visibility || (params.isPublic === false ? 'private' : 'public');
  const status = params.status || 'published';
  const subject = params.subject.trim();
  const formattedQuestions = params.questions
    .slice(0, 200)
    .map((q) => formatQuestionPayload(q, subject));

  const res = await api.post<{ id: string }>(
    '/api/tests',
    {
      title: params.title.trim(),
      subject,
      description: (params.description || '').trim(),
      visibility,
      status,
      certificateThemeId: params.certificateThemeId || 'auto',
      durationMinutes:
        params.durationMinutes || Math.max(10, Math.round(formattedQuestions.length * 1.5)),
      questions: formattedQuestions,
    },
    { requireAuth: true }
  );

  invalidateAmbassadorTestCache();
  return res.id;
}

export async function updateAmbassadorTest(
  testId: string,
  params: {
    title?: string;
    description?: string;
    subject?: string;
    durationMinutes?: number;
    visibility?: 'public' | 'private';
    status?: 'draft' | 'published' | 'unpublished';
    certificateThemeId?: string | null;
    questions?: AmbassadorTestQuestion[];
  }
): Promise<void> {
  const defaultTopic = params.subject || 'General';
  await api.put(
    `/api/tests/${encodeURIComponent(testId)}`,
    {
      title: params.title,
      subject: params.subject,
      description: params.description,
      visibility: params.visibility,
      status: params.status,
      certificateThemeId: params.certificateThemeId,
      durationMinutes: params.durationMinutes,
      ...(params.questions
        ? {
            questions: params.questions
              .slice(0, 200)
              .map((q) => formatQuestionPayload(q, defaultTopic)),
          }
        : {}),
    },
    { requireAuth: true }
  );
  invalidateAmbassadorTestCache();
}

export async function togglePublishAmbassadorTest(
  testId: string,
  options?: { status?: 'published' | 'unpublished'; visibility?: 'public' | 'private' }
): Promise<{ status: string; visibility: string }> {
  const res = await api.post<{ status: string; visibility: string }>(
    `/api/tests/${encodeURIComponent(testId)}/publish`,
    {
      status: options?.status || 'published',
      ...(options?.visibility ? { visibility: options.visibility } : {}),
    },
    { requireAuth: true }
  );
  invalidateAmbassadorTestCache();
  return res;
}

export async function bulkInsertTestQuestions(
  testId: string,
  questions: AmbassadorTestQuestion[],
  replace = true
): Promise<{ inserted: number; questionCount: number }> {
  const res = await api.post<{ inserted: number; questionCount: number }>(
    `/api/tests/${encodeURIComponent(testId)}/questions`,
    {
      questions: questions.slice(0, 200).map((q) => formatQuestionPayload(q, 'General')),
      replace,
    },
    { requireAuth: true }
  );
  invalidateAmbassadorTestCache();
  return res;
}

export async function getTestsByCaptain(captainUid?: string): Promise<AmbassadorCustomTest[]> {
  const query = captainUid ? `?captainUid=${encodeURIComponent(captainUid)}` : '';
  const data = await api.get<{ tests: any[] }>(`/api/tests/mine${query}`, {
    requireAuth: true,
    silentErrorToast: true,
  });
  return (data.tests || []).map(normalizeTestRow);
}

export async function getAllPublicAmbassadorTests(subject?: string): Promise<AmbassadorCustomTest[]> {
  const normSubj = subject && subject !== 'All' ? subject : 'All';
  const cacheKey = `public_tests:${normSubj}`;
  return cachedFetch(cacheKey, async () => {
    const query = normSubj !== 'All' ? `?subject=${encodeURIComponent(normSubj)}` : '';
    const data = await api.get<{ tests: any[] }>(`/api/tests/public${query}`, {
      silentErrorToast: true,
    });
    return (data.tests || []).map(normalizeTestRow);
  });
}

export async function getAmbassadorTestById(
  testId: string,
  includeAnswers = false,
  options?: { view?: 'info'; silentErrorToast?: boolean }
): Promise<(AmbassadorCustomTest & { myAttempt?: AmbassadorTestAttempt | null }) | null> {
  try {
    const params = new URLSearchParams();
    if (includeAnswers) params.set('includeAnswers', '1');
    if (options?.view) params.set('view', options.view);
    const qs = params.toString();
    const query = qs ? `?${qs}` : '';
    const data = await api.get<{ test: any; myAttempt?: any }>(
      `/api/tests/${encodeURIComponent(testId)}${query}`,
      {
        requireAuth: false,
        silentErrorToast: options?.silentErrorToast ?? true,
      }
    );
    if (!data?.test) return null;
    const normalized = normalizeTestRow(data.test) as AmbassadorCustomTest & {
      myAttempt?: AmbassadorTestAttempt | null;
    };
    if (data.myAttempt) {
      normalized.myAttempt = normalizeAttemptRow(data.myAttempt);
    }
    return normalized;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function getMyTestAttemptForTest(testId: string): Promise<{
  attempt: AmbassadorTestAttempt | null;
  test: (AmbassadorCustomTest & { adminName?: string }) | null;
  gradedQuestions?: GradedAttemptQuestion[];
  isAdminAnswerKey?: boolean;
}> {
  const data = await api.get<{
    attempt?: any;
    test?: any;
    gradedQuestions?: GradedAttemptQuestion[];
    isAdminAnswerKey?: boolean;
  }>(`/api/tests/${encodeURIComponent(testId)}/my-attempt`, {
    requireAuth: false,
    silentErrorToast: true,
  });

  return {
    attempt: data.attempt ? normalizeAttemptRow(data.attempt) : null,
    test: data.test ? (normalizeTestRow(data.test) as any) : null,
    gradedQuestions: data.gradedQuestions || data.attempt?.gradedQuestions,
    isAdminAnswerKey: Boolean(data.isAdminAnswerKey),
  };
}

export async function deleteAmbassadorTest(testId: string): Promise<void> {
  await api.delete(`/api/tests/${encodeURIComponent(testId)}`, { requireAuth: true });
  invalidateAmbassadorTestCache();
}

/**
 * Submits student answers to the Worker for server-side scoring.
 * Never relies on client-side correct answers before submission.
 */
export async function submitAmbassadorTestAttempt(params: {
  testId: string;
  answers: Record<string | number, number> | number[];
  timeTakenSeconds: number;
  userName?: string;
  userAvatar?: string | null;
}): Promise<AmbassadorTestAttempt> {
  try {
    const data = await api.post<{ attempt: any }>(
      `/api/tests/${encodeURIComponent(params.testId)}/attempts`,
      {
        answers: params.answers,
        timeTakenSeconds: params.timeTakenSeconds,
        userName: params.userName,
        userAvatar: params.userAvatar,
      },
      { requireAuth: false, silentErrorToast: true }
    );
    invalidateAmbassadorTestCache();
    return normalizeAttemptRow(data.attempt);
  } catch (err) {
    invalidateAmbassadorTestCache();
    throw err;
  }
}

/**
 * Legacy-compatible wrapper that submits answers to the D1 API.
 */
export async function recordAmbassadorTestAttempt(params: {
  testId: string;
  testTitle?: string;
  subject?: string;
  captainUid?: string;
  captainName?: string;
  studentUid?: string;
  studentName?: string;
  score?: number;
  totalQuestions?: number;
  timeTakenSeconds: number;
  answers?: Record<string | number, number> | number[];
}): Promise<AmbassadorTestAttempt> {
  return submitAmbassadorTestAttempt({
    testId: params.testId,
    answers: params.answers || {},
    timeTakenSeconds: params.timeTakenSeconds,
    userName: params.studentName,
  });
}

export async function getMyTestAttempts(): Promise<AmbassadorTestAttempt[]> {
  const uid = auth.currentUser?.uid || 'anon';
  const cacheKey = `my_attempts:${uid}`;
  return cachedFetch(cacheKey, async () => {
    const data = await api.get<{ attempts: any[] }>('/api/attempts/mine', {
      requireAuth: false,
      silentErrorToast: true,
    });
    return (data.attempts || []).map(normalizeAttemptRow);
  });
}

export async function getTestResultsForCaptain(testId: string): Promise<AmbassadorTestAttempt[]> {
  const data = await api.get<{ results: any[] }>(
    `/api/tests/${encodeURIComponent(testId)}/results`,
    { requireAuth: true }
  );
  return (data.results || []).map(normalizeAttemptRow);
}

export async function getTestLeaderboard(testId: string): Promise<AmbassadorTestAttempt[]> {
  const cacheKey = `test_lb:${testId}`;
  return cachedFetch(cacheKey, async () => {
    const data = await api.get<{ results: any[] }>(
      `/api/tests/${encodeURIComponent(testId)}/leaderboard`,
      { silentErrorToast: true }
    );
    return (data.results || []).map(normalizeAttemptRow);
  });
}

export async function getGrandLineLeaderboard(maxCount = 50): Promise<GrandLineLeaderboardEntry[]> {
  const cacheKey = `gl_lb:${maxCount}`;
  return cachedFetch(cacheKey, async () => {
    try {
      const data = await api.get<{ leaderboard?: any[]; results?: any[] }>(
        `/api/leaderboard/grand-line?limit=${maxCount}`,
        { silentErrorToast: true }
      );
      const list = data.leaderboard || data.results || [];
      return list.map((d: any, idx: number) => {
        const uid = String(d.uid || d.userUid || '');
        const displayName = String(
          d.displayName || d.userName || d.studentName || d.name || 'Student'
        ).trim() || 'Student';
        return {
          uid,
          userUid: uid,
          displayName,
          userName: displayName,
          studentName: displayName,
          name: displayName,
          userAvatar: d.userAvatar ?? d.user_avatar ?? null,
          testsCompleted: Number(d.testsCompleted || 1),
          totalScore: Number(d.totalScore ?? d.score ?? 0),
          totalQuestions: Number(d.totalQuestions ?? 0),
          bestPercentage: Number(d.bestPercentage ?? d.percentage ?? 0),
          timeTakenSeconds: Number(d.timeTakenSeconds ?? d.time_taken_seconds ?? 0),
          rank: d.rank !== undefined ? Number(d.rank) : idx + 1,
          lastTestTitle: String(d.lastTestTitle || d.testTitle || 'Grand Line Test'),
          updatedAt: toTimestampCompat(d.updatedAt || d.createdAt),
        };
      });
    } catch {
      return [];
    }
  });
}

export type AmbassadorTestDoc = AmbassadorCustomTest & {
  questionsCount?: number;
  timeLimitMinutes?: number;
  authorId?: string;
  authorName?: string;
  attempts?: number;
};

export interface PublicLeaderboardEntry extends AmbassadorTestAttempt {
  name?: string;
  timeTakenSec?: number;
}

export async function getAllPublicGrandLineTests(subject?: string): Promise<AmbassadorTestDoc[]> {
  const list = await getAllPublicAmbassadorTests(subject);
  return list.map((t) => ({
    ...t,
    questionsCount: t.questionCount,
    timeLimitMinutes: t.durationMinutes,
    authorId: t.captainUid,
    authorName: t.captainName,
    attempts: t.attemptsCount,
  }));
}

export async function getAmbassadorTestsForCreator(captainUid: string): Promise<AmbassadorTestDoc[]> {
  const allPublic = await getAllPublicGrandLineTests();
  return allPublic.filter((t) => t.captainUid === captainUid || t.authorId === captainUid);
}

export async function hasUserAttemptedTest(testId: string, _userUid?: string): Promise<boolean> {
  try {
    const attempts = await getMyTestAttempts();
    return attempts.some((a) => a.testId === testId);
  } catch {
    return false;
  }
}

export interface GlobalTopScorerEntry {
  uid: string;
  studentUid?: string;
  name: string;
  userName?: string;
  studentName?: string;
  testTitle?: string;
  userAvatar?: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  testsCompleted: number;
  rank: number;
}

export async function getGlobalGrandLineTopScorers(
  maxCount = 10
): Promise<GlobalTopScorerEntry[]> {
  const entries = await getGrandLineLeaderboard(maxCount);
  return entries.map((e, idx) => ({
    uid: e.uid,
    studentUid: e.uid,
    name: e.displayName,
    userAvatar: e.userAvatar || null,
    score: e.totalScore,
    totalQuestions: e.totalQuestions,
    percentage: e.bestPercentage,
    timeTakenSeconds: e.timeTakenSeconds || 0,
    testsCompleted: e.testsCompleted,
    rank: e.rank ?? idx + 1,
  }));
}

export const SAMPLE_CSV_TEMPLATE = `question,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty
"What is the SI unit of magnetic flux?","Tesla","Weber","Henry","Gauss","B","Magnetic flux Φ = B·A is measured in Webers (Wb).","Electromagnetism","easy"
"If f(x) = ln(x² + 1), what is f'(1)?","1","2","1/2","0","A","Using chain rule: f'(x) = 2x/(x² + 1), so f'(1) = 2/2 = 1.","Calculus","medium"
"Which organelle is responsible for ATP synthesis via oxidative phosphorylation?","Ribosome","Golgi Apparatus","Mitochondria","Lysosome","C","Mitochondria generate ATP across the inner membrane.","Cell Biology","easy"`;
