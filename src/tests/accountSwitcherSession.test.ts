import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAuthApiRequest } from '../../functions/api/auth/[[path]]';
import { InMemoryD1Database } from '../../functions/_utils/firestoreRestAdmin';
import {
  buildAddAccountUrl,
  getAddAccountPrefillEmail,
  getAddAccountReason,
  getSavedAccounts,
  removeSavedAccount,
  upsertSavedAccount,
} from '../utils/savedAccounts';
import { formatPlanLabel } from '../lib/planTier';

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

/**
 * Simple cookie jar simulating browser HttpOnly cookie persistence across requests.
 */
class CookieJar {
  private cookies = new Map<string, string>();

  applySetCookie(res: Response): string | null {
    const sc = res.headers.get('Set-Cookie');
    if (!sc) return null;
    const firstPair = sc.split(';')[0];
    const eq = firstPair.indexOf('=');
    if (eq === -1) return sc;
    const name = firstPair.slice(0, eq).trim();
    const val = firstPair.slice(eq + 1).trim();
    if (/Max-Age=0/i.test(sc) || val === '') {
      this.cookies.delete(name);
    } else {
      this.cookies.set(name, val);
    }
    return sc;
  }

  toHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  has(name: string): boolean {
    return this.cookies.has(name);
  }
}

function makeRoleVerifier(users: Record<string, { email: string; role: string }>) {
  return async (authHeader: string | null | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const uid = authHeader.slice('Bearer '.length).trim();
    const info = users[uid];
    if (!info) return null;
    return {
      uid,
      email: info.email,
      emailVerified: true,
      name: uid,
      authTime: Math.floor(Date.now() / 1000) - 60,
      iat: Math.floor(Date.now() / 1000) - 60,
      signInProvider: 'password',
      superAdmin: info.role === 'super_admin',
      isSuperAdmin: info.role === 'super_admin',
      admin: info.role === 'admin' || info.role === 'super_admin',
    };
  };
}

function resolveRoleRedirect(role: string): string {
  const clean = role.toLowerCase();
  if (clean === 'super_admin' || clean === 'superadmin') return '/superadmin';
  if (clean === 'admin') return '/admin';
  return '/dashboard';
}

const TEST_USERS = {
  uid_admin: { email: 'admin@boardly.cfd', role: 'admin' },
  uid_student1: { email: 'amina@boardly.cfd', role: 'student' },
  uid_student2: { email: 'bilal@boardly.cfd', role: 'student' },
};

async function seedUsersInD1(db: InMemoryD1Database, nowMs: number) {
  for (const [uid, info] of Object.entries(TEST_USERS)) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO user_usernames (uid, username_normalized, username_display, email, display_name, role, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(uid, uid, uid, info.email, uid, info.role, nowMs, nowMs)
      .run();
    if (info.role === 'admin' || info.role === 'super_admin') {
      await db
        .prepare(
          `INSERT OR REPLACE INTO user_roles (uid, email, role, updated_at) VALUES (?1, ?2, ?3, ?4)`
        )
        .bind(uid, info.email, info.role, nowMs)
        .run();
    }
    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, 1, ?3, ?4, ?5)`
      )
      .bind(uid, `hash_${uid}`, Math.floor(nowMs / 1000), nowMs, nowMs)
      .run();
  }
}

async function callAuth(params: {
  db: InMemoryD1Database;
  jar: CookieJar;
  path: string;
  method?: 'GET' | 'POST';
  bearerUid?: string;
  body?: Record<string, unknown>;
  nowMs: number;
  origin?: string;
  omitCsrfHeader?: boolean;
  storeGetDoc?: (docPath: string) => Promise<Record<string, any> | null>;
  customTokenMinterOverride?: (uid: string, nowMs: number) => Promise<string | null>;
}) {
  const method = params.method || 'POST';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Host: 'boardly.cfd',
  };
  if (!params.omitCsrfHeader) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  if (params.origin) {
    headers.Origin = params.origin;
  }
  if (params.bearerUid) {
    headers.Authorization = `Bearer ${params.bearerUid}`;
  }
  const cookieHeader = params.jar.toHeader();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const req = new Request(`https://boardly.cfd${params.path}`, {
    method,
    headers,
    ...(method !== 'GET' ? { body: JSON.stringify(params.body ?? {}) } : {}),
  });

  const res = await handleAuthApiRequest({
    request: req,
    env: { OTP_HMAC_SECRET: 'test-unit-secret-key-for-account-switch-tests' },
    dbOverride: params.db,
    ...(params.storeGetDoc ? { storeOverride: { getDoc: params.storeGetDoc } } : {}),
    tokenVerifierOverride: makeRoleVerifier(TEST_USERS),
    customTokenMinterOverride:
      params.customTokenMinterOverride ??
      (async (uid, nowMs) => `mock_custom_token.${uid}.${nowMs}`),
    nowMsOverride: params.nowMs,
  });

  const setCookie = params.jar.applySetCookie(res);
  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, json, setCookie, headers: res.headers };
}

