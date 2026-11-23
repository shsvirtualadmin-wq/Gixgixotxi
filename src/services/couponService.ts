import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlansConfigDoc } from '@/lib/planTier';
import { fetchPlansConfigOnce } from '@/hooks/usePlansConfig';
import {
  COUPON_ERROR_MESSAGES,
  CouponValidationError,
  evaluateCouponEligibility,
  executeAtomicCouponCheckout,
  normalizeCouponCode,
  normalizeCouponDoc,
  resolveCheckoutItemPricing,
  validateNewCouponDraft,
  type AtomicCouponCheckoutResult,
  type CheckoutItemPricing,
  type CouponDiscountBreakdown,
  type CouponDoc,
  type CouponEvaluationResult,
  type NewCouponDraftInput,
} from '@/utils/couponEngine';

export {
  COUPON_ERROR_MESSAGES,
  CouponValidationError,
  normalizeCouponCode,
  type CheckoutItemPricing,
  type CouponDiscountBreakdown,
  type CouponDoc,
  type CouponEvaluationResult,
  type NewCouponDraftInput,
};

export interface ReadOnlyCouponValidationSuccess {
  coupon: CouponDoc;
  itemPricing: CheckoutItemPricing;
  breakdown: CouponDiscountBreakdown;
}

/**
 * Step 1 (Apply button & Test Checkout dry-run):
 * Strictly read-only validation against `coupons/{CODE}` and `coupons/{CODE}/redemptions/{uid}`.
 * Writes NOTHING to Firestore.
 */
export async function validateCouponReadOnly(params: {
  code: string;
  uid?: string | null;
  itemKey: string;
  plansConfig?: Partial<PlansConfigDoc> | null;
}): Promise<ReadOnlyCouponValidationSuccess> {
  const cleanCode = normalizeCouponCode(params.code);
  if (!cleanCode) {
    throw new CouponValidationError('INVALID_COUPON');
  }

  const plansConfig = params.plansConfig ?? (await fetchPlansConfigOnce().catch(() => null));
  const itemPricing = resolveCheckoutItemPricing(params.itemKey, plansConfig);

  const couponRef = doc(db, 'coupons', cleanCode);
  const redemptionRef = params.uid
    ? doc(db, 'coupons', cleanCode, 'redemptions', params.uid)
    : null;

  const [couponSnap, redemptionSnap] = await Promise.all([
    getDoc(couponRef),
    redemptionRef ? getDoc(redemptionRef).catch(() => null) : Promise.resolve(null),
  ]);

  const couponDoc = couponSnap.exists()
    ? normalizeCouponDoc(couponSnap.id, couponSnap.data() as Record<string, unknown>)
    : null;

  const alreadyUsed = Boolean(redemptionSnap && redemptionSnap.exists());

  const evaluation = evaluateCouponEligibility({
    coupon: couponDoc,
    alreadyRedeemedByUser: alreadyUsed,
    itemKey: itemPricing.itemKey,
    basePkr: itemPricing.basePkr,
    baseKobans: itemPricing.baseKobans,
    kobansPerPkr: itemPricing.kobansPerPkr,
  });

  if (!evaluation.valid) {
    throw new CouponValidationError(evaluation.code);
  }

  return {
    coupon: evaluation.coupon,
    itemPricing,
    breakdown: evaluation.breakdown,
  };
}

/**
 * Dry-run helper for Admin -> Coupon Studio -> Test checkout tab.
 * Always read-only, never throws on coupon validation errors, returns structured result.
 */
export async function dryRunCouponCheckout(params: {
  code: string;
  uid?: string | null;
  itemKey: string;
  plansConfig?: Partial<PlansConfigDoc> | null;
}): Promise<
  | {
      ok: true;
      coupon: CouponDoc;
      itemPricing: CheckoutItemPricing;
      breakdown: CouponDiscountBreakdown;
    }
  | {
      ok: false;
      error: string;
      itemPricing: CheckoutItemPricing;
    }
