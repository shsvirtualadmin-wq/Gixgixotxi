import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';
import { getCosmeticById, COSMETICS_CATALOG } from '../src/data/cosmeticsCatalog';

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

async function main() {
  console.log('Connecting to Firebase and signing in as inspector.dev@boardly.test...');
  const cred = await signInWithEmailAndPassword(auth, 'inspector.dev@boardly.test', 'InspectorPassword123!');
  const uid = cred.user.uid;
  console.log('Logged in as:', cred.user.email, 'UID:', uid);

  // 1. Fetch wallet doc
  const walletSnap = await getDoc(doc(db, 'wallets', uid));
  if (walletSnap.exists()) {
    const data = walletSnap.data();
    console.log('=== WALLET DATA ===');
    console.log('Balance:', data.balance);
    console.log('Equipped:', JSON.stringify(data.equipped));
    console.log('Owned array length:', data.owned?.length);
    console.log('Owned items:', JSON.stringify(data.owned));

    console.log('\n=== CATALOG LOOKUP FOR OWNED ITEMS ===');
    for (const itemId of data.owned || []) {
      const found = getCosmeticById(itemId);
      console.log(`Item ID: "${itemId}" -> Found in catalog: ${Boolean(found)} ${found ? `(${found.name}, type: ${found.type}, price: ${found.priceKobans})` : '[NOT IN CATALOG]'}`);
    }
  } else {
    console.log('Wallet document does not exist for UID:', uid);
  }

  // 2. Fetch ledger docs for user
  const ledgerSnap = await getDocs(query(collection(db, 'wallets', uid, 'ledger')));
  console.log('\n=== LEDGER ENTRIES ===', ledgerSnap.size);
  ledgerSnap.forEach(d => console.log('Ledger doc:', d.id, JSON.stringify(d.data())));

  // 3. Fetch user attempts
  const attemptsSnap = await getDocs(query(collection(db, 'attempts'), where('uid', '==', uid)));
  console.log('\n=== USER ATTEMPTS (uid query) ===', attemptsSnap.size);
  attemptsSnap.forEach(d => {
    const a = d.data();
    console.log('Attempt:', d.id, 'status:', a.status, 'completedAt:', a.completedAt, 'finishedAt:', a.finishedAt, 'submittedAt:', a.submittedAt, 'createdAt:', a.createdAt, 'endedAt:', a.endedAt, 'timestamp:', a.timestamp);
  });

  // 4. Fetch streaks doc
  const streakSnap = await getDoc(doc(db, 'streaks', uid));
  if (streakSnap.exists()) {
    console.log('\n=== STREAKS DOC ===', JSON.stringify(streakSnap.data(), null, 2));
  } else {
    console.log('\n=== NO STREAKS DOC ===');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Audit error:', err);
  process.exit(1);
});
