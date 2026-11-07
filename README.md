# Boardly — MCQ Practice & Competitive Test Platform for FSC & Entry Exams

> **IMPORTANT:** Connected to Firebase project `gen-lang-client-0365509316` (database `ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`).

Boardly (B-O-A-R-D-L-Y) is a mobile-first, diagnostic testing and exam revision platform for Matric (SSC), FSC (HSSC), and Pakistani university entrance tests (MDCAT, ECAT, NUST NET, FAST, GIKI, PIEAS, USAT).

## Core Capabilities
- **Boardy AI**: Socratic exam revision partner with step-by-step formula derivations and LaTeX math.
- **Merit Meter**: Real-time aggregate calculation and admission percentile forecasting.
- **Boardly Blitz**: Rapid, high-intensity timed MCQ drills.
- **Boardly Arena**: Grand national mock exams mimicking official exam patterns with negative marking.
- **Study Circles**: Student and teacher-led study groups with competitive sessions.
- **Campus Captains**: Student ambassador program with referral tracking and missions.
- **Plans**: Only three clean tiers: **Free**, **Pro**, and **Premium**.
- **Official Payment Methods**: Centralized in `src/constants/branding.ts` (`PAYMENT_METHODS`): **JazzCash** (`+923058969050`) and **Opay** (`+923058969050`).

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

---

## Transactional Email Notifications (Resend API) & Cloudflare Email Routing

Boardly dispatches transactional emails through a protected server-side endpoint (`/api/send-email`) powered by the **Resend API** (`https://api.resend.com/emails`), while inbound admin addresses (`admin@boardly.cfd`, `superadmin@boardly.cfd`) are handled by **Cloudflare Email Routing**.

### 1. Required Server-Side Secrets & Environment Variables
Never expose `RESEND_API_KEY` or `INTERNAL_EMAIL_SECRET` in client `VITE_` variables. Configure these in Cloudflare Pages (**Settings → Environment variables**) or via Wrangler:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Boardly <no-reply@boardly.cfd>"
ADMIN_EMAILS=admin@boardly.cfd,superadmin@boardly.cfd
APP_URL=https://boardly.cfd
KOBAN_ALERT_THRESHOLD=1000
ENABLE_TEST_START_EMAIL=false
INTERNAL_EMAIL_SECRET=your_random_32_byte_secret
```

### 2. DNS Configuration (Coexisting Resend Outbound + Cloudflare Email Routing Inbound)
Because **Cloudflare Email Routing** owns the root `@` (`boardly.cfd`) `MX` records for inbound forwarding (`admin@boardly.cfd` and `superadmin@boardly.cfd`), configure **Resend** to use a dedicated sending subdomain (default in Resend: `send.boardly.cfd`) for outbound `MX`/bounce handling while signing `boardly.cfd` with DKIM:

1. **In Resend Dashboard (`Domains → Add Domain`)**:
   - Add `boardly.cfd` (keep the custom Return-Path subdomain as `send` so outbound `MX` and `SPF` live on `send.boardly.cfd`).
2. **In Cloudflare DNS (`boardly.cfd`)**, add the records provided by Resend:
   - **DKIM (`TXT`)**:
     - Name: `resend._domainkey`
     - Content: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4...` (from Resend dashboard)
     - Proxy status: **DNS only**
   - **Outbound Return-Path SPF (`TXT` on `send.boardly.cfd`)**:
     - Name: `send`
     - Content: `v=spf1 include:amazonses.com ~all`
     - Proxy status: **DNS only**
   - **Outbound Bounce MX (`MX` on `send.boardly.cfd`)**:
     - Name: `send`
     - Mail server: `feedback-smtp.<region>.amazonses.com` (from Resend dashboard, priority `10`)
     - Proxy status: **DNS only**
   - **Root SPF (`TXT` on `@` / `boardly.cfd`)**:
     - Merge Cloudflare Email Routing and Resend/SES into a single root SPF TXT record (never create two separate `v=spf1` records on `@`):
       ```txt
       v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all
       ```
   - **DMARC (`TXT` on `_dmarc.boardly.cfd`)**:
     - Name: `_dmarc`
     - Content: `v=DMARC1; p=none; rua=mailto:admin@boardly.cfd`
3. **Keep Cloudflare Email Routing MX Records on `@` (`boardly.cfd`) intact**:
   - Do **not** delete Cloudflare's root `MX` records (`route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net`), so inbound emails to `admin@boardly.cfd` and `superadmin@boardly.cfd` continue forwarding to your verified destination inbox(es).

