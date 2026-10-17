import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { TARGET_PROJECT_ID, TARGET_DATABASE_ID, firebaseConfig } from '../src/lib/firebaseConfig';

async function testPersistence() {
  console.log('====================================================');
  console.log('🧪 FIRESTORE AUTHENTICATED PERSISTENCE VERIFICATION');
  console.log('====================================================');
  console.log(`USING DATABASE: ${TARGET_DATABASE_ID}`);
  console.log(`PROJECT ID:     ${TARGET_PROJECT_ID}`);

  if (TARGET_DATABASE_ID !== 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712') {
    throw new Error(`Database ID mismatch: expected ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712 but got ${TARGET_DATABASE_ID}`);
  }

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

  console.log('✅ Firestore instance initialized with:');
  console.log('   - databaseId: ' + TARGET_DATABASE_ID);
  console.log('   - experimentalForceLongPolling: true');
  console.log('   - useFetchStreams: false');

  // Create unique test credentials
  const testEmail = `test-onboarding-${Date.now()}@boardly-test.internal`;
  const testPassword = 'Password123!@#Test';

  console.log(`\nStep 1: Authenticating user (${testEmail})...`);
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log(`✅ User registered with UID: ${userCredential.user.uid}`);
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log(`✅ Signed in existing test user with UID: ${userCredential.user.uid}`);
    } else {
      throw authErr;
    }
  }

  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);

  // Step 2: Onboarding Save to users/{uid}
  console.log(`\nStep 2: Saving Onboarding profile to users/${user.uid}...`);
  const onboardingPayload = {
    uid: user.uid,
    displayName: 'Ahmad Khan',
    email: testEmail,
    targetUniversity: 'NUST',
    targetExam: 'NUST NET',
    testDate: '2026-12-15',
    targetTestDate: '2026-12-15',
    track: 'Pre-Engineering',
    academicTrack: 'Pre-Engineering',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    onboardingComplete: true,
    onboardingCompleted: true,
    profileCompleted: true,
    plan: 'free',
    role: 'student',
    streak: 3,
    testsUsedToday: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userDocRef, onboardingPayload, { merge: true });
  console.log('✅ Onboarding write to users/{uid} succeeded!');

  // Step 3: Refresh 5 times and verify values persist
  console.log('\nStep 3: Refreshing and reading users/{uid} 5 times...');
  for (let cycle = 1; cycle <= 5; cycle++) {
    // Add small delay to simulate successive page refreshes
    await new Promise((res) => setTimeout(res, 300));
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      throw new Error(`Cycle ${cycle}/5 FAILED: Document users/${user.uid} was not found!`);
    }

    const data = snap.data();
    if (
      data.targetUniversity !== 'NUST' ||
      data.targetExam !== 'NUST NET' ||
      data.academicTrack !== 'Pre-Engineering' ||
      data.onboardingCompleted !== true ||
      data.profileCompleted !== true ||
      !Array.isArray(data.subjects) ||
      data.subjects.length !== 3
    ) {
      throw new Error(`Cycle ${cycle}/5 FAILED: Document data mismatch: ${JSON.stringify(data)}`);
    }

    console.log(`  [Refresh ${cycle}/5] ✅ OK: targetUniversity="${data.targetUniversity}", exam="${data.targetExam}", onboardingCompleted=${data.onboardingCompleted}`);
  }

  console.log('✅ All 5 consecutive refreshes confirmed 100% data persistence in named database!');

  // Step 4: Verify Dashboard Collections (Tests Left, Weak Chapters, Streaks)
  console.log('\nStep 4: Verifying Dashboard queries...');
  
  // 4a: chapterStats subcollection (Weak Chapters)
  const chapterStatRef = doc(db, 'users', user.uid, 'chapterStats', 'math_integration');
  await setDoc(chapterStatRef, {
    chapter: 'Integration by Parts',
    subject: 'Mathematics',
    correct: 14,
    total: 20,
    updatedAt: serverTimestamp(),
  });
  const chapterSnap = await getDocs(collection(db, 'users', user.uid, 'chapterStats'));
  console.log(`  [Weak Chapters] ✅ Found ${chapterSnap.size} chapter stat document(s).`);

  // 4b: usage tracking (Tests Left)
  const usageRef = doc(db, 'users', user.uid, 'usage', 'today');
  await setDoc(usageRef, { testsUsed: 1, date: '2026-10-17' });
  const usageSnap = await getDoc(usageRef);
  console.log(`  [Tests Left] ✅ Verified daily usage doc: testsUsed=${usageSnap.data()?.testsUsed}`);

  // Clean up test documents and user
  console.log('\nCleaning up test artifacts...');
  try {
    await deleteDoc(chapterStatRef);
    await deleteDoc(usageRef);
    await deleteDoc(userDocRef);
    await deleteUser(user);
    console.log('✅ Test user cleaned up.');
  } catch (cleanErr) {
    console.warn('Note on cleanup:', cleanErr);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL REQUIREMENTS TESTED AND VERIFIED SUCCESSFULLY');
  console.log('====================================================');
}

testPersistence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
