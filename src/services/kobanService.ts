import { api } from '@/lib/api';
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
 * Purchases and unlocks a cosmetic item via 100% server-side atomic D1 batch in `POST /api/shop/purchase`:
 * - Server looks up price from `store_items` / catalog (never trusts client price)
 * - Checks item is active and not already owned
 * - Deducts balance and writes `wallet_ledger` + `user_unlocked_items` atomically
 */
export async function purchaseCosmeticItem(
  userId: string,
  item: CosmeticItem,
  _isSuperAdmin = false,
  couponCode?: string
): Promise<{ success: boolean; newBalance: number }> {
  if (!userId) throw new Error('You must be signed in to purchase cosmetics.');

  const res = await api.post<{
    success: boolean;
    newBalance: number;
    owned?: string[];
  }>('/api/shop/purchase', {
    itemId: item.id,
    couponCode: couponCode || undefined,
  });

  return {
    success: Boolean(res?.success ?? true),
    newBalance: Number(res?.newBalance ?? 0),
  };
}

export async function validateShopCoupon(
  code: string,
  itemId?: string
): Promise<{
  valid: boolean;
  code?: string;
  discountPercent?: number;
  discountKobans?: number;
  bonusKobans?: number;
  finalPrice?: number;
  error?: string;
}> {
  const res = await api.post<{
    valid: boolean;
    code?: string;
    discountPercent?: number;
    discountKobans?: number;
    bonusKobans?: number;
    finalPrice?: number;
    error?: string;
  }>('/api/shop/coupons/validate', { code, itemId });
  return res;
}

export async function redeemShopCoupon(code: string): Promise<{
  success: boolean;
  newBalance: number;
  bonusKobans: number;
}> {
  const res = await api.post<{
    success: boolean;
    newBalance: number;
    bonusKobans: number;
  }>('/api/shop/coupons/redeem', { code });
  return res;
}

/**
 * Creates a pending Koban purchase verification request in D1 (`koban_requests`).
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

  const res = await api.post<{ id: string }>('/api/koban-requests', {
    userId: params.userId,
    userEmail: params.userEmail || '',
    userName: params.userName || '',
    amount,
    pkrAmount,
    transactionId: params.transactionId.trim(),
    paymentMethod: params.paymentMethod,
    note: params.note || '',
  });

  return String(res?.id || '');
}

/**
 * Fetches Koban requests for the Admin portal from D1.
 */
export async function fetchKobanRequests(statusFilter = 'all'): Promise<KobanRequest[]> {
  try {
    const res = await api.get<{ requests?: KobanRequest[] }>(
      `/api/admin/kobans/requests?status=${encodeURIComponent(statusFilter)}`,
      { silentToast: true }
    );
    return Array.isArray(res?.requests) ? res.requests : [];
  } catch (err) {
    console.error('[kobanService] fetchKobanRequests error:', err);
    return [];
  }
}

/**
 * Superadmin approves a pending Koban request via D1 atomic batch.
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

  await api.post(`/api/admin/kobans/requests/${encodeURIComponent(requestId)}/approve`, {
    targetUserId,
    approvedAmount: amount,
    txId,
  });

  await logAdminAction(
    superadminEmail,
    'approve_koban_request',
    { requestId, targetUserId, amount, txId },
    targetUserId
  ).catch(() => {});
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
  await api.post(`/api/admin/kobans/requests/${encodeURIComponent(requestId)}/reject`, {
    targetUserId,
    reason: reason || 'Transaction could not be verified on mobile banking portal.',
  });

  await logAdminAction(
    superadminEmail,
    'reject_koban_request',
    { requestId, targetUserId, reason },
    targetUserId
  ).catch(() => {});
}

/**
 * Superadmin manual adjustment: grant or deduct any integer amount in D1.
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

  const res = await api.post<{ newBalance: number }>('/api/admin/kobans/adjust', {
    targetUserId,
    deltaAmount: delta,
    reason: reason || (delta > 0 ? 'Superadmin grant' : 'Superadmin deduction'),
    targetUserEmail,
  });

  await logAdminAction(
    superadminEmail,
    'admin_adjust_kobans',
    { targetUserId, delta, newBalance: res?.newBalance, reason },
    targetUserId,
    targetUserEmail
  ).catch(() => {});

  return { newBalance: Number(res?.newBalance ?? 0) };
}

/**
 * Returns user's ledger entries from D1.
 */
export async function fetchUserLedger(
  userId: string,
  maxLimit = 50
): Promise<WalletLedgerEntry[]> {
  try {
    const res = await api.get<{ ledger?: WalletLedgerEntry[] }>(
      `/api/wallet/ledger?uid=${encodeURIComponent(userId)}&limit=${maxLimit}`,
      { silentToast: true }
    );
    return Array.isArray(res?.ledger) ? res.ledger : [];
  } catch (err) {
    console.error('[kobanService] fetchUserLedger error:', err);
    return [];
  }
}

export function getCurrentPktMonth(): { key: string; label: string } {
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktDate = new Date(Date.now() + PKT_OFFSET_MS);
  const year = pktDate.getUTCFullYear();
  const month = pktDate.getUTCMonth();
  const monthStr = String(month + 1).padStart(2, '0');
  const key = `${year}-${monthStr}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const label = `${monthNames[month]} ${year}`;

  return { key, label };
}

export async function getCaptainAllotmentStatus(captainUid: string): Promise<{
  granted: boolean;
  date: Date | null;
  monthKey: string;
  monthLabel: string;
}> {
  const { key: monthKey, label: monthLabel } = getCurrentPktMonth();
  try {
    const res = await api.get<{
      granted?: boolean;
      timestamp?: number | null;
      monthKey?: string;
    }>(
      `/api/admin/kobans/captain-allotment?captainUid=${encodeURIComponent(captainUid)}&monthKey=${encodeURIComponent(monthKey)}`,
      { silentToast: true }
    );
    if (res?.granted) {
      return {
        granted: true,
        date: res.timestamp ? new Date(Number(res.timestamp)) : new Date(),
        monthKey,
        monthLabel,
      };
    }
  } catch (err) {
    console.warn('[kobanService] getCaptainAllotmentStatus error:', err);
  }
  return { granted: false, date: null, monthKey, monthLabel };
}

export async function grantCaptainMonthlyAllotment(
  superadminEmail: string,
  captainUid: string,
  captainName: string,
  captainEmail?: string
): Promise<{ success: boolean; newBalance: number }> {
  const { key: monthKey, label: monthLabel } = getCurrentPktMonth();
  const res = await api.post<{ success: boolean; newBalance: number }>(
    '/api/admin/kobans/captain-allotment',
    {
      captainUid,
      captainName,
      captainEmail,
      monthKey,
      monthLabel,
    }
  );

  await logAdminAction(
    superadminEmail,
    'grant_captain_monthly_allotment',
    { captainUid, captainName, monthKey, amount: 5000 },
    captainUid,
    captainEmail
  ).catch(() => {});

  return {
    success: Boolean(res?.success ?? true),
    newBalance: Number(res?.newBalance ?? 0),
  };
}

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
  ).catch(() => {});

  return { grantedCount, skippedCount };
}
