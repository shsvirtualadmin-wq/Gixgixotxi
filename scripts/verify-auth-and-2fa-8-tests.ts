import assert from 'node:assert/strict';
import { handleAuthApiRequest } from '../functions/api/auth/[[path]]';
import {
  InMemoryD1Database,
  isD1UserSessionVerified,
} from '../functions/_utils/firestoreRestAdmin';
import { generateTotpCodeForStep } from '../functions/_utils/twoFactorCrypto';

const generateTotpCode = (secret: string, nowMs: number) =>
  generateTotpCodeForStep(secret, Math.floor(nowMs / 30000));

interface CapturedEmail {
  to: string;
  subject: string;
  code?: string;
  verifyLinkUrl?: string;
  purpose: string;
}

async function runTests() {
  const db = new InMemoryD1Database();
  const env = {
    DB: db,
    OTP_HMAC_SECRET: 'test-worker-hmac-secret-key-2026',
    TOTP_ENCRYPTION_KEY: 'test-worker-totp-aes-gcm-secret-key-2026',
    RESEND_API_KEY: 're_test_key',
  };

  const sentEmails: CapturedEmail[] = [];
  const userPasswords: Record<string, string> = {
    'student1@example.com': 'CorrectHorseBatteryStaple1!',
    'admin@boardly.cfd': 'AdminPassword123!',
  };

  let currentTokens: Record<
    string,
    {
      uid: string;
      email: string;
      emailVerified: boolean;
      name: string;
      signInProvider: string;
      authTime: number;
      iat: number;
    }
  > = {};

  let nowMs = 1_760_000_000_000;

  const callAuth = async (
    path: string,
    options: {
      method?: string;
      tokenKey?: string;
      body?: Record<string, unknown>;
      cookie?: string;
      trustedDeviceHeader?: string;
      ip?: string;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': options.ip || '203.0.113.10',
    };
    if (options.tokenKey) {
      headers['Authorization'] = `Bearer ${options.tokenKey}`;
    }
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }
    if (options.trustedDeviceHeader) {
      headers['X-Trusted-Device'] = options.trustedDeviceHeader;
    }

    const req = new Request(`https://boardly.cfd${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const res = await handleAuthApiRequest({
      request: req,
      env,
      nowMsOverride: nowMs,
      tokenVerifierOverride: async (authHeader) => {
        const key = String(authHeader || '').replace(/^Bearer\s+/i, '').trim();
        return currentTokens[key] || null;
      },
      emailSenderOverride: async (payload: any) => {
        const textStr = String(payload.text || '');
        const codeMatch = textStr.match(/code is:\s*(\d{6})/i);
        const linkMatch = textStr.match(/(https?:\/\/[^\s]+\/verify-email\?token=[^\s]+)/i);
        sentEmails.push({
          to: payload.to,
          subject: payload.subject,
          code: payload.code || (codeMatch ? codeMatch[1] : undefined),
          verifyLinkUrl: payload.verifyLinkUrl || (linkMatch ? linkMatch[1] : undefined),
          purpose: payload.purpose,
        });
        return { ok: true, id: `email_${sentEmails.length}` };
      },
      passwordVerifierOverride: async (email, password) => {
        return userPasswords[email.toLowerCase()] === password;
      },
    });

    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, json };
  };

  console.log('==============================================================');
  console.log('RUNNING ALL 8 REQUIRED AUTH & 2FA SERVER VERIFICATION TESTS');
  console.log('==============================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Sign up with email -> blocked until verified -> enter valid 6-digit
  //         code -> reaches dashboard -> log out -> log in again with
  //         email + password -> goes straight in, no code asked.
  // ───────────────────────────────────────────────────────────────────────────
  currentTokens['user1_signup'] = {
    uid: 'uid_student_1',
    email: 'student1@example.com',
    emailVerified: false,
    name: 'Ahmed Khan',
    signInProvider: 'password',
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };

  // Register username at sign-up (marks email_verified = 0)
  const regRes = await callAuth('/api/auth/username-register', {
    method: 'POST',
    tokenKey: 'user1_signup',
    body: {
      uid: 'uid_student_1',
      username: 'ahmed_khan1',
      email: 'student1@example.com',
      accountType: 'registered',
    },
  });
  assert.equal(regRes.status, 200);

  // Check verification status right after sign-up -> must be blocked (verified: false, requiredPurpose: 'signup')
  const statusAfterSignup = await callAuth('/api/auth/verification-status', {
    method: 'GET',
    tokenKey: 'user1_signup',
  });
  assert.equal(statusAfterSignup.json.verified, false);
  assert.equal(statusAfterSignup.json.requiredPurpose, 'signup');

  // Protected API check before email verification -> must be rejected (false)
  const sessionVerifiedBeforeOtp = await isD1UserSessionVerified(
    db,
    currentTokens['user1_signup'],
    { nowMs }
  );
  assert.equal(sessionVerifiedBeforeOtp, false, 'Unverified email signup user must be blocked on protected APIs');

  // Send 6-digit signup verification code via Resend (also includes fallback link)
  const sendSignupRes = await callAuth('/api/auth/send-code', {
    method: 'POST',
    tokenKey: 'user1_signup',
    body: { purpose: 'signup' },
  });
  assert.equal(sendSignupRes.status, 200);
  const signupEmail = sentEmails[sentEmails.length - 1];
  assert.ok(signupEmail && /^\d{6}$/.test(signupEmail.code || ''), '6-digit code sent');
  assert.ok(signupEmail.verifyLinkUrl?.includes('/verify-email?token='), 'Fallback verify link included');

  // Enter valid 6-digit code -> reaches dashboard
  const verifySignupRes = await callAuth('/api/auth/verify-code', {
    method: 'POST',
    tokenKey: 'user1_signup',
    body: { code: signupEmail.code, purpose: 'signup' },
  });
  assert.equal(verifySignupRes.status, 200);
  assert.equal(verifySignupRes.json.verified, true);

  const sessionVerifiedAfterOtp = await isD1UserSessionVerified(
    db,
    currentTokens['user1_signup'],
    { nowMs }
  );
  assert.equal(sessionVerifiedAfterOtp, true, 'Verified user reaches dashboard');

  // Log out -> log in again with a new authTime (normal login, 2FA is OFF) -> goes straight in, NO code asked!
  nowMs += 120_000;
  currentTokens['user1_login2'] = {
    ...currentTokens['user1_signup'],
    emailVerified: true,
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };
  const emailsBeforeLogin2 = sentEmails.length;
  const statusLogin2 = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login2',
  });
  assert.equal(statusLogin2.json.verified, true, 'Normal login goes straight in without asking for any code');
  assert.equal(statusLogin2.json.requiredPurpose, null);
  assert.equal(sentEmails.length, emailsBeforeLogin2, 'No OTP email sent on normal login');
  console.log('PASS [Test 1]: Sign up with email -> blocked until verified -> valid 6-digit code -> reaches dashboard -> re-login goes straight in with no code asked.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Turn on email two-step in Settings -> log out -> log in -> asked
  //         for email code -> enter code -> in.
  // ───────────────────────────────────────────────────────────────────────────
  const enableEmail2faRes = await callAuth('/api/auth/2fa/email/toggle', {
    method: 'POST',
    tokenKey: 'user1_login2',
    body: {
      enabled: true,
      currentPassword: 'CorrectHorseBatteryStaple1!',
    },
  });
  assert.equal(enableEmail2faRes.status, 200);
  assert.equal(enableEmail2faRes.json.email2faEnabled, true);

  // Log out -> log in with new authTime -> must be pending 2FA ('2fa')
  nowMs += 120_000;
  currentTokens['user1_login_email2fa'] = {
    ...currentTokens['user1_login2'],
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };

  const statusEmail2faLogin = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_email2fa',
  });
  assert.equal(statusEmail2faLogin.json.verified, false, 'Blocked until 2FA code entered');
  assert.equal(statusEmail2faLogin.json.requiredPurpose, '2fa');

  // Send login email code & verify via /api/auth/2fa/verify
  const sendLogin2faCode = await callAuth('/api/auth/send-code', {
    method: 'POST',
    tokenKey: 'user1_login_email2fa',
    body: { purpose: 'login' },
  });
  assert.equal(sendLogin2faCode.status, 200);
  const login2faEmail = sentEmails[sentEmails.length - 1];
  assert.ok(login2faEmail?.code);

  const verifyEmail2faRes = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_email2fa',
    body: { code: login2faEmail.code, method: 'email' },
  });
  assert.equal(verifyEmail2faRes.status, 200);
  assert.equal(verifyEmail2faRes.json.verified, true);

  const verifiedAfterEmail2fa = await isD1UserSessionVerified(
    db,
    currentTokens['user1_login_email2fa'],
    { nowMs }
  );
  assert.equal(verifiedAfterEmail2fa, true);
  console.log('PASS [Test 2]: Turn on email two-step in Settings -> log out -> log in -> asked for email code -> enter code -> in.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Turn on authenticator app in Settings -> scan QR -> enter current
  //         6-digit code -> enabled and 10 backup codes shown once -> log out ->
  //         log in -> enter authenticator code -> in -> try the same code again
  //         right away -> rejected.
  // ───────────────────────────────────────────────────────────────────────────
  const setupTotpRes = await callAuth('/api/auth/2fa/totp/setup', {
    method: 'POST',
    tokenKey: 'user1_login_email2fa',
    body: { currentPassword: 'CorrectHorseBatteryStaple1!' },
  });
  assert.equal(setupTotpRes.status, 200);
  const totpSecret: string = setupTotpRes.json.secret;
  const otpauthUrl: string = setupTotpRes.json.otpauthUrl;
  assert.ok(totpSecret.length >= 32, '20-byte Base32 secret generated');
  assert.ok(
    otpauthUrl.startsWith('otpauth://totp/Boardly:') &&
      otpauthUrl.includes('issuer=Boardly&digits=6&period=30&algorithm=SHA1'),
    'Valid RFC 6238 otpauth URI generated'
  );

  // Generate current 6-digit TOTP code and enable TOTP
  const setupTotpCode = await generateTotpCode(totpSecret, nowMs);
  const enableTotpRes = await callAuth('/api/auth/2fa/totp/enable', {
    method: 'POST',
    tokenKey: 'user1_login_email2fa',
    body: { code: setupTotpCode },
  });
  assert.equal(enableTotpRes.status, 200);
  assert.equal(enableTotpRes.json.totpEnabled, true);
  const backupCodes: string[] = enableTotpRes.json.backupCodes;
  assert.equal(backupCodes.length, 10, '10 one-time backup codes returned once');

  // Confirm status endpoint never exposes backup codes or secret again
  const statusCheck = await callAuth('/api/auth/2fa/status', {
    method: 'GET',
    tokenKey: 'user1_login_email2fa',
  });
  assert.equal(statusCheck.json.totpEnabled, true);
  assert.equal(statusCheck.json.remainingBackupCodes, 10);
  assert.equal(statusCheck.json.secret, undefined);
  assert.equal(statusCheck.json.backupCodes, undefined);

  // Advance to next 30-second window, log out -> log in -> enter authenticator code -> in
  nowMs += 60_000;
  currentTokens['user1_login_totp'] = {
    ...currentTokens['user1_login_email2fa'],
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };

  const loginTotpStatus = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_totp',
  });
  assert.equal(loginTotpStatus.json.verified, false);
  assert.equal(loginTotpStatus.json.requiredPurpose, '2fa');

  const currentTotpCode = await generateTotpCode(totpSecret, nowMs);
  const verifyTotpLoginRes = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_totp',
    body: { code: currentTotpCode, method: 'totp' },
  });
  assert.equal(verifyTotpLoginRes.status, 200);
  assert.equal(verifyTotpLoginRes.json.verified, true);

  // Try the SAME TOTP code again right away in the same 30s window -> REJECTED!
  currentTokens['user1_login_totp_replay'] = {
    ...currentTokens['user1_login_totp'],
    authTime: Math.floor(nowMs / 1000) + 1,
    iat: Math.floor(nowMs / 1000) + 1,
  };
  await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_totp_replay',
  });
  const replayTotpRes = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_totp_replay',
    body: { code: currentTotpCode, method: 'totp' },
  });
  assert.equal(replayTotpRes.status, 400, 'Replayed TOTP code in same time step must be rejected');
  assert.equal(replayTotpRes.json.ok, false);
  console.log('PASS [Test 3]: Turn on authenticator app -> QR + 6-digit code -> 10 backup codes shown once -> login with TOTP works -> immediate replay of same TOTP code rejected.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Use one backup code to log in -> works once -> try the same backup
  //         code again -> rejected.
  // ───────────────────────────────────────────────────────────────────────────
  const firstBackupCode = backupCodes[0];
  const verifyBackupRes1 = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_totp_replay',
    body: { code: firstBackupCode, method: 'backup' },
  });
  assert.equal(verifyBackupRes1.status, 200, 'First use of backup code succeeds');
  assert.equal(verifyBackupRes1.json.verified, true);

  // Log in again and try the SAME backup code -> rejected!
  nowMs += 60_000;
  currentTokens['user1_login_backup_replay'] = {
    ...currentTokens['user1_login_totp'],
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };
  await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_backup_replay',
  });
  const verifyBackupRes2 = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_backup_replay',
    body: { code: firstBackupCode, method: 'backup' },
  });
  assert.equal(verifyBackupRes2.status, 400, 'Second use of same backup code must be rejected');
  assert.equal(verifyBackupRes2.json.ok, false);
  console.log('PASS [Test 4]: Backup code works once -> trying the same backup code again is rejected.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Check "Remember this device for 30 days" -> next login on the same
  //         browser skips the second step -> click "Sign out of all devices" in
  //         Security -> next login asks for the code again.
  // ───────────────────────────────────────────────────────────────────────────
  const secondBackupCode = backupCodes[1];
  const verifyWithRememberRes = await callAuth('/api/auth/2fa/verify', {
    method: 'POST',
    tokenKey: 'user1_login_backup_replay',
    body: {
      code: secondBackupCode,
      method: 'backup',
      rememberDevice: true,
    },
  });
  assert.equal(verifyWithRememberRes.status, 200);
  const setCookieHeader = verifyWithRememberRes.headers.get('Set-Cookie') || '';
  assert.ok(
    setCookieHeader.includes('boardly_trusted_device=') && setCookieHeader.includes('HttpOnly'),
    'HttpOnly trusted device cookie issued'
  );
  const trustedDeviceToken: string = verifyWithRememberRes.json.trustedDeviceToken;
  assert.ok(trustedDeviceToken, 'Trusted device token returned');
  const cookieHeader = `boardly_trusted_device=${encodeURIComponent(trustedDeviceToken)}`;

  // Next login on the same browser (with new authTime + cookie) -> skips the second step!
  nowMs += 3600_000;
  currentTokens['user1_login_remembered'] = {
    ...currentTokens['user1_login_totp'],
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };
  const rememberedStatusRes = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_remembered',
    cookie: cookieHeader,
  });
  assert.equal(rememberedStatusRes.json.verified, true, 'Remembered device skips 2FA on next login');
  assert.equal(rememberedStatusRes.json.deviceTrusted, true);

  // Click "Sign out of all devices" in Security -> revokes trusted devices
  const revokeDevicesRes = await callAuth('/api/auth/2fa/devices/revoke-all', {
    method: 'POST',
    tokenKey: 'user1_login_remembered',
    cookie: cookieHeader,
  });
  assert.equal(revokeDevicesRes.status, 200);

  // Next login with the old cookie now asks for the 2FA code again!
  nowMs += 60_000;
  currentTokens['user1_login_after_revoke'] = {
    ...currentTokens['user1_login_totp'],
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };
  const statusAfterRevoke = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'user1_login_after_revoke',
    cookie: cookieHeader,
  });
  assert.equal(statusAfterRevoke.json.verified, false, 'After revoking devices, next login asks for code again');
  assert.equal(statusAfterRevoke.json.requiredPurpose, '2fa');
  console.log('PASS [Test 5]: Remember this device for 30 days skips 2FA on next login -> Sign out of all devices revokes token -> next login asks for 2FA code again.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: With 2FA on, passing only the password step and calling a protected
  //         API directly -> rejected.
  // ───────────────────────────────────────────────────────────────────────────
  const protectedApiCheckPending2fa = await isD1UserSessionVerified(
    db,
    currentTokens['user1_login_after_revoke'],
    { nowMs }
  );
  assert.equal(
    protectedApiCheckPending2fa,
    false,
    'User who passed only password step with 2FA on must be rejected by protected APIs'
  );
  console.log('PASS [Test 6]: With 2FA on, passing only the password step and calling a protected API directly is rejected on the server.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: 5 wrong codes -> code burned; 6th resend in an hour -> 429.
  // ───────────────────────────────────────────────────────────────────────────
  nowMs += 3600_000 + 10_000; // Fresh 1-hour window
  currentTokens['user2_rate_test'] = {
    uid: 'uid_student_2',
    email: 'student2@example.com',
    emailVerified: false,
    name: 'Sara Ali',
    signInProvider: 'password',
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };

  // Send 1st code
  const send1 = await callAuth('/api/auth/send-code', {
    method: 'POST',
    tokenKey: 'user2_rate_test',
    body: { purpose: 'signup', forceResend: true },
    ip: '198.51.100.25',
  });
  assert.equal(send1.status, 200);
  const validCodeForUser2 = sentEmails[sentEmails.length - 1].code!;

  // Enter 5 wrong codes -> 5th wrong attempt burns the code
  for (let i = 1; i <= 5; i++) {
    const wrongRes = await callAuth('/api/auth/verify-code', {
      method: 'POST',
      tokenKey: 'user2_rate_test',
      body: { code: '000000', purpose: 'signup' },
      ip: '198.51.100.25',
    });
    assert.equal(wrongRes.status, 400);
    if (i === 5) {
      assert.equal(wrongRes.json.locked, true, '5th wrong attempt burns the code');
    }
  }

  // Even entering the real code now fails because it was burned after 5 wrong attempts!
  const tryRealAfterBurn = await callAuth('/api/auth/verify-code', {
    method: 'POST',
    tokenKey: 'user2_rate_test',
    body: { code: validCodeForUser2, purpose: 'signup' },
    ip: '198.51.100.25',
  });
  assert.equal(tryRealAfterBurn.status, 400, 'Burned code cannot be used even with original digits');

  // Now send codes 2, 3, 4, 5 (advancing 61s cooldown each time within the same hour)
  for (let s = 2; s <= 5; s++) {
    nowMs += 61_000;
    const resendOk = await callAuth('/api/auth/send-code', {
      method: 'POST',
      tokenKey: 'user2_rate_test',
      body: { purpose: 'signup', forceResend: true },
      ip: '198.51.100.25',
    });
    assert.equal(resendOk.status, 200, `Send #${s} within the hour succeeds`);
  }

  // 6th send in the same hour -> HTTP 429!
  nowMs += 61_000;
  const send6 = await callAuth('/api/auth/send-code', {
    method: 'POST',
    tokenKey: 'user2_rate_test',
    body: { purpose: 'signup', forceResend: true },
    ip: '198.51.100.25',
  });
  assert.equal(send6.status, 429, '6th resend in an hour must return HTTP 429');
  console.log('PASS [Test 7]: 5 wrong codes burns the code; 6th resend in an hour returns HTTP 429.');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Admin without 2FA can still log in normally and sees only the
  //         dismissible recommendation banner.
  // ───────────────────────────────────────────────────────────────────────────
  nowMs += 60_000;
  currentTokens['admin_no_2fa'] = {
    uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
    email: 'shsvirtualadmin@gmail.com',
    emailVerified: true,
    name: 'Super Admin',
    signInProvider: 'password',
    authTime: Math.floor(nowMs / 1000),
    iat: Math.floor(nowMs / 1000),
  };

  const adminLoginStatus = await callAuth('/api/auth/verification-status?login=1', {
    method: 'GET',
    tokenKey: 'admin_no_2fa',
  });
  assert.equal(adminLoginStatus.status, 200);
  assert.equal(adminLoginStatus.json.verified, true, 'Admin without 2FA logs in normally without blocking');
  assert.equal(adminLoginStatus.json.twoFactorEnabled, false);

  const adminProtectedCheck = await isD1UserSessionVerified(
    db,
    currentTokens['admin_no_2fa'],
    { nowMs }
  );
  assert.equal(adminProtectedCheck, true, 'Admin without 2FA can call protected APIs');
  console.log('PASS [Test 8]: Admin without 2FA logs in normally without blocking and sees only the dismissible recommendation banner in Security.');

  console.log('\nALL 8 REQUIRED VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
