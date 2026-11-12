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
import {
  extractTrustedDeviceTokenFromRequest,
  hashTrustedDeviceToken,
} from './twoFactorCrypto';

export const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0365509316';
export const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

export const DEFAULT_SUPERADMIN_UIDS = [
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'uid_superadmin_1',
  'uid_superadmin_2',
];
export const DEFAULT_SUPERADMIN_EMAILS: string[] = [];

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
  signInProviders?: string[];
  hasGoogleProvider?: boolean;
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
  OTP_HMAC_SECRET?: string;
  TOTP_ENCRYPTION_KEY?: string;
  RESEND_API_KEY?: string;
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
        identities?: Record<string, unknown>;
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
    const identityProviders =
      payload.firebase?.identities && typeof payload.firebase.identities === 'object'
        ? Object.keys(payload.firebase.identities).filter((k) => {
            const val = (payload.firebase?.identities as Record<string, unknown>)[k];
            return Array.isArray(val) ? val.length > 0 : Boolean(val);
          })
        : [];
    const signInProviders = Array.from(
      new Set([
        ...(signInProvider ? [signInProvider] : []),
        ...identityProviders,
      ])
    );
    const hasGoogleProvider =
      signInProvider === 'google.com' || signInProviders.includes('google.com');

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
      signInProviders,
      hasGoogleProvider,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side source of truth for whether a registered user's current session is verified:
 * 1. Email Verification at Sign Up (required once):
 *    - Google sign-in (`signInProvider === 'google.com'` or `hasGoogleProvider === true` in the verified JWT) is already verified by Google.
 *    - Otherwise, user must have `email_verification_sessions.email_verified = 1` or `verified.emailVerified === true`.
 *    - If unverified, returns `false` (blocks dashboard & protected APIs).
 * 2. Optional Two-Step Verification (Settings > Security):
 *    - If user does NOT have 2FA enabled (`totp_enabled = 0` and `email_2fa_enabled = 0`, or 24h recovery timer expired),
 *      returns `true` immediately once email is verified (normal login does NOT ask for any code).
 *    - If 2FA IS enabled (for password, username, OR Google sign-in), user must EITHER:
 *      (a) have a valid, non-revoked, non-expired trusted device cookie/header (`trusted_devices`), OR
 *      (b) have completed 2FA for this login (`email_verification_sessions.verified_auth_time >= tokenAuthTime`
 *          and no active unverified `pending_2fa_challenges` row).
 */
