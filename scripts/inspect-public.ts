import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  collection,
  getDocs,
} from 'firebase/firestore';
import { TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    localCache: memoryLocalCache(),
  } as any,
  TARGET_DATABASE_ID
);

async function main() {
  console.log('Querying publicProfiles...');
  const snap = await getDocs(collection(db, 'publicProfiles'));
  console.log(`Found ${snap.size} publicProfiles:`);
  snap.forEach(d => {
    console.log('--- USER DOC:', d.id, '---');
    console.log(JSON.stringify(d.data(), null, 2));
  });

  const crewSnap = await getDocs(collection(db, 'crews'));
  console.log(`\nFound ${crewSnap.size} crews:`);
  crewSnap.forEach(d => {
    console.log('--- CREW DOC:', d.id, '---');
    console.log(JSON.stringify(d.data(), null, 2));
  });

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
