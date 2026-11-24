import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEconomyApiRequest } from '../../functions/api/economy/[[path]]';
import type {
  FirestoreStoreAdapter,
  FirestoreTransactionContext,
} from '../../functions/_utils/firestoreRestAdmin';
import { COSMETICS_CATALOG } from '../data/cosmeticsCatalog';
import {
  calculateCartTotals,
  isLegacyUniform600Collection,
  resolveEffectiveStoreItemPrice,
} from '../lib/storeCartPricing';
import {
  buildAddAccountUrl,
  getAddAccountPrefillEmail,
  getSavedAccounts,
  isAddAccountUrl,
  removeSavedAccount,
  shouldAutoRedirectFromAuthScreen,
  upsertSavedAccount,
} from '../utils/savedAccounts';

class InMemoryAtomicFirestoreStore implements FirestoreStoreAdapter {
  docs = new Map<string, Record<string, any>>();
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

      const result = await fn(tx);
      if (ops.length === 0) return result;

      const createdInTx = new Set<string>();
      for (const op of ops) {
        if (op.kind === 'create') {
          if (this.docs.has(op.docPath) || createdInTx.has(op.docPath)) {
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
      return result;
    };

    const next = this.txChain.then(run, run);
    this.txChain = next.catch(() => {});
    return next;
  }
}

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

function makeAuthVerifier(uid: string, options?: { email?: string; superAdmin?: boolean }) {
  return async (authHeader: string | null | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return {
      uid,
      email: options?.email || 'student@boardly.cfd',
      emailVerified: true,
      name: 'Test User',
      superAdmin: options?.superAdmin === true,
      isSuperAdmin: options?.superAdmin === true,
      admin: options?.superAdmin === true,
    };
  };
}

async function callStorePurchase(params: {
  store: InMemoryAtomicFirestoreStore;
  uid: string;
  items: Array<{ id: string; name?: string; type?: string }>;
  idempotencyKey: string;
  nowMs?: number;
}) {
  const req = new Request('https://boardly.cfd/api/store/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer valid-token',
    },
    body: JSON.stringify({
      items: params.items,
      idempotencyKey: params.idempotencyKey,
    }),
  });

  const res = await handleEconomyApiRequest({
    request: req,
    env: {},
    storeOverride: params.store,
    tokenVerifierOverride: makeAuthVerifier(params.uid),
    nowMsOverride: params.nowMs ?? Date.UTC(2026, 10, 24, 12, 0, 0),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, json };
}

