/**
 * Phase 5 Verification Suite for Boardly Rewards (Cloudflare D1 Storage + Firestore Credit)
 *
 * Tests:
 * 1. 30-day check-in schedule, wrap to Day 1 after Day 30, PKT 23:59 vs 00:00 boundary.
 * 2. Super Admin 3-way switch (`POST /api/rewards/admin/mode`):
 *    - Non-admin receives 403.
 *    - "off" blocks everyone; "admin_only" allows Super Admin only; "everyone" allows students.
 * 3. Concurrency test: 5 simultaneous daily claims for the same day in D1 -> 1 credit, 4 HTTP 409s.
 * 4. Failure & Retry test (Claim-First in D1, Credit-Second in Firestore):
 *    - Simulated Firestore failure leaves D1 row `credit_status = 'pending'`.
 *    - Subsequent retry credits Firestore once (`credit_status = 'credited'`) and never twice.
 * 5. Read-Only D1 MCQ Milestones test (50, 100, 250, 500) + zero writes to MCQ tables.
 * 6. Full two-way Referral flow with two non-admin accounts through to +5,000 / +1,000 payout,
 *    plus rejection of self-referral, double attach, wrong code, expired referral, and monthly cap.
 */

import assert from 'node:assert/strict';
import {
  DEFAULT_DAILY_LADDER,
  computeDailyProgressState,
  getPktDateString,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from '../src/lib/rewardsEngine';
import {
  InMemoryD1Database,
  type FirestoreStoreAdapter,
  type FirestoreTransactionContext,
  type VerifiedFirebaseToken,
} from '../functions/_utils/firestoreRestAdmin';
import {
  handleRewardsApiRequest,
  resetRateLimitsForTests,
} from '../functions/api/rewards/[[path]]';

// ─── Mock Transactional Firestore Store (with Failure Injection Support) ─────

class MockFirestoreStore implements FirestoreStoreAdapter {
  public docs = new Map<string, Record<string, any>>();
  public failNextTransactions = 0;
  private txChain: Promise<any> = Promise.resolve();

  private cleanPath(path: string): string {
    return path.replace(/^\/+/, '');
  }

  async getDoc(path: string): Promise<Record<string, any> | null> {
    const d = this.docs.get(this.cleanPath(path));
    return d ? structuredClone(d) : null;
  }

  async setDoc(path: string, data: Record<string, unknown>, merge = false): Promise<void> {
    const clean = this.cleanPath(path);
    const existing = this.docs.get(clean) || {};
    const next = merge ? { ...existing, ...structuredClone(data) } : { ...structuredClone(data) };
    const parts = clean.split('/');
    next._id = parts[parts.length - 1];
    this.docs.set(clean, next);
  }

  async runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      if (this.failNextTransactions > 0) {
        this.failNextTransactions -= 1;
        throw new Error('SIMULATED_FIRESTORE_TRANSIENT_FAILURE');
      }

      const stagedCreates = new Map<string, Record<string, any>>();
      const stagedSets = new Map<string, { data: Record<string, any>; merge: boolean }>();

      const txCtx: FirestoreTransactionContext = {
        getDoc: async (path: string) => {
          const clean = this.cleanPath(path);
          if (stagedCreates.has(clean)) return structuredClone(stagedCreates.get(clean)!);
          if (stagedSets.has(clean)) {
            const s = stagedSets.get(clean)!;
            const base = this.docs.get(clean) || {};
            return structuredClone(s.merge ? { ...base, ...s.data } : s.data);
          }
          const d = this.docs.get(clean);
          return d ? structuredClone(d) : null;
        },
        createDoc: (path: string, data: Record<string, unknown>) => {
          const clean = this.cleanPath(path);
          if (this.docs.has(clean) || stagedCreates.has(clean)) {
            const err = new Error(`Document ALREADY_EXISTS: ${clean}`) as Error & {
              status?: number;
            };
            err.status = 409;
            throw err;
          }
          stagedCreates.set(clean, structuredClone(data) as Record<string, any>);
        },
        setDoc: (path: string, data: Record<string, unknown>, merge = false) => {
          const clean = this.cleanPath(path);
          stagedSets.set(clean, { data: structuredClone(data) as Record<string, any>, merge });
        },
      };

      const res = await fn(txCtx);

      for (const [k, v] of stagedCreates.entries()) {
        const parts = k.split('/');
        this.docs.set(k, { ...v, _id: parts[parts.length - 1] });
      }
      for (const [k, s] of stagedSets.entries()) {
        const parts = k.split('/');
        const existing = this.docs.get(k) || {};
        const next = s.merge ? { ...existing, ...s.data } : { ...s.data };
        next._id = parts[parts.length - 1];
        this.docs.set(k, next);
      }

      return res;
    };

    const nextTx = this.txChain.then(run, run);
    this.txChain = nextTx.catch(() => {});
    return nextTx;
  }
}