test('(a) Switch from Admin to Student and back to Admin instantly with NO password prompt', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const storage = createMemoryStorage();
  const t0 = Date.UTC(2026, 10, 24, 10, 0, 0);
  await seedUsersInD1(db, t0);

  // 1. Admin logs in -> registers switch session in HttpOnly vault
  const regAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_admin',
    nowMs: t0,
    origin: 'https://boardly.cfd',
  });
  assert.equal(regAdmin.status, 200);
  assert.equal(regAdmin.json.ok, true);
  assert.ok(regAdmin.json.sessionId);
  assert.equal(regAdmin.json.switchToken, undefined, 'Raw switch token must NEVER be exposed in JSON');
  assert.ok(regAdmin.setCookie?.includes('HttpOnly'), 'Vault cookie must be HttpOnly');
  assert.ok(regAdmin.setCookie?.includes('Secure'), 'Vault cookie must be Secure on HTTPS');
  assert.ok(regAdmin.setCookie?.includes('SameSite=None'), 'Vault cookie must use SameSite=None on HTTPS');
  assert.ok(regAdmin.setCookie?.includes('Partitioned'), 'Vault cookie must be Partitioned on HTTPS');
  assert.notEqual(
    regAdmin.headers.get('Access-Control-Allow-Origin'),
    '*',
    'Never emit wildcard CORS on credentialed switch-session routes'
  );

  upsertSavedAccount(
    {
      uid: 'uid_admin',
      email: 'admin@boardly.cfd',
      displayName: 'Admin User',
      role: 'admin',
      sessionId: regAdmin.json.sessionId,
      sessionExpiresAt: regAdmin.json.expiresAt,
    },
    storage
  );

  // 2. Add Student account -> registers Student's own session WITHOUT overwriting Admin's session
  const regStudent1 = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_student1',
    nowMs: t0 + 10_000,
    origin: 'https://boardly.cfd',
  });
  assert.equal(regStudent1.status, 200);
  upsertSavedAccount(
    {
      uid: 'uid_student1',
      email: 'amina@boardly.cfd',
      displayName: 'Amina',
      role: 'student',
      sessionId: regStudent1.json.sessionId,
      sessionExpiresAt: regStudent1.json.expiresAt,
    },
    storage
  );

  // Confirm D1 stores ONLY hashed tokens (never plaintext or password)
  const adminSessionRow = db.tables.device_account_sessions.get(regAdmin.json.sessionId);
  const studentSessionRow = db.tables.device_account_sessions.get(regStudent1.json.sessionId);
  assert.ok(adminSessionRow && studentSessionRow, 'Both accounts must have independent D1 session rows');
  for (const row of [adminSessionRow, studentSessionRow]) {
    assert.match(row.token_hash, /^[a-f0-9]{64}$/, 'Server stores only 64-char HMAC-SHA256 hex digest');
    assert.equal((row as any).password, undefined);
  }

  // 3. Currently on Student -> tap Admin -> switches directly to Admin (/admin), NO password!
  const switchToAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin', sessionId: regAdmin.json.sessionId },
    nowMs: t0 + 20_000,
    origin: 'https://boardly.cfd',
  });
  assert.equal(switchToAdmin.status, 200);
  assert.equal(switchToAdmin.json.ok, true);
  assert.equal(switchToAdmin.json.uid, 'uid_admin');
  assert.equal(switchToAdmin.json.role, 'admin');
  assert.equal(switchToAdmin.json.customToken, `mock_custom_token.uid_admin.${t0 + 20_000}`);
  assert.equal(resolveRoleRedirect(switchToAdmin.json.role), '/admin');

  // 4. Switch back from Admin -> Student (/dashboard) with NO password!
  const switchToStudent = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_student1', sessionId: regStudent1.json.sessionId },
    nowMs: t0 + 30_000,
    origin: 'https://boardly.cfd',
  });
  assert.equal(switchToStudent.status, 200);
  assert.equal(switchToStudent.json.uid, 'uid_student1');
  assert.equal(switchToStudent.json.role, 'student');
  assert.equal(switchToStudent.json.customToken, `mock_custom_token.uid_student1.${t0 + 30_000}`);
  assert.equal(resolveRoleRedirect(switchToStudent.json.role), '/dashboard');
});

