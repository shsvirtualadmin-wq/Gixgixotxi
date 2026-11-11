import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Eye, EyeOff, Lock, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_PRO_BADGE_SETTINGS,
  PRO_BADGE_DESIGNS,
  type ProBadgeDesignId,
  type ProBadgeSettings,
} from '@/lib/proBadgeDesigns';

const LOCKED_PREVIEW_DESIGNS: ProBadgeDesignId[] = [
  'ember',
  'neon',
  'holo',
  'aurora',
  'diamond',
  'cosmic',
];

export const ProBadgeCustomizer: React.FC<{ userDisplayName?: string }> = ({
  userDisplayName,
}) => {
  const { user } = useAuth();
  const { settings, isActivePro, isPendingVerification, saving, saveProBadge } = useProBadge();

  const [draft, setDraft] = useState<ProBadgeSettings>(settings);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setDraft({ design: settings.design, visible: settings.visible });
  }, [settings.design, settings.visible]);

  const realName = useMemo(() => {
    const candidate = (userDisplayName || user?.displayName || 'Student').trim();
    return candidate || 'Student';
  }, [userDisplayName, user?.displayName]);

  const isDirty = draft.design !== settings.design || draft.visible !== settings.visible;

  const selectedMeta = useMemo(
    () => PRO_BADGE_DESIGNS.find((d) => d.id === draft.design) || PRO_BADGE_DESIGNS[0],
    [draft.design]
  );

  const handleSelectDesign = (id: ProBadgeDesignId) => {
    if (!isActivePro) return;
    setDraft((prev) => ({ ...prev, design: id }));
    setFeedback(null);
  };

  const handleToggleVisible = () => {
    if (!isActivePro) return;
    setDraft((prev) => ({ ...prev, visible: !prev.visible }));
    setFeedback(null);
  };

  const handleReset = () => {
    if (!isActivePro) return;
    setDraft(DEFAULT_PRO_BADGE_SETTINGS);
    setFeedback(null);
  };

  const handleSave = async () => {
    if (!isActivePro || saving) return;
    setFeedback(null);
    const res = await saveProBadge(draft);
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: draft.visible
          ? `Saved! Your "${selectedMeta.name}" Pro badge is now live everywhere.`
          : 'Saved! Your Pro badge is now hidden.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Could not save your Pro badge choice.',
      });
    }
  };

  // Locked view for Free users & Guests
  if (!isActivePro) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Pro Badge Collection (31 Designs)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Pro Only
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
              Active Boardly Pro members can equip any of 31 custom animated and static Pro badges next to their name across Commons, leaderboards, chat, crews, and profiles.
            </p>
          </div>

          {isPendingVerification ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Your payment is being verified</span>
            </div>
          ) : (
            <Link
              to="/dashboard/plans"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </Link>
          )}
        </div>

        {/* Preview of a few badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1 opacity-90">
          {LOCKED_PREVIEW_DESIGNS.map((id) => {
            const meta = PRO_BADGE_DESIGNS.find((d) => d.id === id);
            return (
              <div
                key={id}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-black/25 p-3 text-center"
              >
                <ProBadge design={id} size="md" animated priority />
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-300 truncate max-w-full">
                  <span className="truncate">{meta?.name || id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-5">
      {/* Header + Show My Badge Toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Pro Badge Collection
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              31 designs · #{selectedMeta.number} {selectedMeta.name}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Choose the badge shown next to your name across Boardly. Nothing is saved until you click Save.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={draft.visible}
          onClick={handleToggleVisible}
          className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            draft.visible
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              : 'bg-white/[0.04] border-white/[0.1] text-neutral-400'
          }`}
        >
          {draft.visible ? (
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>Show my badge</span>
          <span
            className={`inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
              draft.visible ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
            }`}
          >
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
        </button>
      </div>

      {/* Live Preview Next to User's Real Name */}
      <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Live Preview — Next to your real name
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {/* Profile / Large Preview */}
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5">
              <span className="text-sm font-bold text-white">{realName}</span>
              {draft.visible ? (
                <ProBadge design={draft.design} size="lg" animated priority />
              ) : (
                <span className="text-[11px] italic text-neutral-500">(Badge hidden)</span>
              )}
            </div>

            {/* Feed / Small Inline Preview */}
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5">
              <span className="text-xs font-semibold text-neutral-200">{realName}</span>
              {draft.visible && (
                <ProBadge design={draft.design} size="sm" animated priority />
              )}
              <span className="text-[11px] text-neutral-500">· 2m ago</span>
            </div>
          </div>
        </div>

        <div className="text-right sm:max-w-[220px]">
          <div className="text-xs font-bold text-white flex items-center sm:justify-end gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{selectedMeta.name}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
            {selectedMeta.tagline}
          </p>
        </div>
      </div>

      {/* Grid of all 31 Designs (each shown big + small next to a sample name) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
        {PRO_BADGE_DESIGNS.map((item) => {
          const isSelected = draft.design === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectDesign(item.id)}
              className={`group relative flex flex-col justify-between gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#D71921] bg-[#D71921]/10 shadow-[0_0_0_1px_rgba(215,25,33,0.45)]'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    #{String(item.number).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {item.name}
                  </span>
                  {!item.animated && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400">
                      Static
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#D71921] text-white shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Big badge + Small badge next to sample name */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
                <ProBadge design={item.id} size="lg" animated priority />
                <div className="flex items-center gap-1.5 min-w-0 rounded-lg bg-black/30 px-2 py-1 border border-white/[0.05]">
                  <span className="text-[11px] font-semibold text-neutral-300 truncate">
                    Alex
                  </span>
                  <ProBadge design={item.id} size="sm" animated priority />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Save and Reset Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.07]">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-bold text-neutral-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <div className="flex items-center gap-2.5">
          {isDirty && (
            <span className="text-[11px] text-amber-400 font-medium">
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProBadgeCustomizer;
