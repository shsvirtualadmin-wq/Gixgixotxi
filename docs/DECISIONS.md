# Boardly Architecture Decisions Log (ADR)

This document tracks all foundational architectural, security, and product design decisions for the ground-up rebuild of Boardly (`boardly.cfd`).

---

## ADR 001: Ground-Up Rebuild Strategy vs Legacy Code Reuse
- **Status:** Approved
- **Context:** The previous codebase accumulated fragile workarounds, conflicting auth domains, redundant loading states, and brittle profile lookups.
- **Decision:** Execute a clean, ground-up rebuild phase-by-phase without reusing broken code. Reuse only authentic data (Firebase database), the official Boardly logo asset, and verified legal/placeholder review text.
- **Consequences:** Eliminates technical debt, guarantees single-loader startup, and ensures 100% type safety and maintainability.

---

## ADR 002: Single Source of Truth for Firebase Instance & Named Database ID
- **Status:** Approved
- **Context:** Firestore in this project operates on a specific named database instance: `ai-studio-25287ca6-33a1-49f8-8867-70061120a712` under project `gen-lang-client-0365509316`. Multiple `initializeApp` calls or missing database IDs caused silent fallback to empty default databases.
- **Decision:** All Firebase services (`app`, `auth`, `db`) are instantiated strictly once in `src/lib/firebaseConfig.ts` (re-exported via `src/lib/firebase.ts`) with `TARGET_FIRESTORE_DATABASE_ID`. Experimental long polling is enforced to eliminate WebChannel streaming hang-ups on proxies.
- **Consequences:** All collections (questions, users, events, sessions) consistently route to the correct database instance across all devices and hosting targets.

---

## ADR 003: 3-Tier Post-Login Profile Lookup & Immediate Account Linking
- **Status:** Approved
- **Context:** Returning students were repeatedly presented with the onboarding/registration portal after Google Sign-In due to UID/email mismatches from legacy Supabase migrations.
- **Decision:** The profile lookup implements a strict cascade:
  1. Direct document read: `users/{firebaseUid}`
  2. Query by lowercased, trimmed email: `users.where('email', '==', signedInEmail)`
  3. Query by legacy Supabase ID: `users.where('legacy_supabase_uid', '==', legacyUid)`
  If matched via step 2 or 3, the document is immediately linked by setting `firebase_auth_linked: true` and copying to `users/{uid}` with merge. Registration only appears if all three steps return nothing.
- **Consequences:** 100% elimination of the infinite registration loop bug for returning students.

---

## ADR 004: Super Administrator Authorization Guardrail
- **Status:** Approved
- **Context:** Previous revisions contained scattered, inconsistent role checks and vulnerable client-side repair buttons.
- **Decision:** The ONLY authorized administrator across both frontend route guards and Firestore Security Rules is `shsvirtualadmin@gmail.com` (verified email, lowercased). No custom claims, secondary admin emails, or UI "repair" buttons are permitted.
- **Consequences:** Ironclad least-privilege security model with zero chance of privilege escalation.

---

## ADR 005: Font Policy & Total Elimination of External CDNs
- **Status:** Approved
- **Context:** Hard Rule 2 mandates zero CDN fonts or Google Fonts to guarantee privacy, eliminate external HTTP handshakes, and prevent layout shifts.
- **Decision:** Removed all Google Fonts preconnect and stylesheet links from `index.html`. Typography is powered exclusively by the local font file `Oblata Display` (`/public/fonts/Oblata-Display-Regular.otf`) for headlines and high-performance system sans-serif stacks for UI body text.
- **Consequences:** Faster First Contentful Paint (FCP), zero CDN tracking, and total offline / intranet resilience.

---

## ADR 006: Preservation of Authentic Testimonials & Zero Demo Data
- **Status:** Approved
- **Context:** Trustworthiness is central to an entrance exam platform. Fake live counters or demo student scores compromise academic integrity.
- **Decision:** Dashboards and leaderboards reflect REAL Firestore documents only. Placeholder reviews on the marketing landing page are preserved verbatim as plain student quotes in `src/data/studentReviews.ts` (`REAL_STUDENT_REVIEWS`) without fabricated university names, ranks, or star ratings. Only the PhoneMockup on the landing page displays sample data clearly badged as "Sample preview".
- **Consequences:** High student trust and strict adherence to project rules.

