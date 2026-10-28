import { Env, handleHealthCheck } from '../../cloudflare/worker';

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  return handleHealthCheck(context.request, context.env || {});
}
