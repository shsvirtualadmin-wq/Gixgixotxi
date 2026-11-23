import {
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FirestoreRestAdapter,
  getSharedLocalD1Database,
  parseServiceAccountFromEnv,
  resolveTargetFirestoreDatabaseId,
  resolveTargetFirestoreProjectId,
  type RewardsD1Database,
  type RewardsEnv,
} from '../../_utils/firestoreRestAdmin';
import {
  AD_SLOT_ORDER,
  createDefaultAdsConfig,
  normalizeAdsConfig,
  type AdDailyStatRow,
  type AdsConfigDoc,
} from '../../../src/config/ads';

export interface AdsApiEnv extends RewardsEnv {
  DB?: RewardsD1Database & Record<string, any>;
  [key: string]: any;
}

// Edge / process-level shared fallback stores (keep instant consistency in dev & edge warm instances)
let edgeAdsConfigCache: AdsConfigDoc | null = null;
let edgeAdsConfigLoadedAt = 0;
const EDGE_CONFIG_TTL_MS = 60_000;

// Key: `${date}::${slotId}::${offerId}` -> { impressions, clicks }
const edgeStatsStore = new Map<string, AdDailyStatRow>();

function jsonAdsResponse(
  body: unknown,
  status = 200,
  cacheControl = 'no-store, no-cache, must-revalidate'
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function getFirestoreAdapter(env?: AdsApiEnv): FirestoreRestAdapter | null {
  try {
    const sa = parseServiceAccountFromEnv(env);
    if (!sa) return null;
    const projectId = resolveTargetFirestoreProjectId(
      env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || sa.project_id || DEFAULT_FIREBASE_PROJECT_ID
    );
    const databaseId = resolveTargetFirestoreDatabaseId(
      env?.FIREBASE_DATABASE_ID ||
        env?.VITE_FIREBASE_DATABASE_ID ||
        env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
        DEFAULT_FIRESTORE_DATABASE_ID
    );
    return new FirestoreRestAdapter(sa, projectId, databaseId);
  } catch {
    return null;
  }
}

async function fetchPublicFirestoreDoc(
  env: AdsApiEnv | undefined,
  docPath: string
): Promise<Record<string, any> | null> {
  try {
    const projectId = resolveTargetFirestoreProjectId(
      env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
    );
    const databaseId = resolveTargetFirestoreDatabaseId(
      env?.FIREBASE_DATABASE_ID ||
        env?.VITE_FIREBASE_DATABASE_ID ||
        env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
        DEFAULT_FIRESTORE_DATABASE_ID
    );
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
      databaseId
    )}/documents/${docPath.replace(/^\/+/, '')}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return null;
    const json = (await resp.json()) as { fields?: Record<string, any> };
    if (!json?.fields) return null;
    return decodeFirestoreFields(json.fields);
  } catch {
    return null;
  }
}

function decodeFirestoreValue(field: Record<string, any>): any {
  if (!field || typeof field !== 'object') return null;
  if ('nullValue' in field) return null;
  if ('booleanValue' in field) return Boolean(field.booleanValue);
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return Number(field.doubleValue);
  if ('stringValue' in field) return String(field.stringValue);
  if ('timestampValue' in field) return String(field.timestampValue);
  if ('arrayValue' in field) {
    const arr = field.arrayValue?.values || [];
    return arr.map((v: any) => decodeFirestoreValue(v));
  }
  if ('mapValue' in field) {
    return decodeFirestoreFields(field.mapValue?.fields || {});
  }
  return null;
}

function decodeFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

