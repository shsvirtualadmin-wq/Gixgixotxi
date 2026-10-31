import { api } from '@/lib/api';
import { syncPublicProfile } from '@/services/publicProfileService';

/**
 * ─── DATE & TIMEZONE HELPERS (SINGLE SOURCE OF TRUTH: PKT UTC+5) ─────────────
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

  try {
    const formatted = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
    if (formatted.includes('/')) {
      const parts = formatted.split('/');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  } catch {
    // Fall back to pure UTC+5 calculation
  }

  const pktMs = date.getTime() + 5 * 3600 * 1000;
  const d = new Date(pktMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentPKTDate(): string {
  try {
    const formatted = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
    if (formatted.includes('/')) {
      const parts = formatted.split('/');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  } catch {
    // Fall back to pure UTC+5 calculation
  }

  const pktMs = Date.now() + 5 * 3600 * 1000;
  const d = new Date(pktMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftPKTDate(pktDate?: string | null, daysOffset = 0): string {
  const base = pktDate ? String(pktDate).replace(/\//g, '-').trim() : getCurrentPKTDate();
  const parts = base.split('-').map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 1;
  const d = (parts[2] || 1) + daysOffset;
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(utcDate.getTime())) {
    return getCurrentPKTDate();
  }
  return utcDate.toISOString().slice(0, 10);
}

export function getPKTDateParts(pktDate?: string | null) {
  const base = pktDate ? String(pktDate).replace(/\//g, '-').trim() : getCurrentPKTDate();
  const parts = base.split('-').map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 1;
  const d = parts[2] || 1;
  let utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (isNaN(utcDate.getTime())) {
    utcDate = new Date();
  }
  const dayOfWeek = utcDate.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  let monthShort = 'Jan';
  let monthLong = 'January';
  let weekdayShort = 'Mon';
  try {
    monthShort = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
    monthLong = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' });
    weekdayShort = utcDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
  } catch {
    // ignore
  }

  const initials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekdayInitial = initials[daysSinceMonday] || 'M';
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

export function getPKTWeekday(pktDate?: string | null): { short: string; narrow: string; dayNum: number; month: string } {
  const parts = getPKTDateParts(pktDate);
  return { short: parts.weekdayShort, narrow: parts.weekdayInitial, dayNum: parts.dayNum, month: parts.monthShort };
}

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
  label: string;
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

  let currentStreak = 0;
  let freezeUsed = false;
  let freezeDate: string | null = null;

  let checkDate = todayActive ? today : yesterday;
  let chainBroken = false;

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

  const { daysSinceMonday } = getPKTDateParts(today);
  const currentWeekMonday = shiftPKTDate(today, -daysSinceMonday);
  const gridStartMonday = shiftPKTDate(currentWeekMonday, -21);

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
 * Extracts completed session dates from D1 practice attempts and usage records for a user.
 */
export async function fetchUserCompletedSessionDates(uid: string): Promise<string[]> {
  const dates: string[] = [];

  try {
    const [attemptsRes, usageRes] = await Promise.all([
      api.get<{ attempts: any[] }>(`/api/practice-attempts?uid=${encodeURIComponent(uid)}&limit=200`).catch(() => ({ attempts: [] })),
      api.get<{ usage: any[] }>(`/api/usage?uid=${encodeURIComponent(uid)}&limit=100`).catch(() => ({ usage: [] })),
    ]);

    const attempts = Array.isArray(attemptsRes?.attempts) ? attemptsRes.attempts : [];
    for (const data of attempts) {
      const isCompleted =
        data.status === 'completed' ||
        data.percentage !== undefined ||
        data.score !== undefined ||
        data.earnedMarks !== undefined;

      if (!isCompleted) continue;

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

    const usageList = Array.isArray(usageRes?.usage) ? usageRes.usage : [];
    for (const udata of usageList) {
      const practiceCount = Number(udata.practiceAttempts ?? 0);
      const arenaCount = Number(udata.arenaSessions ?? 0);
      const testCount = Number(udata.testsUsed ?? 0);
      const dateStr = String(udata.dateKey || udata.id || '');
      if ((practiceCount > 0 || arenaCount > 0 || testCount > 0) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dates.push(dateStr);
      }
    }
  } catch (err) {
    console.warn('[streakEngine] Error fetching completed sessions for user:', uid, err);
  }

  return dates;
}

/**
 * Recomputes streak for a user and saves to D1 (`/api/streaks/sync`), mirroring to users & public_profiles.
 */
export async function syncUserStreak(
  uid: string,
  options?: { freezeActive?: boolean }
): Promise<StreakComputationResult> {
  let freezeActive = options?.freezeActive ?? false;
  try {
    if (options?.freezeActive === undefined) {
      const userRes = await api.get<{ user: any }>(`/api/users/${encodeURIComponent(uid)}`).catch(() => null);
      if (userRes?.user) {
        freezeActive = Boolean(userRes.user.streakFreezeActive);
      }
    }
  } catch (err) {
    console.warn('[streakEngine] Could not read user doc:', err);
  }

  const sessionDates = await fetchUserCompletedSessionDates(uid);
  const result = computeStreakFromSessions(sessionDates, { freezeActive });

  try {
    await api.post('/api/streaks/sync', {
      uid,
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
    });
  } catch (err) {
    console.warn('[streakEngine] Failed to save streak to D1:', err);
  }

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
 * Superadmin batch recalculator: recalculates streaks for all registered users in D1.
 */
export async function recalculateAllUserStreaks(): Promise<{ processed: number; errors: number }> {
  try {
    const res = await api.post<{ processed: number; errors: number }>('/api/admin/streaks/recalculate', {});
    return {
      processed: Number(res.processed || 0),
      errors: Number(res.errors || 0),
    };
  } catch (err) {
    console.error('[recalculateAllUserStreaks] Batch query failed:', err);
    throw err;
  }
}
