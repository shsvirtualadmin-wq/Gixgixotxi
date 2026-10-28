/**
 * ============================================================================
 * BOARDLY COMMONS — CLOUDFLARE WORKER (D1 + R2 + EDGE CACHE + FIREBASE JWT)
 * ============================================================================
 * Handles all Boardly Commons & Study Material posts, likes, saves, comments,
 * reports, R2 uploads, SEO post rendering, and sitemap.xml with ZERO Firebase
 * Firestore or Firebase Storage reads.
 *
 * Authentication:
 * - Verifies Firebase Auth ID tokens (RS256 JWT) using Google's public JWK keys
 *   cached at the Cloudflare Edge.
 * - Resolves roles (student, Nakama Captain, superadmin) from Firebase custom
 *   claims or the D1 `user_roles` table (no Firestore lookups).
 * - Public GET endpoints require no login and are cached via Cloudflare Cache API.
 */

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  R2_PUBLIC_BASE_URL: string;
  ALLOWED_ORIGIN?: string;
  SUPERADMIN_UIDS?: string;
  SUPERADMIN_EMAILS?: string;
}

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
  role: 'student' | 'captain' | 'superadmin';
  customRole: string | null;
}

const GOOGLE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedJwks: { keys: any[]; expiresAt: number } | null = null;

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