async function ensureAdsD1Tables(db: RewardsD1Database): Promise<void> {
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ads_config (
          id TEXT PRIMARY KEY,
          config_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ad_offer_stats_daily (
          stat_date TEXT NOT NULL,
          slot_id TEXT NOT NULL,
          offer_id TEXT NOT NULL,
          impressions INTEGER NOT NULL DEFAULT 0,
          clicks INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (stat_date, slot_id, offer_id)
        )`
      )
      .run();
  } catch {
    // Non-fatal on mock/in-memory DB
  }
}

export function invalidateServerAdsConfigCache(): void {
  edgeAdsConfigLoadedAt = 0;
}

export async function loadAdsConfigServer(
  env?: AdsApiEnv,
  forceRefresh = false
): Promise<AdsConfigDoc> {
  const now = Date.now();
  if (!forceRefresh && edgeAdsConfigCache && now - edgeAdsConfigLoadedAt < EDGE_CONFIG_TTL_MS) {
    return edgeAdsConfigCache;
  }

  // 1. Try Firestore via Admin REST adapter
  const adapter = getFirestoreAdapter(env);
  if (adapter) {
    try {
      const fsDoc = await adapter.getDoc('config/ads');
      if (fsDoc && typeof fsDoc === 'object') {
        const normalized = normalizeAdsConfig(fsDoc);
        edgeAdsConfigCache = normalized;
        edgeAdsConfigLoadedAt = now;
        return normalized;
      }
    } catch {
      // Fall through to D1 / public Firestore
    }
  }

  // 2. Try D1 ads_config table
  const db: RewardsD1Database = env?.DB || getSharedLocalD1Database();
  try {
    await ensureAdsD1Tables(db);
    const row = await db
      .prepare('SELECT config_json FROM ads_config WHERE id = ?1 LIMIT 1')
      .bind('default')
      .first<{ config_json?: string }>();
    if (row?.config_json) {
      const parsed = JSON.parse(row.config_json);
      const normalized = normalizeAdsConfig(parsed);
      edgeAdsConfigCache = normalized;
      edgeAdsConfigLoadedAt = now;
      return normalized;
    }
  } catch {
    // Fall through
  }

  // 3. Try public Firestore REST read (config/ads is publicly readable)
  const pubDoc = await fetchPublicFirestoreDoc(env, 'config/ads');
  if (pubDoc) {
    const normalized = normalizeAdsConfig(pubDoc);
    edgeAdsConfigCache = normalized;
    edgeAdsConfigLoadedAt = now;
    return normalized;
  }

  // 4. Return edge memory cache if available, otherwise defaults
  if (edgeAdsConfigCache) {
    edgeAdsConfigLoadedAt = now;
    return edgeAdsConfigCache;
  }

  const defaults = createDefaultAdsConfig();
  edgeAdsConfigCache = defaults;
  edgeAdsConfigLoadedAt = now;
  return defaults;
}

export async function saveAdsConfigServer(
  env: AdsApiEnv | undefined,
  rawConfig: unknown,
  updatedBy?: string,
  bearerHeader?: string | null
): Promise<AdsConfigDoc> {
  const normalized = normalizeAdsConfig(rawConfig);
  normalized.updatedAt = new Date().toISOString();
  if (updatedBy) {
    normalized.updatedBy = updatedBy;
  }

  // Update warm cache immediately
  edgeAdsConfigCache = normalized;
  edgeAdsConfigLoadedAt = Date.now();

  // 1. Persist to D1 ads_config
  const db: RewardsD1Database = env?.DB || getSharedLocalD1Database();
  try {
    await ensureAdsD1Tables(db);
    await db
      .prepare(
        `INSERT INTO ads_config (id, config_json, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET config_json = ?2, updated_at = ?3`
      )
      .bind('default', JSON.stringify(normalized), Date.now())
      .run();
  } catch (err) {
    console.error('[AdsConfig] Failed to save to D1:', err);
  }

  // 2. Persist to Firestore config/ads (via service account OR admin caller bearer token)
  const adapter = getFirestoreAdapter(env);
  if (adapter) {
    try {
      await adapter.setDoc('config/ads', normalized as unknown as Record<string, any>, false);
      // Mirror promo code to Firestore promoCodes/ads_promo_active so legacy coupon readers see it too
      const p = normalized.promoCode;
      await adapter
        .setDoc(
          'promoCodes/ads_promo_active',
          {
            id: 'ads_promo_active',
            code: p.code,
            label: `${p.percentOff}% Off ${p.plans.map((pl) => pl.toUpperCase()).join(' & ')}`,
            discount_type: 'percent',
            percent_off: p.percentOff,
            appliesToPlans: p.plans,
            max_redemptions: 100000,
            is_active: p.active,
            active: p.active,
            expires_at: p.endDate ? `${p.endDate}T23:59:59.999Z` : null,
            updated_at: normalized.updatedAt,
            updated_by: updatedBy || 'admin',
          },
          true
        )
        .catch(() => null);
    } catch (err) {
      console.error('[AdsConfig] Failed to save to Firestore via admin adapter:', err);
    }
  } else if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
    // Fallback: write using the verified admin's Firebase ID token (allowed by firestore.rules config/ads)
    try {
      const projectId = resolveTargetFirestoreProjectId(
        env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
      );
      const databaseId = resolveTargetFirestoreDatabaseId(
        env?.FIREBASE_DATABASE_ID ||
          env?.VITE_FIREBASE_DATABASE_ID ||
          env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
          DEFAULT_FIRESTORE_DATABASE_ID
      );
      const encodeVal = (val: any): Record<string, any> => {
        if (val === null || val === undefined) return { nullValue: null };
        if (typeof val === 'boolean') return { booleanValue: val };
        if (typeof val === 'number') {
          return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
        }
        if (typeof val === 'string') return { stringValue: val };
        if (Array.isArray(val)) {
          return { arrayValue: { values: val.map((item) => encodeVal(item)) } };
        }
        if (typeof val === 'object') {
          const fields: Record<string, any> = {};
          for (const [k, v] of Object.entries(val)) {
            if (v !== undefined) fields[k] = encodeVal(v);
          }
          return { mapValue: { fields } };
        }
        return { stringValue: String(val) };
      };
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(normalized)) {
        if (v !== undefined) fields[k] = encodeVal(v);
      }
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
          databaseId
        )}/documents/config/ads`,
        {
          method: 'PATCH',
          headers: {
            Authorization: bearerHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        }
      ).catch(() => null);
    } catch {
      // Non-fatal; D1 + cache already updated
    }
  }

  return normalized;
}

function getTodayUtcDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const VALID_SLOT_ID_SET = new Set<string>(AD_SLOT_ORDER);

export async function recordAdOfferStatServer(
  env: AdsApiEnv | undefined,
  params: { type: 'impression' | 'click'; slotId: string; offerId: string }
): Promise<boolean> {
  const type = params.type === 'click' ? 'click' : params.type === 'impression' ? 'impression' : null;
  const slotId = String(params.slotId || '').trim();
  const offerId = String(params.offerId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 48);

  if (!type || !VALID_SLOT_ID_SET.has(slotId) || !offerId) {
    return false;
  }

  const statDate = getTodayUtcDateStr();
  const impDelta = type === 'impression' ? 1 : 0;
  const clkDelta = type === 'click' ? 1 : 0;

  // 1. Update in-memory edge counter
  const key = `${statDate}::${slotId}::${offerId}`;
  const prev = edgeStatsStore.get(key) || {
    date: statDate,
    slotId,
    offerId,
    impressions: 0,
    clicks: 0,
  };
  prev.impressions += impDelta;
  prev.clicks += clkDelta;
  edgeStatsStore.set(key, prev);

  // 2. Persist to D1 (strictly anonymous daily aggregates — zero PII)
  const db: RewardsD1Database = env?.DB || getSharedLocalD1Database();
  try {
    await ensureAdsD1Tables(db);
    await db
      .prepare(
        `INSERT INTO ad_offer_stats_daily (stat_date, slot_id, offer_id, impressions, clicks, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(stat_date, slot_id, offer_id) DO UPDATE SET
           impressions = ad_offer_stats_daily.impressions + ?4,
           clicks = ad_offer_stats_daily.clicks + ?5,
           updated_at = ?6`
      )
      .bind(statDate, slotId, offerId, impDelta, clkDelta, Date.now())
      .run();
  } catch {
    // Non-fatal
  }

  return true;
}

