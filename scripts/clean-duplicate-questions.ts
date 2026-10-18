import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  collection,
  getDocs,
  query,
  limit,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';

async function checkDuplicates() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      localCache: memoryLocalCache(),
    } as any,
    TARGET_DATABASE_ID
  );

  const testEmail = `cleaner-${Date.now()}@boardly-test.internal`;
  const testPassword = 'Password123!@#Test';
  await createUserWithEmailAndPassword(auth, testEmail, testPassword);

  const snap = await getDocs(query(collection(db, 'questions'), limit(2000)));
  console.log(`Loaded ${snap.size} questions from DB.`);

  const seenText = new Map<string, string>(); // normalized text -> id
  const duplicates: Array<{ id: string; stem: string; originalId: string }> = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const stem = (data.q || data.question || data.stem || '').trim().toLowerCase();
    if (!stem) return;
    if (seenText.has(stem)) {
      duplicates.push({ id: d.id, stem, originalId: seenText.get(stem)! });
    } else {
      seenText.set(stem, d.id);
    }
  });

  console.log(`Found ${duplicates.length} duplicate questions.`);
  if (duplicates.length > 0) {
    console.log('Sample duplicates:', duplicates.slice(0, 5));
    // Let's delete duplicates if any
    const batch = writeBatch(db);
    duplicates.forEach((dup) => {
      batch.delete(doc(db, 'questions', dup.id));
      batch.delete(doc(db, 'questionKeys', dup.id));
    });
    try {
      await batch.commit();
      console.log(`Successfully deleted ${duplicates.length} duplicate questions from questions and questionKeys.`);
    } catch (e: any) {
      console.warn('Batch delete notice:', e.message);
    }
  }
  process.exit(0);
}

checkDuplicates().catch((err) => {
  console.error(err);
  process.exit(1);
});
