import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
import {
  notifyKobanPurchaseRequestSubmitted,
  notifyKobanPurchaseApproved,
  notifyKobanPurchaseRejected,
  notifyKobanReceipt,
} from './emailNotificationService';
import { getPaymentMethodConfig } from '@/constants/branding';

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

export interface CartCheckoutFlaggedItem {
  id: string;
  name: string;
  reason: 'already_owned' | 'unavailable';
}

export interface CartCheckoutPurchasedItem {
  id: string;
  name: string;
  type: CosmeticItem['type'];
  rarity: CosmeticItem['rarity'];
  animated: boolean;
  pricePaid: number;
}

export interface CartCheckoutResult {
  success: boolean;
  checkoutId: string;
  newBalance: number;
  totalPaid: number;
  owned: string[];
  purchasedItems: CartCheckoutPurchasedItem[];
  flaggedItems: CartCheckoutFlaggedItem[];
  error?: string;
}

const inFlightCheckoutKeys = new Set<string>();
const completedCheckoutCache = new Map<string, CartCheckoutResult>();

function sanitizeIdempotencyKey(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64);
  return cleaned || `chk_${Date.now()}`;
}

function resolveServerLiveItemPrice(
  catalogFallbackPrice: number,
  v2StoreData: Record<string, any> | null,
  isSuperAdmin: boolean
): { active: boolean; effectivePrice: number } {
  let effectivePrice = Math.max(0, Math.floor(Number(catalogFallbackPrice) || 0));
  if (!v2StoreData) {
    return { active: true, effectivePrice };
  }

  const isActive = v2StoreData.active !== false && v2StoreData.is_active !== false;
  if (!isActive && !isSuperAdmin) {
    return { active: false, effectivePrice };
  }

  const basePrice =
    typeof v2StoreData.priceKobans === 'number'
      ? Math.max(0, Math.floor(v2StoreData.priceKobans))
      : typeof v2StoreData.price_kobans === 'number'
      ? Math.max(0, Math.floor(v2StoreData.price_kobans))
      : effectivePrice;
  const salePrice =
    typeof v2StoreData.salePriceKobans === 'number'
      ? Math.max(0, Math.floor(v2StoreData.salePriceKobans))
      : typeof v2StoreData.sale_price_kobans === 'number'
      ? Math.max(0, Math.floor(v2StoreData.sale_price_kobans))
      : null;
  const saleEndsRaw = v2StoreData.saleEndsAt ?? v2StoreData.sale_ends_at ?? null;
  let saleStillValid = true;
  if (saleEndsRaw) {
    const endMs =
      typeof saleEndsRaw === 'string'
        ? new Date(saleEndsRaw).getTime()
        : typeof saleEndsRaw?.toMillis === 'function'
        ? saleEndsRaw.toMillis()
        : Number(saleEndsRaw);
    if (Number.isFinite(endMs) && endMs <= Date.now()) {
      saleStillValid = false;
    }
  }
  if (salePrice !== null && salePrice < basePrice && saleStillValid) {
    effectivePrice = salePrice;
  } else {
    effectivePrice = basePrice;
  }

  return { active: true, effectivePrice };
}

/**
 * Executes an atomic multi-item (or single-item) Store checkout transaction:
 * - Never trusts client cart prices: re-fetches live prices and active status from Firestore store_items / storeItems inside the transaction.
 * - Verifies none of the items are already owned or unavailable; if any became owned/unavailable, aborts with zero deduction and returns `flaggedItems`.
 * - Verifies wallet balance >= total server price, deducts total once, grants all items, and writes one immutable ledger entry per item.
 * - Enforces idempotency via `idempotencyKey` so a double-tap or retry cannot charge twice.
 * - Sends ONE itemized receipt email per checkout via Resend.
 */