export async function getAdStatsServer(
  env: AdsApiEnv | undefined,
  daysRaw: number
): Promise<{
  days: number;
  startDate: string;
  endDate: string;
  totals: { impressions: number; clicks: number };
  byOffer: Array<{ offerId: string; impressions: number; clicks: number }>;
  bySlot: Array<{ slotId: string; impressions: number; clicks: number }>;
  daily: AdDailyStatRow[];
}> {
  const days = daysRaw === 30 ? 30 : 7;
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const merged = new Map<string, AdDailyStatRow>();

  // 1. Read from D1
  const db: RewardsD1Database = env?.DB || getSharedLocalD1Database();
  try {
    await ensureAdsD1Tables(db);
    const res = await db
      .prepare(
        `SELECT stat_date, slot_id, offer_id, impressions, clicks
         FROM ad_offer_stats_daily
         WHERE stat_date >= ?1 AND stat_date <= ?2
         ORDER BY stat_date DESC`
      )
      .bind(startDate, endDate)
      .all();
    for (const r of (res?.results || []) as Array<Record<string, any>>) {
      const row: AdDailyStatRow = {
        date: String(r.stat_date || ''),
        slotId: String(r.slot_id || ''),
        offerId: String(r.offer_id || ''),
        impressions: Math.max(0, Number(r.impressions || 0)),
        clicks: Math.max(0, Number(r.clicks || 0)),
      };
      if (row.date && row.slotId && row.offerId) {
        merged.set(`${row.date}::${row.slotId}::${row.offerId}`, row);
      }
    }
  } catch {
    // Fall back to in-memory stats
  }

  // 2. Merge in-memory edge counters (taking max so nothing is lost if D1 is local mock)
  for (const [k, v] of edgeStatsStore.entries()) {
    if (v.date >= startDate && v.date <= endDate) {
      const existing = merged.get(k);
      if (!existing) {
        merged.set(k, { ...v });
      } else {
        existing.impressions = Math.max(existing.impressions, v.impressions);
        existing.clicks = Math.max(existing.clicks, v.clicks);
      }
    }
  }

  const daily = Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date));

  const offerMap = new Map<string, { offerId: string; impressions: number; clicks: number }>();
  const slotMap = new Map<string, { slotId: string; impressions: number; clicks: number }>();
  let totalImpressions = 0;
  let totalClicks = 0;

  for (const row of daily) {
    totalImpressions += row.impressions;
    totalClicks += row.clicks;

    const o = offerMap.get(row.offerId) || { offerId: row.offerId, impressions: 0, clicks: 0 };
    o.impressions += row.impressions;
    o.clicks += row.clicks;
    offerMap.set(row.offerId, o);

    const s = slotMap.get(row.slotId) || { slotId: row.slotId, impressions: 0, clicks: 0 };
    s.impressions += row.impressions;
    s.clicks += row.clicks;
    slotMap.set(row.slotId, s);
  }

  return {
    days,
    startDate,
    endDate,
    totals: { impressions: totalImpressions, clicks: totalClicks },
    byOffer: Array.from(offerMap.values()).sort((a, b) => b.impressions - a.impressions),
    bySlot: Array.from(slotMap.values()).sort((a, b) => b.impressions - a.impressions),
    daily,
  };
}

export async function handlePublicAdsApiRequest(params: {
  request: Request;
  env?: AdsApiEnv;
}): Promise<Response> {
  const { request, env } = params;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);
  const pathClean = url.pathname.replace(/\/+$/, '') || '/';

  if ((pathClean === '/api/ads/config' || pathClean === '/api/ads') && method === 'GET') {
    try {
      const config = await loadAdsConfigServer(env);
      return jsonAdsResponse(
        { ok: true, config },
        200,
        'public, max-age=60, stale-while-revalidate=30'
      );
    } catch (err) {
      console.error('[GET /api/ads/config] Failed:', err);
      return jsonAdsResponse({ ok: true, config: createDefaultAdsConfig() }, 200, 'public, max-age=30');
    }
  }

  if ((pathClean === '/api/ads/event' || pathClean === '/api/ads/stats') && method === 'POST') {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const ok = await recordAdOfferStatServer(env, {
        type: body.type === 'click' ? 'click' : 'impression',
        slotId: String(body.slotId || ''),
        offerId: String(body.offerId || ''),
      });
      return jsonAdsResponse({ ok }, ok ? 200 : 400);
    } catch {
      return jsonAdsResponse({ ok: false }, 400);
    }
  }

  return jsonAdsResponse({ ok: false, error: 'Not found' }, 404);
}

export async function onRequest(context: {
  request: Request;
  env?: AdsApiEnv;
}): Promise<Response> {
  return handlePublicAdsApiRequest({
    request: context.request,
    env: context.env,
  });
}
