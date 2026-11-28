import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAdminUserTotals } from './adminUserCounts';
import { pluralize, formatAuditActionLabel, formatAdSlotLabel } from './adminLabels';

test('Overview and Users page agree on 95 total users (57 Free + 34 Pro + 3 Plus + 1 Guest)', () => {
  const overviewTotals = computeAdminUserTotals({
    registeredCount: 94,
    freeCount: 57,
    proCount: 34,
    plusCount: 3,
    guestCount: 1,
  });

  const usersDirectoryTotals = computeAdminUserTotals({
    registeredCount: 94,
    guestCount: 1,
    loadedUsersCount: 20,
  });

  assert.equal(overviewTotals.registeredUsers, 94);
  assert.equal(overviewTotals.tierSum, 94);
  assert.equal(overviewTotals.guestCount, 1);
  assert.equal(overviewTotals.totalUsers, 95);
  assert.equal(usersDirectoryTotals.totalUsers, 95);
  assert.equal(overviewTotals.totalUsers, usersDirectoryTotals.totalUsers);
});

test('Handles zero guests and null guest counts safely', () => {
  const zeroGuests = computeAdminUserTotals({
    registeredCount: 94,
    guestCount: 0,
  });
  assert.equal(zeroGuests.totalUsers, 94);

  const nullGuests = computeAdminUserTotals({
    registeredCount: 94,
    guestCount: null,
  });
  assert.equal(nullGuests.totalUsers, 94);
});

test('Uses tier sum when registeredCount is omitted and respects loadedUsersCount floor', () => {
  const fromTiers = computeAdminUserTotals({
    freeCount: 57,
    proCount: 34,
    plusCount: 3,
    guestCount: 1,
  });
  assert.equal(fromTiers.totalUsers, 95);

  const floorCheck = computeAdminUserTotals({
    registeredCount: 90,
    guestCount: 1,
    loadedUsersCount: 95,
  });
  assert.equal(floorCheck.totalUsers, 95);
});

test('Admin labels and pluralization helpers format human-readable output', () => {
  assert.equal(pluralize(1, 'attempt'), '1 attempt');
  assert.equal(pluralize(2, 'attempt'), '2 attempts');
  assert.equal(pluralize(0, 'attempt'), '0 attempts');
  assert.equal(formatAuditActionLabel('approve_captain_application'), 'Approved captain application');
  assert.equal(formatAdSlotLabel('home_mid'), 'Home - middle');
});
