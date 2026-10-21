import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncPublicProfile } from '@/services/publicProfileService';

/**
 * ─── DATE & TIMEZONE HELPERS (SINGLE SOURCE OF TRUTH: PKT UTC+5) ─────────────
 */

/**
 * Converts any timestamp (Date, number, string, Firestore Timestamp) to PKT date 'YYYY-MM-DD'.
 * Boundary is precisely 00:00:00 PKT (Asia/Karachi, UTC+5).
 */
export function toPKTDateString(timestamp: unknown): string | null {
  if (!timestamp) return null;
  let date: Date;

  const ts = timestamp as Record<string, unknown>;
  if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (ts && (ts._seconds || ts.seconds)) {
    const sec = Number(ts._seconds ?? ts.seconds);
    date = new Date(sec * 1000);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

/**
 * Returns today's calendar date in PKT as 'YYYY-MM-DD'.
 */
export function getCurrentPKTDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

/**
 * Shifts a PKT date string 'YYYY-MM-DD' by N days using deterministic UTC arithmetic.
 * Free from browser local timezone, DST or client clock interference.
 */
export function shiftPKTDate(pktDate: string, daysOffset: number): string {
  const [y, m, d] = pktDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + daysOffset));
  return utcDate.toISOString().slice(0, 10);
}

/**
 * Returns weekday labels for a PKT date string.
 */
/**
 * Returns deterministic date parts for any PKT date 'YYYY-MM-DD'.
 * Uses UTC noon to eliminate all local timezone, DST, and client clock offsets.
 */
export function getPKTDateParts(pktDate: string) {
  const [y, m, d] = pktDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = utcDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
  const monthShort = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
  const monthLong = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' });
  const weekdayShort = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
  const initials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekdayInitial = initials[daysSinceMonday];
  return {
    year: y,
    monthNum: m,
    dayNum: d,
    dayOfWeek,
    daysSinceMonday,
    monthShort,
    monthLong,
    weekdayShort,
    weekdayInitial,
  };
}

export function getPKTWeekday(pktDate: string): { short: string; narrow: string; dayNum: number; month: string } {
  const parts = getPKTDateParts(pktDate);
  return { short: parts.weekdayShort, narrow: parts.weekdayInitial, dayNum: parts.dayNum, month: parts.monthShort };
}

/**
 * ─── STREAK CALCULATION INTERFACES ──────────────────────────────────────────
 */

export interface StreakCalendarDay {
  date: string;
  dayNum: number;
  month: string;
  monthLong: string;
  weekday: string;
  weekdayInitial: string;
  isPracticed: boolean;
  isToday: boolean;
  isFrozen: boolean;
  isFuture: boolean;
  sessionCount: number;
  mcqsSolved: number;
  monthLabel?: string;
}

export interface StreakDayInfo {
  date: string;
  dayNum: number;
  month: string;
  weekday: string;
  weekdayNarrow: string;
  hasActivity: boolean;
  sessionCount: number;
  isToday: boolean;
  isFrozen?: boolean;
}

export interface SevenDayItem {
  date: string;
  label: string; // e.g. 'M', 'T', 'W'
  isActive: boolean;
  isToday: boolean;
  isFrozen?: boolean;
  sessionCount: number;
}

export interface StreakComputationResult {
  currentStreak: number;
  longestStreak: number;
  todayActive: boolean;
  todayPending: boolean;
  todayStatus: {
    isDone: boolean;
    isPending: boolean;
    todayPKT: string;
    text: string;
  };
  freezeActive: boolean;
  freezeUsed: boolean;
  freezeDate?: string | null;
  activePKTDays: string[];
  activePKTDaysSet: Set<string>;
  sessionsByDay: Record<string, number>;
  dayDetails: Record<
    string,
    { practiceAttempts: number; mcqsSolved: number; aiTutorTokens: number; arenaSessions: number }
  >;
  thisWeek: StreakCalendarDay[];
  last7Days: StreakCalendarDay[];
  last28Days: StreakCalendarDay[];
  history28: StreakDayInfo[];
  totalCompletedSessions: number;
}

/**
 * ONE shared authoritative streak calculation function:
 * Takes the user's activity days (as PKT calendar dates or detail map) and returns:
 * - currentStreak
 * - longestStreak
 * - todayStatus
 * - last7Days (Monday through Sunday of the current week in PKT)
 * - last28Days (4 full calendar weeks of 7 days: M T W T F S S in PKT)
 * All views must use this function, and the day boundary is midnight PKT everywhere.
 */
