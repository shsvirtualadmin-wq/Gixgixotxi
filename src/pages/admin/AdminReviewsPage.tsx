import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchReviews,
  approveReview,
  rejectReview,
  deleteReview,
} from '@/services/adminService';
import type { StudentReview } from '@/types';

export function AdminReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviews(statusFilter);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (reviewId: string) => {
    if (!user?.email) return;
    setActionInProgress(reviewId);
    try {
      await approveReview(user.email, reviewId);
      await loadData();
    } catch (err) {
      console.error('Approve review error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!user?.email) return;
    setActionInProgress(reviewId);
    try {
      await rejectReview(user.email, reviewId);
      await loadData();
    } catch (err) {
      console.error('Reject review error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!user?.email) return;
    if (!window.confirm('Delete this review permanently?')) return;
    setActionInProgress(reviewId);
    try {
      await deleteReview(user.email, reviewId);
      await loadData();
    } catch (err) {
      console.error('Delete review error:', err);
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
            <MessageSquare size={20} style={{ color: '#06B6D4' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Student Review Moderation
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Moderate authentic testimonials submitted by students before they appear on the public platform.
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
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved & Live</option>
            <option value="rejected">Rejected</option>
          </select>

          <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Reviews Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="40%" />
              <div style={{ marginTop: 12 }}><Skeleton height={14} count={3} /></div>
            </GlassCard>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No student reviews found"
            description="Reviews submitted by students in /dashboard/reviews will appear here for moderation."
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((r) => (
            <GlassCard key={r.id} style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          style={{
                            color: i < r.rating ? '#FBBF24' : 'var(--text-faint)',
                            fill: i < r.rating ? '#FBBF24' : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <Badge
                      color={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}
                    >
                      {r.status}
                    </Badge>
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {r.authorName || r.displayName || 'Anonymous Student'}
                    {r.university && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                        • {r.university}
                      </span>
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.status !== 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(r.id)}
                      loading={actionInProgress === r.id}
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      <CheckCircle2 size={14} /> Approve
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReject(r.id)}
                      loading={actionInProgress === r.id}
                      style={{ color: 'var(--warning)' }}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.id)}
                    loading={actionInProgress === r.id}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Review Text */}
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text)',
                  lineHeight: 1.6,
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                "{r.text}"
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
