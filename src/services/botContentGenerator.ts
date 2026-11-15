import {
  BOARDLY_BOT_ACCOUNTS,
  BOT_GEMINI_CONFIG,
  BotAccountConfig,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  DELAY_BETWEEN_BOT_RUNS_MS,
  MAX_GEMINI_TRIES,
  MAX_STORED_BOT_ERROR_LENGTH,
  MIN_SAME_KEY_DELAY_MS,
  resolvePinnedGeminiModels,
} from '../config/botsConfig';
import {
  repairLatexLocally,
  validateMathInText,
  validatePostMath,
} from '../utils/katexValidator';

export {
  BOT_GEMINI_CONFIG,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  DELAY_BETWEEN_BOT_RUNS_MS,
  MAX_GEMINI_TRIES,
  MAX_STORED_BOT_ERROR_LENGTH,
  MIN_SAME_KEY_DELAY_MS,
  resolvePinnedGeminiModels,
};

export interface GeneratedBotPost {
  title: string;
  description: string;
  type: 'notes' | 'formula_sheet' | 'solved_paper' | 'discussion';
  chapter: string;
  tags: string[];
  verifiedBySelfCheck: boolean;
  katexSegmentsVerified: number;
}

export interface GeneratedBotComment {
  text: string;
  katexSegmentsVerified: number;
}

export type BotKeyStatusType = 'available' | 'cooling_down' | 'daily_quota_hit';

export interface BotKeyStatusEntry {
  keyIndex: number; // 0-based index internally; displayed as Key #1 .. Key #N in UI
  status: BotKeyStatusType;
  cooldownUntil: number | null; // epoch ms when key becomes available again
  lastUsedAt: number | null; // epoch ms
  callsToday: number;
  callsTotal: number;
  quotaDate: string; // YYYY-MM-DD (UTC)
  callsDayKey: string; // YYYY-MM-DD (UTC) alias for D1 column calls_day_key
  lastError: string | null;
}

export type GeminiKeyStatusRecord = BotKeyStatusEntry;

export interface PublicBotKeyStatusItem {
  keyIndex: number; // 0-based
  index: number; // 1-based (1..N)
  label: string; // "Key #1"
  status: BotKeyStatusType;
  statusText: string; // "Available" | "Cooling down until ..." | "Daily quota hit"
  assignedBots: number[]; // 1-based bot numbers assigned to this key
  cooldownUntil: string | null; // ISO string or null
  cooldownUntilMs: number | null;
  lastUsedAt: string | null;
  callsToday: number;
  callsTotal: number;
  lastError: string | null;
}

export interface BotKeyPoolState {
  keys: string[]; // Raw keys — NEVER serialized to any response or log
  keyStatuses: BotKeyStatusEntry[];
  lastUsedKeyIndex: number;
  allKeysExhaustedUntil: number | null;
  callsToday: number;
  callsLastRun: number;
  callsThisRun: number;
  quotaDate: string;
  lastCallTimestampMs: number;
  botCooldowns?: Record<string, number>; // botUid -> retryAfter epoch ms when marked quota_exceeded
}

/**
 * Formats a retry timestamp into a short, readable label (e.g. "45s" or "4:25 PM PKT").
 */
export function formatRetryAfterShort(retryUntilMs?: number | null, nowMs = Date.now()): string {
  if (!retryUntilMs || !Number.isFinite(retryUntilMs) || retryUntilMs <= 0) {
    return 'cooldown';
  }
  const diffMs = retryUntilMs - nowMs;
  const clockStr = new Date(retryUntilMs).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi',
  });
  if (diffMs > 0 && diffMs <= 120_000) {
    const secs = Math.max(1, Math.ceil(diffMs / 1000));
    return `${secs}s (${clockStr} PKT)`;
  }
  return `${clockStr} PKT`;
}

/**
 * Parses any retryDelay / Retry-After duration in milliseconds from headers or Gemini error text/JSON.
 */
export function extractGeminiRetryDelayMs(
  retryAfterHeader: string | null | undefined,
  errBodyText: string,
  nowMs = Date.now()
): number {
  let retryDelayMs = 0;

  // 1. Standard HTTP Retry-After header
  if (retryAfterHeader) {
    const trimmed = retryAfterHeader.trim();
    const seconds = Number(trimmed);
    if (Number.isFinite(seconds) && seconds > 0) {
      retryDelayMs = Math.ceil(seconds * 1000);
    } else {
      const parsedDate = Date.parse(trimmed);
      if (Number.isFinite(parsedDate) && parsedDate > nowMs) {
        retryDelayMs = parsedDate - nowMs;
      }
    }
  }

  // 2. JSON error payload from generativelanguage.googleapis.com (error.details[].retryDelay or error.retryDelay)
  const parseDurationStr = (raw: string): number => {
    const m = String(raw || '').trim().match(/^([0-9.]+)\s*(ms|s|sec|seconds|m|min|minutes|h|hr|hours)?$/i);
    if (!m) return 0;
    const val = parseFloat(m[1]);
    if (!Number.isFinite(val) || val <= 0) return 0;
    const unit = (m[2] || 's').toLowerCase();
    const mult =
      unit === 'ms'
        ? 1
        : unit.startsWith('m')
          ? 60_000
          : unit.startsWith('h')
            ? 3_600_000
            : 1000;
    return Math.ceil(val * mult);
  };

  try {
    const parsed = JSON.parse(errBodyText);
    const errObj = parsed?.error || parsed;
    if (typeof errObj?.retryDelay === 'string') {
      retryDelayMs = Math.max(retryDelayMs, parseDurationStr(errObj.retryDelay));
    } else if (typeof errObj?.retryDelay === 'number' && errObj.retryDelay > 0) {
      retryDelayMs = Math.max(retryDelayMs, Math.ceil(errObj.retryDelay * 1000));
    }
    const details = Array.isArray(errObj?.details) ? errObj.details : [];
    for (const d of details) {
      if (typeof d?.retryDelay === 'string') {
        retryDelayMs = Math.max(retryDelayMs, parseDurationStr(d.retryDelay));
      } else if (typeof d?.retryDelay === 'number' && d.retryDelay > 0) {
        retryDelayMs = Math.max(retryDelayMs, Math.ceil(d.retryDelay * 1000));
      }
    }
  } catch {
    // Not full JSON; fall through to regex extraction
  }

  // 3. Regex fallback for "retryDelay": "42s" or "retry in 42s" / "retry after 42s"
  if (!retryDelayMs && errBodyText) {
    const jsonFieldMatch = errBodyText.match(/"retryDelay"\s*:\s*"([0-9.]+\s*(?:ms|s|m|h)?)"/i);
    if (jsonFieldMatch) {
      retryDelayMs = Math.max(retryDelayMs, parseDurationStr(jsonFieldMatch[1]));
    }
  }

  if (!retryDelayMs && errBodyText) {
    const inlineMatch = errBodyText.match(
      /retry\s+(?:in|after)\s+([0-9.]+)\s*(ms|s|sec|seconds|m|min|minutes|h|hr|hours)/i
    );
    if (inlineMatch) {
      retryDelayMs = Math.max(
        retryDelayMs,
        parseDurationStr(`${inlineMatch[1]}${inlineMatch[2]}`)
      );
    }
  }

  return retryDelayMs;
}

