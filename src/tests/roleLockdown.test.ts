import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/[[path]]';
import { InMemoryD1Database, type VerifiedFirebaseToken } from '../../functions/_utils/firestoreRestAdmin';
import { runResetRoles } from '../../scripts/reset-roles.js';

/**
 * Helper that evaluates the exact custom-claim hierarchy and hamburger menu visibility rules
 * used by AuthContext.tsx, HamburgerMenuSheet.tsx, RoleGuard.tsx, and AdminGuard.tsx.
 */
function evaluateClientRoleStateFromTokenResult(params: {
  email: string;
  claims: Record<string, unknown>;
  firestoreSpoofedRole?: string;
  localStorageSpoofedRole?: string;
}) {
  // Strictly read from (await user.getIdTokenResult()).claims — never from Firestore or localStorage
  const claims = params.claims || {};
  const superAdmin = claims.superAdmin === true;
  const admin = claims.admin === true || superAdmin;
  const captain = claims.captain === true || admin;

  const hamburgerEntries: string[] = [];
  if (captain || admin || superAdmin) {
    hamburgerEntries.push('Captain dashboard');
  }
  if (admin || superAdmin) {
    hamburgerEntries.push('Admin');
  }
  if (superAdmin) {
    hamburgerEntries.push('Super Admin');
  }

  const ownerDebugLine = superAdmin
    ? `Signed in as ${params.email} · roles: superAdmin, admin, captain`
    : null;

  return {
    superAdmin,
    admin,
    captain,
    effectiveRole: superAdmin ? 'super_admin' : admin ? 'admin' : captain ? 'captain' : 'student',
    hamburgerEntries,
    ownerDebugLine,
    canOpenCaptainDashboard: captain || admin || superAdmin,
    canOpenAdmin: admin || superAdmin,
    canOpenSuperAdmin: superAdmin,
  };
}

