import { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CommonsPost } from '@/types/commons';
import { reportCommonsPost } from '@/services/commonsService';

interface CommonsReportModalProps {
  post: CommonsPost | null;
  isOpen: boolean;
  onClose: () => void;
  reporterUid: string | null;
}

export function CommonsReportModal({
  post,
  isOpen,
  onClose,
  reporterUid,
}: CommonsReportModalProps) {
  const [reason, setReason] = useState<'spam' | 'harassment' | 'copyright' | 'inaccurate' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterUid) {
      setError('Please sign in to report content.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reportCommonsPost({
        postId: post.id,
        reporterUid,
        reason,
        details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-[28px] glass-panel p-6 space-y-4 text-[var(--text)]">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-[#D71921]" />
            <h3 className="text-sm font-bold text-[var(--text)] font-dot">REPORT CONTENT</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-[var(--text)]">Report Submitted</p>
            <p className="text-xs text-[var(--text-muted)]">
              Thank you for keeping Boardly Commons clean and safe for everyone. Posts with 3+ reports are automatically hidden pending superadmin review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-xs text-[var(--text-muted)]">
              Reporting: <strong className="text-[var(--text)] font-medium">"{post.title}"</strong>
            </p>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-500">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1.5">
                Reason for report
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'spam', label: 'Spam, advertising or irrelevant content' },
                  { id: 'inaccurate', label: 'Misleading formulas, incorrect solutions or exam fraud' },
                  { id: 'copyright', label: 'Unauthorized proprietary book scans / copyright' },
                  { id: 'harassment', label: 'Harassment, hate speech or abusive remarks' },
                  { id: 'other', label: 'Other violation of Community Guidelines' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-[16px] text-xs cursor-pointer transition-colors ${
                      reason === opt.id
                        ? 'glass-row border-[#D71921] text-[var(--text)] font-medium'
                        : 'glass-row text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.id}
                      checked={reason === opt.id}
                      onChange={() => setReason(opt.id as any)}
                      className="accent-[#D71921] focus:ring-0"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help our moderators understand the issue..."
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs glass-row rounded-[16px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#D71921]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs font-medium rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-4 py-2 text-xs font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
