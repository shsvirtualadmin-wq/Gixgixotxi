import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
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
} from 'lucide-react';

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

  const isPro = Boolean(profile?.isPremium || profile?.plan === 'pro');
  const role = profile?.role || (isAdmin ? 'superadmin' : 'student');
  const rawName =
    profile?.displayName ||
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Student');
  const userInitial = (rawName[0] || 'S').toUpperCase();

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
      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-2xl font-bold font-heading text-[var(--text)] text-white shadow-inner shrink-0">
              {userInitial}
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
              <p className="text-xs text-[var(--muted)] mt-0.5">{user?.email || 'No email'}</p>
              <div className="flex items-center gap-2 mt-2">
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
                {isPro ? 'Pro Active' : 'Free Tier'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block font-heading">
                  Plan Details
                </span>
                <p className="font-heading text-base font-bold text-[var(--text)] mt-0.5">
                  {isPro ? 'Pro Unlimited Pass' : 'Boardly Free Starter'}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {isPro
                    ? 'Unlimited questions, past papers, AI tutor deep explanations & full diagnostics.'
                    : '10 daily practice sprint questions with essential scoring analytics.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-1.5 text-xs text-[var(--muted)] font-heading">
                <div className="flex justify-between">
                  <span>Daily Question Allowance:</span>
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
            {isPro ? 'Manage Subscription' : 'Upgrade to Pro (PKR 199/mo)'}
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
    </div>
  );
}

export default ProfilePage;
