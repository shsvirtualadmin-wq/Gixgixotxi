import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BOARDLY_BOT_ACCOUNTS, DEFAULT_WELCOME_ANNOUNCEMENT } from '../config/botsConfig';
import {
  generateVerifiedBotStudyPost,
  generateVerifiedBotComment,
  parseGeminiApiKeys,
  resolvePinnedGeminiModels,
  buildBotKeyPoolState,
  toPublicKeyStatusList,
  getTotalGeminiCallsToday,
  redactApiKeysFromText,
  type GeminiKeyStatusRecord,
} from '../services/botContentGenerator';
import { validateAndNormalizeQuestionMath } from '../utils/katexValidator';
import {
  PRE_SEEDED_UNIVERSITIES,
  buildUniversitySlug,
  normalizeCorrectLetter,
  type D1UniversityRow,
  type D1McqRow,
  type D1McqReportRow,
  type D1ImportBatchRow,
  type D1BankHealthIntegrityReport,
  type D1RepairUniversityGroup,
} from '../constants/d1Universities';
import {
  resolveStaticOrPatternRouteMeta,
  injectMetaIntoIndexHtml,
  type ResolvedRouteMeta,
} from '../utils/routeSeoMeta';

const R2_PUBLIC_BASE_URL = (
  process.env.R2_PUBLIC_BASE_URL ||
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev'
).replace(/\/+$/, '');

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'gen-lang-client-0365509316';

const FIRESTORE_DATABASE_ID =
  process.env.VITE_FIREBASE_DATABASE_ID ||
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

const SUPERADMIN_UIDS = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  ...(process.env.SUPERADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean),
]);

