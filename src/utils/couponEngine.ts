import {
  DEFAULT_PLANS_CONFIG,
  normalizePlansConfig,
  type PlansConfigDoc,
} from '../lib/planTier';
import { buildPlansCatalog, type ProPlanId } from '../config/plans';

export type CouponType = 'pct' | 'flat' | 'kob';

export interface CouponDoc {
  code: string;
  type: CouponType;
  value: number;
  appliesTo: string; // 'any' | 'monthly' | 'annual' | item key
  maxRedemptions: number | null; // null = unlimited
  redeemedCount: number;
  expiresAt: number | null; // epoch ms (null = no expiry)
  active: boolean;
  createdAt: number | null;
  createdBy: string;
}

export interface CouponRedemptionDoc {
  uid: string;
  redeemedAt: unknown;
  usedOn: string;
  paymentId: string;
  discountApplied: number;
}

export type CouponErrorCode =
  | 'INVALID_COUPON'
  | 'EXPIRED'
  | 'FULLY_CLAIMED'
  | 'WRONG_ITEM'
  | 'ALREADY_USED';

export const COUPON_ERROR_MESSAGES: Record<CouponErrorCode, string> = {
  INVALID_COUPON: 'Invalid coupon',
  EXPIRED: 'This coupon has expired',
  FULLY_CLAIMED: 'This coupon is fully claimed',
  WRONG_ITEM: 'Not valid for this item',
  ALREADY_USED: "You've already used this coupon",
};

export class CouponValidationError extends Error {
  readonly code: CouponErrorCode;
  constructor(code: CouponErrorCode) {
    super(COUPON_ERROR_MESSAGES[code]);
    this.name = 'CouponValidationError';
    this.code = code;
  }
}

export interface CouponAppliesOption {
  value: string;
  label: string;
  category: 'global' | 'plans' | 'kobans';
}

export const COUPON_APPLIES_OPTIONS: CouponAppliesOption[] = [
  { value: 'any', label: 'Any purchase', category: 'global' },
  { value: 'monthly', label: 'Monthly plans (Pro & Plus)', category: 'plans' },
  { value: 'annual', label: 'Annual plans (Pro & Plus)', category: 'plans' },
  { value: 'pro_monthly', label: 'Boardly Pro — Monthly', category: 'plans' },
  { value: 'pro_annual', label: 'Boardly Pro — Annual', category: 'plans' },
  { value: 'plus_monthly', label: 'Boardly Plus — Monthly', category: 'plans' },
  { value: 'plus_annual', label: 'Boardly Plus — Annual', category: 'plans' },
  { value: 'kobans', label: 'Any Kobans pack', category: 'kobans' },
  { value: 'kobans_500', label: '500 Kobans pack', category: 'kobans' },
  { value: 'kobans_1000', label: '1,000 Kobans pack', category: 'kobans' },
  { value: 'kobans_2500', label: '2,500 Kobans pack', category: 'kobans' },
  { value: 'kobans_5000', label: '5,000 Kobans pack', category: 'kobans' },
];

export interface CheckoutItemPricing {
  itemKey: string;
  label: string;
  basePkr: number;
  baseKobans: number;
  kobansPerPkr: number;
  planId?: ProPlanId;
  durationDays?: number;
}

export interface CouponDiscountBreakdown {
  itemKey: string;
  originalPkr: number;
  discountPkr: number;
  finalPkr: number;
  originalKobans: number;
  discountKobans: number;
  finalKobans: number;
  bonusKobans: number;
  /** Recorded on redemptions/{uid}.discountApplied (PKR off for pct/flat, bonus Kobans for kob) */
  discountApplied: number;
  isFreeActivation: boolean;
}

export type CouponEvaluationResult =
  | {
      valid: true;
      coupon: CouponDoc;
      breakdown: CouponDiscountBreakdown;
    }
  | {
      valid: false;
      code: CouponErrorCode;
      error: string;
    };

export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,20}$/;

/**
 * Codes are case-insensitive: always trim and uppercase before every lookup or write.
 */
