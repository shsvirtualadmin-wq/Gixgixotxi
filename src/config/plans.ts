/**
 * Single source of truth for Boardly Pro & Boardly Plus plans, pricing, Koban conversion rate,
 * expiry extension math, Pro-to-Plus upgrade credit math, and refund policy text.
 *
 * Used across:
 * - /dashboard/plan & /dashboard/plans (PlansBillingPage)
 * - /store (StorePage Membership tab)
 * - ProCheckoutSheet (Koban & PKR checkout)
 * - proSubscriptionService & adminService
 * - Transactional emails (/api/send-email & emailTemplates)
 * - Server & Cloudflare Workers (/api/pro/status, /api/pro/purchase-guard, /api/economy)
 */

import {
  DEFAULT_PLANS_CONFIG,
  PKT_OFFSET_MS,
  PLUS_ALREADY_INCLUDES_PRO_MSG,
  calculatePlanExpiryPkt,
  computeAnnualPrice,
  computeProToPlusCreditDays,
  formatPktDateLabel,
  getBillingFromPlanId,
  getPktCalendarDaysLeft,
  getPktDateParts,
  getPlan,
  getPlanTierFromPlanId,
  normalizePlansConfig,
  parsePlanExpiryMs,
  pktEndOfDayMs,
  planRank,
  type CalculatePlanExpiryInput,
  type CalculatePlanExpiryResult,
  type PaidPlanId,
  type PlanTier,
  type PlansConfigDoc,
} from '../lib/planTier';

export {
  PKT_OFFSET_MS,
  PLUS_ALREADY_INCLUDES_PRO_MSG,
  calculatePlanExpiryPkt,
  computeAnnualPrice,
  computeProToPlusCreditDays,
  formatPktDateLabel,
  getPktCalendarDaysLeft,
  getPktDateParts,
  pktEndOfDayMs,
};
export type {
  CalculatePlanExpiryInput,
  CalculatePlanExpiryResult,
  PaidPlanId,
  PlanTier,
  PlansConfigDoc,
};

export const KOBANS_PER_PKR = DEFAULT_PLANS_CONFIG.kobansPerPkr;

export const REFUND_POLICY_TEXT =
  'All Pro, Plus and Premium purchases are final and non-refundable once submitted or activated (zero refunds).';

export type ProPlanId = PaidPlanId;
export type AnyPlanId = 'free' | PaidPlanId | 'crew';

export interface ProPlanConfig {
  id: PaidPlanId;
  tier: 'pro' | 'plus';
  slug: 'monthly' | 'annual';
  name: string;
  shortName: string;
  duration_days: number;
  price_pkr: number;
  price_kobans: number;
  regular_price_pkr?: number;
  regular_price_kobans?: number;
  ai_credits_per_day: number;
  cadenceLabel: string;
  description: string;
  badge?: string;
  features: string[];
}

export interface BasePlanDisplayConfig {
  id: 'free' | 'crew';
  name: string;
  shortName: string;
  duration_days: number;
  price_pkr: number;
  price_kobans: number;
  cadenceLabel: string;
  description: string;
  features: string[];
}

export interface PlansCatalog {
  free: BasePlanDisplayConfig;
  pro_monthly: ProPlanConfig;
  pro_annual: ProPlanConfig;
  plus_monthly: ProPlanConfig;
  plus_annual: ProPlanConfig;
  crew: BasePlanDisplayConfig;
}

export const ANNUAL_SAVINGS_PERCENT = DEFAULT_PLANS_CONFIG.annualDiscountPercent;
export const ANNUAL_SAVINGS_BADGE = `Save ${ANNUAL_SAVINGS_PERCENT}%`;

/**
 * Builds the complete Plans catalog dynamically from `config/plans` (falling back to built-in defaults).
 */
