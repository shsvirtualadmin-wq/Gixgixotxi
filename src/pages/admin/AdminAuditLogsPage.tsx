import { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Search,
  RefreshCw,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
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
      const data = await fetchAuditLogs(100);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Terminal size={20} style={{ color: '#10B981' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Immutable Audit Logs
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Append-only security log recording every administrative action, user override, and approval.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ── Search Toolbar ───────────────────────────────────────────── */}
      <GlassCard style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-input)',
            padding: '0 12px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search logs by action, admin, target UID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontSize: 13,
              padding: '10px 0',
              outline: 'none',
            }}
          />
        </div>
      </GlassCard>

      {/* ── Logs Feed ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="60%" />
            </GlassCard>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No audit logs found"
            description="All privileged actions executed by shsvirtualadmin@gmail.com will be recorded here."
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLogs.map((log, i) => {
            const id = log.id || `log_${i}`;
            const isExpanded = expandedId === id;
            let timeStr = 'Unknown time';
            if (log.timestamp && 'toDate' in log.timestamp) {
              timeStr = log.timestamp.toDate().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
            }

            return (
              <GlassCard
                key={id}
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  border: isExpanded ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                  background: isExpanded ? 'rgba(16,185,129,0.04)' : 'var(--surface)',
                }}
                onClick={() => setExpandedId(isExpanded ? null : id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        color: '#34D399',
                      }}
                    >
                      {log.action}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {log.targetEmail || log.targetUid || log.adminEmail}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-faint)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> {log.adminEmail}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {timeStr}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Event Payload & Details:
                    </p>
                    <pre
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        padding: '12px',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#A7F3D0',
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
