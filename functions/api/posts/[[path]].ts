import worker, {
  Env,
  rowToCommonsPost,
  resolveWorkerLiveAuthorsBatch,
  sanitizeStoreAvatarId,
  verifyFirebaseIdToken,
  extractIdFromSlugOrId,
  buildSlug,
  normalizeStoredFileEntry,
} from '../../../cloudflare/worker';
import {
  BOARDLY_CLOUDFLARE_CONFIG,
  buildCorsHeaders,
  buildR2PostFileKey,
  sanitizeUploadFileName,
} from '../../../src/config/cloudflareConfig';
import {
  buildDailyPostQuotaStatus,
  formatPostLimitReachedMessage,
  getDailyPostWindow,
} from '../../../src/config/postLimits';
import { getPlan, type PlanTier } from '../../../src/lib/planTier';
import seedDataset from '../../../data/cloudflare_d1_posts.json';

interface MemoryStore {
  posts: any[];
  comments: any[];
  likes: any[];
  saves: any[];
  reports: any[];
  files: Map<string, { bytes: Uint8Array; contentType: string; fileName: string }>;
}

const memoryStore: MemoryStore = {
  posts: Array.isArray((seedDataset as any)?.posts) ? [...(seedDataset as any).posts] : [],
  comments: Array.isArray((seedDataset as any)?.comments) ? [...(seedDataset as any).comments] : [],
  likes: Array.isArray((seedDataset as any)?.likes) ? [...(seedDataset as any).likes] : [],
  saves: Array.isArray((seedDataset as any)?.saves) ? [...(seedDataset as any).saves] : [],
  reports: Array.isArray((seedDataset as any)?.reports) ? [...(seedDataset as any).reports] : [],
  files: new Map(),
};

const memoryDailyPostCounts = new Map<string, number>();

function countMemoryPostsUsedToday(uid: string, nowMs: number = Date.now()): number {
  const windowInfo = getDailyPostWindow(nowMs);
  let postsToday = 0;
  for (const p of memoryStore.posts) {
    const ownerUid = p.real_author_uid || p.author_uid;
    if (ownerUid !== uid) continue;
    const ts = Number(p.created_at || 0);
    if (ts >= windowInfo.windowStartMs && ts < windowInfo.resetAtMs) {
      postsToday += 1;
    }
  }
  const tracked = memoryDailyPostCounts.get(`${uid}:${windowInfo.dateKey}`) || 0;
  return Math.max(postsToday, tracked);
}

