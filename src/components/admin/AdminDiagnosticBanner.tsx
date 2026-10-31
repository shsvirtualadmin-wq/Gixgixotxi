import { AlertTriangle, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { isQuotaExhaustedError } from '@/utils/quota';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

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
  if (!error) return null;

  // Friendly short quota notice when daily read limit is reached:
  // Do NOT render large red diagnostic box, and do NOT retry automatically
  if (isQuotaExhaustedError(error)) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-xl bg-[var(--card)] border border-amber-500/30 text-[var(--text)] px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="font-heading font-medium text-[13px]">
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
  const errorMessage = rawMessage.includes('projects/') || rawMessage.includes('databases/') || rawMessage.includes('gen-lang') || rawMessage.includes('ai-studio')
    ? 'A database error occurred. Please verify your connection or permissions.'
    : rawMessage;
  const targetCollection = diagError.collection || collectionName || 'questions';

  return (
    <div
      role="alert"
      className="mb-6 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-100 p-5 shadow-xl shadow-red-950/60 transition-all duration-200"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-400 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
          <AlertTriangle size={22} className="animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Database Diagnostic Alert</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/40 border border-red-500 font-mono">
                {errorCode}
              </span>
            </h3>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[130px]"
              >
                <RefreshCw size={13} />
                <span>{retrying ? 'Retrying...' : 'Retry Query'}</span>
                {retrying && <ButtonLineLoader />}
              </button>
            )}
          </div>

          <p className="text-sm text-red-200 mt-1.5 font-medium leading-relaxed">
            {errorMessage}
          </p>

          {/* Diagnostic Context Table */}
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/30">
              <span className="text-red-300 font-semibold uppercase text-[10px] block">Collection Queried</span>
              <span className="font-mono text-white text-xs truncate block">{targetCollection}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/30">
              <span className="text-red-300 font-semibold uppercase text-[10px] block">Current Auth Email</span>
              <span className="font-mono text-white text-xs truncate block">
                {currentUser?.email || '(None - Logged Out)'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/30">
              <span className="text-red-300 font-semibold uppercase text-[10px] block">Current Auth UID</span>
              <span className="font-mono text-white text-xs truncate block">
                {currentUser?.uid || '(None)'}
              </span>
            </div>
          </div>

          {/* Contextual Suggestions */}
          {errorCode.includes('permission-denied') && (
            <div className="mt-3 text-xs bg-red-900/40 p-2.5 rounded-lg border border-red-500/30 text-red-200">
              <strong>Security Rule Failure:</strong> The current user (<code className="text-white">{currentUser?.email || 'unauthenticated'}</code>) does not have Firestore permissions for <code className="text-white">/{targetCollection}</code>. Superadmin privileges are granted to <code className="text-white">shsvirtualadmin@gmail.com</code> or accounts with <code className="text-white">role: &quot;admin&quot;</code> in <code className="text-white">users/{currentUser?.uid || 'uid'}</code>.
            </div>
          )}

          {errorCode.includes('deadline-exceeded') && (
            <div className="mt-3 text-xs bg-red-900/40 p-2.5 rounded-lg border border-red-500/30 text-red-200">
              <strong>Timeout:</strong> Firestore query exceeded the client timeout. Ensure unpaginated <code className="text-white">getDocs()</code> is not run across large collections. Use <code className="text-white">limit(50)</code> or <code className="text-white">getCountFromServer()</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDiagnosticBanner;
