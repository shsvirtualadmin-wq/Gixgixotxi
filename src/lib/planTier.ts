/**
 * Single Source of Truth for Boardly Plan Tiers (Free < Pro < Plus)
 *
 * Shared across:
 * - React client (student app, billing, Kobans, Settings, Commons, crews, AI Mentors)
 * - Admin panel (users, payments, Kobans, plans, overview, announcements, crews)
 * - Server & Cloudflare Pages Functions / Workers
 *
 * Zero DOM / browser / Firebase SDK dependencies so it bundles cleanly in every runtime.
 */

export type PlanTier = 'free' | 'pro' | 'plus';
export type PaidPlanId = 'pro_monthly' | 'pro_annual' | 'plus_monthly' | 'plus_annual';
export type PlanBillingPeriod = 'monthly' | 'annual';

export const PLUS_ALREADY_INCLUDES_PRO_MSG = 'You already have Plus, which includes Pro';

export interface PlanTierPricingConfig {
  pricePkrMonthly: number;
  priceKobansMonthly: number;
  aiCreditsPerDay: number;
}

export interface PlansConfigDoc {
  free: {
    aiCreditsPerDay: number;
  };
  pro: PlanTierPricingConfig;
  plus: PlanTierPricingConfig;
  annualDiscountPercent: number; // e.g. 25 means -25% off 12 * monthly
  kobansPerPkr: number; // default 10
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export const DEFAULT_PLANS_CONFIG: PlansConfigDoc = {
  free: {
    aiCreditsPerDay: 5,
  },
  pro: {
    pricePkrMonthly: 199,
    priceKobansMonthly: 1990,
    aiCreditsPerDay: 50,
  },
  plus: {
    pricePkrMonthly: 399,
    priceKobansMonthly: 3990,
    aiCreditsPerDay: 100,
  },
  annualDiscountPercent: 25,
  kobansPerPkr: 10,
  updatedAt: null,
  updatedBy: null,
};

export interface PlanLikeUser {
  uid?: string | null;
  email?: string | null;
  role?: string | null;
  isGuest?: boolean | null;
  isSuperAdmin?: boolean | null;
  isSuperAdminClaim?: boolean | null;
  plan?: string | null;
  planTier?: string | null;
  tier?: string | null;
  isPro?: boolean | null;
  isPlus?: boolean | null;
  isPremium?: boolean | null;
  proPlanId?: string | null;
  plusPlanId?: string | null;
  planId?: string | null;
  proUntil?: unknown;
  plusUntil?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
  effectivePlan?: string | null;
}

export interface CrewLikeMember {
  uid?: string | null;
  isPro?: boolean | null;
  isPlus?: boolean | null;
  isPremium?: boolean | null;
  plan?: string | null;
  planTier?: string | null;
  proPlanId?: string | null;
  plusUntil?: unknown;
  proUntil?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
}

export interface CrewLikeDoc {
  tier?: string | null;
  paid_until?: string | null;
  hasProMember?: boolean | null;
  hasPlusMember?: boolean | null;
  isProShared?: boolean | null;
  effectivePlan?: string | null;
  members?: CrewLikeMember[] | null;
}

/**
 * Safely parses Firestore Timestamp, REST timestampValue, number (seconds or ms),
 * Date, or ISO string into epoch milliseconds.
 */
export function parsePlanExpiryMs(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw <= 0) return null;
    return raw < 1e11 ? Math.round(raw * 1000) : Math.round(raw);
  }

  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isNaN(t) ? null : t;
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.toMillis === 'function') {
      const ms = (obj.toMillis as () => number)();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof obj.seconds === 'number' && Number.isFinite(obj.seconds)) {
      return Math.round(obj.seconds * 1000);
    }
    if (typeof obj._seconds === 'number' && Number.isFinite(obj._seconds)) {
      return Math.round(obj._seconds * 1000);
    }
    if (typeof obj.timestampValue === 'string') {
      const parsed = new Date(obj.timestampValue).getTime();
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num) && num > 0) {
        return num < 1e11 ? Math.round(num * 1000) : Math.round(num);
      }
    }
    const parsed = new Date(trimmed).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Numeric rank for plan comparison: free (0) < pro (1) < plus (2).
 */
