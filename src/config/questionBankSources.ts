import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';
import { db as legacyDb } from '@/lib/firebase';

/**
 * MASTER SWITCH FOR MULTI-SOURCE QUESTION BANK
 * If false, app behaves exactly as before using solely the legacy main database.
 */
export const ENABLE_MULTI_SOURCE_BANK = true;

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

/**
 * Adding a third source only requires adding its entry to this list!
 */
export const BANK_SOURCE_CONFIGS: BankSourceConfig[] = [
  {
    id: 'legacy',
    name: 'Core Bank',
    description: 'Primary Master Bank (AI Studio)',
    isDefaultWrite: false,
    requiresDedicatedAuth: false,
  },
  {
    id: 'bank1',
    name: 'Alpha Bank',
    description: 'Secondary Question Bank (boardly-8c0cd)',
    isDefaultWrite: false,
    requiresDedicatedAuth: true,
    firebaseConfig: bank1Config,
  },
  {
    id: 'bank2',
    name: 'Beta Bank',
    description: 'Tertiary Question Bank (boardly-2)',
    isDefaultWrite: true,
    requiresDedicatedAuth: true,
    firebaseConfig: bank2Config,
  },
];

export interface ActiveBankSource {
  id: string;
  name: string;
  description: string;
  db: Firestore;
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

// Initialize bank1 app and Firestore instance
function getNamedBankApp(name: string, config: typeof bank1Config) {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
}

const bank1App = getNamedBankApp('bank1', bank1Config);
export const bank1Auth: Auth = getAuth(bank1App);
export const bank1Db: Firestore = (() => {
  try {
    return initializeFirestore(bank1App, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(bank1App);
  }
})();

// Initialize bank2 app and Firestore instance (Beta Bank, project boardly-2)
const bank2App = getNamedBankApp('bank2', bank2Config);
export const bank2Auth: Auth = getAuth(bank2App);
export const bank2Db: Firestore = (() => {
  try {
    return initializeFirestore(bank2App, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(bank2App);
  }
})();

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.bank1Db = bank1Db;
  win.bank1App = bank1App;
  win.bank2Db = bank2Db;
  win.bank2App = bank2App;
}

/**
 * Returns all active bank sources
 */
export function getBankSources(): ActiveBankSource[] {
  if (!ENABLE_MULTI_SOURCE_BANK) {
    return [
      {
        id: 'legacy',
        name: 'Core Bank',
        description: 'Primary Master Bank (AI Studio)',
        db: legacyDb,
        isDefaultWrite: true,
        requiresDedicatedAuth: false,
      },
    ];
  }

  return [
    {
      id: 'legacy',
      name: 'Core Bank',
      description: 'Primary Master Bank (AI Studio)',
      db: legacyDb,
      isDefaultWrite: false,
      requiresDedicatedAuth: false,
    },
    {
      id: 'bank1',
      name: 'Alpha Bank',
      description: 'Secondary Question Bank (boardly-8c0cd)',
      db: bank1Db,
      auth: bank1Auth,
      isDefaultWrite: false,
      requiresDedicatedAuth: true,
      firebaseConfig: bank1Config,
    },
    {
      id: 'bank2',
      name: 'Beta Bank',
      description: 'Tertiary Question Bank (boardly-2)',
      db: bank2Db,
      auth: bank2Auth,
      isDefaultWrite: true,
      requiresDedicatedAuth: true,
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

// ─── SOURCE HEALTH TRACKING & DETAILED ERROR DIAGNOSTICS ─────────────────────
export interface SourceHealthDiagnostic {
  id: string;
  name: string;
  healthy: boolean;
  questionCount?: number;
  errorCode?: string; // 'permission-denied' | 'not-found' | 'unauthenticated' | 'resource-exhausted' | 'failed-precondition' | etc.
  errorMessage?: string;
  operation?: string;
  lastChecked: Date;
  latencyMs?: number;
}

export function extractFirestoreErrorCode(error: unknown): string {
  if (!error) return 'unknown';
  const e = error as { code?: string; message?: string; status?: string };
  if (typeof e.code === 'string') {
    return e.code.replace('firestore/', '').toLowerCase();
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
  if (msg.includes('failed-precondition') || msg.includes('requires an index')) {
    return 'failed-precondition';
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

  // Log real Firestore error code and message to browser console
  console.error(
    `[Bank Source Health: ${sourceId}] ${operation ? `${operation} ` : ''}failed with code [${code}]: ${errMsg}`,
    error
  );

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

/**
 * Actively probes all bank sources with a lightweight query to test real-time connectivity, permissions, and question counts
 */
export async function checkAllBankSourcesHealth(): Promise<SourceHealthDiagnostic[]> {
  const sources = getBankSources();
  const results: SourceHealthDiagnostic[] = [];

  for (const src of sources) {
    const startTime = Date.now();
    try {
      const { collection, getDocs, limit, query, doc, getDoc } = await import('firebase/firestore');

      // 1. Probe subject pool: check if collection read works
      const testColl = collection(src.db, 'questions_mathematics');
      await getDocs(query(testColl, limit(1)));

      // 2. Probe stats document read & compute total question counts
      const statsRef = doc(src.db, 'stats', 'questionCounts');
      const statsSnap = await getDoc(statsRef);
      let count = 0;
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        const subCounts = (data.subjectCounts || {}) as Record<string, number>;
        count = Object.values(subCounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
      } else if (src.id === 'legacy') {
        // Fallback probe for legacy bank questions collection
        try {
          const qSnap = await getDocs(query(collection(src.db, 'questions'), limit(10)));
          count = qSnap.size;
        } catch {
          // Non-fatal
        }
      }

      const latencyMs = Date.now() - startTime;
      recordSourceSuccess(src.id, 'probe check', latencyMs, count);
      results.push({
        id: src.id,
        name: src.name,
        healthy: true,
        questionCount: count,
        lastChecked: new Date(),
        latencyMs,
      });
    } catch (err) {
      const code = extractFirestoreErrorCode(err);
      const errMsg = (err as { message?: string })?.message || String(err || 'Unknown error');
      recordSourceFailure(src.id, err, 'probe check');
      const existing = sourceHealthMap.get(src.id);
      results.push({
        id: src.id,
        name: src.name,
        healthy: false,
        questionCount: undefined,
        errorCode: code,
        errorMessage: errMsg,
        operation: 'probe query on questions_mathematics / stats',
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime,
      });
    }
  }

  return results;
}

// ─── DEDICATED ADMIN AUTH (IN-MEMORY SESSION) ───────────────────────────────
// Passwords are NEVER stored. Auth sessions are maintained in memory by Firebase Auth.

// ─── ALPHA BANK (bank1, boardly-8c0cd)
export function isBank1Unlocked(): boolean {
  if (!ENABLE_MULTI_SOURCE_BANK) return true;
  return Boolean(bank1Auth.currentUser);
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

// ─── BETA BANK (bank2, boardly-2)
export function isBank2Unlocked(): boolean {
  if (!ENABLE_MULTI_SOURCE_BANK) return true;
  return Boolean(bank2Auth.currentUser);
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

// ─── UNIFIED UNLOCK HELPERS (Supports all sources)
export function isBankUnlocked(sourceId: string): boolean {
  if (!ENABLE_MULTI_SOURCE_BANK) return true;
  if (sourceId === 'legacy') return true;
  if (sourceId === 'bank1') return isBank1Unlocked();
  if (sourceId === 'bank2') return isBank2Unlocked();
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

