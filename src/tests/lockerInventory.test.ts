import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { handleEconomyApiRequest } from '../../functions/api/economy/[[path]]';
import type {
  FirestoreStoreAdapter,
  FirestoreTransactionContext,
} from '../../functions/_utils/firestoreRestAdmin';
import {
  buildOwnedCosmeticItemsList,
  countEquippedLoadout,
  filterLockerItemsByCategory,
  getStarterAvatarForUser,
  mergeCanonicalInventory,
  normalizeInventoryItemId,
} from '../lib/inventorySource';

class InMemoryFirestoreStore implements FirestoreStoreAdapter {
  docs = new Map<string, Record<string, any>>();

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
    type PendingOp =
      | { kind: 'set'; docPath: string; data: Record<string, any>; merge: boolean }
      | { kind: 'create'; docPath: string; data: Record<string, any> }
      | { kind: 'delete'; docPath: string };
    const ops: PendingOp[] = [];
    const staged = new Map<string, Record<string, any>>();
    for (const [k, v] of this.docs.entries()) {
      staged.set(k, structuredClone(v));
    }
    const tx: FirestoreTransactionContext = {
      get: async (docPath) => {
        const found = staged.get(docPath);
        return found ? structuredClone(found) : null;
      },
      set: (docPath, data, merge = true) => {
        ops.push({ kind: 'set', docPath, data: structuredClone(data), merge });
        if (merge && staged.has(docPath)) {
          staged.set(docPath, { ...staged.get(docPath)!, ...structuredClone(data) });
        } else {
          staged.set(docPath, structuredClone(data));
        }
      },
      create: (docPath, data) => {
        if (staged.has(docPath)) {
          throw new Error(`ALREADY_EXISTS: ${docPath}`);
        }
        ops.push({ kind: 'create', docPath, data: structuredClone(data) });
        staged.set(docPath, structuredClone(data));
      },
      delete: (docPath) => {
        ops.push({ kind: 'delete', docPath });
        staged.delete(docPath);
      },
    };
    const result = await fn(tx);
    for (const op of ops) {
      if (op.kind === 'delete') {
        this.docs.delete(op.docPath);
      } else if (op.kind === 'set' && op.merge && this.docs.has(op.docPath)) {
        this.docs.set(op.docPath, { ...this.docs.get(op.docPath)!, ...op.data });
      } else {
        this.docs.set(op.docPath, op.data);
      }
    }
    return result;
  }
}

function makeAuthCaller(uid: string, opts: { superAdmin?: boolean; email?: string } = {}) {
  return async () => ({
    uid,
    email: opts.email || `${uid}@boardly.test`,
    name: uid,
    picture: null,
    emailVerified: true,
    role: opts.superAdmin ? 'superadmin' : 'student',
    captain: false,
    admin: Boolean(opts.superAdmin),
    superAdmin: Boolean(opts.superAdmin),
    isSuperAdmin: Boolean(opts.superAdmin),
    isAdminOrAbove: Boolean(opts.superAdmin),
  });
}

