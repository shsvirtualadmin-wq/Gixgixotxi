/**
 * Cloudflare Pages Function — Dynamic Server-Side HTML & SEO Injector (`functions/[[path]].ts`)
 *
 * Ensures that:
 * 1. Every `/commons/post/<postId>-<slug>` (and `/commons/post/<postId>`) request looks up the post
 *    in Cloudflare D1 (`env.DB`) strictly by the post ID (`extractPostIdFromSlug`), regardless of
 *    whether the slug suffix is missing, wrong, or outdated.
 * 2. Returns HTTP 200 for real public posts with:
 *    - Unique `<title>`
 *    - `<meta name="description">` (first 150–160 characters of the post)
 *    - `<link rel="canonical">` pointing to the post's true canonical URL (`https://boardly.cfd/commons/post/<postId>-<canonical-slug>`)
 *    - Open Graph & Twitter tags (`title`, `description`, `url`, `image`)
 *    - Real semantic HTML inside `<div id="root">` (`<article>`: `<h1>` heading, body text, author name, date, and top comments)
 *    - `DiscussionForumPosting` JSON-LD structured data (`headline`, `text`, `author`, `datePublished`, `commentCount`, `url`)
 * 3. Returns a real HTTP 404 (with `noindex, nofollow`) for posts that do not exist, were deleted, or are hidden/private.
 * 4. Serves `/sitemap.xml` dynamically from D1 with `<lastmod>` dates for all public posts when requested.
 * 5. Never redirects post URLs to `/commons` or `/login`.
 */

import { resolveStaticOrPatternRouteMeta } from '../src/utils/routeSeoMeta';
import { onRequest as onApiRequest } from './api/[[path]]';

const AUTHENTICATED_APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/store',
  '/rewards',
  '/wallet',
  '/checkout',
  '/settings',
  '/saved',
  '/notifications',
  '/messages',
  '/results',
  '/practice',
  '/test',
  '/onboarding',
  '/verify-email',
  '/profile/edit',
  '/arena/register',
  '/arena/test',
];

export function isAuthenticatedAppRoute(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return AUTHENTICATED_APP_ROUTE_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(`${prefix}/`)
  );
}

interface Env {
  DB?: {
    prepare: (sql: string) => {
      bind: (...args: unknown[]) => {
        first: <T = Record<string, unknown>>() => Promise<T | null>;
        all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
      };
      all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
    };
  };
}

interface D1PostRow {
  id: string;
  slug: string;
  type?: string;
  title: string;
  description: string;
  subject: string;
  chapter?: string;
  class_level: string;
  board: string;
  author_name: string;
  is_anonymous: number;
  anonymous_alias?: string;
  is_hidden: number;
  status?: string;
  visibility?: string;
  upvotes?: number;
  comment_count?: number;
  files_json?: string;
  created_at?: number;
  updated_at?: number;
}

interface D1CommentRow {
  id: string;
  post_id: string;
  text: string;
  is_anonymous: number;
  author_name: string;
  created_at: number;
}

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildCanonicalSlug(id: string, title?: string | null): string {
  const cleanId = String(id || '').trim();
  const cleanTitle = String(title || 'post')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return cleanTitle ? `${cleanId}-${cleanTitle}` : cleanId;
}

/**
 * Extracts the canonical post ID from any `<postId>-<slug>` or `<postId>` URL segment.
 * Always looks up by the ID part only so missing, wrong, or outdated slugs still resolve the post.
 */
export function extractPostIdFromSlug(slugOrId: string): string {
  const trimmed = decodeURIComponent(String(slugOrId || '')).trim();
  if (!trimmed) return '';

  const uuidMatch = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i
  );
  if (uuidMatch) return uuidMatch[1];

  const anonTopicMatch = trimmed.match(/^(commons_anon_topic_\d+)(?:-|$)/i);
  if (anonTopicMatch) return anonTopicMatch[1];

  const postGenMatch = trimmed.match(/^(post_gen_\d+)(?:-|$)/i);
  if (postGenMatch) return postGenMatch[1];

  const postTsMatch = trimmed.match(/^(post_\d+_[a-zA-Z0-9]+)(?:-|$)/i);
  if (postTsMatch) return postTsMatch[1];

  const postGenericMatch = trimmed.match(/^(post_[a-zA-Z0-9_]+)(?:-|$)/i);
  if (postGenericMatch) return postGenericMatch[1];

  const glMatch = trimmed.match(/^(gl-[a-z0-9]+-\d+)(?:-|$)/i);
  if (glMatch) return glMatch[1];

  const dashIdx = trimmed.indexOf('-');
  if (dashIdx > 0) {
    return trimmed.slice(0, dashIdx);
  }
  return trimmed;
}

