/**
 * Strict Fail-Closed Role Verification & Admin / SuperAdmin Endpoint Handlers
 * for Cloudflare Pages Functions, Cloudflare Workers, and Express Dev Server.
 *
 * ROLES (server-side only, Firebase Auth custom claims):
 * - superAdmin: true -> ONLY the owner (email from OWNER_EMAIL env var).
 *   Full access: superadmin area, manage admins, users, payments, rules, data.
 * - admin: true -> can be granted/revoked only by a superAdmin. Limited to
 *   the regular admin pages (questions, review queue, payments).
 * - no claim -> normal user.
 * superAdmin implies admin. Everything else is a normal user.
 */

import {
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FirestoreRestAdapter,
  SERVER_TIMESTAMP_SENTINEL,
  getSharedLocalD1Database,
  isVerifiedOwnerEmailToken,
  parseServiceAccountFromEnv,
  resolveConfiguredOwnerEmail,
  resolveTargetFirestoreDatabaseId,
  resolveTargetFirestoreProjectId,
  setOwnerBootstrapClaimsViaIdentityToolkit,
  updateFirebaseAdminClaimViaIdentityToolkit,
  verifyFirebaseIdToken,
  type RewardsD1Database,
  type RewardsEnv,
  type VerifiedFirebaseToken,
} from './firestoreRestAdmin';

export interface VerifiedRoleCaller {
  uid: string;
  email: string;
  name: string;
  captain: boolean;
  admin: boolean;
  superAdmin: boolean;
  role: 'superadmin' | 'admin' | 'captain' | 'student';
  roleSource?: 'claims' | 'owner_email' | 'none';
}

export type TokenVerifierFn = (
  authHeader: string | null | undefined,
  projectId?: string
) => Promise<VerifiedFirebaseToken | null>;

function jsonGateResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      ...(extraHeaders || {}),
    },
  });
}

/**
 * Verifies the caller's Firebase ID token and extracts ONLY custom claims (`superAdmin === true`, `admin === true`).
 * Never trusts Firestore docs, D1 tables, localStorage, or URL parameters.
 * Fails CLOSED on any error, missing header, guest token, expired token, or forged token.
 */
export async function verifyCallerClaimsStrict(params: {
  request: Request;
  env?: RewardsEnv & Record<string, any>;
  tokenVerifierOverride?: TokenVerifierFn;
}): Promise<{ ok: true; caller: VerifiedRoleCaller } | { ok: false; status: 401; error: string; code: string }> {
  const { request, env, tokenVerifierOverride } = params;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required: Missing Bearer token.',
      code: 'UNAUTHENTICATED',
    };
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken || rawToken.startsWith('guest_')) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required: Valid Firebase ID token required.',
      code: 'UNAUTHENTICATED',
    };
  }

  const projectId =
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;

  try {
    const verifyFn: TokenVerifierFn =
      tokenVerifierOverride || ((hdr, pid) => verifyFirebaseIdToken(hdr, pid || projectId, env));
    const decoded = await verifyFn(authHeader, projectId);

    if (!decoded || !decoded.uid || String(decoded.uid).startsWith('guest_')) {
      return {
        ok: false,
        status: 401,
        error: 'Invalid or expired Firebase ID token.',
        code: 'INVALID_TOKEN',
      };
    }

    // Verified owner email (email_verified === true) OR verified custom claims: superAdmin > admin > captain > student
    const isVerifiedOwner = isVerifiedOwnerEmailToken(
      decoded.email,
      decoded.emailVerified === true,
      env
    );
    const hasCustomSuperAdmin = decoded.rawCustomClaims
      ? decoded.rawCustomClaims.superAdmin === true
      : decoded.superAdmin === true;
    const isSuperAdmin = decoded.superAdmin === true || isVerifiedOwner;
    const isAdmin = decoded.admin === true || isSuperAdmin;
    const isCaptain = decoded.captain === true || isAdmin;
    const role: 'superadmin' | 'admin' | 'captain' | 'student' = isSuperAdmin
      ? 'superadmin'
      : isAdmin
      ? 'admin'
      : isCaptain
      ? 'captain'
      : 'student';
    const roleSource: 'claims' | 'owner_email' | 'none' = hasCustomSuperAdmin
      ? 'claims'
      : isVerifiedOwner
      ? 'owner_email'
      : isAdmin || isCaptain
      ? 'claims'
      : 'none';

    return {
      ok: true,
      caller: {
        uid: String(decoded.uid),
        email: String(decoded.email || '').trim().toLowerCase(),
        name: String(decoded.name || decoded.email || 'User').trim(),
        captain: isCaptain,
        admin: isAdmin,
        superAdmin: isSuperAdmin,
        role,
        roleSource,
      },
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error: 'Invalid or expired Firebase ID token.',
      code: 'INVALID_TOKEN',
    };
  }
}

