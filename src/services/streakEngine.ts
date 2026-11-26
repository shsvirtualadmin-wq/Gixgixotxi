import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { invalidateSwrCache } from '@/lib/swrCache';
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

/**
 * Returns today's calendar date in PKT as 'YYYY-MM-DD'.
 */
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

/**
 * Shifts a PKT date string 'YYYY-MM-DD' by N days using deterministic UTC arithmetic.
 * Free from browser local timezone, DST or client clock interference.
 */
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

/**
 * Returns deterministic date parts for any PKT date 'YYYY-MM-DD'.
 * Uses UTC noon to eliminate all local timezone, DST, and client clock offsets.
 */
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
  const dayOfWeek = utcDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun

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
 * ─── LOCAL & MULTI-SOURCE STREAK ACTIVITY STORAGE ────────────────────────────
 */

export interface StreakDayActivity {
  practiceAttempts: number;
  mcqsSolved: number;
  aiTutorTokens?: number;
  arenaSessions?: number;
  hasActivity?: boolean;
}

export type StreakActivityMap = Record<string, StreakDayActivity>;

const LOCAL_STREAK_ACTIVITY_PREFIX = 'boardly_streak_activity_v1_';
const D1_ATTEMPTS_PREFIX = 'boardly_d1_cockpit_attempts_v2_';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

/**
 * Merges multiple PKT date -> activity maps taking the highest recorded activity per day
 * across sources so duplicate recording across local, API, and Firestore never inflates
 * single-day counts while every active day is preserved.
 */
export function mergeStreakActivityMaps(
  ...maps: Array<StreakActivityMap | null | undefined>
): StreakActivityMap {
  const merged: StreakActivityMap = {};
  for (const map of maps) {
    if (!map || typeof map !== 'object') continue;
    for (const [dateStr, raw] of Object.entries(map)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !raw || typeof raw !== 'object') continue;
      const practiceAttempts = Math.max(0, Number(raw.practiceAttempts ?? 0) || 0);
      const mcqsSolved = Math.max(0, Number(raw.mcqsSolved ?? 0) || 0);
      const aiTutorTokens = Math.max(0, Number(raw.aiTutorTokens ?? 0) || 0);
      const arenaSessions = Math.max(0, Number(raw.arenaSessions ?? 0) || 0);
      const hasActivity = Boolean(
        practiceAttempts > 0 || mcqsSolved > 0 || arenaSessions > 0 || raw.hasActivity
      );
      if (!hasActivity) continue;

      const prev = merged[dateStr];
      merged[dateStr] = {
        practiceAttempts: Math.max(prev?.practiceAttempts ?? 0, practiceAttempts || 1),
        mcqsSolved: Math.max(prev?.mcqsSolved ?? 0, mcqsSolved),
        aiTutorTokens: Math.max(prev?.aiTutorTokens ?? 0, aiTutorTokens),
        arenaSessions: Math.max(prev?.arenaSessions ?? 0, arenaSessions),
        hasActivity: true,
      };
    }
  }
  return merged;
}

/**
 * Synchronously reads locally recorded practice completions (both explicit streak log
 * and D1 cockpit university attempts) for instant 0ms UI hydration.
 */
