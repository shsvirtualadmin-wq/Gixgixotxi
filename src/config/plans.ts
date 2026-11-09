/**
 * Single source of truth for Boardly Pro plans, pricing, Koban conversion rate,
 * expiry extension math, and refund policy text.
 *
 * Used across:
 * - /dashboard/plans (PlansBillingPage)
 * - /store (StorePage Boardly Pro tab)
 * - ProCheckoutSheet (Koban & PKR checkout)
 * - proSubscriptionService & adminService
 * - Transactional emails (/api/send-email & emailTemplates)
 */

export const KOBANS_PER_PKR = 10;

export const REFUND_POLICY_TEXT =
  'All Pro and Premium purchases are final and non-refundable once submitted or activated (zero refunds).';

export type ProPlanId = 'pro_monthly' | 'pro_annual';
export type AnyPlanId = 'free' | 'pro_monthly' | 'pro_annual' | 'crew';

export interface ProPlanConfig {
  id: ProPlanId;
  slug: 'monthly' | 'annual';
  name: string;
  shortName: string;
  duration_days: number;
  price_pkr: number;
  price_kobans: number;
  regular_price_pkr?: number;
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

const MONTHLY_PRICE_PKR = 199;
const ANNUAL_REGULAR_PRICE_PKR = MONTHLY_PRICE_PKR * 12; // PKR 2,388
const ANNUAL_PRICE_PKR = 1791; // 25% off 12 × PKR 199 = PKR 2,388

export const ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - ANNUAL_PRICE_PKR / ANNUAL_REGULAR_PRICE_PKR) * 100
);

export const ANNUAL_SAVINGS_BADGE = `Save ${ANNUAL_SAVINGS_PERCENT}%`;

export const PLANS: {
  free: BasePlanDisplayConfig;
  pro_monthly: ProPlanConfig;
  pro_annual: ProPlanConfig;
  crew: BasePlanDisplayConfig;
} = {
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
      '5 Boardy AI step derivations per day',
      'Unlimited access to Boardly Commons PDFs',
      'Daily study streak tracking (PKT midnight reset)',
    ],
  },
  pro_monthly: {
    id: 'pro_monthly',
    slug: 'monthly',
    name: 'Boardly Pro, Monthly Pass',
    shortName: 'Monthly Pass',
    duration_days: 30,
    price_pkr: MONTHLY_PRICE_PKR,
    price_kobans: MONTHLY_PRICE_PKR * KOBANS_PER_PKR, // 1,990 Kobans
    cadenceLabel: '/ month',
    description: 'Full 30-day access to unlimited mock tests, AI derivations, and deep analytics.',
    badge: 'POPULAR',
    features: [
      'Unlimited Practice Tests & Sprints',
      'Unlimited Arena Grand National Mocks',
      'Unlimited Boardy AI Derivations',
      'FAST-NUCES Negative Marking Optimizer',
      'Comprehensive Mistakes & Topic Breakdown',
    ],
  },
  pro_annual: {
    id: 'pro_annual',
    slug: 'annual',
    name: 'Boardly Pro, Annual Pass',
    shortName: 'Annual Pass',
    duration_days: 365,
    price_pkr: ANNUAL_PRICE_PKR,
    price_kobans: ANNUAL_PRICE_PKR * KOBANS_PER_PKR, // 17,910 Kobans
    regular_price_pkr: ANNUAL_REGULAR_PRICE_PKR,
    cadenceLabel: '/ year',
    description: `365 days of uninterrupted Boardly Pro access (${ANNUAL_SAVINGS_BADGE} vs monthly).`,
    badge: `Best value · ${ANNUAL_SAVINGS_BADGE}`,
    features: [
      'Everything in Monthly Pass for 365 days',
      'Unlimited MDCAT, NET, ECAT & FSc full-length mocks',
      'Priority support & exam session archives',
      'Detailed topic accuracy & weakness tracking',
      'Golden Pro Scholar crown badge across Boardly',
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
      'Bonus referral & milestone Koban rewards',
      'Eligible for Large Crew Pass upgrades',
    ],
  },
};

