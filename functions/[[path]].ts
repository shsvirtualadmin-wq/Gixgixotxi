import {
  resolveStaticOrPatternRouteMeta,
  injectMetaIntoIndexHtml,
  type RouteDynamicDataInput,
} from '../src/utils/routeSeoMeta';
import {
  buildHumanEntitySlug,
  extractEntityIdOrShortToken,
  isLegacyLongIdSlug,
  matchesEntitySlugOrId,
} from '../src/utils/sharePreviewHelper';
import { renderBoardlyOgCardPngEdge } from '../src/utils/ogCardPngFallback';

interface Env {
  ASSETS: {
    fetch: (req: Request | string) => Promise<Response>;
  };
  DB?: D1Database;
}

const WORKER_API_ORIGIN = 'https://boardly-posts-api.shsvirtualadmin.workers.dev';
const FIREBASE_PROJECT_ID = 'boardly-app-69026';

const STATIC_ASSET_EXT =
  /\.(?:js|mjs|css|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|pdf|txt|xml|json|webmanifest)$/i;

const BOT_UA_REGEX =
  /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|pinterest|googlebot|bingbot|yandex|duckduckbot|applebot|crawler|spider|embedly|quora|outbrain|vkshare|w3c_validator/i;

function readFirestoreField(fields: Record<string, any> | undefined, key: string): any {
  const f = fields?.[key];
  if (!f || typeof f !== 'object') return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return Number(f.integerValue);
  if ('doubleValue' in f) return Number(f.doubleValue);
  if ('booleanValue' in f) return Boolean(f.booleanValue);
  return undefined;
}

