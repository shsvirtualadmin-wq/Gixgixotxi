import { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import type { CommonsPost } from '@/types/commons';
import { reportCommonsPost } from '@/services/commonsService';
import { sanitizeUserErrorMessage } from '@/utils/safeErrorMessage';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [reason, setReason] = useState<'spam' | 'harassment' | 'copyright' | 'inaccurate' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterUid) {
      setError(t('auth.signInToContinue'));
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
      console.error('[CommonsReportModal] report failed:', err);
      setError(sanitizeUserErrorMessage(err));
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
            <h3 className="text-sm font-bold text-[var(--text)] font-dot uppercase">{t('commons.reportTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-[var(--text)]">{t('commons.reportSubmittedTitle')}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {t('commons.reportSubmittedDesc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-xs text-[var(--text-muted)]">
              {t('commons.reportingLabel')} <strong className="text-[var(--text)] font-medium">&ldquo;{post.title}&rdquo;</strong>
            </p>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-500">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1.5">
                {t('commons.reportReason')}
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'spam', label: t('commons.reasonSpam') },
                  { id: 'inaccurate', label: t('commons.reasonInaccurate') },
                  { id: 'copyright', label: t('commons.reasonCopyright') },
                  { id: 'harassment', label: t('commons.reasonHarassment') },
                  { id: 'other', label: t('commons.reasonOther') },
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
                {t('commons.additionalDetails')}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('commons.reportDetailsPlaceholder')}
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs glass-row rounded-[16px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs font-medium rounded-full cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-4 py-2 text-xs font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? t('common.submitting') : t('commons.submitReport')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