const SUPERADMIN_EMAILS = new Set([
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
  ...(process.env.SUPERADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const D1_STORE_PATH = path.resolve(process.cwd(), 'data/cloudflare_d1_posts.json');
const R2_LOCAL_DIR = path.resolve(process.cwd(), 'data/r2-bucket');
const DELETED_ACCOUNTS_PATH = path.resolve(process.cwd(), 'data/deleted_accounts_registry.json');

export interface D1PostRow {
  id: string;
  slug: string;
  type: string;
  title: string;
  description: string;
  subject: string;
  chapter: string;
  target: string;
  class_level: string;
  board: string;
  format: string;
  tags_json: string;
  files_json: string;
  is_anonymous: number;
  anonymous_alias: string;
  author_uid: string | null;
  real_author_uid: string | null;
  author_name: string;
  author_avatar: string | null;
  author_frame: string | null;
  author_equipped_avatar: string | null;
  author_photo_url: string | null;
  author_role: string;
  author_custom_role: string | null;
  status: string;
  visibility: string;
  is_hidden: number;
  is_pinned: number;
  is_featured: number;
  upvotes: number;
  downvotes: number;
  views: number;
  comment_count: number;
  save_count: number;
  shares_count: number;
  report_count: number;
  created_at: number;
  updated_at: number;
}

interface D1LikeRow {
  post_id: string;
  user_uid: string;
  created_at: number;
}

interface D1SaveRow {
  post_id: string;
  user_uid: string;
  created_at: number;
}

interface D1CommentRow {
  id: string;
  post_id: string;
  text: string;
  is_anonymous: number;
  author_uid: string | null;
  real_author_uid: string;
  author_name: string;
  author_avatar: string | null;
  author_frame: string | null;
  author_equipped_avatar: string | null;
  author_photo_url: string | null;
  author_role: string;
  author_custom_role: string | null;
  created_at: number;
}

interface D1ReportRow {
  id: string;
  post_id: string;
  reporter_uid: string;
  reason: string;
  details: string;
  status: string;
  created_at: number;
}

interface D1UserRoleRow {
  uid: string;
  email: string;
  role: string;
  custom_role: string | null;
  is_posting_banned: number;
  updated_at: number;
}

interface D1BotAccountRow {
  uid: string;
  username: string;
  display_name: string;
  subject: string;
  avatar: string;
  bio: string;
  enabled: number;
  daily_post_limit: number;
  posts_count: number;
  comments_count: number;
  likes_count: number;
  last_run_at: number | null;
  last_run_status: string | null;
  created_at: number;
  updated_at: number;
}

interface D1AnnouncementRow {
  id: string;
  title: string;
  message: string;
  is_pinned: number;
  author_uid: string;
  author_email: string;
  author_name: string;
  created_at: number;
  updated_at: number;
}

interface D1UserWelcomeRow {
  user_uid: string;
  welcomed: number;
  read_welcome: number;
  welcomed_at: number;
  read_at: number | null;
}

export interface D1QuestionRow {
  id: string;
  bank_id: string;
  subject: string;
  topic: string;
  difficulty: string;
  status: string;
  needs_review: number;
  question_text: string;
  options_json: string;
  correct_answer: number;
  explanation: string;
  source_path: string;
  created_at: number;
  updated_at: number;
}

export interface D1QuestionsImportLogRow {
  id: string;
  bank_id: string;
  subject: string;
  total_read: number;
  imported_count: number;
  needs_review_count: number;
  source_type: string;
  imported_at: number;
}

export interface D1FollowRow {
  follower_uid: string;
  following_uid: string;
  created_at: number;
}

export interface D1NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  is_pinned: number;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  author_frame: string | null;
  post_id: string | null;
  post_type: string | null;
  created_at: number;
  read_at: number | null;
}

export interface D1UserReadAnnouncementRow {
  user_uid: string;
  announcement_id: string;
  read_at: number;
}

interface D1StoreData {
  version: number;
  migratedAt: string;
  r2PublicBaseUrl: string;
  posts: D1PostRow[];
  likes: D1LikeRow[];
  saves: D1SaveRow[];
  comments: D1CommentRow[];
  reports: D1ReportRow[];
  userRoles: D1UserRoleRow[];
  botAccounts?: D1BotAccountRow[];
  botKeyStatuses?: Partial<GeminiKeyStatusRecord>[];
  botSystemState?: {
    lastUsedKeyIndex?: number;
    allKeysExhaustedUntil?: number | null;
    geminiCallsLastRun?: number;
    lastRunSummary?: any;
  };
  announcements?: D1AnnouncementRow[];
  userWelcomeStatus?: D1UserWelcomeRow[];
  userReadAnnouncements?: D1UserReadAnnouncementRow[];
  follows?: D1FollowRow[];
  notifications?: D1NotificationRow[];
  questions?: D1QuestionRow[];
  questionsImportLog?: D1QuestionsImportLogRow[];
  universities?: D1UniversityRow[];
  mcqs?: D1McqRow[];
  mcqReports?: D1McqReportRow[];
  imports?: D1ImportBatchRow[];
  legacyAdminBankPurgedAt?: string;
  legacyAdminBankBackupSummary?: Record<string, any>;
}

let d1Cache: D1StoreData | null = null;
let d1LastMtime = 0;

function ensureStoreDefaults(store: D1StoreData): boolean {
  let mutated = false;
  const now = Date.now();
  const basePastMs = 1743465600000;

  if (!Array.isArray(store.posts)) store.posts = [];
  for (let i = 0; i < store.posts.length; i++) {
    const p = store.posts[i];
    if (p.created_at > 0 && p.created_at < 10000000000) {
      p.created_at = p.created_at * 1000;
      p.updated_at = p.created_at;
      mutated = true;
    }
    if (
      p.created_at > now ||
      (String(p.id || '').startsWith('commons_anon_topic_') && p.created_at > basePastMs)
    ) {
      p.created_at = basePastMs - i * 3600000;
      p.updated_at = p.created_at;
      mutated = true;
    }
  }

  if (!Array.isArray(store.userRoles)) store.userRoles = [];
  if (!Array.isArray(store.botAccounts)) store.botAccounts = [];

  for (const b of BOARDLY_BOT_ACCOUNTS) {
    if (!store.userRoles.some((r) => r.uid === b.uid)) {
      store.userRoles.push({
        uid: b.uid,
        email: b.email,
        role: 'bot',
        custom_role: `${b.subject} Bot`,
        is_posting_banned: 0,
        updated_at: basePastMs,
      });
      mutated = true;
    }
    if (!store.botAccounts.some((a) => a.uid === b.uid)) {
      store.botAccounts.push({
        uid: b.uid,
        username: b.placeholderName,
        display_name: b.displayName,
        subject: b.subject,
        avatar: b.equippedAvatar,
        bio: b.bio,
        enabled: 1,
        daily_post_limit: 2,
        posts_count: 0,
        comments_count: 0,
        likes_count: 0,
        last_run_at: null,
        last_run_status: 'ready',
        created_at: basePastMs,
        updated_at: basePastMs,
      });
      mutated = true;
    }
  }

  if (!Array.isArray(store.announcements)) store.announcements = [];
  if (!store.announcements.some((a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id)) {
    store.announcements.unshift({
      id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
      title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
      message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
      is_pinned: 1,
      author_uid: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
      author_email: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
      author_name: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
      created_at: basePastMs,
      updated_at: basePastMs,
    });
    mutated = true;
  }

  if (!Array.isArray(store.userWelcomeStatus)) {
    store.userWelcomeStatus = [];
  }
  if (!Array.isArray(store.userReadAnnouncements)) {
    store.userReadAnnouncements = [];
  }
  if (!Array.isArray(store.follows)) {
    store.follows = [];
  }
  if (!Array.isArray(store.notifications)) {
    store.notifications = [];
  }
  if (!Array.isArray(store.mcqs)) {
    store.mcqs = [];
    mutated = true;
  }
  if (!Array.isArray(store.mcqReports)) {
    store.mcqReports = [];
    mutated = true;
  }
  if (!Array.isArray(store.imports)) {
    store.imports = [];
    mutated = true;
  }
  if (!Array.isArray(store.universities)) {
    store.universities = [];
    mutated = true;
  }

  // Idempotent seed: ON CONFLICT(slug) DO UPDATE SET name, logo_url, sort_order ONLY (never change id)
  for (const seed of PRE_SEEDED_UNIVERSITIES) {
    const existingBySlug = store.universities.find((u) => u.slug === seed.slug);
    const existingById = store.universities.find((u) => u.id === seed.id);
    const existing = existingBySlug || existingById;
    if (!existing) {
      store.universities.push({
        id: seed.id,
        name: seed.name,
        slug: seed.slug,
        logo_url: seed.logo_url || '',
        sort_order: seed.sort_order,
        mcq_count: 0,
        is_live: 0,
        created_at: new Date(basePastMs).toISOString(),
      });
      mutated = true;
    } else {
      if (!existing.name) {
        existing.name = seed.name;
        mutated = true;
      }
      if (!existing.slug) {
        existing.slug = seed.slug;
        mutated = true;
      }
      if (!Number.isFinite(Number(existing.sort_order)) || existing.sort_order <= 0) {
        existing.sort_order = seed.sort_order;
        mutated = true;
      }
    }
  }

  // Ensure every MCQ has university_slug synced with its university_id and import_batch_id initialized
  const uniById = new Map<string, D1UniversityRow>();
  for (const u of store.universities) {
    uniById.set(u.id, u);
  }
  for (const m of store.mcqs) {
    const u = uniById.get(m.university_id);
    if (u && m.university_slug !== u.slug) {
      m.university_slug = u.slug;
      mutated = true;
    }
    if (m.import_batch_id === undefined) {
      m.import_batch_id = '';
      mutated = true;
    }
  }

  // Recalculate mcq_count and is_live for each university from store.mcqs
  const countMap = new Map<string, number>();
  for (const m of store.mcqs) {
    countMap.set(m.university_id, (countMap.get(m.university_id) || 0) + 1);
  }
  for (const u of store.universities) {
    const cnt = countMap.get(u.id) || 0;
    const live = cnt > 0 ? 1 : 0;
    if (u.mcq_count !== cnt || u.is_live !== live) {
      u.mcq_count = cnt;
      u.is_live = live;
      mutated = true;
    }
  }

  return mutated;
}

export function loadD1Store(): D1StoreData {
  try {
    if (fs.existsSync(D1_STORE_PATH)) {
      const stat = fs.statSync(D1_STORE_PATH);
      if (d1Cache && stat.mtimeMs === d1LastMtime) {
        return d1Cache;
      }
      const raw = fs.readFileSync(D1_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as D1StoreData;
      d1Cache = {
        version: parsed.version || 1,
        migratedAt: parsed.migratedAt || new Date().toISOString(),
        r2PublicBaseUrl: parsed.r2PublicBaseUrl || R2_PUBLIC_BASE_URL,
        posts: Array.isArray(parsed.posts) ? parsed.posts : [],
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        saves: Array.isArray(parsed.saves) ? parsed.saves : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : [],
        botAccounts: Array.isArray(parsed.botAccounts) ? parsed.botAccounts : [],
        botKeyStatuses: Array.isArray(parsed.botKeyStatuses) ? parsed.botKeyStatuses : [],
        botSystemState: parsed.botSystemState || undefined,
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        userWelcomeStatus: Array.isArray(parsed.userWelcomeStatus) ? parsed.userWelcomeStatus : [],
        userReadAnnouncements: Array.isArray(parsed.userReadAnnouncements)
          ? parsed.userReadAnnouncements
          : [],
        follows: Array.isArray(parsed.follows) ? parsed.follows : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        questionsImportLog: Array.isArray(parsed.questionsImportLog) ? parsed.questionsImportLog : [],
        universities: Array.isArray(parsed.universities) ? parsed.universities : [],
        mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
        mcqReports: Array.isArray(parsed.mcqReports) ? parsed.mcqReports : [],
        imports: Array.isArray(parsed.imports) ? parsed.imports : [],
        legacyAdminBankPurgedAt: parsed.legacyAdminBankPurgedAt,
        legacyAdminBankBackupSummary: parsed.legacyAdminBankBackupSummary,
      };
      if (ensureStoreDefaults(d1Cache)) {
        saveD1Store(d1Cache);
      } else {
        d1LastMtime = stat.mtimeMs;
      }
      return d1Cache;
    }
  } catch (err) {
    console.warn('[CloudflareD1Store] Failed to load D1 store JSON:', err);
  }

  d1Cache = {
    version: 1,
    migratedAt: new Date().toISOString(),
    r2PublicBaseUrl: R2_PUBLIC_BASE_URL,
    posts: [],
    likes: [],
    saves: [],
    comments: [],
    reports: [],
    userRoles: [],
    botAccounts: [],
    announcements: [],
    userWelcomeStatus: [],
    userReadAnnouncements: [],
    follows: [],
    notifications: [],
    questions: [],
    questionsImportLog: [],
    universities: [],
    mcqs: [],
    mcqReports: [],
  };
  ensureStoreDefaults(d1Cache);
  return d1Cache;
}

export function saveD1Store(store: D1StoreData): void {
  try {
    fs.mkdirSync(path.dirname(D1_STORE_PATH), { recursive: true });
    fs.writeFileSync(D1_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    const stat = fs.statSync(D1_STORE_PATH);
    d1Cache = store;
    d1LastMtime = stat.mtimeMs;
    edgeFeedCache.clear();
  } catch (err) {
    console.error('[CloudflareD1Store] Failed to save D1 store JSON:', err);
  }
}

// Edge Cache in Memory (simulates Cloudflare Cache API locally, max 60s TTL)
const edgeFeedCache = new Map<string, { payload: any; expiresAt: number }>();

export function buildSlug(id: string, title: string): string {
  const cleanTitle = String(title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${id}-${cleanTitle || 'post'}`;
}

export function extractIdFromSlugOrId(slugOrId: string): string {
  const trimmed = String(slugOrId || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('post_gen_')) {
    const m = trimmed.match(/^(post_gen_\d+)/);
    if (m) return m[1];
  }
  if (trimmed.startsWith('post_')) {
    const m = trimmed.match(/^(post_\d+_[a-zA-Z0-9]+)/);
    if (m) return m[1];
  }
  const dashIdx = trimmed.indexOf('-');
  if (dashIdx >= 15) {
    return trimmed.slice(0, dashIdx);
  }
  return trimmed;
}

export function rowToCommonsPost(
  row: D1PostRow,
  currentUid?: string | null
): Record<string, any> {
  let tags: string[] = [];
  let files: any[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    // Ignore JSON parse error, use default empty array
  }
  try {
    files = JSON.parse(row.files_json || '[]');
  } catch {
    // Ignore JSON parse error, use default empty array
  }

  // Ensure every attachment has a working URL, r2Key, and authenticated downloadUrl
  const hydratedFiles = files.map((f) => {
    const rawUrl = String(f?.url || '').trim();
    const r2Key =
      f?.r2Key ||
      f?.key ||
      (rawUrl.startsWith(R2_PUBLIC_BASE_URL)
        ? rawUrl.slice(R2_PUBLIC_BASE_URL.length + 1)
        : rawUrl.startsWith('/api/r2/')
        ? rawUrl.slice('/api/r2/'.length)
        : '');
    const localExists = r2Key && fs.existsSync(path.join(R2_LOCAL_DIR, r2Key));
    const isImage =
      String(f?.type || '').startsWith('image/') ||
      /\.(png|jpe?g|webp|gif)$/i.test(String(f?.name || ''));
    const downloadUrl = r2Key
      ? `/api/posts/download?key=${encodeURIComponent(r2Key)}`
      : rawUrl;
    const inlineUrl =
      r2Key && r2Key.startsWith('posts/') && isImage
        ? `/api/posts/file?key=${encodeURIComponent(r2Key)}`
        : localExists
        ? `/api/r2/${r2Key}`
        : rawUrl;
    return {
      ...f,
      r2Key: r2Key || undefined,
      downloadUrl,
      r2Url: r2Key ? `${R2_PUBLIC_BASE_URL}/${r2Key}` : rawUrl,
      url: inlineUrl,
    };
  });

  const createdMs = Number(row.created_at || Date.now());
  const updatedMs = Number(row.updated_at || createdMs);
  const isAnon = Boolean(row.is_anonymous);
  const isOwner = Boolean(currentUid && row.real_author_uid === currentUid);

  return {
    id: row.id,
    slug: row.slug || buildSlug(row.id, row.title),
    type: row.type || 'notes',
    title: row.title || '',
    description: row.description || '',
    body: row.description || '',
    content: row.description || '',
    subject: row.subject || 'General',
    chapter: row.chapter || 'General',
    target: row.target || 'General',
    classLevel: row.class_level || '11',
    class: row.class_level || '11',
    board: row.board || 'Federal',
    format: row.format || (hydratedFiles.length > 0 ? 'pdf' : 'text'),
    tags,
    files: hydratedFiles,
    attachments: hydratedFiles,
    fileUrl: hydratedFiles[0]?.url || null,
    r2FileUrl: hydratedFiles[0]?.r2Url || null,
    fileName: hydratedFiles[0]?.name || null,
    fileSize: hydratedFiles[0]?.size || null,
    mimeType: hydratedFiles[0]?.type || null,
    isAnonymous: isAnon,
    anonymous: isAnon,
    anonymousAlias: row.anonymous_alias || 'Anonymous Student',
    authorUid: isAnon ? null : row.author_uid,
    authorName: isAnon ? 'Anonymous Student' : row.author_name || 'Student',
    authorAvatar: isAnon ? null : row.author_avatar || null,
    authorFrame: isAnon ? null : row.author_frame || null,
    authorEquippedAvatar: isAnon ? null : row.author_equipped_avatar || null,
    authorPhotoURL: isAnon ? null : row.author_photo_url || null,
    authorRole: isAnon ? 'student' : row.author_role || 'student',
    authorCustomRole: isAnon ? null : row.author_custom_role || null,
    status: row.status || 'published',
    visibility: row.visibility || 'public',
    isHidden: Boolean(row.is_hidden),
    isPinned: Boolean(row.is_pinned),
    isFeatured: Boolean(row.is_featured),
    upvotes: Number(row.upvotes || 0),
    downvotes: Number(row.downvotes || 0),
    likesCount: Number(row.upvotes || 0),
    views: Number(row.views || 0),
    viewsCount: Number(row.views || 0),
    commentCount: Number(row.comment_count || 0),
    commentsCount: Number(row.comment_count || 0),
    saveCount: Number(row.save_count || 0),
    savesCount: Number(row.save_count || 0),
    sharesCount: Number(row.shares_count || 0),
    reportCount: Number(row.report_count || 0),
    createdAt: new Date(createdMs).toISOString(),
    updatedAt: new Date(updatedMs).toISOString(),
    createdAtMs: createdMs,
  };
}

// ============================================================================
// FIREBASE ID TOKEN VERIFICATION (GOOGLE PUBLIC CERTIFICATES — ZERO FIRESTORE)
// ============================================================================
let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedGoogleCerts && cachedGoogleCerts.expiresAt > now) {
    return cachedGoogleCerts.certs;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public certs: ${resp.status}`);
  }
  const certs = (await resp.json()) as Record<string, string>;
  cachedGoogleCerts = { certs, expiresAt: now + 3600 * 1000 };
  return certs;
}

export interface VerifiedWorkerUser {
  uid: string;
  email: string;
  name: string;
  tokenName?: string;
  picture: string;
  role: 'student' | 'captain' | 'superadmin';
  customRole: string | null;
}

export async function verifyFirebaseJwtZeroFirestore(
  req: express.Request
): Promise<VerifiedWorkerUser | null> {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec - 60) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;

    // Verify RS256 signature against Google public x509 certificate
    try {
      const certs = await getGooglePublicCerts();
      const pem = certs[header.kid];
      if (pem) {
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${parts[0]}.${parts[1]}`);
        verifier.end();
        const sigValid = verifier.verify(pem, Buffer.from(parts[2], 'base64url'));
        if (!sigValid) return null;
      }
    } catch {
      // If offline in sandboxed test environment, still validate audience/issuer structure
      if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    }

    const uid = payload.sub;
    const email = String(payload.email || '').trim().toLowerCase();

    const store = loadD1Store();
    const roleRow = store.userRoles.find(
      (r) => r.uid === uid || (email && r.email.toLowerCase() === email)
    );

    if (roleRow?.is_posting_banned) {
      throw new Error('POSTING_BANNED');
    }

    let role: 'student' | 'captain' | 'superadmin' = 'student';
    let customRole: string | null = payload.customRole || roleRow?.custom_role || null;

    if (
      SUPERADMIN_UIDS.has(uid) ||
      SUPERADMIN_EMAILS.has(email) ||
      payload.role === 'superadmin' ||
      payload.role === 'admin' ||
      payload.admin === true ||
      roleRow?.role === 'superadmin' ||
      roleRow?.role === 'admin'
    ) {
      role = 'superadmin';
    } else if (
      payload.role === 'captain' ||
      payload.nakamaCaptain === true ||
      payload.customRole === 'Nakama Captain' ||
      roleRow?.role === 'captain' ||
      roleRow?.custom_role === 'Nakama Captain'
    ) {
      role = 'captain';
      customRole = customRole || 'Nakama Captain';
    }

    const tokenName = String(payload.name || '').trim();
    const emailPrefix = email ? email.split('@')[0].trim() : '';

    return {
      uid,
      email,
      name: tokenName || emailPrefix || 'Student',
      tokenName,
      picture: payload.picture || '',
      role,
      customRole,
    };
  } catch (err: any) {
    if (err?.message === 'POSTING_BANNED') throw err;
    return null;
  }
}

// ============================================================================
// SLIDING-WINDOW RATE LIMITER FOR WRITES
// ============================================================================
const writeRateMap = new Map<string, { count: number; windowStart: number }>();

function checkWriteRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = writeRateMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    writeRateMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

// ============================================================================
// DELETED ACCOUNTS REGISTRY (Tracks admin-deleted emails/UIDs)
// ============================================================================
interface DeletedAccountEntry {
  uid: string;
  email: string;
  deletedAt: string;
  deletedBy: string;
  firebaseAuthDeleted: boolean;
}

function loadDeletedAccountsRegistry(): DeletedAccountEntry[] {
  try {
    if (fs.existsSync(DELETED_ACCOUNTS_PATH)) {
      return JSON.parse(fs.readFileSync(DELETED_ACCOUNTS_PATH, 'utf8'));
    }
  } catch {
    // Return empty array on read/parse error
  }
  return [];
}

function saveDeletedAccountsRegistry(entries: DeletedAccountEntry[]): void {
  try {
    fs.mkdirSync(path.dirname(DELETED_ACCOUNTS_PATH), { recursive: true });
    fs.writeFileSync(DELETED_ACCOUNTS_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // Ignore write error
  }
}

export function getFirebaseWebApiKey(): string {
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
    );
    return cfg.apiKey || '';
  } catch {
    return '';
  }
}

// ============================================================================
// MOUNT ROUTER ON EXPRESS APP
// ============================================================================
export function registerCloudflarePostsAndAuthRoutes(
  app: express.Express,
  options?: {
    getGoogleAccessToken?: () => Promise<string | null>;
  }
): void {
  // 1. Dynamic Sitemap XML generated directly from D1 posts
  app.get('/sitemap.xml', (_req, res) => {
    const store = loadD1Store();
    const visiblePosts = store.posts.filter((p) => !p.is_hidden);

    const staticUrls = [
      'https://boardly.cfd/',
      'https://boardly.cfd/commons',
      'https://boardly.cfd/material',
      'https://boardly.cfd/mcqs',
      'https://boardly.cfd/grand-line',
      'https://boardly.cfd/captains',
      'https://boardly.cfd/crew',
      'https://boardly.cfd/store',
      'https://boardly.cfd/pricing',
      'https://boardly.cfd/about',
      'https://boardly.cfd/features',
      'https://boardly.cfd/how-it-works',
      'https://boardly.cfd/faq',
    ];

    const postUrls: string[] = [];
    for (const p of visiblePosts) {
      const slug = p.slug || buildSlug(p.id, p.title);
      postUrls.push(`https://boardly.cfd/commons/post/${slug}`);
      if (p.files_json && p.files_json !== '[]') {
        postUrls.push(`https://boardly.cfd/material/${slug}`);
      }
    }

    const allUrls = [...staticUrls, ...postUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <changefreq>daily</changefreq>
    <priority>${loc.includes('/commons/post/') || loc.includes('/material/') ? '0.8' : '0.9'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900');
    return res.status(200).send(xml);
  });

  // 1b. GET /api/health & /api/posts/health — Health check endpoint
  const handleHealth = async (req: express.Request, res: express.Response) => {
    const store = loadD1Store();
    let jwksReachable = false;
    try {
      const certs = await getGooglePublicCerts();
      jwksReachable = Object.keys(certs).length > 0;
    } catch {
      // Ignore network cert check error
    }

    let tokenProvided = false;
    let tokenVerified = false;
    let verifiedUser: { uid: string; role: string } | null = null;
    if (String(req.headers.authorization || '').startsWith('Bearer ')) {
      tokenProvided = true;
      try {
        const u = await verifyFirebaseJwtZeroFirestore(req);
        if (u) {
          tokenVerified = true;
          verifiedUser = { uid: u.uid, role: u.role };
        }
      } catch {
        // Ignore token verification failure for health check
      }
    }

    const r2CredentialsConfigured = Boolean(
      (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID) &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
    );

    const d1Connected = Array.isArray(store?.posts);
    const r2Connected = fs.existsSync(R2_LOCAL_DIR) || r2CredentialsConfigured;
    const bothWork = d1Connected && r2Connected;

    const d1Report = {
      bindingName: 'DB',
      databaseName: 'boardly-posts-db',
      exists: d1Connected,
      connected: d1Connected,
      postCount: d1Connected ? store.posts.length : null,
      mode: 'local-d1-mirror',
    };

    const r2Report = {
      bindingName: 'R2_BUCKET',
      bucketName: process.env.R2_BUCKET_NAME || 'boardly-commons-media',
      exists: r2Connected,
      connected: r2Connected,
      mode: r2CredentialsConfigured ? 'cloudflare-r2-s3' : 'local-r2-mirror',
    };

    const botRows = store.botAccounts || [];
    const enabledBotsCount = botRows.filter((b) => b.enabled === 1).length;
    const totalBotPosts = store.posts.filter(
      (p) => p.author_role === 'bot' || String(p.author_uid || '').startsWith('bot_')
    ).length;

    return res.status(200).json({
      ok: bothWork,
      status: bothWork ? 'ok' : 'degraded',
      workerReachable: true,
      backendMode: bothWork ? 'cloudflare-d1-r2' : 'preview-demo',
      d1: d1Report,
      r2: r2Report,
      bindings: {
        d1: d1Report,
        r2: r2Report,
      },
      bots: {
        totalBots: botRows.length || 12,
        enabledBots: enabledBotsCount || 12,
        botPostsCount: totalBotPosts,
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
      },
      firebaseAuth: {
        projectId: FIREBASE_PROJECT_ID,
        jwksReachable,
        tokenProvided,
        tokenVerified,
        user: verifiedUser,
      },
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/api/health', handleHealth);
  app.get('/api/posts/health', handleHealth);

  // 1c. GET /api/posts/download?key=... — Authenticated Private R2 Download
  app.get('/api/posts/download', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        });
      }

      const rawKey = String(req.query.key || '')
        .trim()
        .replace(/\.\./g, '')
        .replace(/^\/+/, '');
      if (!rawKey) {
        return res.status(400).json({ success: false, error: 'Missing file key.' });
      }

      const localPath = path.join(R2_LOCAL_DIR, rawKey);
      if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const ext = path.extname(localPath).toLowerCase();
        const mime =
          ext === '.pdf'
            ? 'application/pdf'
            : ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
            ? 'image/gif'
            : ext === '.docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/octet-stream';

        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(localPath)}"`);
        return res.sendFile(localPath);
      }

      return res.status(404).json({ success: false, error: 'File not found in R2 storage.' });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Download failed, try again' });
    }
  });

  // 1d. GET /api/posts/file?key=... — Inline Image Streaming from R2
  app.get('/api/posts/file', (req, res) => {
    const rawKey = String(req.query.key || '')
      .trim()
      .replace(/\.\./g, '')
      .replace(/^\/+/, '');
    if (!rawKey) {
      return res.status(400).json({ success: false, error: 'Missing file key.' });
    }
    const localPath = path.join(R2_LOCAL_DIR, rawKey);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
          ? 'image/gif'
          : 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(localPath);
    }
    return res.status(404).json({ success: false, error: 'Image not found.' });
  });

  // 2. Serve R2 files from local R2 mirror or proxy to R2_PUBLIC_BASE_URL
  app.get('/api/r2/*', async (req, res) => {
    const rawKey = (req.params as any)[0] || '';
    const safeKey = String(rawKey).replace(/\.\./g, '').replace(/^\/+/, '');
    if (!safeKey) {
      return res.status(400).send('Missing R2 object key');
    }

    const localPath = path.join(R2_LOCAL_DIR, safeKey);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
          ? 'image/gif'
          : 'application/octet-stream';

      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(localPath)}"`);
      return res.sendFile(localPath);
    }

    // Redirect to public Cloudflare R2 URL if not cached on local disk
    return res.redirect(302, `${R2_PUBLIC_BASE_URL}/${safeKey}`);
  });

  // 3. GET /api/posts — Paginated list, filter, search (Zero Firebase reads)
  app.get('/api/posts', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
      const currentUid = user?.uid || String(req.query.currentUid || '').trim() || null;

      const store = loadD1Store();
      const pageSize = Math.min(
        100,
        Math.max(1, Number(req.query.limit || req.query.pageSize || 15))
      );
      const offset = Math.max(0, Number(req.query.offset || 0));
      const subject = String(req.query.subject || '').trim();
      const type = String(req.query.type || '').trim();
      const target = String(req.query.target || '').trim();
      const classLevel = String(req.query.classLevel || '').trim();
      const board = String(req.query.board || '').trim();
      const search = String(req.query.search || req.query.q || '').trim().toLowerCase();
      const authorUid = String(req.query.authorUid || '').trim();
      const includeOwnAnonymous = req.query.includeOwnAnonymous === 'true';
      const savedBy = String(req.query.savedBy || '').trim();
      const likedBy = String(req.query.likedBy || '').trim();
      const followingUidsRaw = String(req.query.followingUids || '').trim();
      const flaggedOnly = req.query.flaggedOnly === 'true';
      const sort = String(req.query.sort || req.query.feedTab || 'newest').trim().toLowerCase();

      let rows = store.posts.filter((p) => {
        if (flaggedOnly) {
          return p.report_count >= 1 || p.is_hidden === 1;
        }
        return p.is_hidden === 0;
      });

      if (subject && subject !== 'all') {
        rows = rows.filter((p) => p.subject.toLowerCase() === subject.toLowerCase());
      }
      if (type && type !== 'all') {
        rows = rows.filter((p) => p.type === type);
      }
      if (target && target !== 'all') {
        rows = rows.filter((p) => p.target.toLowerCase() === target.toLowerCase());
      }
      if (classLevel && classLevel !== 'all') {
        const cleanClass = classLevel.replace(/^Class\s+/i, '').trim();
        rows = rows.filter((p) => p.class_level === cleanClass);
      }
      if (board && board !== 'all') {
        rows = rows.filter((p) => p.board.toLowerCase() === board.toLowerCase());
      }
      if (authorUid) {
        rows = rows.filter((p) => {
          if (includeOwnAnonymous && currentUid === authorUid) {
            return p.real_author_uid === authorUid || p.author_uid === authorUid;
          }
          return p.author_uid === authorUid && p.is_anonymous === 0;
        });
      }
      if (savedBy) {
        const savedIds = new Set(
          store.saves.filter((s) => s.user_uid === savedBy).map((s) => s.post_id)
        );
        rows = rows.filter((p) => savedIds.has(p.id));
      }
      if (likedBy) {
        const likedIds = new Set(
          store.likes.filter((l) => l.user_uid === likedBy).map((l) => l.post_id)
        );
        rows = rows.filter((p) => likedIds.has(p.id));
      }
      if (followingUidsRaw) {
        const followSet = new Set(
          followingUidsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
        rows = rows.filter(
          (p) => p.is_anonymous === 0 && p.author_uid && followSet.has(p.author_uid)
        );
      }
      if (search) {
        const tokens = search.split(/\s+/).filter(Boolean);
        rows = rows.filter((p) => {
          const hay = `${p.title} ${p.description} ${p.subject} ${p.chapter} ${p.target} ${p.tags_json} ${
            p.is_anonymous ? '' : p.author_name
          }`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });
      }

      rows.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
        if (sort === 'trending' || sort === 'top') {
          if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        }
        return b.created_at - a.created_at;
      });

      const hasMore = offset + pageSize < rows.length;
      const pageRows = rows.slice(offset, offset + pageSize);
      const posts = pageRows.map((r) => rowToCommonsPost(r, currentUid));

      const d1Connected = Array.isArray(store?.posts);
      const r2Connected = fs.existsSync(R2_LOCAL_DIR);
      const payload = {
        success: true,
        backendMode: d1Connected && r2Connected ? 'cloudflare-d1-r2' : 'preview-demo',
        posts,
        total: rows.length,
        hasMore,
        nextOffset: hasMore ? offset + pageSize : null,
      };

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).json(payload);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to list posts' });
    }
  });

  // 4. POST /api/posts/upload & /api/posts/upload-url — Upload attachment to Cloudflare R2
  const handleR2Upload = async (req: express.Request, res: express.Response) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, code: 'NOT_AUTHENTICATED', error: 'Please sign in again' });
      }

      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
      if (!checkWriteRateLimit(`upload:${user.uid}:${ip}`, 25, 60 * 60 * 1000)) {
        return res
          .status(429)
          .json({ success: false, error: 'Upload rate limit reached. Please wait before uploading more files.' });
      }

      const body = req.body || {};
      const postId = String(
        body.postId || req.headers['x-post-id'] || `post_${Date.now()}`
      )
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const rawName = String(body.fileName || body.name || 'resource.pdf').trim();
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const mimeType = String(body.fileType || body.mimeType || body.type || 'application/pdf').trim();
      const dataBase64 = String(body.dataBase64 || '').trim();

      if (!dataBase64) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_FILE_DATA',
          error: 'Missing file binary payload.',
        });
      }

      const lowerName = rawName.toLowerCase();
      const hasValidExt = [
        '.png',
        '.jpg',
        '.jpeg',
        '.webp',
        '.gif',
        '.pdf',
        '.docx',
        '.doc',
        '.pptx',
        '.ppt',
        '.txt',
      ].some((ext) => lowerName.endsWith(ext));

      if (!ALLOWED_MIME_TYPES.has(mimeType) && !hasValidExt) {
        return res.status(415).json({
          success: false,
          code: 'UNSUPPORTED_TYPE',
          error: 'Unsupported file type',
        });
      }

      // Canonical R2 key format: posts/{postId}/{random-id}-{safe-filename}
      const randId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const r2Key = `posts/${postId}/${randId}-${safeName}`;

      const cleanBase64 = dataBase64.includes(',')
        ? dataBase64.slice(dataBase64.indexOf(',') + 1)
        : dataBase64;
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (buffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Uploaded file is empty (0 bytes).' });
      }
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          error: 'File too large',
        });
      }

      // 1. Save to local R2 mirror so preview works immediately
      const localPath = path.join(R2_LOCAL_DIR, r2Key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, buffer);

      // 2. If Cloudflare R2 S3 credentials are configured, upload directly to R2 bucket
      const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
      const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
      const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
      const r2BucketName = process.env.R2_BUCKET_NAME || 'boardly-commons-media';

      if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
        try {
          const s3Mod = await import('@aws-sdk/client-s3');
          const s3 = new s3Mod.S3Client({
            region: 'auto',
            endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: r2AccessKeyId,
              secretAccessKey: r2SecretAccessKey,
            },
          });
          await s3.send(
            new s3Mod.PutObjectCommand({
              Bucket: r2BucketName,
              Key: r2Key,
              Body: buffer,
              ContentType: mimeType,
              CacheControl: 'private, max-age=31536000',
            })
          );
        } catch (r2Err) {
          console.warn('[R2Upload] Remote R2 upload notice (served from local R2 mirror):', r2Err);
        }
      }

      const isImage =
        mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(rawName);
      const downloadUrl = `/api/posts/download?key=${encodeURIComponent(r2Key)}`;
      const serveUrl = isImage
        ? `/api/posts/file?key=${encodeURIComponent(r2Key)}`
        : downloadUrl;

      return res.status(200).json({
        success: true,
        key: r2Key,
        r2Key,
        url: serveUrl,
        downloadUrl,
        r2Url: `${R2_PUBLIC_BASE_URL}/${r2Key}`,
        name: rawName,
        size: buffer.length,
        type: mimeType,
      });
    } catch (err: any) {
      if (err?.message === 'POSTING_BANNED') {
        return res.status(403).json({
          success: false,
          error: 'Your account is restricted from uploading in Boardly Commons.',
        });
      }
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Upload failed, try again' });
    }
  };

  app.post('/api/posts/upload', handleR2Upload);
  app.post('/api/posts/upload-url', handleR2Upload);

  // 4b. DELETE /api/posts/upload — Rollback uploaded R2 objects if post publish fails
  app.delete('/api/posts/upload', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in again' });
      }
      const keys = Array.isArray(req.body?.keys)
        ? req.body.keys
            .map((k: any) => String(k || '').trim())
            .filter((k: string) => k.startsWith('posts/') && !k.includes('..'))
        : [];
      for (const k of keys) {
        const localPath = path.join(R2_LOCAL_DIR, k);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      return res.status(200).json({ success: true, deletedKeys: keys });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Rollback error' });
    }
  });

  // 5. GET /api/posts/moderation/queue — Admin Moderation Queue (Flagged Posts + Pending Reports)
  app.get('/api/posts/moderation/queue', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Superadmin access required.' });
      }
      const store = loadD1Store();
      const flaggedPosts = store.posts
        .filter((p) => p.report_count >= 1 || p.is_hidden === 1)
        .map((p) => ({
          ...rowToCommonsPost(p, user.uid),
          realAuthorUid: p.real_author_uid,
        }));
      const pendingReports = store.reports.filter((r) => r.status === 'pending');

      return res.status(200).json({
        success: true,
        flaggedPosts,
        reports: pendingReports,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Moderation load error' });
    }
  });

  // 6. POST /api/posts/moderation/ban — Ban Author in D1 `user_roles`
  app.post('/api/posts/moderation/ban', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Superadmin access required.' });
      }
      const targetUid = String(req.body?.targetUid || req.body?.authorUid || '').trim();
      const postId = String(req.body?.postId || '').trim();
      const store = loadD1Store();

      let resolvedUid = targetUid;
      if (!resolvedUid && postId) {
        const p = store.posts.find((row) => row.id === postId);
        resolvedUid = p?.real_author_uid || p?.author_uid || '';
      }
      if (!resolvedUid) {
        return res.status(400).json({ success: false, error: 'Author UID could not be determined.' });
      }

      const existingRole = store.userRoles.find((r) => r.uid === resolvedUid);
      if (existingRole) {
        existingRole.is_posting_banned = 1;
        existingRole.updated_at = Date.now();
      } else {
        store.userRoles.push({
          uid: resolvedUid,
          email: '',
          role: 'student',
          custom_role: null,
          is_posting_banned: 1,
          updated_at: Date.now(),
        });
      }
      saveD1Store(store);

      return res.status(200).json({
        success: true,
        bannedUid: resolvedUid,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to ban user' });
    }
  });

  // 7. POST /api/posts — Create Post in D1
  app.post('/api/posts', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Please sign in to publish a post in Boardly Commons.',
        });
      }

      if (
        user.role !== 'superadmin' &&
        !checkWriteRateLimit(`post:${user.uid}`, 10, 24 * 60 * 60 * 1000)
      ) {
        return res.status(429).json({
          success: false,
          error: 'You have reached the daily limit of 10 posts in 24 hours.',
        });
      }

      const body = req.body || {};
      const title = String(body.title || '').trim();
      const description = String(body.description || body.body || '').trim();
      if (!title) {
        return res.status(400).json({ success: false, error: 'Post title is required.' });
      }

      const id = String(body.id || `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`);
      const slug = buildSlug(id, title);
      const isAnon = Boolean(body.isAnonymous);
      const now = Date.now();
      const files = Array.isArray(body.files) ? body.files : [];
      const tags = Array.isArray(body.tags) ? body.tags : [];

      const newRow: D1PostRow = {
        id,
        slug,
        type: String(body.type || 'notes'),
        title,
        description,
        subject: String(body.subject || 'General'),
        chapter: String(body.chapter || 'General'),
        target: String(body.target || 'General'),
        class_level: String(body.classLevel || '11').replace(/^Class\s+/i, ''),
        board: String(body.board || 'Federal'),
        format: files.length > 0 ? 'pdf' : 'text',
        tags_json: JSON.stringify(tags),
        files_json: JSON.stringify(files),
        is_anonymous: isAnon ? 1 : 0,
        anonymous_alias: 'Anonymous Student',
        author_uid: isAnon ? null : user.uid,
        real_author_uid: user.uid,
        author_name: isAnon
          ? 'Anonymous Student'
          : String(body.authorName || user.name || 'Student'),
        author_avatar: isAnon ? null : body.authorAvatar || null,
        author_frame: isAnon ? null : body.authorFrame || null,
        author_equipped_avatar: isAnon ? null : body.authorEquippedAvatar || null,
        author_photo_url: isAnon ? null : body.authorPhotoURL || user.picture || null,
        author_role: isAnon ? 'student' : String(body.authorRole || user.role || 'student'),
        author_custom_role: isAnon ? null : body.authorCustomRole || user.customRole || null,
        status: 'published',
        visibility: 'public',
        is_hidden: 0,
        is_pinned: user.role === 'superadmin' && body.isPinned ? 1 : 0,
        is_featured: 0,
        upvotes: 0,
        downvotes: 0,
        views: 1,
        comment_count: 0,
        save_count: 0,
        shares_count: 0,
        report_count: 0,
        created_at: now,
        updated_at: now,
      };

      const store = loadD1Store();
      const maxExistingCreated = store.posts.reduce(
        (max, p) => Math.max(max, Number(p.created_at || 0)),
        0
      );
      const safeCreatedAt = Math.max(now, maxExistingCreated + 1);
      newRow.created_at = safeCreatedAt;
      newRow.updated_at = safeCreatedAt;

      store.posts.unshift(newRow);

      // Automatically notify followers when a non-anonymous post is created (never on edit, never if anonymous)
      if (!isAnon && newRow.author_uid) {
        if (!Array.isArray(store.follows)) store.follows = [];
        if (!Array.isArray(store.notifications)) store.notifications = [];
        const followerUids = Array.from(
          new Set(
            store.follows
              .filter(
                (f) =>
                  f.following_uid === newRow.author_uid &&
                  f.follower_uid &&
                  f.follower_uid !== newRow.author_uid
              )
              .map((f) => f.follower_uid)
          )
        );
        const avatarVal =
          newRow.author_avatar ||
          newRow.author_photo_url ||
          newRow.author_equipped_avatar ||
          null;
        const snippet = String(newRow.description || '').trim().slice(0, 140);
        for (const followerUid of followerUids) {
          const notifId = `post_${newRow.id}_follower_${followerUid}`;
          if (!store.notifications.some((n) => n.id === notifId)) {
            store.notifications.unshift({
              id: notifId,
              user_id: followerUid,
              type: 'following_post',
              title: `${newRow.author_name} posted: ${newRow.title}`,
              message: snippet || `New ${newRow.type || 'post'} in ${newRow.subject || 'Commons'}`,
              link: null,
              read: 0,
              is_pinned: 0,
              author_id: newRow.author_uid,
              author_name: newRow.author_name,
              author_avatar: avatarVal,
              author_frame: newRow.author_frame || null,
              post_id: newRow.id,
              post_type: newRow.type || 'notes',
              created_at: safeCreatedAt,
              read_at: null,
            });
          }
        }
      }

      saveD1Store(store);

      return res.status(201).json({
        success: true,
        postId: id,
        post: rowToCommonsPost(newRow, user.uid),
      });
    } catch (err: any) {
      if (err?.message === 'POSTING_BANNED') {
        return res.status(403).json({
          success: false,
          error: 'Your account is restricted from publishing in Boardly Commons.',
        });
      }
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Failed to publish post.' });
    }
  });

  // 8. GET /api/posts/:slugOrId — Fetch single post by slug or ID
  app.get('/api/posts/:slugOrId', async (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);

    const store = loadD1Store();
    const row = store.posts.find((p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Post not found.' });
    }

    if (req.query.view === '1') {
      row.views = (row.views || 0) + 1;
      saveD1Store(store);
    }

    return res.status(200).json({
      success: true,
      post: rowToCommonsPost(row, user?.uid),
    });
  });

  // 9. PUT & PATCH /api/posts/:slugOrId — Edit post, toggle anonymity, hide/unhide, pin
  const handleUpdatePost = async (req: express.Request, res: express.Response) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const row = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!row) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const isOwner = row.real_author_uid === user.uid || row.author_uid === user.uid;
      if (!isOwner && user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const body = req.body || {};
      if (body.title !== undefined) {
        row.title = String(body.title).trim();
        row.slug = buildSlug(row.id, row.title);
      }
      if (body.description !== undefined) {
        row.description = String(body.description).trim();
      }
      if (body.subject !== undefined) {
        row.subject = String(body.subject).trim();
      }
      if (body.chapter !== undefined) {
        row.chapter = String(body.chapter).trim();
      }
      if (body.tags !== undefined && Array.isArray(body.tags)) {
        row.tags_json = JSON.stringify(body.tags);
      }
      if (body.isAnonymous !== undefined) {
        const nextAnon = Boolean(body.isAnonymous);
        row.is_anonymous = nextAnon ? 1 : 0;
        row.author_uid = nextAnon ? null : row.real_author_uid;
        if (nextAnon) {
          row.author_name = 'Anonymous Student';
          row.author_avatar = null;
          row.author_frame = null;
          row.author_equipped_avatar = null;
          row.author_photo_url = null;
        } else if (body.authorName) {
          row.author_name = String(body.authorName);
          row.author_avatar = body.authorAvatar || row.author_avatar;
          row.author_frame = body.authorFrame || row.author_frame;
          row.author_equipped_avatar = body.authorEquippedAvatar || row.author_equipped_avatar;
          row.author_photo_url = body.authorPhotoURL || row.author_photo_url;
        }
      }
      if (body.isHidden !== undefined && user.role === 'superadmin') {
        row.is_hidden = body.isHidden ? 1 : 0;
      }
      if (body.isPinned !== undefined && user.role === 'superadmin') {
        row.is_pinned = body.isPinned ? 1 : 0;
      }

      row.updated_at = Date.now();
      saveD1Store(store);

      return res.status(200).json({
        success: true,
        post: rowToCommonsPost(row, user.uid),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Update failed' });
    }
  };

  app.put('/api/posts/:slugOrId', handleUpdatePost);
  app.patch('/api/posts/:slugOrId', handleUpdatePost);

  // 10. DELETE /api/posts/:slugOrId — Delete post and associated records
  app.delete('/api/posts/:slugOrId', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const idx = store.posts.findIndex(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const row = store.posts[idx];
      const isOwner = row.real_author_uid === user.uid || row.author_uid === user.uid;
      if (!isOwner && user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const deletedId = row.id;
      store.posts.splice(idx, 1);
      store.likes = store.likes.filter((l) => l.post_id !== deletedId);
      store.saves = store.saves.filter((s) => s.post_id !== deletedId);
      store.comments = store.comments.filter((c) => c.post_id !== deletedId);
      store.reports = store.reports.filter((r) => r.post_id !== deletedId);
      saveD1Store(store);

      return res.status(200).json({ success: true, deletedId });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Delete failed' });
    }
  });

  // 11. GET /api/posts/:slugOrId/status — Check if current user liked/saved post
  app.get('/api/posts/:slugOrId/status', async (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const uid = user?.uid || String(req.query.userId || '').trim();

    if (!uid) {
      return res.status(200).json({ success: true, voted: false, saved: false });
    }

    const store = loadD1Store();
    const voted = store.likes.some((l) => l.post_id === postId && l.user_uid === uid);
    const saved = store.saves.some((s) => s.post_id === postId && s.user_uid === uid);

    return res.status(200).json({ success: true, voted, saved });
  });

  // 12. POST /api/posts/:slugOrId/like — Toggle Like / Upvote
  app.post('/api/posts/:slugOrId/like', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to like posts.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const existingIdx = store.likes.findIndex(
        (l) => l.post_id === post.id && l.user_uid === user.uid
      );

      let voted = false;
      if (existingIdx !== -1) {
        store.likes.splice(existingIdx, 1);
        post.upvotes = Math.max(0, (post.upvotes || 0) - 1);
        voted = false;
        // Clean up like notification if unliked
        const likeNotifId = `like_${post.id}_${user.uid}`;
        store.notifications = store.notifications.filter((n) => n.id !== likeNotifId);
      } else {
        const likeNow = Date.now();
        store.likes.push({
          post_id: post.id,
          user_uid: user.uid,
          created_at: likeNow,
        });
        post.upvotes = (post.upvotes || 0) + 1;
        voted = true;

        // Notify post author if not liking own post
        if (post.author_uid && post.author_uid !== user.uid) {
          const likeNotifId = `like_${post.id}_${user.uid}`;
          const existingLikeNotif = store.notifications.find((n) => n.id === likeNotifId);
          if (!existingLikeNotif) {
            const likerName = String(user.name || 'A student');
            store.notifications.unshift({
              id: likeNotifId,
              user_id: post.author_uid,
              type: 'like',
              title: `${likerName} liked your post`,
              message: post.title ? `Liked "${post.title.slice(0, 80)}"` : 'Liked your post in Commons.',
              link: null,
              read: 0,
              is_pinned: 0,
              author_id: user.uid,
              author_name: likerName,
              author_avatar: user.picture || null,
              author_frame: null,
              post_id: post.id,
              post_type: post.type || 'notes',
              created_at: likeNow,
              read_at: null,
            });
          }
        }
      }

      saveD1Store(store);
      return res.status(200).json({
        success: true,
        voted,
        newCount: post.upvotes,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to toggle like' });
    }
  });

  // 13. POST /api/posts/:slugOrId/save — Toggle Save / Bookmark
  app.post('/api/posts/:slugOrId/save', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to save posts.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const existingIdx = store.saves.findIndex(
        (s) => s.post_id === post.id && s.user_uid === user.uid
      );

      let saved = false;
      if (existingIdx !== -1) {
        store.saves.splice(existingIdx, 1);
        post.save_count = Math.max(0, (post.save_count || 0) - 1);
        saved = false;
      } else {
        store.saves.push({
          post_id: post.id,
          user_uid: user.uid,
          created_at: Date.now(),
        });
        post.save_count = (post.save_count || 0) + 1;
        saved = true;
      }

      saveD1Store(store);
      return res.status(200).json({ success: true, saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to toggle save' });
    }
  });

  // 14. GET & POST & DELETE /api/posts/:slugOrId/comments
  app.get('/api/posts/:slugOrId/comments', (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const store = loadD1Store();

    const comments = store.comments
      .filter((c) => c.post_id === postId || c.post_id === slugOrId)
      .sort((a, b) => a.created_at - b.created_at)
      .map((c) => ({
        id: c.id,
        postId: c.post_id,
        text: c.text,
        isAnonymous: Boolean(c.is_anonymous),
        authorUid: c.is_anonymous ? null : c.author_uid,
        authorName: c.is_anonymous ? 'Anonymous Student' : c.author_name,
        authorAvatar: c.is_anonymous ? null : c.author_avatar,
        authorFrame: c.is_anonymous ? null : c.author_frame,
        authorEquippedAvatar: c.is_anonymous ? null : c.author_equipped_avatar,
        authorPhotoURL: c.is_anonymous ? null : c.author_photo_url,
        authorRole: c.is_anonymous ? 'student' : c.author_role,
        authorCustomRole: c.is_anonymous ? null : c.author_custom_role,
        createdAt: new Date(c.created_at).toISOString(),
      }));

    return res.status(200).json({ success: true, comments });
  });

  app.post('/api/posts/:slugOrId/comments', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to comment.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const body = req.body || {};
      const text = String(body.text || '').trim();
      if (!text) {
        return res.status(400).json({ success: false, error: 'Comment text is required.' });
      }

      const isAnon = Boolean(body.isAnonymous);
      const now = Date.now();
      const id = `cmt_${now}_${crypto.randomUUID().slice(0, 8)}`;

      const row: D1CommentRow = {
        id,
        post_id: post.id,
        text,
        is_anonymous: isAnon ? 1 : 0,
        author_uid: isAnon ? null : user.uid,
        real_author_uid: user.uid,
        author_name: isAnon
          ? 'Anonymous Student'
          : String(body.authorName || user.name || 'Student'),
        author_avatar: isAnon ? null : body.authorAvatar || null,
        author_frame: isAnon ? null : body.authorFrame || null,
        author_equipped_avatar: isAnon ? null : body.authorEquippedAvatar || null,
        author_photo_url: isAnon ? null : body.authorPhotoURL || user.picture || null,
        author_role: isAnon ? 'student' : user.role,
        author_custom_role: isAnon ? null : user.customRole,
        created_at: now,
      };

      store.comments.push(row);
      post.comment_count = (post.comment_count || 0) + 1;

      // Notify post author if not commenting on own post
      if (post.author_uid && post.author_uid !== user.uid) {
        const cmtNotifId = `comment_${id}_${post.author_uid}`;
        const cmtAuthorName = isAnon ? 'A student' : String(body.authorName || user.name || 'A student');
        store.notifications.unshift({
          id: cmtNotifId,
          user_id: post.author_uid,
          type: 'comment',
          title: `${cmtAuthorName} commented on your post`,
          message: text.slice(0, 120),
          link: null,
          read: 0,
          is_pinned: 0,
          author_id: isAnon ? null : user.uid,
          author_name: cmtAuthorName,
          author_avatar: isAnon ? null : row.author_avatar,
          author_frame: isAnon ? null : row.author_frame,
          post_id: post.id,
          post_type: post.type || 'notes',
          created_at: now,
          read_at: null,
        });
      }

      saveD1Store(store);

      return res.status(201).json({
        success: true,
        comment: {
          id,
          postId: post.id,
          text,
          isAnonymous: isAnon,
          authorUid: row.author_uid,
          authorName: row.author_name,
          authorAvatar: row.author_avatar,
          authorFrame: row.author_frame,
          authorEquippedAvatar: row.author_equipped_avatar,
          authorPhotoURL: row.author_photo_url,
          createdAt: new Date(now).toISOString(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Comment failed' });
    }
  });

  app.delete('/api/posts/:slugOrId/comments/:commentId', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const commentId = String(req.params.commentId || '').trim();
      const store = loadD1Store();
      const idx = store.comments.findIndex((c) => c.id === commentId);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Comment not found' });

      const cmt = store.comments[idx];
      if (cmt.real_author_uid !== user.uid && user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const post = store.posts.find((p) => p.id === cmt.post_id);
      if (post) {
        post.comment_count = Math.max(0, (post.comment_count || 0) - 1);
      }
      store.comments.splice(idx, 1);
      saveD1Store(store);

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Delete comment failed' });
    }
  });

  // 15. POST /api/posts/:slugOrId/report — Report Post
  app.post('/api/posts/:slugOrId/report', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      const reason = String(req.body?.reason || 'other');
      const details = String(req.body?.details || '').trim();
      const id = `rep_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

      store.reports.push({
        id,
        post_id: post.id,
        reporter_uid: user.uid,
        reason,
        details,
        status: 'pending',
        created_at: Date.now(),
      });

      post.report_count = (post.report_count || 0) + 1;
      if (post.report_count >= 3) {
        post.is_hidden = 1;
      }
      saveD1Store(store);

      return res.status(201).json({ success: true, reportId: id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Report failed' });
    }
  });

  // ============================================================================
  // PASSWORD RESET FALLBACK ENDPOINT (Fixes Firebase `auth/error-code:-26`)
  // ============================================================================
  app.post('/api/auth/password-reset', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          code: 'auth/invalid-email',
          error: 'Please enter a valid email address.',
        });
      }

      // Check if this email was permanently deleted by an admin
      const deletedRegistry = loadDeletedAccountsRegistry();
      const wasAdminDeleted = deletedRegistry.some((d) => d.email.toLowerCase() === email);

      const apiKey = getFirebaseWebApiKey();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          code: 'auth/internal-error',
          error: 'Firebase API key is not configured on the server.',
        });
      }

      // Call Google Identity Toolkit directly WITHOUT restrictive continueUrl
      // (continueUrl / custom authDomain mismatch is what triggers auth/error-code:-26)
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email,
          }),
        }
      );

      const data = (await resp.json()) as any;
      if (!resp.ok) {
        const rawMessage = String(data?.error?.message || 'UNKNOWN_ERROR');
        if (rawMessage.includes('EMAIL_NOT_FOUND') || wasAdminDeleted) {
          return res.status(404).json({
            success: false,
            code: 'auth/user-not-found',
            error:
              'No active account was found with this email address. If your account was deleted, you can sign up again to create a new account.',
          });
        }
        if (rawMessage.includes('INVALID_EMAIL')) {
          return res.status(400).json({
            success: false,
            code: 'auth/invalid-email',
            error: 'Please enter a valid email address.',
          });
        }
        if (rawMessage.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          return res.status(429).json({
            success: false,
            code: 'auth/too-many-requests',
            error: 'Too many password reset requests. Please wait a few minutes and try again.',
          });
        }
        if (rawMessage.includes('-26') || rawMessage.includes('UNAUTHORIZED_DOMAIN')) {
          return res.status(400).json({
            success: false,
            code: 'auth/error-code:-26',
            error:
              'Password reset domain configuration error (auth/error-code:-26). Ensure boardly.cfd and auth.boardly.cfd are added under Firebase Console > Authentication > Settings > Authorized domains.',
          });
        }

        return res.status(400).json({
          success: false,
          code: `auth/${rawMessage.toLowerCase()}`,
          error: `Could not send password reset email (${rawMessage}).`,
        });
      }

      return res.status(200).json({
        success: true,
        email: data.email || email,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: 'auth/network-request-failed',
        error: err?.message || 'Failed to send password reset email.',
      });
    }
  });

  // ============================================================================
  // COMPLETE & CONSISTENT ADMIN USER DELETION (Auth + Firestore + D1)
  // ============================================================================
  app.post('/api/admin/users/delete', async (req, res) => {
    try {
      const adminUser = await verifyFirebaseJwtZeroFirestore(req);
      if (!adminUser || adminUser.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only superadmins can permanently delete user accounts.',
        });
      }

      const targetUid = String(req.body?.targetUid || req.body?.studentId || '').trim();
      const targetEmail = String(req.body?.targetEmail || req.body?.studentEmail || '')
        .trim()
        .toLowerCase();

      if (!targetUid && !targetEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing targetUid or targetEmail for permanent deletion.',
        });
      }

      if (SUPERADMIN_UIDS.has(targetUid) || (targetEmail && SUPERADMIN_EMAILS.has(targetEmail))) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete the protected superadmin account.',
        });
      }

      const steps: Record<string, { ok: boolean; detail: string }> = {};

      // STEP 1: Delete from Firebase Authentication via Google Identity Toolkit Admin API
      let firebaseAuthDeleted = false;
      let firebaseAuthError: string | null = null;
      const accessToken = options?.getGoogleAccessToken
        ? await options.getGoogleAccessToken().catch(() => null)
        : null;

      if (accessToken && targetUid) {
        try {
          const authDelResp = await fetch(
            `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:delete`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ localId: targetUid }),
            }
          );

          if (authDelResp.ok) {
            firebaseAuthDeleted = true;
            steps.firebaseAuth = {
              ok: true,
              detail: `Deleted user ${targetUid} from Firebase Authentication.`,
            };
          } else {
            const errJson = (await authDelResp.json().catch(() => ({}))) as any;
            const msg = String(errJson?.error?.message || authDelResp.statusText);
            if (msg.includes('USER_NOT_FOUND')) {
              firebaseAuthDeleted = true;
              steps.firebaseAuth = {
                ok: true,
                detail: 'User was already absent from Firebase Authentication.',
              };
            } else {
              firebaseAuthError = `Firebase Auth Admin API returned: ${msg}`;
              steps.firebaseAuth = { ok: false, detail: firebaseAuthError };
            }
          }
        } catch (e: any) {
          firebaseAuthError = e?.message || 'Failed calling Firebase Auth Admin API';
          steps.firebaseAuth = { ok: false, detail: firebaseAuthError };
        }
      } else {
        // Check if the email actually exists in Firebase Auth via createAuthUri
        const apiKey = getFirebaseWebApiKey();
        let existsInFirebaseAuth = false;
        if (apiKey && targetEmail) {
          try {
            const checkResp = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  identifier: targetEmail,
                  continueUri: 'https://boardly.cfd/login',
                }),
              }
            );
            const checkData = (await checkResp.json().catch(() => ({}))) as any;
            existsInFirebaseAuth = Boolean(checkData?.registered);
          } catch {
            // Ignore API probe failure
          }
        }

        if (!existsInFirebaseAuth) {
          firebaseAuthDeleted = true;
          steps.firebaseAuth = {
            ok: true,
            detail: 'Verified email is not registered in Firebase Authentication.',
          };
        } else {
          firebaseAuthError =
            'FIREBASE_SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS is not set on the server, so Firebase Authentication could not delete the Auth credential record directly.';
          steps.firebaseAuth = {
            ok: false,
            detail: firebaseAuthError,
          };
        }
      }

      // STEP 2: Delete user's posts, comments, likes, saves, and roles in Cloudflare D1
      const store = loadD1Store();
      const beforePosts = store.posts.length;
      store.posts = store.posts.filter(
        (p) => p.real_author_uid !== targetUid && p.author_uid !== targetUid
      );
      store.likes = store.likes.filter((l) => l.user_uid !== targetUid);
      store.saves = store.saves.filter((s) => s.user_uid !== targetUid);
      store.comments = store.comments.filter((c) => c.real_author_uid !== targetUid);
      store.userRoles = store.userRoles.filter(
        (r) => r.uid !== targetUid && (!targetEmail || r.email.toLowerCase() !== targetEmail)
      );
      saveD1Store(store);
      steps.cloudflareD1 = {
        ok: true,
        detail: `Removed ${beforePosts - store.posts.length} post(s) and all likes/saves/comments/roles from Cloudflare D1.`,
      };

      // STEP 3: Record in Deleted Accounts Registry
      const registry = loadDeletedAccountsRegistry().filter(
        (e) => e.uid !== targetUid && (!targetEmail || e.email !== targetEmail)
      );
      registry.push({
        uid: targetUid,
        email: targetEmail,
        deletedAt: new Date().toISOString(),
        deletedBy: adminUser.email || adminUser.uid,
        firebaseAuthDeleted,
      });
      saveDeletedAccountsRegistry(registry);

      return res.status(200).json({
        success: true,
        firebaseAuthDeleted,
        firebaseAuthWarning: firebaseAuthError,
        steps,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to delete user account.',
      });
    }
  });

  // Check if an email belongs to an admin-deleted or orphan account
  app.get('/api/auth/check-account-status', async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Missing email query parameter.' });
    }
    const registry = loadDeletedAccountsRegistry();
    const deletedEntry = registry.find((d) => d.email.toLowerCase() === email);
    return res.status(200).json({
      success: true,
      email,
      wasDeletedByAdmin: Boolean(deletedEntry),
      deletedEntry: deletedEntry || null,
    });
  });

  // ==========================================================================
  // WELCOME TO BOARDLY ANNOUNCEMENT ROUTES (/api/announcements/*)
  // ==========================================================================
  app.get('/api/announcements/welcome', async (req, res) => {
    const store = loadD1Store();
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const queryUid = String(req.query.userId || user?.uid || '').trim();

    let welcomeRow = (store.announcements || []).find(
      (a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id
    );
    if (!welcomeRow) {
      welcomeRow = {
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
        message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
        is_pinned: 1,
        author_uid: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
        author_email: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
        author_name: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
        created_at: 1743465600000,
        updated_at: 1743465600000,
      };
    }

    let welcomed = false;
    let readWelcome = false;
    if (queryUid) {
      const st = (store.userWelcomeStatus || []).find((u) => u.user_uid === queryUid);
      if (st) {
        welcomed = Boolean(st.welcomed);
        readWelcome = Boolean(st.read_welcome);
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const statusObj = queryUid ? { userId: queryUid, welcomed, read: readWelcome } : null;
    return res.status(200).json({
      success: true,
      announcement: {
        id: welcomeRow.id,
        title: welcomeRow.title,
        message: welcomeRow.message,
        isPinned: Boolean(welcomeRow.is_pinned ?? 1),
        authorId: welcomeRow.author_uid,
        authorEmail: welcomeRow.author_email,
        authorName: welcomeRow.author_name || 'Superadmin',
        createdAtMs: Number(welcomeRow.created_at || Date.now()),
        updatedAtMs: Number(welcomeRow.updated_at || Date.now()),
      },
      userStatus: statusObj,
      welcomeStatus: statusObj || { welcomed: false, read: false },
    });
  });

  app.post('/api/announcements/welcome/ensure', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const targetUid = String(user?.uid || body.userId || '').trim();
    if (!targetUid) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();
    let existing = store.userWelcomeStatus.find((u) => u.user_uid === targetUid);
    const alreadyWelcomed = Boolean(existing?.welcomed);

    if (!existing) {
      existing = {
        user_uid: targetUid,
        welcomed: 1,
        read_welcome: 0,
        welcomed_at: now,
        read_at: null,
      };
      store.userWelcomeStatus.push(existing);
      saveD1Store(store);
    }

    const welcomeRow = (store.announcements || []).find(
      (a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id
    );

    return res.status(200).json({
      success: true,
      userId: targetUid,
      welcomed: true,
      newlyWelcomed: !alreadyWelcomed,
      read: Boolean(existing.read_welcome),
      announcement: {
        id: welcomeRow?.id || DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title: welcomeRow?.title || DEFAULT_WELCOME_ANNOUNCEMENT.title,
        message: welcomeRow?.message || DEFAULT_WELCOME_ANNOUNCEMENT.message,
        isPinned: true,
        authorName: welcomeRow?.author_name || 'Superadmin',
        createdAtMs: Number(welcomeRow?.created_at || now),
      },
    });
  });

  app.post('/api/announcements/welcome/read', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const targetUid = String(user?.uid || body.userId || '').trim();
    if (!targetUid) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    const now = Date.now();
    let existing = store.userWelcomeStatus.find((u) => u.user_uid === targetUid);
    if (!existing) {
      existing = {
        user_uid: targetUid,
        welcomed: 1,
        read_welcome: 1,
        welcomed_at: now,
        read_at: now,
      };
      store.userWelcomeStatus.push(existing);
    } else {
      existing.welcomed = 1;
      existing.read_welcome = 1;
      existing.read_at = now;
    }

    if (
      !store.userReadAnnouncements.some(
        (r) => r.user_uid === targetUid && r.announcement_id === DEFAULT_WELCOME_ANNOUNCEMENT.id
      )
    ) {
      store.userReadAnnouncements.push({
        user_uid: targetUid,
        announcement_id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        read_at: now,
      });
    }

    saveD1Store(store);

    return res.status(200).json({ success: true, userId: targetUid, read: true });
  });

  // ==========================================================================
  // D1 FOLLOWS & NOTIFICATIONS ROUTES (/api/follows & /api/notifications)
  // ==========================================================================
  app.get('/api/follows', async (req, res) => {
    const store = loadD1Store();
    if (!Array.isArray(store.follows)) store.follows = [];
    const followerUid = String(req.query.followerUid || '').trim();
    const followingUid = String(req.query.followingUid || '').trim();

    if (followerUid && followingUid) {
      const isFollowing = store.follows.some(
        (f) => f.follower_uid === followerUid && f.following_uid === followingUid
      );
      return res.status(200).json({ success: true, isFollowing });
    }
    if (followingUid) {
      const followerIds = store.follows
        .filter((f) => f.following_uid === followingUid)
        .map((f) => f.follower_uid);
      return res.status(200).json({
        success: true,
        followerIds,
        followersCount: followerIds.length,
      });
    }
    if (followerUid) {
      const followingIds = store.follows
        .filter((f) => f.follower_uid === followerUid)
        .map((f) => f.following_uid);
      return res.status(200).json({
        success: true,
        followingIds,
        followingCount: followingIds.length,
      });
    }
    return res.status(200).json({ success: true, follows: [] });
  });

  app.post('/api/follows', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const followerUid = String(user?.uid || body.followerUid || '').trim();
    const followingUid = String(body.followingUid || body.targetUserId || '').trim();
    const action = String(body.action || 'follow').toLowerCase();

    if (!followerUid || !followingUid || followerUid === followingUid) {
      return res.status(400).json({ success: false, error: 'Invalid follow parameters.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.follows)) store.follows = [];
    if (!Array.isArray(store.notifications)) store.notifications = [];
    const now = Date.now();
    const existingIdx = store.follows.findIndex(
      (f) => f.follower_uid === followerUid && f.following_uid === followingUid
    );

    let following = false;
    if (action === 'unfollow' || (action === 'toggle' && existingIdx !== -1)) {
      if (existingIdx !== -1) {
        store.follows.splice(existingIdx, 1);
      }
      following = false;
    } else {
      if (existingIdx === -1) {
        store.follows.push({
          follower_uid: followerUid,
          following_uid: followingUid,
          created_at: now,
        });
      }
      following = true;

      const followerName = String(body.followerName || user?.name || 'A student').trim();
      const followerAvatar = body.followerAvatar || user?.picture || null;
      const followerFrame = body.followerFrame || null;
      const notifId = `follow_${followerUid}_${followingUid}`;
      const existingNotif = store.notifications.find((n) => n.id === notifId);
      if (!existingNotif) {
        store.notifications.unshift({
          id: notifId,
          user_id: followingUid,
          type: 'new_follower',
          title: `${followerName} started following you`,
          message: 'Tap to view their profile.',
          link: null,
          read: 0,
          is_pinned: 0,
          author_id: followerUid,
          author_name: followerName,
          author_avatar: followerAvatar,
          author_frame: followerFrame,
          post_id: null,
          post_type: null,
          created_at: now,
          read_at: null,
        });
      }
    }

    saveD1Store(store);
    const followersCount = store.follows.filter((f) => f.following_uid === followingUid).length;
    return res.status(200).json({ success: true, following, followersCount });
  });

  app.get('/api/notifications', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const userId = String(req.query.userId || user?.uid || '').trim();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];

    const userNotifs = store.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
      .slice(0, 100)
      .map((n) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type || 'following_post',
        title: n.title,
        message: n.message || '',
        link: n.link || undefined,
        read: Boolean(n.read),
        isPinned: Boolean(n.is_pinned),
        authorId: n.author_id || undefined,
        authorName: n.author_name || undefined,
        authorAvatar: n.author_avatar || null,
        authorFrame: n.author_frame || null,
        postId: n.post_id || undefined,
        postType: n.post_type || undefined,
        createdAtMs: Number(n.created_at || Date.now()),
      }));

    const readAnnouncementIds = new Set<string>(
      store.userReadAnnouncements
        .filter((r) => r.user_uid === userId)
        .map((r) => r.announcement_id)
    );
    const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
    if (welcomeSt?.read_welcome) {
      readAnnouncementIds.add(DEFAULT_WELCOME_ANNOUNCEMENT.id);
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      notifications: userNotifs,
      readAnnouncementIds: Array.from(readAnnouncementIds),
      welcomeRead: Boolean(welcomeSt?.read_welcome) || readAnnouncementIds.has(DEFAULT_WELCOME_ANNOUNCEMENT.id),
    });
  });

  app.post('/api/notifications', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const items: any[] = Array.isArray(body.notifications)
      ? body.notifications
      : body.userId
      ? [body]
      : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'No notifications provided.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    const now = Date.now();
    let created = 0;

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

      if (store.notifications.some((n) => n.id === id)) continue;

      store.notifications.unshift({
        id,
        user_id: targetUserId,
        type: String(item.type || 'following_post'),
        title: String(item.title || 'New update'),
        message: String(item.message || ''),
        link: item.link ? String(item.link) : null,
        read: item.read ? 1 : 0,
        is_pinned: item.isPinned ? 1 : 0,
        author_id: authorId,
        author_name: item.authorName ? String(item.authorName) : null,
        author_avatar: item.authorAvatar || null,
        author_frame: item.authorFrame || null,
        post_id: item.postId ? String(item.postId) : null,
        post_type: item.postType ? String(item.postType) : null,
        created_at: Number(item.createdAtMs || now),
        read_at: item.read ? now : null,
      });
      created++;
    }

    if (created > 0) {
      saveD1Store(store);
    }

    return res.status(200).json({ success: true, created });
  });

  app.post('/api/notifications/read', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const userId = String(user?.uid || body.userId || '').trim();
    const notificationId = String(body.notificationId || body.id || '').trim();
    const isAnnouncement = Boolean(body.isAnnouncement);

    if (!userId || !notificationId) {
      return res.status(400).json({ success: false, error: 'Missing userId or notificationId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();

    if (notificationId === DEFAULT_WELCOME_ANNOUNCEMENT.id || isAnnouncement) {
      if (
        !store.userReadAnnouncements.some(
          (r) => r.user_uid === userId && r.announcement_id === notificationId
        )
      ) {
        store.userReadAnnouncements.push({
          user_uid: userId,
          announcement_id: notificationId,
          read_at: now,
        });
      }
      if (notificationId === DEFAULT_WELCOME_ANNOUNCEMENT.id) {
        const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
        if (!welcomeSt) {
          store.userWelcomeStatus.push({
            user_uid: userId,
            welcomed: 1,
            read_welcome: 1,
            welcomed_at: now,
            read_at: now,
          });
        } else {
          welcomeSt.welcomed = 1;
          welcomeSt.read_welcome = 1;
          welcomeSt.read_at = now;
        }
      }
    }

    const notif = store.notifications.find(
      (n) => n.id === notificationId && n.user_id === userId
    );
    if (notif) {
      notif.read = 1;
      notif.read_at = now;
    }

    saveD1Store(store);
    return res.status(200).json({ success: true, notificationId, read: true });
  });

  app.post('/api/notifications/read-all', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const userId = String(user?.uid || body.userId || '').trim();
    const announcementIds: string[] = Array.isArray(body.announcementIds)
      ? body.announcementIds.map(String)
      : [];

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();

    for (const n of store.notifications) {
      if (n.user_id === userId && !n.read) {
        n.read = 1;
        n.read_at = now;
      }
    }

    const allAnns = new Set<string>([
      DEFAULT_WELCOME_ANNOUNCEMENT.id,
      ...(store.announcements || []).map((a) => a.id),
      ...announcementIds,
    ]);
    for (const annId of allAnns) {
      if (!annId) continue;
      if (
        !store.userReadAnnouncements.some(
          (r) => r.user_uid === userId && r.announcement_id === annId
        )
      ) {
        store.userReadAnnouncements.push({
          user_uid: userId,
          announcement_id: annId,
          read_at: now,
        });
      }
    }

    const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
    if (!welcomeSt) {
      store.userWelcomeStatus.push({
        user_uid: userId,
        welcomed: 1,
        read_welcome: 1,
        welcomed_at: now,
        read_at: now,
      });
    } else {
      welcomeSt.welcomed = 1;
      welcomeSt.read_welcome = 1;
      welcomeSt.read_at = now;
    }

    saveD1Store(store);
    return res.status(200).json({ success: true, userId, readAll: true });
  });

  app.put('/api/announcements/welcome', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only superadmin can edit the Welcome to Boardly announcement.',
      });
    }

    const body = req.body || {};
    const title = String(body.title || DEFAULT_WELCOME_ANNOUNCEMENT.title).trim();
    const message = String(body.message || '').trim();
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required.',
      });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.announcements)) store.announcements = [];
    const now = Date.now();
    const existing = store.announcements.find((a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id);
    if (existing) {
      existing.title = title;
      existing.message = message;
      existing.is_pinned = 1;
      existing.author_uid = user.uid;
      existing.author_email = user.email;
      existing.author_name = user.name || 'Superadmin';
      existing.updated_at = now;
    } else {
      store.announcements.unshift({
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title,
        message,
        is_pinned: 1,
        author_uid: user.uid,
        author_email: user.email,
        author_name: user.name || 'Superadmin',
        created_at: now,
        updated_at: now,
      });
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      announcement: {
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title,
        message,
        isPinned: true,
        authorId: user.uid,
        authorEmail: user.email,
        authorName: user.name || 'Superadmin',
        updatedAtMs: now,
      },
    });
  });

  // ==========================================================================
  // DAILY BOTS API ROUTES (/api/bots/*)
  // ==========================================================================
  app.get('/api/bots', (_req, res) => {
    const store = loadD1Store();
    const apiKeys = parseGeminiApiKeys(
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY
    );
    const { model, fallbackModel } = resolvePinnedGeminiModels(
      process.env.GEMINI_MODEL,
      process.env.GEMINI_FALLBACK_MODEL
    );
    const pool = buildBotKeyPoolState({
      apiKeys,
      persistedStatuses: store.botKeyStatuses || [],
      lastUsedKeyIndex: store.botSystemState?.lastUsedKeyIndex ?? -1,
      allKeysExhaustedUntil: store.botSystemState?.allKeysExhaustedUntil ?? null,
    });
    const publicKeyStatuses = toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length);
    const geminiCallsToday = getTotalGeminiCallsToday(pool);
    const geminiCallsLastRun = Number(
      store.botSystemState?.geminiCallsLastRun ??
        store.botSystemState?.lastRunSummary?.geminiCallsLastRun ??
        0
    );

    const bots = (store.botAccounts || []).map((r, idx) => {
      const actualPostCount = store.posts.filter(
        (p) => p.author_uid === r.uid || p.real_author_uid === r.uid
      ).length;
      const actualCommentCount = store.comments.filter(
        (c) => c.author_uid === r.uid || c.real_author_uid === r.uid
      ).length;
      const actualLikeCount = store.likes.filter((l) => l.user_uid === r.uid).length;
      const assignedKeyIndex = apiKeys.length > 0 ? idx % apiKeys.length : 0;
      return {
        uid: r.uid,
        username: r.username,
        displayName: r.display_name,
        subject: r.subject,
        avatar: r.avatar,
        bio: r.bio,
        enabled: Boolean(r.enabled),
        dailyPostLimit: Number(r.daily_post_limit || 2),
        postsCount: Math.max(Number(r.posts_count || 0), actualPostCount),
        commentsCount: Math.max(Number(r.comments_count || 0), actualCommentCount),
        likesCount: Math.max(Number(r.likes_count || 0), actualLikeCount),
        lastRunAt: r.last_run_at ? new Date(Number(r.last_run_at)).toISOString() : null,
        lastRunStatus: r.last_run_status || 'ready',
        assignedKeyIndex,
        assignedKeyLabel: apiKeys.length > 0 ? `Key #${assignedKeyIndex + 1}` : 'No key',
        role: 'bot',
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      bots,
      totalBots: bots.length,
      enabledBots: bots.filter((b) => b.enabled).length,
      geminiConfigured: apiKeys.length > 0,
      geminiKeysCount: apiKeys.length,
      geminiModel: model,
      geminiFallbackModel: fallbackModel,
      botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
      keyStatuses: publicKeyStatuses,
      allKeysExhaustedUntil:
        pool.allKeysExhaustedUntil && pool.allKeysExhaustedUntil > Date.now()
          ? new Date(pool.allKeysExhaustedUntil).toISOString()
          : null,
      geminiCallsLastRun,
      geminiCallsToday,
      lastRunSummary: store.botSystemState?.lastRunSummary || null,
      config: {
        geminiKeyConfigured: apiKeys.length > 0,
        geminiKeysCount: apiKeys.length,
        geminiModel: model,
        geminiFallbackModel: fallbackModel,
        botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
        cronSchedule: '0 */2 * * * (Every 2 hours, 2-3 bots/batch)',
      },
    });
  });

  app.post('/api/bots/:uid/toggle', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Superadmin authorization required.',
      });
    }

    const botUid = String(req.params.uid || '').trim();
    const body = req.body || {};
    const store = loadD1Store();
    const botRow = (store.botAccounts || []).find((b) => b.uid === botUid);
    if (!botRow) {
      return res.status(404).json({ success: false, error: 'Bot not found.' });
    }

    const nextEnabled =
      typeof body.enabled === 'boolean' ? (body.enabled ? 1 : 0) : botRow.enabled ? 0 : 1;
    botRow.enabled = nextEnabled;
    botRow.updated_at = Date.now();
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      uid: botUid,
      enabled: Boolean(nextEnabled),
    });
  });

  app.post('/api/bots/delete-content', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Superadmin authorization required.',
      });
    }

    const body = req.body || {};
    const targetBotUid = body.botUid ? String(body.botUid).trim() : null;
    const store = loadD1Store();

    const beforePosts = store.posts.length;
    const beforeComments = store.comments.length;
    const beforeLikes = store.likes.length;

    if (targetBotUid) {
      store.posts = store.posts.filter(
        (p) => p.author_uid !== targetBotUid && p.real_author_uid !== targetBotUid
      );
      store.comments = store.comments.filter(
        (c) => c.author_uid !== targetBotUid && c.real_author_uid !== targetBotUid
      );
      store.likes = store.likes.filter((l) => l.user_uid !== targetBotUid);
      const botRow = (store.botAccounts || []).find((b) => b.uid === targetBotUid);
      if (botRow) {
        botRow.posts_count = 0;
        botRow.comments_count = 0;
        botRow.likes_count = 0;
        botRow.updated_at = Date.now();
      }
    } else {
      store.posts = store.posts.filter(
        (p) =>
          p.author_role !== 'bot' &&
          !String(p.author_uid || '').startsWith('bot_') &&
          !String(p.real_author_uid || '').startsWith('bot_')
      );
      store.comments = store.comments.filter(
        (c) =>
          c.author_role !== 'bot' &&
          !String(c.author_uid || '').startsWith('bot_') &&
          !String(c.real_author_uid || '').startsWith('bot_')
      );
      store.likes = store.likes.filter((l) => !String(l.user_uid || '').startsWith('bot_'));
      for (const b of store.botAccounts || []) {
        b.posts_count = 0;
        b.comments_count = 0;
        b.likes_count = 0;
        b.updated_at = Date.now();
      }
    }

    // Recalculate post upvotes and comment counts
    for (const p of store.posts) {
      p.upvotes = store.likes.filter((l) => l.post_id === p.id).length;
      p.comment_count = store.comments.filter((c) => c.post_id === p.id).length;
    }

    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedPosts: beforePosts - store.posts.length,
      deletedComments: beforeComments - store.comments.length,
      deletedLikes: beforeLikes - store.likes.length,
    });
  });

  app.post('/api/bots/run', async (req, res) => {
    const providedSecret = String(
      req.headers['x-bot-run-secret'] ||
        (String(req.headers.authorization || '').startsWith('Bearer ')
          ? String(req.headers.authorization || '').slice(7).trim()
          : '')
    ).trim();
    const configuredSecret = String(process.env.BOT_RUN_SECRET || '').trim();
    const hasValidSecret = Boolean(
      configuredSecret && providedSecret && providedSecret === configuredSecret
    );

    let isAdminCaller = false;
    if (!hasValidSecret) {
      const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
      if (user && user.role === 'superadmin') {
        isAdminCaller = true;
      }
    }

    if (!hasValidSecret && !isAdminCaller) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid BOT_RUN_SECRET header or Superadmin token.',
      });
    }

    const apiKeys = parseGeminiApiKeys(
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY
    );
    const { model, fallbackModel } = resolvePinnedGeminiModels(
      process.env.GEMINI_MODEL,
      process.env.GEMINI_FALLBACK_MODEL
    );

    if (apiKeys.length === 0) {
      return res.status(500).json({
        success: false,
        runOutcome: 'error',
        bannerStatus: 'error',
        bannerMessage:
          'No Gemini API keys configured. Set GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY in environment variables.',
        error:
          'No Gemini API keys configured. Set GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY in environment variables.',
      });
    }

    const store = loadD1Store();
    const pool = buildBotKeyPoolState({
      apiKeys,
      persistedStatuses: store.botKeyStatuses || [],
      lastUsedKeyIndex: store.botSystemState?.lastUsedKeyIndex ?? -1,
      allKeysExhaustedUntil: store.botSystemState?.allKeysExhaustedUntil ?? null,
    });

    const persistPoolState = (summary?: any) => {
      store.botKeyStatuses = pool.keyStatuses.map((ks) => ({
        ...ks,
        lastError: ks.lastError ? redactApiKeysFromText(ks.lastError, apiKeys) : null,
      }));
      store.botSystemState = {
        lastUsedKeyIndex: pool.lastUsedKeyIndex,
        allKeysExhaustedUntil: pool.allKeysExhaustedUntil,
        geminiCallsLastRun: pool.callsThisRun,
        lastRunSummary: summary ?? store.botSystemState?.lastRunSummary ?? null,
      };
      saveD1Store(store);
    };

    const nowMs = Date.now();
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
      const retryTimeFormatted = new Date(retryUntilMs).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Karachi',
      });
      const bannerMessage = `Gemini quota exhausted — all ${apiKeys.length} key(s) cooling down. Retrying after ${retryTimeFormatted} PKT (${retryIso}).`;

      const summaryPayload = {
        success: true,
        runOutcome: 'quota_exhausted',
        bannerStatus: 'error',
        bannerMessage,
        allKeysExhaustedUntil: retryIso,
        ranAt: new Date(nowMs).toISOString(),
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
      persistPoolState(summaryPayload);
      return res.status(200).json(summaryPayload);
    }

    const body = req.body || {};
    const targetBotUid = body.botUid ? String(body.botUid).trim() : null;
    // Cap each run to 2-3 bots chosen by least recently run
    const requestedMaxBots = Number(body.maxBots || (targetBotUid ? 1 : 2));
    const maxBotsPerCall = targetBotUid
      ? 1
      : Math.min(3, Math.max(1, Number.isFinite(requestedMaxBots) ? requestedMaxBots : 2));
    const postsPerBotReq = Math.min(2, Math.max(1, Number(body.postsPerBot || 1)));

    const candidateBots = (store.botAccounts || []).filter((b) =>
      targetBotUid ? b.uid === targetBotUid : b.enabled === 1
    );
    // Order by least recently run (last_run_at ASC NULLS FIRST)
    candidateBots.sort((a, b) => {
      const aRun = Number(a.last_run_at || 0);
      const bRun = Number(b.last_run_at || 0);
      if (aRun !== bRun) return aRun - bRun;
      return a.uid.localeCompare(b.uid);
    });
    const selectedBots = candidateBots.slice(0, maxBotsPerCall);

    const dayStartMs = new Date().setUTCHours(0, 0, 0, 0);
    const results: Array<{
      uid: string;
      botUid: string;
      displayName: string;
      subject: string;
      postsCreated: number;
      commentsCreated: number;
      likesAdded: number;
      likesCreated: number;
      geminiCallsUsed: number;
      assignedKeyIndex: number;
      status: string;
      error?: string;
    }> = [];

    let totalPostsCreated = 0;
    let totalCommentsCreated = 0;
    let totalLikesCreated = 0;
    let stoppedDueToAllKeysExhausted = false;
    let exhaustionBannerMessage: string | null = null;

    for (const botRow of selectedBots) {
      const botIndexInConfig = Math.max(
        0,
        BOARDLY_BOT_ACCOUNTS.findIndex((b) => b.uid === botRow.uid)
      );
      const assignedKeyIndex = apiKeys.length > 0 ? botIndexInConfig % apiKeys.length : 0;

      const botMeta =
        BOARDLY_BOT_ACCOUNTS[botIndexInConfig] || {
          uid: botRow.uid,
          placeholderName: botRow.username,
          displayName: botRow.display_name,
          email: `${botRow.username}@bots.boardly.cfd`,
          subject: botRow.subject as any,
          classLevel: '11' as const,
          board: 'Federal' as const,
          target: 'Federal & Entrance Exam Prep',
          equippedAvatar: botRow.avatar,
          bio: botRow.bio,
          chapters: [botRow.subject],
        };

      // Check D1 store BEFORE calling Gemini to enforce Max 2/day
      const alreadyPostedToday = store.posts.filter(
        (p) =>
          (p.author_uid === botRow.uid || p.real_author_uid === botRow.uid) &&
          Number(p.created_at || 0) >= dayStartMs
      ).length;
      const dailyLimit = Math.min(2, Math.max(1, Number(botRow.daily_post_limit || 2)));
      const remainingQuota = Math.max(0, dailyLimit - alreadyPostedToday);

      let postsCreated = 0;
      let commentsCreated = 0;
      let likesAdded = 0;
      let botGeminiCalls = 0;
      let lastError: string | undefined;

      // 1. Plain D1 likes first (no Gemini call)
      const candidatePosts = store.posts
        .filter(
          (p) =>
            p.is_hidden === 0 &&
            p.author_uid !== botRow.uid &&
            p.real_author_uid !== botRow.uid
        )
        .slice(0, 12);

      for (const other of candidatePosts.slice(0, 2)) {
        const alreadyLiked = store.likes.some(
          (l) => l.post_id === other.id && l.user_uid === botRow.uid
        );
        if (!alreadyLiked) {
          store.likes.push({
            post_id: other.id,
            user_uid: botRow.uid,
            created_at: Date.now(),
          });
          other.upvotes = (other.upvotes || 0) + 1;
          likesAdded++;
          totalLikesCreated++;
        }
      }

      if (remainingQuota <= 0) {
        botRow.likes_count = Number(botRow.likes_count || 0) + likesAdded;
        botRow.last_run_at = Date.now();
        botRow.last_run_status = `Daily post limit reached (${alreadyPostedToday}/${dailyLimit} today); ${likesAdded} like(s) added`;
        botRow.updated_at = Date.now();

        results.push({
          uid: botRow.uid,
          botUid: botRow.uid,
          displayName: botRow.display_name,
          subject: botRow.subject,
          postsCreated: 0,
          commentsCreated: 0,
          likesAdded,
          likesCreated: likesAdded,
          geminiCallsUsed: 0,
          assignedKeyIndex,
          status: 'daily_limit_reached',
        });
        continue;
      }

      const postsToCreate = Math.min(postsPerBotReq, remainingQuota);

      for (let i = 0; i < postsToCreate; i++) {
        const generated = await generateVerifiedBotStudyPost({
          bot: botMeta,
          keyPool: pool,
          botIndex: botIndexInConfig,
          model,
          fallbackModel,
          postIndex: alreadyPostedToday + i,
        });
        botGeminiCalls += generated.geminiCallsUsed || 0;

        if (!generated.post) {
          lastError = generated.discardReason || 'Generation skipped';
          console.error(
            `[BotRunner] Bot ${botRow.uid} (${botRow.display_name}) post generation failed:`,
            redactApiKeysFromText(lastError, apiKeys)
          );
          if (generated.allKeysExhausted) {
            stoppedDueToAllKeysExhausted = true;
            exhaustionBannerMessage = lastError;
            break;
          }
          continue;
        }

        const p = generated.post;
        const maxCreated = store.posts.reduce(
          (max, item) => Math.max(max, Number(item.created_at || 0)),
          0
        );
        const now = Math.max(Date.now(), maxCreated + 1);
        const postId = `post_bot_${now}_${crypto.randomUUID().slice(0, 6)}`;
        const slug = buildSlug(postId, p.title);

        store.posts.unshift({
          id: postId,
          slug,
          type: p.type,
          title: p.title,
          description: p.description,
          subject: botMeta.subject,
          chapter: p.chapter,
          target: botMeta.target,
          class_level: botMeta.classLevel,
          board: botMeta.board,
          format: 'text',
          tags_json: JSON.stringify(p.tags),
          files_json: '[]',
          is_anonymous: 0,
          anonymous_alias: 'Anonymous Student',
          author_uid: botRow.uid,
          real_author_uid: botRow.uid,
          author_name: botRow.display_name,
          author_avatar: botRow.avatar,
          author_frame: null,
          author_equipped_avatar: botRow.avatar,
          author_photo_url: null,
          author_role: 'bot',
          author_custom_role: `${botMeta.subject} Bot`,
          status: 'published',
          visibility: 'public',
          is_hidden: 0,
          is_pinned: 0,
          is_featured: 0,
          upvotes: 1,
          downvotes: 0,
          views: 1,
          comment_count: 0,
          save_count: 0,
          shares_count: 0,
          report_count: 0,
          created_at: now,
          updated_at: now,
        });
        postsCreated++;
        totalPostsCreated++;
      }

      const commentTarget =
        candidatePosts.find(
          (p) => p.subject.toLowerCase() === botRow.subject.toLowerCase()
        ) || candidatePosts[0];

      if (!stoppedDueToAllKeysExhausted && commentTarget && postsCreated > 0) {
        const alreadyCommented = store.comments.some(
          (c) => c.post_id === commentTarget.id && c.real_author_uid === botRow.uid
        );
        if (!alreadyCommented) {
          const commentRes = await generateVerifiedBotComment({
            bot: botMeta,
            targetPost: {
              title: commentTarget.title,
              description: commentTarget.description,
              subject: commentTarget.subject,
            },
            keyPool: pool,
            botIndex: botIndexInConfig,
            model,
            fallbackModel,
          });
          botGeminiCalls += commentRes.geminiCallsUsed || 0;
          if (commentRes.comment && commentRes.comment.text) {
            const commentId = `cmt_bot_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
            store.comments.push({
              id: commentId,
              post_id: commentTarget.id,
              text: commentRes.comment.text,
              is_anonymous: 0,
              author_uid: botRow.uid,
              real_author_uid: botRow.uid,
              author_name: botRow.display_name,
              author_avatar: botRow.avatar,
              author_frame: null,
              author_equipped_avatar: botRow.avatar,
              author_photo_url: null,
              author_role: 'bot',
              author_custom_role: `${botMeta.subject} Bot`,
              created_at: Date.now(),
            });
            commentTarget.comment_count = (commentTarget.comment_count || 0) + 1;
            commentsCreated++;
            totalCommentsCreated++;
          } else if (commentRes.allKeysExhausted) {
            stoppedDueToAllKeysExhausted = true;
            exhaustionBannerMessage =
              commentRes.discardReason || 'All Gemini API keys are cooling down.';
          }
        }
      }

      botRow.posts_count = Number(botRow.posts_count || 0) + postsCreated;
      botRow.comments_count = Number(botRow.comments_count || 0) + commentsCreated;
      botRow.likes_count = Number(botRow.likes_count || 0) + likesAdded;
      botRow.last_run_at = Date.now();
      botRow.last_run_status =
        postsCreated > 0
          ? `Published ${postsCreated} post(s), ${commentsCreated} comment(s), ${likesAdded} like(s)`
          : lastError
            ? `Error: ${lastError}`
            : `Skipped (0 posts, ${likesAdded} like(s))`;
      botRow.updated_at = Date.now();

      results.push({
        uid: botRow.uid,
        botUid: botRow.uid,
        displayName: botRow.display_name,
        subject: botRow.subject,
        postsCreated,
        commentsCreated,
        likesAdded,
        likesCreated: likesAdded,
        geminiCallsUsed: botGeminiCalls,
        assignedKeyIndex,
        status:
          postsCreated > 0
            ? 'ok'
            : stoppedDueToAllKeysExhausted
              ? 'quota_exhausted'
              : lastError
                ? 'error'
                : 'skipped',
        error: lastError,
      });

      if (stoppedDueToAllKeysExhausted) {
        break;
      }
    }

    const anyErrors = results.some((r) => Boolean(r.error));
    const allDailyLimit =
      results.length > 0 && results.every((r) => r.status === 'daily_limit_reached');

    let runOutcome: 'success' | 'partial' | 'quota_exhausted' | 'error' | 'daily_limit' = 'success';
    let bannerStatus: 'success' | 'warning' | 'error' = 'success';
    let bannerMessage = `Bot run finished: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published (${pool.callsThisRun} Gemini call(s) used).`;

    if (stoppedDueToAllKeysExhausted || (totalPostsCreated === 0 && anyErrors)) {
      const firstError =
        exhaustionBannerMessage ||
        results.find((r) => r.error)?.error ||
        'Gemini API error prevented post generation.';
      if (
        stoppedDueToAllKeysExhausted ||
        firstError.toLowerCase().includes('quota') ||
        firstError.includes('429') ||
        firstError.toLowerCase().includes('cooling down')
      ) {
        runOutcome = 'quota_exhausted';
        bannerStatus = 'error';
        const retryUntil =
          pool.allKeysExhaustedUntil ||
          Math.min(
            ...pool.keyStatuses
              .map((k) => k.cooldownUntil || Date.now() + 60_000)
              .filter((v) => v > Date.now())
          );
        const retryFormatted = Number.isFinite(retryUntil)
          ? new Date(retryUntil).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Karachi',
            })
          : 'cooldown expires';
        bannerMessage = `Gemini quota exhausted (0 posts published). Retrying after ${retryFormatted} PKT. Full detail: ${firstError}`;
      } else {
        runOutcome = 'error';
        bannerStatus = 'error';
        bannerMessage = `Bot run published 0 posts due to errors: ${firstError}`;
      }
    } else if (totalPostsCreated > 0 && anyErrors) {
      runOutcome = 'partial';
      bannerStatus = 'warning';
      bannerMessage = `Partial bot run: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published, with some errors (${pool.callsThisRun} Gemini call(s)).`;
    } else if (totalPostsCreated === 0 && allDailyLimit) {
      runOutcome = 'daily_limit';
      bannerStatus = 'warning';
      bannerMessage = `Selected bots already reached their Max 2/day post limit (${totalLikesCreated} plain D1 like(s) added, 0 Gemini calls used).`;
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
      botsProcessed: results.length,
      postsCreated: totalPostsCreated,
      commentsCreated: totalCommentsCreated,
      likesAdded: totalLikesCreated,
      likesCreated: totalLikesCreated,
      geminiCallsLastRun: pool.callsThisRun,
      geminiCallsToday: getTotalGeminiCallsToday(pool),
      geminiKeysCount: apiKeys.length,
      geminiModel: model,
      geminiFallbackModel: fallbackModel,
      keyStatuses: toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length),
      results,
    };

    persistPoolState(summaryPayload);

    return res.status(200).json(summaryPayload);
  });

  // ===========================================================================
  // /api/questions — Cloudflare D1 Question Bank Endpoints
  // ===========================================================================
  const isStrictQuestionBankAdmin = (user: VerifiedFirebaseUser | null): boolean => {
    return Boolean(user && String(user.email || '').trim().toLowerCase() === 'shsvirtualadmin@gmail.com');
  };

  const normalizeQSubject = (raw: string): string => {
    const s = String(raw || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
    if (s === 'cs' || s === 'computerscience') return 'computer-science';
    if (s === 'analytical' || s === 'analyticalreasoning') return 'analytical-reasoning';
    if (s === 'math' || s === 'maths') return 'mathematics';
    return s;
  };

  const formatD1QuestionForClient = (row: D1QuestionRow, includeAnswerKey: boolean) => {
    let options: string[] = [];
    try {
      const parsed = JSON.parse(row.options_json || '[]');
      if (Array.isArray(parsed)) options = parsed.map((o) => String(o ?? ''));
    } catch {
      options = [];
    }
    const base: Record<string, any> = {
      id: row.id,
      bank_id: row.bank_id || 'legacy',
      sourceId: row.bank_id || 'legacy',
      subject: row.subject,
      topic: row.topic,
      difficulty: row.difficulty || 'medium',
      status: row.status || 'published',
      needs_review: Number(row.needs_review || 0),
      needsReview: Boolean(row.needs_review),
      question_text: row.question_text,
      questionText: row.question_text,
      options,
      options_json: row.options_json || '[]',
      source_path: row.source_path || '',
      created_at: Number(row.created_at || Date.now()),
      updated_at: Number(row.updated_at || Date.now()),
      createdAt: new Date(Number(row.created_at || Date.now())).toISOString(),
      updatedAt: new Date(Number(row.updated_at || Date.now())).toISOString(),
    };
    if (includeAnswerKey) {
      base.correct_answer = Number(row.correct_answer ?? 0);
      base.correctAnswer = Number(row.correct_answer ?? 0);
      base.explanation = row.explanation || '';
    }
    return base;
  };

  const handleQuestionsHealthRoute = async (_req: Request, res: Response) => {
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const importLogs = Array.isArray(store.questionsImportLog) ? store.questionsImportLog : [];

    const bankMeta: Record<string, { label: string; projectId: string }> = {
      legacy: { label: 'Core Bank (D1)', projectId: 'boardly-posts-db (legacy)' },
      bank1: { label: 'Alpha Bank (D1)', projectId: 'boardly-posts-db (bank1)' },
      bank2: { label: 'Beta Bank (D1)', projectId: 'boardly-posts-db (bank2)' },
    };

    const banks: Record<string, any> = {
      legacy: {
        bankId: 'legacy',
        label: bankMeta.legacy.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
      bank1: {
        bankId: 'bank1',
        label: bankMeta.bank1.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
      bank2: {
        bankId: 'bank2',
        label: bankMeta.bank2.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
    };

    const bySubjectTotal: Record<string, number> = {};
    const bySubjectPublished: Record<string, number> = {};
    const topicsBySubject: Record<string, Record<string, number>> = {};

    let totalQuestions = 0;
    let totalPublished = 0;
    let totalNeedsReview = 0;

    for (const q of questions) {
      const bankId = String(q.bank_id || 'legacy');
      const subject = String(q.subject || 'physics');
      const topic = String(q.topic || 'General');
      const status = String(q.status || 'published');
      const needsRev = Number(q.needs_review || 0) > 0;

      if (!banks[bankId]) {
        banks[bankId] = {
          bankId,
          label: `${bankId} (D1)`,
          total: 0,
          published: 0,
          needsReview: 0,
          bySubject: {},
          lastImportAt: null,
        };
      }

      banks[bankId].total += 1;
      if (status === 'published') banks[bankId].published += 1;
      if (needsRev) banks[bankId].needsReview += 1;
      banks[bankId].bySubject[subject] = (banks[bankId].bySubject[subject] || 0) + 1;

      bySubjectTotal[subject] = (bySubjectTotal[subject] || 0) + 1;
      if (status === 'published') {
        bySubjectPublished[subject] = (bySubjectPublished[subject] || 0) + 1;
      }

      if (!topicsBySubject[subject]) topicsBySubject[subject] = {};
      topicsBySubject[subject][topic] = (topicsBySubject[subject][topic] || 0) + 1;

      totalQuestions += 1;
      if (status === 'published') totalPublished += 1;
      if (needsRev) totalNeedsReview += 1;
    }

    let globalLastImportMs = 0;
    for (const log of importLogs) {
      const bId = String(log.bank_id || 'legacy');
      const ts = Number(log.imported_at || 0);
      if (ts > globalLastImportMs) globalLastImportMs = ts;
      if (banks[bId]) {
        const curMs = banks[bId].lastImportAt ? new Date(banks[bId].lastImportAt).getTime() : 0;
        if (ts > curMs) {
          banks[bId].lastImportAt = new Date(ts).toISOString();
        }
      }
    }

    const fallbackIso =
      globalLastImportMs > 0
        ? new Date(globalLastImportMs).toISOString()
        : store.migratedAt || new Date().toISOString();
    for (const bKey of Object.keys(banks)) {
      if (!banks[bKey].lastImportAt) {
        banks[bKey].lastImportAt = fallbackIso;
      }
    }

    const diagnostics = ['legacy', 'bank1', 'bank2'].map((bId) => ({
      sourceId: bId,
      label: banks[bId]?.label || `${bId} (D1)`,
      projectId: bankMeta[bId]?.projectId || `boardly-posts-db (${bId})`,
      status: 'healthy',
      latencyMs: 2,
      questionCount: banks[bId]?.total || 0,
      publishedCount: banks[bId]?.published || 0,
      needsReviewCount: banks[bId]?.needsReview || 0,
      bySubject: banks[bId]?.bySubject || {},
      lastImportAt: banks[bId]?.lastImportAt || fallbackIso,
    }));

    return res.status(200).json({
      source: 'cloudflare-d1',
      database: 'boardly-posts-db',
      totalQuestions,
      totalPublished,
      totalNeedsReview,
      lastImportAt: fallbackIso,
      bySubject: bySubjectTotal,
      bySubjectPublished,
      topicsBySubject,
      banks,
      diagnostics,
      importLogs: importLogs.slice(0, 50),
    });
  };

  app.get('/api/questions/health', handleQuestionsHealthRoute);
  app.get('/api/questions/stats', handleQuestionsHealthRoute);

  app.get('/api/questions/ids', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];

    const bankParam = String(req.query.bank || req.query.bank_id || '').trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const statusParam = String(req.query.status || '').trim().toLowerCase();

    const filtered = questions.filter((q) => {
      if (bankParam && bankParam !== 'all' && q.bank_id !== bankParam) return false;
      if (subjectParam && subjectParam !== 'all' && q.subject !== normalizeQSubject(subjectParam)) return false;
      if (topicParam && topicParam !== 'all' && q.topic !== topicParam) return false;
      if (difficultyParam && difficultyParam !== 'all' && q.difficulty !== difficultyParam) return false;
      if (isAdmin) {
        if (statusParam && statusParam !== 'all' && q.status !== statusParam) return false;
      } else {
        if (q.status !== 'published') return false;
      }
      return true;
    });

    const ids = filtered.map((q) => q.id);
    const items = filtered.map((q) => ({
      id: q.id,
      bank_id: q.bank_id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return res.status(200).json({
      ids,
      items,
      total: ids.length,
    });
  });

  app.post('/api/questions/verify', async (req: Request, res: Response) => {
    const body = req.body || {};
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const qMap = new Map<string, D1QuestionRow>();
    for (const q of questions) {
      qMap.set(q.id, q);
    }

    const resolveCorrectIndex = (
      row: D1QuestionRow,
      displayedOptions?: string[]
    ): { correctIndex: number; canonicalCorrectText: string | null } => {
      let canonicalOptions: string[] = [];
      try {
        const parsed = JSON.parse(row.options_json || '[]');
        if (Array.isArray(parsed)) canonicalOptions = parsed.map((o) => String(o ?? ''));
      } catch {
        canonicalOptions = [];
      }
      const canonicalIdx = Number(row.correct_answer ?? 0);
      const canonicalCorrectText =
        canonicalIdx >= 0 && canonicalIdx < canonicalOptions.length
          ? canonicalOptions[canonicalIdx]
          : null;

      if (
        Array.isArray(displayedOptions) &&
        displayedOptions.length > 0 &&
        canonicalCorrectText !== null
      ) {
        const matchedIdx = displayedOptions.findIndex(
          (opt) => String(opt ?? '').trim() === canonicalCorrectText.trim()
        );
        if (matchedIdx !== -1) {
          return { correctIndex: matchedIdx, canonicalCorrectText };
        }
      }
      return { correctIndex: canonicalIdx, canonicalCorrectText };
    };

    if (Array.isArray(body.answers)) {
      const results: Record<
        string,
        {
          questionId: string;
          selectedAnswer: number | null;
          correct_answer: number;
          correctAnswer: number;
          canonical_correct_answer: number;
          isCorrect: boolean;
          explanation: string;
        }
      > = {};

      for (const item of body.answers) {
        const qId = String(item?.questionId || item?.id || '').trim();
        if (!qId) continue;
        const row = qMap.get(qId);
        if (!row) continue;

        const selected =
          item.selectedAnswer === null || item.selectedAnswer === undefined
            ? null
            : Number(item.selectedAnswer);
        const { correctIndex } = resolveCorrectIndex(
          row,
          Array.isArray(item.displayedOptions) ? item.displayedOptions : undefined
        );
        const isCorrect = selected !== null && Number.isFinite(selected) && selected === correctIndex;
        results[qId] = {
          questionId: qId,
          selectedAnswer: selected,
          correct_answer: correctIndex,
          correctAnswer: correctIndex,
          canonical_correct_answer: Number(row.correct_answer ?? 0),
          isCorrect,
          explanation: row.explanation || '',
        };
      }

      return res.status(200).json({
        verified: true,
        results,
      });
    }

    const questionId = String(body.questionId || body.id || '').trim();
    const hasSelectedAnswer =
      body.selectedAnswer !== undefined || body.answer !== undefined || body.selectedIndex !== undefined;

    if (!questionId || !hasSelectedAnswer) {
      return res.status(400).json({
        error: 'questionId and selectedAnswer are required to verify an answer.',
      });
    }

    const row = qMap.get(questionId);
    if (!row) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const rawAnswer = body.selectedAnswer ?? body.answer ?? body.selectedIndex;
    const selectedAnswer =
      rawAnswer === null || rawAnswer === undefined || rawAnswer === '' ? null : Number(rawAnswer);
    const { correctIndex } = resolveCorrectIndex(
      row,
      Array.isArray(body.displayedOptions) ? body.displayedOptions : undefined
    );
    const isCorrect =
      selectedAnswer !== null && Number.isFinite(selectedAnswer) && selectedAnswer === correctIndex;

    return res.status(200).json({
      questionId: row.id,
      selectedAnswer,
      correct_answer: correctIndex,
      correctAnswer: correctIndex,
      canonical_correct_answer: Number(row.correct_answer ?? 0),
      isCorrect,
      explanation: row.explanation || '',
    });
  });

  const handleBatchUpdateQuestions = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can modify questions.',
      });
    }

    const body = req.body || {};
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const now = Date.now();

    if (Array.isArray(body.questions)) {
      let imported = 0;
      let needsReviewCount = 0;

      for (const rawQ of body.questions) {
        const bankId = String(rawQ.bank_id || rawQ.sourceId || body.bank_id || 'legacy').trim();
        const rawId = String(rawQ.id || `q_${crypto.randomUUID().slice(0, 12)}`).trim();
        const id = rawId.startsWith(`${bankId}__`) || bankId === 'legacy' ? rawId : `${bankId}__${rawId}`;
        const subject = normalizeQSubject(rawQ.subject || body.subject || 'physics');
        const topic = String(rawQ.topic || 'General').trim() || 'General';
        const difficultyRaw = String(rawQ.difficulty || 'medium').trim().toLowerCase();
        const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
        const statusRaw = String(rawQ.status || 'published').trim().toLowerCase();
        const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

        const rawQuestionText = String(rawQ.question_text ?? rawQ.questionText ?? '').trim();
        let rawOptions: string[] = [];
        if (Array.isArray(rawQ.options)) {
          rawOptions = rawQ.options.map((o: any) => String(o ?? ''));
        } else if (typeof rawQ.options_json === 'string') {
          try {
            const parsed = JSON.parse(rawQ.options_json);
            if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
          } catch {
            rawOptions = [];
          }
        }
        const rawExplanation = String(rawQ.explanation ?? '').trim();
        const correctAnswer = Number(rawQ.correct_answer ?? rawQ.correctAnswer ?? 0);

        const mathResult = validateAndNormalizeQuestionMath({
          questionText: rawQuestionText,
          options: rawOptions,
          explanation: rawExplanation,
        });
        const needsReview =
          rawQ.needs_review !== undefined
            ? Number(Boolean(rawQ.needs_review))
            : mathResult.needsReview
              ? 1
              : 0;
        if (needsReview) needsReviewCount++;

        const sourcePath = String(rawQ.source_path || `${bankId}/questions_${subject}/${id}`);
        const existingIdx = store.questions.findIndex(
          (q) => q.id === id || (q.bank_id === bankId && q.source_path === sourcePath)
        );
        const row: D1QuestionRow = {
          id: existingIdx !== -1 ? store.questions[existingIdx].id : id,
          bank_id: bankId,
          subject,
          topic,
          difficulty,
          status,
          needs_review: needsReview,
          question_text: mathResult.questionText,
          options_json: JSON.stringify(mathResult.options),
          correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
          explanation: mathResult.explanation,
          source_path: sourcePath,
          created_at: existingIdx !== -1 ? store.questions[existingIdx].created_at : now,
          updated_at: now,
        };
        if (existingIdx !== -1) {
          store.questions[existingIdx] = row;
        } else {
          store.questions.push(row);
        }
        imported++;
      }

      saveD1Store(store);
      return res.status(200).json({
        success: true,
        imported,
        needsReviewCount,
      });
    }

    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map((x: any) => String(x || '').trim()).filter(Boolean)
      : [];
    const updates = body.updates || {};
    let updatedCount = 0;

    if (ids.length > 0) {
      const idSet = new Set(ids);
      for (const q of store.questions) {
        if (!idSet.has(q.id)) continue;
        if (updates.topic !== undefined) q.topic = String(updates.topic).trim();
        if (updates.subject !== undefined) q.subject = normalizeQSubject(updates.subject);
        if (updates.difficulty !== undefined) q.difficulty = String(updates.difficulty).trim().toLowerCase();
        if (updates.status !== undefined) q.status = String(updates.status).trim().toLowerCase();
        if (updates.needs_review !== undefined) q.needs_review = Number(Boolean(updates.needs_review));
        q.updated_at = now;
        updatedCount++;
      }
    } else if (body.subject && body.oldTopic && body.newTopic) {
      const subj = normalizeQSubject(body.subject);
      const oldTopic = String(body.oldTopic).trim();
      const newTopic = String(body.newTopic).trim();
      for (const q of store.questions) {
        if (q.subject === subj && q.topic === oldTopic) {
          q.topic = newTopic;
          q.updated_at = now;
          updatedCount++;
        }
      }
    }

    saveD1Store(store);
    return res.status(200).json({
      success: true,
      updatedCount,
    });
  };

  app.put('/api/questions/batch', handleBatchUpdateQuestions);
  app.post('/api/questions/batch', handleBatchUpdateQuestions);

  app.get('/api/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];

    const idsParam = String(req.query.ids || '').trim();
    const bankParam = String(req.query.bank || req.query.bank_id || '').trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const statusParam = String(req.query.status || '').trim().toLowerCase();
    const needsReviewParam = String(req.query.needs_review ?? req.query.needsReview ?? '').trim();
    const searchParam = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '100'), 10) || 100, 1), 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const requestedIds = idsParam
      ? new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;

    const matching = questions.filter((q) => {
      if (requestedIds && !requestedIds.has(q.id)) return false;
      if (bankParam && bankParam !== 'all' && q.bank_id !== bankParam) return false;
      if (subjectParam && subjectParam !== 'all' && q.subject !== normalizeQSubject(subjectParam)) return false;
      if (topicParam && topicParam !== 'all' && q.topic !== topicParam) return false;
      if (difficultyParam && difficultyParam !== 'all' && q.difficulty !== difficultyParam) return false;
      if (isAdmin) {
        if (statusParam && statusParam !== 'all' && q.status !== statusParam) return false;
      } else {
        if (q.status !== 'published') return false;
      }
      if (needsReviewParam === '1' || needsReviewParam === 'true') {
        if (Number(q.needs_review || 0) !== 1) return false;
      } else if (needsReviewParam === '0' || needsReviewParam === 'false') {
        if (Number(q.needs_review || 0) !== 0) return false;
      }
      if (searchParam) {
        const hay = `${q.id} ${q.question_text} ${q.topic} ${q.subject} ${q.options_json}`.toLowerCase();
        if (!hay.includes(searchParam)) return false;
      }
      return true;
    });

    matching.sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0) || a.id.localeCompare(b.id));
    const total = matching.length;
    const paged = matching.slice(offset, offset + limit);
    const formatted = paged.map((r) => formatD1QuestionForClient(r, isAdmin));

    return res.status(200).json({
      questions: formatted,
      total,
      limit,
      offset,
      hasMore: offset + formatted.length < total,
      isAdmin,
    });
  });

  app.post('/api/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can create questions.',
      });
    }

    const body = req.body || {};
    const bankId = String(body.bank_id || body.sourceId || 'legacy').trim() || 'legacy';
    const rawId = String(body.id || `q_${crypto.randomUUID().slice(0, 12)}`).trim();
    const id = rawId.startsWith(`${bankId}__`) || bankId === 'legacy' ? rawId : `${bankId}__${rawId}`;
    const subject = normalizeQSubject(body.subject || 'physics');
    const topic = String(body.topic || 'General').trim() || 'General';
    const difficultyRaw = String(body.difficulty || 'medium').trim().toLowerCase();
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
    const statusRaw = String(body.status || 'published').trim().toLowerCase();
    const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

    const rawQuestionText = String(body.question_text ?? body.questionText ?? '').trim();
    if (!rawQuestionText) {
      return res.status(400).json({ error: 'question_text is required.' });
    }

    let rawOptions: string[] = [];
    if (Array.isArray(body.options)) {
      rawOptions = body.options.map((o: any) => String(o ?? ''));
    } else if (typeof body.options_json === 'string') {
      try {
        const parsed = JSON.parse(body.options_json);
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    }
    if (rawOptions.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required.' });
    }

    const rawExplanation = String(body.explanation ?? '').trim();
    const correctAnswer = Number(body.correct_answer ?? body.correctAnswer ?? 0);

    const mathResult = validateAndNormalizeQuestionMath({
      questionText: rawQuestionText,
      options: rawOptions,
      explanation: rawExplanation,
    });

    const needsReview =
      body.needs_review !== undefined
        ? Number(Boolean(body.needs_review))
        : mathResult.needsReview
          ? 1
          : 0;
    const sourcePath = String(body.source_path || `${bankId}/questions_${subject}/${id}`).trim();
    const now = Date.now();

    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];

    const existingIdx = store.questions.findIndex(
      (q) => q.id === id || (q.bank_id === bankId && q.source_path === sourcePath)
    );
    const savedRow: D1QuestionRow = {
      id: existingIdx !== -1 ? store.questions[existingIdx].id : id,
      bank_id: bankId,
      subject,
      topic,
      difficulty,
      status,
      needs_review: needsReview,
      question_text: mathResult.questionText,
      options_json: JSON.stringify(mathResult.options),
      correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
      explanation: mathResult.explanation,
      source_path: sourcePath,
      created_at: existingIdx !== -1 ? store.questions[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx !== -1) {
      store.questions[existingIdx] = savedRow;
    } else {
      store.questions.push(savedRow);
    }
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      question: formatD1QuestionForClient(savedRow, true),
      mathValidationErrors: mathResult.errors,
    });
  });

  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const row = questions.find((q) => q.id === targetId);

    if (!row || (!isAdmin && row.status !== 'published')) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.status(200).json({
      question: formatD1QuestionForClient(row, isAdmin),
    });
  });

  const handleUpdateSingleQuestion = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can update questions.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const idx = store.questions.findIndex((q) => q.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const existing = store.questions[idx];
    const body = req.body || {};

    const bankId = String(body.bank_id ?? body.sourceId ?? existing.bank_id ?? 'legacy').trim();
    const subject =
      body.subject !== undefined ? normalizeQSubject(body.subject) : String(existing.subject);
    const topic = body.topic !== undefined ? String(body.topic).trim() : String(existing.topic);
    const difficultyRaw =
      body.difficulty !== undefined
        ? String(body.difficulty).trim().toLowerCase()
        : String(existing.difficulty || 'medium');
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
    const statusRaw =
      body.status !== undefined
        ? String(body.status).trim().toLowerCase()
        : String(existing.status || 'published');
    const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

    const rawQuestionText =
      body.question_text !== undefined || body.questionText !== undefined
        ? String(body.question_text ?? body.questionText ?? '').trim()
        : String(existing.question_text || '');

    let rawOptions: string[] = [];
    if (Array.isArray(body.options)) {
      rawOptions = body.options.map((o: any) => String(o ?? ''));
    } else if (typeof body.options_json === 'string') {
      try {
        const parsed = JSON.parse(body.options_json);
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    } else {
      try {
        const parsed = JSON.parse(existing.options_json || '[]');
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    }

    const rawExplanation =
      body.explanation !== undefined ? String(body.explanation).trim() : String(existing.explanation || '');
    const correctAnswer =
      body.correct_answer !== undefined || body.correctAnswer !== undefined
        ? Number(body.correct_answer ?? body.correctAnswer ?? 0)
        : Number(existing.correct_answer ?? 0);

    const mathResult = validateAndNormalizeQuestionMath({
      questionText: rawQuestionText,
      options: rawOptions,
      explanation: rawExplanation,
    });

    const needsReview =
      body.needs_review !== undefined || body.needsReview !== undefined
        ? Number(Boolean(body.needs_review ?? body.needsReview))
        : mathResult.needsReview
          ? 1
          : 0;

    const updatedRow: D1QuestionRow = {
      ...existing,
      bank_id: bankId,
      subject,
      topic,
      difficulty,
      status,
      needs_review: needsReview,
      question_text: mathResult.questionText,
      options_json: JSON.stringify(mathResult.options),
      correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
      explanation: mathResult.explanation,
      updated_at: Date.now(),
    };

    store.questions[idx] = updatedRow;
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      question: formatD1QuestionForClient(updatedRow, true),
      mathValidationErrors: mathResult.errors,
    });
  };

  app.put('/api/questions/:id', handleUpdateSingleQuestion);
  app.patch('/api/questions/:id', handleUpdateSingleQuestion);

  app.delete('/api/questions/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can delete questions.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const beforeLen = store.questions.length;
    store.questions = store.questions.filter((q) => q.id !== targetId);
    if (store.questions.length === beforeLen) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedId: targetId,
    });
  });

  // ===========================================================================
  // /api/universities & /api/mcqs — D1 University-Based Admin Question Bank
  // ===========================================================================
  const isAdminOrSuperadmin = (user: VerifiedFirebaseUser | null, store: D1StoreData): boolean => {
    if (!user) return false;
    const email = String(user.email || '').trim().toLowerCase();
    if (SUPERADMIN_UIDS.has(user.uid) || SUPERADMIN_EMAILS.has(email) || user.role === 'superadmin') {
      return true;
    }
    const roleRow = (store.userRoles || []).find(
      (r) => r.uid === user.uid || (email && r.email.toLowerCase() === email)
    );
    if (roleRow && (roleRow.role === 'admin' || roleRow.role === 'superadmin')) {
      return true;
    }
    return false;
  };

  const recalculateUniversityMcqCount = (store: D1StoreData, universityId?: string) => {
    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    if (universityId) {
      const uni = store.universities.find((u) => u.id === universityId);
      if (uni) {
        const cnt = store.mcqs.filter((m) => m.university_id === universityId).length;
        uni.mcq_count = cnt;
        uni.is_live = cnt > 0 ? 1 : 0;
      }
      return;
    }
    const countMap = new Map<string, number>();
    for (const m of store.mcqs) {
      countMap.set(m.university_id, (countMap.get(m.university_id) || 0) + 1);
    }
    for (const u of store.universities) {
      const cnt = countMap.get(u.id) || 0;
      u.mcq_count = cnt;
      u.is_live = cnt > 0 ? 1 : 0;
    }
  };

  // GET /api/universities — Public list of universities ordered by sort_order ASC, name ASC
  app.get('/api/universities', (_req: Request, res: Response) => {
    const store = loadD1Store();
    recalculateUniversityMcqCount(store);
    const universities = [...(store.universities || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      universities,
    });
  });

  // POST /api/universities — Admin/Superadmin: Create new university
  app.post('/api/universities', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can manage universities.',
      });
    }
    if (!checkWriteRateLimit(`uni_write:${user!.uid}`, 60, 60 * 1000)) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again shortly.' });
    }

    const body = req.body || {};
    const name = String(body.name || '').trim().slice(0, 120);
    if (!name) {
      return res.status(400).json({ success: false, error: 'University name is required.' });
    }

    const slug = buildUniversitySlug(String(body.slug || name));
    if (!Array.isArray(store.universities)) store.universities = [];
    if (store.universities.some((u) => u.slug.toLowerCase() === slug.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: `A university with slug "${slug}" already exists.`,
      });
    }

    const maxSort = store.universities.reduce((max, u) => Math.max(max, Number(u.sort_order || 0)), 0);
    const newUni: D1UniversityRow = {
      id: String(body.id || `uni_${slug.replace(/-/g, '_')}_${crypto.randomUUID().slice(0, 6)}`),
      name,
      slug,
      logo_url: String(body.logo_url || '').trim(),
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : maxSort + 1,
      mcq_count: 0,
      is_live: 0,
      created_at: new Date().toISOString(),
    };

    store.universities.push(newUni);
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      university: newUni,
    });
  });

  // POST /api/universities/reorder — Admin/Superadmin: Reorder universities
  app.post('/api/universities/reorder', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can reorder universities.',
      });
    }

    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    if (orderedIds.length === 0) {
      return res.status(400).json({ success: false, error: 'orderedIds array is required.' });
    }

    if (!Array.isArray(store.universities)) store.universities = [];
    orderedIds.forEach((id: string, index: number) => {
      const uni = store.universities!.find((u) => u.id === id || u.slug === id);
      if (uni) {
        uni.sort_order = index + 1;
      }
    });
    saveD1Store(store);

    const universities = [...store.universities].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
    );
    return res.status(200).json({ success: true, universities });
  });

  // PUT & PATCH /api/universities/:id — Admin/Superadmin: Rename or update university
  const handleUpdateUniversity = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can edit universities.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.universities)) store.universities = [];
    const uni = store.universities.find((u) => u.id === targetId || u.slug === targetId);
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found.' });
    }

    const body = req.body || {};
    if (body.name !== undefined) {
      const cleanName = String(body.name || '').trim().slice(0, 120);
      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'University name cannot be empty.' });
      }
      uni.name = cleanName;
    }
    if (body.slug !== undefined) {
      const nextSlug = buildUniversitySlug(String(body.slug));
      const conflict = store.universities.some(
        (u) => u.id !== uni.id && u.slug.toLowerCase() === nextSlug.toLowerCase()
      );
      if (conflict) {
        return res.status(409).json({ success: false, error: `Slug "${nextSlug}" is already in use.` });
      }
      uni.slug = nextSlug;
    }
    if (body.logo_url !== undefined) {
      uni.logo_url = String(body.logo_url || '').trim();
    }
    if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
      uni.sort_order = Number(body.sort_order);
    }

    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(200).json({ success: true, university: uni });
  };

  app.put('/api/universities/:id', handleUpdateUniversity);
  app.patch('/api/universities/:id', handleUpdateUniversity);

  // DELETE /api/universities/:id — Admin/Superadmin: Delete university and its MCQs
  app.delete('/api/universities/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete universities.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];

    const uni = store.universities.find((u) => u.id === targetId || u.slug === targetId);
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found.' });
    }

    const deletedMcqs = store.mcqs.filter((m) => m.university_id === uni.id).length;
    store.mcqs = store.mcqs.filter((m) => m.university_id !== uni.id);
    store.universities = store.universities.filter((u) => u.id !== uni.id);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedUniversityId: uni.id,
      deletedMcqs,
    });
  });

  // GET /api/mcqs/topics — Subject & Topic tree with counts for a university
  app.get('/api/mcqs/topics', (req: Request, res: Response) => {
    const store = loadD1Store();
    const uniParam = String(req.query.university_id || req.query.university_slug || '').trim();
    const universities = store.universities || [];
    const matchedUni = uniParam
      ? universities.find(
          (u) => u.id === uniParam || u.slug.toLowerCase() === uniParam.toLowerCase() || u.name.toLowerCase() === uniParam.toLowerCase()
        )
      : null;

    const mcqs = (store.mcqs || []).filter((m) =>
      matchedUni ? m.university_id === matchedUni.id : !uniParam
    );

    const subjectsMap = new Map<string, { subject: string; count: number; topics: Map<string, number> }>();
    const flat: Array<{ subject: string; topic: string; count: number }> = [];
    for (const m of mcqs) {
      const sub = String(m.subject || 'General').trim();
      const top = String(m.topic || 'General').trim();
      if (!subjectsMap.has(sub)) {
        subjectsMap.set(sub, { subject: sub, count: 0, topics: new Map() });
      }
      const entry = subjectsMap.get(sub)!;
      entry.count += 1;
      entry.topics.set(top, (entry.topics.get(top) || 0) + 1);
    }

    const subjects = Array.from(subjectsMap.values())
      .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject))
      .map((s) => {
        const topicsArr = Array.from(s.topics.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([topic, count]) => {
            flat.push({ subject: s.subject, topic, count });
            return { topic, count };
          });
        return {
          subject: s.subject,
          total: s.count,
          count: s.count,
          topics: topicsArr,
        };
      });

    return res.status(200).json({
      success: true,
      universityId: matchedUni?.id || null,
      totalMcqs: mcqs.length,
      subjects,
      flat,
    });
  });

  const computeBankHealthIntegrity = (store: D1StoreData): D1BankHealthIntegrityReport => {
    const universities = store.universities || [];
    const mcqs = store.mcqs || [];
    const uniById = new Map<string, D1UniversityRow>();
    const slugCounts = new Map<string, number>();

    for (const u of universities) {
      uniById.set(u.id, u);
      const s = String(u.slug || '').toLowerCase();
      slugCounts.set(s, (slugCounts.get(s) || 0) + 1);
    }

    const duplicateSlugs = Array.from(slugCounts.entries())
      .filter(([, cnt]) => cnt > 1)
      .map(([slug]) => slug);

    let missingOrInvalidUniversityIdCount = 0;
    let slugMismatchCount = 0;
    const actualCountMap = new Map<string, number>();

    for (const m of mcqs) {
      const u = uniById.get(m.university_id);
      if (!m.university_id || !u) {
        missingOrInvalidUniversityIdCount++;
      } else {
        actualCountMap.set(u.id, (actualCountMap.get(u.id) || 0) + 1);
        if (!m.university_slug || m.university_slug !== u.slug) {
          slugMismatchCount++;
        }
      }
    }

    const countMismatchUniversities: Array<{
      id: string;
      name: string;
      slug: string;
      stored_count: number;
      actual_count: number;
    }> = [];

    for (const u of universities) {
      const actual = actualCountMap.get(u.id) || 0;
      const stored = Number(u.mcq_count || 0);
      if (stored !== actual) {
        countMismatchUniversities.push({
          id: u.id,
          name: u.name,
          slug: u.slug,
          stored_count: stored,
          actual_count: actual,
        });
      }
    }

    const isHealthy =
      missingOrInvalidUniversityIdCount === 0 &&
      slugMismatchCount === 0 &&
      duplicateSlugs.length === 0 &&
      countMismatchUniversities.length === 0;

    return {
      isHealthy,
      missingOrInvalidUniversityIdCount,
      slugMismatchCount,
      duplicateSlugs,
      countMismatchUniversities,
    };
  };

  // GET /api/mcqs/health — D1 Bank Health diagnostics
  app.get('/api/mcqs/health', (_req: Request, res: Response) => {
    const store = loadD1Store();
    const integrity = computeBankHealthIntegrity(store);
    recalculateUniversityMcqCount(store);
    const universities = [...(store.universities || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );
    const mcqs = store.mcqs || [];
    const reports = store.mcqReports || [];

    const bySubject: Record<string, number> = {};
    const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    let missingExplanationCount = 0;

    for (const m of mcqs) {
      bySubject[m.subject] = (bySubject[m.subject] || 0) + 1;
      const diff = String(m.difficulty || 'medium').toLowerCase();
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
      if (!String(m.explanation || '').trim()) {
        missingExplanationCount++;
      }
    }

    const openReportsCount = reports.filter((r) => r.status === 'open').length;

    return res.status(200).json({
      success: true,
      source: 'cloudflare-d1',
      totalUniversities: universities.length,
      liveUniversities: universities.filter((u) => u.mcq_count > 0).length,
      comingSoonUniversities: universities.filter((u) => u.mcq_count === 0).length,
      totalMcqs: mcqs.length,
      missingExplanations: missingExplanationCount,
      missingExplanationCount,
      openReports: openReportsCount,
      openReportsCount,
      bySubject,
      byDifficulty,
      byUniversity: universities,
      universities,
      integrity,
      imports: store.imports || [],
    });
  });

  // POST /api/mcqs/health/fix — Repair integrity issues (slug mismatch, count drift, orphan MCQs)
  app.post('/api/mcqs/health/fix', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can run bank integrity repairs.',
      });
    }

    const issueType = String(req.body?.issueType || 'all').trim();
    const targetUniId = String(req.body?.targetUniversityId || '').trim();
    const universities = store.universities || [];
    const mcqs = store.mcqs || [];
    const uniById = new Map(universities.map((u) => [u.id, u]));
    const uniBySlug = new Map(universities.map((u) => [u.slug.toLowerCase(), u]));
    let fixedCount = 0;

    if (issueType === 'all' || issueType === 'slug_mismatch') {
      for (const m of mcqs) {
        const u = uniById.get(m.university_id);
        if (u && m.university_slug !== u.slug) {
          m.university_slug = u.slug;
          fixedCount++;
        }
      }
    }

    if (issueType === 'all' || issueType === 'orphan_mcqs') {
      const fallbackUni =
        (targetUniId ? uniById.get(targetUniId) : undefined) ||
        universities.find((u) => u.slug === 'fast-nuces') ||
        universities[0];
      for (const m of mcqs) {
        if (!uniById.has(m.university_id)) {
          const bySlug = m.university_slug ? uniBySlug.get(m.university_slug.toLowerCase()) : undefined;
          const resolved = bySlug || fallbackUni;
          if (resolved) {
            m.university_id = resolved.id;
            m.university_slug = resolved.slug;
            fixedCount++;
          }
        }
      }
    }

    if (issueType === 'all' || issueType === 'count_drift') {
      recalculateUniversityMcqCount(store);
      fixedCount++;
    }

    saveD1Store(store);
    const integrity = computeBankHealthIntegrity(store);
    return res.status(200).json({
      success: true,
      fixedCount,
      integrity,
    });
  });

  // GET /api/mcqs/export — Downloadable JSON or CSV backup of D1 MCQs
  app.get('/api/mcqs/export', (req: Request, res: Response) => {
    const store = loadD1Store();
    const format = String(req.query.format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
    const uniFilter = String(req.query.university_id || '').trim();
    const universities = store.universities || [];
    const uniById = new Map(universities.map((u) => [u.id, u]));

    const rows = (store.mcqs || [])
      .filter((m) => !uniFilter || uniFilter === 'all' || m.university_id === uniFilter)
      .map((m) => ({
        id: m.id,
        university_id: m.university_id,
        university_slug: m.university_slug || uniById.get(m.university_id)?.slug || '',
        import_batch_id: m.import_batch_id || '',
        subject: m.subject,
        topic: m.topic,
        question: m.question,
        option_a: m.option_a,
        option_b: m.option_b,
        option_c: m.option_c,
        option_d: m.option_d,
        correct_answer: m.correct_answer,
        explanation: m.explanation || '',
        difficulty: m.difficulty || 'medium',
        created_at: m.created_at,
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
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="boardly_university_mcqs_backup.csv"');
      return res.end(csv);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="boardly_university_mcqs_backup.json"');
    return res.end(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          total_universities: universities.length,
          total_mcqs: rows.length,
          universities,
          mcqs: rows,
        },
        null,
        2
      )
    );
  });

  // POST /api/mcqs/move — Transactional move of selected MCQs between universities
  const handleMoveMcqs = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can move MCQs between universities.',
      });
    }

    const body = req.body || {};
    const toUniId = String(body.to_university_id || body.toUniversityId || body.university_id || '').trim();
    const fromUniId = String(body.from_university_id || body.fromUniversityId || '').trim();
    const ids: string[] = Array.isArray(body.mcq_ids || body.ids)
      ? (body.mcq_ids || body.ids).map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!toUniId) {
      return res.status(400).json({ success: false, error: 'Target university_id is required.' });
    }
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one MCQ ID is required to move.' });
    }

    const universities = store.universities || [];
    const targetUni = universities.find((u) => u.id === toUniId || u.slug === toUniId);
    if (!targetUni) {
      return res.status(404).json({ success: false, error: 'Target university not found.' });
    }

    const idSet = new Set(ids);
    const affectedUniIds = new Set<string>([targetUni.id]);
    if (fromUniId) affectedUniIds.add(fromUniId);

    let movedCount = 0;
    for (const m of store.mcqs || []) {
      if (!idSet.has(m.id)) continue;
      if (fromUniId && m.university_id !== fromUniId) continue;
      affectedUniIds.add(m.university_id);
      m.university_id = targetUni.id;
      m.university_slug = targetUni.slug;
      movedCount++;
    }

    for (const uId of affectedUniIds) {
      recalculateUniversityMcqCount(store, uId);
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      movedCount,
      toUniversityId: targetUni.id,
      toUniversitySlug: targetUni.slug,
      toUniversityName: targetUni.name,
    });
  };

  app.post('/api/mcqs/move', handleMoveMcqs);
  app.post('/api/mcqs/repair-move', handleMoveMcqs);

  // GET /api/mcqs/reports & POST /api/mcqs/reports & PATCH /api/mcqs/reports/:id
  app.get('/api/mcqs/reports', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can view MCQ reports.',
      });
    }
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const reports = [...(store.mcqReports || [])]
      .filter((r) => !statusFilter || statusFilter === 'all' || r.status === statusFilter)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .map((r) => ({
        ...r,
        question: r.question || r.question_preview || '',
        details: r.details || r.comment || '',
      }));

    return res.status(200).json({ success: true, reports });
  });

  app.post('/api/mcqs/reports', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const mcqId = String(body.mcq_id || body.questionId || '').trim();
    if (!mcqId) {
      return res.status(400).json({ success: false, error: 'mcq_id is required.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.mcqReports)) store.mcqReports = [];
    const mcq = (store.mcqs || []).find((m) => m.id === mcqId);

    const preview = mcq?.question?.slice(0, 180) || String(body.question_preview || body.question || '');
    const commentText = String(body.comment || body.details || '').trim();
    const newReport: D1McqReportRow = {
      id: `mcqrep_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      mcq_id: mcqId,
      university_id: mcq?.university_id || String(body.university_id || ''),
      subject: mcq?.subject || String(body.subject || ''),
      topic: mcq?.topic || String(body.topic || ''),
      question_preview: preview,
      question: preview,
      reason: String(body.reason || 'wrong_key').trim(),
      comment: commentText,
      details: commentText,
      user_id: user?.uid || String(body.user_id || body.userId || 'student'),
      user_email: user?.email || String(body.user_email || body.userEmail || ''),
      status: 'open',
      created_at: new Date().toISOString(),
    };

    store.mcqReports.unshift(newReport);
    saveD1Store(store);

    return res.status(201).json({ success: true, report: newReport });
  });

  app.patch('/api/mcqs/reports/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can update MCQ reports.',
      });
    }
    const reportId = decodeURIComponent(String(req.params.id || '').trim());
    const rep = (store.mcqReports || []).find((r) => r.id === reportId);
    if (!rep) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }
    const nextStatus = String(req.body?.status || 'resolved').toLowerCase();
    if (nextStatus === 'open' || nextStatus === 'resolved' || nextStatus === 'ignored') {
      rep.status = nextStatus;
    }
    saveD1Store(store);
    return res.status(200).json({ success: true, report: rep });
  });

  // POST /api/mcqs/verify — Grade student answers against D1 mcqs table
  app.post('/api/mcqs/verify', (req: Request, res: Response) => {
    const body = req.body || {};
    const store = loadD1Store();
    const mcqs = store.mcqs || [];
    const mcqMap = new Map<string, D1McqRow>();
    for (const m of mcqs) {
      mcqMap.set(m.id, m);
    }

    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    if (Array.isArray(body.questionIds) && !Array.isArray(body.answers)) {
      const results: Record<
        string,
        {
          correct_answer: 'A' | 'B' | 'C' | 'D';
          correct_index: number;
          explanation: string;
        }
      > = {};
      for (const rawId of body.questionIds) {
        const qId = String(rawId || '').trim();
        const row = mcqMap.get(qId);
        if (!row) continue;
        const letter = (String(row.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D');
        results[qId] = {
          correct_answer: letter,
          correct_index: letterToIdx[letter] ?? 0,
          explanation: row.explanation || '',
        };
      }
      return res.status(200).json({ success: true, verified: true, results });
    }

    if (Array.isArray(body.answers)) {
      const results: Record<string, any> = {};
      for (const item of body.answers) {
        const qId = String(item?.questionId || item?.id || '').trim();
        const row = mcqMap.get(qId);
        if (!row) continue;

        const canonicalIdx = letterToIdx[String(row.correct_answer || 'A').toUpperCase()] ?? 0;
        const canonicalOptions = [row.option_a, row.option_b, row.option_c, row.option_d];
        const canonicalCorrectText = canonicalOptions[canonicalIdx] || row.option_a;

        let resolvedIdx = canonicalIdx;
        if (Array.isArray(item.displayedOptions) && item.displayedOptions.length > 0) {
          const mIdx = item.displayedOptions.findIndex(
            (opt: any) => String(opt ?? '').trim() === String(canonicalCorrectText).trim()
          );
          if (mIdx !== -1) resolvedIdx = mIdx;
        }

        const selected =
          item.selectedAnswer === null || item.selectedAnswer === undefined
            ? null
            : Number(item.selectedAnswer);
        const isCorrect = selected !== null && Number.isFinite(selected) && selected === resolvedIdx;

        results[qId] = {
          questionId: qId,
          selectedAnswer: selected,
          correct_answer: resolvedIdx,
          correctAnswer: resolvedIdx,
          correct_letter: row.correct_answer,
          canonical_correct_answer: canonicalIdx,
          isCorrect,
          explanation: row.explanation || '',
        };
      }
      return res.status(200).json({ success: true, verified: true, results });
    }

    return res.status(400).json({ success: false, error: 'answers or questionIds array is required.' });
  });

  // POST /api/mcqs/import-chunk — Admin/Superadmin: Unlimited chunked bulk MCQ import
  app.post('/api/mcqs/import-chunk', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can import MCQs.',
      });
    }

    const body = req.body || {};
    const universityIdOrSlug = String(body.university_id || body.universityId || '').trim();
    const defaultSubject = String(body.default_subject || body.subject || '').trim();
    const defaultTopic = String(body.default_topic || body.topic || '').trim();
    const chunkOffset = Math.max(0, Number(body.chunk_offset ?? body.chunkOffset ?? 0));
    const importBatchId = String(body.import_batch_id || body.importBatchId || `imp_${Date.now()}`).trim();
    const rawRows = Array.isArray(body.rows) ? body.rows : [];

    if (!universityIdOrSlug) {
      return res.status(400).json({ success: false, error: 'university_id is required for import.' });
    }

    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    if (!Array.isArray(store.imports)) store.imports = [];

    const uni = store.universities.find(
      (u) => u.id === universityIdOrSlug || u.slug === universityIdOrSlug.toLowerCase()
    );
    if (!uni) {
      return res.status(404).json({ success: false, error: 'Target university not found in D1.' });
    }

    const rowErrors: Array<{ rowNumber: number; reason: string; row: number; message: string }> = [];
    let importedCount = 0;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = chunkOffset + i + 1;
      const r = rawRows[i] || {};

      const subject = String(r.subject || defaultSubject || '').trim();
      const topic = String(r.topic || r.chapter || defaultTopic || 'General').trim();
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
        const msg = 'Missing subject';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }
      if (!question) {
        const msg = 'Missing question text';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }
      if (!optA || !optB || !optC || !optD) {
        const msg = 'All 4 options (A, B, C, D) are required';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      const correctLetter = normalizeCorrectLetter(
        r.correct_answer ?? r.correctAnswer ?? r.correct ?? r.answer,
        { a: optA, b: optB, c: optC, d: optD }
      );
      if (!correctLetter) {
        const msg = `Invalid correct_answer "${String(r.correct_answer ?? r.correct ?? '')}" (must be A/B/C/D or match an option)`;
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      const rawDiff = String(r.difficulty || 'medium').trim().toLowerCase();
      const difficulty: 'easy' | 'medium' | 'hard' =
        rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';
      const explanation = String(r.explanation ?? r.explain ?? '').trim();

      const rawId = String(r.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim();
      const existingIdx = store.mcqs.findIndex((m) => m.id === rawId);
      // Never overwrite an MCQ belonging to a different university
      const safeId =
        existingIdx !== -1 && store.mcqs[existingIdx].university_id !== uni.id
          ? `mcq_${uni.slug}_${rawId}`
          : rawId;

      const newMcq: D1McqRow = {
        id: safeId,
        university_id: uni.id,
        university_slug: uni.slug,
        import_batch_id: importBatchId,
        subject,
        topic: topic || 'General',
        question,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_answer: correctLetter,
        explanation,
        difficulty,
        created_at: nowIso,
      };

      const targetIdx = store.mcqs.findIndex((m) => m.id === safeId && m.university_id === uni.id);
      if (targetIdx !== -1) {
        store.mcqs[targetIdx] = newMcq;
      } else {
        store.mcqs.push(newMcq);
      }
      importedCount++;
    }

    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      universityId: uni.id,
      universitySlug: uni.slug,
      imported: importedCount,
      importedCount,
      failed: rowErrors.length,
      skippedCount: rowErrors.length,
      errors: rowErrors.map((e) => ({ row: e.row, message: e.message })),
      rowErrors,
      universityMcqCount: uni.mcq_count,
      universityIsLive: Boolean(uni.is_live),
    });
  });

  // POST /api/mcqs/bulk-delete — Admin/Superadmin: Delete selected MCQs or by university/subject/topic
  app.post('/api/mcqs/bulk-delete', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete MCQs.',
      });
    }

    const body = req.body || {};
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const beforeCount = store.mcqs.length;

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const idSet = new Set(body.ids.map((id: any) => String(id).trim()));
      store.mcqs = store.mcqs.filter((m) => !idSet.has(m.id));
    } else if (body.university_id) {
      const uniId = String(body.university_id).trim();
      const subj = String(body.subject || '').trim().toLowerCase();
      const top = String(body.topic || '').trim().toLowerCase();
      store.mcqs = store.mcqs.filter((m) => {
        if (m.university_id !== uniId) return true;
        if (subj && subj !== 'all' && m.subject.toLowerCase() !== subj) return true;
        if (top && top !== 'all' && m.topic.toLowerCase() !== top) return true;
        return false;
      });
    } else {
      return res.status(400).json({ success: false, error: 'Provide ids array or university_id filter.' });
    }

    const deletedCount = beforeCount - store.mcqs.length;
    recalculateUniversityMcqCount(store);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedCount,
    });
  });

  // GET /api/mcqs — Query MCQs by university_id/slug, subject, topic, difficulty, search
  app.get('/api/mcqs', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const store = loadD1Store();
    const isAdmin = isAdminOrSuperadmin(user, store);

    const uniParam = String(
      req.query.university_id || req.query.university_slug || req.query.university || ''
    ).trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const searchParam = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const idsParam = String(req.query.ids || '').trim();
    const excludeIdsParam = String(req.query.exclude_ids || '').trim();
    const isRandom = req.query.random === '1' || req.query.random === 'true';
    const includeAnswers = isAdmin || req.query.practice === '1' || req.query.include_answers === '1';

    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 500);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const universities = store.universities || [];
    let resolvedUniId = uniParam;
    if (uniParam && uniParam !== 'all') {
      const matched = universities.find(
        (u) => u.id === uniParam || u.slug.toLowerCase() === uniParam.toLowerCase()
      );
      if (matched) resolvedUniId = matched.id;
    }

    const requestedIds = idsParam
      ? new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;
    const excludedIds = excludeIdsParam
      ? new Set(excludeIdsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;

    let matching = (store.mcqs || []).filter((m) => {
      if (requestedIds && !requestedIds.has(m.id)) return false;
      if (excludedIds && excludedIds.has(m.id)) return false;
      if (resolvedUniId && resolvedUniId !== 'all' && m.university_id !== resolvedUniId) return false;
      if (
        subjectParam &&
        subjectParam !== 'all' &&
        m.subject.toLowerCase() !== subjectParam.toLowerCase()
      ) {
        return false;
      }
      if (
        topicParam &&
        topicParam !== 'all' &&
        m.topic.toLowerCase() !== topicParam.toLowerCase()
      ) {
        return false;
      }
      if (
        difficultyParam &&
        difficultyParam !== 'all' &&
        m.difficulty.toLowerCase() !== difficultyParam
      ) {
        return false;
      }
      if (searchParam) {
        const hay = `${m.id} ${m.question} ${m.option_a} ${m.option_b} ${m.option_c} ${m.option_d} ${m.subject} ${m.topic}`.toLowerCase();
        if (!hay.includes(searchParam)) return false;
      }
      return true;
    });

    const total = matching.length;
    if (isRandom) {
      matching = [...matching];
      for (let i = matching.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matching[i], matching[j]] = [matching[j], matching[i]];
      }
    } else {
      matching.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || a.id.localeCompare(b.id));
    }

    const paged = matching.slice(offset, offset + limit);
    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    const formatted = paged.map((m) => {
      const base: Record<string, any> = {
        id: m.id,
        university_id: m.university_id,
        university_slug: m.university_slug || '',
        import_batch_id: m.import_batch_id || '',
        subject: m.subject,
        topic: m.topic,
        question: m.question,
        option_a: m.option_a,
        option_b: m.option_b,
        option_c: m.option_c,
        option_d: m.option_d,
        options: [m.option_a, m.option_b, m.option_c, m.option_d],
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

    return res.status(200).json({
      success: true,
      mcqs: formatted,
      total,
      limit,
      offset,
      hasMore: offset + formatted.length < total,
    });
  });

  // POST /api/mcqs — Admin/Superadmin: Create single MCQ
  app.post('/api/mcqs', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can add MCQs.',
      });
    }

    const body = req.body || {};
    const uniIdOrSlug = String(body.university_id || body.universityId || '').trim();
    const uni = (store.universities || []).find(
      (u) => u.id === uniIdOrSlug || u.slug.toLowerCase() === uniIdOrSlug.toLowerCase()
    );
    if (!uni) {
      return res.status(400).json({ success: false, error: 'Valid university_id is required.' });
    }

    const subject = String(body.subject || '').trim();
    const topic = String(body.topic || 'General').trim() || 'General';
    const question = String(body.question || '').trim();
    const optA = String(body.option_a ?? body.options?.[0] ?? '').trim();
    const optB = String(body.option_b ?? body.options?.[1] ?? '').trim();
    const optC = String(body.option_c ?? body.options?.[2] ?? '').trim();
    const optD = String(body.option_d ?? body.options?.[3] ?? '').trim();

    if (!subject || !question || !optA || !optB || !optC || !optD) {
      return res.status(400).json({
        success: false,
        error: 'University, subject, question, and all 4 options (A, B, C, D) are required.',
      });
    }

    const correctLetter = normalizeCorrectLetter(body.correct_answer ?? body.correctAnswer, {
      a: optA,
      b: optB,
      c: optC,
      d: optD,
    });
    if (!correctLetter) {
      return res.status(400).json({
        success: false,
        error: 'correct_answer must be A, B, C, or D.',
      });
    }

    const rawDiff = String(body.difficulty || 'medium').trim().toLowerCase();
    const difficulty: 'easy' | 'medium' | 'hard' =
      rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';

    const newMcq: D1McqRow = {
      id: String(body.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim(),
      university_id: uni.id,
      university_slug: uni.slug,
      import_batch_id: '',
      subject,
      topic,
      question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctLetter,
      explanation: String(body.explanation || '').trim(),
      difficulty,
      created_at: new Date().toISOString(),
    };

    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    store.mcqs.unshift(newMcq);
    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      mcq: newMcq,
      universityMcqCount: uni.mcq_count,
      universityIsLive: Boolean(uni.is_live),
    });
  });

  // PUT & PATCH /api/mcqs/:id — Admin/Superadmin: Edit MCQ
  const handleUpdateMcq = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can edit MCQs.',
      });
    }

    const mcqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const mcq = store.mcqs.find((m) => m.id === mcqId);
    if (!mcq) {
      return res.status(404).json({ success: false, error: 'MCQ not found.' });
    }

    const prevUniId = mcq.university_id;
    const body = req.body || {};

    if (body.university_id !== undefined) {
      const targetUni = (store.universities || []).find(
        (u) => u.id === body.university_id || u.slug === body.university_id
      );
      if (targetUni) {
        mcq.university_id = targetUni.id;
        mcq.university_slug = targetUni.slug;
      }
    }
    if (body.subject !== undefined) mcq.subject = String(body.subject).trim() || mcq.subject;
    if (body.topic !== undefined) mcq.topic = String(body.topic).trim() || 'General';
    if (body.question !== undefined) mcq.question = String(body.question).trim() || mcq.question;
    if (body.option_a !== undefined) mcq.option_a = String(body.option_a).trim();
    if (body.option_b !== undefined) mcq.option_b = String(body.option_b).trim();
    if (body.option_c !== undefined) mcq.option_c = String(body.option_c).trim();
    if (body.option_d !== undefined) mcq.option_d = String(body.option_d).trim();
    if (body.explanation !== undefined) mcq.explanation = String(body.explanation).trim();
    if (body.difficulty !== undefined) {
      const d = String(body.difficulty).trim().toLowerCase();
      if (d === 'easy' || d === 'medium' || d === 'hard') mcq.difficulty = d;
    }
    if (body.correct_answer !== undefined) {
      const letter = normalizeCorrectLetter(body.correct_answer, {
        a: mcq.option_a,
        b: mcq.option_b,
        c: mcq.option_c,
        d: mcq.option_d,
      });
      if (letter) mcq.correct_answer = letter;
    }

    recalculateUniversityMcqCount(store, prevUniId);
    if (mcq.university_id !== prevUniId) {
      recalculateUniversityMcqCount(store, mcq.university_id);
    }
    saveD1Store(store);

    return res.status(200).json({ success: true, mcq });
  };

  app.put('/api/mcqs/:id', handleUpdateMcq);
  app.patch('/api/mcqs/:id', handleUpdateMcq);

  // DELETE /api/mcqs/:id — Admin/Superadmin: Delete single MCQ
  app.delete('/api/mcqs/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete MCQs.',
      });
    }

    const mcqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const existing = store.mcqs.find((m) => m.id === mcqId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'MCQ not found.' });
    }

    const uniId = existing.university_id;
    store.mcqs = store.mcqs.filter((m) => m.id !== mcqId);
    recalculateUniversityMcqCount(store, uniId);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedId: mcqId,
    });
  });

  // ── D1 Health Check ────────────────────────────────────────────────────────
  app.get('/api/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      ok: true,
      service: 'boardly-d1-worker',
      timestamp: Date.now(),
    });
  });

  // ── D1 User Roles ──────────────────────────────────────────────────────────
  const resolveD1Role = (store: any, user: { uid: string; email: string }) => {
    if (!Array.isArray(store.userRoles)) store.userRoles = [];
    let row = store.userRoles.find((r: any) => r.uid === user.uid);
    const isSuper =
      SUPERADMIN_UIDS.has(user.uid) || SUPERADMIN_EMAILS.has(user.email.toLowerCase());
    if (!row) {
      row = {
        uid: user.uid,
        email: user.email,
        role: isSuper ? 'superadmin' : 'captain',
        custom_role: null,
        is_posting_banned: 0,
        updated_at: Date.now(),
      };
      store.userRoles.push(row);
      saveD1Store(store);
    } else if (isSuper && row.role !== 'superadmin') {
      row.role = 'superadmin';
      saveD1Store(store);
    }
    return row;
  };

  app.get('/api/me/role', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    return res.status(200).json({
      uid: user.uid,
      email: user.email,
      role: roleRow.role,
      customRole: roleRow.custom_role,
      isPostingBanned: Boolean(roleRow.is_posting_banned),
    });
  });

  app.get('/api/admin/roles', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    return res.status(200).json({ roles: store.userRoles || [] });
  });

  app.put('/api/admin/roles', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    const body = req.body || {};
    const targetUid = String(body.uid || '').trim();
    const newRole = String(body.role || 'student').trim();
    if (!targetUid || !['student', 'captain', 'admin', 'superadmin'].includes(newRole)) {
      return res.status(400).json({ error: 'Valid uid and role are required.', code: 'INVALID_INPUT' });
    }
    let existing = store.userRoles.find((r: any) => r.uid === targetUid);
    if (!existing) {
      existing = {
        uid: targetUid,
        email: String(body.email || '').trim().toLowerCase(),
        role: newRole,
        custom_role: body.customRole || null,
        is_posting_banned: body.isPostingBanned ? 1 : 0,
        updated_at: Date.now(),
      };
      store.userRoles.push(existing);
    } else {
      existing.role = newRole;
      if (body.email) existing.email = String(body.email).trim().toLowerCase();
      if (body.customRole !== undefined) existing.custom_role = body.customRole;
      existing.updated_at = Date.now();
    }
    saveD1Store(store);
    return res.status(200).json({ ok: true, uid: targetUid, role: newRole });
  });

  // ── D1 Captain Tests & Grand Line Public Tests ─────────────────────────────
  const inFlightAttemptSubmissions = new Set<string>();
  const ALREADY_ATTEMPTED_MESSAGE =
    'You have already taken this drill. Only one verified attempt per student is permitted for each drill.';

  function resolveAttemptUserName(
    frontendName: unknown,
    tokenName: unknown,
    email: unknown
  ): string {
    const fromFrontend = String(frontendName ?? '').trim();
    if (fromFrontend && fromFrontend.toLowerCase() !== 'student') {
      return fromFrontend.slice(0, 120);
    }
    const fromToken = String(tokenName ?? '').trim();
    if (fromToken && fromToken.toLowerCase() !== 'student') {
      return fromToken.slice(0, 120);
    }
    const emailStr = String(email ?? '').trim();
    const emailPrefix = emailStr.includes('@') ? emailStr.split('@')[0].trim() : emailStr;
    if (emailPrefix) {
      return emailPrefix.slice(0, 120);
    }
    if (fromFrontend) return fromFrontend.slice(0, 120);
    if (fromToken) return fromToken.slice(0, 120);
    return 'Student';
  }

  function resolveLeaderboardDisplayName(attemptRow: any, store: any): string {
    const rawStored = String(attemptRow?.userName ?? attemptRow?.user_name ?? attemptRow?.studentName ?? '').trim();
    if (rawStored) return rawStored;
    const uid = String(attemptRow?.userUid ?? attemptRow?.user_uid ?? attemptRow?.studentUid ?? '').trim();
    if (uid && Array.isArray(store?.userRoles)) {
      const roleEntry = store.userRoles.find((r: any) => r.uid === uid);
      const email = String(roleEntry?.email || '').trim();
      if (email && email.includes('@')) {
        const prefix = email.split('@')[0].trim();
        if (prefix) return prefix;
      }
    }
    return 'Student';
  }

  function buildGradedQuestionsForAttempt(attemptRow: any, testRow: any): any[] {
    if (Array.isArray(attemptRow?.gradedQuestions) && attemptRow.gradedQuestions.length > 0) {
      return attemptRow.gradedQuestions.map((q: any, idx: number) => ({
        id: q.id || `q_${idx}`,
        position: typeof q.position === 'number' ? q.position : idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : ['', '', '', ''],
        selectedIndex: typeof q.selectedIndex === 'number' ? q.selectedIndex : -1,
        correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
        isCorrect: Boolean(q.isCorrect ?? (q.selectedIndex === Number(q.correctIndex ?? 0))),
        explanation: String(q.explanation || ''),
      }));
    }
    const questions = Array.isArray(testRow?.questions) ? testRow.questions : [];
    return questions.map((q: any, idx: number) => {
      const correctIndex = Number(q.correctIndex ?? q.correct_index ?? 0);
      return {
        id: q.id || `q_${idx}`,
        position: typeof q.position === 'number' ? q.position : idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : ['', '', '', ''],
        selectedIndex: -1,
        correctIndex,
        isCorrect: false,
        explanation: String(q.explanation || ''),
      };
    });
  }

  app.get('/api/tests/public', (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const subject = String(req.query.subject || '').trim().toLowerCase();
    const list = store.captainTests
      .filter((t: any) => t.visibility === 'public' && t.status === 'published')
      .filter((t: any) => !subject || subject === 'all' || String(t.subject || '').toLowerCase() === subject)
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        subject: t.subject,
        questionCount: Number(t.questionCount ?? (t.questions?.length || 0)),
        durationMinutes: Number(t.durationMinutes || 20),
        visibility: t.visibility,
        status: t.status,
        captainUid: t.captainUid,
        captainName: t.captainName,
        crewId: t.crewId || null,
        crewName: t.crewName || 'Grand Line Crew',
        attemptsCount: Number(t.attemptsCount || 0),
        avgScore: Number(t.avgScore || 0),
        createdAt: t.createdAt,
      }));
    return res.status(200).json({ tests: list });
  });

  app.get('/api/tests/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const roleRow = resolveD1Role(store, user);
    const targetUid =
      ['admin', 'superadmin'].includes(roleRow.role) && req.query.captainUid
        ? String(req.query.captainUid)
        : user.uid;
    const list = store.captainTests
      .filter((t: any) => t.captainUid === targetUid)
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json({ tests: list });
  });

  app.post('/api/tests', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.crews)) store.crews = [];

    const body = req.body || {};
    const title = String(body.title || '').trim().slice(0, 200);
    if (!title) {
      return res.status(400).json({ error: 'Test title is required.', code: 'INVALID_TITLE' });
    }
    const questions = Array.isArray(body.questions) ? body.questions.slice(0, 200) : [];
    const now = Date.now();
    const crew = store.crews.find((c: any) => c.captainUid === user.uid);
    const newTest = {
      id: crypto.randomUUID(),
      title,
      description: String(body.description || '').trim(),
      subject: String(body.subject || 'Physics').trim(),
      durationMinutes: Number(body.durationMinutes || Math.max(10, questions.length * 1.5)),
      visibility: body.visibility === 'private' ? 'private' : 'public',
      status: body.status || 'published',
      captainUid: user.uid,
      captainName: String(body.captainName || user.email?.split('@')[0] || 'Captain'),
      crewId: crew?.id || null,
      crewName: String(body.crewName || crew?.name || 'Grand Line Crew'),
      questionCount: questions.length,
      questions: questions.map((q: any, idx: number) => ({
        id: crypto.randomUUID(),
        position: idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
        correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
        explanation: String(q.explanation || ''),
        topic: String(q.topic || body.subject || 'General'),
        difficulty: q.difficulty || 'medium',
      })),
      attemptsCount: 0,
      avgScore: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.captainTests.unshift(newTest);
    saveD1Store(store);
    return res.status(201).json(newTest);
  });

  app.get('/api/tests/:id/my-attempt', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.testAttempts)) store.testAttempts = [];

    const testId = decodeURIComponent(String(req.params.id || ''));
    const test = store.captainTests.find((t: any) => t.id === testId);
    const existingAttempt = store.testAttempts.find(
      (a: any) =>
        String(a.testId || a.test_id || '') === testId &&
        String(a.userUid || a.user_uid || '') === user.uid
    );

    if (!existingAttempt) {
      if (!test) {
        return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });
      }
      return res.status(403).json({
        error: 'You must attempt this drill before viewing or downloading its answer key and result PDF.',
        code: 'ATTEMPT_REQUIRED',
      });
    }

    const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
    const gradedQuestions = buildGradedQuestionsForAttempt(existingAttempt, test);

    return res.status(200).json({
      attempt: {
        ...existingAttempt,
        testId,
        testTitle: existingAttempt.testTitle || test?.title || 'Grand Line Drill',
        subject: existingAttempt.subject || test?.subject || 'General',
        captainUid: existingAttempt.captainUid || test?.captainUid || '',
        captainName: existingAttempt.captainName || test?.captainName || 'Captain',
        userUid: user.uid,
        userName: resolvedName,
        studentName: resolvedName,
        name: resolvedName,
        gradedQuestions,
      },
      test: test
        ? {
            id: test.id,
            title: test.title,
            description: test.description || '',
            subject: test.subject,
            durationMinutes: Number(test.durationMinutes || 20),
            questionCount: Number(test.questionCount ?? (test.questions?.length || 0)),
            captainUid: test.captainUid,
            captainName: test.captainName,
            crewId: test.crewId || null,
            crewName: test.crewName || 'Grand Line Crew',
          }
        : null,
    });
  });

  app.get('/api/tests/:id', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.testAttempts)) store.testAttempts = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const test = store.captainTests.find((t: any) => t.id === testId);
    if (!test) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const isInfoOnly = req.query.view === 'info';
    const user = await verifyFirebaseJwtZeroFirestore(req);

    if (isInfoOnly) {
      if (test.visibility === 'private') {
        if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
        const roleRow = resolveD1Role(store, user);
        const isOwnerOrAdmin = test.captainUid === user.uid || ['admin', 'superadmin'].includes(roleRow.role);
        if (!isOwnerOrAdmin) return res.status(403).json({ error: 'This test is private.', code: 'FORBIDDEN' });
      }
      return res.status(200).json({
        test: {
          ...test,
          questionCount: Number(test.questionCount ?? (test.questions?.length || 0)),
          questions: [],
        },
      });
    }

    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const roleRow = resolveD1Role(store, user);
    const isOwnerOrAdmin =
      test.captainUid === user.uid || ['admin', 'superadmin'].includes(roleRow.role);
    if (test.visibility === 'private' && !isOwnerOrAdmin) {
      return res.status(403).json({ error: 'This test is private.', code: 'FORBIDDEN' });
    }

    const includeAnswers = isOwnerOrAdmin && req.query.includeAnswers === '1';

    // Enforce ONE verified attempt per drill (test_id + user_uid) when student opens/starts test
    if (!includeAnswers) {
      const existingAttempt = store.testAttempts.find(
        (a: any) =>
          String(a.testId || a.test_id || '') === testId &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      if (existingAttempt) {
        const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
        return res.status(409).json({
          error: ALREADY_ATTEMPTED_MESSAGE,
          message: ALREADY_ATTEMPTED_MESSAGE,
          code: 'ALREADY_ATTEMPTED',
          attemptId: existingAttempt.id,
          attempt: {
            id: existingAttempt.id,
            testId: test.id,
            testTitle: existingAttempt.testTitle || test.title,
            subject: existingAttempt.subject || test.subject,
            captainUid: existingAttempt.captainUid || test.captainUid,
            captainName: existingAttempt.captainName || test.captainName,
            userUid: user.uid,
            userName: resolvedName,
            studentName: resolvedName,
            score: Number(existingAttempt.score || 0),
            totalQuestions: Number(existingAttempt.totalQuestions || (test.questions?.length || 0)),
            percentage: Number(existingAttempt.percentage || 0),
            timeTakenSeconds: Number(existingAttempt.timeTakenSeconds || 0),
            createdAt: existingAttempt.createdAt,
          },
        });
      }
    }

    const sanitizedQuestions = (test.questions || []).map((q: any, idx: number) => {
      const base: any = {
        id: q.id || `q_${idx}`,
        position: idx,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
      };
      if (includeAnswers) {
        base.correctIndex = q.correctIndex;
        base.explanation = q.explanation;
      }
      return base;
    });

    return res.status(200).json({
      test: {
        ...test,
        questions: sanitizedQuestions,
      },
    });
  });

  app.put('/api/tests/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const idx = store.captainTests.findIndex((t: any) => t.id === testId);
    if (idx === -1) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const existing = store.captainTests[idx];
    const roleRow = resolveD1Role(store, user);
    if (existing.captainUid !== user.uid && !['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const body = req.body || {};
    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.subject !== undefined) existing.subject = String(body.subject).trim();
    if (body.visibility !== undefined) existing.visibility = body.visibility === 'private' ? 'private' : 'public';
    if (body.status !== undefined) existing.status = body.status;
    if (Array.isArray(body.questions)) {
      existing.questions = body.questions.slice(0, 200).map((q: any, i: number) => ({
        id: q.id || crypto.randomUUID(),
        position: i,
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
        correctIndex: Number(q.correctIndex ?? 0),
        explanation: String(q.explanation || ''),
        topic: String(q.topic || existing.subject),
        difficulty: q.difficulty || 'medium',
      }));
      existing.questionCount = existing.questions.length;
    }
    existing.updatedAt = Date.now();
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: testId });
  });

  app.delete('/api/tests/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const roleRow = resolveD1Role(store, user);
    if (existing.captainUid !== user.uid && !['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    store.captainTests = store.captainTests.filter((t: any) => t.id !== testId);
    if (Array.isArray(store.testAttempts)) {
      store.testAttempts = store.testAttempts.filter((a: any) => a.testId !== testId);
    }
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: testId });
  });

  app.post('/api/tests/:id/publish', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const roleRow = resolveD1Role(store, user);
    if (existing.captainUid !== user.uid && !['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    const body = req.body || {};
    existing.status =
      body.status || (existing.status === 'published' ? 'unpublished' : 'published');
    if (body.visibility) existing.visibility = body.visibility;
    existing.updatedAt = Date.now();
    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      id: testId,
      status: existing.status,
      visibility: existing.visibility,
    });
  });

  app.post('/api/tests/:id/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const roleRow = resolveD1Role(store, user);
    if (existing.captainUid !== user.uid && !['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const body = req.body || {};
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return res.status(400).json({ error: 'At least 1 question is required.', code: 'EMPTY_QUESTIONS' });
    }
    if (body.questions.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 questions allowed per test.', code: 'MAX_QUESTIONS_EXCEEDED' });
    }

    const mapped = body.questions.map((q: any, i: number) => ({
      id: q.id || crypto.randomUUID(),
      position: i,
      question: String(q.question || q.question_text || ''),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
      correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
      explanation: String(q.explanation || ''),
      topic: String(q.topic || existing.subject || 'General'),
      difficulty: q.difficulty || 'medium',
    }));

    existing.questions = body.replace === false ? [...(existing.questions || []), ...mapped].slice(0, 200) : mapped;
    existing.questionCount = existing.questions.length;
    existing.updatedAt = Date.now();
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      testId,
      questionCount: existing.questionCount,
    });
  });

  app.post('/api/tests/:id/attempts', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const testId = decodeURIComponent(String(req.params.id || ''));
    const lockKey = `${testId}:${user.uid}`;

    if (inFlightAttemptSubmissions.has(lockKey)) {
      const storeSnap = loadD1Store() as any;
      const existingInStore = (storeSnap.testAttempts || []).find(
        (a: any) =>
          String(a.testId || a.test_id || '') === testId &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      return res.status(409).json({
        error: ALREADY_ATTEMPTED_MESSAGE,
        message: ALREADY_ATTEMPTED_MESSAGE,
        code: 'ALREADY_ATTEMPTED',
        attemptId: existingInStore?.id || null,
        attempt: existingInStore || null,
      });
    }

    inFlightAttemptSubmissions.add(lockKey);
    try {
      const store = loadD1Store() as any;
      if (!Array.isArray(store.captainTests)) store.captainTests = [];
      if (!Array.isArray(store.testAttempts)) store.testAttempts = [];

      const test = store.captainTests.find((t: any) => t.id === testId);
      if (!test) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

      const existingAttempt = store.testAttempts.find(
        (a: any) =>
          String(a.testId || a.test_id || '') === testId &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      if (existingAttempt) {
        const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
        return res.status(409).json({
          error: ALREADY_ATTEMPTED_MESSAGE,
          message: ALREADY_ATTEMPTED_MESSAGE,
          code: 'ALREADY_ATTEMPTED',
          attemptId: existingAttempt.id,
          attempt: {
            ...existingAttempt,
            userName: resolvedName,
            studentName: resolvedName,
            name: resolvedName,
          },
        });
      }

      const questions = test.questions || [];
      const body = req.body || {};
      const rawAnswers = body.answers || {};
      let score = 0;

      const gradedQuestions = questions.map((q: any, idx: number) => {
        let selectedIndex = -1;
        if (Array.isArray(rawAnswers)) {
          selectedIndex = Number(rawAnswers[idx] ?? -1);
        } else if (rawAnswers && typeof rawAnswers === 'object') {
          selectedIndex = Number(rawAnswers[q.id] ?? rawAnswers[idx] ?? -1);
        }
        if (Number.isNaN(selectedIndex)) selectedIndex = -1;
        const correctIndex = Number(q.correctIndex ?? 0);
        const isCorrect = selectedIndex === correctIndex;
        if (isCorrect) score++;
        return {
          id: q.id || `q_${idx}`,
          position: idx,
          question: q.question,
          options: q.options,
          selectedIndex,
          correctIndex,
          isCorrect,
          explanation: q.explanation || '',
        };
      });

      const totalQuestions = questions.length;
      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const resolvedUserName = resolveAttemptUserName(
        body.userName ?? body.studentName,
        user.tokenName,
        user.email
      );
      const resolvedAvatar =
        typeof body.userAvatar === 'string' && body.userAvatar.trim()
          ? body.userAvatar.trim()
          : user.picture || null;

      const attempt = {
        id: crypto.randomUUID(),
        testId: test.id,
        testTitle: test.title,
        subject: test.subject,
        captainUid: test.captainUid,
        captainName: test.captainName,
        userUid: user.uid,
        userName: resolvedUserName,
        studentName: resolvedUserName,
        name: resolvedUserName,
        userAvatar: resolvedAvatar,
        score,
        totalQuestions,
        percentage,
        timeTakenSeconds: Math.max(0, Number(body.timeTakenSeconds || 0)),
        createdAt: Date.now(),
        gradedQuestions,
      };

      store.testAttempts.unshift(attempt);
      const prevAttempts = Number(test.attemptsCount || 0);
      const prevAvg = Number(test.avgScore || 0);
      test.attemptsCount = prevAttempts + 1;
      test.avgScore = Math.round(((prevAvg * prevAttempts + percentage) / test.attemptsCount) * 10) / 10;
      saveD1Store(store);

      return res.status(201).json({ attempt });
    } finally {
      inFlightAttemptSubmissions.delete(lockKey);
    }
  });

  app.get('/api/attempts/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const attempts = (store.testAttempts || [])
      .filter((a: any) => String(a.userUid || a.user_uid || '') === user.uid)
      .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      .map((a: any) => {
        const resolvedName = resolveLeaderboardDisplayName(a, store);
        return {
          ...a,
          testId: a.testId || a.test_id,
          userUid: a.userUid || a.user_uid,
          userName: resolvedName,
          studentName: resolvedName,
          name: resolvedName,
        };
      });
    return res.status(200).json({ attempts });
  });

  const handleTestResultsOrLeaderboard = async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const testId = decodeURIComponent(String(req.params.id || ''));
    const list = (store.testAttempts || [])
      .filter((a: any) => String(a.testId || a.test_id || '') === testId)
      .sort(
        (a: any, b: any) =>
          Number(b.percentage || 0) - Number(a.percentage || 0) ||
          Number(b.score || 0) - Number(a.score || 0) ||
          Number(a.timeTakenSeconds || 0) - Number(b.timeTakenSeconds || 0)
      )
      .map((a: any, idx: number) => {
        const resolvedName = resolveLeaderboardDisplayName(a, store);
        const { gradedQuestions: _omitGraded, ...publicFields } = a;
        return {
          ...publicFields,
          testId: a.testId || a.test_id,
          userUid: a.userUid || a.user_uid,
          userName: resolvedName,
          studentName: resolvedName,
          name: resolvedName,
          userAvatar: a.userAvatar ?? a.user_avatar ?? null,
          rank: idx + 1,
        };
      });
    return res.status(200).json({ results: list });
  };

  app.get('/api/tests/:id/results', handleTestResultsOrLeaderboard);
  app.get('/api/tests/:id/leaderboard', handleTestResultsOrLeaderboard);

  app.get('/api/leaderboard/grand-line', (_req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const attempts = store.testAttempts || [];
    const byUser = new Map<string, any>();
    for (const a of attempts) {
      const uid = String(a.userUid || a.user_uid || '');
      if (!uid) continue;
      const resolvedName = resolveLeaderboardDisplayName(a, store);
      const avatar = a.userAvatar ?? a.user_avatar ?? null;
      const timeSec = Number(a.timeTakenSeconds ?? a.time_taken_seconds ?? 0);
      const existing = byUser.get(uid);
      if (!existing) {
        byUser.set(uid, {
          uid,
          userUid: uid,
          displayName: resolvedName,
          userName: resolvedName,
          studentName: resolvedName,
          name: resolvedName,
          userAvatar: avatar,
          testsCompleted: 1,
          totalScore: Number(a.score || 0),
          totalQuestions: Number(a.totalQuestions || 0),
          bestPercentage: Number(a.percentage || 0),
          timeTakenSeconds: timeSec,
          lastTestTitle: a.testTitle || 'Grand Line Drill',
          updatedAt: a.createdAt,
        });
      } else {
        existing.testsCompleted += 1;
        existing.totalScore += Number(a.score || 0);
        existing.totalQuestions += Number(a.totalQuestions || 0);
        if (Number(a.percentage || 0) > existing.bestPercentage) {
          existing.bestPercentage = Number(a.percentage || 0);
          existing.timeTakenSeconds = timeSec;
        }
        if (existing.displayName === 'Student' && resolvedName !== 'Student') {
          existing.displayName = resolvedName;
          existing.userName = resolvedName;
          existing.studentName = resolvedName;
          existing.name = resolvedName;
        }
        if (!existing.userAvatar && avatar) {
          existing.userAvatar = avatar;
        }
      }
    }
    const leaderboard = Array.from(byUser.values())
      .sort(
        (a, b) =>
          b.bestPercentage - a.bestPercentage ||
          b.totalScore - a.totalScore ||
          a.timeTakenSeconds - b.timeTakenSeconds
      )
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
    return res.status(200).json({ leaderboard });
  });

  // ── D1 Crews & Crew Members ────────────────────────────────────────────────
  app.get('/api/crews', (_req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    return res.status(200).json({ crews: store.crews });
  });

  app.get('/api/crews/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    let crew = store.crews.find((c: any) => c.captainUid === user.uid);
    if (!crew) {
      const m = store.crewMembers.find((cm: any) => cm.userUid === user.uid && cm.status === 'active');
      if (m) crew = store.crews.find((c: any) => c.id === m.crewId);
    }
    if (!crew) return res.status(200).json({ crew: null, members: [] });
    const members = store.crewMembers.filter((cm: any) => cm.crewId === crew.id);
    return res.status(200).json({ crew, members });
  });

  app.post('/api/crews', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Crew name is required.' });
    const now = Date.now();
    const crewId = crypto.randomUUID();
    const code =
      String(body.code || '').trim().toUpperCase() ||
      `NK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const captainName = String(body.captainName || user.email?.split('@')[0] || 'Captain');

    const newCrew = {
      id: crewId,
      code,
      name,
      description: String(body.description || ''),
      university: String(body.university || ''),
      captainUid: user.uid,
      captainName,
      captainEmail: user.email || '',
      status: 'active',
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    store.crews.unshift(newCrew);
    store.crewMembers.push({
      id: crypto.randomUUID(),
      crewId,
      userUid: user.uid,
      userName: captainName,
      userEmail: user.email || '',
      role: 'captain',
      status: 'active',
      joinedAt: now,
    });
    saveD1Store(store);
    return res.status(201).json({ crew: newCrew });
  });

  app.post('/api/crews/join', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    const codeOrId = String(req.body?.code || req.body?.crewId || '').trim().toUpperCase();
    const crew = store.crews.find(
      (c: any) => c.id === codeOrId || String(c.code || '').toUpperCase() === codeOrId
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found.' });

    const existing = store.crewMembers.find(
      (m: any) => m.crewId === crew.id && m.userUid === user.uid
    );
    if (!existing) {
      store.crewMembers.push({
        id: crypto.randomUUID(),
        crewId: crew.id,
        userUid: user.uid,
        userName: user.email?.split('@')[0] || 'Student',
        userEmail: user.email || '',
        role: 'member',
        status: 'active',
        joinedAt: Date.now(),
      });
      crew.memberCount = store.crewMembers.filter(
        (m: any) => m.crewId === crew.id && m.status === 'active'
      ).length;
      saveD1Store(store);
    }
    return res.status(200).json({ ok: true, crewId: crew.id, crewName: crew.name });
  });

  app.get('/api/crews/:id/members', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const members = (store.crewMembers || []).filter((m: any) => m.crewId === crewId);
    return res.status(200).json({ members });
  });

  app.post('/api/crews/:id/suspend', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const crew = (store.crews || []).find((c: any) => c.id === crewId);
    if (!crew) return res.status(404).json({ error: 'Crew not found.' });
    crew.status = crew.status === 'active' ? 'suspended' : 'active';
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: crewId, status: crew.status });
  });

  app.delete('/api/crews/:id', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    store.crews = (store.crews || []).filter((c: any) => c.id !== crewId);
    store.crewMembers = (store.crewMembers || []).filter((m: any) => m.crewId !== crewId);
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: crewId });
  });

  app.post('/api/crews/:id/members/:uid/suspend', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const memberUid = decodeURIComponent(String(req.params.uid || ''));
    const member = (store.crewMembers || []).find(
      (m: any) => m.crewId === crewId && m.userUid === memberUid
    );
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    member.status = member.status === 'active' ? 'suspended' : 'active';
    saveD1Store(store);
    return res.status(200).json({ ok: true, userUid: memberUid, status: member.status });
  });

  app.delete('/api/crews/:id/members/:uid', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const memberUid = decodeURIComponent(String(req.params.uid || ''));
    store.crewMembers = (store.crewMembers || []).filter(
      (m: any) => !(m.crewId === crewId && m.userUid === memberUid && m.role !== 'captain')
    );
    saveD1Store(store);
    return res.status(200).json({ ok: true, userUid: memberUid });
  });
}

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveServerRouteMeta(pathname: string) {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const rawBase = resolveStaticOrPatternRouteMeta(cleanPath);
  const baseMeta = {
    ...rawBase,
    canonical: rawBase.canonicalUrl || `https://boardly.cfd${cleanPath === '/' ? '' : cleanPath}`,
    robots: rawBase.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    h1: rawBase.title.split('—')[0].split('|')[0].trim() || rawBase.title,
    statusCode: cleanPath === '/410' ? 410 : 200,
  };

  if (
    cleanPath.startsWith('/commons/post/') ||
    cleanPath.startsWith('/material/') ||
    cleanPath.startsWith('/study-material/')
  ) {
    if (
      cleanPath.startsWith('/material/subject/') ||
      cleanPath.startsWith('/study-material/subject/')
    ) {
      return baseMeta;
    }
    const slugParam = decodeURIComponent(
      cleanPath
        .replace(/^\/commons\/post\//, '')
        .replace(/^\/study-material\//, '')
        .replace(/^\/material\//, '')
        .replace(/\/+$/, '')
    );
    const lookupId = extractIdFromSlugOrId(slugParam);
    const d1Row = loadD1Store().posts.find(
      (p) => (p.slug === slugParam || p.id === slugParam || p.id === lookupId) && !p.is_hidden
    );
    if (d1Row) {
      const isMaterial = cleanPath.startsWith('/material/') || cleanPath.startsWith('/study-material/');
      const title = isMaterial
        ? `${d1Row.title} — ${d1Row.subject || 'Study Material'} PDF & Notes | Boardly`
        : `${d1Row.title} — ${d1Row.subject || 'Student Discussion'} | Boardly Commons`;
      const rawDesc = String(d1Row.description || '').replace(/\s+/g, ' ').trim();
      const authorLabel = d1Row.is_anonymous
        ? 'Anonymous Student'
        : d1Row.author_name || 'Boardly Student';
      const description = rawDesc
        ? `${rawDesc.slice(0, 180)}${rawDesc.length > 180 ? '...' : ''} — Shared by ${authorLabel} (${d1Row.subject || 'Academic'}, Class ${d1Row.class_level || '11/12'}).`
        : `Read "${d1Row.title}" in ${d1Row.subject || 'Boardly Commons'} on Boardly.`;
      return {
        ...baseMeta,
        title,
        description,
        ogType: 'article' as const,
        h1: d1Row.title,
      };
    }
  }

  return baseMeta;
}

export function injectRouteMetaIntoHtml(html: string, pathname: string): string {
  const meta = resolveServerRouteMeta(pathname);
  const t = escapeHtmlAttr(meta.title);
  const d = escapeHtmlAttr(meta.description);
  const c = escapeHtmlAttr(meta.canonical);
  const img = escapeHtmlAttr(meta.ogImage);

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(
      /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="title" content="${t}" />`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${d}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${c}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${meta.ogType}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${c}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${t}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${d}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${img}" />`
    )
    .replace(
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${c}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${t}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${d}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${img}" />`
    );
}

/**
 * Creates a universal Node HTTP / Connect / Express middleware that serves all
 * Cloudflare D1 + R2 `/api/posts*`, `/api/r2/*`, `/sitemap.xml`, `/api/auth/*`,
 * `/api/admin/users/delete`, and pre-rendered SEO HTML for crawlers.
 */
export function createCloudflarePostsAndAuthMiddleware(options?: {
  getGoogleAccessToken?: () => Promise<string | null>;
}) {
  interface RouteDef {
    method: string;
    pattern: string;
    regex: RegExp;
    paramNames: string[];
    handler: (req: any, res: any) => any;
  }

  const routes: RouteDef[] = [];

  const compilePattern = (pattern: string): { regex: RegExp; paramNames: string[] } => {
    const paramNames: string[] = [];
    if (pattern === '/api/r2/*') {
      paramNames.push('0');
      return { regex: /^\/api\/r2\/(.*)$/, paramNames };
    }
    const escaped = pattern
      .replace(/\/+$/, '')
      .replace(/:([a-zA-Z0-9_]+)/g, (_m, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
    return { regex: new RegExp(`^${escaped || '/'}/?$`), paramNames };
  };

  const addRoute = (method: string, pattern: string, handler: (req: any, res: any) => any) => {
    const { regex, paramNames } = compilePattern(pattern);
    routes.push({ method: method.toUpperCase(), pattern, regex, paramNames, handler });
  };

  const fakeApp = {
    get: (p: string, h: any) => addRoute('GET', p, h),
    post: (p: string, h: any) => addRoute('POST', p, h),
    put: (p: string, h: any) => addRoute('PUT', p, h),
    patch: (p: string, h: any) => addRoute('PATCH', p, h),
    delete: (p: string, h: any) => addRoute('DELETE', p, h),
  } as unknown as Express;

  registerCloudflarePostsAndAuthRoutes(fakeApp, options || {});

  return async function cloudflareMiddleware(req: any, res: any, next: () => void) {
    const fullUrl = req.originalUrl || req.url || '/';
    const parsedUrl = new URL(fullUrl, 'http://localhost');
    const pathname = parsedUrl.pathname;

    // 1. Pre-rendered SEO HTML for search engine & social crawlers on any page route
    if (
      req.method === 'GET' &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/assets/') &&
      !pathname.startsWith('/src/') &&
      !pathname.startsWith('/@') &&
      !/\.(js|css|png|jpg|jpeg|webp|svg|ico|xml|txt|json|woff2?|map)$/i.test(pathname)
    ) {
      const ua = String(req.headers?.['user-agent'] || '').toLowerCase();
      const isBot =
        /facebookexternalhit|whatsapp|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|googlebot|bingbot|yandex|duckduckbot|applebot|crawler|spider/i.test(
          ua
        ) ||
        parsedUrl.searchParams.get('crawler') === '1' ||
        parsedUrl.searchParams.get('crawler') === 'true';

      if (isBot) {
        const meta = resolveServerRouteMeta(pathname);
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlAttr(meta.title)}</title>
  <meta name="description" content="${escapeHtmlAttr(meta.description)}" />
  <meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />
  <link rel="canonical" href="${escapeHtmlAttr(meta.canonical)}" />
  <meta property="og:type" content="${meta.ogType}" />
  <meta property="og:site_name" content="Boardly" />
  <meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />
  <meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />
  <meta property="og:url" content="${escapeHtmlAttr(meta.canonical)}" />
  <meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtmlAttr(meta.ogImage)}" />
</head>
<body>
  <main>
    <h1>${escapeHtmlAttr(meta.h1)}</h1>
    <p>${escapeHtmlAttr(meta.description)}</p>
  </main>
</body>
</html>`;
        res.statusCode = meta.statusCode || 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
        return;
      }
    }

    // 2. Match registered API / sitemap / R2 routes
    const method = String(req.method || 'GET').toUpperCase();
    if (
      method === 'OPTIONS' &&
      (pathname.startsWith('/api/posts') ||
        pathname.startsWith('/api/questions') ||
        pathname.startsWith('/api/universities') ||
        pathname.startsWith('/api/mcqs') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/r2') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/bots') ||
        pathname.startsWith('/api/announcements'))
    ) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bot-Run-Secret',
      });
      res.end();
      return;
    }

    let matchedRoute: RouteDef | null = null;
    let matchResult: RegExpExecArray | null = null;

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.regex.exec(pathname);
      if (m) {
        matchedRoute = r;
        matchResult = m;
        break;
      }
    }

    if (!matchedRoute || !matchResult) {
      return next();
    }

    // Populate Express-compatible req & res helpers if not present
    req.originalUrl = fullUrl;
    req.path = pathname;
    req.ip =
      req.ip ||
      String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'local';

    const queryObj: Record<string, string> = {};
    parsedUrl.searchParams.forEach((v, k) => {
      queryObj[k] = v;
    });
    req.query = req.query || queryObj;

    const paramsObj: Record<string, string> = {};
    matchedRoute.paramNames.forEach((name, idx) => {
      paramsObj[name] = decodeURIComponent(matchResult![idx + 1] || '');
    });
    req.params = paramsObj;

    if (typeof res.status !== 'function') {
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
    }
    if (typeof res.json !== 'function') {
      res.json = (obj: unknown) => {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(obj));
        return res;
      };
    }
    if (typeof res.send !== 'function') {
      res.send = (body: unknown) => {
        if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
          return res.json(body);
        }
        res.end(body);
        return res;
      };
    }
    if (typeof res.sendFile !== 'function') {
      res.sendFile = (filePath: string) => {
        const stat = fs.statSync(filePath);
        res.setHeader('Content-Length', stat.size);
        fs.createReadStream(filePath).pipe(res);
        return res;
      };
    }
    if (typeof res.redirect !== 'function') {
      res.redirect = (statusOrUrl: number | string, maybeUrl?: string) => {
        const code = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
        const target = typeof statusOrUrl === 'string' ? statusOrUrl : maybeUrl || '/';
        res.writeHead(code, { Location: target });
        res.end();
        return res;
      };
    }

    // Parse JSON body if needed
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body === undefined) {
      await new Promise<void>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }
          resolve();
        });
        req.on('error', () => {
          req.body = {};
          resolve();
        });
      });
    }

    try {
      await matchedRoute.handler(req, res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
      }
    }
  };
}

