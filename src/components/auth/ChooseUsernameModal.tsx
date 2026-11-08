import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, AtSign, X } from 'lucide-react';
import { validateUsernameFormat } from '@/utils/usernameValidation';

interface ChooseUsernameModalProps {
  isOpen: boolean;
  initialSuggestion?: string;
  allowSkip?: boolean;
  onSkip?: () => void;
  onCheckAvailability: (username: string) => Promise<{
    available: boolean;
    username: string;
    normalized: string;
    reason?: string | null;
  }>;
  onSaveUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
}

export const ChooseUsernameModal: React.FC<ChooseUsernameModalProps> = ({
  isOpen,
  initialSuggestion = '',
  allowSkip = false,
  onSkip,
  onCheckAvailability,
  onSaveUsername,
}) => {
  const [username, setUsername] = useState(initialSuggestion);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const raw = username.trim();
    if (!raw) {
      setStatus('idle');
      setMessage(null);
      return;
    }

    const localCheck = validateUsernameFormat(raw);
    if (!localCheck.valid) {
      setStatus('invalid');
      setMessage(localCheck.reason || 'Invalid username format.');
      return;
    }

    setStatus('checking');
    setMessage('Checking availability...');
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await onCheckAvailability(raw);
      if (cancelled) return;
      if (res.available) {
        setStatus('available');
        setMessage(`Available (@${res.username})`);
      } else {
        setStatus('taken');
        setMessage(res.reason || 'Taken');
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, isOpen, onCheckAvailability]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const clean = username.trim();
    const localCheck = validateUsernameFormat(clean);
    if (!localCheck.valid) {
      setStatus('invalid');
      setMessage(localCheck.reason || 'Invalid username format.');
      return;
    }

    setSaving(true);
    try {
      const res = await onSaveUsername(localCheck.clean);
      if (!res.ok) {
        setSubmitError(res.error || 'Could not save username. Please try another.');
        setStatus('taken');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not save username.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-username-modal-title"
      data-testid="choose-username-modal"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#121214] p-6 text-white shadow-2xl">
        {allowSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={saving}
            aria-label="Skip for now"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921]">
            <AtSign className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="choose-username-modal-title"
              className="text-base sm:text-lg font-bold tracking-tight text-white"
            >
              Choose your Boardly username
            </h2>
            <p className="text-xs text-white/60">
              Your unique @username lets you sign in with username or email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.14em] text-white/60 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm select-none">
                @
              </span>
              <input
                type="text"
                data-testid="choose-username-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/\s+/g, ''));
                  setSubmitError(null);
                }}
                placeholder="e.g. ayesha_khan"
                maxLength={20}
                autoFocus
                disabled={saving}
                className="w-full pl-8 pr-9 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.12] text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/35 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {status === 'checking' && (
                  <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                )}
                {status === 'available' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {(status === 'taken' || status === 'invalid') && (
                  <AlertCircle className="w-4 h-4 text-[#D71921]" />
                )}
              </div>
            </div>

            {message && (
              <p
                data-testid="choose-username-status"
                className={`mt-1.5 text-[11px] font-medium ${
                  status === 'available'
                    ? 'text-emerald-400'
                    : status === 'checking'
                    ? 'text-white/50'
                    : 'text-[#ff8085]'
                }`}
              >
                {message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-white/45">
              3–20 characters: letters, numbers, dots (.) and underscores (_) only.
            </p>
          </div>

          {submitError && (
            <div className="p-2.5 rounded-xl bg-[#D71921]/10 border border-[#D71921]/30 text-[#ff8085] text-xs">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              data-testid="choose-username-submit-btn"
              disabled={saving || status !== 'available'}
              className="w-full py-2.5 px-4 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving username...' : 'Save username'}
            </button>

            {allowSkip && onSkip && (
              <button
                type="button"
                data-testid="choose-username-skip-btn"
                disabled={saving}
                onClick={onSkip}
                className="w-full py-2 px-4 rounded-xl text-white/55 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Set later in Profile / Settings
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
