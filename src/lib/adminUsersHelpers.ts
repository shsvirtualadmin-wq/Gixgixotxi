/**
 * Pure shared helpers for Super Admin / Admin User Directory:
 * 1. Consistent page-based pagination math across partially-loaded & fully-loaded directories.
 * 2. Real solved-MCQ and PKT study-streak aggregation from Firestore users, publicProfiles,
 *    attempts, and Cloudflare D1 activity tables.
 */

export interface UsersPaginationInput {
  loadedFilteredCount: number;
  totalDirectoryCount: number;
  hasMore: boolean;
  hasActiveFilters: boolean;
  currentPage: number;
  pageSize: number;
}

export interface UsersPaginationResult {
  effectiveTotal: number;
  totalPages: number;
  safePage: number;
  startIndex: number;
  endIndex: number;
  visiblePages: Array<number | 'ellipsis'>;
}

export function buildVisiblePageList(
  safePage: number,
  totalPages: number
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const windowStart = Math.max(2, safePage - 1);
  const windowEnd = Math.min(totalPages - 1, safePage + 1);

  if (windowStart > 2) {
    pages.push('ellipsis');
  }
  for (let p = windowStart; p <= windowEnd; p += 1) {
    pages.push(p);
  }
  if (windowEnd < totalPages - 1) {
    pages.push('ellipsis');
  }
  pages.push(totalPages);

  return pages;
}

export function computeUsersPagination(input: UsersPaginationInput): UsersPaginationResult {
  const pageSize = Math.max(1, Math.floor(input.pageSize || 20));
  const loadedCount = Math.max(0, Math.floor(input.loadedFilteredCount || 0));
  const dirTotal = Math.max(0, Math.floor(input.totalDirectoryCount || 0));

  // When unfiltered and more pages still exist on the server, use the true directory total
  // so 93 users at 20/page accurately reports 5 pages (Page 1 of 5), not 2 pages.
  // Once all pages are loaded (!hasMore) or filters are active, snap to the exact loaded count.
  const effectiveTotal =
    !input.hasActiveFilters && input.hasMore
      ? Math.max(dirTotal, loadedCount)
      : loadedCount;

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(input.currentPage || 1)), totalPages);
  const startIndex = effectiveTotal === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = effectiveTotal === 0 ? 0 : Math.min(safePage * pageSize, effectiveTotal);

  return {
    effectiveTotal,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    visiblePages: buildVisiblePageList(safePage, totalPages),
  };
}

export interface D1UserActivitySummary {
  solved: number;
  testAttemptsSolved: number;
  dailyUsageSolved: number;
  guestSolved: number;
  streak: number;
  activeDates: string[];
}

export interface FirestoreAttemptActivityItem {
  solved: number;
  pktDate: string | null;
}

function toNonNegativeInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/**
 * Converts a Firestore Timestamp, Date, epoch ms/s, or ISO string to PKT (UTC+5) YYYY-MM-DD.
 */
export function toPktDateKey(ts: unknown): string | null {
  if (!ts) return null;
  if (typeof ts === 'string') {
    const trimmed = ts.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = Date.parse(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return epochMsToPktDateKey(parsed);
  }
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    const ms = ts > 1e12 ? ts : ts * 1000;
    return epochMsToPktDateKey(ms);
  }
  if (ts instanceof Date) {
    const ms = ts.getTime();
    return Number.isFinite(ms) ? epochMsToPktDateKey(ms) : null;
  }
  if (typeof ts === 'object') {
    const obj = ts as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof obj.toMillis === 'function') {
      try {
        return epochMsToPktDateKey(obj.toMillis());
      } catch {
        return null;
      }
    }
    if (typeof obj.toDate === 'function') {
      try {
        return epochMsToPktDateKey(obj.toDate().getTime());
      } catch {
        return null;
      }
    }
    const secs = typeof obj.seconds === 'number' ? obj.seconds : obj._seconds;
    if (typeof secs === 'number' && Number.isFinite(secs)) {
      return epochMsToPktDateKey(secs * 1000);
    }
  }
  return null;
}

