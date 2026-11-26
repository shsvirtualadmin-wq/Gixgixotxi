import assert from 'node:assert/strict';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateAdminRouteAccess,
  evaluateDashboardRouteAccess,
  evaluateRoleGuardAccess,
  sanitizeRedirectTarget,
} from '../utils/routeGuards';

function runTests() {
  // 1. Redirect target sanitization & full URL preservation
  assert.equal(sanitizeRedirectTarget('/admin'), '/admin');
  assert.equal(sanitizeRedirectTarget('/superadmin?page=2#users'), '/superadmin?page=2#users');
  assert.equal(sanitizeRedirectTarget('/settings/privacy'), '/settings/privacy');
  assert.equal(sanitizeRedirectTarget('/privacy'), '/privacy');
  assert.equal(sanitizeRedirectTarget('/bookmarks'), '/bookmarks');
  assert.equal(sanitizeRedirectTarget('//evil.example/phish'), null);
  assert.equal(sanitizeRedirectTarget('https://evil.example'), null);
  assert.equal(sanitizeRedirectTarget('/login?redirect=/admin'), null);
  assert.equal(sanitizeRedirectTarget('/signup'), null);
  assert.equal(
    buildLoginRedirectUrl('/superadmin', '?tab=users', '#top'),
    `/login?redirect=${encodeURIComponent('/superadmin?tab=users#top')}`
  );
  assert.equal(buildFullPath('/settings', '?sec=privacy', '#s'), '/settings?sec=privacy#s');

  // 2. Direct entry / refresh on /admin and /superadmin MUST stay in loading while auth, claims, or OTP settle
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/admin',
      authStatus: 'loading',
      profileLoading: false,
      hasUser: false,
      isGuest: false,
      tokenClaimsVerified: false,
      isAdmin: false,
      isSuperAdmin: false,
      otpStatus: 'idle',
      isSessionVerified: false,
    }),
    { action: 'loading' },
    'Refreshing /admin while authStatus is loading must wait, not bounce'
  );

  // Critical regression: signed-in superadmin refreshing /superadmin while claims are resolved
  // BEFORE OTP verification transitions from 'idle' or 'checking' -> 'verified'
  for (const otpStatus of ['idle', 'checking'] as const) {
    assert.deepEqual(
      evaluateAdminRouteAccess({
        pathname: '/superadmin',
        authStatus: 'authenticated',
        profileLoading: false,
        hasUser: true,
        isGuest: false,
        tokenClaimsVerified: true,
        isAdmin: true,
        isSuperAdmin: true,
        otpStatus,
        isSessionVerified: false,
        requireSuperAdmin: true,
      }),
      { action: 'loading' },
      `Refreshing /superadmin with otpStatus=${otpStatus} must NOT bounce to /login`
    );
  }

  // Verified superadmin on /superadmin & /admin -> allow
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/superadmin',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      isAdmin: true,
      isSuperAdmin: true,
      otpStatus: 'verified',
      isSessionVerified: true,
      requireSuperAdmin: true,
    }),
    { action: 'allow' }
  );

  // Verified limited admin on /superadmin -> fail closed to /admin
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/superadmin',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      isAdmin: true,
      isSuperAdmin: false,
      otpStatus: 'verified',
      isSessionVerified: true,
      requireSuperAdmin: true,
    }),
    { action: 'redirect_admin' }
  );

  // Verified student on /admin -> fail closed to /dashboard
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/admin',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      isAdmin: false,
      isSuperAdmin: false,
      otpStatus: 'verified',
      isSessionVerified: true,
    }),
    { action: 'redirect_dashboard' }
  );

  // Logged-out visitor on /superadmin -> redirect to login
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/superadmin',
      authStatus: 'unauthenticated',
      profileLoading: false,
      hasUser: false,
      isGuest: false,
      tokenClaimsVerified: false,
      isAdmin: false,
      isSuperAdmin: false,
      otpStatus: 'idle',
      isSessionVerified: false,
      requireSuperAdmin: true,
    }),
    { action: 'redirect_login' }
  );

  // Server-confirmed OTP pending on /admin -> redirect to login (or verify-email for signup)
  assert.deepEqual(
    evaluateAdminRouteAccess({
      pathname: '/admin',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      isAdmin: true,
      isSuperAdmin: true,
      otpStatus: 'pending',
      otpPurpose: '2fa',
      isSessionVerified: false,
    }),
    { action: 'redirect_login' }
  );

  // 3. Direct entry / refresh on /settings and /bookmarks (DashboardShell)
  for (const otpStatus of ['idle', 'checking'] as const) {
    assert.deepEqual(
      evaluateDashboardRouteAccess({
        authStatus: 'authenticated',
        isAuthenticated: true,
        profileLoading: false,
        hasUser: true,
        isGuest: false,
        otpStatus,
        isSessionVerified: false,
        isSigningOut: false,
        publicEquivalent: null,
      }),
      { action: 'loading' },
      `Refreshing /settings or /bookmarks with otpStatus=${otpStatus} must NOT bounce to /login`
    );
  }

  // Verified signed-in user on /settings or /bookmarks -> allow
  assert.deepEqual(
    evaluateDashboardRouteAccess({
      authStatus: 'authenticated',
      isAuthenticated: true,
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      otpStatus: 'verified',
      isSessionVerified: true,
      isSigningOut: false,
      publicEquivalent: null,
    }),
    { action: 'allow' }
  );

  // Unauthenticated user on /settings -> redirect_login
  assert.deepEqual(
    evaluateDashboardRouteAccess({
      authStatus: 'unauthenticated',
      isAuthenticated: false,
      profileLoading: false,
      hasUser: false,
      isGuest: false,
      otpStatus: 'idle',
      isSessionVerified: false,
      isSigningOut: false,
      publicEquivalent: null,
    }),
    { action: 'redirect_login' }
  );

  // Server-confirmed pending signup verification on /settings -> redirect_verify_email
  assert.deepEqual(
    evaluateDashboardRouteAccess({
      authStatus: 'authenticated',
      isAuthenticated: true,
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      otpStatus: 'pending',
      otpPurpose: 'signup',
      isSessionVerified: false,
      isSigningOut: false,
      publicEquivalent: null,
    }),
    { action: 'redirect_verify_email' }
  );

  // 4. RoleGuard hydration safety (/dashboard/captain)
  assert.deepEqual(
    evaluateRoleGuardAccess({
      requiredRole: 'captain',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      hasCaptainOrAbove: true,
      otpStatus: 'idle',
      isSessionVerified: false,
    }),
    { action: 'loading' }
  );
  assert.deepEqual(
    evaluateRoleGuardAccess({
      requiredRole: 'captain',
      authStatus: 'authenticated',
      profileLoading: false,
      hasUser: true,
      isGuest: false,
      tokenClaimsVerified: true,
      hasCaptainOrAbove: true,
      otpStatus: 'verified',
      isSessionVerified: true,
    }),
    { action: 'allow' }
  );

  console.log('✓ All direct-entry & refresh route guard tests passed!');
}

runTests();