export function computeStreakData(
  activityInput: string[] | Record<string, any>,
  options?: {
    freezeActive?: boolean;
    todayPKT?: string;
  }
): StreakComputationResult {
  const today = options?.todayPKT || getCurrentPKTDate();
  const yesterday = shiftPKTDate(today, -1);
  const freezeActive = Boolean(options?.freezeActive);

  // 1. Normalize activity inputs into dayDetails map & activePKTDaysSet
  const sessionsByDay: Record<string, number> = {};
  const dayDetails: Record<
    string,
    { practiceAttempts: number; mcqsSolved: number; aiTutorTokens: number; arenaSessions: number }
  > = {};

  if (Array.isArray(activityInput)) {
    for (const d of activityInput) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        sessionsByDay[d] = (sessionsByDay[d] || 0) + 1;
        dayDetails[d] = {
          practiceAttempts: (dayDetails[d]?.practiceAttempts || 0) + 1,
          mcqsSolved: (dayDetails[d]?.mcqsSolved || 0) + 10,
          aiTutorTokens: dayDetails[d]?.aiTutorTokens || 0,
          arenaSessions: dayDetails[d]?.arenaSessions || 0,
        };
      }
    }
  } else if (activityInput && typeof activityInput === 'object') {
    for (const [dateStr, rawVal] of Object.entries(activityInput)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const val = rawVal as Record<string, unknown> | undefined;
        const practiceCount = Number(val?.practiceAttempts ?? val?.testsUsed ?? val?.sessions ?? 0);
        const mcqCount = Number(val?.mcqsSolved ?? val?.questionsSolved ?? practiceCount * 10);
        const arenaCount = Number(val?.arenaSessions ?? 0);
        const aiCount = Number(val?.aiTutorTokens ?? 0);
        const isCompleted = Boolean(
          practiceCount > 0 ||
          arenaCount > 0 ||
          mcqCount > 0 ||
          val?.hasActivity === true
        );
        if (isCompleted) {
          sessionsByDay[dateStr] = Math.max(1, practiceCount || 1);
          dayDetails[dateStr] = {
            practiceAttempts: practiceCount || 1,
            mcqsSolved: mcqCount || 10,
            aiTutorTokens: aiCount,
            arenaSessions: arenaCount,
          };
        }
      }
    }
  }

  const activePKTDaysSet = new Set(Object.keys(sessionsByDay));
  const activePKTDays = Array.from(activePKTDaysSet).sort();
  const totalCompletedSessions = Object.values(sessionsByDay).reduce((a, b) => a + b, 0);

  const todayActive = activePKTDaysSet.has(today);
  const todayPending = !todayActive;

  // 2. Authoritative Current Streak Calculation
  // Current streak = consecutive streak days ending today (if practiced today),
  // or ending yesterday while today is still pending.
  // A pending today NEVER breaks the streak.
  // A Streak Freeze covers one missed day and keeps the chain unbroken.
  let currentStreak = 0;
  let freezeUsed = false;
  let freezeDate: string | null = null;

  let checkDate = todayActive ? today : yesterday;
  let chainBroken = false;

  // If today is not active and yesterday was also not active:
  if (!todayActive && !activePKTDaysSet.has(yesterday)) {
    if (freezeActive) {
      freezeUsed = true;
      freezeDate = yesterday;
      checkDate = shiftPKTDate(yesterday, -1);
    } else {
      chainBroken = true;
    }
  }

  if (!chainBroken) {
    let dayCursor = checkDate;
    while (true) {
      if (activePKTDaysSet.has(dayCursor)) {
        currentStreak += 1;
        dayCursor = shiftPKTDate(dayCursor, -1);
      } else if (freezeActive && !freezeUsed) {
        freezeUsed = true;
        freezeDate = dayCursor;
        dayCursor = shiftPKTDate(dayCursor, -1);
      } else {
        break;
      }
    }
  }

  // 3. Longest Streak Calculation across all history
  let longestStreak = currentStreak;
  if (activePKTDays.length > 0) {
    let maxChain = 0;
    const sortedDays = [...activePKTDays];
    for (let i = 0; i < sortedDays.length; i++) {
      let chainLen = 1;
      let cur = sortedDays[i];
      let canUseFreeze = freezeActive;
      while (true) {
        const prev = shiftPKTDate(cur, -1);
        if (activePKTDaysSet.has(prev)) {
          chainLen++;
          cur = prev;
        } else if (canUseFreeze) {
          canUseFreeze = false;
          cur = prev;
        } else {
          break;
        }
      }
      if (chainLen > maxChain) maxChain = chainLen;
    }
    longestStreak = Math.max(longestStreak, maxChain);
  }

  // 4. Build 4-week calendar grid (28 cells: 4 full weeks of Monday to Sunday in PKT)
  const { daysSinceMonday } = getPKTDateParts(today);
  const currentWeekMonday = shiftPKTDate(today, -daysSinceMonday);
  const gridStartMonday = shiftPKTDate(currentWeekMonday, -21); // 3 weeks prior

  const last28Days: StreakCalendarDay[] = [];
  const history28: StreakDayInfo[] = [];
  let previousMonth = '';

  for (let offset = 0; offset < 28; offset++) {
    const dStr = shiftPKTDate(gridStartMonday, offset);
    const parts = getPKTDateParts(dStr);
    const isToday = dStr === today;
    const isFuture = dStr > today;
    const isPracticed = activePKTDaysSet.has(dStr);
    const isFrozen = Boolean(freezeUsed && freezeDate === dStr);
    const details = dayDetails[dStr];

    let monthLabel: string | undefined = undefined;
    if (offset === 0) {
      monthLabel = parts.monthShort;
      previousMonth = parts.monthShort;
    } else if (parts.monthShort !== previousMonth) {
      monthLabel = parts.monthShort;
      previousMonth = parts.monthShort;
    }

    const dayItem: StreakCalendarDay = {
      date: dStr,
      dayNum: parts.dayNum,
      month: parts.monthShort,
      monthLong: parts.monthLong,
      weekday: parts.weekdayShort,
      weekdayInitial: parts.weekdayInitial,
      isPracticed,
      isToday,
      isFrozen,
      isFuture,
      sessionCount: details?.practiceAttempts || (isPracticed ? 1 : 0),
      mcqsSolved: details?.mcqsSolved || (isPracticed ? 10 : 0),
      monthLabel,
    };

    last28Days.push(dayItem);

    // Backwards-compatible history28 entry
    history28.push({
      date: dStr,
      dayNum: parts.dayNum,
      month: parts.monthShort,
      weekday: parts.weekdayShort,
      weekdayNarrow: parts.weekdayInitial,
      hasActivity: isPracticed,
      sessionCount: dayItem.sessionCount,
      isToday,
      isFrozen,
    });
  }

  // 5. Build 7-day row ("This week": Monday through Sunday of current week in PKT)
  // These are the last 7 items in last28Days (offset 21 to 27)
  const thisWeek: StreakCalendarDay[] = last28Days.slice(21, 28);
  const last7Days: StreakCalendarDay[] = thisWeek;

  return {
    currentStreak,
    longestStreak,
    todayActive,
    todayPending,
    todayStatus: {
      isDone: todayActive,
      isPending: todayPending,
      todayPKT: today,
      text: todayActive
        ? "Today's practice done"
        : 'Practice today to keep your streak. Ends 11:59 PM PKT',
    },
    freezeActive,
    freezeUsed,
    freezeDate,
    activePKTDays,
    activePKTDaysSet,
    sessionsByDay,
    dayDetails,
    thisWeek,
    last7Days,
    last28Days,
    history28,
    totalCompletedSessions,
  };
}

