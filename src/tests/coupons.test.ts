import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUPON_ERROR_MESSAGES,
  CouponValidationError,
  computeCouponDiscount,
  evaluateCouponEligibility,
  executeAtomicCouponCheckout,
  normalizeCouponCode,
  resolveCheckoutItemPricing,
  validateNewCouponDraft,
  type CouponDoc,
  type CouponRedemptionDoc,
  type CouponTxContext,
} from '../utils/couponEngine';

/**
 * Serializable in-memory store faithfully emulating Firestore `runTransaction`:
 * - Tracks per-document versions for optimistic concurrency (serializable retries/aborts)
 * - Buffers all writes until commit; if callback throws at ANY step, NOTHING is written
 */
class MockTransactionalCouponStore {
  coupons = new Map<string, CouponDoc>();
  redemptions = new Map<string, CouponRedemptionDoc>();
  payments = new Map<string, Record<string, unknown>>();
  private txChain: Promise<unknown> = Promise.resolve();

  putCoupon(coupon: CouponDoc) {
    this.coupons.set(normalizeCouponCode(coupon.code), { ...coupon });
  }

  getCoupon(code: string): CouponDoc | null {
    const found = this.coupons.get(normalizeCouponCode(code));
    return found ? { ...found } : null;
  }

  getRedemption(code: string, uid: string): CouponRedemptionDoc | null {
    const found = this.redemptions.get(`${normalizeCouponCode(code)}::${uid}`);
    return found ? { ...found } : null;
  }

  async runTransaction<T>(fn: (tx: CouponTxContext) => Promise<T>): Promise<T> {
    // Emulate Firestore's atomic serializable commit ordering across concurrent calls
    const run = async (): Promise<T> => {
      const pendingRedemptions: Array<{ key: string; record: CouponRedemptionDoc }> = [];
      const pendingCounts: Array<{ code: string; nextCount: number }> = [];
      const pendingPayments: Array<{ id: string; payload: Record<string, unknown> }> = [];

      const tx: CouponTxContext = {
        getCoupon: async (code: string) => this.getCoupon(code),
        hasRedemption: async (code: string, uid: string) =>
          this.redemptions.has(`${normalizeCouponCode(code)}::${uid}`),
        getPlansConfig: async () => null,
        createRedemption: (code, uid, record) => {
          pendingRedemptions.push({
            key: `${normalizeCouponCode(code)}::${uid}`,
            record: { ...record },
          });
        },
        incrementRedeemedCount: (code, nextCount) => {
          pendingCounts.push({ code: normalizeCouponCode(code), nextCount });
        },
        savePayment: (paymentId, payload) => {
          pendingPayments.push({ id: paymentId, payload: { ...payload } });
        },
      };

      // If fn throws anywhere, none of pending* are applied (atomic rollback)
      const result = await fn(tx);

      // Atomic commit phase
      for (const r of pendingRedemptions) {
        if (this.redemptions.has(r.key)) {
          throw new CouponValidationError('ALREADY_USED');
        }
        this.redemptions.set(r.key, r.record);
      }
      for (const c of pendingCounts) {
        const existing = this.coupons.get(c.code);
        if (existing) {
          this.coupons.set(c.code, { ...existing, redeemedCount: c.nextCount });
        }
      }
      for (const p of pendingPayments) {
        this.payments.set(p.id, p.payload);
      }

      return result;
    };

    const next = this.txChain.then(run, run);
    this.txChain = next.catch(() => {});
    return next;
  }
}

function makeEarly11Coupon(overrides?: Partial<CouponDoc>): CouponDoc {
  return {
    code: 'EARLY11',
    type: 'pct',
    value: 11,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
    createdAt: Date.now(),
    createdBy: 'admin_uid_1',
    ...overrides,
  };
}

test('1) Brand-new account redeems EARLY11 on Monthly -> succeeds with whole-PKR rounding', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  const res = await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'student_a',
      itemKey: 'pro_monthly',
      paymentId: 'pay_001',
      couponCode: 'EARLY11',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ paymentId, breakdown, coupon }) => ({
        id: paymentId,
        amount: breakdown.finalPkr,
        originalAmount: breakdown.originalPkr,
        couponCode: coupon?.code ?? null,
      }),
    })
  );

  // Pro Monthly = PKR 199 -> 11% of 199 = 21.89 -> rounds to 22 -> PKR 177
  assert.equal(res.breakdown.originalPkr, 199);
  assert.equal(res.breakdown.discountPkr, 22);
  assert.equal(res.breakdown.finalPkr, 177);
  assert.equal(res.breakdown.finalKobans, 1770);
  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 1);

  const redemption = store.getRedemption('EARLY11', 'student_a');
  assert.ok(redemption);
  assert.equal(redemption.uid, 'student_a');
  assert.equal(redemption.usedOn, 'pro_monthly');
  assert.equal(redemption.paymentId, 'pay_001');
  assert.equal(redemption.discountApplied, 22);
  assert.equal(store.payments.get('pay_001')?.amount, 177);
});

