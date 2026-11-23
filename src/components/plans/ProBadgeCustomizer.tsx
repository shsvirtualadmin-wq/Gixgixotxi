import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Eye, EyeOff, Lock, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_PLUS_BADGE_ID,
  PLUS_BADGE_DESIGNS,
  getPlusBadgeById,
} from '@/lib/plusBadgeDesigns';

const LOCKED_PREVIEW_IDS: readonly number[] = [1, 2, 3, 10, 19, 27];

interface PlusDraft {
  plusBadgeId: number | null;
  visible: boolean;
}

export const ProBadgeCustomizer: React.FC<{ userDisplayName?: string }> = ({
  userDisplayName,
}) => {
  const { user } = useAuth();
  const {
    settings,
    plusBadgeId,
    isActivePlus,
    isPendingVerification,
    saving,
    saveProBadge,
  } = useProBadge();

  const [draft, setDraft] = useState<PlusDraft>({
    plusBadgeId,
    visible: settings.visible,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setDraft({ plusBadgeId, visible: settings.visible });
  }, [plusBadgeId, settings.visible]);

  const realName = useMemo(() => {
    const candidate = (userDisplayName || user?.displayName || 'Student').trim();
    return candidate || 'Student';
  }, [userDisplayName, user?.displayName]);

  const isDirty = draft.plusBadgeId !== plusBadgeId || draft.visible !== settings.visible;

  const selectedMeta = useMemo(
    () => getPlusBadgeById(draft.plusBadgeId),
    [draft.plusBadgeId]
  );

  const handleSelectDesign = (id: number) => {
    if (!isActivePlus) return;
    setDraft((prev) => ({ ...prev, plusBadgeId: id }));
    setFeedback(null);
  };

  const handleToggleVisible = () => {
    if (!isActivePlus) return;
    setDraft((prev) => ({ ...prev, visible: !prev.visible }));
    setFeedback(null);
  };

  const handleReset = () => {
    if (!isActivePlus) return;
    setDraft({ plusBadgeId: DEFAULT_PLUS_BADGE_ID, visible: true });
    setFeedback(null);
  };

  const handleSave = async () => {
    if (!isActivePlus || saving) return;
    setFeedback(null);
    const res = await saveProBadge({
      design: settings.design,
      plusBadgeId: draft.plusBadgeId,
      visible: draft.visible,
    });
    if (res.ok) {
      setFeedback({
        type: 'success',
        text:
          draft.visible && selectedMeta
            ? `Saved! Your "${selectedMeta.name}" PLUS badge is now live everywhere.`
            : 'Saved! Your PLUS badge is now hidden.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Could not save your badge choice.',
      });
    }
  };

  // Keep existing locked view for users without an active PLUS plan
  if (!isActivePlus) {
    return (
      <div className="space-y-5">
        <div className="stg-group">
          <div className="stg-group-label">Plus Membership Required</div>
          <div className="stg-card">
            <div className="stg-row stg-row--static">
              <div className="stg-row-left">
                <span className="stg-row-icon">
                  <Lock className="w-4 h-4 text-amber-500" />
                </span>
                <div className="min-w-0">
                  <div className="stg-row-label font-semibold">
                    PLUS Badge Collection (50 Designs)
                  </div>
                  <div className="text-xs text-[var(--menu-subtext)]">
                    Active Boardly Plus members only
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                Plus
              </span>
            </div>

            {isPendingVerification ? (
              <div className="stg-row stg-row--static">
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </span>
                  <span className="stg-row-label">Payment verification in progress</span>
                </div>
                <span className="stg-row-value">Pending</span>
              </div>
            ) : (
              <Link to="/dashboard/plan" className="stg-row">
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <Crown className="w-4 h-4 text-[#D71921]" />
                  </span>
                  <span className="stg-row-label font-semibold text-[#D71921]">
                    Upgrade to Plus
                  </span>
                </div>
                <span className="stg-row-value">View Plans</span>
              </Link>
            )}
          </div>
          <p className="stg-footnote">
            Active Boardly Plus members can choose from 50 unique animated PLUS badge designs and show them next to their name across Commons, leaderboards, chat, crews, and profiles.
          </p>
        </div>

        {/* Preview of a few badges */}
        <div className="stg-group">
          <div className="stg-group-label">Sample Designs</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {LOCKED_PREVIEW_IDS.map((id) => {
              const meta = getPlusBadgeById(id);
              if (!meta) return null;
              return (
                <div
                  key={id}
                  className="stg-card flex flex-col items-center justify-center gap-2 p-4 text-center"
                >
                  <PlusBadge id={id} size="md" animated priority />
                  <div className="text-xs font-semibold text-[var(--menu-text)] truncate max-w-full">
                    {meta.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky Live Preview at the Top */}
      <div className="stg-sticky-preview">
        <div className="stg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--menu-subtext)]">
              Live Preview
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--menu-text)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {selectedMeta
                  ? `#${String(selectedMeta.number).padStart(2, '0')} ${selectedMeta.name}`
                  : 'No badge selected'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Profile / Large Preview */}
            <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--menu-bg)] border border-[var(--menu-divider)] px-3.5 py-2 min-w-0">
              <span className="text-sm font-bold text-[var(--menu-text)] truncate max-w-[140px]">
                {realName}
              </span>
              {draft.visible && draft.plusBadgeId !== null ? (
                <PlusBadge
                  id={draft.plusBadgeId}
                  size="lg"
                  animated
                  priority
                />
              ) : (
                <span className="text-xs italic text-[var(--menu-subtext)]">
                  {draft.visible ? '(None)' : '(Hidden)'}
                </span>
              )}
            </div>

            {/* Feed / Small Inline Preview */}
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--menu-bg)] border border-[var(--menu-divider)] px-3 py-2 min-w-0">
              <span className="text-xs font-semibold text-[var(--menu-text)] truncate max-w-[110px]">
                {realName}
              </span>
              {draft.visible && draft.plusBadgeId !== null && (
                <PlusBadge
                  id={draft.plusBadgeId}
                  size="sm"
                  animated
                  priority
                />
              )}
              <span className="text-[11px] text-[var(--menu-subtext)]">· 2m</span>
            </div>
          </div>

          <p className="text-xs text-[var(--menu-subtext)] leading-snug m-0">
            {selectedMeta
              ? selectedMeta.tagline
              : 'Pick any of the 50 PLUS badge designs below and tap Save.'}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-[#D71921] dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Visibility Toggle Group */}
      <div className="stg-group !mt-1">
        <div className="stg-card">
          <div className="stg-row" onClick={handleToggleVisible}>
            <div className="stg-row-left">
              <span className="stg-row-icon">
                {draft.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </span>
              <span className="stg-row-label">Show my badge</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.visible}
              aria-label="Show my badge"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisible();
              }}
              className="stg-switch"
            >
              <span className="stg-switch-thumb" />
            </button>
          </div>
        </div>
        <p className="stg-footnote">
          Display your equipped PLUS badge next to your name across Commons, leaderboards, chat, crews, and profiles.
        </p>
      </div>

      {/* All 50 Designs List */}
      <div className="stg-group">
        <div className="stg-group-label">50 Badge Designs</div>
        <div className="stg-card">
          {PLUS_BADGE_DESIGNS.map((item) => {
            const isSelected = draft.plusBadgeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectDesign(item.id)}
                className="stg-row"
              >
                <div className="stg-row-left">
                  <span className="text-xs font-mono text-[var(--menu-subtext)] w-7 shrink-0">
                    #{String(item.number).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="stg-row-label font-semibold">
                        {item.name}
                      </span>
                      {!item.animated && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-[var(--menu-icon-bg)] text-[var(--menu-subtext)]">
                          Static
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--menu-subtext)] truncate">
                      {item.tagline}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <PlusBadge
                    id={item.id}
                    size="md"
                    animated
                    listMode
                  />
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected
                        ? 'bg-[#D71921] border-[#D71921] text-white'
                        : 'border-[var(--menu-divider)] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="stg-footnote">
          Nothing is saved until you tap Save in the bottom bar.
        </p>
      </div>

      {/* Floating Bottom Bar: Reset + Save */}
      <div className="stg-floating-bar">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="stg-btn-secondary !w-auto min-w-[112px] !min-h-[44px] !py-2 !px-4"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="stg-btn-primary flex-1 !min-h-[44px] !py-2 !px-5"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProBadgeCustomizer;
