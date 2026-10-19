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
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(bank1App);
  }
})();

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

// ─── SOURCE HEALTH TRACKING ──────────────────────────────────────────────────
const failingSourceMap = new Map<string, string>();
const healthListeners = new Set<(failing: { id: string; name: string; error?: string }[]) => void>();

export function recordSourceFailure(sourceId: string, error?: unknown): void {
  const errMsg = (error as { message?: string })?.message || String(error || 'Unknown error');
  failingSourceMap.set(sourceId, errMsg);
  notifyHealthListeners();
}

export function recordSourceSuccess(sourceId: string): void {
  if (failingSourceMap.has(sourceId)) {
    failingSourceMap.delete(sourceId);
    notifyHealthListeners();
  }
}

export function getFailingSources(): { id: string; name: string; error?: string }[] {
  const list: { id: string; name: string; error?: string }[] = [];
  for (const [id, error] of failingSourceMap.entries()) {
    const src = getBankSource(id);
    list.push({
      id,
      name: src?.name || id,
      error,
    });
  }
  return list;
}

function notifyHealthListeners() {
  const failing = getFailingSources();
  healthListeners.forEach((listener) => {
    try {
      listener(failing);
    } catch {
      // Ignore listener error
    }
  });
}

export function subscribeFailingSources(
  callback: (failing: { id: string; name: string; error?: string }[]) => void
): () => void {
  healthListeners.add(callback);
  callback(getFailingSources());
  return () => {
    healthListeners.delete(callback);
  };
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
  recordSourceSuccess('bank1');
  return cred.user;
}

export async function lockBank1(): Promise<void> {
  await signOut(bank1Auth);
}