test('Amina scenario: equipped avatar & frame in publicProfiles missing from wallets/{uid}.owned are loaded, auto-backfilled, and counted accurately', async () => {
  const store = new InMemoryFirestoreStore();
  const uid = 'uid_amina_94216';
  const starterKey = getStarterAvatarForUser(uid).key;

  store.seed(`users/${uid}`, {
    uid,
    username: 'Amina',
    displayName: 'Amina',
    kobans: 150,
  });
  store.seed(`wallets/${uid}`, {
    balance: 150,
    owned: [],
    equipped: {
      avatar: null,
      frame: null,
      banner: null,
      nameplate: null,
      effect: null,
    },
  });
  store.seed(`publicProfiles/${uid}`, {
    uid,
    username: 'Amina',
    equipped: {
      avatar: 'pfp_pixel_pop_arcade',
      frame: 'frame-topper-burst',
      banner: null,
      nameplate: null,
      effect: null,
    },
  });

  const resp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory', { method: 'GET' }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });

  assert.equal(resp.status, 200);
  const body = (await resp.json()) as any;
  assert.equal(body.ok, true);
  assert.equal(body.uid, uid);
  assert.equal(body.balance, 150);
  assert.equal(body.backfilled, true);
  assert.equal(body.equipped.avatar, 'pfp_pixel_pop_arcade');
  assert.equal(body.equipped.frame, 'frame-topper-burst');
  assert.equal(body.equippedCount, 2);

  // Owned includes starter avatar + equipped avatar + equipped frame
  assert.ok(body.owned.includes(starterKey), 'starter avatar must be owned');
  assert.ok(body.owned.includes('pfp_pixel_pop_arcade'), 'equipped avatar must be owned');
  assert.ok(body.owned.includes('frame-topper-burst'), 'equipped frame must be owned');

  // Auto-backfill persisted to wallets/{uid}, users/{uid}, and inventory/{uid}
  const updatedWallet = store.read(`wallets/${uid}`);
  assert.ok(updatedWallet?.owned.includes('pfp_pixel_pop_arcade'));
  assert.ok(updatedWallet?.owned.includes('frame-topper-burst'));
  assert.ok(updatedWallet?.owned.includes(starterKey));
  assert.equal(updatedWallet?.balance, 150, 'balance must never be altered by backfill');

  const updatedInventory = store.read(`inventory/${uid}`);
  assert.ok(updatedInventory?.items.includes('frame-topper-burst'));

  // Frontend Locker list resolves all owned items & category filters match
  const lockerItems = buildOwnedCosmeticItemsList(body.owned, {
    uid,
    equipped: body.equipped,
  });
  assert.equal(lockerItems.length, 3);
  assert.equal(filterLockerItemsByCategory(lockerItems, 'all').length, 3);
  assert.equal(filterLockerItemsByCategory(lockerItems, 'avatar').length, 2);
  assert.equal(filterLockerItemsByCategory(lockerItems, 'frame').length, 1);
  assert.equal(filterLockerItemsByCategory(lockerItems, 'banner').length, 0);
});

test('Canonical inventory normalizes legacy catalog IDs, aliases, store asset paths, and subcollections across all categories', () => {
  const uid = 'uid_legacy_collector';
  const starterKey = getStarterAvatarForUser(uid).key;

  assert.equal(normalizeInventoryItemId('pfp_eclipse_wyrm', 'avatar'), 'eclipse-wyrm');
  assert.equal(normalizeInventoryItemId('frame_torii_gate', 'frame'), 'frame-stone-torii');
  assert.equal(
    normalizeInventoryItemId('/assets/store/pfp_pixel_pop_arcade/poster.webp', 'avatar'),
    'pfp_pixel_pop_arcade'
  );
  assert.equal(normalizeInventoryItemId('avatar-1', 'avatar'), null);
  assert.equal(normalizeInventoryItemId('https://lh3.googleusercontent.com/abc', 'avatar'), null);

  const merged = mergeCanonicalInventory({
    uid,
    walletDoc: {
      owned: ['pfp_eclipse_wyrm'],
      equipped: { avatar: 'pfp_eclipse_wyrm', frame: 'frame_torii_gate' },
    },
    inventoryDoc: {
      items: ['ban_crimson_dragons_descent', 'plate-dragon-lord'],
    },
    inventorySubcollectionDocs: [
      { id: 'effect-sacred-geometry', data: { itemId: 'effect-sacred-geometry' } },
    ],
    unlockedSubcollectionDocs: [{ id: 'frame_torii_gate', data: {} }],
  });

  assert.ok(merged.owned.includes(starterKey));
  assert.ok(merged.owned.includes('eclipse-wyrm'));
  assert.ok(merged.owned.includes('frame-stone-torii'));
  assert.ok(merged.owned.includes('ban_crimson_dragons_descent'));
  assert.ok(merged.owned.includes('plate-dragon-lord'));
  assert.ok(merged.owned.includes('effect-sacred-geometry'));
  assert.equal(merged.equipped.avatar, 'eclipse-wyrm');
  assert.equal(merged.equipped.frame, 'frame-stone-torii');
  assert.equal(countEquippedLoadout(merged.equipped, uid), 2);

  const list = buildOwnedCosmeticItemsList(merged.owned, { uid, equipped: merged.equipped });
  assert.equal(filterLockerItemsByCategory(list, 'avatar').length, 2);
  assert.equal(filterLockerItemsByCategory(list, 'frame').length, 1);
  assert.equal(filterLockerItemsByCategory(list, 'banner').length, 1);
  assert.equal(filterLockerItemsByCategory(list, 'nameplate').length, 1);
  assert.equal(filterLockerItemsByCategory(list, 'effect').length, 1);
  assert.equal(filterLockerItemsByCategory(list, 'all').length, 6);
});

