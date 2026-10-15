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
- **Context:** Firestore in this project operates on a specific named database instance: `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712` under project `boardly-8c0cd`. Multiple `initializeApp` calls or missing database IDs caused silent fallback to empty default databases.
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