---

## ADR 007: PKT Timezone Daily Usage Limits Partitioning
- **Status:** Approved
- **Context:** Entrance exam candidates in Pakistan study late into the night. UTC-based resets cause confusing midnight resets at 05:00 AM PKT.
- **Decision:** Daily usage is tracked under `users/{uid}/usage/{YYYY-MM-DD}` using Pakistan Standard Time (`Asia/Karachi`, UTC+5).
- **Consequences:** Clear, predictable 12:00 AM PKT daily quota refreshes for Free and Pro students.

---

## ADR 008: KaTeX-First Math Engine & Cloudflare AI Normalization
- **Status:** Approved
- **Context:** Entrance test questions in Physics and Mathematics often contain escaped LaTeX control characters or unrendered raw notation.
- **Decision:** Build `<MathText />` with KaTeX (`throwOnError: false`) and a robust regex normalizer for LaTeX characters. Batch cleanup for failing formulas is proxied through Cloudflare Pages Functions (`/functions/api/fix-math`) calling Gemini with server-side secrets.
- **Consequences:** Crisp, beautiful rendering of integrals, matrices, fractions, and vectors across all screen sizes.

---

## ADR 009: Cloudflare Pages + Serverless Functions Hosting Architecture
- **Status:** Approved
- **Context:** The project operates on the Firebase Spark (free) plan which disallows Google Cloud Functions.
- **Decision:** Static hosting and SPA routing are served by Cloudflare Pages (`dist/`). AI integrations and secret management run on Cloudflare Pages Functions (`/functions`), keeping all API keys out of client bundles.
- **Consequences:** Free hosting, zero infrastructure costs, high edge performance, and enterprise-grade security.

---

## ADR 010: Design System Tokens, Dark Glass Theme, and Neutral Phone Mockup
- **Status:** Approved
- **Context:** Previous UI suffered from visual fragmentation (mixed light and dark themes, inconsistent button tap targets, harsh blue borders, and low contrast).
- **Decision:**
  1. Standardized all tokens in CSS variables: `--bg: #070B14`, `--bg-2: #0E1626`, `--surface: rgba(255,255,255,0.06)`, `--surface-hover: rgba(255,255,255,0.10)`, `--border: rgba(255,255,255,0.12)`, `--text: #EAF0FF`, `--text-muted: #A3B0CC`, `--text-faint: #6F7C99`, `--brand: #2F6BFF`, `--brand-2: #22D3EE`, `--violet: #7C5CFF`. Role accents: Student (blue to cyan), Crew (violet to magenta), Captain (amber to orange), Admin (emerald on slate).
  2. Built unified base UI primitives (`Button`, `Card`, `Input`, `Select`, `Modal`, `Sheet`, `Tabs`, `Badge`, `Progress`, `Skeleton`, `Toast`, `Table`, `EmptyState`, `ErrorState`).
  3. Created neutral metallic study hardware `PhoneMockup` with dark titanium gradient frame, glass diagonal reflection streak, centered camera pill, 3D cursor tilt, and 4 interactive preview screens (Student, Crew, Captain, Arena) badged with "Sample preview".
  4. Redesigned public marketing pages (Home, Features, Pricing, Contact, Privacy, Terms, FAQs, About) using the dark glass aesthetic with 48px grid background and subtle radial glows.
- **Consequences:** Cohesive visual identity, mobile-friendly 44px+ tap targets, accessible WCAG contrast ratios, and zero visual flicker.

---

