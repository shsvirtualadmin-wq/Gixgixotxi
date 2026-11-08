/**
 * Boardly — Server-Side 6-Digit Email Verification & Login 2FA Worker API (`/api/auth/*`)
 *
 * Security Rules:
 * - Codes are generated strictly with `crypto.getRandomValues` (000000–999999, preserving leading zeros).
 * - Never stores plain-text codes or link tokens. Stores only HMAC-SHA256 hashes in D1
 *   (`email_verification_codes`) with `user_id`, `purpose` ('login' | 'signup'),
 *   `expires_at` (10 minutes), `attempt_count`, `created_at`, and `used` flag.
 * - Single-use: once verified, or once a new code is sent, all older codes for that user
 *   and purpose are immediately invalidated (`used = 1`).
 * - Max 5 wrong attempts per code: on the 5th wrong attempt, the code is permanently locked (`used = 1`).
 * - 60-second resend cooldown + max 5 code emails per hour per email address and per IP.
 * - Constant-time hash comparison.
 * - Generic error messages ("Invalid or expired code"). Never logs or returns the code in any API response.
 */

import {
  ABANDONED_GUEST_GRACE_PERIOD_MS,
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FirestoreRestAdapter,
  INACTIVE_GUEST_TTL_MS,
  authenticateD1GuestSession,
  computeGuestTokenSha256Hex,
  extractGuestSessionTokenFromRequest,
  getSharedLocalD1Database,
  isD1UserSessionVerified,
  parseServiceAccountFromEnv,
  purgeExpiredGuestAccounts,
  resolveCurrentUser,
  resolveTargetFirestoreDatabaseId,
  resolveTargetFirestoreProjectId,
  verifyFirebaseIdToken,
  type RewardsD1Database,
  type RewardsEnv,
  type ServiceAccountCredentials,
  type VerifiedFirebaseToken,
} from '../../_utils/firestoreRestAdmin';
import {
  areUsernamesTooSimilar,
  validateUsernameFormat,
} from '../../../src/utils/usernameValidation';
import { TARGET_API_KEY } from '../../../src/lib/firebaseConfig';

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const HOURLY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_SENDS_PER_HOUR_PER_EMAIL = 5;
export const MAX_SENDS_PER_HOUR_PER_IP = 5;

export const GUEST_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const GUEST_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 2,592,000 seconds
export const MAX_GUEST_CREATIONS_PER_HOUR_PER_IP = 5;
export const MAX_GUEST_CREATIONS_PER_DAY_PER_IP = 15;
export const MAX_GUEST_CREATIONS_PER_HOUR_PER_DEVICE = 3;
export const MAX_GUEST_CREATIONS_PER_DAY_PER_DEVICE = 8;

export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_LOGIN_ATTEMPTS_PER_WINDOW = 10;
export const GENERIC_LOGIN_ERROR = 'Invalid username/email or password';

export interface AuthWorkerEnv extends RewardsEnv {
  OTP_HMAC_SECRET?: string;
  EMAIL_VERIFICATION_SECRET?: string;
  INTERNAL_EMAIL_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  APP_URL?: string;
  FIREBASE_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
}

export interface EmailDispatchPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  purpose: 'login' | 'signup';
  userId: string;
}

export type EmailSenderFn = (
  payload: EmailDispatchPayload,
  env?: AuthWorkerEnv
) => Promise<{ ok: boolean; id?: string; error?: string }>;

// ─── Cryptographic Helpers (WebCrypto CSPRNG + HMAC-SHA256 + Constant-Time) ───

/**
 * Generates an unbiased 6-digit numeric code ('000000' to '999999') using WebCrypto CSPRNG.
 * Never uses Math.random. Preserves leading zeros.
 */
export function generateSixDigitCode(): string {
  const maxRange = 1_000_000;
  const maxUnbiased = Math.floor(0x100000000 / maxRange) * maxRange; // 4,294,000,000
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    const val = buf[0];
    if (val < maxUnbiased) {
      return (val % maxRange).toString().padStart(6, '0');
    }
  }
}

/**
 * Generates a high-entropy 32-byte URL-safe token for the fallback signup verification link.
 */
export function generateFallbackLinkToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function getHmacSecret(env?: AuthWorkerEnv): string {
  const configured = (
    env?.OTP_HMAC_SECRET ||
    env?.EMAIL_VERIFICATION_SECRET ||
    env?.INTERNAL_EMAIL_SECRET ||
    (typeof process !== 'undefined'
      ? process.env?.OTP_HMAC_SECRET ||
        process.env?.EMAIL_VERIFICATION_SECRET ||
        process.env?.INTERNAL_EMAIL_SECRET
      : '') ||
    ''
  ).trim();
  return configured || 'boardly-default-otp-hmac-secret-v1-do-not-expose';
}

/**
 * Computes HMAC-SHA256 hex digest using WebCrypto subtle crypto.
 */
export async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function hashVerificationCode(params: {
  secret: string;
  userId: string;
  purpose: 'login' | 'signup';
  code: string;
}): Promise<string> {
  const { secret, userId, purpose, code } = params;
  return computeHmacSha256Hex(secret, `otp:v1:${userId}:${purpose}:${code}`);
}

export async function hashFallbackLinkToken(params: {
  secret: string;
  token: string;
}): Promise<string> {
  return computeHmacSha256Hex(params.secret, `link:v1:${params.token}`);
}

export async function hashIdentifier(secret: string, prefix: string, value: string): Promise<string> {
  return computeHmacSha256Hex(secret, `${prefix}:${value.trim().toLowerCase()}`);
}

/**
 * Constant-time comparison of two strings (e.g. hex HMAC digests).
 * Always inspects every byte without short-circuiting.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < aBytes.length ? aBytes[i] : 0;
    const byteB = i < bBytes.length ? bBytes[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

/**
 * Masks an email address for safe UI display (e.g. "h***@gmail.com").
 */
export function maskEmailForDisplay(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '***@***';
  const local = clean.slice(0, atIdx);
  const domain = clean.slice(atIdx + 1);
  const firstChar = local[0] || '*';
  return `${firstChar}***@${domain}`;
}

export function extractClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    '127.0.0.1'
  );
}

// ─── D1 Schema Initialization ─────────────────────────────────────────────────

export async function ensureEmailVerificationD1Schema(db: RewardsD1Database): Promise<void> {
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS email_verification_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email_hash TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK (purpose IN ('login', 'signup')),
        code_hash TEXT NOT NULL,
        link_token_hash TEXT DEFAULT NULL,
        auth_time INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        used INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        ip_hash TEXT NOT NULL DEFAULT ''
      )`),
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_evc_user_purpose_created ON email_verification_codes (user_id, purpose, created_at DESC)`
      ),
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_evc_link_token_hash ON email_verification_codes (link_token_hash)`
      ),
      db.prepare(`CREATE TABLE IF NOT EXISTS email_verification_sessions (
        user_id TEXT PRIMARY KEY,
        email_hash TEXT NOT NULL DEFAULT '',
        email_verified INTEGER NOT NULL DEFAULT 0,
        verified_auth_time INTEGER NOT NULL DEFAULT 0,
        verified_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS email_verification_send_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email_hash TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK (purpose IN ('login', 'signup')),
        created_at INTEGER NOT NULL
      )`),
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_evsl_email_created ON email_verification_send_logs (email_hash, created_at DESC)`
      ),
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_evsl_ip_created ON email_verification_send_logs (ip_hash, created_at DESC)`
      ),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_usernames (
        username_lower TEXT PRIMARY KEY,
        username_display TEXT NOT NULL,
        uid TEXT NOT NULL UNIQUE,
        account_type TEXT NOT NULL DEFAULT 'registered',
        email TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_lower ON user_usernames(username_lower)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_usernames_uid ON user_usernames(uid)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS guest_accounts (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        username_lower TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        short_id TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'guest',
        is_guest INTEGER NOT NULL DEFAULT 1,
        email TEXT DEFAULT '',
        plan TEXT NOT NULL DEFAULT 'free',
        role TEXT NOT NULL DEFAULT 'student',
        upgraded_to_uid TEXT DEFAULT NULL,
        upgraded_at INTEGER DEFAULT NULL,
        target_university TEXT DEFAULT 'General Prep',
        tests_completed INTEGER NOT NULL DEFAULT 0,
        total_questions_solved INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        stats_json TEXT NOT NULL DEFAULT '{}',
        attempts_json TEXT NOT NULL DEFAULT '[]',
        ip_hash TEXT NOT NULL DEFAULT '',
        device_id_hash TEXT NOT NULL DEFAULT '',
        is_suspended INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        abandoned_at INTEGER DEFAULT NULL,
        purge_after INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_accounts_username_lower ON guest_accounts(username_lower)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_guest_accounts_created_at ON guest_accounts(created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_guest_accounts_last_active ON guest_accounts(last_active_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS guest_sessions (
        session_id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        uid TEXT NOT NULL,
        ip_hash TEXT NOT NULL DEFAULT '',
        device_id_hash TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_sessions_token_hash ON guest_sessions(token_hash)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_guest_sessions_uid ON guest_sessions(uid)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS guest_creation_rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier_hash TEXT NOT NULL,
        identifier_type TEXT NOT NULL,
        uid TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_lookup ON guest_creation_rate_limits(identifier_hash, identifier_type, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS login_rate_limits (
        rate_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL,
        locked_until INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_login_rate_limits_updated ON login_rate_limits(updated_at DESC)`),
    ]);
  } catch {
    // Tables already initialized
  }
  // Safe column migrations for existing D1 tables
  const migrations = [
    `ALTER TABLE user_usernames ADD COLUMN email TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE guest_accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`,
    `ALTER TABLE guest_accounts ADD COLUMN abandoned_at INTEGER DEFAULT NULL`,
    `ALTER TABLE guest_accounts ADD COLUMN purge_after INTEGER DEFAULT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_guest_accounts_status_purge ON guest_accounts(status, purge_after)`,
  ];
  for (const sql of migrations) {
    try {
      await db.prepare(sql).run();
    } catch {
      // Column or index already exists
    }
  }
}

