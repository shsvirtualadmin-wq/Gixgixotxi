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

export interface AuthoritativeUsersTotalInput {
  totalDirectoryCount: number | null;
  loadedCount: number;
  loading: boolean;
  loadState: 'loading' | 'loaded' | 'error';
}

export interface AuthoritativeUsersTotalState {
  status: 'loading' | 'ready' | 'error';
  count: number | null;
}

/**
 * Resolves the single authoritative total user count for the Super Admin Users page.
 * Never returns 0 or a partial loaded count while the authoritative directory count is
 * still pending or failed to load.
 */
export function resolveAuthoritativeUsersTotal(
  input: AuthoritativeUsersTotalInput
): AuthoritativeUsersTotalState {
  const verifiedTotal =
    typeof input.totalDirectoryCount === 'number' &&
    Number.isFinite(input.totalDirectoryCount) &&
    input.totalDirectoryCount >= 0
      ? Math.floor(input.totalDirectoryCount)
      : null;

  if (verifiedTotal !== null) {
    return { status: 'ready', count: verifiedTotal };
  }

  if (input.loadState === 'error' && !input.loading) {
    return { status: 'error', count: null };
  }

  return { status: 'loading', count: null };
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

export interface DailySubcollectionActivityItem {
  pktDate: string | null;
  solved: number;
  hasActivity?: boolean;
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
 * When `freezeActive` is enabled (matching `users/{uid}.streakFreezeActive` / `streaks/{uid}.freezeActive`),
 * a single missed day is bridged without breaking the chain.
 */
export function computeConsecutivePktStreak(
  pktDates: Iterable<string>,
  nowMs = Date.now(),
  options?: { freezeActive?: boolean }
): number {
  const validDates = new Set<string>();
  for (const raw of pktDates) {
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      validDates.add(raw);
    }
  }
  if (validDates.size === 0) return 0;

  const freezeActive = Boolean(options?.freezeActive);
  const todayPkt = epochMsToPktDateKey(nowMs);
  const yesterdayPkt = shiftPktDateKey(todayPkt, -1);

  let freezeUsed = false;
  let cursor: string | null = null;
  if (validDates.has(todayPkt)) {
    cursor = todayPkt;
  } else if (validDates.has(yesterdayPkt)) {
    cursor = yesterdayPkt;
  } else if (freezeActive) {
    freezeUsed = true;
    cursor = shiftPktDateKey(yesterdayPkt, -1);
    if (!validDates.has(cursor)) {
      return 0;
    }
  } else {
    return 0;
  }

  let streak = 0;
  while (cursor) {
    if (validDates.has(cursor)) {
      streak += 1;
      cursor = shiftPktDateKey(cursor, -1);
    } else if (freezeActive && !freezeUsed) {
      freezeUsed = true;
      cursor = shiftPktDateKey(cursor, -1);
    } else {
      break;
    }
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
  const practiceStats = (
    raw.practiceStats && typeof raw.practiceStats === 'object' ? raw.practiceStats : null
  ) as Record<string, unknown> | null;

  const candidates = [
    raw.totalQuestionsSolved,
    raw.questionsSolved,
    raw.mcqsSolved,
    raw.questionsAnswered,
    raw.total_questions_solved,
    raw.solvedCount,
    raw.totalSolved,
    stats?.mcqs,
    stats?.mcqsSolved,
    stats?.questionsAnswered,
    stats?.totalQuestionsSolved,
    stats?.questionsSolved,
    stats?.solved,
    publicStats?.totalQuestionsSolved,
    publicStats?.questionsSolved,
    publicStats?.questionsAnswered,
    publicStats?.mcqs,
    publicStats?.mcqsSolved,
    publicStats?.solved,
    practiceStats?.totalQuestionsSolved,
    practiceStats?.questionsSolved,
    practiceStats?.mcqsSolved,
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
    raw.current_streak,
    raw.streakDays,
    raw.streak_days,
    raw.dailyStreak,
    raw.streakCount,
    stats?.streakDays,
    stats?.streak,
    stats?.currentStreak,
    stats?.current_streak,
    publicStats?.streak,
    publicStats?.currentStreak,
    publicStats?.current_streak,
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

export function extractStreakDocMetrics(
  streakDoc: Record<string, unknown> | null | undefined
): {
  storedStreak: number;
  freezeActive: boolean;
  activeDates: string[];
  historySolved: number;
} {
  if (!streakDoc || typeof streakDoc !== 'object') {
    return { storedStreak: 0, freezeActive: false, activeDates: [], historySolved: 0 };
  }

  const storedStreak = extractProfileStreakCount(streakDoc) ?? 0;
  const freezeActive = Boolean(streakDoc.freezeActive ?? streakDoc.streakFreezeActive);
  const dates = new Set<string>();
  let historySolved = 0;

  const lastActive = toPktDateKey(streakDoc.lastActivePKT ?? streakDoc.lastActiveDate);
  if (lastActive) {
    dates.add(lastActive);
  }

  const historyList = Array.isArray(streakDoc.history28)
    ? streakDoc.history28
    : Array.isArray(streakDoc.last7Days)
    ? streakDoc.last7Days
    : [];

  for (const entry of historyList) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const dateKey = toPktDateKey(item.date ?? item.pktDate);
    const mcqs = toNonNegativeInt(item.mcqsSolved ?? item.questionsSolved) ?? 0;
    const practiced = Boolean(item.practiced || item.hasActivity || mcqs > 0);
    if (practiced && dateKey) {
      dates.add(dateKey);
    }
    if (mcqs > 0) {
      historySolved += mcqs;
    }
  }

  return {
    storedStreak,
    freezeActive,
    activeDates: Array.from(dates),
    historySolved,
  };
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
  streakDoc?: Record<string, unknown> | null;
  d1Activity?: Partial<D1UserActivitySummary> | null;
  firestoreAttempts?: FirestoreAttemptActivityItem[];
  subcollectionActivity?: DailySubcollectionActivityItem[];
  nowMs?: number;
}): { totalQuestionsSolved: number; streak: number } {
  const profileSolved = extractProfileSolvedCount(params.user) ?? 0;
  const publicSolved = extractProfileSolvedCount(params.publicProfile) ?? 0;
  const streakDocMetrics = extractStreakDocMetrics(params.streakDoc);

  const fsAttempts = Array.isArray(params.firestoreAttempts) ? params.firestoreAttempts : [];
  let firestoreAttemptsSolved = 0;
  const activeDates = new Set<string>();

  for (const att of fsAttempts) {
    firestoreAttemptsSolved += Math.max(0, Math.floor(Number(att.solved || 0)));
    if (att.pktDate) {
      activeDates.add(att.pktDate);
    }
  }

  for (const d of streakDocMetrics.activeDates) {
    activeDates.add(d);
  }

  const userLastActive = toPktDateKey(
    params.user.lastActiveDate ?? params.user.lastActivePKT ?? params.user.lastPracticeAt
  );
  if (userLastActive) {
    activeDates.add(userLastActive);
  }

  const subItems = Array.isArray(params.subcollectionActivity) ? params.subcollectionActivity : [];
  let subcollectionSolved = 0;
  const subSolvedByDate = new Map<string, number>();
  for (const item of subItems) {
    const solved = Math.max(0, Math.floor(Number(item.solved || 0)));
    if (item.pktDate) {
      if (solved > 0 || item.hasActivity) {
        activeDates.add(item.pktDate);
      }
      // Deduplicate overlapping `activity/{date}` and `usage/{date}` docs for the same PKT date
      const prev = subSolvedByDate.get(item.pktDate) ?? 0;
      subSolvedByDate.set(item.pktDate, Math.max(prev, solved));
    } else if (solved > 0) {
      subcollectionSolved += solved;
    }
  }
  for (const daySolved of subSolvedByDate.values()) {
    subcollectionSolved += daySolved;
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
  // while `daily_starter_usage` and `users/{uid}/activity` overlap with practice attempts.
  // Take the highest non-double-counted sum across all authoritative student sources.
  const combinedDisjointAttempts = firestoreAttemptsSolved + d1GrandLineSolved;
  const totalQuestionsSolved = Math.max(
    profileSolved,
    publicSolved,
    streakDocMetrics.historySolved,
    firestoreAttemptsSolved,
    subcollectionSolved,
    d1DailyUsageSolved,
    d1GuestSolved,
    d1TotalSolved,
    combinedDisjointAttempts
  );

  // Streak: compute from all active PKT session dates with the same Streak Freeze logic
  // as `streakEngine.ts`, and preserve any higher stored streak from users/publicProfiles/streaks/D1.
  const freezeActive = Boolean(
    params.user.streakFreezeActive || streakDocMetrics.freezeActive
  );
  const computedStreak = computeConsecutivePktStreak(activeDates, params.nowMs, { freezeActive });
  const profileStreak = extractProfileStreakCount(params.user) ?? 0;
  const publicStreak = extractProfileStreakCount(params.publicProfile) ?? 0;
  const d1Streak = Math.max(0, Math.floor(Number(d1?.streak || 0)));

  const streak = Math.max(
    computedStreak,
    profileStreak,
    publicStreak,
    streakDocMetrics.storedStreak,
    d1Streak
  );

  return {
    totalQuestionsSolved,
    streak,
  };
}
