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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0c0c0e] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h3 className="text-sm font-bold text-neutral-100 font-mono">REPORT CONTENT</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-neutral-100">Report Submitted</p>
            <p className="text-xs text-neutral-400">
              Thank you for keeping Boardly Commons clean and safe for everyone. Posts with 3+ reports are automatically hidden pending superadmin review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-xs text-neutral-400">
              Reporting: <strong className="text-neutral-200 font-medium">"{post.title}"</strong>
            </p>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
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
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-neutral-800 bg-neutral-900/40 text-xs text-neutral-300 cursor-pointer hover:border-neutral-700 hover:bg-neutral-900"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.id}
                      checked={reason === opt.id}
                      onChange={() => setReason(opt.id as any)}
                      className="text-red-600 focus:ring-0"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help our moderators understand the issue..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors disabled:opacity-50"
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
