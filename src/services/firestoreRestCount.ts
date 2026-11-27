import { TARGET_DATABASE_ID, TARGET_PROJECT_ID } from '@/lib/firebaseConfig';

export interface FirestoreRestFilter {
  fieldPath: string;
  op?: 'EQUAL';
  stringValue: string;
}

export interface FirestoreRestCountOptions {
  collectionId: string;
  filter?: FirestoreRestFilter;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  timeoutMs?: number;
  pageSize?: number;
  maxPages?: number;
  fetchImpl?: typeof fetch;
  projectId?: string;
  databaseId?: string;
}

export interface FirestoreRestCountResult {
  count: number;
  strategy: 'rest_aggregation' | 'rest_paginated' | 'rest_filtered_scan';
}

export function buildFirestoreRestDocsUrl(
  projectId = TARGET_PROJECT_ID,
  databaseId = TARGET_DATABASE_ID
): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function normalizeRestErrorCode(status: number, bodyStatus?: string): string {
  if (bodyStatus && bodyStatus !== '200' && bodyStatus !== 'OK') {
    return bodyStatus;
  }
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'PERMISSION_DENIED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 408 || status === 504) return 'DEADLINE_EXCEEDED';
  if (status === 429) return 'RESOURCE_EXHAUSTED';
  if (status === 200 || status === 0) return 'REST_COUNT_FAILED';
  return `HTTP_${status}`;
}

async function fetchJsonWithTimeoutAndRetry(
  url: string,
  body: Record<string, unknown>,
  getToken: (forceRefresh?: boolean) => Promise<string | null>,
  timeoutMs: number,
  label: string,
  fetchImpl: typeof fetch
): Promise<any> {
  let token = await getToken(false);
  if (!token) {
    const err: any = new Error(`Missing auth token for ${label}`);
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const effectiveTimeout = attempt === 1 ? timeoutMs : timeoutMs + 2000;
    const timer = setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const rawText = await res.text().catch(() => '');
      let parsed: any = null;
      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }
      }

      if (res.ok) {
        return parsed;
      }

      const apiErrObj = Array.isArray(parsed) ? parsed[0]?.error : parsed?.error;
      const bodyStatus = typeof apiErrObj?.status === 'string' ? apiErrObj.status : undefined;
      const msg =
        typeof apiErrObj?.message === 'string' && apiErrObj.message.trim()
          ? apiErrObj.message.trim()
          : `Firestore REST ${label} failed (HTTP ${res.status})`;

      const err: any = new Error(msg);
      err.code = normalizeRestErrorCode(res.status, bodyStatus);
      err.httpStatus = res.status;
      lastErr = err;

      if (attempt === 1 && (res.status === 401 || res.status === 403)) {
        const refreshed = await getToken(true);
        if (refreshed && refreshed !== token) {
          token = refreshed;
          continue;
        }
      }

      if (attempt === 1 && isRetryableHttpStatus(res.status)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }

      throw err;
    } catch (err: any) {
      const isAbort =
        err?.name === 'AbortError' ||
        controller.signal.aborted ||
        String(err?.message || '').toLowerCase().includes('abort');
      if (isAbort) {
        const tErr: any = new Error(`Timed out reading ${label}`);
        tErr.code = 'DEADLINE_EXCEEDED';
        lastErr = tErr;
      } else {
        lastErr = err;
      }

      const code = String(lastErr?.code || '').toUpperCase();
      const nonRetryable =
        code === 'PERMISSION_DENIED' ||
        code === 'UNAUTHENTICATED' ||
        code === 'FAILED_PRECONDITION' ||
        code === 'INVALID_ARGUMENT' ||
        code === 'RESOURCE_EXHAUSTED';

      if (attempt === 1 && !nonRetryable) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr || new Error(`Failed reading ${label}`);
}

function buildStructuredWhere(filter?: FirestoreRestFilter): Record<string, unknown> | undefined {
  if (!filter) return undefined;
  return {
    fieldFilter: {
      field: { fieldPath: filter.fieldPath },
      op: filter.op || 'EQUAL',
      value: { stringValue: filter.stringValue },
    },
  };
}

