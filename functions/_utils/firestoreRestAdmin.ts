/**
 * Boardly Rewards — D1 User Verification Helper, Idempotent Firestore Koban Credit Client,
 * and Local D1 Database Adapter (for local Vite dev & automated tests when env.DB is unbound).
 *
 * Security invariants:
 * - Reuses the exact Firebase ID token verification (Google SecureToken JWK RS256) +
 *   D1 `user_roles` query and Super Admin check used by the existing MCQ / D1 endpoints.
 * - `FIREBASE_SERVICE_ACCOUNT` is used ONLY for the server-side Firestore Kobans credit
 *   (`wallets/{uid}`, `users/{uid}`, `wallets/{uid}/ledger/{deterministicId}`).
 * - Never commits secrets.
 */

import type { RewardLedgerEntryType } from '../../src/lib/rewardsEngine';

export const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0365509316';
export const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

export const DEFAULT_SUPERADMIN_UIDS = ['A5YMRimdHRcmeDWutxtUGt2e4hf2'];
export const DEFAULT_SUPERADMIN_EMAILS = [
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
  'support@scholario.me',
];

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  role?: string;
  admin?: boolean;
  authTime?: number;
  iat?: number;
  signInProvider?: string;
}

export interface AuthenticatedD1User {
  uid: string;
  email: string;
  name: string;
  displayName: string;
  username: string;
  shortId?: string;
  accountType: 'guest' | 'registered';
  plan: 'free' | 'pro';
  picture: string | null;
  role: 'student' | 'captain' | 'admin' | 'superadmin';
  customRole: string | null;
  isPostingBanned: boolean;
  isSuperAdmin: boolean;
  isAdminOrAbove: boolean;
  emailVerified: boolean;
  sessionVerified: boolean;
  isGuest: boolean;
  signInProvider?: string;
  authTime?: number;
  d1CreatedAtMs: number;
  targetUniversity?: string;
  testsCompleted?: number;
  totalQuestionsSolved?: number;
  streak?: number;
  stats?: Record<string, any>;
  attempts?: any[];
  sessionToken?: string;
  sessionExpiresAt?: number;
}

export interface ServiceAccountCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface RewardsD1PreparedStatement {
  bind(...values: any[]): RewardsD1PreparedStatement;
  first<T = Record<string, any>>(colName?: string): Promise<T | null>;
  all<T = Record<string, any>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
}

export interface RewardsD1Database {
  prepare(query: string): RewardsD1PreparedStatement;
  batch(statements: RewardsD1PreparedStatement[]): Promise<any[]>;
}

export interface RewardsEnv {
  DB?: RewardsD1Database;
  FIREBASE_SERVICE_ACCOUNT?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  VITE_FIREBASE_DATABASE_ID?: string;
  VITE_FIREBASE_FIRESTORE_DATABASE_ID?: string;
  SUPERADMIN_UIDS?: string;
  SUPERADMIN_EMAILS?: string;
}

// ─── Base64URL & PEM Helpers ──────────────────────────────────────────────────

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return uint8ArrayToBase64Url(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Firebase ID Token Verification (Google SecureToken JWK) ──────────────────

let cachedGoogleJwks: { keys: Array<JsonWebKey & { kid?: string }>; expiresAt: number } | null =
  null;

async function getGooglePublicJwks(): Promise<Array<JsonWebKey & { kid?: string }>> {
  const now = Date.now();
  if (cachedGoogleJwks && cachedGoogleJwks.expiresAt > now) {
    return cachedGoogleJwks.keys;
  }
  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public JWKs: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  cachedGoogleJwks = {
    keys,
    expiresAt: now + 50 * 60 * 1000,
  };
  return keys;
}

export async function verifyFirebaseIdToken(
  authHeader: string | null | undefined,
  projectId: string = DEFAULT_FIREBASE_PROJECT_ID
): Promise<VerifiedFirebaseToken | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const headerJson = new TextDecoder().decode(base64UrlToUint8Array(parts[0]));
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(parts[1]));
    const header = JSON.parse(headerJson) as { alg?: string; kid?: string };
    const payload = JSON.parse(payloadJson) as {
      exp?: number;
      iat?: number;
      auth_time?: number;
      aud?: string;
      iss?: string;
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
      role?: string;
      admin?: boolean;
      firebase?: {
        sign_in_provider?: string;
      };
    };

    if (header.alg !== 'RS256' || !header.kid) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec - 30) return null;
    if (!payload.iat || payload.iat > nowSec + 300) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length === 0) return null;

    const keys = await getGooglePublicJwks();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature as unknown as BufferSource,
      signedData
    );
    if (!isValid) return null;

    const iatSec = Number(payload.iat || 0);
    const authTimeSec = Number(payload.auth_time || iatSec || 0);
    const signInProvider = payload.firebase?.sign_in_provider
      ? String(payload.firebase.sign_in_provider)
      : undefined;

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: Boolean(payload.email_verified),
      role: payload.role,
      admin: Boolean(payload.admin),
      authTime: authTimeSec,
      iat: iatSec,
      signInProvider,
    };
  } catch {
    return null;
  }
}

/**
 * Checks whether the user's current login/signup session has completed 6-digit email verification in D1.
 * - Google sign-in (`signInProvider === 'google.com'`) is verified by Google and needs no extra code.
 * - Email + password (`signInProvider === 'password'`) or any unverified email (`emailVerified === false`)
 *   must have a row in `email_verification_sessions` with `email_verified = 1` and
 *   `verified_auth_time + 5 >= authTime`.
 */
export async function isD1UserSessionVerified(
  db: RewardsD1Database,
  verified: VerifiedFirebaseToken
): Promise<boolean> {
  if (!verified || !verified.uid) return false;
  if (verified.signInProvider === 'google.com') {
    return true;
  }

  try {
    const sessionRow = await db
      .prepare(
        'SELECT user_id, email_verified, verified_auth_time FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
      .bind(verified.uid)
      .first<{ user_id: string; email_verified: number; verified_auth_time: number }>();

    if (sessionRow) {
      if (Number(sessionRow.email_verified) !== 1) {
        return false;
      }
      const tokenAuthTime = Number(verified.authTime || verified.iat || 0);
      if (tokenAuthTime > 0) {
        return Number(sessionRow.verified_auth_time || 0) + 5 >= tokenAuthTime;
      }
      return true;
    }
  } catch {
    // Table may not exist yet before first migration run
  }

  if (verified.emailVerified === false) {
    return false;
  }
  if (verified.signInProvider === 'password') {
    return false;
  }
  return true;
}

/**
 * Exact D1 user verification + Super Admin check helper reused across MCQ and Rewards endpoints.
 * Verifies the Bearer Firebase ID token and queries `user_roles` in D1 (`env.DB`).
 */
export function extractGuestSessionTokenFromRequest(request: Request): string | null {
  const headerToken = (request.headers.get('X-Guest-Session') || '').trim();
  if (headerToken) {
    return headerToken.startsWith('guest_guest_') ? headerToken.slice('guest_'.length) : headerToken;
  }

  const authHeader = (request.headers.get('Authorization') || '').trim();
  if (authHeader.startsWith('Bearer guest_')) {
    const raw = authHeader.slice('Bearer '.length).trim();
    return raw.startsWith('guest_guest_') ? raw.slice('guest_'.length) : raw;
  }

  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie') || '';
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)boardly_guest_session=([^;]+)/);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1].trim());
      } catch {
        return match[1].trim();
      }
    }
  }
  return null;
}

