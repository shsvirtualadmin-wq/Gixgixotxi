import { BOARDLY_BOT_ACCOUNTS, BotAccountConfig } from '../config/botsConfig';
import {
  repairLatexLocally,
  validateMathInText,
  validatePostMath,
} from '../utils/katexValidator';

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

/**
 * STEP 4: Pinned stable Gemini models (never use moving alias 'gemini-flash-latest' or invalid 'gemini-3.5-flash').
 * Primary: 'gemini-2.5-flash' (Google's current GA stable Flash model on generativelanguage.googleapis.com)
 * Fallback: 'gemini-2.5-flash-lite' (Google's current GA stable Flash-Lite model)
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

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
}

export class AllGeminiKeysExhaustedError extends Error {
  public readonly exhaustedUntilMs: number;
  constructor(exhaustedUntilMs: number, detail?: string) {
    const retryTimeStr = new Date(exhaustedUntilMs).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi',
    });
    super(
      detail
        ? `All Gemini API keys are cooling down until ${retryTimeStr} PKT (${new Date(exhaustedUntilMs).toISOString()}). Last error: ${detail}`
        : `All Gemini API keys are cooling down until ${retryTimeStr} PKT (${new Date(exhaustedUntilMs).toISOString()}).`
    );
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

export function resolvePinnedGeminiModels(
  envModel?: string | null,
  envFallbackModel?: string | null
): { model: string; primaryModel: string; fallbackModel: string } {
  let primary = String(envModel || '').trim();
  // Never use moving alias 'gemini-flash-latest' or non-existent 'gemini-3.5-flash'
  if (!primary || primary === 'gemini-flash-latest' || primary === 'gemini-3.5-flash') {
    primary = DEFAULT_GEMINI_MODEL;
  }

  let fallback = String(envFallbackModel || '').trim();
  if (!fallback || fallback === 'gemini-flash-latest' || fallback === 'gemini-3.5-flash') {
    fallback = DEFAULT_GEMINI_FALLBACK_MODEL;
  }

  return {
    model: primary,
    primaryModel: primary,
    fallbackModel: fallback,
  };
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
  nowMs = Date.now()
): {
  status: 'cooling_down' | 'daily_quota_hit';
  cooldownUntilMs: number;
  cleanMessage: string;
} {
  let retryDelayMs = 0;

  // 1. Check standard Retry-After HTTP header
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

  // 2. Parse JSON error payload from generativelanguage.googleapis.com
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
      if (typeof d?.retryDelay === 'string') {
        const m = d.retryDelay.match(/^([0-9.]+)\s*(s|ms|m|h)?$/i);
        if (m) {
          const val = parseFloat(m[1]);
          const unit = (m[2] || 's').toLowerCase();
          const mult =
            unit === 'ms' ? 1 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 1000;
          retryDelayMs = Math.max(retryDelayMs, Math.ceil(val * mult));
        }
      }
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

  // 3. Also check text patterns for "Please retry in Xs" or daily quota mentions
  if (!retryDelayMs) {
    const inlineMatch = errBodyText.match(/retry\s+in\s+([0-9.]+)\s*(ms|s|sec|seconds|m|min|minutes)/i);
    if (inlineMatch) {
      const val = parseFloat(inlineMatch[1]);
      const unit = inlineMatch[2].toLowerCase();
      const mult = unit === 'ms' ? 1 : unit.startsWith('m') ? 60_000 : 1000;
      retryDelayMs = Math.ceil(val * mult);
    }
  }

  if (
    /perday|per_day|requests\s+per\s+day|daily\s+quota|quota\s+exceeded.*day/i.test(errBodyText)
  ) {
    isDailyQuota = true;
  }

  // If the message is "You exceeded your current quota, please check your plan and billing details."
  // and no short per-minute retryDelay was returned, treat as a long quota cooldown (or daily quota).
  const isBillingOrProjectQuotaMsg =
    /exceeded your current quota,\s*please check your plan and billing details/i.test(
      parsedMessage || errBodyText
    );

  if (isDailyQuota) {
    const resetMs = Math.max(getNextDailyQuotaResetMs(nowMs), nowMs + retryDelayMs);
    return {
      status: 'daily_quota_hit',
      cooldownUntilMs: resetMs,
      cleanMessage: parsedMessage || errBodyText.trim(),
    };
  }

  if (isBillingOrProjectQuotaMsg && retryDelayMs === 0) {
    // Project/key quota exhausted without a short per-minute retry window -> cool down for 2 hours (or until daily reset if sooner)
    const twoHoursMs = nowMs + 2 * 60 * 60 * 1000;
    const nextResetMs = getNextDailyQuotaResetMs(nowMs);
    return {
      status: 'daily_quota_hit',
      cooldownUntilMs: Math.min(twoHoursMs, nextResetMs),
      cleanMessage: parsedMessage || errBodyText.trim(),
    };
  }

  // Per-minute rate limit cooldown (at least 65 seconds, or the server's requested retryDelay + 2s buffer)
  const effectiveDelayMs = retryDelayMs > 0 ? retryDelayMs + 2000 : 65_000;
  return {
    status: 'cooling_down',
    cooldownUntilMs: nowMs + effectiveDelayMs,
    cleanMessage: parsedMessage || errBodyText.trim(),
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
      lastError: existing?.lastError || null,
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
  };
}

export function getTotalGeminiCallsToday(pool: BotKeyPoolState): number {
  return pool.keyStatuses.reduce((sum, k) => sum + Number(k.callsToday || 0), 0);
}

/**
 * Formats key statuses for the Admin UI without ever exposing any key characters.
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
          ? `Daily quota hit (until ${untilTime})`
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
      lastError: k.lastError ? redactApiKeysFromText(k.lastError, pool.keys) : null,
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
    // Use the bot's assigned key unless it was the exact key just used (when multiple keys exist)
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

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Executes a Gemini JSON generation request with:
 * - 1.2s–1.8s sequential pacing delay between calls
 * - Multi-key round-robin & bot-index key assignment
 * - Immediate failover to the next available key on HTTP 429 (recording retryDelay / Retry-After cooldown)
 * - Max 2 retries per request (3 attempts total) with exponential backoff + jitter
 * - Full untruncated error logging (with API keys strictly redacted)
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
  onStateChange?: (pool: BotKeyPoolState) => Promise<void> | void;
}): Promise<any> {
  const {
    pool,
    botIndex,
    systemInstruction,
    prompt,
    temperature = 0.4,
    minDelayBetweenCallsMs = 1400,
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

  // Retry at most 2 times per request (attempt 0 = initial, attempt 1 = retry 1, attempt 2 = retry 2)
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const selected = selectNextAvailableKey(pool, botIndex, attempt > 0);
    if (!selected) {
      if (onStateChange) await onStateChange(pool);
      throw new AllGeminiKeysExhaustedError(
        pool.allKeysExhaustedUntil || Date.now() + 60_000,
        lastError?.message
      );
    }

    // Enforce 1-2 second sequential pacing between Gemini calls
    const nowBeforeWait = Date.now();
    if (pool.lastCallTimestampMs > 0) {
      const elapsed = nowBeforeWait - pool.lastCallTimestampMs;
      const targetGap = minDelayBetweenCallsMs + Math.floor(Math.random() * 400); // 1.4s - 1.8s
      if (elapsed < targetGap) {
        await sleep(targetGap - elapsed);
      }
    }

    const callNow = Date.now();
    pool.lastCallTimestampMs = callNow;
    pool.callsLastRun += 1;
    pool.callsThisRun += 1;
    pool.callsToday += 1;
    selected.entry.callsToday += 1;
    selected.entry.callsTotal += 1;
    selected.entry.lastUsedAt = callNow;

    try {
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

      if (!resp.ok) {
        const rawErrBody = await resp.text().catch(() => '');
        const safeErrBody = redactApiKeysFromText(rawErrBody, pool.keys);

        if (resp.status === 429) {
          const retryAfterHeader = resp.headers.get('Retry-After');
          const parsed429 = parseGemini429Cooldown(retryAfterHeader, safeErrBody, Date.now());
          selected.entry.status = parsed429.status;
          selected.entry.cooldownUntil = parsed429.cooldownUntilMs;

          const cooldownIso = new Date(parsed429.cooldownUntilMs).toISOString();
          const fullMsg = `Gemini HTTP 429 (${activeModel}, Key #${
            selected.keyIndex + 1
          } marked ${parsed429.status} until ${cooldownIso}): ${parsed429.cleanMessage}`;

          selected.entry.lastError = fullMsg;
          lastError = new Error(fullMsg);
          console.error(`[BotGeminiPool] ${fullMsg}`);

          // Check if all keys are now cooling down
          const nowAfter429 = Date.now();
          const allExhausted = pool.keyStatuses.every(
            (k) => k.cooldownUntil !== null && k.cooldownUntil > nowAfter429
          );
          if (allExhausted) {
            pool.allKeysExhaustedUntil = Math.min(
              ...pool.keyStatuses.map((k) => Number(k.cooldownUntil || nowAfter429 + 60_000))
            );
            if (onStateChange) await onStateChange(pool);
            throw new AllGeminiKeysExhaustedError(pool.allKeysExhaustedUntil, fullMsg);
          }

          if (onStateChange) await onStateChange(pool);

          if (attempt < maxRetries) {
            // Exponential backoff + jitter before retrying with the next available key
            const backoffMs = Math.round(900 * Math.pow(2, attempt) + Math.random() * 450);
            await sleep(backoffMs);
            continue;
          }
          throw lastError;
        }

        // If the primary model returned 404 (not found / unsupported) and a fallback model exists, switch model
        if ((resp.status === 404 || resp.status === 503) && fallbackModel && activeModel !== fallbackModel) {
          const prevModel = activeModel;
          activeModel = fallbackModel;
          const switchMsg = `Gemini HTTP ${resp.status} on model ${prevModel}; switching to fallback model ${activeModel}. Details: ${safeErrBody}`;
          console.warn(`[BotGeminiPool] ${switchMsg}`);
          selected.entry.lastError = switchMsg;
          lastError = new Error(switchMsg);
          if (onStateChange) await onStateChange(pool);
          if (attempt < maxRetries) {
            const backoffMs = Math.round(800 * Math.pow(2, attempt) + Math.random() * 350);
            await sleep(backoffMs);
            continue;
          }
          throw lastError;
        }

        const fullHttpErr = `Gemini HTTP ${resp.status} (${activeModel}, Key #${
          selected.keyIndex + 1
        }): ${safeErrBody}`;
        selected.entry.lastError = fullHttpErr;
        lastError = new Error(fullHttpErr);
        console.error(`[BotGeminiPool] ${fullHttpErr}`);
        if (onStateChange) await onStateChange(pool);

        if (attempt < maxRetries) {
          const backoffMs = Math.round(1000 * Math.pow(2, attempt) + Math.random() * 450);
          await sleep(backoffMs);
          continue;
        }
        throw lastError;
      }

      // HTTP 200 OK
      selected.entry.status = 'available';
      selected.entry.cooldownUntil = null;
      selected.entry.lastError = null;
      if (onStateChange) await onStateChange(pool);

      const data = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return extractJsonObject(rawText);
    } catch (err: any) {
      if (err instanceof AllGeminiKeysExhaustedError) {
        throw err;
      }
      const safeMsg = redactApiKeysFromText(err?.message || String(err), pool.keys);
      lastError = new Error(safeMsg);
      selected.entry.lastError = safeMsg;
      console.error(
        `[BotGeminiPool] Attempt ${attempt + 1}/${maxRetries + 1} failed on Key #${
          selected.keyIndex + 1
        }: ${safeMsg}`
      );
      if (onStateChange) await onStateChange(pool);

      if (attempt < maxRetries) {
        const backoffMs = Math.round(1000 * Math.pow(2, attempt) + Math.random() * 450);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error('Gemini JSON generation failed after maximum retries.');
}

const POST_FORMATS = [
  'worked_example',
  'formula_sheet',
  'common_mistakes',
  'mcq_with_explanation',
] as const;

/**
 * STEP 2: Single-call post generation + merged self-check + local KaTeX repair & strict katex.renderToString validation.
 * Makes exactly 1 Gemini API call per post (down from 2-3 logical / 6-18 HTTP calls).
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
    if (err instanceof AllGeminiKeysExhaustedError) {
      return {
        post: null,
        discardReason: err.message,
        exhaustedUntilMs: err.exhaustedUntilMs,
        allKeysExhausted: true,
        geminiCallsUsed: callsUsed,
      };
    }
    return {
      post: null,
      discardReason: `Gemini generation error: ${err?.message || String(err)}`,
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
      discardReason: 'Generated title or description was empty or too short',
      geminiCallsUsed: callsUsed,
    };
  }

  if (rawDraft?.selfCheckVerified === false) {
    return {
      post: null,
      discardReason: 'Discarded: Model self-check marked draft as unverified',
      geminiCallsUsed: callsUsed,
    };
  }

  // Local KaTeX validation in code (katex.renderToString with throwOnError: true) — 0 extra Gemini calls
  let katexCheck = validatePostMath(title, description);

  if (!katexCheck.valid) {
    // Attempt deterministic local LaTeX syntax repair first (0 Gemini calls)
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
        discardReason: `Discarded: KaTeX validation failed (${recheckLocal.errors.join('; ')})`,
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
          discardReason: `Discarded comment: KaTeX invalid (${recheck.errors.join('; ')})`,
          geminiCallsUsed: callsUsed,
        };
      }
    }

    return {
      comment: {
        text,
        katexSegmentsVerified: check.mathSegmentsCount,
      },
      geminiCallsUsed: callsUsed,
    };
  } catch (err: any) {
    const callsUsed = Math.max(0, effectivePool.callsThisRun - callsBefore);
    if (err instanceof AllGeminiKeysExhaustedError) {
      return {
        comment: null,
        discardReason: err.message,
        exhaustedUntilMs: err.exhaustedUntilMs,
        allKeysExhausted: true,
        geminiCallsUsed: callsUsed,
      };
    }
    return {
      comment: null,
      discardReason: `Comment generation failed: ${err?.message || String(err)}`,
      geminiCallsUsed: callsUsed,
    };
  }
}
