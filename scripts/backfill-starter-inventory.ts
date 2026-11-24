/**
 * One-shot idempotent backfill script for starter avatars & currently equipped cosmetics.
 *
 * Ensures every existing Boardly user has their deterministic starter avatar and any
 * already-equipped cosmetics saved in:
 *   - wallets/{uid}.owned & wallets/{uid}.equipped
 *   - users/{uid}.ownedCosmetics & users/{uid}.equipped
 *   - inventory/{uid}.items & inventory/{uid}.equipped
 *
 * Never modifies Koban balances, plans, subscriptions, roles, or badges.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT='{"project_id":...}' npx tsx scripts/backfill-starter-inventory.ts --dry-run
 *   FIREBASE_SERVICE_ACCOUNT='{"project_id":...}' npx tsx scripts/backfill-starter-inventory.ts --apply
 */

import { FirestoreRestAdmin } from '../functions/_utils/firestoreRestAdmin';
import { mergeCanonicalInventory } from '../src/lib/inventorySource';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Math.max(1, Math.min(2000, Number(limitArg.split('=')[1]) || 500)) : 500;

  const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawSa) {
    console.error(
      'Missing FIREBASE_SERVICE_ACCOUNT env var. Provide the service account JSON string and retry.'
    );
    process.exit(1);
  }

  let serviceAccount: Record<string, any>;
  try {
    serviceAccount = JSON.parse(rawSa);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
    process.exit(1);
  }

  const projectId = String(
    serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID || ''
  ).trim();
  if (!projectId) {
    console.error('Could not determine project_id from FIREBASE_SERVICE_ACCOUNT.');
    process.exit(1);
  }

  const admin = new FirestoreRestAdmin({
    projectId,
    clientEmail: String(serviceAccount.client_email || ''),
    privateKey: String(serviceAccount.private_key || ''),
  });

  console.log(
    `[backfill-starter-inventory] Mode=${dryRun ? 'DRY-RUN' : 'APPLY'} project=${projectId} limit=${limit}`
  );

  const userDocs = await admin.listCollection('users', limit);
  let scanned = 0;
  let needsUpdate = 0;
  let updated = 0;

  for (const userEntry of userDocs) {
    const uid = userEntry.id;
    if (!uid || uid.startsWith('guest_')) continue;
    scanned += 1;

    const [walletDoc, inventoryDoc, publicProfileDoc, invSub, unlockedSub] = await Promise.all([
      admin.getDoc(`wallets/${uid}`).catch(() => null),
      admin.getDoc(`inventory/${uid}`).catch(() => null),
      admin.getDoc(`publicProfiles/${uid}`).catch(() => null),
      admin.listCollection(`users/${uid}/inventory`, 200).catch(() => []),
      admin.listCollection(`users/${uid}/unlocked`, 200).catch(() => []),
    ]);

    const merged = mergeCanonicalInventory({
      uid,
      walletDoc,
      userDoc: userEntry.data,
      inventoryDoc,
      publicProfileDoc,
      inventorySubcollectionDocs: invSub,
      unlockedSubcollectionDocs: unlockedSub,
    });

    if (!merged.needsBackfill) continue;
    needsUpdate += 1;

    console.log(
      `  -> uid=${uid} (@${userEntry.data?.username || 'unknown'}) owned=${merged.owned.length} equippedCount=${merged.equippedCount} starter=${merged.starterIds.join(',')}`
    );

    if (!dryRun) {
      const nowIso = new Date().toISOString();
      const existingWalletBalance =
        walletDoc && typeof walletDoc.balance === 'number' && Number.isFinite(walletDoc.balance)
          ? Math.max(0, Math.floor(walletDoc.balance))
          : Math.max(
              typeof userEntry.data?.kobans === 'number' ? Math.floor(userEntry.data.kobans) : 0,
              typeof userEntry.data?.kobanBalance === 'number'
                ? Math.floor(userEntry.data.kobanBalance)
                : 0
            );

      await Promise.all([
        admin.setDoc(
          `wallets/${uid}`,
          {
            ...(walletDoc ? {} : { balance: existingWalletBalance }),
            owned: merged.owned,
            equipped: merged.equipped,
            starterBackfilledAt: nowIso,
            updatedAt: nowIso,
          },
          true
        ),
        admin.setDoc(
          `users/${uid}`,
          {
            ownedCosmetics: merged.owned,
            equipped: merged.equipped,
            avatar: merged.equipped.avatar,
            equippedAvatar: merged.equipped.avatar,
            updatedAt: nowIso,
          },
          true
        ),
        admin.setDoc(
          `inventory/${uid}`,
          {
            uid,
            items: merged.owned,
            owned: merged.owned,
            equipped: merged.equipped,
            updatedAt: nowIso,
          },
          true
        ),
      ]);
      updated += 1;
    }
  }

  console.log(
    `[backfill-starter-inventory] Done. scanned=${scanned} needsUpdate=${needsUpdate} updated=${updated}`
  );
}

main().catch((err) => {
  console.error('[backfill-starter-inventory] Fatal error:', err);
  process.exit(1);
});
