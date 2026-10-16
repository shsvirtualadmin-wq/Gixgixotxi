# Boardly Technical Specification & System Architecture

**Document Version:** 1.0.0  
**Target Project:** `gen-lang-client-0366509316`  
**Named Firestore Database:** `ai-studio-25287ca6-33a1-49f8-8867-70061120a712`  
**Authorized Auth Domain:** `gen-lang-client-0366509316.firebaseapp.com`  
**Sole Super Admin:** `shsvirtualadmin@gmail.com`  

---

## 1. System Overview

Boardly (`boardly.cfd`) is a high-performance, dark-glass study cockpit and MCQ test-preparation platform built specifically for Pakistani university entrance tests (FAST-NUCES, NUST NET, GIKI, MDCAT, TCAT, ECAT, LUMS, NED, PIEAS, etc.) and intermediate boards (FBISE, Punjab, Sindh, KPK).

The application is engineered as a modern Single Page Application (SPA) deployed to Cloudflare Pages with Cloudflare Pages Functions (`/functions`) providing serverless compute, AI proxying (Gemini 2.5 Flash), and Firebase authentication token verification.

---

## 2. Complete Application Sitemap

```
/
├── / (Marketing Landing Page)
│   ├── Floating Glass Navbar (Pill style, logo, links, CTA)
│   ├── Hero (Title, subline, CTA, trust chips, interactive neutral PhoneMockup)
│   ├── Bento-grid Features (KaTeX derivations, test tracks, analytics, AI buddy)
│   ├── Live Arena & Blitz Leaderboard Strip
│   ├── 3-Step "How Boardly Works"
│   ├── Pricing (Free Starter vs Pro Tier PKR 199/month, Pakistan payment methods)
│   ├── Student Reviews Wall (Provided authentic quotes preserved)
│   ├── FAQ Section
│   └── Footer (Terms, Privacy, Contact, Disclaimers)
├── /features
├── /pricing
├── /reviews
├── /privacy
├── /terms
├── /contact
│
├── (Authentication & Onboarding)
│   ├── /login (Google Sign-In Popup & Email/Password, single-stage loader)
│   ├── /signup (Registration with ?ref=CODE referral attribution)
│   ├── /forgot-password
│   ├── /verify-email
│   └── /onboarding (4-Step Student Setup Wizard)
│       ├── Step 1: Target University & Test Track (FAST, NUST, MDCAT, etc.)
│       ├── Step 2: Target Exam Date & Timeline
│       ├── Step 3: Priority Subjects & Self-Assessed Weak Chapters
│       └── Step 4: Summary Confirmation & Dashboard Launch
│
├── (Student Study Cockpit - Protected)
│   ├── /dashboard (Study Overview: exam countdown, daily limits PKT, streak, weak chapters)
│   ├── /practice (Chapter-wise questions by subject, university, difficulty)
│   ├── /past-papers (Past test vaults for FAST, NUST, GIKI, ECAT, MDCAT)
│   ├── /test/live/:attemptId (Distraction-free test engine with live sticky timer & palette)
│   ├── /history (Past attempts review with step-by-step KaTeX explanations)
│   ├── /merit-meter (Pakistani Universities aggregate & formula calculator)
│   ├── /events (Boardly Blitz & Boardly Arena live competitive mocks)
│   ├── /study-circles (Collaborative peer circles with private join codes)
│   ├── /ai-tutor (Boardy 24/7 AI tutor with KaTeX math rendering)
│   ├── /plans (Plan status, daily usage limits, manual payment slip upload)
│   └── /settings (Account profile, academic target updates, password management)
│
├── (Boardly Crew & Campus Captain - Role Protected)
│   ├── /crew (Crew Dashboard: referral link, WhatsApp share, active students, missions, rewards)
│   ├── /crew/apply (Student ambassador application)
│   ├── /captain (Campus Captain command center: points, tier, campus rank, promo kit)
│   └── /captain/apply (Campus Captain application)
│
└── (Super Admin Portal - Strictly shsvirtualadmin@gmail.com)
    ├── /admin (Overview metrics, 30-day signup chart, plan distribution, AI token telemetry)
    ├── /admin/students (Directory: search, filters, plan grant/revoke, suspend/unsuspend, details drawer)
    ├── /admin/questions (Question bank: pagination, KaTeX validation status, add/edit/delete, CSV import)
    ├── /admin/applications (Crew & Captain application review & approvals)
    ├── /admin/payments (Manual payment slips review: approve/reject bank/jazzcash/easypaisa)
    ├── /admin/reviews (Student review moderation queue: approve/reject)
    ├── /admin/events (Blitz & Arena live session management)
    ├── /admin/universities (University registry & merit formula configuration)
    └── /admin/audit-logs (Immutable administrative audit trail)
```

