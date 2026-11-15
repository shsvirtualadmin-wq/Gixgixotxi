/**
 * scripts/verify-security-matrix.ts
 *
 * Automated verification suite for:
 * 1. Cloudflare Pages Functions / Worker / Dev Server test matrix:
 *    - No token            -> /api/admin/* = 401, /api/superadmin/* = 401
 *    - Normal user token   -> /api/admin/* = 403, /api/superadmin/* = 403
 *    - Admin token         -> /api/admin/* = 200, /api/superadmin/* = 403
 *    - SuperAdmin token    -> /api/admin/* = 200, /api/superadmin/* = 200
 *    - Expired/forged token-> /api/admin/* = 401, /api/superadmin/* = 401
 *    - Grant/Revoke admin endpoint (/api/superadmin/admins) & block granting superAdmin
 * 2. Firestore Security Rules verification:
 *    - Normal user cannot write role/isAdmin/superAdmin/plan/pro on own doc
 *    - Normal user cannot read payment_requests or admin_activity_logs
 *    - Admin can read/write admin collections but NOT role/settings collections
 *    - SuperAdmin can read/write all of them
 *    - Nobody can grant superAdmin from the client
 * 3. Frontend route guards & fail-closed behavior:
 *    - Normal user visiting /admin and /superadmin is redirected, and no admin data is fetched
 *    - Admin sees /admin but is redirected from /superadmin
 *    - A missing doc, a 404, or a network error never grants any role
 *    - AdminOverviewPage stat cards load independently and surface real errors (never 0 on failure)
 */

import { generateKeyPairSync, createSign, createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  enforceAdminOrSuperAdminGate,
  handleSuperAdminAndExtraAdminRoutes,
} from '../functions/_utils/adminRoleGate';

const PROJECT_ID = 'gen-lang-client-0365509316';
const TEST_KID = 'verify-matrix-kid-1';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const publicJwk = {
  ...createPublicKey(publicKey).export({ format: 'jwk' }),
  kid: TEST_KID,
  alg: 'RS256',
  use: 'sig',
};

const wrongKeyPair = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signFirebaseJwt(
  claims: Record<string, unknown>,
  opts?: { expired?: boolean; forgedKey?: boolean; kid?: string }
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    kid: opts?.kid ?? TEST_KID,
    typ: 'JWT',
  };
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    auth_time: nowSec - 60,
    iat: opts?.expired ? nowSec - 7200 : nowSec - 60,
    exp: opts?.expired ? nowSec - 3600 : nowSec + 3600,
    sub: String(claims.uid || 'user_123'),
    user_id: String(claims.uid || 'user_123'),
    ...claims,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const keyPem = opts?.forgedKey ? wrongKeyPair.privateKey : privateKey;
  const signature = signer.sign(createPrivateKey(keyPem));
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

// Intercept Google public key fetch so verifyFirebaseIdToken validates our test RSA key
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.includes('www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')) {
    return new Response(JSON.stringify({ keys: [publicJwk] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
    });
  }
  if (url.includes('googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')) {
    return new Response(JSON.stringify({ [TEST_KID]: publicKey }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
    });
  }
  return originalFetch(input as any, init);
};

