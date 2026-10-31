import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { onRequest as onUsersRequest } from '../../functions/api/users/[[route]]';
import { onRequest as onPublicProfilesRequest } from '../../functions/api/public-profiles/[[route]]';
import { onRequest as onUsernamesRequest } from '../../functions/api/usernames/[[route]]';
import { onRequest as onWalletRequest } from '../../functions/api/wallet/[[route]]';
import { onRequest as onShopRequest } from '../../functions/api/shop/[[route]]';
import { onRequest as onKobanRequestsRequest } from '../../functions/api/koban-requests/[[route]]';
import { onRequest as onPaymentRequestsRequest } from '../../functions/api/payment-requests/[[route]]';
import { onRequest as onPracticeAttemptsRequest } from '../../functions/api/practice-attempts/[[route]]';
import { onRequest as onUsageRequest } from '../../functions/api/usage/[[route]]';
import { onRequest as onStreaksRequest } from '../../functions/api/streaks/[[route]]';
import { onRequest as onReferralsRequest } from '../../functions/api/referrals/[[route]]';
import { onRequest as onCaptainsRequest } from '../../functions/api/captains/[[route]]';
import { onRequest as onApplicationsRequest } from '../../functions/api/applications/[[route]]';
import { onRequest as onNameRequestsRequest } from '../../functions/api/name-requests/[[route]]';
import { onRequest as onReviewsRequest } from '../../functions/api/reviews/[[route]]';
import { onRequest as onQuestionReportsRequest } from '../../functions/api/question-reports/[[route]]';
import { onRequest as onSupportTicketsRequest } from '../../functions/api/support-tickets/[[route]]';
import { onRequest as onConfigRequest } from '../../functions/api/config/[[route]]';
import { onRequest as onStudyBuddyRequest } from '../../functions/api/study-buddy/[[route]]';
import { onRequest as onAdminRequest } from '../../functions/api/admin/[[route]]';

let localSqliteInstance: any = null;

function createLocalD1Statement(sqliteDb: any, sql: string, boundValues: any[] = []) {
  return {
    bind(...values: any[]) {
      return createLocalD1Statement(sqliteDb, sql, values);
    },
    async first<T = any>(colName?: string): Promise<T | null> {
      try {
        const stmt = sqliteDb.prepare(sql);
        const row = stmt.get(...boundValues);
        if (!row) return null;
        if (colName) return (row as any)[colName] ?? null;
        return { ...row } as T;
      } catch (err) {
        console.warn('[LocalD1Adapter.first] SQL notice:', sql, err);
        throw err;
      }
    },
    async all<T = any>(): Promise<{ results: T[]; success: boolean }> {
      try {
        const stmt = sqliteDb.prepare(sql);
        const rows = stmt.all(...boundValues) || [];
        return {
          results: rows.map((r: any) => ({ ...r })) as T[],
          success: true,
        };
      } catch (err) {
        console.warn('[LocalD1Adapter.all] SQL notice:', sql, err);
        throw err;
      }
    },
    async run(): Promise<{ success: boolean; meta: Record<string, any> }> {
      try {
        const stmt = sqliteDb.prepare(sql);
        const info = stmt.run(...boundValues);
        return {
          success: true,
          meta: {
            changes: info?.changes ?? 0,
            last_row_id: info?.lastInsertRowid ?? 0,
          },
        };
      } catch (err) {
        console.warn('[LocalD1Adapter.run] SQL notice:', sql, err);
        throw err;
      }
    },
  };
}

export function getLocalD1Database() {
  if (localSqliteInstance) return localSqliteInstance;

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'boardly_d1_local.sqlite');
  const sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');

  const d1Adapter = {
    prepare(sql: string) {
      return createLocalD1Statement(sqliteDb, sql, []);
    },
    async batch(statements: Array<{ run: () => Promise<any> }>) {
      const results = [];
      sqliteDb.exec('BEGIN TRANSACTION;');
      try {
        for (const stmt of statements) {
          results.push(await stmt.run());
        }
        sqliteDb.exec('COMMIT;');
        return results;
      } catch (err) {
        try {
          sqliteDb.exec('ROLLBACK;');
        } catch (_rbErr) {
          // ignore rollback error
        }
        throw err;
      }
    },
    async exec(sql: string) {
      sqliteDb.exec(sql);
      return { count: 1, duration: 1 };
    },
  };

  localSqliteInstance = d1Adapter;
  return d1Adapter;
}

const PAGES_FUNCTION_ROUTES: Array<{
  prefix: string;
  handler: (ctx: { request: Request; env: any }) => Promise<Response>;
}> = [
  { prefix: '/api/users', handler: onUsersRequest },
  { prefix: '/api/public-profiles', handler: onPublicProfilesRequest },
  { prefix: '/api/usernames', handler: onUsernamesRequest },
  { prefix: '/api/wallet', handler: onWalletRequest },
  { prefix: '/api/shop', handler: onShopRequest },
  { prefix: '/api/koban-requests', handler: onKobanRequestsRequest },
  { prefix: '/api/payment-requests', handler: onPaymentRequestsRequest },
  { prefix: '/api/practice-attempts', handler: onPracticeAttemptsRequest },
  { prefix: '/api/usage', handler: onUsageRequest },
  { prefix: '/api/streaks', handler: onStreaksRequest },
  { prefix: '/api/referrals', handler: onReferralsRequest },
  { prefix: '/api/captains', handler: onCaptainsRequest },
  { prefix: '/api/applications', handler: onApplicationsRequest },
  { prefix: '/api/name-requests', handler: onNameRequestsRequest },
  { prefix: '/api/reviews', handler: onReviewsRequest },
  { prefix: '/api/question-reports', handler: onQuestionReportsRequest },
  { prefix: '/api/support-tickets', handler: onSupportTicketsRequest },
  { prefix: '/api/config', handler: onConfigRequest },
  { prefix: '/api/study-buddy', handler: onStudyBuddyRequest },
  { prefix: '/api/admin', handler: onAdminRequest },
];

export async function tryHandleD1PagesFunctionRoute(
  req: any,
  res: any
): Promise<boolean> {
  const fullUrl = req.originalUrl || req.url || '/';
  const parsedUrl = new URL(fullUrl, 'http://localhost:3000');
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  const matched = PAGES_FUNCTION_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!matched) return false;

  const method = String(req.method || 'GET').toUpperCase();
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (typeof v === 'string') headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(', '));
  }

  let bodyStr: string | undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (req.body !== undefined && req.body !== null) {
      bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      bodyStr = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', () => resolve(''));
      });
    }
  }

  const webReq = new Request(parsedUrl.toString(), {
    method,
    headers,
    body: bodyStr && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? bodyStr : undefined,
  });

  const env = {
    DB: getLocalD1Database(),
    FIREBASE_PROJECT_ID:
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      'gen-lang-client-0365509316',
    ALLOWED_ORIGIN: '*',
  };

  const webResp = await matched.handler({ request: webReq, env });
  res.statusCode = webResp.status;
  webResp.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  const text = await webResp.text();
  res.end(text);
  return true;
}