async function resolveFallbackUserPlanTier(
  request: Request,
  env: Env,
  user: { uid: string; role?: string; email?: string }
): Promise<PlanTier> {
  if (user.role === 'superadmin') return 'plus';
  if (!user.uid || user.uid.startsWith('guest_')) return 'free';
  const authHeader = String(request.headers.get('Authorization') || '').trim();
  if (!authHeader) return 'free';
  const projectId = env.FIREBASE_PROJECT_ID || BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;
  const defaultDbId =
    (env as any).FIREBASE_DATABASE_ID ||
    'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

  const decodeVal = (v: any): any => {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return Boolean(v.booleanValue);
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('timestampValue' in v) return v.timestampValue;
    return null;
  };

  for (const dbId of [defaultDbId, '(default)']) {
    try {
      const resp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          projectId
        )}/databases/${encodeURIComponent(dbId)}/documents/users/${encodeURIComponent(user.uid)}`,
        { headers: { Authorization: authHeader, Accept: 'application/json' } }
      );
      if (resp.ok) {
        const json = (await resp.json().catch(() => null)) as { fields?: Record<string, any> } | null;
        if (json?.fields) {
          const userDoc: Record<string, any> = { uid: user.uid, role: user.role };
          for (const [k, v] of Object.entries(json.fields)) {
            userDoc[k] = decodeVal(v);
          }
          return getPlan(userDoc);
        }
      }
    } catch {
      // Fallback to free
    }
  }
  return 'free';
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

export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const { request, env } = context;

  // When both Cloudflare D1 (DB) and R2 (R2_BUCKET) bindings are configured in wrangler.toml,
  // delegate 100% of /api/posts/* traffic to the production D1 + R2 Worker.
  if (env && env.DB && env.R2_BUCKET) {
    return worker.fetch(request, env, context as any);
  }

  // Fallback handler only if a binding (DB or R2_BUCKET) is missing:
  // Uses the exact same rowToCommonsPost serializer so descriptions, KaTeX, tags, and files
  // display identically, and marks backendMode as 'preview-demo'.
  const cors = buildCorsHeaders(request.headers.get('Origin'));
  const jsonHeaders = {
    ...cors,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.slice('/api/posts'.length).replace(/\/+$/, '') || '/';

  // GET /api/posts/download?key=...
  if (subPath === '/download' && request.method === 'GET') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const rawKey = (url.searchParams.get('key') || '').trim().replace(/^\/+/, '');
    if (!rawKey || rawKey.includes('..')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file key.' }),
        { status: 400, headers: jsonHeaders }
      );
    }
    if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'PRIVATE_R2_PREFIX',
          error: 'Forbidden: Private signature and certificate files cannot be accessed via post endpoints.',
        }),
        { status: 403, headers: jsonHeaders }
      );
    }

    if (env?.R2_BUCKET) {
      const obj = await env.R2_BUCKET.get(rawKey);
      if (obj) {
        const fileName = rawKey.split('/').pop() || 'resource';
        return new Response(obj.body, {
          status: 200,
          headers: {
            ...cors,
            'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${sanitizeUploadFileName(fileName)}"`,
            'Cache-Control': 'private, no-store',
          },
        });
      }
    }

    const memFile = memoryStore.files.get(rawKey);
    if (memFile) {
      return new Response(memFile.bytes, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': memFile.contentType,
          'Content-Disposition': `attachment; filename="${sanitizeUploadFileName(memFile.fileName)}"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    if (rawKey.startsWith('commons/')) {
      const staticAssetUrl = new URL(`/api/r2/${rawKey}`, url.origin);
      const assetResp = await fetch(staticAssetUrl.toString());
      if (assetResp.ok) {
        const fileName = rawKey.split('/').pop() || 'study-material.pdf';
        return new Response(assetResp.body, {
          status: 200,
          headers: {
            ...cors,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${sanitizeUploadFileName(fileName)}"`,
            'Cache-Control': 'private, no-store',
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'File not found.' }),
      { status: 404, headers: jsonHeaders }
    );
  }

  // GET /api/posts/file?key=... (Inline image streaming)
  if (subPath === '/file' && request.method === 'GET') {
    const rawKey = (url.searchParams.get('key') || '').trim().replace(/^\/+/, '');
    if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'PRIVATE_R2_PREFIX',
          error: 'Forbidden: Private signature and certificate files have no public URL.',
        }),
        { status: 403, headers: jsonHeaders }
      );
    }
    if (env?.R2_BUCKET && rawKey) {
      const obj = await env.R2_BUCKET.get(rawKey);
      if (obj) {
        return new Response(obj.body, {
          status: 200,
          headers: {
            ...cors,
            'Content-Type': obj.httpMetadata?.contentType || 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }
    const memFile = memoryStore.files.get(rawKey);
    if (memFile) {
      return new Response(memFile.bytes, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': memFile.contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  // POST /api/posts/upload
  if ((subPath === '/upload' || subPath === '/upload-url') && request.method === 'POST') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const contentType = request.headers.get('Content-Type') || '';
    let bytes: Uint8Array;
    let fileName = 'attachment';
    let mimeType = 'application/octet-stream';
    let postId = request.headers.get('X-Post-Id') || `post_${Date.now()}`;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const formPostId = formData.get('postId');
      if (typeof formPostId === 'string' && formPostId.trim()) {
        postId = formPostId.trim();
      }
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, code: 'MISSING_FILE_DATA', error: 'Missing file.' }),
          { status: 400, headers: jsonHeaders }
        );
      }
      fileName = file.name || 'attachment';
      mimeType = file.type || 'application/octet-stream';
      if (file.size > BOARDLY_CLOUDFLARE_CONFIG.maxFileSizeBytes) {
        return new Response(
          JSON.stringify({ success: false, code: 'FILE_TOO_LARGE', error: 'File too large' }),
          { status: 413, headers: jsonHeaders }
        );
      }
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      if (body.postId) postId = String(body.postId).trim();
      fileName = String(body.fileName || body.name || 'attachment');
      mimeType = String(body.fileType || body.type || 'application/octet-stream');
      const dataBase64 = String(body.dataBase64 || '');
      if (!dataBase64) {
        return new Response(
          JSON.stringify({ success: false, code: 'MISSING_FILE_DATA', error: 'Missing file.' }),
          { status: 400, headers: jsonHeaders }
        );
      }
      bytes = base64ToUint8Array(dataBase64);
      if (bytes.byteLength > BOARDLY_CLOUDFLARE_CONFIG.maxFileSizeBytes) {
        return new Response(
          JSON.stringify({ success: false, code: 'FILE_TOO_LARGE', error: 'File too large' }),
          { status: 413, headers: jsonHeaders }
        );
      }
    }

    const key = buildR2PostFileKey(postId, fileName);
    if (env?.R2_BUCKET) {
      await env.R2_BUCKET.put(key, bytes, {
        httpMetadata: { contentType: mimeType },
      });
    } else {
      memoryStore.files.set(key, { bytes, contentType: mimeType, fileName });
    }

    const isImage =
      mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
    const downloadUrl = `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(key)}`;
    const urlStr = isImage
      ? `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(key)}`
      : downloadUrl;

    return new Response(
      JSON.stringify({
        success: true,
        key,
        r2Key: key,
        url: urlStr,
        downloadUrl,
        name: fileName,
        size: bytes.byteLength,
        type: mimeType,
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  // DELETE /api/posts/upload (Rollback)
  if (subPath === '/upload' && request.method === 'DELETE') {
    const body = (await request.json().catch(() => ({}))) as { keys?: string[] };
    const keys = Array.isArray(body.keys) ? body.keys : [];
    for (const k of keys) {
      memoryStore.files.delete(k);
      if (env?.R2_BUCKET && k.startsWith('posts/')) {
        await env.R2_BUCKET.delete(k).catch(() => {});
      }
    }
    return new Response(JSON.stringify({ success: true, deletedKeys: keys }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  // GET /api/posts/moderation/queue
  if (subPath === '/moderation/queue' && request.method === 'GET') {
    const flaggedPosts = memoryStore.posts
      .filter((p) => Number(p.report_count || 0) >= 1 || Number(p.is_hidden || 0) === 1)
      .map((p) => mapRowToPost(p));
    return new Response(
      JSON.stringify({
        success: true,
        flaggedPosts,
        reports: [],
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  // GET /api/posts
  if (subPath === '/' && request.method === 'GET') {
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('limit') || url.searchParams.get('pageSize') || 15))
    );
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const subject = (url.searchParams.get('subject') || '').trim().toLowerCase();
    const type = (url.searchParams.get('type') || '').trim();
    const target = (url.searchParams.get('target') || '').trim().toLowerCase();
    const search = (url.searchParams.get('search') || url.searchParams.get('q') || '')
      .trim()
      .toLowerCase();
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
      const verifiedCaller = await verifyFirebaseIdToken(request, env || {}).catch(() => null);
      canIncludeOwnAnonymous = Boolean(verifiedCaller && verifiedCaller.uid === authorUid);
    }
    const sort = (url.searchParams.get('sort') || 'newest').trim();

    let rows = memoryStore.posts.filter((p) => !Number(p.is_hidden || 0));

    if (authorUid) {
      rows = rows.filter((p) => {
        if (canIncludeOwnAnonymous) {
          return p.real_author_uid === authorUid || p.author_uid === authorUid;
        }
        return p.author_uid === authorUid && !Number(p.is_anonymous || 0);
      });
    }
    if (subject && subject !== 'all') {
      rows = rows.filter((p) => {
        const ps = String(p.subject || '').toLowerCase();
        return ps === subject || ps.includes(subject) || (subject === 'computer' && ps.includes('computer'));
      });
    }
    if (type && type !== 'all') {
      rows = rows.filter((p) => p.type === type);
    }
    if (target && target !== 'all') {
      rows = rows.filter((p) => String(p.target || '').toLowerCase().includes(target));
    }
    if (search) {
      rows = rows.filter(
        (p) =>
          String(p.title || '').toLowerCase().includes(search) ||
          String(p.description || '').toLowerCase().includes(search) ||
          String(p.subject || '').toLowerCase().includes(search) ||
          String(p.tags_json || '').toLowerCase().includes(search)
      );
    }

    rows.sort((a, b) => {
      if (Number(a.is_pinned || 0) !== Number(b.is_pinned || 0)) {
        return Number(b.is_pinned || 0) - Number(a.is_pinned || 0);
      }
      if (sort === 'trending' || sort === 'top') {
        if (Number(b.upvotes || 0) !== Number(a.upvotes || 0)) {
          return Number(b.upvotes || 0) - Number(a.upvotes || 0);
        }
      }
      return Number(b.created_at || 0) - Number(a.created_at || 0);
    });

    const total = rows.length;
    const paged = rows.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < total;
    const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
      env?.DB,
      paged.map((r) => (r.is_anonymous ? null : r.author_uid))
    );

    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        total,
        offset,
        limit: pageSize,
        hasMore,
        nextOffset: hasMore ? offset + pageSize : null,
        posts: paged.map((r) => rowToCommonsPost(r, liveAuthorsMap)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  // GET /api/posts/limit
  if (subPath === '/limit' && request.method === 'GET') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        }),
        { status: 401, headers: jsonHeaders }
      );
    }
    const nowMs = Date.now();
    const plan = await resolveFallbackUserPlanTier(request, env || {}, user);
    const usedToday = countMemoryPostsUsedToday(user.uid, nowMs);
    const quota = buildDailyPostQuotaStatus({ plan, usedToday, nowMs });
    return new Response(
      JSON.stringify({
        success: true,
        ...quota,
      }),
      { status: 200, headers: { ...jsonHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // POST /api/posts
  if (subPath === '/' && request.method === 'POST') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const checkNowMs = Date.now();
    const userPlan = await resolveFallbackUserPlanTier(request, env || {}, user);
    const usedTodayBefore = countMemoryPostsUsedToday(user.uid, checkNowMs);
    const preQuota = buildDailyPostQuotaStatus({
      plan: userPlan,
      usedToday: usedTodayBefore,
      nowMs: checkNowMs,
    });
    if (preQuota.limitReached) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'DAILY_POST_LIMIT_REACHED',
          error: formatPostLimitReachedMessage(preQuota),
          quota: preQuota,
        }),
        { status: 429, headers: jsonHeaders }
      );
    }

    const body = (await request.json()) as Record<string, any>;
    const title = String(body.title || '').trim();
    const description = String(body.description || body.body || '').trim();
    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post title is required.' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const id = String(
      body.id || body.postId || `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    ).trim();
    const slug = buildSlug(id, title);
    const isAnon = Boolean(body.isAnonymous);
    const maxExistingCreated = memoryStore.posts.reduce(
      (max, p) => Math.max(max, Number(p.created_at || 0)),
      0
    );
    const now = Math.max(Date.now(), maxExistingCreated + 1);
    const files = Array.isArray(body.files) ? body.files.map(normalizeStoredFileEntry) : [];
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const newRow = {
      id,
      slug,
      type: String(body.type || 'notes'),
      title,
      description,
      subject: String(body.subject || 'General'),
      chapter: String(body.chapter || 'General'),
      target: String(body.target || 'General'),
      class_level: String(body.classLevel || '11'),
      board: String(body.board || 'Federal'),
      format: files.length > 0 ? 'pdf' : 'text',
      tags_json: JSON.stringify(tags),
      files_json: JSON.stringify(files),
      is_anonymous: isAnon ? 1 : 0,
      anonymous_alias: 'Anonymous Student',
      author_uid: isAnon ? null : user.uid,
      real_author_uid: user.uid,
      author_name: isAnon ? 'Anonymous Student' : String(body.authorName || user.name || 'Student'),
      author_avatar: isAnon
        ? null
        : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
      author_frame: isAnon ? null : body.authorFrame || null,
      author_equipped_avatar: isAnon
        ? null
        : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
      author_photo_url: null,
      author_role: isAnon ? 'student' : user.role,
      author_custom_role: isAnon ? null : user.customRole,
      status: 'published',
      visibility: 'public',
      is_hidden: 0,
      is_pinned: 0,
      is_featured: 0,
      upvotes: 0,
      downvotes: 0,
      views: 0,
      comment_count: 0,
      save_count: 0,
      shares_count: 0,
      report_count: 0,
      created_at: now,
      updated_at: now,
    };

    memoryStore.posts.unshift(newRow);
    const windowInfo = getDailyPostWindow(now);
    const nextUsed = usedTodayBefore + 1;
    memoryDailyPostCounts.set(`${user.uid}:${windowInfo.dateKey}`, nextUsed);
    const postQuota = buildDailyPostQuotaStatus({
      plan: userPlan,
      usedToday: nextUsed,
      nowMs: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        postId: id,
        quota: postQuota,
        post: rowToCommonsPost(newRow),
      }),
      { status: 201, headers: jsonHeaders }
    );
  }

  // Dynamic routes: /api/posts/:slugOrId[/action]
  const segments = subPath.split('/').filter(Boolean);
  const slugOrId = segments[0] || '';
  const action = segments[1] || '';
  const postId = extractIdFromSlugOrId(slugOrId);

  if (!action && request.method === 'GET') {
    const row = memoryStore.posts.find((p) => p.id === postId || p.slug === slugOrId);
    if (!row) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found.' }),
        { status: 404, headers: jsonHeaders }
      );
    }
    const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
      env?.DB,
      row.is_anonymous ? [] : [row.author_uid]
    );
    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        post: rowToCommonsPost(row, liveAuthorsMap),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (!action && request.method === 'DELETE') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        }),
        { status: 401, headers: jsonHeaders }
      );
    }
    const idx = memoryStore.posts.findIndex((p) => p.id === postId || p.slug === slugOrId);
    if (idx === -1) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found.' }),
        { status: 404, headers: jsonHeaders }
      );
    }
    const existing = memoryStore.posts[idx];
    const isAdmin = user.role === 'superadmin' || user.role === 'admin';
    if (
      existing.real_author_uid !== user.uid &&
      existing.author_uid !== user.uid &&
      !isAdmin
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403, headers: jsonHeaders }
      );
    }
    memoryStore.posts.splice(idx, 1);
    return new Response(
      JSON.stringify({ success: true, deletedId: existing.id }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (action === 'status' && request.method === 'GET') {
    const userId = (url.searchParams.get('userId') || '').trim();
    const row = memoryStore.posts.find((p) => p.id === postId || p.slug === slugOrId);
    const canonicalId = row?.id || postId;
    const voted = Boolean(
      userId && memoryStore.likes.some((l) => l.post_id === canonicalId && l.user_uid === userId)
    );
    const saved = Boolean(
      userId && memoryStore.saves.some((s) => s.post_id === canonicalId && s.user_uid === userId)
    );
    return new Response(
      JSON.stringify({ success: true, voted, saved }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (action === 'like' && request.method === 'POST') {
    const user = await verifyFirebaseIdToken(request, env || {});
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please sign in again' }),
        { status: 401, headers: jsonHeaders }
      );
    }
    const row = memoryStore.posts.find((p) => p.id === postId || p.slug === slugOrId);
    if (!row) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found.' }),
        { status: 404, headers: jsonHeaders }
      );
    }
    const existingLikes = memoryStore.likes.filter(
      (l) => l.post_id === row.id && l.user_uid === user.uid
    );
    let voted = false;
    if (existingLikes.length > 0) {
      memoryStore.likes = memoryStore.likes.filter(
        (l) => !(l.post_id === row.id && l.user_uid === user.uid)
      );
      const remaining = memoryStore.likes.filter((l) => l.post_id === row.id).length;
      row.upvotes = Math.max(remaining, Math.max(0, Number(row.upvotes || 0) - 1));
      voted = false;
    } else {
      memoryStore.likes.push({
        post_id: row.id,
        user_uid: user.uid,
        created_at: Date.now(),
      });
      const total = memoryStore.likes.filter((l) => l.post_id === row.id).length;
      row.upvotes = Math.max(total, Number(row.upvotes || 0) + 1);
      voted = true;
    }
    const newCount = Number(row.upvotes || 0);
    return new Response(
      JSON.stringify({
        success: true,
        voted,
        newCount,
        upvoted: voted,
        upvotesCount: newCount,
        likesCount: newCount,
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (action === 'comments' && request.method === 'GET') {
    const postComments = memoryStore.comments.filter((c) => c.post_id === postId);
    const liveAuthorsMap = await resolveWorkerLiveAuthorsBatch(
      env?.DB,
      postComments.map((c) => (c.is_anonymous ? null : c.author_uid))
    );
    const comments = postComments.map((c) => {
      const isAnon = Boolean(c.is_anonymous);
      const authorUid = isAnon ? null : c.author_uid;
      const live = !isAnon && authorUid ? liveAuthorsMap.get(authorUid) : undefined;
      return {
        id: c.id,
        postId: c.post_id,
        text: c.text,
        isAnonymous: isAnon,
        authorUid,
        authorName: isAnon
          ? c.anonymous_alias || 'Anonymous Student'
          : live?.displayName || live?.username || c.author_name,
        authorUsername: isAnon ? null : live?.username || null,
        authorAvatar: isAnon
          ? null
          : live?.avatar || sanitizeStoreAvatarId(c.author_equipped_avatar, c.author_avatar),
        authorPhotoURL: null,
        createdAt: new Date(Number(c.created_at || Date.now())).toISOString(),
      };
    });
    return new Response(
      JSON.stringify({ success: true, comments }),
      { status: 200, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Bind Cloudflare D1 (DB) and R2 (R2_BUCKET) in Pages settings.',
    }),
    { status: 501, headers: jsonHeaders }
  );
}
