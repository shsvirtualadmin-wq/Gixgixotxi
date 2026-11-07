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

export const REFUND_POLICY_TEXT = 'Pro passes are non-refundable once activated.';

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
    answer: `You can pay instantly using your Koban wallet balance (${PLANS.pro_monthly.price_kobans.toLocaleString()} Kobans for Monthly or ${PLANS.pro_annual.price_kobans.toLocaleString()} Kobans for Annual), or transfer PKR ${PLANS.pro_monthly.price_pkr} / PKR ${PLANS.pro_annual.price_pkr.toLocaleString()} via JazzCash or Opay and enter your Transaction ID (TID).`,
  },
  {
    question: 'When does Pro activate?',
    answer:
      'Paying with Kobans activates or extends your Boardly Pro pass immediately in one atomic transaction. JazzCash and Opay PKR transfers are verified by our team within 2 hours.',
  },
  {
    question: 'What happens when it expires?',
    answer:
      'Your account smoothly returns to the Free tier with all your test history, streaks, and cosmetics preserved. If you buy another pass while Pro is active, the new days are added onto your current expiry date.',
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
 * Safely parses any Firestore Timestamp, number (ms), Date, or ISO string into epoch milliseconds.
 */
export function parseExpiryMillis(expiryRaw: unknown): number | null {
  if (!expiryRaw) return null;
  if (typeof expiryRaw === 'number' && Number.isFinite(expiryRaw)) {
    return expiryRaw;
  }
  if (expiryRaw instanceof Date) {
    const t = expiryRaw.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof (expiryRaw as { toMillis?: () => number }).toMillis === 'function') {
    const ms = (expiryRaw as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof (expiryRaw as { seconds?: number }).seconds === 'number') {
    return (expiryRaw as { seconds: number }).seconds * 1000;
  }
  if (typeof expiryRaw === 'string') {
    const parsed = new Date(expiryRaw).getTime();
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
  isExpiringSoon: boolean; // true when active and <= 3 days remaining
  statusText: string | null;
  statusBannerText: string;
}

/**
 * Computes a unified status summary used by the Store header, Boardly Pro tab, and Plans page.
 * Accepts either a raw expiry timestamp/string/Date OR an object with planExpiresAt/premiumExpiresAt.
 * Example: "Pro active until 12 Dec 2026, 30 days left"
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
    ('planExpiresAt' in (inputOrRawExpiry as Record<string, any>) ||
      'premiumExpiresAt' in (inputOrRawExpiry as Record<string, any>) ||
      'isPro' in (inputOrRawExpiry as Record<string, any>) ||
      'source' in (inputOrRawExpiry as Record<string, any>));

  const rawExpiry = isConfigObj
    ? (inputOrRawExpiry as any).planExpiresAt ?? (inputOrRawExpiry as any).premiumExpiresAt
    : inputOrRawExpiry;

  const expiryMs = parseExpiryMillis(rawExpiry);
  const hasFutureExpiry = expiryMs !== null && expiryMs > nowMs;
  const daysLeft = hasFutureExpiry
    ? Math.max(1, Math.ceil((expiryMs - nowMs) / (24 * 60 * 60 * 1000)))
    : 0;
  const expiryFormatted = hasFutureExpiry ? formatProExpiryDate(expiryMs) : null;

  const inputObj = isConfigObj ? (inputOrRawExpiry as Record<string, any>) : {};
  const isSuperAdmin = Boolean(inputObj.isSuperAdmin || inputObj.source === 'superadmin');
  const isPersonalPro = Boolean(
    !isSuperAdmin &&
      (hasFutureExpiry ||
        inputObj.source === 'personal' ||
        ((inputObj.isPremium || inputObj.plan === 'pro') && hasFutureExpiry))
  );
  const isCrewPro = Boolean(!isSuperAdmin && !isPersonalPro && inputObj.source === 'crew');
  const isPro = Boolean(hasFutureExpiry || isSuperAdmin || isPersonalPro || isCrewPro || inputObj.isPro);
  const isExpiringSoon = Boolean(hasFutureExpiry && daysLeft <= 3);

  const statusText =
    hasFutureExpiry && expiryFormatted
      ? `Pro active until ${expiryFormatted}, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
      : null;

  let statusBannerText = 'Free Tier · 2 practice tests & 5 AI tokens per day';
  if (isSuperAdmin) {
    statusBannerText = 'Superadmin · Unlimited Pro access active';
  } else if (statusText) {
    statusBannerText = statusText;
  } else if (isPersonalPro) {
    statusBannerText = 'Pro active · Unlimited tests & AI derivations';
  } else if (isCrewPro) {
    statusBannerText = `Pro active via ${inputObj.crewName || 'Study Crew'}`;
  }

  return {
    isActive: hasFutureExpiry,
    isPro,
    isPersonalPro,
    isSuperAdmin,
    isCrewPro,
    crewName: inputObj.crewName,
    expiryMs: hasFutureExpiry ? expiryMs : null,
    expiryFormatted,
    expiryDateLabel: expiryFormatted,
    daysLeft,
    isExpiringSoon,
    statusText,
    statusBannerText,
  };
}