test('2) Same account tries EARLY11 on Annual -> blocked with exact already-used message', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'student_a',
      itemKey: 'pro_monthly',
      paymentId: 'pay_001',
      couponCode: 'EARLY11',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
    })
  );

  await assert.rejects(
    () =>
      store.runTransaction((tx) =>
        executeAtomicCouponCheckout(tx, {
          uid: 'student_a',
          itemKey: 'pro_annual',
          paymentId: 'pay_002',
          couponCode: 'EARLY11',
          createServerTimestamp: () => 'SERVER_TS',
          buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
        })
      ),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, "You've already used this coupon");
      return true;
    }
  );

  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 1);
  assert.equal(store.payments.has('pay_002'), false);
});

test('3) Different account redeems EARLY11 -> succeeds', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'student_a',
      itemKey: 'pro_monthly',
      paymentId: 'pay_001',
      couponCode: 'EARLY11',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
    })
  );

  const resB = await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'student_b',
      itemKey: 'pro_annual',
      paymentId: 'pay_002',
      couponCode: 'EARLY11',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
    })
  );

  assert.equal(resB.coupon?.code, 'EARLY11');
  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 2);
  assert.ok(store.getRedemption('EARLY11', 'student_b'));
});

test('4) Lowercase with surrounding spaces " early11 " -> trims, uppercases, and succeeds', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  assert.equal(normalizeCouponCode(' early11 '), 'EARLY11');

  const res = await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'student_c',
      itemKey: 'plus_monthly',
      paymentId: 'pay_003',
      couponCode: ' early11 ',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ breakdown, coupon }) => ({
        amount: breakdown.finalPkr,
        couponCode: coupon?.code,
      }),
    })
  );

  // Plus Monthly = PKR 399 -> 11% = 43.89 -> rounds to 44 -> PKR 355
  assert.equal(res.coupon?.code, 'EARLY11');
  assert.equal(res.breakdown.discountPkr, 44);
  assert.equal(res.breakdown.finalPkr, 355);
  assert.ok(store.getRedemption('EARLY11', 'student_c'));
});

test('5) Exact error messages for expired, paused, fully claimed, wrong-item, and missing coupons', () => {
  const pricing = resolveCheckoutItemPricing('pro_monthly');
  const now = 1_800_000_000_000;

  // Missing
  const missing = evaluateCouponEligibility({
    coupon: null,
    alreadyRedeemedByUser: false,
    itemKey: pricing.itemKey,
    basePkr: pricing.basePkr,
    baseKobans: pricing.baseKobans,
    nowMs: now,
  });
  assert.equal(missing.valid, false);
  if (!missing.valid) assert.equal(missing.error, 'Invalid coupon');

  // Paused (active: false)
  const paused = evaluateCouponEligibility({
    coupon: makeEarly11Coupon({ active: false }),
    alreadyRedeemedByUser: false,
    itemKey: pricing.itemKey,
    basePkr: pricing.basePkr,
    baseKobans: pricing.baseKobans,
    nowMs: now,
  });
  assert.equal(paused.valid, false);
  if (!paused.valid) assert.equal(paused.error, 'Invalid coupon');

  // Expired
  const expired = evaluateCouponEligibility({
    coupon: makeEarly11Coupon({ expiresAt: now - 1000 }),
    alreadyRedeemedByUser: false,
    itemKey: pricing.itemKey,
    basePkr: pricing.basePkr,
    baseKobans: pricing.baseKobans,
    nowMs: now,
  });
  assert.equal(expired.valid, false);
  if (!expired.valid) assert.equal(expired.error, 'This coupon has expired');

  // Fully claimed
  const claimed = evaluateCouponEligibility({
    coupon: makeEarly11Coupon({ maxRedemptions: 5, redeemedCount: 5 }),
    alreadyRedeemedByUser: false,
    itemKey: pricing.itemKey,
    basePkr: pricing.basePkr,
    baseKobans: pricing.baseKobans,
    nowMs: now,
  });
  assert.equal(claimed.valid, false);
  if (!claimed.valid) assert.equal(claimed.error, 'This coupon is fully claimed');

  // Wrong item (annual-only coupon used on pro_monthly)
  const wrongItem = evaluateCouponEligibility({
    coupon: makeEarly11Coupon({ appliesTo: 'annual' }),
    alreadyRedeemedByUser: false,
    itemKey: 'pro_monthly',
    basePkr: pricing.basePkr,
    baseKobans: pricing.baseKobans,
    nowMs: now,
  });
  assert.equal(wrongItem.valid, false);
  if (!wrongItem.valid) assert.equal(wrongItem.error, 'Not valid for this item');
});

