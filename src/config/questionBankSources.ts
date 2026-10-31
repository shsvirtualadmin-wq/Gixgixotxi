import { getAuth, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

export const ENABLE_MULTI_SOURCE_BANK = true;
export const USE_FIRESTORE_QUESTION_READER = false;

export interface BankSourceConfig {
  id: string;
  name: string;
  description: string;
  isDefaultWrite?: boolean;
  requiresDedicatedAuth?: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export const bank1Config = {
  apiKey: 'AIzaSyD3UsjebtuCtno-N5Bn-hmZ_Sqpu-dZMKM',
  authDomain: 'boardly-8c0cd.firebaseapp.com',
  projectId: 'boardly-8c0cd',
  storageBucket: 'boardly-8c0cd.firebasestorage.app',
  messagingSenderId: '535423466069',
  appId: '1:535423466069:web:4f874c8b619463bdd372dc',
};

export const bank2Config = {
  apiKey: 'AIzaSyCsQHbcAC2Lf1J0iKau7oaRGu3iYbcZCmM',
  authDomain: 'boardly-2.firebaseapp.com',
  projectId: 'boardly-2',
  storageBucket: 'boardly-2.firebasestorage.app',
  messagingSenderId: '569279973107',
  appId: '1:569279973107:web:15c5bd7f739112a7b99986',
};

export const BANK_SOURCE_CONFIGS: BankSourceConfig[] = [
  {
    id: 'legacy',
    name: 'Core Bank',
    description: 'Primary Master Bank (Cloudflare D1)',
    isDefaultWrite: false,
    requiresDedicatedAuth: false,
  },
  {
    id: 'bank1',
    name: 'Alpha Bank',
    description: 'Secondary Question Bank (Cloudflare D1)',
    isDefaultWrite: false,
    requiresDedicatedAuth: false,
    firebaseConfig: bank1Config,
  },
  {
    id: 'bank2',
    name: 'Beta Bank',
    description: 'Tertiary Question Bank (Cloudflare D1)',
    isDefaultWrite: true,
    requiresDedicatedAuth: false,
    firebaseConfig: bank2Config,
  },
];

export interface ActiveBankSource {
  id: string;
  name: string;
  description: string;
  db: unknown;
  auth?: Auth;
  isDefaultWrite: boolean;
  requiresDedicatedAuth: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

function getNamedBankApp(name: string, config: typeof bank1Config) {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
}

const bank1App = getNamedBankApp('bank1', bank1Config);
export const bank1Auth: Auth = getAuth(bank1App);
export const bank1Db: unknown = null;

const bank2App = getNamedBankApp('bank2', bank2Config);
export const bank2Auth: Auth = getAuth(bank2App);
export const bank2Db: unknown = null;

export function getBankSources(): ActiveBankSource[] {
  return [
    {
      id: 'legacy',
      name: 'Core Bank',
      description: 'Primary Master Bank (Cloudflare D1)',
      db: null,
      isDefaultWrite: false,
      requiresDedicatedAuth: false,
    },
    {
      id: 'bank1',
      name: 'Alpha Bank',
      description: 'Secondary Question Bank (Cloudflare D1)',
      db: null,
      auth: bank1Auth,
      isDefaultWrite: false,
      requiresDedicatedAuth: false,
      firebaseConfig: bank1Config,
    },
    {
      id: 'bank2',
      name: 'Beta Bank',
      description: 'Tertiary Question Bank (Cloudflare D1)',
      db: null,
      auth: bank2Auth,
      isDefaultWrite: true,
      requiresDedicatedAuth: false,
      firebaseConfig: bank2Config,
    },
  ];
}

export function getBankSource(sourceId: string): ActiveBankSource | undefined {
  return getBankSources().find((s) => s.id === sourceId);
}

export function getDefaultWriteSource(): ActiveBankSource {
  const sources = getBankSources();
  return sources.find((s) => s.isDefaultWrite) || sources[0];
}

export interface SourceHealthDiagnostic {
  id: string;
  name: string;
  healthy: boolean;
  questionCount?: number;
  publishedCount?: number;
  needsReviewCount?: number;
  bySubject?: Record<string, number>;
  lastImportAt?: string | null;
  storageBackend?: 'cloudflare-d1' | 'firestore';
  errorCode?: string;
  errorMessage?: string;
  operation?: string;
  lastChecked: Date;
  latencyMs?: number;
}

export function extractFirestoreErrorCode(error: unknown): string {
  if (!error) return 'unknown';
  const e = error as { code?: string; message?: string; status?: string };
  if (typeof e.code === 'string') {
    return e.code.toLowerCase();
  }
  if (typeof e.status === 'string') {
    return e.status.toLowerCase().replace('_', '-');
  }
  const msg = (e.message || String(error)).toLowerCase();
  if (msg.includes('permission-denied') || msg.includes('missing or insufficient permissions')) {
    return 'permission-denied';
  }
  if (msg.includes('resource-exhausted') || msg.includes('quota')) {
    return 'resource-exhausted';
  }
  if (msg.includes('unauthenticated')) {
    return 'unauthenticated';
  }
  if (msg.includes('not-found') || msg.includes('not found')) {
    return 'not-found';
  }
  if (msg.includes('unavailable') || msg.includes('network') || msg.includes('failed to fetch')) {
    return 'unavailable';
  }
  return 'unknown-error';
}

const sourceHealthMap = new Map<string, SourceHealthDiagnostic>();
const healthListeners = new Set<(diagnostics: SourceHealthDiagnostic[]) => void>();

export function recordSourceFailure(sourceId: string, error?: unknown, operation?: string): void {
  const code = extractFirestoreErrorCode(error);
  const errMsg = (error as { message?: string })?.message || String(error || 'Unknown error');
  const src = getBankSource(sourceId);
  const existing = sourceHealthMap.get(sourceId);

  sourceHealthMap.set(sourceId, {
    id: sourceId,
    name: src?.name || sourceId,
    healthy: false,
    questionCount: undefined,
    errorCode: code,
    errorMessage: errMsg,
    operation,
    lastChecked: new Date(),
    latencyMs: existing?.latencyMs,
  });
  notifyHealthListeners();
}

export function recordSourceSuccess(
  sourceId: string,
  operation?: string,
  latencyMs?: number,
  questionCount?: number
): void {
  const existing = sourceHealthMap.get(sourceId);
  const src = getBankSource(sourceId);
  const qCount = questionCount !== undefined ? questionCount : existing?.questionCount;
  sourceHealthMap.set(sourceId, {
    id: sourceId,
    name: src?.name || sourceId,
    healthy: true,
    questionCount: qCount,
    operation,
    lastChecked: new Date(),
    latencyMs: latencyMs !== undefined ? latencyMs : existing?.latencyMs,
  });
  notifyHealthListeners();
}

export function getAllBankSourceHealth(): SourceHealthDiagnostic[] {
  const sources = getBankSources();
  return sources.map((src) => {
    const current = sourceHealthMap.get(src.id);
    if (current) return current;
    return {
      id: src.id,
      name: src.name,
      healthy: true,
      questionCount: undefined,
      lastChecked: new Date(),
    };
  });
}

export interface FailingSourceDiagnostic {
  id: string;
  name: string;
  error?: string;
  errorCode?: string;
  operation?: string;
  lastChecked?: Date;
}

export function getFailingSources(): FailingSourceDiagnostic[] {
  const failing: FailingSourceDiagnostic[] = [];
  for (const item of getAllBankSourceHealth()) {
    if (!item.healthy) {
      failing.push({
        id: item.id,
        name: item.name,
        error: item.errorMessage,
        errorCode: item.errorCode,
        operation: item.operation,
        lastChecked: item.lastChecked,
      });
    }
  }
  return failing;
}

function notifyHealthListeners() {
  const diagnostics = getAllBankSourceHealth();
  healthListeners.forEach((listener) => {
    try {
      listener(diagnostics);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeFailingSources(
  callback: (failing: { id: string; name: string; error?: string; errorCode?: string }[]) => void
): () => void {
  const notify = () => callback(getFailingSources());
  healthListeners.add(notify);
  notify();
  return () => {
    healthListeners.delete(notify);
  };
}

export function subscribeBankSourceHealth(
  callback: (diagnostics: SourceHealthDiagnostic[]) => void
): () => void {
  healthListeners.add(callback);
  callback(getAllBankSourceHealth());
  return () => {
    healthListeners.delete(callback);
  };
}

export async function checkAllBankSourcesHealth(): Promise<SourceHealthDiagnostic[]> {
  const sources = getBankSources();
  const startTime = Date.now();
  try {
    const resp = await fetch('/api/questions/health');
    if (!resp.ok) {
      throw new Error(`D1 /api/questions/health returned HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const latencyMs = Date.now() - startTime;
    const banksData = (data?.banks || {}) as Record<
      string,
      {
        total?: number;
        published?: number;
        needsReview?: number;
        bySubject?: Record<string, number>;
        lastImportAt?: string | null;
      }
    >;

    const results: SourceHealthDiagnostic[] = sources.map((src) => {
      const b = banksData[src.id] || {};
      const count = Number(b.total ?? 0);
      const diag: SourceHealthDiagnostic = {
        id: src.id,
        name: src.name,
        healthy: true,
        questionCount: count,
        publishedCount: Number(b.published ?? count),
        needsReviewCount: Number(b.needsReview ?? 0),
        bySubject: b.bySubject || {},
        lastImportAt: b.lastImportAt || data?.lastImportAt || null,
        storageBackend: 'cloudflare-d1',
        operation: 'Cloudflare D1 (boardly-posts-db)',
        lastChecked: new Date(),
        latencyMs,
      };
      sourceHealthMap.set(src.id, diag);
      return diag;
    });

    notifyHealthListeners();
    return results;
  } catch (err) {
    const errMsg = (err as { message?: string })?.message || String(err || 'Unknown D1 error');
    const results: SourceHealthDiagnostic[] = sources.map((src) => {
      const diag: SourceHealthDiagnostic = {
        id: src.id,
        name: src.name,
        healthy: false,
        errorCode: 'unavailable',
        errorMessage: errMsg,
        storageBackend: 'cloudflare-d1',
        operation: 'GET /api/questions/health',
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime,
      };
      sourceHealthMap.set(src.id, diag);
      return diag;
    });
    notifyHealthListeners();
    return results;
  }
}

export function isBank1Unlocked(): boolean {
  return true;
}

export function getBank1AdminUser(): User | null {
  return bank1Auth.currentUser;
}

export async function unlockBank1(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(bank1Auth, email.trim(), pass);
  recordSourceSuccess('bank1', 'admin unlock');
  return cred.user;
}

export async function lockBank1(): Promise<void> {
  await signOut(bank1Auth);
}

export function isBank2Unlocked(): boolean {
  return true;
}

export function getBank2AdminUser(): User | null {
  return bank2Auth.currentUser;
}

export async function unlockBank2(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(bank2Auth, email.trim(), pass);
  recordSourceSuccess('bank2', 'admin unlock');
  return cred.user;
}

export async function lockBank2(): Promise<void> {
  await signOut(bank2Auth);
}

export function isBankUnlocked(_sourceId: string): boolean {
  return true;
}

export async function unlockBankSource(sourceId: string, email: string, pass: string): Promise<User> {
  if (sourceId === 'bank1') return unlockBank1(email, pass);
  if (sourceId === 'bank2') return unlockBank2(email, pass);
  throw new Error(`Bank source ${sourceId} does not require dedicated auth unlock.`);
}

export async function lockBankSource(sourceId: string): Promise<void> {
  if (sourceId === 'bank1') return lockBank1();
  if (sourceId === 'bank2') return lockBank2();
}
