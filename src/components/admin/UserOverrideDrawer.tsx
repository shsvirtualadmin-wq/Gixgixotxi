import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertTriangle,
  Clock,
  Trash2,
  Shield,
  Sparkles,
  UserMinus,
  ExternalLink,
  Lock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { UserProfile, UserRole, UserPlan, UserTwoFactorSummary } from '@/types';
import {
  updateUserOverride,
  deleteUserAccount,
  fetchUserRecentAttempts,
  getUserDisplayName,
  normalizeTwoFactorSummary,
  getCachedAdminUsersState,
  updateCachedAdminUser2fa,
  fetchAdminJsonWithRetry,
} from '@/services/adminService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { fetchCrewDetails, removeMemberFromCrew } from '@/services/crewService';
import { isCrewPaidActive } from '@/services/crewBackend';
import { maskEmail } from '@/utils/privacy';
import type { CrewDoc } from '@/types/crew';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { showApiToast } from '@/lib/api';
import { LineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import {
  SYSTEM_ROLE_SELECTOR_ORDER,
  normalizeCanonicalRole,
  type CanonicalUserRole,
  type PermissionKey,
} from '@/constants/permissions';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { RequestAccessSheet } from './RequestAccessSheet';

export type UserOverrideSection = 'top' | 'plan' | 'role' | 'attempts' | 'security';

interface RecentAttemptItem {
  id: string;
  subject?: string;
  title?: string;
  score?: number;
  totalQuestions?: number;
}

interface UserOverrideDrawerProps {
  user: UserProfile | null;
  adminEmail: string;
  initialSection?: UserOverrideSection;
  initialTwoFactorStatus?: Partial<UserTwoFactorSummary> | null;
  onUpdate2faStatus?: (uid: string, status: UserTwoFactorSummary) => void;
  onUserUpdated?: (updatedUser: UserProfile) => void;
  onClose: () => void;
  onSuccess: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseExpiryDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (typeof val.toMillis === 'function') {
    return new Date(val.toMillis());
  }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatPlanExpiry(plan?: string, planExpiresAt?: unknown): string {
  if (plan !== 'pro') {
    return 'Free';
  }
  const date = parseExpiryDate(planExpiresAt);
  if (!date) {
    return 'Pro (Monthly)';
  }
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (date.getTime() < Date.now()) {
    return `Pro (Expired ${dateStr})`;
  }
  return `Pro, expires ${dateStr}`;
}

export function UserOverrideDrawer({
  user,
  adminEmail,
  initialSection = 'top',
  initialTwoFactorStatus,
  onUpdate2faStatus,
  onUserUpdated,
  onClose,
  onSuccess,
}: UserOverrideDrawerProps) {
  const { isSuperAdmin: authIsSuperAdmin, hasPermission, refreshActiveGrants } = useAuth();
  // SECURITY: SuperAdmin comes strictly from verified Firebase Auth custom claims (token.superAdmin === true)
  const isSuperAdmin = Boolean(authIsSuperAdmin);

  useBodyScrollLock(Boolean(user), 'user-override-drawer');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const planSectionRef = useRef<HTMLElement | null>(null);
  const roleSectionRef = useRef<HTMLElement | null>(null);
  const attemptsSectionRef = useRef<HTMLElement | null>(null);
  const securitySectionRef = useRef<HTMLElement | null>(null);
  const [activeJumpChip, setActiveJumpChip] = useState<UserOverrideSection>(initialSection || 'top');

  const scrollToSection = useCallback(
    (section: UserOverrideSection, behavior: ScrollBehavior = 'smooth') => {
      setActiveJumpChip(section);
      const container = scrollContainerRef.current;
      if (!container) return;
      if (section === 'top') {
        container.scrollTo({ top: 0, behavior });
        return;
      }
      const refMap: Record<Exclude<UserOverrideSection, 'top'>, HTMLElement | null> = {
        plan: planSectionRef.current,
        role: roleSectionRef.current,
        attempts: attemptsSectionRef.current,
        security: securitySectionRef.current,
      };
      const targetEl = refMap[section];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior, block: 'start' });
      }
    },
    []
  );

  const canChangePlan = hasPermission('users.plan', user?.uid);
  const canChangeRole = isSuperAdmin && hasPermission('users.role', user?.uid);
  const canSuspendUser = hasPermission('users.suspend', user?.uid);
  const canDeleteUser = hasPermission('users.delete', user?.uid);
  const canResetSecurity = hasPermission('security.reset', user?.uid);

  type SelectedPlanPreset = 'monthly' | 'annual' | 'custom' | 'free';

  const [role, setRole] = useState<CanonicalUserRole>('student');
  const [plan, setPlan] = useState<UserPlan>('free');
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanPreset>('free');
  const [baselineSelectedPlan, setBaselineSelectedPlan] = useState<SelectedPlanPreset>('free');
  const [planTouched, setPlanTouched] = useState<boolean>(false);
  const [extendMonths, setExtendMonths] = useState<number>(0);
  const [customDays, setCustomDays] = useState<number>(30);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  // Baseline values for dirty-state detection so "Save changes" is disabled until something changed
  const [baselineRole, setBaselineRole] = useState<CanonicalUserRole>('student');
  const [baselinePlan, setBaselinePlan] = useState<UserPlan>('free');
  const [baselineSuspended, setBaselineSuspended] = useState<boolean>(false);

  // Track which UID has been initialized so background 2FA or list refetches never overwrite unsaved edits!
  const initializedUidRef = useRef<string | null>(null);

  const [recentAttempts, setRecentAttempts] = useState<RecentAttemptItem[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  const loadRecentAttemptsForUid = useCallback((uid: string) => {
    if (!uid) return;
    setLoadingAttempts(true);
    setAttemptsError(null);
    fetchUserRecentAttempts(uid, 5)
      .then((attempts) => {
        setRecentAttempts(attempts);
        setAttemptsError(null);
      })
      .catch((err) => {
        setRecentAttempts([]);
        setAttemptsError(err instanceof Error ? err.message : "Couldn't load");
      })
      .finally(() => setLoadingAttempts(false));
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destructive action confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<
    'role' | 'suspend' | 'delete' | null
  >(null);
  const [pendingRole, setPendingRole] = useState<CanonicalUserRole | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Access request modal for limited admins
  const [requestAccessModal, setRequestAccessModal] = useState<{
    permission: PermissionKey;
    actionLabel: string;
  } | null>(null);

  const navigate = useNavigate();
  const [userCrew, setUserCrew] = useState<CrewDoc | null>(null);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [removingFromCrew, setRemovingFromCrew] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState<string | null>(null);

  type Admin2faActionType = 'reset' | 'approve_recovery' | 'cancel_recovery' | 'enable_email_2fa';
  interface AdminAuditLogEntry {
    id: string;
    userId: string;
    actorId: string;
    eventType: string;
    details: Record<string, any>;
    createdAt: number;
  }

  const resolveSeedTwoFactorStatus = useCallback(
    (
      targetUser: UserProfile | null,
      seedOverride?: Partial<UserTwoFactorSummary> | null
    ): UserTwoFactorSummary => {
      if (!targetUser) return normalizeTwoFactorSummary(null);
      const cachedEntry = getCachedAdminUsersState()?.user2faMap?.[targetUser.uid];
      return normalizeTwoFactorSummary(
        seedOverride || targetUser.twoFactorStatus || cachedEntry || null
      );
    },
    []
  );

  const [twoFactorStatus, setTwoFactorStatus] = useState<UserTwoFactorSummary>(() =>
    resolveSeedTwoFactorStatus(user, initialTwoFactorStatus)
  );
  const [securityAuditLogs, setSecurityAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [canManage2fa, setCanManage2fa] = useState<boolean>(false);
  const [canModifyTarget2fa, setCanModifyTarget2fa] = useState<boolean>(false);
  const [targetIsSuperAdmin2fa, setTargetIsSuperAdmin2fa] = useState<boolean>(false);
  const [targetIsSelf2fa, setTargetIsSelf2fa] = useState<boolean>(false);
  const [callerHas2fa, setCallerHas2fa] = useState<boolean>(false);

  const [pending2faAction, setPending2faAction] = useState<Admin2faActionType | null>(null);
  const [admin2faReason, setAdmin2faReason] = useState<string>('');
  const [admin2faIdentityVerified, setAdmin2faIdentityVerified] = useState<boolean>(false);
  const [admin2faPassword, setAdmin2faPassword] = useState<string>('');
  const [admin2faCode, setAdmin2faCode] = useState<string>('');
  const [admin2faModalError, setAdmin2faModalError] = useState<string | null>(null);
  const [submitting2faAction, setSubmitting2faAction] = useState<boolean>(false);

  const activeUserUid = user?.uid || '';

  // Hide floating bottom nav while sheet is open and scroll to initial section (or top)
  useEffect(() => {
    if (!activeUserUid) return;
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setActiveJumpChip(initialSection || 'top');
    let rafId = 0;
    if (initialSection && initialSection !== 'top') {
      rafId = window.requestAnimationFrame(() => {
        scrollToSection(initialSection, 'auto');
      });
    }
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    };
  }, [activeUserUid, initialSection, scrollToSection]);

  // Initialize form state ONLY when opening a different user (prevents background refetches from snapping plan back to Free)
  useEffect(() => {
    if (!user) {
      initializedUidRef.current = null;
      return;
    }
    if (initializedUidRef.current === user.uid) {
      return;
    }
    initializedUidRef.current = user.uid;

    const initialCanonicalRole = normalizeCanonicalRole(user.role);
    const initialPlan: UserPlan = user.plan === 'pro' || user.isPremium ? 'pro' : 'free';
    const initialSusp = Boolean(user.suspended || user.isSuspended);
    const expDate = parseExpiryDate(user.planExpiresAt || user.premiumExpiresAt);
    const daysRemaining = expDate ? Math.round((expDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
    const initialPreset: SelectedPlanPreset =
      initialPlan === 'pro' ? (daysRemaining > 60 ? 'annual' : 'monthly') : 'free';

    setRole(initialCanonicalRole);
    setPlan(initialPlan);
    setSelectedPlan(initialPreset);
    setBaselineSelectedPlan(initialPreset);
    setPlanTouched(false);
    setExtendMonths(0);
    setCustomDays(30);
    setIsSuspended(initialSusp);

    setBaselineRole(initialCanonicalRole);
    setBaselinePlan(initialPlan);
    setBaselineSuspended(initialSusp);

    setError(null);
    setVerifiedNotice(null);
    setConfirmAction(null);

    setTwoFactorStatus(resolveSeedTwoFactorStatus(user, initialTwoFactorStatus));

    loadRecentAttemptsForUid(user.uid);

    if (user.crewId) {
      setLoadingCrew(true);
      fetchCrewDetails(user.crewId)
        .then((c) => setUserCrew(c))
        .catch(() => setUserCrew(null))
        .finally(() => setLoadingCrew(false));
    } else {
      setUserCrew(null);
    }
  }, [user, initialTwoFactorStatus, resolveSeedTwoFactorStatus, loadRecentAttemptsForUid]);

  const targetUid = user?.uid || '';
  const targetIsGuest = Boolean(user?.isGuest || user?.accountType === 'guest');

  const fetchUser2faDetails = useCallback(async () => {
    if (!targetUid || targetIsGuest) {
      return;
    }
    try {
      const { ok, data } = await fetchAdminJsonWithRetry<any>(
        `/api/auth/admin/2fa-status?uid=${encodeURIComponent(targetUid)}`,
        { credentials: 'include' }
      );
      if (ok && data?.ok) {
        const s = data.userStatus || data.statusByUid?.[targetUid] || data;
        const normalized = normalizeTwoFactorSummary({
          totpEnabled: Boolean(s.totpEnabled),
          email2faEnabled: Boolean(s.email2faEnabled),
          twoFactorEnabled: Boolean(s.twoFactorEnabled ?? (s.totpEnabled || s.email2faEnabled)),
          recoveryPending: Boolean(s.recoveryPending),
          recoveryRequestedAt: s.recoveryRequestedAt ? Number(s.recoveryRequestedAt) : null,
          recoveryDisableAt: s.recoveryDisableAt ? Number(s.recoveryDisableAt) : null,
          backupCodesRemaining: Number(s.backupCodesRemaining ?? s.remainingBackupCodes ?? 0),
          trustedDevicesCount: Number(s.trustedDevicesCount ?? 0),
          lastChangedAt: s.lastChangedAt
            ? Number(s.lastChangedAt)
            : s.updatedAt
            ? Number(s.updatedAt)
            : null,
          badgeLabel: s.badgeLabel,
        });
        setTwoFactorStatus(normalized);
        updateCachedAdminUser2fa(targetUid, normalized);
        onUpdate2faStatus?.(targetUid, normalized);

        setSecurityAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
        setCanManage2fa(Boolean(data.canManage2fa ?? isSuperAdmin));
        setCanModifyTarget2fa(
          data.canModifyTarget !== undefined
            ? Boolean(data.canModifyTarget)
            : Boolean(isSuperAdmin && auth.currentUser?.uid !== targetUid)
        );
        setTargetIsSuperAdmin2fa(Boolean(data.targetIsSuperAdmin));
        setTargetIsSelf2fa(Boolean(data.targetIsSelf || auth.currentUser?.uid === targetUid));
        setCallerHas2fa(Boolean(data.callerHas2fa));
      }
    } catch (err) {
      console.warn('[UserOverrideDrawer] Background 2FA detail refresh warning:', err);
    }
  }, [targetUid, targetIsGuest, isSuperAdmin, onUpdate2faStatus]);

  useEffect(() => {
    void fetchUser2faDetails();
  }, [fetchUser2faDetails]);

  const isDirty = useMemo(() => {
    if (role !== baselineRole) return true;
    if (plan !== baselinePlan) return true;
    if (selectedPlan !== baselineSelectedPlan) return true;
    if (planTouched) return true;
    if (plan === 'pro' && extendMonths > 0) return true;
    if (isSuspended !== baselineSuspended) return true;
    return false;
  }, [
    role,
    baselineRole,
    plan,
    baselinePlan,
    selectedPlan,
    baselineSelectedPlan,
    planTouched,
    extendMonths,
    isSuspended,
    baselineSuspended,
  ]);

  const open2faActionModal = (action: Admin2faActionType) => {
    if (!canResetSecurity) {
      setRequestAccessModal({
        permission: 'security.reset',
        actionLabel: `Reset 2FA / Security (${action}) for ${user?.displayName || user?.email || 'user'}`,
      });
      return;
    }
    setPending2faAction(action);
    setAdmin2faReason('');
    setAdmin2faIdentityVerified(false);
    setAdmin2faPassword('');
    setAdmin2faCode('');
    setAdmin2faModalError(null);
  };

  const handleExecute2faAction = async () => {
    if (!user || !pending2faAction || submitting2faAction) return;
    if (admin2faReason.trim().length < 3) {
      setAdmin2faModalError('A reason is required before running this security action.');
      return;
    }
    if (!admin2faIdentityVerified) {
      setAdmin2faModalError(
        "Please tick the identity checklist (\"I verified the person's identity by another method\")."
      );
      return;
    }
    if (!admin2faPassword.trim()) {
      setAdmin2faModalError('Please re-enter your admin password to confirm.');
      return;
    }
    if (callerHas2fa && !admin2faCode.trim()) {
      setAdmin2faModalError(
        'Your admin account has two-step verification enabled. Please enter your 6-digit authenticator or 2FA code.'
      );
      return;
    }

    setSubmitting2faAction(true);
    setAdmin2faModalError(null);
    setError(null);
    setVerifiedNotice(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/auth/admin/reset-2fa', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: pending2faAction,
          targetUid: user.uid,
          targetEmail: user.email || '',
          reason: admin2faReason.trim(),
          identityVerified: admin2faIdentityVerified,
          checklist: ["I verified the person's identity by another method"],
          adminPassword: admin2faPassword,
          adminTwoFactorCode: admin2faCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setAdmin2faModalError(data?.error || 'Could not complete two-step verification action.');
      } else {
        setPending2faAction(null);
        refreshActiveGrants().catch(() => {});
        await fetchUser2faDetails();
        const noticeMap: Record<Admin2faActionType, string> = {
          reset:
            'Two-step verification reset (all 2FA methods, backup codes, trusted devices, and active sessions cleared; user notified by email).',
          approve_recovery:
            'Pending recovery approved immediately (two-step verification reset and user notified by email).',
          cancel_recovery:
            'Pending 24-hour recovery request cancelled (logged in security history and user notified by email).',
          enable_email_2fa:
            'Email code verification turned on for this user (logged in security history and user notified by email).',
        };
        setVerifiedNotice(noticeMap[pending2faAction]);
        showApiToast(noticeMap[pending2faAction], 'success');
        onSuccess();
      }
    } catch {
      setAdmin2faModalError('Network error while executing two-step verification action.');
    } finally {
      setSubmitting2faAction(false);
    }
  };

  if (!user) return null;

  const displayName = getUserDisplayName(user);
  const userInitial = (displayName || user.email || 'U').charAt(0).toUpperCase();

  const handleApplyOverrides = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setError(null);
    setVerifiedNotice(null);

    try {
      const updates: Partial<UserProfile> & { extendMonths?: number } = {
        role: role as UserRole,
        plan,
        suspended: isSuspended,
        isSuspended: isSuspended,
        extendMonths,
      };

      if (plan === 'pro') {
        updates.isPremium = true;
        updates.premiumSource = 'admin_override';

        const currentExpDate = parseExpiryDate(user.planExpiresAt || user.premiumExpiresAt);
        const isCurrentActive = currentExpDate && currentExpDate.getTime() > Date.now();

        let targetMillis: number;
        if (selectedPlan === 'annual') {
          const baseTime =
            isCurrentActive && baselinePlan === 'pro'
              ? currentExpDate.getTime()
              : Date.now();
          targetMillis = baseTime + 365 * 24 * 60 * 60 * 1000;
          updates.extendMonths = 12;
        } else if (selectedPlan === 'custom') {
          const safeDays = Math.max(1, Math.min(1825, Math.round(Number(customDays) || 30)));
          const baseTime =
            isCurrentActive && baselinePlan === 'pro'
              ? currentExpDate.getTime()
              : Date.now();
          targetMillis = baseTime + safeDays * 24 * 60 * 60 * 1000;
          updates.extendMonths = Math.max(1, Math.round(safeDays / 30));
        } else if (extendMonths > 0) {
          const baseTime =
            isCurrentActive && baselinePlan === 'pro'
              ? currentExpDate.getTime()
              : Date.now() + 30 * 24 * 60 * 60 * 1000;
          targetMillis =
            isCurrentActive && baselinePlan === 'pro'
              ? baseTime + extendMonths * 30 * 24 * 60 * 60 * 1000
              : Date.now() + (1 + extendMonths) * 30 * 24 * 60 * 60 * 1000;
        } else {
          if (!isCurrentActive || baselinePlan !== 'pro' || planTouched) {
            targetMillis = Date.now() + 30 * 24 * 60 * 60 * 1000;
          } else {
            targetMillis = currentExpDate.getTime();
          }
        }

        const exp = Timestamp.fromMillis(targetMillis);
        updates.premiumExpiresAt = exp;
        updates.planExpiresAt = exp;
      } else {
        updates.isPremium = false;
        updates.premiumSource = null;
        updates.premiumExpiresAt = null;
        updates.planExpiresAt = null;
      }

      const previous: Partial<UserProfile> = {
        role: user.role,
        plan: user.plan,
        isPremium: user.isPremium,
        suspended: user.suspended,
        isSuspended: user.isSuspended,
        targetUniversity: user.targetUniversity,
        targetTestDate: user.targetTestDate,
        planExpiresAt: user.planExpiresAt,
        premiumExpiresAt: user.premiumExpiresAt,
      };

      const updatedProfile = await updateUserOverride(
        adminEmail,
        user.uid,
        user.email,
        updates,
        previous
      );
      refreshActiveGrants().catch(() => {});

      const resolvedPlan: UserPlan =
        updatedProfile.plan === 'pro' || updatedProfile.isPremium ? 'pro' : 'free';
      const resolvedRole = normalizeCanonicalRole(updatedProfile.role);
      const resolvedSusp = Boolean(updatedProfile.suspended || updatedProfile.isSuspended);
      const resolvedPreset: SelectedPlanPreset =
        resolvedPlan === 'pro'
          ? selectedPlan === 'free'
            ? 'monthly'
            : selectedPlan
          : 'free';

      setPlan(resolvedPlan);
      setSelectedPlan(resolvedPreset);
      setBaselineSelectedPlan(resolvedPreset);
      setPlanTouched(false);
      setRole(resolvedRole);
      setIsSuspended(resolvedSusp);
      setExtendMonths(0);

      setBaselinePlan(resolvedPlan);
      setBaselineRole(resolvedRole);
      setBaselineSuspended(resolvedSusp);

      onUserUpdated?.(updatedProfile);

      const newExpDate =
        resolvedPlan === 'pro'
          ? parseExpiryDate(
              updatedProfile.planExpiresAt ||
                updatedProfile.premiumExpiresAt ||
                updates.planExpiresAt
            )
          : null;
      const formattedExp = newExpDate
        ? newExpDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null;

      const planLabelForNotice =
        resolvedPreset === 'annual'
          ? 'Annual Pro'
          : resolvedPreset === 'custom'
            ? `Custom Pro (+${customDays}d)`
            : 'Monthly Pro';

      const successText =
        resolvedPlan === 'pro'
          ? `Saved changes: ${planLabelForNotice} active until ${formattedExp || '30 days'}`
          : 'Saved changes: Plan set to Free';

      setVerifiedNotice(successText);
      showApiToast(successText, 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Unable to save changes. Please try again.';
      setError(msg);
      showApiToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPlanPreset = (preset: SelectedPlanPreset) => {
    const nextPlan: UserPlan = preset === 'free' ? 'free' : 'pro';
    const actionNames: Record<SelectedPlanPreset, string> = {
      monthly: 'Monthly Pro (30d)',
      annual: 'Annual Pro (365d)',
      custom: 'Custom Pro',
      free: 'Revoke / Free',
    };
    if (!canChangePlan) {
      setRequestAccessModal({
        permission: 'users.plan',
        actionLabel: `Change subscription plan to ${actionNames[preset]} for ${displayName}`,
      });
      return;
    }
    setSelectedPlan(preset);
    setPlan(nextPlan);
    setPlanTouched(true);
    if (preset === 'free') {
      setExtendMonths(0);
    } else if (preset === 'monthly') {
      setExtendMonths(0);
    } else if (preset === 'annual') {
      setExtendMonths(12);
    } else if (preset === 'custom') {
      setExtendMonths(1);
    }
  };

  const handleInitiateRoleChange = (newRole: CanonicalUserRole) => {
    if (newRole === 'super_admin') {
      showApiToast('Nobody can grant superAdmin from the app. superAdmin is reserved for OWNER_EMAIL.', 'error');
      return;
    }
    if (!canChangeRole) {
      setRequestAccessModal({
        permission: 'users.role',
        actionLabel: `Assign role "${newRole}" to ${displayName}`,
      });
      return;
    }
    if (newRole === role) return;
    setPendingRole(newRole);
    setConfirmAction('role');
  };

  const handleConfirmRoleChange = () => {
    if (pendingRole) {
      setRole(pendingRole);
    }
    setConfirmAction(null);
    setPendingRole(null);
  };

  const handleInitiateSuspend = () => {
    if (!canSuspendUser) {
      setRequestAccessModal({
        permission: 'users.suspend',
        actionLabel: `${isSuspended ? 'Unsuspend' : 'Suspend'} user ${displayName}`,
      });
      return;
    }
    setConfirmAction('suspend');
  };

  const handleConfirmSuspend = () => {
    setIsSuspended((prev) => !prev);
    setConfirmAction(null);
  };

  const handleInitiateDelete = () => {
    if (!canDeleteUser) {
      setRequestAccessModal({
        permission: 'users.delete',
        actionLabel: `Permanently delete account ${displayName}`,
      });
      return;
    }
    setConfirmAction('delete');
  };

  const handleConfirmDelete = async () => {
    if (!canDeleteUser) return;
    setDeleteInProgress(true);
    setError(null);
    try {
      const result = await deleteUserAccount(adminEmail, user.uid, user.email);
      refreshActiveGrants().catch(() => {});
      setConfirmAction(null);
      showApiToast(`Deleted account for ${displayName}.`, 'success');
      onSuccess();
      if (result && !result.firebaseAuthDeleted && result.warning) {
        setError(
          `Firestore & Cloudflare D1 records wiped. Firebase Auth notice: ${result.warning}`
        );
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to delete user';
      setError(msg);
      showApiToast(msg, 'error');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Nobody can grant superAdmin from the app; only show super_admin pill if target is already super_admin
  const visibleRoleOptions = SYSTEM_ROLE_SELECTOR_ORDER.filter((opt) => {
    if (opt.key === 'super_admin') {
      return role === 'super_admin';
    }
    return true;
  });

  const selectedRoleOption =
    SYSTEM_ROLE_SELECTOR_ORDER.find((opt) => opt.key === role) ||
    SYSTEM_ROLE_SELECTOR_ORDER[0];

  return (
    <div
      data-testid="user-override-drawer"
      data-admin-sheet="user-override"
      className="fixed inset-0 z-[10010] flex items-end md:items-stretch md:justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 overlay-blur bg-black/70 backdrop-blur-md"
        onClick={() => !saving && onClose()}
      />

      {/* Flex Column Sheet: Fixed Header + Quick-Jump Chips + Scrollable Body + Sticky Footer using 100dvh */}
      <div className="relative w-full md:max-w-[720px] max-h-[100dvh] h-[100dvh] bg-[var(--card)] border-t md:border-t-0 md:border-l border-[var(--border)] rounded-t-[24px] md:rounded-none flex flex-col z-10 overflow-hidden shadow-2xl">
        {/* Mobile grab handle */}
        <div className="md:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-2.5 shrink-0" />

        {/* 1. FIXED HEADER */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-col gap-2.5 shrink-0 bg-[var(--card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[15px] text-[var(--text)] shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] truncate">
                    {displayName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-[var(--border)] bg-[var(--card-2)] text-[var(--muted)] shrink-0">
                    {selectedRoleOption.shortLabel}
                  </span>
                </div>
                <p className="font-heading text-[12px] text-[var(--muted)] truncate">
                  {isSuperAdmin ? user.email || 'No email' : maskEmail(user.email)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer shrink-0"
              aria-label="Close user detail sheet"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick-Jump Section Chips */}
          <div
            data-testid="user-override-quick-jump-chips"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5"
          >
            {(
              [
                { id: 'plan', label: 'Plan' },
                { id: 'role', label: 'Role' },
                { id: 'attempts', label: 'Attempts' },
                ...(!targetIsGuest ? [{ id: 'security', label: 'Security' } as const] : []),
              ] as const
            ).map((chip) => {
              const isActive = activeJumpChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  data-testid={`user-override-jump-${chip.id}`}
                  onClick={() => scrollToSection(chip.id, 'smooth')}
                  className={`px-3 py-1 rounded-full text-[11px] font-heading font-semibold border transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#D71921] bg-[#D71921]/15 text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SCROLLABLE BODY (padded for sticky footer + safe-area-inset-bottom) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pt-4 pb-[calc(92px+env(safe-area-inset-bottom,0px))] space-y-5"
        >
          {error && (
            <div
              data-testid="user-override-error"
              className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-[12px] font-heading flex items-start gap-2"
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {verifiedNotice && (
            <div
              data-testid="user-override-success"
              className="p-3 rounded-[12px] bg-[var(--card-2)] border border-emerald-500/50 text-emerald-400 text-[12px] font-heading flex items-start gap-2"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{verifiedNotice}</span>
            </div>
          )}

          {/* SECTION 1: ACCOUNT INFO */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Account info
            </h3>
            <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5 text-[12px] font-heading">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted)]">Subscription</span>
                <span
                  data-testid="user-current-subscription-label"
                  className="text-[var(--text)] font-semibold text-right"
                >
                  {formatPlanExpiry(
                    plan,
                    plan === 'pro'
                      ? user.planExpiresAt || user.premiumExpiresAt
                      : null
                  )}
                </span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--muted)]">User ID</span>
                  <span className="text-[var(--text)] font-mono text-[11px] truncate max-w-[220px]">
                    {user.uid}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted)]">Account status</span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                    isSuspended
                      ? 'border-[var(--red)] text-[var(--red)]'
                      : 'border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
            </div>

            {/* Study Squad • Crew Roster */}
            <div className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5 text-[12px] font-heading">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-[#D71921]" />
                  <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px]">
                    Study Squad &bull; Crew
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BoardlyAvatar
                    uid={user.uid}
                    equippedAvatar={user.equipped?.avatar || user.avatar}
                    name={user.displayName || user.email}
                    size={24}
                    className="shrink-0"
                  />
                  <span className="text-[11px] font-mono text-[var(--muted)]">
                    {user.streak || 0}d streak
                  </span>
                </div>
              </div>

              {loadingCrew ? (
                <LineLoader context="admin" variant="inline" />
              ) : userCrew ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Crew Name</span>
                    <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                      <span>{userCrew.name}</span>
                      <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-white/10 text-white/80">
                        {userCrew.code}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Crew Tier</span>
                    <span className="text-[var(--text)] font-semibold">
                      {userCrew.tier === 'paid' && isCrewPaidActive(userCrew.paid_until) ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <Sparkles size={11} /> Large Crew (Pro Shared)
                        </span>
                      ) : (
                        <span>Free Crew (Limit 5)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/admin/crews');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--surface-hover)] hover:bg-neutral-800 border border-[var(--border)] text-[11px] text-[var(--text)] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      <span>View Crew</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setRemovingFromCrew(true);
                        try {
                          await removeMemberFromCrew(userCrew.id, user.uid, {
                            uid: user.uid,
                            email: adminEmail,
                            isAdmin: true,
                          });
                          setUserCrew(null);
                          setVerifiedNotice(`Removed ${displayName} from crew.`);
                          onSuccess();
                        } catch (err: unknown) {
                          setError(
                            err instanceof Error ? err.message : 'Failed to remove from crew'
                          );
                        } finally {
                          setRemovingFromCrew(false);
                        }
                      }}
                      disabled={removingFromCrew}
                      className="py-1.5 px-3 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/20 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <UserMinus size={12} />
                      <span>{removingFromCrew ? 'Removing...' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[var(--muted)] flex items-center justify-between">
                  <span>Not enrolled in any study crew.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/admin/crews');
                    }}
                    className="text-[#D71921] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>Browse Crews</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: SUBSCRIPTION PLAN */}
          <section ref={planSectionRef} className="space-y-2 pt-1 border-t border-[var(--border)] scroll-mt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Subscription plan
              </h3>
              <span className="text-[11px] font-heading text-[var(--muted)]">
                {selectedPlan === 'annual'
                  ? '365 days access'
                  : selectedPlan === 'custom'
                    ? `+${customDays} days access`
                    : selectedPlan === 'monthly'
                      ? '30 days / month'
                      : 'No recurring fee'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="plan-option-pro"
                aria-pressed={selectedPlan === 'monthly'}
                onClick={() => handleSelectPlanPreset('monthly')}
                className={`py-2.5 px-3 rounded-[12px] border text-[13px] font-heading font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'border-[#D71921] bg-[#D71921]/20 text-white ring-2 ring-[#D71921]/45 shadow-[0_0_16px_rgba(215,25,33,0.25)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {!canChangePlan && <Lock size={12} className="text-amber-400" />}
                <span>Monthly Pro</span>
              </button>
              <button
                type="button"
                data-testid="plan-option-annual"
                aria-pressed={selectedPlan === 'annual'}
                onClick={() => handleSelectPlanPreset('annual')}
                className={`py-2.5 px-3 rounded-[12px] border text-[13px] font-heading font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlan === 'annual'
                    ? 'border-[#D71921] bg-[#D71921]/20 text-white ring-2 ring-[#D71921]/45 shadow-[0_0_16px_rgba(215,25,33,0.25)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {!canChangePlan && <Lock size={12} className="text-amber-400" />}
                <span>Annual Pro</span>
              </button>
              <button
                type="button"
                data-testid="plan-option-custom"
                aria-pressed={selectedPlan === 'custom'}
                onClick={() => handleSelectPlanPreset('custom')}
                className={`py-2.5 px-3 rounded-[12px] border text-[13px] font-heading font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlan === 'custom'
                    ? 'border-[#D71921] bg-[#D71921]/20 text-white ring-2 ring-[#D71921]/45 shadow-[0_0_16px_rgba(215,25,33,0.25)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {!canChangePlan && <Lock size={12} className="text-amber-400" />}
                <span>Custom</span>
              </button>
              <button
                type="button"
                data-testid="plan-option-free"
                aria-pressed={selectedPlan === 'free'}
                onClick={() => handleSelectPlanPreset('free')}
                className={`py-2.5 px-3 rounded-[12px] border text-[13px] font-heading font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlan === 'free'
                    ? 'border-[#D71921] bg-[#D71921]/20 text-white ring-2 ring-[#D71921]/45 shadow-[0_0_16px_rgba(215,25,33,0.25)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {!canChangePlan && <Lock size={12} className="text-amber-400" />}
                <span>Revoke / Free</span>
              </button>
            </div>

            {plan === 'pro' && (
              <div className="mt-2 p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading text-[var(--muted)]">
                    {selectedPlan === 'custom' ? 'Custom duration (days)' : 'Extend by'}
                  </span>
                  <span className="text-[11px] font-heading text-[var(--red)] font-semibold">
                    {selectedPlan === 'annual'
                      ? '365 days (1 Year)'
                      : selectedPlan === 'custom'
                        ? `+${customDays} days`
                        : extendMonths === 0
                          ? 'Standard (30 days)'
                          : `+${extendMonths * 30} days`}
                  </span>
                </div>
                {selectedPlan === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1825}
                      value={customDays}
                      onChange={(e) => {
                        setCustomDays(Math.max(1, Number(e.target.value) || 30));
                        setPlanTouched(true);
                      }}
                      className="w-full px-3 py-1.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-mono text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1.5">
                  {([0, 1, 2, 3] as const).map((months) => (
                    <button
                      key={months}
                      type="button"
                      data-testid={`plan-extend-${months}`}
                      onClick={() => {
                        setExtendMonths(months);
                        if (selectedPlan === 'custom' && months > 0) {
                          setCustomDays(months * 30);
                        }
                        setPlanTouched(true);
                      }}
                      className={`py-1.5 px-2 rounded-[8px] border text-[11px] font-heading font-medium transition-colors cursor-pointer ${
                        extendMonths === months && selectedPlan !== 'annual'
                          ? 'border-[var(--red)] bg-[var(--red)] text-white font-semibold'
                          : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {months === 0 ? 'Standard' : `+${months} mo`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--muted)] font-heading">
                  {selectedPlan === 'annual'
                    ? 'Grants 365 days (1 full year) of Pro access.'
                    : selectedPlan === 'custom'
                      ? `Grants +${customDays} days of custom Pro access.`
                      : extendMonths === 0
                        ? 'Sets plan to Pro with 30 days of active access.'
                        : `Extends Pro expiry by +${extendMonths * 30} days (${extendMonths} month${
                            extendMonths > 1 ? 's' : ''
                          }).`}
                </p>
              </div>
            )}
          </section>

          {/* SECTION 3: SYSTEM ROLE */}
          <section ref={roleSectionRef} className="space-y-2.5 pt-1 border-t border-[var(--border)] scroll-mt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                System role
              </h3>
              {!isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-heading text-amber-400">
                  <Lock size={11} />
                  <span>Super Admin only</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleRoleOptions.map((opt) => {
                const isSelected = role === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    data-testid={`role-option-${opt.key}`}
                    onClick={() => handleInitiateRoleChange(opt.key)}
                    className={`py-2.5 px-3 rounded-[12px] border text-[12px] font-heading font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? opt.key === 'super_admin'
                          ? 'border-[#D71921] bg-[#D71921] text-white'
                          : 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                    } ${!canChangeRole ? 'opacity-70' : ''}`}
                  >
                    {!canChangeRole && <Lock size={11} className="text-amber-400 shrink-0" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Role Description Card */}
            <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text)]">
                  {selectedRoleOption.label}
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">
                  key: {selectedRoleOption.key}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                {selectedRoleOption.description}
              </p>
            </div>
          </section>

          {/* SECTION 4: TEST ATTEMPTS */}
          <section ref={attemptsSectionRef} className="space-y-2 pt-1 border-t border-[var(--border)] scroll-mt-3">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Test attempts
            </h3>
            {loadingAttempts ? (
              <div className="p-2 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
                <LineLoader context="admin" variant="inline" />
              </div>
            ) : attemptsError ? (
              <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-2 text-[12px] font-heading text-[var(--muted)]">
                <span>Couldn&apos;t load test attempts</span>
                <button
                  type="button"
                  onClick={() => user?.uid && loadRecentAttemptsForUid(user.uid)}
                  className="px-2.5 py-1 rounded-[10px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-[11px] font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : recentAttempts.length === 0 ? (
              <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] text-center text-[12px] font-heading text-[var(--muted)]">
                No recorded test attempts
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentAttempts.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between text-[12px] font-heading"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock size={13} className="text-[var(--muted)] shrink-0" />
                      <span className="text-[var(--text)] font-medium truncate">
                        {att.subject || att.title || 'Practice test'}
                      </span>
                    </div>
                    <span className="text-[var(--muted)] shrink-0 ml-2">
                      {typeof att.score === 'number'
                        ? `${att.score}/${att.totalQuestions || 20}`
                        : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 5: SECURITY (2FA) */}
          {!user.isGuest && user.accountType !== 'guest' && (
            <section ref={securitySectionRef} className="pt-1 border-t border-[var(--border)] space-y-3 scroll-mt-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-semibold text-[var(--muted)]">
                  <Shield size={13} className="text-[var(--muted)]" />
                  <span>Security (2FA)</span>
                </h3>
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                    twoFactorStatus.badgeLabel === 'Recovery pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold'
                      : twoFactorStatus.badgeLabel !== 'Off'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                      : 'border-[var(--border)] text-[var(--muted)]'
                  }`}
                >
                  2FA: {twoFactorStatus.badgeLabel}
                </span>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5 text-[12px] font-heading">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)]">
                    <span className="block text-[10px] font-mono uppercase text-[var(--muted)]">
                      Authenticator App
                    </span>
                    <span
                      className={`font-mono font-bold text-[12px] ${
                        twoFactorStatus.totpEnabled ? 'text-emerald-400' : 'text-[var(--muted)]'
                      }`}
                    >
                      {twoFactorStatus.totpEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="p-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)]">
                    <span className="block text-[10px] font-mono uppercase text-[var(--muted)]">
                      Email Code
                    </span>
                    <span
                      className={`font-mono font-bold text-[12px] ${
                        twoFactorStatus.email2faEnabled ? 'text-emerald-400' : 'text-[var(--muted)]'
                      }`}
                    >
                      {twoFactorStatus.email2faEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="p-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)]">
                    <span className="block text-[10px] font-mono uppercase text-[var(--muted)]">
                      Backup Codes Left
                    </span>
                    <span className="font-mono font-bold text-[12px] text-[var(--text)]">
                      {twoFactorStatus.backupCodesRemaining}
                    </span>
                  </div>
                  <div className="p-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)]">
                    <span className="block text-[10px] font-mono uppercase text-[var(--muted)]">
                      Trusted Devices
                    </span>
                    <span className="font-mono font-bold text-[12px] text-[var(--text)]">
                      {twoFactorStatus.trustedDevicesCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--border)]/60">
                  <span>Recovery request:</span>
                  <span
                    className={`font-mono ${
                      twoFactorStatus.recoveryPending
                        ? 'text-amber-400 font-semibold'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    {twoFactorStatus.recoveryPending && twoFactorStatus.recoveryDisableAt
                      ? `Pending (${new Date(twoFactorStatus.recoveryDisableAt).toLocaleString(
                          'en-GB'
                        )})`
                      : 'None'}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-[var(--border)] space-y-2">
                  {targetIsSelf2fa || targetIsSuperAdmin2fa ? (
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      Super Admin accounts (including your own) cannot be reset through this panel.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => open2faActionModal('reset')}
                        className="w-full py-2 px-3 rounded-[10px] border border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--card)] text-[12px] font-heading font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        {!canResetSecurity && <Lock size={12} className="text-amber-400" />}
                        <span>Reset two-step verification</span>
                      </button>

                      {twoFactorStatus.recoveryPending && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => open2faActionModal('approve_recovery')}
                            className="py-2 px-2.5 rounded-[10px] border border-emerald-500/40 text-emerald-400 hover:bg-[var(--card)] text-[11px] font-heading font-semibold transition-colors cursor-pointer"
                          >
                            Approve recovery
                          </button>
                          <button
                            type="button"
                            onClick={() => open2faActionModal('cancel_recovery')}
                            className="py-2 px-2.5 rounded-[10px] border border-amber-500/40 text-amber-400 hover:bg-[var(--card)] text-[11px] font-heading font-semibold transition-colors cursor-pointer"
                          >
                            Cancel recovery
                          </button>
                        </div>
                      )}

                      {!twoFactorStatus.email2faEnabled && (
                        <button
                          type="button"
                          onClick={() => open2faActionModal('enable_email_2fa')}
                          className="w-full py-2 px-3 rounded-[10px] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card)] text-[12px] font-heading font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          {!canResetSecurity && <Lock size={12} className="text-amber-400" />}
                          <span>Turn on email code verification</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {securityAuditLogs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Security history ({securityAuditLogs.length})
                  </span>
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                    {securityAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-[10px] border bg-[var(--card-2)] border-[var(--border)] text-[11px] font-heading space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[11px] text-[var(--text)]">
                            {log.eventType}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {new Date(log.createdAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 6: DANGER ZONE (Suspend + Separated Permanent Delete) */}
          <section className="pt-2 border-t border-[var(--border)] space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--red)] font-semibold">
              Danger zone
            </h3>

            {/* Suspend / Unsuspend */}
            <div className="p-3.5 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-bold text-[var(--text)]">
                    {isSuspended ? 'Account is suspended' : 'Suspend user account'}
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    {isSuspended
                      ? 'Unsuspend to restore student access. Click Save changes to persist.'
                      : 'Blocks this user from signing in or taking tests.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="toggle-suspend-btn"
                onClick={handleInitiateSuspend}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                {!canSuspendUser && <Lock size={13} className="text-amber-400" />}
                <span>{isSuspended ? 'Unsuspend account' : 'Suspend account'}</span>
              </button>
            </div>

            {/* Separated Permanent Delete Account */}
            <div className="p-3.5 rounded-[14px] bg-red-500/[0.04] border border-[var(--red)]/30 space-y-2.5">
              <div>
                <div className="text-[12px] font-bold text-[var(--red)]">
                  Permanent account deletion
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Permanently erases this account and all associated records. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                data-testid="delete-account-permanently-btn"
                onClick={handleInitiateDelete}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] border border-[var(--red)]/50 text-[var(--red)] hover:bg-red-500/10 text-[13px] font-heading font-semibold transition-colors cursor-pointer"
              >
                {canDeleteUser ? <Trash2 size={14} /> : <Lock size={13} className="text-amber-400" />}
                <span>Delete account permanently</span>
              </button>
            </div>
          </section>
        </div>

        {/* 3. STICKY FOOTER (Always visible, Save disabled until dirty, shows loading state) */}
        <div
          data-testid="user-override-sticky-footer"
          className="sticky bottom-0 left-0 right-0 px-4 sm:px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-end gap-2.5 shrink-0 z-20"
        >
          <button
            type="button"
            data-testid="user-override-cancel-btn"
            onClick={onClose}
            disabled={saving}
            className="min-h-[42px] px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="user-override-save-btn"
            onClick={handleApplyOverrides}
            disabled={!isDirty || saving}
            className="min-h-[42px] px-5 py-2 rounded-[12px] border border-[#D71921] bg-[#D71921] text-white text-[13px] font-heading font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D71921]/20"
          >
            {saving && <Loader2 size={14} className="animate-spin shrink-0" />}
            <span>{saving ? 'Saving changes...' : 'Save changes'}</span>
          </button>
        </div>
      </div>

      {/* ─── ADMIN 2FA STEP-UP CONFIRMATION MODAL ────────────────────────────── */}
      {pending2faAction && (
        <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
            onClick={() => !submitting2faAction && setPending2faAction(null)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
              {pending2faAction === 'reset' && 'Reset two-step verification?'}
              {pending2faAction === 'approve_recovery' && 'Approve pending recovery now?'}
              {pending2faAction === 'cancel_recovery' && 'Cancel pending recovery request?'}
              {pending2faAction === 'enable_email_2fa' && 'Turn on email code verification?'}
            </h3>

            {admin2faModalError && (
              <div className="p-2.5 rounded-[10px] bg-red-500/10 border border-red-500/30 text-[12px] font-heading text-red-400">
                {admin2faModalError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                  Reason (Required — saved in security audit log)
                </label>
                <textarea
                  rows={2}
                  value={admin2faReason}
                  onChange={(e) => setAdmin2faReason(e.target.value)}
                  placeholder="Describe why this action is needed and how identity was verified..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                />
              </div>

              <label className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={admin2faIdentityVerified}
                  onChange={(e) => setAdmin2faIdentityVerified(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[12px] font-heading text-[var(--text)] leading-snug">
                  I verified the person&apos;s identity by another method
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                  Your Admin Password (Step-up check)
                </label>
                <input
                  type="password"
                  value={admin2faPassword}
                  onChange={(e) => setAdmin2faPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="w-full px-3 py-2 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                />
              </div>

              {callerHas2fa && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                    Your Admin 2FA / Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={admin2faCode}
                    onChange={(e) => setAdmin2faCode(e.target.value)}
                    placeholder="6-digit code or backup code"
                    className="w-full px-3 py-2 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-mono text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submitting2faAction}
                onClick={() => setPending2faAction(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting2faAction}
                onClick={handleExecute2faAction}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold disabled:opacity-50 cursor-pointer"
              >
                {submitting2faAction ? 'Verifying & applying...' : 'Confirm action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION MODALS FOR DESTRUCTIVE ACTIONS ─────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative w-full max-w-[380px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 shadow-2xl">
            {confirmAction === 'role' && (
              <>
                <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                  Change role to{' '}
                  {SYSTEM_ROLE_SELECTOR_ORDER.find((r) => r.key === pendingRole)?.label ||
                    pendingRole}
                  ?
                </h3>
                <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
                  You are about to select the role{' '}
                  <strong className="text-[var(--text)]">
                    {SYSTEM_ROLE_SELECTOR_ORDER.find((r) => r.key === pendingRole)?.label ||
                      pendingRole}
                  </strong>{' '}
                  for {displayName}. Click <strong>Save changes</strong> in the footer to persist.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-role-change-btn"
                    onClick={handleConfirmRoleChange}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold cursor-pointer"
                  >
                    Select role
                  </button>
                </div>
              </>
            )}

            {confirmAction === 'suspend' && (
              <>
                <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                  {isSuspended ? 'Unsuspend account?' : 'Suspend account?'}
                </h3>
                <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
                  {isSuspended
                    ? `This will mark ${displayName} for unsuspension. Click Save changes to apply.`
                    : `This will mark ${displayName} for suspension. Click Save changes to apply.`}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-suspend-btn"
                    onClick={handleConfirmSuspend}
                    className={`px-3.5 py-2 rounded-[12px] border text-[13px] font-heading font-semibold cursor-pointer ${
                      isSuspended
                        ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--red)] bg-[var(--red)] text-white'
                    }`}
                  >
                    {isSuspended ? 'Confirm unsuspend' : 'Confirm suspend'}
                  </button>
                </div>
              </>
            )}

            {confirmAction === 'delete' && (
              <>
                <h3 className="font-heading font-bold text-[16px] text-[var(--red)]">
                  Delete user account permanently?
                </h3>
                <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
                  This action is irreversible. All profile data and permissions for{' '}
                  <strong className="text-[var(--text)]">{displayName}</strong> will be permanently
                  erased.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={deleteInProgress}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-permanent-delete-btn"
                    onClick={handleConfirmDelete}
                    disabled={deleteInProgress}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {deleteInProgress ? 'Deleting...' : 'Delete permanently'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {requestAccessModal && (
        <RequestAccessSheet
          open={Boolean(requestAccessModal)}
          onClose={() => setRequestAccessModal(null)}
          permission={requestAccessModal.permission}
          actionLabel={requestAccessModal.actionLabel}
          targetId={user.uid}
          targetLabel={`${displayName} (${user.uid})`}
        />
      )}
    </div>
  );
}

export default UserOverrideDrawer;