function decodeJwtPayload(part: string): Record<string, any> {
  const bytes = base64UrlToUint8Array(part);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function getGooglePublicJwks(): Promise<any[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }
  const resp = await fetch(GOOGLE_JWKS_URL, {
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
 * Verifies a Firebase Auth ID token using WebCrypto RS256 and Google's JWK keys.
 * Resolves user role from JWT custom claims + D1 `user_roles` table (0 Firestore reads).
 */
async function verifyFirebaseIdToken(
  req: Request,
  env: Env
): Promise<VerifiedFirebaseUser | null> {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = decodeJwtPayload(parts[0]);
  const payload = decodeJwtPayload(parts[1]);

  const nowSec = Math.floor(Date.now() / 1000);
  const projectId = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316';

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
  const superUids = (env.SUPERADMIN_UIDS || 'A5YMRimdHRcmeDWutxtUGt2e4hf2')
    .split(',')
    .map((s) => s.trim());
  const superEmails = (
    env.SUPERADMIN_EMAILS || 'shsvirtualadmin@gmail.com,support@boardly.cfd'
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
  } else {
    // Check D1 user_roles table (still 0 Firebase reads)
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
}

function buildSlug(id: string, title: string): string {
  const cleanTitle = (title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${id}-${cleanTitle || 'post'}`;
}

function extractIdFromSlugOrId(slugOrId: string): string {
  const trimmed = (slugOrId || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('post_gen_')) {
    const m = trimmed.match(/^(post_gen_\d+)/);
    if (m) return m[1];
  }
  const dashIdx = trimmed.indexOf('-');
  if (dashIdx >= 15) {
    return trimmed.slice(0, dashIdx);
  }
  return trimmed;
}

function rowToCommonsPost(row: Record<string, any>): Record<string, any> {
  let tags: string[] = [];
  let files: any[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {}
  try {
    files = JSON.parse(row.files_json || '[]');
  } catch {}

  const createdMs = Number(row.created_at || Date.now());
  const updatedMs = Number(row.updated_at || createdMs);
  const isAnon = Boolean(row.is_anonymous);

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

async function checkRateLimit(
  env: Env,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
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

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') || env.ALLOWED_ORIGIN || 'https://boardly.cfd';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
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

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 1. Dynamic Sitemap XML from D1
    if (url.pathname === '/sitemap.xml' && req.method === 'GET') {
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
      req.method === 'GET'
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
      // GET /api/posts — Paginated list, filter, search (Edge Cached for public readers)
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
          Math.max(1, Number(url.searchParams.get('limit') || url.searchParams.get('pageSize') || 20))
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
          clauses.push('(title LIKE ? OR description LIKE ? OR subject LIKE ? OR tags_json LIKE ?)');
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
            posts,
            hasMore,
            nextOffset: hasMore ? offset + pageSize : null,
          },
          200,
          {
            ...cors,
            'Cache-Control': hasAuthHeader
              ? 'private, no-cache'
              : 'public, max-age=60, s-maxage=180, stale-while-revalidate=300',
          }
        );

        if (!hasAuthHeader) {
          ctx.waitUntil(cache.put(cacheKey, resp.clone()));
        }
        return resp;
      }

      // POST /api/posts/upload — Direct Worker Upload to R2
      if ((subPath === '/upload' || subPath === '/upload-url') && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse({ error: 'Authentication required to upload files.' }, 401, cors);
        }

        const allowed = await checkRateLimit(env, `upload:${user.uid}`, 15, 60 * 60 * 1000);
        if (!allowed) {
          return jsonResponse({ error: 'Upload rate limit reached. Please wait a bit.' }, 429, cors);
        }

        const contentType = req.headers.get('Content-Type') || '';
        if (contentType.includes('multipart/form-data')) {
          const formData = await req.formData();
          const file = formData.get('file') as File | null;
          if (!file) {
            return jsonResponse({ error: 'Missing file in form data.' }, 400, cors);
          }
          if (file.size > MAX_UPLOAD_BYTES) {
            return jsonResponse({ error: 'File exceeds maximum 25 MB limit.' }, 413, cors);
          }
          const mime = file.type || 'application/octet-stream';
          if (!ALLOWED_MIME_TYPES.has(mime)) {
            return jsonResponse({ error: `Unsupported file type: ${mime}` }, 415, cors);
          }

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const key = `commons/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeName}`;
          await env.R2_BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: {
              contentType: mime,
              cacheControl: 'public, max-age=31536000, immutable',
            },
          });

          const publicBase = (
            env.R2_PUBLIC_BASE_URL || 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev'
          ).replace(/\/+$/, '');
          const urlStr = `${publicBase}/${key}`;

          return jsonResponse(
            {
              success: true,
              key,
              url: urlStr,
              name: file.name,
              size: file.size,
              type: mime,
            },
            200,
            cors
          );
        }

        const body = (await req.json()) as Record<string, any>;
        const fileName = String(body.fileName || body.name || 'resource.pdf').replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );
        const fileType = String(body.fileType || body.type || 'application/pdf');
        const fileSize = Number(body.fileSize || body.size || 0);

        if (fileSize > MAX_UPLOAD_BYTES) {
          return jsonResponse({ error: 'File exceeds maximum 25 MB limit.' }, 413, cors);
        }
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return jsonResponse({ error: `Unsupported file type: ${fileType}` }, 415, cors);
        }

        const key = `commons/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${fileName}`;
        const publicBase = (
          env.R2_PUBLIC_BASE_URL || 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev'
        ).replace(/\/+$/, '');

        return jsonResponse(
          {
            success: true,
            key,
            uploadEndpoint: `/api/posts/upload`,
            publicUrl: `${publicBase}/${key}`,
          },
          200,
          cors
        );
      }

      // POST /api/posts — Create Post in D1
      if (subPath === '/' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) {
          return jsonResponse({ error: 'Authentication required to create a post.' }, 401, cors);
        }

        const allowed = await checkRateLimit(env, `create:${user.uid}`, 10, 24 * 60 * 60 * 1000);
        if (!allowed && user.role !== 'superadmin') {
          return jsonResponse(
            { error: 'Daily post limit (10 posts/day) reached. Try again tomorrow.' },
            429,
            cors
          );
        }

        const body = (await req.json()) as Record<string, any>;
        const title = String(body.title || '').trim();
        const description = String(body.description || body.body || '').trim();
        if (!title) {
          return jsonResponse({ error: 'Post title is required.' }, 400, cors);
        }

        const id = body.id || `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const slug = buildSlug(id, title);
        const isAnon = Boolean(body.isAnonymous);
        const now = Date.now();
        const files = Array.isArray(body.files) ? body.files : [];
        const tags = Array.isArray(body.tags) ? body.tags : [];

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
            user.uid,
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

        const createdRow = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
          .bind(id)
          .first<Record<string, any>>();

        return jsonResponse(
          {
            success: true,
            postId: id,
            post: createdRow ? rowToCommonsPost(createdRow) : { id, slug, title },
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

      // PUT or PATCH /api/posts/:slugOrId
      if (!action && (req.method === 'PUT' || req.method === 'PATCH')) {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

        const existing = await env.DB.prepare(
          'SELECT id, real_author_uid, author_uid FROM posts WHERE id = ? OR slug = ? LIMIT 1'
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

        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(existing.id).run();
        return jsonResponse({ success: true, deletedId: existing.id }, 200, cors);
      }

      // POST /api/posts/:slugOrId/like
      if (action === 'like' && req.method === 'POST') {
        const user = await verifyFirebaseIdToken(req, env);
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, cors);

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
      if (err?.message === 'POSTING_BANNED') {
        return jsonResponse(
          { error: 'Your account is restricted from posting in Boardly Commons.' },
          403,
          cors
        );
      }
      return jsonResponse({ error: err?.message || 'Internal Worker Error' }, 500, cors);
    }
  },
};
