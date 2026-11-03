/**
 * Cloudflare Pages / Edge-compatible Firebase ID Token Verifier &
 * Firestore REST API Transactional Client (WebCrypto RS256 Service Account JWT).
 *
 * Reads credentials from encrypted environment secret `FIREBASE_SERVICE_ACCOUNT`
 * (or fallback `GOOGLE_SERVICE_ACCOUNT_KEY`). Never commits secrets.
 */

export const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0365509316';
export const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

export interface ServiceAccountCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface RewardsEnv {
  FIREBASE_SERVICE_ACCOUNT?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  VITE_FIREBASE_DATABASE_ID?: string;
  VITE_FIREBASE_FIRESTORE_DATABASE_ID?: string;
}

// ─── Base64URL & PEM Helpers ──────────────────────────────────────────────────

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return uint8ArrayToBase64Url(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Firebase ID Token Verification (Google SecureToken JWK) ──────────────────

let cachedGoogleJwks: { keys: Array<JsonWebKey & { kid?: string }>; expiresAt: number } | null =
  null;

async function getGooglePublicJwks(): Promise<Array<JsonWebKey & { kid?: string }>> {
  const now = Date.now();
  if (cachedGoogleJwks && cachedGoogleJwks.expiresAt > now) {
    return cachedGoogleJwks.keys;
  }
  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public JWKs: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  cachedGoogleJwks = {
    keys,
    expiresAt: now + 50 * 60 * 1000,
  };
  return keys;
}

export async function verifyFirebaseIdToken(
  authHeader: string | null | undefined,
  projectId: string = DEFAULT_FIREBASE_PROJECT_ID
): Promise<VerifiedFirebaseToken | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const headerJson = new TextDecoder().decode(base64UrlToUint8Array(parts[0]));
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(parts[1]));
    const header = JSON.parse(headerJson) as { alg?: string; kid?: string };
    const payload = JSON.parse(payloadJson) as {
      exp?: number;
      iat?: number;
      aud?: string;
      iss?: string;
      sub?: string;
      email?: string;
      name?: string;
      email_verified?: boolean;
    };

    if (header.alg !== 'RS256' || !header.kid) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec - 30) return null;
    if (!payload.iat || payload.iat > nowSec + 300) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length === 0) return null;

    const keys = await getGooglePublicJwks();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature as unknown as BufferSource,
      signedData
    );
    if (!isValid) return null;

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch {
    return null;
  }
}

// ─── Service Account Parsing & OAuth2 Token Exchange ──────────────────────────