export async function computeGuestTokenSha256Hex(rawToken: string, secret = 'boardly-default-otp-hmac-secret-v1-do-not-expose'): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`guest_session:v1:${rawToken}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const SLIDING_GUEST_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function authenticateD1GuestSession(
  request: Request,
  db: RewardsD1Database,
  secret?: string
): Promise<AuthenticatedD1User | null> {
  const rawToken = extractGuestSessionTokenFromRequest(request);
  if (!rawToken || rawToken.length < 16) return null;

  try {
    const tokenHash = await computeGuestTokenSha256Hex(rawToken, secret);
    const now = Date.now();
    const sessionRow = await db
      .prepare(
        'SELECT session_id, token_hash, uid, expires_at, revoked FROM guest_sessions WHERE token_hash = ?1 LIMIT 1'
      )
      .bind(tokenHash)
      .first<{
        session_id: string;
        token_hash: string;
        uid: string;
        expires_at: number;
        revoked: number;
      }>();

    if (!sessionRow || Number(sessionRow.revoked) === 1 || Number(sessionRow.expires_at) <= now) {
      return null;
    }

    const guestRow = await db
      .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(sessionRow.uid)
      .first<Record<string, any>>();

    if (
      !guestRow ||
      Number(guestRow.is_guest) !== 1 ||
      Boolean(guestRow.upgraded_to_uid) ||
      Number(guestRow.is_suspended) === 1
    ) {
      return null;
    }

    // Sliding session: extend expires_at and touch last_active_at on activity
    const newExpiresAt = now + SLIDING_GUEST_SESSION_TTL_MS;
    await db
      .prepare('UPDATE guest_sessions SET last_active_at = ?1, expires_at = ?2 WHERE session_id = ?3')
      .bind(now, newExpiresAt, sessionRow.session_id)
      .run()
      .catch(() => {});

    await db
      .prepare('UPDATE guest_accounts SET last_active_at = ?1 WHERE uid = ?2')
      .bind(now, String(guestRow.uid))
      .run()
      .catch(() => {});

    let parsedStats: Record<string, any> = {};
    let parsedAttempts: any[] = [];
    try {
      parsedStats = JSON.parse(String(guestRow.stats_json || '{}'));
    } catch {
      parsedStats = {};
    }
    try {
      parsedAttempts = JSON.parse(String(guestRow.attempts_json || '[]'));
    } catch {
      parsedAttempts = [];
    }

    const cleanUsername = String(guestRow.username || '').trim();
    const cleanDisplayName = String(guestRow.display_name || cleanUsername || 'Guest').trim();

    return {
      uid: String(guestRow.uid),
      email: '',
      name: cleanDisplayName,
      displayName: cleanDisplayName,
      username: cleanUsername,
      shortId: String(guestRow.short_id || 'GUEST'),
      accountType: 'guest',
      plan: 'free',
      picture: null,
      role: 'student',
      customRole: 'Guest',
      isPostingBanned: Boolean(guestRow.is_suspended),
      isSuperAdmin: false,
      isAdminOrAbove: false,
      emailVerified: true,
      sessionVerified: true,
      isGuest: true,
      signInProvider: 'guest',
      authTime: Math.floor(Number(guestRow.created_at || now) / 1000),
      d1CreatedAtMs: Number(guestRow.created_at || now),
      targetUniversity: String(guestRow.target_university || 'General Prep'),
      testsCompleted: Number(guestRow.tests_completed || 0),
      totalQuestionsSolved: Number(guestRow.total_questions_solved || 0),
      streak: Number(guestRow.streak || 0),
      stats: parsedStats,
      attempts: parsedAttempts,
      sessionToken: rawToken,
      sessionExpiresAt: newExpiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Single server-side source of truth for resolving "who is the current user".
 * Resolves either:
 * 1. A registered user (valid Firebase ID token in `Authorization: Bearer <token>`)
 * 2. A guest user (valid, non-revoked, non-expired, non-suspended session cookie / token)
 * Returns uid, username, displayName, accountType, plan, and role.
 */
export async function resolveCurrentUser(params: {
  request: Request;
  env?: RewardsEnv;
  db?: RewardsD1Database;
  secret?: string;
  tokenVerifierOverride?: (authHeader: string | null | undefined) => Promise<VerifiedFirebaseToken | null>;
}): Promise<AuthenticatedD1User | null> {
  const { request, env, secret, tokenVerifierOverride } = params;
  const db: RewardsD1Database = params.db || env?.DB || getSharedLocalD1Database();
  const authHeader = request.headers.get('Authorization');

  // 1. If a non-guest Bearer token is provided, verify it as a Firebase ID token first
  if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.startsWith('Bearer guest_')) {
    const projectId =
      env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
    const verifyFn = tokenVerifierOverride || ((hdr) => verifyFirebaseIdToken(hdr, projectId));
    const verified = await verifyFn(authHeader);

    if (verified && verified.uid) {
      const uid = verified.uid;
      const email = String(verified.email || '').trim().toLowerCase();

      const superUids = new Set(
        (env?.SUPERADMIN_UIDS || DEFAULT_SUPERADMIN_UIDS.join(','))
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      const superEmails = new Set(
        (env?.SUPERADMIN_EMAILS || DEFAULT_SUPERADMIN_EMAILS.join(','))
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      );

      let roleRow: {
        uid?: string;
        email?: string;
        role?: string;
        custom_role?: string | null;
        is_posting_banned?: number;
        updated_at?: number;
        created_at?: number;
      } | null = null;

      let usernameRow: {
        username_lower?: string;
        username_display?: string;
        username?: string;
      } | null = null;

      try {
        [roleRow, usernameRow] = await Promise.all([
          db
            .prepare(
              'SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles WHERE uid = ?1 LIMIT 1'
            )
            .bind(uid)
            .first(),
          db
            .prepare(
              'SELECT username_lower, username_display, uid FROM user_usernames WHERE uid = ?1 LIMIT 1'
            )
            .bind(uid)
            .first(),
        ]);
      } catch {
        // Non-fatal if tables not initialized
      }

      const isHardcodedSuperAdmin =
        superUids.has(uid) ||
        (email.length > 0 && superEmails.has(email)) ||
        verified.role === 'superadmin' ||
        verified.admin === true;

      let role: 'student' | 'captain' | 'admin' | 'superadmin' = 'student';
      if (isHardcodedSuperAdmin || roleRow?.role === 'superadmin') {
        role = 'superadmin';
      } else if (roleRow?.role === 'admin' || verified.role === 'admin') {
        role = 'admin';
      } else if (roleRow?.role === 'captain' || verified.role === 'captain') {
        role = 'captain';
      }

      const isSuperAdmin = role === 'superadmin';
      const isAdminOrAbove = role === 'superadmin' || role === 'admin';
      const isPostingBanned = Boolean(roleRow?.is_posting_banned);

      const resolvedUsername = String(
        usernameRow?.username_display || usernameRow?.username || usernameRow?.username_lower || ''
      ).trim();

      const rawName = String(verified.name || '').trim();
      const safeName =
        rawName && !rawName.includes('@')
          ? rawName
          : resolvedUsername
          ? resolvedUsername
          : email
          ? email.split('@')[0] || 'Student'
          : 'Student';

      const sessionVerified = await isD1UserSessionVerified(db, verified);

      return {
        uid,
        email,
        name: safeName,
        displayName: safeName,
        username: resolvedUsername || safeName,
        accountType: 'registered',
        plan: isAdminOrAbove || role === 'captain' ? 'pro' : 'free',
        picture: verified.picture || null,
        role,
        customRole: roleRow?.custom_role || null,
        isPostingBanned,
        isSuperAdmin,
        isAdminOrAbove,
        emailVerified: Boolean(verified.emailVerified) || sessionVerified,
        sessionVerified,
        isGuest: false,
        signInProvider: verified.signInProvider,
        authTime: verified.authTime,
        d1CreatedAtMs: Number(roleRow?.created_at || 0),
      };
    }
  }

  // 2. Otherwise (or if Bearer token was absent/guest), resolve from D1 guest session cookie / header
  const guestUser = await authenticateD1GuestSession(request, db, secret);
  if (guestUser) {
    return guestUser;
  }

  return null;
}

export async function authenticateD1RewardsUser(params: {
  request: Request;
  env?: RewardsEnv;
  db: RewardsD1Database;
  tokenVerifierOverride?: (authHeader: string | null | undefined) => Promise<VerifiedFirebaseToken | null>;
}): Promise<AuthenticatedD1User | null> {
  return resolveCurrentUser(params);
}

// ─── Service Account Parsing & OAuth2 Token Exchange ──────────────────────────

export function parseServiceAccountFromEnv(env?: RewardsEnv): ServiceAccountCredentials | null {
  if (!env) return null;
  const raw = (env.FIREBASE_SERVICE_ACCOUNT || env.GOOGLE_SERVICE_ACCOUNT_KEY || '').trim();
  if (!raw) return null;

  try {
    const jsonStr = raw.startsWith('{') ? raw : atob(raw);
    const parsed = JSON.parse(jsonStr) as Partial<ServiceAccountCredentials>;
    if (
      parsed &&
      typeof parsed.client_email === 'string' &&
      parsed.client_email.includes('@') &&
      typeof parsed.private_key === 'string' &&
      parsed.private_key.includes('PRIVATE KEY')
    ) {
      return {
        project_id: parsed.project_id || env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    }
    return null;
  } catch {
    return null;
  }
}

let cachedAccessToken: { token: string; clientEmail: string; expiresAt: number } | null = null;

export const FIRESTORE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/datastore';
export const FIRESTORE_TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token';

export function resolveTargetFirestoreProjectId(rawProjectId?: string | null): string {
  const trimmed = (rawProjectId || '').trim();
  return trimmed || DEFAULT_FIREBASE_PROJECT_ID;
}

export function resolveTargetFirestoreDatabaseId(rawDatabaseId?: string | null): string {
  const trimmed = (rawDatabaseId || '').trim();
  if (!trimmed || trimmed === '(default)' || trimmed === 'default') {
    return DEFAULT_FIRESTORE_DATABASE_ID;
  }
  return trimmed;
}

export async function getServiceAccountAccessToken(
  sa: ServiceAccountCredentials
): Promise<string> {
  const nowMs = Date.now();
  if (
    cachedAccessToken &&
    cachedAccessToken.clientEmail === sa.client_email &&
    cachedAccessToken.expiresAt > nowMs + 60_000
  ) {
    return cachedAccessToken.token;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const tokenUri = sa.token_uri || FIRESTORE_TOKEN_AUDIENCE;
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: sa.client_email,
    sub: sa.client_email,
    scope: FIRESTORE_OAUTH_SCOPE,
    aud: tokenUri,
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const unsignedJwt = `${stringToBase64Url(JSON.stringify(header))}.${stringToBase64Url(
    JSON.stringify(claimSet)
  )}`;

  const keyBuffer = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const jwt = `${unsignedJwt}.${uint8ArrayToBase64Url(new Uint8Array(signatureBuffer))}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Rewards Firestore OAuth2 Error] HTTP ${res.status}:`, errText.slice(0, 500));
    const err = new Error(`OAUTH_TOKEN_EXCHANGE_FAILED_${res.status}`) as Error & {
      status?: number;
      sanitizedReason?: string;
    };
    err.status = res.status;
    err.sanitizedReason = `oauth_token_exchange_failed_${res.status}`;
    throw err;
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlSec = Number(data.expires_in || 3600);
  cachedAccessToken = {
    token: data.access_token,
    clientEmail: sa.client_email,
    expiresAt: nowMs + ttlSec * 1000,
  };
  return data.access_token;
}

// ─── Firestore REST Value Serialization ───────────────────────────────────────

export const SERVER_TIMESTAMP_SENTINEL = '__FIRESTORE_SERVER_TIMESTAMP__';

export function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (val === SERVER_TIMESTAMP_SENTINEL) {
    return { timestampValue: new Date().toISOString() };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(raw: Record<string, any> | undefined): any {
  if (!raw || typeof raw !== 'object') return null;
  if ('nullValue' in raw) return null;
  if ('booleanValue' in raw) return Boolean(raw.booleanValue);
  if ('integerValue' in raw) return Number(raw.integerValue);
  if ('doubleValue' in raw) return Number(raw.doubleValue);
  if ('stringValue' in raw) return String(raw.stringValue);
  if ('timestampValue' in raw) return String(raw.timestampValue);
  if ('arrayValue' in raw) {
    const vals = raw.arrayValue?.values;
    return Array.isArray(vals) ? vals.map((v: any) => fromFirestoreValue(v)) : [];
  }
  if ('mapValue' in raw) {
    const fields = raw.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v as Record<string, any>);
    }
    return out;
  }
  return null;
}

export function toFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

export function fromFirestoreDocument(
  docObj: {
    name?: string;
    fields?: Record<string, any>;
    createTime?: string;
    updateTime?: string;
  } | null
): Record<string, any> | null {
  if (!docObj || !docObj.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docObj.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  if (docObj.name) {
    const parts = docObj.name.split('/');
    out._id = parts[parts.length - 1];
  }
  return out;
}

// ─── Transactional Adapter Interface (Firestore Wallet & Ledger Credit) ───────

export interface TxWriteOperation {
  type: 'create' | 'set' | 'merge';
  path: string;
  data: Record<string, unknown>;
}

export interface FirestoreTransactionContext {
  getDoc(path: string): Promise<Record<string, any> | null>;
  createDoc(path: string, data: Record<string, unknown>): void;
  setDoc(path: string, data: Record<string, unknown>, merge?: boolean): void;
}

export interface FirestoreHealthCheckResult {
  ok: boolean;
  reason: string;
  httpStatus?: number;
  targetProjectId: string;
  targetDatabaseId: string;
  serviceAccountProjectId: string | null;
  serviceAccountClientEmail: string | null;
  projectMismatch: boolean;
  restUrlPattern: string;
  oauthScope: string;
  tokenAudience: string;
}

export interface FirestoreStoreAdapter {
  getDoc(path: string): Promise<Record<string, any> | null>;
  setDoc(path: string, data: Record<string, unknown>, merge?: boolean): Promise<void>;
  queryByField?(
    collectionId: string,
    fieldPath: string,
    op: 'EQUAL',
    value: string | number | boolean,
    limit?: number
  ): Promise<Array<Record<string, any>>>;
  runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T>;
  checkHealth?(timeoutMs?: number): Promise<FirestoreHealthCheckResult>;
}

// ─── Production Firestore REST API Adapter ────────────────────────────────────

export class FirestoreRestAdapter implements FirestoreStoreAdapter {
  private sa: ServiceAccountCredentials;
  private projectId: string;
  private databaseId: string;

  constructor(
    sa: ServiceAccountCredentials,
    projectId: string = DEFAULT_FIREBASE_PROJECT_ID,
    databaseId: string = DEFAULT_FIRESTORE_DATABASE_ID
  ) {
    this.sa = sa;
    this.projectId = resolveTargetFirestoreProjectId(projectId);
    this.databaseId = resolveTargetFirestoreDatabaseId(databaseId);
  }

  private get baseDocsUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      this.projectId
    )}/databases/${encodeURIComponent(this.databaseId)}/documents`;
  }

  private get resourcePrefix(): string {
    return `projects/${this.projectId}/databases/${this.databaseId}/documents`;
  }

  private fullDocName(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return `${this.resourcePrefix}/${clean}`;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await getServiceAccountAccessToken(this.sa);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async checkHealth(timeoutMs = 4000): Promise<FirestoreHealthCheckResult> {
    const baseInfo = {
      targetProjectId: this.projectId,
      targetDatabaseId: this.databaseId,
      serviceAccountProjectId: this.sa.project_id || null,
      serviceAccountClientEmail: this.sa.client_email || null,
      projectMismatch: Boolean(this.sa.project_id && this.sa.project_id !== this.projectId),
      restUrlPattern: `${this.baseDocsUrl}:beginTransaction`,
      oauthScope: FIRESTORE_OAUTH_SCOPE,
      tokenAudience: this.sa.token_uri || FIRESTORE_TOKEN_AUDIENCE,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const hdrs = await this.headers();

      const beginRes = await fetch(`${this.baseDocsUrl}:beginTransaction`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ options: { readOnly: {} } }),
        signal: controller.signal,
      });

      if (!beginRes.ok) {
        const rawErr = await beginRes.text();
        console.error(
          `[Rewards Firestore Health Check Failed] POST ${this.baseDocsUrl}:beginTransaction HTTP ${beginRes.status}:`,
          rawErr.slice(0, 600)
        );
        const reason =
          beginRes.status === 403
            ? baseInfo.projectMismatch
              ? 'permission_denied_project_mismatch'
              : 'permission_denied_missing_datastore_user_role'
            : beginRes.status === 404
            ? 'named_database_not_found'
            : `firestore_http_${beginRes.status}`;
        return {
          ...baseInfo,
          ok: false,
          reason,
          httpStatus: beginRes.status,
        };
      }

      const txData = (await beginRes.json()) as { transaction?: string };
      if (txData?.transaction) {
        await fetch(`${this.baseDocsUrl}:rollback`, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ transaction: txData.transaction }),
          signal: controller.signal,
        }).catch(() => {});
      }

      return {
        ...baseInfo,
        ok: true,
        reason: 'ok',
        httpStatus: 200,
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      console.error('[Rewards Firestore Health Check Exception]:', err?.message || err);
      return {
        ...baseInfo,
        ok: false,
        reason: isTimeout
          ? 'firestore_timeout'
          : err?.sanitizedReason || 'firestore_connection_failed',
        httpStatus: err?.status || 503,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async getDoc(path: string): Promise<Record<string, any> | null> {
    const clean = path.replace(/^\/+/, '');
    const res = await fetch(`${this.baseDocsUrl}/${clean}`, {
      method: 'GET',
      headers: await this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[Rewards Firestore getDoc(${clean}) Failed] HTTP ${res.status}:`,
        errText.slice(0, 600)
      );
      const err = new Error(`FIRESTORE_GETDOC_FAILED_${res.status}`) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return fromFirestoreDocument(json);
  }

  async setDoc(path: string, data: Record<string, unknown>, merge = false): Promise<void> {
    const clean = path.replace(/^\/+/, '');
    const url = new URL(`${this.baseDocsUrl}/${clean}`);
    if (merge) {
      for (const k of Object.keys(data)) {
        if (data[k] !== undefined) {
          url.searchParams.append('updateMask.fieldPaths', k);
        }
      }
    }
    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: await this.headers(),
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[Rewards Firestore setDoc(${clean}) Failed] HTTP ${res.status}:`,
        errText.slice(0, 600)
      );
      const err = new Error(`FIRESTORE_SETDOC_FAILED_${res.status}`) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
  }

  async runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    const hdrs = await this.headers();
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const beginRes = await fetch(`${this.baseDocsUrl}:beginTransaction`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ options: { readWrite: {} } }),
      });
      if (!beginRes.ok) {
        const errText = await beginRes.text();
        console.error(
          `[Rewards Firestore beginTransaction Failed] POST ${this.baseDocsUrl}:beginTransaction HTTP ${beginRes.status}:`,
          errText.slice(0, 600)
        );
        const err = new Error(`FIRESTORE_BEGIN_TRANSACTION_FAILED_${beginRes.status}`) as Error & {
          status?: number;
        };
        err.status = beginRes.status;
        throw err;
      }
      const { transaction } = (await beginRes.json()) as { transaction: string };

      const writes: TxWriteOperation[] = [];
      const txCtx: FirestoreTransactionContext = {
        getDoc: async (path: string) => {
          const clean = path.replace(/^\/+/, '');
          const batchRes = await fetch(`${this.baseDocsUrl}:batchGet`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
              documents: [this.fullDocName(clean)],
              transaction,
            }),
          });
          if (!batchRes.ok) {
            const errText = await batchRes.text();
            console.error(
              `[Rewards Firestore tx.getDoc(${clean}) Failed] HTTP ${batchRes.status}:`,
              errText.slice(0, 600)
            );
            const err = new Error(`FIRESTORE_TX_GETDOC_FAILED_${batchRes.status}`) as Error & {
              status?: number;
            };
            err.status = batchRes.status;
            throw err;
          }
          const items = (await batchRes.json()) as Array<{ found?: any; missing?: string }>;
          const first = Array.isArray(items) ? items[0] : null;
          if (!first || !first.found) return null;
          return fromFirestoreDocument(first.found);
        },
        createDoc: (path: string, data: Record<string, unknown>) => {
          writes.push({ type: 'create', path: path.replace(/^\/+/, ''), data });
        },
        setDoc: (path: string, data: Record<string, unknown>, merge = false) => {
          writes.push({ type: merge ? 'merge' : 'set', path: path.replace(/^\/+/, ''), data });
        },
      };

      const result = await fn(txCtx);

      if (writes.length === 0) {
        return result;
      }

      const restWrites = writes.map((w) => {
        const docName = this.fullDocName(w.path);
        const fields = toFirestoreFields(w.data);
        if (w.type === 'create') {
          return {
            update: { name: docName, fields },
            currentDocument: { exists: false },
          };
        }
        if (w.type === 'merge') {
          return {
            update: { name: docName, fields },
            updateMask: {
              fieldPaths: Object.keys(w.data).filter((k) => w.data[k] !== undefined),
            },
          };
        }
        return {
          update: { name: docName, fields },
        };
      });

      const commitRes = await fetch(`${this.baseDocsUrl}:commit`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          transaction,
          writes: restWrites,
        }),
      });

      if (commitRes.ok) {
        return result;
      }

      const commitStatus = commitRes.status;
      const errText = await commitRes.text();

      if (commitStatus === 409 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 40 * attempt));
        continue;
      }

      console.error(
        `[Rewards Firestore commit Failed] POST ${this.baseDocsUrl}:commit HTTP ${commitStatus}:`,
        errText.slice(0, 600)
      );
      const err = new Error(`FIRESTORE_COMMIT_FAILED_${commitStatus}`) as Error & {
        status?: number;
      };
      err.status = commitStatus;
      throw err;
    }

    throw new Error('FIRESTORE_TRANSACTION_MAX_RETRIES');
  }
}