async function fetchFirestorePublicDoc(
  collectionName: string,
  docId: string
): Promise<Record<string, any> | null> {
  if (!docId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(
      collectionName
    )}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json: any = await res.json();
    const fields = json?.fields;
    if (!fields) return null;
    return {
      displayName: readFirestoreField(fields, 'displayName') || readFirestoreField(fields, 'name'),
      username: readFirestoreField(fields, 'username'),
      bio: readFirestoreField(fields, 'bio'),
      photoURL: readFirestoreField(fields, 'photoURL') || readFirestoreField(fields, 'avatarUrl'),
      role: readFirestoreField(fields, 'role'),
      uid: readFirestoreField(fields, 'uid') || docId,
      followersCount: readFirestoreField(fields, 'followersCount'),
      postsCount: readFirestoreField(fields, 'postsCount'),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const { pathname, search } = url;

  if (pathname === '/api/og' || pathname === '/api/og/') {
    try {
      const pngBytes = await renderBoardlyOgCardPngEdge({
        type: url.searchParams.get('type') || 'default',
        title: url.searchParams.get('title') || '',
        subtitle: url.searchParams.get('subtitle') || '',
        badge: url.searchParams.get('badge') || '',
        meta: url.searchParams.get('meta') || '',
        avatar: url.searchParams.get('avatar') || '',
      });
      return new Response(pngBytes, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return Response.redirect('https://boardly.cfd/assets/og-image.png', 302);
    }
  }

  // Let API routes and static files pass through untouched
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    STATIC_ASSET_EXT.test(pathname)
  ) {
    return next();
  }

  const ua = request.headers.get('user-agent') || '';
  const isCrawler =
    BOT_UA_REGEX.test(ua) ||
    url.searchParams.get('crawler') === '1' ||
    url.searchParams.get('crawler') === 'true';

  const dynamicData: RouteDynamicDataInput = {};
  let redirectUrl: string | null = null;

  // 1. Resolve Commons Post or Study Material metadata
  if (
    (pathname.startsWith('/commons/post/') ||
      pathname.startsWith('/material/') ||
      pathname.startsWith('/study-material/')) &&
    !pathname.startsWith('/material/subject/') &&
    !pathname.startsWith('/study-material/subject/')
  ) {
    const rawSegment = pathname
      .replace(/^\/commons\/post\//, '')
      .replace(/^\/study-material\//, '')
      .replace(/^\/material\//, '')
      .replace(/\/+$/, '');
    const slugParam = decodeURIComponent(rawSegment);
    const parsedSlug = extractEntityIdOrShortToken(slugParam);

    let postRow: any = null;
    if (env.DB) {
      try {
        const lookupId = parsedSlug.legacyFullId || slugParam;
        const shortPrefix = parsedSlug.shortToken ? `${parsedSlug.shortToken}%` : '';
        postRow = await env.DB.prepare(
          `SELECT id, slug, title, description, subject, subject_tag, board_tag, class_level, author_name, is_anonymous, files_json, visibility, is_hidden, updated_at, created_at
           FROM posts
           WHERE id = ?1 OR slug = ?2 OR (?3 != '' AND LOWER(id) LIKE ?3)
           LIMIT 1`
        )
          .bind(lookupId, slugParam, shortPrefix)
          .first();
      } catch {
        // Ignore D1 error and try Worker API fallback
      }
    }

    if (!postRow) {
      try {
        const apiRes = await fetch(
          `${WORKER_API_ORIGIN}/api/posts/${encodeURIComponent(slugParam)}`
        );
        if (apiRes.ok) {
          const apiData: any = await apiRes.json();
          if (apiData?.post) {
            postRow = {
              id: apiData.post.id,
              slug: apiData.post.slug,
              title: apiData.post.title,
              description: apiData.post.description || apiData.post.body,
              subject: apiData.post.subject,
              board_tag: apiData.post.boardTag,
              class_level: apiData.post.classLevel,
              author_name: apiData.post.authorName,
              is_anonymous: apiData.post.isAnonymous ? 1 : 0,
              files_json: apiData.post.files,
              visibility: apiData.post.visibility || 'public',
              is_hidden: apiData.post.isHidden ? 1 : 0,
              updated_at: apiData.post.updatedAt,
            };
          }
        } else if (apiRes.status === 404 || apiRes.status === 403 || apiRes.status === 410) {
          dynamicData.post = { isPrivateOrMissing: true };
        }
      } catch {
        // Fallback to slug metadata
      }
    }

    if (postRow) {
      const isPrivateOrHidden =
        Boolean(postRow.is_hidden) ||
        String(postRow.visibility || 'public').toLowerCase() === 'private';
      if (isPrivateOrHidden) {
        dynamicData.post = { isPrivateOrMissing: true };
      } else {
        const canonicalSlug = buildHumanEntitySlug(postRow.id, postRow.title);
        dynamicData.post = {
          id: String(postRow.id || slugParam),
          title: String(postRow.title || ''),
          body: String(postRow.description || ''),
          authorName: postRow.is_anonymous
            ? 'Anonymous Student'
            : String(postRow.author_name || 'Boardly Student'),
          subject: String(postRow.subject || postRow.subject_tag || 'Commons'),
          boardTag: postRow.board_tag ? String(postRow.board_tag) : undefined,
          classLevel: postRow.class_level ? String(postRow.class_level) : undefined,
          slug: canonicalSlug,
          filesJson: postRow.files_json,
          updatedAt: String(postRow.updated_at || postRow.created_at || ''),
        };
        const prefix = pathname.startsWith('/commons/post/') ? '/commons/post' : '/material';
        if (isLegacyLongIdSlug(slugParam) && canonicalSlug && slugParam !== canonicalSlug) {
          redirectUrl = `${prefix}/${canonicalSlug}`;
        }
      }
    }
  }

  // 2. Resolve Grand Line Test metadata (/grand-line/test/:slug, /tests/:slug, /test/:slug)
  if (
    pathname.startsWith('/grand-line/test/') ||
    pathname.startsWith('/tests/') ||
    pathname.startsWith('/test/')
  ) {
    const rawSegment = pathname
      .replace(/^\/(?:grand-line\/test|tests|test)\//, '')
      .replace(/\/run$/, '');
    const slugParam = decodeURIComponent(rawSegment);
    const parsedSlug = extractEntityIdOrShortToken(slugParam);

    let testRow: any = null;
    if (env.DB) {
      try {
        const lookupId = parsedSlug.legacyFullId || slugParam;
        const shortPrefix = parsedSlug.shortToken ? `${parsedSlug.shortToken}%` : '';
        const candidates = await env.DB.prepare(
          `SELECT id, title, description, subject, duration_minutes, questions_json, visibility, status, captain_name, created_at
           FROM captain_tests
           WHERE id = ?1 OR (?2 != '' AND LOWER(id) LIKE ?2)
           LIMIT 10`
        )
          .bind(lookupId, shortPrefix)
          .all();
        const rows = candidates?.results || [];
        testRow =
          rows.find((r: any) =>
            matchesEntitySlugOrId({ id: r.id, title: r.title }, slugParam)
          ) || rows[0] || null;

        if (!testRow) {
          const allPublic = await env.DB.prepare(
            `SELECT id, title, description, subject, duration_minutes, questions_json, visibility, status, captain_name, created_at
             FROM captain_tests
             WHERE status = 'published'
             ORDER BY created_at DESC
             LIMIT 100`
          ).all();
          testRow =
            (allPublic?.results || []).find((r: any) =>
              matchesEntitySlugOrId({ id: r.id, title: r.title }, slugParam)
            ) || null;
        }
      } catch {
        // Ignore D1 error and try Worker API fallback
      }
    }

    if (!testRow) {
      try {
        const lookupToken = parsedSlug.legacyFullId || slugParam;
        const apiRes = await fetch(
          `${WORKER_API_ORIGIN}/api/tests/${encodeURIComponent(lookupToken)}?view=info`
        );
        if (apiRes.ok) {
          const apiData: any = await apiRes.json();
          if (apiData?.test) {
            testRow = {
              id: apiData.test.id,
              title: apiData.test.title,
              description: apiData.test.description,
              subject: apiData.test.subject,
              duration_minutes: apiData.test.durationMinutes,
              questionCount: apiData.test.questionCount,
              visibility: apiData.test.visibility || 'public',
              status: apiData.test.status || 'published',
              captain_name: apiData.test.captainName || apiData.test.creatorName,
              created_at: apiData.test.createdAt,
            };
          }
        } else if (apiRes.status === 401 || apiRes.status === 403) {
          dynamicData.test = { isPrivateOrMissing: true };
        }
      } catch {
        // Fallback to slug metadata
      }
    }

    if (testRow) {
      const isPrivateOrUnpublished =
        String(testRow.visibility || 'public').toLowerCase() === 'private' ||
        (testRow.status && String(testRow.status).toLowerCase() !== 'published');
      if (isPrivateOrUnpublished) {
        dynamicData.test = { isPrivateOrMissing: true };
      } else {
        let qCount = Number(testRow.questionCount || 0);
        if (!qCount && testRow.questions_json) {
          try {
            const parsedQ = JSON.parse(String(testRow.questions_json));
            if (Array.isArray(parsedQ)) qCount = parsedQ.length;
          } catch {
            qCount = 0;
          }
        }
        const canonicalSlug = buildHumanEntitySlug(testRow.id, testRow.title);
        dynamicData.test = {
          id: String(testRow.id),
          title: String(testRow.title || ''),
          description: String(testRow.description || ''),
          subject: String(testRow.subject || ''),
          slug: canonicalSlug,
          questionCount: qCount || null,
          durationMinutes: Number(testRow.duration_minutes || 0) || null,
          creatorName: testRow.captain_name ? String(testRow.captain_name) : null,
          updatedAt: String(testRow.created_at || ''),
        };
        if (isLegacyLongIdSlug(slugParam) && canonicalSlug && slugParam !== canonicalSlug) {
          redirectUrl = `/grand-line/test/${canonicalSlug}`;
        }
      }
    }
  }

  // 3. Resolve Public User & Captain Profile metadata (/u/:username, /profile/:userId, /captains/:username)
  const isCaptainProfileRoute =
    pathname.startsWith('/captains/') &&
    pathname !== '/captains/apply' &&
    pathname !== '/captains/leaderboard';
  if (
    pathname.startsWith('/u/') ||
    (pathname.startsWith('/profile/') && pathname !== '/profile/edit') ||
    pathname.startsWith('/user/') ||
    pathname.startsWith('/users/') ||
    isCaptainProfileRoute
  ) {
    const rawUser = decodeURIComponent(pathname.split('/').pop() || '').trim();
    const cleanHandle = rawUser.replace(/^@+/, '');

    let profileData: RouteDynamicDataInput['profile'] = null;

    if (env.DB && cleanHandle) {
      try {
        const roleRow: any = await env.DB.prepare(
          `SELECT uid, display_name, role FROM user_roles WHERE LOWER(uid) = LOWER(?1) OR LOWER(display_name) = LOWER(?1) LIMIT 1`
        )
          .bind(cleanHandle)
          .first();

        const postStats: any = await env.DB.prepare(
          `SELECT author_uid, author_name, author_username, author_avatar, author_role, COUNT(*) as cnt
           FROM posts
           WHERE is_hidden = 0 AND is_anonymous = 0
             AND (LOWER(author_uid) = LOWER(?1) OR LOWER(author_username) = LOWER(?1))`
        )
          .bind(cleanHandle)
          .first();

        if (roleRow || (postStats && Number(postStats.cnt) > 0)) {
          profileData = {
            uid: roleRow?.uid || postStats?.author_uid || rawUser,
            displayName: roleRow?.display_name || postStats?.author_name || undefined,
            username: postStats?.author_username || cleanHandle,
            avatarUrl: postStats?.author_avatar || null,
            role: roleRow?.role || postStats?.author_role || null,
            postsCount: postStats && Number(postStats.cnt) > 0 ? Number(postStats.cnt) : null,
          };
        }
      } catch {
        // Ignore D1 lookup error
      }
    }

    if (!profileData?.displayName && cleanHandle) {
      const unameDoc = await fetchFirestorePublicDoc('usernames', cleanHandle.toLowerCase());
      const resolvedUid = unameDoc?.uid || cleanHandle;
      const pubDoc =
        (await fetchFirestorePublicDoc('publicProfiles', resolvedUid)) ||
        (await fetchFirestorePublicDoc('users', resolvedUid));
      if (pubDoc || unameDoc) {
        profileData = {
          uid: resolvedUid,
          displayName: pubDoc?.displayName || unameDoc?.displayName || profileData?.displayName,
          username: pubDoc?.username || unameDoc?.username || cleanHandle,
          bio: pubDoc?.bio,
          avatarUrl: pubDoc?.photoURL || profileData?.avatarUrl || null,
          role: pubDoc?.role || profileData?.role || null,
          followersCount:
            typeof pubDoc?.followersCount === 'number' ? pubDoc.followersCount : null,
          postsCount:
            typeof pubDoc?.postsCount === 'number'
              ? pubDoc.postsCount
              : profileData?.postsCount ?? null,
        };
      }
    }

    if (profileData) {
      dynamicData.profile = profileData;
    }
  }

  // Redirect old long-UUID links for regular browser navigation to the clean canonical URL
  if (!isCrawler && redirectUrl && redirectUrl !== pathname) {
    return Response.redirect(`${url.origin}${redirectUrl}${search || ''}`, 301);
  }

  // Fetch the SPA index.html asset
  let response = await next();
  if (response.status === 404 && !STATIC_ASSET_EXT.test(pathname)) {
    response = await env.ASSETS.fetch(new URL('/index.html', url.origin).toString());
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  const meta = resolveStaticOrPatternRouteMeta(pathname, search, dynamicData);
  const injectedHtml = injectMetaIntoIndexHtml(html, meta);

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(injectedHtml, {
    status: response.status === 404 ? 200 : response.status,
    headers,
  });
};
