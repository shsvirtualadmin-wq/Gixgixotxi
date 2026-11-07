import React, { useMemo } from 'react';
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
  value: string | null | undefined;
  onChange: (themeId: string | null) => void;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureDataUrl?: string | null;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Reusable Certificate Design Picker for Grand Line Mocks.
 * Shows an "Auto (Unique per Mock)" option plus all configured themes in CERTIFICATE_THEMES,
 * along with a live interactive A4 landscape preview.
 */
export const ThemePicker: React.FC<ThemePickerProps> = ({
  grandLineId,
  grandLineTitle = 'Boardly Grand Line Mock',
  value,
  onChange,
  signatoryName = 'Boardly Examination Council',
  signatoryTitle = 'Founder, Boardly',
  signatureDataUrl = null,
  disabled = false,
  compact = false,
}) => {
  const isAutoSelected = !value || value === 'auto';

  const autoTheme = useMemo(
    () => generateDeterministicThemeForGrandLine(grandLineId || 'grand_line_preview'),
    [grandLineId]
  );

  const activeTheme: CertificateTheme = useMemo(
    () =>
      isAutoSelected
        ? autoTheme
        : resolveCertificateTheme(grandLineId || 'grand_line_preview', value),
    [autoTheme, grandLineId, isAutoSelected, value]
  );

  return (
    <div className="space-y-4">
      {/* Live Preview Header & Stage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              LIVE CERTIFICATE PREVIEW
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
              {isAutoSelected ? `AUTO · ${autoTheme.label}` : activeTheme.label}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            A4 LANDSCAPE · 1123×794 · {activeTheme.motif.toUpperCase()}
          </span>
        </div>

        <div className={compact ? 'max-w-md' : 'max-w-2xl'}>
          <CertificateRenderer
            serial="BDLY-GL01-0001"
            studentName="Ayesha Rahman Khan"
            grandLineId={grandLineId || 'grand_line_preview'}
            grandLineTitle={grandLineTitle || 'Boardly Grand Line Mock'}
            editionLabel="OFFICIAL GRAND LINE EDITION"
            rank={1}
            score={194}
            totalQuestions={200}
            percentage={97}
            participantsCount={428}
            issuedAt={Date.now()}
            themeId={isAutoSelected ? null : value}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
            signatureDataUrl={signatureDataUrl}
          />
        </div>
      </div>

      {/* Theme Options Grid ("Auto" + all CERTIFICATE_THEMES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Auto Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={`min-h-[56px] p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
            isAutoSelected
              ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-sm'
              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg border shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: autoTheme.backgroundColor,
                borderColor: autoTheme.glassBorderColor,
              }}
            >
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: autoTheme.accentColor }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] truncate">
                <Sparkles size={12} className="text-[var(--accent)] shrink-0" />
                <span className="truncate">Auto (Unique per Mock)</span>
              </div>
              <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">
                {autoTheme.label} · {autoTheme.motif}
              </div>
            </div>
          </div>
          {isAutoSelected && (
            <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
              <Check size={12} />
            </span>
          )}
        </button>

        {/* Preset Themes */}
        {CERTIFICATE_THEME_LIST.map((theme) => {
          const selected = !isAutoSelected && value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(theme.id)}
              className={`min-h-[56px] p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                selected
                  ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg border shrink-0 flex items-center justify-center gap-1 relative overflow-hidden"
                  style={{
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.glassBorderColor,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.secondaryAccentColor }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text)] truncate">
                    {theme.label}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">
                    {theme.id} · {theme.mode.toUpperCase()} · {theme.motif}
                  </div>
                </div>
              </div>
              {selected && (
                <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                  <Check size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemePicker;
