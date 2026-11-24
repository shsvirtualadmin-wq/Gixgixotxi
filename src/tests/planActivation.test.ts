import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { handleEconomyApiRequest } from '../../functions/api/economy/[[path]]';
import type {
  FirestoreStoreAdapter,
  FirestoreTransactionContext,
} from '../../functions/_utils/firestoreRestAdmin';
import { mapPlanActivationError } from '../services/proSubscriptionService';
import { buildPlansCatalog } from '../config/plans';
import {
  DEFAULT_PLANS_CONFIG,
  calculatePlanExpiryPkt,
  pktEndOfDayMs,
  getPktCalendarDaysLeft,
} from '../lib/planTier';
import { computeCouponDiscount, resolveCheckoutItemPricing } from '../utils/couponEngine';

/**
 * Atomic in-memory FirestoreStoreAdapter for end-to-end testing of plan activation,
 * Kobans purchase, superadmin audit, and pkig expiry repair.
 */
class InMemoryAtomicFirestoreStore implements FirestoreStoreAdapter {
  docs = new Map<string, Record<string, any>>();
  transactionCommits = 0;
  transactionRollbacks = 0;
  private txChain: Promise<unknown> = Promise.resolve();

  seed(docPath: string, data: Record<string, any>) {
    this.docs.set(docPath, structuredClone(data));
  }

  read(docPath: string): Record<string, any> | null {
    const found = this.docs.get(docPath);
    return found ? structuredClone(found) : null;
  }

  async getDoc(docPath: string): Promise<Record<string, any> | null> {
    return this.read(docPath);
  }

  async setDoc(docPath: string, data: Record<string, any>, merge = true): Promise<void> {
    if (merge && this.docs.has(docPath)) {
      this.docs.set(docPath, { ...this.docs.get(docPath)!, ...structuredClone(data) });
    } else {
      this.docs.set(docPath, structuredClone(data));
    }
  }

  async deleteDoc(docPath: string): Promise<void> {
    this.docs.delete(docPath);
  }

  async listCollection(
    collectionPath: string,
    pageSize = 200
  ): Promise<Array<{ id: string; data: Record<string, any> }>> {
    const prefix = `${collectionPath}/`;
    const out: Array<{ id: string; data: Record<string, any> }> = [];
    for (const [k, v] of this.docs.entries()) {
      if (k.startsWith(prefix)) {
        const rest = k.slice(prefix.length);
        if (!rest.includes('/')) {
          out.push({ id: rest, data: structuredClone(v) });
          if (out.length >= pageSize) break;
        }
      }
    }
    return out;
  }

  async runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      type PendingOp =
        | { kind: 'set'; docPath: string; data: Record<string, any>; merge: boolean }
        | { kind: 'create'; docPath: string; data: Record<string, any> }
        | { kind: 'delete'; docPath: string };

      const ops: PendingOp[] = [];
      const tx: FirestoreTransactionContext = {
        getDoc: async (docPath: string) => this.read(docPath),
        setDoc: (docPath: string, data: Record<string, any>, merge = true) => {
          ops.push({ kind: 'set', docPath, data: structuredClone(data), merge });
        },
        createDoc: (docPath: string, data: Record<string, any>) => {
          ops.push({ kind: 'create', docPath, data: structuredClone(data) });
        },
        deleteDoc: (docPath: string) => {
          ops.push({ kind: 'delete', docPath });
        },
      };

      let result: T;
      try {
        result = await fn(tx);
      } catch (err) {
        this.transactionRollbacks += 1;
        throw err;
      }

      if (ops.length === 0) {
        return result;
      }

      const createdInTx = new Set<string>();
      for (const op of ops) {
        if (op.kind === 'create') {
          if (this.docs.has(op.docPath) || createdInTx.has(op.docPath)) {
            this.transactionRollbacks += 1;
            throw new Error(`ALREADY_EXISTS: ${op.docPath}`);
          }
          createdInTx.add(op.docPath);
        }
      }

