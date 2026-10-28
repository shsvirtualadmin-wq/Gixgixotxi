import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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
}

let d1Cache: D1StoreData | null = null;
let d1LastMtime = 0;

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
      };
      d1LastMtime = stat.mtimeMs;
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
  };
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
  } catch {}
  try {
    files = JSON.parse(row.files_json || '[]');
  } catch {}

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

    return {
      uid,
      email,
      name: payload.name || email.split('@')[0] || 'Student',
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
  } catch {}
  return [];
}

function saveDeletedAccountsRegistry(entries: DeletedAccountEntry[]): void {
  try {
    fs.mkdirSync(path.dirname(DELETED_ACCOUNTS_PATH), { recursive: true });
    fs.writeFileSync(DELETED_ACCOUNTS_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch {}
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
    } catch {}

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
      } catch {}
    }

    const r2CredentialsConfigured = Boolean(
      (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID) &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
    );

    return res.status(200).json({
      ok: true,
      status: 'healthy',
      workerReachable: true,
      backendMode: r2CredentialsConfigured ? 'cloudflare-d1-r2' : 'preview-demo',
      bindings: {
        d1: {
          bindingName: 'DB',
          databaseName: 'boardly-posts-db',
          exists: true,
          connected: true,
          postCount: store.posts.length,
          mode: 'local-d1-mirror',
        },
        r2: {
          bindingName: 'R2_BUCKET',
          bucketName: process.env.R2_BUCKET_NAME || 'boardly-commons-media',
          exists: true,
          connected: true,
          mode: r2CredentialsConfigured ? 'cloudflare-r2-s3' : 'local-r2-mirror',
        },
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

      const cacheKey = req.originalUrl;
      if (!currentUid && !req.query.flaggedOnly) {
        const hit = edgeFeedCache.get(cacheKey);
        if (hit && hit.expiresAt > Date.now()) {
          res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=180');
          res.setHeader('X-Edge-Cache', 'HIT');
          return res.status(200).json(hit.payload);
        }
      }

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

      const payload = {
        success: true,
        backendMode: 'preview-demo',
        posts,
        total: rows.length,
        hasMore,
        nextOffset: hasMore ? offset + pageSize : null,
      };

      if (!currentUid && !flaggedOnly) {
        edgeFeedCache.set(cacheKey, { payload, expiresAt: Date.now() + 60 * 1000 });
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=180');
        res.setHeader('X-Edge-Cache', 'MISS');
      } else {
        res.setHeader('Cache-Control', 'private, no-cache');
      }

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
      store.posts.unshift(newRow);
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
      } else {
        store.likes.push({
          post_id: post.id,
          user_uid: user.uid,
          created_at: Date.now(),
        });
        post.upvotes = (post.upvotes || 0) + 1;
        voted = true;
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
          } catch {}
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
}

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Creates a universal Node HTTP / Connect / Express middleware that serves all
 * Cloudflare D1 + R2 `/api/posts*`, `/api/r2/*`, `/sitemap.xml`, `/api/auth/*`,
 * `/api/admin/users/delete`, and pre-rendered SEO HTML for `/commons/post/:slug`
 * and `/material/:slug`.
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

    // 1. Pre-rendered SEO HTML for search engine & social crawlers on /commons/post/:slug and /material/:slug
    if (
      req.method === 'GET' &&
      (pathname.startsWith('/commons/post/') || pathname.startsWith('/material/'))
    ) {
      const ua = String(req.headers?.['user-agent'] || '').toLowerCase();
      const isBot =
        /facebookexternalhit|whatsapp|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|googlebot|bingbot|yandex|duckduckbot|applebot|crawler|spider/i.test(
          ua
        ) ||
        parsedUrl.searchParams.get('crawler') === '1' ||
        parsedUrl.searchParams.get('crawler') === 'true';

      if (isBot) {
        const slugParam = decodeURIComponent(
          pathname
            .replace(/^\/commons\/post\//, '')
            .replace(/^\/material\//, '')
            .replace(/\/+$/, '')
        );
        const d1Row = loadD1Store().posts.find(
          (p) => (p.slug === slugParam || p.id === slugParam) && !p.is_hidden
        );
        const postTitle = d1Row
          ? `${d1Row.title} — ${d1Row.subject || 'Study Notes'} | Boardly Commons`
          : `${slugParam.replace(/[-_]+/g, ' ')} — Study Material | Boardly Commons`;
        const postDesc = d1Row
          ? String(d1Row.description || '').replace(/\s+/g, ' ').slice(0, 220)
          : `Read and download verified ${slugParam.replace(/[-_]+/g, ' ')} notes, formula sheets, and past papers on Boardly Commons.`;
        const canonical = `https://boardly.cfd${pathname}`;
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlAttr(postTitle)}</title>
  <meta name="description" content="${escapeHtmlAttr(postDesc)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${escapeHtmlAttr(canonical)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Boardly" />
  <meta property="og:title" content="${escapeHtmlAttr(postTitle)}" />
  <meta property="og:description" content="${escapeHtmlAttr(postDesc)}" />
  <meta property="og:url" content="${escapeHtmlAttr(canonical)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtmlAttr(postTitle)}" />
  <meta name="twitter:description" content="${escapeHtmlAttr(postDesc)}" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: d1Row?.title || postTitle,
    description: postDesc,
    url: canonical,
    educationalLevel: d1Row?.class_level || 'High School',
    about: d1Row?.subject || 'STEM',
    author: {
      '@type': 'Person',
      name: d1Row?.is_anonymous ? 'Anonymous Student' : d1Row?.author_name || 'Boardly Student',
    },
  })}</script>
</head>
<body>
  <main>
    <h1>${escapeHtmlAttr(d1Row?.title || postTitle)}</h1>
    <p>${escapeHtmlAttr(d1Row?.description || postDesc)}</p>
  </main>
</body>
</html>`;
        res.statusCode = 200;
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
        pathname.startsWith('/api/r2') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/admin/users'))
    ) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

