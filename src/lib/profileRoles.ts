export type StaffRole = 'captain' | 'admin' | 'superadmin';
export type CanonicalRole = 'student' | 'teacher' | StaffRole;
export type StaffRank = 'none' | StaffRole;
export type ProfileStatusValue = 'active' | 'busy' | 'away' | 'invisible';

export interface RoleOptionDef {
  value: string;
  label: string;
  displayTag: string;
  canonicalRole: CanonicalRole;
  groupId: 'students' | 'aspirants' | 'university' | 'teaching' | 'staff';
  isStaff: boolean;
}

export interface RoleGroupDef {
  id: 'students' | 'aspirants' | 'university' | 'teaching' | 'staff';
  label: string;
  subtitle?: string;
  isStaff: boolean;
  options: RoleOptionDef[];
}

export const ROLE_GROUPS: RoleGroupDef[] = [
  {
    id: 'students',
    label: 'Students',
    isStaff: false,
    options: [
      { value: 'Student', label: 'Student', displayTag: 'Student', canonicalRole: 'student', groupId: 'students', isStaff: false },
      { value: 'O / A Levels', label: 'O / A Levels', displayTag: 'O / A Levels', canonicalRole: 'student', groupId: 'students', isStaff: false },
      { value: 'Class Topper', label: 'Class Topper', displayTag: 'Class Topper', canonicalRole: 'student', groupId: 'students', isStaff: false },
    ],
  },
  {
    id: 'aspirants',
    label: 'Aspirants',
    isStaff: false,
    options: [
      { value: 'MDCAT Aspirant', label: 'MDCAT Aspirant', displayTag: 'MDCAT Aspirant', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
      { value: 'ECAT Aspirant', label: 'ECAT Aspirant', displayTag: 'ECAT Aspirant', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
      { value: 'University Aspirant', label: 'University Aspirant', displayTag: 'University Aspirant', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
      { value: 'Pre-Medical', label: 'Pre-Medical', displayTag: 'Pre-Medical', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
      { value: 'Pre-Engineering', label: 'Pre-Engineering', displayTag: 'Pre-Engineering', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
      { value: 'ICS / Computer Science', label: 'ICS / Computer Science', displayTag: 'ICS / Computer Science', canonicalRole: 'student', groupId: 'aspirants', isStaff: false },
    ],
  },
  {
    id: 'university',
    label: 'University',
    isStaff: false,
    options: [
      { value: 'University Student', label: 'University Student', displayTag: 'University Student', canonicalRole: 'student', groupId: 'university', isStaff: false },
    ],
  },
  {
    id: 'teaching',
    label: 'Teaching',
    isStaff: false,
    options: [
      { value: 'Teacher', label: 'Teacher', displayTag: 'Teacher', canonicalRole: 'teacher', groupId: 'teaching', isStaff: false },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    subtitle: 'Set by admins',
    isStaff: true,
    options: [
      { value: 'Captain', label: 'Captain', displayTag: 'Captain', canonicalRole: 'captain', groupId: 'staff', isStaff: true },
      { value: 'Admin', label: 'Admin', displayTag: 'Admin', canonicalRole: 'admin', groupId: 'staff', isStaff: true },
      { value: 'Superadmin', label: 'Superadmin', displayTag: 'Super Admin', canonicalRole: 'superadmin', groupId: 'staff', isStaff: true },
    ],
  },
];

export const ALL_ROLE_OPTIONS: RoleOptionDef[] = ROLE_GROUPS.flatMap((g) => g.options);

export interface StatusOptionDef {
  value: ProfileStatusValue;
  label: string;
  dotColorClass: string;
  chipClass: string;
}

export const PROFILE_STATUS_OPTIONS: StatusOptionDef[] = [
  {
    value: 'active',
    label: 'Active',
    dotColorClass: 'bg-emerald-500',
    chipClass:
      'bg-emerald-500/10 border-emerald-600/25 text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'busy',
    label: 'Busy',
    dotColorClass: 'bg-[#D71921]',
    chipClass:
      'bg-[#D71921]/10 border-[#D71921]/30 text-[#D71921] dark:text-[#ff6b72]',
  },
  {
    value: 'away',
    label: 'Away',
    dotColorClass: 'bg-amber-400',
    chipClass:
      'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
  },
  {
    value: 'invisible',
    label: 'Invisible',
    dotColorClass: 'bg-zinc-400 dark:bg-zinc-500',
    chipClass:
      'bg-zinc-500/10 border-zinc-500/25 text-zinc-600 dark:text-zinc-400',
  },
];

const OPTION_BY_LOWER = new Map<string, RoleOptionDef>();
for (const opt of ALL_ROLE_OPTIONS) {
  OPTION_BY_LOWER.set(opt.value.toLowerCase(), opt);
  OPTION_BY_LOWER.set(opt.label.toLowerCase(), opt);
  OPTION_BY_LOWER.set(opt.displayTag.toLowerCase(), opt);
}
// Extra aliases for canonical DB values
OPTION_BY_LOWER.set('super_admin', OPTION_BY_LOWER.get('superadmin')!);
OPTION_BY_LOWER.set('super-admin', OPTION_BY_LOWER.get('superadmin')!);
OPTION_BY_LOWER.set('super admin', OPTION_BY_LOWER.get('superadmin')!);
OPTION_BY_LOWER.set('nakama captain', OPTION_BY_LOWER.get('captain')!);

export function findRoleOption(raw?: string | null): RoleOptionDef | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;
  return OPTION_BY_LOWER.get(cleaned) || null;
}

export function normalizeStaffRank(role?: string | null): StaffRank {
  const lower = String(role || '').trim().toLowerCase();
  if (lower === 'superadmin' || lower === 'super_admin' || lower === 'super admin') {
    return 'superadmin';
  }
  if (lower === 'admin' || lower === 'administrator') {
    return 'admin';
  }
  if (lower === 'captain' || lower === 'nakama captain') {
    return 'captain';
  }
  return 'none';
}

export function staffRankScore(rank: StaffRank): number {
  switch (rank) {
    case 'superadmin':
      return 3;
    case 'admin':
      return 2;
    case 'captain':
      return 1;
    default:
      return 0;
  }
}

export function highestStaffRank(...ranks: (StaffRank | string | null | undefined)[]): StaffRank {
  let best: StaffRank = 'none';
  for (const r of ranks) {
    const norm = normalizeStaffRank(r);
    if (staffRankScore(norm) > staffRankScore(best)) {
      best = norm;
    }
  }
  return best;
}

export function isStaffOptionValue(value?: string | null): boolean {
  const opt = findRoleOption(value);
  return Boolean(opt?.isStaff);
}

/**
 * Resolves a user's stored `(role, customRole)` into the canonical dropdown option value.
 */
export function resolveProfileRoleSelection(
  role?: string | null,
  customRole?: string | null
): string {
  const staffRank = normalizeStaffRank(role);
  if (staffRank === 'superadmin') return 'Superadmin';
  if (staffRank === 'admin') return 'Admin';
  if (staffRank === 'captain') return 'Captain';

  const roleLower = String(role || '').trim().toLowerCase();
  if (roleLower === 'teacher') return 'Teacher';

  // For non-staff users, only accept non-staff customRole values
  const customOpt = findRoleOption(customRole);
  if (customOpt && !customOpt.isStaff) {
    return customOpt.value;
  }

  return 'Student';
}

/**
 * Formats a user's `(role, customRole)` into the canonical tag label & category.
 * Display names: Student, Teacher, Captain, Admin, "Super Admin" (plus valid student/aspirant/university tracks).
 * Never lets a spoofed customRole render as a staff role unless `role` itself is staff.
 */
export function resolveRoleBadgeDisplay(params: {
  role?: string | null;
  customRole?: string | null;
  isSuperAdmin?: boolean;
}): {
  label: string;
  kind: 'superadmin' | 'admin' | 'captain' | 'teacher' | 'bot' | 'student';
} {
  const lowerRole = String(params.role || '').trim().toLowerCase();
  const lowerCustom = String(params.customRole || '').trim().toLowerCase();

  if (lowerRole === 'bot' || lowerCustom === 'bot' || lowerCustom.includes('study bot')) {
    return { label: 'Bot', kind: 'bot' };
  }

  // Explicit role takes precedence so e.g. a Superadmin who selected Admin displays "Admin"
  if (lowerRole === 'superadmin' || lowerRole === 'super_admin' || lowerRole === 'super admin') {
    return { label: 'Super Admin', kind: 'superadmin' };
  }
  if (lowerRole === 'admin' || lowerRole === 'administrator') {
    return { label: 'Admin', kind: 'admin' };
  }
  if (lowerRole === 'captain' || lowerRole === 'nakama captain') {
    return { label: 'Captain', kind: 'captain' };
  }
  if (lowerRole === 'teacher') {
    return { label: 'Teacher', kind: 'teacher' };
  }

  // Fallback for legacy callers that only pass isSuperAdmin=true without an explicit non-super role
  if (params.isSuperAdmin && !lowerRole) {
    return { label: 'Super Admin', kind: 'superadmin' };
  }

  const customOpt = findRoleOption(params.customRole);
  if (customOpt && !customOpt.isStaff) {
    return {
      label: customOpt.displayTag,
      kind: customOpt.canonicalRole === 'teacher' ? 'teacher' : 'student',
    };
  }

  return { label: 'Student', kind: 'student' };
}

/**
 * Returns the role dropdown groups visible to a caller in the UI.
 * - Staff group is hidden for users who cannot set any staff role (unless they already hold a staff role, in which case only their keepable/allowed staff options appear).
 */
export function getVisibleRoleGroups(params: {
  callerStaffRank: StaffRank;
  currentSelection?: string | null;
}): RoleGroupDef[] {
  const { callerStaffRank, currentSelection } = params;
  const currentStaff = normalizeStaffRank(currentSelection);

  const nonStaffGroups = ROLE_GROUPS.filter((g) => !g.isStaff);
  const staffGroup = ROLE_GROUPS.find((g) => g.isStaff)!;

  let allowedStaffOptions: RoleOptionDef[] = [];
  if (callerStaffRank === 'superadmin') {
    allowedStaffOptions = staffGroup.options;
  } else if (callerStaffRank === 'admin') {
    allowedStaffOptions = staffGroup.options.filter(
      (opt) => opt.canonicalRole === 'captain' || opt.canonicalRole === 'admin'
    );
  } else if (callerStaffRank === 'captain' || currentStaff === 'captain') {
    // Captain can keep Captain
    allowedStaffOptions = staffGroup.options.filter((opt) => opt.canonicalRole === 'captain');
  } else if (currentStaff !== 'none') {
    // If a user already holds a staff role, preserve it as their current value in the list
    allowedStaffOptions = staffGroup.options.filter((opt) => opt.canonicalRole === currentStaff);
  }

  if (allowedStaffOptions.length === 0) {
    return nonStaffGroups;
  }

  return [
    ...nonStaffGroups,
    {
      ...staffGroup,
      options: allowedStaffOptions,
    },
  ];
}

export interface RoleChangeEvaluation {
  allowed: boolean;
  status: number;
  error?: string;
  roleChanged: boolean;
  nextRole: CanonicalRole;
  nextCustomRole: string | null;
}

/**
 * Server-authoritative RBAC check for profile role / track mutations.
 * Caller staff rank MUST come from verified DB / auth claims — never from request body.
 */
export function evaluateRoleChangePermission(params: {
  callerStaffRank: StaffRank;
  targetExistingRole?: string | null;
  targetExistingCustomRole?: string | null;
  requestedRole?: string | null;
  requestedCustomRole?: string | null;
  isSelf: boolean;
}): RoleChangeEvaluation {
  const {
    callerStaffRank,
    targetExistingRole,
    targetExistingCustomRole,
    requestedRole,
    requestedCustomRole,
    isSelf,
  } = params;

  const existingStaff = normalizeStaffRank(targetExistingRole);
  const existingCanonical: CanonicalRole =
    existingStaff !== 'none'
      ? existingStaff
      : String(targetExistingRole || '').trim().toLowerCase() === 'teacher'
      ? 'teacher'
      : 'student';
  const existingCustom = targetExistingCustomRole ?? null;

  // Editing another user requires Admin or Superadmin
  if (!isSelf) {
    if (callerStaffRank !== 'admin' && callerStaffRank !== 'superadmin') {
      return {
        allowed: false,
        status: 403,
        error: 'You do not have permission to edit another user’s profile.',
        roleChanged: false,
        nextRole: existingCanonical,
        nextCustomRole: existingCustom,
      };
    }
    if (callerStaffRank === 'admin' && existingStaff === 'superadmin') {
      return {
        allowed: false,
        status: 403,
        error: 'Admins cannot modify a Super Admin account.',
        roleChanged: false,
        nextRole: existingCanonical,
        nextCustomRole: existingCustom,
      };
    }
  }

  const hasRoleInput =
    (requestedRole !== undefined && requestedRole !== null && String(requestedRole).trim() !== '') ||
    (requestedCustomRole !== undefined &&
      requestedCustomRole !== null &&
      String(requestedCustomRole).trim() !== '');

  // If neither role nor customRole was sent, preserve existing role completely (never wipe staff role!)
  if (!hasRoleInput) {
    return {
      allowed: true,
      status: 200,
      roleChanged: false,
      nextRole: existingCanonical,
      nextCustomRole: existingCustom,
    };
  }

  // Resolve requested option: prefer explicit `requestedRole` if it names a staff/teacher role or full track,
  // otherwise resolve `requestedCustomRole`.
  const roleOptFromRole = findRoleOption(requestedRole);
  const roleOptFromCustom = findRoleOption(requestedCustomRole);

  // If both were provided, check for privilege escalation in either field
  let targetOpt: RoleOptionDef | null = null;
  if (roleOptFromRole && roleOptFromCustom) {
    // If either explicitly asks for a staff role, evaluate that staff role so spoofing via customRole is blocked
    if (roleOptFromRole.isStaff && !roleOptFromCustom.isStaff) {
      targetOpt = roleOptFromRole;
    } else if (roleOptFromCustom.isStaff && !roleOptFromRole.isStaff) {
      targetOpt = roleOptFromCustom;
    } else if (roleOptFromRole.canonicalRole === 'student' && !roleOptFromCustom.isStaff) {
      // e.g. role='student', customRole='MDCAT Aspirant' or 'Teacher'
      targetOpt = roleOptFromCustom;
    } else {
      targetOpt = roleOptFromRole;
    }
  } else {
    targetOpt = roleOptFromRole || roleOptFromCustom;
  }

  if (!targetOpt) {
    return {
      allowed: false,
      status: 400,
      error: 'Invalid role or track selection.',
      roleChanged: false,
      nextRole: existingCanonical,
      nextCustomRole: existingCustom,
    };
  }

  // Enforce staff role permissions
  if (targetOpt.canonicalRole === 'superadmin') {
    if (callerStaffRank !== 'superadmin') {
      return {
        allowed: false,
        status: 403,
        error: 'Only a Super Admin can assign the Superadmin role.',
        roleChanged: false,
        nextRole: existingCanonical,
        nextCustomRole: existingCustom,
      };
    }
  } else if (targetOpt.canonicalRole === 'admin') {
    if (callerStaffRank !== 'superadmin' && callerStaffRank !== 'admin') {
      return {
        allowed: false,
        status: 403,
        error: 'Only an Admin or Super Admin can assign the Admin role.',
        roleChanged: false,
        nextRole: existingCanonical,
        nextCustomRole: existingCustom,
      };
    }
  } else if (targetOpt.canonicalRole === 'captain') {
    const captainKeepingCaptain = isSelf && existingStaff === 'captain';
    if (
      callerStaffRank !== 'superadmin' &&
      callerStaffRank !== 'admin' &&
      !captainKeepingCaptain
    ) {
      return {
        allowed: false,
        status: 403,
        error: 'Only an Admin or Super Admin can assign the Captain role.',
        roleChanged: false,
        nextRole: existingCanonical,
        nextCustomRole: existingCustom,
      };
    }
  }

  const roleChanged =
    targetOpt.canonicalRole !== existingCanonical || targetOpt.value !== (existingCustom || '');

  return {
    allowed: true,
    status: 200,
    roleChanged,
    nextRole: targetOpt.canonicalRole,
    nextCustomRole: targetOpt.value,
  };
}

export function normalizeProfileStatus(raw?: string | null): ProfileStatusValue {
  const lower = String(raw || '').trim().toLowerCase();
  if (lower === 'busy') return 'busy';
  if (lower === 'away') return 'away';
  if (lower === 'invisible' || lower === 'offline') return 'invisible';
  return 'active';
}

export function getProfileStatusOption(raw?: string | null): StatusOptionDef {
  const norm = normalizeProfileStatus(raw);
  return PROFILE_STATUS_OPTIONS.find((s) => s.value === norm) || PROFILE_STATUS_OPTIONS[0];
}

export const RESERVED_BRAND_TOKENS = ['shsvirtualacademy', 'boardly', 'scholario'] as const;

export function normalizeBrandCheck(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'l')
    .replace(/[0]/g, 'o')
    .replace(/[$5§]/g, 's')
    .replace(/[^a-z0-9]/g, '');
}

export function containsReservedBrandName(input: string): boolean {
  const norm = normalizeBrandCheck(input);
  if (!norm) return false;
  const collapsed = norm.replace(/(.)\1+/g, '$1');
  return RESERVED_BRAND_TOKENS.some((tok) => norm.includes(tok) || collapsed.includes(tok));
}

export const RESERVED_BRAND_ERROR =
  'Names containing SHS Virtual Academy, Boardly, or Scholario are reserved and require admin approval.';

export function validateProfileDisplayName(
  raw: string,
  isAdminOrAbove = false
): { valid: boolean; clean: string; error?: string } {
  const clean = String(raw || '').trim();
  if (clean.length < 2) {
    return { valid: false, clean, error: 'Display name must be at least 2 characters.' };
  }
  if (clean.length > 40) {
    return { valid: false, clean, error: 'Display name must be 40 characters or fewer.' };
  }
  if (!isAdminOrAbove && containsReservedBrandName(clean)) {
    return { valid: false, clean, error: RESERVED_BRAND_ERROR };
  }
  return { valid: true, clean };
}

export function validateProfileUsername(
  raw: string,
  isAdminOrAbove = false
): { valid: boolean; clean: string; error?: string } {
  const clean = String(raw || '').trim().toLowerCase();
  if (clean.length < 3 || clean.length > 20) {
    return {
      valid: false,
      clean,
      error: 'Username must be 3–20 characters.',
    };
  }
  if (!/^[a-z0-9._]+$/.test(clean)) {
    return {
      valid: false,
      clean,
      error: 'Use only lowercase letters, numbers, dots, and underscores.',
    };
  }
  if (/^[._]|[._]$/.test(clean) || /[._]{2,}/.test(clean)) {
    return {
      valid: false,
      clean,
      error: 'Username cannot start, end, or repeat dots or underscores.',
    };
  }
  if (!isAdminOrAbove && containsReservedBrandName(clean)) {
    return { valid: false, clean, error: RESERVED_BRAND_ERROR };
  }
  return { valid: true, clean };
}

export function validateProfileBio(raw: string): { valid: boolean; clean: string; error?: string } {
  const value = String(raw ?? '');
  if (value.length > 160) {
    return { valid: false, clean: value, error: 'Bio must be 160 characters or fewer.' };
  }
  return { valid: true, clean: value };
}
