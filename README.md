# Boardly — MCQ Practice & Competitive Test Platform for FSC & Entry Exams

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

## Firebase Authentication & Custom Domain SSL Setup

### 1. Authorized Domains
In the **Firebase Console** under **Authentication → Settings → Authorized domains**, ensure the following domains are added:
- `boardly.cfd`
- `www.boardly.cfd`
- `gen-lang-client-0365509316.firebaseapp.com`
- Your Cloudflare Pages deployment domain (`*.pages.dev`)
- `localhost`
- The AI Studio development & preview domains

### 2. Custom Domain SSL Provisioning Steps (Manual)
To safely issue an SSL certificate for an auth subdomain (such as `auth.boardly.cfd`):
1. In the **Firebase Console**, navigate to **Hosting** and click **Add custom domain**.
2. Enter your desired subdomain (e.g., `auth.boardly.cfd`).
3. Firebase will provide `A` or `CNAME` verification records.
4. In your DNS provider (e.g., Cloudflare), create the records and **temporarily set proxy status to DNS only (Grey Cloud)** so Firebase / Google Trust Services can complete the ACME certificate validation.
5. Wait until Firebase Hosting displays the status as **Connected** with an active SSL certificate.
6. Once connected, update `VITE_FIREBASE_AUTH_DOMAIN` in your deployment environment variables.
7. In Google Cloud Console (**APIs & Services → Credentials → OAuth 2.0 Client IDs**), add the authorized redirect URI: `https://<YOUR_AUTH_DOMAIN>/__/auth/handler`.
