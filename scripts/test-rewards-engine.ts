/**
 * Automated Verification Suite for Boardly Rewards (Phase 5):
 * 1. Pure Domain Logic Unit Tests (30-day schedule, wrap after day 30, PKT 23:59 vs 00:00 boundary,
 *    resetOnMiss, milestone thresholds, referral state machine, monthly cap, 14-day expiry, code format)
 * 2. Concurrency Test: 5 simultaneous POST /api/rewards/daily/claim requests -> exactly 1 credit
 * 3. Two-Account End-to-End Referral Flow Test (attach -> confirm waiting on MCQs -> 20 MCQs -> +5000/+1000 payout)
 * 4. Unconfigured Secret 503 Check (when FIREBASE_SERVICE_ACCOUNT is absent -> HTTP 503 + comingSoon: true)
 */

import assert from 'node:assert/strict';
import {
  DEFAULT_DAILY_LADDER,
  DEFAULT_REWARDS_CONFIG,
  REFERRAL_ALPHABET,
  computeDailyProgressState,
  computeMilestonesState,
  evaluateReferralResolution,
  generateDeterministicReferralCode,
  getPktDateString,
  getSecondsUntilNextPktMidnight,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from '../src/lib/rewardsEngine';
import {
  handleRewardsApiRequest,
  resetRateLimitsForTests,
} from '../functions/api/rewards/[[path]]';
import type {
  FirestoreStoreAdapter,
  FirestoreTransactionContext,
} from '../functions/_utils/firestoreRestAdmin';

// ─── Atomic In-Memory Transactional Firestore Store for Server Endpoint Tests ─

class InMemoryTransactionalFirestore implements FirestoreStoreAdapter {
  public docs = new Map<string, Record<string, any>>();
  private txLock: Promise<void> = Promise.resolve();

  private clean(path: string): string {
    return path.replace(/^\/+/, '');
  }

  async getDoc(path: string): Promise<Record<string, any> | null> {
    const c = this.clean(path);
    const found = this.docs.get(c);
    if (!found) return null;
    const parts = c.split('/');
    return structuredClone({ ...found, _id: parts[parts.length - 1] });
  }

  async setDoc(path: string, data: Record<string, unknown>, merge = false): Promise<void> {
    const c = this.clean(path);
    const prev = merge ? this.docs.get(c) || {} : {};
    this.docs.set(c, structuredClone({ ...prev, ...data }));
  }

  async queryByField(
    collectionId: string,
    fieldPath: string,
    _op: 'EQUAL',
    value: string | number | boolean,
    limit = 200
  ): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    const prefix = `${collectionId}/`;
    for (const [k, v] of this.docs.entries()) {
      if (k.startsWith(prefix) && k.split('/').length === 2) {
        if (v[fieldPath] === value) {
          const docId = k.slice(prefix.length);
          out.push(structuredClone({ ...v, _id: docId }));
          if (out.length >= limit) break;
        }
      }
    }
    return out;
  }

  async runTransaction<T>(fn: (tx: FirestoreTransactionContext) => Promise<T>): Promise<T> {
    // Serialize transaction commits just like Firestore's optimistic concurrency + precondition check
    const prevLock = this.txLock;
    let releaseLock!: () => void;
    this.txLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await prevLock;
    try {
      const stagedWrites: Array<{
        type: 'create' | 'set' | 'merge';
        path: string;
        data: Record<string, unknown>;
      }> = [];

      const txCtx: FirestoreTransactionContext = {
        getDoc: async (path: string) => this.getDoc(path),
        createDoc: (path: string, data: Record<string, unknown>) => {
          stagedWrites.push({ type: 'create', path: this.clean(path), data });
        },
        setDoc: (path: string, data: Record<string, unknown>, merge = false) => {
          stagedWrites.push({
            type: merge ? 'merge' : 'set',
            path: this.clean(path),
            data,
          });
        },
      };

      const result = await fn(txCtx);

      // Verify all `create` preconditions (`exists: false`)
      for (const w of stagedWrites) {
        if (w.type === 'create' && this.docs.has(w.path)) {
          const err = new Error(`Document already exists: ${w.path}`) as Error & {
            status?: number;
          };
          err.status = 409;
          throw err;
        }
      }

      // Apply all writes atomically
      for (const w of stagedWrites) {
        if (w.type === 'create' || w.type === 'set') {
          this.docs.set(w.path, structuredClone(w.data));
        } else {
          const prev = this.docs.get(w.path) || {};
          this.docs.set(w.path, structuredClone({ ...prev, ...w.data }));
        }
      }

      return result;
    } finally {
      releaseLock();
    }
  }
}

