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
  DEFAULT_SUPERADMIN_EMAILS,
  DEFAULT_SUPERADMIN_UIDS,
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
  type AuthenticatedD1User,
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
import {
  PENDING_2FA_CHALLENGE_TTL_MS,
  RECOVERY_COOLING_OFF_MS,
  TRUSTED_DEVICE_MAX_AGE_SECONDS,
  TRUSTED_DEVICE_TTL_MS,
  buildOtpAuthUri,
  buildTrustedDeviceCookieHeader,
  decryptTotpSecret,
  encryptTotpSecret,
  extractTrustedDeviceTokenFromRequest,
  generateBackupCodes,
  generateTotpSecretBase32,
  generateTrustedDeviceToken,
  hashBackupCode,
  hashTrustedDeviceToken,
  verifyTotpCode,
} from '../../_utils/twoFactorCrypto';

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
export const MAX_2FA_FAILURES_PER_WINDOW = 5;
export const GENERIC_LOGIN_ERROR = 'Invalid username/email or password';

export type VerificationCodePurpose = 'login' | 'signup' | '2fa_login' | '2fa_recovery';

export interface AuthWorkerEnv extends RewardsEnv {
  OTP_HMAC_SECRET?: string;
  TOTP_ENCRYPTION_KEY?: string;
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
  purpose: string;
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

function getTotpEncryptionKey(env?: AuthWorkerEnv): string {
  const configured = (
    env?.TOTP_ENCRYPTION_KEY ||
    (typeof process !== 'undefined' ? process.env?.TOTP_ENCRYPTION_KEY : '') ||
    ''
  ).trim();
  return configured || getHmacSecret(env);
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
  purpose: string;
  code: string;
}): Promise<string> {
  const { secret, userId, purpose, code } = params;
  const canonicalPurpose = purpose === '2fa_login' ? 'login' : purpose;
  return computeHmacSha256Hex(secret, `otp:v1:${userId}:${canonicalPurpose}:${code}`);
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
      db.prepare(`CREATE TABLE IF NOT EXISTS user_2fa (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        totp_enabled INTEGER NOT NULL DEFAULT 0,
        email_2fa_enabled INTEGER NOT NULL DEFAULT 0,
        encrypted_secret TEXT DEFAULT NULL,
        pending_encrypted_secret TEXT DEFAULT NULL,
        last_used_step INTEGER NOT NULL DEFAULT 0,
        recovery_requested_at INTEGER DEFAULT NULL,
        recovery_disable_at INTEGER DEFAULT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        used_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_user ON user_2fa_backup_codes (user_id, used)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS trusted_devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        user_agent TEXT NOT NULL DEFAULT '',
        ip_hash TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices (user_id, revoked, expires_at)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS pending_2fa_challenges (
        challenge_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        auth_time INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_pending_2fa_challenges_user ON pending_2fa_challenges (user_id, verified, expires_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS security_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        ip_hash TEXT NOT NULL DEFAULT '',
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs (user_id, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS legal_consent_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'registered',
        document_version TEXT NOT NULL,
        action_context TEXT NOT NULL DEFAULT 'signup',
        ip_hash TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        accepted_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_legal_consent_user_version ON legal_consent_records (user_id, document_version, accepted_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS username_history (
        username_lower TEXT PRIMARY KEY,
        username_display TEXT NOT NULL,
        uid TEXT NOT NULL,
        changed_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_username_history_uid ON username_history (uid, expires_at DESC)`),
    ]);
  } catch {
    // Tables already initialized
  }
  // Safe column migrations for existing D1 tables
  const migrations = [
    `ALTER TABLE user_usernames ADD COLUMN email TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE user_usernames ADD COLUMN display_name TEXT DEFAULT ''`,
    `ALTER TABLE user_usernames ADD COLUMN avatar TEXT DEFAULT ''`,
    `ALTER TABLE user_usernames ADD COLUMN frame TEXT DEFAULT NULL`,
    `ALTER TABLE user_usernames ADD COLUMN role TEXT DEFAULT 'student'`,
    `ALTER TABLE user_usernames ADD COLUMN custom_role TEXT DEFAULT NULL`,
    `ALTER TABLE user_usernames ADD COLUMN bio TEXT DEFAULT ''`,
    `ALTER TABLE user_usernames ADD COLUMN status TEXT DEFAULT ''`,
    `ALTER TABLE user_usernames ADD COLUMN accent TEXT DEFAULT ''`,
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

export const AUTH_PROFILE_LAYOUT_IDS = [
  'game-card',
  'clean-social',
  'dark-passport',
  'centered-hero',
  'full-cover',
  'trading-card',
  'retro-pixel',
  'glass',
  'id-badge',
  'loadout-showcase',
] as const;

const AUTH_PROFILE_LAYOUT_SET = new Set<string>(AUTH_PROFILE_LAYOUT_IDS);

export function isValidAuthProfileLayout(val: unknown): boolean {
  return typeof val === 'string' && AUTH_PROFILE_LAYOUT_SET.has(val.trim());
}

export function normalizeAuthProfileLayout(val: unknown): string {
  if (typeof val === 'string' && AUTH_PROFILE_LAYOUT_SET.has(val.trim())) {
    return val.trim();
  }
  return 'game-card';
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
  purpose: string;
  studentName: string;
  fallbackVerifyUrl?: string;
}): { subject: string; html: string; text: string } {
  const { code, purpose, studentName, fallbackVerifyUrl } = params;
  const safeName = escapeHtml(studentName || 'Student');
  const isSignup = purpose === 'signup';
  const isRecovery = purpose === '2fa_recovery';

  const subject = isSignup
    ? 'Verify your Boardly account — 6-digit verification code'
    : isRecovery
    ? 'Boardly 2FA Recovery — 6-digit verification code'
    : 'Your Boardly two-step login code';

  const heading = isSignup
    ? 'Verify your email address'
    : isRecovery
    ? 'Confirm your 2FA recovery request'
    : 'Confirm your sign-in';
  const intro = isSignup
    ? `Welcome to Boardly, ${safeName}. Enter the 6-digit verification code below to activate your account:`
    : isRecovery
    ? `Hi ${safeName}, enter the 6-digit code below to schedule turning off two-step verification after a 24-hour security wait:`
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
    console.error('[Auth OTP Resend Error] Missing RESEND_API_KEY in Worker environment.');
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

    const rawText = await res.text().catch(() => '');
    let parsedBody: { id?: string; message?: string; name?: string } = {};
    try {
      parsedBody = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsedBody = {};
    }

    if (!res.ok) {
      console.error(
        `[Auth OTP Resend Error] HTTP ${res.status} (${payload.purpose || 'otp'}):`,
        rawText.slice(0, 500)
      );
      const detail = parsedBody.message ? ` (${parsedBody.message})` : '';
      return {
        ok: false,
        error: `Could not send verification email right now${detail}. Please try again shortly.`,
      };
    }

    console.info(
      `[Auth OTP Resend Success] HTTP ${res.status} id=${parsedBody?.id || 'sent'} purpose=${payload.purpose || 'otp'}`
    );
    return { ok: true, id: parsedBody?.id || 'sent' };
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

  // 2b. Check 14-day hold in `username_history`
  try {
    const heldRow = await db
      .prepare(
        'SELECT username_lower, uid, expires_at FROM username_history WHERE username_lower = ?1 AND expires_at > ?2 LIMIT 1'
      )
      .bind(normalized, Date.now())
      .first<{ username_lower: string; uid: string; expires_at: number }>();
    if (heldRow && (!excludeUid || heldRow.uid !== excludeUid)) {
      return {
        available: false,
        clean,
        normalized,
        reason: 'This username was recently changed and is reserved during its 14-day hold period.',
        code: 'USERNAME_TAKEN',
      };
    }
  } catch {
    // Non-fatal if table does not exist yet
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
  passwordVerifierOverride?: (email: string, password: string) => Promise<boolean>;
  nowMsOverride?: number;
}

function buildSecurityAlertEmailContent(params: {
  studentName: string;
  title: string;
  message: string;
  eventType: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(params.studentName || 'Student');
  const safeTitle = escapeHtml(params.title);
  const safeMsg = escapeHtml(params.message);
  const subject = `Boardly Security Alert — ${params.title}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background-color:#060607;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background-color:#111114;border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:32px 24px;">
    <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;color:#f4f4f5;margin-bottom:20px;">BOARDLY<span style="color:#e11d2e;">.</span></div>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f4f4f5;">${safeTitle}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#9a9aa3;">Hi ${safeName},</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#e4e4e7;">${safeMsg}</p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#9a9aa3;">If you did not make this change, please review your security settings on Boardly immediately.</p>
  </div>
</body>
</html>`;
  const text = `${params.title}\n\nHi ${params.studentName || 'Student'},\n\n${params.message}\n\nIf you did not make this change, please review your security settings on Boardly immediately.`;
  return { subject, html, text };
}

async function logSecurityAuditEvent(params: {
  db: RewardsD1Database;
  userId: string;
  actorId?: string;
  eventType: string;
  ipHash?: string;
  details?: Record<string, unknown>;
  nowMs: number;
}): Promise<void> {
  const { db, userId, actorId = userId, eventType, ipHash = '', details = {}, nowMs } = params;
  const id = `sal_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
  try {
    await db
      .prepare(
        `INSERT INTO security_audit_logs (id, user_id, actor_id, event_type, ip_hash, details_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
      .bind(id, userId, actorId, eventType, ipHash, JSON.stringify(details), nowMs)
      .run();
  } catch {
    // Non-fatal
  }
}

async function sendSecurityNotificationEmail(params: {
  to: string;
  userId: string;
  studentName: string;
  title: string;
  message: string;
  eventType: string;
  env?: AuthWorkerEnv;
  senderOverride?: EmailSenderFn;
}): Promise<void> {
  const { to, userId, studentName, title, message, eventType, env, senderOverride } = params;
  if (!to || !to.includes('@')) return;
  const fromAddress = (
    env?.EMAIL_FROM ||
    (typeof process !== 'undefined' ? process.env?.EMAIL_FROM : '') ||
    'Boardly <no-reply@boardly.cfd>'
  ).trim();
  const content = buildSecurityAlertEmailContent({ studentName, title, message, eventType });
  const senderFn = senderOverride || defaultResendEmailSender;
  try {
    await senderFn(
      {
        to,
        from: fromAddress,
        subject: content.subject,
        html: content.html,
        text: content.text,
        purpose: eventType,
        userId,
      },
      env
    );
  } catch {
    // Non-fatal
  }
}

async function verifyUserCurrentPasswordOrFreshGoogle(params: {
  verifiedToken: VerifiedFirebaseToken;
  email: string;
  password?: string;
  env?: AuthWorkerEnv;
  passwordVerifierOverride?: (email: string, password: string) => Promise<boolean>;
  nowMs: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { verifiedToken, email, password, env, passwordVerifierOverride, nowMs } = params;
  const rawPassword = String(password || '');

  // If password is provided, verify it first
  if (rawPassword.length > 0) {
    if (passwordVerifierOverride) {
      const valid = await passwordVerifierOverride(email, rawPassword);
      return valid
        ? { ok: true }
        : { ok: false, error: 'Current password is incorrect.' };
    }
    const firebaseApiKey = (
      env?.FIREBASE_API_KEY ||
      env?.VITE_FIREBASE_API_KEY ||
      (typeof process !== 'undefined'
        ? process.env?.FIREBASE_API_KEY || process.env?.VITE_FIREBASE_API_KEY
        : '') ||
      TARGET_API_KEY
    ).trim();
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: rawPassword,
            returnSecureToken: true,
          }),
        }
      );
      if (res.ok) {
        return { ok: true };
      }
      return { ok: false, error: 'Current password is incorrect.' };
    } catch {
      return { ok: false, error: 'Could not verify password right now. Please try again.' };
    }
  }

  // If no password provided, allow only if signed in via Google within the last 5 minutes
  if (verifiedToken.signInProvider === 'google.com') {
    const authTimeSec = Number(verifiedToken.authTime || verifiedToken.iat || 0);
    const nowSec = Math.floor(nowMs / 1000);
    if (authTimeSec > 0 && nowSec - authTimeSec <= 300) {
      return { ok: true };
    }
    return {
      ok: false,
      error: 'Please re-authenticate with Google (or enter your account password) to change security settings.',
    };
  }

  return { ok: false, error: 'Current password is required.' };
}

export const ADMIN_2FA_ALLOWED_ROLES = ['superadmin'] as const;

export type TwoFactorBadgeLabel =
  | 'Off'
  | 'Authenticator'
  | 'Email code'
  | 'Both'
  | 'Recovery pending';

export interface UserTwoFactorStatusSummary {
  userId: string;
  totpEnabled: boolean;
  email2faEnabled: boolean;
  twoFactorEnabled: boolean;
  recoveryPending: boolean;
  recoveryRequestedAt: number | null;
  recoveryDisableAt: number | null;
  backupCodesRemaining: number;
  remainingBackupCodes: number;
  trustedDevicesCount: number;
  lastChangedAt: number | null;
  updatedAt: number | null;
  badgeLabel: TwoFactorBadgeLabel;
}

/**
 * Single server-side source of truth for a user's two-step verification status from Cloudflare D1 by user ID.
 * Used across:
 *   1. Admin users list (`GET /api/auth/admin/2fa-status`)
 *   2. Admin user profile Security section (`GET /api/auth/admin/2fa-status?uid=...`)
 *   3. User's own Security settings page (`GET /api/auth/2fa/status`)
 *   4. Auth session verification status (`GET /api/auth/verification-status`)
 *
 * Strictly NEVER queries or returns `encrypted_secret`, `pending_encrypted_secret`, `code_hash`, or `token_hash`.
 */
export interface RawUser2faStatusRow {
  user_id: string;
  email?: string;
  totp_enabled: number;
  email_2fa_enabled: number;
  recovery_requested_at: number | null;
  recovery_disable_at: number | null;
  updated_at: number;
  created_at: number;
}

/**
 * Shared server-side 2FA status calculator used by BOTH the Admin Users list endpoint
 * and the single-user profile drawer endpoint.
 * Strictly NEVER accepts or returns `encrypted_secret`, `pending_encrypted_secret`, `code_hash`, or `token_hash`.
 */
export function computeUserTwoFactorStatusSummary(params: {
  userId: string;
  twoFaRow: RawUser2faStatusRow | null;
  backupCodesRemaining: number;
  trustedDevicesCount: number;
  nowMs?: number;
}): UserTwoFactorStatusSummary {
  const cleanUid = String(params.userId || '').trim();
  const nowMs = params.nowMs ?? Date.now();
  const twoFaRow = params.twoFaRow;

  if (!cleanUid) {
    return {
      userId: '',
      totpEnabled: false,
      email2faEnabled: false,
      twoFactorEnabled: false,
      recoveryPending: false,
      recoveryRequestedAt: null,
      recoveryDisableAt: null,
      backupCodesRemaining: 0,
      remainingBackupCodes: 0,
      trustedDevicesCount: 0,
      lastChangedAt: null,
      updatedAt: null,
      badgeLabel: 'Off',
    };
  }

  const totpEnabled = Boolean(twoFaRow && Number(twoFaRow.totp_enabled) === 1);
  const email2faEnabled = Boolean(twoFaRow && Number(twoFaRow.email_2fa_enabled) === 1);
  const twoFactorEnabled = totpEnabled || email2faEnabled;

  const rawRecoveryDisableAt =
    twoFaRow?.recovery_disable_at && Number(twoFaRow.recovery_disable_at) > nowMs
      ? Number(twoFaRow.recovery_disable_at)
      : null;
  const rawRecoveryRequestedAt =
    rawRecoveryDisableAt &&
    twoFaRow?.recovery_requested_at &&
    Number(twoFaRow.recovery_requested_at) > 0
      ? Number(twoFaRow.recovery_requested_at)
      : null;
  const recoveryPending = Boolean(rawRecoveryDisableAt && twoFactorEnabled);

  const backupCodesRemaining = Math.max(0, Number(params.backupCodesRemaining || 0));
  const trustedDevicesCount = Math.max(0, Number(params.trustedDevicesCount || 0));
  const lastChangedAt =
    twoFaRow?.updated_at && Number(twoFaRow.updated_at) > 0 ? Number(twoFaRow.updated_at) : null;

  let badgeLabel: TwoFactorBadgeLabel = 'Off';
  if (recoveryPending) {
    badgeLabel = 'Recovery pending';
  } else if (totpEnabled && email2faEnabled) {
    badgeLabel = 'Both';
  } else if (totpEnabled) {
    badgeLabel = 'Authenticator';
  } else if (email2faEnabled) {
    badgeLabel = 'Email code';
  }

  return {
    userId: cleanUid,
    totpEnabled,
    email2faEnabled,
    twoFactorEnabled,
    recoveryPending,
    recoveryRequestedAt: rawRecoveryRequestedAt,
    recoveryDisableAt: rawRecoveryDisableAt,
    backupCodesRemaining,
    remainingBackupCodes: backupCodesRemaining,
    trustedDevicesCount,
    lastChangedAt,
    updatedAt: lastChangedAt,
    badgeLabel,
  };
}

