import React, { useState } from 'react';
import { X, Check, Sparkles, ExternalLink } from 'lucide-react';
import { ACCENT_PRESETS, BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import { Link } from 'react-router-dom';
import type { PublicProfile, UserProfile } from '@/types';

import { validateDisplayName } from '@/utils/usernameValidation';
import { submitNameRequest } from '@/services/nameRequestService';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicProfile: PublicProfile;
  userProfile?: UserProfile | null;
  onSave: (updates: {
    displayName: string;
    bio: string;
    status: string;
    accent: string;
  }) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  publicProfile,
  userProfile,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(
    publicProfile.displayName || userProfile?.displayName || ''
  );
  const [bio, setBio] = useState(publicProfile.bio || userProfile?.bio || '');
  const [status, setStatus] = useState(publicProfile.status || userProfile?.status || '');
  const [accent, setAccent] = useState(publicProfile.accent || userProfile?.accent || '#D71921');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentMessage, setRequestSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendNameRequest = async () => {
    if (!publicProfile.uid || !displayName.trim()) return;
    setIsSendingRequest(true);
    setError(null);
    try {
      await submitNameRequest({
        uid: publicProfile.uid,
        requestedName: displayName.trim(),
        currentDisplayName: publicProfile.displayName,
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
      setError('Display name cannot be empty');
      return;
    }

    const validation = validateDisplayName(displayName.trim(), publicProfile.uid);
    if (!validation.valid) {
      setError(validation.error || 'This name is reserved. Send a request to the admin.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        displayName: displayName.trim().slice(0, 40),
        bio: bio.trim().slice(0, 160),
        status: status.trim().slice(0, 40),
        accent,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-[#0e0e11] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
          <h3 className="text-sm font-bold text-neutral-100 font-mono">Edit profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Live Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-300 block">Live preview</span>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-sm">
              <div className="h-20 w-full relative">
                <BannerRenderer
                  bannerId={publicProfile.banner}
                  accentColor={accent}
                  animated={false}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-3 pb-3">
                <div className="-mt-6 mb-2 inline-block">
                  <AvatarFrame itemId={publicProfile.frame || 'none'} size={52} forceStatic>
                    <AvatarPicture
                      itemId={publicProfile.avatar || 'none'}
                      size={44}
                      photoURL={publicProfile.photoURL}
                    />
                  </AvatarFrame>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Nameplate
                      itemId={publicProfile.nameplate || 'none'}
                      name={displayName || 'Student'}
                      forceStatic
                    />
                  </div>
                  {status && (
                    <p className="text-[11px] text-neutral-400 font-mono truncate">{status}</p>
                  )}
                  {bio && <p className="text-xs text-neutral-300 line-clamp-2 pt-1">{bio}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="Your name"
              className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Status Line */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 block">Status line</label>
              <span className="text-[10px] font-mono text-neutral-500">{status.length}/40</span>
            </div>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              maxLength={40}
              placeholder="e.g. Exploring concepts & learning together..."
              className="w-full text-xs bg-surface-muted border border-border rounded-lg p-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-secondary block">About me (Bio)</label>
              <span className="text-[10px] text-muted">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Add a short bio so other students can get to know you."
              className="w-full text-xs bg-surface-muted border border-border rounded-lg p-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-[10px] text-muted">Plain text only. Links will not be rendered.</p>
          </div>

          {/* Accent Color Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">Accent color (8 presets)</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ACCENT_PRESETS.map((p) => {
                const isSelected = accent.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAccent(p.hex)}
                    title={p.label}
                    className={`h-9 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-white scale-105 shadow-md'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                    style={{ backgroundColor: p.hex }}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store link */}
          <div className="pt-2 border-t border-neutral-850">
            <Link
              to="/store?tab=my_items"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>Customize banner, frame & nameplate in Boardly Store</span>
              </div>
              <ExternalLink size={13} className="text-neutral-500" />
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
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
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
              <span>{requestSentMessage}</span>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="relative overflow-hidden flex-1 min-h-[44px] px-4 rounded-lg border border-red-700 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors shadow-md shadow-red-950/40 flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <span>Saving...</span>
                  <ButtonLineLoader />
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
