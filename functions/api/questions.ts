import worker, { Env } from '../../cloudflare/worker';

export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  return worker.fetch(context.request, context.env || ({} as Env), context as any);
}