/**
 * Formats the post meta description to 150–160 characters.
 */
export function buildPostMetaDescription(rawDescription: string, fallbackTitle: string, subject?: string): string {
  const clean = String(rawDescription || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) {
    return `Read "${fallbackTitle}" in ${subject || 'Boardly Commons'} on Boardly — student notes, discussions, and exam prep.`;
  }
  if (clean.length <= 160) {
    return clean;
  }
  const sliced = clean.slice(0, 157);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace >= 135 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.replace(/[.,;:\-–—]+$/, '')}...`;
}

function toIsoDate(msOrSec: number | undefined | null): string {
  const num = Number(msOrSec || 0);
  if (!num || !Number.isFinite(num) || num <= 0) {
    return new Date().toISOString();
  }
  const ms = num < 10_000_000_000 ? num * 1000 : num;
  try {
    return new Date(ms).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function formatReadableDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function renderPostSsrHtmlAndJsonLd(
  row: D1PostRow,
  comments: D1CommentRow[],
  canonicalUrl: string
): { articleHtml: string; jsonLdString: string } {
  const authorName = row.is_anonymous
    ? row.anonymous_alias || 'Anonymous Student'
    : row.author_name || 'Boardly Student';
  const publishedIso = toIsoDate(row.created_at);
  const modifiedIso = toIsoDate(row.updated_at || row.created_at);
  const readableDate = formatReadableDate(publishedIso);
  const commentCount = Math.max(Number(row.comment_count || 0), comments.length);
  const bodyParagraphs = String(row.description || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const bodyHtml =
    bodyParagraphs.length > 0
      ? bodyParagraphs
          .map((p) => `<p>${escapeHtmlText(p).replace(/\n/g, '<br />')}</p>`)
          .join('\n      ')
      : `<p>${escapeHtmlText(row.title)}</p>`;

  const commentsHtml =
    comments.length > 0
      ? `<section class="post-comments" aria-label="Top Comments" style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(128,128,128,0.2);">
      <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:0.75rem;">Comments (${commentCount})</h2>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.75rem;">
        ${comments
          .map((c) => {
            const cAuthor = c.is_anonymous ? 'Anonymous Student' : c.author_name || 'Student';
            const cIso = toIsoDate(c.created_at);
            const cDate = formatReadableDate(cIso);
            return `<li style="padding:0.75rem;border-radius:0.75rem;background:rgba(128,128,128,0.06);">
          <div style="font-size:0.8125rem;opacity:0.8;margin-bottom:0.25rem;">
            <strong>${escapeHtmlText(cAuthor)}</strong> · <time datetime="${escapeHtmlAttr(cIso)}">${escapeHtmlText(cDate)}</time>
          </div>
          <div style="font-size:0.9375rem;">${escapeHtmlText(c.text)}</div>
        </li>`;
          })
          .join('\n        ')}
      </ul>
    </section>`
      : `<section class="post-comments" aria-label="Comments" style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(128,128,128,0.2);">
      <h2 style="font-size:1.125rem;font-weight:700;margin-bottom:0.5rem;">Comments (${commentCount})</h2>
      <p style="font-size:0.875rem;opacity:0.75;">Join the discussion on Boardly Commons.</p>
    </section>`;

  const articleHtml = `<article class="boardly-ssr-post" data-ssr-post-id="${escapeHtmlAttr(row.id)}" style="max-width:780px;margin:2rem auto;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif;line-height:1.65;">
    <header style="margin-bottom:1.25rem;">
      <div class="post-meta" style="font-size:0.875rem;opacity:0.8;margin-bottom:0.5rem;">
        <span>${escapeHtmlText(row.subject || 'General')}</span>
        ${row.chapter && row.chapter !== 'General' ? ` · <span>${escapeHtmlText(row.chapter)}</span>` : ''}
        · <span>Posted by <strong class="post-author">${escapeHtmlText(authorName)}</strong></span>
        · <time datetime="${escapeHtmlAttr(publishedIso)}">${escapeHtmlText(readableDate)}</time>
      </div>
      <h1 style="font-size:1.75rem;font-weight:800;line-height:1.25;margin:0;">${escapeHtmlText(row.title)}</h1>
    </header>
    <div class="post-body" style="font-size:1rem;line-height:1.7;">
      ${bodyHtml}
    </div>
    ${commentsHtml}
  </article>`;

  const jsonLdObj = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': canonicalUrl,
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline: row.title,
    text: String(row.description || row.title),
    articleSection: row.subject || 'General',
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Boardly',
      url: 'https://boardly.cfd',
    },
    commentCount,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: Number(row.upvotes || 0),
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: commentCount,
      },
    ],
    ...(comments.length > 0
      ? {
          comment: comments.slice(0, 10).map((c) => ({
            '@type': 'Comment',
            text: c.text,
            dateCreated: toIsoDate(c.created_at),
            author: {
              '@type': 'Person',
              name: c.is_anonymous ? 'Anonymous Student' : c.author_name || 'Student',
            },
          })),
        }
      : {}),
  };

  return {
    articleHtml,
    jsonLdString: JSON.stringify(jsonLdObj).replace(/</g, '\\u003c'),
  };
}

export const onRequest = async (context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
  waitUntil?: (promise: Promise<unknown>) => void;
}) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 0. Never redirect, rewrite, or 404 any /api/* path — delegate directly to the API handler
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return onApiRequest({
      request,
      env: (env || {}) as any,
      waitUntil: context.waitUntil || (() => {}),
    });
  }

  // Never apply SEO redirects, trailing-slash rules, or 404 handling to non-GET requests or static assets
  if (
    request.method !== 'GET' ||
    pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|xml|txt|json|woff2?|map|pdf)$/i.test(pathname)
  ) {
    // Allow dynamic sitemap XML generation for GET /sitemap*.xml
    if (
      request.method === 'GET' &&
      (pathname === '/sitemap.xml' || pathname === '/sitemap-posts.xml' || pathname === '/sitemap-index.xml') &&
      env?.DB
    ) {
      // Fall through to sitemap block below
    } else {
      return next();
    }
  }

  // 1. Dynamic Sitemap XML from D1 (lists every public post with lastmod)
  if (
    (pathname === '/sitemap.xml' || pathname === '/sitemap-posts.xml' || pathname === '/sitemap-index.xml') &&
    request.method === 'GET' &&
    env?.DB
  ) {
    try {
      if (pathname === '/sitemap-index.xml') {
        const nowIso = new Date().toISOString();
        const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://boardly.cfd/sitemap.xml</loc>
    <lastmod>${nowIso}</lastmod>
  </sitemap>
</sitemapindex>`;
        return new Response(indexXml, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
          },
        });
      }

      const { results } = await env.DB.prepare(
        "SELECT id, slug, title, files_json, created_at, updated_at FROM posts WHERE is_hidden = 0 AND (status IS NULL OR status != 'removed') AND (visibility IS NULL OR visibility = 'public') ORDER BY created_at DESC LIMIT 5000"
      ).all<{
        id: string;
        slug: string;
        title: string;
        files_json?: string;
        created_at?: number;
        updated_at?: number;
      }>();

      const staticEntries = [
        { loc: 'https://boardly.cfd/', priority: '1.0', changefreq: 'daily' },
        { loc: 'https://boardly.cfd/commons', priority: '0.9', changefreq: 'hourly' },
        { loc: 'https://boardly.cfd/material', priority: '0.9', changefreq: 'daily' },
        { loc: 'https://boardly.cfd/mcqs', priority: '0.9', changefreq: 'daily' },
        { loc: 'https://boardly.cfd/grand-line', priority: '0.9', changefreq: 'daily' },
        { loc: 'https://boardly.cfd/pricing', priority: '0.8', changefreq: 'weekly' },
      ];

      const postEntries: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];
      for (const r of results || []) {
        const slug = r.slug || buildCanonicalSlug(r.id, r.title);
        const lastmod = toIsoDate(r.updated_at || r.created_at);
        postEntries.push({
          loc: `https://boardly.cfd/commons/post/${escapeHtmlText(slug)}`,
          lastmod,
          priority: '0.8',
          changefreq: 'weekly',
        });
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
${postEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
        },
      });
    } catch {
      // Fall through if D1 query fails
    }
  }

  // 2. Exclude all authenticated app routes from SEO redirects, trailing-slash 301s, and 404 handling
  const isAuthAppRoute = isAuthenticatedAppRoute(pathname);

  // 3. SEO 301 redirects & trailing-slash normalization (ONLY on public GET page URLs)
  if (!isAuthAppRoute) {
    const cleanPublicPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPublicPath === '/about-kobans') {
      return Response.redirect(`${url.origin}/kobans${url.search}`, 301);
    }
    if (cleanPublicPath === '/study-material') {
      return Response.redirect(`${url.origin}/material${url.search}`, 301);
    }
    if (cleanPublicPath.startsWith('/study-material/')) {
      const rest = cleanPublicPath.slice('/study-material'.length);
      return Response.redirect(`${url.origin}/material${rest}${url.search}`, 301);
    }
    if (pathname.length > 1 && pathname.endsWith('/')) {
      return Response.redirect(`${url.origin}${cleanPublicPath}${url.search}`, 301);
    }
  }

  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const isCommonsPostRoute = pathname.startsWith('/commons/post/');
  const isMaterialItemRoute =
    (pathname.startsWith('/material/') || pathname.startsWith('/study-material/')) &&
    !pathname.startsWith('/material/subject/') &&
    !pathname.startsWith('/study-material/subject/');

  if (isCommonsPostRoute || isMaterialItemRoute) {
    const slugParam = decodeURIComponent(
      pathname
        .replace(/^\/commons\/post\//, '')
        .replace(/^\/study-material\//, '')
        .replace(/^\/material\//, '')
        .replace(/\/+$/, '')
    );
    const postId = extractPostIdFromSlug(slugParam);

    if (!postId) {
      let notFoundHtml = await response.text();
      notFoundHtml = notFoundHtml
        .replace(/<title>[\s\S]*?<\/title>/i, '<title>Post Not Found — Boardly Commons</title>')
        .replace(
          /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
          '<meta name="robots" content="noindex, nofollow" />'
        )
        .replace(
          /<div id="root"><\/div>/i,
          '<div id="root"><main style="max-width:640px;margin:4rem auto;padding:2rem;text-align:center;font-family:system-ui,sans-serif;"><h1>Post Not Found (404)</h1><p>This post does not exist or was removed.</p></main></div>'
        );
      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'no-store');
      return new Response(notFoundHtml, { status: 404, headers });
    }

    if (env?.DB) {
      try {
        // Look up by post ID first; fallback to slug match only if needed
        let d1Row = await env.DB.prepare(
          "SELECT id, slug, type, title, description, subject, chapter, class_level, board, author_name, is_anonymous, anonymous_alias, is_hidden, status, visibility, upvotes, comment_count, files_json, created_at, updated_at FROM posts WHERE id = ? AND is_hidden = 0 AND (status IS NULL OR status != 'removed') AND (visibility IS NULL OR visibility = 'public') LIMIT 1"
        )
          .bind(postId)
          .first<D1PostRow>();

        if (!d1Row && slugParam !== postId) {
          d1Row = await env.DB.prepare(
            "SELECT id, slug, type, title, description, subject, chapter, class_level, board, author_name, is_anonymous, anonymous_alias, is_hidden, status, visibility, upvotes, comment_count, files_json, created_at, updated_at FROM posts WHERE slug = ? AND is_hidden = 0 AND (status IS NULL OR status != 'removed') AND (visibility IS NULL OR visibility = 'public') LIMIT 1"
          )
            .bind(slugParam)
            .first<D1PostRow>();
        }

        if (!d1Row) {
          // Real 404 for posts that do not exist, were deleted, or are hidden/private
          let notFoundHtml = await response.text();
          notFoundHtml = notFoundHtml
            .replace(/<title>[\s\S]*?<\/title>/i, '<title>Post Not Found — Boardly Commons</title>')
            .replace(
              /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
              '<meta name="description" content="This post does not exist or has been removed from Boardly Commons." />'
            )
            .replace(
              /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
              '<meta name="robots" content="noindex, nofollow" />'
            )
            .replace(
              /<div id="root"><\/div>/i,
              '<div id="root"><main data-ssr-status="404" style="max-width:640px;margin:4rem auto;padding:2rem;text-align:center;font-family:system-ui,sans-serif;"><h1>Post Not Found</h1><p>This Commons post does not exist or has been deleted.</p></main></div>'
            );
          const headers = new Headers(response.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          headers.set('cache-control', 'no-store');
          return new Response(notFoundHtml, { status: 404, headers });
        }

        // Fetch top comments for server-rendered HTML & JSON-LD
        let topComments: D1CommentRow[] = [];
        try {
          const commentsRes = await env.DB.prepare(
            'SELECT id, post_id, text, is_anonymous, author_name, created_at FROM post_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 20'
          )
            .bind(d1Row.id)
            .all<D1CommentRow>();
          topComments = Array.isArray(commentsRes?.results) ? commentsRes.results : [];
        } catch {
          topComments = [];
        }

        const canonicalSlug = d1Row.slug || buildCanonicalSlug(d1Row.id, d1Row.title);
        const canonicalUrl = isMaterialItemRoute
          ? `https://boardly.cfd/material/${canonicalSlug}`
          : `https://boardly.cfd/commons/post/${canonicalSlug}`;

        const pageTitle = isMaterialItemRoute
          ? `${d1Row.title} — ${d1Row.subject || 'Study Material'} PDF & Notes | Boardly`
          : `${d1Row.title} — ${d1Row.subject || 'General'} | Boardly Commons`;
        const metaDescription = buildPostMetaDescription(
          d1Row.description,
          d1Row.title,
          d1Row.subject
        );
        const ogImage = 'https://boardly.cfd/assets/og-image.png';

        const { articleHtml, jsonLdString } = renderPostSsrHtmlAndJsonLd(
          d1Row,
          topComments,
          canonicalUrl
        );

        const t = escapeHtmlAttr(pageTitle);
        const d = escapeHtmlAttr(metaDescription);
        const c = escapeHtmlAttr(canonicalUrl);
        const img = escapeHtmlAttr(ogImage);

        let html = await response.text();
        html = html
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
            '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />'
          )
          .replace(
            /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
            `<link rel="canonical" href="${c}" />`
          )
          .replace(
            /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
            '<meta property="og:type" content="article" />'
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
          )
          .replace(
            /<\/head>/i,
            `  <script id="boardly-post-jsonld" type="application/ld+json">${jsonLdString}</script>\n  </head>`
          )
          .replace(/<div id="root"><\/div>/i, `<div id="root">${articleHtml}</div>`);

        const newHeaders = new Headers(response.headers);
        newHeaders.set('content-type', 'text/html; charset=utf-8');
        newHeaders.set('cache-control', 'public, max-age=60, s-maxage=180, stale-while-revalidate=300');

        return new Response(html, {
          status: 200,
          headers: newHeaders,
        });
      } catch {
        // Fall through to standard route meta if D1 binding throws unexpectedly
      }
    }
  }

  // Standard non-post route metadata injection
  const meta = resolveStaticOrPatternRouteMeta(pathname);
  const canonical = meta.canonicalUrl || `https://boardly.cfd${pathname === '/' ? '' : pathname}`;
  const robots = meta.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const t = escapeHtmlAttr(meta.title);
  const d = escapeHtmlAttr(meta.description);
  const c = escapeHtmlAttr(canonical);
  const img = escapeHtmlAttr(meta.ogImage);

  let html = await response.text();
  html = html
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
      `<meta name="robots" content="${escapeHtmlAttr(robots)}" />`
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

  const newHeaders = new Headers(response.headers);
  newHeaders.set('content-type', 'text/html; charset=utf-8');

  return new Response(html, {
    status: isAuthAppRoute ? 200 : pathname === '/410' ? 410 : response.status,
    statusText: isAuthAppRoute ? 'OK' : response.statusText,
    headers: newHeaders,
  });
};
