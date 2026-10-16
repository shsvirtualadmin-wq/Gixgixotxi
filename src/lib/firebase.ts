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

// Hardcoded fallback so we NEVER accidentally connect to the (default) database
const DATABASE_ID: string =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined) ??
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// experimentalAutoDetectLongPolling: true → Pakistani ISP/firewall fallback
export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  DATABASE_ID
);
