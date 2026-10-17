# PROJECT RULES & PERMANENT AUTH GUARDRAILS

**Target Project:** `gen-lang-client-0365509316`  
**Target Auth Domain:** `gen-lang-client-0366509316.firebaseapp.com`  
**Firestore Named Database ID:** `ai-studio-25287ca6-33a1-49f8-8867-70061120a712`

---

## FIREBASE CONFIGURATION

1. **Target Project:** `gen-lang-client-0365509316` (Default Gemini Project)
2. **Named Database:** `ai-studio-25287ca6-33a1-49f8-8867-70061120a712`
3. **Deprecated Project:** `boardly-8c0cd` (Do not use)
4. **All dashboards, pages, views, and features MUST reuse the existing auth context (`useAuth()` from `src/contexts/AuthContext.tsx`) and the single shared Firebase instance (`src/lib/firebaseConfig.ts` via `src/lib/firebase.ts`).**
