import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  validateCouponReadOnly,
  normalizeCouponCode,
} from '@/services/couponService';
import {
  formatCouponBenefitLabel,
  type CouponType,
} from '@/utils/couponEngine';
import {
  getProPlanById,
  computeExtendedProExpiry,
  computeProToPlusCreditDays,
  evaluatePlanPurchaseEligibility,
  resolveUnifiedPlanStatus,
  type ProPlanId,
  type PlansConfigDoc,
} from '@/config/plans';
import {
  getBillingFromPlanId,
  getPlanTierFromPlanId,
  PLUS_ALREADY_INCLUDES_PRO_MSG,
} from '@/lib/planTier';
import { fetchPlansConfigOnce } from '@/hooks/usePlansConfig';
import { clearPlanCache, forceRefreshPaymentRequests } from '@/hooks/useEffectivePlan';
import { forceRefreshUserProfile } from '@/hooks/useUserProfile';
import {
  notifyProActivated,
  notifyProRequestReceived,
} from '@/services/emailNotificationService';
import type { PaymentRequest } from '@/types';

export interface ProKobanPurchaseResult {
  success: boolean;
  alreadyProcessed: boolean;
  planId: ProPlanId;
  planTier: 'pro' | 'plus';
  planName: string;
  durationDays: number;
  extraCreditDays: number;
  kobansCharged: number;
  balanceBefore: number;
  balanceAfter: number;
  wasExtension: boolean;
  wasUpgradeFromPro: boolean;
  previousExpiryLabel: string | null;
  newExpiryMs: number;
  newExpiryIso: string;
  newExpiryLabel: string;
  ledgerId: string;
}

const inFlightProKeys = new Set<string>();
const inFlightPurchaseUids = new Set<string>();
const completedProCache = new Map<string, ProKobanPurchaseResult>();

function sanitizeIdempotencyKey(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64);
  return cleaned || `pro_${Date.now()}`;
}

async function callServerProPurchaseGuard(params: {
  endpoint:
    | '/api/pro/purchase'
    | '/api/pro/submit-payment'
    | '/api/pro/activate'
    | '/api/pro/purchase-guard';
  uid: string;
  planId: ProPlanId;
  planName: string;
  durationDays: number;
  amountPkr: number;
  method: string;
  tid?: string;
  commitLock: boolean;
  lockState: 'active' | 'pending';
  expiresAtMs?: number;
  pendingRequestId?: string;
}): Promise<{ serverNowMs: number }> {
  if (params.uid.startsWith('guest_')) {
    const err = new Error(
      'Guest accounts cannot purchase Boardly Pro or Plus. Please create a registered account to upgrade.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GUEST_UPGRADE_FORBIDDEN';
    err.status = 403;
    throw err;
  }

  let token: string | null = null;
  try {
    token = (await auth.currentUser?.getIdToken()) || null;
  } catch {
    token = null;
  }

  if (!token) {
    return { serverNowMs: Date.now() };
  }

  let resp: Response;
  try {
    resp = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: params.uid,
        planId: params.planId,
        planTier: getPlanTierFromPlanId(params.planId),
        billing: getBillingFromPlanId(params.planId),
        planName: params.planName,
        durationDays: params.durationDays,
        amountPkr: params.amountPkr,
        method: params.method,
        tid: params.tid || '',
        commitLock: params.commitLock,
        lockState: params.lockState,
        expiresAtMs: params.expiresAtMs,
        pendingRequestId: params.pendingRequestId,
      }),
    });
  } catch {
    return { serverNowMs: Date.now() };
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.ok === false) {
    console.error('[proSubscriptionService] Plan purchase guard rejected:', {
      status: resp.status,
      url: resp.url || params.endpoint,
      body: data,
    });
    const message =
      data?.error ||
      (resp.status === 403
        ? 'Guest accounts cannot purchase Boardly Pro or Plus. Please create a registered account to upgrade.'
        : 'You cannot start another purchase right now.');
    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = data?.code || (resp.status === 403 ? 'FORBIDDEN' : 'CONFLICT');
    err.status = resp.status;
    throw err;
  }

  return {
    serverNowMs: typeof data?.serverNowMs === 'number' ? data.serverNowMs : Date.now(),
  };
}

/**
 * Pure helper used for balance verification, Koban deduction, and new/extended expiry math
 * (including Pro -> Plus unused Pro day credit and Plus renewal extension).
 */