/**
 * Formats any raw Gemini / HTTP / bot error into a short, clean human-readable message
 * (e.g. "Gemini quota exceeded (Key #1), retry after 4:25 PM PKT") with zero raw JSON.
 */
export interface FormatCleanBotErrorOptions {
  retryAfterMs?: number | null;
  retryUntilMs?: number | null;
  keyLabel?: string | null;
  keyNumber?: number | null;
  nowMs?: number;
}

export function formatCleanBotErrorMessage(
  rawError: string | null | undefined,
  retryUntilMsOrOpts?: number | FormatCleanBotErrorOptions | null,
  keyNumberArg?: number | null,
  nowMsArg?: number
): string {
  const raw = String(rawError || '').trim();
  if (!raw) return '';

  const opts: FormatCleanBotErrorOptions =
    retryUntilMsOrOpts && typeof retryUntilMsOrOpts === 'object'
      ? retryUntilMsOrOpts
      : {
          retryUntilMs: typeof retryUntilMsOrOpts === 'number' ? retryUntilMsOrOpts : null,
          keyNumber: keyNumberArg ?? null,
          nowMs: nowMsArg,
        };

  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : Date.now();
  const retryUntilMs = opts.retryUntilMs ?? opts.retryAfterMs ?? null;

  // Extract Key #N if present in keyLabel, keyNumber, or raw error
  const labelKeyMatch = String(opts.keyLabel || '').match(/Key\s*#?(\d+)/i);
  const rawKeyMatch = raw.match(/Key\s*#(\d+)/i);
  const effectiveKeyNum =
    typeof opts.keyNumber === 'number' && opts.keyNumber > 0
      ? opts.keyNumber
      : labelKeyMatch
        ? Number(labelKeyMatch[1])
        : rawKeyMatch
          ? Number(rawKeyMatch[1])
          : null;
  const keyPrefix = effectiveKeyNum ? ` (Key #${effectiveKeyNum})` : '';

  // Detect 429 / quota / rate-limit errors
  const isQuotaOr429 =
    /\b429\b|quota[_\s-]?exceeded|quota[_\s-]?exhausted|exceeded your current quota|resource_exhausted|cooling down|rate limit/i.test(
      raw
    );

  if (isQuotaOr429) {
    let retryLabel = '';
    if (retryUntilMs && Number.isFinite(retryUntilMs) && retryUntilMs > 0) {
      retryLabel = formatRetryAfterShort(retryUntilMs, nowMs);
    } else {
      const delayMs = extractGeminiRetryDelayMs(null, raw, nowMs);
      if (delayMs > 0) {
        retryLabel = formatRetryAfterShort(nowMs + delayMs, nowMs);
      } else {
        const isoMatch = raw.match(/(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)/);
        if (isoMatch) {
          const parsedIso = Date.parse(isoMatch[1]);
          if (Number.isFinite(parsedIso)) {
            retryLabel = formatRetryAfterShort(parsedIso, nowMs);
          }
        }
        if (!retryLabel) {
          const timeMatch = raw.match(
            /(?:until|after)\s+([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM)(?:\s*PKT)?|[0-9]+s(?:\s*\([^)]+\))?)/i
          );
          if (timeMatch) {
            retryLabel = timeMatch[1].trim();
          }
        }
      }
    }
    return `Gemini quota exceeded${keyPrefix}, retry after ${retryLabel || 'cooldown'}`;
  }

  // Detect 503 / temporary unavailability
  if (/\b503\b|service unavailable|overloaded|UNAVAILABLE/i.test(raw)) {
    const delayMs = extractGeminiRetryDelayMs(null, raw, nowMs);
    const retryLabel =
      retryUntilMs && retryUntilMs > 0
        ? formatRetryAfterShort(retryUntilMs, nowMs)
        : delayMs > 0
          ? formatRetryAfterShort(nowMs + delayMs, nowMs)
          : 'a moment';
    return `Gemini service unavailable${keyPrefix}, retry after ${retryLabel}`;
  }

  // Strip embedded JSON payloads if present
  let cleaned = raw;
  const braceStart = cleaned.indexOf('{');
  if (braceStart !== -1) {
    const jsonPart = cleaned.slice(braceStart);
    const prefixPart = cleaned.slice(0, braceStart).replace(/[:\s-]+$/, '').trim();
    try {
      const parsed = JSON.parse(jsonPart);
      const innerMsg = String(parsed?.error?.message || parsed?.message || '').trim();
      const firstSentence = innerMsg.split(/[.\n]/)[0]?.trim();
      cleaned = firstSentence
        ? prefixPart
          ? `${prefixPart}: ${firstSentence}`
          : firstSentence
        : prefixPart || 'Gemini request failed';
    } catch {
      cleaned = prefixPart || cleaned.slice(0, braceStart).trim() || 'Gemini request failed';
    }
  }

  // Replace any legacy "gemini-flash-latest" mention in stored strings
  cleaned = cleaned.replace(/gemini-flash-latest/gi, DEFAULT_GEMINI_MODEL);
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Redacts API keys, formats into a clean non-JSON summary, and truncates to a short length for storage.
 */
export function truncateBotErrorMessage(
  rawError: string | null | undefined,
  keys: string[] = [],
  maxLength = MAX_STORED_BOT_ERROR_LENGTH
): string {
  if (!rawError) return '';
  const redacted = redactApiKeysFromText(String(rawError), keys);
  const cleaned = formatCleanBotErrorMessage(redacted);
  const singleLine = cleaned.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return `${singleLine.slice(0, Math.max(20, maxLength - 3)).trim()}...`;
}

export class GeminiQuotaExceededError extends Error {
  public readonly status = 'quota_exceeded' as const;
  public readonly cooldownUntilMs: number;
  public readonly retryDelayMs: number;
  public readonly keyIndex: number;
  public readonly allKeysExhausted: boolean;

  constructor(params: {
    cooldownUntilMs: number;
    retryDelayMs?: number;
    keyIndex?: number;
    allKeysExhausted?: boolean;
    message?: string;
  }) {
    const keyNum = typeof params.keyIndex === 'number' && params.keyIndex >= 0 ? params.keyIndex + 1 : null;
    const cleanMsg = truncateBotErrorMessage(
      params.message ||
        formatCleanBotErrorMessage('Gemini HTTP 429 quota exceeded', params.cooldownUntilMs, keyNum)
    );
    super(cleanMsg);
    this.name = 'GeminiQuotaExceededError';
    this.cooldownUntilMs = params.cooldownUntilMs;
    this.retryDelayMs = params.retryDelayMs ?? Math.max(0, params.cooldownUntilMs - Date.now());
    this.keyIndex = params.keyIndex ?? 0;
    this.allKeysExhausted = Boolean(params.allKeysExhausted);
  }
}

export class AllGeminiKeysExhaustedError extends GeminiQuotaExceededError {
  public readonly exhaustedUntilMs: number;
  constructor(exhaustedUntilMs: number, detail?: string, keyIndex?: number) {
    const keyNum = typeof keyIndex === 'number' && keyIndex >= 0 ? keyIndex + 1 : null;
    const cleanMsg = truncateBotErrorMessage(
      formatCleanBotErrorMessage(detail || 'Gemini HTTP 429 quota exceeded', exhaustedUntilMs, keyNum)
    );
    super({
      cooldownUntilMs: exhaustedUntilMs,
      keyIndex,
      allKeysExhausted: true,
      message: cleanMsg,
    });
    this.name = 'AllGeminiKeysExhaustedError';
    this.exhaustedUntilMs = exhaustedUntilMs;
  }
}

/**
 * Parses comma-separated GEMINI_API_KEYS (with GEMINI_API_KEY as fallback).
 * Never logs or exposes any key string.
 */
export function parseGeminiApiKeys(
  geminiApiKeysRaw?: string | null,
  geminiApiKeyFallback?: string | null
): string[] {
  const combinedRaw = String(geminiApiKeysRaw || '').trim() || String(geminiApiKeyFallback || '').trim();
  if (!combinedRaw) return [];

  const parts = combinedRaw
    .split(/[\s,;]+/)
    .map((s) => s.trim().replace(/^["']+|["']+$/g, ''))
    .filter((s) => s.length >= 10);

  // Deduplicate while preserving exact configured key order (key 1 .. key N)
  return Array.from(new Set(parts));
}

/**
 * Scrubs any raw API key values or ?key=... query strings from error messages before logging or storing.
 */
export function redactApiKeysFromText(text: string, keys: string[] = []): string {
  let out = String(text || '');
  out = out.replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]');
  out = out.replace(/AIza[0-9A-Za-z\-_]{25,45}/g, '[REDACTED_KEY]');
  for (const k of keys) {
    if (k && k.length >= 8 && out.includes(k)) {
      out = out.split(k).join('[REDACTED_KEY]');
    }
  }
  return out;
}

/**
 * Computes the next daily quota reset timestamp (Google Gemini daily quotas reset at midnight Pacific Time, ~07:00/08:00 UTC).
 */
export function getNextDailyQuotaResetMs(nowMs = Date.now()): number {
  const now = new Date(nowMs);
  // Next 07:05 UTC (just after midnight PDT/PST)
  const reset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 5, 0, 0)
  );
  if (reset.getTime() <= nowMs + 15 * 60 * 1000) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }
  return reset.getTime();
}

/**
 * Parses HTTP 429 Retry-After header and Google RPC RetryInfo / QuotaFailure details.
 */
export function parseGemini429Cooldown(
  retryAfterHeader: string | null | undefined,
  errBodyText: string,
  nowMs = Date.now(),
  keyNumber?: number | null
): {
  status: 'cooling_down' | 'daily_quota_hit';
  cooldownUntilMs: number;
  retryDelayMs: number;
  isHardQuota: boolean;
  cleanMessage: string;
} {
  const retryDelayMs = extractGeminiRetryDelayMs(retryAfterHeader, errBodyText, nowMs);

  let parsedMessage = '';
  let isDailyQuota = false;

  try {
    const parsed = JSON.parse(errBodyText);
    const errObj = parsed?.error || parsed;
    if (typeof errObj?.message === 'string') {
      parsedMessage = errObj.message.trim();
    }
    const details = Array.isArray(errObj?.details) ? errObj.details : [];
    for (const d of details) {
      if (Array.isArray(d?.violations)) {
        for (const v of d.violations) {
          const qId = String(v?.quotaId || v?.subject || '');
          if (/perday|per_day|dayperproject|daily/i.test(qId)) {
            isDailyQuota = true;
          }
        }
      }
    }
  } catch {
    // Not JSON or partial JSON
  }

  if (
    /perday|per_day|requests\s+per\s+day|daily\s+quota|quota\s+exceeded.*day/i.test(errBodyText)
  ) {
    isDailyQuota = true;
  }

  const isBillingOrProjectQuotaMsg =
    /exceeded your current quota,\s*please check your plan and billing details/i.test(
      parsedMessage || errBodyText
    );

  if (isDailyQuota) {
    const resetMs = Math.max(getNextDailyQuotaResetMs(nowMs), nowMs + retryDelayMs);
    return {
      status: 'daily_quota_hit',
      cooldownUntilMs: resetMs,
      retryDelayMs,
      isHardQuota: true,
      cleanMessage: truncateBotErrorMessage(
        formatCleanBotErrorMessage('Gemini HTTP 429 quota exceeded', resetMs, keyNumber, nowMs)
      ),
    };
  }

  if (isBillingOrProjectQuotaMsg && retryDelayMs === 0) {
    const twoHoursMs = nowMs + 2 * 60 * 60 * 1000;
    const nextResetMs = getNextDailyQuotaResetMs(nowMs);
    const cooldownUntilMs = Math.min(twoHoursMs, nextResetMs);
    return {
      status: 'daily_quota_hit',
      cooldownUntilMs,
      retryDelayMs: 0,
      isHardQuota: true,
      cleanMessage: truncateBotErrorMessage(
        formatCleanBotErrorMessage('Gemini HTTP 429 quota exceeded', cooldownUntilMs, keyNumber, nowMs)
      ),
    };
  }

  // Per-minute rate limit cooldown (respect server retryDelay + 1s buffer, or default 65s)
  const effectiveDelayMs = retryDelayMs > 0 ? retryDelayMs + 1000 : 65_000;
  const cooldownUntilMs = nowMs + effectiveDelayMs;
  return {
    status: 'cooling_down',
    cooldownUntilMs,
    retryDelayMs,
    isHardQuota: false,
    cleanMessage: truncateBotErrorMessage(
      formatCleanBotErrorMessage('Gemini HTTP 429 quota exceeded', cooldownUntilMs, keyNumber, nowMs)
    ),
  };
}

/**
 * Builds or normalizes a BotKeyPoolState from configured keys and persisted D1 records.
 */
export function buildBotKeyPoolState(params: {
  keys?: string[];
  apiKeys?: string[];
  persistedStatuses?: Partial<BotKeyStatusEntry>[];
  lastUsedKeyIndex?: number;
  allKeysExhaustedUntil?: number | null;
  callsToday?: number;
  callsLastRun?: number;
  quotaDate?: string;
  botCooldowns?: Record<string, number>;
  nowMs?: number;
}): BotKeyPoolState {
  const nowMs = params.nowMs ?? Date.now();
  const todayUtc = new Date(nowMs).toISOString().slice(0, 10);
  const keys = params.keys || params.apiKeys || [];
  const byIdx = new Map<number, Partial<BotKeyStatusEntry>>();
  for (const item of params.persistedStatuses || []) {
    if (typeof item.keyIndex === 'number') {
      byIdx.set(item.keyIndex, item);
    }
  }

  const keyStatuses: BotKeyStatusEntry[] = keys.map((_, idx) => {
    const existing = byIdx.get(idx);
    const existingDayKey = existing?.callsDayKey || existing?.quotaDate || '';
    const sameDay = !existingDayKey || existingDayKey === todayUtc;
    const rawCooldown =
      typeof existing?.cooldownUntil === 'number' && existing.cooldownUntil > 0
        ? existing.cooldownUntil
        : null;
    const isStillCooling = rawCooldown !== null && rawCooldown > nowMs;

    let status: BotKeyStatusType = 'available';
    if (isStillCooling) {
      status = existing?.status === 'daily_quota_hit' ? 'daily_quota_hit' : 'cooling_down';
    }

    return {
      keyIndex: idx,
      status,
      cooldownUntil: isStillCooling ? rawCooldown : null,
      lastUsedAt:
        typeof existing?.lastUsedAt === 'number' && existing.lastUsedAt > 0
          ? existing.lastUsedAt
          : null,
      callsToday: sameDay ? Number(existing?.callsToday || 0) : 0,
      callsTotal: Number(existing?.callsTotal || 0),
      quotaDate: todayUtc,
      callsDayKey: todayUtc,
      lastError: existing?.lastError
        ? truncateBotErrorMessage(existing.lastError, keys)
        : null,
    };
  });

  // Recompute whether all keys are currently cooling down
  const allCooling =
    keyStatuses.length > 0 &&
    keyStatuses.every((k) => k.cooldownUntil !== null && k.cooldownUntil > nowMs);

  const earliestCooldown = allCooling
    ? Math.min(...keyStatuses.map((k) => Number(k.cooldownUntil)))
    : params.allKeysExhaustedUntil && params.allKeysExhaustedUntil > nowMs
      ? params.allKeysExhaustedUntil
      : null;

  const sameQuotaDay = !params.quotaDate || params.quotaDate === todayUtc;
  const sumCallsToday = keyStatuses.reduce((sum, k) => sum + k.callsToday, 0);
  const callsToday = Math.max(sameQuotaDay ? Number(params.callsToday || 0) : 0, sumCallsToday);

  const activeBotCooldowns: Record<string, number> = {};
  if (params.botCooldowns && typeof params.botCooldowns === 'object') {
    for (const [bUid, untilMs] of Object.entries(params.botCooldowns)) {
      if (typeof untilMs === 'number' && untilMs > nowMs) {
        activeBotCooldowns[bUid] = untilMs;
      }
    }
  }

  return {
    keys,
    keyStatuses,
    lastUsedKeyIndex:
      typeof params.lastUsedKeyIndex === 'number' ? params.lastUsedKeyIndex : -1,
    allKeysExhaustedUntil: earliestCooldown,
    callsToday,
    callsLastRun: Number(params.callsLastRun || 0),
    callsThisRun: 0,
    quotaDate: todayUtc,
    lastCallTimestampMs: 0,
    botCooldowns: activeBotCooldowns,
  };
}

export function getTotalGeminiCallsToday(pool: BotKeyPoolState): number {
  return pool.keyStatuses.reduce((sum, k) => sum + Number(k.callsToday || 0), 0);
}

/**
 * Formats key statuses for the Admin UI without ever exposing any key characters,
 * ensuring all error messages are clean and truncated.
 */
export function toPublicKeyStatusList(
  pool: BotKeyPoolState,
  totalBotsCount = BOARDLY_BOT_ACCOUNTS.length
): PublicBotKeyStatusItem[] {
  const numKeys = pool.keys.length;
  const nowMs = Date.now();

  return pool.keyStatuses.map((k) => {
    const isStillCooling = k.cooldownUntil !== null && k.cooldownUntil > nowMs;
    const effectiveStatus: BotKeyStatusType = isStillCooling ? k.status : 'available';
    const assignedBots: number[] = [];
    if (numKeys > 0) {
      for (let bIdx = 0; bIdx < totalBotsCount; bIdx++) {
        if (bIdx % numKeys === k.keyIndex) {
          assignedBots.push(bIdx + 1);
        }
      }
    }

    let statusText = 'Available';
    if (isStillCooling && k.cooldownUntil) {
      const untilTime = new Date(k.cooldownUntil).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      statusText =
        effectiveStatus === 'daily_quota_hit'
          ? `Quota exceeded (retry after ${untilTime})`
          : `Cooling down until ${untilTime}`;
    }

    return {
      keyIndex: k.keyIndex,
      index: k.keyIndex + 1,
      label: `Key #${k.keyIndex + 1}`,
      assignedBots,
      status: effectiveStatus,
      statusText,
      cooldownUntil:
        isStillCooling && k.cooldownUntil ? new Date(k.cooldownUntil).toISOString() : null,
      cooldownUntilMs: isStillCooling ? k.cooldownUntil : null,
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
      callsToday: k.callsToday,
      callsTotal: k.callsTotal,
      lastError: k.lastError
        ? truncateBotErrorMessage(
            formatCleanBotErrorMessage(k.lastError, k.cooldownUntil, k.keyIndex + 1, nowMs),
            pool.keys
          )
        : null,
    };
  });
}

/**
 * Selects the next available API key:
 * - Assigns each bot a primary key by index (bot 1 -> key 1, bot 2 -> key 2, ...)
 * - Rotates round-robin using `pool.lastUsedKeyIndex` so consecutive calls never pile onto the same key
 * - Skips any key that is currently cooling down (`cooldownUntil > now`)
 */
export function selectNextAvailableKey(
  pool: BotKeyPoolState,
  botIndex?: number,
  forceRoundRobinAdvance = false
): { keyIndex: number; apiKey: string; entry: BotKeyStatusEntry } | null {
  const numKeys = pool.keys.length;
  if (numKeys === 0) return null;

  const nowMs = Date.now();
  const todayUtc = new Date(nowMs).toISOString().slice(0, 10);

  // Refresh expired cooldowns and day rollover
  for (const entry of pool.keyStatuses) {
    if (entry.quotaDate !== todayUtc) {
      entry.quotaDate = todayUtc;
      entry.callsToday = 0;
    }
    if (entry.cooldownUntil !== null && entry.cooldownUntil <= nowMs) {
      entry.status = 'available';
      entry.cooldownUntil = null;
    }
  }

  let startIdx = 0;
  if (!forceRoundRobinAdvance && typeof botIndex === 'number' && botIndex >= 0) {
    const botAssignedIdx = botIndex % numKeys;
    if (botAssignedIdx !== pool.lastUsedKeyIndex || numKeys === 1) {
      startIdx = botAssignedIdx;
    } else {
      startIdx = (pool.lastUsedKeyIndex + 1) % numKeys;
    }
  } else {
    startIdx = (pool.lastUsedKeyIndex + 1 + numKeys) % numKeys;
  }

  for (let offset = 0; offset < numKeys; offset++) {
    const candidateIdx = (startIdx + offset) % numKeys;
    const entry = pool.keyStatuses[candidateIdx];
    if (!entry.cooldownUntil || entry.cooldownUntil <= nowMs) {
      pool.lastUsedKeyIndex = candidateIdx;
      pool.allKeysExhaustedUntil = null;
      return {
        keyIndex: candidateIdx,
        apiKey: pool.keys[candidateIdx],
        entry,
      };
    }
  }

  // All keys are cooling down
  const earliest = Math.min(
    ...pool.keyStatuses.map((k) => Number(k.cooldownUntil || nowMs + 60_000))
  );
  pool.allKeysExhaustedUntil = earliest;
  return null;
}

function extractJsonObject(rawText: string): any {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) throw new Error('Empty response from Gemini API');
  try {
    return JSON.parse(trimmed);
  } catch {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      }
      throw new Error('Could not parse JSON from Gemini response');
    }
  }
}

