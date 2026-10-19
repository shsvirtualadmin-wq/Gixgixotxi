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

/**
 * Adding a third source later only requires adding one entry to this list!
 */
export const BANK_SOURCE_CONFIGS: BankSourceConfig[] = [
  {
    id: 'legacy',
    name: 'Legacy Bank (Main)',
    description: 'Existing Boardly Firestore database',
    isDefaultWrite: false,
    requiresDedicatedAuth: false,
  },
  {
    id: 'bank1',
    name: 'Question Bank 1',
    description: 'Secondary Question Bank (boardly-8c0cd)',
    isDefaultWrite: true,
    requiresDedicatedAuth: true,
    firebaseConfig: bank1Config,
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
}

// Initialize bank1 app and Firestore instance
function getBank1App() {
  const existing = getApps().find((a) => a.name === 'bank1');
  if (existing) return existing;
  return initializeApp(bank1Config, 'bank1');
}

const bank1App = getBank1App();
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

if (typeof window !== 'undefined') {
  (window as unknown as { bank1Db?: Firestore; bank1App?: unknown }).bank1Db = bank1Db;
  (window as unknown as { bank1Db?: Firestore; bank1App?: unknown }).bank1App = bank1App;
}

/**
 * Returns all active bank sources
 */
export function getBankSources(): ActiveBankSource[] {
  if (!ENABLE_MULTI_SOURCE_BANK) {
    return [
      {
        id: 'legacy',
        name: 'Legacy Bank (Main)',
        description: 'Existing Boardly Firestore database',
        db: legacyDb,
        isDefaultWrite: true,
        requiresDedicatedAuth: false,
      },
    ];
  }

  return [
    {
      id: 'legacy',
      name: 'Legacy Bank (Main)',
      description: 'Existing Boardly Firestore database',
      db: legacyDb,
      isDefaultWrite: false,
      requiresDedicatedAuth: false,
    },
    {
      id: 'bank1',
      name: 'Question Bank 1',
      description: 'Secondary Question Bank (boardly-8c0cd)',
      db: bank1Db,
      auth: bank1Auth,
      isDefaultWrite: true,
      requiresDedicatedAuth: true,
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

  // Log real Firestore error code and message to browser console
  console.error(
    `[Bank Source Health: ${sourceId}] ${operation ? `${operation} ` : ''}failed with code [${code}]: ${errMsg}`,
    error
  );

  sourceHealthMap.set(sourceId, {
    id: sourceId,
    name: src?.name || sourceId,
    healthy: false,
    errorCode: code,
    errorMessage: errMsg,
    operation,
    lastChecked: new Date(),
  });
  notifyHealthListeners();
}

export function recordSourceSuccess(sourceId: string, operation?: string, latencyMs?: number): void {
  const existing = sourceHealthMap.get(sourceId);
  if (!existing || !existing.healthy) {
    const src = getBankSource(sourceId);
    sourceHealthMap.set(sourceId, {
      id: sourceId,
      name: src?.name || sourceId,
      healthy: true,
      operation,
      lastChecked: new Date(),
      latencyMs,
    });
    notifyHealthListeners();
  }
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
      lastChecked: new Date(),
    };
  });
}

export function getFailingSources(): { id: string; name: string; error?: string; errorCode?: string }[] {
  const failing: { id: string; name: string; error?: string; errorCode?: string }[] = [];
  for (const item of getAllBankSourceHealth()) {
    if (!item.healthy) {
      failing.push({
        id: item.id,
        name: item.name,
        error: item.errorMessage,
        errorCode: item.errorCode,
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
 * Actively probes all bank sources with a lightweight query to test real-time connectivity and permissions
 */
export async function checkAllBankSourcesHealth(): Promise<SourceHealthDiagnostic[]> {
  const sources = getBankSources();
  const results: SourceHealthDiagnostic[] = [];

  for (const src of sources) {
    const startTime = Date.now();
    try {
      // 1. Probe subject pool: check if collection read works
      const { collection, getDocs, limit, query, doc, getDoc } = await import('firebase/firestore');
      const testColl = collection(src.db, 'questions_mathematics');
      await getDocs(query(testColl, limit(1)));

      // 2. Probe stats document read
      const statsRef = doc(src.db, 'stats', 'questionCounts');
      await getDoc(statsRef);

      const latencyMs = Date.now() - startTime;
      recordSourceSuccess(src.id, 'probe check', latencyMs);
      results.push({
        id: src.id,
        name: src.name,
        healthy: true,
        lastChecked: new Date(),
        latencyMs,
      });
    } catch (err) {
      const code = extractFirestoreErrorCode(err);
      const errMsg = (err as { message?: string })?.message || String(err || 'Unknown error');
      recordSourceFailure(src.id, err, 'probe check');
      results.push({
        id: src.id,
        name: src.name,
        healthy: false,
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

// ─── BANK 1 DEDICATED ADMIN AUTH (IN-MEMORY SESSION) ────────────────────────
// Passwords are NEVER stored. Auth session is maintained in memory by Firebase Auth.

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