export function calculateProPurchaseOutcome(params: {
  planId: string;
  currentBalance: number;
  currentExpiryRaw: unknown;
  currentPlanTier?: 'free' | 'pro' | 'plus';
  plansConfig?: Partial<PlansConfigDoc> | null;
  nowMs?: number;
}): {
  planId: ProPlanId;
  planTier: 'pro' | 'plus';
  planName: string;
  durationDays: number;
  extraCreditDays: number;
  pricePkr: number;
  priceKobans: number;
  balanceBefore: number;
  delta: number;
  balanceAfter: number;
  wasExtension: boolean;
  wasUpgradeFromPro: boolean;
  previousExpiryMs: number | null;
  previousExpiryLabel: string | null;
  newExpiryMs: number;
  newExpiryIso: string;
  newExpiryLabel: string;
} {
  const nowMs = typeof params.nowMs === 'number' && Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const plan = getProPlanById(params.planId, params.plansConfig);
  const targetTier = getPlanTierFromPlanId(plan.id);
  const currentTier = params.currentPlanTier || 'free';

  if (currentTier === 'plus' && targetTier === 'pro') {
    const err = new Error(PLUS_ALREADY_INCLUDES_PRO_MSG) as Error & { code?: string; status?: number };
    err.code = 'PLUS_ALREADY_INCLUDES_PRO';
    err.status = 409;
    throw err;
  }

  const balanceBefore = Math.max(0, Math.floor(Number(params.currentBalance) || 0));
  const priceKobans = plan.price_kobans;

  if (balanceBefore < priceKobans) {
    const needed = priceKobans - balanceBefore;
    const err = new Error(
      `Insufficient Kobans. You need ${needed.toLocaleString()} more Kobans to get ${plan.name}.`
    ) as Error & { code?: string; neededKobans?: number };
    err.code = 'INSUFFICIENT_KOBANS';
    err.neededKobans = needed;
    throw err;
  }

  const delta = -priceKobans;
  const balanceAfter = balanceBefore + delta;

  // Compute Pro -> Plus unused day credit
  let extraCreditDays = 0;
  let wasUpgradeFromPro = false;
  if (currentTier === 'pro' && targetTier === 'plus') {
    const prevCheck = computeExtendedProExpiry(params.currentExpiryRaw, 0, nowMs);
    if (prevCheck.isCurrentlyActive && prevCheck.currentExpiryMs) {
      const remainingProDays = Math.max(
        0,
        Math.ceil((prevCheck.currentExpiryMs - nowMs) / (24 * 60 * 60 * 1000))
      );
      const proMonthly = getProPlanById('pro_monthly', params.plansConfig).price_pkr;
      const plusMonthly = getProPlanById('plus_monthly', params.plansConfig).price_pkr;
      extraCreditDays = computeProToPlusCreditDays(remainingProDays, proMonthly, plusMonthly);
      wasUpgradeFromPro = true;
    }
  }

  const extension = computeExtendedProExpiry(
    params.currentExpiryRaw,
    plan.duration_days,
    nowMs,
    extraCreditDays,
    wasUpgradeFromPro // Pro -> Plus starts now + plan duration + credited Pro days
  );

  return {
    planId: plan.id,
    planTier: targetTier,
    planName: plan.name,
    durationDays: plan.duration_days + extraCreditDays,
    extraCreditDays,
    pricePkr: plan.price_pkr,
    priceKobans,
    balanceBefore,
    delta,
    balanceAfter,
    wasExtension: !wasUpgradeFromPro && extension.wasAlreadyActive,
    wasUpgradeFromPro,
    previousExpiryMs: extension.previousExpiryMs,
    previousExpiryLabel: extension.previousExpiryLabel,
    newExpiryMs: extension.newExpiryMs,
    newExpiryIso: new Date(extension.newExpiryMs).toISOString(),
    newExpiryLabel: extension.newExpiryLabel,
  };
}

export interface ValidatedCouponInfo {
  id: string;
  code: string;
  label: string;
  couponType: CouponType;
  couponValue: number;
  appliesTo: string;
  discountType: '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans' | 'free_pro';
  percentOff: number;
  discountPercent?: number;
  amountOffPkr: number;
  amountOffKobans: number;
  bonusKobans: number;
  durationMonths: number;
  durationDays: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  planId: ProPlanId;
  planTier?: 'pro' | 'plus';
  planName: string;
  originalPkr: number;
  discountPkr: number;
  finalPkr: number;
  originalKobans: number;
  discountKobans: number;
  finalKobans: number;
  isFreeGrant: boolean;
  isFreeActivation?: boolean;
  effectiveDurationDays: number;
}

export type ValidatedProCoupon = ValidatedCouponInfo;

/**
 * Maps server or network errors from plan activation into specific, friendly user messages.
 * Never exposes raw Firestore "Missing or insufficient permissions" strings to the user.
 */