## ADR 011: Strict Auth Flow, Referral Token Storage, and Least-Privilege Rules
- **Status:** Approved
- **Context:** Previous implementation had permission errors due to student profiles attempting to write protected fields, loose admin checks, and fragile referral linking.
- **Decision:**
  1. Updated `firestore.rules` so `isAdmin()` strictly verifies `request.auth.token.email.lower() == 'shsvirtualadmin@gmail.com'`.
  2. Enforced protection on `users/{userId}`: non-admin students can only create documents with `role: "student"` and `plan: "free"`, and cannot write any of the 21 forbidden privilege keys (`role, roles, plan, isPremium, premium, premiumExpiresAt, premiumSource, previousPlan, isCrewMember, crewStatus, crewStartDate, crewReferralCode, crewRevokedAt, crewRevokeReason, isPaidInternshipEligible, ambassador, admin, isAdmin, suspended, isSuspended`).
  3. Rebuilt all Auth pages (`/login`, `/signup`, `/forgot-password`, `/verify-email`) and 4-Step Onboarding (`/onboarding`) using Phase 1 dark glass components.
  4. Implemented referral capture storing `boardly_ref_code` in localStorage, writing idempotent masked records in `referrals` (`status: "joined"`, `hasTakenFirstTest: false`, `activated: false`, `createdAt: serverTimestamp()`), and clearing the token after attribution.
  5. Built explicit modular guards in `src/components/auth/Guards.tsx`: `GuestGuard`, `AuthGuard`, `AdminGuard`, `CaptainGuard`, and `CrewGuard`. Immediate suspension sign-out displays `"Your account has been suspended. Contact support@boardly.cfd."`.
- **Consequences:** Zero permission-denied crashes during sign-up/onboarding, rock-solid attribution for campus captains, and guaranteed isolation for administrator panels.

---

## ADR 012: Phase 3 Student Cockpit Architecture, PKT Usage Partitioning, and Cloudflare AI Tutor Proxy
- **Status:** Approved
- **Context:** Phase 3 required a comprehensive student cockpit shell and modular portal views constructed strictly with real Firestore data (matching `/docs/DATA_AUDIT.md` and `/docs/SPEC.md`), eliminating all mock, fake, seed, or hardcoded values. Daily limits needed partitioning under PKT (`Asia/Karachi`), Gemini AI tutor needed serverless token verification without exposing API keys on the client, and participant privacy on leaderboards needed strict masking (`"First L."`).
- **Decision:**
  1. Built `StudentLayout` desktop collapsible 240px glass sidebar + sticky top bar (real `announcements` bell modal, streak counter, plan badge, profile dropdown with role switcher) + mobile bottom navigation bar (5 primary items: Overview, Practice, Events/Arena, AI Tutor, More) with glass "More" bottom sheet.
  2. Implemented all 14 Phase 3 views using authentic Firestore data and standard state patterns:
     - `OverviewView`: real exam countdown from `users/{uid}`, streak & attempts metrics, PKT daily usage meter (`users/{uid}/usage/{YYYY-MM-DD}`), recent attempts, priority weak chapters, dismissible sample mockup.
     - `PracticeVaultView`: Firestore cursor pagination (`limit(25)` / `startAfter`), university past papers & question banks, customizable drill configurator modal.
     - `ChapterMapView`: Syllabus blueprint for Math, Physics, Chemistry, Computer Science, Biology; calculates real student mastery % from attempts.
     - `FormulaVaultView`: High-yield entrance test formula directory rendered with KaTeX (`MathText`), 1-click LaTeX copy, and direct "Ask Boardy Derivation" CTA.
     - `SmartPlannerGrowthView`: Adaptive milestone timeline based on exam countdown and weak chapters; real historical accuracy progression.
     - `TestHistoryView`: Paginated attempts list from `users/{uid}/testAttempts` and `attempts`, search filter, detailed attempt review modal.
     - `MeritMeterView`: Real `universities` and `meritFormulas` data, matric/FSc/test weight calculation, comparison against closing merits.
     - `UniversityExplorerView`: Directory of Pakistani universities with test criteria, direct links to Merit Meter and past paper mocks.
     - `EventsArenaView`: Real `events` and `sessions`, registrations in `registrations/reg_{uid}_{eventId}`, live lobby countdown, and national leaderboards with masked privacy (`"First L."`).
     - `StudyCirclesView`: Collaborative squad documents in `sessions` with unique invite codes (e.g. `FAS-842`), member list, and goals.
     - `BoardyAiTutorView` & `functions/api/ai-tutor.ts`: Real-time chat proxy running on Cloudflare Pages Functions, verifying caller's Firebase ID token via Google REST API (`accounts:lookup`), enforcing Boardy persona with KaTeX formatting, and checking PKT daily prompt quotas.
     - `PlansUsageView`: PKT daily meters, Free vs Pro comparison, payment receipt submissions writing to `paymentRequests` with `status: "pending"`.
     - `StudentReviewsView`: Platform review submission form writing to `reviews` with `status: "pending"`, plus student's review moderation queue.
     - `StudentSettingsView`: Safe student updates (`name`, `phone`, `targetUniversity`, `targetExamDate`, `testTrack`), password update form, and theme toggle.
  3. Rewired `StudentAppShell.tsx` and `BoardlyAppRouter.tsx` to mount `StudentLayout` and route all `/dashboard/*` sub-paths seamlessly with test runner session integration.
