/**
 * ============================================================================
 * BOARDLY TIERED DAILY POST LIMITS — SINGLE SOURCE OF TRUTH
 * ============================================================================
 * Shared across:
 * - React client (Commons posting wizard, Profile composer, Community Guidelines)
 * - Local Express dev/API router (src/server/cloudflarePostsAndAuthRouter.ts)
 * - Cloudflare Worker (cloudflare/worker.ts)
 * - Cloudflare Pages Functions (functions/api/posts/[[path]].ts)
 *
 * Daily reset timezone: Asia/Karachi (PKT, fixed UTC+05:00, no DST),
 * consistent with Boardly's existing daily usage windows across the app.
 */

import {
  getEffectiveUserPlan,
  getPlan,
  normalizePlanTier,
  type CrewLikeDoc,
  type PlanLikeUser,
  type PlanTier,
} from '../lib/planTier';

export const POST_LIMITS = {
  /** Existing global post limit preserved for Free users (10 posts per day) */
  free: 10,
  /** Boardly Pro tier (50 posts per day) */
  pro: 50,
  /** Boardly Plus tier & Superadmin (unlimited posts) */
  plus: Infinity,
} as const;

export const POST_LIMIT_TIMEZONE = 'Asia/Karachi' as const;
export const POST_LIMIT_TIMEZONE_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+05:00 (no DST)
export const POST_LIMIT_RESET_TIME_LABEL = '12:00 AM PKT' as const;

export interface DailyPostWindow {
  dateKey: string; // YYYY-MM-DD in Asia/Karachi (PKT)
  windowStartMs: number; // UTC epoch ms of 00:00:00.000 PKT today
  resetAtMs: number; // UTC epoch ms of next 00:00:00.000 PKT midnight
  resetAtIso: string;
  msUntilReset: number;
  resetCountdown: string; // e.g. "5h 18m" or "14m"
  resetTimeLabel: string; // "12:00 AM PKT"
  timezone: typeof POST_LIMIT_TIMEZONE;
}

export interface DailyPostQuotaStatus {
  plan: PlanTier;
  /** JSON-safe daily cap: numeric for Free/Pro, null when unlimited (Plus/Superadmin) */
  limit: number | null;
  isUnlimited: boolean;
  usedToday: number;
  /** JSON-safe remaining posts today: numeric for Free/Pro, null when unlimited */
  remaining: number | null;
  limitReached: boolean;
  dateKey: string;
  windowStartMs: number;
  resetAtMs: number;
  resetAtIso: string;
  resetCountdown: string;
  resetTimeLabel: string;
  timezone: typeof POST_LIMIT_TIMEZONE;
  /** Next recommended upgrade tier when on Free ('pro') or Pro ('plus'), null for Plus */
  upgradeTarget: 'pro' | 'plus' | null;
}

/**
 * Computes the current daily post window (midnight-to-midnight in Asia/Karachi, UTC+5).
 */