export function mapPlanActivationError(
  errOrInput: unknown,
  fallback = "Couldn't activate. Try again"
): string {
  const errObj = (errOrInput && typeof errOrInput === 'object'
    ? (errOrInput as { code?: unknown; status?: unknown; message?: unknown; error?: unknown })
    : null);
  const code = String(errObj?.code || '').trim().toUpperCase();
  const status = Number(errObj?.status || 0);
  const rawMessage = String(
    errObj?.message || errObj?.error || (typeof errOrInput === 'string' ? errOrInput : '')
  ).trim();
  const lowerMsg = rawMessage.toLowerCase();

  if (
    status === 401 ||
    code === 'UNAUTHENTICATED' ||
    code === 'AUTH/ID-TOKEN-EXPIRED' ||
    code === 'AUTH/USER-TOKEN-EXPIRED' ||
    lowerMsg.includes('sign in again') ||
    lowerMsg.includes('authentication required') ||
    lowerMsg.includes('id token')
  ) {
    return 'Please sign in again';
  }

  if (
    code === 'ALREADY_USED' ||
    code === 'ALREADY_REDEEMED' ||
    lowerMsg.includes('already used') ||
    lowerMsg.includes('already redeemed')
  ) {
    return 'Coupon already used';
  }

  if (
    code === 'EXPIRED' ||
    code === 'COUPON_EXPIRED' ||
    lowerMsg.includes('expired')
  ) {
    return 'Coupon expired';
  }

  if (code === 'INVALID_COUPON' || code === 'COUPON_INACTIVE') {
    return 'Invalid coupon';
  }

  if (code === 'FULLY_CLAIMED' || code === 'COUPON_MAX_REDEMPTIONS') {
    return 'This coupon is fully claimed';
  }

  if (code === 'WRONG_ITEM' || code === 'COUPON_PLAN_MISMATCH') {
    return 'Not valid for this item';
  }

  if (code === 'PLUS_ALREADY_INCLUDES_PRO') {
    return PLUS_ALREADY_INCLUDES_PRO_MSG;
  }

  if (
    code.includes('PERMISSION') ||
    lowerMsg.includes('missing or insufficient permissions') ||
    lowerMsg.includes('permission-denied') ||
    lowerMsg.includes('permission denied') ||
    status >= 500
  ) {
    return fallback;
  }

  return rawMessage || fallback;
}

/**
 * Step 1 (Apply button): Strictly read-only coupon validation against Firestore
 * `coupons/{CODE}` and `coupons/{CODE}/redemptions/{uid}`.
 * Writes NOTHING. Recomputes authoritative prices from `config/plans`.
 */
export async function validateProCoupon(params: {
  code: string;
  planId: ProPlanId;
  amount?: number;
  uid?: string | null;
  plansConfig?: Partial<PlansConfigDoc> | null;
}): Promise<ValidatedCouponInfo> {
  const uid = params.uid ?? auth.currentUser?.uid ?? null;
  if (!uid) {
    throw new Error('Please sign in again');
  }

  const plansConfig = params.plansConfig ?? (await fetchPlansConfigOnce());
  const plan = getProPlanById(params.planId, plansConfig);
  const billing = getBillingFromPlanId(plan.id);
  const planTier = getPlanTierFromPlanId(plan.id);

  let couponResult: Awaited<ReturnType<typeof validateCouponReadOnly>>;
  try {
    couponResult = await validateCouponReadOnly({
      code: params.code,
      uid,
      itemKey: plan.id,
      plansConfig,
    });
  } catch (err: any) {
    const friendly = new Error(mapPlanActivationError(err, 'Invalid coupon')) as Error & {
      code?: string;
    };
    friendly.code = err?.code;
    throw friendly;
  }

  const { coupon, breakdown } = couponResult;

  const discountType: ValidatedCouponInfo['discountType'] =
    coupon.type === 'pct'
      ? 'percent'
      : coupon.type === 'flat'
        ? 'fixed_pkr'
        : 'fixed_kobans';

  return {
    id: coupon.code,
    code: coupon.code,
    label: formatCouponBenefitLabel(coupon),
    couponType: coupon.type,
    couponValue: coupon.value,
    appliesTo: coupon.appliesTo,
    discountType,
    percentOff: coupon.type === 'pct' ? coupon.value : 0,
    discountPercent: coupon.type === 'pct' ? coupon.value : 0,
    amountOffPkr: breakdown.discountPkr,
    amountOffKobans: breakdown.discountKobans,
    bonusKobans: breakdown.bonusKobans,
    durationMonths: billing === 'annual' ? 12 : 1,
    durationDays: plan.duration_days,
    maxRedemptions: coupon.maxRedemptions,
    redemptionCount: coupon.redeemedCount,
    planId: plan.id,
    planTier,
    planName: plan.name,
    originalPkr: breakdown.originalPkr,
    discountPkr: breakdown.discountPkr,
    finalPkr: breakdown.finalPkr,
    originalKobans: breakdown.originalKobans,
    discountKobans: breakdown.discountKobans,
    finalKobans: breakdown.finalKobans,
    isFreeGrant: breakdown.isFreeActivation,
    isFreeActivation: breakdown.isFreeActivation,
    effectiveDurationDays: plan.duration_days,
  };
}

/**
 * 100%-Off / Free Coupon Plan Activation:
 * Calls server endpoint `POST /api/plan/activate` with the verified Firebase ID token.
 * Performs ZERO direct client Firestore writes; the server validates auth, re-validates
 * the coupon, recalculates pricing, and executes ONE atomic Admin Firestore transaction.
 */
