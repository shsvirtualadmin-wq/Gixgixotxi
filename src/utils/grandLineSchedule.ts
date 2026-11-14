export type GrandLineStatusMode = 'auto' | 'forceLive' | 'forceEnded' | 'draft';

export type GrandLineEffectiveStatus = 'live' | 'scheduled' | 'ended' | 'draft';

export interface GrandLineScheduleTestLike {
  status?: 'draft' | 'published' | 'unpublished' | 'finalised' | 'ended' | string | null;
  visibility?: 'public' | 'private' | string | null;
  startAt?: number | string | null;
  endAt?: number | string | null;
  statusMode?: GrandLineStatusMode | string | null;
  reason?: string | null;
  forceCloseAttemptsAt?: number | string | null;
  resultsFinalised?: boolean | number | null;
  results_finalised?: boolean | number | null;
  finalisedAt?: number | string | null;
  finalised_at?: number | string | null;
}

/**
 * Pakistan Standard Time (PKT) is strictly UTC+5 year-round (no DST).
 */
export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
export const PKT_TIMEZONE = 'Asia/Karachi';

/**
 * Tracks the difference between server clock and client clock (`serverTimeMs - Date.now()`)
 * so a student or admin device with an inaccurate local clock still computes the exact
 * server-authoritative status and countdowns.
 */
let serverTimeOffsetMs = 0;

export function recordServerTimeOffset(serverTimeMs?: number | null): void {
  const parsed = Number(serverTimeMs);
  if (Number.isFinite(parsed) && parsed > 1_600_000_000_000) {
    serverTimeOffsetMs = parsed - Date.now();
  }
}

export function getServerNowMs(): number {
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Normalizes an optional timestamp (ms number, numeric string, or ISO string) to UTC epoch ms, or null.
 */
export function normalizeOptionalTimestampMs(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum) && asNum > 0) return Math.round(asNum);
    const asDate = Date.parse(trimmed);
    if (Number.isFinite(asDate) && asDate > 0) return Math.round(asDate);
  }
  if (typeof raw === 'object' && raw !== null) {
    const anyRaw = raw as { toMillis?: () => number; seconds?: number };
    if (typeof anyRaw.toMillis === 'function') {
      const ms = anyRaw.toMillis();
      return Number.isFinite(ms) && ms > 0 ? Math.round(ms) : null;
    }
    if (typeof anyRaw.seconds === 'number') {
      return Math.round(anyRaw.seconds * 1000);
    }
  }
  return null;
}

/**
 * Normalizes `statusMode` to one of the valid modes, or undefined if not set.
 */
export function normalizeStatusMode(raw: unknown): GrandLineStatusMode | undefined {
  if (raw === 'auto' || raw === 'forceLive' || raw === 'forceEnded' || raw === 'draft') {
    return raw;
  }
  return undefined;
}

/**
 * SINGLE SHARED STATUS COMPUTATION FUNCTION (used in student screens, admin screens, and server checks):
 * - statusMode "draft" → 'draft' (hidden from students)
 * - statusMode "forceLive" → 'live' (ignores the schedule)
 * - statusMode "forceEnded" → 'ended' (ignores the schedule)
 * - resultsFinalised === true (and mode !== "forceLive") → 'ended'
 * - "auto" or missing →
 *   - If no startAt and no endAt: use the test's existing status
 *     (published & public → 'live'; finalised/ended → 'ended'; unpublished / draft / private → 'draft').
 *   - If startAt is in the future → 'scheduled' ("Starts in ...").
 *   - If endAt has passed → 'ended'.
 *   - If now is between startAt and endAt (or startAt passed and no endAt, or no startAt and before endAt) → 'live'.
 */
export function computeGrandLineTestStatus(
  test: GrandLineScheduleTestLike | null | undefined,
  nowMs: number = getServerNowMs()
): GrandLineEffectiveStatus {
  if (!test) return 'draft';

  const mode = normalizeStatusMode(test.statusMode);

  if (mode === 'draft') return 'draft';
  if (mode === 'forceLive') return 'live';
  if (mode === 'forceEnded') return 'ended';

  const existingStatus = String(test.status || 'published').toLowerCase();
  const existingVisibility = String(test.visibility || 'public').toLowerCase();
  const isResultsFinalised =
    Boolean(test.resultsFinalised) ||
    Boolean(test.results_finalised) ||
    existingStatus === 'finalised' ||
    existingStatus === 'ended';

  const isLegacyDraftOrPrivate =
    existingStatus === 'draft' ||
    existingStatus === 'unpublished' ||
    existingVisibility === 'private';

  if (isLegacyDraftOrPrivate) {
    return 'draft';
  }

  if (isResultsFinalised) {
    return 'ended';
  }

  const startAtMs = normalizeOptionalTimestampMs(test.startAt);
  const endAtMs = normalizeOptionalTimestampMs(test.endAt);

  if (!startAtMs && !endAtMs) {
    return 'live';
  }

  if (startAtMs && nowMs < startAtMs) {
    return 'scheduled';
  }

  if (endAtMs && nowMs >= endAtMs) {
    return 'ended';
  }

  return 'live';
}

/**
 * Formats a UTC millisecond timestamp into Pakistan Standard Time (PKT, UTC+5),
 * e.g. "Nov 20, 9:00 PM PKT" or with year if different from current year.
 */