export function planRank(plan: string | null | undefined): number {
  const normalized = String(plan || '')
    .trim()
    .toLowerCase();
  if (
    normalized === 'plus' ||
    normalized === 'plus_monthly' ||
    normalized === 'plus_annual' ||
    normalized === 'boardly_plus'
  ) {
    return 2;
  }
  if (
    normalized === 'pro' ||
    normalized === 'pro_monthly' ||
    normalized === 'pro_annual' ||
    normalized === 'boardly_pro' ||
    normalized === 'premium'
  ) {
    return 1;
  }
  return 0;
}

/**
 * Normalizes any raw plan / planId string into a canonical PlanTier ('free' | 'pro' | 'plus').
 */
export function normalizePlanTier(plan: string | null | undefined): PlanTier {
  const r = planRank(plan);
  if (r >= 2) return 'plus';
  if (r === 1) return 'pro';
  return 'free';
}

/**
 * Returns the tier ('pro' | 'plus') of a paid plan ID.
 */
export function getPlanTierFromPlanId(rawPlanId: string | null | undefined): 'pro' | 'plus' {
  const clean = String(rawPlanId || '')
    .trim()
    .toLowerCase();
  if (clean.startsWith('plus') || clean === 'boardly_plus') {
    return 'plus';
  }
  return 'pro';
}

/**
 * Returns the billing cadence ('monthly' | 'annual') of a paid plan ID.
 */
export function getBillingFromPlanId(rawPlanId: string | null | undefined): PlanBillingPeriod {
  const clean = String(rawPlanId || '')
    .trim()
    .toLowerCase();
  if (clean.includes('annual') || clean.includes('year') || clean === '365') {
    return 'annual';
  }
  return 'monthly';
}

/**
 * Checks whether a user object carries verified Superadmin status.
 */
export function isSuperAdminUser(user: PlanLikeUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true || user.isSuperAdminClaim === true) return true;
  const role = String(user.role || '')
    .trim()
    .toLowerCase();
  return role === 'super_admin' || role === 'superadmin';
}

/**
 * Extracts the best expiry timestamp (ms) relevant to a user's current plan.
 */
