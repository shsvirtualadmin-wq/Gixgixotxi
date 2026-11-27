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
  const cleanBody = typeof bodyStatus === 'string' ? bodyStatus.trim() : '';
  const upperBody = cleanBody.toUpperCase();
  if (cleanBody && upperBody !== '200' && upperBody !== 'HTTP_200' && upperBody !== 'OK') {
    return cleanBody;
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
  body: Record<string, unknown> | null,
  getToken: (forceRefresh?: boolean) => Promise<string | null>,
  timeoutMs: number,
  label: string,
  fetchImpl: typeof fetch,
  options?: { method?: 'GET' | 'POST'; maxAttempts?: number }
): Promise<any> {
  let token = await getToken(false);
  if (!token) {
    const err: any = new Error(`Missing auth token for ${label}`);
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  const method = options?.method ?? (body === null ? 'GET' : 'POST');
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 3);
  const backoffMs = [350, 850, 1500];

  let lastErr: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const effectiveTimeout = timeoutMs + (attempt - 1) * 2000;
    const timer = setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };
      if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetchImpl(url, {
        method,
        cache: 'no-store',
        headers,
        ...(method !== 'GET' && body !== null ? { body: JSON.stringify(body) } : {}),
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

      if (attempt < maxAttempts && isRetryableHttpStatus(res.status)) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt - 1] ?? 850));
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

      if (attempt < maxAttempts && !nonRetryable) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt - 1] ?? 850));
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

function throwIfRowContainsError(rows: any[], collectionId: string): void {
  for (const r of rows) {
    if (r && typeof r === 'object' && r.error) {
      const apiErr: any = new Error(
        typeof r.error?.message === 'string' && r.error.message.trim()
          ? r.error.message.trim()
          : `Firestore REST query error on firestore:${collectionId}`
      );
      apiErr.code = normalizeRestErrorCode(
        Number(r.error?.code || 500),
        typeof r.error?.status === 'string' ? r.error.status : undefined
      );
      throw apiErr;
    }
  }
}

function extractAggregateCount(payload: any, collectionId: string): number | null {
  const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
  throwIfRowContainsError(rows, collectionId);
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
      fetchImpl,
      { method: 'POST', maxAttempts: 2 }
    );

    if (!Array.isArray(rows)) {
      const malformedErr: any = new Error(
        `Malformed query response from firestore:${collectionId}`
      );
      malformedErr.code = 'MALFORMED_QUERY_RESPONSE';
      throw malformedErr;
    }

    throwIfRowContainsError(rows, collectionId);

    const docRows = rows.filter(
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
 * Index-free paginated REST fallback using `GET .../documents/{collectionId}` with field masks.
 * Transfers only document names (or the single filter field) so large docs like `attempts`
 * stay lightweight and never require composite indexes.
 */
async function runListDocumentsPaginatedCount(params: {
  baseUrl: string;
  collectionId: string;
  filter?: FirestoreRestFilter;
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
    getToken,
    timeoutMs,
    pageSize,
    maxPages,
    fetchImpl,
  } = params;

  let total = 0;
  let pageToken: string | null = null;
  const expectedFilterVal = filter ? filter.stringValue.trim().toLowerCase() : null;
  const maskField = filter ? filter.fieldPath : '__name__';

  for (let page = 0; page < maxPages; page += 1) {
    const qs = new URLSearchParams();
    qs.set('pageSize', String(Math.min(Math.max(1, pageSize), 300)));
    qs.set('mask.fieldPaths', maskField);
    if (pageToken) {
      qs.set('pageToken', pageToken);
    }

    const payload = await fetchJsonWithTimeoutAndRetry(
      `${baseUrl}/${encodeURIComponent(collectionId)}?${qs.toString()}`,
      null,
      getToken,
      timeoutMs,
      `firestore:${collectionId}`,
      fetchImpl,
      { method: 'GET', maxAttempts: 2 }
    );

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const malformedErr: any = new Error(
        `Malformed list response from firestore:${collectionId}`
      );
      malformedErr.code = 'MALFORMED_LIST_RESPONSE';
      throw malformedErr;
    }

    if ((payload as any).error) {
      const errObj = (payload as any).error;
      const apiErr: any = new Error(
        typeof errObj?.message === 'string' && errObj.message.trim()
          ? errObj.message.trim()
          : `Firestore REST list error on firestore:${collectionId}`
      );
      apiErr.code = normalizeRestErrorCode(
        Number(errObj?.code || 500),
        typeof errObj?.status === 'string' ? errObj.status : undefined
      );
      throw apiErr;
    }

    const hasDocumentsKey = Object.prototype.hasOwnProperty.call(payload, 'documents');
    if (
      (!hasDocumentsKey && Object.keys(payload).length > 0) ||
      (hasDocumentsKey && !Array.isArray((payload as any).documents))
    ) {
      const malformedErr: any = new Error(
        `Malformed list response from firestore:${collectionId}`
      );
      malformedErr.code = 'MALFORMED_LIST_RESPONSE';
      throw malformedErr;
    }

    const docs = hasDocumentsKey ? (payload as any).documents : [];
    if (filter && expectedFilterVal !== null) {
      for (const d of docs) {
        const rawVal = d?.fields?.[filter.fieldPath]?.stringValue;
        if (typeof rawVal === 'string' && rawVal.trim().toLowerCase() === expectedFilterVal) {
          total += 1;
        }
      }
    } else {
      total += docs.length;
    }

    const nextToken =
      typeof (payload as any).nextPageToken === 'string' && (payload as any).nextPageToken.trim()
        ? (payload as any).nextPageToken.trim()
        : null;
    if (!nextToken || docs.length === 0) {
      break;
    }
    pageToken = nextToken;
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
 *   3. Index-free masked `GET .../documents/{collectionId}` paginated scan (`mask.fieldPaths`).
 */
export async function countCollectionViaFirestoreRest(
  options: FirestoreRestCountOptions
): Promise<FirestoreRestCountResult> {
  const {
    collectionId,
    filter,
    getToken,
    timeoutMs = 9000,
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
      fetchImpl,
      { method: 'POST', maxAttempts: 2 }
    );

    const count = extractAggregateCount(payload, collectionId);
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
  let paginatedErr: any = null;
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
  } catch (err: any) {
    paginatedErr = err;
    const code = String(err?.code || '').toUpperCase();
    if (code === 'PERMISSION_DENIED' || code === 'UNAUTHENTICATED' || code === 'RESOURCE_EXHAUSTED') {
      throw err;
    }
  }

  // 3. Index-free masked GET listDocuments fallback (transfers only doc names or single filter field)
  try {
    const count = await runListDocumentsPaginatedCount({
      baseUrl,
      collectionId,
      filter,
      getToken,
      timeoutMs,
      pageSize: Math.min(pageSize, 300),
      maxPages: Math.min(maxPages, 35),
      fetchImpl,
    });
    return { count, strategy: 'rest_filtered_scan' };
  } catch (listErr: any) {
    // Prefer the most informative error without losing malformed-query diagnostics
    throw paginatedErr || listErr || aggError;
  }
}
