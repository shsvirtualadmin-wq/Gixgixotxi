# Boardly Rewards System (Cloudflare D1 Storage + Super Admin Switch) — Verified Progress Log

## Phase 0: Discovery (Verified Facts)

### 1. How the MCQ Endpoints Use Cloudflare D1
- **D1 Binding Name**: `DB` (`env.DB`), bound to D1 database `boardly-posts-db` in `/cloudflare/wrangler.toml`.
- **Pages Functions Folder**: `/functions/api/[[path]].ts` routes `/api/*` requests on Cloudflare Pages to `/functions/api/rewards/[[path]].ts`, `/cloudflare/worker.js`, and `/cloudflare/worker.ts`.
- **User Verification Helper**:
  - `authenticateRequest(request, env, requireAuth)` in `/cloudflare/worker.js` and `verifyFirebaseIdToken(req, env)` in `/cloudflare/worker.ts` verify the `Authorization: Bearer <idToken>` JWT using WebCrypto `RSASSA-PKCS1-v1_5` SHA-256 against Google's public SecureToken JWKs, then query D1 `user_roles` (`SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles WHERE uid = ?1`).
- **Migrations**:
  - Stored in `/cloudflare/migrations/` (`0001_university_mcqs.sql`, `0002_university_mcq_isolation.sql`, `0003_rewards_d1.sql`).
  - Applied via Wrangler CLI:
    - Local: `npx wrangler d1 execute boardly-posts-db --local --file=./cloudflare/migrations/0003_rewards_d1.sql`
    - Remote/Production: `npx wrangler d1 execute boardly-posts-db --remote --file=./cloudflare/migrations/0003_rewards_d1.sql`

### 2. Where Kobans Balance & Ledger Live Today
- **Storage**: **Firestore** (`wallets/{uid}.balance` mirrored to `users/{uid}.kobans` and `users/{uid}.kobanBalance`, and ledger subcollection `wallets/{uid}/ledger/{entryId}` with `{ id, type, amount, balanceAfter, reason, timestamp }`).
- **Existing Code Path That Credits Kobans**: `adminGrantKobans`, `adminAdjustKobans`, and `approveKobanRequest` in `/src/services/kobanService.ts`.
- **Phase 3 Architecture (Claim-First in D1, Credit-Second in Firestore)**:
  - Every claim or referral payout inserts/updates the D1 row first with `credit_status = 'pending'`, then runs an idempotent Firestore transaction (`creditKobansIdempotentInFirestore`) using deterministic ledger document IDs (`reward_daily_${uid}_${pktDate}`, `reward_milestone_${uid}_${milestoneId}`, `reward_ref_inviter_${referralId}`, `reward_ref_invitee_${referralId}`) that checks if the ledger document already exists (no-op if already credited), credits `wallets/{uid}` + `users/{uid}`, and finally marks the D1 row `credit_status = 'credited'`. Any row left in `'pending'` is automatically retried on `/api/rewards/state`.

### 3. Authoritative MCQs-Answered Count & Answer History in D1
- **Tables & Columns** (`/cloudflare/schema.sql`):
  - `test_attempts` (`id, test_id, user_uid, score, total_questions, created_at`, `UNIQUE(test_id, user_uid)`).
  - `attempt_answers` (`id, attempt_id, test_id, question_id, selected_index, correct_index, is_correct, created_at`).
- **Client Tamper Resistance**:
  - Clients have zero direct write access to D1. Attempts are only inserted server-side by `POST /api/tests/:id/attempts` after verifying the Firebase ID token and grading answers server-side.
  - Rewards endpoints read the MCQ count from D1 strictly via READ-ONLY `SELECT` queries (`computeAuthoritativeMcqsFromD1`) and never write to any MCQ tables.

### 4. How the Super Admin Check Is Done on the Server
- Checks if `uid` is in `SUPERADMIN_UIDS` (`A5YMRimdHRcmeDWutxtUGt2e4hf2`), or `email` is in `SUPERADMIN_EMAILS` (`shsvirtualadmin@gmail.com`, `support@boardly.cfd`, `support@scholario.me`), or token claim `role === 'superadmin'`, or D1 `user_roles.role === 'superadmin'`.

---