export function getUserPlanExpiryMs(user: PlanLikeUser | null | undefined): number | null {
  if (!user) return null;
  const candidates = [
    parsePlanExpiryMs(user.plusUntil),
    parsePlanExpiryMs(user.planExpiresAt),
    parsePlanExpiryMs(user.premiumExpiresAt),
    parsePlanExpiryMs(user.proUntil),
  ].filter((v): v is number => v !== null);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

/**
 * Returns the user's active personal plan tier: 'free' | 'pro' | 'plus'.
 *
 * Rules:
 * - Guest accounts are always 'free'.
 * - Superadmin always resolves to 'plus' (highest access everywhere).
 * - If user's stored plan is Plus: active if plusUntil / planExpiresAt / premiumExpiresAt > nowMs
 *   (or no expiry timestamp set via admin override); if expired, returns 'free' (Plus expires directly to Free, NOT Pro).
 * - If user's stored plan is Pro (including legacy isPremium/proUntil/proPlanId): active if expiry > nowMs
 *   (or no expiry set via admin override); if expired, returns 'free'.
 * - Never treats an active Plus user as Free.
 */
export function getPlan(user: PlanLikeUser | null | undefined, nowMs: number = Date.now()): PlanTier {
  if (!user) return 'free';
  const isGuest = Boolean(user.isGuest || (user.uid && String(user.uid).startsWith('guest_')));
  if (isGuest) return 'free';

  if (isSuperAdminUser(user)) {
    return 'plus';
  }

  const rawPlan = String(user.plan || '').trim().toLowerCase();
  const rawPlanTier = String(user.planTier || user.tier || '').trim().toLowerCase();
  const rawPlanId = String(user.plusPlanId || user.proPlanId || user.planId || '')
    .trim()
    .toLowerCase();

  const plusUntilMs = parsePlanExpiryMs(user.plusUntil);
  const proUntilMs = parsePlanExpiryMs(user.proUntil);
  const planExpMs = parsePlanExpiryMs(user.planExpiresAt);
  const premExpMs = parsePlanExpiryMs(user.premiumExpiresAt);

  const generalExpCandidates = [planExpMs, premExpMs].filter((v): v is number => v !== null);
  const generalExpMs = generalExpCandidates.length > 0 ? Math.max(...generalExpCandidates) : null;

  const isMarkedPlus =
    rawPlan === 'plus' ||
    rawPlan === 'plus_monthly' ||
    rawPlan === 'plus_annual' ||
    rawPlanTier === 'plus' ||
    user.isPlus === true ||
    rawPlanId.startsWith('plus');

  // Active Plus check
  if (isMarkedPlus || (plusUntilMs !== null && plusUntilMs > nowMs)) {
    const plusEffectiveExp =
      plusUntilMs !== null && generalExpMs !== null
        ? Math.max(plusUntilMs, generalExpMs)
        : plusUntilMs !== null
          ? plusUntilMs
          : generalExpMs;

    if (plusEffectiveExp !== null) {
      // Plus expires directly to Free (NOT Pro)
      return plusEffectiveExp > nowMs ? 'plus' : 'free';
    }
    // Marked Plus with no expiry date set (e.g. admin override)
    return 'plus';
  }

  // Active Pro check (compatible with all legacy Pro fields: plan, isPro, isPremium, proUntil, planExpiresAt, premiumExpiresAt, proPlanId)
  const isMarkedPro =
    rawPlan === 'pro' ||
    rawPlan === 'pro_monthly' ||
    rawPlan === 'pro_annual' ||
    rawPlan === 'premium' ||
    rawPlanTier === 'pro' ||
    user.isPro === true ||
    user.isPremium === true ||
    rawPlanId.startsWith('pro');

  const proExpCandidates = [proUntilMs, planExpMs, premExpMs].filter((v): v is number => v !== null);
  const proEffectiveExp = proExpCandidates.length > 0 ? Math.max(...proExpCandidates) : null;

  if (proEffectiveExp !== null && proEffectiveExp > nowMs) {
    // Future expiry exists and not marked Plus -> active Pro
    return 'pro';
  }

  if (isMarkedPro) {
    if (proEffectiveExp !== null) {
      return proEffectiveExp > nowMs ? 'pro' : 'free';
    }
    return 'pro';
  }

  // If an already-resolved effectivePlan was passed (e.g. from server/hook)
  if (user.effectivePlan) {
    return normalizePlanTier(user.effectivePlan);
  }

  return 'free';
}

/**
 * Returns true if user's plan is at least `requiredPlan` (free < pro < plus).
 * Superadmin always returns true.
 */
export function hasAtLeast(
  user: PlanLikeUser | PlanTier | null | undefined,
  requiredPlan: PlanTier,
  nowMs: number = Date.now()
): boolean {
  if (!user) return requiredPlan === 'free';
  const current: PlanTier = typeof user === 'string' ? normalizePlanTier(user) : getPlan(user, nowMs);
  return planRank(current) >= planRank(requiredPlan);
}

/**
 * Returns true if user has any paid plan (Pro or Plus, or Superadmin).
 */
export function isPaid(
  user: PlanLikeUser | PlanTier | null | undefined,
  nowMs: number = Date.now()
): boolean {
  return hasAtLeast(user, 'pro', nowMs);
}

/**
 * Returns true if user is Plus or above (Plus or Superadmin).
 */
export function plusAndAbove(
  user: PlanLikeUser | PlanTier | null | undefined,
  nowMs: number = Date.now()
): boolean {
  return hasAtLeast(user, 'plus', nowMs);
}

/**
 * Alias for plusAndAbove — returns true when user's active plan is 'plus' (or Superadmin).
 */
export function isPlus(
  user: PlanLikeUser | PlanTier | null | undefined,
  nowMs: number = Date.now()
): boolean {
  return plusAndAbove(user, nowMs);
}

/**
 * Returns true only when user's active plan is strictly 'pro' (not 'plus' and not 'free').
 */
export function isProOnly(
  user: PlanLikeUser | PlanTier | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!user) return false;
  const current: PlanTier = typeof user === 'string' ? normalizePlanTier(user) : getPlan(user, nowMs);
  return current === 'pro';
}

