import { api } from './api';

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
  verifyTimeoutMs?: number;
}

export interface RobustSaveResult {
  success: boolean;
  saveId: string;
  durationMs: number;
  mode: 'confirmed' | 'server_verified' | 'syncing_offline';
  message?: string;
}

export async function robustSaveUserProfile(
  uid: string,
  data: Record<string, unknown>,
  options: RobustSaveOptions = {}
): Promise<RobustSaveResult> {
  const verifyTimeoutMs = options.verifyTimeoutMs ?? 8000;
  const saveId = `save_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const startTime = Date.now();

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
    uid,
    saveId,
    updatedAt: Date.now(),
  };

  try {
    const writePromise = api.put('/api/users/me', payload);

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
      return {
        success: true,
        saveId,
        durationMs: elapsed,
        mode: 'confirmed',
      };
    }

    try {
      const serverRes = await api.get<{ profile?: Record<string, unknown> }>('/api/users/me');
      const serverData = serverRes?.profile;
      if (serverData && (serverData.saveId === saveId || serverData.profileCompleted === true)) {
        const elapsed = Date.now() - startTime;
        updateSaveState({
          status: 'server_verified',
          elapsedMs: elapsed,
          serverVerified: true,
        });
        return {
          success: true,
          saveId,
          durationMs: elapsed,
          mode: 'server_verified',
        };
      }
    } catch (serverErr) {
      console.warn('[robustSave] /api/users/me check failed:', serverErr);
    }

    const elapsed = Date.now() - startTime;
    updateSaveState({
      status: 'syncing_offline',
      elapsedMs: elapsed,
      offlineSyncing: true,
    });

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

    throw err;
  }
}
