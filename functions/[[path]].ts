import { resolveStaticOrPatternRouteMeta, injectMetaIntoIndexHtml } from '../src/utils/routeSeoMeta';

export async function onRequest(context: any): Promise<Response> {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Let API routes or static asset extensions pass through normally
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|webp|webm|mp4|svg|ico|xml|txt|json|woff2?|map|pdf)$/i.test(pathname)
  ) {
    return next();
  }

  // Resolve route-specific metadata (and enrich from D1 if available on Cloudflare Pages)
  let meta = resolveStaticOrPatternRouteMeta(pathname);

  if (
    (pathname.startsWith('/commons/post/') ||
      pathname.startsWith('/material/') ||
      pathname.startsWith('/study-material/')) &&
    !pathname.startsWith('/material/subject/') &&
    !pathname.startsWith('/study-material/subject/') &&
    env?.DB
  ) {
    try {
      const slugParam = decodeURIComponent(
        pathname
          .replace(/^\/commons\/post\//, '')
          .replace(/^\/study-material\//, '')
          .replace(/^\/material\//, '')
          .replace(/\/+$/, '')
      );
      const idMatch = slugParam.match(/^([a-zA-Z0-9_-]{8,36})/);
      const lookupId = idMatch ? idMatch[1] : slugParam;
      const row: any = await env.DB.prepare(
        `SELECT id, slug, title, description, subject, class_level, author_name, is_anonymous
         FROM posts
         WHERE (slug = ? OR id = ? OR id = ?) AND is_hidden = 0
         LIMIT 1`
      )
        .bind(slugParam, slugParam, lookupId)
        .first();

      if (row) {
        const isMaterial = pathname.startsWith('/material/') || pathname.startsWith('/study-material/');
        const title = isMaterial
          ? `${row.title} — ${row.subject || 'Study Material'} PDF & Notes | Boardly`
          : `${row.title} — ${row.subject || 'Student Discussion'} | Boardly Commons`;
        const rawDesc = String(row.description || '').replace(/\s+/g, ' ').trim();
        const authorLabel = row.is_anonymous ? 'Anonymous Student' : row.author_name || 'Boardly Student';
        const description = rawDesc
          ? `${rawDesc.slice(0, 180)}${rawDesc.length > 180 ? '...' : ''} — Shared by ${authorLabel} (${row.subject || 'Academic'}, Class ${row.class_level || '11/12'}).`
          : `Read "${row.title}" in ${row.subject || 'Boardly Commons'} on Boardly.`;
        meta = {
          ...meta,
          title,
          description,
          ogType: 'article',
        };
      }
    } catch {
      // Fallback to pattern-based metadata if D1 query fails
    }
  }

  // Fetch index.html from Cloudflare Pages static asset binding (SPA fallback)
  let assetResponse: Response;
  if (env?.ASSETS?.fetch) {
    assetResponse = await env.ASSETS.fetch(new URL('/index.html', url.origin));
  } else {
    assetResponse = await next(new Request(new URL('/index.html', url.origin), request));
  }

  const contentType = assetResponse.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return assetResponse;
  }

  const rawHtml = await assetResponse.text();
  const enrichedHtml = injectMetaIntoIndexHtml(rawHtml, meta);

  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  return new Response(enrichedHtml, {
    status: 200,
    headers,
  });
}
