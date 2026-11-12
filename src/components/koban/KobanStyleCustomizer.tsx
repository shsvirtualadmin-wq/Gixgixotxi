import React, { useEffect, useState } from 'react';
import {
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Palette,
  Wand2,
  Coins,
} from 'lucide-react';
import { KobanIcon, KobanChip } from '@/components/koban/KobanIcon';
import { useKobanStyle } from '@/contexts/KobanStyleContext';
import { useWallet } from '@/hooks/useWallet';
import {
  DEFAULT_KOBAN_STYLE,
  KOBAN_DESIGNS,
  KOBAN_PALETTE_PRESETS,
  isValidHex6,
  nudgeMainColorForReadability,
  getContrastRatio,
  type KobanDesignId,
  type KobanMotionMode,
  type KobanStyleSettings,
} from '@/lib/kobanStyle';

const MOTION_OPTIONS: Array<{ id: KobanMotionMode; label: string }> = [
  { id: 'off', label: 'Off' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'lively', label: 'Lively' },
];

function stylesEqual(a: KobanStyleSettings, b: KobanStyleSettings): boolean {
  return (
    a.design === b.design &&
    a.mainColor.toLowerCase() === b.mainColor.toLowerCase() &&
    a.accentColor.toLowerCase() === b.accentColor.toLowerCase() &&
    a.glowColor.toLowerCase() === b.glowColor.toLowerCase() &&
    a.glow === b.glow &&
    a.motion === b.motion &&
    a.sparkle === b.sparkle
  );
}

export interface KobanStyleCustomizerProps {
  compact?: boolean;
  onSaved?: () => void;
}

