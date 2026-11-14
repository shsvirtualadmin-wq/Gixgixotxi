export type CanonicalUserRole = 'student' | 'crew' | 'captain' | 'admin' | 'super_admin';

export type PermissionKey =
  | 'mcq.manage'
  | 'content.delete'
  | 'users.view'
  | 'users.suspend'
  | 'users.delete'
  | 'users.role'
  | 'users.plan'
  | 'coupons.grant'
  | 'tests.manage'
  | 'tests.end'
  | 'certificates.issue'
  | 'announcements.manage'
  | 'security.reset'
  | 'audit.view';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'mcq.manage',
  'content.delete',
  'users.view',
  'users.suspend',
  'users.delete',
  'users.role',
  'users.plan',
  'coupons.grant',
  'tests.manage',
  'tests.end',
  'certificates.issue',
  'announcements.manage',
  'security.reset',
  'audit.view',
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'mcq.manage': 'Manage Question Bank (MCQs)',
  'content.delete': 'Delete Posts, Comments & Replies',
  'users.view': 'View User Directory, Profiles, Emails & IDs',
  'users.suspend': 'Suspend or Unsuspend Users',
  'users.delete': 'Permanently Delete User Accounts',
  'users.role': 'Assign or Change System Roles',
  'users.plan': 'Grant or Extend Pro Subscription Plans',
  'coupons.grant': 'Create or Grant Coupons, Promo Codes & Kobans',
  'tests.manage': 'Create, Edit or Schedule Grand Line Tests',
  'tests.end': 'End Live Tests & Finalise Results',
  'certificates.issue': 'Issue, Revoke or Regenerate Certificates',
  'announcements.manage': 'Send Announcements, Broadcasts & Banners',
  'security.reset': 'Reset 2FA, Sessions or Passwords for Users',
  'audit.view': 'View Audit Logs, Access Requests & System Settings',
};

export const ROLE_PERMISSION_MAP: Record<CanonicalUserRole, PermissionKey[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: ['mcq.manage', 'content.delete'],
  captain: [],
  crew: [],
  student: [],
};

export const SYSTEM_ROLE_SELECTOR_ORDER: Array<{
  key: CanonicalUserRole;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: 'student',
    label: 'Student',
    shortLabel: 'Student',
    description: 'Standard learner account with access to practice MCQs, Grand Line mocks, and community discussions.',
  },
  {
    key: 'crew',
    label: 'Crew',
    shortLabel: 'Crew',
    description: 'Verified community contributor and campus representative supporting peer study groups.',
  },
  {
    key: 'captain',
    label: 'Captain',
    shortLabel: 'Captain',
    description: 'Trusted academic mentor who can author and manage own Grand Line mock tests and study halls.',
  },
  {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Can manage MCQs and moderate content. Everything else needs Super Admin approval.',
  },
  {
    key: 'super_admin',
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    description: 'Full owner access.',
  },
];

export function normalizeCanonicalRole(rawRole?: string | null): CanonicalUserRole {
  const normalized = String(rawRole || '').trim().toLowerCase();
  if (normalized === 'super_admin' || normalized === 'superadmin') {
    return 'super_admin';
  }
  if (normalized === 'admin') {
    return 'admin';
  }
  if (normalized === 'captain' || normalized === 'ambassador') {
    return 'captain';
  }
  if (normalized === 'crew') {
    return 'crew';
  }
  return 'student';
}

export function isSuperAdminRole(rawRole?: string | null): boolean {
  return normalizeCanonicalRole(rawRole) === 'super_admin';
}

export function isAdminOrSuperAdminRole(rawRole?: string | null): boolean {
  const canonical = normalizeCanonicalRole(rawRole);
  return canonical === 'super_admin' || canonical === 'admin';
}

export function isLimitedAdminRole(rawRole?: string | null): boolean {
  return normalizeCanonicalRole(rawRole) === 'admin';
}

export interface ActivePermissionGrant {
  id: string;
  userId: string;
  permission: PermissionKey;
  targetId?: string | null;
  duration: 'once' | '1h' | '24h' | '7d';
  expiresAt?: string | null;
  consumedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  requestId?: string | null;
  grantedBy?: string | null;
}

export interface AccessRequestRecord {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  permission: PermissionKey;
  targetId?: string | null;
  targetLabel?: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';
  createdAt: string;
  decidedBy?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  expiresAt?: string | null;
  decisionNote?: string | null;
  duration?: 'once' | '1h' | '24h' | '7d' | null;
  grantId?: string | null;
}

export function roleHasPermission(
  rawRole: string | null | undefined,
  permission: PermissionKey,
  activeGrants?: ActivePermissionGrant[] | null,
  targetId?: string | null
): boolean {
  const canonical = normalizeCanonicalRole(rawRole);
  const rolePerms = ROLE_PERMISSION_MAP[canonical] || [];
  if (rolePerms.includes(permission)) {
    return true;
  }
  if (!Array.isArray(activeGrants) || activeGrants.length === 0) {
    return false;
  }
  const nowMs = Date.now();
  return activeGrants.some((grant) => {
    if (!grant || grant.permission !== permission) return false;
    if (grant.revokedAt || grant.consumedAt) return false;
    if (grant.expiresAt) {
      const expMs = new Date(grant.expiresAt).getTime();
      if (Number.isFinite(expMs) && expMs <= nowMs) return false;
    }
    if (grant.targetId && targetId && grant.targetId !== targetId) {
      return false;
    }
    return true;
  });
}