test('BUG 1a: 11-item cart (with multi-item slots, legacy 600 docs, and active sales) matches between client and server and buys cleanly', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const uid = 'student_cart_11';
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);

  // Pick 11 real purchasable items (Common/Rare <= 400 Kobans) including 2 slots with multiple items (avatars + frames)
  const avatars = COSMETICS_CATALOG.filter((c) => c.type === 'avatar' && c.priceKobans > 0 && c.priceKobans <= 400).slice(0, 4);
  const frames = COSMETICS_CATALOG.filter((c) => c.type === 'frame' && c.priceKobans > 0 && c.priceKobans <= 400).slice(0, 4);
  const banners = COSMETICS_CATALOG.filter((c) => c.type === 'banner' && c.priceKobans > 0 && c.priceKobans <= 400).slice(0, 1);
  const nameplates = COSMETICS_CATALOG.filter((c) => c.type === 'nameplate' && c.priceKobans > 0 && c.priceKobans <= 400).slice(0, 1);
  const effects = COSMETICS_CATALOG.filter((c) => c.type === 'effect' && c.priceKobans > 0 && c.priceKobans <= 400).slice(0, 1);
  const selected11 = [...avatars, ...frames, ...banners, ...nameplates, ...effects];
  assert.equal(selected11.length, 11);

  // Seed legacy uniform-600 unversioned store_items docs AND stale legacy storeItems docs (root cause of 6,030 inflation)
  for (let i = 0; i < selected11.length; i++) {
    const item = selected11[i];
    store.seed(`storeItems/${item.id}`, {
      id: item.id,
      name: item.name,
      category: item.type,
      price: 600,
      priceKobans: 600,
    });
    if (i < 9) {
      // Unversioned legacy bulk-600 override doc (must be ignored by both client and server)
      store.seed(`store_items/${item.id}`, {
        id: item.id,
        name: item.name,
        category: item.type,
        priceKobans: 600,
        active: true,
      });
    } else if (i === 9) {
      // Versioned v2 item with an active sale price
      store.seed(`store_items/${item.id}`, {
        id: item.id,
        name: item.name,
        category: item.type,
        priceKobans: item.priceKobans,
        salePriceKobans: Math.max(50, Math.floor(item.priceKobans / 2)),
        saleEndsAt: nowMs + 86_400_000,
        priceSchemaV2: true,
        active: true,
      });
    } else {
      // Versioned v2 item with explicit catalog price
      store.seed(`store_items/${item.id}`, {
        id: item.id,
        name: item.name,
        category: item.type,
        priceKobans: item.priceKobans,
        priceSchemaV2: true,
        active: true,
      });
    }
  }

  const storeItemsDocs = await store.listCollection('store_items', 500);
  const legacyUniform600 = isLegacyUniform600Collection(storeItemsDocs.map((d) => d.data));
  assert.equal(legacyUniform600, true, 'Legacy uniform-600 bulk test docs must be detected');

  // Compute client cart items using the exact shared pricing helper
  const docsById = new Map(storeItemsDocs.map((d) => [d.id, d.data]));
  const clientItems = selected11.map((item) => {
    const liveData = docsById.get(item.id) || null;
    const resolved = resolveEffectiveStoreItemPrice({
      catalogPrice: item.priceKobans,
      liveDoc: liveData,
      isLegacyUniform600: legacyUniform600,
      nowMs,
    });
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      priceKobans: resolved.effectivePrice,
    };
  });

  const expectedSubtotal = clientItems.reduce((sum, item) => sum + item.priceKobans, 0);
  const startingBalance = expectedSubtotal + 1770;
  assert.ok(expectedSubtotal < 600 * 11, 'Subtotal must NOT be inflated by legacy 600 overrides');

  const clientTotals = calculateCartTotals({
    items: clientItems,
    balance: startingBalance,
    isSuperAdmin: false,
  });

  assert.equal(clientTotals.itemCount, 11);
  assert.equal(clientTotals.subtotal, expectedSubtotal);
  assert.equal(clientTotals.currentBalance, startingBalance);
  assert.equal(clientTotals.balanceAfterPurchase, 1770);
  assert.equal(clientTotals.canAfford, true);
  assert.equal(clientTotals.deficit, 0);
  assert.equal(clientTotals.insufficientBannerMessage, null);

  // Seed user wallet and verify server POST /api/store/purchase agrees 100%
  store.seed(`users/${uid}`, {
    uid,
    kobans: startingBalance,
    kobanBalance: startingBalance,
    ownedItems: [],
  });
  store.seed(`wallets/${uid}`, {
    balance: startingBalance,
  });

  const { status, json } = await callStorePurchase({
    store,
    uid,
    items: selected11.map((i) => ({ id: i.id, name: i.name, type: i.type })),
    idempotencyKey: 'checkout_11_items_ok',
    nowMs,
  });

  assert.equal(status, 200, `Expected 200 OK, got ${status}: ${JSON.stringify(json)}`);
  assert.equal(json.ok, true);
  assert.equal(json.totalDeducted, expectedSubtotal);
  assert.equal(json.newBalance, 1770);
  assert.equal(json.purchasedItems.length, 11);

  const updatedWallet = store.read(`wallets/${uid}`);
  assert.equal(updatedWallet?.balance, 1770);
});