// ─── Resend Email Builder & Dispatcher ────────────────────────────────────────

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVerificationEmailContent(params: {
  code: string;
  purpose: 'login' | 'signup';
  studentName: string;
  fallbackVerifyUrl?: string;
}): { subject: string; html: string; text: string } {
  const { code, purpose, studentName, fallbackVerifyUrl } = params;
  const safeName = escapeHtml(studentName || 'Student');
  const isSignup = purpose === 'signup';

  const subject = isSignup
    ? 'Verify your Boardly account — 6-digit verification code'
    : 'Your Boardly login verification code';

  const heading = isSignup ? 'Verify your email address' : 'Confirm your sign-in';
  const intro = isSignup
    ? `Welcome to Boardly, ${safeName}. Enter the 6-digit verification code below to activate your account:`
    : `Hi ${safeName}, enter the 6-digit verification code below to complete signing in to your Boardly account:`;

  const fallbackHtml =
    isSignup && fallbackVerifyUrl
      ? `
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #222226; text-align: center;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #9a9aa3;">
            Having trouble entering the code? You can also verify your email by clicking the button below:
          </p>
          <a href="${escapeHtml(fallbackVerifyUrl)}"
             style="display: inline-block; padding: 12px 24px; border-radius: 999px; background-color: #e11d2e; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none;">
            Verify Email Address
          </a>
        </div>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #060607; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #111114; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px 24px;">
    <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.04em; color: #f4f4f5; margin-bottom: 20px;">
      BOARDLY<span style="color: #e11d2e;">.</span>
    </div>
    <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #f4f4f5;">
      ${heading}
    </h1>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #9a9aa3;">
      ${intro}
    </p>
    <div style="background-color: #18181c; border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #f4f4f5;">
        ${escapeHtml(code)}
      </div>
    </div>
    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9a9aa3;">
      This code expires in <strong>10 minutes</strong> and can only be used once. Never share this code with anyone.
    </p>
    ${fallbackHtml}
  </div>
</body>
</html>`;

  const text = `${heading}\n\n${
    isSignup
      ? `Welcome to Boardly, ${studentName || 'Student'}.`
      : `Hi ${studentName || 'Student'},`
  }\n\nYour 6-digit verification code is: ${code}\n\nThis code expires in 10 minutes and can only be used once.${
    isSignup && fallbackVerifyUrl
      ? `\n\nOr verify your email using this link:\n${fallbackVerifyUrl}`
      : ''
  }`;

  return { subject, html, text };
}