const tokenDirectory: Record<string, VerifiedFirebaseToken> = {
  token_alice: {
    uid: 'uid_alice',
    email: 'alice@student.edu.pk',
    name: 'Alice Khan',
    emailVerified: true,
  },
  token_bob: {
    uid: 'uid_bob',
    email: 'bob@student.edu.pk',
    name: 'Bob Ahmed',
    emailVerified: true,
  },
  token_charlie: {
    uid: 'uid_charlie',
    email: 'charlie@student.edu.pk',
    name: 'Charlie Raza',
    emailVerified: true,
  },
  token_superadmin: {
    uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
    email: 'shsvirtualadmin@gmail.com',
    name: 'Super Admin',
    emailVerified: true,
    role: 'superadmin',
  },
};

async function mockTokenVerifier(
  authHeader: string | null | undefined
): Promise<VerifiedFirebaseToken | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const key = authHeader.slice(7).trim();
  return tokenDirectory[key] || null;
}

async function callApi(params: {
  db: InMemoryD1Database;
  store: MockFirestoreStore | null;
  path: string;
  method?: 'GET' | 'POST';
  token?: string;
  body?: Record<string, unknown>;
  nowMs?: number;
  ip?: string;
  bypassRateLimit?: boolean;
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }
  if (params.ip) {
    headers['CF-Connecting-IP'] = params.ip;
  }

  const req = new Request(`https://boardly.cfd${params.path}`, {
    method: params.method || 'GET',
    headers,
    body: params.method === 'POST' ? JSON.stringify(params.body || {}) : undefined,
  });

  const res = await handleRewardsApiRequest({
    request: req,
    dbOverride: params.db,
    storeOverride: params.store,
    tokenVerifierOverride: mockTokenVerifier,
    nowMsOverride: params.nowMs,
    bypassRateLimit: params.bypassRateLimit ?? true,
  });

  const json = (await res.json()) as Record<string, any>;
  return { status: res.status, json };
}