/**
 * Resolves the highest effective plan of a Nakama Crew.
 * - If any member has Plus (or crew.hasPlusMember / crew.effectivePlan === 'plus') -> 'plus'
 * - Else if any member has Pro (or paid large crew active or crew.hasProMember) -> 'pro'
 * - Else -> 'free'
 */
export function resolveEffectiveCrewPlan(
  crew: CrewLikeDoc | null | undefined,
  nowMs: number = Date.now(),
  options?: { excludeSelfUid?: string | null; selfPersonalPlan?: PlanTier }
): PlanTier {
  if (!crew) return 'free';

  let best: PlanTier = 'free';
  const promote = (candidate: PlanTier) => {
    if (planRank(candidate) > planRank(best)) best = candidate;
  };

  // Large paid crew grants at least Pro while paid_until is active
  if (crew.tier === 'paid' && crew.paid_until) {
    const paidUntilMs = parsePlanExpiryMs(crew.paid_until);
    if (paidUntilMs !== null && paidUntilMs > nowMs) {
      promote('pro');
    }
  }

  const sharingAllowed = crew.isProShared !== false;
  if (sharingAllowed) {
    if (crew.effectivePlan) {
      promote(normalizePlanTier(crew.effectivePlan));
    }
    if (crew.hasPlusMember === true) {
      promote('plus');
    }
    if (crew.hasProMember === true) {
      promote('pro');
    }

    if (Array.isArray(crew.members)) {
      for (const m of crew.members) {
        if (!m) continue;
        if (options?.excludeSelfUid && m.uid && m.uid === options.excludeSelfUid) {
          if (options.selfPersonalPlan) {
            promote(options.selfPersonalPlan);
          }
          continue;
        }
        const memberPlan = getPlan(m, nowMs);
        promote(memberPlan);
      }
    }
  }

  return best;
}

/**
 * Resolves the highest plan between a user's personal plan and their Nakama Crew's effective plan.
 */
export function getEffectiveUserPlan(
  user: PlanLikeUser | null | undefined,
  crew?: CrewLikeDoc | null,
  nowMs: number = Date.now()
): PlanTier {
  if (!user) return 'free';
  if (isSuperAdminUser(user)) return 'plus';
  const personal = getPlan(user, nowMs);
  if (!crew) return personal;
  const crewPlan = resolveEffectiveCrewPlan(crew, nowMs, {
    excludeSelfUid: user.uid,
    selfPersonalPlan: personal,
  });
  return planRank(crewPlan) > planRank(personal) ? crewPlan : personal;
}

/**
 * Computes annual price from monthly price and discount percentage (default 25%).
 * Example: 199 * 12 * 0.75 = 1791; 399 * 12 * 0.75 = 3591.
 */
export function computeAnnualPrice(monthlyPrice: number, discountPercent: number = 25): number {
  const safeMonthly = Math.max(0, Number(monthlyPrice) || 0);
  const safeDiscount = Math.min(90, Math.max(0, Number(discountPercent) || 0));
  return Math.round(safeMonthly * 12 * (1 - safeDiscount / 100));
}

/**
 * Computes extra Plus days credited when an active Pro user upgrades to Plus:
 *   extraPlusDays = Math.floor(remainingProDays * proPrice / plusPrice)
 */
export function computeProToPlusCreditDays(
  remainingProDays: number,
  proMonthlyPrice: number = DEFAULT_PLANS_CONFIG.pro.pricePkrMonthly,
  plusMonthlyPrice: number = DEFAULT_PLANS_CONFIG.plus.pricePkrMonthly
): number {
  const days = Math.max(0, Number(remainingProDays) || 0);
  const proP = Math.max(0, Number(proMonthlyPrice) || 0);
  const plusP = Math.max(1, Number(plusMonthlyPrice) || 1);
  if (days <= 0 || proP <= 0) return 0;
  return Math.floor((days * proP) / plusP);
}

/**
 * Returns daily AI Mentor credits allowance for a given plan tier, reading from PlansConfigDoc if provided.
 */
