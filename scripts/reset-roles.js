#!/usr/bin/env node
/**
 * scripts/reset-roles.js
 *
 * Emergency role reset script using `firebase-admin`:
 * 1. Paginates through ALL Firebase Auth users (`auth.listUsers(1000, pageToken)`).
 * 2. Sets custom claims to `{}` for every user EXCEPT `process.env.OWNER_EMAIL`,
 *    who receives `{ superAdmin: true, admin: true }`.
 * 3. Calls `auth.revokeRefreshTokens(user.uid)` on ALL users so existing ID tokens
 *    are invalidated immediately.
 * 4. Scans the Firestore `users` (and `publicProfiles`) collection and resets any
 *    `role`, `isAdmin`, `superAdmin`, or `isSuperAdmin` fields that were set to
 *    admin/superAdmin on non-owner documents.
 *
 * Usage:
 *   OWNER_EMAIL="your-owner@email.com" \
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node scripts/reset-roles.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const OWNER_EMAIL = (process.env.OWNER_EMAIL || '').trim().toLowerCase();

if (!OWNER_EMAIL || !OWNER_EMAIL.includes('@')) {
  console.error(
    'ERROR: OWNER_EMAIL environment variable is required.\n' +
      'Example: OWNER_EMAIL="owner@example.com" node scripts/reset-roles.js'
  );
  process.exit(1);
}

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    '';

  if (rawJson.trim()) {
    const cert = JSON.parse(rawJson);
    return admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const cert = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
  });
}

async function resetAllRoles() {
  initFirebaseAdmin();
  const auth = admin.auth();
  const db = admin.firestore();

  console.log(`[reset-roles] Starting full role reset. Owner email: ${OWNER_EMAIL}`);

  let pageToken = undefined;
  let totalAuthUsers = 0;
  let ownerUid = null;
  let revokedCount = 0;

  // 1. Paginate all Firebase Auth users, set custom claims, and revoke refresh tokens
  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    for (const userRecord of listUsersResult.users) {
      totalAuthUsers += 1;
      const emailLower = (userRecord.email || '').trim().toLowerCase();
      const isOwner = emailLower === OWNER_EMAIL;

      const targetClaims = isOwner ? { superAdmin: true, admin: true } : {};
      if (isOwner) {
        ownerUid = userRecord.uid;
      }

      await auth.setCustomUserClaims(userRecord.uid, targetClaims);
      await auth.revokeRefreshTokens(userRecord.uid);
      revokedCount += 1;

      console.log(
        `[reset-roles] Auth user ${userRecord.uid} (${emailLower || 'no-email'}) -> claims=${JSON.stringify(
          targetClaims
        )} (refresh tokens revoked)`
      );
    }
    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  // 2. Reset any role / isAdmin / superAdmin fields in Firestore `users` and `publicProfiles`
  const collectionsToClean = ['users', 'publicProfiles'];
  let firestoreDocsReset = 0;

  for (const collName of collectionsToClean) {
    const snap = await db.collection(collName).get();
    let batch = db.batch();
    let batchOps = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      const emailLower = String(data.email || '').trim().toLowerCase();
      const isOwnerDoc =
        (ownerUid && docSnap.id === ownerUid) ||
        (emailLower && emailLower === OWNER_EMAIL);

      if (isOwnerDoc) {
        batch.set(
          docSnap.ref,
          {
            role: 'super_admin',
            isAdmin: true,
            superAdmin: true,
            isSuperAdmin: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        batchOps += 1;
        continue;
      }

      const roleLower = String(data.role || '').trim().toLowerCase();
      const hadElevatedRole =
        roleLower === 'admin' ||
        roleLower === 'super_admin' ||
        roleLower === 'superadmin' ||
        data.isAdmin === true ||
        data.superAdmin === true ||
        data.isSuperAdmin === true;

      if (hadElevatedRole) {
        batch.set(
          docSnap.ref,
          {
            role: 'student',
            isAdmin: false,
            superAdmin: false,
            isSuperAdmin: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        batchOps += 1;
        firestoreDocsReset += 1;
      }

      if (batchOps >= 400) {
        await batch.commit();
        batch = db.batch();
        batchOps = 0;
      }
    }

    if (batchOps > 0) {
      await batch.commit();
    }
  }

  // 3. Record audit log in admin_activity_logs
  await db.collection('admin_activity_logs').add({
    action: 'emergency_reset_all_roles',
    ownerEmail: OWNER_EMAIL,
    ownerUid,
    totalAuthUsers,
    revokedCount,
    firestoreDocsReset,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(
    `\n[reset-roles] Completed successfully:\n` +
      `  - Auth users processed: ${totalAuthUsers}\n` +
      `  - Refresh tokens revoked: ${revokedCount}\n` +
      `  - Owner UID granted { superAdmin: true, admin: true }: ${ownerUid || 'NOT_FOUND'}\n` +
      `  - Firestore user/profile docs reset to student: ${firestoreDocsReset}`
  );
}

resetAllRoles().catch((err) => {
  console.error('[reset-roles] Fatal error:', err);
  process.exit(1);
});
