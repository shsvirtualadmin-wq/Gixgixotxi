import assert from 'node:assert/strict';
import type { ActiveSessionItem, SecuritySummary } from '../services/securityCenterService';
import {
  computeConsistentSessionCounts,
  reconcileSecuritySummaryWithSessions,
} from '../utils/securitySessionCounts';

function makeSessions(total: number, hasCurrent = true): ActiveSessionItem[] {
  return Array.from({ length: total }, (_, idx) => ({
    id: `sess_${idx + 1}`,
    deviceLabel: idx === 0 ? 'Chrome on macOS' : `Chrome on Device ${idx + 1}`,
    browser: 'Chrome',
    os: 'macOS',
    locationHint: 'PK',
    createdAt: 1_700_000_000_000 - idx * 60_000,
    lastSeenAt: 1_700_000_000_000 - idx * 30_000,
    isCurrent: hasCurrent && idx === 0,
  }));
}

function makeSummary(overrides: Partial<SecuritySummary> = {}): SecuritySummary {
  return {
    twoFactor: {
      twoFactorEnabled: true,
      totpEnabled: true,
      email2faEnabled: false,
      emailCodeEnabled: false,
      backupCodesRemaining: 8,
      trustedDevicesCount: 1,
      rememberedDevices: 1,
      recoveryPending: false,
      recoveryDisableAt: null,
    },
    passkeysCount: 1,
    activeSessionsCount: 57,
    trustedDevicesCount: 1,
    unknownSessionsCount: 48,
    recommendations: [
      {
        id: 'unknown_session',
        title: 'Review 48 other active sessions',
        subtitle: 'Sign out devices you do not recognize from the last 30 days.',
        actionLabel: 'Review',
        targetSection: 'sessions',
      },
    ],
    hasRecommendations: true,
    ...overrides,
  };
}

// 1. Reconciles stale/contradictory 48 vs 57 summary to 56 other active sessions (57 - 1)
{
  const sessions = makeSessions(57, true);
  const summary = makeSummary({ activeSessionsCount: 57, unknownSessionsCount: 48 });
  const reconciled = reconcileSecuritySummaryWithSessions(summary, sessions, true);

  assert.ok(reconciled);
  assert.equal(reconciled.activeSessionsCount, 57);
  assert.equal(reconciled.otherActiveSessionsCount, 56);
  assert.equal(reconciled.unknownSessionsCount, 56);
  const rec = reconciled.recommendations.find((r) => r.id === 'unknown_session');
  assert.ok(rec, 'Other active sessions recommendation should be present');
  assert.equal(rec.title, 'Review 56 other active sessions');
}

// 2. Consistent even before sessions list finishes loading (uses summary.activeSessionsCount - 1)
{
  const summary = makeSummary({ activeSessionsCount: 57, unknownSessionsCount: 48 });
  const reconciled = reconcileSecuritySummaryWithSessions(summary, [], false);

  assert.ok(reconciled);
  assert.equal(reconciled.activeSessionsCount, 57);
  assert.equal(reconciled.otherActiveSessionsCount, 56);
  const rec = reconciled.recommendations.find((r) => r.id === 'unknown_session');
  assert.equal(rec?.title, 'Review 56 other active sessions');
}

// 3. Immediately reflects revoked session count across overview badge & recommendation
{
  const sessionsAfterRevoke = makeSessions(56, true);
  const staleSummary = makeSummary({ activeSessionsCount: 57, unknownSessionsCount: 56 });
  const reconciled = reconcileSecuritySummaryWithSessions(
    staleSummary,
    sessionsAfterRevoke,
    true
  );

  assert.ok(reconciled);
  assert.equal(reconciled.activeSessionsCount, 56);
  assert.equal(reconciled.otherActiveSessionsCount, 55);
  const rec = reconciled.recommendations.find((r) => r.id === 'unknown_session');
  assert.equal(rec?.title, 'Review 55 other active sessions');
}

// 4. Singular grammar when total = 2 (1 other active session)
{
  const sessions = makeSessions(2, true);
  const reconciled = reconcileSecuritySummaryWithSessions(
    makeSummary({ activeSessionsCount: 2 }),
    sessions,
    true
  );

  assert.ok(reconciled);
  assert.equal(reconciled.activeSessionsCount, 2);
  assert.equal(reconciled.otherActiveSessionsCount, 1);
  const rec = reconciled.recommendations.find((r) => r.id === 'unknown_session');
  assert.equal(rec?.title, 'Review 1 other active session');
}

// 5. Removes "other active sessions" recommendation when only current session (1) or 0 sessions remain
{
  const oneSession = makeSessions(1, true);
  const reconciledOne = reconcileSecuritySummaryWithSessions(
    makeSummary({ activeSessionsCount: 1 }),
    oneSession,
    true
  );
  assert.ok(reconciledOne);
  assert.equal(reconciledOne.activeSessionsCount, 1);
  assert.equal(reconciledOne.otherActiveSessionsCount, 0);
  assert.equal(
    reconciledOne.recommendations.some((r) => r.id === 'unknown_session'),
    false
  );
  assert.equal(reconciledOne.hasRecommendations, false);

  const zeroCounts = computeConsistentSessionCounts([], true, 0);
  assert.deepEqual(zeroCounts, {
    totalActiveSessions: 0,
    currentSessionsCount: 0,
    otherActiveSessions: 0,
  });
}

console.log('All security session count consistency tests passed!');
