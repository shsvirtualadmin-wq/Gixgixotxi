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

export interface Env {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  FIREBASE_PROJECT_ID?: string;
  R2_PUBLIC_BASE_URL?: string;
  ALLOWED_ORIGIN?: string;
  SUPERADMIN_UIDS?: string;
  SUPERADMIN_EMAILS?: string;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
  role: 'student' | 'captain' | 'superadmin';
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

/**
 * Ensures the D1 database schema exists so a newly bound D1 database works out of the box.
 */
async function ensureD1Schema(db: D1Database): Promise<void> {
  if (schemaInitialized) return;
  try {
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
      db.prepare(`CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_uid)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS post_saves (
        post_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_uid)
      )`),
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
      db.prepare(`CREATE TABLE IF NOT EXISTS post_reports (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        reporter_uid TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT,
        is_posting_banned INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL
      )`),
    ]);
    schemaInitialized = true;
  } catch (err) {
    console.error('[CloudflareWorker] D1 schema init warning:', err);
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
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

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
    const email = String(payload.email || '').toLowerCase();
    const superUids = (
      env.SUPERADMIN_UIDS || BOARDLY_CLOUDFLARE_CONFIG.superadminUids.join(',')
    )
      .split(',')
      .map((s) => s.trim());
    const superEmails = (
      env.SUPERADMIN_EMAILS || BOARDLY_CLOUDFLARE_CONFIG.superadminEmails.join(',')
    )
      .split(',')
      .map((s) => s.trim().toLowerCase());

    let role: 'student' | 'captain' | 'superadmin' = 'student';
    let customRole: string | null = payload.customRole || null;

    if (
      superUids.includes(uid) ||
      superEmails.includes(email) ||
      payload.role === 'superadmin' ||
      payload.role === 'admin' ||
      payload.admin === true
    ) {
      role = 'superadmin';
    } else if (
      payload.role === 'captain' ||
      payload.nakamaCaptain === true ||
      payload.customRole === 'Nakama Captain'
    ) {
      role = 'captain';
      customRole = customRole || 'Nakama Captain';
    } else if (env.DB) {
      try {
        const d1Role = await env.DB.prepare(
          'SELECT role, custom_role, is_posting_banned FROM user_roles WHERE uid = ? LIMIT 1'
        )
          .bind(uid)
          .first<{ role: string; custom_role: string | null; is_posting_banned: number }>();

        if (d1Role) {
          if (d1Role.is_posting_banned) {
            throw new Error('POSTING_BANNED');
          }
          if (d1Role.role === 'superadmin' || d1Role.role === 'admin') {
            role = 'superadmin';
          } else if (d1Role.role === 'captain' || d1Role.custom_role === 'Nakama Captain') {
            role = 'captain';
            customRole = d1Role.custom_role || 'Nakama Captain';
          }
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
      role,
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

export function normalizeStoredFileEntry(f: any): Record<string, any> {
  const name = String(f?.name || 'attachment');
  const size = Number(f?.size || 0);
  const type = String(f?.type || 'application/octet-stream');
  const rawUrl = String(f?.url || '').trim();
  const r2Key =
    String(f?.r2Key || f?.key || '').trim() ||
    (rawUrl.startsWith('posts/') || rawUrl.startsWith('commons/') ? rawUrl : '');

  const isImage =
    type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name);

  let url = rawUrl;
  if (r2Key && r2Key.startsWith('posts/')) {
    url = isImage
      ? `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(r2Key)}`
      : `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`;
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

/**
 * Canonical serializer from a D1 `posts` row to the frontend `CommonsPost` JSON contract.
 * Never exposes `real_author_uid` or `author_uid` on anonymous posts in public responses.
 */
export function rowToCommonsPost(row: Record<string, any>): Record<string, any> {
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
    authorUid: isAnon ? null : row.author_uid || null,
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
      'SELECT count, window_start FROM rate_limits WHERE rate_key = ?'
    )
      .bind(key)
      .first<{ count: number; window_start: number }>();

    if (!existing || now - existing.window_start > windowMs) {
      await env.DB.prepare(
        'INSERT OR REPLACE INTO rate_limits (rate_key, count, window_start) VALUES (?, 1, ?)'
      )
        .bind(key, now)
        .run();
      return true;
    }

    if (existing.count >= maxRequests) {
      return false;
    }

    await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?')
      .bind(key)
      .run();
    return true;
  } catch {
    return true;
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
      const row = await env.DB.prepare('SELECT COUNT(*) as cnt FROM posts').first<{ cnt: number }>();
      d1Connected = true;
      d1PostCount = Number(row?.cnt ?? 0);
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

  const allHealthy = d1BindingExists && d1Connected && r2BindingExists && r2Connected && jwksReachable;

  return jsonResponse(
    {
      ok: allHealthy,
      status: allHealthy ? 'healthy' : 'degraded',
      workerReachable: true,
      backendMode: d1BindingExists && r2BindingExists ? 'cloudflare-d1-r2' : 'preview-demo',
      bindings: {
        d1: {
          bindingName: BOARDLY_CLOUDFLARE_CONFIG.d1BindingName,
          databaseName: BOARDLY_CLOUDFLARE_CONFIG.d1DatabaseName,
          exists: d1BindingExists,
          connected: d1Connected,
          postCount: d1PostCount,
          error: d1Error,
        },
        r2: {
          bindingName: BOARDLY_CLOUDFLARE_CONFIG.r2BindingName,
          bucketName: BOARDLY_CLOUDFLARE_CONFIG.r2BucketName,
          exists: r2BindingExists,
          connected: r2Connected,
          error: r2Error,
        },
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
    allHealthy ? 200 : 200,
    {
      ...cors,
      'Cache-Control': 'no-store',
    }
  );
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

    if (env.DB) {
      await ensureD1Schema(env.DB);
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
          'Cache-Control': 'public, max-age=300, s-maxage=900',
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
        const slugPart = url.pathname
          .replace(/^\/commons\/post\//, '')
          .replace(/^\/material\//, '');
        const postId = extractIdFromSlugOrId(slugPart);
        const row = await env.DB.prepare(
          'SELECT * FROM posts WHERE (id = ? OR slug = ?) AND is_hidden = 0 LIMIT 1'
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
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=300, s-maxage=900',
            },
          });
        }
      }
    }

    // 3. API Routes under /api/posts
    if (!url.pathname.startsWith('/api/posts')) {
      return jsonResponse({ error: 'Not Found' }, 404, cors);
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

      // ── GET /api/posts — Paginated list, filter, search (Edge Cached for public readers) ──
      if (subPath === '/' && req.method === 'GET') {
        const hasAuthHeader = Boolean(req.headers.get('Authorization'));
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), { method: 'GET' });

        if (!hasAuthHeader) {
          const cached = await cache.match(cacheKey);
          if (cached) return cached;
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
        const authorUid = (url.searchParams.get('authorUid') || '').trim();
        const sort = (url.searchParams.get('sort') || 'newest').trim();

        const clauses: string[] = ['is_hidden = 0'];
        const binds: any[] = [];

        if (subject && subject !== 'all') {
          clauses.push('LOWER(subject) = LOWER(?)');
          binds.push(subject);
        }
        if (type && type !== 'all') {
          clauses.push('type = ?');
          binds.push(type);
        }
        if (target && target !== 'all') {
          clauses.push('LOWER(target) = LOWER(?)');
          binds.push(target);
        }
        if (classLevel && classLevel !== 'all') {
          clauses.push('class_level = ?');
          binds.push(classLevel.replace(/^Class\s+/i, ''));
        }
        if (board && board !== 'all') {
          clauses.push('LOWER(board) = LOWER(?)');
          binds.push(board);
        }
        if (authorUid) {
          clauses.push('(author_uid = ? AND is_anonymous = 0)');
          binds.push(authorUid);
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

        const sql = `SELECT * FROM posts WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        binds.push(pageSize + 1, offset);

        const { results } = await env.DB.prepare(sql).bind(...binds).all();
        const rows = results || [];
        const hasMore = rows.length > pageSize;
        const pageRows = rows.slice(0, pageSize);
        const posts = pageRows.map((r) => rowToCommonsPost(r as Record<string, any>));

        const resp = jsonResponse(
          {
            success: true,
            backendMode: 'cloudflare-d1-r2',
            posts,
            hasMore,
            nextOffset: hasMore ? offset + pageSize : null,
          },
          200,
          {
            ...cors,
            'Cache-Control': hasAuthHeader
              ? 'private, no-cache'
              : 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
          }
        );

        if (!hasAuthHeader) {
          ctx.waitUntil(cache.put(cacheKey, resp.clone()));
        }
        return resp;
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

        const allowed = await checkRateLimit(
          env,
          `create:${user.uid}`,
          BOARDLY_CLOUDFLARE_CONFIG.dailyPostLimit,
          24 * 60 * 60 * 1000
        );
        if (!allowed && user.role !== 'superadmin') {
          return jsonResponse(
            {
              success: false,
              error: `Daily post limit (${BOARDLY_CLOUDFLARE_CONFIG.dailyPostLimit} posts/day) reached. Try again tomorrow.`,
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
              isAnon ? null : body.authorAvatar || null,
              isAnon ? null : body.authorFrame || null,
              isAnon ? null : body.authorEquippedAvatar || null,
              isAnon ? null : body.authorPhotoURL || user.picture || null,
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

        const createdRow = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
          .bind(id)
          .first<Record<string, any>>();

        return jsonResponse(
          {
            success: true,
            postId: id,
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
        return jsonResponse({ success: true, post: rowToCommonsPost(row) }, 200, cors);
      }

      // GET /api/posts/:slugOrId/status
      if (action === 'status' && req.method === 'GET') {
        const user = await verifyFirebaseIdToken(req, env).catch(() => null);
        const targetUid = user?.uid || (url.searchParams.get('userId') || '').trim();
        if (!targetUid) {
          return jsonResponse({ success: true, voted: false, saved: false }, 200, cors);
        }
        const [likeRow, saveRow] = await Promise.all([
          env.DB.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?')
            .bind(postId, targetUid)
            .first(),
          env.DB.prepare('SELECT 1 FROM post_saves WHERE post_id = ? AND user_uid = ?')
            .bind(postId, targetUid)
            .first(),
        ]);
        return jsonResponse(
          {
            success: true,
            voted: Boolean(likeRow),
            saved: Boolean(saveRow),
          },
          200,
          cors
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

        const existingLike = await env.DB.prepare(
          'SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?'
        )
          .bind(postId, user.uid)
          .first();

        let voted = false;
        if (existingLike) {
          await env.DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_uid = ?')
            .bind(postId, user.uid)
            .run();
          await env.DB.prepare('UPDATE posts SET upvotes = MAX(0, upvotes - 1) WHERE id = ?')
            .bind(postId)
            .run();
          voted = false;
        } else {
          await env.DB.prepare(
            'INSERT INTO post_likes (post_id, user_uid, created_at) VALUES (?, ?, ?)'
          )
            .bind(postId, user.uid, Date.now())
            .run();
          await env.DB.prepare('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?')
            .bind(postId)
            .run();
          voted = true;
        }

        const postRow = await env.DB.prepare('SELECT upvotes FROM posts WHERE id = ?')
          .bind(postId)
          .first<{ upvotes: number }>();

        return jsonResponse(
          { success: true, voted, newCount: Number(postRow?.upvotes || 0) },
          200,
          cors
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

        const comments = (results || []).map((c: any) => ({
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
          createdAt: new Date(Number(c.created_at || Date.now())).toISOString(),
        }));

        return jsonResponse({ success: true, comments }, 200, cors);
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
            isAnon ? null : body.authorAvatar || null,
            isAnon ? null : body.authorFrame || null,
            isAnon ? null : body.authorEquippedAvatar || null,
            isAnon ? null : body.authorPhotoURL || user.picture || null,
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
              authorAvatar: isAnon ? null : body.authorAvatar || null,
              authorFrame: isAnon ? null : body.authorFrame || null,
              authorEquippedAvatar: isAnon ? null : body.authorEquippedAvatar || null,
              authorPhotoURL: isAnon ? null : body.authorPhotoURL || user.picture || null,
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
        { error: err?.message || 'Upload failed, try again' },
        500,
        cors
      );
    }
  },
};
