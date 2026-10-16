import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Resolve authDomain:
// Uses VITE_FIREBASE_AUTH_DOMAIN if provided.
// If same-origin proxy is set up for /__/auth/* on boardly.cfd, setting VITE_FIREBASE_AUTH_DOMAIN=boardly.cfd
// eliminates cross-domain ITP / storage partitioning issues entirely.
const resolveAuthDomain = (): string => {
  const envDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim();
  if (envDomain) return envDomain;
  return 'auth.boardly.cfd';
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// If a specific custom database is configured and not default, use it; otherwise fallback to default Firestore database
const customDbId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined)?.trim();
const DATABASE_ID: string | undefined =
  customDbId && customDbId !== '(default)' && customDbId !== 'default'
    ? customDbId
    : undefined;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Force long-polling & in-memory cache so mobile networks, Cloudflare proxies, and IndexedDB locks never hang Firestore requests
export const db = DATABASE_ID
  ? initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      },
      DATABASE_ID
    )
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache(),
    });
