import assert from 'node:assert/strict';
import {
  computePlanAnalyticsSnapshot,
  resolvePaidRecordBilling,
  resolvePaidRecordTier,
} from '../lib/planAnalytics';
import { DEFAULT_PLANS_CONFIG } from '../lib/planTier';

const NOW_MS = Date.parse('2026-11-25T12:00:00.000Z');
const FUTURE_30D_ISO = new Date(NOW_MS + 30 * 86_400_000).toISOString();
const FUTURE_365D_ISO = new Date(NOW_MS + 365 * 86_400_000).toISOString();

// 1. Live scenario: Pro Annual manual payment (PKR 1,791) + Plus Annual Koban upgrade from Pro
{
  const snap = computePlanAnalyticsSnapshot({
    plansConfig: DEFAULT_PLANS_CONFIG,
    paymentRequests: [
      {
        id: 'pay_pro_1',
        data: {
          status: 'approved',
          userId: 'u_1',
          planId: 'pro_annual',
          planTier: 'pro',
          amount_pkr: 1791,
        },
      },
    ],
    planActivations: [
      {
        id: 'u_1_plus_koban_1',
        data: {
          uid: 'u_1',
          source: 'kobans',
          planId: 'plus_annual',
          planTier: 'plus',
          billing: 'annual',
          kobansSpent: 35910,
          previousTier: 'pro',
          upgradedFromPro: true,
        },
      },
    ],
    paidUsers: [
      {
        id: 'u_1',
        data: {
          uid: 'u_1',
          plan: 'plus',
          isPlus: true,
          plusPlanId: 'plus_annual',
          plusUntil: FUTURE_365D_ISO,
        },
      },
    ],
    nowMs: NOW_MS,
  });

  assert.equal(snap.proRevenuePkr, 1791, 'Pro Annual should be PKR 1,791');
  assert.equal(snap.plusRevenuePkr, 3591, 'Plus Annual via Kobans should compute to PKR 3,591 (no double-count)');
  assert.equal(snap.proToPlusConversions, 1, 'Pro -> Plus upgrade via planActivations must be counted once');
}

// 2. Plus Monthly coupon activation (finalPkr: 0) and active Plus user without paymentRequest
{
  const snap = computePlanAnalyticsSnapshot({
    plansConfig: DEFAULT_PLANS_CONFIG,
    paymentRequests: [
      {
        id: 'pay_pro_1',
        data: {
          status: 'approved',
          userId: 'u_pro',
          planId: 'pro_annual',
          amount_pkr: 1791,
        },
      },
    ],
    planActivations: [
      {
        id: 'u_coupon_plus',
        data: {
          uid: 'u_coupon',
          source: 'coupon',
          planId: 'plus_monthly',
          planTier: 'plus',
          billing: 'monthly',
          originalPkr: 399,
          discountPkr: 399,
          finalPkr: 0,
          previousTier: 'pro',
          upgradedFromPro: true,
        },
      },
    ],
    paidUsers: [
      {
        id: 'u_direct_plus',
        data: {
          uid: 'u_direct_plus',
          plan: 'plus',
          isPlus: true,
          plusPlanId: 'plus_annual',
          plusUntil: FUTURE_365D_ISO,
        },
      },
      {
        id: 'u_superadmin_only',
        data: {
          uid: 'u_superadmin_only',
          role: 'superadmin',
          isSuperAdmin: true,
          plan: 'free',
        },
      },
    ],
    nowMs: NOW_MS,
  });

  assert.equal(snap.proRevenuePkr, 1791);
  assert.equal(
    snap.plusRevenuePkr,
    399 + 3591,
    'Plus Monthly coupon (399) + active Plus Annual user without payment doc (3,591) = 3,990; superAdmin free user excluded'
  );
  assert.equal(snap.proToPlusConversions, 1);
}

// 3. Legacy paymentRequest with `plan: 'annual'` + `planTier: 'plus'` and missing/0 amount_pkr
{
  assert.equal(resolvePaidRecordTier({ plan: 'annual', planTier: 'plus' }), 'plus');
  assert.equal(resolvePaidRecordBilling({ plan: 'annual', planTier: 'plus' }, NOW_MS), 'annual');

  const snap = computePlanAnalyticsSnapshot({
    plansConfig: DEFAULT_PLANS_CONFIG,
    paymentRequests: [
      {
        id: 'pay_legacy_plus',
        data: {
          status: 'approved',
          userId: 'u_legacy',
          plan: 'annual',
          planTier: 'plus',
          amount_pkr: 0,
          previousPlan: 'pro',
        },
      },
      {
        id: 'pay_plus_monthly_missing_amt',
        data: {
          status: 'verified',
          userId: 'u_m',
          planId: 'plus_monthly',
        },
      },
      {
        id: 'pay_crew_ignored',
        data: {
          status: 'approved',
          userId: 'u_crew',
          plan: 'large_crew',
          amount_pkr: 5000,
        },
      },
    ],
    nowMs: NOW_MS,
  });

  assert.equal(snap.proRevenuePkr, 0);
  assert.equal(snap.plusRevenuePkr, 3591 + 399, 'Legacy Plus Annual (3,591) + Plus Monthly (399)');
  assert.equal(snap.proToPlusConversions, 1);
}

// 4. Active Plus user who previously had an approved Pro Annual payment (no planActivations doc)
{
  const snap = computePlanAnalyticsSnapshot({
    plansConfig: DEFAULT_PLANS_CONFIG,
    paymentRequests: [
      {
        id: 'pay_pro_prev',
        data: {
          status: 'approved',
          userId: 'u_upgraded',
          planId: 'pro_annual',
          amount_pkr: 1791,
        },
      },
    ],
    paidUsers: [
      {
        id: 'u_upgraded',
        data: {
          uid: 'u_upgraded',
          plan: 'plus',
          isPlus: true,
          plusUntil: FUTURE_30D_ISO,
        },
      },
    ],
    nowMs: NOW_MS,
  });

  assert.equal(snap.proRevenuePkr, 1791);
  assert.equal(snap.plusRevenuePkr, 399, '30-day active Plus pass resolves to Plus Monthly PKR 399');
  assert.equal(snap.proToPlusConversions, 1, 'User with approved Pro payment + active Plus counts as Pro -> Plus');
}

// 5. Respects live config/plans overrides when superAdmin updates pricing
{
  const snap = computePlanAnalyticsSnapshot({
    plansConfig: {
      ...DEFAULT_PLANS_CONFIG,
      plus: {
        ...DEFAULT_PLANS_CONFIG.plus,
        pricePkrMonthly: 499,
      },
      annualDiscountPercent: 25,
    },
    paidUsers: [
      {
        id: 'u_custom',
        data: {
          uid: 'u_custom',
          plan: 'plus',
          plusPlanId: 'plus_monthly',
          plusUntil: FUTURE_30D_ISO,
        },
      },
    ],
    nowMs: NOW_MS,
  });

  assert.equal(snap.plusRevenuePkr, 499, 'Uses live config/plans Plus monthly price');
}

console.log('ALL planAnalytics tests passed!');