export function buildPlansCatalog(rawConfig?: Partial<PlansConfigDoc> | null): PlansCatalog {
  const cfg = normalizePlansConfig(rawConfig as Record<string, any> | null);
  const discount = cfg.annualDiscountPercent;
  const savingsBadge = `Save ${discount}%`;

  const proMonthlyPkr = cfg.pro.pricePkrMonthly;
  const proMonthlyKobans = cfg.pro.priceKobansMonthly;
  const proAnnualRegularPkr = proMonthlyPkr * 12;
  const proAnnualPkr = computeAnnualPrice(proMonthlyPkr, discount);
  const proAnnualRegularKobans = proMonthlyKobans * 12;
  const proAnnualKobans = computeAnnualPrice(proMonthlyKobans, discount);

  const plusMonthlyPkr = cfg.plus.pricePkrMonthly;
  const plusMonthlyKobans = cfg.plus.priceKobansMonthly;
  const plusAnnualRegularPkr = plusMonthlyPkr * 12;
  const plusAnnualPkr = computeAnnualPrice(plusMonthlyPkr, discount);
  const plusAnnualRegularKobans = plusMonthlyKobans * 12;
  const plusAnnualKobans = computeAnnualPrice(plusMonthlyKobans, discount);

  return {
    free: {
      id: 'free',
      name: 'Free Tier',
      shortName: 'Starter Scholar',
      duration_days: 0,
      price_pkr: 0,
      price_kobans: 0,
      cadenceLabel: '/ forever',
      description: 'Essential daily practice and full access to Boardly Commons study materials.',
      features: [
        '2 Practice Tests per day (10 questions/test)',
        '3 Arena Grand National Mocks per day',
        '5 Boardly AI step derivations per day',
        `${cfg.free.aiCreditsPerDay} AI Mentor credits per day (Quick & Balanced)`,
        'Unlimited access to Boardly Commons PDFs',
        'Daily study streak tracking (PKT midnight reset)',
      ],
    },
    pro_monthly: {
      id: 'pro_monthly',
      tier: 'pro',
      slug: 'monthly',
      name: 'Boardly Pro, Monthly Pass',
      shortName: 'Monthly Pass',
      duration_days: 30,
      price_pkr: proMonthlyPkr,
      price_kobans: proMonthlyKobans,
      ai_credits_per_day: cfg.pro.aiCreditsPerDay,
      cadenceLabel: '/ month',
      description: 'Full 30-day access to unlimited mock tests, AI derivations, and deep analytics.',
      badge: 'POPULAR',
      features: [
        'Unlimited Practice Tests & Sprints',
        'Unlimited Arena Grand National Mocks',
        'Unlimited Boardly AI Derivations',
        `${cfg.pro.aiCreditsPerDay} AI Mentor credits per day with Deep & Max thinking`,
        'FAST-NUCES Negative Marking Optimizer',
        'Comprehensive Mistakes & Topic Breakdown',
        'Ad-free experience',
      ],
    },
    pro_annual: {
      id: 'pro_annual',
      tier: 'pro',
      slug: 'annual',
      name: 'Boardly Pro, Annual Pass',
      shortName: 'Annual Pass',
      duration_days: 365,
      price_pkr: proAnnualPkr,
      price_kobans: proAnnualKobans,
      regular_price_pkr: proAnnualRegularPkr,
      regular_price_kobans: proAnnualRegularKobans,
      ai_credits_per_day: cfg.pro.aiCreditsPerDay,
      cadenceLabel: '/ year',
      description: `365 days of uninterrupted Boardly Pro access (${savingsBadge} vs monthly).`,
      badge: `Popular · ${savingsBadge}`,
      features: [
        'Everything in Monthly Pass for 365 days',
        `${cfg.pro.aiCreditsPerDay} AI Mentor credits per day with Deep & Max thinking`,
        'Unlimited MDCAT, NET, ECAT & FSc full-length mocks',
        'Priority support & exam session archives',
        'Detailed topic accuracy & weakness tracking',
        'Pro Scholar badge next to your name across Boardly',
        'Ad-free experience',
      ],
    },
    plus_monthly: {
      id: 'plus_monthly',
      tier: 'plus',
      slug: 'monthly',
      name: 'Boardly Plus, Monthly Pass',
      shortName: 'Monthly Pass',
      duration_days: 30,
      price_pkr: plusMonthlyPkr,
      price_kobans: plusMonthlyKobans,
      ai_credits_per_day: cfg.plus.aiCreditsPerDay,
      cadenceLabel: '/ month',
      description: 'Everything in Boardly Pro with 2x daily AI Mentor credits and Plus status.',
      badge: 'Best value',
      features: [
        'Everything in Boardly Pro',
        `${cfg.plus.aiCreditsPerDay} AI Mentor credits per day (2x Pro)`,
        'Deep & Max AI thinking',
        'Plus badge next to your name',
        'Ad-free experience',
      ],
    },
    plus_annual: {
      id: 'plus_annual',
      tier: 'plus',
      slug: 'annual',
      name: 'Boardly Plus, Annual Pass',
      shortName: 'Annual Pass',
      duration_days: 365,
      price_pkr: plusAnnualPkr,
      price_kobans: plusAnnualKobans,
      regular_price_pkr: plusAnnualRegularPkr,
      regular_price_kobans: plusAnnualRegularKobans,
      ai_credits_per_day: cfg.plus.aiCreditsPerDay,
      cadenceLabel: '/ year',
      description: `365 days of Boardly Plus with 2x daily AI Mentor credits (${savingsBadge} vs monthly).`,
      badge: `Best value · ${savingsBadge}`,
      features: [
        'Everything in Boardly Pro',
        `${cfg.plus.aiCreditsPerDay} AI Mentor credits per day (2x Pro)`,
        'Deep & Max AI thinking',
        'Plus badge next to your name',
        'Ad-free experience',
      ],
    },
    crew: {
      id: 'crew',
      name: 'Nakama Crew',
      shortName: 'Campus Study Squad',
      duration_days: 0,
      price_pkr: 0,
      price_kobans: 0,
      cadenceLabel: '/ squad',
      description: 'Form or join a study squad of up to 30 classmates to compete and practice together.',
      features: [
        'Up to 30 classmates per private Study Crew',
        'Shared squad leaderboards & solve-time rankings',
        'Crew-wide custom practice challenges',
        'Whole squad uses the best plan in the crew',
        'Bonus referral & milestone Koban rewards',
        'Eligible for Large Crew Pass upgrades',
      ],
    },
  };
}

export const PLANS: PlansCatalog = buildPlansCatalog(DEFAULT_PLANS_CONFIG);

export const PLANS_LIST: readonly ProPlanConfig[] = [
  PLANS.pro_monthly,
  PLANS.pro_annual,
  PLANS.plus_monthly,
  PLANS.plus_annual,
];