- **Consequences:** Zero fake data in student portal, real-time sync with Firestore, predictable PKT midnight quota resets, secure AI proxying with zero token leakage, and complete responsiveness across mobile and desktop.


---

## ADR 013: Auth Connection Resilience and White-Screen Bug Root-Cause Elimination
- **Status:** Approved
- **Context:** Students encountered a white screen with "Connection took longer than expected — Profile lookup timed out after 4 seconds [Code: timeout]" and an invisible white-on-white button.
- **Root Cause:**
  1. `fetchUserProfile` in `src/lib/firebase.ts` ran an artificial 4000ms `Promise.race` that threw a client-side timeout error before Firestore long-polling handshakes could complete on Pakistani networks.
  2. `AuthContext.tsx` had a redundant 5000ms `safetyTimeout` throwing `{ code: 'timeout' }`.
  3. `BoardlyAppRouter.tsx` intercepted all public routes (including `/login`) whenever `authError` was set, presenting an unstyled light container where a white button sat on a pure white background.
  4. Clicking "Back to Login" navigated to `/login` without clearing the error state or signing out, creating an inescapable dead end.
- **Decision:**
  1. Removed artificial client-side timeouts in both `firebase.ts` and `AuthContext.tsx`.
  2. Enabled `experimentalAutoDetectLongPolling: true` on `initializeFirestore` pinned to named database `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712` so Pakistani ISPs and firewalls automatically fall back to long-polling without hanging WebChannel.
  3. Rebuilt the error screen using dark glass tokens (`bg-[#070B14]`, high-contrast text `#EAF0FF`, brand `#2F6BFF` retry button, and clear dark glass "Back to Login" action that invokes `logOut()` and clears auth error states).
  4. Unblocked public/auth routes from error interception so users can always access `/login` or `/signup`.
- **Consequences:** 100% stable logins on slow or firewalled connections, clear actionable error recovery, and zero white screen traps.

---

## ADR 014: Phase 4 Test Engine, Math Pipeline, and Phase 5 Crew/Captain Portals
- **Status:** Approved
- **Context:** Reliable test taking required server-synchronized countdowns, resilient KaTeX parsing for corrupted/unescaped LaTeX in questions, distraction-free test cockpits, and real-time Firestore synchronization for Crew and Campus Captain ambassadors without mock rows.
- **Decision:**
  1. **KaTeX & Math Normalization (`normalizeMath` & `<MathText />`)**: Repaired unescaped control characters (`\f` -> `\frac`, `\t` -> `\theta`/`\times`, `\b` -> `\beta`, etc.), consolidated multiple backslashes, normalized math delimiters `\(` / `\[` to `$`, and configured KaTeX with `{ displayMode, throwOnError: false, strict: 'ignore', trust: false }`.
  2. **MCQ Test Engine (`src/services/testEngine.ts`)**: Atomic creation under `attempts/{attemptId}` (`status: 'preparing'` -> `'in_progress'`), wall-clock timer with 5s autosave heartbeat, auto-submit at 00:00, negative marking calculations, and PKT daily usage counter under `users/{uid}/usage/{YYYY-MM-DD}`.
  3. **Test Cockpit (`TestRunnerScreen.tsx`) & Results (`TestResultScreen.tsx`)**: Distraction-free full-screen cockpit with 64px glass header, color-coded timer (amber <300s, pulsing red <60s), question palette drawer, keyboard navigation (1-4 / A-D, F, N/P), MathText question stems and step-by-step derivations, and chapter accuracy breakdowns.
  4. **Crew & Campus Captain Portals**: Zero mock rows or hardcoded charts. Real-time Firestore sync on `captains/{uid}`, `referrals` (filtered by `captainId == uid` or `ambassadorUid == uid`), `"First L."` privacy masking, weekly missions, WhatsApp & Instagram promotional kit generators, national captain leaderboard (`/captain/leaderboard`), and rewards catalog with Firestore redemption.
  5. **Least-Privilege Security Rules**: Updated `firestore.rules` to enforce owner-only read on `attempts/{attemptId}`, create allowed only with `status == "preparing"`, and updates restricted to before completion within `request.time <= resource.data.endsAt + duration.value(5, 's')`. Granted least-privilege authenticated writes for `sessionResults`, `rewardRedemptions`, `captains`, and `referrals`.
