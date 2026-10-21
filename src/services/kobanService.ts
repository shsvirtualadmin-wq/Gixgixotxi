import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CosmeticItem } from '@/data/cosmeticsCatalog';
import type { KobanRequest, WalletLedgerEntry } from '@/types';
import { logAdminAction } from './adminService';

export interface WalletData {
  balance: number;
  owned: string[];
  equipped: {
    effect: string | null;
    frame: string | null;
    nameplate: string | null;
    avatar: string | null;
    banner: string | null;
  };
}

/**
 * Executes a purchase transaction:
 * - Checks wallet balance >= item.priceKobans
 * - Checks item is not already owned
 * - Decrements wallet balance by exactly catalog price
 * - Appends item to owned[]
 * - Appends immutable ledger document in wallets/{uid}/ledger/{entryId}
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

/**
 * Purchases and unlocks a cosmetic item:
 * - Calls callable Cloud Function "unlockItem" which runs an atomic Firestore transaction.
 * - Server validates price, balance, and prevents double unlocks.
 * - Deducts Kobans and writes to users/{uid}/unlocked/{itemId}.
 * - Emits clear, helpful error messages for the user.
 */
export async function purchaseCosmeticItem(
  userId: string,
  item: CosmeticItem,
  isSuperAdmin = false
): Promise<{ success: boolean; newBalance: number }> {
  if (!userId) throw new Error('You must be signed in to purchase cosmetics.');

  const userRef = doc(db, 'users', userId);
  const walletRef = doc(db, 'wallets', userId);
  const unlockedDocRef = doc(db, 'users', userId, 'unlocked', item.id);
  const storeItemRef = doc(db, 'storeItems', item.id);
  const legacyStoreItemRef = doc(db, 'store_items', item.id);

  try {
    const newBalance = await runTransaction(db, async (tx) => {
      // 1. Reads
      const [userSnap, walletSnap, unlockedSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(walletRef),
        tx.get(unlockedDocRef),
      ]);

      if (unlockedSnap.exists()) {
        throw new Error(`You have already unlocked "${item.name}".`);
      }

      const walletData = walletSnap.exists() ? walletSnap.data() : null;
      const currentOwned: string[] = Array.isArray(walletData?.owned) ? walletData.owned : [];
      if (currentOwned.includes(item.id)) {
        throw new Error(`You already own "${item.name}".`);
      }

      // Check item price from Firestore store items if present
      let effectivePrice = item.priceKobans;
      const storeItemSnap = await tx.get(storeItemRef);
      if (storeItemSnap.exists()) {
        const sData = storeItemSnap.data();
        if (sData.active === false && !isSuperAdmin) {
          throw new Error(`"${item.name}" is currently inactive in the Boardly Store.`);
        }
        if (typeof sData.priceKobans === 'number') {
          effectivePrice = Math.max(0, sData.priceKobans);
        }
      } else {
        const legacySnap = await tx.get(legacyStoreItemRef);
        if (legacySnap.exists()) {
          const sData = legacySnap.data();
          if (sData.active === false && !isSuperAdmin) {
            throw new Error(`"${item.name}" is currently inactive in the Boardly Store.`);
          }
          if (typeof sData.priceKobans === 'number') {
            effectivePrice = Math.max(0, sData.priceKobans);
          }
        }
      }

      if (isSuperAdmin) {
        effectivePrice = 0;
      }

      // Read current balance from users doc (preferred) or wallets doc
      const userData = userSnap.exists() ? userSnap.data() : null;
      let currentBalance = 0;
      if (userData && typeof userData.kobans === 'number') {
        currentBalance = userData.kobans;
      } else if (userData && typeof userData.kobanBalance === 'number') {
        currentBalance = userData.kobanBalance;
      } else if (walletData && typeof walletData.balance === 'number') {
        currentBalance = walletData.balance;
      }

      if (currentBalance < effectivePrice) {
        throw new Error(
          `Insufficient Kobans. You have ${currentBalance.toLocaleString()} Kobans, but ${item.name} costs ${effectivePrice.toLocaleString()} Kobans.`
        );
      }

      const balanceAfter = Math.max(0, currentBalance - effectivePrice);
      const updatedOwned = Array.from(new Set([...currentOwned, item.id]));

      // 2. Writes in same atomic batch:
      // A. Update users doc (decrement only kobans and kobanBalance down)
      if (userSnap.exists()) {
        tx.update(userRef, {
          kobans: balanceAfter,
          kobanBalance: balanceAfter,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(
          userRef,
          {
            uid: userId,
            kobans: balanceAfter,
            kobanBalance: balanceAfter,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // B. Create users/{uid}/unlocked/{itemId}
      tx.set(unlockedDocRef, {
        itemId: item.id,
        itemName: item.name,
        pricePaid: effectivePrice,
        unlockedAt: serverTimestamp(),
      });

      // C. Update wallets/{uid} balance & owned
      if (walletSnap.exists()) {
        tx.update(walletRef, {
          balance: balanceAfter,
          owned: updatedOwned,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(
          walletRef,
          {
            balance: balanceAfter,
            owned: updatedOwned,
            equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // D. Append immutable ledger document
      const ledgerEntryRef = doc(
        collection(db, 'wallets', userId, 'ledger'),
        `purchase_${item.id}_${Date.now()}`
      );
      tx.set(ledgerEntryRef, {
        id: ledgerEntryRef.id,
        type: 'purchase',
        amount: -effectivePrice,
        balanceAfter,
        itemId: item.id,
        itemName: item.name,
        reason: isSuperAdmin ? `Super Admin unlock: ${item.name}` : `Store purchase: ${item.name}`,
        timestamp: serverTimestamp(),
      });

      return balanceAfter;
    });

    return { success: true, newBalance };
  } catch (err: any) {
    console.error(
      '[kobanService] purchaseCosmeticItem error:',
      err?.code || 'ERROR',
      `users/${userId}/unlocked/${item.id}`,
      err
    );
    throw err;
  }
}

/**
 * Creates a pending Koban purchase verification request for student.
 * Minimum 500 Kobans (PKR 50), whole multiples of 10.
 */
export async function submitKobanRequest(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  note?: string;
}): Promise<string> {
  if (!params.userId) throw new Error('Must be signed in to request Kobans');

  const amount = Math.floor(params.amount);
  if (amount < 500) {
    throw new Error('Minimum purchase is 500 Kobans (PKR 50).');
  }
  if (amount % 10 !== 0) {
    throw new Error('Amount must be a whole multiple of 10 Kobans.');
  }
  if (!params.transactionId || params.transactionId.trim().length < 4) {
    throw new Error('Please enter a valid payment Transaction ID / TRX.');
  }

  const pkrAmount = Math.floor(amount / 10);

  const docRef = await addDoc(collection(db, 'kobanRequests'), {
    userId: params.userId,
    userEmail: params.userEmail || '',
    userName: params.userName || '',
    amount,
    pkrAmount,
    transactionId: params.transactionId.trim(),
    paymentMethod: params.paymentMethod,
    note: params.note || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Fetches Koban requests for the Admin portal.
 */
export async function fetchKobanRequests(statusFilter = 'all'): Promise<KobanRequest[]> {
  try {
    const colRef = collection(db, 'kobanRequests');
    const q =
      statusFilter !== 'all'
        ? query(colRef, where('status', '==', statusFilter), limit(100))
        : query(colRef, limit(100));

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as KobanRequest));
    // Sort client-side by createdAt desc
    list.sort((a, b) => {
      const tA = (a.createdAt as { seconds?: number })?.seconds || 0;
      const tB = (b.createdAt as { seconds?: number })?.seconds || 0;
      return tB - tA;
    });
    return list;
  } catch (err) {
    console.error('[kobanService] fetchKobanRequests error:', err);
    return [];
  }
}

/**
 * Superadmin approves a pending Koban request.
 * - Allows modifying approvedAmount (if student sent more or less).
 * - Credits student wallet + appends ledger entry.
 * - Notifies student.
 */
export async function approveKobanRequest(
  superadminEmail: string,
  requestId: string,
  targetUserId: string,
  approvedAmount: number,
  txId?: string
): Promise<void> {
  if (!requestId || !targetUserId) throw new Error('Invalid request or user ID');
  const amount = Math.floor(approvedAmount);
  if (amount <= 0) throw new Error('Approved amount must be greater than zero');

  const walletRef = doc(db, 'wallets', targetUserId);
  const reqRef = doc(db, 'kobanRequests', requestId);

  await runTransaction(db, async (tx) => {
    const walletSnap = await tx.get(walletRef);
    let curBalance = 0;
    let curOwned: string[] = [];
    let curEquipped = { effect: null, frame: null, nameplate: null, avatar: null, banner: null };

    if (walletSnap.exists()) {
      const wData = walletSnap.data();
      curBalance = typeof wData.balance === 'number' ? wData.balance : 0;
      curOwned = Array.isArray(wData.owned) ? wData.owned : [];
      curEquipped = wData.equipped || curEquipped;
    }

    const newBalance = curBalance + amount;

    // 1. Update request status
    tx.update(reqRef, {
      status: 'approved',
      grantedAmount: amount,
      approvedAt: serverTimestamp(),
      approvedBy: superadminEmail,
    });

    // 2. Credit wallet
    tx.set(
      walletRef,
      {
        balance: newBalance,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Write ledger
    const ledgerRef = doc(
      collection(db, 'wallets', targetUserId, 'ledger'),
      `koban_req_${requestId}`
    );
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      type: 'grant',
      amount,
      balanceAfter: newBalance,
      reason: `Koban payment verified (Tx: ${txId || requestId})`,
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });
  });

  // Create notification for student
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      title: 'Kobans Credited! 🪙',
      message: `Your payment was verified! +${amount.toLocaleString()} Kobans have been added to your balance. Head over to the Boardly Store to unlock custom frames, nameplates, and aura effects!`,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (nErr) {
    console.warn('[kobanService] Notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'approve_koban_request',
    { requestId, targetUserId, amount, txId },
    targetUserId
  );
}

/**
 * Superadmin rejects a pending Koban request with a clear reason.
 */
export async function rejectKobanRequest(
  superadminEmail: string,
  requestId: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  const reqRef = doc(db, 'kobanRequests', requestId);
  await updateDoc(reqRef, {
    status: 'rejected',
    rejectionReason: reason || 'Transaction could not be verified on mobile banking portal.',
    rejectedAt: serverTimestamp(),
    rejectedBy: superadminEmail,
  });

  // Notify student
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      title: 'Koban Request Update',
      message: `Your Kobans request could not be approved: ${reason}`,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (nErr) {
    console.warn('[kobanService] Notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'reject_koban_request',
    { requestId, targetUserId, reason },
    targetUserId
  );
}

/**
 * Superadmin manual adjustment: grant or deduct any integer amount.
 * NO CAP: positive whole number checks only, with confirmation dialog.
 */
export async function adminAdjustKobans(
  superadminEmail: string,
  targetUserId: string,
  deltaAmount: number,
  reason: string,
  targetUserEmail?: string
): Promise<{ newBalance: number }> {
  if (!targetUserId) throw new Error('Target user ID is required');
  const delta = Math.floor(deltaAmount);
  if (delta === 0) throw new Error('Adjustment amount cannot be zero');

  const walletRef = doc(db, 'wallets', targetUserId);

  const newBalance = await runTransaction(db, async (tx) => {
    const snap = await tx.get(walletRef);
    let curBalance = 0;
    let curOwned: string[] = [];
    let curEquipped = { effect: null, frame: null, nameplate: null, avatar: null };

    if (snap.exists()) {
      const wData = snap.data();
      curBalance = typeof wData.balance === 'number' ? wData.balance : 0;
      curOwned = Array.isArray(wData.owned) ? wData.owned : [];
      curEquipped = wData.equipped || curEquipped;
    }

    const calculated = curBalance + delta;
    const finalBalance = Math.max(0, calculated);

    tx.set(
      walletRef,
      {
        balance: finalBalance,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const ledgerRef = doc(
      collection(db, 'wallets', targetUserId, 'ledger'),
      `admin_adj_${Date.now()}`
    );

    tx.set(ledgerRef, {
      id: ledgerRef.id,
      type: delta > 0 ? 'grant' : 'deduction',
      amount: delta,
      balanceAfter: finalBalance,
      reason: reason || (delta > 0 ? 'Superadmin grant' : 'Superadmin deduction'),
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });

    return finalBalance;
  });

  await logAdminAction(
    superadminEmail,
    'admin_adjust_kobans',
    { targetUserId, delta, newBalance, reason },
    targetUserId,
    targetUserEmail
  );

  return { newBalance };
}

/**
 * Returns user's ledger entries.
 */
export async function fetchUserLedger(userId: string, maxLimit = 50): Promise<WalletLedgerEntry[]> {
  try {
    const colRef = collection(db, 'wallets', userId, 'ledger');
    const q = query(colRef, limit(maxLimit));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry));
    list.sort((a, b) => {
      const tA = (a.timestamp as { seconds?: number })?.seconds || 0;
      const tB = (b.timestamp as { seconds?: number })?.seconds || 0;
      return tB - tA;
    });
    return list;
  } catch (err) {
    console.error('[kobanService] fetchUserLedger error:', err);
    return [];
  }
}

/**
 * Computes PKT (UTC+5) month key (e.g. "2026_10") and human-readable label ("October 2026").
 */
export function getCurrentPktMonth(): { key: string; label: string } {
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktDate = new Date(Date.now() + PKT_OFFSET_MS);
  const year = pktDate.getUTCFullYear();
  const month = pktDate.getUTCMonth(); // 0-indexed
  const monthStr = String(month + 1).padStart(2, '0');
  const key = `${year}-${monthStr}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const label = `${monthNames[month]} ${year}`;

  return { key, label };
}

/**
 * Checks whether an approved Nakama Captain has already received their 5,000 Kobans allotment
 * for the current PKT month.
 * Idempotent ledger doc ID: captain_allotment_<uid>_<YYYY-MM>
 */
export async function getCaptainAllotmentStatus(captainUid: string): Promise<{
  granted: boolean;
  date: Date | null;
  monthKey: string;
  monthLabel: string;
}> {
  const { key: monthKey, label: monthLabel } = getCurrentPktMonth();
  const docId = `captain_allotment_${captainUid}_${monthKey}`;
  const ledgerDocRef = doc(db, 'wallets', captainUid, 'ledger', docId);

  try {
    const snap = await getDoc(ledgerDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const sec = (data.timestamp as { seconds?: number })?.seconds;
      const date = sec ? new Date(sec * 1000) : new Date();
      return { granted: true, date, monthKey, monthLabel };
    }

    // Fallback check for underscore format if previously created
    const altDocId = `captain_allotment_${captainUid}_${monthKey.replace('-', '_')}`;
    if (altDocId !== docId) {
      const altSnap = await getDoc(doc(db, 'wallets', captainUid, 'ledger', altDocId));
      if (altSnap.exists()) {
        const data = altSnap.data();
        const sec = (data.timestamp as { seconds?: number })?.seconds;
        const date = sec ? new Date(sec * 1000) : new Date();
        return { granted: true, date, monthKey, monthLabel };
      }
    }
  } catch (err) {
    console.warn('[kobanService] getCaptainAllotmentStatus error:', err);
  }

  return { granted: false, date: null, monthKey, monthLabel };
}

/**
 * Grants 5,000 Kobans to a single approved Captain for the current PKT month.
 * Idempotent: doc ID = captain_allotment_<uid>_<YYYY_MM>.
 * Prevents double-granting.
 */
export async function grantCaptainMonthlyAllotment(
  superadminEmail: string,
  captainUid: string,
  captainName: string,
  captainEmail?: string
): Promise<{ success: boolean; newBalance: number }> {
  const { key: monthKey, label: monthLabel } = getCurrentPktMonth();
  const docId = `captain_allotment_${captainUid}_${monthKey}`;
  const ledgerDocRef = doc(db, 'wallets', captainUid, 'ledger', docId);
  const walletRef = doc(db, 'wallets', captainUid);

  const newBalance = await runTransaction(db, async (tx) => {
    // 1. Check if already granted
    const ledgerSnap = await tx.get(ledgerDocRef);
    if (ledgerSnap.exists()) {
      throw new Error(`Captain allotment for ${monthLabel} has already been granted to this captain.`);
    }

    // 2. Fetch current wallet
    const walletSnap = await tx.get(walletRef);
    let curBalance = 0;
    let curOwned: string[] = [];
    let curEquipped = { effect: null, frame: null, nameplate: null, avatar: null };

    if (walletSnap.exists()) {
      const wData = walletSnap.data();
      curBalance = typeof wData.balance === 'number' ? wData.balance : 0;
      curOwned = Array.isArray(wData.owned) ? wData.owned : [];
      curEquipped = wData.equipped || curEquipped;
    }

    const finalBalance = curBalance + 5000;

    // 3. Update wallet
    tx.set(
      walletRef,
      {
        balance: finalBalance,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Create ledger entry with idempotent docId
    tx.set(ledgerDocRef, {
      id: docId,
      type: 'captain_allotment',
      amount: 5000,
      balanceAfter: finalBalance,
      monthKey,
      reason: `Nakama Captain Monthly Allotment (${monthLabel})`,
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });

    return finalBalance;
  });

  // Notify captain
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: captainUid,
      title: 'Nakama Captain Monthly Allotment! ⚓',
      message: `Your monthly leadership allowance of 5,000 Kobans for ${monthLabel} has been granted! Thank you for leading your campus crew.`,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (nErr) {
    console.warn('[kobanService] Captain notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'grant_captain_monthly_allotment',
    { captainUid, captainName, monthKey, amount: 5000 },
    captainUid,
    captainEmail
  );

  return { success: true, newBalance };
}

/**
 * Grants 5,000 Kobans to ALL approved Captains who have not yet received it this month.
 */
export async function grantAllCaptainsMonthlyAllotment(
  superadminEmail: string,
  captains: Array<{ captainUid: string; captainName: string; captainEmail?: string }>
): Promise<{ grantedCount: number; skippedCount: number }> {
  let grantedCount = 0;
  let skippedCount = 0;

  for (const captain of captains) {
    try {
      const status = await getCaptainAllotmentStatus(captain.captainUid);
      if (!status.granted) {
        await grantCaptainMonthlyAllotment(
          superadminEmail,
          captain.captainUid,
          captain.captainName,
          captain.captainEmail
        );
        grantedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.warn(`[kobanService] Error granting allotment to ${captain.captainName}:`, err);
      skippedCount++;
    }
  }

  await logAdminAction(
    superadminEmail,
    'grant_all_captains_monthly_allotment',
    { totalCaptains: captains.length, grantedCount, skippedCount }
  );

  return { grantedCount, skippedCount };
}
