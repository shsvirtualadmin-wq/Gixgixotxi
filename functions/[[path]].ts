import worker, { Env } from '../cloudflare/worker';
import { onRequest as onApiRequest } from './api/[[path]]';

export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.pathname === '/ads.txt') {
    return context.next();
  }
  if (url.pathname.startsWith('/api/')) {
    return onApiRequest(context as any);
  }
  if (url.pathname === '/sitemap.xml') {
    return worker.fetch(context.request, context.env || ({} as Env), context as any);
  }
  if (
    url.pathname.startsWith('/commons/post/') ||
    url.pathname.startsWith('/material/')
  ) {
    const ua = context.request.headers.get('user-agent') || '';
    const isBot =
      /(googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|telegrambot|discordbot)/i.test(
        ua
      );
    if (isBot) {
      const res = await worker.fetch(context.request, context.env || ({} as Env), context as any);
      if (res.status !== 404) {
        return res;
      }
    }
    return context.next();
  }
  return context.next();
}