export function parseServiceAccountFromEnv(env?: RewardsEnv): ServiceAccountCredentials | null {
  if (!env) return null;
  const raw = (env.FIREBASE_SERVICE_ACCOUNT || env.GOOGLE_SERVICE_ACCOUNT_KEY || '').trim();
  if (!raw) return null;

  try {
    const jsonStr = raw.startsWith('{') ? raw : atob(raw);
    const parsed = JSON.parse(jsonStr) as Partial<ServiceAccountCredentials>;
    if (
      parsed &&
      typeof parsed.client_email === 'string' &&
      parsed.client_email.includes('@') &&
      typeof parsed.private_key === 'string' &&
      parsed.private_key.includes('PRIVATE KEY')
    ) {
      return {
        project_id: parsed.project_id || env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    }
    return null;
  } catch {
    return null;
  }
}

let cachedAccessToken: { token: string; clientEmail: string; expiresAt: number } | null = null;

export async function getServiceAccountAccessToken(
  sa: ServiceAccountCredentials
): Promise<string> {
  const nowMs = Date.now();
  if (
    cachedAccessToken &&
    cachedAccessToken.clientEmail === sa.client_email &&
    cachedAccessToken.expiresAt > nowMs + 60_000
  ) {
    return cachedAccessToken.token;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: sa.client_email,
    sub: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUri,
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const unsignedJwt = `${stringToBase64Url(JSON.stringify(header))}.${stringToBase64Url(
    JSON.stringify(claimSet)
  )}`;

  const keyBuffer = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const jwt = `${unsignedJwt}.${uint8ArrayToBase64Url(new Uint8Array(signatureBuffer))}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Service account OAuth2 token error (${res.status}): ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlSec = Number(data.expires_in || 3600);
  cachedAccessToken = {
    token: data.access_token,
    clientEmail: sa.client_email,
    expiresAt: nowMs + ttlSec * 1000,
  };
  return data.access_token;
}

// ─── Firestore REST Value Serialization ───────────────────────────────────────

export const SERVER_TIMESTAMP_SENTINEL = '__FIRESTORE_SERVER_TIMESTAMP__';

export function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (val === SERVER_TIMESTAMP_SENTINEL) {
    return { timestampValue: new Date().toISOString() };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(raw: Record<string, any> | undefined): any {
  if (!raw || typeof raw !== 'object') return null;
  if ('nullValue' in raw) return null;
  if ('booleanValue' in raw) return Boolean(raw.booleanValue);
  if ('integerValue' in raw) return Number(raw.integerValue);
  if ('doubleValue' in raw) return Number(raw.doubleValue);
  if ('stringValue' in raw) return String(raw.stringValue);
  if ('timestampValue' in raw) return String(raw.timestampValue);
  if ('arrayValue' in raw) {
    const vals = raw.arrayValue?.values;
    return Array.isArray(vals) ? vals.map((v: any) => fromFirestoreValue(v)) : [];
  }
  if ('mapValue' in raw) {
    const fields = raw.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v as Record<string, any>);
    }
    return out;
  }
  return null;
}

export function toFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

export function fromFirestoreDocument(docObj: {
  name?: string;
  fields?: Record<string, any>;
  createTime?: string;
  updateTime?: string;
} | null): Record<string, any> | null {
  if (!docObj || !docObj.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docObj.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  if (docObj.name) {
    const parts = docObj.name.split('/');
    out._id = parts[parts.length - 1];
  }
  return out;
}

// ─── Transactional Adapter Interface ──────────────────────────────────────────

export interface TxWriteOperation {
  type: 'create' | 'set' | 'merge';
  path: string; // e.g. "wallets/uid123" or "reward_daily_claims/uid123_2026-03-29"
  data: Record<string, unknown>;
}

export interface FirestoreTransactionContext {
  getDoc(path: string): Promise<Record<string, any> | null>;
  createDoc(path: string, data: Record<string, unknown>): void;
  setDoc(path: string, data: Record<string, unknown>, merge?: boolean): void;
}

export interface FirestoreStoreAdapter {
  getDoc(path: string): Promise<Record<string, any> | null>;
  setDoc(path: string, data: Record<string, unknown>, merge?: boolean): Promise<void>;
  queryByField(
    collectionId: string,
    fieldPath: string,
    op: 'EQUAL',
    value: string | number | boolean,
    limit?: number
  ): Promise<Array<Record<string, any>>>;
  runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T>;
}

// ─── Production Firestore REST API Adapter ────────────────────────────────────

export class FirestoreRestAdapter implements FirestoreStoreAdapter {
  private sa: ServiceAccountCredentials;
  private projectId: string;
  private databaseId: string;

  constructor(
    sa: ServiceAccountCredentials,
    projectId: string = DEFAULT_FIREBASE_PROJECT_ID,
    databaseId: string = DEFAULT_FIRESTORE_DATABASE_ID
  ) {
    this.sa = sa;
    this.projectId = projectId || sa.project_id || DEFAULT_FIREBASE_PROJECT_ID;
    this.databaseId = databaseId || DEFAULT_FIRESTORE_DATABASE_ID;
  }

  private get baseDocsUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      this.projectId
    )}/databases/${encodeURIComponent(this.databaseId)}/documents`;
  }

  private get resourcePrefix(): string {
    return `projects/${this.projectId}/databases/${this.databaseId}/documents`;
  }

  private fullDocName(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return `${this.resourcePrefix}/${clean}`;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await getServiceAccountAccessToken(this.sa);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getDoc(path: string): Promise<Record<string, any> | null> {
    const clean = path.replace(/^\/+/, '');
    const res = await fetch(`${this.baseDocsUrl}/${clean}`, {
      method: 'GET',
      headers: await this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore getDoc(${clean}) failed (${res.status}): ${errText.slice(0, 200)}`);
    }
    const json = await res.json();
    return fromFirestoreDocument(json);
  }

  async setDoc(path: string, data: Record<string, unknown>, merge = false): Promise<void> {
    const clean = path.replace(/^\/+/, '');
    const url = new URL(`${this.baseDocsUrl}/${clean}`);
    if (merge) {
      for (const k of Object.keys(data)) {
        if (data[k] !== undefined) {
          url.searchParams.append('updateMask.fieldPaths', k);
        }
      }
    }
    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: await this.headers(),
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore setDoc(${clean}) failed (${res.status}): ${errText.slice(0, 200)}`);
    }
  }

  async queryByField(
    collectionId: string,
    fieldPath: string,
    op: 'EQUAL',
    value: string | number | boolean,
    limit = 200
  ): Promise<Array<Record<string, any>>> {
    const res = await fetch(`${this.baseDocsUrl}:runQuery`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            fieldFilter: {
              field: { fieldPath },
              op,
              value: toFirestoreValue(value),
            },
          },
          limit,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Firestore runQuery(${collectionId}.${fieldPath}) failed (${res.status}): ${errText.slice(0, 200)}`
      );
    }
    const rows = (await res.json()) as Array<{ document?: any }>;
    if (!Array.isArray(rows)) return [];
    const out: Array<Record<string, any>> = [];
    for (const r of rows) {
      if (r?.document) {
        const parsed = fromFirestoreDocument(r.document);
        if (parsed) out.push(parsed);
      }
    }
    return out;
  }

  async runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    const hdrs = await this.headers();
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 1. Begin readWrite transaction
      const beginRes = await fetch(`${this.baseDocsUrl}:beginTransaction`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ options: { readWrite: {} } }),
      });
      if (!beginRes.ok) {
        const errText = await beginRes.text();
        throw new Error(`Firestore beginTransaction failed (${beginRes.status}): ${errText.slice(0, 200)}`);
      }
      const { transaction } = (await beginRes.json()) as { transaction: string };

      const writes: TxWriteOperation[] = [];
      const txCtx: FirestoreTransactionContext = {
        getDoc: async (path: string) => {
          const clean = path.replace(/^\/+/, '');
          const batchRes = await fetch(`${this.baseDocsUrl}:batchGet`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
              documents: [this.fullDocName(clean)],
              transaction,
            }),
          });
          if (!batchRes.ok) {
            const errText = await batchRes.text();
            throw new Error(
              `Firestore tx.getDoc(${clean}) failed (${batchRes.status}): ${errText.slice(0, 200)}`
            );
          }
          const items = (await batchRes.json()) as Array<{ found?: any; missing?: string }>;
          const first = Array.isArray(items) ? items[0] : null;
          if (!first || !first.found) return null;
          return fromFirestoreDocument(first.found);
        },
        createDoc: (path: string, data: Record<string, unknown>) => {
          writes.push({ type: 'create', path: path.replace(/^\/+/, ''), data });
        },
        setDoc: (path: string, data: Record<string, unknown>, merge = false) => {
          writes.push({ type: merge ? 'merge' : 'set', path: path.replace(/^\/+/, ''), data });
        },
      };

      const result = await fn(txCtx);

      // 2. Build REST commit writes
      const restWrites = writes.map((w) => {
        const docName = this.fullDocName(w.path);
        const fields = toFirestoreFields(w.data);
        if (w.type === 'create') {
          return {
            update: { name: docName, fields },
            currentDocument: { exists: false },
          };
        }
        if (w.type === 'merge') {
          return {
            update: { name: docName, fields },
            updateMask: {
              fieldPaths: Object.keys(w.data).filter((k) => w.data[k] !== undefined),
            },
          };
        }
        return {
          update: { name: docName, fields },
        };
      });

      const commitRes = await fetch(`${this.baseDocsUrl}:commit`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          transaction,
          writes: restWrites,
        }),
      });

      if (commitRes.ok) {
        return result;
      }

      const commitStatus = commitRes.status;
      const errText = await commitRes.text();

      // Retry on contention (409 ABORTED) if attempts remain
      if (commitStatus === 409 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 40 * attempt));
        continue;
      }

      const err = new Error(
        `Firestore commit failed (${commitStatus}): ${errText.slice(0, 240)}`
      ) as Error & { status?: number };
      err.status = commitStatus;
      throw err;
    }

    throw new Error('Firestore transaction exceeded maximum retry attempts.');
  }
}
