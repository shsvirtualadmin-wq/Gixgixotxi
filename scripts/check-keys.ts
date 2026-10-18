import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, memoryLocalCache, doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig, TARGET_DATABASE_ID } from '../src/lib/firebaseConfig';

async function check() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, 'inspector-1792333769469@boardly-test.internal', 'Password123!@#Test');
  const db = initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false, localCache: memoryLocalCache() } as any, TARGET_DATABASE_ID);
  
  const snap1 = await getDoc(doc(db, 'questionKeys', 'q_1792303165429_999h5'));
  console.log('questionKeys for q_1792303165429_999h5 exists?', snap1.exists(), snap1.data());
  
  const keysSnap = await getDocs(query(collection(db, 'questionKeys'), limit(5)));
  console.log('questionKeys count in collection:', keysSnap.size);
  keysSnap.docs.forEach(d => console.log('sample key id:', d.id, d.data()));
  process.exit(0);
}
check().catch(e => { console.error('Check error:', e); process.exit(1); });
