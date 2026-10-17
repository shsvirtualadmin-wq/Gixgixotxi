// Single, unified Firebase configuration for Default Gemini Project (gen-lang-client-0365509316)

export const TARGET_PROJECT_ID = 'gen-lang-client-0365509316';
export const TARGET_DATABASE_ID = 'ai-studio-25287ca6-33a1-49f8-8867-70061120a712';
export const TARGET_AUTH_DOMAIN = 'gen-lang-client-0365509316.firebaseapp.com';
export const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
export const TARGET_STORAGE_BUCKET = 'gen-lang-client-0365509316.firebasestorage.app';
export const TARGET_MESSAGING_SENDER_ID = '0365509316';
export const TARGET_APP_ID = '1:0365509316:web:gen-lang-client-0365509316';

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY)?.trim() || TARGET_API_KEY,
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN)?.trim() || TARGET_AUTH_DOMAIN,
  projectId: TARGET_PROJECT_ID,
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET)?.trim() || TARGET_STORAGE_BUCKET,
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID)?.trim() || TARGET_MESSAGING_SENDER_ID,
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID)?.trim() || TARGET_APP_ID,
  firestoreDatabaseId: TARGET_DATABASE_ID,
};

export const firebaseWebConfig = firebaseConfig;