> {
  const plansConfig = params.plansConfig ?? (await fetchPlansConfigOnce().catch(() => null));
  const itemPricing = resolveCheckoutItemPricing(params.itemKey, plansConfig);
  try {
    const res = await validateCouponReadOnly({
      code: params.code,
      uid: params.uid,
      itemKey: params.itemKey,
      plansConfig,
    });
    return { ok: true, ...res };
  } catch (err: unknown) {
    const msg =
      err instanceof Error && err.message
        ? err.message
        : COUPON_ERROR_MESSAGES.INVALID_COUPON;
    return {
      ok: false,
      error: msg,
      itemPricing,
    };
  }
}

/**
 * Step 2 (Real redemption on payment submit):
 * Executes ONE atomic Firestore transaction that:
 * 1. Re-reads `config/plans` (never trusts client price)
 * 2. Re-reads `coupons/{CODE}` and `coupons/{CODE}/redemptions/{uid}`
 * 3. Re-checks active, expiry, alreadyUsed, maxRedemptions, appliesTo
 * 4. Creates `coupons/{CODE}/redemptions/{uid}` (doc ID = uid enforces once-per-account)
 * 5. Increments `coupons/{CODE}.redeemedCount`
 * 6. Saves the payment/order document with the transaction-computed discounted price
 *
 * If any step fails, Firestore aborts the transaction and NOTHING is written.
 */
export async function redeemCouponAndSavePaymentTransaction(params: {
  uid: string;
  itemKey: string;
  paymentCollection: 'paymentRequests' | 'kobanRequests';
  paymentId?: string;
  couponCode?: string | null;
  buildPaymentPayload: (computed: {
    paymentId: string;
    itemPricing: CheckoutItemPricing;
    coupon: CouponDoc | null;
    breakdown: CouponDiscountBreakdown;
  }) => Record<string, unknown>;
}): Promise<AtomicCouponCheckoutResult> {
  const paymentRef = params.paymentId
    ? doc(db, params.paymentCollection, params.paymentId)
    : doc(collection(db, params.paymentCollection));

  return runTransaction(db, async (tx) => {
    const result = await executeAtomicCouponCheckout(
      {
        async getCoupon(code: string) {
          const snap = await tx.get(doc(db, 'coupons', code));
          if (!snap.exists()) return null;
          return normalizeCouponDoc(snap.id, snap.data() as Record<string, unknown>);
        },
        async hasRedemption(code: string, uid: string) {
          const snap = await tx.get(doc(db, 'coupons', code, 'redemptions', uid));
          return snap.exists();
        },
        async getPlansConfig() {
          try {
            const snap = await tx.get(doc(db, 'config', 'plans'));
            return snap.exists() ? (snap.data() as Partial<PlansConfigDoc>) : null;
          } catch {
            return null;
          }
        },
        createRedemption(code, uid, record) {
          tx.set(doc(db, 'coupons', code, 'redemptions', uid), record);
        },
        incrementRedeemedCount(code, nextCount) {
          tx.update(doc(db, 'coupons', code), { redeemedCount: nextCount });
        },
        savePayment(_id, payload) {
          tx.set(paymentRef, payload);
        },
      },
      {
        uid: params.uid,
        itemKey: params.itemKey,
        paymentId: paymentRef.id,
        couponCode: params.couponCode,
        createServerTimestamp: () => serverTimestamp(),
        buildPaymentPayload: params.buildPaymentPayload,
      }
    );

    return result;
  });
}

/**
 * Atomic coupon consumption after an instant Kobans purchase has ALREADY succeeded.
 * Never called on failed purchases, so failed payments never burn a coupon.
 */
