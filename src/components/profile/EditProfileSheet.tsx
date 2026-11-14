import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ShoppingBag, Check, Send, AlertCircle, CheckCircle2, Camera } from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useNavigate } from 'react-router-dom';
import { ACCENT_PRESETS, BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { AvatarPicture, AvatarFrame } from '@/components/koban/CosmeticRenderers';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { validateDisplayName } from '@/utils/usernameValidation';
import { submitNameRequest } from '@/services/nameRequestService';
import { useBodyScrollLock } from '@/utils/scrollLock';
import type { PublicProfile } from '@/types';

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicProfile;
  onChangePicture?: () => void;
  onSave: (updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }) => Promise<void>;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  isOpen,
  onClose,
  profile,
  onChangePicture,
  onSave,
}) => {
  const navigate = useNavigate();
  useBodyScrollLock(isOpen, 'edit-profile-sheet');

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [status, setStatus] = useState(profile.status || '');
  const [accent, setAccent] = useState(profile.accent || '#D71921');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentMessage, setRequestSentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setStatus(profile.status || '');
      setAccent(profile.accent || '#D71921');
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, profile.displayName, profile.bio, profile.status, profile.accent]);

  if (!isOpen) return null;

  const handleSendNameRequest = async () => {
    if (!profile.uid || !displayName.trim()) return;
    setIsSendingRequest(true);
    setError(null);
    try {
      await submitNameRequest({
        uid: profile.uid,
        requestedName: displayName.trim(),
        currentDisplayName: profile.displayName,
      });
      setRequestSentMessage(`Request for "${displayName.trim()}" submitted! Admin will review your requested name.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit name request to admin.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    // Validate reserved names & look-alikes
    const validation = validateDisplayName(displayName.trim(), profile.uid);
    if (!validation.valid) {
      setError(validation.error || 'This name is reserved. Send a request to the admin.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const cleanName = sanitizeStudentDisplayName(
        displayName.trim(),
        profile.studentId || profile.shortId || profile.uid.slice(0, 5)
      );
      const cleanBio = bio.trim().slice(0, 160);
      const cleanStatus = status.trim().slice(0, 40);

      await onSave({
        displayName: cleanName,
        bio: cleanBio,
        status: cleanStatus,
        accent,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      console.warn('[EditProfileSheet] failed to save profile:', err);
      setError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[1180] flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 1180,
      }}
    >
      <div
        className="w-full sm:max-w-xl bg-[var(--card)] border-t sm:border border-[var(--border)] sm:rounded-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh] shadow-2xl overflow-hidden"
        style={{ borderRadius: '24px 24px 0 0' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--text)]">Edit Profile</h2>
            <p className="text-xs text-[var(--muted)]">Customize your student card and appearance</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body with Live Preview */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              {(error.includes('reserved') || error.includes('Send a request')) && (
                <button
                  type="button"
                  disabled={isSendingRequest}
                  onClick={handleSendNameRequest}
                  className="relative overflow-hidden self-start mt-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-heading font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSendingRequest ? (
                    <>
                      <span>Sending...</span>
                      <ButtonLineLoader />
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Request to Admin</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {requestSentMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <span>{requestSentMessage}</span>
            </div>
          )}

          {/* ── LIVE PREVIEW OF CARD ── */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-semibold text-[var(--muted)] uppercase tracking-wider">
              Live Card Preview
            </span>
            <div className="w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-2)] shadow-sm">
              {/* Preview Banner */}
              <div className="relative h-24 w-full overflow-hidden">
                <BannerRenderer
                  bannerId={profile.banner || profile.equipped?.banner}
                  accentColor={accent}
                  animated
                />
              </div>

              {/* Preview Avatar & Details */}
              <div className="px-4 pb-4 -mt-7 flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <div className="flex items-end gap-2.5">
                    <div
                      className={`relative p-1 rounded-full bg-[var(--card-2)] ${
                        onChangePicture ? 'cursor-pointer group' : ''
                      }`}
                      onClick={onChangePicture}
                    >
                      <AvatarFrame itemId={profile.frame || profile.equipped?.frame || 'none'} size={52}>
                        <AvatarPicture
                          uid={profile.uid}
                          seed={profile.uid}
                          avatarId={profile.equipped?.avatar || profile.avatar}
                          size={44}
                        />
                      </AvatarFrame>
                      {onChangePicture && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#D71921] text-white border-2 border-[#121216] flex items-center justify-center shadow">
                          <Camera size={11} />
                        </span>
                      )}
                    </div>
                    {onChangePicture && (
                      <button
                        type="button"
                        onClick={onChangePicture}
                        className="mb-1 px-3 py-1.5 rounded-lg bg-[var(--card)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera size={13} className="text-[#D71921]" />
                        <span>Change picture</span>
                      </button>
                    )}
                  </div>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: accent, color: accent }}
                  >
                    Preview
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {displayName || 'Student'}
                    </span>
                  </div>

                  {status && (
                    <p className="text-xs text-[var(--muted)] mt-0.5 italic">
                      "{status}"
                    </p>
                  )}

                  {bio && (
                    <p className="text-xs text-[var(--text)] mt-1 line-clamp-2">
                      {bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── FORM FIELDS ── */}
          <div className="flex flex-col gap-4">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold text-[var(--text)]">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="Student"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--input-bg,var(--card-2))] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
              />
              <span className="text-[10px] text-[var(--muted)] font-mono">
                Plain text only. Emails and URLs are strictly prohibited.
              </span>
            </div>

            {/* Status Line (max 40 chars) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-semibold text-[var(--text)]">
                  Short Status Line
                </label>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {status.length}/40
                </span>
              </div>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value.slice(0, 40))}
                maxLength={40}
                placeholder="e.g. Grinding organic chemistry"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--input-bg,var(--card-2))] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors"
              />
            </div>

            {/* Bio (max 160 chars) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-semibold text-[var(--text)]">
                  About Me (Bio)
                </label>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {bio.length}/160
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                maxLength={160}
                rows={3}
                placeholder="Add a short bio so other students can get to know you."
                className="w-full p-3 rounded-xl bg-[var(--input-bg,var(--card-2))] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--red)] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Accent Color (8 presets) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-heading font-semibold text-[var(--text)]">
                Accent Color (8 Presets)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {ACCENT_PRESETS.map((preset) => {
                  const isSelected = accent === preset.hex;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAccent(preset.hex)}
                      title={preset.label}
                      className="h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative"
                      style={{
                        backgroundColor: preset.hex,
                        borderColor: isSelected ? '#FFFFFF' : 'transparent',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {isSelected && (
                        <Check size={16} className="text-white drop-shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link to Store Loadout */}
            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-[#E8A317]" />
                <div className="flex flex-col">
                  <span className="font-heading font-semibold text-xs text-[var(--text)]">
                    Equip Cosmetics
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Change frame, nameplate, effect, and picture in the store
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/store');
                }}
                className="h-9 px-3 rounded-lg border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card)] transition-colors cursor-pointer whitespace-nowrap"
              >
                Boardly Store
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <span>Saved! Your profile has been updated everywhere.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-5 rounded-xl border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || saveSuccess}
              className="relative overflow-hidden h-11 px-6 rounded-xl bg-[var(--red)] hover:bg-[var(--red-dark)] text-white text-xs font-heading font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span>Saving...</span>
                  <ButtonLineLoader />
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={15} />
                  <span>Saved</span>
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
};
