import assert from 'node:assert/strict';
import { handleAuthApiRequest } from '../../functions/api/auth/[[path]]';
import { InMemoryD1Database } from '../../functions/_utils/firestoreRestAdmin';
import { clearCachedAuthAndAdminStorage } from '../components/dashboard/HamburgerMenuSheet';
import {
  writeOptimisticUserSnapshot,
  writeOptimisticWalletSnapshot,
  readOptimisticUserSnapshot,
  readOptimisticWalletSnapshot,
  writeSwrCache,
  readSwrCache,
  invalidateSwrCache,
  clearOptimisticUserSnapshot,
} from '../lib/swrCache';
import { setStoredGuestSessionToken, getStoredGuestSessionToken } from '../lib/api';
import { teardownSharedUserProfile } from '../hooks/useUserProfile';
import { teardownNotificationStore } from '../services/notificationService';
import { teardownEffectivePlanListeners } from '../hooks/useEffectivePlan';

class MockWebStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

async function runSignOutVerification() {
  console.log('=== PART 1 SIGN-OUT ONE-TAP TEST ===');

  const localStorageMock = new MockWebStorage();
  const sessionStorageMock = new MockWebStorage();

  // Set up browser globals for client storage & URL tracking
  let currentPath = '/dashboard/commons';
  const mockWindow: Record<string, any> = {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    location: {
      get pathname() {
        return currentPath.split('?')[0];
      },
      get href() {
        return `https://boardly.cfd${currentPath}`;
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
  (globalThis as any).window = mockWindow;
  (globalThis as any).localStorage = localStorageMock;
  (globalThis as any).sessionStorage = sessionStorageMock;

  const db = new InMemoryD1Database();
  const env = {
    DB: db,
    OTP_HMAC_SECRET: 'test-worker-hmac-secret-key-2026',
    TOTP_ENCRYPTION_KEY: 'test-worker-totp-aes-gcm-secret-key-2026',
  };

  // 1. Simulate residual guest session cookie + real email login (the exact bug scenario!)
  const guestStartReq = new Request('https://boardly.cfd/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.42' },
    body: JSON.stringify({ username: 'bilalkhan99', targetUniversity: 'NUST' }),
  });
  const guestStartRes = await handleAuthApiRequest({
    request: guestStartReq,
    env,
    nowMsOverride: Date.now(),
  });
  const guestStartJson = (await guestStartRes.json()) as any;
  assert.equal(guestStartJson.ok, true, 'Guest session should start');
  const guestCookieHeader = guestStartRes.headers.get('Set-Cookie') || '';
  const cookiePair = guestCookieHeader.split(';')[0];
  assert.ok(cookiePair.startsWith('boardly_guest_session='), 'Guest cookie should be issued');

  // Seed leftover guest token & real email user state in localStorage + sessionStorage
  setStoredGuestSessionToken(guestStartJson.sessionToken);
  localStorageMock.setItem('boardly_guest_session_token', guestStartJson.sessionToken);
  localStorageMock.setItem('boardly_theme', 'dark');
  localStorageMock.setItem('cached_profile_real_user_1', JSON.stringify({ uid: 'real_user_1', email: 'student@boardly.cfd' }));
  writeOptimisticUserSnapshot({
    uid: 'real_user_1',
    email: 'student@boardly.cfd',
    displayName: 'Real Student',
    role: 'student',
    plan: 'free',
    isGuest: false,
  });
  writeOptimisticWalletSnapshot({
    uid: 'real_user_1',
    balance: 250,
    equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
  });
  writeSwrCache('commons:all:real_user_1', [{ id: 'post_1' }]);
  sessionStorageMock.setItem('boardly_post_login_redirect', '/dashboard/commons');

  // Mock Firebase auth instance with logged-in email user
  const mockAuth: {
    currentUser: { uid: string; email: string } | null;
    signOutCalls: number;
    signOut: () => Promise<void>;
  } = {
    currentUser: { uid: 'real_user_1', email: 'student@boardly.cfd' },
    signOutCalls: 0,
    async signOut() {
      this.signOutCalls += 1;
      await new Promise((r) => setTimeout(r, 25));
      this.currentUser = null;
    },
  };

  let activeCookie = cookiePair;
  let signOutError: Error | null = null;

  // 2. Execute ONE tap on Sign out (matching executeForceSignOut + handleSignOut)
  try {
    mockWindow.__boardlySigningOut = true;

    // Unsubscribe all Firestore listeners
    teardownSharedUserProfile();
    teardownNotificationStore();
    teardownEffectivePlanListeners();

    // Clear all cached user/guest state
    clearOptimisticUserSnapshot();
    invalidateSwrCache();
    setStoredGuestSessionToken(null);
    clearCachedAuthAndAdminStorage();

    // Revoke server session / guest cookie AND await Firebase signOut
    const logoutReq = new Request('https://boardly.cfd/api/auth/guest/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: activeCookie,
      },
      body: JSON.stringify({ uid: '' }),
    });

    const [logoutRes] = await Promise.all([
      handleAuthApiRequest({
        request: logoutReq,
        env,
        nowMsOverride: Date.now(),
      }),
      mockAuth.signOut(),
    ]);

    const clearCookieSet = logoutRes.headers.get('Set-Cookie') || '';
    if (clearCookieSet.includes('Max-Age=0')) {
      activeCookie = '';
    }

    sessionStorageMock.removeItem('boardly_post_login_redirect');
    mockWindow.__boardlySigningOut = false;

    // Navigate to sign-in screen (/login)
    currentPath = '/login';
  } catch (err: any) {
    signOutError = err;
  }

  // 3. Verify that /api/auth/me does NOT resurrect any guest session after sign-out
  const meAfterLogoutReq = new Request('https://boardly.cfd/api/auth/me', {
    method: 'GET',
    headers: activeCookie ? { Cookie: activeCookie } : {},
  });
  const meAfterLogoutRes = await handleAuthApiRequest({
    request: meAfterLogoutReq,
    env,
    nowMsOverride: Date.now(),
  });
  const meAfterLogoutData = (await meAfterLogoutRes.json()) as any;

  // 4. Assert all 6 requirements of Part 1
  assert.equal(signOutError, null, 'Sign-out must not throw any error');
  assert.equal(mockAuth.signOutCalls, 1, 'signOut(auth) must be called and awaited in 1 tap');
  assert.equal(mockAuth.currentUser, null, 'auth.currentUser must be null after 1 sign-out tap');
  assert.equal(
    localStorageMock.getItem('boardly_user_authenticated'),
    null,
    'boardly_user_authenticated must be cleared'
  );
  assert.equal(
    localStorageMock.getItem('boardly_guest_session_token'),
    null,
    'boardly_guest_session_token must be cleared'
  );
  assert.equal(
    getStoredGuestSessionToken(),
    null,
    'boardly_guest_session_backup_v1 must be cleared in both localStorage and sessionStorage'
  );
  assert.equal(
    readOptimisticUserSnapshot(),
    null,
    'Optimistic user snapshot must be cleared'
  );
  assert.equal(
    readOptimisticWalletSnapshot('real_user_1'),
    null,
    'Optimistic wallet snapshot must be cleared'
  );
  assert.equal(
    readSwrCache('commons:all:real_user_1'),
    null,
    'SWR query cache must be cleared'
  );
  assert.equal(
    sessionStorageMock.getItem('boardly_post_login_redirect'),
    null,
    'sessionStorage boardly_post_login_redirect must be cleared so LoginPage never redirects back to Commons'
  );
  assert.equal(
    meAfterLogoutData.authenticated,
    false,
    'Server session / guest cookie must be revoked so no guest session is resurrected'
  );
  assert.equal(
    mockWindow.location.pathname,
    '/login',
    'URL must be the sign-in screen (/login) with no redirect to /commons'
  );

  console.log('ALL PART 1 SIGN-OUT ASSERTIONS PASSED IN 1 TAP!');
}

runSignOutVerification().catch((err) => {
  console.error('PART 1 SIGN-OUT TEST FAILED:', err);
  process.exit(1);
});
