import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pin,
  Save,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RequestAccessSheet } from '@/components/admin/RequestAccessSheet';
import {
  DotHeading,
  GlassCard,
  Pill,
  SkeletonListRows,
} from '@/components/admin/AdminGlassPrimitives';
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchWelcomeAnnouncement,
  updateWelcomeAnnouncement,
  WELCOME_ANNOUNCEMENT_ID,
  type AnnouncementItem,
  type AnnouncementTargetAudience,
} from '@/services/notificationService';

export function AdminAnnouncementsPage() {
  const { user, isAdmin, hasPermission, profileLoading } = useAuth();
  const canManageAnnouncements = hasPermission('announcements.manage');
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pinned "Welcome to Boardly" state
  const [welcomeTitle, setWelcomeTitle] = useState('Welcome to Boardly');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);

  // New Broadcast Announcement form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<AnnouncementTargetAudience>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [list, welcomeRes] = await Promise.all([
        fetchAnnouncements(50),
        fetchWelcomeAnnouncement(),
      ]);
      setAnnouncements(list.filter((a) => a.id !== WELCOME_ANNOUNCEMENT_ID));
      if (welcomeRes?.announcement) {
        setWelcomeTitle(welcomeRes.announcement.title);
        setWelcomeMessage(welcomeRes.announcement.message);
      }
    } catch (err: unknown) {
      console.error('[AdminAnnouncements] Failed to fetch:', err);
      setErrorMsg('Could not load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData();
    }
  }, [profileLoading, user, isAdmin]);

  const handleSaveWelcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManageAnnouncements) {
      setRequestAccessOpen(true);
      return;
    }
    if (!welcomeTitle.trim() || !welcomeMessage.trim()) {
      setErrorMsg('Please enter both title and message for the Welcome announcement.');
      return;
    }

    setSavingWelcome(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateWelcomeAnnouncement({
        title: welcomeTitle,
        message: welcomeMessage,
        adminUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Superadmin',
        },
      });
      setSuccessMsg(
        'Pinned "Welcome to Boardly" announcement updated! New and existing users will see this in their notifications.'
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update Welcome announcement.';
      setErrorMsg(msg);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManageAnnouncements) {
      setRequestAccessOpen(true);
      return;
    }

    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both title and message.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createAnnouncement({
        title,
        message,
        targetAudience,
        adminUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Superadmin',
        },
      });

      setTitle('');
      setMessage('');
      setTargetAudience('all');
      setSuccessMsg(
        'Announcement posted successfully! Targeted students can now view it in their Notifications.'
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post announcement.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !canManageAnnouncements) {
      setRequestAccessOpen(true);
      return;
    }
    if (
      !window.confirm(
        'Are you sure you want to delete this announcement? It will be removed from all student notifications.'
      )
    ) {
      return;
    }

    setDeletingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteAnnouncement(id, { uid: user.uid, email: user.email });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setSuccessMsg('Announcement deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete announcement.';
      setErrorMsg(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div data-admin-page="announcements" className="space-y-6 max-w-4xl pb-24">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8353B]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#E8353B] font-semibold">
              Super Admin Broadcast
            </span>
          </div>
          <DotHeading as="h1" size="page" className="mt-1">
            Announcements Manager
          </DotHeading>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Edit the pinned Welcome to Boardly notification and publish broadcast announcements to all students.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl ag-flat-card text-[var(--muted)] hover:text-[var(--text)] transition-colors self-start sm:self-auto cursor-pointer"
          title="Refresh"
        >
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Success and Error Banners ── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-600 dark:text-red-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!canManageAnnouncements && (
        <GlassCard
          variant="glass"
          padding="sm"
          className="bg-amber-500/10 border-amber-500/30 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-200">
            <Lock size={16} className="text-amber-500 shrink-0" />
            <span>
              Broadcasting announcements requires approval from the Super Admin{' '}
              <span className="font-mono text-[11px] opacity-75">(announcements.manage)</span>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRequestAccessOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={13} />
            <span>Request Access</span>
          </button>
        </GlassCard>
      )}

      {/* ── Pinned Welcome to Boardly Announcement Editor ── */}
      <GlassCard variant="glass" padding="lg" className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Pin size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DotHeading as="h2" size="section">
                  Pinned Welcome Notification
                </DotHeading>
                <Pill tone="warning">Pinned</Pill>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Delivered automatically once as an unread notification to every new and existing student when they open their dashboard.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWelcome} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Welcome Title <span className="text-[#E8353B]">*</span>
            </label>
            <input
              type="text"
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              placeholder="Welcome to Boardly"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-[#E8353B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Welcome Message <span className="text-[#E8353B]">*</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Write the welcome announcement message here..."
              rows={5}
              maxLength={2500}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-[#E8353B] resize-y"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[#E8353B]" />
              <span>Pinned welcome notice for all students</span>
            </span>

            <button
              type="submit"
              disabled={savingWelcome || !welcomeTitle.trim() || !welcomeMessage.trim()}
              className="relative overflow-hidden bg-[#E8353B] hover:bg-[#D4292F] text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-w-[200px] transition-colors"
            >
              <Save size={15} />
              <span>{savingWelcome ? 'Saving welcome notice...' : 'Save Welcome Announcement'}</span>
              {savingWelcome && <ButtonLineLoader />}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ── Post Announcement Form ── */}
      <GlassCard variant="glass" padding="lg" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8353B]/12 border border-[#E8353B]/30 text-[#E8353B] flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <DotHeading as="h2" size="section">
              Post New Broadcast Announcement
            </DotHeading>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              This will broadcast to every user in the selected audience on Boardly.
            </p>
          </div>
        </div>

        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Title <span className="text-[#E8353B]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Platform update: New chemistry practice sets added"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-[#E8353B]"
            />
            <div className="text-[11px] text-[var(--muted)] mt-1 text-right ag-tabular">
              {title.length}/120
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Message <span className="text-[#E8353B]">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement message here..."
              rows={4}
              maxLength={2000}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-[#E8353B] resize-y"
            />
            <div className="text-[11px] text-[var(--muted)] mt-1 text-right ag-tabular">
              {message.length}/2000
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Target Audience
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: 'All users' },
                  { id: 'free', label: 'Free' },
                  { id: 'pro', label: 'Pro' },
                  { id: 'plus', label: 'Plus' },
                  { id: 'crew', label: 'Crew' },
                ] as const
              ).map((aud) => (
                <button
                  key={aud.id}
                  type="button"
                  onClick={() => setTargetAudience(aud.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold border transition-colors cursor-pointer ${
                    targetAudience === aud.id
                      ? aud.id === 'plus'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-[#E8353B] text-white border-[#E8353B]'
                      : 'bg-[var(--bg)]/60 text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[#E8353B]" />
              <span>Signed as {user?.email || 'Superadmin'}</span>
            </span>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !message.trim()}
              className="relative overflow-hidden bg-[#E8353B] hover:bg-[#D4292F] text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-w-[170px] transition-colors"
            >
              <Plus size={15} />
              <span>{submitting ? 'Posting announcement...' : 'Post Announcement'}</span>
              {submitting && <ButtonLineLoader />}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ── Active Announcements List (flat translucent rows — zero backdrop-filter) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <DotHeading as="h2" size="section">
            Published Broadcasts ({loading && announcements.length === 0 ? '—' : announcements.length})
          </DotHeading>
          <span className="text-xs text-[var(--muted)]">Visible to targeted users</span>
        </div>

        {loading ? (
          <SkeletonListRows rows={3} />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={32} />}
            title="No additional broadcast announcements"
            description="The pinned Welcome to Boardly announcement is active above. Use the form to broadcast additional updates."
          />
        ) : (
          <div className="space-y-2.5">
            {announcements.map((a) => {
              const isDeleting = deletingId === a.id;
              const dateStr =
                typeof (a.createdAt as any)?.toDate === 'function'
                  ? (a.createdAt as any).toDate().toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recently';

              return (
                <GlassCard
                  key={a.id}
                  variant="flat"
                  padding="md"
                  className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="accent">Announcement</Pill>
                      {a.targetAudience && a.targetAudience !== 'all' && (
                        <Pill tone={a.targetAudience === 'plus' ? 'warning' : 'neutral'}>
                          Audience: {a.targetAudience.toUpperCase()}
                        </Pill>
                      )}
                      <h3
                        className="font-bold text-sm text-[var(--text)]"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {a.title}
                      </h3>
                    </div>

                    <p className="text-xs text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
                      {a.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[var(--muted)] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{dateStr}</span>
                      </span>
                      <span>By: {a.authorName || 'Superadmin'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={isDeleting}
                    className="relative overflow-hidden p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors self-end sm:self-start cursor-pointer shrink-0"
                    title="Delete announcement"
                  >
                    {isDeleting ? (
                      <span className="text-xs px-2">Deleting...</span>
                    ) : (
                      <Trash2 size={15} />
                    )}
                    {isDeleting && <ButtonLineLoader />}
                  </button>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
      <RequestAccessSheet
        open={requestAccessOpen}
        onClose={() => setRequestAccessOpen(false)}
        permission="announcements.manage"
        targetLabel="Announcements & Broadcasts"
      />
    </div>
  );
}

export default AdminAnnouncementsPage;
