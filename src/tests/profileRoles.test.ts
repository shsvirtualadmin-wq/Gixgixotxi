import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROLE_GROUPS,
  PROFILE_STATUS_OPTIONS,
  getVisibleRoleGroups,
  evaluateRoleChangePermission,
  resolveRoleBadgeDisplay,
  validateProfileDisplayName,
  validateProfileUsername,
  validateProfileBio,
  containsReservedBrandName,
} from '../lib/profileRoles';
import { onRequest } from '../../functions/api/[[path]]';
import {
  InMemoryD1Database,
  type VerifiedFirebaseToken,
} from '../../functions/_utils/firestoreRestAdmin';

const PKIG_SEEDED_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

async function seedUser(
  db: InMemoryD1Database,
  u: {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    bio: string;
    status: string;
    role: string;
    customRole: string | null;
    seedUserRole?: boolean;
  }
) {
  const now = Date.now();
  await db
    .prepare(
      `INSERT OR REPLACE INTO user_usernames (username_lower, username_display, uid, account_type, email, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(u.username.toLowerCase(), u.username, u.uid, 'registered', u.email, now, now)
    .run();

  await db
    .prepare(
      `UPDATE user_usernames
       SET display_name = ?1, avatar = ?2, frame = ?3, role = ?4, custom_role = ?5, bio = ?6, status = ?7, accent = ?8, updated_at = ?9
       WHERE uid = ?10`
    )
    .bind(u.displayName, 'avatar-1', null, u.role, u.customRole, u.bio, u.status, '', now, u.uid)
    .run();

  if (u.seedUserRole) {
    await db
      .prepare(
        `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
      .bind(u.uid, u.email, u.role, u.customRole, 0, now, now)
      .run();
  }
}

async function createSeededDbAndTokens() {
  const db = new InMemoryD1Database();
  (db as any).saveToDisk = () => {};
  const pkigUid = PKIG_SEEDED_UID;

  await seedUser(db, {
    uid: pkigUid,
    username: 'pkig',
    email: 'shsvirtualadmin@gmail.com',
    displayName: 'PKIG',
    bio: 'Boardly Founder',
    status: 'active',
    role: 'superadmin',
    customRole: 'Superadmin',
    seedUserRole: true,
  });

  await seedUser(db, {
    uid: 'uid_admin_1',
    username: 'admin_user',
    email: 'admin1@boardly.cfd',
    displayName: 'Amina Admin',
    bio: 'Managing communities',
    status: 'active',
    role: 'admin',
    customRole: 'Admin',
    seedUserRole: true,
  });

  await seedUser(db, {
    uid: 'uid_captain_1',
    username: 'captain_user',
    email: 'captain1@boardly.cfd',
    displayName: 'Bilal Captain',
    bio: 'Campus leader',
    status: 'active',
    role: 'captain',
    customRole: 'Captain',
    seedUserRole: true,
  });

  await seedUser(db, {
    uid: 'uid_student_1',
    username: 'student_user',
    email: 'student1@boardly.cfd',
    displayName: 'Zain Student',
    bio: 'Preparing for board exams',
    status: 'active',
    role: 'student',
    customRole: 'Student',
    seedUserRole: false,
  });

  const tokens: Record<string, VerifiedFirebaseToken> = {
    'Bearer tok_pkig': {
      uid: pkigUid,
      email: 'shsvirtualadmin@gmail.com',
      name: 'PKIG',
      emailVerified: true,
      superAdmin: true,
      admin: true,
      captain: true,
      role: 'superadmin',
    },
    'Bearer tok_admin': {
      uid: 'uid_admin_1',
      email: 'admin1@boardly.cfd',
      name: 'Amina Admin',
      emailVerified: true,
      superAdmin: false,
      admin: true,
      captain: true,
      role: 'admin',
    },
    'Bearer tok_captain': {
      uid: 'uid_captain_1',
      email: 'captain1@boardly.cfd',
      name: 'Bilal Captain',
      emailVerified: true,
      superAdmin: false,
      admin: false,
      captain: true,
      role: 'captain',
    },
    'Bearer tok_student': {
      uid: 'uid_student_1',
      email: 'student1@boardly.cfd',
      name: 'Zain Student',
      emailVerified: true,
      superAdmin: false,
      admin: false,
      captain: false,
      role: undefined,
    },
  };

  const tokenVerifierOverride = async (authHeader: string | null | undefined) => {
    if (!authHeader) return null;
    return tokens[authHeader] || null;
  };

  return { db, pkigUid, tokenVerifierOverride };
}

