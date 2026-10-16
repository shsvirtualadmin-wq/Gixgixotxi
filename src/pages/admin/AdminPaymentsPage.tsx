import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from '@/services/adminService';
import type { PaymentRequest } from '@/types';

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentRequests(statusFilter);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load payment requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (req: PaymentRequest) => {
    if (!user?.email) return;
    setActionInProgress(req.id);
    try {
      await approvePaymentRequest(user.email, req);
      await loadData();
    } catch (err) {
      console.error('Failed to approve payment:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (req: PaymentRequest) => {
    if (!user?.email) return;
    const reason = window.prompt(
      'Optional rejection reason:',
      'Transaction ID could not be verified on Easypaisa/JazzCash portal.'
    );
    if (reason === null) return;

    setActionInProgress(req.id);
    try {
      await rejectPaymentRequest(user.email, req.id, req.userId, req.userEmail || '', reason);
      await loadData();
    } catch (err) {
      console.error('Failed to reject payment:', err);
    } finally {
      setActionInProgress(null);
    }
  };

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
            <CreditCard size={20} style={{ color: '#EC4899' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Manual Payment Receipts & Pro Upgrades
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Verify Easypaisa, JazzCash, SadaPay, and Nayapay transaction IDs and grant 30-day Pro access.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--r-input)',
              padding: '6px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Payment Requests List ────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="40%" />
              <div style={{ marginTop: 12 }}><Skeleton height={14} count={3} /></div>
            </GlassCard>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No payment upgrade requests found"
            description="When students submit payment proof via Easypaisa or JazzCash on /dashboard/plans, they appear here."
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map((req) => (
            <GlassCard key={req.id} style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      PKR {req.amount.toLocaleString()}
                    </span>
                    <Badge
                      color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}
                    >
                      {req.status}
                    </Badge>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: 'rgba(236,72,153,0.15)',
                        color: '#F472B6',
                      }}
                    >
                      {req.method}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Student: <strong style={{ color: 'var(--text)' }}>{req.displayName || req.userEmail || req.userId}</strong>
                    {req.userEmail && <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>({req.userEmail})</span>}
                  </p>
                </div>

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(req)}
                      loading={actionInProgress === req.id}
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      <CheckCircle2 size={14} /> Verify & Grant Pro
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReject(req)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Transaction details card */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', display: 'block' }}>
                    Transaction / Ref ID
                  </span>
                  <code style={{ fontSize: 14, fontWeight: 700, color: '#34D399', letterSpacing: '0.04em' }}>
                    {req.transactionId}
                  </code>
                </div>

                {req.screenshotUrl && (
                  <a
                    href={req.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: 'var(--brand)',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={13} /> View Attached Screenshot
                  </a>
                )}

                {req.rejectionReason && (
                  <div style={{ width: '100%', color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} />
                    <span>Rejection reason: {req.rejectionReason}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
