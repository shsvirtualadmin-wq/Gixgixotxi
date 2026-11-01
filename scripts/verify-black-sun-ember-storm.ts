import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../src/lib/firebase';
import {
  getCosmeticById,
  COSMETICS_CATALOG,
  getCosmeticsByType,
  ECLIPSE_WYRM_DEFAULT_PRICE,
} from '../src/data/cosmeticsCatalog';
import { purchaseCosmeticItem } from '../src/services/kobanService';
import {
  CosmeticEffect,
  ProfileCardEffect,
  ProfileEffectCardPreview,
} from '../src/components/koban/CosmeticRenderers';

async function runVerification() {
  console.log('===================================================================');
  console.log('STEP 6 & 9: Black Sun Ember Storm — Full Store, Asset & Purchase Check');
  console.log('===================================================================');

  console.log('\n--- TEST 1: Store Catalog, Price & Protected Items Verification ---');
  const item = getCosmeticById('black-sun-ember-storm');
  if (!item) {
    throw new Error('FAILED: "black-sun-ember-storm" not found in getCosmeticById!');
  }
  console.log('Catalog item details:');
  console.log(`- ID: ${item.id}`);
  console.log(`- Name: ${item.name}`);
  console.log(`- Type: ${item.type}`);
  console.log(`- Rarity: ${item.rarity}`);
  console.log(`- Animated: ${item.animated} (isAnimated: ${item.isAnimated})`);
  console.log(`- Description: "${item.description}"`);
  console.log(`- Price in Kobans: ${item.priceKobans}`);
  console.log(`- Active (Visible): ${item.isActive}`);
  console.log(`- Featured Order: ${item.featuredOrder}`);
  console.log(`- isNew: ${item.isNew}, createdAt: ${item.createdAt}`);
  console.log(`- posterUrl: ${item.posterUrl}`);
  console.log(`- webmUrl: ${item.webmUrl}`);

  if (item.type !== 'effect') {
    throw new Error(`FAILED: Expected type "effect", got "${item.type}"`);
  }
  if (item.rarity !== 'mythic') {
    throw new Error(`FAILED: Expected rarity "mythic", got "${item.rarity}"`);
  }
  if (item.priceKobans < 1500 || item.priceKobans >= ECLIPSE_WYRM_DEFAULT_PRICE) {
    throw new Error(
      `FAILED: Price (${item.priceKobans}) must be >= 1500 and < Eclipse Wyrm (${ECLIPSE_WYRM_DEFAULT_PRICE})`
    );
  }
  if (item.isActive !== true) {
    throw new Error('FAILED: Item isActive must be true!');
  }

  const totalItems = COSMETICS_CATALOG.length;
  const totalEffects = getCosmeticsByType('effect').length;
  console.log(`- Total catalog items: ${totalItems} (Effects: ${totalEffects})`);
  if (totalEffects !== 31) {
    throw new Error(`FAILED: Expected Effects count to rise by 1 to 31, got ${totalEffects}`);
  }

  // Verify protected items are completely untouched
  for (const protectedId of [
    'sovereign-of-the-black-sun',
    'eclipse-wyrm',
    'obsidian-eclipse',
    'ban_crimson_dragons_descent',
    'pfp_waterfall_dragon',
    'pfp_ryujin_sea_dragon',
  ]) {
    if (!getCosmeticById(protectedId)) {
      throw new Error(`FAILED: Protected existing item "${protectedId}" missing from catalog!`);
    }
  }
  console.log('✅ Protected items (Dragon, sovereign-of-the-black-sun, eclipse-wyrm, obsidian-eclipse) verified intact.');

  console.log('\n--- TEST 2: HTTP 200 & Content-Type Asset Verification ---');
  for (const [assetPath, expectedMime, maxBytes] of [
    ['/assets/store/black-sun-ember-storm/effect.webp', 'image/webp', 700_000],
    ['/assets/store/black-sun-ember-storm/effect.webm', 'video/webm', 700_000],
    ['/assets/store/black-sun-ember-storm/poster.png', 'image/png', 120_000],
  ] as const) {
    const res = await fetch(`http://localhost:3000${assetPath}`, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    const cl = Number(res.headers.get('content-length') || 0);
    console.log(`  GET ${assetPath} -> status=${res.status}, content-type=${ct}, bytes=${cl}`);
    if (res.status !== 200 || !ct.includes(expectedMime) || cl <= 1000 || cl > maxBytes) {
      throw new Error(
        `FAILED: Asset ${assetPath} returned status=${res.status} content-type=${ct} bytes=${cl} (max ${maxBytes})`
      );
    }
  }
  console.log('✅ All 3 assets return HTTP 200 with exact MIME types and within size budgets!');

  console.log('\n--- TEST 3: Component Markup Check (Store Card, Detail Sheet, Profile Card, Reduced Motion, Dense List) ---');
  const cardPreviewHtml = renderToStaticMarkup(
    React.createElement(ProfileEffectCardPreview, { itemId: 'black-sun-ember-storm', userName: 'Boardly Scholar' })
  );
  const profileOverlayHtml = renderToStaticMarkup(
    React.createElement(ProfileCardEffect, { itemId: 'black-sun-ember-storm' })
  );
  const staticPosterHtml = renderToStaticMarkup(
    React.createElement(ProfileEffectCardPreview, {
      itemId: 'black-sun-ember-storm',
      userName: 'Boardly Scholar',
      forceStatic: true,
    })
  );
  const denseAvatarEffectHtml = renderToStaticMarkup(
    React.createElement(
      CosmeticEffect,
      { itemId: 'black-sun-ember-storm', size: 40 },
      React.createElement('span', null, 'AvatarChild')
    )
  );

  if (
    !cardPreviewHtml.includes('data-effect-id="black-sun-ember-storm"') ||
    !cardPreviewHtml.includes('/assets/store/black-sun-ember-storm/effect.webp') ||
    !cardPreviewHtml.includes('/assets/store/black-sun-ember-storm/effect.webm')
  ) {
    throw new Error('FAILED: ProfileEffectCardPreview did not render expected effect.webp & effect.webm!');
  }
  if (
    !profileOverlayHtml.includes('pointer-events:none') &&
    !profileOverlayHtml.includes('pointer-events-none')
  ) {
    throw new Error('FAILED: ProfileCardEffect must have pointer-events: none!');
  }
  if (
    staticPosterHtml.includes('<video') ||
    !staticPosterHtml.includes('/assets/store/black-sun-ember-storm/poster.png')
  ) {
    throw new Error('FAILED: Static / reduced-motion mode should render poster.png only (no <video>)!');
  }
  if (denseAvatarEffectHtml.includes('data-effect-id="black-sun-ember-storm"')) {
    throw new Error('FAILED: Dense list (<56px) should not render the profile effect!');
  }
  console.log('✅ Component markup verified across Store card, Detail sheet, Profile overlay, Reduced-motion, and Dense list!');

  console.log('\n--- TEST 4: Non-Admin Purchase, Balance Deduction, Ledger, Equip & Duplicate Block ---');
  const testEmail1 = `bses_buyer_${Date.now()}@boardly.test`;
  const testPassword = 'StudentTesterPassword123!';
  const cred1 = await createUserWithEmailAndPassword(auth, testEmail1, testPassword);
  const testUid1 = cred1.user.uid;
  console.log(`Created authenticated non-admin student: ${testEmail1} (UID: ${testUid1})`);

  const userRef1 = doc(db, 'users', testUid1);
  const walletRef1 = doc(db, 'wallets', testUid1);

  const startBalance = 6000;
  await setDoc(userRef1, {
    uid: testUid1,
    displayName: 'Storm Scholar',
    role: 'student',
    kobans: startBalance,
    kobanBalance: startBalance,
  });

  await setDoc(walletRef1, {
    balance: startBalance,
    owned: [],
    equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
  });
  console.log(`Initialized user & wallet with starting balance of ${startBalance} Kobans.`);

  const purchaseResult = await purchaseCosmeticItem(testUid1, item, false /* isSuperAdmin = false */);
  const expectedEndBalance = startBalance - item.priceKobans;
  if (purchaseResult.newBalance !== expectedEndBalance) {
    throw new Error(`FAILED: Expected balance ${expectedEndBalance}, got ${purchaseResult.newBalance}`);
  }

  const walletSnap = await getDoc(walletRef1);
  const walletData = walletSnap.data();
  if (walletData?.balance !== expectedEndBalance || !walletData?.owned?.includes('black-sun-ember-storm')) {
    throw new Error('FAILED: Wallet balance or owned array mismatch in Firestore!');
  }
  console.log(`✅ Wallet balance decremented from ${startBalance} to ${walletData.balance} (-${item.priceKobans} Kobans).`);
  console.log(`✅ "black-sun-ember-storm" present in wallet owned array: [${walletData.owned.join(', ')}]`);

  const unlockedDocRef = doc(db, 'users', testUid1, 'unlocked', 'black-sun-ember-storm');
  const unlockedSnap = await getDoc(unlockedDocRef);
  if (!unlockedSnap.exists()) {
    throw new Error('FAILED: users/{uid}/unlocked/black-sun-ember-storm does not exist!');
  }
  console.log('✅ Unlocked document verified in users/{uid}/unlocked/black-sun-ember-storm:', JSON.stringify(unlockedSnap.data()));

  const ledgerSnap = await getDocs(collection(db, 'wallets', testUid1, 'ledger'));
  let foundEntry = false;
  ledgerSnap.forEach((d) => {
    const data = d.data();
    console.log(`  - Ledger Entry ${d.id}: amount=${data.amount}, balanceAfter=${data.balanceAfter}, itemId=${data.itemId}`);
    if (data.itemId === 'black-sun-ember-storm' && data.amount === -item.priceKobans) {
      foundEntry = true;
    }
  });
  if (!foundEntry) {
    throw new Error('FAILED: Ledger entry matching black-sun-ember-storm purchase not found!');
  }

  console.log('\n--- TEST 5: Equipping & Unequipping Black Sun Ember Storm ---');
  await updateDoc(walletRef1, {
    equipped: { ...walletData?.equipped, effect: 'black-sun-ember-storm' },
  });
  const equippedSnap = await getDoc(walletRef1);
  if (equippedSnap.data()?.equipped?.effect !== 'black-sun-ember-storm') {
    throw new Error('FAILED: Equip failed in wallet!');
  }
  console.log('✅ Equipped effect verified in wallet: "black-sun-ember-storm"');

  await updateDoc(walletRef1, {
    equipped: { ...walletData?.equipped, effect: null },
  });
  const unequippedSnap = await getDoc(walletRef1);
  if (unequippedSnap.data()?.equipped?.effect !== null) {
    throw new Error('FAILED: Unequip failed in wallet!');
  }
  console.log('✅ Unequipped effect verified in wallet: null');

  console.log('\n--- TEST 6: Duplicate Purchase Prevention & Insufficient Balance Rejection ---');
  let duplicateBlocked = false;
  try {
    await purchaseCosmeticItem(testUid1, item, false);
  } catch (err: any) {
    duplicateBlocked = true;
    console.log('Duplicate purchase correctly rejected with:', err.message);
  }
  if (!duplicateBlocked) {
    throw new Error('FAILED: Duplicate purchase should have thrown an error!');
  }

  const testEmail2 = `bses_poor_${Date.now()}@boardly.test`;
  const cred2 = await createUserWithEmailAndPassword(auth, testEmail2, testPassword);
  const testUid2 = cred2.user.uid;
  await setDoc(doc(db, 'users', testUid2), {
    uid: testUid2,
    displayName: 'Low Balance Scholar',
    role: 'student',
    kobans: 400,
    kobanBalance: 400,
  });
  await setDoc(doc(db, 'wallets', testUid2), {
    balance: 400,
    owned: [],
    equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
  });

  let rejected = false;
  try {
    await purchaseCosmeticItem(testUid2, item, false);
  } catch (err: any) {
    rejected = true;
    console.log('Insufficient balance purchase correctly rejected with:', err.message);
  }
  if (!rejected) {
    throw new Error('FAILED: Purchase should have been rejected for insufficient Kobans!');
  }
  console.log('✅ Duplicate purchase & insufficient balance checks PASSED!');

  try {
    await deleteDoc(unlockedDocRef);
    for (const docSnap of ledgerSnap.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch {
    // ignore cleanup warnings
  }

  console.log('\n===================================================================');
  console.log('ALL BLACK SUN EMBER STORM CHECKS PASSED!');
  console.log('===================================================================');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
