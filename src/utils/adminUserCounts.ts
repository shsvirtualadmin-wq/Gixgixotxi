/**
 * Single shared user-count calculation for Admin Overview and Admin Users directory.
 * Always includes active guests so Overview and Users display the exact same total
 * (e.g. 57 Free + 34 Pro + 3 Plus = 94 registered + 1 guest = 95 total users).
 */

export interface AdminUserCountInput {
  registeredCount?: number | null;
  freeCount?: number | null;
  proCount?: number | null;
  plusCount?: number | null;
  guestCount?: number | null;
  loadedUsersCount?: number | null;
}

export interface AdminUserTotals {
  /** Authoritative total accounts including active guests (registered + guests). */
  totalUsers: number;
  /** Registered (non-guest) accounts. */
  registeredUsers: number;
  /** Active non-upgraded guest accounts. */
  guestCount: number;
  /** Sum of Free + Pro + Plus tiers when available. */
  tierSum: number;
}

function toNonNegativeInt(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

export function computeAdminUserTotals(input: AdminUserCountInput): AdminUserTotals {
  const free = toNonNegativeInt(input.freeCount);
  const pro = toNonNegativeInt(input.proCount);
  const plus = toNonNegativeInt(input.plusCount);
  const hasTierSum = free !== null || pro !== null || plus !== null;
  const tierSum = (free ?? 0) + (pro ?? 0) + (plus ?? 0);

  const registeredRaw = toNonNegativeInt(input.registeredCount);
  const registeredUsers =
    registeredRaw !== null ? registeredRaw : hasTierSum ? tierSum : 0;

  const guestCount = toNonNegativeInt(input.guestCount) ?? 0;
  const loadedUsers = toNonNegativeInt(input.loadedUsersCount) ?? 0;

  const combined = registeredUsers + guestCount;
  const totalUsers = Math.max(combined, loadedUsers);

  return {
    totalUsers,
    registeredUsers,
    guestCount,
    tierSum,
  };
}