      for (const op of ops) {
        if (op.kind === 'create') {
          this.docs.set(op.docPath, op.data);
        } else if (op.kind === 'set') {
          if (op.merge && this.docs.has(op.docPath)) {
            this.docs.set(op.docPath, { ...this.docs.get(op.docPath)!, ...op.data });
          } else {
            this.docs.set(op.docPath, op.data);
          }
        } else if (op.kind === 'delete') {
          this.docs.delete(op.docPath);
        }
      }
      this.transactionCommits += 1;
      return result;
    };

    const next = this.txChain.then(run, run);
    this.txChain = next.catch(() => {});
    return next;
  }
}

function makeAuthVerifier(
  uid: string | null,
  options?: { email?: string; superAdmin?: boolean; admin?: boolean }
) {
  return async (authHeader: string | null | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token || token === 'invalid-token' || !uid) return null;
    return {
      uid,
      email: options?.email || 'student@boardly.cfd',
      emailVerified: true,
      name: 'Test User',
      superAdmin: options?.superAdmin === true,
      isSuperAdmin: options?.superAdmin === true,
      admin: options?.admin === true || options?.superAdmin === true,
    };
  };
}

async function callEconomy(params: {
  path: string;
  store?: InMemoryAtomicFirestoreStore | null;
  uid?: string | null;
  token?: string | null;
  superAdmin?: boolean;
  method?: string;
  body?: Record<string, any>;
  nowMs?: number;
}) {
  const method = params.method || 'POST';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.token !== null) {
    headers.Authorization = `Bearer ${params.token ?? 'valid-test-token'}`;
  }

  const req = new Request(`https://boardly.cfd${params.path}`, {
    method,
    headers,
    ...(method === 'POST' ? { body: JSON.stringify(params.body ?? {}) } : {}),
  });

  const res = await handleEconomyApiRequest({
    request: req,
    env: {},
    storeOverride: params.store === undefined ? null : params.store,
    tokenVerifierOverride: makeAuthVerifier(params.uid === undefined ? 'user_001' : params.uid, {
      superAdmin: params.superAdmin,
    }),
    nowMsOverride: params.nowMs ?? Date.UTC(2026, 10, 24, 10, 0, 0), // 24 Nov 2026 15:00 PKT
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, json };
}

test('1) POST /api/plan/activate with 100%-off EARLY21 activates Pro Annual atomically to end of 24 Nov 2027 PKT', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0); // 24 Nov 2026 15:00 PKT
  const expectedExpiryMs = pktEndOfDayMs(2027, 10, 24); // 24 Nov 2027 23:59:59.999 PKT

  store.seed('users/user_001', {
    uid: 'user_001',
    displayName: 'Ayesha',
    plan: 'free',
    isPro: false,
    isPlus: false,
  });
  store.seed('coupons/EARLY21', {
    code: 'EARLY21',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: 100,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
    createdAt: nowMs - 86_400_000,
    createdBy: 'superadmin_1',
  });

  const res = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_001',
    nowMs,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: ' early21 ',
      idempotencyKey: 'idem_early21_001',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.activated, true);
  assert.equal(res.json.planId, 'pro_annual');
  assert.equal(res.json.planTier, 'pro');
  assert.equal(res.json.billing, 'annual');
  assert.equal(res.json.originalPkr, 1791);
  assert.equal(res.json.discountPkr, 1791);
  assert.equal(res.json.finalPkr, 0);
  assert.equal(res.json.finalKobans, 0);
  assert.equal(res.json.durationDays, 365);
  assert.equal(res.json.proCreditDays, 0);
  assert.equal(res.json.newExpiryMs, expectedExpiryMs);
  assert.equal(res.json.newExpiryLabel, '24 Nov 2027');
  assert.equal(store.transactionCommits, 1);
  assert.equal(store.transactionRollbacks, 0);

  const updatedUser = store.read('users/user_001');
  assert.ok(updatedUser);
  assert.equal(updatedUser.plan, 'pro');
  assert.equal(updatedUser.planTier, 'pro');
  assert.equal(updatedUser.proPlanId, 'pro_annual');
  assert.equal(updatedUser.isPro, true);
  assert.equal(updatedUser.isPremium, true);
  assert.equal(updatedUser.isPlus, false);
  assert.equal(updatedUser.appliedCouponCode, 'EARLY21');
  assert.equal(updatedUser.planExpiresAt, new Date(expectedExpiryMs).toISOString());
  assert.equal(updatedUser.proUntil, updatedUser.planExpiresAt);

  const redemption = store.read('coupons/EARLY21/redemptions/user_001');
  assert.ok(redemption);
  assert.equal(redemption.usedOn, 'pro_annual');
  assert.equal(store.read('coupons/EARLY21')?.redeemedCount, 1);
  assert.ok(store.read('planActivations/user_001_idem_early21_001'));
});

