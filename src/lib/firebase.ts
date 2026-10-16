import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const TARGET_PROJECT_ID = 'gen-lang-client-0366509316';
export const TARGET_DATABASE_ID = 'ai-studio-25287ca6-33a1-49f8-8867-70061120a712';
export const TARGET_AUTH_DOMAIN = 'gen-lang-client-0366509316.firebaseapp.com';
export const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
export const TARGET_STORAGE_BUCKET = 'gen-lang-client-0366509316.firebasestorage.app';
export const TARGET_MESSAGING_SENDER_ID = '0366509316';
export const TARGET_APP_ID = '1:0366509316:web:gen-lang-client-0366509316';

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || TARGET_API_KEY,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() || TARGET_AUTH_DOMAIN,
  projectId: TARGET_PROJECT_ID,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() || TARGET_STORAGE_BUCKET,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() || TARGET_MESSAGING_SENDER_ID,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() || TARGET_APP_ID,
  firestoreDatabaseId: TARGET_DATABASE_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Force long-polling & in-memory cache so mobile networks, Cloudflare proxies, and IndexedDB locks never hang Firestore requests
// Pinned to named database: ai-studio-25287ca6-33a1-49f8-8867-70061120a712
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache(),
  },
  TARGET_DATABASE_ID
);

export { getApp, getFirestore, getAuth, getStorage };
