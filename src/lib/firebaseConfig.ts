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

// Target project defaults (Boardly production)
export const TARGET_PROJECT_ID = 'boardly-8c0cd';
export const TARGET_AUTH_DOMAIN = 'auth.boardly.cfd';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

// Read all values from environment variables with fallbacks to boardly-8c0cd target
const rawApiKey = cleanEnvVar(getEnvVar('VITE_FIREBASE_API_KEY'));
const rawAuthDomain = cleanEnvVar(getEnvVar('VITE_FIREBASE_AUTH_DOMAIN')) || TARGET_AUTH_DOMAIN;
const rawProjectId = cleanEnvVar(getEnvVar('VITE_FIREBASE_PROJECT_ID')) || TARGET_PROJECT_ID;
const rawStorageBucket = cleanEnvVar(getEnvVar('VITE_FIREBASE_STORAGE_BUCKET')) || `${rawProjectId}.firebasestorage.app`;
const rawMessagingSenderId = cleanEnvVar(getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID')) || '423201171551';
const rawAppId = cleanEnvVar(getEnvVar('VITE_FIREBASE_APP_ID')) || '1:423201171551:web:219bb34b-b7b4-4c85-bd1f-8efd086df9c2';
const rawFirestoreDbId = cleanEnvVar(getEnvVar('VITE_FIREBASE_FIRESTORE_DATABASE_ID')) || '(default)';

// Runtime guardrails
const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;

if (isProd) {
  if (rawProjectId !== TARGET_PROJECT_ID) {
    const msg = `[CRITICAL SECURITY GUARD] Production Firebase projectId is "${rawProjectId}", expected "${TARGET_PROJECT_ID}". Halting to prevent data corruption.`;
    console.error(msg);
    throw new Error(msg);
  }
  if (rawAuthDomain !== TARGET_AUTH_DOMAIN) {
    const msg = `[CRITICAL SECURITY GUARD] Production Firebase authDomain is "${rawAuthDomain}", expected "${TARGET_AUTH_DOMAIN}". Halting to prevent incorrect auth flow.`;
    console.error(msg);
    throw new Error(msg);
  }
}

if (rawAuthDomain.includes('gen-lang' + '-client') || rawAuthDomain.includes('firebase' + 'app.com')) {
  const msg = `[CRITICAL SECURITY GUARD] Forbidden authDomain detected: "${rawAuthDomain}". Must use "${TARGET_AUTH_DOMAIN}".`;
  console.error(msg);
  if (isProd) {
    throw new Error(msg);
  }
}

export const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: rawStorageBucket,
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId,
};

export const configValidation = {
  isValid: Boolean(rawApiKey && rawProjectId && rawAuthDomain),
  badVars: [] as string[],
};

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

// Initialize Firestore Database
export const db = getFirestore(app, rawFirestoreDbId === '(default)' ? undefined : rawFirestoreDbId);