export async function checkoutStoreCart(params: {
  userId: string;
  items: CosmeticItem[];
  idempotencyKey: string;
  isSuperAdmin?: boolean;
}): Promise<CartCheckoutResult> {
  const { userId, items, isSuperAdmin = false } = params;
  if (!userId) {
    throw new Error('Please sign in to purchase cosmetics.');
  }

  // Deduplicate items by ID while preserving the order they were added to cart
  const uniqueItems: CosmeticItem[] = [];
  const seenIds = new Set<string>();
  for (const it of items) {
    if (it && it.id && !seenIds.has(it.id)) {
      seenIds.add(it.id);
      uniqueItems.push(it);
    }
  }

  if (uniqueItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const safeCheckoutKey = sanitizeIdempotencyKey(params.idempotencyKey);
  const cacheKey = `${userId}:${safeCheckoutKey}`;

  if (completedCheckoutCache.has(cacheKey)) {
    return completedCheckoutCache.get(cacheKey)!;
  }
  if (inFlightCheckoutKeys.has(cacheKey)) {
    throw new Error('Checkout is already processing. Please wait.');
  }

  inFlightCheckoutKeys.add(cacheKey);

  const userRef = doc(db, 'users', userId);
  const walletRef = doc(db, 'wallets', userId);

  try {
    const txOutcome = await runTransaction(db, async (tx) => {
      // 1. Perform ALL reads upfront (Firestore transaction requirement)
      const [userSnap, walletSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(walletRef),
      ]);

      const itemReads = await Promise.all(
        uniqueItems.map(async (item) => {
          const unlockedRef = doc(db, 'users', userId, 'unlocked', item.id);
          const storeItemRef = doc(db, 'storeItems', item.id);
          const legacyStoreItemRef = doc(db, 'store_items', item.id);
          const ledgerDocId = `purchase_${safeCheckoutKey}_${item.id}`.slice(0, 120);
          const ledgerRef = doc(db, 'wallets', userId, 'ledger', ledgerDocId);

          const [unlockedSnap, storeItemSnap, legacySnap, ledgerSnap] = await Promise.all([
            tx.get(unlockedRef),
            tx.get(storeItemRef),
            tx.get(legacyStoreItemRef),
            tx.get(ledgerRef),
          ]);

          return {
            item,
            unlockedRef,
            ledgerRef,
            ledgerDocId,
            unlockedSnap,
            storeItemSnap,
            legacySnap,
            ledgerSnap,
          };
        })
      );

      const walletData = walletSnap.exists() ? walletSnap.data() : null;
      const userData = userSnap.exists() ? userSnap.data() : null;
      const walletOwned: string[] = Array.isArray(walletData?.owned) ? walletData.owned : [];
      const userOwned: string[] = Array.isArray(userData?.ownedCosmetics)
        ? userData.ownedCosmetics
        : [];
      const currentOwned: string[] = Array.from(new Set([...walletOwned, ...userOwned]));

      const userKobans =
        userData && typeof userData.kobans === 'number' && Number.isFinite(userData.kobans)
          ? Math.floor(userData.kobans)
          : 0;
      const userKobanBalance =
        userData &&
        typeof userData.kobanBalance === 'number' &&
        Number.isFinite(userData.kobanBalance)
          ? Math.floor(userData.kobanBalance)
          : 0;
      const userDocBalance = Math.max(userKobans, userKobanBalance);

      const walletBalance =
        walletData && typeof walletData.balance === 'number' && Number.isFinite(walletData.balance)
          ? Math.floor(walletData.balance)
          : null;

      const currentBalance =
        walletBalance !== null && walletBalance > 0
          ? walletBalance
          : Math.max(walletBalance ?? 0, userDocBalance);

      // 2. Idempotency check: if ledger entries for this checkout key already exist, return without double-charging
      const alreadyProcessed = itemReads.every((r) => r.ledgerSnap.exists());
      if (alreadyProcessed) {
        return {
          alreadyProcessed: true,
          abortedForFlagged: false,
          balanceBefore: currentBalance,
          delta: 0,
          newBalance: currentBalance,
          totalPaid: 0,
          owned: currentOwned,
          purchasedItems: uniqueItems.map((it) => ({
            id: it.id,
            name: it.name,
            type: it.type,
            rarity: it.rarity,
            animated: Boolean(it.animated),
            pricePaid: Math.max(0, Math.floor(Number(it.priceKobans) || 0)),
          })),
          flaggedItems: [] as CartCheckoutFlaggedItem[],
        };
      }

      // 3. Server-side verification of ownership, availability, and live effective price for each item
      const flaggedItems: CartCheckoutFlaggedItem[] = [];
      const verifiedItems: Array<{
        item: CosmeticItem;
        unlockedRef: ReturnType<typeof doc>;
        ledgerRef: ReturnType<typeof doc>;
        ledgerDocId: string;
        effectivePrice: number;
      }> = [];

      for (const read of itemReads) {
        const { item, unlockedSnap, storeItemSnap, legacySnap, unlockedRef, ledgerRef, ledgerDocId } =
          read;

        if (unlockedSnap.exists() || currentOwned.includes(item.id)) {
          flaggedItems.push({
            id: item.id,
            name: item.name,
            reason: 'already_owned',
          });
          continue;
        }

        const v2StoreData =
          legacySnap.exists() && legacySnap.data()?.priceSchemaV2
            ? legacySnap.data()
            : storeItemSnap.exists() && storeItemSnap.data()?.priceSchemaV2
            ? storeItemSnap.data()
            : storeItemSnap.exists()
            ? storeItemSnap.data()
            : legacySnap.exists()
            ? legacySnap.data()
            : null;

        const { active, effectivePrice } = resolveServerLiveItemPrice(
          item.priceKobans,
          v2StoreData,
          isSuperAdmin
        );

        if (!active) {
          flaggedItems.push({
            id: item.id,
            name: item.name,
            reason: 'unavailable',
          });
          continue;
        }

        verifiedItems.push({
          item,
          unlockedRef,
          ledgerRef,
          ledgerDocId,
          effectivePrice,
        });
      }

      // If any item became owned or unavailable since being added to cart, abort with zero writes and report flagged items
      if (flaggedItems.length > 0) {
        return {
          alreadyProcessed: false,
          abortedForFlagged: true,
          balanceBefore: currentBalance,
          delta: 0,
          newBalance: currentBalance,
          totalPaid: 0,
          owned: currentOwned,
          purchasedItems: [] as CartCheckoutPurchasedItem[],
          flaggedItems,
        };
      }

      // 4. Verify balance against server-computed total
      const totalServerPrice = verifiedItems.reduce((sum, v) => sum + v.effectivePrice, 0);
      if (currentBalance < totalServerPrice && !isSuperAdmin) {
        throw new Error(
          `Insufficient Kobans. You have ${currentBalance.toLocaleString()} Kobans, but this checkout costs ${totalServerPrice.toLocaleString()} Kobans.`
        );
      }

      const freeOverride = isSuperAdmin && currentBalance < totalServerPrice;
      const totalToDeduct = freeOverride ? 0 : totalServerPrice;
      const balanceAfterAll = Math.max(0, currentBalance - totalToDeduct);
      const updatedOwned = Array.from(
        new Set([...currentOwned, ...verifiedItems.map((v) => v.item.id)])
      );

      // 5. Atomic Writes: deduct total once, grant all items, write one ledger entry per item
      if (userSnap.exists()) {
        tx.update(userRef, {
          kobans: balanceAfterAll,
          kobanBalance: balanceAfterAll,
          ownedCosmetics: updatedOwned,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(
          userRef,
          {
            uid: userId,
            kobans: balanceAfterAll,
            kobanBalance: balanceAfterAll,
            ownedCosmetics: updatedOwned,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      const resolvedEquipped = walletData?.equipped ||
        userData?.equipped || {
          effect: null,
          frame: null,
          nameplate: null,
          avatar: null,
          banner: null,
        };

      if (walletSnap.exists()) {
        tx.update(walletRef, {
          balance: balanceAfterAll,
          owned: updatedOwned,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(
          walletRef,
          {
            uid: userId,
            userId,
            balance: balanceAfterAll,
            owned: updatedOwned,
            equipped: resolvedEquipped,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      let runningBalance = currentBalance;
      const purchasedItems: CartCheckoutPurchasedItem[] = [];

      for (const v of verifiedItems) {
        const itemCost = freeOverride ? 0 : v.effectivePrice;
        const nextRunningBalance = Math.max(0, runningBalance - itemCost);

        // Grant unlocked item doc
        tx.set(v.unlockedRef, {
          itemId: v.item.id,
          itemName: v.item.name,
          category: v.item.type,
          rarity: v.item.rarity,
          animated: Boolean(v.item.animated),
          pricePaid: itemCost,
          checkoutId: safeCheckoutKey,
          unlockedAt: serverTimestamp(),
        });

        // Write one immutable ledger entry per item
        tx.set(v.ledgerRef, {
          id: v.ledgerDocId,
          checkoutId: safeCheckoutKey,
          userId,
          type: 'purchase',
          amount: -itemCost,
          balanceBefore: runningBalance,
          balance_before: runningBalance,
          balanceAfter: nextRunningBalance,
          balance_after: nextRunningBalance,
          itemId: v.item.id,
          itemName: v.item.name,
          reason:
            verifiedItems.length > 1
              ? `Store cart purchase: ${v.item.name}`
              : `Store purchase: ${v.item.name}`,
          timestamp: serverTimestamp(),
        });

        runningBalance = nextRunningBalance;
        purchasedItems.push({
          id: v.item.id,
          name: v.item.name,
          type: v.item.type,
          rarity: v.item.rarity,
          animated: Boolean(v.item.animated),
          pricePaid: itemCost,
        });
      }

      return {
        alreadyProcessed: false,
        abortedForFlagged: false,
        balanceBefore: currentBalance,
        delta: -totalToDeduct,
        newBalance: balanceAfterAll,
        totalPaid: totalToDeduct,
        owned: updatedOwned,
        purchasedItems,
        flaggedItems: [] as CartCheckoutFlaggedItem[],
      };
    });

    if (txOutcome.abortedForFlagged) {
      const flaggedNames = txOutcome.flaggedItems
        .map(
          (f) =>
            `"${f.name}" (${f.reason === 'already_owned' ? 'already owned' : 'no longer available'})`
        )
        .join(', ');
      return {
        success: false,
        checkoutId: safeCheckoutKey,
        newBalance: txOutcome.newBalance,
        totalPaid: 0,
        owned: txOutcome.owned,
        purchasedItems: [],
        flaggedItems: txOutcome.flaggedItems,
        error: `Some items in your cart could not be purchased and were removed: ${flaggedNames}. Nothing was deducted — please review your updated cart.`,
      };
    }

    const finalResult: CartCheckoutResult = {
      success: true,
      checkoutId: safeCheckoutKey,
      newBalance: txOutcome.newBalance,
      totalPaid: txOutcome.totalPaid,
      owned: txOutcome.owned,
      purchasedItems: txOutcome.purchasedItems,
      flaggedItems: [],
    };

    completedCheckoutCache.set(cacheKey, finalResult);

    // Send ONE receipt email per checkout with the full itemized list (only after transaction committed)
    if (!txOutcome.alreadyProcessed && txOutcome.purchasedItems.length > 0) {
      if (txOutcome.newBalance !== txOutcome.balanceBefore + txOutcome.delta) {
        console.error(
          '[kobanService] checkoutStoreCart balance sanity check failed; skipping email:',
          {
            balanceBefore: txOutcome.balanceBefore,
            delta: txOutcome.delta,
            balanceAfter: txOutcome.newBalance,
          }
        );
      } else {
        const count = txOutcome.purchasedItems.length;
        const reasonLabel =
          count === 1
            ? `Store purchase: ${txOutcome.purchasedItems[0].name}`
            : `Store checkout (${count} items)`;

        notifyKobanReceipt({
          recordId: `store_chk_${userId}_${safeCheckoutKey}`,
          studentUid: userId,
          deltaAmount: txOutcome.delta,
          balanceBefore: txOutcome.balanceBefore,
          newBalance: txOutcome.newBalance,
          transactionId: safeCheckoutKey,
          reason: reasonLabel,
          subType: 'store_purchase',
          itemName: txOutcome.purchasedItems.map((i) => i.name).join(', '),
          items: txOutcome.purchasedItems.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.type,
            priceKobans: i.pricePaid,
          })),
        });
      }
    }

    return finalResult;
  } catch (err: any) {
    console.error(
      '[kobanService] checkoutStoreCart error:',
      err?.code || 'ERROR',
      `paths=[wallets/${userId}, users/${userId}]`,
      err
    );
    if (err?.code === 'permission-denied') {
      throw new Error(
        'Purchase failed: Missing or insufficient permissions. Please refresh the page and try again.'
      );
    }
    throw err;
  } finally {
    inFlightCheckoutKeys.delete(cacheKey);
  }
}

/**
 * Purchases and unlocks a single cosmetic item using the same atomic transaction engine.
 */
export async function purchaseCosmeticItem(
  userId: string,
  item: CosmeticItem,
  isSuperAdmin = false,
  idempotencyKey?: string
): Promise<{ success: boolean; newBalance: number; owned: string[] }> {
  const key = idempotencyKey || `single_${item.id}_${Date.now()}`;
  const res = await checkoutStoreCart({
    userId,
    items: [item],
    idempotencyKey: key,
    isSuperAdmin,
  });

  if (!res.success) {
    if (res.flaggedItems.length > 0) {
      const f = res.flaggedItems[0];
      if (f.reason === 'already_owned') {
        throw new Error(`You already own "${f.name}".`);
      }
      throw new Error(`"${f.name}" is currently unavailable in the Boardly Store.`);
    }
    throw new Error(res.error || 'Purchase failed. Please try again.');
  }

  return {
    success: true,
    newBalance: res.newBalance,
    owned: res.owned,
  };
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
  const resolvedMethod = getPaymentMethodConfig(params.paymentMethod).displayName;

  const docRef = await addDoc(collection(db, 'kobanRequests'), {
    userId: params.userId,
    userEmail: params.userEmail || '',
    userName: params.userName || '',
    amount,
    pkrAmount,
    transactionId: params.transactionId.trim(),
    paymentMethod: resolvedMethod,
    note: params.note || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  notifyKobanPurchaseRequestSubmitted({
    requestId: docRef.id,
    studentUid: params.userId,
    studentName: params.userName,
    studentEmail: params.userEmail,
    kobansAmount: amount,
    pkrAmount,
    paymentMethod: resolvedMethod,
    transactionId: params.transactionId.trim(),
    note: params.note,
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
  const userRef = doc(db, 'users', targetUserId);
  const reqRef = doc(db, 'kobanRequests', requestId);

  const txResult = await runTransaction(db, async (tx) => {
    const [walletSnap, userSnap, reqSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(userRef),
      tx.get(reqRef),
    ]);

    const walletBalance = walletSnap.exists()
      ? Math.max(0, Math.floor(Number(walletSnap.data().balance) || 0))
      : null;
    const userDocBalance = userSnap.exists()
      ? Math.max(
          0,
          Math.floor(Number(userSnap.data().kobans ?? userSnap.data().kobanBalance) || 0)
        )
      : 0;

    const balanceBefore =
      walletBalance !== null && walletBalance > 0
        ? Math.max(walletBalance, userDocBalance)
        : Math.max(walletBalance ?? 0, userDocBalance);

    const curOwned: string[] =
      walletSnap.exists() && Array.isArray(walletSnap.data().owned)
        ? walletSnap.data().owned
        : [];
    const curEquipped =
      (walletSnap.exists() && walletSnap.data().equipped) || {
        effect: null,
        frame: null,
        nameplate: null,
        avatar: null,
        banner: null,
      };

    const delta = amount;
    const balanceAfter = balanceBefore + delta;

    const reqData = reqSnap.exists() ? reqSnap.data() : {};
    const uData = userSnap.exists() ? userSnap.data() : {};
    const studentName = String(
      reqData.userName || uData.name || uData.displayName || 'Student'
    );
    const studentEmail = String(reqData.userEmail || uData.email || '').trim() || undefined;
    const resolvedTxId = String(txId || reqData.transactionId || requestId).trim();

    // 1. Update request status
    if (reqSnap.exists()) {
      tx.update(reqRef, {
        status: 'approved',
        grantedAmount: delta,
        balanceBefore,
        balanceAfter,
        approvedAt: serverTimestamp(),
        approvedBy: superadminEmail,
      });
    }

    // 2. Credit wallet & sync users/{uid}.kobans
    tx.set(
      walletRef,
      {
        balance: balanceAfter,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      userRef,
      {
        kobans: balanceAfter,
        kobanBalance: balanceAfter,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Write ledger with balanceBefore and balanceAfter
    const ledgerRef = doc(
      collection(db, 'wallets', targetUserId, 'ledger'),
      `koban_req_${requestId}`
    );
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      type: 'grant',
      amount: delta,
      balanceBefore,
      balance_before: balanceBefore,
      balanceAfter,
      balance_after: balanceAfter,
      reason: `Koban payment verified (Tx: ${resolvedTxId})`,
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });

    return {
      balanceBefore,
      delta,
      balanceAfter,
      ledgerId: ledgerRef.id,
      studentName,
      studentEmail,
      resolvedTxId,
    };
  });

  // Create notification for student (deterministic ID prevents duplicates)
  try {
    await setDoc(
      doc(db, 'notifications', `koban_approve_${requestId}`),
      {
        userId: targetUserId,
        type: 'reward',
        title: 'Kobans Credited!',
        message: `Your payment was verified! +${txResult.delta.toLocaleString()} Kobans have been added to your balance (New balance: ${txResult.balanceAfter.toLocaleString()} Kobans). Head over to the Boardly Store to unlock custom frames, nameplates, and aura effects!`,
        link: '/dashboard/rewards',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (nErr) {
    console.warn('[kobanService] Notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'approve_koban_request',
    {
      requestId,
      targetUserId,
      amount: txResult.delta,
      balanceBefore: txResult.balanceBefore,
      balanceAfter: txResult.balanceAfter,
      txId: txResult.resolvedTxId,
    },
    targetUserId
  );

  // Sanity check before sending email: balance_after must equal balance_before + delta
  if (txResult.balanceAfter !== txResult.balanceBefore + txResult.delta) {
    console.error(
      '[kobanService] approveKobanRequest balance sanity check failed; skipping email:',
      txResult
    );
    return;
  }

  notifyKobanPurchaseApproved({
    requestId,
    studentUid: targetUserId,
    studentName: txResult.studentName,
    studentEmail: txResult.studentEmail,
    kobansAmount: txResult.delta,
    balanceBefore: txResult.balanceBefore,
    newBalance: txResult.balanceAfter,
    transactionId: txResult.resolvedTxId,
    ledgerId: txResult.ledgerId,
    adminEmail: superadminEmail,
  });
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

  // Notify student (deterministic ID prevents duplicates)
  try {
    await setDoc(
      doc(db, 'notifications', `koban_reject_${requestId}`),
      {
        userId: targetUserId,
        type: 'system',
        title: 'Koban Request Update',
        message: `Your Kobans request could not be approved: ${reason || 'Transaction could not be verified.'}`,
        link: '/dashboard/rewards',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (nErr) {
    console.warn('[kobanService] Notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'reject_koban_request',
    { requestId, targetUserId, reason },
    targetUserId
  );

  notifyKobanPurchaseRejected({
    requestId,
    studentUid: targetUserId,
    kobansAmount: 0,
    reason: reason || 'Transaction could not be verified on mobile banking portal.',
    adminEmail: superadminEmail,
  });
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
  const userRef = doc(db, 'users', targetUserId);

  const txResult = await runTransaction(db, async (tx) => {
    const [snap, userSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(userRef),
    ]);

    const walletBalance = snap.exists()
      ? Math.max(0, Math.floor(Number(snap.data().balance) || 0))
      : null;
    const userDocBalance = userSnap.exists()
      ? Math.max(
          0,
          Math.floor(Number(userSnap.data().kobans ?? userSnap.data().kobanBalance) || 0)
        )
      : 0;

    const balanceBefore =
      walletBalance !== null && walletBalance > 0
        ? Math.max(walletBalance, userDocBalance)
        : Math.max(walletBalance ?? 0, userDocBalance);

    const curOwned: string[] =
      snap.exists() && Array.isArray(snap.data().owned) ? snap.data().owned : [];
    const curEquipped =
      (snap.exists() && snap.data().equipped) || {
        effect: null,
        frame: null,
        nameplate: null,
        avatar: null,
      };

    const calculated = balanceBefore + delta;
    const balanceAfter = Math.max(0, calculated);
    const actualDelta = balanceAfter - balanceBefore;

    tx.set(
      walletRef,
      {
        balance: balanceAfter,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      userRef,
      {
        kobans: balanceAfter,
        kobanBalance: balanceAfter,
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
      type: actualDelta >= 0 ? 'grant' : 'deduction',
      amount: actualDelta,
      balanceBefore,
      balance_before: balanceBefore,
      balanceAfter,
      balance_after: balanceAfter,
      reason: reason || (actualDelta >= 0 ? 'Superadmin grant' : 'Superadmin deduction'),
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });

    return {
      balanceBefore,
      delta: actualDelta,
      balanceAfter,
      ledgerId: ledgerRef.id,
    };
  });

  await logAdminAction(
    superadminEmail,
    'admin_adjust_kobans',
    {
      targetUserId,
      delta: txResult.delta,
      balanceBefore: txResult.balanceBefore,
      newBalance: txResult.balanceAfter,
      reason,
    },
    targetUserId,
    targetUserEmail
  );

  if (txResult.balanceAfter !== txResult.balanceBefore + txResult.delta) {
    console.error(
      '[kobanService] adminAdjustKobans balance sanity check failed; skipping email:',
      txResult
    );
  } else {
    notifyKobanReceipt({
      recordId: txResult.ledgerId,
      studentUid: targetUserId,
      studentEmail: targetUserEmail,
      deltaAmount: txResult.delta,
      balanceBefore: txResult.balanceBefore,
      newBalance: txResult.balanceAfter,
      transactionId: txResult.ledgerId,
      reason: reason || (txResult.delta >= 0 ? 'Superadmin grant' : 'Superadmin deduction'),
      subType: 'admin_grant',
      adminEmail: superadminEmail,
    });
  }

  return { newBalance: txResult.balanceAfter };
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
  const userRef = doc(db, 'users', captainUid);

  const txResult = await runTransaction(db, async (tx) => {
    // 1. Check if already granted
    const ledgerSnap = await tx.get(ledgerDocRef);
    if (ledgerSnap.exists()) {
      throw new Error(`Captain allotment for ${monthLabel} has already been granted to this captain.`);
    }

    // 2. Fetch current wallet & user
    const [walletSnap, userSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(userRef),
    ]);

    const walletBalance = walletSnap.exists()
      ? Math.max(0, Math.floor(Number(walletSnap.data().balance) || 0))
      : null;
    const userDocBalance = userSnap.exists()
      ? Math.max(
          0,
          Math.floor(Number(userSnap.data().kobans ?? userSnap.data().kobanBalance) || 0)
        )
      : 0;

    const balanceBefore =
      walletBalance !== null && walletBalance > 0
        ? Math.max(walletBalance, userDocBalance)
        : Math.max(walletBalance ?? 0, userDocBalance);

    const curOwned: string[] =
      walletSnap.exists() && Array.isArray(walletSnap.data().owned)
        ? walletSnap.data().owned
        : [];
    const curEquipped =
      (walletSnap.exists() && walletSnap.data().equipped) || {
        effect: null,
        frame: null,
        nameplate: null,
        avatar: null,
      };

    const delta = 5000;
    const balanceAfter = balanceBefore + delta;

    // 3. Update wallet & sync users/{uid}.kobans
    tx.set(
      walletRef,
      {
        balance: balanceAfter,
        owned: curOwned,
        equipped: curEquipped,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      userRef,
      {
        kobans: balanceAfter,
        kobanBalance: balanceAfter,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Create ledger entry with idempotent docId
    tx.set(ledgerDocRef, {
      id: docId,
      type: 'captain_allotment',
      amount: delta,
      balanceBefore,
      balance_before: balanceBefore,
      balanceAfter,
      balance_after: balanceAfter,
      monthKey,
      reason: `Nakama Captain Monthly Allotment (${monthLabel})`,
      adminEmail: superadminEmail,
      timestamp: serverTimestamp(),
    });

    return {
      balanceBefore,
      delta,
      balanceAfter,
      ledgerId: docId,
    };
  });

  // Notify captain (deterministic ID per captain + monthKey prevents duplicate allotments)
  try {
    await setDoc(
      doc(db, 'notifications', `captain_allotment_${captainUid}_${monthKey}`),
      {
        userId: captainUid,
        type: 'reward',
        title: 'Nakama Captain Monthly Allotment!',
        message: `Your monthly leadership allowance of 5,000 Kobans for ${monthLabel} has been granted! Thank you for leading your campus crew.`,
        link: '/dashboard/rewards',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (nErr) {
    console.warn('[kobanService] Captain notification error:', nErr);
  }

  await logAdminAction(
    superadminEmail,
    'grant_captain_monthly_allotment',
    {
      captainUid,
      captainName,
      monthKey,
      amount: txResult.delta,
      balanceBefore: txResult.balanceBefore,
      balanceAfter: txResult.balanceAfter,
    },
    captainUid,
    captainEmail
  );

  if (txResult.balanceAfter !== txResult.balanceBefore + txResult.delta) {
    console.error(
      '[kobanService] grantCaptainMonthlyAllotment balance sanity check failed; skipping email:',
      txResult
    );
  } else {
    notifyKobanReceipt({
      recordId: docId,
      studentUid: captainUid,
      studentName: captainName,
      studentEmail: captainEmail,
      deltaAmount: txResult.delta,
      balanceBefore: txResult.balanceBefore,
      newBalance: txResult.balanceAfter,
      transactionId: docId,
      reason: `Nakama Captain Monthly Allotment (${monthLabel})`,
      subType: 'captain_allotment',
      adminEmail: superadminEmail,
    });
  }

  return { success: true, newBalance: txResult.balanceAfter };
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