export function getDailyPostWindow(nowMs: number = Date.now()): DailyPostWindow {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const pktNow = new Date(safeNow + POST_LIMIT_TIMEZONE_OFFSET_MS);
  const year = pktNow.getUTCFullYear();
  const month = pktNow.getUTCMonth();
  const day = pktNow.getUTCDate();

  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const windowStartMs = Date.UTC(year, month, day, 0, 0, 0, 0) - POST_LIMIT_TIMEZONE_OFFSET_MS;
  const resetAtMs = Date.UTC(year, month, day + 1, 0, 0, 0, 0) - POST_LIMIT_TIMEZONE_OFFSET_MS;
  const msUntilReset = Math.max(0, resetAtMs - safeNow);

  const totalMinutes = Math.max(1, Math.ceil(msUntilReset / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const resetCountdown = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return {
    dateKey,
    windowStartMs,
    resetAtMs,
    resetAtIso: new Date(resetAtMs).toISOString(),
    msUntilReset,
    resetCountdown,
    resetTimeLabel: POST_LIMIT_RESET_TIME_LABEL,
    timezone: POST_LIMIT_TIMEZONE,
  };
}

export const PLAN_LABELS: Record<PlanTier, 'Free' | 'Pro' | 'Plus'> = {
  free: 'Free',
  pro: 'Pro',
  plus: 'Plus',
};

/**
 * Single source of truth for resolving a user's canonical subscription plan tier
 * ('free' | 'pro' | 'plus'). Used by both daily post limits and profile/UI plan labels.
 */
export function getUserPlanTier(
  user: PlanLikeUser | PlanTier | string | null | undefined,
  crew?: CrewLikeDoc | null,
  nowMs: number = Date.now()
): PlanTier {
  if (!user) return 'free';
  if (typeof user === 'string') {
    return normalizePlanTier(user);
  }
  return crew ? getEffectiveUserPlan(user, crew, nowMs) : getPlan(user, nowMs);
}

/**
 * Single source of truth for human-readable plan labels: 'Free' | 'Pro' | 'Plus'.
 */
export function getPlanDisplayLabel(
  userOrPlan: PlanLikeUser | PlanTier | string | null | undefined,
  crew?: CrewLikeDoc | null,
  nowMs: number = Date.now()
): 'Free' | 'Pro' | 'Plus' {
  const tier = getUserPlanTier(userOrPlan, crew, nowMs);
  return PLAN_LABELS[tier];
}

/**
 * Returns the daily post limit for a canonical PlanTier ('free' | 'pro' | 'plus').
 */
export function getPostLimitForPlan(plan: PlanTier | string | null | undefined): number {
  const tier = normalizePlanTier(plan);
  if (tier === 'plus') return POST_LIMITS.plus;
  if (tier === 'pro') return POST_LIMITS.pro;
  return POST_LIMITS.free;
}

/**
 * Returns the daily post limit for a user (or plan string).
 * Edge cases:
 * - null / undefined / missing plan / guest / expired plan -> treated as 'free' (10/day)
 * - Pro (personal or crew) -> 50/day
 * - Plus (personal, crew, or Superadmin) -> Infinity (unlimited)
 */
export function getPostLimit(
  user: PlanLikeUser | PlanTier | string | null | undefined,
  crew?: CrewLikeDoc | null,
  nowMs: number = Date.now()
): number {
  return getPostLimitForPlan(getUserPlanTier(user, crew, nowMs));
}

/**
 * Builds the canonical, JSON-serializable daily post quota snapshot for API & UI.
 * Handles plan changes gracefully:
 * - Upgrading increases `limit` & `remaining` immediately against current `usedToday`.
 * - Downgrading never deletes existing posts; if `usedToday >= limit`, `remaining` is clamped to 0.
 */
export function buildDailyPostQuotaStatus(params: {
  plan: PlanTier | string | null | undefined;
  usedToday: number;
  nowMs?: number;
}): DailyPostQuotaStatus {
  const plan = normalizePlanTier(params.plan);
  const usedToday = Math.max(0, Math.floor(Number(params.usedToday) || 0));
  const windowInfo = getDailyPostWindow(params.nowMs ?? Date.now());
  const rawLimit = getPostLimitForPlan(plan);
  const isUnlimited = !Number.isFinite(rawLimit);
  const limit = isUnlimited ? null : rawLimit;
  const remaining = isUnlimited ? null : Math.max(0, rawLimit - usedToday);
  const limitReached = !isUnlimited && usedToday >= rawLimit;
  const upgradeTarget: 'pro' | 'plus' | null =
    plan === 'free' ? 'pro' : plan === 'pro' ? 'plus' : null;

  return {
    plan,
    limit,
    isUnlimited,
    usedToday,
    remaining,
    limitReached,
    dateKey: windowInfo.dateKey,
    windowStartMs: windowInfo.windowStartMs,
    resetAtMs: windowInfo.resetAtMs,
    resetAtIso: windowInfo.resetAtIso,
    resetCountdown: windowInfo.resetCountdown,
    resetTimeLabel: windowInfo.resetTimeLabel,
    timezone: windowInfo.timezone,
    upgradeTarget,
  };
}

/**
 * Formats a clear, plan-aware limit-reached message including the reset time and upgrade hint.
 */
export function formatPostLimitReachedMessage(quota: DailyPostQuotaStatus): string {
  const planLabel = quota.plan === 'pro' ? 'Boardly Pro' : 'Free';
  const cap = quota.limit ?? POST_LIMITS.free;
  const upgradeHint =
    quota.plan === 'free'
      ? `Upgrade to Boardly Pro (${POST_LIMITS.pro}/day) or Boardly Plus (Unlimited) to keep posting.`
      : `Upgrade to Boardly Plus for unlimited daily posts.`;
  return `You've reached your ${planLabel} limit of ${cap} posts today. Your limit resets in ${quota.resetCountdown} (${quota.resetTimeLabel}). ${upgradeHint}`;
}