export function formatPktDateTime(
  timestampMs: number | string | null | undefined,
  options?: { includeSuffix?: boolean; includeYear?: boolean }
): string {
  const ms = normalizeOptionalTimestampMs(timestampMs);
  if (!ms) return '';

  const includeSuffix = options?.includeSuffix ?? true;
  const pktNowYear = new Date(getServerNowMs() + PKT_OFFSET_MS).getUTCFullYear();
  const pktTargetYear = new Date(ms + PKT_OFFSET_MS).getUTCFullYear();
  const showYear = options?.includeYear ?? pktNowYear !== pktTargetYear;

  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: PKT_TIMEZONE,
      month: 'short',
      day: 'numeric',
      ...(showYear ? { year: 'numeric' } : {}),
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(ms));

    return includeSuffix ? `${formatted} PKT` : formatted;
  } catch {
    // Fallback manual UTC+5 calculation if Intl timeZone is unavailable
    const d = new Date(ms + PKT_OFFSET_MS);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const yr = d.getUTCFullYear();
    let hr = d.getUTCHours();
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    const base = `${mon} ${day}${showYear ? `, ${yr}` : ''}, ${hr}:${min} ${ampm}`;
    return includeSuffix ? `${base} PKT` : base;
  }
}

/**
 * Formats a start/end window in PKT:
 * - Both set: "Nov 20, 9:00 PM – Nov 22, 11:59 PM PKT"
 * - Only startAt: "Starts Nov 20, 9:00 PM PKT"
 * - Only endAt: "Until Nov 22, 11:59 PM PKT"
 * - Neither set: ""
 */
export function formatPktWindow(
  startAt: number | string | null | undefined,
  endAt: number | string | null | undefined
): string {
  const startMs = normalizeOptionalTimestampMs(startAt);
  const endMs = normalizeOptionalTimestampMs(endAt);

  if (startMs && endMs) {
    const startStr = formatPktDateTime(startMs, { includeSuffix: false });
    const endStr = formatPktDateTime(endMs, { includeSuffix: false });
    return `${startStr} – ${endStr} PKT`;
  }
  if (startMs) {
    return `From ${formatPktDateTime(startMs, { includeSuffix: true })}`;
  }
  if (endMs) {
    return `Until ${formatPktDateTime(endMs, { includeSuffix: true })}`;
  }
  return '';
}

/**
 * Formats a compact live countdown string from `nowMs` to `targetMs`:
 * - >= 1 day: "1d 4h 12m"
 * - >= 1 hour: "4h 12m 8s"
 * - < 1 hour: "14m 22s"
 * - < 1 minute: "45s"
 */
export function formatLiveCountdown(
  targetMs: number | string | null | undefined,
  nowMs: number = getServerNowMs(),
  compact = false
): string {
  const target = normalizeOptionalTimestampMs(targetMs);
  if (!target) return '';

  const diffMs = Math.max(0, target - nowMs);
  if (diffMs <= 0) return '0s';

  const totalSeconds = Math.ceil(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return compact ? `${days}d ${hours}h` : `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return compact ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Returns the active countdown label for a test if applicable:
 * - If status is 'scheduled' and startAt is in the future: "Starts in 2h 15m"
 * - If status is 'live', statusMode !== 'forceLive', and endAt is in the future: "Ends in 1d 4h"
 * - Otherwise: null
 */
export function getGrandLineCountdownLabel(
  test: GrandLineScheduleTestLike | null | undefined,
  nowMs: number = getServerNowMs(),
  compact = false
): string | null {
  if (!test) return null;
  const status = computeGrandLineTestStatus(test, nowMs);
  const mode = normalizeStatusMode(test.statusMode) || 'auto';
  const startMs = normalizeOptionalTimestampMs(test.startAt);
  const endMs = normalizeOptionalTimestampMs(test.endAt);

  if (status === 'scheduled' && startMs && startMs > nowMs) {
    return `Starts in ${formatLiveCountdown(startMs, nowMs, compact)}`;
  }

  if (status === 'live' && mode !== 'forceLive' && endMs && endMs > nowMs) {
    return `Ends in ${formatLiveCountdown(endMs, nowMs, compact)}`;
  }

  return null;
}

/**
 * Converts a UTC millisecond timestamp to an `<input type="datetime-local" />` string (`YYYY-MM-DDTHH:mm`)
 * strictly in Pakistan Standard Time (PKT, UTC+5), regardless of the user's browser timezone.
 */
export function msToPktDatetimeLocal(timestampMs: number | string | null | undefined): string {
  const ms = normalizeOptionalTimestampMs(timestampMs);
  if (!ms) return '';

  const pktDate = new Date(ms + PKT_OFFSET_MS);
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  const hours = String(pktDate.getUTCHours()).padStart(2, '0');
  const minutes = String(pktDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parses an `<input type="datetime-local" />` string (`YYYY-MM-DDTHH:mm`) interpreted
 * strictly as Pakistan Standard Time (PKT, UTC+5) into a UTC millisecond timestamp.
 */
export function pktDatetimeLocalToMs(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  const utcAssumingPkt = Date.UTC(year, month, day, hour, minute, second, 0);
  if (!Number.isFinite(utcAssumingPkt)) return null;

  return utcAssumingPkt - PKT_OFFSET_MS;
}

/**
 * Human-readable label for a GrandLineEffectiveStatus.
 */
export function getEffectiveStatusLabel(status: GrandLineEffectiveStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'scheduled':
      return 'Scheduled';
    case 'ended':
      return 'Ended';
    case 'draft':
      return 'Draft';
  }
}