test('2) Double-tap replay with same idempotencyKey activates ONLY once (coupon & Kobans)', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0);

  store.seed('users/user_002', { uid: 'user_002', plan: 'free', kobans: 80000 });
  store.seed('wallets/user_002', { balance: 80000 });
  store.seed('coupons/EARLY21', {
    code: 'EARLY21',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
  });

  // (a) Free coupon double-tap
  const first = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_002',
    nowMs,
    body: {
      planId: 'plus_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_doubletap_002',
    },
  });
  assert.equal(first.status, 200);
  assert.equal(first.json.idempotentReplay, false);

  const replay = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_002',
    nowMs: nowMs + 2000,
    body: {
      planId: 'plus_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_doubletap_002',
    },
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.json.idempotentReplay, true);
  assert.equal(replay.json.newExpiryIso, first.json.newExpiryIso);
  assert.equal(store.read('coupons/EARLY21')?.redeemedCount, 1);
  assert.equal(store.transactionCommits, 1);

  // (b) Kobans double-tap on extension
  const k1 = await callEconomy({
    path: '/api/pro/purchase-kobans',
    store,
    uid: 'user_002',
    nowMs: nowMs + 5000,
    body: {
      planId: 'plus_monthly',
      idempotencyKey: 'idem_koban_doubletap_002',
    },
  });
  assert.equal(k1.status, 200);
  assert.equal(k1.json.newExpiryLabel, '24 Dec 2027');
  assert.equal(k1.json.newBalance, 80000 - 3990);

  const k2 = await callEconomy({
    path: '/api/pro/purchase-kobans',
    store,
    uid: 'user_002',
    nowMs: nowMs + 6000,
    body: {
      planId: 'plus_monthly',
      idempotencyKey: 'idem_koban_doubletap_002',
    },
  });
  assert.equal(k2.status, 200);
  assert.equal(k2.json.alreadyProcessed, true);
  assert.equal(k2.json.newExpiryIso, k1.json.newExpiryIso);
  assert.equal(store.read('wallets/user_002')?.balance, 80000 - 3990);
  assert.equal(store.transactionCommits, 2);
});

test('3) Retrying EARLY21 on the same account with a new idempotencyKey returns 409 "Coupon already used" and rolls back', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0);

  store.seed('users/user_003', { uid: 'user_003', plan: 'free' });
  store.seed('coupons/EARLY21', {
    code: 'EARLY21',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
  });

  const first = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_003',
    nowMs,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_first_003',
    },
  });
  assert.equal(first.status, 200);

  const second = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_003',
    nowMs: nowMs + 60_000,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_second_003',
    },
  });

  assert.equal(second.status, 409);
  assert.equal(second.json.code, 'ALREADY_USED');
  assert.equal(second.json.error, 'Coupon already used');
  assert.equal(store.read('coupons/EARLY21')?.redeemedCount, 1);
  assert.equal(store.read('users/user_003')?.planExpiresAt, first.json.newExpiryIso);
});