async function runAllTests() {
  console.log('=== Boardly Rewards D1 + Firestore Phase 5 Verification Suite ===\n');

  // ─── 1. Unit Tests: 30-Day Schedule, Wrap, PKT Midnight Boundary ────────────
  console.log('1. Testing 30-day schedule, wrap after Day 30, and PKT 23:59 vs 00:00...');
  assert.equal(DEFAULT_DAILY_LADDER.length, 30);
  const sum30 = DEFAULT_DAILY_LADDER.reduce((a, b) => a + b, 0);
  assert.equal(sum30, 7550, '30-day cycle total must equal 7,550 Kobans');
  assert.equal(DEFAULT_DAILY_LADDER[0], 50);
  assert.equal(DEFAULT_DAILY_LADDER[1], 100);
  assert.equal(DEFAULT_DAILY_LADDER[2], 200);
  assert.equal(DEFAULT_DAILY_LADDER[3], 400);
  assert.equal(DEFAULT_DAILY_LADDER[6], 400);
  assert.equal(DEFAULT_DAILY_LADDER[13], 400);
  assert.equal(DEFAULT_DAILY_LADDER[20], 400);
  assert.equal(DEFAULT_DAILY_LADDER[27], 400);
  assert.equal(DEFAULT_DAILY_LADDER[29], 1000);

  const pkt2359 = Date.UTC(2026, 2, 29, 18, 59, 59); // 2026-03-29 23:59:59 PKT
  const pkt0000 = Date.UTC(2026, 2, 29, 19, 0, 0);   // 2026-03-30 00:00:00 PKT
  assert.equal(getPktDateString(pkt2359), '2026-03-29');
  assert.equal(getPktDateString(pkt0000), '2026-03-30');

  // Wrap after Day 30 -> Day 1
  const after30 = computeDailyProgressState({
    totalClaims: 30,
    lastClaimPktDate: '2026-03-29',
    nowMs: pkt0000,
  });
  assert.equal(after30.nextDayNumber, 1, 'After 30 claims, next day must wrap to Day 1');
  assert.equal(after30.nextRewardAmount, 50);

  assert.equal(normalizeReferralCode('bld-7k9m2p'), 'BLD-7K9M2P');
  assert.equal(isValidReferralCodeFormat('BLD-7K9M2P'), true);
  assert.equal(isValidReferralCodeFormat('BLD-0O1I23'), false);
  console.log('   ✓ Passed 30-day schedule, wrap after Day 30, and PKT boundary tests.\n');

  // ─── 2. Super Admin Mode Switch Tests ("off" | "admin_only" | "everyone") ───
  console.log('2. Testing Super Admin mode switch (403 for non-admin, off / admin_only / everyone)...');
  const db = new InMemoryD1Database();
  const store = new MockFirestoreStore();
  const nowBase = pkt0000;

  // Seed users in D1 user_roles and Firestore users/wallets
  db.tables.user_roles.set('uid_alice', {
    uid: 'uid_alice',
    email: 'alice@student.edu.pk',
    role: 'student',
    custom_role: null,
    is_posting_banned: 0,
    updated_at: nowBase - 60_000,
    created_at: nowBase - 60_000,
  });
  db.tables.user_roles.set('uid_bob', {
    uid: 'uid_bob',
    email: 'bob@student.edu.pk',
    role: 'student',
    custom_role: null,
    is_posting_banned: 0,
    updated_at: nowBase - 60_000,
    created_at: nowBase - 60_000,
  });
  db.tables.user_roles.set('A5YMRimdHRcmeDWutxtUGt2e4hf2', {
    uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
    email: 'shsvirtualadmin@gmail.com',
    role: 'superadmin',
    custom_role: null,
    is_posting_banned: 0,
    updated_at: nowBase - 60_000,
    created_at: nowBase - 60_000,
  });

  await store.setDoc('users/uid_alice', { displayName: 'Alice Khan', kobans: 100 });
  await store.setDoc('wallets/uid_alice', { balance: 100, owned: [] });
  await store.setDoc('users/uid_bob', { displayName: 'Bob Ahmed', kobans: 0 });
  await store.setDoc('wallets/uid_bob', { balance: 0, owned: [] });
  await store.setDoc('users/A5YMRimdHRcmeDWutxtUGt2e4hf2', { displayName: 'Super Admin', kobans: 500 });
  await store.setDoc('wallets/A5YMRimdHRcmeDWutxtUGt2e4hf2', { balance: 500, owned: [] });

  // 2a. Default mode seeded in D1 is 'off' -> nobody can claim
  const stateOffAlice = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_alice',
    nowMs: nowBase,
  });
  assert.equal(stateOffAlice.json.mode, 'off');
  assert.equal(stateOffAlice.json.canClaim, false);

  const claimWhenOff = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_alice',
    nowMs: nowBase,
  });
  assert.equal(claimWhenOff.status, 503, 'Claim when mode=off must return 503');

  // 2b. Non-admin calling POST /api/rewards/admin/mode gets 403
  const nonAdminModeAttempt = await callApi({
    db,
    store,
    path: '/api/rewards/admin/mode',
    method: 'POST',
    token: 'token_alice',
    body: { mode: 'everyone' },
    nowMs: nowBase,
  });
  assert.equal(nonAdminModeAttempt.status, 403, 'Non-admin must get 403 on /api/rewards/admin/mode');
  assert.equal(db.tables.reward_settings.get('mode')?.value, 'off');

  // 2c. Super Admin switches mode to 'admin_only'
  const setAdminOnly = await callApi({
    db,
    store,
    path: '/api/rewards/admin/mode',
    method: 'POST',
    token: 'token_superadmin',
    body: { mode: 'admin_only' },
    nowMs: nowBase,
  });
  assert.equal(setAdminOnly.status, 200);
  assert.equal(setAdminOnly.json.mode, 'admin_only');
  assert.equal(db.tables.reward_settings.get('mode')?.value, 'admin_only');

  // In 'admin_only', Alice still cannot claim (503), but Super Admin CAN claim!
  const aliceClaimInAdminOnly = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_alice',
    nowMs: nowBase,
  });
  assert.equal(aliceClaimInAdminOnly.status, 503);

  const adminClaimInAdminOnly = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_superadmin',
    nowMs: nowBase,
  });
  assert.equal(adminClaimInAdminOnly.status, 200, 'Super Admin can claim in admin_only mode');
  assert.equal(adminClaimInAdminOnly.json.newBalance, 550);

  // 2d. Super Admin switches mode to 'everyone'
  const setEveryone = await callApi({
    db,
    store,
    path: '/api/rewards/admin/mode',
    method: 'POST',
    token: 'token_superadmin',
    body: { mode: 'everyone' },
    nowMs: nowBase,
  });
  assert.equal(setEveryone.status, 200);
  assert.equal(setEveryone.json.mode, 'everyone');
  console.log('   ✓ Passed Super Admin 3-way switch ("off", "admin_only", "everyone") & 403 protection.\n');

  // ─── 3. Concurrency Test: 5 Simultaneous Daily Claims -> 1 Credit ───────────
  console.log('3. Testing 5 simultaneous daily claims in D1 (PRIMARY KEY (uid, pkt_date))...');
  const concurrentResults = await Promise.all(
    Array.from({ length: 5 }, () =>
      callApi({
        db,
        store,
        path: '/api/rewards/daily/claim',
        method: 'POST',
        token: 'token_alice',
        nowMs: nowBase,
      })
    )
  );

  const successes = concurrentResults.filter((r) => r.status === 200);
  const conflicts = concurrentResults.filter((r) => r.status === 409);
  assert.equal(successes.length, 1, 'Exactly 1 of 5 simultaneous claims must succeed');
  assert.equal(conflicts.length, 4, 'Remaining 4 simultaneous claims must return 409');

  const aliceWallet = await store.getDoc('wallets/uid_alice');
  assert.equal(aliceWallet?.balance, 150, 'Alice balance must increment by +50 exactly once (100 -> 150)');
  const aliceDailyRow = db.tables.reward_daily_claims.get('uid_alice::2026-03-30');
  assert.equal(aliceDailyRow?.credit_status, 'credited');
  console.log('   ✓ Passed 5-way concurrency test (1 credit, 4 HTTP 409s).\n');

  // ─── 4. Failure & Retry Test (Claim-First in D1, Credit-Second in Firestore) ─
  console.log('4. Testing Claim-First in D1 + Firestore failure & automatic retry...');
  const nextDayMs = nowBase + 24 * 60 * 60 * 1000; // 2026-03-31 PKT (Day 2 = +100 Kobans)
  store.failNextTransactions = 1; // Inject Firestore failure on the claim's credit step!

  const failedCreditRes = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_alice',
    nowMs: nextDayMs,
  });
  assert.equal(failedCreditRes.status, 502, 'Simulated Firestore failure must return 502 CREDIT_PENDING_RETRY');
  assert.equal(failedCreditRes.json.creditStatus, 'pending');

  // Verify D1 row is saved with credit_status = 'pending' and Firestore balance is still 150
  const pendingRow = db.tables.reward_daily_claims.get('uid_alice::2026-03-31');
  assert.equal(pendingRow?.credit_status, 'pending');
  assert.equal(pendingRow?.amount, 100);
  assert.equal((await store.getDoc('wallets/uid_alice'))?.balance, 150);

  // Now call GET /api/rewards/state -> automatic retry must credit +100 once and mark 'credited'!
  const retryState1 = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_alice',
    nowMs: nextDayMs + 1000,
  });
  assert.equal(retryState1.status, 200);
  assert.equal(retryState1.json.balance, 250, 'Retry must credit Day 2 (+100) -> 250 Kobans');
  assert.equal(db.tables.reward_daily_claims.get('uid_alice::2026-03-31')?.credit_status, 'credited');

  // Call GET /api/rewards/state a second time -> confirm it NEVER double-pays!
  const retryState2 = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_alice',
    nowMs: nextDayMs + 2000,
  });
  assert.equal(retryState2.json.balance, 250, 'Second state call must never double-pay');
  console.log('   ✓ Passed Claim-First / Credit-Second failure & retry test (credited once, never twice).\n');

  // ─── 5. Read-Only D1 MCQ Milestones Test ────────────────────────────────────
  console.log('5. Testing read-only D1 MCQ count & milestone claim...');
  db.tables.test_attempts.set('att_alice_1', {
    id: 'att_alice_1',
    test_id: 'test_1',
    user_uid: 'uid_alice',
    user_name: 'Alice Khan',
    score: 48,
    total_questions: 55,
    created_at: nowBase,
  });
  const attemptsSizeBefore = db.tables.test_attempts.size;
  const answersSizeBefore = db.tables.attempt_answers.size;

  const claimM50 = await callApi({
    db,
    store,
    path: '/api/rewards/milestone/claim',
    method: 'POST',
    token: 'token_alice',
    body: { id: '50' },
    nowMs: nextDayMs,
  });
  assert.equal(claimM50.status, 200);
  assert.equal(claimM50.json.rewardAmount, 100);
  assert.equal(claimM50.json.newBalance, 350);
  assert.equal(db.tables.reward_milestone_claims.get('uid_alice::mcq_50')?.credit_status, 'credited');

  // Duplicate milestone claim must fail with 409
  const dupM50 = await callApi({
    db,
    store,
    path: '/api/rewards/milestone/claim',
    method: 'POST',
    token: 'token_alice',
    body: { id: 'mcq_50' },
    nowMs: nextDayMs,
  });
  assert.equal(dupM50.status, 409);

  // Unreached 100-MCQ milestone must fail with 400
  const unreachedM100 = await callApi({
    db,
    store,
    path: '/api/rewards/milestone/claim',
    method: 'POST',
    token: 'token_alice',
    body: { id: '100' },
    nowMs: nextDayMs,
  });
  assert.equal(unreachedM100.status, 400);

  // Confirm zero writes to D1 MCQ tables
  assert.equal(db.tables.test_attempts.size, attemptsSizeBefore, 'MCQ test_attempts table must have zero writes');
  assert.equal(db.tables.attempt_answers.size, answersSizeBefore, 'MCQ attempt_answers table must have zero writes');
  console.log('   ✓ Passed read-only D1 MCQ milestone tests (zero writes to MCQ tables).\n');

  // ─── 6. Full Two-Way Referral Flow Test (+5,000 Inviter / +1,000 Invitee) ───
  console.log('6. Testing full two-way Referral flow (attach, two-way accept, 20 D1 MCQs -> +5,000 / +1,000)...');
  const aliceState = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_alice',
    nowMs: nextDayMs,
  });
  const aliceCode = aliceState.json.referral.myCode as string;

  const bobStateInitial = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_bob',
    nowMs: nextDayMs,
  });
  const bobCode = bobStateInitial.json.referral.myCode as string;

  // 6a. Self-referral rejected
  const selfRef = await callApi({
    db,
    store,
    path: '/api/rewards/referral/attach',
    method: 'POST',
    token: 'token_alice',
    body: { code: aliceCode },
    nowMs: nextDayMs,
  });
  assert.equal(selfRef.status, 400);
  assert.equal(selfRef.json.code, 'SELF_REFERRAL_FORBIDDEN');

  // 6b. Bob attaches Alice's code
  const attachRes = await callApi({
    db,
    store,
    path: '/api/rewards/referral/attach',
    method: 'POST',
    token: 'token_bob',
    body: { code: aliceCode },
    nowMs: nextDayMs,
    ip: '203.0.113.10',
  });
  assert.equal(attachRes.status, 200);
  const referralId = attachRes.json.referralId as string;

  // 6c. Double attach rejected
  const doubleAttach = await callApi({
    db,
    store,
    path: '/api/rewards/referral/attach',
    method: 'POST',
    token: 'token_bob',
    body: { code: aliceCode },
    nowMs: nextDayMs,
  });
  assert.equal(doubleAttach.status, 409);

  // 6d. Wrong code in accept rejected
  const wrongAccept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_alice',
    body: { referralId, enteredCode: 'BLD-999999' },
    nowMs: nextDayMs,
  });
  assert.equal(wrongAccept.status, 400);
  assert.equal(wrongAccept.json.code, 'CODE_MISMATCH');

  // 6e. Two-way acceptance Step 1: Alice (inviter) enters Bob's code -> inviter_accepted = 1
  const aliceAccept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_alice',
    body: { referralId, enteredCode: bobCode },
    nowMs: nextDayMs,
  });
  assert.equal(aliceAccept.status, 200);
  assert.equal(aliceAccept.json.status, 'pending_confirmation');
  assert.equal(aliceAccept.json.inviterAccepted, true);
  assert.equal(aliceAccept.json.inviteeAccepted, false);

  // 6f. Two-way acceptance Step 2: Bob (invitee) enters Alice's code -> invitee_accepted = 1 -> status = 'confirmed'
  const bobAccept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_bob',
    body: { referralId, enteredCode: aliceCode },
    nowMs: nextDayMs,
  });
  assert.equal(bobAccept.status, 200);
  assert.equal(bobAccept.json.status, 'confirmed');
  assert.equal(bobAccept.json.inviterAccepted, true);
  assert.equal(bobAccept.json.inviteeAccepted, true);
  assert.equal(bobAccept.json.paid, false, 'Not paid yet because Bob has 0 MCQs');

  // 6g. Bob completes 20 MCQs since signup in D1
  db.tables.test_attempts.set('att_bob_1', {
    id: 'att_bob_1',
    test_id: 'test_bob_1',
    user_uid: 'uid_bob',
    user_name: 'Bob Ahmed',
    score: 18,
    total_questions: 22,
    created_at: nextDayMs + 500,
  });

  // Trigger state fetch -> automatic payout of +5,000 to Alice and +1,000 to Bob!
  const aliceAfterBobMcqs = await callApi({
    db,
    store,
    path: '/api/rewards/state',
    token: 'token_alice',
    nowMs: nextDayMs + 1000,
  });
  assert.equal(aliceAfterBobMcqs.json.balance, 5350, 'Alice must receive +5,000 Kobans (350 -> 5,350)');
  assert.equal((await store.getDoc('wallets/uid_bob'))?.balance, 1000, 'Bob must receive +1,000 Kobans (0 -> 1,000)');
  assert.equal(db.tables.referrals.get(referralId)?.status, 'paid');
  assert.equal(db.tables.referrals.get(referralId)?.inviter_credit_status, 'credited');
  assert.equal(db.tables.referrals.get(referralId)?.invitee_credit_status, 'credited');

  // Calling accept or state again must never double-pay
  const repeatAccept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_alice',
    body: { referralId, enteredCode: bobCode },
    nowMs: nextDayMs + 2000,
  });
  assert.equal(repeatAccept.status, 200);
  assert.equal((await store.getDoc('wallets/uid_alice'))?.balance, 5350);
  assert.equal((await store.getDoc('wallets/uid_bob'))?.balance, 1000);

  // 6h. Expired referral test (> 14 days old)
  db.tables.referrals.set('ref_expired_test', {
    id: 'ref_expired_test',
    inviter_uid: 'uid_alice',
    invitee_uid: 'uid_charlie',
    inviter_code: aliceCode,
    invitee_code: 'BLD-234567',
    status: 'pending_confirmation',
    inviter_accepted: 0,
    invitee_accepted: 0,
    ip_hash: '',
    flagged: 0,
    inviter_credit_status: 'pending',
    invitee_credit_status: 'pending',
    created_at: nowBase - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    confirmed_at: null,
    paid_at: null,
  });

  const expiredAccept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_alice',
    body: { referralId: 'ref_expired_test', enteredCode: 'BLD-234567' },
    nowMs: nextDayMs,
  });
  assert.equal(expiredAccept.status, 400);
  assert.equal(expiredAccept.json.code, 'REFERRAL_EXPIRED');

  // 6i. Monthly cap test (10 paid referrals per calendar month -> 11th is held in 'capped')
  for (let i = 2; i <= 10; i++) {
    db.tables.referrals.set(`ref_cap_${i}`, {
      id: `ref_cap_${i}`,
      inviter_uid: 'uid_alice',
      invitee_uid: `uid_friend_${i}`,
      inviter_code: aliceCode,
      invitee_code: `BLD-2345${String(i).padStart(2, '0')}`,
      status: 'paid',
      inviter_accepted: 1,
      invitee_accepted: 1,
      ip_hash: '',
      flagged: 0,
      inviter_credit_status: 'credited',
      invitee_credit_status: 'credited',
      created_at: nextDayMs,
      confirmed_at: nextDayMs,
      paid_at: nextDayMs,
    });
  }
  // Seed 11th referral where invitee Charlie has 25 MCQs
  db.tables.test_attempts.set('att_charlie_1', {
    id: 'att_charlie_1',
    test_id: 'test_c1',
    user_uid: 'uid_charlie_11',
    user_name: 'Charlie 11',
    score: 22,
    total_questions: 25,
    created_at: nextDayMs,
  });
  db.tables.referrals.set('ref_cap_11', {
    id: 'ref_cap_11',
    inviter_uid: 'uid_alice',
    invitee_uid: 'uid_charlie_11',
    inviter_code: aliceCode,
    invitee_code: 'BLD-888888',
    status: 'pending_confirmation',
    inviter_accepted: 0,
    invitee_accepted: 1,
    ip_hash: '',
    flagged: 0,
    inviter_credit_status: 'pending',
    invitee_credit_status: 'pending',
    created_at: nextDayMs,
    confirmed_at: null,
    paid_at: null,
  });

  const cap11Accept = await callApi({
    db,
    store,
    path: '/api/rewards/referral/accept',
    method: 'POST',
    token: 'token_alice',
    body: { referralId: 'ref_cap_11', enteredCode: 'BLD-888888' },
    nowMs: nextDayMs,
  });
  assert.equal(cap11Accept.status, 200);
  assert.equal(cap11Accept.json.status, 'capped', '11th referral in same PKT month must be held in capped status');
  assert.equal(cap11Accept.json.paid, false);
  console.log('   ✓ Passed full two-way Referral flow, monthly cap (10/month), expiry, and anti-abuse tests.\n');

  // ─── 7. Part A4 Fail-Safe, Part A5 Health Check & Part A6 Non-Admin Day 1 Proof ─
  console.log('7. Testing Part A4 fail-safe, Part A5 GET /api/rewards/health, and Part A6 non-admin Day 1 claim...');

  // A5: Non-admin calling GET /api/rewards/health must receive 403
  const healthNonAdmin = await callApi({
    db,
    store,
    path: '/api/rewards/health',
    token: 'token_bob',
    nowMs: nextDayMs,
  });
  assert.equal(healthNonAdmin.status, 403, 'Non-admin must get 403 on GET /api/rewards/health');

  // A5: Super Admin calling GET /api/rewards/health receives 200 ok
  const healthSuperAdmin = await callApi({
    db,
    store,
    path: '/api/rewards/health',
    token: 'token_superadmin',
    nowMs: nextDayMs,
  });
  assert.equal(healthSuperAdmin.status, 200);
  assert.equal(healthSuperAdmin.json.ok, true);
  assert.equal(healthSuperAdmin.json.reason, 'ok');
  assert.equal(healthSuperAdmin.json.targetProjectId, 'gen-lang-client-0365509316');
  assert.equal(
    healthSuperAdmin.json.targetDatabaseId,
    'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712'
  );

  // A4: When Firestore fails with 403 PERMISSION_DENIED on claim, server returns sanitized error + state='server_not_ready'
  await store.setDoc('users/uid_charlie', { displayName: 'Charlie Raza', kobans: 0 });
  await store.setDoc('wallets/uid_charlie', { balance: 0, owned: [] });
  store.failNextTransactions = 1;

  const charlieFailSafeClaim = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_charlie',
    nowMs: nextDayMs,
  });
  assert.equal(charlieFailSafeClaim.status, 502);
  assert.equal(charlieFailSafeClaim.json.state, 'server_not_ready');
  assert.equal(charlieFailSafeClaim.json.comingSoon, true);
  assert.equal(charlieFailSafeClaim.json.canClaim, false);
  assert.equal(charlieFailSafeClaim.json.error, 'Rewards are being set up');
  assert.equal(
    JSON.stringify(charlieFailSafeClaim.json).includes('SIMULATED_FIRESTORE'),
    false,
    'Raw server/Firestore error must never be sent to the browser'
  );

  // A6: Non-admin (Charlie) retries Day 1 claim after server recovery (>= 1500ms later):
  // credits +50 once (0 -> 50) and updates balance; a second claim on the same day is rejected with 409!
  const charlieDay1Success = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_charlie',
    nowMs: nextDayMs + 2500,
  });
  assert.equal(charlieDay1Success.status, 200, 'Non-admin Day 1 claim must succeed once Firestore recovers');
  assert.equal(charlieDay1Success.json.dayNumber, 1);
  assert.equal(charlieDay1Success.json.rewardAmount, 50);
  assert.equal(charlieDay1Success.json.newBalance, 50, 'Day 1 claim must credit +50 once (0 -> 50)');
  assert.equal((await store.getDoc('wallets/uid_charlie'))?.balance, 50);
  assert.equal((await store.getDoc('users/uid_charlie'))?.kobans, 50);

  const charlieDay1Duplicate = await callApi({
    db,
    store,
    path: '/api/rewards/daily/claim',
    method: 'POST',
    token: 'token_charlie',
    nowMs: nextDayMs + 3500,
  });
  assert.equal(charlieDay1Duplicate.status, 409, 'Second Day 1 claim on the same day must be rejected with 409');
  assert.equal(charlieDay1Duplicate.json.code, 'ALREADY_CLAIMED_TODAY');
  assert.equal((await store.getDoc('wallets/uid_charlie'))?.balance, 50, 'Balance must remain 50 after rejected second claim');
  console.log('   ✓ Passed Part A4 fail-safe, Part A5 /api/rewards/health, and Part A6 non-admin Day 1 (+50 once, second claim 409).\n');

  // Reset mode back to 'off' in D1 as default
  await callApi({
    db,
    store,
    path: '/api/rewards/admin/mode',
    method: 'POST',
    token: 'token_superadmin',
    body: { mode: 'off' },
    nowMs: nextDayMs,
  });
  assert.equal(db.tables.reward_settings.get('mode')?.value, 'off');

  console.log('ALL PHASE 5 D1 + FIRESTORE REWARDS TESTS PASSED SUCCESSFULLY!');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
