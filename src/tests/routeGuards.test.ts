import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateAdminRouteAccess,
  evaluateDashboardRouteAccess,
  evaluatePublicLayoutAccess,
  evaluateRoleGuardAccess,
  resolvePostAuthDestination,
  sanitizeRedirectTarget,
} from '../utils/routeGuards';

function runTests() {
  // 1. Redirect target sanitization & full URL preservation
  assert.equal(sanitizeRedirectTarget('/admin'), '/admin');
  assert.equal(sanitizeRedirectTarget('/superadmin?page=2#users'), '/superadmin?page=2#users');
  assert.equal(sanitizeRedirectTarget('/dashboard'), '/dashboard');
  assert.equal(sanitizeRedirectTarget('/leaderboard'), '/leaderboard');
  assert.equal(sanitizeRedirectTarget('/privacy'), '/privacy');
  assert.equal(sanitizeRedirectTarget('/settings/privacy'), '/settings/privacy');
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

  // 3. Direct entry / refresh on /dashboard, /settings, and /bookmarks (DashboardShell)
  assert.deepEqual(
    evaluateDashboardRouteAccess({
      authStatus: 'loading',
      isAuthenticated: true,
      profileLoading: false,
      hasUser: false,
      isGuest: false,
      otpStatus: 'idle',
      isSessionVerified: false,
      isSigningOut: false,
      publicEquivalent: null,
    }),
    { action: 'loading' },
    'Reloading /dashboard, /settings, or /bookmarks while auth hydrates must stay in loading'
  );

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
      `Refreshing /dashboard, /settings, or /bookmarks with otpStatus=${otpStatus} must NOT bounce to /login`
    );
  }

  // Verified signed-in user on /dashboard, /settings, or /bookmarks -> allow
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

  // Unauthenticated user on /dashboard, /settings, or /bookmarks -> redirect_login
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

  // 4. Shared routes under PublicLayout (/leaderboard, /privacy) never bounce through / or /dashboard/commons
  for (const route of ['/leaderboard', '/privacy']) {
    assert.deepEqual(
      evaluatePublicLayoutAccess({
        pathname: route,
        sessionStatus: 'loading',
        isOptimisticallyAuthenticated: true,
        pendingRedirect: null,
      }),
      { action: 'render_app_layout' },
      `Reloading ${route} while optimistically authenticated must stay in AppLayout without flashing public layout`
    );
    assert.deepEqual(
      evaluatePublicLayoutAccess({
        pathname: route,
        sessionStatus: 'authenticated',
        isOptimisticallyAuthenticated: true,
        pendingRedirect: '/dashboard',
      }),
      { action: 'render_app_layout' },
      `Authenticated ${route} must stay on ${route} and never redirect to /dashboard/commons`
    );
    assert.deepEqual(
      evaluatePublicLayoutAccess({
        pathname: route,
        sessionStatus: 'unauthenticated',
        isOptimisticallyAuthenticated: false,
        pendingRedirect: null,
      }),
      { action: 'render_public_layout' }
    );
  }

  // Root '/' behavior: never flash landing page for signed-in reload; honor pending redirect before /dashboard/commons
  assert.deepEqual(
    evaluatePublicLayoutAccess({
      pathname: '/',
      sessionStatus: 'loading',
      isOptimisticallyAuthenticated: true,
      pendingRedirect: null,
    }),
    { action: 'loading_authenticated_home' }
  );
  assert.deepEqual(
    evaluatePublicLayoutAccess({
      pathname: '/',
      sessionStatus: 'authenticated',
      isOptimisticallyAuthenticated: true,
      pendingRedirect: '/bookmarks',
    }),
    { action: 'redirect', target: '/bookmarks', clearPendingRedirect: true }
  );
  assert.deepEqual(
    evaluatePublicLayoutAccess({
      pathname: '/',
      sessionStatus: 'authenticated',
      isOptimisticallyAuthenticated: true,
      pendingRedirect: null,
    }),
    { action: 'redirect', target: '/dashboard/commons', clearPendingRedirect: false }
  );

  // 5. Post-login destination resolution preserves exact requested routes
  for (const target of ['/dashboard', '/leaderboard', '/privacy', '/settings', '/bookmarks']) {
    assert.deepEqual(
      resolvePostAuthDestination({
        redirectParam: target,
        storedRedirect: null,
        needsOnboarding: false,
        roleDefaultUrl: '/dashboard',
      }),
      { destination: target, shouldClearStoredRedirect: true },
      `Post-login redirect must return directly to ${target}`
    );
  }
  assert.deepEqual(
    resolvePostAuthDestination({
      redirectParam: '/bookmarks?tab=formulas',
      storedRedirect: null,
      needsOnboarding: true,
      roleDefaultUrl: '/dashboard',
    }),
    {
      destination: `/onboarding?redirect=${encodeURIComponent('/bookmarks?tab=formulas')}`,
      shouldClearStoredRedirect: false,
    },
    'Onboarding detour must keep redirect target intact'
  );

  // 6. RoleGuard hydration safety (/dashboard/captain)
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

  // 7. Cold load on '/' with a valid pending redirect must wait in loading instead of flashing LandingPage
  assert.deepEqual(
    evaluatePublicLayoutAccess({
      pathname: '/',
      sessionStatus: 'loading',
      isOptimisticallyAuthenticated: false,
      pendingRedirect: '/bookmarks',
    }),
    { action: 'loading_authenticated_home' },
    'Cold load on / with a pending redirect must not flash LandingPage'
  );

  // 8. Regression checks: AuthContext onAuthStateChanged listener stability & /bookmarks route + Settings entries
  const authContextSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/contexts/AuthContext.tsx'),
    'utf8'
  );
  assert.ok(
    authContextSrc.includes('refreshActiveGrantsRef.current'),
    'AuthContext must invoke refreshActiveGrants via ref inside onAuthStateChanged'
  );
  assert.equal(
    /evaluateVerifiedRoleState,\s*refreshActiveGrants,/.test(authContextSrc),
    false,
    'onAuthStateChanged effect must not depend on refreshActiveGrants (causes mid-hydration teardown)'
  );

  const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(appSrc.includes('path="/bookmarks"'), 'App.tsx must register /bookmarks route');
  assert.ok(appSrc.includes('path="bookmarks"'), 'App.tsx must register /dashboard/bookmarks route');
  assert.ok(
    appSrc.includes('path="/settings/bookmarks"'),
    'App.tsx must register /settings/bookmarks redirect'
  );

  const settingsFlowSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/settings/BoardlySettingsFlow.tsx'),
    'utf8'
  );
  assert.ok(
    settingsFlowSrc.includes("navigateTo('/bookmarks')"),
    'Settings menu (BoardlySettingsFlow) must include a Bookmarks entry navigating to /bookmarks'
  );

  const menuSheetSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/dashboard/HamburgerMenuSheet.tsx'),
    'utf8'
  );
  assert.ok(
    menuSheetSrc.includes("onNavigate('/bookmarks')"),
    'Account dropdown menu (DashboardMenuContent) must include a Bookmarks entry'
  );

  console.log('✓ All direct-entry & refresh route guard tests passed!');
}

runTests();