export interface PlanComparisonRow {
  feature: string;
  free: string;
  pro: string;
  plus: string;
  crew: string;
}

export function buildPlanComparisonRows(
  rawConfig?: Partial<PlansConfigDoc> | null
): PlanComparisonRow[] {
  const cfg = normalizePlansConfig(rawConfig as Record<string, any> | null);
  return [
    {
      feature: 'Daily Practice Tests',
      free: '2 / day (10 Qs)',
      pro: 'Unlimited',
      plus: 'Unlimited',
      crew: 'Squad Shared',
    },
    {
      feature: 'Arena & Grand Line Mocks',
      free: '3 / day',
      pro: 'Unlimited',
      plus: 'Unlimited',
      crew: 'Squad Ranked',
    },
    {
      feature: 'Boardly AI Derivations',
      free: '5 / day',
      pro: 'Unlimited',
      plus: 'Unlimited',
      crew: 'Best plan in squad',
    },
    {
      feature: 'Boardly AI Mentors',
      free: `${cfg.free.aiCreditsPerDay} credits / day · Quick & Balanced`,
      pro: `${cfg.pro.aiCreditsPerDay} credits / day · Deep & Max`,
      plus: `${cfg.plus.aiCreditsPerDay} credits / day · Deep & Max`,
      crew: 'Best plan in squad',
    },
    {
      feature: 'Accuracy & Weak-Topic Analytics',
      free: 'Basic',
      pro: 'Full Diagnostics',
      plus: 'Full Diagnostics',
      crew: 'Squad Leaderboard',
    },
    {
      feature: 'Name Badge & Cosmetics',
      free: 'Standard',
      pro: 'Pro badge & Kobans',
      plus: 'Plus badge & Kobans',
      crew: 'Crew Tag',
    },
    {
      feature: 'Ad-free experience',
      free: 'Ad-supported',
      pro: 'Ad-free experience',
      plus: 'Ad-free experience',
      crew: 'Best plan in squad',
    },
  ];
}

export const PLAN_COMPARISON_ROWS: ReadonlyArray<PlanComparisonRow> =
  buildPlanComparisonRows(DEFAULT_PLANS_CONFIG);

export const PRO_HIGHLIGHT_BULLETS: ReadonlyArray<{
  title: string;
  description: string;
}> = [
  {
    title: 'Unlimited Mock Tests & Sprints',
    description: 'Practice MDCAT, NUST NET, FAST, ECAT & FSc sets with zero daily caps.',
  },
  {
    title: 'Unlimited AI Step Derivations',
    description: 'Get instant KaTeX formula walkthroughs and trap analysis from Boardly AI.',
  },
  {
    title: 'Deep Topic & Speed Analytics',
    description: 'Pinpoint weak chapters, negative-marking risk, and per-subject accuracy.',
  },
  {
    title: 'Pro & Plus Badges + Priority',
    description: 'Stand out on Commons and national leaderboards with Pro or Plus Scholar badges.',
  },
];

export function buildPlanFaqItems(rawConfig?: Partial<PlansConfigDoc> | null): ReadonlyArray<{
  question: string;
  answer: string;
}> {
  const catalog = buildPlansCatalog(rawConfig);
  return [
    {
      question: 'How do I pay?',
      answer: `You can redeem your Koban wallet instantly (${catalog.pro_monthly.price_kobans.toLocaleString()} Kobans for Pro Monthly or ${catalog.plus_monthly.price_kobans.toLocaleString()} Kobans for Plus Monthly), or transfer via JazzCash / Opay and submit your payment proof (Transaction ID / TID).`,
    },
    {
      question: 'What happens if I upgrade from Pro to Plus?',
      answer:
        'Boardly Plus activates as soon as your payment is approved (or instantly with Kobans). Your new Plus pass starts from today for the exact number of days purchased (30 monthly or 365 annual) and replaces your active Pro pass.',
    },
    {
      question: 'When does my plan activate & what is the refund policy?',
      answer:
        'Koban redemptions activate instantly. Manual JazzCash/Opay payments are verified within 24 hours. All Pro, Plus and Premium purchases are final and non-refundable once submitted or activated (zero refunds).',
    },
    {
      question: 'What happens when Pro or Plus expires?',
      answer:
        'Your account smoothly returns to the Free tier with all your test history, streaks, and cosmetics preserved. Renewing Plus while Plus is active adds the new days directly onto your current expiry date.',
    },
  ];
}

export const PRO_FAQ_ITEMS = buildPlanFaqItems(DEFAULT_PLANS_CONFIG);

/**
 * Resolves any plan identifier ('pro_monthly', 'pro_annual', 'plus_monthly', 'plus_annual', 'monthly', 'annual', 'plus')
 * to the canonical ProPlanConfig from the live (or default) catalog.
 */
export function getProPlanById(
  rawId?: string | null,
  rawConfig?: Partial<PlansConfigDoc> | null
): ProPlanConfig {
  const catalog = rawConfig ? buildPlansCatalog(rawConfig) : PLANS;
  const clean = String(rawId || '')
    .trim()
    .toLowerCase();

  const isPlusId = clean.startsWith('plus') || clean === 'boardly_plus';
  const isAnnualId =
    clean.includes('annual') || clean.includes('year') || clean === '365';

  if (isPlusId) {
    return isAnnualId ? catalog.plus_annual : catalog.plus_monthly;
  }
  return isAnnualId ? catalog.pro_annual : catalog.pro_monthly;
}

