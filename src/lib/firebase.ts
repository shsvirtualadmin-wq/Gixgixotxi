// DO NOT CHANGE OR REGENERATE
// Single source of truth for Firebase initialization in Boardly

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

export const TARGET_PROJECT_ID = 'boardly-8c0cd';
export const TARGET_AUTH_DOMAIN = 'auth.boardly.cfd';
export const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
export const TARGET_STORAGE_BUCKET = 'boardly-8c0cd.firebasestorage.app';
export const TARGET_MESSAGING_SENDER_ID = '423201171551';
export const TARGET_APP_ID = '1:423201171551:web:219bb34b-b7b4-4c85-bd1f-8efd086df9c2';

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || TARGET_API_KEY,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() || TARGET_AUTH_DOMAIN,
  projectId: TARGET_PROJECT_ID,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() || TARGET_STORAGE_BUCKET,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() || TARGET_MESSAGING_SENDER_ID,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() || TARGET_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Force long-polling & in-memory cache so mobile networks, Cloudflare proxies, and IndexedDB locks never hang Firestore requests
// Do not set firestoreDatabaseId unless a named database truly exists; use standard default database
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
});

export { getApp };
