import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getBearerToken } from '@/lib/api';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { isSuperAdminEmailOrRole } from '@/hooks/useEffectivePlan';

export { FREE_DAILY_TESTS };

export interface StartTestSessionResult {
  attemptId: string;
  testsStarted?: number;
  blocked?: boolean;
  dateKey?: string;
}

export interface ServerDailyUsage {
  ok: boolean;
  uid: string;
  dateKey: string;
  timezone: string;
  testsStarted: number;
  practiceAttempts: number;
  questionsUsed: number;
  questionsSolved: number;
  aiTutorTokens: number;
  limit: number;
}

export class DailyTestLimitError extends Error {
  code = 'DAILY_TESTS_LIMIT_EXCEEDED';
  testsUsed: number;
  limit: number;

  constructor(testsUsed: number, limit: number = FREE_DAILY_TESTS) {
    super(`Daily test limit reached (${testsUsed}/${limit} tests). Upgrade or join a Study Crew to practice unlimited.`);
    this.name = 'DailyTestLimitError';
    this.testsUsed = testsUsed;
    this.limit = limit;
  }
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = await getBearerToken(false);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchDailyUsageFromServer(uid?: string): Promise<ServerDailyUsage | null> {
  try {
    const headers = await buildAuthHeaders();
    const qs = uid ? `?uid=${encodeURIComponent(uid)}` : '';
    const res = await fetch(`/api/usage/daily${qs}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerDailyUsage;
  } catch {
    return null;
  }
}

export async function recordDailyUsageOnServer(params: {
  uid?: string;
  practiceAttemptsDelta?: number;
  questionsSolvedDelta?: number;
  aiTutorTokensDelta?: number;
}): Promise<ServerDailyUsage | null> {
  try {
    const headers = await buildAuthHeaders();
    const res = await fetch('/api/usage/daily/record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerDailyUsage;
  } catch {
    return null;
  }
}

export async function cleanupHealthcheckDailyUsage(uid: string): Promise<void> {
  if (!uid || !uid.startsWith('hc_dummy_')) return;
  try {
    const headers = await buildAuthHeaders();
    await fetch('/api/usage/daily/cleanup-healthcheck', {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid, dateKey: getPKTDateKey() }),
    });
  } catch {
    // ignore cleanup failure
  }
}

/**
 * Starts a test session of any type (Daily Practice, 10-Minute Sprint,
 * Full Past Paper, Weak-Chapter Drill).
 *
 * Atomically checks and increments the daily starter counter on the SERVER
 * (`/api/usage/daily/start-test`) in Asia/Karachi (PKT, UTC+5) timezone.
 * Clients NEVER write directly to `/users/{uid}/usage/{dateKey}`.
 */
export async function startTestSessionWithLimit(params: {
  uid: string;
  userEmail?: string | null;
  userRole?: string | null;
  isUnlimited: boolean;
  attemptPayload: Record<string, unknown>;
  customAttemptId?: string;
}): Promise<StartTestSessionResult> {
  const { uid, userEmail, userRole, isUnlimited, attemptPayload, customAttemptId } = params;
  const dateKey = getPKTDateKey();
  const isHealthcheck = Boolean(attemptPayload?.healthcheck);

  const isSuper = !isHealthcheck && isSuperAdminEmailOrRole(userEmail, userRole, uid);
  const bypassLimit = isSuper || isUnlimited;

  const attemptRef = customAttemptId
    ? doc(db, 'attempts', customAttemptId)
    : doc(collection(db, 'attempts'));
  const attemptId = attemptRef.id;

  const headers = await buildAuthHeaders();
  const res = await fetch('/api/usage/daily/start-test', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      uid,
      isUnlimited: bypassLimit,
      customAttemptId: attemptId,
      dateKey,
      healthcheck: isHealthcheck,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (
    res.status === 429 ||
    data?.code === 'DAILY_TESTS_LIMIT_EXCEEDED' ||
    data?.blocked === true
  ) {
    const used = Number(data?.testsStarted ?? FREE_DAILY_TESTS);
    const limit = Number(data?.limit ?? FREE_DAILY_TESTS);
    throw new DailyTestLimitError(used, limit);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Failed to verify daily starter limit (HTTP ${res.status}).`);
  }

  // Create the student's attempt document in Firestore ONLY for real authenticated user sessions
  // where request.auth.uid matches the student's uid.
  if (!isHealthcheck && auth.currentUser && auth.currentUser.uid === uid) {
    const finalAttemptPayload = {
      ...attemptPayload,
      id: attemptId,
      userId: uid,
      uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(attemptRef, finalAttemptPayload);
  }

  return {
    attemptId: String(data?.attemptId || attemptId),
    testsStarted: Number(data?.testsStarted ?? 0),
    blocked: false,
    dateKey: String(data?.dateKey || dateKey),
  };
}