async function runAllTests() {
  console.log('=== Boardly Rewards Verification Suite ===\n');

  // ── 1. 30-Day Schedule & Total Cycle Check ────────────────────────────────
  {
    assert.equal(DEFAULT_DAILY_LADDER.length, 30, 'Ladder must have 30 days');
    assert.equal(DEFAULT_DAILY_LADDER[0], 50, 'Day 1 must be 50');
    assert.equal(DEFAULT_DAILY_LADDER[1], 100, 'Day 2 must be 100');
    assert.equal(DEFAULT_DAILY_LADDER[2], 200, 'Day 3 must be 200');
    assert.equal(DEFAULT_DAILY_LADDER[3], 400, 'Day 4 must be 400');
    for (let d = 5; d <= 29; d++) {
      const expected = [7, 14, 21, 28].includes(d) ? 400 : 200;
      assert.equal(DEFAULT_DAILY_LADDER[d - 1], expected, `Day ${d} must be ${expected}`);
    }
    assert.equal(DEFAULT_DAILY_LADDER[29], 1000, 'Day 30 must be 1000');
    const sum = DEFAULT_DAILY_LADDER.reduce((a, b) => a + b, 0);
    assert.equal(sum, 7550, '30-day cycle total must be exactly 7,550 Kobans');
    console.log('PASS [Unit 1]: 30-day ladder values and 7,550 Kobans total verified.');
  }

  // ── 2. Wrap After Day 30 & Cumulative vs resetOnMiss ──────────────────────
  {
    const nowMs = Date.UTC(2026, 2, 29, 10, 0, 0); // 2026-03-29 15:00 PKT
    const day30State = computeDailyProgressState({
      totalClaims: 29,
      lastClaimPktDate: '2026-03-28',
      nowMs,
      config: DEFAULT_REWARDS_CONFIG,
    });
    assert.equal(day30State.nextDayNumber, 30);
    assert.equal(day30State.nextRewardAmount, 1000);

    const wrapToDay1State = computeDailyProgressState({
      totalClaims: 30,
      lastClaimPktDate: '2026-03-28',
      nowMs,
      config: DEFAULT_REWARDS_CONFIG,
    });
    assert.equal(wrapToDay1State.nextDayNumber, 1, 'After Day 30, cycle must wrap to Day 1');
    assert.equal(wrapToDay1State.nextRewardAmount, 50);

    // Cumulative (resetOnMiss: false) when missing 5 days
    const missedDaysNoReset = computeDailyProgressState({
      totalClaims: 12,
      lastClaimPktDate: '2026-03-20',
      nowMs,
      config: { ...DEFAULT_REWARDS_CONFIG, resetOnMiss: false },
    });
    assert.equal(missedDaysNoReset.nextDayNumber, 13, 'resetOnMiss=false must keep progress at Day 13');
    assert.equal(missedDaysNoReset.wasResetForMiss, false);

    // Reset on miss (resetOnMiss: true) when missing a day
    const missedDaysWithReset = computeDailyProgressState({
      totalClaims: 12,
      streakClaimsSinceReset: 12,
      lastClaimPktDate: '2026-03-20',
      nowMs,
      config: { ...DEFAULT_REWARDS_CONFIG, resetOnMiss: true },
    });
    assert.equal(missedDaysWithReset.nextDayNumber, 1, 'resetOnMiss=true must reset to Day 1');
    assert.equal(missedDaysWithReset.wasResetForMiss, true);
    console.log('PASS [Unit 2]: Wrap after Day 30 and resetOnMiss (false vs true) verified.');
  }

  // ── 3. PKT Day Boundary (23:59:59 PKT vs 00:00:00 PKT) ────────────────────
  {
    // 2026-03-29 23:59:59 PKT = 2026-03-29 18:59:59 UTC
    const justBeforeMidnightPkt = Date.UTC(2026, 2, 29, 18, 59, 59);
    // 2026-03-30 00:00:00 PKT = 2026-03-29 19:00:00 UTC
    const exactMidnightPkt = Date.UTC(2026, 2, 29, 19, 0, 0);

    assert.equal(getPktDateString(justBeforeMidnightPkt), '2026-03-29');
    assert.equal(getSecondsUntilNextPktMidnight(justBeforeMidnightPkt), 1);

    assert.equal(getPktDateString(exactMidnightPkt), '2026-03-30');
    assert.equal(getSecondsUntilNextPktMidnight(exactMidnightPkt), 86400);
    console.log('PASS [Unit 3]: PKT day boundary (23:59:59 PKT vs 00:00:00 PKT) verified.');
  }

  // ── 4. Milestone Thresholds & Eligibility ─────────────────────────────────
  {
    const mState = computeMilestonesState({
      mcqsAnswered: 120,
      claimedIds: { mcq_50: Date.now() },
      config: DEFAULT_REWARDS_CONFIG,
    });
    assert.equal(mState.length, 4);
    assert.equal(mState[0].threshold, 50);
    assert.equal(mState[0].reward, 100);
    assert.equal(mState[0].claimed, true);
    assert.equal(mState[0].eligible, false);

    assert.equal(mState[1].threshold, 100);
    assert.equal(mState[1].reward, 250);
    assert.equal(mState[1].claimed, false);
    assert.equal(mState[1].eligible, true);

    assert.equal(mState[2].threshold, 250);
    assert.equal(mState[2].reward, 500);
    assert.equal(mState[2].eligible, false);

    assert.equal(mState[3].threshold, 500);
    assert.equal(mState[3].reward, 1000);
    assert.equal(mState[3].eligible, false);
    console.log('PASS [Unit 4]: Milestone thresholds (50/100/250/500) and rewards verified.');
  }

  // ── 5. Referral State Machine, Monthly Cap & 14-Day Expiry ────────────────
  {
    // Unambiguous code format check
    for (let i = 0; i < 50; i++) {
      const code = generateDeterministicReferralCode(`user_${i}`, 0);
      assert.ok(isValidReferralCodeFormat(code), `Invalid code format: ${code}`);
      assert.ok(!/[0O1I]/.test(code.slice(4)), `Ambiguous char in code: ${code}`);
    }
    assert.ok(!REFERRAL_ALPHABET.includes('0') && !REFERRAL_ALPHABET.includes('O'));
    assert.ok(!REFERRAL_ALPHABET.includes('1') && !REFERRAL_ALPHABET.includes('I'));
    assert.equal(normalizeReferralCode('bld-7k9m2p'), 'BLD-7K9M2P');

    const createdAtMs = Date.UTC(2026, 2, 1, 0, 0, 0);
    // Code mismatch
    const mismatch = evaluateReferralResolution({
      currentStatus: 'pending_confirmation',
      createdAtMs,
      nowMs: createdAtMs + 1000,
      enteredCode: 'BLD-222222',
      expectedInviteeCode: 'BLD-7K9M2P',
      inviteeMcqsAnswered: 25,
      inviterPaidCountThisMonth: 0,
    });
    assert.equal(mismatch.errorCode, 'CODE_MISMATCH');
    assert.equal(mismatch.shouldPay, false);

    // Expired after 14 days
    const expired = evaluateReferralResolution({
      currentStatus: 'pending_confirmation',
      createdAtMs,
      nowMs: createdAtMs + 15 * 24 * 60 * 60 * 1000,
      enteredCode: 'BLD-7K9M2P',
      expectedInviteeCode: 'BLD-7K9M2P',
      inviteeMcqsAnswered: 25,
      inviterPaidCountThisMonth: 0,
    });
    assert.equal(expired.nextStatus, 'expired');
    assert.equal(expired.shouldPay, false);

    // Waiting on 20 MCQs
    const waitingMcqs = evaluateReferralResolution({
      currentStatus: 'pending_confirmation',
      createdAtMs,
      nowMs: createdAtMs + 3600_000,
      enteredCode: 'BLD-7K9M2P',
      expectedInviteeCode: 'BLD-7K9M2P',
      inviteeMcqsAnswered: 12,
      inviterPaidCountThisMonth: 0,
    });
    assert.equal(waitingMcqs.nextStatus, 'confirmed_waiting_mcqs');
    assert.equal(waitingMcqs.shouldPay, false);

    // Monthly cap of 10 reached
    const capped = evaluateReferralResolution({
      currentStatus: 'confirmed_waiting_mcqs',
      createdAtMs,
      nowMs: createdAtMs + 3600_000,
      expectedInviteeCode: 'BLD-7K9M2P',
      inviteeMcqsAnswered: 20,
      inviterPaidCountThisMonth: 10,
    });
    assert.equal(capped.nextStatus, 'capped');
    assert.equal(capped.shouldPay, false);

    // Ready to pay
    const ready = evaluateReferralResolution({
      currentStatus: 'confirmed_waiting_mcqs',
      createdAtMs,
      nowMs: createdAtMs + 3600_000,
      expectedInviteeCode: 'BLD-7K9M2P',
      inviteeMcqsAnswered: 20,
      inviterPaidCountThisMonth: 9,
    });
    assert.equal(ready.nextStatus, 'completed');
    assert.equal(ready.shouldPay, true);
    console.log(
      'PASS [Unit 5]: Referral state transitions, code format, monthly cap (10), and 14-day expiry verified.'
    );
  }

  // ── 6. Unconfigured Secret Returns HTTP 503 with comingSoon: true ─────────
  {
    const req = new Request('https://boardly.cfd/api/rewards/state', { method: 'GET' });
    const res = await handleRewardsApiRequest({
      request: req,
      env: {}, // No FIREBASE_SERVICE_ACCOUNT
    });
    assert.equal(res.status, 503, 'Unconfigured server must return HTTP 503');
    const data = await res.json();
    assert.equal(data.comingSoon, true);
    assert.equal(data.enabled, false);
    assert.equal(data.code, 'SERVER_NOT_CONFIGURED');
    console.log('PASS [Server 6]: Missing FIREBASE_SERVICE_ACCOUNT returns HTTP 503 with comingSoon=true.');
  }

  // ── 7. Concurrency Test: 5 Simultaneous Daily Claim Requests -> 1 Credit ──
  {
    resetRateLimitsForTests();
    const store = new InMemoryTransactionalFirestore();
    const nowMs = Date.UTC(2026, 2, 29, 12, 0, 0);

    // Enable rewards in config/rewards and seed user
    await store.setDoc('config/rewards', {
      ...DEFAULT_REWARDS_CONFIG,
      enabled: true,
    });
    await store.setDoc('users/student_concurrent', {
      uid: 'student_concurrent',
      displayName: 'Zainab Ahmed',
      kobans: 100,
      kobanBalance: 100,
      emailVerified: true,
    });
    await store.setDoc('wallets/student_concurrent', {
      balance: 100,
      owned: [],
    });

    const fireClaim = () =>
      handleRewardsApiRequest({
        request: new Request('https://boardly.cfd/api/rewards/daily/claim', {
          method: 'POST',
          headers: { Authorization: 'Bearer mock_token_concurrent' },
          body: JSON.stringify({}),
        }),
        storeOverride: store,
        tokenVerifierOverride: async () => ({
          uid: 'student_concurrent',
          name: 'Zainab Ahmed',
          emailVerified: true,
        }),
        nowMsOverride: nowMs,
        bypassRateLimit: true, // Allow all 5 requests to hit the transaction simultaneously
      });

    const responses = await Promise.all([
      fireClaim(),
      fireClaim(),
      fireClaim(),
      fireClaim(),
      fireClaim(),
    ]);

    const statuses = responses.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 200).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    assert.equal(successCount, 1, `Expected exactly 1 HTTP 200, got ${statuses.join(', ')}`);
    assert.equal(conflictCount, 4, `Expected 4 HTTP 409 conflicts, got ${statuses.join(', ')}`);

    const walletAfter = await store.getDoc('wallets/student_concurrent');
    const userAfter = await store.getDoc('users/student_concurrent');
    assert.equal(walletAfter?.balance, 150, 'Wallet balance must be incremented once (+50 -> 150)');
    assert.equal(userAfter?.kobans, 150, 'User mirrored kobans must be 150');

    console.log(
      'PASS [Concurrency 7]: 5 simultaneous daily claim requests produced exactly 1 credit (+50 Kobans) and 4 idempotent 409 rejections.'
    );
  }

  // ── 8. Two-Account End-to-End Referral Flow (Alice invites Bob) ───────────
  {
    resetRateLimitsForTests();
    const store = new InMemoryTransactionalFirestore();
    const nowMs = Date.UTC(2026, 2, 29, 12, 0, 0);

    await store.setDoc('config/rewards', {
      ...DEFAULT_REWARDS_CONFIG,
      enabled: true,
    });

    // Seed Alice (inviter, account 5 days old)
    await store.setDoc('users/uid_alice', {
      uid: 'uid_alice',
      displayName: 'Alice Khan',
      email: 'alice@example.com',
      emailVerified: true,
      createdAt: new Date(nowMs - 5 * 86400_000).toISOString(),
      kobans: 500,
      kobanBalance: 500,
    });
    await store.setDoc('wallets/uid_alice', { balance: 500, owned: [] });

    // Seed Bob (invitee, account 1 hour old)
    await store.setDoc('users/uid_bob', {
      uid: 'uid_bob',
      displayName: 'Bob Raza',
      email: 'bob@example.com',
      emailVerified: true,
      createdAt: new Date(nowMs - 3600_000).toISOString(),
      kobans: 0,
      kobanBalance: 0,
    });
    await store.setDoc('wallets/uid_bob', { balance: 0, owned: [] });

    const mockVerifier = async (hdr: string | null | undefined) => {
      if (hdr === 'Bearer token_alice') {
        return { uid: 'uid_alice', name: 'Alice Khan', emailVerified: true };
      }
      if (hdr === 'Bearer token_bob') {
        return { uid: 'uid_bob', name: 'Bob Raza', emailVerified: true };
      }
      return null;
    };

    // 1. Alice fetches /api/rewards/state to get her referral code
    const aliceStateRes1 = await handleRewardsApiRequest({
      request: new Request('https://boardly.cfd/api/rewards/state', {
        method: 'GET',
        headers: { Authorization: 'Bearer token_alice' },
      }),
      storeOverride: store,
      tokenVerifierOverride: mockVerifier,
      nowMsOverride: nowMs,
      bypassRateLimit: true,
    });
    const aliceState1 = await aliceStateRes1.json();
    const aliceCode = aliceState1.referral.myCode;
    assert.ok(isValidReferralCodeFormat(aliceCode));

    // 2. Bob attaches Alice's code
    const attachRes = await handleRewardsApiRequest({
      request: new Request('https://boardly.cfd/api/rewards/referral/attach', {
        method: 'POST',
        headers: { Authorization: 'Bearer token_bob' },
        body: JSON.stringify({ code: aliceCode }),
      }),
      storeOverride: store,
      tokenVerifierOverride: mockVerifier,
      nowMsOverride: nowMs + 2000,
      bypassRateLimit: true,
    });
    assert.equal(attachRes.status, 200);
    const attachData = await attachRes.json();
    assert.equal(attachData.status, 'pending_confirmation');
    const bobCode = attachData.inviteeCode;
    const referralId = attachData.referralId;

    // 3. Alice confirms Bob's code before Bob has completed 20 MCQs
    const acceptRes1 = await handleRewardsApiRequest({
      request: new Request('https://boardly.cfd/api/rewards/referral/accept', {
        method: 'POST',
        headers: { Authorization: 'Bearer token_alice' },
        body: JSON.stringify({ referralId, enteredCode: bobCode }),
      }),
      storeOverride: store,
      tokenVerifierOverride: mockVerifier,
      nowMsOverride: nowMs + 4000,
      bypassRateLimit: true,
    });
    assert.equal(acceptRes1.status, 200);
    const acceptData1 = await acceptRes1.json();
    assert.equal(acceptData1.status, 'confirmed_waiting_mcqs');
    assert.equal(acceptData1.paid, false);

    // 4. Bob completes a practice test with 22 answered MCQs
    await store.setDoc('attempts/att_bob_1', {
      id: 'att_bob_1',
      userId: 'uid_bob',
      status: 'completed',
      totalQuestions: 25,
      correctAnswers: 18,
      wrongAnswers: 4,
      unanswered: 3,
    });

    // 5. Alice loads /api/rewards/state -> auto-completes confirmed referral and credits both!
    const aliceStateRes2 = await handleRewardsApiRequest({
      request: new Request('https://boardly.cfd/api/rewards/state', {
        method: 'GET',
        headers: { Authorization: 'Bearer token_alice' },
      }),
      storeOverride: store,
      tokenVerifierOverride: mockVerifier,
      nowMsOverride: nowMs + 6000,
      bypassRateLimit: true,
    });
    const aliceState2 = await aliceStateRes2.json();
    assert.equal(aliceState2.balance, 5500, 'Alice must have 500 + 5000 = 5500 Kobans');
    assert.equal(aliceState2.referral.items[0].status, 'completed');
    // Verify no email was leaked in referral items
    assert.ok(
      !JSON.stringify(aliceState2.referral.items).includes('bob@example.com'),
      'Invitee email must never be returned in referral items'
    );

    const bobWalletAfter = await store.getDoc('wallets/uid_bob');
    assert.equal(bobWalletAfter?.balance, 1000, 'Bob must have 0 + 1000 = 1000 Kobans');

    console.log(
      'PASS [Referral E2E 8]: Two-account referral flow (attach -> confirm -> 20 MCQs -> +5000 inviter / +1000 invitee) verified.'
    );
  }

  console.log('\nALL 8 REWARDS TEST SUITES PASSED SUCCESSFULLY.');
}

runAllTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
