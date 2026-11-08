/**
 * Automated Verification Suite for Email Verification Codes (Login 2FA & Sign Up OTP)
 *
 * Tests all 7 required security & functional requirements:
 * 1. Correct password then correct 6-digit code gives access.
 * 2. Correct password, no code, then calling a protected API directly is rejected (403).
 * 3. Wrong code 5 times locks that code. A new code works.
 * 4. An expired code (>10m) is rejected. A reused code is rejected. Older codes invalidated on resend.
 * 5. A new sign up cannot reach the dashboard / protected APIs until verified (both 6-digit code and fallback link).
 * 6. Google sign-in still works immediately with no extra code.
 * 7. The resend cooldown (60s) and hourly limits (5/hour per email and 5/hour per IP) work.
 * + Bonus: Plaintext code is never stored in D1 (only 64-char HMAC-SHA256 hex) and never returned in API JSON.
 */

import assert from 'node:assert/strict';
import {
  InMemoryD1Database,
  type FirestoreStoreAdapter,
  type FirestoreTransactionContext,
  type VerifiedFirebaseToken,
} from '../functions/_utils/firestoreRestAdmin';
import { handleAuthApiRequest } from '../functions/api/auth/[[path]]';
import { handleRewardsApiRequest } from '../functions/api/rewards/[[path]]';

class MockFirestoreStore implements FirestoreStoreAdapter {
  public docs = new Map<string, Record<string, any>>();

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
    const txCtx: FirestoreTransactionContext = {
      getDoc: (p) => this.getDoc(p),
      createDoc: (p, data) => {
        const clean = this.cleanPath(p);
        if (this.docs.has(clean)) throw new Error(`Already exists: ${clean}`);
        this.docs.set(clean, structuredClone(data) as Record<string, any>);
      },
      setDoc: (p, data, merge) => {
        this.setDoc(p, data, merge);
      },
    };
    return fn(txCtx);
  }
}

interface CapturedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  extractedCode: string | null;
  extractedLinkToken: string | null;
}