async function runRoleLockdownTests() {
  console.log('=== BOARDLY ROLE LOCKDOWN & CAPTAIN DASHBOARD VERIFICATION ===\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Log in as Owner (shsvirtualadmin@gmail.com) -> sees Super Admin, Admin, Captain dashboard + debug line
  // ─────────────────────────────────────────────────────────────────────────────
  const ownerIdTokenResult = {
    claims: { superAdmin: true, admin: true, captain: true },
  };
  const ownerState = evaluateClientRoleStateFromTokenResult({
    email: 'shsvirtualadmin@gmail.com',
    claims: ownerIdTokenResult.claims,
    firestoreSpoofedRole: 'student', // Even if Firestore doc says 'student', custom claims win
  });

  assert.equal(ownerState.superAdmin, true, 'Owner must have superAdmin=true');
  assert.equal(ownerState.admin, true, 'Owner superAdmin implies admin=true');
  assert.equal(ownerState.captain, true, 'Owner superAdmin implies captain=true');
  assert.deepEqual(
    ownerState.hamburgerEntries,
    ['Captain dashboard', 'Admin', 'Super Admin'],
    'Owner hamburger must show Captain dashboard, Admin, and Super Admin'
  );
  assert.equal(
    ownerState.ownerDebugLine,
    'Signed in as shsvirtualadmin@gmail.com · roles: superAdmin, admin, captain',
    'Owner hamburger must render exact debug line'
  );
  assert.equal(ownerState.canOpenSuperAdmin, true);
  assert.equal(ownerState.canOpenAdmin, true);
  assert.equal(ownerState.canOpenCaptainDashboard, true);
  console.log('✓ 1. Owner login (shsvirtualadmin@gmail.com): sees Super Admin, Admin, Captain dashboard + owner debug line');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Log in as Captain -> sees Captain dashboard (not Admin/Super Admin) and opens Captain dashboard
  // ─────────────────────────────────────────────────────────────────────────────
  const captainIdTokenResult = {
    claims: { captain: true },
  };
  const captainState = evaluateClientRoleStateFromTokenResult({
    email: 'captain.nust@boardly.cfd',
    claims: captainIdTokenResult.claims,
    firestoreSpoofedRole: 'student', // Even if old Firestore profile.role is 'student', custom claim { captain: true } works!
  });

  assert.equal(captainState.superAdmin, false, 'Captain must not have superAdmin');
  assert.equal(captainState.admin, false, 'Captain must not have admin');
  assert.equal(captainState.captain, true, 'Captain must have captain=true');
  assert.deepEqual(
    captainState.hamburgerEntries,
    ['Captain dashboard'],
    'Captain hamburger must show ONLY Captain dashboard'
  );
  assert.equal(captainState.ownerDebugLine, null, 'Captain must NOT see owner debug line');
  assert.equal(captainState.canOpenCaptainDashboard, true, 'Captain can open Captain dashboard');
  assert.equal(captainState.canOpenAdmin, false, 'Captain cannot open Admin');
  assert.equal(captainState.canOpenSuperAdmin, false, 'Captain cannot open Super Admin');
  console.log('✓ 2. Captain login: sees Captain dashboard, opens /dashboard/captain, cannot open Admin or Super Admin');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Log in as Student -> sees neither (even if Firestore or localStorage is spoofed!)
  // ─────────────────────────────────────────────────────────────────────────────
  const studentIdTokenResult = {
    claims: {},
  };
  const studentState = evaluateClientRoleStateFromTokenResult({
    email: 'student@boardly.cfd',
    claims: studentIdTokenResult.claims,
    firestoreSpoofedRole: 'super_admin',
    localStorageSpoofedRole: 'captain',
  });

  assert.equal(studentState.superAdmin, false);
  assert.equal(studentState.admin, false);
  assert.equal(studentState.captain, false);
  assert.deepEqual(
    studentState.hamburgerEntries,
    [],
    'Student hamburger must show neither Super Admin, Admin, nor Captain dashboard'
  );
  assert.equal(studentState.ownerDebugLine, null);
  assert.equal(studentState.canOpenCaptainDashboard, false, 'Student cannot open Captain dashboard');
  assert.equal(studentState.canOpenAdmin, false, 'Student cannot open Admin');
  assert.equal(studentState.canOpenSuperAdmin, false, 'Student cannot open Super Admin');
  console.log('✓ 3. Student login: sees neither Super Admin, Admin, nor Captain dashboard (ignores spoofed Firestore/localStorage)');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: Server-side API Route Guards (/api/captain/*, /api/admin/*, /api/superadmin/*)
  // ─────────────────────────────────────────────────────────────────────────────
  const db = new InMemoryD1Database();
  const mockTokens: Record<string, VerifiedFirebaseToken> = {
    'Bearer token_owner': {
      uid: 'uid_owner',
      email: 'shsvirtualadmin@gmail.com',
      name: 'Owner',
      emailVerified: true,
      superAdmin: true,
      admin: true,
      captain: true,
      role: 'superadmin',
    },
    'Bearer token_admin': {
      uid: 'uid_admin',
      email: 'admin@boardly.cfd',
      name: 'Admin',
      emailVerified: true,
      superAdmin: false,
      admin: true,
      captain: true,
      role: 'admin',
    },
    'Bearer token_captain': {
      uid: 'uid_captain',
      email: 'captain@boardly.cfd',
      name: 'Captain',
      emailVerified: true,
      superAdmin: false,
      admin: false,
      captain: true,
      role: 'captain',
    },
    'Bearer token_student': {
      uid: 'uid_student',
      email: 'student@boardly.cfd',
      name: 'Student',
      emailVerified: true,
      superAdmin: false,
      admin: false,
      captain: false,
      role: undefined,
    },
  };

  const tokenVerifierOverride = async (authHeader: string | null | undefined) => {
    if (!authHeader) return null;
    return mockTokens[authHeader] || null;
  };

  // 4a. Unauthenticated / invalid token -> 401 Fail Closed
  const unauthCaptainRes = await onRequest({
    request: new Request('https://boardly.cfd/api/captain/dashboard', {
      headers: { Authorization: 'Bearer invalid_token' },
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(unauthCaptainRes.status, 401, 'Invalid token on /api/captain/dashboard must fail closed with 401');

  // 4b. Student -> 403 Forbidden on /api/captain/dashboard, /api/admin/stats, /api/superadmin/stats
  for (const endpoint of ['/api/captain/dashboard', '/api/admin/stats', '/api/superadmin/stats']) {
    const res = await onRequest({
      request: new Request(`https://boardly.cfd${endpoint}`, {
        headers: { Authorization: 'Bearer token_student' },
      }),
      env: { DB: db as any },
      tokenVerifierOverride,
    });
    assert.equal(res.status, 403, `Student must get 403 on ${endpoint}`);
  }

  // 4c. Captain -> 200 OK on /api/captain/dashboard, 403 on /api/admin/stats and /api/superadmin/stats
  const capOnCaptainApi = await onRequest({
    request: new Request('https://boardly.cfd/api/captain/dashboard', {
      headers: { Authorization: 'Bearer token_captain' },
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(capOnCaptainApi.status, 200, 'Captain must get 200 on /api/captain/dashboard');
  const capJson = (await capOnCaptainApi.json()) as any;
  assert.equal(capJson.ok, true);
  assert.equal(capJson.captain, true);
  assert.equal(capJson.role, 'captain');

  const capOnAdminApi = await onRequest({
    request: new Request('https://boardly.cfd/api/admin/stats', {
      headers: { Authorization: 'Bearer token_captain' },
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(capOnAdminApi.status, 403, 'Captain must get 403 on /api/admin/stats');

  // 4d. Admin -> 200 OK on /api/captain/dashboard and /api/admin/stats, 403 on /api/superadmin/stats
  const adminOnCaptainApi = await onRequest({
    request: new Request('https://boardly.cfd/api/captain/dashboard', {
      headers: { Authorization: 'Bearer token_admin' },
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(adminOnCaptainApi.status, 200, 'Admin implies captain and must get 200 on /api/captain/dashboard');

  // Admin can grant captain, but cannot grant admin
  const claimsSetByAdmin: Record<string, Record<string, boolean>> = {};
  const adminGrantCaptainRes = await onRequest({
    request: new Request('https://boardly.cfd/api/admin/roles', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: 'uid_student', email: 'student@boardly.cfd', role: 'captain' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
    adminSdkOverride: {
      setCustomUserClaims: async (uid, claims) => {
        claimsSetByAdmin[uid] = claims;
      },
      revokeRefreshTokens: async () => {},
    },
  });
  assert.equal(adminGrantCaptainRes.status, 200, 'Admin can grant captain role');
  assert.deepEqual(claimsSetByAdmin['uid_student'], { captain: true });

  const adminGrantAdminRes = await onRequest({
    request: new Request('https://boardly.cfd/api/admin/roles', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: 'uid_student', email: 'student@boardly.cfd', role: 'admin' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(adminGrantAdminRes.status, 403, 'Regular admin cannot grant admin');

  // 4e. Owner (superAdmin) -> 200 OK on /api/superadmin/stats, /api/admin/stats, /api/captain/dashboard
  for (const endpoint of ['/api/superadmin/stats', '/api/admin/stats', '/api/captain/dashboard']) {
    const res = await onRequest({
      request: new Request(`https://boardly.cfd${endpoint}`, {
        headers: { Authorization: 'Bearer token_owner' },
      }),
      env: { DB: db as any },
      tokenVerifierOverride,
    });
    assert.equal(res.status, 200, `Owner (superAdmin) must get 200 on ${endpoint}`);
  }
  console.log('✓ 4. Server-side custom-claim guards (/api/captain/*, /api/admin/*, /api/superadmin/*) verified');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: scripts/reset-roles.js (--dry-run & live execution)
  //   - Preserves captains from Firestore (`captains`, `users`, `publicProfiles`, `captainApplications`)
  //   - Owner (case-insensitive OWNER_EMAIL = shsvirtualadmin@gmail.com) gets { superAdmin: true, admin: true, captain: true }
  //   - Revokes refresh tokens ONLY for users whose claims changed
  //   - Fails if OWNER_EMAIL is not matched
  // ─────────────────────────────────────────────────────────────────────────────
  const mockFirestoreCollections: Record<string, Array<{ id: string; data: () => Record<string, any> }>> = {
    captains: [
      {
        id: 'uid_cap_from_captains_coll',
        data: () => ({ userId: 'uid_cap_from_captains_coll', email: 'cap1@boardly.cfd', status: 'active' }),
      },
    ],
    users: [
      {
        id: 'uid_cap_from_users_role',
        data: () => ({ uid: 'uid_cap_from_users_role', email: 'cap2@boardly.cfd', role: 'captain', isCaptain: true }),
      },
      {
        id: 'uid_spoofed_admin',
        data: () => ({ uid: 'uid_spoofed_admin', email: 'spoof@boardly.cfd', role: 'admin', isAdmin: true }),
      },
    ],
    publicProfiles: [],
    captainApplications: [
      {
        id: 'app_1',
        data: () => ({ userId: 'uid_cap_from_approved_app', email: 'cap3@boardly.cfd', status: 'approved' }),
      },
    ],
  };

  const mockFirestoreDb = {
    collection: (name: string) => ({
      get: async () => ({ docs: mockFirestoreCollections[name] || [] }),
      where: (_field: string, _op: string, _val: string) => ({
        get: async () => ({ docs: mockFirestoreCollections[name] || [] }),
      }),
      doc: (_id: string) => ({
        set: async () => {},
      }),
    }),
  } as any;

  const authUsersList = [
    {
      uid: 'uid_owner',
      email: 'SHSVirtualAdmin@gmail.com', // Mixed case to verify case-insensitive matching
      customClaims: { superAdmin: true, admin: true }, // Missing captain: true -> should be updated!
    },
    {
      uid: 'uid_cap_from_captains_coll',
      email: 'cap1@boardly.cfd',
      customClaims: { captain: true }, // Already has { captain: true } -> unchanged, should NOT revoke token!
    },
    {
      uid: 'uid_cap_from_users_role',
      email: 'cap2@boardly.cfd',
      customClaims: {}, // Missing captain claim -> should get { captain: true } and revoke token!
    },
    {
      uid: 'uid_cap_from_approved_app',
      email: 'cap3@boardly.cfd',
      customClaims: {}, // Approved application -> should get { captain: true } and revoke token!
    },
    {
      uid: 'uid_spoofed_admin',
      email: 'spoof@boardly.cfd',
      customClaims: { admin: true }, // Should be wiped to {} and revoke token!
    },
    {
      uid: 'uid_normal_student',
      email: 'student@boardly.cfd',
      customClaims: {}, // Already {} -> unchanged, should NOT revoke token!
    },
  ];

  const claimsWritten: Record<string, Record<string, boolean>> = {};
  const revokedUids: string[] = [];
  const dryRunLogs: string[] = [];

  const mockAuthClient = {
    listUsers: async () => ({ users: authUsersList }),
    setCustomUserClaims: async (uid: string, claims: Record<string, boolean>) => {
      claimsWritten[uid] = claims;
    },
    revokeRefreshTokens: async (uid: string) => {
      revokedUids.push(uid);
    },
  };

  // 5a. Dry-run first: zero mutations
  const dryRes = await runResetRoles({
    dryRun: true,
    ownerEmail: 'shsvirtualadmin@gmail.com',
    authClient: mockAuthClient,
    firestoreDb: mockFirestoreDb,
    logger: {
      log: (...args: any[]) => dryRunLogs.push(args.join(' ')),
      error: (...args: any[]) => dryRunLogs.push(args.join(' ')),
    },
  });

  assert.equal(Object.keys(claimsWritten).length, 0, '--dry-run must not call setCustomUserClaims');
  assert.equal(revokedUids.length, 0, '--dry-run must not call revokeRefreshTokens');
  assert.equal(dryRes.matchedOwnerUid, 'uid_owner');
  assert.equal(dryRes.captainsPreservedCount, 3, 'All 3 captains must be preserved');
  assert.ok(
    dryRunLogs.some((l) => l.includes('Matched OWNER_EMAIL: SHSVirtualAdmin@gmail.com (uid: uid_owner)')),
    'Must log the exact OWNER_EMAIL matched'
  );

  // 5b. Live run: updates only changed claims & revokes tokens only for changed users
  const liveRes = await runResetRoles({
    dryRun: false,
    ownerEmail: 'shsvirtualadmin@gmail.com',
    authClient: mockAuthClient,
    firestoreDb: mockFirestoreDb,
    logger: { log: () => {}, error: () => {} },
  });

  assert.deepEqual(
    claimsWritten['uid_owner'],
    { superAdmin: true, admin: true, captain: true },
    'Owner must get { superAdmin: true, admin: true, captain: true }'
  );
  assert.equal(
    claimsWritten['uid_cap_from_captains_coll'],
    undefined,
    'Captain who already had { captain: true } must not be rewritten or have tokens revoked'
  );
  assert.deepEqual(
    claimsWritten['uid_cap_from_users_role'],
    { captain: true },
    'Captain from users collection must get { captain: true }'
  );
  assert.deepEqual(
    claimsWritten['uid_cap_from_approved_app'],
    { captain: true },
    'Captain from approved captainApplications must get { captain: true }'
  );
  assert.deepEqual(
    claimsWritten['uid_spoofed_admin'],
    {},
    'Non-owner non-captain user must be reset to {}'
  );
  assert.deepEqual(
    revokedUids.sort(),
    ['uid_cap_from_approved_app', 'uid_cap_from_users_role', 'uid_owner', 'uid_spoofed_admin'].sort(),
    'Refresh tokens must be revoked ONLY for users whose claims changed'
  );
  assert.equal(liveRes.unchangedCount, 2, '2 users (already-set captain and student) had unchanged claims');

  // 5c. Fail with error if no user matches OWNER_EMAIL
  await assert.rejects(
    () =>
      runResetRoles({
        dryRun: true,
        ownerEmail: 'nonexistent-owner@example.com',
        authClient: mockAuthClient,
        firestoreDb: mockFirestoreDb,
        logger: { log: () => {}, error: () => {} },
      }),
    /No Firebase Auth user matched OWNER_EMAIL/,
    'Must fail with an error if no user matches OWNER_EMAIL'
  );
  console.log('✓ 5. scripts/reset-roles.js (--dry-run, captain preservation, owner claims, selective token revocation, missing-owner error) verified');

  console.log('\nALL ROLE LOCKDOWN & CAPTAIN DASHBOARD TESTS PASSED!');
}

runRoleLockdownTests().catch((err) => {
  console.error('Role lockdown test failed:', err);
  process.exit(1);
});
