import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { RequestAccessSheet } from '@/components/admin/RequestAccessSheet';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminErrorRetryCard,
  AdminOverlay,
  AdminSearchFilterBar,
  AdminStatGrid,
  DotHeading,
  Field,
  GlassCard,
  MonoLabel,
  Pill,
  SkeletonListRows,
  useDebouncedValue,
} from '@/components/admin/AdminGlassPrimitives';
import {
  createAnnouncement,
  deleteAnnouncement,
  updateWelcomeAnnouncement,
  WELCOME_ANNOUNCEMENT_ID,
  type AnnouncementItem,
  type AnnouncementTargetAudience,
} from '@/services/notificationService';
import {
  getCachedAdminAnnouncements,
  fetchAdminAnnouncementsSWR,
  invalidateAdminAnnouncementsCache,
} from '@/services/adminTabCache';

const ANNOUNCEMENTS_PAGE_SIZE = 20;

export function AdminAnnouncementsPage() {
  const { user, isAdmin, hasPermission, profileLoading } = useAuth();
  const canManageAnnouncements = hasPermission('announcements.manage');
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);

  const initialCache = getCachedAdminAnnouncements();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    (initialCache?.items ?? []).filter((a) => a.id !== WELCOME_ANNOUNCEMENT_ID)
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialCache));
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);

  // Search, filter & pagination
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [audienceFilter, setAudienceFilter] = useState<'all_filter' | AnnouncementTargetAudience>('all_filter');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ANNOUNCEMENTS_PAGE_SIZE);

  // Pinned "Welcome to Boardly" state
  const [welcomeTitle, setWelcomeTitle] = useState(
    () => initialCache?.welcome?.title || 'Welcome to Boardly'
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    () => initialCache?.welcome?.message || ''
  );
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [welcomeErrors, setWelcomeErrors] = useState<{ title?: string; message?: string }>({});

  // New Broadcast Announcement form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<AnnouncementTargetAudience>('all');
  const [postErrors, setPostErrors] = useState<{ title?: string; message?: string }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyData = useCallback(
    (data: { items: AnnouncementItem[]; welcome: AnnouncementItem | null }) => {
      if (!isMountedRef.current) return;
      setAnnouncements(data.items.filter((a) => a.id !== WELCOME_ANNOUNCEMENT_ID));
      if (data.welcome) {
        setWelcomeTitle(data.welcome.title);
        setWelcomeMessage(data.welcome.message);
      }
      setHasLoadedOnce(true);
    },
    []
  );

  const loadData = useCallback(
    async (force = false) => {
      const cached = getCachedAdminAnnouncements();
      if (!cached) {
        setLoading(true);
      }
      if (force) {
        invalidateAdminAnnouncementsCache();
      }
      setErrorMsg(null);
      try {
        const data = await fetchAdminAnnouncementsSWR({
          force,
          onUpdate: applyData,
        });
        applyData(data);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        console.error('[AdminAnnouncements] Failed to fetch:', err);
        setErrorMsg('Could not load announcements. Please check your connection and try again.');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [applyData]
  );

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData(false);
    }
  }, [profileLoading, user, isAdmin, loadData]);

  useEffect(() => {
    setVisibleCount(ANNOUNCEMENTS_PAGE_SIZE);
  }, [debouncedSearch, audienceFilter]);

  const handleSaveWelcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManageAnnouncements) {
      setRequestAccessOpen(true);
      return;
    }
    const nextErrors: { title?: string; message?: string } = {};
    if (!welcomeTitle.trim()) nextErrors.title = 'Enter a welcome title.';
    if (!welcomeMessage.trim()) nextErrors.message = 'Enter a welcome message.';
    setWelcomeErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
      await loadData(true);
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

    const nextErrors: { title?: string; message?: string } = {};
    if (!title.trim()) nextErrors.title = 'Enter a broadcast title.';
    if (!message.trim()) nextErrors.message = 'Enter the broadcast message.';
    setPostErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
      setPostErrors({});
      setSuccessMsg(
        'Announcement posted successfully! Targeted students can now view it in their Notifications.'
      );
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post announcement.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!user || !canManageAnnouncements) {
      setDeleteTarget(null);
      setRequestAccessOpen(true);
      return;
    }
    const id = deleteTarget.id;
    setDeletingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteAnnouncement(id, { uid: user.uid, email: user.email });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      invalidateAdminAnnouncementsCache();
      setDeleteTarget(null);
      setSuccessMsg('Announcement deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete announcement.';
      setErrorMsg(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return announcements.filter((a) => {
      if (audienceFilter !== 'all_filter') {
        const aud = a.targetAudience || 'all';
        if (aud !== audienceFilter) return false;
      }
      if (!q) return true;
      return (
        (a.title || '').toLowerCase().includes(q) ||
        (a.message || '').toLowerCase().includes(q) ||
        (a.authorName || '').toLowerCase().includes(q)
      );
    });
  }, [announcements, debouncedSearch, audienceFilter]);

  const targetedCount = useMemo(
    () => announcements.filter((a) => a.targetAudience && a.targetAudience !== 'all').length,
    [announcements]
  );
  const allStudentsCount = announcements.length - targetedCount;

  return (
    <div data-admin-page="announcements" className="space-y-5 max-w-4xl pb-24">
      {/* ── Question-Bank Hero Card ── */}
      <GlassCard variant="hero" padding="lg" className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <MonoLabel>Super Admin Broadcast</MonoLabel>
            <DotHeading as="h1" size="page">
              Announcements Manager
            </DotHeading>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xl">
              Edit the pinned Welcome to Boardly notification and publish targeted broadcast announcements to students.
            </p>
          </div>

          <AdminButton
            variant="secondary"
            onClick={() => void loadData(true)}
            disabled={loading}
          >
            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </AdminButton>
        </div>

        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Broadcasts',
              value: loading && !hasLoadedOnce ? '—' : announcements.length,
              sublabel: 'Published notices',
            },
            {
              label: 'Welcome Notice',
              value: welcomeMessage.trim() ? 'Active' : 'Empty',
              tone: welcomeMessage.trim() ? 'success' : 'warning',
              sublabel: 'Pinned to new users',
            },
            {
              label: 'All Students',
              value: loading && !hasLoadedOnce ? '—' : allStudentsCount,
              sublabel: 'Global reach',
            },
            {
              label: 'Targeted',
              value: loading && !hasLoadedOnce ? '—' : targetedCount,
              tone: targetedCount > 0 ? 'accent' : 'default',
              sublabel: 'Tier / Crew specific',
            },
          ]}
        />
      </GlassCard>

      {/* ── Success and Error Banners ── */}
      {successMsg && (
        <div className="p-3.5 rounded-[16px] bg-emerald-500/12 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && announcements.length === 0 && !loading ? (
        <AdminErrorRetryCard
          title="Could not load announcements"
          message={errorMsg}
          onRetry={() => void loadData(true)}
          retrying={loading}
        />
      ) : errorMsg ? (
        <div className="p-3.5 rounded-[16px] bg-red-500/12 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <AdminButton
            variant="pill"
            onClick={() => void loadData(true)}
            className="!min-h-[34px] !py-1 !px-3"
          >
            Retry
          </AdminButton>
        </div>
      ) : null}

      {!canManageAnnouncements && (
        <GlassCard
          variant="glass"
          padding="sm"
          className="border-amber-500/35 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2.5 text-xs text-amber-200">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <span>
              Broadcasting announcements requires approval from the Super Admin{' '}
              <span className="font-mono text-[11px] opacity-80">(announcements.manage)</span>.
            </span>
          </div>
          <AdminButton
            variant="primary"
            onClick={() => setRequestAccessOpen(true)}
            className="!min-h-[40px] !py-2 !px-3.5 !text-xs"
          >
            <Lock size={13} />
            <span>Request Access</span>
          </AdminButton>
        </GlassCard>
      )}

      {/* ── Pinned Welcome to Boardly Announcement Editor ── */}
      <GlassCard variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
            <Pin size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <DotHeading as="h2" size="section">
                Pinned Welcome Notification
              </DotHeading>
              <Pill tone="warning">Pinned</Pill>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Delivered automatically once as an unread notification to every new and existing student when they open their dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveWelcome} noValidate className="space-y-4">
          <Field label="Welcome Title" required error={welcomeErrors.title}>
            <input
              type="text"
              value={welcomeTitle}
              onChange={(e) => {
                setWelcomeTitle(e.target.value);
                if (welcomeErrors.title) setWelcomeErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Welcome to Boardly"
              maxLength={120}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] bg-black/30 border border-white/12 text-[var(--text)] text-sm outline-none focus:border-[#E8353B]"
            />
          </Field>

          <Field label="Welcome Message" required error={welcomeErrors.message}>
            <textarea
              value={welcomeMessage}
              onChange={(e) => {
                setWelcomeMessage(e.target.value);
                if (welcomeErrors.message) setWelcomeErrors((p) => ({ ...p, message: undefined }));
              }}
              placeholder="Write the welcome announcement message here..."
              rows={5}
              maxLength={2500}
              className="w-full px-3.5 py-2.5 rounded-[14px] bg-black/30 border border-white/12 text-[var(--text)] text-sm outline-none focus:border-[#E8353B] resize-y"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[#E8353B]" />
              <span>Pinned welcome notice for all students</span>
            </span>

            <AdminButton
              type="submit"
              variant="primary"
              disabled={savingWelcome}
            >
              <Save size={15} />
              <span>{savingWelcome ? 'Saving welcome notice…' : 'Save Welcome Announcement'}</span>
              {savingWelcome && <ButtonLineLoader />}
            </AdminButton>
          </div>
        </form>
      </GlassCard>

      {/* ── Post Announcement Form ── */}
      <GlassCard variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8353B]/15 border border-[#E8353B]/35 text-[#E8353B] flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <DotHeading as="h2" size="section">
              Post New Broadcast Announcement
            </DotHeading>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Broadcast to every student in the selected audience on Boardly.
            </p>
          </div>
        </div>

        <form onSubmit={handlePost} noValidate className="space-y-4">
          <Field
            label="Title"
            required
            error={postErrors.title}
            hint={`${title.length}/120 characters`}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (postErrors.title) setPostErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="e.g. Platform update: New chemistry practice sets added"
              maxLength={120}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] bg-black/30 border border-white/12 text-[var(--text)] text-sm outline-none focus:border-[#E8353B]"
            />
          </Field>

          <Field
            label="Message"
            required
            error={postErrors.message}
            hint={`${message.length}/2000 characters`}
          >
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (postErrors.message) setPostErrors((p) => ({ ...p, message: undefined }));
              }}
              placeholder="Write the full announcement message here..."
              rows={4}
              maxLength={2000}
              className="w-full px-3.5 py-2.5 rounded-[14px] bg-black/30 border border-white/12 text-[var(--text)] text-sm outline-none focus:border-[#E8353B] resize-y"
            />
          </Field>

          <Field label="Target Audience">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'All users' },
                  { id: 'free', label: 'Free' },
                  { id: 'pro', label: 'Pro' },
                  { id: 'plus', label: 'Plus' },
                  { id: 'crew', label: 'Crew' },
                ] as const
              ).map((aud) => (
                <AdminButton
                  key={aud.id}
                  variant={targetAudience === aud.id ? 'primary' : 'pill'}
                  onClick={() => setTargetAudience(aud.id)}
                  className="!min-h-[38px] !py-1.5 !px-3.5 !text-xs"
                >
                  {aud.label}
                </AdminButton>
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[#E8353B]" />
              <span>Signed as {user?.email || 'Superadmin'}</span>
            </span>

            <AdminButton
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              <Plus size={15} />
              <span>{submitting ? 'Posting announcement…' : 'Post Announcement'}</span>
              {submitting && <ButtonLineLoader />}
            </AdminButton>
          </div>
        </form>
      </GlassCard>

      {/* ── Published Broadcasts Search & List ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <DotHeading as="h2" size="section">
            Published Broadcasts ({loading && !hasLoadedOnce ? '—' : filteredAnnouncements.length})
          </DotHeading>
          <MonoLabel>Visible to targeted users</MonoLabel>
        </div>

        <AdminSearchFilterBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search published broadcasts…"
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={audienceFilter !== 'all_filter' ? 1 : 0}
        />

        {loading && !hasLoadedOnce ? (
          <SkeletonListRows rows={3} />
        ) : filteredAnnouncements.length === 0 ? (
          <AdminEmptyState
            icon={<Megaphone size={22} />}
            title={
              announcements.length === 0
                ? 'No additional broadcast announcements'
                : 'No announcements match your search'
            }
            description={
              announcements.length === 0
                ? 'The pinned Welcome to Boardly announcement is active above. Use the form to broadcast updates.'
                : 'Try clearing your search or audience filter.'
            }
            action={
              (debouncedSearch.trim() || audienceFilter !== 'all_filter') && (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setAudienceFilter('all_filter');
                  }}
                >
                  Clear filters
                </AdminButton>
              )
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filteredAnnouncements.slice(0, visibleCount).map((a) => {
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
                      <h3 className="font-bold text-[15px] text-[var(--text)]">{a.title}</h3>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                      {a.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{dateStr}</span>
                      </span>
                      <span>By: {a.authorName || 'Superadmin'}</span>
                    </div>
                  </div>

                  <AdminButton
                    variant="danger"
                    onClick={() => {
                      if (!user || !canManageAnnouncements) {
                        setRequestAccessOpen(true);
                        return;
                      }
                      setDeleteTarget(a);
                    }}
                    disabled={isDeleting}
                    className="!min-h-[40px] !min-w-[40px] !px-3 self-end sm:self-start shrink-0"
                    title="Delete announcement"
                    aria-label={`Delete ${a.title}`}
                  >
                    {isDeleting ? <span className="text-xs">Deleting…</span> : <Trash2 size={15} />}
                    {isDeleting && <ButtonLineLoader />}
                  </AdminButton>
                </GlassCard>
              );
            })}

            {filteredAnnouncements.length > visibleCount && (
              <div className="pt-2 flex justify-center">
                <AdminButton
                  variant="secondary"
                  onClick={() => setVisibleCount((prev) => prev + ANNOUNCEMENTS_PAGE_SIZE)}
                >
                  Load more broadcasts ({filteredAnnouncements.length - visibleCount} remaining)
                </AdminButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Audience Filter Sheet (Solid Opaque) ── */}
      <AdminOverlay
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        mode="sheet"
        title="Filter Broadcasts"
        subtitle="Filter published announcements by target audience"
        maxWidthClass="max-w-[440px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => {
                setAudienceFilter('all_filter');
                setFiltersOpen(false);
              }}
            >
              Reset
            </AdminButton>
            <AdminButton variant="primary" onClick={() => setFiltersOpen(false)}>
              Apply
            </AdminButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'all_filter', label: 'Any audience' },
              { id: 'all', label: 'All users' },
              { id: 'free', label: 'Free' },
              { id: 'pro', label: 'Pro' },
              { id: 'plus', label: 'Plus' },
              { id: 'crew', label: 'Crew' },
            ] as const
          ).map((opt) => (
            <AdminButton
              key={opt.id}
              variant={audienceFilter === opt.id ? 'primary' : 'secondary'}
              onClick={() => setAudienceFilter(opt.id)}
              fullWidth
            >
              {opt.label}
            </AdminButton>
          ))}
        </div>
      </AdminOverlay>

      {/* ── Delete Confirmation Dialog (Solid Opaque, replaces window.confirm) ── */}
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete announcement?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.title}" from all student notifications? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete announcement"
        busy={Boolean(deletingId)}
        danger
      />

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
