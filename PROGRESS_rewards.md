# PROGRESS_rewards.md — Boardly Rewards System

## Phase 0: Discovery (Verified Facts)

### 1. Existing Server-Side Code & Firebase ID Token Verification
- **Cloudflare Pages Functions (`/functions`)**:
  - `/functions/api/[[path]].ts` proxies `/api/*` requests.
  - `/functions/[[path]].ts` serves static assets and performs SPA fallback (`index.html` with route-specific SEO/OG tags via `src/utils/routeSeoMeta.ts`).
- **Cloudflare Worker (`/cloudflare/worker.ts` & `/cloudflare/worker.js`, `/cloudflare/wrangler.toml`)**:
  - `cloudflare/worker.ts` verifies Firebase ID tokens using WebCrypto `RSASSA-PKCS1-v1_5` SHA-256 against Google's public JWKs (`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`), validating `exp`, `iat`, `aud` (`gen-lang-client-0365509316`), `iss`, and `sub`.
- **Firebase Cloud Functions (`/firebase-functions/index.js`)**:
  - Contains callable functions (`unlockItem`, `toggleFollow`, `adminDeleteUserAccount`, `cleanupOrphanProfiles`), not HTTP `/api/rewards/*` endpoints.
- **Built Server Implementation for `/api/rewards/*`**:
  - Built `/functions/_utils/firestoreRestAdmin.ts` and `/functions/api/rewards/[[path]].ts` (and wired `/api/rewards` in `/functions/api/[[path]].ts` and `vite.config.ts` dev middleware).
  - Verifies the Firebase ID token via WebCrypto and talks to the Firestore REST API (`projects/gen-lang-client-0365509316/databases/ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712/documents`) using an OAuth2 access token minted from the encrypted environment secret `FIREBASE_SERVICE_ACCOUNT` (with fallback check for `GOOGLE_SERVICE_ACCOUNT_KEY`).
  - Until `FIREBASE_SERVICE_ACCOUNT` exists and `config/rewards.enabled === true`, endpoints return HTTP `503` and all UI Claim buttons remain disabled with `"Coming soon"`.

### 2. Kobans Balance & Ledger Storage and Shape
- **Primary Wallet Document**: `wallets/{uid}` (`src/services/kobanService.ts`, `src/hooks/useWallet.ts`):
  - `balance`: `number`
  - `owned`: `string[]`
  - `equipped`: `{ effect, frame, nameplate, avatar, banner }`
  - `updatedAt`: Firestore Timestamp
- **Mirrored User Profile Fields**: `users/{uid}`:
  - `kobans`: `number`
  - `kobanBalance`: `number`
  - `updatedAt`: Firestore Timestamp
- **Ledger Subcollection**: `wallets/{uid}/ledger/{entryId}`:
  - Exact entry shape: `{ id, type, amount, balanceAfter, reason, timestamp }` with new entry types `'reward_daily' | 'reward_milestone' | 'reward_referral_inviter' | 'reward_referral_invitee'`.
- **Firestore Security Rules (`firestore.rules`)**:
  - Untouched.
  - Default catch-all at line 1490 of `firestore.rules`: `match /{document=**} { allow read, write: if false; }`.
  - All new Rewards collections (`reward_daily_claims/{uid}_{pktDate}`, `reward_milestone_claims/{uid}_{milestoneId}`, `reward_referral_codes/{code}`, `reward_referrals/{id}`, `reward_user_state/{uid}`, `reward_inviter_months/{uid}_{pktMonth}`, `reward_ip_attaches/{ipHash}_{pktDate}`) hit the default-deny catch-all and are 100% server-only.

### 3. Authoritative "MCQs Answered" Count & Client Tamper Risk Analysis
- **Most Tamper-Resistant Source Available (`attempts/{attemptId}`)**:
  - In `firestore.rules` (lines 614–627), `match /attempts/{attemptId}` allows client `create` only if `request.resource.data.userId == request.auth.uid`, and **`allow update, delete: if isAdmin()`** (clients cannot update or delete an attempt once created).
  - By contrast, `users/{uid}/usage/{dateKey}` and `users/{uid}/chapterStats/{chapterId}` allow owner writes (`allow read, write: if isOwner(userId)`), and `boardly_d1_cockpit_attempts_v2_*` lives in browser `localStorage`.
  - **Remaining Weakness in `attempts/{attemptId}`**: Because `firestore.rules` allows an authenticated client to `create` a new document in `/attempts/{attemptId}` with `userId == request.auth.uid` without server-side grading, a technical user could craft a direct Firestore `addDoc(collection(db, 'attempts'), ...)` call from the browser console.
  - **Server-Side Mitigation Applied**: `computeAuthoritativeMcqsAnswered` on the server queries `attempts` where `userId == uid` and `status == 'completed'`, caps maximum counted answered questions per single attempt document to `200` (matching PMDC MDCAT exam length), requires `totalQuestions >= (correctAnswers + wrongAnswers)`, and deduplicates attempt IDs.

