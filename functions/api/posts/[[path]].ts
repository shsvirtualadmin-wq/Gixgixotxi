import worker, { Env } from '../../../cloudflare/worker';
import seedDataset from '../../../data/cloudflare_d1_posts.json';

interface SeedStore {
  posts: any[];
  comments: any[];
  likes: any[];
  saves: any[];
  reports: any[];
  user_roles: any[];
}

const memoryStore: SeedStore = {
  posts: Array.isArray((seedDataset as any)?.posts) ? [...(seedDataset as any).posts] : [],
  comments: Array.isArray((seedDataset as any)?.comments) ? [...(seedDataset as any).comments] : [],
  likes: Array.isArray((seedDataset as any)?.likes) ? [...(seedDataset as any).likes] : [],
  saves: Array.isArray((seedDataset as any)?.saves) ? [...(seedDataset as any).saves] : [],
  reports: Array.isArray((seedDataset as any)?.reports) ? [...(seedDataset as any).reports] : [],
  user_roles: Array.isArray((seedDataset as any)?.user_roles) ? [...(seedDataset as any).user_roles] : [],
};

function rowToClientPost(row: any, viewerUid: string | null) {
  let tags: string[] = [];
  let mediaUrls: string[] = [];
  let mediaMeta: any[] = [];
  try {
    tags = typeof row.tags_json === 'string' ? JSON.parse(row.tags_json) : row.tags || [];
  } catch {}
  try {
    mediaUrls =
      typeof row.media_urls_json === 'string' ? JSON.parse(row.media_urls_json) : row.mediaUrls || [];
  } catch {}
  try {
    mediaMeta =
      typeof row.media_meta_json === 'string' ? JSON.parse(row.media_meta_json) : row.mediaMeta || [];
  } catch {}

  const likedByMe = viewerUid
    ? memoryStore.likes.some((l) => l.post_id === row.id && l.uid === viewerUid)
    : false;
  const savedByMe = viewerUid
    ? memoryStore.saves.some((s) => s.post_id === row.id && s.uid === viewerUid)
    : false;

  const createdMs = Number(row.created_at) || Date.now();
  const updatedMs = Number(row.updated_at) || createdMs;

  return {
    id: row.id,
    slug: row.slug,
    authorId: row.author_uid,
    authorUid: row.author_uid,
    authorName: row.author_name || 'Anonymous Student',
    authorUsername: row.author_username || 'student',
    authorPhoto: row.author_photo || '',
    authorCustomRole: row.author_custom_role || null,
    isAnonymous: Boolean(row.is_anonymous),
    title: row.title || '',
    body: row.body || '',
    content: row.body || '',
    summary: row.summary || '',
    postType: row.post_type || 'study_material',
    type: row.post_type || 'study_material',
    format: row.format || 'text',
    subject: row.subject || 'General',
    topic: row.topic || 'General',
    classLevel: row.class_level || '11',
    class: row.class_level || '11',
    board: row.board || 'Federal',
    stream: row.stream || 'pre_engineering',
    tags,
    mediaUrls,
    mediaMeta,
    attachmentUrl: row.attachment_url || null,
    attachmentName: row.attachment_name || null,
    attachmentSize: Number(row.attachment_size || 0),
    attachmentMimeType: row.attachment_mime_type || null,
    r2Key: row.r2_key || null,
    likesCount: Number(row.likes_count || 0),
    commentsCount: Number(row.comments_count || 0),
    savesCount: Number(row.saves_count || 0),
    viewsCount: Number(row.views_count || 0),
    reportsCount: Number(row.reports_count || 0),
    likedByMe,
    savedByMe,
    status: row.status || 'published',
    visibility: row.visibility || 'public',
    createdAt: createdMs,
    updatedAt: updatedMs,
  };
}

