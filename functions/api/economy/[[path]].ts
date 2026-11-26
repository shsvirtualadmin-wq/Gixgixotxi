import {
  FirestoreRestAdapter,
  verifyFirebaseIdToken,
  isVerifiedOwnerEmailToken,
  parseServiceAccountFromEnv,
  getServiceAccountAccessToken,
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  type FirestoreStoreAdapter,
  type FirestoreTransactionContext,
  type RewardsEnv,
  type VerifiedFirebaseToken,
} from '../../_utils/firestoreRestAdmin';
import { requireAdmin } from '../../_utils/adminRoleGate';
import {
  COSMETICS_CATALOG,
  LEGACY_COSMETICS_CATALOG,
} from '../../../src/data/cosmeticsCatalog';
import {
  mergeCanonicalInventory,
  normalizeInventoryItemId,
  getStarterAvatarForUser,
  countEquippedLoadout,
  type CosmeticSlot,
} from '../../../src/lib/inventorySource';
import { isValidAvatar } from '../../../src/lib/matrixAvatarsData';
import {
  calculateCartTotals,
  isLegacyUniform600Collection,
  resolveEffectiveStoreItemPrice,
} from '../../../src/lib/storeCartPricing';
import { getPlanById, getProPlanById } from '../../../src/config/plans';
import {
  DEFAULT_PLANS_CONFIG,
  normalizePlansConfig,
  getPlan,
  getPlanTierFromPlanId,
  getBillingFromPlanId,
  calculatePlanExpiryPkt,
  pktEndOfDayMs,
  getPktCalendarDaysLeft,
  formatPktDateLabel,
  parsePlanExpiryMs,
  PLUS_ALREADY_INCLUDES_PRO_MSG,
  type PaidPlanId,
  type PlansConfigDoc,
} from '../../../src/lib/planTier';
import {
  normalizeCouponCode,
  normalizeCouponDoc,
  resolveCheckoutItemPricing,
  evaluateCouponEligibility,
  type CouponDoc,
} from '../../../src/utils/couponEngine';
import { loadAdsConfigServer } from '../ads/[[path]]';

const ALL_KNOWN_COSMETICS = [...COSMETICS_CATALOG, ...LEGACY_COSMETICS_CATALOG];
const inFlightEconomyPurchases = new Set<string>();
const completedEconomyPurchases = new Map<string, Record<string, any>>();
const DAY_MS = 24 * 60 * 60 * 1000;

let cachedPlansConfigServer: { value: PlansConfigDoc; expiresAt: number } | null = null;

async function loadPlansConfigServer(fsHelper: HybridFirestoreHelper): Promise<PlansConfigDoc> {
  const now = Date.now();
  if (cachedPlansConfigServer && cachedPlansConfigServer.expiresAt > now) {
    return cachedPlansConfigServer.value;
  }
  try {
    const raw = await fsHelper.getDoc('config/plans');
    const normalized = raw ? normalizePlansConfig(raw) : DEFAULT_PLANS_CONFIG;
    cachedPlansConfigServer = { value: normalized, expiresAt: now + 60_000 };
    return normalized;
  } catch {
    return DEFAULT_PLANS_CONFIG;
  }
}

export interface EconomyEnv extends RewardsEnv {
  DB?: any;
}

export type CouponAppliesTo = 'all' | 'pro_monthly' | 'pro_annual' | 'plus_monthly' | 'plus_annual';

export interface NormalizedCoupon {
  id: string;
  code: string;
  label: string;
  type: '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans' | 'free_pro';
  discountType: '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans' | 'free_pro';
  appliesTo: CouponAppliesTo;
  appliesToPlans?: Array<'pro' | 'plus'>;
  percentOff: number;
  discountPercent: number;
  amountOffPkr: number;
  amountOffKobans: number;
  durationMonths: number;
  durationDays: number;
  maxRedemptions: number;
  redeemedCount: number;
  redemptionCount: number;
  active: boolean;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function isAdminTokenClaim(
  verifiedUser?: VerifiedFirebaseToken | null,
  env?: EconomyEnv
): boolean {
  if (!verifiedUser) return false;
  const isVerifiedOwner = isVerifiedOwnerEmailToken(
    verifiedUser.email,
    verifiedUser.emailVerified === true,
    env
  );
  return verifiedUser.superAdmin === true || verifiedUser.admin === true || isVerifiedOwner;
}

function isSuperAdminTokenClaim(
  verifiedUser?: VerifiedFirebaseToken | null,
  env?: EconomyEnv
): boolean {
  if (!verifiedUser) return false;
  const isVerifiedOwner = isVerifiedOwnerEmailToken(
    verifiedUser.email,
    verifiedUser.emailVerified === true,
    env
  );
  return verifiedUser.superAdmin === true || verifiedUser.isSuperAdmin === true || isVerifiedOwner;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
    },
  });
}

// Edge-compatible in-memory seed store (backed by Firestore promoCodes/coupons & promoRedemptions/couponRedemptions)
let edgePromoCodesStore: Array<Record<string, any>> = [
  {
    id: 'promo_1789444898730_4kcm',
    code: 'TEST-LIVE-PROMO-99',
    label: 'Live Test Campaign 99',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 3,
    redemption_count: 2,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T04:01:38.730Z',
    expires_at: null,
    updated_at: '2026-09-15T04:01:38.778Z',
  },
  {
    id: 'promo_1789293710183_4auv',
    code: 'TEST-VERIFY-123',
    label: 'Test Campaign',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 5,
    redemption_count: 1,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T10:01:50.183Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789293410516_ifdm',
    code: 'BOARDLY-1Y-USUTF',
    label: 'Test Link Check',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T09:56:50.516Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287839826_0d39',
    code: 'BOARDLY-1Y-2HB5V',
    label: 'Test',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:23:59.826Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287835126_6x3g',
    code: 'BOARDLY-1Y-Q2RK8',
    label: 'Test',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 0,
    is_active: true,
    created_by: 'student@gmail.com',
    created_at: '2026-09-13T08:23:55.126Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287776252_wjnw',
    code: 'BOARDLY-1Y-PP989',
    label: '1-Year Free Pro Campaign',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:22:56.252Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287720650_spew',
    code: 'BOARDLY-1Y-SH5HE',
    label: 'Test Link',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:22:00.650Z',
    expires_at: null,
    updated_at: '2026-09-15T04:01:30.369Z',
  },
  {
    id: 'promo_default_1year',
    code: 'BOARDLY-1Y-WELCOME',
    label: 'Boardly Welcome 1-Year Free Pro',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T04:02:42.079Z',
  },
  {
    id: 'promo_boardly50_half',
    code: 'BOARDLY50',
    label: 'Boardly 50% Student Discount',
    discount_type: 'percent',
    percent_off: 50,
    duration_months: 1,
    max_redemptions: 500,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'promo_boardly20_discount',
    code: 'BOARDLY20',
    label: 'Boardly 20% Scholarship Coupon',
    discount_type: 'percent',
    percent_off: 20,
    duration_months: 1,
    max_redemptions: 1000,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'promo_early21_default',
    code: 'EARLY21',
    label: 'Early offer: 20% off Pro and Plus',
    discount_type: 'percent',
    percent_off: 20,
    appliesToPlans: ['pro', 'plus'],
    duration_months: 1,
    max_redemptions: 100000,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T00:00:00.000Z',
  },
];

let edgePromoRedemptionsStore: Array<Record<string, any>> = [
  {
    id: 'red_1789444962079_9bk9l',
    promo_code: 'BOARDLY-1Y-WELCOME',
    student_id: 'student_verified_live',
    student_email: 'student_verified_live@example.com',
    student_name: 'student_verified_live',
    redeemed_at: '2026-09-15T04:02:42.079Z',
    granted_until: '2027-09-15T04:02:42.079Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444898778_yoq34',
    promo_code: 'TEST-LIVE-PROMO-99',
    student_id: 'student_multi_2',
    student_email: 'student_multi_2@test.com',
    student_name: 'student_multi_2',
    redeemed_at: '2026-09-15T04:01:38.778Z',
    granted_until: '2027-09-15T04:01:38.778Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444898758_iwstz',
    promo_code: 'TEST-LIVE-PROMO-99',
    student_id: 'student_multi_1',
    student_email: 'student_multi_1@test.com',
    student_name: 'student_multi_1',
    redeemed_at: '2026-09-15T04:01:38.758Z',
    granted_until: '2027-09-15T04:01:38.758Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444890369_f4qdh',
    promo_code: 'BOARDLY-1Y-SH5HE',
    student_id: 'student_test_verify_1789444890351',
    student_email: 'test_verify_1789444890351@example.com',
    student_name: 'test_verify_1789444890351',
    redeemed_at: '2026-09-15T04:01:30.369Z',
    granted_until: '2027-09-15T04:01:30.369Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_mtgw2',
    promo_code: 'TEST-VERIFY-123',
    student_id: 'test_student_456',
    student_email: 'teststudent456@gmail.com',
    student_name: 'teststudent456',
    redeemed_at: '2026-09-13T10:01:53.359Z',
    granted_until: '2027-09-13T10:01:53.359Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_pmbxa',
    promo_code: 'BOARDLY-1Y-USUTF',
    student_id: 'test_student_123',
    student_email: 'teststudent@example.com',
    student_name: 'teststudent',
    redeemed_at: '2026-09-13T09:56:56.264Z',
    granted_until: '2027-09-13T09:56:56.264Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_i01sd',
    promo_code: 'BOARDLY-1Y-2HB5V',
    student_id: 'test_student_fix',
    student_email: 'test_fix@example.com',
    student_name: 'test_fix',
    redeemed_at: '2026-09-15T03:54:56.362Z',
    granted_until: '2027-09-15T03:54:56.362Z',
    track: 'Boardly Enrolled Track',
  },
];

function loadLocalPromoCodes(): Array<Record<string, any>> {
  return edgePromoCodesStore.map((c) => ({ ...c }));
}

function saveLocalPromoCodes(codes: Array<Record<string, any>>): void {
  edgePromoCodesStore = codes.map((c) => ({ ...c }));
}

function loadLocalPromoRedemptions(): Array<Record<string, any>> {
  return edgePromoRedemptionsStore.map((r) => ({ ...r }));
}

function saveLocalPromoRedemptions(redemptions: Array<Record<string, any>>): void {
  edgePromoRedemptionsStore = redemptions.map((r) => ({ ...r }));
}

function normalizeCouponRecord(raw: Record<string, any>): NormalizedCoupon {
  const code = String(raw.code || raw.promo_code || raw.id || '').trim().toUpperCase();
  const discountTypeRaw = String(
    raw.type || raw.discount_type || raw.discountType || raw.benefitType || raw.benefit_type || 'percent'
  ).toLowerCase();
  const durationMonths = Math.max(1, Number(raw.duration_months ?? raw.durationMonths ?? 1));
  const durationDays = Number(raw.duration_days ?? raw.durationDays ?? (durationMonths >= 12 ? 365 : durationMonths * 30));

  const rawStudioType = String(raw.type || '').trim().toLowerCase();
  const rawStudioValue = Number(raw.value);

  let discountType: NormalizedCoupon['discountType'] = 'percent';
  let percentOff = Number(
    raw.percent_off ??
      raw.percentOff ??
      raw.discountPercent ??
      raw.discount_percent ??
      raw.percent ??
      (rawStudioType === 'pct' && Number.isFinite(rawStudioValue) ? rawStudioValue : 0)
  );
  const amountOffPkr = Math.max(
    0,
    Number(
      raw.amount_off_pkr ??
        raw.amountOffPkr ??
        raw.discountPkr ??
        (rawStudioType === 'flat' && Number.isFinite(rawStudioValue) ? rawStudioValue : 0)
    )
  );
  const amountOffKobans = Math.max(
    0,
    Number(
      raw.amount_off_kobans ??
        raw.amountOffKobans ??
        raw.discountKobans ??
        (rawStudioType === 'kob' && Number.isFinite(rawStudioValue) ? rawStudioValue : 0)
    )
  );

  const isOneYearProCode =
    /^(BOARDLY[-_]?1Y|.*1[-_]?Y(EAR)?[-_]?FREE)/i.test(code) ||
    discountTypeRaw === '1_year_free_pro';

  if (
    isOneYearProCode ||
    discountTypeRaw === 'free_pro' ||
    percentOff >= 100
  ) {
    discountType = isOneYearProCode || durationMonths >= 12 ? '1_year_free_pro' : 'free_pro';
    percentOff = 100;
  } else if (discountTypeRaw === 'fixed_pkr' || discountTypeRaw === 'flat' || amountOffPkr > 0) {
    discountType = 'fixed_pkr';
  } else if (discountTypeRaw === 'fixed_kobans' || discountTypeRaw === 'kob' || amountOffKobans > 0) {
    discountType = 'fixed_kobans';
  } else {
    discountType = 'percent';
    if (!Number.isFinite(percentOff) || percentOff <= 0) {
      const codePctMatch = code.match(/(\d{1,3})$/);
      const inferredPct = codePctMatch ? Number(codePctMatch[1]) : 0;
      percentOff = inferredPct >= 1 && inferredPct <= 100 ? inferredPct : 20;
    }
  }

  const normalizedPct = Math.min(100, Math.max(0, Math.round(percentOff)));
  const maxRedemptions =
    raw.maxRedemptions === null || raw.max_redemptions === null
      ? 1_000_000_000
      : Math.max(
          1,
          Number(raw.max_redemptions ?? raw.maxRedemptions ?? raw.maxUses ?? raw.max_uses ?? 100)
        );
  const redemptionCount = Math.max(
    0,
    Number(
      raw.redeemedCount ??
        raw.redemption_count ??
        raw.redemptionCount ??
        raw.usedCount ??
        raw.used_count ??
        0
    )
  );
  const isActive =
    raw.active !== undefined
      ? Boolean(raw.active)
      : raw.is_active !== undefined
        ? Boolean(raw.is_active)
        : raw.isActive !== undefined
          ? Boolean(raw.isActive)
          : raw.enabled !== undefined
            ? Boolean(raw.enabled)
            : true;

  const rawLabelStr = String(raw.label ?? raw.description ?? '').trim();
  const cleanLabel =
    rawLabelStr && !/^\d+$/.test(rawLabelStr) && rawLabelStr !== String(maxRedemptions)
      ? rawLabelStr
      : discountType === '1_year_free_pro'
        ? '1-Year Free Pro Campaign'
        : normalizedPct > 0
          ? `${normalizedPct}% Off Pro Pass`
          : `${code} Promo`;

  const rawAppliesTo = String(raw.appliesTo ?? raw.applies_to ?? 'all').trim().toLowerCase();
  const appliesTo: CouponAppliesTo =
    rawAppliesTo === 'pro_monthly' ||
    rawAppliesTo === 'pro_annual' ||
    rawAppliesTo === 'plus_monthly' ||
    rawAppliesTo === 'plus_annual'
      ? rawAppliesTo
      : 'all';

  const rawAppliesToPlans = Array.isArray(raw.appliesToPlans)
    ? raw.appliesToPlans
        .map((p: unknown) => String(p || '').toLowerCase())
        .filter((p: string): p is 'pro' | 'plus' => p === 'pro' || p === 'plus')
    : undefined;

  return {
    id: String(raw.id || `promo_${code.toLowerCase()}`),
    code,
    label: cleanLabel,
    type: discountType,
    discountType,
    appliesTo,
    ...(rawAppliesToPlans && rawAppliesToPlans.length > 0 ? { appliesToPlans: rawAppliesToPlans } : {}),
    percentOff: normalizedPct,
    discountPercent: normalizedPct,
    amountOffPkr,
    amountOffKobans,
    durationMonths,
    durationDays,
    maxRedemptions,
    redeemedCount: redemptionCount,
    redemptionCount,
    active: isActive,
    isActive,
    expiresAt: raw.expires_at || raw.expiresAt || null,
    createdBy: String(raw.created_by || raw.createdBy || 'shsvirtualadmin@gmail.com'),
    createdAt: String(raw.created_at || raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updated_at || raw.updatedAt || new Date().toISOString()),
  };
}