test('4) Server security & validation checks: auth, guest, expired, maxed-out, wrong-plan, tampered price, method, missing admin credentials', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0);

  store.seed('users/user_sec', { uid: 'user_sec', plan: 'free' });
  store.seed('coupons/EXPIRED100', {
    code: 'EXPIRED100',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: nowMs - 1000,
    active: true,
  });
  store.seed('coupons/MAXED100', {
    code: 'MAXED100',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: 5,
    redeemedCount: 5,
    expiresAt: null,
    active: true,
  });
  store.seed('coupons/PLUSONLY100', {
    code: 'PLUSONLY100',
    type: 'pct',
    value: 100,
    appliesTo: 'plus_annual',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
  });
  store.seed('coupons/PARTIAL20', {
    code: 'PARTIAL20',
    type: 'pct',
    value: 20,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
  });

  const unauth = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: null,
    token: null,
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100' },
  });
  assert.equal(unauth.status, 401);
  assert.equal(unauth.json.error, 'Please sign in again');

  const guest = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'guest_abc',
    token: 'guest_abc',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100' },
  });
  assert.equal(guest.status, 403);

  const wrongMethod = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_sec',
    method: 'GET',
    nowMs,
  });
  assert.equal(wrongMethod.status, 405);

  const expired = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100', idempotencyKey: 'sec_exp' },
  });
  assert.equal(expired.status, 400);
  assert.equal(expired.json.error, 'Coupon expired');

  const maxed = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'MAXED100', idempotencyKey: 'sec_max' },
  });
  assert.equal(maxed.status, 409);

  const wrongPlan = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'PLUSONLY100', idempotencyKey: 'sec_plan' },
  });
  assert.equal(wrongPlan.status, 400);

  const tampered = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'user_sec',
    nowMs,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: 'PARTIAL20',
      price: 0,
      finalPkr: 0,
      discountPkr: 1791,
      idempotencyKey: 'sec_tamper',
    },
  });
  assert.equal(tampered.status, 400);
  assert.equal(tampered.json.code, 'PAYMENT_REQUIRED');

  const noAdmin = await callEconomy({
    path: '/api/plan/activate',
    store: null,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EARLY21', idempotencyKey: 'sec_noadmin' },
  });
  assert.equal(noAdmin.status, 503);
  assert.equal(noAdmin.json.error, "Couldn't activate. Try again");
});

test('5) Friendly error mapping never exposes raw Firestore permission-denied messages', () => {
  assert.equal(
    mapPlanActivationError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }),
    "Couldn't activate. Try again"
  );
  assert.equal(
    mapPlanActivationError({ code: 'ALREADY_USED', message: "You've already used this coupon" }),
    'Coupon already used'
  );
  assert.equal(
    mapPlanActivationError({ code: 'EXPIRED', message: 'This coupon has expired' }),
    'Coupon expired'
  );
  assert.equal(
    mapPlanActivationError({ status: 401, message: 'Unauthorized' }),
    'Please sign in again'
  );
});

test('6) Single source of truth for Pro Annual pricing: tab price, original price, and 100%-off coupon all equal PKR 1,791', () => {
  const catalog = buildPlansCatalog(DEFAULT_PLANS_CONFIG);
  const itemPricing = resolveCheckoutItemPricing('pro_annual', DEFAULT_PLANS_CONFIG);
  const discount = computeCouponDiscount({
    coupon: { type: 'pct', value: 100 },
    itemKey: 'pro_annual',
    basePkr: catalog.pro_annual.price_pkr,
    baseKobans: catalog.pro_annual.price_kobans,
  });

  assert.equal(catalog.pro_annual.price_pkr, 1791);
  assert.equal(itemPricing.basePkr, 1791);
  assert.equal(discount.originalPkr, 1791);
  assert.equal(discount.discountPkr, 1791);
  assert.equal(discount.finalPkr, 0);
  assert.equal(discount.isFreeActivation, true);
});

test('7) firestore.rules keep subscription fields, coupons, redemptions, planActivations, and planAuditLogs client read-only', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  for (const protectedField of [
    "'plan'",
    "'planTier'",
    "'planExpiresAt'",
    "'proUntil'",
    "'plusUntil'",
    "'planStartedAt'",
    "'appliedCouponCode'",
  ]) {
    assert.ok(rules.includes(protectedField), `Expected firestore.rules to protect ${protectedField}`);
  }

  assert.match(rules, /match\s+\/coupons\/\{couponCode\}[\s\S]*?allow\s+update:\s*if\s+isAdmin\(\);/);
  assert.match(
    rules,
    /match\s+\/redemptions\/\{uid\}[\s\S]*?allow\s+get:\s*if\s+isAdmin\(\)\s*\|\|\s*isOwner\(uid\);[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false;/
  );
  assert.match(rules, /match\s+\/planActivations\/\{activationId\}[\s\S]*?allow\s+write:\s*if\s+false;/);
  assert.match(rules, /match\s+\/planAuditLogs\/\{auditId\}[\s\S]*?allow\s+write:\s*if\s+false;/);
});

