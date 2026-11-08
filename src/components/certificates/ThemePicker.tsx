import React, { useMemo, useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import {
  CERTIFICATE_THEME_LIST,
  generateDeterministicThemeForGrandLine,
  resolveCertificateTheme,
  type CertificateTheme,
} from '../../config/certificateThemes';
import { CertificateRenderer } from './CertificateRenderer';

export interface ThemePickerProps {
  grandLineId: string;
  grandLineTitle?: string;
  mockTitle?: string;
  value: string | null | undefined;
  onChange: (themeId: string | null) => void;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureDataUrl?: string | null;
  disabled?: boolean;
  compact?: boolean;
}

const SAMPLE_ISSUED_AT = new Date('2026-11-07T00:00:00Z').getTime();

/**
 * Reusable Certificate Design Picker for Grand Line Mocks.
 * - Renders a sticky large A4 landscape live preview right beside the 9 theme cards.
 * - Every theme option in the picker displays a real miniature scaled-down certificate thumbnail
 *   using sample data (Ayesha Rahman Khan, 1st Position, serial BDLY-GL01-0001, active signature).
 * - Clicking any of the 9 themes updates the big preview and checkmark immediately with zero reload.
 */
export const ThemePicker: React.FC<ThemePickerProps> = ({
  grandLineId,
  grandLineTitle,
  mockTitle,
  value,
  onChange,
  signatoryName = 'Boardly Examination Council',
  signatoryTitle = 'Founder, Boardly',
  signatureDataUrl = null,
  disabled = false,
  compact = false,
}) => {
  const resolvedGrandLineTitle = grandLineTitle || mockTitle || 'Boardly Grand Line Mock';
  // Local optimistic state ensures the big preview and checkmark update in 0ms on click
  // even while the parent persists `certificate_theme_id` asynchronously.
  const [selectedValue, setSelectedValue] = useState<string | null>(() => {
    if (value === undefined) return 'auto';
    if (value === null || value === 'auto') return 'auto';
    return value;
  });

  useEffect(() => {
    if (value === undefined) return;
    setSelectedValue(value === null || value === 'auto' ? 'auto' : value);
  }, [value]);

  const isAutoSelected = !selectedValue || selectedValue === 'auto';

  const autoTheme = useMemo(
    () =>
      generateDeterministicThemeForGrandLine(
        grandLineId || 'grand_line_preview',
        'Ayesha Rahman Khan'
      ),
    [grandLineId]
  );

  const activeTheme: CertificateTheme = useMemo(
    () =>
      isAutoSelected
        ? autoTheme
        : resolveCertificateTheme(
            grandLineId || 'grand_line_preview',
            selectedValue,
            'Ayesha Rahman Khan'
          ),
    [autoTheme, grandLineId, isAutoSelected, selectedValue]
  );

  const handleSelectTheme = (nextThemeId: string | null) => {
    const normalized = !nextThemeId || nextThemeId === 'auto' ? 'auto' : nextThemeId;
    setSelectedValue(normalized);
    onChange(normalized === 'auto' ? null : normalized);
  };

  return (
    <div
      className={
        compact
          ? 'space-y-5'
          : 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
      }
    >
      {/* Left / Sticky Big Live Certificate Preview */}
      <div
        className={
          compact
            ? 'space-y-3'
            : 'xl:col-span-7 xl:sticky xl:top-6 space-y-3'
        }
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              LIVE CERTIFICATE PREVIEW
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activeTheme.accentColor }}
              />
              <span>
                {isAutoSelected
                  ? `Auto (Unique per student) · ${activeTheme.label}`
                  : activeTheme.label}
              </span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            A4 LANDSCAPE · 1123×794 · {activeTheme.mode.toUpperCase()} · {activeTheme.motif.toUpperCase()}
          </span>
        </div>

        <CertificateRenderer
          key={`main-preview-${activeTheme.id}`}
          instanceId={`main_preview_${activeTheme.id}`}
          serial="BDLY-GL01-0001"
          studentName="Ayesha Rahman Khan"
          grandLineId={grandLineId || 'grand_line_preview'}
          grandLineTitle={resolvedGrandLineTitle}
          editionLabel="OFFICIAL GRAND LINE EDITION"
          rank={1}
          score={194}
          totalQuestions={200}
          percentage={97}
          participantsCount={428}
          issuedAt={SAMPLE_ISSUED_AT}
          themeId={activeTheme.id}
          theme={activeTheme}
          signatoryName={signatoryName}
          signatoryTitle={signatoryTitle}
          signatureDataUrl={signatureDataUrl}
        />

        {isAutoSelected ? (
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
            <Sparkles size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--text)]">
                Auto (Unique per student):{' '}
              </span>
              Showing a sample generated colour palette ({activeTheme.label}). When certificates are issued, each student gets a different deterministically generated Boardly palette and dot-matrix motif.
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-2 flex-wrap text-xs text-[var(--text-muted)]">
            <div>
              <span className="font-bold text-[var(--text)]">{activeTheme.label}: </span>
              <span>{activeTheme.description}</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text)]">
              SIGNATURE INK: {activeTheme.signatureInkColor}
            </span>
          </div>
        )}
      </div>

      {/* Right / Theme Picker Grid with Real Miniature Certificate Thumbnails (All 9 Themes) */}
      <div className={compact ? 'space-y-2.5' : 'xl:col-span-5 space-y-3'}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            CHOOSE CERTIFICATE DESIGN (9 THEMES)
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            CLICK TO PREVIEW &amp; APPLY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Auto (Unique per student) Option */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelectTheme('auto')}
            title="Auto (Unique per student) — Each student gets a different deterministically generated Boardly colour palette and dot-matrix motif"
            className={`group p-2.5 rounded-2xl border text-left transition-all duration-150 flex flex-col gap-2.5 cursor-pointer ${
              isAutoSelected
                ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--surface-2)] shadow-md'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
            } disabled:opacity-50`}
          >
            {/* Miniature Certificate Thumbnail */}
            <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] pointer-events-none">
              <CertificateRenderer
                instanceId={`thumb_auto_${grandLineId || 'default'}`}
                serial="BDLY-GL01-0001"
                studentName="Ayesha Rahman Khan"
                grandLineId={grandLineId || 'grand_line_preview'}
                grandLineTitle={resolvedGrandLineTitle}
                editionLabel="OFFICIAL GRAND LINE EDITION"
                rank={1}
                score={194}
                totalQuestions={200}
                percentage={97}
                participantsCount={428}
                issuedAt={SAMPLE_ISSUED_AT}
                themeId={autoTheme.id}
                theme={autoTheme}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
                signatureDataUrl={signatureDataUrl}
              />
              {isAutoSelected && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </div>

            <div className="space-y-1 px-0.5">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] leading-snug line-clamp-2">
                  <Sparkles size={13} className="text-[var(--accent)] shrink-0" />
                  <span>Auto (Unique per student)</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-snug line-clamp-2">
                Each student gets a different generated colour &amp; dot motif ({autoTheme.label})
              </p>
            </div>
          </button>

          {/* 2..9. All 8 Preset Themes */}
          {CERTIFICATE_THEME_LIST.map((theme) => {
            const selected = !isAutoSelected && selectedValue === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectTheme(theme.id)}
                title={`${theme.label} (${theme.id}) — ${theme.description}`}
                className={`group p-2.5 rounded-2xl border text-left transition-all duration-150 flex flex-col gap-2.5 cursor-pointer ${
                  selected
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--surface-2)] shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                } disabled:opacity-50`}
              >
                {/* Miniature Certificate Thumbnail */}
                <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] pointer-events-none">
                  <CertificateRenderer
                    instanceId={`thumb_${theme.id}`}
                    serial="BDLY-GL01-0001"
                    studentName="Ayesha Rahman Khan"
                    grandLineId={grandLineId || 'grand_line_preview'}
                    grandLineTitle={resolvedGrandLineTitle}
                    editionLabel="OFFICIAL GRAND LINE EDITION"
                    rank={1}
                    score={194}
                    totalQuestions={200}
                    percentage={97}
                    participantsCount={428}
                    issuedAt={SAMPLE_ISSUED_AT}
                    themeId={theme.id}
                    theme={theme}
                    signatoryName={signatoryName}
                    signatoryTitle={signatoryTitle}
                    signatureDataUrl={signatureDataUrl}
                  />
                  {selected && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="space-y-1 px-0.5">
                  <div className="text-xs font-bold text-[var(--text)] leading-snug line-clamp-2">
                    {theme.label}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] leading-snug">
                    {theme.id} · {theme.mode.toUpperCase()} · {theme.motif}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
