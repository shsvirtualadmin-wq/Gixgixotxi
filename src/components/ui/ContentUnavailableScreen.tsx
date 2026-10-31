import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Logo } from '@/components/ui/Logo';
import { useHomeUrl, useSmartBack } from '@/utils/homeUrl';

export interface ContentUnavailableScreenProps {
  title?: string;
  message?: string;
  badge?: string;
  backUrl?: string;
  backLabel?: string;
}

export const ContentUnavailableScreen: React.FC<ContentUnavailableScreenProps> = ({
  title = 'This content is no longer available',
  message = 'The user profile, post, or resource you are looking for may have been deleted, moved, or the link is outdated.',
  badge = 'Notice',
  backUrl,
  backLabel,
}) => {
  const homeUrl = useHomeUrl();
  const handleBack = useSmartBack();
  const commonsUrl = homeUrl === '/dashboard/commons' ? '/dashboard/commons' : '/commons';

  return (
    <>
      <PageMeta
        title={`${title} — Boardly`}
        description={message}
        noindex={true}
      />
      <div className="pt-28 pb-24 boardly-container min-h-[65vh] flex items-center justify-center px-4">
        <div className="glass-panel max-w-lg w-full text-center p-8 sm:p-12 space-y-6 rounded-[32px] sm:rounded-[36px] border border-[var(--border)] shadow-xl">
          <div className="flex justify-center pb-1">
            <Link to={homeUrl} aria-label="Boardly Home">
              <Logo height={32} className="text-[var(--text)] hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
              <AlertCircle size={14} className="text-[#D71921]" />
              <span>{badge}</span>
            </span>
          </div>

          <div className="space-y-3">
            <h1
              className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight font-heading"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {title}
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={homeUrl}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl active:scale-[0.98] cursor-pointer"
            >
              <Home size={15} />
              <span>Back to Home</span>
            </Link>

            {backUrl && backLabel ? (
              <Link
                to={backUrl}
                className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl active:scale-[0.98] cursor-pointer"
              >
                <BookOpen size={15} />
                <span>{backLabel}</span>
              </Link>
            ) : (
              <Link
                to={commonsUrl}
                className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl active:scale-[0.98] cursor-pointer"
              >
                <BookOpen size={15} />
                <span>Explore Commons</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="btn-outline w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentUnavailableScreen;