export async function redeemProCoupon(params: {
  uid?: string;
  userEmail?: string;
  userName?: string;
  code: string;
  planId: ProPlanId;
  billing?: 'monthly' | 'annual';
  idempotencyKey?: string;
}): Promise<{
  activatedPro: boolean;
  activatedPlus?: boolean;
  idempotentReplay?: boolean;
  redemptionId?: string;
  planId: ProPlanId;
  planTier?: 'pro' | 'plus';
  planName: string;
  durationDays: number;
  newExpiryMs?: number;
  newExpiryIso?: string;
  newExpiryLabel?: string;
  coupon: ValidatedCouponInfo;
}> {
  const currentUser = auth.currentUser;
  const uid = params.uid || currentUser?.uid;
  if (!uid || !currentUser) {
    const err = new Error('Please sign in again') as Error & { code?: string; status?: number };
    err.code = 'UNAUTHENTICATED';
    err.status = 401;
    throw err;
  }

  const token = await currentUser.getIdToken().catch(() => null);
  if (!token) {
    const err = new Error('Please sign in again') as Error & { code?: string; status?: number };
    err.code = 'UNAUTHENTICATED';
    err.status = 401;
    throw err;
  }

  const cleanCode = normalizeCouponCode(params.code);
  const plansConfig = await fetchPlansConfigOnce();
  const plan = getProPlanById(params.planId, plansConfig);
  const billing: 'monthly' | 'annual' = params.billing || getBillingFromPlanId(plan.id);
  const safeIdempotencyKey = sanitizeIdempotencyKey(params.idempotencyKey);

  let resp: Response;
  try {
    resp = await fetch('/api/plan/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Idempotency-Key': safeIdempotencyKey,
      },
      body: JSON.stringify({
        planId: plan.id,
        billing,
        couponCode: cleanCode,
        idempotencyKey: safeIdempotencyKey,
      }),
    });
  } catch {
    const err = new Error("Couldn't activate. Try again") as Error & {
      code?: string;
      status?: number;
    };
    err.code = 'NETWORK_ERROR';
    err.status = 0;
    throw err;
  }

  const data = (await resp.json().catch(() => ({}))) as Record<string, any>;
  if (!resp.ok || !data?.ok) {
    const friendlyMsg = mapPlanActivationError(
      {
        status: resp.status,
        code: data?.code,
        message: data?.error || data?.message,
      },
      "Couldn't activate. Try again"
    );
    const err = new Error(friendlyMsg) as Error & { code?: string; status?: number };
    err.code = String(data?.code || 'ACTIVATION_FAILED');
    err.status = resp.status;
    throw err;
  }

  const resolvedPlanId = (data.planId || plan.id) as ProPlanId;
  const resolvedTier = getPlanTierFromPlanId(resolvedPlanId);
  const resolvedBilling = getBillingFromPlanId(resolvedPlanId);
  const durationMonths = resolvedBilling === 'annual' ? 12 : 1;
  const resolvedDurationDays = Number(data.durationDays || plan.duration_days);
  const resolvedExpiryMs = Number(
    data.newExpiryMs || Date.now() + resolvedDurationDays * 86_400_000
  );
  const resolvedExpiryIso = String(
    data.newExpiryIso || new Date(resolvedExpiryMs).toISOString()
  );
  const resolvedExpiryLabel = String(
    data.newExpiryLabel || computeExtendedProExpiry(null, resolvedDurationDays).newExpiryLabel
  );
  const startedAtIso = String(data.startedAtIso || new Date().toISOString());

  clearPlanCache(uid);

  // Sync local profile SWR cache immediately while refreshing authoritative server state
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (const lsKey of [`cached_profile_${uid}`, `boardly_user_profile_${uid}`]) {
        const existingRaw = window.localStorage.getItem(lsKey);
        const parsed = existingRaw ? JSON.parse(existingRaw) : { uid };
        parsed.plan = resolvedTier;
        parsed.tier = resolvedTier;
        parsed.planTier = resolvedTier;
        parsed.isPremium = true;
        parsed.isPro = resolvedTier === 'pro';
        parsed.isPlus = resolvedTier === 'plus';
        parsed.planId = resolvedPlanId;
        parsed.proPlanId = resolvedTier === 'pro' ? resolvedPlanId : null;
        parsed.plusPlanId = resolvedTier === 'plus' ? resolvedPlanId : null;
        parsed.premiumSource = 'coupon';
        parsed.planStartedAt = startedAtIso;
        parsed.planExpiresAt = resolvedExpiryIso;
        parsed.premiumExpiresAt = resolvedExpiryMs;
        parsed.proUntil = resolvedTier === 'pro' ? resolvedExpiryIso : null;
        parsed.plusUntil = resolvedTier === 'plus' ? resolvedExpiryIso : null;
        window.localStorage.setItem(lsKey, JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Refresh authoritative user profile & plan status from server before closing sheet
  await Promise.all([
    forceRefreshUserProfile(uid).catch(() => {}),
    forceRefreshPaymentRequests(uid).catch(() => {}),
  ]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('boardly:plan-refresh'));
  }

  const couponPayload = data.coupon || {};
  const couponType: CouponType =
    couponPayload.type === 'flat'
      ? 'flat'
      : couponPayload.type === 'kob'
        ? 'kob'
        : 'pct';
  const couponValue = Number(couponPayload.value ?? 100);
  const originalPkr = Number(data.originalPkr ?? plan.price_pkr);
  const discountPkr = Number(data.discountPkr ?? originalPkr);
  const originalKobans = Number(data.originalKobans ?? plan.price_kobans);
  const discountKobans = Number(data.discountKobans ?? originalKobans);

  return {
    activatedPro: true,
    activatedPlus: resolvedTier === 'plus',
    idempotentReplay: Boolean(data.idempotentReplay),
    redemptionId: String(data.activationId || data.redemptionId || ''),
    planId: resolvedPlanId,
    planTier: resolvedTier,
    planName: String(data.planName || plan.name),
    durationDays: resolvedDurationDays,
    newExpiryMs: resolvedExpiryMs,
    newExpiryIso: resolvedExpiryIso,
    newExpiryLabel: resolvedExpiryLabel,
    coupon: {
      id: String(couponPayload.code || cleanCode),
      code: String(couponPayload.code || cleanCode),
      label: formatCouponBenefitLabel({ type: couponType, value: couponValue }),
      couponType,
      couponValue,
      appliesTo: String(couponPayload.appliesTo || 'any'),
      discountType:
        couponType === 'pct'
          ? 'percent'
          : couponType === 'flat'
            ? 'fixed_pkr'
            : 'fixed_kobans',
      percentOff: couponType === 'pct' ? couponValue : 0,
      discountPercent: couponType === 'pct' ? couponValue : 0,
      amountOffPkr: discountPkr,
      amountOffKobans: discountKobans,
      bonusKobans: 0,
      durationMonths,
      durationDays: resolvedDurationDays,
      maxRedemptions: couponPayload.maxRedemptions ?? null,
      redemptionCount: Number(couponPayload.redeemedCount ?? couponPayload.redemptionCount ?? 1),
      planId: resolvedPlanId,
      planTier: resolvedTier,
      planName: String(data.planName || plan.name),
      originalPkr,
      discountPkr,
      finalPkr: 0,
      originalKobans,
      discountKobans,
      finalKobans: 0,
      isFreeGrant: true,
      isFreeActivation: true,
      effectiveDurationDays: resolvedDurationDays,
    },
  };
}

