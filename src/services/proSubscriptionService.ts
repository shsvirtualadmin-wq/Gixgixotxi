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
export async function purchaseProWithKobans(params: {
  uid: string;
  userEmail?: string;
  userName?: string;
  planId: ProPlanId;
  idempotencyKey: string;
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

  const userRef = doc(db, 'users', uid);
  const walletRef = doc(db, 'wallets', uid);
  const ledgerDocId = `pro_koban_${safeKey}`.slice(0, 120);
  const ledgerRef = doc(db, 'wallets', uid, 'ledger', ledgerDocId);

  try {
    // 1. Pre-check pending paymentRequests in Firestore
    const pendingReqsSnap = await getDocs(
      query(collection(db, 'paymentRequests'), where('userId', '==', uid), limit(25))
    );
    const existingPendingDocs = pendingReqsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, any>),
    }));

    // 2. Enforce server-authoritative guard before running transaction
    const { serverNowMs } = await callServerProPurchaseGuard({
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

    const txOutcome = await runTransaction(db, async (tx) => {
      const [userSnap, walletSnap, ledgerSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(walletRef),
        tx.get(ledgerRef),
      ]);

      const walletData = walletSnap.exists() ? walletSnap.data() : null;
      const userData = userSnap.exists() ? userSnap.data() : null;

      const userKobans =
        userData && typeof userData.kobans === 'number' && Number.isFinite(userData.kobans)
          ? Math.floor(userData.kobans)
          : 0;
      const userKobanBalance =
        userData &&
        typeof userData.kobanBalance === 'number' &&
        Number.isFinite(userData.kobanBalance)
          ? Math.floor(userData.kobanBalance)
          : 0;
      const userDocBalance = Math.max(userKobans, userKobanBalance);

      const walletBalance =
        walletData && typeof walletData.balance === 'number' && Number.isFinite(walletData.balance)
          ? Math.floor(walletData.balance)
          : null;

      const currentBalance =
        walletBalance !== null && walletBalance > 0
          ? Math.max(walletBalance, userDocBalance)
          : Math.max(walletBalance ?? 0, userDocBalance);

      // Idempotency guard: if this exact ledger entry already exists, return the existing result without charging again
      if (ledgerSnap.exists()) {
        const lData = ledgerSnap.data();
        const existingExpiryIso =
          lData?.newExpiryIso ||
          (typeof userData?.planExpiresAt === 'string'
            ? userData.planExpiresAt
            : new Date(Date.now() + plan.duration_days * 86_400_000).toISOString());
        const existingExpiryMs = new Date(existingExpiryIso).getTime();
        return {
          alreadyProcessed: true,
          planId: plan.id,
          planName: plan.name,
          durationDays: plan.duration_days,
          kobansCharged: plan.price_kobans,
          balanceBefore: Number(lData?.balanceBefore ?? lData?.balance_before ?? currentBalance),
          balanceAfter: Number(lData?.balanceAfter ?? lData?.balance_after ?? currentBalance),
          wasExtension: Boolean(lData?.wasExtension),
          previousExpiryLabel: lData?.previousExpiryLabel || null,
          newExpiryMs: existingExpiryMs,
          newExpiryIso: existingExpiryIso,
          newExpiryLabel:
            lData?.newExpiryLabel ||
            new Date(existingExpiryMs).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          ledgerId: ledgerDocId,
          studentName: String(
            params.userName || userData?.displayName || userData?.name || 'Student'
          ),
          studentEmail:
            String(params.userEmail || userData?.email || '').trim() || undefined,
        };
      }

      // Atomic check inside transaction: block if the user already has an active plan or pending payment
      const liveStatus = resolveUnifiedPlanStatus({
        uid,
        email: params.userEmail || userData?.email,
        role: userData?.role,
        plan: userData?.plan,
        isPremium: userData?.isPremium,
        proPlanId: userData?.proPlanId,
        planStartedAt: userData?.planStartedAt,
        updatedAt: userData?.updatedAt,
        planExpiresAt: userData?.planExpiresAt,
        premiumExpiresAt: userData?.premiumExpiresAt,
        pendingRequests: existingPendingDocs,
        nowMs: serverNowMs,
      });

      if (liveStatus.state === 'active') {
        const err = new Error(
          liveStatus.blockReason ||
            `You already have Boardly Pro (${liveStatus.planName}) active until ${liveStatus.expiryFormatted}. You can purchase again after your current plan expires.`
        ) as Error & { code?: string; status?: number };
        err.code = 'PRO_ALREADY_ACTIVE';
        err.status = 409;
        throw err;
      }

      if (liveStatus.state === 'pending') {
        const err = new Error(
          liveStatus.blockReason ||
            'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while a payment is awaiting verification.'
        ) as Error & { code?: string; status?: number };
        err.code = 'PAYMENT_PENDING_VERIFICATION';
        err.status = 409;
        throw err;
      }

      const currentExpiryRaw = userData?.planExpiresAt ?? userData?.premiumExpiresAt ?? null;
      const outcome = calculateProPurchaseOutcome({
        planId: plan.id,
        currentBalance,
        currentExpiryRaw,
        nowMs: serverNowMs,
      });

      const curOwned: string[] =
        walletData && Array.isArray(walletData.owned) ? walletData.owned : [];
      const curEquipped = walletData?.equipped ||
        userData?.equipped || {
          effect: null,
          frame: null,
          nameplate: null,
          avatar: null,
          banner: null,
        };

      // 1. Update wallet balance
      tx.set(
        walletRef,
        {
          uid,
          userId: uid,
          balance: outcome.balanceAfter,
          owned: curOwned,
          equipped: curEquipped,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Update user document with new balance AND activated Pro expiry
      tx.set(
        userRef,
        {
          uid,
          kobans: outcome.balanceAfter,
          kobanBalance: outcome.balanceAfter,
          plan: 'pro',
          isPremium: true,
          proPlanId: outcome.planId,
          premiumSource: 'kobans',
          planStartedAt: new Date(serverNowMs).toISOString(),
          planExpiresAt: outcome.newExpiryIso,
          premiumExpiresAt: outcome.newExpiryMs,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Write immutable ledger entry with balanceBefore / balance_before and balanceAfter / balance_after
      tx.set(ledgerRef, {
        id: ledgerDocId,
        userId: uid,
        type: 'pro_purchase',
        amount: outcome.delta,
        balanceBefore: outcome.balanceBefore,
        balance_before: outcome.balanceBefore,
        balanceAfter: outcome.balanceAfter,
        balance_after: outcome.balanceAfter,
        planId: outcome.planId,
        planName: outcome.planName,
        durationDays: outcome.durationDays,
        wasExtension: outcome.wasExtension,
        previousExpiryLabel: outcome.previousExpiryLabel,
        newExpiryIso: outcome.newExpiryIso,
        newExpiryLabel: outcome.newExpiryLabel,
        transactionId: ledgerDocId,
        reason: `${outcome.planName} (${outcome.durationDays} Days)`,
        timestamp: serverTimestamp(),
      });

      return {
        alreadyProcessed: false,
        planId: outcome.planId,
        planName: outcome.planName,
        durationDays: outcome.durationDays,
        kobansCharged: outcome.priceKobans,
        balanceBefore: outcome.balanceBefore,
        balanceAfter: outcome.balanceAfter,
        wasExtension: outcome.wasExtension,
        previousExpiryLabel: outcome.previousExpiryLabel,
        newExpiryMs: outcome.newExpiryMs,
        newExpiryIso: outcome.newExpiryIso,
        newExpiryLabel: outcome.newExpiryLabel,
        ledgerId: ledgerDocId,
        studentName: String(
          params.userName || userData?.displayName || userData?.name || 'Student'
        ),
        studentEmail:
          String(params.userEmail || userData?.email || '').trim() || undefined,
      };
    });

    // Record the active lock on the server D1 store so another tab is immediately aware
    callServerProPurchaseGuard({
      endpoint: '/api/pro/activate',
      uid,
      planId: txOutcome.planId,
      planName: txOutcome.planName,
      durationDays: txOutcome.durationDays,
      amountPkr: plan.price_pkr,
      method: 'kobans',
      commitLock: true,
      lockState: 'active',
      expiresAtMs: txOutcome.newExpiryMs,
    }).catch(() => {});

    const result: ProKobanPurchaseResult = {
      success: true,
      alreadyProcessed: txOutcome.alreadyProcessed,
      planId: txOutcome.planId,
      planName: txOutcome.planName,
      durationDays: txOutcome.durationDays,
      kobansCharged: txOutcome.kobansCharged,
      balanceBefore: txOutcome.balanceBefore,
      balanceAfter: txOutcome.balanceAfter,
      wasExtension: txOutcome.wasExtension,
      previousExpiryLabel: txOutcome.previousExpiryLabel,
      newExpiryMs: txOutcome.newExpiryMs,
      newExpiryIso: txOutcome.newExpiryIso,
      newExpiryLabel: txOutcome.newExpiryLabel,
      ledgerId: txOutcome.ledgerId,
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
          parsed.proPlanId = txOutcome.planId;
          parsed.premiumSource = 'kobans';
          parsed.planExpiresAt = txOutcome.newExpiryIso;
          parsed.premiumExpiresAt = txOutcome.newExpiryMs;
          parsed.kobans = txOutcome.balanceAfter;
          window.localStorage.setItem(lsKey, JSON.stringify(parsed));
        }
        window.dispatchEvent(new Event('boardly:plan-refresh'));
      }
    } catch {
      // Ignore storage errors
    }

    forceRefreshUserProfile(uid).catch(() => {});

    if (!txOutcome.alreadyProcessed) {
      // Create in-app notification for student
      try {
        await setDoc(
          doc(db, 'notifications', `pro_active_${txOutcome.ledgerId}`),
          {
            userId: uid,
            type: 'system',
            title: 'Boardly Pro Activated!',
            message: `${txOutcome.planName} is now active until ${txOutcome.newExpiryLabel}. Enjoy unlimited mock tests, full analytics, and exclusive Pro perks!`,
            link: '/dashboard/plans',
            read: false,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // Non-blocking
      }

      // Send "Pro activated" / receipt email with atomic balanceBefore & balanceAfter
      notifyProActivated({
        recordId: txOutcome.ledgerId,
        studentUid: uid,
        studentName: txOutcome.studentName,
        studentEmail: txOutcome.studentEmail,
        planName: txOutcome.planName,
        durationDays: txOutcome.durationDays,
        expiresAtLabel: txOutcome.newExpiryLabel,
        wasExtension: txOutcome.wasExtension,
        previousExpiryLabel: txOutcome.previousExpiryLabel,
        paidWith: 'kobans',
        kobansSpent: txOutcome.kobansCharged,
        balanceBefore: txOutcome.balanceBefore,
        newBalance: txOutcome.balanceAfter,
        transactionId: txOutcome.ledgerId,
      });
    }

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
 * - Rejects if student already has an active Pro plan or pending manual payment (on both server and Firestore)
 * - Reads plan price & duration from `PLANS` config (`PKR 199` monthly, `PKR 1,791` annual)
 * - Allows only one pending Pro request per student at a time
 * - Rejects duplicate TIDs across `paymentRequests` and `kobanRequests`
 * - Creates a `pro_payment_request` record in `paymentRequests`
 * - Dispatches the "Pro request received" email to student and admins
 */
export async function submitProPaymentRequest(params: {
  uid: string;
  userEmail?: string;
  userName?: string;
  planId: ProPlanId;
  method: 'jazzcash' | 'opay';
  transactionId: string;
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
    const rawTidTrimmed = params.transactionId.trim();

    // 1. Read student's user profile AND existing paymentRequests in parallel
    const [userSnap, studentReqsSnap] = await Promise.all([
      getDoc(doc(db, 'users', params.uid)),
      getDocs(query(collection(db, 'paymentRequests'), where('userId', '==', params.uid), limit(25))),
    ]);

    const userData = userSnap.exists() ? userSnap.data() : null;
    const existingStudentReqs = studentReqsSnap.docs.map((d) => ({
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

    // 2. Check for duplicate TID in paymentRequests and kobanRequests (case-insensitive check on trimmed & uppercase)
    const [dupPaymentUpper, dupPaymentRaw, dupKobanUpper, dupKobanRaw] = await Promise.all([
      getDocs(
        query(collection(db, 'paymentRequests'), where('transactionId', '==', normalizedTid), limit(5))
      ),
      rawTidTrimmed !== normalizedTid
        ? getDocs(
            query(
              collection(db, 'paymentRequests'),
              where('transactionId', '==', rawTidTrimmed),
              limit(5)
            )
          )
        : Promise.resolve({ docs: [] }),
      getDocs(
        query(collection(db, 'kobanRequests'), where('transactionId', '==', normalizedTid), limit(5))
      ),
      rawTidTrimmed !== normalizedTid
        ? getDocs(
            query(
              collection(db, 'kobanRequests'),
              where('transactionId', '==', rawTidTrimmed),
              limit(5)
            )
          )
        : Promise.resolve({ docs: [] }),
    ]);

    const duplicateMatches = [
      ...dupPaymentUpper.docs,
      ...dupPaymentRaw.docs,
      ...dupKobanUpper.docs,
      ...dupKobanRaw.docs,
    ].map((d) => ({ id: d.id }));

    validateProPaymentRequestInput({
      uid: params.uid,
      planId: params.planId,
      method: params.method,
      transactionId: params.transactionId,
      existingStudentPendingRequests: existingStudentPending as any,
      existingDuplicateTidMatches: duplicateMatches,
    });

    // 3. Enforce server-side purchase guard and atomically lock in D1 so a second tab cannot race
    await callServerProPurchaseGuard({
      endpoint: '/api/pro/submit-payment',
      uid: params.uid,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.duration_days,
      amountPkr: plan.price_pkr,
      method: normalizedMethod,
      tid: normalizedTid,
      commitLock: true,
      lockState: 'pending',
    });

    const durationMonths = plan.id === 'pro_annual' ? 12 : 1;

    const docRef = await addDoc(collection(db, 'paymentRequests'), {
      uid: params.uid,
      userId: params.uid,
      userEmail: params.userEmail || '',
      userName: params.userName || 'Student',
      requestType: 'pro_pass',
      plan: plan.id,
      planName: plan.name,
      durationDays: plan.duration_days,
      durationMonths,
      amount: plan.price_pkr,
      amount_pkr: plan.price_pkr,
      method: normalizedMethod,
      TID: normalizedTid,
      transactionId: normalizedTid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    clearPlanCache(params.uid);
    forceRefreshPaymentRequests(params.uid).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('boardly:plan-refresh'));
    }

    notifyProRequestReceived({
      requestId: docRef.id,
      studentUid: params.uid,
      studentName: params.userName,
      studentEmail: params.userEmail,
      planName: plan.name,
      durationDays: plan.duration_days,
      pkrAmount: plan.price_pkr,
      paymentMethod: normalizedMethod,
      transactionId: normalizedTid,
    });

    return {
      requestId: docRef.id,
      planName: plan.name,
      amountPkr: plan.price_pkr,
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
