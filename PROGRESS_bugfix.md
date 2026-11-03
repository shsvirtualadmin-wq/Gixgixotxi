# Boardly Bugfix Progress (`PROGRESS_bugfix.md`)

## Status Overview
- **Part A (Rewards Firestore 403 `PERMISSION_DENIED` Diagnosis, Fail-Safe, & Health Check)**: Complete & Verified
- **Part B (Dashboard Dragon & Egg Intermittent Disappearance Reproduction & Fix)**: Complete & Verified
- **Part C (Dashboard `7-DAY STREAK` Card Missing Number)**: Complete & Verified

---

## Verified Facts & Findings

### Part A — Rewards Firestore 403 `PERMISSION_DENIED` (`A1`–`A5`)
1. **A1 — REST URL & Auth Parameters in `/functions/_utils/firestoreRestAdmin.ts`**:
   - **Failing Call**: `POST https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents:beginTransaction`
   - **Target Project ID (`DEFAULT_FIREBASE_PROJECT_ID`)**: `gen-lang-client-0365509316` (matches `/src/lib/firebaseConfig.ts` and `/.firebaserc`).
   - **Target Named Database ID (`DEFAULT_FIRESTORE_DATABASE_ID`)**: `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712` (matches `/src/lib/firebaseConfig.ts` and `/firebase.json`).
   - **HTTP Status on failure**: `403` (`PERMISSION_DENIED: Missing or insufficient permissions`).
   - **OAuth Scope**: `https://www.googleapis.com/auth/datastore`
   - **Token Audience (`aud`)**: `https://oauth2.googleapis.com/token`
   - **Service Account Secret (`FIREBASE_SERVICE_ACCOUNT`)**: In the local dev container, `FIREBASE_SERVICE_ACCOUNT` is unset (`null`); in Cloudflare Pages production, it is configured as an encrypted environment variable.
2. **A2 — Code Hardening**:
   - Added `resolveTargetFirestoreProjectId()` and `resolveTargetFirestoreDatabaseId()` in `/functions/_utils/firestoreRestAdmin.ts` so that if any environment variable (`FIREBASE_DATABASE_ID` or `VITE_FIREBASE_DATABASE_ID`) is set to `""`, `"(default)"`, or `"default"`, it is normalized to the named database `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`.
3. **A3 — Exact Manual Google Cloud / Cloudflare Configuration Cause**:
   - Because the REST URL already targets the named database (`projects/gen-lang-client-0365509316/databases/ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712/documents:beginTransaction`) and requests the `https://www.googleapis.com/auth/datastore` scope, the `403 PERMISSION_DENIED` comes from IAM / project configuration on the service account stored in `FIREBASE_SERVICE_ACCOUNT`:
     1. The service account JSON key must belong to Google Cloud project **`gen-lang-client-0365509316`** (or have cross-project IAM access to `gen-lang-client-0365509316`).
     2. The service account (`client_email`) must be granted the **`Cloud Datastore User`** (`roles/datastore.user`) role (or `Firebase Admin` / `Editor`) in **Google Cloud Console -> IAM & Admin -> IAM** for project `gen-lang-client-0365509316`.
     3. The **Cloud Firestore API** (`firestore.googleapis.com`) must be enabled in **Google Cloud Console -> APIs & Services -> Enabled APIs & services** for project `gen-lang-client-0365509316`.
