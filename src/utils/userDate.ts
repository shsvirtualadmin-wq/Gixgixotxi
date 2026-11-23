/**
 * Pure read-only timestamp parsing & formatting utilities for Admin Users and Wingmates Radar.
 *
 * STRICT RULE: Never generate, guess, randomize, or default missing timestamps to Date.now().
 * If a timestamp is missing or unparseable, return null so the UI displays "Unknown" (or omits it).
 */

const PKT_TIME_ZONE = 'Asia/Karachi';

export function parseRealTimestampMs(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    // Normalize epoch seconds (< 1e12) vs milliseconds (>= 1e12)
    return raw < 1_000_000_000_000 ? Math.round(raw * 1000) : Math.round(raw);
  }

  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return null;
      return n < 1_000_000_000_000 ? Math.round(n * 1000) : Math.round(n);
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (typeof raw === 'object') {
    const obj = raw as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    };
    if (typeof obj.toMillis === 'function') {
      try {
        const ms = obj.toMillis();
        return Number.isFinite(ms) && ms > 0 ? Math.round(ms) : null;
      } catch {
        // fall through
      }
    }
    if (typeof obj.toDate === 'function') {
      try {
        const d = obj.toDate();
        const ms = d instanceof Date ? d.getTime() : NaN;
        return Number.isFinite(ms) && ms > 0 ? Math.round(ms) : null;
      } catch {
        // fall through
      }
    }
    const sec =
      typeof obj.seconds === 'number'
        ? obj.seconds
        : typeof obj._seconds === 'number'
        ? obj._seconds
        : null;
    if (sec !== null && Number.isFinite(sec) && sec > 0) {
      const ns =
        typeof obj.nanoseconds === 'number'
          ? obj.nanoseconds
          : typeof obj._nanoseconds === 'number'
          ? obj._nanoseconds
          : 0;
      return Math.round(sec * 1000 + Math.floor(ns / 1_000_000));
    }
  }

  return null;
}

/**
 * Resolves a user's real account creation timestamp (in epoch ms) strictly from
 * existing stored fields or already-available Firebase Auth metadata.
 * Returns null if none exist.
 */
export function resolveUserJoinedAtMs(user: Record<string, any> | null | undefined): number | null {
  if (!user || typeof user !== 'object') return null;

  const candidates = [
    user.createdAt,
    user.joinedAt,
    user.created_at,
    user.joined_at,
    user.authCreationTime,
    user.authCreatedAt,
    user.creationTime,
    user.metadata?.creationTime,
  ];

  for (const candidate of candidates) {
    const ms = parseRealTimestampMs(candidate);
    if (ms !== null) return ms;
  }
  return null;
}

/**
 * Resolves a user's real last-activity timestamp (in epoch ms) strictly from
 * existing last-activity fields. Never falls back to createdAt or Date.now().
 */
export function resolveUserLastActiveAtMs(
  user: Record<string, any> | null | undefined
): number | null {
  if (!user || typeof user !== 'object') return null;

  const candidates = [
    user.lastActiveAt,
    user.lastActiveAtMs,
    user.lastPracticeAt,
    user.lastPracticeAtMs,
    user.lastSeenAt,
    user.lastLoginAt,
    user.metadata?.lastSignInTime,
  ];

  for (const candidate of candidates) {
    const ms = parseRealTimestampMs(candidate);
    if (ms !== null) return ms;
  }
  return null;
}

const pktDisplayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const pktExactFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const pktShortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? '';
}

/**
 * Formats an epoch ms timestamp into the exact admin format:
 * "23 Nov 2026, 5:46 PM" in Asia/Karachi (PKT).
 */
export function formatPktJoinedDate(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null;
  try {
    const parts = pktDisplayFormatter.formatToParts(new Date(ms));
    const day = getPart(parts, 'day');
    const month = getPart(parts, 'month');
    const year = getPart(parts, 'year');
    const hour = getPart(parts, 'hour');
    const minute = getPart(parts, 'minute');
    const dayPeriod = getPart(parts, 'dayPeriod').toUpperCase();
    if (!day || !month || !year || !hour || !minute) return null;
    return `${day} ${month} ${year}, ${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ''}`;
  } catch {
    return null;
  }
}

/**
 * Formats an epoch ms timestamp into a compact date: "23 Nov 2026" in Asia/Karachi.
 */
export function formatPktShortDate(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null;
  try {
    const parts = pktShortDateFormatter.formatToParts(new Date(ms));
    const day = getPart(parts, 'day');
    const month = getPart(parts, 'month');
    const year = getPart(parts, 'year');
    if (!day || !month || !year) return null;
    return `${day} ${month} ${year}`;
  } catch {
    return null;
  }
}

/**
 * Formats an epoch ms timestamp into a full exact PKT timestamp for hover/tap inspection:
 * "Mon, 23 Nov 2026, 5:46:12 PM PKT (UTC+5)"
 */
export function formatPktExactTimestamp(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null;
  try {
    const parts = pktExactFormatter.formatToParts(new Date(ms));
    const weekday = getPart(parts, 'weekday');
    const day = getPart(parts, 'day');
    const month = getPart(parts, 'month');
    const year = getPart(parts, 'year');
    const hour = getPart(parts, 'hour');
    const minute = getPart(parts, 'minute');
    const second = getPart(parts, 'second');
    const dayPeriod = getPart(parts, 'dayPeriod').toUpperCase();
    if (!day || !month || !year || !hour || !minute) return null;
    const prefix = weekday ? `${weekday}, ` : '';
    return `${prefix}${day} ${month} ${year}, ${hour}:${minute}:${second || '00'}${
      dayPeriod ? ` ${dayPeriod}` : ''
    } PKT (UTC+5)`;
  } catch {
    return null;
  }
}

/**
 * Computes a human-readable relative hint ("2 days ago", "5 hours ago", "Just now")
 * strictly from a real epoch ms timestamp.
 */
export function formatRelativeTimeHint(ms: number | null, nowMs: number = Date.now()): string | null {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null;
  const diffMs = nowMs - ms;
  if (diffMs < 0) {
    // Minor clock skew (< 5 min) -> Just now
    if (Math.abs(diffMs) < 5 * 60_000) return 'Just now';
    return 'Scheduled';
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin === 1 ? '1 min ago' : `${diffMin} mins ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}