export async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Per-key execution queues and completion timestamps so two bots NEVER run at the same time on the same key.
 */
const keyExecutionQueues = new Map<string, Promise<void>>();
const keyLastFinishedAtMs = new Map<string, number>();

export async function enqueueOnGeminiKey<T>(
  keyId: string,
  minDelayBetweenSameKeyCallsMs: number,
  lastUsedAtMs: number | null | undefined,
  task: () => Promise<T>
): Promise<T> {
  const prevQueue = keyExecutionQueues.get(keyId) || Promise.resolve();
  let releaseCurrent!: () => void;
  const currentGate = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  keyExecutionQueues.set(
    keyId,
    prevQueue.then(() => currentGate, () => currentGate)
  );

  await prevQueue.catch(() => {});

  try {
    const lastFinish = Math.max(
      keyLastFinishedAtMs.get(keyId) || 0,
      typeof lastUsedAtMs === 'number' && lastUsedAtMs > 0 ? lastUsedAtMs : 0
    );
    if (lastFinish > 0 && minDelayBetweenSameKeyCallsMs > 0) {
      const elapsed = Date.now() - lastFinish;
      if (elapsed < minDelayBetweenSameKeyCallsMs) {
        await sleep(minDelayBetweenSameKeyCallsMs - elapsed);
      }
    }
    return await task();
  } finally {
    keyLastFinishedAtMs.set(keyId, Date.now());
    releaseCurrent();
  }
}

