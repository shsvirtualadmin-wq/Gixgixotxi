import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_PLANS_CONFIG,
  PLUS_ALREADY_INCLUDES_PRO_MSG,
  planRank,
  normalizePlanTier,
  getPlan,
  hasAtLeast,
  isPaid,
  plusAndAbove,
  isPlus,
  isProOnly,
  computeAnnualPrice,
  computeProToPlusCreditDays,
  resolveEffectiveCrewPlan,
  getEffectiveUserPlan,
  getDailyAiCreditsForPlan,
  normalizePlansConfig,
  getPlanTierFromPlanId,
  getBillingFromPlanId,
} from '../lib/planTier';
import {
  buildPlansCatalog,
  getPlanById,
  resolveUnifiedPlanStatus,
} from '../config/plans';
import {
  getDailyCreditsLimit,
  isDepthAllowedForPlan,
  FREE_AI_CREDITS_PER_DAY,
  PRO_AI_CREDITS_PER_DAY,
  PLUS_AI_CREDITS_PER_DAY,
} from '../utils/aiMentorsLogic';
import {
  handleEconomyApiRequest,
  seedEconomyFallbackDocForTest,
  deleteEconomyFallbackDocForTest,
  getEconomyFallbackDocForTest,
} from '../../functions/api/economy/[[path]]';

