import { COSMETICS_CATALOG } from '../../src/data/cosmeticsCatalog';

export interface D1Env {
  DB: any;
  R2_BUCKET?: any;
  FIREBASE_PROJECT_ID?: string;
  ALLOWED_ORIGIN?: string;
  SUPERADMIN_UIDS?: string;
  SUPERADMIN_EMAILS?: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'student' | 'captain' | 'admin' | 'superadmin';
  customRole: string | null;
  isPostingBanned: boolean;
  isCaptainOrAbove: boolean;
  isAdminOrAbove: boolean;
  isSuperAdmin: boolean;
}

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(message: string, code: string, status = 400) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const GOOGLE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const DEFAULT_SUPERADMIN_EMAILS = new Set([
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
]);

const DEFAULT_SUPERADMIN_UIDS = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
]);

let cachedJwks: any[] | null = null;
let cachedJwksExpiresAt = 0;
let migration002Ensured = false;

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

function decodeJwtPart(part: string): Record<string, any> {
  const bytes = base64UrlToUint8Array(part);
  const jsonStr = new TextDecoder().decode(bytes);
  return JSON.parse(jsonStr);
}

async function getGooglePublicJwks(): Promise<any[]> {
  const now = Date.now();
  if (cachedJwks && now < cachedJwksExpiresAt) {
    return cachedJwks;
  }

  const resp = await fetch(GOOGLE_JWK_URL, {
    cf: { cacheTtl: 3600, cacheEverything: true } as any,
  });
  if (!resp.ok) {
    throw new HttpError(`Failed to fetch Google JWKs: HTTP ${resp.status}`, 'JWK_FETCH_FAILED', 503);
  }

  let maxAgeSec = 3600;
  const cacheControl = resp.headers.get('cache-control') || '';
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (match && match[1]) {
    maxAgeSec = Math.max(300, parseInt(match[1], 10));
  }

  const data = (await resp.json()) as { keys?: any[] };
  cachedJwks = data.keys || [];
  cachedJwksExpiresAt = now + maxAgeSec * 1000;
  return cachedJwks;
}

export async function verifyFirebaseJwtToken(
  token: string,
  projectId: string
): Promise<{ uid: string; email: string; name: string; picture: string | null }> {
  if (!token || typeof token !== 'string') {
    throw new HttpError('Missing bearer token.', 'UNAUTHENTICATED', 401);
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new HttpError('Malformed JWT token.', 'INVALID_TOKEN', 401);
  }

  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);
  const signatureBytes = base64UrlToUint8Array(parts[2]);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new HttpError('Unsupported JWT algorithm or missing kid.', 'INVALID_TOKEN', 401);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec - 30) {
    throw new HttpError('Session token has expired. Please sign in again.', 'TOKEN_EXPIRED', 401);
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new HttpError('Token issued in the future.', 'INVALID_TOKEN', 401);
  }

  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) {
    throw new HttpError('Invalid token issuer.', 'INVALID_TOKEN', 401);
  }
  if (payload.aud !== projectId) {
    throw new HttpError('Invalid token audience.', 'INVALID_TOKEN', 401);
  }

  const uid = String(payload.sub || payload.user_id || '').trim();
  if (!uid) {
    throw new HttpError('Token missing subject UID.', 'INVALID_TOKEN', 401);
  }

  const jwks = await getGooglePublicJwks();
  let jwk = jwks.find((k: any) => k.kid === header.kid);
  if (!jwk) {
    cachedJwks = null;
    const freshJwks = await getGooglePublicJwks();
    jwk = freshJwks.find((k: any) => k.kid === header.kid);
  }
  if (!jwk) {
    throw new HttpError('Matching JWK public key not found.', 'INVALID_TOKEN', 401);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    signedData
  );

  if (!isValid) {
    throw new HttpError('Invalid token signature.', 'INVALID_TOKEN', 401);
  }

  return {
    uid,
    email: String(payload.email || '').trim().toLowerCase(),
    name: String(payload.name || payload.email?.split('@')[0] || 'Student').trim(),
    picture: payload.picture || null,
  };
}