export function normalizeCouponCode(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Parses Firestore Timestamp, Date, ISO string, or numeric ms/seconds into epoch ms (or null).
 */
export function parseCouponTimestampMs(raw: unknown): number | null {
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
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * Normalizes a raw Firestore `coupons/{CODE}` document into a strict `CouponDoc`.
 */
export function normalizeCouponDoc(
  docId: string,
  raw: Record<string, unknown> | null | undefined
): CouponDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  const code = normalizeCouponCode(raw.code ?? docId);
  if (!code) return null;

  const rawType = String(raw.type ?? '').trim().toLowerCase();
  let type: CouponType = 'pct';
  if (rawType === 'flat' || rawType === 'fixed_pkr') {
    type = 'flat';
  } else if (rawType === 'kob' || rawType === 'kobans' || rawType === 'fixed_kobans') {
    type = 'kob';
  } else if (rawType === 'pct' || rawType === 'percent' || rawType === 'percentage') {
    type = 'pct';
  } else {
    return null;
  }

  const rawVal = Number(raw.value);
  if (!Number.isFinite(rawVal) || rawVal <= 0) return null;
  const value = type === 'pct' ? Math.min(100, rawVal) : Math.round(rawVal);

  const rawAppliesTo = String(raw.appliesTo ?? 'any').trim().toLowerCase();
  const appliesTo = rawAppliesTo || 'any';

  let maxRedemptions: number | null = null;
  if (raw.maxRedemptions !== null && raw.maxRedemptions !== undefined && raw.maxRedemptions !== '') {
    const parsedMax = Math.floor(Number(raw.maxRedemptions));
    if (Number.isFinite(parsedMax) && parsedMax > 0) {
      maxRedemptions = parsedMax;
    }
  }

  const rawRedeemed = Number(raw.redeemedCount ?? 0);
  const redeemedCount = Number.isFinite(rawRedeemed) && rawRedeemed >= 0 ? Math.floor(rawRedeemed) : 0;

  const expiresAt = parseCouponTimestampMs(raw.expiresAt);
  const active = raw.active === true;
  const createdAt = parseCouponTimestampMs(raw.createdAt);
  const createdBy = String(raw.createdBy ?? '').trim();

  return {
    code,
    type,
    value,
    appliesTo,
    maxRedemptions,
    redeemedCount,
    expiresAt,
    active,
    createdAt,
    createdBy,
  };
}

export interface NewCouponDraftInput {
  code: string;
  type: CouponType;
  value: number;
  appliesTo?: string;
  maxRedemptions?: number | null;
  expiresAtMs?: number | null;
  active?: boolean;
}

export interface ValidatedNewCouponDraft {
  code: string;
  type: CouponType;
  value: number;
  appliesTo: string;
  maxRedemptions: number | null;
  expiresAtMs: number | null;
  active: boolean;
}

/**
 * Validates admin coupon creation inputs cleanly before writing to Firestore.
 */
export function validateNewCouponDraft(input: NewCouponDraftInput): ValidatedNewCouponDraft {
  const code = normalizeCouponCode(input.code);
  if (!COUPON_CODE_REGEX.test(code)) {
    throw new Error('Code must be 3–20 characters using only letters, numbers, - or _.');
  }

  if (input.type !== 'pct' && input.type !== 'flat' && input.type !== 'kob') {
    throw new Error('Choose a valid discount type (percent, flat PKR, or Kobans bonus).');
  }

  const numValue = Number(input.value);
  if (!Number.isFinite(numValue) || numValue <= 0) {
    throw new Error('Discount value must be greater than 0.');
  }
  if (input.type === 'pct' && numValue > 100) {
    throw new Error('Percentage discount cannot exceed 100%.');
  }

  const value =
    input.type === 'pct'
      ? Math.round(numValue * 100) / 100
      : Math.round(numValue);

  if (value <= 0) {
    throw new Error('Discount value must be at least 1.');
  }

  const appliesTo = String(input.appliesTo ?? 'any').trim().toLowerCase() || 'any';

  let maxRedemptions: number | null = null;
  if (input.maxRedemptions !== null && input.maxRedemptions !== undefined) {
    const parsedMax = Math.floor(Number(input.maxRedemptions));
    if (!Number.isFinite(parsedMax) || parsedMax < 1) {
      throw new Error('Max redemptions must be at least 1, or leave blank for unlimited.');
    }
    maxRedemptions = parsedMax;
  }

  let expiresAtMs: number | null = null;
  if (input.expiresAtMs !== null && input.expiresAtMs !== undefined) {
    const parsedExp = Number(input.expiresAtMs);
    if (!Number.isFinite(parsedExp) || parsedExp <= 0) {
      throw new Error('Please choose a valid expiry date.');
    }
    expiresAtMs = Math.round(parsedExp);
  }

  return {
    code,
    type: input.type,
    value,
    appliesTo,
    maxRedemptions,
    expiresAtMs,
    active: input.active !== false,
  };
}

/**
 * Checks whether a coupon's `appliesTo` scope matches the requested checkout `itemKey`.
 */
export function doesCouponApplyToItem(appliesToRaw: string, itemKeyRaw: string): boolean {
  const scope = String(appliesToRaw || 'any').trim().toLowerCase();
  const item = String(itemKeyRaw || '').trim().toLowerCase();

  if (!scope || scope === 'any' || scope === 'all') return true;
  if (!item) return false;
  if (scope === item) return true;

  if (scope === 'monthly') {
    return item === 'monthly' || item === 'pro_monthly' || item === 'plus_monthly';
  }
  if (scope === 'annual') {
    return item === 'annual' || item === 'pro_annual' || item === 'plus_annual';
  }
  if (scope === 'pro') {
    return item === 'pro_monthly' || item === 'pro_annual';
  }
  if (scope === 'plus') {
    return item === 'plus_monthly' || item === 'plus_annual';
  }
  if (scope === 'kobans') {
    return item === 'kobans' || item.startsWith('kobans_');
  }

  return false;
}

/**
 * Resolves authoritative item pricing from `config/plans` (or defaults) + Kobans packs.
 * Never trusts client-submitted prices.
 */
export function resolveCheckoutItemPricing(
  itemKeyRaw: string,
  rawPlansConfig?: Partial<PlansConfigDoc> | null
): CheckoutItemPricing {
  const cfg = normalizePlansConfig(rawPlansConfig as Record<string, unknown> | null);
  const catalog = buildPlansCatalog(cfg);
  const kobansPerPkr = cfg.kobansPerPkr || DEFAULT_PLANS_CONFIG.kobansPerPkr;
  const itemKey = String(itemKeyRaw || 'pro_monthly').trim().toLowerCase();

  if (
    itemKey === 'pro_monthly' ||
    itemKey === 'pro_annual' ||
    itemKey === 'plus_monthly' ||
    itemKey === 'plus_annual'
  ) {
    const plan = catalog[itemKey];
    return {
      itemKey: plan.id,
      label: plan.name,
      basePkr: plan.price_pkr,
      baseKobans: plan.price_kobans,
      kobansPerPkr,
      planId: plan.id,
      durationDays: plan.duration_days,
    };
  }

  const kobansPackMatch = /^kobans_(\d+)$/.exec(itemKey);
  if (kobansPackMatch) {
    const kobansAmount = Math.max(500, Math.floor(Number(kobansPackMatch[1]) || 500));
    const basePkr = Math.max(50, Math.floor(kobansAmount / kobansPerPkr));
    return {
      itemKey: `kobans_${kobansAmount}`,
      label: `${kobansAmount.toLocaleString()} Kobans pack`,
      basePkr,
      baseKobans: kobansAmount,
      kobansPerPkr,
    };
  }

  if (itemKey === 'kobans') {
    return {
      itemKey: 'kobans',
      label: '1,000 Kobans pack',
      basePkr: Math.floor(1000 / kobansPerPkr),
      baseKobans: 1000,
      kobansPerPkr,
    };
  }

  // Fallback to Pro Monthly if unknown key is passed
  const fallbackPlan = catalog.pro_monthly;
  return {
    itemKey,
    label: fallbackPlan.name,
    basePkr: fallbackPlan.price_pkr,
    baseKobans: fallbackPlan.price_kobans,
    kobansPerPkr,
    planId: fallbackPlan.id,
    durationDays: fallbackPlan.duration_days,
  };
}

/**
 * Pure deterministic discount computation:
 * - pct: rounds discount to whole PKR; finalPkr never < 0; Kobans equivalent scales cleanly
 * - flat: flat PKR off; never goes below 0
 * - kob: bonus Kobans credited via normal Kobans credit path; checkout price unchanged
 */
export function computeCouponDiscount(params: {
  coupon: Pick<CouponDoc, 'type' | 'value'>;
  itemKey: string;
  basePkr: number;
  baseKobans: number;
  kobansPerPkr?: number;
}): CouponDiscountBreakdown {
  const originalPkr = Math.max(0, Math.round(Number(params.basePkr) || 0));
  const originalKobans = Math.max(0, Math.round(Number(params.baseKobans) || 0));
  const kobansPerPkr =
    typeof params.kobansPerPkr === 'number' && params.kobansPerPkr > 0
      ? params.kobansPerPkr
      : DEFAULT_PLANS_CONFIG.kobansPerPkr;

  const { type, value } = params.coupon;

  if (type === 'pct') {
    const clampedPct = Math.max(0, Math.min(100, Number(value) || 0));
    const discountPkr = Math.min(originalPkr, Math.round((originalPkr * clampedPct) / 100));
    const finalPkr = Math.max(0, originalPkr - discountPkr);
    const finalKobans =
      originalPkr > 0
        ? Math.max(0, Math.round(finalPkr * (originalKobans / originalPkr)))
        : Math.max(0, originalKobans - Math.round((originalKobans * clampedPct) / 100));
    const discountKobans = Math.max(0, originalKobans - finalKobans);

    return {
      itemKey: params.itemKey,
      originalPkr,
      discountPkr,
      finalPkr,
      originalKobans,
      discountKobans,
      finalKobans,
      bonusKobans: 0,
      discountApplied: discountPkr,
      isFreeActivation: finalPkr === 0 && finalKobans === 0,
    };
  }

  if (type === 'flat') {
    const flatPkr = Math.max(0, Math.round(Number(value) || 0));
    const discountPkr = Math.min(originalPkr, flatPkr);
    const finalPkr = Math.max(0, originalPkr - discountPkr);
    const discountKobans = Math.min(originalKobans, Math.round(discountPkr * kobansPerPkr));
    const finalKobans = Math.max(0, originalKobans - discountKobans);

    return {
      itemKey: params.itemKey,
      originalPkr,
      discountPkr,
      finalPkr,
      originalKobans,
      discountKobans,
      finalKobans,
      bonusKobans: 0,
      discountApplied: discountPkr,
      isFreeActivation: finalPkr === 0 && finalKobans === 0,
    };
  }

  // type === 'kob' (Kobans bonus coupon)
  const bonusKobans = Math.max(0, Math.round(Number(value) || 0));
  return {
    itemKey: params.itemKey,
    originalPkr,
    discountPkr: 0,
    finalPkr: originalPkr,
    originalKobans,
    discountKobans: 0,
    finalKobans: originalKobans,
    bonusKobans,
    discountApplied: bonusKobans,
    isFreeActivation: false,
  };
}

/**
 * Evaluates full coupon eligibility and returns exact required error messages on failure.
 */
export function evaluateCouponEligibility(params: {
  coupon: CouponDoc | null;
  alreadyRedeemedByUser: boolean;
  itemKey: string;
  basePkr: number;
  baseKobans: number;
  kobansPerPkr?: number;
  nowMs?: number;
}): CouponEvaluationResult {
  const nowMs =
    typeof params.nowMs === 'number' && Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const { coupon } = params;

  if (!coupon || !coupon.active) {
    return {
      valid: false,
      code: 'INVALID_COUPON',
      error: COUPON_ERROR_MESSAGES.INVALID_COUPON,
    };
  }

  if (coupon.expiresAt !== null && coupon.expiresAt <= nowMs) {
    return {
      valid: false,
      code: 'EXPIRED',
      error: COUPON_ERROR_MESSAGES.EXPIRED,
    };
  }

  if (params.alreadyRedeemedByUser) {
    return {
      valid: false,
      code: 'ALREADY_USED',
      error: COUPON_ERROR_MESSAGES.ALREADY_USED,
    };
  }

  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
    return {
      valid: false,
      code: 'FULLY_CLAIMED',
      error: COUPON_ERROR_MESSAGES.FULLY_CLAIMED,
    };
  }

  if (!doesCouponApplyToItem(coupon.appliesTo, params.itemKey)) {
    return {
      valid: false,
      code: 'WRONG_ITEM',
      error: COUPON_ERROR_MESSAGES.WRONG_ITEM,
    };
  }

  const breakdown = computeCouponDiscount({
    coupon,
    itemKey: params.itemKey,
    basePkr: params.basePkr,
    baseKobans: params.baseKobans,
    kobansPerPkr: params.kobansPerPkr,
  });

  return {
    valid: true,
    coupon,
    breakdown,
  };
}

