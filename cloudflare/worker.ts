/**
 * ============================================================================
 * BOARDLY COMMONS — CLOUDFLARE WORKER (D1 + R2 + EDGE CACHE + FIREBASE JWT)
 * ============================================================================
 * Handles all Boardly Commons & Study Material posts, likes, saves, comments,
 * reports, R2 uploads (`posts/{postId}/{random-id}-{safe-filename}`),
 * authenticated R2 downloads (`/api/posts/download`), `/api/health`,
 * SEO post rendering, and `/sitemap.xml` with ZERO Firebase Firestore/Storage reads.
 */

import {
  BOARDLY_CLOUDFLARE_CONFIG,
  buildCorsHeaders,
  buildR2PostFileKey,
  isAllowedOrigin,
  sanitizeUploadFileName,
} from '../src/config/cloudflareConfig';
import {
  buildDailyPostQuotaStatus,
  formatPostLimitReachedMessage,
  getDailyPostWindow,
  type DailyPostWindow,
} from '../src/config/postLimits';
import { getEffectiveUserPlan, getPlan, type PlanTier } from '../src/lib/planTier';
import { BOARDLY_BOT_ACCOUNTS } from '../src/config/botsConfig';
import {
  BotKeyPoolState,
  BotKeyStatusEntry,
  BotKeyStatusType,
  DELAY_BETWEEN_BOT_RUNS_MS,
  GeminiKeyStatusRecord,
  buildBotKeyPoolState,
  enqueueBotRun,
  formatCleanBotErrorMessage,
  formatRetryAfterShort,
  generateVerifiedBotComment,
  generateVerifiedBotStudyPost,
  getTotalGeminiCallsToday,
  parseGeminiApiKeys,
  redactApiKeysFromText,
  resolvePinnedGeminiModels,
  sleep,
  toPublicKeyStatusList,
  truncateBotErrorMessage,
} from '../src/services/botContentGenerator';
import { validateAndNormalizeQuestionMath } from '../src/utils/katexValidator';
import {
  PRE_SEEDED_UNIVERSITIES,
  buildUniversitySlug,
  normalizeCorrectLetter,
  type D1UniversityRow,
  type D1McqRow,
  type D1McqReportRow,
} from '../src/constants/d1Universities';


import { isD1UserSessionVerified } from '../functions/_utils/firestoreRestAdmin';
import {
  enforceAdminOrSuperAdminGate,
  handleSuperAdminAndExtraAdminRoutes,
  requireAdmin,
} from '../functions/_utils/adminRoleGate';
import { handleEconomyApiRequest } from '../functions/api/economy/[[path]]';
import { handleKobanStyleRequest } from '../functions/api/koban-style';
import {
  handlePlusBadgeRequest,
  resolvePlusBadgesBatch,
} from '../functions/api/plus-badge';
import { resolveProBadgesBatch } from '../functions/api/pro-badge';
import { handleFormulaVaultWorkerRequest } from './formulaVaultWorkerHandler';
import jsWorker from './worker.js';

export interface Env {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  FIREBASE_PROJECT_ID?: string;
  R2_PUBLIC_BASE_URL?: string;
  ALLOWED_ORIGIN?: string;
  SUPERADMIN_UIDS?: string;
  SUPERADMIN_EMAILS?: string;
  GEMINI_API_KEYS?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODEL?: string;
  BOT_RUN_SECRET?: string;
  OTP_HMAC_SECRET?: string;
  TOTP_ENCRYPTION_KEY?: string;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
  emailVerified?: boolean;
  role: 'student' | 'captain' | 'admin' | 'superadmin';
  captain?: boolean;
  admin?: boolean;
  superAdmin?: boolean;
  customRole: string | null;
}

let cachedJwks: { keys: any[]; expiresAt: number } | null = null;
let schemaInitialized = false;

const ALLOWED_MIME_SET = new Set<string>(BOARDLY_CLOUDFLARE_CONFIG.allowedMimeTypes);
const ALLOWED_EXT_LIST = BOARDLY_CLOUDFLARE_CONFIG.allowedExtensions;
const MAX_UPLOAD_BYTES = BOARDLY_CLOUDFLARE_CONFIG.maxFileSizeBytes; // 25 MB
const MAX_FILES_PER_POST = BOARDLY_CLOUDFLARE_CONFIG.maxFilesPerPost; // 5

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function base64ToUint8Array(base64Str: string): Uint8Array {
  const cleaned = base64Str.includes(',')
    ? base64Str.slice(base64Str.indexOf(',') + 1).trim()
    : base64Str.trim();
  const raw = atob(cleaned);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function decodeJwtPayload(part: string): Record<string, any> {
  const bytes = base64UrlToUint8Array(part);
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function getGooglePublicJwks(): Promise<any[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }
  const resp = await fetch(BOARDLY_CLOUDFLARE_CONFIG.googleJwksUrl, {
    cf: { cacheTtl: 3600, cacheEverything: true } as any,
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch Google JWK keys: ${resp.status}`);
  }
  const data = (await resp.json()) as { keys?: any[] };
  const keys = data.keys || [];
  cachedJwks = { keys, expiresAt: now + 3600 * 1000 };
  return keys;
}

import seedDataset from '../data/cloudflare_d1_posts.json';

// ── In-memory TTL Read Cache & Zero-D1-Read Public IP Rate Limiter ──────────
interface WorkerCacheEntry {
  value: any;
  expiresAt: number;
}
const WORKER_READ_CACHE = new Map<string, WorkerCacheEntry>();
const WORKER_READ_CACHE_MAX = 300;

function getWorkerCached<T>(key: string): T | null {
  const entry = WORKER_READ_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    WORKER_READ_CACHE.delete(key);
    return null;
  }
  return entry.value as T;
}

function setWorkerCached<T>(key: string, value: T, ttlMs: number): T {
  const now = Date.now();
  if (WORKER_READ_CACHE.size >= WORKER_READ_CACHE_MAX) {
    for (const [k, v] of WORKER_READ_CACHE.entries()) {
      if (v.expiresAt <= now) WORKER_READ_CACHE.delete(k);
    }
    if (WORKER_READ_CACHE.size >= WORKER_READ_CACHE_MAX) {
      const oldestKey = WORKER_READ_CACHE.keys().next().value;
      if (oldestKey) WORKER_READ_CACHE.delete(oldestKey);
    }
  }
  WORKER_READ_CACHE.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

function invalidateWorkerCache(prefixes: string[]): void {
  for (const key of Array.from(WORKER_READ_CACHE.keys())) {
    if (prefixes.some((p) => key.startsWith(p))) {
      WORKER_READ_CACHE.delete(key);
    }
  }
}

interface MemoryRateBucket {
  count: number;
  resetAt: number;
}
const PUBLIC_IP_RATE_LIMITS = new Map<string, MemoryRateBucket>();
const PUBLIC_IP_RATE_LIMIT_MAX = 2000;

function checkPublicIpRateLimit(
  req: Request,
  scope: string,
  maxRequests = 120,
  windowMs = 60_000
): boolean {
  const ip =
    req.headers.get('CF-Connecting-IP') ||
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const existing = PUBLIC_IP_RATE_LIMITS.get(key);
  if (!existing || now >= existing.resetAt) {
    if (PUBLIC_IP_RATE_LIMITS.size >= PUBLIC_IP_RATE_LIMIT_MAX) {
      for (const [k, v] of PUBLIC_IP_RATE_LIMITS.entries()) {
        if (v.resetAt <= now) PUBLIC_IP_RATE_LIMITS.delete(k);
      }
      if (PUBLIC_IP_RATE_LIMITS.size >= PUBLIC_IP_RATE_LIMIT_MAX) {
        const firstKey = PUBLIC_IP_RATE_LIMITS.keys().next().value;
        if (firstKey) PUBLIC_IP_RATE_LIMITS.delete(firstKey);
      }
    }
    PUBLIC_IP_RATE_LIMITS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxRequests) {
    return false;
  }
  existing.count += 1;
  return true;
}

function buildQuestionCandidateIds(rawId: string): string[] {
  const clean = rawId.trim();
  if (!clean) return [];
  const bare = clean.includes(':') ? clean.slice(clean.indexOf(':') + 1) : clean;
  return Array.from(
    new Set([clean, bare, `legacy:${bare}`, `bank1:${bare}`, `bank2:${bare}`])
  );
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

const POST_SELECT_COLS = `id, slug, type, title, description, subject, chapter, target, class_level, board, format, tags_json, files_json, is_anonymous, anonymous_alias, author_uid, real_author_uid, author_name, author_avatar, author_frame, author_equipped_avatar, author_photo_url, author_role, author_custom_role, status, visibility, is_hidden, is_pinned, is_featured, upvotes, downvotes, views, comment_count, save_count, shares_count, report_count, created_at, updated_at`;

const QUESTION_PUBLIC_COLS = `id, bank_id, subject, topic, difficulty, status, needs_review, question_text, options_json, source_path, created_at, updated_at`;
const QUESTION_ADMIN_COLS = `${QUESTION_PUBLIC_COLS}, correct_answer, explanation`;

const MCQ_PUBLIC_COLS = `id, university_id, subject, topic, question, option_a, option_b, option_c, option_d, difficulty, created_at`;
const MCQ_FULL_COLS = `${MCQ_PUBLIC_COLS}, correct_answer, explanation`;

/**
 * Ensures the D1 database schema exists so a newly bound D1 database works out of the box.
 * Uses a fast 1-query existence probe so production cold starts skip 50+ DDL statements
 * and never re-run seed/rewrite logic against an already-initialized database.
 */
async function ensureD1Schema(db: D1Database): Promise<void> {
  if (schemaInitialized) return;
  try {
    // Fast-path probe: if core tables already exist, skip DDL and seeding completely.
    try {
      await db.batch([
        db.prepare('SELECT 1 FROM posts LIMIT 1'),
        db.prepare('SELECT 1 FROM universities LIMIT 1'),
        db.prepare('SELECT 1 FROM mcqs LIMIT 1'),
        db.prepare('SELECT 1 FROM questions LIMIT 1'),
        db.prepare('SELECT 1 FROM notifications LIMIT 1'),
        db.prepare('SELECT 1 FROM guest_accounts LIMIT 1'),
      ]);
      schemaInitialized = true;
      return;
    } catch {
      // One or more core tables do not exist yet — run one-time additive schema bootstrap below.
    }
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL DEFAULT 'notes',
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT 'General',
        chapter TEXT NOT NULL DEFAULT 'General',
        target TEXT NOT NULL DEFAULT 'General',
        class_level TEXT NOT NULL DEFAULT '11',
        board TEXT NOT NULL DEFAULT 'Federal',
        format TEXT NOT NULL DEFAULT 'text',
        tags_json TEXT NOT NULL DEFAULT '[]',
        files_json TEXT NOT NULL DEFAULT '[]',
        is_anonymous INTEGER NOT NULL DEFAULT 0,
        anonymous_alias TEXT NOT NULL DEFAULT 'Anonymous Student',
        author_uid TEXT,
        real_author_uid TEXT,
        author_name TEXT NOT NULL DEFAULT 'Anonymous Student',
        author_avatar TEXT,
        author_frame TEXT,
        author_equipped_avatar TEXT,
        author_photo_url TEXT,
        author_role TEXT NOT NULL DEFAULT 'student',
        author_custom_role TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        visibility TEXT NOT NULL DEFAULT 'public',
        is_hidden INTEGER NOT NULL DEFAULT 0,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        upvotes INTEGER NOT NULL DEFAULT 0,
        downvotes INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        save_count INTEGER NOT NULL DEFAULT 0,
        shares_count INTEGER NOT NULL DEFAULT 0,
        report_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(is_hidden, is_pinned DESC, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(is_hidden, is_pinned DESC, upvotes DESC, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_subject ON posts(is_hidden, subject, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(is_hidden, type, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_class_board ON posts(is_hidden, class_level, board, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_author_uid ON posts(author_uid, is_anonymous, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_real_author_uid ON posts(real_author_uid, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_uid)
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_uid, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_saves (
        post_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_uid)
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_uid, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_saves_post ON post_saves(post_id)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS follows (
        follower_uid TEXT NOT NULL,
        following_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (follower_uid, following_uid)
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_uid, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_uid, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        text TEXT NOT NULL,
        is_anonymous INTEGER NOT NULL DEFAULT 0,
        author_uid TEXT,
        real_author_uid TEXT NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Student',
        author_avatar TEXT,
        author_frame TEXT,
        author_equipped_avatar TEXT,
        author_photo_url TEXT,
        author_role TEXT NOT NULL DEFAULT 'student',
        author_custom_role TEXT,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id, created_at ASC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_comments_author_uid ON post_comments(real_author_uid, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_reports (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        reporter_uid TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_media (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        r2_key TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        file_size INTEGER NOT NULL DEFAULT 0,
        url TEXT NOT NULL,
        download_url TEXT NOT NULL,
        uploaded_by_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id, created_at ASC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_media_r2_key ON post_media(r2_key)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_media_uploader ON post_media(uploaded_by_uid, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT,
        is_posting_banned INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS bot_accounts (
        uid TEXT PRIMARY KEY,
        placeholder_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        class_level TEXT NOT NULL DEFAULT '11',
        board TEXT NOT NULL DEFAULT 'Federal',
        equipped_avatar TEXT NOT NULL DEFAULT 'pfp_luffy',
        enabled INTEGER NOT NULL DEFAULT 1,
        post_count INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        last_run_at INTEGER,
        last_status TEXT,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_bot_accounts_subject ON bot_accounts(subject, enabled)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_bot_accounts_last_run ON bot_accounts(enabled, last_run_at ASC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS bot_key_status (
        key_index INTEGER PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'available',
        cooldown_until INTEGER,
        last_used_at INTEGER,
        calls_today INTEGER NOT NULL DEFAULT 0,
        calls_total INTEGER NOT NULL DEFAULT 0,
        quota_date TEXT NOT NULL DEFAULT '',
        last_error TEXT,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS bot_system_state (
        state_key TEXT PRIMARY KEY,
        state_value TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        author_id TEXT NOT NULL DEFAULT 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
        author_email TEXT NOT NULL DEFAULT 'shsvirtualadmin@gmail.com',
        author_name TEXT NOT NULL DEFAULT 'SHS Virtual Academy',
        is_pinned INTEGER NOT NULL DEFAULT 0,
        is_welcome INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON announcements(is_pinned DESC, created_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_welcome_status (
        user_uid TEXT PRIMARY KEY,
        welcomed INTEGER NOT NULL DEFAULT 1,
        read INTEGER NOT NULL DEFAULT 0,
        welcomed_at INTEGER NOT NULL,
        read_at INTEGER
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_read_announcements (
        user_uid TEXT NOT NULL,
        announcement_id TEXT NOT NULL,
        read_at INTEGER NOT NULL,
        PRIMARY KEY (user_uid, announcement_id)
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_read_announcements_user ON user_read_announcements(user_uid, read_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'following_post',
        title TEXT NOT NULL,
        message TEXT NOT NULL DEFAULT '',
        link TEXT,
        read INTEGER NOT NULL DEFAULT 0,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        author_id TEXT,
        author_name TEXT,
        author_avatar TEXT,
        author_frame TEXT,
        post_id TEXT,
        post_type TEXT,
        created_at INTEGER NOT NULL,
        read_at INTEGER
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        bank_id TEXT NOT NULL DEFAULT 'legacy',
        subject TEXT NOT NULL,
        topic TEXT NOT NULL DEFAULT 'General Concepts',
        difficulty TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'published',
        needs_review INTEGER NOT NULL DEFAULT 0,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer INTEGER NOT NULL DEFAULT 0,
        explanation TEXT NOT NULL DEFAULT '',
        source_path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_questions_bank_subj_topic_status ON questions(bank_id, subject, topic, status)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_questions_needs_review ON questions(needs_review)`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_bank_source_path ON questions(bank_id, source_path)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS questions_import_log (
        id TEXT PRIMARY KEY,
        bank_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        total_read INTEGER NOT NULL DEFAULT 0,
        imported_count INTEGER NOT NULL DEFAULT 0,
        needs_review_count INTEGER NOT NULL DEFAULT 0,
        source_type TEXT NOT NULL DEFAULT 'firestore',
        imported_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_questions_import_log_bank_time ON questions_import_log(bank_id, imported_at DESC)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS universities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo_url TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        mcq_count INTEGER NOT NULL DEFAULT 0,
        is_live INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_universities_sort ON universities(sort_order ASC, name ASC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities(slug)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS mcqs (
        id TEXT PRIMARY KEY,
        university_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT NOT NULL DEFAULT '',
        difficulty TEXT NOT NULL DEFAULT 'medium',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcqs_university_id ON mcqs(university_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcqs_subject ON mcqs(subject)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcqs_topic ON mcqs(topic)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcqs_uni_sub_top ON mcqs(university_id, subject, topic)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS mcq_reports (
        id TEXT PRIMARY KEY,
        mcq_id TEXT NOT NULL,
        university_id TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '',
        topic TEXT NOT NULL DEFAULT '',
        question_preview TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT 'wrong_key',
        comment TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        user_email TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcq_reports_status ON mcq_reports(status, created_at DESC)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_mcq_reports_mcq_id ON mcq_reports(mcq_id)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS university_logo_assets (
        id TEXT PRIMARY KEY,
        university_id TEXT NOT NULL UNIQUE,
        r2_key TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'image/webp',
        file_size INTEGER NOT NULL DEFAULT 0,
        uploaded_by_uid TEXT NOT NULL DEFAULT '',
        data_base64 TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_university_logo_assets_uni_id ON university_logo_assets(university_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_university_logo_assets_r2_key ON university_logo_assets(r2_key)`),
    ]);

    await db.prepare(`ALTER TABLE universities ADD COLUMN logo_url TEXT NOT NULL DEFAULT ''`).run().catch(() => {});
    await db.prepare(`ALTER TABLE university_logo_assets ADD COLUMN data_base64 TEXT NOT NULL DEFAULT ''`).run().catch(() => {});

    try {
      const uniSeedStmts = PRE_SEEDED_UNIVERSITIES.map((u) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO universities (id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at)
             VALUES (?, ?, ?, ?, ?, 0, 0, datetime('now'))`
          )
          .bind(u.id, u.name, u.slug, u.logo_url || '', u.sort_order)
      );
      await db.batch(uniSeedStmts);
    } catch (uniErr) {
      console.warn('[CloudflareWorker] University seed warning:', uniErr);
    }

    try {
      const welcomeStmt = db
        .prepare(
          `INSERT OR IGNORE INTO announcements (
            id, title, message, author_id, author_email, author_name, is_pinned, is_welcome, created_at, updated_at
          ) VALUES (
            'welcome_to_boardly',
            'Welcome to Boardly',
            'Welcome to Boardly! Practice entrance and board exam MCQs, share and download verified notes and past papers in Boardly Commons, track your daily study streaks, and climb the Grand Line leaderboard. Click this notification anytime to review what is new — we are glad to have you onboard!',
            'A5YMRimdHRcmeDWutxtUGt2e4hf2',
            'shsvirtualadmin@gmail.com',
            'SHS Virtual Academy',
            1,
            1,
            1743465600000,
            1743465600000
          )`
        );
      await db.batch([welcomeStmt]);
    } catch (welcomeErr) {
      console.warn('[CloudflareWorker] Welcome seed warning:', welcomeErr);
    }

    try {
      // Seed initial Commons study material posts if table is completely empty
      const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM posts').first<{ cnt: number }>();
      if (Number(countRow?.cnt ?? 0) === 0 && Array.isArray((seedDataset as any)?.posts)) {
        const initialPosts = (seedDataset as any).posts as Record<string, any>[];
        const chunkSize = 20;
        const basePastMs = 1743465600000;
        for (let i = 0; i < initialPosts.length; i += chunkSize) {
          const chunk = initialPosts.slice(i, i + chunkSize);
          const stmts = chunk.map((p, idx) => {
            const pastTs = basePastMs - (i + idx) * 3600000;
            return db
              .prepare(
                `INSERT OR IGNORE INTO posts (
                  id, slug, type, title, description, subject, chapter, target,
                  class_level, board, format, tags_json, files_json, is_anonymous,
                  anonymous_alias, author_uid, real_author_uid, author_name,
                  author_avatar, author_frame, author_equipped_avatar, author_photo_url,
                  author_role, author_custom_role, status, visibility,
                  is_hidden, is_pinned, is_featured, upvotes, downvotes, views,
                  comment_count, save_count, shares_count, report_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                String(p.id),
                String(p.slug || `${p.id}-post`),
                String(p.type || 'notes'),
                String(p.title || ''),
                String(p.description || ''),
                String(p.subject || 'General'),
                String(p.chapter || 'General'),
                String(p.target || 'General'),
                String(p.class_level || '11'),
                String(p.board || 'Federal'),
                String(p.format || 'text'),
                typeof p.tags_json === 'string' ? p.tags_json : JSON.stringify(p.tags || []),
                typeof p.files_json === 'string' ? p.files_json : JSON.stringify(p.files || []),
                Number(p.is_anonymous ? 1 : 0),
                String(p.anonymous_alias || 'Anonymous Student'),
                p.author_uid ?? null,
                p.real_author_uid ?? null,
                String(p.author_name || 'Anonymous Student'),
                p.author_avatar ?? null,
                p.author_frame ?? null,
                p.author_equipped_avatar ?? null,
                p.author_photo_url ?? null,
                String(p.author_role || 'student'),
                p.author_custom_role ?? null,
                String(p.status || 'published'),
                String(p.visibility || 'public'),
                Number(p.is_hidden || 0),
                Number(p.is_pinned || 0),
                Number(p.is_featured || 0),
                Number(p.upvotes || 0),
                Number(p.downvotes || 0),
                Number(p.views || 0),
                Number(p.comment_count || 0),
                Number(p.save_count || 0),
                Number(p.shares_count || 0),
                Number(p.report_count || 0),
                pastTs,
                pastTs
              );
          });
          await db.batch(stmts);
        }
      }
    } catch (postSeedErr) {
      console.warn('[CloudflareWorker] Posts seed warning:', postSeedErr);
    }

    // Old Admin Bank questions are no longer auto-seeded; the D1 university bank starts empty.


    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS user_usernames (
        username_lower TEXT PRIMARY KEY,
        username_display TEXT NOT NULL,
        uid TEXT NOT NULL UNIQUE,
        account_type TEXT NOT NULL DEFAULT 'registered',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_lower ON user_usernames(username_lower)`),
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
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_accounts_username_lower ON guest_accounts(username_lower)`),
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
      db.prepare(`CREATE TABLE IF NOT EXISTS guest_creation_rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier_hash TEXT NOT NULL,
        identifier_type TEXT NOT NULL,
        uid TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
    ]);

    schemaInitialized = true;
  } catch (err) {
    console.error('[CloudflareWorker] D1 schema init warning:', err);
  }
}

async function verifyD1GuestSessionForWorker(
  req: Request,
  env: Env
): Promise<VerifiedFirebaseUser | null> {
  if (!env?.DB) return null;
  let rawToken: string | null = null;
  const headerToken = (req.headers.get('X-Guest-Session') || '').trim();
  if (headerToken) {
    rawToken = headerToken.startsWith('guest_guest_') ? headerToken.slice('guest_'.length) : headerToken;
  }
  const authHeader = (req.headers.get('Authorization') || '').trim();
  if (!rawToken && authHeader.startsWith('Bearer guest_')) {
    const raw = authHeader.slice('Bearer '.length).trim();
    rawToken = raw.startsWith('guest_guest_') ? raw.slice('guest_'.length) : raw;
  }
  const cookieHeader = req.headers.get('Cookie') || req.headers.get('cookie') || '';
  if (!rawToken && cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)boardly_guest_session=([^;]+)/);
    if (match?.[1]) {
      try {
        rawToken = decodeURIComponent(match[1].trim());
      } catch {
        rawToken = match[1].trim();
      }
    }
  }
  if (!rawToken || rawToken.length < 16) return null;

  try {
    const secret =
      ((env as any).OTP_HMAC_SECRET ||
        (env as any).EMAIL_VERIFICATION_SECRET ||
        (env as any).INTERNAL_EMAIL_SECRET ||
        'boardly-default-otp-hmac-secret-v1-do-not-expose') as string;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(String(secret).trim()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`guest_session:v1:${rawToken}`));
    const tokenHash = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const now = Date.now();
    const sess = await env.DB.prepare(
      'SELECT session_id, uid, expires_at, revoked FROM guest_sessions WHERE token_hash = ?1 LIMIT 1'
    )
      .bind(tokenHash)
      .first<{ session_id: string; uid: string; expires_at: number; revoked: number }>();
    if (!sess || Number(sess.revoked) === 1 || Number(sess.expires_at) <= now) {
      return null;
    }
    const gRow = await env.DB.prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(sess.uid)
      .first<Record<string, any>>();
    if (
      !gRow ||
      Number(gRow.is_guest) !== 1 ||
      Boolean(gRow.upgraded_to_uid) ||
      Number(gRow.is_suspended) === 1
    ) {
      return null;
    }
    const newExpiresAt = now + 30 * 24 * 60 * 60 * 1000;
    await env.DB.prepare(
      'UPDATE guest_sessions SET last_active_at = ?1, expires_at = ?2 WHERE session_id = ?3'
    )
      .bind(now, newExpiresAt, sess.session_id)
      .run()
      .catch(() => {});
    await env.DB.prepare('UPDATE guest_accounts SET last_active_at = ?1 WHERE uid = ?2')
      .bind(now, String(gRow.uid))
      .run()
      .catch(() => {});
    const cleanName = String(gRow.display_name || gRow.username || 'Guest').trim();
    return {
      uid: String(gRow.uid),
      email: '',
      name: cleanName,
      picture: '',
      role: 'student',
      customRole: 'Guest',
    };
  } catch {
    return null;
  }
}

/**
 * Verifies a Firebase Auth ID token using WebCrypto RS256 and Google's JWK keys.
 */
export async function verifyFirebaseIdToken(
  req: Request,
  env: Env
): Promise<VerifiedFirebaseUser | null> {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ') || authHeader.startsWith('Bearer guest_')) {
    return verifyD1GuestSessionForWorker(req, env);
  }
  const token = authHeader.slice(7).trim();
  if (!token) return verifyD1GuestSessionForWorker(req, env);

  const parts = token.split('.');
  if (parts.length !== 3) return verifyD1GuestSessionForWorker(req, env);

  try {
    const header = decodeJwtPayload(parts[0]);
    const payload = decodeJwtPayload(parts[1]);

    const nowSec = Math.floor(Date.now() / 1000);
    const projectId = env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;

    if (payload.exp && payload.exp < nowSec - 30) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;

    const jwks = await getGooglePublicJwks();
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature,
      signedContent
    );

    if (!isValid) return null;

    const uid = payload.sub;
    const email = String(payload.email || '').trim().toLowerCase();
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
      new Set([...(signInProvider ? [signInProvider] : []), ...identityProviders])
    );
    const hasGoogleProvider =
      signInProvider === 'google.com' || signInProviders.includes('google.com');
    const authTimeSec = Number(payload.auth_time || payload.iat || 0);

    if (env.DB) {
      const sessionVerified = await isD1UserSessionVerified(
        env.DB as any,
        {
          uid,
          email,
          emailVerified: Boolean(payload.email_verified),
          authTime: authTimeSec,
          iat: Number(payload.iat || 0),
          signInProvider,
          signInProviders,
          hasGoogleProvider,
        },
        {
          request: req,
          hmacSecret: env.OTP_HMAC_SECRET,
        }
      );

      if (!sessionVerified) {
        return null;
      }
    }

    // Roles come from verified Firebase ID token custom claims OR verified owner email claim.
    // Hierarchy: superAdmin > admin > captain > student
    const configuredOwnerEmail = String((env as any).OWNER_EMAIL || 'shsvirtualadmin@gmail.com')
      .trim()
      .toLowerCase();
    const isVerifiedOwner =
      payload.email_verified === true && Boolean(email) && email === configuredOwnerEmail;
    const isSuperAdminClaim = payload.superAdmin === true || isVerifiedOwner;
    const isAdminClaim = payload.admin === true || isSuperAdminClaim;
    const isCaptainClaim = payload.captain === true || isAdminClaim;

    let role: 'student' | 'captain' | 'admin' | 'superadmin' = 'student';
    let customRole: string | null = payload.customRole || null;

    if (isSuperAdminClaim) {
      role = 'superadmin';
    } else if (isAdminClaim) {
      role = 'admin';
    } else if (isCaptainClaim) {
      role = 'captain';
      customRole = customRole || 'Nakama Captain';
    }

    if (env.DB) {
      try {
        const [d1Role, unameRole] = await Promise.all([
          env.DB.prepare(
            'SELECT role, custom_role, is_posting_banned FROM user_roles WHERE uid = ? LIMIT 1'
          )
            .bind(uid)
            .first<{ role: string; custom_role: string | null; is_posting_banned: number }>()
            .catch(() => null),
          env.DB.prepare(
            'SELECT role, custom_role FROM user_usernames WHERE uid = ? LIMIT 1'
          )
            .bind(uid)
            .first<{ role: string; custom_role: string | null }>()
            .catch(() => null),
        ]);

        if (d1Role?.is_posting_banned) {
          throw new Error('POSTING_BANNED');
        }
        const resolvedCustomRole = d1Role?.custom_role || unameRole?.custom_role || null;
        if (!customRole && resolvedCustomRole) {
          customRole = resolvedCustomRole;
        }
      } catch (e: any) {
        if (e?.message === 'POSTING_BANNED') throw e;
      }
    }

    return {
      uid,
      email,
      name: payload.name || email.split('@')[0] || 'Student',
      picture: payload.picture || '',
      emailVerified: Boolean(payload.email_verified),
      role,
      captain: isCaptainClaim,
      admin: isAdminClaim,
      superAdmin: isSuperAdminClaim,
      customRole,
    };
  } catch (err: any) {
    if (err?.message === 'POSTING_BANNED') throw err;
    console.error('[CloudflareWorker] Firebase token verification failed:', err?.message || err);
    return null;
  }
}

export function buildSlug(id: string, title: string): string {
  const cleanTitle = (title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${id}-${cleanTitle || 'post'}`;
}

export function extractIdFromSlugOrId(slugOrId: string): string {
  const trimmed = (slugOrId || '').trim();
  if (!trimmed) return '';
  const uuidMatch = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i
  );
  if (uuidMatch) return uuidMatch[1];
  if (trimmed.startsWith('commons_anon_topic_')) {
    const m = trimmed.match(/^(commons_anon_topic_\d+)(?:-|$)/i);
    if (m) return m[1];
  }
  if (trimmed.startsWith('post_gen_')) {
    const m = trimmed.match(/^(post_gen_\d+)(?:-|$)/i);
    if (m) return m[1];
  }
  if (trimmed.startsWith('post_')) {
    const m = trimmed.match(/^(post_\d+_[a-zA-Z0-9]+)(?:-|$)/);
    if (m) return m[1];
    const m2 = trimmed.match(/^(post_[a-zA-Z0-9_]+?)(?:-|$)/);
    if (m2) return m2[1];
  }
  const glMatch = trimmed.match(/^(gl-[a-z0-9]+-\d+)(?:-|$)/i);
  if (glMatch) return glMatch[1];
  const dashIdx = trimmed.indexOf('-');
  if (dashIdx >= 8) {
    return trimmed.slice(0, dashIdx);
  }
  return trimmed;
}

export function normalizeStoredFileEntry(f: any): Record<string, any> {
  const name = String(f?.name || 'attachment');
  const size = Number(f?.size || 0);
  const type = String(f?.type || 'application/octet-stream');
  const rawUrl = String(f?.url || '').trim();
  const r2DevMatch = rawUrl.match(/^https?:\/\/[^/]+\.r2\.dev\/(commons\/.+)$/i);
  const r2Key =
    String(f?.r2Key || f?.key || '').trim() ||
    (r2DevMatch ? r2DevMatch[1] : '') ||
    (rawUrl.startsWith('posts/') || rawUrl.startsWith('commons/') ? rawUrl : '');

  const isImage =
    type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name);

  let url = rawUrl;
  if (r2Key && r2Key.startsWith('posts/')) {
    url = isImage
      ? `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(r2Key)}`
      : `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`;
  } else if (r2Key && r2Key.startsWith('commons/')) {
    url = String(f?.localUrl || '').trim() || `/api/r2/${r2Key}`;
  } else if (url.startsWith('/api/commons/r2/')) {
    url = `/api/r2/${url.slice('/api/commons/r2/'.length)}`;
  } else if (!url && r2Key) {
    url = `/api/r2/${r2Key}`;
  }

  const downloadUrl = r2Key
    ? `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`
    : f?.downloadUrl || url;

  return {
    name,
    size,
    type,
    url,
    r2Key: r2Key || undefined,
    downloadUrl,
  };
}

export function sanitizeStoreAvatarId(...candidates: unknown[]): string | null {
  for (const val of candidates) {
    if (!val || typeof val !== 'string') continue;
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') continue;
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:') ||
      lower.startsWith('blob:') ||
      lower.includes('googleusercontent.com') ||
      lower.includes('ggpht.com')
    ) {
      continue;
    }
    const storePathMatch = trimmed.match(
      /^\/assets\/store\/(?:avatars\/|frames\/)?([^/?#]+)/i
    );
    const candidate = storePathMatch ? storePathMatch[1] : trimmed;
    if (candidate === 'eclipse-wyrm' || candidate === 'pfp_eclipse_wyrm') {
      return 'eclipse-wyrm';
    }
    if (candidate.startsWith('pfp_')) {
      return candidate;
    }
  }
  return null;
}

export interface WorkerLiveAuthor {
  uid: string;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  frame: string | null;
  role: string | null;
  customRole: string | null;
}

export async function resolveWorkerLiveAuthorsBatch(
  db: D1Database | undefined,
  uids: (string | null | undefined)[]
): Promise<Map<string, WorkerLiveAuthor>> {
  const result = new Map<string, WorkerLiveAuthor>();
  if (!db) return result;
  const uniqueUids = Array.from(
    new Set(
      uids
        .map((u) => String(u || '').trim())
        .filter((u) => u.length > 0 && u !== 'anonymous')
    )
  ).slice(0, 100);
  if (uniqueUids.length === 0) return result;

  try {
    const placeholders = uniqueUids.map((_, i) => `?${i + 1}`).join(', ');
    const [uRes, gRes, rRes] = await Promise.all([
      db
        .prepare(`SELECT * FROM user_usernames WHERE uid IN (${placeholders})`)
        .bind(...uniqueUids)
        .all<Record<string, any>>()
        .catch(() => ({ results: [] as Record<string, any>[] })),
      db
        .prepare(`SELECT uid, username, display_name FROM guest_accounts WHERE uid IN (${placeholders})`)
        .bind(...uniqueUids)
        .all<Record<string, any>>()
        .catch(() => ({ results: [] as Record<string, any>[] })),
      db
        .prepare(`SELECT uid, role FROM user_roles WHERE uid IN (${placeholders})`)
        .bind(...uniqueUids)
        .all<Record<string, any>>()
        .catch(() => ({ results: [] as Record<string, any>[] })),
    ]);

    const uMap = new Map<string, Record<string, any>>();
    for (const r of uRes.results || []) {
      if (r?.uid) uMap.set(String(r.uid), r);
    }
    const gMap = new Map<string, Record<string, any>>();
    for (const r of gRes.results || []) {
      if (r?.uid) gMap.set(String(r.uid), r);
    }
    const rMap = new Map<string, Record<string, any>>();
    for (const r of rRes.results || []) {
      if (r?.uid) rMap.set(String(r.uid), r);
    }

    for (const uid of uniqueUids) {
      const uRow = uMap.get(uid);
      const gRow = gMap.get(uid);
      const rRow = rMap.get(uid);
      const username = uRow?.username_display || uRow?.username_lower || gRow?.username || null;
      const displayName = uRow?.display_name || gRow?.display_name || username || null;
      const avatar = sanitizeStoreAvatarId(uRow?.avatar, gRow?.avatar);
      const frame = uRow?.frame || null;
      const rawStoredRole = rRow?.role || uRow?.role || (gRow ? 'guest' : 'student');
      const role =
        rawStoredRole === 'super_admin' ? 'superadmin' : String(rawStoredRole || 'student');
      const customRole = rRow?.custom_role || uRow?.custom_role || null;
      if (username || displayName || avatar || frame || role || customRole) {
        result.set(uid, {
          uid,
          username,
          displayName,
          avatar,
          frame,
          role,
          customRole,
        });
      }
    }
  } catch {
    // Non-fatal fallback to stored columns
  }
  return result;
}

/**
 * Canonical serializer from a D1 `posts` row to the frontend `CommonsPost` JSON contract.
 * Never exposes `real_author_uid` or `author_uid` on anonymous posts in public responses.
 */
export function rowToCommonsPost(
  row: Record<string, any>,
  liveAuthorsMap?: Map<string, WorkerLiveAuthor>
): Record<string, any> {
  let tags: string[] = [];
  let rawFiles: any[] = [];
  try {
    tags =
      typeof row.tags_json === 'string'
        ? JSON.parse(row.tags_json)
        : Array.isArray(row.tags)
        ? row.tags
        : [];
  } catch {}
  try {
    rawFiles =
      typeof row.files_json === 'string'
        ? JSON.parse(row.files_json)
        : Array.isArray(row.files)
        ? row.files
        : [];
  } catch {}

  const files = rawFiles.map(normalizeStoredFileEntry);
  const createdMs = Number(row.created_at || Date.now());
  const updatedMs = Number(row.updated_at || createdMs);
  const isAnon = Boolean(row.is_anonymous);
  const description = String(row.description ?? row.body ?? '');

  const authorUid = isAnon ? null : row.author_uid || null;
  const liveAuthor = !isAnon && authorUid && liveAuthorsMap ? liveAuthorsMap.get(authorUid) : undefined;

  const resolvedAuthorName = isAnon
    ? row.anonymous_alias || 'Anonymous Student'
    : liveAuthor?.displayName || liveAuthor?.username || row.author_name || 'Student';
  const resolvedAuthorUsername = isAnon ? null : liveAuthor?.username || null;
  const resolvedAuthorAvatar = isAnon
    ? null
    : liveAuthor?.avatar || sanitizeStoreAvatarId(row.author_equipped_avatar, row.author_avatar);
  const resolvedAuthorFrame = isAnon
    ? null
    : liveAuthor?.frame || row.author_frame || null;
  const resolvedAuthorRole = isAnon
    ? 'student'
    : liveAuthor?.role || row.author_role || 'student';
  const resolvedAuthorCustomRole = isAnon
    ? null
    : liveAuthor?.customRole || row.author_custom_role || null;

  return {
    id: row.id,
    slug: row.slug || buildSlug(row.id, row.title),
    type: row.type || 'notes',
    title: row.title || '',
    description,
    body: description,
    content: description,
    subject: row.subject || 'General',
    chapter: row.chapter || 'General',
    target: row.target || 'General',
    classLevel: row.class_level || '11',
    class: row.class_level || '11',
    board: row.board || 'Federal',
    format: row.format || (files.length > 0 ? 'pdf' : 'text'),
    tags,
    files,
    attachments: files,
    fileUrl: files[0]?.url || null,
    fileName: files[0]?.name || null,
    fileSize: files[0]?.size || null,
    mimeType: files[0]?.type || null,
    isAnonymous: isAnon,
    anonymous: isAnon,
    anonymousAlias: row.anonymous_alias || 'Anonymous Student',
    // Strictly hide author UID on anonymous posts in all public responses
    authorUid,
    authorId: authorUid,
    authorName: resolvedAuthorName,
    authorUsername: resolvedAuthorUsername,
    authorAvatar: resolvedAuthorAvatar,
    authorFrame: resolvedAuthorFrame,
    authorEquippedAvatar: resolvedAuthorAvatar,
    authorPhotoURL: null,
    authorRole: resolvedAuthorRole,
    authorCustomRole: resolvedAuthorCustomRole,
    status: row.status || 'published',
    visibility: row.visibility || 'public',
    isHidden: Boolean(row.is_hidden),
    isPinned: Boolean(row.is_pinned),
    isFeatured: Boolean(row.is_featured),
    upvotes: Number(row.upvotes ?? row.likes_count ?? 0),
    downvotes: Number(row.downvotes ?? 0),
    likesCount: Number(row.upvotes ?? row.likes_count ?? 0),
    views: Number(row.views ?? row.views_count ?? 0),
    viewsCount: Number(row.views ?? row.views_count ?? 0),
    commentCount: Number(row.comment_count ?? row.comments_count ?? 0),
    commentsCount: Number(row.comment_count ?? row.comments_count ?? 0),
    saveCount: Number(row.save_count ?? row.saves_count ?? 0),
    savesCount: Number(row.save_count ?? row.saves_count ?? 0),
    sharesCount: Number(row.shares_count ?? 0),
    reportCount: Number(row.report_count ?? row.reports_count ?? 0),
    createdAt: new Date(createdMs).toISOString(),
    updatedAt: new Date(updatedMs).toISOString(),
    createdAtMs: createdMs,
  };
}

function isAllowedMimeAndName(mimeType: string, fileName: string): boolean {
  const lowerName = String(fileName || '').toLowerCase().trim();
  const blockedExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.apk', '.dmg', '.pkg', '.js', '.py', '.php', '.ps1', '.dll', '.so'];
  if (blockedExts.some((ext) => lowerName.endsWith(ext) || lowerName.includes(`${ext}.`))) {
    return false;
  }
  const hasAllowedExt = ALLOWED_EXT_LIST.some((ext) => lowerName.endsWith(ext));
  const cleanMime = String(mimeType || '').toLowerCase().trim();
  const hasAllowedMime =
    ALLOWED_MIME_SET.has(cleanMime) ||
    cleanMime === 'image/png' ||
    cleanMime === 'image/jpeg' ||
    cleanMime === 'image/webp' ||
    cleanMime === 'image/gif' ||
    cleanMime === 'application/pdf';
  return hasAllowedExt || hasAllowedMime;
}

function inferMimeTypeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.pptx'))
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

async function checkRateLimit(
  env: Env,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  if (!env.DB) return true;
  const now = Date.now();
  try {
    const existing = await env.DB.prepare(
      'SELECT count, window_start FROM rate_limits WHERE rate_key = ?1'
    )
      .bind(key)
      .first<{ count: number; window_start: number }>();

    if (!existing || now - existing.window_start > windowMs) {
      await env.DB.prepare(
        'INSERT INTO rate_limits (rate_key, count, window_start) VALUES (?1, 1, ?2) ON CONFLICT(rate_key) DO UPDATE SET count = 1, window_start = ?2'
      )
        .bind(key, now)
        .run();
      return true;
    }

    if (existing.count >= maxRequests) {
      return false;
    }

    await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?1')
      .bind(key)
      .run();
    return true;
  } catch {
    return true;
  }
}

function decodeFirestoreRestValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const arr = Array.isArray(val.arrayValue?.values) ? val.arrayValue.values : [];
    return arr.map(decodeFirestoreRestValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreRestValue(v);
    }
    return out;
  }
  return null;
}

function decodeFirestoreRestDoc(docJson: any): Record<string, any> | null {
  if (!docJson || typeof docJson !== 'object' || !docJson.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docJson.fields)) {
    out[k] = decodeFirestoreRestValue(v);
  }
  return out;
}

async function fetchWorkerFirestoreDoc(
  collectionName: string,
  docId: string,
  authHeader: string,
  env: Env
): Promise<Record<string, any> | null> {
  if (!authHeader || !docId) return null;
  const projectId = env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;
  const defaultDbId =
    (env as any).FIREBASE_DATABASE_ID ||
    'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
  for (const dbId of [defaultDbId, '(default)']) {
    try {
      const resp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          projectId
        )}/databases/${encodeURIComponent(dbId)}/documents/${encodeURIComponent(
          collectionName
        )}/${encodeURIComponent(docId)}`,
        { headers: { Authorization: authHeader, Accept: 'application/json' } }
      );
      if (resp.ok) {
        const parsed = decodeFirestoreRestDoc(await resp.json().catch(() => null));
        if (parsed) return parsed;
      }
    } catch {
      // Try fallback DB id
    }
  }
  return null;
}