test('(b) Add a third account and switch freely between all three accounts without invalidating any session', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const t0 = Date.UTC(2026, 10, 24, 11, 0, 0);
  await seedUsersInD1(db, t0);

  // Register all 3 accounts independently
  for (const uid of ['uid_admin', 'uid_student1', 'uid_student2'] as const) {
    const reg = await callAuth({
      db,
      jar,
      path: '/api/auth/switch-session/register',
      bearerUid: uid,
      nowMs: t0,
    });
    assert.equal(reg.status, 200);
  }

  // Round-robin switch across all 3 accounts twice (verifies token rotation never breaks other accounts)
  const sequence: Array<{ uid: string; expectedRoute: string }> = [
    { uid: 'uid_admin', expectedRoute: '/admin' },
    { uid: 'uid_student2', expectedRoute: '/dashboard' },
    { uid: 'uid_student1', expectedRoute: '/dashboard' },
    { uid: 'uid_admin', expectedRoute: '/admin' },
    { uid: 'uid_student2', expectedRoute: '/dashboard' },
  ];

  let step = 1;
  for (const target of sequence) {
    const res = await callAuth({
      db,
      jar,
      path: '/api/auth/switch-session/exchange',
      body: { uid: target.uid },
      nowMs: t0 + step * 5_000,
    });
    assert.equal(res.status, 200, `Switch #${step} to ${target.uid} should succeed`);
    assert.equal(res.json.uid, target.uid);
    assert.equal(resolveRoleRedirect(res.json.role), target.expectedRoute);
    step++;
  }
});

test('(c) Logging out of ONE account removes & revokes ONLY that account while the others stay saved and switchable', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const storage = createMemoryStorage();
  const t0 = Date.UTC(2026, 10, 24, 12, 0, 0);
  await seedUsersInD1(db, t0);

  // Save & register 3 accounts
  for (const uid of ['uid_admin', 'uid_student1', 'uid_student2'] as const) {
    const reg = await callAuth({
      db,
      jar,
      path: '/api/auth/switch-session/register',
      bearerUid: uid,
      nowMs: t0,
    });
    assert.equal(reg.status, 200);
    upsertSavedAccount(
      {
        uid,
        email: TEST_USERS[uid].email,
        displayName: uid,
        role: TEST_USERS[uid].role,
        sessionId: reg.json.sessionId,
        sessionExpiresAt: reg.json.expiresAt,
      },
      storage
    );
  }

  // Log out of uid_student1 ONLY
  removeSavedAccount('uid_student1', storage);
  const revokeRes = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/revoke',
    bearerUid: 'uid_student1',
    body: { uid: 'uid_student1' },
    nowMs: t0 + 10_000,
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.json.revokedUid, 'uid_student1');
  assert.equal(revokeRes.json.remainingCount, 2);

  // Confirm local saved-accounts list kept Admin + Student 2, removed Student 1
  const remaining = getSavedAccounts(storage);
  assert.equal(remaining.length, 2);
  assert.ok(!remaining.some((a) => a.uid === 'uid_student1'));
  assert.ok(remaining.some((a) => a.uid === 'uid_admin'));
  assert.ok(remaining.some((a) => a.uid === 'uid_student2'));

  // Trying to switch to logged-out uid_student1 fails with 401 SWITCH_SESSION_EXPIRED
  const replayLoggedOut = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_student1' },
    nowMs: t0 + 15_000,
  });
  assert.equal(replayLoggedOut.status, 401);
  assert.equal(replayLoggedOut.json.code, 'SWITCH_SESSION_EXPIRED');

  // Both uid_admin and uid_student2 still switch instantly with NO password!
  const switchAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin' },
    nowMs: t0 + 20_000,
  });
  assert.equal(switchAdmin.status, 200);
  assert.equal(switchAdmin.json.uid, 'uid_admin');

  const switchStudent2 = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_student2' },
    nowMs: t0 + 25_000,
  });
  assert.equal(switchStudent2.status, 200);
  assert.equal(switchStudent2.json.uid, 'uid_student2');
});

