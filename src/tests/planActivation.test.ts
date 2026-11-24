import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleEconomyApiRequest,
} from '../../functions/api/economy/[[path]]';
import type {
  FirestoreStoreAdapter,
  FirestoreTransactionContext,
} from '../../functions/_utils/firestoreRestAdmin';
import { mapPlanActivationError } from '../services/proSubscriptionService';
import { buildPlansCatalog } from '../config/plans';
import { DEFAULT_PLANS_CONFIG } from '../lib/planTier';
import { computeCouponDiscount, resolveCheckoutItemPricing } from '../utils/couponEngine';

/**
 * Atomic in-memory FirestoreStoreAdapter for end-to-end testing of POST /api/plan/activate.
 * - Buffers all writes inside runTransaction and commits atomically (or discards on throw).
 * - Enforces createDoc uniqueness (`exists: false` precondition) like real Firestore.
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

      // Validate all preconditions before applying any write (atomic commit)
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

function makeAuthVerifier(uid: string | null, email = 'student@boardly.cfd') {
  return async (authHeader: string | null | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token || token === 'invalid-token' || !uid) return null;
    return { uid, email, name: 'Test User' };
  };
}

async function callActivatePlan(params: {
  store?: InMemoryAtomicFirestoreStore | null;
  uid?: string | null;
  token?: string | null;
  method?: string;
  body?: Record<string, any>;
  nowMs?: number;
}) {
  const method = params.method || 'POST';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.token !== null) {
    headers.Authorization = `Bearer ${params.token ?? 'valid-test-token'}`;
  }

  const req = new Request('https://boardly.cfd/api/plan/activate', {
    method,
    headers,
    ...(method === 'POST' ? { body: JSON.stringify(params.body ?? {}) } : {}),
  });

  const res = await handleEconomyApiRequest({
    request: req,
    env: {},
    storeOverride: params.store === undefined ? null : params.store,
    tokenVerifierOverride: makeAuthVerifier(params.uid === undefined ? 'user_001' : params.uid),
    nowMsOverride: params.nowMs ?? Date.UTC(2026, 10, 24, 12, 0, 0),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, json };
}

test('1) POST /api/plan/activate with 100%-off EARLY21 activates Pro Annual atomically in ONE transaction', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0); // 24 Nov 2026

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

  const res = await callActivatePlan({
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
  assert.equal(res.json.idempotentReplay, false);

  // Verify ALL writes committed in ONE single Firestore transaction
  assert.equal(store.transactionCommits, 1);
  assert.equal(store.transactionRollbacks, 0);

  // User subscription updated atomically
  const updatedUser = store.read('users/user_001');
  assert.ok(updatedUser);
  assert.equal(updatedUser.plan, 'pro');
  assert.equal(updatedUser.planTier, 'pro');
  assert.equal(updatedUser.proPlanId, 'pro_annual');
  assert.equal(updatedUser.isPro, true);
  assert.equal(updatedUser.isPremium, true);
  assert.equal(updatedUser.isPlus, false);
  assert.equal(updatedUser.appliedCouponCode, 'EARLY21');
  assert.equal(updatedUser.planStartedAt, new Date(nowMs).toISOString());
  assert.equal(updatedUser.planExpiresAt, new Date(nowMs + 365 * 86_400_000).toISOString());
  assert.equal(updatedUser.proUntil, updatedUser.planExpiresAt);

  // Coupon redemption created & count incremented from 0 -> 1
  const redemption = store.read('coupons/EARLY21/redemptions/user_001');
  assert.ok(redemption);
  assert.equal(redemption.uid, 'user_001');
  assert.equal(redemption.usedOn, 'pro_annual');
  assert.equal(redemption.finalPkr, 0);
  assert.equal(redemption.discountPkr, 1791);

  const couponAfter = store.read('coupons/EARLY21');
  assert.equal(couponAfter?.redeemedCount, 1);

  const activationAudit = store.read('planActivations/user_001_idem_early21_001');
  assert.ok(activationAudit);
  assert.equal(activationAudit.couponCode, 'EARLY21');
});

test('2) Double-tap replay with same idempotencyKey returns stored activation without burning coupon twice or double-extending expiry', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);

  store.seed('users/user_002', { uid: 'user_002', plan: 'free' });
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

  const first = await callActivatePlan({
    store,
    uid: 'user_002',
    nowMs,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_doubletap_002',
    },
  });
  assert.equal(first.status, 200);
  assert.equal(first.json.idempotentReplay, false);

  const replay = await callActivatePlan({
    store,
    uid: 'user_002',
    nowMs: nowMs + 2000,
    body: {
      planId: 'pro_annual',
      billing: 'annual',
      couponCode: 'EARLY21',
      idempotencyKey: 'idem_doubletap_002',
    },
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.json.ok, true);
  assert.equal(replay.json.idempotentReplay, true);
  assert.equal(replay.json.newExpiryIso, first.json.newExpiryIso);

  // Coupon count stays 1, expiry is unchanged, and only 1 commit occurred
  assert.equal(store.read('coupons/EARLY21')?.redeemedCount, 1);
  assert.equal(store.read('users/user_002')?.planExpiresAt, first.json.newExpiryIso);
  assert.equal(store.transactionCommits, 1);
});

test('3) Retrying EARLY21 on the same account with a new idempotencyKey returns 409 "Coupon already used" and rolls back', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);

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

  const first = await callActivatePlan({
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

  const second = await callActivatePlan({
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
  assert.equal(second.json.ok, false);
  assert.equal(second.json.code, 'ALREADY_USED');
  assert.equal(second.json.error, 'Coupon already used');
  assert.equal(store.read('coupons/EARLY21')?.redeemedCount, 1);
  assert.equal(store.read('users/user_003')?.planExpiresAt, first.json.newExpiryIso);
  assert.equal(store.transactionCommits, 1);
  assert.equal(store.transactionRollbacks, 1);
});

test('4) Server security & validation checks: auth, guest, expired, maxed-out, wrong-plan, tampered price, method, missing admin credentials', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);

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

  // (a) Unauthenticated request -> 401 "Please sign in again"
  const unauth = await callActivatePlan({
    store,
    uid: null,
    token: null,
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100' },
  });
  assert.equal(unauth.status, 401);
  assert.equal(unauth.json.error, 'Please sign in again');

  // (b) Guest token -> 403
  const guest = await callActivatePlan({
    store,
    uid: 'guest_abc',
    token: 'guest_abc',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100' },
  });
  assert.equal(guest.status, 403);

  // (c) GET /api/plan/activate -> 405
  const wrongMethod = await callActivatePlan({
    store,
    uid: 'user_sec',
    method: 'GET',
    nowMs,
  });
  assert.equal(wrongMethod.status, 405);

  // (d) Expired coupon -> 400 "Coupon expired"
  const expired = await callActivatePlan({
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EXPIRED100', idempotencyKey: 'sec_exp' },
  });
  assert.equal(expired.status, 400);
  assert.equal(expired.json.code, 'EXPIRED');
  assert.equal(expired.json.error, 'Coupon expired');

  // (e) Maxed-out coupon -> 409
  const maxed = await callActivatePlan({
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'MAXED100', idempotencyKey: 'sec_max' },
  });
  assert.equal(maxed.status, 409);
  assert.equal(maxed.json.code, 'FULLY_CLAIMED');

  // (f) Wrong plan coupon -> 400
  const wrongPlan = await callActivatePlan({
    store,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'PLUSONLY100', idempotencyKey: 'sec_plan' },
  });
  assert.equal(wrongPlan.status, 400);
  assert.equal(wrongPlan.json.code, 'WRONG_ITEM');

  // (g) Tampered client price/discount on a 20% coupon -> rejected (server recalculates price!)
  const tampered = await callActivatePlan({
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
      isFreeActivation: true,
      idempotencyKey: 'sec_tamper',
    },
  });
  assert.equal(tampered.status, 400);
  assert.equal(tampered.json.code, 'PAYMENT_REQUIRED');
  assert.equal(store.read('users/user_sec')?.plan, 'free');
  assert.equal(store.read('coupons/PARTIAL20')?.redeemedCount, 0);

  // (h) Missing server admin credentials -> fails closed with 503 (never fakes activation)
  const noAdmin = await callActivatePlan({
    store: null,
    uid: 'user_sec',
    nowMs,
    body: { planId: 'pro_annual', billing: 'annual', couponCode: 'EARLY21', idempotencyKey: 'sec_noadmin' },
  });
  assert.equal(noAdmin.status, 503);
  assert.equal(noAdmin.json.ok, false);
  assert.equal(noAdmin.json.error, "Couldn't activate. Try again");
});

test('5) Friendly error mapping never exposes raw Firestore permission-denied messages', () => {
  assert.equal(
    mapPlanActivationError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }),
    "Couldn't activate. Try again"
  );
  assert.equal(
    mapPlanActivationError(new Error('FirebaseError: Missing or insufficient permissions.')),
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

  // 199 * 12 * 0.75 = 1791 (never 1794)
  assert.equal(catalog.pro_annual.price_pkr, 1791);
  assert.equal(itemPricing.basePkr, 1791);
  assert.equal(discount.originalPkr, 1791);
  assert.equal(discount.discountPkr, 1791);
  assert.equal(discount.finalPkr, 0);
  assert.equal(discount.finalKobans, 0);
  assert.equal(discount.isFreeActivation, true);
});

test('7) firestore.rules keep subscription fields, coupons, redemptions, and planActivations client read-only', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  // User subscription & expiry fields remain protected in ownerUpdatesOnlySafeUserFields
  for (const protectedField of [
    "'plan'",
    "'planTier'",
    "'planExpiresAt'",
    "'proUntil'",
    "'plusUntil'",
    "'planStartedAt'",
    "'appliedCouponCode'",
  ]) {
    assert.ok(
      rules.includes(protectedField),
      `Expected firestore.rules to protect ${protectedField}`
    );
  }

  // Coupons cannot be updated by non-admin clients
  assert.match(
    rules,
    /match\s+\/coupons\/\{couponCode\}[\s\S]*?allow\s+update:\s*if\s+isAdmin\(\);/
  );

  // Per-user coupon redemptions allow owner get and deny all client writes
  assert.match(
    rules,
    /match\s+\/redemptions\/\{uid\}[\s\S]*?allow\s+get:\s*if\s+isAdmin\(\)\s*\|\|\s*isOwner\(uid\);[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false;/
  );

  // planActivations allows owner/admin read and denies all client writes
  assert.match(
    rules,
    /match\s+\/planActivations\/\{activationId\}[\s\S]*?allow\s+write:\s*if\s+false;/
  );
});
