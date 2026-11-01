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
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { db, auth } from '../src/lib/firebase';
import { getCosmeticById, COSMETICS_CATALOG, getCosmeticsByType } from '../src/data/cosmeticsCatalog';
import { purchaseCosmeticItem } from '../src/services/kobanService';
import { AvatarPicture } from '../src/components/koban/CosmeticRenderers';
import { BoardlyAvatar } from '../src/components/ui/BoardlyAvatar';

async function runPurchaseVerification() {
  console.log('=============================================================');
  console.log('STEP 6: Full Store, Asset, Render & Non-Admin Purchase Check');
  console.log('=============================================================');

  console.log('\n--- TEST 1: Store Catalog & Asset Path Verification ---');
  const item = getCosmeticById('eclipse-wyrm');
  if (!item) {
    throw new Error('FAILED: "eclipse-wyrm" not found in getCosmeticById!');
  }
  console.log('Catalog item details:');
  console.log(`- ID: ${item.id}`);
  console.log(`- Name: ${item.name}`);
  console.log(`- Type: ${item.type}`);
  console.log(`- Rarity: ${item.rarity}`);
  console.log(`- Animated: ${item.animated} (isAnimated: ${item.isAnimated})`);
  console.log(`- Description: "${item.description}"`);
  console.log(`- Price in Kobans: ${item.priceKobans}`);
  console.log(`- Featured Order: ${item.featuredOrder}`);
  console.log(`- isNew: ${item.isNew}, createdAt: ${item.createdAt}`);
  console.log(`- posterUrl: ${item.posterUrl}`);
  console.log(`- webmUrl: ${item.webmUrl}`);
  console.log(`- mp4Url: ${item.mp4Url}`);

  if (item.posterUrl !== '/assets/store/eclipse-wyrm/poster.webp') {
    throw new Error(`FAILED: Expected posterUrl "/assets/store/eclipse-wyrm/poster.webp", got "${item.posterUrl}"`);
  }
  if (item.webmUrl !== '/assets/store/eclipse-wyrm/avatar.webm') {
    throw new Error(`FAILED: Expected webmUrl "/assets/store/eclipse-wyrm/avatar.webm", got "${item.webmUrl}"`);
  }
  if (item.mp4Url !== '/assets/store/eclipse-wyrm/avatar.mp4') {
    throw new Error(`FAILED: Expected mp4Url "/assets/store/eclipse-wyrm/avatar.mp4", got "${item.mp4Url}"`);
  }

  const totalItems = COSMETICS_CATALOG.length;
  const totalAvatars = getCosmeticsByType('avatar').length;
  console.log(`- Total catalog items: ${totalItems} (Avatars: ${totalAvatars})`);

  // Verify existing Dragon and sovereign-of-the-black-sun are intact
  for (const existingId of ['sovereign-of-the-black-sun', 'ban_crimson_dragons_descent', 'pfp_waterfall_dragon', 'pfp_ryujin_sea_dragon']) {
    if (!getCosmeticById(existingId)) {
      throw new Error(`FAILED: Protected existing item "${existingId}" missing from catalog!`);
    }
  }
  console.log('✅ Protected existing Dragon items and "sovereign-of-the-black-sun" banner verified intact.');

  // Check highest other item
  const otherItems = COSMETICS_CATALOG.filter((it) => it.id !== 'eclipse-wyrm');
  const maxOtherPrice = Math.max(...otherItems.map((it) => it.priceKobans || 0));
  console.log(`- Highest price among other items: ${maxOtherPrice} Kobans`);

  if (item.priceKobans <= maxOtherPrice) {
    throw new Error(`FAILED: Eclipse Wyrm price (${item.priceKobans}) is not strictly higher than other items (${maxOtherPrice})`);
  }
  if (item.priceKobans < maxOtherPrice * 1.5) {
    throw new Error(`FAILED: Eclipse Wyrm price (${item.priceKobans}) is not >= 1.5x max other price (${maxOtherPrice * 1.5})`);
  }
  if (item.priceKobans < 5000) {
    throw new Error(`FAILED: Eclipse Wyrm price (${item.priceKobans}) is not >= 5000 Kobans`);
  }
  console.log('✅ Catalog price check PASSED! Flagship is priced at exactly', item.priceKobans, 'Kobans.');

  console.log('\n--- TEST 1B: HTTP Asset Verification & Player Markup Check ---');
  for (const [assetPath, expectedMime] of [
    ['/assets/store/eclipse-wyrm/poster.webp', 'image/webp'],
    ['/assets/store/eclipse-wyrm/avatar.webm', 'video/webm'],
    ['/assets/store/eclipse-wyrm/avatar.mp4', 'video/mp4'],
  ] as const) {
    const res = await fetch(`http://localhost:3000${assetPath}`, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    const cl = Number(res.headers.get('content-length') || 0);
    console.log(`  GET ${assetPath} -> status=${res.status}, content-type=${ct}, bytes=${cl}`);
    if (res.status !== 200 || !ct.includes(expectedMime) || cl <= 1000) {
      throw new Error(`FAILED: Asset ${assetPath} returned status=${res.status} content-type=${ct} bytes=${cl}`);
    }
  }

  const largeHtml = renderToStaticMarkup(React.createElement(AvatarPicture, { itemId: 'eclipse-wyrm', size: 148 }));
  const denseHtml = renderToStaticMarkup(React.createElement(AvatarPicture, { itemId: 'eclipse-wyrm', size: 40 }));
  const profileHtml = renderToStaticMarkup(React.createElement(BoardlyAvatar, { equippedAvatar: 'eclipse-wyrm', size: 120 }));

  if (!largeHtml.includes('data-avatar-id="eclipse-wyrm"') || !largeHtml.includes('/assets/store/eclipse-wyrm/avatar.webm') || !largeHtml.includes('/assets/store/eclipse-wyrm/avatar.mp4')) {
    throw new Error('FAILED: Large AvatarPicture did not render expected video & source markup!');
  }
  if (largeHtml.includes('Eclipse Wyrm Avatar')) {
    throw new Error('FAILED: Large AvatarPicture still contains broken-image alt text "Eclipse Wyrm Avatar"!');
  }
  if (denseHtml.includes('<video') || !denseHtml.includes('/assets/store/eclipse-wyrm/poster.webp')) {
    throw new Error('FAILED: Dense 40x40 AvatarPicture should render poster only (no <video>)!');
  }
  if (!profileHtml.includes('data-avatar-id="eclipse-wyrm"')) {
    throw new Error('FAILED: BoardlyAvatar did not render PfpEclipseWyrm when equipped!');
  }
  console.log('✅ HTTP asset headers & player markup (Store card, Detail sheet, Dense list, Profile header) PASSED!');

  // User 1: Test sufficient balance, purchase deduction, ledger recording, equip, and duplicate block
  console.log('\n--- TEST 2: Sufficient Balance Purchase & Balance Drop (Normal Non-Admin) ---');
  const testEmail1 = `wyrm_buyer_${Date.now()}@boardly.test`;
  const testPassword = 'StudentTesterPassword123!';
  const cred1 = await createUserWithEmailAndPassword(auth, testEmail1, testPassword);
  const testUid1 = cred1.user.uid;
  console.log(`Created authenticated non-admin student: ${testEmail1} (UID: ${testUid1})`);

  const userRef1 = doc(db, 'users', testUid1);
  const walletRef1 = doc(db, 'wallets', testUid1);

  const startBalance = 12000;
  await setDoc(userRef1, {
    uid: testUid1,
    displayName: 'Wyrm Buyer',
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
  console.log(`Purchase executed successfully! Returned new balance: ${purchaseResult.newBalance}`);

  if (purchaseResult.newBalance !== expectedEndBalance) {
    throw new Error(`FAILED: Expected balance ${expectedEndBalance}, got ${purchaseResult.newBalance}`);
  }

  // Verify wallet document in database
  const walletSnap = await getDoc(walletRef1);
  const walletData = walletSnap.data();
  if (walletData?.balance !== expectedEndBalance) {
    throw new Error(`FAILED: Database wallet balance is ${walletData?.balance}, expected ${expectedEndBalance}`);
  }
  if (!walletData?.owned?.includes('eclipse-wyrm')) {
    throw new Error('FAILED: Database wallet owned array does not contain "eclipse-wyrm"');
  }
  console.log(`✅ Wallet balance decremented from ${startBalance} to ${walletData.balance} (-${item.priceKobans} Kobans).`);
  console.log(`✅ "eclipse-wyrm" present in wallet owned array: [${walletData.owned.join(', ')}]`);

  // Verify unlocked document in database
  const unlockedDocRef = doc(db, 'users', testUid1, 'unlocked', 'eclipse-wyrm');
  const unlockedSnap = await getDoc(unlockedDocRef);
  if (!unlockedSnap.exists()) {
    throw new Error('FAILED: users/{uid}/unlocked/eclipse-wyrm does not exist!');
  }
  console.log('✅ Unlocked document verified in users/{uid}/unlocked/eclipse-wyrm:', JSON.stringify(unlockedSnap.data()));

  // Verify ledger entry
  const ledgerSnap = await getDocs(collection(db, 'wallets', testUid1, 'ledger'));
  if (ledgerSnap.empty) {
    throw new Error('FAILED: No ledger entry found in wallets/{uid}/ledger!');
  }
  console.log(`✅ Found ${ledgerSnap.size} ledger entry/entries:`);
  let foundWyrmEntry = false;
  ledgerSnap.forEach((d) => {
    const data = d.data();
    console.log(`  - Entry ${d.id}: amount=${data.amount}, balanceAfter=${data.balanceAfter}, itemId=${data.itemId}`);
    if (data.itemId === 'eclipse-wyrm' && data.amount === -item.priceKobans) {
      foundWyrmEntry = true;
    }
  });
  if (!foundWyrmEntry) {
    throw new Error('FAILED: Ledger entry matching eclipse-wyrm purchase not found!');
  }

  console.log('\n--- TEST 3: Equipping the New Avatar ---');
  const updatedEquipped = {
    ...walletData?.equipped,
    avatar: 'eclipse-wyrm',
  };
  await updateDoc(walletRef1, { equipped: updatedEquipped });

  const verifyEquipSnap = await getDoc(walletRef1);
  const equipData = verifyEquipSnap.data();
  if (equipData?.equipped?.avatar !== 'eclipse-wyrm') {
    throw new Error(`FAILED: Equipped avatar is ${equipData?.equipped?.avatar}, expected "eclipse-wyrm"`);
  }
  console.log('✅ Equip check PASSED! Equipped avatar in wallet is now "eclipse-wyrm".');

  console.log('\n--- TEST 4: Duplicate Purchase Prevention ---');
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
  console.log('✅ Duplicate purchase prevention PASSED!');

  // User 2: Insufficient balance rejection
  console.log('\n--- TEST 5: Insufficient Balance Rejection (Normal Non-Admin) ---');
  const testEmail2 = `wyrm_poor_${Date.now()}@boardly.test`;
  const cred2 = await createUserWithEmailAndPassword(auth, testEmail2, testPassword);
  const testUid2 = cred2.user.uid;
  console.log(`Created second authenticated non-admin student: ${testEmail2} (UID: ${testUid2})`);

  const userRef2 = doc(db, 'users', testUid2);
  const walletRef2 = doc(db, 'wallets', testUid2);

  await setDoc(userRef2, {
    uid: testUid2,
    displayName: 'Poor Student',
    role: 'student',
    kobans: 500,
    kobanBalance: 500,
  });

  await setDoc(walletRef2, {
    balance: 500,
    owned: [],
    equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
  });

  let rejected = false;
  try {
    await purchaseCosmeticItem(testUid2, item, false /* isSuperAdmin = false */);
  } catch (err: any) {
    rejected = true;
    console.log('Purchase correctly rejected with expected message:', err.message);
  }

  if (!rejected) {
    throw new Error('FAILED: Purchase should have been rejected for insufficient Kobans!');
  }
  console.log('✅ Insufficient balance rejection PASSED!');

  // Cleanup test documents
  console.log('\n--- Cleanup ---');
  try {
    await deleteDoc(unlockedDocRef);
    for (const docSnap of ledgerSnap.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch (cleanupErr: any) {
    console.warn('Note on cleanup:', cleanupErr?.message);
  }

  console.log('\n=============================================================');
  console.log('ALL PURCHASE & WALLET INTEGRITY CHECKS PASSED WITH FLYING COLORS!');
  console.log('=============================================================');
  process.exit(0);
}

runPurchaseVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});


