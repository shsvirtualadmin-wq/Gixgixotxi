import assert from 'node:assert/strict';
import {
  PLANS,
  KOBANS_PER_PKR,
  REFUND_POLICY_TEXT,
  ANNUAL_SAVINGS_PERCENT,
  computeExtendedProExpiry,
  getProStatusSummary,
} from '../src/config/plans';
import {
  calculateProPurchaseOutcome,
  validateProPaymentRequestInput,
} from '../src/services/proSubscriptionService';
import {
  buildProRequestReceivedStudentEmail,
  buildProRequestReceivedAdminEmail,
  buildProActivatedStudentEmail,
  buildProActivatedAdminEmail,
  buildProRequestRejectedStudentEmail,
  verifyEmailBalanceSanity,
} from '../src/lib/emailTemplates';

console.log('=== Verifying Boardly Pro Plans, Checkout, & Emails ===');

// 0. Verify Single Source of Truth Pricing & Savings Calculation
assert.equal(KOBANS_PER_PKR, 10);
assert.equal(PLANS.pro_monthly.price_pkr, 199);
assert.equal(PLANS.pro_monthly.price_kobans, 1990);
assert.equal(PLANS.pro_monthly.duration_days, 30);

assert.equal(PLANS.pro_annual.price_pkr, 1791);
assert.equal(PLANS.pro_annual.price_kobans, 17910);
assert.equal(PLANS.pro_annual.duration_days, 365);
assert.equal(ANNUAL_SAVINGS_PERCENT, 25);
assert.equal(REFUND_POLICY_TEXT, 'Pro passes are non-refundable once activated.');
console.log('✓ Pricing config & 25% annual savings verified.');

const fixedNowMs = new Date('2026-11-12T12:00:00.000Z').getTime();

// 1. Test 1: Buy monthly Pro with Kobans (-1,990 Kobans, +30 days)
const t1 = calculateProPurchaseOutcome({
  planId: 'pro_monthly',
  currentBalance: 14000,
  currentExpiryRaw: null,
  nowMs: fixedNowMs,
});
assert.equal(t1.priceKobans, 1990);
assert.equal(t1.balanceBefore, 14000);
assert.equal(t1.delta, -1990);
assert.equal(t1.balanceAfter, 12010);
assert.equal(t1.wasExtension, false);
assert.equal(t1.newExpiryMs, fixedNowMs + 30 * 86_400_000);
console.log(
  `✓ Test 1 (Monthly Pro with Kobans): 14,000 - 1,990 = ${t1.balanceAfter.toLocaleString()} Kobans, active until ${t1.newExpiryLabel}`
);

// 2. Test 2: Buy annual Pro with Kobans (-17,910 Kobans, +365 days)
const t2 = calculateProPurchaseOutcome({
  planId: 'pro_annual',
  currentBalance: 25000,
  currentExpiryRaw: null,
  nowMs: fixedNowMs,
});
assert.equal(t2.priceKobans, 17910);
assert.equal(t2.balanceBefore, 25000);
assert.equal(t2.delta, -17910);
assert.equal(t2.balanceAfter, 7090);
assert.equal(t2.wasExtension, false);
assert.equal(t2.newExpiryMs, fixedNowMs + 365 * 86_400_000);
console.log(
  `✓ Test 2 (Annual Pro with Kobans): 25,000 - 17,910 = ${t2.balanceAfter.toLocaleString()} Kobans, active until ${t2.newExpiryLabel}`
);

// 3. Test 3: Buy annual Pro while Pro is already active (extends from existing expiry, never resets!)
const existingFutureExpiryMs = fixedNowMs + 30 * 86_400_000; // e.g. 12 Dec 2026
const t3 = calculateProPurchaseOutcome({
  planId: 'pro_annual',
  currentBalance: 20000,
  currentExpiryRaw: new Date(existingFutureExpiryMs).toISOString(),
  nowMs: fixedNowMs,
});
assert.equal(t3.wasExtension, true);
assert.equal(t3.previousExpiryMs, existingFutureExpiryMs);
assert.equal(t3.newExpiryMs, existingFutureExpiryMs + 365 * 86_400_000);
console.log(
  `✓ Test 3 (Extend active Pro with Annual Pass): extended from ${t3.previousExpiryLabel} to ${t3.newExpiryLabel}`
);

