import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
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

// experimentalAutoDetectLongPolling: true → Pakistani ISP/firewall fallback
export const db = DATABASE_ID
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, DATABASE_ID)
  : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

