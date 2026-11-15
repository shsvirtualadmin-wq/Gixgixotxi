#!/usr/bin/env node
/**
 * scripts/reset-roles.js
 *
 * Role lockdown & reset script using `firebase-admin`:
 * - OWNER_EMAIL (defaults to shsvirtualadmin@gmail.com, compared case-insensitively)
 *   gets `{ superAdmin: true, admin: true, captain: true }`.
 * - Preserves existing captain claims AND reads captains from Firestore:
 *   1. `captains` collection (`captains/{uid}` where status !== 'rejected' && status !== 'revoked')
 *   2. `users` collection (`users/{uid}` where `role === 'captain' | 'ambassador'` or `isCaptain === true | isAmbassador === true`)
 *   3. `publicProfiles` collection (`publicProfiles/{uid}` where `role === 'captain' | 'ambassador'` or `isCaptain === true | isAmbassador === true`)
 *   4. `captainApplications` collection (`captainApplications/{id}` where `status === 'approved'`)
 *   and sets `{ captain: true }` on those users.
 * - Everyone else gets `{}`.
 * - Revokes refresh tokens ONLY for users whose custom claims actually changed.
 * - Supports `--dry-run` flag to print each user and the claims it would set without mutating Auth or Firestore.
 * - Logs the exact OWNER_EMAIL matched and fails with an error (exit code 1) if no user matches OWNER_EMAIL.
 *
 * Usage:
 *   # Dry run first:
 *   OWNER_EMAIL="shsvirtualadmin@gmail.com" \
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node scripts/reset-roles.js --dry-run
 *
 *   # Apply changes:
 *   OWNER_EMAIL="shsvirtualadmin@gmail.com" \
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node scripts/reset-roles.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DEFAULT_OWNER_EMAIL = 'shsvirtualadmin@gmail.com';

export function resolveOwnerEmail(rawEnvEmail = process.env.OWNER_EMAIL) {
  const email = String(rawEnvEmail || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error(
      'ERROR: Valid OWNER_EMAIL is required (default: shsvirtualadmin@gmail.com).'
    );
  }
  return email;
}

export function normalizeRoleClaims(claims) {
  if (!claims || typeof claims !== 'object') return {};
  const out = {};
  if (claims.superAdmin === true) out.superAdmin = true;
  if (claims.admin === true) out.admin = true;
  if (claims.captain === true) out.captain = true;
  return out;
}

export function areClaimsEqual(currentClaims, targetClaims) {
  const curr = normalizeRoleClaims(currentClaims);
  const target = normalizeRoleClaims(targetClaims);
  const currKeys = Object.keys(curr).sort();
  const targetKeys = Object.keys(target).sort();
  if (currKeys.length !== targetKeys.length) return false;
  for (let i = 0; i < currKeys.length; i++) {
    const k = currKeys[i];
    if (k !== targetKeys[i] || curr[k] !== target[k]) {
      return false;
    }
  }
  const rawKeys = Object.keys(currentClaims || {}).filter(
    (k) => currentClaims?.[k] !== undefined && currentClaims?.[k] !== null
  );
  if (rawKeys.length !== targetKeys.length) return false;
  return true;
}

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';

  if (rawJson.trim()) {
    const cert = JSON.parse(
      rawJson.startsWith('{') ? rawJson : Buffer.from(rawJson, 'base64').toString('utf8')
    );
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

/**
 * Discovers all Captain UIDs and emails across Firestore collections:
 * 1. `captains/{uid}` (status !== 'rejected' && status !== 'revoked')
 * 2. `users/{uid}` (role in ['captain', 'ambassador'] or isCaptain === true or isAmbassador === true)
 * 3. `publicProfiles/{uid}` (role in ['captain', 'ambassador'] or isCaptain === true or isAmbassador === true)
 * 4. `captainApplications/{id}` (status === 'approved')
 */
