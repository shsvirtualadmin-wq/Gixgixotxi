import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  where,
} from 'firebase/firestore';
import { TARGET_PROJECT_ID, TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';

async function inspectQuestions() {
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

  const testEmail = `inspector-${Date.now()}@boardly-test.internal`;
  const testPassword = 'Password123!@#Test';

  console.log(`Authenticating temporary user ${testEmail}...`);
  await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('Authenticated successfully.');

  // Try fetching without filters first (or with status/active filter)
  console.log('Fetching questions with status == published and active == true...');
  try {
    const q1 = query(
      collection(db, 'questions'),
      where('status', '==', 'published'),
      where('active', '==', true),
      limit(2000)
    );
    const snap1 = await getDocs(q1);
    console.log(`Query (status=published, active=true) returned ${snap1.size} documents.`);

    const subjectCounts: Record<string, number> = {};
    const sampleQuestions: any[] = [];
    snap1.docs.forEach((d) => {
      const data = d.data();
      const sub = data.subject || 'unknown';
      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
      if (sampleQuestions.length < 5) {
        sampleQuestions.push({ id: d.id, ...data });
      }
    });

    console.log('Subject counts (status=published, active=true):', subjectCounts);
    console.log('Sample question fields:', Object.keys(sampleQuestions[0] || {}));
    if (sampleQuestions[0]) {
      console.log('Sample question 0:', JSON.stringify(sampleQuestions[0], null, 2));
    }
  } catch (err: any) {
    console.error('Query (status=published, active=true) failed:', err.message);
  }

  // Try fetching all questions directly (to see if status or active is missing on some)
  console.log('\nFetching collection(questions) without filters (first 2000)...');
  try {
    const q2 = query(collection(db, 'questions'), limit(2000));
    const snap2 = await getDocs(q2);
    console.log(`Query without where clauses returned ${snap2.size} documents.`);
    const subjectsAll: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    const activeValues: Record<string, number> = {};
    let hasRand = 0;
    let missingRand = 0;
    const matchingMultiplicative: any[] = [];

    snap2.docs.forEach((d) => {
      const data = d.data();
      const sub = String(data.subject);
      subjectsAll[sub] = (subjectsAll[sub] || 0) + 1;
      const st = String(data.status);
      statuses[st] = (statuses[st] || 0) + 1;
      const ac = String(data.active ?? data.isActive);
      activeValues[ac] = (activeValues[ac] || 0) + 1;
      if (typeof data.rand === 'number') hasRand++;
      else missingRand++;

      const text = (data.q || data.question || data.stem || '') + ' ' + (data.options || []).join(' ');
      if (text.toLowerCase().includes('multiplicative') || text.toLowerCase().includes('additive')) {
        matchingMultiplicative.push({ id: d.id, q: data.q, subject: data.subject, chapter: data.chapter, rand: data.rand });
      }
    });

    console.log('All subjects in DB:', subjectsAll);
    console.log('All statuses in DB:', statuses);
    console.log('Active values in DB:', activeValues);
    console.log(`Has rand: ${hasRand}, Missing rand: ${missingRand}`);
    console.log('Matching "multiplicative" or "additive":', matchingMultiplicative);
  } catch (err: any) {
    console.error('Query without filters failed:', err.message);
  }
}

inspectQuestions().catch(console.error);
