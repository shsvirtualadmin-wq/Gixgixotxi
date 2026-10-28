const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0365509316',
  appId: '1:556734245207:web:4797f3915b424209b03612',
  apiKey: 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
  authDomain: 'auth.boardly.cfd',
  firestoreDatabaseId: 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
  storageBucket: 'gen-lang-client-0365509316.firebasestorage.app',
  messagingSenderId: '556734245207',
  measurementId: '',
  databaseURL: 'https://gen-lang-client-0365509316-default-rtdb.firebaseio.com',
};

const resolvedProjectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;

export const FIREBASE_DEFAULT_AUTH_DOMAIN = `${resolvedProjectId}.firebaseapp.com`;

function resolveRuntimeAuthDomain(): string {
  const configured =
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain;

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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: resolveRuntimeAuthDomain(),
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
  projectId: resolvedProjectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
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

