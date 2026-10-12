# PROJECT RULES & PERMANENT AUTH GUARDRAILS

**Target Project:** `boardly-8c0cd`  
**Target Auth Domain:** `auth.boardly.cfd`  
**Custom Auth Handler Endpoint:** `https://auth.boardly.cfd/__/auth/handler`

---

## CRITICAL RULES FOR ALL DEVELOPERS AND AI ASSISTANTS

1. **NEVER touch Firebase configuration, authDomain, projectId, auth code, sign-in components, auth context, or token verification** unless the user's explicit task is specifically about modifying authentication architecture. The Firebase web configuration lives as hardcoded constants directly in `src/lib/firebaseConfig.ts` and does not rely on environment variables in production.
2. **NEVER run Firebase auto-setup, auto-provisioning, or "connect Firebase" tools.** Never let any automated flow generate or rewrite `firebase-applet-config.json`.
3. **NEVER create or switch to a new Firebase project** (such as any `gen-lang-client-...` project). The project MUST remain `boardly-8c0cd`.
4. **All new dashboards, pages, views, and features MUST reuse the existing auth context (`useAuth()` from `src/context/AuthContext.tsx`) and the single shared Firebase instance (`src/lib/firebaseConfig.ts` via `src/lib/firebase.ts`).** The Firebase web config lives as permanent constants in `src/lib/firebaseConfig.ts`. Never initialize a second Firebase App or Auth instance.
5. **Always verify builds with `npm run build`**, which executes the `prebuild` guardrail (`scripts/check-firebase-config.mjs`). Any attempt to leak forbidden auth domains or reference `firebase-applet-config.json` will fail the build immediately.
6. **After every change, list changed files and confirm that NO protected file was modified unless explicitly requested.**

---

## PROTECTED FILES LIST

The following files are strictly **PROTECTED**. Every protected file has a comment at the top:
`// PROTECTED: do not modify unless the task is explicitly about authentication. See PROJECT_RULES.md`

- `src/lib/firebaseConfig.ts` (Single source of truth for Firebase constants, initialization & runtime guards)
- `src/lib/firebase.ts` (Firebase service helper layer & queries)
- `src/context/AuthContext.tsx` (React authentication context & state)
- `src/components/auth/LoginPage.tsx` (Login page & Google sign-in trigger)
- `src/components/auth/SignUpPage.tsx` (Sign up page & Google sign-in trigger)
- `scripts/check-firebase-config.mjs` (Prebuild guardrail script)
- `firebase-applet-config.json` (Deprecated, must remain unused)

---

## REQUIRED MANUAL VERIFICATIONS IN CLOUD / FIREBASE CONSOLES

1. **Firebase Console > Authentication > Settings > Authorized Domains:**
   - Ensure both `boardly.cfd` and `auth.boardly.cfd` are present in the Authorized domains list.
2. **Google Cloud Console > APIs & Services > Credentials > Web client (OAuth 2.0 client ID):**
   - **Authorized JavaScript origins:**
     - `https://boardly.cfd`
     - `https://auth.boardly.cfd`
   - **Authorized redirect URIs:**
     - `https://auth.boardly.cfd/__/auth/handler`