export async function onRequest(context: {
  request: Request;
  env: Partial<Env>;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const { request, env } = context;

  // If Cloudflare D1 binding is configured on the Pages project, delegate directly to the D1 + R2 Worker
  if (env && env.DB) {
    const fullEnv: Env = {
      DB: env.DB,
      R2_BUCKET: env.R2_BUCKET as any,
      FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
      R2_PUBLIC_BASE_URL:
        env.R2_PUBLIC_BASE_URL || 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev',
      ALLOWED_ORIGIN: env.ALLOWED_ORIGIN || 'https://boardly.cfd',
      SUPERADMIN_UIDS: env.SUPERADMIN_UIDS || 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
      SUPERADMIN_EMAILS:
        env.SUPERADMIN_EMAILS || 'shsvirtualadmin@gmail.com,support@boardly.cfd',
    };
    return worker.fetch(request, fullEnv, context as any);
  }

  // Fallback for Cloudflare Pages before D1 database binding is attached:
  // Serve the 56 migrated Cloudflare posts from the bundled dataset
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');

  // GET /api/posts
  if (request.method === 'GET' && path === '/api/posts') {
    const tab = url.searchParams.get('tab') || 'newest';
    const subject = url.searchParams.get('subject') || 'All';
    const postType = url.searchParams.get('postType') || 'All';
    const classLevel = url.searchParams.get('classLevel') || 'All';
    const board = url.searchParams.get('board') || 'All';
    const search = (url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 30), 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);

    let rows = memoryStore.posts.filter(
      (p) => p.status === 'published' && p.visibility === 'public'
    );

    if (subject && subject !== 'All') {
      rows = rows.filter(
        (p) => String(p.subject || '').toLowerCase() === subject.toLowerCase()
      );
    }
    if (postType && postType !== 'All') {
      rows = rows.filter((p) => p.post_type === postType);
    }
    if (classLevel && classLevel !== 'All') {
      rows = rows.filter((p) => String(p.class_level) === String(classLevel));
    }
    if (board && board !== 'All') {
      rows = rows.filter(
        (p) => String(p.board || '').toLowerCase() === board.toLowerCase()
      );
    }
    if (search) {
      rows = rows.filter(
        (p) =>
          String(p.title || '').toLowerCase().includes(search) ||
          String(p.body || '').toLowerCase().includes(search) ||
          String(p.subject || '').toLowerCase().includes(search) ||
          String(p.topic || '').toLowerCase().includes(search)
      );
    }

    if (tab === 'popular') {
      rows.sort(
        (a, b) =>
          Number(b.likes_count || 0) - Number(a.likes_count || 0) ||
          Number(b.created_at || 0) - Number(a.created_at || 0)
      );
    } else if (tab === 'unanswered') {
      rows = rows.filter(
        (p) => p.post_type === 'question' && Number(p.comments_count || 0) === 0
      );
      rows.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
    } else if (tab === 'study_materials') {
      rows = rows.filter((p) => p.post_type === 'study_material');
      rows.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
    } else {
      rows.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
    }

    const total = rows.length;
    const paged = rows.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        ok: true,
        source: 'cloudflare-pages-edge-seed',
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
        posts: paged.map((r) => rowToClientPost(r, null)),
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // GET /api/posts/slug/:slug or GET /api/posts/:idOrSlug
  const singleMatch =
    path.match(/^\/api\/posts\/slug\/([^/]+)$/) || path.match(/^\/api\/posts\/([^/]+)$/);
  if (request.method === 'GET' && singleMatch) {
    const idOrSlug = decodeURIComponent(singleMatch[1]);
    const row = memoryStore.posts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: 'Post not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }
    const comments = memoryStore.comments
      .filter((c) => c.post_id === row.id)
      .sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0))
      .map((c) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_uid,
        authorName: c.author_name,
        authorUsername: c.author_username || 'student',
        authorPhoto: c.author_photo || '',
        authorCustomRole: c.author_custom_role || null,
        body: c.body,
        content: c.body,
        createdAt: Number(c.created_at || Date.now()),
      }));
    return new Response(
      JSON.stringify({
        ok: true,
        post: rowToClientPost(row, null),
        comments,
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Bind Cloudflare D1 database (DB) in Pages settings to enable write operations on edge.',
    }),
    { status: 501, headers: corsHeaders }
  );
}
