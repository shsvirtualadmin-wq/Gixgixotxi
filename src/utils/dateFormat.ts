import { useEffect, useState } from 'react';

export const PKT_TIMEZONE = 'Asia/Karachi';

const pktYearFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PKT_TIMEZONE,
  year: 'numeric',
});

const pktDayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PKT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const pktShortDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PKT_TIMEZONE,
  month: 'short',
  day: 'numeric',
});

const pktFullDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PKT_TIMEZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const pktFullDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PKT_TIMEZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

let serverClockOffsetMs = 0;

/**
 * Records a known server timestamp (e.g. from `/api/posts` or HTTP `Date` header)
 * so relative time calculations remain accurate even if the device clock is skewed.
 */
export function recordServerTime(serverTimeInput: unknown): void {
  const parsed = parseTimestampMs(serverTimeInput);
  if (parsed.ms === null) return;
  const offset = parsed.ms - Date.now();
  // Ignore extreme/corrupted offsets (> 5 years)
  if (Math.abs(offset) < 5 * 365 * 86_400_000) {
    serverClockOffsetMs = offset;
  }
}

/**
 * Extracts and records server time from a Fetch Response `Date` header if present.
 */
export function recordServerDateHeader(resp: Response | null | undefined): void {
  if (!resp?.headers) return;
  const dateHeader = resp.headers.get('date');
  if (dateHeader) {
    recordServerTime(dateHeader);
  }
}

/**
 * Returns the current epoch timestamp in ms adjusted by any recorded server offset.
 */
export function getNowMs(): number {
  return Date.now() + serverClockOffsetMs;
}

function normalizeEpochNumber(num: number): number | null {
  if (!Number.isFinite(num) || num <= 0) return null;
  // Values under 10^10 are Unix epoch seconds; convert to milliseconds
  const ms = num < 10_000_000_000 ? Math.floor(num * 1000) : Math.floor(num);
  return ms > 0 ? ms : null;
}

export interface ParsedTimestamp {
  ms: number | null;
  isPending: boolean;
}

/**
 * Consistently parses Firestore Timestamp instances (`.toMillis()`, `.toDate()`),
 * serialized Timestamp objects (`{ seconds, nanoseconds }`, `{ _seconds, _nanoseconds }`),
 * numeric epoch seconds or milliseconds, numeric strings, and ISO-8601 date strings.
 *
 * Never falls back to `Date.now()` for null/missing/invalid inputs so pending timestamps
 * cleanly report `{ ms: null, isPending: true }` ("Just now") instead of a wrong date.
 */
export function parseTimestampMs(input: unknown): ParsedTimestamp {
  if (input === null || input === undefined || input === '') {
    return { ms: null, isPending: true };
  }

  if (typeof input === 'number') {
    const ms = normalizeEpochNumber(input);
    return ms !== null ? { ms, isPending: false } : { ms: null, isPending: true };
  }

  if (input instanceof Date) {
    const ms = input.getTime();
    return Number.isFinite(ms) && ms > 0
      ? { ms, isPending: false }
      : { ms: null, isPending: true };
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '[object Object]') {
      return { ms: null, isPending: true };
    }
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const ms = normalizeEpochNumber(Number(trimmed));
      return ms !== null ? { ms, isPending: false } : { ms: null, isPending: true };
    }
    const parsedMs = Date.parse(trimmed);
    return Number.isFinite(parsedMs) && parsedMs > 0
      ? { ms: parsedMs, isPending: false }
      : { ms: null, isPending: true };
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, any>;

    // Pending Firestore serverTimestamp() sentinel (`{ _methodName: 'serverTimestamp' }`)
    if (
      typeof obj._methodName === 'string' &&
      obj._methodName.toLowerCase().includes('timestamp')
    ) {
      return { ms: null, isPending: true };
    }

    if (typeof obj.toMillis === 'function') {
      try {
        const ms = normalizeEpochNumber(Number(obj.toMillis()));
        if (ms !== null) return { ms, isPending: false };
      } catch {
        // continue
      }
    }

    if (typeof obj.toDate === 'function') {
      try {
        const d = obj.toDate();
        if (d instanceof Date && Number.isFinite(d.getTime()) && d.getTime() > 0) {
          return { ms: d.getTime(), isPending: false };
        }
      } catch {
        // continue
      }
    }

    if (typeof obj.seconds === 'number' && Number.isFinite(obj.seconds)) {
      const nanos = typeof obj.nanoseconds === 'number' && Number.isFinite(obj.nanoseconds) ? obj.nanoseconds : 0;
      const ms = Math.floor(obj.seconds * 1000 + nanos / 1_000_000);
      return ms > 0 ? { ms, isPending: false } : { ms: null, isPending: true };
    }

    if (typeof obj._seconds === 'number' && Number.isFinite(obj._seconds)) {
      const nanos = typeof obj._nanoseconds === 'number' && Number.isFinite(obj._nanoseconds) ? obj._nanoseconds : 0;
      const ms = Math.floor(obj._seconds * 1000 + nanos / 1_000_000);
      return ms > 0 ? { ms, isPending: false } : { ms: null, isPending: true };
    }

    // If an entity object with createdAtMs / created_at / createdAt was passed directly:
    // Read ONLY creation timestamp fields — never updatedAt, lastActivityAt, or editedAt.
    if ('createdAtMs' in obj || 'created_at' in obj || 'createdAt' in obj) {
      const candidate =
        obj.createdAtMs !== undefined && obj.createdAtMs !== null
          ? obj.createdAtMs
          : obj.created_at !== undefined && obj.created_at !== null
          ? obj.created_at
          : obj.createdAt;
      if (candidate !== input) {
        return parseTimestampMs(candidate);
      }
    }
  }

  return { ms: null, isPending: true };
}

