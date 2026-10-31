import { api } from '@/lib/api';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { isSuperAdminEmailOrRole } from '@/hooks/useEffectivePlan';

export { FREE_DAILY_TESTS };

export interface StartTestSessionResult {
  attemptId: string;
  testsStarted?: number;
  blocked?: boolean;
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

/**
 * Starts a test session of any type via Cloudflare D1 (`/api/practice-attempts/start`).
 * Atomically checks the daily usage counter in Asia/Karachi (PKT) timezone.
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

  const isSuper = isSuperAdminEmailOrRole(userEmail, userRole, uid);
  const bypassLimit = isSuper || isUnlimited;

  try {
    const res = await api.post<{
      attemptId: string;
      testsStarted?: number;
      blocked?: boolean;
    }>('/api/practice-attempts/start', {
      uid,
      dateKey,
      isUnlimited: bypassLimit,
      limit: FREE_DAILY_TESTS,
      customAttemptId,
      attemptPayload,
    });

    return {
      attemptId: res.attemptId,
      testsStarted: res.testsStarted,
      blocked: false,
    };
  } catch (err: any) {
    if (err?.code === 'DAILY_TESTS_LIMIT_EXCEEDED' || err?.status === 429) {
      throw new DailyTestLimitError(FREE_DAILY_TESTS, FREE_DAILY_TESTS);
    }
    throw err;
  }
}
