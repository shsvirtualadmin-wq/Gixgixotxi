import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  fetchLiveQuestionBankStats,
  getCachedLiveQuestionBankStats,
  invalidateLiveQuestionBankStatsCache,
} from '../services/universityMcqService';
import { fetchAdminWingmatesRadar } from '../services/rewardsService';
import { countCollectionViaFirestoreRest } from '../services/firestoreRestCount';

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

    // 2b. Question bank strict mode re-verifies and rejects contradictory (0 mcqs, liveUniversities > 0) payloads
    invalidateLiveQuestionBankStatsCache();
    let contradictoryCalls = 0;
    globalThis.fetch = (async () => {
      contradictoryCalls += 1;
      return new Response(
        JSON.stringify({
          ok: true,
          totalMcqs: 0,
          totalUniversities: 14,
          liveUniversities: 10,
          bySubject: {},
          byUniversity: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    await assert.rejects(
      () => fetchLiveQuestionBankStats({ force: true, strict: true }),
      /contradictory zero total/i,
      'Strict mode must reject 0 MCQs when liveUniversities > 0'
    );
    assert.equal(contradictoryCalls, 2, 'Suspicious 0 should trigger one cache-busted re-verification');

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

    // 3b. Question bank rejects a transient 0 regression after a positive count was observed
    let regressionCalls = 0;
    globalThis.fetch = (async () => {
      regressionCalls += 1;
      return new Response(
        JSON.stringify({
          ok: true,
          totalMcqs: 0,
          totalUniversities: 12,
          liveUniversities: 0,
          bySubject: {},
          byUniversity: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    await assert.rejects(
      () => fetchLiveQuestionBankStats({ force: true, strict: true }),
      /transiently returned 0/i,
      'Strict mode must reject a transient 0 after a positive question bank total was observed'
    );
    assert.equal(regressionCalls, 2, 'Regressive 0 must trigger cache-busted re-verification before failing');

    // 3c. Question bank recognizes mcqCount / total_mcqs aliases when bySubject is empty
    invalidateLiveQuestionBankStatsCache();
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          totalMcqs: 0,
          totalUniversities: 2,
          liveUniversities: 2,
          bySubject: {},
          byUniversity: [
            { id: 'u1', name: 'NUST', slug: 'nust', mcqCount: 14000 },
            { id: 'u2', name: 'FAST', slug: 'fast', total_mcqs: 14046 },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const aliasBank = await fetchLiveQuestionBankStats({ force: true, strict: true });
    assert.equal(aliasBank.totalMcqs, 28046, 'byUniversity mcqCount/total_mcqs aliases must reconcile totalMcqs');

    // 3d. Firestore REST count must throw on malformed non-array or error-containing :runQuery payloads (never return 0)
    await assert.rejects(
      () =>
        countCollectionViaFirestoreRest({
          collectionId: 'users',
          getToken: async () => 'fake-token',
          fetchImpl: (async (url: any) => {
            if (String(url).includes(':runAggregationQuery')) {
              return new Response(JSON.stringify({ unexpected: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            return new Response(JSON.stringify({ error: { code: 500, status: 'INTERNAL', message: 'Boom' } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as typeof fetch,
        }),
      /Malformed query response/i,
      'Non-array :runQuery responses must throw instead of silently returning 0'
    );

    await assert.rejects(
      () =>
        countCollectionViaFirestoreRest({
          collectionId: 'users',
          getToken: async () => 'fake-token',
          fetchImpl: (async (url: any) => {
            if (String(url).includes(':runAggregationQuery')) {
              return new Response(JSON.stringify({ unexpected: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            return new Response(
              JSON.stringify([{ error: { code: 503, status: 'UNAVAILABLE', message: 'Transient backend error' } }]),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }) as typeof fetch,
        }),
      /Transient backend error/i,
      'Row-level error inside HTTP 200 :runQuery array must throw instead of returning 0'
    );

    // 3e. Firestore REST count falls back to index-free masked GET listDocuments for attempts (with pagination)
    let attemptsListCalls = 0;
    const attemptsRes = await countCollectionViaFirestoreRest({
      collectionId: 'attempts',
      timeoutMs: 250,
      pageSize: 2,
      maxPages: 5,
      getToken: async () => 'fake-token',
      fetchImpl: (async (url: any, init?: RequestInit) => {
        const u = String(url);
        if (u.includes(':runAggregationQuery') || u.includes(':runQuery')) {
          return new Response(
            JSON.stringify({ error: { code: 504, status: 'DEADLINE_EXCEEDED', message: 'Timed out' } }),
            { status: 504, headers: { 'Content-Type': 'application/json' } }
          );
        }
        assert.equal(init?.method, 'GET', 'Strategy 3 must use GET documents.list');
        assert.ok(u.includes('/documents/attempts?'), 'Must query attempts collection');
        assert.ok(u.includes('mask.fieldPaths=__name__'), 'Unfiltered listDocuments must mask to __name__ only');
        attemptsListCalls += 1;
        if (attemptsListCalls === 1) {
          return new Response(
            JSON.stringify({
              documents: [{ name: 'p/d/documents/attempts/a1' }, { name: 'p/d/documents/attempts/a2' }],
              nextPageToken: 'tok-2',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        assert.ok(u.includes('pageToken=tok-2'), 'Second page must send nextPageToken');
        return new Response(
          JSON.stringify({
            documents: [{ name: 'p/d/documents/attempts/a3' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as typeof fetch,
    });
    assert.equal(attemptsRes.count, 3);
    assert.equal(attemptsRes.strategy, 'rest_filtered_scan');
    assert.equal(attemptsListCalls, 2);

    // 3f. Firestore REST count falls back to masked GET listDocuments for filtered reviews (status == pending)
    let reviewsListCalls = 0;
    const reviewsRes = await countCollectionViaFirestoreRest({
      collectionId: 'reviews',
      filter: { fieldPath: 'status', stringValue: 'pending' },
      timeoutMs: 250,
      pageSize: 50,
      maxPages: 5,
      getToken: async () => 'fake-token',
      fetchImpl: (async (url: any, init?: RequestInit) => {
        const u = String(url);
        if (u.includes(':runAggregationQuery') || u.includes(':runQuery')) {
          return new Response(
            JSON.stringify({ error: { code: 504, status: 'DEADLINE_EXCEEDED', message: 'Timed out' } }),
            { status: 504, headers: { 'Content-Type': 'application/json' } }
          );
        }
        assert.equal(init?.method, 'GET');
        assert.ok(u.includes('/documents/reviews?'), 'Must query reviews collection');
        assert.ok(u.includes('mask.fieldPaths=status'), 'Filtered listDocuments must mask to status field only');
        reviewsListCalls += 1;
        return new Response(
          JSON.stringify({
            documents: [
              { name: 'p/d/documents/reviews/r1', fields: { status: { stringValue: 'pending' } } },
              { name: 'p/d/documents/reviews/r2', fields: { status: { stringValue: 'approved' } } },
              { name: 'p/d/documents/reviews/r3', fields: { status: { stringValue: 'Pending' } } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as typeof fetch,
    });
    assert.equal(reviewsRes.count, 2, 'Filtered listDocuments fallback must count only pending reviews');
    assert.equal(reviewsRes.strategy, 'rest_filtered_scan');
    assert.equal(reviewsListCalls, 1);

    // 3g. Firestore REST count never emits error code "200" or "OK" even when error body carries code 200
    let capturedErr: any = null;
    try {
      await countCollectionViaFirestoreRest({
        collectionId: 'attempts',
        timeoutMs: 250,
        getToken: async () => 'fake-token',
        fetchImpl: (async () =>
          new Response(JSON.stringify([{ error: { code: 200, status: 'OK', message: 'Strange proxy error' } }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })) as typeof fetch,
      });
    } catch (err) {
      capturedErr = err;
    }
    assert.ok(capturedErr, 'Error payload with code 200 must still reject');
    assert.notEqual(String(capturedErr.code), '200');
    assert.notEqual(String(capturedErr.code).toUpperCase(), 'OK');
    assert.notEqual(String(capturedErr.code).toUpperCase(), 'HTTP_200');

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

    // 7. Static invariants: single authoritative data source, no fake 0/em-dash fallbacks, server-only reads, resilient retries & toast hygiene
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
    const apiSrc = fs.readFileSync(
      path.join(rootDir, 'src/lib/api.ts'),
      'utf8'
    );
    const certServiceSrc = fs.readFileSync(
      path.join(rootDir, 'src/services/certificateService.ts'),
      'utf8'
    );
    const workerSrc = fs.readFileSync(
      path.join(rootDir, 'cloudflare/worker.ts'),
      'utf8'
    );

    assert.ok(
      overviewSrc.includes('fetchOverviewUsersAndPlansSnapshot'),
      'AdminOverviewPage must use unified fetchOverviewUsersAndPlansSnapshot'
    );
    assert.ok(
      overviewSrc.includes('rewardsHealthLoading') && overviewSrc.includes('rewardsModeLoading'),
      'AdminOverviewPage must show loading skeletons for Rewards mode and Firestore Credit Health'
    );
    assert.ok(
      overviewSrc.includes('normalizeErrorStatus') && overviewSrc.includes("upper === '200'"),
      'AdminOverviewPage must sanitize HTTP 200 error statuses so cards never display Error (200)'
    );
    assert.ok(
      overviewSrc.includes('clearGenericErrorToasts'),
      'AdminOverviewPage must clear generic error toasts when Overview reads succeed'
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
      adminServiceSrc.includes('getDocsFromServer'),
      'adminService must use getDocsFromServer so persistentLocalCache never returns partial subsets'
    );
    assert.ok(
      adminServiceSrc.includes('getDocsWithTimeoutAndRetry'),
      'adminService must use timeout+retry helper for bounded Firestore reads including reviews and attempts'
    );
    assert.ok(
      !adminServiceSrc.includes('d1AttemptsCount'),
      'adminService must not fall back from Firestore attempts to D1 d1AttemptsCount'
    );
    assert.ok(
      !adminServiceSrc.includes('ADMIN_OVERVIEW_USERS_SESSION_KEY') &&
        !adminServiceSrc.includes('ADMIN_USERS_P1_SESSION_KEY'),
      'adminService must not hydrate Overview or Users directory from cross-reload sessionStorage'
    );
    assert.ok(
      apiSrc.includes('isPageUnloading') &&
        apiSrc.includes("rawSilentErrorToast !== undefined ? rawSilentErrorToast : method === 'GET'"),
      'api.ts must suppress generic toasts for read-only GETs by default and during page unload'
    );
    assert.ok(
      certServiceSrc.includes('silentErrorToast: true'),
      'certificateService GET calls must pass silentErrorToast: true to prevent prefetch error toasts'
    );
    assert.ok(
      !usersPageSrc.includes("isInitialLoading ? '—'"),
      'AdminUsersPage must show a loading skeleton instead of an em-dash while loading'
    );
    assert.ok(
      usersPageSrc.includes("Unable to load users"),
      'AdminUsersPage must never show "Showing 0 users" when directory fetch failed'
    );
    const healthRouteBlock = workerSrc.slice(
      workerSrc.indexOf("path === '/api/mcqs/health'"),
      workerSrc.indexOf("path === '/api/mcqs/health'") + 3000
    );
    assert.ok(
      !healthRouteBlock.includes('recalculateAllD1UniCounts'),
      'GET /api/mcqs/health in cloudflare/worker.ts must be read-only and never run bulk UPDATE writes'
    );

    console.log('✓ All Admin Overview stat consistency, resilience & toast hygiene tests passed!');
  } finally {
    globalThis.fetch = originalFetch;
    invalidateLiveQuestionBankStatsCache();
  }
}

void runTests();