/**
 * Global bot-run queue so concurrent cron/admin bot runs execute sequentially with a gap between runs.
 */
let botRunQueuePromise: Promise<any> = Promise.resolve();

export function enqueueBotRun<T>(task: () => Promise<T>): Promise<T> {
  const next = botRunQueuePromise.then(
    () => task(),
    () => task()
  );
  botRunQueuePromise = next.catch(() => {});
  return next;
}

/**
 * Executes a Gemini JSON generation request with:
 * - Pinned model resolved from single config (`DEFAULT_GEMINI_MODEL`)
 * - Per-key serialization queue + minimum delay so two bots never run at the same time on the same key
 * - Retry with exponential backoff for HTTP 429 and 503 responses (max 3 tries total), respecting `retryDelay` if present
 * - Marks 429 failures as `quota_exceeded` with retry time and clean, truncated error messages
 */
export async function callGeminiJsonWithPool(params: {
  pool: BotKeyPoolState;
  botIndex?: number;
  model?: string | null;
  fallbackModel?: string | null;
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  minDelayBetweenCallsMs?: number;
  maxTries?: number;
  baseBackoffMs?: number;
  maxInlineRetryDelayMs?: number;
  onStateChange?: (pool: BotKeyPoolState) => Promise<void> | void;
}): Promise<any> {
  const {
    pool,
    botIndex,
    systemInstruction,
    prompt,
    temperature = 0.4,
    minDelayBetweenCallsMs = MIN_SAME_KEY_DELAY_MS,
    maxTries = MAX_GEMINI_TRIES,
    baseBackoffMs = 1000,
    maxInlineRetryDelayMs = 15_000,
    onStateChange,
  } = params;

  if (!pool.keys || pool.keys.length === 0) {
    throw new Error(
      'No Gemini API keys configured. Set GEMINI_API_KEYS (or GEMINI_API_KEY) in Cloudflare Secrets.'
    );
  }

  const { primaryModel, fallbackModel } = resolvePinnedGeminiModels(
    params.model,
    params.fallbackModel
  );
  let activeModel = primaryModel;

  const totalTries = Math.min(MAX_GEMINI_TRIES, Math.max(1, maxTries));
  let lastError: Error | null = null;
  let lastQuotaError: GeminiQuotaExceededError | null = null;

  for (let tryIdx = 0; tryIdx < totalTries; tryIdx++) {
    const selected = selectNextAvailableKey(pool, botIndex, tryIdx > 0);
    if (!selected) {
      if (onStateChange) await onStateChange(pool);
      throw new AllGeminiKeysExhaustedError(
        pool.allKeysExhaustedUntil || Date.now() + 60_000,
        lastError?.message
      );
    }

    const keyQueueId = `key_${selected.keyIndex}`;

    try {
      const responseResult = await enqueueOnGeminiKey(
        keyQueueId,
        minDelayBetweenCallsMs,
        selected.entry.lastUsedAt,
        async () => {
          const callNow = Date.now();
          pool.lastCallTimestampMs = callNow;
          pool.callsLastRun += 1;
          pool.callsThisRun += 1;
          pool.callsToday += 1;
          selected.entry.callsToday += 1;
          selected.entry.callsTotal += 1;
          selected.entry.lastUsedAt = callNow;

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            activeModel
          )}:generateContent?key=${encodeURIComponent(selected.apiKey)}`;

          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'aistudio-build',
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature,
                responseMimeType: 'application/json',
              },
            }),
          });

          const rawBody = await resp.text().catch(() => '');
          return {
            ok: resp.ok,
            status: resp.status,
            retryAfterHeader: resp.headers.get('Retry-After'),
            rawBody,
          };
        }
      );

      if (!responseResult.ok) {
        const safeErrBody = redactApiKeysFromText(responseResult.rawBody, pool.keys);
        const isLastTry = tryIdx >= totalTries - 1;
        const expBackoffMs = Math.round(
          baseBackoffMs * Math.pow(2, tryIdx) + Math.random() * 200
        );

        if (responseResult.status === 429) {
          const nowAfter429 = Date.now();
          const parsed429 = parseGemini429Cooldown(
            responseResult.retryAfterHeader,
            safeErrBody,
            nowAfter429,
            selected.keyIndex + 1
          );

          const shortCleanMsg = parsed429.cleanMessage;
          selected.entry.lastError = shortCleanMsg;
          console.error(
            `[BotGeminiPool] Try ${tryIdx + 1}/${totalTries} HTTP 429 on Key #${
              selected.keyIndex + 1
            } (${activeModel}): ${shortCleanMsg}`
          );

          // Check if another key in the pool is currently available for failover
          const hasOtherAvailableKey = pool.keyStatuses.some(
            (k, idx) =>
              idx !== selected.keyIndex &&
              (!k.cooldownUntil || k.cooldownUntil <= nowAfter429)
          );

          // Respect retryDelay from the 429 response if it exists, otherwise use exponential backoff
          const requestedWaitMs =
            parsed429.retryDelayMs > 0
              ? Math.max(parsed429.retryDelayMs, expBackoffMs)
              : expBackoffMs;

          // Can we retry on another key or after waiting retryDelay?
          const canRetrySameKeyInline =
            !isLastTry &&
            !parsed429.isHardQuota &&
            requestedWaitMs <= maxInlineRetryDelayMs;

          if (!isLastTry && hasOtherAvailableKey) {
            // Mark current key cooling down and retry immediately after backoff on the next key
            selected.entry.status = parsed429.status;
            selected.entry.cooldownUntil = parsed429.cooldownUntilMs;
            if (onStateChange) await onStateChange(pool);
            await sleep(Math.min(requestedWaitMs, maxInlineRetryDelayMs));
            continue;
          }

          if (canRetrySameKeyInline) {
            // Single key or all other keys busy, but retryDelay is short enough to wait and retry (max 3 tries)
            if (onStateChange) await onStateChange(pool);
            await sleep(requestedWaitMs);
            continue;
          }

          // Mark key as cooling down until retry time and stop retrying in a loop
          selected.entry.status = parsed429.status;
          selected.entry.cooldownUntil = parsed429.cooldownUntilMs;

          const allExhausted = pool.keyStatuses.every(
            (k) => k.cooldownUntil !== null && k.cooldownUntil > Date.now()
          );
          if (allExhausted) {
            pool.allKeysExhaustedUntil = Math.min(
              ...pool.keyStatuses.map((k) => Number(k.cooldownUntil || Date.now() + 60_000))
            );
          }

          if (onStateChange) await onStateChange(pool);

          lastQuotaError = allExhausted
            ? new AllGeminiKeysExhaustedError(
                pool.allKeysExhaustedUntil || parsed429.cooldownUntilMs,
                shortCleanMsg,
                selected.keyIndex
              )
            : new GeminiQuotaExceededError({
                cooldownUntilMs: parsed429.cooldownUntilMs,
                retryDelayMs: parsed429.retryDelayMs,
                keyIndex: selected.keyIndex,
                allKeysExhausted: false,
                message: shortCleanMsg,
              });

          throw lastQuotaError;
        }

        if (responseResult.status === 503 || responseResult.status === 404) {
          const retryDelayMs = extractGeminiRetryDelayMs(
            responseResult.retryAfterHeader,
            safeErrBody,
            Date.now()
          );
          const waitMs =
            retryDelayMs > 0
              ? Math.min(Math.max(retryDelayMs, expBackoffMs), maxInlineRetryDelayMs)
              : expBackoffMs;

          if (fallbackModel && activeModel !== fallbackModel) {
            activeModel = fallbackModel;
          }

          const short503Msg = truncateBotErrorMessage(
            formatCleanBotErrorMessage(
              `Gemini HTTP ${responseResult.status}: ${safeErrBody}`,
              retryDelayMs > 0 ? Date.now() + retryDelayMs : null,
              selected.keyIndex + 1
            ),
            pool.keys
          );
          selected.entry.lastError = short503Msg;
          lastError = new Error(short503Msg);
          if (onStateChange) await onStateChange(pool);

          if (!isLastTry && (responseResult.status === 503 || responseResult.status === 404)) {
            await sleep(waitMs);
            continue;
          }
          throw lastError;
        }

        // Non-retryable HTTP status (e.g. 400, 401, 403)
        const shortHttpErr = truncateBotErrorMessage(
          formatCleanBotErrorMessage(
            `Gemini HTTP ${responseResult.status} (Key #${selected.keyIndex + 1}): ${safeErrBody}`,
            null,
            selected.keyIndex + 1
          ),
          pool.keys
        );
        selected.entry.lastError = shortHttpErr;
        lastError = new Error(shortHttpErr);
        if (onStateChange) await onStateChange(pool);
        throw lastError;
      }

      // HTTP 200 OK
      selected.entry.status = 'available';
      selected.entry.cooldownUntil = null;
      selected.entry.lastError = null;
      if (onStateChange) await onStateChange(pool);

      const data = JSON.parse(responseResult.rawBody) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return extractJsonObject(rawText);
    } catch (err: any) {
      if (err instanceof GeminiQuotaExceededError) {
        throw err;
      }
      const safeMsg = truncateBotErrorMessage(err?.message || String(err), pool.keys);
      lastError = new Error(safeMsg);
      selected.entry.lastError = safeMsg;
      if (onStateChange) await onStateChange(pool);

      // Do not loop on non-retryable client HTTP errors
      if (/Gemini HTTP 40[0134]/i.test(safeMsg)) {
        throw lastError;
      }

      if (tryIdx < totalTries - 1) {
        const backoffMs = Math.round(baseBackoffMs * Math.pow(2, tryIdx) + Math.random() * 200);
        await sleep(backoffMs);
      }
    }
  }

  throw (
    lastQuotaError ||
    lastError ||
    new Error('Gemini generation failed after 3 tries.')
  );
}

