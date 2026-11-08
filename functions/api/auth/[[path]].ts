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
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FirestoreRestAdapter,
  getSharedLocalD1Database,
  isD1UserSessionVerified,
  parseServiceAccountFromEnv,
  resolveTargetFirestoreDatabaseId,
  resolveTargetFirestoreProjectId,
  verifyFirebaseIdToken,
  type RewardsD1Database,
  type RewardsEnv,
  type ServiceAccountCredentials,
  type VerifiedFirebaseToken,
} from '../../_utils/firestoreRestAdmin';

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const HOURLY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_SENDS_PER_HOUR_PER_EMAIL = 5;
export const MAX_SENDS_PER_HOUR_PER_IP = 5;

export interface AuthWorkerEnv extends RewardsEnv {
  OTP_HMAC_SECRET?: string;
  EMAIL_VERIFICATION_SECRET?: string;
  INTERNAL_EMAIL_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  APP_URL?: string;
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
    ]);
  } catch {
    // Tables already initialized
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/auth\/?/, '').replace(/\/+$/, '');

  const db: RewardsD1Database = opts.dbOverride || env?.DB || getSharedLocalD1Database();
  await ensureEmailVerificationD1Schema(db);

  const secret = getHmacSecret(env);

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