export function getDailyAiCreditsForPlan(
  plan: PlanTier | string | null | undefined,
  config?: Partial<PlansConfigDoc> | null
): number {
  const tier = normalizePlanTier(plan);
  if (tier === 'plus') {
    const val = Number(config?.plus?.aiCreditsPerDay);
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : DEFAULT_PLANS_CONFIG.plus.aiCreditsPerDay;
  }
  if (tier === 'pro') {
    const val = Number(config?.pro?.aiCreditsPerDay);
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : DEFAULT_PLANS_CONFIG.pro.aiCreditsPerDay;
  }
  const val = Number(config?.free?.aiCreditsPerDay);
  return Number.isFinite(val) && val > 0 ? Math.floor(val) : DEFAULT_PLANS_CONFIG.free.aiCreditsPerDay;
}

/**
 * Safely merges partial Firestore `config/plans` data with built-in DEFAULT_PLANS_CONFIG defaults.
 */
export function normalizePlansConfig(raw?: Record<string, any> | null): PlansConfigDoc {
  if (!raw || typeof raw !== 'object') {
    return {
      free: { ...DEFAULT_PLANS_CONFIG.free },
      pro: { ...DEFAULT_PLANS_CONFIG.pro },
      plus: { ...DEFAULT_PLANS_CONFIG.plus },
      annualDiscountPercent: DEFAULT_PLANS_CONFIG.annualDiscountPercent,
      kobansPerPkr: DEFAULT_PLANS_CONFIG.kobansPerPkr,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const posInt = (val: unknown, fallback: number): number => {
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  };

  const discountRaw = Number(raw.annualDiscountPercent ?? raw.annualDiscountPct);
  const annualDiscountPercent =
    Number.isFinite(discountRaw) && discountRaw >= 0 && discountRaw <= 90
      ? Math.round(discountRaw)
      : DEFAULT_PLANS_CONFIG.annualDiscountPercent;

  const kobansPerPkr = posInt(raw.kobansPerPkr, DEFAULT_PLANS_CONFIG.kobansPerPkr);

  const proMonthlyPkr = posInt(
    raw.pro?.pricePkrMonthly ?? raw.pro?.pricePkr ?? raw.proPricePkrMonthly,
    DEFAULT_PLANS_CONFIG.pro.pricePkrMonthly
  );
  const proMonthlyKobans = posInt(
    raw.pro?.priceKobansMonthly ?? raw.pro?.priceKobans ?? raw.proPriceKobansMonthly,
    proMonthlyPkr * kobansPerPkr
  );
  const proAiCredits = posInt(
    raw.pro?.aiCreditsPerDay ?? raw.proAiCreditsPerDay,
    DEFAULT_PLANS_CONFIG.pro.aiCreditsPerDay
  );

  const plusMonthlyPkr = posInt(
    raw.plus?.pricePkrMonthly ?? raw.plus?.pricePkr ?? raw.plusPricePkrMonthly,
    DEFAULT_PLANS_CONFIG.plus.pricePkrMonthly
  );
  const plusMonthlyKobans = posInt(
    raw.plus?.priceKobansMonthly ?? raw.plus?.priceKobans ?? raw.plusPriceKobansMonthly,
    plusMonthlyPkr * kobansPerPkr
  );
  const plusAiCredits = posInt(
    raw.plus?.aiCreditsPerDay ?? raw.plusAiCreditsPerDay,
    DEFAULT_PLANS_CONFIG.plus.aiCreditsPerDay
  );

  const freeAiCredits = posInt(
    raw.free?.aiCreditsPerDay ?? raw.freeAiCreditsPerDay,
    DEFAULT_PLANS_CONFIG.free.aiCreditsPerDay
  );

  return {
    free: {
      aiCreditsPerDay: freeAiCredits,
    },
    pro: {
      pricePkrMonthly: proMonthlyPkr,
      priceKobansMonthly: proMonthlyKobans,
      aiCreditsPerDay: proAiCredits,
    },
    plus: {
      pricePkrMonthly: plusMonthlyPkr,
      priceKobansMonthly: plusMonthlyKobans,
      aiCreditsPerDay: plusAiCredits,
    },
    annualDiscountPercent,
    kobansPerPkr,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : null,
  };
}

/**
 * Human-readable display label for a plan tier.
 */
export function getPlanDisplayName(plan: PlanTier | string | null | undefined): string {
  const tier = normalizePlanTier(plan);
  if (tier === 'plus') return 'Boardly Plus';
  if (tier === 'pro') return 'Boardly Pro';
  return 'Free';
}