4. **A4 — Fail-Safe Implementation**:
   - In `/functions/api/rewards/[[path]].ts` and `/functions/_utils/firestoreRestAdmin.ts`, raw Google/Firestore errors are logged strictly on the server (`console.error`) and never sent to the browser.
   - If `FIREBASE_SERVICE_ACCOUNT` is missing or any Firestore call (`getDoc`, `beginTransaction`, `commit`) fails during `GET /api/rewards/state` or `POST /api/rewards/daily/claim` / `POST /api/rewards/milestone/claim`, the API returns `state: "server_not_ready"`, `canClaim: false`, `comingSoon: true`, `statusMessage: "Rewards are being set up"`, and generic error `"Rewards are being set up"`.
   - In `/src/pages/RewardsPage.tsx` and `/src/services/rewardsService.ts`, whenever `state === 'server_not_ready'` or a claim returns `SERVER_NOT_READY`, `triggerServerNotReadyFailSafe()` immediately sets `state: 'server_not_ready'`, displays the friendly `"Rewards are being set up"` notice, and disables all Claim buttons with `"Coming soon"`.
5. **A5 — Super Admin Health Check Endpoint (`GET /api/rewards/health`)**:
   - Added `GET /api/rewards/health` (Super Admin only) in `/functions/api/rewards/[[path]].ts` using `FirestoreRestAdapter.checkHealth()`, which probes both D1 (`reward_settings`) and Firestore (`beginTransaction` + `rollback` on the named database) and returns `{ ok: true, reason: "ok" }` or `{ ok: false, reason: "..." }` along with `targetProjectId`, `targetDatabaseId`, `serviceAccountProjectId`, `serviceAccountClientEmail`, and `projectMismatch` (never exposing `private_key` or tokens).
   - Added a live `"Firestore Credit Health"` status badge and `"Check Health"` button in the Super Admin Rewards panel on `/src/pages/admin/AdminOverviewPage.tsx`.

### Part B — Dashboard Dragon (`Zenryu`) & Egg Intermittent Disappearance
1. **Verified Root Causes Fixed**:
   - **B1 (Chunk & Suspense Race)**: Eagerly imported `OverviewPage` in `/src/App.tsx` and `DragonCompanion` in `/src/pages/dashboard/OverviewPage.tsx` so navigating to `/dashboard` never suspends or flashes blank while waiting for lazy chunks.
   - **B2 (Auth & Role Hydration Race)**: Added `resolveEffectiveUid()`, `readCachedVerifiedRole()`, `readKnownUnlockedState()`, and synchronous `useMemo` computation of `correctCount` in `/src/components/dashboard/DragonCompanion.tsx` so the component immediately knows the user's UID, verified role, and MCQ unlock count on the very first render frame before async `/api/me/role` or Firebase Auth finishes hydrating.
   - **B3 (Zero-Dimension Container Race & WebGL First-Frame Gap)**: Reserved explicit container height (`.zenryu-stage--active` and `.zenryu-stage--egg` in `/src/index.css`), layered a static visual fallback beneath the `<canvas>` until `onFirstFrameRendered` fires, and attached a `ResizeObserver` + `webglcontextlost`/`webglcontextrestored` + `visibilitychange` recovery in `/src/components/dashboard/DragonCompanion.tsx` and `/src/components/dashboard/zenryuEngine3D.ts`.
   - **B4 (Error Boundary Isolation)**: Wrapped the Dragon stage in `DragonStageErrorBoundary` so any WebGL or Three.js runtime exception gracefully falls back to the static illustration without collapsing the card or returning `null`.

### Part C — Dashboard `7-DAY STREAK` Card Missing Number (`0 Days`)
1. **Verified Root Cause & Fix**:
   - `/src/hooks/useUserProfile.ts` declared `streak: number` in `UserProfileHookResult` (line 43) but omitted `streak` from its return object (lines 359–378), causing `const { user, profile, streak } = useUserProfile()` in `/src/pages/dashboard/OverviewPage.tsx` to receive `streak === undefined` and render `" Days"` with no number.
   - Fixed `/src/hooks/useUserProfile.ts` to compute and return `streak: Math.max(0, Math.floor(Number(profile?.streak ?? 0) || 0))`, and hardened `/src/pages/dashboard/OverviewPage.tsx` (`safeStreak`) so the card always renders `"0 Days"` for a new user with no streak and `"N Day(s)"` when `streak > 0`.
