import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
 * Starts a test session of any type (Daily Practice, 10-Minute Sprint,
 * Full Past Paper, Weak-Chapter Drill).
 *
 * Atomically checks the daily usage counter in Asia/Karachi (PKT) timezone.
 * If unlimited (Pro, crew-shared Pro, superadmin), increments counter if allowed or creates attempt directly.
 * If free tier and testsStarted >= 10, rejects atomically before creating the attempt doc.
 * Otherwise, increments testsStarted and creates the attempt doc atomically in one runTransaction.
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

  const attemptRef = customAttemptId
    ? doc(db, 'attempts', customAttemptId)
    : doc(collection(db, 'attempts'));
  const attemptId = attemptRef.id;
  const usageDocRef = doc(db, 'users', uid, 'usage', dateKey);

  const finalAttemptPayload = {
    ...attemptPayload,
    id: attemptId,
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (tx) => {
    if (bypassLimit) {
      // Unlimited accounts (superadmin, pro, crew-shared) are NEVER blocked
      tx.set(attemptRef, finalAttemptPayload);
      return;
    }

    // Free tier: check usage counter doc users/{uid}/usage/{PKT date key}
    const usageSnap = await tx.get(usageDocRef);
    let testsStarted = 0;
    if (usageSnap.exists()) {
      const data = usageSnap.data();
      testsStarted = Number(data.testsStarted ?? data.practiceAttempts ?? 0);
    }

    if (testsStarted >= FREE_DAILY_TESTS) {
      throw new DailyTestLimitError(testsStarted, FREE_DAILY_TESTS);
    }

    // Increment counter & create attempt doc atomically
    tx.set(
      usageDocRef,
      {
        testsStarted: testsStarted + 1,
        practiceAttempts: testsStarted + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(attemptRef, finalAttemptPayload);
  });

  return { attemptId, blocked: false };
}
