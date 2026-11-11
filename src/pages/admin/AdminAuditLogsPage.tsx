import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';
import { fetchAuditLogs } from '@/services/adminService';
import {
  fetchAdminEmailLogs,
  retryFailedEmailLog,
  sendAdminSampleTestEmail,
  triggerDailyAdminDigestNow,
  type AdminEmailLogItem,
  type AdminEmailConfigInfo,
} from '@/services/emailNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import type { AuditLog } from '@/types';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';

export function AdminAuditLogsPage() {
  const { user, isAdmin, profileLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'email_logs' | 'audit_logs'>('email_logs');

  // System Audit Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Email Logs (Resend API) state
  const [emailLogs, setEmailLogs] = useState<AdminEmailLogItem[]>([]);
  const [emailConfig, setEmailConfig] = useState<AdminEmailConfigInfo | null>(null);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(true);
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadAuditData = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const data = await fetchAuditLogs(120);
      setLogs(data);
    } catch (err) {
      console.error('[AdminAuditLogsPage] Failed to load audit logs:', err);
      setBannerNotice({
        type: 'error',
        text: 'Could not load system audit logs. Click Refresh to retry.',
      });
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const loadEmailLogsData = useCallback(async () => {
    setLoadingEmailLogs(true);
    try {
      const res = await fetchAdminEmailLogs();
      if (res.config) {
        setEmailConfig(res.config);
      }
      setEmailLogs(res.logs || []);
    } catch (err) {
      console.error('[AdminAuditLogsPage] Failed to load email logs:', err);
      setBannerNotice({
        type: 'error',
        text: 'Could not load email logs. Click Refresh to retry.',
      });
    } finally {
      setLoadingEmailLogs(false);
    }
  }, []);

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadEmailLogsData();
      void loadAuditData();
    }
  }, [profileLoading, user, isAdmin, loadEmailLogsData, loadAuditData]);

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setBannerNotice(null);
    try {
      const res = await sendAdminSampleTestEmail();
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: `Sample test email dispatched via Resend (${res.messageId || 'OK'}). Check your admin inbox!`,
        });
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Failed to send sample test email.',
        });
      }
      await loadEmailLogsData();
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSendDailyDigest = async () => {
    setSendingDigest(true);
    setBannerNotice(null);
    try {
      const res = await triggerDailyAdminDigestNow();
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: '00:00 PKT Daily Admin Digest dispatched to ADMIN_EMAILS.',
        });
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Could not dispatch daily digest.',
        });
      }
      await loadEmailLogsData();
    } finally {
      setSendingDigest(false);
    }
  };

  const handleRetryEmail = async (logId: string) => {
    setRetryingLogId(logId);
    setBannerNotice(null);
    try {
      const res = await retryFailedEmailLog(logId);
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          text: 'Email resent successfully via Resend API.',
        });
      } else {
        setBannerNotice({
          type: 'error',
          text: res.error || 'Retry failed.',
        });
      }
      await loadEmailLogsData();
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredAuditLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const st = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(st) ||
      log.adminEmail.toLowerCase().includes(st) ||
      (log.targetEmail && log.targetEmail.toLowerCase().includes(st)) ||
      (log.targetUid && log.targetUid.toLowerCase().includes(st))
    );
  });

  const filteredEmailLogs = emailLogs.filter((item) => {
    if (emailFilter !== 'all' && item.status !== emailFilter) return false;
    if (!search.trim()) return true;
    const st = search.toLowerCase();
    return (
      item.eventType.toLowerCase().includes(st) ||
      item.subject.toLowerCase().includes(st) ||
      item.recipientMasked.toLowerCase().includes(st) ||
      item.recipientHash.toLowerCase().includes(st)
    );
  });

  const formatLogTime = (log: AuditLog): string => {
    if (!log.timestamp) return 'Just now';
    try {
      if ('toDate' in log.timestamp && typeof log.timestamp.toDate === 'function') {
        const d = log.timestamp.toDate();
        return d.toLocaleDateString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
    } catch {
      // ignore
    }
    return 'Recently';
  };

  const formatIsoTimePkt = (iso: string): string => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' PKT'
      );
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Email &amp; Audit Logs
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Monitor Resend transactional email deliveries, retry failed dispatches, and inspect immutable system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={sendingTestEmail}
            className="relative overflow-hidden btn-red px-3.5 py-2 rounded-[12px] text-xs sm:text-[13px] font-heading font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Send size={14} />
            <span>{sendingTestEmail ? 'Sending test email...' : 'Send test email'}</span>
            {sendingTestEmail && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={handleSendDailyDigest}
            disabled={sendingDigest}
            className="relative overflow-hidden flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-[13px] font-heading font-semibold text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CalendarClock size={14} className="text-[#F5B301]" />
            <span>{sendingDigest ? 'Sending digest...' : 'Send Daily Digest'}</span>
            {sendingDigest && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={() => {
              loadEmailLogsData();
              loadAuditData();
            }}
            disabled={loadingAudit || loadingEmailLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── FEEDBACK BANNER ────────────────────────────────────────────────── */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-heading flex items-center gap-2.5 ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/40 border-red-500/50 text-red-300'
          }`}
        >
          {bannerNotice.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-red-400" />
          )}
          <span className="break-words">{bannerNotice.text}</span>
        </div>
      )}

      {/* ─── TABS & SEARCH TOOLBAR ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Switcher */}
          <div className="flex items-center p-1 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] self-start">
            <button
              type="button"
              onClick={() => setActiveTab('email_logs')}
              className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'email_logs'
                  ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Mail size={14} />
              <span>
                Email Logs ({loadingEmailLogs && emailLogs.length === 0 ? '—' : emailLogs.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit_logs')}
              className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-semibold transition-colors cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>
                System Audit Logs ({loadingAudit && logs.length === 0 ? '—' : logs.length})
              </span>
            </button>
          </div>

          {/* Status Filter Chips for Email Logs */}
          {activeTab === 'email_logs' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'sent', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEmailFilter(st)}
                  className={`text-xs font-heading px-3 py-1 rounded-full border capitalize transition-colors cursor-pointer ${
                    emailFilter === st
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                      : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resend Pipeline Status Bar */}
        {activeTab === 'email_logs' && emailConfig && (
          <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  emailConfig.hasResendKey ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-[var(--text)] font-semibold">
                Resend API Key: {emailConfig.hasResendKey ? 'Configured' : 'Missing RESEND_API_KEY secret'}
              </span>
            </div>
            <div className="text-[var(--muted)]">
              FROM: <span className="text-[var(--text)]">{emailConfig.emailFrom}</span>
            </div>
            <div className="text-[var(--muted)]">
              ADMINS: <span className="text-[var(--text)]">{emailConfig.adminEmails.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
          <Search size={16} className="text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder={
              activeTab === 'email_logs'
                ? 'Search email logs by event type, subject, or masked recipient...'
                : 'Search audit logs by action, admin, or target student email...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
        </div>
      </div>

      {/* ─── TAB 1: EMAIL LOGS (RESEND API) ─────────────────────────────────── */}
      {activeTab === 'email_logs' && (
        <div className="space-y-3">
          {loadingEmailLogs ? (
            <LineLoader context="admin" message="Loading transactional email logs..." />
          ) : filteredEmailLogs.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-2">
              <Mail size={24} className="mx-auto text-[var(--muted)]" />
              <p className="font-heading text-sm font-bold text-[var(--text)]">
                No email logs recorded yet
              </p>
              <p className="font-heading text-xs text-[var(--muted)] max-w-md mx-auto">
                Click &ldquo;Send test email&rdquo; above to verify your Resend API configuration, or trigger any Koban, test, or application event.
              </p>
            </div>
          ) : (
            filteredEmailLogs.map((item) => {
              const isSent = item.status === 'sent';
              const isFailed = item.status === 'failed';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold inline-flex items-center gap-1 ${
                          isSent
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : isFailed
                            ? 'border-red-500/40 bg-red-500/10 text-red-400'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {isSent ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{item.status}</span>
                      </span>

                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] font-semibold">
                        {item.eventType}
                      </span>

                      <span className="text-[11px] font-mono uppercase text-[var(--muted)]">
                        Role: {item.recipientRole}
                      </span>

                      <span className="text-xs font-mono text-[var(--muted)]">
                        To: <strong className="text-[var(--text)]">{item.recipientMasked}</strong>{' '}
                        <span className="opacity-60">(#{item.recipientHash})</span>
                      </span>
                    </div>

                    <div className="font-heading text-sm font-semibold text-[var(--text)] break-words">
                      {item.subject}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono text-[var(--muted)]">
                      <span>Time: {formatIsoTimePkt(item.createdAt)}</span>
                      {item.resendMessageId && (
                        <span>Resend ID: {item.resendMessageId}</span>
                      )}
                      <span>Key: {item.idempotencyKey}</span>
                    </div>

                    {item.error && (
                      <p className="text-xs text-red-400 font-mono pt-0.5 m-0">
                        Error: {item.error}
                      </p>
                    )}
                  </div>

                  {isFailed && (
                    <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                      <button
                        type="button"
                        disabled={retryingLogId === item.id}
                        onClick={() => handleRetryEmail(item.id)}
                        className="relative overflow-hidden btn-red px-3.5 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        <span>{retryingLogId === item.id ? 'Resending...' : 'Resend'}</span>
                        {retryingLogId === item.id && <ButtonLineLoader />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 2: SYSTEM AUDIT LOGS ───────────────────────────────────────── */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-3">
          {loadingAudit ? (
            <LineLoader context="admin" message="Loading audit logs..." />
          ) : filteredAuditLogs.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
              <p className="font-heading text-[14px] text-[var(--muted)]">
                No audit logs match your search.
              </p>
            </div>
          ) : (
            filteredAuditLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div
                  key={log.id}
                  className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-heading px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text)] font-semibold">
                        {log.action}
                      </span>
                      <span className="font-heading text-[13px] text-[var(--text)]">
                        Admin:{' '}
                        <strong className="font-medium text-[var(--text)]">{log.adminEmail}</strong>
                      </span>
                    </div>

                    <span className="font-heading text-[12px] text-[var(--muted)] shrink-0">
                      {formatLogTime(log)}
                    </span>
                  </div>

                  {(log.targetEmail || log.targetUid) && (
                    <p className="font-heading text-[12px] text-[var(--muted)]">
                      Target:{' '}
                      <span className="text-[var(--text)] font-medium">
                        {log.targetEmail || log.targetUid}
                      </span>
                    </p>
                  )}

                  {hasDetails && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : (log.id || ''))}
                        className="flex items-center gap-1.5 text-[12px] font-heading text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>{isExpanded ? 'Hide payload parameters' : 'View payload parameters'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] overflow-x-auto">
                          <pre className="font-heading whitespace-pre-wrap break-words leading-relaxed text-[12px]">
                            {typeof log.details === 'string'
                              ? log.details
                              : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogsPage;