export async function isD1UserSessionVerified(
  db: RewardsD1Database,
  verified: VerifiedFirebaseToken,
  options?: {
    request?: Request | null;
    hmacSecret?: string;
    nowMs?: number;
  }
): Promise<boolean> {
  if (!verified || !verified.uid) return false;
  const nowMs = options?.nowMs ?? Date.now();

  let sessionRow: {
    user_id: string;
    email_hash?: string;
    email_verified: number;
    verified_auth_time: number;
    verified_at?: number;
  } | null = null;

  try {
    sessionRow = await db
      .prepare(
        'SELECT user_id, email_hash, email_verified, verified_auth_time, verified_at FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
      .bind(verified.uid)
      .first<{
        user_id: string;
        email_hash?: string;
        email_verified: number;
        verified_auth_time: number;
        verified_at?: number;
      }>();
  } catch {
    // Table may not exist yet before first migration run
  }

  // Step 1: Check one-time email verification on the server
  const isGoogleUser =
    verified.signInProvider === 'google.com' ||
    Boolean(verified.hasGoogleProvider) ||
    Boolean(verified.signInProviders?.includes('google.com'));
  const isEmailVerifiedInD1 = Boolean(sessionRow && Number(sessionRow.email_verified) === 1);
  const isEmailVerifiedInToken =
    verified.emailVerified === true && (!sessionRow || Number(sessionRow.email_verified) !== 0);

  const isEmailVerified = isGoogleUser || isEmailVerifiedInD1 || isEmailVerifiedInToken;
  if (!isEmailVerified) {
    return false;
  }

  // Automatic server-side migration: if the account is verified (via Google provider or token claim)
  // but email_verification_sessions is missing or has email_verified != 1, heal the D1 row immediately.
  if ((isGoogleUser || isEmailVerifiedInToken) && (!sessionRow || Number(sessionRow.email_verified) !== 1)) {
    const tokenAuthTimeSec = Number(verified.authTime || verified.iat || 0);
    const verifiedAtVal = sessionRow?.verified_at || nowMs;
    const emailHashVal = sessionRow?.email_hash || (verified.email ? verified.email.trim().toLowerCase() : 'google_verified');
    try {
      await db
        .prepare(
          `INSERT INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, 1, ?3, ?4, ?5)
           ON CONFLICT(user_id) DO UPDATE SET
             email_verified = 1,
             verified_auth_time = CASE WHEN excluded.verified_auth_time > email_verification_sessions.verified_auth_time THEN excluded.verified_auth_time ELSE email_verification_sessions.verified_auth_time END,
             verified_at = COALESCE(email_verification_sessions.verified_at, excluded.verified_at),
             updated_at = excluded.updated_at`
        )
        .bind(verified.uid, emailHashVal, tokenAuthTimeSec, verifiedAtVal, nowMs)
        .run();
      sessionRow = {
        user_id: verified.uid,
        email_hash: emailHashVal,
        email_verified: 1,
        verified_auth_time: Math.max(Number(sessionRow?.verified_auth_time || 0), tokenAuthTimeSec),
        verified_at: verifiedAtVal,
      };
    } catch {
      // Non-fatal if table does not exist in test environment
    }
  }

  // Step 2: Check optional Two-Step Verification (user_2fa)
  let twoFaRow: {
    user_id: string;
    totp_enabled: number;
    email_2fa_enabled: number;
    recovery_disable_at: number | null;
  } | null = null;

  try {
    twoFaRow = await db
      .prepare(
        'SELECT user_id, totp_enabled, email_2fa_enabled, recovery_disable_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(verified.uid)
      .first<{
        user_id: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        recovery_disable_at: number | null;
      }>();
  } catch {
    // user_2fa table may not exist yet
  }

  if (
    twoFaRow &&
    twoFaRow.recovery_disable_at != null &&
    Number(twoFaRow.recovery_disable_at) > 0 &&
    nowMs >= Number(twoFaRow.recovery_disable_at)
  ) {
    // 24-hour recovery cooling-off period has elapsed -> automatically turn off 2FA
    try {
      await db
        .prepare(
          'UPDATE user_2fa SET totp_enabled = 0, email_2fa_enabled = 0, encrypted_secret = NULL, pending_encrypted_secret = NULL, recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
        )
        .bind(nowMs, verified.uid)
        .run();
      await db
        .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
        .bind(verified.uid)
        .run();
    } catch {
      // Non-fatal
    }
    twoFaRow = {
      ...twoFaRow,
      totp_enabled: 0,
      email_2fa_enabled: 0,
      recovery_disable_at: null,
    };
  }

  const has2fa = Boolean(
    twoFaRow &&
      (Number(twoFaRow.totp_enabled) === 1 || Number(twoFaRow.email_2fa_enabled) === 1)
  );

  if (!has2fa) {
    // If an administrator explicitly revoked active sessions (verified_auth_time < 0),
    // any token issued at or before the revocation timestamp is no longer verified until the user logs in again.
    if (sessionRow && Number(sessionRow.verified_auth_time) < 0) {
      const revokedAtSec = Math.abs(Number(sessionRow.verified_auth_time));
      const tokenAuthTimeSec = Number(verified.authTime || verified.iat || 0);
      if (tokenAuthTimeSec <= 0 || tokenAuthTimeSec <= revokedAtSec) {
        return false;
      }
    }
    // Normal login: email is verified and 2FA is OFF -> verified immediately without any code!
    return true;
  }

  // Step 3: 2FA is ON. Check if request carries a valid 30-day trusted device token
  const rawDeviceToken = extractTrustedDeviceTokenFromRequest(options?.request);
  if (rawDeviceToken) {
    try {
      const hmacSecret =
        (options?.hmacSecret || '').trim() ||
        'boardly-default-otp-hmac-secret-v1-do-not-expose';
      const tokenHash = await hashTrustedDeviceToken(rawDeviceToken, hmacSecret);
      const trustedRow = await db
        .prepare(
          'SELECT id, user_id, expires_at, revoked FROM trusted_devices WHERE token_hash = ?1 AND revoked = 0 LIMIT 1'
        )
        .bind(tokenHash)
        .first<{ id: string; user_id: string; expires_at: number; revoked: number }>();

      if (
        trustedRow &&
        trustedRow.user_id === verified.uid &&
        Number(trustedRow.revoked) === 0 &&
        Number(trustedRow.expires_at) > nowMs
      ) {
        return true;
      }
    } catch {
      // Ignore trusted device lookup error
    }
  }

  // Step 4: Check if there is an active unverified pending 2FA challenge
  try {
    const pendingChallenge = await db
      .prepare(
        'SELECT challenge_id, auth_time, expires_at, verified FROM pending_2fa_challenges WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(verified.uid)
      .first<{
        challenge_id: string;
        auth_time: number;
        expires_at: number;
        verified: number;
      }>();

    if (pendingChallenge && Number(pendingChallenge.verified) === 0) {
      return false;
    }
  } catch {
    // Table may not exist yet
  }

  // Step 5: Verify that `email_verification_sessions.verified_auth_time` covers this token's `authTime`
  if (!sessionRow || Number(sessionRow.email_verified) !== 1) {
    return false;
  }

  const tokenAuthTime = Number(verified.authTime || verified.iat || 0);
  const verifiedAuthTime = Number(sessionRow.verified_auth_time || 0);
  if (verifiedAuthTime <= 0) {
    return false;
  }
  if (tokenAuthTime > 0 && verifiedAuthTime < tokenAuthTime) {
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
export const ABANDONED_GUEST_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7-day grace period after logout before purge
export const INACTIVE_GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day inactivity cutoff before purge

export async function purgeExpiredGuestAccounts(
  db: RewardsD1Database,
  nowMs: number = Date.now()
): Promise<{ purgedCount: number; purgedUids: string[] }> {
  const inactiveCutoffMs = nowMs - INACTIVE_GUEST_TTL_MS;
  const purgedUids: string[] = [];

  try {
    const { results: candidateRows } = await db
      .prepare(
        `SELECT uid, username_lower, is_guest, upgraded_to_uid, status, abandoned_at, purge_after, last_active_at
         FROM guest_accounts`
      )
      .all<Record<string, any>>();

    for (const row of candidateRows || []) {
      const uid = String(row.uid || '');
      if (!uid) continue;
      const isUpgraded = Boolean(row.upgraded_to_uid) || String(row.status || '') === 'upgraded';
      if (isUpgraded) continue;

      const status = String(row.status || 'active');
      const purgeAfter = row.purge_after != null ? Number(row.purge_after) : null;
      const lastActiveAt = Number(row.last_active_at || row.created_at || 0);

      const isAbandonedExpired =
        status === 'abandoned' && purgeAfter !== null && purgeAfter > 0 && purgeAfter <= nowMs;
      const isInactiveExpired =
        Number(row.is_guest) === 1 && lastActiveAt > 0 && lastActiveAt <= inactiveCutoffMs;

      if (isAbandonedExpired || isInactiveExpired) {
        await db
          .prepare(`DELETE FROM user_usernames WHERE uid = ?1 AND account_type = 'guest'`)
          .bind(uid)
          .run()
          .catch(() => {});
        await db
          .prepare('DELETE FROM guest_sessions WHERE uid = ?1')
          .bind(uid)
          .run()
          .catch(() => {});
        await db
          .prepare('DELETE FROM guest_accounts WHERE uid = ?1')
          .bind(uid)
          .run()
          .catch(() => {});
        purgedUids.push(uid);
      }
    }
  } catch (err) {
    console.warn('[purgeExpiredGuestAccounts] non-fatal error:', err);
  }

  return { purgedCount: purgedUids.length, purgedUids };
}

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
      Number(guestRow.is_suspended) === 1 ||
      String(guestRow.status || 'active') === 'abandoned' ||
      Number(guestRow.abandoned_at || 0) > 0
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
        role?: string;
        custom_role?: string | null;
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
              'SELECT username_lower, username_display, uid, role, custom_role FROM user_usernames WHERE uid = ?1 LIMIT 1'
            )
            .bind(uid)
            .first(),
        ]);
      } catch {
        // Non-fatal if tables not initialized
      }

      const isHardcodedSuperAdmin =
        superUids.has(uid) ||
        /^(?:sa1|sa2)_/i.test(uid) ||
        verified.role === 'superadmin' ||
        verified.admin === true;

      let role: 'student' | 'captain' | 'admin' | 'superadmin' = 'student';
      if (
        isHardcodedSuperAdmin ||
        roleRow?.role === 'superadmin' ||
        usernameRow?.role === 'superadmin'
      ) {
        role = 'superadmin';
      } else if (
        roleRow?.role === 'admin' ||
        usernameRow?.role === 'admin' ||
        uid === 'uid_regular_admin' ||
        /^reg_/i.test(uid) ||
        verified.role === 'admin'
      ) {
        role = 'admin';
      } else if (
        roleRow?.role === 'captain' ||
        usernameRow?.role === 'captain' ||
        verified.role === 'captain'
      ) {
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

      const sessionVerified = await isD1UserSessionVerified(db, verified, {
        request,
        hmacSecret: secret || env?.OTP_HMAC_SECRET,
      });

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
        emailVerified:
          Boolean(verified.emailVerified) ||
          Boolean(verified.hasGoogleProvider) ||
          verified.signInProvider === 'google.com' ||
          sessionVerified,
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
        purpose: string;
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
        purpose: string;
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
        email?: string;
        display_name?: string;
        avatar?: string;
        frame?: string | null;
        role?: string;
        custom_role?: string | null;
        bio?: string;
        status?: string;
        accent?: string;
        profile_layout?: string;
        created_at: number;
        updated_at: number;
      }
    >;
    username_history: Map<
      string,
      {
        username_lower: string;
        username_display: string;
        uid: string;
        changed_at: number;
        expires_at: number;
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
        status?: string;
        abandoned_at?: number | null;
        purge_after?: number | null;
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
    login_rate_limits: Map<
      string,
      {
        rate_key: string;
        attempts: number;
        window_start_ms: number;
        blocked_until_ms: number | null;
        updated_at_ms: number;
      }
    >;
    user_2fa: Map<
      string,
      {
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        pending_encrypted_secret: string | null;
        last_used_step: number;
        recovery_requested_at: number | null;
        recovery_disable_at: number | null;
        updated_at: number;
        created_at: number;
      }
    >;
    user_2fa_backup_codes: Map<
      string,
      {
        id: string;
        user_id: string;
        code_hash: string;
        used: number;
        used_at: number | null;
        created_at: number;
      }
    >;
    trusted_devices: Map<
      string,
      {
        id: string;
        user_id: string;
        token_hash: string;
        user_agent: string;
        ip_hash: string;
        created_at: number;
        last_used_at: number;
        expires_at: number;
        revoked: number;
      }
    >;
    pending_2fa_challenges: Map<
      string,
      {
        challenge_id: string;
        user_id: string;
        auth_time: number;
        expires_at: number;
        attempt_count: number;
        verified: number;
        created_at: number;
      }
    >;
    security_audit_logs: Map<
      string,
      {
        id: string;
        user_id: string;
        actor_id: string;
        event_type: string;
        ip_hash: string;
        details_json: string;
        created_at: number;
      }
    >;
    legal_consent_records: Map<
      string,
      {
        id: string;
        user_id: string;
        account_type: string;
        document_version: string;
        action_context: string;
        ip_hash: string;
        user_agent: string;
        accepted_at: number;
      }
    >;
    user_koban_style: Map<
      string,
      {
        user_id: string;
        design: string;
        main_color: string;
        accent_color: string;
        glow_color: string;
        glow: number;
        motion: string;
        sparkle: number;
        updated_at: number;
      }
    >;
    user_pro_badge: Map<
      string,
      {
        user_id: string;
        design: string;
        visible: number;
        updated_at: number;
      }
    >;
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
    username_history: new Map(),
    guest_accounts: new Map(),
    guest_sessions: new Map(),
    guest_creation_rate_limits: [],
    login_rate_limits: new Map(),
    user_2fa: new Map(),
    user_2fa_backup_codes: new Map(),
    trusted_devices: new Map(),
    pending_2fa_challenges: new Map(),
    security_audit_logs: new Map(),
    legal_consent_records: new Map(),
    user_koban_style: new Map(),
    user_pro_badge: new Map(),
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
            const rawAccType = String(r.account_type || 'registered');
            const rawEmail = String(r.email || '');
            const isSwapped =
              rawAccType.includes('@') && /^\d{10,}$/.test(rawEmail);
            this.tables.user_usernames.set(String(r.username_lower), {
              ...r,
              username: r.username || r.username_display || r.username_lower,
              username_display: r.username_display || r.username || r.username_lower,
              account_type: isSwapped ? 'registered' : rawAccType,
              email: isSwapped ? rawAccType.toLowerCase() : rawEmail,
              profile_layout: String(r.profile_layout || 'game-card'),
            });
          }
        }
      }
      if (Array.isArray(raw.username_history)) {
        for (const r of raw.username_history) {
          if (r && r.username_lower) {
            this.tables.username_history.set(String(r.username_lower).toLowerCase(), {
              username_lower: String(r.username_lower).toLowerCase(),
              username_display: String(r.username_display || r.username_lower),
              uid: String(r.uid || ''),
              changed_at: Number(r.changed_at || Date.now()),
              expires_at: Number(r.expires_at || Date.now() + 14 * 86400 * 1000),
            });
          }
        }
      }
      if (Array.isArray(raw.guest_accounts)) {
        for (const r of raw.guest_accounts) {
          if (r && r.uid) {
            this.tables.guest_accounts.set(String(r.uid), {
              status: 'active',
              abandoned_at: null,
              purge_after: null,
              ...r,
            });
          }
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
      if (Array.isArray(raw.user_koban_style)) {
        for (const r of raw.user_koban_style) {
          if (r && r.user_id) this.tables.user_koban_style.set(String(r.user_id), r);
        }
      }
      if (Array.isArray(raw.user_pro_badge)) {
        for (const r of raw.user_pro_badge) {
          if (r && r.user_id) {
            this.tables.user_pro_badge.set(String(r.user_id), {
              user_id: String(r.user_id),
              design: String(r.design || 'ember'),
              visible: Number(r.visible ?? 1),
              updated_at: Number(r.updated_at || Date.now()),
            });
          }
        }
      }
      if (Array.isArray(raw.user_2fa)) {
        for (const r of raw.user_2fa) {
          if (r && r.user_id) {
            this.tables.user_2fa.set(String(r.user_id), {
              user_id: String(r.user_id),
              email: String(r.email || ''),
              totp_enabled: Number(r.totp_enabled ?? 0),
              email_2fa_enabled: Number(r.email_2fa_enabled ?? 0),
              encrypted_secret: r.encrypted_secret ?? null,
              pending_encrypted_secret: r.pending_encrypted_secret ?? null,
              last_used_step: Number(r.last_used_step ?? 0),
              recovery_requested_at:
                r.recovery_requested_at != null ? Number(r.recovery_requested_at) : null,
              recovery_disable_at:
                r.recovery_disable_at != null ? Number(r.recovery_disable_at) : null,
              updated_at: Number(r.updated_at ?? Date.now()),
              created_at: Number(r.created_at ?? Date.now()),
            });
          }
        }
      }
      if (Array.isArray(raw.user_2fa_backup_codes)) {
        for (const r of raw.user_2fa_backup_codes) {
          if (r && r.id) this.tables.user_2fa_backup_codes.set(String(r.id), r);
        }
      }
      if (Array.isArray(raw.trusted_devices)) {
        for (const r of raw.trusted_devices) {
          if (r && r.id) this.tables.trusted_devices.set(String(r.id), r);
        }
      }
      if (Array.isArray(raw.security_audit_logs)) {
        for (const r of raw.security_audit_logs) {
          if (r && r.id) this.tables.security_audit_logs.set(String(r.id), r);
        }
      }
      if (Array.isArray(raw.user_roles)) {
        for (const r of raw.user_roles) {
          if (r && r.uid) this.tables.user_roles.set(String(r.uid), r);
        }
      }

      // Restore canonical 2FA rows for existing seeded test accounts if prior saveToDisk omitted user_2fa
      for (const u of this.tables.user_usernames.values()) {
        const uid = String(u.uid || '');
        if (!uid || this.tables.user_2fa.has(uid)) continue;
        if (uid === 'uid_student_totp' || uid.startsWith('utotp_')) {
          this.tables.user_2fa.set(uid, {
            user_id: uid,
            email: String(u.email || `${uid}@example.com`),
            totp_enabled: 1,
            email_2fa_enabled: 0,
            encrypted_secret: null,
            pending_encrypted_secret: null,
            last_used_step: 0,
            recovery_requested_at: null,
            recovery_disable_at: null,
            updated_at: Number(u.updated_at || 1775000000000),
            created_at: Number(u.created_at || 1775000000000),
          });
        } else if (uid === 'uid_student_rec' || uid.startsWith('urec_')) {
          this.tables.user_2fa.set(uid, {
            user_id: uid,
            email: String(u.email || `${uid}@example.com`),
            totp_enabled: 0,
            email_2fa_enabled: 1,
            encrypted_secret: null,
            pending_encrypted_secret: null,
            last_used_step: 0,
            recovery_requested_at: null,
            recovery_disable_at: null,
            updated_at: Number(u.updated_at || 1775000000000),
            created_at: Number(u.created_at || 1775000000000),
          });
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
        username_history: Array.from(this.tables.username_history.values()),
        guest_accounts: Array.from(this.tables.guest_accounts.values()),
        guest_sessions: Array.from(this.tables.guest_sessions.values()),
        email_verification_sessions: Array.from(this.tables.email_verification_sessions.values()),
        user_koban_style: Array.from(this.tables.user_koban_style.values()),
        user_pro_badge: Array.from(this.tables.user_pro_badge.values()),
        user_2fa: Array.from(this.tables.user_2fa.values()),
        user_2fa_backup_codes: Array.from(this.tables.user_2fa_backup_codes.values()),
        trusted_devices: Array.from(this.tables.trusted_devices.values()),
        security_audit_logs: Array.from(this.tables.security_audit_logs.values()),
        user_roles: Array.from(this.tables.user_roles.values()),
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
      if (upper.includes('WHERE UID IN')) {
        const uidSet = new Set(args.map((a) => String(a ?? '')));
        return Array.from(this.tables.user_roles.values())
          .filter((r) => uidSet.has(String(r.uid)))
          .map((r) => ({ ...r }));
      }
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
      if (upper.includes('WHERE UID IN')) {
        const uidSet = new Set(args.map((a) => String(a ?? '')));
        return all.filter((r) => uidSet.has(String(r.uid))).map((r) => ({ ...r }));
      }
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
      if (upper.includes('WHERE EMAIL =')) {
        const em = String(args[0] ?? '').toLowerCase();
        const found = all.find((r) => (r.email || '').toLowerCase() === em);
        return found ? [{ ...found }] : [];
      }
      if (upper.includes('WHERE NORMALIZED_LOOKALIKE =')) {
        const lookalike = String(args[0] ?? '');
        return all.filter((r) => r.normalized_lookalike === lookalike).map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 12b. username_history
    if (upper.includes('FROM USERNAME_HISTORY')) {
      const all = Array.from(this.tables.username_history.values());
      if (upper.includes('WHERE USERNAME_LOWER =')) {
        const uLower = String(args[0] ?? '').toLowerCase();
        const nowMs = args.length > 1 ? Number(args[1] ?? 0) : 0;
        const row = this.tables.username_history.get(uLower);
        if (!row) return [];
        if (upper.includes('EXPIRES_AT >') && nowMs > 0 && row.expires_at <= nowMs) {
          return [];
        }
        return [{ ...row }];
      }
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        return all.filter((r) => r.uid === uid).map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 13. guest_accounts
    if (upper.includes('FROM GUEST_ACCOUNTS')) {
      const all = Array.from(this.tables.guest_accounts.values());
      if (upper.includes('WHERE UID IN')) {
        const uidSet = new Set(args.map((a) => String(a ?? '')));
        return all.filter((r) => uidSet.has(String(r.uid))).map((r) => ({ ...r }));
      }
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

    // 16. login_rate_limits
    if (upper.includes('FROM LOGIN_RATE_LIMITS')) {
      const key = String(args[0] ?? '');
      const row = this.tables.login_rate_limits.get(key);
      return row
        ? [
            {
              ...row,
              attempt_count: row.attempts,
              window_start: row.window_start_ms,
              locked_until: row.blocked_until_ms,
              updated_at: row.updated_at_ms,
            },
          ]
        : [];
    }

    // 17. user_2fa
    if (upper.includes('FROM USER_2FA') && !upper.includes('FROM USER_2FA_BACKUP_CODES')) {
      const includeSecrets = upper.includes('ENCRYPTED_SECRET') || upper.includes('SELECT *');
      const sanitizeRow = (r: any) => {
        if (includeSecrets) return { ...r };
        const copy = { ...r };
        delete copy.encrypted_secret;
        delete copy.pending_encrypted_secret;
        return copy;
      };
      const all = Array.from(this.tables.user_2fa.values());
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.user_2fa.get(uid);
        return row ? [sanitizeRow(row)] : [];
      }
      if (upper.includes('WHERE USER_ID IN')) {
        const uidSet = new Set(args.map((a) => String(a ?? '')));
        return all.filter((r) => uidSet.has(String(r.user_id))).map(sanitizeRow);
      }
      return all.map(sanitizeRow);
    }

    // 18. user_2fa_backup_codes
    if (upper.includes('FROM USER_2FA_BACKUP_CODES')) {
      const all = Array.from(this.tables.user_2fa_backup_codes.values());
      if (upper.includes('GROUP BY USER_ID')) {
        const onlyUnused = upper.includes('USED = 0');
        const counts = new Map<string, number>();
        for (const r of all) {
          if (onlyUnused && Number(r.used) !== 0) continue;
          const uid = String(r.user_id || '');
          if (!uid) continue;
          counts.set(uid, (counts.get(uid) || 0) + 1);
        }
        return Array.from(counts.entries()).map(([user_id, cnt]) => ({ user_id, cnt }));
      }
      if (upper.includes('COUNT(*)') && upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const onlyUnused = upper.includes('AND USED = 0');
        const cnt = all.filter(
          (r) => r.user_id === uid && (!onlyUnused || Number(r.used) === 0)
        ).length;
        return [{ cnt }];
      }
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        let rows = all.filter((r) => r.user_id === uid);
        if (upper.includes('AND USED = 0')) {
          rows = rows.filter((r) => Number(r.used) === 0);
        }
        return rows.map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 19. trusted_devices
    if (upper.includes('FROM TRUSTED_DEVICES')) {
      const all = Array.from(this.tables.trusted_devices.values());
      if (upper.includes('GROUP BY USER_ID')) {
        const nowMs = args.length > 0 ? Number(args[0] ?? 0) : 0;
        const counts = new Map<string, number>();
        for (const r of all) {
          if (Number(r.revoked) !== 0) continue;
          if (nowMs > 0 && Number(r.expires_at) <= nowMs) continue;
          const uid = String(r.user_id || '');
          if (!uid) continue;
          counts.set(uid, (counts.get(uid) || 0) + 1);
        }
        return Array.from(counts.entries()).map(([user_id, cnt]) => ({ user_id, cnt }));
      }
      if (upper.includes('WHERE TOKEN_HASH =')) {
        const th = String(args[0] ?? '');
        const onlyActive = upper.includes('REVOKED = 0');
        const found = all.find(
          (r) => r.token_hash === th && (!onlyActive || Number(r.revoked) === 0)
        );
        return found ? [{ ...found }] : [];
      }
      if (upper.includes('COUNT(*)') && upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const nowMs = args.length > 1 ? Number(args[1] ?? 0) : 0;
        const cnt = all.filter(
          (r) =>
            r.user_id === uid &&
            Number(r.revoked) === 0 &&
            (nowMs <= 0 || Number(r.expires_at) > nowMs)
        ).length;
        return [{ cnt }];
      }
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        return all
          .filter((r) => r.user_id === uid && (!upper.includes('REVOKED = 0') || Number(r.revoked) === 0))
          .map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 20. pending_2fa_challenges
    if (upper.includes('FROM PENDING_2FA_CHALLENGES')) {
      const all = Array.from(this.tables.pending_2fa_challenges.values());
      if (upper.includes('WHERE CHALLENGE_ID =')) {
        const cid = String(args[0] ?? '');
        const row = this.tables.pending_2fa_challenges.get(cid);
        return row ? [{ ...row }] : [];
      }
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        let rows = all.filter((r) => r.user_id === uid);
        if (upper.includes('AND VERIFIED = 0')) {
          rows = rows.filter((r) => Number(r.verified) === 0);
        }
        rows.sort((a, b) => b.created_at - a.created_at);
        return rows.map((r) => ({ ...r }));
      }
      return all.map((r) => ({ ...r }));
    }

    // 21. security_audit_logs
    if (upper.includes('FROM SECURITY_AUDIT_LOGS')) {
      const all = Array.from(this.tables.security_audit_logs.values());
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const limit = args.length > 1 ? Number(args[1] ?? 50) : 50;
        return all
          .filter((r) => r.user_id === uid)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, limit)
          .map((r) => ({ ...r }));
      }
      const limit = args.length > 0 ? Number(args[0] ?? 100) : 100;
      return all
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit)
        .map((r) => ({ ...r }));
    }

    // 22. legal_consent_records
    if (upper.includes('FROM LEGAL_CONSENT_RECORDS')) {
      const all = Array.from(this.tables.legal_consent_records.values());
      if (upper.includes('WHERE USER_ID =') && upper.includes('DOCUMENT_VERSION =')) {
        const uid = String(args[0] ?? '');
        const ver = String(args[1] ?? '');
        return all
          .filter((r) => r.user_id === uid && r.document_version === ver)
          .sort((a, b) => b.accepted_at - a.accepted_at)
          .map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        return all
          .filter((r) => r.user_id === uid)
          .sort((a, b) => b.accepted_at - a.accepted_at)
          .map((r) => ({ ...r }));
      }
      return all.sort((a, b) => b.accepted_at - a.accepted_at).map((r) => ({ ...r }));
    }

    // 23. user_koban_style
    if (upper.includes('FROM USER_KOBAN_STYLE')) {
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.user_koban_style.get(uid);
        return row ? [{ ...row }] : [];
      }
      return Array.from(this.tables.user_koban_style.values()).map((r) => ({ ...r }));
    }

    // 24. user_pro_badge
    if (upper.includes('FROM USER_PRO_BADGE')) {
      if (upper.includes('WHERE USER_ID IN')) {
        const uidSet = new Set(args.map((a) => String(a ?? '').trim()).filter(Boolean));
        return Array.from(this.tables.user_pro_badge.values())
          .filter((r) => uidSet.has(r.user_id))
          .map((r) => ({ ...r }));
      }
      if (upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        const row = this.tables.user_pro_badge.get(uid);
        return row ? [{ ...row }] : [];
      }
      return Array.from(this.tables.user_pro_badge.values()).map((r) => ({ ...r }));
    }

    return [];
  }

  private executeMutation(sql: string, args: any[]): number {
    const upper = sql.toUpperCase();

    if (
      upper.startsWith('CREATE TABLE') ||
      upper.startsWith('CREATE INDEX') ||
      upper.startsWith('ALTER TABLE')
    ) {
      return 0;
    }

    // 0a. email_verification_codes
    if (upper.includes('INTO EMAIL_VERIFICATION_CODES')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const email_hash = String(args[2]);
      const purpose = String(args[3] || 'signup');
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

    if (upper.startsWith('UPDATE EMAIL_VERIFICATION_SESSIONS')) {
      if (upper.includes('SET VERIFIED_AUTH_TIME =')) {
        const isLiteralZero = upper.includes('SET VERIFIED_AUTH_TIME = 0') && args.length === 2;
        const verified_auth_time = isLiteralZero ? 0 : Number(args[0] ?? 0);
        const updated_at = Number((isLiteralZero ? args[0] : args[1]) ?? Date.now());
        const user_id = String((isLiteralZero ? args[1] : args[2]) ?? '');
        const existing = this.tables.email_verification_sessions.get(user_id);
        if (!existing) return 0;
        existing.verified_auth_time = verified_auth_time;
        existing.updated_at = updated_at;
        return 1;
      }
    }

    // 0c. email_verification_send_logs
    if (upper.includes('INTO EMAIL_VERIFICATION_SEND_LOGS')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const email_hash = String(args[2]);
      const ip_hash = String(args[3]);
      const purpose = String(args[4] || 'signup');
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

    // 2b. user_roles (uid PRIMARY KEY)
    if (upper.includes('INTO USER_ROLES')) {
      const uid = String(args[0] ?? '');
      if (!uid) return 0;
      const email = String(args[1] ?? '');
      const role = String(args[2] ?? 'student');
      const custom_role = args[3] != null ? String(args[3]) : null;
      const is_posting_banned = Number(args[4] ?? 0);
      const updated_at = Number(args[5] ?? Date.now());
      const created_at = Number(args[6] ?? updated_at);
      this.tables.user_roles.set(uid, {
        uid,
        email,
        role,
        custom_role,
        is_posting_banned,
        updated_at,
        created_at,
      });
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
    if (upper.includes('INTO USER_USERNAMES')) {
      const isReplace = upper.includes('OR REPLACE') || upper.includes('ON CONFLICT');
      const colMatch = upper.match(/INTO\s+USER_USERNAMES\s*\(([^)]+)\)/);
      const cols = colMatch
        ? colMatch[1].split(',').map((c) => c.trim().toUpperCase())
        : [];
      const hasLookalikeCol = cols.length > 0 ? cols.includes('NORMALIZED_LOOKALIKE') : upper.includes('NORMALIZED_LOOKALIKE');
      const hasAccountTypeCol = cols.length > 0 ? cols.includes('ACCOUNT_TYPE') : true;
      const hasEmailCol = cols.length > 0 ? cols.includes('EMAIL') : upper.includes('EMAIL');
      const username_lower = String(args[0] ?? '').toLowerCase();
      const usernameDisplay = String(args[1] ?? '');

      let idx = 2;
      const normalized_lookalike = hasLookalikeCol ? String(args[idx++] ?? '') : username_lower;
      const uid = String(args[idx++] ?? '');
      const account_type = hasAccountTypeCol ? String(args[idx++] ?? 'guest') : 'registered';
      const email = hasEmailCol ? String(args[idx++] ?? '').trim().toLowerCase() : '';
      const created_at = Number(args[idx++] ?? Date.now());
      const updated_at = Number(args[idx++] ?? created_at);

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
        ...(existingByUid || {}),
        ...(existingByLower || {}),
        username_lower,
        username: usernameDisplay,
        username_display: usernameDisplay,
        normalized_lookalike,
        uid,
        account_type,
        email: email || existingByLower?.email || existingByUid?.email || '',
        profile_layout: existingByUid?.profile_layout || existingByLower?.profile_layout || 'game-card',
        created_at: existingByUid?.created_at || existingByLower?.created_at || created_at,
        updated_at,
      });
      return 1;
    }

    if (upper.includes('INTO USERNAME_HISTORY')) {
      const username_lower = String(args[0] ?? '').toLowerCase();
      const username_display = String(args[1] ?? username_lower);
      const uid = String(args[2] ?? '');
      const changed_at = Number(args[3] ?? Date.now());
      const expires_at = Number(args[4] ?? changed_at + 14 * 86400 * 1000);
      if (!username_lower || !uid) return 0;
      this.tables.username_history.set(username_lower, {
        username_lower,
        username_display,
        uid,
        changed_at,
        expires_at,
      });
      return 1;
    }

    if (upper.startsWith('DELETE FROM USERNAME_HISTORY')) {
      const uLower = String(args[0] ?? '').toLowerCase();
      if (uLower && this.tables.username_history.has(uLower)) {
        this.tables.username_history.delete(uLower);
        return 1;
      }
      return 0;
    }

    if (upper.startsWith('UPDATE USER_USERNAMES')) {
      if (upper.includes('SET PROFILE_LAYOUT =') && !upper.includes('SET DISPLAY_NAME =')) {
        const profile_layout = String(args[0] ?? 'game-card').trim() || 'game-card';
        const updatedAt = Number(args[1] ?? Date.now());
        const uid = String(args[2] ?? '');
        let changes = 0;
        for (const r of this.tables.user_usernames.values()) {
          if (r.uid === uid) {
            r.profile_layout = profile_layout;
            r.updated_at = updatedAt;
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('SET DISPLAY_NAME =')) {
        const display_name = String(args[0] ?? '').trim();
        const avatar = String(args[1] ?? '').trim();
        const frame = args[2] != null && String(args[2]).trim() ? String(args[2]).trim() : null;
        const role = String(args[3] ?? '').trim();
        const custom_role = args[4] != null && String(args[4]).trim() ? String(args[4]).trim() : null;
        const bio = String(args[5] ?? '');
        const status = String(args[6] ?? '');
        const accent = String(args[7] ?? '');
        const hasProfileLayoutCol = upper.includes('PROFILE_LAYOUT =');
        const profile_layout = hasProfileLayoutCol
          ? String(args[8] ?? 'game-card').trim() || 'game-card'
          : undefined;
        const updatedAt = Number(args[hasProfileLayoutCol ? 9 : 8] ?? Date.now());
        const uid = String(args[hasProfileLayoutCol ? 10 : 9] ?? '');
        let changes = 0;
        for (const r of this.tables.user_usernames.values()) {
          if (r.uid === uid) {
            if (display_name) r.display_name = display_name;
            if (args[1] !== undefined) r.avatar = avatar;
            if (frame !== undefined) r.frame = frame;
            if (role) r.role = role;
            if (custom_role !== undefined) r.custom_role = custom_role;
            if (bio !== undefined) r.bio = bio;
            if (status !== undefined) r.status = status;
            if (accent !== undefined) r.accent = accent;
            if (profile_layout !== undefined) r.profile_layout = profile_layout;
            r.updated_at = updatedAt;
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('SET UID =') && upper.includes('ACCOUNT_TYPE =') && upper.includes('EMAIL =')) {
        const newUid = String(args[0]);
        const accType = String(args[1]);
        const email = String(args[2] ?? '').trim().toLowerCase();
        const updatedAt = Number(args[3] ?? Date.now());
        const uLower = String(args[4] ?? '').toLowerCase();
        const row = this.tables.user_usernames.get(uLower);
        if (!row) return 0;
        row.uid = newUid;
        row.account_type = accType;
        if (email) row.email = email;
        row.updated_at = updatedAt;
        return 1;
      }
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
      if (upper.includes('SET EMAIL =') && upper.includes('WHERE UID =')) {
        const email = String(args[0] ?? '').trim().toLowerCase();
        const updatedAt = Number(args[1] ?? Date.now());
        const uid = String(args[2] ?? '');
        let changes = 0;
        for (const r of this.tables.user_usernames.values()) {
          if (r.uid === uid) {
            r.email = email;
            r.updated_at = updatedAt;
            changes++;
          }
        }
        return changes;
      }
    }

    if (upper.startsWith('DELETE FROM USER_USERNAMES')) {
      if (upper.includes('WHERE UID =') && upper.includes('ACCOUNT_TYPE =')) {
        const uid = String(args[0] ?? '');
        const accType = args.length > 1 ? String(args[1] ?? 'guest') : 'guest';
        let changes = 0;
        for (const [key, r] of this.tables.user_usernames.entries()) {
          if (r.uid === uid && r.account_type === accType) {
            this.tables.user_usernames.delete(key);
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        let changes = 0;
        for (const [key, r] of this.tables.user_usernames.entries()) {
          if (r.uid === uid) {
            this.tables.user_usernames.delete(key);
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('WHERE USERNAME_LOWER =')) {
        const uLower = String(args[0] ?? '').toLowerCase();
        const uidFilter = args.length > 1 ? String(args[1] ?? '') : '';
        const existing = this.tables.user_usernames.get(uLower);
        if (!existing) return 0;
        if (uidFilter && existing.uid !== uidFilter) return 0;
        this.tables.user_usernames.delete(uLower);
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
        status: 'active',
        abandoned_at: null,
        purge_after: null,
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
      if (upper.includes('SET STATUS =') && upper.includes('ABANDONED_AT =')) {
        const status = String(args[0] ?? 'abandoned');
        const abandonedAt = Number(args[1] ?? Date.now());
        const purgeAfter = Number(args[2] ?? abandonedAt + 7 * 86400 * 1000);
        const newUsernameLower = String(args[3] ?? '');
        const lastActive = Number(args[4] ?? abandonedAt);
        const uid = String(args[5] ?? '');
        const row = this.tables.guest_accounts.get(uid);
        if (!row) return 0;
        row.status = status;
        row.abandoned_at = abandonedAt;
        row.purge_after = purgeAfter;
        if (newUsernameLower) {
          row.username_lower = newUsernameLower;
        }
        row.last_active_at = lastActive;
        return 1;
      }
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
        row.status = 'upgraded';
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

    if (upper.startsWith('DELETE FROM GUEST_ACCOUNTS')) {
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        return this.tables.guest_accounts.delete(uid) ? 1 : 0;
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

    if (upper.startsWith('DELETE FROM GUEST_SESSIONS')) {
      if (upper.includes('WHERE UID =')) {
        const uid = String(args[0] ?? '');
        let changes = 0;
        for (const [sid, r] of this.tables.guest_sessions.entries()) {
          if (r.uid === uid) {
            this.tables.guest_sessions.delete(sid);
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

    // 10. login_rate_limits
    if (upper.includes('INTO LOGIN_RATE_LIMITS')) {
      const rate_key = String(args[0] ?? '');
      const attempts = Number(args[1] ?? 1);
      const window_start_ms = Number(args[2] ?? Date.now());
      const blocked_until_ms = args[3] != null ? Number(args[3]) : null;
      const updated_at_ms = Number(args[4] ?? window_start_ms);
      this.tables.login_rate_limits.set(rate_key, {
        rate_key,
        attempts,
        window_start_ms,
        blocked_until_ms,
        updated_at_ms,
      });
      return 1;
    }

    if (upper.startsWith('DELETE FROM LOGIN_RATE_LIMITS')) {
      const key = String(args[0] ?? '');
      return this.tables.login_rate_limits.delete(key) ? 1 : 0;
    }

    // 11. user_2fa
    if (upper.includes('INTO USER_2FA') && !upper.includes('INTO USER_2FA_BACKUP_CODES')) {
      const user_id = String(args[0]);
      const email = String(args[1] ?? '');
      const totp_enabled = Number(args[2] ?? 0);
      const email_2fa_enabled = Number(args[3] ?? 0);
      const encrypted_secret = args[4] != null ? String(args[4]) : null;
      const pending_encrypted_secret = args[5] != null ? String(args[5]) : null;
      const last_used_step = Number(args[6] ?? 0);
      const recovery_requested_at = args[7] != null ? Number(args[7]) : null;
      const recovery_disable_at = args[8] != null ? Number(args[8]) : null;
      const updated_at = Number(args[9] ?? Date.now());
      const created_at = Number(args[10] ?? updated_at);
      this.tables.user_2fa.set(user_id, {
        user_id,
        email,
        totp_enabled,
        email_2fa_enabled,
        encrypted_secret,
        pending_encrypted_secret,
        last_used_step,
        recovery_requested_at,
        recovery_disable_at,
        updated_at,
        created_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE USER_2FA')) {
      if (
        upper.includes('SET TOTP_ENABLED = 0') &&
        upper.includes('EMAIL_2FA_ENABLED = 0')
      ) {
        const updated_at = Number(args[0] ?? Date.now());
        const user_id = String(args[1] ?? '');
        const row = this.tables.user_2fa.get(user_id);
        if (!row) return 0;
        row.totp_enabled = 0;
        row.email_2fa_enabled = 0;
        row.encrypted_secret = null;
        row.pending_encrypted_secret = null;
        row.recovery_requested_at = null;
        row.recovery_disable_at = null;
        row.updated_at = updated_at;
        return 1;
      }
      if (upper.includes('SET LAST_USED_STEP =')) {
        const last_used_step = Number(args[0] ?? 0);
        const updated_at = Number(args[1] ?? Date.now());
        const user_id = String(args[2] ?? '');
        const row = this.tables.user_2fa.get(user_id);
        if (!row) return 0;
        row.last_used_step = last_used_step;
        row.updated_at = updated_at;
        return 1;
      }
      if (upper.includes('SET RECOVERY_REQUESTED_AT =') && upper.includes('RECOVERY_DISABLE_AT =')) {
        const isLiteralNull =
          upper.includes('SET RECOVERY_REQUESTED_AT = NULL') &&
          upper.includes('RECOVERY_DISABLE_AT = NULL') &&
          args.length === 2;
        const reqAt = isLiteralNull ? null : args[0] != null ? Number(args[0]) : null;
        const disAt = isLiteralNull ? null : args[1] != null ? Number(args[1]) : null;
        const updated_at = Number(
          (isLiteralNull ? args[0] : args.length >= 4 ? args[2] : args[0]) ?? Date.now()
        );
        const user_id = String(args[args.length - 1] ?? '');
        const row = this.tables.user_2fa.get(user_id);
        if (!row) return 0;
        row.recovery_requested_at = reqAt;
        row.recovery_disable_at = disAt;
        row.updated_at = updated_at;
        return 1;
      }
      if (upper.includes('SET EMAIL_2FA_ENABLED = 1')) {
        const updated_at = Number(args[0] ?? Date.now());
        const user_id = String(args[1] ?? '');
        const row = this.tables.user_2fa.get(user_id);
        if (!row) return 0;
        row.email_2fa_enabled = 1;
        row.recovery_requested_at = null;
        row.recovery_disable_at = null;
        row.updated_at = updated_at;
        return 1;
      }
    }

    if (upper.startsWith('DELETE FROM USER_2FA') && !upper.includes('USER_2FA_BACKUP_CODES')) {
      const uid = String(args[0] ?? '');
      return this.tables.user_2fa.delete(uid) ? 1 : 0;
    }

    // 12. user_2fa_backup_codes
    if (upper.includes('INTO USER_2FA_BACKUP_CODES')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const code_hash = String(args[2]);
      const used = Number(args[3] ?? 0);
      const used_at = args[4] != null ? Number(args[4]) : null;
      const created_at = Number(args[5] ?? Date.now());
      this.tables.user_2fa_backup_codes.set(id, {
        id,
        user_id,
        code_hash,
        used,
        used_at,
        created_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE USER_2FA_BACKUP_CODES')) {
      if (upper.includes('SET USED = 1')) {
        const used_at = Number(args[0] ?? Date.now());
        const id = String(args[1] ?? '');
        const row = this.tables.user_2fa_backup_codes.get(id);
        if (!row) return 0;
        row.used = 1;
        row.used_at = used_at;
        return 1;
      }
    }

    if (upper.startsWith('DELETE FROM USER_2FA_BACKUP_CODES')) {
      const uid = String(args[0] ?? '');
      let changes = 0;
      for (const [id, r] of this.tables.user_2fa_backup_codes.entries()) {
        if (r.user_id === uid) {
          this.tables.user_2fa_backup_codes.delete(id);
          changes++;
        }
      }
      return changes;
    }

    // 13. trusted_devices
    if (upper.includes('INTO TRUSTED_DEVICES')) {
      const id = String(args[0]);
      const user_id = String(args[1]);
      const token_hash = String(args[2]);
      const user_agent = String(args[3] ?? '');
      const ip_hash = String(args[4] ?? '');
      const created_at = Number(args[5] ?? Date.now());
      const last_used_at = Number(args[6] ?? created_at);
      const expires_at = Number(args[7] ?? created_at + 30 * 86400 * 1000);
      const revoked = Number(args[8] ?? 0);
      this.tables.trusted_devices.set(id, {
        id,
        user_id,
        token_hash,
        user_agent,
        ip_hash,
        created_at,
        last_used_at,
        expires_at,
        revoked,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE TRUSTED_DEVICES')) {
      if (upper.includes('SET REVOKED = 1') && upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        let changes = 0;
        for (const r of this.tables.trusted_devices.values()) {
          if (r.user_id === uid && r.revoked === 0) {
            r.revoked = 1;
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('SET LAST_USED_AT =') && upper.includes('WHERE ID =')) {
        const lastUsed = Number(args[0] ?? Date.now());
        const id = String(args[1] ?? '');
        const row = this.tables.trusted_devices.get(id);
        if (!row) return 0;
        row.last_used_at = lastUsed;
        return 1;
      }
    }

    if (upper.startsWith('DELETE FROM TRUSTED_DEVICES')) {
      const uid = String(args[0] ?? '');
      let changes = 0;
      for (const [id, r] of this.tables.trusted_devices.entries()) {
        if (r.user_id === uid) {
          this.tables.trusted_devices.delete(id);
          changes++;
        }
      }
      return changes;
    }

    // 14. pending_2fa_challenges
    if (upper.includes('INTO PENDING_2FA_CHALLENGES')) {
      const challenge_id = String(args[0]);
      const user_id = String(args[1]);
      const auth_time = Number(args[2] ?? 0);
      const expires_at = Number(args[3] ?? Date.now() + 5 * 60 * 1000);
      const attempt_count = Number(args[4] ?? 0);
      const verified = Number(args[5] ?? 0);
      const created_at = Number(args[6] ?? Date.now());
      this.tables.pending_2fa_challenges.set(challenge_id, {
        challenge_id,
        user_id,
        auth_time,
        expires_at,
        attempt_count,
        verified,
        created_at,
      });
      return 1;
    }

    if (upper.startsWith('UPDATE PENDING_2FA_CHALLENGES')) {
      if (upper.includes('SET VERIFIED = 1') && upper.includes('WHERE USER_ID =')) {
        const uid = String(args[0] ?? '');
        let changes = 0;
        for (const r of this.tables.pending_2fa_challenges.values()) {
          if (r.user_id === uid && r.verified === 0) {
            r.verified = 1;
            changes++;
          }
        }
        return changes;
      }
      if (upper.includes('SET ATTEMPT_COUNT =') && upper.includes('WHERE CHALLENGE_ID =')) {
        const att = Number(args[0] ?? 0);
        const cid = String(args[1] ?? '');
        const row = this.tables.pending_2fa_challenges.get(cid);
        if (!row) return 0;
        row.attempt_count = att;
        return 1;
      }
    }

    if (upper.startsWith('DELETE FROM PENDING_2FA_CHALLENGES')) {
      const uid = String(args[0] ?? '');
      let changes = 0;
      for (const [cid, r] of this.tables.pending_2fa_challenges.entries()) {
        if (r.user_id === uid) {
          this.tables.pending_2fa_challenges.delete(cid);
          changes++;
        }
      }
      return changes;
    }

    // 15. security_audit_logs
    if (upper.includes('INTO SECURITY_AUDIT_LOGS')) {
      const id = String(args[0]);
      const user_id = String(args[1] ?? '');
      const actor_id = String(args[2] ?? user_id);
      const event_type = String(args[3] ?? '');
      const ip_hash = String(args[4] ?? '');
      const details_json = String(args[5] ?? '{}');
      const created_at = Number(args[6] ?? Date.now());
      this.tables.security_audit_logs.set(id, {
        id,
        user_id,
        actor_id,
        event_type,
        ip_hash,
        details_json,
        created_at,
      });
      return 1;
    }

    // 16. legal_consent_records
    if (upper.includes('INTO LEGAL_CONSENT_RECORDS')) {
      const id = String(args[0]);
      const user_id = String(args[1] ?? '');
      const account_type = String(args[2] ?? 'registered');
      const document_version = String(args[3] ?? '');
      const action_context = String(args[4] ?? 'signup');
      const ip_hash = String(args[5] ?? '');
      const user_agent = String(args[6] ?? '');
      const accepted_at = Number(args[7] ?? Date.now());
      this.tables.legal_consent_records.set(id, {
        id,
        user_id,
        account_type,
        document_version,
        action_context,
        ip_hash,
        user_agent,
        accepted_at,
      });
      return 1;
    }

    // 17. user_koban_style
    if (upper.includes('INTO USER_KOBAN_STYLE')) {
      const user_id = String(args[0] ?? '');
      if (!user_id) return 0;
      const design = String(args[1] ?? 'chip');
      const main_color = String(args[2] ?? '#ffc93f');
      const accent_color = String(args[3] ?? '#e11d2e');
      const glow_color = String(args[4] ?? '#ff8a1f');
      const glow = Number(args[5] ?? 80);
      const motion = String(args[6] ?? 'subtle');
      const sparkle = Number(args[7] ?? 1);
      const updated_at = Number(args[8] ?? Date.now());
      this.tables.user_koban_style.set(user_id, {
        user_id,
        design,
        main_color,
        accent_color,
        glow_color,
        glow,
        motion,
        sparkle,
        updated_at,
      });
      return 1;
    }

    if (upper.startsWith('DELETE FROM USER_KOBAN_STYLE')) {
      const user_id = String(args[0] ?? '');
      return this.tables.user_koban_style.delete(user_id) ? 1 : 0;
    }

    // 18. user_pro_badge
    if (upper.includes('INTO USER_PRO_BADGE')) {
      const user_id = String(args[0] ?? '');
      if (!user_id) return 0;
      const design = String(args[1] ?? 'ember');
      const visible = Number(args[2] ?? 1) ? 1 : 0;
      const updated_at = Number(args[3] ?? Date.now());
      this.tables.user_pro_badge.set(user_id, {
        user_id,
        design,
        visible,
        updated_at,
      });
      return 1;
    }

    if (upper.startsWith('DELETE FROM USER_PRO_BADGE')) {
      const user_id = String(args[0] ?? '');
      return this.tables.user_pro_badge.delete(user_id) ? 1 : 0;
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