test('(d) Expired saved session returns 401, prompts re-sign-in with prefilled email & notice, and preserves other valid sessions', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const t0 = Date.UTC(2026, 10, 24, 13, 0, 0);
  await seedUsersInD1(db, t0);

  // Register Admin and Student 1
  const regAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_admin',
    nowMs: t0,
  });
  assert.equal(regAdmin.status, 200);

  const regStudent1 = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_student1',
    nowMs: t0,
  });
  assert.equal(regStudent1.status, 200);

  // Force ONLY uid_student1's server session to be expired (past 30 days), while uid_admin stays valid
  const studentRow = db.tables.device_account_sessions.get(regStudent1.json.sessionId);
  assert.ok(studentRow);
  studentRow!.expires_at = t0 - 1000;

  // Attempt to switch to expired uid_student1 -> 401 with exact user-facing message
  const expiredRes = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_student1' },
    nowMs: t0 + 5_000,
  });
  assert.equal(expiredRes.status, 401);
  assert.equal(expiredRes.json.code, 'SWITCH_SESSION_EXPIRED');
  assert.equal(expiredRes.json.error, 'Session expired, please sign in again.');

  // Verify the fallback URL prefills email and attaches reason=session_expired
  const fallbackUrl = buildAddAccountUrl({
    email: 'amina@boardly.cfd',
    returnTo: '/settings',
    reason: 'session_expired',
  });
  const search = fallbackUrl.slice(fallbackUrl.indexOf('?'));
  assert.equal(getAddAccountPrefillEmail(search), 'amina@boardly.cfd');
  assert.equal(getAddAccountReason(search), 'session_expired');

  // Admin's session in the same vault cookie is STILL valid and switches cleanly!
  const adminStillValid = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin' },
    nowMs: t0 + 10_000,
  });
  assert.equal(adminStillValid.status, 200);
  assert.equal(adminStillValid.json.uid, 'uid_admin');
});

test('(e) Security: CSRF cross-origin POST without header is rejected with 403', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const t0 = Date.UTC(2026, 10, 24, 14, 0, 0);
  await seedUsersInD1(db, t0);

  const csrfBlocked = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin' },
    nowMs: t0,
    origin: 'https://evil.example.com',
    omitCsrfHeader: true,
  });
  assert.equal(csrfBlocked.status, 403);
  assert.equal(csrfBlocked.json.code, 'CSRF_REJECTED');
});

test('(f) Live saved-accounts plan refresh resolves Admin with Plus as Boardly Plus (never stale Boardly Pro)', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const storage = createMemoryStorage();
  const t0 = Date.UTC(2026, 10, 24, 15, 0, 0);
  await seedUsersInD1(db, t0);

  // Simulate legacy stale localStorage entry that had "Boardly Pro" saved previously
  storage.setItem(
    'boardly_saved_accounts_v1',
    JSON.stringify([
      {
        uid: 'uid_admin',
        email: 'shsvirtualadmin@gmail.com',
        displayName: 'Admin',
        role: 'super_admin',
        planLabel: 'Boardly Pro',
        lastUsedAt: t0 - 60_000,
      },
    ])
  );

  // Reading saved accounts must strip stale planLabel so "Boardly Pro" never leaks from localStorage
  const sanitized = getSavedAccounts(storage);
  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].planLabel, undefined);

  // Upserting must also never persist planLabel into localStorage
  upsertSavedAccount(
    {
      uid: 'uid_admin',
      email: 'shsvirtualadmin@gmail.com',
      displayName: 'Admin',
      planLabel: 'Boardly Pro',
    },
    storage
  );
  const afterUpsert = getSavedAccounts(storage);
  assert.equal(afterUpsert[0].planLabel, undefined);

  // Register both admin and student into HttpOnly vault
  for (const uid of ['uid_admin', 'uid_student1'] as const) {
    const reg = await callAuth({
      db,
      jar,
      path: '/api/auth/switch-session/register',
      bearerUid: uid,
      nowMs: t0,
    });
    assert.equal(reg.status, 200);
  }

  // Live Firestore records: admin has Boardly Plus, student has Boardly Plus
  const mockDocs: Record<string, Record<string, any>> = {
    'users/uid_admin': {
      uid: 'uid_admin',
      email: 'shsvirtualadmin@gmail.com',
      displayName: 'SHS Admin',
      role: 'super_admin',
      plan: 'plus',
      isPlus: true,
    },
    'users/uid_student1': {
      uid: 'uid_student1',
      email: 'amina@boardly.cfd',
      displayName: 'Amina',
      role: 'student',
      plan: 'plus',
      isPlus: true,
    },
  };

  const accountsRes = await callAuth({
    db,
    jar,
    method: 'GET',
    path: '/api/auth/switch-session/accounts',
    bearerUid: 'uid_student1',
    nowMs: t0 + 5_000,
    storeGetDoc: async (docPath) => mockDocs[docPath] ?? null,
  });

  assert.equal(accountsRes.status, 200);
  assert.equal(accountsRes.json.ok, true);
  const adminAccount = accountsRes.json.accounts.find((a: any) => a.uid === 'uid_admin');
  const studentAccount = accountsRes.json.accounts.find((a: any) => a.uid === 'uid_student1');
  assert.ok(adminAccount);
  assert.ok(studentAccount);
  assert.equal(adminAccount.sessionStatus, 'active');
  assert.equal(adminAccount.planTier, 'plus');
  assert.equal(formatPlanLabel(adminAccount.planTier), 'Boardly Plus');
  assert.equal(studentAccount.planTier, 'plus');
  assert.equal(formatPlanLabel(studentAccount.planTier), 'Boardly Plus');

  // Exchange also returns canonical live planTier ('plus')
  const exchangeRes = await callAuth({
    db,
    jar,
    method: 'POST',
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin' },
    nowMs: t0 + 10_000,
    storeGetDoc: async (docPath) => mockDocs[docPath] ?? null,
  });
  assert.equal(exchangeRes.status, 200);
  assert.equal(exchangeRes.json.planTier, 'plus');
  assert.equal(formatPlanLabel(exchangeRes.json.planTier), 'Boardly Plus');
});

