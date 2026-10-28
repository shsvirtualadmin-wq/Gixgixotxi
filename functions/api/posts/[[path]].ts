import worker, {
  Env,
  rowToCommonsPost,
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
    const sort = (url.searchParams.get('sort') || 'newest').trim();

    let rows = memoryStore.posts.filter((p) => !p.is_hidden);

    if (subject && subject !== 'all') {
      rows = rows.filter((p) => String(p.subject || '').toLowerCase() === subject);
    }
    if (type && type !== 'all') {
      rows = rows.filter((p) => p.type === type);
    }
    if (target && target !== 'all') {
      rows = rows.filter((p) => String(p.target || '').toLowerCase() === target);
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

    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        total,
        offset,
        limit: pageSize,
        hasMore,
        nextOffset: hasMore ? offset + pageSize : null,
        posts: paged.map((r) => rowToCommonsPost(r)),
      }),
      { status: 200, headers: jsonHeaders }
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
      author_avatar: isAnon ? null : body.authorAvatar || null,
      author_frame: isAnon ? null : body.authorFrame || null,
      author_equipped_avatar: isAnon ? null : body.authorEquippedAvatar || null,
      author_photo_url: isAnon ? null : body.authorPhotoURL || user.picture || null,
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

    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        postId: id,
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
    return new Response(
      JSON.stringify({
        success: true,
        backendMode: 'preview-demo',
        post: rowToCommonsPost(row),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (action === 'status' && request.method === 'GET') {
    const userId = (url.searchParams.get('userId') || '').trim();
    const voted = Boolean(
      userId && memoryStore.likes.some((l) => l.post_id === postId && l.user_uid === userId)
    );
    const saved = Boolean(
      userId && memoryStore.saves.some((s) => s.post_id === postId && s.user_uid === userId)
    );
    return new Response(
      JSON.stringify({ success: true, voted, saved }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (action === 'comments' && request.method === 'GET') {
    const comments = memoryStore.comments
      .filter((c) => c.post_id === postId)
      .map((c) => ({
        id: c.id,
        postId: c.post_id,
        text: c.text,
        isAnonymous: Boolean(c.is_anonymous),
        authorUid: c.is_anonymous ? null : c.author_uid,
        authorName: c.is_anonymous ? 'Anonymous Student' : c.author_name,
        authorAvatar: c.is_anonymous ? null : c.author_avatar,
        createdAt: new Date(Number(c.created_at || Date.now())).toISOString(),
      }));
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