## Phase 1: D1 Schema & Migration (Completed)
- Created additive migration `/cloudflare/migrations/0003_rewards_d1.sql` defining:
  - `reward_settings (key TEXT PRIMARY KEY, value TEXT)` seeded with `('mode', 'off')` and `('config', '<JSON>')`.
  - `reward_daily_claims (uid TEXT, pkt_date TEXT, day_number INTEGER, amount INTEGER, credit_status TEXT, created_at INTEGER, PRIMARY KEY (uid, pkt_date))`
  - `reward_milestone_claims (uid TEXT, milestone_id TEXT, amount INTEGER, credit_status TEXT, created_at INTEGER, PRIMARY KEY (uid, milestone_id))`
  - `referral_codes (uid TEXT PRIMARY KEY, code TEXT UNIQUE)`
  - `referrals (id TEXT PRIMARY KEY, inviter_uid TEXT, invitee_uid TEXT UNIQUE, inviter_code TEXT, invitee_code TEXT, status TEXT, inviter_accepted INTEGER, invitee_accepted INTEGER, ip_hash TEXT, flagged INTEGER, inviter_credit_status TEXT, invitee_credit_status TEXT, created_at INTEGER, confirmed_at INTEGER, paid_at INTEGER)`

## Phase 2 & 3: D1 Server Endpoints + Claim-First/Credit-Second (Completed)
- Updated `/functions/_utils/firestoreRestAdmin.ts` and `/functions/api/rewards/[[path]].ts`:
  - Deleted all old Firestore reward-storage paths (`config/rewards`, `reward_user_state`, `reward_daily_claims`, `reward_milestone_claims`, `reward_referral_codes`, `reward_referrals`, `reward_inviter_months`, `reward_ip_attaches` in Firestore).
  - Implemented `GET /api/rewards/state`, `POST /api/rewards/daily/claim`, `POST /api/rewards/milestone/claim`, `POST /api/rewards/referral/attach`, `POST /api/rewards/referral/accept`, and `POST /api/rewards/admin/mode` backed by D1 (`env.DB`).
  - Implemented `creditKobansIdempotentInFirestore` + `retryPendingFirestoreCredits` for claim-first in D1 (`credit_status = 'pending'`) and credit-second in Firestore (`credit_status = 'credited'`).

## Phase 4: Share Link & Super Admin Switch UI (Completed)
- Added Super Admin `"Rewards"` card with 3-way segmented control (`Off` / `Admin only (testing)` / `Everyone`), confirmation dialog, and success/error messages to `/src/pages/admin/AdminOverviewPage.tsx`.
- Added red Super Admin notice banner on `/rewards` (`/src/pages/RewardsPage.tsx`) whenever `mode !== 'everyone'`.
- Updated `/src/services/rewardsService.ts` to remove client-side Firestore config code and add `setRewardsAdminMode(mode)`.

## Phase 5: Automated Tests, Verification & Screenshots (Completed)
- Executed `/scripts/test-rewards-engine.ts` (`npx tsx scripts/test-rewards-engine.ts` — exit code `0`):
  - Verified 30-day schedule (`7,550` Kobans), wrap to Day 1 after Day 30, and PKT `23:59` vs `00:00` boundary.
  - Verified Super Admin 3-way switch (`POST /api/rewards/admin/mode`): non-admin receives `403`, `"off"` blocks everyone, `"admin_only"` allows Super Admin only, and `"everyone"` allows all non-suspended students.
  - Verified 5 simultaneous daily claims for the same day in D1 (`PRIMARY KEY (uid, pkt_date)`) result in **1 credit (`200`)** and **4 conflicts (`409`)**.
  - Verified Claim-First in D1 / Credit-Second in Firestore failure & retry: simulated Firestore failure leaves D1 row `credit_status = 'pending'` (`502`), and subsequent `/api/rewards/state` retry credits Firestore **once and never twice** (`credit_status = 'credited'`).
  - Verified read-only D1 MCQ count (`SELECT` only from `test_attempts` / `attempt_answers`, zero writes to MCQ tables) and milestone claims.
  - Verified full two-way referral acceptance (`inviter` enters `invitee_code` -> `inviter_accepted = 1`; `invitee` enters `inviter_code` -> `invitee_accepted = 1` -> `status = 'confirmed'`), 20 D1 MCQs payout (`+5,000` inviter / `+1,000` invitee), monthly cap (`10/month`), 14-day expiry, and rejection of self-referral, double attach, and wrong code.
  - Verified `firestore.rules` is untouched, zero client code writes balances, and total repo file count is `453` (`< 800`).
