#!/usr/bin/env node
/**
 * ============================================================================
 * ORPHAN PROFILE CLEANUP SCRIPT
 * ============================================================================
 * Scans Firestore `publicProfiles` (and `users` when authenticated as admin)
 * and `data/deleted_accounts_registry.json` for:
 * 1. Profiles whose email or UID was permanently deleted from the Admin Portal.
 * 2. Duplicate email profiles where a newer profile exists for the same email
 *    (left over when an account was deleted in Firebase Auth and re-registered).
 * 3. Profiles explicitly marked `deleted: true` or `status: 'deleted'`.
 *
 * Usage:
 *   node scripts/cleanup-orphan-profiles.mjs          # Execute cleanup
 *   node scripts/cleanup-orphan-profiles.mjs --dry    # Dry-run only
 */

import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const isDryRun = process.argv.includes('--dry');

const firebaseConfigPath = path.resolve('firebase-applet-config.json');
const firebaseConfigJson = fs.existsSync(firebaseConfigPath)
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'))
  : {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
      firestoreDatabaseId:
        process.env.VITE_FIREBASE_DATABASE_ID ||
        'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        'gen-lang-client-0365509316.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
    };

const app = initializeApp(firebaseConfigJson);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

function toMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  const p = Date.parse(String(val));
  return Number.isNaN(p) ? 0 : p;
}

async function runCleanup() {
  console.log(`🔍 Scanning profiles for orphan / deleted records (dryRun=${isDryRun})...`);

  await signInWithEmailAndPassword(
    auth,
    process.env.ADMIN_EMAIL || 'inspector.dev@boardly.test',
    process.env.ADMIN_PASSWORD || 'InspectorPassword123!'
  ).catch(() => {});

  let deletedRegistry = [];
  const regPath = path.resolve('data/deleted_accounts_registry.json');
  if (fs.existsSync(regPath)) {
    try {
      deletedRegistry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    } catch {}
  }
  const deletedUids = new Set(deletedRegistry.map((d) => d.uid).filter(Boolean));
  const deletedEmails = new Set(
    deletedRegistry.map((d) => String(d.email || '').toLowerCase()).filter(Boolean)
  );

  const pubSnap = await getDocs(collection(db, 'publicProfiles')).catch(() => ({ docs: [] }));
  const usersSnap = await getDocs(collection(db, 'users')).catch(() => ({ docs: [] }));

  const profilesByUid = new Map();
  const profilesByEmail = new Map();

  for (const d of [...pubSnap.docs, ...usersSnap.docs]) {
    const data = d.data();
    const uid = d.id;
    const email = String(data.email || '').trim().toLowerCase();
    const createdAt = toMs(data.createdAt || data.updatedAt);

    const existing = profilesByUid.get(uid);
    const merged = {
      uid,
      email: email || existing?.email || '',
      createdAt: Math.max(createdAt, existing?.createdAt || 0),
      data: { ...(existing?.data || {}), ...data },
    };
    profilesByUid.set(uid, merged);
  }

  for (const info of profilesByUid.values()) {
    if (info.email) {
      if (!profilesByEmail.has(info.email)) {
        profilesByEmail.set(info.email, []);
      }
      profilesByEmail.get(info.email).push(info);
    }
  }

  const orphanUids = new Set();
  const reasons = new Map();

  // 1. Check deleted accounts registry
  for (const [uid, info] of profilesByUid.entries()) {
    if (deletedUids.has(uid) || (info.email && deletedEmails.has(info.email))) {
      orphanUids.add(uid);
      reasons.set(uid, `Matches admin-deleted account (${info.email || uid})`);
    } else if (info.data.deleted === true || info.data.status === 'deleted') {
      orphanUids.add(uid);
      reasons.set(uid, 'Marked as deleted in Firestore');
    }
  }

  // 2. Check duplicate emails across UIDs (keep newest UID)
  for (const [email, list] of profilesByEmail.entries()) {
    if (list.length > 1) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      const keeper = list[0];
      for (let i = 1; i < list.length; i++) {
        const dup = list[i];
        orphanUids.add(dup.uid);
        reasons.set(
          dup.uid,
          `Orphan duplicate email '${email}' (superseded by newer UID ${keeper.uid})`
        );
      }
    }
  }

  console.log(
    `📊 Scanned ${profilesByUid.size} unique profile UID(s). Found ${orphanUids.size} orphan profile(s).`
  );

  let removedCount = 0;
  for (const uid of orphanUids) {
    console.log(`  - UID: ${uid} | Reason: ${reasons.get(uid)}`);
    if (!isDryRun) {
      const collectionsToClean = [
        'users',
        'publicProfiles',
        'streaks',
        'referrals',
        'leaderboard',
        'wallets',
        'captainApplications',
        'crewApplications',
      ];
      for (const collName of collectionsToClean) {
        await deleteDoc(doc(db, collName, uid)).catch(() => {});
      }
      removedCount++;
    }
  }

  console.log(
    isDryRun
      ? `✅ Dry run complete. Found ${orphanUids.size} orphan profile(s).`
      : `✅ Cleanup complete. Removed ${removedCount} orphan profile(s).`
  );
  process.exit(0);
}

runCleanup().catch((err) => {
  console.error('❌ Orphan profile cleanup error:', err);
  process.exit(1);
});