test('8) Fresh account activates Plus Annual (365 days) & Plus Monthly (30 days) in PKT — preview matches server exactly', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  // 24 Nov 2026 02:30 PKT (23 Nov 2026 21:30 UTC — tests PKT vs UTC date boundary!)
  const nowMs = Date.UTC(2026, 10, 23, 21, 30, 0);

  store.seed('users/fresh_annual', { uid: 'fresh_annual', plan: 'free', kobans: 50000 });
  store.seed('wallets/fresh_annual', { balance: 50000 });
  store.seed('users/fresh_monthly', { uid: 'fresh_monthly', plan: 'free', kobans: 50000 });
  store.seed('wallets/fresh_monthly', { balance: 50000 });

  // Preview via THE ONE shared PKT calculator for Plus Annual
  const annualPreview = calculatePlanExpiryPkt({
    currentTier: 'free',
    targetTier: 'plus',
    currentExpiryRaw: null,
    purchasedDays: 365,
    nowMs,
  });
  assert.equal(annualPreview.newExpiryLabel, '24 Nov 2027');
  assert.equal(annualPreview.daysAdded, 365);
  assert.equal(annualPreview.daysRemainingAfter, 365);

  const annualRes = await callEconomy({
    path: '/api/pro/purchase-kobans',
    store,
    uid: 'fresh_annual',
    nowMs,
    body: { planId: 'plus_annual', idempotencyKey: 'fresh_ann_1' },
  });
  assert.equal(annualRes.status, 200);
  assert.equal(annualRes.json.durationDays, 365);
  assert.equal(annualRes.json.proCreditDays, 0);
  assert.equal(annualRes.json.newExpiryLabel, annualPreview.newExpiryLabel);
  assert.equal(annualRes.json.newExpiryMs, annualPreview.newExpiryMs);
  assert.equal(annualRes.json.newExpiryIso, annualPreview.newExpiryIso);

  // Preview via THE ONE shared PKT calculator for Plus Monthly
  const monthlyPreview = calculatePlanExpiryPkt({
    currentTier: 'free',
    targetTier: 'plus',
    currentExpiryRaw: null,
    purchasedDays: 30,
    nowMs,
  });
  assert.equal(monthlyPreview.newExpiryLabel, '24 Dec 2026');
  assert.equal(monthlyPreview.daysAdded, 30);
  assert.equal(monthlyPreview.daysRemainingAfter, 30);

  const monthlyRes = await callEconomy({
    path: '/api/pro/purchase-kobans',
    store,
    uid: 'fresh_monthly',
    nowMs,
    body: { planId: 'plus_monthly', idempotencyKey: 'fresh_mo_1' },
  });
  assert.equal(monthlyRes.status, 200);
  assert.equal(monthlyRes.json.durationDays, 30);
  assert.equal(monthlyRes.json.newExpiryLabel, monthlyPreview.newExpiryLabel);
  assert.equal(monthlyRes.json.newExpiryMs, monthlyPreview.newExpiryMs);
});

test('9) Extending an active Plus pass adds purchased days ONCE onto current expiry in PKT — preview matches server', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0); // 24 Nov 2026 15:00 PKT
  const existingPlusExpiryMs = pktEndOfDayMs(2027, 10, 24); // 24 Nov 2027 23:59:59.999 PKT

  store.seed('users/plus_ext', {
    uid: 'plus_ext',
    plan: 'plus',
    planTier: 'plus',
    isPlus: true,
    isPremium: true,
    plusPlanId: 'plus_annual',
    plusUntil: new Date(existingPlusExpiryMs).toISOString(),
    planExpiresAt: new Date(existingPlusExpiryMs).toISOString(),
    premiumExpiresAt: existingPlusExpiryMs,
    kobans: 10000,
  });
  store.seed('wallets/plus_ext', { balance: 10000 });

  const extPreview = calculatePlanExpiryPkt({
    currentTier: 'plus',
    targetTier: 'plus',
    currentExpiryRaw: existingPlusExpiryMs,
    purchasedDays: 30,
    nowMs,
  });
  assert.equal(extPreview.isSameTierExtension, true);
  assert.equal(extPreview.daysAdded, 30);
  assert.equal(extPreview.newExpiryLabel, '24 Dec 2027');
  assert.equal(extPreview.daysRemainingAfter, 395);

  const res = await callEconomy({
    path: '/api/pro/purchase-kobans',
    store,
    uid: 'plus_ext',
    nowMs,
    body: { planId: 'plus_monthly', idempotencyKey: 'ext_plus_1' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.json.wasExtension, true);
  assert.equal(res.json.durationDays, 30);
  assert.equal(res.json.newExpiryMs, extPreview.newExpiryMs);
  assert.equal(res.json.newExpiryLabel, '24 Dec 2027');
});