export async function collectFirestoreCaptains(db) {
  const captainUids = new Set();
  const captainEmails = new Set();
  const sourcesSummary = {
    'captains (collection)': 0,
    'users.role/isCaptain': 0,
    'publicProfiles.role/isCaptain': 0,
    'captainApplications (status==approved)': 0,
  };

  // 1. Firestore `captains` collection
  try {
    const captainsSnap = await db.collection('captains').get();
    for (const docSnap of captainsSnap.docs) {
      const data = docSnap.data() || {};
      const status = String(data.status || 'active').trim().toLowerCase();
      if (status === 'rejected' || status === 'revoked' || status === 'suspended') continue;
      const uid = String(data.userId || data.uid || docSnap.id || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      if (uid) captainUids.add(uid);
      if (email && email.includes('@')) captainEmails.add(email);
      sourcesSummary['captains (collection)'] += 1;
    }
  } catch (err) {
    console.warn('[reset-roles] Warning reading captains collection:', err);
  }

  // 2. Firestore `users` collection (`role === 'captain' | 'ambassador'`, `isCaptain === true`, `isAmbassador === true`)
  try {
    const usersSnap = await db.collection('users').get();
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data() || {};
      const role = String(data.role || '').trim().toLowerCase();
      const isMarkedCaptain =
        role === 'captain' ||
        role === 'ambassador' ||
        data.isCaptain === true ||
        data.isAmbassador === true;
      if (isMarkedCaptain) {
        const uid = String(data.uid || docSnap.id || '').trim();
        const email = String(data.email || '').trim().toLowerCase();
        if (uid) captainUids.add(uid);
        if (email && email.includes('@')) captainEmails.add(email);
        sourcesSummary['users.role/isCaptain'] += 1;
      }
    }
  } catch (err) {
    console.warn('[reset-roles] Warning reading users collection:', err);
  }

  // 3. Firestore `publicProfiles` collection
  try {
    const profilesSnap = await db.collection('publicProfiles').get();
    for (const docSnap of profilesSnap.docs) {
      const data = docSnap.data() || {};
      const role = String(data.role || '').trim().toLowerCase();
      const isMarkedCaptain =
        role === 'captain' ||
        role === 'ambassador' ||
        data.isCaptain === true ||
        data.isAmbassador === true;
      if (isMarkedCaptain) {
        const uid = String(data.uid || docSnap.id || '').trim();
        const email = String(data.email || '').trim().toLowerCase();
        if (uid) captainUids.add(uid);
        if (email && email.includes('@')) captainEmails.add(email);
        sourcesSummary['publicProfiles.role/isCaptain'] += 1;
      }
    }
  } catch (err) {
    console.warn('[reset-roles] Warning reading publicProfiles collection:', err);
  }

  // 4. Firestore `captainApplications` collection where status == 'approved'
  try {
    const appsSnap = await db
      .collection('captainApplications')
      .where('status', '==', 'approved')
      .get();
    for (const docSnap of appsSnap.docs) {
      const data = docSnap.data() || {};
      const uid = String(data.userId || data.uid || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      if (uid) captainUids.add(uid);
      if (email && email.includes('@')) captainEmails.add(email);
      sourcesSummary['captainApplications (status==approved)'] += 1;
    }
  } catch (err) {
    console.warn('[reset-roles] Warning reading captainApplications collection:', err);
  }

  return { captainUids, captainEmails, sourcesSummary };
}

export async function runResetRoles(options) {
  const dryRun = options?.dryRun ?? process.argv.includes('--dry-run');
  const ownerEmailTarget = resolveOwnerEmail(options?.ownerEmail ?? process.env.OWNER_EMAIL);
  const logger = options?.logger ?? console;

  let auth = options?.authClient;
  let db = options?.firestoreDb;

  if (!auth || !db) {
    initFirebaseAdmin();
    auth = auth || admin.auth();
    db = db || admin.firestore();
  }

  logger.log(
    `[reset-roles] Starting role sync (${dryRun ? 'DRY RUN - no writes will be made' : 'LIVE MODE'}). Target OWNER_EMAIL: ${ownerEmailTarget}`
  );

  // 1. Discover captains in Firestore
  const { captainUids, captainEmails, sourcesSummary } = await collectFirestoreCaptains(db);
  logger.log(
    `[reset-roles] Captains discovered in Firestore: ${captainUids.size} UIDs, ${captainEmails.size} emails across sources: ${JSON.stringify(
      sourcesSummary
    )}`
  );

  // 2. Paginate all Firebase Auth users into memory first so we can verify OWNER_EMAIL exists before mutating
  const allUsers = [];
  let pageToken = undefined;

  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    allUsers.push(...listUsersResult.users);
    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  // 3. Verify OWNER_EMAIL matches at least one Firebase Auth user (case-insensitive)
  const matchedOwnerUsers = allUsers.filter(
    (u) => String(u.email || '').trim().toLowerCase() === ownerEmailTarget
  );

  if (matchedOwnerUsers.length === 0) {
    const errMsg = `[reset-roles] ERROR: No Firebase Auth user matched OWNER_EMAIL="${ownerEmailTarget}" (checked ${allUsers.length} users). Aborting.`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  const matchedOwner = matchedOwnerUsers[0];
  logger.log(
    `[reset-roles] Matched OWNER_EMAIL: ${matchedOwner.email} (uid: ${matchedOwner.uid})`
  );

  let updatedClaimsCount = 0;
  let revokedCount = 0;
  let unchangedCount = 0;
  let captainsPreservedCount = 0;
  const userPlanRows = [];

  for (const userRecord of allUsers) {
    const uid = userRecord.uid;
    const emailRaw = String(userRecord.email || '').trim();
    const emailLower = emailRaw.toLowerCase();
    const currentClaims = userRecord.customClaims || {};

    const isOwner = emailLower === ownerEmailTarget;
    const isCaptain =
      !isOwner &&
      (currentClaims.captain === true ||
        captainUids.has(uid) ||
        (emailLower.length > 0 && captainEmails.has(emailLower)));

    let targetClaims = {};
    if (isOwner) {
      targetClaims = { superAdmin: true, admin: true, captain: true };
    } else if (isCaptain) {
      targetClaims = { captain: true };
      captainsPreservedCount += 1;
    } else {
      targetClaims = {};
    }

    const changed = !areClaimsEqual(currentClaims, targetClaims);
    userPlanRows.push({
      uid,
      email: emailRaw || 'no-email',
      currentClaims,
      targetClaims,
      changed,
    });

    if (dryRun) {
      logger.log(
        `[DRY-RUN] uid=${uid} email=${emailRaw || 'no-email'} current=${JSON.stringify(
          currentClaims
        )} -> wouldSet=${JSON.stringify(targetClaims)} changed=${changed}${
          changed ? ' (would revoke refresh tokens)' : ' (no token revocation needed)'
        }`
      );
      if (changed) {
        updatedClaimsCount += 1;
        revokedCount += 1;
      } else {
        unchangedCount += 1;
      }
      continue;
    }

    if (changed) {
      await auth.setCustomUserClaims(uid, targetClaims);
      await auth.revokeRefreshTokens(uid);
      updatedClaimsCount += 1;
      revokedCount += 1;

      // Signal client listeners via users/{uid}.claimsUpdatedAt
      try {
        await db
          .collection('users')
          .doc(uid)
          .set(
            {
              claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              claimsUpdatedAtMs: Date.now(),
              role: isOwner ? 'super_admin' : isCaptain ? 'captain' : 'student',
              isAdmin: isOwner,
              superAdmin: isOwner,
              isSuperAdmin: isOwner,
              isCaptain: isOwner || isCaptain,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      } catch {
        // Non-fatal if Firestore doc write fails
      }

      logger.log(
        `[reset-roles] Updated uid=${uid} (${emailRaw || 'no-email'}): claims=${JSON.stringify(
          targetClaims
        )} (refresh tokens revoked)`
      );
    } else {
      unchangedCount += 1;
      logger.log(
        `[reset-roles] Unchanged uid=${uid} (${emailRaw || 'no-email'}): claims=${JSON.stringify(
          targetClaims
        )} (skipped token revocation)`
      );
    }
  }

  logger.log(
    `\n[reset-roles] ${dryRun ? 'Dry-run summary' : 'Completed successfully'}:\n` +
      `  - Matched OWNER_EMAIL: ${matchedOwner.email} (uid: ${matchedOwner.uid})\n` +
      `  - Total Auth users inspected: ${allUsers.length}\n` +
      `  - Captains preserved/granted { captain: true }: ${captainsPreservedCount}\n` +
      `  - Users with claims updated & refresh tokens revoked: ${updatedClaimsCount}\n` +
      `  - Users unchanged (tokens NOT revoked): ${unchangedCount}`
  );

  return {
    dryRun,
    matchedOwnerEmail: matchedOwner.email || ownerEmailTarget,
    matchedOwnerUid: matchedOwner.uid,
    totalAuthUsers: allUsers.length,
    captainsPreservedCount,
    updatedClaimsCount,
    revokedCount,
    unchangedCount,
    sourcesSummary,
    userPlanRows,
  };
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  runResetRoles().catch((err) => {
    console.error('[reset-roles] Fatal error:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