export async function getUserTwoFactorStatusFromD1(
  db: RewardsD1Database,
  userId: string,
  nowMs = Date.now()
): Promise<UserTwoFactorStatusSummary> {
  const cleanUid = String(userId || '').trim();
  if (!cleanUid) {
    return computeUserTwoFactorStatusSummary({
      userId: '',
      twoFaRow: null,
      backupCodesRemaining: 0,
      trustedDevicesCount: 0,
      nowMs,
    });
  }

  let twoFaRow = await db
    .prepare(
      'SELECT user_id, totp_enabled, email_2fa_enabled, recovery_requested_at, recovery_disable_at, updated_at, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
    )
    .bind(cleanUid)
    .first<RawUser2faStatusRow>()
    .catch(() => null);

  // Auto-complete 24-hour self-recovery if the cooling-off window has elapsed
  if (
    twoFaRow &&
    twoFaRow.recovery_disable_at != null &&
    Number(twoFaRow.recovery_disable_at) > 0 &&
    nowMs >= Number(twoFaRow.recovery_disable_at)
  ) {
    try {
      await db.batch([
        db
          .prepare(
            'UPDATE user_2fa SET totp_enabled = 0, email_2fa_enabled = 0, encrypted_secret = NULL, pending_encrypted_secret = NULL, recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
          )
          .bind(nowMs, cleanUid),
        db
          .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
          .bind(cleanUid),
        db
          .prepare('DELETE FROM pending_2fa_challenges WHERE user_id = ?1')
          .bind(cleanUid),
      ]);
      await logSecurityAuditEvent({
        db,
        userId: cleanUid,
        eventType: '2fa_recovery_completed',
        details: { reason: '24h_cooling_off_elapsed' },
        nowMs,
      });
    } catch {
      // Non-fatal
    }
    twoFaRow = {
      ...twoFaRow,
      totp_enabled: 0,
      email_2fa_enabled: 0,
      recovery_requested_at: null,
      recovery_disable_at: null,
      updated_at: nowMs,
    };
  }

  const [backupCountRow, trustedCountRow] = await Promise.all([
    db
      .prepare('SELECT COUNT(*) as cnt FROM user_2fa_backup_codes WHERE user_id = ?1 AND used = 0')
      .bind(cleanUid)
      .first<{ cnt: number }>()
      .catch(() => null),
    db
      .prepare(
        'SELECT COUNT(*) as cnt FROM trusted_devices WHERE user_id = ?1 AND revoked = 0 AND expires_at > ?2'
      )
      .bind(cleanUid, nowMs)
      .first<{ cnt: number }>()
      .catch(() => null),
  ]);

  return computeUserTwoFactorStatusSummary({
    userId: cleanUid,
    twoFaRow,
    backupCodesRemaining: Number(backupCountRow?.cnt || 0),
    trustedDevicesCount: Number(trustedCountRow?.cnt || 0),
    nowMs,
  });
}

/**
 * Batched 2FA status resolver for the Admin Users list.
 * Runs 3 parallel aggregate queries instead of 3*N sequential queries,
 * and computes every user's status via `computeUserTwoFactorStatusSummary`.
 */
export async function getBatchUsersTwoFactorStatusFromD1(
  db: RewardsD1Database,
  requestedUids: string[],
  nowMs = Date.now()
): Promise<Record<string, UserTwoFactorStatusSummary>> {
  const [all2faRes, backupCountsRes, trustedCountsRes] = await Promise.all([
    db
      .prepare(
        'SELECT user_id, totp_enabled, email_2fa_enabled, recovery_requested_at, recovery_disable_at, updated_at, created_at FROM user_2fa'
      )
      .all<RawUser2faStatusRow>()
      .catch(() => ({ results: [] as RawUser2faStatusRow[] })),
    db
      .prepare(
        'SELECT user_id, COUNT(*) as cnt FROM user_2fa_backup_codes WHERE used = 0 GROUP BY user_id'
      )
      .all<{ user_id: string; cnt: number }>()
      .catch(() => ({ results: [] as { user_id: string; cnt: number }[] })),
    db
      .prepare(
        'SELECT user_id, COUNT(*) as cnt FROM trusted_devices WHERE revoked = 0 AND expires_at > ?1 GROUP BY user_id'
      )
      .bind(nowMs)
      .all<{ user_id: string; cnt: number }>()
      .catch(() => ({ results: [] as { user_id: string; cnt: number }[] })),
  ]);

  const rowByUid = new Map<string, RawUser2faStatusRow>();
  const expiredRecoveryUids: string[] = [];

  for (const row of all2faRes.results || []) {
    const uid = String(row.user_id || '').trim();
    if (!uid) continue;
    if (
      row.recovery_disable_at != null &&
      Number(row.recovery_disable_at) > 0 &&
      nowMs >= Number(row.recovery_disable_at)
    ) {
      expiredRecoveryUids.push(uid);
      rowByUid.set(uid, {
        ...row,
        totp_enabled: 0,
        email_2fa_enabled: 0,
        recovery_requested_at: null,
        recovery_disable_at: null,
        updated_at: nowMs,
      });
    } else {
      rowByUid.set(uid, row);
    }
  }

  if (expiredRecoveryUids.length > 0) {
    for (const uid of expiredRecoveryUids) {
      try {
        await db.batch([
          db
            .prepare(
              'UPDATE user_2fa SET totp_enabled = 0, email_2fa_enabled = 0, encrypted_secret = NULL, pending_encrypted_secret = NULL, recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
            )
            .bind(nowMs, uid),
          db
            .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
            .bind(uid),
          db
            .prepare('DELETE FROM pending_2fa_challenges WHERE user_id = ?1')
            .bind(uid),
        ]);
      } catch {
        // Non-fatal
      }
    }
  }

  const backupMap = new Map<string, number>();
  for (const b of backupCountsRes.results || []) {
    if (b.user_id) backupMap.set(String(b.user_id), Number(b.cnt || 0));
  }

  const trustedMap = new Map<string, number>();
  for (const t of trustedCountsRes.results || []) {
    if (t.user_id) trustedMap.set(String(t.user_id), Number(t.cnt || 0));
  }

  const allUids = new Set<string>(rowByUid.keys());
  for (const rawUid of requestedUids) {
    const clean = String(rawUid || '').trim();
    if (clean) allUids.add(clean);
  }

  const statusByUid: Record<string, UserTwoFactorStatusSummary> = {};
  for (const uid of allUids) {
    statusByUid[uid] = computeUserTwoFactorStatusSummary({
      userId: uid,
      twoFaRow: rowByUid.get(uid) || null,
      backupCodesRemaining: backupMap.get(uid) || 0,
      trustedDevicesCount: trustedMap.get(uid) || 0,
      nowMs,
    });
  }

  return statusByUid;
}

