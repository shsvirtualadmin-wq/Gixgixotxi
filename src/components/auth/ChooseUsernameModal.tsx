import React, { useState, useEffect } from 'react';
import { Check, Loader2, User, X } from 'lucide-react';
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

  const inputStateClass =
    status === 'available'
      ? 'cum-input--available'
      : status === 'taken' || status === 'invalid'
      ? 'cum-input--error'
      : '';

  return (
    <div
      className="cum-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-username-modal-title"
      data-testid="choose-username-modal"
    >
      <div className="cum-dialog">
        {allowSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={saving}
            aria-label="Skip for now"
            className="cum-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-start gap-3.5 mb-5">
          <div className="cum-badge">
            <User className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div className="space-y-1.5">
            <h2 id="choose-username-modal-title" className="cum-title">
              Choose your Boardly username
            </h2>
            <p className="cum-desc">
              Your unique @username lets you sign in with username or email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="choose-username-field" className="cum-label">
              Username
            </label>
            <div className="cum-input-wrap">
              <span className="cum-prefix">@</span>
              <input
                id="choose-username-field"
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
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={saving}
                className={`cum-input ${inputStateClass}`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {status === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--cum-muted)' }} />
                )}
                {status === 'available' && (
                  <Check className="w-4 h-4" strokeWidth={2.6} style={{ color: 'var(--cum-green)' }} />
                )}
                {(status === 'taken' || status === 'invalid') && (
                  <X className="w-4 h-4" strokeWidth={2.6} style={{ color: 'var(--cum-red-text)' }} />
                )}
              </div>
            </div>

            <div aria-live="polite">
              {message && (
                <p
                  data-testid="choose-username-status"
                  className={`cum-status ${
                    status === 'available'
                      ? 'cum-status--available'
                      : status === 'checking' || status === 'idle'
                      ? 'cum-status--muted'
                      : 'cum-status--error'
                  }`}
                >
                  {status === 'checking' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  )}
                  {status === 'available' && (
                    <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.6} />
                  )}
                  {(status === 'taken' || status === 'invalid') && (
                    <X className="w-3.5 h-3.5 shrink-0" strokeWidth={2.6} />
                  )}
                  <span>{message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="cum-rules-box">
            <span className="cum-rules-title">Rules</span>
            <p className="cum-rules-text">
              3–20 characters: letters, numbers, dots (.) and underscores (_) only.
            </p>
          </div>

          {submitError && (
            <div className="cum-submit-error" role="alert">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              data-testid="choose-username-submit-btn"
              disabled={saving || status !== 'available'}
              className="cum-btn-continue"
            >
              {saving ? 'Saving username...' : 'Save username'}
            </button>

            {allowSkip && onSkip && (
              <button
                type="button"
                data-testid="choose-username-skip-btn"
                disabled={saving}
                onClick={onSkip}
                className="cum-btn-skip"
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