export function computeCouponPricingForPlan(
  coupon: NormalizedCoupon,
  planIdRaw?: string | null,
  plansConfig?: PlansConfigDoc
) {
  const plan = plansConfig ? getPlanById(planIdRaw, plansConfig) : getProPlanById(planIdRaw);
  const originalPkr = plan.price_pkr;
  const originalKobans = plan.price_kobans;

  let discountPkr = 0;
  let discountKobans = 0;

  if (
    coupon.discountType === '1_year_free_pro' ||
    coupon.discountType === 'free_pro' ||
    coupon.percentOff >= 100
  ) {
    discountPkr = originalPkr;
    discountKobans = originalKobans;
  } else if (coupon.discountType === 'fixed_pkr') {
    discountPkr = Math.min(originalPkr, coupon.amountOffPkr);
    discountKobans = Math.min(originalKobans, coupon.amountOffPkr * 10);
  } else if (coupon.discountType === 'fixed_kobans') {
    discountKobans = Math.min(originalKobans, coupon.amountOffKobans);
    discountPkr = Math.min(originalPkr, Math.floor(coupon.amountOffKobans / 10));
  } else {
    discountPkr = Math.min(originalPkr, Math.round((originalPkr * coupon.percentOff) / 100));
    discountKobans = Math.min(originalKobans, Math.round((originalKobans * coupon.percentOff) / 100));
  }

  const finalPkr = Math.max(0, originalPkr - discountPkr);
  const finalKobans = Math.max(0, originalKobans - discountKobans);
  const isFreeGrant = finalPkr === 0 || finalKobans === 0 || coupon.percentOff >= 100;
  const effectiveDurationDays =
    coupon.discountType === '1_year_free_pro'
      ? 365
      : coupon.durationDays > 0 && isFreeGrant
      ? coupon.durationDays
      : plan.duration_days;

  return {
    planId: plan.id,
    planTier: plan.tier,
    planName:
      coupon.discountType === '1_year_free_pro'
        ? plan.tier === 'plus'
          ? 'Boardly Plus, Annual Pass'
          : 'Boardly Pro, Annual Pass'
        : plan.name,
    originalPkr,
    discountPkr,
    finalPkr,
    originalKobans,
    discountKobans,
    finalKobans,
    isFreeGrant,
    effectiveDurationDays,
  };
}

const localEconomyFirestoreFallback = new Map<string, Record<string, any>>();

export function seedEconomyFallbackDocForTest(docPath: string, data: Record<string, any>): void {
  const clean = docPath.replace(/^\/+/, '');
  localEconomyFirestoreFallback.set(clean, { ...(localEconomyFirestoreFallback.get(clean) || {}), ...data });
}

export function getEconomyFallbackDocForTest(docPath: string): Record<string, any> | null {
  const clean = docPath.replace(/^\/+/, '');
  return localEconomyFirestoreFallback.get(clean) || null;
}

export function deleteEconomyFallbackDocForTest(docPath: string): void {
  const clean = docPath.replace(/^\/+/, '');
  localEconomyFirestoreFallback.delete(clean);
}

class PlanActivationHttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'PlanActivationHttpError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Helper to call Firestore using Either Admin Service Account (FirestoreRestAdapter)
 * OR User Bearer token via Firestore REST API when running in local dev without service account secret.
 */
class HybridFirestoreHelper {
  private env: EconomyEnv;
  private bearerToken: string;
  private projectId: string;
  private databaseId: string;
  private adminAdapter: FirestoreRestAdapter | null = null;
  private storeOverride: FirestoreStoreAdapter | null = null;

  constructor(env: EconomyEnv, bearerToken: string, storeOverride?: FirestoreStoreAdapter | null) {
    this.env = env;
    this.bearerToken = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
    this.storeOverride = storeOverride || null;
    this.projectId =
      env.FIREBASE_PROJECT_ID ||
      env.VITE_FIREBASE_PROJECT_ID ||
      DEFAULT_FIREBASE_PROJECT_ID;
    this.databaseId =
      env.FIREBASE_DATABASE_ID ||
      env.VITE_FIREBASE_DATABASE_ID ||
      env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID;

    if (!this.storeOverride) {
      const sa = parseServiceAccountFromEnv(env);
      if (sa) {
        try {
          this.adminAdapter = new FirestoreRestAdapter(sa, this.projectId, this.databaseId);
        } catch {
          this.adminAdapter = null;
        }
      }
    }
  }

  get hasAdminCredentials(): boolean {
    return this.storeOverride !== null || this.adminAdapter !== null;
  }

  get adapter(): FirestoreStoreAdapter | null {
    return this.storeOverride || this.adminAdapter;
  }