function canCallerManageOthers2fa(
  caller: AuthenticatedD1User | null,
  env?: AuthWorkerEnv
): boolean {
  if (!caller || !caller.sessionVerified) return false;
  const rawAllowed = String((env as Record<string, any> | undefined)?.ADMIN_2FA_ALLOWED_ROLES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allowedRoles = new Set<string>(
    rawAllowed.length > 0 ? rawAllowed : ADMIN_2FA_ALLOWED_ROLES
  );
  if (caller.isSuperAdmin && allowedRoles.has('superadmin')) {
    return true;
  }
  return allowedRoles.has(String(caller.role || '').toLowerCase());
}

async function isTargetAccountSuperAdmin(params: {
  db: RewardsD1Database;
  targetUid: string;
  targetEmail?: string;
  env?: AuthWorkerEnv;
}): Promise<boolean> {
  const { db, targetUid, env } = params;
  const cleanUid = String(targetUid || '').trim();
  if (!cleanUid) return false;

  const superUids = new Set(
    (env?.SUPERADMIN_UIDS || DEFAULT_SUPERADMIN_UIDS.join(','))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  if (superUids.has(cleanUid) || /^(?:sa1|sa2)_/i.test(cleanUid)) {
    return true;
  }

  const [roleRow, unameRow] = await Promise.all([
    db
      .prepare('SELECT uid, role FROM user_roles WHERE uid = ?1 LIMIT 1')
      .bind(cleanUid)
      .first<{ uid: string; role?: string }>()
      .catch(() => null),
    db
      .prepare('SELECT uid, role FROM user_usernames WHERE uid = ?1 LIMIT 1')
      .bind(cleanUid)
      .first<{ uid: string; role?: string }>()
      .catch(() => null),
  ]);

  if (roleRow && String(roleRow.role || '').toLowerCase() === 'superadmin') return true;
  if (unameRow && String(unameRow.role || '').toLowerCase() === 'superadmin') return true;

  return false;
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
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Guest-Session, X-Device-Id, X-Trusted-Device',
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

    // Check if the registered user has a canonical username & profile_layout in `user_usernames` and load 2FA status in parallel
    const [usernameRow, twoFactorStatus] = await Promise.all([
      db
        .prepare(
          'SELECT username_lower, username_display, email, profile_layout, custom_role FROM user_usernames WHERE uid = ?1 LIMIT 1'
        )
        .bind(resolved.uid)
        .first<{
          username_lower: string;
          username_display: string;
          email?: string;
          profile_layout?: string;
          custom_role?: string;
        }>()
        .catch(() => null),
      getUserTwoFactorStatusFromD1(db, resolved.uid, nowMs).catch(() => null),
    ]);

    if (usernameRow && !usernameRow.email && resolved.email) {
      await db
        .prepare('UPDATE user_usernames SET email = ?1, updated_at = ?2 WHERE uid = ?3')
        .bind(resolved.email.toLowerCase(), nowMs, resolved.uid)
        .run()
        .catch(() => {});
    }

    const resolvedProfileLayout = normalizeAuthProfileLayout(usernameRow?.profile_layout);
    const enrichedTwoFactorStatus = twoFactorStatus
      ? {
          ...twoFactorStatus,
          emailCodeEnabled: Boolean(twoFactorStatus.email2faEnabled),
          rememberedDevices: Number(twoFactorStatus.trustedDevicesCount || 0),
        }
      : null;

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
      customRole: usernameRow?.custom_role || resolved.customRole,
      emailVerified: resolved.emailVerified,
      sessionVerified: resolved.sessionVerified,
      profileLayout: resolvedProfileLayout,
      profile_layout: resolvedProfileLayout,
      twoFactorStatus: enrichedTwoFactorStatus,
    };

    return jsonResponse(
      {
        ok: true,
        authenticated: true,
        accountType: 'registered',
        hasRegisteredUsername: Boolean(usernameRow?.username_display),
        user: regPayload,
        twoFactorStatus: enrichedTwoFactorStatus,
        profileLayout: resolvedProfileLayout,
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

    // If this is a registered user with 2FA enabled, block username changes when 2FA session is unverified
    if (accountType === 'registered' && verifiedToken) {
      const twoFaRow = await db
        .prepare('SELECT totp_enabled, email_2fa_enabled FROM user_2fa WHERE user_id = ?1 LIMIT 1')
        .bind(verifiedToken.uid)
        .first<{ totp_enabled: number; email_2fa_enabled: number }>()
        .catch(() => null);
      const has2fa = Boolean(
        twoFaRow && (Number(twoFaRow.totp_enabled) === 1 || Number(twoFaRow.email_2fa_enabled) === 1)
      );
      if (has2fa) {
        const verifiedSess = await isD1UserSessionVerified(db, verifiedToken, {
          request,
          hmacSecret: secret,
          nowMs,
        });
        if (!verifiedSess) {
          return jsonResponse(
            {
              ok: false,
              error: 'Two-step verification required before modifying account settings.',
              code: 'TWO_FACTOR_REQUIRED',
            },
            403
          );
        }
      }
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
      .prepare(
        'SELECT username_lower, username_display, uid, email, display_name, avatar, frame, role, custom_role, bio, status, accent FROM user_usernames WHERE uid = ?1 LIMIT 1'
      )
      .bind(targetUid)
      .first<{
        username_lower: string;
        username_display?: string;
        uid: string;
        email?: string;
        display_name?: string;
        avatar?: string;
        frame?: string | null;
        role?: string;
        custom_role?: string | null;
        bio?: string;
        status?: string;
        accent?: string;
      }>();

    const emailToStore = resolvedEmail || String(prevRow?.email || '').trim().toLowerCase();
    const holdDurationMs = 14 * 24 * 60 * 60 * 1000; // 14-day hold for old username redirect

    try {
      if (prevRow && prevRow.username_lower === availability.normalized) {
        await db
          .prepare(
            'UPDATE user_usernames SET uid = ?1, account_type = ?2, email = ?3, updated_at = ?4 WHERE username_lower = ?5'
          )
          .bind(targetUid, accountType, emailToStore, nowMs, availability.normalized)
          .run();
      } else {
        if (prevRow && prevRow.username_lower && prevRow.username_lower !== availability.normalized) {
          // Record old username in 14-day hold history so /u/:oldUsername redirects to the user's current profile
          try {
            await db
              .prepare(
                `INSERT OR REPLACE INTO username_history (username_lower, username_display, uid, changed_at, expires_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)`
              )
              .bind(
                prevRow.username_lower,
                prevRow.username_display || prevRow.username_lower,
                targetUid,
                nowMs,
                nowMs + holdDurationMs
              )
              .run();
          } catch {
            // Non-fatal
          }
          // Delete old username row for this uid before inserting new primary key
          await db
            .prepare('DELETE FROM user_usernames WHERE username_lower = ?1 AND uid = ?2')
            .bind(prevRow.username_lower, targetUid)
            .run();
        }

        // If the user is reclaiming their own held username, remove it from username_history
        try {
          await db
            .prepare('DELETE FROM username_history WHERE username_lower = ?1')
            .bind(availability.normalized)
            .run();
        } catch {
          // Non-fatal
        }

        await db
          .prepare(
            `INSERT OR REPLACE INTO user_usernames (username_lower, username_display, uid, account_type, email, created_at, updated_at)
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

        // Preserve live profile fields if the user already had them on their previous username row
        if (prevRow && (prevRow.display_name || prevRow.avatar || prevRow.frame || prevRow.role)) {
          try {
            await db
              .prepare(
                `UPDATE user_usernames
                 SET display_name = ?1, avatar = ?2, frame = ?3, role = ?4, custom_role = ?5, bio = ?6, status = ?7, accent = ?8, updated_at = ?9
                 WHERE uid = ?10`
              )
              .bind(
                prevRow.display_name || '',
                prevRow.avatar || '',
                prevRow.frame ?? null,
                prevRow.role || 'student',
                prevRow.custom_role ?? null,
                prevRow.bio || '',
                prevRow.status || '',
                prevRow.accent || '',
                nowMs,
                targetUid
              )
              .run();
          } catch {
            // Non-fatal
          }
        }
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

    // Sync username to Firestore `users/{targetUid}` and `publicProfiles/{targetUid}` if service account is available
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
        await Promise.all([
          store.setDoc(
            `users/${targetUid}`,
            {
              username: availability.clean,
              usernameLower: availability.normalized,
            },
            true
          ),
          store.setDoc(
            `publicProfiles/${targetUid}`,
            {
              username: availability.clean,
              usernameLower: availability.normalized,
            },
            true
          ),
        ]);
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
      previousUsername: prevRow?.username_lower && prevRow.username_lower !== availability.normalized ? prevRow.username_lower : null,
    });
  }

  // ─── G1b. POST /api/auth/profile-sync (Sync Live Display Name, Avatar, Bio, Frame to D1) ───
  if (subPath === 'profile-sync' && request.method === 'POST') {
    let body: {
      uid?: string;
      displayName?: string;
      nickname?: string;
      name?: string;
      username?: string;
      avatar?: string | null;
      equippedAvatar?: string | null;
      photoURL?: string | null;
      frame?: string | null;
      role?: string;
      customRole?: string | null;
      bio?: string;
      status?: string;
      accent?: string;
      email?: string;
      profile_layout?: string;
      profileLayout?: string;
      layout?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
    }

    const caller = await resolveCurrentUser({
      request,
      env,
      db,
      tokenVerifierOverride: opts.tokenVerifierOverride,
    }).catch(() => null);

    const isCallerSuperAdmin = Boolean(caller && (caller.isSuperAdmin || caller.role === 'superadmin'));
    let targetUid = String(body.uid || '').trim();
    let resolvedEmail = String(body.email || '').trim().toLowerCase();

    if (caller) {
      if (!isCallerSuperAdmin || !targetUid) {
        targetUid = caller.uid;
      }
      if (caller.email && targetUid === caller.uid) {
        resolvedEmail = caller.email.toLowerCase();
      }
    }
    if (!targetUid) {
      return jsonResponse({ ok: false, error: 'Missing user uid.' }, 400);
    }

    const rawLayoutInput = body.profile_layout ?? body.profileLayout ?? body.layout;
    if (rawLayoutInput !== undefined && !isValidAuthProfileLayout(rawLayoutInput)) {
      return jsonResponse(
        { ok: false, error: 'Invalid profile layout.', code: 'INVALID_PROFILE_LAYOUT' },
        400
      );
    }

    // Strict whitelist: only display_name, avatar, frame, bio, status, accent, and profile_layout may be written by normal users.
    // Only an authenticated real superadmin can write role or custom_role.
    const displayName = String(body.displayName ?? body.nickname ?? body.name ?? '').trim();
    const hasAvatarProp =
      body.avatar !== undefined || body.equippedAvatar !== undefined || body.photoURL !== undefined;
    const avatarVal = String(body.avatar ?? body.equippedAvatar ?? body.photoURL ?? '').trim();
    const frame = body.frame !== undefined ? (body.frame ? String(body.frame).trim() : null) : undefined;
    const bio = body.bio !== undefined ? String(body.bio) : undefined;
    const statusText = body.status !== undefined ? String(body.status) : undefined;
    const accent = body.accent !== undefined ? String(body.accent) : undefined;
    const rawUsername = String(body.username || '').trim();

    const requestedRole = isCallerSuperAdmin && body.role ? String(body.role).trim() : '';
    const requestedCustomRole =
      isCallerSuperAdmin && body.customRole !== undefined
        ? body.customRole
          ? String(body.customRole).trim()
          : null
        : undefined;

    const existingRow = await db
      .prepare(
        'SELECT username_lower, username_display, uid, account_type, email, display_name, avatar, frame, role, custom_role, bio, status, accent, profile_layout FROM user_usernames WHERE uid = ?1 LIMIT 1'
      )
      .bind(targetUid)
      .first<{
        username_lower: string;
        username_display: string;
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
      }>();

    let fallbackUsernameDisplay = existingRow?.username_display || '';
    let fallbackUsernameLower = existingRow?.username_lower || '';

    if (!existingRow) {
      const cleanU = (
        rawUsername.replace(/^@+/, '') ||
        `user_${targetUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`
      ).trim();
      const lowerU = cleanU.toLowerCase();
      fallbackUsernameDisplay = cleanU;
      fallbackUsernameLower = lowerU;
      try {
        await db
          .prepare(
            `INSERT OR IGNORE INTO user_usernames (username_lower, username_display, uid, account_type, email, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
          )
          .bind(
            lowerU,
            cleanU,
            targetUid,
            targetUid.startsWith('guest_') ? 'guest' : 'registered',
            resolvedEmail,
            nowMs,
            nowMs
          )
          .run();
      } catch {
        // Ignore if username taken
      }
    }

    const superUids = new Set(
      (env?.SUPERADMIN_UIDS || DEFAULT_SUPERADMIN_UIDS.join(','))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const roleRow = await db
      .prepare('SELECT role, custom_role FROM user_roles WHERE uid = ?1 LIMIT 1')
      .bind(targetUid)
      .first<{ role?: string; custom_role?: string | null }>()
      .catch(() => null);

    const trustedExistingRole = superUids.has(targetUid)
      ? 'superadmin'
      : roleRow?.role || existingRow?.role || 'student';

    const nextDisplayName = displayName || existingRow?.display_name || '';
    const nextAvatar = hasAvatarProp ? avatarVal : (existingRow?.avatar || '');
    const nextFrame = frame !== undefined ? frame : (existingRow?.frame ?? null);
    const nextRole = requestedRole || trustedExistingRole;
    const nextCustomRole =
      requestedCustomRole !== undefined
        ? requestedCustomRole
        : (roleRow?.custom_role ?? existingRow?.custom_role ?? null);
    const nextBio = bio !== undefined ? bio : (existingRow?.bio ?? '');
    const nextStatus = statusText !== undefined ? statusText : (existingRow?.status ?? '');
    const nextAccent = accent !== undefined ? accent : (existingRow?.accent ?? '');
    const nextProfileLayout =
      rawLayoutInput !== undefined
        ? normalizeAuthProfileLayout(rawLayoutInput)
        : normalizeAuthProfileLayout(existingRow?.profile_layout);

    await db
      .prepare(
        `UPDATE user_usernames
         SET display_name = ?1, avatar = ?2, frame = ?3, role = ?4, custom_role = ?5, bio = ?6, status = ?7, accent = ?8, profile_layout = ?9, updated_at = ?10
         WHERE uid = ?11`
      )
      .bind(
        nextDisplayName,
        nextAvatar,
        nextFrame,
        nextRole,
        nextCustomRole,
        nextBio,
        nextStatus,
        nextAccent,
        nextProfileLayout,
        nowMs,
        targetUid
      )
      .run();

    return jsonResponse({
      ok: true,
      profile: {
        uid: targetUid,
        username: fallbackUsernameDisplay,
        usernameLower: fallbackUsernameLower,
        displayName: nextDisplayName,
        avatar: nextAvatar,
        frame: nextFrame,
        role: nextRole,
        customRole: nextCustomRole,
        bio: nextBio,
        status: nextStatus,
        accent: nextAccent,
        profile_layout: nextProfileLayout,
        profileLayout: nextProfileLayout,
        updatedAt: nowMs,
      },
    });
  }

  // ─── G1b2. POST/PUT/GET /api/auth/profile-layout (Save & Read Profile Layout by Session UID) ───
  if (
    subPath === 'profile-layout' &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'GET')
  ) {
    try {
      const targetDb = opts.dbOverride || env?.DB || db;
      if (!targetDb) {
        return jsonResponse(
          { ok: false, error: 'Database binding (env.DB) is not available.' },
          500
        );
      }

      const caller = await resolveCurrentUser({
        request,
        env,
        db: targetDb,
        tokenVerifierOverride: opts.tokenVerifierOverride,
      }).catch((authErr) => {
        console.error('[AuthWorker] profile-layout session check error:', authErr);
        return null;
      });

      if (request.method === 'GET') {
        const targetUid = String(url.searchParams.get('uid') || caller?.uid || '').trim();
        if (!targetUid) {
          return jsonResponse({ ok: false, error: 'Missing uid.', code: 'MISSING_UID' }, 400);
        }
        const row = await targetDb
          .prepare('SELECT profile_layout FROM user_usernames WHERE uid = ? LIMIT 1')
          .bind(targetUid)
          .first<{ profile_layout?: string }>()
          .catch(() => null);
        const resolvedLayout = normalizeAuthProfileLayout(row?.profile_layout);
        return jsonResponse({
          ok: true,
          uid: targetUid,
          layout: resolvedLayout,
          profile_layout: resolvedLayout,
          profileLayout: resolvedLayout,
        });
      }

      const sessionUid =
        caller && typeof caller.uid === 'string' && caller.uid.trim().length > 0
          ? caller.uid.trim()
          : null;

      if (!sessionUid) {
        return jsonResponse(
          { ok: false, error: 'Authentication required. Please sign in again.', code: 'UNAUTHENTICATED' },
          401
        );
      }

      let body: {
        layout?: unknown;
        profile_layout?: unknown;
        profileLayout?: unknown;
      } = {};
      try {
        body = (await request.json()) as typeof body;
      } catch (parseErr) {
        console.error('[AuthWorker] profile-layout invalid JSON:', parseErr);
        return jsonResponse({ ok: false, error: 'Invalid JSON body.', code: 'INVALID_JSON' }, 400);
      }

      const rawLayout = body?.layout ?? body?.profile_layout ?? body?.profileLayout;
      const candidateLayout = typeof rawLayout === 'string' ? rawLayout.trim() : '';
      const ALLOWED_LAYOUTS = [
        'game-card',
        'clean-social',
        'dark-passport',
        'centered-hero',
        'full-cover',
        'trading-card',
        'retro-pixel',
        'glass',
        'id-badge',
        'loadout-showcase',
      ];

      if (!candidateLayout || !ALLOWED_LAYOUTS.includes(candidateLayout)) {
        return jsonResponse(
          {
            ok: false,
            error: `Invalid layout id "${candidateLayout || String(rawLayout ?? '')}". Must be one of: ${ALLOWED_LAYOUTS.join(', ')}.`,
            code: 'INVALID_PROFILE_LAYOUT',
          },
          400
        );
      }

      const updatedAt = Math.floor(Date.now());

      await targetDb
        .prepare('UPDATE user_usernames SET profile_layout = ?, updated_at = ? WHERE uid = ?')
        .bind(candidateLayout, updatedAt, sessionUid)
        .run();

      return jsonResponse({
        ok: true,
        layout: candidateLayout,
        profile_layout: candidateLayout,
        profileLayout: candidateLayout,
        uid: sessionUid,
        updatedAt,
      });
    } catch (err: any) {
      console.error('[AuthWorker] /api/auth/profile-layout error:', err);
      const errMsg =
        err instanceof Error && err.message
          ? err.message
          : typeof err === 'string' && err
          ? err
          : 'Internal server error while saving profile layout.';
      return jsonResponse({ ok: false, error: errMsg }, 500);
    }
  }

  // ─── G1c. GET /api/auth/resolve-profiles (Batched Live Author & 14-Day Hold Username Lookup) ───
  if (subPath === 'resolve-profiles' && request.method === 'GET') {
    const { resolveProBadgesBatch } = await import('../pro-badge');
    const queryUsername = (url.searchParams.get('username') || '').trim().replace(/^@+/, '').toLowerCase();
    const rawUids = (url.searchParams.get('uids') || '').trim();

    if (queryUsername) {
      // 1. Check active user_usernames
      const activeRow = await db
        .prepare(
          'SELECT username_lower, username_display, uid, account_type, display_name, avatar, frame, role, custom_role, bio, status, accent, profile_layout, updated_at FROM user_usernames WHERE username_lower = ?1 LIMIT 1'
        )
        .bind(queryUsername)
        .first<any>();

      if (activeRow && activeRow.uid) {
        const badgeMap = await resolveProBadgesBatch([activeRow.uid], db, env, nowMs);
        const resolvedLayout = normalizeAuthProfileLayout(activeRow.profile_layout);
        return jsonResponse({
          ok: true,
          found: true,
          redirectedFromOldUsername: false,
          uid: activeRow.uid,
          currentUsername: activeRow.username_display || activeRow.username_lower,
          profile: {
            uid: activeRow.uid,
            username: activeRow.username_display || activeRow.username_lower,
            displayName: activeRow.display_name || activeRow.username_display || activeRow.username_lower,
            avatar: activeRow.avatar || '',
            frame: activeRow.frame || null,
            role: activeRow.role || 'student',
            customRole: activeRow.custom_role || null,
            bio: activeRow.bio || '',
            status: activeRow.status || '',
            accent: activeRow.accent || '',
            profile_layout: resolvedLayout,
            profileLayout: resolvedLayout,
            proBadge: badgeMap.get(String(activeRow.uid)) ?? null,
          },
        });
      }

      // 2. Check guest_accounts
      const guestRow = await db
        .prepare('SELECT uid, username, username_lower, display_name, role FROM guest_accounts WHERE username_lower = ?1 LIMIT 1')
        .bind(queryUsername)
        .first<any>();
      if (guestRow && guestRow.uid) {
        return jsonResponse({
          ok: true,
          found: true,
          redirectedFromOldUsername: false,
          uid: guestRow.uid,
          currentUsername: guestRow.username || guestRow.username_lower,
          profile: {
            uid: guestRow.uid,
            username: guestRow.username || guestRow.username_lower,
            displayName: guestRow.display_name || guestRow.username || 'Guest Student',
            avatar: 'avatar-1',
            frame: null,
            role: guestRow.role || 'student',
            customRole: null,
            profile_layout: 'game-card',
            profileLayout: 'game-card',
            proBadge: null,
          },
        });
      }

      // 3. Check 14-day username_history for old username redirect
      const historyRow = await db
        .prepare(
          'SELECT username_lower, username_display, uid, changed_at, expires_at FROM username_history WHERE username_lower = ?1 AND expires_at > ?2 LIMIT 1'
        )
        .bind(queryUsername, nowMs)
        .first<{ username_lower: string; username_display: string; uid: string; changed_at: number; expires_at: number }>();

      if (historyRow && historyRow.uid) {
        const currentRow = await db
          .prepare(
            'SELECT username_lower, username_display, uid, display_name, avatar, frame, role, custom_role, bio, status, accent, profile_layout FROM user_usernames WHERE uid = ?1 LIMIT 1'
          )
          .bind(historyRow.uid)
          .first<any>();

        const badgeMap = await resolveProBadgesBatch([historyRow.uid], db, env, nowMs);
        const currentUsername = currentRow?.username_display || currentRow?.username_lower || historyRow.uid;
        const resolvedLayout = normalizeAuthProfileLayout(currentRow?.profile_layout);
        return jsonResponse({
          ok: true,
          found: true,
          redirectedFromOldUsername: true,
          oldUsername: queryUsername,
          uid: historyRow.uid,
          currentUsername,
          profile: currentRow
            ? {
                uid: historyRow.uid,
                username: currentUsername,
                displayName: currentRow.display_name || currentUsername,
                avatar: currentRow.avatar || '',
                frame: currentRow.frame || null,
                role: currentRow.role || 'student',
                customRole: currentRow.custom_role || null,
                bio: currentRow.bio || '',
                status: currentRow.status || '',
                accent: currentRow.accent || '',
                profile_layout: resolvedLayout,
                profileLayout: resolvedLayout,
                proBadge: badgeMap.get(String(historyRow.uid)) ?? null,
              }
            : null,
        });
      }

      return jsonResponse({ ok: true, found: false }, 404);
    }

    const uids = Array.from(
      new Set(
        rawUids
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean)
      )
    ).slice(0, 100);

    if (uids.length === 0) {
      return jsonResponse({ ok: true, profiles: {} });
    }

    const placeholders = uids.map((_, i) => `?${i + 1}`).join(', ');
    const [unameRes, guestRes, roleRes, proBadgesMap] = await Promise.all([
      db
        .prepare(
          `SELECT username_lower, username_display, uid, display_name, avatar, frame, role, custom_role, bio, status, accent, profile_layout, updated_at
           FROM user_usernames WHERE uid IN (${placeholders})`
        )
        .bind(...uids)
        .all<any>()
        .catch(() => ({ results: [] })),
      db
        .prepare(
          `SELECT uid, username, username_lower, display_name, role
           FROM guest_accounts WHERE uid IN (${placeholders})`
        )
        .bind(...uids)
        .all<any>()
        .catch(() => ({ results: [] })),
      db
        .prepare(
          `SELECT uid, role, custom_role
           FROM user_roles WHERE uid IN (${placeholders})`
        )
        .bind(...uids)
        .all<any>()
        .catch(() => ({ results: [] })),
      resolveProBadgesBatch(uids, db, env, nowMs),
    ]);

    const roleByUid = new Map<string, { role?: string; custom_role?: string | null }>();
    for (const r of roleRes.results || []) {
      if (r?.uid) roleByUid.set(String(r.uid), r);
    }

    const profiles: Record<string, any> = {};
    for (const g of guestRes.results || []) {
      if (!g?.uid) continue;
      const rInfo = roleByUid.get(String(g.uid));
      profiles[String(g.uid)] = {
        uid: String(g.uid),
        username: g.username || g.username_lower || '',
        displayName: g.display_name || g.username || 'Guest Student',
        avatar: 'avatar-1',
        frame: null,
        role: rInfo?.role || g.role || 'student',
        customRole: rInfo?.custom_role ?? null,
        profile_layout: 'game-card',
        profileLayout: 'game-card',
        proBadge: null,
      };
    }

    for (const u of unameRes.results || []) {
      if (!u?.uid) continue;
      const uidStr = String(u.uid);
      const rInfo = roleByUid.get(uidStr);
      const superUids = new Set(
        (env?.SUPERADMIN_UIDS || DEFAULT_SUPERADMIN_UIDS.join(','))
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      const trustedRole = superUids.has(uidStr)
        ? 'superadmin'
        : rInfo?.role || u.role || 'student';
      const uname = u.username_display || u.username || u.username_lower || '';
      const resolvedLayout = normalizeAuthProfileLayout(u.profile_layout);
      profiles[uidStr] = {
        uid: uidStr,
        username: uname,
        displayName: u.display_name || uname || 'Student',
        avatar: u.avatar || '',
        frame: u.frame || null,
        role: trustedRole,
        customRole: rInfo?.custom_role ?? u.custom_role ?? null,
        bio: u.bio || '',
        status: u.status || '',
        accent: u.accent || '',
        profile_layout: resolvedLayout,
        profileLayout: resolvedLayout,
        proBadge: proBadgesMap.get(uidStr) ?? null,
      };
    }

    for (const uid of uids) {
      if (!profiles[uid]) {
        const badge = proBadgesMap.get(uid) ?? null;
        if (badge) {
          profiles[uid] = {
            uid,
            proBadge: badge,
          };
        }
      }
    }

    return jsonResponse({ ok: true, profiles });
  }

  // ─── G1d. GET /api/auth/admin/roles-audit (One-time Superadmin Role Audit by UID) ───
  if (subPath === 'admin/roles-audit' && request.method === 'GET') {
    const caller = await resolveCurrentUser({
      request,
      env,
      db,
      tokenVerifierOverride: opts.tokenVerifierOverride,
    });
    if (!caller) {
      return jsonResponse({ ok: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' }, 401);
    }
    if (!caller.isSuperAdmin && caller.role !== 'superadmin' && caller.role !== 'admin') {
      return jsonResponse({ ok: false, error: 'Forbidden: Superadmin access required.', code: 'FORBIDDEN' }, 403);
    }

    const superUids = new Set(
      (env?.SUPERADMIN_UIDS || DEFAULT_SUPERADMIN_UIDS.join(','))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );

    const [unameRes, roleRes] = await Promise.all([
      db
        .prepare('SELECT uid, username_display, username_lower, display_name, email, role, custom_role, updated_at FROM user_usernames')
        .all<any>()
        .catch(() => ({ results: [] })),
      db
        .prepare('SELECT uid, email, role, custom_role, updated_at FROM user_roles')
        .all<any>()
        .catch(() => ({ results: [] })),
    ]);

    const mergedByUid = new Map<string, any>();
    for (const u of unameRes.results || []) {
      const uid = String(u?.uid || '').trim();
      if (!uid) continue;
      mergedByUid.set(uid, {
        uid,
        username: u.username_display || u.username_lower || '',
        displayName: u.display_name || '',
        email: u.email || '',
        roleInUsernames: u.role || 'student',
        roleInUserRoles: null,
        resolvedRole: superUids.has(uid) ? 'superadmin' : (u.role || 'student'),
        customRole: u.custom_role || null,
        inSuperadminAllowlist: superUids.has(uid),
        updatedAt: u.updated_at || null,
      });
    }
    for (const r of roleRes.results || []) {
      const uid = String(r?.uid || '').trim();
      if (!uid) continue;
      const existing = mergedByUid.get(uid);
      const resolvedRole = superUids.has(uid)
        ? 'superadmin'
        : r.role || existing?.roleInUsernames || 'student';
      mergedByUid.set(uid, {
        uid,
        username: existing?.username || '',
        displayName: existing?.displayName || '',
        email: r.email || existing?.email || '',
        roleInUsernames: existing?.roleInUsernames ?? null,
        roleInUserRoles: r.role || 'student',
        resolvedRole,
        customRole: r.custom_role ?? existing?.customRole ?? null,
        inSuperadminAllowlist: superUids.has(uid),
        updatedAt: r.updated_at || existing?.updatedAt || null,
      });
    }

    for (const sUid of superUids) {
      if (!mergedByUid.has(sUid)) {
        mergedByUid.set(sUid, {
          uid: sUid,
          username: '',
          displayName: '',
          email: '',
          roleInUsernames: null,
          roleInUserRoles: null,
          resolvedRole: 'superadmin',
          customRole: null,
          inSuperadminAllowlist: true,
          updatedAt: null,
        });
      }
    }

    const nonStudentUsers = Array.from(mergedByUid.values()).filter(
      (entry) => String(entry.resolvedRole || 'student').toLowerCase() !== 'student'
    );

    return jsonResponse({
      ok: true,
      totalNonStudentCount: nonStudentUsers.length,
      nonStudentUsers,
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
      if (opts.passwordVerifierOverride) {
        const isValidPassword = await opts.passwordVerifierOverride(resolvedEmail, password);
        if (!isValidPassword) {
          await Promise.all([recordFailedAttempt(ipRateKey), recordFailedAttempt(idRateKey)]);
          return jsonResponse(
            { ok: false, error: GENERIC_LOGIN_ERROR, code: 'INVALID_CREDENTIALS' },
            401
          );
        }
        await db
          .prepare('DELETE FROM login_rate_limits WHERE rate_key = ?1')
          .bind(idRateKey)
          .run()
          .catch(() => {});

        const status2fa = await getUserTwoFactorStatusFromD1(db, usernameRow.uid, nowMs);
        if (!status2fa.twoFactorEnabled) {
          const emailHashForUser = await hashIdentifier(secret, 'email', resolvedEmail);
          await db
            .prepare(
              `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
               VALUES (?1, ?2, 1, ?3, ?4, ?5)`
            )
            .bind(
              usernameRow.uid,
              emailHashForUser,
              Math.max(1, Math.floor(nowMs / 1000)),
              nowMs,
              nowMs
            )
            .run()
            .catch(() => {});
        }

        return jsonResponse({
          ok: true,
          uid: usernameRow.uid,
          username: usernameRow.username_display,
          tokenResponse: {
            kind: 'identitytoolkit#VerifyPasswordResponse',
            localId: usernameRow.uid,
            displayName: usernameRow.username_display,
            idToken: `session_${usernameRow.uid}_${nowMs}`,
            refreshToken: `refresh_${usernameRow.uid}_${nowMs}`,
            expiresIn: '3600',
            registered: true,
          },
        });
      }

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

      const resolvedUid = String(toolkitData.localId || usernameRow.uid);
      const status2fa = await getUserTwoFactorStatusFromD1(db, resolvedUid, nowMs);
      if (!status2fa.twoFactorEnabled) {
        const emailHashForUser = await hashIdentifier(secret, 'email', resolvedEmail);
        await db
          .prepare(
            `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
             VALUES (?1, ?2, 1, ?3, ?4, ?5)`
          )
          .bind(
            resolvedUid,
            emailHashForUser,
            Math.max(1, Math.floor(nowMs / 1000)),
            nowMs,
            nowMs
          )
          .run()
          .catch(() => {});
      }

      // Return tokenResponse WITHOUT exposing the user's email in the HTTP response body
      return jsonResponse({
        ok: true,
        uid: resolvedUid,
        username: usernameRow.username_display,
        tokenResponse: {
          kind: toolkitData.kind || 'identitytoolkit#VerifyPasswordResponse',
          localId: resolvedUid,
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

  const clientIp = extractClientIp(request);
  const ipHash = await hashIdentifier(secret, 'ip', clientIp);
  const studentName =
    verifiedToken.name || (email.includes('@') ? email.split('@')[0] : 'Student');
  const encryptionKey = getTotpEncryptionKey(env);

  // Helper to check and record 2FA verification rate limits (per user & per IP, 15-min lockout after 5 failures)
  const check2faRateLimit = async (rateKey: string): Promise<boolean> => {
    const row = await db
      .prepare(
        'SELECT attempts, window_start_ms, blocked_until_ms FROM login_rate_limits WHERE rate_key = ?1 LIMIT 1'
      )
      .bind(rateKey)
      .first<{ attempts: number; window_start_ms: number; blocked_until_ms: number | null }>()
      .catch(() => null);
    if (!row) return false;
    if (row.blocked_until_ms && nowMs < Number(row.blocked_until_ms)) return true;
    if (nowMs - Number(row.window_start_ms) > LOGIN_RATE_LIMIT_WINDOW_MS) return false;
    return Number(row.attempts || 0) >= MAX_2FA_FAILURES_PER_WINDOW;
  };

  const record2faFailedAttempt = async (rateKey: string): Promise<number> => {
    const row = await db
      .prepare(
        'SELECT attempts, window_start_ms, blocked_until_ms FROM login_rate_limits WHERE rate_key = ?1 LIMIT 1'
      )
      .bind(rateKey)
      .first<{ attempts: number; window_start_ms: number; blocked_until_ms: number | null }>()
      .catch(() => null);
    const expiredWindow = !row || nowMs - Number(row.window_start_ms) > LOGIN_RATE_LIMIT_WINDOW_MS;
    const nextCount = expiredWindow ? 1 : Number(row.attempts || 0) + 1;
    const nextWindowStart = expiredWindow ? nowMs : Number(row.window_start_ms);
    const nextLockedUntil =
      nextCount >= MAX_2FA_FAILURES_PER_WINDOW ? nowMs + LOGIN_RATE_LIMIT_WINDOW_MS : null;
    await db
      .prepare(
        `INSERT OR REPLACE INTO login_rate_limits (rate_key, attempts, window_start_ms, blocked_until_ms, updated_at_ms)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(rateKey, nextCount, nextWindowStart, nextLockedUntil, nowMs)
      .run()
      .catch(() => {});
    return nextCount;
  };

  const clear2faRateLimit = async (rateKey: string): Promise<void> => {
    await db
      .prepare('DELETE FROM login_rate_limits WHERE rate_key = ?1')
      .bind(rateKey)
      .run()
      .catch(() => {});
  };

  // Helper to verify any active 2FA code (TOTP, Email 2FA code, or Backup code) for sensitive actions or login
  const verifyAny2faFactor = async (params: {
    rawCode: string;
    methodHint?: 'totp' | 'email' | 'backup';
    allowBackupCode?: boolean;
  }): Promise<{
    valid: boolean;
    usedMethod: 'totp' | 'email' | 'backup' | null;
    replayed?: boolean;
  }> => {
    const cleanCode = String(params.rawCode || '').trim();
    if (!cleanCode) return { valid: false, usedMethod: null };

    const twoFaRow = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret, last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{
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
      }>()
      .catch(() => null);

    // 1. Check TOTP if enabled
    if (
      twoFaRow &&
      Number(twoFaRow.totp_enabled) === 1 &&
      twoFaRow.encrypted_secret &&
      params.methodHint !== 'email' &&
      params.methodHint !== 'backup' &&
      /^\d{6}$/.test(cleanCode)
    ) {
      try {
        const plainSecret = await decryptTotpSecret(twoFaRow.encrypted_secret, encryptionKey);
        const totpRes = await verifyTotpCode({
          base32Secret: plainSecret,
          code: cleanCode,
          nowMs,
          lastUsedStep: Number(twoFaRow.last_used_step || 0),
        });
        if (totpRes.replayed) {
          return { valid: false, usedMethod: null, replayed: true };
        }
        if (totpRes.valid && totpRes.matchedStep != null) {
          await db
            .prepare('UPDATE user_2fa SET last_used_step = ?1, updated_at = ?2 WHERE user_id = ?3')
            .bind(totpRes.matchedStep, nowMs, uid)
            .run();
          return { valid: true, usedMethod: 'totp' };
        }
      } catch {
        // Continue to next method
      }
    }

    // 2. Check Email 2FA code if enabled (or if an active login email code exists)
    if (
      params.methodHint !== 'totp' &&
      params.methodHint !== 'backup' &&
      /^\d{6}$/.test(cleanCode)
    ) {
      const codeRows = await db
        .prepare(
          'SELECT id, user_id, purpose, code_hash, expires_at, attempt_count, used FROM email_verification_codes WHERE user_id = ?1 AND used = 0 ORDER BY created_at DESC LIMIT 1'
        )
        .bind(uid)
        .all<{
          id: string;
          user_id: string;
          purpose: string;
          code_hash: string;
          expires_at: number;
          attempt_count: number;
          used: number;
        }>();
      const latest = codeRows.results?.[0];
      if (
        latest &&
        (latest.purpose === 'login' || latest.purpose === '2fa_login') &&
        Number(latest.used) === 0 &&
        nowMs <= Number(latest.expires_at) &&
        Number(latest.attempt_count) < MAX_CODE_ATTEMPTS
      ) {
        const expectedHash = await hashVerificationCode({
          secret,
          userId: uid,
          purpose: 'login',
          code: cleanCode,
        });
        if (constantTimeEqual(latest.code_hash, expectedHash)) {
          await db
            .prepare('UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND used = 0')
            .bind(uid)
            .run();
          return { valid: true, usedMethod: 'email' };
        } else {
          const nextAtt = Number(latest.attempt_count || 0) + 1;
          const lock = nextAtt >= MAX_CODE_ATTEMPTS ? 1 : 0;
          await db
            .prepare('UPDATE email_verification_codes SET attempt_count = ?1, used = ?2 WHERE id = ?3')
            .bind(nextAtt, lock, latest.id)
            .run();
        }
      }
    }

    // 3. Check one-time Backup Codes if allowed
    if (params.allowBackupCode !== false && params.methodHint !== 'totp' && params.methodHint !== 'email') {
      const candidateBackupHash = await hashBackupCode(uid, cleanCode, secret);
      const backupRows = await db
        .prepare(
          'SELECT id, code_hash, used FROM user_2fa_backup_codes WHERE user_id = ?1 AND used = 0'
        )
        .bind(uid)
        .all<{ id: string; code_hash: string; used: number }>();

      let matchedBackupId: string | null = null;
      for (const row of backupRows.results || []) {
        if (Number(row.used) === 0 && constantTimeEqual(row.code_hash, candidateBackupHash)) {
          matchedBackupId = row.id;
        }
      }

      if (matchedBackupId) {
        await db
          .prepare('UPDATE user_2fa_backup_codes SET used = 1, used_at = ?1 WHERE id = ?2')
          .bind(nowMs, matchedBackupId)
          .run();

        await logSecurityAuditEvent({
          db,
          userId: uid,
          eventType: 'backup_code_used',
          ipHash,
          details: { backupCodeId: matchedBackupId },
          nowMs,
        });

        await sendSecurityNotificationEmail({
          to: email,
          userId: uid,
          studentName,
          title: 'A one-time backup code was used on your account',
          message:
            'One of your Boardly two-step verification backup codes was just used to sign in or authorize a security action. Each backup code can only be used once.',
          eventType: 'backup_code_used',
          env,
          senderOverride: opts.emailSenderOverride,
        });

        return { valid: true, usedMethod: 'backup' };
      }
    }

    return { valid: false, usedMethod: null };
  };

  // ─── 2. GET /api/auth/verification-status ───────────────────────────────────
  if (subPath === 'verification-status' && request.method === 'GET') {
    const isFreshLogin = url.searchParams.get('login') === '1' || url.searchParams.get('fresh') === '1';
    const isPasswordLinkSync = url.searchParams.get('syncPasswordLink') === '1';

    let sessionRow = await db
      .prepare(
        'SELECT user_id, email_verified, verified_auth_time, verified_at FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{ user_id: string; email_verified: number; verified_auth_time: number; verified_at?: number }>()
      .catch(() => null);

    const isGoogleUser =
      verifiedToken.signInProvider === 'google.com' ||
      Boolean(verifiedToken.hasGoogleProvider) ||
      Boolean(verifiedToken.signInProviders?.includes('google.com'));
    const accountEmailVerified =
      isGoogleUser ||
      Number(sessionRow?.email_verified || 0) === 1 ||
      (Boolean(verifiedToken.emailVerified) && (!sessionRow || Number(sessionRow.email_verified) !== 0));

    // When a verified account links or updates a password in Settings, carry over its verified status
    // and restore Firebase Auth emailVerified if linking EmailAuthProvider reset it.
    if (accountEmailVerified && (isPasswordLinkSync || (isGoogleUser && !verifiedToken.emailVerified))) {
      const nextVerifiedAuthTime = Math.max(Number(sessionRow?.verified_auth_time || 0), tokenAuthTime);
      await db
        .prepare(
          `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, 1, ?3, ?4, ?5)`
        )
        .bind(uid, emailHash, nextVerifiedAuthTime, sessionRow?.verified_at || nowMs, nowMs)
        .run()
        .catch(() => {});
      sessionRow = {
        user_id: uid,
        email_verified: 1,
        verified_auth_time: nextVerifiedAuthTime,
        verified_at: sessionRow?.verified_at || nowMs,
      };
      if (!verifiedToken.emailVerified) {
        await syncEmailVerifiedToFirebaseAndFirestore({
          uid,
          env,
          storeOverride: opts.firestoreStoreOverride,
        }).catch(() => {});
      }
    }

    // Check canonical 2FA status in D1 via single source of truth
    const canonical2fa = await getUserTwoFactorStatusFromD1(db, uid, nowMs);
    const {
      totpEnabled,
      email2faEnabled,
      twoFactorEnabled,
      recoveryPending,
      recoveryRequestedAt,
      recoveryDisableAt,
      backupCodesRemaining: backupCount,
      trustedDevicesCount,
      lastChangedAt,
      badgeLabel,
    } = canonical2fa;

    // Check if request carries a valid 30-day trusted device cookie/token
    const rawDeviceToken = extractTrustedDeviceTokenFromRequest(request);
    let isTrustedDevice = false;
    if (rawDeviceToken) {
      const th = await hashTrustedDeviceToken(rawDeviceToken, secret);
      const td = await db
        .prepare(
          'SELECT id, user_id, expires_at, revoked FROM trusted_devices WHERE token_hash = ?1 AND revoked = 0 LIMIT 1'
        )
        .bind(th)
        .first<{ id: string; user_id: string; expires_at: number; revoked: number }>()
        .catch(() => null);
      if (td && td.user_id === uid && Number(td.revoked) === 0 && Number(td.expires_at) > nowMs) {
        isTrustedDevice = true;
      }
    }

    // If this is a fresh login with 2FA OFF and email verified, restore verified_auth_time so a password login after admin reset succeeds
    if (isFreshLogin && accountEmailVerified && !twoFactorEnabled) {
      const freshAuthTime = Math.max(tokenAuthTime, Math.floor(nowMs / 1000), 1);
      await db
        .prepare(
          `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, 1, ?3, ?4, ?5)`
        )
        .bind(uid, emailHash, freshAuthTime, sessionRow?.verified_at || nowMs, nowMs)
        .run()
        .catch(() => {});
      sessionRow = {
        user_id: uid,
        email_verified: 1,
        verified_auth_time: freshAuthTime,
        verified_at: sessionRow?.verified_at || nowMs,
      };
    }

    // If this is a fresh login with 2FA enabled and no trusted device cookie, create a 5-min pending 2FA challenge
    if (isFreshLogin && accountEmailVerified && twoFactorEnabled && !isTrustedDevice) {
      const challengeId = `p2fa_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
      const challengeExpiresAt = nowMs + PENDING_2FA_CHALLENGE_TTL_MS;
      await db
        .prepare('DELETE FROM pending_2fa_challenges WHERE user_id = ?1')
        .bind(uid)
        .run()
        .catch(() => {});
      await db
        .prepare(
          `INSERT INTO pending_2fa_challenges (challenge_id, user_id, auth_time, expires_at, attempt_count, verified, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        )
        .bind(challengeId, uid, tokenAuthTime, challengeExpiresAt, 0, 0, nowMs)
        .run()
        .catch(() => {});

      // Ensure verified_auth_time is 0 until 2FA code is verified
      await db
        .prepare(
          `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(uid, emailHash, 1, 0, sessionRow?.verified_at || nowMs, nowMs)
        .run()
        .catch(() => {});
    }

    const sessionVerified = await isD1UserSessionVerified(db, verifiedToken, {
      request,
      hmacSecret: secret,
      nowMs,
    });

    // If account email is verified and 2FA is off, persist `email_verified = 1` in D1 so future checks are instant
    if (accountEmailVerified && sessionVerified && (!sessionRow || Number(sessionRow.email_verified) !== 1)) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(uid, emailHash, 1, tokenAuthTime, nowMs, nowMs)
        .run()
        .catch(() => {});
    }

    // If 2FA is required and no pending challenge exists yet, create a 5-minute pending challenge now
    let pendingExpiresAt: number | null = null;
    if (!sessionVerified && accountEmailVerified && twoFactorEnabled) {
      const existingChallenge = await db
        .prepare(
          'SELECT challenge_id, expires_at, verified FROM pending_2fa_challenges WHERE user_id = ?1 AND verified = 0 ORDER BY created_at DESC LIMIT 1'
        )
        .bind(uid)
        .first<{ challenge_id: string; expires_at: number; verified: number }>()
        .catch(() => null);

      if (existingChallenge && Number(existingChallenge.expires_at) > nowMs) {
        pendingExpiresAt = Number(existingChallenge.expires_at);
      } else {
        const challengeId = `p2fa_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
        pendingExpiresAt = nowMs + PENDING_2FA_CHALLENGE_TTL_MS;
        await db
          .prepare(
            `INSERT INTO pending_2fa_challenges (challenge_id, user_id, auth_time, expires_at, attempt_count, verified, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
          )
          .bind(challengeId, uid, tokenAuthTime, pendingExpiresAt, 0, 0, nowMs)
          .run()
          .catch(() => {});
      }
    }

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
        purpose: string;
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

    const sessionRevoked = Boolean(
      !sessionVerified &&
        accountEmailVerified &&
        !twoFactorEnabled &&
        sessionRow &&
        Number(sessionRow.verified_auth_time) < 0
    );

    const requiredPurpose: 'signup' | '2fa' | 'login' | null = sessionVerified
      ? null
      : !accountEmailVerified
      ? 'signup'
      : sessionRevoked
      ? 'login'
      : '2fa';

    return jsonResponse({
      ok: true,
      verified: sessionVerified,
      emailVerified: accountEmailVerified,
      sessionRevoked,
      requiredPurpose,
      twoFactorEnabled,
      totpEnabled,
      email2faEnabled,
      recoveryPending,
      recoveryRequestedAt,
      recoveryDisableAt,
      lastChangedAt,
      updatedAt: lastChangedAt,
      badgeLabel,
      twoFactorMethods: {
        totp: totpEnabled,
        email: email2faEnabled,
      },
      deviceTrusted: isTrustedDevice,
      backupCodesRemaining: backupCount,
      remainingBackupCodes: backupCount,
      trustedDevicesCount,
      pendingExpiresAt,
      hasActiveCode,
      maskedEmail,
      cooldownSeconds,
    });
  }

  // ─── 3. POST /api/auth/send-code ────────────────────────────────────────────
  if (subPath === 'send-code' && request.method === 'POST') {
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
      .first<{ user_id: string; email_verified: number; verified_auth_time: number }>()
      .catch(() => null);

    const isGoogleUser =
      verifiedToken.signInProvider === 'google.com' ||
      Boolean(verifiedToken.hasGoogleProvider) ||
      Boolean(verifiedToken.signInProviders?.includes('google.com'));
    const accountEmailVerified =
      isGoogleUser ||
      Number(sessionRow?.email_verified || 0) === 1 ||
      (Boolean(verifiedToken.emailVerified) && (!sessionRow || Number(sessionRow.email_verified) !== 0));

    // Google users skip signup email verification, unless explicitly requesting a 2FA login or 2FA recovery code
    if (
      isGoogleUser &&
      body.purpose !== 'login' &&
      body.purpose !== '2fa_login' &&
      body.purpose !== '2fa_recovery'
    ) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
           VALUES (?1, ?2, 1, ?3, ?4, ?5)`
        )
        .bind(
          uid,
          emailHash,
          Math.max(Number(sessionRow?.verified_auth_time || 0), tokenAuthTime),
          nowMs,
          nowMs
        )
        .run()
        .catch(() => {});
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

    // Enforce hourly limit: max 5 code emails per hour per account (by email_hash or user_id)
    const oneHourAgoMs = nowMs - HOURLY_WINDOW_MS;
    const emailHourlyCountRow = await db
      .prepare(
        'SELECT COUNT(*) as cnt FROM email_verification_send_logs WHERE (email_hash = ?1 OR user_id = ?2) AND created_at >= ?3'
      )
      .bind(emailHash, uid, oneHourAgoMs)
      .first<{ cnt: number }>();
    const emailHourlyCount = Number(emailHourlyCountRow?.cnt || 0);

    if (emailHourlyCount >= MAX_SENDS_PER_HOUR_PER_EMAIL) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many verification codes requested for this account. Please try again in an hour.',
          code: 'RATE_LIMITED_HOURLY_EMAIL',
          maskedEmail,
        },
        429
      );
    }

    // Enforce hourly limit: max 5 code emails per hour per IP
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

    const codeId = `evc_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
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

    const sendLogId = `evsl_${nowMs}_${generateFallbackLinkToken().slice(0, 10)}`;
    await db
      .prepare(
        `INSERT INTO email_verification_send_logs (id, user_id, email_hash, ip_hash, purpose, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(sendLogId, uid, emailHash, ipHash, purpose, nowMs)
      .run();

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
    let body: { code?: string; purpose?: string; rememberDevice?: boolean } = {};
    try {
      body = (await request.json()) as {
        code?: string;
        purpose?: string;
        rememberDevice?: boolean;
      };
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
            purpose: string;
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
            purpose: string;
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

    // Also mark any pending 2FA challenges as verified
    await db
      .prepare('UPDATE pending_2fa_challenges SET verified = 1 WHERE user_id = ?1')
      .bind(uid)
      .run()
      .catch(() => {});

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

    if (activeCode.purpose === 'signup' || !verifiedToken.emailVerified) {
      await syncEmailVerifiedToFirebaseAndFirestore({
        uid,
        env,
        storeOverride: opts.storeOverride,
      });
    }

    let extraHeaders: Record<string, string> | undefined;
    let trustedDeviceToken: string | undefined;
    if (body.rememberDevice === true) {
      trustedDeviceToken = generateTrustedDeviceToken();
      const tdHash = await hashTrustedDeviceToken(trustedDeviceToken, secret);
      const tdId = `tdev_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
      const tdExpires = nowMs + TRUSTED_DEVICE_TTL_MS;
      const ua = (request.headers.get('User-Agent') || '').slice(0, 250);
      await db
        .prepare(
          `INSERT INTO trusted_devices (id, user_id, token_hash, user_agent, ip_hash, created_at, last_used_at, expires_at, revoked)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(tdId, uid, tdHash, ua, ipHash, nowMs, nowMs, tdExpires, 0)
        .run()
        .catch(() => {});
      extraHeaders = {
        'Set-Cookie': buildTrustedDeviceCookieHeader(trustedDeviceToken, TRUSTED_DEVICE_MAX_AGE_SECONDS),
      };
    }

    return jsonResponse(
      {
        ok: true,
        verified: true,
        purpose: activeCode.purpose,
        ...(trustedDeviceToken ? { trustedDeviceToken } : {}),
      },
      200,
      extraHeaders
    );
  }

  // ─── 5. GET /api/auth/2fa/status (Current User's Security & 2FA Settings) ───
  if (subPath === '2fa/status' && request.method === 'GET') {
    const status = await getUserTwoFactorStatusFromD1(db, uid, nowMs);
    return jsonResponse({
      ok: true,
      ...status,
      emailCodeEnabled: Boolean(status.email2faEnabled),
      rememberedDevices: Number(status.trustedDevicesCount || 0),
    });
  }

  // ─── 6. POST /api/auth/2fa/totp/setup (Start Authenticator App TOTP Setup) ───
  if (subPath === '2fa/totp/setup' && request.method === 'POST') {
    let body: { password?: string; currentPassword?: string } = {};
    try {
      body = (await request.json()) as { password?: string; currentPassword?: string };
    } catch {
      body = {};
    }

    const authCheck = await verifyUserCurrentPasswordOrFreshGoogle({
      verifiedToken,
      email,
      password: body.password || body.currentPassword,
      env,
      passwordVerifierOverride: opts.passwordVerifierOverride,
      nowMs,
    });
    if (!authCheck.ok) {
      return jsonResponse(
        { ok: false, error: authCheck.error || 'Current password is required.', code: 'INVALID_PASSWORD' },
        401
      );
    }

    // Generate 20-byte random secret with crypto.getRandomValues & encrypt with AES-GCM
    const rawBase32Secret = generateTotpSecretBase32();
    const encryptedPending = await encryptTotpSecret(rawBase32Secret, encryptionKey);

    const existing = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, last_used_step, recovery_requested_at, recovery_disable_at, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        last_used_step: number;
        recovery_requested_at: number | null;
        recovery_disable_at: number | null;
        created_at: number;
      }>()
      .catch(() => null);

    await db
      .prepare(
        `INSERT OR REPLACE INTO user_2fa (
           user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
           last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        uid,
        email,
        Number(existing?.totp_enabled || 0),
        Number(existing?.email_2fa_enabled || 0),
        existing?.encrypted_secret ?? null,
        encryptedPending,
        Number(existing?.last_used_step || 0),
        existing?.recovery_requested_at ?? null,
        existing?.recovery_disable_at ?? null,
        nowMs,
        Number(existing?.created_at || nowMs)
      )
      .run();

    // Look up username if available for otpauth URI label
    const uRow = await db
      .prepare('SELECT username_display FROM user_usernames WHERE uid = ?1 LIMIT 1')
      .bind(uid)
      .first<{ username_display: string }>()
      .catch(() => null);
    const accountLabel = uRow?.username_display || email || uid;
    const otpauthUrl = buildOtpAuthUri(accountLabel, rawBase32Secret, 'Boardly');

    return jsonResponse({
      ok: true,
      secret: rawBase32Secret,
      otpauthUrl,
      issuer: 'Boardly',
      accountLabel,
    });
  }

  // ─── 7. POST /api/auth/2fa/totp/enable (Verify 6-Digit Code & Activate TOTP + Generate 10 Backup Codes) ───
  if (subPath === '2fa/totp/enable' && request.method === 'POST') {
    let body: { code?: string } = {};
    try {
      body = (await request.json()) as { code?: string };
    } catch {
      body = {};
    }

    const rawCode = String(body.code || '').trim();
    if (!/^\d{6}$/.test(rawCode)) {
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    const userRateKey = `2fa_user:${uid}`;
    const ipRateKey = `2fa_ip:${ipHash}`;
    if ((await check2faRateLimit(userRateKey)) || (await check2faRateLimit(ipRateKey))) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many failed verification attempts. Please wait 15 minutes.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }

    const existing = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret, last_used_step, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        pending_encrypted_secret: string | null;
        last_used_step: number;
        created_at: number;
      }>()
      .catch(() => null);

    if (!existing || !existing.pending_encrypted_secret) {
      return jsonResponse(
        { ok: false, error: 'No pending authenticator setup found. Please start setup again.', code: 'NO_PENDING_SETUP' },
        400
      );
    }

    let plainSecret = '';
    try {
      plainSecret = await decryptTotpSecret(existing.pending_encrypted_secret, encryptionKey);
    } catch {
      return jsonResponse(
        { ok: false, error: 'Could not verify setup secret. Please restart setup.', code: 'SETUP_ERROR' },
        400
      );
    }

    const totpCheck = await verifyTotpCode({
      base32Secret: plainSecret,
      code: rawCode,
      nowMs,
      lastUsedStep: Number(existing.last_used_step || 0),
    });

    if (!totpCheck.valid || totpCheck.matchedStep == null) {
      await Promise.all([record2faFailedAttempt(userRateKey), record2faFailedAttempt(ipRateKey)]);
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    await clear2faRateLimit(userRateKey);

    // Promote pending_encrypted_secret -> encrypted_secret and set totp_enabled = 1
    await db
      .prepare(
        `INSERT OR REPLACE INTO user_2fa (
           user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
           last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        uid,
        email || existing.email || '',
        1,
        Number(existing.email_2fa_enabled || 0),
        existing.pending_encrypted_secret,
        null,
        totpCheck.matchedStep,
        null,
        null,
        nowMs,
        Number(existing.created_at || nowMs)
      )
      .run();

    // Generate 10 one-time backup codes (return plaintext ONCE, store only HMAC-SHA256 hashes in D1)
    const plainBackupCodes = generateBackupCodes(10);
    await db
      .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
      .bind(uid)
      .run();

    for (let i = 0; i < plainBackupCodes.length; i++) {
      const bHash = await hashBackupCode(uid, plainBackupCodes[i], secret);
      const bId = `bkc_${nowMs}_${i}_${generateFallbackLinkToken().slice(0, 8)}`;
      await db
        .prepare(
          `INSERT INTO user_2fa_backup_codes (id, user_id, code_hash, used, used_at, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(bId, uid, bHash, 0, null, nowMs)
        .run();
    }

    // Keep current session verified so user isn't immediately kicked out of Settings
    const nowSec = Math.floor(nowMs / 1000);
    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(uid, emailHash, 1, Math.max(tokenAuthTime, nowSec), nowMs, nowMs)
      .run();

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: '2fa_totp_enabled',
      ipHash,
      details: { method: 'totp', backupCodesGenerated: 10 },
      nowMs,
    });

    await sendSecurityNotificationEmail({
      to: email,
      userId: uid,
      studentName,
      title: 'Authenticator app two-step verification enabled',
      message:
        'Two-step verification using an authenticator app (TOTP) was just turned on for your Boardly account, and 10 one-time backup codes were generated.',
      eventType: '2fa_totp_enabled',
      env,
      senderOverride: opts.emailSenderOverride,
    });

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, uid, nowMs).catch(() => null);
    return jsonResponse({
      ok: true,
      totpEnabled: true,
      twoFactorEnabled: true,
      backupCodes: plainBackupCodes,
      ...(updatedStatus
        ? {
            ...updatedStatus,
            emailCodeEnabled: Boolean(updatedStatus.email2faEnabled),
            rememberedDevices: Number(updatedStatus.trustedDevicesCount || 0),
          }
        : { backupCodesRemaining: 10, remainingBackupCodes: 10, lastChangedAt: nowMs }),
    });
  }

  // ─── 8. POST /api/auth/2fa/email/toggle (Turn On or Off Email Code at Login) ───
  if (subPath === '2fa/email/toggle' && request.method === 'POST') {
    let body: { enabled?: boolean; password?: string; currentPassword?: string; code?: string } = {};
    try {
      body = (await request.json()) as {
        enabled?: boolean;
        password?: string;
        currentPassword?: string;
        code?: string;
      };
    } catch {
      body = {};
    }

    const targetEnabled = Boolean(body.enabled);
    const authCheck = await verifyUserCurrentPasswordOrFreshGoogle({
      verifiedToken,
      email,
      password: body.password || body.currentPassword,
      env,
      passwordVerifierOverride: opts.passwordVerifierOverride,
      nowMs,
    });
    if (!authCheck.ok) {
      return jsonResponse(
        { ok: false, error: authCheck.error || 'Current password is required.', code: 'INVALID_PASSWORD' },
        401
      );
    }

    const existing = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret, last_used_step, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        pending_encrypted_secret: string | null;
        last_used_step: number;
        created_at: number;
      }>()
      .catch(() => null);

    // If turning OFF email 2FA when it is currently enabled, require a valid 2FA code as well
    if (!targetEnabled && existing && Number(existing.email_2fa_enabled) === 1) {
      const factorRes = await verifyAny2faFactor({ rawCode: String(body.code || '') });
      if (!factorRes.valid) {
        return jsonResponse(
          { ok: false, error: 'Invalid code', code: 'INVALID_CODE' },
          400
        );
      }
    }

    await db
      .prepare(
        `INSERT OR REPLACE INTO user_2fa (
           user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
           last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        uid,
        email || existing?.email || '',
        Number(existing?.totp_enabled || 0),
        targetEnabled ? 1 : 0,
        existing?.encrypted_secret ?? null,
        existing?.pending_encrypted_secret ?? null,
        Number(existing?.last_used_step || 0),
        null,
        null,
        nowMs,
        Number(existing?.created_at || nowMs)
      )
      .run();

    // Keep current session verified
    const nowSec = Math.floor(nowMs / 1000);
    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(uid, emailHash, 1, Math.max(tokenAuthTime, nowSec), nowMs, nowMs)
      .run();

    const eventType = targetEnabled ? '2fa_email_enabled' : '2fa_email_disabled';
    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType,
      ipHash,
      details: { email2faEnabled: targetEnabled },
      nowMs,
    });

    await sendSecurityNotificationEmail({
      to: email,
      userId: uid,
      studentName,
      title: targetEnabled
        ? 'Email two-step verification enabled'
        : 'Email two-step verification turned off',
      message: targetEnabled
        ? 'Email code two-step verification at login is now turned on for your Boardly account.'
        : 'Email code two-step verification at login was turned off for your Boardly account.',
      eventType,
      env,
      senderOverride: opts.emailSenderOverride,
    });

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, uid, nowMs).catch(() => null);
    return jsonResponse({
      ok: true,
      email2faEnabled: targetEnabled,
      emailCodeEnabled: targetEnabled,
      totpEnabled: Boolean(existing && Number(existing.totp_enabled) === 1),
      twoFactorEnabled: targetEnabled || Boolean(existing && Number(existing.totp_enabled) === 1),
      ...(updatedStatus
        ? {
            ...updatedStatus,
            emailCodeEnabled: Boolean(updatedStatus.email2faEnabled),
            rememberedDevices: Number(updatedStatus.trustedDevicesCount || 0),
          }
        : { lastChangedAt: nowMs }),
    });
  }

  // ─── 9. POST /api/auth/2fa/backup-codes/regenerate (Password + Valid Code -> 10 New Backup Codes) ───
  if (subPath === '2fa/backup-codes/regenerate' && request.method === 'POST') {
    let body: { password?: string; currentPassword?: string; code?: string } = {};
    try {
      body = (await request.json()) as { password?: string; currentPassword?: string; code?: string };
    } catch {
      body = {};
    }

    const authCheck = await verifyUserCurrentPasswordOrFreshGoogle({
      verifiedToken,
      email,
      password: body.password || body.currentPassword,
      env,
      passwordVerifierOverride: opts.passwordVerifierOverride,
      nowMs,
    });
    if (!authCheck.ok) {
      return jsonResponse(
        { ok: false, error: authCheck.error || 'Current password is required.', code: 'INVALID_PASSWORD' },
        401
      );
    }

    const factorRes = await verifyAny2faFactor({ rawCode: String(body.code || '') });
    if (!factorRes.valid) {
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    const plainBackupCodes = generateBackupCodes(10);
    await db
      .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
      .bind(uid)
      .run();

    for (let i = 0; i < plainBackupCodes.length; i++) {
      const bHash = await hashBackupCode(uid, plainBackupCodes[i], secret);
      const bId = `bkc_${nowMs}_${i}_${generateFallbackLinkToken().slice(0, 8)}`;
      await db
        .prepare(
          `INSERT INTO user_2fa_backup_codes (id, user_id, code_hash, used, used_at, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(bId, uid, bHash, 0, null, nowMs)
        .run();
    }

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: 'backup_codes_regenerated',
      ipHash,
      details: { count: 10 },
      nowMs,
    });

    await sendSecurityNotificationEmail({
      to: email,
      userId: uid,
      studentName,
      title: 'Two-step verification backup codes regenerated',
      message:
        'A new set of 10 one-time backup codes was just generated for your Boardly account. Your previous backup codes have been invalidated.',
      eventType: 'backup_codes_regenerated',
      env,
      senderOverride: opts.emailSenderOverride,
    });

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, uid, nowMs).catch(() => null);
    return jsonResponse({
      ok: true,
      backupCodes: plainBackupCodes,
      ...(updatedStatus
        ? {
            ...updatedStatus,
            emailCodeEnabled: Boolean(updatedStatus.email2faEnabled),
            rememberedDevices: Number(updatedStatus.trustedDevicesCount || 0),
          }
        : { backupCodesRemaining: 10, remainingBackupCodes: 10, lastChangedAt: nowMs }),
    });
  }

  // ─── 10. POST /api/auth/2fa/disable (Password + Valid Code -> Disable TOTP / Email / All 2FA) ───
  if (subPath === '2fa/disable' && request.method === 'POST') {
    let body: {
      method?: 'totp' | 'email' | 'all';
      target?: 'totp' | 'email' | 'all';
      password?: string;
      currentPassword?: string;
      code?: string;
    } = {};
    try {
      body = (await request.json()) as {
        method?: 'totp' | 'email' | 'all';
        target?: 'totp' | 'email' | 'all';
        password?: string;
        currentPassword?: string;
        code?: string;
      };
    } catch {
      body = {};
    }

    const authCheck = await verifyUserCurrentPasswordOrFreshGoogle({
      verifiedToken,
      email,
      password: body.password || body.currentPassword,
      env,
      passwordVerifierOverride: opts.passwordVerifierOverride,
      nowMs,
    });
    if (!authCheck.ok) {
      return jsonResponse(
        { ok: false, error: authCheck.error || 'Current password is required.', code: 'INVALID_PASSWORD' },
        401
      );
    }

    const factorRes = await verifyAny2faFactor({ rawCode: String(body.code || '') });
    if (!factorRes.valid) {
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    const existing = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, last_used_step, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(uid)
      .first<{
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        last_used_step: number;
        created_at: number;
      }>()
      .catch(() => null);

    const disableMethod = body.method || body.target || 'all';
    const nextTotp = disableMethod === 'email' ? Number(existing?.totp_enabled || 0) : 0;
    const nextEmail = disableMethod === 'totp' ? Number(existing?.email_2fa_enabled || 0) : 0;
    const nextSecret = nextTotp === 1 ? existing?.encrypted_secret ?? null : null;

    await db
      .prepare(
        `INSERT OR REPLACE INTO user_2fa (
           user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
           last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        uid,
        email || existing?.email || '',
        nextTotp,
        nextEmail,
        nextSecret,
        null,
        Number(existing?.last_used_step || 0),
        null,
        null,
        nowMs,
        Number(existing?.created_at || nowMs)
      )
      .run();

    if (nextTotp === 0) {
      await db
        .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
        .bind(uid)
        .run();
    }

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: disableMethod === 'totp' ? '2fa_totp_disabled' : '2fa_disabled',
      ipHash,
      details: { disabledMethod: disableMethod },
      nowMs,
    });

    await sendSecurityNotificationEmail({
      to: email,
      userId: uid,
      studentName,
      title: 'Two-step verification turned off',
      message:
        'Two-step verification was just turned off on your Boardly account.',
      eventType: '2fa_disabled',
      env,
      senderOverride: opts.emailSenderOverride,
    });

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, uid, nowMs).catch(() => null);
    return jsonResponse({
      ok: true,
      totpEnabled: Boolean(nextTotp),
      email2faEnabled: Boolean(nextEmail),
      emailCodeEnabled: Boolean(nextEmail),
      twoFactorEnabled: Boolean(nextTotp || nextEmail),
      ...(updatedStatus
        ? {
            ...updatedStatus,
            emailCodeEnabled: Boolean(updatedStatus.email2faEnabled),
            rememberedDevices: Number(updatedStatus.trustedDevicesCount || 0),
          }
        : { lastChangedAt: nowMs }),
    });
  }

  // ─── 11. POST /api/auth/2fa/verify (Verify 2FA Code at Login: TOTP, Email Code, or Backup Code) ───
  if (subPath === '2fa/verify' && request.method === 'POST') {
    let body: {
      code?: string;
      method?: 'totp' | 'email' | 'backup';
      rememberDevice?: boolean;
    } = {};
    try {
      body = (await request.json()) as {
        code?: string;
        method?: 'totp' | 'email' | 'backup';
        rememberDevice?: boolean;
      };
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    const userRateKey = `2fa_user:${uid}`;
    const ipRateKey = `2fa_ip:${ipHash}`;
    if ((await check2faRateLimit(userRateKey)) || (await check2faRateLimit(ipRateKey))) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many failed verification attempts. Please wait 15 minutes and try again.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }

    // Check 5-minute pending verification window
    const pendingChallenge = await db
      .prepare(
        'SELECT challenge_id, auth_time, expires_at, attempt_count, verified FROM pending_2fa_challenges WHERE user_id = ?1 AND verified = 0 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(uid)
      .first<{
        challenge_id: string;
        auth_time: number;
        expires_at: number;
        attempt_count: number;
        verified: number;
      }>()
      .catch(() => null);

    if (pendingChallenge && nowMs > Number(pendingChallenge.expires_at)) {
      return jsonResponse(
        {
          ok: false,
          error: 'Your 5-minute login verification window has expired. Please sign in again.',
          code: 'PENDING_2FA_EXPIRED',
        },
        401
      );
    }

    if (pendingChallenge && Number(pendingChallenge.attempt_count || 0) >= MAX_2FA_FAILURES_PER_WINDOW) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many failed attempts for this login session. Please sign in again.',
          code: 'CHALLENGE_LOCKED',
        },
        429
      );
    }

    const factorRes = await verifyAny2faFactor({
      rawCode: String(body.code || ''),
      methodHint: body.method,
      allowBackupCode: true,
    });

    if (!factorRes.valid) {
      const [userFails] = await Promise.all([
        record2faFailedAttempt(userRateKey),
        record2faFailedAttempt(ipRateKey),
      ]);

      if (pendingChallenge) {
        await db
          .prepare('UPDATE pending_2fa_challenges SET attempt_count = ?1 WHERE challenge_id = ?2')
          .bind(Number(pendingChallenge.attempt_count || 0) + 1, pendingChallenge.challenge_id)
          .run()
          .catch(() => {});
      }

      if (userFails >= MAX_2FA_FAILURES_PER_WINDOW) {
        await logSecurityAuditEvent({
          db,
          userId: uid,
          eventType: 'failed_attempt_burst',
          ipHash,
          details: { attempts: userFails, context: '2fa_login_verify' },
          nowMs,
        });
      }

      return jsonResponse(
        {
          ok: false,
          error: 'Invalid code',
          code: factorRes.replayed ? 'CODE_ALREADY_USED' : 'INVALID_CODE',
        },
        400
      );
    }

    await clear2faRateLimit(userRateKey);

    // Mark pending challenge as verified
    await db
      .prepare('UPDATE pending_2fa_challenges SET verified = 1 WHERE user_id = ?1')
      .bind(uid)
      .run()
      .catch(() => {});

    // Mark session verified in `email_verification_sessions`
    const nowSec = Math.floor(nowMs / 1000);
    const verifiedAuthTime = Math.max(tokenAuthTime, nowSec);
    await db
      .prepare(
        `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(uid, emailHash, 1, verifiedAuthTime, nowMs, nowMs)
      .run();

    let extraHeaders: Record<string, string> | undefined;
    let trustedDeviceToken: string | undefined;
    if (body.rememberDevice === true) {
      trustedDeviceToken = generateTrustedDeviceToken();
      const tdHash = await hashTrustedDeviceToken(trustedDeviceToken, secret);
      const tdId = `tdev_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
      const tdExpires = nowMs + TRUSTED_DEVICE_TTL_MS;
      const ua = (request.headers.get('User-Agent') || '').slice(0, 250);
      await db
        .prepare(
          `INSERT INTO trusted_devices (id, user_id, token_hash, user_agent, ip_hash, created_at, last_used_at, expires_at, revoked)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(tdId, uid, tdHash, ua, ipHash, nowMs, nowMs, tdExpires, 0)
        .run()
        .catch(() => {});
      extraHeaders = {
        'Set-Cookie': buildTrustedDeviceCookieHeader(trustedDeviceToken, TRUSTED_DEVICE_MAX_AGE_SECONDS),
      };
    }

    return jsonResponse(
      {
        ok: true,
        verified: true,
        usedMethod: factorRes.usedMethod,
        ...(trustedDeviceToken ? { trustedDeviceToken } : {}),
      },
      200,
      extraHeaders
    );
  }

  // ─── 12. POST /api/auth/2fa/devices/revoke-all ("Sign out of all devices") ───
  if (subPath === '2fa/devices/revoke-all' && request.method === 'POST') {
    await db
      .prepare('UPDATE trusted_devices SET revoked = 1 WHERE user_id = ?1')
      .bind(uid)
      .run();

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: 'trusted_devices_revoked',
      ipHash,
      details: { action: 'sign_out_all_devices' },
      nowMs,
    });

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, uid, nowMs).catch(() => null);
    return jsonResponse(
      {
        ok: true,
        revoked: true,
        ...(updatedStatus
          ? {
              ...updatedStatus,
              emailCodeEnabled: Boolean(updatedStatus.email2faEnabled),
              rememberedDevices: Number(updatedStatus.trustedDevicesCount || 0),
            }
          : { rememberedDevices: 0, trustedDevicesCount: 0, lastChangedAt: nowMs }),
      },
      200,
      {
        'Set-Cookie': buildTrustedDeviceCookieHeader('', 0),
      }
    );
  }

  // ─── 13. POST /api/auth/2fa/recovery/request (Send Email Code for 24-Hour 2FA Recovery) ───
  if (subPath === '2fa/recovery/request' && request.method === 'POST') {
    if (!email || !email.includes('@')) {
      return jsonResponse(
        { ok: false, error: 'A verified account email is required for recovery.', code: 'NO_EMAIL' },
        400
      );
    }

    // Enforce 60s resend cooldown and 5/hr rate limits
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
          error: `Please wait ${retryAfterSeconds}s before requesting another recovery code.`,
          code: 'RATE_LIMITED_COOLDOWN',
          retryAfterSeconds,
        },
        429
      );
    }

    const rawCode = generateSixDigitCode();
    const codeHash = await hashVerificationCode({
      secret,
      userId: uid,
      purpose: '2fa_recovery',
      code: rawCode,
    });

    await db
      .prepare(
        'UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND purpose = ?2 AND used = 0'
      )
      .bind(uid, '2fa_recovery')
      .run();

    const codeId = `evc_${nowMs}_${generateFallbackLinkToken().slice(0, 12)}`;
    const expiresAt = nowMs + CODE_TTL_MS;
    await db
      .prepare(
        `INSERT INTO email_verification_codes (
          id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at, ip_hash
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      )
      .bind(codeId, uid, emailHash, '2fa_recovery', codeHash, null, tokenAuthTime, expiresAt, 0, 0, nowMs, ipHash)
      .run();

    const emailContent = buildVerificationEmailContent({
      code: rawCode,
      purpose: '2fa_recovery',
      studentName,
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
        purpose: '2fa_recovery',
        userId: uid,
      },
      env
    );

    if (!sendResult.ok) {
      await db
        .prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?1')
        .bind(codeId)
        .run();
      return jsonResponse(
        { ok: false, error: sendResult.error || 'Could not send recovery email.', code: 'EMAIL_SEND_FAILED' },
        502
      );
    }

    const sendLogId = `evsl_${nowMs}_${generateFallbackLinkToken().slice(0, 10)}`;
    await db
      .prepare(
        `INSERT INTO email_verification_send_logs (id, user_id, email_hash, ip_hash, purpose, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(sendLogId, uid, emailHash, ipHash, '2fa_recovery', nowMs)
      .run();

    return jsonResponse({
      ok: true,
      maskedEmail,
      expiresInSeconds: Math.floor(CODE_TTL_MS / 1000),
      cooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    });
  }

  // ─── 14. POST /api/auth/2fa/recovery/confirm (Confirm Recovery Email Code -> Schedule 24h Disable) ───
  if (subPath === '2fa/recovery/confirm' && request.method === 'POST') {
    let body: { code?: string } = {};
    try {
      body = (await request.json()) as { code?: string };
    } catch {
      body = {};
    }

    const rawCode = String(body.code || '').trim();
    if (!/^\d{6}$/.test(rawCode)) {
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    const rows = await db
      .prepare(
        'SELECT id, code_hash, expires_at, attempt_count, used FROM email_verification_codes WHERE user_id = ?1 AND purpose = ?2 AND used = 0 ORDER BY created_at DESC LIMIT 1'
      )
      .bind(uid, '2fa_recovery')
      .all<{
        id: string;
        code_hash: string;
        expires_at: number;
        attempt_count: number;
        used: number;
      }>();

    const active = rows.results?.[0];
    if (!active || Number(active.used) !== 0 || nowMs > Number(active.expires_at) || Number(active.attempt_count) >= MAX_CODE_ATTEMPTS) {
      return jsonResponse({ ok: false, error: 'Invalid or expired code', code: 'INVALID_CODE' }, 400);
    }

    const expectedHash = await hashVerificationCode({
      secret,
      userId: uid,
      purpose: '2fa_recovery',
      code: rawCode,
    });

    if (!constantTimeEqual(active.code_hash, expectedHash)) {
      const nextAtt = Number(active.attempt_count || 0) + 1;
      const lock = nextAtt >= MAX_CODE_ATTEMPTS ? 1 : 0;
      await db
        .prepare('UPDATE email_verification_codes SET attempt_count = ?1, used = ?2 WHERE id = ?3')
        .bind(nextAtt, lock, active.id)
        .run();
      return jsonResponse({ ok: false, error: 'Invalid code', code: 'INVALID_CODE' }, 400);
    }

    await db
      .prepare('UPDATE email_verification_codes SET used = 1 WHERE user_id = ?1 AND purpose = ?2 AND used = 0')
      .bind(uid, '2fa_recovery')
      .run();

    const recoveryDisableAt = nowMs + RECOVERY_COOLING_OFF_MS;
    await db
      .prepare(
        'UPDATE user_2fa SET recovery_requested_at = ?1, recovery_disable_at = ?2, updated_at = ?3 WHERE user_id = ?4'
      )
      .bind(nowMs, recoveryDisableAt, nowMs, uid)
      .run();

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: '2fa_recovery_requested',
      ipHash,
      details: { recoveryDisableAt },
      nowMs,
    });

    await sendSecurityNotificationEmail({
      to: email,
      userId: uid,
      studentName,
      title: 'Two-step verification recovery requested (24-hour wait)',
      message:
        'A request to turn off two-step verification was confirmed using your email. For your protection, two-step verification will automatically turn off in 24 hours. If you did not request this, sign in and cancel the recovery request immediately.',
      eventType: '2fa_recovery_requested',
      env,
      senderOverride: opts.emailSenderOverride,
    });

    return jsonResponse({
      ok: true,
      recoveryRequestedAt: nowMs,
      recoveryDisableAt,
    });
  }

  // ─── 15. POST /api/auth/2fa/recovery/cancel (Cancel Pending 24h Recovery) ───
  if (subPath === '2fa/recovery/cancel' && request.method === 'POST') {
    await db
      .prepare(
        'UPDATE user_2fa SET recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
      )
      .bind(nowMs, uid)
      .run();

    await logSecurityAuditEvent({
      db,
      userId: uid,
      eventType: '2fa_recovery_cancelled',
      ipHash,
      details: {},
      nowMs,
    });

    return jsonResponse({ ok: true, cancelled: true });
  }

  // ─── 16. GET /api/auth/admin/2fa-status (Admin Users 2FA Status & Audit Logs, Never Any Secret) ───
  if (subPath === 'admin/2fa-status' && request.method === 'GET') {
    const caller = await resolveCurrentUser({
      request,
      env,
      db,
      secret,
      tokenVerifierOverride: opts.tokenVerifierOverride,
    });
    if (!caller) {
      return jsonResponse(
        { ok: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' },
        401
      );
    }
    if (!caller.isAdminOrAbove || !caller.sessionVerified) {
      return jsonResponse(
        { ok: false, error: 'Forbidden: Admin access required.', code: 'FORBIDDEN' },
        403
      );
    }

    const targetUidFilter = (url.searchParams.get('uid') || '').trim();
    const rawUidsList = (url.searchParams.get('uids') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const uidsToResolve = new Set<string>(rawUidsList);
    if (targetUidFilter) {
      uidsToResolve.add(targetUidFilter);
    }
    uidsToResolve.add(caller.uid);

    const [statusByUid, d1UsernamesRes, d1RolesRes, d1ProBadgesRes] = await Promise.all([
      getBatchUsersTwoFactorStatusFromD1(db, Array.from(uidsToResolve), nowMs),
      db
        .prepare(
          'SELECT username_lower, username_display, uid, account_type, email, created_at, updated_at FROM user_usernames ORDER BY created_at DESC LIMIT 500'
        )
        .all<{
          username_lower: string;
          username_display: string;
          uid: string;
          account_type: string;
          email?: string;
          created_at: number;
          updated_at: number;
        }>()
        .catch(() => ({ results: [] })),
      db
        .prepare('SELECT uid, email, role, custom_role, is_posting_banned, updated_at FROM user_roles')
        .all<{
          uid: string;
          email: string;
          role: string;
          custom_role: string | null;
          is_posting_banned: number;
          updated_at: number;
        }>()
        .catch(() => ({ results: [] })),
      db
        .prepare('SELECT user_id, design, visible FROM user_pro_badge')
        .all<{ user_id: string; design: string; visible: number }>()
        .catch(() => ({ results: [] })),
    ]);

    const proBadgesByUid: Record<string, { design: string; visible: boolean }> = {};
    for (const pb of d1ProBadgesRes.results || []) {
      if (pb.user_id) {
        proBadgesByUid[String(pb.user_id)] = {
          design: String(pb.design || 'ember'),
          visible: Number(pb.visible) !== 0,
        };
      }
    }

    const rolesByUid = new Map<string, { role: string; customRole: string | null; isPostingBanned: boolean }>();
    for (const r of d1RolesRes.results || []) {
      if (r.uid) {
        rolesByUid.set(String(r.uid), {
          role: String(r.role || 'student'),
          customRole: r.custom_role || null,
          isPostingBanned: Boolean(r.is_posting_banned),
        });
      }
    }

    // Ensure every D1 registered account also has a resolved 2FA summary in statusByUid
    const d1Users: Array<{
      uid: string;
      username: string;
      displayName: string;
      email: string;
      accountType: 'guest' | 'registered';
      role: string;
      createdAt: number;
      updatedAt: number;
      twoFactorStatus: UserTwoFactorStatusSummary;
      proBadgeDesign?: string;
      proBadgeVisible?: boolean;
    }> = [];

    for (const u of d1UsernamesRes.results || []) {
      const uid = String(u.uid || '').trim();
      if (!uid || uid.startsWith('bot_')) continue;
      if (!statusByUid[uid]) {
        statusByUid[uid] = computeUserTwoFactorStatusSummary({
          userId: uid,
          twoFaRow: null,
          backupCodesRemaining: 0,
          trustedDevicesCount: 0,
          nowMs,
        });
      }
      // Exclude ephemeral 6-digit test run artifacts from the default directory unless explicitly queried
      const isEphemeralTestRow = /^(?:sa1|sa2|reg|utotp|uoff|urec)_\d{6}$/i.test(uid);
      if (isEphemeralTestRow && !uidsToResolve.has(uid)) continue;

      const roleInfo = rolesByUid.get(uid);
      const rawEmail = String(u.email || '').trim().toLowerCase();
      const rawAccType = String(u.account_type || 'registered');
      const isSwapped = rawAccType.includes('@') && /^\d{10,}$/.test(rawEmail);
      const cleanEmail = isSwapped ? rawAccType.toLowerCase() : rawEmail;
      const cleanAccType = (isSwapped ? 'registered' : rawAccType) === 'guest' ? 'guest' : 'registered';
      const usernameDisplay = String(u.username_display || u.username_lower || uid);

      let inferredRole = roleInfo?.role || u.role || 'student';
      if (
        uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
        uid === 'uid_superadmin_1' ||
        uid === 'uid_superadmin_2' ||
        /^(?:sa1|sa2)_/i.test(uid)
      ) {
        inferredRole = 'admin';
      } else if (uid === 'uid_regular_admin' || /^reg_/i.test(uid)) {
        inferredRole = 'admin';
      }

      const pbEntry = proBadgesByUid[uid];
      d1Users.push({
        uid,
        username: usernameDisplay,
        displayName: usernameDisplay,
        email: cleanEmail,
        accountType: cleanAccType,
        role: inferredRole,
        createdAt: Number(u.created_at || nowMs),
        updatedAt: Number(u.updated_at || u.created_at || nowMs),
        twoFactorStatus: statusByUid[uid],
        proBadgeDesign: pbEntry ? pbEntry.design : 'ember',
        proBadgeVisible: pbEntry ? pbEntry.visible : true,
      });
    }

    const callerStatus =
      statusByUid[caller.uid] || (await getUserTwoFactorStatusFromD1(db, caller.uid, nowMs));
    const canManage2fa = canCallerManageOthers2fa(caller, env);

    let targetStatus: UserTwoFactorStatusSummary | null = null;
    let targetIsSuperAdmin = false;
    let targetIsSelf = false;
    if (targetUidFilter) {
      targetStatus =
        statusByUid[targetUidFilter] ||
        (await getUserTwoFactorStatusFromD1(db, targetUidFilter, nowMs));
      statusByUid[targetUidFilter] = targetStatus;
      targetIsSelf = targetUidFilter === caller.uid;
      targetIsSuperAdmin = await isTargetAccountSuperAdmin({
        db,
        targetUid: targetUidFilter,
        env,
      });
    }

    const auditLogsRes = targetUidFilter
      ? await db
          .prepare(
            'SELECT id, user_id, actor_id, event_type, ip_hash, details_json, created_at FROM security_audit_logs WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50'
          )
          .bind(targetUidFilter)
          .all<{
            id: string;
            user_id: string;
            actor_id: string;
            event_type: string;
            ip_hash: string;
            details_json: string;
            created_at: number;
          }>()
          .catch(() => ({ results: [] }))
      : await db
          .prepare(
            'SELECT id, user_id, actor_id, event_type, ip_hash, details_json, created_at FROM security_audit_logs ORDER BY created_at DESC LIMIT 100'
          )
          .all<{
            id: string;
            user_id: string;
            actor_id: string;
            event_type: string;
            ip_hash: string;
            details_json: string;
            created_at: number;
          }>()
          .catch(() => ({ results: [] }));

    const auditLogs = (auditLogsRes.results || []).map((l) => ({
      id: l.id,
      userId: l.user_id,
      actorId: l.actor_id,
      eventType: l.event_type,
      details: (() => {
        try {
          const parsed = JSON.parse(l.details_json || '{}');
          if (parsed && typeof parsed === 'object') {
            delete parsed.secret;
            delete parsed.encrypted_secret;
            delete parsed.pending_encrypted_secret;
            delete parsed.code_hash;
            delete parsed.token_hash;
          }
          return parsed;
        } catch {
          return {};
        }
      })(),
      createdAt: Number(l.created_at),
    }));

    return jsonResponse({
      ok: true,
      users: statusByUid,
      statusByUid,
      users2fa: statusByUid,
      proBadgesByUid,
      d1Users,
      canManage2fa,
      callerHas2fa: callerStatus.twoFactorEnabled,
      callerTotpEnabled: callerStatus.totpEnabled,
      callerEmail2faEnabled: callerStatus.email2faEnabled,
      ...(targetStatus
        ? {
            ...targetStatus,
            userStatus: targetStatus,
            targetIsSuperAdmin,
            targetIsSelf,
            canModifyTarget: canManage2fa && !targetIsSelf && !targetIsSuperAdmin,
          }
        : {}),
      auditLogs,
    });
  }

  // ─── 17. POST /api/auth/admin/reset-2fa & /api/auth/admin/2fa-action (Super Admin 2FA Controls) ───
  if (
    (subPath === 'admin/reset-2fa' || subPath === 'admin/2fa-action') &&
    request.method === 'POST'
  ) {
    const caller = await resolveCurrentUser({
      request,
      env,
      db,
      secret,
      tokenVerifierOverride: opts.tokenVerifierOverride,
    });
    if (!caller || !caller.sessionVerified || !canCallerManageOthers2fa(caller, env)) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Forbidden: Only a Super Admin can reset or change another user's two-step verification.",
          code: 'FORBIDDEN',
        },
        403
      );
    }

    // Per-admin rate limits (max 10 actions per 15 min, max 5 failed step-up attempts per 15 min)
    const adminActionRateKey = `admin_2fa_action:${caller.uid}`;
    const adminStepUpFailRateKey = `admin_2fa_stepup_fail:${caller.uid}`;
    if (await check2faRateLimit(adminStepUpFailRateKey)) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many failed admin step-up verification attempts. Please wait 15 minutes.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }

    const actionRateRow = await db
      .prepare(
        'SELECT attempts, window_start_ms, blocked_until_ms FROM login_rate_limits WHERE rate_key = ?1 LIMIT 1'
      )
      .bind(adminActionRateKey)
      .first<{ attempts: number; window_start_ms: number; blocked_until_ms: number | null }>()
      .catch(() => null);
    if (
      actionRateRow &&
      ((actionRateRow.blocked_until_ms && nowMs < Number(actionRateRow.blocked_until_ms)) ||
        (nowMs - Number(actionRateRow.window_start_ms) <= LOGIN_RATE_LIMIT_WINDOW_MS &&
          Number(actionRateRow.attempts || 0) >= 10))
    ) {
      return jsonResponse(
        {
          ok: false,
          error: 'Admin two-step verification action rate limit reached. Please wait 15 minutes.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }

    let body: {
      action?: string;
      targetUid?: string;
      targetEmail?: string;
      reason?: string;
      identityVerified?: boolean;
      checklistConfirmed?: boolean;
      checklist?: string[];
      adminPassword?: string;
      password?: string;
      currentPassword?: string;
      adminTwoFactorCode?: string;
      twoFactorCode?: string;
      code?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const rawAction = String(body.action || 'reset')
      .trim()
      .toLowerCase();

    if (
      rawAction === 'enable_totp' ||
      rawAction === 'enable_authenticator' ||
      rawAction === 'setup_totp'
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Admins cannot turn on an authenticator app for another user because that would give the admin access to the user's secret.",
          code: 'CANNOT_ENABLE_TOTP_FOR_USER',
        },
        400
      );
    }

    const validActions = new Set([
      'reset',
      'approve_recovery',
      'cancel_recovery',
      'enable_email_2fa',
    ]);
    if (!validActions.has(rawAction)) {
      return jsonResponse(
        {
          ok: false,
          error: `Unsupported admin 2FA action: ${rawAction}`,
          code: 'INVALID_ACTION',
        },
        400
      );
    }

    const action = rawAction as
      | 'reset'
      | 'approve_recovery'
      | 'cancel_recovery'
      | 'enable_email_2fa';

    const targetUid = String(body.targetUid || '').trim();
    if (!targetUid) {
      return jsonResponse(
        { ok: false, error: 'targetUid is required.', code: 'MISSING_FIELDS' },
        400
      );
    }

    // Super admin cannot reset or modify themselves or another super admin through this UI/API
    if (targetUid === caller.uid) {
      return jsonResponse(
        {
          ok: false,
          error:
            'Super admins cannot reset or modify their own two-step verification through the admin UI. Use Settings > Security or the manual Cloudflare console recovery steps.',
          code: 'CANNOT_MODIFY_SELF_2FA',
        },
        403
      );
    }

    const existingTarget = await db
      .prepare(
        'SELECT user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, last_used_step, recovery_requested_at, recovery_disable_at, created_at FROM user_2fa WHERE user_id = ?1 LIMIT 1'
      )
      .bind(targetUid)
      .first<{
        user_id: string;
        email: string;
        totp_enabled: number;
        email_2fa_enabled: number;
        encrypted_secret: string | null;
        last_used_step: number;
        recovery_requested_at: number | null;
        recovery_disable_at: number | null;
        created_at: number;
      }>()
      .catch(() => null);

    let resolvedTargetEmail = String(
      body.targetEmail || existingTarget?.email || ''
    )
      .trim()
      .toLowerCase();

    if (!resolvedTargetEmail) {
      const roleRow = await db
        .prepare('SELECT email FROM user_roles WHERE uid = ?1 LIMIT 1')
        .bind(targetUid)
        .first<{ email?: string }>()
        .catch(() => null);
      if (roleRow?.email) {
        resolvedTargetEmail = String(roleRow.email).trim().toLowerCase();
      }
    }
    if (!resolvedTargetEmail) {
      const unameRow = await db
        .prepare('SELECT email FROM user_usernames WHERE uid = ?1 LIMIT 1')
        .bind(targetUid)
        .first<{ email?: string }>()
        .catch(() => null);
      if (unameRow?.email) {
        resolvedTargetEmail = String(unameRow.email).trim().toLowerCase();
      }
    }

    const targetIsSuper = await isTargetAccountSuperAdmin({
      db,
      targetUid,
      targetEmail: resolvedTargetEmail,
      env,
    });
    if (targetIsSuper) {
      return jsonResponse(
        {
          ok: false,
          error:
            'Cannot reset or modify two-step verification for a Super Admin account through the admin UI. Use the manual Cloudflare console recovery steps.',
          code: 'CANNOT_MODIFY_SUPERADMIN_2FA',
        },
        403
      );
    }

    // 1. Require a non-empty free-text reason
    const cleanReason = String(body.reason || '').trim();
    if (cleanReason.length < 3) {
      return jsonResponse(
        {
          ok: false,
          error: 'A reason is required to perform this security action.',
          code: 'REASON_REQUIRED',
        },
        400
      );
    }

    // 2. Require the identity verification checklist to be ticked
    const checklistConfirmed =
      body.identityVerified === true || body.checklistConfirmed === true;
    if (!checklistConfirmed) {
      return jsonResponse(
        {
          ok: false,
          error:
            "You must confirm the identity verification checklist (\"I verified the person's identity by another method\") before proceeding.",
          code: 'CHECKLIST_REQUIRED',
        },
        400
      );
    }

    // 3. Step-up check: Admin must re-enter their own password
    const rawAdminPassword = String(
      body.adminPassword ?? body.password ?? body.currentPassword ?? ''
    );
    if (!rawAdminPassword.trim()) {
      return jsonResponse(
        {
          ok: false,
          error: 'Please re-enter your admin password to confirm this action.',
          code: 'ADMIN_PASSWORD_REQUIRED',
        },
        401
      );
    }

    const passwordCheck = await verifyUserCurrentPasswordOrFreshGoogle({
      verifiedToken,
      email: caller.email || email,
      password: rawAdminPassword,
      env,
      passwordVerifierOverride: opts.passwordVerifierOverride,
      nowMs,
    });
    if (!passwordCheck.ok) {
      const fails = await record2faFailedAttempt(adminStepUpFailRateKey);
      if (fails >= MAX_2FA_FAILURES_PER_WINDOW) {
        await logSecurityAuditEvent({
          db,
          userId: targetUid,
          actorId: caller.uid,
          eventType: 'failed_attempt_burst',
          ipHash,
          details: { attempts: fails, context: 'admin_2fa_stepup_password' },
          nowMs,
        });
      }
      return jsonResponse(
        {
          ok: false,
          error: 'Invalid admin password. Step-up verification failed.',
          code: 'INVALID_ADMIN_PASSWORD',
        },
        401
      );
    }

    // 4. Step-up check: If the admin has 2FA enabled on their own account, require their 2FA code too
    const caller2faStatus = await getUserTwoFactorStatusFromD1(db, caller.uid, nowMs);
    if (caller2faStatus.twoFactorEnabled) {
      const rawAdminCode = String(
        body.adminTwoFactorCode ?? body.twoFactorCode ?? body.code ?? ''
      ).trim();
      if (!rawAdminCode) {
        return jsonResponse(
          {
            ok: false,
            error:
              'Your admin account has two-step verification enabled. Please enter your authenticator or two-step code to confirm.',
            code: 'ADMIN_2FA_CODE_REQUIRED',
          },
          401
        );
      }
      const adminFactorRes = await verifyAny2faFactor({
        rawCode: rawAdminCode,
        allowBackupCode: true,
      });
      if (!adminFactorRes.valid) {
        const fails = await record2faFailedAttempt(adminStepUpFailRateKey);
        if (fails >= MAX_2FA_FAILURES_PER_WINDOW) {
          await logSecurityAuditEvent({
            db,
            userId: targetUid,
            actorId: caller.uid,
            eventType: 'failed_attempt_burst',
            ipHash,
            details: { attempts: fails, context: 'admin_2fa_stepup_code' },
            nowMs,
          });
        }
        return jsonResponse(
          {
            ok: false,
            error: 'Invalid admin two-step verification code.',
            code: 'INVALID_ADMIN_2FA_CODE',
          },
          401
        );
      }
    }

    await clear2faRateLimit(adminStepUpFailRateKey);

    // Record per-admin action rate counter
    const expiredActionWindow =
      !actionRateRow || nowMs - Number(actionRateRow.window_start_ms) > LOGIN_RATE_LIMIT_WINDOW_MS;
    const nextActionCount = expiredActionWindow ? 1 : Number(actionRateRow.attempts || 0) + 1;
    const nextActionWinStart = expiredActionWindow ? nowMs : Number(actionRateRow.window_start_ms);
    const nextActionBlockedUntil =
      nextActionCount >= 10 ? nowMs + LOGIN_RATE_LIMIT_WINDOW_MS : null;
    await db
      .prepare(
        `INSERT OR REPLACE INTO login_rate_limits (rate_key, attempts, window_start_ms, blocked_until_ms, updated_at_ms)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(
        adminActionRateKey,
        nextActionCount,
        nextActionWinStart,
        nextActionBlockedUntil,
        nowMs
      )
      .run()
      .catch(() => {});

    const nowSec = Math.max(1, Math.floor(nowMs / 1000));
    const formattedTimeUtc = new Date(nowMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    let auditEventType = 'admin_2fa_reset';
    let emailTitle = 'Two-step verification was reset by an administrator';
    let emailBodyMessage = `Two-step verification on your Boardly account was reset by an administrator on ${formattedTimeUtc}. All active sessions and trusted devices were signed out. You can now sign in with your password and set up two-step verification again in Settings > Security. If you did not request this reset, please change your password and turn two-step verification back on immediately.`;

    if (action === 'reset' || action === 'approve_recovery') {
      if (
        action === 'approve_recovery' &&
        (!existingTarget || !existingTarget.recovery_disable_at || Number(existingTarget.recovery_disable_at) <= nowMs)
      ) {
        return jsonResponse(
          {
            ok: false,
            error: 'This user does not have a pending two-step recovery request to approve.',
            code: 'NO_PENDING_RECOVERY',
          },
          400
        );
      }

      // Ensure user_2fa and email_verification_sessions rows exist before running the atomic D1 batch
      if (!existingTarget) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO user_2fa (
               user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
               last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
             ) VALUES (?1, ?2, 0, 0, NULL, NULL, 0, NULL, NULL, ?3, ?4)`
          )
          .bind(targetUid, resolvedTargetEmail, nowMs, nowMs)
          .run()
          .catch(() => {});
      }

      const existingSessionRow = await db
        .prepare('SELECT user_id FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1')
        .bind(targetUid)
        .first<{ user_id: string }>()
        .catch(() => null);
      if (!existingSessionRow) {
        const targetEmailHash = await hashIdentifier(
          secret,
          'email',
          resolvedTargetEmail || targetUid
        );
        await db
          .prepare(
            `INSERT OR REPLACE INTO email_verification_sessions (user_id, email_hash, email_verified, verified_auth_time, verified_at, updated_at)
             VALUES (?1, ?2, 1, ?3, ?4, ?5)`
          )
          .bind(targetUid, targetEmailHash, -nowSec, nowMs, nowMs)
          .run()
          .catch(() => {});
      }

      // Execute ALL reset steps together in ONE D1 batch (all or nothing)
      await db.batch([
        db
          .prepare(
            'UPDATE user_2fa SET totp_enabled = 0, email_2fa_enabled = 0, encrypted_secret = NULL, pending_encrypted_secret = NULL, recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
          )
          .bind(nowMs, targetUid),
        db
          .prepare('DELETE FROM user_2fa_backup_codes WHERE user_id = ?1')
          .bind(targetUid),
        db
          .prepare('DELETE FROM pending_2fa_challenges WHERE user_id = ?1')
          .bind(targetUid),
        db
          .prepare('UPDATE trusted_devices SET revoked = 1 WHERE user_id = ?1')
          .bind(targetUid),
        db
          .prepare(
            'UPDATE email_verification_sessions SET verified_auth_time = ?1, updated_at = ?2 WHERE user_id = ?3'
          )
          .bind(-nowSec, nowMs, targetUid),
        db
          .prepare('UPDATE guest_sessions SET revoked = 1 WHERE uid = ?1')
          .bind(targetUid),
      ]);

      if (action === 'approve_recovery') {
        auditEventType = 'admin_2fa_recovery_approved';
        emailTitle = 'Two-step verification recovery was approved by an administrator';
        emailBodyMessage = `Your pending two-step verification recovery request was approved immediately by an administrator on ${formattedTimeUtc}. Two-step verification has been reset and all active sessions and trusted devices were signed out. You can now sign in with your password and set up two-step verification again in Settings > Security. If you did not ask for this, please change your password immediately.`;
      }
    } else if (action === 'cancel_recovery') {
      if (
        !existingTarget ||
        !existingTarget.recovery_disable_at ||
        Number(existingTarget.recovery_disable_at) <= nowMs
      ) {
        return jsonResponse(
          {
            ok: false,
            error: 'This user does not have a pending two-step recovery request to cancel.',
            code: 'NO_PENDING_RECOVERY',
          },
          400
        );
      }

      await db
        .prepare(
          'UPDATE user_2fa SET recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
        )
        .bind(nowMs, targetUid)
        .run();

      auditEventType = 'admin_2fa_recovery_cancelled';
      emailTitle = 'Pending two-step verification recovery was cancelled by an administrator';
      emailBodyMessage = `A pending request to turn off two-step verification on your Boardly account was cancelled by an administrator on ${formattedTimeUtc}. Your existing two-step verification remains active. If you did not recognize the recovery request, we recommend changing your password immediately.`;
    } else if (action === 'enable_email_2fa') {
      if (!resolvedTargetEmail || !resolvedTargetEmail.includes('@')) {
        return jsonResponse(
          {
            ok: false,
            error: 'Cannot turn on email code verification: this user has no verified email address.',
            code: 'TARGET_EMAIL_REQUIRED',
          },
          400
        );
      }

      if (existingTarget) {
        await db
          .prepare(
            'UPDATE user_2fa SET email_2fa_enabled = 1, recovery_requested_at = NULL, recovery_disable_at = NULL, updated_at = ?1 WHERE user_id = ?2'
          )
          .bind(nowMs, targetUid)
          .run();
      } else {
        await db
          .prepare(
            `INSERT OR REPLACE INTO user_2fa (
               user_id, email, totp_enabled, email_2fa_enabled, encrypted_secret, pending_encrypted_secret,
               last_used_step, recovery_requested_at, recovery_disable_at, updated_at, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
          )
          .bind(targetUid, resolvedTargetEmail, 0, 1, null, null, 0, null, null, nowMs, nowMs)
          .run();
      }

      auditEventType = 'admin_2fa_email_enabled';
      emailTitle = 'Email code two-step verification was turned on by an administrator';
      emailBodyMessage = `Email code two-step verification was turned on for your Boardly account by an administrator on ${formattedTimeUtc} to help protect your account. At your next sign-in, a 6-digit verification code will be sent to your verified email address. If you have questions or did not expect this, please review your security settings on Boardly.`;
    }

    const checklistItems = Array.isArray(body.checklist) && body.checklist.length > 0
      ? body.checklist.map((item) => String(item).slice(0, 120))
      : ["I verified the person's identity by another method"];

    await logSecurityAuditEvent({
      db,
      userId: targetUid,
      actorId: caller.uid,
      eventType: auditEventType,
      ipHash,
      details: {
        action,
        reason: cleanReason,
        identityVerified: true,
        checklist: checklistItems,
        adminEmail: caller.email,
      },
      nowMs,
    });

    if (resolvedTargetEmail && resolvedTargetEmail.includes('@')) {
      await sendSecurityNotificationEmail({
        to: resolvedTargetEmail,
        userId: targetUid,
        studentName: resolvedTargetEmail.split('@')[0] || 'Student',
        title: emailTitle,
        message: emailBodyMessage,
        eventType: auditEventType,
        env,
        senderOverride: opts.emailSenderOverride,
      });
    }

    const updatedStatus = await getUserTwoFactorStatusFromD1(db, targetUid, nowMs);
    const updatedLogsRes = await db
      .prepare(
        'SELECT id, user_id, actor_id, event_type, ip_hash, details_json, created_at FROM security_audit_logs WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50'
      )
      .bind(targetUid)
      .all<{
        id: string;
        user_id: string;
        actor_id: string;
        event_type: string;
        ip_hash: string;
        details_json: string;
        created_at: number;
      }>()
      .catch(() => ({ results: [] }));

    return jsonResponse({
      ok: true,
      action,
      reset: action === 'reset' || action === 'approve_recovery',
      targetUid,
      status: updatedStatus,
      ...updatedStatus,
      auditLogs: (updatedLogsRes.results || []).map((l) => ({
        id: l.id,
        userId: l.user_id,
        actorId: l.actor_id,
        eventType: l.event_type,
        details: (() => {
          try {
            return JSON.parse(l.details_json || '{}');
          } catch {
            return {};
          }
        })(),
        createdAt: Number(l.created_at),
      })),
    });
  }

  // ─── 18. GET & POST /api/auth/legal-consent (Record & Query Terms/Privacy Acceptance) ───
  if (subPath === 'legal-consent' && (request.method === 'GET' || request.method === 'POST')) {
    if (request.method === 'GET') {
      const queryUid = String(url.searchParams.get('userId') || '').trim();
      const queryVersion = String(url.searchParams.get('version') || '2026-11-08-v2.0').trim();
      if (!queryUid) {
        return jsonResponse({ ok: false, error: 'Missing userId.', code: 'MISSING_FIELDS' }, 400);
      }
      const row = await db
        .prepare(
          'SELECT id, user_id, account_type, document_version, action_context, accepted_at FROM legal_consent_records WHERE user_id = ?1 AND document_version = ?2 ORDER BY accepted_at DESC LIMIT 1'
        )
        .bind(queryUid, queryVersion)
        .first<{
          id: string;
          user_id: string;
          account_type: string;
          document_version: string;
          action_context: string;
          accepted_at: number;
        }>()
        .catch(() => null);

      return jsonResponse({
        ok: true,
        accepted: Boolean(row),
        acceptedAt: row ? Number(row.accepted_at) : null,
        documentVersion: row?.document_version || queryVersion,
      });
    }

    let body: {
      userId?: string;
      accountType?: string;
      documentVersion?: string;
      actionContext?: string;
      acceptedAt?: number;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
    }

    const userId = String(body.userId || '').trim();
    const documentVersion = String(body.documentVersion || '2026-11-08-v2.0').trim();
    const accountType = body.accountType === 'guest' || userId.startsWith('guest_') ? 'guest' : 'registered';
    const actionContext = String(body.actionContext || 'signup').trim().slice(0, 64);

    if (!userId || !documentVersion) {
      return jsonResponse(
        { ok: false, error: 'userId and documentVersion are required.', code: 'MISSING_FIELDS' },
        400
      );
    }

    const clientIp = extractClientIp(request);
    const consentIpHash = await hashIdentifier(secret, 'consent_ip', clientIp);
    const userAgent = String(request.headers.get('User-Agent') || '').slice(0, 256);
    const recordId = `lcr_${nowMs}_${generateRandomHex(8)}`;

    await db
      .prepare(
        `INSERT INTO legal_consent_records (id, user_id, account_type, document_version, action_context, ip_hash, user_agent, accepted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        recordId,
        userId,
        accountType,
        documentVersion,
        actionContext,
        consentIpHash,
        userAgent,
        nowMs
      )
      .run();

    return jsonResponse({
      ok: true,
      id: recordId,
      userId,
      accountType,
      documentVersion,
      acceptedAt: nowMs,
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

