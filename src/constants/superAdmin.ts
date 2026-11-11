export const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
export const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
export const SUPER_ADMIN_UIDS: readonly string[] = [
  SUPER_ADMIN_UID,
  'uid_superadmin_1',
  'uid_superadmin_2',
];
export const SUPER_ADMIN_NAME = 'SHS Virtual Academy';

export function isAdminAccount(uid?: string | null, _unusedEmail?: string | null): boolean {
  if (!uid || typeof uid !== 'string') return false;
  return SUPER_ADMIN_UIDS.includes(uid.trim());
}