test('Role groups, options, status options, and pkig database seed match requirements', () => {
  assert.deepEqual(
    ROLE_GROUPS.map((g) => g.label),
    ['Students', 'Aspirants', 'University', 'Teaching', 'Staff']
  );
  assert.deepEqual(
    ROLE_GROUPS[0].options.map((o) => o.label),
    ['Student', 'O / A Levels', 'Class Topper']
  );
  assert.deepEqual(
    ROLE_GROUPS[1].options.map((o) => o.label),
    [
      'MDCAT Aspirant',
      'ECAT Aspirant',
      'University Aspirant',
      'Pre-Medical',
      'Pre-Engineering',
      'ICS / Computer Science',
    ]
  );
  assert.deepEqual(
    ROLE_GROUPS[2].options.map((o) => o.label),
    ['University Student']
  );
  assert.deepEqual(
    ROLE_GROUPS[3].options.map((o) => o.label),
    ['Teacher']
  );
  assert.deepEqual(
    ROLE_GROUPS[4].options.map((o) => o.label),
    ['Captain', 'Admin', 'Superadmin']
  );
  assert.deepEqual(
    PROFILE_STATUS_OPTIONS.map((s) => s.value),
    ['active', 'busy', 'away', 'invisible']
  );

  // Verify local D1 seed file has pkig seeded as superadmin
  const seedJsonPath = path.resolve(process.cwd(), 'data/d1_auth_guest_tables.json');
  const seedData = JSON.parse(fs.readFileSync(seedJsonPath, 'utf-8'));
  const pkigUsernameRow = (seedData.user_usernames || []).find(
    (r: any) => String(r.username_lower || '').toLowerCase() === 'pkig'
  );
  assert.ok(pkigUsernameRow, 'pkig must be seeded in user_usernames');
  const pkigRoleRow = (seedData.user_roles || []).find(
    (r: any) => r.uid === pkigUsernameRow.uid
  );
  assert.ok(pkigRoleRow, 'pkig must be seeded in user_roles');
  assert.equal(pkigRoleRow.role, 'superadmin');
});