test('POST /api/store/purchase writes to canonical inventory and immediately shows up in GET /api/inventory alongside starter avatar', async () => {
  const store = new InMemoryFirestoreStore();
  const uid = 'uid_store_buyer';
  const starterKey = getStarterAvatarForUser(uid).key;

  store.seed(`users/${uid}`, { uid, username: 'buyer', kobans: 5000 });
  store.seed(`wallets/${uid}`, { balance: 5000, owned: [], equipped: {} });

  const buyResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/store/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'buy_test_1',
      },
      body: JSON.stringify({ itemIds: ['frame-topper-burst'] }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });

  assert.equal(buyResp.status, 200);
  const buyBody = (await buyResp.json()) as any;
  assert.equal(buyBody.ok, true);
  assert.ok(buyBody.owned.includes('frame-topper-burst'));
  assert.ok(buyBody.owned.includes(starterKey));

  const invResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory', { method: 'GET' }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });
  assert.equal(invResp.status, 200);
  const invBody = (await invResp.json()) as any;
  assert.ok(invBody.owned.includes('frame-topper-burst'));
  assert.ok(invBody.owned.includes(starterKey));
  assert.equal(invBody.equipped.avatar, starterKey);
  assert.equal(invBody.equippedCount, 1);
});

test('POST /api/inventory/equip enforces ownership, supports equip + unequip, and mirrors to wallets, inventory, users, and publicProfiles', async () => {
  const store = new InMemoryFirestoreStore();
  const uid = 'uid_equipper';
  const starterKey = getStarterAvatarForUser(uid).key;

  store.seed(`users/${uid}`, { uid, username: 'equipper', kobans: 0 });
  store.seed(`wallets/${uid}`, {
    balance: 0,
    owned: [starterKey, 'pfp_pixel_pop_arcade', 'frame-topper-burst'],
    equipped: {
      avatar: starterKey,
      frame: null,
      banner: null,
      nameplate: null,
      effect: null,
    },
  });

  // 1. Reject equipping unowned item with 403
  const forbiddenResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'frame', itemId: 'frame-dragon-scale-halo' }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });
  assert.equal(forbiddenResp.status, 403);

  // 2. Equip owned avatar + frame
  const equipResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: { avatar: 'pfp_pixel_pop_arcade', frame: 'frame-topper-burst' },
      }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });
  assert.equal(equipResp.status, 200);
  const equipBody = (await equipResp.json()) as any;
  assert.equal(equipBody.equipped.avatar, 'pfp_pixel_pop_arcade');
  assert.equal(equipBody.equipped.frame, 'frame-topper-burst');
  assert.equal(equipBody.equippedCount, 2);
  assert.equal(store.read(`publicProfiles/${uid}`)?.equippedFrame, 'frame-topper-burst');
  assert.equal(store.read(`users/${uid}`)?.equippedAvatar, 'pfp_pixel_pop_arcade');

  // 3. Unequip frame and unequip avatar (resets avatar to starterKey)
  const unequipResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: { avatar: null, frame: null },
      }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uid),
  });
  assert.equal(unequipResp.status, 200);
  const unequipBody = (await unequipResp.json()) as any;
  assert.equal(unequipBody.equipped.avatar, starterKey);
  assert.equal(unequipBody.equipped.frame, null);
  assert.equal(unequipBody.equippedCount, 1);
  assert.equal(store.read(`publicProfiles/${uid}`)?.equipped?.frame, null);
  assert.equal(store.read(`users/${uid}`)?.equippedFrame, null);
});

