import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchCaptainApplications,
  fetchCrewApplications,
  approveCaptainApplication,
  approveCrewApplication,
  rejectApplication,
} from '@/services/adminService';
import type { CaptainApplication, CrewApplication } from '@/types';

export function AdminApplicationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'captain' | 'crew'>('captain');
  const [statusFilter, setStatusFilter] = useState('all');
  const [captains, setCaptains] = useState<CaptainApplication[]>([]);
  const [crew, setCrew] = useState<CrewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Reject modal dialog state
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'captain' | 'crew';
    appId: string;
    uid: string;
    email: string;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('Criteria not met at this time.');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'captain') {
        const data = await fetchCaptainApplications(statusFilter);
        setCaptains(data);
      } else {
        const data = await fetchCrewApplications(statusFilter);
        setCrew(data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveCaptain = async (app: CaptainApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCaptainApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve captain error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveCrew = async (app: CrewApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCrewApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve crew error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenReject = (
    type: 'captain' | 'crew',
    appId: string,
    uid: string,
    email: string,
    name: string
  ) => {
    setRejectTarget({ type, appId, uid, email, name });
    setRejectReason('Criteria not met at this time.');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !user?.email) return;
    setActionInProgress(rejectTarget.appId);
    try {
      await rejectApplication(
        user.email,
        rejectTarget.type,
        rejectTarget.appId,
        rejectTarget.uid,
        rejectTarget.email,
        rejectReason
      );
      setRejectTarget(null);
      await loadData();
    } catch (err) {
      console.error('Reject application error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const currentList = activeTab === 'captain' ? captains : crew;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Applications
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Review and moderate Campus Captain and Study Crew candidate submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── TAB SWITCHER & FILTER CHIPS ────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Segmented Switcher */}
        <div className="flex items-center p-1 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('captain')}
            className={`px-4 py-1.5 rounded-[12px] text-[13px] font-heading font-medium transition-colors ${
              activeTab === 'captain'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Campus Captains
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crew')}
            className={`px-4 py-1.5 rounded-[12px] text-[13px] font-heading font-medium transition-colors ${
              activeTab === 'crew'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Study Crew
          </button>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
            Status:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === id
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── APPLICATIONS LIST ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3"
            >
              <div className="h-4 bg-[var(--card-2)] rounded w-1/3" />
              <div className="h-4 bg-[var(--card-2)] rounded w-1/2" />
              <div className="h-10 bg-[var(--card-2)] rounded w-full" />
            </div>
          ))
        ) : currentList.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No applications match this filter.
            </p>
          </div>
        ) : (
          currentList.map((app) => {
            const isCaptain = activeTab === 'captain';
            const capApp = app as CaptainApplication;
            const crewApp = app as CrewApplication;
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
                      {app.name}
                    </h2>
                    <div className="flex items-center gap-3 text-[12px] font-heading text-[var(--muted)] mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        <span>{app.email}</span>
                      </span>
                      {app.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          <span>{app.phone}</span>
                        </span>
                      )}
                      {isCaptain && capApp.university && (
                        <span className="flex items-center gap-1">
                          <Building size={12} />
                          <span>{capApp.university}</span>
                        </span>
                      )}
                      {app.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{app.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`text-[11px] font-heading px-2.5 py-0.5 rounded-full border shrink-0 capitalize ${
                      isApproved
                        ? 'border-[var(--text)] text-[var(--text)]'
                        : isRejected
                          ? 'border-[var(--red)] text-[var(--red)]'
                          : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Statement / Pitch */}
                {(isCaptain ? capApp.motivation : crewApp.whyCrew) && (
                  <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-heading text-[var(--muted)] leading-relaxed">
                    <p className="text-[var(--text)] mb-1 font-medium">Candidate statement:</p>
                    <p>{isCaptain ? capApp.motivation : crewApp.whyCrew}</p>
                  </div>
                )}

                {/* Action Buttons if Pending */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={actionInProgress === app.id}
                      onClick={() =>
                        handleOpenReject(
                          activeTab,
                          app.id,
                          app.userId,
                          app.email,
                          app.name
                        )
                      }
                      className="px-3.5 py-2 rounded-[12px] border border-[var(--red)]/40 text-[var(--red)] hover:bg-[var(--card-2)] text-[12px] font-heading font-medium transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress === app.id}
                      onClick={() =>
                        isCaptain
                          ? handleApproveCaptain(capApp)
                          : handleApproveCrew(crewApp)
                      }
                      className="px-4 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[12px] font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionInProgress === app.id ? 'Approving...' : 'Approve & grant role'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── REJECT APPLICATION DIALOG MODAL (No window.prompt!) ────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setRejectTarget(null)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                Reject application
              </h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              Rejecting application for <strong className="text-[var(--text)]">{rejectTarget.name}</strong>. Provide an optional message to include in their notification.
            </p>

            <div>
              <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                Reason / Note
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApplicationsPage;
