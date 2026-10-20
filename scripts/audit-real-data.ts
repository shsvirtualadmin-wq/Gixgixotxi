import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { TARGET_PROJECT_ID, TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    localCache: memoryLocalCache(),
  } as unknown as Parameters<typeof initializeFirestore>[1],
  TARGET_DATABASE_ID
);

async function main() {
  console.log('Auditing Firestore database:', TARGET_DATABASE_ID);
  
  // Try to sign in as inspector or test user
  const emails = [
    'inspector.dev@boardly.test',
    'shsvirtualadmin@gmail.com',
    'jan798408@gmail.com',
  ];

  for (const email of emails) {
    try {
      const user = await signInWithEmailAndPassword(auth, email, 'InspectorPassword123!');
      console.log(`Signed in successfully as ${email} (UID: ${user.user.uid})`);
      break;
    } catch (e: any) {
      console.log(`Could not sign in as ${email}: ${e.message}`);
    }
  }

  console.log('Current Auth user:', auth.currentUser?.uid, auth.currentUser?.email);

  // If signed in, query wallets and attempts
  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(db, 'wallets'));
      console.log(`Wallets count: ${snap.size}`);
      snap.forEach(d => console.log('Wallet:', d.id, JSON.stringify(d.data())));
    } catch (e: any) {
      console.log('Wallet error:', e.message);
    }
  }
}

main().catch(console.error);
