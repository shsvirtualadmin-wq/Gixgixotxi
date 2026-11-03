# Boardly — Grand Line 404 Fix & Site-Wide Performance Optimization (`PROGRESS_grandline_perf.md`)

**Status:** COMPLETE & VERIFIED  
**Viewport Tested:** `390×844` (Light & Dark themes)  
**Throttling Profile:** Slow 4G (`150ms` RTT, `1.6 Mbps` down, `750 Kbps` up) + `4×` CPU slowdown  

---

## PART B: Grand Line Test 404 Fix & "Attempted" State + PDF Export

### B1. Discovery — Route Map, Components, Endpoints & One-Attempt Storage

1. **Client Routes (`/src/App.tsx`)**:
   - `/grand-line` (`GrandLinePage.tsx`) — Public hub listing all Grand Line tests, global leaderboard, and per-test result modal.
   - `/grand-line/about` (`GrandLineAboutPage.tsx`) — About Grand Line.
   - `/grand-line/leaderboard` (`GrandLineLeaderboardPage.tsx`) — Standalone Grand Line leaderboard.
   - `/grand-line/test/:testId` & `/grand-line/tests/:testId` (`GrandLineTestInfoPage.tsx`) — Test overview page.
   - `/grand-line/test/:testId/run` & `/grand-line/tests/:testId/run` (`GrandLineTestRunnerPage.tsx`) — Timed MCQ runner & post-test results screen.
   - `/grand-line/test/:testId/result` & `/grand-line/tests/:testId/result` (`GrandLineTestRunnerPage.tsx` with `resultOnly={true}`) — Direct result view for a completed test.
   - **Added Route Aliases (`/src/App.tsx`)**:
     - `/grand-line/test/:testId/redo`, `/grand-line/test/:testId/retake`, `/grand-line/tests/:testId/redo`, `/grand-line/tests/:testId/retake`
     - `/tests/:testId`, `/tests/:testId/run`, `/tests/:testId/result`, `/tests/:testId/redo`, `/tests/:testId/retake`
   - **Other Surfaces Showing Grand Line Tests**:
     - `/captains/:idSlug` (`CaptainPublicProfilePage.tsx`) — Captain public profile listing their published Grand Line tests.
     - `/dashboard/results` (`ResultsListPage.tsx`) — Student's past results list (includes Grand Line attempts).

2. **Server / Worker API Endpoints (`/src/server/cloudflarePostsAndAuthRouter.ts` & `/cloudflare/worker.js`)**:
   - `GET /api/tests/public` — Lists published public tests.
   - `GET /api/tests/:id?view=info` — Returns test metadata (`test`), `alreadyAttempted: boolean`, and `myAttempt` (including `gradedQuestions`) when the user has already attempted the test.
   - `GET /api/tests/:id` — Starts/loads test questions for the runner. Enforces the 1-attempt-per-user rule on the server: returns **HTTP `409`** with `{ error, code: "ALREADY_ATTEMPTED", state: "already_attempted", attemptId, attempt, test }` (never `404`).
   - `POST /api/tests/:id/attempts` — Submits answers and records the attempt (`UNIQUE(test_id, user_uid)` in D1 `test_attempts` / `store.testAttempts`). On a second attempt, returns **HTTP `409`** with `{ error, code: "ALREADY_ATTEMPTED", state: "already_attempted", attemptId, attempt }` (never `404`).
   - `GET /api/tests/:id/my-attempt` — Returns `{ state: "already_attempted", attemptId, attempt, gradedQuestions, test }` for a completed test.
   - `GET /api/attempts/mine` — Returns all attempts for the signed-in student.

---

### B2. Root Causes Reproduced & Identified

1. **Root Cause 1 — UUID & Hyphenated ID Truncation (`404 Test not found`)**:
   - `extractIdFromSlug` in `/src/utils/privacy.ts` and `/src/utils/routes.ts`, plus `extractIdFromSlugOrId` in `/src/server/cloudflarePostsAndAuthRouter.ts`, split slugs on the **first hyphen** (`slug.indexOf('-')`).
   - Because Grand Line test IDs are standard 36-character UUIDs (`1553f47d-325a-47e4-ab28-fa787d6e8b56`), `extractIdFromSlug("1553f47d-325a-47e4-ab28-fa787d6e8b56-grand-line-physics")` truncated the ID to `"1553f47d"`, causing every subsequent `GET /api/tests/1553f47d` or redo/refresh/direct-link lookup to fail with **`404 Test not found`**.
