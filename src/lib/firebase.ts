import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  TARGET_PROJECT_ID,
  TARGET_DATABASE_ID,
  TARGET_AUTH_DOMAIN,
  TARGET_API_KEY,
  TARGET_STORAGE_BUCKET,
  TARGET_MESSAGING_SENDER_ID,
  TARGET_APP_ID,
  firebaseConfig,
} from './firebaseConfig';

export {
  TARGET_PROJECT_ID,
  TARGET_DATABASE_ID,
  TARGET_AUTH_DOMAIN,
  TARGET_API_KEY,
  TARGET_STORAGE_BUCKET,
  TARGET_MESSAGING_SENDER_ID,
  TARGET_APP_ID,
  firebaseConfig,
};

// Single shared Firebase App instance used by both Auth and Firestore
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with the named database:
// Uses experimentalAutoDetectLongPolling: true for optimal transport
// Uses memoryLocalCache() to prevent multi-tab IndexedDB lock contention & write queue stalls
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: memoryLocalCache(),
      } as unknown as Parameters<typeof initializeFirestore>[1],
      TARGET_DATABASE_ID
    );
  } catch (err) {
    console.warn('[Firebase] initializeFirestore failed, falling back to getFirestore:', err);
    return getFirestore(app, TARGET_DATABASE_ID);
  }
})();


if (typeof window !== 'undefined') {
  const authProj = auth.app.options.projectId;
  const dbProj = db.app.options.projectId;
  const authDomain = auth.app.options.authDomain;
  const origin = window.location.origin;

  console.log(
    `%c[Firebase Runtime Config] authDomain: ${authDomain} | projectId: ${authProj} | origin: ${origin}`,
    'background: #0f172a; color: #38bdf8; font-size: 13px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
  );

  if (authDomain === 'auth.boardly.cfd') {
    console.log(
      `%c[Auth Domain Verified] authDomain is verified as: ${authDomain}`,
      'color: #10b981; font-weight: bold;'
    );
  } else {
    console.warn(
      `%c[Auth Domain Alert] authDomain is "${authDomain}" (expected: auth.boardly.cfd)`,
      'color: #f59e0b; font-weight: bold;'
    );
  }

  if (authProj !== dbProj) {
    console.error(
      `%c[FIREBASE CONFIG MISMATCH] auth projectId (${authProj}) !== db projectId (${dbProj})`,
      'background: #7f1d1d; color: #fecaca; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
  }
}

export { getApp, getFirestore, getAuth, getStorage };
