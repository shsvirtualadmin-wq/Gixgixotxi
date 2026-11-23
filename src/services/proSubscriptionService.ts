import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
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
  discountType: '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans' | 'free_pro';
  percentOff: number;
  discountPercent?: number;
  amountOffPkr: number;
  amountOffKobans: number;
  durationMonths: number;
  durationDays: number;
  maxRedemptions: number;
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

export async function validateProCoupon(params: {
  code: string;
  planId: ProPlanId;
  amount?: number;
}): Promise<ValidatedCouponInfo> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Please sign in to apply a coupon code.');
  }
  const cleanCode = params.code.trim().toUpperCase();
  const billing = getBillingFromPlanId(params.planId);
  const resp = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: cleanCode,
      plan: billing,
      planId: params.planId,
      ...(typeof params.amount === 'number' && Number.isFinite(params.amount)
        ? { amount: params.amount }
        : {}),
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.valid === false || data?.ok === false) {
    const rawMsg = String(data?.message || data?.error || '').trim();
    const isRawRouteErr = /route not found/i.test(rawMsg);
    throw new Error(
      !rawMsg || isRawRouteErr ? 'Could not validate coupon right now. Please try again.' : rawMsg
    );
  }
  if (!data?.coupon) {
    throw new Error(data?.message || data?.error || 'Invalid coupon');
  }
  return data.coupon as ValidatedCouponInfo;
}

export async function redeemProCoupon(params: {
  uid?: string;
  code: string;
  planId: ProPlanId;
}): Promise<{
  activatedPro: boolean;
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
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Please sign in to redeem a coupon code.');
  }
  const resp = await fetch('/api/coupons/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: params.code.trim(),
      planId: params.planId,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.ok) {
    throw new Error(data?.error || 'Could not redeem coupon code.');
  }

  if (data.activatedPro && params.uid) {
    const activatedTier = getPlanTierFromPlanId(data.planId || params.planId);
    clearPlanCache(params.uid);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${params.uid}`, `boardly_user_profile_${params.uid}`]) {
          const existingRaw = window.localStorage.getItem(lsKey);
          const parsed = existingRaw ? JSON.parse(existingRaw) : { uid: params.uid };
          parsed.plan = activatedTier;
          parsed.planTier = activatedTier;
          parsed.isPremium = true;
          parsed.isPlus = activatedTier === 'plus';
          parsed.proPlanId = data.planId;
          parsed.premiumSource = 'coupon';
          parsed.planExpiresAt = data.newExpiryIso;
          parsed.premiumExpiresAt = data.newExpiryMs;
          if (activatedTier === 'plus') {
            parsed.plusUntil = data.newExpiryIso;
          }
          window.localStorage.setItem(lsKey, JSON.stringify(parsed));
        }
        window.dispatchEvent(new Event('boardly:plan-refresh'));
      }
    } catch {
      // Ignore storage error
    }
    forceRefreshUserProfile(params.uid).catch(() => {});
  }

  return data;
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
        couponCode: params.couponCode || null,
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

    const token = await auth.currentUser?.getIdToken().catch(() => null);
    let serverRequestId = '';
    let finalAmountPkr = plan.price_pkr;
    let discountPkr = 0;
    let appliedCouponCode: string | null = params.couponCode
      ? params.couponCode.trim().toUpperCase()
      : null;
    let wroteOnServer = false;

    if (appliedCouponCode && !token) {
      throw new Error('Please sign in to apply a coupon and submit your payment.');
    }

    if (token) {
      const resp = await fetch('/api/pro/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: params.uid,
          userEmail: params.userEmail || userData?.email || '',
          userName: params.userName || userData?.displayName || userData?.name || 'Student',
          planId: plan.id,
          planTier,
          billing,
          planName: plan.name,
          durationDays: plan.duration_days,
          expectedAmountPkr: plan.price_pkr,
          proToPlusCreditDays: eligibility.extraPlusDays,
          previousPlan: currentStatus.planTier,
          paymentMethod: normalizedMethod,
          method: normalizedMethod,
          transactionId: normalizedTid,
          tid: normalizedTid,
          couponCode: appliedCouponCode,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.ok === false) {
        const err = new Error(
          data?.error || 'Could not submit payment verification request.'
        ) as Error & { code?: string; status?: number };
        err.code = data?.code || 'PAYMENT_SUBMIT_FAILED';
        err.status = resp.status;
        throw err;
      }
      if (data?.requestId) {
        serverRequestId = String(data.requestId);
      }
      if (data?.paymentRequest) {
        finalAmountPkr = Number(
          data.paymentRequest.amount_pkr ?? data.paymentRequest.amount ?? plan.price_pkr
        );
        discountPkr = Number(data.paymentRequest.discountPkr ?? 0);
        appliedCouponCode = data.paymentRequest.couponCode || appliedCouponCode;
      }
      wroteOnServer = Boolean(data?.wroteOnServer);
    }

    const durationMonths = billing === 'annual' ? 12 : 1;
    let finalDocId = serverRequestId;

    if (!wroteOnServer) {
      const paymentPayload: Record<string, any> = {
        uid: params.uid,
        userId: params.uid,
        userEmail: params.userEmail || userData?.email || '',
        userName: params.userName || userData?.displayName || userData?.name || 'Student',
        requestType: planTier === 'plus' ? 'plus_pass' : 'pro_pass',
        plan: plan.id,
        planTier,
        billing,
        planName: plan.name,
        durationDays: plan.duration_days,
        durationMonths,
        amount: finalAmountPkr,
        amount_pkr: finalAmountPkr,
        expectedAmountPkr: finalAmountPkr,
        originalAmountPkr: plan.price_pkr,
        discountPkr,
        couponCode: appliedCouponCode,
        proToPlusCreditDays: eligibility.extraPlusDays,
        previousPlan: currentStatus.planTier,
        method: normalizedMethod,
        TID: normalizedTid,
        transactionId: normalizedTid,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      if (finalDocId) {
        await setDoc(doc(db, 'paymentRequests', finalDocId), paymentPayload);
      } else {
        const docRef = await addDoc(collection(db, 'paymentRequests'), paymentPayload);
        finalDocId = docRef.id;
      }
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
