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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchWelcomeAnnouncement,
  updateWelcomeAnnouncement,
  WELCOME_ANNOUNCEMENT_ID,
  isUserSuperAdmin,
  type AnnouncementItem,
} from '@/services/notificationService';

export function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const isSuperAdmin = isUserSuperAdmin(user);

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
    void loadData();
  }, []);

  const handleSaveWelcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isSuperAdmin) {
      setErrorMsg('Unauthorized: Only the superadmin can edit the Welcome announcement.');
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
    if (!user || !isSuperAdmin) {
      setErrorMsg('Unauthorized: Only the superadmin can create announcements.');
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
        adminUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Superadmin',
        },
      });

      setTitle('');
      setMessage('');
      setSuccessMsg(
        'Announcement posted successfully! All students can now view it in their Notifications.'
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
    if (!user || !isSuperAdmin) return;
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
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--red)]">
              SUPERADMIN BROADCAST
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Announcements Manager
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Edit the pinned Welcome to Boardly notification and publish broadcast announcements to all students.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors self-start sm:self-auto cursor-pointer"
          title="Refresh"
        >
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Success and Error Banners ── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Pinned Welcome to Boardly Announcement Editor ── */}
      <Card className="p-6 sm:p-7 space-y-5 bg-[var(--card)] border-[var(--border)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Pin size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-base sm:text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Pinned Welcome Notification ("Welcome to Boardly")
                </h2>
                <Badge color="amber">Pinned</Badge>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Delivered automatically once as an unread notification to every new and existing student when they open their dashboard.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWelcome} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Welcome Title <span className="text-[var(--red)]">*</span>
            </label>
            <input
              type="text"
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              placeholder="Welcome to Boardly"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--red)] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Welcome Message <span className="text-[var(--red)]">*</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Write the welcome announcement message here..."
              rows={5}
              maxLength={2500}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--red)] outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[var(--red)]" />
              <span>Stored in D1 &amp; Firestore (`welcome_to_boardly`)</span>
            </span>

            <button
              type="submit"
              disabled={savingWelcome || !welcomeTitle.trim() || !welcomeMessage.trim()}
              className="btn-red text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingWelcome ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Welcome Announcement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Post Announcement Form ── */}
      <Card className="p-6 sm:p-7 space-y-5 bg-[var(--card)] border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--red)]/10 border border-[var(--red)]/30 text-[var(--red)] flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <h2
              className="text-base sm:text-lg font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Post New Broadcast Announcement
            </h2>
            <p className="text-xs text-[var(--muted)]">
              This will broadcast to every user on Boardly.
            </p>
          </div>
        </div>

        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Title <span className="text-[var(--red)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Platform update: New chemistry practice sets added"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--red)] outline-none"
            />
            <div className="text-[11px] text-[var(--muted)] mt-1 text-right">
              {title.length}/120
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Message <span className="text-[var(--red)]">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement message here..."
              rows={4}
              maxLength={2000}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--red)] outline-none resize-y"
            />
            <div className="text-[11px] text-[var(--muted)] mt-1 text-right">
              {message.length}/2000
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[var(--red)]" />
              <span>Signed as {user?.email || 'Superadmin'}</span>
            </span>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !message.trim()}
              className="btn-red text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Post Announcement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Active Announcements List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Published Broadcasts ({announcements.length})
          </h2>
          <span className="text-xs text-[var(--muted)]">Visible to all users</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton height={80} count={3} />
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={32} />}
            title="No additional broadcast announcements"
            description="The pinned Welcome to Boardly announcement is active above. Use the form to broadcast additional updates."
          />
        ) : (
          <div className="space-y-3">
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
                <div
                  key={a.id}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color="red">Announcement</Badge>
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
                    className="p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors self-end sm:self-start cursor-pointer shrink-0"
                    title="Delete announcement"
                  >
                    {isDeleting ? (
                      <RotateCcw size={15} className="animate-spin text-red-500" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAnnouncementsPage;