// Verify StatusBanner summary helper
const statusActive = getProStatusSummary(new Date(existingFutureExpiryMs).toISOString(), fixedNowMs);
assert.equal(statusActive.isActive, true);
assert.equal(statusActive.daysLeft, 30);
assert.ok(statusActive.statusText?.includes('30 days left'));

// 4. Test 4: Student with 1,500 Kobans sees "You need 490 more Kobans"
let caughtLowBalance: any = null;
try {
  calculateProPurchaseOutcome({
    planId: 'pro_monthly',
    currentBalance: 1500,
    currentExpiryRaw: null,
    nowMs: fixedNowMs,
  });
} catch (err) {
  caughtLowBalance = err;
}
assert.ok(caughtLowBalance, 'Expected insufficient Kobans error');
assert.equal(caughtLowBalance.code, 'INSUFFICIENT_KOBANS');
assert.equal(caughtLowBalance.neededKobans, 490);
assert.ok(caughtLowBalance.message.includes('You need 490 more Kobans'));
console.log(`✓ Test 4 (1,500 Kobans balance check): "${caughtLowBalance.message}"`);

// 5. Test 5: Submitting a duplicate TID is rejected, and multiple pending requests per student are rejected
let caughtDupTid: any = null;
try {
  validateProPaymentRequestInput({
    uid: 'student_1',
    planId: 'pro_monthly',
    method: 'jazzcash',
    transactionId: 'tid99887766',
    existingStudentPendingRequests: [],
    existingDuplicateTidMatches: [{ id: 'existing_req_1', transactionId: 'TID99887766' }],
  });
} catch (err) {
  caughtDupTid = err;
}
assert.ok(caughtDupTid, 'Expected duplicate TID error');
assert.equal(caughtDupTid.code, 'DUPLICATE_TID');
console.log(`✓ Test 5A (Duplicate TID rejected): "${caughtDupTid.message}"`);

let caughtPendingLock: any = null;
try {
  validateProPaymentRequestInput({
    uid: 'student_1',
    planId: 'pro_monthly',
    method: 'opay',
    transactionId: 'TID11223344',
    existingStudentPendingRequests: [{ id: 'req_pending_1', status: 'pending', requestType: 'pro_pass' }],
    existingDuplicateTidMatches: [],
  });
} catch (err) {
  caughtPendingLock = err;
}
assert.ok(caughtPendingLock, 'Expected pending request lock error');
assert.equal(caughtPendingLock.code, 'PENDING_REQUEST_EXISTS');
console.log(`✓ Test 5B (Second pending Pro request blocked): "${caughtPendingLock.message}"`);

// 6. Test 6: Double-tapping "Pay with Kobans" idempotency simulation
const simulatedLedgerStore = new Map<string, typeof t1>();
function simulateAtomicIdempotentCheckout(idempotencyKey: string, walletObj: { balance: number }) {
  if (simulatedLedgerStore.has(idempotencyKey)) {
    return { alreadyProcessed: true, ...simulatedLedgerStore.get(idempotencyKey)! };
  }
  const outcome = calculateProPurchaseOutcome({
    planId: 'pro_monthly',
    currentBalance: walletObj.balance,
    currentExpiryRaw: null,
    nowMs: fixedNowMs,
  });
  walletObj.balance = outcome.balanceAfter;
  simulatedLedgerStore.set(idempotencyKey, outcome);
  return { alreadyProcessed: false, ...outcome };
}

