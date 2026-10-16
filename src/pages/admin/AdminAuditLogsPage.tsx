import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { fetchAuditLogs } from '@/services/adminService';
import type { AuditLog } from '@/types';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(120);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const st = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(st) ||
      log.adminEmail.toLowerCase().includes(st) ||
      (log.targetEmail && log.targetEmail.toLowerCase().includes(st)) ||
      (log.targetUid && log.targetUid.toLowerCase().includes(st))
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Audit log
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Immutable system logs of administrative actions, user overrides, and moderation.
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

      {/* ─── SEARCH TOOLBAR ─────────────────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)]">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
          <Search size={16} className="text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search logs by action, admin, or target student email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
        </div>
      </div>

      {/* ─── LOGS LIST ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-2"
            >
              <div className="h-4 bg-[var(--card-2)] rounded w-1/4" />
              <div className="h-4 bg-[var(--card-2)] rounded w-1/2" />
            </div>
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No audit logs match your search.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
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

                {/* Collapsible Details in Space Grotesk (NO monospace!) */}
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
    </div>
  );
}

export default AdminAuditLogsPage;