---

## 3. Route Guards & Authorization Hierarchy

```
                                [Incoming Request]
                                        │
                                        ▼
                                 [SuspensionGuard]
                 Is user document flagged status == 'suspended'?
                                ├── YES ──> [Sign Out] -> Alert: "Account suspended."
                                └── NO
                                        │
                                        ▼
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
                 [GuestOnly Route]              [Protected Route]
                (/login, /signup)               (/dashboard, /practice...)
                        │                               │
             Is request.auth != null?        Is request.auth != null?
              ├── YES ──> Redirect            ├── NO ──> Redirect to /login
              │           to /dashboard       └── YES
              └── NO  ──> Render Page                   │
                                                        ▼
                                              [RequireOnboarding]
                                      Has user completed onboarding?
                                      ├── NO  ──> Redirect to /onboarding
                                      └── YES
                                                        │
                                                        ▼
                                                  [Role Checks]
                                      ┌─────────────────┼─────────────────┐
                                      ▼                 ▼                 ▼
                                [RequireAdmin]   [RequireCaptain]   [RequireCrew]
                              email lowercased   role in ['captain',  isCrewMember
                             === shsvirtualadmin@  'admin'] ||          === true ||
                                  gmail.com       captains doc active   roles.includes('crew')
```

### Route Guard Specifics

1. **`GuestOnly`**:
   - Applies to `/login`, `/signup`, `/forgot-password`.
   - If user is already authenticated and `onboardingCompleted` is true, redirects to `/dashboard`.
   - If authenticated and `onboardingCompleted` is false, redirects to `/onboarding`.

2. **`RequireAuth`**:
   - Applied to all student, crew, captain, and admin routes.
   - Waits for Firebase Auth `onAuthStateChanged` to resolve (single initial Boardly logo preloader).
   - If not signed in, preserves target path in location state and redirects to `/login`.

3. **`RequireOnboarding`**:
   - Enforces that student has completed the 4-step academic profile setup.
   - Evaluated using: `userDoc.onboardingCompleted === true || userDoc.registrationComplete === true || (userDoc.targetUniversity && userDoc.grade) || userEmail === 'shsvirtualadmin@gmail.com'`.
   - Directs incomplete users to `/onboarding`.

4. **`RequireAdmin`**:
   - Single super admin lock: `auth.currentUser?.email?.toLowerCase().trim() === 'shsvirtualadmin@gmail.com'`.
   - Never relies on client-side roles, claims, or database flags alone.
   - Non-admin attempts are bounced to `/dashboard` with an explicit permission warning toast and security log.

5. **`SuspensionGuard`**:
   - Checked on every profile load and route transition.
   - If `status === 'suspended'` or `isSuspended === true`, immediately signs out the user via `auth.signOut()`, purges local cache, and displays: `"Your account has been suspended. Contact support@boardly.cfd."`

---

## 4. Collection Permissions Matrix & Data Model

The database is the **Named Firestore Database** `ai-studio-25287ca6-33a1-49f8-8867-70061120a712` in Firebase project `gen-lang-client-0366509316`.

