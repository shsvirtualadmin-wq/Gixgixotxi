import { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { isQuotaExhaustedError } from '@/utils/quota';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { getBubbleTouchHandlers } from '@/utils/bubbleTouch';

export interface AdminDiagnosticError {
  code?: string;
  message: string;
  collection?: string;
  operation?: string;
  details?: unknown;
}

interface AdminDiagnosticBannerProps {
  error: AdminDiagnosticError | Error | null;
  collectionName?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function AdminDiagnosticBanner({
  error,
  collectionName,
  onRetry,
  retrying = false,
}: AdminDiagnosticBannerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!error) return null;

  // Friendly short quota notice when daily read limit is reached:
  // Do NOT render large red diagnostic box, and do NOT retry automatically
  if (isQuotaExhaustedError(error)) {
    return (
      <div
        role="alert"
        className="mb-4 lg-nothing-card px-4 py-3 text-sm flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="font-heading font-medium text-[13px] text-[var(--text)]">
            Daily database limit reached, try again later
          </span>
        </div>
      </div>
    );
  }

  const currentUser = auth.currentUser;
  const diagError = error as AdminDiagnosticError;
  const errorCode = diagError.code || 'FIRESTORE_ERROR';
  const rawMessage = error.message || 'An unexpected database error occurred.';
  const errorMessage =
    rawMessage.includes('projects/') ||
    rawMessage.includes('databases/') ||
    rawMessage.includes('gen-lang') ||
    rawMessage.includes('ai-studio')
      ? 'A database error occurred. Please verify your connection or permissions.'
      : rawMessage;
  const targetCollection = diagError.collection || collectionName || 'questions';

  return (
    <div
      role="alert"
      className="mb-5 lg-nothing-alert-red p-4 sm:p-5 text-[var(--text)] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3.5 flex-wrap sm:flex-nowrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#D71921]/20 border border-[#D71921]/50 flex items-center justify-center text-[#D71921] shrink-0 mt-0.5">
            <AlertTriangle size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-dot text-sm sm:text-base font-extrabold tracking-tight text-[var(--text)]">
                Diagnostic Alert
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 font-mono text-[#ff6b72]">
                {errorCode}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-1 leading-relaxed break-words">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            {...getBubbleTouchHandlers()}
            className="bubble-touch lg-nothing-pill min-h-[44px] px-3.5 py-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text)] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>{detailsOpen ? 'Hide details' : 'Details'}</span>
            {detailsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              {...getBubbleTouchHandlers({ ripple: true, disabled: retrying })}
              className="bubble-touch bubble-touch-ripple lg-nothing-red-btn px-4 py-2 text-xs font-heading font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} />
              <span>{retrying ? 'Retrying...' : 'Retry'}</span>
              {retrying && <ButtonLineLoader />}
            </button>
          )}
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-4 pt-3.5 space-y-3">
          <div className="nothing-dot-divider mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
              <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                Collection / Endpoint
              </span>
              <span className="font-mono text-[var(--text)] text-xs truncate block mt-0.5">
                {targetCollection}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
              <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                Current Auth Email
              </span>
              <span className="font-mono text-[var(--text)] text-xs truncate block mt-0.5">
                {currentUser?.email || '(None - Logged Out)'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
              <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                Current Auth UID
              </span>
              <span className="font-mono text-[var(--text)] text-xs truncate block mt-0.5">
                {currentUser?.uid || '(None)'}
              </span>
            </div>
          </div>

          {(errorCode.includes('permission-denied') ||
            errorCode === 'role_not_found' ||
            errorCode === 'email_not_verified') && (
            <div className="text-xs bg-black/30 p-3 rounded-2xl border border-[#D71921]/30 text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Authorization Notice:</strong> Account{' '}
              <code className="font-mono text-[var(--text)]">
                {currentUser?.email || 'unauthenticated'}
              </code>{' '}
              returned reason <code className="font-mono text-[#ff6b72]">{errorCode}</code> on{' '}
              <code className="font-mono text-[var(--text)]">/{targetCollection}</code>.
            </div>
          )}

          {errorCode.includes('deadline-exceeded') && (
            <div className="text-xs bg-black/30 p-3 rounded-2xl border border-[#D71921]/30 text-[var(--text-secondary)]">
              <strong className="text-[var(--text)]">Timeout:</strong> Query exceeded the client
              timeout. Try refreshing or checking network connectivity.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDiagnosticBanner;
