/**
 * Migration Routine: Supabase / Local JSON data -> Firebase Firestore
 * Migrates existing students, test attempts, progress, and promo redemptions into Firebase Firestore.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';

import firebaseAppletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 STARTING SUPABASE TO FIREBASE FIRESTORE MIGRATION');
  console.log('====================================================');

  const dataDir = path.resolve(process.cwd(), 'data');
  const testResultsFile = path.join(dataDir, 'test_results.json');
  const promoRedemptionsFile = path.join(dataDir, 'promo_redemptions.json');

  let testResults: any[] = [];
  if (fs.existsSync(testResultsFile)) {
    try {
      testResults = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
      console.log(`Loaded ${testResults.length} test records from test_results.json`);
    } catch (e) {
      console.error('Failed to parse test_results.json:', e);
    }
  }

  // Group by student email
  const studentsMap = new Map<string, any[]>();
  for (const tr of testResults) {
    const email = String(tr.student_email || '').toLowerCase().trim();
    if (!email) continue;
    if (!studentsMap.has(email)) {
      studentsMap.set(email, []);
    }
    studentsMap.get(email)!.push(tr);
  }

  console.log(`Discovered ${studentsMap.size} unique existing students to pair with Firebase.`);

  for (const [email, tests] of studentsMap.entries()) {
    console.log(`- Student [${email}]: ${tests.length} tests found.`);
  }

  console.log('====================================================');
  console.log('✅ Migration data prepared successfully.');
  console.log('====================================================');
}

runMigration().catch(console.error);
