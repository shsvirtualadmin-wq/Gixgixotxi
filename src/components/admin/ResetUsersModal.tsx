import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Trash2,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  previewResetUsers,
  executeResetAllUsers,
  type UserResetPreview,
} from '@/services/adminService';
import { Button } from '@/components/ui/Button';
import { LineLoader } from '@/components/ui/LineLoader';

interface ResetUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
  onSuccess?: () => void;
}

export function ResetUsersModal({
  isOpen,
  onClose,
  adminEmail,
  onSuccess,
}: ResetUsersModalProps) {
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [preview, setPreview] = useState<UserResetPreview | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    deletedUsersCount: number;
    deletedRecordsCount: number;
    keptSuperadmins: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setExecuting(false);
      setProgress(null);
      setResult(null);
      setError(null);
      return;
    }

    setLoadingPreview(true);
    setError(null);
    previewResetUsers()
      .then((data) => {
        setPreview(data);
        setLoadingPreview(false);
      })
      .catch((err) => {
        console.error('[ResetUsersModal] Failed to load preview:', err);
        setError('Could not load user preview. Please verify Firestore permissions.');
        setLoadingPreview(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (confirmInput.trim() !== 'RESET') return;
    setExecuting(true);
    setError(null);
    setProgress({ done: 0, total: preview?.usersToDelete.length || 0 });

    try {
      const res = await executeResetAllUsers(adminEmail, (done, total) => {
        setProgress({ done, total });
      });
      setResult(res);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to complete user reset operation.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[var(--card)] border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-red-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                Reset All Users
              </h2>
              <p className="text-xs text-red-200/80">
                Superadmin Tool &bull; Clean Start
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={executing}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-heading">
          {/* Firebase Authentication Notice banner */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Info size={15} />
              <span>Firebase Authentication Client Limitation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90 font-normal">
              Firebase Authentication user accounts cannot be deleted directly from client code due to Firebase SDK security constraints. This tool resets all user database records in Firestore (profiles, streaks, attempts, applications, payments, and reviews). To delete authentication accounts, delete them manually in <strong>Firebase Console &gt; Authentication</strong>.
            </p>
            <div className="pt-1.5 border-t border-amber-500/30">
              <span className="font-bold text-amber-300 block mb-1">
                Accounts that MUST STAY (Do NOT delete in Console):
              </span>
              <ul className="list-disc list-inside font-mono text-[11px] text-amber-100 space-y-0.5">
                <li>shsvirtualadmin@gmail.com (Superadmin)</li>
                <li>support@boardly.cfd (Support / Superadmin)</li>
              </ul>
            </div>
          </div>

          {loadingPreview ? (
            <LineLoader context="admin" variant="section" />
          ) : result ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-2 text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
              <h3 className="text-base font-bold text-white">Reset Completed Successfully</h3>
              <p className="text-xs text-emerald-300">
                Deleted {result.deletedUsersCount} user documents and {result.deletedRecordsCount} related database records in batches of 400.
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                Protected superadmin accounts were skipped and preserved.
              </p>
              <div className="pt-2">
                <Button
                  onClick={onClose}
                  className="btn-red text-xs px-4 py-2 mx-auto"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] block">Users to Delete</span>
                  <span className="text-2xl font-bold text-red-400">
                    {preview?.usersToDelete.length ?? 0}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                    Will be deleted with all test data
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] block">Superadmins to Keep</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {preview?.superadminsKept.length ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                    Protected &bull; Never deleted
                  </span>
                </div>
              </div>

              {/* Protected accounts list */}
              <div>
                <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider block mb-1.5">
                  Protected Superadmin Accounts Kept:
                </span>
                <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-1 font-mono text-[11px]">
                  {preview?.superadminsKept.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        {admin.email}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        KEPT
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation input */}
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <label htmlFor="reset-confirm-input" className="block text-xs font-semibold text-white">
                  Type <span className="font-mono text-red-400 px-1 py-0.5 bg-red-950/50 rounded">RESET</span> to confirm deletion:
                </label>
                <input
                  id="reset-confirm-input"
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="RESET"
                  disabled={executing}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-white font-mono focus:border-red-500 outline-none uppercase"
                />
              </div>

              {/* Execution Progress */}
              {executing && progress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[var(--muted)]">
                    <span>Deleting user batches...</span>
                    <span>
                      {progress.done} / {progress.total} users
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{
                        width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={executing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteReset}
              loading={executing}
              loadingProgress={
                progress && progress.total > 0
                  ? Math.round((progress.done / progress.total) * 100)
                  : undefined
              }
              loadingMessages={['Resetting user batches...']}
              disabled={confirmInput.trim() !== 'RESET' || executing || loadingPreview}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Confirm &amp; Reset All Users</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