test('BUG 1b: Truly insufficient balance shows identical error on client and server, and removing items clears it immediately', async () => {
  const store = new InMemoryAtomicFirestoreStore();
  const uid = 'student_cart_low_balance';
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);

  const items = COSMETICS_CATALOG.filter((c) => c.priceKobans >= 200).slice(0, 4);
  assert.equal(items.length, 4);

  const fullSubtotal = items.reduce((sum, i) => sum + i.priceKobans, 0);
  const firstTwoSubtotal = items[0].priceKobans + items[1].priceKobans;
  const userBalance = firstTwoSubtotal + 25; // Enough for 2 items, NOT enough for all 4
  assert.ok(userBalance < fullSubtotal);

  store.seed(`users/${uid}`, {
    uid,
    kobans: userBalance,
    kobanBalance: userBalance,
    ownedItems: [],
  });
  store.seed(`wallets/${uid}`, { balance: userBalance });

  // Client totals with all 4 items
  const clientBefore = calculateCartTotals({
    items: items.map((i) => ({ id: i.id, priceKobans: i.priceKobans })),
    balance: userBalance,
  });
  assert.equal(clientBefore.subtotal, fullSubtotal);
  assert.equal(clientBefore.canAfford, false);
  assert.equal(clientBefore.deficit, fullSubtotal - userBalance);
  assert.equal(
    clientBefore.insufficientBannerMessage,
    `Insufficient Kobans. You need ${fullSubtotal.toLocaleString()} Kobans (you have ${userBalance.toLocaleString()}).`
  );

  // Server must reject with 402 and the exact same required Kobans message
  const failRes = await callStorePurchase({
    store,
    uid,
    items: items.map((i) => ({ id: i.id })),
    idempotencyKey: 'checkout_low_balance_fail',
    nowMs,
  });
  assert.equal(failRes.status, 402);
  assert.equal(failRes.json.error, clientBefore.insufficientBannerMessage);
  assert.equal(failRes.json.requiredKobans, fullSubtotal);

  // Remove 2 items -> subtotal drops below balance and error clears immediately
  const trimmed = items.slice(0, 2);
  const clientAfterRemove = calculateCartTotals({
    items: trimmed.map((i) => ({ id: i.id, priceKobans: i.priceKobans })),
    balance: userBalance,
  });
  assert.equal(clientAfterRemove.subtotal, firstTwoSubtotal);
  assert.equal(clientAfterRemove.canAfford, true);
  assert.equal(clientAfterRemove.balanceAfterPurchase, 25);
  assert.equal(clientAfterRemove.insufficientBannerMessage, null);

  // Server purchase now succeeds with exact remaining balance 25
  const okRes = await callStorePurchase({
    store,
    uid,
    items: trimmed.map((i) => ({ id: i.id })),
    idempotencyKey: 'checkout_after_remove_ok',
    nowMs,
  });
  assert.equal(okRes.status, 200);
  assert.equal(okRes.json.totalDeducted, firstTwoSubtotal);
  assert.equal(okRes.json.newBalance, 25);
});

test('BUG 1c: Duplicate cart IDs and already-owned items are never double-counted in cart totals', () => {
  const totals = calculateCartTotals({
    items: [
      { id: 'item_a', priceKobans: 300 },
      { id: 'item_a', priceKobans: 300 }, // duplicate ID
      { id: 'item_b', priceKobans: 400 },
      { id: 'item_owned', priceKobans: 900 }, // already owned
    ],
    balance: 700,
    ownedIds: ['item_owned'],
  });

  assert.equal(totals.itemCount, 2);
  assert.equal(totals.subtotal, 700);
  assert.equal(totals.canAfford, true);
  assert.equal(totals.balanceAfterPurchase, 0);
  assert.equal(totals.insufficientBannerMessage, null);
});

test('BUG 2a: Add account URL never auto-redirects logged-in admin or student to /admin or /dashboard', () => {
  const adminAddUrl = buildAddAccountUrl({ returnTo: '/settings' });
  assert.equal(adminAddUrl.startsWith('/login?'), true);
  const search = adminAddUrl.slice(adminAddUrl.indexOf('?'));
  assert.equal(isAddAccountUrl(search), true);

  // Admin currently logged in opens Settings -> Switch account -> Add account
  const redirectAdminBeforeSubmit = shouldAutoRedirectFromAuthScreen({
    isAddAccountFlow: true,
    hasCompletedNewAuthSubmit: false,
    initialUid: 'admin_uid_1',
    currentUid: 'admin_uid_1',
    profileUid: 'admin_uid_1',
    profileLoading: false,
    isSessionVerified: true,
  });
  assert.equal(redirectAdminBeforeSubmit, false, 'Admin must stay on Add Account login screen');

  // Student currently logged in opens Settings -> Switch account -> Add account
  const redirectStudentBeforeSubmit = shouldAutoRedirectFromAuthScreen({
    isAddAccountFlow: true,
    hasCompletedNewAuthSubmit: false,
    initialUid: 'student_uid_1',
    currentUid: 'student_uid_1',
    profileUid: 'student_uid_1',
    profileLoading: false,
    isSessionVerified: true,
  });
  assert.equal(redirectStudentBeforeSubmit, false, 'Student must stay on Add Account login screen');

  // Normal /login visit (NOT Add Account) still redirects verified users normally
  const normalLoginRedirect = shouldAutoRedirectFromAuthScreen({
    isAddAccountFlow: false,
    hasCompletedNewAuthSubmit: false,
    initialUid: null,
    currentUid: 'admin_uid_1',
    profileUid: 'admin_uid_1',
    profileLoading: false,
    isSessionVerified: true,
  });
  assert.equal(normalLoginRedirect, true);
});

