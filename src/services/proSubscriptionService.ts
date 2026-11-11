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
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  getProPlanById,
  computeExtendedProExpiry,
  resolveUnifiedPlanStatus,
  type ProPlanId,
} from '@/config/plans';
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
  planName: string;
  durationDays: number;
  kobansCharged: number;
  balanceBefore: number;
  balanceAfter: number;
  wasExtension: boolean;
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
  endpoint: '/api/pro/purchase' | '/api/pro/submit-payment' | '/api/pro/activate' | '/api/pro/purchase-guard';
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
      'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.'
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
    // If network call to auxiliary worker fails locally, fallback to Firestore transaction guard
    return { serverNowMs: Date.now() };
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.ok === false) {
    console.error('[proSubscriptionService] Pro purchase guard rejected:', {
      status: resp.status,
      url: resp.url || params.endpoint,
      body: data,
    });
    const message =
      data?.error ||
      (resp.status === 403
        ? 'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.'
        : 'You cannot start another purchase while you have an active plan or a payment awaiting verification.');
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
 * Pure helper used both inside the Firestore transaction and by unit/integration tests
 * to verify balance, compute deduction, and compute the new or extended Pro expiry date.
 */
export function calculateProPurchaseOutcome(params: {
  planId: string;
  currentBalance: number;
  currentExpiryRaw: unknown;
  nowMs?: number;
}): {
  planId: ProPlanId;
  planName: string;
  durationDays: number;
  pricePkr: number;
  priceKobans: number;
  balanceBefore: number;
  delta: number;
  balanceAfter: number;
  wasExtension: boolean;
  previousExpiryMs: number | null;
  previousExpiryLabel: string | null;
  newExpiryMs: number;
  newExpiryIso: string;
  newExpiryLabel: string;
} {
  // Always read price and duration from the server/shared PLANS config, never trusting the client
  const plan = getProPlanById(params.planId);
  const balanceBefore = Math.max(0, Math.floor(Number(params.currentBalance) || 0));
  const priceKobans = plan.price_kobans; // 1,990 for monthly, 17,910 for annual

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
  const extension = computeExtendedProExpiry(
    params.currentExpiryRaw,
    plan.duration_days,
    params.nowMs
  );

  return {
    planId: plan.id,
    planName: plan.name,
    durationDays: plan.duration_days,
    pricePkr: plan.price_pkr,
    priceKobans,
    balanceBefore,
    delta,
    balanceAfter,
    wasExtension: extension.wasAlreadyActive,
    previousExpiryMs: extension.previousExpiryMs,
    previousExpiryLabel: extension.previousExpiryLabel,
    newExpiryMs: extension.newExpiryMs,
    newExpiryIso: new Date(extension.newExpiryMs).toISOString(),
    newExpiryLabel: extension.newExpiryLabel,
  };
}

/**
 * Pay with Kobans:
 * Runs server-side guard + atomic Firestore transaction that:
 * 1. Verifies the user does NOT already have an active Pro plan or pending manual payment
 * 2. Verifies the student's wallet balance
 * 3. Deducts `price_kobans` (read strictly from PLANS config)
 * 4. Activates Pro for 30 or 365 days
 * 5. Writes an immutable ledger entry with `balance_before` (`balanceBefore`) and `balance_after` (`balanceAfter`)
 * 6. Uses an `idempotencyKey` and per-UID lock so a double-tap or two tabs cannot charge twice
 * 7. Sends the "Pro activated" / receipt email after commit
 */
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
}): Promise<ValidatedCouponInfo> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Please sign in to apply a coupon code.');
  }
  const resp = await fetch('/api/coupons/validate', {
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
  if (!resp.ok || !data?.ok || !data?.coupon) {
    throw new Error(data?.error || 'Invalid or expired coupon code.');
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
    clearPlanCache(params.uid);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${params.uid}`, `boardly_user_profile_${params.uid}`]) {
          const existingRaw = window.localStorage.getItem(lsKey);
          const parsed = existingRaw ? JSON.parse(existingRaw) : { uid: params.uid };
          parsed.plan = 'pro';
          parsed.isPremium = true;
          parsed.proPlanId = data.planId;
          parsed.premiumSource = 'coupon';
          parsed.planExpiresAt = data.newExpiryIso;
          parsed.premiumExpiresAt = data.newExpiryMs;
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
    throw new Error('Please sign in to purchase Boardly Pro.');
  }
  if (uid.startsWith('guest_')) {
    const err = new Error(
      'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GUEST_UPGRADE_FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const plan = getProPlanById(planId);
  const safeKey = sanitizeIdempotencyKey(params.idempotencyKey);
  const cacheKey = `${uid}:${safeKey}`;

  if (completedProCache.has(cacheKey)) {
    return completedProCache.get(cacheKey)!;
  }
  if (inFlightProKeys.has(cacheKey) || inFlightPurchaseUids.has(uid)) {
    const err = new Error(
      'Your Pro pass purchase is already being processed. Please wait a moment.'
    ) as Error & { code?: string; status?: number };
    err.code = 'PURCHASE_IN_PROGRESS';
    err.status = 409;
    throw err;
  }

  inFlightProKeys.add(cacheKey);
  inFlightPurchaseUids.add(uid);

  try {
    // 1. Enforce server-authoritative guard before executing purchase
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
      throw new Error('Authentication required to purchase Boardly Pro.');
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
        couponCode: params.couponCode || null,
        idempotencyKey: safeKey,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.ok) {
      console.error('[proSubscriptionService] Pro purchase with Kobans failed:', {
        status: resp.status,
        url: resp.url || '/api/pro/purchase-kobans',
        body: data,
      });
      const err = new Error(
        data?.error || 'Could not complete Boardly Pro purchase with Kobans.'
      ) as Error & { code?: string; status?: number };
      err.code = data?.code || 'PRO_PURCHASE_FAILED';
      err.status = resp.status;
      throw err;
    }

    // Record the active lock on the server D1 store so another tab is immediately aware
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
      alreadyProcessed: false,
      planId: data.planId || plan.id,
      planName: data.planName || plan.name,
      durationDays: data.durationDays || plan.duration_days,
      kobansCharged: Number(data.kobansSpent ?? plan.price_kobans),
      balanceBefore: Number(data.balanceBefore ?? 0),
      balanceAfter: Number(data.newBalance ?? 0),
      wasExtension: Boolean(data.wasExtension),
      previousExpiryLabel: data.previousExpiryLabel || null,
      newExpiryMs: Number(data.newExpiryMs || Date.now() + plan.duration_days * 86_400_000),
      newExpiryIso: String(
        data.newExpiryIso || new Date(Date.now() + plan.duration_days * 86_400_000).toISOString()
      ),
      newExpiryLabel: String(data.newExpiryLabel || 'Active'),
      ledgerId: String(data.ledgerId || `pro_koban_${safeKey}`),
    };

    completedProCache.set(cacheKey, result);
    clearPlanCache(uid);

    // Update both localStorage profile cache keys so all UI hooks reflect Pro status immediately
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${uid}`, `boardly_user_profile_${uid}`]) {
          const existingRaw = window.localStorage.getItem(lsKey);
          const parsed = existingRaw ? JSON.parse(existingRaw) : { uid };
          parsed.plan = 'pro';
          parsed.isPremium = true;
          parsed.proPlanId = result.planId;
          parsed.premiumSource = 'kobans';
          parsed.planExpiresAt = result.newExpiryIso;
          parsed.premiumExpiresAt = result.newExpiryMs;
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
    try {
      await setDoc(
        doc(db, 'notifications', `pro_active_${result.ledgerId}`),
        {
          userId: uid,
          type: 'system',
          title: 'Boardly Pro Activated!',
          message: `${result.planName} is now active until ${result.newExpiryLabel}. Enjoy unlimited mock tests, full analytics, and exclusive Pro perks!`,
          link: '/dashboard/plans',
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
 * Pure validation helper for PKR Pro payment requests (checks TID format, pending request lock, and duplicate TID).
 */
export function validateProPaymentRequestInput(params: {
  uid: string;
  planId: string;
  method: string;
  transactionId: string;
  existingStudentPendingRequests?: Array<{ id: string; status: string; requestType?: string; plan?: string }>;
  existingDuplicateTidMatches?: Array<{ id: string; transactionId?: string; TID?: string }>;
}): {
  normalizedTid: string;
  normalizedMethod: 'jazzcash' | 'opay';
  plan: ReturnType<typeof getProPlanById>;
} {
  if (!params.uid) {
    throw new Error('Please sign in to submit a Pro pass payment request.');
  }
  if (params.uid.startsWith('guest_')) {
    const err = new Error(
      'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GUEST_UPGRADE_FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const plan = getProPlanById(params.planId);
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
        (r.requestType === 'pro_pass' || r.plan === 'pro' || r.plan === 'pro_monthly' || r.plan === 'pro_annual')
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
 * Pay with PKR (JazzCash / Opay):
 * - Verifies Firebase ID token and executes duplicate TID check + optional coupon discount on the server (`/api/pro/submit-payment`)
 * - Never queries other users' `paymentRequests` or `kobanRequests` from the client (fixing the "Missing or insufficient permissions." error)
 * - Creates a `pending` payment request scoped strictly to the user's own `uid`
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
  const preCheck = validateProPaymentRequestInput({
    uid: params.uid,
    planId: params.planId,
    method: params.method,
    transactionId: params.transactionId,
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

    // 1. Read ONLY the current student's own profile and own paymentRequests (allowed by Firestore rules)
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

    // Check unified plan status before allowing any payment submission
    const currentStatus = resolveUnifiedPlanStatus({
      uid: params.uid,
      email: params.userEmail || userData?.email,
      role: userData?.role,
      plan: userData?.plan,
      isPremium: userData?.isPremium,
      proPlanId: userData?.proPlanId,
      planStartedAt: userData?.planStartedAt,
      updatedAt: userData?.updatedAt,
      planExpiresAt: userData?.planExpiresAt,
      premiumExpiresAt: userData?.premiumExpiresAt,
      pendingRequests: existingStudentReqs,
    });

    if (currentStatus.state === 'active') {
      const err = new Error(
        currentStatus.blockReason ||
          `You already have Boardly Pro (${currentStatus.planName}) active until ${currentStatus.expiryFormatted}. You can purchase again after your current plan expires.`
      ) as Error & { code?: string; status?: number };
      err.code = 'PRO_ALREADY_ACTIVE';
      err.status = 409;
      throw err;
    }

    if (currentStatus.state === 'pending') {
      const err = new Error(
        currentStatus.blockReason ||
          'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while a payment is awaiting verification.'
      ) as Error & { code?: string; status?: number };
      err.code = 'PAYMENT_PENDING_VERIFICATION';
      err.status = 409;
      throw err;
    }

    const existingStudentPending = existingStudentReqs.filter((r) => r.status === 'pending');
    // Check own requests for duplicate TID
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
      existingStudentPendingRequests: existingStudentPending as any,
      existingDuplicateTidMatches: ownDuplicateMatches,
    });

    // 2. Submit via server-side Worker endpoint (`/api/pro/submit-payment`) which performs cross-user TID duplicate checks, coupon validation, and D1 lock
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    let serverRequestId = '';
    let finalAmountPkr = plan.price_pkr;
    let discountPkr = 0;
    let appliedCouponCode: string | null = params.couponCode
      ? params.couponCode.trim().toUpperCase()
      : null;
    let wroteOnServer = false;

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
          planName: plan.name,
          durationDays: plan.duration_days,
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
        finalAmountPkr = Number(data.paymentRequest.amount_pkr ?? data.paymentRequest.amount ?? plan.price_pkr);
        discountPkr = Number(data.paymentRequest.discountPkr ?? 0);
        appliedCouponCode = data.paymentRequest.couponCode || appliedCouponCode;
      }
      wroteOnServer = Boolean(data?.wroteOnServer);
    }

    const durationMonths = plan.id === 'pro_annual' ? 12 : 1;
    let finalDocId = serverRequestId;

    // 3. Ensure the paymentRequest document exists in Firestore (own-uid create with status: 'pending' is allowed by firestore.rules)
    if (!wroteOnServer) {
      const paymentPayload: Record<string, any> = {
        uid: params.uid,
        userId: params.uid,
        userEmail: params.userEmail || userData?.email || '',
        userName: params.userName || userData?.displayName || userData?.name || 'Student',
        requestType: 'pro_pass',
        plan: plan.id,
        planName: plan.name,
        durationDays: plan.duration_days,
        durationMonths,
        amount: finalAmountPkr,
        amount_pkr: finalAmountPkr,
        originalAmountPkr: plan.price_pkr,
        discountPkr,
        couponCode: appliedCouponCode,
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
 * Fetches the current student's Pro payment requests sorted newest first.
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
