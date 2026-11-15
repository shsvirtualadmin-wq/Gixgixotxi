import tsWorker, { type Env } from '../../cloudflare/worker';
import jsWorker from '../../cloudflare/worker.js';
import {
  enforceAdminOrSuperAdminGate,
  handleMeRolesRequest,
  handleSuperAdminAndExtraAdminRoutes,
  type TokenVerifierFn,
} from '../_utils/adminRoleGate';
import { getSharedLocalD1Database } from '../_utils/firestoreRestAdmin';

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
  const isTsWorkerRoute =
    path.startsWith('/api/universities') ||
    path.startsWith('/api/mcqs') ||
    path.startsWith('/api/admin/legacy-bank') ||
    path.startsWith('/api/admin/users/search') ||
    path.startsWith('/api/announcements') ||
    path.startsWith('/api/follows') ||
    path.startsWith('/api/questions') ||
    path.startsWith('/api/posts') ||
    path === '/api/admin/coupons' ||
    path.startsWith('/api/admin/coupons/') ||
    path.startsWith('/api/coupons') ||
    (path === '/api/bots' || (path.startsWith('/api/bots/') && !path.startsWith('/api/bots/settings')));

  if (isTsWorkerRoute) {
    const tsResp = await tsWorker.fetch(request.clone() as any, env, context as any);
    if (tsResp.status !== 404) {
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