export const getPlanById = getProPlanById;

/**
 * Safely parses any Firestore Timestamp, REST timestampValue, number (seconds or ms),
 * Date, or ISO string into epoch milliseconds.
 */
export function parseExpiryMillis(expiryRaw: unknown): number | null {
  return parsePlanExpiryMs(expiryRaw);
}

/**
 * Formats an expiry date in clean human-readable format, e.g. "12 Dec 2026".
 */
export function formatProExpiryDate(msOrDate: number | Date): string {
  const date = typeof msOrDate === 'number' ? new Date(msOrDate) : msOrDate;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a timestamp with date and time in PKT, e.g. "12 Dec 2026, 4:30 PM PKT".
 */
export function formatProDateTime(msOrDate: number | Date): string {
  const date = typeof msOrDate === 'number' ? new Date(msOrDate) : msOrDate;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return (
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' PKT'
  );
}

/**
 * Formats remaining time between nowMs and expiryMs, e.g. "29 days, 14 hours left" or "18 hours left".
 */
export function formatProTimeLeft(expiryMs: number, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, expiryMs - nowMs);
  if (diffMs <= 0) return 'Expired';
  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.max(1, Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000)));

  if (days >= 1) {
    if (hours > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
    }
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  }
  if (totalHours >= 1) {
    return `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}, ${minutes} min left`;
  }
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
}

export type UnifiedPlanState = 'none' | 'pending' | 'active';

export interface PendingProPaymentInfo {
  id: string;
  planId: PaidPlanId;
  planTier: 'pro' | 'plus';
  billing: 'monthly' | 'annual';
  planName: string;
  amountPkr: number;
  method: string;
  tid: string;
  submittedAtMs: number | null;
  submittedFormatted: string;
}

export interface UnifiedPlanStatusResult {
  state: UnifiedPlanState; // 'none' | 'pending' | 'active'
  planTier: PlanTier; // 'free' | 'pro' | 'plus'
  isPro: boolean; // true for Pro, Plus, Crew Pro/Plus, Superadmin (backward compat: hasAtLeast('pro'))
  isPlus: boolean; // true for Plus, Crew Plus, Superadmin
  isPaid: boolean; // true for Pro or Plus (personal, crew, or Superadmin)
  isPersonalPro: boolean; // true for personal Pro OR personal Plus
  isPersonalPlus: boolean; // true strictly for personal Plus
  isSuperAdmin: boolean;
  isCrewPro: boolean;
  isCrewPlus: boolean;
  crewPlanTier: PlanTier;
  planId: PaidPlanId | null;
  planName: string;
  startMs: number | null;
  startFormatted: string | null;
  expiryMs: number | null;
  expiryFormatted: string | null;
  expiryDateTimeFormatted: string | null;
  daysLeft: number;
  timeLeftLabel: string | null;
  pendingRequest: PendingProPaymentInfo | null;
  canStartPurchase: boolean;
  canUpgradeToPlus: boolean;
  canRenewPlus: boolean;
  proToPlusCreditDays: number;
  blockReason: string | null;
}

/**
 * Checks if purchasing `targetPlanId` is allowed given a resolved UnifiedPlanStatusResult.
 * - Pending payment -> blocked.
 * - Active Plus buying Pro -> blocked with exact message: "You already have Plus, which includes Pro".
 * - Active Plus buying Plus -> allowed (extends Plus).
 * - Active Pro buying Pro -> blocked (already on Pro).
 * - Active Pro buying Plus -> allowed (upgrades to Plus + credits unused Pro days).
 * - Free -> allowed for both Pro and Plus.
 */
export function evaluatePlanPurchaseEligibility(
  status: UnifiedPlanStatusResult,
  targetPlanId: PaidPlanId | string,
  _config?: Partial<PlansConfigDoc> | null
): {
  allowed: boolean;
  reason: string | null;
  isUpgradeFromProToPlus: boolean;
  isPlusRenewal: boolean;
  extraPlusDays: number;
} {
  const targetTier = getPlanTierFromPlanId(targetPlanId);

  if (status.isSuperAdmin) {
    return {
      allowed: false,
      reason: 'You already have unlimited Superadmin access.',
      isUpgradeFromProToPlus: false,
      isPlusRenewal: false,
      extraPlusDays: 0,
    };
  }

  if (status.state === 'pending' && status.pendingRequest) {
    return {
      allowed: false,
      reason:
        'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while your payment is awaiting verification.',
      isUpgradeFromProToPlus: false,
      isPlusRenewal: false,
      extraPlusDays: 0,
    };
  }

  if (status.isPersonalPlus) {
    if (targetTier === 'pro') {
      return {
        allowed: false,
        reason: PLUS_ALREADY_INCLUDES_PRO_MSG,
        isUpgradeFromProToPlus: false,
        isPlusRenewal: false,
        extraPlusDays: 0,
      };
    }
    return {
      allowed: true,
      reason: null,
      isUpgradeFromProToPlus: false,
      isPlusRenewal: true,
      extraPlusDays: 0,
    };
  }

  if (status.isPersonalPro) {
    if (targetTier === 'plus') {
      return {
        allowed: true,
        reason: null,
        isUpgradeFromProToPlus: true,
        isPlusRenewal: false,
        extraPlusDays: 0,
      };
    }
    return {
      allowed: false,
      reason:
        status.blockReason ||
        `You already have Boardly Pro active until ${status.expiryFormatted || 'your current expiry'}.`,
      isUpgradeFromProToPlus: false,
      isPlusRenewal: false,
      extraPlusDays: 0,
    };
  }

  if (!status.canStartPurchase) {
    return {
      allowed: false,
      reason: status.blockReason || 'Please sign in to a registered account to purchase a plan.',
      isUpgradeFromProToPlus: false,
      isPlusRenewal: false,
      extraPlusDays: 0,
    };
  }

  return {
    allowed: true,
    reason: null,
    isUpgradeFromProToPlus: false,
    isPlusRenewal: false,
    extraPlusDays: 0,
  };
}