### 4. Admin-Adjustable Config, Suspension Flag & Notification System
- **Config Document**: `config/rewards` (in Firestore database `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`), readable by server and editable by Super Admin via `/config/{docId}` (`allow read: if true; allow write: if isAdmin()`).
- **Suspension Flags (`users/{uid}`)**: `isBanned === true || isSuspended === true || suspended === true || status === 'suspended'`.
- **Notifications**: `notifications/{notifId}` (`userId`, `type: 'system'`, `title`, `message`, `link: '/rewards'`, `read: false`, `createdAt`).

### 5. Navigation, Footer, Hamburger Drawer, Router, Sitemap, Robots & SPA Fallback
- **Logged-Out Landing Navbar (`src/components/layout/Navbar.tsx`)**: `"Rewards"` added and visible by default on first load without any click (both at `1280x800` desktop and `390x844` mobile), styled in brand red (`#D71921`), keeping `"Boardly"` in the navbar red (`#D71921`), and also included in the mobile menu list when opened.
- **Footer (`src/components/layout/Footer.tsx`)**: `"Rewards"` added under `Platform`.
- **Logged-In Red Hamburger Drawer (`src/components/dashboard/HamburgerMenuSheet.tsx`) & Top Bar (`src/components/dashboard/DashboardTopBar.tsx`)**: `"Rewards"` added. `DashboardBottomNav.tsx` untouched.
- **Own Profile (`src/components/profile/ProfileView.tsx`)**: `"Rewards"` button added next to `"Boardly Store"` with `flex-wrap`.
- **Router, SEO, Sitemap, Robots & Redirects**: `/rewards` added to `src/App.tsx`, `src/utils/routes.ts`, `src/utils/routeSeoMeta.ts` (`title: "Boardly Rewards"`), `public/sitemap.xml`, `public/robots.txt`, and `public/_redirects`.

---

## Phases 1–5: Verification & Test Results
- **Phase 1 (`config/rewards`)**: Seeded defaults in `src/lib/rewardsEngine.ts` (`DEFAULT_REWARDS_CONFIG`) and auto-seeded via `loadOrSeedRewardsConfig` in `functions/api/rewards/[[path]].ts` and `ensureFirestoreRewardsConfigSeeded` in `src/services/rewardsService.ts`.
- **Phase 2 (`/api/rewards/*`)**: Implemented `GET /api/rewards/state`, `POST /api/rewards/daily/claim`, `POST /api/rewards/milestone/claim`, `POST /api/rewards/referral/attach`, and `POST /api/rewards/referral/accept` in `functions/api/rewards/[[path]].ts`.
- **Phase 3 (`/join/:code` & `?ref=CODE`)**: Implemented 30-day cookie + `localStorage` persistence and post-signup auto-attach in `functions/[[path]].ts`, `src/pages/crew/JoinCrewPage.tsx`, `src/hooks/useReferral.ts`, and `src/services/rewardsService.ts`.
- **Phase 4 (`/rewards` UI & Navigation)**: Implemented glassmorphic `/rewards` page (`src/pages/RewardsPage.tsx`) with Hero, 30-Day Check-In grid (`3x10` mobile, `6x5` desktop, chest icons on Days 4/7/14/21/28/30, live PKT countdown), MCQ Milestones (`50, 100, 250, 500` + read-only `1,000` Zenryu Dragon card + Super Admin exclusion notice), Two-Way Referral system, and Short FAQ & Rules.
- **Phase 5 (`scripts/test-rewards-engine.ts`)**: All 8 automated test suites passed (`npx tsx scripts/test-rewards-engine.ts`), `compile_applet` succeeded, and `lint_applet` (`eslint src --max-warnings 0`) passed with 0 warnings.