/**
 * Backwards compatibility wrapper for computeStreakFromSessions
 */
export function computeStreakFromSessions(
  sessionPKTDates: string[],
  options?: {
    freezeActive?: boolean;
    todayPKT?: string;
  }
): StreakComputationResult {
  return computeStreakData(sessionPKTDates, options);
}

/**
 * ─── FIRESTORE QUERY & SYNC ───────────────────────────────────────────────────
 */

/**
 * Extracts completed session dates from attempts and usage records for a user.
 */
export async function fetchUserCompletedSessionDates(uid: string): Promise<string[]> {
  const dates: string[] = [];

  try {
    // 1. Fetch completed attempts for user
    const attemptsRef = collection(db, 'attempts');
    let attemptDocs: QueryDocumentSnapshot<DocumentData>[] = [];

    try {
      const q1 = query(attemptsRef, where('uid', '==', uid));
      const snap1 = await getDocs(q1);
      attemptDocs = snap1.docs;
    } catch {
      // Fallback if index on uid is building
    }

    if (attemptDocs.length === 0) {
      try {
        const q2 = query(attemptsRef, where('userId', '==', uid));
        const snap2 = await getDocs(q2);
        attemptDocs = snap2.docs;
      } catch {
        // Fallback
      }
    }

    for (const d of attemptDocs) {
      const data = d.data();
      // Valid session check: completed status (test, sprint, drill, mock, arena, grand line)
      const isCompleted =
        data.status === 'completed' ||
        data.percentage !== undefined ||
        data.score !== undefined ||
        data.earnedMarks !== undefined;

      if (!isCompleted) continue;

      // Completion time is the single source of truth (completion time, not start time)
      const completionTimestamp =
        data.completedAt ||
        data.submittedAt ||
        data.endedAt ||
        data.updatedAt ||
        data.createdAt;

      const pktDate = toPKTDateString(completionTimestamp);
      if (pktDate) {
        dates.push(pktDate);
      }
    }

    // 2. Fetch usage subcollection records as secondary source for past practice days
    try {
      const usageSnap = await getDocs(collection(db, 'users', uid, 'usage'));
      usageSnap.docs.forEach((d) => {
        const udata = d.data();
        const practiceCount = Number(udata.practiceAttempts ?? 0);
        const arenaCount = Number(udata.arenaSessions ?? 0);
        const testCount = Number(udata.testsUsed ?? 0);
        if (practiceCount > 0 || arenaCount > 0 || testCount > 0) {
          // Document ID is already a PKT date string 'YYYY-MM-DD'
          if (/^\d{4}-\d{2}-\d{2}$/.test(d.id)) {
            dates.push(d.id);
          }
        }
      });
    } catch {
      // Ignore if subcollection is empty
    }
  } catch (err) {
    console.warn('[streakEngine] Error fetching completed sessions for user:', uid, err);
  }

  return dates;
}