test('BUG 2b: After adding a new student account while signed in as admin, waits for new profile before routing and keeps admin saved', () => {
  const storage = createMemoryStorage();

  // Admin account is saved before opening Add Account
  upsertSavedAccount(
    {
      uid: 'admin_uid_1',
      email: 'admin@boardly.cfd',
      displayName: 'Admin User',
      username: 'pkig',
      role: 'admin',
      planLabel: 'Boardly Plus',
    },
    storage
  );

  // Race tick 1: Submit resolved with student_uid_2, but React state still momentarily has admin_uid_1
  assert.equal(
    shouldAutoRedirectFromAuthScreen({
      isAddAccountFlow: true,
      hasCompletedNewAuthSubmit: true,
      submittedTargetUid: 'student_uid_2',
      initialUid: 'admin_uid_1',
      currentUid: 'admin_uid_1',
      profileUid: 'admin_uid_1',
      profileLoading: false,
      isSessionVerified: true,
    }),
    false,
    'Must NOT redirect using stale admin_uid_1 before student_uid_2 loads'
  );

  // Race tick 2: AuthContext switched user to student_uid_2 and cleared profile while loading
  assert.equal(
    shouldAutoRedirectFromAuthScreen({
      isAddAccountFlow: true,
      hasCompletedNewAuthSubmit: true,
      submittedTargetUid: 'student_uid_2',
      initialUid: 'admin_uid_1',
      currentUid: 'student_uid_2',
      profileUid: null,
      profileLoading: true,
      isSessionVerified: true,
    }),
    false,
    'Must wait until student_uid_2 profile finishes loading'
  );

  // Final tick: student_uid_2 profile loaded -> now allow routing by NEW account role
  assert.equal(
    shouldAutoRedirectFromAuthScreen({
      isAddAccountFlow: true,
      hasCompletedNewAuthSubmit: true,
      submittedTargetUid: 'student_uid_2',
      initialUid: 'admin_uid_1',
      currentUid: 'student_uid_2',
      profileUid: 'student_uid_2',
      profileLoading: false,
      isSessionVerified: true,
    }),
    true
  );

  // New student account is also persisted; existing admin account remains in Switch account list
  upsertSavedAccount(
    {
      uid: 'student_uid_2',
      email: 'amina@boardly.cfd',
      displayName: 'Amina',
      username: 'Amina',
      role: 'student',
      planLabel: 'Free',
    },
    storage
  );

  // Guest accounts must never pollute saved accounts
  upsertSavedAccount(
    {
      uid: 'guest_123',
      email: '',
      displayName: 'Guest',
      isGuest: true,
    },
    storage
  );

  const saved = getSavedAccounts(storage);
  assert.equal(saved.length, 2);
  assert.ok(saved.some((a) => a.uid === 'admin_uid_1' && a.email === 'admin@boardly.cfd'));
  assert.ok(saved.some((a) => a.uid === 'student_uid_2' && a.email === 'amina@boardly.cfd'));

  // Clicking the saved admin account generates a prefilled Add Account URL
  const switchBackUrl = buildAddAccountUrl({ email: 'admin@boardly.cfd', returnTo: '/settings' });
  const switchSearch = switchBackUrl.slice(switchBackUrl.indexOf('?'));
  assert.equal(isAddAccountUrl(switchSearch), true);
  assert.equal(getAddAccountPrefillEmail(switchSearch), 'admin@boardly.cfd');

  // Removing an account works cleanly
  const afterRemove = removeSavedAccount('student_uid_2', storage);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].uid, 'admin_uid_1');
});
