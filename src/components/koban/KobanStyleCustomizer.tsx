import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, Sparkles, AlertTriangle, Lock } from 'lucide-react';
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

  const activePresetId =
    KOBAN_PALETTE_PRESETS.find(
      (p) =>
        p.mainColor.toLowerCase() === draft.mainColor.toLowerCase() &&
        p.accentColor.toLowerCase() === draft.accentColor.toLowerCase() &&
        p.glowColor.toLowerCase() === draft.glowColor.toLowerCase()
    )?.id || null;

  const activeMotionIdx = Math.max(
    0,
    MOTION_OPTIONS.findIndex((m) => m.id === draft.motion)
  );

  return (
    <div id="koban-icon" className="space-y-5">
      {/* ─── TOP: LIVE PREVIEW (LARGE ANIMATED ICON + HEADER BALANCE CHIP) ─── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Large Animated Preview */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-[#07070a] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
              <KobanIcon
                size={68}
                styleOverride={draft}
                animated={true}
                ariaLabel="Kobans preview"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                <span>Live Preview</span>
                <span>•</span>
                <span className="text-[var(--text)] font-bold">
                  {KOBAN_DESIGNS.find((d) => d.id === draft.design)?.name || 'Neon K Chip'}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs">
                Customize your Koban coin design, colors, glow, and motion. Cosmetic only — applies everywhere across Boardly.
              </p>
            </div>
          </div>

          {/* Header Balance Chip Preview */}
          <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Header Balance Chip
            </span>
            <div className="px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 flex items-center gap-3">
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

      {/* ─── DESIGN: HORIZONTAL 6-DESIGN SELECTOR ─────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            1. Icon Design
          </label>
          <span className="text-[11px] text-[var(--muted)]">6 designs</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {KOBAN_DESIGNS.map((d) => {
            const isSelected = draft.design === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDesignSelect(d.id)}
                className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--brand)] bg-[var(--brand)]/10 shadow-[0_0_20px_rgba(225,29,46,0.18)]'
                    : 'border-[var(--border)] bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-heavy)] hover:border-white/25'
                }`}
                aria-pressed={isSelected}
              >
                {d.proOnly && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300">
                    <Lock size={9} /> PRO
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl bg-[#07070a]/80 border border-white/10 flex items-center justify-center">
                  <KobanIcon
                    size={32}
                    styleOverride={{
                      ...draft,
                      design: d.id,
                    }}
                    animated={false}
                    decorative
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold text-center leading-tight ${
                    isSelected ? 'text-[var(--text)]' : 'text-[var(--muted)] group-hover:text-[var(--text)]'
                  }`}
                >
                  {d.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── COLORS: PALETTE PRESETS + CUSTOM PICKERS ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            2. Color Palette
          </label>
          {activePresetId && (
            <span className="text-[11px] font-mono text-[var(--muted)] capitalize">
              Preset: {activePresetId}
            </span>
          )}
        </div>

        {/* One-Tap Palette Presets */}
        <div className="flex flex-wrap gap-2">
          {KOBAN_PALETTE_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--text)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-glass)] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                }`}
              >
                <span className="inline-flex items-center -space-x-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/40"
                    style={{ backgroundColor: preset.mainColor }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/40"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                </span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers (Main, Accent, Glow) */}
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3'} gap-2.5 pt-1`}>
          {/* Main Color */}
          <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] cursor-pointer hover:border-white/25 transition-colors">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text)]">Main Color</div>
              <div className="text-[11px] font-mono text-[var(--muted)] uppercase">
                {draft.mainColor}
              </div>
            </div>
            <input
              type="color"
              value={draft.mainColor}
              onChange={(e) => handleMainColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer shrink-0"
              aria-label="Main color"
            />
          </label>

          {/* Accent Color */}
          <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] cursor-pointer hover:border-white/25 transition-colors">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text)]">Accent Color</div>
              <div className="text-[11px] font-mono text-[var(--muted)] uppercase">
                {draft.accentColor}
              </div>
            </div>
            <input
              type="color"
              value={draft.accentColor}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer shrink-0"
              aria-label="Accent color"
            />
          </label>

          {/* Glow Color */}
          <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] cursor-pointer hover:border-white/25 transition-colors">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text)]">Glow Color</div>
              <div className="text-[11px] font-mono text-[var(--muted)] uppercase">
                {draft.glowColor}
              </div>
            </div>
            <input
              type="color"
              value={draft.glowColor}
              onChange={(e) => handleGlowColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer shrink-0"
              aria-label="Glow color"
            />
          </label>
        </div>

        {(nudgeNotice || isLowContrast) && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              {nudgeNotice ||
                'Main color has low contrast on dark backgrounds. Pick a brighter shade so your 16px Koban icon stays crisp.'}
            </span>
          </div>
        )}
      </div>

      {/* ─── EFFECTS: GLOW STRENGTH SLIDER, MOTION SEGMENTED CONTROL, SPARKLE ─ */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] block">
          3. Glow, Motion &amp; Shine
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Glow Strength Slider (0 to 100) */}
          <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-glass)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text)]">Glow Strength</span>
              <span className="font-mono font-bold text-[var(--text)]">{draft.glow}%</span>
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
              className="w-full accent-[#e11d2e] cursor-pointer"
              aria-label="Glow strength"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
              <span>0% (Off)</span>
              <span>50%</span>
              <span>100% (Max)</span>
            </div>
          </div>

          {/* Motion 3-Way Sliding Segmented Control + Sparkle Toggle */}
          <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-glass)] flex flex-col justify-between gap-3">
            {/* Motion 3-way segmented control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text)]">Motion</span>
                <span className="text-[10px] text-[var(--muted)]">Header &amp; preview</span>
              </div>
              <div className="relative grid grid-cols-3 p-1 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)]">
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-[var(--brand)]/20 border border-[var(--brand)]/50 transition-all duration-200 pointer-events-none"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    transform: `translateX(${activeMotionIdx * 100}%)`,
                  }}
                />
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
                      className={`relative z-10 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        active ? 'text-[var(--text)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sparkle / Shine Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/60">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-[var(--text)]">
                  Shine Sweep &amp; Sparkles
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.sparkle}
                onClick={() => {
                  setSavedNotice(false);
                  setDraft((prev) => ({ ...prev, sparkle: !prev.sparkle }));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ${
                  draft.sparkle
                    ? 'bg-[#e11d2e] border-[#e11d2e]'
                    : 'bg-zinc-700/60 border-white/15'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    draft.sparkle ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ERROR MESSAGE ────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── ACTIONS: SAVE & RESET TO DEFAULT ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={saving || isAtDefault}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-heavy)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset to default</span>
        </button>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold"
            >
              <Check size={13} />
              <span>Saved</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {saving ? (
              <span>Saving…</span>
            ) : (
              <>
                <Check size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KobanStyleCustomizer;