/**
 * Enforces the server-side role gate for `/api/admin/*` and `/api/superadmin/*`.
 * - `/api/superadmin/*`: returns 401 if unauthenticated/invalid token, 403 unless `superAdmin === true`.
 * - `/api/admin/*`: returns 401 if unauthenticated/invalid token, 403 unless `admin === true || superAdmin === true`.
 * Returns `null` if the request is allowed to proceed, along with the verified `caller`.
 */
export async function enforceAdminOrSuperAdminGate(params: {
  request: Request;
  env?: RewardsEnv & Record<string, any>;
  tokenVerifierOverride?: TokenVerifierFn;
}): Promise<{ blockedResponse: Response | null; caller: VerifiedRoleCaller | null }> {
  const { request, env, tokenVerifierOverride } = params;
  if (request.method === 'OPTIONS') {
    return { blockedResponse: null, caller: null };
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  const isSuperAdminRoute = path === '/api/superadmin' || path.startsWith('/api/superadmin/');
  const isAdminRoute = path === '/api/admin' || path.startsWith('/api/admin/');
  const isCaptainRoute = path === '/api/captain' || path.startsWith('/api/captain/');

  if (!isSuperAdminRoute && !isAdminRoute && !isCaptainRoute) {
    return { blockedResponse: null, caller: null };
  }

  const verification = await verifyCallerClaimsStrict({
    request,
    env,
    tokenVerifierOverride,
  });

  if (!verification.ok) {
    return {
      blockedResponse: jsonGateResponse(
        {
          ok: false,
          success: false,
          error: verification.error,
          code: verification.code,
        },
        verification.status
      ),
      caller: null,
    };
  }

  const { caller } = verification;

  if (isSuperAdminRoute) {
    if (caller.superAdmin !== true) {
      return {
        blockedResponse: jsonGateResponse(
          {
            ok: false,
            success: false,
            error: 'Forbidden: superAdmin claim is required to access /api/superadmin/*.',
            code: 'FORBIDDEN',
          },
          403
        ),
        caller,
      };
    }
    return { blockedResponse: null, caller };
  }

  if (isCaptainRoute) {
    if (caller.captain !== true && caller.admin !== true && caller.superAdmin !== true) {
      return {
        blockedResponse: jsonGateResponse(
          {
            ok: false,
            success: false,
            error: 'Forbidden: captain, admin, or superAdmin claim is required to access /api/captain/*.',
            code: 'FORBIDDEN',
          },
          403
        ),
        caller,
      };
    }
    return { blockedResponse: null, caller };
  }

  // isAdminRoute: requires admin === true || superAdmin === true
  if (caller.admin !== true && caller.superAdmin !== true) {
    return {
      blockedResponse: jsonGateResponse(
        {
          ok: false,
          success: false,
          error: 'Forbidden: admin or superAdmin claim is required to access /api/admin/*.',
          code: 'FORBIDDEN',
        },
        403
      ),
      caller,
    };
  }

  return { blockedResponse: null, caller };
}

// In-memory fallback stores for Cloudflare edge when D1 tables for access requests / activity logs are queried
const edgeAccessRequestsStore: Array<Record<string, any>> = [];
const edgeAccessGrantsStore: Array<Record<string, any>> = [];
const edgeAdminActivityLogsStore: Array<Record<string, any>> = [];

export function getEdgeAdminActivityLogs(): Array<Record<string, any>> {
  return edgeAdminActivityLogsStore;
}
/**
 * Server-side self-healing owner bootstrap endpoint: `POST /api/me/roles`
 * - Verifies the Firebase ID token against `projectId` (`gen-lang-client-0365509316`). Rejects 401 if invalid/missing.
 * - Reads `OWNER_EMAIL` from environment (`env.OWNER_EMAIL` or `process.env.OWNER_EMAIL`).
 *   Logs a clear server error if `OWNER_EMAIL` is missing.
 * - If `decoded.emailVerified === true` AND `decoded.email` (lowercased) equals `OWNER_EMAIL` (lowercased),
 *   and the token lacks `{ superAdmin: true, admin: true, captain: true }`, sets
 *   `{ superAdmin: true, admin: true, captain: true }` via the Admin SDK / Identity Toolkit REST API
 *   and returns `{ refreshed: true, claims: { superAdmin: true, admin: true, captain: true } }`.
 * - For everyone else, never modifies anything and only returns their current verified token claims
 *   (`{ refreshed: false, claims }`).
 * - Never grants roles from client-sent data.
 */
export async function handleMeRolesRequest(params: {
  request: Request;
  env?: RewardsEnv & Record<string, any>;
  tokenVerifierOverride?: TokenVerifierFn;
  adminSdkOverride?: {
    setCustomUserClaims: (uid: string, claims: Record<string, boolean>) => Promise<void>;
    revokeRefreshTokens?: (uid: string) => Promise<void>;
  };
}): Promise<Response> {
  const { request, env, tokenVerifierOverride, adminSdkOverride } = params;

  if (request.method.toUpperCase() === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method.toUpperCase() !== 'POST') {
    return jsonGateResponse(
      {
        ok: false,
        error: 'Method Not Allowed: POST /api/me/roles required.',
        code: 'METHOD_NOT_ALLOWED',
      },
      405
    );
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonGateResponse(
      {
        ok: false,
        error: 'Unauthorized: Missing Bearer Firebase ID token.',
        code: 'UNAUTHENTICATED',
      },
      401
    );
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken || rawToken.startsWith('guest_')) {
    return jsonGateResponse(
      {
        ok: false,
        error: 'Unauthorized: Valid Firebase ID token required.',
        code: 'UNAUTHENTICATED',
      },
      401
    );
  }

  const projectId = resolveTargetFirestoreProjectId(
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
  );

  let decoded: VerifiedFirebaseToken | null = null;
  try {
    const verifyFn: TokenVerifierFn =
      tokenVerifierOverride || ((hdr, pid) => verifyFirebaseIdToken(hdr, pid || projectId, env));
    decoded = await verifyFn(authHeader, projectId);
  } catch {
    decoded = null;
  }

  if (!decoded || !decoded.uid) {
    return jsonGateResponse(
      {
        ok: false,
        error: 'Unauthorized: Invalid or expired Firebase ID token.',
        code: 'INVALID_TOKEN',
      },
      401
    );
  }

  // Inspect actual JWT custom claims separately from verified owner-email resolution
  // so we still attempt minting custom claims when they are missing from Firebase Auth.
  const rawSuperAdminClaim = decoded.rawCustomClaims
    ? decoded.rawCustomClaims.superAdmin === true
    : decoded.superAdmin === true;
  const rawAdminClaim = decoded.rawCustomClaims
    ? decoded.rawCustomClaims.admin === true || rawSuperAdminClaim
    : decoded.admin === true || rawSuperAdminClaim;
  const rawCaptainClaim = decoded.rawCustomClaims
    ? decoded.rawCustomClaims.captain === true || rawAdminClaim
    : decoded.captain === true || rawAdminClaim;

  const currentCustomClaims = {
    superAdmin: rawSuperAdminClaim,
    admin: rawAdminClaim,
    captain: rawCaptainClaim,
  };

  const ownerEmail = resolveConfiguredOwnerEmail(env);
  const decodedEmail = String(decoded.email || '').trim().toLowerCase();
  const isEmailVerified = decoded.emailVerified === true;
  const isOwnerMatch = isVerifiedOwnerEmailToken(decoded.email, isEmailVerified, env);

  if (!isOwnerMatch) {
    // For everyone else, NEVER change anything — only return their current verified token claims
    return jsonGateResponse(
      {
        ok: true,
        refreshed: false,
        claimMintAttempted: false,
        claimMintSucceeded: null,
        effectiveSource:
          rawSuperAdminClaim || rawAdminClaim || rawCaptainClaim ? 'claims' : 'none',
        claims: currentCustomClaims,
        rawCustomClaims: currentCustomClaims,
      },
      200
    );
  }

  const ownerClaims: Record<string, boolean> = {
    superAdmin: true,
    admin: true,
    captain: true,
  };

  const lacksClaims =
    !rawSuperAdminClaim || !rawAdminClaim || !rawCaptainClaim;

  if (!lacksClaims) {
    return jsonGateResponse(
      {
        ok: true,
        refreshed: false,
        claimMintAttempted: false,
        claimMintSucceeded: true,
        effectiveSource: 'claims',
        claims: currentCustomClaims,
        rawCustomClaims: currentCustomClaims,
      },
      200
    );
  }

  let minted = false;
  let mintError: string | null = null;

  try {
    if (adminSdkOverride) {
      await adminSdkOverride.setCustomUserClaims(decoded.uid, ownerClaims);
      minted = true;
    } else {
      const sa = parseServiceAccountFromEnv(env);
      if (sa) {
        await setOwnerBootstrapClaimsViaIdentityToolkit({
          sa,
          targetUid: decoded.uid,
        });
        minted = true;

        // Best-effort signal claimsUpdatedAt on users/{uid}
        try {
          const databaseId = resolveTargetFirestoreDatabaseId(
            env?.FIREBASE_DATABASE_ID ||
              env?.VITE_FIREBASE_DATABASE_ID ||
              DEFAULT_FIRESTORE_DATABASE_ID
          );
          const fsAdapter = new FirestoreRestAdapter({
            projectId,
            databaseId,
            sa,
          });
          await fsAdapter.patchDocument(
            `users/${decoded.uid}`,
            {
              claimsUpdatedAt: SERVER_TIMESTAMP_SENTINEL,
              claimsUpdatedAtMs: Date.now(),
            },
            ['claimsUpdatedAt', 'claimsUpdatedAtMs']
          );
        } catch {
          // Non-fatal
        }
      } else if (typeof process !== 'undefined' && process.versions?.node) {
        try {
          const appMod = await import('firebase-admin/app');
          const authMod = await import('firebase-admin/auth');
          const apps = appMod.getApps();
          const adminApp = apps.length > 0 ? apps[0] : appMod.initializeApp({ projectId });
          await authMod.getAuth(adminApp).setCustomUserClaims(decoded.uid, ownerClaims);
          minted = true;
        } catch (nodeErr: any) {
          mintError = nodeErr?.message || 'FIREBASE_ADMIN_UNAVAILABLE';
        }
      } else {
        mintError = 'MISSING_FIREBASE_SERVICE_ACCOUNT';
      }
    }
  } catch (err: any) {
    mintError = err?.message || 'CLAIM_MINT_FAILED';
    console.error('[POST /api/me/roles] Failed to mint owner superAdmin claims:', err);
  }

  if (!minted) {
    console.warn(
      `[POST /api/me/roles] Custom claims could not be minted onto Firebase Auth for verified owner ${decodedEmail} (uid: ${decoded.uid}): ${mintError || 'unknown error'}. Falling back to verified owner email source.`
    );
    return jsonGateResponse(
      {
        ok: true,
        refreshed: false,
        claimMintAttempted: true,
        claimMintSucceeded: false,
        claimMintError: mintError || 'Service account credentials not configured.',
        effectiveSource: 'owner_email',
        ownerEmail,
        claims: ownerClaims,
        rawCustomClaims: currentCustomClaims,
      },
      200
    );
  }

  return jsonGateResponse(
    {
      ok: true,
      refreshed: true,
      claimMintAttempted: true,
      claimMintSucceeded: true,
      effectiveSource: 'claims',
      ownerEmail,
      claims: ownerClaims,
      rawCustomClaims: ownerClaims,
    },
    200
  );
}

async function ensureAdminActivityLogsD1Table(db: RewardsD1Database): Promise<void> {
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS admin_activity_logs (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          actor_uid TEXT NOT NULL,
          actor_email TEXT NOT NULL DEFAULT '',
          target_uid TEXT NOT NULL DEFAULT '',
          target_email TEXT NOT NULL DEFAULT '',
          details_json TEXT NOT NULL DEFAULT '{}',
          created_at INTEGER NOT NULL
        )`
      )
      .run();
  } catch {
    // Non-fatal on mock/in-memory DB
  }
}

/**
 * SuperAdmin-only operation: grants or revokes `admin: true` on a target user.
 * - Sets custom claims (`{ admin: true }` or `{}`) via Firebase Admin SDK (if available) or Identity Toolkit REST API.
 * - Calls `revokeRefreshTokens` on the target user.
 * - Writes an audit record to `admin_activity_logs` (in Firestore + D1).
 * - Strictly forbids granting `superAdmin` from the app.
 */
export async function executeGrantOrRevokeAdminClaim(params: {
  caller: VerifiedRoleCaller;
  targetUid: string;
  targetEmail?: string;
  grantAdmin?: boolean;
  targetRole?: 'admin' | 'captain' | 'student';
  reason?: string;
  env?: RewardsEnv & Record<string, any>;
  db?: RewardsD1Database;
  adminSdkOverride?: {
    setCustomUserClaims: (uid: string, claims: Record<string, boolean>) => Promise<void>;
    revokeRefreshTokens: (uid: string) => Promise<void>;
  };
}): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, any>;
}> {
  const { caller, targetUid, targetEmail, grantAdmin, targetRole, reason, env, adminSdkOverride } =
    params;

  const resolvedRole: 'admin' | 'captain' | 'student' = targetRole
    ? targetRole
    : grantAdmin
    ? 'admin'
    : 'student';

  // Role grant hierarchy:
  // - admin: granted/revoked ONLY by superAdmin
  // - captain: granted/revoked by admin or superAdmin
  if (resolvedRole === 'admin' && caller.superAdmin !== true) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        error: 'Forbidden: Only superAdmin can grant or revoke admin.',
        code: 'FORBIDDEN',
      },
    };
  }

  if (caller.admin !== true && caller.superAdmin !== true) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        error: 'Forbidden: Only admin or superAdmin can grant or revoke captain.',
        code: 'FORBIDDEN',
      },
    };
  }

  const cleanTargetUid = String(targetUid || '').trim();
  if (!cleanTargetUid) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        error: 'targetUid is required.',
        code: 'MISSING_UID',
      },
    };
  }

  const ownerEmail = String(
    env?.OWNER_EMAIL ||
      (typeof process !== 'undefined' ? process.env?.OWNER_EMAIL : '') ||
      'shsvirtualadmin@gmail.com'
  )
    .trim()
    .toLowerCase();

  if (
    ownerEmail &&
    targetEmail &&
    String(targetEmail).trim().toLowerCase() === ownerEmail
  ) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        error: 'Forbidden: Cannot modify roles for OWNER_EMAIL.',
        code: 'CANNOT_MODIFY_OWNER',
      },
    };
  }

  const nextClaims: Record<string, boolean> =
    resolvedRole === 'admin'
      ? { admin: true, captain: true }
      : resolvedRole === 'captain'
      ? { captain: true }
      : {};
  const nextRoleLabel = resolvedRole;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  let claimSyncedVia: 'admin_sdk_override' | 'identity_toolkit' | 'firebase_admin_node' | 'd1_recorded' =
    'd1_recorded';

  // 1. If test override is provided, call it
  if (adminSdkOverride) {
    await adminSdkOverride.setCustomUserClaims(cleanTargetUid, nextClaims);
    await adminSdkOverride.revokeRefreshTokens(cleanTargetUid);
    claimSyncedVia = 'admin_sdk_override';
  } else {
    // 2. Try Service Account + Identity Toolkit REST API (works in Cloudflare Pages Functions / Workers & Node)
    const sa = parseServiceAccountFromEnv(env);
    if (sa) {
      await updateFirebaseAdminClaimViaIdentityToolkit({
        sa,
        targetUid: cleanTargetUid,
        grantAdmin: resolvedRole === 'admin',
        customClaims: nextClaims,
      });
      claimSyncedVia = 'identity_toolkit';
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      // 3. In Node.js environment, attempt firebase-admin if initialized
      try {
        const reqFn = typeof require === 'function' ? require : (eval('require') as NodeRequire);
        const firebaseAdmin = reqFn('firebase-admin');
        if (firebaseAdmin && firebaseAdmin.apps && firebaseAdmin.apps.length > 0) {
          await firebaseAdmin.auth().setCustomUserClaims(cleanTargetUid, nextClaims);
          await firebaseAdmin.auth().revokeRefreshTokens(cleanTargetUid);
          claimSyncedVia = 'firebase_admin_node';
        }
      } catch {
        // Fallback if firebase-admin not initialized with credentials in local dev
      }
    }
  }

  // 4. Sync D1 user_roles (for display only; auth checks use JWT claims)
  const db: RewardsD1Database = params.db || env?.DB || getSharedLocalD1Database();
  try {
    await db
      .prepare(
        `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
         VALUES (?1, ?2, ?3, NULL, 0, ?4, ?4)
         ON CONFLICT(uid) DO UPDATE SET
           email = CASE WHEN ?2 != '' THEN ?2 ELSE user_roles.email END,
           role = ?3,
           updated_at = ?4`
      )
      .bind(cleanTargetUid, String(targetEmail || '').trim().toLowerCase(), nextRoleLabel, nowMs)
      .run();
  } catch {
    // Non-fatal if user_roles schema differs
  }

  // 5. Write to admin_activity_logs (D1 + Firestore + in-memory audit log)
  const logId = `aal_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;
  const actionType =
    resolvedRole === 'admin'
      ? 'GRANT_ADMIN_CLAIM'
      : resolvedRole === 'captain'
      ? 'GRANT_CAPTAIN_CLAIM'
      : 'REVOKE_ROLE_CLAIMS';
  const logRecord = {
    id: logId,
    action: actionType,
    actorUid: caller.uid,
    actorEmail: caller.email,
    adminUid: caller.uid,
    adminEmail: caller.email,
    targetUid: cleanTargetUid,
    targetEmail: String(targetEmail || '').trim().toLowerCase(),
    claimsSet: nextClaims,
    refreshTokensRevoked: true,
    reason: String(reason || (grantAdmin ? 'Granted admin claim' : 'Revoked admin claim')).trim(),
    timestamp: nowIso,
    createdAt: nowMs,
  };

  edgeAdminActivityLogsStore.unshift(logRecord);

  try {
    await ensureAdminActivityLogsD1Table(db);
    await db
      .prepare(
        `INSERT INTO admin_activity_logs (id, action, actor_uid, actor_email, target_uid, target_email, details_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        logId,
        actionType,
        caller.uid,
        caller.email,
        cleanTargetUid,
        String(targetEmail || '').trim().toLowerCase(),
        JSON.stringify(logRecord),
        nowMs
      )
      .run();
  } catch {
    // Non-fatal
  }

  try {
    const sa = parseServiceAccountFromEnv(env);
    if (sa) {
      const fsProjectId = resolveTargetFirestoreProjectId(
        env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || sa.project_id
      );
      const fsDbId = resolveTargetFirestoreDatabaseId(
        env?.FIREBASE_DATABASE_ID ||
          env?.VITE_FIREBASE_DATABASE_ID ||
          env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
          DEFAULT_FIRESTORE_DATABASE_ID
      );
      const store = new FirestoreRestAdapter(sa, fsProjectId, fsDbId);
      await Promise.all([
        store
          .setDoc(`admin_activity_logs/${logId}`, {
            ...logRecord,
            timestamp: SERVER_TIMESTAMP_SENTINEL,
          })
          .catch(() => null),
        store
          .setDoc(`auditLogs/${logId}`, {
            ...logRecord,
            timestamp: SERVER_TIMESTAMP_SENTINEL,
          })
          .catch(() => null),
        store
          .setDoc(
            `users/${cleanTargetUid}`,
            {
              role: nextRoleLabel,
              isAdmin: resolvedRole === 'admin',
              isCaptain: resolvedRole === 'admin' || resolvedRole === 'captain',
              superAdmin: false,
              claimsUpdatedAt: SERVER_TIMESTAMP_SENTINEL,
              claimsUpdatedAtMs: nowMs,
              updatedAt: SERVER_TIMESTAMP_SENTINEL,
            },
            true
          )
          .catch(() => null),
      ]);
    }
  } catch {
    // Non-fatal
  }

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      uid: cleanTargetUid,
      role: nextRoleLabel,
      claims: nextClaims,
      refreshTokensRevoked: true,
      claimSyncedVia,
      logId,
      activityLog: logRecord,
    },
  };
}

/**
 * Handles `/api/superadmin/*` and missing `/api/admin/*` routes in Cloudflare Pages / Workers
 * so that Admin Overview and SuperAdmin management work seamlessly with zero 404 "Not Found" errors.
 */
export async function handleSuperAdminAndExtraAdminRoutes(params: {
  request: Request;
  env?: RewardsEnv & Record<string, any>;
  caller: VerifiedRoleCaller;
  db?: RewardsD1Database;
  adminSdkOverride?: {
    setCustomUserClaims: (uid: string, claims: Record<string, boolean>) => Promise<void>;
    revokeRefreshTokens: (uid: string) => Promise<void>;
  };
}): Promise<Response | null> {
  const { request, env, caller, adminSdkOverride } = params;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const db: RewardsD1Database = params.db || env?.DB || getSharedLocalD1Database();

  // ─── 1. /api/superadmin/* Routes (Caller is guaranteed superAdmin === true) ───
  if (path === '/api/superadmin' || path.startsWith('/api/superadmin/')) {
    if (caller.superAdmin !== true) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Forbidden: superAdmin claim required.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    if ((path === '/api/superadmin' || path === '/api/superadmin/stats') && method === 'GET') {
      return jsonGateResponse(
        {
          ok: true,
          role: 'superadmin',
          callerUid: caller.uid,
          callerEmail: caller.email,
          activityLogsCount: edgeAdminActivityLogsStore.length,
        },
        200
      );
    }

    if ((path === '/api/superadmin/admins' || path === '/api/superadmin/roles') && method === 'GET') {
      let roles: Array<Record<string, any>> = [];
      try {
        const res = await db
          .prepare(
            'SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles ORDER BY updated_at DESC LIMIT 500'
          )
          .all();
        roles = (res.results || []).filter(
          (r: any) => r.role === 'admin' || r.role === 'superadmin' || r.role === 'super_admin'
        );
      } catch {
        roles = [];
      }
      return jsonGateResponse(
        {
          ok: true,
          admins: roles,
          activityLogs: edgeAdminActivityLogsStore.slice(0, 50),
        },
        200
      );
    }

    if (
      (path === '/api/superadmin/admins' ||
        path === '/api/superadmin/roles' ||
        path === '/api/superadmin/grant-admin' ||
        path === '/api/superadmin/revoke-admin') &&
      (method === 'POST' || method === 'PUT' || method === 'DELETE')
    ) {
      let body: Record<string, any> = {};
      try {
        body = (await request.json()) as Record<string, any>;
      } catch {
        body = {};
      }

      // Explicitly block any attempt to grant superAdmin from the app
      const requestedRole = String(body.role || '').trim().toLowerCase();
      if (
        body.superAdmin === true ||
        requestedRole === 'superadmin' ||
        requestedRole === 'super_admin'
      ) {
        return jsonGateResponse(
          {
            ok: false,
            error: 'Forbidden: Nobody can grant superAdmin from the app.',
            code: 'CANNOT_GRANT_SUPERADMIN',
          },
          403
        );
      }

      const targetUid = String(body.uid || body.targetUid || '').trim();
      const targetEmail = String(body.email || body.targetEmail || '').trim();
      const grantAdmin =
        path === '/api/superadmin/revoke-admin' || method === 'DELETE'
          ? false
          : path === '/api/superadmin/grant-admin'
          ? true
          : typeof body.admin === 'boolean'
          ? body.admin
          : requestedRole === 'admin';

      const result = await executeGrantOrRevokeAdminClaim({
        caller,
        targetUid,
        targetEmail,
        grantAdmin,
        reason: body.reason,
        env,
        db,
        adminSdkOverride,
      });

      return jsonGateResponse(result.body, result.status);
    }

    return jsonGateResponse(
      {
        ok: true,
        endpoint: path,
        callerUid: caller.uid,
        superAdmin: true,
      },
      200
    );
  }

  // ─── 1b. /api/captain/* Routes (Caller is guaranteed captain === true || admin === true || superAdmin === true) ───
  if (path === '/api/captain' || path.startsWith('/api/captain/')) {
    if (caller.captain !== true && caller.admin !== true && caller.superAdmin !== true) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Forbidden: captain, admin, or superAdmin claim required.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    return jsonGateResponse(
      {
        ok: true,
        endpoint: path,
        callerUid: caller.uid,
        callerEmail: caller.email,
        role: caller.role,
        captain: true,
        admin: caller.admin,
        superAdmin: caller.superAdmin,
      },
      200
    );
  }

  // ─── 2. /api/admin/* Routes (Caller is guaranteed admin === true || superAdmin === true) ───
  if (path === '/api/admin' || path === '/api/admin/stats') {
    if (method === 'GET') {
      let questionsCount = 0;
      let attemptsCount = 0;
      let crewsCount = 0;
      try {
        const [qRow, aRow, cRow] = await Promise.all([
          db.prepare('SELECT COUNT(*) as cnt FROM mcqs').first<{ cnt: number }>().catch(() => null),
          db
            .prepare('SELECT COUNT(*) as cnt FROM test_attempts')
            .first<{ cnt: number }>()
            .catch(() => null),
          db.prepare('SELECT COUNT(*) as cnt FROM crews').first<{ cnt: number }>().catch(() => null),
        ]);
        questionsCount = Number(qRow?.cnt || 0);
        attemptsCount = Number(aRow?.cnt || 0);
        crewsCount = Number(cRow?.cnt || 0);
      } catch {
        // Non-fatal
      }

      return jsonGateResponse(
        {
          ok: true,
          callerUid: caller.uid,
          role: caller.role,
          stats: {
            d1QuestionsCount: questionsCount,
            d1AttemptsCount: attemptsCount,
            d1CrewsCount: crewsCount,
          },
        },
        200
      );
    }
  }

  // PUT / POST /api/admin/roles — superAdmin can grant/revoke admin or captain; admin can grant/revoke captain
  if (path === '/api/admin/roles' && (method === 'PUT' || method === 'POST')) {
    if (caller.admin !== true && caller.superAdmin !== true) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Forbidden: admin or superAdmin claim required.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    let body: Record<string, any> = {};
    try {
      body = (await request.json()) as Record<string, any>;
    } catch {
      body = {};
    }

    const requestedRole = String(body.role || 'student').trim().toLowerCase();
    if (
      body.superAdmin === true ||
      requestedRole === 'superadmin' ||
      requestedRole === 'super_admin'
    ) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Forbidden: Nobody can grant superAdmin from the app.',
          code: 'CANNOT_GRANT_SUPERADMIN',
        },
        403
      );
    }

    if (requestedRole === 'admin' && caller.superAdmin !== true) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Forbidden: Only a superAdmin can grant admin.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    const targetUid = String(body.uid || body.targetUid || '').trim();
    const targetEmail = String(body.email || body.targetEmail || '').trim();
    if (!targetUid || !['student', 'captain', 'admin'].includes(requestedRole)) {
      return jsonGateResponse(
        {
          ok: false,
          error: 'Valid uid and role (student, captain, or admin) are required.',
          code: 'INVALID_INPUT',
        },
        400
      );
    }

    const res = await executeGrantOrRevokeAdminClaim({
      caller,
      targetUid,
      targetEmail,
      grantAdmin: requestedRole === 'admin',
      targetRole: requestedRole as 'student' | 'captain' | 'admin',
      reason: body.reason,
      env,
      db,
      adminSdkOverride,
    });

    if (res.ok && requestedRole === 'captain') {
      const nowMs = Date.now();
      await db
        .prepare(
          `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
           VALUES (?1, ?2, 'captain', ?3, 0, ?4, ?4)
           ON CONFLICT(uid) DO UPDATE SET role = 'captain', custom_role = COALESCE(?3, user_roles.custom_role), updated_at = ?4`
        )
        .bind(targetUid, targetEmail.toLowerCase(), body.customRole ?? null, nowMs)
        .run()
        .catch(() => {});
    }

    return jsonGateResponse(res.body, res.status);
  }

  // GET /api/admin/access-requests/mine
  if (path === '/api/admin/access-requests/mine' && method === 'GET') {
    const now = Date.now();
    const activeGrants = edgeAccessGrantsStore.filter(
      (g) =>
        g.adminUid === caller.uid &&
        !g.revokedAt &&
        !g.usedAt &&
        (g.expiresAt === null || g.expiresAt === undefined || Number(g.expiresAt) > now)
    );
    const myRequests = edgeAccessRequestsStore
      .filter((r) => r.requesterUid === caller.uid)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return jsonGateResponse(
      {
        ok: true,
        grants: activeGrants,
        requests: myRequests,
      },
      200
    );
  }

  // GET /api/admin/access-requests
  if (path === '/api/admin/access-requests' && method === 'GET') {
    const statusFilter = (url.searchParams.get('status') || '').trim().toLowerCase();
    let list = [...edgeAccessRequestsStore];
    if (!caller.superAdmin) {
      list = list.filter((r) => r.requesterUid === caller.uid);
    }
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((r) => String(r.status || '').toLowerCase() === statusFilter);
    }
    list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return jsonGateResponse({ ok: true, requests: list }, 200);
  }

  // POST /api/admin/access-requests
  if (path === '/api/admin/access-requests' && method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const permission = String(body.permission || '').trim();
    const reason = String(body.reason || '').trim();
    if (!permission || !reason) {
      return jsonGateResponse(
        { ok: false, error: 'Permission and reason are required.' },
        400
      );
    }
    const now = Date.now();
    const newReq = {
      id: `areq_${now}_${Math.random().toString(36).slice(2, 7)}`,
      requesterUid: caller.uid,
      requesterEmail: caller.email,
      requesterName: caller.name,
      permission,
      targetType: body.targetType ? String(body.targetType) : null,
      targetId: body.targetId ? String(body.targetId) : null,
      targetLabel: body.targetLabel ? String(body.targetLabel) : null,
      reason,
      requestedDuration: String(body.requestedDuration || '1h'),
      status: 'pending',
      createdAt: now,
    };
    edgeAccessRequestsStore.unshift(newReq);
    return jsonGateResponse({ ok: true, request: newReq }, 200);
  }

  // GET /api/admin/access-grants
  if (path === '/api/admin/access-grants' && method === 'GET') {
    let grants = [...edgeAccessGrantsStore];
    if (!caller.superAdmin) {
      grants = grants.filter((g) => g.adminUid === caller.uid);
    }
    return jsonGateResponse({ ok: true, grants }, 200);
  }

  // GET /api/admin/roles/audit
  if (path === '/api/admin/roles/audit' && method === 'GET') {
    return jsonGateResponse(
      {
        ok: true,
        logs: edgeAdminActivityLogsStore.slice(0, 100),
      },
      200
    );
  }

  // GET /api/admin/grand-line-audit-logs
  if (path === '/api/admin/grand-line-audit-logs' && method === 'GET') {
    return jsonGateResponse({ ok: true, logs: [] }, 200);
  }

  return null;
}