export const KobanStyleCustomizer: React.FC<KobanStyleCustomizerProps> = ({
  compact = false,
  onSaved,
}) => {
  const { style: savedStyle, saving, saveStyle } = useKobanStyle();
  const { balance: walletBalance } = useWallet();

  const [draft, setDraft] = useState<KobanStyleSettings>(() => ({ ...savedStyle }));
  const [nudgeNotice, setNudgeNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Collapsible groups state
  const [openGroups, setOpenGroups] = useState<{
    design: boolean;
    palette: boolean;
    effects: boolean;
  }>({
    design: true,
    palette: true,
    effects: true,
  });

  const toggleGroup = (key: 'design' | 'palette' | 'effects') => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync draft when server finishes loading savedStyle initially
  useEffect(() => {
    setDraft({ ...savedStyle });
  }, [savedStyle]);

  const hasUnsavedChanges = !stylesEqual(draft, savedStyle);
  const isAtDefault = stylesEqual(draft, DEFAULT_KOBAN_STYLE);

  const mainContrast = getContrastRatio(draft.mainColor, '#07070a');
  const isLowContrast = mainContrast < 2.6;

  const handleDesignSelect = (designId: KobanDesignId) => {
    setSavedNotice(false);
    setErrorMsg(null);
    setDraft((prev) => ({ ...prev, design: designId }));
  };

  const handlePresetSelect = (preset: (typeof KOBAN_PALETTE_PRESETS)[number]) => {
    setSavedNotice(false);
    setErrorMsg(null);
    setNudgeNotice(null);
    setDraft((prev) => ({
      ...prev,
      mainColor: preset.mainColor,
      accentColor: preset.accentColor,
      glowColor: preset.glowColor,
    }));
  };

  const handleMainColorChange = (rawHex: string) => {
    setSavedNotice(false);
    setErrorMsg(null);
    if (!isValidHex6(rawHex)) return;
    const { color, nudged } = nudgeMainColorForReadability(rawHex);
    if (nudged) {
      setNudgeNotice(
        'Main color was nudged slightly brighter so your Koban icon stays readable at 16px on dark backgrounds.'
      );
    } else {
      setNudgeNotice(null);
    }
    setDraft((prev) => ({ ...prev, mainColor: color }));
  };

  const handleAccentColorChange = (rawHex: string) => {
    setSavedNotice(false);
    setErrorMsg(null);
    if (!isValidHex6(rawHex)) return;
    setDraft((prev) => ({ ...prev, accentColor: rawHex.toLowerCase() }));
  };

  const handleGlowColorChange = (rawHex: string) => {
    setSavedNotice(false);
    setErrorMsg(null);
    if (!isValidHex6(rawHex)) return;
    setDraft((prev) => ({ ...prev, glowColor: rawHex.toLowerCase() }));
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSavedNotice(false);
    const res = await saveStyle(draft);
    if (!res.ok) {
      setErrorMsg(res.error || 'Could not save Koban style.');
      return;
    }
    setSavedNotice(true);
    onSaved?.();
    setTimeout(() => {
      setSavedNotice(false);
    }, 2800);
  };

  const handleResetToDefault = () => {
    setErrorMsg(null);
    setNudgeNotice(null);
    setSavedNotice(false);
    setDraft({ ...DEFAULT_KOBAN_STYLE });
  };

  const activePreset =
    KOBAN_PALETTE_PRESETS.find(
      (p) =>
        p.mainColor.toLowerCase() === draft.mainColor.toLowerCase() &&
        p.accentColor.toLowerCase() === draft.accentColor.toLowerCase() &&
        p.glowColor.toLowerCase() === draft.glowColor.toLowerCase()
    ) || null;
  const activePresetId = activePreset?.id || null;

  const activeDesignName =
    KOBAN_DESIGNS.find((d) => d.id === draft.design)?.name || 'Neon K Chip';

  return (
    <div id="koban-icon" className="space-y-4">
      {/* ─── TOP: PINNED LIVE PREVIEW (LARGE ANIMATED ICON + HEADER BALANCE CHIP) ─── */}
      <div className={compact ? '' : 'stg-sticky-preview'}>
        <div className="stg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-[#07070a] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                <KobanIcon
                  size={48}
                  styleOverride={draft}
                  animated={true}
                  ariaLabel="Kobans preview"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--menu-subtext)]">
                  Live Preview
                </div>
                <div className="text-sm font-bold text-[var(--menu-text)] truncate">
                  {activeDesignName}
                </div>
                <div className="text-xs text-[var(--menu-subtext)] truncate">
                  {activePreset ? activePreset.label : draft.mainColor.toUpperCase()} · {draft.glow}% glow
                </div>
              </div>
            </div>

            {/* Header Balance Chip Preview */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--menu-subtext)]">
                Header Chip
              </span>
              <div className="px-2.5 py-1.5 rounded-xl bg-[#07070a] border border-white/10 flex items-center">
                <KobanChip
                  balance={typeof walletBalance === 'number' ? walletBalance : 1250}
                  styleOverride={draft}
                  onClick={() => {}}
                  showPlus={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback / Error Notices */}
      {savedNotice && (
        <div
          role="status"
          className="rounded-2xl px-4 py-3 text-xs font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2"
        >
          <Check size={14} className="shrink-0" />
          <span>Saved! Your Koban icon style is now live across Boardly.</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-xs font-semibold text-[#D71921] dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── COLLAPSIBLE GROUP 1: ICON DESIGN ─────────────────────────────── */}
      <div className="stg-group !mt-1">
        <div className="stg-card">
          <button
            type="button"
            onClick={() => toggleGroup('design')}
            aria-expanded={openGroups.design}
            className="stg-row"
          >
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Coins className="w-4 h-4" />
              </span>
              <span className="stg-row-label font-semibold">Icon Design</span>
            </div>
            <div className="stg-row-right">
              <span className="stg-row-value">{activeDesignName}</span>
              {openGroups.design ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </div>
          </button>

          {openGroups.design && (
            <div className="divide-y divide-[var(--menu-divider)]">
              {KOBAN_DESIGNS.map((d) => {
                const isSelected = draft.design === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDesignSelect(d.id)}
                    aria-pressed={isSelected}
                    className="stg-row"
                  >
                    <div className="stg-row-left">
                      <div className="w-10 h-10 rounded-xl bg-[#07070a] border border-white/10 flex items-center justify-center shrink-0">
                        <KobanIcon
                          size={28}
                          styleOverride={{
                            ...draft,
                            design: d.id,
                          }}
                          animated={false}
                          decorative
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="stg-row-label font-medium">{d.name}</span>
                          {d.proOnly && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-300">
                              <Lock size={9} /> PRO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border shrink-0 ${
                        isSelected
                          ? 'bg-[#D71921] border-[#D71921] text-white'
                          : 'border-[var(--menu-divider)] text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="stg-footnote">
          Choose from 6 Koban coin silhouettes. Cosmetic only — applies everywhere across Boardly.
        </p>
      </div>

      {/* ─── COLLAPSIBLE GROUP 2: COLOR PALETTE ───────────────────────────── */}
      <div className="stg-group">
        <div className="stg-card">
          <button
            type="button"
            onClick={() => toggleGroup('palette')}
            aria-expanded={openGroups.palette}
            className="stg-row"
          >
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Palette className="w-4 h-4" />
              </span>
              <span className="stg-row-label font-semibold">Color Palette</span>
            </div>
            <div className="stg-row-right">
              <span className="stg-row-value">
                {activePreset ? activePreset.label : 'Custom'}
              </span>
              {openGroups.palette ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </div>
          </button>

          {openGroups.palette && (
            <div className="divide-y divide-[var(--menu-divider)]">
              {/* Palette Presets */}
              <div className="p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--menu-subtext)]">
                  Presets
                </div>
                <div className="flex flex-wrap gap-2">
                  {KOBAN_PALETTE_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`inline-flex items-center gap-2 min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#D71921] bg-[#D71921]/12 text-[var(--menu-text)]'
                            : 'border-[var(--menu-divider)] bg-[var(--menu-bg)] text-[var(--menu-subtext)] hover:text-[var(--menu-text)]'
                        }`}
                      >
                        <span className="inline-flex items-center -space-x-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/30"
                            style={{ backgroundColor: preset.mainColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/30"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                        </span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Color Row */}
              <label className="stg-row">
                <div className="stg-row-left">
                  <span className="stg-row-label">Main Color</span>
                </div>
                <div className="stg-row-right">
                  <span className="font-mono text-xs uppercase text-[var(--menu-subtext)]">
                    {draft.mainColor}
                  </span>
                  <input
                    type="color"
                    value={draft.mainColor}
                    onChange={(e) => handleMainColorChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-[var(--menu-divider)] bg-transparent cursor-pointer shrink-0"
                    aria-label="Main color"
                  />
                </div>
              </label>

              {/* Accent Color Row */}
              <label className="stg-row">
                <div className="stg-row-left">
                  <span className="stg-row-label">Accent Color</span>
                </div>
                <div className="stg-row-right">
                  <span className="font-mono text-xs uppercase text-[var(--menu-subtext)]">
                    {draft.accentColor}
                  </span>
                  <input
                    type="color"
                    value={draft.accentColor}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-[var(--menu-divider)] bg-transparent cursor-pointer shrink-0"
                    aria-label="Accent color"
                  />
                </div>
              </label>

              {/* Glow Color Row */}
              <label className="stg-row">
                <div className="stg-row-left">
                  <span className="stg-row-label">Glow Color</span>
                </div>
                <div className="stg-row-right">
                  <span className="font-mono text-xs uppercase text-[var(--menu-subtext)]">
                    {draft.glowColor}
                  </span>
                  <input
                    type="color"
                    value={draft.glowColor}
                    onChange={(e) => handleGlowColorChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-[var(--menu-divider)] bg-transparent cursor-pointer shrink-0"
                    aria-label="Glow color"
                  />
                </div>
              </label>
            </div>
          )}
        </div>
        {(nudgeNotice || isLowContrast) ? (
          <p className="stg-footnote !text-amber-600 dark:!text-amber-400">
            {nudgeNotice ||
              'Main color has low contrast on dark backgrounds. Pick a brighter shade so your 16px Koban icon stays crisp.'}
          </p>
        ) : (
          <p className="stg-footnote">
            Pick a one-tap preset or customize your main, accent, and outer glow colors.
          </p>
        )}
      </div>

      {/* ─── COLLAPSIBLE GROUP 3: GLOW, MOTION & SHINE ────────────────────── */}
      <div className="stg-group">
        <div className="stg-card">
          <button
            type="button"
            onClick={() => toggleGroup('effects')}
            aria-expanded={openGroups.effects}
            className="stg-row"
          >
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Wand2 className="w-4 h-4" />
              </span>
              <span className="stg-row-label font-semibold">Glow, Motion &amp; Shine</span>
            </div>
            <div className="stg-row-right">
              <span className="stg-row-value capitalize">
                {draft.glow}% · {draft.motion}
              </span>
              {openGroups.effects ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </div>
          </button>

          {openGroups.effects && (
            <div className="divide-y divide-[var(--menu-divider)]">
              {/* Glow Strength Row */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--menu-text)]">Glow Strength</span>
                  <span className="font-mono text-xs font-bold text-[var(--menu-subtext)]">
                    {draft.glow}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={draft.glow}
                  onChange={(e) => {
                    setSavedNotice(false);
                    setDraft((prev) => ({
                      ...prev,
                      glow: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))),
                    }));
                  }}
                  className="w-full accent-[#D71921] cursor-pointer"
                  aria-label="Glow strength"
                />
                <div className="flex justify-between text-[11px] font-mono text-[var(--menu-subtext)]">
                  <span>0% (Off)</span>
                  <span>50%</span>
                  <span>100% (Max)</span>
                </div>
              </div>

              {/* Motion Row */}
              <div className="stg-row stg-row--static">
                <div className="stg-row-left">
                  <span className="stg-row-label">Motion</span>
                </div>
                <div className="inline-flex items-center p-1 rounded-full bg-[var(--menu-bg)] border border-[var(--menu-divider)]">
                  {MOTION_OPTIONS.map((opt) => {
                    const active = draft.motion === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSavedNotice(false);
                          setDraft((prev) => ({ ...prev, motion: opt.id }));
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#D71921] text-white'
                            : 'text-[var(--menu-subtext)] hover:text-[var(--menu-text)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shine Sweep & Sparkles iOS Switch Row */}
              <div
                className="stg-row"
                onClick={() => {
                  setSavedNotice(false);
                  setDraft((prev) => ({ ...prev, sparkle: !prev.sparkle }));
                }}
              >
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </span>
                  <span className="stg-row-label">Shine Sweep &amp; Sparkles</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.sparkle}
                  aria-label="Shine Sweep and Sparkles"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSavedNotice(false);
                    setDraft((prev) => ({ ...prev, sparkle: !prev.sparkle }));
                  }}
                  className="stg-switch"
                >
                  <span className="stg-switch-thumb" />
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="stg-footnote">
          Control outer halo intensity, idle animation in the header chip, and metallic shine sweeps.
        </p>
      </div>

      {/* ─── ACTIONS: FLOATING BOTTOM BAR (OR INLINE WHEN COMPACT) ────────── */}
      <div className={compact ? 'flex items-center gap-2.5 pt-2' : 'stg-floating-bar'}>
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={saving || isAtDefault}
          className="stg-btn-secondary !w-auto min-w-[140px] !min-h-[44px] !py-2 !px-4"
        >
          <RotateCcw size={14} />
          <span>Reset to default</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className="stg-btn-primary flex-1 !min-h-[44px] !py-2 !px-5"
        >
          <Check size={15} />
          <span>{saving ? 'Saving…' : hasUnsavedChanges ? 'Save' : 'Saved'}</span>
        </button>
      </div>
    </div>
  );
};

export default KobanStyleCustomizer;

