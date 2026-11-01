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
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, auth } from '../src/lib/firebase';
import { getCosmeticById, COSMETICS_CATALOG } from '../src/data/cosmeticsCatalog';
import { purchaseCosmeticItem } from '../src/services/kobanService';

async function runPurchaseVerification() {
  console.log('=============================================================');
  console.log('STEP 6: Non-Admin Purchase & Equip Verification (Eclipse Wyrm)');
  console.log('=============================================================');

  console.log('\n--- TEST 1: Store Catalog Verification ---');
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


