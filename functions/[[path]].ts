import worker, { Env } from '../cloudflare/worker';
import { onRequest as onApiRequest } from './api/[[path]]';

export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/')) {
    return onApiRequest(context as any);
  }
  if (
    url.pathname === '/sitemap.xml' ||
    url.pathname.startsWith('/commons/post/') ||
    url.pathname.startsWith('/material/')
  ) {
    return worker.fetch(context.request, context.env || ({} as Env), context as any);
  }
  return context.next();
}