const POST_FORMATS = [
  'worked_example',
  'formula_sheet',
  'common_mistakes',
  'mcq_with_explanation',
] as const;

/**
 * Single-call post generation + merged self-check + local KaTeX repair & strict katex.renderToString validation.
 * Makes 1 logical Gemini API call per post.
 */
export async function generateVerifiedBotStudyPost(params: {
  bot: BotAccountConfig;
  botIndex?: number;
  pool?: BotKeyPoolState;
  keyPool?: BotKeyPoolState;
  apiKey?: string;
  model?: string | null;
  fallbackModel?: string | null;
  postIndex?: number;
  onStateChange?: (pool: BotKeyPoolState) => Promise<void> | void;
}): Promise<{
  post: GeneratedBotPost | null;
  status?: 'ok' | 'quota_exceeded' | 'error' | 'discarded';
  quotaExceeded?: boolean;
  retryAfterMs?: number;
  retryAfterIso?: string;
  discardReason?: string;
  exhaustedUntilMs?: number;
  allKeysExhausted?: boolean;
  geminiCallsUsed: number;
}> {
  const { bot, botIndex, model, fallbackModel, postIndex = 0, onStateChange } = params;
  const effectivePool =
    params.pool ||
    params.keyPool ||
    buildBotKeyPoolState({
      keys: parseGeminiApiKeys(params.apiKey),
    });

  const callsBefore = effectivePool.callsThisRun;

  const chapter =
    bot.chapters[Math.floor(Math.random() * bot.chapters.length)] || bot.subject;
  const formatStyle =
    POST_FORMATS[(postIndex + Math.floor(Math.random() * POST_FORMATS.length)) % POST_FORMATS.length];

  const mappedType: GeneratedBotPost['type'] =
    formatStyle === 'formula_sheet'
      ? 'formula_sheet'
      : formatStyle === 'mcq_with_explanation'
      ? 'solved_paper'
      : 'notes';

  const systemInstruction = `You are ${bot.displayName}, an expert ${bot.subject} educator and entrance-exam mentor on Boardly Commons (Class ${bot.classLevel}, ${bot.board} Board, ${bot.target}).
STRICT RULES (GENERATION + MANDATORY SELF-CHECK IN ONE PASS):
1. Return ONLY valid JSON matching the requested schema.
2. All mathematical, physical, chemical, or algorithmic notation MUST use valid KaTeX:
   - Inline math: $...$ (e.g., $v = u + at$, $\\Delta H^\\circ = -285.8\\text{ kJ/mol}$, $O(n \\log n)$)
   - Block math: $$...$$ (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
   - Even for English or Biology, include at least one valid KaTeX expression (e.g., Hardy-Weinberg $p^2 + 2pq + q^2 = 1$, ATP yield $\\text{Net ATP} = 36\\text{ to }38$, or entrance test scoring formula $\\text{Net Score} = C - 0.25W$).
3. Do NOT use unsupported LaTeX environments like \\begin{align*}, \\begin{equation}, or unescaped % inside math mode. Use \\begin{aligned}...\\end{aligned} inside $$...$$ if multi-line math is needed.
4. SELF-CHECK BEFORE OUTPUTTING: Double-check every calculation, unit, chemical balance, and MCQ option so that the stated final answer matches the step-by-step derivation 100%, and every $ and $$ delimiter is properly closed.`;

  const userPrompt = `Create and self-verify a ${formatStyle.replace(/_/g, ' ')} post for:
- Subject: ${bot.subject}
- Chapter/Topic: ${chapter}
- Class Level: Class ${bot.classLevel} (${bot.board} Board / ${bot.target})

Return JSON with this exact structure:
{
  "title": "Concise, specific academic title (40-95 chars, balanced $ if math is used)",
  "description": "Full structured study post (180-420 words) with worked steps, valid KaTeX ($...$ and $$...$$), and if MCQ format, options (A)-(D), Correct Answer, and Step-by-Step Solution.",
  "chapter": "${chapter}",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "selfCheckVerified": true
}`;

  let rawDraft: any;
  try {
    rawDraft = await callGeminiJsonWithPool({
      pool: effectivePool,
      botIndex,
      model,
      fallbackModel,
      systemInstruction,
      prompt: userPrompt,
      temperature: 0.35,
      onStateChange,
    });
  } catch (err: any) {
    const callsUsed = Math.max(0, effectivePool.callsThisRun - callsBefore);
    if (err instanceof GeminiQuotaExceededError) {
      if (!effectivePool.botCooldowns) effectivePool.botCooldowns = {};
      effectivePool.botCooldowns[bot.uid] = err.cooldownUntilMs;
      return {
        post: null,
        status: 'quota_exceeded',
        quotaExceeded: true,
        retryAfterMs: err.cooldownUntilMs,
        retryAfterIso: new Date(err.cooldownUntilMs).toISOString(),
        discardReason: truncateBotErrorMessage(err.message, effectivePool.keys),
        exhaustedUntilMs: err.cooldownUntilMs,
        allKeysExhausted: err.allKeysExhausted,
        geminiCallsUsed: callsUsed,
      };
    }
    return {
      post: null,
      status: 'error',
      discardReason: truncateBotErrorMessage(err?.message || String(err), effectivePool.keys),
      geminiCallsUsed: callsUsed,
    };
  }

  const callsUsed = Math.max(0, effectivePool.callsThisRun - callsBefore);
  let title = String(rawDraft?.title || '').trim();
  let description = String(rawDraft?.description || '').trim();
  const tags: string[] = Array.isArray(rawDraft?.tags)
    ? rawDraft.tags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6)
    : [bot.subject.toLowerCase(), `class-${bot.classLevel}`, bot.board.toLowerCase()];

  if (!title || !description || description.length < 80) {
    return {
      post: null,
      status: 'discarded',
      discardReason: 'Generated title or description was empty or too short',
      geminiCallsUsed: callsUsed,
    };
  }

  if (rawDraft?.selfCheckVerified === false) {
    return {
      post: null,
      status: 'discarded',
      discardReason: 'Discarded: Model self-check marked draft as unverified',
      geminiCallsUsed: callsUsed,
    };
  }

  // Local KaTeX validation in code (katex.renderToString with throwOnError: true) — 0 extra Gemini calls
  let katexCheck = validatePostMath(title, description);

  if (!katexCheck.valid) {
    const locallyRepairedTitle = repairLatexLocally(title);
    const locallyRepairedDesc = repairLatexLocally(description);
    const recheckLocal = validatePostMath(locallyRepairedTitle, locallyRepairedDesc);

    if (recheckLocal.valid) {
      title = locallyRepairedTitle;
      description = locallyRepairedDesc;
      katexCheck = recheckLocal;
    } else {
      return {
        post: null,
        status: 'discarded',
        discardReason: truncateBotErrorMessage(
          `Discarded: KaTeX validation failed (${recheckLocal.errors.join('; ')})`
        ),
        geminiCallsUsed: callsUsed,
      };
    }
  }

  return {
    post: {
      title,
      description,
      type: mappedType,
      chapter,
      tags,
      verifiedBySelfCheck: true,
      katexSegmentsVerified: katexCheck.mathSegmentsCount,
    },
    status: 'ok',
    geminiCallsUsed: callsUsed,
  };
}