/**
 * Recomputes streak for a user, saves to streaks/{uid}, mirrors to users/{uid} & publicProfiles/{uid}.
 */
export async function syncUserStreak(
  uid: string,
  options?: { freezeActive?: boolean }
): Promise<StreakComputationResult> {
  // 1. Fetch user doc for freeze setting
  let freezeActive = options?.freezeActive ?? false;
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      const udata = userSnap.data();
      if (options?.freezeActive === undefined) {
        freezeActive = Boolean(udata.streakFreezeActive);
      }
    }
  } catch (err) {
    console.warn('[streakEngine] Could not read user doc:', err);
  }

  // 2. Fetch all completed session PKT dates
  const sessionDates = await fetchUserCompletedSessionDates(uid);

  // 3. Run shared calculation
  const result = computeStreakFromSessions(sessionDates, { freezeActive });

  // 4. Save to streaks/{uid}
  try {
    const streakDocRef = doc(db, 'streaks', uid);
    await setDoc(
      streakDocRef,
      {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        todayActive: result.todayActive,
        todayPending: result.todayPending,
        activeDaysCount: result.activePKTDays.length,
        totalSessions: result.totalCompletedSessions,
        lastActivePKT: result.activePKTDays[result.activePKTDays.length - 1] || null,
        freezeActive: result.freezeActive,
        freezeUsed: result.freezeUsed,
        freezeDate: result.freezeDate || null,
        history28: result.history28,
        last7Days: result.last7Days,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[streakEngine] Failed to save streaks/{uid}:', err);
  }

  // 5. Mirror to users/{uid}
  try {
    await updateDoc(doc(db, 'users', uid), {
      streak: result.currentStreak,
      lastActiveDate: result.activePKTDays[result.activePKTDays.length - 1] || null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[streakEngine] Failed to mirror streak to users/{uid}:', err);
  }

  // 6. Mirror to publicProfiles/{uid} for leaderboards and squad views
  try {
    await syncPublicProfile(uid, {
      publicStats: {
        streak: result.currentStreak,
      },
    });
  } catch (err) {
    console.warn('[streakEngine] Failed to sync publicProfile streak:', err);
  }

  return result;
}

/**
 * Superadmin batch recalculator: recalculates streaks for all registered users.
 */
export async function recalculateAllUserStreaks(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const uDoc of usersSnap.docs) {
      try {
        await syncUserStreak(uDoc.id);
        processed++;
      } catch (err) {
        console.error(`[recalculateAllUserStreaks] Failed for user ${uDoc.id}:`, err);
        errors++;
      }
    }
  } catch (err) {
    console.error('[recalculateAllUserStreaks] Batch query failed:', err);
    throw err;
  }

  return { processed, errors };
}
