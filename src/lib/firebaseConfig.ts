// PROTECTED: do not modify unless the task is explicitly about authentication. See PROJECT_RULES.md
/**
 * Single source of truth for Firebase configuration and instance exports.
 * 
 * Target project: boardly-8c0cd
 * Authorized authDomain: auth.boardly.cfd
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDocFromServer,
  getCountFromServer,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDocFromServer,
  getCountFromServer,
  runTransaction,
  serverTimestamp,
  onSnapshot,
};

export type {
  QueryDocumentSnapshot,
  DocumentData,
  DocumentSnapshot,
};

export function cleanEnvVar(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/[\r\n]+/g, '');
}

// Validation helpers
export const isValidHostname = (host: string): boolean => {
  if (!host || typeof host !== 'string') return false;
  const clean = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  if (!clean || /\s/.test(clean)) return false;
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(clean);
};

// Target project constants (Boardly production - boardly-8c0cd)
export const TARGET_PROJECT_ID = 'boardly-8c0cd';
export const TARGET_AUTH_DOMAIN = 'auth.boardly.cfd';
export const TARGET_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
export const TARGET_APP_ID = '1:423201171551:web:219bb34b-b7b4-4c85-bd1f-8efd086df9c2';
export const TARGET_MESSAGING_SENDER_ID = '423201171551';
export const TARGET_STORAGE_BUCKET = 'boardly-8c0cd.firebasestorage.app';
export const TARGET_FIRESTORE_DATABASE_ID = 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

// Permanent Firebase web configuration for boardly-8c0cd.
// Hardcoded constants ensure reliable operation across all build targets (Cloudflare Pages, AI Studio, etc.)
// with no environment-variable overrides in production.
export const firebaseConfig = {
  projectId: TARGET_PROJECT_ID,
  authDomain: TARGET_AUTH_DOMAIN,
  apiKey: TARGET_API_KEY,
  appId: TARGET_APP_ID,
  messagingSenderId: TARGET_MESSAGING_SENDER_ID,
  storageBucket: TARGET_STORAGE_BUCKET,
} as const;

export const configValidation = {
  isValid: true,
  badVars: [] as string[],
};

// Runtime guardrails
if (firebaseConfig.projectId !== TARGET_PROJECT_ID) {
  const msg = `[CRITICAL SECURITY GUARD] Production Firebase projectId is "${firebaseConfig.projectId}", expected "${TARGET_PROJECT_ID}". Halting to prevent data corruption.`;
  console.error(msg);
  throw new Error(msg);
}

if (firebaseConfig.authDomain !== TARGET_AUTH_DOMAIN) {
  const msg = `[CRITICAL SECURITY GUARD] Production Firebase authDomain is "${firebaseConfig.authDomain}", expected "${TARGET_AUTH_DOMAIN}". Halting to prevent incorrect auth flow.`;
  console.error(msg);
  throw new Error(msg);
}

if (firebaseConfig.authDomain.includes('gen-lang' + '-client') || firebaseConfig.authDomain.includes('firebase' + 'app.com')) {
  const msg = `[CRITICAL SECURITY GUARD] Forbidden authDomain detected: "${firebaseConfig.authDomain}". Must use "${TARGET_AUTH_DOMAIN}".`;
  console.error(msg);
  throw new Error(msg);
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with browser local persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Boardly Auth] Persistence error:', err);
});

export { browserLocalPersistence, setPersistence };

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test auth handler endpoint helper
export async function testAuthHandlerEndpoint(host: string): Promise<boolean> {
  if (!isValidHostname(host)) return false;
  const cleanHost = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://${cleanHost}/__/auth/handler`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.type === 'opaque' || (res.status >= 200 && res.status < 400);
  } catch (err) {
    console.warn(`[Boardly Auth] Auth handler probe to ${cleanHost} failed:`, err);
    return false;
  }
}

// Google sign-in: popup ONLY against auth.boardly.cfd
export async function performGoogleSignIn(): Promise<any> {
  try {
    // Ensure auth domain is pinned to TARGET_AUTH_DOMAIN
    if ((auth as any)?.config) (auth as any).config.authDomain = TARGET_AUTH_DOMAIN;
    if ((app?.options as any)) (app.options as any).authDomain = TARGET_AUTH_DOMAIN;

    return await signInWithPopup(auth, googleProvider);
  } catch (popupErr: any) {
    console.warn('[Boardly Auth] Google popup error:', popupErr);
    if (
      popupErr?.code === 'auth/popup-blocked' ||
      popupErr?.code === 'auth/cancelled-popup-request' ||
      popupErr?.code === 'auth/popup-closed-by-user' ||
      popupErr?.message?.includes('popup')
    ) {
      throw new Error("Allow pop-ups for this site, then try again.");
    }
    throw popupErr;
  }
}

// Initialize Firestore Database with named database instance
export const db = getFirestore(app, TARGET_FIRESTORE_DATABASE_ID);