async function defaultResendEmailSender(
  payload: EmailDispatchPayload,
  env?: AuthWorkerEnv
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = (
    env?.RESEND_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : '') ||
    ''
  ).trim();

  if (!apiKey) {
    return {
      ok: false,
      error: 'Email service is not configured on this server (missing RESEND_API_KEY).',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[Auth OTP Resend Error] HTTP ${res.status}:`, errBody.slice(0, 200));
      return {
        ok: false,
        error: 'Could not send verification email right now. Please try again shortly.',
      };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data?.id || 'sent' };
  } catch (err: any) {
    console.error('[Auth OTP Resend Network Error]:', err?.message || err);
    return {
      ok: false,
      error: 'Network error while sending verification email. Please try again.',
    };
  }
}

// ─── Firebase Auth & Firestore Email Verified Synchronization ─────────────────

async function syncEmailVerifiedToFirebaseAndFirestore(params: {
  uid: string;
  env?: AuthWorkerEnv;
  storeOverride?: { setDoc: (path: string, data: Record<string, unknown>, merge?: boolean) => Promise<void> } | null;
}): Promise<void> {
  const { uid, env, storeOverride } = params;
  if (storeOverride) {
    try {
      await storeOverride.setDoc(`users/${uid}`, { emailVerified: true }, true);
    } catch {
      // Non-fatal
    }
    return;
  }
  const sa: ServiceAccountCredentials | null = parseServiceAccountFromEnv(env);
  if (!sa) return;

  const projectId = resolveTargetFirestoreProjectId(
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
  );
  const databaseId = resolveTargetFirestoreDatabaseId(
    env?.FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID
  );

  // 1. Update Firestore `users/{uid}.emailVerified = true`
  try {
    const store = new FirestoreRestAdapter(sa, projectId, databaseId);
    await store.setDoc(
      `users/${uid}`,
      {
        emailVerified: true,
      },
      true
    );
  } catch {
    // Non-fatal if Firestore doc does not exist yet
  }
}

// ─── Guest & Username Helpers ─────────────────────────────────────────────────

function buildGuestSessionCookieHeader(rawToken: string, isHttps: boolean, clear = false): string {
  const maxAge = clear ? 0 : GUEST_COOKIE_MAX_AGE_SEC;
  const val = clear ? '' : encodeURIComponent(rawToken);
  const securePart = isHttps ? '; Secure' : '';
  return `boardly_guest_session=${val}; Path=/; Max-Age=${maxAge}; HttpOnly${securePart}; SameSite=Lax`;
}

async function checkD1UsernameAvailability(params: {
  db: RewardsD1Database;
  rawUsername: string;
  excludeUid?: string | null;
}): Promise<{
  available: boolean;
  clean: string;
  normalized: string;
  reason?: string;
  code?: string;
}> {
  const { db, rawUsername, excludeUid } = params;
  const formatCheck = validateUsernameFormat(rawUsername);
  if (!formatCheck.valid) {
    return {
      available: false,
      clean: formatCheck.clean,
      normalized: formatCheck.normalized,
      reason: formatCheck.reason || 'Invalid username format.',
      code: 'INVALID_USERNAME_FORMAT',
    };
  }

  const normalized = formatCheck.normalized; // lowercase
  const clean = formatCheck.clean;

  // 1. Exact case-insensitive lookup in `user_usernames`
  const existingRow = await db
    .prepare(
      'SELECT username_lower, username_display, uid, account_type FROM user_usernames WHERE username_lower = ?1 LIMIT 1'
    )
    .bind(normalized)
    .first<{
      username_lower: string;
      username_display: string;
      uid: string;
      account_type: string;
    }>();

  if (existingRow && (!excludeUid || existingRow.uid !== excludeUid)) {
    return {
      available: false,
      clean,
      normalized,
      reason: 'This username is already taken.',
      code: 'USERNAME_TAKEN',
    };
  }

  // 2. Check `guest_accounts` directly as well
  const existingGuest = await db
    .prepare('SELECT uid, username_lower FROM guest_accounts WHERE username_lower = ?1 LIMIT 1')
    .bind(normalized)
    .first<{ uid: string; username_lower: string }>();

  if (existingGuest && (!excludeUid || existingGuest.uid !== excludeUid)) {
    return {
      available: false,
      clean,
      normalized,
      reason: 'This username is already taken.',
      code: 'USERNAME_TAKEN',
    };
  }

  // 3. Check lookalike / confusable similarity against existing usernames in `user_usernames`
  try {
    const allRowsRes = await db
      .prepare('SELECT username_lower, uid FROM user_usernames')
      .all<{ username_lower: string; uid: string }>();
    for (const row of allRowsRes.results || []) {
      if (excludeUid && row.uid === excludeUid) continue;
      if (areUsernamesTooSimilar(normalized, row.username_lower)) {
        return {
          available: false,
          clean,
          normalized,
          reason:
            row.username_lower === normalized
              ? 'This username is already taken.'
              : 'This username is too similar to an existing username.',
          code: 'USERNAME_TAKEN_OR_SIMILAR',
        };
      }
    }
  } catch {
    // Non-fatal
  }

  return {
    available: true,
    clean,
    normalized,
  };
}

// ─── Request Handler ──────────────────────────────────────────────────────────

export interface HandleAuthApiRequestOptions {
  request: Request;
  env?: AuthWorkerEnv;
  dbOverride?: RewardsD1Database;
  storeOverride?: { setDoc: (path: string, data: Record<string, unknown>, merge?: boolean) => Promise<void> } | null;
  tokenVerifierOverride?: (
    authHeader: string | null | undefined
  ) => Promise<VerifiedFirebaseToken | null>;
  emailSenderOverride?: EmailSenderFn;
  nowMsOverride?: number;
}

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Session, X-Device-Id',
      ...(extraHeaders || {}),
    },
  });
}

export async function handleAuthApiRequest(
  opts: HandleAuthApiRequestOptions
): Promise<Response> {
  const { request, env } = opts;
  const nowMs = opts.nowMsOverride ?? Date.now();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Session, X-Device-Id',
      },
    });
  }

  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:' || request.headers.get('X-Forwarded-Proto') === 'https';
  const subPath = url.pathname.replace(/^\/api\/auth\/?/, '').replace(/\/+$/, '');

  const db: RewardsD1Database = opts.dbOverride || env?.DB || getSharedLocalD1Database();
  await ensureEmailVerificationD1Schema(db);

  const secret = getHmacSecret(env);

  // ─── A. GET / POST /api/auth/username-check (Live & Server-Side Availability Check) ───
  if (subPath === 'username-check' && (request.method === 'GET' || request.method === 'POST')) {
    let rawUsername = url.searchParams.get('username') || url.searchParams.get('u') || '';
    let excludeUid = url.searchParams.get('excludeUid') || '';
    if (request.method === 'POST') {
      try {
        const body = (await request.json()) as { username?: string; excludeUid?: string };
        if (body.username !== undefined) rawUsername = String(body.username);
        if (body.excludeUid !== undefined) excludeUid = String(body.excludeUid);
      } catch {
        // Ignore JSON parse error
      }
    }

    const result = await checkD1UsernameAvailability({
      db,
      rawUsername,
      excludeUid: excludeUid || null,
    });

    return jsonResponse({
      ok: true,
      available: result.available,
      username: result.clean,
      normalized: result.normalized,
      reason: result.reason || null,
      code: result.code || null,
    });
  }

  // ─── B. POST /api/auth/guest (Create Guest Account & Session Atomically) ───
  if ((subPath === 'guest' || subPath === 'guest/create') && request.method === 'POST') {
    let body: { username?: string; displayName?: string; deviceId?: string; targetUniversity?: string } = {};
    try {
      body = (await request.json()) as {
        username?: string;
        displayName?: string;
        deviceId?: string;
        targetUniversity?: string;
      };
    } catch {
      return jsonResponse(
        { ok: false, error: 'Invalid request body.', code: 'INVALID_JSON' },
        400
      );
    }

    const rawUsername = String(body.username || '').trim();
    const availability = await checkD1UsernameAvailability({ db, rawUsername });
    if (!availability.available) {
      const status =
        availability.code === 'USERNAME_TAKEN' || availability.code === 'USERNAME_TAKEN_OR_SIMILAR'
          ? 409
          : 400;
      return jsonResponse(
        {
          ok: false,
          available: false,
          error: availability.reason || 'Username is not available.',
          code: availability.code || 'USERNAME_UNAVAILABLE',
        },
        status
      );
    }

    // Abuse protection: rate limit guest creation per IP and per device
    const clientIp = extractClientIp(request);
    const rawDeviceId =
      String(body.deviceId || request.headers.get('X-Device-Id') || '').trim() || clientIp;
    const ipHash = await hashIdentifier(secret, 'guest_ip', clientIp);
    const deviceHash = await hashIdentifier(secret, 'guest_device', rawDeviceId);

    const oneHourAgo = nowMs - HOURLY_WINDOW_MS;
    const oneDayAgo = nowMs - 24 * HOURLY_WINDOW_MS;

    const [ipHourRow, ipDayRow, devHourRow, devDayRow] = await Promise.all([
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM guest_creation_rate_limits WHERE identifier_hash = ?1 AND identifier_type = ?2 AND created_at >= ?3'
        )
        .bind(ipHash, 'ip', oneHourAgo)
        .first<{ cnt: number }>(),
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM guest_creation_rate_limits WHERE identifier_hash = ?1 AND identifier_type = ?2 AND created_at >= ?3'
        )
        .bind(ipHash, 'ip', oneDayAgo)
        .first<{ cnt: number }>(),
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM guest_creation_rate_limits WHERE identifier_hash = ?1 AND identifier_type = ?2 AND created_at >= ?3'
        )
        .bind(deviceHash, 'device', oneHourAgo)
        .first<{ cnt: number }>(),
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM guest_creation_rate_limits WHERE identifier_hash = ?1 AND identifier_type = ?2 AND created_at >= ?3'
        )
        .bind(deviceHash, 'device', oneDayAgo)
        .first<{ cnt: number }>(),
    ]);

    if (
      Number(ipHourRow?.cnt || 0) >= MAX_GUEST_CREATIONS_PER_HOUR_PER_IP ||
      Number(ipDayRow?.cnt || 0) >= MAX_GUEST_CREATIONS_PER_DAY_PER_IP ||
      Number(devHourRow?.cnt || 0) >= MAX_GUEST_CREATIONS_PER_HOUR_PER_DEVICE ||
      Number(devDayRow?.cnt || 0) >= MAX_GUEST_CREATIONS_PER_DAY_PER_DEVICE
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            'Too many guest accounts created recently from this device or network. Please sign in with an existing account or try again later.',
          code: 'GUEST_RATE_LIMITED',
        },
        429
      );
    }

    const randomHex = generateFallbackLinkToken();
    const guestUid = `guest_${nowMs}_${randomHex.slice(0, 10)}`;
    const shortId = randomHex.slice(10, 16).toUpperCase();
    const cleanUsername = availability.clean;
    const normalizedUsername = availability.normalized;
    const resolvedDisplayName = String(body.displayName || '').trim() || cleanUsername;
    const targetUniversity = String(body.targetUniversity || 'General Prep').trim() || 'General Prep';

    // Atomic D1 UNIQUE insert into `user_usernames` and `guest_accounts`
    try {
      await db
        .prepare(
          `INSERT INTO user_usernames (username_lower, username_display, uid, account_type, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(normalizedUsername, cleanUsername, guestUid, 'guest', nowMs, nowMs)
        .run();

      await db
        .prepare(
          `INSERT INTO guest_accounts (
             uid, username, username_lower, display_name, short_id,
             account_type, is_guest, email, plan, role,
             target_university, ip_hash, device_id_hash, created_at, last_active_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
        )
        .bind(
          guestUid,
          cleanUsername,
          normalizedUsername,
          resolvedDisplayName,
          shortId,
          'guest',
          1,
          '',
          'free',
          'student',
          targetUniversity,
          ipHash,
          deviceHash,
          nowMs,
          nowMs
        )
        .run();
    } catch (insertErr: any) {
      const msg = String(insertErr?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY') || msg.includes('constraint')) {
        return jsonResponse(
          {
            ok: false,
            available: false,
            error: 'That username was just taken. Please pick another one.',
            code: 'USERNAME_TAKEN',
          },
          409
        );
      }
      throw insertErr;
    }

    // Create secure guest session token
    const rawSessionToken = `${guestUid}.${generateFallbackLinkToken()}`;
    const tokenHash = await computeGuestTokenSha256Hex(rawSessionToken, secret);
    const sessionId = `gsess_${nowMs}_${randomHex.slice(16, 28)}`;
    const expiresAt = nowMs + GUEST_SESSION_TTL_MS;
    const userAgent = (request.headers.get('User-Agent') || '').slice(0, 250);

    await db.batch([
      db
        .prepare(
          `INSERT INTO guest_sessions (
             session_id, token_hash, uid, ip_hash, device_id_hash, user_agent,
             created_at, last_active_at, expires_at, revoked
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        )
        .bind(
          sessionId,
          tokenHash,
          guestUid,
          ipHash,
          deviceHash,
          userAgent,
          nowMs,
          nowMs,
          expiresAt,
          0
        ),
      db
        .prepare(
          `INSERT INTO guest_creation_rate_limits (identifier_hash, identifier_type, uid, created_at)
           VALUES (?1, ?2, ?3, ?4)`
        )
        .bind(ipHash, 'ip', guestUid, nowMs),
      db
        .prepare(
          `INSERT INTO guest_creation_rate_limits (identifier_hash, identifier_type, uid, created_at)
           VALUES (?1, ?2, ?3, ?4)`
        )
        .bind(deviceHash, 'device', guestUid, nowMs),
    ]);

    const setCookie = buildGuestSessionCookieHeader(rawSessionToken, isHttps, false);

    return jsonResponse(
      {
        ok: true,
        guest: {
          uid: guestUid,
          username: cleanUsername,
          displayName: resolvedDisplayName,
          shortId,
          accountType: 'guest',
          isGuest: true,
          email: '',
          plan: 'free',
          role: 'student',
          targetUniversity,
          testsCompleted: 0,
          totalQuestionsSolved: 0,
          streak: 0,
          stats: {},
          attempts: [],
          createdAt: nowMs,
          lastActiveAt: nowMs,
          expiresAt,
        },
        sessionToken: rawSessionToken,
      },
      201,
      { 'Set-Cookie': setCookie }
    );
  }

  // ─── C0. GET /api/auth/me (Unified "Who Is The Current User" Endpoint) ───
  if (subPath === 'me' && request.method === 'GET') {
    const resolved = await resolveCurrentUser({
      request,
      env,
      db,
      secret,
      tokenVerifierOverride: opts.tokenVerifierOverride,
    });

    if (!resolved) {
      return jsonResponse(
        {
          ok: true,
          authenticated: false,
          user: null,
          guest: null,
        },
        200
      );
    }

    if (resolved.isGuest) {
      const refreshHeaders: Record<string, string> = {};
      if (resolved.sessionToken) {
        refreshHeaders['Set-Cookie'] = buildGuestSessionCookieHeader(
          resolved.sessionToken,
          isHttps,
          false
        );
      }
      const guestPayload = {
        uid: resolved.uid,
        username: resolved.username,
        displayName: resolved.displayName || resolved.username,
        shortId: resolved.shortId || 'GUEST',
        accountType: 'guest' as const,
        isGuest: true,
        email: '',
        plan: 'free' as const,
        role: 'student' as const,
        targetUniversity: resolved.targetUniversity || 'General Prep',
        testsCompleted: Number(resolved.testsCompleted || 0),
        totalQuestionsSolved: Number(resolved.totalQuestionsSolved || 0),
        streak: Number(resolved.streak || 0),
        stats: resolved.stats || {},
        attempts: resolved.attempts || [],
        isSuspended: Boolean(resolved.isPostingBanned),
        createdAt: Number(resolved.d1CreatedAtMs || nowMs),
        lastActiveAt: nowMs,
        expiresAt: Number(resolved.sessionExpiresAt || nowMs + GUEST_SESSION_TTL_MS),
      };
      return jsonResponse(
        {
          ok: true,
          authenticated: true,
          accountType: 'guest',
          user: guestPayload,
          guest: guestPayload,
          sessionToken: resolved.sessionToken || null,
        },
        200,
        refreshHeaders
      );
    }

    // Check if the registered user has a canonical username in `user_usernames`
    const usernameRow = await db
      .prepare('SELECT username_lower, username_display, email FROM user_usernames WHERE uid = ?1 LIMIT 1')
      .bind(resolved.uid)
      .first<{ username_lower: string; username_display: string; email?: string }>()
      .catch(() => null);

    if (usernameRow && !usernameRow.email && resolved.email) {
      await db
        .prepare('UPDATE user_usernames SET email = ?1, updated_at = ?2 WHERE uid = ?3')
        .bind(resolved.email.toLowerCase(), nowMs, resolved.uid)
        .run()
        .catch(() => {});
    }

    const regPayload = {
      uid: resolved.uid,
      username: usernameRow?.username_display || resolved.username,
      hasRegisteredUsername: Boolean(usernameRow?.username_display),
      displayName: resolved.displayName || resolved.name,
      name: resolved.name,
      email: resolved.email,
      picture: resolved.picture,
      accountType: 'registered' as const,
      isGuest: false,
      plan: resolved.plan,
      role: resolved.role,
      customRole: resolved.customRole,
      emailVerified: resolved.emailVerified,
      sessionVerified: resolved.sessionVerified,
    };

    return jsonResponse(
      {
        ok: true,
        authenticated: true,
        accountType: 'registered',
        hasRegisteredUsername: Boolean(usernameRow?.username_display),
        user: regPayload,
        guest: null,
      },
      200
    );
  }

  // ─── C. GET /api/auth/guest/session (Verify & Restore Guest Session + Sliding Refresh) ───
  if (subPath === 'guest/session' && request.method === 'GET') {
    const guestUser = await authenticateD1GuestSession(request, db, secret);
    if (!guestUser) {
      return jsonResponse({ ok: true, authenticated: false, guest: null }, 200);
    }

    const row = await db
      .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(guestUser.uid)
      .first<Record<string, any>>();

    if (!row || Number(row.is_guest) !== 1 || row.upgraded_to_uid || Number(row.is_suspended) === 1) {
      return jsonResponse({ ok: true, authenticated: false, guest: null }, 200);
    }

    let parsedStats: Record<string, any> = {};
    let parsedAttempts: any[] = [];
    try {
      parsedStats = JSON.parse(String(row.stats_json || '{}'));
    } catch {
      parsedStats = {};
    }
    try {
      parsedAttempts = JSON.parse(String(row.attempts_json || '[]'));
    } catch {
      parsedAttempts = [];
    }

    const refreshHeaders: Record<string, string> = {};
    if (guestUser.sessionToken) {
      refreshHeaders['Set-Cookie'] = buildGuestSessionCookieHeader(
        guestUser.sessionToken,
        isHttps,
        false
      );
    }

    const cleanUsername = String(row.username || guestUser.username || '').trim();
    const cleanDisplayName = String(row.display_name || cleanUsername || 'Guest').trim();

    return jsonResponse(
      {
        ok: true,
        authenticated: true,
        sessionToken: guestUser.sessionToken || null,
        guest: {
          uid: String(row.uid),
          username: cleanUsername,
          displayName: cleanDisplayName,
          shortId: String(row.short_id || 'GUEST'),
          accountType: 'guest',
          isGuest: true,
          email: '',
          plan: 'free',
          role: 'student',
          targetUniversity: String(row.target_university || 'General Prep'),
          testsCompleted: Number(row.tests_completed || 0),
          totalQuestionsSolved: Number(row.total_questions_solved || 0),
          streak: Number(row.streak || 0),
          stats: parsedStats,
          attempts: parsedAttempts,
          isSuspended: Boolean(row.is_suspended),
          createdAt: Number(row.created_at || nowMs),
          lastActiveAt: nowMs,
          expiresAt: Number(guestUser.sessionExpiresAt || nowMs + GUEST_SESSION_TTL_MS),
        },
      },
      200,
      refreshHeaders
    );
  }

  // ─── C2. GET & POST /api/auth/guest/attempts (Server-Side D1 Guest Test Attempts & Stats) ───
  if (
    (subPath === 'guest/attempts' || subPath.startsWith('guest/attempts/')) &&
    (request.method === 'GET' || request.method === 'POST')
  ) {
    const guestUser = await authenticateD1GuestSession(request, db, secret);
    if (!guestUser) {
      return jsonResponse(
        {
          ok: false,
          error: 'Your guest session expired, please choose your username again.',
          code: 'GUEST_SESSION_EXPIRED',
        },
        401
      );
    }

    const currentRow = await db
      .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(guestUser.uid)
      .first<Record<string, any>>();

    if (!currentRow) {
      return jsonResponse(
        {
          ok: false,
          error: 'Guest account not found. Please choose your username again.',
          code: 'GUEST_NOT_FOUND',
        },
        404
      );
    }

    let parsedStats: Record<string, any> = {};
    let parsedAttempts: any[] = [];
    try {
      parsedStats = JSON.parse(String(currentRow.stats_json || '{}'));
    } catch {
      parsedStats = {};
    }
    try {
      parsedAttempts = JSON.parse(String(currentRow.attempts_json || '[]'));
      if (!Array.isArray(parsedAttempts)) parsedAttempts = [];
    } catch {
      parsedAttempts = [];
    }

    const pathAttemptId = subPath.startsWith('guest/attempts/')
      ? decodeURIComponent(subPath.slice('guest/attempts/'.length).trim())
      : url.searchParams.get('attemptId') || '';

    if (request.method === 'GET') {
      if (pathAttemptId) {
        const found = parsedAttempts.find(
          (a: any) => String(a?.id || a?.attemptId || '') === pathAttemptId
        );
        if (!found) {
          return jsonResponse(
            { ok: false, error: 'Guest test attempt not found.', code: 'ATTEMPT_NOT_FOUND' },
            404
          );
        }
        return jsonResponse({ ok: true, attempt: found, stats: parsedStats });
      }
      return jsonResponse({
        ok: true,
        uid: guestUser.uid,
        username: guestUser.username,
        testsCompleted: Number(currentRow.tests_completed || 0),
        totalQuestionsSolved: Number(currentRow.total_questions_solved || 0),
        streak: Number(currentRow.streak || 0),
        stats: parsedStats,
        attempts: parsedAttempts,
      });
    }

    // POST /api/auth/guest/attempts — Create, save progress, or submit a guest test attempt in D1
    let body: {
      action?: 'start' | 'progress' | 'submit';
      attemptId?: string;
      attempt?: Record<string, any>;
      statsDelta?: {
        testsCompletedDelta?: number;
        questionsSolvedDelta?: number;
        correctAnswersDelta?: number;
        subject?: string;
        chapterBreakdown?: Record<string, { total: number; correct: number }>;
        dateStr?: string;
      };
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body.', code: 'INVALID_JSON' }, 400);
    }

    const incomingAttempt = body.attempt || {};
    const { action: _act, attempt: _att, statsDelta: _sd, ...topLevelFields } = body as Record<string, any>;
    const targetAttemptId = String(
      body.attemptId || incomingAttempt.id || pathAttemptId || `gatt_${nowMs}`
    ).trim();

    const existingIdx = parsedAttempts.findIndex(
      (a: any) => String(a?.id || a?.attemptId || '') === targetAttemptId
    );

    const existingObj = existingIdx >= 0 ? parsedAttempts[existingIdx] : {};
    const mergedAttempt: Record<string, any> = {
      ...existingObj,
      ...topLevelFields,
      ...incomingAttempt,
      id: targetAttemptId,
      uid: guestUser.uid,
      userName: guestUser.username,
      displayName: guestUser.displayName || guestUser.username,
      status:
        body.action === 'submit'
          ? 'completed'
          : incomingAttempt.status || existingObj?.status || 'in-progress',
      updatedAt: nowMs,
      createdAt: existingObj?.createdAt || incomingAttempt.createdAt || nowMs,
    };

    const wasAlreadyCompleted = existingObj?.status === 'completed';
    if (existingIdx >= 0) {
      parsedAttempts[existingIdx] = mergedAttempt;
    } else {
      parsedAttempts.unshift(mergedAttempt);
    }

    let nextTests = Number(currentRow.tests_completed || 0);
    let nextSolved = Number(currentRow.total_questions_solved || 0);
    let nextStreak = Number(currentRow.streak || 0);
    const nextUni = String(currentRow.target_university || 'General Prep');

    if (
      (body.action === 'submit' || mergedAttempt.status === 'completed') &&
      !wasAlreadyCompleted
    ) {
      const solvedDelta = Math.max(
        0,
        Number(
          body.statsDelta?.questionsSolvedDelta ??
            mergedAttempt.totalQuestions ??
            (Array.isArray(mergedAttempt.questionIds) ? mergedAttempt.questionIds.length : 0)
        )
      );
      nextTests += 1;
      nextSolved += solvedDelta;
      if (nextStreak === 0) nextStreak = 1;

      const correctDelta = Math.max(
        0,
        Number(body.statsDelta?.correctAnswersDelta ?? mergedAttempt.correctAnswers ?? mergedAttempt.score ?? 0)
      );
      parsedStats.testsCompleted = nextTests;
      parsedStats.totalQuestionsSolved = nextSolved;
      parsedStats.correctAnswers = Number(parsedStats.correctAnswers || 0) + correctDelta;
      const totalAccuracyDenom = Math.max(1, nextSolved);
      parsedStats.overallAccuracy = Math.round(
        (Number(parsedStats.correctAnswers || 0) / totalAccuracyDenom) * 100
      );

      if (body.statsDelta?.subject && body.statsDelta?.chapterBreakdown) {
        if (!parsedStats.chapterStats || typeof parsedStats.chapterStats !== 'object') {
          parsedStats.chapterStats = {};
        }
        const subj = body.statsDelta.subject;
        for (const [chap, cStats] of Object.entries(body.statsDelta.chapterBreakdown)) {
          const key = `${subj}_${chap}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          const prevChap = parsedStats.chapterStats[key] || {
            subject: subj,
            chapter: chap,
            attempts: 0,
            correct: 0,
            accuracy: 0,
          };
          const newTotal = Number(prevChap.attempts || 0) + Number(cStats.total || 0);
          const newCorr = Number(prevChap.correct || 0) + Number(cStats.correct || 0);
          parsedStats.chapterStats[key] = {
            subject: subj,
            chapter: chap,
            attempts: newTotal,
            correct: newCorr,
            accuracy: newTotal > 0 ? Math.round((newCorr / newTotal) * 100) : 0,
            lastUpdated: nowMs,
          };
        }
      }
    }

    const nextStatsJson = JSON.stringify(parsedStats);
    const nextAttemptsJson = JSON.stringify(parsedAttempts.slice(0, 100));

    await db
      .prepare(
        `UPDATE guest_accounts
         SET tests_completed = ?1, total_questions_solved = ?2, streak = ?3,
             target_university = ?4, stats_json = ?5, attempts_json = ?6, last_active_at = ?7
         WHERE uid = ?8`
      )
      .bind(
        nextTests,
        nextSolved,
        nextStreak,
        nextUni,
        nextStatsJson,
        nextAttemptsJson,
        nowMs,
        guestUser.uid
      )
      .run();

    const refreshHeaders: Record<string, string> = {};
    if (guestUser.sessionToken) {
      refreshHeaders['Set-Cookie'] = buildGuestSessionCookieHeader(
        guestUser.sessionToken,
        isHttps,
        false
      );
    }

    return jsonResponse(
      {
        ok: true,
        uid: guestUser.uid,
        attempt: mergedAttempt,
        testsCompleted: nextTests,
        totalQuestionsSolved: nextSolved,
        streak: nextStreak,
        stats: parsedStats,
      },
      200,
      refreshHeaders
    );
  }

  // ─── D. POST /api/auth/guest/sync (Save Guest Progress, Attempts & Stats) ───
  if (subPath === 'guest/sync' && request.method === 'POST') {
    const guestUser = await authenticateD1GuestSession(request, db, secret);
    if (!guestUser) {
      return jsonResponse(
        {
          ok: false,
          error: 'Your guest session expired, please choose your username again.',
          code: 'UNAUTHENTICATED',
        },
        401
      );
    }

    let body: {
      testsCompleted?: number;
      totalQuestionsSolved?: number;
      questionsSolved?: number;
      streak?: number;
      targetUniversity?: string;
      stats?: Record<string, any>;
      attempts?: any[];
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
    }

    const currentRow = await db
      .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(guestUser.uid)
      .first<Record<string, any>>();

    if (!currentRow) {
      return jsonResponse({ ok: false, error: 'Guest account not found.', code: 'NOT_FOUND' }, 404);
    }

    const nextTests =
      body.testsCompleted !== undefined
        ? Math.max(0, Math.floor(Number(body.testsCompleted)))
        : Number(currentRow.tests_completed || 0);
    const solvedInput = body.totalQuestionsSolved ?? body.questionsSolved;
    const nextSolved =
      solvedInput !== undefined
        ? Math.max(0, Math.floor(Number(solvedInput)))
        : Number(currentRow.total_questions_solved || 0);
    const nextStreak =
      body.streak !== undefined
        ? Math.max(0, Math.floor(Number(body.streak)))
        : Number(currentRow.streak || 0);
    const nextUni =
      body.targetUniversity !== undefined
        ? String(body.targetUniversity).trim() || 'General Prep'
        : String(currentRow.target_university || 'General Prep');
    const nextStatsJson =
      body.stats !== undefined
        ? JSON.stringify(body.stats)
        : String(currentRow.stats_json || '{}');
    const nextAttemptsJson =
      body.attempts !== undefined
        ? JSON.stringify(Array.isArray(body.attempts) ? body.attempts.slice(0, 100) : [])
        : String(currentRow.attempts_json || '[]');

    await db
      .prepare(
        `UPDATE guest_accounts
         SET tests_completed = ?1, total_questions_solved = ?2, streak = ?3,
             target_university = ?4, stats_json = ?5, attempts_json = ?6, last_active_at = ?7
         WHERE uid = ?8`
      )
      .bind(
        nextTests,
        nextSolved,
        nextStreak,
        nextUni,
        nextStatsJson,
        nextAttemptsJson,
        nowMs,
        guestUser.uid
      )
      .run();

    const refreshHeaders: Record<string, string> = {};
    if (guestUser.sessionToken) {
      refreshHeaders['Set-Cookie'] = buildGuestSessionCookieHeader(
        guestUser.sessionToken,
        isHttps,
        false
      );
    }

    return jsonResponse(
      {
        ok: true,
        uid: guestUser.uid,
        testsCompleted: nextTests,
        totalQuestionsSolved: nextSolved,
        streak: nextStreak,
        targetUniversity: nextUni,
        lastActiveAt: nowMs,
      },
      200,
      refreshHeaders
    );
  }

  // ─── E. POST /api/auth/guest/logout (Revoke Session, Clear Cookie, Abandon Guest & Release Username Immediately) ───
  if (subPath === 'guest/logout' && request.method === 'POST') {
    let bodyUid = '';
    try {
      const b = (await request.json()) as { uid?: string };
      if (b?.uid) bodyUid = String(b.uid).trim();
    } catch {
      // Optional JSON body
    }

    const rawToken = extractGuestSessionTokenFromRequest(request);
    let targetGuestUid = bodyUid;
    let targetUsernameLower = '';

    if (rawToken) {
      const tokenHash = await computeGuestTokenSha256Hex(rawToken, secret);
      const sessRow = await db
        .prepare('SELECT uid FROM guest_sessions WHERE token_hash = ?1 LIMIT 1')
        .bind(tokenHash)
        .first<{ uid: string }>()
        .catch(() => null);
      if (sessRow?.uid) {
        targetGuestUid = String(sessRow.uid);
      }
      await db
        .prepare('UPDATE guest_sessions SET revoked = 1 WHERE token_hash = ?1')
        .bind(tokenHash)
        .run()
        .catch(() => {});
    }

    if (targetGuestUid) {
      const guestRow = await db
        .prepare('SELECT uid, username_lower, is_guest, upgraded_to_uid FROM guest_accounts WHERE uid = ?1 LIMIT 1')
        .bind(targetGuestUid)
        .first<{ uid: string; username_lower: string; is_guest: number; upgraded_to_uid: string | null }>()
        .catch(() => null);

      // Revoke all sessions for this guest UID
      await db
        .prepare('UPDATE guest_sessions SET revoked = 1 WHERE uid = ?1')
        .bind(targetGuestUid)
        .run()
        .catch(() => {});

      // Release the username immediately from `user_usernames` so it is not locked forever
      await db
        .prepare("DELETE FROM user_usernames WHERE uid = ?1 AND account_type = 'guest'")
        .bind(targetGuestUid)
        .run()
        .catch(() => {});

      if (guestRow && Number(guestRow.is_guest) === 1 && !guestRow.upgraded_to_uid) {
        targetUsernameLower = String(guestRow.username_lower || '');
        if (targetUsernameLower && !targetUsernameLower.includes('__abandoned_')) {
          await db
            .prepare("DELETE FROM user_usernames WHERE username_lower = ?1 AND account_type = 'guest'")
            .bind(targetUsernameLower)
            .run()
            .catch(() => {});
        }
        const freedUsernameLower = targetUsernameLower.includes('__abandoned_')
          ? targetUsernameLower
          : `${targetUsernameLower}__abandoned_${targetGuestUid}`;
        const purgeAfterMs = nowMs + ABANDONED_GUEST_GRACE_PERIOD_MS;

        // Mark guest account as abandoned; data will be deleted after 7-day grace period
        await db
          .prepare(
            `UPDATE guest_accounts
             SET status = ?1, abandoned_at = ?2, purge_after = ?3, username_lower = ?4, last_active_at = ?5
             WHERE uid = ?6`
          )
          .bind('abandoned', nowMs, purgeAfterMs, freedUsernameLower, nowMs, targetGuestUid)
          .run()
          .catch(() => {});
      }
    }

    // Also opportunistically purge any guest accounts past their 7-day grace period or 30-day inactivity
    await purgeExpiredGuestAccounts(db, nowMs).catch(() => {});

    const clearCookie = buildGuestSessionCookieHeader('', isHttps, true);
    return jsonResponse(
      {
        ok: true,
        loggedOut: true,
        abandoned: Boolean(targetGuestUid),
        usernameReleased: Boolean(targetGuestUid),
        gracePeriodDays: 7,
        purgeAfter: nowMs + ABANDONED_GUEST_GRACE_PERIOD_MS,
      },
      200,
      { 'Set-Cookie': clearCookie }
    );
  }

  // ─── E2. POST / GET /api/auth/guest/cleanup (Scheduled Cleanup Job & Manual Trigger) ───
  if (subPath === 'guest/cleanup' && (request.method === 'POST' || request.method === 'GET')) {
    let customNowMs = nowMs;
    if (request.method === 'POST') {
      try {
        const b = (await request.json()) as { nowMs?: number };
        if (typeof b?.nowMs === 'number' && b.nowMs > 0) {
          customNowMs = b.nowMs;
        }
      } catch {
        // Ignore
      }
    }
    const cleanupResult = await purgeExpiredGuestAccounts(db, customNowMs);
    return jsonResponse({
      ok: true,
      purgedCount: cleanupResult.purgedCount,
      purgedUids: cleanupResult.purgedUids,
      abandonedGracePeriodDays: 7,
      inactiveTtlDays: 30,
      executedAt: customNowMs,
    });
  }

  // ─── F. POST /api/auth/guest/upgrade (In-Place Upgrade Guest -> Registered User) ───
  if (subPath === 'guest/upgrade' && request.method === 'POST') {
    let body: {
      guestUid?: string;
      guestSessionToken?: string;
      newUid?: string;
      email?: string;
      displayName?: string;
      signInProvider?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
    }

    // Authenticate the guest session (from cookie, header, or body.guestSessionToken)
    let guestUser = await authenticateD1GuestSession(request, db, secret);
    if (!guestUser && body.guestSessionToken) {
      const tokenHash = await computeGuestTokenSha256Hex(String(body.guestSessionToken), secret);
      const sessRow = await db
        .prepare('SELECT uid, revoked, expires_at FROM guest_sessions WHERE token_hash = ?1 LIMIT 1')
        .bind(tokenHash)
        .first<{ uid: string; revoked: number; expires_at: number }>();
      if (sessRow && Number(sessRow.revoked) === 0 && Number(sessRow.expires_at) > nowMs) {
        const gRow = await db
          .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
          .bind(sessRow.uid)
          .first<Record<string, any>>();
        if (gRow && String(gRow.status || 'active') !== 'abandoned' && !gRow.abandoned_at) {
          guestUser = {
            uid: String(gRow.uid),
            email: '',
            name: String(gRow.display_name || gRow.username),
            username: String(gRow.username),
            picture: null,
            role: 'student',
            customRole: 'Guest',
            isPostingBanned: false,
            isSuperAdmin: false,
            isAdminOrAbove: false,
            emailVerified: true,
            sessionVerified: true,
            isGuest: true,
            signInProvider: 'guest',
            authTime: Math.floor(nowMs / 1000),
            d1CreatedAtMs: Number(gRow.created_at || nowMs),
          };
        }
      }
    }

    const targetGuestUid = guestUser?.uid || String(body.guestUid || '').trim();
    if (!targetGuestUid) {
      return jsonResponse(
        { ok: false, error: 'Active guest account required to upgrade.', code: 'GUEST_NOT_FOUND' },
        401
      );
    }

    const guestRow = await db
      .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(targetGuestUid)
      .first<Record<string, any>>();

    if (!guestRow || String(guestRow.status || 'active') === 'abandoned' || guestRow.abandoned_at) {
      return jsonResponse(
        { ok: false, error: 'Guest account not found or already logged out.', code: 'GUEST_NOT_FOUND' },
        404
      );
    }

    // Verify Firebase token if provided, or use newUid from body
    const authHeader = request.headers.get('Authorization');
    const projectId =
      env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
    const verifyFn =
      opts.tokenVerifierOverride ||
      ((hdr: string | null | undefined) => verifyFirebaseIdToken(hdr, projectId));
    const verifiedFirebase =
      authHeader && !authHeader.startsWith('Bearer guest_') ? await verifyFn(authHeader) : null;

    const newUid = String(verifiedFirebase?.uid || body.newUid || '').trim();
    const email = String(verifiedFirebase?.email || body.email || '')
      .trim()
      .toLowerCase();

    if (!newUid || !email) {
      return jsonResponse(
        {
          ok: false,
          error: 'Valid registered user UID and email are required to upgrade.',
          code: 'MISSING_UPGRADE_CREDENTIALS',
        },
        400
      );
    }

    // Check if this `newUid` or `email` already belongs to another registered account!
    const existingUsernameForNewUid = await db
      .prepare('SELECT username_lower, username_display, uid, account_type FROM user_usernames WHERE uid = ?1 LIMIT 1')
      .bind(newUid)
      .first<{ username_lower: string; username_display: string; uid: string; account_type: string }>();

    if (
      existingUsernameForNewUid &&
      existingUsernameForNewUid.username_lower !== String(guestRow.username_lower)
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            'This email or Google account already belongs to an existing Boardly account. Please log in to that account instead.',
          code: 'ACCOUNT_ALREADY_EXISTS',
          existingUsername: existingUsernameForNewUid.username_display,
        },
        409
      );
    }

    const allGuests = await db
      .prepare('SELECT uid, email, upgraded_to_uid FROM guest_accounts')
      .all<{ uid: string; email: string; upgraded_to_uid: string | null }>();
    const conflictingUpgrade = (allGuests.results || []).find(
      (g) =>
        g.uid !== targetGuestUid &&
        ((g.email && g.email.toLowerCase() === email) ||
          (g.upgraded_to_uid && g.upgraded_to_uid === newUid))
    );
    if (conflictingUpgrade) {
      return jsonResponse(
        {
          ok: false,
          error:
            'This email or Google account already belongs to another account. Please log in instead.',
          code: 'ACCOUNT_ALREADY_EXISTS',
        },
        409
      );
    }

    const usernameLower = String(guestRow.username_lower);
    const usernameDisplay = String(guestRow.username);

    // Upgrade in place:
    // 1. Update `user_usernames` so `username_lower` now points to `newUid` with `account_type = 'registered'` and `email`
    await db
      .prepare(
        `UPDATE user_usernames SET uid = ?1, account_type = ?2, email = ?3, updated_at = ?4 WHERE username_lower = ?5`
      )
      .bind(newUid, 'registered', email, nowMs, usernameLower)
      .run();

    // 2. Update `guest_accounts` in place so record reflects upgrade & preserves stats
    await db
      .prepare(
        `UPDATE guest_accounts
         SET account_type = ?1, is_guest = 0, email = ?2, upgraded_to_uid = ?3, upgraded_at = ?4, last_active_at = ?5
         WHERE uid = ?6`
      )
      .bind('registered', email, newUid, nowMs, nowMs, targetGuestUid)
      .run();

    // 3. Revoke guest sessions
    await db
      .prepare('UPDATE guest_sessions SET revoked = 1 WHERE uid = ?1')
      .bind(targetGuestUid)
      .run()
      .catch(() => {});

    // 4. Mark session verified in `email_verification_sessions` so the upgraded user goes straight into their upgraded account
    const emailHash = await hashIdentifier(secret, 'email', email || newUid);
    const nowSec = Math.floor(nowMs / 1000);
    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(newUid, emailHash, 1, nowSec + 60, nowMs, nowMs)
      .run();

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

    const clearCookie = buildGuestSessionCookieHeader('', isHttps, true);

    return jsonResponse(
      {
        ok: true,
        upgraded: true,
        guestUid: targetGuestUid,
        newUid,
        email,
        username: usernameDisplay,
        shortId: String(guestRow.short_id || 'USER'),
        targetUniversity: String(guestRow.target_university || 'General Prep'),
        testsCompleted: Number(guestRow.tests_completed || 0),
        totalQuestionsSolved: Number(guestRow.total_questions_solved || 0),
        streak: Number(guestRow.streak || 0),
        stats: parsedStats,
        attempts: parsedAttempts,
        createdAt: Number(guestRow.created_at || nowMs),
      },
      200,
      { 'Set-Cookie': clearCookie }
    );
  }

  // ─── G. POST /api/auth/username-register (Reserve/Update Username for Registered User) ───
  if (subPath === 'username-register' && request.method === 'POST') {
    let body: { uid?: string; username?: string; email?: string; accountType?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
    }

    const authHeaderCheck = request.headers.get('Authorization');
    const projectId =
      env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
    const verifyFn =
      opts.tokenVerifierOverride ||
      ((hdr: string | null | undefined) => verifyFirebaseIdToken(hdr, projectId));
    const verifiedToken =
      authHeaderCheck && authHeaderCheck.startsWith('Bearer ') && !authHeaderCheck.startsWith('Bearer guest_')
        ? await verifyFn(authHeaderCheck).catch(() => null)
        : null;

    const targetUid = String(verifiedToken?.uid || body.uid || '').trim();
    const rawUsername = String(body.username || '').trim();
    const resolvedEmail = String(verifiedToken?.email || body.email || '')
      .trim()
      .toLowerCase();
    const accountType = body.accountType === 'guest' ? 'guest' : 'registered';

    if (!targetUid || !rawUsername) {
      return jsonResponse(
        { ok: false, error: 'Both uid and username are required.', code: 'MISSING_FIELDS' },
        400
      );
    }

    const availability = await checkD1UsernameAvailability({
      db,
      rawUsername,
      excludeUid: targetUid,
    });
    if (!availability.available) {
      const status =
        availability.code === 'USERNAME_TAKEN' || availability.code === 'USERNAME_TAKEN_OR_SIMILAR'
          ? 409
          : 400;
      return jsonResponse(
        {
          ok: false,
          available: false,
          error: availability.reason || 'Username is already taken.',
          code: availability.code || 'USERNAME_TAKEN',
        },
        status
      );
    }

    // Check previous username row for this uid if they are renaming
    const prevRow = await db
      .prepare('SELECT username_lower, uid, email FROM user_usernames WHERE uid = ?1 LIMIT 1')
      .bind(targetUid)
      .first<{ username_lower: string; uid: string; email?: string }>();

    const emailToStore = resolvedEmail || String(prevRow?.email || '').trim().toLowerCase();

    try {
      if (prevRow && prevRow.username_lower === availability.normalized) {
        await db
          .prepare(
            'UPDATE user_usernames SET uid = ?1, account_type = ?2, email = ?3, updated_at = ?4 WHERE username_lower = ?5'
          )
          .bind(targetUid, accountType, emailToStore, nowMs, availability.normalized)
          .run();
      } else {
        await db
          .prepare(
            `INSERT INTO user_usernames (username_lower, username_display, uid, account_type, email, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
          )
          .bind(
            availability.normalized,
            availability.clean,
            targetUid,
            accountType,
            emailToStore,
            nowMs,
            nowMs
          )
          .run();
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY') || msg.includes('constraint')) {
        return jsonResponse(
          {
            ok: false,
            available: false,
            error: 'This username is already taken.',
            code: 'USERNAME_TAKEN',
          },
          409
        );
      }
      throw err;
    }

    // Sync username to Firestore `users/{targetUid}` if service account is available
    try {
      const sa = parseServiceAccountFromEnv(env);
      if (sa && accountType === 'registered') {
        const fsProjectId = resolveTargetFirestoreProjectId(projectId);
        const fsDbId = resolveTargetFirestoreDatabaseId(
          env?.FIREBASE_DATABASE_ID ||
            env?.VITE_FIREBASE_DATABASE_ID ||
            env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
            DEFAULT_FIRESTORE_DATABASE_ID
        );
        const store = new FirestoreRestAdapter(sa, fsProjectId, fsDbId);
        await store.setDoc(
          `users/${targetUid}`,
          {
            username: availability.clean,
            usernameLower: availability.normalized,
          },
          true
        );
      }
    } catch {
      // Non-fatal
    }

    return jsonResponse({
      ok: true,
      available: true,
      username: availability.clean,
      normalized: availability.normalized,
      uid: targetUid,
    });
  }

  // ─── G2. POST /api/auth/username-release (Rollback Username Reservation on Failed Signup) ───
  if (subPath === 'username-release' && request.method === 'POST') {
    let body: { uid?: string; username?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
    }
    const targetUid = String(body.uid || '').trim();
    if (!targetUid) {
      return jsonResponse({ ok: false, error: 'Missing uid.', code: 'MISSING_FIELDS' }, 400);
    }
    await db
      .prepare('DELETE FROM user_usernames WHERE uid = ?1')
      .bind(targetUid)
      .run()
      .catch(() => {});
    return jsonResponse({ ok: true, released: true });
  }

  // ─── G3. POST /api/auth/login-username (Server-Side Username -> Email Resolution & Password Verification) ───
  if (subPath === 'login-username' && request.method === 'POST') {
    let body: { identifier?: string; username?: string; password?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' }, 401);
    }

    const rawIdentifier = String(body.identifier || body.username || '').trim();
    const password = String(body.password || '');
    const normalizedIdentifier = rawIdentifier.replace(/^@+/, '').toLowerCase();

    const clientIp = extractClientIp(request);
    const ipRateKey = `ip:${await hashIdentifier(secret, 'login_ip', clientIp)}`;
    const idRateKey = `id:${await hashIdentifier(secret, 'login_id', normalizedIdentifier || 'empty')}`;

    const checkRateLimit = async (key: string): Promise<boolean> => {
      const row = await db
        .prepare('SELECT attempt_count, window_start, locked_until FROM login_rate_limits WHERE rate_key = ?1 LIMIT 1')
        .bind(key)
        .first<{ attempt_count: number; window_start: number; locked_until: number }>()
        .catch(() => null);
      if (!row) return false;
      if (row.locked_until && nowMs < Number(row.locked_until)) return true;
      if (nowMs - Number(row.window_start) > LOGIN_RATE_LIMIT_WINDOW_MS) return false;
      return Number(row.attempt_count || 0) >= MAX_LOGIN_ATTEMPTS_PER_WINDOW;
    };

    const recordFailedAttempt = async (key: string): Promise<void> => {
      const row = await db
        .prepare('SELECT attempt_count, window_start, locked_until FROM login_rate_limits WHERE rate_key = ?1 LIMIT 1')
        .bind(key)
        .first<{ attempt_count: number; window_start: number; locked_until: number }>()
        .catch(() => null);
      const expiredWindow = !row || nowMs - Number(row.window_start) > LOGIN_RATE_LIMIT_WINDOW_MS;
      const nextCount = expiredWindow ? 1 : Number(row.attempt_count || 0) + 1;
      const nextWindowStart = expiredWindow ? nowMs : Number(row.window_start);
      const nextLockedUntil =
        nextCount >= MAX_LOGIN_ATTEMPTS_PER_WINDOW ? nowMs + LOGIN_RATE_LIMIT_WINDOW_MS : 0;
      await db
        .prepare(
          `INSERT OR REPLACE INTO login_rate_limits (rate_key, attempt_count, window_start, locked_until, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(key, nextCount, nextWindowStart, nextLockedUntil, nowMs)
        .run()
        .catch(() => {});
    };

    const [ipLimited, idLimited] = await Promise.all([
      checkRateLimit(ipRateKey),
      checkRateLimit(idRateKey),
    ]);

    if (ipLimited || idLimited) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many login attempts. Please wait 15 minutes and try again.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }

    if (!normalizedIdentifier || !password) {
      await Promise.all([recordFailedAttempt(ipRateKey), recordFailedAttempt(idRateKey)]);
      return jsonResponse(
        { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
        401
      );
    }

    // 1. Look up username in `user_usernames` on the server
    const usernameRow = await db
      .prepare(
        'SELECT username_lower, username_display, uid, account_type, email FROM user_usernames WHERE username_lower = ?1 LIMIT 1'
      )
      .bind(normalizedIdentifier)
      .first<{
        username_lower: string;
        username_display: string;
        uid: string;
        account_type: string;
        email?: string;
      }>()
      .catch(() => null);

    // Block missing usernames AND guest usernames with the exact same generic error
    if (!usernameRow || usernameRow.account_type === 'guest' || usernameRow.uid.startsWith('guest_')) {
      await Promise.all([recordFailedAttempt(ipRateKey), recordFailedAttempt(idRateKey)]);
      return jsonResponse(
        { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
        401
      );
    }

    // 2. Resolve the account's email on the server (never expose it to the client)
    let resolvedEmail = String(usernameRow.email || '').trim().toLowerCase();

    if (!resolvedEmail) {
      const roleRow = await db
        .prepare('SELECT email FROM user_roles WHERE uid = ?1 LIMIT 1')
        .bind(usernameRow.uid)
        .first<{ email: string }>()
        .catch(() => null);
      if (roleRow?.email) {
        resolvedEmail = String(roleRow.email).trim().toLowerCase();
      }
    }

    if (!resolvedEmail) {
      const upgradedGuestRow = await db
        .prepare('SELECT email FROM guest_accounts WHERE upgraded_to_uid = ?1 LIMIT 1')
        .bind(usernameRow.uid)
        .first<{ email: string }>()
        .catch(() => null);
      if (upgradedGuestRow?.email) {
        resolvedEmail = String(upgradedGuestRow.email).trim().toLowerCase();
      }
    }

    if (!resolvedEmail) {
      try {
        const sa = parseServiceAccountFromEnv(env);
        if (sa) {
          const projectId = resolveTargetFirestoreProjectId(
            env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
          );
          const databaseId = resolveTargetFirestoreDatabaseId(
            env?.FIREBASE_DATABASE_ID ||
              env?.VITE_FIREBASE_DATABASE_ID ||
              env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
              DEFAULT_FIRESTORE_DATABASE_ID
          );
          const store = new FirestoreRestAdapter(sa, projectId, databaseId);
          const userDoc = await store.getDoc(`users/${usernameRow.uid}`);
          if (userDoc.exists && userDoc.data?.email) {
            resolvedEmail = String(userDoc.data.email).trim().toLowerCase();
          }
        }
      } catch {
        // Ignore
      }
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      await Promise.all([recordFailedAttempt(ipRateKey), recordFailedAttempt(idRateKey)]);
      return jsonResponse(
        { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
        401
      );
    }

    // Backfill `user_usernames.email` if it was resolved from fallback
    if (!usernameRow.email && resolvedEmail) {
      await db
        .prepare('UPDATE user_usernames SET email = ?1, updated_at = ?2 WHERE username_lower = ?3')
        .bind(resolvedEmail, nowMs, usernameRow.username_lower)
        .run()
        .catch(() => {});
    }

    // 3. Verify password against Firebase Identity Toolkit REST API on the server
    const firebaseApiKey = (
      env?.FIREBASE_API_KEY ||
      env?.VITE_FIREBASE_API_KEY ||
      (typeof process !== 'undefined'
        ? process.env?.FIREBASE_API_KEY || process.env?.VITE_FIREBASE_API_KEY
        : '') ||
      TARGET_API_KEY
    ).trim();

    try {
      const toolkitRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resolvedEmail,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const toolkitData = (await toolkitRes.json().catch(() => null)) as Record<string, any> | null;

      if (!toolkitRes.ok || !toolkitData?.idToken) {
        const errCode = String(toolkitData?.error?.message || '');
        await Promise.all([recordFailedAttempt(ipRateKey), recordFailedAttempt(idRateKey)]);
        if (errCode.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          return jsonResponse(
            {
              ok: false,
              error: 'Too many login attempts. Please wait a few minutes and try again.',
              code: 'RATE_LIMITED',
            },
            429
          );
        }
        return jsonResponse(
          { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
          401
        );
      }

      // Clear failed login counter for this identifier on success
      await db
        .prepare('DELETE FROM login_rate_limits WHERE rate_key = ?1')
        .bind(idRateKey)
        .run()
        .catch(() => {});

      // Return tokenResponse WITHOUT exposing the user's email in the HTTP response body
      return jsonResponse({
        ok: true,
        uid: String(toolkitData.localId || usernameRow.uid),
        username: usernameRow.username_display,
        tokenResponse: {
          kind: toolkitData.kind || 'identitytoolkit#VerifyPasswordResponse',
          localId: String(toolkitData.localId || usernameRow.uid),
          displayName: String(toolkitData.displayName || usernameRow.username_display),
          idToken: String(toolkitData.idToken),
          refreshToken: String(toolkitData.refreshToken),
          expiresIn: String(toolkitData.expiresIn || '3600'),
          registered: true,
        },
      });
    } catch {
      return jsonResponse(
        { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
        401
      );
    }
  }

  // ─── H. GET /api/auth/guests (Admin Users List: Active & Abandoned Guest Accounts Until Purged) ───
  if (subPath === 'guests' && request.method === 'GET') {
    await purgeExpiredGuestAccounts(db, nowMs).catch(() => {});

    const rowsRes = await db
      .prepare('SELECT * FROM guest_accounts ORDER BY created_at DESC LIMIT 500')
      .all<Record<string, any>>();

    const guests = (rowsRes.results || [])
      .filter((r) => Number(r.is_guest) === 1 && !r.upgraded_to_uid)
      .map((r) => {
        const status =
          String(r.status || 'active') === 'abandoned' || r.abandoned_at ? 'abandoned' : 'active';
        return {
          uid: String(r.uid),
          username: String(r.username),
          displayName: String(r.display_name || r.username),
          shortId: String(r.short_id || 'GUEST'),
          accountType: 'guest' as const,
          badge: 'Guest' as const,
          isGuest: true,
          status,
          abandonedAt: r.abandoned_at ? Number(r.abandoned_at) : null,
          purgeAfter: r.purge_after ? Number(r.purge_after) : null,
          email: '',
          plan: 'free' as const,
          role: 'student' as const,
          targetUniversity: String(r.target_university || 'General Prep'),
          testsCompleted: Number(r.tests_completed || 0),
          totalQuestionsSolved: Number(r.total_questions_solved || 0),
          questionsSolved: Number(r.total_questions_solved || 0),
          streak: Number(r.streak || 0),
          isSuspended: Boolean(r.is_suspended),
          createdAt: Number(r.created_at || nowMs),
          lastActiveAt: Number(r.last_active_at || r.created_at || nowMs),
        };
      });

    return jsonResponse({
      ok: true,
      guests,
    });
  }

  // ─── 1. POST /api/auth/verify-link (Can be clicked from email with or without Bearer token) ───
  if (subPath === 'verify-link' && request.method === 'POST') {
    let body: { token?: string; uid?: string } = {};
    try {
      body = (await request.json()) as { token?: string; uid?: string };
    } catch {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired verification link.', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    const rawToken = String(body.token || '').trim();
    if (!rawToken || rawToken.length < 32) {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired verification link.', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    const tokenHash = await hashFallbackLinkToken({ secret, token: rawToken });
    const rowsRes = await db
      .prepare(
        'SELECT id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at FROM email_verification_codes WHERE link_token_hash = ?1 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(tokenHash)
      .all<{
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
      }>();

    const codeRow = rowsRes.results?.[0] || null;
    if (
      !codeRow ||
      !codeRow.link_token_hash ||
      !constantTimeEqual(codeRow.link_token_hash, tokenHash) ||
      Number(codeRow.used) !== 0 ||
      Number(codeRow.attempt_count) >= MAX_CODE_ATTEMPTS ||
      nowMs > Number(codeRow.expires_at)
    ) {
      if (codeRow && Number(codeRow.used) === 0 && nowMs > Number(codeRow.expires_at)) {
        await db
          .prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?1')
          .bind(codeRow.id)
          .run();
      }
      return jsonResponse(
        { ok: false, error: 'Invalid or expired verification link.', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    // Check that this is the newest unused code for this user & purpose
    const newestRes = await db
      .prepare(
        'SELECT id FROM email_verification_codes WHERE user_id = ?1 AND purpose = ?2 AND used = 0 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(codeRow.user_id, codeRow.purpose)
      .first<{ id: string }>();

    if (!newestRes || newestRes.id !== codeRow.id) {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired verification link.', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    // Mark all codes for this user + purpose as used
    await db
      .prepare('UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND purpose = ?2 AND used = 0')
      .bind(codeRow.user_id, codeRow.purpose)
      .run();

    const nowSec = Math.floor(nowMs / 1000);
    const verifiedAuthTime = Math.max(Number(codeRow.auth_time || 0), nowSec);

    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(codeRow.user_id, codeRow.email_hash, 1, verifiedAuthTime, nowMs, nowMs)
      .run();

    await syncEmailVerifiedToFirebaseAndFirestore({
      uid: codeRow.user_id,
      env,
      storeOverride: opts.storeOverride,
    });

    return jsonResponse({
      ok: true,
      verified: true,
      purpose: codeRow.purpose,
    });
  }

  // If `verification-status` is called by a guest session, exempt the guest from 6-digit OTP
  if (subPath === 'verification-status' && request.method === 'GET') {
    const authHeaderCheck = request.headers.get('Authorization');
    if (
      !authHeaderCheck ||
      !authHeaderCheck.startsWith('Bearer ') ||
      authHeaderCheck.startsWith('Bearer guest_')
    ) {
      const guestSessionUser = await authenticateD1GuestSession(request, db, secret);
      if (guestSessionUser) {
        return jsonResponse({
          ok: true,
          verified: true,
          emailVerified: true,
          isGuest: true,
          exempt: true,
          requiredPurpose: null,
          maskedEmail: `@${guestSessionUser.username || 'guest'}`,
          cooldownSeconds: 0,
        });
      }
    }
  }

  // All remaining `/api/auth/*` endpoints require a valid Firebase ID token in `Authorization: Bearer <token>`
  const authHeader = request.headers.get('Authorization');
  const projectId =
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const verifyFn =
    opts.tokenVerifierOverride || ((hdr: string | null | undefined) => verifyFirebaseIdToken(hdr, projectId));
  const verifiedToken = await verifyFn(authHeader);

  if (!verifiedToken || !verifiedToken.uid) {
    return jsonResponse(
      { ok: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' },
      401
    );
  }

  const uid = verifiedToken.uid;
  const email = String(verifiedToken.email || '').trim().toLowerCase();
  const maskedEmail = maskEmailForDisplay(email);
  const emailHash = await hashIdentifier(secret, 'email', email || uid);
  const tokenAuthTime = Number(verifiedToken.authTime || verifiedToken.iat || Math.floor(nowMs / 1000));

  // ─── 2. GET /api/auth/verification-status ───────────────────────────────────
  if (subPath === 'verification-status' && request.method === 'GET') {
    if (verifiedToken.signInProvider === 'google.com') {
      return jsonResponse({
        ok: true,
        verified: true,
        emailVerified: true,
        requiredPurpose: null,
        maskedEmail,
        cooldownSeconds: 0,
      });
    }

    const sessionRow = await db
      .prepare(
        'SELECT user_id, email_verified, verified_auth_time FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{ user_id: string; email_verified: number; verified_auth_time: number }>();

    const accountEmailVerified =
      Number(sessionRow?.email_verified || 0) === 1 || Boolean(verifiedToken.emailVerified);
    const sessionVerified = await isD1UserSessionVerified(db, verifiedToken);

    // Check remaining resend cooldown
    const recentSendRows = await db
      .prepare(
        'SELECT id, created_at FROM email_verification_send_logs WHERE email_hash = ?1 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(emailHash)
      .all<{ id: string; created_at: number }>();
    const lastSendAt = Number(recentSendRows.results?.[0]?.created_at || 0);
    const elapsedMs = nowMs - lastSendAt;
    const cooldownSeconds =
      lastSendAt > 0 && elapsedMs < RESEND_COOLDOWN_MS
        ? Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000)
        : 0;

    // Check if an active unused code already exists for this user
    const activeCodes = await db
      .prepare(
        'SELECT id, purpose, expires_at, attempt_count, created_at FROM email_verification_codes WHERE user_id = ?1 AND used = 0 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(uid)
      .all<{
        id: string;
        purpose: 'login' | 'signup';
        expires_at: number;
        attempt_count: number;
        created_at: number;
      }>();
    const latestCode = activeCodes.results?.[0] || null;
    const hasActiveCode = Boolean(
      latestCode &&
        nowMs <= Number(latestCode.expires_at) &&
        Number(latestCode.attempt_count) < MAX_CODE_ATTEMPTS
    );

    const requiredPurpose: 'login' | 'signup' | null = sessionVerified
      ? null
      : !accountEmailVerified
      ? 'signup'
      : 'login';

    return jsonResponse({
      ok: true,
      verified: sessionVerified,
      emailVerified: accountEmailVerified,
      requiredPurpose,
      hasActiveCode,
      maskedEmail,
      cooldownSeconds,
    });
  }

  // ─── 3. POST /api/auth/send-code ────────────────────────────────────────────
  if (subPath === 'send-code' && request.method === 'POST') {
    if (verifiedToken.signInProvider === 'google.com') {
      return jsonResponse({
        ok: true,
        alreadyVerified: true,
        maskedEmail,
        cooldownSeconds: 0,
      });
    }

    if (!email || !email.includes('@')) {
      return jsonResponse(
        { ok: false, error: 'Unable to send verification code.', code: 'INVALID_REQUEST' },
        400
      );
    }

    let body: { purpose?: string; forceResend?: boolean; autoInit?: boolean } = {};
    try {
      body = (await request.json()) as { purpose?: string; forceResend?: boolean; autoInit?: boolean };
    } catch {
      body = {};
    }

    const sessionRow = await db
      .prepare(
        'SELECT user_id, email_verified, verified_auth_time FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{ user_id: string; email_verified: number; verified_auth_time: number }>();

    const accountEmailVerified =
      Number(sessionRow?.email_verified || 0) === 1 || Boolean(verifiedToken.emailVerified);

    const purpose: 'login' | 'signup' =
      body.purpose === 'signup' || !accountEmailVerified ? 'signup' : 'login';

    // If this is an automatic initial mount trigger (`autoInit: true`) and a valid unused code
    // was already sent in the last 60 seconds, return the existing cooldown state without sending a duplicate email.
    if (body.autoInit === true && !body.forceResend) {
      const existingCodes = await db
        .prepare(
          'SELECT id, expires_at, attempt_count, created_at FROM email_verification_codes WHERE user_id = ?1 AND purpose = ?2 AND used = 0 ORDER BY created_at DESC LIMIT 1'
        )
        .bind(uid, purpose)
        .all<{ id: string; expires_at: number; attempt_count: number; created_at: number }>();
      const active = existingCodes.results?.[0];
      if (
        active &&
        nowMs - Number(active.created_at) < RESEND_COOLDOWN_MS &&
        nowMs < Number(active.expires_at) &&
        Number(active.attempt_count) < MAX_CODE_ATTEMPTS
      ) {
        const remainingSec = Math.max(
          1,
          Math.ceil((RESEND_COOLDOWN_MS - (nowMs - Number(active.created_at))) / 1000)
        );
        return jsonResponse({
          ok: true,
          purpose,
          maskedEmail,
          expiresInSeconds: Math.max(1, Math.floor((Number(active.expires_at) - nowMs) / 1000)),
          cooldownSeconds: remainingSec,
          reusedActiveWindow: true,
        });
      }
    }

    // Enforce 60-second resend cooldown per email address
    const recentSends = await db
      .prepare(
        'SELECT id, created_at FROM email_verification_send_logs WHERE email_hash = ?1 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(emailHash)
      .all<{ id: string; created_at: number }>();
    const lastSendAt = Number(recentSends.results?.[0]?.created_at || 0);

    if (lastSendAt > 0 && nowMs - lastSendAt < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((RESEND_COOLDOWN_MS - (nowMs - lastSendAt)) / 1000)
      );
      return jsonResponse(
        {
          ok: false,
          error: `Please wait ${retryAfterSeconds}s before requesting another code.`,
          code: 'RATE_LIMITED_COOLDOWN',
          retryAfterSeconds,
        },
        429
      );
    }

    // Enforce hourly limit: max 5 code emails per hour per email address
    const oneHourAgoMs = nowMs - HOURLY_WINDOW_MS;
    const emailHourlyCountRow = await db
      .prepare(
        'SELECT COUNT(*) as cnt FROM email_verification_send_logs WHERE email_hash = ?1 AND created_at >= ?2'
      )
      .bind(emailHash, oneHourAgoMs)
      .first<{ cnt: number }>();
    const emailHourlyCount = Number(emailHourlyCountRow?.cnt || 0);

    if (emailHourlyCount >= MAX_SENDS_PER_HOUR_PER_EMAIL) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many verification codes requested for this email. Please try again in an hour.',
          code: 'RATE_LIMITED_HOURLY_EMAIL',
        },
        429
      );
    }

    // Enforce hourly limit: max 5 code emails per hour per IP
    const clientIp = extractClientIp(request);
    const ipHash = await hashIdentifier(secret, 'ip', clientIp);
    const ipHourlyCountRow = await db
      .prepare(
        'SELECT COUNT(*) as cnt FROM email_verification_send_logs WHERE ip_hash = ?1 AND created_at >= ?2'
      )
      .bind(ipHash, oneHourAgoMs)
      .first<{ cnt: number }>();
    const ipHourlyCount = Number(ipHourlyCountRow?.cnt || 0);

    if (ipHourlyCount >= MAX_SENDS_PER_HOUR_PER_IP) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many verification codes requested from your network. Please try again in an hour.',
          code: 'RATE_LIMITED_HOURLY_IP',
        },
        429
      );
    }

    // Generate 6-digit CSPRNG code & HMAC-SHA256 hash
    const rawCode = generateSixDigitCode();
    const codeHash = await hashVerificationCode({
      secret,
      userId: uid,
      purpose,
      code: rawCode,
    });

    // For signup, also generate a fallback verification link token
    let rawLinkToken: string | null = null;
    let linkTokenHash: string | null = null;
    if (purpose === 'signup') {
      rawLinkToken = generateFallbackLinkToken();
      linkTokenHash = await hashFallbackLinkToken({ secret, token: rawLinkToken });
    }

    // Invalidate all older unused codes for this user and purpose BEFORE inserting the new code
    await db
      .prepare(
        'UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND purpose = ?2 AND used = 0'
      )
      .bind(uid, purpose)
      .run();

    const codeId = `evc_${nowMs}_${ generateFallbackLinkToken().slice(0, 12) }`;
    const expiresAt = nowMs + CODE_TTL_MS;

    await db
      .prepare(
        `INSERT INTO email_verification_codes (
          id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at, ip_hash
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      )
      .bind(
        codeId,
        uid,
        emailHash,
        purpose,
        codeHash,
        linkTokenHash,
        tokenAuthTime,
        expiresAt,
        0,
        0,
        nowMs,
        ipHash
      )
      .run();

    const appUrl = (
      env?.APP_URL ||
      (typeof process !== 'undefined' ? process.env?.APP_URL : '') ||
      url.origin ||
      'https://boardly.cfd'
    ).replace(/\/+$/, '');

    const fallbackVerifyUrl =
      purpose === 'signup' && rawLinkToken
        ? `${appUrl}/verify-email?token=${encodeURIComponent(rawLinkToken)}&uid=${encodeURIComponent(uid)}&purpose=signup`
        : undefined;

    const studentName =
      verifiedToken.name || (email.includes('@') ? email.split('@')[0] : 'Student');
    const emailContent = buildVerificationEmailContent({
      code: rawCode,
      purpose,
      studentName,
      fallbackVerifyUrl,
    });

    const fromAddress = (
      env?.EMAIL_FROM ||
      (typeof process !== 'undefined' ? process.env?.EMAIL_FROM : '') ||
      'Boardly <no-reply@boardly.cfd>'
    ).trim();

    const senderFn = opts.emailSenderOverride || defaultResendEmailSender;
    const sendResult = await senderFn(
      {
        to: email,
        from: fromAddress,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        purpose,
        userId: uid,
      },
      env
    );

    if (!sendResult.ok) {
      // Mark the unsent code as used so it doesn't linger
      await db
        .prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?1')
        .bind(codeId)
        .run();
      return jsonResponse(
        {
          ok: false,
          error: sendResult.error || 'Could not send verification email. Please try again.',
          code: 'EMAIL_SEND_FAILED',
        },
        502
      );
    }

    // Record send in `email_verification_send_logs` for cooldown & hourly rate limiting
    const sendLogId = `evsl_${nowMs}_${generateFallbackLinkToken().slice(0, 10)}`;
    await db
      .prepare(
        `INSERT INTO email_verification_send_logs (id, user_id, email_hash, ip_hash, purpose, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(sendLogId, uid, emailHash, ipHash, purpose, nowMs)
      .run();

    // Never log or return `rawCode` or `rawLinkToken` in any API response
    return jsonResponse({
      ok: true,
      purpose,
      maskedEmail,
      expiresInSeconds: Math.floor(CODE_TTL_MS / 1000),
      cooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    });
  }

  // ─── 4. POST /api/auth/verify-code ──────────────────────────────────────────
  if (subPath === 'verify-code' && request.method === 'POST') {
    let body: { code?: string; purpose?: string } = {};
    try {
      body = (await request.json()) as { code?: string; purpose?: string };
    } catch {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired code', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    const rawCode = String(body.code || '').trim();
    if (!/^\d{6}$/.test(rawCode)) {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired code', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    // Fetch the newest unused code for this user (matching purpose if specified, or newest unused overall)
    const requestedPurpose =
      body.purpose === 'signup' || body.purpose === 'login' ? body.purpose : null;

    const candidateRows = requestedPurpose
      ? await db
          .prepare(
            'SELECT id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at FROM email_verification_codes WHERE user_id = ?1 AND purpose = ?2 AND used = 0 ORDER BY created_at DESC LIMIT 1'
          )
          .bind(uid, requestedPurpose)
          .all<{
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
          }>()
      : await db
          .prepare(
            'SELECT id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at FROM email_verification_codes WHERE user_id = ?1 AND used = 0 ORDER BY created_at DESC LIMIT 1'
          )
          .bind(uid)
          .all<{
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
          }>();

    const activeCode = candidateRows.results?.[0] || null;

    if (!activeCode || Number(activeCode.used) !== 0) {
      return jsonResponse(
        { ok: false, error: 'Invalid or expired code', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    // Check expiration (10 minutes)
    if (nowMs > Number(activeCode.expires_at)) {
      await db
        .prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?1')
        .bind(activeCode.id)
        .run();
      return jsonResponse(
        { ok: false, error: 'Invalid or expired code', code: 'INVALID_OR_EXPIRED_CODE' },
        400
      );
    }

    // Check attempt count (max 5 wrong attempts)
    const currentAttempts = Number(activeCode.attempt_count || 0);
    if (currentAttempts >= MAX_CODE_ATTEMPTS) {
      await db
        .prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?1')
        .bind(activeCode.id)
        .run();
      return jsonResponse(
        {
          ok: false,
          error: 'Invalid or expired code',
          code: 'CODE_LOCKED_MAX_ATTEMPTS',
          locked: true,
        },
        400
      );
    }

    // Compute candidate HMAC-SHA256 hash and compare in constant time
    const candidateHash = await hashVerificationCode({
      secret,
      userId: uid,
      purpose: activeCode.purpose,
      code: rawCode,
    });

    const isMatch = constantTimeEqual(activeCode.code_hash, candidateHash);

    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      const shouldLock = nextAttempts >= MAX_CODE_ATTEMPTS ? 1 : 0;
      await db
        .prepare('UPDATE email_verification_codes SET attempt_count = ?1, used = ?2 WHERE id = ?3')
        .bind(nextAttempts, shouldLock, activeCode.id)
        .run();

      return jsonResponse(
        {
          ok: false,
          error: 'Invalid or expired code',
          code: shouldLock ? 'CODE_LOCKED_MAX_ATTEMPTS' : 'INVALID_OR_EXPIRED_CODE',
          locked: Boolean(shouldLock),
          attemptsRemaining: Math.max(0, MAX_CODE_ATTEMPTS - nextAttempts),
        },
        400
      );
    }

    // Code matched! Mark this code and any other unused codes for this user as used (single-use)
    await db
      .prepare('UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND used = 0')
      .bind(uid)
      .run();

    // Mark session as verified in D1 (`email_verification_sessions`)
    const nowSec = Math.floor(nowMs / 1000);
    const verifiedAuthTime = Math.max(tokenAuthTime, Number(activeCode.auth_time || 0), nowSec);

    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(uid, emailHash, 1, verifiedAuthTime, nowMs, nowMs)
      .run();

    // If signup or previously unverified, sync emailVerified = true to Firestore / Firebase
    if (activeCode.purpose === 'signup' || !verifiedToken.emailVerified) {
      await syncEmailVerifiedToFirebaseAndFirestore({
        uid,
        env,
        storeOverride: opts.storeOverride,
      });
    }

    return jsonResponse({
      ok: true,
      verified: true,
      purpose: activeCode.purpose,
    });
  }

  return jsonResponse({ ok: false, error: 'Endpoint not found.', code: 'NOT_FOUND' }, 404);
}

// Cloudflare Pages Function Entrypoint
export const onRequest = async (context: {
  request: Request;
  env: AuthWorkerEnv;
}): Promise<Response> => {
  return handleAuthApiRequest({
    request: context.request,
    env: context.env,
  });
};

