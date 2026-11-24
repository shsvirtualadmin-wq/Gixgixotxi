import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { handleAuthApiRequest } from '../../functions/api/auth/[[path]]';
import { InMemoryD1Database } from '../../functions/_utils/firestoreRestAdmin';
import {
  clearOptimisticUserSnapshot,
  readOptimisticUserSnapshot,
  writeOptimisticUserSnapshot,
} from '../lib/swrCache';
import { getHomeUrl, getSessionStatus, isUserAuthenticated } from '../utils/homeUrl';

class MockWebStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

function installMockStorage() {
  const ls = new MockWebStorage();
  const ss = new MockWebStorage();
  (globalThis as any).window = {
    localStorage: ls,
    sessionStorage: ss,
    location: { pathname: '/dashboard', href: 'https://boardly.cfd/dashboard' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
  (globalThis as any).localStorage = ls;
  (globalThis as any).sessionStorage = ss;
  return { ls, ss };
}

test('optimistic user snapshot strips Student placeholder, preserves teacher role, and blocks admin localStorage escalation', () => {
  const { ls } = installMockStorage();

  writeOptimisticUserSnapshot({
    uid: 'uid_teacher_1',
    email: 'teacher@boardly.cfd',
    displayName: 'Student',
    username: 'prof_zain',
    role: 'teacher',
    customRole: 'Teacher',
    plan: 'pro',
    isGuest: false,
  });

  const snap1 = readOptimisticUserSnapshot();
  assert.ok(snap1, 'Snapshot should be readable');
  assert.equal(snap1.displayName, null, 'Student placeholder displayName must be stripped to null');
  assert.equal(snap1.role, 'teacher', 'Teacher role should be preserved');
  assert.equal(snap1.customRole, 'Teacher');

  // Tamper localStorage to attempt admin privilege escalation
  const raw = JSON.parse(ls.getItem('boardly_last_known_user_v1') || '{}');
  raw.role = 'superadmin';
  raw.displayName = 'Zain Ali';
  ls.setItem('boardly_last_known_user_v1', JSON.stringify(raw));

  const snap2 = readOptimisticUserSnapshot();
  assert.ok(snap2);
  assert.equal(snap2.role, 'student', 'Tampered admin/superadmin role in localStorage must fail closed');
  assert.equal(snap2.displayName, 'Zain Ali', 'Real displayName should be returned');

  clearOptimisticUserSnapshot();
  ls.removeItem('boardly_user_authenticated');
  assert.equal(readOptimisticUserSnapshot(), null);
});

test('tri-state authStatus separates loading from unauthenticated and authenticated', () => {
  const { ls } = installMockStorage();

  // Unset localStorage and null user during startup loading must remain 'loading'
  assert.equal(getSessionStatus(null, true, 'loading'), 'loading');
  assert.equal(getSessionStatus(null, false, 'loading'), 'loading');
  assert.equal(getSessionStatus(null, false, 'unauthenticated'), 'unauthenticated');
  assert.equal(isUserAuthenticated(null, false, 'unauthenticated'), false);
  assert.equal(getHomeUrl(null, false, 'unauthenticated'), '/');

  // Authenticated state resolves cleanly to /dashboard/commons
  assert.equal(getSessionStatus({ uid: 'u1' }, false, 'authenticated'), 'authenticated');
  assert.equal(isUserAuthenticated({ uid: 'u1' }, false, 'authenticated'), true);
  assert.equal(getHomeUrl({ uid: 'u1' }, false, 'authenticated'), '/dashboard/commons');

  // Saved auth flag bridges synchronous render before Firebase emits
  ls.setItem('boardly_user_authenticated', 'true');
  assert.equal(isUserAuthenticated(null, true, 'loading'), true);
});

test('GET /api/auth/me returns real user profile from D1 when authenticated and { authenticated: false } when anonymous', async () => {
  const db = new InMemoryD1Database();
  (db as any).saveToDisk = () => {};
  const env = {
    DB: db,
    OTP_HMAC_SECRET: 'test-worker-hmac-secret-key-2026',
    TOTP_ENCRYPTION_KEY: 'test-worker-totp-aes-gcm-secret-key-2026',
  };

  const now = Date.now();
  await db
    .prepare(
      `INSERT OR REPLACE INTO user_usernames (username_lower, username_display, uid, account_type, email, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(
      'hydration_user_1',
      'hydration_user_1',
      'uid_hydration_test_1',
      'registered',
      'hamza@boardly.cfd',
      now,
      now
    )
    .run();

  await db
    .prepare(
      `UPDATE user_usernames
       SET display_name = ?1, avatar = ?2, frame = ?3, role = ?4, custom_role = ?5, bio = ?6, status = ?7, accent = ?8, updated_at = ?9
       WHERE uid = ?10`
    )
    .bind('Hamza Tariq', 'avatar-1', null, 'superadmin', 'Superadmin', '', 'active', '', now, 'uid_hydration_test_1')
    .run();

  const anonRes = await handleAuthApiRequest({
    request: new Request('https://boardly.cfd/api/auth/me', { method: 'GET' }),
    env,
    nowMsOverride: now,
  });
  assert.equal(anonRes.status, 200);
  const anonJson = (await anonRes.json()) as any;
  assert.equal(anonJson.authenticated, false);
  assert.equal(anonJson.user, null);

  const authRes = await handleAuthApiRequest({
    request: new Request('https://boardly.cfd/api/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer fake-valid-token' },
    }),
    env,
    nowMsOverride: now,
    tokenVerifierOverride: async () => ({
      uid: 'uid_hydration_test_1',
      email: 'hamza@boardly.cfd',
      email_verified: true,
      name: 'Hamza Tariq',
    }),
  });
  assert.equal(authRes.status, 200);
  const authJson = (await authRes.json()) as any;
  assert.equal(authJson.authenticated, true);
  assert.equal(authJson.user.uid, 'uid_hydration_test_1');
  assert.equal(authJson.user.username, 'hydration_user_1');
  assert.equal(authJson.user.display_name, 'Hamza Tariq');
  assert.equal(authJson.user.customRole, 'Superadmin');
});

test('BoardlySettingsFlow Account avatar keeps pure CSS/size styling without ResizeObserver/ref JS hacks', () => {
  const filePath = path.resolve(process.cwd(), 'src/components/settings/BoardlySettingsFlow.tsx');
  const src = fs.readFileSync(filePath, 'utf8');

  assert.equal(src.includes('ResizeObserver'), false, 'Account avatar must not use JS ResizeObserver');
  assert.equal(src.includes('accountAvatarWrapRef'), false, 'Account avatar must not use accountAvatarWrapRef');
  assert.equal(src.includes('accountAvatarPx'), false, 'Account avatar must not use JS px state');
  assert.ok(src.includes('clamp(100px,27vw,116px)'), 'Account avatar must keep pure CSS clamp sizing');
  assert.ok(src.includes('-right-[2px] -bottom-[2px]'), 'Pencil badge must stay anchored at -2px');
  assert.ok(src.includes('h-10 w-10'), 'Pencil badge must stay 40px');
});
