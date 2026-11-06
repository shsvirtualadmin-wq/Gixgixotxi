import { renderBoardlyOgCardPngEdge } from '../../src/utils/ogCardPngFallback';

const WORKER_API_ORIGIN = 'https://boardly-posts-api.shsvirtualadmin.workers.dev';

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  // Serve dynamic 1200x630 Open Graph PNG share card directly at the edge
  if (incomingUrl.pathname === '/api/og' || incomingUrl.pathname === '/api/og/') {
    try {
      const pngBytes = await renderBoardlyOgCardPngEdge({
        type: incomingUrl.searchParams.get('type') || 'default',
        title: incomingUrl.searchParams.get('title') || '',
        subtitle: incomingUrl.searchParams.get('subtitle') || '',
        badge: incomingUrl.searchParams.get('badge') || '',
        meta: incomingUrl.searchParams.get('meta') || '',
        avatar: incomingUrl.searchParams.get('avatar') || '',
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

  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, WORKER_API_ORIGIN);

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', incomingUrl.host);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    const response = await fetch(targetUrl.toString(), init);
    const responseHeaders = new Headers(response.headers);
    if (!responseHeaders.has('Cache-Control')) {
      responseHeaders.set('Cache-Control', 'no-store');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to reach Boardly API worker.',
        details: err?.message || 'Upstream connection error',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};