2. **Root Cause 2 — `loadD1Store()` Dropping `captainTests` & `testAttempts` on Server Restart**:
   - In `/src/server/cloudflarePostsAndAuthRouter.ts`, `loadD1Store()` only restored `users`, `posts`, `comments`, `likes`, and `saves` from `data/cloudflare_d1_posts.json`, discarding `captainTests` and `testAttempts` on server restart so any previously attempted test returned `404` after restart.
3. **Root Cause 3 — Missing Redo/Retake/Tests Client Routes**:
   - Links or history entries visiting `/grand-line/test/:testId/redo`, `/grand-line/test/:testId/retake`, or `/tests/:testId/run` hit the catch-all `*` route (`NotFoundPage`).
4. **Root Cause 4 — Auth Token Race & Missing `gradedQuestions` on Revisit**:
   - `getBearerToken()` in `/src/lib/api.ts` read `auth.currentUser` before Firebase Auth finished hydrating (`auth.authStateReady()`), causing initial reload requests to be sent unauthenticated.
   - `GrandLinePage.tsx` and `CaptainPublicProfilePage.tsx` did not pass `gradedQuestions` into the PDF exporter when downloading a past attempt's PDF from the card or result modal.

---

### B3 & B4. Fixes Applied

- **Preserved Full UUIDs & Prefixed IDs**: Updated `/src/utils/privacy.ts`, `/src/utils/routes.ts`, and `/src/server/cloudflarePostsAndAuthRouter.ts` to match full 36-char UUIDs (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`), `post_gen_*`, `post_*`, and `gl-*` IDs before falling back to first-hyphen splitting.
- **Persisted `captainTests` & `testAttempts` in `loadD1Store()`**: Updated `/src/server/cloudflarePostsAndAuthRouter.ts` so `captainTests` and `testAttempts` survive server restarts.
- **Server-Side Idempotent "Already Attempted" Response**: Updated `/src/server/cloudflarePostsAndAuthRouter.ts` and `/cloudflare/worker.js` so `GET /api/tests/:id` and `POST /api/tests/:id/attempts` return HTTP `409` with `state: "already_attempted"`, `code: "ALREADY_ATTEMPTED"`, `attemptId`, and `attempt` (including `gradedQuestions`), and `GET /api/tests/:id?view=info` returns `alreadyAttempted: true` + `myAttempt`.
- **Unified "Attempted" UI + View Result + Download PDF**:
  - Updated `/src/pages/GrandLinePage.tsx`, `/src/pages/GrandLineTestInfoPage.tsx`, `/src/pages/GrandLineTestRunnerPage.tsx`, `/src/pages/captain/CaptainPublicProfilePage.tsx`, and `/src/pages/dashboard/ResultsListPage.tsx`.
  - Every attempted test displays the **"Attempted"** badge, helper note (`"Each Grand Line test can only be attempted once."`), **"View Result"** button, and **"Download PDF"** button with a synchronous `inFlightRef` guard against double-clicks.

---

### B5. PDF Design & Content Preservation Proof (Zero Visual Diff)

- **Generator Reused Unchanged:** `/src/utils/testPdfExporter.ts` (`exportTestReportPdf`) was not modified in any way.
- **Before vs After Page-1 PNG Comparison:**
  - `before_pdf_page_1.png`: `/.aistudio/artifacts/brain/86164492-ef35-4608-b107-a3cdef5991c0/before_pdf_page_1.png` (`55,512` bytes)
  - `after_pdf_page_1.png`: `/.aistudio/artifacts/brain/86164492-ef35-4608-b107-a3cdef5991c0/after_pdf_page_1.png` (`55,512` bytes)
  - `Buffer.compare(beforePng, afterPng) === 0` (`byteIdentical: true`, **`0` pixel difference**).

---

### B6. Verified API Responses & 390×844 Screenshots (Light & Dark)

- **Verified Test ID:** `1553f47d-325a-47e4-ab28-fa787d6e8b56`
- **Verified Attempt ID:** `f70f7f33-b38c-48cd-97cc-8b8e02aa186c`
- **Verified Server Responses:**
  - `GET /api/tests/1553f47d-325a-47e4-ab28-fa787d6e8b56-grand-line-physics-mastery-mock?view=info` → `200 OK` (`alreadyAttempted: true`, `myAttempt.id: "f70f7f33-b38c-48cd-97cc-8b8e02aa186c"`)
  - `GET /api/tests/1553f47d-325a-47e4-ab28-fa787d6e8b56` (second start) → `409 Conflict` (`state: "already_attempted"`, `code: "ALREADY_ATTEMPTED"`, `attemptId: "f70f7f33-b38c-48cd-97cc-8b8e02aa186c"`)
  - `POST /api/tests/1553f47d-325a-47e4-ab28-fa787d6e8b56/attempts` (second submit) → `409 Conflict` (`state: "already_attempted"`, `code: "ALREADY_ATTEMPTED"`, `attemptId: "f70f7f33-b38c-48cd-97cc-8b8e02aa186c"`)
  - `GET /api/tests/1553f47d-325a-47e4-ab28-fa787d6e8b56/my-attempt` → `200 OK` (`gradedQuestions.length: 3`)
- **Saved `390×844` Light & Dark Screenshots (`/.aistudio/artifacts/brain/86164492-ef35-4608-b107-a3cdef5991c0/`)**:
  - `b6_attempted_card_dark.png` & `b6_attempted_card_light.png`
  - `b6_test_info_attempted_dark.png` & `b6_test_info_attempted_light.png`
  - `b6_result_view_dark.png` & `b6_result_view_light.png`

---

## PART A: Site-Wide Performance Optimization (Zero Visual UI Changes)

### A1 & A4. BEFORE vs AFTER Performance Comparison Table (`390×844`, Slow 4G, 4× CPU)

| Page | Cache Mode | FCP Before | FCP After | LCP Before | LCP After | TBT Before | TBT After | CLS Before | CLS After | Reqs Before | Reqs After | Transfer KB Before | Transfer KB After |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Home / Landing (`/`)** | Cold | 45,740 ms | **7,676 ms** (-83.2%) | 45,740 ms | **7,676 ms** (-83.2%) | 1,548 ms | **1,137 ms** (-26.6%) | 0 | **0** | 104 | **76** (-28) | 8,986 KB | **1,194 KB** (-86.7%) |
| **Home / Landing (`/`)** | Warm | 3,272 ms | **3,232 ms** | 3,272 ms | **3,232 ms** | 1,310 ms | **1,178 ms** | 0 | **0** | 104 | **76** (-28) | 58 KB | **8 KB** (-86.2%) |
| **Arena / Practice (`/dashboard`)** | Cold | 45,016 ms | **7,264 ms** (-83.9%) | 45,520 ms | **7,588 ms** (-83.3%) | 834 ms | **785 ms** (-5.9%) | 0 | **0** | 105 | **73** (-32) | 9,000 KB | **1,226 KB** (-86.4%) |
| **Arena / Practice (`/dashboard`)** | Warm | 3,436 ms | **2,792 ms** (-18.7%) | 3,664 ms | **3,084 ms** (-15.8%) | 812 ms | **785 ms** | 0 | **0.0001** | 105 | **83** (-22) | 21 KB | **10 KB** (-52.4%) |
| **Store (`/store`)** | Cold | 45,632 ms | **7,796 ms** (-82.9%) | 45,632 ms | **7,796 ms** (-82.9%) | 1,460 ms | **1,245 ms** (-14.7%) | 0 | **0** | 103 | **75** (-28) | 8,969 KB | **1,253 KB** (-86.0%) |
| **Store (`/store`)** | Warm | 3,348 ms | **159 ms** (-95.3%) | 3,348 ms | **2,558 ms** (-23.6%) | 1,390 ms | **1,312 ms** | 0 | **0** | 103 | **75** (-28) | 14 KB | **8 KB** (-42.9%) |
| **Rewards (`/rewards`)** | Cold | 45,492 ms | **7,652 ms** (-83.2%) | 45,492 ms | **7,652 ms** (-83.2%) | 1,315 ms | **1,089 ms** (-17.2%) | 0 | **0** | 103 | **68** (-35) | 8,969 KB | **1,233 KB** (-86.3%) |
| **Rewards (`/rewards`)** | Warm | 3,252 ms | **3,228 ms** | 3,252 ms | **3,228 ms** | 1,240 ms | **1,166 ms** | 0 | **0** | 103 | **68** (-35) | 14 KB | **8 KB** (-42.9%) |
| **Profile (`/dashboard/profile`)** | Cold | 45,340 ms | **7,276 ms** (-84.0%) | 45,912 ms | **7,548 ms** (-83.6%) | 1,179 ms | **773 ms** (-34.4%) | 0 | **0** | 105 | **69** (-36) | 9,000 KB | **1,213 KB** (-86.5%) |
| **Profile (`/dashboard/profile`)** | Warm | 3,396 ms | **2,756 ms** (-18.8%) | 3,616 ms | **3,048 ms** (-15.7%) | 940 ms | **717 ms** (-23.7%) | 0 | **0.0001** | 105 | **83** (-22) | 21 KB | **10 KB** (-52.4%) |
| **Grand Line (`/grand-line`)** | Cold | 45,420 ms | **7,748 ms** (-82.9%) | 45,420 ms | **7,748 ms** (-82.9%) | 1,232 ms | **1,224 ms** | 0 | **0** | 104 | **75** (-29) | 9,059 KB | **1,203 KB** (-86.7%) |
| **Grand Line (`/grand-line`)** | Warm | 3,260 ms | **3,288 ms** | 3,260 ms | **3,288 ms** | 1,210 ms | **1,200 ms** | 0 | **0** | 104 | **75** (-29) | 19 KB | **8 KB** (-57.9%) |

---

### A2 & A3. Summary of Performance Optimizations Implemented

1. **Route-Level Code Splitting (`/src/App.tsx`)**:
   - Converted `OverviewPage`, `DashboardShell`, `AdminGuard`, and `AdminLayout` from eager top-level imports in `/src/App.tsx` to `lazyWithRetry(...)`.
   - Public and non-overview routes no longer download `OverviewPage.tsx` (`180 KB`), `DragonCompanion.tsx` (`229 KB`), `three` (`910 KB`), `universityMcqService.ts` (`152 KB`), or `AdminLayout`.
2. **Deferred 3D Dragon & Cosmetic SVG Artwork Bundles**:
   - In `/src/pages/dashboard/OverviewPage.tsx`: wrapped `DragonCompanion` in `lazy(...)` + `<Suspense fallback={null}>` so the Cockpit greeting and university grid paint immediately without waiting for Three.js.
   - In `/src/components/dashboard/DashboardBottomNav.tsx`: converted `HamburgerMenuSheet` to `lazy(...)` and only mounted it when opened, preventing `CosmeticRenderers.tsx`, `frameArtwork.tsx` (`344 KB`), `pfpArtwork.tsx` (`339 KB`), `plateArtwork.tsx` (`316 KB`), and `cosmeticsCatalog.ts` (`197 KB`) from blocking initial page loads.
   - In `/src/components/ui/BoardlyAvatar.tsx`: lazy-loaded `AvatarPicture` and `AvatarFrame` so standard avatars (initials/photo URLs) render with zero cosmetic catalog overhead.
3. **On-Demand Heavy Libraries (`jspdf`, `katex`, `three`)**:
   - Moved `import 'katex/dist/katex.min.css'` out of `/src/main.tsx` so KaTeX CSS and JS are only loaded when `MathText.tsx` is rendered.
   - Dynamically imported `@/utils/testPdfExporter` (`jspdf`) on click in `GrandLinePage.tsx`, `GrandLineTestInfoPage.tsx`, `GrandLineTestRunnerPage.tsx`, `CaptainPublicProfilePage.tsx`, and `ResultsListPage.tsx`.
   - Added `vendor-three` and `vendor-pdf` manual chunks in `/vite.config.ts`.
4. **Media Preload & API Caching / Deduplication**:
   - Changed cosmetic loop `<video>` elements in `/src/components/koban/CosmeticRenderers.tsx` from `preload="auto"` to `preload="metadata"`.
   - Added 30-second TTL in-memory caching + in-flight request deduplication in `/src/services/ambassadorTestService.ts` (`getAllPublicAmbassadorTests`, `getMyTestAttempts`, `getTestLeaderboard`, `getGrandLineLeaderboard`) with automatic cache invalidation on test/attempt mutations, plus parallelized `Promise.all` loading in `/src/pages/GrandLinePage.tsx`.
5. **HTTP Gzip Compression (`/vite.config.ts`)**:
   - Added `zlib` gzip compression middleware for HTML, JS, CSS, JSON, and SVG responses (`>= 512` bytes) with proper `304`/`204` handling and `Vary: Accept-Encoding`, cutting initial transfer sizes across all 6 pages by **86%–89%** (`~9,000 KB` → `~1,200 KB`).

---

### A5. Smoke Tests & Verification

- **All 6 Pages Verified in Light & Dark Mode (`390×844`)**: `/`, `/dashboard`, `/store`, `/rewards`, `/dashboard/profile`, `/grand-line` rendered with `0` page errors and `0` console errors.
- **Grand Line End-to-End Flow Verified**: Attempted state, View Result, and Download PDF verified across `/grand-line`, `/grand-line/test/:id`, `/grand-line/test/:id/run`, `/grand-line/test/:id/redo`, and `/grand-line/test/:id/result`.
- **PDF Byte-for-Byte Visual Identity Verified**: `before_pdf_page_1.png` vs `after_pdf_page_1.png` (`55,512` bytes each, `0` pixel difference).