test('GET /api/inventory rejects unauthenticated and guest callers cleanly', async () => {
  const store = new InMemoryFirestoreStore();
  const unauthResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory', { method: 'GET' }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: async () => null,
  });
  assert.equal(unauthResp.status, 401);

  const guestResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/inventory', { method: 'GET' }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller('guest_abc123'),
  });
  assert.equal(guestResp.status, 403);
});

test('POST /api/admin/backfill-starter-inventory is Superadmin-only, idempotent, and preserves balances/plans', async () => {
  const store = new InMemoryFirestoreStore();
  const uidA = 'uid_user_alpha';
  const uidB = 'uid_user_beta';
  const starterA = getStarterAvatarForUser(uidA).key;
  const starterB = getStarterAvatarForUser(uidB).key;

  store.seed(`users/${uidA}`, { uid: uidA, username: 'alpha', plan: 'plus', kobans: 420 });
  store.seed(`wallets/${uidA}`, { balance: 420, owned: [], equipped: {} });
  store.seed(`users/${uidB}`, {
    uid: uidB,
    username: 'beta',
    plan: 'free',
    kobans: 10,
    equippedFrame: 'frame-topper-burst',
  });

  // Non-superadmin denied
  const deniedResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/admin/backfill-starter-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller(uidA, { superAdmin: false }),
  });
  assert.equal(deniedResp.status, 403);

  // Dry run reports 2 updates without writing
  const dryResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/admin/backfill-starter-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller('uid_superadmin', { superAdmin: true }),
  });
  assert.equal(dryResp.status, 200);
  const dryBody = (await dryResp.json()) as any;
  assert.equal(dryBody.dryRun, true);
  assert.equal(dryBody.scanned, 2);
  assert.equal(dryBody.needsBackfillCount, 2);
  assert.equal(dryBody.updatedCount, 0);
  assert.deepEqual(store.read(`wallets/${uidA}`)?.owned, []);

  // Apply run updates both and preserves balance + plan
  const applyResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/admin/backfill-starter-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller('uid_superadmin', { superAdmin: true }),
  });
  assert.equal(applyResp.status, 200);
  const applyBody = (await applyResp.json()) as any;
  assert.equal(applyBody.updatedCount, 2);
  assert.ok(store.read(`wallets/${uidA}`)?.owned.includes(starterA));
  assert.equal(store.read(`wallets/${uidA}`)?.balance, 420);
  assert.equal(store.read(`users/${uidA}`)?.plan, 'plus');
  assert.ok(store.read(`wallets/${uidB}`)?.owned.includes(starterB));
  assert.ok(store.read(`wallets/${uidB}`)?.owned.includes('frame-topper-burst'));

  // Second apply run is a no-op (idempotent)
  const secondResp = await handleEconomyApiRequest({
    request: new Request('https://boardly.cfd/api/admin/backfill-starter-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false }),
    }),
    env: {},
    storeOverride: store,
    tokenVerifierOverride: makeAuthCaller('uid_superadmin', { superAdmin: true }),
  });
  assert.equal(secondResp.status, 200);
  const secondBody = (await secondResp.json()) as any;
  assert.equal(secondBody.updatedCount, 0);
});

test('firestore.rules keeps wallets.owned and inventory collections server/admin-written only', () => {
  const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  assert.match(rulesText, /match \/wallets\/\{userId\}/);
  assert.match(
    rulesText,
    /\(!\('owned' in request\.resource\.data\) \|\| request\.resource\.data\.owned\.size\(\) == 0\)/
  );
  assert.match(
    rulesText,
    /request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['equipped', 'updatedAt'\]\)/
  );
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});