/**
 * Resolves the user's authoritative subscription plan tier ('free' | 'pro' | 'plus')
 * from Superadmin role, Firestore users/{uid}, D1 pro_purchase_locks, and Nakama Crew sharing.
 * Missing or expired plan safely defaults to 'free'.
 */
async function resolveWorkerUserPlanTier(
  req: Request,
  env: Env,
  user: { uid: string; role?: string; email?: string }
): Promise<PlanTier> {
  if (user.role === 'superadmin') return 'plus';
  if (!user.uid || user.uid.startsWith('guest_')) return 'free';

  const authHeader = String(req.headers.get('Authorization') || '').trim();
  const nowMs = Date.now();

  const [userDoc, d1Lock] = await Promise.all([
    authHeader ? fetchWorkerFirestoreDoc('users', user.uid, authHeader, env) : Promise.resolve(null),
    env.DB
      ? env.DB.prepare('SELECT * FROM pro_purchase_locks WHERE uid = ?1 LIMIT 1')
          .bind(user.uid)
          .first<Record<string, any>>()
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const userLike: Record<string, any> = {
    uid: user.uid,
    email: user.email || userDoc?.email || null,
    role: userDoc?.role || user.role || 'student',
    isGuest: user.uid.startsWith('guest_') || Boolean(userDoc?.isGuest),
    ...(userDoc || {}),
  };

  // Honor active D1 purchase lock if Firestore hasn't explicitly downgraded the user
  if (d1Lock && d1Lock.state === 'active' && Number(d1Lock.expires_at || 0) > nowMs) {
    const lockPlanId = String(d1Lock.plan_id || '').toLowerCase();
    const lockIsPlus = lockPlanId.includes('plus');
    if (
      userDoc === null ||
      userDoc?.isPlus === true ||
      userDoc?.isPro === true ||
      userDoc?.isPremium === true ||
      userDoc?.plan === 'pro' ||
      userDoc?.plan === 'plus'
    ) {
      if (lockIsPlus) {
        userLike.isPlus = true;
        userLike.plusUntil = Number(d1Lock.expires_at);
      } else {
        userLike.isPro = true;
        userLike.proUntil = Number(d1Lock.expires_at);
      }
    }
  }

  const personalPlan = getPlan(userLike, nowMs);
  if (personalPlan === 'plus') return 'plus';

  const crewId = userDoc?.crewId ? String(userDoc.crewId).trim() : '';
  if (crewId && authHeader) {
    const crewDoc = await fetchWorkerFirestoreDoc('crews', crewId, authHeader, env).catch(
      () => null
    );
    if (crewDoc) {
      return getEffectiveUserPlan(userLike, crewDoc, nowMs);
    }
  }

  return personalPlan;
}

async function getWorkerDailyPostsUsedToday(
  env: Env,
  uid: string,
  windowInfo: DailyPostWindow
): Promise<number> {
  if (!env.DB) return 0;
  const rateKey = `post_daily:${uid}:${windowInfo.dateKey}`;
  try {
    const [postsRow, rateRow] = await Promise.all([
      env.DB.prepare(
        'SELECT COUNT(*) AS cnt FROM posts WHERE (real_author_uid = ?1 OR author_uid = ?1) AND created_at >= ?2 AND created_at < ?3'
      )
        .bind(uid, windowInfo.windowStartMs, windowInfo.resetAtMs)
        .first<{ cnt: number }>()
        .catch(() => ({ cnt: 0 })),
      env.DB.prepare('SELECT count FROM rate_limits WHERE rate_key = ?1')
        .bind(rateKey)
        .first<{ count: number }>()
        .catch(() => null),
    ]);
    return Math.max(Number(postsRow?.cnt || 0), Number(rateRow?.count || 0));
  } catch {
    return 0;
  }
}

async function incrementWorkerDailyPostCounter(
  env: Env,
  uid: string,
  windowInfo: DailyPostWindow,
  floorCount: number
): Promise<void> {
  if (!env.DB) return;
  const rateKey = `post_daily:${uid}:${windowInfo.dateKey}`;
  try {
    await env.DB.prepare(
      'INSERT INTO rate_limits (rate_key, count, window_start) VALUES (?1, ?2, ?3) ON CONFLICT(rate_key) DO UPDATE SET count = MAX(count + 1, ?2), window_start = ?3'
    )
      .bind(rateKey, Math.max(1, floorCount), windowInfo.windowStartMs)
      .run();
  } catch {
    // Non-blocking: posts table still enforces the authoritative count
  }
}

function jsonResponse(
  data: any,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

export async function handleHealthCheck(req: Request, env: Env): Promise<Response> {
  const cors = buildCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const d1BindingExists = Boolean(env.DB);
  const r2BindingExists = Boolean(env.R2_BUCKET);

  let d1Connected = false;
  let d1PostCount: number | null = null;
  let d1Error: string | null = null;

  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      const cachedPostCount = getWorkerCached<number>('health:posts_count');
      if (cachedPostCount !== null) {
        await env.DB.prepare('SELECT 1 AS ok').first();
        d1Connected = true;
        d1PostCount = cachedPostCount;
      } else {
        const row = await env.DB.prepare('SELECT COUNT(*) as cnt FROM posts').first<{ cnt: number }>();
        d1Connected = true;
        d1PostCount = setWorkerCached('health:posts_count', Number(row?.cnt ?? 0), 5 * 60_000);
      }
    } catch (err: any) {
      d1Error = err?.message || String(err);
    }
  }

  let r2Connected = false;
  let r2Error: string | null = null;

  if (env.R2_BUCKET) {
    try {
      await env.R2_BUCKET.list({ limit: 1 });
      r2Connected = true;
    } catch (err: any) {
      r2Error = err?.message || String(err);
    }
  }

  let jwksReachable = false;
  let tokenProvided = false;
  let tokenVerified = false;
  let verifiedUser: { uid: string; role: string } | null = null;

  try {
    const keys = await getGooglePublicJwks();
    jwksReachable = keys.length > 0;
  } catch {}

  if (req.headers.get('Authorization')?.startsWith('Bearer ')) {
    tokenProvided = true;
    try {
      const u = await verifyFirebaseIdToken(req, env);
      if (u) {
        tokenVerified = true;
        verifiedUser = { uid: u.uid, role: u.role };
      }
    } catch {}
  }

  const bothBindingsWork =
    d1BindingExists && d1Connected && r2BindingExists && r2Connected;

  const d1Report = {
    bindingName: BOARDLY_CLOUDFLARE_CONFIG.d1BindingName,
    databaseName: BOARDLY_CLOUDFLARE_CONFIG.d1DatabaseName,
    exists: d1BindingExists,
    connected: d1Connected,
    postCount: d1PostCount,
    error: d1Error,
  };

  const r2Report = {
    bindingName: BOARDLY_CLOUDFLARE_CONFIG.r2BindingName,
    bucketName: BOARDLY_CLOUDFLARE_CONFIG.r2BucketName,
    exists: r2BindingExists,
    connected: r2Connected,
    error: r2Error,
  };

  let enabledBotsCount = 12;
  let botPostsCount = 0;
  if (env.DB && d1Connected) {
    try {
      const [bRow, bpRow] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as cnt FROM bot_accounts WHERE enabled = 1').first<{ cnt: number }>(),
        env.DB.prepare("SELECT COUNT(*) as cnt FROM posts WHERE author_role = 'bot' OR author_uid LIKE 'bot_%'").first<{ cnt: number }>(),
      ]);
      enabledBotsCount = Number(bRow?.cnt ?? 12);
      botPostsCount = Number(bpRow?.cnt ?? 0);
    } catch {}
  }

  return jsonResponse(
    {
      ok: bothBindingsWork,
      status: bothBindingsWork ? 'ok' : 'degraded',
      workerReachable: true,
      backendMode: bothBindingsWork ? 'cloudflare-d1-r2' : 'preview-demo',
      d1: d1Report,
      r2: r2Report,
      bindings: {
        d1: d1Report,
        r2: r2Report,
      },
      bots: {
        totalBots: BOARDLY_BOT_ACCOUNTS.length,
        enabledBots: enabledBotsCount,
        botPostsCount,
        geminiKeyConfigured: parseGeminiApiKeys(env.GEMINI_API_KEYS, env.GEMINI_API_KEY).length > 0,
        geminiKeysCount: parseGeminiApiKeys(env.GEMINI_API_KEYS, env.GEMINI_API_KEY).length,
        botSecretConfigured: Boolean(env.BOT_RUN_SECRET),
      },
      firebaseAuth: {
        projectId: env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId,
        jwksReachable,
        tokenProvided,
        tokenVerified,
        user: verifiedUser,
      },
      timestamp: new Date().toISOString(),
    },
    200,
    {
      ...cors,
      'Cache-Control': 'no-store',
    }
  );
}

interface D1BotAccountRow {
  uid: string;
  placeholder_name?: string;
  username?: string;
  display_name: string;
  subject: string;
  class_level?: string;
  board?: string;
  equipped_avatar?: string;
  avatar?: string;
  bio?: string;
  enabled: number;
  daily_post_limit?: number;
  post_count?: number;
  posts_count?: number;
  comment_count?: number;
  comments_count?: number;
  like_count?: number;
  likes_count?: number;
  last_run_at: number | null;
  last_status?: string | null;
  last_run_status?: string | null;
  updated_at: number;
}

interface D1BotKeyStatusRow {
  key_index: number;
  status: string;
  cooldown_until: number | null;
  last_used_at?: number | null;
  calls_today: number;
  calls_total?: number;
  quota_date?: string;
  calls_day_key?: string;
  last_error: string | null;
  updated_at: number;
}

interface D1BotSystemStateRow {
  state_key: string;
  state_value: string;
  updated_at: number;
}

async function updateD1BotAccountRow(
  db: D1Database,
  params: {
    uid: string;
    addPosts: number;
    addComments: number;
    addLikes: number;
    lastRunAt: number;
    statusText: string;
  }
): Promise<void> {
  const shortStatus = truncateBotErrorMessage(params.statusText);
  try {
    await db
      .prepare(
        `UPDATE bot_accounts
         SET post_count = COALESCE(post_count, 0) + ?,
             comment_count = COALESCE(comment_count, 0) + ?,
             like_count = COALESCE(like_count, 0) + ?,
             last_run_at = ?,
             last_status = ?,
             updated_at = ?
         WHERE uid = ?`
      )
      .bind(
        params.addPosts,
        params.addComments,
        params.addLikes,
        params.lastRunAt,
        shortStatus,
        params.lastRunAt,
        params.uid
      )
      .run();
  } catch {
    await db
      .prepare(
        `UPDATE bot_accounts
         SET posts_count = COALESCE(posts_count, 0) + ?,
             comments_count = COALESCE(comments_count, 0) + ?,
             likes_count = COALESCE(likes_count, 0) + ?,
             last_run_at = ?,
             last_run_status = ?,
             updated_at = ?
         WHERE uid = ?`
      )
      .bind(
        params.addPosts,
        params.addComments,
        params.addLikes,
        params.lastRunAt,
        shortStatus,
        params.lastRunAt,
        params.uid
      )
      .run()
      .catch(() => {});
  }
}

async function loadD1BotKeyPoolAndSummary(
  db: D1Database,
  env: Env
): Promise<{
  pool: BotKeyPoolState;
  lastRunSummary: any;
  geminiCallsLastRun: number;
}> {
  const apiKeys = parseGeminiApiKeys(env.GEMINI_API_KEYS, env.GEMINI_API_KEY);
  const [keyRowsRes, stateRowsRes] = await Promise.all([
    db
      .prepare('SELECT * FROM bot_key_status ORDER BY key_index ASC')
      .all<D1BotKeyStatusRow>()
      .catch(() => ({ results: [] as D1BotKeyStatusRow[] })),
    db
      .prepare('SELECT * FROM bot_system_state')
      .all<D1BotSystemStateRow>()
      .catch(() => ({ results: [] as D1BotSystemStateRow[] })),
  ]);

  const persistedStatuses: Partial<GeminiKeyStatusRecord>[] = (keyRowsRes.results || []).map((r) => ({
    keyIndex: Number(r.key_index),
    status: (r.status as any) || 'available',
    cooldownUntil: r.cooldown_until ? Number(r.cooldown_until) : null,
    lastUsedAt: r.last_used_at ? Number(r.last_used_at) : null,
    callsToday: Number(r.calls_today || 0),
    callsTotal: Number(r.calls_total || 0),
    quotaDate: String(r.quota_date || r.calls_day_key || ''),
    callsDayKey: String(r.calls_day_key || r.quota_date || ''),
    lastError: r.last_error ? truncateBotErrorMessage(r.last_error, apiKeys) : null,
  }));

  const stateMap = new Map<string, string>();
  for (const row of stateRowsRes.results || []) {
    stateMap.set(row.state_key, row.state_value);
  }

  const lastUsedKeyIndex = Number(stateMap.get('last_used_key_index') ?? -1);
  const allKeysExhaustedUntilRaw = Number(stateMap.get('all_keys_exhausted_until') ?? 0);
  const allKeysExhaustedUntil =
    Number.isFinite(allKeysExhaustedUntilRaw) && allKeysExhaustedUntilRaw > 0
      ? allKeysExhaustedUntilRaw
      : null;

  let botCooldowns: Record<string, number> = {};
  const rawBotCooldowns = stateMap.get('bot_cooldowns_json');
  if (rawBotCooldowns) {
    try {
      botCooldowns = JSON.parse(rawBotCooldowns) || {};
    } catch {
      botCooldowns = {};
    }
  }

  let lastRunSummary: any = null;
  const rawSummary = stateMap.get('last_run_summary_json');
  if (rawSummary) {
    try {
      lastRunSummary = JSON.parse(rawSummary);
      if (lastRunSummary && typeof lastRunSummary === 'object') {
        if (lastRunSummary.bannerMessage) {
          lastRunSummary.bannerMessage = truncateBotErrorMessage(
            lastRunSummary.bannerMessage,
            apiKeys
          );
        }
        if (Array.isArray(lastRunSummary.results)) {
          lastRunSummary.results = lastRunSummary.results.map((item: any) => ({
            ...item,
            error: item?.error ? truncateBotErrorMessage(item.error, apiKeys) : undefined,
          }));
        }
      }
    } catch {
      lastRunSummary = null;
    }
  }

  const geminiCallsLastRun = Number(
    stateMap.get('gemini_calls_last_run') ?? lastRunSummary?.geminiCallsLastRun ?? 0
  );

  const pool = buildBotKeyPoolState({
    apiKeys,
    persistedStatuses,
    lastUsedKeyIndex: Number.isFinite(lastUsedKeyIndex) ? lastUsedKeyIndex : -1,
    allKeysExhaustedUntil,
    botCooldowns,
  });

  return {
    pool,
    lastRunSummary,
    geminiCallsLastRun: Number.isFinite(geminiCallsLastRun) ? geminiCallsLastRun : 0,
  };
}

async function saveD1BotKeyPoolAndSummary(
  db: D1Database,
  pool: BotKeyPoolState,
  lastRunSummary?: any
): Promise<void> {
  const now = Date.now();
  const stateStatements: D1PreparedStatement[] = [];

  for (const ks of pool.keyStatuses) {
    const truncatedErr = ks.lastError ? truncateBotErrorMessage(ks.lastError, pool.keys) : null;
    try {
      await db
        .prepare(
          `INSERT INTO bot_key_status (key_index, status, cooldown_until, last_used_at, calls_today, calls_total, quota_date, last_error, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(key_index) DO UPDATE SET
             status = excluded.status,
             cooldown_until = excluded.cooldown_until,
             last_used_at = excluded.last_used_at,
             calls_today = excluded.calls_today,
             calls_total = excluded.calls_total,
             quota_date = excluded.quota_date,
             last_error = excluded.last_error,
             updated_at = excluded.updated_at`
        )
        .bind(
          ks.keyIndex,
          ks.status,
          ks.cooldownUntil,
          ks.lastUsedAt,
          ks.callsToday,
          ks.callsTotal,
          ks.quotaDate,
          truncatedErr,
          now
        )
        .run();
    } catch {
      await db
        .prepare(
          `INSERT INTO bot_key_status (key_index, status, cooldown_until, calls_today, calls_day_key, last_error, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(key_index) DO UPDATE SET
             status = excluded.status,
             cooldown_until = excluded.cooldown_until,
             calls_today = excluded.calls_today,
             calls_day_key = excluded.calls_day_key,
             last_error = excluded.last_error,
             updated_at = excluded.updated_at`
        )
        .bind(
          ks.keyIndex,
          ks.status,
          ks.cooldownUntil,
          ks.callsToday,
          ks.callsDayKey,
          truncatedErr,
          now
        )
        .run()
        .catch(() => {});
    }
  }

  const upsertState = (key: string, val: string) =>
    db
      .prepare(
        `INSERT INTO bot_system_state (state_key, state_value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(state_key) DO UPDATE SET
           state_value = excluded.state_value,
           updated_at = excluded.updated_at`
      )
      .bind(key, val, now);

  stateStatements.push(upsertState('last_used_key_index', String(pool.lastUsedKeyIndex)));
  stateStatements.push(
    upsertState(
      'all_keys_exhausted_until',
      pool.allKeysExhaustedUntil ? String(pool.allKeysExhaustedUntil) : '0'
    )
  );
  stateStatements.push(upsertState('gemini_calls_last_run', String(pool.callsThisRun)));
  stateStatements.push(
    upsertState('bot_cooldowns_json', JSON.stringify(pool.botCooldowns || {}))
  );

  if (lastRunSummary !== undefined) {
    stateStatements.push(upsertState('last_run_summary_json', JSON.stringify(lastRunSummary)));
  }

  if (stateStatements.length > 0) {
    await db.batch(stateStatements).catch(() => {});
  }
}