/**
 * PHASE 3: Claim-First in D1, Credit-Second in Firestore.
 * Credits Kobans to `wallets/{uid}` + `users/{uid}` and writes a deterministic ledger entry
 * `wallets/{uid}/ledger/{ledgerId}` inside an idempotent Firestore transaction.
 * If the deterministic ledger entry already exists, this transaction does nothing and succeeds
 * (`alreadyCredited: true`), guaranteeing that retries can NEVER double-pay!
 */
export async function creditKobansIdempotentInFirestore(params: {
  store: FirestoreStoreAdapter;
  uid: string;
  ledgerId: string;
  type: RewardLedgerEntryType;
  amount: number;
  reason: string;
  extraLedgerFields?: Record<string, unknown>;
  notification?: {
    id: string;
    title: string;
    message: string;
    link?: string;
  };
}): Promise<{
  credited: boolean;
  alreadyCredited: boolean;
  balanceBefore: number;
  delta: number;
  balanceAfter: number;
  ledgerId: string;
}> {
  const { store, uid, ledgerId, type, amount, reason, extraLedgerFields, notification } = params;
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const ledgerPath = `wallets/${uid}/ledger/${ledgerId}`;

  return store.runTransaction(async (tx) => {
    const existingLedger = await tx.getDoc(ledgerPath);
    if (existingLedger) {
      const walletDoc = await tx.getDoc(`wallets/${uid}`);
      const currentBal = Math.max(
        0,
        Math.floor(Number(existingLedger.balanceAfter ?? existingLedger.balance_after ?? walletDoc?.balance ?? 0))
      );
      const prevBal =
        typeof existingLedger.balanceBefore === 'number'
          ? Math.max(0, Math.floor(existingLedger.balanceBefore))
          : typeof existingLedger.balance_before === 'number'
          ? Math.max(0, Math.floor(existingLedger.balance_before))
          : Math.max(0, currentBal - safeAmount);
      return {
        credited: true,
        alreadyCredited: true,
        balanceBefore: prevBal,
        delta: safeAmount,
        balanceAfter: currentBal,
        ledgerId,
      };
    }

    const [walletDoc, userDoc] = await Promise.all([
      tx.getDoc(`wallets/${uid}`),
      tx.getDoc(`users/${uid}`),
    ]);

    const walletBal =
      typeof walletDoc?.balance === 'number' && Number.isFinite(walletDoc.balance)
        ? Math.max(0, Math.floor(walletDoc.balance))
        : 0;
    const userBal = Math.max(
      0,
      Math.floor(Number(userDoc?.kobans ?? userDoc?.kobanBalance ?? 0))
    );
    const currentBalance = Math.max(walletBal, userBal);
    const newBalance = currentBalance + safeAmount;

    // 1. Deterministic ledger document creation with balanceBefore and balanceAfter
    tx.createDoc(ledgerPath, {
      id: ledgerId,
      type,
      amount: safeAmount,
      balanceBefore: currentBalance,
      balance_before: currentBalance,
      balanceAfter: newBalance,
      balance_after: newBalance,
      reason,
      ...(extraLedgerFields || {}),
      timestamp: SERVER_TIMESTAMP_SENTINEL,
    });

    // 2. Update wallets/{uid}.balance
    tx.setDoc(
      `wallets/${uid}`,
      {
        balance: newBalance,
        owned: Array.isArray(walletDoc?.owned) ? walletDoc.owned : [],
        equipped: walletDoc?.equipped || {
          effect: null,
          frame: null,
          nameplate: null,
          avatar: null,
          banner: null,
        },
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    // 3. Mirror balance to users/{uid}.kobans and users/{uid}.kobanBalance
    tx.setDoc(
      `users/${uid}`,
      {
        kobans: newBalance,
        kobanBalance: newBalance,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    // 4. Optional notification document
    if (notification) {
      tx.setDoc(`notifications/${notification.id}`, {
        userId: uid,
        type: 'system',
        title: notification.title,
        message: notification.message,
        link: notification.link || '/rewards',
        read: false,
        createdAt: SERVER_TIMESTAMP_SENTINEL,
      });
    }

    return {
      credited: true,
      alreadyCredited: false,
      balanceBefore: currentBalance,
      delta: safeAmount,
      balanceAfter: newBalance,
      ledgerId,
    };
  });
}

// ─── Relational D1 Simulator for Local Vite Dev & Automated Tests ─────────────
// Implements the exact Cloudflare D1Database `.prepare(sql).bind(...).first()/.all()/.run()`
// and `.batch()` contract with strict PRIMARY KEY and UNIQUE constraints.

export interface InMemoryD1Tables {
  reward_settings: Map<string, { key: string; value: string }>;
  reward_daily_claims: Map<
    string,
    {
      uid: string;
      pkt_date: string;
      day_number: number;
      amount: number;
      credit_status: string;
      created_at: number;
    }
  >;
  reward_milestone_claims: Map<
    string,
    {
      uid: string;
      milestone_id: string;
      amount: number;
      credit_status: string;
      created_at: number;
    }
  >;
  referral_codes: Map<string, { uid: string; code: string }>;
  referrals: Map<
    string,
    {
      id: string;
      inviter_uid: string;
      invitee_uid: string;
      inviter_code: string;
      invitee_code: string;
      status: string;
      inviter_accepted: number;
      invitee_accepted: number;
      ip_hash: string;
      flagged: number;
      inviter_credit_status: string;
      invitee_credit_status: string;
      created_at: number;
      confirmed_at: number | null;
      paid_at: number | null;
    }
  >;
  user_roles: Map<
    string,
    {
      uid: string;
      email: string;
      role: string;
      custom_role: string | null;
      is_posting_banned: number;
      updated_at: number;
      created_at: number;
    }
  >;
  test_attempts: Map<
    string,
    {
      id: string;
      test_id: string;
      user_uid: string;
      user_name: string;
      score: number;
      total_questions: number;
      created_at: number;
    }
  >;
  attempt_answers: Map<
    string,
    {
      id: string;
      attempt_id: string;
      test_id: string;
      question_id: string;
      selected_index: number;
      correct_index: number;
      is_correct: number;
      created_at: number;
    }
  >;
  email_verification_codes: Map<
    string,
    {
      id: string;
      user_id: string;
      email_hash: string;
      purpose: 'login' | 'signup';
      code_hash: string;
      link_token_hash: string | null;
      auth_time: number;
      expires_at: number;
      attempt_count: number;
      used: number;
      created_at: number;
      ip_hash: string;
    }
  >;
  email_verification_sessions: Map<
    string,
    {
      user_id: string;
      email_hash: string;
      email_verified: number;
      verified_auth_time: number;
      verified_at: number;
      updated_at: number;
    }
  >;
  email_verification_send_logs: Map<
    string,
    {
      id: string;
      user_id: string;
      email_hash: string;
      ip_hash: string;
      purpose: 'login' | 'signup';
      created_at: number;
    }
  >;
  user_usernames: Map<
    string,
    {
      username_lower: string;
      username: string;
      username_display: string;
      normalized_lookalike: string;
      uid: string;
      account_type: string;
      created_at: number;
      updated_at: number;
    }
  >;
  guest_accounts: Map<
    string,
    {
      uid: string;
      username: string;
      username_lower: string;
      display_name: string;
      short_id: string;
      account_type: string;
      is_guest: number;
      email: string;
      plan: string;
      role: string;
      upgraded_to_uid: string | null;
      upgraded_at: number | null;
      target_university: string;
      tests_completed: number;
      total_questions_solved: number;
      streak: number;
      stats_json: string;
      attempts_json: string;
      ip_hash: string;
      device_id_hash: string;
      is_suspended: number;
      created_at: number;
      last_active_at: number;
    }
  >;
  guest_sessions: Map<
    string,
    {
      session_id: string;
      token_hash: string;
      uid: string;
      ip_hash: string;
      device_id_hash: string;
      user_agent: string;
      created_at: number;
      last_active_at: number;
      expires_at: number;
      revoked: number;
    }
  >;
  guest_creation_rate_limits: Array<{
    id: number;
    identifier_hash: string;
    identifier_type: string;
    uid: string;
    created_at: number;
  }>;
}

export class InMemoryD1Database implements RewardsD1Database {
  public tables: InMemoryD1Tables = {
    reward_settings: new Map(),
    reward_daily_claims: new Map(),
    reward_milestone_claims: new Map(),
    referral_codes: new Map(),
    referrals: new Map(),
    user_roles: new Map(),
    test_attempts: new Map(),
    attempt_answers: new Map(),
    email_verification_codes: new Map(),
    email_verification_sessions: new Map(),
    email_verification_send_logs: new Map(),
    user_usernames: new Map(),
    guest_accounts: new Map(),
    guest_sessions: new Map(),
    guest_creation_rate_limits: [],
  };

  constructor() {
    this.loadFromDisk();
  }

  private getDiskPath(): string | null {
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        return `${process.cwd()}/data/d1_auth_guest_tables.json`;
      }
    } catch {
      // Ignore in edge runtime
    }
    return null;
  }

  private loadFromDisk(): void {
    try {
      const diskPath = this.getDiskPath();
      if (!diskPath || typeof process === 'undefined') return;
      const req = typeof require !== 'undefined' ? require : null;
      const fsMod = req ? req('fs') : null;
      if (!fsMod || !fsMod.existsSync(diskPath)) return;
      const raw = JSON.parse(fsMod.readFileSync(diskPath, 'utf8'));
      if (Array.isArray(raw.user_usernames)) {
        for (const r of raw.user_usernames) {
          if (r && r.username_lower) {
            this.tables.user_usernames.set(String(r.username_lower), {
              ...r,
              username: r.username || r.username_display || r.username_lower,
              username_display: r.username_display || r.username || r.username_lower,
            });
          }
        }
      }
      if (Array.isArray(raw.guest_accounts)) {
        for (const r of raw.guest_accounts) {
          if (r && r.uid) this.tables.guest_accounts.set(String(r.uid), r);
        }
      }
      if (Array.isArray(raw.guest_sessions)) {
        for (const r of raw.guest_sessions) {
          if (r && r.session_id) this.tables.guest_sessions.set(String(r.session_id), r);
        }
      }
      if (Array.isArray(raw.email_verification_sessions)) {
        for (const r of raw.email_verification_sessions) {
          if (r && r.user_id) this.tables.email_verification_sessions.set(String(r.user_id), r);
        }
      }
    } catch {
      // Non-fatal
    }
  }

  private saveToDisk(): void {
    try {
      const diskPath = this.getDiskPath();
      if (!diskPath || typeof process === 'undefined') return;
      const req = typeof require !== 'undefined' ? require : null;
      const fsMod = req ? req('fs') : null;
      const pathMod = req ? req('path') : null;
      if (!fsMod || !pathMod) return;
      fsMod.mkdirSync(pathMod.dirname(diskPath), { recursive: true });
      const payload = {
        user_usernames: Array.from(this.tables.user_usernames.values()),
        guest_accounts: Array.from(this.tables.guest_accounts.values()),
        guest_sessions: Array.from(this.tables.guest_sessions.values()),
        email_verification_sessions: Array.from(this.tables.email_verification_sessions.values()),
      };
      fsMod.writeFileSync(diskPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch {
      // Non-fatal
    }
  }

  prepare(query: string): RewardsD1PreparedStatement {
    const db = this;
    const normalized = query.replace(/\s+/g, ' ').trim();
    let boundArgs: any[] = [];

    const stmt: RewardsD1PreparedStatement = {
      bind(...values: any[]) {
        boundArgs = values;
        return stmt;
      },
      async first<T = Record<string, any>>(colName?: string): Promise<T | null> {
        const { results } = await stmt.all<any>();
        const row = results[0] ?? null;
        if (!row) return null;
        if (colName) return (row[colName] ?? null) as T;
        return row as T;
      },
      async all<T = Record<string, any>>(): Promise<{ results: T[] }> {
        const rows = db.executeQuery(normalized, boundArgs);
        return { results: rows as T[] };
      },
      async run(): Promise<{ success: boolean; meta?: { changes?: number } }> {
        const changes = db.executeMutation(normalized, boundArgs);
        if (changes > 0) {
          db.saveToDisk();
        }
        return { success: true, meta: { changes } };
      },
    };
    return stmt;
  }

  async batch(statements: RewardsD1PreparedStatement[]): Promise<any[]> {
    const out: any[] = [];
    for (const s of statements) {
      out.push(await s.run());
    }
    return out;
  }

  private executeQuery(sql: string, args: any[]): any[] {
    const upper = sql.toUpperCase();

    // 1. SELECT 1 AS ok
    if (upper.startsWith('SELECT 1')) {
      return [{ ok: 1 }];
    }

    // 2. reward_settings
    if (upper.includes('FROM REWARD_SETTINGS')) {
      if (upper.includes('WHERE KEY =')) {
        const key = String(args[0] ?? '');
        const row = this.tables.reward_settings.get(key);
        return row ? [{ ...row }] : [];
      }
      return Array.from(this.tables.reward_settings.values()).map((r) => ({ ...r }));
    }

    // 3. user_roles
    if (upper.includes('FROM USER_ROLES')) {
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.user_roles.get(uid);
        return row ? [{ ...row }] : [];
      }
      return Array.from(this.tables.user_roles.values()).map((r) => ({ ...r }));
    }

    // 4. reward_daily_claims
    if (upper.includes('FROM REWARD_DAILY_CLAIMS')) {
      const uid = String(args[0] ?? '');
      let rows = Array.from(this.tables.reward_daily_claims.values()).filter((r) => r.uid === uid);
      if (upper.includes('AND PKT_DATE =')) {
        const pktDate = String(args[1] ?? '');
        rows = rows.filter((r) => r.pkt_date === pktDate);
      }
      if (upper.includes("AND CREDIT_STATUS = 'PENDING'")) {
        rows = rows.filter((r) => r.credit_status === 'pending');
      }
      rows.sort((a, b) => b.pkt_date.localeCompare(a.pkt_date));
      return rows.map((r) => ({ ...r }));
    }

    // 5. reward_milestone_claims
    if (upper.includes('FROM REWARD_MILESTONE_CLAIMS')) {
      const uid = String(args[0] ?? '');
      let rows = Array.from(this.tables.reward_milestone_claims.values()).filter(
        (r) => r.uid === uid
      );
      if (upper.includes('AND MILESTONE_ID =')) {
        const mId = String(args[1] ?? '');
        rows = rows.filter((r) => r.milestone_id === mId);
      }
      if (upper.includes("AND CREDIT_STATUS = 'PENDING'")) {
        rows = rows.filter((r) => r.credit_status === 'pending');
      }
      return rows.map((r) => ({ ...r }));
    }

    // 6. referral_codes
    if (upper.includes('FROM REFERRAL_CODES')) {
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.referral_codes.get(uid);
        return row ? [{ ...row }] : [];
      }
      if (upper.includes('WHERE CODE =')) {
        const code = String(args[0] ?? '');
        const found = Array.from(this.tables.referral_codes.values()).find((r) => r.code === code);
        return found ? [{ ...found }] : [];
      }
      return Array.from(this.tables.referral_codes.values()).map((r) => ({ ...r }));
    }

    // 7. referrals
    if (upper.includes('FROM REFERRALS')) {
      const all = Array.from(this.tables.referrals.values());
      if (upper.includes('COUNT(*)') && upper.includes('WHERE IP_HASH =')) {
        const ipHash = String(args[0] ?? '');
        const sinceMs = Number(args[1] ?? 0);
        const cnt = all.filter((r) => r.ip_hash === ipHash && r.created_at >= sinceMs).length;
        return [{ cnt }];
      }
      if (upper.includes('COUNT(*)') && upper.includes("STATUS IN ('PAID', 'COMPLETED')")) {
        const inviterUid = String(args[0] ?? '');
        const startMs = Number(args[1] ?? 0);
        const endMs = Number(args[2] ?? Number.MAX_SAFE_INTEGER);
        const cnt = all.filter(
          (r) =>
            r.inviter_uid === inviterUid &&
            (r.status === 'paid' || r.status === 'completed') &&
            r.paid_at !== null &&
            r.paid_at >= startMs &&
            r.paid_at < endMs
        ).length;
        return [{ cnt }];
      }
      if (upper.includes('WHERE ID =')) {
        const id = String(args[0] ?? '');
        const row = this.tables.referrals.get(id);
        return row ? [{ ...row }] : [];
      }
      if (upper.includes('WHERE INVITEE_UID =') && upper.includes('AND INVITER_UID =')) {
        const inviteeUid = String(args[0] ?? '');
        const inviterUid = String(args[1] ?? '');
        return all
          .filter((r) => r.invitee_uid === inviteeUid && r.inviter_uid === inviterUid)
          .map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE INVITEE_UID =')) {
        const inviteeUid = String(args[0] ?? '');
        return all.filter((r) => r.invitee_uid === inviteeUid).map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE INVITER_UID = OR INVITEE_UID =') || upper.includes('WHERE INVITER_UID = ?1 OR INVITEE_UID = ?1')) {
        const uid = String(args[0] ?? '');
        return all
          .filter((r) => r.inviter_uid === uid || r.invitee_uid === uid)
          .sort((a, b) => b.created_at - a.created_at)
          .map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE INVITER_UID =')) {
        const inviterUid = String(args[0] ?? '');
        return all
          .filter((r) => r.inviter_uid === inviterUid)
          .sort((a, b) => b.created_at - a.created_at)
          .map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 8. READ-ONLY MCQ count query on test_attempts + attempt_answers
    if (upper.includes('FROM TEST_ATTEMPTS')) {
      const uid = String(args[0] ?? '');
      const sinceMs = args.length > 1 ? Number(args[1] ?? 0) : 0;
      const attempts = Array.from(this.tables.test_attempts.values()).filter(
        (ta) => ta.user_uid === uid && ta.created_at >= sinceMs
      );
      const allAnswers = Array.from(this.tables.attempt_answers.values());

      return attempts.map((ta) => {
        const ansForAttempt = allAnswers.filter((aa) => aa.attempt_id === ta.id);
        const answeredRows = ansForAttempt.filter((aa) => aa.selected_index >= 0).length;
        return {
          attempt_id: ta.id,
          total_questions: ta.total_questions,
          created_at: ta.created_at,
          answered_rows: answeredRows,
          total_answer_rows: ansForAttempt.length,
        };
      });
    }

    // 9. email_verification_sessions
    if (upper.includes('FROM EMAIL_VERIFICATION_SESSIONS')) {
      const userId = String(args[0] ?? '');
      const row = this.tables.email_verification_sessions.get(userId);
      return row ? [{ ...row }] : [];
    }

    // 10. email_verification_codes
    if (upper.includes('FROM EMAIL_VERIFICATION_CODES')) {
      const all = Array.from(this.tables.email_verification_codes.values());
      if (upper.includes('WHERE LINK_TOKEN_HASH =')) {
        const tokenHash = String(args[0] ?? '');
        const matches = all
          .filter((r) => r.link_token_hash === tokenHash)
          .sort((a, b) => b.created_at - a.created_at);
        return matches.map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE USER_ID =') && upper.includes('AND PURPOSE =')) {
        const userId = String(args[0] ?? '');
        const purpose = String(args[1] ?? '');
        let matches = all.filter((r) => r.user_id === userId && r.purpose === purpose);
        if (upper.includes('AND USED = 0')) {
          matches = matches.filter((r) => r.used === 0);
        }
        matches.sort((a, b) => b.created_at - a.created_at);
        return matches.map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE USER_ID =')) {
        const userId = String(args[0] ?? '');
        let matches = all.filter((r) => r.user_id === userId);
        if (upper.includes('AND USED = 0')) {
          matches = matches.filter((r) => r.used === 0);
        }
        matches.sort((a, b) => b.created_at - a.created_at);
        return matches.map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE ID =')) {
        const id = String(args[0] ?? '');
        const row = this.tables.email_verification_codes.get(id);
        return row ? [{ ...row }] : [];
      }
      return all.map((r) => ({ ...r }));
    }

    // 11. email_verification_send_logs
    if (upper.includes('FROM EMAIL_VERIFICATION_SEND_LOGS')) {
      const all = Array.from(this.tables.email_verification_send_logs.values());
      if (upper.includes('COUNT(*)') && upper.includes('WHERE EMAIL_HASH =')) {
        const emailHash = String(args[0] ?? '');
        const sinceMs = Number(args[1] ?? 0);
        const cnt = all.filter((r) => r.email_hash === emailHash && r.created_at >= sinceMs).length;
        return [{ cnt }];
      }
      if (upper.includes('COUNT(*)') && upper.includes('WHERE IP_HASH =')) {
        const ipHash = String(args[0] ?? '');
        const sinceMs = Number(args[1] ?? 0);
        const cnt = all.filter((r) => r.ip_hash === ipHash && r.created_at >= sinceMs).length;
        return [{ cnt }];
      }
      if (upper.includes('WHERE EMAIL_HASH =')) {
        const emailHash = String(args[0] ?? '');
        const matches = all
          .filter((r) => r.email_hash === emailHash)
          .sort((a, b) => b.created_at - a.created_at);
        return matches.map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE USER_ID =')) {
        const userId = String(args[0] ?? '');
        const matches = all
          .filter((r) => r.user_id === userId)
          .sort((a, b) => b.created_at - a.created_at);
        return matches.map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 12. user_usernames
    if (upper.includes('FROM USER_USERNAMES')) {
      const all = Array.from(this.tables.user_usernames.values());
      if (upper.includes('WHERE USERNAME_LOWER =')) {
        const uLower = String(args[0] ?? '').toLowerCase();
        const row = this.tables.user_usernames.get(uLower);
        return row ? [{ ...row }] : [];
      }
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        const found = all.find((r) => r.uid === uid);
        return found ? [{ ...found }] : [];
      }
      if (upper.includes('WHERE NORMALIZED_LOOKALIKE =')) {
        const lookalike = String(args[0] ?? '');
        return all.filter((r) => r.normalized_lookalike === lookalike).map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 13. guest_accounts
    if (upper.includes('FROM GUEST_ACCOUNTS')) {
      const all = Array.from(this.tables.guest_accounts.values());
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.guest_accounts.get(uid);
        return row ? [{ ...row }] : [];
      }
      if (upper.includes('WHERE USERNAME_LOWER =')) {
        const uLower = String(args[0] ?? '').toLowerCase();
        const found = all.find((r) => r.username_lower === uLower);
        return found ? [{ ...found }] : [];
      }
      if (upper.includes('WHERE EMAIL =')) {
        const em = String(args[0] ?? '').toLowerCase();
        const found = all.filter((r) => r.email && r.email.toLowerCase() === em);
        return found.map((r) => ({ ...r }));
      }
      return all.sort((a, b) => b.created_at - a.created_at).map((r) => ({ ...r }));
    }

    // 14. guest_sessions (including optional JOIN guest_accounts)
    if (upper.includes('FROM GUEST_SESSIONS')) {
      const all = Array.from(this.tables.guest_sessions.values());
      const joinGuestAccount = (sess: any) => {
        if (!upper.includes('JOIN GUEST_ACCOUNTS')) {
          return { ...sess };
        }
        const g = this.tables.guest_accounts.get(sess.uid);
        if (!g) return null;
        return { ...g, ...sess };
      };
      if (upper.includes('WHERE TOKEN_HASH =') || upper.includes('WHERE S.TOKEN_HASH =')) {
        const th = String(args[0] ?? '');
        const found = all.find(
          (r) => r.token_hash === th && (!upper.includes('REVOKED = 0') || Number(r.revoked) === 0)
        );
        if (!found) return [];
        const joined = joinGuestAccount(found);
        return joined ? [joined] : [];
      }
      if (upper.includes('WHERE UID =') || upper.includes('WHERE S.UID =')) {
        const uid = String(args[0] ?? '');
        return all
          .filter((r) => r.uid === uid)
          .map(joinGuestAccount)
          .filter(Boolean);
      }
      return all.map(joinGuestAccount).filter(Boolean);
    }

    // 15. guest_creation_rate_limits
    if (upper.includes('FROM GUEST_CREATION_RATE_LIMITS')) {
      const all = this.tables.guest_creation_rate_limits;
      if (upper.includes('COUNT(*)') && upper.includes('WHERE IDENTIFIER_HASH =')) {
        const idHash = String(args[0] ?? '');
        const idType = String(args[1] ?? '');
        const sinceMs = Number(args[2] ?? 0);
        const cnt = all.filter(
          (r) =>
            r.identifier_hash === idHash &&
            r.identifier_type === idType &&
            r.created_at >= sinceMs
        ).length;
        return [{ cnt }];
      }
      return all.map((r) => ({ ...r }));
    }

    return [];
  }

  private executeMutation(sql: string, args: any[]): number {
    const upper = sql.toUpperCase();

    if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX')) {
      return 0;
    }

    // 0a. email_verification_codes
    if (upper.includes('INTO EMAIL_VERIFICATION_CODES')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const email_hash = String(args[2]);
      const purpose = (String(args[3]) === 'signup' ? 'signup' : 'login') as 'login' | 'signup';
      const code_hash = String(args[4]);
      const link_token_hash = args[5] != null ? String(args[5]) : null;
      const auth_time = Number(args[6] ?? 0);
      const expires_at = Number(args[7] ?? 0);
      const hasExplicitCounters = args.length >= 12;
      const attempt_count = hasExplicitCounters ? Number(args[8] ?? 0) : 0;
      const used = hasExplicitCounters ? Number(args[9] ?? 0) : 0;
      const created_at = Number((hasExplicitCounters ? args[10] : args[8]) ?? Date.now());
      const ip_hash = String((hasExplicitCounters ? args[11] : args[9]) ?? '');

      this.tables.email_verification_codes.set(id, {
        id,
        user_id,
        email_hash,
        purpose,
        code_hash,
        link_token_hash,
        auth_time,
        expires_at,
        attempt_count,
        used,
        created_at,
        ip_hash,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE EMAIL_VERIFICATION_CODES')) {
      if (
        upper.includes('SET USED = 1') &&
        upper.includes('WHERE USER_ID =') &&
        upper.includes('AND PURPOSE =')
      ) {
        const userId = String(args[0]);
        const purpose = String(args[1]);
        let changes = 0;
        for (const row of this.tables.email_verification_codes.values()) {
          if (row.user_id === userId && row.purpose === purpose && row.used === 0) {
            row.used = 1;
            changes += 1;
          }
        }
        return changes;
      }
      if (upper.includes('SET USED = 1') && upper.includes('WHERE USER_ID =')) {
        const userId = String(args[0]);
        let changes = 0;
        for (const row of this.tables.email_verification_codes.values()) {
          if (row.user_id === userId && row.used === 0) {
            row.used = 1;
            changes += 1;
          }
        }
        return changes;
      }
      if (upper.includes('SET ATTEMPT_COUNT =') && upper.includes('USED =')) {
        const attemptCount = Number(args[0]);
        const used = Number(args[1]);
        const id = String(args[2]);
        const row = this.tables.email_verification_codes.get(id);
        if (!row) return 0;
        row.attempt_count = attemptCount;
        row.used = used;
        return 1;
      }
      if (upper.includes('SET USED = 1') && upper.includes('WHERE ID =')) {
        const id = String(args[0]);
        const row = this.tables.email_verification_codes.get(id);
        if (!row) return 0;
        row.used = 1;
        return 1;
      }
    }

    // 0b. email_verification_sessions
    if (upper.includes('INTO EMAIL_VERIFICATION_SESSIONS')) {
      const user_id = String(args[0]);
      const email_hash = String(args[1] ?? '');
      const hasExplicitVerified = args.length >= 6;
      const email_verified = hasExplicitVerified ? Number(args[2] ?? 1) : 1;
      const verified_auth_time = Number((hasExplicitVerified ? args[3] : args[2]) ?? 0);
      const verified_at = Number((hasExplicitVerified ? args[4] : args[3]) ?? Date.now());
      const updated_at = Number((hasExplicitVerified ? args[5] : args[4]) ?? Date.now());
      this.tables.email_verification_sessions.set(user_id, {
        user_id,
        email_hash,
        email_verified,
        verified_auth_time,
        verified_at,
        updated_at,
      });
      return 1;
    }

    // 0c. email_verification_send_logs
    if (upper.includes('INTO EMAIL_VERIFICATION_SEND_LOGS')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const email_hash = String(args[2]);
      const ip_hash = String(args[3]);
      const purpose = (String(args[4]) === 'signup' ? 'signup' : 'login') as 'login' | 'signup';
      const created_at = Number(args[5] ?? Date.now());
      this.tables.email_verification_send_logs.set(id, {
        id,
        user_id,
        email_hash,
        ip_hash,
        purpose,
        created_at,
      });
      return 1;
    }

    // 1. reward_settings (key TEXT PRIMARY KEY)
    if (upper.includes('INTO REWARD_SETTINGS')) {
      const isIgnore = upper.includes('OR IGNORE');
      const isReplace = upper.includes('OR REPLACE') || upper.includes('ON CONFLICT');
      let key: string;
      let val: string;
      if (args.length >= 2) {
        key = String(args[0]);
        val = String(args[1]);
      } else if (args.length === 1) {
        key = 'mode';
        val = String(args[0]);
      } else {
        // Parse literal seed from SQL if no bind args
        if (sql.includes("'mode'")) {
          key = 'mode';
          val = 'off';
        } else {
          return 0;
        }
      }
      if (this.tables.reward_settings.has(key)) {
        if (isIgnore) {
          return 0;
        }
        if (!isReplace) {
          throw new Error('D1_ERROR: UNIQUE constraint failed: reward_settings.key');
        }
      }
      this.tables.reward_settings.set(key, { key, value: val });
      return 1;
    }

    if (upper.startsWith('UPDATE REWARD_SETTINGS')) {
      const val = String(args[0]);
      const key = String(args[1] ?? 'mode');
      this.tables.reward_settings.set(key, { key, value: val });
      return 1;
    }

    // 2. reward_daily_claims (PRIMARY KEY (uid, pkt_date))
    if (upper.startsWith('INSERT INTO REWARD_DAILY_CLAIMS')) {
      const uid = String(args[0]);
      const pkt_date = String(args[1]);
      const day_number = Number(args[2]);
      const amount = Number(args[3]);
      const credit_status = String(args[4] ?? 'pending');
      const created_at = Number(args[5] ?? Date.now());
      const pk = `${uid}::${pkt_date}`;
      if (this.tables.reward_daily_claims.has(pk)) {
        throw new Error('UNIQUE constraint failed: reward_daily_claims.uid, reward_daily_claims.pkt_date');
      }
      this.tables.reward_daily_claims.set(pk, {
        uid,
        pkt_date,
        day_number,
        amount,
        credit_status,
        created_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE REWARD_DAILY_CLAIMS')) {
      const credit_status = String(args[0]);
      const uid = String(args[1]);
      const pkt_date = String(args[2]);
      const pk = `${uid}::${pkt_date}`;
      const existing = this.tables.reward_daily_claims.get(pk);
      if (!existing) return 0;
      existing.credit_status = credit_status;
      return 1;
    }

    // 3. reward_milestone_claims (PRIMARY KEY (uid, milestone_id))
    if (upper.startsWith('INSERT INTO REWARD_MILESTONE_CLAIMS')) {
      const uid = String(args[0]);
      const milestone_id = String(args[1]);
      const amount = Number(args[2]);
      const credit_status = String(args[3] ?? 'pending');
      const created_at = Number(args[4] ?? Date.now());
      const pk = `${uid}::${milestone_id}`;
      if (this.tables.reward_milestone_claims.has(pk)) {
        throw new Error(
          'UNIQUE constraint failed: reward_milestone_claims.uid, reward_milestone_claims.milestone_id'
        );
      }
      this.tables.reward_milestone_claims.set(pk, {
        uid,
        milestone_id,
        amount,
        credit_status,
        created_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE REWARD_MILESTONE_CLAIMS')) {
      const credit_status = String(args[0]);
      const uid = String(args[1]);
      const milestone_id = String(args[2]);
      const pk = `${uid}::${milestone_id}`;
      const existing = this.tables.reward_milestone_claims.get(pk);
      if (!existing) return 0;
      existing.credit_status = credit_status;
      return 1;
    }

    // 4. referral_codes (uid PRIMARY KEY, code UNIQUE)
    if (upper.includes('INTO REFERRAL_CODES')) {
      const isIgnore = upper.includes('OR IGNORE');
      const uid = String(args[0]);
      const code = String(args[1]);
      if (this.tables.referral_codes.has(uid)) {
        if (isIgnore) return 0;
        throw new Error('UNIQUE constraint failed: referral_codes.uid');
      }
      const codeOwner = Array.from(this.tables.referral_codes.values()).find(
        (r) => r.code === code
      );
      if (codeOwner && codeOwner.uid !== uid) {
        if (isIgnore) return 0;
        throw new Error('UNIQUE constraint failed: referral_codes.code');
      }
      this.tables.referral_codes.set(uid, { uid, code });
      return 1;
    }

    // 5. referrals (id PRIMARY KEY, invitee_uid UNIQUE)
    if (upper.startsWith('INSERT INTO REFERRALS')) {
      const id = String(args[0]);
      const inviter_uid = String(args[1]);
      const invitee_uid = String(args[2]);
      const inviter_code = String(args[3]);
      const invitee_code = String(args[4]);
      const status = String(args[5] ?? 'pending_confirmation');
      const inviter_accepted = Number(args[6] ?? 0);
      const invitee_accepted = Number(args[7] ?? 0);
      const ip_hash = String(args[8] ?? '');
      const flagged = Number(args[9] ?? 0);
      const inviter_credit_status = String(args[10] ?? 'pending');
      const invitee_credit_status = String(args[11] ?? 'pending');
      const created_at = Number(args[12] ?? Date.now());
      const confirmed_at = args[13] != null ? Number(args[13]) : null;
      const paid_at = args[14] != null ? Number(args[14]) : null;

      if (this.tables.referrals.has(id)) {
        throw new Error('UNIQUE constraint failed: referrals.id');
      }
      const existingInvitee = Array.from(this.tables.referrals.values()).find(
        (r) => r.invitee_uid === invitee_uid
      );
      if (existingInvitee) {
        throw new Error('UNIQUE constraint failed: referrals.invitee_uid');
      }

      this.tables.referrals.set(id, {
        id,
        inviter_uid,
        invitee_uid,
        inviter_code,
        invitee_code,
        status,
        inviter_accepted,
        invitee_accepted,
        ip_hash,
        flagged,
        inviter_credit_status,
        invitee_credit_status,
        created_at,
        confirmed_at,
        paid_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE REFERRALS')) {
      // Distinguish the specific UPDATE REFERRALS queries by their SET clauses
      if (upper.includes('SET INVITER_ACCEPTED =') && upper.includes('INVITEE_ACCEPTED =')) {
        const inviter_accepted = Number(args[0]);
        const invitee_accepted = Number(args[1]);
        const status = String(args[2]);
        const confirmed_at = args[3] != null ? Number(args[3]) : null;
        const id = String(args[4]);
        const row = this.tables.referrals.get(id);
        if (!row) return 0;
        row.inviter_accepted = inviter_accepted;
        row.invitee_accepted = invitee_accepted;
        row.status = status;
        row.confirmed_at = confirmed_at;
        return 1;
      }
      if (upper.includes('SET INVITER_CREDIT_STATUS =') && !upper.includes('INVITEE_CREDIT_STATUS =')) {
        const st = String(args[0]);
        const id = String(args[1]);
        const row = this.tables.referrals.get(id);
        if (!row) return 0;
        row.inviter_credit_status = st;
        return 1;
      }
      if (upper.includes('SET INVITEE_CREDIT_STATUS =') && !upper.includes('INVITER_CREDIT_STATUS =')) {
        const st = String(args[0]);
        const id = String(args[1]);
        const row = this.tables.referrals.get(id);
        if (!row) return 0;
        row.invitee_credit_status = st;
        return 1;
      }
      if (upper.includes('SET STATUS =') && upper.includes('PAID_AT =')) {
        const status = String(args[0]);
        const paid_at = args[1] != null ? Number(args[1]) : null;
        const id = String(args[2]);
        const row = this.tables.referrals.get(id);
        if (!row) return 0;
        row.status = status;
        row.paid_at = paid_at;
        return 1;
      }
      if (upper.includes('SET STATUS =')) {
        const status = String(args[0]);
        const id = String(args[1]);
        const row = this.tables.referrals.get(id);
        if (!row) return 0;
        row.status = status;
        return 1;
      }
    }

    // 6. user_usernames (username_lower PRIMARY KEY, uid UNIQUE)
    // Supports both 6-arg `(username_lower, username_display, uid, account_type, created_at, updated_at)`
    // and 7-arg `(username_lower, username, normalized_lookalike, uid, account_type, created_at, updated_at)`
    if (upper.includes('INTO USER_USERNAMES')) {
      const isReplace = upper.includes('OR REPLACE') || upper.includes('ON CONFLICT');
      const hasLookalikeCol = upper.includes('NORMALIZED_LOOKALIKE') || args.length >= 7;
      const username_lower = String(args[0] ?? '').toLowerCase();
      const usernameDisplay = String(args[1] ?? '');
      const normalized_lookalike = hasLookalikeCol ? String(args[2] ?? '') : username_lower;
      const uid = String((hasLookalikeCol ? args[3] : args[2]) ?? '');
      const account_type = String((hasLookalikeCol ? args[4] : args[3]) ?? 'guest');
      const created_at = Number((hasLookalikeCol ? args[5] : args[4]) ?? Date.now());
      const updated_at = Number((hasLookalikeCol ? args[6] : args[5]) ?? created_at);

      const existingByLower = this.tables.user_usernames.get(username_lower);
      if (existingByLower && existingByLower.uid !== uid) {
        throw new Error('UNIQUE constraint failed: user_usernames.username_lower');
      }
      const existingByUid = Array.from(this.tables.user_usernames.values()).find(
        (r) => r.uid === uid && r.username_lower !== username_lower
      );
      if (existingByUid) {
        if (isReplace) {
          this.tables.user_usernames.delete(existingByUid.username_lower);
        } else {
          throw new Error('UNIQUE constraint failed: user_usernames.uid');
        }
      }

      this.tables.user_usernames.set(username_lower, {
        username_lower,
        username: usernameDisplay,
        username_display: usernameDisplay,
        normalized_lookalike,
        uid,
        account_type,
        created_at,
        updated_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE USER_USERNAMES')) {
      if (upper.includes('SET UID =') && upper.includes('ACCOUNT_TYPE =')) {
        const newUid = String(args[0]);
        const accType = String(args[1]);
        const updatedAt = Number(args[2] ?? Date.now());
        const uLower = String(args[3] ?? '').toLowerCase();
        const row = this.tables.user_usernames.get(uLower);
        if (!row) return 0;
        row.uid = newUid;
        row.account_type = accType;
        row.updated_at = updatedAt;
        return 1;
      }
    }

    // 7. guest_accounts (uid PRIMARY KEY, username_lower UNIQUE)
    if (upper.includes('INTO GUEST_ACCOUNTS')) {
      const uid = String(args[0]);
      const username = String(args[1]);
      const username_lower = String(args[2]).toLowerCase();
      const display_name = String(args[3]);
      const short_id = String(args[4]);
      const account_type = String(args[5] ?? 'guest');
      const is_guest = Number(args[6] ?? 1);
      const email = String(args[7] ?? '');
      const plan = String(args[8] ?? 'free');
      const role = String(args[9] ?? 'student');
      const target_university = String(args[10] ?? 'General Prep');
      const ip_hash = String(args[11] ?? '');
      const device_id_hash = String(args[12] ?? '');
      const created_at = Number(args[13] ?? Date.now());
      const last_active_at = Number(args[14] ?? created_at);

      if (this.tables.guest_accounts.has(uid)) {
        throw new Error('UNIQUE constraint failed: guest_accounts.uid');
      }
      const existingLower = Array.from(this.tables.guest_accounts.values()).find(
        (r) => r.username_lower === username_lower
      );
      if (existingLower) {
        throw new Error('UNIQUE constraint failed: guest_accounts.username_lower');
      }

      this.tables.guest_accounts.set(uid, {
        uid,
        username,
        username_lower,
        display_name,
        short_id,
        account_type,
        is_guest,
        email,
        plan,
        role,
        upgraded_to_uid: null,
        upgraded_at: null,
        target_university,
        tests_completed: 0,
        total_questions_solved: 0,
        streak: 0,
        stats_json: '{}',
        attempts_json: '[]',
        ip_hash,
        device_id_hash,
        is_suspended: 0,
        created_at,
        last_active_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE GUEST_ACCOUNTS')) {
      if (upper.includes('SET LAST_ACTIVE_AT =') && !upper.includes('TESTS_COMPLETED')) {
        const lastActive = Number(args[0] ?? Date.now());
        const uid = String(args[1] ?? '');
        const row = this.tables.guest_accounts.get(uid);
        if (!row) return 0;
        row.last_active_at = lastActive;
        return 1;
      }
      if (upper.includes('SET ACCOUNT_TYPE =') && upper.includes('IS_GUEST = 0')) {
        const accType = String(args[0] ?? 'registered');
        const email = String(args[1] ?? '');
        const upgradedToUid = String(args[2] ?? '');
        const upgradedAt = Number(args[3] ?? Date.now());
        const lastActive = Number(args[4] ?? upgradedAt);
        const uid = String(args[5] ?? '');
        const row = this.tables.guest_accounts.get(uid);
        if (!row) return 0;
        row.account_type = accType;
        row.is_guest = 0;
        row.email = email;
        row.upgraded_to_uid = upgradedToUid;
        row.upgraded_at = upgradedAt;
        row.last_active_at = lastActive;
        return 1;
      }
      if (upper.includes('SET TESTS_COMPLETED =')) {
        const tests_completed = Number(args[0] ?? 0);
        const total_questions_solved = Number(args[1] ?? 0);
        const streak = Number(args[2] ?? 0);
        const target_university = String(args[3] ?? 'General Prep');
        const stats_json = String(args[4] ?? '{}');
        const attempts_json = String(args[5] ?? '[]');
        const last_active_at = Number(args[6] ?? Date.now());
        const uid = String(args[7] ?? '');
        const row = this.tables.guest_accounts.get(uid);
        if (!row) return 0;
        row.tests_completed = tests_completed;
        row.total_questions_solved = total_questions_solved;
        row.streak = streak;
        row.target_university = target_university;
        row.stats_json = stats_json;
        row.attempts_json = attempts_json;
        row.last_active_at = last_active_at;
        return 1;
      }
    }

    // 8. guest_sessions (session_id PRIMARY KEY, token_hash UNIQUE)
    if (upper.includes('INTO GUEST_SESSIONS')) {
      const session_id = String(args[0]);
      const token_hash = String(args[1]);
      const uid = String(args[2]);
      const ip_hash = String(args[3] ?? '');
      const device_id_hash = String(args[4] ?? '');
      const user_agent = String(args[5] ?? '');
      const created_at = Number(args[6] ?? Date.now());
      const last_active_at = Number(args[7] ?? created_at);
      const expires_at = Number(args[8] ?? created_at + 30 * 86400 * 1000);
      const revoked = Number(args[9] ?? 0);

      this.tables.guest_sessions.set(session_id, {
        session_id,
        token_hash,
        uid,
        ip_hash,
        device_id_hash,
        user_agent,
        created_at,
        last_active_at,
        expires_at,
        revoked,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE GUEST_SESSIONS')) {
      if (upper.includes('SET LAST_ACTIVE_AT =') && upper.includes('EXPIRES_AT =')) {
        const lastActive = Number(args[0] ?? Date.now());
        const expiresAt = Number(args[1] ?? lastActive + 30 * 86400 * 1000);
        const sessionId = String(args[2] ?? '');
        const row = this.tables.guest_sessions.get(sessionId);
        if (!row) return 0;
        row.last_active_at = lastActive;
        row.expires_at = expiresAt;
        return 1;
      }
      if (upper.includes('SET REVOKED = 1') && upper.includes('WHERE TOKEN_HASH =')) {
        const th = String(args[0] ?? '');
        let changes = 0;
        for (const r of this.tables.guest_sessions.values()) {
          if (r.token_hash === th) {
            r.revoked = 1;
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('SET REVOKED = 1') && upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        let changes = 0;
        for (const r of this.tables.guest_sessions.values()) {
          if (r.uid === uid) {
            r.revoked = 1;
            changes++;
          }
        }
        return changes;
      }
    }

    // 9. guest_creation_rate_limits
    if (upper.includes('INTO GUEST_CREATION_RATE_LIMITS')) {
      const identifier_hash = String(args[0] ?? '');
      const identifier_type = String(args[1] ?? 'ip');
      const uid = String(args[2] ?? '');
      const created_at = Number(args[3] ?? Date.now());
      this.tables.guest_creation_rate_limits.push({
        id: this.tables.guest_creation_rate_limits.length + 1,
        identifier_hash,
        identifier_type,
        uid,
        created_at,
      });
      return 1;
    }

    return 0;
  }
}

// Singleton local D1 instance for Vite dev when Cloudflare env.DB is not provided
let sharedLocalD1: InMemoryD1Database | null = null;

export function getSharedLocalD1Database(): InMemoryD1Database {
  if (!sharedLocalD1) {
    sharedLocalD1 = new InMemoryD1Database();
  }
  return sharedLocalD1;
}