test('10) Pro Annual user buying Plus Annual does NOT stack/convert leftover Pro days — preview & server both show 24 Nov 2027 (365 days)', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0); // 24 Nov 2026 15:00 PKT
  const activeProExpiryMs = pktEndOfDayMs(2027, 10, 24); // Active Pro Annual until 24 Nov 2027

  store.seed('users/pro_to_plus', {
    uid: 'pro_to_plus',
    plan: 'pro',
    planTier: 'pro',
    isPro: true,
    isPremium: true,
    proPlanId: 'pro_annual',
    proUntil: new Date(activeProExpiryMs).toISOString(),
    planExpiresAt: new Date(activeProExpiryMs).toISOString(),
    premiumExpiresAt: activeProExpiryMs,
  });
  store.seed('coupons/PLUSFREE100', {
    code: 'PLUSFREE100',
    type: 'pct',
    value: 100,
    appliesTo: 'any',
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    active: true,
  });

  // Preview transparently tells Pro user their old 365 Pro days are replaced, NOT stacked
  const preview = calculatePlanExpiryPkt({
    currentTier: 'pro',
    targetTier: 'plus',
    currentExpiryRaw: activeProExpiryMs,
    purchasedDays: 365,
    nowMs,
  });
  assert.equal(preview.replacesActivePro, true);
  assert.equal(preview.replacedProDaysRemaining, 365);
  assert.equal(preview.extraCreditDays, 0);
  assert.equal(preview.daysAdded, 365);
  assert.equal(preview.newExpiryLabel, '24 Nov 2027'); // NOT 24 May 2028!
  assert.equal(preview.daysRemainingAfter, 365); // NOT 546/547!

  // Server activation produces the EXACT same expiry (no +182 credit days)
  const res = await callEconomy({
    path: '/api/plan/activate',
    store,
    uid: 'pro_to_plus',
    nowMs,
    body: {
      planId: 'plus_annual',
      billing: 'annual',
      couponCode: 'PLUSFREE100',
      idempotencyKey: 'pro_to_plus_idem_1',
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.json.proCreditDays, 0);
  assert.equal(res.json.durationDays, 365);
  assert.equal(res.json.upgradedFromPro, true);
  assert.equal(res.json.replacedProDaysRemaining, 365);
  assert.equal(res.json.newExpiryMs, preview.newExpiryMs);
  assert.equal(res.json.newExpiryLabel, '24 Nov 2027');
  assert.equal(getPktCalendarDaysLeft(res.json.newExpiryMs, nowMs), 365);
});

