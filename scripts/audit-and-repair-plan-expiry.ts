/**
 * Superadmin CLI for Step 3: Plan Expiry Audit & `pkig` Data Repair.
 *
 * Requires `FIREBASE_SERVICE_ACCOUNT` (or `GOOGLE_SERVICE_ACCOUNT_KEY`) in env.
 *
 * Usage:
 *   # Read-only audit: prints pkig's full activation history & flags any users whose expiry
 *   # exceeds the sum of their purchased days (NEVER modifies other users automatically).
 *   npx tsx scripts/audit-and-repair-plan-expiry.ts --audit
 *
 *   # Atomically repairs pkig's Plus expiry to 24 Nov 2027 23:59:59.999 PKT and records
 *   # audit entry "Corrected duplicate days from activation bug" (preserves all history).
 *   npx tsx scripts/audit-and-repair-plan-expiry.ts --repair-pkig
 */

import { handleEconomyApiRequest } from '../functions/api/economy/[[path]]';

async function main() {
  const args = new Set(process.argv.slice(2));
  const runAudit = args.has('--audit') || (!args.has('--repair-pkig') && args.size === 0);
  const runRepair = args.has('--repair-pkig');

  const env = {
    FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID,
  };

  if (!env.FIREBASE_SERVICE_ACCOUNT && !env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error(
      'ERROR: FIREBASE_SERVICE_ACCOUNT (or GOOGLE_SERVICE_ACCOUNT_KEY) must be set in your environment.'
    );
    process.exit(1);
  }

  const cliSuperAdminVerifier = async () => ({
    uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
    email: 'shsvirtualadmin@gmail.com',
    emailVerified: true,
    name: 'PKIG (CLI Superadmin)',
    superAdmin: true,
    isSuperAdmin: true,
    admin: true,
    isAdminOrAbove: true,
    role: 'superadmin',
  });

  if (runAudit) {
    const res = await handleEconomyApiRequest({
      request: new Request('https://boardly.cfd/api/admin/plan-audit?username=pkig', {
        method: 'GET',
        headers: { Authorization: 'Bearer cli-superadmin' },
      }),
      env,
      tokenVerifierOverride: cliSuperAdminVerifier,
    });
    const data = await res.json();
    console.log('\n=== PLAN EXPIRY AUDIT (READ-ONLY) ===');
    console.log(JSON.stringify(data, null, 2));
  }

  if (runRepair) {
    const res = await handleEconomyApiRequest({
      request: new Request('https://boardly.cfd/api/admin/plan-repair-pkig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer cli-superadmin',
        },
        body: JSON.stringify({}),
      }),
      env,
      tokenVerifierOverride: cliSuperAdminVerifier,
    });
    const data = await res.json();
    console.log('\n=== PKIG PLAN EXPIRY REPAIR ===');
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