export function getCorsHeaders(request: Request, env?: D1Env): Record<string, string> {
  const reqOrigin = request.headers.get('Origin') || '';
  const configuredOrigin = String(env?.ALLOWED_ORIGIN || 'https://boardly.cfd').trim();
  let allowOrigin = configuredOrigin;
  if (
    reqOrigin &&
    (reqOrigin === configuredOrigin ||
      reqOrigin.endsWith('.boardly.cfd') ||
      reqOrigin.endsWith('.pages.dev') ||
      reqOrigin.endsWith('.run.app') ||
      reqOrigin.startsWith('http://localhost:') ||
      reqOrigin.startsWith('http://127.0.0.1:'))
  ) {
    allowOrigin = reqOrigin;
  } else if (!reqOrigin) {
    allowOrigin = '*';
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(
  request: Request,
  env: D1Env | undefined,
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...getCorsHeaders(request, env),
    },
  });
}

export function errorResponse(
  request: Request,
  env: D1Env | undefined,
  error: string,
  code = 'BAD_REQUEST',
  status = 400
): Response {
  return jsonResponse(request, env, { ok: false, error, code }, status);
}

export function cleanStr(val: unknown, maxLen = 500, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s ? s.slice(0, maxLen) : fallback;
}

export function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toMillis(val: any, fallback = Date.now()): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    const asNum = Number(val);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
    const parsed = Date.parse(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (val && typeof val === 'object') {
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val._seconds === 'number') return val._seconds * 1000;
  }
  return fallback;
}

/**
 * Ensures all D1 tables from 002_move_firestore_to_d1.sql exist.
 * Uses only CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
 */