export async function commitCouponRedemptionTransaction(params: {
  uid: string;
  couponCode: string;
  itemKey: string;
  paymentId: string;
}): Promise<AtomicCouponCheckoutResult> {
  const cleanCode = normalizeCouponCode(params.couponCode);
  if (!cleanCode) {
    throw new CouponValidationError('INVALID_COUPON');
  }

  return runTransaction(db, async (tx) => {
    return executeAtomicCouponCheckout(
      {
        async getCoupon(code: string) {
          const snap = await tx.get(doc(db, 'coupons', code));
          if (!snap.exists()) return null;
          return normalizeCouponDoc(snap.id, snap.data() as Record<string, unknown>);
        },
        async hasRedemption(code: string, uid: string) {
          const snap = await tx.get(doc(db, 'coupons', code, 'redemptions', uid));
          return snap.exists();
        },
        async getPlansConfig() {
          try {
            const snap = await tx.get(doc(db, 'config', 'plans'));
            return snap.exists() ? (snap.data() as Partial<PlansConfigDoc>) : null;
          } catch {
            return null;
          }
        },
        createRedemption(code, uid, record) {
          tx.set(doc(db, 'coupons', code, 'redemptions', uid), record);
        },
        incrementRedeemedCount(code, nextCount) {
          tx.update(doc(db, 'coupons', code), { redeemedCount: nextCount });
        },
        savePayment() {
          // Payment ledger was already persisted by the Kobans purchase endpoint
        },
      },
      {
        uid: params.uid,
        itemKey: params.itemKey,
        paymentId: params.paymentId,
        couponCode: cleanCode,
        createServerTimestamp: () => serverTimestamp(),
        buildPaymentPayload: () => ({}),
      }
    );
  });
}

// ============================================================================
// ADMIN COUPON STUDIO OPERATIONS (Admins only)
// ============================================================================

export interface PaginatedCouponsResult {
  items: CouponDoc[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Fetches coupons strictly paginated (20 per page) using `orderBy('createdAt', 'desc')`.
 * Never loads the entire collection.
 */
export async function fetchCouponsPaginatedAdmin(params?: {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<PaginatedCouponsResult> {
  const pageSize = Math.max(1, Math.min(50, params?.pageSize ?? 20));
  const couponsCol = collection(db, 'coupons');
  const q = params?.cursor
    ? query(couponsCol, orderBy('createdAt', 'desc'), startAfter(params.cursor), limit(pageSize + 1))
    : query(couponsCol, orderBy('createdAt', 'desc'), limit(pageSize + 1));

  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const pageDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  const items: CouponDoc[] = [];
  for (const d of pageDocs) {
    const normalized = normalizeCouponDoc(d.id, d.data() as Record<string, unknown>);
    if (normalized) items.push(normalized);
  }

  return {
    items,
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  };
}

/**
 * Creates a brand-new coupon document at `coupons/{CODE}` atomically, rejecting duplicates.
 */
export async function createCouponAdmin(
  input: NewCouponDraftInput,
  adminUid: string
): Promise<CouponDoc> {
  if (!adminUid) {
    throw new Error('Admin sign-in is required to create coupons.');
  }

  const valid = validateNewCouponDraft(input);
  const couponRef = doc(db, 'coupons', valid.code);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(couponRef);
    if (existing.exists()) {
      throw new Error(`Coupon "${valid.code}" already exists. Choose a different code.`);
    }

    tx.set(couponRef, {
      code: valid.code,
      type: valid.type,
      value: valid.value,
      appliesTo: valid.appliesTo,
      maxRedemptions: valid.maxRedemptions,
      redeemedCount: 0,
      expiresAt: valid.expiresAtMs !== null ? Timestamp.fromMillis(valid.expiresAtMs) : null,
      active: valid.active,
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    });
  });

  return {
    code: valid.code,
    type: valid.type,
    value: valid.value,
    appliesTo: valid.appliesTo,
    maxRedemptions: valid.maxRedemptions,
    redeemedCount: 0,
    expiresAt: valid.expiresAtMs,
    active: valid.active,
    createdAt: Date.now(),
    createdBy: adminUid,
  };
}

/**
 * Pauses or activates a coupon (no hard delete).
 */
export async function setCouponActiveAdmin(code: string, active: boolean): Promise<void> {
  const cleanCode = normalizeCouponCode(code);
  if (!cleanCode) throw new Error('Invalid coupon code.');
  await updateDoc(doc(db, 'coupons', cleanCode), {
    active: Boolean(active),
  });
}
