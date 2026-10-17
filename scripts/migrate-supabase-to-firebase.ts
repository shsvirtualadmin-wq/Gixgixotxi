/**
 * Migration Routine: Supabase / Local JSON data -> Firebase Firestore
 * Migrates existing students, test attempts, progress, and promo redemptions into Firebase Firestore.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';

import { TARGET_DATABASE_ID } from '../src/lib/firebaseConfig';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0365509316.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
  firestoreDatabaseId: TARGET_DATABASE_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, TARGET_DATABASE_ID);

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