/**
 * ONE shared plan-status function used across:
 * - Upgrade / Pricing screens (/dashboard/plan, /dashboard/plans, /store, /pricing, ProCheckoutSheet)
 * - Header plan chip (DashboardTopBar, DashboardSidebar, HamburgerMenuSheet)
 * - "Current plan" card (StatusBanner)
 * - Feature / reward checks (useEffectivePlan)
 * - Server & Worker endpoints (/api/pro/status, /api/pro/purchase-guard)
 */
export function resolveUnifiedPlanStatus(input: {
  uid?: string | null;
  email?: string | null;
  role?: string | null;
  isGuest?: boolean;
  plan?: string | null;
  planTier?: string | null;
  isPro?: boolean | null;
  isPlus?: boolean | null;
  isPremium?: boolean | null;
  proPlanId?: string | null;
  plusPlanId?: string | null;
  planStartedAt?: unknown;
  updatedAt?: unknown;
  proUntil?: unknown;
  plusUntil?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
  pendingRequests?: Array<Record<string, any>> | null;
  isCrewPro?: boolean;
  isCrewPlus?: boolean;
  crewPlanTier?: PlanTier;
  crewName?: string | null;
  isSuperAdmin?: boolean;
  plansConfig?: Partial<PlansConfigDoc> | null;
  nowMs?: number;
}): UnifiedPlanStatusResult {
  const nowMs =
    typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const isGuest = Boolean(input.isGuest || (input.uid && String(input.uid).startsWith('guest_')));
  const isSuperAdmin = Boolean(input.isSuperAdmin === true);
  const cfg = normalizePlansConfig(input.plansConfig as Record<string, any> | null);
  const catalog = buildPlansCatalog(cfg);

  const crewPlanTier: PlanTier = isGuest
    ? 'free'
    : input.crewPlanTier
      ? input.crewPlanTier
      : input.isCrewPlus
        ? 'plus'
        : input.isCrewPro
          ? 'pro'
          : 'free';
  const isCrewPlus = crewPlanTier === 'plus';
  const isCrewPro = planRank(crewPlanTier) >= 1;

  // Parse expiry from plusUntil / planExpiresAt / premiumExpiresAt / proUntil
  const expCandidates = [
    parseExpiryMillis(input.plusUntil),
    parseExpiryMillis(input.planExpiresAt),
    parseExpiryMillis(input.premiumExpiresAt),
    parseExpiryMillis(input.proUntil),
  ].filter((v): v is number => v !== null);
  const expiryMs = expCandidates.length > 0 ? Math.max(...expCandidates) : null;
  const hasFutureExpiry = expiryMs !== null && expiryMs > nowMs;

  // Determine personal plan tier using the ONE shared getPlan helper (excluding Superadmin for personal record inspection)
  const personalPlanTier: PlanTier = isGuest
    ? 'free'
    : getPlan(
        {
          uid: input.uid,
          email: input.email,
          role: 'student',
          isGuest,
          isSuperAdmin: false,
          isSuperAdminClaim: false,
          plan: input.plan,
          planTier: input.planTier,
          isPro: input.isPro,
          isPlus: input.isPlus,
          isPremium: input.isPremium,
          proPlanId: input.proPlanId,
          plusPlanId: input.plusPlanId,
          proUntil: input.proUntil,
          plusUntil: input.plusUntil,
          planExpiresAt: input.planExpiresAt,
          premiumExpiresAt: input.premiumExpiresAt,
        },
        nowMs
      );

  const rawPlanId = String(input.plusPlanId || input.proPlanId || input.plan || '')
    .trim()
    .toLowerCase();
  const durationHintDays =
    hasFutureExpiry && expiryMs ? Math.ceil((expiryMs - nowMs) / (24 * 60 * 60 * 1000)) : 0;
  const isAnnual = rawPlanId.includes('annual') || rawPlanId.includes('year') || durationHintDays > 45;

  const resolvedPlanConfig =
    personalPlanTier === 'plus'
      ? isAnnual
        ? catalog.plus_annual
        : catalog.plus_monthly
      : isAnnual
        ? catalog.pro_annual
        : catalog.pro_monthly;

  const startRaw = parseExpiryMillis(input.planStartedAt ?? input.updatedAt);
  const estimatedStartMs =
    startRaw ??
    (hasFutureExpiry && expiryMs
      ? expiryMs - resolvedPlanConfig.duration_days * 24 * 60 * 60 * 1000
      : null);

  // Check pending requests first so an active Pro user who submitted a Plus upgrade sees pending status
  const rawReqs = Array.isArray(input.pendingRequests) ? input.pendingRequests : [];
  const pendingDoc = rawReqs.find((r) => {
    if (!r || typeof r !== 'object') return false;
    const st = String(r.status || '').trim().toLowerCase();
    const pl = String(r.plan || '').trim().toLowerCase();
    return st === 'pending' && pl !== 'large_crew' && !r.crewId;
  });

  let pendingInfo: PendingProPaymentInfo | null = null;
  if (!isGuest && pendingDoc) {
    const pConfig = getProPlanById(pendingDoc.plan || pendingDoc.planId, cfg);
    const submittedMs = parseExpiryMillis(
      pendingDoc.createdAt ?? pendingDoc.submittedAt ?? pendingDoc.timestamp
    );
    const submittedFormatted = submittedMs ? formatProDateTime(submittedMs) : 'Recently submitted';
    pendingInfo = {
      id: String(pendingDoc.id || ''),
      planId: pConfig.id,
      planTier: getPlanTierFromPlanId(pConfig.id),
      billing: getBillingFromPlanId(pConfig.id),
      planName: String(pendingDoc.planName || pConfig.name),
      amountPkr: Number(pendingDoc.amount_pkr ?? pendingDoc.amount ?? pConfig.price_pkr),
      method: String(pendingDoc.method || 'jazzcash'),
      tid: String(pendingDoc.TID || pendingDoc.transactionId || ''),
      submittedAtMs: submittedMs,
      submittedFormatted,
    };
  }

  // 1. Personal active Plus or Pro
  if (!isGuest && (personalPlanTier === 'plus' || personalPlanTier === 'pro')) {
    const effectiveTier: PlanTier =
      planRank(crewPlanTier) > planRank(personalPlanTier) ? crewPlanTier : personalPlanTier;
    const isPersonalPlus = personalPlanTier === 'plus';
    const daysLeft =
      hasFutureExpiry && expiryMs !== null
        ? getPktCalendarDaysLeft(expiryMs, nowMs)
        : resolvedPlanConfig.duration_days;
    const expiryFormatted =
      hasFutureExpiry && expiryMs !== null
        ? formatProExpiryDate(expiryMs)
        : 'Active (No expiry date set)';
    const expiryDateTimeFormatted =
      hasFutureExpiry && expiryMs !== null
        ? formatProDateTime(expiryMs)
        : 'Active (No expiry date set)';
    const timeLeftLabel =
      hasFutureExpiry && expiryMs !== null
        ? formatProTimeLeft(expiryMs, nowMs)
        : isPersonalPlus
          ? 'Active Plus membership'
          : 'Active Pro membership';

    const proToPlusCreditDays = 0;

    return {
      state: pendingInfo ? 'pending' : 'active',
      planTier: isSuperAdmin ? 'plus' : effectiveTier,
      isPro: true,
      isPlus: isSuperAdmin || isPersonalPlus || isCrewPlus,
      isPaid: true,
      isPersonalPro: true,
      isPersonalPlus,
      isSuperAdmin,
      isCrewPro: !isPersonalPlus && isCrewPro,
      isCrewPlus: !isPersonalPlus && isCrewPlus,
      crewPlanTier,
      planId: resolvedPlanConfig.id,
      planName: resolvedPlanConfig.name,
      startMs: estimatedStartMs,
      startFormatted: estimatedStartMs ? formatProExpiryDate(estimatedStartMs) : null,
      expiryMs: hasFutureExpiry ? expiryMs : null,
      expiryFormatted,
      expiryDateTimeFormatted,
      daysLeft,
      timeLeftLabel,
      pendingRequest: pendingInfo,
      // Pro users CAN upgrade to Plus; Plus users CAN renew Plus (unless pending payment exists)
      canStartPurchase: !pendingInfo && !isSuperAdmin,
      canUpgradeToPlus: !pendingInfo && !isPersonalPlus && !isSuperAdmin,
      canRenewPlus: !pendingInfo && isPersonalPlus && !isSuperAdmin,
      proToPlusCreditDays,
      blockReason: pendingInfo
        ? 'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while your payment is awaiting verification.'
        : isPersonalPlus
          ? PLUS_ALREADY_INCLUDES_PRO_MSG
          : `You already have Boardly Pro (${resolvedPlanConfig.name}) active until ${expiryFormatted}. Upgrading to Boardly Plus starts a fresh Plus pass from today and replaces your Pro pass.`,
    };
  }

  // 2. Superadmin without explicit personal expiry -> always Plus / highest access
  if (!isGuest && isSuperAdmin) {
    return {
      state: 'active',
      planTier: 'plus',
      isPro: true,
      isPlus: true,
      isPaid: true,
      isPersonalPro: true,
      isPersonalPlus: true,
      isSuperAdmin: true,
      isCrewPro: false,
      isCrewPlus: false,
      crewPlanTier: 'free',
      planId: 'plus_annual',
      planName: 'Boardly Plus (Administrator Access)',
      startMs: null,
      startFormatted: null,
      expiryMs: null,
      expiryFormatted: 'Unlimited',
      expiryDateTimeFormatted: 'Unlimited',
      daysLeft: 365,
      timeLeftLabel: 'Unlimited administrator access',
      pendingRequest: null,
      canStartPurchase: false,
      canUpgradeToPlus: false,
      canRenewPlus: false,
      proToPlusCreditDays: 0,
      blockReason: 'You already have active Boardly Plus administrator access.',
    };
  }

  // 3. Pending payment verification (for Free user)
  if (!isGuest && pendingInfo) {
    return {
      state: 'pending',
      planTier: crewPlanTier,
      isPro: isCrewPro,
      isPlus: isCrewPlus,
      isPaid: isCrewPro,
      isPersonalPro: false,
      isPersonalPlus: false,
      isSuperAdmin: false,
      isCrewPro,
      isCrewPlus,
      crewPlanTier,
      planId: pendingInfo.planId,
      planName: pendingInfo.planName,
      startMs: null,
      startFormatted: null,
      expiryMs: null,
      expiryFormatted: null,
      expiryDateTimeFormatted: null,
      daysLeft: 0,
      timeLeftLabel: null,
      pendingRequest: pendingInfo,
      canStartPurchase: false,
      canUpgradeToPlus: false,
      canRenewPlus: false,
      proToPlusCreditDays: 0,
      blockReason:
        'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while your payment is awaiting verification.',
    };
  }

  // 4. Free (or expired personal Pro/Plus; note expired Plus drops directly to Free)
  const crewLabel = isCrewPlus
    ? `${input.crewName || 'Study Crew'} Shared Plus`
    : isCrewPro
      ? `${input.crewName || 'Study Crew'} Shared Pro`
      : catalog.free.name;

  return {
    state: 'none',
    planTier: crewPlanTier,
    isPro: isCrewPro,
    isPlus: isCrewPlus,
    isPaid: isCrewPro,
    isPersonalPro: false,
    isPersonalPlus: false,
    isSuperAdmin: false,
    isCrewPro,
    isCrewPlus,
    crewPlanTier,
    planId: null,
    planName: crewLabel,
    startMs: null,
    startFormatted: null,
    expiryMs: expiryMs && expiryMs <= nowMs ? expiryMs : null,
    expiryFormatted: expiryMs && expiryMs <= nowMs ? formatProExpiryDate(expiryMs) : null,
    expiryDateTimeFormatted: expiryMs && expiryMs <= nowMs ? formatProDateTime(expiryMs) : null,
    daysLeft: 0,
    timeLeftLabel: null,
    pendingRequest: null,
    canStartPurchase: !isGuest,
    canUpgradeToPlus: !isGuest,
    canRenewPlus: false,
    proToPlusCreditDays: 0,
    blockReason: isGuest ? 'Create a registered account to upgrade to Boardly Pro or Plus.' : null,
  };
}