async function executeD1BotRun(
  db: D1Database,
  env: Env,
  options: {
    targetBotUid?: string | null;
    botUid?: string | null;
    maxBots?: number;
    postsPerBot?: number;
    triggerSource?: string;
    trigger?: string;
  }
): Promise<{
  httpStatus: number;
  payload: Record<string, any>;
}> {
  return enqueueBotRun(async () => {
    const apiKeys = parseGeminiApiKeys(env.GEMINI_API_KEYS, env.GEMINI_API_KEY);
    const { model, fallbackModel } = resolvePinnedGeminiModels(
      env.GEMINI_MODEL,
      env.GEMINI_FALLBACK_MODEL
    );
    const triggerSource = options.triggerSource || options.trigger || 'manual';

    if (apiKeys.length === 0) {
      return {
        httpStatus: 500,
        payload: {
          success: false,
          runOutcome: 'error',
          bannerStatus: 'error',
          bannerMessage:
            'No Gemini API keys configured. Set GEMINI_API_KEYS (or GEMINI_API_KEY) in Cloudflare secrets.',
          error:
            'No Gemini API keys configured. Set GEMINI_API_KEYS (or GEMINI_API_KEY) in Cloudflare secrets.',
        },
      };
    }

    const { pool } = await loadD1BotKeyPoolAndSummary(db, env);
    const nowMs = Date.now();

    // Check if all keys are currently cooling down in D1 before calling Gemini
    const activeKeyCount = pool.keyStatuses.filter((ks) => ks.status === 'available').length;
    if (
      activeKeyCount === 0 ||
      (pool.allKeysExhaustedUntil && pool.allKeysExhaustedUntil > nowMs)
    ) {
      const retryUntilMs =
        pool.allKeysExhaustedUntil ||
        Math.min(
          ...pool.keyStatuses
            .map((k) => k.cooldownUntil || nowMs + 60_000)
            .filter((v) => v > nowMs)
        );
      const retryIso = new Date(retryUntilMs).toISOString();
      const bannerMessage = truncateBotErrorMessage(
        formatCleanBotErrorMessage('Gemini HTTP 429 quota exceeded', retryUntilMs, null, nowMs),
        apiKeys
      );

      const summaryPayload = {
        success: true,
        runOutcome: 'quota_exceeded',
        bannerStatus: 'error',
        bannerMessage,
        allKeysExhaustedUntil: retryIso,
        ranAt: new Date(nowMs).toISOString(),
        triggerSource,
        botsProcessed: 0,
        postsCreated: 0,
        commentsCreated: 0,
        likesAdded: 0,
        likesCreated: 0,
        geminiCallsLastRun: 0,
        geminiCallsToday: getTotalGeminiCallsToday(pool),
        geminiKeysCount: apiKeys.length,
        geminiModel: model,
        geminiFallbackModel: fallbackModel,
        keyStatuses: toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length),
        results: [],
      };
      await saveD1BotKeyPoolAndSummary(db, pool, summaryPayload);
      return { httpStatus: 200, payload: summaryPayload };
    }

    const targetBotUid = (options.targetBotUid || options.botUid || '').trim() || null;
    const requestedMaxBots = Number(options.maxBots || (targetBotUid ? 1 : 2));
    const maxBots = targetBotUid
      ? 1
      : Math.min(3, Math.max(1, Number.isFinite(requestedMaxBots) ? requestedMaxBots : 2));
    const postsPerBotReq = Math.min(2, Math.max(1, Number(options.postsPerBot || 1)));

    let botQuery =
      'SELECT * FROM bot_accounts WHERE enabled = 1 ORDER BY COALESCE(last_run_at, 0) ASC, uid ASC';
    const binds: any[] = [];
    if (targetBotUid) {
      botQuery = 'SELECT * FROM bot_accounts WHERE uid = ? LIMIT 1';
      binds.push(targetBotUid);
    } else {
      botQuery += ` LIMIT ${maxBots}`;
    }

    const botRowsResult = await db
      .prepare(botQuery)
      .bind(...binds)
      .all<D1BotAccountRow>();
    const botRows = botRowsResult.results || [];

    const dayStartMs = new Date().setUTCHours(0, 0, 0, 0);
    const runResults: Array<{
      uid: string;
      botUid: string;
      displayName: string;
      subject: string;
      postsCreated: number;
      commentsCreated: number;
      likesCreated: number;
      likesAdded: number;
      geminiCallsUsed: number;
      assignedKeyIndex: number;
      status: string;
      retryAfter?: string;
      error?: string;
    }> = [];

    let totalPostsCreated = 0;
    let totalCommentsCreated = 0;
    let totalLikesCreated = 0;
    let stoppedDueToAllKeysExhausted = false;
    let exhaustionBannerMessage: string | null = null;

    for (let botLoopIdx = 0; botLoopIdx < botRows.length; botLoopIdx++) {
      // Delay between consecutive bot runs so two bots never burst simultaneously
      if (botLoopIdx > 0) {
        await sleep(DELAY_BETWEEN_BOT_RUNS_MS);
      }

      const botRow = botRows[botLoopIdx];
      const botIndexInConfig = Math.max(
        0,
        BOARDLY_BOT_ACCOUNTS.findIndex((b) => b.uid === botRow.uid)
      );
      const assignedKeyIndex = apiKeys.length > 0 ? botIndexInConfig % apiKeys.length : 0;

      const botConfig =
        BOARDLY_BOT_ACCOUNTS[botIndexInConfig] || {
          uid: botRow.uid,
          placeholderName: botRow.placeholder_name || botRow.username || botRow.uid,
          displayName: botRow.display_name,
          email: `${botRow.placeholder_name || botRow.username || botRow.uid}@bots.boardly.cfd`,
          subject: botRow.subject as any,
          classLevel: '11' as const,
          board: 'Federal' as const,
          target: 'Board Exams',
          equippedAvatar: botRow.equipped_avatar || botRow.avatar || 'pfp_luffy',
          bio: botRow.bio || '',
          chapters: ['General Revision'],
        };

      const botAvatar =
        botRow.equipped_avatar || botRow.avatar || botConfig.equippedAvatar || 'pfp_luffy';

      // If this bot was recently marked quota_exceeded and its retry time has not passed, do not retry in a loop
      const botCooldownUntilMs = pool.botCooldowns?.[botRow.uid] || 0;
      if (botCooldownUntilMs > Date.now()) {
        const cleanCooldownMsg = truncateBotErrorMessage(
          formatCleanBotErrorMessage(
            'Gemini HTTP 429 quota exceeded',
            botCooldownUntilMs,
            assignedKeyIndex + 1
          ),
          apiKeys
        );
        runResults.push({
          uid: botRow.uid,
          botUid: botRow.uid,
          displayName: botRow.display_name,
          subject: botRow.subject,
          postsCreated: 0,
          commentsCreated: 0,
          likesCreated: 0,
          likesAdded: 0,
          geminiCallsUsed: 0,
          assignedKeyIndex,
          status: 'quota_exceeded',
          retryAfter: new Date(botCooldownUntilMs).toISOString(),
          error: cleanCooldownMsg,
        });
        continue;
      }

      // Respect each bot's "Max 2/day" limit by checking D1 BEFORE calling Gemini
      const todayPostsRow = await db
        .prepare(
          'SELECT COUNT(*) as cnt FROM posts WHERE (author_uid = ? OR real_author_uid = ?) AND created_at >= ?'
        )
        .bind(botRow.uid, botRow.uid, dayStartMs)
        .first<{ cnt: number }>();

      const alreadyPostedToday = Number(todayPostsRow?.cnt ?? 0);
      const dailyLimit = Math.min(2, Math.max(1, Number(botRow.daily_post_limit || 2)));
      const remainingQuota = Math.max(0, dailyLimit - alreadyPostedToday);

      let botPostsCreated = 0;
      let botCommentsCreated = 0;
      let botLikesCreated = 0;
      let botGeminiCalls = 0;
      let botStatus = 'ok';
      let botRetryAfterIso: string | undefined;
      let botError: string | undefined;

      try {
        const otherPostsRes = await db
          .prepare(
            `SELECT id, title, description, subject FROM posts
             WHERE status = 'published' AND is_hidden = 0
               AND COALESCE(author_uid, '') != ? AND COALESCE(real_author_uid, '') != ?
             ORDER BY created_at DESC LIMIT 12`
          )
          .bind(botRow.uid, botRow.uid)
          .all<{ id: string; title: string; description: string; subject: string }>();

        const candidatePosts = otherPostsRes.results || [];
        for (const candidate of candidatePosts.slice(0, 2)) {
          const existingLike = await db
            .prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?')
            .bind(candidate.id, botRow.uid)
            .first();
          if (!existingLike) {
            await db.batch([
              db
                .prepare(
                  'INSERT OR IGNORE INTO post_likes (post_id, user_uid, created_at) VALUES (?, ?, ?)'
                )
                .bind(candidate.id, botRow.uid, Date.now()),
              db
                .prepare('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?')
                .bind(candidate.id),
            ]);
            botLikesCreated++;
            totalLikesCreated++;
          }
        }

        if (remainingQuota <= 0) {
          botStatus = 'daily_limit_reached';
          const nowUpdate = Date.now();
          await updateD1BotAccountRow(db, {
            uid: botRow.uid,
            addPosts: 0,
            addComments: 0,
            addLikes: botLikesCreated,
            lastRunAt: nowUpdate,
            statusText: `Daily limit reached (${alreadyPostedToday}/${dailyLimit} today); +${botLikesCreated} like(s)`,
          });

          runResults.push({
            uid: botRow.uid,
            botUid: botRow.uid,
            displayName: botRow.display_name,
            subject: botRow.subject,
            postsCreated: 0,
            commentsCreated: 0,
            likesCreated: botLikesCreated,
            likesAdded: botLikesCreated,
            geminiCallsUsed: 0,
            assignedKeyIndex,
            status: 'daily_limit_reached',
          });
          continue;
        }

        // Generate study post(s) sequentially (1 single merged Gemini call + local KaTeX check)
        const targetPostsForBot = Math.min(remainingQuota, postsPerBotReq);
        for (let i = 0; i < targetPostsForBot; i++) {
          const genResult = await generateVerifiedBotStudyPost({
            bot: botConfig,
            keyPool: pool,
            botIndex: botIndexInConfig,
            model,
            fallbackModel,
            postIndex: alreadyPostedToday + i,
          });
          botGeminiCalls += genResult.geminiCallsUsed || 0;

          if (!genResult.post) {
            botError = truncateBotErrorMessage(
              genResult.discardReason || 'Post generation failed',
              apiKeys
            );
            console.error(
              `[BotRunner] Bot ${botRow.uid} (${botRow.display_name}) post generation failed:`,
              botError
            );
            if (genResult.quotaExceeded || genResult.status === 'quota_exceeded') {
              botStatus = 'quota_exceeded';
              botRetryAfterIso = genResult.retryAfterIso;
              if (genResult.allKeysExhausted) {
                stoppedDueToAllKeysExhausted = true;
                exhaustionBannerMessage = botError;
              }
              // Do NOT retry this bot in a loop on 429
              break;
            }
            continue;
          }

          const p = genResult.post;
          const now = Date.now();
          const postId = `post_bot_${now}_${crypto.randomUUID().slice(0, 8)}`;
          const slug = buildSlug(postId, p.title);

          await db
            .prepare(
              `INSERT INTO posts (
                id, slug, type, title, description, subject, chapter, target,
                class_level, board, format, tags_json, files_json,
                is_anonymous, anonymous_alias, author_uid, real_author_uid,
                author_name, author_avatar, author_frame, author_equipped_avatar,
                author_photo_url, author_role, author_custom_role,
                status, visibility, is_hidden, is_pinned, is_featured,
                upvotes, downvotes, views, comment_count, save_count, shares_count, report_count,
                created_at, updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, 'text', ?, '[]',
                0, 'Anonymous Student', ?, ?,
                ?, ?, NULL, ?,
                NULL, 'bot', ?,
                'published', 'public', 0, 0, 0,
                1, 0, 1, 0, 0, 0, 0,
                ?, ?
              )`
            )
            .bind(
              postId,
              slug,
              p.type,
              p.title,
              p.description,
              botConfig.subject,
              p.chapter,
              botConfig.target,
              botConfig.classLevel,
              botConfig.board,
              JSON.stringify(p.tags || []),
              botRow.uid,
              botRow.uid,
              botRow.display_name,
              botAvatar,
              botAvatar,
              `${botConfig.subject} Study Bot`,
              now,
              now
            )
            .run();

          await db
            .prepare(
              'INSERT OR IGNORE INTO post_likes (post_id, user_uid, created_at) VALUES (?, ?, ?)'
            )
            .bind(postId, botRow.uid, now)
            .run();

          botPostsCreated++;
          totalPostsCreated++;
        }

        // Optional comment on 1 existing post if keys are still healthy and post succeeded
        if (
          !stoppedDueToAllKeysExhausted &&
          botStatus !== 'quota_exceeded' &&
          candidatePosts.length > 0 &&
          botPostsCreated > 0
        ) {
          const subjectMatch =
            candidatePosts.find(
              (cp) => cp.subject.toLowerCase() === botConfig.subject.toLowerCase()
            ) || candidatePosts[0];

          if (subjectMatch) {
            const existingBotComment = await db
              .prepare(
                'SELECT 1 FROM post_comments WHERE post_id = ? AND real_author_uid = ? LIMIT 1'
              )
              .bind(subjectMatch.id, botRow.uid)
              .first();

            if (!existingBotComment) {
              const commentResult = await generateVerifiedBotComment({
                bot: botConfig,
                targetPost: subjectMatch,
                keyPool: pool,
                botIndex: botIndexInConfig,
                model,
                fallbackModel,
              });
              botGeminiCalls += commentResult.geminiCallsUsed || 0;

              if (commentResult.comment) {
                const cNow = Date.now();
                const commentId = `cmt_bot_${cNow}_${crypto.randomUUID().slice(0, 8)}`;
                await db.batch([
                  db
                    .prepare(
                      `INSERT INTO post_comments (
                        id, post_id, text, is_anonymous, author_uid, real_author_uid,
                        author_name, author_avatar, author_frame, author_equipped_avatar,
                        author_photo_url, author_role, author_custom_role, created_at
                      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, NULL, ?, NULL, 'bot', ?, ?)`
                    )
                    .bind(
                      commentId,
                      subjectMatch.id,
                      commentResult.comment.text,
                      botRow.uid,
                      botRow.uid,
                      botRow.display_name,
                      botAvatar,
                      botAvatar,
                      `${botConfig.subject} Study Bot`,
                      cNow
                    ),
                  db
                    .prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?')
                    .bind(subjectMatch.id),
                ]);
                botCommentsCreated++;
                totalCommentsCreated++;
              } else if (commentResult.quotaExceeded || commentResult.allKeysExhausted) {
                if (commentResult.allKeysExhausted) {
                  stoppedDueToAllKeysExhausted = true;
                  exhaustionBannerMessage = truncateBotErrorMessage(
                    commentResult.discardReason || 'Gemini quota exceeded, retry after cooldown',
                    apiKeys
                  );
                }
              }
            }
          }
        }
      } catch (botErr: any) {
        botError = truncateBotErrorMessage(
          String(botErr?.message || botErr || 'Unexpected bot error'),
          apiKeys
        );
        console.error(`[BotRunner] Unexpected error for bot ${botRow.uid}:`, botError);
      }

      if (botPostsCreated === 0 && botError) {
        if (
          botStatus === 'quota_exceeded' ||
          stoppedDueToAllKeysExhausted ||
          /quota|429/i.test(botError)
        ) {
          botStatus = 'quota_exceeded';
        } else {
          botStatus = 'error';
        }
      } else if (botPostsCreated === 0) {
        botStatus = 'skipped';
      } else {
        botStatus = 'ok';
      }

      const statusText =
        botPostsCreated > 0
          ? `Published ${botPostsCreated} post(s), ${botCommentsCreated} comment(s), ${botLikesCreated} like(s)`
          : botStatus === 'quota_exceeded'
            ? truncateBotErrorMessage(`quota_exceeded — ${botError || 'Gemini quota exceeded'}`, apiKeys)
            : botError
              ? truncateBotErrorMessage(botError, apiKeys)
              : `Skipped (0 posts, ${botLikesCreated} like(s))`;

      const nowDone = Date.now();
      await updateD1BotAccountRow(db, {
        uid: botRow.uid,
        addPosts: botPostsCreated,
        addComments: botCommentsCreated,
        addLikes: botLikesCreated,
        lastRunAt: nowDone,
        statusText,
      });

      runResults.push({
        uid: botRow.uid,
        botUid: botRow.uid,
        displayName: botRow.display_name,
        subject: botRow.subject,
        postsCreated: botPostsCreated,
        commentsCreated: botCommentsCreated,
        likesCreated: botLikesCreated,
        likesAdded: botLikesCreated,
        geminiCallsUsed: botGeminiCalls,
        assignedKeyIndex,
        status: botStatus,
        retryAfter: botRetryAfterIso,
        error: botError,
      });

      if (stoppedDueToAllKeysExhausted) {
        break;
      }
    }

    const anyErrors = runResults.some((r) => Boolean(r.error));
    const allDailyLimit =
      runResults.length > 0 && runResults.every((r) => r.status === 'daily_limit_reached');

    let runOutcome: 'success' | 'partial' | 'quota_exceeded' | 'quota_exhausted' | 'error' | 'daily_limit' =
      'success';
    let bannerStatus: 'success' | 'warning' | 'error' = 'success';
    let bannerMessage = `Bot run finished: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published (${pool.callsThisRun} Gemini call(s) used).`;

    if (stoppedDueToAllKeysExhausted || (totalPostsCreated === 0 && anyErrors)) {
      const firstError =
        exhaustionBannerMessage ||
        runResults.find((r) => r.error)?.error ||
        'Gemini API error prevented post generation.';
      if (
        stoppedDueToAllKeysExhausted ||
        firstError.toLowerCase().includes('quota') ||
        firstError.includes('429')
      ) {
        runOutcome = 'quota_exceeded';
        bannerStatus = 'error';
        const retryUntil =
          pool.allKeysExhaustedUntil ||
          Math.min(
            ...pool.keyStatuses
              .map((k) => k.cooldownUntil || Date.now() + 60_000)
              .filter((v) => v > Date.now())
          );
        bannerMessage = truncateBotErrorMessage(
          formatCleanBotErrorMessage(firstError, Number.isFinite(retryUntil) ? retryUntil : null),
          apiKeys
        );
      } else {
        runOutcome = 'error';
        bannerStatus = 'error';
        bannerMessage = truncateBotErrorMessage(firstError, apiKeys);
      }
    } else if (totalPostsCreated > 0 && anyErrors) {
      runOutcome = 'partial';
      bannerStatus = 'warning';
      bannerMessage = `Partial bot run: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published (${pool.callsThisRun} Gemini call(s)).`;
    } else if (totalPostsCreated === 0 && allDailyLimit) {
      runOutcome = 'daily_limit';
      bannerStatus = 'warning';
      bannerMessage = `Selected bots already reached their Max 2/day post limit (${totalLikesCreated} like(s) added, 0 Gemini calls).`;
    }

    const summaryPayload = {
      success: true,
      runOutcome,
      bannerStatus,
      bannerMessage,
      allKeysExhaustedUntil: pool.allKeysExhaustedUntil
        ? new Date(pool.allKeysExhaustedUntil).toISOString()
        : null,
      ranAt: new Date().toISOString(),
      triggerSource,
      botsProcessed: runResults.length,
      postsCreated: totalPostsCreated,
      commentsCreated: totalCommentsCreated,
      likesCreated: totalLikesCreated,
      likesAdded: totalLikesCreated,
      geminiCallsLastRun: pool.callsThisRun,
      geminiCallsToday: getTotalGeminiCallsToday(pool),
      geminiKeysCount: apiKeys.length,
      geminiModel: model,
      geminiFallbackModel: fallbackModel,
      keyStatuses: toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length),
      results: runResults,
    };

    await saveD1BotKeyPoolAndSummary(db, pool, summaryPayload);

    return {
      httpStatus: 200,
      payload: summaryPayload,
    };
  });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    const cors = buildCorsHeaders(origin);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Strict origin check on mutating requests when Origin header is present
    if (
      origin &&
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      !isAllowedOrigin(origin)
    ) {
      console.error('[CloudflareWorker] Blocked disallowed CORS origin:', origin);
      return jsonResponse({ success: false, error: 'Origin not allowed by CORS policy.' }, 403, cors);
    }

    // 0. Health check endpoint: GET /api/health or /api/posts/health
    if (
      (url.pathname === '/api/health' || url.pathname === '/api/posts/health') &&
      req.method === 'GET'
    ) {
      return handleHealthCheck(req, env);
    }

    // 0a. Fast-path Student My Certificates: GET /api/certificates/mine (avoids cold-start schema batch timeout)
    if (url.pathname === '/api/certificates/mine' && req.method === 'GET' && env.DB) {
      const user = await verifyFirebaseIdToken(req, env).catch(() => null);
      if (!user) {
        return jsonResponse({ success: false, error: 'Authentication required.' }, 401, cors);
      }
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(ensureD1Schema(env.DB).catch(() => {}));
      }
      let rows: Record<string, any>[] = [];
      try {
        const queryPromise = env.DB
          .prepare(
            `SELECT id, cert_number, user_id, recipient_name, recipient_email, role_or_course,
                    achievement_text, issue_date, status, revoke_reason, pdf_r2_key, verify_url,
                    issued_by_name, issued_by_role, created_at
             FROM certificates
             WHERE user_id = ?1
             ORDER BY issued_at DESC, created_at DESC
             LIMIT 100`
          )
          .bind(user.uid)
          .all<Record<string, any>>();
        const timeoutPromise = new Promise<{ results: Record<string, any>[] }>((resolve) =>
          setTimeout(() => resolve({ results: [] }), 4000)
        );
        const res = await Promise.race([queryPromise, timeoutPromise]);
        rows = res?.results || [];
      } catch {
        rows = [];
      }
      const certificates = rows.map((row) => ({
        id: row.id,
        certNumber: row.cert_number,
        userId: row.user_id,
        recipientName: row.recipient_name,
        recipientEmail: row.recipient_email,
        roleOrCourse: row.role_or_course,
        achievementText: row.achievement_text,
        issueDate: row.issue_date,
        status: row.status,
        revokeReason: row.revoke_reason || null,
        pdfUrl: row.pdf_r2_key ? `/api/certificates/${encodeURIComponent(String(row.id))}/pdf` : null,
        verifyUrl: row.verify_url,
        issuedByName: row.issued_by_name,
        issuedByRole: row.issued_by_role,
        createdAt: Number(row.created_at || 0),
      }));
      return jsonResponse({ success: true, certificates }, 200, { ...cors, 'Cache-Control': 'no-store' });
    }

    if (env.DB) {
      await ensureD1Schema(env.DB);
    }

    // 0b. Strict server-side Firebase ID token custom-claim gate for /api/admin/*, /api/superadmin/*, and /api/captain/*
    if (
      url.pathname === '/api/admin' ||
      url.pathname.startsWith('/api/admin/') ||
      url.pathname === '/api/superadmin' ||
      url.pathname.startsWith('/api/superadmin/') ||
      url.pathname === '/api/captain' ||
      url.pathname.startsWith('/api/captain/')
    ) {
      const gate = await enforceAdminOrSuperAdminGate({
        request: req,
        env: env as any,
      });
      if (gate.blockedResponse) {
        return gate.blockedResponse;
      }
      if (gate.caller) {
        const handled = await handleSuperAdminAndExtraAdminRoutes({
          request: req,
          env: env as any,
          caller: gate.caller,
          db: env.DB as any,
        });
        if (handled) {
          return handled;
        }
      }
    }

    // 1. Dynamic Sitemap XML from D1
    if (url.pathname === '/sitemap.xml' && req.method === 'GET' && env.DB) {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), req);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const { results } = await env.DB.prepare(
        'SELECT id, slug, title, files_json, updated_at FROM posts WHERE is_hidden = 0 ORDER BY created_at DESC LIMIT 1000'
      ).all();

      const urls = [
        'https://boardly.cfd/',
        'https://boardly.cfd/commons',
        'https://boardly.cfd/material',
        'https://boardly.cfd/mcqs',
        'https://boardly.cfd/grand-line',
        'https://boardly.cfd/pricing',
      ];

      for (const r of results || []) {
        const slug = (r.slug as string) || buildSlug(String(r.id), String(r.title));
        urls.push(`https://boardly.cfd/commons/post/${slug}`);
        if (String(r.files_json || '[]') !== '[]') {
          urls.push(`https://boardly.cfd/material/${slug}`);
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
    <priority>${u.includes('/commons/post/') ? '0.8' : '0.9'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      const resp = new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=600, s-maxage=3600',
          ...cors,
        },
      });
      ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      return resp;
    }

    // 2. Server-Rendered SEO Post Pages (/commons/post/:slug and /material/:slug) for crawlers
    if (
      (url.pathname.startsWith('/commons/post/') || url.pathname.startsWith('/material/')) &&
      req.method === 'GET' &&
      env.DB
    ) {
      const ua = (req.headers.get('User-Agent') || '').toLowerCase();
      const isBot =
        /googlebot|bingbot|whatsapp|facebookexternalhit|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|applebot/i.test(
          ua
        ) || url.searchParams.get('ssr') === '1';

      if (isBot) {
        const ssrCache = (globalThis as any).caches?.default;
        const ssrCacheKey = new Request(url.toString(), { method: 'GET' });
        if (ssrCache) {
          const cachedSsr = await ssrCache.match(ssrCacheKey).catch(() => null);
          if (cachedSsr) return cachedSsr;
        }
        const slugPart = url.pathname
          .replace(/^\/commons\/post\//, '')
          .replace(/^\/material\//, '');
        const postId = extractIdFromSlugOrId(slugPart);
        const row = await env.DB.prepare(
          `SELECT ${POST_SELECT_COLS} FROM posts WHERE (id = ? OR slug = ?) AND is_hidden = 0 LIMIT 1`
        )
          .bind(postId, slugPart)
          .first<Record<string, any>>();

        if (row) {
          const post = rowToCommonsPost(row);
          const cleanDesc = String(post.description || '').slice(0, 160);
          const canonical = `https://boardly.cfd/commons/post/${post.slug}`;
          const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${post.title} — ${post.subject} | Boardly Commons</title>
  <meta name="description" content="${cleanDesc.replace(/"/g, '&quot;')}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${post.title.replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${cleanDesc.replace(/"/g, '&quot;')}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: post.title,
    description: cleanDesc,
    educationalLevel: `Class ${post.classLevel} (${post.board})`,
    url: canonical,
  })}</script>
</head>
<body>
  <article>
    <h1>${post.title}</h1>
    <p>Subject: ${post.subject} | Class ${post.classLevel} (${post.board})</p>
    <div>${post.description}</div>
  </article>
</body>
</html>`;
          const ssrResp = new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=300, s-maxage=600',
            },
          });
          if (ssrCache && ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(ssrCache.put(ssrCacheKey, ssrResp.clone()).catch(() => {}));
          }
          return ssrResp;
        }
      }
    }

    // 2b. API Routes under /api/announcements (Welcome Notification & Admin Pinned Announcement)
    if (url.pathname.startsWith('/api/announcements')) {
      if (!env.DB) {
        return jsonResponse({ success: false, error: 'D1 binding missing' }, 503, cors);
      }
      const annSub = url.pathname.slice('/api/announcements'.length).replace(/\/+$/, '') || '/';

      // GET /api/announcements/welcome?userId=...
      if (annSub === '/welcome' && req.method === 'GET') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const uid = user?.uid || (url.searchParams.get('userId') || '').trim();

        const welcomeRow = await env.DB.prepare(
          "SELECT * FROM announcements WHERE id = 'welcome_to_boardly' LIMIT 1"
        ).first<Record<string, any>>();

        let welcomeStatus = { welcomed: false, read: false };
        if (uid) {
          const st = await env.DB.prepare(
            'SELECT welcomed, read FROM user_welcome_status WHERE user_uid = ? LIMIT 1'
          )
            .bind(uid)
            .first<{ welcomed: number; read: number }>();
          if (st) {
            welcomeStatus = { welcomed: Boolean(st.welcomed), read: Boolean(st.read) };
          }
        }

        return jsonResponse(
          {
            success: true,
            announcement: welcomeRow
              ? {
                  id: welcomeRow.id,
                  title: welcomeRow.title,
                  message: welcomeRow.message,
                  authorId: welcomeRow.author_id,
                  authorEmail: welcomeRow.author_email,
                  authorName: welcomeRow.author_name,
                  isPinned: Boolean(welcomeRow.is_pinned),
                  isWelcome: Boolean(welcomeRow.is_welcome),
                  createdAt: welcomeRow.created_at,
                  updatedAt: welcomeRow.updated_at,
                  createdAtMs: Number(welcomeRow.created_at || Date.now()),
                  updatedAtMs: Number(welcomeRow.updated_at || Date.now()),
                }
              : null,
            welcomeStatus,
            userStatus: uid ? { userId: uid, ...welcomeStatus } : null,
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      // POST /api/announcements/welcome/ensure
      if (annSub === '/welcome/ensure' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const body = (await req.json().catch(() => ({}))) as { userId?: string };
        const uid = user?.uid || String(body.userId || '').trim();
        if (!uid) {
          return jsonResponse({ success: false, error: 'Missing userId' }, 400, cors);
        }

        const existing = await env.DB.prepare(
          'SELECT welcomed, read, welcomed_at FROM user_welcome_status WHERE user_uid = ? LIMIT 1'
        )
          .bind(uid)
          .first<{ welcomed: number; read: number; welcomed_at: number }>();

        let newlyCreated = false;
        let isRead = false;
        const now = Date.now();

        if (!existing) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO user_welcome_status (user_uid, welcomed, read, welcomed_at, read_at) VALUES (?, 1, 0, ?, NULL)'
          )
            .bind(uid, now)
            .run();
          newlyCreated = true;
          isRead = false;
        } else {
          isRead = Boolean(existing.read);
        }

        const welcomeRow = await env.DB.prepare(
          "SELECT * FROM announcements WHERE id = 'welcome_to_boardly' LIMIT 1"
        ).first<Record<string, any>>();

        return jsonResponse(
          {
            success: true,
            welcomed: true,
            newlyCreated,
            newlyWelcomed: newlyCreated,
            read: isRead,
            announcement: welcomeRow
              ? {
                  id: welcomeRow.id,
                  title: welcomeRow.title,
                  message: welcomeRow.message,
                  authorId: welcomeRow.author_id,
                  authorEmail: welcomeRow.author_email,
                  authorName: welcomeRow.author_name,
                  isPinned: true,
                  isWelcome: true,
                  createdAt: existing?.welcomed_at || now,
                  updatedAt: welcomeRow.updated_at,
                  createdAtMs: Number(existing?.welcomed_at || now),
                }
              : null,
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      // POST /api/announcements/welcome/read
      if (annSub === '/welcome/read' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const body = (await req.json().catch(() => ({}))) as { userId?: string };
        const uid = user?.uid || String(body.userId || '').trim();
        if (!uid) {
          return jsonResponse({ success: false, error: 'Missing userId' }, 400, cors);
        }

        const now = Date.now();
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO user_welcome_status (user_uid, welcomed, read, welcomed_at, read_at)
             VALUES (?, 1, 1, ?, ?)
             ON CONFLICT(user_uid) DO UPDATE SET read = 1, read_at = excluded.read_at`
          ).bind(uid, now, now),
          env.DB.prepare(
            `INSERT OR REPLACE INTO user_read_announcements (user_uid, announcement_id, read_at)
             VALUES (?, 'welcome_to_boardly', ?)`
          ).bind(uid, now),
        ]);

        return jsonResponse({ success: true, read: true }, 200, { ...cors, 'Cache-Control': 'no-store' });
      }

      // PUT /api/announcements/welcome — Admin edits the pinned "Welcome to Boardly" announcement
      if (annSub === '/welcome' && (req.method === 'PUT' || req.method === 'POST')) {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user || user.role !== 'superadmin') {
          return jsonResponse({ success: false, error: 'Forbidden: superadmin only' }, 403, cors);
        }

        const body = (await req.json().catch(() => ({}))) as { title?: string; message?: string };
        const title = String(body.title || 'Welcome to Boardly').trim();
        const message = String(body.message || '').trim();
        if (!title || !message) {
          return jsonResponse({ success: false, error: 'Title and message are required' }, 400, cors);
        }

        const now = Date.now();
        await env.DB.prepare(
          `INSERT INTO announcements (id, title, message, author_id, author_email, author_name, is_pinned, is_welcome, created_at, updated_at)
           VALUES ('welcome_to_boardly', ?, ?, ?, ?, 'SHS Virtual Academy', 1, 1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET title = excluded.title, message = excluded.message, updated_at = excluded.updated_at`
        )
          .bind(title, message, user.uid, user.email, now, now)
          .run();

        return jsonResponse(
          {
            success: true,
            announcement: {
              id: 'welcome_to_boardly',
              title,
              message,
              authorName: 'SHS Virtual Academy',
              isPinned: true,
              isWelcome: true,
              updatedAt: now,
            },
          },
          200,
          cors
        );
      }

      return jsonResponse({ error: 'Announcement endpoint not found' }, 404, cors);
    }

    // 2b-follows. API Routes under /api/follows, /api/followers, /api/following
    if (
      url.pathname === '/api/followers' ||
      url.pathname === '/api/followers/' ||
      url.pathname === '/api/following' ||
      url.pathname === '/api/following/' ||
      url.pathname.startsWith('/api/follows')
    ) {
      if (!env.DB) {
        return jsonResponse({ success: false, ok: false, error: 'D1 binding missing' }, 503, cors);
      }

      const queryFollowListFromD1 = async (
        mode: 'followers' | 'following',
        targetUid: string,
        rawLimit: string | null,
        rawOffset: string | null
      ) => {
        const parsedLimit = Number.parseInt(String(rawLimit ?? '50'), 10);
        const pageLimit = Number.isFinite(parsedLimit)
          ? Math.min(50, Math.max(1, parsedLimit))
          : 50;
        const parsedOffset = Number.parseInt(String(rawOffset ?? '0'), 10);
        const pageOffset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

        const filterCol = mode === 'followers' ? 'following_uid' : 'follower_uid';
        const joinCol = mode === 'followers' ? 'follower_uid' : 'following_uid';

        const countRow = await env.DB!
          .prepare(`SELECT COUNT(*) AS cnt FROM follows WHERE ${filterCol} = ?1`)
          .bind(targetUid)
          .first<{ cnt: number }>();
        const total = Number(countRow?.cnt ?? 0);

        let joinedRows: Record<string, any>[] = [];
        let usedFullLeftJoin = false;

        try {
          const fullRes = await env.DB!
            .prepare(
              `SELECT
                 f.${joinCol} AS uid,
                 f.created_at AS followed_at,
                 uu.username_display AS uu_username_display,
                 uu.username_lower AS uu_username_lower,
                 uu.display_name AS uu_display_name,
                 uu.avatar AS uu_avatar,
                 uu.frame AS uu_frame,
                 uu.role AS uu_role,
                 uu.custom_role AS uu_custom_role,
                 ga.username AS ga_username,
                 ga.display_name AS ga_display_name,
                 ga.role AS ga_role,
                 ga.tests_completed AS ga_tests_completed,
                 ga.total_questions_solved AS ga_questions_solved,
                 ga.streak AS ga_streak,
                 ga.stats_json AS ga_stats_json,
                 ur.role AS ur_role,
                 ur.custom_role AS ur_custom_role,
                 pb.design AS pro_badge_design,
                 pb.visible AS pro_badge_visible,
                 plb.plus_badge_design AS plus_badge_design,
                 plb.plus_badge_visible AS plus_badge_visible
               FROM follows f
               LEFT JOIN user_usernames uu ON uu.uid = f.${joinCol}
               LEFT JOIN guest_accounts ga ON ga.uid = f.${joinCol}
               LEFT JOIN user_roles ur ON ur.uid = f.${joinCol}
               LEFT JOIN user_pro_badge pb ON pb.user_id = f.${joinCol}
               LEFT JOIN user_plus_badge plb ON plb.user_id = f.${joinCol}
               WHERE f.${filterCol} = ?1
               ORDER BY f.created_at DESC
               LIMIT ?2 OFFSET ?3`
            )
            .bind(targetUid, pageLimit, pageOffset)
            .all<Record<string, any>>();
          joinedRows = fullRes.results || [];
          usedFullLeftJoin = true;
        } catch {
          // Graceful fallback if an optional badge/profile column or table hasn't been created yet
          const baseRes = await env.DB!
            .prepare(
              `SELECT
                 f.${joinCol} AS uid,
                 f.created_at AS followed_at
               FROM follows f
               WHERE f.${filterCol} = ?1
               ORDER BY f.created_at DESC
               LIMIT ?2 OFFSET ?3`
            )
            .bind(targetUid, pageLimit, pageOffset)
            .all<Record<string, any>>();
          joinedRows = baseRes.results || [];
        }

        const pageUids = joinedRows
          .map((r) => String(r.uid || '').trim())
          .filter(Boolean);

        const nowMs = Date.now();
        const [fallbackAuthors, proBadgesMap, plusBadgesMap] = await Promise.all([
          !usedFullLeftJoin && pageUids.length > 0
            ? resolveWorkerLiveAuthorsBatch(env.DB, pageUids)
            : Promise.resolve(new Map<string, WorkerLiveAuthor>()),
          pageUids.length > 0
            ? resolveProBadgesBatch(pageUids, env.DB as any, env as any, nowMs).catch(
                () => new Map<string, any>()
              )
            : Promise.resolve(new Map<string, any>()),
          pageUids.length > 0
            ? resolvePlusBadgesBatch(pageUids, env.DB as any, env as any, nowMs).catch(
                () => new Map<string, number | null>()
              )
            : Promise.resolve(new Map<string, number | null>()),
        ]);

        const computeLevel = (row: Record<string, any>): number => {
          let xp = 0;
          if (typeof row.ga_stats_json === 'string' && row.ga_stats_json) {
            try {
              const parsed = JSON.parse(row.ga_stats_json);
              if (typeof parsed?.xp === 'number' && parsed.xp > 0) xp = parsed.xp;
            } catch {
              // ignore malformed stats_json
            }
          }
          if (xp <= 0) {
            const tests = Number(row.ga_tests_completed || 0);
            const qs = Number(row.ga_questions_solved || 0);
            const streak = Number(row.ga_streak || 0);
            xp = tests * 120 + qs * 8 + streak * 50;
          }
          return Math.max(1, Math.floor(Math.max(0, xp) / 500) + 1);
        };

        const users = joinedRows
          .map((r) => {
            const rowUid = String(r.uid || '').trim();
            if (!rowUid) return null;
            const live = fallbackAuthors.get(rowUid);
            const username =
              r.uu_username_display ||
              r.uu_username_lower ||
              r.ga_username ||
              live?.username ||
              null;
            const displayName =
              r.uu_display_name ||
              r.ga_display_name ||
              live?.displayName ||
              username ||
              'Student';
            const avatar =
              sanitizeStoreAvatarId(r.uu_avatar, live?.avatar) ||
              (typeof r.uu_avatar === 'string' && r.uu_avatar.trim() ? r.uu_avatar.trim() : null);
            const frame = r.uu_frame || live?.frame || null;
            const rawRole = r.ur_role || r.uu_role || r.ga_role || live?.role || 'student';
            const role =
              rawRole === 'super_admin' ? 'superadmin' : String(rawRole || 'student');
            const customRole = r.ur_custom_role || r.uu_custom_role || live?.customRole || null;

            const rawPlusDesign =
              r.plus_badge_design !== undefined && r.plus_badge_design !== null
                ? Number(r.plus_badge_design)
                : null;
            const validPlusDesign =
              rawPlusDesign !== null &&
              Number.isInteger(rawPlusDesign) &&
              rawPlusDesign >= 1 &&
              rawPlusDesign <= 50
                ? rawPlusDesign
                : null;
            const plusVisible =
              r.plus_badge_visible !== undefined && r.plus_badge_visible !== null
                ? Number(r.plus_badge_visible) !== 0
                : true;

            const proVisible =
              r.pro_badge_visible !== undefined && r.pro_badge_visible !== null
                ? Number(r.pro_badge_visible) !== 0
                : true;
            const proDesign =
              typeof r.pro_badge_design === 'string' && r.pro_badge_design.trim()
                ? r.pro_badge_design.trim()
                : null;

            const fallbackPlusBadge =
              validPlusDesign !== null && plusVisible ? validPlusDesign : null;
            const resolvedPlusBadge = plusBadgesMap.has(rowUid)
              ? (plusBadgesMap.get(rowUid) ?? null)
              : fallbackPlusBadge;

            const fallbackProBadge =
              proDesign && proVisible ? proDesign : null;
            const resolvedProBadge =
              resolvedPlusBadge !== null
                ? null
                : proBadgesMap.has(rowUid)
                  ? (proBadgesMap.get(rowUid) ?? null)
                  : fallbackProBadge;

            return {
              uid: rowUid,
              displayName: String(displayName),
              username: username ? String(username) : null,
              avatar,
              frame,
              level: computeLevel(r),
              role,
              customRole,
              plusBadge: resolvedPlusBadge,
              plus_badge_design: validPlusDesign,
              plus_badge_visible: plusVisible,
              proBadge: resolvedProBadge,
              proBadgeDesign: proDesign,
              proBadgeVisible: proVisible,
              followedAt: Number(r.followed_at || 0),
            };
          })
          .filter(Boolean);

        return {
          total,
          limit: pageLimit,
          offset: pageOffset,
          hasMore: pageOffset + users.length < total,
          ids: pageUids,
          users,
        };
      };

      if (
        (url.pathname === '/api/followers' || url.pathname === '/api/followers/') &&
        req.method === 'GET'
      ) {
        const targetUid = (
          url.searchParams.get('uid') ||
          url.searchParams.get('userId') ||
          url.searchParams.get('followingUid') ||
          ''
        ).trim();
        if (!targetUid) {
          return jsonResponse(
            { success: false, ok: false, error: 'uid query parameter is required.' },
            400,
            cors
          );
        }
        const data = await queryFollowListFromD1(
          'followers',
          targetUid,
          url.searchParams.get('limit'),
          url.searchParams.get('offset')
        );
        return jsonResponse(
          {
            success: true,
            ok: true,
            uid: targetUid,
            total: data.total,
            followersCount: data.total,
            limit: data.limit,
            offset: data.offset,
            hasMore: data.hasMore,
            followerIds: data.ids,
            followers: data.users,
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      if (
        (url.pathname === '/api/following' || url.pathname === '/api/following/') &&
        req.method === 'GET'
      ) {
        const targetUid = (
          url.searchParams.get('uid') ||
          url.searchParams.get('userId') ||
          url.searchParams.get('followerUid') ||
          ''
        ).trim();
        if (!targetUid) {
          return jsonResponse(
            { success: false, ok: false, error: 'uid query parameter is required.' },
            400,
            cors
          );
        }
        const data = await queryFollowListFromD1(
          'following',
          targetUid,
          url.searchParams.get('limit'),
          url.searchParams.get('offset')
        );
        return jsonResponse(
          {
            success: true,
            ok: true,
            uid: targetUid,
            total: data.total,
            followingCount: data.total,
            limit: data.limit,
            offset: data.offset,
            hasMore: data.hasMore,
            followingIds: data.ids,
            following: data.users,
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      if (req.method === 'GET') {
        const followerUid = (url.searchParams.get('followerUid') || '').trim();
        const followingUid = (url.searchParams.get('followingUid') || '').trim();
        if (followerUid && followingUid) {
          const row = await env.DB.prepare(
            'SELECT 1 as ok FROM follows WHERE follower_uid = ? AND following_uid = ? LIMIT 1'
          )
            .bind(followerUid, followingUid)
            .first<{ ok: number }>();
          return jsonResponse(
            { success: true, isFollowing: Boolean(row?.ok) },
            200,
            { ...cors, 'Cache-Control': 'no-store' }
          );
        }
        if (followingUid) {
          const data = await queryFollowListFromD1(
            'followers',
            followingUid,
            url.searchParams.get('limit'),
            url.searchParams.get('offset')
          );
          return jsonResponse(
            {
              success: true,
              ok: true,
              followerIds: data.ids,
              followers: data.users,
              followersCount: data.total,
              total: data.total,
              limit: data.limit,
              offset: data.offset,
              hasMore: data.hasMore,
            },
            200,
            { ...cors, 'Cache-Control': 'no-store' }
          );
        }
        if (followerUid) {
          const data = await queryFollowListFromD1(
            'following',
            followerUid,
            url.searchParams.get('limit'),
            url.searchParams.get('offset')
          );
          return jsonResponse(
            {
              success: true,
              ok: true,
              followingIds: data.ids,
              following: data.users,
              followingCount: data.total,
              total: data.total,
              limit: data.limit,
              offset: data.offset,
              hasMore: data.hasMore,
            },
            200,
            { ...cors, 'Cache-Control': 'no-store' }
          );
        }
        return jsonResponse({ success: true, follows: [] }, 200, cors);
      }

      if (req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const followerUid = String(user?.uid || body.followerUid || '').trim();
        const followingUid = String(body.followingUid || body.targetUserId || '').trim();
        const action = String(body.action || 'follow').toLowerCase();

        if (!followerUid || !followingUid || followerUid === followingUid) {
          return jsonResponse({ success: false, error: 'Invalid follow parameters' }, 400, cors);
        }

        const now = Date.now();
        const existing = await env.DB.prepare(
          'SELECT 1 as ok FROM follows WHERE follower_uid = ? AND following_uid = ? LIMIT 1'
        )
          .bind(followerUid, followingUid)
          .first<{ ok: number }>();

        let following = false;
        if (action === 'unfollow' || (action === 'toggle' && existing)) {
          await env.DB.batch([
            env.DB.prepare(
              'DELETE FROM follows WHERE follower_uid = ? AND following_uid = ?'
            ).bind(followerUid, followingUid),
            env.DB.prepare(
              `DELETE FROM notifications
               WHERE user_id = ? AND author_id = ?
                 AND (type IN ('following_post', 'new_post', 'post') OR post_id IS NOT NULL)`
            ).bind(followerUid, followingUid),
          ]);
          following = false;
        } else {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO follows (follower_uid, following_uid, created_at) VALUES (?, ?, ?)'
          )
            .bind(followerUid, followingUid, now)
            .run();
          following = true;

          const followerName = String(body.followerName || user?.name || 'A student').trim();
          const followerAvatar = sanitizeStoreAvatarId(body.followerAvatar);
          const followerFrame = body.followerFrame || null;
          const notifId = `follow_${followerUid}_${followingUid}`;
          await env.DB.prepare(
            `INSERT OR IGNORE INTO notifications (
              id, user_id, type, title, message, link, read, is_pinned,
              author_id, author_name, author_avatar, author_frame, post_id, post_type, created_at
            ) VALUES (?, ?, 'new_follower', ?, 'Tap to view their profile.', ?, 0, 0, ?, ?, ?, ?, NULL, NULL, ?)`
          )
            .bind(
              notifId,
              followingUid,
              `${followerName} started following you`,
              null,
              followerUid,
              followerName,
              followerAvatar,
              followerFrame,
              now
            )
            .run();
        }

        const cntRow = await env.DB.prepare(
          'SELECT COUNT(*) as cnt FROM follows WHERE following_uid = ?'
        )
          .bind(followingUid)
          .first<{ cnt: number }>();
        return jsonResponse(
          {
            success: true,
            following,
            followersCount: Number(cntRow?.cnt ?? 0),
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      return jsonResponse({ error: 'Follows endpoint not found' }, 404, cors);
    }

    // 2b-notifications. API Routes under /api/notifications
    if (url.pathname.startsWith('/api/notifications')) {
      if (!env.DB) {
        return jsonResponse({ success: false, error: 'D1 binding missing' }, 503, cors);
      }
      const nSub = url.pathname.slice('/api/notifications'.length).replace(/\/+$/, '') || '/';
      const user = await verifyFirebaseIdToken(req, env).catch(() => null);

      if (nSub === '/cleanup-unfollowed' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const userId = String(user?.uid || body.userId || '').trim();
        if (!userId) {
          return jsonResponse({ success: false, error: 'Missing userId' }, 400, cors);
        }
        const followingIds: string[] = Array.isArray(body.followingIds)
          ? body.followingIds
              .map((id: unknown) => String(id || '').trim())
              .filter((id: string) => Boolean(id) && id !== userId)
          : [];
        const followingSet = new Set<string>(followingIds);

        const { results: userNotifs } = await env.DB.prepare(
          'SELECT id, type, title, author_id, post_id FROM notifications WHERE user_id = ?'
        )
          .bind(userId)
          .all();

        const idsToDelete: string[] = [];
        for (const r of userNotifs || []) {
          const rType = String((r as any).type || '');
          const rTitle = String((r as any).title || '');
          const isPost =
            rType === 'following_post' ||
            rType === 'new_post' ||
            rType === 'post' ||
            Boolean((r as any).post_id) ||
            /\bposted:\s*/i.test(rTitle);
          if (!isPost) continue;
          const authorId = String((r as any).author_id || '').trim();
          if (!authorId || authorId === userId || !followingSet.has(authorId)) {
            idsToDelete.push(String((r as any).id));
          }
        }

        if (idsToDelete.length > 0) {
          const delStmts = idsToDelete.map((id) =>
            env.DB!.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').bind(
              id,
              userId
            )
          );
          await env.DB.batch(delStmts);
        }

        return jsonResponse(
          { success: true, deletedCount: idsToDelete.length },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      if (nSub === '/' && req.method === 'GET') {
        const userId = String(url.searchParams.get('userId') || user?.uid || '').trim();
        if (!userId) {
          return jsonResponse({ success: false, error: 'Missing userId' }, 400, cors);
        }

        const followingKnown = String(url.searchParams.get('followingKnown') || '') === '1';
        const followingIdsParam = String(url.searchParams.get('followingIds') || '').trim();
        const clientFollowingSet = followingKnown
          ? new Set(
              followingIdsParam
                .split(',')
                .map((s) => s.trim())
                .filter((s) => Boolean(s) && s !== userId)
            )
          : null;

        const [{ results: notifRows }, { results: readAnnRows }, welcomeSt, { results: followRows }] =
          await Promise.all([
            env.DB.prepare(
              `SELECT id, user_id, type, title, message, link, read, is_pinned, author_id, author_name, author_avatar, author_frame, post_id, post_type, created_at, read_at
               FROM notifications
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT 50`
            )
              .bind(userId)
              .all(),
            env.DB.prepare(
              'SELECT announcement_id FROM user_read_announcements WHERE user_uid = ?'
            )
              .bind(userId)
              .all(),
            env.DB.prepare(
              'SELECT welcomed, read FROM user_welcome_status WHERE user_uid = ? LIMIT 1'
            )
              .bind(userId)
              .first<{ welcomed: number; read: number }>(),
            followingKnown
              ? Promise.resolve({ results: [] as any[] })
              : env.DB.prepare('SELECT following_uid FROM follows WHERE follower_uid = ?')
                  .bind(userId)
                  .all(),
          ]);

        const effectiveFollowingSet =
          clientFollowingSet ??
          new Set<string>(
            (followRows || [])
              .map((r: any) => String(r.following_uid || '').trim())
              .filter((id) => Boolean(id) && id !== userId)
          );

        const filteredNotifRows = (notifRows || []).filter((r: any) => {
          const rType = String(r.type || '');
          const rTitle = String(r.title || '');
          const isPost =
            rType === 'following_post' ||
            rType === 'new_post' ||
            rType === 'post' ||
            Boolean(r.post_id) ||
            /\bposted:\s*/i.test(rTitle);
          if (!isPost) return true;
          const authorId = String(r.author_id || '').trim();
          return Boolean(authorId && authorId !== userId && effectiveFollowingSet.has(authorId));
        });

        const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
          env.DB,
          filteredNotifRows.map((r: any) => (r.author_id ? String(r.author_id) : null))
        );

        const notifications = filteredNotifRows.map((r: any) => {
          const authorId = r.author_id ? String(r.author_id) : undefined;
          const live = authorId ? liveAuthorsMap.get(authorId) : undefined;
          const resolvedAuthorName =
            live?.displayName || live?.username || (r.author_name ? String(r.author_name) : undefined);
          let title = String(r.title || '');
          if (
            resolvedAuthorName &&
            r.author_name &&
            String(r.author_name) !== resolvedAuthorName &&
            title.startsWith(String(r.author_name))
          ) {
            title = resolvedAuthorName + title.slice(String(r.author_name).length);
          }
          return {
            id: String(r.id),
            userId: String(r.user_id),
            type: String(r.type || 'following_post'),
            title,
            message: String(r.message || ''),
            link: r.link ? String(r.link) : undefined,
            read: Boolean(r.read),
            isPinned: Boolean(r.is_pinned),
            authorId,
            authorName: resolvedAuthorName,
            authorUsername: live?.username || undefined,
            authorAvatar: live?.avatar || sanitizeStoreAvatarId(r.author_avatar),
            authorFrame: live?.frame || r.author_frame || null,
            postId: r.post_id ? String(r.post_id) : undefined,
            postType: r.post_type ? String(r.post_type) : undefined,
            createdAtMs: Number(r.created_at || Date.now()),
          };
        });

        const readSet = new Set<string>(
          (readAnnRows || []).map((r: any) => String(r.announcement_id))
        );
        if (welcomeSt?.read) {
          readSet.add('welcome_to_boardly');
        }

        return jsonResponse(
          {
            success: true,
            notifications,
            readAnnouncementIds: Array.from(readSet),
            welcomeRead: Boolean(welcomeSt?.read) || readSet.has('welcome_to_boardly'),
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      if (nSub === '/' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const items: any[] = Array.isArray(body.notifications)
          ? body.notifications
          : body.userId
          ? [body]
          : [];
        if (items.length === 0) {
          return jsonResponse({ success: false, error: 'No notifications provided' }, 400, cors);
        }

        const now = Date.now();
        const stmts: any[] = [];
        for (const item of items) {
          const targetUserId = String(item.userId || '').trim();
          const authorId = item.authorId ? String(item.authorId).trim() : user?.uid || null;
          if (!targetUserId || (authorId && targetUserId === authorId)) continue;
          if (item.isAnonymous) continue;

          const id = String(
            item.id ||
              (item.postId
                ? `post_${item.postId}_follower_${targetUserId}`
                : `notif_${now}_${crypto.randomUUID().slice(0, 8)}`)
          ).trim();

          stmts.push(
            env.DB.prepare(
              `INSERT OR IGNORE INTO notifications (
                id, user_id, type, title, message, link, read, is_pinned,
                author_id, author_name, author_avatar, author_frame, post_id, post_type, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              id,
              targetUserId,
              String(item.type || 'following_post'),
              String(item.title || 'New update'),
              String(item.message || ''),
              item.link ? String(item.link) : null,
              item.read ? 1 : 0,
              item.isPinned ? 1 : 0,
              authorId,
              item.authorName ? String(item.authorName) : null,
              sanitizeStoreAvatarId(item.authorAvatar),
              item.authorFrame || null,
              item.postId ? String(item.postId) : null,
              item.postType ? String(item.postType) : null,
              Number(item.createdAtMs || now)
            )
          );
        }

        if (stmts.length > 0) {
          await env.DB.batch(stmts);
        }
        return jsonResponse({ success: true, created: stmts.length }, 200, cors);
      }

      if (nSub === '/read' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const userId = String(user?.uid || body.userId || '').trim();
        const notificationId = String(body.notificationId || body.id || '').trim();
        const isAnnouncement = Boolean(body.isAnnouncement);

        if (!userId || !notificationId) {
          return jsonResponse({ success: false, error: 'Missing userId or notificationId' }, 400, cors);
        }

        const now = Date.now();
        const stmts: any[] = [
          env.DB.prepare(
            'UPDATE notifications SET read = 1, read_at = ? WHERE id = ? AND user_id = ?'
          ).bind(now, notificationId, userId),
        ];

        if (notificationId === 'welcome_to_boardly' || isAnnouncement) {
          stmts.push(
            env.DB.prepare(
              'INSERT OR REPLACE INTO user_read_announcements (user_uid, announcement_id, read_at) VALUES (?, ?, ?)'
            ).bind(userId, notificationId, now)
          );
          if (notificationId === 'welcome_to_boardly') {
            stmts.push(
              env.DB.prepare(
                `INSERT INTO user_welcome_status (user_uid, welcomed, read, welcomed_at, read_at)
                 VALUES (?, 1, 1, ?, ?)
                 ON CONFLICT(user_uid) DO UPDATE SET read = 1, read_at = excluded.read_at`
              ).bind(userId, now, now)
            );
          }
        }

        await env.DB.batch(stmts);
        return jsonResponse(
          { success: true, notificationId, read: true },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      if (nSub === '/read-all' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const userId = String(user?.uid || body.userId || '').trim();
        const announcementIds: string[] = Array.isArray(body.announcementIds)
          ? body.announcementIds.map(String)
          : [];

        if (!userId) {
          return jsonResponse({ success: false, error: 'Missing userId' }, 400, cors);
        }

        const now = Date.now();
        const stmts: any[] = [
          env.DB.prepare(
            'UPDATE notifications SET read = 1, read_at = ? WHERE user_id = ? AND read = 0'
          ).bind(now, userId),
          env.DB.prepare(
            `INSERT INTO user_welcome_status (user_uid, welcomed, read, welcomed_at, read_at)
             VALUES (?, 1, 1, ?, ?)
             ON CONFLICT(user_uid) DO UPDATE SET read = 1, read_at = excluded.read_at`
          ).bind(userId, now, now),
          env.DB.prepare(
            `INSERT OR REPLACE INTO user_read_announcements (user_uid, announcement_id, read_at)
             VALUES (?, 'welcome_to_boardly', ?)`
          ).bind(userId, now),
        ];

        for (const annId of announcementIds) {
          if (!annId || annId === 'welcome_to_boardly') continue;
          stmts.push(
            env.DB.prepare(
              'INSERT OR REPLACE INTO user_read_announcements (user_uid, announcement_id, read_at) VALUES (?, ?, ?)'
            ).bind(userId, annId, now)
          );
        }

        await env.DB.batch(stmts);
        return jsonResponse(
          { success: true, userId, readAll: true },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      return jsonResponse({ error: 'Notifications endpoint not found' }, 404, cors);
    }

    // 2b-formulas. API Routes under /api/formulas (Formula Vault & Formula Bank D1 + R2)
    if (url.pathname.startsWith('/api/formulas')) {
      return handleFormulaVaultWorkerRequest({
        req,
        env,
        url,
        cors,
        verifyFirebaseIdToken,
        jsonResponse,
      });
    }

    // 2b-questions. API Routes under /api/questions (D1 Question Bank for Legacy, Bank1, Bank2)
    if (url.pathname.startsWith('/api/questions')) {
      if (!env.DB) {
        return jsonResponse({ success: false, error: 'D1 binding (DB) is missing' }, 503, cors);
      }
      const qSub = url.pathname.slice('/api/questions'.length).replace(/\/+$/, '') || '/';
      const user = await verifyFirebaseIdToken(req, env).catch(() => null);
      const isStrictQuestionAdmin = Boolean(
        user && String(user.email || '').trim().toLowerCase() === 'shsvirtualadmin@gmail.com'
      );

      const normalizeSubSlug = (raw: string): string => {
        const s = String(raw || '').trim().toLowerCase();
        if (!s || s === 'all') return s;
        if (s.includes('math')) return 'mathematics';
        if (s.includes('phys')) return 'physics';
        if (s.includes('chem')) return 'chemistry';
        if (s.includes('comp') || s === 'cs' || s === 'it') return 'computer-science';
        if (s.includes('eng')) return 'english';
        if (s.includes('bio')) return 'biology';
        if (s.includes('analyt') || s.includes('iq') || s.includes('logic')) return 'analytical-reasoning';
        return s.replace(/[^a-z0-9-]+/g, '-');
      };

      const rowToQuestionDto = (r: Record<string, any>, includeSecretKey: boolean) => {
        let parsedOptions: string[] = ['', '', '', ''];
        try {
          const parsed = typeof r.options_json === 'string' ? JSON.parse(r.options_json) : r.options;
          if (Array.isArray(parsed) && parsed.length >= 4) {
            parsedOptions = [
              String(parsed[0] ?? ''),
              String(parsed[1] ?? ''),
              String(parsed[2] ?? ''),
              String(parsed[3] ?? ''),
            ];
          }
        } catch {
          parsedOptions = ['', '', '', ''];
        }

        const baseDto: Record<string, any> = {
          id: String(r.id),
          sourceId: String(r.bank_id || 'legacy'),
          bank_id: String(r.bank_id || 'legacy'),
          subject: String(r.subject || 'mathematics'),
          topic: String(r.topic || 'General Concepts'),
          chapter: String(r.topic || 'General Concepts'),
          difficulty: String(r.difficulty || 'medium'),
          status: String(r.status || 'published'),
          active: String(r.status || 'published') === 'published',
          needs_review: Number(r.needs_review || 0),
          needsReview: Boolean(r.needs_review),
          question_text: String(r.question_text || ''),
          q: String(r.question_text || ''),
          question: String(r.question_text || ''),
          stem: String(r.question_text || ''),
          options: parsedOptions,
          source_path: String(r.source_path || ''),
          created_at: Number(r.created_at || Date.now()),
          updated_at: Number(r.updated_at || Date.now()),
        };

        if (includeSecretKey) {
          const cIdx = Number(r.correct_answer ?? 0);
          const exp = String(r.explanation || '');
          baseDto.correct_answer = cIdx;
          baseDto.correct = cIdx;
          baseDto.correctAnswer = cIdx;
          baseDto.explanation = exp;
          baseDto.explain = exp;
        }

        return baseDto;
      };

      // GET /api/questions/health or /api/questions/stats (SQL GROUP BY + 5-min cache)
      if ((qSub === '/health' || qSub === '/stats') && req.method === 'GET') {
        const cachedStats = getWorkerCached<Record<string, any>>('questions:health');
        if (cachedStats) {
          return jsonResponse(cachedStats, 200, {
            ...cors,
            'Cache-Control': 'public, max-age=60, s-maxage=180',
          });
        }
        const t0 = Date.now();
        const [{ results: aggRows }, { results: importLogs }] = await Promise.all([
          env.DB.prepare(
            `SELECT bank_id, subject, topic, difficulty, status, needs_review,
                    COUNT(*) AS cnt,
                    SUM(CASE WHEN correct_answer IS NULL OR correct_answer < 0 OR correct_answer > 3 THEN 1 ELSE 0 END) AS invalid_cnt
             FROM questions
             GROUP BY bank_id, subject, topic, difficulty, status, needs_review`
          ).all(),
          env.DB.prepare(
            'SELECT bank_id, subject, imported_count, needs_review_count, imported_at FROM questions_import_log ORDER BY imported_at DESC LIMIT 100'
          ).all(),
        ]);

        const rows = (aggRows || []) as Record<string, any>[];
        const logs = (importLogs || []) as Record<string, any>[];

        const byBank: Record<string, number> = { legacy: 0, bank1: 0, bank2: 0 };
        const needsReviewByBank: Record<string, number> = { legacy: 0, bank1: 0, bank2: 0 };
        const byBankAndSubject: Record<string, Record<string, number>> = {
          legacy: {},
          bank1: {},
          bank2: {},
        };
        const bySubject: Record<string, number> = {};
        const byTopic: Record<string, Record<string, number>> = {};
        const byChapter: Record<string, number> = {};
        const byDifficulty = { easy: 0, medium: 0, hard: 0 };
        const byStatus = { draft: 0, reviewed: 0, published: 0 };
        let totalQuestions = 0;
        let activeCount = 0;
        let inactiveCount = 0;
        let needsReviewCount = 0;
        let invalidCorrectCount = 0;

        for (const r of rows) {
          const cnt = Number(r.cnt || 0);
          const bId = String(r.bank_id || 'legacy');
          const sub = String(r.subject || 'mathematics');
          const top = String(r.topic || 'General Concepts');
          const diff = String(r.difficulty || 'medium').toLowerCase();
          const st = String(r.status || 'published').toLowerCase();
          const nr = Number(r.needs_review || 0);

          totalQuestions += cnt;
          byBank[bId] = (byBank[bId] || 0) + cnt;
          if (!byBankAndSubject[bId]) byBankAndSubject[bId] = {};
          byBankAndSubject[bId][sub] = (byBankAndSubject[bId][sub] || 0) + cnt;

          bySubject[sub] = (bySubject[sub] || 0) + cnt;
          if (!byTopic[sub]) byTopic[sub] = {};
          byTopic[sub][top] = (byTopic[sub][top] || 0) + cnt;
          byChapter[top] = (byChapter[top] || 0) + cnt;

          if (diff === 'easy') byDifficulty.easy += cnt;
          else if (diff === 'hard') byDifficulty.hard += cnt;
          else byDifficulty.medium += cnt;

          if (st === 'draft') {
            byStatus.draft += cnt;
            inactiveCount += cnt;
          } else if (st === 'reviewed') {
            byStatus.reviewed += cnt;
            activeCount += cnt;
          } else {
            byStatus.published += cnt;
            activeCount += cnt;
          }

          if (nr === 1) {
            needsReviewCount += cnt;
            needsReviewByBank[bId] = (needsReviewByBank[bId] || 0) + cnt;
          }

          invalidCorrectCount += Number(r.invalid_cnt || 0);
        }

        const lastImportAtByBank: Record<string, string | null> = {
          legacy: null,
          bank1: null,
          bank2: null,
        };
        let overallLastImportMs = 0;
        for (const l of logs) {
          const bId = String(l.bank_id || 'legacy');
          const ts = Number(l.imported_at || 0);
          if (ts > 0 && !lastImportAtByBank[bId]) {
            lastImportAtByBank[bId] = new Date(ts).toISOString();
          }
          if (ts > overallLastImportMs) overallLastImportMs = ts;
        }

        const latencyMs = Math.max(1, Date.now() - t0);
        const bankMeta = [
          { id: 'legacy', name: 'Core Bank' },
          { id: 'bank1', name: 'Alpha Bank' },
          { id: 'bank2', name: 'Beta Bank' },
        ];

        const banks = bankMeta.map((bm) => ({
          id: bm.id,
          name: bm.name,
          healthy: true,
          status: 'healthy',
          latencyMs,
          questionCount: byBank[bm.id] || 0,
          needsReviewCount: needsReviewByBank[bm.id] || 0,
          bySubject: byBankAndSubject[bm.id] || {},
          lastImportAt:
            lastImportAtByBank[bm.id] ||
            (overallLastImportMs > 0 ? new Date(overallLastImportMs).toISOString() : null),
          checkedAt: new Date().toISOString(),
        }));

        const payload = setWorkerCached(
          'questions:health',
          {
            success: true,
            storageEngine: 'cloudflare-d1',
            databaseName: 'boardly-posts-db',
            totalQuestions,
            activeCount,
            inactiveCount,
            needsReviewCount,
            invalidCorrectCount,
            duplicatesDetected: 0,
            openReportsCount: 0,
            byBank,
            byBankAndSubject,
            bySubject,
            byTopic,
            byChapter,
            byDifficulty,
            byStatus,
            lastImportAt: {
              ...lastImportAtByBank,
              overall: overallLastImportMs > 0 ? new Date(overallLastImportMs).toISOString() : null,
            },
            banks,
          },
          5 * 60_000
        );

        return jsonResponse(payload, 200, {
          ...cors,
          'Cache-Control': 'public, max-age=60, s-maxage=180',
        });
      }

      // GET /api/questions/ids — Lightweight list of published question IDs for a subject (cached 3m)
      if (qSub === '/ids' && req.method === 'GET') {
        if (!checkPublicIpRateLimit(req, 'questions_ids', 120, 60_000)) {
          return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
        }
        const rawSub = url.searchParams.get('subject') || '';
        const subject = normalizeSubSlug(rawSub);
        const bank = (url.searchParams.get('bank') || url.searchParams.get('bank_id') || 'all').trim();
        const topic = (url.searchParams.get('topic') || '').trim();
        const difficulty = (url.searchParams.get('difficulty') || '').trim().toLowerCase();

        const idsCacheKey = `questions:ids:${subject}:${bank}:${topic.toLowerCase()}:${difficulty}`;
        const cachedIds = getWorkerCached<Record<string, any>>(idsCacheKey);
        if (cachedIds) {
          return jsonResponse(cachedIds, 200, {
            ...cors,
            'Cache-Control': 'public, max-age=60, s-maxage=180',
          });
        }

        const clauses: string[] = ["status = 'published'"];
        const binds: any[] = [];

        if (subject && subject !== 'all') {
          clauses.push('subject = ? COLLATE NOCASE');
          binds.push(subject);
        }
        if (bank && bank !== 'all') {
          clauses.push('bank_id = ?');
          binds.push(bank);
        }
        if (topic && topic !== 'all') {
          clauses.push('topic = ? COLLATE NOCASE');
          binds.push(topic);
        }
        if (difficulty && difficulty !== 'all' && difficulty !== 'mixed') {
          clauses.push('difficulty = ? COLLATE NOCASE');
          binds.push(difficulty);
        }

        const sql = `SELECT id FROM questions WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT 2000`;
        const { results } = await env.DB.prepare(sql).bind(...binds).all();
        const ids = (results || []).map((r: any) => String(r.id));
        const payload = setWorkerCached(
          idsCacheKey,
          { success: true, subject, ids, count: ids.length },
          3 * 60_000
        );
        return jsonResponse(payload, 200, {
          ...cors,
          'Cache-Control': 'public, max-age=60, s-maxage=180',
        });
      }

      // POST /api/questions/verify — Student answer verification (returns correct_answer ONLY after submitting an answer)
      if (qSub === '/verify' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const answersInput: Array<{
          questionId: string;
          selectedAnswer: number | null;
          displayedOptions?: string[];
        }> = [];

        if (Array.isArray(body.answers)) {
          for (const item of body.answers) {
            if (item && typeof item.questionId === 'string') {
              answersInput.push({
                questionId: item.questionId,
                selectedAnswer:
                  typeof item.selectedAnswer === 'number'
                    ? item.selectedAnswer
                    : typeof item.selectedOption === 'number'
                    ? item.selectedOption
                    : null,
                displayedOptions: Array.isArray(item.displayedOptions)
                  ? item.displayedOptions
                  : Array.isArray(item.options)
                  ? item.options
                  : undefined,
              });
            }
          }
        } else if (typeof body.questionId === 'string' && body.selectedAnswer !== undefined) {
          answersInput.push({
            questionId: body.questionId,
            selectedAnswer: typeof body.selectedAnswer === 'number' ? body.selectedAnswer : null,
            displayedOptions: Array.isArray(body.displayedOptions) ? body.displayedOptions : undefined,
          });
        } else {
          return jsonResponse(
            {
              success: false,
              error: 'A submitted answer (questionId and selectedAnswer, or answers array) is required to verify.',
            },
            400,
            cors
          );
        }

        const resultsMap: Record<
          string,
          {
            questionId: string;
            correct_answer: number;
            correctIndex: number;
            correctOptionText: string;
            selectedAnswer: number | null;
            isCorrect: boolean;
            explanation: string;
          }
        > = {};

        // Batch-fetch matching questions in a single IN(...) query instead of N+1 queries inside a loop
        const candidateIds = new Set<string>();
        for (const ans of answersInput) {
          const qId = ans.questionId.trim();
          if (!qId) continue;
          candidateIds.add(qId);
          if (qId.includes(':')) {
            const bareId = qId.slice(qId.indexOf(':') + 1);
            candidateIds.add(bareId);
            candidateIds.add(`legacy:${bareId}`);
            candidateIds.add(`bank1:${bareId}`);
            candidateIds.add(`bank2:${bareId}`);
          }
        }
        const idList = Array.from(candidateIds).slice(0, 500);
        const rowById = new Map<string, Record<string, any>>();
        const rowByBareId = new Map<string, Record<string, any>>();
        if (idList.length > 0) {
          const placeholders = idList.map(() => '?').join(',');
          const { results: batchRows } = await env.DB.prepare(
            `SELECT id, options_json, correct_answer, explanation FROM questions WHERE id IN (${placeholders})`
          )
            .bind(...idList)
            .all<Record<string, any>>();
          for (const r of batchRows || []) {
            const rid = String(r.id || '');
            rowById.set(rid, r);
            const bare = rid.includes(':') ? rid.slice(rid.indexOf(':') + 1) : rid;
            if (!rowByBareId.has(bare)) rowByBareId.set(bare, r);
          }
        }

        for (const ans of answersInput) {
          const qId = ans.questionId.trim();
          const bareId = qId.includes(':') ? qId.slice(qId.indexOf(':') + 1) : qId;
          const row: Record<string, any> | null | undefined =
            rowById.get(qId) || rowByBareId.get(bareId);
          if (!row) continue;

          let storedOptions: string[] = ['', '', '', ''];
          try {
            const parsed = JSON.parse(String(row.options_json || '[]'));
            if (Array.isArray(parsed)) storedOptions = parsed.map((o) => String(o ?? ''));
          } catch {}

          const storedCorrectIdx = Number(row.correct_answer ?? 0);
          const correctOptionText = String(storedOptions[storedCorrectIdx] ?? '');

          // If the student's test runner shuffled the displayed options, match by option text first
          let effectiveCorrectIdx = storedCorrectIdx;
          if (Array.isArray(ans.displayedOptions) && ans.displayedOptions.length >= 2 && correctOptionText) {
            const normTarget = correctOptionText.trim();
            const foundIdx = ans.displayedOptions.findIndex(
              (o) => String(o || '').trim() === normTarget
            );
            if (foundIdx !== -1) {
              effectiveCorrectIdx = foundIdx;
            }
          }

          const isCorrect =
            typeof ans.selectedAnswer === 'number' && ans.selectedAnswer === effectiveCorrectIdx;

          resultsMap[ans.questionId] = {
            questionId: ans.questionId,
            correct_answer: effectiveCorrectIdx,
            correctIndex: effectiveCorrectIdx,
            correctOptionText,
            selectedAnswer: ans.selectedAnswer,
            isCorrect,
            explanation: String(row.explanation || ''),
          };
        }

        const singleResult =
          answersInput.length === 1 ? resultsMap[answersInput[0].questionId] || null : null;

        return jsonResponse(
          {
            success: true,
            ...(singleResult || {}),
            results: resultsMap,
          },
          200,
          cors
        );
      }

      // PUT /api/questions/batch — Admin-only batch update (move topic, rename topic, status, fix misfiled)
      if (qSub === '/batch' && (req.method === 'PUT' || req.method === 'POST')) {
        if (!user) {
          return jsonResponse({ success: false, error: 'Authentication required' }, 401, cors);
        }
        if (!isStrictQuestionAdmin) {
          return jsonResponse(
            { success: false, error: 'Forbidden: Only shsvirtualadmin@gmail.com may modify questions' },
            403,
            cors
          );
        }

        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const action = String(body.action || 'update');
        const now = Date.now();

        if (action === 'rename_topic') {
          const subject = normalizeSubSlug(String(body.subject || ''));
          const oldTopic = String(body.oldTopic || '').trim();
          const newTopic = String(body.newTopic || '').trim();
          if (!subject || !oldTopic || !newTopic) {
            return jsonResponse({ success: false, error: 'Missing subject, oldTopic, or newTopic' }, 400, cors);
          }
          const res = await env.DB.prepare(
            'UPDATE questions SET topic = ?, updated_at = ? WHERE subject = ? AND topic = ?'
          )
            .bind(newTopic, now, subject, oldTopic)
            .run();
          invalidateWorkerCache(['questions:']);
          return jsonResponse({ success: true, updated: Number(res.meta?.changes ?? 0) }, 200, cors);
        }

        const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
        if (ids.length === 0) {
          return jsonResponse({ success: false, error: 'No question IDs provided' }, 400, cors);
        }

        // Batch-fetch all target rows using primary-key IN (...) instead of N+1 LIKE full scans
        const candidateSet = new Set<string>();
        for (const rawId of ids) {
          for (const cid of buildQuestionCandidateIds(rawId)) candidateSet.add(cid);
        }
        const existingById = new Map<string, Record<string, any>>();
        const existingByBare = new Map<string, Record<string, any>>();
        const candidateArr = Array.from(candidateSet);
        for (let i = 0; i < candidateArr.length; i += 80) {
          const slice = candidateArr.slice(i, i + 80);
          const ph = slice.map(() => '?').join(',');
          const { results: foundRows } = await env.DB.prepare(
            `SELECT id, subject, topic, status FROM questions WHERE id IN (${ph})`
          )
            .bind(...slice)
            .all<Record<string, any>>();
          for (const r of foundRows || []) {
            const rid = String(r.id || '');
            existingById.set(rid, r);
            const bare = rid.includes(':') ? rid.slice(rid.indexOf(':') + 1) : rid;
            if (!existingByBare.has(bare)) existingByBare.set(bare, r);
          }
        }

        const updateStmts: D1PreparedStatement[] = [];
        for (const rawId of ids) {
          const bareId = rawId.includes(':') ? rawId.slice(rawId.indexOf(':') + 1) : rawId;
          const existing = existingById.get(rawId) || existingByBare.get(bareId);
          if (!existing) continue;

          const nextTopic = body.topic !== undefined ? String(body.topic).trim() : existing.topic;
          const nextSubject =
            body.subject !== undefined ? normalizeSubSlug(String(body.subject)) : existing.subject;
          const nextStatus =
            body.status !== undefined
              ? String(body.status).toLowerCase()
              : body.active === false
              ? 'draft'
              : body.active === true
              ? 'published'
              : existing.status;

          updateStmts.push(
            env.DB.prepare(
              'UPDATE questions SET subject = ?, topic = ?, status = ?, updated_at = ? WHERE id = ?'
            ).bind(nextSubject, nextTopic, nextStatus, now, existing.id)
          );
        }

        for (let i = 0; i < updateStmts.length; i += 50) {
          await env.DB.batch(updateStmts.slice(i, i + 50));
        }

        invalidateWorkerCache(['questions:']);
        return jsonResponse({ success: true, updated: updateStmts.length }, 200, cors);
      }

      // GET /api/questions — List, filter, search, or fetch by IDs
      if (qSub === '/' && req.method === 'GET') {
        if (!isStrictQuestionAdmin && !checkPublicIpRateLimit(req, 'questions_list', 120, 60_000)) {
          return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
        }
        const bank = (url.searchParams.get('bank') || url.searchParams.get('bank_id') || 'all').trim();
        const rawSub = (url.searchParams.get('subject') || 'all').trim();
        const subject = normalizeSubSlug(rawSub);
        const topic = (url.searchParams.get('topic') || url.searchParams.get('chapter') || 'all').trim();
        const difficulty = (url.searchParams.get('difficulty') || 'all').trim().toLowerCase();
        const statusParam = (url.searchParams.get('status') || 'all').trim().toLowerCase();
        const needsReviewParam = url.searchParams.get('needs_review');
        const search = (url.searchParams.get('search') || url.searchParams.get('q') || '').trim().toLowerCase();
        const idsParam = (url.searchParams.get('ids') || '').trim();
        const maxAllowedLimit = isStrictQuestionAdmin ? 200 : 100;
        const limitCount = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), maxAllowedLimit);
        const pageIndex = Math.max(Number(url.searchParams.get('page')) || 0, 0);
        const offset =
          url.searchParams.get('offset') !== null
            ? Math.max(Number(url.searchParams.get('offset')) || 0, 0)
            : pageIndex * limitCount;
        const qSelectCols = isStrictQuestionAdmin ? QUESTION_ADMIN_COLS : QUESTION_PUBLIC_COLS;

        // If specific IDs requested (e.g. test runner loading questions by ID)
        if (idsParam) {
          const requestedIds = idsParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 150);
          const candidateIds = new Set<string>();
          for (const reqId of requestedIds) {
            for (const cid of buildQuestionCandidateIds(reqId)) candidateIds.add(cid);
          }
          const idList = Array.from(candidateIds);
          const rowById = new Map<string, Record<string, any>>();
          const rowByBareId = new Map<string, Record<string, any>>();
          for (let i = 0; i < idList.length; i += 80) {
            const slice = idList.slice(i, i + 80);
            const placeholders = slice.map(() => '?').join(',');
            const { results: batchRows } = await env.DB.prepare(
              `SELECT ${qSelectCols} FROM questions WHERE id IN (${placeholders})`
            )
              .bind(...slice)
              .all<Record<string, any>>();
            for (const r of batchRows || []) {
              const rid = String(r.id || '');
              rowById.set(rid, r);
              const bare = rid.includes(':') ? rid.slice(rid.indexOf(':') + 1) : rid;
              if (!rowByBareId.has(bare)) rowByBareId.set(bare, r);
            }
          }

          const matchedQuestions: Record<string, any>[] = [];
          for (const reqId of requestedIds) {
            const bareId = reqId.includes(':') ? reqId.slice(reqId.indexOf(':') + 1) : reqId;
            const row = rowById.get(reqId) || rowByBareId.get(bareId);
            if (!row) continue;
            if (!isStrictQuestionAdmin && String(row.status) !== 'published') continue;
            const dto = rowToQuestionDto(row, isStrictQuestionAdmin);
            dto.id = reqId;
            matchedQuestions.push(dto);
          }
          return jsonResponse(
            {
              success: true,
              questions: matchedQuestions,
              total: matchedQuestions.length,
              hasMore: false,
            },
            200,
            cors
          );
        }

        const clauses: string[] = [];
        const binds: any[] = [];

        if (!isStrictQuestionAdmin) {
          clauses.push("status = 'published'");
        } else if (statusParam && statusParam !== 'all') {
          clauses.push('status = ?');
          binds.push(statusParam);
        }

        if (bank && bank !== 'all') {
          clauses.push('bank_id = ?');
          binds.push(bank);
        }
        if (subject && subject !== 'all') {
          clauses.push('subject = ? COLLATE NOCASE');
          binds.push(subject);
        }
        if (topic && topic !== 'all') {
          clauses.push('topic = ? COLLATE NOCASE');
          binds.push(topic);
        }
        if (difficulty && difficulty !== 'all' && difficulty !== 'mixed') {
          clauses.push('difficulty = ? COLLATE NOCASE');
          binds.push(difficulty);
        }
        if (needsReviewParam === '1' || needsReviewParam === 'true') {
          clauses.push('needs_review = 1');
        } else if (needsReviewParam === '0' || needsReviewParam === 'false') {
          clauses.push('needs_review = 0');
        }
        if (search) {
          clauses.push(
            '(LOWER(question_text) LIKE ? OR LOWER(topic) LIKE ? OR LOWER(id) LIKE ? OR LOWER(options_json) LIKE ?)'
          );
          const likeTerm = `%${search}%`;
          binds.push(likeTerm, likeTerm, likeTerm, likeTerm);
        }

        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        const countCacheKey = `questions:count:${isStrictQuestionAdmin ? 'adm' : 'pub'}:${whereSql}:${binds.join('|')}`;
        let total = getWorkerCached<number>(countCacheKey);
        if (total === null) {
          const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM questions ${whereSql}`)
            .bind(...binds)
            .first<{ cnt: number }>();
          total = setWorkerCached(countCacheKey, Number(countRow?.cnt ?? 0), 2 * 60_000);
        }

        const { results } = await env.DB.prepare(
          `SELECT ${qSelectCols} FROM questions ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
        )
          .bind(...binds, limitCount, offset)
          .all();

        const questions = (results || []).map((r: any) =>
          rowToQuestionDto(r, isStrictQuestionAdmin)
        );

        return jsonResponse(
          {
            success: true,
            questions,
            total,
            limit: limitCount,
            offset,
            hasMore: offset + questions.length < total,
          },
          200,
          cors
        );
      }

      // POST /api/questions — Admin-only Create or Batch Import
      if (qSub === '/' && req.method === 'POST') {
        if (!user) {
          return jsonResponse({ success: false, error: 'Authentication required' }, 401, cors);
        }
        if (!isStrictQuestionAdmin) {
          return jsonResponse(
            { success: false, error: 'Forbidden: Only shsvirtualadmin@gmail.com may create or import questions' },
            403,
            cors
          );
        }

        const body = (await req.json().catch(() => ({}))) as Record<string, any>;
        const rawItems: Record<string, any>[] = Array.isArray(body.questions)
          ? body.questions
          : [body];

        const now = Date.now();
        let importedCount = 0;
        let duplicatesSkipped = 0;
        const createdQuestions: Record<string, any>[] = [];
        const errors: string[] = [];

        for (const item of rawItems) {
          const bankId = String(item.bank_id || item.sourceId || body.bank_id || body.sourceId || 'bank2').trim();
          const subject = normalizeSubSlug(String(item.subject || body.subject || 'mathematics'));
          const topic = String(item.topic || item.chapter || body.topic || 'General Concepts').trim() || 'General Concepts';
          const difficulty = String(item.difficulty || 'medium').trim().toLowerCase();
          const status = String(item.status || 'published').trim().toLowerCase();
          const rawQ = String(item.question_text || item.text || item.q || item.question || '').trim();
          const rawOpts = Array.isArray(item.options)
            ? item.options.map((o: any) => String(o ?? ''))
            : ['', '', '', ''];
          const rawExp = String(item.explanation || item.explain || '').trim();

          if (!rawQ || rawOpts.length < 4 || rawOpts.slice(0, 4).some((o: string) => !o.trim())) {
            errors.push('Question text and 4 non-empty options are required.');
            continue;
          }

          const katexRes = validateAndNormalizeQuestionMath(rawQ, rawOpts, rawExp);
          const correctAns = Number(
            item.correct_answer !== undefined
              ? item.correct_answer
              : item.correct !== undefined
              ? item.correct
              : item.correctAnswer ?? 0
          );
          const validCorrect = Number.isInteger(correctAns) && correctAns >= 0 && correctAns <= 3;
          const needsReview = !katexRes.valid || !validCorrect || Boolean(item.needs_review) ? 1 : 0;

          // Compute deterministic hash for ID if not provided
          const hashInput = `${subject}::${katexRes.questionText}::${katexRes.options.join('||')}`;
          const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
          const hashHex = Array.from(new Uint8Array(hashBuf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .slice(0, 20);

          const rawId = item.id ? String(item.id).trim() : `pool_${subject}_${hashHex}`;
          const bareId = rawId.includes(':') ? rawId.slice(rawId.indexOf(':') + 1) : rawId;
          const finalId = `${bankId}:${bareId}`;
          const sourcePath = String(
            item.source_path || `questions_${subject.replace(/-/g, '_')}/${bareId}`
          );

          if (Array.isArray(body.questions)) {
            const exists = await env.DB.prepare(
              'SELECT id FROM questions WHERE id = ? OR (bank_id = ? AND source_path = ?) LIMIT 1'
            )
              .bind(finalId, bankId, sourcePath)
              .first();
            if (exists) {
              duplicatesSkipped++;
              continue;
            }
          }

          await env.DB.prepare(
            `INSERT OR REPLACE INTO questions (
              id, bank_id, subject, topic, difficulty, status, needs_review,
              question_text, options_json, correct_answer, explanation, source_path,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              finalId,
              bankId,
              subject,
              topic,
              difficulty,
              status,
              needsReview,
              katexRes.questionText,
              JSON.stringify(katexRes.options),
              validCorrect ? correctAns : 0,
              katexRes.explanation,
              sourcePath,
              now,
              now
            )
            .run();

          importedCount++;
          const savedRow = await env.DB.prepare('SELECT * FROM questions WHERE id = ? LIMIT 1')
            .bind(finalId)
            .first<Record<string, any>>();
          if (savedRow) {
            createdQuestions.push(rowToQuestionDto(savedRow, true));
          }
        }

        if (importedCount > 0 && Array.isArray(body.questions)) {
          const bankId = String(body.bank_id || body.sourceId || 'bank2');
          const subject = normalizeSubSlug(String(body.subject || 'mathematics'));
          await env.DB.prepare(
            `INSERT INTO questions_import_log (
              id, bank_id, subject, total_read, imported_count, needs_review_count, source_type, imported_at
            ) VALUES (?, ?, ?, ?, ?, 0, 'admin_import', ?)`
          )
            .bind(
              `import_${bankId}_${subject}_${now}`,
              bankId,
              subject,
              rawItems.length,
              importedCount,
              now
            )
            .run();
        }

        if (!Array.isArray(body.questions) && createdQuestions.length === 0) {
          return jsonResponse(
            { success: false, error: errors[0] || 'Invalid question payload' },
            400,
            cors
          );
        }

        invalidateWorkerCache(['questions:']);
        return jsonResponse(
          {
            success: true,
            question: createdQuestions[0] || null,
            imported: importedCount,
            duplicatesSkipped,
            errors,
          },
          201,
          cors
        );
      }

      // Single question routes: GET / PUT / PATCH / DELETE /api/questions/:id
      const targetId = decodeURIComponent(qSub.slice(1));
      if (targetId) {
        const candidateIds = buildQuestionCandidateIds(targetId);
        const candidatePlaceholders = candidateIds.map(() => '?').join(',');

        if (req.method === 'GET') {
          const qSelectCols = isStrictQuestionAdmin ? QUESTION_ADMIN_COLS : QUESTION_PUBLIC_COLS;
          const row = await env.DB.prepare(
            `SELECT ${qSelectCols} FROM questions WHERE id IN (${candidatePlaceholders}) LIMIT 1`
          )
            .bind(...candidateIds)
            .first<Record<string, any>>();
          if (!row || (!isStrictQuestionAdmin && String(row.status) !== 'published')) {
            return jsonResponse({ success: false, error: 'Question not found' }, 404, cors);
          }
          return jsonResponse(
            {
              success: true,
              question: rowToQuestionDto(row, isStrictQuestionAdmin),
            },
            200,
            cors
          );
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
          if (!user) {
            return jsonResponse({ success: false, error: 'Authentication required' }, 401, cors);
          }
          if (!isStrictQuestionAdmin) {
            return jsonResponse(
              { success: false, error: 'Forbidden: Only shsvirtualadmin@gmail.com may update questions' },
              403,
              cors
            );
          }

          const existing = await env.DB.prepare(
            `SELECT ${QUESTION_ADMIN_COLS} FROM questions WHERE id IN (${candidatePlaceholders}) LIMIT 1`
          )
            .bind(...candidateIds)
            .first<Record<string, any>>();
          if (!existing) {
            return jsonResponse({ success: false, error: 'Question not found' }, 404, cors);
          }

          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          let existingOpts: string[] = ['', '', '', ''];
          try {
            existingOpts = JSON.parse(String(existing.options_json || '[]'));
          } catch {}

          const nextSubject =
            body.subject !== undefined ? normalizeSubSlug(String(body.subject)) : existing.subject;
          const nextTopic =
            body.topic !== undefined || body.chapter !== undefined
              ? String(body.topic ?? body.chapter).trim()
              : existing.topic;
          const nextDifficulty =
            body.difficulty !== undefined
              ? String(body.difficulty).trim().toLowerCase()
              : existing.difficulty;
          const nextStatus =
            body.status !== undefined
              ? String(body.status).trim().toLowerCase()
              : existing.status;

          const rawQ =
            body.question_text !== undefined || body.text !== undefined || body.q !== undefined
              ? String(body.question_text ?? body.text ?? body.q)
              : String(existing.question_text);
          const rawOpts = Array.isArray(body.options)
            ? body.options.map((o: any) => String(o ?? ''))
            : existingOpts;
          const rawExp =
            body.explanation !== undefined || body.explain !== undefined
              ? String(body.explanation ?? body.explain)
              : String(existing.explanation || '');

          const katexRes = validateAndNormalizeQuestionMath(rawQ, rawOpts, rawExp);
          const nextCorrect =
            body.correct_answer !== undefined || body.correct !== undefined || body.correctAnswer !== undefined
              ? Number(body.correct_answer ?? body.correct ?? body.correctAnswer)
              : Number(existing.correct_answer ?? 0);
          const needsReview =
            body.needs_review !== undefined
              ? Number(body.needs_review ? 1 : 0)
              : !katexRes.valid
              ? 1
              : 0;
          const now = Date.now();

          await env.DB.prepare(
            `UPDATE questions
             SET subject = ?, topic = ?, difficulty = ?, status = ?, needs_review = ?,
                 question_text = ?, options_json = ?, correct_answer = ?, explanation = ?, updated_at = ?
             WHERE id = ?`
          )
            .bind(
              nextSubject,
              nextTopic,
              nextDifficulty,
              nextStatus,
              needsReview,
              katexRes.questionText,
              JSON.stringify(katexRes.options),
              nextCorrect,
              katexRes.explanation,
              now,
              existing.id
            )
            .run();

          const updated = await env.DB.prepare('SELECT * FROM questions WHERE id = ? LIMIT 1')
            .bind(existing.id)
            .first<Record<string, any>>();
          return jsonResponse(
            {
              success: true,
              question: updated ? rowToQuestionDto(updated, true) : null,
            },
            200,
            cors
          );
        }

        if (req.method === 'DELETE') {
          if (!user) {
            return jsonResponse({ success: false, error: 'Authentication required' }, 401, cors);
          }
          if (!isStrictQuestionAdmin) {
            return jsonResponse(
              { success: false, error: 'Forbidden: Only shsvirtualadmin@gmail.com may delete questions' },
              403,
              cors
            );
          }

          const existing = await env.DB.prepare(
            `SELECT id FROM questions WHERE id IN (${candidatePlaceholders}) LIMIT 1`
          )
            .bind(...candidateIds)
            .first<{ id: string }>();
          if (!existing) {
            return jsonResponse({ success: false, error: 'Question not found' }, 404, cors);
          }

          await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(existing.id).run();
          invalidateWorkerCache(['questions:']);
          return jsonResponse({ success: true, deletedId: existing.id }, 200, cors);
        }
      }

      return jsonResponse({ error: 'Questions endpoint not found' }, 404, cors);
    }

    // 2c. Automated bot endpoints have been retired (previously published posts remain untouched)
    if (url.pathname.startsWith('/api/bots')) {
      return jsonResponse({ error: 'Automated bots have been removed.' }, 410, cors);
    }

    // 2b-r2. Public R2 & D1 object streaming at /api/media/* and /api/r2/* (e.g. university logos & study materials)
    if (
      (url.pathname.startsWith('/api/media/') ||
        url.pathname.startsWith('/api/r2/') ||
        url.pathname.startsWith('/api/commons/r2/')) &&
      req.method === 'GET'
    ) {
      const prefix = url.pathname.startsWith('/api/commons/r2/')
        ? '/api/commons/r2/'
        : url.pathname.startsWith('/api/media/')
        ? '/api/media/'
        : '/api/r2/';
      const rawKey = decodeURIComponent(url.pathname.slice(prefix.length))
        .replace(/\.\./g, '')
        .replace(/^\/+/, '');
      if (!rawKey) {
        return jsonResponse({ success: false, error: 'Missing R2 key.' }, 400, cors);
      }
      if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
        return jsonResponse({ success: false, error: 'Forbidden private prefix.' }, 403, cors);
      }
      if (env.R2_BUCKET) {
        const obj = await env.R2_BUCKET.get(rawKey).catch(() => null);
        if (obj) {
          const contentType = obj.httpMetadata?.contentType || inferMimeTypeFromKey(rawKey);
          return new Response(obj.body, {
            status: 200,
            headers: {
              ...cors,
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Cross-Origin-Resource-Policy': 'cross-origin',
            },
          });
        }
      }
      if (env.DB && rawKey.startsWith('universities/logos/')) {
        try {
          const segs = rawKey.split('/');
          const uniKeyHint = segs.length >= 3 ? segs[2] : '';
          const row = await env.DB.prepare(
            `SELECT mime_type, data_base64
             FROM university_logo_assets
             WHERE r2_key = ? OR (university_id = ? AND data_base64 != '')
             ORDER BY CASE WHEN r2_key = ? THEN 0 ELSE 1 END
             LIMIT 1`
          )
            .bind(rawKey, uniKeyHint, rawKey)
            .first<{ mime_type?: string; data_base64?: string }>();
          if (row?.data_base64) {
            const cleanB64 = row.data_base64.includes(',')
              ? row.data_base64.slice(row.data_base64.indexOf(',') + 1)
              : row.data_base64;
            const decoded = base64ToUint8Array(cleanB64);
            return new Response(decoded, {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': row.mime_type || inferMimeTypeFromKey(rawKey),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Cross-Origin-Resource-Policy': 'cross-origin',
              },
            });
          }
        } catch {
          // Table or column may not exist yet
        }
        return jsonResponse({ success: false, error: 'Logo file not found.' }, 404, cors);
      }
    }

    // 2c. API Routes under /api/universities, /api/mcqs, and /api/admin/legacy-bank
    if (
      url.pathname.startsWith('/api/universities') ||
      url.pathname.startsWith('/api/mcqs') ||
      url.pathname.startsWith('/api/admin/legacy-bank')
    ) {
      if (!env.DB) {
        return jsonResponse({ success: false, error: 'Cloudflare D1 binding (DB) is missing.' }, 503, cors);
      }

      const verifyD1Admin = async (): Promise<VerifiedFirebaseUser | null> => {
        const check = await requireAdmin({ request: req, env: env as any });
        if (!check.ok || !check.caller) return null;
        return {
          uid: check.caller.uid,
          email: check.caller.email,
          name: check.caller.name,
          picture: '',
          emailVerified: check.caller.emailVerified,
          role: check.caller.role,
          captain: check.caller.captain,
          admin: check.caller.admin,
          superAdmin: check.caller.superAdmin,
          customRole: null,
        };
      };

      const recalculateD1UniCount = async (uniId: string) => {
        const countRow = await env.DB!.prepare(
          'SELECT COUNT(*) AS cnt FROM mcqs WHERE university_id = ?'
        )
          .bind(uniId)
          .first<{ cnt: number }>();
        const cnt = Number(countRow?.cnt || 0);
        await env.DB!.prepare(
          'UPDATE universities SET mcq_count = ?, is_live = ? WHERE id = ?'
        )
          .bind(cnt, cnt > 0 ? 1 : 0, uniId)
          .run();
        invalidateWorkerCache(['universities:', 'mcqs:']);
      };

      const recalculateAllD1UniCounts = async () => {
        const [{ results: unis }, { results: counts }] = await Promise.all([
          env.DB!.prepare('SELECT id FROM universities').all<{ id: string }>(),
          env.DB!.prepare(
            'SELECT university_id, COUNT(*) AS cnt FROM mcqs GROUP BY university_id'
          ).all<{ university_id: string; cnt: number }>(),
        ]);
        const countMap = new Map<string, number>();
        for (const r of counts || []) {
          if (r.university_id) countMap.set(String(r.university_id), Number(r.cnt || 0));
        }
        const stmts = (unis || []).map((u) => {
          const cnt = countMap.get(String(u.id)) || 0;
          return env.DB!.prepare(
            'UPDATE universities SET mcq_count = ?, is_live = ? WHERE id = ?'
          ).bind(cnt, cnt > 0 ? 1 : 0, u.id);
        });
        if (stmts.length > 0) {
          await env.DB!.batch(stmts);
        }
        invalidateWorkerCache(['universities:', 'mcqs:']);
      };

      const getSafePublicOrigin = (): string => {
        const host = url.host || '';
        const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
        return isLocal ? url.origin : `https://${host}`;
      };

      const resolveWorkerUniversityLogoUrl = (
        rawLogoUrl?: string | null,
        assetR2Key?: string | null,
        updatedAt?: number | string | null
      ): string => {
        let clean = String(rawLogoUrl || '').trim();
        const r2KeyClean = String(assetR2Key || '').trim().replace(/^\/+/, '');
        if (!clean && r2KeyClean) {
          clean = `/api/media/${r2KeyClean}`;
        }
        if (!clean) return '';
        if (clean.startsWith('data:image/')) return clean;

        // Extract query param version if already attached
        let existingVersion = '';
        let pathPart = clean;
        const qIdx = clean.indexOf('?');
        if (qIdx >= 0 && !clean.includes('/api/posts/file')) {
          pathPart = clean.slice(0, qIdx);
          const qs = new URLSearchParams(clean.slice(qIdx + 1));
          existingVersion = qs.get('v') || '';
        }

        const versionTag = String(updatedAt || existingVersion || '').trim();
        const origin = getSafePublicOrigin();

        const appendVersion = (targetUrl: string): string => {
          if (!versionTag) return targetUrl;
          if (/[?&]v=/.test(targetUrl)) return targetUrl;
          return `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionTag)}`;
        };

        if (pathPart.startsWith('http://') || pathPart.startsWith('https://')) {
          let normalizedFull = clean.replace('/api/r2/', '/api/media/').replace('/api/commons/r2/', '/api/media/');
          if (normalizedFull.startsWith('http://') && !normalizedFull.includes('localhost') && !normalizedFull.includes('127.0.0.1')) {
            normalizedFull = 'https://' + normalizedFull.slice('http://'.length);
          }
          return appendVersion(normalizedFull);
        }

        if (clean.includes('/api/posts/file')) {
          try {
            const u = new URL(clean, origin);
            const k = String(u.searchParams.get('key') || '').replace(/\.\./g, '').replace(/^\/+/, '');
            if (k) {
              return appendVersion(`${origin}/api/media/${k}`);
            }
          } catch {
            // Fall through
          }
        }

        if (pathPart.startsWith('/api/r2/')) {
          const k = pathPart.slice('/api/r2/'.length).replace(/^\/+/, '');
          return k ? appendVersion(`${origin}/api/media/${k}`) : '';
        }
        if (pathPart.startsWith('/api/commons/r2/')) {
          const k = pathPart.slice('/api/commons/r2/'.length).replace(/^\/+/, '');
          return k ? appendVersion(`${origin}/api/media/${k}`) : '';
        }
        if (pathPart.startsWith('/api/media/')) {
          const k = pathPart.slice('/api/media/'.length).replace(/^\/+/, '');
          return k ? appendVersion(`${origin}/api/media/${k}`) : '';
        }
        if (pathPart.startsWith('/')) {
          return appendVersion(`${origin}${pathPart}`);
        }
        // Raw R2 key like "universities/logos/uni_sat/..."
        return appendVersion(`${origin}/api/media/${pathPart.replace(/^\/+/, '')}`);
      };

      const purgeWorkerUniversitiesCache = async () => {
        invalidateWorkerCache(['universities:', 'mcqs:']);
        try {
          const cacheStorage = (globalThis as any).caches?.default;
          if (cacheStorage && typeof cacheStorage.delete === 'function') {
            const targetUrl = new URL('/api/universities', url.origin).toString();
            await cacheStorage.delete(targetUrl).catch(() => {});
            await cacheStorage.delete(new Request(targetUrl, { method: 'GET' })).catch(() => {});
          }
        } catch {
          // Non-fatal
        }
      };

      const resolveCachedUniversity = async (
        uniParam: string
      ): Promise<{ id: string; mcq_count: number } | null> => {
        const key = uniParam.trim().toLowerCase();
        if (!key) return null;
        let unis = getWorkerCached<D1UniversityRow[]>('universities:list');
        if (!unis) {
          unis = setWorkerCached(
            'universities:list',
            await fetchNormalizedD1Universities(),
            5 * 60_000
          );
        }
        const match = unis.find(
          (u) =>
            String(u.id || '').toLowerCase() === key ||
            String(u.slug || '').toLowerCase() === key ||
            String(u.name || '').toLowerCase() === key
        );
        return match ? { id: String(match.id), mcq_count: Number(match.mcq_count || 0) } : null;
      };

      const fetchNormalizedD1Universities = async (): Promise<D1UniversityRow[]> => {
        let rows: Array<D1UniversityRow & { asset_r2_key?: string; asset_logo_url?: string; logo_updated_at?: number }> = [];
        try {
          const res = await env.DB!.prepare(
            `SELECT
               u.id,
               u.name,
               u.slug,
               u.logo_url,
               u.sort_order,
               u.mcq_count,
               u.is_live,
               u.created_at,
               ula.r2_key AS asset_r2_key,
               ula.logo_url AS asset_logo_url,
               ula.updated_at AS logo_updated_at
             FROM universities u
             LEFT JOIN university_logo_assets ula ON ula.university_id = u.id
             ORDER BY u.sort_order ASC, u.name ASC`
          ).all<D1UniversityRow & { asset_r2_key?: string; asset_logo_url?: string; logo_updated_at?: number }>();
          rows = res.results || [];
        } catch {
          const res = await env.DB!.prepare(
            'SELECT id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at FROM universities ORDER BY sort_order ASC, name ASC'
          ).all<D1UniversityRow>();
          rows = res.results || [];
        }

        const normalized = rows.map((row) => {
          const rawLogo = String(row.logo_url || row.asset_logo_url || '').trim();
          const resolvedLogo = resolveWorkerUniversityLogoUrl(
            rawLogo,
            row.asset_r2_key,
            row.logo_updated_at
          );
          if (
            row.slug?.toLowerCase() === 'sat' ||
            row.id?.toLowerCase() === 'uni_sat' ||
            row.name?.trim().toUpperCase() === 'SAT'
          ) {
            console.info('[D1 Universities] SAT logo_url column value:', {
              id: row.id,
              name: row.name,
              slug: row.slug,
              d1_logo_url: row.logo_url,
              asset_r2_key: row.asset_r2_key || null,
              logo_updated_at: row.logo_updated_at || null,
              resolved_logo_url: resolvedLogo,
            });
          }
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            logo_url: resolvedLogo,
            logoUrl: resolvedLogo,
            sort_order: Number(row.sort_order || 0),
            mcq_count: Number(row.mcq_count || 0),
            is_live: Number(row.is_live || 0),
            created_at: row.created_at,
            updated_at: row.logo_updated_at || undefined,
          } as D1UniversityRow;
        });

        return normalized;
      };

      // ── /api/universities ─────────────────────────────────────────────────
      if (url.pathname.startsWith('/api/universities')) {
        const uniSub = url.pathname.slice('/api/universities'.length).replace(/\/+$/, '') || '/';

        // GET /api/universities — Read-only + 5-min memory & edge cache (counts maintained on writes)
        if (uniSub === '/' && req.method === 'GET') {
          if (!checkPublicIpRateLimit(req, 'universities_list', 180, 60_000)) {
            return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
          }
          const cacheHeaders = { ...cors, 'Cache-Control': 'public, max-age=120, s-maxage=300' };
          const cachedUnis = getWorkerCached<D1UniversityRow[]>('universities:list');
          if (cachedUnis) {
            return jsonResponse({ success: true, universities: cachedUnis }, 200, cacheHeaders);
          }
          const universities = setWorkerCached(
            'universities:list',
            await fetchNormalizedD1Universities(),
            5 * 60_000
          );
          return jsonResponse({ success: true, universities }, 200, cacheHeaders);
        }

        const adminUser = await verifyD1Admin();
        if (!adminUser) {
          return jsonResponse(
            { success: false, error: 'Forbidden: Only admin and superadmin can manage universities.' },
            403,
            cors
          );
        }

        const allowed = await checkRateLimit(env, `uni_admin:${adminUser.uid}`, 120, 60 * 1000);
        if (!allowed) {
          return jsonResponse({ success: false, error: 'Rate limit exceeded.' }, 429, cors);
        }

        // POST /api/universities
        if (uniSub === '/' && req.method === 'POST') {
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const name = String(body.name || '').trim().slice(0, 120);
          if (!name) {
            return jsonResponse({ success: false, error: 'University name is required.' }, 400, cors);
          }
          const slug = buildUniversitySlug(String(body.slug || name));
          const dup = await env.DB.prepare('SELECT id FROM universities WHERE LOWER(slug) = LOWER(?) LIMIT 1')
            .bind(slug)
            .first();
          if (dup) {
            return jsonResponse({ success: false, error: `University slug "${slug}" already exists.` }, 409, cors);
          }
          const maxRow = await env.DB.prepare('SELECT MAX(sort_order) as max_sort FROM universities').first<{ max_sort: number }>();
          const sortOrder = Number.isFinite(Number(body.sort_order))
            ? Number(body.sort_order)
            : Number(maxRow?.max_sort || 0) + 1;
          const id = String(body.id || `uni_${slug.replace(/-/g, '_')}_${crypto.randomUUID().slice(0, 6)}`);
          const logoUrl = String(body.logo_url || '').trim();
          const nowIso = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO universities (id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at)
             VALUES (?, ?, ?, ?, ?, 0, 0, ?)`
          )
            .bind(id, name, slug, logoUrl, sortOrder, nowIso)
            .run();

          await purgeWorkerUniversitiesCache();
          const allUnis = await fetchNormalizedD1Universities();
          const created = allUnis.find((u) => u.id === id) || null;
          return jsonResponse({ success: true, university: created }, 201, cors);
        }

        // POST /api/universities/reorder
        if (uniSub === '/reorder' && req.method === 'POST') {
          const body = (await req.json().catch(() => ({}))) as { orderedIds?: string[] };
          const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.map(String) : [];
          if (orderedIds.length === 0) {
            return jsonResponse({ success: false, error: 'orderedIds array is required.' }, 400, cors);
          }
          const stmts = orderedIds.map((id, idx) =>
            env.DB!.prepare('UPDATE universities SET sort_order = ? WHERE id = ? OR slug = ?').bind(
              idx + 1,
              id,
              id
            )
          );
          await env.DB.batch(stmts);
          await purgeWorkerUniversitiesCache();
          const universities = await fetchNormalizedD1Universities();
          return jsonResponse({ success: true, universities }, 200, cors);
        }

        const extractWorkerLogoR2Key = (rawUrl?: string | null): string | null => {
          const clean = String(rawUrl || '').trim();
          if (!clean) return null;
          const noQuery = clean.split('?')[0];
          if (noQuery.startsWith('/api/r2/')) {
            const key = decodeURIComponent(noQuery.slice('/api/r2/'.length))
              .replace(/\.\./g, '')
              .replace(/^\/+/, '');
            return key || null;
          }
          if (noQuery.startsWith('/api/media/')) {
            const key = decodeURIComponent(noQuery.slice('/api/media/'.length))
              .replace(/\.\./g, '')
              .replace(/^\/+/, '');
            return key || null;
          }
          if (noQuery.includes('/api/media/')) {
            const idx = noQuery.indexOf('/api/media/');
            const key = decodeURIComponent(noQuery.slice(idx + '/api/media/'.length))
              .replace(/\.\./g, '')
              .replace(/^\/+/, '');
            return key || null;
          }
          if (noQuery.includes('/api/r2/')) {
            const idx = noQuery.indexOf('/api/r2/');
            const key = decodeURIComponent(noQuery.slice(idx + '/api/r2/'.length))
              .replace(/\.\./g, '')
              .replace(/^\/+/, '');
            return key || null;
          }
          if (clean.includes('/api/posts/file')) {
            try {
              const u = new URL(clean, 'http://localhost');
              const key = String(u.searchParams.get('key') || '')
                .replace(/\.\./g, '')
                .replace(/^\/+/, '');
              return key || null;
            } catch {
              return null;
            }
          }
          if (noQuery.startsWith('universities/logos/')) {
            return noQuery;
          }
          return null;
        };

        const deleteOldWorkerUniversityLogo = async (uniId: string, oldLogoUrl?: string | null) => {
          const keysToDelete = new Set<string>();
          const parsedKey = extractWorkerLogoR2Key(oldLogoUrl);
          if (parsedKey && parsedKey.startsWith('universities/logos/')) {
            keysToDelete.add(parsedKey);
          }
          try {
            const assetRow = await env.DB!.prepare(
              'SELECT r2_key FROM university_logo_assets WHERE university_id = ? LIMIT 1'
            )
              .bind(uniId)
              .first<{ r2_key: string }>();
            if (assetRow?.r2_key) {
              keysToDelete.add(assetRow.r2_key);
            }
            await env.DB!.prepare('DELETE FROM university_logo_assets WHERE university_id = ?')
              .bind(uniId)
              .run();
          } catch {
            // Table may not exist yet before migration runs
          }
          if (env.R2_BUCKET && keysToDelete.size > 0) {
            await Promise.all(
              Array.from(keysToDelete).map((k) => env.R2_BUCKET!.delete(k).catch(() => {}))
            );
          }
        };

        // Check for /api/universities/:id/logo sub-route
        const subSegments = uniSub.split('/').filter(Boolean);
        if (subSegments.length === 2 && subSegments[1] === 'logo') {
          const logoTargetId = decodeURIComponent(subSegments[0]);
          const existingUni = await env.DB.prepare(
            'SELECT * FROM universities WHERE id = ? OR slug = ? LIMIT 1'
          )
            .bind(logoTargetId, logoTargetId)
            .first<D1UniversityRow>();
          if (!existingUni) {
            return jsonResponse({ success: false, error: 'University not found.' }, 404, cors);
          }

          // POST /api/universities/:id/logo — Upload or Replace logo
          if (req.method === 'POST') {
            const body = (await req.json().catch(() => ({}))) as Record<string, any>;
            const rawName = String(body.fileName || body.name || 'logo.webp').trim();
            const mimeType = String(body.mimeType || body.fileType || body.type || '')
              .trim()
              .toLowerCase();
            const dataBase64 = String(body.dataBase64 || '').trim();

            if (!dataBase64) {
              return jsonResponse({ success: false, error: 'Missing logo image payload.' }, 400, cors);
            }

            const allowedLogoMimes = new Set([
              'image/png',
              'image/jpeg',
              'image/webp',
              'image/svg+xml',
            ]);
            const lowerName = rawName.toLowerCase();
            const hasValidExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].some((ext) =>
              lowerName.endsWith(ext)
            );
            if (!allowedLogoMimes.has(mimeType) || !hasValidExt) {
              return jsonResponse(
                {
                  success: false,
                  error: 'Unsupported file type. Allowed formats: PNG, JPG, WEBP, and SVG.',
                },
                415,
                cors
              );
            }

            const cleanBase64 = dataBase64.includes(',')
              ? dataBase64.slice(dataBase64.indexOf(',') + 1)
              : dataBase64;
            const decoded = base64ToUint8Array(cleanBase64);
            const fileSize = decoded.byteLength;
            if (fileSize === 0) {
              return jsonResponse(
                { success: false, error: 'Uploaded logo file is empty (0 bytes).' },
                400,
                cors
              );
            }
            if (fileSize > 2 * 1024 * 1024) {
              return jsonResponse(
                { success: false, error: 'Logo file exceeds the 2 MB maximum size limit.' },
                413,
                cors
              );
            }

            const ext =
              mimeType === 'image/svg+xml'
                ? 'svg'
                : mimeType === 'image/png'
                ? 'png'
                : mimeType === 'image/jpeg'
                ? 'jpg'
                : 'webp';
            const safeUniKey = existingUni.id.replace(/[^a-zA-Z0-9_-]/g, '_');
            const randId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
            const r2Key = `universities/logos/${safeUniKey}/${randId}-logo.${ext}`;
            const updatedAt = Date.now();

            // Delete old file before uploading replacement
            await deleteOldWorkerUniversityLogo(existingUni.id, existingUni.logo_url);

            if (env.R2_BUCKET) {
              await env.R2_BUCKET.put(r2Key, decoded, {
                httpMetadata: {
                  contentType: mimeType,
                  cacheControl: 'public, max-age=31536000, immutable',
                },
                customMetadata: {
                  universityId: existingUni.id,
                  uploadedBy: adminUser.uid,
                },
              });
            }

            const storedPath = `/api/media/${r2Key}?v=${updatedAt}`;
            const fullLogoUrl = resolveWorkerUniversityLogoUrl(storedPath, r2Key, updatedAt);
            await env.DB.prepare('UPDATE universities SET logo_url = ? WHERE id = ?')
              .bind(fullLogoUrl, existingUni.id)
              .run();

            try {
              await env.DB.prepare(
                `CREATE TABLE IF NOT EXISTS university_logo_assets (
                  id TEXT PRIMARY KEY,
                  university_id TEXT NOT NULL UNIQUE,
                  r2_key TEXT NOT NULL,
                  logo_url TEXT NOT NULL,
                  mime_type TEXT NOT NULL DEFAULT 'image/webp',
                  file_size INTEGER NOT NULL DEFAULT 0,
                  uploaded_by_uid TEXT NOT NULL DEFAULT '',
                  data_base64 TEXT NOT NULL DEFAULT '',
                  created_at TEXT NOT NULL DEFAULT (datetime('now')),
                  updated_at INTEGER NOT NULL DEFAULT 0
                )`
              ).run();
              await env.DB.prepare(
                `ALTER TABLE university_logo_assets ADD COLUMN data_base64 TEXT NOT NULL DEFAULT ''`
              )
                .run()
                .catch(() => {});
              await env.DB.prepare(
                `INSERT OR REPLACE INTO university_logo_assets (
                  id, university_id, r2_key, logo_url, mime_type, file_size, uploaded_by_uid, data_base64, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
                .bind(
                  `ulogo_${existingUni.id}`,
                  existingUni.id,
                  r2Key,
                  fullLogoUrl,
                  mimeType,
                  fileSize,
                  adminUser.uid,
                  cleanBase64,
                  updatedAt
                )
                .run();
            } catch {
              // Fallback if data_base64 column wasn't available
              try {
                await env.DB.prepare(
                  `INSERT OR REPLACE INTO university_logo_assets (
                    id, university_id, r2_key, logo_url, mime_type, file_size, uploaded_by_uid, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                )
                  .bind(
                    `ulogo_${existingUni.id}`,
                    existingUni.id,
                    r2Key,
                    fullLogoUrl,
                    mimeType,
                    fileSize,
                    adminUser.uid,
                    updatedAt
                  )
                  .run();
              } catch {
                // Non-fatal
              }
            }

            await recalculateD1UniCount(existingUni.id);
            await purgeWorkerUniversitiesCache();
            const allUnis = await fetchNormalizedD1Universities();
            const updated = allUnis.find((u) => u.id === existingUni.id) || {
              ...existingUni,
              logo_url: fullLogoUrl,
            };
            return jsonResponse({ success: true, logo_url: fullLogoUrl, university: updated }, 200, cors);
          }

          // DELETE /api/universities/:id/logo — Remove logo and delete old file
          if (req.method === 'DELETE') {
            await deleteOldWorkerUniversityLogo(existingUni.id, existingUni.logo_url);
            await env.DB.prepare("UPDATE universities SET logo_url = '' WHERE id = ?")
              .bind(existingUni.id)
              .run();
            await recalculateD1UniCount(existingUni.id);
            await purgeWorkerUniversitiesCache();
            const allUnis = await fetchNormalizedD1Universities();
            const updated = allUnis.find((u) => u.id === existingUni.id) || {
              ...existingUni,
              logo_url: '',
            };
            return jsonResponse({ success: true, university: updated }, 200, cors);
          }
        }

        const targetId = decodeURIComponent(uniSub.slice(1));
        if (!targetId) {
          return jsonResponse({ success: false, error: 'University ID required.' }, 400, cors);
        }

        // PUT / PATCH /api/universities/:id
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const existing = await env.DB.prepare(
            'SELECT * FROM universities WHERE id = ? OR slug = ? LIMIT 1'
          )
            .bind(targetId, targetId)
            .first<D1UniversityRow>();
          if (!existing) {
            return jsonResponse({ success: false, error: 'University not found.' }, 404, cors);
          }
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const nextName = body.name !== undefined ? String(body.name).trim() : existing.name;
          const nextSlug =
            body.slug !== undefined ? buildUniversitySlug(String(body.slug)) : existing.slug;
          const nextLogo =
            body.logo_url !== undefined ? String(body.logo_url).trim() : existing.logo_url;
          const nextSort =
            body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))
              ? Number(body.sort_order)
              : existing.sort_order;

          if (existing.logo_url && existing.logo_url !== nextLogo) {
            await deleteOldWorkerUniversityLogo(existing.id, existing.logo_url);
          }

          await env.DB.prepare(
            'UPDATE universities SET name = ?, slug = ?, logo_url = ?, sort_order = ? WHERE id = ?'
          )
            .bind(nextName, nextSlug, nextLogo, nextSort, existing.id)
            .run();
          await recalculateD1UniCount(existing.id);
          await purgeWorkerUniversitiesCache();

          const allUnis = await fetchNormalizedD1Universities();
          const updated = allUnis.find((u) => u.id === existing.id) || null;
          return jsonResponse({ success: true, university: updated }, 200, cors);
        }

        // DELETE /api/universities/:id
        if (req.method === 'DELETE') {
          const existing = await env.DB.prepare(
            'SELECT * FROM universities WHERE id = ? OR slug = ? LIMIT 1'
          )
            .bind(targetId, targetId)
            .first<D1UniversityRow>();
          if (!existing) {
            return jsonResponse({ success: false, error: 'University not found.' }, 404, cors);
          }
          await deleteOldWorkerUniversityLogo(existing.id, existing.logo_url);
          await env.DB.batch([
            env.DB.prepare('DELETE FROM mcqs WHERE university_id = ?').bind(existing.id),
            env.DB.prepare('DELETE FROM universities WHERE id = ?').bind(existing.id),
          ]);
          return jsonResponse({ success: true, deletedUniversityId: existing.id }, 200, cors);
        }

        return jsonResponse({ success: false, error: 'University endpoint not found.' }, 404, cors);
      }

      // ── /api/mcqs ─────────────────────────────────────────────────────────
      if (url.pathname.startsWith('/api/mcqs')) {
        const mcqSub = url.pathname.slice('/api/mcqs'.length).replace(/\/+$/, '') || '/';

        // GET /api/mcqs/topics (cached 5 min per university, invalidated on MCQ mutations)
        if (mcqSub === '/topics' && req.method === 'GET') {
          if (!checkPublicIpRateLimit(req, 'mcqs_topics', 120, 60_000)) {
            return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
          }
          const uniParam = (
            url.searchParams.get('university_id') ||
            url.searchParams.get('university_slug') ||
            ''
          ).trim();
          let resolvedUniId = uniParam;
          if (uniParam) {
            const matchedUni = await resolveCachedUniversity(uniParam);
            if (matchedUni) resolvedUniId = matchedUni.id;
          }

          const topicsCacheKey = `mcqs:topics:${resolvedUniId || 'all'}`;
          const cachedTopics = getWorkerCached<Record<string, any>>(topicsCacheKey);
          if (cachedTopics) {
            return jsonResponse(cachedTopics, 200, {
              ...cors,
              'Cache-Control': 'public, max-age=120, s-maxage=300',
            });
          }

          const { results } = resolvedUniId
            ? await env.DB.prepare(
                'SELECT subject, topic, COUNT(*) as cnt FROM mcqs WHERE university_id = ? GROUP BY subject, topic'
              )
                .bind(resolvedUniId)
                .all<{ subject: string; topic: string; cnt: number }>()
            : await env.DB.prepare(
                'SELECT subject, topic, COUNT(*) as cnt FROM mcqs GROUP BY subject, topic'
              ).all<{ subject: string; topic: string; cnt: number }>();

          const subjectsMap = new Map<
            string,
            { subject: string; count: number; topics: Array<{ topic: string; count: number }> }
          >();
          let totalMcqs = 0;
          for (const r of results || []) {
            const sub = String(r.subject || 'General');
            const top = String(r.topic || 'General');
            const cnt = Number(r.cnt || 0);
            totalMcqs += cnt;
            if (!subjectsMap.has(sub)) {
              subjectsMap.set(sub, { subject: sub, count: 0, topics: [] });
            }
            const entry = subjectsMap.get(sub)!;
            entry.count += cnt;
            entry.topics.push({ topic: top, count: cnt });
          }

          const subjects = Array.from(subjectsMap.values())
            .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject))
            .map((s) => ({
              subject: s.subject,
              count: s.count,
              total: s.count,
              topics: s.topics,
            }));
          const flat = subjects.flatMap((s) =>
            s.topics.map((t) => ({ subject: s.subject, topic: t.topic, count: t.count }))
          );
          const payload = setWorkerCached(
            topicsCacheKey,
            {
              ok: true,
              success: true,
              universityId: resolvedUniId || null,
              totalMcqs,
              subjects,
              flat,
            },
            5 * 60_000
          );
          return jsonResponse(payload, 200, {
            ...cors,
            'Cache-Control': 'public, max-age=120, s-maxage=300',
          });
        }

        // GET /api/mcqs/health (consolidated aggregate queries + 3-min cache)
        if (mcqSub === '/health' && req.method === 'GET') {
          if (!checkPublicIpRateLimit(req, 'mcqs_health', 60, 60_000)) {
            return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
          }
          const cachedHealth = getWorkerCached<Record<string, any>>('mcqs:health');
          if (cachedHealth) {
            return jsonResponse(cachedHealth, 200, {
              ...cors,
              'Cache-Control': 'public, max-age=60, s-maxage=180',
            });
          }

          // Consolidated: 1 grouped summary query + 1 scalar aggregate instead of 6 separate full scans of mcqs
          const [uniRes, summaryRes, groupedRes, repRes, lastImportRes] = await Promise.all([
            env.DB.prepare(
              'SELECT id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at FROM universities ORDER BY sort_order ASC, name ASC'
            ).all<D1UniversityRow>(),
            env.DB.prepare(
              `SELECT COUNT(*) AS cnt,
                      SUM(CASE WHEN TRIM(COALESCE(explanation, '')) = '' THEN 1 ELSE 0 END) AS missing_cnt,
                      MAX(created_at) AS last_at
               FROM mcqs`
            ).first<{ cnt: number; missing_cnt: number; last_at: string | null }>(),
            env.DB.prepare(
              'SELECT university_id, subject, difficulty, COUNT(*) AS cnt FROM mcqs GROUP BY university_id, subject, difficulty'
            ).all<{ university_id: string; subject: string; difficulty: string; cnt: number }>(),
            env.DB.prepare("SELECT COUNT(*) as cnt FROM mcq_reports WHERE status = 'open'").first<{ cnt: number }>(),
            env.DB.prepare('SELECT MAX(created_at) as last_at FROM imports').first<{ last_at: string | null }>().catch(() => null),
          ]);

          const liveCountByUni = new Map<string, number>();
          const bySubject: Record<string, number> = {};
          const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
          let subjectSum = 0;

          for (const row of groupedRes.results || []) {
            const cnt = Number(row.cnt || 0);
            const uid = String(row.university_id || '').trim();
            if (uid) {
              liveCountByUni.set(uid, (liveCountByUni.get(uid) || 0) + cnt);
            }
            const subjKey = String(row.subject ?? '').trim() || 'General';
            bySubject[subjKey] = (bySubject[subjKey] || 0) + cnt;
            subjectSum += cnt;
            const diffKey = String(row.difficulty || 'medium').toLowerCase();
            byDifficulty[diffKey] = (byDifficulty[diffKey] || 0) + cnt;
          }

          const universities = (uniRes.results || []).map((u) => {
            const liveCount = liveCountByUni.has(u.id)
              ? liveCountByUni.get(u.id)!
              : Number(u.mcq_count || 0);
            return {
              ...u,
              mcq_count: liveCount,
              is_live: liveCount > 0 ? 1 : 0,
            };
          });
          const uniSum = universities.reduce((acc, u) => acc + Number(u.mcq_count || 0), 0);
          const directTotal = Number(summaryRes?.cnt || 0);
          const totalMcqs = Math.max(directTotal, subjectSum, uniSum);

          const missingCount = Number(summaryRes?.missing_cnt || 0);
          const openRepCount = Number(repRes?.cnt || 0);

          const candidateTimestamps = [lastImportRes?.last_at, summaryRes?.last_at]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map((v) => v.trim());
          let lastImportAt: string | null = null;
          let latestMs = -Infinity;
          for (const ts of candidateTimestamps) {
            const parsedMs = Date.parse(ts.includes('T') ? ts : ts.replace(' ', 'T') + (ts.endsWith('Z') ? '' : 'Z'));
            if (!Number.isNaN(parsedMs)) {
              if (parsedMs > latestMs) {
                latestMs = parsedMs;
                lastImportAt = ts;
              }
            } else if (!lastImportAt) {
              lastImportAt = ts;
            }
          }

          const payload = setWorkerCached(
            'mcqs:health',
            {
              ok: true,
              success: true,
              source: 'cloudflare-d1',
              databaseName: 'boardly-posts-db',
              totalUniversities: universities.length,
              liveUniversities: universities.filter((u) => Number(u.mcq_count) > 0).length,
              comingSoonUniversities: universities.filter((u) => Number(u.mcq_count) === 0).length,
              totalMcqs,
              missingExplanations: missingCount,
              missingExplanationCount: missingCount,
              openReports: openRepCount,
              openReportsCount: openRepCount,
              lastImportAt,
              bySubject,
              byDifficulty,
              byUniversity: universities,
              universities,
            },
            3 * 60_000
          );

          return jsonResponse(payload, 200, {
            ...cors,
            'Cache-Control': 'public, max-age=60, s-maxage=180',
          });
        }

        // GET & POST & PATCH /api/mcqs/reports
        if (mcqSub === '/reports' && req.method === 'GET') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const { results } = await env.DB.prepare(
            'SELECT * FROM mcq_reports ORDER BY created_at DESC LIMIT 200'
          ).all<D1McqReportRow>();
          const reports = (results || []).map((r) => ({
            ...r,
            question: r.question_preview || '',
            details: r.comment || '',
          }));
          return jsonResponse({ ok: true, success: true, reports }, 200, cors);
        }

        if (mcqSub === '/reports' && req.method === 'POST') {
          const user = await verifyFirebaseIdToken(req, env).catch(() => null);
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const mcqId = String(body.mcq_id || body.questionId || '').trim();
          if (!mcqId) {
            return jsonResponse({ success: false, error: 'mcq_id is required.' }, 400, cors);
          }
          const mcq = await env.DB.prepare('SELECT * FROM mcqs WHERE id = ? LIMIT 1')
            .bind(mcqId)
            .first<D1McqRow>();
          const reportId = `mcqrep_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
          const nowIso = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO mcq_reports (id, mcq_id, university_id, subject, topic, question_preview, reason, comment, user_id, user_email, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`
          )
            .bind(
              reportId,
              mcqId,
              mcq?.university_id || String(body.university_id || ''),
              mcq?.subject || String(body.subject || ''),
              mcq?.topic || String(body.topic || ''),
              (mcq?.question || String(body.question_preview || '')).slice(0, 180),
              String(body.reason || 'wrong_key'),
              String(body.comment || body.details || ''),
              user?.uid || String(body.user_id || body.userId || 'student'),
              user?.email || String(body.user_email || body.userEmail || ''),
              nowIso
            )
            .run();

          return jsonResponse({ ok: true, success: true, reportId }, 201, cors);
        }

        if (mcqSub.startsWith('/reports/') && req.method === 'PATCH') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const repId = decodeURIComponent(mcqSub.slice('/reports/'.length));
          const body = (await req.json().catch(() => ({}))) as { status?: string };
          const nextStatus = String(body.status || 'resolved').toLowerCase();
          await env.DB.prepare('UPDATE mcq_reports SET status = ? WHERE id = ?')
            .bind(nextStatus, repId)
            .run();
          return jsonResponse({ ok: true, success: true }, 200, cors);
        }

        // POST /api/mcqs/verify
        if (mcqSub === '/verify' && req.method === 'POST') {
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const answers = Array.isArray(body.answers)
            ? body.answers
            : Array.isArray(body.questionIds)
            ? body.questionIds.map((qId: any) => ({ questionId: String(qId) }))
            : [];
          const qIds = answers
            .map((a: any) => String(a?.questionId || a?.id || '').trim())
            .filter(Boolean);
          const results: Record<string, any> = {};
          if (qIds.length > 0) {
            const placeholders = qIds.map(() => '?').join(',');
            const { results: rows } = await env.DB.prepare(
              `SELECT * FROM mcqs WHERE id IN (${placeholders})`
            )
              .bind(...qIds)
              .all<D1McqRow>();
            const rowMap = new Map<string, D1McqRow>();
            for (const r of rows || []) rowMap.set(r.id, r);
            const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

            for (const item of answers) {
              const qId = String(item?.questionId || item?.id || '').trim();
              const row = rowMap.get(qId);
              if (!row) continue;
              const canonicalIdx = letterToIdx[String(row.correct_answer || 'A').toUpperCase()] ?? 0;
              const canonicalOpts = [row.option_a, row.option_b, row.option_c, row.option_d];
              const canonicalText = canonicalOpts[canonicalIdx] || row.option_a;
              let resolvedIdx = canonicalIdx;
              if (Array.isArray(item.displayedOptions) && item.displayedOptions.length > 0) {
                const mIdx = item.displayedOptions.findIndex(
                  (o: any) => String(o ?? '').trim() === String(canonicalText).trim()
                );
                if (mIdx !== -1) resolvedIdx = mIdx;
              }
              const selected =
                item.selectedAnswer === null || item.selectedAnswer === undefined
                  ? null
                  : Number(item.selectedAnswer);
              const isCorrect =
                selected !== null && Number.isFinite(selected) && selected === resolvedIdx;
              results[qId] = {
                questionId: qId,
                selectedAnswer: selected,
                correctIndex: resolvedIdx,
                correct_answer: resolvedIdx,
                correctAnswer: row.correct_answer || 'A',
                correct_letter: row.correct_answer,
                canonical_correct_answer: canonicalIdx,
                isCorrect,
                explanation: row.explanation || '',
              };
            }
          }
          return jsonResponse({ ok: true, success: true, verified: true, results }, 200, cors);
        }

        // POST /api/mcqs/import-chunk — Unlimited chunked bulk import via D1 batch
        if (mcqSub === '/import-chunk' && req.method === 'POST') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse(
              { success: false, error: 'Forbidden: Only admin and superadmin can import MCQs.' },
              403,
              cors
            );
          }

          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const uniIdOrSlug = String(body.university_id || body.universityId || '').trim();
          const defaultSubject = String(body.default_subject || body.subject || '').trim();
          const defaultTopic = String(body.default_topic || body.topic || '').trim();
          const chunkOffset = Math.max(0, Number(body.chunk_offset ?? body.chunkOffset ?? 0));
          const rawRows = Array.isArray(body.rows) ? body.rows : [];

          const uni = await env.DB.prepare(
            'SELECT * FROM universities WHERE id = ? OR LOWER(slug) = LOWER(?) LIMIT 1'
          )
            .bind(uniIdOrSlug, uniIdOrSlug)
            .first<D1UniversityRow>();

          if (!uni) {
            return jsonResponse({ success: false, error: 'Target university not found.' }, 404, cors);
          }

          const rowErrors: Array<{ rowNumber: number; reason: string; row: number; message: string }> = [];
          const stmts: D1PreparedStatement[] = [];
          const nowIso = new Date().toISOString();

          for (let i = 0; i < rawRows.length; i++) {
            const rowNum = chunkOffset + i + 1;
            const r = rawRows[i] || {};
            const subject = String(r.subject || defaultSubject || '').trim();
            const topic = String(r.topic || r.chapter || defaultTopic || 'General').trim() || 'General';
            const question = String(r.question || r.question_text || r.q || r.stem || '').trim();

            let optA = String(r.option_a ?? r.optionA ?? r.a ?? '').trim();
            let optB = String(r.option_b ?? r.optionB ?? r.b ?? '').trim();
            let optC = String(r.option_c ?? r.optionC ?? r.c ?? '').trim();
            let optD = String(r.option_d ?? r.optionD ?? r.d ?? '').trim();

            if ((!optA || !optB) && Array.isArray(r.options) && r.options.length >= 4) {
              optA = String(r.options[0] ?? '').trim();
              optB = String(r.options[1] ?? '').trim();
              optC = String(r.options[2] ?? '').trim();
              optD = String(r.options[3] ?? '').trim();
            }

            if (!subject) {
              rowErrors.push({ rowNumber: rowNum, reason: 'Missing subject', row: rowNum, message: 'Missing subject' });
              continue;
            }
            if (!question) {
              rowErrors.push({ rowNumber: rowNum, reason: 'Missing question text', row: rowNum, message: 'Missing question text' });
              continue;
            }
            if (!optA || !optB || !optC || !optD) {
              rowErrors.push({
                rowNumber: rowNum,
                reason: 'All 4 options (A, B, C, D) are required',
                row: rowNum,
                message: 'All 4 options (A, B, C, D) are required',
              });
              continue;
            }

            const correctLetter = normalizeCorrectLetter(
              r.correct_answer ?? r.correctAnswer ?? r.correct ?? r.answer,
              { a: optA, b: optB, c: optC, d: optD }
            );
            if (!correctLetter) {
              const msg = `Invalid correct_answer "${String(r.correct_answer ?? r.correct ?? '')}"`;
              rowErrors.push({
                rowNumber: rowNum,
                reason: msg,
                row: rowNum,
                message: msg,
              });
              continue;
            }

            const rawDiff = String(r.difficulty || 'medium').trim().toLowerCase();
            const difficulty = rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';
            const explanation = String(r.explanation ?? r.explain ?? '').trim();
            const id = String(r.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim();

            stmts.push(
              env.DB.prepare(
                `INSERT OR REPLACE INTO mcqs (
                  id, university_id, subject, topic, question,
                  option_a, option_b, option_c, option_d,
                  correct_answer, explanation, difficulty, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                id,
                uni.id,
                subject,
                topic,
                question,
                optA,
                optB,
                optC,
                optD,
                correctLetter,
                explanation,
                difficulty,
                nowIso
              )
            );
          }

          // Execute in sub-batches of 50 to respect D1 batch limits per call
          const batchSize = 50;
          for (let i = 0; i < stmts.length; i += batchSize) {
            await env.DB.batch(stmts.slice(i, i + batchSize));
          }

          await recalculateD1UniCount(uni.id);
          const updatedUni = await env.DB.prepare('SELECT mcq_count, is_live FROM universities WHERE id = ?')
            .bind(uni.id)
            .first<{ mcq_count: number; is_live: number }>();

          return jsonResponse(
            {
              ok: true,
              success: true,
              universityId: uni.id,
              imported: stmts.length,
              importedCount: stmts.length,
              failed: rowErrors.length,
              skippedCount: rowErrors.length,
              errors: rowErrors.map((e) => ({ row: e.row, message: e.message })),
              rowErrors,
              universityMcqCount: Number(updatedUni?.mcq_count || 0),
              universityIsLive: Boolean(updatedUni?.is_live),
            },
            200,
            cors
          );
        }

        // POST /api/mcqs/bulk-delete
        if (mcqSub === '/bulk-delete' && req.method === 'POST') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          if (Array.isArray(body.ids) && body.ids.length > 0) {
            const ids = body.ids.map((x: any) => String(x).trim()).filter(Boolean);
            const batchSize = 50;
            for (let i = 0; i < ids.length; i += batchSize) {
              const slice = ids.slice(i, i + batchSize);
              const placeholders = slice.map(() => '?').join(',');
              await env.DB.prepare(`DELETE FROM mcqs WHERE id IN (${placeholders})`)
                .bind(...slice)
                .run();
            }
          } else if (body.university_id) {
            const clauses = ['university_id = ?'];
            const binds: any[] = [String(body.university_id)];
            if (body.subject && body.subject !== 'all') {
              clauses.push('LOWER(subject) = LOWER(?)');
              binds.push(String(body.subject));
            }
            if (body.topic && body.topic !== 'all') {
              clauses.push('LOWER(topic) = LOWER(?)');
              binds.push(String(body.topic));
            }
            await env.DB.prepare(`DELETE FROM mcqs WHERE ${clauses.join(' AND ')}`)
              .bind(...binds)
              .run();
          }
          await recalculateAllD1UniCounts();
          return jsonResponse({ success: true }, 200, cors);
        }

        // GET /api/mcqs (index-friendly COLLATE NOCASE + random range sampling + cached counts + rate limit)
        if (mcqSub === '/' && req.method === 'GET') {
          const hasAuth = Boolean(req.headers.get('Authorization'));
          const adminUser = hasAuth ? await verifyD1Admin().catch(() => null) : null;
          const isAdmin = Boolean(adminUser);
          if (!isAdmin && !checkPublicIpRateLimit(req, 'mcqs_list', 120, 60_000)) {
            return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
          }

          const includeAnswers =
            isAdmin ||
            url.searchParams.get('practice') === '1' ||
            url.searchParams.get('include_answers') === '1';

          const uniParam = (
            url.searchParams.get('university_id') ||
            url.searchParams.get('university_slug') ||
            url.searchParams.get('university') ||
            ''
          ).trim();
          const subjectParam = (url.searchParams.get('subject') || '').trim();
          const topicParam = (url.searchParams.get('topic') || '').trim();
          const difficultyParam = (url.searchParams.get('difficulty') || '').trim().toLowerCase();
          const searchParam = (
            url.searchParams.get('search') ||
            url.searchParams.get('q') ||
            ''
          ).trim();
          const isRandom =
            url.searchParams.get('random') === '1' || url.searchParams.get('random') === 'true';
          const limit = Math.min(
            200,
            Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50)
          );
          const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

          // Serve deterministic, non-admin paginated reads from 2-min in-memory cache
          const canCacheMcqResponse = !isAdmin && !isRandom && !searchParam;
          const listCacheKey = `mcqs:list:${includeAnswers ? '1' : '0'}:${uniParam.toLowerCase()}:${subjectParam.toLowerCase()}:${topicParam.toLowerCase()}:${difficultyParam}:${limit}:${offset}`;
          if (canCacheMcqResponse) {
            const cachedList = getWorkerCached<Record<string, any>>(listCacheKey);
            if (cachedList) {
              return jsonResponse(cachedList, 200, {
                ...cors,
                'Cache-Control': 'public, max-age=60, s-maxage=120',
              });
            }
          }

          const clauses: string[] = [];
          const binds: any[] = [];
          let matchedUniInfo: { id: string; mcq_count: number } | null = null;

          if (uniParam && uniParam !== 'all') {
            matchedUniInfo = await resolveCachedUniversity(uniParam);
            clauses.push('university_id = ?');
            binds.push(matchedUniInfo ? matchedUniInfo.id : uniParam);
          }
          if (subjectParam && subjectParam !== 'all') {
            clauses.push('subject = ? COLLATE NOCASE');
            binds.push(subjectParam);
          }
          if (topicParam && topicParam !== 'all') {
            clauses.push('topic = ? COLLATE NOCASE');
            binds.push(topicParam);
          }
          if (difficultyParam && difficultyParam !== 'all') {
            clauses.push('difficulty = ? COLLATE NOCASE');
            binds.push(difficultyParam);
          }
          if (searchParam) {
            clauses.push(
              '(question LIKE ? OR option_a LIKE ? OR option_b LIKE ? OR option_c LIKE ? OR option_d LIKE ? OR topic LIKE ?)'
            );
            const like = `%${searchParam}%`;
            binds.push(like, like, like, like, like, like);
          }

          const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
          const isUniOnlyFilter =
            Boolean(matchedUniInfo) &&
            (!subjectParam || subjectParam === 'all') &&
            (!topicParam || topicParam === 'all') &&
            (!difficultyParam || difficultyParam === 'all') &&
            !searchParam;

          // Avoid recounting the filtered set on every page load: reuse maintained university mcq_count or 3-min cache
          let total: number;
          if (isUniOnlyFilter && matchedUniInfo) {
            total = matchedUniInfo.mcq_count;
          } else {
            const countKey = `mcqs:count:${whereSql}:${binds.join('|')}`;
            const cachedCount = getWorkerCached<number>(countKey);
            if (cachedCount !== null) {
              total = cachedCount;
            } else {
              const countRow = await env.DB.prepare(
                `SELECT COUNT(*) as cnt FROM mcqs ${whereSql}`
              )
                .bind(...binds)
                .first<{ cnt: number }>();
              total = setWorkerCached(countKey, Number(countRow?.cnt || 0), 3 * 60_000);
            }
          }

          const selectCols = includeAnswers ? MCQ_FULL_COLS : MCQ_PUBLIC_COLS;
          let results: D1McqRow[] = [];

          if (total > 0) {
            if (isRandom) {
              // Index-friendly random sampling: pick random indexed slice(s) within [0, total) and shuffle in JS
              // Replaces full-table-scanning ORDER BY RANDOM()
              if (total <= limit) {
                const res = await env.DB.prepare(
                  `SELECT ${selectCols} FROM mcqs ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ?`
                )
                  .bind(...binds, limit)
                  .all<D1McqRow>();
                results = shuffleInPlace([...(res.results || [])]);
              } else if (limit >= 10 && total >= limit * 2) {
                // Split into 2 non-overlapping random indexed slices across the range for better variety
                const half1 = Math.ceil(limit / 2);
                const half2 = limit - half1;
                const mid = Math.floor(total / 2);
                const off1 = Math.floor(Math.random() * Math.max(1, mid - half1 + 1));
                const off2 = mid + Math.floor(Math.random() * Math.max(1, total - mid - half2 + 1));
                const [r1, r2] = await env.DB.batch([
                  env.DB.prepare(
                    `SELECT ${selectCols} FROM mcqs ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
                  ).bind(...binds, half1, off1),
                  env.DB.prepare(
                    `SELECT ${selectCols} FROM mcqs ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
                  ).bind(...binds, half2, off2),
                ]);
                const seenIds = new Set<string>();
                const combined: D1McqRow[] = [];
                for (const row of [...((r1?.results || []) as D1McqRow[]), ...((r2?.results || []) as D1McqRow[])]) {
                  if (!seenIds.has(row.id)) {
                    seenIds.add(row.id);
                    combined.push(row);
                  }
                }
                results = shuffleInPlace(combined);
              } else {
                const maxStart = Math.max(0, total - limit);
                const randOffset = Math.floor(Math.random() * (maxStart + 1));
                const res = await env.DB.prepare(
                  `SELECT ${selectCols} FROM mcqs ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
                )
                  .bind(...binds, limit, randOffset)
                  .all<D1McqRow>();
                results = shuffleInPlace([...(res.results || [])]);
              }
            } else {
              const res = await env.DB.prepare(
                `SELECT ${selectCols} FROM mcqs ${whereSql} ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
              )
                .bind(...binds, limit, offset)
                .all<D1McqRow>();
              results = res.results || [];
            }
          }

          const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
          const repairWorkerMcqOpts = (opts: [string, string, string, string]): [string, string, string, string] => {
            const leftRe = /^(.*?)\\?\$?\s*([+-]?\d[\d,]*)\{\s*$/;
            const rightRe = /^\s*\}(\d[\d,.\s]*?)\$?(.*)$/;
            const cleanOne = (raw: string) => {
              let s = String(raw || '').trim().replace(/(\d)\s*\\?\{\s*,\s*\\?\}\s*(?=\d)/g, '$1,');
              s = s.replace(/\\?\$\s*([+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?)\s*\$/g, '$1');
              const pure = s.match(/^\\?\$\s*([+-]?\d[\d,]*(?:\.\d+)?(?:\s*%)?)\s*\\?\$$/);
              if (pure) return pure[1].trim();
              const lo = s.match(leftRe);
              if (lo && !s.includes('}')) return `${lo[1].replace(/\\?\$$/, '').trim()} ${lo[2].trim()}`.trim();
              const ro = s.match(rightRe);
              if (ro && !s.includes('{')) return `${ro[1].trim()} ${ro[2].replace(/^\\?\$/, '').trim()}`.trim();
              return s;
            };
            const out: [string, string, string, string] = [...opts];
            for (let i = 0; i < 3; i++) {
              const lm = out[i].match(leftRe);
              const rm = out[i + 1].match(rightRe);
              if (lm && rm) {
                const combined = `${lm[1].replace(/\\?\$$/, '').trim()} ${lm[2].trim()},${rm[1].trim()}`.trim();
                out[i] = combined;
                const baseNum = parseFloat(combined.replace(/[^0-9.-]/g, '')) || 1170;
                const altNum = Math.round(baseNum + 100);
                out[i + 1] = String(altNum).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
            return [cleanOne(out[0]), cleanOne(out[1]), cleanOne(out[2]), cleanOne(out[3])];
          };
          const mcqs = (results || []).map((m) => {
            const [optA, optB, optC, optD] = repairWorkerMcqOpts([
              m.option_a,
              m.option_b,
              m.option_c,
              m.option_d,
            ]);
            const base: Record<string, any> = {
              id: m.id,
              university_id: m.university_id,
              subject: m.subject,
              topic: m.topic,
              question: String(m.question || '').replace(/(\d)\s*\\?\{\s*,\s*\\?\}\s*(?=\d)/g, '$1,'),
              option_a: optA,
              option_b: optB,
              option_c: optC,
              option_d: optD,
              options: [optA, optB, optC, optD],
              difficulty: m.difficulty,
              created_at: m.created_at,
            };
            if (includeAnswers) {
              base.correct_answer = m.correct_answer;
              base.correct_index = letterToIdx[m.correct_answer] ?? 0;
              base.explanation = m.explanation;
            }
            return base;
          });

          const responsePayload = {
            success: true,
            mcqs,
            total,
            limit,
            offset,
            hasMore: offset + mcqs.length < total,
          };
          if (canCacheMcqResponse) {
            setWorkerCached(listCacheKey, responsePayload, 2 * 60_000);
          }

          return jsonResponse(
            responsePayload,
            200,
            canCacheMcqResponse
              ? { ...cors, 'Cache-Control': 'public, max-age=60, s-maxage=120' }
              : cors
          );
        }

        // POST /api/mcqs — Add single MCQ
        if (mcqSub === '/' && req.method === 'POST') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const uniParam = String(body.university_id || body.universityId || '').trim();
          const uni = await env.DB.prepare(
            'SELECT id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at FROM universities WHERE id = ? OR slug = ? COLLATE NOCASE LIMIT 1'
          )
            .bind(uniParam, uniParam)
            .first<D1UniversityRow>();
          if (!uni) {
            return jsonResponse({ success: false, error: 'Valid university_id is required.' }, 400, cors);
          }

          const subject = String(body.subject || '').trim();
          const topic = String(body.topic || 'General').trim() || 'General';
          const question = String(body.question || '').trim();
          const optA = String(body.option_a ?? body.options?.[0] ?? '').trim();
          const optB = String(body.option_b ?? body.options?.[1] ?? '').trim();
          const optC = String(body.option_c ?? body.options?.[2] ?? '').trim();
          const optD = String(body.option_d ?? body.options?.[3] ?? '').trim();

          if (!subject || !question || !optA || !optB || !optC || !optD) {
            return jsonResponse(
              { success: false, error: 'Subject, question, and all 4 options are required.' },
              400,
              cors
            );
          }

          const correctLetter = normalizeCorrectLetter(body.correct_answer ?? body.correctAnswer, {
            a: optA,
            b: optB,
            c: optC,
            d: optD,
          });
          if (!correctLetter) {
            return jsonResponse({ success: false, error: 'correct_answer must be A, B, C, or D.' }, 400, cors);
          }

          const rawDiff = String(body.difficulty || 'medium').trim().toLowerCase();
          const difficulty = rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';
          const explanation = String(body.explanation || '').trim();
          const id = String(body.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim();
          const nowIso = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO mcqs (id, university_id, subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, uni.id, subject, topic, question, optA, optB, optC, optD, correctLetter, explanation, difficulty, nowIso)
            .run();

          await recalculateD1UniCount(uni.id);
          const created = await env.DB.prepare(`SELECT ${MCQ_FULL_COLS} FROM mcqs WHERE id = ?`).bind(id).first<D1McqRow>();
          return jsonResponse({ success: true, mcq: created }, 201, cors);
        }

        // GET /api/mcqs/export (Admin-only + paginated to prevent crawler full-table D1 dumps)
        if (mcqSub === '/export' && req.method === 'GET') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse(
              { success: false, error: 'Forbidden: Only admin and superadmin can export MCQs.' },
              403,
              cors
            );
          }
          const format = (url.searchParams.get('format') || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
          const uniFilter = (url.searchParams.get('university_id') || '').trim();
          const exportLimit = Math.min(
            2000,
            Math.max(1, parseInt(url.searchParams.get('limit') || '1000', 10) || 1000)
          );
          const exportOffset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
          const exportCols = `id, university_id, university_slug, import_batch_id, subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, created_at`;
          const [uniRes, mcqRes] = await Promise.all([
            env.DB.prepare(
              'SELECT id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at FROM universities ORDER BY sort_order ASC, name ASC'
            ).all<D1UniversityRow>(),
            uniFilter && uniFilter !== 'all'
              ? env.DB.prepare(
                  `SELECT ${exportCols} FROM mcqs WHERE university_id = ? ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
                )
                  .bind(uniFilter, exportLimit, exportOffset)
                  .all<D1McqRow>()
              : env.DB.prepare(
                  `SELECT ${exportCols} FROM mcqs ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?`
                )
                  .bind(exportLimit, exportOffset)
                  .all<D1McqRow>(),
          ]);
          const universities = uniRes.results || [];
          const uniMap = new Map(universities.map((u) => [u.id, u.slug]));
          const rows = (mcqRes.results || []).map((m) => ({
            ...m,
            university_slug: m.university_slug || uniMap.get(m.university_id) || '',
            import_batch_id: m.import_batch_id || '',
          }));
          if (format === 'csv') {
            const headers = [
              'id',
              'university_id',
              'university_slug',
              'import_batch_id',
              'subject',
              'topic',
              'question',
              'option_a',
              'option_b',
              'option_c',
              'option_d',
              'correct_answer',
              'explanation',
              'difficulty',
              'created_at',
            ];
            const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
            const csv = [
              headers.join(','),
              ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(',')),
            ].join('\n');
            return new Response(csv, {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="boardly_university_mcqs_backup.csv"',
              },
            });
          }
          return new Response(
            JSON.stringify(
              {
                exported_at: new Date().toISOString(),
                total_universities: universities.length,
                total_mcqs: rows.length,
                limit: exportLimit,
                offset: exportOffset,
                has_more: rows.length === exportLimit,
                universities,
                mcqs: rows,
              },
              null,
              2
            ),
            {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': 'attachment; filename="boardly_university_mcqs_backup.json"',
              },
            }
          );
        }

        // POST /api/mcqs/move
        if ((mcqSub === '/move' || mcqSub === '/repair-move') && req.method === 'POST') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          const toUniId = String(body.to_university_id || body.toUniversityId || body.university_id || '').trim();
          const ids: string[] = Array.isArray(body.mcq_ids || body.ids)
            ? (body.mcq_ids || body.ids).map((x: unknown) => String(x || '').trim()).filter(Boolean)
            : [];
          if (!toUniId || ids.length === 0) {
            return jsonResponse({ success: false, error: 'to_university_id and mcq_ids are required.' }, 400, cors);
          }
          const targetUni = await env.DB.prepare('SELECT * FROM universities WHERE id = ? OR slug = ? LIMIT 1')
            .bind(toUniId, toUniId)
            .first<D1UniversityRow>();
          if (!targetUni) {
            return jsonResponse({ success: false, error: 'Target university not found.' }, 404, cors);
          }
          const batchSize = 50;
          for (let i = 0; i < ids.length; i += batchSize) {
            const slice = ids.slice(i, i + batchSize);
            const placeholders = slice.map(() => '?').join(',');
            await env.DB.prepare(
              `UPDATE mcqs SET university_id = ? WHERE id IN (${placeholders})`
            )
              .bind(targetUni.id, ...slice)
              .run();
          }
          await recalculateAllD1UniCounts();
          return jsonResponse(
            {
              success: true,
              movedCount: ids.length,
              toUniversityId: targetUni.id,
              toUniversitySlug: targetUni.slug,
              toUniversityName: targetUni.name,
            },
            200,
            cors
          );
        }

        // POST /api/mcqs/health/fix
        if (mcqSub === '/health/fix' && req.method === 'POST') {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          await recalculateAllD1UniCounts();
          return jsonResponse({ success: true, fixedCount: 1 }, 200, cors);
        }

        // PUT / PATCH / DELETE /api/mcqs/:id
        const mcqId = decodeURIComponent(mcqSub.slice(1));
        if (mcqId) {
          const adminUser = await verifyD1Admin();
          if (!adminUser) {
            return jsonResponse({ success: false, error: 'Forbidden' }, 403, cors);
          }
          const existing = await env.DB.prepare('SELECT * FROM mcqs WHERE id = ? LIMIT 1')
            .bind(mcqId)
            .first<D1McqRow>();
          if (!existing) {
            return jsonResponse({ success: false, error: 'MCQ not found.' }, 404, cors);
          }

          if (req.method === 'PUT' || req.method === 'PATCH') {
            const body = (await req.json().catch(() => ({}))) as Record<string, any>;
            const nextUniId =
              body.university_id !== undefined ? String(body.university_id) : existing.university_id;
            const nextSub = body.subject !== undefined ? String(body.subject).trim() : existing.subject;
            const nextTop = body.topic !== undefined ? String(body.topic).trim() : existing.topic;
            const nextQ = body.question !== undefined ? String(body.question).trim() : existing.question;
            const nextA = body.option_a !== undefined ? String(body.option_a).trim() : existing.option_a;
            const nextB = body.option_b !== undefined ? String(body.option_b).trim() : existing.option_b;
            const nextC = body.option_c !== undefined ? String(body.option_c).trim() : existing.option_c;
            const nextD = body.option_d !== undefined ? String(body.option_d).trim() : existing.option_d;
            const nextExp =
              body.explanation !== undefined ? String(body.explanation).trim() : existing.explanation;
            const nextDiff =
              body.difficulty !== undefined ? String(body.difficulty).toLowerCase() : existing.difficulty;
            const nextCorr =
              body.correct_answer !== undefined
                ? normalizeCorrectLetter(body.correct_answer, {
                    a: nextA,
                    b: nextB,
                    c: nextC,
                    d: nextD,
                  }) || existing.correct_answer
                : existing.correct_answer;

            await env.DB.prepare(
              `UPDATE mcqs
               SET university_id = ?, subject = ?, topic = ?, question = ?,
                   option_a = ?, option_b = ?, option_c = ?, option_d = ?,
                   correct_answer = ?, explanation = ?, difficulty = ?
               WHERE id = ?`
            )
              .bind(
                nextUniId,
                nextSub,
                nextTop,
                nextQ,
                nextA,
                nextB,
                nextC,
                nextD,
                nextCorr,
                nextExp,
                nextDiff,
                existing.id
              )
              .run();

            await recalculateD1UniCount(existing.university_id);
            if (nextUniId !== existing.university_id) {
              await recalculateD1UniCount(nextUniId);
            }
            const updated = await env.DB.prepare('SELECT * FROM mcqs WHERE id = ?')
              .bind(existing.id)
              .first<D1McqRow>();
            return jsonResponse({ success: true, mcq: updated }, 200, cors);
          }

          if (req.method === 'DELETE') {
            await env.DB.prepare('DELETE FROM mcqs WHERE id = ?').bind(existing.id).run();
            await recalculateD1UniCount(existing.university_id);
            return jsonResponse({ success: true, deletedId: existing.id }, 200, cors);
          }
        }

        return jsonResponse({ success: false, error: 'MCQ endpoint not found.' }, 404, cors);
      }
    }

    // 2d. Shared Admin Student Search Route (/api/admin/users/search & /api/admin/kobans/users/search)
    const cleanAdminPath = url.pathname.replace(/\/+$/, '');
    if (
      cleanAdminPath === '/api/admin/users/search' ||
      cleanAdminPath === '/api/admin/kobans/users/search' ||
      cleanAdminPath === '/api/admin/kobans/search'
    ) {
      if (req.method !== 'GET') {
        return jsonResponse(
          { success: false, error: 'Method Not Allowed', users: [] },
          405,
          cors
        );
      }

      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) {
        return jsonResponse(
          {
            success: false,
            code: 'UNAUTHORIZED',
            error: 'Authentication token required (401).',
            users: [],
          },
          401,
          cors
        );
      }

      const adminUser = await verifyFirebaseIdToken(req, env).catch(() => null);
      if (!adminUser) {
        return jsonResponse(
          {
            success: false,
            code: 'INVALID_TOKEN',
            error: 'Invalid or expired session token (401).',
            users: [],
          },
          401,
          cors
        );
      }

      const projectId = env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;
      const defaultFsDbId = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

      const unwrapFsField = (val: any): any => {
        if (!val || typeof val !== 'object') return undefined;
        if ('stringValue' in val) return String(val.stringValue);
        if ('timestampValue' in val) return String(val.timestampValue);
        if ('integerValue' in val) return Number(val.integerValue);
        if ('doubleValue' in val) return Number(val.doubleValue);
        if ('booleanValue' in val) return Boolean(val.booleanValue);
        if ('nullValue' in val) return null;
        return undefined;
      };

      const parseFsDoc = (docObj: any): { id: string; data: Record<string, any> } | null => {
        if (!docObj || typeof docObj.name !== 'string') return null;
        const id = docObj.name.split('/').pop() || '';
        if (!id) return null;
        const fields = docObj.fields || {};
        const data: Record<string, any> = {};
        for (const [k, v] of Object.entries(fields)) {
          data[k] = unwrapFsField(v);
        }
        return { id, data };
      };

      const fetchFsCollectionRest = async (
        collectionName: string,
        pageSize = 500
      ): Promise<Array<{ id: string; data: Record<string, any> }>> => {
        for (const dbId of [defaultFsDbId, '(default)']) {
          try {
            const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
              dbId
            )}/documents/${encodeURIComponent(collectionName)}?pageSize=${pageSize}`;
            const resp = await fetch(fsUrl, {
              method: 'GET',
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            });
            if (resp.ok) {
              const json = (await resp.json().catch(() => ({}))) as { documents?: any[] };
              const docs = Array.isArray(json.documents) ? json.documents : [];
              const parsed = docs
                .map(parseFsDoc)
                .filter((d): d is { id: string; data: Record<string, any> } => Boolean(d));
              if (parsed.length > 0 || dbId === defaultFsDbId) {
                return parsed;
              }
            }
          } catch {
            // Try fallback database id
          }
        }
        return [];
      };

      // Shared server-side requireAdmin check
      const adminCheck = await requireAdmin({ request: req, env: env as any });
      if (!adminCheck.ok || !adminCheck.caller) {
        const reason = adminCheck.reason || 'role_not_found';
        return jsonResponse(
          {
            success: false,
            code: 'FORBIDDEN',
            reason,
            error: `Forbidden: Admin or Superadmin role required (reason: ${reason}).`,
            users: [],
          },
          403,
          cors
        );
      }

      const rawQ = String(
        url.searchParams.get('q') ?? url.searchParams.get('search') ?? ''
      ).trim();
      const qNorm = rawQ.toLowerCase().replace(/\s+/g, ' ');
      const qNoSpaces = rawQ.toLowerCase().replace(/\s+/g, '');
      const qHandle = qNoSpaces.replace(/^@+/, '');
      const qShortId = qNoSpaces.replace(/^#/, '');
      const limitCount = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get('limit') || 10))
      );
      const offsetCount = Math.max(0, Number(url.searchParams.get('offset') || 0));

      if (qNoSpaces.length < 2) {
        return jsonResponse(
          {
            success: true,
            users: [],
            total: 0,
            hasMore: false,
          },
          200,
          cors
        );
      }

      interface WorkerStudentMatch {
        id: string;
        uid: string;
        name: string;
        displayName: string;
        handle: string;
        email: string;
        avatar: string | null;
        shortId: string;
        plan: 'free' | 'pro';
        role: string;
        status: 'active' | 'suspended' | 'inactive' | 'orphan' | 'missing-name';
        kobans: number;
        hasWallet: boolean;
      }

      const byKey = new Map<string, WorkerStudentMatch>();
      const uidByEmail = new Map<string, string>();

      const upsertCandidate = (cand: WorkerStudentMatch) => {
        const uid = String(cand.uid || cand.id || '').trim();
        if (!uid || uid.startsWith('bot_') || cand.role === 'bot') return;

        const cleanEmail = String(cand.email || '').trim().toLowerCase();
        const existingUidForEmail = cleanEmail ? uidByEmail.get(cleanEmail) : undefined;
        const targetKey =
          existingUidForEmail && byKey.has(existingUidForEmail) ? existingUidForEmail : uid;

        const existing = byKey.get(targetKey);
        if (!existing) {
          byKey.set(targetKey, {
            ...cand,
            id: targetKey,
            uid: targetKey,
            email: cleanEmail,
            shortId: cand.shortId || targetKey.slice(0, 5).toUpperCase(),
          });
          if (cleanEmail) uidByEmail.set(cleanEmail, targetKey);
        } else {
          const hasRealExistingName =
            Boolean(existing.name) &&
            existing.name !== 'Unnamed Student' &&
            existing.name !== existing.email;
          const mergedName = hasRealExistingName ? existing.name : cand.name || existing.name;
          const mergedEmail = existing.email || cleanEmail;
          const mergedHandle =
            existing.handle || cand.handle || (mergedEmail ? mergedEmail.split('@')[0] : '');
          const hasWallet = existing.hasWallet || cand.hasWallet;
          const kobans = Math.max(existing.kobans, cand.kobans);
          let mergedStatus = existing.status;
          if (existing.status === 'orphan' && cand.status !== 'orphan') {
            mergedStatus = cand.status;
          }

          byKey.set(targetKey, {
            id: targetKey,
            uid: targetKey,
            name: mergedName,
            displayName: mergedName || mergedEmail || 'Student',
            handle: mergedHandle,
            email: mergedEmail,
            avatar: existing.avatar || cand.avatar,
            shortId: existing.shortId || cand.shortId || targetKey.slice(0, 5).toUpperCase(),
            plan: existing.plan === 'pro' || cand.plan === 'pro' ? 'pro' : 'free',
            role: existing.role !== 'student' ? existing.role : cand.role,
            status: mergedStatus,
            kobans,
            hasWallet,
          });
          if (mergedEmail) uidByEmail.set(mergedEmail, targetKey);
        }
      };

      // 1. Query Firestore canonical `users` + LEFT JOIN `wallets` + `publicProfiles` + requests
      const [fsUsers, fsProfiles, fsWallets, fsKobanReqs, fsPaymentReqs] = await Promise.all([
        fetchFsCollectionRest('users', 1000),
        fetchFsCollectionRest('publicProfiles', 1000),
        fetchFsCollectionRest('wallets', 1000),
        fetchFsCollectionRest('kobanRequests', 300),
        fetchFsCollectionRest('paymentRequests', 300),
      ]);

      const walletMap = new Map<string, number>();
      for (const w of fsWallets) {
        const bal =
          typeof w.data.balance === 'number' && Number.isFinite(w.data.balance)
            ? w.data.balance
            : 0;
        walletMap.set(w.id, bal);
      }

      const pubMap = new Map<string, Record<string, any>>();
      for (const p of fsProfiles) {
        pubMap.set(p.id, p.data);
      }

      const userIdsInFsUsers = new Set<string>();
      for (const u of fsUsers) {
        const uid = u.id;
        if (!uid || uid.startsWith('bot_')) continue;
        const data = u.data;
        if (data.role === 'bot' || data.deleted === true || data.status === 'deleted') continue;

        userIdsInFsUsers.add(uid);
        const pub = pubMap.get(uid) || {};
        const email = String(data.email || pub.email || '').trim().toLowerCase();
        const rawName = String(
          data.displayName || data.fullName || data.name || pub.displayName || pub.name || ''
        ).trim();
        const hasMissingName = !rawName || rawName === 'Unnamed Student';
        const rawHandle = String(
          data.username ||
            data.handle ||
            pub.username ||
            pub.handle ||
            (email ? email.split('@')[0] : '')
        )
          .trim()
          .replace(/^@+/, '');

        let status: WorkerStudentMatch['status'] = 'active';
        if (data.suspended === true || data.isBanned === true || data.status === 'suspended') {
          status = 'suspended';
        } else if (data.status === 'inactive' || data.active === false) {
          status = 'inactive';
        } else if (hasMissingName) {
          status = 'missing-name';
        }

        const hasWallet = walletMap.has(uid);
        const kobans = hasWallet
          ? walletMap.get(uid)!
          : typeof data.kobans === 'number' && Number.isFinite(data.kobans)
          ? data.kobans
          : 0;

        upsertCandidate({
          id: uid,
          uid,
          name: hasMissingName ? '' : rawName,
          displayName: hasMissingName ? email || 'Unnamed Student' : rawName,
          handle: rawHandle,
          email,
          avatar: sanitizeStoreAvatarId(
            data.equipped?.avatar,
            data.equippedAvatar,
            data.avatar,
            pub.equipped?.avatar,
            pub.equippedAvatar,
            pub.avatar
          ),
          shortId: String(data.shortId || pub.shortId || uid.slice(0, 5).toUpperCase()),
          plan: data.plan === 'pro' || data.isPremium === true ? 'pro' : 'free',
          role: String(data.role || 'student'),
          status,
          kobans,
          hasWallet,
        });
      }

      for (const p of fsProfiles) {
        const uid = p.id;
        if (!uid || uid.startsWith('bot_') || userIdsInFsUsers.has(uid)) continue;
        const pub = p.data;
        if (pub.role === 'bot') continue;
        const email = String(pub.email || '').trim().toLowerCase();
        const rawName = String(pub.displayName || pub.name || '').trim();
        const rawHandle = String(
          pub.username || pub.handle || (email ? email.split('@')[0] : '')
        )
          .trim()
          .replace(/^@+/, '');
        const hasWallet = walletMap.has(uid);

        upsertCandidate({
          id: uid,
          uid,
          name: rawName === 'Unnamed Student' ? '' : rawName,
          displayName: rawName || email || `Orphan (${uid.slice(0, 6)})`,
          handle: rawHandle,
          email,
          avatar: sanitizeStoreAvatarId(pub.equipped?.avatar, pub.equippedAvatar, pub.avatar),
          shortId: String(pub.shortId || uid.slice(0, 5).toUpperCase()),
          plan: pub.plan === 'pro' ? 'pro' : 'free',
          role: String(pub.role || 'student'),
          status: 'orphan',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      for (const r of [...fsKobanReqs, ...fsPaymentReqs]) {
        const d = r.data;
        const uid = String(d.userId || '').trim();
        if (!uid || uid.startsWith('bot_')) continue;
        const email = String(d.userEmail || '').trim().toLowerCase();
        const rawName = String(d.userName || '').trim();
        const hasWallet = walletMap.has(uid);
        upsertCandidate({
          id: uid,
          uid,
          name: rawName === 'Student' ? '' : rawName,
          displayName: rawName || email || 'Student',
          handle: email ? email.split('@')[0] : '',
          email,
          avatar: null,
          shortId: uid.slice(0, 5).toUpperCase(),
          plan: 'free',
          role: 'student',
          status: userIdsInFsUsers.has(uid) ? 'active' : 'orphan',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      // 2. Query Cloudflare D1 using parameterized SQL (? placeholders)
      if (env.DB) {
        try {
          const likePattern = `%${qNoSpaces}%`;
          const likeNormPattern = `%${qNorm}%`;

          const [rolesRes, postsRes, commentsRes] = await Promise.all([
            env.DB.prepare(
              `SELECT uid, email, role, is_posting_banned
               FROM user_roles
               WHERE LOWER(email) LIKE ? OR LOWER(uid) LIKE ?
               LIMIT 50`
            )
              .bind(likePattern, likePattern)
              .all<{ uid: string; email: string; role: string; is_posting_banned: number }>()
              .catch(() => ({ results: [] })),
            env.DB.prepare(
              `SELECT author_uid, real_author_uid, author_name, author_avatar, author_photo_url, author_equipped_avatar, author_role, is_anonymous
               FROM posts
               WHERE is_anonymous = 0 AND (LOWER(author_name) LIKE ? OR LOWER(author_uid) LIKE ? OR LOWER(real_author_uid) LIKE ?)
               LIMIT 50`
            )
              .bind(likeNormPattern, likePattern, likePattern)
              .all<Record<string, any>>()
              .catch(() => ({ results: [] })),
            env.DB.prepare(
              `SELECT author_uid, real_author_uid, author_name, author_avatar, author_photo_url, author_equipped_avatar, author_role, is_anonymous
               FROM post_comments
               WHERE is_anonymous = 0 AND (LOWER(author_name) LIKE ? OR LOWER(author_uid) LIKE ? OR LOWER(real_author_uid) LIKE ?)
               LIMIT 50`
            )
              .bind(likeNormPattern, likePattern, likePattern)
              .all<Record<string, any>>()
              .catch(() => ({ results: [] })),
          ]);

          for (const r of rolesRes.results || []) {
            if (!r.uid || r.uid.startsWith('bot_')) continue;
            const emailLower = String(r.email || '').trim().toLowerCase();
            const emailPrefix = emailLower ? emailLower.split('@')[0] : '';
            const hasWallet = walletMap.has(r.uid);
            upsertCandidate({
              id: r.uid,
              uid: r.uid,
              name: emailPrefix || '',
              displayName: emailPrefix || emailLower || 'Student',
              handle: emailPrefix,
              email: emailLower,
              avatar: null,
              shortId: r.uid.slice(0, 5).toUpperCase(),
              plan: 'free',
              role: r.role || 'student',
              status: r.is_posting_banned ? 'suspended' : emailPrefix ? 'active' : 'missing-name',
              kobans: hasWallet ? walletMap.get(r.uid)! : 0,
              hasWallet,
            });
          }

          for (const p of [...(postsRes.results || []), ...(commentsRes.results || [])]) {
            const uid = String(p.real_author_uid || p.author_uid || '').trim();
            if (!uid || uid.startsWith('bot_') || p.author_role === 'bot') continue;
            const authorName =
              p.is_anonymous || p.author_name === 'Anonymous Student'
                ? ''
                : String(p.author_name || '').trim();
            const handleGuess = authorName
              ? authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')
              : '';
            const hasWallet = walletMap.has(uid);
            upsertCandidate({
              id: uid,
              uid,
              name: authorName,
              displayName: authorName || 'Student',
              handle: handleGuess,
              email: '',
              avatar: sanitizeStoreAvatarId(p.author_equipped_avatar, p.author_avatar),
              shortId: uid.slice(0, 5).toUpperCase(),
              plan: 'free',
              role: String(p.author_role || 'student'),
              status: authorName ? 'active' : 'missing-name',
              kobans: hasWallet ? walletMap.get(uid)! : 0,
              hasWallet,
            });
          }
        } catch {
          // Ignore D1 search error and rely on Firestore matches
        }
      }

      // Score and filter candidates against normalized query
      const scored: Array<{ item: WorkerStudentMatch; score: number }> = [];
      for (const u of byKey.values()) {
        const emailLower = (u.email || '').toLowerCase();
        const nameLower = (u.name || '').toLowerCase();
        const displayLower = (u.displayName || '').toLowerCase();
        const handleLower = (u.handle || '').toLowerCase().replace(/^@+/, '');
        const idLower = (u.id || '').toLowerCase();
        const shortIdLower = (u.shortId || idLower.slice(0, 6)).toLowerCase();

        let score = 0;
        if (emailLower && emailLower === qNoSpaces) {
          score = 100;
        } else if (emailLower && emailLower.startsWith(qNoSpaces)) {
          score = 90;
        } else if (handleLower && handleLower === qHandle) {
          score = 88;
        } else if (idLower === qNoSpaces || shortIdLower === qShortId) {
          score = 85;
        } else if (emailLower && emailLower.includes(qNoSpaces)) {
          score = 80;
        } else if (nameLower && (nameLower === qNorm || displayLower === qNorm)) {
          score = 78;
        } else if (
          nameLower &&
          (nameLower.startsWith(qNorm) ||
            nameLower.includes(qNorm) ||
            nameLower.includes(qNoSpaces))
        ) {
          score = 72;
        } else if (
          displayLower &&
          (displayLower.includes(qNorm) || displayLower.includes(qNoSpaces))
        ) {
          score = 68;
        } else if (handleLower && handleLower.includes(qHandle)) {
          score = 65;
        } else if (idLower.includes(qNoSpaces) || shortIdLower.includes(qShortId)) {
          score = 55;
        }

        if (score > 0) {
          scored.push({ item: u, score });
        }
      }

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.item.kobans || 0) - (a.item.kobans || 0);
      });

      const matched = scored.map((s) => s.item);
      const paged = matched.slice(offsetCount, offsetCount + limitCount);

      return jsonResponse(
        {
          success: true,
          users: paged,
          total: matched.length,
          hasMore: offsetCount + limitCount < matched.length,
        },
        200,
        cors
      );
    }

    // 2b. Economy, Store Koban Purchases, Coupons, and Pro Subscription Guard Routes
    const cleanWorkerPath = url.pathname.replace(/\/+$/, '') || '/';
    const workerMethod = req.method.toUpperCase();

    if (cleanWorkerPath === '/api/koban-style') {
      return handleKobanStyleRequest({
        request: req,
        env: (env || {}) as any,
        tokenVerifierOverride: async () => {
          const verified = await verifyFirebaseIdToken(req, env);
          if (!verified?.uid) return null;
          return {
            uid: verified.uid,
            email: verified.email || '',
            name: verified.name || 'Student',
            picture: verified.picture || null,
            emailVerified: verified.emailVerified !== false,
            role: verified.role,
            captain: verified.captain === true,
            admin: verified.admin === true,
            superAdmin: verified.superAdmin === true,
            isSuperAdmin: verified.superAdmin === true,
            isAdminOrAbove: verified.admin === true || verified.superAdmin === true,
          };
        },
      });
    }

    if (cleanWorkerPath === '/api/plus-badge' || cleanWorkerPath === '/api/user/plus-badge') {
      return handlePlusBadgeRequest({
        request: req,
        env: (env || {}) as any,
        tokenVerifierOverride: async () => {
          const verified = await verifyFirebaseIdToken(req, env);
          if (!verified?.uid) return null;
          return {
            uid: verified.uid,
            email: verified.email || '',
            name: verified.name || 'Student',
            picture: verified.picture || null,
            emailVerified: verified.emailVerified !== false,
            role: verified.role,
            captain: verified.captain === true,
            admin: verified.admin === true,
            superAdmin: verified.superAdmin === true,
            isSuperAdmin: verified.superAdmin === true,
            isAdminOrAbove: verified.admin === true || verified.superAdmin === true,
          };
        },
      });
    }

    if (
      cleanWorkerPath === '/api/inventory' ||
      cleanWorkerPath === '/api/locker/inventory' ||
      cleanWorkerPath === '/api/inventory/equip' ||
      cleanWorkerPath === '/api/admin/backfill-starter-inventory' ||
      cleanWorkerPath === '/api/coupons' ||
      cleanWorkerPath.startsWith('/api/coupons/') ||
      cleanWorkerPath === '/api/plan/activate' ||
      cleanWorkerPath === '/api/pro/coupon/validate' ||
      cleanWorkerPath === '/api/pro/coupon/redeem' ||
      cleanWorkerPath === '/api/pro/purchase-kobans' ||
      cleanWorkerPath === '/api/pro/submit-payment' ||
      cleanWorkerPath === '/api/store/purchase' ||
      cleanWorkerPath === '/api/store/unlock' ||
      cleanWorkerPath === '/api/store/buy' ||
      cleanWorkerPath === '/api/kobans/purchase' ||
      cleanWorkerPath === '/api/admin/coupons' ||
      cleanWorkerPath.startsWith('/api/admin/coupons/') ||
      cleanWorkerPath === '/api/admin/plan-audit' ||
      cleanWorkerPath === '/api/admin/plan-repair-pkig'
    ) {
      return handleEconomyApiRequest({
        request: req,
        env: (env || {}) as any,
        tokenVerifierOverride: async () => {
          const verified = await verifyFirebaseIdToken(req, env);
          if (!verified?.uid) return null;
          return {
            uid: verified.uid,
            email: verified.email || '',
            name: verified.name || 'Student',
            picture: verified.picture || null,
            emailVerified: verified.emailVerified !== false,
            role: verified.role,
            captain: verified.captain === true,
            admin: verified.admin === true,
            superAdmin: verified.superAdmin === true,
            isSuperAdmin: verified.superAdmin === true,
            isAdminOrAbove: verified.admin === true || verified.superAdmin === true,
          };
        },
      });
    }

    if (
      cleanWorkerPath === '/api/pro/status' ||
      cleanWorkerPath === '/api/pro/purchase-guard' ||
      cleanWorkerPath === '/api/pro/purchase' ||
      cleanWorkerPath === '/api/pro/submit-payment' ||
      cleanWorkerPath === '/api/pro/activate'
    ) {
      const path = cleanWorkerPath;
      const method = workerMethod;
      const authHeader = req.headers.get('Authorization') || '';
      const authedUser = await verifyFirebaseIdToken(req, env).catch(() => null);
      if (!authedUser || !authedUser.uid) {
        return jsonResponse(
          {
            ok: false,
            code: 'UNAUTHENTICATED',
            error: 'Authentication required to check or purchase Boardly Pro.',
          },
          401,
          cors
        );
      }

      const uid = authedUser.uid;
      const serverNowMs = Date.now();

      if (uid.startsWith('guest_')) {
        if (path === '/api/pro/status' && method === 'GET') {
          return jsonResponse(
            {
              ok: true,
              serverNowMs,
              status: {
                state: 'none',
                isPro: false,
                isPersonalPro: false,
                isSuperAdmin: false,
                isCrewPro: false,
                planId: null,
                planName: 'Free Tier',
                startMs: null,
                startFormatted: null,
                expiryMs: null,
                expiryFormatted: null,
                expiryDateTimeFormatted: null,
                daysLeft: 0,
                timeLeftLabel: null,
                pendingRequest: null,
                canStartPurchase: false,
                blockReason: 'Create a registered account to upgrade to Boardly Pro.',
              },
            },
            200,
            cors
          );
        }
        return jsonResponse(
          {
            ok: false,
            code: 'GUEST_UPGRADE_FORBIDDEN',
            error: 'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.',
          },
          403,
          cors
        );
      }

      if (env.DB) {
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS pro_purchase_locks (
            uid TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            plan_id TEXT,
            plan_name TEXT,
            amount_pkr INTEGER,
            method TEXT,
            tid TEXT,
            started_at INTEGER,
            expires_at INTEGER,
            pending_request_id TEXT,
            updated_at INTEGER NOT NULL
          )`
        )
          .run()
          .catch(() => {});
      }

      const projectId = env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;
      const defaultFsDbId = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

      const unwrapField = (val: any): any => {
        if (!val || typeof val !== 'object') return undefined;
        if ('stringValue' in val) return String(val.stringValue);
        if ('timestampValue' in val) return String(val.timestampValue);
        if ('integerValue' in val) return Number(val.integerValue);
        if ('doubleValue' in val) return Number(val.doubleValue);
        if ('booleanValue' in val) return Boolean(val.booleanValue);
        if ('nullValue' in val) return null;
        return undefined;
      };

      const parseDoc = (docObj: any): { id: string; data: Record<string, any> } | null => {
        if (!docObj || typeof docObj.name !== 'string') return null;
        const docId = docObj.name.split('/').pop() || '';
        if (!docId) return null;
        const fields = docObj.fields || {};
        const data: Record<string, any> = {};
        for (const [k, v] of Object.entries(fields)) {
          data[k] = unwrapField(v);
        }
        return { id: docId, data };
      };

      const parseAnyMs = (raw: unknown): number | null => {
        if (raw === null || raw === undefined || raw === '') return null;
        if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
          return raw < 1e11 ? Math.round(raw * 1000) : Math.round(raw);
        }
        if (typeof raw === 'string') {
          const tr = raw.trim();
          if (/^\d+$/.test(tr)) {
            const n = Number(tr);
            if (n > 0) return n < 1e11 ? Math.round(n * 1000) : Math.round(n);
          }
          const parsed = new Date(tr).getTime();
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      };

      const formatDateShort = (ms: number): string =>
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(ms));

      const formatDateTimePkt = (ms: number): string =>
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(ms)) + ' PKT';

      const formatTimeLeft = (expMs: number, now: number): string => {
        const diff = Math.max(0, expMs - now);
        if (diff <= 0) return 'Expired';
        const totalHours = Math.floor(diff / (60 * 60 * 1000));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        const mins = Math.max(1, Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)));
        if (days >= 1) {
          return hours > 0
            ? `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'} left`
            : `${days} ${days === 1 ? 'day' : 'days'} left`;
        }
        return totalHours >= 1
          ? `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}, ${mins} min left`
          : `${mins} min left`;
      };

      let userDoc: Record<string, any> | null = null;
      const userReqs: Array<Record<string, any>> = [];

      if (authHeader) {
        for (const dbId of [defaultFsDbId, '(default)']) {
          try {
            const uResp = await fetch(
              `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
                dbId
              )}/documents/users/${encodeURIComponent(uid)}`,
              { headers: { Authorization: authHeader, Accept: 'application/json' } }
            );
            if (uResp.ok) {
              const parsed = parseDoc(await uResp.json().catch(() => null));
              if (parsed?.data) {
                userDoc = parsed.data;
                break;
              }
            }
          } catch {
            // Ignore
          }
        }

        for (const dbId of [defaultFsDbId, '(default)']) {
          try {
            const rResp = await fetch(
              `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
                dbId
              )}/documents/paymentRequests?pageSize=250`,
              { headers: { Authorization: authHeader, Accept: 'application/json' } }
            );
            if (rResp.ok) {
              const rJson = (await rResp.json().catch(() => ({}))) as { documents?: any[] };
              const docs = Array.isArray(rJson.documents) ? rJson.documents : [];
              for (const d of docs) {
                const p = parseDoc(d);
                if (p && String(p.data.userId || '') === uid) {
                  userReqs.push({ id: p.id, ...p.data });
                }
              }
              if (docs.length > 0 || dbId === defaultFsDbId) break;
            }
          } catch {
            // Ignore
          }
        }
      }

      let d1Lock: Record<string, any> | null = null;
      if (env.DB) {
        d1Lock = await env.DB.prepare('SELECT * FROM pro_purchase_locks WHERE uid = ? LIMIT 1')
          .bind(uid)
          .first<Record<string, any>>()
          .catch(() => null);
      }

      const expA = parseAnyMs(userDoc?.plusUntil);
      const expB = parseAnyMs(userDoc?.planExpiresAt);
      const expC = parseAnyMs(userDoc?.premiumExpiresAt);
      const expD = parseAnyMs(userDoc?.proUntil);
      const expCandidates = [expA, expB, expC, expD].filter((x): x is number => x !== null);
      let expiryMs: number | null = expCandidates.length > 0 ? Math.max(...expCandidates) : null;

      if (d1Lock && d1Lock.state === 'active' && Number(d1Lock.expires_at || 0) > serverNowMs) {
        const lockExp = Number(d1Lock.expires_at);
        if (
          userDoc === null ||
          (expiryMs !== null && expiryMs > serverNowMs) ||
          userDoc?.isPremium === true ||
          userDoc?.plan === 'pro' ||
          userDoc?.plan === 'plus' ||
          userDoc?.isPlus === true
        ) {
          expiryMs = expiryMs ? Math.max(expiryMs, lockExp) : lockExp;
        } else if (env.DB) {
          await env.DB.prepare('DELETE FROM pro_purchase_locks WHERE uid = ?').bind(uid).run().catch(() => {});
        }
      }

      const hasFutureExpiry = expiryMs !== null && expiryMs > serverNowMs;
      const isExpired = expiryMs !== null && expiryMs <= serverNowMs;
      const rawPlan = String(
        userDoc?.plusPlanId || userDoc?.planTier || userDoc?.plan || userDoc?.proPlanId || d1Lock?.plan_id || ''
      ).toLowerCase();
      const isFlaggedPlus = Boolean(
        userDoc?.isPlus === true ||
          rawPlan === 'plus' ||
          rawPlan === 'plus_monthly' ||
          rawPlan === 'plus_annual'
      );
      const isFlaggedPaid = Boolean(
        isFlaggedPlus ||
          userDoc?.isPremium === true ||
          userDoc?.isPro === true ||
          rawPlan === 'pro' ||
          rawPlan === 'pro_monthly' ||
          rawPlan === 'pro_annual'
      );

      const pendingFromFs = userReqs.find((r) => {
        const st = String(r.status || '').toLowerCase();
        const pl = String(r.plan || '').toLowerCase();
        return st === 'pending' && pl !== 'large_crew' && !r.crewId;
      });

      let activePending = pendingFromFs || null;
      if (!activePending && d1Lock && d1Lock.state === 'pending') {
        const lockAge = serverNowMs - Number(d1Lock.updated_at || 0);
        const matchInFs = userReqs.find((r) => r.id === d1Lock?.pending_request_id);
        const matchSt = String(matchInFs?.status || '').toLowerCase();
        if (matchSt === 'rejected' || matchSt === 'approved') {
          if (env.DB) {
            await env.DB.prepare('DELETE FROM pro_purchase_locks WHERE uid = ?').bind(uid).run().catch(() => {});
          }
        } else if (lockAge < 15 * 60 * 1000) {
          activePending = {
            id: String(d1Lock.pending_request_id || `pending_${uid}`),
            plan: String(d1Lock.plan_id || 'pro_monthly'),
            planName: String(d1Lock.plan_name || 'Boardly Pro, Monthly Pass'),
            amount_pkr: Number(d1Lock.amount_pkr || 199),
            method: String(d1Lock.method || 'jazzcash'),
            TID: String(d1Lock.tid || ''),
            createdAt: Number(d1Lock.started_at || d1Lock.updated_at || serverNowMs),
          };
        }
      }

      const isAnnual = rawPlan.includes('annual') || (hasFutureExpiry && expiryMs! - serverNowMs > 45 * 86400000);
      const activeTier = isFlaggedPlus ? 'plus' : 'pro';
      const planId = isFlaggedPlus
        ? isAnnual
          ? 'plus_annual'
          : 'plus_monthly'
        : isAnnual
        ? 'pro_annual'
        : 'pro_monthly';
      const planName = isFlaggedPlus
        ? isAnnual
          ? 'Boardly Plus, Annual Pass'
          : 'Boardly Plus, Monthly Pass'
        : isAnnual
        ? 'Boardly Pro, Annual Pass'
        : 'Boardly Pro, Monthly Pass';

      let resolvedStatus: Record<string, any>;
      if (hasFutureExpiry || (isFlaggedPaid && !isExpired)) {
        const daysLeft = hasFutureExpiry
          ? Math.max(1, Math.ceil((expiryMs! - serverNowMs) / 86400000))
          : isAnnual
          ? 365
          : 30;
        const expFmt = hasFutureExpiry ? formatDateShort(expiryMs!) : 'Active (No expiry date set)';
        const expDtFmt = hasFutureExpiry ? formatDateTimePkt(expiryMs!) : 'Active (No expiry date set)';
        const timeLeft = hasFutureExpiry
          ? formatTimeLeft(expiryMs!, serverNowMs)
          : isFlaggedPlus
          ? 'Active Plus membership'
          : 'Active Pro membership';
        resolvedStatus = {
          state: 'active',
          planTier: activeTier,
          plan: activeTier,
          isPaid: true,
          isPro: true,
          isPlus: isFlaggedPlus,
          isPersonalPro: true,
          isSuperAdmin: authedUser.role === 'superadmin',
          isCrewPro: false,
          planId,
          planName,
          startMs: parseAnyMs(userDoc?.planStartedAt ?? userDoc?.updatedAt),
          startFormatted: null,
          expiryMs: hasFutureExpiry ? expiryMs : null,
          expiryFormatted: expFmt,
          expiryDateTimeFormatted: expDtFmt,
          daysLeft,
          timeLeftLabel: timeLeft,
          pendingRequest: null,
          canStartPurchase: !isFlaggedPlus,
          blockReason: isFlaggedPlus
            ? `You already have Boardly Plus (${planName}) active until ${expFmt} (${timeLeft}).`
            : `You already have Boardly Pro (${planName}) active until ${expFmt} (${timeLeft}). You can upgrade to Plus anytime.`,
        };
      } else if (activePending) {
        const pRaw = String(activePending.plan || '').toLowerCase();
        const pPlus = pRaw.includes('plus');
        const pAnnual = pRaw.includes('annual');
        const pId = pPlus
          ? pAnnual
            ? 'plus_annual'
            : 'plus_monthly'
          : pAnnual
          ? 'pro_annual'
          : 'pro_monthly';
        const pName = String(
          activePending.planName ||
            (pPlus
              ? pAnnual
                ? 'Boardly Plus, Annual Pass'
                : 'Boardly Plus, Monthly Pass'
              : pAnnual
              ? 'Boardly Pro, Annual Pass'
              : 'Boardly Pro, Monthly Pass')
        );
        const subMs = parseAnyMs(activePending.createdAt ?? activePending.submittedAt);
        resolvedStatus = {
          state: 'pending',
          planTier: 'free',
          plan: 'free',
          isPaid: false,
          isPro: false,
          isPlus: false,
          isPersonalPro: false,
          isSuperAdmin: false,
          isCrewPro: false,
          planId: pId,
          planName: pName,
          startMs: null,
          startFormatted: null,
          expiryMs: null,
          expiryFormatted: null,
          expiryDateTimeFormatted: null,
          daysLeft: 0,
          timeLeftLabel: null,
          pendingRequest: {
            id: String(activePending.id || ''),
            planId: pId,
            planName: pName,
            amountPkr: Number(
              activePending.amount_pkr ??
                activePending.amount ??
                (pPlus ? (pAnnual ? 3591 : 399) : pAnnual ? 1791 : 199)
            ),
            method: String(activePending.method || 'jazzcash'),
            tid: String(activePending.TID || activePending.transactionId || ''),
            submittedAtMs: subMs,
            submittedFormatted: subMs ? formatDateTimePkt(subMs) : 'Recently submitted',
          },
          canStartPurchase: false,
          blockReason:
            'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while your payment is awaiting verification.',
        };
      } else {
        resolvedStatus = {
          state: 'none',
          planTier: 'free',
          plan: 'free',
          isPaid: false,
          isPro: false,
          isPlus: false,
          isPersonalPro: false,
          isSuperAdmin: false,
          isCrewPro: false,
          planId: null,
          planName: 'Free Tier',
          startMs: null,
          startFormatted: null,
          expiryMs: null,
          expiryFormatted: null,
          expiryDateTimeFormatted: null,
          daysLeft: 0,
          timeLeftLabel: null,
          pendingRequest: null,
          canStartPurchase: true,
          blockReason: null,
        };
      }

      if (path === '/api/pro/status' && method === 'GET') {
        return jsonResponse({ ok: true, serverNowMs, status: resolvedStatus }, 200, cors);
      }

      if (method === 'POST') {
        const body = (await req.clone().json().catch(() => ({}))) as Record<string, any>;
        const requestedPlanId = String(body.planId || body.plan || '').toLowerCase();
        const requestedIsPlus =
          requestedPlanId.includes('plus') ||
          String(body.planTier || body.tier || '').toLowerCase() === 'plus';

        if (resolvedStatus.state === 'active') {
          if (resolvedStatus.isPlus && !requestedIsPlus) {
            return jsonResponse(
              {
                ok: false,
                code: 'PLUS_ALREADY_INCLUDES_PRO',
                state: 'active',
                serverNowMs,
                status: resolvedStatus,
                error: 'You already have Plus, which includes Pro',
              },
              409,
              cors
            );
          }
          if (!requestedIsPlus) {
            return jsonResponse(
              {
                ok: false,
                code: 'PRO_ALREADY_ACTIVE',
                state: 'active',
                serverNowMs,
                status: resolvedStatus,
                error: resolvedStatus.blockReason,
              },
              409,
              cors
            );
          }
        }

        if (resolvedStatus.state === 'pending') {
          return jsonResponse(
            {
              ok: false,
              code: 'PAYMENT_PENDING_VERIFICATION',
              state: 'pending',
              serverNowMs,
              status: resolvedStatus,
              error: resolvedStatus.blockReason,
            },
            409,
            cors
          );
        }

        if (path === '/api/pro/submit-payment' && body.transactionId && body.commitLock !== true) {
          return handleEconomyApiRequest({
            request: req,
            env: (env || {}) as any,
          });
        }

        if (body.commitLock === true && env.DB) {
          const lockState = body.lockState === 'active' ? 'active' : 'pending';
          const durDays = Number(body.durationDays || (body.planId === 'pro_annual' ? 365 : 30));
          const expAt =
            lockState === 'active'
              ? Number(body.expiresAtMs || serverNowMs + durDays * 86400000)
              : null;
          const existingRow = await env.DB.prepare(
            'SELECT state, expires_at, updated_at FROM pro_purchase_locks WHERE uid = ? LIMIT 1'
          )
            .bind(uid)
            .first<{ state: string; expires_at: number | null; updated_at: number }>()
            .catch(() => null);
          if (
            existingRow &&
            ((existingRow.state === 'active' && Number(existingRow.expires_at || 0) > serverNowMs) ||
              (existingRow.state === 'pending' && serverNowMs - Number(existingRow.updated_at || 0) < 15 * 60 * 1000))
          ) {
            return jsonResponse(
              {
                ok: false,
                code: existingRow.state === 'active' ? 'PRO_ALREADY_ACTIVE' : 'PAYMENT_PENDING_VERIFICATION',
                state: existingRow.state,
                serverNowMs,
                error:
                  existingRow.state === 'active'
                    ? 'You already have an active Boardly Pro plan.'
                    : 'Your payment is being verified. This usually takes up to 24 hours.',
              },
              409,
              cors
            );
          }

          await env.DB.prepare(
            `INSERT INTO pro_purchase_locks (uid, state, plan_id, plan_name, amount_pkr, method, tid, started_at, expires_at, pending_request_id, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(uid) DO UPDATE SET
               state = excluded.state,
               plan_id = excluded.plan_id,
               plan_name = excluded.plan_name,
               amount_pkr = excluded.amount_pkr,
               method = excluded.method,
               tid = excluded.tid,
               started_at = excluded.started_at,
               expires_at = excluded.expires_at,
               pending_request_id = excluded.pending_request_id,
               updated_at = excluded.updated_at`
          )
            .bind(
              uid,
              lockState,
              String(body.planId || 'pro_monthly'),
              String(body.planName || 'Boardly Pro, Monthly Pass'),
              Number(body.amountPkr || 199),
              String(body.method || 'koban'),
              String(body.tid || ''),
              serverNowMs,
              expAt,
              body.pendingRequestId ? String(body.pendingRequestId) : null,
              serverNowMs
            )
            .run()
            .catch(() => {});
        }

        return jsonResponse(
          {
            ok: true,
            code: 'PURCHASE_ALLOWED',
            state: 'none',
            canStartPurchase: true,
            serverNowMs,
            status: resolvedStatus,
          },
          200,
          cors
        );
      }
    }

    // 3. API Routes under /api/posts (delegate non-/api/posts routes to jsWorker so no route 404s with "Not Found")
    if (!url.pathname.startsWith('/api/posts')) {
      const jsResp = await jsWorker.fetch(req as any, env as any);
      if (jsResp.status !== 404) {
        return jsResp;
      }
      return jsonResponse({ error: `Not Found: ${req.method} ${url.pathname}` }, 404, cors);
    }

    const subPath = url.pathname.slice('/api/posts'.length).replace(/\/+$/, '') || '/';

    try {
      // ── GET /api/posts/download?key=... — Authenticated Private R2 Download ──
      if (subPath === '/download' && req.method === 'GET') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse(
            {
              success: false,
              code: 'NOT_AUTHENTICATED',
              error: 'Please sign in again',
            },
            401,
            cors
          );
        }

        const rawKey = (url.searchParams.get('key') || '').trim().replace(/^\/+/, '');
        if (!rawKey || rawKey.includes('..')) {
          return jsonResponse({ success: false, error: 'Invalid file key.' }, 400, cors);
        }
        if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
          return jsonResponse(
            {
              success: false,
              code: 'PRIVATE_R2_PREFIX',
              error: 'Forbidden: Private signature and certificate files cannot be accessed via post endpoints.',
            },
            403,
            cors
          );
        }

        if (env.R2_BUCKET) {
          const obj = await env.R2_BUCKET.get(rawKey);
          if (obj) {
            const fileName = rawKey.split('/').pop() || 'resource';
            const contentType =
              obj.httpMetadata?.contentType || inferMimeTypeFromKey(rawKey);
            return new Response(obj.body, {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${sanitizeUploadFileName(fileName)}"`,
                'Cache-Control': 'private, no-store',
              },
            });
          }
        }

        // Fallback for seeded study material PDFs stored under commons/pdfs/
        if (rawKey.startsWith('commons/')) {
          const staticAssetUrl = new URL(`/api/r2/${rawKey}`, url.origin);
          const assetResp = await fetch(staticAssetUrl.toString());
          if (assetResp.ok) {
            const fileName = rawKey.split('/').pop() || 'study-material.pdf';
            return new Response(assetResp.body, {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': inferMimeTypeFromKey(rawKey),
                'Content-Disposition': `attachment; filename="${sanitizeUploadFileName(fileName)}"`,
                'Cache-Control': 'private, no-store',
              },
            });
          }
        }

        return jsonResponse({ success: false, error: 'File not found in R2 storage.' }, 404, cors);
      }

      // ── GET /api/posts/file?key=... — Inline Image Streaming from R2 ──
      if (subPath === '/file' && req.method === 'GET') {
        const rawKey = (url.searchParams.get('key') || '').trim().replace(/^\/+/, '');
        if (!rawKey || rawKey.includes('..')) {
          return jsonResponse({ success: false, error: 'Invalid file key.' }, 400, cors);
        }
        if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
          return jsonResponse(
            {
              success: false,
              code: 'PRIVATE_R2_PREFIX',
              error: 'Forbidden: Private signature and certificate files have no public URL.',
            },
            403,
            cors
          );
        }

        if (env.R2_BUCKET) {
          const obj = await env.R2_BUCKET.get(rawKey);
          if (obj) {
            const contentType =
              obj.httpMetadata?.contentType || inferMimeTypeFromKey(rawKey);
            return new Response(obj.body, {
              status: 200,
              headers: {
                ...cors,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          }
        }

        return jsonResponse({ success: false, error: 'Image not found.' }, 404, cors);
      }

      // ── POST /api/posts/upload — Direct Worker Upload to R2 (`posts/{postId}/{random-id}-{safe-filename}`) ──
      if ((subPath === '/upload' || subPath === '/upload-url') && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          console.error('[CloudflareWorker] Upload rejected: invalid or missing Firebase token');
          return jsonResponse(
            {
              success: false,
              code: 'NOT_AUTHENTICATED',
              error: 'Please sign in again',
            },
            401,
            cors
          );
        }

        if (!env.R2_BUCKET) {
          console.error('[CloudflareWorker] Upload failed: R2_BUCKET binding is missing on Worker');
          return jsonResponse(
            {
              success: false,
              code: 'R2_BINDING_MISSING',
              error:
                'Upload failed, try again (Cloudflare R2 bucket binding R2_BUCKET is not configured).',
            },
            503,
            cors
          );
        }

        const allowed = await checkRateLimit(env, `upload:${user.uid}`, 25, 60 * 60 * 1000);
        if (!allowed && user.role !== 'superadmin') {
          return jsonResponse(
            { success: false, error: 'Upload rate limit reached. Please wait a bit.' },
            429,
            cors
          );
        }

        const contentType = req.headers.get('Content-Type') || '';
        let fileBuffer: ArrayBuffer | Uint8Array | null = null;
        let fileName = 'attachment';
        let mimeType = 'application/octet-stream';
        let fileSize = 0;
        let postId = req.headers.get('X-Post-Id') || `post_${Date.now()}`;

        if (contentType.includes('multipart/form-data')) {
          const formData = await req.formData();
          const file = formData.get('file') as File | null;
          const formPostId = formData.get('postId');
          if (typeof formPostId === 'string' && formPostId.trim()) {
            postId = formPostId.trim();
          }
          if (!file) {
            return jsonResponse(
              { success: false, code: 'MISSING_FILE_DATA', error: 'Missing file in form data.' },
              400,
              cors
            );
          }
          fileName = file.name || String(formData.get('fileName') || 'attachment');
          mimeType = file.type || String(formData.get('fileType') || inferMimeTypeFromKey(fileName));
          fileSize = file.size;
          if (fileSize === 0) {
            return jsonResponse({ success: false, error: 'Uploaded file is empty (0 bytes).' }, 400, cors);
          }
          if (fileSize > MAX_UPLOAD_BYTES) {
            return jsonResponse(
              { success: false, code: 'FILE_TOO_LARGE', error: 'File too large' },
              413,
              cors
            );
          }
          if (!isAllowedMimeAndName(mimeType, fileName)) {
            return jsonResponse(
              { success: false, code: 'UNSUPPORTED_TYPE', error: 'Unsupported file type' },
              415,
              cors
            );
          }
          fileBuffer = await file.arrayBuffer();
        } else {
          const body = (await req.json().catch(() => ({}))) as Record<string, any>;
          if (body.postId) postId = String(body.postId).trim();
          fileName = String(body.fileName || body.name || 'attachment').trim();
          mimeType = String(body.fileType || body.type || inferMimeTypeFromKey(fileName)).trim();
          const dataBase64 = String(body.dataBase64 || '').trim();

          if (!dataBase64) {
            return jsonResponse(
              { success: false, code: 'MISSING_FILE_DATA', error: 'Missing file binary payload.' },
              400,
              cors
            );
          }

          const decoded = base64ToUint8Array(dataBase64);
          fileSize = decoded.byteLength;
          if (fileSize === 0) {
            return jsonResponse({ success: false, error: 'Uploaded file is empty (0 bytes).' }, 400, cors);
          }
          if (fileSize > MAX_UPLOAD_BYTES) {
            return jsonResponse(
              { success: false, code: 'FILE_TOO_LARGE', error: 'File too large' },
              413,
              cors
            );
          }
          if (!isAllowedMimeAndName(mimeType, fileName)) {
            return jsonResponse(
              { success: false, code: 'UNSUPPORTED_TYPE', error: 'Unsupported file type' },
              415,
              cors
            );
          }
          fileBuffer = decoded;
        }

        // Canonical R2 key format: posts/{postId}/{random-id}-{safe-filename}
        const key = buildR2PostFileKey(postId, fileName);

        await env.R2_BUCKET.put(key, fileBuffer, {
          httpMetadata: {
            contentType: mimeType,
            cacheControl: 'private, max-age=31536000',
          },
          customMetadata: {
            postId,
            uploadedBy: user.uid,
            originalName: fileName,
          },
        });

        const isImage =
          mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
        const downloadUrl = `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(key)}`;
        const urlStr = isImage
          ? `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(key)}`
          : downloadUrl;

        // Also record the media reference in D1 post_media table when DB is bound
        if (env.DB) {
          try {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO post_media (
                id, post_id, r2_key, file_name, mime_type, file_size, url, download_url, uploaded_by_uid, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                `media_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
                postId,
                key,
                fileName,
                mimeType,
                fileSize,
                urlStr,
                downloadUrl,
                user.uid,
                Date.now()
              )
              .run();
          } catch (mediaErr) {
            console.warn('[CloudflareWorker] post_media reference insert notice:', mediaErr);
          }
        }

        return jsonResponse(
          {
            success: true,
            key,
            r2Key: key,
            url: urlStr,
            downloadUrl,
            name: fileName,
            size: fileSize,
            type: mimeType,
          },
          200,
          cors
        );
      }

      // ── DELETE /api/posts/upload — Rollback uploaded R2 objects on failure ──
      if (subPath === '/upload' && req.method === 'DELETE') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse({ success: false, error: 'Please sign in again' }, 401, cors);
        }
        const body = (await req.json().catch(() => ({}))) as { keys?: string[] };
        const keys = Array.isArray(body.keys)
          ? body.keys
              .map((k) => String(k || '').trim())
              .filter((k) => k.startsWith('posts/'))
          : [];

        if (env.R2_BUCKET && keys.length > 0) {
          await Promise.all(keys.map((k) => env.R2_BUCKET!.delete(k).catch(() => {})));
        }
        if (env.DB && keys.length > 0) {
          await Promise.all(
            keys.map((k) =>
              env.DB!.prepare('DELETE FROM post_media WHERE r2_key = ?')
                .bind(k)
                .run()
                .catch(() => {})
            )
          );
        }

        return jsonResponse({ success: true, deletedKeys: keys }, 200, cors);
      }

      if (!env.DB) {
        return jsonResponse(
          {
            success: false,
            code: 'D1_BINDING_MISSING',
            error: 'Cloudflare D1 binding (DB) is not configured on this Worker.',
          },
          503,
          cors
        );
      }

      // ── GET /api/posts — Paginated list, filter, search (COLLATE NOCASE + explicit cols + rate limit) ──
      if (subPath === '/' && req.method === 'GET') {
        if (!checkPublicIpRateLimit(req, 'posts_feed', 150, 60_000)) {
          return jsonResponse({ success: false, error: 'Too many requests.' }, 429, cors);
        }

        const pageSize = Math.min(
          100,
          Math.max(
            1,
            Number(url.searchParams.get('limit') || url.searchParams.get('pageSize') || 15)
          )
        );
        const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
        const subject = (url.searchParams.get('subject') || '').trim();
        const type = (url.searchParams.get('type') || '').trim();
        const target = (url.searchParams.get('target') || '').trim();
        const classLevel = (url.searchParams.get('classLevel') || '').trim();
        const board = (url.searchParams.get('board') || '').trim();
        const search = (url.searchParams.get('search') || url.searchParams.get('q') || '').trim();
        const authorUid = (
          url.searchParams.get('authorUid') ||
          url.searchParams.get('authorId') ||
          url.searchParams.get('author_uid') ||
          ''
        ).trim();
        const requestedOwnAnonymous =
          url.searchParams.get('includeOwnAnonymous') === 'true' ||
          url.searchParams.get('includeOwnAnonymous') === '1';
        let canIncludeOwnAnonymous = false;
        if (authorUid && requestedOwnAnonymous) {
          const verifiedCaller = await verifyFirebaseIdToken(req, env).catch(() => null);
          canIncludeOwnAnonymous = Boolean(verifiedCaller && verifiedCaller.uid === authorUid);
        }
        const savedBy = (url.searchParams.get('savedBy') || '').trim();
        const likedBy = (url.searchParams.get('likedBy') || '').trim();
        const followingUidsRaw = (url.searchParams.get('followingUids') || '').trim();
        const flaggedOnly = url.searchParams.get('flaggedOnly') === 'true';
        const sort = (url.searchParams.get('sort') || 'newest').trim();

        const clauses: string[] = [
          flaggedOnly ? '(report_count >= 1 OR is_hidden = 1)' : 'is_hidden = 0',
        ];
        const binds: any[] = [];

        if (subject && subject !== 'all') {
          clauses.push('subject = ? COLLATE NOCASE');
          binds.push(subject);
        }
        if (type && type !== 'all') {
          clauses.push('type = ?');
          binds.push(type);
        }
        if (target && target !== 'all') {
          clauses.push('target = ? COLLATE NOCASE');
          binds.push(target);
        }
        if (classLevel && classLevel !== 'all') {
          clauses.push('class_level = ?');
          binds.push(classLevel.replace(/^Class\s+/i, ''));
        }
        if (board && board !== 'all') {
          clauses.push('board = ? COLLATE NOCASE');
          binds.push(board);
        }
        if (authorUid) {
          if (canIncludeOwnAnonymous) {
            clauses.push('(author_uid = ? OR real_author_uid = ?)');
            binds.push(authorUid, authorUid);
          } else {
            clauses.push('(author_uid = ? AND is_anonymous = 0)');
            binds.push(authorUid);
          }
        }
        if (savedBy) {
          clauses.push('id IN (SELECT post_id FROM post_saves WHERE user_uid = ?)');
          binds.push(savedBy);
        }
        if (likedBy) {
          clauses.push('id IN (SELECT post_id FROM post_likes WHERE user_uid = ?)');
          binds.push(likedBy);
        }
        if (followingUidsRaw) {
          const uids = followingUidsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 50);
          if (uids.length > 0) {
            const placeholders = uids.map(() => '?').join(',');
            clauses.push(`(is_anonymous = 0 AND author_uid IN (${placeholders}))`);
            binds.push(...uids);
          } else {
            clauses.push('1 = 0');
          }
        }
        if (search) {
          clauses.push(
            '(title LIKE ? OR description LIKE ? OR subject LIKE ? OR tags_json LIKE ?)'
          );
          const like = `%${search}%`;
          binds.push(like, like, like, like);
        }

        const orderBy =
          sort === 'trending' || sort === 'top'
            ? 'is_pinned DESC, upvotes DESC, created_at DESC'
            : 'is_pinned DESC, created_at DESC';

        const whereSql = clauses.join(' AND ');
        const filterBinds = [...binds];
        const sql = `SELECT ${POST_SELECT_COLS} FROM posts WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        binds.push(pageSize + 1, offset);

        const [{ results }, countRow] = await Promise.all([
          env.DB.prepare(sql).bind(...binds).all(),
          authorUid
            ? env.DB.prepare(`SELECT COUNT(*) AS cnt FROM posts WHERE ${whereSql}`)
                .bind(...filterBinds)
                .first<{ cnt: number }>()
                .catch(() => null)
            : Promise.resolve(null),
        ]);
        let rows: any[] = results || [];
        if (
          rows.length === 0 &&
          !flaggedOnly &&
          !authorUid &&
          !savedBy &&
          !likedBy &&
          !followingUidsRaw &&
          Array.isArray((seedDataset as any)?.posts)
        ) {
          const anyPostRow = await env.DB.prepare('SELECT 1 AS has_any FROM posts LIMIT 1')
            .first<{ has_any: number }>()
            .catch(() => null);
          if (!anyPostRow) {
            let fallbackRows = ((seedDataset as any).posts as Record<string, any>[]).filter(
              (p) => !Number(p.is_hidden || 0)
            );
            if (subject && subject !== 'all') {
              const sLow = subject.toLowerCase();
              fallbackRows = fallbackRows.filter((p) => {
                const ps = String(p.subject || '').toLowerCase();
                return ps === sLow || ps.includes(sLow) || (sLow === 'computer' && ps.includes('computer'));
              });
            }
            if (type && type !== 'all') {
              fallbackRows = fallbackRows.filter((p) => p.type === type);
            }
            if (target && target !== 'all') {
              const tLow = target.toLowerCase();
              fallbackRows = fallbackRows.filter((p) =>
                String(p.target || '').toLowerCase().includes(tLow)
              );
            }
            if (search) {
              const qLow = search.toLowerCase();
              fallbackRows = fallbackRows.filter(
                (p) =>
                  String(p.title || '').toLowerCase().includes(qLow) ||
                  String(p.description || '').toLowerCase().includes(qLow) ||
                  String(p.subject || '').toLowerCase().includes(qLow) ||
                  String(p.tags_json || '').toLowerCase().includes(qLow)
              );
            }
            rows = fallbackRows.slice(offset, offset + pageSize + 1);
          }
        }
        const hasMore = rows.length > pageSize;
        const pageRows = rows.slice(0, pageSize);
        const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
          env.DB,
          pageRows.map((r: any) => (r.is_anonymous ? null : r.author_uid))
        );
        const posts = pageRows.map((r) =>
          rowToCommonsPost(r as Record<string, any>, liveAuthorsMap)
        );
        const resolvedTotal =
          countRow && typeof countRow.cnt === 'number'
            ? Number(countRow.cnt)
            : offset + posts.length;

        const bothBindingsPresent = Boolean(env.DB && env.R2_BUCKET);
        const hasAuthHeader = Boolean(
          req.headers.get('Authorization') || req.headers.get('X-Guest-Session')
        );
        const isPublicFeedQuery =
          !hasAuthHeader &&
          !authorUid &&
          !flaggedOnly &&
          !savedBy &&
          !likedBy &&
          !canIncludeOwnAnonymous;
        return jsonResponse(
          {
            success: true,
            backendMode: bothBindingsPresent ? 'cloudflare-d1-r2' : 'preview-demo',
            posts,
            total: resolvedTotal,
            hasMore,
            nextOffset: hasMore ? offset + pageSize : null,
          },
          200,
          {
            ...cors,
            'Cache-Control': authorUid
              ? 'private, no-store'
              : isPublicFeedQuery
              ? 'public, max-age=30, stale-while-revalidate=90'
              : 'private, max-age=10, stale-while-revalidate=30',
          }
        );
      }

      // ── GET /api/posts/limit — Live tiered daily post quota (PKT midnight reset) ──
      if (subPath === '/limit' && req.method === 'GET') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse(
            {
              success: false,
              code: 'NOT_AUTHENTICATED',
              error: 'Please sign in again',
            },
            401,
            cors
          );
        }

        const nowMs = Date.now();
        const windowInfo = getDailyPostWindow(nowMs);
        const [plan, usedToday] = await Promise.all([
          resolveWorkerUserPlanTier(req, env, user),
          getWorkerDailyPostsUsedToday(env, user.uid, windowInfo),
        ]);
        const quota = buildDailyPostQuotaStatus({ plan, usedToday, nowMs });

        return jsonResponse(
          {
            success: true,
            ...quota,
          },
          200,
          { ...cors, 'Cache-Control': 'no-store' }
        );
      }

      // ── POST /api/posts — Create Post in D1 (with R2 rollback on failure) ──
      if (subPath === '/' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse(
            {
              success: false,
              code: 'NOT_AUTHENTICATED',
              error: 'Please sign in again',
            },
            401,
            cors
          );
        }

        const checkNowMs = Date.now();
        const windowInfo = getDailyPostWindow(checkNowMs);
        const [userPlan, usedTodayBefore] = await Promise.all([
          resolveWorkerUserPlanTier(req, env, user),
          getWorkerDailyPostsUsedToday(env, user.uid, windowInfo),
        ]);
        const preQuota = buildDailyPostQuotaStatus({
          plan: userPlan,
          usedToday: usedTodayBefore,
          nowMs: checkNowMs,
        });

        if (preQuota.limitReached) {
          return jsonResponse(
            {
              success: false,
              code: 'DAILY_POST_LIMIT_REACHED',
              error: formatPostLimitReachedMessage(preQuota),
              quota: preQuota,
            },
            429,
            cors
          );
        }

        const body = (await req.json()) as Record<string, any>;
        const title = String(body.title || '').trim();
        const description = String(body.description || body.body || '').trim();
        if (!title) {
          return jsonResponse({ success: false, error: 'Post title is required.' }, 400, cors);
        }

        const rawFiles = Array.isArray(body.files) ? body.files : [];
        if (rawFiles.length > MAX_FILES_PER_POST) {
          return jsonResponse(
            { success: false, error: `Maximum ${MAX_FILES_PER_POST} files allowed per post.` },
            400,
            cors
          );
        }

        const id = String(
          body.id || body.postId || `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
        ).trim();
        const slug = buildSlug(id, title);
        const isAnon = Boolean(body.isAnonymous);
        const now = Date.now();
        const files = rawFiles.map(normalizeStoredFileEntry);
        const tags = Array.isArray(body.tags) ? body.tags : [];

        try {
          await env.DB.prepare(
            `INSERT INTO posts (
              id, slug, type, title, description, subject, chapter, target,
              class_level, board, format, tags_json, files_json, is_anonymous,
              anonymous_alias, author_uid, real_author_uid, author_name,
              author_avatar, author_frame, author_equipped_avatar, author_photo_url,
              author_role, author_custom_role, status, visibility, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'public', ?, ?)`
          )
            .bind(
              id,
              slug,
              String(body.type || 'notes'),
              title,
              description,
              String(body.subject || 'General'),
              String(body.chapter || 'General'),
              String(body.target || 'General'),
              String(body.classLevel || '11'),
              String(body.board || 'Federal'),
              files.length > 0 ? 'pdf' : 'text',
              JSON.stringify(tags),
              JSON.stringify(files),
              isAnon ? 1 : 0,
              'Anonymous Student',
              isAnon ? null : user.uid,
              user.uid, // Stored privately in real_author_uid for moderation & owner deletion
              isAnon ? 'Anonymous Student' : String(body.authorName || user.name || 'Student'),
              isAnon ? null : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
              isAnon ? null : body.authorFrame || null,
              isAnon ? null : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
              null,
              isAnon ? 'student' : user.role,
              isAnon ? null : user.customRole,
              now,
              now
            )
            .run();
        } catch (dbErr: any) {
          console.error('[CloudflareWorker] D1 post insert failed, rolling back R2 files:', dbErr);
          if (env.R2_BUCKET && files.length > 0) {
            await Promise.all(
              files
                .map((f) => f.r2Key)
                .filter(Boolean)
                .map((k) => env.R2_BUCKET!.delete(String(k)).catch(() => {}))
            );
          }
          return jsonResponse(
            {
              success: false,
              error: 'Upload failed, try again',
              details: dbErr?.message || String(dbErr),
            },
            500,
            cors
          );
        }

        // Automatically create follower notifications in D1 when a non-anonymous post is published
        if (!isAnon && user.uid) {
          try {
            const { results: followerRows } = await env.DB.prepare(
              'SELECT DISTINCT follower_uid FROM follows WHERE following_uid = ? AND follower_uid != ?'
            )
              .bind(user.uid, user.uid)
              .all();
            const followerUids = (followerRows || [])
              .map((r: any) => String(r.follower_uid || '').trim())
              .filter(Boolean);

            if (followerUids.length > 0) {
              const authorDisplay = String(body.authorName || user.name || 'Student');
              const authorAvatarVal = sanitizeStoreAvatarId(
                body.authorEquippedAvatar,
                body.authorAvatar
              );
              const authorFrameVal = body.authorFrame || null;
              const postTypeVal = String(body.type || 'notes');
              const snippet = description.slice(0, 140) || `New ${postTypeVal} in ${String(body.subject || 'Commons')}`;

              const notifStmts = followerUids.map((followerUid) =>
                env.DB!.prepare(
                  `INSERT OR IGNORE INTO notifications (
                    id, user_id, type, title, message, link, read, is_pinned,
                    author_id, author_name, author_avatar, author_frame, post_id, post_type, created_at
                  ) VALUES (?, ?, 'following_post', ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                  `post_${id}_follower_${followerUid}`,
                  followerUid,
                  `${authorDisplay} posted: ${title}`,
                  snippet,
                  `/commons/post/${slug}`,
                  user.uid,
                  authorDisplay,
                  authorAvatarVal,
                  authorFrameVal,
                  id,
                  postTypeVal,
                  now
                )
              );
              await env.DB.batch(notifStmts);
            }
          } catch (notifErr) {
            console.warn('[CloudflareWorker] Follower notification insert notice:', notifErr);
          }
        }

        await incrementWorkerDailyPostCounter(env, user.uid, windowInfo, usedTodayBefore + 1);
        const postQuota = buildDailyPostQuotaStatus({
          plan: userPlan,
          usedToday: usedTodayBefore + 1,
          nowMs: now,
        });

        const createdRow = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
          .bind(id)
          .first<Record<string, any>>();

        return jsonResponse(
          {
            success: true,
            postId: id,
            quota: postQuota,
            post: createdRow
              ? rowToCommonsPost(createdRow)
              : rowToCommonsPost({
                  id,
                  slug,
                  type: body.type || 'notes',
                  title,
                  description,
                  tags_json: JSON.stringify(tags),
                  files_json: JSON.stringify(files),
                  is_anonymous: isAnon ? 1 : 0,
                  author_uid: isAnon ? null : user.uid,
                  author_name: isAnon
                    ? 'Anonymous Student'
                    : String(body.authorName || user.name || 'Student'),
                  created_at: now,
                  updated_at: now,
                }),
          },
          201,
          cors
        );
      }

      // GET /api/posts/moderation/queue (60-sec cache to absorb 30s AdminLayout polling)
      if (subPath === '/moderation/queue' && req.method === 'GET') {
        const cachedModQueue = getWorkerCached<Record<string, any>>('posts:moderation_queue');
        if (cachedModQueue) {
          return jsonResponse(cachedModQueue, 200, cors);
        }
        try {
          const [{ results: rows }, { results: reportRows }] = await Promise.all([
            env.DB.prepare(
              `SELECT ${POST_SELECT_COLS} FROM posts WHERE report_count >= 1 OR is_hidden = 1 ORDER BY created_at DESC LIMIT 100`
            ).all(),
            env.DB.prepare(
              `SELECT id, post_id, reporter_uid, reason, details, status, created_at FROM post_reports WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100`
            )
              .all()
              .catch(() => ({ results: [] })),
          ]);
          const flaggedPosts = (rows || []).map((r: any) => rowToCommonsPost(r));
          const payload = setWorkerCached(
            'posts:moderation_queue',
            {
              success: true,
              flaggedPosts,
              reports: reportRows || [],
            },
            60_000
          );
          return jsonResponse(payload, 200, cors);
        } catch {
          return jsonResponse({ success: true, flaggedPosts: [], reports: [] }, 200, cors);
        }
      }

      // Dynamic routes: /api/posts/:slugOrId[/action]
      const segments = subPath.split('/').filter(Boolean);
      const slugOrId = segments[0] || '';
      const action = segments[1] || '';
      const subId = segments[2] || '';
      const postId = extractIdFromSlugOrId(slugOrId);

      // GET /api/posts/:slugOrId
      if (!action && req.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT * FROM posts WHERE (id = ? OR slug = ?) LIMIT 1'
        )
          .bind(postId, slugOrId)
          .first<Record<string, any>>();

        if (!row) {
          return jsonResponse({ error: 'Post not found.' }, 404, cors);
        }
        const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
          env.DB,
          row.is_anonymous ? [] : [row.author_uid]
        );
        return jsonResponse(
          { success: true, post: rowToCommonsPost(row, liveAuthorsMap) },
          200,
          {
            ...cors,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        );
      }

      // GET /api/posts/:slugOrId/status
      if (action === 'status' && req.method === 'GET') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const targetUid = user?.uid || (url.searchParams.get('userId') || '').trim();
        if (!targetUid) {
          return jsonResponse(
            { success: true, voted: false, saved: false },
            200,
            {
              ...cors,
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
          );
        }
        const postRow = await env.DB.prepare(
          'SELECT id FROM posts WHERE id = ? OR slug = ? LIMIT 1'
        )
          .bind(postId, slugOrId)
          .first<{ id: string }>();
        const canonicalId = postRow?.id || postId;

        const [likeRow, saveRow] = await Promise.all([
          env.DB.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?')
            .bind(canonicalId, targetUid)
            .first(),
          env.DB.prepare('SELECT 1 FROM post_saves WHERE post_id = ? AND user_uid = ?')
            .bind(canonicalId, targetUid)
            .first(),
        ]);
        return jsonResponse(
          {
            success: true,
            voted: Boolean(likeRow),
            saved: Boolean(saveRow),
          },
          200,
          {
            ...cors,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        );
      }

      // PUT or PATCH /api/posts/:slugOrId
      if (!action && (req.method === 'PUT' || req.method === 'PATCH')) {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const existing = await env.DB.prepare(
          'SELECT * FROM posts WHERE id = ? OR slug = ? LIMIT 1'
        )
          .bind(postId, slugOrId)
          .first<Record<string, any>>();

        if (!existing) return jsonResponse({ error: 'Post not found' }, 404, cors);
        if (existing.real_author_uid !== user.uid && user.role !== 'superadmin') {
          return jsonResponse({ error: 'Forbidden' }, 403, cors);
        }

        const body = (await req.json()) as Record<string, any>;
        const nextTitle = body.title !== undefined ? String(body.title).trim() : existing.title;
        const nextDesc =
          body.description !== undefined ? String(body.description).trim() : existing.description;
        const nextHidden =
          body.isHidden !== undefined ? (body.isHidden ? 1 : 0) : existing.is_hidden;
        const nextPinned =
          body.isPinned !== undefined ? (body.isPinned ? 1 : 0) : existing.is_pinned;
        const nextAnon =
          body.isAnonymous !== undefined ? (body.isAnonymous ? 1 : 0) : existing.is_anonymous;

        await env.DB.prepare(
          `UPDATE posts
           SET title = ?, description = ?, is_hidden = ?, is_pinned = ?, is_anonymous = ?,
               author_uid = ?, updated_at = ?
           WHERE id = ?`
        )
          .bind(
            nextTitle,
            nextDesc,
            nextHidden,
            nextPinned,
            nextAnon,
            nextAnon ? null : existing.real_author_uid,
            Date.now(),
            existing.id
          )
          .run();

        const updated = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
          .bind(existing.id)
          .first<Record<string, any>>();

        return jsonResponse(
          { success: true, post: updated ? rowToCommonsPost(updated) : null },
          200,
          cors
        );
      }

      // DELETE /api/posts/:slugOrId
      if (!action && req.method === 'DELETE') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const existing = await env.DB.prepare(
          'SELECT id, real_author_uid, author_uid, files_json FROM posts WHERE id = ? OR slug = ? LIMIT 1'
        )
          .bind(postId, slugOrId)
          .first<Record<string, any>>();

        if (!existing) return jsonResponse({ error: 'Post not found' }, 404, cors);
        if (
          existing.real_author_uid !== user.uid &&
          existing.author_uid !== user.uid &&
          user.role !== 'superadmin'
        ) {
          return jsonResponse({ error: 'Forbidden' }, 403, cors);
        }

        // Also delete R2 attachments when post is deleted
        if (env.R2_BUCKET && existing.files_json) {
          try {
            const parsedFiles = JSON.parse(existing.files_json);
            if (Array.isArray(parsedFiles)) {
              await Promise.all(
                parsedFiles
                  .map((f) => f?.r2Key || f?.key)
                  .filter((k) => typeof k === 'string' && k.startsWith('posts/'))
                  .map((k) => env.R2_BUCKET!.delete(k).catch(() => {}))
              );
            }
          } catch {}
        }

        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(existing.id).run();
        return jsonResponse({ success: true, deletedId: existing.id }, 200, cors);
      }

      // POST /api/posts/:slugOrId/like
      if (action === 'like' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const targetPost = await env.DB.prepare(
          'SELECT id, upvotes FROM posts WHERE id = ? OR slug = ? LIMIT 1'
        )
          .bind(postId, slugOrId)
          .first<{ id: string; upvotes: number }>();

        if (!targetPost) {
          return jsonResponse({ error: 'Post not found' }, 404, cors);
        }
        const canonicalId = targetPost.id;

        const existingLike = await env.DB.prepare(
          'SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?'
        )
          .bind(canonicalId, user.uid)
          .first();

        let voted = false;
        if (existingLike) {
          await env.DB.batch([
            env.DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_uid = ?').bind(
              canonicalId,
              user.uid
            ),
            env.DB.prepare(
              'UPDATE posts SET upvotes = MAX((SELECT COUNT(*) FROM post_likes WHERE post_id = ?), MAX(0, upvotes - 1)) WHERE id = ?'
            ).bind(canonicalId, canonicalId),
          ]);
          voted = false;
        } else {
          await env.DB.batch([
            env.DB.prepare(
              'INSERT OR IGNORE INTO post_likes (post_id, user_uid, created_at) VALUES (?, ?, ?)'
            ).bind(canonicalId, user.uid, Date.now()),
            env.DB.prepare(
              'UPDATE posts SET upvotes = MAX((SELECT COUNT(*) FROM post_likes WHERE post_id = ?), upvotes + 1) WHERE id = ?'
            ).bind(canonicalId, canonicalId),
          ]);
          voted = true;
        }

        const postRow = await env.DB.prepare('SELECT upvotes FROM posts WHERE id = ?')
          .bind(canonicalId)
          .first<{ upvotes: number }>();
        const newCount = Number(postRow?.upvotes || 0);

        return jsonResponse(
          {
            success: true,
            voted,
            newCount,
            upvoted: voted,
            upvotesCount: newCount,
            likesCount: newCount,
          },
          200,
          {
            ...cors,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        );
      }

      // POST /api/posts/:slugOrId/save
      if (action === 'save' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const existingSave = await env.DB.prepare(
          'SELECT 1 FROM post_saves WHERE post_id = ? AND user_uid = ?'
        )
          .bind(postId, user.uid)
          .first();

        let saved = false;
        if (existingSave) {
          await env.DB.prepare('DELETE FROM post_saves WHERE post_id = ? AND user_uid = ?')
            .bind(postId, user.uid)
            .run();
          await env.DB.prepare('UPDATE posts SET save_count = MAX(0, save_count - 1) WHERE id = ?')
            .bind(postId)
            .run();
          saved = false;
        } else {
          await env.DB.prepare(
            'INSERT INTO post_saves (post_id, user_uid, created_at) VALUES (?, ?, ?)'
          )
            .bind(postId, user.uid, Date.now())
            .run();
          await env.DB.prepare('UPDATE posts SET save_count = save_count + 1 WHERE id = ?')
            .bind(postId)
            .run();
          saved = true;
        }

        return jsonResponse({ success: true, saved }, 200, cors);
      }

      // GET /api/posts/:slugOrId/comments
      if (action === 'comments' && req.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 200'
        )
          .bind(postId)
          .all();

        const rawComments = results || [];
        const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
          env.DB,
          rawComments.map((c: any) => (c.is_anonymous ? null : c.author_uid))
        );

        const comments = rawComments.map((c: any) => {
          const isAnon = Boolean(c.is_anonymous);
          const authorUid = isAnon ? null : c.author_uid;
          const live = !isAnon && authorUid ? liveAuthorsMap.get(authorUid) : undefined;
          const resolvedAvatar = isAnon
            ? null
            : live?.avatar || sanitizeStoreAvatarId(c.author_equipped_avatar, c.author_avatar);
          return {
            id: c.id,
            postId: c.post_id,
            text: c.text,
            isAnonymous: isAnon,
            authorUid,
            authorName: isAnon
              ? c.anonymous_alias || 'Anonymous Student'
              : live?.displayName || live?.username || c.author_name || 'Student',
            authorUsername: isAnon ? null : live?.username || null,
            authorAvatar: resolvedAvatar,
            authorFrame: isAnon ? null : live?.frame || c.author_frame,
            authorEquippedAvatar: resolvedAvatar,
            authorPhotoURL: null,
            authorRole: isAnon ? 'student' : live?.role || c.author_role || 'student',
            authorCustomRole: isAnon ? null : live?.customRole || c.author_custom_role,
            createdAt: new Date(Number(c.created_at || Date.now())).toISOString(),
          };
        });

        return jsonResponse(
          { success: true, comments },
          200,
          { ...cors, 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        );
      }

      // POST /api/posts/:slugOrId/comments
      if (action === 'comments' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const body = (await req.json()) as Record<string, any>;
        const text = String(body.text || '').trim();
        if (!text) return jsonResponse({ error: 'Comment text is required.' }, 400, cors);

        const id = `cmt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const isAnon = Boolean(body.isAnonymous);
        const now = Date.now();
        const sanitizedCommentAvatar = isAnon
          ? null
          : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar);

        await env.DB.prepare(
          `INSERT INTO post_comments (
            id, post_id, text, is_anonymous, author_uid, real_author_uid,
            author_name, author_avatar, author_frame, author_equipped_avatar,
            author_photo_url, author_role, author_custom_role, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            postId,
            text,
            isAnon ? 1 : 0,
            isAnon ? null : user.uid,
            user.uid,
            isAnon ? 'Anonymous Student' : String(body.authorName || user.name || 'Student'),
            sanitizedCommentAvatar,
            isAnon ? null : body.authorFrame || null,
            sanitizedCommentAvatar,
            null,
            isAnon ? 'student' : user.role,
            isAnon ? null : user.customRole,
            now
          )
          .run();

        await env.DB.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?')
          .bind(postId)
          .run();

        return jsonResponse(
          {
            success: true,
            comment: {
              id,
              postId,
              text,
              isAnonymous: isAnon,
              authorUid: isAnon ? null : user.uid,
              authorName: isAnon
                ? 'Anonymous Student'
                : String(body.authorName || user.name || 'Student'),
              authorAvatar: sanitizedCommentAvatar,
              authorFrame: isAnon ? null : body.authorFrame || null,
              authorEquippedAvatar: sanitizedCommentAvatar,
              authorPhotoURL: null,
              createdAt: new Date(now).toISOString(),
            },
          },
          201,
          cors
        );
      }

      // DELETE /api/posts/:slugOrId/comments/:commentId
      if (action === 'comments' && subId && req.method === 'DELETE') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const cmt = await env.DB.prepare(
          'SELECT id, real_author_uid FROM post_comments WHERE id = ? AND post_id = ?'
        )
          .bind(subId, postId)
          .first<{ id: string; real_author_uid: string }>();

        if (!cmt) return jsonResponse({ error: 'Comment not found' }, 404, cors);
        if (cmt.real_author_uid !== user.uid && user.role !== 'superadmin') {
          return jsonResponse({ error: 'Forbidden' }, 403, cors);
        }

        await env.DB.prepare('DELETE FROM post_comments WHERE id = ?').bind(subId).run();
        await env.DB.prepare(
          'UPDATE posts SET comment_count = MAX(0, comment_count - 1) WHERE id = ?'
        )
          .bind(postId)
          .run();

        return jsonResponse({ success: true }, 200, cors);
      }

      // POST /api/posts/:slugOrId/report
      if (action === 'report' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Please sign in again' }, 401, cors);

        const body = (await req.json()) as Record<string, any>;
        const reason = String(body.reason || 'other');
        const details = String(body.details || '');
        const id = `rep_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

        await env.DB.prepare(
          'INSERT INTO post_reports (id, post_id, reporter_uid, reason, details, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", ?)'
        )
          .bind(id, postId, user.uid, reason, details, Date.now())
          .run();

        await env.DB.prepare(
          'UPDATE posts SET report_count = report_count + 1, is_hidden = CASE WHEN report_count + 1 >= 3 THEN 1 ELSE is_hidden END WHERE id = ?'
        )
          .bind(postId)
          .run();

        return jsonResponse({ success: true, reportId: id }, 201, cors);
      }

      if (path === '/ads.txt' && (request.method === 'GET' || request.method === 'HEAD')) {
        if ((env as any).ASSETS?.fetch) {
          const assetRes = await (env as any).ASSETS.fetch(request);
          if (assetRes && assetRes.status === 200) {
            const headers = new Headers(assetRes.headers);
            headers.set('Content-Type', 'text/plain; charset=utf-8');
            return new Response(assetRes.body, { status: 200, headers });
          }
        }
        return new Response('google.com, pub-6994939022289204, DIRECT, f08c47fec0942fa0\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      if (
        request.method === 'GET' &&
        !path.startsWith('/api/') &&
        path !== '/ads.txt' &&
        (env as any).ASSETS?.fetch
      ) {
        return (env as any).ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404, cors);
    } catch (err: any) {
      console.error('[CloudflareWorker] Unhandled exception:', err);
      if (err?.message === 'POSTING_BANNED') {
        return jsonResponse(
          { error: 'Your account is restricted from posting in Boardly Commons.' },
          403,
          cors
        );
      }
      return jsonResponse(
        { error: 'Something went wrong. Please try again.' },
        500,
        cors
      );
    }
  },

  async scheduled(
    event: { cron: string; scheduledTime: number },
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    if (!env.DB) return;
    ctx.waitUntil(
      (async () => {
        const nowMs = event.scheduledTime || Date.now();
        const inactiveCutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
        try {
          // 1. Purge abandoned guests past their 7-day grace period AND guests inactive for 30+ days
          const expiredGuests = await env.DB!.prepare(
            `SELECT uid, status, purge_after, last_active_at, is_guest, upgraded_to_uid
             FROM guest_accounts
             WHERE is_guest = 1 AND upgraded_to_uid IS NULL
               AND (
                 (status = 'abandoned' AND purge_after IS NOT NULL AND purge_after <= ?1)
                 OR (last_active_at <= ?2)
               )`
          )
            .bind(nowMs, inactiveCutoffMs)
            .all<{ uid: string }>()
            .catch(() => ({ results: [] as { uid: string }[] }));

          for (const row of expiredGuests.results || []) {
            if (!row?.uid) continue;
            await env.DB!.batch([
              env.DB!.prepare("DELETE FROM user_usernames WHERE uid = ?1 AND account_type = 'guest'").bind(row.uid),
              env.DB!.prepare('DELETE FROM guest_sessions WHERE uid = ?1').bind(row.uid),
              env.DB!.prepare('DELETE FROM guest_accounts WHERE uid = ?1').bind(row.uid),
            ]).catch(() => {});
          }
          if ((expiredGuests.results || []).length > 0) {
            console.log(
              `[CloudflareWorker] Purged ${(expiredGuests.results || []).length} expired/inactive guest accounts.`
            );
          }
        } catch (cleanupErr) {
          console.error('[CloudflareWorker] Guest cleanup error:', cleanupErr);
        }
      })()
    );
  },
};