const NOW = Date.parse('2026-11-19T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const FUTURE_15D = new Date(NOW + 15 * DAY_MS).toISOString();
const FUTURE_30D = new Date(NOW + 30 * DAY_MS).toISOString();
const PAST_5D = new Date(NOW - 5 * DAY_MS).toISOString();

test('1. Plan hierarchy & shared helper functions (free < pro < plus, superadmin highest)', () => {
  assert.equal(planRank('free'), 0);
  assert.equal(planRank('pro'), 1);
  assert.equal(planRank('plus'), 2);
  assert.ok(planRank('free') < planRank('pro'));
  assert.ok(planRank('pro') < planRank('plus'));

  assert.equal(normalizePlanTier('plus_annual'), 'plus');
  assert.equal(normalizePlanTier('pro_monthly'), 'pro');
  assert.equal(normalizePlanTier('premium'), 'pro');
  assert.equal(normalizePlanTier('free'), 'free');
  assert.equal(normalizePlanTier(null), 'free');

  const freeUser = { plan: 'free' };
  const proUser = { plan: 'pro', isPremium: true, planExpiresAt: FUTURE_15D };
  const plusUser = { plan: 'plus', isPlus: true, plusUntil: FUTURE_30D };
  const superAdmin = { role: 'super_admin', plan: 'free' };

  assert.equal(getPlan(freeUser, NOW), 'free');
  assert.equal(getPlan(proUser, NOW), 'pro');
  assert.equal(getPlan(plusUser, NOW), 'plus');
  assert.equal(getPlan(superAdmin, NOW), 'plus');

  assert.equal(hasAtLeast(freeUser, 'pro', NOW), false);
  assert.equal(hasAtLeast(proUser, 'pro', NOW), true);
  assert.equal(hasAtLeast(proUser, 'plus', NOW), false);
  assert.equal(hasAtLeast(plusUser, 'pro', NOW), true);
  assert.equal(hasAtLeast(plusUser, 'plus', NOW), true);
  assert.equal(hasAtLeast(superAdmin, 'plus', NOW), true);

  assert.equal(isPaid(freeUser, NOW), false);
  assert.equal(isPaid(proUser, NOW), true);
  assert.equal(isPaid(plusUser, NOW), true);
  assert.equal(plusAndAbove(proUser, NOW), false);
  assert.equal(plusAndAbove(plusUser, NOW), true);
  assert.equal(isPlus(plusUser, NOW), true);
  assert.equal(isProOnly(proUser, NOW), true);
  assert.equal(isProOnly(plusUser, NOW), false);
});

test('2. Expiry behavior: expired Pro -> Free; expired Plus -> directly Free (NEVER falls back to Pro)', () => {
  const expiredPro = { plan: 'pro', isPremium: true, planExpiresAt: PAST_5D };
  const expiredPlus = {
    plan: 'plus',
    planTier: 'plus',
    isPlus: true,
    isPro: false,
    isPremium: true,
    plusUntil: PAST_5D,
    planExpiresAt: PAST_5D,
  };
  const expiredPlusWithStaleProFlag = {
    plan: 'plus',
    isPlus: true,
    isPro: true,
    isPremium: true,
    plusUntil: PAST_5D,
    proUntil: FUTURE_15D, // stale proUntil must NOT revive expired Plus into Pro
    planExpiresAt: PAST_5D,
  };

  assert.equal(getPlan(expiredPro, NOW), 'free');
  assert.equal(isPaid(expiredPro, NOW), false);

  assert.equal(getPlan(expiredPlus, NOW), 'free');
  assert.equal(hasAtLeast(expiredPlus, 'pro', NOW), false);
  assert.equal(getPlan(expiredPlusWithStaleProFlag, NOW), 'free');
  assert.equal(hasAtLeast(expiredPlusWithStaleProFlag, 'pro', NOW), false);

  const unifiedExpiredPlus = resolveUnifiedPlanStatus({
    uid: 'u_exp_plus',
    plan: 'plus',
    isPlus: true,
    isPremium: true,
    plusUntil: PAST_5D,
    planExpiresAt: PAST_5D,
    nowMs: NOW,
  });
  assert.equal(unifiedExpiredPlus.state, 'none');
  assert.equal(unifiedExpiredPlus.planTier, 'free');
  assert.equal(unifiedExpiredPlus.isPaid, false);
  assert.equal(unifiedExpiredPlus.isPlus, false);
});

test('3. Legacy Pro user backwards compatibility (existing Pro fields unaffected)', () => {
  const legacyPro = {
    uid: 'u_legacy_pro',
    plan: 'pro',
    isPremium: true,
    proPlanId: 'pro_monthly',
    planExpiresAt: FUTURE_15D,
  };
  assert.equal(getPlan(legacyPro, NOW), 'pro');
  assert.equal(hasAtLeast(legacyPro, 'pro', NOW), true);
  assert.equal(plusAndAbove(legacyPro, NOW), false);

  const unified = resolveUnifiedPlanStatus({
    ...legacyPro,
    nowMs: NOW,
  });
  assert.equal(unified.state, 'active');
  assert.equal(unified.planTier, 'pro');
  assert.equal(unified.isPro, true);
  assert.equal(unified.isPlus, false);
  assert.equal(unified.isPaid, true);
  assert.equal(getDailyAiCreditsForPlan(unified.planTier, DEFAULT_PLANS_CONFIG), 50);
});

test('4. Pricing, annual -25% discount & Pro -> Plus credit day conversion', () => {
  assert.equal(DEFAULT_PLANS_CONFIG.free.aiCreditsPerDay, 5);
  assert.equal(DEFAULT_PLANS_CONFIG.pro.pricePkrMonthly, 199);
  assert.equal(DEFAULT_PLANS_CONFIG.pro.priceKobansMonthly, 1990);
  assert.equal(DEFAULT_PLANS_CONFIG.pro.aiCreditsPerDay, 50);
  assert.equal(DEFAULT_PLANS_CONFIG.plus.pricePkrMonthly, 399);
  assert.equal(DEFAULT_PLANS_CONFIG.plus.priceKobansMonthly, 3990);
  assert.equal(DEFAULT_PLANS_CONFIG.plus.aiCreditsPerDay, 100);
  assert.equal(DEFAULT_PLANS_CONFIG.annualDiscountPercent, 25);

  assert.equal(computeAnnualPrice(199, 25), 1791);
  assert.equal(computeAnnualPrice(1990, 25), 17910);
  assert.equal(computeAnnualPrice(399, 25), 3591);
  assert.equal(computeAnnualPrice(3990, 25), 35910);

  const catalog = buildPlansCatalog(DEFAULT_PLANS_CONFIG);
  assert.equal(catalog.pro_monthly.price_pkr, 199);
  assert.equal(catalog.pro_annual.price_pkr, 1791);
  assert.equal(catalog.plus_monthly.price_pkr, 399);
  assert.equal(catalog.plus_annual.price_pkr, 3591);
  assert.equal(catalog.plus_annual.price_kobans, 35910);

  // Admin custom config dynamically updates catalog
  const customCfg = normalizePlansConfig({
    pro: { pricePkrMonthly: 250, priceKobansMonthly: 2500, aiCreditsPerDay: 60 },
    plus: { pricePkrMonthly: 500, priceKobansMonthly: 5000, aiCreditsPerDay: 120 },
    annualDiscountPercent: 20,
  });
  assert.equal(getPlanById('plus_monthly', customCfg).price_pkr, 500);
  assert.equal(getPlanById('plus_annual', customCfg).price_pkr, 4800);

  // Pro -> Plus credit day conversion: Math.floor(remainingProDays * proPrice / plusPrice)
  assert.equal(computeProToPlusCreditDays(15, 199, 399), Math.floor((15 * 199) / 399)); // 7
  assert.equal(computeProToPlusCreditDays(30, 199, 399), Math.floor((30 * 199) / 399)); // 14
  assert.equal(computeProToPlusCreditDays(0, 199, 399), 0);
  assert.equal(computeProToPlusCreditDays(-5, 199, 399), 0);
  assert.equal(getPlanTierFromPlanId('plus_annual'), 'plus');
  assert.equal(getBillingFromPlanId('plus_annual'), 'annual');
});

test('5. Nakama Crew shared plan resolution (highest tier wins: Plus > Pro > Free)', () => {
  const crewWithPlus = {
    members: [
      { uid: 'm1', plan: 'free' },
      { uid: 'm2', plan: 'pro', planExpiresAt: FUTURE_15D },
      { uid: 'm3', plan: 'plus', plusUntil: FUTURE_30D },
    ],
  };
  const crewWithExpiredPlus = {
    members: [
      { uid: 'm1', plan: 'free' },
      { uid: 'm2', plan: 'pro', planExpiresAt: FUTURE_15D },
      { uid: 'm3', plan: 'plus', plusUntil: PAST_5D, planExpiresAt: PAST_5D },
    ],
  };
  const crewFreeOnly = {
    members: [{ uid: 'm1', plan: 'free' }],
  };

  assert.equal(resolveEffectiveCrewPlan(crewWithPlus, NOW), 'plus');
  assert.equal(resolveEffectiveCrewPlan(crewWithExpiredPlus, NOW), 'pro');
  assert.equal(resolveEffectiveCrewPlan(crewFreeOnly, NOW), 'free');

  // Free student inside a Plus crew inherits Plus (100 AI/day)
  const effectiveForFreeInPlusCrew = getEffectiveUserPlan({ plan: 'free' }, crewWithPlus, NOW);
  assert.equal(effectiveForFreeInPlusCrew, 'plus');
  assert.equal(getDailyAiCreditsForPlan(effectiveForFreeInPlusCrew, DEFAULT_PLANS_CONFIG), 100);
});

test('6. AI Mentors credit limits & depth gating (Free 5/day Quick+Balanced, Pro 50/day, Plus 100/day, config overrides)', () => {
  assert.equal(FREE_AI_CREDITS_PER_DAY, 5);
  assert.equal(PRO_AI_CREDITS_PER_DAY, 50);
  assert.equal(PLUS_AI_CREDITS_PER_DAY, 100);

  assert.equal(getDailyCreditsLimit('free'), 5);
  assert.equal(getDailyCreditsLimit('pro'), 50);
  assert.equal(getDailyCreditsLimit('plus'), 100);
  assert.equal(
    getDailyCreditsLimit('plus', { plus: { aiCreditsPerDay: 150 } }),
    150
  );

  // Depth 0 = Quick, 1 = Balanced, 2 = Deep, 3 = Max
  assert.equal(isDepthAllowedForPlan(0, 'free'), true);
  assert.equal(isDepthAllowedForPlan(1, 'free'), true);
  assert.equal(isDepthAllowedForPlan(2, 'free'), false);
  assert.equal(isDepthAllowedForPlan(3, 'free'), false);
  assert.equal(isDepthAllowedForPlan(2, 'pro'), true);
  assert.equal(isDepthAllowedForPlan(3, 'pro'), true);
  assert.equal(isDepthAllowedForPlan(2, 'plus'), true);
  assert.equal(isDepthAllowedForPlan(3, 'plus'), true);
});

test('7. Server /api/pro/purchase-kobans: blocks Plus->Pro with exact message, credits Pro->Plus, extends Plus renewal', async () => {
  const uidPlus = 'test_plus_guard_uid';
  const uidPro = 'test_pro_upgrade_uid';

  const makeVerifier = (uid: string) => async () => ({
    uid,
    email: `${uid}@boardly.test`,
    name: 'Test Student',
    emailVerified: true,
    role: 'student',
    captain: false,
    admin: false,
    superAdmin: false,
    isSuperAdmin: false,
    isAdminOrAbove: false,
  });

  try {
    // Case A: Plus user tries to buy Pro -> 409 with exact message
    seedEconomyFallbackDocForTest(`users/${uidPlus}`, {
      uid: uidPlus,
      plan: 'plus',
      planTier: 'plus',
      isPlus: true,
      isPremium: true,
      plusUntil: new Date(Date.now() + 20 * DAY_MS).toISOString(),
      planExpiresAt: new Date(Date.now() + 20 * DAY_MS).toISOString(),
      kobans: 10000,
    });
    seedEconomyFallbackDocForTest(`wallets/${uidPlus}`, { balance: 10000 });

    const blockRes = await handleEconomyApiRequest({
      request: new Request('http://localhost/api/pro/purchase-kobans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
        body: JSON.stringify({ planId: 'pro_monthly', idempotencyKey: 't_block_1' }),
      }),
      env: {},
      tokenVerifierOverride: makeVerifier(uidPlus),
    });
    assert.equal(blockRes.status, 409);
    const blockJson = (await blockRes.json()) as any;
    assert.equal(blockJson.code, 'PLUS_ALREADY_INCLUDES_PRO');
    assert.equal(blockJson.error, PLUS_ALREADY_INCLUDES_PRO_MSG);
    assert.equal(blockJson.error, 'You already have Plus, which includes Pro');

    // Case B: Pro user with 15 days left upgrades to Plus Monthly -> 30 + 7 = 37 days, 3990 Kobans deducted
    seedEconomyFallbackDocForTest(`users/${uidPro}`, {
      uid: uidPro,
      plan: 'pro',
      planTier: 'pro',
      isPro: true,
      isPremium: true,
      proUntil: new Date(Date.now() + 15 * DAY_MS).toISOString(),
      planExpiresAt: new Date(Date.now() + 15 * DAY_MS).toISOString(),
      kobans: 5000,
    });
    seedEconomyFallbackDocForTest(`wallets/${uidPro}`, { balance: 5000 });

    const upgRes = await handleEconomyApiRequest({
      request: new Request('http://localhost/api/pro/purchase-kobans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
        body: JSON.stringify({ planId: 'plus_monthly', idempotencyKey: 't_upg_1' }),
      }),
      env: {},
      tokenVerifierOverride: makeVerifier(uidPro),
    });
    assert.equal(upgRes.status, 200);
    const upgJson = (await upgRes.json()) as any;
    assert.equal(upgJson.ok, true);
    assert.equal(upgJson.planTier, 'plus');
    assert.equal(upgJson.upgradedFromPro, true);
    assert.equal(upgJson.proCreditDays, 7);
    assert.equal(upgJson.durationDays, 37);
    assert.equal(upgJson.kobansSpent, 3990);
    assert.equal(upgJson.newBalance, 1010);

    const updatedUser = getEconomyFallbackDocForTest(`users/${uidPro}`);
    assert.equal(updatedUser?.plan, 'plus');
    assert.equal(updatedUser?.isPlus, true);
    assert.equal(updatedUser?.isPro, false);
    assert.equal(updatedUser?.plusPlanId, 'plus_monthly');
  } finally {
    deleteEconomyFallbackDocForTest(`users/${uidPlus}`);
    deleteEconomyFallbackDocForTest(`wallets/${uidPlus}`);
    deleteEconomyFallbackDocForTest(`users/${uidPro}`);
    deleteEconomyFallbackDocForTest(`wallets/${uidPro}`);
  }
});

test('8. Firestore security rules: config/plans before wildcard & protected Plus/AI fields', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesText = fs.readFileSync(rulesPath, 'utf8');

  const configPlansIdx = rulesText.indexOf('match /config/plans');
  const configWildcardIdx = rulesText.indexOf('match /config/{docId}');
  assert.ok(configPlansIdx > 0, 'match /config/plans must exist in firestore.rules');
  assert.ok(configWildcardIdx > 0, 'match /config/{docId} must exist in firestore.rules');
  assert.ok(
    configPlansIdx < configWildcardIdx,
    'match /config/plans MUST appear before match /config/{docId}'
  );

  for (const protectedKey of [
    "'plan'",
    "'planTier'",
    "'isPro'",
    "'isPlus'",
    "'proUntil'",
    "'plusUntil'",
    "'planExpiresAt'",
    "'kobans'",
    "'aiUsage'",
    "'aiCreditsUsed'",
  ]) {
    assert.ok(
      rulesText.includes(protectedKey),
      `firestore.rules must block client writes to ${protectedKey}`
    );
  }
});