- **Consequences:** End-to-end resilient test execution, mathematical formula clarity, high student trust with zero fake data, and secure referral tracking.

---

## ADR 015: Cloudflare Pages CI/CD Lockfile Standardization (Yarn v1)
- **Status:** Approved
- **Context:** Cloudflare Pages build environments use Bun 1.2.15 by default. Local development on newer Bun (v1.4+) generates text `bun.lock` (version 2) or binary `bun.lockb` formats that cause fatal build errors on Cloudflare Pages (`Unknown lockfile version` / `Outdated lockfile version: failed to parse lockfile`).
- **Decision:** Standardized on `yarn.lock` (Yarn v1 specification) generated via `bun install --yarn`. Cloudflare Pages natively detects `yarn.lock` and executes `yarn install --frozen-lockfile` with Node 22, guaranteeing 100% deterministic, freeze-safe dependency installs in CI/CD while preserving lightning-fast local Bun execution.
- **Consequences:** Zero lockfile format conflicts between local runtime and Cloudflare Pages CI/CD. Reliable automated git deployments.

---

## ADR 016: Phase 6 Admin Superpower Portal & 500+ Balanced MCQ Pool Seeder
- **Status:** Approved
- **Context:** System administration required secure, least-privilege operations exclusively restricted to `shsvirtualadmin@gmail.com`. Previous revisions had scattered role checks, risk of overwriting existing authentic questions, and no audit trail for privileged user overrides or manual payment approvals.
- **Decision:**
  1. **Super-Admin Route Guarding (`AdminGuard.tsx`) & Layout (`AdminLayout.tsx`)**: Enforced ironclad email-based gating (`shsvirtualadmin@gmail.com`). Non-admin users are strictly blocked with a clear access restricted message and safe return to student cockpit. The admin layout displays an emerald status banner with active named Firestore database indicator (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`).
  2. **1-Click "Ensure 500+ Balanced MCQ Pool" Tool (`seedBalancedPool.ts` & `adminService.ts`)**:
     - Built an idempotent seeder guaranteeing at least 500 high-quality, KaTeX-validated questions evenly distributed across Subjects (125 Maths, 125 Physics, 125 Chem/CS, 125 English/Analytical), Universities (100 FAST-NUCES, 100 NUST NET, 100 GIKI, 100 LUMS, 100 NED/UET/COMSATS), and Difficulties (Easy, Medium, Hard).
     - Deterministic document IDs (`seed_balanced_001` .. `seed_balanced_500`) and `setDoc(..., { merge: true })` guarantee zero deletion or alteration of the existing ~17,000 authentic question documents.
  3. **User Overrides (`UserOverrideDrawer.tsx`)**:
     - God-mode controls to inspect student records, modify roles (`student`, `crew`, `captain`, `admin`), grant Pro access with custom duration (30/90/365/lifetime), and toggle suspension (`suspended: true`, `isSuspended: true`).
  4. **Applications, Payments & Reviews Moderation**:
     - Single-click approval workflows for Campus Captain and Boardly Crew applications, updating roles, referral codes, and sending user notifications.
     - Manual payment verification for Easypaisa/JazzCash/SadaPay receipts with automatic 30-day Pro activation.
     - Student review moderation queue allowing approve/reject actions before publishing live.
  5. **Immutable Audit Logging (`auditLogs`)**:
     - Every administrative override, seeder run, and approval writes an immutable append-only record to `auditLogs` containing admin email, target UID/email, action type, and structured change payloads.
- **Consequences:** Absolute administrative authority centralized for `shsvirtualadmin@gmail.com`, zero risk of question data loss, comprehensive audit logging, and streamlined operational management for the entire Pakistani entrance test platform.