function extractAggregateCount(payload: any): number | null {
  const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
  for (const row of rows) {
    const field = row?.result?.aggregateFields?.count;
    if (!field || typeof field !== 'object') continue;
    if (typeof field.integerValue === 'string' || typeof field.integerValue === 'number') {
      const parsed = Number(field.integerValue);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
    if (typeof field.doubleValue === 'number' && Number.isFinite(field.doubleValue) && field.doubleValue >= 0) {
      return Math.floor(field.doubleValue);
    }
  }
  return null;
}

async function runKeysOnlyPaginatedCount(params: {
  baseUrl: string;
  collectionId: string;
  filter?: FirestoreRestFilter;
  useServerFilter: boolean;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  timeoutMs: number;
  pageSize: number;
  maxPages: number;
  fetchImpl: typeof fetch;
}): Promise<number> {
  const {
    baseUrl,
    collectionId,
    filter,
    useServerFilter,
    getToken,
    timeoutMs,
    pageSize,
    maxPages,
    fetchImpl,
  } = params;

  let total = 0;
  let lastDocName: string | null = null;
  const selectFields =
    filter && !useServerFilter
      ? [{ fieldPath: '__name__' }, { fieldPath: filter.fieldPath }]
      : [{ fieldPath: '__name__' }];

  for (let page = 0; page < maxPages; page += 1) {
    const structuredQuery: Record<string, unknown> = {
      select: { fields: selectFields },
      from: [{ collectionId }],
      orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
      limit: pageSize,
    };

    if (filter && useServerFilter) {
      structuredQuery.where = buildStructuredWhere(filter);
    }

    if (lastDocName) {
      structuredQuery.startAt = {
        values: [{ referenceValue: lastDocName }],
        before: false,
      };
    }

    const rows = await fetchJsonWithTimeoutAndRetry(
      `${baseUrl}:runQuery`,
      { structuredQuery },
      getToken,
      timeoutMs,
      `firestore:${collectionId}`,
      fetchImpl
    );

    const docRows = (Array.isArray(rows) ? rows : []).filter(
      (r: any) => r && typeof r === 'object' && r.document && typeof r.document.name === 'string'
    );

    if (filter && !useServerFilter) {
      const expected = filter.stringValue.trim().toLowerCase();
      for (const r of docRows) {
        const rawVal = r.document?.fields?.[filter.fieldPath]?.stringValue;
        if (typeof rawVal === 'string' && rawVal.trim().toLowerCase() === expected) {
          total += 1;
        }
      }
    } else {
      total += docRows.length;
    }

    if (docRows.length < pageSize) {
      break;
    }
    lastDocName = docRows[docRows.length - 1]?.document?.name || null;
    if (!lastDocName) break;
  }

  return total;
}

/**
 * Counts a Firestore collection directly over Firestore REST v1 using the signed-in admin's
 * Firebase Auth ID token (enforcing the exact same firestore.rules).
 *
 * Bypasses the Firestore Web SDK's single experimentalForceLongPolling stream and IndexedDB locks:
 *   1. Fast server aggregation (`:runAggregationQuery`) with timeout + retry.
 *   2. Keys-only paginated `:runQuery` (`select: [__name__]`) transferring only doc names (tiny payload).
 *   3. If a filtered query hits an index/precondition error, falls back to a field-masked
 *      `select: [__name__, filter.fieldPath]` paginated scan.
 */
export async function countCollectionViaFirestoreRest(
  options: FirestoreRestCountOptions
): Promise<FirestoreRestCountResult> {
  const {
    collectionId,
    filter,
    getToken,
    timeoutMs = 7000,
    pageSize = 250,
    maxPages = 25,
    fetchImpl = globalThis.fetch,
    projectId = TARGET_PROJECT_ID,
    databaseId = TARGET_DATABASE_ID,
  } = options;

  if (typeof fetchImpl !== 'function') {
    const err: any = new Error('Fetch is unavailable for Firestore REST count');
    err.code = 'FETCH_UNAVAILABLE';
    throw err;
  }

  const baseUrl = buildFirestoreRestDocsUrl(projectId, databaseId);

  // 1. Primary: server-side aggregation count
  let aggError: any = null;
  try {
    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId }],
    };
    if (filter) {
      structuredQuery.where = buildStructuredWhere(filter);
    }
    const payload = await fetchJsonWithTimeoutAndRetry(
      `${baseUrl}:runAggregationQuery`,
      {
        structuredAggregationQuery: {
          aggregations: [{ alias: 'count', count: {} }],
          structuredQuery,
        },
      },
      getToken,
      timeoutMs,
      `firestore:${collectionId}`,
      fetchImpl
    );

    const count = extractAggregateCount(payload);
    if (count !== null) {
      return { count, strategy: 'rest_aggregation' };
    }
    const malformedErr: any = new Error(`Malformed aggregation response from firestore:${collectionId}`);
    malformedErr.code = 'MALFORMED_AGGREGATION';
    aggError = malformedErr;
  } catch (err: any) {
    aggError = err;
    const code = String(err?.code || '').toUpperCase();
    // Do not hammer Firestore if caller lacks permissions or hit quota
    if (code === 'PERMISSION_DENIED' || code === 'UNAUTHENTICATED' || code === 'RESOURCE_EXHAUSTED') {
      throw err;
    }
  }

  // 2. Fallback: keys-only paginated :runQuery (zero heavy document fields transferred)
  try {
    const count = await runKeysOnlyPaginatedCount({
      baseUrl,
      collectionId,
      filter,
      useServerFilter: Boolean(filter),
      getToken,
      timeoutMs,
      pageSize,
      maxPages,
      fetchImpl,
    });
    return { count, strategy: 'rest_paginated' };
  } catch (paginatedErr: any) {
    // 3. Secondary fallback for filtered collections: field-masked scan of just the filter field
    if (filter) {
      const code = String(paginatedErr?.code || '').toUpperCase();
      if (code !== 'PERMISSION_DENIED' && code !== 'UNAUTHENTICATED' && code !== 'RESOURCE_EXHAUSTED') {
        try {
          const count = await runKeysOnlyPaginatedCount({
            baseUrl,
            collectionId,
            filter,
            useServerFilter: false,
            getToken,
            timeoutMs,
            pageSize: Math.min(pageSize, 200),
            maxPages: Math.min(maxPages, 15),
            fetchImpl,
          });
          return { count, strategy: 'rest_filtered_scan' };
        } catch {
          // fall through to throw primary error
        }
      }
    }
    throw paginatedErr || aggError;
  }
}
