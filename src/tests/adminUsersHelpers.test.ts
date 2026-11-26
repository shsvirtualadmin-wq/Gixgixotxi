import assert from 'node:assert/strict';
import {
  computeUsersPagination,
  computeConsecutivePktStreak,
  extractProfileSolvedCount,
  extractProfileStreakCount,
  extractAttemptSolvedCount,
  mergeUserActivityMetrics,
} from '../lib/adminUsersHelpers';

// 1. Pagination: 93 users at 20 per page with initial 24 loaded and hasMore=true -> Page 1 of 5
{
  const res = computeUsersPagination({
    loadedFilteredCount: 24,
    totalDirectoryCount: 93,
    hasMore: true,
    hasActiveFilters: false,
    currentPage: 1,
    pageSize: 20,
  });
  assert.equal(res.effectiveTotal, 93);
  assert.equal(res.totalPages, 5);
  assert.equal(res.safePage, 1);
  assert.equal(res.startIndex, 1);
  assert.equal(res.endIndex, 20);
  assert.deepEqual(res.visiblePages, [1, 2, 3, 4, 5]);
}

// 2. Pagination: Page 5 of 93 users -> Showing 81–93
{
  const res = computeUsersPagination({
    loadedFilteredCount: 93,
    totalDirectoryCount: 93,
    hasMore: false,
    hasActiveFilters: false,
    currentPage: 5,
    pageSize: 20,
  });
  assert.equal(res.effectiveTotal, 93);
  assert.equal(res.totalPages, 5);
  assert.equal(res.safePage, 5);
  assert.equal(res.startIndex, 81);
  assert.equal(res.endIndex, 93);
  assert.deepEqual(res.visiblePages, [1, 2, 3, 4, 5]);
}

// 3. Pagination: Once all pages are loaded (!hasMore), snap to exact loaded count
{
  const res = computeUsersPagination({
    loadedFilteredCount: 91,
    totalDirectoryCount: 93,
    hasMore: false,
    hasActiveFilters: false,
    currentPage: 5,
    pageSize: 20,
  });
  assert.equal(res.effectiveTotal, 91);
  assert.equal(res.totalPages, 5);
  assert.equal(res.startIndex, 81);
  assert.equal(res.endIndex, 91);
}

// 4. Pagination: Active filter uses matching count only
{
  const res = computeUsersPagination({
    loadedFilteredCount: 12,
    totalDirectoryCount: 93,
    hasMore: false,
    hasActiveFilters: true,
    currentPage: 2,
    pageSize: 20,
  });
  assert.equal(res.effectiveTotal, 12);
  assert.equal(res.totalPages, 1);
  assert.equal(res.safePage, 1);
  assert.equal(res.startIndex, 1);
  assert.equal(res.endIndex, 12);
  assert.deepEqual(res.visiblePages, [1]);
}

// 5. Pagination: Large page count uses compact ellipsis window
{
  const res = computeUsersPagination({
    loadedFilteredCount: 20,
    totalDirectoryCount: 250,
    hasMore: true,
    hasActiveFilters: false,
    currentPage: 6,
    pageSize: 20,
  });
  assert.equal(res.totalPages, 13);
  assert.deepEqual(res.visiblePages, [1, 'ellipsis', 5, 6, 7, 'ellipsis', 13]);
}

// 6. Consecutive PKT streak calculation
{
  // Fixed timestamp: 2026-05-10 15:00:00 UTC -> 2026-05-10 20:00:00 PKT
  const nowMs = Date.UTC(2026, 4, 10, 15, 0, 0);
  assert.equal(
    computeConsecutivePktStreak(['2026-05-10', '2026-05-09', '2026-05-08', '2026-05-06'], nowMs),
    3
  );
  // Active yesterday still maintains streak
  assert.equal(
    computeConsecutivePktStreak(['2026-05-09', '2026-05-08'], nowMs),
    2
  );
  // Last active 2 days ago breaks streak
  assert.equal(
    computeConsecutivePktStreak(['2026-05-08', '2026-05-07'], nowMs),
    0
  );
}

// 7. Real activity merge: empty users/{uid} doc + Firestore attempts + D1 Grand Line attempts
{
  const nowMs = Date.UTC(2026, 4, 10, 15, 0, 0);
  const merged = mergeUserActivityMetrics({
    user: { uid: 'u1', displayName: 'Test Student' },
    publicProfile: null,
    firestoreAttempts: [
      { solved: 15, pktDate: '2026-05-10' },
      { solved: 20, pktDate: '2026-05-09' },
    ],
    d1Activity: {
      solved: 40,
      testAttemptsSolved: 40,
      dailyUsageSolved: 35, // overlaps with Firestore practice attempts, must not double-count
      guestSolved: 0,
      streak: 0,
      activeDates: ['2026-05-08'],
    },
    nowMs,
  });
  assert.equal(merged.totalQuestionsSolved, 75); // 35 (Firestore) + 40 (D1 Grand Line)
  assert.equal(merged.streak, 3); // 05-10, 05-09, 05-08
}

// 8. Real activity merge: publicProfile fallback stats
{
  assert.equal(
    extractProfileSolvedCount({ stats: { mcqs: 142 } }),
    142
  );
  assert.equal(
    extractProfileStreakCount({ publicStats: { streak: 7 } }),
    7
  );
  assert.equal(
    extractAttemptSolvedCount({ status: 'completed', correctAnswers: 18, wrongAnswers: 7 }),
    25
  );
  const merged = mergeUserActivityMetrics({
    user: { uid: 'u2' },
    publicProfile: { stats: { mcqs: 120 }, publicStats: { streak: 5 } },
  });
  assert.equal(merged.totalQuestionsSolved, 120);
  assert.equal(merged.streak, 5);
}

// 9. User with genuinely zero activity returns 0 and 0
{
  const merged = mergeUserActivityMetrics({
    user: { uid: 'u3' },
  });
  assert.equal(merged.totalQuestionsSolved, 0);
  assert.equal(merged.streak, 0);
}

console.log('All adminUsersHelpers tests passed.');