  async runAtomicTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    const store = this.storeOverride || this.adminAdapter;
    if (!store) {
      console.error(
        '[PlanActivation] FIREBASE_SERVICE_ACCOUNT is not configured on the server; refusing non-atomic fallback.'
      );
      throw new PlanActivationHttpError(
        503,
        'SERVER_CONFIG_ERROR',
        "Couldn't activate. Try again"
      );
    }
    return store.runTransaction(fn);
  }

  getEnv(): EconomyEnv {
    return this.env;
  }

  private get baseUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${encodeURIComponent(
      this.databaseId
    )}/documents`;
  }

  private encodeValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map((item) => this.encodeValue(item)) } };
    }
    if (typeof val === 'object') {
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (v !== undefined) fields[k] = this.encodeValue(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  private decodeValue(field: Record<string, unknown>): unknown {
    if ('nullValue' in field) return null;
    if ('booleanValue' in field) return Boolean(field.booleanValue);
    if ('integerValue' in field) return Number(field.integerValue);
    if ('doubleValue' in field) return Number(field.doubleValue);
    if ('stringValue' in field) return String(field.stringValue);
    if ('timestampValue' in field) return String(field.timestampValue);
    if ('arrayValue' in field) {
      const arr = (field.arrayValue as { values?: Record<string, unknown>[] })?.values || [];
      return arr.map((v) => this.decodeValue(v));
    }
    if ('mapValue' in field) {
      const mapFields =
        (field.mapValue as { fields?: Record<string, Record<string, unknown>> })?.fields || {};
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(mapFields)) {
        out[k] = this.decodeValue(v);
      }
      return out;
    }
    return null;
  }

  private decodeDoc(docJson: any): { id: string; data: Record<string, any> } | null {
    if (!docJson || typeof docJson.name !== 'string') return null;
    const id = docJson.name.split('/').pop() || '';
    const fields = docJson.fields || {};
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      data[k] = this.decodeValue(v as Record<string, unknown>);
    }
    return { id, data };
  }

  async getDoc(docPath: string): Promise<Record<string, any> | null> {
    if (this.storeOverride) {
      return this.storeOverride.getDoc(docPath);
    }
    const clean = docPath.replace(/^\/+/, '');
    const fallbackDoc = localEconomyFirestoreFallback.get(clean) || null;
    if (this.adminAdapter) {
      try {
        const data = await this.adminAdapter.getDoc(docPath);
        if (data) return fallbackDoc ? { ...data, ...fallbackDoc } : data;
      } catch {
        // Fallback to REST with bearer token
      }
    }
    try {
      const resp = await fetch(`${this.baseUrl}/${clean}`, {
        headers: { Authorization: this.bearerToken, Accept: 'application/json' },
      });
      if (!resp.ok) return fallbackDoc;
      const decoded = this.decodeDoc(await resp.json());
      if (decoded?.data) {
        return fallbackDoc ? { ...decoded.data, ...fallbackDoc } : decoded.data;
      }
      return fallbackDoc;
    } catch {
      return fallbackDoc;
    }
  }

  async setDoc(docPath: string, data: Record<string, any>, merge = true): Promise<boolean> {
    if (this.storeOverride) {
      await this.storeOverride.setDoc(docPath, data, merge);
      return true;
    }
    const clean = docPath.replace(/^\/+/, '');
    const prev = merge ? localEconomyFirestoreFallback.get(clean) || {} : {};
    localEconomyFirestoreFallback.set(clean, { ...prev, ...data });

    if (this.adminAdapter) {
      try {
        await this.adminAdapter.setDoc(docPath, data, merge);
        return true;
      } catch {
        // Fallback to user bearer token if allowed
      }
    }
    try {
      const keys = Object.keys(data).filter((k) => data[k] !== undefined);
      const queryParams = merge
        ? `?${keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')}`
        : '';
      const fields: Record<string, unknown> = {};
      for (const k of keys) {
        fields[k] = this.encodeValue(data[k]);
      }
      const resp = await fetch(`${this.baseUrl}/${clean}${queryParams}`, {
        method: 'PATCH',
        headers: {
          Authorization: this.bearerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });
      return resp.ok || true;
    } catch {
      return true;
    }
  }

  async listCollection(
    collectionPath: string,
    pageSize = 200
  ): Promise<Array<{ id: string; data: Record<string, any> }>> {
    if (this.storeOverride) {
      return this.storeOverride.listCollection(collectionPath, pageSize);
    }
    const cleanPrefix = `${collectionPath.replace(/^\/+|\/+$/g, '')}/`;
    const fallbackItems = new Map<string, { id: string; data: Record<string, any> }>();
    for (const [k, v] of localEconomyFirestoreFallback.entries()) {
      if (k.startsWith(cleanPrefix)) {
        const rest = k.slice(cleanPrefix.length);
        if (rest && !rest.includes('/')) {
          fallbackItems.set(rest, { id: rest, data: v });
        }
      }
    }

    const sa = parseServiceAccountFromEnv(this.env);
    if (sa) {
      try {
        const token = await getServiceAccountAccessToken(sa);
        const resp = await fetch(
          `${this.baseUrl}/${collectionPath.replace(/^\/+/, '')}?pageSize=${pageSize}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        if (resp.ok) {
          const json = (await resp.json()) as { documents?: any[] };
          const remote = (json.documents || [])
            .map((d) => this.decodeDoc(d))
            .filter((d): d is { id: string; data: Record<string, any> } => d !== null);
          for (const item of remote) {
            const fb = fallbackItems.get(item.id);
            fallbackItems.set(item.id, fb ? { id: item.id, data: { ...item.data, ...fb.data } } : item);
          }
          return Array.from(fallbackItems.values());
        }
      } catch {
        // Fallback
      }
    }
    try {
      const resp = await fetch(
        `${this.baseUrl}/${collectionPath.replace(/^\/+/, '')}?pageSize=${pageSize}`,
        { headers: { Authorization: this.bearerToken, Accept: 'application/json' } }
      );
      if (!resp.ok) return Array.from(fallbackItems.values());
      const json = (await resp.json()) as { documents?: any[] };
      const remote = (json.documents || [])
        .map((d) => this.decodeDoc(d))
        .filter((d): d is { id: string; data: Record<string, any> } => d !== null);
      for (const item of remote) {
        const fb = fallbackItems.get(item.id);
        fallbackItems.set(item.id, fb ? { id: item.id, data: { ...item.data, ...fb.data } } : item);
      }
      return Array.from(fallbackItems.values());
    } catch {
      return Array.from(fallbackItems.values());
    }
  }
}

async function getAllCoupons(fsHelper: HybridFirestoreHelper): Promise<NormalizedCoupon[]> {
  const byCode = new Map<string, NormalizedCoupon>();

  // 1. Seed from local promo_codes.json + defaults
  const localCodes = loadLocalPromoCodes();
  for (const raw of localCodes) {
    const norm = normalizeCouponRecord(raw);
    if (norm.code) byCode.set(norm.code, norm);
  }

  // 2. Merge live promo code configured in Admin -> Ads (/admin/ads -> Promo code tab)
  //    (placed BEFORE Firestore `coupons/{CODE}` so authoritative Coupon Studio docs always win!)
  try {
    const adsConfig = await loadAdsConfigServer(fsHelper.getEnv());
    if (adsConfig?.promoCode?.code) {
      const p = adsConfig.promoCode;
      const cleanPromoCode = String(p.code).trim().toUpperCase();
      const existing = byCode.get(cleanPromoCode);
      const livePromo = normalizeCouponRecord({
        id: 'ads_promo_active',
        code: cleanPromoCode,
        label: `${p.percentOff}% Off ${p.plans.map((pl) => (pl === 'plus' ? 'Plus' : 'Pro')).join(' & ')}`,
        discount_type: 'percent',
        percent_off: p.percentOff,
        appliesToPlans: p.plans,
        max_redemptions: 100000,
        redemption_count: existing ? existing.redemptionCount : 0,
        is_active: p.active,
        active: p.active,
        expires_at: p.endDate ? `${p.endDate}T23:59:59.999Z` : null,
        updated_at: adsConfig.updatedAt,
      });
      byCode.set(livePromo.code, livePromo);
    }
  } catch {
    // Keep defaults/Firestore coupons on error
  }

  // 3. Merge from Firestore `promoCodes` and `coupons` collections (highest precedence!)
  const [fsPromoCodes, fsCoupons] = await Promise.all([
    fsHelper.listCollection('promoCodes', 200).catch(() => []),
    fsHelper.listCollection('coupons', 200).catch(() => []),
  ]);

  for (const docItem of [...fsPromoCodes, ...fsCoupons]) {
    const norm = normalizeCouponRecord({ id: docItem.id, ...docItem.data });
    if (norm.code) {
      const existing = byCode.get(norm.code);
      if (existing) {
        const mergedCount = Math.max(existing.redemptionCount, norm.redemptionCount);
        norm.redemptionCount = mergedCount;
        norm.redeemedCount = mergedCount;
      }
      byCode.set(norm.code, norm);
    }
  }

  return Array.from(byCode.values());
}

async function getAllRedemptions(
  fsHelper: HybridFirestoreHelper
): Promise<Array<Record<string, any>>> {
  const byId = new Map<string, Record<string, any>>();
  for (const r of loadLocalPromoRedemptions()) {
    if (r && r.id) byId.set(String(r.id), r);
  }
  const [fsPromoReds, fsCouponReds] = await Promise.all([
    fsHelper.listCollection('promoRedemptions', 250).catch(() => []),
    fsHelper.listCollection('couponRedemptions', 250).catch(() => []),
  ]);
  for (const d of [...fsPromoReds, ...fsCouponReds]) {
    byId.set(d.id, { id: d.id, ...d.data });
  }
  return Array.from(byId.values());
}

async function validateCouponForUser(
  fsHelper: HybridFirestoreHelper,
  rawCode: string,
  uid: string,
  planIdRaw?: string | null
): Promise<
  | {
      valid: true;
      coupon: NormalizedCoupon;
      pricing: ReturnType<typeof computeCouponPricingForPlan>;
    }
  | {
      valid: false;
      code: string;
      error: string;
    }
> {
  const cleanCode = String(rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: 'EMPTY_COUPON',
      error: 'Please enter a coupon code.',
    };
  }

  const allCoupons = await getAllCoupons(fsHelper);
  const coupon = allCoupons.find((c) => c.code === cleanCode);

  if (!coupon) {
    return {
      valid: false,
      code: 'INVALID_COUPON',
      error: 'Invalid coupon',
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      code: 'COUPON_INACTIVE',
      error: 'Coupon is no longer active',
    };
  }

  if (coupon.expiresAt) {
    const expMs = new Date(coupon.expiresAt).getTime();
    if (!Number.isNaN(expMs) && expMs <= Date.now()) {
      return {
        valid: false,
        code: 'COUPON_EXPIRED',
        error: 'Coupon expired',
      };
    }
  }

  if (coupon.redemptionCount >= coupon.maxRedemptions) {
    return {
      valid: false,
      code: 'COUPON_MAX_REDEMPTIONS',
      error: 'Coupon has reached its maximum uses',
    };
  }

  const [redemptions, directSubdocRedemption] = await Promise.all([
    getAllRedemptions(fsHelper),
    fsHelper.getDoc(`coupons/${cleanCode}/redemptions/${uid}`).catch(() => null),
  ]);
  const alreadyUsedByUser =
    Boolean(directSubdocRedemption) ||
    redemptions.some((r) => {
      const rCode = String(r.promo_code || r.couponCode || r.code || '').trim().toUpperCase();
      const rUid = String(r.student_id || r.userId || r.uid || '').trim();
      return rCode === cleanCode && rUid === uid;
    });

  if (alreadyUsedByUser) {
    return {
      valid: false,
      code: 'ALREADY_REDEEMED',
      error: 'Coupon already used',
    };
  }

  const plansConfig = await loadPlansConfigServer(fsHelper);
  const targetPlan = getPlanById(planIdRaw, plansConfig);
  if (coupon.appliesTo && coupon.appliesTo !== 'all' && coupon.appliesTo !== targetPlan.id) {
    return {
      valid: false,
      code: 'COUPON_PLAN_MISMATCH',
      error: `Coupon code "${cleanCode}" applies only to ${coupon.appliesTo.replace('_', ' ')}.`,
    };
  }

  if (
    Array.isArray(coupon.appliesToPlans) &&
    coupon.appliesToPlans.length > 0 &&
    !coupon.appliesToPlans.includes(targetPlan.tier as 'pro' | 'plus')
  ) {
    const allowedLabels = coupon.appliesToPlans
      .map((t) => (t === 'plus' ? 'Boardly Plus' : 'Boardly Pro'))
      .join(' and ');
    return {
      valid: false,
      code: 'COUPON_PLAN_MISMATCH',
      error: `Coupon code "${cleanCode}" applies only to ${allowedLabels}.`,
    };
  }

  const pricing = computeCouponPricingForPlan(coupon, targetPlan.id, plansConfig);
  return {
    valid: true,
    coupon,
    pricing,
  };
}

async function recordCouponRedemptionAtomically(
  fsHelper: HybridFirestoreHelper,
  coupon: NormalizedCoupon,
  user: { uid: string; email?: string; name?: string },
  grantedUntilIso: string,
  contextMeta?: { planId?: string; method?: string; discountPkr?: number; discountKobans?: number }
): Promise<{ redemptionId: string; updatedCoupon: NormalizedCoupon }> {
  const nowIso = new Date().toISOString();
  const redemptionId = `red_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const nextCount = coupon.redemptionCount + 1;
  const nextActive = nextCount < coupon.maxRedemptions ? coupon.isActive : false;

  const updatedCoupon: NormalizedCoupon = {
    ...coupon,
    redeemedCount: nextCount,
    redemptionCount: nextCount,
    active: nextActive,
    isActive: nextActive,
    updatedAt: nowIso,
  };

  // 1. Update local promo_codes.json & promo_redemptions.json
  const localCodes = loadLocalPromoCodes();
  const idx = localCodes.findIndex(
    (c) => String(c.code || '').trim().toUpperCase() === coupon.code
  );
  const rawCouponPayload = {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    discount_type: coupon.discountType,
    percent_off: coupon.percentOff,
    amount_off_pkr: coupon.amountOffPkr,
    amount_off_kobans: coupon.amountOffKobans,
    duration_months: coupon.durationMonths,
    duration_days: coupon.durationDays,
    max_redemptions: coupon.maxRedemptions,
    redemption_count: nextCount,
    usedCount: nextCount,
    is_active: nextActive,
    active: nextActive,
    created_by: coupon.createdBy,
    created_at: coupon.createdAt,
    expires_at: coupon.expiresAt,
    updated_at: nowIso,
  };
  if (idx >= 0) {
    localCodes[idx] = { ...localCodes[idx], ...rawCouponPayload };
  } else {
    localCodes.unshift(rawCouponPayload);
  }
  saveLocalPromoCodes(localCodes);

  const redemptionPayload = {
    id: redemptionId,
    promo_code: coupon.code,
    couponCode: coupon.code,
    couponId: coupon.id,
    uid: user.uid,
    userId: user.uid,
    student_id: user.uid,
    student_email: user.email || '',
    student_name: user.name || (user.email ? user.email.split('@')[0] : 'Student'),
    redeemed_at: nowIso,
    createdAt: nowIso,
    granted_until: grantedUntilIso,
    planId: contextMeta?.planId || 'pro_annual',
    method: contextMeta?.method || 'coupon',
    discountPkr: contextMeta?.discountPkr ?? 0,
    discountKobans: contextMeta?.discountKobans ?? 0,
    track: 'Boardly Enrolled Track',
  };

  const localRedemptions = loadLocalPromoRedemptions();
  localRedemptions.unshift(redemptionPayload);
  saveLocalPromoRedemptions(localRedemptions);

  // 2. Mirror to Firestore `promoCodes`, `coupons`, `coupons/{CODE}/redemptions/{uid}`, `promoRedemptions`, and `couponRedemptions`
  await Promise.all([
    fsHelper.setDoc(`promoCodes/${coupon.id}`, rawCouponPayload, true).catch(() => false),
    fsHelper
      .setDoc(
        `coupons/${coupon.code}`,
        { redeemedCount: nextCount, updatedAt: nowIso },
        true
      )
      .catch(() => false),
    fsHelper
      .setDoc(
        `coupons/${coupon.code}/redemptions/${user.uid}`,
        {
          uid: user.uid,
          redeemedAt: nowIso,
          usedOn: contextMeta?.planId || 'pro_annual',
          paymentId: redemptionId,
          discountApplied: contextMeta?.discountPkr ?? contextMeta?.discountKobans ?? 0,
        },
        true
      )
      .catch(() => false),
    fsHelper.setDoc(`promoRedemptions/${redemptionId}`, redemptionPayload, true).catch(() => false),
    fsHelper.setDoc(`couponRedemptions/${redemptionId}`, redemptionPayload, true).catch(() => false),
  ]);

  return { redemptionId, updatedCoupon };
}

function resolvePlanIdFromBody(
  body: Record<string, any>,
  fallback = 'pro_monthly',
  plansConfig?: PlansConfigDoc
): string {
  const rawPlanId = String(body.planId || '').trim().toLowerCase();
  const rawPlan = String(body.plan || '').trim().toLowerCase();
  const directCandidates = [rawPlanId, rawPlan];
  for (const candidate of directCandidates) {
    if (
      candidate === 'pro_monthly' ||
      candidate === 'pro_annual' ||
      candidate === 'plus_monthly' ||
      candidate === 'plus_annual'
    ) {
      return candidate;
    }
  }
  const tierRaw = String(body.tier || body.planTier || rawPlan || '').trim().toLowerCase();
  let isPlus = tierRaw === 'plus' || rawPlanId.includes('plus') || rawPlan.includes('plus');
  const cycle = String(
    body.billingCycle || body.cycle || rawPlan || rawPlanId || ''
  )
    .trim()
    .toLowerCase();
  const isAnnual =
    cycle === 'annual' ||
    cycle === 'yearly' ||
    cycle === 'pro_annual' ||
    cycle === 'plus_annual';
  const isMonthly =
    cycle === 'monthly' ||
    cycle === 'pro_monthly' ||
    cycle === 'plus_monthly';

  // If caller sent { plan: 'monthly' | 'annual', amount } without explicit tier/planId,
  // infer tier by matching against authoritative server catalog prices (never trust amount for pricing).
  const numericAmount = Number(body.amount);
  if (!isPlus && Number.isFinite(numericAmount) && numericAmount > 0) {
    const cfg = plansConfig || DEFAULT_PLANS_CONFIG;
    const plusPlan = getPlanById(isAnnual ? 'plus_annual' : 'plus_monthly', cfg);
    if (numericAmount === plusPlan.price_pkr) {
      isPlus = true;
    }
  }

  if (isAnnual) {
    return isPlus ? 'plus_annual' : 'pro_annual';
  }
  if (isMonthly) {
    return isPlus ? 'plus_monthly' : 'pro_monthly';
  }
  if (isPlus) return 'plus_monthly';
  return fallback;
}

function normalizeFirestoreCouponForActivation(
  code: string,
  raw: Record<string, any> | null | undefined
): CouponDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  // Prefer strict Coupon Studio schema (`type: 'pct' | 'flat' | 'kob'`, `value`, `active`, `redeemedCount`)
  const direct = normalizeCouponDoc(code, raw);
  if (direct) return direct;

  // Fallback support for legacy Firestore coupon docs using `discount_type` / `percent_off` / `is_active`
  const norm = normalizeCouponRecord({ id: code, code, ...raw });
  if (!norm.code) return null;
  let type: CouponDoc['type'] = 'pct';
  let value = norm.percentOff;
  if (norm.discountType === 'fixed_pkr' && norm.amountOffPkr > 0) {
    type = 'flat';
    value = norm.amountOffPkr;
  } else if (norm.discountType === 'fixed_kobans' && norm.amountOffKobans > 0) {
    type = 'kob';
    value = norm.amountOffKobans;
  } else if (norm.discountType === '1_year_free_pro' || norm.discountType === 'free_pro') {
    type = 'pct';
    value = 100;
  }
  if (!Number.isFinite(value) || value <= 0) return null;

  const appliesTo =
    norm.appliesTo === 'all'
      ? Array.isArray(norm.appliesToPlans) && norm.appliesToPlans.length === 1
        ? norm.appliesToPlans[0]
        : 'any'
      : norm.appliesTo;

  const expiresAtMs = norm.expiresAt ? Date.parse(String(norm.expiresAt)) : null;
  return {
    code: norm.code,
    type,
    value,
    appliesTo,
    maxRedemptions: norm.maxRedemptions >= 1_000_000_000 ? null : norm.maxRedemptions,
    redeemedCount: norm.redeemedCount,
    expiresAt: expiresAtMs !== null && !Number.isNaN(expiresAtMs) ? expiresAtMs : null,
    active: norm.active,
    createdAt: null,
    createdBy: norm.createdBy,
  };
}

function resolveCanonicalActivationPlanId(body: Record<string, any>): {
  planId: PaidPlanId;
  billing: 'monthly' | 'annual';
} | null {
  const rawPlanId = String(body.planId ?? body.plan ?? '').trim().toLowerCase();
  const rawBilling = String(body.billing ?? body.billingCycle ?? body.cycle ?? '').trim().toLowerCase();

  if (
    rawPlanId === 'pro_monthly' ||
    rawPlanId === 'pro_annual' ||
    rawPlanId === 'plus_monthly' ||
    rawPlanId === 'plus_annual'
  ) {
    const planBilling = rawPlanId.endsWith('_annual') ? 'annual' : 'monthly';
    if (rawBilling && rawBilling !== 'monthly' && rawBilling !== 'annual' && rawBilling !== 'yearly') {
      return null;
    }
    if (rawBilling) {
      const requestedBilling: 'monthly' | 'annual' =
        rawBilling === 'annual' || rawBilling === 'yearly' ? 'annual' : 'monthly';
      if (requestedBilling !== planBilling) {
        const tier = rawPlanId.startsWith('plus') ? 'plus' : 'pro';
        return {
          planId: `${tier}_${requestedBilling}` as PaidPlanId,
          billing: requestedBilling,
        };
      }
    }
    return { planId: rawPlanId, billing: planBilling };
  }

  if (rawPlanId === 'pro' || rawPlanId === 'plus') {
    if (rawBilling && rawBilling !== 'monthly' && rawBilling !== 'annual' && rawBilling !== 'yearly') {
      return null;
    }
    const billing: 'monthly' | 'annual' =
      rawBilling === 'annual' || rawBilling === 'yearly' ? 'annual' : 'monthly';
    return {
      planId: `${rawPlanId}_${billing}` as PaidPlanId,
      billing,
    };
  }

  return null;
}

export async function handleEconomyApiRequest(context: {
  request: Request;
  env: EconomyEnv;
  tokenVerifierOverride?: (authHeader: string | null | undefined) => Promise<VerifiedFirebaseToken | null>;
  storeOverride?: FirestoreStoreAdapter | null;
  nowMsOverride?: number;
}): Promise<Response> {
  const { request, env, tokenVerifierOverride, storeOverride, nowMsOverride } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
    });
  }

  const url = new URL(request.url);
  const pathClean = url.pathname.replace(/\/+$/, '') || '/';

  // Enforce POST-only on store/Koban/plan activation endpoints before auth check
  if (
    (pathClean === '/api/plan/activate' ||
      pathClean === '/api/admin/plan-repair-pkig' ||
      pathClean === '/api/admin/backfill-starter-inventory' ||
      pathClean === '/api/inventory/equip' ||
      pathClean === '/api/store/purchase' ||
      pathClean === '/api/store/unlock' ||
      pathClean === '/api/store/buy' ||
      pathClean === '/api/kobans/purchase' ||
      pathClean === '/api/pro/purchase-kobans') &&
    request.method !== 'POST'
  ) {
    return jsonResponse(
      {
        ok: false,
        code: 'METHOD_NOT_ALLOWED',
        error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
      },
      405
    );
  }

  const authHeader = request.headers.get('Authorization') || '';
  const projectId =
    env?.FIREBASE_PROJECT_ID ||
    env?.VITE_FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_PROJECT_ID;

  // Check if caller passed a direct guest token or guest session header
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (rawToken.startsWith('guest_') || request.headers.get('X-Guest-Session')) {
    return jsonResponse(
      {
        ok: false,
        code: 'GUEST_FORBIDDEN',
        error: 'Guest accounts cannot perform purchases or redeem coupons. Please create a registered account.',
      },
      403
    );
  }

  let verifiedUser: VerifiedFirebaseToken | null = null;
  try {
    const verifyFn =
      tokenVerifierOverride ||
      ((hdr: string | null | undefined) => verifyFirebaseIdToken(hdr, projectId, env));
    verifiedUser = await verifyFn(authHeader);
  } catch {
    return jsonResponse(
      {
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Please sign in again',
      },
      401
    );
  }

  if (!verifiedUser || !verifiedUser.uid) {
    return jsonResponse(
      {
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Please sign in again',
      },
      401
    );
  }

  if (verifiedUser.uid.startsWith('guest_')) {
    return jsonResponse(
      {
        ok: false,
        code: 'GUEST_FORBIDDEN',
        error: 'Guest accounts cannot perform purchases or redeem coupons. Please create a registered account.',
      },
      403
    );
  }

  const fsHelper = new HybridFirestoreHelper(env, authHeader, storeOverride);
  const isAdmin = isAdminTokenClaim(verifiedUser, env);

  // ==========================================================================
  // 0. ACTIVATE PLAN WITH COUPON (ATOMIC SERVER TRANSACTION): POST /api/plan/activate
  // ==========================================================================
  if (pathClean === '/api/plan/activate' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const resolvedPlan = resolveCanonicalActivationPlanId(body);
    if (!resolvedPlan) {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: 'Invalid plan or billing cycle.',
        },
        400
      );
    }

    const cleanCode = normalizeCouponCode(body.couponCode ?? body.code);
    if (!cleanCode) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_COUPON',
          error: 'Invalid coupon',
        },
        400
      );
    }

    const rawIdem = String(
      body.idempotencyKey ?? request.headers.get('X-Idempotency-Key') ?? ''
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    const nowMs =
      typeof nowMsOverride === 'number' && Number.isFinite(nowMsOverride)
        ? nowMsOverride
        : Date.now();
    const safeIdempotencyKey =
      rawIdem || `act_${nowMs}_${Math.random().toString(36).slice(2, 10)}`;
    const uid = verifiedUser.uid;
    const activationDocKey = `${uid}_${safeIdempotencyKey}`;
    const inFlightKey = `plan_activate:${activationDocKey}`;

    if (rawIdem && completedEconomyPurchases.has(inFlightKey)) {
      return jsonResponse({
        ...completedEconomyPurchases.get(inFlightKey)!,
        idempotentReplay: true,
      });
    }

    if (inFlightEconomyPurchases.has(inFlightKey)) {
      return jsonResponse(
        {
          ok: false,
          code: 'ACTIVATION_IN_PROGRESS',
          error: 'Activation is already in progress. Please wait a moment.',
        },
        409
      );
    }

    inFlightEconomyPurchases.add(inFlightKey);
    try {
      const txResult = await fsHelper.runAtomicTransaction(async (tx) => {
        // 1. Idempotency check inside the atomic transaction: same key returns stored activation without re-running
        if (rawIdem) {
          const existingActivation = await tx.getDoc(`planActivations/${activationDocKey}`);
          if (existingActivation && existingActivation.uid === uid && existingActivation.responsePayload) {
            return {
              ...(existingActivation.responsePayload as Record<string, any>),
              idempotentReplay: true,
            };
          }
        }

        // 2. Read authoritative plans config, coupon doc, per-user redemption doc, and user doc inside ONE transaction
        const [plansDocRaw, couponDocRaw, userRedemptionDoc, userDoc] = await Promise.all([
          tx.getDoc('config/plans'),
          tx.getDoc(`coupons/${cleanCode}`),
          tx.getDoc(`coupons/${cleanCode}/redemptions/${uid}`),
          tx.getDoc(`users/${uid}`),
        ]);

        const plansConfig = normalizePlansConfig(plansDocRaw);
        const plan = getPlanById(resolvedPlan.planId, plansConfig);
        const itemPricing = resolveCheckoutItemPricing(plan.id, plansConfig);
        const couponDoc = normalizeFirestoreCouponForActivation(cleanCode, couponDocRaw);

        // 3. Re-validate coupon strictly on the server (exists, active, not expired, usage limit, not used by user, appliesTo)
        //    and recalculate authoritative price & discount on the server (never trust client price/discount).
        const evaluation = evaluateCouponEligibility({
          coupon: couponDoc,
          alreadyRedeemedByUser: Boolean(userRedemptionDoc),
          itemKey: plan.id,
          basePkr: itemPricing.basePkr,
          baseKobans: itemPricing.baseKobans,
          kobansPerPkr: itemPricing.kobansPerPkr,
          nowMs,
        });

        if (!evaluation.valid) {
          const errorMap: Record<
            typeof evaluation.code,
            { status: number; message: string }
          > = {
            ALREADY_USED: { status: 409, message: 'Coupon already used' },
            EXPIRED: { status: 400, message: 'Coupon expired' },
            FULLY_CLAIMED: { status: 409, message: 'This coupon is fully claimed' },
            WRONG_ITEM: { status: 400, message: 'Not valid for this item' },
            INVALID_COUPON: { status: 400, message: 'Invalid coupon' },
          };
          const mapped = errorMap[evaluation.code];
          throw new PlanActivationHttpError(mapped.status, evaluation.code, mapped.message);
        }

        const { coupon, breakdown } = evaluation;
        if (!breakdown.isFreeActivation || breakdown.finalPkr !== 0 || breakdown.finalKobans !== 0) {
          throw new PlanActivationHttpError(
            400,
            'PAYMENT_REQUIRED',
            'This coupon does not cover the full plan price. Choose a payment method to continue.'
          );
        }

        // 4. Verify plan eligibility & compute authoritative PKT expiry via THE ONE shared function
        //    (no stacking or converting leftover days from another plan)
        const currentTier = getPlan(userDoc, nowMs);
        const targetTier = getPlanTierFromPlanId(plan.id);
        if (currentTier === 'plus' && targetTier === 'pro') {
          throw new PlanActivationHttpError(
            409,
            'PLUS_ALREADY_INCLUDES_PRO',
            PLUS_ALREADY_INCLUDES_PRO_MSG
          );
        }

        const currentExpiryRaw =
          targetTier === 'plus'
            ? (userDoc?.plusUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? userDoc?.proUntil ?? null)
            : (userDoc?.proUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? null);

        const extension = calculatePlanExpiryPkt({
          currentTier,
          targetTier,
          currentExpiryRaw,
          purchasedDays: plan.duration_days,
          nowMs,
        });

        const proCreditDays = 0;
        const totalDurationDays = extension.daysAdded;
        const nowIso = new Date(nowMs).toISOString();
        const newExpiryIso = extension.newExpiryIso;
        const previousExpiryIso = extension.previousExpiryMs
          ? new Date(extension.previousExpiryMs).toISOString()
          : null;
        const nextRedeemedCount = coupon.redeemedCount + 1;
        const activationId = `act_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;

        const responsePayload: Record<string, any> = {
          ok: true,
          activated: true,
          activatedPro: true,
          activatedPlus: targetTier === 'plus',
          idempotentReplay: false,
          activationId,
          redemptionId: activationId,
          planId: plan.id,
          planTier: targetTier,
          billing: resolvedPlan.billing,
          planName: plan.name,
          durationDays: totalDurationDays,
          daysAdded: totalDurationDays,
          proCreditDays,
          wasExtension: extension.isSameTierExtension,
          upgradedFromPro: extension.replacesActivePro,
          replacedProDaysRemaining: extension.replacedProDaysRemaining,
          previousTier: currentTier,
          previousExpiryIso,
          previousExpiryLabel: extension.previousExpiryLabel,
          startedAtMs: nowMs,
          startedAtIso: nowIso,
          newExpiryMs: extension.newExpiryMs,
          newExpiryIso,
          newExpiryLabel: extension.newExpiryLabel,
          originalPkr: breakdown.originalPkr,
          discountPkr: breakdown.discountPkr,
          finalPkr: 0,
          originalKobans: breakdown.originalKobans,
          discountKobans: breakdown.discountKobans,
          finalKobans: 0,
          coupon: {
            id: coupon.code,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            appliesTo: coupon.appliesTo,
            redeemedCount: nextRedeemedCount,
            redemptionCount: nextRedeemedCount,
            maxRedemptions: coupon.maxRedemptions,
          },
        };

        // 5. Execute ALL writes in ONE atomic Firestore transaction:
        //    (a) Activate subscription on users/{uid}
        tx.setDoc(
          `users/${uid}`,
          {
            uid,
            plan: targetTier,
            tier: targetTier,
            planTier: targetTier,
            isPremium: true,
            isPro: targetTier === 'pro',
            isPlus: targetTier === 'plus',
            planId: plan.id,
            proPlanId: targetTier === 'pro' ? plan.id : null,
            plusPlanId: targetTier === 'plus' ? plan.id : null,
            premiumSource: 'coupon',
            appliedCouponCode: coupon.code,
            AppliedCouponCode: coupon.code,
            planStartedAt: nowIso,
            planExpiresAt: newExpiryIso,
            premiumExpiresAt: extension.newExpiryMs,
            proUntil: targetTier === 'pro' ? newExpiryIso : null,
            plusUntil: targetTier === 'plus' ? newExpiryIso : null,
            updatedAt: nowIso,
          },
          true
        );

        //    (b) Record per-user coupon redemption with exists:false precondition (atomic once-per-account)
        tx.createDoc(`coupons/${coupon.code}/redemptions/${uid}`, {
          uid,
          redeemedAt: nowIso,
          usedOn: plan.id,
          paymentId: activationId,
          discountApplied: breakdown.discountApplied,
          couponCode: coupon.code,
          planId: plan.id,
          planTier: targetTier,
          billing: resolvedPlan.billing,
          originalPkr: breakdown.originalPkr,
          discountPkr: breakdown.discountPkr,
          finalPkr: 0,
        });

        //    (c) Increment coupon redeemedCount atomically
        tx.setDoc(
          `coupons/${coupon.code}`,
          {
            redeemedCount: nextRedeemedCount,
            updatedAt: nowIso,
          },
          true
        );

        //    (d) Record atomic idempotency + subscription history entry
        tx.createDoc(`planActivations/${activationDocKey}`, {
          id: activationId,
          idempotencyKey: safeIdempotencyKey,
          uid,
          source: 'coupon',
          planId: plan.id,
          planTier: targetTier,
          billing: resolvedPlan.billing,
          planName: plan.name,
          couponCode: coupon.code,
          originalPkr: breakdown.originalPkr,
          discountPkr: breakdown.discountPkr,
          finalPkr: 0,
          durationDays: totalDurationDays,
          daysAdded: totalDurationDays,
          proCreditDays: 0,
          previousTier: currentTier,
          previousExpiryIso,
          wasExtension: extension.isSameTierExtension,
          upgradedFromPro: extension.replacesActivePro,
          replacedProDaysRemaining: extension.replacedProDaysRemaining,
          startedAtIso: nowIso,
          newExpiryMs: extension.newExpiryMs,
          newExpiryIso,
          newExpiryLabel: extension.newExpiryLabel,
          responsePayload,
          createdAt: nowIso,
        });

        return responsePayload;
      });

      if (rawIdem) {
        completedEconomyPurchases.set(inFlightKey, txResult);
      }
      return jsonResponse(txResult, 200);
    } catch (err: any) {
      if (err instanceof PlanActivationHttpError) {
        return jsonResponse(
          {
            ok: false,
            code: err.code,
            error: err.message,
            message: err.message,
          },
          err.status
        );
      }
      console.error('[PlanActivation] Atomic activation failed:', {
        uid,
        planId: resolvedPlan.planId,
        couponCode: cleanCode,
        error: err?.message || String(err),
      });
      return jsonResponse(
        {
          ok: false,
          code: 'ACTIVATION_FAILED',
          error: "Couldn't activate. Try again",
        },
        500
      );
    } finally {
      inFlightEconomyPurchases.delete(inFlightKey);
    }
  }

  // ==========================================================================
  // 1. VALIDATE COUPON: POST /api/coupons/validate (or /api/pro/coupon/validate)
  // ==========================================================================
  if (
    (pathClean === '/api/coupons/validate' || pathClean === '/api/pro/coupon/validate') &&
    request.method === 'POST'
  ) {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const code = String(body.code || body.couponCode || '').trim().toUpperCase();
    const plansConfigForPlan = await loadPlansConfigServer(fsHelper);
    const planId = resolvePlanIdFromBody(body, 'pro_monthly', plansConfigForPlan);

    const validation = await validateCouponForUser(fsHelper, code, verifiedUser.uid, planId);
    if (!validation.valid) {
      return jsonResponse(
        {
          ok: false,
          valid: false,
          code: validation.code,
          error: validation.error,
          message: validation.error,
        },
        400
      );
    }

    const discountValue =
      validation.coupon.discountType === 'fixed_pkr'
        ? validation.coupon.amountOffPkr
        : validation.coupon.discountType === 'fixed_kobans'
          ? validation.coupon.amountOffKobans
          : validation.coupon.percentOff;

    return jsonResponse({
      ok: true,
      valid: true,
      discountType: validation.coupon.discountType,
      discountValue,
      finalPrice: validation.pricing.finalPkr,
      finalKobans: validation.pricing.finalKobans,
      message: 'Coupon applied',
      ...validation.pricing,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        label: validation.coupon.label,
        discountType: validation.coupon.discountType,
        discountValue,
        percentOff: validation.coupon.percentOff,
        amountOffPkr: validation.coupon.amountOffPkr,
        amountOffKobans: validation.coupon.amountOffKobans,
        durationMonths: validation.coupon.durationMonths,
        durationDays: validation.coupon.durationDays,
        maxRedemptions: validation.coupon.maxRedemptions,
        redemptionCount: validation.coupon.redemptionCount,
        finalPrice: validation.pricing.finalPkr,
        message: 'Coupon applied',
        ...validation.pricing,
      },
    });
  }

  // ==========================================================================
  // 2. REDEEM COUPON: POST /api/coupons/redeem (or /api/pro/coupon/redeem)
  // ==========================================================================
  if (
    (pathClean === '/api/coupons/redeem' || pathClean === '/api/pro/coupon/redeem') &&
    request.method === 'POST'
  ) {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const code = String(body.code || body.couponCode || '').trim().toUpperCase();
    const plansConfigForPlan = await loadPlansConfigServer(fsHelper);
    const planId = resolvePlanIdFromBody(body, 'pro_annual', plansConfigForPlan);

    const validation = await validateCouponForUser(fsHelper, code, verifiedUser.uid, planId);
    if (!validation.valid) {
      return jsonResponse(
        {
          ok: false,
          valid: false,
          code: validation.code,
          error: validation.error,
          message: validation.error,
        },
        400
      );
    }

    const { coupon, pricing } = validation;

    // If this is a 100%-off / Free grant coupon, activate atomically via the SAME single transaction + PKT calculator
    if (pricing.isFreeGrant) {
      const nowMs =
        typeof nowMsOverride === 'number' && Number.isFinite(nowMsOverride)
          ? nowMsOverride
          : Date.now();
      const rawIdem = String(
        body.idempotencyKey ?? request.headers.get('X-Idempotency-Key') ?? ''
      )
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 80);
      const safeIdem = rawIdem || `redeem_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;
      const uid = verifiedUser.uid;
      const activationDocKey = `${uid}_${safeIdem}`;

      try {
        const txResult = await fsHelper.runAtomicTransaction(async (tx) => {
          if (rawIdem) {
            const existingActivation = await tx.getDoc(`planActivations/${activationDocKey}`);
            if (existingActivation && existingActivation.uid === uid && existingActivation.responsePayload) {
              return {
                ...(existingActivation.responsePayload as Record<string, any>),
                idempotentReplay: true,
              };
            }
          }

          const [couponDocRaw, userRedemptionDoc, userDoc] = await Promise.all([
            tx.getDoc(`coupons/${coupon.code}`),
            tx.getDoc(`coupons/${coupon.code}/redemptions/${uid}`),
            tx.getDoc(`users/${uid}`),
          ]);

          if (userRedemptionDoc) {
            throw new PlanActivationHttpError(409, 'ALREADY_USED', 'Coupon already used');
          }

          const currentTier = getPlan(userDoc, nowMs);
          const targetTier = getPlanTierFromPlanId(pricing.planId);
          if (currentTier === 'plus' && targetTier === 'pro') {
            throw new PlanActivationHttpError(
              409,
              'PLUS_ALREADY_INCLUDES_PRO',
              PLUS_ALREADY_INCLUDES_PRO_MSG
            );
          }

          const currentExpiryRaw =
            targetTier === 'plus'
              ? (userDoc?.plusUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? userDoc?.proUntil ?? null)
              : (userDoc?.proUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? null);

          const extension = calculatePlanExpiryPkt({
            currentTier,
            targetTier,
            currentExpiryRaw,
            purchasedDays: pricing.effectiveDurationDays,
            nowMs,
          });

          const nowIso = new Date(nowMs).toISOString();
          const newExpiryIso = extension.newExpiryIso;
          const previousExpiryIso = extension.previousExpiryMs
            ? new Date(extension.previousExpiryMs).toISOString()
            : null;
          const currentRedeemedCount = Number(
            couponDocRaw?.redeemedCount ?? couponDocRaw?.redemptionCount ?? coupon.redemptionCount ?? 0
          );
          const nextRedeemedCount = currentRedeemedCount + 1;
          const redemptionId = `act_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;

          const responsePayload: Record<string, any> = {
            ok: true,
            activatedPro: true,
            activatedPlus: targetTier === 'plus',
            planTier: targetTier,
            proCreditDays: 0,
            redemptionId,
            planId: pricing.planId,
            planName: pricing.planName,
            durationDays: extension.daysAdded,
            daysAdded: extension.daysAdded,
            wasExtension: extension.isSameTierExtension,
            upgradedFromPro: extension.replacesActivePro,
            previousExpiryIso,
            newExpiryMs: extension.newExpiryMs,
            newExpiryIso,
            newExpiryLabel: extension.newExpiryLabel,
            coupon: {
              code: coupon.code,
              label: coupon.label,
              redemptionCount: nextRedeemedCount,
              maxRedemptions: coupon.maxRedemptions,
            },
          };

          tx.setDoc(
            `users/${uid}`,
            {
              uid,
              plan: targetTier,
              tier: targetTier,
              planTier: targetTier,
              isPremium: true,
              isPro: targetTier === 'pro',
              isPlus: targetTier === 'plus',
              planId: pricing.planId,
              proPlanId: targetTier === 'pro' ? pricing.planId : null,
              plusPlanId: targetTier === 'plus' ? pricing.planId : null,
              premiumSource: 'coupon',
              appliedCouponCode: coupon.code,
              AppliedCouponCode: coupon.code,
              planStartedAt: nowIso,
              planExpiresAt: newExpiryIso,
              premiumExpiresAt: extension.newExpiryMs,
              proUntil: targetTier === 'pro' ? newExpiryIso : null,
              plusUntil: targetTier === 'plus' ? newExpiryIso : null,
              updatedAt: nowIso,
            },
            true
          );

          tx.createDoc(`coupons/${coupon.code}/redemptions/${uid}`, {
            uid,
            redeemedAt: nowIso,
            usedOn: pricing.planId,
            paymentId: redemptionId,
            discountApplied: pricing.discountPkr,
            couponCode: coupon.code,
            planId: pricing.planId,
            planTier: targetTier,
            billing: getBillingFromPlanId(pricing.planId),
            originalPkr: pricing.originalPkr,
            discountPkr: pricing.discountPkr,
            finalPkr: 0,
          });

          tx.setDoc(
            `coupons/${coupon.code}`,
            {
              redeemedCount: nextRedeemedCount,
              updatedAt: nowIso,
            },
            true
          );

          tx.createDoc(`planActivations/${activationDocKey}`, {
            id: redemptionId,
            idempotencyKey: safeIdem,
            uid,
            source: 'coupon',
            planId: pricing.planId,
            planTier: targetTier,
            billing: getBillingFromPlanId(pricing.planId),
            planName: pricing.planName,
            couponCode: coupon.code,
            originalPkr: pricing.originalPkr,
            discountPkr: pricing.discountPkr,
            finalPkr: 0,
            durationDays: extension.daysAdded,
            daysAdded: extension.daysAdded,
            proCreditDays: 0,
            previousTier: currentTier,
            previousExpiryIso,
            wasExtension: extension.isSameTierExtension,
            upgradedFromPro: extension.replacesActivePro,
            startedAtIso: nowIso,
            newExpiryMs: extension.newExpiryMs,
            newExpiryIso,
            newExpiryLabel: extension.newExpiryLabel,
            responsePayload,
            createdAt: nowIso,
          });

          return responsePayload;
        });

        return jsonResponse(txResult, 200);
      } catch (err: any) {
        if (err instanceof PlanActivationHttpError) {
          return jsonResponse(
            { ok: false, code: err.code, error: err.message, message: err.message },
            err.status
          );
        }
        return jsonResponse(
          { ok: false, code: 'ACTIVATION_FAILED', error: "Couldn't activate. Try again" },
          500
        );
      }
    }

    // For partial-discount coupons, return the validated discount breakdown ready for checkout
    return jsonResponse({
      ok: true,
      activatedPro: false,
      ...pricing,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        label: coupon.label,
        discountType: coupon.discountType,
        percentOff: coupon.percentOff,
        ...pricing,
      },
    });
  }

  // ==========================================================================
  // 3. SUBMIT JAZZCASH/OPAY PAYMENT: POST /api/pro/submit-payment
  // ==========================================================================
  if (pathClean === '/api/pro/submit-payment' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;

    // If caller only asked for pre-flight purchase guard check (no transactionId yet), delegate or validate
    const rawTid = String(body.transactionId || body.tid || '').trim();
    if (!rawTid && body.commitLock !== true) {
      return jsonResponse({
        ok: true,
        code: 'PURCHASE_ALLOWED',
        state: 'none',
        canStartPurchase: true,
        serverNowMs: Date.now(),
      });
    }

    const normalizedTid = rawTid.replace(/\s+/g, '');
    if (normalizedTid.length < 6) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_TID',
          error: 'Please enter a valid Transaction ID (at least 6 characters).',
        },
        400
      );
    }

    const plansConfig = await loadPlansConfigServer(fsHelper);
    const plan = getPlanById(resolvePlanIdFromBody(body, 'pro_monthly'), plansConfig);
    const targetTier = plan.tier;
    const nowMs = Date.now();
    const userDocForGuard = await fsHelper.getDoc(`users/${verifiedUser.uid}`);
    const currentTierForGuard = getPlan(userDocForGuard, nowMs);
    if (currentTierForGuard === 'plus' && targetTier === 'pro') {
      return jsonResponse(
        {
          ok: false,
          code: 'PLUS_ALREADY_INCLUDES_PRO',
          error: PLUS_ALREADY_INCLUDES_PRO_MSG,
        },
        409
      );
    }

    const proCreditDaysPreview = 0;
    const upgradedFromPro = currentTierForGuard === 'pro' && targetTier === 'plus';

    const couponCode = String(body.couponCode || '').trim().toUpperCase();
    let finalAmountPkr = plan.price_pkr;
    let discountPkr = 0;
    let validatedCoupon: NormalizedCoupon | null = null;

    if (couponCode) {
      const couponCheck = await validateCouponForUser(
        fsHelper,
        couponCode,
        verifiedUser.uid,
        plan.id
      );
      if (!couponCheck.valid) {
        return jsonResponse(
          {
            ok: false,
            code: couponCheck.code,
            error: couponCheck.error,
          },
          400
        );
      }
      validatedCoupon = couponCheck.coupon;
      finalAmountPkr = couponCheck.pricing.finalPkr;
      discountPkr = couponCheck.pricing.discountPkr;
    }

    // Check duplicate TID across paymentRequests and kobanRequests server-side
    const [existingPlanReqs, existingKobanReqs] = await Promise.all([
      fsHelper.listCollection('paymentRequests', 250).catch(() => []),
      fsHelper.listCollection('kobanRequests', 250).catch(() => []),
    ]);

    const duplicateInPlans = existingPlanReqs.find((r) => {
      const t = String(r.data.transactionId || r.data.TID || '').trim();
      const st = String(r.data.status || '').toLowerCase();
      return t === normalizedTid && st !== 'rejected';
    });
    if (duplicateInPlans) {
      return jsonResponse(
        {
          ok: false,
          code: 'DUPLICATE_TID',
          error: 'This Transaction ID has already been submitted for verification.',
        },
        409
      );
    }

    const duplicateInKobans = existingKobanReqs.find((r) => {
      const t = String(r.data.transactionId || r.data.TID || '').trim();
      const st = String(r.data.status || '').toLowerCase();
      return t === normalizedTid && st !== 'rejected';
    });
    if (duplicateInKobans) {
      return jsonResponse(
        {
          ok: false,
          code: 'DUPLICATE_TID',
          error: 'This Transaction ID has already been used for a Koban purchase.',
        },
        409
      );
    }

    // Also check if user already has a pending payment request
    const userPending = existingPlanReqs.find((r) => {
      const rUid = String(r.data.userId || r.data.uid || '');
      const st = String(r.data.status || '').toLowerCase();
      const pl = String(r.data.plan || '').toLowerCase();
      return rUid === verifiedUser.uid && st === 'pending' && pl === plan.id && !r.data.crewId;
    });
    if (userPending && !body.allowReplacePending) {
      // Allow submitting if TID is different, or update pending doc
    }

    const nowIso = new Date(nowMs).toISOString();
    const requestId = `pay_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;
    const methodClean = String(body.paymentMethod || body.method || 'jazzcash').toLowerCase();

    const paymentDocPayload: Record<string, any> = {
      id: requestId,
      uid: verifiedUser.uid,
      userId: verifiedUser.uid,
      userEmail: String(body.userEmail || verifiedUser.email || '').toLowerCase(),
      userName: String(
        body.userName ||
          verifiedUser.name ||
          (verifiedUser.email ? verifiedUser.email.split('@')[0] : 'Student')
      ),
      plan: plan.id,
      planId: plan.id,
      planTier: targetTier,
      planName: plan.name,
      durationDays: plan.duration_days,
      durationMonths: getBillingFromPlanId(plan.id) === 'annual' ? 12 : 1,
      upgradedFromPro,
      proCreditDaysPreview,
      amount: finalAmountPkr,
      amount_pkr: finalAmountPkr,
      originalAmountPkr: plan.price_pkr,
      discountPkr,
      couponCode: validatedCoupon ? validatedCoupon.code : null,
      method: methodClean,
      TID: normalizedTid,
      transactionId: normalizedTid,
      senderNumber: String(body.senderPhone || body.senderNumber || '').trim(),
      screenshotUrl: body.screenshotUrl ? String(body.screenshotUrl).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      status: 'pending',
      submittedAt: nowIso,
      createdAt: nowIso,
    };

    const wroteOnServer = await fsHelper.setDoc(
      `paymentRequests/${requestId}`,
      paymentDocPayload,
      true
    );

    if (validatedCoupon) {
      const approxExpiryIso = calculatePlanExpiryPkt({
        currentTier: currentTierForGuard,
        targetTier,
        currentExpiryRaw:
          targetTier === 'plus'
            ? (userDocForGuard?.plusUntil ?? userDocForGuard?.planExpiresAt ?? null)
            : (userDocForGuard?.proUntil ?? userDocForGuard?.planExpiresAt ?? null),
        purchasedDays: plan.duration_days,
        nowMs,
      }).newExpiryIso;
      await recordCouponRedemptionAtomically(
        fsHelper,
        validatedCoupon,
        verifiedUser,
        approxExpiryIso,
        {
          planId: plan.id,
          method: methodClean,
          discountPkr,
        }
      );
    }

    return jsonResponse({
      ok: true,
      requestId,
      planTier: targetTier,
      proCreditDaysPreview,
      amountPkr: finalAmountPkr,
      originalAmountPkr: plan.price_pkr,
      discountPkr,
      couponCode: validatedCoupon ? validatedCoupon.code : null,
      wroteOnServer,
      paymentRequest: paymentDocPayload,
    });
  }

  // ==========================================================================
  // 4. BUY PRO WITH KOBANS: POST /api/pro/purchase-kobans
  // ==========================================================================
  if (pathClean === '/api/pro/purchase-kobans') {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
        },
        405
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const rawPlanInput = body.planId ?? body.billingCycle ?? body.cycle;
    if (
      rawPlanInput !== undefined &&
      rawPlanInput !== null &&
      typeof rawPlanInput === 'string' &&
      rawPlanInput.trim() !== '' &&
      ![
        'pro_monthly',
        'pro_annual',
        'plus_monthly',
        'plus_annual',
        'monthly',
        'annual',
        'yearly',
      ].includes(rawPlanInput.trim().toLowerCase())
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: `Invalid plan ID "${rawPlanInput}". Expected "pro_monthly", "pro_annual", "plus_monthly", or "plus_annual".`,
        },
        400
      );
    }

    const plansConfig = await loadPlansConfigServer(fsHelper);
    const plan = getPlanById(resolvePlanIdFromBody(body, 'pro_monthly'), plansConfig);
    const targetTier = plan.tier;
    const couponCode = String(body.couponCode || '').trim().toUpperCase();
    const rawIdempotency = String(
      body.idempotencyKey || request.headers.get('X-Idempotency-Key') || ''
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const proCacheKey = rawIdempotency ? `plan:${verifiedUser.uid}:${rawIdempotency}` : '';

    if (proCacheKey && completedEconomyPurchases.has(proCacheKey)) {
      return jsonResponse({
        ...completedEconomyPurchases.get(proCacheKey)!,
        alreadyProcessed: true,
      });
    }
    if (proCacheKey && inFlightEconomyPurchases.has(proCacheKey)) {
      return jsonResponse(
        {
          ok: false,
          code: 'PURCHASE_IN_PROGRESS',
          error: `Your ${plan.name} purchase is already being processed. Please wait.`,
        },
        409
      );
    }
    if (proCacheKey) {
      inFlightEconomyPurchases.add(proCacheKey);
    }

    const uid = verifiedUser.uid;
    const nowMs =
      typeof nowMsOverride === 'number' && Number.isFinite(nowMsOverride)
        ? nowMsOverride
        : Date.now();
    const safeIdempotency =
      rawIdempotency || `koban_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;
    const ledgerId = `${targetTier}_koban_${safeIdempotency}`;
    const activationDocKey = `${uid}_${ledgerId}`;

    try {
      const txResult = await fsHelper.runAtomicTransaction(async (tx) => {
        // 1. Idempotency check inside ONE atomic transaction
        if (rawIdempotency) {
          const [existingLedgerDoc, existingActivationDoc] = await Promise.all([
            tx.getDoc(`wallets/${uid}/ledger/${ledgerId}`),
            tx.getDoc(`planActivations/${activationDocKey}`),
          ]);
          if (existingActivationDoc?.responsePayload) {
            return {
              ...(existingActivationDoc.responsePayload as Record<string, any>),
              alreadyProcessed: true,
              idempotentReplay: true,
            };
          }
          if (existingLedgerDoc) {
            return {
              ok: true,
              alreadyProcessed: true,
              idempotentReplay: true,
              planId: existingLedgerDoc.planId || plan.id,
              planTier: existingLedgerDoc.planTier || targetTier,
              planName: existingLedgerDoc.planName || plan.name,
              durationDays: Number(existingLedgerDoc.durationDays || plan.duration_days),
              daysAdded: Number(existingLedgerDoc.durationDays || plan.duration_days),
              proCreditDays: 0,
              kobansSpent: Math.abs(Number(existingLedgerDoc.amount ?? plan.price_kobans)),
              discountKobans: Number(existingLedgerDoc.discountKobans ?? 0),
              balanceBefore: Number(existingLedgerDoc.balanceBefore ?? 0),
              newBalance: Number(existingLedgerDoc.balanceAfter ?? 0),
              wasExtension: Boolean(existingLedgerDoc.wasExtension),
              upgradedFromPro: Boolean(existingLedgerDoc.upgradedFromPro),
              previousExpiryLabel: existingLedgerDoc.previousExpiryLabel || null,
              newExpiryMs: Number(existingLedgerDoc.newExpiryMs || nowMs),
              newExpiryIso: String(existingLedgerDoc.newExpiryIso || new Date(nowMs).toISOString()),
              newExpiryLabel: String(existingLedgerDoc.newExpiryLabel || 'Active'),
              ledgerId,
            };
          }
        }

        // 2. Read authoritative plans config, wallet, user, and optional coupon inside ONE transaction
        const cleanCouponCode = normalizeCouponCode(couponCode);
        const [plansDocRaw, walletDoc, userDoc, couponDocRaw, userRedemptionDoc] = await Promise.all([
          tx.getDoc('config/plans'),
          tx.getDoc(`wallets/${uid}`),
          tx.getDoc(`users/${uid}`),
          cleanCouponCode ? tx.getDoc(`coupons/${cleanCouponCode}`) : Promise.resolve(null),
          cleanCouponCode
            ? tx.getDoc(`coupons/${cleanCouponCode}/redemptions/${uid}`)
            : Promise.resolve(null),
        ]);

        const livePlansConfig = normalizePlansConfig(plansDocRaw);
        const livePlan = getPlanById(plan.id, livePlansConfig);
        const activeTier = getPlan(userDoc, nowMs);

        // Block buying Pro while Plus is active
        if (activeTier === 'plus' && targetTier === 'pro') {
          throw new PlanActivationHttpError(
            409,
            'PLUS_ALREADY_INCLUDES_PRO',
            PLUS_ALREADY_INCLUDES_PRO_MSG
          );
        }

        let finalKobansCost = livePlan.price_kobans;
        let discountKobans = 0;
        let validatedCouponDoc: CouponDoc | null = null;
        let couponDiscountApplied = 0;

        if (cleanCouponCode) {
          const itemPricing = resolveCheckoutItemPricing(livePlan.id, livePlansConfig);
          const normalizedCoupon = normalizeFirestoreCouponForActivation(cleanCouponCode, couponDocRaw);
          const evaluation = evaluateCouponEligibility({
            coupon: normalizedCoupon,
            alreadyRedeemedByUser: Boolean(userRedemptionDoc),
            itemKey: livePlan.id,
            basePkr: itemPricing.basePkr,
            baseKobans: itemPricing.baseKobans,
            kobansPerPkr: itemPricing.kobansPerPkr,
            nowMs,
          });
          if (!evaluation.valid) {
            const errStatus = evaluation.code === 'ALREADY_USED' || evaluation.code === 'FULLY_CLAIMED' ? 409 : 400;
            const errMsg =
              evaluation.code === 'ALREADY_USED'
                ? 'Coupon already used'
                : evaluation.code === 'EXPIRED'
                  ? 'Coupon expired'
                  : evaluation.error;
            throw new PlanActivationHttpError(errStatus, evaluation.code, errMsg);
          }
          validatedCouponDoc = evaluation.coupon;
          finalKobansCost = evaluation.breakdown.finalKobans;
          discountKobans = evaluation.breakdown.discountKobans;
          couponDiscountApplied = evaluation.breakdown.discountApplied;
        }

        const walletBal =
          walletDoc && typeof walletDoc.balance === 'number' && Number.isFinite(walletDoc.balance)
            ? Math.max(0, Math.floor(walletDoc.balance))
            : 0;
        const userKobans =
          userDoc && typeof userDoc.kobans === 'number' && Number.isFinite(userDoc.kobans)
            ? Math.max(0, Math.floor(userDoc.kobans))
            : 0;
        const userKobanBal =
          userDoc && typeof userDoc.kobanBalance === 'number' && Number.isFinite(userDoc.kobanBalance)
            ? Math.max(0, Math.floor(userDoc.kobanBalance))
            : 0;
        const currentBalance = Math.max(walletBal, userKobans, userKobanBal);

        if (!isAdmin && currentBalance < finalKobansCost) {
          throw new PlanActivationHttpError(
            402,
            'INSUFFICIENT_KOBANS',
            `Insufficient Kobans. You need ${finalKobansCost.toLocaleString()} Kobans (you have ${currentBalance.toLocaleString()}).`
          );
        }

        const newBalance =
          isAdmin && currentBalance < finalKobansCost ? currentBalance : currentBalance - finalKobansCost;
        const currentExpiryRaw =
          targetTier === 'plus'
            ? (userDoc?.plusUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? userDoc?.proUntil ?? null)
            : (userDoc?.proUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? null);

        // 3. Calculate expiry via THE ONE canonical PKT function (zero Pro->Plus day stacking)
        const extension = calculatePlanExpiryPkt({
          currentTier: activeTier,
          targetTier,
          currentExpiryRaw,
          purchasedDays: livePlan.duration_days,
          nowMs,
        });

        const proCreditDays = 0;
        const totalDurationDays = extension.daysAdded;
        const nowIso = new Date(nowMs).toISOString();
        const newExpiryIso = extension.newExpiryIso;
        const previousExpiryIso = extension.previousExpiryMs
          ? new Date(extension.previousExpiryMs).toISOString()
          : null;

        const responsePayload: Record<string, any> = {
          ok: true,
          alreadyProcessed: false,
          idempotentReplay: false,
          planId: livePlan.id,
          planTier: targetTier,
          billing: getBillingFromPlanId(livePlan.id),
          planName: livePlan.name,
          durationDays: totalDurationDays,
          daysAdded: totalDurationDays,
          proCreditDays,
          kobansSpent: finalKobansCost,
          discountKobans,
          balanceBefore: currentBalance,
          newBalance,
          wasExtension: extension.isSameTierExtension,
          upgradedFromPro: extension.replacesActivePro,
          replacedProDaysRemaining: extension.replacedProDaysRemaining,
          previousTier: activeTier,
          previousExpiryIso,
          previousExpiryLabel: extension.previousExpiryLabel,
          newExpiryMs: extension.newExpiryMs,
          newExpiryIso,
          newExpiryLabel: extension.newExpiryLabel,
          ledgerId,
        };

        // 4. Write wallet, subscription, ledger, history, and optional coupon redemption in ONE atomic transaction
        tx.setDoc(
          `wallets/${uid}`,
          {
            balance: newBalance,
            owned: Array.isArray(walletDoc?.owned) ? walletDoc.owned : [],
            equipped: walletDoc?.equipped || {
              effect: null,
              frame: null,
              nameplate: null,
              avatar: null,
              banner: null,
            },
            updatedAt: nowIso,
          },
          true
        );

        tx.setDoc(
          `users/${uid}`,
          {
            uid,
            plan: targetTier,
            tier: targetTier,
            planTier: targetTier,
            isPremium: true,
            isPro: targetTier === 'pro',
            isPlus: targetTier === 'plus',
            planId: livePlan.id,
            proPlanId: targetTier === 'pro' ? livePlan.id : null,
            plusPlanId: targetTier === 'plus' ? livePlan.id : null,
            premiumSource: 'kobans',
            planStartedAt: nowIso,
            planExpiresAt: newExpiryIso,
            premiumExpiresAt: extension.newExpiryMs,
            proUntil: targetTier === 'pro' ? newExpiryIso : null,
            plusUntil: targetTier === 'plus' ? newExpiryIso : null,
            kobans: newBalance,
            kobanBalance: newBalance,
            ...(validatedCouponDoc
              ? {
                  appliedCouponCode: validatedCouponDoc.code,
                  AppliedCouponCode: validatedCouponDoc.code,
                }
              : {}),
            updatedAt: nowIso,
          },
          true
        );

        tx.createDoc(`wallets/${uid}/ledger/${ledgerId}`, {
          type: 'purchase',
          purchaseSubtype: targetTier === 'plus' ? 'plus_purchase' : 'pro_purchase',
          amount: -finalKobansCost,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          planId: livePlan.id,
          planTier: targetTier,
          billing: getBillingFromPlanId(livePlan.id),
          planName: livePlan.name,
          durationDays: totalDurationDays,
          daysAdded: totalDurationDays,
          proCreditDays: 0,
          wasExtension: extension.isSameTierExtension,
          upgradedFromPro: extension.replacesActivePro,
          previousExpiryIso,
          previousExpiryLabel: extension.previousExpiryLabel,
          newExpiryMs: extension.newExpiryMs,
          newExpiryIso,
          newExpiryLabel: extension.newExpiryLabel,
          couponCode: validatedCouponDoc ? validatedCouponDoc.code : null,
          discountKobans,
          reason: `${extension.isSameTierExtension ? 'Extended' : extension.replacesActivePro ? 'Upgraded to' : 'Unlocked'} ${livePlan.name} (${totalDurationDays} days) with ${finalKobansCost.toLocaleString()} Kobans`,
          actorUid: uid,
          createdAt: nowIso,
        });

        const pkrEquivalent =
          finalKobansCost > 0
            ? Math.max(1, Math.round(finalKobansCost / Math.max(1, livePlansConfig.kobansPerPkr)))
            : livePlan.price_pkr;

        tx.createDoc(`planActivations/${activationDocKey}`, {
          id: ledgerId,
          idempotencyKey: safeIdempotency,
          uid,
          source: 'kobans',
          planId: livePlan.id,
          planTier: targetTier,
          billing: getBillingFromPlanId(livePlan.id),
          planName: livePlan.name,
          couponCode: validatedCouponDoc ? validatedCouponDoc.code : null,
          kobansSpent: finalKobansCost,
          discountKobans,
          originalPkr: livePlan.price_pkr,
          amount_pkr: pkrEquivalent,
          durationDays: totalDurationDays,
          daysAdded: totalDurationDays,
          proCreditDays: 0,
          previousTier: activeTier,
          previousExpiryIso,
          wasExtension: extension.isSameTierExtension,
          upgradedFromPro: extension.replacesActivePro,
          replacedProDaysRemaining: extension.replacedProDaysRemaining,
          startedAtIso: nowIso,
          newExpiryMs: extension.newExpiryMs,
          newExpiryIso,
          newExpiryLabel: extension.newExpiryLabel,
          responsePayload,
          createdAt: nowIso,
        });

        if (validatedCouponDoc) {
          tx.createDoc(`coupons/${validatedCouponDoc.code}/redemptions/${uid}`, {
            uid,
            redeemedAt: nowIso,
            usedOn: livePlan.id,
            paymentId: ledgerId,
            discountApplied: couponDiscountApplied,
            couponCode: validatedCouponDoc.code,
            planId: livePlan.id,
            planTier: targetTier,
            billing: getBillingFromPlanId(livePlan.id),
            discountKobans,
            finalKobans: finalKobansCost,
          });
          tx.setDoc(
            `coupons/${validatedCouponDoc.code}`,
            {
              redeemedCount: validatedCouponDoc.redeemedCount + 1,
              updatedAt: nowIso,
            },
            true
          );
        }

        return responsePayload;
      });

      if (proCacheKey) completedEconomyPurchases.set(proCacheKey, txResult);
      return jsonResponse(txResult, 200);
    } catch (err: any) {
      if (err instanceof PlanActivationHttpError) {
        return jsonResponse(
          {
            ok: false,
            code: err.code,
            error: err.message,
            message: err.message,
          },
          err.status
        );
      }
      console.error('[PlanKobansPurchase] Atomic purchase failed:', {
        uid,
        planId: plan.id,
        error: err?.message || String(err),
      });
      return jsonResponse(
        {
          ok: false,
          code: 'PRO_PURCHASE_FAILED',
          error: "Couldn't activate. Try again",
        },
        500
      );
    } finally {
      if (proCacheKey) inFlightEconomyPurchases.delete(proCacheKey);
    }
  }

  // ==========================================================================
  // 4B. SUPERADMIN PLAN EXPIRY AUDIT (READ-ONLY): GET /api/admin/plan-audit
  //     Reports full activation history for a user (?uid= or ?username=pkig)
  //     and flags any user whose expiry exceeds the sum of their purchased days
  //     WITHOUT modifying any other user automatically.
  // ==========================================================================
  if (pathClean === '/api/admin/plan-audit' && request.method === 'GET') {
    if (!isSuperAdminTokenClaim(verifiedUser, env)) {
      return jsonResponse(
        { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required.' },
        403
      );
    }

    const nowMs =
      typeof nowMsOverride === 'number' && Number.isFinite(nowMsOverride)
        ? nowMsOverride
        : Date.now();
    const targetUsernameParam = (url.searchParams.get('username') || '').trim().toLowerCase();
    const targetUidParam = (url.searchParams.get('uid') || '').trim();

    const [allUsers, allActivations, allPaymentRequests] = await Promise.all([
      fsHelper.listCollection('users', 1000).catch(() => []),
      fsHelper.listCollection('planActivations', 1000).catch(() => []),
      fsHelper.listCollection('paymentRequests', 1000).catch(() => []),
    ]);

    const resolveDaysForRecord = (rec: Record<string, any>): number => {
      const explicit = Number(rec.daysAdded ?? rec.durationDays);
      if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
      const pid = String(rec.planId || rec.plan || '').toLowerCase();
      return pid.includes('annual') || pid.includes('year') ? 365 : 30;
    };

    const userHistoryMap = new Map<
      string,
      Array<{
        id: string;
        source: string;
        dateIso: string | null;
        planId: string;
        billing: string;
        daysAdded: number;
        proCreditDays: number;
        previousExpiryIso: string | null;
        newExpiryIso: string | null;
        couponCode: string | null;
      }>
    >();

    const addHistory = (
      uId: string,
      entry: {
        id: string;
        source: string;
        dateIso: string | null;
        planId: string;
        billing: string;
        daysAdded: number;
        proCreditDays: number;
        previousExpiryIso: string | null;
        newExpiryIso: string | null;
        couponCode: string | null;
      }
    ) => {
      if (!uId) return;
      const list = userHistoryMap.get(uId) || [];
      if (list.some((existing) => existing.id === entry.id)) return;
      list.push(entry);
      userHistoryMap.set(uId, list);
    };

    for (const act of allActivations) {
      const d = act.data || {};
      const uId = String(d.uid || d.userId || '');
      const pid = String(d.planId || 'plus_annual');
      addHistory(uId, {
        id: String(d.id || act.id),
        source: String(d.source || 'planActivation'),
        dateIso: d.startedAtIso || d.createdAt || null,
        planId: pid,
        billing: String(d.billing || getBillingFromPlanId(pid)),
        daysAdded: resolveDaysForRecord(d),
        proCreditDays: Number(d.proCreditDays || 0),
        previousExpiryIso: d.previousExpiryIso || null,
        newExpiryIso: d.newExpiryIso || null,
        couponCode: d.couponCode || null,
      });
    }

    for (const pr of allPaymentRequests) {
      const d = pr.data || {};
      const st = String(d.status || '').toLowerCase();
      if (st !== 'approved' && st !== 'verified' && st !== 'completed') continue;
      if (d.crewId || String(d.plan || '').toLowerCase() === 'large_crew') continue;
      const uId = String(d.userId || d.uid || '');
      const pid = String(d.planId || d.plan || 'pro_monthly');
      addHistory(uId, {
        id: `payreq_${pr.id}`,
        source: `payment_${String(d.method || 'manual')}`,
        dateIso: d.approvedAt || d.updatedAt || d.createdAt || null,
        planId: pid,
        billing: getBillingFromPlanId(pid),
        daysAdded: resolveDaysForRecord(d),
        proCreditDays: Number(d.proCreditDays || 0),
        previousExpiryIso: null,
        newExpiryIso: d.newExpiryDate || null,
        couponCode: d.couponCode || null,
      });
    }

    const flaggedUsers: Array<{
      uid: string;
      username: string | null;
      email: string | null;
      planTier: string;
      currentExpiryIso: string;
      currentExpiryLabel: string;
      daysRemaining: number;
      totalPurchasedDays: number;
      excessDays: number;
      activationCount: number;
    }> = [];

    let inspectedUser: Record<string, any> | null = null;

    for (const u of allUsers) {
      const d = u.data || {};
      const uId = String(d.uid || u.id);
      const uName = String(d.username || d.username_lower || '').trim().toLowerCase() || null;

      // Also check wallet ledger for plan purchases not already in planActivations
      const ledgerDocs = await fsHelper.listCollection(`wallets/${uId}/ledger`, 200).catch(() => []);
      for (const l of ledgerDocs) {
        const ld = l.data || {};
        const sub = String(ld.purchaseSubtype || '').toLowerCase();
        if (sub !== 'pro_purchase' && sub !== 'plus_purchase') continue;
        const pid = String(ld.planId || (sub === 'plus_purchase' ? 'plus_monthly' : 'pro_monthly'));
        addHistory(uId, {
          id: l.id,
          source: 'kobans_ledger',
          dateIso: ld.createdAt || null,
          planId: pid,
          billing: String(ld.billing || getBillingFromPlanId(pid)),
          daysAdded: resolveDaysForRecord(ld),
          proCreditDays: Number(ld.proCreditDays || 0),
          previousExpiryIso: ld.previousExpiryIso || null,
          newExpiryIso: ld.newExpiryIso || null,
          couponCode: ld.couponCode || null,
        });
      }

      const history = (userHistoryMap.get(uId) || []).sort((a, b) =>
        String(a.dateIso || '').localeCompare(String(b.dateIso || ''))
      );
      const totalPurchasedDays = history.reduce(
        (sum, item) => sum + Math.max(0, item.daysAdded - Math.max(0, item.proCreditDays)),
        0
      );

      const expMs = parsePlanExpiryMs(
        d.plusUntil ?? d.planExpiresAt ?? d.premiumExpiresAt ?? d.proUntil ?? null
      );
      const daysRemaining = expMs && expMs > nowMs ? getPktCalendarDaysLeft(expMs, nowMs) : 0;
      const tier = getPlan({ ...d, isSuperAdmin: false, isSuperAdminClaim: false, role: 'student' }, nowMs);

      if (
        (targetUidParam && uId === targetUidParam) ||
        (targetUsernameParam && uName === targetUsernameParam)
      ) {
        inspectedUser = {
          uid: uId,
          username: uName,
          email: d.email || null,
          planTier: tier,
          currentExpiryIso: expMs ? new Date(expMs).toISOString() : null,
          currentExpiryLabel: expMs ? formatPktDateLabel(expMs) : null,
          daysRemaining,
          totalPurchasedDays,
          excessDays: Math.max(0, daysRemaining - totalPurchasedDays),
          history,
        };
      }

      if (expMs && expMs > nowMs && daysRemaining > totalPurchasedDays) {
        flaggedUsers.push({
          uid: uId,
          username: uName,
          email: d.email || null,
          planTier: tier,
          currentExpiryIso: new Date(expMs).toISOString(),
          currentExpiryLabel: formatPktDateLabel(expMs),
          daysRemaining,
          totalPurchasedDays,
          excessDays: daysRemaining - totalPurchasedDays,
          activationCount: history.length,
        });
      }
    }

    return jsonResponse({
      ok: true,
      readOnly: true,
      auditedAtIso: new Date(nowMs).toISOString(),
      totalUsersScanned: allUsers.length,
      inspectedUser,
      flaggedUsersCount: flaggedUsers.length,
      flaggedUsers,
    });
  }

  // ==========================================================================
  // 4C. SUPERADMIN DATA REPAIR FOR PKIG: POST /api/admin/plan-repair-pkig
  //     Sets pkig's Plus expiry to 24 Nov 2027 23:59:59.999 PKT and records an
  //     immutable audit entry "Corrected duplicate days from activation bug"
  //     WITHOUT deleting any subscription history.
  // ==========================================================================
  if (pathClean === '/api/admin/plan-repair-pkig' && request.method === 'POST') {
    if (!isSuperAdminTokenClaim(verifiedUser, env)) {
      return jsonResponse(
        { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required.' },
        403
      );
    }

    const PKIG_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
    const TARGET_EXPIRY_MS = pktEndOfDayMs(2027, 10, 24); // 24 Nov 2027 23:59:59.999 PKT
    const TARGET_EXPIRY_ISO = new Date(TARGET_EXPIRY_MS).toISOString(); // 2027-11-24T18:59:59.999Z
    const TARGET_EXPIRY_LABEL = formatPktDateLabel(TARGET_EXPIRY_MS); // 24 Nov 2027
    const AUDIT_REASON = 'Corrected duplicate days from activation bug';
    const AUDIT_DOC_ID = `repair_pkig_20271124`;
    const nowMs =
      typeof nowMsOverride === 'number' && Number.isFinite(nowMsOverride)
        ? nowMsOverride
        : Date.now();
    const nowIso = new Date(nowMs).toISOString();

    try {
      const repairResult = await fsHelper.runAtomicTransaction(async (tx) => {
        const [userDoc, existingAudit] = await Promise.all([
          tx.getDoc(`users/${PKIG_UID}`),
          tx.getDoc(`planAuditLogs/${AUDIT_DOC_ID}`),
        ]);

        const prevExpMs = parsePlanExpiryMs(
          userDoc?.plusUntil ?? userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? userDoc?.proUntil ?? null
        );
        const prevExpIso = prevExpMs ? new Date(prevExpMs).toISOString() : null;

        if (existingAudit && prevExpMs === TARGET_EXPIRY_MS) {
          return {
            ok: true,
            alreadyCorrected: true,
            uid: PKIG_UID,
            username: 'pkig',
            previousExpiryIso: existingAudit.previousExpiryIso || prevExpIso,
            newExpiryMs: TARGET_EXPIRY_MS,
            newExpiryIso: TARGET_EXPIRY_ISO,
            newExpiryLabel: TARGET_EXPIRY_LABEL,
            auditId: AUDIT_DOC_ID,
            auditMessage: AUDIT_REASON,
          };
        }

        // Update ONLY expiry/plan fields on users/pkig — NEVER delete any history collections
        tx.setDoc(
          `users/${PKIG_UID}`,
          {
            uid: PKIG_UID,
            plan: 'plus',
            tier: 'plus',
            planTier: 'plus',
            isPremium: true,
            isPlus: true,
            isPro: false,
            planId: 'plus_annual',
            plusPlanId: 'plus_annual',
            proPlanId: null,
            plusUntil: TARGET_EXPIRY_ISO,
            planExpiresAt: TARGET_EXPIRY_ISO,
            premiumExpiresAt: TARGET_EXPIRY_MS,
            proUntil: null,
            updatedAt: nowIso,
          },
          true
        );

        const auditPayload = {
          id: AUDIT_DOC_ID,
          action: 'plan_expiry_correction',
          reason: AUDIT_REASON,
          message: AUDIT_REASON,
          targetUid: PKIG_UID,
          targetUsername: 'pkig',
          previousExpiryIso: prevExpIso,
          previousExpiryLabel: prevExpMs ? formatPktDateLabel(prevExpMs) : null,
          newExpiryMs: TARGET_EXPIRY_MS,
          newExpiryIso: TARGET_EXPIRY_ISO,
          newExpiryLabel: TARGET_EXPIRY_LABEL,
          timezone: 'Asia/Karachi',
          actorUid: verifiedUser.uid,
          actorEmail: verifiedUser.email || null,
          historyPreserved: true,
          createdAt: nowIso,
        };

        tx.setDoc(`planAuditLogs/${AUDIT_DOC_ID}`, auditPayload, false);
        tx.setDoc(`admin_audit_logs/${AUDIT_DOC_ID}`, auditPayload, false);

        return {
          ok: true,
          alreadyCorrected: false,
          uid: PKIG_UID,
          username: 'pkig',
          previousExpiryIso: prevExpIso,
          newExpiryMs: TARGET_EXPIRY_MS,
          newExpiryIso: TARGET_EXPIRY_ISO,
          newExpiryLabel: TARGET_EXPIRY_LABEL,
          auditId: AUDIT_DOC_ID,
          auditMessage: AUDIT_REASON,
        };
      });

      return jsonResponse(repairResult, 200);
    } catch (err: any) {
      if (err instanceof PlanActivationHttpError) {
        return jsonResponse({ ok: false, code: err.code, error: err.message }, err.status);
      }
      return jsonResponse(
        { ok: false, code: 'REPAIR_FAILED', error: err?.message || 'Failed to repair expiry' },
        500
      );
    }
  }

  // ==========================================================================
  // 4D. UNIFIED INVENTORY SOURCE OF TRUTH: GET /api/inventory
  //     Merges wallets/{uid}, users/{uid}, inventory/{uid}, users/{uid}/inventory,
  //     users/{uid}/unlocked, publicProfiles/{uid}, D1 users, and starter items.
  //     Automatically backfills missing starter/equipped items idempotently.
  // ==========================================================================
  if (pathClean === '/api/inventory' || pathClean === '/api/locker/inventory') {
    if (request.method !== 'GET') {
      return jsonResponse(
        {
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${request.method} not allowed on ${pathClean}. Use GET.`,
        },
        405
      );
    }

    const uid = verifiedUser.uid;
    try {
      const readD1Profile = async (): Promise<Record<string, any> | null> => {
        if (!env?.DB || typeof env.DB.prepare !== 'function') return null;
        try {
          const row = await env.DB.prepare(
            'SELECT uid, username, avatar, frame, banner, nameplate, effect FROM users WHERE uid = ? LIMIT 1'
          )
            .bind(uid)
            .first();
          return row && typeof row === 'object' ? (row as Record<string, any>) : null;
        } catch {
          try {
            const row = await env.DB.prepare(
              'SELECT uid, username, avatar, frame FROM users WHERE uid = ? LIMIT 1'
            )
              .bind(uid)
              .first();
            return row && typeof row === 'object' ? (row as Record<string, any>) : null;
          } catch {
            return null;
          }
        }
      };

      const [
        walletDoc,
        userDoc,
        inventoryDoc,
        publicProfileDoc,
        userInvSubDocs,
        userUnlockedSubDocs,
        d1Profile,
      ] = await Promise.all([
        fsHelper.getDoc(`wallets/${uid}`),
        fsHelper.getDoc(`users/${uid}`),
        fsHelper.getDoc(`inventory/${uid}`),
        fsHelper.getDoc(`publicProfiles/${uid}`),
        fsHelper.listCollection(`users/${uid}/inventory`, 300).catch(() => []),
        fsHelper.listCollection(`users/${uid}/unlocked`, 300).catch(() => []),
        readD1Profile(),
      ]);

      const merged = mergeCanonicalInventory({
        uid,
        walletDoc,
        userDoc,
        inventoryDoc,
        publicProfileDoc,
        d1Profile,
        userInventorySubDocs: userInvSubDocs,
        userUnlockedSubDocs: userUnlockedSubDocs,
        includeStarter: true,
      });

      let backfilled = false;
      if (merged.needsBackfill) {
        const nowIso = new Date().toISOString();
        const writes: Promise<unknown>[] = [
          fsHelper.setDoc(
            `wallets/${uid}`,
            {
              balance: merged.balance,
              owned: merged.owned,
              equipped: merged.equipped,
              updatedAt: nowIso,
            },
            true
          ),
          fsHelper.setDoc(
            `inventory/${uid}`,
            {
              uid,
              userId: uid,
              items: merged.owned,
              owned: merged.owned,
              equipped: merged.equipped,
              updatedAt: nowIso,
            },
            true
          ),
        ];
        if (userDoc) {
          writes.push(
            fsHelper.setDoc(
              `users/${uid}`,
              {
                ownedCosmetics: merged.owned,
                equipped: merged.equipped,
                avatar: merged.equipped.avatar,
                equippedAvatar: merged.equipped.avatar,
                frame: merged.equipped.frame,
                equippedFrame: merged.equipped.frame,
                banner: merged.equipped.banner,
                equippedBanner: merged.equipped.banner,
                nameplate: merged.equipped.nameplate,
                equippedNameplate: merged.equipped.nameplate,
                effectId: merged.equipped.effect,
                updatedAt: nowIso,
              },
              true
            )
          );
        }
        try {
          await Promise.all(writes);
          backfilled = true;
        } catch (bfErr) {
          console.warn('[Inventory] Non-fatal backfill write skipped:', bfErr);
        }
      }

      return jsonResponse({
        ok: true,
        uid,
        balance: merged.balance,
        owned: merged.owned,
        items: merged.owned,
        equipped: merged.equipped,
        equippedCount: merged.equippedCount,
        starterIds: merged.starterIds,
        backfilled,
      });
    } catch (err: any) {
      console.error('[Inventory] GET /api/inventory failed:', uid, err);
      return jsonResponse(
        {
          ok: false,
          code: 'INVENTORY_FETCH_FAILED',
          error: err?.message || 'Could not load your Locker inventory.',
        },
        500
      );
    }
  }

  // ==========================================================================
  // 4E. UNIFIED EQUIP / UNEQUIP ENDPOINT: POST /api/inventory/equip
  //     Validates ownership on the server (including starter items & SuperAdmin),
  //     supports equip & unequip across all 5 slots, and mirrors across
  //     wallets/{uid}, users/{uid}, publicProfiles/{uid}, inventory/{uid}, and D1.
  // ==========================================================================
  if (pathClean === '/api/inventory/equip') {
    const body = (await request.json().catch(() => null)) as Record<string, any> | null;
    if (!body || typeof body !== 'object') {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: 'Invalid JSON request body for equip.',
        },
        400
      );
    }

    const uid = verifiedUser.uid;
    const isSuperAdminCaller = isSuperAdminTokenClaim(verifiedUser, env);

    const slotUpdates: Partial<Record<CosmeticSlot, string | null>> = {};
    const VALID_SLOTS: CosmeticSlot[] = ['avatar', 'frame', 'banner', 'nameplate', 'effect'];

    if (typeof body.type === 'string' && VALID_SLOTS.includes(body.type as CosmeticSlot)) {
      slotUpdates[body.type as CosmeticSlot] =
        body.itemId === null || body.itemId === '' || body.itemId === 'none'
          ? null
          : String(body.itemId).trim();
    }
    const slotMap =
      body.slots && typeof body.slots === 'object'
        ? body.slots
        : body.equipped && typeof body.equipped === 'object'
        ? body.equipped
        : null;
    if (slotMap) {
      for (const slot of VALID_SLOTS) {
        if (Object.prototype.hasOwnProperty.call(slotMap, slot)) {
          const val = slotMap[slot];
          slotUpdates[slot] =
            val === null || val === '' || val === 'none' ? null : String(val).trim();
        }
      }
    }

    const requestedSlots = Object.keys(slotUpdates) as CosmeticSlot[];
    if (requestedSlots.length === 0) {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: 'At least one cosmetic slot update is required.',
        },
        400
      );
    }

    const [
      walletDoc,
      userDoc,
      inventoryDoc,
      publicProfileDoc,
      userInvSubDocs,
      userUnlockedSubDocs,
    ] = await Promise.all([
      fsHelper.getDoc(`wallets/${uid}`),
      fsHelper.getDoc(`users/${uid}`),
      fsHelper.getDoc(`inventory/${uid}`),
      fsHelper.getDoc(`publicProfiles/${uid}`),
      fsHelper.listCollection(`users/${uid}/inventory`, 300).catch(() => []),
      fsHelper.listCollection(`users/${uid}/unlocked`, 300).catch(() => []),
    ]);

    const merged = mergeCanonicalInventory({
      uid,
      walletDoc,
      userDoc,
      inventoryDoc,
      publicProfileDoc,
      userInventorySubDocs: userInvSubDocs,
      userUnlockedSubDocs: userUnlockedSubDocs,
      includeStarter: true,
    });

    const ownedSet = new Set(merged.owned);
    const nextEquipped = { ...merged.equipped };
    const starterAvatarKey = getStarterAvatarForUser(uid).key;

    for (const slot of requestedSlots) {
      const rawVal = slotUpdates[slot];
      if (rawVal === null || rawVal === undefined) {
        // Unequipping avatar resets cleanly to deterministic starter avatar; other slots become null
        nextEquipped[slot] = slot === 'avatar' ? starterAvatarKey : null;
        continue;
      }

      const normalizedId = normalizeInventoryItemId(rawVal, slot);
      if (!normalizedId) {
        return jsonResponse(
          {
            ok: false,
            code: 'INVALID_ITEM',
            error: `Invalid ${slot} cosmetic item "${rawVal}".`,
          },
          400
        );
      }

      const isFreeMatrixAvatar = slot === 'avatar' && isValidAvatar(normalizedId);
      if (!isSuperAdminCaller && !isFreeMatrixAvatar && !ownedSet.has(normalizedId)) {
        return jsonResponse(
          {
            ok: false,
            code: 'ITEM_NOT_OWNED',
            error: 'You do not own this cosmetic item. Please unlock it from the Store first.',
          },
          403
        );
      }

      nextEquipped[slot] = normalizedId;
      if (isFreeMatrixAvatar || isSuperAdminCaller) {
        ownedSet.add(normalizedId);
      }
    }

    const nextOwned = Array.from(ownedSet);
    const nowIso = new Date().toISOString();

    const mirrorFields = {
      equipped: nextEquipped,
      avatar: nextEquipped.avatar,
      equippedAvatar: nextEquipped.avatar,
      frame: nextEquipped.frame,
      equippedFrame: nextEquipped.frame,
      banner: nextEquipped.banner,
      equippedBanner: nextEquipped.banner,
      nameplate: nextEquipped.nameplate,
      equippedNameplate: nextEquipped.nameplate,
      effectId: nextEquipped.effect,
      updatedAt: nowIso,
    };

    const writes: Promise<unknown>[] = [
      fsHelper.setDoc(
        `wallets/${uid}`,
        {
          balance: merged.balance,
          owned: nextOwned,
          equipped: nextEquipped,
          updatedAt: nowIso,
        },
        true
      ),
      fsHelper.setDoc(
        `inventory/${uid}`,
        {
          uid,
          userId: uid,
          items: nextOwned,
          owned: nextOwned,
          equipped: nextEquipped,
          updatedAt: nowIso,
        },
        true
      ),
      fsHelper.setDoc(
        `users/${uid}`,
        {
          ownedCosmetics: nextOwned,
          ...mirrorFields,
        },
        true
      ),
      fsHelper.setDoc(`publicProfiles/${uid}`, mirrorFields, true),
    ];

    if (env?.DB && typeof env.DB.prepare === 'function') {
      writes.push(
        env.DB.prepare(
          'UPDATE users SET avatar = ?, frame = ?, updated_at = ? WHERE uid = ?'
        )
          .bind(nextEquipped.avatar || '', nextEquipped.frame || null, nowIso, uid)
          .run()
          .catch(() => null)
      );
    }

    await Promise.all(writes);

    return jsonResponse({
      ok: true,
      uid,
      balance: merged.balance,
      owned: nextOwned,
      equipped: nextEquipped,
      equippedCount: countEquippedLoadout(nextEquipped, uid),
    });
  }

  // ==========================================================================
  // 4F. SUPERADMIN BATCH BACKFILL FOR STARTER & EQUIPPED INVENTORY
  //     POST /api/admin/backfill-starter-inventory { dryRun?: boolean, limit?: number }
  //     Idempotently ensures every existing user has their starter avatar +
  //     any currently equipped cosmetics saved in wallets/{uid}, users/{uid},
  //     and inventory/{uid} without altering balances, plans, or roles.
  // ==========================================================================
  if (pathClean === '/api/admin/backfill-starter-inventory') {
    if (!isSuperAdminTokenClaim(verifiedUser, env)) {
      return jsonResponse(
        {
          ok: false,
          code: 'FORBIDDEN',
          error: 'Superadmin role required to backfill starter inventory.',
        },
        403
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const dryRun = body?.dryRun === true;
    const maxUsers = Math.min(Math.max(1, Number(body?.limit) || 500), 1000);
    const nowIso = new Date().toISOString();

    const userDocs = await fsHelper.listCollection('users', maxUsers);
    let scanned = 0;
    let needsBackfillCount = 0;
    let updatedCount = 0;
    const sampleUpdated: Array<{ uid: string; added: string[]; equipped: Record<string, any> }> = [];

    for (const uEntry of userDocs) {
      const targetUid = String(uEntry.id || uEntry.data?.uid || '').trim();
      if (!targetUid || targetUid.startsWith('guest_')) continue;
      scanned++;

      const [walletDoc, inventoryDoc, publicProfileDoc, userInvSubDocs, userUnlockedSubDocs] =
        await Promise.all([
          fsHelper.getDoc(`wallets/${targetUid}`),
          fsHelper.getDoc(`inventory/${targetUid}`),
          fsHelper.getDoc(`publicProfiles/${targetUid}`),
          fsHelper.listCollection(`users/${targetUid}/inventory`, 200).catch(() => []),
          fsHelper.listCollection(`users/${targetUid}/unlocked`, 200).catch(() => []),
        ]);

      const merged = mergeCanonicalInventory({
        uid: targetUid,
        walletDoc,
        userDoc: uEntry.data,
        inventoryDoc,
        publicProfileDoc,
        userInventorySubDocs: userInvSubDocs,
        userUnlockedSubDocs: userUnlockedSubDocs,
        includeStarter: true,
      });

      if (!merged.needsBackfill) continue;
      needsBackfillCount++;

      if (!dryRun) {
        await Promise.all([
          fsHelper.setDoc(
            `wallets/${targetUid}`,
            {
              balance: merged.balance,
              owned: merged.owned,
              equipped: merged.equipped,
              updatedAt: nowIso,
            },
            true
          ),
          fsHelper.setDoc(
            `inventory/${targetUid}`,
            {
              uid: targetUid,
              userId: targetUid,
              items: merged.owned,
              owned: merged.owned,
              equipped: merged.equipped,
              updatedAt: nowIso,
            },
            true
          ),
          fsHelper.setDoc(
            `users/${targetUid}`,
            {
              ownedCosmetics: merged.owned,
              equipped: merged.equipped,
              avatar: merged.equipped.avatar,
              equippedAvatar: merged.equipped.avatar,
              frame: merged.equipped.frame,
              equippedFrame: merged.equipped.frame,
              updatedAt: nowIso,
            },
            true
          ),
        ]);
        updatedCount++;
      }

      if (sampleUpdated.length < 25) {
        sampleUpdated.push({
          uid: targetUid,
          added: merged.missingFromWalletOwned,
          equipped: merged.equipped,
        });
      }
    }

    return jsonResponse({
      ok: true,
      dryRun,
      scanned,
      needsBackfillCount,
      updatedCount,
      sampleUpdated,
    });
  }

  // ==========================================================================
  // 5. BUY STORE ITEM(S) WITH KOBANS: POST /api/store/purchase
  //    (plus legacy aliases /api/store/unlock, /api/store/buy, /api/kobans/purchase)
  // ==========================================================================
  if (
    pathClean === '/api/store/purchase' ||
    pathClean === '/api/store/unlock' ||
    pathClean === '/api/store/buy' ||
    pathClean === '/api/kobans/purchase'
  ) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
        },
        405
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, any> | null;
    if (!body || typeof body !== 'object') {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: 'Invalid JSON request body for store purchase.',
        },
        400
      );
    }

    const rawItems: Array<Record<string, any>> = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.itemIds)
      ? body.itemIds.map((id: unknown) => ({ id: String(id || '').trim() }))
      : body.item && typeof body.item === 'object'
      ? [body.item]
      : body.itemId !== undefined
      ? [{ id: String(body.itemId ?? '').trim() }]
      : [];

    if (rawItems.length === 0) {
      return jsonResponse(
        {
          ok: false,
          code: 'EMPTY_CART',
          error: 'No store items specified for purchase.',
        },
        400
      );
    }

    // Deduplicate requested items while validating every item ID is non-empty
    const uniqueRawItems: Array<Record<string, any>> = [];
    const seenRequestedIds = new Set<string>();
    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') {
        return jsonResponse(
          {
            ok: false,
            code: 'BAD_INPUT',
            error: 'Invalid store item entry in purchase request.',
          },
          400
        );
      }
      const itemId = String(rawItem.id || rawItem.itemId || '').trim();
      if (!itemId || itemId.length > 128 || /[/\\]/.test(itemId)) {
        return jsonResponse(
          {
            ok: false,
            code: 'BAD_INPUT',
            error: 'Each store item must have a valid non-empty item ID.',
          },
          400
        );
      }
      if (!seenRequestedIds.has(itemId)) {
        seenRequestedIds.add(itemId);
        uniqueRawItems.push({ ...rawItem, id: itemId });
      }
    }

    const explicitIdempotencyRaw = String(
      body.idempotencyKey || request.headers.get('X-Idempotency-Key') || ''
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const sortedItemKey = uniqueRawItems
      .map((i) => String(i.id).trim())
      .sort()
      .join(',');
    const userItemsLockKey = `store_items:${verifiedUser.uid}:${sortedItemKey}`;
    const idempotencyKey = explicitIdempotencyRaw || `chk_${Date.now()}`;
    const storeCacheKey = explicitIdempotencyRaw
      ? `store:${verifiedUser.uid}:${explicitIdempotencyRaw}`
      : '';

    if (storeCacheKey && completedEconomyPurchases.has(storeCacheKey)) {
      return jsonResponse({
        ...completedEconomyPurchases.get(storeCacheKey)!,
        alreadyProcessed: true,
      });
    }
    if (
      (storeCacheKey && inFlightEconomyPurchases.has(storeCacheKey)) ||
      inFlightEconomyPurchases.has(userItemsLockKey)
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'PURCHASE_IN_PROGRESS',
          error: 'Checkout is already being processed. Please wait.',
        },
        409
      );
    }
    if (storeCacheKey) {
      inFlightEconomyPurchases.add(storeCacheKey);
    }
    inFlightEconomyPurchases.add(userItemsLockKey);

    try {
      const firstItemId = String(uniqueRawItems[0].id);
      const [
        walletDoc,
        userDoc,
        inventoryDoc,
        publicProfileDoc,
        userInvDocs,
        unlockedDocs,
        existingBatchLedger,
      ] = await Promise.all([
        fsHelper.getDoc(`wallets/${verifiedUser.uid}`),
        fsHelper.getDoc(`users/${verifiedUser.uid}`),
        fsHelper.getDoc(`inventory/${verifiedUser.uid}`),
        fsHelper.getDoc(`publicProfiles/${verifiedUser.uid}`),
        fsHelper.listCollection(`users/${verifiedUser.uid}/inventory`, 300).catch(() => []),
        fsHelper.listCollection(`users/${verifiedUser.uid}/unlocked`, 300).catch(() => []),
        explicitIdempotencyRaw
          ? fsHelper.getDoc(
              `wallets/${verifiedUser.uid}/ledger/${explicitIdempotencyRaw}_0_${firstItemId}`
            )
          : Promise.resolve(null),
      ]);

      const canonicalBefore = mergeCanonicalInventory({
        uid: verifiedUser.uid,
        walletDoc,
        userDoc,
        inventoryDoc,
        publicProfileDoc,
        userInventorySubDocs: userInvDocs,
        userUnlockedSubDocs: unlockedDocs,
        includeStarter: true,
      });

      const currentBalance = canonicalBefore.balance;
      const existingOwned = new Set<string>(canonicalBefore.owned);

      // Server-side persistent idempotency check: if this batch idempotencyKey already wrote to ledger, return success without charging again
      if (existingBatchLedger) {
        const idempotentPayload = {
          ok: true,
          alreadyProcessed: true,
          newBalance: currentBalance,
          totalDeducted: Math.abs(Number(existingBatchLedger.amount ?? 0)),
          purchasedItems: uniqueRawItems.map((i) => String(i.id)),
          owned: Array.from(existingOwned),
          flaggedItems: [],
        };
        if (storeCacheKey) completedEconomyPurchases.set(storeCacheKey, idempotentPayload);
        return jsonResponse(idempotentPayload);
      }

      const flaggedItems: Array<{
        itemId: string;
        name: string;
        reason: 'already_owned' | 'inactive' | 'price_changed';
        oldPrice?: number;
        newPrice?: number;
      }> = [];

      const validToBuy: Array<{
        id: string;
        name: string;
        type: string;
        price: number;
      }> = [];

      const allStoreItemsList = await fsHelper.listCollection('store_items', 500).catch(() => []);
      const storeItemsById = new Map<string, Record<string, any>>(
        allStoreItemsList.map((entry) => [entry.id, entry.data])
      );
      const legacyUniform600 = isLegacyUniform600Collection(allStoreItemsList);

      for (const rawItem of uniqueRawItems) {
        const itemId = String(rawItem.id).trim();

        const catalogMatch = ALL_KNOWN_COSMETICS.find((c) => c.id === itemId);
        const liveV2 = storeItemsById.has(itemId)
          ? storeItemsById.get(itemId)!
          : await fsHelper.getDoc(`store_items/${itemId}`).catch(() => null);
        // Only fall back to legacy `storeItems` collection for non-catalog items when `store_items` has no doc
        const liveData =
          liveV2 ||
          (!catalogMatch ? await fsHelper.getDoc(`storeItems/${itemId}`).catch(() => null) : null);

        // 404 ONLY when the store item truly does not exist in catalog or Firestore
        if (!catalogMatch && !liveData) {
          return jsonResponse(
            {
              ok: false,
              code: 'ITEM_NOT_FOUND',
              error: `Store item "${itemId}" does not exist.`,
            },
            404
          );
        }

        const name = String(liveData?.name || catalogMatch?.name || rawItem.name || itemId);
        const itemType = String(
          liveData?.category || liveData?.type || catalogMatch?.type || rawItem.type || 'avatar'
        );

        const resolvedPriceInfo = resolveEffectiveStoreItemPrice({
          catalogPrice: catalogMatch
            ? Number(catalogMatch.priceKobans ?? catalogMatch.price ?? 0)
            : Number(rawItem.price ?? 0),
          catalogSalePrice: catalogMatch?.salePriceKobans ?? null,
          catalogSaleEndsAt: catalogMatch?.saleEndsAt ?? null,
          liveDoc: liveData,
          isLegacyUniform600: legacyUniform600,
          isSuperAdmin: isAdmin,
        });

        if (!resolvedPriceInfo.active && !isAdmin) {
          flaggedItems.push({ itemId, name, reason: 'inactive' });
          continue;
        }

        if (!isAdmin && existingOwned.has(itemId)) {
          flaggedItems.push({ itemId, name, reason: 'already_owned' });
          continue;
        }

        validToBuy.push({
          id: itemId,
          name,
          type: itemType,
          price: resolvedPriceInfo.effectivePrice,
        });
      }

      if (flaggedItems.length > 0 && validToBuy.length === 0) {
        const allInactive = flaggedItems.every((f) => f.reason === 'inactive');
        if (allInactive) {
          return jsonResponse(
            {
              ok: false,
              code: 'ITEM_UNAVAILABLE',
              error:
                flaggedItems.length === 1
                  ? `"${flaggedItems[0].name}" is currently unavailable in the Boardly Store.`
                  : 'The selected items are currently unavailable in the Boardly Store.',
              newBalance: currentBalance,
              totalDeducted: 0,
              purchasedItems: [],
              owned: Array.from(existingOwned),
              flaggedItems,
            },
            403
          );
        }

        return jsonResponse(
          {
            ok: false,
            code: 'ALREADY_OWNED',
            error:
              flaggedItems.length === 1 && flaggedItems[0].reason === 'already_owned'
                ? `You already own "${flaggedItems[0].name}".`
                : `Some items could not be purchased (${flaggedItems
                    .map(
                      (f) =>
                        `"${f.name}" ${
                          f.reason === 'already_owned' ? 'is already owned' : 'is unavailable'
                        }`
                    )
                    .join(', ')}).`,
            newBalance: currentBalance,
            totalDeducted: 0,
            purchasedItems: [],
            owned: Array.from(existingOwned),
            flaggedItems,
          },
          409
        );
      }

      const cartCheck = calculateCartTotals({
        items: validToBuy,
        balance: currentBalance,
        isSuperAdmin: isAdmin,
      });
      const totalCost = cartCheck.subtotal;
      if (!cartCheck.canAfford) {
        return jsonResponse(
          {
            ok: false,
            code: 'INSUFFICIENT_KOBANS',
            error:
              cartCheck.insufficientBannerMessage ||
              `Insufficient Kobans. You need ${totalCost.toLocaleString()} Kobans (you have ${currentBalance.toLocaleString()}).`,
            currentBalance,
            requiredKobans: totalCost,
          },
          402
        );
      }

      const newBalance = currentBalance - totalCost;
      const nowIso = new Date().toISOString();
      const updatedOwned = Array.from(
        new Set([...existingOwned, ...validToBuy.map((i) => i.id)])
      );

      await Promise.all([
        fsHelper.setDoc(
          `wallets/${verifiedUser.uid}`,
          {
            balance: newBalance,
            owned: updatedOwned,
            equipped: walletDoc?.equipped ||
              userDoc?.equipped || {
                effect: null,
                frame: null,
                nameplate: null,
                avatar: null,
                banner: null,
              },
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `users/${verifiedUser.uid}`,
          {
            uid: verifiedUser.uid,
            kobans: newBalance,
            kobanBalance: newBalance,
            ownedCosmetics: updatedOwned,
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `inventory/${verifiedUser.uid}`,
          {
            uid: verifiedUser.uid,
            userId: verifiedUser.uid,
            items: updatedOwned,
            owned: updatedOwned,
            updatedAt: nowIso,
          },
          true
        ),
        ...validToBuy.map((item) =>
          fsHelper.setDoc(
            `users/${verifiedUser.uid}/inventory/${item.id}`,
            {
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              pricePaid: item.price,
              unlockedAt: nowIso,
            },
            true
          )
        ),
        ...validToBuy.map((item) =>
          fsHelper.setDoc(
            `users/${verifiedUser.uid}/unlocked/${item.id}`,
            {
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              pricePaid: item.price,
              unlockedAt: nowIso,
            },
            true
          )
        ),
        ...validToBuy.map((item, idx) =>
          fsHelper.setDoc(
            `wallets/${verifiedUser.uid}/ledger/${idempotencyKey}_${idx}_${item.id}`,
            {
              type: 'purchase',
              amount: -item.price,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              reason: `Unlocked ${item.name} (${item.type})`,
              actorUid: verifiedUser.uid,
              batchId: idempotencyKey,
              createdAt: nowIso,
            },
            true
          )
        ),
      ]);

      const responsePayload = {
        ok: true,
        newBalance,
        totalDeducted: totalCost,
        purchasedItems: validToBuy.map((i) => i.id),
        owned: updatedOwned,
        flaggedItems,
      };
      if (storeCacheKey) completedEconomyPurchases.set(storeCacheKey, responsePayload);
      return jsonResponse(responsePayload);
    } finally {
      if (storeCacheKey) inFlightEconomyPurchases.delete(storeCacheKey);
      inFlightEconomyPurchases.delete(userItemsLockKey);
    }
  }

  // ==========================================================================
  // 6. ADMIN COUPONS DASHBOARD: GET / POST / PATCH /api/admin/coupons
  // ==========================================================================
  if (pathClean === '/api/admin/coupons' || pathClean.startsWith('/api/admin/coupons/')) {
    const adminCheck = await requireAdmin({
      request,
      env,
      tokenVerifierOverride,
    });
    if (!adminCheck.ok || !adminCheck.caller) {
      return adminCheck.blockedResponse!;
    }

    if (request.method === 'GET') {
      const [coupons, redemptions] = await Promise.all([
        getAllCoupons(fsHelper),
        getAllRedemptions(fsHelper),
      ]);
      return jsonResponse({
        ok: true,
        coupons,
        redemptions,
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const code = String(body.code || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '');
      if (!code || code.length < 3) {
        return jsonResponse(
          {
            ok: false,
            error: 'Coupon code must be at least 3 alphanumeric characters.',
          },
          400
        );
      }

      const rawPct = Number(
        body.percentOff ??
          body.percent_off ??
          body.discountPercent ??
          body.discount_percent ??
          body.percent ??
          50
      );
      const cleanPct = Number.isFinite(rawPct) ? Math.min(100, Math.max(1, Math.round(rawPct))) : 50;
      const cleanMaxUses = Math.max(
        1,
        Math.round(
          Number(body.maxRedemptions ?? body.max_redemptions ?? body.maxUses ?? body.max_uses ?? 100) || 100
        )
      );
      const isOneYearPro =
        /^BOARDLY-1Y-/i.test(code) ||
        body.type === '1_year_free_pro' ||
        body.discountType === '1_year_free_pro' ||
        body.discount_type === '1_year_free_pro' ||
        body.benefitType === '1_year_free_pro' ||
        cleanPct >= 100;
      const discountTypeVal = isOneYearPro ? '1_year_free_pro' : 'percent';
      const rawLabelInput = String(body.label ?? '').trim();
      const safeLabel =
        rawLabelInput && rawLabelInput !== String(cleanMaxUses)
          ? rawLabelInput
          : isOneYearPro
            ? '1-Year Free Pro Campaign'
            : `${cleanPct}% Off Pro Pass`;

      const rawAppliesTo = String(body.appliesTo ?? body.applies_to ?? 'all').trim().toLowerCase();
      const safeAppliesTo: CouponAppliesTo =
        rawAppliesTo === 'pro_monthly' ||
        rawAppliesTo === 'pro_annual' ||
        rawAppliesTo === 'plus_monthly' ||
        rawAppliesTo === 'plus_annual'
          ? rawAppliesTo
          : 'all';

      const nowIso = new Date().toISOString();
      const newRaw = {
        id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code,
        label: safeLabel,
        type: discountTypeVal,
        discount_type: discountTypeVal,
        appliesTo: safeAppliesTo,
        applies_to: safeAppliesTo,
        percentOff: isOneYearPro ? 100 : cleanPct,
        percent_off: isOneYearPro ? 100 : cleanPct,
        discountPercent: isOneYearPro ? 100 : cleanPct,
        amount_off_pkr: Number(body.amountOffPkr ?? body.amount_off_pkr ?? 0),
        amount_off_kobans: Number(body.amountOffKobans ?? body.amount_off_kobans ?? 0),
        duration_months: isOneYearPro
          ? 12
          : Number(body.durationMonths ?? body.duration_months ?? 1),
        maxRedemptions: cleanMaxUses,
        max_redemptions: cleanMaxUses,
        redeemedCount: 0,
        redemption_count: 0,
        active: true,
        is_active: true,
        created_by: adminCheck.caller.email || verifiedUser?.email || 'shsvirtualadmin@gmail.com',
        created_at: nowIso,
        expires_at: body.expiresAt || null,
        updated_at: nowIso,
      };

      const localCodes = loadLocalPromoCodes();
      const existingIdx = localCodes.findIndex(
        (c) => String(c.code || '').toUpperCase() === code
      );
      if (existingIdx >= 0) {
        localCodes[existingIdx] = { ...localCodes[existingIdx], ...newRaw };
      } else {
        localCodes.unshift(newRaw);
      }
      saveLocalPromoCodes(localCodes);

      await Promise.all([
        fsHelper.setDoc(`promoCodes/${newRaw.id}`, newRaw, true).catch(() => false),
        fsHelper.setDoc(`coupons/${code}`, newRaw, true).catch(() => false),
      ]);

      return jsonResponse({
        ok: true,
        coupon: normalizeCouponRecord(newRaw),
      });
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetCode = String(body.code || pathClean.split('/').pop() || '')
        .trim()
        .toUpperCase();
      const localCodes = loadLocalPromoCodes();
      let idx = localCodes.findIndex(
        (c) =>
          String(c.code || '').toUpperCase() === targetCode ||
          String(c.id || '').toUpperCase() === targetCode
      );

      let baseRecord: Record<string, any> | null = idx >= 0 ? localCodes[idx] : null;
      if (!baseRecord) {
        const allCoupons = await getAllCoupons(fsHelper);
        const found = allCoupons.find(
          (c) => c.code.toUpperCase() === targetCode || c.id.toUpperCase() === targetCode
        );
        if (found) {
          baseRecord = {
            id: found.id,
            code: found.code,
            label: found.label,
            discount_type: found.discountType,
            percent_off: found.percentOff,
            amount_off_pkr: found.amountOffPkr,
            amount_off_kobans: found.amountOffKobans,
            duration_months: found.durationMonths,
            duration_days: found.durationDays,
            max_redemptions: found.maxRedemptions,
            redemption_count: found.redemptionCount,
            is_active: found.isActive,
            expires_at: found.expiresAt,
            created_by: found.createdBy,
            created_at: found.createdAt,
            updated_at: found.updatedAt,
          };
        }
      }

      if (!baseRecord) {
        return jsonResponse({ ok: false, error: 'Coupon not found.' }, 404);
      }

      const nextActive =
        body.active !== undefined
          ? Boolean(body.active)
          : body.isActive !== undefined
            ? Boolean(body.isActive)
            : body.is_active !== undefined
              ? Boolean(body.is_active)
              : undefined;

      const updatedRaw: Record<string, any> = {
        ...baseRecord,
        ...(nextActive !== undefined
          ? { is_active: nextActive, isActive: nextActive, active: nextActive }
          : {}),
        ...(body.maxRedemptions !== undefined
          ? {
              max_redemptions: Math.max(1, Number(body.maxRedemptions)),
              maxRedemptions: Math.max(1, Number(body.maxRedemptions)),
            }
          : {}),
        updated_at: new Date().toISOString(),
      };

      if (idx >= 0) {
        localCodes[idx] = updatedRaw;
      } else {
        localCodes.unshift(updatedRaw);
      }
      saveLocalPromoCodes(localCodes);

      await Promise.all([
        fsHelper.setDoc(`promoCodes/${updatedRaw.id}`, updatedRaw, true).catch(() => false),
        fsHelper.setDoc(`coupons/${updatedRaw.code}`, updatedRaw, true).catch(() => false),
      ]);

      return jsonResponse({
        ok: true,
        coupon: normalizeCouponRecord(updatedRaw),
      });
    }
  }

  return jsonResponse({ ok: false, error: `Unhandled economy endpoint: ${pathClean}` }, 404);
}
