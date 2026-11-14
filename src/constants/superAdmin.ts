export const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';
export const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
export const SUPER_ADMIN_EMAIL_OWNER = 'ktkhashir90@gmail.com';
export const SUPER_ADMIN_EMAILS: readonly string[] = [
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL_SUPPORT,
  SUPER_ADMIN_EMAIL_OWNER,
];
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
export const SUPER_ADMIN_UIDS: readonly string[] = [
  SUPER_ADMIN_UID,
  'Pz5fjmLtXHbWL2ntnW1zd8nlQos2',
  '2GHhpHZkYFR1keIAwlnuch08mdh1',
  'JBGCDTLuWUMUIUMCLek7SdgvUNn1',
  'uid_superadmin_1',
  'uid_superadmin_2',
];
export const SUPER_ADMIN_NAME = 'SHS Virtual Academy';

export function isAdminAccount(uid?: string | null, email?: string | null): boolean {
  if (uid && typeof uid === 'string' && SUPER_ADMIN_UIDS.includes(uid.trim())) {
    return true;
  }
  if (email && typeof email === 'string' && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
    return true;
  }
  return false;
}


