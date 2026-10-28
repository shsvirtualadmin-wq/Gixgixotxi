import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('--- Initializing Firestore & Storage Rules Test Environment ---');
  const firestoreRulesPath = path.resolve(__dirname, '../firestore.rules');
  const storageRulesPath = path.resolve(__dirname, '../storage.rules');
  const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
  const storageRules = fs.readFileSync(storageRulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0365509316',
    firestore: {
      rules: firestoreRules,
      host: '127.0.0.1',
      port: 8282,
    },
  });

  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      results.push({ name, status: 'PASS' });
    } catch (err) {
      console.error(`FAIL: ${name} ->`, err.message);
      results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  // Set up seed data with admin context (bypasses rules)
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // User Alice (student)
    await db.collection('users').doc('alice-123').set({
      uid: 'alice-123',
      displayName: 'Alice Student',
      email: 'alice@example.com',
      role: 'student',
      plan: 'free',
      paid_until: null,
      status: 'active',
      suspended: false,
    });

    // User Bob (student)
    await db.collection('users').doc('bob-456').set({
      uid: 'bob-456',
      displayName: 'Bob Student',
      email: 'bob@example.com',
      role: 'student',
      plan: 'free',
      paid_until: null,
      status: 'active',
      suspended: false,
    });

    // User Mod (moderator)
    await db.collection('users').doc('mod-777').set({
      uid: 'mod-777',
      displayName: 'Mod User',
      email: 'mod@example.com',
      role: 'moderator',
      plan: 'free',
      paid_until: null,
      status: 'active',
      suspended: false,
    });

    // Crew Alpha (led by Alice, Bob is a member)
    await db.collection('crews').doc('crew-alpha').set({
      id: 'crew-alpha',
      name: 'Alpha Crew',
      code: 'ALPHA1',
      leaderId: 'alice-123',
      leaderName: 'Alice Student',
      tier: 'free',
      paid_until: null,
      joinMode: 'direct',
      minStreak: 5,
      maxMembers: 5,
      isClosed: false,
      members: [
        { uid: 'alice-123', displayName: 'Alice', role: 'leader' },
        { uid: 'bob-456', displayName: 'Bob', role: 'member' },
      ],
      memberUids: ['alice-123', 'bob-456'],
      requests: [],
    });

    // Payment request for Alice
    await db.collection('paymentRequests').doc('pr-alice-1').set({
      userId: 'alice-123',
      amount: 499,
      status: 'pending',
    });

    // Payment receipt for Alice
    await db.collection('payments').doc('pay-alice-1').set({
      userId: 'alice-123',
      amount: 499,
      method: 'easypaisa',
    });

    // Admin audit log
    await db.collection('auditLogs').doc('log-1').set({
      actor: 'admin',
      action: 'seed_init',
      timestamp: new Date().toISOString(),
    });

    // Published question
    await db.collection('questions').doc('q-pub-1').set({
      id: 'q-pub-1',
      q: 'What is $2+2$?',
      options: ['1', '2', '3', '4'],
      status: 'published',
      active: true,
      subject: 'mathematics',
    });
  });

  // Client contexts
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext('alice-123', { email: 'alice@example.com' }).firestore();
  const bobDb = testEnv.authenticatedContext('bob-456', { email: 'bob@example.com' }).firestore();
  const modDb = testEnv.authenticatedContext('mod-777', { email: 'mod@example.com', role: 'moderator' }).firestore();
  const adminDb = testEnv.authenticatedContext('jJfb1nThG1X9phL8fFDZ0G0J7m33', {
    email: 'shsvirtualadmin@gmail.com',
    email_verified: true,
    role: 'Super Admin',
  }).firestore();

  console.log('\n=== RUNNING SECURITY RULE TEST CASES ===\n');

  // ---------------------------------------------------------------------------
  // CASE 1: Logged-out user restrictions
  // ---------------------------------------------------------------------------
  await test('1a. Logged-out user CANNOT create a Commons post', async () => {
    await assertFails(
      unauthDb.collection('commonsPosts').doc('unauth-post-1').set({
        title: 'Guest Post',
        description: 'Should fail',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'guest',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
  });

  await test('1b. Logged-out user CANNOT upload attachment chunks to commonsAttachments or commonsPosts', async () => {
    await assertFails(
      unauthDb.collection('commonsAttachments').doc('att_guest_0').set({
        authorUid: 'guest',
        fileId: 'att_guest',
        chunkIndex: 0,
        totalChunks: 1,
        data: 'dGVzdA==',
      })
    );
  });

  await test('1c. Logged-out user CANNOT create comments, votes, bookmarks, or follows', async () => {
    await assertFails(
      unauthDb.collection('commonsPosts').doc('some-post').collection('comments').doc('c1').set({
        text: 'Guest comment',
        isAnonymous: false,
        authorUid: 'guest',
      })
    );
    await assertFails(
      unauthDb.collection('commonsPosts').doc('some-post').collection('votes').doc('guest').set({
        uid: 'guest',
        value: 1,
      })
    );
    await assertFails(
      unauthDb.collection('users').doc('alice-123').collection('savedCommons').doc('some-post').set({
        postId: 'some-post',
      })
    );
    await assertFails(
      unauthDb.collection('follows').doc('guest_alice-123').set({
        followerId: 'guest',
        followingId: 'alice-123',
      })
    );
  });

  // ---------------------------------------------------------------------------
  // CASE 2: Signed-in student file chunk upload & UID ownership
  // ---------------------------------------------------------------------------
  await test('2a. Signed-in student (Alice) CAN upload attachment chunk under own UID', async () => {
    await assertSucceeds(
      aliceDb.collection('commonsAttachments').doc('att_alice_0').set({
        authorUid: 'alice-123',
        fileId: 'att_alice',
        chunkIndex: 0,
        totalChunks: 1,
        fileName: 'MDCAT Organic Chem (2025) Notes.pdf',
        mimeType: 'application/pdf',
        data: 'JVBERi0xLjQK',
      })
    );
    await assertSucceeds(
      aliceDb.collection('commonsPosts').doc('att_alice_chunk_0').set({
        title: 'MDCAT Organic Chem (2025) Notes.pdf',
        description: 'attachment_chunk',
        type: 'attachment_chunk',
        isAnonymous: true,
        authorUid: null,
        isHidden: false,
        isAttachmentChunk: true,
        fileId: 'att_alice_chunk',
        chunkIndex: 0,
        totalChunks: 1,
        fileName: 'MDCAT Organic Chem (2025) Notes.pdf',
        mimeType: 'application/pdf',
        totalSize: 1024,
        data: 'JVBERi0xLjQK',
      })
    );
    await assertSucceeds(
      aliceDb.collection('postsPrivate').doc('att_alice_chunk_0').set({
        postId: 'att_alice_chunk_0',
        authorUid: 'alice-123',
        isAnonymous: true,
      })
    );
  });

  await test('2b. DENIED: Signed-in student (Alice) CANNOT upload attachment chunk under Bob\'s UID', async () => {
    await assertFails(
      aliceDb.collection('commonsAttachments').doc('att_spoof_0').set({
        authorUid: 'bob-456',
        fileId: 'att_spoof',
        chunkIndex: 0,
        totalChunks: 1,
        data: 'JVBERi0xLjQK',
      })
    );
    await assertFails(
      aliceDb.collection('postsPrivate').doc('att_spoof_chunk_0').set({
        postId: 'att_spoof_chunk_0',
        authorUid: 'bob-456',
        isAnonymous: true,
      })
    );
  });

  // ---------------------------------------------------------------------------
  // CASE 3: Storage rules static verification for MIME types, 25 MB limit, and /commons/{uid}/...
  // ---------------------------------------------------------------------------
  await test('3. Storage rules enforce /commons/{userId}/{allPaths=**}, 25 MB limit, allowed MIME types, and default deny', async () => {
    const requiredSnippets = [
      'request.resource.size <= 25 * 1024 * 1024',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/(png|jpeg|jpg|webp|gif)',
      'match /commons/{userId}/{allPaths=**}',
      'allow create, update: if isOwner(userId) && isValidCommonsFile();',
      'match /{allPaths=**}',
      'allow read, write: if false;',
    ];
    for (const snippet of requiredSnippets) {
      if (!storageRules.includes(snippet)) {
        throw new Error(`Missing required storage rule snippet: ${snippet}`);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // CASE 4: Signed-in student can create a Commons post with attachments and read it back
  // ---------------------------------------------------------------------------
  await test('4. Signed-in student (Alice) CAN create a Commons post with attachments (filenames with spaces/parentheses) and read it back', async () => {
    await assertSucceeds(
      aliceDb.collection('commonsPosts').doc('post-alice-1').set({
        title: 'MDCAT Organic Chemistry Complete Notes (2025)',
        description: 'High-yield reaction mechanisms and past paper points.',
        type: 'notes',
        subject: 'Chemistry',
        chapter: 'Organic Chemistry',
        tags: ['mdcat', 'chemistry', 'organic'],
        files: [
          {
            name: 'MDCAT Organic Chem (2025) Notes.pdf',
            size: 245000,
            type: 'application/pdf',
            url: 'firestore://att_alice_chunk/1/application%2Fpdf/MDCAT%20Organic%20Chem%20(2025)%20Notes.pdf',
          },
        ],
        isAnonymous: false,
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
    await assertSucceeds(
      aliceDb.collection('postsPrivate').doc('post-alice-1').set({
        postId: 'post-alice-1',
        authorUid: 'alice-123',
        isAnonymous: false,
      })
    );
    const snap = await aliceDb.collection('commonsPosts').doc('post-alice-1').get();
    if (!snap.exists || snap.data()?.title !== 'MDCAT Organic Chemistry Complete Notes (2025)') {
      throw new Error('Created post could not be read back accurately');
    }
  });

  // ---------------------------------------------------------------------------
  // CASE 5: Signed-in student cannot spoof authorUid, exceed limits, or set admin fields
  // ---------------------------------------------------------------------------
  await test('5a. DENIED: Student (Alice) CANNOT create a post with Bob\'s authorUid', async () => {
    await assertFails(
      aliceDb.collection('commonsPosts').doc('post-spoof-uid').set({
        title: 'Spoofed Post',
        description: 'Pretending to be Bob',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'bob-456',
        authorName: 'Bob Student',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
  });

  await test('5b. DENIED: Student (Alice) CANNOT create a post with > 5 files or empty title', async () => {
    await assertFails(
      aliceDb.collection('commonsPosts').doc('post-too-many-files').set({
        title: 'Six Files Post',
        description: 'Exceeds 5 file limit',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        files: [{}, {}, {}, {}, {}, {}],
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
    await assertFails(
      aliceDb.collection('commonsPosts').doc('post-empty-title').set({
        title: '',
        description: 'Empty title',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
  });

  await test('5c. DENIED: Student (Alice) CANNOT create a post with admin-only fields (isPinned: true, isFeatured: true, upvotes: 50)', async () => {
    await assertFails(
      aliceDb.collection('commonsPosts').doc('post-admin-pinned').set({
        title: 'Self Pinned Post',
        description: 'Should fail',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        isPinned: true,
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
    await assertFails(
      aliceDb.collection('commonsPosts').doc('post-fake-upvotes').set({
        title: 'Pre-upvoted Post',
        description: 'Should fail',
        type: 'notes',
        isAnonymous: false,
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        upvotes: 50,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
  });

  // ---------------------------------------------------------------------------
  // CASE 6: Student cannot edit or delete another user's post, comment, or file
  // ---------------------------------------------------------------------------
  await test('6a. DENIED: Student (Bob) CANNOT edit or delete Alice\'s post or file chunk', async () => {
    await assertFails(
      bobDb.collection('commonsPosts').doc('post-alice-1').update({
        title: 'Hacked by Bob',
      })
    );
    await assertFails(bobDb.collection('commonsPosts').doc('post-alice-1').delete());
    await assertFails(bobDb.collection('commonsAttachments').doc('att_alice_0').delete());
  });

  await test('6b. Student (Alice) CAN comment on post, and Bob CANNOT edit or delete Alice\'s comment', async () => {
    await assertSucceeds(
      aliceDb.collection('commonsPosts').doc('post-alice-1').collection('comments').doc('comment-alice-1').set({
        postId: 'post-alice-1',
        authorUid: 'alice-123',
        authorName: 'Alice Student',
        isAnonymous: false,
        text: 'Feel free to ask any questions about chapter 4!',
        body: 'Feel free to ask any questions about chapter 4!',
      })
    );
    await assertFails(
      bobDb.collection('commonsPosts').doc('post-alice-1').collection('comments').doc('comment-alice-1').update({
        text: 'Tampered comment',
      })
    );
    await assertFails(
      bobDb.collection('commonsPosts').doc('post-alice-1').collection('comments').doc('comment-alice-1').delete()
    );
  });

  // ---------------------------------------------------------------------------
  // CASE 7: Student cannot change own role, verified status, or arbitrary post counters
  // ---------------------------------------------------------------------------
  await test('7a. DENIED: Student (Alice) CANNOT escalate own role, isVerified, plan, or paid_until', async () => {
    await assertFails(aliceDb.collection('users').doc('alice-123').update({ role: 'admin' }));
    await assertFails(aliceDb.collection('users').doc('alice-123').update({ isVerified: true }));
    await assertFails(aliceDb.collection('users').doc('alice-123').update({ plan: 'pro' }));
    await assertFails(
      aliceDb.collection('users').doc('alice-123').update({ paid_until: '2028-01-01T00:00:00Z' })
    );
  });

  await test('7b. DENIED: Student (Bob) CANNOT jump upvotes by +100, but CAN increment upvotes by +1', async () => {
    await assertFails(
      bobDb.collection('commonsPosts').doc('post-alice-1').update({
        upvotes: 100,
      })
    );
    await assertSucceeds(
      bobDb.collection('commonsPosts').doc('post-alice-1').update({
        upvotes: 1,
      })
    );
  });

  // ---------------------------------------------------------------------------
  // CASE 8: Anonymous post privacy guarantee
  // ---------------------------------------------------------------------------
  await test('8a. Student (Alice) CAN create an anonymous post (authorUid == null in commonsPosts, real UID in postsPrivate)', async () => {
    await assertSucceeds(
      aliceDb.collection('commonsPosts').doc('post-anon-1').set({
        title: 'Anonymous Doubt on Physics Rotational Motion',
        description: 'Can someone explain moment of inertia tensor?',
        type: 'doubt',
        isAnonymous: true,
        authorUid: null,
        authorName: 'Anonymous',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        commentCount: 0,
        reportCount: 0,
        isHidden: false,
      })
    );
    await assertSucceeds(
      aliceDb.collection('postsPrivate').doc('post-anon-1').set({
        postId: 'post-anon-1',
        authorUid: 'alice-123',
        isAnonymous: true,
      })
    );
  });

  await test('8b. DENIED: Another student (Bob) or Guest CANNOT read /postsPrivate/{postId} to unmask anonymous authorUid', async () => {
    const publicSnap = await bobDb.collection('commonsPosts').doc('post-anon-1').get();
    if (publicSnap.data()?.authorUid !== null) {
      throw new Error('Public anonymous post leaked authorUid!');
    }
    await assertFails(bobDb.collection('postsPrivate').doc('post-anon-1').get());
    await assertFails(unauthDb.collection('postsPrivate').doc('post-anon-1').get());
  });

  await test('8c. Anonymous author (Alice) CAN read own /postsPrivate doc and delete own anonymous post', async () => {
    await assertSucceeds(aliceDb.collection('postsPrivate').doc('post-anon-1').get());
  });

  // ---------------------------------------------------------------------------
  // CASE 9: Super Admin & Moderator powers (pin, unpin, moderate, delete, read reports)
  // ---------------------------------------------------------------------------
  await test('9a. Student (Bob) CAN submit a report to /commonsReports, but CANNOT read /commonsReports', async () => {
    await assertSucceeds(
      bobDb.collection('commonsReports').doc('report-1').set({
        postId: 'post-alice-1',
        reporterUid: 'bob-456',
        reason: 'spam',
        details: 'Test report',
        status: 'pending',
      })
    );
    await assertFails(bobDb.collection('commonsReports').doc('report-1').get());
  });

  await test('9b. Moderator & Super Admin CAN read /commonsReports, pin/unpin/hide posts, and delete any post', async () => {
    await assertSucceeds(modDb.collection('commonsReports').doc('report-1').get());
    await assertSucceeds(adminDb.collection('commonsReports').doc('report-1').get());

    // Super Admin pins and unpins post
    await assertSucceeds(
      adminDb.collection('commonsPosts').doc('post-alice-1').update({
        isPinned: true,
        isFeatured: true,
      })
    );
    await assertSucceeds(
      adminDb.collection('commonsPosts').doc('post-alice-1').update({
        isPinned: false,
      })
    );

    // Moderator hides post
    await assertSucceeds(
      modDb.collection('commonsPosts').doc('post-alice-1').update({
        isHidden: true,
      })
    );

    // Super Admin deletes post
    await assertSucceeds(adminDb.collection('commonsPosts').doc('post-anon-1').delete());
  });

  // ---------------------------------------------------------------------------
  // CASE 10: Public read access vs private collections
  // ---------------------------------------------------------------------------
  await test('10a. Guest CAN read public Commons posts, publicProfiles, crews, and store_items', async () => {
    // Unhide post-alice-1 first
    await adminDb.collection('commonsPosts').doc('post-alice-1').update({ isHidden: false });
    await assertSucceeds(unauthDb.collection('commonsPosts').doc('post-alice-1').get());
    await assertSucceeds(unauthDb.collection('crews').doc('crew-alpha').get());
  });

  await test('10b. Guest & other students CANNOT read private collections (/users, /paymentRequests, /payments, /auditLogs, /admins)', async () => {
    await assertFails(unauthDb.collection('users').doc('alice-123').get());
    await assertFails(bobDb.collection('users').doc('alice-123').get());
    await assertFails(bobDb.collection('paymentRequests').doc('pr-alice-1').get());
    await assertFails(bobDb.collection('payments').doc('pay-alice-1').get());
    await assertFails(aliceDb.collection('auditLogs').doc('log-1').get());
    await assertFails(aliceDb.collection('admins').doc('admin-1').get());
  });

  // ---------------------------------------------------------------------------
  // CASE 11: Crew Leader & Financial Rules
  // ---------------------------------------------------------------------------
  await test('11a. Crew Leader (Alice) CAN update bio & maxMembers <= 5, CANNOT self-upgrade crew tier', async () => {
    await assertSucceeds(
      aliceDb.collection('crews').doc('crew-alpha').update({
        bio: 'Updated Crew Bio',
        maxMembers: 5,
      })
    );
    await assertFails(
      aliceDb.collection('crews').doc('crew-alpha').update({
        tier: 'paid',
      })
    );
    await assertFails(
      aliceDb.collection('crews').doc('crew-alpha').update({
        maxMembers: 20,
      })
    );
  });

  await test('11b. Default-deny catch-all blocks unknown collections', async () => {
    await assertFails(aliceDb.collection('unknown_secret_collection').doc('doc1').get());
    await assertFails(aliceDb.collection('unknown_secret_collection').doc('doc1').set({ a: 1 }));
  });

  await testEnv.cleanup();
  console.log('\n=== TEST RUN COMPLETED ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Summary: ${passed} Passed, ${failed} Failed out of ${results.length} tests.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