| # | Collection Path | Primary Document ID | Read Access | Create Access | Update Access | Delete Access |
|---|---|---|---|---|---|---|
| 1 | `users` | `{firebaseUid}` | Owner (`uid == request.auth.uid`), matching email, or Admin | Owner or Admin | Owner (unprotected fields only) or Admin | Admin only |
| 2 | `questions` | `{questionId}` | Authenticated Users & Admin | Admin only | Admin only | Admin only |
| 3 | `sheets` | `{sheetId}` | Authenticated Users & Admin | Admin only | Admin only | Admin only |
| 4 | `universities` | `{universityId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 5 | `meritFormulas` | `{formulaId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 6 | `announcements` | `{announcementId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 7 | `config` | `{configId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 8 | `events` | `{eventId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 9 | `sessions` | `{sessionId}` | Public (`true`) | Authenticated or Admin | Session Organizer or Admin | Admin only |
| 10 | `sessionResults` | `{resultId}` | Public (`true`) | Admin only | Admin only | Admin only |
| 11 | `registrations` | `{regId}` | Owner or Admin | Authenticated Owner or Admin | Admin only | Admin only |
| 12 | `crewEvents` | `{eventId}` | Public (`true`) | Authenticated or Admin | Event Organizer or Admin | Event Organizer or Admin |
| 13 | `crewEventAttempts` | `{attemptId}` | Public (`true`) | Authenticated Owner or Admin | Admin only | Admin only |
| 14 | `crewApplications` | `{appId}` | Owner (`appId == uid`) or Admin | Authenticated Owner | Admin only | Admin only |
| 15 | `captainApplications` | `{appId}` | Owner (`appId == uid`) or Admin | Authenticated Owner | Admin only | Admin only |
| 16 | `captains` | `{captainId}` | Authenticated Users or Admin | Admin or Authenticated Captain | Captain (own doc) or Admin | Admin only |
| 17 | `referrals` | `{referralId}` | Ambassador, Referred User, or Admin | Authenticated Owner or Admin | Admin only | Admin only |
| 18 | `missions` | `{missionId}` | Authenticated Users or Admin | Admin only | Admin only | Admin only |
| 19 | `rewards` | `{rewardId}` | Authenticated Users or Admin | Admin only | Admin only | Admin only |
| 20 | `rewardRedemptions` | `{redemptionId}` | Owner or Admin | Authenticated Owner | Admin only | Admin only |
| 21 | `paymentRequests` | `{requestId}` | Owner or Admin | Authenticated Owner | Admin only | Admin only |
| 22 | `supportTickets` | `{ticketId}` | Owner or Admin | Public / Guest / Authenticated | Admin only | Admin only |
| 23 | `reviews` | `{reviewId}` | Approved: Public; Pending: Author or Admin | Authenticated Author (`status: 'pending'`, rating 1-5) | Author (pending only) or Admin | Author or Admin |
| 24 | `notifications` | `{notifId}` | Recipient (`userId == uid`) or Admin | Authenticated or Admin | Recipient (read flag) or Admin | Admin only |
| 25 | `certificates` | `{certId}` | Recipient (`userId == uid`) or Admin | Admin only | Admin only | Admin only |
| 26 | `organizers` | `{organizerId}` | Authenticated Users or Admin | Admin only | Admin only | Admin only |
| 27 | `organizerApplications` | `{appId}` | Owner (`userId == uid`) or Admin | Authenticated Owner | Admin only | Admin only |
| 28 | `auditLogs` | `{logId}` | Admin only | Authenticated or Admin | **NEVER** (`false`) | **NEVER** (`false`) |
| 29 | `admins` | `{adminId}` | Admin only | Admin only | Admin only | Admin only |

---

## 5. Non-Negotiable Protected Student Fields

Students are strictly blocked by Firestore Security Rules and UI form validators from writing or mutating any of the following 20 administrative keys:

```typescript
export const PROTECTED_STUDENT_FIELDS = [
  'role',
  'roles',
  'plan',
  'isPremium',
  'premium',
  'premiumExpiresAt',
  'premiumSource',
  'previousPlan',
  'isCrewMember',
  'crewStatus',
  'crewStartDate',
  'crewReferralCode',
  'crewRevokedAt',
  'crewRevokeReason',
  'isPaidInternshipEligible',
  'ambassador',
  'admin',
  'isAdmin',
  'suspended',
  'isSuspended'
] as const;
```

Any client attempt by a non-admin to mutate these keys triggers a Firestore permission-denied rejection, logged with `handleFirestoreError`.

---

## 6. Daily Usage Tracking Architecture (PKT Timezone)

Student daily limits (Free vs Pro) are partitioned per day using Pakistan Standard Time (`Asia/Karachi`, UTC+5) under the subcollection:
`users/{uid}/usage/{YYYY-MM-DD}`

Document structure:
```typescript
interface DailyUsageRecord {
  testsTaken: number;
  questionsAnswered: number;
  boardyQuestionsAsked: number;
  dateStr: string; // "2026-10-15" (PKT)
  lastUpdated: string; // ISO string
}
```

- **Free Tier Allowances:**
  - Tests per day: 3 practice sprints
  - Boardy AI questions per day: 10 queries
- **Pro Tier Allowances (PKR 199/month):**
  - Unlimited practice sprints and past papers
  - Boardy AI questions per day: 100 queries with step-by-step KaTeX formula derivation
