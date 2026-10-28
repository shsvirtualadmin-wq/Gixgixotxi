import firebaseAppletConfig from '../../firebase-applet-config.json';

export const FIREBASE_DEFAULT_AUTH_DOMAIN = `${firebaseAppletConfig.projectId}.firebaseapp.com`;

function resolveRuntimeAuthDomain(): string {
  const configured =
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain;

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    // Use custom auth.boardly.cfd domain only when running on boardly.cfd in production
    if (host === 'boardly.cfd' || host.endsWith('.boardly.cfd')) {
      return configured || 'auth.boardly.cfd';
    }
    // On preview / localhost domains, use the canonical Firebase project authDomain
    // so Google Sign-In and sendPasswordResetEmail never fail domain validation
    return FIREBASE_DEFAULT_AUTH_DOMAIN;
  }

  return configured || FIREBASE_DEFAULT_AUTH_DOMAIN;
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: resolveRuntimeAuthDomain(),
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://gen-lang-client-0365509316-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
};

export const TARGET_PROJECT_ID = firebaseConfig.projectId;
export const TARGET_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
export const TARGET_AUTH_DOMAIN = firebaseConfig.authDomain;
export const TARGET_API_KEY = firebaseConfig.apiKey;
export const TARGET_STORAGE_BUCKET = firebaseConfig.storageBucket;
export const TARGET_MESSAGING_SENDER_ID = firebaseConfig.messagingSenderId;
export const TARGET_APP_ID = firebaseConfig.appId;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);