export async function purchaseProWithKobans(params: {
  uid: string;
  userEmail?: string;
  userName?: string;
  planId: ProPlanId;
  idempotencyKey: string;
  couponCode?: string | null;
}): Promise<ProKobanPurchaseResult> {
  const { uid, planId } = params;
  if (!uid) {
    throw new Error('Please sign in to purchase a Boardly plan.');
  }
  if (uid.startsWith('guest_')) {
    const err = new Error(
      'Guest accounts cannot purchase Boardly Pro or Plus. Please create a registered account to upgrade.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GUEST_UPGRADE_FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const plansConfig = await fetchPlansConfigOnce();
  const plan = getProPlanById(planId, plansConfig);
  const planTier = getPlanTierFromPlanId(plan.id);
  const safeKey = sanitizeIdempotencyKey(params.idempotencyKey);
  const cacheKey = `${uid}:${safeKey}`;

  if (completedProCache.has(cacheKey)) {
    return completedProCache.get(cacheKey)!;
  }
  if (inFlightProKeys.has(cacheKey) || inFlightPurchaseUids.has(uid)) {
    const err = new Error(
      'Your plan purchase is already being processed. Please wait a moment.'
    ) as Error & { code?: string; status?: number };
    err.code = 'PURCHASE_IN_PROGRESS';
    err.status = 409;
    throw err;
  }

  inFlightProKeys.add(cacheKey);
  inFlightPurchaseUids.add(uid);

  try {
    const cleanCouponCode = normalizeCouponCode(params.couponCode);
    // Pre-validate coupon read-only BEFORE attempting Koban payment so invalid/already-used codes fail with zero writes
    if (cleanCouponCode) {
      await validateCouponReadOnly({
        code: cleanCouponCode,
        uid,
        itemKey: plan.id,
        plansConfig,
      });
    }

    await callServerProPurchaseGuard({
      endpoint: '/api/pro/purchase',
      uid,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.duration_days,
      amountPkr: plan.price_pkr,
      method: 'kobans',
      commitLock: false,
      lockState: 'active',
    });

    const token = await auth.currentUser?.getIdToken().catch(() => null);
    if (!token) {
      throw new Error('Authentication required to purchase with Kobans.');
    }

    const resp = await fetch('/api/pro/purchase-kobans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Idempotency-Key': safeKey,
      },
      body: JSON.stringify({
        uid,
        planId: plan.id,
        planTier,
        couponCode: cleanCouponCode || null,
        idempotencyKey: safeKey,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.ok) {
      console.error('[proSubscriptionService] Plan purchase with Kobans failed:', {
        status: resp.status,
        url: resp.url || '/api/pro/purchase-kobans',
        body: data,
      });
      const err = new Error(
        data?.error || `Could not complete ${plan.name} purchase with Kobans.`
      ) as Error & { code?: string; status?: number };
      err.code = data?.code || 'PRO_PURCHASE_FAILED';
      err.status = resp.status;
      throw err;
    }

    // Coupon redemption is recorded server-side inside /api/pro/purchase-kobans (no direct client writes).

    const resolvedTier = getPlanTierFromPlanId(data.planId || plan.id);

    callServerProPurchaseGuard({
      endpoint: '/api/pro/activate',
      uid,
      planId: data.planId || plan.id,
      planName: data.planName || plan.name,
      durationDays: data.durationDays || plan.duration_days,
      amountPkr: plan.price_pkr,
      method: 'kobans',
      commitLock: true,
      lockState: 'active',
      expiresAtMs: data.newExpiryMs,
    }).catch(() => {});

    const result: ProKobanPurchaseResult = {
      success: true,
      alreadyProcessed: Boolean(data.alreadyProcessed),
      planId: data.planId || plan.id,
      planTier: resolvedTier,
      planName: data.planName || plan.name,
      durationDays: Number(data.durationDays || plan.duration_days),
      extraCreditDays: Number(data.extraCreditDays || 0),
      kobansCharged: Number(data.kobansSpent ?? plan.price_kobans),
      balanceBefore: Number(data.balanceBefore ?? 0),
      balanceAfter: Number(data.newBalance ?? 0),
      wasExtension: Boolean(data.wasExtension),
      wasUpgradeFromPro: Boolean(data.wasUpgradeFromPro),
      previousExpiryLabel: data.previousExpiryLabel || null,
      newExpiryMs: Number(data.newExpiryMs || Date.now() + plan.duration_days * 86_400_000),
      newExpiryIso: String(
        data.newExpiryIso || new Date(Date.now() + plan.duration_days * 86_400_000).toISOString()
      ),
      newExpiryLabel: String(data.newExpiryLabel || 'Active'),
      ledgerId: String(data.ledgerId || `${resolvedTier}_koban_${safeKey}`),
    };

    completedProCache.set(cacheKey, result);
    clearPlanCache(uid);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${uid}`, `boardly_user_profile_${uid}`]) {
          const existingRaw = window.localStorage.getItem(lsKey);
          const parsed = existingRaw ? JSON.parse(existingRaw) : { uid };
          parsed.plan = resolvedTier;
          parsed.planTier = resolvedTier;
          parsed.isPremium = true;
          parsed.isPlus = resolvedTier === 'plus';
          parsed.proPlanId = result.planId;
          parsed.premiumSource = 'kobans';
          parsed.planExpiresAt = result.newExpiryIso;
          parsed.premiumExpiresAt = result.newExpiryMs;
          if (resolvedTier === 'plus') {
            parsed.plusUntil = result.newExpiryIso;
          }
          parsed.kobans = result.balanceAfter;
          window.localStorage.setItem(lsKey, JSON.stringify(parsed));
        }
        window.dispatchEvent(new Event('boardly:plan-refresh'));
        window.dispatchEvent(
          new CustomEvent('boardly:wallet-refresh', {
            detail: { balanceAfter: result.balanceAfter },
          })
        );
      }
    } catch {
      // Ignore storage errors
    }

    forceRefreshUserProfile(uid).catch(() => {});

    // Create in-app notification for student
    const planTitle = resolvedTier === 'plus' ? 'Boardly Plus Activated!' : 'Boardly Pro Activated!';
    const creditNote =
      result.extraCreditDays > 0
        ? ` Includes +${result.extraCreditDays} bonus days credited from your remaining Pro pass.`
        : '';
    try {
      await setDoc(
        doc(db, 'notifications', `${resolvedTier}_active_${result.ledgerId}`),
        {
          userId: uid,
          type: 'system',
          title: planTitle,
          message: `${result.planName} is now active until ${result.newExpiryLabel}.${creditNote} Enjoy unlimited mock tests, full analytics, and ${
            resolvedTier === 'plus' ? plansConfig.plus.aiCreditsPerDay : plansConfig.pro.aiCreditsPerDay
          } AI Mentor credits/day!`,
          link: '/dashboard/plan',
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-blocking
    }

    notifyProActivated({
      recordId: result.ledgerId,
      studentUid: uid,
      studentName: params.userName || 'Student',
      studentEmail: params.userEmail,
      planTier: resolvedTier,
      planName: result.planName,
      durationDays: result.durationDays,
      expiresAtLabel: result.newExpiryLabel,
      wasExtension: result.wasExtension,
      previousExpiryLabel: result.previousExpiryLabel,
      paidWith: 'kobans',
      kobansSpent: result.kobansCharged,
      balanceBefore: result.balanceBefore,
      newBalance: result.balanceAfter,
      transactionId: result.ledgerId,
    });

    return result;
  } finally {
    inFlightProKeys.delete(cacheKey);
    inFlightPurchaseUids.delete(uid);
  }
}

/**
 * Pure validation helper for PKR Pro/Plus payment requests.
 */
export function validateProPaymentRequestInput(params: {
  uid: string;
  planId: string;
  method: string;
  transactionId: string;
  plansConfig?: Partial<PlansConfigDoc> | null;
  existingStudentPendingRequests?: Array<{
    id: string;
    status: string;
    requestType?: string;
    plan?: string;
  }>;
  existingDuplicateTidMatches?: Array<{ id: string; transactionId?: string; TID?: string }>;
}): {
  normalizedTid: string;
  normalizedMethod: 'jazzcash' | 'opay';
  plan: ReturnType<typeof getProPlanById>;
} {
  if (!params.uid) {
    throw new Error('Please sign in to submit a plan payment request.');
  }
  if (params.uid.startsWith('guest_')) {
    const err = new Error(
      'Guest accounts cannot purchase Boardly Pro or Plus. Please create a registered account to upgrade.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GUEST_UPGRADE_FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const plan = getProPlanById(params.planId, params.plansConfig);
  const rawTid = String(params.transactionId || '').trim();
  if (rawTid.length < 5) {
    throw new Error('Please enter a valid Transaction ID (TID) of at least 5 characters.');
  }

  const normalizedTid = rawTid.toUpperCase();
  const normalizedMethod: 'jazzcash' | 'opay' =
    String(params.method || '').toLowerCase() === 'opay' ? 'opay' : 'jazzcash';

  if (
    Array.isArray(params.existingStudentPendingRequests) &&
    params.existingStudentPendingRequests.some(
      (r) =>
        r.status === 'pending' &&
        (r.requestType === 'pro_pass' ||
          r.requestType === 'plus_pass' ||
          r.plan === 'pro' ||
          r.plan === 'pro_monthly' ||
          r.plan === 'pro_annual' ||
          r.plan === 'plus' ||
          r.plan === 'plus_monthly' ||
          r.plan === 'plus_annual')
    )
  ) {
    const err = new Error(
      'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while a payment is awaiting verification.'
    ) as Error & { code?: string; status?: number };
    err.code = 'PENDING_REQUEST_EXISTS';
    err.status = 409;
    throw err;
  }

  if (
    Array.isArray(params.existingDuplicateTidMatches) &&
    params.existingDuplicateTidMatches.length > 0
  ) {
    const err = new Error(
      'This Transaction ID (TID) has already been submitted. Please check your receipt and enter your unique TID.'
    ) as Error & { code?: string; status?: number };
    err.code = 'DUPLICATE_TID';
    err.status = 409;
    throw err;
  }

  return {
    normalizedTid,
    normalizedMethod,
    plan,
  };
}

/**
 * Pay with PKR (JazzCash / Opay) for Pro or Plus (supports Free->Pro, Free->Plus, Pro->Plus upgrade, Plus renewal; blocks Plus->Pro).
 */
export async function submitProPaymentRequest(params: {
  uid: string;
  userEmail?: string;
  userName?: string;
  planId: ProPlanId;
  method: 'jazzcash' | 'opay';
  transactionId: string;
  couponCode?: string | null;
}): Promise<{ requestId: string; planName: string; amountPkr: number; tid: string }> {
  const plansConfig = await fetchPlansConfigOnce();
  const preCheck = validateProPaymentRequestInput({
    uid: params.uid,
    planId: params.planId,
    method: params.method,
    transactionId: params.transactionId,
    plansConfig,
  });

  if (inFlightPurchaseUids.has(params.uid)) {
    const err = new Error(
      'A payment request is already being submitted for your account. Please wait a moment.'
    ) as Error & { code?: string; status?: number };
    err.code = 'PURCHASE_IN_PROGRESS';
    err.status = 409;
    throw err;
  }

  inFlightPurchaseUids.add(params.uid);

  try {
    const { normalizedTid, normalizedMethod, plan } = preCheck;
    const planTier = getPlanTierFromPlanId(plan.id);
    const billing = getBillingFromPlanId(plan.id);

    const [userSnap, studentReqsSnap] = await Promise.all([
      getDoc(doc(db, 'users', params.uid)).catch(() => null),
      getDocs(
        query(collection(db, 'paymentRequests'), where('userId', '==', params.uid), limit(25))
      ).catch(() => ({ docs: [] })),
    ]);

    const userData = userSnap && userSnap.exists() ? userSnap.data() : null;
    const existingStudentReqs: Array<{ id: string; status?: string; [key: string]: any }> =
      studentReqsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, any>),
      }));

    const currentStatus = resolveUnifiedPlanStatus({
      uid: params.uid,
      email: params.userEmail || userData?.email,
      role: userData?.role,
      plan: userData?.plan,
      planTier: userData?.planTier,
      isPro: userData?.isPro,
      isPlus: userData?.isPlus,
      isPremium: userData?.isPremium,
      proPlanId: userData?.proPlanId,
      plusPlanId: userData?.plusPlanId,
      planStartedAt: userData?.planStartedAt,
      updatedAt: userData?.updatedAt,
      proUntil: userData?.proUntil,
      plusUntil: userData?.plusUntil,
      planExpiresAt: userData?.planExpiresAt,
      premiumExpiresAt: userData?.premiumExpiresAt,
      pendingRequests: existingStudentReqs,
      plansConfig,
    });

    const eligibility = evaluatePlanPurchaseEligibility(currentStatus, plan.id, plansConfig);
    if (!eligibility.allowed) {
      const err = new Error(
        eligibility.reason || 'You cannot start this plan purchase right now.'
      ) as Error & { code?: string; status?: number };
      err.code =
        currentStatus.state === 'pending'
          ? 'PAYMENT_PENDING_VERIFICATION'
          : currentStatus.isPersonalPlus && planTier === 'pro'
            ? 'PLUS_ALREADY_INCLUDES_PRO'
            : 'PRO_ALREADY_ACTIVE';
      err.status = 409;
      throw err;
    }

    const existingStudentPending = existingStudentReqs.filter((r) => r.status === 'pending');
    const ownDuplicateMatches = existingStudentReqs
      .filter((r) => {
        const t = String(r.transactionId || r.TID || '').trim().toUpperCase();
        return t === normalizedTid && String(r.status || '').toLowerCase() !== 'rejected';
      })
      .map((r) => ({ id: r.id }));

    validateProPaymentRequestInput({
      uid: params.uid,
      planId: params.planId,
      method: params.method,
      transactionId: params.transactionId,
      plansConfig,
      existingStudentPendingRequests: existingStudentPending as any,
      existingDuplicateTidMatches: ownDuplicateMatches,
    });

    const cleanCouponCode = normalizeCouponCode(params.couponCode) || null;
    const durationMonths = billing === 'annual' ? 12 : 1;

    let finalDocId: string;
    let finalAmountPkr: number;

    if (cleanCouponCode) {
      // Route coupon-bearing payment requests through the server so coupon redemptions stay server-only
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      if (!token) {
        const err = new Error('Please sign in again') as Error & { code?: string; status?: number };
        err.code = 'UNAUTHENTICATED';
        err.status = 401;
        throw err;
      }
      const resp = await fetch('/api/pro/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          planTier,
          billing,
          paymentMethod: normalizedMethod,
          method: normalizedMethod,
          transactionId: normalizedTid,
          tid: normalizedTid,
          couponCode: cleanCouponCode,
          userEmail: params.userEmail || userData?.email || '',
          userName: params.userName || userData?.displayName || userData?.name || 'Student',
        }),
      });
      const data = (await resp.json().catch(() => ({}))) as Record<string, any>;
      if (!resp.ok || !data?.ok) {
        const err = new Error(
          mapPlanActivationError(
            { status: resp.status, code: data?.code, message: data?.error || data?.message },
            'Could not submit payment request. Please try again.'
          )
        ) as Error & { code?: string; status?: number };
        err.code = data?.code || 'PAYMENT_SUBMIT_FAILED';
        err.status = resp.status;
        throw err;
      }
      finalDocId = String(data.requestId || `pay_${Date.now()}`);
      finalAmountPkr = Number(data.amountPkr ?? plan.price_pkr);
    } else {
      const paymentRef = doc(collection(db, 'paymentRequests'));
      finalDocId = paymentRef.id;
      finalAmountPkr = plan.price_pkr;
      await setDoc(paymentRef, {
        id: finalDocId,
        uid: params.uid,
        userId: params.uid,
        userEmail: params.userEmail || userData?.email || '',
        userName: params.userName || userData?.displayName || userData?.name || 'Student',
        requestType: planTier === 'plus' ? 'plus_pass' : 'pro_pass',
        plan: plan.id,
        planId: plan.id,
        planTier,
        billing,
        planName: plan.name,
        durationDays: plan.duration_days,
        durationMonths,
        amount: plan.price_pkr,
        amount_pkr: plan.price_pkr,
        expectedAmountPkr: plan.price_pkr,
        originalAmountPkr: plan.price_pkr,
        discountPkr: 0,
        bonusKobans: 0,
        couponCode: null,
        couponType: null,
        proToPlusCreditDays: eligibility.extraPlusDays,
        previousPlan: currentStatus.planTier,
        method: normalizedMethod,
        TID: normalizedTid,
        transactionId: normalizedTid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    }

    clearPlanCache(params.uid);
    forceRefreshPaymentRequests(params.uid).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('boardly:plan-refresh'));
    }

    notifyProRequestReceived({
      requestId: finalDocId,
      studentUid: params.uid,
      studentName: params.userName,
      studentEmail: params.userEmail,
      planTier,
      planName: plan.name,
      durationDays: plan.duration_days,
      pkrAmount: finalAmountPkr,
      paymentMethod: normalizedMethod,
      transactionId: normalizedTid,
    });

    return {
      requestId: finalDocId,
      planName: plan.name,
      amountPkr: finalAmountPkr,
      tid: normalizedTid,
    };
  } finally {
    inFlightPurchaseUids.delete(params.uid);
  }
}

/**
 * Fetches the current student's Pro/Plus payment requests sorted newest first.
 */
export async function fetchStudentProRequests(uid: string): Promise<PaymentRequest[]> {
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'paymentRequests'), where('userId', '==', uid), limit(20))
    );
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRequest));
    list.sort((a, b) => {
      const tA = (a.createdAt as { seconds?: number })?.seconds || 0;
      const tB = (b.createdAt as { seconds?: number })?.seconds || 0;
      return tB - tA;
    });
    return list;
  } catch (err) {
    console.warn('[proSubscriptionService] fetchStudentProRequests error:', err);
    return [];
  }
}
