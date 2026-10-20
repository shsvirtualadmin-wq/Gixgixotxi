import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  GraduationCap,
  Sparkles,
  Edit3,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { AvatarPicker } from '@/lib/matrixAvatars';
import { getDefaultAvatar, type MatrixAvatarVariant } from '@/lib/matrixAvatarsData';
import { useWallet } from '@/hooks/useWallet';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  CosmeticNameplate,
  ProfileCardEffect,
} from '@/components/koban/CosmeticRenderers';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { KobanIcon } from '@/components/koban/KobanIcon';

export function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const {
    profile,
    university,
    targetExam,
    testDate,
    track,
    subjects,
    daysLeft,
    profileCompleted,
    updateProfileData,
    retryFetch,
  } = useUserProfile();

  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const defaultAvatar = getDefaultAvatar(user?.uid);
  const currentAvatarKey = profile?.avatarKey || defaultAvatar.key;
  const currentAvatarVariant = ((profile?.avatarVariant as MatrixAvatarVariant) || defaultAvatar.variant);

  const effectivePlan = useEffectivePlan();
  const { equipped, balance } = useWallet();
  const isPro = effectivePlan.isUnlimited;
  const role = profile?.role || (isAdmin ? 'superadmin' : 'student');
  const rawName =
    profile?.displayName ||
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  const handleStartEditName = () => {
    setDisplayNameInput(rawName);
    setIsEditingName(true);
    setSaveSuccess(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    setIsSavingName(true);
    try {
      await updateProfileData({ displayName: displayNameInput.trim() });
      setIsEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[ProfilePage] Failed to save display name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const resolvedExam = targetExam || university || 'Not set yet';
  const resolvedTrack = track ? track.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Not set yet';

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="badge-pill mb-2">Student Account</span>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            My Profile &amp; Target Setup
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Your university entrance examination target, test countdown, and subscription plan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Edit3 size={14} />
            <span>Edit Target Exam</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={retryFetch}
            className="text-xs text-[var(--muted)] hover:text-white"
            title="Refresh profile data"
          >
            <RefreshCw size={13} />
          </Button>
        </div>
      </div>

      {/* ── Primary Profile Card ───────────────────────────────────── */}
      <Card className="p-6 relative overflow-hidden">
        {/* Profile Effect: plays 3-4s when profile opens, then fades */}
        <ProfileCardEffect itemId={equipped.effect} />

        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <AvatarFrame itemId={equipped.frame || 'none'} size={74}>
                <AvatarPicture
                  avatarId={equipped.avatar}
                  avatarKey={profile?.avatarKey}
                  variant={profile?.avatarVariant}
                  seed={user?.uid}
                  size={58}
                  className="cursor-pointer shadow-md hover:ring-2 hover:ring-[var(--red)] transition-all"
                />
              </AvatarFrame>
              <button
                type="button"
                onClick={() => setIsPickingAvatar(true)}
                className="absolute -bottom-1 -right-1 bg-[#D71921] hover:bg-[#b0131a] text-white p-1 rounded-full text-[10px] shadow-sm transition-transform hover:scale-110 z-20"
                title="Change matrix avatar"
              >
                <Edit3 size={11} />
              </button>
            </div>
            <div>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] outline-none"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingName}
                    className="btn-red text-xs px-3 py-1.5"
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </form>
              ) : (equipped.nameplate && getCosmeticById(equipped.nameplate)) ? (
                <div className="flex items-center gap-2 max-w-full overflow-hidden">
                  <Nameplate
                    itemId={equipped.nameplate}
                    name={rawName}
                    shortId={profile?.shortId || (user?.uid ? user.uid.slice(0, 5) : '00000')}
                    roleBadge={role === 'captain' ? 'CAPTAIN' : undefined}
                    className="max-w-full"
                  />
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
                    title="Edit display name"
                  >
                    <Edit3 size={14} />
                  </button>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-heading">
                      <CheckCircle2 size={13} /> Saved
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-heading text-[var(--text)]">
                    {rawName}
                  </h2>
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
                    title="Edit display name"
                  >
                    <Edit3 size={14} />
                  </button>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-heading">
                      <CheckCircle2 size={13} /> Saved
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Link
                  to="/store"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[rgba(232,163,23,0.35)] hover:border-[#E8A317] text-[11px] font-mono text-[#FFD66B] transition-colors"
                >
                  <KobanIcon size={12} />
                  <span>{balance.toLocaleString()} Kobans</span>
                  <span className="text-[var(--muted)]">• Store</span>
                </Link>
                <span
                  className={`text-[10px] uppercase font-bold font-heading px-2 py-0.5 rounded-full border ${
                    role === 'superadmin' || role === 'admin'
                      ? 'border-red-500/40 bg-red-950/30 text-red-400'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)]'
                  }`}
                >
                  {role}
                </span>
                <span
                  className={`text-[10px] font-bold font-heading px-2 py-0.5 rounded-full border ${
                    isPro
                      ? 'border-red-500/40 bg-red-950/30 text-[var(--red)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)]'
                  }`}
                >
                  {isPro ? 'Pro Member' : 'Free Tier'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[var(--muted)] block">Setup Status</span>
            <span
              className={`text-xs font-semibold font-heading inline-flex items-center gap-1.5 mt-1 ${
                profileCompleted ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {profileCompleted ? (
                <>
                  <CheckCircle2 size={14} /> Profile Complete
                </>
              ) : (
                <>
                  <Clock size={14} /> Setup Incomplete
                </>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* ── 2-Column Grid: Target Exam & Current Plan ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Target Exam & Test Date */}
        <Card className="p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <GraduationCap size={16} />
                </div>
                <h3 className="font-heading font-semibold text-base text-[var(--text)]">
                  Target Examination
                </h3>
              </div>
              <Link
                to="/onboarding"
                className="text-xs text-[var(--red)] hover:underline font-heading font-semibold"
              >
                Change
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading">
                  University / Target Exam
                </span>
                <p className="font-heading text-sm font-semibold text-[var(--text)] mt-0.5">
                  {resolvedExam}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading">
                  Target Test Date
                </span>
                <p className="font-heading text-sm font-semibold text-[var(--text)] mt-0.5">
                  {testDate
                    ? new Date(`${testDate}T00:00:00`).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No test date scheduled'}
                  {daysLeft !== null && (
                    <span className="ml-2 text-xs text-[var(--red)] font-normal">
                      ({daysLeft > 0 ? `${daysLeft} days remaining` : 'Exam today or passed'})
                    </span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading">
                  Academic Track
                </span>
                <p className="font-heading text-sm text-[var(--text)] mt-0.5">
                  {resolvedTrack}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading mb-1.5">
                  Active Subjects ({subjects.length})
                </span>
                {subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-heading px-2 py-0.5 rounded-md bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)]"
                      >
                        {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">All entrance exam subjects active.</p>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/onboarding')}
            className="w-full text-xs cursor-pointer justify-center"
          >
            <span>Update Target University &amp; Track</span>
            <ArrowRight size={13} className="ml-1" />
          </Button>
        </Card>

        {/* Card 2: Current Subscription Plan */}
        <Card className="p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-heading font-semibold text-base text-[var(--text)]">
                  Current Plan &amp; Access
                </h3>
              </div>
              <span
                className={`text-xs font-heading font-bold px-2 py-0.5 rounded-full ${
                  isPro ? 'bg-[var(--red)] text-white' : 'bg-[var(--card-2)] text-[var(--muted)]'
                }`}
              >
                {effectivePlan.isSuperAdmin
                  ? 'Superadmin · Unlimited'
                  : isPro
                  ? 'Pro Active'
                  : 'Free Tier'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading">
                  Plan Details
                </span>
                <p className="font-heading text-base font-bold text-[var(--text)] mt-0.5">
                  {effectivePlan.isSuperAdmin
                    ? 'Superadmin · Unlimited'
                    : isPro
                    ? 'Pro Unlimited Pass'
                    : 'Boardly Free Starter'}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {effectivePlan.isSuperAdmin
                    ? 'All entrance tests, drills, past paper vaults, and AI tools unlimited.'
                    : isPro
                    ? 'Unlimited tests, past papers, AI tutor deep explanations & full diagnostics.'
                    : '10 daily tests with essential scoring analytics.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-1.5 text-xs text-[var(--muted)] font-heading">
                <div className="flex justify-between">
                  <span>Daily Test Allowance:</span>
                  <span className="text-[var(--text)] font-semibold">{isPro ? 'Unlimited' : '10 / day'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Full-Length Past Papers:</span>
                  <span className="text-[var(--text)] font-semibold">{isPro ? 'All 15+ Papers' : 'Locked'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weak Chapter Diagnostics:</span>
                  <span className="text-[var(--text)] font-semibold">Included</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate('/dashboard/plans')}
            className={isPro ? 'w-full text-xs justify-center' : 'btn-red w-full text-xs justify-center cursor-pointer'}
          >
            {effectivePlan.isSuperAdmin
              ? 'Superadmin · Unlimited'
              : isPro
              ? 'Manage Subscription'
              : 'Upgrade to Pro (PKR 199/mo)'}
            <ArrowRight size={13} className="ml-1" />
          </Button>
        </Card>
      </div>

      {/* ── Admin Portal Quick Link (Superadmins only) ─────────────── */}
      {isAdmin && (
        <Card className="p-4 bg-red-950/20 border-red-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--red)] text-white flex items-center justify-center shrink-0">
              <Shield size={16} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-white">Superadmin Access</p>
              <p className="text-xs text-[var(--muted)]">
                You have platform super-administrator privileges for user resets, audit logs, and question bank.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/admin')}
            className="btn-red text-xs px-3.5 py-1.5 cursor-pointer"
          >
            Open Admin Portal
          </Button>
        </Card>
      )}

      {/* ── Matrix Avatar Picker Modal ── */}
      {isPickingAvatar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Pick Your Dot-Matrix Avatar</h3>
                <p className="text-xs text-[rgba(255,255,255,0.7)]">Select a custom Nothing OS matrix icon &amp; color variant</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickingAvatar(false)}
                className="p-1 rounded-lg text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <AvatarPicker
              selectedKey={currentAvatarKey}
              selectedVariant={currentAvatarVariant}
              onSelect={async (key, variant) => {
                setIsSavingAvatar(true);
                try {
                  await updateProfileData({
                    avatarKey: key,
                    avatarVariant: variant,
                  });
                  setIsPickingAvatar(false);
                } catch (err) {
                  console.error('Failed to update avatar:', err);
                } finally {
                  setIsSavingAvatar(false);
                }
              }}
            />

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPickingAvatar(false)}
                disabled={isSavingAvatar}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