export const PLANS_LIST: readonly ProPlanConfig[] = [
  PLANS.pro_monthly,
  PLANS.pro_annual,
];

export const PLAN_COMPARISON_ROWS: ReadonlyArray<{
  feature: string;
  free: string;
  pro: string;
  crew: string;
}> = [
  {
    feature: 'Daily Practice Tests',
    free: '2 / day (10 Qs)',
    pro: 'Unlimited',
    crew: 'Squad Shared',
  },
  {
    feature: 'Arena & Grand Line Mocks',
    free: '3 / day',
    pro: 'Unlimited',
    crew: 'Squad Ranked',
  },
  {
    feature: 'Boardy AI Derivations',
    free: '5 / day',
    pro: 'Unlimited',
    crew: '5 / day + Crew',
  },
  {
    feature: 'Accuracy & Weak-Topic Analytics',
    free: 'Basic',
    pro: 'Full Diagnostics',
    crew: 'Squad Leaderboard',
  },
];

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
    description: 'Get instant KaTeX formula walkthroughs and trap analysis from Boardy AI.',
  },
  {
    title: 'Deep Topic & Speed Analytics',
    description: 'Pinpoint weak chapters, negative-marking risk, and per-subject accuracy.',
  },
  {
    title: 'Pro Scholar Badge & Priority',
    description: 'Stand out on Commons and national leaderboards with the Pro Scholar badge.',
  },
];

export const PRO_FAQ_ITEMS: ReadonlyArray<{
  question: string;
  answer: string;
}> = [
  {
    question: 'How do I pay?',
    answer: `You can redeem your existing Koban wallet balance (${PLANS.pro_monthly.price_kobans.toLocaleString()} Kobans for Monthly or ${PLANS.pro_annual.price_kobans.toLocaleString()} Kobans for Annual), or transfer PKR ${PLANS.pro_monthly.price_pkr} / PKR ${PLANS.pro_annual.price_pkr.toLocaleString()} via JazzCash or Opay and submit your payment proof (Transaction ID / TID).`,
  },
  {
    question: 'When does Pro activate & what is the refund policy?',
    answer:
      'Payments are verified manually. After you submit your payment and proof, we verify it and activate your plan within 24 hours. All Pro and Premium purchases are final and non-refundable once submitted or activated (zero refunds).',
  },
  {
    question: 'What happens when it expires?',
    answer:
      'Your account smoothly returns to the Free tier with all your test history, streaks, and cosmetics preserved. If you purchase another pass while Pro is active, the additional days are added onto your current expiry date.',
  },
];

/**
 * Resolves any plan identifier ('pro_monthly', 'monthly', 'pro', 'pro_annual', 'annual')
 * to the canonical ProPlanConfig from PLANS.
 */
export function getProPlanById(rawId?: string | null): ProPlanConfig {
  const clean = String(rawId || '')
    .trim()
    .toLowerCase();
  if (
    clean === 'pro_annual' ||
    clean === 'annual' ||
    clean === 'yearly' ||
    clean === 'pro_yearly' ||
    clean === '365'
  ) {
    return PLANS.pro_annual;
  }
  return PLANS.pro_monthly;
}

/**
 * Safely parses any Firestore Timestamp, REST timestampValue, number (seconds or ms),
 * Date, or ISO string into epoch milliseconds.
 */