/**
 * Extracts and parses ONLY the creation timestamp (`createdAtMs`, `created_at`, `createdAt`)
 * from a post, comment, or notification object (or a direct timestamp value).
 * Never reads `updatedAt`, `lastActivityAt`, `editedAt`, or bumped/sort fields.
 */
export function resolveCreatedAtMs(entityOrTimestamp: unknown): ParsedTimestamp {
  if (
    entityOrTimestamp &&
    typeof entityOrTimestamp === 'object' &&
    !(entityOrTimestamp instanceof Date) &&
    !('seconds' in (entityOrTimestamp as Record<string, any>)) &&
    !('_seconds' in (entityOrTimestamp as Record<string, any>)) &&
    typeof (entityOrTimestamp as any).toDate !== 'function' &&
    typeof (entityOrTimestamp as any).toMillis !== 'function'
  ) {
    const rec = entityOrTimestamp as Record<string, any>;
    if (rec.createdAtMs !== undefined && rec.createdAtMs !== null) {
      const p = parseTimestampMs(rec.createdAtMs);
      if (p.ms !== null) return p;
    }
    if (rec.created_at !== undefined && rec.created_at !== null) {
      const p = parseTimestampMs(rec.created_at);
      if (p.ms !== null) return p;
    }
    if (rec.createdAt !== undefined && rec.createdAt !== null) {
      return parseTimestampMs(rec.createdAt);
    }
    return { ms: null, isPending: true };
  }
  return parseTimestampMs(entityOrTimestamp);
}

/**
 * Formats an absolute date in Pakistan Standard Time (`Asia/Karachi`, UTC+5),
 * e.g. "Nov 17, 2026" or "Nov 17". Returns "Just now" if the timestamp is pending/missing.
 */
export function formatAbsoluteDatePkt(
  input: unknown,
  options?: { includeYear?: 'always' | 'auto' | 'never' },
  nowMs: number = getNowMs()
): string {
  const { ms } = resolveCreatedAtMs(input);
  if (ms === null) return 'Just now';

  const includeYear = options?.includeYear ?? 'always';
  const dateObj = new Date(ms);

  if (includeYear === 'never') {
    return pktShortDateFormatter.format(dateObj);
  }
  if (includeYear === 'auto') {
    const targetYear = pktYearFormatter.format(dateObj);
    const currentYear = pktYearFormatter.format(new Date(nowMs));
    return targetYear === currentYear
      ? pktShortDateFormatter.format(dateObj)
      : pktFullDateFormatter.format(dateObj);
  }
  return pktFullDateFormatter.format(dateObj);
}

/**
 * Formats an absolute date and time in Pakistan Standard Time (`Asia/Karachi`, UTC+5),
 * e.g. "Nov 17, 2026, 11:42 AM". Returns "Just now" if the timestamp is pending/missing.
 */
export function formatAbsoluteDateTimePkt(input: unknown): string {
  const { ms } = resolveCreatedAtMs(input);
  if (ms === null) return 'Just now';
  return pktFullDateTimeFormatter.format(new Date(ms));
}

/**
 * Shared relative time formatter used across feed cards, post pages, comments,
 * notifications, search results, and related posts.
 *
 * Uses `Math.floor` and consistent thresholds:
 * - Pending / null / < 1 min: "Just now"
 * - 1 to 59 mins: "Xm ago"
 * - 1 to 23 hours: "Xh ago"
 * - 1 to 6 days: "Xd ago"
 * - >= 7 days: Absolute date in PKT ("Nov 17" in current year, "Nov 17, 2025" otherwise)
 */
