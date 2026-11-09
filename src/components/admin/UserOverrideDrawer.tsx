import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import type { UserProfile, UserRole, UserPlan } from '@/types';
import {
  updateUserOverride,
  deleteUserAccount,
  fetchUserRecentAttempts,
  getUserDisplayName,
} from '@/services/adminService';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { fetchCrewDetails, removeMemberFromCrew } from '@/services/crewService';
import { isCrewPaidActive } from '@/services/crewBackend';
import { maskEmail } from '@/utils/privacy';
import type { CrewDoc } from '@/types/crew';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { LineLoader } from '@/components/ui/LineLoader';

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
  onClose,
  onSuccess,
}: UserOverrideDrawerProps) {
  const adminEmailLower = adminEmail.toLowerCase().trim();
  const isSuperAdmin = adminEmailLower === 'shsvirtualadmin@gmail.com' || adminEmailLower === 'support@boardly.cfd';

  const [role, setRole] = useState<UserRole>('student');
  const [plan, setPlan] = useState<UserPlan>('free');
  const [extendMonths, setExtendMonths] = useState<0 | 1 | 2 | 3>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttemptItem[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destructive action confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<
    'role' | 'suspend' | 'delete' | null
  >(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    if (user) {
      setRole((user.role as UserRole) || 'student');
      setPlan(user.plan || 'free');
      setExtendMonths(0);
      setIsSuspended(!!(user.suspended || user.isSuspended));
      setError(null);
      setConfirmAction(null);

      // Load recent test attempts
      setLoadingAttempts(true);
      fetchUserRecentAttempts(user.uid, 5)
        .then((attempts) => setRecentAttempts(attempts))
        .catch(() => setRecentAttempts([]))
        .finally(() => setLoadingAttempts(false));

      // Load user crew if joined
      if (user.crewId) {
        setLoadingCrew(true);
        fetchCrewDetails(user.crewId)
          .then((c) => setUserCrew(c))
          .catch(() => setUserCrew(null))
          .finally(() => setLoadingCrew(false));
      } else {
        setUserCrew(null);
      }
    }
  }, [user]);

  const navigate = useNavigate();
  const [userCrew, setUserCrew] = useState<CrewDoc | null>(null);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [removingFromCrew, setRemovingFromCrew] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState<string | null>(null);

  // Two-Step Verification status, Security history & Super Admin 2FA Controls
  type Admin2faActionType = 'reset' | 'approve_recovery' | 'cancel_recovery' | 'enable_email_2fa';
  interface AdminAuditLogEntry {
    id: string;
    userId: string;
    actorId: string;
    eventType: string;
    details: Record<string, any>;
    createdAt: number;
  }

  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    totpEnabled: boolean;
    email2faEnabled: boolean;
    twoFactorEnabled: boolean;
    recoveryPending: boolean;
    recoveryRequestedAt: number | null;
    recoveryDisableAt: number | null;
    backupCodesRemaining: number;
    trustedDevicesCount: number;
    lastChangedAt: number | null;
    badgeLabel: 'Off' | 'Authenticator' | 'Email code' | 'Both' | 'Recovery pending';
  }>({
    totpEnabled: false,
    email2faEnabled: false,
    twoFactorEnabled: false,
    recoveryPending: false,
    recoveryRequestedAt: null,
    recoveryDisableAt: null,
    backupCodesRemaining: 0,
    trustedDevicesCount: 0,
    lastChangedAt: null,
    badgeLabel: 'Off',
  });
  const [securityAuditLogs, setSecurityAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [canManage2fa, setCanManage2fa] = useState<boolean>(false);
  const [canModifyTarget2fa, setCanModifyTarget2fa] = useState<boolean>(false);
  const [targetIsSuperAdmin2fa, setTargetIsSuperAdmin2fa] = useState<boolean>(false);
  const [targetIsSelf2fa, setTargetIsSelf2fa] = useState<boolean>(false);
  const [callerHas2fa, setCallerHas2fa] = useState<boolean>(false);

  // Admin 2FA Confirmation Modal state
  const [pending2faAction, setPending2faAction] = useState<Admin2faActionType | null>(null);
  const [admin2faReason, setAdmin2faReason] = useState<string>('');
  const [admin2faIdentityVerified, setAdmin2faIdentityVerified] = useState<boolean>(false);
  const [admin2faPassword, setAdmin2faPassword] = useState<string>('');
  const [admin2faCode, setAdmin2faCode] = useState<string>('');
  const [admin2faModalError, setAdmin2faModalError] = useState<string | null>(null);
  const [submitting2faAction, setSubmitting2faAction] = useState<boolean>(false);

  const fetchUser2faDetails = useCallback(async () => {
    if (!user || user.isGuest || user.accountType === 'guest') {
      return;
    }
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      if (!idToken) return;
      const res = await fetch(`/api/auth/admin/2fa-status?uid=${encodeURIComponent(user.uid)}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        const s = data.userStatus || data.statusByUid?.[user.uid] || data;
        const totpOn = Boolean(s.totpEnabled);
        const emailOn = Boolean(s.email2faEnabled);
        const recPending = Boolean(s.recoveryPending);
        const badge =
          s.badgeLabel ||
          (recPending && (totpOn || emailOn)
            ? 'Recovery pending'
            : totpOn && emailOn
            ? 'Both'
            : totpOn
            ? 'Authenticator'
            : emailOn
            ? 'Email code'
            : 'Off');
        setTwoFactorStatus({
          totpEnabled: totpOn,
          email2faEnabled: emailOn,
          twoFactorEnabled: Boolean(s.twoFactorEnabled ?? (totpOn || emailOn)),
          recoveryPending: recPending,
          recoveryRequestedAt: s.recoveryRequestedAt ? Number(s.recoveryRequestedAt) : null,
          recoveryDisableAt: s.recoveryDisableAt ? Number(s.recoveryDisableAt) : null,
          backupCodesRemaining: Number(s.backupCodesRemaining ?? s.remainingBackupCodes ?? 0),
          trustedDevicesCount: Number(s.trustedDevicesCount ?? 0),
          lastChangedAt: s.lastChangedAt
            ? Number(s.lastChangedAt)
            : s.updatedAt
            ? Number(s.updatedAt)
            : null,
          badgeLabel: badge,
        });
        setSecurityAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
        setCanManage2fa(Boolean(data.canManage2fa ?? isSuperAdmin));
        setCanModifyTarget2fa(
          data.canModifyTarget !== undefined
            ? Boolean(data.canModifyTarget)
            : Boolean(isSuperAdmin && auth.currentUser?.uid !== user.uid)
        );
        setTargetIsSuperAdmin2fa(Boolean(data.targetIsSuperAdmin));
        setTargetIsSelf2fa(Boolean(data.targetIsSelf || auth.currentUser?.uid === user.uid));
        setCallerHas2fa(Boolean(data.callerHas2fa));
      }
    } catch {
      // Ignore
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    void fetchUser2faDetails();
  }, [fetchUser2faDetails]);

  const open2faActionModal = (action: Admin2faActionType) => {
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
    setSaving(true);
    setError(null);
    setVerifiedNotice(null);

    try {
      const updates: Partial<UserProfile> = {
        role,
        plan,
        suspended: isSuspended,
        isSuspended: isSuspended,
      };

      if (plan === 'pro') {
        updates.isPremium = true;
        updates.premiumSource = 'admin_override';

        const currentExpDate = parseExpiryDate(user.planExpiresAt || user.premiumExpiresAt);
        const isCurrentActive = currentExpDate && currentExpDate.getTime() > Date.now();

        let targetMillis: number;
        if (extendMonths > 0) {
          const baseTime = isCurrentActive ? currentExpDate.getTime() : Date.now();
          targetMillis = baseTime + extendMonths * 30 * 24 * 60 * 60 * 1000;
        } else {
          // Setting Pro (Monthly) sets plan: "pro" and planExpiresAt = now + 30 days
          if (!isCurrentActive || user.plan !== 'pro') {
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

      await updateUserOverride(adminEmail, user.uid, user.email, updates, previous);
      const newExpDate = plan === 'pro' && updates.planExpiresAt ? parseExpiryDate(updates.planExpiresAt) : null;
      const formattedExp = newExpDate
        ? newExpDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

      setVerifiedNotice(
        plan === 'pro'
          ? `Changes saved: Pro (Monthly) active until ${formattedExp || '30 days'}`
          : 'Changes saved: User set to Free tier'
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[UserOverrideDrawer] Failed to update user override:', err);
      }
      setError('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInitiateRoleChange = (newRole: UserRole) => {
    if (!isSuperAdmin) {
      setError('Only Superadmin (shsvirtualadmin@gmail.com) can change user roles.');
      return;
    }
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
    setConfirmAction('suspend');
  };

  const handleConfirmSuspend = () => {
    setIsSuspended((prev) => !prev);
    setConfirmAction(null);
  };

  const handleConfirmDelete = async () => {
    if (!isSuperAdmin) return;
    setDeleteInProgress(true);
    setError(null);
    try {
      const result = await deleteUserAccount(adminEmail, user.uid, user.email);
      setConfirmAction(null);
      onSuccess();
      if (result && !result.firebaseAuthDeleted && result.warning) {
        setError(
          `Firestore & Cloudflare D1 records wiped. Firebase Auth notice: ${result.warning}`
        );
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to delete user');
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Drawer / Bottom sheet container */}
      <div className="relative w-full md:w-[460px] max-h-[90vh] md:max-h-full h-auto md:h-full bg-[var(--card)] border-t md:border-t-0 md:border-l border-[var(--border)] rounded-t-[24px] md:rounded-t-0 flex flex-col z-10 overflow-hidden shadow-2xl">
        {/* Mobile grab handle */}
        <div className="md:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[15px] text-[var(--text)] shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-semibold text-[15px] text-[var(--text)] truncate">
                {displayName}
              </h2>
              <p className="font-heading text-[12px] text-[var(--muted)] truncate">
                {isSuperAdmin ? user.email : maskEmail(user.email)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] text-[12px] font-heading flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {verifiedNotice && (
            <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-emerald-500/50 text-emerald-400 text-[12px] font-heading flex items-start gap-2">
              <span className="shrink-0">✓</span>
              <span>{verifiedNotice}</span>
            </div>
          )}

          {/* User Profile Information */}
          <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5 text-[12px] font-heading">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Subscription</span>
              <span className="text-[var(--text)] font-semibold">
                {formatPlanExpiry(user.plan, user.planExpiresAt || user.premiumExpiresAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">User ID</span>
              <span className="text-[var(--text)] truncate max-w-[220px]">
                {user.uid}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Account status</span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                  isSuspended
                    ? 'border-[var(--red)] text-[var(--red)]'
                    : 'border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                {isSuspended ? 'Suspended' : 'Active'}
              </span>
            </div>
          </div>

          {/* ── Cockpit Crew Block ── */}
          <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-3 text-[12px] font-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-[#D71921]" />
                <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px]">
                  Study Squad &bull; Crew Roster
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BoardlyAvatar
                  uid={user.uid}
                  equippedAvatar={user.equipped?.avatar || user.avatar}
                  name={user.displayName || user.email}
                  size={26}
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
              <div className="space-y-2 pt-1">
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
                  <span className="text-[var(--muted)]">Role in Crew</span>
                  <span className="text-[var(--text)] font-semibold">
                    {userCrew.leaderId === user.uid ? (
                      <span className="text-[#D71921] font-bold">Crew Admin (Leader)</span>
                    ) : (
                      <span>Squad Member</span>
                    )}
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

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Paid Until</span>
                  <span className="text-[var(--text)] font-mono text-[11px]">
                    {userCrew.paid_until
                      ? new Date(userCrew.paid_until).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Never (Free Tier)'}
                  </span>
                </div>

                {/* Read-Only Pro Via Crew Banner (Never written to user subscription) */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-[rgba(255,255,255,0.08)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text)]">Pro via Crew Status</span>
                    {userCrew.tier === 'paid' && isCrewPaidActive(userCrew.paid_until) ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ACTIVE · PRO VIA CREW
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--muted)]">INACTIVE</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                    Read-only: Derived dynamically from active squad status. Never writes to personal user subscription.
                  </p>
                </div>

                {/* Crew Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/admin/crews');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--surface-hover)] hover:bg-neutral-800 border border-[var(--border)] text-[11px] text-[var(--text)] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>View Crew in Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Remove ${displayName} from ${userCrew.name}?`)) return;
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
                        setError(err instanceof Error ? err.message : 'Failed to remove from crew');
                      } finally {
                        setRemovingFromCrew(false);
                      }
                    }}
                    disabled={removingFromCrew}
                    className="py-1.5 px-3 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/20 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <UserMinus size={12} />
                    <span>{removingFromCrew ? 'Removing...' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2 text-[11px] text-[var(--muted)] flex items-center justify-between">
                <span>Not currently enrolled in any study crew.</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/admin/crews');
                  }}
                  className="text-[#D71921] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Browse Crews</span>
                  <ExternalLink size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-heading text-[var(--muted)]">
                Subscription plan
              </label>
              <span className="text-[11px] font-heading text-[var(--muted)]">
                {plan === 'pro' ? '30 days / month' : 'No recurring fee'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlan('free');
                  setExtendMonths(0);
                }}
                className={`py-2 px-3 rounded-[12px] border text-[13px] font-heading font-medium transition-colors ${
                  plan === 'free'
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`py-2 px-3 rounded-[12px] border text-[13px] font-heading font-medium transition-colors ${
                  plan === 'pro'
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Pro (Monthly)
              </button>
            </div>

            {/* Optional Extend by control */}
            {plan === 'pro' && (
              <div className="mt-2.5 p-3 rounded-[12px] bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading text-[var(--muted)]">
                    Extend by
                  </span>
                  {extendMonths > 0 && (
                    <span className="text-[11px] font-heading text-[var(--red)] font-semibold">
                      +{extendMonths * 30} days
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {([0, 1, 2, 3] as const).map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setExtendMonths(months)}
                      className={`py-1.5 px-2 rounded-[8px] border text-[11px] font-heading font-medium transition-colors ${
                        extendMonths === months
                          ? 'border-[var(--red)] bg-[var(--red)] text-white font-semibold'
                          : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {months === 0 ? 'Standard' : `+${months} mo`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--muted)] font-heading">
                  {extendMonths === 0
                    ? 'Sets plan to Pro with 30 days of active access.'
                    : `Extends expiry by ${extendMonths * 30} days (${extendMonths} month${extendMonths > 1 ? 's' : ''}).`}
                </p>
              </div>
            )}
          </div>

          {/* Role Selection (Guarded to Superadmin) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-heading text-[var(--muted)]">
                System role
              </label>
              {!isSuperAdmin && (
                <span className="text-[11px] font-heading text-[var(--red)]">
                  Superadmin only
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['student', 'crew', 'captain', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={() => handleInitiateRoleChange(r)}
                  className={`py-2 px-3 rounded-[12px] border text-[13px] font-heading font-medium capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    role === r
                      ? r === 'admin'
                        ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Test Attempts */}
          <div className="space-y-2">
            <label className="block text-[12px] font-heading text-[var(--muted)]">
              Recent test attempts
            </label>
            {loadingAttempts ? (
              <div className="p-2 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
                <LineLoader context="admin" variant="inline" />
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
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-[var(--muted)]" />
                      <span className="text-[var(--text)] font-medium">
                        {att.subject || att.title || 'Practice test'}
                      </span>
                    </div>
                    <span className="text-[var(--muted)]">
                      {typeof att.score === 'number'
                        ? `${att.score}/${att.totalQuestions || 20}`
                        : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security (Two-Step Verification & Security History) */}
          {!user.isGuest && user.accountType !== 'guest' && (
            <div className="pt-2 border-t border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[12px] font-heading font-semibold text-[var(--text)]">
                  <Shield size={14} className="text-[var(--muted)]" />
                  <span>Security (Two-Step Verification)</span>
                </label>
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
                      twoFactorStatus.recoveryPending ? 'text-amber-400 font-semibold' : 'text-[var(--muted)]'
                    }`}
                  >
                    {twoFactorStatus.recoveryPending && twoFactorStatus.recoveryDisableAt
                      ? `Pending (takes effect ${new Date(
                          twoFactorStatus.recoveryDisableAt
                        ).toLocaleString('en-GB')})`
                      : 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>Last changed:</span>
                  <span className="font-mono text-[var(--text)]">
                    {twoFactorStatus.lastChangedAt
                      ? new Date(twoFactorStatus.lastChangedAt).toLocaleString('en-GB')
                      : 'Never'}
                  </span>
                </div>

                {/* Super Admin Controls for Users Who Lost Access */}
                {(isSuperAdmin || canManage2fa) && (
                  <div className="pt-2.5 border-t border-[var(--border)] space-y-2">
                    {targetIsSelf2fa || targetIsSuperAdmin2fa || !canModifyTarget2fa ? (
                      <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                        Super admin accounts (including your own) cannot be reset or modified through this panel. Use your own Security settings or the manual Cloudflare D1 console recovery steps.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => open2faActionModal('reset')}
                            className="w-full py-2 px-3 rounded-[10px] border border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--card)] text-[12px] font-heading font-semibold transition-colors cursor-pointer text-center"
                          >
                            Reset two-step verification
                          </button>

                          {twoFactorStatus.recoveryPending && (
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => open2faActionModal('approve_recovery')}
                                className="py-2 px-2.5 rounded-[10px] border border-emerald-500/40 text-emerald-400 hover:bg-[var(--card)] text-[11px] font-heading font-semibold transition-colors cursor-pointer"
                              >
                                Approve pending recovery now
                              </button>
                              <button
                                type="button"
                                onClick={() => open2faActionModal('cancel_recovery')}
                                className="py-2 px-2.5 rounded-[10px] border border-amber-500/40 text-amber-400 hover:bg-[var(--card)] text-[11px] font-heading font-semibold transition-colors cursor-pointer"
                              >
                                Cancel pending recovery
                              </button>
                            </div>
                          )}

                          {!twoFactorStatus.email2faEnabled && (
                            <button
                              type="button"
                              onClick={() => open2faActionModal('enable_email_2fa')}
                              className="w-full py-2 px-3 rounded-[10px] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card)] text-[12px] font-heading font-medium transition-colors cursor-pointer text-center"
                            >
                              Turn on email code verification
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-faint)] leading-relaxed">
                          Admins cannot turn on an authenticator app for someone else because that would expose the user&apos;s secret.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Security History (Newest First, including failed-attempt bursts) */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Security history ({securityAuditLogs.length})
                </span>
                {securityAuditLogs.length === 0 ? (
                  <p className="text-[11px] font-heading text-[var(--text-faint)] py-2 px-3 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)]">
                    No security history events recorded for this user.
                  </p>
                ) : (
                  <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1">
                    {securityAuditLogs.map((log) => {
                      const isBurst = log.eventType === 'failed_attempt_burst';
                      const isAdminEvent = log.eventType.startsWith('admin_2fa_');
                      return (
                        <div
                          key={log.id}
                          className={`p-2.5 rounded-[10px] border text-[11px] font-heading space-y-1 ${
                            isBurst
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : isAdminEvent
                              ? 'bg-amber-500/5 border-amber-500/30 text-[var(--text)]'
                              : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-[11px]">
                              {log.eventType}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--muted)]">
                              {new Date(log.createdAt).toLocaleString('en-GB')}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--muted)] flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>Actor: {log.details?.adminEmail || log.actorId || log.userId}</span>
                            {log.details?.attempts && (
                              <span>Failed attempts: {log.details.attempts}</span>
                            )}
                          </div>
                          {log.details?.reason && (
                            <p className="text-[11px] text-[var(--text)] pt-0.5">
                              Reason: <span className="font-medium">{String(log.details.reason)}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <label className="block text-[12px] font-heading text-[var(--muted)]">
              Account actions
            </label>

            {/* Suspend / Unsuspend */}
            <button
              type="button"
              onClick={handleInitiateSuspend}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
            >
              <span>{isSuspended ? 'Unsuspend account' : 'Suspend account'}</span>
            </button>

            {/* Delete Account (Superadmin only) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setConfirmAction('delete')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] border border-[var(--red)]/40 text-[var(--red)] hover:bg-[var(--card-2)] text-[13px] font-heading transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete account permanently</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyOverrides}
            disabled={saving}
            className="px-5 py-2.5 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Apply changes'}
          </button>
        </div>
      </div>

      {/* ─── ADMIN 2FA STEP-UP CONFIRMATION MODAL ────────────────────────────── */}
      {pending2faAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
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

            <p className="font-heading text-[12px] text-[var(--muted)] leading-relaxed">
              {pending2faAction === 'reset' &&
                `This will turn off authenticator and email 2FA for ${displayName}, delete all backup codes and pending challenges, revoke all trusted devices, and sign out their active sessions in one atomic batch.`}
              {pending2faAction === 'approve_recovery' &&
                `This will immediately complete ${displayName}'s pending 24-hour recovery request, reset their 2FA, and sign out all active sessions and trusted devices.`}
              {pending2faAction === 'cancel_recovery' &&
                `This will stop ${displayName}'s pending 24-hour self-recovery request and keep their existing two-step verification active.`}
              {pending2faAction === 'enable_email_2fa' &&
                `This will turn on email code verification for ${displayName} using their verified email address (${user.email || 'verified email'}).`}
            </p>

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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 overlay-blur bg-black/60 backdrop-blur-md"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative w-full max-w-[380px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 shadow-2xl">
            {confirmAction === 'role' && (
              <>
                <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                  Change role to {pendingRole}?
                </h3>
                <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
                  You are about to assign the role <strong className="text-[var(--text)] capitalize">{pendingRole}</strong> to {displayName}. This modifies user access privileges.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRoleChange}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold"
                  >
                    Confirm change
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
                    ? `This will restore student cockpit access for ${displayName}.`
                    : `This will immediately block ${displayName} from signing into the Boardly student cockpit.`}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSuspend}
                    className={`px-3.5 py-2 rounded-[12px] border text-[13px] font-heading font-semibold ${
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
                  This action is irreversible. All profile data and permissions for <strong className="text-[var(--text)]">{displayName}</strong> will be erased from Firestore.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={deleteInProgress}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteInProgress}
                    className="px-3.5 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold disabled:opacity-50"
                  >
                    {deleteInProgress ? 'Deleting...' : 'Delete permanently'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserOverrideDrawer;