/**
 * Formats a human-readable discount badge/label for UI display.
 */
export function formatCouponBenefitLabel(coupon: Pick<CouponDoc, 'type' | 'value'>): string {
  if (coupon.type === 'pct') {
    return `${coupon.value}% off`;
  }
  if (coupon.type === 'flat') {
    return `PKR ${Math.round(coupon.value).toLocaleString()} off`;
  }
  return `+${Math.round(coupon.value).toLocaleString()} Kobans`;
}

/**
 * Formats a human-readable `appliesTo` scope label.
 */
export function formatCouponScopeLabel(appliesTo: string): string {
  const norm = String(appliesTo || 'any').trim().toLowerCase();
  const found = COUPON_APPLIES_OPTIONS.find((opt) => opt.value === norm);
  if (found) return found.label;
  return norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Computes live coupon status badge string (never hue-only).
 */
export function getCouponStatusLabel(
  coupon: Pick<CouponDoc, 'active' | 'expiresAt' | 'maxRedemptions' | 'redeemedCount'>,
  nowMs = Date.now()
): 'Active' | 'Paused' | 'Expired' | 'Fully claimed' {
  if (!coupon.active) return 'Paused';
  if (coupon.expiresAt !== null && coupon.expiresAt <= nowMs) return 'Expired';
  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
    return 'Fully claimed';
  }
  return 'Active';
}

