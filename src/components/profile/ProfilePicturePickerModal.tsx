import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ShoppingBag, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { MATRIX_AVATARS, getDefaultAvatar, isValidAvatar } from '@/lib/matrixAvatarsData';
import { COSMETICS_CATALOG, getCosmeticById, type CosmeticItem } from '@/data/cosmeticsCatalog';
import { AvatarPicture } from '@/components/koban/CosmeticRenderers';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { broadcastPublicProfileUpdate } from '@/services/publicProfileService';

export interface ProfilePicturePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  currentAvatarId: string | null;
  ownedIds: string[];
  isSuperAdmin?: boolean;
  onSaveAvatar: (newAvatarId: string | null) => Promise<void>;
}

export const ProfilePicturePickerModal: React.FC<ProfilePicturePickerModalProps> = ({
  isOpen,
  onClose,
  uid,
  currentAvatarId,
  ownedIds,
  isSuperAdmin = false,
  onSaveAvatar,
}) => {
  const navigate = useNavigate();
  const normalizedEquippedId = useMemo(
    () => resolveCosmeticItemId(currentAvatarId, 'avatar'),
    [currentAvatarId]
  );
  const defaultMatrix = useMemo(() => getDefaultAvatar(uid), [uid]);
  const effectiveEquippedKey = normalizedEquippedId || defaultMatrix.key;

  const isEquippedStoreItem = useMemo(() => {
    if (!normalizedEquippedId) return false;
    const item = getCosmeticById(normalizedEquippedId);
    return Boolean(item && item.type === 'avatar');
  }, [normalizedEquippedId]);

  const [activeTab, setActiveTab] = useState<'free' | 'owned'>('free');
  const [selectedId, setSelectedId] = useState<string>(effectiveEquippedKey);
  const [saving, setSaving] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(effectiveEquippedKey);
      setActiveTab(isEquippedStoreItem ? 'owned' : 'free');
      setToastError(null);
      setSaving(false);
    }
  }, [isOpen, effectiveEquippedKey, isEquippedStoreItem]);

  const ownedStoreAvatars: CosmeticItem[] = useMemo(() => {
    const ownedSet = new Set(ownedIds);
    return COSMETICS_CATALOG.filter(
      (item) => item.type === 'avatar' && (isSuperAdmin || ownedSet.has(item.id))
    );
  }, [ownedIds, isSuperAdmin]);

  const handleSave = async () => {
    if (saving) return;
    if (!selectedId) return;

    const isValidFree = isValidAvatar(selectedId);
    const isValidOwnedStore = ownedStoreAvatars.some((item) => item.id === selectedId);
    if (!isValidFree && !isValidOwnedStore) {
      setToastError('Select a free system avatar or an avatar you own from the Store.');
      return;
    }

    setSaving(true);
    setToastError(null);

    const previousAvatarId = normalizedEquippedId;

    // Optimistic broadcast so all mounted avatars update immediately
    broadcastPublicProfileUpdate(uid, {
      avatar: selectedId,
      equippedAvatar: selectedId,
      equipped: {
        avatar: selectedId,
      },
    });

    try {
      await onSaveAvatar(selectedId);
      onClose();
    } catch (err: any) {
      // Roll back optimistic state on error
      broadcastPublicProfileUpdate(uid, {
        avatar: previousAvatarId,
        equippedAvatar: previousAvatarId,
        equipped: {
          avatar: previousAvatarId,
        },
      });
      setToastError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not update profile picture. Rolled back to previous avatar.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      variant="sheet"
      maxWidthClass="max-w-lg"
      ariaLabel="Change Profile Picture"
    >
      <div
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(86dvh, 680px)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]">
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--text)]">
              Change Profile Picture
            </h2>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Choose a free dot-matrix avatar or equip an avatar unlocked from the Store.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
            aria-label="Close avatar picker"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3.5 pb-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab('free')}
              className={`py-2 px-3 rounded-lg text-xs font-heading font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'free'
                  ? 'bg-[#D71921] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Free ({MATRIX_AVATARS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('owned')}
              className={`py-2 px-3 rounded-lg text-xs font-heading font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'owned'
                  ? 'bg-[#D71921] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Sparkles size={14} />
              <span>Owned ({ownedStoreAvatars.length})</span>
            </button>
          </div>
        </div>

        {/* Error Toast Banner */}
        {toastError && (
          <div
            role="alert"
            className="mx-5 mt-3 p-3 rounded-xl bg-[#D71921]/10 border border-[#D71921]/30 text-[#D71921] text-xs flex items-center gap-2 shrink-0"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{toastError}</span>
          </div>
        )}

        {/* Scrollable Avatar Grid Body */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {activeTab === 'free' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {MATRIX_AVATARS.map((av) => {
                const isEquipped = effectiveEquippedKey === av.key;
                const isSelected = selectedId === av.key;
                return (
                  <button
                    key={av.key}
                    type="button"
                    onClick={() => setSelectedId(av.key)}
                    className={`relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all text-center border ${
                      isSelected
                        ? 'bg-[var(--surface-2)] border-[#D71921] ring-2 ring-[#D71921]/30'
                        : isEquipped
                          ? 'bg-[var(--surface-2)] border-[var(--text)]/40'
                          : 'bg-[var(--surface-2)]/60 border-[var(--border)] hover:border-[var(--text)]/30'
                    }`}
                  >
                    {isEquipped && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921] font-mono text-[9px] font-bold uppercase tracking-wider">
                        Equipped
                      </span>
                    )}
                    <div className="relative">
                      <MatrixAvatar
                        uid={uid}
                        seed={uid}
                        avatarKey={av.key}
                        variant={defaultMatrix.variant}
                        size={52}
                        className="rounded-full"
                      />
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D71921] text-white flex items-center justify-center shadow">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[var(--text)] line-clamp-1 w-full">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : ownedStoreAvatars.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
                <ShoppingBag size={22} />
              </div>
              <h3 className="font-heading font-bold text-sm text-[var(--text)]">
                No Store Avatars Owned Yet
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-xs mt-1 mb-4">
                Unlock animated and illustrated profile pictures in the Koban Store using your earned Kobans.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/store');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b51219] text-white text-xs font-heading font-bold inline-flex items-center gap-2 transition-colors"
              >
                <ShoppingBag size={14} />
                Browse Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ownedStoreAvatars.map((item) => {
                const isEquipped = effectiveEquippedKey === item.id;
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`relative p-3.5 rounded-xl flex flex-col items-center gap-2.5 transition-all text-center border ${
                      isSelected
                        ? 'bg-[var(--surface-2)] border-[#D71921] ring-2 ring-[#D71921]/30'
                        : isEquipped
                          ? 'bg-[var(--surface-2)] border-[var(--text)]/40'
                          : 'bg-[var(--surface-2)]/60 border-[var(--border)] hover:border-[var(--text)]/30'
                    }`}
                  >
                    {isEquipped && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921] font-mono text-[9px] font-bold uppercase tracking-wider">
                        Equipped
                      </span>
                    )}
                    <div className="relative">
                      <AvatarPicture
                        avatarId={item.id}
                        uid={uid}
                        seed={uid}
                        size={64}
                        className="rounded-full"
                      />
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D71921] text-white flex items-center justify-center shadow">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div className="w-full">
                      <div className="text-xs font-heading font-semibold text-[var(--text)] truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mt-0.5">
                        {item.tier}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div
          className="px-5 pt-3.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-end gap-2.5 shrink-0"
          style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedId === effectiveEquippedKey}
            className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b51219] text-white text-xs font-heading font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfilePicturePickerModal;
