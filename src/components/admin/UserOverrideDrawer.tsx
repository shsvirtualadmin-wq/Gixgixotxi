import { useState, useEffect } from 'react';
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
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { fetchCrewDetails, removeMemberFromCrew } from '@/services/crewService';
import { isCrewPaidActive } from '@/services/crewBackend';
import { maskEmail } from '@/utils/privacy';
import type { CrewDoc } from '@/types/crew';
import { Timestamp } from 'firebase/firestore';
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
      setRole(user.role || 'student');
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
                <MatrixAvatar
                  avatarKey={user.avatarKey}
                  variant={user.avatarVariant}
                  seed={user.uid}
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