/**
 * Generic atomic transaction runner interface used by both Firestore (`runTransaction`)
 * and deterministic unit/concurrency tests.
 */
export interface CouponTxContext {
  getCoupon(code: string): Promise<CouponDoc | null>;
  hasRedemption(code: string, uid: string): Promise<boolean>;
  getPlansConfig(): Promise<Partial<PlansConfigDoc> | null>;
  createRedemption(code: string, uid: string, record: CouponRedemptionDoc): void;
  incrementRedeemedCount(code: string, nextCount: number): void;
  savePayment(paymentId: string, payload: Record<string, unknown>): void;
}

export interface AtomicCouponCheckoutResult {
  paymentId: string;
  itemPricing: CheckoutItemPricing;
  coupon: CouponDoc | null;
  breakdown: CouponDiscountBreakdown;
}

/**
 * Core atomic checkout redemption logic executed inside ONE Firestore transaction.
 * Re-reads authoritative pricing, re-reads coupon & redemptions/{uid}, recomputes discount,
 * writes redemptions/{uid}, increments redeemedCount, and saves payment.
 * If any step throws, the enclosing transaction rolls back completely and NOTHING is written.
 */
export async function executeAtomicCouponCheckout(
  tx: CouponTxContext,
  params: {
    uid: string;
    itemKey: string;
    paymentId: string;
    couponCode?: string | null;
    nowMs?: number;
    createServerTimestamp: () => unknown;
    buildPaymentPayload: (computed: {
      paymentId: string;
      itemPricing: CheckoutItemPricing;
      coupon: CouponDoc | null;
      breakdown: CouponDiscountBreakdown;
    }) => Record<string, unknown>;
  }
): Promise<AtomicCouponCheckoutResult> {
  const cleanCode = normalizeCouponCode(params.couponCode);
  const plansConfig = await tx.getPlansConfig();
  const itemPricing = resolveCheckoutItemPricing(params.itemKey, plansConfig);

  let validatedCoupon: CouponDoc | null = null;
  let breakdown: CouponDiscountBreakdown = {
    itemKey: itemPricing.itemKey,
    originalPkr: itemPricing.basePkr,
    discountPkr: 0,
    finalPkr: itemPricing.basePkr,
    originalKobans: itemPricing.baseKobans,
    discountKobans: 0,
    finalKobans: itemPricing.baseKobans,
    bonusKobans: 0,
    discountApplied: 0,
    isFreeActivation: false,
  };

  if (cleanCode) {
    const [couponDoc, alreadyUsed] = await Promise.all([
      tx.getCoupon(cleanCode),
      tx.hasRedemption(cleanCode, params.uid),
    ]);

    const evalResult = evaluateCouponEligibility({
      coupon: couponDoc,
      alreadyRedeemedByUser: alreadyUsed,
      itemKey: itemPricing.itemKey,
      basePkr: itemPricing.basePkr,
      baseKobans: itemPricing.baseKobans,
      kobansPerPkr: itemPricing.kobansPerPkr,
      nowMs: params.nowMs,
    });

    if (!evalResult.valid) {
      throw new CouponValidationError(evalResult.code);
    }

    validatedCoupon = evalResult.coupon;
    breakdown = evalResult.breakdown;
  }

  // Build payment payload first so any payment validation failure aborts BEFORE any writes
  const paymentPayload = params.buildPaymentPayload({
    paymentId: params.paymentId,
    itemPricing,
    coupon: validatedCoupon,
    breakdown,
  });

  if (validatedCoupon) {
    tx.createRedemption(validatedCoupon.code, params.uid, {
      uid: params.uid,
      redeemedAt: params.createServerTimestamp(),
      usedOn: itemPricing.itemKey,
      paymentId: params.paymentId,
      discountApplied: breakdown.discountApplied,
    });
    tx.incrementRedeemedCount(validatedCoupon.code, validatedCoupon.redeemedCount + 1);
  }

  tx.savePayment(params.paymentId, paymentPayload);

  return {
    paymentId: params.paymentId,
    itemPricing,
    coupon: validatedCoupon,
    breakdown,
  };
}