export function parseExpiryMillis(expiryRaw: unknown): number | null {
  if (expiryRaw === null || expiryRaw === undefined || expiryRaw === '') return null;

  if (typeof expiryRaw === 'number' && Number.isFinite(expiryRaw)) {
    if (expiryRaw <= 0) return null;
    // If stored in Unix seconds (e.g. 1796000000 < 1e11), convert to milliseconds
    return expiryRaw < 1e11 ? Math.round(expiryRaw * 1000) : Math.round(expiryRaw);
  }

  if (expiryRaw instanceof Date) {
    const t = expiryRaw.getTime();
    return Number.isNaN(t) ? null : t;
  }

  if (typeof expiryRaw === 'object') {
    const obj = expiryRaw as Record<string, unknown>;
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

  if (typeof expiryRaw === 'string') {
    const trimmed = expiryRaw.trim();
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
  planId: ProPlanId;
  planName: string;
  amountPkr: number;
  method: string;
  tid: string;
  submittedAtMs: number | null;
  submittedFormatted: string;
}

export interface UnifiedPlanStatusResult {
  state: UnifiedPlanState; // 'none' | 'pending' | 'active'
  isPro: boolean;
  isPersonalPro: boolean;
  isSuperAdmin: boolean;
  isCrewPro: boolean;
  planId: ProPlanId | null;
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
  blockReason: string | null;
}

/**
 * ONE shared plan-status function used across:
 * - Upgrade / Pricing screens (/dashboard/plans, /store Boardly Pro tab, /pricing, ProCheckoutSheet)
 * - Header PRO chip (DashboardTopBar, DashboardSidebar, HamburgerMenuSheet)
 * - "Current plan" card (StatusBanner)
 * - Feature / reward checks (useEffectivePlan)
 * - Server & Worker endpoints (/api/pro/status, /api/pro/purchase-guard)
 *
 * Returns state: 'none' | 'pending' | 'active' (with plan name, start, and expiry).
 * Active strictly means the user's personal Pro expiry is in the future (expiryMs > nowMs),
 * or the user is a Superadmin.
 */
export function resolveUnifiedPlanStatus(input: {
  uid?: string | null;
  email?: string | null;
  role?: string | null;
  isGuest?: boolean;
  plan?: string | null;
  isPremium?: boolean | null;
  proPlanId?: string | null;
  planStartedAt?: unknown;
  updatedAt?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
  pendingRequests?: Array<Record<string, any>> | null;
  isCrewPro?: boolean;
  crewName?: string | null;
  isSuperAdmin?: boolean;
  nowMs?: number;
}): UnifiedPlanStatusResult {
  const nowMs = typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const isGuest = Boolean(input.isGuest || (input.uid && String(input.uid).startsWith('guest_')));

  const emailLower = String(input.email || '').trim().toLowerCase();
  const roleLower = String(input.role || '').trim().toLowerCase();
  const isSuperAdmin = Boolean(
    input.isSuperAdmin ||
      input.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
      emailLower === 'shsvirtualadmin@gmail.com' ||
      emailLower === 'support@boardly.cfd' ||
      emailLower === 'support@scholario.me' ||
      roleLower === 'superadmin' ||
      roleLower === 'admin'
  );

  // Parse expiry from either planExpiresAt or premiumExpiresAt (choosing the latest valid timestamp if both exist)
  const expA = parseExpiryMillis(input.planExpiresAt);
  const expB = parseExpiryMillis(input.premiumExpiresAt);
  const expiryMs =
    expA !== null && expB !== null ? Math.max(expA, expB) : expA !== null ? expA : expB;

  const hasFutureExpiry = expiryMs !== null && expiryMs > nowMs;
  const isExpired = expiryMs !== null && expiryMs <= nowMs;

  const rawPlan = String(input.plan || '').trim().toLowerCase();
  const rawPlanId = String(input.proPlanId || input.plan || '').trim().toLowerCase();
  const isFlaggedPro = Boolean(
    input.isPremium === true ||
      rawPlan === 'pro' ||
      rawPlan === 'pro_monthly' ||
      rawPlan === 'pro_annual' ||
      rawPlan === 'premium'
  );

  // Determine which Pro plan (Monthly vs Annual)
  const durationHintDays =
    hasFutureExpiry && expiryMs ? Math.ceil((expiryMs - nowMs) / (24 * 60 * 60 * 1000)) : 0;
  const resolvedPlanConfig =
    rawPlanId.includes('annual') || rawPlanId.includes('year') || durationHintDays > 45
      ? PLANS.pro_annual
      : PLANS.pro_monthly;

  const startRaw = parseExpiryMillis(input.planStartedAt ?? input.updatedAt);
  const estimatedStartMs =
    startRaw ??
    (hasFutureExpiry && expiryMs
      ? expiryMs - resolvedPlanConfig.duration_days * 24 * 60 * 60 * 1000
      : null);

  // 1. Check if personal Pro plan is ACTIVE (expiry is in the future, OR flagged Pro with no expiry timestamp)
  if (!isGuest && (hasFutureExpiry || (isFlaggedPro && !isExpired))) {
    if (hasFutureExpiry && expiryMs !== null) {
      const daysLeft = Math.max(1, Math.ceil((expiryMs - nowMs) / (24 * 60 * 60 * 1000)));
      const expiryFormatted = formatProExpiryDate(expiryMs);
      const expiryDateTimeFormatted = formatProDateTime(expiryMs);
      const timeLeftLabel = formatProTimeLeft(expiryMs, nowMs);
      return {
        state: 'active',
        isPro: true,
        isPersonalPro: true,
        isSuperAdmin,
        isCrewPro: false,
        planId: resolvedPlanConfig.id,
        planName: resolvedPlanConfig.name,
        startMs: estimatedStartMs,
        startFormatted: estimatedStartMs ? formatProExpiryDate(estimatedStartMs) : null,
        expiryMs,
        expiryFormatted,
        expiryDateTimeFormatted,
        daysLeft,
        timeLeftLabel,
        pendingRequest: null,
        canStartPurchase: false,
        blockReason: `You already have Boardly Pro (${resolvedPlanConfig.name}) active until ${expiryFormatted} (${timeLeftLabel}). You can purchase a plan again after your current plan expires.`,
      };
    }

    // Active Pro via admin override / role without an explicit expiry timestamp
    return {
      state: 'active',
      isPro: true,
      isPersonalPro: true,
      isSuperAdmin,
      isCrewPro: false,
      planId: resolvedPlanConfig.id,
      planName: resolvedPlanConfig.name,
      startMs: startRaw,
      startFormatted: startRaw ? formatProExpiryDate(startRaw) : null,
      expiryMs: null,
      expiryFormatted: 'Active (No expiry date set)',
      expiryDateTimeFormatted: 'Active (No expiry date set)',
      daysLeft: resolvedPlanConfig.duration_days,
      timeLeftLabel: 'Active Pro membership',
      pendingRequest: null,
      canStartPurchase: false,
      blockReason: `You already have an active ${resolvedPlanConfig.name} membership.`,
    };
  }

  // 2. Superadmin without an explicit expiry timestamp is also treated as active Pro
  if (!isGuest && isSuperAdmin) {
    return {
      state: 'active',
      isPro: true,
      isPersonalPro: true,
      isSuperAdmin: true,
      isCrewPro: false,
      planId: 'pro_annual',
      planName: 'Boardly Pro (Administrator Access)',
      startMs: null,
      startFormatted: null,
      expiryMs: null,
      expiryFormatted: 'Unlimited',
      expiryDateTimeFormatted: 'Unlimited',
      daysLeft: 365,
      timeLeftLabel: 'Unlimited administrator access',
      pendingRequest: null,
      canStartPurchase: false,
      blockReason: 'You already have active Boardly Pro administrator access.',
    };
  }

  // 3. Check if the user has a PENDING Pro payment request waiting for manual verification
  const rawReqs = Array.isArray(input.pendingRequests) ? input.pendingRequests : [];
  const pendingDoc = rawReqs.find((r) => {
    if (!r || typeof r !== 'object') return false;
    const st = String(r.status || '').trim().toLowerCase();
    const pl = String(r.plan || '').trim().toLowerCase();
    return st === 'pending' && pl !== 'large_crew' && !r.crewId;
  });

  if (!isGuest && pendingDoc) {
    const pConfig = getProPlanById(pendingDoc.plan || pendingDoc.planId);
    const submittedMs = parseExpiryMillis(
      pendingDoc.createdAt ?? pendingDoc.submittedAt ?? pendingDoc.timestamp
    );
    const submittedFormatted = submittedMs ? formatProDateTime(submittedMs) : 'Recently submitted';
    const pendingInfo: PendingProPaymentInfo = {
      id: String(pendingDoc.id || ''),
      planId: pConfig.id,
      planName: String(pendingDoc.planName || pConfig.name),
      amountPkr: Number(pendingDoc.amount_pkr ?? pendingDoc.amount ?? pConfig.price_pkr),
      method: String(pendingDoc.method || 'jazzcash'),
      tid: String(pendingDoc.TID || pendingDoc.transactionId || ''),
      submittedAtMs: submittedMs,
      submittedFormatted,
    };

    return {
      state: 'pending',
      isPro: Boolean(input.isCrewPro),
      isPersonalPro: false,
      isSuperAdmin: false,
      isCrewPro: Boolean(input.isCrewPro),
      planId: pConfig.id,
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
      blockReason:
        'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while your payment is awaiting verification.',
    };
  }

  // 4. Otherwise state is 'none' (Free or Expired personal plan)
  const isCrewPro = Boolean(!isGuest && input.isCrewPro);
  return {
    state: 'none',
    isPro: isCrewPro,
    isPersonalPro: false,
    isSuperAdmin: false,
    isCrewPro,
    planId: null,
    planName: isCrewPro ? `${input.crewName || 'Study Crew'} Shared Pro` : PLANS.free.name,
    startMs: null,
    startFormatted: null,
    expiryMs: expiryMs && expiryMs <= nowMs ? expiryMs : null,
    expiryFormatted: expiryMs && expiryMs <= nowMs ? formatProExpiryDate(expiryMs) : null,
    expiryDateTimeFormatted: expiryMs && expiryMs <= nowMs ? formatProDateTime(expiryMs) : null,
    daysLeft: 0,
    timeLeftLabel: null,
    pendingRequest: null,
    canStartPurchase: !isGuest,
    blockReason: isGuest ? 'Create a registered account to upgrade to Boardly Pro.' : null,
  };
}

/**
 * Computes the new Pro expiry timestamp according to the activation rule:
 * - If the student already has an active Pro (currentExpiryMs > nowMs), add the new duration
 *   to the current expiry date. Never overwrite or reset an active expiry.
 * - Otherwise, start from nowMs + durationDays.
 */
export function computeExtendedProExpiry(
  currentExpiryRaw: unknown,
  durationDays: number,
  nowMs: number = Date.now()
): {
  currentExpiryMs: number | null;
  previousExpiryMs: number | null;
  isCurrentlyActive: boolean;
  wasAlreadyActive: boolean;
  newExpiryMs: number;
  newExpiryDate: Date;
  currentExpiryFormatted: string | null;
  previousExpiryLabel: string | null;
  newExpiryFormatted: string;
  newExpiryLabel: string;
  daysRemainingAfter: number;
} {
  const parsedCurrent = parseExpiryMillis(currentExpiryRaw);
  const isCurrentlyActive = parsedCurrent !== null && parsedCurrent > nowMs;
  const baseMs = isCurrentlyActive ? parsedCurrent : nowMs;
  const durationMs = Math.max(1, Math.floor(durationDays)) * 24 * 60 * 60 * 1000;
  const newExpiryMs = baseMs + durationMs;
  const daysRemainingAfter = Math.max(
    1,
    Math.ceil((newExpiryMs - nowMs) / (24 * 60 * 60 * 1000))
  );
  const previousLabel =
    isCurrentlyActive && parsedCurrent ? formatProExpiryDate(parsedCurrent) : null;
  const newLabel = formatProExpiryDate(newExpiryMs);

  return {
    currentExpiryMs: isCurrentlyActive ? parsedCurrent : null,
    previousExpiryMs: isCurrentlyActive ? parsedCurrent : null,
    isCurrentlyActive,
    wasAlreadyActive: isCurrentlyActive,
    newExpiryMs,
    newExpiryDate: new Date(newExpiryMs),
    currentExpiryFormatted: previousLabel,
    previousExpiryLabel: previousLabel,
    newExpiryFormatted: newLabel,
    newExpiryLabel: newLabel,
    daysRemainingAfter,
  };
}

export interface ProStatusSummary {
  isActive: boolean;
  isPro: boolean;
  isPersonalPro: boolean;
  isSuperAdmin: boolean;
  isCrewPro: boolean;
  crewName?: string;
  expiryMs: number | null;
  expiryFormatted: string | null;
  expiryDateLabel: string | null;
  daysLeft: number;
  timeLeftLabel: string | null;
  isExpiringSoon: boolean; // true when active and <= 3 days remaining
  statusText: string | null;
  statusBannerText: string;
}

/**
 * Computes a unified status summary used by the Store header, Boardly Pro tab, and Plans page.
 * Uses `resolveUnifiedPlanStatus` under the hood so it never disagrees with the header PRO chip or Upgrade screen.
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
      'isPro' in (inputOrRawExpiry as Record<string, any>) ||
      'plan' in (inputOrRawExpiry as Record<string, any>) ||
      'isPremium' in (inputOrRawExpiry as Record<string, any>) ||
      'source' in (inputOrRawExpiry as Record<string, any>));

  const inputObj = isConfigObj ? (inputOrRawExpiry as Record<string, any>) : {};
  const rawExpiry = isConfigObj
    ? inputObj.planExpiresAt ?? inputObj.premiumExpiresAt
    : inputOrRawExpiry;

  const unified = resolveUnifiedPlanStatus({
    uid: inputObj.uid,
    email: inputObj.email,
    role: inputObj.role,
    plan: inputObj.plan,
    isPremium: inputObj.isPremium,
    proPlanId: inputObj.proPlanId,
    planExpiresAt: rawExpiry,
    premiumExpiresAt: isConfigObj ? inputObj.premiumExpiresAt : rawExpiry,
    isSuperAdmin: Boolean(inputObj.isSuperAdmin || inputObj.source === 'superadmin'),
    isCrewPro: Boolean(inputObj.source === 'crew'),
    crewName: inputObj.crewName,
    nowMs,
  });

  const hasFutureExpiry = unified.expiryMs !== null && unified.expiryMs > nowMs;
  const isExpiringSoon = Boolean(hasFutureExpiry && unified.daysLeft <= 3);

  const statusText =
    hasFutureExpiry && unified.expiryFormatted
      ? `Pro active until ${unified.expiryFormatted} (${unified.timeLeftLabel})`
      : null;

  let statusBannerText = 'Free Tier · 2 practice tests & 5 AI tokens per day';
  if (unified.isSuperAdmin) {
    statusBannerText = 'Superadmin · Unlimited Pro access active';
  } else if (statusText) {
    statusBannerText = statusText;
  } else if (unified.isPersonalPro) {
    statusBannerText = 'Pro active · Unlimited tests & AI derivations';
  } else if (unified.isCrewPro) {
    statusBannerText = `Pro active via ${inputObj.crewName || 'Study Crew'}`;
  }

  return {
    isActive: unified.state === 'active',
    isPro: unified.isPro,
    isPersonalPro: unified.isPersonalPro,
    isSuperAdmin: unified.isSuperAdmin,
    isCrewPro: unified.isCrewPro,
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