test('(g) Per-account error and expiry isolation in GET /api/auth/switch-session/accounts never fails the whole list', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const t0 = Date.UTC(2026, 10, 24, 16, 0, 0);
  await seedUsersInD1(db, t0);

  const regAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_admin',
    nowMs: t0,
  });
  const regStudent1 = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_student1',
    nowMs: t0,
  });
  const regStudent2 = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_student2',
    nowMs: t0,
  });
  assert.equal(regAdmin.status, 200);
  assert.equal(regStudent1.status, 200);
  assert.equal(regStudent2.status, 200);

  // Expire ONLY uid_student2
  const student2Row = db.tables.device_account_sessions.get(regStudent2.json.sessionId);
  assert.ok(student2Row);
  student2Row!.expires_at = t0 - 1000;

  // Simulate Firestore failure ONLY for uid_admin while uid_student1 succeeds
  const accountsRes = await callAuth({
    db,
    jar,
    method: 'GET',
    path: '/api/auth/switch-session/accounts',
    bearerUid: 'uid_student1',
    nowMs: t0 + 5_000,
    storeGetDoc: async (docPath) => {
      if (docPath === 'users/uid_admin') {
        throw new Error('Firestore permission denied for test');
      }
      if (docPath === 'users/uid_student1') {
        return { uid: 'uid_student1', email: 'amina@boardly.cfd', plan: 'plus', isPlus: true };
      }
      return null;
    },
  });

  assert.equal(accountsRes.status, 200);
  assert.equal(accountsRes.json.ok, true);
  const byUid = Object.fromEntries(accountsRes.json.accounts.map((a: any) => [a.uid, a]));
  assert.equal(byUid.uid_student1.sessionStatus, 'active');
  assert.equal(byUid.uid_student1.planTier, 'plus');
  assert.equal(byUid.uid_admin.sessionStatus, 'error');
  assert.equal(byUid.uid_student2.sessionStatus, 'expired');
});

test('(h) Genuine switch failure returns 503 SWITCH_UNAVAILABLE (not misclassified as expired) and GET accounts blocks cross-origin CSRF', async () => {
  const db = new InMemoryD1Database();
  const jar = new CookieJar();
  const t0 = Date.UTC(2026, 10, 24, 17, 0, 0);
  await seedUsersInD1(db, t0);

  const regAdmin = await callAuth({
    db,
    jar,
    path: '/api/auth/switch-session/register',
    bearerUid: 'uid_admin',
    nowMs: t0,
  });
  assert.equal(regAdmin.status, 200);

  // Simulate genuine server failure (custom token minter unavailable -> 503)
  const failedSwitch = await callAuth({
    db,
    jar,
    method: 'POST',
    path: '/api/auth/switch-session/exchange',
    body: { uid: 'uid_admin' },
    nowMs: t0 + 5_000,
    customTokenMinterOverride: async () => null,
  });
  assert.equal(failedSwitch.status, 503);
  assert.equal(failedSwitch.json.code, 'SWITCH_UNAVAILABLE');
  assert.notEqual(failedSwitch.json.code, 'SWITCH_SESSION_EXPIRED');

  // Cross-origin CSRF without X-Requested-With on GET /switch-session/accounts is rejected with 403
  const csrfGetBlocked = await callAuth({
    db,
    jar,
    method: 'GET',
    path: '/api/auth/switch-session/accounts',
    nowMs: t0 + 6_000,
    origin: 'https://evil.example.com',
    omitCsrfHeader: true,
  });
  assert.equal(csrfGetBlocked.status, 403);
  assert.equal(csrfGetBlocked.json.code, 'CSRF_REJECTED');
});
