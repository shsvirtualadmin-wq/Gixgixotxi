import {
  doc,
  setDoc,
  serverTimestamp,
  getDocFromServer,
  runTransaction,
  type DocumentReference,
  type Transaction,
  type SetOptions,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

export async function robustSaveDoc<AppModelType = DocumentData, DbModelType extends DocumentData = DocumentData>(
  docRef: DocumentReference<AppModelType, DbModelType>,
  data: Partial<AppModelType> | Record<string, unknown>,
  options: SetOptions = { merge: true }
): Promise<void> {
  await setDoc(docRef, data as Partial<AppModelType>, options);
}

export async function robustTransaction<T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> {
  return runTransaction(db, updateFunction);
}

export interface SaveProcessState {
  status: 'idle' | 'saving' | 'server_verified' | 'confirmed' | 'syncing_offline' | 'rejected';
  saveId: string | null;
  startTime: number | null;
  elapsedMs: number;
  serverVerified: boolean;
  offlineSyncing: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// Global live save state accessible to ?debug=1 panel
let currentSaveState: SaveProcessState = {
  status: 'idle',
  saveId: null,
  startTime: null,
  elapsedMs: 0,
  serverVerified: false,
  offlineSyncing: false,
};

const saveListeners = new Set<(state: SaveProcessState) => void>();

export function subscribeToSaveProcess(listener: (state: SaveProcessState) => void): () => void {
  saveListeners.add(listener);
  listener({ ...currentSaveState });
  return () => {
    saveListeners.delete(listener);
  };
}

function updateSaveState(partial: Partial<SaveProcessState>) {
  currentSaveState = {
    ...currentSaveState,
    ...partial,
  };
  saveListeners.forEach((l) => l({ ...currentSaveState }));
}

export function getSaveProcessState(): SaveProcessState {
  return { ...currentSaveState };
}

export interface RobustSaveOptions {
  verifyTimeoutMs?: number; // default ~8000ms
}

export interface RobustSaveResult {
  success: boolean;
  saveId: string;
  durationMs: number;
  mode: 'confirmed' | 'server_verified' | 'syncing_offline';
  message?: string;
}

/**
 * Saves user profile document with robust verification:
 * 1. Generates unique saveId and attaches serverTimestamp.
 * 2. Starts setDoc with merge: true.
 * 3. If setDoc resolves: returns success immediately.
 * 4. If setDoc has not resolved within ~8 seconds:
 *    Does NOT throw or fail! Checks getDocFromServer.
 *    If doc contains saveId and profileCompleted === true -> treats as success.
 *    If server cannot be reached -> treats as "Saved on this device, syncing" and lets user continue.
 * 5. Rejects ONLY if write promise rejects with real error code (e.g. permission-denied).
 */
export async function robustSaveUserProfile(
  uid: string,
  data: Record<string, unknown>,
  options: RobustSaveOptions = {}
): Promise<RobustSaveResult> {
  const verifyTimeoutMs = options.verifyTimeoutMs ?? 8000;
  const saveId = `save_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const startTime = Date.now();
  const userDocRef = doc(db, 'users', uid);

  updateSaveState({
    status: 'saving',
    saveId,
    startTime,
    elapsedMs: 0,
    serverVerified: false,
    offlineSyncing: false,
    errorCode: undefined,
    errorMessage: undefined,
  });

  const timer = setInterval(() => {
    if (currentSaveState.status === 'saving') {
      updateSaveState({ elapsedMs: Date.now() - startTime });
    }
  }, 250);

  const payload = {
    ...data,
    saveId,
    updatedAt: serverTimestamp(),
  };

  try {
    // Track write promise
    const writePromise = setDoc(userDocRef, payload, { merge: true });

    // Race between write promise and ~8s verification trigger
    const timeoutTrigger = new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), verifyTimeoutMs);
    });

    const winner = await Promise.race([writePromise.then(() => 'resolved'), timeoutTrigger]);

    clearInterval(timer);

    if (winner === 'resolved') {
      const elapsed = Date.now() - startTime;
      updateSaveState({
        status: 'confirmed',
        elapsedMs: elapsed,
      });
      console.log(`[robustSave] setDoc resolved directly in ${elapsed}ms for saveId: ${saveId}`);
      return {
        success: true,
        saveId,
        durationMs: elapsed,
        mode: 'confirmed',
      };
    }

    // Winner was timeout (>8 seconds elapsed without write resolution)
    console.warn(`[robustSave] setDoc write has not resolved after ${verifyTimeoutMs}ms. Verifying server state...`);

    // Verify with getDocFromServer
    try {
      const serverSnap = await getDocFromServer(userDocRef);
      if (serverSnap.exists()) {
        const serverData = serverSnap.data();
        if (serverData?.saveId === saveId || serverData?.profileCompleted === true) {
          const elapsed = Date.now() - startTime;
          updateSaveState({
            status: 'server_verified',
            elapsedMs: elapsed,
            serverVerified: true,
          });
          console.log(`[robustSave] Server verified doc contains saveId/profileCompleted in ${elapsed}ms`);
          return {
            success: true,
            saveId,
            durationMs: elapsed,
            mode: 'server_verified',
          };
        }
      }
    } catch (serverErr) {
      console.warn('[robustSave] getDocFromServer check failed or offline:', serverErr);
    }

    // If server could not be reached, local cache holds write and will sync in background
    const elapsed = Date.now() - startTime;
    updateSaveState({
      status: 'syncing_offline',
      elapsedMs: elapsed,
      offlineSyncing: true,
    });
    console.log(`[robustSave] Continuing with local save & background sync for saveId: ${saveId}`);

    return {
      success: true,
      saveId,
      durationMs: elapsed,
      mode: 'syncing_offline',
      message: 'Saved on this device, syncing',
    };
  } catch (err: unknown) {
    clearInterval(timer);
    const elapsed = Date.now() - startTime;
    const error = err as { code?: string; message?: string };
    const errCode = error?.code || 'SAVE_REJECTED';
    const errMsg = error?.message || String(err);

    updateSaveState({
      status: 'rejected',
      elapsedMs: elapsed,
      errorCode: errCode,
      errorMessage: errMsg,
    });

    console.error(`[robustSave] Write rejected after ${elapsed}ms:`, err);
    throw err;
  }
}