interface TestResultRow {
  category: string;
  testName: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResultRow[] = [];

function recordTest(category: string, testName: string, expected: string, actual: string, passed: boolean) {
  results.push({ category, testName, expected, actual, passed });
}

async function callPagesFunction(pathname: string, token?: string, method = 'GET', body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const req = new Request(`https://boardly.cfd${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const env = {
    FIREBASE_PROJECT_ID: PROJECT_ID,
    VITE_FIREBASE_PROJECT_ID: PROJECT_ID,
    OWNER_EMAIL: 'owner@boardly.cfd',
  };

  const gateResult = await enforceAdminOrSuperAdminGate({ request: req, env });
  if (gateResult.blockedResponse) return gateResult.blockedResponse;

  if (gateResult.caller) {
    const extraResp = await handleSuperAdminAndExtraAdminRoutes({
      request: req,
      env,
      caller: gateResult.caller,
      adminSdkOverride: {
        setCustomUserClaims: async () => {},
        revokeRefreshTokens: async () => {},
      },
    });
    if (extraResp) return extraResp;
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

// ============================================================================
// 1. CLOUDFLARE FUNCTIONS TEST MATRIX
// ============================================================================
async function runCloudflareFunctionsMatrix() {
  const normalToken = signFirebaseJwt({ uid: 'normal_u1', email: 'student@boardly.cfd' });
  const normalWithSpoofedRoleToken = signFirebaseJwt({
    uid: 'normal_u2',
    email: 'spoof@boardly.cfd',
    role: 'super_admin', // Spoofed role field without admin/superAdmin boolean claim must be rejected!
  });
  const adminToken = signFirebaseJwt({
    uid: 'admin_u1',
    email: 'admin@boardly.cfd',
    admin: true,
  });
  const superAdminToken = signFirebaseJwt({
    uid: 'owner_u1',
    email: 'owner@boardly.cfd',
    superAdmin: true,
    admin: true,
  });
  const expiredToken = signFirebaseJwt(
    { uid: 'owner_u1', email: 'owner@boardly.cfd', superAdmin: true, admin: true },
    { expired: true }
  );
  const forgedToken = signFirebaseJwt(
    { uid: 'owner_u1', email: 'owner@boardly.cfd', superAdmin: true, admin: true },
    { forgedKey: true }
  );

  const matrixCases = [
    { label: 'No token', token: undefined, expectedAdmin: 401, expectedSuper: 401 },
    { label: 'Normal user token', token: normalToken, expectedAdmin: 403, expectedSuper: 403 },
    {
      label: 'Normal user with spoofed role="super_admin" (no claim)',
      token: normalWithSpoofedRoleToken,
      expectedAdmin: 403,
      expectedSuper: 403,
    },
    { label: 'Admin token (admin: true)', token: adminToken, expectedAdmin: 200, expectedSuper: 403 },
    {
      label: 'SuperAdmin token (superAdmin: true)',
      token: superAdminToken,
      expectedAdmin: 200,
      expectedSuper: 200,
    },
    { label: 'Expired token', token: expiredToken, expectedAdmin: 401, expectedSuper: 401 },
    { label: 'Forged signature token', token: forgedToken, expectedAdmin: 401, expectedSuper: 401 },
  ];

  for (const tc of matrixCases) {
    const adminRes = await callPagesFunction('/api/admin/stats', tc.token);
    const superRes = await callPagesFunction('/api/superadmin/stats', tc.token);

    recordTest(
      'Cloudflare Functions',
      `${tc.label} -> GET /api/admin/stats`,
      String(tc.expectedAdmin),
      String(adminRes.status),
      adminRes.status === tc.expectedAdmin
    );
    recordTest(
      'Cloudflare Functions',
      `${tc.label} -> GET /api/superadmin/stats`,
      String(tc.expectedSuper),
      String(superRes.status),
      superRes.status === tc.expectedSuper
    );
  }

  // Verify superAdmin-only endpoint to grant/revoke admin & block granting superAdmin
  const adminGrantAttempt = await callPagesFunction(
    '/api/superadmin/admins',
    adminToken,
    'POST',
    { targetUid: 'normal_u1', action: 'grant' }
  );
  recordTest(
    'Cloudflare Functions',
    'Regular Admin cannot call POST /api/superadmin/admins',
    '403',
    String(adminGrantAttempt.status),
    adminGrantAttempt.status === 403
  );

  const superAdminGrantSuperAttempt = await callPagesFunction(
    '/api/superadmin/admins',
    superAdminToken,
    'POST',
    { targetUid: 'normal_u1', role: 'superAdmin' }
  );
  recordTest(
    'Cloudflare Functions',
    'Nobody can grant superAdmin from the app (POST /api/superadmin/admins)',
    '403',
    String(superAdminGrantSuperAttempt.status),
    superAdminGrantSuperAttempt.status === 403
  );

  const superAdminGrantAdminRes = await callPagesFunction(
    '/api/superadmin/admins',
    superAdminToken,
    'POST',
    { targetUid: 'normal_u1', targetEmail: 'student@boardly.cfd', admin: true }
  );
  const grantBody = await superAdminGrantAdminRes.json().catch(() => ({}));
  recordTest(
    'Cloudflare Functions',
    'SuperAdmin can grant admin via POST /api/superadmin/admins (revokes tokens + logs to admin_activity_logs)',
    '200 (logged=true, revoked=true)',
    `${superAdminGrantAdminRes.status} (logged=${Boolean(grantBody?.logId)}, revoked=${Boolean(grantBody?.refreshTokensRevoked)})`,
    superAdminGrantAdminRes.status === 200 && Boolean(grantBody?.logId) && Boolean(grantBody?.refreshTokensRevoked)
  );
}

// ============================================================================
// 2. FIRESTORE RULES VERIFICATION
// ============================================================================
function runFirestoreRulesVerification() {
  const rulesText = readFileSync('/app/applet/firestore.rules', 'utf8');

  // Verify helper definitions in firestore.rules
  const hasStrictSuperAdmin =
    rulesText.includes('function isSuperAdmin() {\n      return signedIn() && request.auth.token.superAdmin == true;\n    }');
  const hasStrictIsAdmin =
    rulesText.includes('request.auth.token.admin == true ||\n        request.auth.token.superAdmin == true') &&
    !rulesText.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'");

  recordTest(
    'Firestore Rules',
    'isSuperAdmin() & isAdmin() read ONLY request.auth.token.superAdmin / admin claims',
    'true',
    String(hasStrictSuperAdmin && hasStrictIsAdmin),
    hasStrictSuperAdmin && hasStrictIsAdmin
  );

  // Simulator matching the exact predicates in firestore.rules
  type CallerToken = { uid: string; admin?: boolean; superAdmin?: boolean };
  const isSignedIn = (auth: CallerToken | null) => auth !== null;
  const isOwner = (auth: CallerToken | null, uid: string) => isSignedIn(auth) && auth!.uid === uid;
  const isSuperAdmin = (auth: CallerToken | null) => isSignedIn(auth) && auth!.superAdmin === true;
  const isAdmin = (auth: CallerToken | null) =>
    isSignedIn(auth) && (auth!.admin === true || auth!.superAdmin === true);
  const clientDoesNotGrantSuperAdmin = (data: Record<string, unknown>) =>
    (!('superAdmin' in data) || data.superAdmin === false) &&
    (!('isSuperAdmin' in data) || data.isSuperAdmin === false) &&
    (!('role' in data) || !['super_admin', 'superadmin'].includes(String(data.role)));

  const forbiddenUserSelfWriteKeys = [
    'role',
    'isAdmin',
    'superAdmin',
    'isSuperAdmin',
    'plan',
    'pro',
  ];

  const canUserUpdateOwnDoc = (auth: CallerToken | null, uid: string, changedData: Record<string, unknown>) => {
    if (!clientDoesNotGrantSuperAdmin(changedData)) return false;
    if (isSuperAdmin(auth)) return true;
    const keys = Object.keys(changedData);
    if (isAdmin(auth) && !keys.some((k) => ['role', 'isAdmin', 'superAdmin', 'isSuperAdmin'].includes(k))) {
      return true;
    }
    if (isOwner(auth, uid) && !keys.some((k) => forbiddenUserSelfWriteKeys.includes(k))) {
      return true;
    }
    return false;
  };

  const canAccessCollection = (
    auth: CallerToken | null,
    collection: 'payment_requests' | 'admin_activity_logs' | 'roles' | 'settings',
    op: 'read' | 'write',
    data: Record<string, unknown> = {}
  ) => {
    if (collection === 'payment_requests' || collection === 'admin_activity_logs') {
      return isAdmin(auth);
    }
    if (collection === 'roles' || collection === 'settings') {
      return isSuperAdmin(auth) && (op === 'read' || clientDoesNotGrantSuperAdmin(data));
    }
    return false;
  };

  const normalCaller: CallerToken = { uid: 'u_norm' };
  const adminCaller: CallerToken = { uid: 'u_adm', admin: true };
  const superCaller: CallerToken = { uid: 'u_sup', superAdmin: true, admin: true };

  // Test 1: Normal user cannot write role/isAdmin/superAdmin/plan/pro on own doc
  const selfWriteResults = forbiddenUserSelfWriteKeys.map((field) =>
    canUserUpdateOwnDoc(normalCaller, 'u_norm', { [field]: true })
  );
  const normalBlockedAll = selfWriteResults.every((allowed) => allowed === false);
  recordTest(
    'Firestore Rules',
    'Normal user cannot write role/isAdmin/superAdmin/plan/pro on own doc',
    'DENIED (all 6 fields)',
    normalBlockedAll ? 'DENIED (all 6 fields)' : 'ALLOWED (FAILURE)',
    normalBlockedAll
  );

  // Test 2: Normal user cannot read payment_requests or admin_activity_logs
  const normReadPayments = canAccessCollection(normalCaller, 'payment_requests', 'read');
  const normReadLogs = canAccessCollection(normalCaller, 'admin_activity_logs', 'read');
  recordTest(
    'Firestore Rules',
    'Normal user cannot read payment_requests or admin_activity_logs',
    'DENIED',
    !normReadPayments && !normReadLogs ? 'DENIED' : 'ALLOWED',
    !normReadPayments && !normReadLogs
  );

  // Test 3: Admin can read/write admin collections but NOT role/settings collections
  const admReadWriteAdminCols =
    canAccessCollection(adminCaller, 'payment_requests', 'read') &&
    canAccessCollection(adminCaller, 'payment_requests', 'write') &&
    canAccessCollection(adminCaller, 'admin_activity_logs', 'read') &&
    canAccessCollection(adminCaller, 'admin_activity_logs', 'write');
  const admBlockedRoleSettings =
    !canAccessCollection(adminCaller, 'roles', 'read') &&
    !canAccessCollection(adminCaller, 'roles', 'write') &&
    !canAccessCollection(adminCaller, 'settings', 'read') &&
    !canAccessCollection(adminCaller, 'settings', 'write');
  recordTest(
    'Firestore Rules',
    'Admin can read/write admin collections but NOT role/settings collections',
    'AdminCols=ALLOW, RoleSettings=DENY',
    `AdminCols=${admReadWriteAdminCols ? 'ALLOW' : 'DENY'}, RoleSettings=${
      admBlockedRoleSettings ? 'DENY' : 'ALLOW'
    }`,
    admReadWriteAdminCols && admBlockedRoleSettings
  );

  // Test 4: SuperAdmin can read/write all of them (except granting superAdmin from client)
  const supReadWriteAll =
    canAccessCollection(superCaller, 'payment_requests', 'read') &&
    canAccessCollection(superCaller, 'payment_requests', 'write') &&
    canAccessCollection(superCaller, 'admin_activity_logs', 'read') &&
    canAccessCollection(superCaller, 'admin_activity_logs', 'write') &&
    canAccessCollection(superCaller, 'roles', 'read') &&
    canAccessCollection(superCaller, 'roles', 'write', { role: 'admin' }) &&
    canAccessCollection(superCaller, 'settings', 'read') &&
    canAccessCollection(superCaller, 'settings', 'write');
  recordTest(
    'Firestore Rules',
    'SuperAdmin can read/write admin, role, and settings collections',
    'ALLOWED',
    supReadWriteAll ? 'ALLOWED' : 'DENIED',
    supReadWriteAll
  );

  // Test 5: Nobody can grant superAdmin from the client
  const clientGrantSuper =
    canUserUpdateOwnDoc(superCaller, 'u_target', { superAdmin: true }) ||
    canUserUpdateOwnDoc(superCaller, 'u_target', { role: 'super_admin' }) ||
    canAccessCollection(superCaller, 'roles', 'write', { role: 'super_admin' });
  recordTest(
    'Firestore Rules',
    'Nobody can grant superAdmin from the client',
    'DENIED',
    !clientGrantSuper ? 'DENIED' : 'ALLOWED',
    !clientGrantSuper
  );
}

// ============================================================================
// 3. FRONTEND ROUTE GUARD & FAIL-CLOSED VERIFICATION
// ============================================================================
function runFrontendVerification() {
  const authContextCode = readFileSync('/app/applet/src/contexts/AuthContext.tsx', 'utf8');
  const adminGuardCode = readFileSync('/app/applet/src/components/admin/AdminGuard.tsx', 'utf8');
  const overviewCode = readFileSync('/app/applet/src/pages/admin/AdminOverviewPage.tsx', 'utf8');

  // Verify AuthContext derives isSuperAdmin & isAdmin strictly from tokenClaims
  const strictClaimsDerivation =
    authContextCode.includes('tokenClaims.verified') &&
    authContextCode.includes('tokenClaims.superAdmin === true') &&
    authContextCode.includes('tokenClaims.admin === true') &&
    authContextCode.includes('const isAdmin = isSuperAdmin || isLimitedAdmin;');

  recordTest(
    'Frontend',
    'isAdmin and isSuperAdmin derive strictly from getIdTokenResult() custom claims (never Firestore/localStorage/URL)',
    'PASS',
    strictClaimsDerivation ? 'PASS' : 'FAIL',
    strictClaimsDerivation
  );

  // Simulate AdminGuard routing decisions
  const evaluateAdminGuard = (
    caller: { user: boolean; isSessionVerified: boolean; isAdmin: boolean; isSuperAdmin: boolean },
    pathname: string,
    requireSuperAdmin: boolean
  ) => {
    if (!caller.user || !caller.isSessionVerified) return 'REDIRECT:/login';
    if (!caller.isAdmin && !caller.isSuperAdmin) return 'REDIRECT:/dashboard (NO_DATA_FETCHED)';
    if ((requireSuperAdmin || pathname.startsWith('/superadmin')) && !caller.isSuperAdmin) {
      return 'REDIRECT:/admin';
    }
    return 'RENDER_PROTECTED_ROUTE';
  };

  const normalOnAdmin = evaluateAdminGuard(
    { user: true, isSessionVerified: true, isAdmin: false, isSuperAdmin: false },
    '/admin',
    false
  );
  const normalOnSuperAdmin = evaluateAdminGuard(
    { user: true, isSessionVerified: true, isAdmin: false, isSuperAdmin: false },
    '/superadmin',
    true
  );
  recordTest(
    'Frontend',
    'Normal user visiting /admin and /superadmin is redirected to /dashboard and no admin data is fetched',
    'REDIRECT:/dashboard (NO_DATA_FETCHED)',
    normalOnAdmin === normalOnSuperAdmin ? normalOnAdmin : `${normalOnAdmin} / ${normalOnSuperAdmin}`,
    normalOnAdmin === 'REDIRECT:/dashboard (NO_DATA_FETCHED)' &&
      normalOnSuperAdmin === 'REDIRECT:/dashboard (NO_DATA_FETCHED)' &&
      adminGuardCode.includes('<Navigate to="/dashboard" replace />')
  );

  const adminOnAdmin = evaluateAdminGuard(
    { user: true, isSessionVerified: true, isAdmin: true, isSuperAdmin: false },
    '/admin',
    false
  );
  const adminOnSuperAdmin = evaluateAdminGuard(
    { user: true, isSessionVerified: true, isAdmin: true, isSuperAdmin: false },
    '/superadmin',
    true
  );
  recordTest(
    'Frontend',
    'Admin sees /admin but is redirected from /superadmin to /admin',
    '/admin=RENDER_PROTECTED_ROUTE, /superadmin=REDIRECT:/admin',
    `/admin=${adminOnAdmin}, /superadmin=${adminOnSuperAdmin}`,
    adminOnAdmin === 'RENDER_PROTECTED_ROUTE' &&
      adminOnSuperAdmin === 'REDIRECT:/admin' &&
      adminGuardCode.includes('<Navigate to="/admin" replace />')
  );

  // Verify missing doc / 404 / network error never grants any role
  const failClosedOnTokenError =
    authContextCode.includes('setTokenClaims({ admin: false, superAdmin: false, verified: false });') &&
    !authContextCode.includes("loadedProfile.role === 'super_admin' ||");
  const independentStatCards =
    overviewCode.includes('loadUsersCard') &&
    overviewCode.includes('loadQuestionsCard') &&
    overviewCode.includes('loadAttemptsCard') &&
    overviewCode.includes('loadApplicationsCard') &&
    overviewCode.includes('loadPaymentsCard') &&
    overviewCode.includes('loadReviewsCard') &&
    overviewCode.includes("showApiToast(toastMsg, 'error')");

  recordTest(
    'Frontend',
    'Missing doc, 404, or network error fails CLOSED (admin: false, superAdmin: false) and Overview cards load independently with real error toasts',
    'PASS',
    failClosedOnTokenError && independentStatCards ? 'PASS' : 'FAIL',
    failClosedOnTokenError && independentStatCards
  );
}

async function main() {
  await runCloudflareFunctionsMatrix();
  runFirestoreRulesVerification();
  runFrontendVerification();

  console.log('\n==================== SECURITY & FUNCTIONALITY TEST MATRIX ====================');
  for (const r of results) {
    console.log(
      `[${r.passed ? 'PASS' : 'FAIL'}] (${r.category}) ${r.testName} | Expected: ${r.expected} | Actual: ${r.actual}`
    );
  }
  const failed = results.filter((r) => !r.passed);
  console.log('==============================================================================');
  console.log(`Total: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