export function getLocalStreakActivityMap(uid?: string | null): StreakActivityMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const effectiveUid = uid || 'guest';

  const explicitMap: StreakActivityMap = {};
  try {
    const raw = window.localStorage.getItem(`${LOCAL_STREAK_ACTIVITY_PREFIX}${effectiveUid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [dateStr, val] of Object.entries(parsed as Record<string, Record<string, unknown>>)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !val || typeof val !== 'object') continue;
          const practiceAttempts = Math.max(0, Number(val.practiceAttempts ?? 0) || 0);
          const mcqsSolved = Math.max(0, Number(val.mcqsSolved ?? 0) || 0);
          if (practiceAttempts > 0 || mcqsSolved > 0) {
            explicitMap[dateStr] = {
              practiceAttempts: Math.max(1, practiceAttempts),
              mcqsSolved,
              hasActivity: true,
            };
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }

  const d1AttemptsMap: StreakActivityMap = {};
  try {
    const rawAttempts = window.localStorage.getItem(`${D1_ATTEMPTS_PREFIX}${effectiveUid}`);
    if (rawAttempts) {
      const parsed = JSON.parse(rawAttempts);
      if (Array.isArray(parsed)) {
        for (const att of parsed) {
          if (!att || typeof att !== 'object') continue;
          const pktDate = toPKTDateString(att.createdAt || att.submittedAt);
          if (!pktDate) continue;
          const solved = Math.max(
            0,
            Number(att.answeredCount ?? att.totalQuestions ?? 0) || 0
          );
          const prev = d1AttemptsMap[pktDate];
          d1AttemptsMap[pktDate] = {
            practiceAttempts: (prev?.practiceAttempts ?? 0) + 1,
            mcqsSolved: (prev?.mcqsSolved ?? 0) + (solved || 10),
            hasActivity: true,
          };
        }
      }
    }
  } catch {
    // Non-fatal
  }

  return mergeStreakActivityMaps(explicitMap, d1AttemptsMap);
}

/**
 * Records a newly completed/submitted practice test toward the user's streak immediately
 * (synchronously updating local storage, invalidating cached streak data, notifying listeners,
 * and persisting to the server + Firestore in the background).
 */
export function recordCompletedPracticeForStreak(
  uid: string | undefined | null,
  opts?: {
    mcqsSolved?: number;
    completedAt?: string | number | Date;
    source?: 'd1' | 'practice' | 'grandline';
    skipApiRecord?: boolean;
    skipFirestoreActivity?: boolean;
  }
): StreakComputationResult | null {
  const effectiveUid = uid || 'guest';
  const pktDate = toPKTDateString(opts?.completedAt || new Date()) || getCurrentPKTDate();
  const solved = Math.max(0, Math.floor(Number(opts?.mcqsSolved ?? 0) || 0));

  // 1. Synchronously persist to local streak activity log
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const key = `${LOCAL_STREAK_ACTIVITY_PREFIX}${effectiveUid}`;
      const existingRaw = window.localStorage.getItem(key);
      const parsed = existingRaw ? (JSON.parse(existingRaw) as StreakActivityMap) : {};
      const safeMap: StreakActivityMap = parsed && typeof parsed === 'object' ? parsed : {};
      const prev = safeMap[pktDate];
      safeMap[pktDate] = {
        practiceAttempts: (Number(prev?.practiceAttempts) || 0) + 1,
        mcqsSolved: (Number(prev?.mcqsSolved) || 0) + (solved || 10),
        hasActivity: true,
      };
      window.localStorage.setItem(key, JSON.stringify(safeMap));
    } catch {
      // Non-fatal
    }
  }

  // 2. Invalidate stale SWR cache for this user's streak page
  if (uid) {
    invalidateSwrCache(`streaks:user:${uid}`);
  }

  // 3. Recompute local streak synchronously and broadcast update event
  const localActivityMap = getLocalStreakActivityMap(effectiveUid);
  const computed = computeStreakData(localActivityMap);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('boardly-streak-updated', {
        detail: {
          uid: effectiveUid,
          pktDate,
          currentStreak: computed.currentStreak,
          longestStreak: computed.longestStreak,
          source: opts?.source || 'practice',
        },
      })
    );
  }

  // 4. Non-blocking background persistence to server D1 & Firestore
  if (typeof window !== 'undefined' && uid) {
    if (!opts?.skipApiRecord) {
      void (async () => {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (auth.currentUser && auth.currentUser.uid === uid) {
            const token = await auth.currentUser.getIdToken().catch(() => null);
            if (token) headers.Authorization = `Bearer ${token}`;
          } else {
            const guestToken =
              window.localStorage?.getItem('boardly_guest_session_token') ||
              window.localStorage?.getItem('boardly_guest_session_backup_v1') ||
              '';
            if (guestToken) headers['X-Guest-Session'] = guestToken;
          }
          await fetch('/api/usage/daily/record', {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({
              uid,
              dateKey: pktDate,
              practiceAttemptsDelta: 1,
              completedTestsDelta: 1,
              questionsSolvedDelta: solved,
            }),
          });
        } catch {
          // Non-fatal background sync
        }
      })();
    }

    const isFirebaseUser = Boolean(
      auth.currentUser && auth.currentUser.uid === uid && !uid.startsWith('guest_')
    );
    if (isFirebaseUser) {
      if (!opts?.skipFirestoreActivity) {
        void setDoc(
          doc(db, 'users', uid, 'activity', pktDate),
          {
            practiceAttempts: increment(1),
            questionsSolved: increment(solved),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      void setDoc(
        doc(db, 'users', uid),
        {
          streak: computed.currentStreak,
          longestStreak: computed.longestStreak,
          lastActiveDate: pktDate,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      void setDoc(
        doc(db, 'streaks', uid),
        {
          currentStreak: computed.currentStreak,
          longestStreak: computed.longestStreak,
          todayActive: computed.todayActive,
          todayPending: computed.todayPending,
          lastActivePKT: pktDate,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }
  }

  return computed;
}

/**
 * ─── FIRESTORE & SERVER PARALLEL QUERY & SYNC ────────────────────────────────
 */

async function fetchServerStreakHistoryMap(uid: string): Promise<StreakActivityMap> {
  if (typeof window === 'undefined' || !uid) return {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2200);
  try {
    const headers: Record<string, string> = {};
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const token = await withTimeout(auth.currentUser.getIdToken(), 1200, null);
      if (token) headers.Authorization = `Bearer ${token}`;
    } else {
      const guestToken =
        window.localStorage?.getItem('boardly_guest_session_token') ||
        window.localStorage?.getItem('boardly_guest_session_backup_v1') ||
        '';
      if (guestToken) headers['X-Guest-Session'] = guestToken;
    }

    const res = await fetch(`/api/usage/streak-history?uid=${encodeURIComponent(uid)}`, {
      credentials: 'include',
      headers,
      signal: controller.signal,
    });
    if (!res.ok) return {};
    const data = await res.json().catch(() => null);
    if (!data || typeof data.days !== 'object' || !data.days) return {};
    return mergeStreakActivityMaps(data.days as StreakActivityMap);
  } catch {
    return {};
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches completed practice activity by PKT date across ALL sources in parallel with strict
 * timeouts so the Streaks page stays fast and always reflects every completed test.
 */
export async function fetchUserStreakActivityMap(uid: string): Promise<StreakActivityMap> {
  const localMap = getLocalStreakActivityMap(uid);
  if (!uid) return localMap;

  const isGuestUid = uid.startsWith('guest_') || uid === 'guest';
  const canReadFirestore = !isGuestUid && Boolean(auth.currentUser);

  const serverPromise = fetchServerStreakHistoryMap(uid);

  if (!canReadFirestore) {
    const serverMap = await serverPromise;
    return mergeStreakActivityMaps(localMap, serverMap);
  }

  const attemptsRef = collection(db, 'attempts');
  const [serverMap, snapByUserId, snapByUid, activitySnap, usageSnap] = await Promise.all([
    serverPromise,
    withTimeout(getDocs(query(attemptsRef, where('userId', '==', uid))), 2200, null),
    withTimeout(getDocs(query(attemptsRef, where('uid', '==', uid))), 2200, null),
    withTimeout(getDocs(collection(db, 'users', uid, 'activity')), 2200, null),
    withTimeout(getDocs(collection(db, 'users', uid, 'usage')), 2200, null),
  ]);

  // 1. Deduplicated Firestore completed attempts
  const attemptsMap: StreakActivityMap = {};
  const seenAttemptIds = new Set<string>();
  const allAttemptDocs: QueryDocumentSnapshot<DocumentData>[] = [
    ...(snapByUserId?.docs ?? []),
    ...(snapByUid?.docs ?? []),
  ];

  for (const d of allAttemptDocs) {
    if (seenAttemptIds.has(d.id)) continue;
    seenAttemptIds.add(d.id);
    const data = d.data();
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
    if (!pktDate) continue;

    const answered =
      Number(data.correctAnswers ?? 0) + Number(data.wrongAnswers ?? 0);
    const solved =
      answered > 0
        ? answered
        : Number(data.answeredCount ?? data.totalQuestions ?? 10) || 10;
    const prev = attemptsMap[pktDate];
    attemptsMap[pktDate] = {
      practiceAttempts: (prev?.practiceAttempts ?? 0) + 1,
      mcqsSolved: (prev?.mcqsSolved ?? 0) + solved,
      hasActivity: true,
    };
  }

  // 2. Firestore users/{uid}/activity/{YYYY-MM-DD}
  const activityMap: StreakActivityMap = {};
  for (const d of activitySnap?.docs ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.id)) continue;
    const adata = d.data();
    const practiceCount = Number(adata.practiceAttempts ?? 0);
    const solvedCount = Number(adata.questionsSolved ?? 0);
    const arenaCount = Number(adata.arenaSessions ?? 0);
    if (practiceCount > 0 || solvedCount > 0 || arenaCount > 0) {
      activityMap[d.id] = {
        practiceAttempts: Math.max(1, practiceCount),
        mcqsSolved: solvedCount,
        arenaSessions: arenaCount,
        hasActivity: true,
      };
    }
  }

  // 3. Firestore users/{uid}/usage/{YYYY-MM-DD}
  const usageMap: StreakActivityMap = {};
  for (const d of usageSnap?.docs ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.id)) continue;
    const udata = d.data();
    const practiceCount = Number(udata.practiceAttempts ?? 0);
    const arenaCount = Number(udata.arenaSessions ?? 0);
    const testCount = Number(udata.testsUsed ?? 0);
    const solvedCount = Number(udata.questionsSolved ?? 0);
    if (practiceCount > 0 || arenaCount > 0 || testCount > 0 || solvedCount > 0) {
      usageMap[d.id] = {
        practiceAttempts: Math.max(1, practiceCount || testCount),
        mcqsSolved: solvedCount,
        arenaSessions: arenaCount,
        hasActivity: true,
      };
    }
  }

  return mergeStreakActivityMaps(localMap, serverMap, attemptsMap, activityMap, usageMap);
}

/**
 * Extracts completed session dates from all activity sources for a user.
 */
export async function fetchUserCompletedSessionDates(uid: string): Promise<string[]> {
  const activityMap = await fetchUserStreakActivityMap(uid);
  const dates: string[] = [];
  for (const [dateStr, val] of Object.entries(activityMap)) {
    const count = Math.max(1, Math.floor(Number(val.practiceAttempts || 1)));
    for (let i = 0; i < count; i++) {
      dates.push(dateStr);
    }
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
  // 1. Fetch user doc for freeze setting and activity map in parallel
  const [userSnap, activityMap] = await Promise.all([
    options?.freezeActive === undefined
      ? withTimeout(getDoc(doc(db, 'users', uid)), 2200, null)
      : Promise.resolve(null),
    fetchUserStreakActivityMap(uid),
  ]);

  let freezeActive = options?.freezeActive ?? false;
  if (options?.freezeActive === undefined && userSnap?.exists()) {
    const udata = userSnap.data();
    freezeActive = Boolean(udata.streakFreezeActive);
  }

  // 2. Run shared calculation
  const result = computeStreakData(activityMap, { freezeActive });

  // 3. Save to streaks/{uid}
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

  // 4. Mirror to users/{uid}
  try {
    await updateDoc(doc(db, 'users', uid), {
      streak: result.currentStreak,
      longestStreak: result.longestStreak,
      lastActiveDate: result.activePKTDays[result.activePKTDays.length - 1] || null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[streakEngine] Failed to mirror streak to users/{uid}:', err);
  }

  // 5. Mirror to publicProfiles/{uid} for leaderboards and squad views
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
