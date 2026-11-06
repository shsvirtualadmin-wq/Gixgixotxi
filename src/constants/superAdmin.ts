export const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
export const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
export const SUPER_ADMIN_NAME = 'SHS Virtual Academy';

export function isAdminAccount(uid?: string | null, email?: string | null): boolean {
  if (uid === SUPER_ADMIN_UID) return true;
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return (
    lower === SUPER_ADMIN_EMAIL.toLowerCase() ||
    lower === SUPER_ADMIN_EMAIL_SUPPORT.toLowerCase() ||
    lower === 'admin@shsvirtual.org'
  );
}