export function epochMsToPktDateKey(ms: number): string {
  const pktMs = ms + 5 * 60 * 60 * 1000;
  const d = new Date(pktMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftPktDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = Date.UTC(y, (m || 1) - 1, (d || 1) + deltaDays);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

/**
 * Computes current active study streak in PKT (Asia/Karachi, UTC+5) matching streakEngine.ts:
 * streak is active if the user practiced today or yesterday (PKT), counting consecutive days backwards.
 */
export function computeConsecutivePktStreak(
  pktDates: Iterable<string>,
  nowMs = Date.now()
): number {
  const validDates = new Set<string>();
  for (const raw of pktDates) {
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      validDates.add(raw);
    }
  }
  if (validDates.size === 0) return 0;

  const todayPkt = epochMsToPktDateKey(nowMs);
  const yesterdayPkt = shiftPktDateKey(todayPkt, -1);

  let cursor: string | null = null;
  if (validDates.has(todayPkt)) {
    cursor = todayPkt;
  } else if (validDates.has(yesterdayPkt)) {
    cursor = yesterdayPkt;
  } else {
    return 0;
  }

  let streak = 0;
  while (cursor && validDates.has(cursor)) {
    streak += 1;
    cursor = shiftPktDateKey(cursor, -1);
  }
  return streak;
}

export function extractProfileSolvedCount(
  raw: Record<string, unknown> | null | undefined
): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const stats = (raw.stats && typeof raw.stats === 'object' ? raw.stats : null) as Record<
    string,
    unknown
  > | null;
  const publicStats = (
    raw.publicStats && typeof raw.publicStats === 'object' ? raw.publicStats : null
  ) as Record<string, unknown> | null;

  const candidates = [
    raw.totalQuestionsSolved,
    raw.questionsSolved,
    raw.mcqsSolved,
    raw.questionsAnswered,
    raw.total_questions_solved,
    stats?.mcqs,
    stats?.questionsAnswered,
    stats?.totalQuestionsSolved,
    stats?.questionsSolved,
    publicStats?.totalQuestionsSolved,
    publicStats?.questionsSolved,
    publicStats?.mcqs,
  ];

  let best: number | null = null;
  for (const c of candidates) {
    const parsed = toNonNegativeInt(c);
    if (parsed !== null) {
      best = best === null ? parsed : Math.max(best, parsed);
    }
  }
  return best;
}

export function extractProfileStreakCount(
  raw: Record<string, unknown> | null | undefined
): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const stats = (raw.stats && typeof raw.stats === 'object' ? raw.stats : null) as Record<
    string,
    unknown
  > | null;
  const publicStats = (
    raw.publicStats && typeof raw.publicStats === 'object' ? raw.publicStats : null
  ) as Record<string, unknown> | null;

  const candidates = [
    raw.streak,
    raw.currentStreak,
    raw.streakDays,
    raw.dailyStreak,
    stats?.streakDays,
    stats?.streak,
    stats?.currentStreak,
    publicStats?.streak,
    publicStats?.currentStreak,
    publicStats?.streakDays,
  ];

  let best: number | null = null;
  for (const c of candidates) {
    const parsed = toNonNegativeInt(c);
    if (parsed !== null) {
      best = best === null ? parsed : Math.max(best, parsed);
    }
  }
  return best;
}

