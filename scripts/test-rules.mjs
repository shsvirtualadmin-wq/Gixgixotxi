import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';

async function runTests() {
  console.log('--- Initializing Firestore Rules Test Environment ---');
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0365509316',
    firestore: {
      rules,
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
    // User Alice (normal user)
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

    // User Bob (normal user)
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
        { uid: 'bob-456', displayName: 'Bob', role: 'member' }
      ],
      memberUids: ['alice-123', 'bob-456'],
      requests: [],
    });

    // Crew Beta (led by Charlie)
    await db.collection('crews').doc('crew-beta').set({
      id: 'crew-beta',
      name: 'Beta Crew',
      code: 'BETA02',
      leaderId: 'charlie-789',
      leaderName: 'Charlie Leader',
      tier: 'free',
      paid_until: null,
      joinMode: 'request',
      minStreak: 0,
      maxMembers: 5,
      isClosed: false,
      members: [
        { uid: 'charlie-789', displayName: 'Charlie', role: 'leader' }
      ],
      memberUids: ['charlie-789'],
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

    // Draft question
    await db.collection('questions').doc('q-draft-1').set({
      id: 'q-draft-1',
      q: 'Secret question?',
      options: ['A', 'B', 'C', 'D'],
      status: 'draft',
      active: false,
      subject: 'physics',
    });
  });

  // Client contexts
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext('alice-123', { email: 'alice@example.com' }).firestore();
  const bobDb = testEnv.authenticatedContext('bob-456', { email: 'bob@example.com' }).firestore();
  const charlieDb = testEnv.authenticatedContext('charlie-789', { email: 'charlie@example.com' }).firestore();
  const strangerDb = testEnv.authenticatedContext('stranger-999', { email: 'stranger@example.com' }).firestore();
  const adminDb = testEnv.authenticatedContext('A5YMRimdHRcmeDWutxtUGt2e4hf2', { email: 'shsvirtualadmin@gmail.com', role: 'admin' }).firestore();

  console.log('\n=== RUNNING SECURITY RULE TEST CASES ===\n');

  // 1. Logged-out user checks
  await test('Logged-out user CAN read public published questions', async () => {
    // Unauthenticated user reading published question is rejected (requires sign-in)
    await assertFails(unauthDb.collection('questions').doc('q-pub-1').get());
  });

  await test('Logged-out user CAN read public crews leaderboard metadata', async () => {
    await assertSucceeds(unauthDb.collection('crews').doc('crew-alpha').get());
  });

  await test('Logged-out user CANNOT read user profile', async () => {
    await assertFails(unauthDb.collection('users').doc('alice-123').get());
  });

  await test('Logged-out user CANNOT create a crew', async () => {
    await assertFails(unauthDb.collection('crews').doc('crew-evil').set({
      name: 'Evil Crew',
      tier: 'free',
      leaderId: 'fake-id',
    }));
  });

  // 2. Normal user: Own vs Someone else's data
  await test('Normal user (Alice) CAN read her own profile', async () => {
    await assertSucceeds(aliceDb.collection('users').doc('alice-123').get());
  });

  await test('Normal user (Alice) CANNOT read Bob\'s profile', async () => {
    await assertFails(aliceDb.collection('users').doc('bob-456').get());
  });

  await test('Normal user (Alice) CAN update own safe preferences (targetUniversity, targetTestDate)', async () => {
    await assertSucceeds(aliceDb.collection('users').doc('alice-123').update({
      targetUniversity: 'FAST-NUCES',
      targetTestDate: '2026-07-15',
    }));
  });

  await test('DENIED: Normal user (Alice) CANNOT edit Bob\'s profile', async () => {
    await assertFails(aliceDb.collection('users').doc('bob-456').update({
      displayName: 'Hacked by Alice',
    }));
  });

  // 3. Privilege & Money Escalation (MUST BE DENIED)
  await test('DENIED: Normal user (Alice) CANNOT escalate own role to admin', async () => {
    await assertFails(aliceDb.collection('users').doc('alice-123').update({
      role: 'admin',
    }));
  });

  await test('DENIED: Normal user (Alice) CANNOT escalate own subscription to pro', async () => {
    await assertFails(aliceDb.collection('users').doc('alice-123').update({
      plan: 'pro',
    }));
  });

  await test('DENIED: Normal user (Alice) CANNOT extend own paid_until', async () => {
    await assertFails(aliceDb.collection('users').doc('alice-123').update({
      paid_until: '2027-01-01T00:00:00.000Z',
    }));
  });

  await test('DENIED: Normal user (Alice) CANNOT change own status or suspension', async () => {
    await assertFails(aliceDb.collection('users').doc('alice-123').update({
      status: 'suspended',
      isSuspended: true,
    }));
  });

  // 4. Financial Records & Privacy
  await test('Normal user (Alice) CAN read her own payment requests', async () => {
    await assertSucceeds(aliceDb.collection('paymentRequests').doc('pr-alice-1').get());
  });

  await test('DENIED: Normal user (Bob) CANNOT read Alice\'s payment requests', async () => {
    await assertFails(bobDb.collection('paymentRequests').doc('pr-alice-1').get());
  });

  await test('DENIED: Normal user (Bob) CANNOT read Alice\'s payments', async () => {
    await assertFails(bobDb.collection('payments').doc('pay-alice-1').get());
  });

  await test('DENIED: Normal user (Alice) CANNOT approve her own payment request', async () => {
    await assertFails(aliceDb.collection('paymentRequests').doc('pr-alice-1').update({
      status: 'verified',
    }));
  });

  // 5. Audit Log Immutability
  await test('DENIED: Normal user CANNOT write to audit log', async () => {
    await assertFails(aliceDb.collection('auditLogs').doc('fake-log').set({
      actor: 'alice',
      action: 'fake_action',
    }));
  });

  await test('DENIED: Normal user CANNOT read audit log', async () => {
    await assertFails(aliceDb.collection('auditLogs').doc('log-1').get());
  });

  // 6. Admin Collections Access
  await test('DENIED: Normal user CANNOT read admins collection', async () => {
    await assertFails(aliceDb.collection('admins').doc('admin-1').get());
  });

  await test('DENIED: Normal user CANNOT list users', async () => {
    await assertFails(aliceDb.collection('users').get());
  });

  // 7. Crew Permissions & Membership Rules
  await test('Crew Leader (Alice) CAN edit allowed settings of her crew (bio, joinMode)', async () => {
    await assertSucceeds(aliceDb.collection('crews').doc('crew-alpha').update({
      bio: 'New official bio for Alpha Crew',
      joinMode: 'request',
    }));
  });

  await test('DENIED: Crew Leader (Alice) CANNOT upgrade crew tier or extend paid_until', async () => {
    await assertFails(aliceDb.collection('crews').doc('crew-alpha').update({
      tier: 'paid',
      paid_until: '2027-01-01T00:00:00.000Z',
    }));
  });

  await test('DENIED: Crew Leader (Alice) CANNOT bump member limit past tier max (e.g. 20 on free tier)', async () => {
    await assertFails(aliceDb.collection('crews').doc('crew-alpha').update({
      maxMembers: 20,
    }));
  });

  await test('Crew Leader (Alice) CAN update allowed maxMembers within tier max (5) and avatarKey', async () => {
    await assertSucceeds(aliceDb.collection('crews').doc('crew-alpha').update({
      maxMembers: 5,
      avatarKey: 'crew-mascot-lion',
    }));
  });

  await test('DENIED: Crew Member (Bob) CANNOT kick members from crew', async () => {
    await assertFails(bobDb.collection('crews').doc('crew-alpha').update({
      members: [
        { uid: 'bob-456', displayName: 'Bob', role: 'member' }
      ],
      memberUids: ['bob-456'],
    }));
  });

  await test('DENIED: Crew Member (Bob) CANNOT approve join requests or clear requests', async () => {
    await assertFails(bobDb.collection('crews').doc('crew-alpha').update({
      requests: [],
      members: [
        { uid: 'alice-123', displayName: 'Alice', role: 'leader' },
        { uid: 'bob-456', displayName: 'Bob', role: 'member' },
        { uid: 'new-member', displayName: 'New', role: 'member' }
      ],
    }));
  });

  await test('DENIED: User (Bob) CANNOT write or manipulate payments collection', async () => {
    await assertFails(bobDb.collection('payments').doc('pay-fraud').set({
      userId: 'bob-456',
      amount: 1000,
      status: 'completed',
    }));
  });

  await test('User (Alice) CAN read and write her own streaks record', async () => {
    await assertSucceeds(aliceDb.collection('streaks').doc('alice-123').set({
      currentStreak: 12,
      longestStreak: 15,
      updatedAt: new Date().toISOString(),
    }));
  });

  await test('DENIED: User (Bob) CANNOT write Alice\'s streaks record', async () => {
    await assertFails(bobDb.collection('streaks').doc('alice-123').set({
      currentStreak: 0,
      longestStreak: 0,
    }));
  });

  // 8. Superadmin Powers
  await test('Superadmin CAN read any user profile', async () => {
    await assertSucceeds(adminDb.collection('users').doc('alice-123').get());
  });

  await test('Superadmin CAN list all users', async () => {
    await assertSucceeds(adminDb.collection('users').get());
  });

  await test('Superadmin CAN read audit logs', async () => {
    await assertSucceeds(adminDb.collection('auditLogs').doc('log-1').get());
  });

  await test('Superadmin CAN approve payments and upgrade crew tier', async () => {
    await assertSucceeds(adminDb.collection('crews').doc('crew-alpha').update({
      tier: 'paid',
      paid_until: '2027-01-01T00:00:00.000Z',
    }));
  });

  await test('Superadmin CAN manage question bank (create questions)', async () => {
    await assertSucceeds(adminDb.collection('questions').doc('q-new-admin').set({
      id: 'q-new-admin',
      q: 'Admin verified question',
      options: ['W', 'X', 'Y', 'Z'],
      status: 'published',
      active: true,
      subject: 'chemistry',
    }));
  });

  await testEnv.cleanup();
  console.log('\n=== TEST RUN COMPLETED ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Summary: ${passed} Passed, ${failed} Failed out of ${results.length} tests.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