/**
 * Generates a constructive, subject-aware academic comment on another user's post,
 * strictly validating any KaTeX math (`$...$` / `$$...$$`) locally in code without extra Gemini calls.
 */
export async function generateVerifiedBotComment(params: {
  bot: BotAccountConfig;
  botIndex?: number;
  targetPost: { title: string; description: string; subject: string };
  pool?: BotKeyPoolState;
  keyPool?: BotKeyPoolState;
  apiKey?: string;
  model?: string | null;
  fallbackModel?: string | null;
  onStateChange?: (pool: BotKeyPoolState) => Promise<void> | void;
}): Promise<{
  comment: GeneratedBotComment | null;
  status?: 'ok' | 'quota_exceeded' | 'error' | 'discarded';
  quotaExceeded?: boolean;
  retryAfterMs?: number;
  retryAfterIso?: string;
  discardReason?: string;
  exhaustedUntilMs?: number;
  allKeysExhausted?: boolean;
  geminiCallsUsed: number;
}> {
  const { bot, botIndex, targetPost, model, fallbackModel, onStateChange } = params;
  const effectivePool =
    params.pool ||
    params.keyPool ||
    buildBotKeyPoolState({
      keys: parseGeminiApiKeys(params.apiKey),
    });

  const callsBefore = effectivePool.callsThisRun;

  const systemInstruction = `You are ${bot.displayName}, a ${bot.subject} study partner on Boardly Commons.
Write a short, helpful, academically accurate comment (1 to 3 sentences) adding a useful formula tip, shortcut, or key exam insight related to the post.
Use valid inline KaTeX $...$ if referencing a formula or variable. Never use broken LaTeX. Return JSON only: { "text": "..." }`;

  const prompt = `Post Title: ${targetPost.title}
Post Subject: ${targetPost.subject}
Post Excerpt: ${String(targetPost.description || '').slice(0, 450)}

Return JSON:
{
  "text": "Your 1-3 sentence academic comment here"
}`;

  try {
    const raw = await callGeminiJsonWithPool({
      pool: effectivePool,
      botIndex,
      model,
      fallbackModel,
      systemInstruction,
      prompt,
      temperature: 0.35,
      onStateChange,
    });

    const callsUsed = Math.max(0, effectivePool.callsThisRun - callsBefore);
    let text = String(raw?.text || '').trim();
    if (!text || text.length < 10) {
      return {
        comment: null,
        status: 'discarded',
        discardReason: 'Empty comment generated',
        geminiCallsUsed: callsUsed,
      };
    }

    let check = validateMathInText(text);
    if (!check.valid) {
      const repairedText = repairLatexLocally(text);
      const recheck = validateMathInText(repairedText);
      if (recheck.valid) {
        text = repairedText;
        check = recheck;
      } else {
        return {
          comment: null,
          status: 'discarded',
          discardReason: truncateBotErrorMessage(
            `Discarded comment: KaTeX invalid (${recheck.errors.join('; ')})`
          ),
          geminiCallsUsed: callsUsed,
        };
      }
    }

    return {
      comment: {
        text,
        katexSegmentsVerified: check.mathSegmentsCount,
      },
      status: 'ok',
      geminiCallsUsed: callsUsed,
    };
  } catch (err: any) {
    const callsUsed = Math.max(0, effectivePool.callsThisRun - callsBefore);
    if (err instanceof GeminiQuotaExceededError) {
      if (!effectivePool.botCooldowns) effectivePool.botCooldowns = {};
      effectivePool.botCooldowns[bot.uid] = err.cooldownUntilMs;
      return {
        comment: null,
        status: 'quota_exceeded',
        quotaExceeded: true,
        retryAfterMs: err.cooldownUntilMs,
        retryAfterIso: new Date(err.cooldownUntilMs).toISOString(),
        discardReason: truncateBotErrorMessage(err.message, effectivePool.keys),
        exhaustedUntilMs: err.cooldownUntilMs,
        allKeysExhausted: err.allKeysExhausted,
        geminiCallsUsed: callsUsed,
      };
    }
    return {
      comment: null,
      status: 'error',
      discardReason: truncateBotErrorMessage(err?.message || String(err), effectivePool.keys),
      geminiCallsUsed: callsUsed,
    };
  }
}