export function extractAttemptSolvedCount(
  attempt: Record<string, unknown> | null | undefined
): number {
  if (!attempt || typeof attempt !== 'object') return 0;

  // Check if the attempt is completed (or has answers/scores recorded)
  const status = String(attempt.status || '').toLowerCase();
  const hasCompletionSignal =
    status === 'completed' ||
    status === 'submitted' ||
    attempt.percentage !== undefined ||
    attempt.score !== undefined ||
    attempt.earnedMarks !== undefined ||
    attempt.submittedAt !== undefined ||
    attempt.completedAt !== undefined;

  if (!hasCompletionSignal) return 0;

  const explicitAnswered = toNonNegativeInt(
    attempt.answeredCount ?? attempt.questionsAnswered ?? attempt.solvedCount
  );
  if (explicitAnswered !== null && explicitAnswered > 0) {
    return explicitAnswered;
  }

  const correct = toNonNegativeInt(attempt.correctAnswers ?? attempt.correctCount);
  const wrong = toNonNegativeInt(attempt.wrongAnswers ?? attempt.wrongCount);
  if (correct !== null && wrong !== null && correct + wrong > 0) {
    return correct + wrong;
  }

  const totalQ = toNonNegativeInt(attempt.totalQuestions ?? attempt.total_questions);
  const unanswered = toNonNegativeInt(attempt.unanswered);
  if (totalQ !== null && totalQ > 0) {
    if (unanswered !== null && unanswered <= totalQ) {
      return Math.max(0, totalQ - unanswered);
    }
    return totalQ;
  }

  if (attempt.userAnswers && typeof attempt.userAnswers === 'object') {
    const ansVals = Array.isArray(attempt.userAnswers)
      ? attempt.userAnswers.filter((v) => v !== null && v !== undefined && v !== -1)
      : Object.values(attempt.userAnswers as Record<string, unknown>).filter(
          (v) => v !== null && v !== undefined && v !== -1
        );
    if (ansVals.length > 0) return ansVals.length;
  }

  if (Array.isArray(attempt.questions) && attempt.questions.length > 0) {
    return attempt.questions.length;
  }

  return 0;
}

export function mergeUserActivityMetrics(params: {
  user: Record<string, unknown>;
  publicProfile?: Record<string, unknown> | null;
  d1Activity?: Partial<D1UserActivitySummary> | null;
  firestoreAttempts?: FirestoreAttemptActivityItem[];
  nowMs?: number;
}): { totalQuestionsSolved: number; streak: number } {
  const profileSolved = extractProfileSolvedCount(params.user) ?? 0;
  const publicSolved = extractProfileSolvedCount(params.publicProfile) ?? 0;

  const fsAttempts = Array.isArray(params.firestoreAttempts) ? params.firestoreAttempts : [];
  let firestoreAttemptsSolved = 0;
  const activeDates = new Set<string>();

  for (const att of fsAttempts) {
    firestoreAttemptsSolved += Math.max(0, Math.floor(Number(att.solved || 0)));
    if (att.pktDate) {
      activeDates.add(att.pktDate);
    }
  }

  const d1 = params.d1Activity || null;
  const d1GrandLineSolved = Math.max(0, Math.floor(Number(d1?.testAttemptsSolved || 0)));
  const d1DailyUsageSolved = Math.max(0, Math.floor(Number(d1?.dailyUsageSolved || 0)));
  const d1GuestSolved = Math.max(0, Math.floor(Number(d1?.guestSolved || 0)));
  const d1TotalSolved = Math.max(0, Math.floor(Number(d1?.solved || 0)));

  if (Array.isArray(d1?.activeDates)) {
    for (const dateKey of d1.activeDates) {
      if (dateKey) activeDates.add(dateKey);
    }
  }

  // Firestore `attempts` (practice tests) and D1 `test_attempts` (Grand Line tests) are disjoint,
  // while `daily_starter_usage` overlaps with practice attempts. Take the highest non-double-counted sum.
  const combinedDisjointAttempts = firestoreAttemptsSolved + d1GrandLineSolved;
  const totalQuestionsSolved = Math.max(
    profileSolved,
    publicSolved,
    firestoreAttemptsSolved,
    d1DailyUsageSolved,
    d1GuestSolved,
    d1TotalSolved,
    combinedDisjointAttempts
  );

  // Streak: compute from all active PKT session dates and preserve any higher stored streak.
  const computedStreak = computeConsecutivePktStreak(activeDates, params.nowMs);
  const profileStreak = extractProfileStreakCount(params.user) ?? 0;
  const publicStreak = extractProfileStreakCount(params.publicProfile) ?? 0;
  const d1Streak = Math.max(0, Math.floor(Number(d1?.streak || 0)));

  const streak = Math.max(computedStreak, profileStreak, publicStreak, d1Streak);

  return {
    totalQuestionsSolved,
    streak,
  };
}