function extractSixDigitCode(text: string): string | null {
  const m = text.match(/verification code is:\s*(\d{6})/i) || text.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

function extractFallbackLinkToken(text: string): string | null {
  const m = text.match(/[?&]token=([a-f0-9]{64})/i);
  return m ? m[1] : null;
}

async function runEmailVerificationTests() {
  console.log('=== Boardly Email Verification & Login 2FA Security Test Suite ===\n');

  const db = new InMemoryD1Database();
  const store = new MockFirestoreStore();
  const capturedEmails: CapturedEmail[] = [];

  const testTokens: Record<string, VerifiedFirebaseToken> = {
    // Existing verified user logging in with email + password at authTime = 1700001000
    token_login_user: {
      uid: 'uid_login_user',
      email: 'student.login@boardly.pk',
      name: 'Zain Login',
      emailVerified: true,
      authTime: 1700001000,
      iat: 1700001000,
      signInProvider: 'password',
    },
    // New signup user (unverified email, password provider)
    token_signup_user: {
      uid: 'uid_signup_user',
      email: 'new.signup@boardly.pk',
      name: 'Ayesha Signup',
      emailVerified: false,
      authTime: 1700002000,
      iat: 1700002000,
      signInProvider: 'password',
    },
    // New signup user #2 for fallback verification link test
    token_signup_link_user: {
      uid: 'uid_signup_link_user',
      email: 'link.signup@boardly.pk',
      name: 'Bilal Link',
      emailVerified: false,
      authTime: 1700002500,
      iat: 1700002500,
      signInProvider: 'password',
    },
    // Google Sign-In user
    token_google_user: {
      uid: 'uid_google_user',
      email: 'google.student@gmail.com',
      name: 'Sara Google',
      emailVerified: true,
      authTime: 1700003000,
      iat: 1700003000,
      signInProvider: 'google.com',
    },
    // Rate limit test user
    token_ratelimit_user: {
      uid: 'uid_ratelimit_user',
      email: 'ratelimit.student@boardly.pk',
      name: 'Hamza RateLimit',
      emailVerified: true,
      authTime: 1700004000,
      iat: 1700004000,
      signInProvider: 'password',
    },
  };

  // Seed Firestore user profiles
  await store.setDoc('users/uid_login_user', {
    uid: 'uid_login_user',
    email: 'student.login@boardly.pk',
    emailVerified: true,
    coins: 500,
  });
  await store.setDoc('users/uid_signup_user', {
    uid: 'uid_signup_user',
    email: 'new.signup@boardly.pk',
    emailVerified: false,
    coins: 0,
  });
  await store.setDoc('users/uid_signup_link_user', {
    uid: 'uid_signup_link_user',
    email: 'link.signup@boardly.pk',
    emailVerified: false,
    coins: 0,
  });
  await store.setDoc('users/uid_google_user', {
    uid: 'uid_google_user',
    email: 'google.student@gmail.com',
    emailVerified: true,
    coins: 250,
  });

  const tokenVerifier = async (authHeader: string | null | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const key = authHeader.slice(7).trim();
    return testTokens[key] || null;
  };

  const emailSenderOverride = async (msg: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => {
    capturedEmails.push({
      ...msg,
      extractedCode: extractSixDigitCode(msg.text),
      extractedLinkToken: extractFallbackLinkToken(msg.text),
    });
    return { ok: true };
  };

  async function callAuth(params: {
    path: string;
    method?: 'GET' | 'POST';
    token?: string;
    body?: Record<string, unknown>;
    nowMs?: number;
    ip?: string;
  }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (params.token) headers.Authorization = `Bearer ${params.token}`;
    if (params.ip) headers['CF-Connecting-IP'] = params.ip;

    const req = new Request(`https://boardly.cfd${params.path}`, {
      method: params.method || 'GET',
      headers,
      body: params.method === 'POST' ? JSON.stringify(params.body || {}) : undefined,
    });

    const res = await handleAuthApiRequest({
      request: req,
      env: {
        OTP_HMAC_SECRET: 'test-super-secret-hmac-key-2026',
        APP_URL: 'https://boardly.cfd',
      },
      dbOverride: db,
      storeOverride: store,
      tokenVerifierOverride: tokenVerifier,
      nowMsOverride: params.nowMs,
      emailSenderOverride,
    });

    const json = (await res.json()) as Record<string, any>;
    return { status: res.status, json };
  }

  async function callProtectedRewards(params: {
    path: string;
    method?: 'GET' | 'POST';
    token?: string;
    nowMs?: number;
  }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (params.token) headers.Authorization = `Bearer ${params.token}`;

    const req = new Request(`https://boardly.cfd${params.path}`, {
      method: params.method || 'GET',
      headers,
      body: params.method === 'POST' ? JSON.stringify({}) : undefined,
    });

    const res = await handleRewardsApiRequest({
      request: req,
      dbOverride: db,
      storeOverride: store,
      tokenVerifierOverride: tokenVerifier,
      nowMsOverride: params.nowMs,
      bypassRateLimit: true,
    });

    const json = (await res.json()) as Record<string, any>;
    return { status: res.status, json };
  }

  const baseNow = 1700001005000;

  // ─── TEST 2: Correct password, no code -> calling protected API directly is rejected ───
  console.log('Test 2: Calling protected API right after password login (before 6-digit code) is rejected...');
  const statusBeforeCode = await callAuth({
    path: '/api/auth/verification-status',
    token: 'token_login_user',
    nowMs: baseNow,
  });
  assert.equal(statusBeforeCode.status, 200);
  assert.equal(statusBeforeCode.json.verified, false, 'Password login session must be unverified before OTP');
  assert.equal(statusBeforeCode.json.requiredPurpose, 'login');

  const protectedBeforeCode = await callProtectedRewards({
    path: '/api/rewards/state',
    token: 'token_login_user',
    nowMs: baseNow,
  });
  assert.equal(
    protectedBeforeCode.status,
    403,
    'Protected Worker API must reject unverified password login session with HTTP 403'
  );
  assert.equal(protectedBeforeCode.json.code, 'EMAIL_VERIFICATION_REQUIRED');
  console.log('  ✓ Protected API rejected unverified session with 403 EMAIL_VERIFICATION_REQUIRED.\n');

  // ─── TEST 1: Correct password then correct code gives access ────────────────
  console.log('Test 1: Sending 6-digit login code and verifying correct code grants full access...');
  const sendLoginRes = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_login_user',
    body: { purpose: 'login' },
    nowMs: baseNow,
    ip: '203.0.113.10',
  });
  assert.equal(sendLoginRes.status, 200);
  assert.equal(sendLoginRes.json.ok, true);
  assert.equal(sendLoginRes.json.code, undefined, 'API response must NEVER include the plaintext code');

  const lastEmail = capturedEmails[capturedEmails.length - 1];
  assert.ok(lastEmail, 'Resend email must have been dispatched');
  assert.equal(lastEmail.to, 'student.login@boardly.pk');
  assert.ok(lastEmail.extractedCode && /^\d{6}$/.test(lastEmail.extractedCode), 'Email must contain 6-digit code');

  // Verify D1 stores only HMAC-SHA256 hash, never plain text
  const d1CodeQuery = await db
    .prepare(
      'SELECT id, user_id, email_hash, purpose, code_hash, link_token_hash, auth_time, expires_at, attempt_count, used, created_at FROM email_verification_codes WHERE user_id = ?1 AND used = 0 ORDER BY created_at DESC LIMIT 1'
    )
    .bind('uid_login_user')
    .all<{ code_hash: string }>();
  const d1CodeRows = d1CodeQuery.results || [];
  assert.equal(d1CodeRows.length, 1);
  assert.notEqual(d1CodeRows[0].code_hash, lastEmail.extractedCode, 'D1 must never store plain code');
  assert.match(d1CodeRows[0].code_hash, /^[a-f0-9]{64}$/, 'D1 code_hash must be 64-char hex HMAC-SHA256');

  const verifyLoginRes = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: lastEmail.extractedCode, purpose: 'login' },
    nowMs: baseNow + 5000,
  });
  assert.equal(verifyLoginRes.status, 200);
  assert.equal(verifyLoginRes.json.verified, true);

  const statusAfterCode = await callAuth({
    path: '/api/auth/verification-status',
    token: 'token_login_user',
    nowMs: baseNow + 6000,
  });
  assert.equal(statusAfterCode.json.verified, true);
  assert.equal(statusAfterCode.json.requiredPurpose, null);

  const protectedAfterCode = await callProtectedRewards({
    path: '/api/rewards/state',
    token: 'token_login_user',
    nowMs: baseNow + 6000,
  });
  assert.equal(protectedAfterCode.status, 200, 'Protected Worker API must allow access after valid 6-digit code');
  assert.ok(protectedAfterCode.json.daily, 'Rewards state response must include daily progress');
  console.log('  ✓ Correct 6-digit code verified and protected API access granted (HTTP 200).\n');

  // ─── TEST 3: Wrong code 5 times locks that code. A new code works. ──────────
  console.log('Test 3: Entering wrong code 5 times locks that code permanently; a new code works...');
  // Simulate a subsequent login by bumping authTime
  testTokens.token_login_user = {
    ...testTokens.token_login_user,
    authTime: 1700005000,
    iat: 1700005000,
  };
  const lockTestNow = baseNow + 120_000; // +2 mins (past 60s cooldown)

  const sendForLockRes = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_login_user',
    body: { purpose: 'login' },
    nowMs: lockTestNow,
    ip: '203.0.113.11',
  });
  assert.equal(sendForLockRes.status, 200);
  const codeToLock = capturedEmails[capturedEmails.length - 1].extractedCode!;
  const wrongCode = codeToLock === '999999' ? '000000' : '999999';

  for (let attempt = 1; attempt <= 4; attempt++) {
    const wrongRes = await callAuth({
      path: '/api/auth/verify-code',
      method: 'POST',
      token: 'token_login_user',
      body: { code: wrongCode, purpose: 'login' },
      nowMs: lockTestNow + attempt * 1000,
    });
    assert.equal(wrongRes.status, 400);
    assert.equal(wrongRes.json.error, 'Invalid or expired code');
    assert.equal(wrongRes.json.attemptsRemaining, 5 - attempt);
  }

  // 5th wrong attempt must lock the code permanently
  const fifthWrongRes = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: wrongCode, purpose: 'login' },
    nowMs: lockTestNow + 5000,
  });
  assert.equal(fifthWrongRes.status, 400);
  assert.equal(fifthWrongRes.json.code, 'CODE_LOCKED_MAX_ATTEMPTS');
  assert.equal(fifthWrongRes.json.attemptsRemaining, 0);

  // Even submitting the actual code now must fail because it is locked (used = 1)
  const tryCorrectAfterLock = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: codeToLock, purpose: 'login' },
    nowMs: lockTestNow + 6000,
  });
  assert.equal(tryCorrectAfterLock.status, 400);
  assert.equal(tryCorrectAfterLock.json.error, 'Invalid or expired code');

  // Request a new code (after 60s cooldown) and verify it works
  const sendNewAfterLock = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_login_user',
    body: { purpose: 'login' },
    nowMs: lockTestNow + 65_000,
    ip: '203.0.113.11',
  });
  assert.equal(sendNewAfterLock.status, 200);
  const freshCode = capturedEmails[capturedEmails.length - 1].extractedCode!;

  const verifyFreshRes = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: freshCode, purpose: 'login' },
    nowMs: lockTestNow + 66_000,
  });
  assert.equal(verifyFreshRes.status, 200);
  assert.equal(verifyFreshRes.json.verified, true);
  console.log('  ✓ 5 wrong attempts locked the code, rejected subsequent entry, and a newly requested code succeeded.\n');

  // ─── TEST 4: Expired code, reused code, and superseded code are rejected ────
  console.log('Test 4: Testing expired code (>10m), reused code, and older code superseded by resend...');
  // Reused code check: try using `freshCode` a second time
  const reuseRes = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: freshCode, purpose: 'login' },
    nowMs: lockTestNow + 67_000,
  });
  assert.equal(reuseRes.status, 400, 'Reused code must be rejected with HTTP 400');
  assert.equal(reuseRes.json.error, 'Invalid or expired code');

  // Simulate another login to test expiry & superseded code
  testTokens.token_login_user = {
    ...testTokens.token_login_user,
    authTime: 1700009000,
    iat: 1700009000,
  };
  const expTestNow = lockTestNow + 200_000;

  // Send Code A
  const sendCodeA = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_login_user',
    body: { purpose: 'login' },
    nowMs: expTestNow,
    ip: '203.0.113.12',
  });
  assert.equal(sendCodeA.status, 200);
  const codeA = capturedEmails[capturedEmails.length - 1].extractedCode!;

  // Wait 61s and send Code B -> Code A must immediately become invalid
  const sendCodeB = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_login_user',
    body: { purpose: 'login' },
    nowMs: expTestNow + 61_000,
    ip: '203.0.113.12',
  });
  assert.equal(sendCodeB.status, 200);
  const codeB = capturedEmails[capturedEmails.length - 1].extractedCode!;

  const tryOldCodeA = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: codeA, purpose: 'login' },
    nowMs: expTestNow + 62_000,
  });
  assert.equal(tryOldCodeA.status, 400, 'Older code must be invalidated when a new code is sent');
  assert.equal(tryOldCodeA.json.error, 'Invalid or expired code');

  // Wait > 10 minutes (601 seconds) after Code B was sent -> Code B must be expired
  const tryExpiredCodeB = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_login_user',
    body: { code: codeB, purpose: 'login' },
    nowMs: expTestNow + 61_000 + 10 * 60 * 1000 + 1000,
  });
  assert.equal(tryExpiredCodeB.status, 400, 'Code older than 10 minutes must be rejected');
  assert.equal(tryExpiredCodeB.json.error, 'Invalid or expired code');
  console.log('  ✓ Reused code, superseded code, and expired code (>10 mins) all rejected with "Invalid or expired code".\n');

  // ─── TEST 5: New sign up cannot reach dashboard / APIs until verified ───────
  console.log('Test 5: Testing new sign up blocking until verified (both 6-digit code and fallback link)...');
  const signupNow = baseNow + 2_000_000;

  const signupStatus1 = await callAuth({
    path: '/api/auth/verification-status',
    token: 'token_signup_user',
    nowMs: signupNow,
  });
  assert.equal(signupStatus1.json.verified, false);
  assert.equal(signupStatus1.json.requiredPurpose, 'signup');

  const signupProtectedBefore = await callProtectedRewards({
    path: '/api/rewards/state',
    token: 'token_signup_user',
    nowMs: signupNow,
  });
  assert.equal(signupProtectedBefore.status, 403, 'Unverified signup cannot access protected APIs');

  // Send signup verification email
  const sendSignupRes = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_signup_user',
    body: { purpose: 'signup' },
    nowMs: signupNow,
    ip: '203.0.113.20',
  });
  assert.equal(sendSignupRes.status, 200);
  const signupEmail = capturedEmails[capturedEmails.length - 1];
  assert.ok(signupEmail.extractedCode, 'Signup email must include 6-digit code');
  assert.ok(signupEmail.extractedLinkToken, 'Signup email must also include fallback verification link token');

  // Verify with 6-digit code
  const verifySignupCodeRes = await callAuth({
    path: '/api/auth/verify-code',
    method: 'POST',
    token: 'token_signup_user',
    body: { code: signupEmail.extractedCode, purpose: 'signup' },
    nowMs: signupNow + 3000,
  });
  assert.equal(verifySignupCodeRes.status, 200);
  assert.equal(verifySignupCodeRes.json.verified, true);

  // Check Firestore user doc was updated with emailVerified: true
  const signupUserDoc = await store.getDoc('users/uid_signup_user');
  assert.equal(signupUserDoc?.emailVerified, true, 'Firestore users/{uid}.emailVerified must be updated to true');

  const signupProtectedAfter = await callProtectedRewards({
    path: '/api/rewards/state',
    token: 'token_signup_user',
    nowMs: signupNow + 4000,
  });
  assert.equal(signupProtectedAfter.status, 200, 'Verified signup user can now access protected APIs');

  // Also test fallback verification link on `token_signup_link_user`
  await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_signup_link_user',
    body: { purpose: 'signup' },
    nowMs: signupNow + 5000,
    ip: '203.0.113.21',
  });
  const linkSignupEmail = capturedEmails[capturedEmails.length - 1];
  assert.ok(linkSignupEmail.extractedLinkToken);

  const verifyLinkRes = await callAuth({
    path: '/api/auth/verify-link',
    method: 'POST',
    token: 'token_signup_link_user',
    body: { uid: 'uid_signup_link_user', token: linkSignupEmail.extractedLinkToken },
    nowMs: signupNow + 8000,
  });
  assert.equal(verifyLinkRes.status, 200);
  assert.equal(verifyLinkRes.json.verified, true);
  console.log('  ✓ New signups blocked until verified; both 6-digit code and fallback link verification work.\n');

  // ─── TEST 6: Google sign-in works immediately with no extra code ────────────
  console.log('Test 6: Testing Google sign-in works immediately with no extra code...');
  const googleStatus = await callAuth({
    path: '/api/auth/verification-status',
    token: 'token_google_user',
    nowMs: signupNow,
  });
  assert.equal(googleStatus.status, 200);
  assert.equal(googleStatus.json.verified, true, 'Google sign-in must be immediately verified');
  assert.equal(googleStatus.json.requiredPurpose, null, 'Google sign-in must not require OTP');

  const googleProtected = await callProtectedRewards({
    path: '/api/rewards/state',
    token: 'token_google_user',
    nowMs: signupNow,
  });
  assert.equal(googleProtected.status, 200, 'Google sign-in user can immediately call protected APIs');
  console.log('  ✓ Google sign-in bypasses extra OTP step and has immediate protected API access.\n');

  // ─── TEST 7: Resend cooldown (60s) and hourly limits (5/hr per email & IP) ──
  console.log('Test 7: Testing 60-second resend cooldown and 5/hour email & IP rate limits...');
  const rlStart = baseNow + 10_000_000;

  // Send #1 at t = 0s
  const rlSend1 = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_ratelimit_user',
    body: { purpose: 'login' },
    nowMs: rlStart,
    ip: '198.51.100.50',
  });
  assert.equal(rlSend1.status, 200);

  // Immediate resend at t = 15s -> must hit 60-second cooldown
  const rlCooldownHit = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_ratelimit_user',
    body: { purpose: 'login' },
    nowMs: rlStart + 15_000,
    ip: '198.51.100.50',
  });
  assert.equal(rlCooldownHit.status, 429, 'Resend within 60 seconds must return HTTP 429');
  assert.equal(rlCooldownHit.json.code, 'RATE_LIMITED_COOLDOWN');
  assert.equal(rlCooldownHit.json.retryAfterSeconds, 45);

  // Send #2, #3, #4, #5 spaced 65 seconds apart (total 5 emails in < 1 hour)
  for (let i = 2; i <= 5; i++) {
    const res = await callAuth({
      path: '/api/auth/send-code',
      method: 'POST',
      token: 'token_ratelimit_user',
      body: { purpose: 'login' },
      nowMs: rlStart + (i - 1) * 65_000,
      ip: `198.51.100.${50 + i}`, // distinct IPs so we isolate the per-email hourly cap first
    });
    assert.equal(res.status, 200, `Send #${i} within 1 hour should succeed`);
  }

  // Send #6 for the same email within the same hour (after 65s cooldown) -> must hit 5/hour email limit
  const rlEmailCapHit = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_ratelimit_user',
    body: { purpose: 'login' },
    nowMs: rlStart + 5 * 65_000,
    ip: '198.51.100.99',
  });
  assert.equal(rlEmailCapHit.status, 429, '6th email within 1 hour for same email must return HTTP 429');
  assert.equal(rlEmailCapHit.json.code, 'RATE_LIMITED_HOURLY_EMAIL');

  // Now test the 5/hour per-IP limit using a shared IP across different accounts
  const sharedIp = '198.51.100.200';
  for (let i = 1; i <= 5; i++) {
    const tempTokenKey = `token_ip_user_${i}`;
    testTokens[tempTokenKey] = {
      uid: `uid_ip_user_${i}`,
      email: `ipuser${i}@boardly.pk`,
      name: `IP User ${i}`,
      emailVerified: true,
      authTime: 1700010000 + i,
      iat: 1700010000 + i,
      signInProvider: 'password',
    };
    const res = await callAuth({
      path: '/api/auth/send-code',
      method: 'POST',
      token: tempTokenKey,
      body: { purpose: 'login' },
      nowMs: rlStart + i * 1000,
      ip: sharedIp,
    });
    assert.equal(res.status, 200, `IP send #${i} should succeed`);
  }

  // 6th send from `sharedIp` within the same hour -> must hit 5/hour IP limit
  testTokens.token_ip_user_6 = {
    uid: 'uid_ip_user_6',
    email: 'ipuser6@boardly.pk',
    name: 'IP User 6',
    emailVerified: true,
    authTime: 1700010099,
    iat: 1700010099,
    signInProvider: 'password',
  };
  const rlIpCapHit = await callAuth({
    path: '/api/auth/send-code',
    method: 'POST',
    token: 'token_ip_user_6',
    body: { purpose: 'login' },
    nowMs: rlStart + 10_000,
    ip: sharedIp,
  });
  assert.equal(rlIpCapHit.status, 429, '6th email within 1 hour from same IP must return HTTP 429');
  assert.equal(rlIpCapHit.json.code, 'RATE_LIMITED_HOURLY_IP');
  console.log('  ✓ 60s cooldown, 5/hour per-email limit, and 5/hour per-IP limit all enforced.\n');

  console.log('=== ALL 7 EMAIL VERIFICATION & LOGIN 2FA TESTS PASSED! ===');
}

runEmailVerificationTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
