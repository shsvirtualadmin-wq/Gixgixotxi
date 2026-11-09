import d1Worker from '../../cloudflare/worker.js';
import mainWorker, { Env } from '../../cloudflare/worker';
import { handleAuthApiRequest } from './auth/[[path]]';
import { handleRewardsApiRequest } from './rewards/[[path]]';
import { handleEconomyApiRequest } from './economy/[[path]]';
import { handleSendEmailRequest } from './send-email';
import { handleKobanStyleRequest } from './koban-style';

/**
 * Catch-all Cloudflare Pages Function for `/api/*` routes on the same site
 * (`/api/auth/*`, `/api/rewards/*`, `/api/coupons/*`, `/api/store/purchase`, `/api/pro/*`, `/api/koban-style`, `/api/send-email`, `/api/tests`, `/api/tests/:id/publish`, `/api/tests/:id/questions`,
 * `/api/crews`, `/api/me/role`, `/api/attempts/mine`, `/api/leaderboard/grand-line`,
 * `/api/notifications`, `/api/admin/roles`, `/api/mcq-bank`, etc.).
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // Delegate all /api/auth/* endpoints (guest mode, me, username checks, 6-digit OTP) to /api/auth handler
  if (path === '/api/auth' || path.startsWith('/api/auth/')) {
    return handleAuthApiRequest({
      request,
      env: (env || {}) as any,
    });
  }

  // Delegate server-authoritative coupons, store Koban purchases, and Pro subscription execution
  if (
    path === '/api/coupons' ||
    path.startsWith('/api/coupons/') ||
    path === '/api/pro/coupon/validate' ||
    path === '/api/pro/coupon/redeem' ||
    path === '/api/pro/purchase-kobans' ||
    path === '/api/pro/submit-payment' ||
    path === '/api/store/purchase' ||
    path === '/api/admin/coupons' ||
    path.startsWith('/api/admin/coupons/')
  ) {
    return handleEconomyApiRequest({
      request,
      env: (env || {}) as any,
    });
  }

  // Delegate customizable Koban icon style endpoint to /api/koban-style handler
  if (path === '/api/koban-style' || path.startsWith('/api/koban-style/')) {
    return handleKobanStyleRequest({
      request,
      env: (env || {}) as any,
    });
  }

  // Delegate transactional email notifications to /api/send-email handler
  if (path === '/api/send-email' || path.startsWith('/api/send-email/')) {
    return handleSendEmailRequest(request, (env || {}) as any);
  }

  // Delegate Boardly Rewards endpoints to server-side transactional rewards handler
  if (path === '/api/rewards' || path.startsWith('/api/rewards/')) {
    return handleRewardsApiRequest({
      request,
      env: (env || {}) as any,
    });
  }

  // Delegate Nakama Captain tests, crews, roles, attempts, leaderboards, usage, and mcq-bank to worker.js
  if (
    path.startsWith('/api/tests') ||
    path.startsWith('/api/crews') ||
    path.startsWith('/api/me/role') ||
    path.startsWith('/api/admin/roles') ||
    path.startsWith('/api/attempts') ||
    path.startsWith('/api/leaderboard') ||
    path.startsWith('/api/certificates') ||
    path.startsWith('/api/verify') ||
    path.startsWith('/api/signatures') ||
    path.startsWith('/api/admin/certificates') ||
    path.startsWith('/api/admin/signatures') ||
    path.startsWith('/api/mcq-bank') ||
    path.startsWith('/api/usage/daily')
  ) {
    return (d1Worker as any).fetch(request, env || ({} as Env), context as any);
  }

  return mainWorker.fetch(request, env || ({} as Env), context as any);
}

