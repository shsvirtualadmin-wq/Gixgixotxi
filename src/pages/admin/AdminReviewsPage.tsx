import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviews(statusFilter);
      setReviews(data);
    } catch (err) {
      console.warn('Failed to load reviews:', err);
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

  const handleConfirmDelete = async () => {
    if (!reviewToDelete || !user?.email) return;
    setActionInProgress(reviewToDelete);
    try {
      await deleteReview(user.email, reviewToDelete);
      setReviewToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Delete review error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Reviews
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Moderate student ratings, feedback, and testimonials before public display.
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

      {/* ─── STATUS FILTER BAR ──────────────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
            Status:
          </span>
          {[
            { id: 'all', label: 'All reviews' },
            { id: 'pending', label: 'Pending moderation' },
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

      {/* ─── REVIEWS CARDS FEED ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3"
            >
              <div className="h-4 bg-[var(--card-2)] rounded w-1/4" />
              <div className="h-4 bg-[var(--card-2)] rounded w-3/4" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No student reviews found in this moderation category.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const isPending = r.status === 'pending';
            const isApproved = r.status === 'approved';
            const isRejected = r.status === 'rejected';

            return (
              <div
                key={r.id}
                className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
                      {r.displayName || r.authorName || 'Student Reviewer'}
                    </h2>
                    <p className="font-heading text-[12px] text-[var(--muted)] mt-0.5">
                      {r.university || 'Entrance test candidate'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Rating in monochrome stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={13}
                          className={
                            idx < (r.rating || 5)
                              ? 'text-[var(--text)] fill-[var(--text)]'
                              : 'text-[var(--border)]'
                          }
                        />
                      ))}
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
                      {r.status}
                    </span>
                  </div>
                </div>

                <p className="font-heading text-[13px] text-[var(--text)] leading-relaxed">
                  "{r.text || ''}"
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(r.id)}
                    className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                    title="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        type="button"
                        disabled={actionInProgress === r.id}
                        onClick={() => handleReject(r.id)}
                        className="px-3 py-1.5 rounded-[12px] border border-[var(--red)]/40 text-[var(--red)] hover:bg-[var(--card-2)] text-[12px] font-heading font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {(!isApproved || isPending) && (
                      <button
                        type="button"
                        disabled={actionInProgress === r.id}
                        onClick={() => handleApprove(r.id)}
                        className="px-3.5 py-1.5 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[12px] font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {actionInProgress === r.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── CONFIRM DELETE REVIEW MODAL ─────────────────────────────────────── */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setReviewToDelete(null)}
          />
          <div className="relative w-full max-w-[400px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
              Delete review?
            </h3>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              Are you sure you want to delete this student review permanently?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviewsPage;
