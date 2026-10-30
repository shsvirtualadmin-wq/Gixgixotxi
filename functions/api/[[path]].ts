import d1Worker from '../../cloudflare/worker.js';
import mainWorker, { Env } from '../../cloudflare/worker';

/**
 * Catch-all Cloudflare Pages Function for `/api/*` routes on the same site
 * (`/api/tests`, `/api/tests/:id/publish`, `/api/tests/:id/questions`,
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

  // Delegate Nakama Captain tests, crews, roles, attempts, leaderboards, and mcq-bank to worker.js
  if (
    path.startsWith('/api/tests') ||
    path.startsWith('/api/crews') ||
    path.startsWith('/api/me/role') ||
    path.startsWith('/api/admin/roles') ||
    path.startsWith('/api/attempts') ||
    path.startsWith('/api/leaderboard') ||
    path.startsWith('/api/mcq-bank')
  ) {
    return (d1Worker as any).fetch(request, env || ({} as Env), context as any);
  }

  return mainWorker.fetch(request, env || ({} as Env), context as any);
}