export function formatRelativeTimePkt(input: unknown, nowMs: number = getNowMs()): string {
  const { ms } = resolveCreatedAtMs(input);
  if (ms === null) return 'Just now';

  const diffMs = nowMs - ms;
  // If timestamp is in the future due to minor clock drift or under 60 seconds old
  if (diffMs < 60_000) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatAbsoluteDatePkt(ms, { includeYear: 'auto' }, nowMs);
}

export interface PostDetailTimestampFormatted {
  fullLabel: string;
  absoluteDateLabel: string;
  absoluteDateTimeLabel: string;
  relativeLabel: string;
  isoString: string;
  isPending: boolean;
}

/**
 * Formats a post's creation timestamp for the post detail page so it displays BOTH
 * the exact date/time in Pakistan Standard Time (`Asia/Karachi`) and the relative time
 * (e.g. "Nov 17, 2026, 11:42 AM · 21h ago"), guaranteeing 100% agreement with the feed card.
 */
export function formatPostDetailTimestampPkt(
  input: unknown,
  nowMs: number = getNowMs()
): PostDetailTimestampFormatted {
  const { ms } = resolveCreatedAtMs(input);
  if (ms === null) {
    return {
      fullLabel: 'Just now',
      absoluteDateLabel: 'Just now',
      absoluteDateTimeLabel: 'Just now',
      relativeLabel: 'Just now',
      isoString: '',
      isPending: true,
    };
  }

  const dateObj = new Date(ms);
  const absoluteDateLabel = pktFullDateFormatter.format(dateObj);
  const absoluteDateTimeLabel = pktFullDateTimeFormatter.format(dateObj);
  const relativeLabel = formatRelativeTimePkt(ms, nowMs);
  const isoString = dateObj.toISOString();

  // If >= 7 days old, relativeLabel is already the PKT date, so avoid repeating the date twice
  const diffDays = Math.floor((nowMs - ms) / 86_400_000);
  const fullLabel =
    diffDays >= 7
      ? absoluteDateTimeLabel
      : `${absoluteDateTimeLabel} · ${relativeLabel}`;

  return {
    fullLabel,
    absoluteDateLabel,
    absoluteDateTimeLabel,
    relativeLabel,
    isoString,
    isPending: false,
  };
}

/**
 * Computes day grouping ('Today' | 'Yesterday' | 'Earlier') in Pakistan Standard Time (`Asia/Karachi`).
 */
export function getPktDateGroupLabel(
  input: unknown,
  nowMs: number = getNowMs()
): 'Today' | 'Yesterday' | 'Earlier' {
  const { ms } = resolveCreatedAtMs(input);
  if (ms === null) return 'Today';

  const targetKey = pktDayKeyFormatter.format(new Date(ms));
  const todayKey = pktDayKeyFormatter.format(new Date(nowMs));
  if (targetKey === todayKey) return 'Today';

  const yesterdayKey = pktDayKeyFormatter.format(new Date(nowMs - 86_400_000));
  if (targetKey === yesterdayKey) return 'Yesterday';

  return 'Earlier';
}

// Shared reactive tick so all mounted components compute relative times against the same `nowMs`
let sharedTickNowMs = getNowMs();
const tickSubscribers = new Set<(now: number) => void>();
let tickIntervalId: ReturnType<typeof setInterval> | null = null;

function ensureTickRunning(): void {
  if (tickIntervalId !== null || typeof window === 'undefined') return;
  tickIntervalId = setInterval(() => {
    sharedTickNowMs = getNowMs();
    for (const sub of tickSubscribers) {
      sub(sharedTickNowMs);
    }
  }, 30_000);
}

function stopTickIfIdle(): void {
  if (tickSubscribers.size === 0 && tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

/**
 * React hook that returns a synchronized `nowMs` timestamp and updates every 30 seconds
 * so relative timestamps ("Just now", "21h ago") stay live and identical across views.
 */
export function useSharedNow(): number {
  const [now, setNow] = useState<number>(() => getNowMs());

  useEffect(() => {
    setNow(getNowMs());
    const listener = (nextNow: number) => setNow(nextNow);
    tickSubscribers.add(listener);
    ensureTickRunning();
    return () => {
      tickSubscribers.delete(listener);
      stopTickIfIdle();
    };
  }, []);

  return now;
}