test('Test 1: Superadmin sees all 3 Staff roles, can pick Admin, save, and reload shows Admin tag', async () => {
  const groups = getVisibleRoleGroups({
    callerStaffRank: 'superadmin',
    currentSelection: 'Superadmin',
  });
  const staffGroup = groups.find((g) => g.id === 'staff');
  assert.ok(staffGroup, 'Superadmin must see Staff group');
  assert.deepEqual(
    staffGroup.options.map((o) => o.label),
    ['Captain', 'Admin', 'Superadmin']
  );

  const { db, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Pick Admin and save via /api/auth/profile-sync
  const saveRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_pkig',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'admin',
        customRole: 'Admin',
        status: 'busy',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(saveRes.status, 200);
  const saveData: any = await saveRes.json();
  assert.equal(saveData.ok, true);
  assert.equal(saveData.profile.role, 'admin');
  assert.equal(saveData.profile.customRole, 'Admin');
  assert.equal(saveData.profile.status, 'busy');

  // Reload profile via /api/auth/resolve-profiles?username=pkig
  const reloadRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/resolve-profiles?username=pkig', {
      method: 'GET',
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(reloadRes.status, 200);
  const reloadData: any = await reloadRes.json();
  assert.equal(reloadData.profile.role, 'admin');
  assert.equal(reloadData.profile.customRole, 'Admin');
  assert.equal(
    resolveRoleBadgeDisplay({
      role: reloadData.profile.role,
      customRole: reloadData.profile.customRole,
    }).label,
    'Admin'
  );
});

test('Test 2: Normal student cannot see Staff group and direct API role=Admin returns 403', async () => {
  const groups = getVisibleRoleGroups({
    callerStaffRank: 'none',
    currentSelection: 'Student',
  });
  assert.equal(
    groups.some((g) => g.id === 'staff'),
    false,
    'Staff group must be hidden for normal students'
  );

  const { db, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Direct API call trying to set role=Admin (even with spoofed callerRole in body!)
  const res1 = await onRequest({
    request: new Request('https://boardly.cfd/api/profile', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'Admin',
        callerRole: 'superadmin',
        isSuperAdmin: true,
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(res1.status, 403, 'Student sending role=Admin must get 403');

  // Direct API call trying to spoof Admin via customRole
  const res2 = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'student',
        customRole: 'Admin',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(res2.status, 403, 'Student sending customRole=Admin must get 403');

  // Direct API call trying to set Captain
  const res3 = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'captain',
        customRole: 'Captain',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(res3.status, 403, 'Student sending role=captain must get 403');
});

test('Test 3: Admin can set Captain and Admin (self & others), but NOT Superadmin (403)', async () => {
  const adminGroups = getVisibleRoleGroups({
    callerStaffRank: 'admin',
    currentSelection: 'Admin',
  });
  const staffGroup = adminGroups.find((g) => g.id === 'staff');
  assert.ok(staffGroup);
  assert.deepEqual(
    staffGroup.options.map((o) => o.label),
    ['Captain', 'Admin']
  );

  const { db, pkigUid, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Admin can set Captain on another user
  const setCapOther = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUid: 'uid_student_1',
        role: 'captain',
        customRole: 'Captain',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(setCapOther.status, 200);
  const setCapOtherJson: any = await setCapOther.json();
  assert.equal(setCapOtherJson.profile.role, 'captain');

  // Admin can promote another user to Admin
  const setAdminOther = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUid: 'uid_student_1',
        role: 'admin',
        customRole: 'Admin',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(setAdminOther.status, 200);
  const setAdminOtherJson: any = await setAdminOther.json();
  assert.equal(setAdminOtherJson.profile.role, 'admin');

  // Admin CANNOT set Superadmin on self or others -> 403
  const setSuperSelf = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'superadmin',
        customRole: 'Superadmin',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(setSuperSelf.status, 403, 'Admin setting Superadmin on self must get 403');

  const setSuperOther = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUid: 'uid_student_1',
        role: 'superadmin',
        customRole: 'Superadmin',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(setSuperOther.status, 403, 'Admin setting Superadmin on another user must get 403');

  // Admin CANNOT modify a Superadmin's profile -> 403
  const editSuperTarget = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUid: pkigUid,
        role: 'student',
        customRole: 'Student',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(editSuperTarget.status, 403, 'Admin modifying a Superadmin must get 403');
});

test('Test 4: Editing only bio/status/name keeps existing staff role intact (Superadmin, Admin, Captain)', async () => {
  const { db, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Superadmin edits only bio
  const superRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_pkig',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bio: 'Updated founder bio only',
        status: 'away',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(superRes.status, 200);
  const superData: any = await superRes.json();
  assert.equal(superData.profile.role, 'superadmin');
  assert.equal(superData.profile.bio, 'Updated founder bio only');
  assert.equal(superData.profile.status, 'away');

  // Captain edits only bio & display name -> Captain role preserved
  const capRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_captain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Bilal K.',
        bio: 'Leading FSc study squad',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(capRes.status, 200);
  const capData: any = await capRes.json();
  assert.equal(capData.profile.role, 'captain');
  assert.equal(capData.profile.displayName, 'Bilal K.');

  // Captain sees their current Captain value in Staff group, can keep Captain, cannot escalate to Admin
  const capGroups = getVisibleRoleGroups({
    callerStaffRank: 'captain',
    currentSelection: 'Captain',
  });
  const capStaff = capGroups.find((g) => g.id === 'staff');
  assert.ok(capStaff);
  assert.deepEqual(
    capStaff.options.map((o) => o.label),
    ['Captain']
  );

  const capKeepRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_captain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'captain',
        customRole: 'Captain',
        bio: 'Still captain',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(capKeepRes.status, 200);

  const capEscalateRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_captain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'admin',
        customRole: 'Admin',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(capEscalateRes.status, 403);
});

test('Test 5: Teacher and aspirant roles save and display with canonical role tags', async () => {
  const { db, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Save Teacher role as normal user
  const teacherRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'teacher',
        customRole: 'Teacher',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(teacherRes.status, 200);
  const teacherData: any = await teacherRes.json();
  assert.equal(teacherData.profile.role, 'teacher');
  assert.equal(teacherData.profile.customRole, 'Teacher');
  assert.equal(
    resolveRoleBadgeDisplay({
      role: teacherData.profile.role,
      customRole: teacherData.profile.customRole,
    }).label,
    'Teacher'
  );

  // Save MDCAT Aspirant role
  const aspirantRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'student',
        customRole: 'MDCAT Aspirant',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(aspirantRes.status, 200);
  const aspirantData: any = await aspirantRes.json();
  assert.equal(aspirantData.profile.role, 'student');
  assert.equal(aspirantData.profile.customRole, 'MDCAT Aspirant');
  assert.equal(
    resolveRoleBadgeDisplay({
      role: aspirantData.profile.role,
      customRole: aspirantData.profile.customRole,
    }).label,
    'MDCAT Aspirant'
  );

  // Verify canonical staff & student tag display names
  assert.equal(resolveRoleBadgeDisplay({ role: 'superadmin' }).label, 'Super Admin');
  assert.equal(resolveRoleBadgeDisplay({ role: 'admin' }).label, 'Admin');
  assert.equal(resolveRoleBadgeDisplay({ role: 'captain' }).label, 'Captain');
  assert.equal(resolveRoleBadgeDisplay({ role: 'teacher' }).label, 'Teacher');
  assert.equal(resolveRoleBadgeDisplay({ role: 'student' }).label, 'Student');
});

test('Edit profile validation: display name (2-40), username (3-20, unique, reserved brand names), bio (<=160), status', async () => {
  // Unit validators
  assert.equal(validateProfileDisplayName('A').valid, false);
  assert.equal(validateProfileDisplayName('Al').valid, true);
  assert.equal(validateProfileDisplayName('A'.repeat(40)).valid, true);
  assert.equal(validateProfileDisplayName('A'.repeat(41)).valid, false);

  assert.equal(validateProfileBio('x'.repeat(160)).valid, true);
  assert.equal(validateProfileBio('x'.repeat(161)).valid, false);

  assert.equal(validateProfileUsername('ab').valid, false);
  assert.equal(validateProfileUsername('valid_user.01').valid, true);
  assert.equal(validateProfileUsername('Invalid-Char!').valid, false);
  assert.equal(containsReservedBrandName('my_boardly_acc'), true);
  assert.equal(containsReservedBrandName('SHS Virtual Academy Official'), true);
  assert.equal(containsReservedBrandName('scholario_notes'), true);
  assert.equal(containsReservedBrandName('zain_physics'), false);

  const { db, tokenVerifierOverride } = await createSeededDbAndTokens();

  // Short display name -> 400
  const shortNameRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: 'A' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(shortNameRes.status, 400);

  // Bio > 160 -> 400
  const longBioRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bio: 'b'.repeat(161) }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(longBioRes.status, 400);

  // Reserved brand username for student -> 403
  const reservedStudentRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'official_boardly' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(reservedStudentRes.status, 403);

  // Reserved display name ("SHS Virtual Academy") for student -> 403
  const reservedDisplayNameRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: 'SHS Virtual Academy Fan' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(reservedDisplayNameRes.status, 403);

  // Duplicate username -> 409
  const duplicateUsernameRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'pkig' }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(duplicateUsernameRes.status, 409);

  // Admin IS allowed to use a reserved brand name
  const reservedAdminRes = await onRequest({
    request: new Request('https://boardly.cfd/api/auth/profile-sync', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer tok_admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Boardly Desk',
        username: 'boardly_desk',
        status: 'invisible',
      }),
    }),
    env: { DB: db as any },
    tokenVerifierOverride,
  });
  assert.equal(reservedAdminRes.status, 200);
  const reservedAdminJson: any = await reservedAdminRes.json();
  assert.equal(reservedAdminJson.profile.username, 'boardly_desk');
  assert.equal(reservedAdminJson.profile.status, 'invisible');

  // Evaluate helper directly for completeness
  assert.equal(
    evaluateRoleChangePermission({
      callerStaffRank: 'none',
      targetExistingRole: 'student',
      requestedRole: 'admin',
    }).allowed,
    false
  );
});