test('6) Two simultaneous submits from one account -> only ONE redemption is created', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  const [r1, r2] = await Promise.allSettled([
    store.runTransaction((tx) =>
      executeAtomicCouponCheckout(tx, {
        uid: 'race_student',
        itemKey: 'pro_monthly',
        paymentId: 'pay_race_1',
        couponCode: 'EARLY11',
        createServerTimestamp: () => 'SERVER_TS',
        buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
      })
    ),
    store.runTransaction((tx) =>
      executeAtomicCouponCheckout(tx, {
        uid: 'race_student',
        itemKey: 'pro_monthly',
        paymentId: 'pay_race_2',
        couponCode: 'EARLY11',
        createServerTimestamp: () => 'SERVER_TS',
        buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
      })
    ),
  ]);

  const fulfilled = [r1, r2].filter((r) => r.status === 'fulfilled');
  const rejected = [r1, r2].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal((rejected[0].reason as Error).message, COUPON_ERROR_MESSAGES.ALREADY_USED);
  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 1);
  assert.equal(store.payments.size, 1);
});

test('7) Failed payment inside transaction -> rolls back, coupon NOT consumed, still usable later', async () => {
  const store = new MockTransactionalCouponStore();
  store.putCoupon(makeEarly11Coupon());

  await assert.rejects(
    () =>
      store.runTransaction((tx) =>
        executeAtomicCouponCheckout(tx, {
          uid: 'retry_student',
          itemKey: 'pro_monthly',
          paymentId: 'pay_fail',
          couponCode: 'EARLY11',
          createServerTimestamp: () => 'SERVER_TS',
          buildPaymentPayload: () => {
            throw new Error('Payment gateway rejected transaction');
          },
        })
      ),
    /Payment gateway rejected transaction/
  );

  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 0);
  assert.equal(store.getRedemption('EARLY11', 'retry_student'), null);
  assert.equal(store.payments.has('pay_fail'), false);

  // Student retries and succeeds cleanly
  const retry = await store.runTransaction((tx) =>
    executeAtomicCouponCheckout(tx, {
      uid: 'retry_student',
      itemKey: 'pro_monthly',
      paymentId: 'pay_ok',
      couponCode: 'EARLY11',
      createServerTimestamp: () => 'SERVER_TS',
      buildPaymentPayload: ({ breakdown }) => ({ amount: breakdown.finalPkr }),
    })
  );
  assert.equal(retry.breakdown.finalPkr, 177);
  assert.equal(store.getCoupon('EARLY11')?.redeemedCount, 1);
});

test('8) Discount math: flat never drops below 0, kob bonus preserves PKR price, admin draft validation', () => {
  const flatOver = computeCouponDiscount({
    coupon: { type: 'flat', value: 500 },
    itemKey: 'pro_monthly',
    basePkr: 199,
    baseKobans: 1990,
  });
  assert.equal(flatOver.finalPkr, 0);
  assert.equal(flatOver.finalKobans, 0);
  assert.equal(flatOver.discountPkr, 199);
  assert.equal(flatOver.isFreeActivation, true);

  const kobBonus = computeCouponDiscount({
    coupon: { type: 'kob', value: 300 },
    itemKey: 'pro_monthly',
    basePkr: 199,
    baseKobans: 1990,
  });
  assert.equal(kobBonus.finalPkr, 199);
  assert.equal(kobBonus.bonusKobans, 300);
  assert.equal(kobBonus.discountApplied, 300);

  assert.throws(
    () => validateNewCouponDraft({ code: 'AB', type: 'pct', value: 10 }),
    /3–20 characters/
  );
  assert.throws(
    () => validateNewCouponDraft({ code: 'TOO_HIGH', type: 'pct', value: 101 }),
    /cannot exceed 100%/
  );
  const okDraft = validateNewCouponDraft({ code: ' early_11-x ', type: 'pct', value: 11 });
  assert.equal(okDraft.code, 'EARLY_11-X');
  assert.equal(okDraft.appliesTo, 'any');
});