const mockWallet = { balance: 5000 };
const firstTap = simulateAtomicIdempotentCheckout('pro_chk_double_tap_1', mockWallet);
const secondTap = simulateAtomicIdempotentCheckout('pro_chk_double_tap_1', mockWallet);
assert.equal(firstTap.alreadyProcessed, false);
assert.equal(secondTap.alreadyProcessed, true);
assert.equal(mockWallet.balance, 5000 - 1990); // 3,010 — charged only ONCE!
console.log(
  `✓ Test 6 (Double-tap idempotency): Wallet charged once (5,000 -> ${mockWallet.balance.toLocaleString()} Kobans)`
);

// 7. Test 7: Admin approval / rejection & Email templates verification
const sanityKobanPro = verifyEmailBalanceSanity({
  balanceBefore: t1.balanceBefore,
  delta: t1.delta,
  balanceAfter: t1.balanceAfter,
  context: 'pro_activated:test_1',
});
assert.equal(sanityKobanPro.valid, true);

const studentKobanEmail = buildProActivatedStudentEmail({
  studentName: 'Ayesha Khan',
  planName: t1.planName,
  durationDays: t1.durationDays,
  expiresAtLabel: t1.newExpiryLabel,
  wasExtension: false,
  paidWith: 'kobans',
  kobansSpent: t1.priceKobans,
  balanceBefore: t1.balanceBefore,
  newBalance: t1.balanceAfter,
  transactionId: 'pro_koban_test_1',
});
assert.ok(studentKobanEmail.html.includes('14,000 Kobans'));
assert.ok(studentKobanEmail.html.includes('-1,990 Kobans'));
assert.ok(studentKobanEmail.html.includes('12,010 Kobans'));
assert.ok(studentKobanEmail.html.includes(REFUND_POLICY_TEXT));
assert.ok(studentKobanEmail.html.includes('boardly-logo.png'));

const adminApproveExpiry = computeExtendedProExpiry(
  new Date(existingFutureExpiryMs).toISOString(),
  30,
  fixedNowMs
);
const studentPkrApprovedEmail = buildProActivatedStudentEmail({
  studentName: 'Ayesha Khan',
  planName: 'Boardly Pro, Monthly Pass',
  durationDays: 30,
  expiresAtLabel: adminApproveExpiry.newExpiryLabel,
  wasExtension: adminApproveExpiry.wasAlreadyActive,
  previousExpiryLabel: adminApproveExpiry.previousExpiryLabel,
  paidWith: 'pkr',
  pkrAmount: 199,
  transactionId: 'TID88776655',
});
assert.ok(studentPkrApprovedEmail.html.includes(adminApproveExpiry.newExpiryLabel));
assert.ok(studentPkrApprovedEmail.html.includes('PKR 199'));
assert.ok(studentPkrApprovedEmail.html.includes(REFUND_POLICY_TEXT));

const reqReceivedAdmin = buildProRequestReceivedAdminEmail({
  requestId: 'req_pro_99',
  studentName: 'Ayesha Khan',
  studentEmail: 'ayesha@example.com',
  studentUid: 'uid_ayesha',
  planName: 'Boardly Pro, Monthly Pass',
  durationDays: 30,
  pkrAmount: 199,
  paymentMethod: 'jazzcash',
  transactionId: 'TID88776655',
});
assert.ok(reqReceivedAdmin.html.includes('/admin/payments?type=pro&amp;request_id=req_pro_99'));

const rejectedEmail = buildProRequestRejectedStudentEmail({
  studentName: 'Ayesha Khan',
  planName: 'Boardly Pro, Monthly Pass',
  pkrAmount: 199,
  reason: 'TID did not match any JazzCash ledger entry.',
  transactionId: 'TID88776655',
});
assert.ok(rejectedEmail.html.includes('TID did not match any JazzCash ledger entry.'));
console.log('✓ Test 7 (Admin approval, expiry extension, & Pro emails) verified.');
console.log('=== ALL 7 PRO CHECKOUT & BILLING TESTS PASSED ===');
