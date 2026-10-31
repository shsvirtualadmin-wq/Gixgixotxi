import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

// Single shared Firebase App instance used ONLY for Firebase Authentication
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  if (typeof window !== 'undefined') {
    const authProj = auth.app.options.projectId;
    const authDomain = auth.app.options.authDomain;
    const origin = window.location.origin;

    console.log(
      `%c[Firebase Auth Config] authDomain: ${authDomain} | projectId: ${authProj} | origin: ${origin}`,
      'background: #0f172a; color: #38bdf8; font-size: 13px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
  }
}

export { getApp, getAuth };
