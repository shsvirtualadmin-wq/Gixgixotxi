import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
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

// Initialize Firestore with the named database per configuration:
// Named database: ai-studio-25287ca6-33a1-49f8-8867-70061120a712
// Uses experimentalAutoDetectLongPolling: true to eliminate WebChannel proxy buffering timeouts
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      TARGET_DATABASE_ID
    );
  } catch {
    return getFirestore(app, TARGET_DATABASE_ID);
  }
})();

// Task 6: Startup check that logs a visible error if auth.app.options.projectId !== db.app.options.projectId
if (typeof window !== 'undefined') {
  const authProj = auth.app.options.projectId;
  const dbProj = db.app.options.projectId;
  if (authProj !== dbProj) {
    console.error(
      `%c[FIREBASE CONFIG MISMATCH] auth projectId (${authProj}) !== db projectId (${dbProj})`,
      'background: #7f1d1d; color: #fecaca; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
  } else {
    console.log(
      `%c[Firebase Initialized] Auth & Firestore shared projectId: ${authProj}`,
      'color: #10b981; font-weight: bold;'
    );
  }
}

export { getApp, getFirestore, getAuth, getStorage };
