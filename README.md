# Boardly — MCQ Practice & Competitive Test Platform for FSC & Entry Exams

> **IMPORTANT:** Read [PROJECT_RULES.md](./PROJECT_RULES.md) before making any code modifications. Firebase auth configuration is protected and permanently pinned to `boardly-8c0cd` and `auth.boardly.cfd`.

Boardly (B-O-A-R-D-L-Y) is a mobile-first, diagnostic testing and exam revision platform for Matric (SSC), FSC (HSSC), and Pakistani university entrance tests (MDCAT, ECAT, NUST NET, FAST, GIKI, PIEAS, USAT).

## Core Capabilities
- **Boardy AI**: Socratic exam revision partner with step-by-step formula derivations and LaTeX math.
- **Merit Meter**: Real-time aggregate calculation and admission percentile forecasting.
- **Boardly Blitz**: Rapid, high-intensity timed MCQ drills.
- **Boardly Arena**: Grand national mock exams mimicking official exam patterns with negative marking.
- **Study Circles**: Student and teacher-led study groups with competitive sessions.
- **Campus Captains**: Student ambassador program with referral tracking and missions.
- **Plans**: Only three clean tiers: **Free**, **Pro**, and **Premium**.

---

## Firebase Environment Configuration

The application requires seven client environment variables configured for Firebase:

```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FIRESTORE_DATABASE_ID
```

### Where to Find Values
- Go to **Firebase Console → Project settings → General → Your apps → Web app → Config**.
- Copy the values for `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` corresponds to your specific named Firestore database ID (or `(default)`).

### Security & Build Notes
- **Public by Design**: These web Firebase configuration values are included in the frontend client bundle and are public by design.
- **Never Put Secrets in `VITE_` Variables**: Backend API secrets, service account credentials, Gemini API keys, or database private keys must never be placed in `VITE_` variables or `wrangler.toml [vars]`. Those belong exclusively in server-side Pages Functions secrets or secure environment variables.
- **Baked In at Build Time**: All `VITE_` variables are replaced statically at build time during `vite build`. Any update or change to an environment variable requires a rebuild and redeployment of the application.
- **Cloudflare Pages `wrangler.toml [vars]` Precedence**: When `wrangler.toml` contains a `[vars]` table, Cloudflare Pages treats `wrangler.toml` as the authoritative source of truth and blocks overriding them in the Cloudflare dashboard UI. Always manage project environment variables directly in `wrangler.toml`.

## Firebase Authentication & Custom Domain SSL Setup

### 1. Authorized Domains
In the **Firebase Console** under **Authentication → Settings → Authorized domains**, ensure the following domains are added:
- `boardly.cfd`
- `www.boardly.cfd`
- `auth.boardly.cfd`
- Your Cloudflare Pages deployment domain (`*.pages.dev`)
- `localhost`
- The AI Studio development & preview domains

### 2. Custom Domain SSL Provisioning Steps (Manual)
To safely issue an SSL certificate for an auth domain:
1. In the **Firebase Console**, navigate to **Hosting** and click **Add custom domain**.
2. Enter your desired custom domain if configured.
3. Firebase will provide `A` or `CNAME` verification records.
4. In your DNS provider (e.g., Cloudflare), create the records and **temporarily set proxy status to DNS only (Grey Cloud)** so Firebase / Google Trust Services can complete the ACME certificate validation.
5. Wait until Firebase Hosting displays the status as **Connected** with an active SSL certificate.
6. Once connected, update `VITE_FIREBASE_AUTH_DOMAIN` in your deployment environment variables.
7. In Google Cloud Console (**APIs & Services → Credentials → OAuth 2.0 Client IDs**), add the authorized redirect URI: `https://<YOUR_AUTH_DOMAIN>/__/auth/handler`.