/**
 * Legacy wrapper around the ONE canonical `calculatePlanExpiryPkt` function (PKT).
 * - When `startFromNowForUpgrade` is true (e.g., Pro -> Plus upgrade), starts fresh from `nowMs`
 *   in PKT without stacking or converting leftover days from another plan.
 * - Otherwise (same-tier extension or fresh purchase), computes `max(now, currentExpiry) + durationDays`
 *   to the end of that PKT calendar day.
 */
export function computeExtendedProExpiry(
  currentExpiryRaw: unknown,
  durationDays: number,
  nowMs: number = Date.now(),
  _extraCreditDays: number = 0,
  startFromNowForUpgrade: boolean = false
): {
  currentExpiryMs: number | null;
  previousExpiryMs: number | null;
  isCurrentlyActive: boolean;
  wasAlreadyActive: boolean;
  extraCreditDays: number;
  newExpiryMs: number;
  newExpiryDate: Date;
  currentExpiryFormatted: string | null;
  previousExpiryLabel: string | null;
  newExpiryFormatted: string;
  newExpiryLabel: string;
  daysRemainingAfter: number;
} {
  const calc = calculatePlanExpiryPkt({
    currentTier: startFromNowForUpgrade ? 'pro' : 'plus',
    targetTier: 'plus',
    currentExpiryRaw: startFromNowForUpgrade ? null : currentExpiryRaw,
    purchasedDays: durationDays,
    nowMs,
  });

  return {
    currentExpiryMs: calc.currentExpiryMs,
    previousExpiryMs: calc.previousExpiryMs,
    isCurrentlyActive: calc.isCurrentlyActive,
    wasAlreadyActive: calc.wasAlreadyActive,
    extraCreditDays: 0,
    newExpiryMs: calc.newExpiryMs,
    newExpiryDate: calc.newExpiryDate,
    currentExpiryFormatted: calc.currentExpiryFormatted,
    previousExpiryLabel: calc.previousExpiryLabel,
    newExpiryFormatted: calc.newExpiryFormatted,
    newExpiryLabel: calc.newExpiryLabel,
    daysRemainingAfter: calc.daysRemainingAfter,
  };
}

