/**
 * ============================================================================
 * BOARDLY SMALL-BATCH BOTS CRON WORKER (/bots-worker)
 * ============================================================================
 * Runs every 2 hours via Cloudflare Cron Trigger ("0 */2 * * *" UTC) and calls
 * POST https://boardly.cfd/api/bots/run with a 2-bot cap (`maxBots: 2, postsPerBot: 1`)
 * and the secret header `x-bot-run-secret` (read strictly from `env.BOT_RUN_SECRET`).
 */

export interface BotsCronEnv {
  BOT_RUN_SECRET?: string;
  TARGET_API_URL?: string;
  MAX_BOTS_PER_BATCH?: string;
}

async function triggerMainSiteBotsRun(env: BotsCronEnv, triggerSource: string): Promise<Response> {
  const secret = (env.BOT_RUN_SECRET || '').trim();
  if (!secret) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'BOT_RUN_SECRET secret is not configured on boardly-bots-cron Worker.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const targetUrl = (env.TARGET_API_URL || 'https://boardly.cfd/api/bots/run').trim();
  const maxBots = Math.min(3, Math.max(1, Number(env.MAX_BOTS_PER_BATCH || 2)));

  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-run-secret': secret,
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      trigger: triggerSource,
      triggeredAt: new Date().toISOString(),
      maxBots,
      postsPerBot: 1,
    }),
  });

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async scheduled(
    event: { cron: string; scheduledTime: number },
    env: BotsCronEnv,
    ctx: { waitUntil: (promise: Promise<any>) => void }
  ): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const res = await triggerMainSiteBotsRun(env, `cron:${event.cron}`);
          const payload = await res.text().catch(() => '');
          console.log(`[BotsCronWorker] Scheduled run (${event.cron}) HTTP ${res.status}:`, payload);
        } catch (err) {
          console.error('[BotsCronWorker] Scheduled run failed:', err);
        }
      })()
    );
  },

  async fetch(req: Request, env: BotsCronEnv): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health' && req.method === 'GET') {
      return new Response(
        JSON.stringify({
          ok: Boolean(env.BOT_RUN_SECRET),
          worker: 'boardly-bots-cron',
          cronSchedule: '0 */2 * * *',
          maxBotsPerBatch: Math.min(3, Math.max(1, Number(env.MAX_BOTS_PER_BATCH || 2))),
          targetApiUrl: env.TARGET_API_URL || 'https://boardly.cfd/api/bots/run',
          secretConfigured: Boolean(env.BOT_RUN_SECRET),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const providedSecret =
        req.headers.get('x-bot-run-secret') ||
        (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

      if (!env.BOT_RUN_SECRET || providedSecret !== env.BOT_RUN_SECRET) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Unauthorized: invalid or missing BOT_RUN_SECRET' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return triggerMainSiteBotsRun(env, 'manual-worker-trigger');
    }

    return new Response(
      JSON.stringify({
        worker: 'boardly-bots-cron',
        status: 'active',
        schedule: '0 */2 * * *',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  },
};
