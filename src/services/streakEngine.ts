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
export function toPKTDateString(timestamp: any): string | null {
  if (!timestamp) return null;
  let date: Date;

  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && (timestamp._seconds || timestamp.seconds)) {
    date = new Date((timestamp._seconds || timestamp.seconds) * 1000);
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
export function getPKTWeekday(pktDate: string): { short: string; narrow: string; dayNum: number; month: string } {
  const [y, m, d] = pktDate.split('-').map(Number);
  // Noon UTC on that calendar day is unambiguous
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const short = date.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', weekday: 'short' });
  const narrow = date.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', weekday: 'narrow' });
  const month = date.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short' });
  return { short, narrow, dayNum: d, month };
}

/**
 * ─── STREAK CALCULATION INTERFACES ──────────────────────────────────────────
 */

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
  freezeActive: boolean;
  freezeUsed: boolean;
  freezeDate?: string | null;
  activePKTDays: string[];
  activePKTDaysSet: Set<string>;
  sessionsByDay: Record<string, number>;
  history28: StreakDayInfo[];
  last7Days: SevenDayItem[];
  totalCompletedSessions: number;
}

/**
 * Authoritative streak calculation function:
 * Single source of truth for Dashboard card, Streaks page, Profile, Badges, and Crew Leaderboard.
 */
export function computeStreakFromSessions(
  sessionPKTDates: string[],
  options?: {
    freezeActive?: boolean;
    todayPKT?: string;
  }
): StreakComputationResult {
  const today = options?.todayPKT || getCurrentPKTDate();
  const yesterday = shiftPKTDate(today, -1);
  const freezeActive = Boolean(options?.freezeActive);

  // 1. Group sessions by PKT day
  const sessionsByDay: Record<string, number> = {};
  for (const date of sessionPKTDates) {
    if (date) {
      sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
    }
  }

  const activePKTDaysSet = new Set(Object.keys(sessionsByDay));
  const activePKTDays = Array.from(activePKTDaysSet).sort();
  const totalCompletedSessions = sessionPKTDates.length;

  const todayActive = activePKTDaysSet.has(today);
  const todayPending = !todayActive;

  // 2. Current streak calculation
  // "Current streak = consecutive streak days ending today, or ending yesterday while today is still pending.
  // A pending today never breaks the streak. A Freeze covers one missed day and keeps the chain unbroken."
  let currentStreak = 0;
  let freezeUsed = false;
  let freezeDate: string | null = null;

  // Chain starts at today if active, else from yesterday while today is pending
  let checkDate = todayActive ? today : yesterday;
  let chainBroken = false;

  // If today is not active and yesterday is also not active:
  if (!todayActive && !activePKTDaysSet.has(yesterday)) {
    if (freezeActive) {
      // Freeze can cover yesterday
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
        // Freeze covers one missed day in the streak chain
        freezeUsed = true;
        freezeDate = dayCursor;
        dayCursor = shiftPKTDate(dayCursor, -1);
      } else {
        break;
      }
    }
  }

  // 3. Longest streak calculation across all time
  let longestStreak = currentStreak;
  if (activePKTDays.length > 0) {
    // Check all contiguous chains in history
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

  // 4. Build 28-day matrix (ending today in PKT)
  const history28: StreakDayInfo[] = [];
  for (let offset = 27; offset >= 0; offset--) {
    const dStr = shiftPKTDate(today, -offset);
    const { short, narrow, dayNum, month } = getPKTWeekday(dStr);
    const hasActivity = activePKTDaysSet.has(dStr);
    const isFrozen = freezeUsed && freezeDate === dStr;
    history28.push({
      date: dStr,
      dayNum,
      month,
      weekday: short,
      weekdayNarrow: narrow,
      hasActivity,
      sessionCount: sessionsByDay[dStr] || 0,
      isToday: dStr === today,
      isFrozen,
    });
  }

  // 5. Build 7-day row (last 7 days ending today in PKT)
  const last7Days: SevenDayItem[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dStr = shiftPKTDate(today, -offset);
    const { narrow } = getPKTWeekday(dStr);
    const hasActivity = activePKTDaysSet.has(dStr);
    const isFrozen = freezeUsed && freezeDate === dStr;
    last7Days.push({
      date: dStr,
      label: narrow,
      isActive: hasActivity || isFrozen,
      isToday: dStr === today,
      isFrozen,
      sessionCount: sessionsByDay[dStr] || 0,
    });
  }

  return {
    currentStreak,
    longestStreak,
    todayActive,
    todayPending,
    freezeActive,
    freezeUsed,
    freezeDate,
    activePKTDays,
    activePKTDaysSet,
    sessionsByDay,
    history28,
    last7Days,
    totalCompletedSessions,
  };
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
    let attemptDocs: any[] = [];

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