export interface ProStatusSummary {
  isActive: boolean;
  planTier: PlanTier;
  isPro: boolean;
  isPlus: boolean;
  isPaid: boolean;
  isPersonalPro: boolean;
  isPersonalPlus: boolean;
  isSuperAdmin: boolean;
  isCrewPro: boolean;
  isCrewPlus: boolean;
  crewName?: string;
  expiryMs: number | null;
  expiryFormatted: string | null;
  expiryDateLabel: string | null;
  daysLeft: number;
  timeLeftLabel: string | null;
  isExpiringSoon: boolean;
  statusText: string | null;
  statusBannerText: string;
}

/**
 * Computes a unified status summary used by the Store header, Membership tab, and Plans page.
 */
export function getProStatusSummary(
  inputOrRawExpiry: unknown,
  nowMs: number = Date.now()
): ProStatusSummary {
  const isConfigObj =
    Boolean(inputOrRawExpiry) &&
    typeof inputOrRawExpiry === 'object' &&
    !(inputOrRawExpiry instanceof Date) &&
    typeof (inputOrRawExpiry as any).toMillis !== 'function' &&
    typeof (inputOrRawExpiry as any).seconds !== 'number' &&
    typeof (inputOrRawExpiry as any)._seconds !== 'number' &&
    typeof (inputOrRawExpiry as any).timestampValue !== 'string' &&
    ('planExpiresAt' in (inputOrRawExpiry as Record<string, any>) ||
      'premiumExpiresAt' in (inputOrRawExpiry as Record<string, any>) ||
      'plusUntil' in (inputOrRawExpiry as Record<string, any>) ||
      'proUntil' in (inputOrRawExpiry as Record<string, any>) ||
      'isPro' in (inputOrRawExpiry as Record<string, any>) ||
      'isPlus' in (inputOrRawExpiry as Record<string, any>) ||
      'plan' in (inputOrRawExpiry as Record<string, any>) ||
      'isPremium' in (inputOrRawExpiry as Record<string, any>) ||
      'source' in (inputOrRawExpiry as Record<string, any>));

  const inputObj = isConfigObj ? (inputOrRawExpiry as Record<string, any>) : {};
  const rawExpiry = isConfigObj
    ? inputObj.plusUntil ?? inputObj.planExpiresAt ?? inputObj.premiumExpiresAt ?? inputObj.proUntil
    : inputOrRawExpiry;

  const unified = resolveUnifiedPlanStatus({
    uid: inputObj.uid,
    email: inputObj.email,
    role: inputObj.role,
    plan: inputObj.plan,
    planTier: inputObj.planTier,
    isPro: inputObj.isPro,
    isPlus: inputObj.isPlus,
    isPremium: inputObj.isPremium,
    proPlanId: inputObj.proPlanId,
    plusPlanId: inputObj.plusPlanId,
    plusUntil: isConfigObj ? inputObj.plusUntil : undefined,
    proUntil: isConfigObj ? inputObj.proUntil : undefined,
    planExpiresAt: rawExpiry,
    premiumExpiresAt: isConfigObj ? inputObj.premiumExpiresAt : rawExpiry,
    isSuperAdmin: Boolean(inputObj.isSuperAdmin || inputObj.source === 'superadmin'),
    isCrewPro: Boolean(inputObj.source === 'crew' || inputObj.isCrewPro),
    isCrewPlus: Boolean(inputObj.isCrewPlus || inputObj.crewPlanTier === 'plus'),
    crewPlanTier: inputObj.crewPlanTier,
    crewName: inputObj.crewName,
    nowMs,
  });

  const hasFutureExpiry = unified.expiryMs !== null && unified.expiryMs > nowMs;
  const isExpiringSoon = Boolean(hasFutureExpiry && unified.daysLeft <= 3);
  const tierLabel = unified.isPlus ? 'Plus' : 'Pro';

  const statusText =
    hasFutureExpiry && unified.expiryFormatted
      ? `${tierLabel} active until ${unified.expiryFormatted} (${unified.timeLeftLabel})`
      : null;

  let statusBannerText = 'Free Tier · 2 practice tests & 5 AI credits per day';
  if (unified.isSuperAdmin) {
    statusBannerText = 'Superadmin · Unlimited Plus access active';
  } else if (statusText) {
    statusBannerText = statusText;
  } else if (unified.isPersonalPlus) {
    statusBannerText = 'Boardly Plus active · Unlimited tests & 100 AI credits/day';
  } else if (unified.isPersonalPro) {
    statusBannerText = 'Boardly Pro active · Unlimited tests & 50 AI credits/day';
  } else if (unified.isCrewPlus) {
    statusBannerText = `Boardly Plus active via ${inputObj.crewName || 'Study Crew'}`;
  } else if (unified.isCrewPro) {
    statusBannerText = `Boardly Pro active via ${inputObj.crewName || 'Study Crew'}`;
  }

  return {
    isActive: unified.state === 'active',
    planTier: unified.planTier,
    isPro: unified.isPro,
    isPlus: unified.isPlus,
    isPaid: unified.isPaid,
    isPersonalPro: unified.isPersonalPro,
    isPersonalPlus: unified.isPersonalPlus,
    isSuperAdmin: unified.isSuperAdmin,
    isCrewPro: unified.isCrewPro,
    isCrewPlus: unified.isCrewPlus,
    crewName: inputObj.crewName,
    expiryMs: unified.expiryMs,
    expiryFormatted: unified.expiryFormatted,
    expiryDateLabel: unified.expiryFormatted,
    daysLeft: unified.daysLeft,
    timeLeftLabel: unified.timeLeftLabel,
    isExpiringSoon,
    statusText,
    statusBannerText,
  };
}
