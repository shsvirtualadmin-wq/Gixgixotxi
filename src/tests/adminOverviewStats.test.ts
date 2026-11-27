import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  fetchLiveQuestionBankStats,
  getCachedLiveQuestionBankStats,
  invalidateLiveQuestionBankStatsCache,
} from '../services/universityMcqService';
import { fetchAdminWingmatesRadar } from '../services/rewardsService';

const originalFetch = globalThis.fetch;

async function runTests() {
  try {
    // 1. Cold load never hydrates stale sessionStorage for question bank stats
    invalidateLiveQuestionBankStatsCache();
    assert.equal(
      getCachedLiveQuestionBankStats(),
      null,
      'Cold load must return null so UI shows a loading skeleton instead of stale sessionStorage values'
    );

    // 2. Question bank strict mode rejects impossible (0 mcqs, 0 universities) payloads
    invalidateLiveQuestionBankStatsCache();
    let healthCalls = 0;
    globalThis.fetch = (async (_input: any, init?: RequestInit) => {
      healthCalls += 1;
      assert.equal(init?.cache, 'no-store', 'GET /api/mcqs/health must bypass browser HTTP cache');
      return new Response(
        JSON.stringify({
          ok: true,
          totalMcqs: 0,
          totalUniversities: 0,
          liveUniversities: 0,
          bySubject: {},
          byUniversity: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    await assert.rejects(
      () => fetchLiveQuestionBankStats({ force: true, strict: true }),
      /empty bank response/i,
      'Strict mode must reject an empty (0 MCQs, 0 universities) health response instead of rendering 0'
    );
    assert.equal(healthCalls, 1);

    // 3. Question bank reconciles totalMcqs against bySubject/byUniversity sums & retries transient 503
    invalidateLiveQuestionBankStatsCache();
    let retryAttempt = 0;
    globalThis.fetch = (async () => {
      retryAttempt += 1;
      if (retryAttempt === 1) {
        return new Response(JSON.stringify({ ok: false, error: 'Transient D1 lock' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          ok: true,
          totalMcqs: 0, // stale/zero top-level field
          totalUniversities: 12,
          liveUniversities: 10,
          bySubject: {
            Mathematics: 10000,
            Physics: 10000,
            Chemistry: 8046,
          },
          byUniversity: [{ id: 'fast', name: 'FAST-NUCES', slug: 'fast-nuces', mcqCount: 1530, total_mcqs: 1530 }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const bank = await fetchLiveQuestionBankStats({ force: true, strict: true });
    assert.equal(retryAttempt, 2, 'Transient 503 should automatically retry once');
    assert.equal(
      bank.totalMcqs,
      28046,
      'totalMcqs must reconcile to Math.max(rawTotal, subjectSum, uniSum) and never flash 0'
    );
    assert.equal(bank.totalUniversities, 12);
    assert.equal(bank.liveUniversities, 10);

    // 4. Wingmates Radar returns counters: null on error (never fake 0s)
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ ok: false, error: 'D1 unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const failedRadar = await fetchAdminWingmatesRadar();
    assert.equal(failedRadar.ok, false);
    assert.equal(failedRadar.counters, null, 'Failed Wingmates Radar must return null counters, not zeros');

    // 5. Wingmates Radar returns counters: null if ok:true payload omits counters
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ ok: true, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const missingCountersRadar = await fetchAdminWingmatesRadar();
    assert.equal(missingCountersRadar.ok, false);
    assert.equal(missingCountersRadar.counters, null, 'Missing counters payload must never fabricate zeros');

    // 6. Wingmates Radar retries transient 500 and returns live counters
    let radarAttempts = 0;
    globalThis.fetch = (async (_input: any, init?: RequestInit) => {
      radarAttempts += 1;
      assert.equal(init?.cache, 'no-store');
      if (radarAttempts === 1) {
        return new Response(JSON.stringify({ ok: false, error: 'Timeout' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          ok: true,
          counters: { practicingNow: 4, streakAtRisk: 3, inactive2PlusDays: 9 },
          items: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const okRadar = await fetchAdminWingmatesRadar();
    assert.equal(radarAttempts, 2);
    assert.equal(okRadar.ok, true);
    assert.deepEqual(okRadar.counters, {
      practicingNow: 4,
      streakAtRisk: 3,
      inactive2PlusDays: 9,
    });

    // 7. Static invariants: single authoritative data source, no fake 0/em-dash fallbacks
    const rootDir = process.cwd();
    const overviewSrc = fs.readFileSync(
      path.join(rootDir, 'src/pages/admin/AdminOverviewPage.tsx'),
      'utf8'
    );
    const adminServiceSrc = fs.readFileSync(
      path.join(rootDir, 'src/services/adminService.ts'),
      'utf8'
    );
    const usersPageSrc = fs.readFileSync(
      path.join(rootDir, 'src/pages/admin/AdminUsersPage.tsx'),
      'utf8'
    );

    assert.ok(
      overviewSrc.includes('fetchOverviewUsersAndPlansSnapshot'),
      'AdminOverviewPage must use unified fetchOverviewUsersAndPlansSnapshot'
    );
    assert.ok(
      !overviewSrc.includes('practicingNow: 0'),
      'AdminOverviewPage must never fabricate 0 Wingmates Radar counters'
    );
    assert.ok(
      !overviewSrc.includes('subjectCounts?.[subj] ?? 0'),
      'AdminOverviewPage must never fabricate 7 zero-count subject cards'
    );
    assert.ok(
      !adminServiceSrc.includes('d1AttemptsCount'),
      'adminService must not fall back from Firestore attempts to D1 d1AttemptsCount'
    );
    assert.ok(
      !adminServiceSrc.includes('ADMIN_OVERVIEW_USERS_SESSION_KEY'),
      'adminService must not hydrate Overview cards from cross-reload sessionStorage'
    );
    assert.ok(
      !usersPageSrc.includes("isInitialLoading ? '—'"),
      'AdminUsersPage must show a loading skeleton instead of an em-dash while loading'
    );

    console.log('✓ All Admin Overview stat consistency & strict-loading tests passed!');
  } finally {
    globalThis.fetch = originalFetch;
    invalidateLiveQuestionBankStatsCache();
  }
}

void runTests();
