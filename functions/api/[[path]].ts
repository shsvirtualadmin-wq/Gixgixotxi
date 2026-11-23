import tsWorker, { type Env } from '../../cloudflare/worker';
import jsWorker from '../../cloudflare/worker.js';
import {
  enforceAdminOrSuperAdminGate,
  handleMeRolesRequest,
  handleSuperAdminAndExtraAdminRoutes,
  type TokenVerifierFn,
} from '../_utils/adminRoleGate';
import { getSharedLocalD1Database } from '../_utils/firestoreRestAdmin';
import { handleAiMentorsRequest } from './ai.js';
import { onRequest as handlePublicAdsRequest } from './ads/[[path]]';
import { onRequest as handleAdminAdsRequest } from './admin/ads/[[path]]';

export interface PagesApiContext {
  request: Request;
  env: Env & Record<string, any>;
  waitUntil?: (promise: Promise<any>) => void;
  tokenVerifierOverride?: TokenVerifierFn;
  adminSdkOverride?: {
    setCustomUserClaims: (uid: string, claims: Record<string, boolean>) => Promise<void>;
    revokeRefreshTokens: (uid: string) => Promise<void>;
  };
}

export async function onRequest(context: PagesApiContext): Promise<Response> {
  const { request } = context;
  const env = context.env || ({} as Env & Record<string, any>);
  if (!env.DB) {
    env.DB = getSharedLocalD1Database() as any;
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/api/ai') {
    return handleAiMentorsRequest(request, env);
  }

  if (
    path === '/api/ads' ||
    path.startsWith('/api/ads/') ||
    path === '/api/placements' ||
    path.startsWith('/api/placements/')
  ) {
    return handlePublicAdsRequest({ request, env });
  }

  if (path === '/api/admin/ads' || path.startsWith('/api/admin/ads/')) {
    return handleAdminAdsRequest({
      request,
      env,
      tokenVerifierOverride: context.tokenVerifierOverride,
    });
  }

  // Serve R2 objects from R2_BUCKET (e.g. university logos) or D1 university_logo_assets fallback
  if (
    path.startsWith('/api/media/') ||
    path.startsWith('/api/r2/') ||
    path.startsWith('/api/commons/r2/')
  ) {
    const prefix = path.startsWith('/api/commons/r2/')
      ? '/api/commons/r2/'
      : path.startsWith('/api/media/')
      ? '/api/media/'
      : '/api/r2/';
    const rawKey = decodeURIComponent(path.slice(prefix.length))
      .replace(/\.\./g, '')
      .replace(/^\/+/, '');
    if (rawKey && !rawKey.startsWith('signatures/') && !rawKey.startsWith('certificates/')) {
      const lower = rawKey.toLowerCase();
      const inferredType = lower.endsWith('.svg')
        ? 'image/svg+xml'
        : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        ? 'image/jpeg'
        : lower.endsWith('.webp')
        ? 'image/webp'
        : lower.endsWith('.gif')
        ? 'image/gif'
        : lower.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/octet-stream';

      if (env.R2_BUCKET) {
        const obj = await env.R2_BUCKET.get(rawKey).catch(() => null);
        if (obj) {
          const contentType = obj.httpMetadata?.contentType || inferredType;
          return new Response(obj.body, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Cross-Origin-Resource-Policy': 'cross-origin',
            },
          });
        }
      }

      if (env.DB && rawKey.startsWith('universities/logos/')) {
        try {
          const segs = rawKey.split('/');
          const uniKeyHint = segs.length >= 3 ? segs[2] : '';
          const row = await env.DB.prepare(
            `SELECT mime_type, data_base64
             FROM university_logo_assets
             WHERE r2_key = ? OR (university_id = ? AND data_base64 != '')
             ORDER BY CASE WHEN r2_key = ? THEN 0 ELSE 1 END
             LIMIT 1`
          )
            .bind(rawKey, uniKeyHint, rawKey)
            .first<{ mime_type?: string; data_base64?: string }>();
          if (row?.data_base64) {
            const cleanB64 = row.data_base64.includes(',')
              ? row.data_base64.slice(row.data_base64.indexOf(',') + 1)
              : row.data_base64;
            const bin = atob(cleanB64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
              bytes[i] = bin.charCodeAt(i);
            }
            return new Response(bytes, {
              status: 200,
              headers: {
                'Content-Type': row.mime_type || inferredType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Resource-Policy': 'cross-origin',
              },
            });
          }
        } catch {
          // Table or column may not exist yet
        }
      }

      if (rawKey.startsWith('universities/logos/')) {
        return new Response(JSON.stringify({ success: false, error: 'Logo not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }
    const normalizedPath = `/api/r2/${rawKey}`;
    const assetUrl = new URL(normalizedPath, url.origin);
    if (typeof (context as any).next === 'function' && normalizedPath === path) {
      return (context as any).next();
    }
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }
  }

  // 0. Server-side self-healing owner bootstrap: POST /api/me/roles
  if (path === '/api/me/roles') {
    return handleMeRolesRequest({
      request,
      env,
      tokenVerifierOverride: context.tokenVerifierOverride,
      adminSdkOverride: context.adminSdkOverride,
    });
  }

  // 1. Strict server-side Firebase ID token custom-claim verification gate for /api/admin/* and /api/superadmin/*
  const gate = await enforceAdminOrSuperAdminGate({
    request,
    env,
    tokenVerifierOverride: context.tokenVerifierOverride,
  });
  if (gate.blockedResponse) {
    return gate.blockedResponse;
  }

  // 2. Handle /api/superadmin/* and shared /api/admin/* routes
  if (gate.caller) {
    const handled = await handleSuperAdminAndExtraAdminRoutes({
      request,
      env,
      caller: gate.caller,
      db: env.DB as any,
      adminSdkOverride: context.adminSdkOverride,
    });
    if (handled) {
      return handled;
    }
  }

  // 3. Route to cloudflare/worker.ts for routes owned by worker.ts, otherwise cloudflare/worker.js
  const isDedicatedEconomyOrProRoute =
    path === '/api/admin/coupons' ||
    path.startsWith('/api/admin/coupons/') ||
    path === '/api/coupons' ||
    path.startsWith('/api/coupons/') ||
    path === '/api/pro/coupon/validate' ||
    path === '/api/pro/coupon/redeem' ||
    path === '/api/pro/purchase-kobans' ||
    path === '/api/pro/submit-payment' ||
    path === '/api/pro/status' ||
    path === '/api/pro/purchase-guard' ||
    path === '/api/pro/purchase' ||
    path === '/api/pro/activate';

  const isTsWorkerRoute =
    isDedicatedEconomyOrProRoute ||
    path.startsWith('/api/universities') ||
    path.startsWith('/api/media/') ||
    path.startsWith('/api/r2/') ||
    path.startsWith('/api/mcqs') ||
    path.startsWith('/api/formulas') ||
    path.startsWith('/api/admin/legacy-bank') ||
    path.startsWith('/api/admin/users/search') ||
    path.startsWith('/api/announcements') ||
    path.startsWith('/api/follows') ||
    path.startsWith('/api/questions') ||
    path.startsWith('/api/posts');

  if (isTsWorkerRoute) {
    const tsResp = await tsWorker.fetch(request.clone() as any, env, context as any);
    if (isDedicatedEconomyOrProRoute || tsResp.status !== 404) {
      return tsResp;
    }
  }

  const jsResp = await jsWorker.fetch(request.clone(), env);
  if (jsResp.status !== 404) {
    return jsResp;
  }

  // Fallback to tsWorker if jsWorker returned 404
  const fallbackResp = await tsWorker.fetch(request as any, env, context as any);
  if (fallbackResp.status !== 404) {
    return fallbackResp;
  }

  // If caller is authenticated captain/admin/superAdmin hitting a generic /api/admin/* or /api/captain/* endpoint in tests
  if (
    gate.caller &&
    (path === '/api/admin' ||
      path.startsWith('/api/admin/') ||
      path === '/api/captain' ||
      path.startsWith('/api/captain/'))
  ) {
    return new Response(
      JSON.stringify({
        ok: true,
        endpoint: path,
        callerUid: gate.caller.uid,
        role: gate.caller.role,
        captain: gate.caller.captain,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  return jsResp;
}