test('11) Step 3 Superadmin Audit (read-only) & pkig Repair (24 Nov 2027 PKT + audit entry, preserves history, never mutates other users)', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0); // 24 Nov 2026 15:00 PKT
  const buggyExpiryMs = pktEndOfDayMs(2028, 4, 24); // 24 May 2028 PKT (547 days!)
  const correctedExpiryMs = pktEndOfDayMs(2027, 10, 24); // 24 Nov 2027 23:59:59.999 PKT

  const PKIG_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
  store.seed(`users/${PKIG_UID}`, {
    uid: PKIG_UID,
    username: 'pkig',
    email: 'shsvirtualadmin@gmail.com',
    plan: 'plus',
    planTier: 'plus',
    isPlus: true,
    plusPlanId: 'plus_annual',
    plusUntil: new Date(buggyExpiryMs).toISOString(),
    planExpiresAt: new Date(buggyExpiryMs).toISOString(),
    premiumExpiresAt: buggyExpiryMs,
  });
  store.seed(`planActivations/${PKIG_UID}_orig_plus`, {
    id: 'orig_plus_1',
    uid: PKIG_UID,
    source: 'coupon',
    planId: 'plus_annual',
    billing: 'annual',
    durationDays: 547,
    proCreditDays: 182,
    startedAtIso: new Date(nowMs).toISOString(),
    newExpiryIso: new Date(buggyExpiryMs).toISOString(),
  });

  // Another affected user (must be reported, NEVER modified automatically)
  store.seed('users/other_overextended', {
    uid: 'other_overextended',
    username: 'student_extra',
    plan: 'plus',
    planTier: 'plus',
    isPlus: true,
    plusUntil: new Date(buggyExpiryMs).toISOString(),
    planExpiresAt: new Date(buggyExpiryMs).toISOString(),
  });
  store.seed('planActivations/other_overextended_act_1', {
    id: 'other_act_1',
    uid: 'other_overextended',
    planId: 'plus_annual',
    billing: 'annual',
    durationDays: 547,
    proCreditDays: 182,
    startedAtIso: new Date(nowMs).toISOString(),
  });

  // Non-superadmin blocked with 403
  const forbiddenAudit = await callEconomy({
    path: '/api/admin/plan-audit?username=pkig',
    method: 'GET',
    store,
    uid: 'random_student',
    superAdmin: false,
    nowMs,
  });
  assert.equal(forbiddenAudit.status, 403);

  const forbiddenRepair = await callEconomy({
    path: '/api/admin/plan-repair-pkig',
    method: 'POST',
    store,
    uid: 'random_student',
    superAdmin: false,
    nowMs,
  });
  assert.equal(forbiddenRepair.status, 403);

  // Superadmin read-only audit reports both pkig and other_overextended without changing either
  const auditRes = await callEconomy({
    path: '/api/admin/plan-audit?username=pkig',
    method: 'GET',
    store,
    uid: PKIG_UID,
    superAdmin: true,
    nowMs,
  });
  assert.equal(auditRes.status, 200);
  assert.equal(auditRes.json.readOnly, true);
  assert.equal(auditRes.json.inspectedUser.username, 'pkig');
  assert.equal(auditRes.json.inspectedUser.totalPurchasedDays, 365);
  assert.equal(auditRes.json.inspectedUser.excessDays > 180, true);
  assert.equal(auditRes.json.flaggedUsersCount, 2);
  assert.equal(
    store.read('users/other_overextended')?.plusUntil,
    new Date(buggyExpiryMs).toISOString()
  );

  // Superadmin repair sets pkig to 24 Nov 2027 23:59:59.999 PKT, writes audit entry, preserves history, leaves others untouched
  const repairRes = await callEconomy({
    path: '/api/admin/plan-repair-pkig',
    method: 'POST',
    store,
    uid: PKIG_UID,
    superAdmin: true,
    nowMs,
  });
  assert.equal(repairRes.status, 200);
  assert.equal(repairRes.json.ok, true);
  assert.equal(repairRes.json.alreadyCorrected, false);
  assert.equal(repairRes.json.newExpiryMs, correctedExpiryMs);
  assert.equal(repairRes.json.newExpiryIso, '2027-11-24T18:59:59.999Z');
  assert.equal(repairRes.json.newExpiryLabel, '24 Nov 2027');
  assert.equal(repairRes.json.auditMessage, 'Corrected duplicate days from activation bug');

  const pkigAfter = store.read(`users/${PKIG_UID}`);
  assert.equal(pkigAfter?.plusUntil, '2027-11-24T18:59:59.999Z');
  assert.equal(pkigAfter?.planExpiresAt, '2027-11-24T18:59:59.999Z');
  assert.equal(pkigAfter?.premiumExpiresAt, correctedExpiryMs);

  // Audit entry recorded & history NOT deleted
  const auditDoc = store.read('planAuditLogs/repair_pkig_20271124');
  assert.ok(auditDoc);
  assert.equal(auditDoc.message, 'Corrected duplicate days from activation bug');
  assert.equal(auditDoc.historyPreserved, true);
  assert.ok(store.read(`planActivations/${PKIG_UID}_orig_plus`), 'Original activation history must NOT be deleted');

  // Other user remains untouched
  assert.equal(
    store.read('users/other_overextended')?.plusUntil,
    new Date(buggyExpiryMs).toISOString()
  );

  // Repeat repair call is idempotent
  const repairReplay = await callEconomy({
    path: '/api/admin/plan-repair-pkig',
    method: 'POST',
    store,
    uid: PKIG_UID,
    superAdmin: true,
    nowMs,
  });
  assert.equal(repairReplay.status, 200);
  assert.equal(repairReplay.json.alreadyCorrected, true);
});