export async function ensureD1Migration002(db: any): Promise<void> {
  if (!db || migration002Ensured) return;
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT DEFAULT NULL,
        is_posting_banned INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        window_start INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS crews (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        university TEXT NOT NULL DEFAULT '',
        captain_uid TEXT NOT NULL,
        captain_name TEXT NOT NULL DEFAULT 'Captain',
        captain_email TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        member_count INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS crew_members (
        id TEXT PRIMARY KEY,
        crew_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        user_name TEXT NOT NULL DEFAULT 'Student',
        user_email TEXT NOT NULL DEFAULT '',
        user_avatar TEXT DEFAULT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0,
        UNIQUE(crew_id, user_uid)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        title TEXT NOT NULL,
        message TEXT NOT NULL DEFAULT '',
        link TEXT,
        author_id TEXT,
        author_name TEXT,
        author_avatar TEXT,
        author_frame TEXT,
        post_id TEXT,
        post_type TEXT,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        read INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        read_at INTEGER
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT 'Student',
        display_name TEXT NOT NULL DEFAULT 'Student',
        nickname TEXT DEFAULT NULL,
        username TEXT DEFAULT NULL,
        short_id TEXT DEFAULT NULL,
        photo_url TEXT DEFAULT NULL,
        avatar TEXT DEFAULT NULL,
        avatar_key TEXT DEFAULT NULL,
        avatar_variant TEXT DEFAULT NULL,
        avatar_url TEXT DEFAULT NULL,
        banner TEXT DEFAULT NULL,
        frame TEXT DEFAULT NULL,
        nameplate TEXT DEFAULT NULL,
        effect_id TEXT DEFAULT NULL,
        bio TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        accent TEXT NOT NULL DEFAULT '#E11D48',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT DEFAULT NULL,
        has_chosen_role INTEGER NOT NULL DEFAULT 0,
        plan TEXT NOT NULL DEFAULT 'free',
        is_premium INTEGER NOT NULL DEFAULT 0,
        premium_source TEXT DEFAULT NULL,
        plan_expires_at INTEGER DEFAULT NULL,
        premium_expires_at INTEGER DEFAULT NULL,
        academic_track TEXT DEFAULT NULL,
        university TEXT DEFAULT NULL,
        target_university TEXT DEFAULT NULL,
        target_exam TEXT DEFAULT NULL,
        test_date TEXT DEFAULT NULL,
        class_level TEXT NOT NULL DEFAULT '12',
        board TEXT NOT NULL DEFAULT 'Federal',
        subjects_json TEXT NOT NULL DEFAULT '[]',
        equipped_json TEXT NOT NULL DEFAULT '{}',
        badges_json TEXT NOT NULL DEFAULT '[]',
        redeemed_badges_json TEXT NOT NULL DEFAULT '[]',
        equipped_badges_json TEXT NOT NULL DEFAULT '[]',
        pinned_badges_json TEXT NOT NULL DEFAULT '[]',
        pinned_stamps_json TEXT NOT NULL DEFAULT '[]',
        seen_questions_json TEXT NOT NULL DEFAULT '{}',
        kobans INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        streak_freeze_active INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT DEFAULT NULL,
        total_questions_solved INTEGER NOT NULL DEFAULT 0,
        mcqs_solved INTEGER NOT NULL DEFAULT 0,
        score REAL NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        tests_completed INTEGER NOT NULL DEFAULT 0,
        followers_count INTEGER NOT NULL DEFAULT 0,
        following_count INTEGER NOT NULL DEFAULT 0,
        crew_id TEXT DEFAULT NULL,
        crew_name TEXT DEFAULT NULL,
        is_crew_member INTEGER NOT NULL DEFAULT 0,
        crew_status TEXT DEFAULT NULL,
        crew_referral_code TEXT DEFAULT NULL,
        referrer_ambassador_uid TEXT DEFAULT NULL,
        referrer_ambassador_id TEXT DEFAULT NULL,
        referrer_code TEXT DEFAULT NULL,
        ambassador_bonus_weeks INTEGER NOT NULL DEFAULT 0,
        welcomed INTEGER NOT NULL DEFAULT 0,
        welcomed_at INTEGER DEFAULT NULL,
        profile_completed INTEGER NOT NULL DEFAULT 0,
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        profile_completed_at INTEGER DEFAULT NULL,
        onboarding_completed_at INTEGER DEFAULT NULL,
        is_posting_banned INTEGER NOT NULL DEFAULT 0,
        suspended INTEGER NOT NULL DEFAULT 0,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS public_profiles (
        uid TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'Student',
        nickname TEXT DEFAULT NULL,
        username TEXT DEFAULT NULL,
        student_id TEXT NOT NULL DEFAULT '00000',
        short_id TEXT NOT NULL DEFAULT '00000',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT DEFAULT NULL,
        bio TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT '',
        accent TEXT NOT NULL DEFAULT '#E11D48',
        avatar TEXT DEFAULT NULL,
        avatar_key TEXT DEFAULT NULL,
        avatar_variant TEXT DEFAULT NULL,
        avatar_url TEXT DEFAULT NULL,
        photo_url TEXT DEFAULT NULL,
        banner TEXT DEFAULT NULL,
        frame TEXT DEFAULT NULL,
        nameplate TEXT DEFAULT NULL,
        effect_id TEXT DEFAULT NULL,
        equipped_json TEXT NOT NULL DEFAULT '{}',
        badges_json TEXT NOT NULL DEFAULT '[]',
        pinned_badges_json TEXT NOT NULL DEFAULT '[]',
        pinned_stamps_json TEXT NOT NULL DEFAULT '[]',
        crew_id TEXT DEFAULT NULL,
        crew_name TEXT DEFAULT NULL,
        rank_title TEXT DEFAULT NULL,
        streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        mcqs INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        score REAL NOT NULL DEFAULT 0,
        tests_completed INTEGER NOT NULL DEFAULT 0,
        followers_count INTEGER NOT NULL DEFAULT 0,
        following_count INTEGER NOT NULL DEFAULT 0,
        stats_json TEXT NOT NULL DEFAULT '{}',
        member_since INTEGER NOT NULL DEFAULT 0,
        last_active_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS usernames (
        username TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS wallets (
        uid TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        owned_json TEXT NOT NULL DEFAULT '[]',
        equipped_json TEXT NOT NULL DEFAULT '{}',
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_unlocked_items (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL DEFAULT '',
        price_paid INTEGER NOT NULL DEFAULT 0,
        unlocked_at INTEGER NOT NULL DEFAULT 0,
        UNIQUE(uid, item_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS wallet_ledger (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'purchase',
        amount INTEGER NOT NULL DEFAULT 0,
        balance_after INTEGER NOT NULL DEFAULT 0,
        item_id TEXT DEFAULT NULL,
        item_name TEXT DEFAULT NULL,
        month_key TEXT DEFAULT NULL,
        reason TEXT NOT NULL DEFAULT '',
        admin_email TEXT DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS store_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'avatar',
        type TEXT NOT NULL DEFAULT 'static',
        price_kobans INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        rarity TEXT DEFAULT 'common',
        description TEXT DEFAULT '',
        preview_color TEXT DEFAULT NULL,
        updated_by TEXT DEFAULT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS store_price_history (
        id TEXT PRIMARY KEY,
        changed_by TEXT NOT NULL,
        filter_summary TEXT NOT NULL DEFAULT '',
        affected_count INTEGER NOT NULL DEFAULT 0,
        mode TEXT NOT NULL DEFAULT 'single',
        changes_sample_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        description TEXT NOT NULL DEFAULT '',
        reward_type TEXT NOT NULL DEFAULT 'kobans',
        reward_value INTEGER NOT NULL DEFAULT 0,
        discount_percent INTEGER NOT NULL DEFAULT 0,
        max_uses INTEGER NOT NULL DEFAULT 0,
        used_count INTEGER NOT NULL DEFAULT 0,
        per_user_limit INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        expires_at INTEGER DEFAULT NULL,
        created_by TEXT DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS coupon_redemptions (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        uid TEXT NOT NULL,
        reward_type TEXT NOT NULL DEFAULT 'kobans',
        reward_value INTEGER NOT NULL DEFAULT 0,
        redeemed_at INTEGER NOT NULL DEFAULT 0,
        UNIQUE(code, uid)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS koban_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL DEFAULT '',
        user_name TEXT NOT NULL DEFAULT '',
        amount INTEGER NOT NULL DEFAULT 0,
        pkr_amount INTEGER NOT NULL DEFAULT 0,
        granted_amount INTEGER DEFAULT NULL,
        transaction_id TEXT NOT NULL DEFAULT '',
        payment_method TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT DEFAULT NULL,
        approved_by TEXT DEFAULT NULL,
        approved_at INTEGER DEFAULT NULL,
        rejected_by TEXT DEFAULT NULL,
        rejected_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL DEFAULT '',
        user_name TEXT NOT NULL DEFAULT '',
        plan TEXT NOT NULL DEFAULT 'pro',
        crew_id TEXT DEFAULT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        duration_months INTEGER NOT NULL DEFAULT 1,
        method TEXT NOT NULL DEFAULT '',
        transaction_id TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT DEFAULT NULL,
        approved_by TEXT DEFAULT NULL,
        approved_at INTEGER DEFAULT NULL,
        reviewed_by TEXT DEFAULT NULL,
        reviewed_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS practice_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Practice Session',
        mode TEXT NOT NULL DEFAULT 'practice',
        subject TEXT NOT NULL DEFAULT 'general',
        chapter TEXT DEFAULT NULL,
        weighted_chapter TEXT DEFAULT NULL,
        university TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        questions_json TEXT NOT NULL DEFAULT '[]',
        user_answers_json TEXT NOT NULL DEFAULT '{}',
        flagged_json TEXT NOT NULL DEFAULT '[]',
        score REAL NOT NULL DEFAULT 0,
        max_marks REAL NOT NULL DEFAULT 0,
        earned_marks REAL NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        wrong_answers INTEGER NOT NULL DEFAULT 0,
        unanswered INTEGER NOT NULL DEFAULT 0,
        percentage INTEGER NOT NULL DEFAULT 0,
        time_taken_seconds INTEGER NOT NULL DEFAULT 0,
        duration_seconds INTEGER NOT NULL DEFAULT 600,
        timed INTEGER NOT NULL DEFAULT 1,
        started_at INTEGER DEFAULT NULL,
        ends_at INTEGER DEFAULT NULL,
        submitted_at INTEGER DEFAULT NULL,
        regraded_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_daily_usage (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        date_key TEXT NOT NULL,
        tests_started INTEGER NOT NULL DEFAULT 0,
        practice_attempts INTEGER NOT NULL DEFAULT 0,
        questions_solved INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        ai_tutor_tokens INTEGER NOT NULL DEFAULT 0,
        arena_sessions INTEGER NOT NULL DEFAULT 0,
        subjects_json TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL DEFAULT 0,
        UNIQUE(uid, date_key)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_chapter_stats (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        chapter_slug TEXT NOT NULL,
        subject_slug TEXT NOT NULL DEFAULT 'general',
        correct INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0,
        UNIQUE(uid, chapter_slug)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_streaks (
        uid TEXT PRIMARY KEY,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        today_active INTEGER NOT NULL DEFAULT 0,
        today_pending INTEGER NOT NULL DEFAULT 1,
        active_days_count INTEGER NOT NULL DEFAULT 0,
        total_sessions INTEGER NOT NULL DEFAULT 0,
        last_active_pkt TEXT DEFAULT NULL,
        freeze_active INTEGER NOT NULL DEFAULT 0,
        freeze_used INTEGER NOT NULL DEFAULT 0,
        freeze_date TEXT DEFAULT NULL,
        history28_json TEXT NOT NULL DEFAULT '[]',
        last7_days_json TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_code TEXT NOT NULL DEFAULT '',
        referrer_uid TEXT NOT NULL DEFAULT '',
        referrer_short_id TEXT DEFAULT NULL,
        referred_uid TEXT NOT NULL,
        referred_email TEXT NOT NULL DEFAULT '',
        referred_name TEXT NOT NULL DEFAULT 'Student',
        referred_short_id TEXT DEFAULT NULL,
        track TEXT NOT NULL DEFAULT 'General Entrance',
        status TEXT NOT NULL DEFAULT 'activated',
        activated INTEGER NOT NULL DEFAULT 1,
        bonus_awarded INTEGER NOT NULL DEFAULT 1,
        signed_up_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS captains (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Captain',
        email TEXT NOT NULL DEFAULT '',
        university TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        referral_code TEXT NOT NULL DEFAULT '',
        captain_code TEXT NOT NULL DEFAULT '',
        points INTEGER NOT NULL DEFAULT 100,
        activated_referrals INTEGER NOT NULL DEFAULT 0,
        tier TEXT NOT NULL DEFAULT 'Bronze',
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS captain_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        whatsapp TEXT DEFAULT NULL,
        university TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        semester TEXT DEFAULT NULL,
        cgpa TEXT DEFAULT NULL,
        motivation TEXT NOT NULL DEFAULT '',
        experience TEXT DEFAULT NULL,
        social_links TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT DEFAULT NULL,
        approved_by TEXT DEFAULT NULL,
        approved_at INTEGER DEFAULT NULL,
        reviewed_by TEXT DEFAULT NULL,
        reviewed_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS crew_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        college TEXT NOT NULL DEFAULT '',
        target_exam TEXT DEFAULT NULL,
        promotion_plan TEXT DEFAULT NULL,
        why_join TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT DEFAULT NULL,
        approved_by TEXT DEFAULT NULL,
        approved_at INTEGER DEFAULT NULL,
        reviewed_by TEXT DEFAULT NULL,
        reviewed_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS name_requests (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        requested_name TEXT NOT NULL,
        current_display_name TEXT DEFAULT NULL,
        user_email TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by TEXT DEFAULT NULL,
        reviewed_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS student_reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL DEFAULT 'Student',
        user_email TEXT DEFAULT NULL,
        university TEXT DEFAULT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        comment TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by TEXT DEFAULT NULL,
        approved_at INTEGER DEFAULT NULL,
        reviewed_by TEXT DEFAULT NULL,
        reviewed_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS question_reports (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT 'other',
        comment TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL,
        user_email TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        resolved_by TEXT DEFAULT NULL,
        resolved_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        uid TEXT DEFAULT NULL,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'general',
        subject TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS app_config (
        config_key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL DEFAULT '{}',
        updated_by TEXT DEFAULT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS study_buddy_presence (
        id TEXT PRIMARY KEY,
        crew_id TEXT NOT NULL,
        uid TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT 'Student',
        short_id TEXT NOT NULL DEFAULT '00000',
        subject TEXT NOT NULL DEFAULT 'Mathematics',
        status TEXT NOT NULL DEFAULT 'studying',
        timer_minutes INTEGER NOT NULL DEFAULT 25,
        started_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS study_buddy_logs (
        id TEXT PRIMARY KEY,
        crew_id TEXT NOT NULL,
        uid TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT 'Student',
        action TEXT NOT NULL DEFAULT '',
        subject TEXT DEFAULT NULL,
        minutes INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS study_buddy_messages (
        id TEXT PRIMARY KEY,
        crew_id TEXT NOT NULL,
        uid TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT 'Student',
        short_id TEXT DEFAULT NULL,
        text TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
        id TEXT PRIMARY KEY,
        actor_uid TEXT NOT NULL,
        actor_email TEXT NOT NULL DEFAULT '',
        action TEXT NOT NULL,
        target_uid TEXT DEFAULT NULL,
        target_email TEXT DEFAULT NULL,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
    ]);
    migration002Ensured = true;
  } catch (err) {
    console.warn('[ensureD1Migration002] Notice:', err);
  }
}

/**
 * Checks write rate limit against rate_limits(rate_key, count, window_start).
 */
export async function checkRateLimitD1(
  db: any,
  key: string,
  maxRequests = 90,
  windowMs = 60000
): Promise<boolean> {
  if (!db) return true;
  const now = Date.now();
  try {
    const row = await db
      .prepare('SELECT count, window_start FROM rate_limits WHERE rate_key = ?1')
      .bind(key)
      .first();

    if (!row || now - Number(row.window_start) > windowMs) {
      await db
        .prepare(
          'INSERT INTO rate_limits (rate_key, count, window_start) VALUES (?1, 1, ?2) ON CONFLICT(rate_key) DO UPDATE SET count = 1, window_start = ?2'
        )
        .bind(key, now)
        .run();
      return true;
    }

    if (Number(row.count) >= maxRequests) {
      return false;
    }

    await db
      .prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?1')
      .bind(key)
      .run();
    return true;
  } catch {
    return true;
  }
}

/**
 * Authenticates request via Firebase ID token and reads role ONLY from D1 `user_roles`.
 */
export async function authenticateD1Request(
  request: Request,
  env: D1Env,
  requireAuth = true
): Promise<AuthenticatedUser | null> {
  if (!env?.DB) {
    throw new HttpError('Database binding (DB) is not configured.', 'DB_MISSING', 503);
  }
  await ensureD1Migration002(env.DB);

  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    if (!requireAuth) return null;
    throw new HttpError('Authentication required. Please sign in.', 'UNAUTHENTICATED', 401);
  }

  const token = authHeader.slice(7).trim();
  const projectId = String(env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316').trim();

  let decoded;
  try {
    decoded = await verifyFirebaseJwtToken(token, projectId);
  } catch (err: any) {
    if (!requireAuth) return null;
    if (err instanceof HttpError) throw err;
    throw new HttpError(err?.message || 'Invalid authentication token.', 'INVALID_TOKEN', 401);
  }

  let roleRow: Record<string, any> | null = await env.DB.prepare(
    'SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles WHERE uid = ?1'
  )
    .bind(decoded.uid)
    .first()
    .catch(() => null);

  const isBootstrapSuperadmin =
    DEFAULT_SUPERADMIN_EMAILS.has(decoded.email) || DEFAULT_SUPERADMIN_UIDS.has(decoded.uid);

  let role: 'student' | 'captain' | 'admin' | 'superadmin' =
    (roleRow?.role as any) || (isBootstrapSuperadmin ? 'superadmin' : 'student');

  if (!roleRow || (isBootstrapSuperadmin && role !== 'superadmin')) {
    const now = Date.now();
    const initialRole = isBootstrapSuperadmin ? 'superadmin' : roleRow?.role || 'student';
    role = initialRole as any;
    await env.DB.prepare(
      `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
       VALUES (?1, ?2, ?3, NULL, 0, ?4, ?4)
       ON CONFLICT(uid) DO UPDATE SET
         email = CASE WHEN ?2 != '' THEN ?2 ELSE user_roles.email END,
         role = CASE WHEN ?3 = 'superadmin' THEN 'superadmin' ELSE user_roles.role END,
         updated_at = ?4`
    )
      .bind(decoded.uid, decoded.email, initialRole, now)
      .run()
      .catch(() => {});
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    role,
    customRole: roleRow?.custom_role || null,
    isPostingBanned: Boolean(roleRow?.is_posting_banned),
    isCaptainOrAbove: ['captain', 'admin', 'superadmin'].includes(role),
    isAdminOrAbove: ['admin', 'superadmin'].includes(role),
    isSuperAdmin: role === 'superadmin',
  };
}

export function requireRoleD1(
  user: AuthenticatedUser | null,
  allowedRoles: Array<'student' | 'captain' | 'admin' | 'superadmin'>
): asserts user is AuthenticatedUser {
  if (!user) {
    throw new HttpError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (!allowedRoles.includes(user.role)) {
    throw new HttpError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      'FORBIDDEN',
      403
    );
  }
}

export function buildAuditLogStatement(
  db: any,
  actor: { uid: string; email: string },
  action: string,
  targetUid?: string | null,
  targetEmail?: string | null,
  details?: Record<string, any>
) {
  const id = `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const now = Date.now();
  return db
    .prepare(
      `INSERT INTO admin_audit_log (
        id, actor_uid, actor_email, action, target_uid, target_email, details_json, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    )
    .bind(
      id,
      actor.uid,
      actor.email || '',
      cleanStr(action, 120),
      targetUid ? cleanStr(targetUid, 128) : null,
      targetEmail ? cleanStr(targetEmail, 200) : null,
      JSON.stringify(details || {}),
      now
    );
}

/**
 * Looks up a store item's authoritative price and metadata from D1 `store_items`,
 * falling back to `COSMETICS_CATALOG` if not yet customized in D1.
 */
export async function lookupStoreItemAuthoritative(
  db: any,
  itemId: string
): Promise<{
  id: string;
  name: string;
  category: string;
  type: string;
  priceKobans: number;
  active: boolean;
} | null> {
  const cleanId = cleanStr(itemId, 128);
  if (!cleanId) return null;

  const row = await db
    .prepare('SELECT * FROM store_items WHERE id = ?1 LIMIT 1')
    .bind(cleanId)
    .first();

  if (row) {
    return {
      id: String(row.id),
      name: String(row.name || cleanId),
      category: String(row.category || 'avatar'),
      type: String(row.type || 'static'),
      priceKobans: Math.max(0, Math.floor(Number(row.price_kobans ?? 0))),
      active: Boolean(row.active ?? 1),
    };
  }

  const catalogMatch = COSMETICS_CATALOG.find((c) => c.id === cleanId);
  if (!catalogMatch) return null;

  const category =
    catalogMatch.type === 'frame'
      ? 'avatar_frame'
      : catalogMatch.type === 'effect'
      ? 'profile_effect'
      : catalogMatch.type === 'nameplate'
      ? 'nameplate'
      : catalogMatch.type === 'banner'
      ? 'banner'
      : 'avatar';

  return {
    id: catalogMatch.id,
    name: catalogMatch.name,
    category,
    type: catalogMatch.animated ? 'animated' : 'static',
    priceKobans: Math.max(0, Math.floor(Number(catalogMatch.priceKobans ?? 0))),
    active: true,
  };
}

/**
 * Formats a D1 `users` row + `user_roles` + `wallets` into the frontend UserProfile object.
 */
export function rowToUserProfile(
  row: Record<string, any>,
  roleOverride?: string,
  walletRow?: Record<string, any> | null
): Record<string, any> {
  const subjects = parseJsonSafe<string[]>(row.subjects_json, []);
  const equipped = parseJsonSafe<Record<string, any>>(
    walletRow?.equipped_json || row.equipped_json,
    {}
  );
  const owned = parseJsonSafe<string[]>(walletRow?.owned_json, []);
  const badges = parseJsonSafe<string[]>(row.badges_json, []);
  const redeemedBadges = parseJsonSafe<string[]>(row.redeemed_badges_json, []);
  const equippedBadges = parseJsonSafe<string[]>(row.equipped_badges_json, []);
  const pinnedBadges = parseJsonSafe<string[]>(row.pinned_badges_json, []);
  const pinnedStamps = parseJsonSafe<string[]>(row.pinned_stamps_json, []);
  const seenQuestions = parseJsonSafe<Record<string, string[]>>(row.seen_questions_json, {});

  const effectiveRole = roleOverride || row.role || 'student';
  const kobans = walletRow !== undefined && walletRow !== null
    ? Number(walletRow.balance ?? row.kobans ?? 0)
    : Number(row.kobans ?? 0);

  return {
    uid: String(row.uid),
    email: String(row.email || ''),
    name: String(row.name || row.display_name || 'Student'),
    displayName: String(row.display_name || row.name || 'Student'),
    nickname: row.nickname || undefined,
    username: row.username || undefined,
    shortId: row.short_id || undefined,
    photoURL: row.photo_url || undefined,
    avatar: equipped.avatar || row.avatar || undefined,
    avatarKey: row.avatar_key || undefined,
    avatarVariant: row.avatar_variant || undefined,
    avatarUrl: row.avatar_url || row.photo_url || undefined,
    banner: equipped.banner || row.banner || undefined,
    frame: equipped.frame || row.frame || undefined,
    nameplate: equipped.nameplate || row.nameplate || undefined,
    effectId: equipped.effectId || row.effect_id || undefined,
    bio: String(row.bio || ''),
    status: String(row.status || 'active'),
    accent: String(row.accent || '#E11D48'),
    role: effectiveRole,
    customRole: row.custom_role || undefined,
    hasChosenRole: Boolean(row.has_chosen_role),
    plan: String(row.plan || 'free'),
    isPremium: Boolean(row.is_premium) || row.plan === 'pro' || row.plan === 'premium',
    premiumSource: row.premium_source || undefined,
    planExpiresAt: row.plan_expires_at ? Number(row.plan_expires_at) : null,
    premiumExpiresAt: row.premium_expires_at ? Number(row.premium_expires_at) : null,
    academicTrack: row.academic_track || undefined,
    university: row.university || undefined,
    targetUniversity: row.target_university || row.university || undefined,
    targetExam: row.target_exam || undefined,
    testDate: row.test_date || undefined,
    class: String(row.class_level || '12'),
    classLevel: String(row.class_level || '12'),
    board: String(row.board || 'Federal'),
    subjects,
    equipped,
    ownedCosmetics: owned,
    badges,
    redeemedBadges,
    equippedBadges,
    pinnedBadges,
    pinnedStamps,
    seenQuestions,
    kobans,
    streak: Number(row.streak ?? 0),
    longestStreak: Number(row.longest_streak ?? 0),
    streakFreezeActive: Boolean(row.streak_freeze_active),
    lastActiveDate: row.last_active_date || undefined,
    totalQuestionsSolved: Number(row.total_questions_solved ?? row.mcqs_solved ?? 0),
    mcqsSolved: Number(row.mcqs_solved ?? row.total_questions_solved ?? 0),
    score: Number(row.score ?? 0),
    accuracy: Number(row.accuracy ?? 0),
    testsCompleted: Number(row.tests_completed ?? 0),
    followersCount: Number(row.followers_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    crewId: row.crew_id || undefined,
    crewName: row.crew_name || undefined,
    isCrewMember: Boolean(row.is_crew_member),
    crewStatus: row.crew_status || undefined,
    crewReferralCode: row.crew_referral_code || undefined,
    referrerAmbassadorUid: row.referrer_ambassador_uid || undefined,
    referrerAmbassadorId: row.referrer_ambassador_id || undefined,
    referrerCode: row.referrer_code || undefined,
    ambassadorBonusWeeks: Number(row.ambassador_bonus_weeks ?? 0),
    welcomed: Boolean(row.welcomed),
    welcomedAt: row.welcomed_at ? Number(row.welcomed_at) : undefined,
    profileCompleted: Boolean(row.profile_completed),
    onboardingCompleted: Boolean(row.onboarding_completed),
    profileCompletedAt: row.profile_completed_at ? Number(row.profile_completed_at) : undefined,
    onboardingCompletedAt: row.onboarding_completed_at ? Number(row.onboarding_completed_at) : undefined,
    isPostingBanned: Boolean(row.is_posting_banned),
    suspended: Boolean(row.suspended),
    deleted: Boolean(row.deleted),
    createdAt: Number(row.created_at || Date.now()),
    updatedAt: Number(row.updated_at || Date.now()),
  };
}

export function rowToPublicProfile(row: Record<string, any>): Record<string, any> {
  const equipped = parseJsonSafe<Record<string, any>>(row.equipped_json, {});
  const badges = parseJsonSafe<string[]>(row.badges_json, []);
  const pinnedBadges = parseJsonSafe<string[]>(row.pinned_badges_json, []);
  const pinnedStamps = parseJsonSafe<string[]>(row.pinned_stamps_json, []);
  const stats = parseJsonSafe<Record<string, any>>(row.stats_json, {});

  const streak = Number(row.streak ?? stats.streak ?? 0);
  const longestStreak = Number(row.longest_streak ?? stats.longestStreak ?? streak);
  const mcqs = Number(row.mcqs ?? stats.mcqs ?? 0);
  const accuracy = Number(row.accuracy ?? stats.accuracy ?? 0);
  const score = Number(row.score ?? stats.score ?? 0);
  const testsCompleted = Number(row.tests_completed ?? stats.testsCompleted ?? 0);

  return {
    uid: String(row.uid),
    displayName: String(row.display_name || 'Student'),
    nickname: row.nickname || undefined,
    username: row.username || undefined,
    studentId: String(row.student_id || row.short_id || '00000'),
    shortId: String(row.short_id || row.student_id || '00000'),
    role: String(row.role || 'student'),
    customRole: row.custom_role || undefined,
    bio: String(row.bio || ''),
    status: String(row.status || ''),
    accent: String(row.accent || '#E11D48'),
    avatar: equipped.avatar || row.avatar || null,
    avatarKey: row.avatar_key || null,
    avatarVariant: row.avatar_variant || null,
    avatarUrl: row.avatar_url || row.photo_url || null,
    photoURL: row.photo_url || row.avatar_url || null,
    banner: equipped.banner || row.banner || null,
    frame: equipped.frame || row.frame || null,
    nameplate: equipped.nameplate || row.nameplate || null,
    effectId: equipped.effectId || row.effect_id || null,
    equipped,
    badges,
    pinnedBadges,
    pinnedStamps,
    crewId: row.crew_id || null,
    crewName: row.crew_name || null,
    rankTitle: row.rank_title || 'Candidate',
    streak,
    longestStreak,
    mcqs,
    accuracy,
    score,
    testsCompleted,
    followersCount: Number(row.followers_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    stats: {
      streak,
      longestStreak,
      mcqs,
      accuracy,
      score,
      testsCompleted,
    },
    memberSince: Number(row.member_since || Date.now()),
    lastActiveAt: Number(row.last_active_at || Date.now()),
    updatedAt: Number(row.updated_at || Date.now()),
  };
}
