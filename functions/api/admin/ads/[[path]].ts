import { requireAdmin, type TokenVerifierFn } from '../../../_utils/adminRoleGate';
import { createDefaultAdsConfig } from '../../../../src/config/ads';
import {
  getAdStatsServer,
  loadAdsConfigServer,
  saveAdsConfigServer,
  type AdsApiEnv,
} from '../../ads/[[path]]';

function jsonAdminAdsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function handleAdminAdsApiRequest(params: {
  request: Request;
  env?: AdsApiEnv;
  tokenVerifierOverride?: TokenVerifierFn;
}): Promise<Response> {
  const { request, env, tokenVerifierOverride } = params;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Strict server-side admin verification on every /api/admin/ads/* request
  const check = await requireAdmin({
    request,
    env,
    tokenVerifierOverride,
  });
  if (!check.ok || check.blockedResponse || !check.caller) {
    return (
      check.blockedResponse ||
      jsonAdminAdsResponse({ ok: false, error: 'Forbidden' }, 403)
    );
  }

  const url = new URL(request.url);
  const pathClean = url.pathname.replace(/\/+$/, '') || '/';
  const authHeader = request.headers.get('Authorization');

  // GET /api/admin/ads/config (or /api/admin/ads)
  if ((pathClean === '/api/admin/ads/config' || pathClean === '/api/admin/ads') && method === 'GET') {
    try {
      const config = await loadAdsConfigServer(env, true);
      return jsonAdminAdsResponse({ ok: true, config }, 200);
    } catch (err) {
      console.error('[GET /api/admin/ads/config] Failed:', err);
      return jsonAdminAdsResponse(
        { ok: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }
  }

  // PUT / POST /api/admin/ads/config
  if (
    (pathClean === '/api/admin/ads/config' || pathClean === '/api/admin/ads') &&
    (method === 'PUT' || method === 'POST')
  ) {
    try {
      const body = (await request.json().catch(() => null)) as Record<string, any> | null;
      if (!body || typeof body !== 'object') {
        return jsonAdminAdsResponse({ ok: false, error: 'Invalid configuration payload.' }, 400);
      }
      const incomingConfig = body.config && typeof body.config === 'object' ? body.config : body;
      const saved = await saveAdsConfigServer(
        env,
        incomingConfig,
        check.caller.email || check.caller.uid,
        authHeader
      );
      return jsonAdminAdsResponse({ ok: true, config: saved }, 200);
    } catch (err) {
      console.error('[PUT /api/admin/ads/config] Failed:', err);
      return jsonAdminAdsResponse(
        { ok: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }
  }

  // POST /api/admin/ads/reset
  if (pathClean === '/api/admin/ads/reset' && method === 'POST') {
    try {
      const defaults = createDefaultAdsConfig();
      const saved = await saveAdsConfigServer(
        env,
        defaults,
        check.caller.email || check.caller.uid,
        authHeader
      );
      return jsonAdminAdsResponse({ ok: true, config: saved }, 200);
    } catch (err) {
      console.error('[POST /api/admin/ads/reset] Failed:', err);
      return jsonAdminAdsResponse(
        { ok: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }
  }

  // GET /api/admin/ads/stats?days=7|30
  if (pathClean === '/api/admin/ads/stats' && method === 'GET') {
    try {
      const rawDays = Number(url.searchParams.get('days') || '7');
      const stats = await getAdStatsServer(env, rawDays === 30 ? 30 : 7);
      return jsonAdminAdsResponse({ ok: true, ...stats }, 200);
    } catch (err) {
      console.error('[GET /api/admin/ads/stats] Failed:', err);
      return jsonAdminAdsResponse(
        { ok: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }
  }

  return jsonAdminAdsResponse({ ok: false, error: 'Not found' }, 404);
}

export async function onRequest(context: {
  request: Request;
  env?: AdsApiEnv;
  tokenVerifierOverride?: TokenVerifierFn;
}): Promise<Response> {
  return handleAdminAdsApiRequest({
    request: context.request,
    env: context.env,
    tokenVerifierOverride: context.tokenVerifierOverride,
  });
}
